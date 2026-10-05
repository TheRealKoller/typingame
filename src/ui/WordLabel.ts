import * as Phaser from 'phaser';

/**
 * Words are HTML text over the canvas: the canvas is scaled to the window with
 * pixel-art sampling, which blurs any text drawn into it, while the browser draws
 * HTML text sharp at every size (#121). A light outline keeps words readable over
 * stone, grass, ash, the world map and enemies (decision in #47). Once a word is
 * started it glows blue, its typed letters turn blue, and a wrong key flashes the
 * next letter red.
 */
const OPEN_COLOR = '#2f2a24';
const TYPED_COLOR = '#0a6cff';
const ERROR_COLOR = '#c62828';
const OUTLINE = [
  [-2, 0], [2, 0], [0, -2], [0, 2], [-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5],
].map(([x, y]) => `${x}px ${y}px 1px #f6efe6`).join(', ');
const GLOW = `${OUTLINE}, 0 0 4px #2f8cff, 0 0 10px #2f8cff, 0 0 18px #5aa8ff`;
const DIMMED_ALPHA = 0.35;
const ERROR_MS = 300;

/** A word shown in the scene with its typed prefix and mistakes made visible. */
export class WordLabel extends Phaser.GameObjects.DOMElement {
  readonly word: string;
  readonly #letters: HTMLSpanElement[];
  #typedCount = -1;
  #errorTimer: Phaser.Time.TimerEvent | null = null;

  /** `note` stands small under the word, e.g. what a word of a tower sentence costs and does. */
  constructor(scene: Phaser.Scene, x: number, y: number, word: string, fontSize = 32, note?: { readonly text: string; readonly color?: string }) {
    const root = document.createElement('div');
    Object.assign(root.style, {
      font: `600 ${fontSize}px system-ui, "Segoe UI", "Noto Sans", sans-serif`,
      whiteSpace: 'nowrap',
      userSelect: 'none',
      lineHeight: '1',
      textAlign: 'center',
    });
    const line = document.createElement('div');
    root.append(line);
    const letters = [...word].map((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      line.append(span);
      return span;
    });
    if (note) {
      const small = document.createElement('div');
      small.textContent = note.text;
      Object.assign(small.style, {
        font: `600 ${Math.round(fontSize * 0.5)}px system-ui, "Segoe UI", "Noto Sans", sans-serif`,
        color: note.color ?? OPEN_COLOR,
        textShadow: OUTLINE,
        marginTop: '3px',
      });
      root.append(small);
    }
    super(scene, x, y, root);
    this.word = word;
    this.#letters = letters;
    scene.add.existing(this);
    this.setProgress('', true);
  }

  /**
   * Shows `typed` as progress. Words that are no candidate are dimmed; a candidate
   * with a started prefix glows.
   */
  setProgress(typed: string, candidate: boolean): void {
    const count = candidate ? [...typed].length : 0;
    this.setAlpha(candidate ? 1 : DIMMED_ALPHA);
    if (count === this.#typedCount) return;
    this.#typedCount = count;
    this.#clearError();
    const shadow = count > 0 ? GLOW : OUTLINE;
    this.#letters.forEach((letter, i) => {
      letter.style.color = i < count ? TYPED_COLOR : OPEN_COLOR;
      letter.style.textShadow = shadow;
    });
  }

  /** A wrong keystroke shows on the words being typed; with nothing typed yet no word is meant. */
  static showError(labels: Iterable<WordLabel>, typed: string, candidates: readonly string[]): void {
    if (typed === '') return;
    for (const label of labels) if (candidates.includes(label.word)) label.showError();
  }

  /** Flashes the next letter red for a moment. */
  showError(): void {
    const next = this.#letters[this.#typedCount];
    if (!next) return;
    this.#clearError();
    next.style.color = ERROR_COLOR;
    this.#errorTimer = this.scene.time.delayedCall(ERROR_MS, () => this.#clearError());
  }

  #clearError(): void {
    this.#errorTimer?.remove();
    this.#errorTimer = null;
    const next = this.#letters[this.#typedCount];
    if (next) next.style.color = OPEN_COLOR;
  }

  override destroy(fromScene?: boolean): void {
    this.#errorTimer?.remove();
    super.destroy(fromScene);
  }
}
