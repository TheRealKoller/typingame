import { describe, expect, it } from 'vitest';
import { qwertzDe } from '../keyboard/qwertz-de';
import { chapters } from './chapters';

const sections = chapters.flatMap((chapter) =>
  chapter.sections.map((section, index) => ({
    section,
    /** Sounds visible in this section: its own plus those of earlier sections of the same chapter. */
    visibleWords: chapter.sections.slice(0, index + 1).flatMap((s) => s.sounds.map((sound) => sound.word)),
  })),
);

describe('chapters', () => {
  it('uses only keys that are unlocked by the section a word appears in', () => {
    const unlocked = new Set<string>();
    const violations: string[] = [];
    for (const { section } of sections) {
      section.newKeys.forEach((key) => unlocked.add(key));
      for (const { word } of section.sounds) {
        const locked = [...new Set(word)].filter((char) => !unlocked.has(char));
        if (locked.length > 0) {
          violations.push(`${section.id}: "${word}" uses locked ${locked.join(', ')}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('unlocks each key once and only keys that exist on the layout', () => {
    const layoutChars = new Set(qwertzDe.keys.map((key) => key.char));
    const unlockedKeys = sections.flatMap(({ section }) => section.newKeys);

    expect(unlockedKeys.filter((key) => !layoutChars.has(key))).toEqual([]);
    expect(unlockedKeys.filter((key, i) => unlockedKeys.indexOf(key) !== i)).toEqual([]);
  });

  // The typing engine completes a word as soon as it is typed, so a visible word
  // that starts another visible word would make the longer one unreachable.
  it('never shows a word together with another word it is the start of', () => {
    const conflicts = sections.flatMap(({ section, visibleWords }) =>
      visibleWords.flatMap((word, i) =>
        visibleWords
          .filter((other, j) => i !== j && other.startsWith(word))
          .map((other) => `${section.id}: "${word}" blocks "${other}"`),
      ),
    );
    expect(conflicts).toEqual([]);
  });
});
