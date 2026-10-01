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
import wallPlainImage from '../assets/rooms/wall_plain.png';
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
/** The wall face along the top, two tiles high, and one tile down each side. */
const WALL_H = 2 * TILE;
const WALL_SIDE = TILE;
/** Where the floor ends at the bottom; the wall below it sits behind the keyboard. */
const ROOM_BOTTOM = 9 * TILE;

/**
 * Furniture without a word, in tile coordinates: the fourth entry mirrors the sprite, which
 * breaks up the rows. Pieces stand against a wall or in a corner, the middle stays walkable.
 */
const FURNITURE: readonly (readonly [number, number, string, boolean?])[] = [
  // Top wall: a window at each end, pictures between, furniture standing underneath.
  [5, 0, 'topWindow'],
  [14, 0, 'topWindow'],
  [2, 1, 'topPicture'],
  [8, 1, 'topPicture2'],
  [11, 1, 'topPicture3'],
  [16, 1, 'topMirror'],
  [2, 2, 'topBookshelf'],
  [3, 2, 'topCupboard'],
  [6, 2, 'topShelf'],
  [8, 2, 'topDrawer'],
  // Left wall: the sleeping corner, with a chest beside the bed.
  [1, 3, 'topCabinet', true],
  [1, 5, 'topRug'],
  [1, 6, 'topChest'],
  // Right wall: a desk with a seat, flowers in the corner.
  [18, 3, 'topDesk'],
  [18, 5, 'topSeat'],
  [18, 6, 'topPlant'],
  // Floor: a rug to play on, a table, a bench, the toy box and crates near it.
  [6, 5, 'topRug2'],
  [12, 5, 'topTable'],
  [15, 5, 'topChest', true],
  [14, 6, 'topBench'],
  [9, 6, 'topBox2'],
  [10, 3, 'topCrate', true],
  [4, 4, 'topShrub'],
  [16, 4, 'topPlant3'],
];

const bed: ThingFactory = (scene) => {
  const x = 260;
  const y = 384;
  const view = standingPicture(scene, 'topBed', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => rock(scene, view, 4, 3),
  };
};

const mobile: ThingFactory = (scene) => {
  const x = 260;
  const y = 300;
  const view = standingPicture(scene, 'topMobile', x, y, ZOOM);
  return {
    view,
    label: { x: x + 170, y: y - 10 },
    react: () => {
      // Mirroring the arm reads as the mobile turning around its string.
      scene.tweens.killTweensOf(view);
      view.setScale(1);
      scene.tweens.add({ targets: view, scaleX: -1, duration: 700, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    },
  };
};

const musicBox: ThingFactory = (scene) => {
  const x = 800;
  const y = 350;
  const view = standingPicture(scene, 'topMusicBox', x, y, ZOOM);
  return {
    view,
    // The music box stands on the table, its word sits beside it.
    label: { x: x - 90, y: y - 40 },
    react: () => {
      rock(scene, view, 3, 2);
      ['♪', '♫', '♪', '♫'].forEach((note, i) => floatText(scene, x, y - 100, note, 200 + i * 450));
    },
  };
};

const teddy: ThingFactory = (scene) => {
  const x = 1010;
  const y = 390;
  const view = standingPicture(scene, 'topTeddy', x, y, ZOOM);
  return {
    view,
    label: { x, y: y + 30 },
    react: () => squash(scene, view, 1.15, 1.15),
  };
};

const duck: ThingFactory = (scene) => {
  const x = 1130;
  const y = 360;
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
  const x = 470;
  const y = 330;
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
    { key: 'topWallPlain', url: wallPlainImage },
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
    // The floor is framed by a wall on every side, so the room reads as a room.
    fillTiles(scene, 'topFloor', WALL_SIDE, WALL_H, width - WALL_SIDE, ROOM_BOTTOM, ZOOM);
    fillTiles(scene, 'topWall', 0, 0, width, WALL_H, ZOOM);
    fillTiles(scene, 'topWallPlain', 0, WALL_H, WALL_SIDE, ROOM_BOTTOM, ZOOM);
    fillTiles(scene, 'topWallPlain', width - WALL_SIDE, WALL_H, width, ROOM_BOTTOM, ZOOM);
    fillTiles(scene, 'topWallPlain', 0, ROOM_BOTTOM, width, height, ZOOM);
    for (const [tx, ty, key, flip] of FURNITURE) {
      scene.add.image(tx * TILE, ty * TILE, key).setOrigin(0).setScale(ZOOM).setFlipX(flip === true);
    }
  },
  avatar: (scene) => ({
    view: standingPicture(scene, 'child', 640, 400, ZOOM).setDepth(5),
    area: { x0: 80, y0: 200, x1: 1200, y1: 430 },
  }),
  // Clear wall between the pictures.
  hint: { x: 620, y: 96 },
  things: { bed, mobile, musicBox, teddy, duck, nightLight },
};
