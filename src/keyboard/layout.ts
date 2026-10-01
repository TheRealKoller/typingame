/** Rows of the keyboard: the three letter rows and the space bar below them. */
export type Row = 'top' | 'home' | 'bottom' | 'space';

/** The finger that presses a key in touch typing. */
export type Finger =
  | 'leftPinky'
  | 'leftRing'
  | 'leftMiddle'
  | 'leftIndex'
  | 'rightIndex'
  | 'rightMiddle'
  | 'rightRing'
  | 'rightPinky'
  | 'thumb';

export interface KeyDefinition {
  /** Physical key as reported by `KeyboardEvent.code`. */
  readonly code: string;
  /** Character typed without modifiers (lowercase). */
  readonly char: string;
  readonly row: Row;
  readonly finger: Finger;
  /** Width in key units; 1 unless the key is wider, like the space bar. */
  readonly width?: number;
  /** What the key is called on screen when its character alone is unclear, e.g. the space bar. */
  readonly label?: string;
}

export interface KeyboardLayout {
  readonly id: string;
  readonly name: string;
  /** Keys ordered row by row (top, home, bottom), each row from left to right. */
  readonly keys: readonly KeyDefinition[];
}
