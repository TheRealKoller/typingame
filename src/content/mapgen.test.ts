import { describe, expect, it } from 'vitest';
import { CELLAR, RUIN, SHELLED_BEETLE, SILENT_WASP } from './journey';
import { MAP_SCALE, PRACTICE_MAPS, SHELF_BOTTOM, type BattleMap } from './library';
import {
  alongPath,
  coverage,
  distanceToPath,
  generateAshMap,
  generateWaves,
  LAYOUT,
  MARKED_FROM,
  MIN_COVERAGE,
  pathEnd,
  SITE_COUNT,
  SWIFT_FROM,
  seededRandom,
  siteFits,
  touchesPath,
  waveCount,
} from './mapgen';
import { SILENT_FIREBUG, SILENT_SCORPION } from './raid';

const GENERATED = Array.from({ length: 200 }, (_, seed) => generateAshMap(seededRandom(seed), 'test', 'Test'));
/** Every battle map follows the rules of #146: its scale, seven sites, none of them weak. */
const MAPS: readonly BattleMap[] = [...PRACTICE_MAPS, RUIN, CELLAR, ...GENERATED];

describe('battle maps', () => {
  it('are drawn at the map scale with seven sites, their words off the path and above the desk', () => {
    for (const map of MAPS) {
      expect(map.scale).toBe(MAP_SCALE);
      expect(map.sites).toHaveLength(SITE_COUNT);
      for (const site of map.sites) expect(siteFits(map.path, site.x, site.y, map.scale), `${map.name}: site ${site.id} at ${site.x}, ${site.y}`).toBe(true);
    }
  });

  it('keep indoor sites below the shelves on the back wall', () => {
    for (const map of MAPS.filter((candidate) => candidate.indoor)) {
      for (const site of map.sites) expect(site.y - LAYOUT.siteHalf * MAP_SCALE, `${map.name}: site ${site.id}`).toBeGreaterThanOrEqual(SHELF_BOTTOM);
    }
  });

  it('have no weak site: a tower anywhere reaches at least a tenth of the path', () => {
    for (const map of MAPS) {
      for (const site of map.sites) {
        expect(coverage(map.path, site.x, site.y, MAP_SCALE), `${map.name}: site ${site.id}`).toBeGreaterThanOrEqual(MIN_COVERAGE);
      }
    }
  });

  it('spread the sites along the path: two in each third, one near the ward circle, apart from each other', () => {
    for (const map of MAPS) {
      const thirds = [0, 0, 0];
      for (const site of map.sites) thirds[Math.min(Math.floor(alongPath(map.path, site.x, site.y) * 3), 2)]!++;
      expect(Math.min(...thirds), `${map.name}: sites per third ${thirds.join(', ')}`).toBeGreaterThanOrEqual(2);
      expect(map.sites.some((site) => alongPath(map.path, site.x, site.y) > 0.85), map.name).toBe(true);
      for (const site of map.sites) {
        for (const other of map.sites) {
          if (other !== site) expect(Math.hypot(site.x - other.x, site.y - other.y), `${map.name}: ${site.id}, ${other.id}`).toBeGreaterThanOrEqual(120);
        }
      }
    }
  });
});

describe('generated maps', () => {
  it('lead from beyond the left edge to the ward circle, in straight runs that turn', () => {
    for (const map of GENERATED) {
      const { path } = map;
      expect(path[0]!.x).toBeLessThan(0);
      expect(path[path.length - 1]!.x).toBe(pathEnd(MAP_SCALE));
      for (let i = 1; i < path.length; i++) {
        const [from, to] = [path[i - 1]!, path[i]!];
        expect(from.x === to.x || from.y === to.y).toBe(true);
        expect(Math.max(from.y, to.y) + LAYOUT.pathHalf * MAP_SCALE).toBeLessThan(LAYOUT.deskTop);
      }
    }
  });

  it('put every site within reach of the path', () => {
    for (const map of GENERATED) {
      for (const site of map.sites) expect(distanceToPath(map.path, site.x, site.y)).toBeLessThanOrEqual(110 * MAP_SCALE);
    }
  });

  it('keep trees and rocks off the path', () => {
    const s = MAP_SCALE;
    for (const map of GENERATED) {
      for (const prop of map.props) expect(touchesPath(map.path, prop.x, prop.y + 4 * s, 26 * s, 26 * s, s), `${prop.kind} at ${prop.x}, ${prop.y}`).toBe(false);
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
