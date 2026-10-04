import type { BuildSite, EnemyKind, Level, Wave } from '../battle/level';
import type { Point } from '../battle/path';

/** Paper golems the master folds for practice; the ids match the sprites in `src/assets/library/`. */
export const PAPER_GOLEM: EnemyKind = { id: 'paper-golem', speed: 35, wardDamage: 1, health: 20, ink: 10 };
export const LARGE_PAPER_GOLEM: EnemyKind = { id: 'paper-golem-large', speed: 28, wardDamage: 2, health: 60, ink: 25 };

/**
 * The reading room on a 1280 × 720 screen, kept above the desk (y < 470): a
 * carpet runs from the door on the left to the ward circle on the right.
 */
export const LIBRARY_PATH: readonly Point[] = [
  { x: -40, y: 200 },
  { x: 300, y: 200 },
  { x: 300, y: 400 },
  { x: 700, y: 400 },
  { x: 700, y: 190 },
  { x: 1150, y: 190 },
];

export const LIBRARY_SITES: readonly BuildSite[] = [
  { id: 'a', x: 150, y: 320 },
  { id: 'b', x: 450, y: 300 },
  { id: 'c', x: 580, y: 290 },
  { id: 'd', x: 850, y: 300 },
  { id: 'e', x: 1020, y: 310 },
];

/** Gentle waves per tutorial section: few, slow golems, enough ink for two towers at the start. */
const PRACTICE_WAVES: Readonly<Record<number, readonly Wave[]>> = {
  1: [
    { kind: PAPER_GOLEM, count: 4, spacingMs: 2200 },
    { kind: PAPER_GOLEM, count: 6, spacingMs: 1800 },
  ],
  2: [
    { kind: PAPER_GOLEM, count: 6, spacingMs: 1800 },
    { kind: LARGE_PAPER_GOLEM, count: 2, spacingMs: 3000 },
    { kind: PAPER_GOLEM, count: 8, spacingMs: 1500 },
  ],
  3: [
    { kind: PAPER_GOLEM, count: 8, spacingMs: 1500 },
    { kind: LARGE_PAPER_GOLEM, count: 4, spacingMs: 2500 },
    { kind: PAPER_GOLEM, count: 10, spacingMs: 1200 },
  ],
};

/** The practice battle of tutorial section `section` (1–3). */
export function practiceLevel(section: number): Level {
  const waves = PRACTICE_WAVES[section];
  if (!waves) throw new Error(`no practice battle for section ${section}`);
  return { id: `practice-${section}`, path: LIBRARY_PATH, sites: LIBRARY_SITES, ward: 10, ink: 100, waves };
}
