import * as Phaser from 'phaser';
import { Battle, type Enemy, type Hit, type Shot, type Tower } from '../battle/battle';
import { Commands, type Command } from '../battle/commands';
import type { BuildSite, Spell, TowerKind } from '../battle/level';
import type { Point } from '../battle/path';
import { MASTER_NAME, MASTER_VERDICTS, pageText } from '../content/cutscenes';
import { JOURNEY_VERDICTS, journeyBattle, rewardText, worldPoint, type Reward, type WorldPoint } from '../content/journey';
import { practiceLevel, practiceMap, READING_ROOM, type BattleMap, type Prop } from '../content/library';
import { RAID_LEVEL } from '../content/raid';
import { JOURNEY, RAID, allKeysSetup, STAGES, stageIndex, stageSetup, type StageSetup } from '../content/tutorial';
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
  GRASS_FRAME,
  GRASS_TILESET,
  ROCK_FRAMES,
  SAND_FRAME,
  TREE_FRAMES,
  LECTERN,
  LIBRARY_SCALE,
  READING_DESK,
  SCROLL,
  TORCH,
  TORCH_FLAME,
  towerArt,
  WALL_EDGE_FRAME,
  ASH_COLOR,
  BURNT_TINT,
  createBattleArt,
  tileNoise,
  layPath,
  SAND_EDGE,
  deathAnimation,
  preloadBattleArt,
  walkAnimation,
  type Heading,
} from './battleArt';

const PATH_WIDTH = 64;
/** Soot of the ash fields is laid in patches of this size. */
const SOOT_TILE = 32;
/** Blackened stone where the library burnt. */
const CHARRED = 0x1a1412;
const CARPET_EDGE = 0x5a1414;
const PAD_COLOR = 0xd9cdb8;
const PAD_EDGE = 0x6e6252;
/** The back wall of the reading room, with shelves standing against it. */
const WALL_HEIGHT = 96;
/** Word labels sit this far above the centre of their build site. */
const LABEL_OFFSET = 52;
/** Over a built tower the word sits higher, clear of the weapon, but stays on screen. */
const TOWER_LABEL_OFFSET = 112;
const TOWER_LABEL_OFFSET_MIN = 20;
/** Ready spells stand this far above the ward circle. */
const SPELL_LABEL_OFFSET = 70;
const WORD_SIZE = 30;
/** Distance between the tower keywords shown side by side at a selected site. */
const KEYWORD_SPACING = 130;
/** Tint of an enemy slowed by frost. */
const FROST_TINT = 0x9fd4ff;
/** Spells and rewards are written in ink blue. */
const SPELL_TEXT = '#2b3a6b';
/** Longest step fed to the battle, so a hidden window does not make enemies jump. */
const MAX_STEP_MS = 100;
const PROJECTILE_SPEED = 900;
const WARD_RADIUS = 46;
const WARD_COLOR = 0x9fd4ff;
/** The ring of segments around the ward circle: one segment per point of strength. */
const WARD_RING_RADIUS = WARD_RADIUS + 7;
const WARD_RING_WIDTH = 7;
const WARD_RING_COLOR = 0x3d8bff;
const WARD_LOST_COLOR = 0x2f2a24;
/** At or below this share of its strength the ward turns red and pulses. */
const WARD_LOW = 0.3;
const WARD_LOW_COLOR = 0xe53935;
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

/** Floor tiles that are worn on indoor maps, as column/row of 64 px cells. */
const WORN_TILES: readonly [number, number][] = [
  [2, 3], [5, 5], [9, 2], [13, 4], [16, 6], [7, 6], [11, 5], [18, 3],
];

export interface BattleSceneData {
  readonly progress: Progress;
  /** Set when the stage has just begun: a hint names its new keys. */
  readonly announce?: boolean;
  /** How many practice battles came before this one in a row; picks the map. */
  readonly round?: number;
  /** On the journey: id of the world map point fought for. */
  readonly point?: string;
}

interface EnemyView {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly health: Phaser.GameObjects.Graphics;
  /** Light under a glowing enemy that carries a word; null for the others. */
  readonly glow: Phaser.GameObjects.Ellipse | null;
  /** Health as far as the hits have landed on screen; a bolt in flight has not hit yet. */
  shownHealth: number;
  last: Point;
}

interface TowerView {
  readonly base: Phaser.GameObjects.Sprite;
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
  /** Labels of the glowing enemies' words, by enemy id. */
  #enemyLabels = new Map<number, WordLabel>();
  #labelKey = '';
  #enemies = new Map<number, EnemyView>();
  #towers = new Map<string, TowerView>();
  #ward!: Phaser.GameObjects.Graphics;
  /** »Enter« in the middle of the ward circle during a flood: Enter calls the next wave. */
  #wavePrompt!: Phaser.GameObjects.Text;
  /** Segments around the ward circle showing its strength; they pulse red when it runs low. */
  #wardRing!: Phaser.GameObjects.Graphics;
  #wardPulse: Phaser.Tweens.Tween | null = null;
  /** Strength of the ward as a number in the circle while no »Enter« stands there. */
  #wardCount!: Phaser.GameObjects.Text;
  #phaseText!: Phaser.GameObjects.Text;
  #inkText!: Phaser.GameObjects.Text;
  #wardText!: Phaser.GameObjects.Text;
  #endPanel: Phaser.GameObjects.Container | null = null;
  /** Position in `STAGES` and what it unlocks. */
  #stage = 0;
  #setup!: StageSetup;
  /** Spells from the scrolls found so far; only on the journey. */
  #spells: readonly Spell[] = [];
  #spellText!: Phaser.GameObjects.Text;
  /** Null in the raid and on the journey: there is nothing left to unlock. */
  #unlock: UnlockTracker | null = null;
  #unlockReached = false;
  /** The raid on the library instead of a practice battle. */
  #raid = false;
  /** The world map point fought for on the journey; null in the library. */
  #point: WorldPoint | null = null;
  /** Shelves that can still catch fire in the raid, in the order they burn. */
  #shelves: Phaser.GameObjects.Image[] = [];
  #darkness: Phaser.GameObjects.Rectangle | null = null;
  /** Practice battles played in a row so far; picks the next map. */
  #round = 0;
  #map!: BattleMap;

  preload(): void {
    preloadBattleArt(this);
  }

  create(data: BattleSceneData): void {
    createBattleArt(this);
    this.#progress = data.progress;
    this.#raid = this.#progress.stage === RAID;
    this.#point = this.#progress.stage === JOURNEY && data.point ? worldPoint(data.point) : null;
    const tutorial = !this.#raid && !this.#point;
    // The raid and the journey are fought with every key of the tutorial; a place of the journey brings its own map and towers.
    const journey = this.#point ? journeyBattle(this.#point, Math.random, this.#progress.freed) : null;
    this.#spells = journey?.spells ?? [];
    this.#stage = tutorial ? stageIndex(this.#progress.stage) : STAGES.length - 1;
    const setup = tutorial ? stageSetup(this.#stage) : allKeysSetup();
    this.#setup = journey ? { ...setup, towers: journey.towers } : setup;
    this.#unlock = tutorial ? new UnlockTracker() : null;
    this.#unlockReached = false;
    this.#round = data.round ?? 0;
    // The raid always strikes the reading room.
    this.#map = journey?.map ?? (this.#raid ? READING_ROOM : practiceMap(this.#round));
    this.#battle = new Battle(journey?.level ?? (this.#raid ? RAID_LEVEL : practiceLevel(STAGES[this.#stage]!.section, this.#map)));
    this.#shelves = [];
    this.#darkness = null;
    this.#commands = this.#newCommands();
    this.#labels = [];
    this.#enemyLabels = new Map();
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
    if (data.announce && tutorial) this.#showNewKeys(STAGES[this.#stage]!.newKeys);
  }

  override update(_time: number, delta: number): void {
    const step = this.#battle.update(Math.min(delta, MAX_STEP_MS));
    // Shots and arrivals first: they take their enemies out of the walking ones.
    for (const shot of step.shots) this.#showShot(shot);
    for (const enemy of step.arrived) this.#showArrival(enemy);
    this.#commands.refresh();
    this.#drawEnemies();
    // A started word or a selected build site is finished first, so the new keys never cut them off.
    if (this.#unlockReached && this.#engine.typed === '' && !this.#commands.selected) this.#advance();
    this.#sync();
  }

  /** Words that can be typed now: the commands while the level runs, none once it has ended. */
  #words(): readonly string[] {
    return this.#ended() ? [] : this.#commands.words;
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
    if (event.key === 'Enter') {
      // Enter calls the next wave during a flood; once a battle has ended it starts the next practice battle or returns to the world map.
      event.preventDefault();
      if (event.repeat) return;
      if (this.#ended()) {
        if (this.#point) this.scene.start('WorldMapScene', { progress: this.#progress });
        else if (!this.#raid) this.scene.restart({ progress: this.#progress, round: this.#round + 1 } satisfies BattleSceneData);
        return;
      }
      this.#battle.endFlood();
      this.#sync();
      return;
    }
    // Only printable single characters count as typing; shortcuts and named keys are ignored.
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;
    // Once the level has ended nothing is left to type; keystrokes would only count as mistakes.
    if (this.#ended()) return;

    const events = this.#engine.type(event.key);
    const correct = events[0]?.type === 'correct';
    this.#progress.session.record(events, event.timeStamp);
    this.#statsView.update(this.#progress);
    this.#keyboard.press(event.code, correct);
    if (events[0]?.type === 'wrong') {
      WordLabel.showError([...this.#labels, ...this.#enemyLabels.values()], this.#engine.typed, this.#engine.candidates);
    }
    for (const typingEvent of events) {
      if (typingEvent.type !== 'complete') continue;
      void this.#progress.save();
      this.#apply(this.#commands.complete(typingEvent.word));
    }
    if (this.#unlock?.record(correct)) this.#unlockReached = true;
    this.#sync();
  };

  #newCommands(): Commands {
    const { towers, words } = this.#setup;
    return new Commands(this.#battle, towers, words, { keys: this.#progress.keys }, this.#spells);
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
    if (command?.type === 'build' || command?.type === 'upgrade') this.#showTower(this.#battle.towerAt(command.site));
    if (command?.type === 'tooExpensive') this.#float(command.site, 'Zu wenig Tinte', '#8a2f2f');
    if (command?.type === 'strike') this.#showStrike(command.enemy, command.defeated);
    if (command?.type === 'cast') this.#showCast(command.hits);
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
    this.#syncEnemyLabels();
    const { typed, candidates } = this.#engine;
    for (const label of [...this.#labels, ...this.#enemyLabels.values()]) label.setProgress(typed, candidates.includes(label.word));
    this.#keyboard.setNext(this.#engine.expectedChars);
    this.#updateHud();
  }

  /** Words standing on the map: site words or the choices at a selected site, and ready spells. Enemy words follow their enemies (`#syncEnemyLabels`). */
  #placedWords(): Placed[] {
    if (this.#ended()) return [];
    return [...this.#siteAndKeywords(), ...this.#spellWords()];
  }

  /** Ready spells stand over the ward circle, one above the other. */
  #spellWords(): Placed[] {
    const end = this.#battle.level.path[this.#battle.level.path.length - 1]!;
    const x = Math.min(end.x, this.scale.width - KEYWORD_SPACING / 2 - 20);
    return this.#commands.readySpells.map((spell, i) => ({ word: spell.word, x, y: Math.max(TOWER_LABEL_OFFSET_MIN, end.y - SPELL_LABEL_OFFSET - i * 36) }));
  }

  #siteAndKeywords(): Placed[] {
    const selected = this.#commands.selected;
    if (selected) {
      // The keywords, or the upgrade word of a tower, stand side by side above the site, kept on screen.
      const choices = this.#choices(selected);
      const y = this.#labelY(selected);
      const left = Math.min(Math.max(selected.x - ((choices.length - 1) * KEYWORD_SPACING) / 2, KEYWORD_SPACING / 2), this.scale.width - KEYWORD_SPACING / 2 - (choices.length - 1) * KEYWORD_SPACING);
      return choices.map((tower, i) => ({ word: tower.keyword, x: left + i * KEYWORD_SPACING, y }));
    }
    const placed: Placed[] = [];
    for (const site of this.#battle.level.sites) {
      const word = this.#commands.siteWord(site);
      if (word !== null) placed.push({ word, x: site.x, y: this.#labelY(site) });
    }
    return placed;
  }

  /** What can be built on `site`, or what its tower can become. */
  #choices(site: BuildSite): readonly TowerKind[] {
    const tower = this.#battle.towerAt(site);
    if (!tower) return this.#setup.towers;
    return tower.kind.upgrade ? [tower.kind.upgrade] : [];
  }

  /** Words above a free site sit just over its pad; over a tower they clear its top. */
  #labelY(site: BuildSite): number {
    return this.#battle.towerAt(site) ? Math.max(TOWER_LABEL_OFFSET_MIN, site.y - TOWER_LABEL_OFFSET) : site.y - LABEL_OFFSET;
  }

  /** The map of this battle: floor, walls or grass, the path, its props, the build sites and the ward circle. */
  #drawMap(): void {
    if (this.#map.indoor) this.#drawRoom();
    else this.#drawCourtyard();
    if (this.#map.ash) this.#drawSoot();

    for (const prop of this.#map.props) {
      const image = this.#propImage(prop);
      // Props stand on their lower edge, so they sort with towers and golems by that line.
      image.setOrigin(0.5, 1);
      image.setY(prop.y + image.displayHeight / 2).setDepth(prop.y + image.displayHeight / 2);
      if (prop.kind === 'bookshelf') this.#shelves.push(image);
    }
    // In the raid the fire spreads from the ward circle towards the door.
    this.#shelves.sort((a, b) => b.x - a.x);
    if (this.#raid) {
      this.#darkness = this.add.rectangle(0, 0, this.scale.width, DESK_TOP, 0x120808, 0).setOrigin(0).setDepth(990);
    }

    this.#drawSitesAndWard();
  }

  /** Build sites, the ward circle at the end of the path and the Enter prompt in it. */
  #drawSitesAndWard(): void {
    const path = this.#battle.level.path;
    for (const site of this.#battle.level.sites) {
      this.add
        .rectangle(site.x, site.y, 56, 56, PAD_COLOR)
        .setStrokeStyle(3, PAD_EDGE)
        .setDepth(2);
    }

    const end = path.at(-1)!;
    this.#ward = this.add.graphics({ x: end.x, y: end.y }).setDepth(3);
    this.tweens.add({ targets: this.#ward, alpha: { from: 1, to: 0.6 }, duration: 1200, yoyo: true, repeat: -1 });

    this.#wavePrompt = this.add
      .text(end.x, end.y, 'Enter', { fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setShadow(0, 0, '#5ab4ff', 10, true, true)
      .setDepth(1002);
    // The blue glow breathes, so the prompt is noticed without shouting.
    this.tweens.add({ targets: this.#wavePrompt, alpha: { from: 1, to: 0.65 }, duration: 900, yoyo: true, repeat: -1 });

    this.#wardRing = this.add.graphics({ x: end.x, y: end.y }).setDepth(4);
    this.#wardCount = this.add
      .text(end.x, end.y, '', { fontFamily: 'sans-serif', fontSize: '30px', color: '#ffffff', fontStyle: 'bold', stroke: '#1d3f7a', strokeThickness: 5 })
      .setOrigin(0.5)
      .setDepth(1002);
  }

  #propImage(prop: Prop): Phaser.GameObjects.Image {
    const { x, y, variant = 0 } = prop;
    switch (prop.kind) {
      case 'bookshelf':
        return this.add.image(x, y, BOOKSHELF, variant % 3);
      case 'burnt-bookshelf':
        return this.add.image(x, y, BOOKSHELF_BURNT, variant % 3);
      case 'book-pile':
        return this.add.image(x, y, BOOK_PILE, variant % 2);
      case 'lectern':
        return this.add.image(x, y, LECTERN);
      case 'reading-desk':
        return this.add.image(x, y, READING_DESK);
      case 'scroll':
        return this.add.image(x, y, SCROLL);
      case 'tree': {
        // Burnt trees are the autumn ones darkened: green ones would stay green under the tint.
        const frame = this.#map.ash ? TREE_FRAMES[2 + (variant % 2)] : TREE_FRAMES[variant % TREE_FRAMES.length];
        const tree = this.add.image(x, y, GRASS_TILESET, frame);
        return this.#map.ash ? tree.setTint(BURNT_TINT) : tree;
      }
      case 'rock':
        return this.add.image(x, y, GRASS_TILESET, ROCK_FRAMES[variant % ROCK_FRAMES.length]);
    }
  }

  /** A room of the library: stone floor, back wall with banners and torches, a carpet as the path. */
  #drawRoom(): void {
    const { width } = this.scale;
    const tile = 32 * LIBRARY_SCALE;
    const floor = this.#map.floor === 'slab' ? FLOOR_FRAMES[1] : FLOOR_FRAMES[0];
    this.add.tileSprite(0, 0, width, DESK_TOP, DUNGEON, floor).setOrigin(0).setTileScale(LIBRARY_SCALE);
    if (this.#map.floor !== 'slab') {
      for (const [column, row] of WORN_TILES) {
        this.add.image(column * tile, row * tile, DUNGEON, FLOOR_FRAMES[2]).setOrigin(0).setScale(LIBRARY_SCALE);
      }
    }

    this.add.tileSprite(0, 0, width, WALL_HEIGHT, DUNGEON, BRICK_FRAME).setOrigin(0).setTileScale(LIBRARY_SCALE);
    this.add
      .tileSprite(0, WALL_HEIGHT - 8 * LIBRARY_SCALE, width, 8 * LIBRARY_SCALE, DUNGEON, WALL_EDGE_FRAME)
      .setOrigin(0)
      .setTileScale(LIBRARY_SCALE);
    for (const x of this.#map.banners ?? []) this.add.image(x, 8, DUNGEON, BANNER_FRAME).setOrigin(0.5, 0).setScale(LIBRARY_SCALE);
    for (const x of this.#map.torches ?? []) this.add.sprite(x, 44, TORCH).setScale(LIBRARY_SCALE).play(TORCH_FLAME);

    layPath(this, this.#battle.level.path, {
      texture: DUNGEON,
      frame: CARPET_FRAME,
      edgeColor: CARPET_EDGE,
      tileScale: LIBRARY_SCALE,
      width: PATH_WIDTH,
      depth: 1,
    });
  }

  /** The courtyard: grass and a sand path. */
  #drawCourtyard(): void {
    this.add.tileSprite(0, 0, this.scale.width, DESK_TOP, GRASS_TILESET, GRASS_FRAME).setOrigin(0);
    layPath(this, this.#battle.level.path, {
      texture: GRASS_TILESET,
      frame: SAND_FRAME,
      edgeColor: SAND_EDGE,
      tileScale: 1,
      width: PATH_WIDTH,
      depth: 1,
    });
  }

  /**
   * Soot over the ground of the ash fields, patchy from tile to tile; the path
   * lies on top. Grey ash covers grass; a stone floor is blackened instead.
   */
  #drawSoot(): void {
    const soot = this.add.graphics().setDepth(0.5);
    const { indoor } = this.#map;
    const top = indoor ? WALL_HEIGHT : 0;
    const [color, alphas] = indoor ? [CHARRED, [0.55, 0.4, 0.25]] : [ASH_COLOR, [0.9, 0.82, 0.74]];
    for (let y = top; y < DESK_TOP; y += SOOT_TILE) {
      for (let x = 0; x < this.scale.width; x += SOOT_TILE) {
        const noise = tileNoise(x, y);
        soot.fillStyle(color, alphas[noise < 0.25 ? 0 : noise < 0.7 ? 1 : 2]!).fillRect(x, y, SOOT_TILE, SOOT_TILE);
      }
    }
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
    this.#spellText = this.add.text(28, 604, '', { ...style, color: SPELL_TEXT }).setDepth(ON_DESK_DEPTH);
  }

  #updateHud(): void {
    const battle = this.#battle;
    const waves = battle.level.waves.length;
    const phase = {
      flood: `Flut – baue Türme. Drücke Enter, wenn Welle ${battle.wave + 1} von ${waves} kommen soll.`,
      ebb: `Ebbe – Welle ${battle.wave + 1} von ${waves} rückt vor.`,
      won: this.#point ? 'Das Verstummen weicht zurück.' : 'Alle Golems besiegt.',
      lost: 'Der Bannkreis ist gebrochen.',
    }[battle.phase];
    const site = this.#commands.selected;
    const choices = site ? this.#choices(site).map((tower) => `»${tower.keyword}« ${tower.name} (${tower.cost} Tinte)`) : [];
    const selected = site
      ? this.#battle.towerAt(site)
        ? `Turm gewählt – ${choices.join(', ')} rüstet auf. Esc geht zurück.`
        : `Bauplatz gewählt – ${choices.join(', ')}. Esc geht zurück.`
      : null;
    this.#phaseText.setText(selected ?? phase);
    this.#wavePrompt.setVisible(battle.phase === 'flood');
    this.#inkText.setText(`Tinte: ${battle.ink}`);
    this.#wardText.setText(`Bannkreis: ${battle.ward} / ${battle.level.ward}`);
    this.#spellText.setText(
      this.#spells
        .map((spell) => {
          const left = battle.spellReadyIn(spell);
          if (left > 0) return `${spell.name}: wieder in ${Math.ceil(left / 1000)} s`;
          return battle.phase === 'ebb' ? `${spell.name}: bereit – »${spell.word}«` : `${spell.name}: bei Ebbe bereit`;
        })
        .join('\n'),
    );

    const strength = battle.ward / battle.level.ward;
    this.#ward
      .clear()
      .fillStyle(WARD_COLOR, 0.15 + 0.25 * strength)
      .fillCircle(0, 0, WARD_RADIUS)
      .lineStyle(4, WARD_COLOR, 0.3 + 0.7 * strength)
      .strokeCircle(0, 0, WARD_RADIUS)
      .lineStyle(2, 0xffffff, 0.6 * strength)
      .strokeCircle(0, 0, WARD_RADIUS - 10);
    this.#drawWardRing(battle.ward, battle.level.ward);
    this.#wardCount.setText(String(battle.ward)).setVisible(battle.phase !== 'flood');

    if (this.#ended() && !this.#endPanel) {
      // A place freed for the first time hands over its reward.
      const point = battle.phase === 'won' ? this.#point : null;
      const reward = point && !this.#progress.freed.has(point.id) ? (point.reward ?? null) : null;
      if (this.#raid) this.#endRaid();
      else this.#showEnd(reward);
      if (point) {
        this.#progress.free(point.id);
        void this.#progress.save();
      }
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
          glow: enemy.marked ? this.#glow() : null,
          shownHealth: enemy.kind.health,
          last: at,
        };
        this.#enemies.set(enemy.id, view);
      }
      const heading = this.#heading(view, enemy, at);
      view.sprite.setPosition(at.x, at.y).setDepth(at.y + 100);
      view.sprite.play(walkAnimation(enemy.kind.id, heading), true);
      // A slowed enemy is frosted over; otherwise it keeps the tint of its sheet.
      const sheetTint = ENEMY_SHEETS[enemy.kind.id]?.tint;
      if (enemy.slowMs > 0) view.sprite.setTint(FROST_TINT);
      else if (sheetTint !== undefined) view.sprite.setTint(sheetTint);
      else view.sprite.clearTint();
      view.glow?.setPosition(at.x, at.y + 14).setDepth(at.y + 99);
      view.last = at;
      this.#drawHealth(view, enemy, at);
    }
  }

  /** Warm light under a glowing enemy, breathing so it catches the eye. */
  #glow(): Phaser.GameObjects.Ellipse {
    const glow = this.add.ellipse(0, 0, 76, 38, 0xffd23a, 0.85).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: { from: 0.85, to: 0.35 }, scale: { from: 1, to: 1.2 }, duration: 600, yoyo: true, repeat: -1 });
    return glow;
  }

  /** Word labels above the glowing enemies, following them along the path. */
  #syncEnemyLabels(): void {
    const shown = new Set<number>();
    for (const enemy of this.#ended() ? [] : this.#battle.enemies) {
      const word = this.#commands.enemyWord(enemy);
      if (word === null) continue;
      shown.add(enemy.id);
      const at = this.#battle.positionOf(enemy);
      let label = this.#enemyLabels.get(enemy.id);
      if (!label) {
        label = new WordLabel(this, at.x, at.y, word, WORD_SIZE).setDepth(1001);
        this.#enemyLabels.set(enemy.id, label);
      }
      label.setPosition(at.x, at.y - 58);
    }
    for (const [id, label] of this.#enemyLabels) {
      if (shown.has(id)) continue;
      label.destroy();
      this.#enemyLabels.delete(id);
    }
  }

  /** The word of a glowing enemy was typed: a flash of light, and it falls, or a tough one is wounded. */
  #showStrike(enemy: Enemy, defeated: boolean): void {
    const view = this.#enemies.get(enemy.id);
    if (!view) return;
    const flash = this.add.circle(view.sprite.x, view.sprite.y, 20, 0xfff2b0, 0.9).setDepth(902);
    this.tweens.add({ targets: flash, scale: 3, alpha: 0, duration: 350, onComplete: () => flash.destroy() });
    if (!defeated) {
      // A tough enemy only takes the word's damage and walks on with a new word.
      view.shownHealth = Math.min(view.shownHealth, enemy.health);
      return;
    }
    this.#enemies.delete(enemy.id);
    view.health.destroy();
    view.glow?.destroy();
    const heading = (view.sprite.getData('heading') as Heading | undefined) ?? 'side';
    view.sprite.play(deathAnimation(enemy.kind.id, heading));
    view.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.tweens.add({ targets: view.sprite, alpha: 0, duration: 400, onComplete: () => view.sprite.destroy() });
    });
    this.#float(view.sprite, `+${enemy.kind.ink} Tinte`, '#2b3a6b');
  }

  /** A spell was cast: ink rains on every enemy hit, and the hits land at once. */
  #showCast(hits: readonly Hit[]): void {
    this.cameras.main.flash(250, 43, 58, 107);
    for (const hit of hits) {
      const view = this.#enemies.get(hit.enemy.id);
      if (!view) continue;
      if (hit.defeated) this.#enemies.delete(hit.enemy.id);
      const drop = this.add.circle(view.sprite.x, view.sprite.y - 60, 10, 0x2b3a6b, 0.9).setDepth(902);
      this.tweens.add({
        targets: drop,
        y: view.sprite.y,
        duration: 220,
        onComplete: () => {
          drop.destroy();
          this.#land(hit, view);
        },
      });
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

  /**
   * An enemy reached the ward circle: it fades into the circle, the circle flashes
   * red and shudders, the screen shakes and the lost strength rises from it.
   * In the raid, a shelf catches fire.
   */
  #showArrival(enemy: Enemy): void {
    const view = this.#enemies.get(enemy.id);
    if (view) {
      this.#enemies.delete(enemy.id);
      view.health.destroy();
      view.glow?.destroy();
      this.tweens.add({ targets: view.sprite, alpha: 0, scale: 0.4, duration: 300, onComplete: () => view.sprite.destroy() });
    }
    this.tweens.add({ targets: [this.#ward, this.#wardRing], scale: { from: 1.25, to: 1 }, duration: 350, ease: 'Back.easeOut' });
    const end = this.#battle.level.path.at(-1)!;
    const flash = this.add.circle(end.x, end.y, WARD_RING_RADIUS, WARD_LOW_COLOR, 0.6).setDepth(5);
    this.tweens.add({ targets: flash, scale: 1.6, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
    this.cameras.main.shake(180, 0.004);
    this.#float({ x: end.x, y: end.y - WARD_RING_RADIUS + 20 }, `−${enemy.kind.wardDamage}`, '#c62828', 26);
    if (this.#raid) this.#ignite(enemy.kind.wardDamage);
  }

  /** One segment per point of strength, lost ones dark; blue while strong, a red pulse when low. */
  #drawWardRing(ward: number, full: number): void {
    const low = ward > 0 && ward / full <= WARD_LOW;
    const color = low ? WARD_LOW_COLOR : WARD_RING_COLOR;
    const step = (2 * Math.PI) / full;
    const gap = 0.08;
    this.#wardRing.clear();
    for (let i = 0; i < full; i++) {
      // Segments run clockwise from the top; the last ones go out first.
      const start = -Math.PI / 2 + i * step + gap / 2;
      const lit = i < ward;
      this.#wardRing
        .lineStyle(WARD_RING_WIDTH + 4, 0xf6efe6, lit ? 0.9 : 0.5)
        .beginPath()
        .arc(0, 0, WARD_RING_RADIUS, start - 0.02, start + step - gap + 0.02)
        .strokePath()
        .lineStyle(WARD_RING_WIDTH, lit ? color : WARD_LOST_COLOR, lit ? 1 : 0.5)
        .beginPath()
        .arc(0, 0, WARD_RING_RADIUS, start, start + step - gap)
        .strokePath();
    }
    if (low && !this.#wardPulse) {
      this.#wardPulse = this.tweens.add({ targets: this.#wardRing, alpha: { from: 1, to: 0.35 }, duration: 350, yoyo: true, repeat: -1 });
      this.#wardCount.setStroke('#7a1d1d', 5);
    } else if (!low && this.#wardPulse) {
      this.#wardPulse.remove();
      this.#wardPulse = null;
      this.#wardRing.setAlpha(1);
      this.#wardCount.setStroke('#1d3f7a', 5);
    }
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

  /** A new tower, or one at its next stage, appears in a cloud of dust; an older stage vanishes behind it. */
  #showTower(tower: Tower | undefined): void {
    if (!tower) return;
    const art = towerArt(tower.kind);
    if (!art) return;
    const { x, y } = tower.site;
    // The base stands on the pad; its top square carries the weapon.
    const base = this.add.sprite(x, y + 32, art.base, art.baseFrame).setOrigin(0.5, 1).setDepth(y + 50);
    const weapon = this.add.sprite(x, y - 51, art.weapon, 0).setDepth(y + 51);
    for (const part of [base, weapon]) part.setAlpha(0);
    const cloud = this.add.sprite(x, y - 32, CONSTRUCTION, 6).setDepth(y + 52);
    cloud.play(CONSTRUCTION_REVEAL);
    const before = this.#towers.get(tower.site.id);
    this.time.delayedCall(150, () => {
      for (const part of [base, weapon]) part.setAlpha(1);
      before?.base.destroy();
      before?.weapon.destroy();
    });
    cloud.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => cloud.destroy());
    this.#towers.set(tower.site.id, { base, weapon });
  }

  /**
   * The tower turns and shoots; the bolt follows its target. The hit counts on
   * screen only when the bolt lands: then the health bar drops or the enemy dies.
   */
  #showShot(shot: Shot): void {
    const art = towerArt(shot.tower.kind);
    const view = this.#towers.get(shot.tower.site.id);
    // Defeated enemies leave the battle now; they stay on screen until the shot arrives.
    const hits = [shot, ...shot.splash].flatMap((hit) => {
      const enemyView = this.#enemies.get(hit.enemy.id);
      if (!enemyView) return [];
      if (hit.defeated) this.#enemies.delete(hit.enemy.id);
      return [{ hit, enemyView }];
    });
    const enemyView = hits[0]?.hit === shot ? hits[0].enemyView : undefined;
    if (!art || !view || !enemyView) {
      for (const { hit, enemyView: other } of hits) this.#land(hit, other);
      return;
    }
    const from = { x: view.weapon.x, y: view.weapon.y };
    const target = enemyView.sprite;
    const angle = Phaser.Math.Angle.Between(from.x, from.y, target.x, target.y);
    // The Spire weapons and projectiles point up.
    view.weapon.setRotation(angle + Math.PI / 2).play(art.weaponAttack);

    const projectile = this.add.image(from.x, from.y, art.projectile).setRotation(angle + Math.PI / 2).setScale(art.shotScale).setDepth(900);
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
        const impact = this.add.sprite(target.x, target.y, art.impact).setScale(art.shotScale).setDepth(901).play(art.impact);
        impact.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => impact.destroy());
        for (const { hit, enemyView: other } of hits) this.#land(hit, other);
      },
    });
  }

  #land(hit: Hit, enemyView: EnemyView): void {
    // Shots can land out of order; the bar never grows back.
    enemyView.shownHealth = Math.min(enemyView.shownHealth, hit.health);
    if (!hit.defeated) return;
    enemyView.health.destroy();
    enemyView.glow?.destroy();
    const heading = (enemyView.sprite.getData('heading') as Heading | undefined) ?? 'side';
    enemyView.sprite.play(deathAnimation(hit.enemy.kind.id, heading));
    enemyView.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.tweens.add({ targets: enemyView.sprite, alpha: 0, duration: 400, onComplete: () => enemyView.sprite.destroy() });
    });
    this.#float(enemyView.sprite, `+${hit.enemy.kind.ink} Tinte`, '#2b3a6b');
  }

  /** Short text that rises and fades at `at`. */
  #float(at: Point | BuildSite, message: string, color: string, fontSize = 18): void {
    const text = this.add
      .text(at.x, at.y - 30, message, { fontFamily: 'sans-serif', fontSize: `${fontSize}px`, color, stroke: HUD_OUTLINE, strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(950);
    this.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 1200, onComplete: () => text.destroy() });
  }

  /**
   * After a practice battle the master has a word for it, on the journey the
   * apprentice, together with a reward found; Enter starts the next practice
   * battle or returns to the map.
   */
  #showEnd(reward: Reward | null): void {
    const outcome = this.#battle.phase === 'won' ? 'won' : 'lost';
    const lines = this.#point ? JOURNEY_VERDICTS[outcome] : MASTER_VERDICTS[outcome];
    const line = lines[Math.floor(Math.random() * lines.length)] ?? '';
    const name = this.#point ? this.#progress.name : MASTER_NAME;
    const speaker = this.add
      .text(-250, -70, name, { fontFamily: 'serif', fontSize: '24px', color: '#7a3a1e' })
      .setOrigin(0, 0);
    const text = this.add
      .text(-250, -34, pageText({ speaker: this.#point ? 'apprentice' : 'master', text: line }, this.#progress.name), {
        fontFamily: 'serif',
        fontSize: '26px',
        color: HUD_TEXT,
        lineSpacing: 8,
        wordWrap: { width: 500 },
      })
      .setOrigin(0, 0);
    const hint = this.add
      .text(250, 70, this.#point ? 'Enter: zur Karte' : 'Enter: weiter', { fontFamily: 'sans-serif', fontSize: '18px', color: '#7a6a5a' })
      .setOrigin(1, 1);
    const found = reward
      ? this.add
          .text(-250, text.y + text.height + 12, rewardText(reward), { fontFamily: 'serif', fontSize: '22px', color: SPELL_TEXT, wordWrap: { width: 500 } })
          .setOrigin(0, 0)
      : null;
    // A reward makes the panel taller; the hint stays at its bottom edge.
    const extra = found ? Math.max(0, found.y + found.height + 20 - 40) : 0;
    hint.setY(70 + extra);
    const panel = this.add.rectangle(0, extra / 2, 560, 180 + extra, PAPER, 0.97).setStrokeStyle(3, PAPER_EDGE);
    const parts = found ? [panel, speaker, text, found, hint] : [panel, speaker, text, hint];
    this.#endPanel = this.add.container(this.scale.width / 2, 230 - extra / 2, parts).setDepth(1000);
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
