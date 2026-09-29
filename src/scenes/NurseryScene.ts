import * as Phaser from 'phaser';
import { chapter1 } from '../content/chapter1';
import type { Section } from '../content/types';
import { FINGER_NAME } from '../keyboard/fingers';
import { qwertzDe } from '../keyboard/qwertz-de';
import { FLOOR_Y, nurseryObjects, type NurseryObject } from '../nursery/objects';
import { UnlockTracker } from '../progress/unlock';
import { TypingEngine } from '../typing/engine';
import { KeyboardView } from '../ui/KeyboardView';
import { WordLabel } from '../ui/WordLabel';

const LATER_ALPHA = 0.3;
/** Lets the reaction to the last word play before the room changes. */
const UNLOCK_DELAY = 1200;
const FADE_DURATION = 600;
const HINT_DURATION = 5000;

export interface NurserySceneData {
  /** Index into the chapter 1 sections; defaults to the first. */
  readonly section?: number;
  /** Set when the section was just unlocked: the room wakes up and the new keys are introduced. */
  readonly announce?: boolean;
}

/** Chapter 1: the baby says sounds and the things in the nursery react. */
export class NurseryScene extends Phaser.Scene {
  #engine!: TypingEngine;
  #keyboard!: KeyboardView;
  #labels: WordLabel[] = [];
  #objectsByWord = new Map<string, NurseryObject>();
  #sectionIndex = 0;
  /** Null in the last section of the chapter. */
  #unlock: UnlockTracker | null = null;
  #unlockReached = false;
  #transitioning = false;

  constructor() {
    super('NurseryScene');
  }

  create(data: NurserySceneData): void {
    const sectionIndex = data.section ?? 0;
    const sections = chapter1.sections.slice(0, sectionIndex + 1);
    const section = sections[sectionIndex];
    if (!section) throw new Error(`chapter 1 has no section ${sectionIndex}`);
    const sounds = sections.flatMap((s) => s.sounds);
    this.#sectionIndex = sectionIndex;
    this.#unlock = sectionIndex + 1 < chapter1.sections.length ? new UnlockTracker() : null;
    this.#unlockReached = false;
    this.#transitioning = false;

    this.add.rectangle(this.scale.width / 2, FLOOR_Y + 25, this.scale.width, 50, 0xe8dccb);

    // Every thing of the chapter is in the room; those of later sections stay pale and silent.
    this.#labels = [];
    this.#objectsByWord.clear();
    for (const sound of chapter1.sections.flatMap((s) => s.sounds)) {
      const factory = nurseryObjects[sound.object];
      if (!factory) throw new Error(`no nursery object "${sound.object}" for "${sound.word}"`);
      const object = factory(this);
      if (!sounds.includes(sound)) {
        object.view.setAlpha(LATER_ALPHA);
        continue;
      }
      this.#objectsByWord.set(sound.word, object);
      const label = new WordLabel(this, object.label.x, object.label.y, sound.word);
      this.#labels.push(label);
      if (data.announce && section.sounds.includes(sound)) {
        object.view.setAlpha(LATER_ALPHA);
        label.setAlpha(0);
        this.tweens.add({ targets: [object.view, label], alpha: 1, delay: FADE_DURATION, duration: 1500 });
      }
    }

    this.#engine = new TypingEngine(sounds.map((sound) => sound.word));
    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 505, qwertzDe)
      .setScale(0.7)
      .setUnlocked(sections.flatMap((section) => section.newKeys));

    // Native listener: with fast typing, Phaser 4.2.1's keyboard plugin emitted keydown events more than once.
    window.addEventListener('keydown', this.#onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.#onKeyDown));

    if (data.announce) {
      this.cameras.main.fadeIn(FADE_DURATION);
      this.#showNewKeys(section);
    }
    this.#render();
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (this.#transitioning) return;
    // Only printable single characters count as typing; shortcuts and named keys are ignored.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;

    const events = this.#engine.type(event.key);
    const correct = events[0]?.type === 'correct';
    this.#keyboard.press(event.code, correct);
    for (const typingEvent of events) {
      if (typingEvent.type !== 'complete') continue;
      this.#objectsByWord.get(typingEvent.word)?.react();
      this.#labels.find((label) => label.word === typingEvent.word)?.celebrate();
    }
    this.#render();
    if (this.#unlock?.record(correct)) this.#unlockReached = true;
    // A started word is finished first, so the change never cuts it off.
    if (this.#unlockReached && this.#engine.typed === '') this.#advance();
  };

  /** Moves to the next section once the current reaction had time to play. */
  #advance(): void {
    this.#transitioning = true;
    this.time.delayedCall(UNLOCK_DELAY, () => {
      this.cameras.main.fadeOut(FADE_DURATION);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.restart({ section: this.#sectionIndex + 1, announce: true } satisfies NurserySceneData),
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
    const hint = this.add.container(820, 90, [panel, text]).setAlpha(0);
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
