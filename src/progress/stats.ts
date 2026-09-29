import type { TypingEvent } from '../typing/engine';

/** Gaps between keystrokes longer than this are pauses and do not count as typing time. */
export const PAUSE_MS = 5000;

export interface KeyStats {
  /** Keystrokes that typed this key correctly. */
  readonly hits: number;
  /** Wrong keystrokes where this key was the only one expected. */
  readonly misses: number;
}

/** Share of misses among all keystrokes on a key. */
export function errorRate({ hits, misses }: KeyStats): number {
  const total = hits + misses;
  return total === 0 ? 0 : misses / total;
}

/**
 * Typing statistics of one session. Times are milliseconds on any monotonic
 * clock (e.g. `KeyboardEvent.timeStamp`).
 */
export class SessionStats {
  #correct = 0;
  #wrong = 0;
  #activeMs = 0;
  #lastTime: number | null = null;
  readonly #perKey = new Map<string, { hits: number; misses: number }>();

  /**
   * Records the outcome of one keystroke as reported by the typing engine. A
   * mistake is charged to the expected key only if exactly one key was
   * expected; otherwise it counts in the totals alone.
   */
  record(events: readonly TypingEvent[], time: number): void {
    const [stroke] = events;
    if (!stroke || stroke.type === 'complete') return;
    this.#tick(time);
    if (stroke.type === 'correct') {
      this.#correct++;
      this.#key(stroke.char).hits++;
      return;
    }
    this.#wrong++;
    const [only] = stroke.expected;
    if (only !== undefined && stroke.expected.length === 1) this.#key(only).misses++;
  }

  get correctStrokes(): number {
    return this.#correct;
  }

  get wrongStrokes(): number {
    return this.#wrong;
  }

  /** Share of correct keystrokes; 0 before the first keystroke. */
  get accuracy(): number {
    const total = this.#correct + this.#wrong;
    return total === 0 ? 0 : this.#correct / total;
  }

  /** Typing time without pauses. */
  get activeMs(): number {
    return this.#activeMs;
  }

  /** Correct keystrokes per minute of typing time; 0 while no typing time has passed. */
  get strokesPerMinute(): number {
    return this.#activeMs === 0 ? 0 : (this.#correct / this.#activeMs) * 60_000;
  }

  /** Hits and misses by character. */
  get perKey(): ReadonlyMap<string, KeyStats> {
    return this.#perKey;
  }

  #tick(time: number): void {
    if (this.#lastTime !== null) {
      const gap = time - this.#lastTime;
      if (gap > 0 && gap <= PAUSE_MS) this.#activeMs += gap;
    }
    this.#lastTime = time;
  }

  #key(char: string): { hits: number; misses: number } {
    let stats = this.#perKey.get(char);
    if (!stats) {
      stats = { hits: 0, misses: 0 };
      this.#perKey.set(char, stats);
    }
    return stats;
  }
}
