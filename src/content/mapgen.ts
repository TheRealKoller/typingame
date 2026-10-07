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

/** Whether the rectangle centred on (x, y) with half sizes `hx`, `hy` touches the path drawn at `scale`. */
export function touchesPath(path: readonly Point[], x: number, y: number, hx: number, hy: number, scale = 1): boolean {
  const half = LAYOUT.pathHalf * scale;
  return path.slice(1).some((to, i) => {
    const from = path[i]!;
    return (
      x + hx >= Math.min(from.x, to.x) - half &&
      x - hx <= Math.max(from.x, to.x) + half &&
      y + hy >= Math.min(from.y, to.y) - half &&
      y - hy <= Math.max(from.y, to.y) + half
    );
  });
}

/** Distance from (x, y) to the middle line of the path. */
export function distanceToPath(path: readonly Point[], x: number, y: number): number {
  return Math.min(
    ...path.slice(1).map((to, i) => {
      const from = path[i]!;
      const cx = Math.max(Math.min(from.x, to.x), Math.min(x, Math.max(from.x, to.x)));
      const cy = Math.max(Math.min(from.y, to.y), Math.min(y, Math.max(from.y, to.y)));
      return Math.hypot(x - cx, y - cy);
    }),
  );
}

/**
 * Whether a build site at (x, y) fits on a map drawn at `scale`: pad and word
 * off the path and the ward circle, the pad above the desk, the word on screen.
 */
export function siteFits(path: readonly Point[], x: number, y: number, scale = 1): boolean {
  const { label, deskTop, width, wardRadius } = LAYOUT;
  const siteHalf = LAYOUT.siteHalf * scale;
  const end = path[path.length - 1]!;
  const labelY = y - label.above;
  return (
    !touchesPath(path, x, y, siteHalf, siteHalf, scale) &&
    !touchesPath(path, x, labelY, label.halfWidth, label.halfHeight, scale) &&
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

/** Share of the path within reach of a typical tower at (x, y) on a map drawn at `scale`. */
export function coverage(path: readonly Point[], x: number, y: number, scale = 1): number {
  const points = samples(path);
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

/** Sites lie close enough to the path for a tower to reach it, and apart from each other (at scale 1). */
const SITE_REACH = 110;
const SITE_SPACING = 150;
const GRID = 10;
/** A turn of the path moves it at least this far up or down (at scale 1). */
const MIN_TURN = 130;
/** The best-covering spots (this share of all) are bends: inside a curve or between two runs of the path. */
const BEND_SHARE = 0.12;

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

interface Spot extends Point {
  readonly coverage: number;
  /** Where along the path the spot lies, 0 at the start, 1 at the ward. */
  readonly along: number;
}

/**
 * `SITE_COUNT` sites, each reaching at least `MIN_COVERAGE` of the path: one near the ward circle, two of the
 * best-covering spots (bends), then at least two in each third of the path, the rest anywhere. Within each rule the
 * pick is random, weighted by coverage, so maps differ but always offer strong and plainer sites.
 */
function placeSites(random: Random, path: readonly Point[], scale: number): BuildSite[] | null {
  const points = samples(path);
  const range = SITE_RANGE * scale;
  const spots: Spot[] = [];
  for (let y = GRID; y < LAYOUT.deskTop; y += GRID) {
    for (let x = GRID; x < LAYOUT.width; x += GRID) {
      if (!siteFits(path, x, y, scale) || distanceToPath(path, x, y) > SITE_REACH * scale) continue;
      let inRange = 0;
      let closest = 0;
      points.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d <= range) inRange++;
        if (d < Math.hypot(points[closest]!.x - x, points[closest]!.y - y)) closest = i;
      });
      const share = inRange / points.length;
      if (share >= MIN_COVERAGE) spots.push({ x, y, coverage: share, along: closest / (points.length - 1) });
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

/** Trees and rocks where they leave path, sites and words free; sizes at scale 1. */
function placeScenery(random: Random, path: readonly Point[], sites: readonly BuildSite[], scale: number): Prop[] {
  const props: Prop[] = [];
  for (let tries = 0; tries < 400 && props.length < 12; tries++) {
    const x = Math.round(between(random, 30, LAYOUT.width - 30));
    const y = Math.round(between(random, 40, LAYOUT.deskTop - 10));
    // The prop stands on (x, y) and is about 64 px tall.
    const free =
      !touchesPath(path, x, y - 28 * scale, 30 * scale, 30 * scale, scale) &&
      sites.every((site) => Math.abs(site.x - x) > 90 || y < site.y - 110 || y > site.y + 90) &&
      props.every((other) => Math.hypot(other.x - x, other.y - (y - 32 * scale)) > 70 * scale) &&
      Math.hypot(x - path[path.length - 1]!.x, y - path[path.length - 1]!.y) > 90;
    if (!free) continue;
    const tree = random() < 0.65;
    // Props are placed by their centre, half their height above the ground.
    props.push({ kind: tree ? 'tree' : 'rock', variant: Math.floor(random() * (tree ? 4 : 2)), x, y: y - 32 * scale });
  }
  return props;
}

/** A fresh outdoor map of the ash fields at `MAP_SCALE`: grass under soot, a sand path, burnt trees and rocks. */
export function generateAshMap(random: Random, id: string, name: string): BattleMap {
  const scale = MAP_SCALE;
  const top = Math.round(110 * scale);
  const bottom = Math.round(LAYOUT.deskTop - 70 * scale);
  for (;;) {
    const path = generatePath(random, scale, top, bottom);
    const sites = placeSites(random, path, scale);
    if (sites) return { id, name, indoor: false, ash: true, scale, path, sites, props: placeScenery(random, path, sites, scale) };
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
 * typed words break. They all leave less ink than in the library.
 */
export function generateWaves(random: Random, difficulty: number, foes: Foes): Wave[] {
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
    waves.push(squads);
  }
  return waves;
}
