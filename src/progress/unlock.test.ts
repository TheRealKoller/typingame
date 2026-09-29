import { describe, expect, it } from 'vitest';
import { UnlockTracker } from './unlock';

const recordAll = (tracker: UnlockTracker, keystrokes: string) =>
  [...keystrokes].map((stroke) => tracker.record(stroke === '+'));

describe('UnlockTracker', () => {
  it('waits for a full window even when every keystroke is correct', () => {
    const tracker = new UnlockTracker(30, 0.9);

    const results = recordAll(tracker, '+'.repeat(30));

    expect(results.slice(0, 29)).not.toContain(true);
    expect(results[29]).toBe(true);
  });

  it('unlocks at exactly the threshold', () => {
    const tracker = new UnlockTracker(30, 0.9);

    expect(recordAll(tracker, '---' + '+'.repeat(27)).at(-1)).toBe(true);
    expect(tracker.accuracy).toBe(0.9);
  });

  it('stays locked just below the threshold', () => {
    const tracker = new UnlockTracker(30, 0.9);

    expect(recordAll(tracker, '----' + '+'.repeat(26))).not.toContain(true);
  });

  it('forgets mistakes once they slide out of the window', () => {
    const tracker = new UnlockTracker(10, 0.9);
    recordAll(tracker, '--' + '+'.repeat(8));

    expect(tracker.record(true)).toBe(true);
  });

  it('counts recent mistakes against older correct keystrokes', () => {
    const tracker = new UnlockTracker(10, 0.9);
    recordAll(tracker, '+'.repeat(20));

    expect(recordAll(tracker, '--')).toEqual([true, false]);
    expect(tracker.accuracy).toBe(0.8);
  });
});
