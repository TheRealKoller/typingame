import * as Phaser from 'phaser';
import type { Progress } from '../progress/progress';

const TEXT = '#4a4038';
const QUIET_TEXT = '#9a8a7a';

/** Formats milliseconds as m:ss. */
function minutes(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Above the scene and the desk, so neither trees nor towers cover the statistics. */
const DEPTH = 2000;

/**
 * Session statistics: a quiet line, right-aligned at `line`, while playing and
 * an overview panel at `overview` on demand.
 */
export class StatsView {
  readonly #line: Phaser.GameObjects.Text;
  readonly #overview: Phaser.GameObjects.Container;
  readonly #overviewText: Phaser.GameObjects.Text;
  readonly #panel: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, line: { x: number; y: number }, overview: { x: number; y: number }) {
    this.#line = scene.add
      .text(line.x, line.y, '', { fontFamily: 'sans-serif', fontSize: '18px', color: QUIET_TEXT })
      .setOrigin(1, 0)
      .setDepth(DEPTH);
    this.#overviewText = scene.add
      .text(0, 0, '', { fontFamily: 'sans-serif', fontSize: '24px', color: TEXT, align: 'left', lineSpacing: 8 })
      .setOrigin(0.5);
    this.#panel = scene.add.rectangle(0, 0, 10, 10, 0xfffaf2, 0.96).setRounded(16).setStrokeStyle(2, 0xd9c8b4);
    this.#overview = scene.add
      .container(overview.x, overview.y, [this.#panel, this.#overviewText])
      .setDepth(DEPTH)
      .setVisible(false);
  }

  update(progress: Progress): void {
    const { session } = progress;
    const strokes = session.correctStrokes + session.wrongStrokes;
    const speed = Math.round(session.strokesPerMinute);
    const accuracy = Math.round(session.accuracy * 100);
    this.#line.setText(strokes === 0 ? 'Tab: Übersicht' : `${speed} Anschläge/min · ${accuracy} % richtig · Tab: Übersicht`);

    const sessions = progress.snapshot().sessions;
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correct, 0);
    const totalWrong = sessions.reduce((sum, s) => sum + s.wrong, 0);
    const totalAccuracy = totalCorrect + totalWrong === 0 ? 0 : totalCorrect / (totalCorrect + totalWrong);

    this.#overviewText.setText([
      'Diese Sitzung',
      `Anschläge pro Minute: ${speed}`,
      `Genauigkeit: ${accuracy} %`,
      `Anschläge: ${session.correctStrokes} richtig, ${session.wrongStrokes} falsch`,
      `Tippzeit ohne Pausen: ${minutes(session.activeMs)} min`,
      '',
      `Insgesamt (${sessions.length} ${sessions.length === 1 ? 'Sitzung' : 'Sitzungen'})`,
      `Anschläge: ${totalCorrect} richtig, ${totalWrong} falsch · ${Math.round(totalAccuracy * 100)} %`,
    ]);
    this.#panel.setSize(this.#overviewText.width + 64, this.#overviewText.height + 40);
  }

  setOverviewVisible(visible: boolean): void {
    this.#overview.setVisible(visible);
  }
}
