import { describe, expect, it } from 'vitest';
import { Battle } from '../battle/battle';
import { Commands } from '../battle/commands';
import { LEVEL_1 } from './level1';
import { keysUpTo, STAGES, stageIndex, stageSetup } from './tutorial';
import { WORDS } from './words';

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

function hasPrefixPair(words: readonly string[]): boolean {
  return words.some((word, i) => words.some((other, j) => i !== j && other.startsWith(word)));
}

describe('tutorial stages', () => {
  it('unlock every key once', () => {
    const keys = keysUpTo(STAGES.length - 1);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('only list words that can be typed by the end of the tutorial', () => {
    const keys = keysUpTo(STAGES.length - 1);
    expect(WORDS.filter((word) => ![...word].every((char) => keys.includes(char)))).toEqual([]);
  });

  it.each(STAGES.map((stage, index) => [stage.id, index] as const))(
    'stage %s practises its new keys and fills every build site without prefix pairs',
    (_, index) => {
      const setup = stageSetup(index);
      const stage = STAGES[index]!;
      for (const word of [...setup.words, setup.floodWord, ...setup.towers.map((tower) => tower.keyword)]) {
        expect([...word].filter((char) => !setup.keys.includes(char)), word).toEqual([]);
      }
      expect(setup.words.filter((word) => stage.newKeys.some((key) => word.includes(key))).length).toBeGreaterThanOrEqual(3);

      for (let seed = 1; seed <= 20; seed++) {
        const commands = new Commands(new Battle(LEVEL_1), setup.towers, setup.floodWord, setup.words, {
          keys: {},
          random: seeded(seed),
        });
        expect(hasPrefixPair(commands.words), commands.words.join(', ')).toBe(false);
      }
    },
  );

  it('falls back to the first stage for an unknown id', () => {
    expect(stageIndex('2c')).toBe(4);
    expect(stageIndex('kinderzimmer')).toBe(0);
  });
});
