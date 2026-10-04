import { expect, it } from 'vitest';
import { CROSSBOW, FLOOD_WORD } from './level1';
import { HOME_ROW_KEYS, HOME_ROW_WORDS } from './words';

it('uses only home row keys in home row words, tower keywords and the flood word', () => {
  const allowed: readonly string[] = HOME_ROW_KEYS;
  for (const word of [...HOME_ROW_WORDS, CROSSBOW.keyword, FLOOD_WORD]) {
    expect([...word].filter((char) => !allowed.includes(char)), word).toEqual([]);
  }
});
