import { describe, expect, it } from 'vitest';
import { TypingEngine } from '../typing/engine';
import { PAUSE_MS, SessionStats } from './stats';

/** Types `chars` into a fresh engine, one keystroke every `interval` ms starting at 0. */
function session(words: readonly string[], chars: string, interval = 500): SessionStats {
  const engine = new TypingEngine(words);
  const stats = new SessionStats();
  [...chars].forEach((char, i) => stats.record(engine.type(char), i * interval));
  return stats;
}

describe('SessionStats', () => {
  it('reports nothing before the first keystroke', () => {
    const stats = new SessionStats();

    expect(stats.accuracy).toBe(0);
    expect(stats.strokesPerMinute).toBe(0);
    expect(stats.errorRate('a')).toBeNull();
  });

  it('counts correct keystrokes per minute of typing time', () => {
    // 8 correct keystrokes, 7 gaps of 500 ms = 3.5 s.
    const stats = session(['lala', 'dada'], 'laladada');

    expect(stats.correctStrokes).toBe(8);
    expect(stats.activeMs).toBe(3500);
    expect(stats.strokesPerMinute).toBeCloseTo((8 / 3500) * 60_000);
  });

  it('leaves pauses out of the typing time', () => {
    const engine = new TypingEngine(['lala']);
    const stats = new SessionStats();
    const times = [0, 400, 800, 800 + PAUSE_MS + 1, 800 + PAUSE_MS + 401];
    [...'lalal'].forEach((char, i) => stats.record(engine.type(char), times[i] ?? 0));

    expect(stats.activeMs).toBe(400 + 400 + 400);
  });

  it('counts a gap of exactly the pause limit as typing', () => {
    const engine = new TypingEngine(['la']);
    const stats = new SessionStats();
    stats.record(engine.type('l'), 0);
    stats.record(engine.type('a'), PAUSE_MS);

    expect(stats.activeMs).toBe(PAUSE_MS);
  });

  it('does not count wrong keystrokes as speed but as lower accuracy', () => {
    // l a k l a: 4 correct, 1 wrong.
    const stats = session(['lala'], 'lakla');

    expect(stats.correctStrokes).toBe(4);
    expect(stats.wrongStrokes).toBe(1);
    expect(stats.accuracy).toBe(0.8);
    expect(stats.strokesPerMinute).toBeCloseTo((4 / 2000) * 60_000);
  });

  it('charges a mistake to the key that was expected', () => {
    // After "la" only "l" fits; "k" is a miss for "l".
    const stats = session(['lala'], 'lakla');

    expect(stats.perKey.get('l')).toEqual({ hits: 2, misses: 1 });
    expect(stats.perKey.get('a')).toEqual({ hits: 2, misses: 0 });
    expect(stats.perKey.has('k')).toBe(false);
    expect(stats.errorRate('l')).toBeCloseTo(1 / 3);
  });

  it('keeps an ambiguous mistake out of the per-key numbers', () => {
    // At the start "l" and "d" are expected, so "k" belongs to no single key.
    const stats = session(['lala', 'dada'], 'k');

    expect(stats.wrongStrokes).toBe(1);
    expect(stats.accuracy).toBe(0);
    expect([...stats.perKey.values()].every((key) => key.misses === 0)).toBe(true);
  });

  it('counts a completed word once per keystroke', () => {
    const stats = session(['ja'], 'jaja');

    expect(stats.correctStrokes).toBe(4);
    expect(stats.perKey.get('j')).toEqual({ hits: 2, misses: 0 });
  });
});
