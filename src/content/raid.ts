import type { EnemyKind, Level } from '../battle/level';
import { LIBRARY_PATH, LIBRARY_SITES } from './library';

/** Creatures of the Silence; the ids match the sprite sheets in `src/scenes/battleArt.ts`. */
export const SILENT_SCORPION: EnemyKind = { id: 'scorpion', speed: 50, wardDamage: 1, health: 40, ink: 15 };
export const SILENT_FIREBUG: EnemyKind = { id: 'firebug', speed: 32, wardDamage: 2, health: 120, ink: 30 };
/** No tower can stop them: the raid always ends with the ward broken. */
export const SHADOW: EnemyKind = { id: 'shadow', speed: 26, wardDamage: 4, health: 1_000_000, ink: 0 };

/**
 * The raid on the library: the first waves can be held, then shadows come that
 * nothing stops. Their ward damage alone exceeds the ward, so the level is lost
 * however well the player types (see `raid.test.ts`).
 */
export const RAID_LEVEL: Level = {
  id: 'raid',
  path: LIBRARY_PATH,
  sites: LIBRARY_SITES,
  ward: 10,
  ink: 150,
  waves: [
    { kind: SILENT_SCORPION, count: 8, spacingMs: 1500 },
    { kind: SILENT_FIREBUG, count: 4, spacingMs: 2600 },
    { kind: SHADOW, count: 4, spacingMs: 2200 },
  ],
};
