import { describe, expect, it } from 'vitest';
import { CUTSCENES, cutsceneBefore, pageText, speakerName } from './cutscenes';
import { JOURNEY, RAID, STAGES } from './tutorial';

describe('cutscenes', () => {
  it('start before existing stages, the raid or the journey only, at most one per stage', () => {
    const stages = CUTSCENES.map((scene) => scene.beforeStage);
    const known = [...STAGES.map((stage) => stage.id), RAID, JOURNEY];
    expect(stages.filter((id) => !known.includes(id))).toEqual([]);
    expect(new Set(stages).size).toBe(stages.length);
  });

  it('play the intro before the first lesson, and not again once seen', () => {
    expect(cutsceneBefore('1a', new Set())?.id).toBe('intro');
    expect(cutsceneBefore('1a', new Set(['intro']))).toBeNull();
    expect(cutsceneBefore('1b', new Set())).toBeNull();
  });

  it('fill in the apprentice’s name and show who speaks', () => {
    expect(pageText({ speaker: 'master', text: '{name}! Und noch mal, {name}.' }, 'Ada')).toBe('Ada! Und noch mal, Ada.');
    expect([speakerName('master', 'Ada'), speakerName('apprentice', 'Ada'), speakerName('narrator', 'Ada')]).toEqual([
      'Kalliope',
      'Ada',
      null,
    ]);
  });
});
