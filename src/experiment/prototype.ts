import * as Phaser from 'phaser';
import { MeadowScene } from './meadow';
import { NurseryScene } from './nursery';
import { HEIGHT, WIDTH } from './shared';

/** `?scene=nursery` shows the side view, everything else the top-down meadow. */
const wanted = new URLSearchParams(window.location.search).get('scene');

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
  scene: [wanted === 'nursery' ? NurseryScene : MeadowScene],
});
