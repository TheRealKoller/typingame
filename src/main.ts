import * as Phaser from 'phaser';
import { KeyboardPreviewScene } from './scenes/KeyboardPreviewScene';

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
  scene: [KeyboardPreviewScene],
});
