import * as Phaser from 'phaser';
import constructionImage from '../assets/spire/builder/tower-construction.png';
import firebugImage from '../assets/spire/enemies/firebug.png';
import leafbugImage from '../assets/spire/enemies/leafbug.png';
import scorpionImage from '../assets/spire/enemies/scorpion.png';
import tilesetImage from '../assets/spire/tileset/grass-tileset.png';
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
}

/** Sprite sheets by enemy kind id (see `src/content/level1.ts`). */
export const ENEMY_SHEETS: Readonly<Record<string, EnemySheet>> = {
  leafbug: { url: leafbugImage, frameWidth: 64, frameHeight: 64, columns: 8, walkFrames: 8, deathFrames: 7, sideFaces: 'right' },
  scorpion: { url: scorpionImage, frameWidth: 64, frameHeight: 64, columns: 8, walkFrames: 8, deathFrames: 8, sideFaces: 'left' },
  firebug: { url: firebugImage, frameWidth: 128, frameHeight: 64, columns: 11, walkFrames: 8, deathFrames: 11, sideFaces: 'right' },
};

export type Heading = 'down' | 'up' | 'side';
const HEADINGS: readonly Heading[] = ['down', 'up', 'side'];
const WALK_ROW = 3;
const DEATH_ROW = 6;

/** Ground tile frames cut from the grass tileset (64 × 64 px each). */
export const GRASS_FRAME = 'grass';
export const SAND_FRAME = 'sand';
export const TREE_FRAMES = ['tree-green', 'tree-green-2', 'tree-autumn', 'tree-autumn-2'] as const;
export const ROCK_FRAMES = ['rock', 'rock-2'] as const;

export const TILESET = 'tileset';
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
  scene.load.image(TILESET, tilesetImage);
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
  const tiles = scene.textures.get(TILESET);
  if (!tiles.has(GRASS_FRAME)) {
    // Positions in the Spire grass tileset: a grass arm and the sand centre of the crosses, trees and rocks on the right.
    tiles.add(GRASS_FRAME, 0, 128, 64, 64, 64);
    tiles.add(SAND_FRAME, 0, 128, 448, 64, 64);
    tiles.add('tree-green', 0, 832, 384, 64, 64);
    tiles.add('tree-green-2', 0, 896, 384, 64, 64);
    tiles.add('tree-autumn', 0, 832, 576, 64, 64);
    tiles.add('tree-autumn-2', 0, 896, 576, 64, 64);
    tiles.add('rock', 0, 832, 768, 64, 64);
    tiles.add('rock-2', 0, 896, 768, 64, 64);
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
