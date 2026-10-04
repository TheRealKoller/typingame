import * as Phaser from 'phaser';
import { Progress } from './progress/progress';
import { createStorage } from './progress/storage';
import { HomeRowScene, type HomeRowSceneData } from './scenes/HomeRowScene';

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
    // Scenes read typing from native keydown events.
    input: { keyboard: false },
  });
  game.scene.add('HomeRowScene', HomeRowScene, true, { progress } satisfies HomeRowSceneData);
}

void start();
