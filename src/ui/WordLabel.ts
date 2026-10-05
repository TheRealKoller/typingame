import * as Phaser from 'phaser';

/**
 * Words carry a light outline so they stay readable over stone, grass, ash, the
 * world map and enemies (decision in #47). The typed prefix is bold ink blue, the
 * next letter is underlined, and the word being typed sits on a pale card (#121).
 */
const TYPED_COLOR = '#1d4fa8';
const OPEN_COLOR = '#2f2a24';
const ERROR_COLOR = '#b3261e';
const OUTLINE_COLOR = '#f6efe6';
const OUTLINE_WIDTH = 4;
const DIMMED_ALPHA = 0.35;
const ACTIVE_SCALE = 1.15;
const CARD_COLOR = 0xfffaf0;
const CARD_BORDER = 0x1d4fa8;
const ERROR_MS = 300;

/** A word shown in the scene with its typed prefix, next letter and mistakes made visible. */
export class WordLabel extends Phaser.GameObjects.Container {
  readonly word: string;
  readonly #card: Phaser.GameObjects.Graphics;
  readonly #underline: Phaser.GameObjects.Graphics;
  readonly #typed: Phaser.GameObjects.Text;
  readonly #next: Phaser.GameObjects.Text;
  readonly #rest: Phaser.GameObjects.Text;
  readonly #fontSize: number;
  #typedCount = -1;
  #errorUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, word: string, fontSize = 32) {
    super(scene, x, y);
    this.word = word;
    this.#fontSize = fontSize;
    const style = {
      fontFamily: 'sans-serif',
      fontSize: `${fontSize}px`,
      stroke: OUTLINE_COLOR,
      strokeThickness: OUTLINE_WIDTH,
    };
    this.#card = scene.add.graphics();
    this.#underline = scene.add.graphics();
    this.#typed = scene.add.text(0, 0, '', { ...style, color: TYPED_COLOR, fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.#next = scene.add.text(0, 0, '', { ...style, color: OPEN_COLOR }).setOrigin(0, 0.5);
    this.#rest = scene.add.text(0, 0, '', { ...style, color: OPEN_COLOR }).setOrigin(0, 0.5);
    this.add([this.#card, this.#typed, this.#next, this.#rest, this.#underline]);
    scene.add.existing(this);
    this.setProgress('', true);
  }

  /**
   * Shows `typed` as progress. Words that are no candidate are dimmed; a candidate
   * with a started prefix is the active word and is lifted onto a card.
   */
  setProgress(typed: string, candidate: boolean): void {
    const count = candidate ? [...typed].length : 0;
    this.setAlpha(candidate ? 1 : DIMMED_ALPHA);
    if (count === this.#typedCount) return;
    this.#typedCount = count;
    const chars = [...this.word];
    this.#typed.setText(chars.slice(0, count).join(''));
    this.#next.setText(chars[count] ?? '');
    this.#rest.setText(chars.slice(count + 1).join(''));
    this.#layout(count > 0);
  }

  /** A wrong keystroke shows on the words being typed; with nothing typed yet no word is meant. */
  static showError(labels: Iterable<WordLabel>, typed: string, candidates: readonly string[]): void {
    if (typed === '') return;
    for (const label of labels) if (candidates.includes(label.word)) label.showError();
  }

  /** Marks a wrong keystroke at the next letter for a moment. */
  showError(): void {
    this.#errorUntil = this.scene.time.now + ERROR_MS;
    this.#next.setColor(ERROR_COLOR);
    this.#drawUnderline(true);
    // A wiggle by angle leaves the position to the scene, which moves enemy words every frame.
    this.scene.tweens.add({ targets: this, angle: { from: -4, to: 4 }, duration: 50, yoyo: true, repeat: 2, onComplete: () => this.setAngle(0) });
    this.scene.time.delayedCall(ERROR_MS, () => {
      if (!this.active || this.scene.time.now < this.#errorUntil) return;
      this.#next.setColor(OPEN_COLOR);
      this.#drawUnderline(false);
    });
  }

  #layout(active: boolean): void {
    // Text widths include the outline on both sides; neighbours overlap by one outline.
    const parts = [this.#typed, this.#next, this.#rest].filter((part) => part.text !== '');
    const width = parts.reduce((sum, part) => sum + part.width, 0) - OUTLINE_WIDTH * (parts.length - 1);
    let x = -width / 2;
    for (const part of [this.#typed, this.#next, this.#rest]) {
      part.setX(x);
      if (part.text !== '') x += part.width - OUTLINE_WIDTH;
    }
    this.setScale(active ? ACTIVE_SCALE : 1);
    if (active && this.parentContainer === null) this.scene.children.bringToTop(this);
    this.#card.clear();
    if (active) {
      const padX = this.#fontSize * 0.3;
      const height = this.#fontSize * 1.35;
      this.#card.fillStyle(CARD_COLOR, 0.92).lineStyle(2, CARD_BORDER, 1);
      this.#card.fillRoundedRect(-width / 2 - padX, -height / 2, width + 2 * padX, height, 6);
      this.#card.strokeRoundedRect(-width / 2 - padX, -height / 2, width + 2 * padX, height, 6);
    }
    this.#drawUnderline(false);
  }

  #drawUnderline(error: boolean): void {
    this.#underline.clear();
    if (this.#next.text === '') return;
    const thickness = Math.max(2, Math.round(this.#fontSize / 10));
    const y = this.#fontSize * 0.55;
    const left = this.#next.x + OUTLINE_WIDTH / 2;
    const width = this.#next.width - OUTLINE_WIDTH;
    // Light edge first so the line stays visible on dark ground.
    this.#underline.fillStyle(0xf6efe6, 1).fillRect(left - 1, y - 1, width + 2, thickness + 2);
    this.#underline.fillStyle(error ? 0xb3261e : 0x1d4fa8, 1).fillRect(left, y, width, thickness);
  }
}
