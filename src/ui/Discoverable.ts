import * as Phaser from 'phaser';

const BLUR_STRENGTH = 1;
const PALE_SATURATION = -0.7;
const PALE_ALPHA = 0.65;
const REVEAL_DURATION = 900;
const GLOW_COLOR = 0xffe28a;
/** Room around the thing for the blur to spread into. */
const BLUR_MARGIN = 16;

/**
 * A thing that stays blurred and pale until its word is typed: naming makes it visible.
 * Blur and colour need WebGL; with the canvas renderer the thing is drawn as it is.
 */
export class Discoverable {
  readonly #view: Phaser.GameObjects.Container;
  #discovered: boolean;
  #blur: Phaser.Filters.Blur | null = null;
  #pale: Phaser.Filters.ColorMatrix | null = null;

  constructor(view: Phaser.GameObjects.Container, discovered: boolean) {
    this.#view = view;
    this.#discovered = discovered;
    if (discovered) return;
    // Without a size the filters would render the whole screen per thing. A container's
    // filter area is centred on its position, so it spans the farthest edge on each side.
    const bounds = view.getBounds();
    const halfWidth = Math.max(view.x - bounds.left, bounds.right - view.x) + BLUR_MARGIN;
    const halfHeight = Math.max(view.y - bounds.top, bounds.bottom - view.y) + BLUR_MARGIN;
    view.setSize(halfWidth * 2, halfHeight * 2);
    // Internal filters follow the thing when it rocks or turns in its reaction.
    const filters = view.enableFilters().filters?.internal;
    if (!filters) return;
    this.#blur = filters.addBlur(0, 2, 2, BLUR_STRENGTH);
    this.#pale = filters.addColorMatrix();
    this.#pale.colorMatrix
      .saturate(PALE_SATURATION)
      .multiply([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, PALE_ALPHA, 0], true);
  }

  /** Sharpens and colours the thing with a soft glow; does nothing if it is discovered already. */
  discover(): void {
    if (this.#discovered) return;
    this.#discovered = true;
    const view = this.#view;
    const scene = view.scene;

    const bounds = view.getBounds();
    const glow = scene.add
      .circle(bounds.centerX, bounds.centerY, Math.max(bounds.width, bounds.height) / 2, GLOW_COLOR)
      .setAlpha(0.5)
      .setScale(0.8);
    scene.children.moveBelow(glow, view);
    scene.tweens.add({
      targets: glow,
      scale: 1.6,
      alpha: 0,
      duration: REVEAL_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => glow.destroy(),
    });

    if (!this.#blur || !this.#pale) return;
    scene.tweens.add({ targets: this.#blur, strength: 0, duration: REVEAL_DURATION, ease: 'Sine.easeOut' });
    scene.tweens.add({
      targets: this.#pale.colorMatrix,
      alpha: 0,
      duration: REVEAL_DURATION,
      ease: 'Sine.easeOut',
      // A sharp, coloured thing needs no filters; dropping them saves a render pass per frame.
      onComplete: () => view.filters?.internal.clear(),
    });
  }
}
