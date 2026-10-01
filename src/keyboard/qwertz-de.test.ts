import { describe, expect, it } from 'vitest';
import type { Finger, Row } from './layout';
import { qwertzDe } from './qwertz-de';

// Reference: German QWERTZ (ISO) letter rows, left to right, unshifted, then the space bar.
const expectedRows: Record<Row, string> = {
  top: 'qwertzuiopü+',
  home: 'asdfghjklöä#',
  bottom: '<yxcvbnm,.-',
  space: ' ',
};

// Reference: finger assignment taught in German touch-typing courses.
const expectedFingers: Record<Finger, string> = {
  leftPinky: 'qay<',
  leftRing: 'wsx',
  leftMiddle: 'edc',
  leftIndex: 'rtfgvb',
  rightIndex: 'zuhjnm',
  rightMiddle: 'ik,',
  rightRing: 'ol.',
  rightPinky: 'püöä+#-',
  thumb: ' ',
};

const sorted = (chars: Iterable<string>): string[] => [...chars].sort();

describe('qwertzDe', () => {
  it.each(Object.entries(expectedRows))('has every key of the %s row in order', (row, chars) => {
    const actual = qwertzDe.keys.filter((key) => key.row === row).map((key) => key.char);
    expect(actual.join('')).toBe(chars);
  });

  it('lists rows top to bottom', () => {
    const rowOrder = qwertzDe.keys.map((key) => key.row).filter((row, i, rows) => row !== rows[i - 1]);
    expect(rowOrder).toEqual(['top', 'home', 'bottom', 'space']);
  });

  it.each(Object.entries(expectedFingers))('assigns the %s to its keys', (finger, chars) => {
    const actual = qwertzDe.keys.filter((key) => key.finger === finger).map((key) => key.char);
    expect(sorted(actual)).toEqual(sorted(chars));
  });

  it('maps each physical key once', () => {
    const codes = qwertzDe.keys.map((key) => key.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
