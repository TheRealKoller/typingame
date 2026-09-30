import { describe, expect, it } from 'vitest';
import { visibleSections } from './rooms';
import type { Chapter, Section } from './types';

const section = (id: string, room: string): Section => ({ id, room, newKeys: [], words: [] });

const chapter: Chapter = {
  id: 9,
  place: 'Haus',
  sections: [section('a', 'Küche'), section('b', 'Küche'), section('c', 'Bad'), section('d', 'Bad')],
};

const ids = (index: number) => visibleSections(chapter, index).map((s) => s.id);

describe('visibleSections', () => {
  it('keeps the earlier sections of the same room', () => {
    expect(ids(1)).toEqual(['a', 'b']);
    expect(ids(3)).toEqual(['c', 'd']);
  });

  it('leaves the previous room behind when a new room starts', () => {
    expect(ids(2)).toEqual(['c']);
  });

  it('never shows sections after the current one', () => {
    expect(ids(0)).toEqual(['a']);
  });
});
