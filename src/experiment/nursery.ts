import * as Phaser from 'phaser';
import { Discoverable } from '../ui/Discoverable';
import cribImage from './assets/interior/crib.png';
import duckImage from './assets/interior/duck.png';
import floorImage from './assets/interior/floor_tile.png';
import mobileImage from './assets/interior/mobile.png';
import musicBoxImage from './assets/interior/music_box.png';
import nightLightImage from './assets/interior/night_light.png';
import teddyImage from './assets/interior/teddy.png';
import wallImage from './assets/interior/wall_tile.png';
import windowImage from './assets/interior/window.png';
import { addCaptions, addKeyboard, drawWord, HEIGHT, loadImages, tile, WIDTH } from './shared';

/**
 * Interiors are seen from the side and drawn closer up than the top-down world:
 * a screen pixel is 4 px of meadow there, 8 px here. One tile becomes 128 screen px.
 */
const ZOOM = 8;
/** Wall above, floor below. */
const FLOOR_TOP = 256;
/** Where the things stand; the strip in front of them carries the words. */
const FLOOR_Y = 384;
const LABEL_Y = 410;

/** No pack has side-view interiors, so these are drawn by `tools/make-nursery.py`. */
const IMAGES = [
  { key: 'wall', url: wallImage },
  { key: 'floor', url: floorImage },
  { key: 'window', url: windowImage },
  { key: 'crib', url: cribImage },
  { key: 'mobile', url: mobileImage },
  { key: 'musicBox', url: musicBoxImage },
  { key: 'teddy', url: teddyImage },
  { key: 'duck', url: duckImage },
  { key: 'nightLight', url: nightLightImage },
];

export class NurseryScene extends Phaser.Scene {
  constructor() {
    super('Nursery');
  }

  preload(): void {
    loadImages(this, IMAGES);
  }

  create(): void {
    tile(this, 'wall', 0, 0, WIDTH, FLOOR_TOP, ZOOM);
    tile(this, 'floor', 0, FLOOR_TOP, WIDTH, HEIGHT, ZOOM);

    // The window hangs on the wall; the mobile hangs over the crib.
    this.#decor('window', 1160, 240);
    this.#decor('mobile', 210, 156);

    this.#thing('crib', 210, 'jaja');
    this.#thing('musicBox', 500, 'lala');
    this.#thing('teddy', 660, 'haha');
    this.#thing('duck', 830, 'gaga');
    // The night light is not named yet, so it waits pale and blurred.
    this.#thing('nightLight', 1000, 'aha', false);
    drawWord(this, 420, 100, 'dada');

    addKeyboard(this);
    addCaptions(
      this,
      'Entwurf · Kinderzimmer in Seitenansicht · eigene Pixelsprites (kein Paket hat Innenräume)',
      'Kapitel 1: Laute statt Wörter · „aha" ist noch nicht benannt · ?scene=meadow zeigt die Wiese',
    );
  }

  /** A thing of the room with its word below it. */
  #thing(key: string, x: number, word: string, discovered = true): void {
    const image = this.add.image(0, 0, key).setOrigin(0.5, 1).setScale(ZOOM);
    const view = this.add.container(x, FLOOR_Y, [image]).setDepth(3);
    new Discoverable(view, discovered);
    drawWord(this, x, LABEL_Y, word);
  }

  /** Something that only decorates the room. */
  #decor(key: string, x: number, bottom: number): void {
    this.add.image(x, bottom, key).setOrigin(0.5, 1).setScale(ZOOM).setDepth(2);
  }
}
