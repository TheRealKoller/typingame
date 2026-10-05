import { describe, expect, it } from 'vitest';
import type { TowerKind } from '../battle/level';
import { compose, fit } from '../battle/sentence';
import { GRAMMAR, LEXICON } from './lexicon';
import { allKeysSetup } from './tutorial';

describe('lexicon', () => {
  it('uses only keys unlocked by the end of the tutorial', () => {
    const keys = new Set(allKeysSetup().keys);
    const untypeable = LEXICON.filter((lexeme) => [...lexeme.word].some((char) => !keys.has(char)));
    expect(untypeable.map((lexeme) => lexeme.word)).toEqual([]);
  });

  it('holds no two words where one begins the other, so every word in the ring can be finished', () => {
    const words = LEXICON.map((lexeme) => lexeme.word);
    const pairs = words.flatMap((word) => words.filter((other) => other !== word && other.startsWith(word)).map((other) => [word, other]));
    expect(pairs).toEqual([]);
  });

  it('lets every trait and time join every base word it does not clash with, so each builds a tower', () => {
    const bases = LEXICON.filter((lexeme) => lexeme.role === 'base');
    for (const base of bases) {
      for (const lexeme of LEXICON) {
        if (lexeme.role === 'base') continue;
        if (fit(GRAMMAR, [base], lexeme) !== 'ok') continue;
        expect(compose([base, lexeme]), `${base.word} + ${lexeme.word}`).not.toBeNull();
      }
    }
    // Fire and frost never meet.
    const frost = LEXICON.find((lexeme) => lexeme.word === 'eisnadel')!;
    const fire = LEXICON.find((lexeme) => lexeme.word === 'flammende')!;
    expect(fit(GRAMMAR, [frost], fire)).toBe('conflict');
  });

  it('makes an appended word worth less damage per ink than a second tower of the same kind', () => {
    // Damage per second on one target, poison included; area, slow and critical hits come on top and are checked by the battle simulation.
    const dps = (kind: TowerKind) => kind.damage / (kind.cooldownMs / 1000) + (kind.poison?.dps ?? 0);
    for (const base of LEXICON.filter((lexeme) => lexeme.role === 'base')) {
      const alone = compose([base])!;
      const perTower = dps(alone) / base.cost;
      for (const lexeme of LEXICON) {
        if (lexeme.role === 'base' || fit(GRAMMAR, [base], lexeme) !== 'ok') continue;
        const gain = dps(compose([base, lexeme])!) - dps(alone);
        expect(gain / lexeme.cost, `${lexeme.word} ${base.word}`).toBeLessThan(perTower);
      }
    }
  });
});
