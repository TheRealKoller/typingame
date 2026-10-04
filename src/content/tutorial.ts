import type { TowerKind } from '../battle/level';
import { CROSSBOW } from './towers';
import { wordsFor } from './words';

/** One step of the tutorial: the keys it adds to those of the stages before. */
export interface Stage {
  readonly id: string;
  /** Tutorial section 1–3: home row, top row, bottom row. */
  readonly section: number;
  readonly newKeys: readonly string[];
}

/** Key order of classic touch-typing courses (game design, section 5). */
export const STAGES: readonly Stage[] = [
  { id: '1a', section: 1, newKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'] },
  { id: '1b', section: 1, newKeys: ['g', 'h'] },
  { id: '2a', section: 2, newKeys: ['e', 'i'] },
  { id: '2b', section: 2, newKeys: ['r', 'u'] },
  { id: '2c', section: 2, newKeys: ['t', 'z'] },
  { id: '2d', section: 2, newKeys: ['o', 'p'] },
  { id: '2e', section: 2, newKeys: ['w', 'q'] },
  { id: '3a', section: 3, newKeys: ['n', 'm'] },
  { id: '3b', section: 3, newKeys: ['b', 'v'] },
  { id: '3c', section: 3, newKeys: ['c', 'x', 'y'] },
  { id: '3d', section: 3, newKeys: [' '] },
];

/** Progress after the last stage: the raid on the library, then the journey (world map, milestone 4). */
export const RAID = 'raid';
export const JOURNEY = 'journey';

/** Keyword choices, most fitting first; a stage uses the first one it can type. */
const TOWER_KEYWORDS = ['jagd', 'lass'];
/** A stage shows only words with its new keys if there are at least this many. */
const MIN_FOCUSED_WORDS = 8;

/** Position of the stage with `id`, or 0 for an unknown id (e.g. from an older save). */
export function stageIndex(id: string): number {
  return Math.max(0, STAGES.findIndex((stage) => stage.id === id));
}

/** Every key unlocked up to and including stage `index`. */
export function keysUpTo(index: number): string[] {
  return STAGES.slice(0, index + 1).flatMap((stage) => stage.newKeys);
}

function typeable(word: string, keys: readonly string[]): boolean {
  return [...word].every((char) => keys.includes(char));
}

function firstTypeable(choices: readonly string[], keys: readonly string[]): string {
  const word = choices.find((choice) => typeable(choice, keys));
  if (!word) throw new Error(`none of ${choices.join(', ')} can be typed with ${keys.join('')}`);
  return word;
}

/** What a battle needs at one stage of the tutorial. */
export interface StageSetup {
  readonly keys: string[];
  readonly words: string[];
  /** The towers that can be built, with the keyword this stage can type. */
  readonly towers: readonly TowerKind[];
}

/**
 * Keys, words and towers at stage `index`. The words practise the
 * new keys: only those containing one of them, unless there are too few.
 */
export function stageSetup(index: number): StageSetup {
  const keys = keysUpTo(index);
  const all = wordsFor(keys);
  const newKeys = STAGES[index]?.newKeys ?? [];
  const focused = all.filter((word) => newKeys.some((key) => word.includes(key)));
  return {
    keys,
    words: focused.length >= MIN_FOCUSED_WORDS ? focused : all,
    // Towers are not upgraded in the library: the upgrade words need keys learnt later.
    towers: [{ ...CROSSBOW, keyword: firstTypeable(TOWER_KEYWORDS, keys), upgrade: undefined }],
  };
}

/** The raid and the journey use every key of the tutorial and every word, not only those of the last stage. */
export function allKeysSetup(): StageSetup {
  const setup = stageSetup(STAGES.length - 1);
  return { ...setup, words: wordsFor(setup.keys) };
}
