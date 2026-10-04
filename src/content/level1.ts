import type { EnemyKind, Level, TowerKind } from '../battle/level';

/** Ground enemies of the first level; the ids match the sprites in `src/assets/spire/enemies/`. */
export const LEAFBUG: EnemyKind = { id: 'leafbug', speed: 40, wardDamage: 1, health: 30, ink: 10 };
export const SCORPION: EnemyKind = { id: 'scorpion', speed: 55, wardDamage: 1, health: 40, ink: 15 };
export const FIREBUG: EnemyKind = { id: 'firebug', speed: 30, wardDamage: 2, health: 120, ink: 30 };

/** The crossbow tower (Spire tower 01). */
export const CROSSBOW: TowerKind = { id: 'tower-01', keyword: 'jagd', cost: 50, range: 170, damage: 10, cooldownMs: 800 };

/** Typed during a flood to let the next wave come. */
export const FLOOD_WORD = 'ja';

/**
 * First level on a 1280 × 720 screen: one winding path from the left edge to
 * the ward circle on the right, kept above the on-screen keyboard (y < 480).
 */
export const LEVEL_1: Level = {
  id: 'level-1',
  path: [
    { x: -40, y: 110 },
    { x: 330, y: 110 },
    { x: 330, y: 370 },
    { x: 770, y: 370 },
    { x: 770, y: 150 },
    { x: 1150, y: 150 },
  ],
  sites: [
    { id: 'a', x: 200, y: 230 },
    { id: 'b', x: 450, y: 270 },
    { id: 'c', x: 640, y: 260 },
    { id: 'd', x: 890, y: 280 },
    { id: 'e', x: 1050, y: 300 },
  ],
  ward: 10,
  ink: 100,
  waves: [
    { kind: LEAFBUG, count: 5, spacingMs: 1800 },
    { kind: SCORPION, count: 8, spacingMs: 1400 },
    { kind: FIREBUG, count: 4, spacingMs: 2600 },
  ],
};
