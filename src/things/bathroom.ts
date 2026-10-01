import basinImage from '../assets/interior/bathroom/basin.png';
import jellyfishImage from '../assets/interior/bathroom/jellyfish.png';
import mirrorImage from '../assets/interior/bathroom/mirror.png';
import scaleImage from '../assets/interior/bathroom/scale.png';
import soapImage from '../assets/interior/bathroom/soap.png';
import tubImage from '../assets/interior/bathroom/tub.png';
import waterImage from '../assets/interior/bathroom/water.png';
import floorImage from '../assets/interior/shared/floor_tile.png';
import wallImage from '../assets/interior/shared/wall_tile.png';
import windowImage from '../assets/interior/shared/window.png';
import { fillTiles, floatText, rise, rock, standingPicture, type Room, type ThingFactory } from './thing';

const ZOOM = 8;
const FLOOR_TOP = 384;
const LABEL_LINE = FLOOR_TOP + 26;
/** The tub, the water in it and the jellyfish above the water. */
const TUB_X = 400;
const TUB_TOP = FLOOR_TOP - 15 * ZOOM;
const WATER_BOTTOM = TUB_TOP + 44;
/** The washbasin with soap on its rim and the mirror above it. */
const BASIN_X = 820;
const BASIN_TOP = FLOOR_TOP - 13 * ZOOM;

const water: ThingFactory = (scene) => {
  const view = standingPicture(scene, 'water', TUB_X, WATER_BOTTOM, ZOOM);
  return {
    view,
    label: { x: TUB_X, y: LABEL_LINE },
    react: () => {
      // Ripples: the surface widens and settles again.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: 1.04, duration: 300, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
      floatText(scene, TUB_X + 90, WATER_BOTTOM - 60, 'platsch');
    },
  };
};

const jellyfish: ThingFactory = (scene) => {
  const x = TUB_X + 80;
  const view = standingPicture(scene, 'jellyfish', x, WATER_BOTTOM, ZOOM);
  return {
    view,
    // The jellyfish sits above the water; its word goes beside the tub.
    label: { x: 660, y: 300 },
    react: () => {
      // A round through the tub and back.
      scene.tweens.killTweensOf(view);
      view.setPosition(x, WATER_BOTTOM).setScale(1);
      scene.tweens.chain({
        targets: view,
        tweens: [
          { x: x + 130, scaleX: 0.85, duration: 900, ease: 'Sine.easeInOut' },
          { x, scaleX: 1, duration: 900, ease: 'Sine.easeInOut' },
        ],
      });
    },
  };
};

const soap: ThingFactory = (scene) => {
  const x = BASIN_X - 30;
  const bottom = BASIN_TOP + 8;
  const view = standingPicture(scene, 'soap', x, bottom, ZOOM);
  return {
    view,
    label: { x: x + 170, y: BASIN_TOP - 70 },
    react: () => {
      rise(scene, x, bottom - 30, 0xf2f6fa, 6, 6);
      rise(scene, x + 10, bottom - 30, 0xffffff, 5, 5);
    },
  };
};

const mirror: ThingFactory = (scene) => {
  const x = BASIN_X;
  const bottom = 190;
  const shine = scene.add.rectangle(0, -70, 60, 12, 0xffffff).setAlpha(0).setAngle(-30);
  const image = scene.add.image(0, 0, 'mirror').setOrigin(0.5, 1).setScale(ZOOM);
  const view = scene.add.container(x, bottom, [image, shine]);
  return {
    view,
    label: { x, y: bottom - 150 },
    react: () => {
      scene.tweens.killTweensOf(shine);
      scene.tweens.chain({
        targets: shine,
        tweens: [
          { alpha: 0.85, duration: 250, ease: 'Sine.easeOut' },
          { alpha: 0, delay: 250, duration: 400, ease: 'Sine.easeIn' },
        ],
      });
    },
  };
};

const scale: ThingFactory = (scene) => {
  const x = 1130;
  const view = standingPicture(scene, 'scale', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => rock(scene, view, 6, 4),
  };
};

/** Chapter 2: the bathroom with its tub, washbasin and scale. */
export const bathroom: Room = {
  assets: [
    { key: 'wall', url: wallImage },
    { key: 'floor', url: floorImage },
    { key: 'window', url: windowImage },
    { key: 'tub', url: tubImage },
    { key: 'basin', url: basinImage },
    { key: 'water', url: waterImage },
    { key: 'jellyfish', url: jellyfishImage },
    { key: 'soap', url: soapImage },
    { key: 'mirror', url: mirrorImage },
    { key: 'scale', url: scaleImage },
  ],
  backdrop: (scene) => {
    fillTiles(scene, 'wall', 0, 0, scene.scale.width, FLOOR_TOP, ZOOM);
    fillTiles(scene, 'floor', 0, FLOOR_TOP, scene.scale.width, scene.scale.height, ZOOM);
    scene.add.image(110, 230, 'window').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(TUB_X, FLOOR_TOP, 'tub').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(BASIN_X, FLOOR_TOP, 'basin').setOrigin(0.5, 1).setScale(ZOOM);
  },
  // Free wall space between the tub and the washbasin.
  hint: { x: 600, y: 130 },
  things: { water, jellyfish, soap, mirror, scale },
};
