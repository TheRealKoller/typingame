import * as Phaser from 'phaser';
import { Battle, type Enemy, type Shot, type Tower } from '../battle/battle';
import { Commands, type Command } from '../battle/commands';
import type { BuildSite } from '../battle/level';
import type { Point } from '../battle/path';
import { CROSSBOW, FLOOD_WORD, LEVEL_1 } from '../content/level1';
import { HOME_ROW_KEYS, HOME_ROW_WORDS } from '../content/words';
import { qwertzDe } from '../keyboard/qwertz-de';
import type { Progress } from '../progress/progress';
import { errorRate } from '../progress/stats';
import { TypingEngine } from '../typing/engine';
import { KeyboardView } from '../ui/KeyboardView';
import { StatsView } from '../ui/StatsView';
import { WordLabel } from '../ui/WordLabel';
import {
  CONSTRUCTION,
  CONSTRUCTION_REVEAL,
  ENEMY_SHEETS,
  GRASS_FRAME,
  ROCK_FRAMES,
  SAND_FRAME,
  TILESET,
  TOWER_ART,
  TREE_FRAMES,
  createBattleArt,
  deathAnimation,
  preloadBattleArt,
  walkAnimation,
  type Heading,
} from './battleArt';

const PATH_WIDTH = 64;
const PATH_EDGE = 0xbd6a62;
const PAD_COLOR = 0xe8c9a0;
const PAD_EDGE = 0x8a6a4a;
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
/** Typed after the level has ended to play it again. */
const AGAIN_WORD = FLOOD_WORD;

/** Trees and rocks on the grass, clear of the path and the build sites. */
const DECORATION: readonly { frame: string; x: number; y: number }[] = [
  { frame: TREE_FRAMES[0], x: 70, y: 300 },
  { frame: TREE_FRAMES[1], x: 120, y: 380 },
  { frame: TREE_FRAMES[2], x: 520, y: 170 },
  { frame: TREE_FRAMES[0], x: 590, y: 140 },
  { frame: TREE_FRAMES[3], x: 1210, y: 300 },
  { frame: TREE_FRAMES[1], x: 1180, y: 400 },
  { frame: TREE_FRAMES[2], x: 960, y: 40 },
  { frame: ROCK_FRAMES[0], x: 430, y: 40 },
  { frame: ROCK_FRAMES[1], x: 880, y: 420 },
  { frame: ROCK_FRAMES[0], x: 660, y: 425 },
];

export interface BattleSceneData {
  readonly progress: Progress;
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

  preload(): void {
    preloadBattleArt(this);
  }

  create(data: BattleSceneData): void {
    createBattleArt(this);
    this.#progress = data.progress;
    this.#battle = new Battle(LEVEL_1);
    this.#commands = new Commands(this.#battle, [CROSSBOW], FLOOD_WORD, HOME_ROW_WORDS, { keys: this.#progress.keys });
    this.#labels = [];
    this.#labelKey = '';
    this.#enemies = new Map();
    this.#towers = new Map();
    this.#endPanel = null;

    this.#drawMap();
    this.#drawDesk();
    this.#drawHud();
    this.#keyboard = new KeyboardView(this, this.scale.width / 2, 540, qwertzDe).setScale(0.5).setUnlocked(HOME_ROW_KEYS);
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
  }

  override update(_time: number, delta: number): void {
    const step = this.#battle.update(Math.min(delta, MAX_STEP_MS));
    // Shots and arrivals first: they take their enemies out of the walking ones.
    for (const shot of step.shots) this.#showShot(shot);
    for (const enemy of step.arrived) this.#showArrival(enemy);
    this.#drawEnemies();
    this.#sync();
  }

  /** Words that can be typed now: the commands while the level runs, then the word to play again. */
  #words(): readonly string[] {
    return this.#ended() ? [AGAIN_WORD] : this.#commands.words;
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

    const events = this.#engine.type(event.key);
    this.#progress.session.record(events, event.timeStamp);
    this.#statsView.update(this.#progress);
    this.#keyboard.press(event.code, events[0]?.type === 'correct');
    for (const typingEvent of events) {
      if (typingEvent.type !== 'complete') continue;
      void this.#progress.save();
      if (this.#ended()) {
        this.scene.restart({ progress: this.#progress } satisfies BattleSceneData);
        return;
      }
      this.#apply(this.#commands.complete(typingEvent.word));
    }
    this.#sync();
  };

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
    if (this.#ended()) return [{ word: AGAIN_WORD, x: this.scale.width / 2, y: 290 }];
    const selected = this.#commands.selected;
    if (selected) {
      return this.#commands.words.map((word) => ({ word, x: selected.x, y: selected.y - LABEL_OFFSET }));
    }
    const placed: Placed[] = [];
    for (const site of this.#battle.level.sites) {
      const word = this.#commands.siteWord(site);
      if (word !== null) placed.push({ word, x: site.x, y: site.y - LABEL_OFFSET });
    }
    if (this.#battle.phase === 'flood') placed.push({ word: FLOOD_WORD, x: this.scale.width / 2, y: 46 });
    return placed;
  }

  #drawMap(): void {
    this.add.tileSprite(0, 0, this.scale.width, this.scale.height, TILESET, GRASS_FRAME).setOrigin(0);

    const path = this.#battle.level.path;
    const edges = this.add.graphics().lineStyle(4, PATH_EDGE, 1);
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1]!;
      const to = path[i]!;
      const x = Math.min(from.x, to.x) - PATH_WIDTH / 2;
      const y = Math.min(from.y, to.y) - PATH_WIDTH / 2;
      const width = Math.abs(to.x - from.x) + PATH_WIDTH;
      const height = Math.abs(to.y - from.y) + PATH_WIDTH;
      this.add.tileSprite(x, y, width, height, TILESET, SAND_FRAME).setOrigin(0);
      edges.strokeRect(x, y, width, height);
    }
    // Fill the sand again over the inner edges, so only the outline of the whole path remains.
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1]!;
      const to = path[i]!;
      const x = Math.min(from.x, to.x) - PATH_WIDTH / 2 + 2;
      const y = Math.min(from.y, to.y) - PATH_WIDTH / 2 + 2;
      this.add
        .tileSprite(x, y, Math.abs(to.x - from.x) + PATH_WIDTH - 4, Math.abs(to.y - from.y) + PATH_WIDTH - 4, TILESET, SAND_FRAME)
        .setOrigin(0);
    }

    for (const { frame, x, y } of DECORATION) this.add.image(x, y, TILESET, frame).setDepth(y);

    for (const site of this.#battle.level.sites) {
      this.add
        .rectangle(site.x, site.y, 56, 56, PAD_COLOR)
        .setStrokeStyle(3, PAD_EDGE)
        .setDepth(1);
    }

    const end = path.at(-1)!;
    this.#ward = this.add.graphics({ x: end.x, y: end.y }).setDepth(2);
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
      flood: `Flut – baue Türme. Tippe »${FLOOD_WORD}«, wenn Welle ${battle.wave + 1} von ${waves} kommen soll.`,
      ebb: `Ebbe – Welle ${battle.wave + 1} von ${waves} rückt vor.`,
      won: 'Gewonnen! Das Verstummen ist zurückgedrängt.',
      lost: 'Der Bannkreis ist gebrochen.',
    }[battle.phase];
    const selected = this.#commands.selected
      ? `Bauplatz gewählt – »${CROSSBOW.keyword}« baut einen Armbrustturm (${CROSSBOW.cost} Tinte), Esc geht zurück.`
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

    if (this.#ended() && !this.#endPanel) this.#showEnd();
  }

  #drawEnemies(): void {
    for (const enemy of this.#battle.enemies) {
      const at = this.#battle.positionOf(enemy);
      let view = this.#enemies.get(enemy.id);
      if (!view) {
        view = {
          sprite: this.add.sprite(at.x, at.y, enemy.kind.id),
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

  /** An enemy reached the ward circle: it fades into the circle, and the circle shudders. */
  #showArrival(enemy: Enemy): void {
    const view = this.#enemies.get(enemy.id);
    if (view) {
      this.#enemies.delete(enemy.id);
      view.health.destroy();
      this.tweens.add({ targets: view.sprite, alpha: 0, scale: 0.4, duration: 300, onComplete: () => view.sprite.destroy() });
    }
    this.tweens.add({ targets: this.#ward, scale: { from: 1.25, to: 1 }, duration: 350, ease: 'Back.easeOut' });
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
      .text(0, -30, [won ? 'Gewonnen!' : 'Verloren.', `Nochmal? Tippe »${AGAIN_WORD}«.`], {
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
