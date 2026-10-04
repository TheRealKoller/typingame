import * as Phaser from 'phaser';
import { editName, finishName } from '../progress/name';
import type { Progress } from '../progress/progress';
import type { BattleSceneData } from './BattleScene';

const TEXT = '#2f2a24';
const QUIET = '#7a6a5a';
const PAPER = 0xf4ead6;
const PAPER_EDGE = 0xcbb894;

export interface NameSceneData {
  readonly progress: Progress;
}

/**
 * Asks for the apprentice's name before the first lesson. Free typing, no
 * practice: the keystrokes do not count towards the statistics.
 */
export class NameScene extends Phaser.Scene {
  #progress!: Progress;
  #typed = '';
  #input!: Phaser.GameObjects.Text;
  #cursor!: Phaser.GameObjects.Rectangle;

  create(data: NameSceneData): void {
    this.#progress = data.progress;
    this.#typed = '';
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#3a2a1e');

    this.add.rectangle(width / 2 + 6, height / 2 + 6, 640, 320, 0x000000, 0.3);
    this.add.rectangle(width / 2, height / 2, 640, 320, PAPER).setStrokeStyle(3, PAPER_EDGE);
    this.add
      .text(width / 2, height / 2 - 100, 'Wie heißt du, Lehrling?', { fontFamily: 'serif', fontSize: '40px', color: TEXT })
      .setOrigin(0.5);
    this.#input = this.add
      .text(width / 2, height / 2, '', { fontFamily: 'serif', fontSize: '44px', color: TEXT })
      .setOrigin(0.5);
    this.add.rectangle(width / 2, height / 2 + 34, 420, 2, PAPER_EDGE);
    this.#cursor = this.add.rectangle(width / 2, height / 2, 3, 44, 0x2f2a24);
    this.tweens.add({ targets: this.#cursor, alpha: 0, duration: 500, yoyo: true, repeat: -1 });
    this.add
      .text(width / 2, height / 2 + 100, 'Tippe deinen Namen und drücke Enter.', { fontFamily: 'sans-serif', fontSize: '20px', color: QUIET })
      .setOrigin(0.5);

    window.addEventListener('keydown', this.#onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.#onKeyDown));
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    // Keep the browser from going back (Backspace) or moving focus (Tab).
    if (event.key === 'Backspace' || event.key === 'Tab' || event.key === ' ') event.preventDefault();
    if (event.key === 'Enter') {
      this.#confirm();
      return;
    }
    this.#typed = editName(this.#typed, event.key);
    this.#input.setText(this.#typed);
    this.#cursor.x = this.#input.x + this.#input.width / 2 + 6;
  };

  #confirm(): void {
    const name = finishName(this.#typed);
    if (name === '') {
      this.tweens.add({ targets: this.#cursor, x: this.#cursor.x + 8, duration: 60, yoyo: true, repeat: 2 });
      return;
    }
    this.#progress.name = name;
    void this.#progress.save();
    this.scene.start('BattleScene', { progress: this.#progress } satisfies BattleSceneData);
  }
}
