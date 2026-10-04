import { describe, expect, it } from 'vitest';
import { CROSSBOW, FLOOD_WORD, LEVEL_1 } from '../content/level1';
import { HOME_ROW_WORDS } from '../content/words';
import { TypingEngine } from '../typing/engine';
import { Battle } from './battle';
import { Commands } from './commands';

function setup(ink = LEVEL_1.ink) {
  const battle = new Battle({ ...LEVEL_1, ink });
  const commands = new Commands(battle, [CROSSBOW], FLOOD_WORD, HOME_ROW_WORDS, { keys: {}, random: () => 0.5 });
  return { battle, commands };
}

function hasPrefixPair(words: readonly string[]): boolean {
  return words.some((word, i) => words.some((other, j) => i !== j && other.startsWith(word)));
}

describe('Commands', () => {
  it('gives every build site its own word, apart from keywords and the flood word', () => {
    const { battle, commands } = setup();
    const siteWords = battle.level.sites.map((site) => commands.siteWord(site));

    expect(new Set(siteWords).size).toBe(battle.level.sites.length);
    expect(siteWords).not.toContain(CROSSBOW.keyword);
    expect(siteWords).not.toContain(FLOOD_WORD);
    expect(commands.words).toEqual([FLOOD_WORD, ...siteWords]);
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
    expect(commands.words).toHaveLength(LEVEL_1.sites.length);
  });

  it('keeps the site selected when the ink does not suffice', () => {
    const { battle, commands } = setup(CROSSBOW.cost - 1);
    const site = battle.level.sites[0]!;
    commands.complete(commands.siteWord(site)!);

    expect(commands.complete(CROSSBOW.keyword)).toEqual({ type: 'tooExpensive', site, tower: CROSSBOW });
    expect(commands.selected).toBe(site);
    expect(battle.towers).toEqual([]);
  });

  it('returns to the site words when the selection is cancelled', () => {
    const { battle, commands } = setup();
    commands.complete(commands.siteWord(battle.level.sites[0]!)!);

    commands.cancel();

    expect(commands.selected).toBeNull();
    expect(commands.words).toContain(FLOOD_WORD);
  });

  it('ends the flood with the flood word and hides it during the ebb', () => {
    const { battle, commands } = setup();

    expect(commands.complete(FLOOD_WORD)).toEqual({ type: 'endFlood' });
    expect(battle.phase).toBe('ebb');
    expect(commands.words).not.toContain(FLOOD_WORD);
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
