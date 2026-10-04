import { describe, expect, it } from 'vitest';
import { CELLAR, RUIN, SHELLED_BEETLE, SILENT_WASP } from './journey';
import { PRACTICE_MAPS, type BattleMap } from './library';
import { distanceToPath, generateAshMap, generateWaves, LAYOUT, MARKED_FROM, SWIFT_FROM, seededRandom, siteFits, touchesPath, waveCount } from './mapgen';
import { SILENT_FIREBUG, SILENT_SCORPION } from './raid';

const FIXED_MAPS: readonly BattleMap[] = [...PRACTICE_MAPS, RUIN, CELLAR];
const GENERATED = Array.from({ length: 200 }, (_, seed) => generateAshMap(seededRandom(seed), 'test', 'Test'));

function expectSitesFit(map: BattleMap): void {
  expect(map.sites).toHaveLength(5);
  for (const site of map.sites) expect(siteFits(map.path, site.x, site.y), `site ${site.id} at ${site.x}, ${site.y}`).toBe(true);
}

describe('fixed maps', () => {
  it.each(FIXED_MAPS.map((map) => [map.name, map] as const))('%s keeps sites and their words off the path and above the desk', (_, map) => {
    expectSitesFit(map);
  });
});

describe('generated maps', () => {
  it('keep sites and their words off the path and above the desk', () => {
    for (const map of GENERATED) expectSitesFit(map);
  });

  it('lead from beyond the left edge to the ward circle, in straight runs that turn', () => {
    for (const map of GENERATED) {
      const { path } = map;
      expect(path[0]!.x).toBeLessThan(0);
      expect(path[path.length - 1]!.x).toBe(1150);
      for (let i = 1; i < path.length; i++) {
        const [from, to] = [path[i - 1]!, path[i]!];
        expect(from.x === to.x || from.y === to.y).toBe(true);
        expect(Math.max(from.y, to.y) + LAYOUT.pathHalf).toBeLessThan(LAYOUT.deskTop);
      }
    }
  });

  it('put every site within reach of the path, apart from the others', () => {
    for (const map of GENERATED) {
      for (const site of map.sites) {
        expect(distanceToPath(map.path, site.x, site.y)).toBeLessThan(150);
        for (const other of map.sites) {
          if (other !== site) expect(Math.hypot(site.x - other.x, site.y - other.y)).toBeGreaterThanOrEqual(150);
        }
      }
    }
  });

  it('keep trees and rocks off the path', () => {
    for (const map of GENERATED) {
      for (const prop of map.props) expect(touchesPath(map.path, prop.x, prop.y + 4, 26, 26), `${prop.kind} at ${prop.x}, ${prop.y}`).toBe(false);
    }
  });
});

describe('generated waves', () => {
  const foes = { small: SILENT_SCORPION, large: SILENT_FIREBUG, swift: SILENT_WASP, armored: SHELLED_BEETLE };

  it('grow tougher from wave to wave and with the difficulty', () => {
    for (const difficulty of [1, 2, 3, 4]) {
      const waves = generateWaves(seededRandom(difficulty), difficulty, foes);
      expect(waves).toHaveLength(waveCount(difficulty));
      const health = waves.flatMap((wave) => wave.filter((squad) => squad.kind.id === 'scorpion').map((squad) => squad.kind.health));
      expect(health).toEqual([...health].sort((a, b) => a - b));
    }
    const first = [1, 2, 3, 4].map((difficulty) => generateWaves(seededRandom(1), difficulty, foes)[0]![0]!.kind.health);
    expect(new Set(first).size).toBe(first.length);
    expect(first).toEqual([...first].sort((a, b) => a - b));
  });

  it('let enemies carry words only at later places', () => {
    const marked = (difficulty: number) => generateWaves(seededRandom(3), difficulty, foes).flat().some((squad) => squad.markEvery);
    expect([1, 2, 3, 4].map(marked)).toEqual([1, 2, 3, 4].map((difficulty) => difficulty >= MARKED_FROM));
    expect(marked(1)).toBe(false);
  });

  it('send large enemies only from the second place on, never in the first wave', () => {
    const kinds = (difficulty: number) => generateWaves(seededRandom(7), difficulty, foes).map((wave) => wave.map((squad) => squad.kind.id));
    expect(kinds(1).flat()).not.toContain('firebug');
    for (const difficulty of [2, 3, 4]) {
      expect(kinds(difficulty)[0]).toEqual(['scorpion']);
      expect(kinds(difficulty).flat()).toContain('firebug');
    }
  });

  it('bring swift swarms from the second place on, and armored enemies that always glow in the last wave of later places', () => {
    for (const difficulty of [1, 2, 3, 4]) {
      const waves = generateWaves(seededRandom(5), difficulty, foes);
      const swift = waves.flat().filter((squad) => squad.kind.id === SILENT_WASP.id);
      const armored = waves.map((wave) => wave.filter((squad) => squad.kind.id === SHELLED_BEETLE.id));
      expect(swift.length > 0, `swift at ${difficulty}`).toBe(difficulty >= SWIFT_FROM);
      expect(armored.flat().length > 0, `armored at ${difficulty}`).toBe(difficulty >= MARKED_FROM);
      expect(armored.slice(0, -1).flat()).toEqual([]);
      for (const squad of armored.flat()) expect(squad.markEvery).toBe(1);
    }
  });
});
