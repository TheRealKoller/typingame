import type { TowerKind } from '../battle/level';

/** Builds a tower's stages from the last to the first, so each one knows its upgrade. */
function stages(base: Omit<TowerKind, 'level' | 'upgrade'>, upgrades: readonly Partial<TowerKind>[]): TowerKind {
  const all = [base, ...upgrades.map((changes, i) => ({ ...base, ...upgrades.slice(0, i).reduce((a, b) => ({ ...a, ...b }), {}), ...changes }))];
  return all.reduceRight<TowerKind | undefined>((next, stage, i) => ({ ...stage, level: i + 1, upgrade: next }), undefined)!;
}

/** The crossbow tower (Spire tower 01): quick single bolts. Its keyword depends on the unlocked keys, see `tutorial.ts`. */
export const CROSSBOW: TowerKind = stages({ id: 'tower-01', name: 'Armbrust', keyword: 'jagd', cost: 50, range: 170, damage: 10, cooldownMs: 800 }, [
  { name: 'Doppelarmbrust', keyword: 'bolzen', cost: 60, damage: 16, range: 180 },
  { name: 'Salvenarmbrust', keyword: 'salve', cost: 90, damage: 24, range: 190, cooldownMs: 700 },
]);

/** The ink slinger (Spire tower 03): slow, but its blot splashes every enemy near the target. */
export const INK_SLINGER: TowerKind = stages(
  { id: 'tower-03', name: 'Tintenschleuder', keyword: 'klecks', cost: 70, range: 150, damage: 9, cooldownMs: 1500, splash: 70 },
  [
    { name: 'Tintenwerfer', keyword: 'spritzer', cost: 70, damage: 14, splash: 80 },
    { name: 'Tintenflut', keyword: 'sintflut', cost: 100, damage: 20, splash: 90, cooldownMs: 1300 },
  ],
);

/** The frost crystal (Spire tower 02): weak hits that slow enemies down. */
export const FROST_CRYSTAL: TowerKind = stages(
  { id: 'tower-02', name: 'Frostkristall', keyword: 'frost', cost: 60, range: 140, damage: 3, cooldownMs: 900, slow: { factor: 0.5, durationMs: 1500 } },
  [
    { name: 'Raureifkristall', keyword: 'raureif', cost: 60, damage: 5, slow: { factor: 0.4, durationMs: 2000 } },
    { name: 'Gletscherkristall', keyword: 'gletscher', cost: 90, damage: 7, range: 160, slow: { factor: 0.3, durationMs: 2500 } },
  ],
);
