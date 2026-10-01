import mouseImage from '../assets/world/mouse.png';
import dogImage from '../assets/world/dog.png';
import gnomeImage from '../assets/world/gnome.png';
import mamaImage from '../assets/world/mama.png';
import sunImage from '../assets/world/sun.png';
import childImage from '../assets/world/child.png';
import { floatText, rock, scatterTiles, standingPicture, type Room, type ThingFactory } from './thing';
import { DECOR_KEYS, GARDEN_TILES, GRASS_KEYS, WORLD_ZOOM } from './gardenTiles';

/** Scenery of the meadow, in tile coordinates. */
const SCENERY: readonly (readonly [number, number, string])[] = [
  [2, 1, 'tree'],
  [14, 1, 'fir'],
  [6, 2, 'fir'],
  [17, 2, 'fir'],
  [4, 4, 'mushroom'],
  [11, 3, 'mushroom'],
  [16, 5, 'mushroom'],
  [1, 5, 'fir'],
];

const sun: ThingFactory = (scene) => {
  const x = 1150;
  const y = 150;
  const view = standingPicture(scene, 'sun', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 50 },
    react: () => {
      // The sun flares up for a moment.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scale: 1.2, duration: 500, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

const mama: ThingFactory = (scene) => {
  const x = 250;
  const y = 320;
  const view = standingPicture(scene, 'mama', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 46 },
    react: () => {
      rock(scene, view, 5, 2);
      floatText(scene, x, y - 130, 'hallo!');
    },
  };
};

const dog: ThingFactory = (scene) => {
  const x = 580;
  const y = 350;
  const view = standingPicture(scene, 'dog', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      rock(scene, view, 6, 4);
      floatText(scene, x + 40, y - 90, 'wau!');
    },
  };
};

const mouse: ThingFactory = (scene) => {
  const x = 830;
  const y = 370;
  const view = standingPicture(scene, 'mouse', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 40 },
    react: () => {
      rock(scene, view, 8, 4);
      floatText(scene, x - 30, y - 70, 'piep!');
    },
  };
};

const gnome: ThingFactory = (scene) => {
  const x = 1060;
  const y = 340;
  const view = standingPicture(scene, 'gnome', x, y, WORLD_ZOOM);
  return {
    view,
    label: { x, y: y + 44 },
    react: () => rock(scene, view, 5, 3),
  };
};

/** Chapter 3: the meadow where the first own words wake the garden up. */
export const meadow: Room = {
  assets: [
    ...GARDEN_TILES,
    { key: 'child', url: childImage },
    { key: 'mama', url: mamaImage },
    { key: 'sun', url: sunImage },
    { key: 'dog', url: dogImage },
    { key: 'mouse', url: mouseImage },
    { key: 'gnome', url: gnomeImage },
  ],
  backdrop: (scene) => {
    const { width, height } = scene.scale;
    scatterTiles(scene, GRASS_KEYS, 0, 0, width, height, WORLD_ZOOM);
    scatterTiles(scene, DECOR_KEYS, 0, 0, width, height, WORLD_ZOOM, 0.14);
    // A path across the meadow and a branch up to the top.
    for (let x = 0; x < width; x += 64) scene.add.image(x, 320, 'path').setOrigin(0).setScale(WORLD_ZOOM);
    for (let y = 0; y < 320; y += 64) scene.add.image(576, y, 'path').setOrigin(0).setScale(WORLD_ZOOM);
    for (const [tx, ty, key] of SCENERY) {
      scene.add.image(tx * 64, ty * 64, key).setOrigin(0).setScale(WORLD_ZOOM);
    }
  },
  avatar: (scene) => ({
    view: standingPicture(scene, 'child', 640, 300, WORLD_ZOOM).setDepth(5),
    area: { x0: 60, y0: 140, x1: 1220, y1: 400 },
  }),
  // Open grass between the path and the trees.
  hint: { x: 700, y: 200 },
  things: { mama, sun, dog, mouse, gnome },
};
