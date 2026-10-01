import ballImage from '../assets/world/ball.png';
import bankImage from '../assets/world/bench.png';
import beeImage from '../assets/world/bee.png';
import birdImage from '../assets/world/bird.png';
import childImage from '../assets/world/child.png';
import flowerImage from '../assets/world/flower.png';
import { floatText, rock, scatterTiles, standingPicture, type Room, type ThingFactory } from './thing';
import { DECOR_KEYS, GARDEN_TILES, GRASS_KEYS, WORLD_ZOOM } from './gardenTiles';

/** Scenery around the bed, in tile coordinates. */
const SCENERY: readonly (readonly [number, number, string])[] = [
  [1, 1, 'fir'],
  [7, 1, 'fir'],
  [13, 2, 'fir'],
  [18, 1, 'tree'],
  [2, 5, 'mushroom'],
  [15, 5, 'mushroom'],
];

const ball: ThingFactory = (scene) => {
  const x = 330;
  const y = 360;
  const view = standingPicture(scene, 'ball', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 36 },
    react: () => {
      // The ball bounces once.
      const rest = y;
      scene.tweens.killTweensOf(view);
      view.setPosition(x, rest).setScale(1);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { y: rest - 110, duration: 300, ease: 'Quad.easeOut' },
          { y: rest, duration: 300, ease: 'Quad.easeIn' },
        ],
      });
    },
  };
};

const bench: ThingFactory = (scene) => {
  const x = 150;
  const y = 320;
  const view = standingPicture(scene, 'bench', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 36 },
    react: () => {
      rock(scene, view, 2, 2);
    },
  };
};

const flower: ThingFactory = (scene) => {
  const x = 470;
  const y = 330;
  const view = standingPicture(scene, 'flower', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      rock(scene, view, 7, 3);
      floatText(scene, x, y - 100, '♪');
    },
  };
};

const bee: ThingFactory = (scene) => {
  const x = 640;
  const y = 250;
  const view = standingPicture(scene, 'bee', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      scene.tweens.killTweensOf(view);
      view.setPosition(x, y);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 70, y: y - 40, duration: 500, ease: 'Sine.easeInOut' },
          { x: x - 70, y: y + 20, duration: 700, ease: 'Sine.easeInOut' },
          { x, y, duration: 500, ease: 'Sine.easeInOut' },
        ],
      });
      floatText(scene, x, y - 70, 'summ!');
    },
  };
};

const bird: ThingFactory = (scene) => {
  const x = 890;
  const y = 290;
  const view = standingPicture(scene, 'bird', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      rock(scene, view, 10, 4);
      floatText(scene, x, y - 80, 'piep');
    },
  };
};

/** The tree of the bed; its drawing comes from the CC0 pack. */
const tree: ThingFactory = (scene) => {
  const x = 1110;
  const y = 340;
  const view = standingPicture(scene, 'tree', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 36 },
    react: () => {
      rock(scene, view, 5, 3);
      floatText(scene, x, y - 110, 'raschel');
    },
  };
};

/** Chapter 3: the bed with flowers, bee and bird; the tree comes from the pack. */
export const gardenBed: Room = {
  assets: [
    ...GARDEN_TILES,
    { key: 'child', url: childImage },
    { key: 'flower', url: flowerImage },
    { key: 'bee', url: beeImage },
    { key: 'bird', url: birdImage },
    { key: 'ball', url: ballImage },
    { key: 'bench', url: bankImage },
  ],
  backdrop: (scene) => {
    const { width, height } = scene.scale;
    scatterTiles(scene, GRASS_KEYS, 0, 0, width, height, WORLD_ZOOM);
    scatterTiles(scene, DECOR_KEYS, 0, 0, width, height, WORLD_ZOOM, 0.16);
    // The bed of soil in the middle of the grass.
    scatterTiles(scene, ['soil'], 256, 192, 640, 384, WORLD_ZOOM);
    for (const [tx, ty, key] of SCENERY) {
      scene.add.image(tx * 64, ty * 64, key).setOrigin(0).setScale(WORLD_ZOOM);
    }
  },
  avatar: (scene) => ({
    view: standingPicture(scene, 'child', 720, 420, WORLD_ZOOM).setDepth(5),
    area: { x0: 60, y0: 140, x1: 1220, y1: 400 },
  }),
  // Open grass above the bed.
  hint: { x: 760, y: 150 },
  things: { tree, flower, bee, bird, ball, bench },
};
