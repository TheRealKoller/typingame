import type * as Phaser from 'phaser';

/** Colors of the prototype sprites, in the tone of the pack's tiles. */
const PALETTE: Readonly<Record<string, number>> = {
  k: 0x2b2b3a,
  '-': 0xf2c9a0,
  '#': 0x8a5a3c,
  b: 0x4f7fc4,
  B: 0x35578f,
  w: 0xffffff,
  K: 0x333333,
  n: 0xc08a5a,
  N: 0x8a5a34,
  p: 0xe8a0a0,
};

/**
 * The game's own things, which no free pack has, authored as text in the pack's 16 × 16 grid:
 * readable in a diff, no image files, and drawn by hand in the same tone as the tiles.
 */
export const CHILD: readonly string[] = [
  '................',
  '.....kkkkkk.....',
  '....k######k....',
  '...k########k...',
  '...k#------#k...',
  '...k--------k...',
  '...k--K--K--k...',
  '....k------k....',
  '...kkkbbbbkkk...',
  '..kbbbbbbbbbbk..',
  '.kbwbbbbbbbbwbk.',
  '.kbbbbbbbbbbbbk.',
  '..kbbbbbbbbbbk..',
  '..kBBBkkkkBBBk..',
  '...k-k....k-k...',
  '...kkk....kkk...',
];

export const DOG: readonly string[] = [
  '................',
  '................',
  '..kk........kk..',
  '.kNNk......kNNk.',
  '.kNnkkkkkkkknNk.',
  '.knnnnnnnnnnnnk.',
  '.knKnnnnnnKnnnk.',
  '.knnnnkkknnnnnk.',
  '.knnnnnnnnnnnnk.',
  '..knnnnnnnnnnk..',
  '..kknnnnnnnnkk..',
  '...knk....knk...',
  '...knk....knk...',
  '...kkk....kkk...',
  '................',
  '................',
];

export const MOUSE: readonly string[] = [
  '................',
  '................',
  '................',
  '....kk....kk....',
  '...kppk..kppk...',
  '...kppkkkkppk...',
  '....kknnnnkk....',
  '...knnnnnnnnk...',
  '..knKnnnnKnnk...',
  '..knnnnknnnnk...',
  '..knnnnnnnnnk...',
  '...knnnnnnk.....',
  '....kkkkkk......',
  '................',
  '................',
  '................',
];

/** Paints one sprite pixel by pixel; `scale` is the size of a sprite pixel on screen. */
export function paintSprite(scene: Phaser.Scene, rows: readonly string[], scale: number): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  rows.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      const color = PALETTE[cell];
      if (color === undefined) return;
      graphics.fillStyle(color, 1);
      graphics.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  return graphics;
}
