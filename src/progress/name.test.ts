import { describe, expect, it } from 'vitest';
import { editName, finishName, MAX_NAME_LENGTH } from './name';

function typeAll(keys: readonly string[]): string {
  return keys.reduce(editName, '');
}

describe('editName', () => {
  it('takes letters of any case, umlauts and Backspace', () => {
    expect(typeAll(['J', 'ö', 'r', 'n', 'x', 'Backspace'])).toBe('Jörn');
  });

  it('ignores named keys and stops at the length limit', () => {
    expect(typeAll(['Shift', 'A', 'Enter', 'Tab'])).toBe('A');
    expect(typeAll(Array.from({ length: MAX_NAME_LENGTH + 5 }, () => 'a'))).toHaveLength(MAX_NAME_LENGTH);
  });

  it('allows single spaces between words only', () => {
    expect(typeAll([' ', 'A', ' ', ' ', 'B'])).toBe('A B');
  });

  it('does nothing on Backspace when empty', () => {
    expect(editName('', 'Backspace')).toBe('');
  });
});

describe('finishName', () => {
  it('drops a trailing space and leaves nothing for blank input', () => {
    expect(finishName('Ada ')).toBe('Ada');
    expect(finishName('')).toBe('');
  });
});
