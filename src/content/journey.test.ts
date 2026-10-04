import { describe, expect, it } from 'vitest';
import { Battle } from '../battle/battle';
import { FIRST_POINT, journeyLevel, pointState, WORLD_LINKS, WORLD_POINTS } from './journey';
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

  it.each(WORLD_POINTS.map((point) => [point.id, point] as const))('makes %s winnable by building towers with the ink at hand', (_, point) => {
    const battle = new Battle(journeyLevel(point));
    for (let step = 0; step < 100_000 && battle.phase !== 'won' && battle.phase !== 'lost'; step++) {
      const free = battle.level.sites.find((site) => !battle.towerAt(site));
      if (free && battle.ink >= CROSSBOW.cost) battle.build(free, CROSSBOW);
      battle.endFlood();
      battle.update(100);
    }
    expect(battle.phase).toBe('won');
  });
});
