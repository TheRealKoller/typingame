import { describe, expect, it } from 'vitest';
import { GRAMMAR } from '../content/lexicon';
import { practiceLevel } from '../content/library';
import { allKeysSetup, stageSetup } from '../content/tutorial';
import { TypingEngine } from '../typing/engine';
import { Battle } from './battle';
import { Commands } from './commands';
import type { Spell } from './level';
import { read } from './sentence';

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

describe('enemy words', () => {
  function withGolems() {
    const level = { ...LEVEL_1, waves: [[{ kind: LEVEL_1.waves[0]![0]!.kind, count: 6, spacingMs: 100, markEvery: 2 }]] };
    const battle = new Battle(level);
    const commands = new Commands(battle, [CROSSBOW], WORDS, { keys: {}, random: () => 0.5 });
    battle.endFlood();
    for (let i = 0; i < 6; i++) battle.update(100);
    commands.refresh();
    return { battle, commands };
  }

  it('gives every glowing enemy its own word, clear of site words and keywords', () => {
    const { battle, commands } = withGolems();
    const enemyWords = battle.enemies.map((enemy) => commands.enemyWord(enemy));

    expect(enemyWords.filter((word) => word !== null)).toHaveLength(3);
    expect(enemyWords.filter((_, i) => !battle.enemies[i]!.marked)).toEqual([null, null, null]);
    expect(hasPrefixPair([...commands.words, CROSSBOW.keyword])).toBe(false);
  });

  it('strikes the enemy whose word is typed, also while a site is selected', () => {
    const { battle, commands } = withGolems();
    const target = battle.enemies.find((enemy) => enemy.marked)!;
    commands.complete(commands.siteWord(battle.level.sites[0]!)!);

    expect(commands.complete(commands.enemyWord(target)!)).toEqual({ type: 'strike', enemy: target, defeated: true });
    expect(battle.enemies).not.toContain(target);
    expect(commands.selected).toBe(battle.level.sites[0]);
  });

  it('drops the word of an enemy that is gone', () => {
    const { battle, commands } = withGolems();
    const target = battle.enemies.find((enemy) => enemy.marked)!;
    const word = commands.enemyWord(target)!;
    battle.strike(target);
    commands.refresh();

    expect(commands.words).not.toContain(word);
  });
});

describe('spells', () => {
  const RAIN: Spell = { id: 'rain', name: 'Regen', word: 'tintenregen', damage: 1000, cooldownMs: 5000, cost: 40 };

  function withSpell(ink = LEVEL_1.ink) {
    const battle = new Battle({ ...LEVEL_1, ink });
    const commands = new Commands(battle, [CROSSBOW], allKeysSetup().words, { keys: {}, random: () => 0.5 }, [RAIN]);
    return { battle, commands };
  }

  it('offer the spell word while a wave advances and the spell is ready, clear of the site words', () => {
    const { battle, commands } = withSpell();
    expect(commands.words).not.toContain(RAIN.word);
    battle.endFlood();
    expect(commands.words).toContain(RAIN.word);
    expect(hasPrefixPair(commands.words)).toBe(false);
  });

  it('cast the spell when its word is typed, and take the word away until it is ready again', () => {
    const { battle, commands } = withSpell();
    battle.endFlood();
    battle.update(100);
    const before = [...battle.enemies];

    const command = commands.complete(RAIN.word);

    expect(command).toEqual({ type: 'cast', spell: RAIN, hits: before.map((enemy) => ({ enemy, health: 0, defeated: true })) });
    expect(commands.words).not.toContain(RAIN.word);
  });

  it('keep the spell word back while the ink does not pay for it', () => {
    const { battle, commands } = withSpell(RAIN.cost - 1);
    battle.endFlood();
    expect(commands.words).not.toContain(RAIN.word);
  });
});

describe('sentences', () => {
  const word = (text: string) => GRAMMAR.lexicon.find((lexeme) => lexeme.word === text)!;

  function withGrammar(ink = 200) {
    const battle = new Battle({ ...LEVEL_1, ink });
    const commands = new Commands(battle, [], allKeysSetup().words, { keys: {}, random: () => 0.5 }, [], GRAMMAR);
    const site = battle.level.sites[0]!;
    commands.complete(commands.siteWord(site)!);
    return { battle, commands, site };
  }

  it('offer the words of the ring at a selected site, one each, and only those that fit', () => {
    const { commands } = withGrammar();
    expect(commands.words).toEqual(GRAMMAR.lexicon.map((lexeme) => lexeme.word));

    expect(commands.complete('eisnadel')).toMatchObject({ type: 'compose' });

    // No second base word, no fire next to frost, and no word twice.
    expect(commands.words).not.toContain('jagd');
    expect(commands.words).not.toContain('eisnadel');
    expect(commands.words).not.toContain('flammende');
    expect(commands.ring.find((option) => option.lexeme.word === 'flammende')?.fit).toBe('conflict');
    expect(commands.complete('flammende')).toBeNull();
    expect(hasPrefixPair(commands.words)).toBe(false);
  });

  it('build the tower the sentence describes on Enter, for the ink of all its words', () => {
    const { battle, commands, site } = withGrammar();
    commands.complete('wilde');
    commands.complete('jagd');

    const command = commands.confirm();

    expect(command).toMatchObject({ type: 'build', site, tower: { name: 'wilde jagd', id: 'tower-01' } });
    expect(battle.towerAt(site)?.kind.cooldownMs).toBeLessThan(800);
    expect(battle.ink).toBe(200 - word('wilde').cost - word('jagd').cost);
    expect(commands.selected).toBeNull();
  });

  it('grow a built tower by more words, paying only for the new ones', () => {
    const { battle, commands, site } = withGrammar();
    commands.complete('jagd');
    commands.confirm();
    const ink = battle.ink;

    commands.complete(commands.siteWord(site)!);
    expect(commands.words).not.toContain('viper');
    commands.complete('im morgengrauen');
    expect(commands.preview).toMatchObject({ before: { name: 'jagd' }, after: { name: 'jagd im morgengrauen', critFirst: 3 }, cost: word('im morgengrauen').cost });

    expect(commands.confirm()).toMatchObject({ type: 'upgrade', site });
    expect(battle.ink).toBe(ink - word('im morgengrauen').cost);
    expect(read(commands.sentence(site))).toBe('jagd im morgengrauen');
  });

  it('keep a sentence without a base word open, and let words be taken back or dropped', () => {
    const { battle, commands, site } = withGrammar();
    commands.complete('wilde');

    expect(commands.confirm()).toEqual({ type: 'incomplete', site });
    expect(commands.selected).toBe(site);

    expect(commands.removeLast()).toBe(true);
    expect(commands.draft).toEqual([]);
    commands.complete('weite');
    commands.cancel();
    expect([commands.draft, commands.selected, battle.towers]).toEqual([[], null, []]);
  });

  it('grey out the words the ink cannot pay for, counting the words already typed', () => {
    const { commands } = withGrammar(60);
    commands.complete('jagd');

    // 20 ink left: only words up to 20 ink can still join.
    const expensive = commands.ring.filter((option) => option.fit === 'expensive').map((option) => option.lexeme.word);
    expect(expensive).toEqual(GRAMMAR.lexicon.filter((lexeme) => lexeme.role !== 'base' && lexeme.cost > 20).map((lexeme) => lexeme.word));
    for (const text of expensive) expect(commands.words).not.toContain(text);
  });

  it('take the site word away once the sentence is as long as it may grow', () => {
    const { commands, site } = withGrammar(500);
    for (const text of ['wilde', 'schwere', 'jagd', 'der viper', 'um mitternacht']) commands.complete(text);
    commands.confirm();
    expect(commands.siteWord(site)).toBeNull();
  });
});
