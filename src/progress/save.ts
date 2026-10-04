import { z } from 'zod';
import type { KeyStats, SessionStats } from './stats';

export const SAVE_VERSION = 3;

const count = z.number().int().nonnegative();

const SessionSummarySchema = z.object({
  /** ISO timestamp of the session start. */
  startedAt: z.string(),
  correct: count,
  wrong: count,
  activeMs: z.number().nonnegative(),
});

const SaveGameV2Schema = z.object({
  version: z.literal(2),
  /** Hits and misses per character over all sessions. */
  keys: z.record(z.string(), z.object({ hits: count, misses: count })),
  /** One entry per session with keystrokes, oldest first. */
  sessions: z.array(SessionSummarySchema),
});

const SaveGameSchema = SaveGameV2Schema.extend({
  version: z.literal(SAVE_VERSION),
  /** Id of the current tutorial stage, e.g. "2c". */
  stage: z.string(),
  /** Name the player gave the apprentice; empty until chosen. Saves from before the name have none. */
  name: z.string().default(''),
});

export type SessionSummary = z.infer<typeof SessionSummarySchema>;
/** Everything that survives a restart, stored as JSON. */
export type SaveGame = z.infer<typeof SaveGameSchema>;

export function emptySave(firstStage: string): SaveGame {
  return { version: SAVE_VERSION, stage: firstStage, name: '', keys: {}, sessions: [] };
}

/**
 * Reads a save from JSON text; returns null if it is not a valid save.
 * A save from before the tutorial stages (version 2) keeps its statistics and starts at `firstStage`.
 */
export function parseSave(json: string, firstStage: string): SaveGame | null {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  const current = SaveGameSchema.safeParse(data);
  if (current.success) return current.data;
  const v2 = SaveGameV2Schema.safeParse(data);
  return v2.success ? { ...v2.data, version: SAVE_VERSION, stage: firstStage, name: '' } : null;
}

export interface CurrentProgress {
  readonly stage: string;
  readonly name: string;
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
    stage: current.stage,
    name: current.name,
    keys,
    sessions: typed ? [...base.sessions, summary] : base.sessions,
  };
}
