import { expect, it } from 'vitest';
import { HOME_ROW_KEYS, HOME_ROW_WORDS } from './words';

it('uses only home row keys in home row words', () => {
  const allowed: readonly string[] = HOME_ROW_KEYS;
  for (const word of HOME_ROW_WORDS) {
    expect([...word].filter((char) => !allowed.includes(char)), word).toEqual([]);
  }
});
