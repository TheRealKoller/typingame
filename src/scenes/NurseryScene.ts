import * as Phaser from 'phaser';
import { chapter1 } from '../content/chapter1';
import { visibleSections } from '../content/rooms';
import type { Section } from '../content/types';
import { FINGER_NAME } from '../keyboard/fingers';
import { qwertzDe } from '../keyboard/qwertz-de';
import { FLOOR_Y, nurseryObjects, type NurseryObject } from '../nursery/objects';
import type { Progress } from '../progress/progress';
import { errorRate } from '../progress/stats';
import { UnlockTracker } from '../progress/unlock';
import { TypingEngine } from '../typing/engine';
import { Discoverable } from '../ui/Discoverable';
import { KeyboardView } from '../ui/KeyboardView';
import { StatsView } from '../ui/StatsView';
import { WordLabel } from '../ui/WordLabel';

const LATER_ALPHA = 0.5;
/** Lets the reaction to the last word play before the room changes. */
const UNLOCK_DELAY = 1200;
const FADE_DURATION = 600;
const HINT_DURATION = 5000;

export interface NurserySceneData {
  /** Saved progress plus the running session; decides the section. */
  readonly progress: Progress;
  /** Set when the section was just unlocked: the room wakes up and the new keys are introduced. */
  readonly announce?: boolean;
}

/** Chapter 1: the baby says sounds; a thing is discovered when its sound is said first, and it reacts every time. */
export class NurseryScene extends Phaser.Scene {
  #engine!: TypingEngine;
  #keyboard!: KeyboardView;
  #labels: WordLabel[] = [];
  #things = new Map<string, { readonly object: NurseryObject; readonly discoverable: Discoverable }>();
  #sectionIndex = 0;
  /** Null in the last section of the chapter. */
  #unlock: UnlockTracker | null = null;
  #unlockReached = false;
  #transitioning = false;
  #progress!: Progress;
  #statsView!: StatsView;

  constructor() {
    super('NurseryScene');
  }

  create(data: NurserySceneData): void {
    // A save may name a section that no longer exists; start the chapter over then.
    const sectionIndex = Math.max(
      chapter1.sections.findIndex((s) => s.id === data.progress.section),
      0,
    );
    const section = chapter1.sections[sectionIndex];
    if (!section) throw new Error('chapter 1 has no sections');
    const words = visibleSections(chapter1, sectionIndex).flatMap((s) => s.words);
    this.#progress = data.progress;
    this.#progress.section = section.id;
    this.#sectionIndex = sectionIndex;
    this.#unlock = sectionIndex + 1 < chapter1.sections.length ? new UnlockTracker() : null;
    this.#unlockReached = false;
    this.#transitioning = false;

    this.add.rectangle(this.scale.width / 2, FLOOR_Y + 25, this.scale.width, 50, 0xe8dccb);

    // Every thing of the room is there, blurred and pale until discovered; those of later sections are faint and silent.
    this.#labels = [];
    this.#things.clear();
    for (const word of chapter1.sections.filter((s) => s.room === section.room).flatMap((s) => s.words)) {
      const factory = nurseryObjects[word.object];
      if (!factory) throw new Error(`no nursery object "${word.object}" for "${word.text}"`);
      const object = factory(this);
      const discoverable = new Discoverable(object.view, this.#progress.discovered.has(word.text));
      if (!words.includes(word)) {
        object.view.setAlpha(LATER_ALPHA);
        continue;
      }
      this.#things.set(word.text, { object, discoverable });
      const label = new WordLabel(this, object.label.x, object.label.y, word.text);
      this.#labels.push(label);
      if (data.announce && section.words.includes(word)) {
        object.view.setAlpha(LATER_ALPHA);
        label.setAlpha(0);
        this.tweens.add({ targets: [object.view, label], alpha: 1, delay: FADE_DURATION, duration: 1500 });
      }
    }

    this.#engine = new TypingEngine(words.map((word) => word.text));
    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 505, qwertzDe)
      .setScale(0.7)
      .setUnlocked(chapter1.sections.slice(0, sectionIndex + 1).flatMap((s) => s.newKeys));

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

    if (data.announce) {
      this.cameras.main.fadeIn(FADE_DURATION);
      this.#showNewKeys(section);
    }
    this.#render();
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') {
      // Holding Tab shows the overview; keep the browser from moving focus.
      event.preventDefault();
      this.#showOverview();
      return;
    }
    if (this.#transitioning) return;
    // Only printable single characters count as typing; shortcuts and named keys are ignored.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;

    const events = this.#engine.type(event.key);
    const correct = events[0]?.type === 'correct';
    this.#progress.session.record(events, event.timeStamp);
    this.#statsView.update(this.#progress);
    this.#keyboard.press(event.code, correct);
    for (const typingEvent of events) {
      if (typingEvent.type !== 'complete') continue;
      const thing = this.#things.get(typingEvent.word);
      thing?.discoverable.discover();
      thing?.object.react();
      this.#labels.find((label) => label.word === typingEvent.word)?.celebrate();
      this.#progress.discover(typingEvent.word);
      void this.#progress.save();
    }
    this.#render();
    if (this.#unlock?.record(correct)) this.#unlockReached = true;
    // A started word is finished first, so the change never cuts it off.
    if (this.#unlockReached && this.#engine.typed === '') this.#advance();
  };

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') this.#hideOverview();
  };

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

  /** Moves to the next section once the current reaction had time to play. */
  #advance(): void {
    const next = chapter1.sections[this.#sectionIndex + 1];
    if (!next) return;
    this.#transitioning = true;
    this.#progress.section = next.id;
    void this.#progress.save();
    this.time.delayedCall(UNLOCK_DELAY, () => {
      this.cameras.main.fadeOut(FADE_DURATION);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.restart({ progress: this.#progress, announce: true } satisfies NurserySceneData),
      );
    });
  }

  /** Calm hint naming the new keys and the fingers that press them. */
  #showNewKeys(section: Section): void {
    const lines = section.newKeys.map((char) => {
      const key = qwertzDe.keys.find((k) => k.char === char);
      return key ? `${char.toUpperCase()} – ${FINGER_NAME[key.finger]}` : char.toUpperCase();
    });
    const text = this.add
      .text(0, 0, [section.newKeys.length === 1 ? 'Neue Taste' : 'Neue Tasten', ...lines], {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#4a4038',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5);
    const panel = this.add
      .rectangle(0, 0, text.width + 64, text.height + 40, 0xfffaf2, 0.94)
      .setRounded(16)
      .setStrokeStyle(2, 0xd9c8b4);
    // Free wall space between the mobile and the night light.
    const hint = this.add.container(820, 115, [panel, text]).setAlpha(0);
    this.tweens.chain({
      targets: hint,
      tweens: [
        { alpha: 1, delay: FADE_DURATION + 400, duration: 600 },
        { alpha: 0, delay: HINT_DURATION, duration: 800 },
      ],
      onComplete: () => hint.destroy(),
    });
  }

  #render(): void {
    const { typed, candidates } = this.#engine;
    for (const label of this.#labels) {
      label.setProgress(typed, candidates.includes(label.word));
    }
    this.#keyboard.setNext(this.#engine.expectedChars);
  }
}
