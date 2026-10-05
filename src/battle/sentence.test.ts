import { describe, expect, it } from 'vitest';
import { compose, cost, fit, read, type Grammar, type Lexeme } from './sentence';

const HUNT: Lexeme = { word: 'jagd', role: 'base', cost: 40, note: '', tower: { id: 'bow', name: 'Pfeil', range: 170, damage: 10, cooldownMs: 800 } };
const NEEDLE: Lexeme = {
  word: 'eisnadel',
  role: 'base',
  cost: 45,
  element: 'frost',
  note: '',
  tower: { id: 'ice', name: 'Frost', range: 140, damage: 4, cooldownMs: 900, slow: { factor: 0.5, durationMs: 1500 } },
};
const WILD: Lexeme = { word: 'wilde', role: 'trait', position: 'before', cost: 25, note: '', effect: { cooldownFactor: 0.5 } };
const HEAVY: Lexeme = { word: 'schwere', role: 'trait', position: 'before', cost: 25, note: '', effect: { damage: 2, damageFactor: 2 } };
const FROSTY: Lexeme = { word: 'frostige', role: 'trait', position: 'before', cost: 25, element: 'frost', note: '', effect: { slow: { factor: 0.6, durationMs: 2500 } } };
const FLAMING: Lexeme = { word: 'flammende', role: 'trait', position: 'before', cost: 30, element: 'fire', note: '', effect: { splash: 60 } };
const VIPER: Lexeme = { word: 'der viper', role: 'trait', position: 'after', cost: 25, element: 'poison', note: '', effect: { poison: { dps: 3, durationMs: 2500 } } };
const DAWN: Lexeme = { word: 'im morgengrauen', role: 'time', position: 'after', cost: 30, note: '', effect: { critFirst: 3 } };
const MIDNIGHT: Lexeme = { word: 'um mitternacht', role: 'time', position: 'after', cost: 30, note: '', effect: { critEvery: { every: 4, factor: 2 } } };

const GRAMMAR: Grammar = {
  lexicon: [HUNT, NEEDLE, WILD, HEAVY, FROSTY, FLAMING, VIPER, DAWN, MIDNIGHT],
  conflicts: [['fire', 'frost']],
  maxWords: 4,
};

describe('fit', () => {
  it('takes one base word, one time and each word once', () => {
    expect(fit(GRAMMAR, [HUNT], NEEDLE)).toBe('base');
    expect(fit(GRAMMAR, [DAWN], MIDNIGHT)).toBe('time');
    expect(fit(GRAMMAR, [WILD], WILD)).toBe('used');
    expect(fit(GRAMMAR, [WILD], HUNT)).toBe('ok');
  });

  it('keeps clashing elements apart, whichever comes first, and lets others meet', () => {
    expect(fit(GRAMMAR, [NEEDLE], FLAMING)).toBe('conflict');
    expect(fit(GRAMMAR, [FLAMING], FROSTY)).toBe('conflict');
    expect(fit(GRAMMAR, [NEEDLE], VIPER)).toBe('ok');
  });

  it('stops a sentence at its longest', () => {
    expect(fit(GRAMMAR, [WILD, HEAVY, HUNT, VIPER], DAWN)).toBe('full');
  });
});

describe('read', () => {
  it('puts traits before the base word, the others after it and the time last, whatever order they were typed in', () => {
    expect(read([HUNT, DAWN, VIPER, WILD])).toBe('wilde jagd der viper im morgengrauen');
    expect(read([HEAVY, HUNT, WILD])).toBe('schwere wilde jagd');
  });
});

describe('compose', () => {
  it('needs a base word', () => {
    expect(compose([WILD, DAWN])).toBeNull();
  });

  it('builds the base tower and lets every word change it, for the ink of all words', () => {
    const tower = compose([WILD, HEAVY, HUNT, DAWN])!;

    expect(tower).toMatchObject({
      id: 'bow',
      name: 'wilde schwere jagd im morgengrauen',
      cost: cost([WILD, HEAVY, HUNT, DAWN]),
      damage: (10 + 2) * 2,
      cooldownMs: 400,
      range: 170,
      critFirst: 3,
      level: 3,
    });
  });

  it('keeps the stronger slowdown and the longer duration when frost meets frost', () => {
    expect(compose([FROSTY, NEEDLE])!.slow).toEqual({ factor: 0.5, durationMs: 2500 });
  });

  it('grows the tower stage with the words', () => {
    expect([[HUNT], [WILD, HUNT], [WILD, HUNT, VIPER]].map((words) => compose(words)!.level)).toEqual([1, 2, 3]);
  });
});
