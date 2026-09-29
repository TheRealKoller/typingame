import { describe, expect, it } from 'vitest';
import { TypingEngine } from '../typing/engine';
import { Progress } from './progress';
import type { SaveStorage } from './storage';

/** In-memory storage; a write waits for `holdFirstWrite` if given. */
function memoryStorage(initial: string | null = null, holdFirstWrite?: Promise<void>) {
  let stored = initial;
  let writes = 0;
  const storage: SaveStorage = {
    load: async () => stored,
    save: async (json) => {
      if (writes++ === 0 && holdFirstWrite) await holdFirstWrite;
      stored = json;
    },
  };
  return { storage, read: () => stored };
}

function typeInto(progress: Progress, words: readonly string[], chars: string): void {
  const engine = new TypingEngine(words);
  [...chars].forEach((char, i) => progress.session.record(engine.type(char), i * 500));
}

describe('Progress', () => {
  it('starts in the first section without a save', async () => {
    const progress = await Progress.load(memoryStorage().storage, '1a');

    expect(progress.section).toBe('1a');
    expect(progress.discovered.size).toBe(0);
  });

  it('continues where the last session stopped', async () => {
    const { storage } = memoryStorage();
    const first = await Progress.load(storage, '1a', new Date('2026-09-28T10:00:00Z'));
    typeInto(first, ['lala', 'dada'], 'lalakdada');
    first.discover('lala');
    first.discover('dada');
    first.section = '1b';
    await first.save();

    const second = await Progress.load(storage, '1a', new Date('2026-09-29T10:00:00Z'));
    typeInto(second, ['haha'], 'haha');
    await second.save();
    const third = await Progress.load(storage, '1a');

    expect(third.section).toBe('1b');
    expect([...third.discovered]).toEqual(['lala', 'dada']);
    expect(third.keys.h).toEqual({ hits: 2, misses: 0 });
    expect(third.keys.l).toEqual({ hits: 2, misses: 0 });
    expect(third.snapshot().sessions.map((s) => [s.startedAt, s.correct, s.wrong])).toEqual([
      ['2026-09-28T10:00:00.000Z', 8, 1],
      ['2026-09-29T10:00:00.000Z', 4, 0],
    ]);
  });

  it('starts over when the save cannot be read', async () => {
    const progress = await Progress.load(memoryStorage('not json').storage, '1a');

    expect(progress.section).toBe('1a');
  });

  it('keeps the newest state when an earlier write finishes late', async () => {
    const hold = Promise.withResolvers<void>();
    const { storage, read } = memoryStorage(null, hold.promise);
    const progress = await Progress.load(storage, '1a');

    const earlier = progress.save();
    progress.section = '1b';
    const later = progress.save();
    hold.resolve();
    await Promise.all([earlier, later]);

    expect(JSON.parse(read() ?? '{}').section).toBe('1b');
  });
});
