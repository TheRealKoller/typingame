import dogImage from '../assets/world/dog.png';
import mouseImage from '../assets/world/mouse.png';
import cherryImage from '../assets/world/cherry.png';
import childImage from '../assets/world/child.png';
import foxImage from '../assets/world/fox.png';
import milkCanImage from '../assets/world/milk_can.png';
import ponyImage from '../assets/world/pony.png';
import snailImage from '../assets/world/snail.png';
import { floatText, rock, scatterTiles, standingPicture, type Room, type ThingFactory } from './thing';
import { DECOR_KEYS, GARDEN_TILES, GRASS_KEYS, WORLD_ZOOM } from './gardenTiles';

/** Scenery of the yard, in tile coordinates. */
const SCENERY: readonly (readonly [number, number, string])[] = [
  [1, 2, 'fir'],
  [6, 1, 'tree'],
  [15, 1, 'fir'],
  [19, 3, 'fir'],
  [3, 5, 'mushroom'],
];

const axe: ThingFactory = (scene) => {
  const x = 150;
  const y = 260;
  const view = standingPicture(scene, 'axe', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 36 },
    react: () => {
      rock(scene, view, 6, 3);
      floatText(scene, x + 50, y - 90, 'hack!');
    },
  };
};

const pony: ThingFactory = (scene) => {
  const x = 390;
  const y = 270;
  const view = standingPicture(scene, 'pony', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      rock(scene, view, 3, 3);
      floatText(scene, x, y - 130, 'wieher!');
    },
  };
};

const fox: ThingFactory = (scene) => {
  const x = 640;
  const y = 260;
  const view = standingPicture(scene, 'fox', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      rock(scene, view, 7, 3);
      floatText(scene, x + 50, y - 80, 'wuff');
    },
  };
};

const milkCan: ThingFactory = (scene) => {
  const x = 880;
  const y = 255;
  const view = standingPicture(scene, 'milkCan', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 44 },
    react: () => {
      rock(scene, view, 4, 3);
      floatText(scene, x, y - 120, 'klirr');
    },
  };
};

const cherry: ThingFactory = (scene) => {
  const x = 1050;
  const y = 265;
  const view = standingPicture(scene, 'cherry', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 44 },
    react: () => {
      rock(scene, view, 6, 3);
      floatText(scene, x, y - 110, 'yum');
    },
  };
};

const snail: ThingFactory = (scene) => {
  const x = 1190;
  const y = 300;
  const view = standingPicture(scene, 'snail', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      // The snail crawls a little and stops again.
      scene.tweens.killTweensOf(view);
      view.setPosition(x, y);
      scene.tweens.add({ targets: view, x: x - 60, duration: 900, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

/** The pair things of section 3d: they name the animals that wander into the yard. */
const awayDog: ThingFactory = (scene) => {
  const x = 320;
  const y = 380;
  const view = standingPicture(scene, 'dog', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 38 },
    react: () => {
      // Off to the right and back in from the left, so the pair works more than once.
      scene.tweens.killTweensOf(view);
      view.setPosition(x, y).setAlpha(1);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 150, duration: 650, ease: 'Quad.easeIn' },
          { alpha: 0, duration: 250, ease: 'Quad.easeIn' },
        ],
        onComplete: () => {
          view.setPosition(x - 110, y).setAlpha(0);
          scene.tweens.add({ targets: view, x, alpha: 1, duration: 750, ease: 'Quad.easeOut' });
        },
      });
    },
  };
};

const awayMouse: ThingFactory = (scene) => {
  const x = 900;
  const y = 385;
  const view = standingPicture(scene, 'mouse', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 38 },
    react: () => {
      // A quick dash to the right and back.
      scene.tweens.killTweensOf(view);
      view.setPosition(x, y);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 90, duration: 240, ease: 'Quad.easeOut' },
          { x, duration: 320, ease: 'Quad.easeIn' },
        ],
      });
    },
  };
};

/** Chapter 3: the farmyard, where the bottom row ends and the first word pairs are typed. */
export const yard: Room = {
  assets: [
    ...GARDEN_TILES,
    { key: 'child', url: childImage },
    { key: 'dog', url: dogImage },
    { key: 'mouse', url: mouseImage },
    { key: 'pony', url: ponyImage },
    { key: 'fox', url: foxImage },
    { key: 'milkCan', url: milkCanImage },
    { key: 'cherry', url: cherryImage },
    { key: 'snail', url: snailImage },
  ],
  backdrop: (scene) => {
    const { width, height } = scene.scale;
    scatterTiles(scene, GRASS_KEYS, 0, 0, width, height, WORLD_ZOOM);
    scatterTiles(scene, DECOR_KEYS, 0, 0, width, height, WORLD_ZOOM, 0.12);
    // A trodden yard of bare earth in the middle.
    scatterTiles(scene, ['path'], 64, 128, 1216, 448, WORLD_ZOOM);
    for (const [tx, ty, key] of SCENERY) {
      scene.add.image(tx * 64, ty * 64, key).setOrigin(0).setScale(WORLD_ZOOM);
    }
  },
  avatar: (scene) => ({
    view: standingPicture(scene, 'child', 620, 190, WORLD_ZOOM).setDepth(5),
    area: { x0: 60, y0: 140, x1: 1220, y1: 400 },
  }),
  // Open grass above the yard.
  hint: { x: 700, y: 100 },
  things: { axe, pony, fox, milkCan, cherry, snail, dog: awayDog, mouse: awayMouse },
};
