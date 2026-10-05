import type { Grammar, Lexeme } from '../battle/sentence';

/**
 * The words of the tower sentences on the journey (experiment #125). The base
 * words are all feminine, so one form of each adjective fits every one of them:
 * »wilde jagd«, »wilde eisnadel«, »wilde viper«.
 */
export const LEXICON: readonly Lexeme[] = [
  // Base words: the kind of tower.
  {
    word: 'jagd',
    role: 'base',
    cost: 40,
    note: 'Pfeile',
    tower: { id: 'tower-01', name: 'Pfeil', range: 170, damage: 10, cooldownMs: 800 },
  },
  {
    word: 'eisnadel',
    role: 'base',
    cost: 40,
    element: 'frost',
    note: 'bremst',
    tower: { id: 'tower-02', name: 'Frost', range: 150, damage: 4, cooldownMs: 1000, splash: 45, slow: { factor: 0.45, durationMs: 2000 } },
  },
  {
    word: 'viper',
    role: 'base',
    cost: 40,
    element: 'poison',
    note: 'Gift',
    tower: { id: 'tower-03', name: 'Gift', range: 160, damage: 4, cooldownMs: 1000, poison: { dps: 5, durationMs: 3000 } },
  },
  // Traits before the base word.
  { word: 'wilde', role: 'trait', position: 'before', cost: 30, note: 'schneller', effect: { cooldownFactor: 0.75 } },
  { word: 'schwere', role: 'trait', position: 'before', cost: 30, note: 'stärker, langsamer', effect: { damageFactor: 1.5, cooldownFactor: 1.15 } },
  { word: 'weite', role: 'trait', position: 'before', cost: 20, note: 'Reichweite', effect: { range: 40 } },
  { word: 'frostige', role: 'trait', position: 'before', cost: 15, element: 'frost', note: 'bremst', effect: { slow: { factor: 0.6, durationMs: 1200 } } },
  { word: 'flammende', role: 'trait', position: 'before', cost: 30, element: 'fire', note: 'Fläche', effect: { damage: 3, splash: 60 } },
  // Traits after the base word.
  { word: 'der viper', role: 'trait', position: 'after', cost: 25, element: 'poison', note: 'vergiftet', effect: { poison: { dps: 2, durationMs: 2500 } } },
  // Times: always last.
  { word: 'im morgengrauen', role: 'time', position: 'after', cost: 30, note: '1. Treffer kritisch', effect: { critFirst: 3 } },
  { word: 'um mitternacht', role: 'time', position: 'after', cost: 30, note: 'jeder 4. kritisch', effect: { critEvery: { every: 4, factor: 2.5 } } },
];

export const GRAMMAR: Grammar = {
  lexicon: LEXICON,
  // Fire and frost cancel each other out.
  conflicts: [['fire', 'frost']],
  maxWords: 5,
};
