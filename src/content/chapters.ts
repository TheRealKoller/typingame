import { chapter1 } from './chapter1';
import { chapter2 } from './chapter2';
import { chapter3 } from './chapter3';
import type { Chapter, Section } from './types';

/** All chapters in play order; keys unlock cumulatively across them. */
export const chapters: readonly Chapter[] = [chapter1, chapter2, chapter3];

/** A section together with its chapter and its index there. */
export interface SectionPlace {
  readonly chapter: Chapter;
  readonly index: number;
  readonly section: Section;
}

/** Every section of every chapter in the order they are played. */
export const playOrder: readonly SectionPlace[] = chapters.flatMap((chapter) =>
  chapter.sections.map((section, index) => ({ chapter, index, section })),
);
