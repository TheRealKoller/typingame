import * as Phaser from 'phaser';
import { STAGES } from './content/tutorial';
import { Progress } from './progress/progress';
import { createStorage } from './progress/storage';
import { BattleScene } from './scenes/BattleScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { EndScene } from './scenes/EndScene';
import { nextScene } from './scenes/flow';
import { NameScene } from './scenes/NameScene';

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
  game.scene.add('NameScene', NameScene);
  game.scene.add('CutsceneScene', CutsceneScene);
  game.scene.add('EndScene', EndScene);
  game.scene.add('BattleScene', BattleScene);
  // A new game asks for the name first; a cutscene not seen yet comes before its stage.
  const first = nextScene(progress);
  game.scene.start(first.key, first.data);
}

void start();
