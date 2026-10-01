import * as Phaser from 'phaser';
import { qwertzDe } from '../keyboard/qwertz-de';
import { KeyboardView } from '../ui/KeyboardView';

/** Prototype canvas; the same size the game uses. */
export const WIDTH = 1280;
export const HEIGHT = 720;
/** One tile is 16 px and is drawn four times as large. */
export const ZOOM = 4;
export const TILE = 16 * ZOOM;

/** Keys that are unlocked after chapter 2. */
const UNLOCKED = [...'asdfghjkleirutzopwqnmbv'];

/** The keyboard and its hint line, over the scene as decided in #47. */
export function addKeyboard(scene: Phaser.Scene): void {
  new KeyboardView(scene, WIDTH / 2, 485, qwertzDe)
    .setScale(0.65)
    .setUnlocked(UNLOCKED)
    .setDepth(9);
}

/** Two lines at the top, so a screenshot explains itself. */
export function addCaptions(scene: Phaser.Scene, title: string, subtitle: string): void {
  scene.add.rectangle(WIDTH / 2, 34, WIDTH, 68, 0x1d1d24, 0.6).setDepth(9);
  scene.add
    .text(WIDTH / 2, 12, title, { fontFamily: 'sans-serif', fontSize: '18px', color: '#f4ede4' })
    .setOrigin(0.5, 0)
    .setDepth(10);
  scene.add
    .text(WIDTH / 2, 38, subtitle, { fontFamily: 'sans-serif', fontSize: '15px', color: '#cfc7ba' })
    .setOrigin(0.5, 0)
    .setDepth(10);
}

/** The word under a thing: dark text with a light outline, the typed prefix darker still. */
const WORD_OPEN = { color: '#6b5f52', stroke: '#f6efe6', strokeThickness: 4 };
const WORD_TYPED = { color: '#2f2a24', stroke: '#f6efe6', strokeThickness: 4 };

/** Draws a word the way `WordLabel` does, so the drafts can be compared without touching the game's component. */
export function drawWord(scene: Phaser.Scene, x: number, y: number, word: string, typed = ''): void {
  const base = { fontFamily: 'sans-serif', fontSize: '32px' };
  const open = scene.add.text(x, y, word, { ...base, ...WORD_OPEN }).setOrigin(0.5).setDepth(6);
  if (typed !== '') {
    scene.add
      .text(x - open.width / 2, y, typed, { ...base, ...WORD_TYPED })
      .setOrigin(0, 0.5)
      .setDepth(7);
  }
}

/** Loads image URLs into a scene, keyed by name. */
export function loadImages(scene: Phaser.Scene, images: readonly { readonly key: string; readonly url: string }[]): void {
  for (const { key, url } of images) scene.load.image(key, url);
}

/** Tiles a still image across a rectangle of the canvas. */
export function tile(
  scene: Phaser.Scene,
  key: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  zoom = ZOOM,
  depth = 0,
): void {
  const size = 16 * zoom;
  for (let y = y0; y < y1; y += size) {
    for (let x = x0; x < x1; x += size) {
      scene.add.image(x, y, key).setOrigin(0).setScale(zoom).setDepth(depth);
    }
  }
}
