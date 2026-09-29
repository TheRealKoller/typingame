/** Keystrokes that count towards the unlock decision. */
export const UNLOCK_WINDOW = 30;
/** Share of correct keystrokes in the window needed to unlock the next keys. */
export const UNLOCK_ACCURACY = 0.9;

/**
 * Decides when the next keys unlock: once the last `window` keystrokes reach
 * `threshold` accuracy. Only keystrokes count, never time.
 */
export class UnlockTracker {
  readonly #window: number;
  readonly #threshold: number;
  #recent: boolean[] = [];

  constructor(window = UNLOCK_WINDOW, threshold = UNLOCK_ACCURACY) {
    this.#window = window;
    this.#threshold = threshold;
  }

  /** Share of correct keystrokes among the recent ones; 0 before the first. */
  get accuracy(): number {
    if (this.#recent.length === 0) return 0;
    return this.#recent.filter(Boolean).length / this.#recent.length;
  }

  /** Records one keystroke and tells whether the next keys are unlocked now. */
  record(correct: boolean): boolean {
    this.#recent.push(correct);
    if (this.#recent.length > this.#window) this.#recent.shift();
    return this.#recent.length === this.#window && this.accuracy >= this.#threshold;
  }
}
