import { describe, expect, it } from 'vitest';
import { LEVEL_1 } from '../content/level1';
import { Battle } from './battle';
import type { EnemyKind, Level } from './level';
import { pointAt } from './path';

const BUG: EnemyKind = { id: 'bug', speed: 100, wardDamage: 1 };
const BEETLE: EnemyKind = { id: 'beetle', speed: 50, wardDamage: 3 };

/** Straight path of 300 px; a bug needs 3 s, a beetle 6 s. */
function level(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test',
    path: [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
    ],
    sites: [],
    ward: 5,
    ink: 50,
    waves: [
      { kind: BUG, count: 2, spacingMs: 1000 },
      { kind: BEETLE, count: 1, spacingMs: 1000 },
    ],
    ...overrides,
  };
}

function run(battle: Battle, ms: number, stepMs = 100): void {
  for (let t = 0; t < ms; t += stepMs) battle.update(stepMs);
}

describe('pointAt', () => {
  it('follows the path around its corners and stops at the end', () => {
    const path = level().path;
    expect(pointAt(path, 150)).toEqual({ x: 150, y: 0 });
    expect(pointAt(path, 250)).toEqual({ x: 200, y: 50 });
    expect(pointAt(path, 999)).toEqual({ x: 200, y: 100 });
  });
});

describe('Battle', () => {
  it('starts in a flood where nothing advances', () => {
    const battle = new Battle(level());
    run(battle, 10_000);

    expect(battle.phase).toBe('flood');
    expect(battle.enemies).toEqual([]);
    expect(battle.wave).toBe(0);
    expect(battle.ink).toBe(50);
  });

  it('lets the wave enter one spacing apart once the flood ends', () => {
    const battle = new Battle(level());
    battle.endFlood();

    run(battle, 500);
    expect(battle.phase).toBe('ebb');
    expect(battle.enemies.map((enemy) => enemy.distance)).toEqual([50]);

    run(battle, 1000);
    expect(battle.enemies.map((enemy) => Math.round(enemy.distance))).toEqual([150, 50]);
    expect(battle.positionOf(battle.enemies[0]!)).toEqual({ x: 150, y: 0 });
  });

  it('weakens the ward for every enemy that reaches the end', () => {
    const battle = new Battle(level());
    battle.endFlood();

    run(battle, 3000);
    expect(battle.ward).toBe(4);
    run(battle, 1000);
    expect(battle.ward).toBe(3);
  });

  it('returns to the flood after a wave and is won after the last one', () => {
    const battle = new Battle(level({ ward: 10 }));
    battle.endFlood();
    run(battle, 4000);

    expect(battle.phase).toBe('flood');
    expect(battle.wave).toBe(1);
    expect(battle.enemies).toEqual([]);

    battle.endFlood();
    run(battle, 6000);
    expect(battle.phase).toBe('won');
    expect(battle.ward).toBe(5);
  });

  it('is lost when the ward breaks, and nothing moves afterwards', () => {
    const battle = new Battle(level({ ward: 2, waves: [{ kind: BEETLE, count: 3, spacingMs: 500 }] }));
    battle.endFlood();
    run(battle, 6000);

    expect(battle.phase).toBe('lost');
    expect(battle.ward).toBe(0);
    const before = battle.enemies.map((enemy) => enemy.distance);
    run(battle, 1000);
    expect(battle.enemies.map((enemy) => enemy.distance)).toEqual(before);
  });

  it('ignores ending a flood that is not running', () => {
    const battle = new Battle(level());
    battle.endFlood();
    run(battle, 500);
    battle.endFlood();
    run(battle, 1000);

    expect(battle.enemies).toHaveLength(2);
  });

  it('plays the first level to the end when nothing stops the enemies', () => {
    const battle = new Battle({ ...LEVEL_1, ward: 1000 });
    while (battle.phase !== 'won') {
      battle.endFlood();
      run(battle, 1000);
    }
    const enemies = LEVEL_1.waves.reduce((sum, wave) => sum + wave.count * wave.kind.wardDamage, 0);
    expect(battle.ward).toBe(1000 - enemies);
  });
});
