/// <reference types="vite/client" />
// Probe for issue #135: painted assets in a battle-sized Phaser scene, without pixel art.
// White paper backgrounds disappear through the MULTIPLY blend mode on light ground.
import Phaser from 'phaser';
import mapUrl from './demo/karte.png';
import golemInkUrl from './demo/golem-feder.png';
import golemWashUrl from './demo/golem-aquarell.png';
import towerUrl from './demo/turm.png';
import snakesUrl from './demo/schlangen.png';
import spyglassUrl from './demo/fernrohr.png';

/** Same split as BattleScene: the map lies above, the desk below. */
const DESK_TOP = 470;
const PARCHMENT = 0xefe6cf;
const INK = '#2b2116';
/** Road of karte.png, read off the image, in screen coordinates after scaling to DESK_TOP. */
const ROAD = [
  { x: 60, y: 135 },
  { x: 255, y: 215 },
  { x: 450, y: 294 },
  { x: 568, y: 382 },
  { x: 680, y: 470 },
];
const ENEMY_HEIGHT = 72;
const TOWER_HEIGHT = 110;

class ProbeScene extends Phaser.Scene {
  preload(): void {
    this.load.image('map', mapUrl);
    this.load.image('golem-ink', golemInkUrl);
    this.load.image('golem-wash', golemWashUrl);
    this.load.image('tower', towerUrl);
    this.load.image('snakes', snakesUrl);
    this.load.image('spyglass', spyglassUrl);
  }

  create(): void {
    this.add.rectangle(0, 0, 1280, 720, PARCHMENT).setOrigin(0);
    this.add.image(0, 0, 'map').setOrigin(0).setScale(DESK_TOP / 768);

    this.#tower(300, 330, TOWER_HEIGHT);
    this.#tower(560, 215, TOWER_HEIGHT);
    this.#walker('golem-ink', 0);
    this.#walker('golem-wash', 4500);

    this.#label(1050, 20, 'Spielgröße');
    this.#paint('golem-ink', 960, 140, ENEMY_HEIGHT);
    this.#paint('golem-wash', 1050, 140, ENEMY_HEIGHT);
    this.#tower(1160, 150, TOWER_HEIGHT);
    this.#label(1050, 170, 'ohne Multiplizieren');
    this.add.image(1000, 290, 'golem-ink').setScale(ENEMY_HEIGHT / this.textures.get('golem-ink').getSourceImage().height).setOrigin(0.5, 1);
    this.add.image(1110, 290, 'tower').setScale(TOWER_HEIGHT / this.textures.get('tower').getSourceImage().height).setOrigin(0.5, 1);
    this.#label(1050, 310, 'Bausteine: Grundform + Schlangen + Fernrohr');
    this.#paint('tower', 960, 450, TOWER_HEIGHT);
    this.#paint('snakes', 1050, 450, TOWER_HEIGHT * 0.45);
    this.#paint('spyglass', 1130, 450, TOWER_HEIGHT * 0.45);

    this.add.rectangle(0, DESK_TOP, 1280, 720 - DESK_TOP, 0xd9c9a3).setOrigin(0);
    this.#label(640, DESK_TOP + 10, 'Doppelte Größe');
    this.#paint('golem-ink', 160, 700, ENEMY_HEIGHT * 2.6);
    this.#paint('golem-wash', 380, 700, ENEMY_HEIGHT * 2.6);
    this.#tower(640, 700, TOWER_HEIGHT * 1.8);
    this.#paint('snakes', 880, 700, ENEMY_HEIGHT * 1.6);
    this.#paint('spyglass', 1080, 700, ENEMY_HEIGHT * 2.2);
  }

  /** A painted image standing on (x, y), scaled to the given height, white paper multiplied away. */
  #paint(key: string, x: number, y: number, height: number): Phaser.GameObjects.Image {
    const source = this.textures.get(key).getSourceImage();
    return this.add.image(x, y, key).setOrigin(0.5, 1).setScale(height / source.height).setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  /** Base form with two parts at fixed anchors: snakes in front of the base, the spyglass on the crenellations. */
  #tower(x: number, y: number, height: number): void {
    const base = this.#paint('tower', x, y, height);
    this.#paint('spyglass', x + base.displayWidth * 0.05, y - base.displayHeight * 0.88, height * 0.4);
    this.#paint('snakes', x - base.displayWidth * 0.32, y + height * 0.04, height * 0.38);
  }

  /** Enemy following the road; the cut-out sways and bobs instead of frame animation. */
  #walker(key: string, delay: number): void {
    const enemy = this.#paint(key, ROAD[0]!.x, ROAD[0]!.y, ENEMY_HEIGHT).setDepth(10);
    const baseScale = enemy.scaleX;
    this.tweens.add({ targets: enemy, angle: { from: -6, to: 6 }, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: enemy, scaleY: baseScale * 0.94, duration: 210, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const path = new Phaser.Curves.Spline(ROAD.map((p) => new Phaser.Math.Vector2(p.x, p.y)));
    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      delay,
      duration: 9000,
      repeat: -1,
      onUpdate: () => {
        const point = path.getPoint(progress.t);
        enemy.setPosition(point.x, point.y);
      },
    });
  }

  #label(x: number, y: number, text: string): void {
    this.add.text(x, y, text, { fontFamily: 'Georgia, serif', fontSize: '16px', color: INK }).setOrigin(0.5, 0);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#efe6cf',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: ProbeScene,
});
