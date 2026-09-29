import * as Phaser from 'phaser';
import { chapter1 } from '../content/chapter1';
import { qwertzDe } from '../keyboard/qwertz-de';
import { FLOOR_Y, nurseryObjects, type NurseryObject } from '../nursery/objects';
import { TypingEngine } from '../typing/engine';
import { KeyboardView } from '../ui/KeyboardView';
import { WordLabel } from '../ui/WordLabel';

const LATER_ALPHA = 0.3;

export interface NurserySceneData {
  /** Index into the chapter 1 sections; defaults to the first. */
  readonly section?: number;
}

/** Chapter 1: the baby says sounds and the things in the nursery react. */
export class NurseryScene extends Phaser.Scene {
  #engine!: TypingEngine;
  #keyboard!: KeyboardView;
  #labels: WordLabel[] = [];
  #objectsByWord = new Map<string, NurseryObject>();

  constructor() {
    super('NurseryScene');
  }

  create(data: NurserySceneData): void {
    const sectionIndex = data.section ?? 0;
    const sections = chapter1.sections.slice(0, sectionIndex + 1);
    if (sections.length !== sectionIndex + 1) throw new Error(`chapter 1 has no section ${sectionIndex}`);
    const sounds = sections.flatMap((section) => section.sounds);

    this.add.rectangle(this.scale.width / 2, FLOOR_Y + 25, this.scale.width, 50, 0xe8dccb);

    // Every thing of the chapter is in the room; those of later sections stay pale and silent.
    this.#labels = [];
    this.#objectsByWord.clear();
    for (const sound of chapter1.sections.flatMap((section) => section.sounds)) {
      const factory = nurseryObjects[sound.object];
      if (!factory) throw new Error(`no nursery object "${sound.object}" for "${sound.word}"`);
      const object = factory(this);
      if (!sounds.includes(sound)) {
        object.view.setAlpha(LATER_ALPHA);
        continue;
      }
      this.#objectsByWord.set(sound.word, object);
      this.#labels.push(new WordLabel(this, object.label.x, object.label.y, sound.word));
    }

    this.#engine = new TypingEngine(sounds.map((sound) => sound.word));
    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 505, qwertzDe)
      .setScale(0.7)
      .setUnlocked(sections.flatMap((section) => section.newKeys));

    // Native listener: with fast typing, Phaser 4.2.1's keyboard plugin emitted keydown events more than once.
    window.addEventListener('keydown', this.#onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.#onKeyDown));
    this.#render();
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    // Only printable single characters count as typing; shortcuts and named keys are ignored.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;

    const events = this.#engine.type(event.key);
    this.#keyboard.press(event.code, events[0]?.type === 'correct');
    for (const typingEvent of events) {
      if (typingEvent.type !== 'complete') continue;
      this.#objectsByWord.get(typingEvent.word)?.react();
      this.#labels.find((label) => label.word === typingEvent.word)?.celebrate();
    }
    this.#render();
  };

  #render(): void {
    const { typed, candidates } = this.#engine;
    for (const label of this.#labels) {
      label.setProgress(typed, candidates.includes(label.word));
    }
    this.#keyboard.setNext(this.#engine.expectedChars);
  }
}
