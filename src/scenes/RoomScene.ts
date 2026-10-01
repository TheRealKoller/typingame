import * as Phaser from 'phaser';
import { playOrder } from '../content/chapters';
import { visibleSections } from '../content/rooms';
import type { Section } from '../content/types';
import { FINGER_NAME } from '../keyboard/fingers';
import { qwertzDe } from '../keyboard/qwertz-de';
import { rooms } from '../things/rooms';
import type { Room, RoomAvatar, Thing } from '../things/thing';
import type { Progress } from '../progress/progress';
import { chooseShown, replaceTyped } from '../progress/practice';
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
/** The typed word's hop plays before it gives way to the next word. */
const WORD_OUT_DELAY = 350;
/**
 * Walking keys for the home row: held together with CapsLock they move the figure instead of
 * typing, so the hands never leave `asdf`/`jklö`. The arrow keys keep working as before.
 */
const WALK_KEYS: Readonly<Record<string, string>> = {
  h: 'ArrowLeft',
  j: 'ArrowDown',
  k: 'ArrowUp',
  l: 'ArrowRight',
};

/** How far beside a named thing the figure stops, in screen px. */
const WALK_BESIDE = 44;

/** How fast the arrow keys move the figure of a top-down room. */
const WALK_SPEED = 260;
/** The first *mama* is staged as a special moment; every later one reacts like any other word (design doc, section 4). */
const MOMENT_WORD = 'mama';
/** How far the other things and words step back while the moment plays. */
const MOMENT_RECEDE_ALPHA = 0.4;
/** How long light, word and the step forward run before everything returns. */
const MOMENT_MS = 3200;

export interface RoomSceneData {
  /** Saved progress plus the running session; decides the section and so the room. */
  readonly progress: Progress;
  /** Set when the section was just unlocked: the room wakes up and the new keys are introduced. */
  readonly announce?: boolean;
}

/** The room of a saved section, or null if the section is unknown. */
function roomFor(sectionId: string): Room | null {
  const place = playOrder.find((entry) => entry.section.id === sectionId);
  return place ? rooms[place.section.room] ?? null : null;
}

/**
 * One room of the game in the current section: the room's things wait blurred and pale
 * until their word is typed first, and react every time. Enough accuracy moves on to the
 * next section, into the next room or chapter.
 */
export class RoomScene extends Phaser.Scene {
  #engine!: TypingEngine;
  #keyboard!: KeyboardView;
  #labels: WordLabel[] = [];
  /** Words of the visible sections of the room; `#shown` are the ones on screen now. */
  #pool: string[] = [];
  #shown: string[] = [];
  #things = new Map<string, { readonly thing: Thing; readonly discoverable: Discoverable }>();
  /** Index of the current section in the play order. */
  #position = 0;
  /** Null in the last section of the game. */
  #unlock: UnlockTracker | null = null;
  #unlockReached = false;
  #transitioning = false;
  #progress!: Progress;
  #statsView!: StatsView;
  /** The figure the arrow keys move; only top-down rooms have one. */
  #avatar: RoomAvatar | null = null;
  readonly #arrows = new Set<string>();
  /** True while CapsLock is physically held down. */
  #capsHeld = false;
  /** Stable reference, so the frame listener can be removed again on shutdown. */
  readonly #walkFrame = (_time: number, delta: number): void => {
    this.#walk(delta);
  };

  constructor() {
    super('RoomScene');
  }

  /** Resolved in `init`, so the room's images can be loaded before the scene is drawn. */
  #room: Room | null = null;

  init(data: RoomSceneData): void {
    this.#room = roomFor(data.progress.section);
  }

  preload(): void {
    for (const asset of this.#room?.assets ?? []) this.load.image(asset.key, asset.url);
  }

  create(data: RoomSceneData): void {
    // A save may name a section that no longer exists; start the game over then.
    const position = Math.max(
      playOrder.findIndex((place) => place.section.id === data.progress.section),
      0,
    );
    const place = playOrder[position];
    if (!place) throw new Error('there are no sections');
    const { chapter, index, section } = place;
    const room = rooms[section.room];
    if (!room) throw new Error(`no room "${section.room}" for section ${section.id}`);
    const words = visibleSections(chapter, index).flatMap((s) => s.words);
    this.#progress = data.progress;
    this.#progress.section = section.id;
    this.#position = position;
    this.#unlock = position + 1 < playOrder.length ? new UnlockTracker() : null;
    this.#unlockReached = false;
    this.#transitioning = false;

    room.backdrop(this);

    // Every thing of the room is there, blurred and pale until discovered; those of later sections are faint and silent.
    // Only the shown words carry a label; the other things of the visible sections wait without one.
    this.#pool = words.map((word) => word.text);
    this.#shown = chooseShown(this.#pool, { discovered: this.#progress.discovered, keys: this.#progress.keys });
    this.#labels = [];
    this.#things.clear();
    for (const word of chapter.sections.filter((s) => s.room === section.room).flatMap((s) => s.words)) {
      const factory = room.things[word.object];
      if (!factory) throw new Error(`no thing "${word.object}" in ${section.room} for "${word.text}"`);
      const thing = factory(this);
      const discoverable = new Discoverable(thing.view, this.#progress.discovered.has(word.text));
      if (!words.includes(word)) {
        thing.view.setAlpha(LATER_ALPHA);
        continue;
      }
      this.#things.set(word.text, { thing, discoverable });
      const shown = this.#shown.includes(word.text);
      const label = new WordLabel(this, thing.label.x, thing.label.y, word.text).setAlpha(shown ? 1 : 0);
      this.#labels.push(label);
      if (data.announce && section.words.includes(word)) {
        thing.view.setAlpha(LATER_ALPHA);
        label.setAlpha(0);
        this.tweens.add({ targets: shown ? [thing.view, label] : [thing.view], alpha: 1, delay: FADE_DURATION, duration: 1500 });
      }
    }

    this.#avatar = room.avatar?.(this) ?? null;
    if (this.#avatar) {
      this.add
        .text(18, this.scale.height - 26, 'laufen: CapsLock + h j k l', {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#7a6a5a',
        })
        .setOrigin(0, 0.5)
        .setAlpha(0.7);
    }
    this.#engine = new TypingEngine(this.#shown);
    // Keys stay unlocked across rooms and chapters. The space bar adds a fourth row, so the keyboard sits a little higher and smaller.
    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 485, qwertzDe)
      .setScale(0.65)
      .setUnlocked(playOrder.slice(0, position + 1).flatMap((p) => p.section.newKeys));

    this.#statsView = new StatsView(this, this.scale.width / 2, 200);
    this.#statsView.update(this.#progress);

    // Native listeners: with fast typing, Phaser 4.2.1's keyboard plugin emitted keydown events more than once.
    window.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('keyup', this.#onKeyUp);
    window.addEventListener('blur', this.#hideOverview);
    // Keystrokes since the last finished word are saved when the window is hidden or closed.
    document.addEventListener('visibilitychange', this.#saveWhenHidden);
    window.addEventListener('pagehide', this.#save);
    this.events.on('update', this.#walkFrame);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('update', this.#walkFrame);
      window.removeEventListener('keydown', this.#onKeyDown);
      window.removeEventListener('keyup', this.#onKeyUp);
      window.removeEventListener('blur', this.#hideOverview);
      document.removeEventListener('visibilitychange', this.#saveWhenHidden);
      window.removeEventListener('pagehide', this.#save);
    });

    if (data.announce) {
      this.cameras.main.fadeIn(FADE_DURATION);
      this.#showNewKeys(section, room.hint);
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
    if (event.key === 'CapsLock') {
      this.#capsHeld = true;
      return;
    }
    // Walking is separate from typing: neither the arrow keys nor the walk keys type a character.
    const walking = event.getModifierState?.('CapsLock') === true || this.#capsHeld;
    const walkKey = WALK_KEYS[event.key.toLowerCase()];
    if (event.key.startsWith('Arrow') || (walking && walkKey !== undefined)) {
      event.preventDefault();
      this.#stopWalk();
      this.#arrows.add(walkKey ?? event.key);
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
      const entry = this.#things.get(typingEvent.word);
      // The moment belongs to the word's first typing, so it has to be read before the word is marked discovered.
      const firstTime = !this.#progress.discovered.has(typingEvent.word);
      entry?.discoverable.discover();
      entry?.thing.react();
      if (entry) this.#walkTo(entry.thing.view.x, entry.thing.view.y);
      this.#labels.find((label) => label.word === typingEvent.word)?.celebrate();
      this.#progress.discover(typingEvent.word);
      void this.#progress.save();
      if (firstTime && typingEvent.word === MOMENT_WORD) this.#playMamaMoment(entry?.thing);
      this.#rotate(typingEvent.word);
    }
    this.#render();
    if (this.#unlock?.record(correct)) this.#unlockReached = true;
    // A started word is finished first, so the change never cuts it off.
    if (this.#unlockReached && this.#engine.typed === '') this.#advance();
  };

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'CapsLock') {
      this.#capsHeld = false;
      return;
    }
    const walkKey = WALK_KEYS[event.key.toLowerCase()];
    if (walkKey !== undefined) this.#arrows.delete(walkKey);
    this.#arrows.delete(event.key);
    if (event.key === 'Tab') this.#hideOverview();
  };

  /** Stops the walk to a named thing so a held key can take over. */
  #stopWalk(): void {
    if (this.#avatar) this.tweens.killTweensOf(this.#avatar.view);
  }

  /**
   * Sends the figure over to the thing the player just named. Walking becomes the reward for
   * naming, so no mode has to be switched and the hands stay on the home row.
   */
  #walkTo(x: number, y: number): void {
    const avatar = this.#avatar;
    if (!avatar) return;
    const view = avatar.view;
    const targetX = Phaser.Math.Clamp(x + WALK_BESIDE, avatar.area.x0, avatar.area.x1);
    const targetY = Phaser.Math.Clamp(y + WALK_BESIDE, avatar.area.y0, avatar.area.y1);
    this.tweens.killTweensOf(view);
    const distance = Phaser.Math.Distance.Between(view.x, view.y, targetX, targetY);
    this.tweens.add({
      targets: view,
      x: targetX,
      y: targetY,
      duration: Math.max(240, (distance / WALK_SPEED) * 1000),
      ease: 'Sine.easeInOut',
    });
  }

  /** Moves the figure of a top-down room while an arrow key is held. */
  #walk(delta: number): void {
    const avatar = this.#avatar;
    if (!avatar) return;
    const step = (WALK_SPEED * delta) / 1000;
    const view = avatar.view;
    if (this.#arrows.has('ArrowLeft')) view.x -= step;
    if (this.#arrows.has('ArrowRight')) view.x += step;
    if (this.#arrows.has('ArrowUp')) view.y -= step;
    if (this.#arrows.has('ArrowDown')) view.y += step;
    view.x = Phaser.Math.Clamp(view.x, avatar.area.x0, avatar.area.x1);
    view.y = Phaser.Math.Clamp(view.y, avatar.area.y0, avatar.area.y1);
  }

  /** Lets another word of the room take the place of the one just typed, favouring weak keys. */
  #rotate(typed: string): void {
    const next = replaceTyped(this.#pool, this.#shown, typed, {
      discovered: this.#progress.discovered,
      keys: this.#progress.keys,
    });
    const incoming = next.find((word) => !this.#shown.includes(word));
    this.#shown = next;
    this.#engine.setWords(next);
    if (incoming === undefined) return;
    const outLabel = this.#labels.find((label) => label.word === typed);
    const inLabel = this.#labels.find((label) => label.word === incoming);
    // The typed word hops first, then gives way; the new word appears once it is gone.
    if (outLabel) this.tweens.add({ targets: outLabel, alpha: 0, delay: WORD_OUT_DELAY, duration: 500 });
    if (inLabel) {
      this.tweens.killTweensOf(inLabel);
      this.tweens.add({ targets: inLabel, alpha: 1, delay: WORD_OUT_DELAY + 300, duration: 800 });
    }
  }

  /**
   * Stages the first *mama*: warm light over the scene, the figure steps forward while the other
   * things and words step back, and her word floats above. Nothing is blocked; typing goes on.
   */
  #playMamaMoment(mama: Thing | undefined): void {
    const width = this.scale.width;
    const height = this.scale.height;

    // Warm light over the whole scene, slowly in and out again.
    const light = this.add.rectangle(width / 2, height / 2, width, height, 0xffd9a0).setDepth(5).setAlpha(0);
    this.tweens.chain({
      targets: light,
      tweens: [
        { alpha: 0.5, duration: 900, ease: 'Sine.easeOut' },
        { alpha: 0, delay: 1100, duration: 1200, ease: 'Sine.easeIn' },
      ],
      onComplete: () => light.destroy(),
    });

    // Her word, warm and large, above the scene.
    const word = this.add
      .text(width / 2, 130, MOMENT_WORD, { fontFamily: 'sans-serif', fontSize: '64px', color: '#e8a33d' })
      .setOrigin(0.5)
      .setDepth(6)
      .setAlpha(0);
    this.tweens.chain({
      targets: word,
      tweens: [
        { alpha: 0.95, y: 112, duration: 900, ease: 'Sine.easeOut' },
        { alpha: 0, y: 92, delay: 1100, duration: 1200, ease: 'Sine.easeIn' },
      ],
      onComplete: () => word.destroy(),
    });

    // Mama steps forward, the rest of the meadow steps back.
    const step = { duration: 900, hold: 1300, yoyo: true, ease: 'Sine.easeInOut' };
    if (mama) this.tweens.add({ targets: mama.view, scale: 1.18, ...step });
    for (const entry of this.#things.values()) {
      if (entry.thing === mama) continue;
      this.tweens.add({ targets: entry.thing.view, alpha: MOMENT_RECEDE_ALPHA, ...step });
    }
    const quiet = this.#labels.filter((label) => label.alpha > 0 && label.word !== MOMENT_WORD);
    for (const label of quiet) this.tweens.add({ targets: label, alpha: MOMENT_RECEDE_ALPHA, ...step });

    // A word typed meanwhile may have taken another's place, so the labels end in their true state.
    this.time.delayedCall(MOMENT_MS, () => {
      for (const label of quiet) {
        this.tweens.killTweensOf(label);
        label.setAlpha(this.#shown.includes(label.word) ? 1 : 0);
      }
    });
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

  /** Moves to the next section once the current reaction had time to play. */
  #advance(): void {
    const next = playOrder[this.#position + 1];
    if (!next) return;
    this.#transitioning = true;
    this.#progress.section = next.section.id;
    void this.#progress.save();
    this.time.delayedCall(UNLOCK_DELAY, () => {
      this.cameras.main.fadeOut(FADE_DURATION);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
        this.scene.restart({ progress: this.#progress, announce: true } satisfies RoomSceneData),
      );
    });
  }

  /** Calm hint naming the new keys and the fingers that press them. */
  #showNewKeys(section: Section, at: { readonly x: number; readonly y: number }): void {
    const lines = section.newKeys.map((char) => {
      const key = qwertzDe.keys.find((k) => k.char === char);
      return key ? `${key.label ?? char.toUpperCase()} – ${FINGER_NAME[key.finger]}` : char.toUpperCase();
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
    const hint = this.add.container(at.x, at.y, [panel, text]).setAlpha(0);
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
