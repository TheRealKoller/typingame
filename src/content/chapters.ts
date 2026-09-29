import { chapter1 } from './chapter1';
import type { Chapter } from './types';

/** All chapters in play order; keys unlock cumulatively across them. */
export const chapters: readonly Chapter[] = [chapter1];
