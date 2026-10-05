import type { Spell } from '../battle/level';

/** From the lost scroll of the smoke hollow: ink rains on every enemy on the path, for as much ink as a tower. */
export const INK_RAIN: Spell = { id: 'ink-rain', name: 'Tintenregen', word: 'tintenregen', damage: 30, cooldownMs: 25_000, cost: 40 };
