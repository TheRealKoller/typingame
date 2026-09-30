/**
 * A word at a thing in the scene; typing it makes the thing react.
 * In chapter 1 the words are sounds the baby says, from chapter 2 on they name the thing.
 */
export interface Word {
  readonly text: string;
  /** Id of the reacting scene object. */
  readonly object: string;
  /** What happens, in German. */
  readonly reaction: string;
}

/** A step within a chapter that unlocks new keys and brings new words into a room. */
export interface Section {
  readonly id: string;
  /** Room of the chapter the section plays in, in German; the sections of a room follow each other. */
  readonly room: string;
  /** Characters unlocked when the section starts. */
  readonly newKeys: readonly string[];
  /** Words added in this section; words of earlier sections of the same room stay visible. */
  readonly words: readonly Word[];
}

export interface Chapter {
  readonly id: number;
  readonly place: string;
  readonly sections: readonly Section[];
}
