import * as Phaser from 'phaser';
import type { Point } from '../battle/path';
import bookPileImage from '../assets/library/book-pile.png';
import bookshelfBurntImage from '../assets/library/bookshelf-burnt.png';
import bookshelfImage from '../assets/library/bookshelf.png';
import lecternImage from '../assets/library/lectern.png';
import largePaperGolemImage from '../assets/library/paper-golem-large.png';
import paperGolemImage from '../assets/library/paper-golem.png';
import readingDeskImage from '../assets/library/reading-desk.png';
import scrollImage from '../assets/library/scroll.png';
import dungeonImage from '../assets/lucifer/dungeon/dungeon-tileset.png';
import torchImage from '../assets/lucifer/lava/torch.png';
import standingFlagDamagedImage from '../assets/lucifer/lava/standing-flag-damaged.png';
import waterImage from '../assets/spire/tileset/animated-water-tiles.png';
import grassTilesetImage from '../assets/spire/tileset/grass-tileset.png';
import constructionImage from '../assets/spire/builder/tower-construction.png';
import firebugImage from '../assets/spire/enemies/firebug.png';
import scorpionImage from '../assets/spire/enemies/scorpion.png';
import fireImage from '../assets/traps/fire-trap-level-1.png';

/** Frames per second of every Spire animation (100 ms per frame in the sources). */
const FRAME_RATE = 10;

/**
 * Layout of a Spire enemy sheet: one row per animation and direction (idle,
 * walk, death × down, up, side), frames left-aligned, `columns` wide.
 */
interface EnemySheet {
  readonly url: string;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly columns: number;
  readonly walkFrames: number;
  readonly deathFrames: number;
  /** Direction the side rows face; the sprite is flipped for the other one. */
  readonly sideFaces: 'left' | 'right';
  /** Drawing scale on screen; the paper golems are drawn small within their frames. */
  readonly scale: number;
  /** Colour multiplied into the sprite, e.g. to darken the creatures of the Silence. */
  readonly tint?: number;
}

/** Sprite sheets by enemy kind id (see `src/content/library.ts` and `src/content/raid.ts`). */
export const ENEMY_SHEETS: Readonly<Record<string, EnemySheet>> = {
  'paper-golem': {
    url: paperGolemImage,
    frameWidth: 64,
    frameHeight: 64,
    columns: 8,
    walkFrames: 8,
    deathFrames: 8,
    sideFaces: 'right',
    scale: 1.5,
  },
  'paper-golem-large': {
    url: largePaperGolemImage,
    frameWidth: 64,
    frameHeight: 64,
    columns: 8,
    walkFrames: 8,
    deathFrames: 8,
    sideFaces: 'right',
    scale: 1.5,
  },
  // Spire creatures, darkened: the Silence has taken them.
  scorpion: { url: scorpionImage, frameWidth: 64, frameHeight: 64, columns: 8, walkFrames: 8, deathFrames: 8, sideFaces: 'left', scale: 1, tint: 0x8a80b0 },
  firebug: { url: firebugImage, frameWidth: 128, frameHeight: 64, columns: 11, walkFrames: 8, deathFrames: 11, sideFaces: 'right', scale: 1, tint: 0x8a80b0 },
  shadow: { url: firebugImage, frameWidth: 128, frameHeight: 64, columns: 11, walkFrames: 8, deathFrames: 11, sideFaces: 'right', scale: 1.4, tint: 0x2a2038 },
};

export type Heading = 'down' | 'up' | 'side';
const HEADINGS: readonly Heading[] = ['down', 'up', 'side'];
const WALK_ROW = 3;
const DEATH_ROW = 6;

/**
 * Frames cut from the Lucifer dungeon tileset (32 × 32 px source tiles, shown
 * twice as large like the rest of the art).
 */
export const DUNGEON = 'dungeon';
export const FLOOR_FRAMES = ['floor', 'floor-slab', 'floor-worn'] as const;
export const BRICK_FRAME = 'brick';
export const WALL_EDGE_FRAME = 'wall-edge';
export const CARPET_FRAME = 'carpet';
export const BANNER_FRAME = 'banner';
/** Scale of the Lucifer tiles and the library props, which are drawn at half the Spire density. */
export const LIBRARY_SCALE = 2;

export const TORCH = 'torch';
export const TORCH_FLAME = 'torch-flame';
export const BOOKSHELF = 'bookshelf';
export const BOOKSHELF_BURNT = 'bookshelf-burnt';
/** Flames rising from the floor (Fire Trap of the Pixel Trap Pack, frames 32 × 64). */
export const FIRE = 'fire';
export const FIRE_BURNING = 'fire-burning';
export const LECTERN = 'lectern';
export const READING_DESK = 'reading-desk';
export const BOOK_PILE = 'book-pile';
export const SCROLL = 'scroll';

/** Frames cut from the Spire grass tileset (64 × 64 px) for the courtyard. */
export const GRASS_TILESET = 'grass-tileset';
export const GRASS_FRAME = 'grass';
export const SAND_FRAME = 'sand';
/** Outline of the sand paths. */
export const SAND_EDGE = 0xbd6a62;
export const TREE_FRAMES = ['tree-green', 'tree-green-2', 'tree-autumn', 'tree-autumn-2'] as const;
export const ROCK_FRAMES = ['rock', 'rock-2'] as const;
/** A wooden bridge across water running from top to bottom. */
export const BRIDGE_FRAME = 'bridge';
/** Open water, one frame per step of the Spire water animation (64 × 64 px from the middle of each 448 px frame). */
export const WATER = 'water';
export const WATER_FRAMES = Array.from({ length: 10 }, (_, i) => `water-${i}`);
/** Torn standing flag (Lucifer lava pack, 32 × 64 frames): the Silence holds a place on the world map. */
export const FLAG_DAMAGED = 'standing-flag-damaged';
export const FLAG_DAMAGED_WAVING = 'standing-flag-damaged-waving';
export const CONSTRUCTION = 'construction';
/** Frames of the cloud that reveals a finished tower (second row of the construction sheet). */
export const CONSTRUCTION_REVEAL = 'construction-reveal';

/** Texture and animation keys of one stage of a tower kind. */
export interface TowerArt {
  readonly base: string;
  /** The base sheet shows one stage per frame (I, II, III). */
  readonly baseFrame: number;
  readonly weapon: string;
  readonly weaponAttack: string;
  readonly projectile: string;
  readonly impact: string;
  readonly shotScale: number;
}

/** Every PNG of the Spire tower packs, by path. */
const TOWER_FILES = import.meta.glob<string>('../assets/spire/towers/*.png', { eager: true, import: 'default' });

function towerFile(name: string): string {
  const url = TOWER_FILES[`../assets/spire/towers/${name}.png`];
  if (!url) throw new Error(`no tower art ${name}`);
  return url;
}

interface Size {
  readonly width: number;
  readonly height: number;
}

/** One stage of a Spire tower: square weapon frames, projectile frames, 64 × 64 impact frames. */
interface StageSource {
  readonly weaponSize: number;
  readonly projectileSize: Size;
  /** File of the impact sheet; the crossbow shares one for all stages. */
  readonly impact: string;
}

/** A Spire tower: its base sheet (64 px wide frames) and its three stages. */
interface TowerSource {
  readonly baseHeight: number;
  readonly stages: readonly StageSource[];
  /** Drawing scale of projectile and impact; the slinger's blot is drawn larger than its sheet. */
  readonly shotScale?: number;
}

const TOWER_SOURCES: Readonly<Record<string, TowerSource>> = {
  // Crossbow: one, two, then three bolts at once
  'tower-01': {
    baseHeight: 128,
    stages: [24, 45, 66].map((width) => ({ weaponSize: 96, projectileSize: { width, height: 40 }, impact: 'tower-01-weapon-impact' })),
  },
  // Frost crystal: ice shards around a crystal pedestal
  'tower-02': {
    baseHeight: 192,
    stages: [96, 128, 128].map((weaponSize, i) => ({
      weaponSize,
      projectileSize: { width: 32, height: 32 },
      impact: `tower-02-level-0${i + 1}-projectile-impact`,
    })),
  },
  // Ink slinger: a sling that hurls a purple blot
  'tower-03': {
    baseHeight: 128,
    stages: [1, 2, 3].map((level) => ({
      weaponSize: 96,
      projectileSize: { width: 10, height: 10 },
      impact: `tower-03-level-0${level}-projectile-impact`,
    })),
    // The blot splashes 70 to 90 px around its target; drawn this large, the impact shows about that much.
    shotScale: 2.2,
  },
};

function stageKey(id: string, level: number): string {
  return `${id}-level-${level}`;
}

const TOWER_ART: ReadonlyMap<string, TowerArt> = new Map(
  Object.entries(TOWER_SOURCES).flatMap(([id, source]) =>
    source.stages.map((_, i) => {
      const key = stageKey(id, i + 1);
      const art: TowerArt = {
        base: `${id}-base`,
        baseFrame: i,
        weapon: `${key}-weapon`,
        weaponAttack: `${key}-weapon-attack`,
        projectile: `${key}-projectile`,
        impact: `${key}-impact`,
        shotScale: source.shotScale ?? 1,
      };
      return [key, art] as const;
    }),
  ),
);

/** The art of a tower at its stage, or undefined for a kind without art (as in tests). */
export function towerArt(kind: { readonly id: string; readonly level?: number }): TowerArt | undefined {
  return TOWER_ART.get(stageKey(kind.id, kind.level ?? 1));
}

export function walkAnimation(kind: string, heading: Heading): string {
  return `${kind}-walk-${heading}`;
}

export function deathAnimation(kind: string, heading: Heading): string {
  return `${kind}-death-${heading}`;
}

export function preloadBattleArt(scene: Phaser.Scene): void {
  scene.load.image(DUNGEON, dungeonImage);
  scene.load.spritesheet(TORCH, torchImage, { frameWidth: 32, frameHeight: 32 });
  scene.load.spritesheet(BOOKSHELF, bookshelfImage, { frameWidth: 64, frameHeight: 128 });
  scene.load.spritesheet(BOOKSHELF_BURNT, bookshelfBurntImage, { frameWidth: 64, frameHeight: 128 });
  scene.load.spritesheet(FIRE, fireImage, { frameWidth: 32, frameHeight: 64 });
  scene.load.image(LECTERN, lecternImage);
  scene.load.image(READING_DESK, readingDeskImage);
  scene.load.spritesheet(BOOK_PILE, bookPileImage, { frameWidth: 64, frameHeight: 64 });
  scene.load.image(SCROLL, scrollImage);
  scene.load.image(GRASS_TILESET, grassTilesetImage);
  scene.load.image(WATER, waterImage);
  scene.load.spritesheet(FLAG_DAMAGED, standingFlagDamagedImage, { frameWidth: 32, frameHeight: 64 });
  scene.load.spritesheet(CONSTRUCTION, constructionImage, { frameWidth: 192, frameHeight: 256 });
  for (const [kind, sheet] of Object.entries(ENEMY_SHEETS)) {
    scene.load.spritesheet(kind, sheet.url, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
  }
  for (const [id, source] of Object.entries(TOWER_SOURCES)) {
    scene.load.spritesheet(`${id}-base`, towerFile(`base-${id}`), { frameWidth: 64, frameHeight: source.baseHeight });
    source.stages.forEach((stage, i) => {
      const art = towerArt({ id, level: i + 1 })!;
      const file = `${id}-level-0${i + 1}`;
      scene.load.spritesheet(art.weapon, towerFile(`${file}-weapon`), { frameWidth: stage.weaponSize, frameHeight: stage.weaponSize });
      const { width, height } = stage.projectileSize;
      scene.load.spritesheet(art.projectile, towerFile(`${file}-projectile`), { frameWidth: width, frameHeight: height });
      scene.load.spritesheet(art.impact, towerFile(stage.impact), { frameWidth: 64, frameHeight: 64 });
    });
  }
}

/** Cuts the tile frames and registers the animations; safe to call again after a restart. */
export function createBattleArt(scene: Phaser.Scene): void {
  const dungeon = scene.textures.get(DUNGEON);
  if (!dungeon.has(CARPET_FRAME)) {
    // Positions in the Lucifer dungeon tileset.
    dungeon.add(FLOOR_FRAMES[0], 0, 0, 160, 32, 32);
    dungeon.add(FLOOR_FRAMES[1], 0, 0, 192, 32, 32);
    dungeon.add(FLOOR_FRAMES[2], 0, 32, 160, 32, 32);
    dungeon.add(BRICK_FRAME, 0, 32, 32, 32, 32);
    dungeon.add(WALL_EDGE_FRAME, 0, 136, 56, 32, 8);
    dungeon.add(CARPET_FRAME, 0, 320, 192, 16, 16);
    dungeon.add(BANNER_FRAME, 0, 480, 70, 32, 54);
  }
  const grass = scene.textures.get(GRASS_TILESET);
  if (!grass.has(GRASS_FRAME)) {
    // Positions in the Spire grass tileset: a grass arm and the sand centre of the crosses, trees and rocks on the right.
    grass.add(GRASS_FRAME, 0, 128, 64, 64, 64);
    grass.add(SAND_FRAME, 0, 128, 448, 64, 64);
    grass.add(TREE_FRAMES[0], 0, 832, 384, 64, 64);
    grass.add(TREE_FRAMES[1], 0, 896, 384, 64, 64);
    grass.add(TREE_FRAMES[2], 0, 832, 576, 64, 64);
    grass.add(TREE_FRAMES[3], 0, 896, 576, 64, 64);
    grass.add(ROCK_FRAMES[0], 0, 832, 768, 64, 64);
    grass.add(ROCK_FRAMES[1], 0, 896, 768, 64, 64);
    grass.add(BRIDGE_FRAME, 0, 448, 861, 192, 99);
  }
  const water = scene.textures.get(WATER);
  if (!water.has(WATER_FRAMES[0]!)) {
    WATER_FRAMES.forEach((frame, i) => water.add(frame, 0, i * 448 + 192, 192, 64, 64));
  }

  const anims = scene.anims;
  for (const [kind, sheet] of Object.entries(ENEMY_SHEETS)) {
    HEADINGS.forEach((heading, i) => {
      const walk = (WALK_ROW + i) * sheet.columns;
      const death = (DEATH_ROW + i) * sheet.columns;
      if (!anims.exists(walkAnimation(kind, heading))) {
        anims.create({
          key: walkAnimation(kind, heading),
          frames: anims.generateFrameNumbers(kind, { start: walk, end: walk + sheet.walkFrames - 1 }),
          frameRate: FRAME_RATE,
          repeat: -1,
        });
      }
      if (!anims.exists(deathAnimation(kind, heading))) {
        anims.create({
          key: deathAnimation(kind, heading),
          frames: anims.generateFrameNumbers(kind, { start: death, end: death + sheet.deathFrames - 1 }),
          frameRate: FRAME_RATE,
        });
      }
    });
  }

  if (!anims.exists(TORCH_FLAME)) {
    anims.create({ key: TORCH_FLAME, frames: anims.generateFrameNumbers(TORCH, {}), frameRate: FRAME_RATE, repeat: -1 });
  }
  if (!anims.exists(FLAG_DAMAGED_WAVING)) {
    anims.create({ key: FLAG_DAMAGED_WAVING, frames: anims.generateFrameNumbers(FLAG_DAMAGED, {}), frameRate: FRAME_RATE, repeat: -1 });
  }
  if (!anims.exists(FIRE_BURNING)) {
    // Frames 4 and 5 are the flames; the others are the idle trap and its smoke.
    anims.create({ key: FIRE_BURNING, frames: anims.generateFrameNumbers(FIRE, { start: 4, end: 5 }), frameRate: 6, repeat: -1 });
  }
  if (!anims.exists(CONSTRUCTION_REVEAL)) {
    anims.create({
      key: CONSTRUCTION_REVEAL,
      frames: anims.generateFrameNumbers(CONSTRUCTION, { start: 6, end: 10 }),
      frameRate: FRAME_RATE,
    });
  }
  for (const art of TOWER_ART.values()) {
    if (!anims.exists(art.weaponAttack)) {
      anims.create({ key: art.weaponAttack, frames: anims.generateFrameNumbers(art.weapon, {}), frameRate: 2 * FRAME_RATE });
    }
    if (!anims.exists(art.impact)) {
      anims.create({ key: art.impact, frames: anims.generateFrameNumbers(art.impact, {}), frameRate: 2 * FRAME_RATE });
    }
  }
}

/** How a path is laid: tiles of `frame` in `texture`, `width` px wide, with a 3 px outline of `edgeColor`. */
export interface PathStyle {
  readonly texture: string;
  readonly frame: string;
  readonly edgeColor: number;
  readonly tileScale: number;
  readonly width: number;
  readonly depth: number;
}

/** Lays a path along `points`: outline every segment, then the path again over the inner edges so only the outline of the whole remains. */
export function layPath(scene: Phaser.Scene, points: readonly Point[], style: PathStyle): void {
  const half = style.width / 2;
  const segments = points.slice(1).map((to, i) => {
    const from = points[i]!;
    return {
      x: Math.min(from.x, to.x) - half,
      y: Math.min(from.y, to.y) - half,
      width: Math.abs(to.x - from.x) + style.width,
      height: Math.abs(to.y - from.y) + style.width,
    };
  });
  const edges = scene.add.graphics().setDepth(style.depth).fillStyle(style.edgeColor, 1);
  for (const s of segments) edges.fillRect(s.x - 3, s.y - 3, s.width + 6, s.height + 6);
  for (const s of segments) {
    scene.add.tileSprite(s.x, s.y, s.width, s.height, style.texture, style.frame).setOrigin(0).setTileScale(style.tileScale).setDepth(style.depth);
  }
}

/** Soot over the ground of the ash fields (world map and battles there). */
export const ASH_COLOR = 0x6e6966;
/** Trees burnt in the ash fields. */
export const BURNT_TINT = 0x4a4240;

/** A fixed pseudo-random number in [0, 1) per tile, so patchy ground looks the same every time. */
export function tileNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}
