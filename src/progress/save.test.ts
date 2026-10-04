import { describe, expect, it } from 'vitest';
import { TypingEngine } from '../typing/engine';
import { buildSave, emptySave, parseSave, type SaveGame } from './save';
import { SessionStats } from './stats';

function sessionTyping(words: readonly string[], chars: string): SessionStats {
  const engine = new TypingEngine(words);
  const stats = new SessionStats();
  [...chars].forEach((char, i) => stats.record(engine.type(char), i * 500));
  return stats;
}

const saved: SaveGame = {
  version: 2,
  keys: { l: { hits: 4, misses: 1 }, a: { hits: 4, misses: 0 } },
  sessions: [{ startedAt: '2026-09-28T10:00:00.000Z', correct: 8, wrong: 1, activeMs: 4000 }],
};

describe('parseSave', () => {
  it('reads back what was written', () => {
    expect(parseSave(JSON.stringify(saved))).toEqual(saved);
  });

  it.each([
    ['broken JSON', '{"version": 1,'],
    ['another version', JSON.stringify({ ...saved, version: 1 })],
    ['a missing field', JSON.stringify({ ...saved, sessions: undefined })],
    ['negative counts', JSON.stringify({ ...saved, keys: { l: { hits: -1, misses: 0 } } })],
    ['a non-object', '"1a"'],
  ])('rejects %s', (_, json) => {
    expect(parseSave(json)).toBeNull();
  });
});

describe('buildSave', () => {
  it('adds the session keystrokes to the saved per-key numbers', () => {
    // l a k l a: "k" is a miss for the expected "l".
    const result = buildSave(saved, {
      session: sessionTyping(['lala'], 'lakla'),
      startedAt: '2026-09-29T10:00:00.000Z',
    });

    expect(result.keys).toEqual({ l: { hits: 6, misses: 2 }, a: { hits: 6, misses: 0 } });
  });

  it('appends the running session and replaces it on the next build', () => {
    const session = sessionTyping(['lala'], 'la');
    const current = { session, startedAt: '2026-09-29T10:00:00.000Z' };
    buildSave(saved, current);
    session.record(new TypingEngine(['la']).type('l'), 1500);

    const result = buildSave(saved, current);

    expect(result.sessions).toEqual([
      saved.sessions[0],
      { startedAt: '2026-09-29T10:00:00.000Z', correct: 3, wrong: 0, activeMs: 1500 },
    ]);
  });

  it('adds no session entry before the first keystroke', () => {
    const result = buildSave(saved, {
      session: new SessionStats(),
      startedAt: '2026-09-29T10:00:00.000Z',
    });

    expect(result.sessions).toEqual(saved.sessions);
  });

  it('starts empty', () => {
    expect(emptySave()).toEqual({ version: 2, keys: {}, sessions: [] });
  });
});
