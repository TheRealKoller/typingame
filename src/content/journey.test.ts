import { describe, expect, it } from 'vitest';
import { Battle } from '../battle/battle';
import { compose, cost, type Lexeme } from '../battle/sentence';
import { FIRST_POINT, journeyBattle, rewardsFor, pointState, WORLD_LINKS, WORLD_POINTS, type WorldPoint } from './journey';
import { LEXICON } from './lexicon';
import { seededRandom } from './mapgen';
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

describe('rewards', () => {
  it('hand out at least one book cart and one scroll in the ash fields', () => {
    const kinds = rewardsFor(new Set(WORLD_POINTS.map((point) => point.id))).map((reward) => reward.kind);
    expect(kinds).toContain('cart');
    expect(kinds).toContain('scroll');
  });

  it('let the journey start with the crossbow alone and add what the freed places brought', () => {
    const at = (freed: string[]) => journeyBattle(WORLD_POINTS[1]!, seededRandom(1), new Set(freed));
    expect(at([]).towers.map((tower) => tower.name)).toEqual(['Armbrust']);
    expect(at([]).spells).toEqual([]);
    const later = at(WORLD_POINTS.map((point) => point.id));
    const carts = rewardsFor(new Set(WORLD_POINTS.map((point) => point.id))).flatMap((reward) => (reward.kind === 'cart' ? [reward.tower] : []));
    const scrolls = rewardsFor(new Set(WORLD_POINTS.map((point) => point.id))).flatMap((reward) => (reward.kind === 'scroll' ? [reward.spell] : []));
    expect(later.towers.slice(1)).toEqual(carts);
    expect(later.spells).toEqual(scrolls);
  });
});

describe('battles of the journey', () => {
  const SEEDS = 40;

  /** What a simulated player writes, in order: a site and the words it adds to that site's sentence. */
  type Plan = readonly (readonly [site: number, words: readonly string[]])[];

  const word = (text: string) => LEXICON.find((lexeme) => lexeme.word === text)!;
  const everySite = (words: readonly string[]) => [0, 1, 2, 3, 4].map((site) => [site, words] as const);

  /** A tower on every site, arrows mixed with frost and poison, then words appended to all of them. */
  const STEADY: Plan = [
    ...['jagd', 'jagd', 'eisnadel', 'jagd', 'viper'].map((base, site) => [site, [base]] as const),
    ...[0, 1, 3].map((site) => [site, ['wilde']] as const),
    ...everySite(['im morgengrauen']),
    ...everySite(['weite']),
  ];
  /** Arrows on every site and nothing more: the plainest player, to see how hard each place is. */
  const ARROWS: Plan = everySite(['jagd']);

  /**
   * Plays the battle at `point` by `plan`: the next step whenever the ink
   * allows, and, if `typing`, every glowing enemy struck four seconds after it
   * shows up. Returns the ward left, 0 if lost.
   */
  function play(point: WorldPoint, seed: number, plan: Plan, typing: boolean): number {
    const battle = new Battle(journeyBattle(point, seededRandom(seed), new Set()).level);
    const sentences = new Map<number, Lexeme[]>();
    const shown = new Map<number, number>();
    let next = 0;
    for (let time = 0; time < 3_600_000 && battle.phase !== 'won' && battle.phase !== 'lost'; time += 100) {
      for (; next < plan.length; next++) {
        const [index, texts] = plan[next]!;
        const site = battle.level.sites[index]!;
        const words = texts.map(word);
        const sentence = [...(sentences.get(index) ?? []), ...words];
        const tower = compose(sentence)!;
        if (!(battle.towerAt(site) ? battle.reshape(site, tower, cost(words)) : battle.build(site, tower))) break;
        sentences.set(index, sentence);
      }
      battle.endFlood();
      battle.update(100);
      for (const enemy of typing ? battle.enemies.filter((candidate) => candidate.marked) : []) {
        if (!shown.has(enemy.id)) shown.set(enemy.id, time);
        if (time - shown.get(enemy.id)! >= 4000) battle.strike(enemy);
      }
    }
    return battle.phase === 'won' ? battle.ward : 0;
  }

  function results(point: WorldPoint, plan: Plan, typing: boolean): number[] {
    return Array.from({ length: SEEDS }, (_, i) => play(point, i + 1, plan, typing));
  }

  const winRate = (wards: readonly number[]) => wards.filter((ward) => ward > 0).length / wards.length;

  it.each(WORLD_POINTS.map((point) => [point.id, point] as const))('makes %s winnable for a steady player, whatever map comes', (_, point) => {
    expect(winRate(results(point, STEADY, true))).toBeGreaterThanOrEqual(0.9);
  });

  it('grows harder from place to place', () => {
    const average = WORLD_POINTS.map((point) => results(point, ARROWS, true).reduce((sum, ward) => sum + ward, 0) / SEEDS);
    expect(average).toEqual([...average].sort((a, b) => b - a));
    expect(average[0]).toBeGreaterThan(average[average.length - 1]!);
  });

  it('lets the first places be held by towers alone, but needs typing at the last place', () => {
    const [first, second] = WORLD_POINTS;
    const last = WORLD_POINTS[WORLD_POINTS.length - 1]!;
    expect(winRate(results(first!, STEADY, false))).toBeGreaterThanOrEqual(0.9);
    expect(winRate(results(second!, STEADY, false))).toBeGreaterThanOrEqual(0.9);
    expect(winRate(results(last, STEADY, false))).toBeLessThan(0.5);
  });

  it('makes every kind of tower hold the first places on its own, so none is useless', () => {
    for (const base of LEXICON.filter((lexeme) => lexeme.role === 'base')) {
      for (const point of WORLD_POINTS.slice(0, 2)) {
        expect(winRate(results(point, everySite([base.word]), true)), `${base.word} at ${point.id}`).toBeGreaterThanOrEqual(0.9);
      }
    }
  });

  it('pays off for appending words once every site holds a tower', () => {
    // Without typing the third place is close for arrows alone; the same towers with more words hold it clearly better.
    const cellar = WORLD_POINTS[2]!;
    const plain = results(cellar, ARROWS, false).reduce((sum, ward) => sum + ward, 0);
    const grown = results(cellar, [...ARROWS, ...everySite(['wilde']), ...everySite(['schwere'])], false).reduce((sum, ward) => sum + ward, 0);
    expect(grown).toBeGreaterThan(plain * 2);
  });
});
