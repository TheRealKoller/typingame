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
  #stage: string;
  #name: string;
  readonly #seen: Set<string>;
  readonly #freed: Set<string>;
  #pending: Promise<void> = Promise.resolve();

  constructor(storage: SaveStorage, base: SaveGame, startedAt: Date) {
    this.#storage = storage;
    this.#base = base;
    this.#startedAt = startedAt.toISOString();
    this.#stage = base.stage;
    this.#name = base.name;
    this.#seen = new Set(base.seen);
    this.#freed = new Set(base.freed);
  }

  /** Loads the saved progress; starts at `firstStage` if there is no valid save. */
  static async load(storage: SaveStorage, firstStage: string, now = new Date()): Promise<Progress> {
    const json = await storage.load();
    const save = json === null ? null : parseSave(json, firstStage);
    if (json !== null && save === null) console.warn('Ignoring unreadable save game');
    return new Progress(storage, save ?? emptySave(firstStage), now);
  }

  /** Id of the current tutorial stage. */
  get stage(): string {
    return this.#stage;
  }

  set stage(id: string) {
    this.#stage = id;
  }

  /** Name of the apprentice; empty until the player has chosen one. */
  get name(): string {
    return this.#name;
  }

  set name(name: string) {
    this.#name = name;
  }

  /** Ids of the cutscenes already shown. */
  get seen(): ReadonlySet<string> {
    return this.#seen;
  }

  markSeen(id: string): void {
    this.#seen.add(id);
  }

  /** Ids of the world map points won on the journey. */
  get freed(): ReadonlySet<string> {
    return this.#freed;
  }

  free(id: string): void {
    this.#freed.add(id);
  }

  /** The complete save as it would be written now. */
  snapshot(): SaveGame {
    return buildSave(this.#base, {
      stage: this.#stage,
      name: this.#name,
      seen: this.#seen,
      freed: this.#freed,
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
