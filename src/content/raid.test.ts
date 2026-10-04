import { expect, it } from 'vitest';
import { Battle } from '../battle/battle';
import { Commands } from '../battle/commands';
import { RAID_LEVEL } from './raid';
import { CROSSBOW } from './towers';
import { raidSetup } from './tutorial';

it('offers words from the whole tutorial on every build site, without prefix pairs', () => {
  const setup = raidSetup();
  const commands = new Commands(new Battle(RAID_LEVEL), setup.towers, setup.words, { keys: {} });
  const words = commands.words;
  expect(words).toHaveLength(RAID_LEVEL.sites.length);
  expect(words.some((word, i) => words.some((other, j) => i !== j && other.startsWith(word)))).toBe(false);
});

it('cannot be won, even with a tower on every build site from the start – but the horde can be wounded', () => {
  const battle = new Battle({ ...RAID_LEVEL, ink: 1_000_000 });
  for (const site of battle.level.sites) battle.build(site, CROSSBOW);
  const last = RAID_LEVEL.waves.length - 1;
  let wardAtLastWave = -1;
  let defeatedInLastWave = 0;
  for (let step = 0; step < 100_000 && battle.phase !== 'lost' && battle.phase !== 'won'; step++) {
    battle.endFlood();
    const { shots } = battle.update(100);
    if (battle.wave === last) {
      if (wardAtLastWave < 0) wardAtLastWave = battle.ward;
      defeatedInLastWave += shots.filter((shot) => shot.defeated).length;
    }
  }

  expect(battle.phase).toBe('lost');
  // The first waves are held; the horde of the last wave breaks the ward, though some of it falls.
  expect(wardAtLastWave).toBe(RAID_LEVEL.ward);
  expect(defeatedInLastWave).toBeGreaterThan(0);
});

it('has no invulnerable enemies', () => {
  for (const wave of RAID_LEVEL.waves) {
    for (const squad of wave) expect(squad.kind.health, squad.kind.id).toBeLessThanOrEqual(1000);
  }
});
