import * as Phaser from 'phaser';
import { NurseryScene } from './scenes/NurseryScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#f4ede4',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  // Scenes read typing from native keydown events.
  input: { keyboard: false },
  scene: [NurseryScene],
});
