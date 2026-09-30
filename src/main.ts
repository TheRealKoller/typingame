import * as Phaser from 'phaser';
import { playOrder } from './content/chapters';
import { Progress } from './progress/progress';
import { createStorage } from './progress/storage';
import { RoomScene, type RoomSceneData } from './scenes/RoomScene';

async function start(): Promise<void> {
  const first = playOrder[0];
  if (!first) throw new Error('there are no sections');
  const progress = await Progress.load(createStorage(), first.section.id);

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
  game.scene.add('RoomScene', RoomScene, true, { progress } satisfies RoomSceneData);
}

void start();
