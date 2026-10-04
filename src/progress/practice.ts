import type { KeyStats } from './stats';

/** How strongly a key's error rate raises the chance of words that contain it. */
const WEAKNESS_WEIGHT = 10;
/** Keystrokes counted as correct on top of each key's record, so one early slip does not dominate. */
const PRIOR_HITS = 5;

export interface PracticeContext {
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
 * Picks the next word from `pool` to show next to `shown`, or null if none fits.
 * A word that is shown already or forms a prefix pair with a shown word never fits.
 * The choice favours words with weak keys.
 */
export function pickWord(pool: readonly string[], shown: readonly string[], context: PracticeContext): string | null {
  const choices = pool.filter((word) => !shown.some((other) => other.startsWith(word) || word.startsWith(other)));
  const weights = choices.map((word) => practiceWeight(word, context.keys));
  let rest = (context.random ?? Math.random)() * weights.reduce((sum, weight) => sum + weight, 0);
  for (const [i, word] of choices.entries()) {
    rest -= weights[i] ?? 0;
    if (rest < 0) return word;
  }
  // Rounding can leave a tiny rest after the last weight.
  return choices.at(-1) ?? null;
}
