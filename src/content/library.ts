import type { BuildSite, EnemyKind, Level, Wave } from '../battle/level';
import type { Point } from '../battle/path';

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
  readonly path: readonly Point[];
  readonly sites: readonly BuildSite[];
  readonly props: readonly Prop[];
  /** Banners and torches on the back wall of an indoor map, by x. */
  readonly banners?: readonly number[];
  readonly torches?: readonly number[];
  readonly ash?: boolean;
}

/** Shelves along the back wall of an indoor map, three looks in turn. */
export function wallShelves(xs: readonly number[], kind: 'bookshelf' | 'burnt-bookshelf' = 'bookshelf'): Prop[] {
  return xs.map((x, i) => ({ kind, variant: i % 3, x, y: 86 }));
}

/** The reading room: a carpet from the door on the left to the ward circle on the right. */
export const READING_ROOM: BattleMap = {
  id: 'reading-room',
  name: 'Lesesaal',
  indoor: true,
  floor: 'stone',
  path: [
    { x: -40, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 400 },
    { x: 700, y: 400 },
    { x: 700, y: 190 },
    { x: 1150, y: 190 },
  ],
  sites: [
    { id: 'a', x: 150, y: 320 },
    { id: 'b', x: 450, y: 300 },
    { id: 'c', x: 580, y: 290 },
    { id: 'd', x: 850, y: 300 },
    { id: 'e', x: 1020, y: 310 },
  ],
  props: [
    ...wallShelves([96, 160, 420, 484, 548, 820, 884, 1060, 1124]),
    { kind: 'lectern', x: 60, y: 420 },
    { kind: 'reading-desk', x: 880, y: 420 },
    { kind: 'book-pile', variant: 0, x: 1200, y: 320 },
    { kind: 'book-pile', variant: 1, x: 520, y: 175 },
    { kind: 'scroll', x: 1210, y: 420 },
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
  path: [
    { x: -40, y: 390 },
    { x: 260, y: 390 },
    { x: 260, y: 200 },
    { x: 640, y: 200 },
    { x: 640, y: 390 },
    { x: 1000, y: 390 },
    { x: 1000, y: 200 },
    { x: 1150, y: 200 },
  ],
  sites: [
    { id: 'a', x: 130, y: 280 },
    { id: 'b', x: 380, y: 310 },
    { id: 'c', x: 520, y: 310 },
    { id: 'd', x: 820, y: 270 },
    { id: 'e', x: 1100, y: 310 },
  ],
  props: [
    ...wallShelves([64, 128, 192, 352, 416, 480, 544, 736, 800, 864, 1216]),
    { kind: 'bookshelf', variant: 1, x: 720, y: 290 },
    { kind: 'bookshelf', variant: 2, x: 920, y: 290 },
    { kind: 'book-pile', variant: 0, x: 60, y: 180 },
    { kind: 'book-pile', variant: 1, x: 1200, y: 420 },
    { kind: 'scroll', x: 450, y: 420 },
    { kind: 'scroll', x: 820, y: 440 },
  ],
  banners: [272, 640, 1000],
  torches: [960, 1140],
};

/** The courtyard of the library: grass, a sand path, trees and rocks. */
export const COURTYARD: BattleMap = {
  id: 'courtyard',
  name: 'Innenhof',
  indoor: false,
  path: [
    { x: -40, y: 260 },
    { x: 200, y: 260 },
    { x: 200, y: 90 },
    { x: 560, y: 90 },
    { x: 560, y: 340 },
    { x: 900, y: 340 },
    { x: 900, y: 130 },
    { x: 1150, y: 130 },
  ],
  sites: [
    { id: 'a', x: 90, y: 150 },
    { id: 'b', x: 380, y: 210 },
    { id: 'c', x: 380, y: 380 },
    { id: 'd', x: 730, y: 220 },
    { id: 'e', x: 1050, y: 260 },
  ],
  props: [
    { kind: 'tree', variant: 0, x: 60, y: 400 },
    { kind: 'tree', variant: 2, x: 130, y: 420 },
    { kind: 'tree', variant: 1, x: 690, y: 60 },
    { kind: 'tree', variant: 3, x: 760, y: 70 },
    { kind: 'tree', variant: 0, x: 1220, y: 300 },
    { kind: 'tree', variant: 2, x: 1190, y: 420 },
    { kind: 'rock', variant: 0, x: 450, y: 440 },
    { kind: 'rock', variant: 1, x: 1030, y: 440 },
    { kind: 'rock', variant: 0, x: 380, y: 40 },
    { kind: 'lectern', x: 720, y: 425 },
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

/** The practice battle of tutorial section `section` (1–3) on `map`. */
export function practiceLevel(section: number, map: BattleMap = READING_ROOM): Level {
  const waves = PRACTICE_WAVES[section];
  if (!waves) throw new Error(`no practice battle for section ${section}`);
  return { id: `practice-${section}-${map.id}`, path: map.path, sites: map.sites, ward: 10, ink: 100, waves };
}
