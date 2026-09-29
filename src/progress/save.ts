import { z } from 'zod';
import type { KeyStats, SessionStats } from './stats';

export const SAVE_VERSION = 1;

const count = z.number().int().nonnegative();

const SessionSummarySchema = z.object({
  /** ISO timestamp of the session start. */
  startedAt: z.string(),
  correct: count,
  wrong: count,
  activeMs: z.number().nonnegative(),
});

const SaveGameSchema = z.object({
  version: z.literal(SAVE_VERSION),
  /** Id of the current section, e.g. "1b". */
  section: z.string(),
  /** Words typed at least once. */
  discovered: z.array(z.string()),
  /** Hits and misses per character over all sessions. */
  keys: z.record(z.string(), z.object({ hits: count, misses: count })),
  /** One entry per session with keystrokes, oldest first. */
  sessions: z.array(SessionSummarySchema),
});

export type SessionSummary = z.infer<typeof SessionSummarySchema>;
/** Everything that survives a restart, stored as JSON. */
export type SaveGame = z.infer<typeof SaveGameSchema>;

export function emptySave(firstSection: string): SaveGame {
  return { version: SAVE_VERSION, section: firstSection, discovered: [], keys: {}, sessions: [] };
}

/** Reads a save from JSON text; returns null if it is not a valid save of this version. */
export function parseSave(json: string): SaveGame | null {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  const result = SaveGameSchema.safeParse(data);
  return result.success ? result.data : null;
}

export interface CurrentProgress {
  readonly section: string;
  readonly discovered: Iterable<string>;
  readonly session: SessionStats;
  /** ISO timestamp of the current session start. */
  readonly startedAt: string;
}

/**
 * Combines the save loaded at startup with the running session. `base` stays
 * the startup save, so building again replaces the current session's entry.
 */
export function buildSave(base: SaveGame, current: CurrentProgress): SaveGame {
  const keys: Record<string, KeyStats> = { ...base.keys };
  for (const [char, stats] of current.session.perKey) {
    const before = keys[char];
    keys[char] = { hits: (before?.hits ?? 0) + stats.hits, misses: (before?.misses ?? 0) + stats.misses };
  }

  const { session } = current;
  const typed = session.correctStrokes + session.wrongStrokes > 0;
  const summary: SessionSummary = {
    startedAt: current.startedAt,
    correct: session.correctStrokes,
    wrong: session.wrongStrokes,
    activeMs: Math.round(session.activeMs),
  };

  return {
    version: SAVE_VERSION,
    section: current.section,
    discovered: [...new Set([...base.discovered, ...current.discovered])],
    keys,
    sessions: typed ? [...base.sessions, summary] : base.sessions,
  };
}
