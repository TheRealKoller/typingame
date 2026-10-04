import * as Phaser from 'phaser';
import bookPileImage from '../assets/library/book-pile.png';
import bookshelfImage from '../assets/library/bookshelf.png';
import lecternImage from '../assets/library/lectern.png';
import largePaperGolemImage from '../assets/library/paper-golem-large.png';
import paperGolemImage from '../assets/library/paper-golem.png';
import readingDeskImage from '../assets/library/reading-desk.png';
import scrollImage from '../assets/library/scroll.png';
import dungeonImage from '../assets/lucifer/dungeon/dungeon-tileset.png';
import torchImage from '../assets/lucifer/lava/torch.png';
import constructionImage from '../assets/spire/builder/tower-construction.png';
import baseTower01Image from '../assets/spire/towers/base-tower-01.png';
import tower01ImpactImage from '../assets/spire/towers/tower-01-weapon-impact.png';
import tower01ProjectileImage from '../assets/spire/towers/tower-01-level-01-projectile.png';
import tower01WeaponImage from '../assets/spire/towers/tower-01-level-01-weapon.png';

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
}

/** Sprite sheets by enemy kind id (see `src/content/library.ts`). */
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
export const LECTERN = 'lectern';
export const READING_DESK = 'reading-desk';
export const BOOK_PILE = 'book-pile';
export const SCROLL = 'scroll';
export const CONSTRUCTION = 'construction';
/** Frames of the cloud that reveals a finished tower (second row of the construction sheet). */
export const CONSTRUCTION_REVEAL = 'construction-reveal';

/** Art of one tower kind by its id. */
export interface TowerArt {
  readonly base: string;
  readonly weapon: string;
  readonly weaponAttack: string;
  readonly projectile: string;
  readonly impact: string;
}

export const TOWER_ART: Readonly<Record<string, TowerArt>> = {
  'tower-01': {
    base: 'tower-01-base',
    weapon: 'tower-01-weapon',
    weaponAttack: 'tower-01-weapon-attack',
    projectile: 'tower-01-projectile',
    impact: 'tower-01-impact',
  },
};

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
  scene.load.image(LECTERN, lecternImage);
  scene.load.image(READING_DESK, readingDeskImage);
  scene.load.spritesheet(BOOK_PILE, bookPileImage, { frameWidth: 64, frameHeight: 64 });
  scene.load.image(SCROLL, scrollImage);
  scene.load.spritesheet(CONSTRUCTION, constructionImage, { frameWidth: 192, frameHeight: 256 });
  for (const [kind, sheet] of Object.entries(ENEMY_SHEETS)) {
    scene.load.spritesheet(kind, sheet.url, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
  }
  const tower01 = TOWER_ART['tower-01']!;
  scene.load.spritesheet(tower01.base, baseTower01Image, { frameWidth: 64, frameHeight: 128 });
  scene.load.spritesheet(tower01.weapon, tower01WeaponImage, { frameWidth: 96, frameHeight: 96 });
  scene.load.image(tower01.projectile, tower01ProjectileImage);
  scene.load.spritesheet(tower01.impact, tower01ImpactImage, { frameWidth: 64, frameHeight: 64 });
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
  if (!anims.exists(CONSTRUCTION_REVEAL)) {
    anims.create({
      key: CONSTRUCTION_REVEAL,
      frames: anims.generateFrameNumbers(CONSTRUCTION, { start: 6, end: 10 }),
      frameRate: FRAME_RATE,
    });
  }
  for (const art of Object.values(TOWER_ART)) {
    if (!anims.exists(art.weaponAttack)) {
      anims.create({ key: art.weaponAttack, frames: anims.generateFrameNumbers(art.weapon, {}), frameRate: 2 * FRAME_RATE });
    }
    if (!anims.exists(art.impact)) {
      anims.create({ key: art.impact, frames: anims.generateFrameNumbers(art.impact, {}), frameRate: 2 * FRAME_RATE });
    }
  }
}
