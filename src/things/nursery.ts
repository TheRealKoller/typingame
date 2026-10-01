import bookshelfImage from '../assets/rooms/bookshelf.png';
import boxImage from '../assets/rooms/box.png';
import cabinetImage from '../assets/rooms/cabinet.png';
import cribImage from '../assets/rooms/crib.png';
import duckImage from '../assets/rooms/duck.png';
import floorImage from '../assets/rooms/floor_tile.png';
import mobileImage from '../assets/rooms/mobile.png';
import musicBoxImage from '../assets/rooms/music_box.png';
import nightLightImage from '../assets/rooms/night_light.png';
import pictureImage from '../assets/rooms/picture.png';
import plantImage from '../assets/rooms/plant.png';
import rugImage from '../assets/rooms/rug.png';
import shelfImage from '../assets/rooms/shelf.png';
import tableImage from '../assets/rooms/table.png';
import teddyImage from '../assets/rooms/teddy.png';
import wallImage from '../assets/rooms/wall_tile.png';
import childImage from '../assets/world/child.png';
import { fillTiles, floatText, rock, squash, standingPicture, type Room, type ThingFactory } from './thing';

/**
 * Experiment #65: the nursery as a top-down room, same perspective and scale as the world.
 * One 16 px tile fills 64 screen px here as well, so the things are not enlarged. Floor and
 * wall are our own tiles, the furniture comes from Kenney's CC0 `rpg-urban` pack.
 */
const ZOOM = 4;
const TILE = 16 * ZOOM;
/** The wall along the top edge, three tiles high. */
const WALL_H = 3 * TILE;

/** Furniture without a word, in tile coordinates. */
const FURNITURE: readonly (readonly [number, number, string])[] = [
  [6, 0, 'topPicture'],
  [13, 0, 'topPicture'],
  [0, 2, 'topCabinet'],
  [2, 2, 'topBox'],
  [3, 3, 'topBox'],
  [17, 2, 'topBookshelf'],
  [18, 4, 'topShelf'],
  [19, 3, 'topPlant'],
  [0, 5, 'topPlant'],
  [5, 4, 'topRug'],
  [12, 4, 'topTable'],
  [15, 4, 'topCabinet'],
  [9, 5, 'topBox'],
];

const bed: ThingFactory = (scene) => {
  const x = 300;
  const y = 350;
  const view = standingPicture(scene, 'topBed', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => rock(scene, view, 4, 3),
  };
};

const mobile: ThingFactory = (scene) => {
  const x = 300;
  const y = 260;
  const view = standingPicture(scene, 'topMobile', x, y, ZOOM);
  return {
    view,
    label: { x: x + 170, y: y - 20 },
    react: () => {
      // Mirroring the arm reads as the mobile turning around its string.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: -1, duration: 700, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

const musicBox: ThingFactory = (scene) => {
  const x = 600;
  const y = 300;
  const view = standingPicture(scene, 'topMusicBox', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => {
      rock(scene, view, 3, 2);
      ['♪', '♫', '♪', '♫'].forEach((note, i) => floatText(scene, x, y - 100, note, 200 + i * 450));
    },
  };
};

const teddy: ThingFactory = (scene) => {
  const x = 850;
  const y = 360;
  const view = standingPicture(scene, 'topTeddy', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => squash(scene, view, 1.15, 1.15),
  };
};

const duck: ThingFactory = (scene) => {
  const x = 1020;
  const y = 320;
  const view = standingPicture(scene, 'topDuck', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => {
      rock(scene, view, 6, 3);
      floatText(scene, x + 40, y - 70, 'quak!');
    },
  };
};

const nightLight: ThingFactory = (scene) => {
  const x = 1160;
  const y = 270;
  const view = standingPicture(scene, 'topNightLight', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => squash(scene, view, 1.2, 1.2),
  };
};

/** Chapter 1: the nursery where the first sounds wake the world up. */
export const nursery: Room = {
  assets: [
    { key: 'topFloor', url: floorImage },
    { key: 'topWall', url: wallImage },
    { key: 'topPicture', url: pictureImage },
    { key: 'topCabinet', url: cabinetImage },
    { key: 'topBox', url: boxImage },
    { key: 'topBookshelf', url: bookshelfImage },
    { key: 'topShelf', url: shelfImage },
    { key: 'topPlant', url: plantImage },
    { key: 'topTable', url: tableImage },
    { key: 'topRug', url: rugImage },
    { key: 'topBed', url: cribImage },
    { key: 'topMobile', url: mobileImage },
    { key: 'topMusicBox', url: musicBoxImage },
    { key: 'topTeddy', url: teddyImage },
    { key: 'topDuck', url: duckImage },
    { key: 'topNightLight', url: nightLightImage },
    { key: 'child', url: childImage },
  ],
  backdrop: (scene) => {
    const { width, height } = scene.scale;
    fillTiles(scene, 'topFloor', 0, WALL_H, width, height, ZOOM);
    fillTiles(scene, 'topWall', 0, 0, width, WALL_H, ZOOM);
    for (const [tx, ty, key] of FURNITURE) {
      scene.add.image(tx * TILE, ty * TILE, key).setOrigin(0).setScale(ZOOM);
    }
  },
  avatar: (scene) => ({
    view: standingPicture(scene, 'child', 640, 390, ZOOM).setDepth(5),
    area: { x0: 40, y0: 230, x1: 1240, y1: 400 },
  }),
  // Free wall space above the floor.
  hint: { x: 620, y: 120 },
  things: { bed, mobile, musicBox, teddy, duck, nightLight },
};
