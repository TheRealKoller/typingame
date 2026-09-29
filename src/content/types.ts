/** A sound the baby can say; typing it makes an object in the scene react. */
export interface Sound {
  readonly word: string;
  /** Id of the reacting scene object. */
  readonly object: string;
  /** What happens, in German. */
  readonly reaction: string;
}

/** A step within a chapter that unlocks new keys and brings new sounds. */
export interface Section {
  readonly id: string;
  /** Characters unlocked when the section starts. */
  readonly newKeys: readonly string[];
  /** Sounds added in this section; sounds of earlier sections of the chapter stay available. */
  readonly sounds: readonly Sound[];
}

export interface Chapter {
  readonly id: number;
  readonly place: string;
  readonly sections: readonly Section[];
}
