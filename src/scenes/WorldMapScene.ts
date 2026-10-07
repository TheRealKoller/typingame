import * as Phaser from 'phaser';
import type { Point } from '../battle/path';
import { pointState, REGIONS, WORLD_LINKS, WORLD_POINTS, worldPoint, type PointState, type WorldPoint } from '../content/journey';
import type { Progress } from '../progress/progress';
import { TypingEngine } from '../typing/engine';
import { WordLabel } from '../ui/WordLabel';
import type { BattleSceneData } from './BattleScene';
import {
  BOOKSHELF_BURNT,
  BRIDGE_FRAME,
  ASH_COLOR,
  BURNT_TINT,
  createBattleArt,
  tileNoise,
  FLAG_DAMAGED,
  FLAG_DAMAGED_WAVING,
  GRASS_FRAME,
  GRASS_TILESET,
  layPath,
  preloadBattleArt,
  ROCK_FRAMES,
  SAND_EDGE,
  SAND_FRAME,
  towerArt,
  TREE_FRAMES,
  WATER,
  WATER_FRAMES,
} from './battleArt';

const INK = '#2f2a24';
const OUTLINE = '#f6efe6';
const PAPER = 0xf4ead6;
const PAPER_EDGE = 0xcbb894;
/** The map is drawn at half the battle scale: 32 px per tile. */
const TILE_SCALE = 0.5;
const TILE = 64 * TILE_SCALE;
const ROAD_WIDTH = 28;
/** The ash fields: an ellipse of sooty tiles around the library ruin, frayed at the edge. */
const ASH = { x: 390, y: 430, rx: 350, ry: 270 };
/** A river runs from north to south; beyond it the Silence still hides the land. */
const RIVER = { x: 780, width: 64 };
/** The road leaves the ash fields eastwards over the bridge. */
const EXIT_Y = 430;
const FOG_COLOR = 0x1c1824;
const WARD_COLOR = 0x9fd4ff;
const WATER_FRAME_MS = 150;
/** The base of the crossbow tower marks a freed place. */
const FREED_TOWER = towerArt({ id: 'tower-01' })!.base;

/** Trees and rocks around the points, burnt inside the ash fields. */
const SCENERY: readonly { readonly kind: 'tree' | 'rock'; readonly x: number; readonly y: number; readonly variant: number }[] = [
  { kind: 'tree', x: 60, y: 90, variant: 0 },
  { kind: 'tree', x: 110, y: 130, variant: 1 },
  { kind: 'tree', x: 640, y: 80, variant: 0 },
  { kind: 'tree', x: 700, y: 120, variant: 1 },
  { kind: 'tree', x: 50, y: 680, variant: 1 },
  { kind: 'tree', x: 690, y: 690, variant: 0 },
  { kind: 'tree', x: 250, y: 380, variant: 2 },
  { kind: 'tree', x: 480, y: 380, variant: 3 },
  { kind: 'tree', x: 520, y: 520, variant: 2 },
  { kind: 'tree', x: 260, y: 600, variant: 3 },
  { kind: 'tree', x: 460, y: 230, variant: 2 },
  { kind: 'tree', x: 680, y: 520, variant: 3 },
  { kind: 'rock', x: 300, y: 260, variant: 0 },
  { kind: 'rock', x: 540, y: 330, variant: 1 },
  { kind: 'rock', x: 120, y: 560, variant: 0 },
  { kind: 'rock', x: 680, y: 360, variant: 1 },
  { kind: 'tree', x: 900, y: 330, variant: 0 },
  { kind: 'tree', x: 960, y: 360, variant: 1 },
  { kind: 'tree', x: 1200, y: 600, variant: 0 },
  { kind: 'rock', x: 1050, y: 250, variant: 1 },
];

export interface WorldMapSceneData {
  readonly progress: Progress;
}

/** The road between two points: along the first one's row, then up or down to the second. */
function road(a: Point, b: Point): Point[] {
  return [a, { x: b.x, y: a.y }, b];
}

/** Whether (x, y) lies in the ash fields, their ellipse scaled by `reach`. */
function inAsh(x: number, y: number, reach = 1): boolean {
  return ((x - ASH.x) / ASH.rx) ** 2 + ((y - ASH.y) / ASH.ry) ** 2 <= reach * reach;
}

/**
 * The journey's world map: places held by the Silence, linked by roads.
 * Typing a place's word selects it, Enter starts its battle. Like the name
 * prompt, choosing a place is no practice: the keystrokes are not counted.
 */
export class WorldMapScene extends Phaser.Scene {
  #progress!: Progress;
  #engine!: TypingEngine;
  #labels: WordLabel[] = [];
  #selected: WorldPoint | null = null;
  #ring!: Phaser.GameObjects.Ellipse;
  #hint!: Phaser.GameObjects.Text;

  preload(): void {
    preloadBattleArt(this);
  }

  create(data: WorldMapSceneData): void {
    createBattleArt(this);
    this.#progress = data.progress;
    this.#selected = null;
    this.cameras.main.fadeIn(500);
    const states = new Map(WORLD_POINTS.map((point) => [point.id, pointState(point.id, this.#progress.freed)]));

    this.#drawLand();
    this.#drawRoads();
    this.#drawScenery();
    this.#drawFog();

    this.#ring = this.add.ellipse(0, 0, 76, 30).setStrokeStyle(4, WARD_COLOR).setDepth(2).setVisible(false);
    this.tweens.add({ targets: this.#ring, scale: 1.15, duration: 600, yoyo: true, repeat: -1 });
    this.#labels = [];
    for (const point of WORLD_POINTS) this.#drawPoint(point, states.get(point.id)!);

    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height - 40, 760, 52, PAPER, 0.95).setStrokeStyle(2, PAPER_EDGE).setDepth(2000);
    this.#hint = this.add
      .text(width / 2, height - 40, '', { fontFamily: 'sans-serif', fontSize: '20px', color: INK })
      .setOrigin(0.5)
      .setDepth(2001);

    this.#engine = new TypingEngine(this.#labels.map((label) => label.word));
    this.#sync();
    window.addEventListener('keydown', this.#onKeyDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', this.#onKeyDown));
  }

  /** Grass, sooty tiles in the ash fields, the river with its sand banks. */
  #drawLand(): void {
    const { width, height } = this.scale;
    this.add.tileSprite(0, 0, width, height, GRASS_TILESET, GRASS_FRAME).setOrigin(0).setTileScale(TILE_SCALE);
    // Grey soot over the grass, tile by tile; the edge frays and some tiles are darker.
    const soot = this.add.graphics();
    for (let y = 0; y < height; y += TILE) {
      for (let x = 0; x < RIVER.x - RIVER.width; x += TILE) {
        const noise = tileNoise(x, y);
        if (!inAsh(x + TILE / 2, y + TILE / 2, 0.85 + 0.25 * noise)) continue;
        soot.fillStyle(ASH_COLOR, noise < 0.2 ? 0.88 : 0.75).fillRect(x, y, TILE, TILE);
      }
    }

    const left = RIVER.x - RIVER.width / 2;
    this.add.rectangle(left - 4, 0, RIVER.width + 8, height, SAND_EDGE).setOrigin(0);
    const river = this.add.tileSprite(left, 0, RIVER.width, height, WATER, WATER_FRAMES[0]).setOrigin(0).setTileScale(TILE_SCALE);
    let frame = 0;
    this.time.addEvent({
      delay: WATER_FRAME_MS,
      loop: true,
      callback: () => {
        frame = (frame + 1) % WATER_FRAMES.length;
        river.setFrame(WATER_FRAMES[frame]!);
      },
    });
  }

  /** Sand roads between linked points, and the road east over the bridge into the hidden land. */
  #drawRoads(): void {
    const style = { texture: GRASS_TILESET, frame: SAND_FRAME, edgeColor: SAND_EDGE, tileScale: TILE_SCALE, width: ROAD_WIDTH, depth: 1 };
    const last = WORLD_POINTS[WORLD_POINTS.length - 1]!;
    const exit = [{ x: last.x, y: EXIT_Y }, { x: this.scale.width + 20, y: EXIT_Y }];
    layPath(this, [...WORLD_LINKS.map(([a, b]) => road(worldPoint(a), worldPoint(b))), exit], style);
    this.add.image(RIVER.x, EXIT_Y, GRASS_TILESET, BRIDGE_FRAME).setScale(TILE_SCALE).setDepth(1);
  }

  #drawScenery(): void {
    for (const thing of SCENERY) {
      const frames = thing.kind === 'tree' ? TREE_FRAMES : ROCK_FRAMES;
      const image = this.add
        .image(thing.x, thing.y, GRASS_TILESET, frames[thing.variant % frames.length])
        .setOrigin(0.5, 1)
        .setScale(0.75)
        .setDepth(thing.y);
      if (thing.kind === 'tree' && inAsh(thing.x, thing.y)) image.setTint(BURNT_TINT);
    }
    // What is left of the library: burnt shelves beside its ruin.
    const ruin = worldPoint('ruin');
    for (const [dx, variant] of [[-46, 0], [42, 1]] as const) {
      this.add
        .image(ruin.x + dx, ruin.y + 4, BOOKSHELF_BURNT, variant)
        .setOrigin(0.5, 1)
        .setScale(0.5)
        .setDepth(ruin.y - 1);
    }
  }

  /** Beyond the river the Silence still hides the land; only the names of its regions show through. */
  #drawFog(): void {
    const { width, height } = this.scale;
    const fog = this.add.graphics().setDepth(1500);
    // The fog thickens over a few tiles beyond the river bank.
    const start = RIVER.x + RIVER.width / 2 + 20;
    const steps = 12;
    for (let i = 0; i < steps; i++) fog.fillStyle(FOG_COLOR, 0.06).fillRect(start + i * 12, 0, width, height);
    for (const region of REGIONS) {
      this.add
        .text(region.x, region.y, region.name, {
          fontFamily: 'serif',
          fontSize: region.open ? '36px' : '30px',
          fontStyle: 'italic',
          color: region.open ? INK : '#d8d0e0',
          stroke: region.open ? OUTLINE : '#1c1824',
          strokeThickness: 5,
        })
        .setOrigin(0.5)
        .setAlpha(region.open ? 0.9 : 0.6)
        .setDepth(1600);
    }
  }

  /**
   * The Silence's torn flag on each place it holds, grey while the place is
   * locked; a freed place has the apprentice's tower in a blue ward circle.
   */
  #drawPoint(point: WorldPoint, state: PointState): void {
    if (state === 'freed') {
      this.add.ellipse(point.x, point.y, 64, 24, WARD_COLOR, 0.45).setDepth(2);
      this.add.image(point.x, point.y + 6, FREED_TOWER, 0).setOrigin(0.5, 1).setScale(0.5).setDepth(point.y + 1);
    } else {
      const flag = this.add.sprite(point.x, point.y + 6, FLAG_DAMAGED).setOrigin(0.5, 1).setDepth(point.y + 1).play(FLAG_DAMAGED_WAVING);
      if (state === 'locked') flag.setTint(0x777777).setAlpha(0.7);
    }
    this.add
      .text(point.x, point.y + 12, point.name, {
        fontFamily: 'serif',
        fontSize: '19px',
        color: INK,
        stroke: OUTLINE,
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setAlpha(state === 'locked' ? 0.6 : 1)
      .setDepth(1000);
    if (state !== 'locked') this.#labels.push(new WordLabel(this, point.x, point.y - 76, point.word, 26).setDepth(1001));
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Tab' || event.key === ' ') event.preventDefault();
    if (event.key === 'Escape') {
      this.#engine.cancel();
      this.#selected = null;
      this.#sync();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!event.repeat && this.#selected) this.#start(this.#selected);
      return;
    }
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || [...event.key].length !== 1) return;
    const events = this.#engine.type(event.key);
    if (events[0]?.type === 'wrong') WordLabel.showError(this.#labels, this.#engine.typed, this.#engine.candidates);
    for (const typed of events) {
      if (typed.type !== 'complete') continue;
      this.#selected = WORLD_POINTS.find((point) => point.word === typed.word) ?? null;
    }
    this.#sync();
  };

  #start(point: WorldPoint): void {
    window.removeEventListener('keydown', this.#onKeyDown);
    this.cameras.main.fadeOut(400);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('BattleScene', { progress: this.#progress, point: point.id } satisfies BattleSceneData);
    });
  }

  #sync(): void {
    const { typed, candidates } = this.#engine;
    for (const label of this.#labels) label.setProgress(typed, candidates.includes(label.word));
    const selected = this.#selected;
    this.#ring.setVisible(selected !== null);
    if (selected) this.#ring.setPosition(selected.x, selected.y);
    this.#hint.setText(
      selected
        ? `${selected.name}${this.#progress.freed.has(selected.id) ? ' (befreit)' : ''} – Enter: kämpfen, Esc: anderer Ort`
        : 'Tippe das Wort über einem Ort, um ihn zu wählen.',
    );
  }
}
