import { describe, expect, it } from 'vitest';
import { Battle } from '../battle/battle';
import { FIRST_POINT, journeyBattle, pointState, WORLD_LINKS, WORLD_POINTS, type WorldPoint } from './journey';
import { seededRandom } from './mapgen';
import { CROSSBOW } from './towers';
import { allKeysSetup } from './tutorial';

describe('world map', () => {
  it('opens only the first point at the start of the journey', () => {
    const states = WORLD_POINTS.map((point) => [point.id, pointState(point.id, new Set())]);
    expect(Object.fromEntries(states)).toEqual({ ruin: 'open', smoke: 'locked', cellar: 'locked', embers: 'locked' });
  });

  it('opens the points linked to a freed one and keeps freed points playable', () => {
    const freed = new Set(['ruin', 'smoke']);
    const states = WORLD_POINTS.map((point) => [point.id, pointState(point.id, freed)]);
    expect(Object.fromEntries(states)).toEqual({ ruin: 'freed', smoke: 'freed', cellar: 'open', embers: 'open' });
  });

  it('can reach every point from the first one', () => {
    const reached = new Set([FIRST_POINT]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const [a, b] of WORLD_LINKS) {
        if (reached.has(a) !== reached.has(b)) {
          reached.add(reached.has(a) ? b : a);
          grew = true;
        }
      }
    }
    expect([...reached].sort()).toEqual(WORLD_POINTS.map((point) => point.id).sort());
  });

  it('labels the points with typeable words, none the start of another', () => {
    const { keys } = allKeysSetup();
    const words = WORLD_POINTS.map((point) => point.word);
    for (const word of words) expect([...word].every((char) => keys.includes(char)), word).toBe(true);
    expect(words.some((word, i) => words.some((other, j) => i !== j && other.startsWith(word)))).toBe(false);
  });
});

describe('battles of the journey', () => {
  const SEEDS = 40;

  /**
   * Plays the battle at `point` like a steady player: a tower on the next free
   * site whenever the ink allows, and, if `typing`, every glowing enemy struck
   * four seconds after it shows up. Returns the ward left, 0 if lost.
   */
  function play(point: WorldPoint, seed: number, typing: boolean): number {
    const battle = new Battle(journeyBattle(point, seededRandom(seed)).level);
    const shown = new Map<number, number>();
    for (let time = 0; time < 3_600_000 && battle.phase !== 'won' && battle.phase !== 'lost'; time += 100) {
      const free = battle.level.sites.find((site) => !battle.towerAt(site));
      if (free && battle.ink >= CROSSBOW.cost) battle.build(free, CROSSBOW);
      battle.endFlood();
      battle.update(100);
      for (const enemy of typing ? battle.enemies.filter((candidate) => candidate.marked) : []) {
        if (!shown.has(enemy.id)) shown.set(enemy.id, time);
        if (time - shown.get(enemy.id)! >= 4000) battle.strike(enemy);
      }
    }
    return battle.phase === 'won' ? battle.ward : 0;
  }

  function results(point: WorldPoint, typing: boolean): number[] {
    return Array.from({ length: SEEDS }, (_, i) => play(point, i + 1, typing));
  }

  it.each(WORLD_POINTS.map((point) => [point.id, point] as const))('makes %s winnable for a steady player, whatever map comes', (_, point) => {
    const won = results(point, true).filter((ward) => ward > 0).length;
    expect(won / SEEDS).toBeGreaterThanOrEqual(0.9);
  });

  it('grows harder from place to place', () => {
    const average = WORLD_POINTS.map((point) => results(point, true).reduce((sum, ward) => sum + ward, 0) / SEEDS);
    expect(average).toEqual([...average].sort((a, b) => b - a));
    expect(average[0]).toBeGreaterThan(average[average.length - 1]!);
  });

  it('needs typing at the last place: towers alone rarely hold', () => {
    const last = WORLD_POINTS[WORLD_POINTS.length - 1]!;
    const won = results(last, false).filter((ward) => ward > 0).length;
    expect(won / SEEDS).toBeLessThan(0.5);
  });
});
