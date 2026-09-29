import * as Phaser from 'phaser';
import { chapter1 } from './content/chapter1';
import { Progress } from './progress/progress';
import { createStorage } from './progress/storage';
import { NurseryScene, type NurserySceneData } from './scenes/NurseryScene';

async function start(): Promise<void> {
  const firstSection = chapter1.sections[0];
  if (!firstSection) throw new Error('chapter 1 has no sections');
  const progress = await Progress.load(createStorage(), firstSection.id);

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
  game.scene.add('NurseryScene', NurseryScene, true, { progress } satisfies NurserySceneData);
}

void start();
