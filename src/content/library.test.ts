import { describe, expect, it } from 'vitest';
import { PRACTICE_MAPS, practiceLevel, practiceMap, type PracticeMap } from './library';

/** Health of each golem kind in the order its waves come. */
function healthByKind(section: number): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const { kind } of practiceLevel(section).waves.flat()) (result[kind.id] ??= []).push(kind.health);
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
  const first = [1, 2, 3].map((section) => practiceLevel(section).waves[0]![0]!.kind.health);
  expect(first).toEqual([...first].sort((a, b) => a - b));
  expect(new Set(first).size).toBe(first.length);
});

describe('practice maps', () => {
  const PATH_HALF = 32;
  const SITE_HALF = 28;
  /** Word labels sit 52 px above a site and are about this wide and tall. */
  const LABEL = { above: 52, halfWidth: 60, halfHeight: 18 };

  function nearPath(map: PracticeMap, x: number, y: number, margin: number): boolean {
    return map.path.slice(1).some((to, i) => {
      const from = map.path[i]!;
      const left = Math.min(from.x, to.x) - PATH_HALF - margin;
      const right = Math.max(from.x, to.x) + PATH_HALF + margin;
      const top = Math.min(from.y, to.y) - PATH_HALF - margin;
      const bottom = Math.max(from.y, to.y) + PATH_HALF + margin;
      return x >= left && x <= right && y >= top && y <= bottom;
    });
  }

  it.each(PRACTICE_MAPS.map((map) => [map.name, map] as const))('%s keeps sites and their words off the path and above the desk', (_, map) => {
    expect(map.sites).toHaveLength(5);
    for (const site of map.sites) {
      expect(nearPath(map, site.x, site.y, SITE_HALF), `site ${site.id}`).toBe(false);
      expect(nearPath(map, site.x, site.y - LABEL.above, LABEL.halfHeight), `word of site ${site.id}`).toBe(false);
      expect(site.y + SITE_HALF, `site ${site.id}`).toBeLessThan(470);
      expect(site.y - LABEL.above - LABEL.halfHeight, `word of site ${site.id}`).toBeGreaterThan(0);
    }
  });

  it('take turns, starting with the reading room', () => {
    expect([0, 1, 2, 3].map((round) => practiceMap(round).id)).toEqual(['reading-room', 'archive', 'courtyard', 'reading-room']);
  });
});
