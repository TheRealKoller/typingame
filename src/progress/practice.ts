import type { KeyStats } from './stats';

/** At most this many words are shown at once; the other things of the room wait without a word. */
export const SHOWN_WORDS = 4;
/** How strongly a key's error rate raises the chance of words that contain it. */
const WEAKNESS_WEIGHT = 10;
/** Keystrokes counted as correct on top of each key's record, so one early slip does not dominate. */
const PRIOR_HITS = 5;

export interface PracticeContext {
  /** Words typed at least once; the others are preferred so every thing gets named. */
  readonly discovered: ReadonlySet<string>;
  /** Hits and misses per character over all sessions. */
  readonly keys: Readonly<Record<string, KeyStats>>;
  /** Uniform number in [0, 1); replaceable for deterministic tests. */
  readonly random?: () => number;
}

/** Chance weight of a word: 1 if its keys were never missed, higher the weaker they are. */
export function practiceWeight(word: string, keys: Readonly<Record<string, KeyStats>>): number {
  let weight = 1;
  for (const char of new Set(word)) {
    const stats = keys[char];
    if (stats) weight += (WEAKNESS_WEIGHT * stats.misses) / (stats.hits + stats.misses + PRIOR_HITS);
  }
  return weight;
}

/**
 * Picks the word from `pool` that is shown next to `shown`, or null if none fits.
 * A word that is shown already or forms a prefix pair with a shown word never fits.
 * Undiscovered words come first; the choice among the rest favours weak keys.
 */
export function pickWord(pool: readonly string[], shown: readonly string[], context: PracticeContext): string | null {
  const fitting = pool.filter((word) => !shown.some((other) => other.startsWith(word) || word.startsWith(other)));
  const undiscovered = fitting.filter((word) => !context.discovered.has(word));
  const choices = undiscovered.length > 0 ? undiscovered : fitting;
  const weights = choices.map((word) => practiceWeight(word, context.keys));
  let rest = (context.random ?? Math.random)() * weights.reduce((sum, weight) => sum + weight, 0);
  for (const [i, word] of choices.entries()) {
    rest -= weights[i] ?? 0;
    if (rest < 0) return word;
  }
  // Rounding can leave a tiny rest after the last weight.
  return choices.at(-1) ?? null;
}

/** The words shown when a room opens. */
export function chooseShown(pool: readonly string[], context: PracticeContext): string[] {
  const shown: string[] = [];
  while (shown.length < SHOWN_WORDS) {
    const word = pickWord(pool, shown, context);
    if (word === null) break;
    shown.push(word);
  }
  return shown;
}

/**
 * The shown words once `typed` was completed: another word of the pool takes its place,
 * so the room stays calm and varied. With no other word left, `typed` stays.
 */
export function replaceTyped(
  pool: readonly string[],
  shown: readonly string[],
  typed: string,
  context: PracticeContext,
): string[] {
  const others = shown.filter((word) => word !== typed);
  const next = pickWord(
    pool.filter((word) => word !== typed),
    others,
    context,
  );
  return next === null ? [...shown] : shown.map((word) => (word === typed ? next : word));
}
