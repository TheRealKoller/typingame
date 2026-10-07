/// <reference types="vite/client" />
// Probe for issue #146: where build sites go, and how far the battle map can zoom out.
// `?massstab=0.8` draws the world smaller (paths, sites, towers, enemies, ranges); words keep their size.
// `?wege=2` adds a second entrance that joins the first path (#147, only to look at: no battle logic).
// Seven build sites are chosen by how much path a tower there reaches (coverage), see `chooseSites`.
import Phaser from 'phaser';
import { LAYOUT, seededRandom } from '../../src/content/mapgen';
import { WORDS } from '../../src/content/words';
import type { Point } from '../../src/battle/path';

const params = new URLSearchParams(location.search);
const SCALE = Number(params.get('massstab') ?? 1);
const PATHS = Number(params.get('wege') ?? 1);
const SEED = Number(params.get('seed') ?? Math.floor(Math.random() * 1e6));

/** Screen size of the map; the world behind it is larger by 1 / SCALE. */
const SCREEN = { width: LAYOUT.width, height: LAYOUT.deskTop };
const WORLD = { width: SCREEN.width / SCALE, height: SCREEN.height / SCALE };
const { pathHalf: PATH_HALF, siteHalf: SITE_HALF, wardRadius: WARD_RADIUS } = LAYOUT;
/** Range of a typical tower (Pfeil 170, Gift 160, Frost 150). */
const RANGE = 160;
const SITES = 7;
const SITE_REACH = 110;
const SITE_SPACING = 150;
const MIN_TURN = 130;
const GRID = 10;
/** Words keep their screen size, so in the world they grow as the map zooms out. */
const LABEL = { above: SITE_HALF + 26 / SCALE, halfWidth: 60 / SCALE, halfHeight: 18 / SCALE };

const art = import.meta.glob('../135-art-style/demo8/*.png', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;
const file = (name: string) => art[`../135-art-style/demo8/${name}.png`]!;

type Random = () => number;
const between = (random: Random, low: number, high: number) => low + random() * (high - low);

/** Like `generatePath` in mapgen.ts, for a world of any size: straight runs that turn up or down. */
function mainPath(random: Random): Point[] {
  const top = 110;
  const bottom = WORLD.height - 70;
  let y = Math.round(between(random, top, bottom));
  const path: Point[] = [{ x: -40, y }];
  let x = Math.round(between(random, 120, 240));
  while (x < WORLD.width - 300) {
    path.push({ x, y });
    const up = Math.max(y - MIN_TURN - top, 0);
    const down = Math.max(bottom - (y + MIN_TURN), 0);
    const pick = random() * (up + down);
    y = Math.round(pick < up ? top + pick : y + MIN_TURN + (pick - up));
    path.push({ x, y });
    x += Math.round(between(random, 200, 320));
  }
  path.push({ x: WORLD.width - 130, y });
  return path;
}

/** Points every `step` px along a polyline. */
function samples(path: readonly Point[], step = 8): Point[] {
  const out: Point[] = [];
  path.slice(1).forEach((to, i) => {
    const from = path[i]!;
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    for (let d = 0; d < length; d += step) out.push({ x: from.x + ((to.x - from.x) * d) / length, y: from.y + ((to.y - from.y) * d) / length });
  });
  out.push(path[path.length - 1]!);
  return out;
}

const nearest = (points: readonly Point[], x: number, y: number) => Math.min(...points.map((p) => Math.hypot(p.x - x, p.y - y)));

/**
 * A second entrance from the top edge that joins the main path on one of its horizontal runs in the middle third.
 * Returns the whole route of an enemy taking it (the branch, then the main path from the joint), or null if the
 * branch would come too close to the main path before the joint.
 */
function branchPath(random: Random, main: readonly Point[]): Point[] | null {
  const runs = main.slice(1).flatMap((to, i) => (main[i]!.y === to.y && to.x - main[i]!.x > 160 ? [i] : []));
  const middle = runs.filter((i) => main[i]!.x > WORLD.width * 0.3 && main[i]!.x < WORLD.width * 0.7);
  const run = middle[Math.floor(random() * middle.length)];
  if (run === undefined) return null;
  const from = main[run]!;
  const joint = { x: Math.round(between(random, from.x + 60, main[run + 1]!.x - 60)), y: from.y };
  // From the top edge left of the joint, down, then right and down onto the joint, if it lies low enough.
  const startX = Math.round(joint.x - between(random, 150, 260));
  const bendY = Math.round(between(random, 60, Math.max(joint.y - MIN_TURN, 70)));
  const branch = joint.y - bendY >= MIN_TURN ? [{ x: startX, y: -40 }, { x: startX, y: bendY }, { x: joint.x, y: bendY }, joint] : [{ x: joint.x, y: -40 }, joint];
  // Near the joint the branch meets the main path by design; only the stretch before it must keep clear.
  const own = samples(branch).filter((p) => Math.hypot(p.x - joint.x, p.y - joint.y) > 2 * PATH_HALF + 60);
  const mainPoints = samples(main);
  if (own.some((p) => nearest(mainPoints, p.x, p.y) < 2 * PATH_HALF + 30)) return null;
  return [...branch, ...main.slice(run + 1)];
}

interface Site extends Point {
  /** Share of all path within RANGE, 0 to 1. */
  readonly coverage: number;
  readonly kind: 'Kurve' | 'Wegrand' | 'Bannkreis';
}

/** Whether a rectangle centred on (x, y) keeps clear of the path. */
const clearOfPath = (points: readonly Point[], x: number, y: number, hx: number, hy: number) =>
  points.every((p) => Math.abs(p.x - x) > hx + PATH_HALF || Math.abs(p.y - y) > hy + PATH_HALF);

/**
 * Seven sites: one near the ward, two of the best covering spots (bends, between two runs), then at least two in
 * each third of the main path, the rest anywhere. Within each rule the pick is random, weighted by coverage.
 */
function chooseSites(random: Random, routes: readonly (readonly Point[])[]): Site[] | null {
  const main = routes[0]!;
  const mainPoints = samples(main);
  // Shared stretches would count twice: a route's points that lie on the main path are dropped.
  const allPoints = [...mainPoints, ...routes.slice(1).flatMap((route) => samples(route).filter((p) => nearest(mainPoints, p.x, p.y) > 4))];
  const end = main[main.length - 1]!;
  const spots: (Point & { coverage: number; progress: number })[] = [];
  for (let y = GRID; y < WORLD.height; y += GRID) {
    for (let x = GRID; x < WORLD.width; x += GRID) {
      const labelY = y - LABEL.above;
      const fits =
        clearOfPath(allPoints, x, y, SITE_HALF, SITE_HALF) &&
        clearOfPath(allPoints, x, labelY, LABEL.halfWidth, LABEL.halfHeight) &&
        y + SITE_HALF < WORLD.height &&
        labelY - LABEL.halfHeight > 0 &&
        x - LABEL.halfWidth > 0 &&
        x + LABEL.halfWidth < WORLD.width &&
        Math.hypot(x - end.x, y - end.y) > WARD_RADIUS + SITE_HALF + 20 &&
        nearest(allPoints, x, y) <= SITE_REACH;
      if (!fits) continue;
      const inRange = allPoints.filter((p) => Math.hypot(p.x - x, p.y - y) <= RANGE).length;
      const closest = mainPoints.reduce((best, p, i) => (Math.hypot(p.x - x, p.y - y) < Math.hypot(mainPoints[best]!.x - x, mainPoints[best]!.y - y) ? i : best), 0);
      spots.push({ x, y, coverage: inRange / allPoints.length, progress: closest / mainPoints.length });
    }
  }
  if (spots.length === 0) return null;
  const best = Math.max(...spots.map((s) => s.coverage));
  const bendLimit = [...spots].sort((a, b) => b.coverage - a.coverage)[Math.floor(spots.length * 0.12)]!.coverage;
  const chosen: Site[] = [];
  const pick = (filter: (s: (typeof spots)[number]) => boolean, kind: Site['kind'], power: number): boolean => {
    const open = spots.filter((s) => filter(s) && chosen.every((c) => Math.hypot(c.x - s.x, c.y - s.y) >= SITE_SPACING));
    if (open.length === 0) return false;
    const weights = open.map((s) => (s.coverage / best) ** power);
    let r = random() * weights.reduce((a, b) => a + b, 0);
    const spot = open.find((_, i) => (r -= weights[i]!) <= 0) ?? open[open.length - 1]!;
    chosen.push({ x: spot.x, y: spot.y, coverage: spot.coverage, kind });
    return true;
  };
  const third = (s: (typeof spots)[number]) => Math.min(Math.floor(s.progress * 3), 2);
  if (!pick((s) => s.progress > 0.85, 'Bannkreis', 1)) return null;
  for (let i = 0; i < 2; i++) if (!pick((s) => s.coverage >= bendLimit, 'Kurve', 2)) return null;
  for (let t = 0; t < 3; t++) {
    while (chosen.filter((c) => third(spots.find((s) => s.x === c.x && s.y === c.y)!) === t).length < 2) {
      if (!pick((s) => third(s) === t && s.coverage < bendLimit, 'Wegrand', 1)) return null;
    }
  }
  while (chosen.length < SITES) if (!pick((s) => s.coverage < bendLimit, 'Wegrand', 1)) return null;
  return chosen;
}

/** Words without prefix pairs, as the game demands. */
function pickWords(random: Random, count: number): string[] {
  const words: string[] = [];
  const pool = WORDS.filter((w) => w.length >= 4);
  while (words.length < count) {
    const word = pool[Math.floor(random() * pool.length)]!;
    if (words.every((other) => !other.startsWith(word) && !word.startsWith(other))) words.push(word);
  }
  return words;
}

function roundCorners(points: readonly Point[], radius: number): Point[] {
  const out: Point[] = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const [prev, corner, next] = [points[i - 1]!, points[i]!, points[i + 1]!];
    const r = Math.min(radius, Math.hypot(corner.x - prev.x, corner.y - prev.y) / 2, Math.hypot(next.x - corner.x, next.y - corner.y) / 2);
    const towards = (to: Point, d: number) => {
      const length = Math.hypot(to.x - corner.x, to.y - corner.y);
      return { x: corner.x + ((to.x - corner.x) * d) / length, y: corner.y + ((to.y - corner.y) * d) / length };
    };
    const [a, b] = [towards(prev, r), towards(next, r)];
    for (let t = 0; t <= 1; t += 0.125) {
      out.push({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * corner.x + t ** 2 * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * corner.y + t ** 2 * b.y });
    }
  }
  out.push(points[points.length - 1]!);
  return out;
}

function generate(): { routes: Point[][]; sites: Site[] } {
  const random = seededRandom(SEED);
  for (let attempt = 0; attempt < 300; attempt++) {
    const main = mainPath(random);
    const routes = [main];
    if (PATHS > 1) {
      const branch = branchPath(random, main);
      if (!branch) continue;
      routes.push(branch);
    }
    const sites = chooseSites(random, routes);
    if (sites) return { routes, sites };
  }
  throw new Error(`seed ${SEED}: no map with ${PATHS} paths and ${SITES} sites`);
}

const ENEMIES = [
  { walk: 'skorpion-links-base-11', height: 58, facesLeft: false },
  { walk: 'golem-links-base-11', height: 64, facesLeft: true },
  { walk: 'kaefer-links-base-22', height: 60, facesLeft: true },
] as const;
const TOWERS = ['turm-pfeil-11', 'turm-magier-22', 'turm-kanone-11'] as const;
const TOWER_HEIGHT = 104;

class LayoutScene extends Phaser.Scene {
  preload(): void {
    for (const name of [...ENEMIES.map((e) => e.walk), ...TOWERS, 'boden-wiese-22', 'boden-erde-22', 'lichtung3-22']) this.load.image(name, file(name));
  }

  create(): void {
    for (const link of document.querySelectorAll<HTMLAnchorElement>('nav a')) {
      const target = new URLSearchParams(link.search);
      for (const key of (link.dataset['keep'] ?? '').split(' ')) if (params.has(key) && !target.has(key)) target.set(key, params.get(key)!);
      if (!('new' in link.dataset)) target.set('seed', String(SEED));
      link.search = target.toString();
    }
    const { routes, sites } = generate();
    const s = SCALE;
    const screen = (p: Point) => ({ x: p.x * s, y: p.y * s });
    const rounded = routes.map((route) => roundCorners(route, 70).map(screen));
    this.#paintGround(rounded);
    const end = screen(routes[0]![routes[0]!.length - 1]!);
    this.add.circle(end.x, end.y, WARD_RADIUS * s, 0x5ab4ff, 0.25).setStrokeStyle(3, 0x5ab4ff, 0.9).setDepth(1);

    const random = seededRandom(SEED + 1);
    const words = pickWords(random, SITES + 4);
    const best = Math.max(...sites.map((site) => site.coverage));
    sites.forEach((site, i) => {
      const { x, y } = screen(site);
      // Range: green for the best coverage, through yellow, to red for the weakest.
      const share = site.coverage / best;
      const colour = Phaser.Display.Color.HSVToRGB(share * 0.33, 0.8, 0.85).color;
      this.add.circle(x, y, RANGE * s, colour, 0.08).setStrokeStyle(2, colour, 0.7).setDepth(2);
      const clearing = this.add.image(x, y + 8 * s, 'lichtung3-22').setDepth(3);
      clearing.setScale((110 * s) / clearing.width);
      if (i % 3 === 0) {
        const tower = this.add.image(x, y + 24 * s, TOWERS[(i / 3) % TOWERS.length]!).setOrigin(0.5, 1).setDepth(y);
        tower.setScale((TOWER_HEIGHT * s) / tower.height);
      }
      this.#label(x, y - LABEL.above * s, words[i]!, `${site.kind} ${Math.round(site.coverage * 100)} %`);
    });

    // Six enemies spread over the routes; every third carries a word, as from the third place on.
    const curves = rounded.map((route) => {
      const path = new Phaser.Curves.Path(route[0]!.x, route[0]!.y);
      for (const p of route.slice(1)) path.lineTo(p.x, p.y);
      return path;
    });
    for (let i = 0; i < 6; i++) {
      const kind = ENEMIES[i % ENEMIES.length]!;
      const enemy = this.add.image(0, 0, kind.walk).setOrigin(0.5, 1).setVisible(false);
      enemy.setScale((kind.height * s) / enemy.height);
      const label = i % 3 === 2 ? this.#label(0, 0, words[SITES + Math.floor(i / 3)]!).setVisible(false) : null;
      const curve = curves[i % curves.length]!;
      const progress = { t: 0 };
      this.tweens.add({
        targets: progress,
        t: 1,
        delay: i * 2300,
        duration: 22000 / s,
        repeat: -1,
        onUpdate: () => {
          const point = curve.getPoint(progress.t);
          if (Math.abs(point.x - enemy.x) > 0.01) enemy.setFlipX(kind.facesLeft === point.x > enemy.x);
          enemy.setPosition(point.x, point.y + 18 * s).setDepth(point.y + 18 * s).setVisible(true);
          label?.setPosition(point.x, point.y - kind.height * s - 6).setVisible(true);
        },
      });
    }
    const info = `Maßstab ${String(s).replace('.', ',')} · ${PATHS} ${PATHS > 1 ? 'Wege' : 'Weg'} · ${SITES} Bauplätze · Seed ${SEED}`;
    this.add.text(8, SCREEN.height - 24, info, { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#2b2116', backgroundColor: '#f4ecd6c0', padding: { x: 6, y: 2 } }).setDepth(3000);
  }

  /** A word as in the game: fixed screen size, light plate, optional small line under it. */
  #label(x: number, y: number, word: string, note?: string): Phaser.GameObjects.Container {
    const text = this.add.text(0, 0, word, { fontFamily: 'sans-serif', fontSize: '20px', color: '#1d2a3a', fontStyle: 'bold' }).setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [this.add.rectangle(0, 0, text.width + 16, text.height + 6, 0xfffaf0, 0.9).setStrokeStyle(1, 0x2b2116, 0.4), text];
    if (note) parts.push(this.add.text(0, 20, note, { fontFamily: 'sans-serif', fontSize: '12px', color: '#2b2116', backgroundColor: '#fffaf0b0' }).setOrigin(0.5, 0));
    return this.add.container(x, y, parts).setDepth(2500);
  }

  #paintGround(routes: readonly Point[][]): void {
    const canvas = document.createElement('canvas');
    [canvas.width, canvas.height] = [SCREEN.width, SCREEN.height];
    const ctx = canvas.getContext('2d')!;
    const image = (key: string) => this.textures.get(key).getSourceImage() as HTMLImageElement;
    const meadow = ctx.createPattern(image('boden-wiese-22'), 'repeat')!;
    meadow.setTransform(new DOMMatrix().scale(0.6 * SCALE));
    ctx.fillStyle = meadow;
    ctx.fillRect(0, 0, SCREEN.width, SCREEN.height);
    ctx.lineCap = ctx.lineJoin = 'round';
    const trace = (route: readonly Point[]) => {
      ctx.beginPath();
      route.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    };
    ctx.strokeStyle = 'rgba(120, 92, 58, 0.45)';
    ctx.lineWidth = (2 * PATH_HALF + 8) * SCALE;
    routes.forEach(trace);
    const earth = ctx.createPattern(image('boden-erde-22'), 'repeat')!;
    earth.setTransform(new DOMMatrix().scale(0.4 * SCALE));
    ctx.strokeStyle = earth;
    ctx.lineWidth = (2 * PATH_HALF - 2) * SCALE;
    routes.forEach(trace);
    this.textures.addCanvas('ground', canvas);
    this.add.image(0, 0, 'ground').setOrigin(0);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: SCREEN.width,
  height: SCREEN.height,
  backgroundColor: '#efe6cf',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: LayoutScene,
});
