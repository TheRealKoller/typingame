import * as Phaser from 'phaser';
import { qwertzDe } from '../keyboard/qwertz-de';
import { Discoverable } from '../ui/Discoverable';
import { KeyboardView } from '../ui/KeyboardView';
import { WordLabel } from '../ui/WordLabel';
import bushTile from './assets/tile_0004.png';
import grassTile from './assets/tile_0000.png';
import grassTile2 from './assets/tile_0001.png';
import grassTile3 from './assets/tile_0002.png';
import patchTile from './assets/tile_0012.png';
import roadTile from './assets/tile_0025.png';
import sproutTile from './assets/tile_sprout.png';
import { CHILD, DOG, MOUSE, paintSprite } from './sprites';

const WIDTH = 1280;
const HEIGHT = 720;
/** One tile is 16 px and drawn four times as large. */
const STEP = 64;
/** How far down the child may walk before the keyboard starts. */
const WALK_BOTTOM = 366;
const WALK_SPEED = 240;

/** Ground tiles, mixed so the meadow does not look like a grid. */
const GROUND = [
  { key: 'grass', url: grassTile },
  { key: 'grass2', url: grassTile2 },
  { key: 'grass3', url: grassTile3 },
  { key: 'patch', url: patchTile },
];
const SCENERY = [
  { key: 'road', url: roadTile },
  { key: 'bush', url: bushTile },
  { key: 'sprout', url: sproutTile },
];

/** Where the bushes stand, in tiles. */
const BUSHES = [
  [1, 1],
  [6, 2],
  [13, 1],
  [17, 2],
  [4, 4],
  [16, 4],
] as const;

class PrototypeScene extends Phaser.Scene {
  readonly #arrows = new Set<string>();
  #child: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Prototype');
  }

  preload(): void {
    for (const { key, url } of [...GROUND, ...SCENERY]) this.load.image(key, url);
  }

  create(): void {
    for (const [name, rows] of Object.entries({ CHILD, DOG, MOUSE })) {
      if (rows.length !== 16 || rows.some((row) => row.length !== 16)) {
        throw new Error(`${name} is not a 16 x 16 sprite`);
      }
    }

    this.#ground();
    this.#road();
    for (const [tx, ty] of BUSHES) {
      this.add.image(tx * STEP, ty * STEP, 'bush').setOrigin(0).setScale(STEP / 16).setDepth(2);
    }
    this.add.image(3 * STEP, 4 * STEP, 'sprout').setOrigin(0).setScale(STEP / 16).setDepth(2);

    // The meadow's things, each with its word; "maus" is not named yet, so it waits pale and blurred.
    const dog = this.add.container(728, 268, [paintSprite(this, DOG, 4)]).setDepth(4);
    const mouse = this.add.container(908, 298, [paintSprite(this, MOUSE, 4)]).setDepth(4);
    new Discoverable(dog, true);
    new Discoverable(mouse, false);

    const words: readonly [string, number, number][] = [
      ['baum', 6 * STEP + 24, 2 * STEP + STEP + 8],
      ['blume', 3 * STEP + 24, 4 * STEP + STEP + 8],
      ['hund', 752, 344],
      ['maus', 932, 374],
    ];
    // Die Wortfarbe ist für den blassen Pastellhintergrund gemacht; `?plates` zeigt die Variante mit Unterlage.
    const plates = new URLSearchParams(window.location.search).has('plates');
    for (const [word, x, y] of words) {
      if (plates) this.add.rectangle(x, y, word.length * 19 + 26, 40, 0xf4ede4, 0.82).setRounded(10).setDepth(4);
      new WordLabel(this, x, y, word).setDepth(5);
    }

    this.#child = this.add.container(600, 260, [paintSprite(this, CHILD, 4)]).setDepth(6);

    new KeyboardView(this, WIDTH / 2, 485, qwertzDe)
      .setScale(0.65)
      .setUnlocked([...'asdfghjkleirutzopwqnmbv']);

    this.#captions();

    const press = (event: KeyboardEvent): void => {
      if (!event.key.startsWith('Arrow')) return;
      event.preventDefault();
      this.#arrows.add(event.key);
    };
    const release = (event: KeyboardEvent): void => {
      this.#arrows.delete(event.key);
    };
    window.addEventListener('keydown', press);
    window.addEventListener('keyup', release);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', press);
      window.removeEventListener('keyup', release);
    });
    this.events.on('update', (_time: number, delta: number) => this.#walk(delta));
  }

  #ground(): void {
    const cols = WIDTH / STEP;
    const rows = HEIGHT / STEP;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const pick = GROUND[(x * 7 + y * 5) % GROUND.length];
        if (pick) this.add.image(x * STEP, y * STEP, pick.key).setOrigin(0).setScale(STEP / 16);
      }
    }
  }

  /** A road across the meadow and a branch up to the top, so the ground has some structure. */
  #road(): void {
    const row = 5;
    for (let x = 0; x < WIDTH / STEP; x++) {
      this.add.image(x * STEP, row * STEP, 'road').setOrigin(0).setScale(STEP / 16).setDepth(1);
    }
    for (let y = 0; y < row; y++) {
      this.add.image(9 * STEP, y * STEP, 'road').setOrigin(0).setScale(STEP / 16).setDepth(1);
    }
  }

  #walk(delta: number): void {
    const child = this.#child;
    if (!child) return;
    const step = (WALK_SPEED * delta) / 1000;
    if (this.#arrows.has('ArrowLeft')) child.x -= step;
    if (this.#arrows.has('ArrowRight')) child.x += step;
    if (this.#arrows.has('ArrowUp')) child.y -= step;
    if (this.#arrows.has('ArrowDown')) child.y += step;
    child.x = Phaser.Math.Clamp(child.x, 0, WIDTH - STEP);
    child.y = Phaser.Math.Clamp(child.y, 0, WALK_BOTTOM);
  }

  #captions(): void {
    this.add.rectangle(WIDTH / 2, 34, WIDTH, 68, 0x1d1d24, 0.6).setDepth(9);
    this.add
      .text(WIDTH / 2, 12, 'Prototyp · Wiese in Draufsicht · Kacheln: Kenney „Tiny Town" / „Tiny Farm" (CC0)', {
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#f4ede4',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
    this.add
      .text(WIDTH / 2, 38, 'Welt: Pixel, vierfach · Bedienoberfläche: scharf wie im Spiel · Pfeiltasten bewegen das Kind', {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#cfc7ba',
      })
      .setOrigin(0.5, 0)
      .setDepth(10);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1d1d24',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
  },
  scene: [PrototypeScene],
});
