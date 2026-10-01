import barrelImage from '../assets/rooms/barrel.png';
import benchImage from '../assets/rooms/bench.png';
import bookshelfImage from '../assets/rooms/bookshelf.png';
import box2Image from '../assets/rooms/box2.png';
import box3Image from '../assets/rooms/box3.png';
import boxImage from '../assets/rooms/box.png';
import cabinetImage from '../assets/rooms/cabinet.png';
import chestImage from '../assets/rooms/chest.png';
import couchImage from '../assets/rooms/couch.png';
import crateImage from '../assets/rooms/crate.png';
import cribImage from '../assets/rooms/crib.png';
import cupboardImage from '../assets/rooms/cupboard.png';
import deskImage from '../assets/rooms/desk.png';
import drawerImage from '../assets/rooms/drawer.png';
import duckImage from '../assets/rooms/duck.png';
import floorImage from '../assets/rooms/floor_tile.png';
import frameImage from '../assets/rooms/frame.png';
import mirrorImage from '../assets/rooms/mirror.png';
import mobileImage from '../assets/rooms/mobile.png';
import musicBoxImage from '../assets/rooms/music_box.png';
import nightLightImage from '../assets/rooms/night_light.png';
import picture2Image from '../assets/rooms/picture2.png';
import picture3Image from '../assets/rooms/picture3.png';
import pictureImage from '../assets/rooms/picture.png';
import plant2Image from '../assets/rooms/plant2.png';
import plant3Image from '../assets/rooms/plant3.png';
import plantImage from '../assets/rooms/plant.png';
import rug2Image from '../assets/rooms/rug2.png';
import rugImage from '../assets/rooms/rug.png';
import seatImage from '../assets/rooms/seat.png';
import shelfImage from '../assets/rooms/shelf.png';
import shrubImage from '../assets/rooms/shrub.png';
import tableImage from '../assets/rooms/table.png';
import teddyImage from '../assets/rooms/teddy.png';
import wallImage from '../assets/rooms/wall_tile.png';
import windowImage from '../assets/rooms/window.png';
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

/** Everything without a word, in tile coordinates: hung on the wall or standing on the floor. */
const FURNITURE: readonly (readonly [number, number, string])[] = [
  // Wall: two windows and a row of framed pictures.
  [4, 0, 'topWindow'],
  [15, 0, 'topWindow'],
  [1, 1, 'topPicture'],
  [7, 1, 'topPicture2'],
  [9, 0, 'topMirror'],
  [11, 1, 'topPicture3'],
  [17, 1, 'topFrame'],
  // Floor: shelves and boxes along the wall, seats and tables in the room.
  [0, 2, 'topBookshelf'],
  [2, 2, 'topCupboard'],
  [4, 2, 'topBox'],
  [7, 2, 'topChest'],
  [10, 2, 'topShelf'],
  [13, 2, 'topCrate'],
  [16, 2, 'topCabinet'],
  [18, 2, 'topDrawer'],
  [3, 4, 'topRug'],
  [7, 4, 'topCouch'],
  [10, 4, 'topTable'],
  [13, 4, 'topBench'],
  [16, 4, 'topDesk'],
  [0, 5, 'topPlant'],
  [3, 5, 'topBarrel'],
  [6, 5, 'topBox2'],
  [9, 5, 'topRug2'],
  [12, 5, 'topSeat'],
  [15, 5, 'topPlant2'],
  [18, 5, 'topShrub'],
  [1, 6, 'topBox3'],
  [5, 6, 'topPlant3'],
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
  const x = 620;
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
  const x = 870;
  const y = 360;
  const view = standingPicture(scene, 'topTeddy', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => squash(scene, view, 1.15, 1.15),
  };
};

const duck: ThingFactory = (scene) => {
  const x = 1030;
  const y = 310;
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
  const x = 1170;
  const y = 265;
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
    { key: 'topWindow', url: windowImage },
    { key: 'topMirror', url: mirrorImage },
    { key: 'topFrame', url: frameImage },
    { key: 'topPicture', url: pictureImage },
    { key: 'topPicture2', url: picture2Image },
    { key: 'topPicture3', url: picture3Image },
    { key: 'topBookshelf', url: bookshelfImage },
    { key: 'topCupboard', url: cupboardImage },
    { key: 'topShelf', url: shelfImage },
    { key: 'topCabinet', url: cabinetImage },
    { key: 'topDrawer', url: drawerImage },
    { key: 'topBox', url: boxImage },
    { key: 'topBox2', url: box2Image },
    { key: 'topBox3', url: box3Image },
    { key: 'topChest', url: chestImage },
    { key: 'topCrate', url: crateImage },
    { key: 'topRug', url: rugImage },
    { key: 'topRug2', url: rug2Image },
    { key: 'topCouch', url: couchImage },
    { key: 'topTable', url: tableImage },
    { key: 'topBench', url: benchImage },
    { key: 'topDesk', url: deskImage },
    { key: 'topSeat', url: seatImage },
    { key: 'topBarrel', url: barrelImage },
    { key: 'topPlant', url: plantImage },
    { key: 'topPlant2', url: plant2Image },
    { key: 'topPlant3', url: plant3Image },
    { key: 'topShrub', url: shrubImage },
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
  hint: { x: 620, y: 60 },
  things: { bed, mobile, musicBox, teddy, duck, nightLight },
};
