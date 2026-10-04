import { describe, expect, it } from 'vitest';
import { practiceLevel } from '../content/library';
import { stageSetup } from '../content/tutorial';
import { TypingEngine } from '../typing/engine';
import { Battle } from './battle';
import { Commands } from './commands';

const LEVEL_1 = practiceLevel(1);
/** Home row with g and h: the crossbow is built with »jagd«. */
const { words: WORDS, towers } = stageSetup(1);
const CROSSBOW = towers[0]!;

function setup(ink = LEVEL_1.ink) {
  const battle = new Battle({ ...LEVEL_1, ink });
  const commands = new Commands(battle, [CROSSBOW], WORDS, { keys: {}, random: () => 0.5 });
  return { battle, commands };
}

function hasPrefixPair(words: readonly string[]): boolean {
  return words.some((word, i) => words.some((other, j) => i !== j && other.startsWith(word)));
}

describe('Commands', () => {
  it('gives every build site its own word, apart from keywords', () => {
    const { battle, commands } = setup();
    const siteWords = battle.level.sites.map((site) => commands.siteWord(site));

    expect(new Set(siteWords).size).toBe(battle.level.sites.length);
    expect(siteWords).not.toContain(CROSSBOW.keyword);
    expect(commands.words).toEqual(siteWords);
    expect(hasPrefixPair(commands.words)).toBe(false);
  });

  it('selects a site by its word and builds there with the keyword', () => {
    const { battle, commands } = setup();
    const site = battle.level.sites[2]!;

    expect(commands.complete(commands.siteWord(site)!)).toEqual({ type: 'select', site });
    expect(commands.words).toEqual([CROSSBOW.keyword]);
    expect(commands.complete(CROSSBOW.keyword)).toEqual({ type: 'build', site, tower: CROSSBOW });

    expect(battle.towerAt(site)?.kind).toBe(CROSSBOW);
    expect(battle.ink).toBe(LEVEL_1.ink - CROSSBOW.cost);
    expect(commands.selected).toBeNull();
    expect(commands.siteWord(site)).toBeNull();
    expect(commands.words).toHaveLength(LEVEL_1.sites.length - 1);
  });

  it('releases the site when the ink does not suffice', () => {
    const { battle, commands } = setup(CROSSBOW.cost - 1);
    const site = battle.level.sites[0]!;
    commands.complete(commands.siteWord(site)!);

    expect(commands.complete(CROSSBOW.keyword)).toEqual({ type: 'tooExpensive', site, tower: CROSSBOW });
    expect(commands.selected).toBeNull();
    expect(commands.words).toHaveLength(LEVEL_1.sites.length);
    expect(battle.towers).toEqual([]);
  });

  it('returns to the site words when the selection is cancelled', () => {
    const { battle, commands } = setup();
    commands.complete(commands.siteWord(battle.level.sites[0]!)!);

    commands.cancel();

    expect(commands.selected).toBeNull();
    expect(commands.words).toHaveLength(LEVEL_1.sites.length);
  });

  it('works through the typing engine from the first keystroke', () => {
    const { battle, commands } = setup();
    const engine = new TypingEngine(commands.words);
    const site = battle.level.sites[1]!;

    for (const word of [commands.siteWord(site)!, CROSSBOW.keyword]) {
      for (const char of word) {
        for (const event of engine.type(char)) {
          if (event.type === 'complete') commands.complete(event.word);
        }
      }
      engine.setWords(commands.words);
    }

    expect(battle.towerAt(site)).toBeDefined();
  });
});
