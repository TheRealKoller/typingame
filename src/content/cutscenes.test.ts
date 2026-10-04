import { describe, expect, it } from 'vitest';
import { CUTSCENES, cutsceneBefore, pageText, speakerName } from './cutscenes';
import { JOURNEY, RAID, STAGES } from './tutorial';

describe('cutscenes', () => {
  it('start before existing stages, the raid or the journey only', () => {
    const stages = CUTSCENES.map((scene) => scene.beforeStage);
    const known = [...STAGES.map((stage) => stage.id), RAID, JOURNEY];
    expect(stages.filter((id) => !known.includes(id))).toEqual([]);
  });

  it('tell the end of the raid, then the ash fields, before the journey', () => {
    expect(cutsceneBefore(JOURNEY, new Set())?.id).toBe('raid-after');
    expect(cutsceneBefore(JOURNEY, new Set(['raid-after']))?.id).toBe('ash-fields');
    expect(cutsceneBefore(JOURNEY, new Set(['raid-after', 'ash-fields']))).toBeNull();
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
