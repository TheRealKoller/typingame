export type TypingEvent =
  /** `char` extended the typed prefix of at least one visible word. */
  | { readonly type: 'correct'; readonly char: string }
  /** `char` matches no candidate; the typed prefix is unchanged. */
  | { readonly type: 'wrong'; readonly char: string; readonly expected: readonly string[] }
  /** The typed prefix equals `word`; the engine starts over with all visible words. */
  | { readonly type: 'complete'; readonly word: string };

/**
 * Typing logic without rendering or timing.
 *
 * Targets are chosen by prefix: every visible word that starts with the typed
 * prefix stays a candidate. A word completes as soon as the prefix equals it,
 * so a word that is the prefix of another visible word ("da", "dada") wins and
 * the longer one cannot be typed while both are visible. There is no way to
 * abandon a started word.
 */
export class TypingEngine {
  #words: readonly string[];
  #typed = '';

  constructor(words: readonly string[] = []) {
    this.#words = words;
  }

  /** Correct characters typed towards the current candidates. */
  get typed(): string {
    return this.#typed;
  }

  /** Visible words that start with the typed prefix, in visible order. */
  get candidates(): readonly string[] {
    return this.#words.filter((word) => word.startsWith(this.#typed));
  }

  /** Characters that would be accepted next, without duplicates. */
  get expectedChars(): readonly string[] {
    const index = this.#typed.length;
    return [...new Set(this.candidates.map((word) => word.charAt(index)))];
  }

  /** Replaces the visible words, keeping progress if a candidate is still visible. */
  setWords(words: readonly string[]): void {
    this.#words = words;
    if (this.candidates.length === 0) {
      this.#typed = '';
    }
  }

  /** Processes one typed character. */
  type(char: string): TypingEvent[] {
    const next = this.#typed + char;
    if (!this.#words.some((word) => word.startsWith(next))) {
      return [{ type: 'wrong', char, expected: this.expectedChars }];
    }

    this.#typed = next;
    const events: TypingEvent[] = [{ type: 'correct', char }];
    if (this.#words.includes(next)) {
      this.#typed = '';
      events.push({ type: 'complete', word: next });
    }
    return events;
  }
}
