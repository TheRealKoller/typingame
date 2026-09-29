import * as Phaser from 'phaser';
import type { SessionStats } from '../progress/stats';

const TEXT = '#4a4038';
const QUIET_TEXT = '#9a8a7a';

/** Formats milliseconds as m:ss. */
function minutes(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Session statistics: a quiet line in the top right corner while playing and
 * an overview panel on demand.
 */
export class StatsView {
  readonly #line: Phaser.GameObjects.Text;
  readonly #overview: Phaser.GameObjects.Container;
  readonly #overviewText: Phaser.GameObjects.Text;
  readonly #panel: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, overviewX: number, overviewY: number) {
    this.#line = scene.add
      .text(scene.scale.width - 20, 16, '', { fontFamily: 'sans-serif', fontSize: '18px', color: QUIET_TEXT })
      .setOrigin(1, 0);
    this.#overviewText = scene.add
      .text(0, 0, '', { fontFamily: 'sans-serif', fontSize: '24px', color: TEXT, align: 'left', lineSpacing: 8 })
      .setOrigin(0.5);
    this.#panel = scene.add.rectangle(0, 0, 10, 10, 0xfffaf2, 0.96).setRounded(16).setStrokeStyle(2, 0xd9c8b4);
    this.#overview = scene.add
      .container(overviewX, overviewY, [this.#panel, this.#overviewText])
      .setDepth(10)
      .setVisible(false);
  }

  update(stats: SessionStats): void {
    const strokes = stats.correctStrokes + stats.wrongStrokes;
    const speed = Math.round(stats.strokesPerMinute);
    const accuracy = Math.round(stats.accuracy * 100);
    this.#line.setText(strokes === 0 ? '' : `${speed} Anschläge/min · ${accuracy} % richtig · Tab: Übersicht`);

    this.#overviewText.setText([
      'Diese Sitzung',
      `Anschläge pro Minute: ${speed}`,
      `Genauigkeit: ${accuracy} %`,
      `Anschläge: ${stats.correctStrokes} richtig, ${stats.wrongStrokes} falsch`,
      `Tippzeit ohne Pausen: ${minutes(stats.activeMs)} min`,
    ]);
    this.#panel.setSize(this.#overviewText.width + 64, this.#overviewText.height + 40);
  }

  setOverviewVisible(visible: boolean): void {
    this.#overview.setVisible(visible);
  }
}
