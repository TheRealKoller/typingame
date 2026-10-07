import * as Phaser from 'phaser';
import { STAGES } from './content/tutorial';
import { Progress } from './progress/progress';
import { createStorage } from './progress/storage';
import { BattleScene, type BattleSceneData } from './scenes/BattleScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { nextScene } from './scenes/flow';
import { NameScene } from './scenes/NameScene';
import { WorldMapScene } from './scenes/WorldMapScene';

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
    // Words are HTML text over the canvas so they stay sharp (see `WordLabel`).
    dom: { createContainer: true },
  });
  game.scene.add('NameScene', NameScene);
  game.scene.add('CutsceneScene', CutsceneScene);
  game.scene.add('WorldMapScene', WorldMapScene);
  game.scene.add('BattleScene', BattleScene);
  // A new game asks for the name first; a cutscene not seen yet comes before its stage.
  const first = nextScene(progress);
  // Development: `?karte=wege2` or `wege3` starts a battle on a map with that many paths (#147); it frees no place.
  const trial = import.meta.env.DEV ? /^wege([1-3])$/.exec(new URLSearchParams(location.search).get('karte') ?? '') : null;
  if (trial) game.scene.start('BattleScene', { progress, trialPaths: Number(trial[1]) } satisfies BattleSceneData);
  else game.scene.start(first.key, first.data);
}

void start();
