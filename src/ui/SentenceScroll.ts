import * as Phaser from 'phaser';

const WIDTH = 620;
const HEIGHT = 450;
/** Wooden rolls at the top and bottom edge of the parchment. */
const ROLL = 18;
const SENTENCE_Y = 52;
const HEADING_Y = 96;
const FIRST_ROW_Y = 136;
const ROW = 48;
/** The foot with what the tower will be stands below five rows of words. */
const FOOTER_Y = FIRST_ROW_Y + 5 * ROW - 8;
const HEADINGS = ['davor', 'Turmart', 'danach'] as const;
const FONT = 'system-ui, "Segoe UI", "Noto Sans", sans-serif';

/**
 * A parchment scroll over the map on which a tower sentence is written: the
 * sentence on top, below it the words that can join it in three columns as the
 * sentence reads, at the bottom what the tower will be. The words themselves are
 * `WordLabel`s the scene lays onto the scroll at `slot` (experiment #125).
 */
export class SentenceScroll extends Phaser.GameObjects.DOMElement {
  static readonly width = WIDTH;
  static readonly height = HEIGHT;
  readonly #placeholder: HTMLDivElement;
  readonly #footer: HTMLDivElement;

  /** `x`, `y` is the top left corner. */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const root = document.createElement('div');
    Object.assign(root.style, {
      position: 'relative',
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      boxSizing: 'border-box',
      padding: `${ROLL}px 0`,
      font: `500 15px ${FONT}`,
      color: '#5a4a38',
      userSelect: 'none',
      pointerEvents: 'none',
    });
    const parchment = document.createElement('div');
    Object.assign(parchment.style, {
      position: 'absolute',
      left: '14px',
      right: '14px',
      top: `${ROLL / 2}px`,
      bottom: `${ROLL / 2}px`,
      background: 'linear-gradient(90deg, #ead7ae 0%, #f7ecd2 12%, #fbf3df 50%, #f7ecd2 88%, #ead7ae 100%)',
      boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
    });
    root.append(parchment);
    for (const top of [0, HEIGHT - ROLL]) {
      const roll = document.createElement('div');
      Object.assign(roll.style, {
        position: 'absolute',
        left: '0',
        right: '0',
        top: `${top}px`,
        height: `${ROLL}px`,
        borderRadius: `${ROLL / 2}px`,
        background: 'linear-gradient(180deg, #a8794a 0%, #7a5230 60%, #5c3b20 100%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
      });
      root.append(roll);
    }
    const text = (top: number, content: string, style: Partial<CSSStyleDeclaration> = {}) => {
      const element = document.createElement('div');
      element.textContent = content;
      Object.assign(element.style, { position: 'absolute', left: '30px', right: '30px', top: `${top}px`, textAlign: 'center', ...style });
      root.append(element);
      return element;
    };
    // Shown until the first word is written.
    const placeholder = text(SENTENCE_Y - 14, 'Schreibe deinen Satz …', { font: `italic 500 22px ${FONT}`, color: '#a08a6c' });
    HEADINGS.forEach((heading, i) => {
      const element = text(HEADING_Y - 9, heading, {
        left: `${(i * WIDTH) / 3 + 24}px`,
        right: 'auto',
        width: `${WIDTH / 3 - 48}px`,
        font: `600 14px ${FONT}`,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#8a7358',
      });
      element.style.borderBottom = '1px solid #d8c29a';
    });
    const footer = text(FOOTER_Y, '', { font: `500 15px ${FONT}`, lineHeight: '1.35', whiteSpace: 'pre-line' });
    super(scene, x, y, root);
    this.setOrigin(0, 0);
    this.#placeholder = placeholder;
    this.#footer = footer;
    scene.add.existing(this);
  }

  /** Where the word in `column` (0 before, 1 base, 2 after the base word) and `row` stands. */
  slot(column: 0 | 1 | 2, row: number): { readonly x: number; readonly y: number } {
    return { x: this.x + ((column + 0.5) * WIDTH) / 3, y: this.y + FIRST_ROW_Y + row * ROW };
  }

  /** Where the sentence is written. */
  get sentenceAt(): { readonly x: number; readonly y: number } {
    return { x: this.x + WIDTH / 2, y: this.y + SENTENCE_Y };
  }

  /** The sentence so far; an empty one shows the invitation to write. */
  setWritten(written: boolean): this {
    this.#placeholder.style.visibility = written ? 'hidden' : 'visible';
    return this;
  }

  setFooter(text: string): this {
    if (this.#footer.textContent !== text) this.#footer.textContent = text;
    return this;
  }
}
