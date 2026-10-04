import * as Phaser from 'phaser';
import { Progress } from './progress/progress';
import { createStorage } from './progress/storage';
import { BattleScene, type BattleSceneData } from './scenes/BattleScene';

async function start(): Promise<void> {
  const progress = await Progress.load(createStorage());

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#f4ede4',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
    },
    // Sharp pixels for the Spire art when the canvas is scaled.
    pixelArt: true,
    // Scenes read typing from native keydown events.
    input: { keyboard: false },
  });
  game.scene.add('BattleScene', BattleScene, true, { progress } satisfies BattleSceneData);
}

void start();
