import * as Phaser from 'phaser';
import { chapter1 } from '../content/chapter1';
import { qwertzDe } from '../keyboard/qwertz-de';
import { TypingEngine } from '../typing/engine';
import { KeyboardView } from '../ui/KeyboardView';

const TYPED_COLOR = '#4a4038';
const OPEN_COLOR = '#a8998a';
const DIMMED_ALPHA = 0.35;

/**
 * Typing preview with the sounds of section 1a and the on-screen keyboard.
 * Replaced by the nursery scene (#9).
 */
export class KeyboardPreviewScene extends Phaser.Scene {
  #engine!: TypingEngine;
  #keyboard!: KeyboardView;
  #words: { word: string; typed: Phaser.GameObjects.Text; open: Phaser.GameObjects.Text }[] = [];

  constructor() {
    super('KeyboardPreviewScene');
  }

  create(): void {
    const section = chapter1.sections[0];
    if (!section) throw new Error('chapter 1 has no sections');
    const words = section.sounds.map((sound) => sound.word);
    this.#engine = new TypingEngine(words);

    const style = { fontFamily: 'sans-serif', fontSize: '44px' };
    const spacing = 240;
    this.#words = words.map((word, i) => {
      const x = this.scale.width / 2 + (i - (words.length - 1) / 2) * spacing;
      const open = this.add.text(x, 150, word, { ...style, color: OPEN_COLOR }).setOrigin(0.5);
      const typed = this.add
        .text(open.x - open.width / 2, 150, '', { ...style, color: TYPED_COLOR })
        .setOrigin(0, 0.5);
      return { word, typed, open };
    });

    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 360, qwertzDe).setUnlocked(section.newKeys);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.#onKeyDown(event));
    this.#render();
  }

  #onKeyDown(event: KeyboardEvent): void {
    // Only printable single characters count as typing; shortcuts and named keys are ignored.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;

    const events = this.#engine.type(event.key);
    this.#keyboard.press(event.code, events[0]?.type === 'correct');
    for (const typingEvent of events) {
      if (typingEvent.type === 'complete') this.#celebrate(typingEvent.word);
    }
    this.#render();
  }

  #render(): void {
    const { typed, candidates } = this.#engine;
    for (const { word, typed: typedText, open } of this.#words) {
      const isCandidate = candidates.includes(word);
      const prefix = isCandidate ? typed : '';
      typedText.setText(prefix);
      open.setText(word).setAlpha(isCandidate ? 1 : DIMMED_ALPHA);
      // Draw the typed prefix over the open word so both parts line up.
      typedText.setAlpha(prefix ? 1 : 0);
    }
    this.#keyboard.setNext(this.#engine.expectedChars);
  }

  #celebrate(word: string): void {
    const view = this.#words.find((w) => w.word === word);
    if (!view) return;
    this.tweens.add({ targets: [view.open, view.typed], y: '-=16', duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  }
}
