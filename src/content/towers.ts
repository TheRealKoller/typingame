import type { TowerKind } from '../battle/level';

/** The crossbow tower (Spire tower 01): quick single bolts. Its keyword depends on the unlocked keys, see `tutorial.ts`. */
export const CROSSBOW: TowerKind = { id: 'tower-01', name: 'Armbrust', keyword: 'jagd', cost: 50, range: 170, damage: 10, cooldownMs: 800 };

/** The ink slinger (Spire tower 03): slow, but its blot splashes every enemy near the target. */
export const INK_SLINGER: TowerKind = {
  id: 'tower-03',
  name: 'Tintenschleuder',
  keyword: 'klecks',
  cost: 70,
  range: 150,
  damage: 9,
  cooldownMs: 1500,
  splash: 70,
};

/** The frost crystal (Spire tower 02): weak hits that slow enemies down to half their speed. */
export const FROST_CRYSTAL: TowerKind = {
  id: 'tower-02',
  name: 'Frostkristall',
  keyword: 'frost',
  cost: 60,
  range: 140,
  damage: 3,
  cooldownMs: 900,
  slow: { factor: 0.5, durationMs: 1500 },
};
