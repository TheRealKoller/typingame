import * as Phaser from 'phaser';
import { STAGES } from './content/tutorial';
import { Progress } from './progress/progress';
import { createStorage } from './progress/storage';
import { BattleScene, type BattleSceneData } from './scenes/BattleScene';
import { NameScene, type NameSceneData } from './scenes/NameScene';

async function start(): Promise<void> {
  const progress = await Progress.load(createStorage(), STAGES[0]!.id);

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
  // A new game asks for the apprentice's name first.
  const named = progress.name !== '';
  game.scene.add('NameScene', NameScene, !named, { progress } satisfies NameSceneData);
  game.scene.add('BattleScene', BattleScene, named, { progress } satisfies BattleSceneData);
}

void start();
