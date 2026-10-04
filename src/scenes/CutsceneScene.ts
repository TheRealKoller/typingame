import * as Phaser from 'phaser';
import { cutscene, pageText, speakerName, type Cutscene } from '../content/cutscenes';
import type { Progress } from '../progress/progress';
import { nextScene } from './flow';

const TEXT = '#2f2a24';
const QUIET = '#7a6a5a';
const SPEAKER = '#7a3a1e';
const PAPER = 0xf4ead6;
const PAPER_EDGE = 0xcbb894;
const PANEL_WIDTH = 820;
const PANEL_HEIGHT = 300;

export interface CutsceneSceneData {
  readonly progress: Progress;
  readonly id: string;
}

/**
 * Tells part of the story as pages of text. Enter or the space bar turns the
 * page; these keystrokes do not count towards the statistics. Afterwards the
 * scene is marked as seen and play continues where `nextScene` says.
 */
export class CutsceneScene extends Phaser.Scene {
  #progress!: Progress;
  #scene!: Cutscene;
  #page = 0;
  #speaker!: Phaser.GameObjects.Text;
  #text!: Phaser.GameObjects.Text;

  create(data: CutsceneSceneData): void {
    this.#progress = data.progress;
    this.#scene = cutscene(data.id);
    this.#page = 0;
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#2a1e16');

    const left = width / 2 - PANEL_WIDTH / 2;
    const top = height / 2 - PANEL_HEIGHT / 2;
    this.add.rectangle(width / 2 + 6, height / 2 + 6, PANEL_WIDTH, PANEL_HEIGHT, 0x000000, 0.3);
    this.add.rectangle(width / 2, height / 2, PANEL_WIDTH, PANEL_HEIGHT, PAPER).setStrokeStyle(3, PAPER_EDGE);
    this.#speaker = this.add.text(left + 40, top + 32, '', { fontFamily: 'serif', fontSize: '26px', color: SPEAKER });
    this.#text = this.add.text(left + 40, top + 78, '', {
      fontFamily: 'serif',
      fontSize: '30px',
      color: TEXT,
      lineSpacing: 10,
      wordWrap: { width: PANEL_WIDTH - 80 },
    });
    this.add
      .text(width / 2 + PANEL_WIDTH / 2 - 32, top + PANEL_HEIGHT - 36, 'Enter: weiter', { fontFamily: 'sans-serif', fontSize: '18px', color: QUIET })
      .setOrigin(1, 0);

    this.#show();
    this.cameras.main.fadeIn(400);
    window.addEventListener('keydown', this.#onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.#onKeyDown));
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (event.repeat) return;
    this.#page++;
    if (this.#page < this.#scene.pages.length) {
      this.#show();
      return;
    }
    this.#progress.markSeen(this.#scene.id);
    void this.#progress.save();
    // The cutscene opened a new stage, so the battle names its keys.
    const next = nextScene(this.#progress, true);
    this.scene.start(next.key, next.data);
  };

  #show(): void {
    const page = this.#scene.pages[this.#page]!;
    const name = this.#progress.name;
    this.#speaker.setText(speakerName(page.speaker, name) ?? '');
    // The narrator speaks in italics, without a name above.
    this.#text.setText(pageText(page, name)).setFontStyle(page.speaker === 'narrator' ? 'italic' : 'normal');
  }
}
