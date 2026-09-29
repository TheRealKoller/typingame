import * as Phaser from 'phaser';
import type { Finger, KeyboardLayout, KeyDefinition, Row } from '../keyboard/layout';

const KEY_SIZE = 52;
const KEY_PITCH = 58;
/** Horizontal start of each row in key widths on an ISO keyboard (after Tab, Caps Lock, Shift). */
const ROW_OFFSET: Record<Row, number> = { top: 1.5, home: 1.75, bottom: 1.25 };
const ROW_INDEX: Record<Row, number> = { top: 0, home: 1, bottom: 2 };

const TEXT_COLOR = 0x4a4038;
const LOCKED_COLOR = 0xe6ddd2;
const LOCKED_TEXT = '#b9ab9b';
const WRONG_FLASH = 0xe58b8b;
const RIGHT_FLASH = 0xffffff;

/** Same finger on both hands shares a colour; the side tells the hand. */
const FINGER_COLOR: Record<Finger, number> = {
  leftPinky: 0xf2a7a7,
  leftRing: 0xf5c98f,
  leftMiddle: 0xa9d4a0,
  leftIndex: 0x9fc4ea,
  rightIndex: 0x9fc4ea,
  rightMiddle: 0xa9d4a0,
  rightRing: 0xf5c98f,
  rightPinky: 0xf2a7a7,
};

const FINGER_NAME: Record<Finger, string> = {
  leftPinky: 'linker kleiner Finger',
  leftRing: 'linker Ringfinger',
  leftMiddle: 'linker Mittelfinger',
  leftIndex: 'linker Zeigefinger',
  rightIndex: 'rechter Zeigefinger',
  rightMiddle: 'rechter Mittelfinger',
  rightRing: 'rechter Ringfinger',
  rightPinky: 'rechter kleiner Finger',
};

/** Hand diagram, left to right: finger (or thumb), height, and horizontal position. */
const HAND_FINGERS: readonly { finger: Finger | 'thumb'; height: number; x: number }[] = [
  { finger: 'leftPinky', height: 62, x: -250 },
  { finger: 'leftRing', height: 82, x: -214 },
  { finger: 'leftMiddle', height: 92, x: -178 },
  { finger: 'leftIndex', height: 82, x: -142 },
  { finger: 'thumb', height: 50, x: -100 },
  { finger: 'thumb', height: 50, x: 100 },
  { finger: 'rightIndex', height: 82, x: 142 },
  { finger: 'rightMiddle', height: 92, x: 178 },
  { finger: 'rightRing', height: 82, x: 214 },
  { finger: 'rightPinky', height: 62, x: 250 },
];
const FINGER_WIDTH = 30;

interface KeyView {
  readonly key: KeyDefinition;
  readonly container: Phaser.GameObjects.Container;
  readonly cap: Phaser.GameObjects.Rectangle;
  readonly flash: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
}

/**
 * On-screen keyboard: keys coloured by finger, locked keys dimmed, the next
 * keys and their fingers highlighted, pressed keys flashed briefly.
 */
export class KeyboardView extends Phaser.GameObjects.Container {
  readonly #keys: KeyView[];
  readonly #fingers = new Map<Finger, Phaser.GameObjects.Rectangle>();
  readonly #caption: Phaser.GameObjects.Text;
  #unlocked: ReadonlySet<string> = new Set();
  #next: readonly string[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, layout: KeyboardLayout) {
    super(scene, x, y);

    const rowLengths: Record<Row, number> = { top: 0, home: 0, bottom: 0 };
    for (const key of layout.keys) rowLengths[key.row]++;
    const rows = Object.keys(ROW_OFFSET) as Row[];
    const minOffset = Math.min(...rows.map((row) => ROW_OFFSET[row]));
    const maxEnd = Math.max(...rows.map((row) => ROW_OFFSET[row] + rowLengths[row]));
    const width = (maxEnd - minOffset) * KEY_PITCH;

    const rowCounters: Record<Row, number> = { top: 0, home: 0, bottom: 0 };

    this.#keys = layout.keys.map((key) => {
      const column = rowCounters[key.row]++;
      const left = (ROW_OFFSET[key.row] - minOffset + column) * KEY_PITCH - width / 2;
      const container = scene.add.container(left + KEY_SIZE / 2, (ROW_INDEX[key.row] - 1) * KEY_PITCH);
      const cap = scene.add.rectangle(0, 0, KEY_SIZE, KEY_SIZE).setRounded(8);
      const flash = scene.add.rectangle(0, 0, KEY_SIZE, KEY_SIZE, RIGHT_FLASH).setRounded(8).setAlpha(0);
      const label = scene.add
        .text(0, 0, key.char.toUpperCase(), { fontFamily: 'sans-serif', fontSize: '22px' })
        .setOrigin(0.5);
      container.add([cap, flash, label]);
      this.add(container);
      return { key, container, cap, flash, label };
    });

    const handsTop = 2 * KEY_PITCH + 24;
    for (const { finger, height, x: fingerX } of HAND_FINGERS) {
      const shape = scene.add
        .rectangle(fingerX, handsTop + 92 - height / 2 + (finger === 'thumb' ? 24 : 0), FINGER_WIDTH, height)
        .setRounded(FINGER_WIDTH / 2);
      this.add(shape);
      if (finger === 'thumb') {
        shape.setFillStyle(LOCKED_COLOR);
      } else {
        this.#fingers.set(finger, shape);
      }
    }

    this.#caption = scene.add
      .text(0, handsTop + 140, '', { fontFamily: 'sans-serif', fontSize: '22px', color: '#4a4038' })
      .setOrigin(0.5);
    this.add(this.#caption);

    scene.add.existing(this);
    this.#render();
  }

  /** Characters whose keys are available; all others are dimmed. */
  setUnlocked(chars: Iterable<string>): this {
    this.#unlocked = new Set(chars);
    this.#render();
    return this;
  }

  /** Characters that would be accepted next; their keys and fingers are highlighted. */
  setNext(chars: readonly string[]): this {
    this.#next = chars;
    this.#render();
    return this;
  }

  /** Briefly marks the physical key identified by `KeyboardEvent.code`. */
  press(code: string, correct: boolean): void {
    const view = this.#keys.find(({ key }) => key.code === code);
    if (!view) return;
    this.scene.tweens.killTweensOf(view.flash);
    view.flash.setFillStyle(correct ? RIGHT_FLASH : WRONG_FLASH).setAlpha(0.8);
    this.scene.tweens.add({ targets: view.flash, alpha: 0, duration: 350, ease: 'Quad.easeOut' });
  }

  #render(): void {
    const nextKeys: KeyDefinition[] = [];
    for (const view of this.#keys) {
      const { key, container, cap, label } = view;
      const unlocked = this.#unlocked.has(key.char);
      const next = unlocked && this.#next.includes(key.char);
      this.scene.tweens.killTweensOf(container);
      container.setScale(1);

      if (!unlocked) {
        cap.setFillStyle(LOCKED_COLOR).setStrokeStyle();
        label.setColor(LOCKED_TEXT);
      } else if (next) {
        nextKeys.push(key);
        cap.setFillStyle(FINGER_COLOR[key.finger]).setStrokeStyle(3, TEXT_COLOR);
        label.setColor('#4a4038');
        this.#pulse(container);
      } else {
        cap.setFillStyle(FINGER_COLOR[key.finger], 0.45).setStrokeStyle();
        label.setColor('#4a4038');
      }
    }

    const nextFingers = new Set(nextKeys.map((key) => key.finger));
    for (const [finger, shape] of this.#fingers) {
      this.scene.tweens.killTweensOf(shape);
      shape.setScale(1);
      if (nextFingers.has(finger)) {
        shape.setFillStyle(FINGER_COLOR[finger]).setStrokeStyle(3, TEXT_COLOR);
        this.#pulse(shape);
      } else {
        shape.setFillStyle(FINGER_COLOR[finger], 0.35).setStrokeStyle();
      }
    }

    this.#caption.setText(
      nextKeys.map((key) => `${key.char.toUpperCase()}: ${FINGER_NAME[key.finger]}`).join('     '),
    );
  }

  #pulse(target: Phaser.GameObjects.Components.Transform): void {
    this.scene.tweens.add({
      targets: target,
      scale: 1.08,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
