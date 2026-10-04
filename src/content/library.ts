import type { BuildSite, EnemyKind, Level, Wave } from '../battle/level';
import type { Point } from '../battle/path';

/** Paper golems the master folds for practice; the ids match the sprites in `src/assets/library/`. */
export const PAPER_GOLEM: EnemyKind = { id: 'paper-golem', speed: 35, wardDamage: 1, health: 20, ink: 10 };
export const LARGE_PAPER_GOLEM: EnemyKind = { id: 'paper-golem-large', speed: 28, wardDamage: 2, health: 60, ink: 25 };

/** `kind` folded more firmly: `factor` times the health; it leaves a little more ink too. */
function stronger(kind: EnemyKind, factor: number): EnemyKind {
  return { ...kind, health: Math.round(kind.health * factor), ink: Math.round(kind.ink * (1 + (factor - 1) / 2)) };
}

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

/**
 * Waves per tutorial section: few, slow golems, enough ink for two towers at
 * the start. The golems grow tougher from wave to wave and from section to
 * section, so one tower is not enough for long.
 */
const PRACTICE_WAVES: Readonly<Record<number, readonly Wave[]>> = {
  1: [
    { kind: stronger(PAPER_GOLEM, 2), count: 4, spacingMs: 2200 },
    { kind: stronger(PAPER_GOLEM, 3.5), count: 6, spacingMs: 1800 },
  ],
  2: [
    { kind: stronger(PAPER_GOLEM, 3), count: 6, spacingMs: 1800 },
    { kind: stronger(LARGE_PAPER_GOLEM, 3), count: 2, spacingMs: 3000 },
    { kind: stronger(PAPER_GOLEM, 5), count: 8, spacingMs: 1500 },
  ],
  3: [
    { kind: stronger(PAPER_GOLEM, 4.5), count: 8, spacingMs: 1500 },
    { kind: stronger(LARGE_PAPER_GOLEM, 4), count: 4, spacingMs: 2500 },
    { kind: stronger(PAPER_GOLEM, 7), count: 10, spacingMs: 1200 },
  ],
};

/** The practice battle of tutorial section `section` (1–3). */
export function practiceLevel(section: number): Level {
  const waves = PRACTICE_WAVES[section];
  if (!waves) throw new Error(`no practice battle for section ${section}`);
  return { id: `practice-${section}`, path: LIBRARY_PATH, sites: LIBRARY_SITES, ward: 10, ink: 100, waves };
}
