import type { EnemyKind, Level } from '../battle/level';

/** Ground enemies of the first level; the ids match the sprites in `src/assets/spire/enemies/`. */
export const LEAFBUG: EnemyKind = { id: 'leafbug', speed: 40, wardDamage: 1 };
export const SCORPION: EnemyKind = { id: 'scorpion', speed: 55, wardDamage: 1 };
export const FIREBUG: EnemyKind = { id: 'firebug', speed: 30, wardDamage: 2 };

/** First level on a 1280 × 720 map: one winding path from the left edge to the ward circle on the right. */
export const LEVEL_1: Level = {
  id: 'level-1',
  path: [
    { x: -40, y: 160 },
    { x: 360, y: 160 },
    { x: 360, y: 420 },
    { x: 760, y: 420 },
    { x: 760, y: 200 },
    { x: 1120, y: 200 },
  ],
  sites: [
    { id: 'a', x: 240, y: 260 },
    { id: 'b', x: 480, y: 300 },
    { id: 'c', x: 620, y: 320 },
    { id: 'd', x: 880, y: 320 },
    { id: 'e', x: 940, y: 110 },
  ],
  ward: 10,
  ink: 100,
  waves: [
    { kind: LEAFBUG, count: 5, spacingMs: 1800 },
    { kind: SCORPION, count: 8, spacingMs: 1400 },
    { kind: FIREBUG, count: 4, spacingMs: 2600 },
  ],
};
