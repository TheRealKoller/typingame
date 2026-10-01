import catImage from '../assets/interior/living_room/cat.png';
import chairImage from '../assets/interior/living_room/chair.png';
import cupImage from '../assets/interior/living_room/cup.png';
import curtainsImage from '../assets/interior/living_room/curtains.png';
import dollImage from '../assets/interior/living_room/doll.png';
import lampImage from '../assets/interior/living_room/lamp.png';
import parrotImage from '../assets/interior/living_room/parrot.png';
import photoImage from '../assets/interior/living_room/photo.png';
import radioImage from '../assets/interior/living_room/radio.png';
import shelfImage from '../assets/interior/living_room/shelf.png';
import sofaImage from '../assets/interior/living_room/sofa.png';
import teaImage from '../assets/interior/living_room/tea.png';
import tableImage from '../assets/interior/living_room/tea_table.png';
import floorImage from '../assets/interior/shared/floor_tile.png';
import wallImage from '../assets/interior/shared/wall_tile.png';
import windowImage from '../assets/interior/shared/window.png';
import { fillTiles, floatText, rise, rock, squash, standingPicture, type Room, type ThingFactory } from './thing';

const ZOOM = 4;
const FLOOR_TOP = 384;
const LABEL_LINE = FLOOR_TOP + 26;
/** Tea corner on the left: pot and cup stand on the little table. */
const TABLE_TOP = FLOOR_TOP - 9 * ZOOM;
/** The wall shelf on the middle of the wall, carrying the radio. */
const SHELF_TOP = 250;
const PHOTO_BOTTOM = 220;

const tea: ThingFactory = (scene) => {
  const x = 170;
  const view = standingPicture(scene, 'tea', x, TABLE_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      rise(scene, x, TABLE_TOP - 90, 0xe4ddd4, 5, 7);
      rise(scene, x + 14, TABLE_TOP - 90, 0xe4ddd4, 4, 6);
    },
  };
};

const cup: ThingFactory = (scene) => {
  const x = 260;
  const view = standingPicture(scene, 'cup', x, TABLE_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      rock(scene, view, 4, 3);
      floatText(scene, x + 40, TABLE_TOP - 110, 'klirr');
    },
  };
};

const chair: ThingFactory = (scene) => {
  const x = 450;
  const view = standingPicture(scene, 'chair', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => rock(scene, view, 4, 3),
  };
};

const cat: ThingFactory = (scene) => {
  const x = 600;
  const view = standingPicture(scene, 'cat', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      // Stretching: the cat gets longer and flatter for a moment.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: 1.15, scaleY: 0.9, duration: 600, yoyo: true, ease: 'Sine.easeInOut' });
      floatText(scene, x, FLOOR_TOP - 130, 'miau');
    },
  };
};

const sofa: ThingFactory = (scene) => {
  const x = 880;
  const view = standingPicture(scene, 'sofa', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => squash(scene, view, 1.06, 0.9),
  };
};

const doll: ThingFactory = (scene) => {
  const x = 1080;
  const view = standingPicture(scene, 'doll', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      rock(scene, view, 8, 2);
      floatText(scene, x + 60, FLOOR_TOP - 150, 'hallo');
    },
  };
};

const photo: ThingFactory = (scene) => {
  const x = 640;
  const view = standingPicture(scene, 'photo', x, PHOTO_BOTTOM, ZOOM);
  return {
    view,
    label: { x, y: PHOTO_BOTTOM + 40 },
    react: () => rock(scene, view, 14, 4),
  };
};

const radio: ThingFactory = (scene) => {
  const x = 380;
  const view = standingPicture(scene, 'radio', x, SHELF_TOP, ZOOM);
  return {
    view,
    label: { x, y: SHELF_TOP + 40 },
    react: () => {
      ['♪', '♫', '♪'].forEach((note, i) => floatText(scene, x + 30, SHELF_TOP - 90, note, i * 500));
    },
  };
};

const parrot: ThingFactory = (scene) => {
  const x = 1210;
  const view = standingPicture(scene, 'parrot', x, FLOOR_TOP, ZOOM);
  return {
    view,
    label: { x, y: LABEL_LINE },
    react: () => {
      // Plustern: the parrot grows a little and its feathers stand up.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scale: 1.15, duration: 400, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      floatText(scene, x, FLOOR_TOP - 190, 'krah');
    },
  };
};

/** Chapter 2: the living room, tea corner first (2c), then sofa and wall (2d). */
export const livingRoom: Room = {
  assets: [
    { key: 'wall', url: wallImage },
    { key: 'floor', url: floorImage },
    { key: 'window', url: windowImage },
    { key: 'table', url: tableImage },
    { key: 'shelf', url: shelfImage },
    { key: 'tea', url: teaImage },
    { key: 'cup', url: cupImage },
    { key: 'chair', url: chairImage },
    { key: 'cat', url: catImage },
    { key: 'sofa', url: sofaImage },
    { key: 'doll', url: dollImage },
    { key: 'photo', url: photoImage },
    { key: 'radio', url: radioImage },
    { key: 'curtains', url: curtainsImage },
    { key: 'lamp', url: lampImage },
    { key: 'parrot', url: parrotImage },
  ],
  backdrop: (scene) => {
    fillTiles(scene, 'wall', 0, 0, scene.scale.width, FLOOR_TOP, ZOOM);
    fillTiles(scene, 'floor', 0, FLOOR_TOP, scene.scale.width, scene.scale.height, ZOOM);
    // Vorhaenge hinter dem Fenster und eine Lampe neben dem Tisch – ohne Wort.
    scene.add.image(1120, 250, 'curtains').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(1120, 250, 'window').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(65, FLOOR_TOP, 'lamp').setOrigin(0.5, 1).setScale(ZOOM);
    // The little table under the tea things and the shelf that carries the radio.
    scene.add.image(210, FLOOR_TOP, 'table').setOrigin(0.5, 1).setScale(ZOOM);
    scene.add.image(380, SHELF_TOP, 'shelf').setOrigin(0.5, 1).setScale(ZOOM);
  },
  // Free wall space between the shelf and the photo.
  hint: { x: 520, y: 120 },
  things: { tea, cup, chair, cat, sofa, doll, photo, radio, parrot },
};
