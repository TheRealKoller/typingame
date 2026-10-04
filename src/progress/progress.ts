import { buildSave, emptySave, parseSave, type SaveGame } from './save';
import { SessionStats, type KeyStats } from './stats';
import type { SaveStorage } from './storage';

/**
 * The player's progress: the save loaded at startup plus the running session.
 * `save()` writes both back; writes run one after another.
 */
export class Progress {
  readonly session = new SessionStats();
  readonly #storage: SaveStorage;
  readonly #base: SaveGame;
  readonly #startedAt: string;
  #pending: Promise<void> = Promise.resolve();

  constructor(storage: SaveStorage, base: SaveGame, startedAt: Date) {
    this.#storage = storage;
    this.#base = base;
    this.#startedAt = startedAt.toISOString();
  }

  /** Loads the saved progress; starts empty if there is no valid save. */
  static async load(storage: SaveStorage, now = new Date()): Promise<Progress> {
    const json = await storage.load();
    const save = json === null ? null : parseSave(json);
    if (json !== null && save === null) console.warn('Ignoring unreadable save game');
    return new Progress(storage, save ?? emptySave(), now);
  }

  /** The complete save as it would be written now. */
  snapshot(): SaveGame {
    return buildSave(this.#base, {
      session: this.session,
      startedAt: this.#startedAt,
    });
  }

  /** Hits and misses per character over all sessions including this one. */
  get keys(): Readonly<Record<string, KeyStats>> {
    return this.snapshot().keys;
  }

  /** Writes the current progress; resolves once this write is done. */
  save(): Promise<void> {
    const json = JSON.stringify(this.snapshot());
    this.#pending = this.#pending
      .then(() => this.#storage.save(json))
      .catch((error: unknown) => console.error('Saving failed', error));
    return this.#pending;
  }
}
