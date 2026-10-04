import * as Phaser from 'phaser';
import { Battle, type Enemy, type Shot, type Tower } from '../battle/battle';
import { Commands, type Command } from '../battle/commands';
import type { BuildSite } from '../battle/level';
import type { Point } from '../battle/path';
import { practiceLevel } from '../content/library';
import { RAID_LEVEL } from '../content/raid';
import { JOURNEY, RAID, raidSetup, STAGES, stageIndex, stageSetup, type StageSetup } from '../content/tutorial';
import { FINGER_NAME } from '../keyboard/fingers';
import { qwertzDe } from '../keyboard/qwertz-de';
import { UnlockTracker } from '../progress/unlock';
import type { Progress } from '../progress/progress';
import { errorRate } from '../progress/stats';
import { TypingEngine } from '../typing/engine';
import { KeyboardView } from '../ui/KeyboardView';
import { StatsView } from '../ui/StatsView';
import { WordLabel } from '../ui/WordLabel';
import { nextScene } from './flow';
import {
  BANNER_FRAME,
  BOOK_PILE,
  BOOKSHELF,
  BOOKSHELF_BURNT,
  FIRE,
  FIRE_BURNING,
  BRICK_FRAME,
  CARPET_FRAME,
  CONSTRUCTION,
  CONSTRUCTION_REVEAL,
  DUNGEON,
  ENEMY_SHEETS,
  FLOOR_FRAMES,
  LECTERN,
  LIBRARY_SCALE,
  READING_DESK,
  SCROLL,
  TORCH,
  TORCH_FLAME,
  TOWER_ART,
  WALL_EDGE_FRAME,
  createBattleArt,
  deathAnimation,
  preloadBattleArt,
  walkAnimation,
  type Heading,
} from './battleArt';

const PATH_WIDTH = 64;
const CARPET_EDGE = 0x5a1414;
const PAD_COLOR = 0xd9cdb8;
const PAD_EDGE = 0x6e6252;
/** The back wall of the reading room, with shelves standing against it. */
const WALL_HEIGHT = 96;
/** Word labels sit this far above the centre of their build site. */
const LABEL_OFFSET = 52;
const WORD_SIZE = 30;
/** Longest step fed to the battle, so a hidden window does not make enemies jump. */
const MAX_STEP_MS = 100;
const PROJECTILE_SPEED = 900;
const WARD_RADIUS = 46;
const WARD_COLOR = 0x9fd4ff;
const HUD_TEXT = '#2f2a24';
const HUD_OUTLINE = '#f6efe6';
/** The desk with keyboard and notes covers the screen below this line; the map stays above it. */
const DESK_TOP = 470;
const DESK_DEPTH = 1500;
/** Keyboard and the text on the notes lie on the desk. */
const ON_DESK_DEPTH = 1600;
const WOOD = 0x7a4a2e;
const WOOD_DARK = 0x5e3820;
const WOOD_LIGHT = 0x9a6640;
const WOOD_EDGE = 0xb57d50;
const PAPER = 0xf4ead6;
const PAPER_EDGE = 0xcbb894;

/** Furniture of the reading room, clear of the carpet and the build sites; `frame` picks a variant. */
const FURNITURE: readonly { key: string; frame?: number; x: number; y: number }[] = [
  ...[96, 160, 420, 484, 548, 820, 884, 1060, 1124].map((x, i) => ({ key: BOOKSHELF, frame: i % 3, x, y: 86 })),
  { key: LECTERN, x: 60, y: 420 },
  { key: READING_DESK, x: 880, y: 420 },
  { key: BOOK_PILE, frame: 0, x: 1200, y: 320 },
  { key: BOOK_PILE, frame: 1, x: 520, y: 175 },
  { key: SCROLL, x: 1210, y: 420 },
];
/** Banners and torches on the back wall. */
const BANNERS: readonly number[] = [250, 710, 990];
const TORCHES: readonly number[] = [340, 740, 1200];
/** Floor tiles that are worn, as column/row of 64 px cells. */
const WORN_TILES: readonly [number, number][] = [
  [2, 3], [5, 5], [9, 2], [13, 4], [16, 6], [7, 6], [11, 5], [18, 3],
];

export interface BattleSceneData {
  readonly progress: Progress;
  /** Set when the stage has just begun: a hint names its new keys. */
  readonly announce?: boolean;
}

interface EnemyView {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly health: Phaser.GameObjects.Graphics;
  /** Health as far as the hits have landed on screen; a bolt in flight has not hit yet. */
  shownHealth: number;
  last: Point;
}

interface TowerView {
  readonly weapon: Phaser.GameObjects.Sprite;
}

/** A visible word and where it stands. */
interface Placed {
  readonly word: string;
  readonly x: number;
  readonly y: number;
}

/**
 * The first level: build towers by typing the words on the build sites, then
 * let the waves come. The rules live in `Battle` and `Commands`; this scene
 * only draws them and passes the typing on.
 */
export class BattleScene extends Phaser.Scene {
  #progress!: Progress;
  #battle!: Battle;
  #commands!: Commands;
  #engine!: TypingEngine;
  #keyboard!: KeyboardView;
  #statsView!: StatsView;
  #labels: WordLabel[] = [];
  #labelKey = '';
  #enemies = new Map<number, EnemyView>();
  #towers = new Map<string, TowerView>();
  #ward!: Phaser.GameObjects.Graphics;
  #phaseText!: Phaser.GameObjects.Text;
  #inkText!: Phaser.GameObjects.Text;
  #wardText!: Phaser.GameObjects.Text;
  #endPanel: Phaser.GameObjects.Container | null = null;
  /** Position in `STAGES` and what it unlocks. */
  #stage = 0;
  #setup!: StageSetup;
  /** Null during the raid: there is nothing left to unlock. */
  #unlock: UnlockTracker | null = null;
  #unlockReached = false;
  /** The raid on the library instead of a practice battle. */
  #raid = false;
  /** Shelves that can still catch fire in the raid, in the order they burn. */
  #shelves: Phaser.GameObjects.Image[] = [];
  #darkness: Phaser.GameObjects.Rectangle | null = null;

  preload(): void {
    preloadBattleArt(this);
  }

  create(data: BattleSceneData): void {
    createBattleArt(this);
    this.#progress = data.progress;
    this.#raid = this.#progress.stage === RAID;
    // The raid is fought with every key of the tutorial.
    this.#stage = this.#raid ? STAGES.length - 1 : stageIndex(this.#progress.stage);
    this.#setup = this.#raid ? raidSetup() : stageSetup(this.#stage);
    this.#unlock = this.#raid ? null : new UnlockTracker();
    this.#unlockReached = false;
    this.#battle = new Battle(this.#raid ? RAID_LEVEL : practiceLevel(STAGES[this.#stage]!.section));
    this.#shelves = [];
    this.#darkness = null;
    this.#commands = this.#newCommands();
    this.#labels = [];
    this.#labelKey = '';
    this.#enemies = new Map();
    this.#towers = new Map();
    this.#endPanel = null;

    this.#drawMap();
    this.#drawDesk();
    this.#drawHud();
    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 540, qwertzDe).setScale(0.5).setUnlocked(this.#setup.keys);
    this.#keyboard.setDepth(ON_DESK_DEPTH);
    this.#statsView = new StatsView(this, { x: this.scale.width - 28, y: 502 }, { x: this.scale.width / 2, y: 240 });
    this.#statsView.update(this.#progress);
    this.#engine = new TypingEngine(this.#words());

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
    this.#sync();
    if (data.announce && !this.#raid) this.#showNewKeys(STAGES[this.#stage]!.newKeys);
  }

  override update(_time: number, delta: number): void {
    const step = this.#battle.update(Math.min(delta, MAX_STEP_MS));
    // Shots and arrivals first: they take their enemies out of the walking ones.
    for (const shot of step.shots) this.#showShot(shot);
    for (const enemy of step.arrived) this.#showArrival(enemy);
    this.#drawEnemies();
    // A started word or a selected build site is finished first, so the new keys never cut them off.
    if (this.#unlockReached && this.#engine.typed === '' && !this.#commands.selected) this.#advance();
    this.#sync();
  }

  /**
   * Words that can be typed now: the commands while the level runs, then the
   * flood word to play again – except after the raid, where the story goes on.
   */
  #words(): readonly string[] {
    if (!this.#ended()) return this.#commands.words;
    return this.#raid ? [] : [this.#setup.floodWord];
  }

  #ended(): boolean {
    return this.#battle.phase === 'won' || this.#battle.phase === 'lost';
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') {
      // Holding Tab shows the overview; keep the browser from moving focus.
      event.preventDefault();
      this.#showOverview();
      return;
    }
    if (event.key === 'Escape') {
      // Cancelling is no keystroke: it counts neither as right nor as wrong.
      this.#engine.cancel();
      this.#commands.cancel();
      this.#sync();
      return;
    }
    // Only printable single characters count as typing; shortcuts and named keys are ignored.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;
    // After the raid nothing is left to type; keystrokes would only count as mistakes.
    if (this.#raid && this.#ended()) return;

    const events = this.#engine.type(event.key);
    const correct = events[0]?.type === 'correct';
    this.#progress.session.record(events, event.timeStamp);
    this.#statsView.update(this.#progress);
    this.#keyboard.press(event.code, correct);
    for (const typingEvent of events) {
      if (typingEvent.type !== 'complete') continue;
      void this.#progress.save();
      if (this.#ended()) {
        this.scene.restart({ progress: this.#progress } satisfies BattleSceneData);
        return;
      }
      this.#apply(this.#commands.complete(typingEvent.word));
    }
    if (this.#unlock?.record(correct)) this.#unlockReached = true;
    this.#sync();
  };

  #newCommands(): Commands {
    const { towers, floodWord, words } = this.#setup;
    return new Commands(this.#battle, towers, floodWord, words, { keys: this.#progress.keys });
  }

  /**
   * Unlocks the next stage: new keys on the keyboard, new words on the free
   * build sites, a hint naming the keys. A new section starts with its cutscene
   * and a fresh battle instead; after the last stage comes the raid.
   */
  #advance(): void {
    this.#stage++;
    const stage = STAGES[this.#stage];
    this.#progress.stage = stage?.id ?? RAID;
    void this.#progress.save();
    const next = nextScene(this.#progress, true);
    if (!stage || next.key !== 'BattleScene') {
      this.scene.start(next.key, next.data);
      return;
    }
    this.#setup = stageSetup(this.#stage);
    this.#commands = this.#newCommands();
    this.#keyboard.setUnlocked(this.#setup.keys);
    this.#unlock = new UnlockTracker();
    this.#unlockReached = false;
    this.#showNewKeys(stage.newKeys);
  }

  /** Calm hint over the map naming the new keys and the fingers that press them. */
  #showNewKeys(keys: readonly string[]): void {
    const lines = keys.map((char) => {
      const key = qwertzDe.keys.find((k) => k.char === char);
      const name = key?.label ?? char.toUpperCase();
      return key ? `${name} – ${FINGER_NAME[key.finger]}` : name;
    });
    const text = this.add
      .text(0, 0, ['Neue Tasten', ...lines], { fontFamily: 'sans-serif', fontSize: '26px', color: HUD_TEXT, align: 'center', lineSpacing: 8 })
      .setOrigin(0.5);
    const panel = this.add
      .rectangle(0, 0, text.width + 64, text.height + 36, 0xfffaf2, 0.95)
      .setRounded(16)
      .setStrokeStyle(2, 0xd9c8b4);
    const hint = this.add.container(this.scale.width / 2, 240, [panel, text]).setDepth(1900).setAlpha(0);
    this.tweens.chain({
      targets: hint,
      tweens: [
        { alpha: 1, duration: 500 },
        { alpha: 0, delay: 3500, duration: 800 },
      ],
      onComplete: () => hint.destroy(),
    });
  }

  readonly #onKeyUp = (event: KeyboardEvent): void => {
    if (event.key === 'Tab') this.#hideOverview();
  };

  #apply(command: Command | null): void {
    if (command?.type === 'build') this.#showTower(this.#battle.towerAt(command.site));
    if (command?.type === 'tooExpensive') this.#float(command.site, 'Zu wenig Tinte', '#8a2f2f');
  }

  /** Brings words, typing engine, keyboard and HUD in line with the battle. */
  #sync(): void {
    // Keeps a started word as long as it stays visible.
    this.#engine.setWords(this.#words());
    const placed = this.#placedWords();
    const key = placed.map((p) => `${p.word}@${p.x},${p.y}`).join('|');
    if (key !== this.#labelKey) {
      for (const label of this.#labels) label.destroy();
      // Above everything, including the end panel that carries the word to play again.
      this.#labels = placed.map((p) => new WordLabel(this, p.x, p.y, p.word, WORD_SIZE).setDepth(1001));
      this.#labelKey = key;
    }
    const { typed, candidates } = this.#engine;
    for (const label of this.#labels) label.setProgress(typed, candidates.includes(label.word));
    this.#keyboard.setNext(this.#engine.expectedChars);
    this.#updateHud();
  }

  #placedWords(): Placed[] {
    if (this.#ended()) return this.#words().map((word) => ({ word, x: this.scale.width / 2, y: 290 }));
    const selected = this.#commands.selected;
    if (selected) {
      return this.#commands.words.map((word) => ({ word, x: selected.x, y: selected.y - LABEL_OFFSET }));
    }
    const placed: Placed[] = [];
    for (const site of this.#battle.level.sites) {
      const word = this.#commands.siteWord(site);
      if (word !== null) placed.push({ word, x: site.x, y: site.y - LABEL_OFFSET });
    }
    if (this.#battle.phase === 'flood') placed.push({ word: this.#setup.floodWord, x: this.scale.width / 2, y: 46 });
    return placed;
  }

  /** The reading room: stone floor, back wall with shelves, banners and torches, a carpet as the path. */
  #drawMap(): void {
    const { width } = this.scale;
    const tile = 32 * LIBRARY_SCALE;
    this.add.tileSprite(0, 0, width, DESK_TOP, DUNGEON, FLOOR_FRAMES[0]).setOrigin(0).setTileScale(LIBRARY_SCALE);
    for (const [column, row] of WORN_TILES) {
      this.add.image(column * tile, row * tile, DUNGEON, FLOOR_FRAMES[2]).setOrigin(0).setScale(LIBRARY_SCALE);
    }

    this.add.tileSprite(0, 0, width, WALL_HEIGHT, DUNGEON, BRICK_FRAME).setOrigin(0).setTileScale(LIBRARY_SCALE);
    this.add
      .tileSprite(0, WALL_HEIGHT - 8 * LIBRARY_SCALE, width, 8 * LIBRARY_SCALE, DUNGEON, WALL_EDGE_FRAME)
      .setOrigin(0)
      .setTileScale(LIBRARY_SCALE);
    for (const x of BANNERS) this.add.image(x, 8, DUNGEON, BANNER_FRAME).setOrigin(0.5, 0).setScale(LIBRARY_SCALE);
    for (const x of TORCHES) this.add.sprite(x, 44, TORCH).setScale(LIBRARY_SCALE).play(TORCH_FLAME);

    const path = this.#battle.level.path;
    const segments = path.slice(1).map((to, i) => {
      const from = path[i]!;
      return {
        x: Math.min(from.x, to.x) - PATH_WIDTH / 2,
        y: Math.min(from.y, to.y) - PATH_WIDTH / 2,
        width: Math.abs(to.x - from.x) + PATH_WIDTH,
        height: Math.abs(to.y - from.y) + PATH_WIDTH,
      };
    });
    // Outline every segment, then lay the carpet again over the inner edges so only the outline of the whole carpet remains.
    const edges = this.add.graphics().setDepth(1).fillStyle(CARPET_EDGE, 1);
    for (const s of segments) edges.fillRect(s.x - 3, s.y - 3, s.width + 6, s.height + 6);
    for (const s of segments) {
      this.add.tileSprite(s.x, s.y, s.width, s.height, DUNGEON, CARPET_FRAME).setOrigin(0).setTileScale(LIBRARY_SCALE).setDepth(1);
    }

    for (const { key, frame, x, y } of FURNITURE) {
      // Furniture stands on its lower edge, so it sorts with towers and golems by that line.
      const image = this.add.image(x, y, key, frame).setOrigin(0.5, 1);
      image.setY(y + image.height / 2).setDepth(y + image.height / 2);
      if (key === BOOKSHELF) this.#shelves.push(image);
    }
    // In the raid the fire spreads from the ward circle towards the door.
    this.#shelves.sort((a, b) => b.x - a.x);
    if (this.#raid) {
      this.#darkness = this.add.rectangle(0, 0, this.scale.width, DESK_TOP, 0x120808, 0).setOrigin(0).setDepth(990);
    }

    for (const site of this.#battle.level.sites) {
      this.add
        .rectangle(site.x, site.y, 56, 56, PAD_COLOR)
        .setStrokeStyle(3, PAD_EDGE)
        .setDepth(2);
    }

    const end = path.at(-1)!;
    this.#ward = this.add.graphics({ x: end.x, y: end.y }).setDepth(3);
    this.tweens.add({ targets: this.#ward, alpha: { from: 1, to: 0.6 }, duration: 1200, yoyo: true, repeat: -1 });
  }

  /** Wooden desk below the map: the keyboard lies on it, the notes left and right carry the texts. */
  #drawDesk(): void {
    const { width, height } = this.scale;
    const desk = this.add.graphics().setDepth(DESK_DEPTH);
    // Shadow on the grass, then the front edge and the boards.
    desk.fillStyle(0x000000, 0.25).fillRect(0, DESK_TOP - 6, width, 6);
    desk.fillStyle(WOOD_LIGHT, 1).fillRect(0, DESK_TOP, width, 12);
    desk.fillStyle(WOOD_EDGE, 1).fillRect(0, DESK_TOP, width, 3);
    desk.fillStyle(WOOD_DARK, 1).fillRect(0, DESK_TOP + 12, width, 3);
    desk.fillStyle(WOOD, 1).fillRect(0, DESK_TOP + 15, width, height - DESK_TOP - 15);
    const boardHeight = 44;
    for (let y = DESK_TOP + 15 + boardHeight; y < height; y += boardHeight) {
      desk.fillStyle(WOOD_DARK, 1).fillRect(0, y, width, 3);
    }
    // Grain: short darker and lighter strokes in a fixed pattern, so the desk looks the same every time.
    for (let i = 0; i < 160; i++) {
      const x = (i * 197) % width;
      const y = DESK_TOP + 22 + ((i * 53) % (height - DESK_TOP - 30));
      desk.fillStyle(i % 3 === 0 ? WOOD_LIGHT : WOOD_DARK, 0.6).fillRect(x, y, 18 + ((i * 7) % 30), 2);
    }

    for (const note of [
      { x: 12, width: 432 },
      { x: width - 444, width: 432 },
    ]) {
      desk.fillStyle(0x000000, 0.25).fillRect(note.x + 4, 492, note.width, 216);
      desk.fillStyle(PAPER, 1).fillRect(note.x, 488, note.width, 216);
      desk.lineStyle(2, PAPER_EDGE, 1).strokeRect(note.x, 488, note.width, 216);
    }
  }

  #drawHud(): void {
    // On the left note of the desk.
    const style = { fontFamily: 'sans-serif', fontSize: '20px', color: HUD_TEXT };
    this.#phaseText = this.add.text(28, 502, '', { ...style, wordWrap: { width: 400 } }).setDepth(ON_DESK_DEPTH);
    this.#inkText = this.add.text(28, 636, '', style).setDepth(ON_DESK_DEPTH);
    this.#wardText = this.add.text(28, 668, '', style).setDepth(ON_DESK_DEPTH);
  }

  #updateHud(): void {
    const battle = this.#battle;
    const waves = battle.level.waves.length;
    const phase = {
      flood: `Flut – baue Türme. Tippe »${this.#setup.floodWord}«, wenn Welle ${battle.wave + 1} von ${waves} kommen soll.`,
      ebb: `Ebbe – Welle ${battle.wave + 1} von ${waves} rückt vor.`,
      won: 'Gewonnen! Das Verstummen ist zurückgedrängt.',
      lost: 'Der Bannkreis ist gebrochen.',
    }[battle.phase];
    const tower = this.#setup.towers[0]!;
    const selected = this.#commands.selected
      ? `Bauplatz gewählt – »${tower.keyword}« baut einen Armbrustturm (${tower.cost} Tinte), Esc geht zurück.`
      : null;
    this.#phaseText.setText(selected ?? phase);
    this.#inkText.setText(`Tinte: ${battle.ink}`);
    this.#wardText.setText(`Bannkreis: ${battle.ward} / ${battle.level.ward}`);

    const strength = battle.ward / battle.level.ward;
    this.#ward
      .clear()
      .fillStyle(WARD_COLOR, 0.15 + 0.25 * strength)
      .fillCircle(0, 0, WARD_RADIUS)
      .lineStyle(4, WARD_COLOR, 0.3 + 0.7 * strength)
      .strokeCircle(0, 0, WARD_RADIUS)
      .lineStyle(2, 0xffffff, 0.6 * strength)
      .strokeCircle(0, 0, WARD_RADIUS - 10);

    if (this.#ended() && !this.#endPanel) {
      if (this.#raid) this.#endRaid();
      else this.#showEnd();
    }
  }

  #drawEnemies(): void {
    for (const enemy of this.#battle.enemies) {
      const at = this.#battle.positionOf(enemy);
      let view = this.#enemies.get(enemy.id);
      if (!view) {
        view = {
          sprite: this.#enemySprite(enemy, at),
          health: this.add.graphics(),
          shownHealth: enemy.kind.health,
          last: at,
        };
        this.#enemies.set(enemy.id, view);
      }
      const heading = this.#heading(view, enemy, at);
      view.sprite.setPosition(at.x, at.y).setDepth(at.y + 100);
      view.sprite.play(walkAnimation(enemy.kind.id, heading), true);
      view.last = at;
      this.#drawHealth(view, enemy, at);
    }
  }

  #drawHealth(view: EnemyView, enemy: Enemy, at: Point): void {
    const share = view.shownHealth / enemy.kind.health;
    view.health
      .clear()
      .setDepth(at.y + 101)
      .fillStyle(0x2f2a24, 0.8)
      .fillRect(at.x - 18, at.y - 36, 36, 5)
      .fillStyle(share > 0.5 ? 0x8fd16a : 0xe0a040, 1)
      .fillRect(at.x - 17, at.y - 35, 34 * share, 3);
  }

  #enemySprite(enemy: Enemy, at: Point): Phaser.GameObjects.Sprite {
    const sheet = ENEMY_SHEETS[enemy.kind.id];
    const sprite = this.add.sprite(at.x, at.y, enemy.kind.id).setScale(sheet?.scale ?? 1);
    if (sheet?.tint !== undefined) sprite.setTint(sheet.tint);
    return sprite;
  }

  /** An enemy reached the ward circle: it fades into the circle, and the circle shudders. In the raid, a shelf catches fire. */
  #showArrival(enemy: Enemy): void {
    const view = this.#enemies.get(enemy.id);
    if (view) {
      this.#enemies.delete(enemy.id);
      view.health.destroy();
      this.tweens.add({ targets: view.sprite, alpha: 0, scale: 0.4, duration: 300, onComplete: () => view.sprite.destroy() });
    }
    this.tweens.add({ targets: this.#ward, scale: { from: 1.25, to: 1 }, duration: 350, ease: 'Back.easeOut' });
    if (this.#raid) this.#ignite(enemy.kind.wardDamage);
  }

  /** Sets the next `count` shelves on fire and lets the room grow darker with the weakening ward. */
  #ignite(count: number): void {
    for (const shelf of this.#shelves.splice(0, count)) {
      shelf.setTexture(BOOKSHELF_BURNT, shelf.frame.name);
      this.add
        .sprite(shelf.x, shelf.y, FIRE)
        .setOrigin(0.5, 1)
        .setScale(LIBRARY_SCALE)
        .setDepth(shelf.depth + 1)
        .play({ key: FIRE_BURNING, startFrame: Math.floor(Math.random() * 2) });
    }
    const lost = 1 - this.#battle.ward / this.#battle.level.ward;
    this.#darkness?.setFillStyle(0x120808, 0.55 * lost);
  }

  /**
   * The raid always ends with the ward broken: the room goes dark, Kalliope is
   * gone, and the story goes on with the cutscene after the raid.
   */
  #endRaid(): void {
    this.#endPanel = this.add.container();
    this.#progress.stage = JOURNEY;
    void this.#progress.save();
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(1500, 18, 8, 8);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        const next = nextScene(this.#progress);
        this.scene.start(next.key, next.data);
      });
    });
  }

  /** Picks the sprite row from the direction of travel and flips side views as needed. */
  #heading(view: EnemyView, enemy: Enemy, at: Point): Heading {
    const dx = at.x - view.last.x;
    const dy = at.y - view.last.y;
    if (dx === 0 && dy === 0) return (view.sprite.getData('heading') as Heading | undefined) ?? 'side';
    const heading: Heading = Math.abs(dx) >= Math.abs(dy) ? 'side' : dy > 0 ? 'down' : 'up';
    if (heading === 'side') {
      const faces = ENEMY_SHEETS[enemy.kind.id]?.sideFaces ?? 'right';
      view.sprite.setFlipX((dx > 0) !== (faces === 'right'));
    } else {
      view.sprite.setFlipX(false);
    }
    view.sprite.setData('heading', heading);
    return heading;
  }

  #showTower(tower: Tower | undefined): void {
    if (!tower) return;
    const art = TOWER_ART[tower.kind.id];
    if (!art) return;
    const { x, y } = tower.site;
    // The base stands on the pad; its top square carries the weapon.
    const base = this.add.sprite(x, y + 32, art.base, 0).setOrigin(0.5, 1).setDepth(y + 50);
    const weapon = this.add.sprite(x, y - 51, art.weapon, 0).setDepth(y + 51);
    for (const part of [base, weapon]) part.setAlpha(0);
    const cloud = this.add.sprite(x, y - 32, CONSTRUCTION, 6).setDepth(y + 52);
    cloud.play(CONSTRUCTION_REVEAL);
    this.time.delayedCall(150, () => {
      for (const part of [base, weapon]) part.setAlpha(1);
    });
    cloud.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => cloud.destroy());
    this.#towers.set(tower.site.id, { weapon });
  }

  /**
   * The tower turns and shoots; the bolt follows its target. The hit counts on
   * screen only when the bolt lands: then the health bar drops or the enemy dies.
   */
  #showShot(shot: Shot): void {
    const art = TOWER_ART[shot.tower.kind.id];
    const view = this.#towers.get(shot.tower.site.id);
    const enemyView = this.#enemies.get(shot.enemy.id);
    if (!art || !view || !enemyView) return;
    // A defeated enemy leaves the battle now; it stays on screen until the bolt arrives.
    if (shot.defeated) this.#enemies.delete(shot.enemy.id);

    const from = { x: view.weapon.x, y: view.weapon.y };
    const target = enemyView.sprite;
    const angle = Phaser.Math.Angle.Between(from.x, from.y, target.x, target.y);
    // The Spire weapons and projectiles point up.
    view.weapon.setRotation(angle + Math.PI / 2).play(art.weaponAttack);

    const projectile = this.add.image(from.x, from.y, art.projectile).setRotation(angle + Math.PI / 2).setDepth(900);
    const duration = (Phaser.Math.Distance.Between(from.x, from.y, target.x, target.y) / PROJECTILE_SPEED) * 1000;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        const x = from.x + (target.x - from.x) * t;
        const y = from.y + (target.y - from.y) * t;
        projectile.setPosition(x, y).setRotation(Phaser.Math.Angle.Between(from.x, from.y, target.x, target.y) + Math.PI / 2);
      },
      onComplete: () => {
        projectile.destroy();
        const impact = this.add.sprite(target.x, target.y, art.impact).setDepth(901).play(art.impact);
        impact.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => impact.destroy());
        this.#land(shot, enemyView);
      },
    });
  }

  #land(shot: Shot, enemyView: EnemyView): void {
    // Bolts can land out of order; the bar never grows back.
    enemyView.shownHealth = Math.min(enemyView.shownHealth, shot.health);
    if (!shot.defeated) return;
    enemyView.health.destroy();
    const heading = (enemyView.sprite.getData('heading') as Heading | undefined) ?? 'side';
    enemyView.sprite.play(deathAnimation(shot.enemy.kind.id, heading));
    enemyView.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.tweens.add({ targets: enemyView.sprite, alpha: 0, duration: 400, onComplete: () => enemyView.sprite.destroy() });
    });
    this.#float(enemyView.sprite, `+${shot.enemy.kind.ink} Tinte`, '#2b3a6b');
  }

  /** Short text that rises and fades at `at`. */
  #float(at: Point | BuildSite, message: string, color: string): void {
    const text = this.add
      .text(at.x, at.y - 30, message, { fontFamily: 'sans-serif', fontSize: '18px', color, stroke: HUD_OUTLINE, strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(950);
    this.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 1200, onComplete: () => text.destroy() });
  }

  #showEnd(): void {
    const won = this.#battle.phase === 'won';
    const text = this.add
      .text(0, -30, [won ? 'Gewonnen!' : 'Verloren.', `Nochmal? Tippe »${this.#setup.floodWord}«.`], {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: HUD_TEXT,
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0.5);
    const panel = this.add
      .rectangle(0, 0, 460, 200, 0xfffaf2, 0.95)
      .setRounded(16)
      .setStrokeStyle(2, 0xd9c8b4);
    this.#endPanel = this.add.container(this.scale.width / 2, 260, [panel, text]).setDepth(1000);
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
}
