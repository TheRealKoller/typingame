import bedImage from '../assets/interior/nursery/crib.png';
import duckImage from '../assets/interior/nursery/duck.png';
import mobileImage from '../assets/interior/nursery/mobile.png';
import musicBoxImage from '../assets/interior/nursery/music_box.png';
import nightLightImage from '../assets/interior/nursery/night_light.png';
import teddyImage from '../assets/interior/nursery/teddy.png';
import plantImage from '../assets/interior/shared/plant.png';
import pictureImage from '../assets/interior/shared/picture.png';
import toyShelfImage from '../assets/interior/nursery/toy_shelf.png';
import floorImage from '../assets/interior/shared/floor_tile.png';
import wallImage from '../assets/interior/shared/wall_tile.png';
import windowImage from '../assets/interior/shared/window.png';
import { fillTiles, floatText, rock, squash, standingPicture, type Room, type ThingFactory } from './thing';

/**
 * The nursery is an interior: seen from the side and drawn closer up than the top-down world.
 * One 16 px tile fills 128 screen px here, 64 px outside (decision in #47). The sprites come
 * from `src/tools/make-sprites.py`, because no free pack has side-view interiors.
 */
const ZOOM = 4;
/** Wall above, floor below – three and three tiles. The things stand on the boundary. */
const FLOOR_TOP = 384;
const LABEL_LINE = FLOOR_TOP + 26;

const bed: ThingFactory = (scene) => {
  const x = 210;
  const view = standingPicture(scene, 'bed', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => rock(scene, view, 4, 3),
  };
};

const mobile: ThingFactory = (scene) => {
  const x = 210;
  const view = standingPicture(scene, 'mobile', x, 170, ZOOM);
  return {
    view,
    // The mobile hangs high up; its word sits beside it instead of under it.
    label: { x: x + 200, y: 150 },
    react: () => {
      // Mirroring the arm back and forth reads as the mobile turning around its string.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: -1, duration: 700, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

const musicBox: ThingFactory = (scene) => {
  const x = 500;
  const view = standingPicture(scene, 'musicBox', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      rock(scene, view, 3, 2);
      ['♪', '♫', '♪', '♫'].forEach((note, i) => floatText(scene, x, FLOOR_TOP - 130, note, 200 + i * 450));
    },
  };
};

const teddy: ThingFactory = (scene) => {
  const x = 680;
  const view = standingPicture(scene, 'teddy', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => rock(scene, view, 12, 4),
  };
};

const duck: ThingFactory = (scene) => {
  const x = 850;
  const view = standingPicture(scene, 'duck', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      squash(scene, view, 1.12, 0.8);
      floatText(scene, x + 40, FLOOR_TOP - 120, 'quietsch!');
    },
  };
};

const nightLight: ThingFactory = (scene) => {
  const x = 1020;
  const glow = scene.add.circle(0, -110, 90, 0xfff1b8).setAlpha(0);
  const image = scene.add.image(0, 0, 'nightLight').setOrigin(0.5, 1).setScale(ZOOM);
  const view = scene.add.container(x, FLOOR_TOP, [glow, image]);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      scene.tweens.killTweensOf(glow);
      scene.tweens.chain({
        targets: glow,
        tweens: [
          { alpha: 0.7, duration: 500, ease: 'Sine.easeOut' },
          { alpha: 0, delay: 3000, duration: 800, ease: 'Sine.easeIn' },
        ],
      });
    },
  };
};

/** Chapter 1: the baby's room, where the first sounds make things show up. */
export const nursery: Room = {
  assets: [
    { key: 'wall', url: wallImage },
    { key: 'floor', url: floorImage },
    { key: 'window', url: windowImage },
    { key: 'bed', url: bedImage },
    { key: 'mobile', url: mobileImage },
    { key: 'musicBox', url: musicBoxImage },
    { key: 'teddy', url: teddyImage },
    { key: 'duck', url: duckImage },
    { key: 'toyShelf', url: toyShelfImage },
    { key: 'picture', url: pictureImage },
    { key: 'plant', url: plantImage },
    { key: 'nightLight', url: nightLightImage },
  ],
  backdrop: (scene) => {
    fillTiles(scene, 'wall', 0, 0, scene.scale.width, FLOOR_TOP, ZOOM);
    fillTiles(scene, 'floor', 0, FLOOR_TOP, scene.scale.width, scene.scale.height, ZOOM);
    // A night window on the wall.
    // Wandschmuck und ein Topf in der Ecke – ohne Wort.
    scene.add.image(420, 260, 'toyShelf').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(700, 220, 'picture').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(1220, FLOOR_TOP, 'plant').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(1060, 250, 'window').setOrigin(0.5, 1).setScale(ZOOM);
  },
  // Free wall space between the mobile and the window.
  hint: { x: 660, y: 130 },
  things: { bed, mobile, musicBox, teddy, duck, nightLight },
};
