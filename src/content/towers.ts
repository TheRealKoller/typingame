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
