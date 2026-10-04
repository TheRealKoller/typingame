import { expect, it } from 'vitest';
import { practiceLevel } from './library';

/** Health of each golem kind in the order its waves come. */
function healthByKind(section: number): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const { kind } of practiceLevel(section).waves) (result[kind.id] ??= []).push(kind.health);
  return result;
}

it('makes the golems of each kind tougher from wave to wave', () => {
  for (const section of [1, 2, 3]) {
    for (const [id, health] of Object.entries(healthByKind(section))) {
      expect(health, `${id} in section ${section}`).toEqual([...health].sort((a, b) => a - b));
      expect(new Set(health).size, `${id} in section ${section}`).toBe(health.length);
    }
  }
});

it('starts each section with tougher golems than the one before', () => {
  const first = [1, 2, 3].map((section) => practiceLevel(section).waves[0]!.kind.health);
  expect(first).toEqual([...first].sort((a, b) => a - b));
  expect(new Set(first).size).toBe(first.length);
});
