import * as Phaser from 'phaser';

/**
 * The word is drawn dark with a light outline: it has to stay readable over pixel art
 * as well as over the pale background of the earlier scenes (decision in #47).
 */
const TYPED_COLOR = '#2f2a24';
const OPEN_COLOR = '#6b5f52';
const OUTLINE_COLOR = '#f6efe6';
const OUTLINE_WIDTH = 4;
const DIMMED_ALPHA = 0.35;

/** A word shown in the scene; the typed prefix is drawn dark over the rest. */
export class WordLabel extends Phaser.GameObjects.Container {
  readonly word: string;
  readonly #open: Phaser.GameObjects.Text;
  readonly #typed: Phaser.GameObjects.Text;
  readonly #baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, word: string, fontSize = 32) {
    super(scene, x, y);
    this.word = word;
    this.#baseY = y;
    const style = {
      fontFamily: 'sans-serif',
      fontSize: `${fontSize}px`,
      stroke: OUTLINE_COLOR,
      strokeThickness: OUTLINE_WIDTH,
    };
    this.#open = scene.add.text(0, 0, word, { ...style, color: OPEN_COLOR }).setOrigin(0.5);
    this.#typed = scene.add
      .text(-this.#open.width / 2, 0, '', { ...style, color: TYPED_COLOR })
      .setOrigin(0, 0.5);
    this.add([this.#open, this.#typed]);
    scene.add.existing(this);
  }

  /** Shows `typed` as progress; words that are no candidate are dimmed. */
  setProgress(typed: string, candidate: boolean): void {
    this.#typed.setText(candidate ? typed : '');
    this.#open.setAlpha(candidate ? 1 : DIMMED_ALPHA);
  }

  /** Short hop when the word was typed completely. */
  celebrate(): void {
    this.scene.tweens.killTweensOf(this);
    this.y = this.#baseY;
    this.scene.tweens.add({ targets: this, y: this.#baseY - 12, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  }
}
