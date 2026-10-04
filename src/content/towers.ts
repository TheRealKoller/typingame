import type { TowerKind } from '../battle/level';

/** The crossbow tower (Spire tower 01); its keyword depends on the unlocked keys, see `tutorial.ts`. */
export const CROSSBOW: TowerKind = { id: 'tower-01', keyword: 'jagd', cost: 50, range: 170, damage: 10, cooldownMs: 800 };
