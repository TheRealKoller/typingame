// Types only: rooms and things stay importable in tests that run without Phaser.
import type * as Phaser from 'phaser';

/** Placeholder thing in a room: its drawing, where its word goes, and its reaction. */
export interface Thing {
  readonly view: Phaser.GameObjects.Container;
  readonly label: { readonly x: number; readonly y: number };
  react(): void;
}

export type ThingFactory = (scene: Phaser.Scene) => Thing;

/** A room as the scene draws it; things are looked up by the `object` ids of the content. */
export interface Room {
  /** Draws what stays behind the things: walls, floor, furniture without a word. */
  backdrop(scene: Phaser.Scene): void;
  /** Free wall space for the hint that names new keys. */
  readonly hint: { readonly x: number; readonly y: number };
  readonly things: Readonly<Record<string, ThingFactory>>;
}

/** The scene above the keyboard ends here; things usually stand on this line. */
export const FLOOR_Y = 380;
export const LABEL_Y = FLOOR_Y + 26;
export const OUTLINE = 0x8a7a6a;
export const TEXT_COLOR = '#7a6a5a';

/** Rocks a container a few times around its origin. */
export function rock(scene: Phaser.Scene, target: Phaser.GameObjects.Container, angle: number, times: number): void {
  scene.tweens.killTweensOf(target);
  target.setAngle(0);
  scene.tweens.chain({
    targets: target,
    tweens: [
      { angle: -angle, duration: 220, ease: 'Sine.easeInOut' },
      { angle, duration: 440, ease: 'Sine.easeInOut', yoyo: true, repeat: times - 1 },
      { angle: 0, duration: 220, ease: 'Sine.easeInOut' },
    ],
  });
}

/** A text that floats upwards and fades out. */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, delay = 0): void {
  const label = scene.add
    .text(x, y, text, { fontFamily: 'sans-serif', fontSize: '28px', color: TEXT_COLOR })
    .setOrigin(0.5)
    .setAlpha(0);
  scene.tweens.chain({
    targets: label,
    delay,
    tweens: [
      { alpha: 1, duration: 200 },
      { y: y - 70, x: x + (Math.random() - 0.5) * 40, alpha: 0, duration: 1400, ease: 'Sine.easeOut' },
    ],
    onComplete: () => label.destroy(),
  });
}

/** Small dots that drift up from a point and fade: steam, scent, bubbles. */
export function rise(scene: Phaser.Scene, x: number, y: number, color: number, count = 5, size = 7): void {
  for (let i = 0; i < count; i++) {
    const dot = scene.add.circle(x + (Math.random() - 0.5) * 24, y, size * (0.6 + Math.random() * 0.6), color).setAlpha(0);
    scene.tweens.chain({
      targets: dot,
      delay: i * 220,
      tweens: [
        { alpha: 0.8, duration: 200 },
        { y: y - 60 - Math.random() * 30, x: dot.x + (Math.random() - 0.5) * 30, alpha: 0, duration: 1300, ease: 'Sine.easeOut' },
      ],
      onComplete: () => dot.destroy(),
    });
  }
}

/** Small dots that drop from a point and fade: crumbs, grains, drops. */
export function fall(scene: Phaser.Scene, x: number, y: number, color: number, count = 6, depth = 40): void {
  for (let i = 0; i < count; i++) {
    const dot = scene.add.circle(x + (Math.random() - 0.5) * 30, y, 2.5 + Math.random() * 2, color);
    scene.tweens.add({
      targets: dot,
      delay: i * 90,
      y: y + depth * (0.7 + Math.random() * 0.3),
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => dot.destroy(),
    });
  }
}

/** Squashes and stretches a container once, e.g. a cushion giving way. */
export function squash(scene: Phaser.Scene, target: Phaser.GameObjects.Container, scaleX: number, scaleY: number): void {
  scene.tweens.killTweensOf(target);
  target.setScale(1);
  scene.tweens.add({ targets: target, scaleX, scaleY, duration: 160, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
}
