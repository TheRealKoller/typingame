import * as Phaser from 'phaser';

/** Shown after the raid until the journey (world map) exists. */
export class EndScene extends Phaser.Scene {
  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#2a1e16').fadeIn(800);
    this.add
      .text(width / 2, height / 2 - 30, 'Ende des ersten Kapitels', { fontFamily: 'serif', fontSize: '44px', color: '#f4ead6' })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 30, 'Die Reise über die Weltkarte folgt.', { fontFamily: 'serif', fontSize: '26px', color: '#cbb894' })
      .setOrigin(0.5);
  }
}
