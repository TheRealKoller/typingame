import { cutsceneBefore } from '../content/cutscenes';
import { JOURNEY } from '../content/tutorial';
import type { Progress } from '../progress/progress';

/** A scene to start and the data it gets. */
export interface SceneStart {
  readonly key: 'NameScene' | 'CutsceneScene' | 'BattleScene' | 'EndScene';
  readonly data: object;
}

/**
 * Where play continues for `progress`: the name prompt for a new game, then
 * the cutscene that belongs before the current stage if it was not seen yet,
 * otherwise the battle. `announce` lets the battle name the keys of a stage
 * that has just begun.
 */
export function nextScene(progress: Progress, announce = false): SceneStart {
  if (progress.name === '') return { key: 'NameScene', data: { progress } };
  const scene = cutsceneBefore(progress.stage, progress.seen);
  if (scene) return { key: 'CutsceneScene', data: { progress, id: scene.id } };
  // The journey needs the world map (milestone 4); until then the game ends after the raid.
  if (progress.stage === JOURNEY) return { key: 'EndScene', data: {} };
  return { key: 'BattleScene', data: { progress, announce } };
}
