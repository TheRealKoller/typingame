import { describe, expect, it } from 'vitest';
import { playOrder } from '../content/chapters';
import { visibleSections } from '../content/rooms';
import { chooseShown, pickWord, replaceTyped, SHOWN_WORDS, type PracticeContext } from './practice';
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

const kitchen = ['eis', 'keks', 'kaffee', 'essig', 'uhr', 'gurke', 'reis'];
const everyWord = new Set(kitchen);

function countPicks(keys: Record<string, KeyStats>, runs = 7000): Map<string, number> {
  const context: PracticeContext = { discovered: everyWord, keys, random: seeded(1) };
  const counts = new Map<string, number>();
  for (let i = 0; i < runs; i++) {
    const word = pickWord(kitchen, [], context);
    if (word !== null) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return counts;
}

function hasPrefixPair(words: readonly string[]): boolean {
  return words.some((word, i) => words.some((other, j) => i !== j && other.startsWith(word)));
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
    const expected = 7000 / kitchen.length;
    for (const word of kitchen) {
      expect(counts.get(word)).toBeGreaterThan(expected * 0.85);
      expect(counts.get(word)).toBeLessThan(expected * 1.15);
    }
  });

  it('prefers undiscovered words even over weak keys', () => {
    const context: PracticeContext = {
      discovered: new Set(['eis', 'keks', 'uhr']),
      keys: { r: { hits: 0, misses: 30 } },
      random: seeded(2),
    };
    for (let i = 0; i < 200; i++) {
      expect(pickWord(['eis', 'keks', 'uhr', 'kaffee'], [], context)).toBe('kaffee');
    }
  });

  it('never picks a shown word or one that forms a prefix pair with it', () => {
    const context: PracticeContext = { discovered: new Set(), keys: {}, random: seeded(3) };
    for (let i = 0; i < 200; i++) {
      expect(pickWord(['da', 'dada', 'jaja', 'lala'], ['dada', 'lala'], context)).toBe('jaja');
    }
    expect(pickWord(['da', 'dada'], ['dada'], context)).toBeNull();
  });
});

describe('replaceTyped', () => {
  const context: PracticeContext = { discovered: everyWord, keys: {}, random: seeded(4) };

  it('lets another word of the room take the place of the typed one', () => {
    const shown = ['eis', 'keks', 'kaffee', 'essig'];
    const next = replaceTyped(kitchen, shown, 'keks', context);
    expect(next).toHaveLength(SHOWN_WORDS);
    expect(next).not.toContain('keks');
    expect(next.filter((word) => word !== next[1])).toEqual(['eis', 'kaffee', 'essig']);
  });

  it('keeps the typed word when the room has no other word', () => {
    expect(replaceTyped(['eis', 'keks'], ['eis', 'keks'], 'eis', context)).toEqual(['eis', 'keks']);
  });
});

// Plays every section with random mistakes and checks what is on screen after each word.
it('never shows more than four words or a prefix pair in any section', () => {
  const random = seeded(5);
  for (const { chapter, index, section } of playOrder) {
    const pool = visibleSections(chapter, index).flatMap((s) => s.words.map((word) => word.text));
    const discovered = new Set<string>();
    const keys: Record<string, KeyStats> = {};
    const context: PracticeContext = { discovered, keys, random };
    let shown = chooseShown(pool, context);
    for (let round = 0; round < 50; round++) {
      expect(shown.length, section.id).toBe(Math.min(SHOWN_WORDS, pool.length));
      expect(hasPrefixPair(shown), `${section.id}: ${shown.join(', ')}`).toBe(false);
      const typed = shown[Math.floor(random() * shown.length)] ?? '';
      discovered.add(typed);
      for (const char of typed) {
        const before = keys[char] ?? { hits: 0, misses: 0 };
        keys[char] = random() < 0.2 ? { ...before, misses: before.misses + 1 } : { ...before, hits: before.hits + 1 };
      }
      shown = replaceTyped(pool, shown, typed, context);
    }
  }
});
