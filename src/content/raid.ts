import type { EnemyKind, Level } from '../battle/level';
import { READING_ROOM } from './library';

/** Creatures of the Silence; the ids match the sprite sheets in `src/scenes/battleArt.ts`. */
export const SILENT_SCORPION: EnemyKind = { id: 'scorpion', speed: 50, wardDamage: 1, health: 40, ink: 15 };
export const SILENT_FIREBUG: EnemyKind = { id: 'firebug', speed: 32, wardDamage: 2, health: 120, ink: 30 };

/** The horde of the last wave: much tougher, but every hit counts. */
export const RAVENOUS_SCORPION: EnemyKind = { ...SILENT_SCORPION, speed: 70, health: 220 };
export const RAVENOUS_FIREBUG: EnemyKind = { ...SILENT_FIREBUG, speed: 28, health: 600 };
export const SHADOW: EnemyKind = { id: 'shadow', speed: 42, wardDamage: 2, health: 450, ink: 40 };

/**
 * The raid on the library: the first waves can be held, then a horde of every
 * kind comes at once, fast and slow together. Each of them can be wounded and
 * some fall, but there are too many: the ward breaks however well the player
 * types (see `raid.test.ts`).
 */
export const RAID_LEVEL: Level = {
  id: 'raid',
  paths: READING_ROOM.paths,
  sites: READING_ROOM.sites,
  scale: READING_ROOM.scale,
  ward: 10,
  ink: 150,
  waves: [
    [{ kind: SILENT_SCORPION, count: 8, spacingMs: 1500 }],
    [{ kind: SILENT_FIREBUG, count: 4, spacingMs: 2600 }],
    [
      { kind: RAVENOUS_SCORPION, count: 12, spacingMs: 1200 },
      { kind: SHADOW, count: 10, spacingMs: 1600, delayMs: 800 },
      { kind: RAVENOUS_FIREBUG, count: 6, spacingMs: 2400, delayMs: 400 },
    ],
  ],
};
