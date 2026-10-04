import * as Phaser from 'phaser';
import { HOME_ROW_KEYS, HOME_ROW_WORDS } from '../content/words';
import { qwertzDe } from '../keyboard/qwertz-de';
import { pickWord } from '../progress/practice';
import type { Progress } from '../progress/progress';
import { errorRate } from '../progress/stats';
import { TypingEngine } from '../typing/engine';
import { KeyboardView } from '../ui/KeyboardView';
import { StatsView } from '../ui/StatsView';
import { WordLabel } from '../ui/WordLabel';

/** Number of words on screen at once. */
const SHOWN_WORDS = 3;
const WORD_Y = 200;
const WORD_SPACING = 300;

export interface HomeRowSceneData {
  readonly progress: Progress;
}

/**
 * Plain typing on the home row: a few words, the on-screen keyboard and the
 * statistics. Stands in for the game until the first battle exists.
 */
export class HomeRowScene extends Phaser.Scene {
  #engine!: TypingEngine;
  #keyboard!: KeyboardView;
  #statsView!: StatsView;
  #progress!: Progress;
  #labels: WordLabel[] = [];

  create(data: HomeRowSceneData): void {
    this.#progress = data.progress;
    this.#labels = [];
    const shown: string[] = [];
    for (let i = 0; i < SHOWN_WORDS; i++) {
      const word = pickWord(HOME_ROW_WORDS, shown, { keys: this.#progress.keys });
      if (word === null) break;
      shown.push(word);
      this.#labels.push(new WordLabel(this, this.#slotX(i), WORD_Y, word, 44));
    }
    this.#engine = new TypingEngine(shown);
    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 485, qwertzDe)
      .setScale(0.65)
      .setUnlocked(HOME_ROW_KEYS);
    this.#statsView = new StatsView(this, this.scale.width / 2, 200);
    this.#statsView.update(this.#progress);

    // Native listeners: with fast typing, Phaser 4.2.1's keyboard plugin emitted keydown events more than once.
    window.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('keyup', this.#onKeyUp);
    window.addEventListener('blur', this.#hideOverview);
    // Keystrokes since the last finished word are saved when the window is hidden or closed.
    document.addEventListener('visibilitychange', this.#saveWhenHidden);
    window.addEventListener('pagehide', this.#save);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', this.#onKeyDown);
      window.removeEventListener('keyup', this.#onKeyUp);
      window.removeEventListener('blur', this.#hideOverview);
      document.removeEventListener('visibilitychange', this.#saveWhenHidden);
      window.removeEventListener('pagehide', this.#save);
    });
    this.#render();
  }

  #slotX(index: number): number {
    return this.scale.width / 2 + (index - (SHOWN_WORDS - 1) / 2) * WORD_SPACING;
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') {
      // Holding Tab shows the overview; keep the browser from moving focus.
      event.preventDefault();
      this.#showOverview();
      return;
    }
    // Only printable single characters count as typing; shortcuts and named keys are ignored.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;

    const events = this.#engine.type(event.key);
    this.#progress.session.record(events, event.timeStamp);
    this.#statsView.update(this.#progress);
    this.#keyboard.press(event.code, events[0]?.type === 'correct');
    for (const typingEvent of events) {
      if (typingEvent.type !== 'complete') continue;
      this.#replace(typingEvent.word);
      void this.#progress.save();
    }
    this.#render();
  };

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') this.#hideOverview();
  };

  /** Puts another word, favouring weak keys, in place of the one just typed. */
  #replace(typed: string): void {
    const index = this.#labels.findIndex((label) => label.word === typed);
    const others = this.#labels.filter((label) => label.word !== typed).map((label) => label.word);
    const next = pickWord(
      HOME_ROW_WORDS.filter((word) => word !== typed),
      others,
      { keys: this.#progress.keys },
    );
    if (index < 0 || next === null) return;
    this.#labels[index]?.destroy();
    const label = new WordLabel(this, this.#slotX(index), WORD_Y, next, 44);
    label.celebrate();
    this.#labels[index] = label;
    this.#engine.setWords(this.#labels.map((l) => l.word));
  }

  #showOverview(): void {
    const rates = new Map(Object.entries(this.#progress.keys).map(([char, stats]) => [char, errorRate(stats)]));
    this.#keyboard.setErrorRates(rates);
    this.#statsView.setOverviewVisible(true);
  }

  readonly #hideOverview = (): void => {
    this.#keyboard.setErrorRates(null);
    this.#statsView.setOverviewVisible(false);
  };

  readonly #save = (): void => {
    void this.#progress.save();
  };

  readonly #saveWhenHidden = (): void => {
    if (document.visibilityState === 'hidden') this.#save();
  };

  #render(): void {
    const { typed, candidates } = this.#engine;
    for (const label of this.#labels) label.setProgress(typed, candidates.includes(label.word));
    this.#keyboard.setNext(this.#engine.expectedChars);
  }
}
