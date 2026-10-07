import type { BuildSite, EnemyKind, Level, Wave } from '../battle/level';
import type { Point } from '../battle/path';

/** Scale of every battle map: drawn smaller than the art, so more path, sites and enemies fit (#146, see `Level.scale`). */
export const MAP_SCALE = 0.8;

/** Paper golems the master folds for practice; the ids match the sprites in `src/assets/library/`. */
export const PAPER_GOLEM: EnemyKind = { id: 'paper-golem', speed: 35, wardDamage: 1, health: 20, ink: 10 };
export const LARGE_PAPER_GOLEM: EnemyKind = { id: 'paper-golem-large', speed: 28, wardDamage: 2, health: 60, ink: 25 };

/** `kind` made tougher: `factor` times the health; it leaves a little more ink too. */
export function stronger(kind: EnemyKind, factor: number): EnemyKind {
  return { ...kind, health: Math.round(kind.health * factor), ink: Math.round(kind.ink * (1 + (factor - 1) / 2)) };
}

/** Things placed on a map; the scene knows how to draw each. */
export type PropKind = 'bookshelf' | 'burnt-bookshelf' | 'lectern' | 'reading-desk' | 'book-pile' | 'scroll' | 'tree' | 'rock';

export interface Prop {
  readonly kind: PropKind;
  /** Picks one of several looks, e.g. a shelf's books or a tree's colour. */
  readonly variant?: number;
  /** Centre of the prop; it stands on its lower edge. */
  readonly x: number;
  readonly y: number;
}

/**
 * One place for a battle, on a 1280 × 720 screen kept above the desk
 * (y < 470). `indoor` maps have a stone floor, a back wall with banners and
 * torches and a carpet as the path; outdoor maps have grass and a sand path.
 * Maps of the ash fields lie under soot, their trees burnt.
 */
export interface BattleMap {
  readonly id: string;
  readonly name: string;
  readonly indoor: boolean;
  /** Floor tile of indoor maps. */
  readonly floor?: 'stone' | 'slab';
  /** Ways in for the enemies, see `Level.paths`. */
  readonly paths: readonly (readonly Point[])[];
  readonly sites: readonly BuildSite[];
  readonly props: readonly Prop[];
  /** Banners and torches on the back wall of an indoor map, by x. */
  readonly banners?: readonly number[];
  readonly torches?: readonly number[];
  readonly ash?: boolean;
  /** Size of the map's world on screen, see `Level.scale`; 1 if omitted. */
  readonly scale?: number;
}

/** Wall shelves stand by their middle at this height and are 128 px tall; build sites keep below them. */
const SHELF_Y = 86;
export const SHELF_BOTTOM = SHELF_Y + 64;

/** Shelves along the back wall of an indoor map, three looks in turn. */
export function wallShelves(xs: readonly number[], kind: 'bookshelf' | 'burnt-bookshelf' = 'bookshelf'): Prop[] {
  return xs.map((x, i) => ({ kind, variant: i % 3, x, y: SHELF_Y }));
}

/**
 * The reading room: a carpet from the door on the left to the ward circle on the right. Like every battle map it is
 * drawn at `MAP_SCALE` with seven sites that each reach a tenth of the path; indoors they stay below the shelves.
 */
export const READING_ROOM: BattleMap = {
  id: 'reading-room',
  name: 'Lesesaal',
  indoor: true,
  floor: 'stone',
  scale: MAP_SCALE,
  paths: [[
    { x: -40, y: 270 },
    { x: 230, y: 270 },
    { x: 230, y: 420 },
    { x: 480, y: 420 },
    { x: 480, y: 260 },
    { x: 740, y: 260 },
    { x: 740, y: 420 },
    { x: 980, y: 420 },
    { x: 980, y: 300 },
    { x: 1176, y: 300 },
  ]],
  sites: [
    { id: 'a', x: 70, y: 210 },
    { id: 'b', x: 200, y: 220 },
    { id: 'c', x: 320, y: 340 },
    { id: 'd', x: 520, y: 210 },
    { id: 'e', x: 660, y: 200 },
    { id: 'f', x: 860, y: 350 },
    { id: 'g', x: 1050, y: 250 },
  ],
  props: [
    ...wallShelves([96, 160, 420, 484, 548, 820, 884, 1060, 1124]),
    { kind: 'lectern', x: 60, y: 430 },
    { kind: 'reading-desk', x: 610, y: 340 },
    { kind: 'book-pile', variant: 0, x: 1200, y: 400 },
    { kind: 'book-pile', variant: 1, x: 380, y: 190 },
    { kind: 'scroll', x: 1220, y: 440 },
  ],
  banners: [250, 710, 990],
  torches: [340, 740, 1200],
};

/** The archive: stone slabs, rows of shelves, the carpet winds between them. */
export const ARCHIVE: BattleMap = {
  id: 'archive',
  name: 'Archiv',
  indoor: true,
  floor: 'slab',
  scale: MAP_SCALE,
  paths: [[
    { x: -40, y: 420 },
    { x: 200, y: 420 },
    { x: 200, y: 260 },
    { x: 450, y: 260 },
    { x: 450, y: 420 },
    { x: 700, y: 420 },
    { x: 700, y: 260 },
    { x: 950, y: 260 },
    { x: 950, y: 400 },
    { x: 1176, y: 400 },
  ]],
  sites: [
    { id: 'a', x: 100, y: 360 },
    { id: 'b', x: 250, y: 210 },
    { id: 'c', x: 430, y: 210 },
    { id: 'd', x: 610, y: 340 },
    { id: 'e', x: 760, y: 210 },
    { id: 'f', x: 890, y: 210 },
    { id: 'g', x: 1040, y: 330 },
  ],
  props: [
    ...wallShelves([64, 128, 192, 352, 416, 480, 544, 736, 800, 864, 1216]),
    { kind: 'bookshelf', variant: 1, x: 325, y: 380 },
    { kind: 'bookshelf', variant: 2, x: 825, y: 380 },
    { kind: 'book-pile', variant: 0, x: 60, y: 200 },
    { kind: 'book-pile', variant: 1, x: 1220, y: 230 },
    { kind: 'scroll', x: 1100, y: 450 },
  ],
  banners: [272, 640, 1000],
  torches: [960, 1140],
};

/** The courtyard of the library: grass, a sand path, trees and rocks. */
export const COURTYARD: BattleMap = {
  id: 'courtyard',
  name: 'Innenhof',
  indoor: false,
  scale: MAP_SCALE,
  paths: [[
    { x: -40, y: 200 },
    { x: 170, y: 200 },
    { x: 170, y: 380 },
    { x: 400, y: 380 },
    { x: 400, y: 150 },
    { x: 640, y: 150 },
    { x: 640, y: 380 },
    { x: 880, y: 380 },
    { x: 880, y: 180 },
    { x: 1176, y: 180 },
  ]],
  sites: [
    { id: 'a', x: 90, y: 150 },
    { id: 'b', x: 280, y: 330 },
    { id: 'c', x: 440, y: 100 },
    { id: 'd', x: 570, y: 100 },
    { id: 'e', x: 760, y: 300 },
    { id: 'f', x: 930, y: 130 },
    { id: 'g', x: 1060, y: 130 },
  ],
  props: [
    { kind: 'tree', variant: 0, x: 60, y: 400 },
    { kind: 'tree', variant: 2, x: 130, y: 430 },
    { kind: 'tree', variant: 1, x: 300, y: 60 },
    { kind: 'tree', variant: 3, x: 720, y: 60 },
    { kind: 'tree', variant: 0, x: 1220, y: 330 },
    { kind: 'tree', variant: 2, x: 1180, y: 430 },
    { kind: 'rock', variant: 0, x: 460, y: 450 },
    { kind: 'rock', variant: 1, x: 1030, y: 450 },
    { kind: 'rock', variant: 0, x: 520, y: 300 },
    { kind: 'lectern', x: 780, y: 440 },
  ],
};

/** Practice battles take turns between these maps. */
export const PRACTICE_MAPS: readonly BattleMap[] = [READING_ROOM, ARCHIVE, COURTYARD];

/** The map of the `round`-th practice battle (0 for the first). */
export function practiceMap(round: number): BattleMap {
  return PRACTICE_MAPS[round % PRACTICE_MAPS.length]!;
}

/**
 * Waves per tutorial section: few, slow golems, enough ink for two towers at
 * the start. The golems grow tougher from wave to wave and from section to
 * section, so one tower is not enough for long. Every third small golem glows
 * and carries a word, so there is something to type while the wave advances.
 */
const PRACTICE_WAVES: Readonly<Record<number, readonly Wave[]>> = {
  1: [
    [{ kind: stronger(PAPER_GOLEM, 2), count: 4, spacingMs: 2200, markEvery: 3 }],
    [{ kind: stronger(PAPER_GOLEM, 3.5), count: 6, spacingMs: 1800, markEvery: 3 }],
  ],
  2: [
    [{ kind: stronger(PAPER_GOLEM, 3), count: 6, spacingMs: 1800, markEvery: 3 }],
    [{ kind: stronger(LARGE_PAPER_GOLEM, 3), count: 2, spacingMs: 3000 }],
    [{ kind: stronger(PAPER_GOLEM, 5), count: 8, spacingMs: 1500, markEvery: 3 }],
  ],
  3: [
    [{ kind: stronger(PAPER_GOLEM, 4.5), count: 8, spacingMs: 1500, markEvery: 3 }],
    [{ kind: stronger(LARGE_PAPER_GOLEM, 4), count: 4, spacingMs: 2500 }],
    [{ kind: stronger(PAPER_GOLEM, 7), count: 10, spacingMs: 1200, markEvery: 3 }],
  ],
};

/**
 * Sites open in the first section: the home row has few words without prefix pairs, and the glowing golems need
 * some of them too. The other sites of the map stay empty until the top row brings more words.
 */
const FIRST_SECTION_SITES = 5;

/** The practice battle of tutorial section `section` (1–3) on `map`. */
export function practiceLevel(section: number, map: BattleMap = READING_ROOM): Level {
  const waves = PRACTICE_WAVES[section];
  if (!waves) throw new Error(`no practice battle for section ${section}`);
  // Open sites spread evenly along the map's sites, which run from the door to the ward circle.
  const last = map.sites.length - 1;
  const sites =
    section === 1 ? Array.from({ length: FIRST_SECTION_SITES }, (_, i) => map.sites[Math.round((i * last) / (FIRST_SECTION_SITES - 1))]!) : map.sites;
  return { id: `practice-${section}-${map.id}`, paths: map.paths, sites, ward: 10, ink: 100, waves, scale: map.scale };
}
