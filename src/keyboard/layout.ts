/** Rows of the main keyboard block that carry letters. */
export type Row = 'top' | 'home' | 'bottom';

/** The finger that presses a key in touch typing. */
export type Finger =
  | 'leftPinky'
  | 'leftRing'
  | 'leftMiddle'
  | 'leftIndex'
  | 'rightIndex'
  | 'rightMiddle'
  | 'rightRing'
  | 'rightPinky';

export interface KeyDefinition {
  /** Physical key as reported by `KeyboardEvent.code`. */
  readonly code: string;
  /** Character typed without modifiers (lowercase). */
  readonly char: string;
  readonly row: Row;
  readonly finger: Finger;
}

export interface KeyboardLayout {
  readonly id: string;
  readonly name: string;
  /** Keys ordered row by row (top, home, bottom), each row from left to right. */
  readonly keys: readonly KeyDefinition[];
}
