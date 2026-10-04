import { describe, expect, it } from 'vitest';
import { JOURNEY, RAID } from '../content/tutorial';
import { Progress } from '../progress/progress';
import { emptySave } from '../progress/save';
import { nextScene } from './flow';

function progressAt(stage: string, seen: string[] = [], name = 'Ada'): Progress {
  const storage = { load: async () => null, save: async () => {} };
  return new Progress(storage, { ...emptySave(stage), name, seen }, new Date());
}

describe('nextScene', () => {
  it('asks for the name first', () => {
    expect(nextScene(progressAt('1a', [], '')).key).toBe('NameScene');
  });

  it('tells the raid’s beginning before the raid battle', () => {
    expect(nextScene(progressAt(RAID))).toMatchObject({ key: 'CutsceneScene', data: { id: 'raid-before' } });
    expect(nextScene(progressAt(RAID, ['raid-before'])).key).toBe('BattleScene');
  });

  it('tells what happened after the raid, then opens the world map', () => {
    expect(nextScene(progressAt(JOURNEY, ['raid-before']))).toMatchObject({ key: 'CutsceneScene', data: { id: 'raid-after' } });
    expect(nextScene(progressAt(JOURNEY, ['raid-before', 'raid-after'])).key).toBe('WorldMapScene');
  });
});
