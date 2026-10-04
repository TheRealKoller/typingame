/** Longest name the apprentice can get. */
export const MAX_NAME_LENGTH = 20;

/** The name being typed after `key` was pressed: printable characters are added up to the limit, Backspace removes one. */
export function editName(current: string, key: string): string {
  if (key === 'Backspace') return [...current].slice(0, -1).join('');
  if ([...key].length !== 1 || [...current].length >= MAX_NAME_LENGTH) return current;
  // No leading space and no two spaces in a row.
  if (key === ' ' && (current === '' || current.endsWith(' '))) return current;
  return current + key;
}

/** The name to keep, without a trailing space; empty if nothing usable was typed. */
export function finishName(typed: string): string {
  return typed.trim();
}
