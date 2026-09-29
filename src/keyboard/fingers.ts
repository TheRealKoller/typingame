import type { Finger } from './layout';

/** German finger names shown to the player. */
export const FINGER_NAME: Readonly<Record<Finger, string>> = {
  leftPinky: 'linker kleiner Finger',
  leftRing: 'linker Ringfinger',
  leftMiddle: 'linker Mittelfinger',
  leftIndex: 'linker Zeigefinger',
  rightIndex: 'rechter Zeigefinger',
  rightMiddle: 'rechter Mittelfinger',
  rightRing: 'rechter Ringfinger',
  rightPinky: 'rechter kleiner Finger',
};
