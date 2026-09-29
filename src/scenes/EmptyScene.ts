import * as Phaser from 'phaser';

/** Placeholder scene proving that Phaser boots in the browser and in the Tauri window. */
export class EmptyScene extends Phaser.Scene {
  constructor() {
    super('EmptyScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'typingame', {
        fontFamily: 'sans-serif',
        fontSize: '48px',
        color: '#7a6a5a',
      })
      .setOrigin(0.5);
  }
}
