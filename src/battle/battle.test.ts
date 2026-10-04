import { describe, expect, it } from 'vitest';
import { practiceLevel } from '../content/library';
import { Battle } from './battle';
import type { EnemyKind, Level, TowerKind } from './level';
import { pointAt } from './path';

const BUG: EnemyKind = { id: 'bug', speed: 100, wardDamage: 1, health: 20, ink: 5 };
const BEETLE: EnemyKind = { id: 'beetle', speed: 50, wardDamage: 3, health: 100, ink: 40 };
const BOW: TowerKind = { id: 'bow', keyword: 'jagd', cost: 30, range: 60, damage: 10, cooldownMs: 500 };

/** Straight path of 300 px; a bug needs 3 s, a beetle 6 s. */
function level(overrides: Partial<Level> = {}): Level {
  return {
    id: 'test',
    path: [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 100 },
    ],
    sites: [
      { id: 'near', x: 100, y: 40 },
      { id: 'far', x: 100, y: 400 },
    ],
    ward: 5,
    ink: 50,
    waves: [
      [{ kind: BUG, count: 2, spacingMs: 1000 }],
      [{ kind: BEETLE, count: 1, spacingMs: 1000 }],
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
    const battle = new Battle(level({ ward: 2, waves: [[{ kind: BEETLE, count: 3, spacingMs: 500 }]] }));
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

  it('plays the last practice battle to the end when nothing stops the enemies', () => {
    const battle = new Battle({ ...practiceLevel(3), ward: 1000 });
    while (battle.phase !== 'won') {
      battle.endFlood();
      run(battle, 1000);
    }
    const enemies = practiceLevel(3)
      .waves.flat()
      .reduce((sum, squad) => sum + squad.count * squad.kind.wardDamage, 0);
    expect(battle.ward).toBe(1000 - enemies);
  });
});

describe('towers', () => {
  it('costs ink and needs a free site', () => {
    const battle = new Battle(level());
    const [near, far] = battle.level.sites;

    expect(battle.build(near!, BOW)).toBe(true);
    expect(battle.ink).toBe(20);
    expect(battle.build(near!, BOW)).toBe(false);
    expect(battle.build(far!, BOW)).toBe(false);
    expect(battle.towers).toHaveLength(1);
    expect(battle.ink).toBe(20);
  });

  it('attacks enemies in range and turns the defeated into ink', () => {
    const battle = new Battle(level({ waves: [[{ kind: BUG, count: 1, spacingMs: 1000 }]] }));
    battle.build(battle.level.sites[0]!, BOW);
    battle.endFlood();

    const shots = Array.from({ length: 12 }, () => battle.update(100).shots).flat();

    expect(shots.map((shot) => [shot.health, shot.defeated])).toEqual([
      [10, false],
      [0, true],
    ]);
    expect(battle.enemies).toEqual([]);
    expect(battle.ink).toBe(25);
    expect(battle.ward).toBe(5);
    expect(battle.phase).toBe('won');
  });

  it('leaves enemies out of range alone and reports them at the ward circle', () => {
    const battle = new Battle(level({ waves: [[{ kind: BUG, count: 1, spacingMs: 1000 }]] }));
    battle.build(battle.level.sites[1]!, BOW);
    battle.endFlood();

    const steps = Array.from({ length: 40 }, () => battle.update(100));

    expect(steps.flatMap((step) => step.shots)).toEqual([]);
    expect(steps.flatMap((step) => step.arrived.map((enemy) => enemy.kind))).toEqual([BUG]);
    expect(battle.ward).toBe(4);
  });

  it('aims at the enemy furthest along the path when several are in range', () => {
    const battle = new Battle(level({ waves: [[{ kind: BEETLE, count: 2, spacingMs: 400 }]] }));
    battle.build(battle.level.sites[0]!, BOW);
    battle.endFlood();

    // Run until the second shot: by then both beetles are in range.
    const shots = [];
    while (shots.length < 2) shots.push(...battle.update(100).shots);

    const [leader, follower] = battle.enemies;
    expect(Math.hypot(battle.positionOf(follower!).x - 100, battle.positionOf(follower!).y - 40)).toBeLessThanOrEqual(60);
    expect(shots.map((shot) => shot.enemy.id)).toEqual([leader!.id, leader!.id]);
  });
});

describe('squads', () => {
  it('enter on their own schedules within one wave', () => {
    const battle = new Battle(
      level({
        waves: [
          [
            { kind: BUG, count: 2, spacingMs: 1000 },
            { kind: BEETLE, count: 1, spacingMs: 1000, delayMs: 500 },
          ],
        ],
      }),
    );
    battle.endFlood();

    run(battle, 300);
    expect(battle.enemies.map((enemy) => enemy.kind.id)).toEqual(['bug']);
    run(battle, 400);
    expect(battle.enemies.map((enemy) => enemy.kind.id)).toEqual(['bug', 'beetle']);
    run(battle, 500);
    expect(battle.enemies.map((enemy) => enemy.kind.id)).toEqual(['bug', 'beetle', 'bug']);
  });
});
