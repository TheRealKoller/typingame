import type { BuildSite, EnemyKind, Squad, Wave } from '../battle/level';
import type { Point } from '../battle/path';
import { MAP_SCALE, stronger, type BattleMap, type Prop } from './library';

/** A number in [0, 1); `Math.random` in the game, a seeded one in tests. */
export type Random = () => number;

/** Mulberry32: a small seeded generator, so a test can repeat a map. */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where things may stand on a battle map (1280 × 720 screen, desk from y 470); sizes at map scale 1. */
export const LAYOUT = {
  width: 1280,
  deskTop: 470,
  /** Half the width of the path. */
  pathHalf: 32,
  /** Half the size of a build site's pad. */
  siteHalf: 28,
  /** Word labels sit this far above a site and are about this wide and tall; words keep their size at any scale. */
  label: { above: 52, halfWidth: 60, halfHeight: 18 },
  /** The ward circle at the end of the path; it carries text and keeps its size at any scale. */
  wardRadius: 46,
  /** The back wall of indoor maps covers the screen above this line. */
  wallBottom: 96,
} as const;

/** Build sites of a battle map. */
export const SITE_COUNT = 7;
/** Reach of a typical tower at scale 1 (Pfeil 170, Gift 160, Frost 150), for judging sites. */
export const SITE_RANGE = 160;
/** Share of the path a tower on any site reaches: no site is a bad one. */
export const MIN_COVERAGE = 0.1;

/** Whether the rectangle centred on (x, y) with half sizes `hx`, `hy` touches any of the paths drawn at `scale`. */
export function touchesPath(paths: readonly (readonly Point[])[], x: number, y: number, hx: number, hy: number, scale = 1): boolean {
  const half = LAYOUT.pathHalf * scale;
  return paths.some((path) =>
    path.slice(1).some((to, i) => {
      const from = path[i]!;
      return (
        x + hx >= Math.min(from.x, to.x) - half &&
        x - hx <= Math.max(from.x, to.x) + half &&
        y + hy >= Math.min(from.y, to.y) - half &&
        y - hy <= Math.max(from.y, to.y) + half
      );
    }),
  );
}

/** Distance from (x, y) to the middle line of the nearest path. */
export function distanceToPath(paths: readonly (readonly Point[])[], x: number, y: number): number {
  return Math.min(
    ...paths.flatMap((path) =>
      path.slice(1).map((to, i) => {
        const from = path[i]!;
        const cx = Math.max(Math.min(from.x, to.x), Math.min(x, Math.max(from.x, to.x)));
        const cy = Math.max(Math.min(from.y, to.y), Math.min(y, Math.max(from.y, to.y)));
        return Math.hypot(x - cx, y - cy);
      }),
    ),
  );
}

/**
 * Whether a build site at (x, y) fits on a map drawn at `scale`: pad and word
 * off the paths and the ward circle, the pad above the desk, the word on screen.
 */
export function siteFits(paths: readonly (readonly Point[])[], x: number, y: number, scale = 1): boolean {
  const { label, deskTop, width, wardRadius } = LAYOUT;
  const siteHalf = LAYOUT.siteHalf * scale;
  const main = paths[0]!;
  const end = main[main.length - 1]!;
  const labelY = y - label.above;
  return (
    !touchesPath(paths, x, y, siteHalf, siteHalf, scale) &&
    !touchesPath(paths, x, labelY, label.halfWidth, label.halfHeight, scale) &&
    y + siteHalf < deskTop &&
    labelY - label.halfHeight > 0 &&
    x - label.halfWidth > 0 &&
    x + label.halfWidth < width &&
    Math.hypot(x - end.x, y - end.y) > wardRadius + siteHalf &&
    Math.hypot(x - end.x, labelY - end.y) > wardRadius + label.halfHeight
  );
}

/** Points every 8 px along the path, so lengths near a spot can be counted. */
function samples(path: readonly Point[]): Point[] {
  const out: Point[] = [];
  path.slice(1).forEach((to, i) => {
    const from = path[i]!;
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    for (let d = 0; d < length; d += 8) out.push({ x: from.x + ((to.x - from.x) * d) / length, y: from.y + ((to.y - from.y) * d) / length });
  });
  out.push(path[path.length - 1]!);
  return out;
}

/** Points every 8 px along all paths; where a path runs on the main one, the stretch counts once. */
function mapSamples(paths: readonly (readonly Point[])[]): Point[] {
  const main = samples(paths[0]!);
  const own = paths.slice(1).flatMap((path) => samples(path).filter((p) => main.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > 4)));
  return [...main, ...own];
}

/** Share of all paths within reach of a typical tower at (x, y) on a map drawn at `scale`. */
export function coverage(paths: readonly (readonly Point[])[], x: number, y: number, scale = 1): number {
  const points = mapSamples(paths);
  return points.filter((p) => Math.hypot(p.x - x, p.y - y) <= SITE_RANGE * scale).length / points.length;
}

/**
 * Where along the path the point nearest to (x, y) lies, 0 at the start and 1 at the ward circle. Between two
 * stretches of the path the earlier one counts, as in `placeSites`.
 */
export function alongPath(path: readonly Point[], x: number, y: number): number {
  const points = samples(path);
  let closest = 0;
  points.forEach((p, i) => {
    if (Math.hypot(p.x - x, p.y - y) < Math.hypot(points[closest]!.x - x, points[closest]!.y - y)) closest = i;
  });
  return closest / (points.length - 1);
}

/** Sites lie close enough to a path for a tower to reach it, and apart from each other (at scale 1). */
const SITE_REACH = 110;
const SITE_SPACING = 150;
const GRID = 10;
/** A turn of the path moves it at least this far up or down (at scale 1). */
const MIN_TURN = 130;
/** The best-covering spots (this share of all) are bends: inside a curve, between two runs or where paths join. */
const BEND_SHARE = 0.12;
/** Most entrances of a generated map: the main one on the left, one from the top, one from the bottom. */
export const MAX_PATHS = 3;

function between(random: Random, low: number, high: number): number {
  return low + random() * (high - low);
}

/** A path from the left edge to the ward circle near the right: straight runs that turn up or down. */
function generatePath(random: Random, scale: number, top: number, bottom: number): Point[] {
  const turn = MIN_TURN * scale;
  let y = Math.round(between(random, top, bottom));
  const path: Point[] = [{ x: -40, y }];
  let x = Math.round(between(random, 120, 240) * scale);
  while (x < LAYOUT.width - 300 * scale) {
    path.push({ x, y });
    // Turn up or down by at least `turn`, whichever way has room.
    const up = Math.max(y - turn - top, 0);
    const down = Math.max(bottom - (y + turn), 0);
    const pick = random() * (up + down);
    y = Math.round(pick < up ? top + pick : y + turn + (pick - up));
    path.push({ x, y });
    x += Math.round(between(random, 200, 320) * scale);
  }
  path.push({ x: pathEnd(scale), y });
  return path;
}

/** Where a generated path ends: the ward circle, a little before the right edge. */
export function pathEnd(scale: number): number {
  return Math.round(LAYOUT.width - 130 * scale);
}

/**
 * Another entrance, from the top or the bottom edge, that joins the main path on one of its straight runs in the
 * middle of the map. Returns the whole way of its enemies (the branch, then the main path from the joint), or null
 * if the branch would come too close to the main path or to `others` before the joint.
 */
function branchPath(random: Random, main: readonly Point[], side: 'top' | 'bottom', others: readonly (readonly Point[])[], scale: number): Point[] | null {
  const runs = main.slice(1).flatMap((to, i) => (main[i]!.y === to.y && to.x - main[i]!.x > 160 * scale ? [i] : []));
  const middle = runs.filter((i) => main[i]!.x > LAYOUT.width * 0.25 && main[i]!.x < LAYOUT.width * 0.75);
  const run = middle[Math.floor(random() * middle.length)];
  if (run === undefined) return null;
  const from = main[run]!;
  const joint = { x: Math.round(between(random, from.x + 60 * scale, main[run + 1]!.x - 60 * scale)), y: from.y };
  // From the edge left of the joint towards the joint's height, then right and onto the joint if there is room.
  const turn = MIN_TURN * scale;
  const edge = side === 'top' ? -40 : LAYOUT.deskTop + 40;
  const room = side === 'top' ? joint.y - 60 * scale : LAYOUT.deskTop - 60 * scale - joint.y;
  const startX = Math.round(joint.x - between(random, 150, 260) * scale);
  const bend = Math.round(between(random, turn, Math.max(room, turn + 10)));
  const bendY = side === 'top' ? joint.y - bend : joint.y + bend;
  const branch = room >= turn ? [{ x: startX, y: edge }, { x: startX, y: bendY }, { x: joint.x, y: bendY }, joint] : [{ x: joint.x, y: edge }, joint];
  // Near the joint the branch meets the main path by design; only the stretch before it must keep clear.
  const half = LAYOUT.pathHalf * scale;
  const own = samples(branch).filter((p) => Math.hypot(p.x - joint.x, p.y - joint.y) > 2 * half + 60 * scale);
  const taken = [main, ...others].flatMap(samples);
  if (own.some((p) => taken.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 2 * half + 30 * scale))) return null;
  return [...branch, ...main.slice(run + 1)];
}

interface Spot extends Point {
  readonly coverage: number;
  /** Where along the main path the spot lies, 0 at the start, 1 at the ward. */
  readonly along: number;
}

/**
 * `SITE_COUNT` sites, each reaching at least `MIN_COVERAGE` of all paths: one near the ward circle, two of the
 * best-covering spots (bends, joints), then at least two in each third of the main path, the rest anywhere. Within
 * each rule the pick is random, weighted by coverage, so maps differ but always offer strong and plainer sites.
 */
function placeSites(random: Random, paths: readonly (readonly Point[])[], scale: number): BuildSite[] | null {
  const points = mapSamples(paths);
  const main = samples(paths[0]!);
  const range = SITE_RANGE * scale;
  const spots: Spot[] = [];
  for (let y = GRID; y < LAYOUT.deskTop; y += GRID) {
    for (let x = GRID; x < LAYOUT.width; x += GRID) {
      if (!siteFits(paths, x, y, scale) || distanceToPath(paths, x, y) > SITE_REACH * scale) continue;
      const share = points.filter((p) => Math.hypot(p.x - x, p.y - y) <= range).length / points.length;
      if (share < MIN_COVERAGE) continue;
      let closest = 0;
      main.forEach((p, i) => {
        if (Math.hypot(p.x - x, p.y - y) < Math.hypot(main[closest]!.x - x, main[closest]!.y - y)) closest = i;
      });
      spots.push({ x, y, coverage: share, along: closest / (main.length - 1) });
    }
  }
  if (spots.length === 0) return null;
  const best = Math.max(...spots.map((spot) => spot.coverage));
  const bend = [...spots].sort((a, b) => b.coverage - a.coverage)[Math.floor(spots.length * BEND_SHARE)]!.coverage;
  const third = (spot: Spot) => Math.min(Math.floor(spot.along * 3), 2);
  const chosen: Spot[] = [];
  const pick = (fits: (spot: Spot) => boolean, power: number): boolean => {
    const open = spots.filter((spot) => fits(spot) && chosen.every((other) => Math.hypot(spot.x - other.x, spot.y - other.y) >= SITE_SPACING * scale));
    if (open.length === 0) return false;
    const weights = open.map((spot) => (spot.coverage / best) ** power);
    let left = random() * weights.reduce((a, b) => a + b, 0);
    chosen.push(open.find((_, i) => (left -= weights[i]!) <= 0) ?? open[open.length - 1]!);
    return true;
  };
  if (!pick((spot) => spot.along > 0.85, 1)) return null;
  for (let i = 0; i < 2; i++) if (!pick((spot) => spot.coverage >= bend, 2)) return null;
  for (let t = 0; t < 3; t++) {
    while (chosen.filter((spot) => third(spot) === t).length < 2) if (!pick((spot) => third(spot) === t, 1)) return null;
  }
  while (chosen.length < SITE_COUNT) if (!pick(() => true, 1)) return null;
  chosen.sort((a, b) => a.x - b.x);
  return chosen.map((spot, i) => ({ id: String.fromCharCode(97 + i), x: spot.x, y: spot.y }));
}

/** Trees and rocks where they leave paths, sites and words free; sizes at scale 1. */
function placeScenery(random: Random, paths: readonly (readonly Point[])[], sites: readonly BuildSite[], scale: number): Prop[] {
  const props: Prop[] = [];
  const main = paths[0]!;
  const end = main[main.length - 1]!;
  for (let tries = 0; tries < 400 && props.length < 12; tries++) {
    const x = Math.round(between(random, 30, LAYOUT.width - 30));
    const y = Math.round(between(random, 40, LAYOUT.deskTop - 10));
    // The prop stands on (x, y) and is about 64 px tall.
    const free =
      !touchesPath(paths, x, y - 28 * scale, 30 * scale, 30 * scale, scale) &&
      sites.every((site) => Math.abs(site.x - x) > 90 || y < site.y - 110 || y > site.y + 90) &&
      props.every((other) => Math.hypot(other.x - x, other.y - (y - 32 * scale)) > 70 * scale) &&
      Math.hypot(x - end.x, y - end.y) > 90;
    if (!free) continue;
    const tree = random() < 0.65;
    // Props are placed by their centre, half their height above the ground.
    props.push({ kind: tree ? 'tree' : 'rock', variant: Math.floor(random() * (tree ? 4 : 2)), x, y: y - 32 * scale });
  }
  return props;
}

/**
 * A fresh outdoor map of the ash fields at `MAP_SCALE` with `entrances` ways in (1 to `MAX_PATHS`): grass under
 * soot, sand paths, burnt trees and rocks. The second entrance comes from the top, the third from the bottom.
 */
export function generateAshMap(random: Random, id: string, name: string, entrances = 1): BattleMap {
  if (entrances < 1 || entrances > MAX_PATHS) throw new Error(`${id}: ${entrances} paths, at most ${MAX_PATHS}`);
  const scale = MAP_SCALE;
  const top = Math.round(110 * scale);
  const bottom = Math.round(LAYOUT.deskTop - 70 * scale);
  for (;;) {
    const paths = [generatePath(random, scale, top, bottom)];
    for (const side of (['top', 'bottom'] as const).slice(0, entrances - 1)) {
      const branch = branchPath(random, paths[0]!, side, paths.slice(1), scale);
      if (!branch) break;
      paths.push(branch);
    }
    if (paths.length < entrances) continue;
    const sites = placeSites(random, paths, scale);
    if (sites) return { id, name, indoor: false, ash: true, scale, paths, sites, props: placeScenery(random, paths, sites, scale) };
  }
}

/** Enemies a generated level sends: small, fast ones that may carry words, and big, slow ones. */
export interface Foes {
  readonly small: EnemyKind;
  readonly large: EnemyKind;
  /** Fast and frail, they come in a swarm. */
  readonly swift: EnemyKind;
  /** Shelled against towers; they always glow and fall only to typed words. */
  readonly armored: EnemyKind;
}

/** Swarms of swift enemies come from this difficulty on; armored ones from `MARKED_FROM`, since they carry words. */
export const SWIFT_FROM = 2;

/** Enemies carry words only from this difficulty on; the first places are about building. */
export const MARKED_FROM = 3;
/** On the journey defeated enemies leave less ink than in the library, so towers stay scarce. */
const INK_SHARE = 0.6;

function leaner(kind: EnemyKind): EnemyKind {
  return { ...kind, ink: Math.round(kind.ink * INK_SHARE) };
}

/** How many waves a battle of `difficulty` (1 for the first place, higher further on) has. */
export function waveCount(difficulty: number): number {
  return 1 + Math.ceil((difficulty + 1) / 2);
}

/**
 * Waves for a battle of `difficulty`: more and tougher enemies from wave to
 * wave and from place to place. Large ones join from the second place on, in
 * later waves together with the small ones; every other wave brings a swarm of
 * swift ones from `SWIFT_FROM` on. From `MARKED_FROM` on every third small one
 * glows and carries a word, and the last wave brings armored ones that only
 * typed words break. They all leave less ink than in the library. On a map
 * with `paths` entrances the squads of a wave take them in turn, each wave
 * starting one further, so every entrance sees its share.
 */
export function generateWaves(random: Random, difficulty: number, foes: Foes, paths = 1): Wave[] {
  const waves: Wave[] = [];
  const count = waveCount(difficulty);
  for (let i = 0; i < count; i++) {
    const factor = 1.4 + 0.07 * (difficulty - 1) + 0.15 * i;
    const tougher = (kind: EnemyKind) => leaner(stronger(kind, factor));
    const small: Squad = {
      kind: tougher(foes.small),
      count: 4 + difficulty + 2 * i + Math.floor(random() * 2),
      spacingMs: Math.max(900, 1700 - 120 * difficulty - 80 * i),
      ...(difficulty >= MARKED_FROM ? { markEvery: 3 } : {}),
    };
    const squads: Squad[] = [small];
    const largeCount = Math.min(i, difficulty - 1, 2);
    if (largeCount > 0) {
      const large: Squad = { kind: tougher(foes.large), count: largeCount, spacingMs: 2600, delayMs: 1500 + Math.floor(random() * 1500) };
      // A large squad comes alone now and then; in the last wave always with the small ones.
      if (i === count - 1 || random() < 0.5) squads.push(large);
      else squads.splice(0, 1, large);
    }
    if (difficulty >= SWIFT_FROM && i % 2 === 1) {
      squads.push({ kind: tougher(foes.swift), count: 1 + difficulty, spacingMs: 600, delayMs: 2500 + Math.floor(random() * 2000) });
    }
    if (difficulty >= MARKED_FROM && i === count - 1) {
      squads.push({ kind: leaner(foes.armored), count: difficulty - MARKED_FROM + 1, spacingMs: 3000, delayMs: 4000, markEvery: 1 });
    }
    waves.push(paths > 1 ? squads.map((squad, s) => ({ ...squad, path: (i + s) % paths })) : squads);
  }
  return waves;
}
