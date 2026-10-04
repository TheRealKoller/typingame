import { describe, expect, it } from 'vitest';
import { pickWord, type PracticeContext } from './practice';
import type { KeyStats } from './stats';

/** Deterministic uniform numbers in [0, 1) (mulberry32). */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pool = ['eis', 'keks', 'kaffee', 'essig', 'uhr', 'gurke', 'reis'];

function countPicks(keys: Record<string, KeyStats>, runs = 7000): Map<string, number> {
  const context: PracticeContext = { keys, random: seeded(1) };
  const counts = new Map<string, number>();
  for (let i = 0; i < runs; i++) {
    const word = pickWord(pool, [], context);
    if (word !== null) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

describe('pickWord', () => {
  it('picks words with a weak key more often', () => {
    // "r" is missed often, every other key is fine.
    const counts = countPicks({ r: { hits: 20, misses: 10 }, e: { hits: 50, misses: 0 }, s: { hits: 50, misses: 0 } });
    const withR = ['uhr', 'gurke', 'reis'].map((word) => counts.get(word) ?? 0);
    const withoutR = ['eis', 'keks', 'kaffee', 'essig'].map((word) => counts.get(word) ?? 0);
    expect(Math.min(...withR)).toBeGreaterThan(2 * Math.max(...withoutR));
  });

  it('keeps the choice balanced without mistakes', () => {
    const counts = countPicks({ e: { hits: 50, misses: 0 }, r: { hits: 30, misses: 0 } });
    const expected = 7000 / pool.length;
    for (const word of pool) {
      expect(counts.get(word)).toBeGreaterThan(expected * 0.85);
      expect(counts.get(word)).toBeLessThan(expected * 1.15);
    }
  });

  it('never picks a shown word or one that forms a prefix pair with it', () => {
    const context: PracticeContext = { keys: {}, random: seeded(3) };
    for (let i = 0; i < 200; i++) {
      expect(pickWord(['da', 'dada', 'jaja', 'lala'], ['dada', 'lala'], context)).toBe('jaja');
    }
    expect(pickWord(['da', 'dada'], ['dada'], context)).toBeNull();
  });
});
