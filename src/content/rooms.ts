import type { Chapter, Section } from './types';

/**
 * Sections whose words are visible in the section at `index`: those of the same room
 * up to and including it. Words of rooms left behind are no longer shown.
 */
export function visibleSections(chapter: Chapter, index: number): readonly Section[] {
  const section = chapter.sections[index];
  if (!section) return [];
  return chapter.sections.slice(0, index + 1).filter((s) => s.room === section.room);
}
