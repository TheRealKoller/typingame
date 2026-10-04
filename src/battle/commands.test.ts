import { describe, expect, it } from 'vitest';
import { practiceLevel } from '../content/library';
import { CROSSBOW as UPGRADABLE } from '../content/towers';
import { allKeysSetup, stageSetup } from '../content/tutorial';
import { TypingEngine } from '../typing/engine';
import { Battle } from './battle';
import { Commands } from './commands';
import type { Spell } from './level';

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

describe('upgrades', () => {
  const { words: ALL_WORDS } = allKeysSetup();

  function built(ink: number) {
    const battle = new Battle({ ...LEVEL_1, ink });
    const commands = new Commands(battle, [UPGRADABLE], ALL_WORDS, { keys: {}, random: () => 0.5 });
    const site = battle.level.sites[0]!;
    const word = commands.siteWord(site)!;
    commands.complete(word);
    commands.complete(UPGRADABLE.keyword);
    return { battle, commands, site, word };
  }

  it('keeps the site word on a tower while it can be upgraded, and offers only the upgrade word there', () => {
    const { commands, site, word } = built(1000);

    expect(commands.siteWord(site)).toBe(word);
    expect(commands.complete(word)).toEqual({ type: 'select', site });
    expect(commands.words).toEqual([UPGRADABLE.upgrade!.keyword]);
  });

  it('upgrades stage by stage for ink, and the tower loses its word at the last stage', () => {
    const { battle, commands, site, word } = built(1000);
    const second = UPGRADABLE.upgrade!;
    const third = second.upgrade!;

    commands.complete(word);
    expect(commands.complete(second.keyword)).toEqual({ type: 'upgrade', site, tower: second });
    commands.complete(word);
    expect(commands.complete(third.keyword)).toEqual({ type: 'upgrade', site, tower: third });

    expect(battle.towerAt(site)?.kind).toBe(third);
    expect(battle.ink).toBe(1000 - UPGRADABLE.cost - second.cost - third.cost);
    expect(commands.siteWord(site)).toBeNull();
    expect(commands.words).not.toContain(word);
  });

  it('leaves the tower as it is when the ink does not suffice', () => {
    const { battle, commands, site, word } = built(UPGRADABLE.cost + UPGRADABLE.upgrade!.cost - 1);

    commands.complete(word);
    expect(commands.complete(UPGRADABLE.upgrade!.keyword)).toEqual({ type: 'tooExpensive', site, tower: UPGRADABLE.upgrade });
    expect(battle.towerAt(site)?.kind).toBe(UPGRADABLE);
    expect(commands.selected).toBeNull();
  });

  it('never uses an upgrade word as a site word', () => {
    const { battle, commands } = built(1000);
    const upgradeWords = [UPGRADABLE.upgrade!.keyword, UPGRADABLE.upgrade!.upgrade!.keyword];
    for (const site of battle.level.sites) expect(upgradeWords).not.toContain(commands.siteWord(site));
  });
});

describe('spells', () => {
  const RAIN: Spell = { id: 'rain', name: 'Regen', word: 'tintenregen', damage: 1000, cooldownMs: 5000 };

  function withSpell() {
    const battle = new Battle(LEVEL_1);
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
});
