import * as Phaser from 'phaser';

const WIDTH = 400;
const HEIGHT = 92;
const RING = 30;
const CIRCUMFERENCE = 2 * Math.PI * RING;
const FONT = 'system-ui, "Segoe UI", "Noto Sans", sans-serif';
const INK = '#2b3a6b';
const GLOW = '0 0 0 3px #f6c453, 0 0 18px 6px rgba(246, 196, 83, 0.8)';
const SHADOW = '0 3px 8px rgba(0, 0, 0, 0.35)';
/** The word stands this far from the card's left edge and top; the scene lays its `WordLabel` there while the spell is ready. */
const WORD_X = 96;
const WORD_Y = 52;

/**
 * A spell on the desk: an ink drop in a ring that fills while the spell
 * returns, its name, its word and what it is waiting for (#122). While the spell
 * is ready the scene puts a typeable `WordLabel` onto the word's place; until
 * then the card shows the word pale.
 */
export class SpellCard extends Phaser.GameObjects.DOMElement {
  static readonly width = WIDTH;
  static readonly height = HEIGHT;
  readonly #card: HTMLDivElement;
  readonly #ring: SVGCircleElement;
  readonly #word: HTMLDivElement;
  readonly #status: HTMLDivElement;
  #charged = false;

  /** `x`, `y` is the top left corner; `cost` is the ink a cast takes. */
  constructor(scene: Phaser.Scene, x: number, y: number, name: string, word: string, cost: number) {
    const card = document.createElement('div');
    Object.assign(card.style, {
      position: 'relative',
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      boxSizing: 'border-box',
      borderRadius: '12px',
      border: `2px solid ${INK}`,
      background: 'linear-gradient(180deg, #fbf3df 0%, #efe0bd 100%)',
      boxShadow: SHADOW,
      font: `600 16px ${FONT}`,
      color: INK,
      userSelect: 'none',
      pointerEvents: 'none',
      transition: 'box-shadow 150ms',
    });
    const size = 2 * RING + 12;
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute;left:12px;top:${(HEIGHT - size) / 2}px">
        <circle cx="${size / 2}" cy="${size / 2}" r="${RING}" fill="#fffaf0" stroke="#d8c29a" stroke-width="6"/>
        <circle class="ring" cx="${size / 2}" cy="${size / 2}" r="${RING}" fill="none" stroke="${INK}" stroke-width="6"
          stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="0" transform="rotate(-90 ${size / 2} ${size / 2})"/>
        <path d="M ${size / 2} ${size / 2 - 18} C ${size / 2 + 4} ${size / 2 - 8}, ${size / 2 + 13} ${size / 2}, ${size / 2 + 13} ${size / 2 + 7}
          A 13 13 0 0 1 ${size / 2 - 13} ${size / 2 + 7} C ${size / 2 - 13} ${size / 2}, ${size / 2 - 4} ${size / 2 - 8}, ${size / 2} ${size / 2 - 18} Z"
          fill="${INK}"/>
      </svg>`;
    card.insertAdjacentHTML('beforeend', svg);
    const text = (top: number, content: string, style: Partial<CSSStyleDeclaration>) => {
      const element = document.createElement('div');
      element.textContent = content;
      Object.assign(element.style, { position: 'absolute', left: `${WORD_X}px`, top: `${top}px`, whiteSpace: 'nowrap', ...style });
      card.append(element);
      return element;
    };
    text(10, `Zauber: ${name} · ${cost} Tinte`, { font: `600 15px ${FONT}`, letterSpacing: '0.04em', color: '#5a4a38' });
    const wordElement = text(WORD_Y - 14, word, { font: `600 26px ${FONT}`, color: '#a08a6c' });
    const status = text(WORD_Y - 8, '', { left: 'auto', right: '14px', font: `600 15px ${FONT}`, color: '#5a4a38' });
    super(scene, x, y, card);
    this.setOrigin(0, 0);
    this.#card = card;
    this.#ring = card.querySelector('circle.ring')!;
    this.#word = wordElement;
    this.#status = status;
    scene.add.existing(this);
  }

  /** Where the typeable word goes while the spell is ready: the left end of the word, vertically centred. */
  get wordAt(): { readonly x: number; readonly y: number } {
    return { x: this.x + WORD_X, y: this.y + WORD_Y };
  }

  /**
   * `share` of the ring is filled (1 when the spell has returned); `ready` hides
   * the pale word for the scene's label; `status` tells what the spell waits for.
   */
  show(share: number, ready: boolean, status: string): this {
    this.#ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, share))));
    this.#word.style.visibility = ready ? 'hidden' : 'visible';
    if (this.#status.textContent !== status) this.#status.textContent = status;
    this.#card.style.opacity = ready ? '1' : '0.75';
    return this;
  }

  /** The spell's word is being typed: the card lights up. */
  setCharged(charged: boolean): this {
    if (charged === this.#charged) return this;
    this.#charged = charged;
    this.#card.style.boxShadow = charged ? GLOW : SHADOW;
    return this;
  }

  /** The spell has returned: the card swells and glows for a moment. */
  flashReady(): void {
    this.#card.style.boxShadow = GLOW;
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.08 },
      duration: 180,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (this.active && !this.#charged) this.#card.style.boxShadow = SHADOW;
      },
    });
  }
}
