import { describe, expect, it } from 'vitest';
import { practiceLevel } from '../content/library';
import { Battle } from './battle';
import type { EnemyKind, Level, Spell, TowerKind } from './level';
import { pointAt } from './path';

const BUG: EnemyKind = { id: 'bug', speed: 100, wardDamage: 1, health: 20, ink: 5 };
const BEETLE: EnemyKind = { id: 'beetle', speed: 50, wardDamage: 3, health: 100, ink: 40 };
const BOW: TowerKind = { id: 'bow', name: 'Bogen', keyword: 'jagd', cost: 30, range: 60, damage: 10, cooldownMs: 500 };

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

  it('splashes the enemies near the target, not those further away, and collects ink for all defeated', () => {
    // Three bugs 20 px apart along the path; the splash reaches 30 px around the leading one.
    const blot: TowerKind = { ...BOW, range: 500, damage: 20, cooldownMs: 10_000, splash: 30 };
    const battle = new Battle(level({ waves: [[{ kind: BUG, count: 3, spacingMs: 200 }]] }));
    battle.build(battle.level.sites[1]!, blot);
    battle.endFlood();
    // Bring all three onto the path before the tower is ready to fire.
    battle.towers[0]!.cooldownMs = 600;

    const shots = Array.from({ length: 6 }, () => battle.update(100).shots).flat();

    expect(shots).toHaveLength(1);
    const [shot] = shots;
    expect([shot!.defeated, shot!.splash.map((hit) => hit.defeated)]).toEqual([true, [true]]);
    expect(battle.enemies).toHaveLength(1);
    expect(battle.ink).toBe(50 - blot.cost + 2 * BUG.ink);
  });

  it('slows the enemies it hits for a while, then they walk at full speed again', () => {
    const chill: TowerKind = { ...BOW, range: 500, damage: 1, cooldownMs: 100_000, slow: { factor: 0.5, durationMs: 1000 } };
    const battle = new Battle(level({ waves: [[{ kind: BEETLE, count: 1, spacingMs: 1000 }]] }));
    battle.build(battle.level.sites[1]!, chill);
    battle.endFlood();

    battle.update(100); // enters and is hit at once
    const enemy = battle.enemies[0]!;
    const start = enemy.distance;
    run(battle, 1000);
    const slowed = enemy.distance - start;
    run(battle, 1000);
    const free = enemy.distance - start - slowed;

    expect(slowed).toBeCloseTo(BEETLE.speed / 2);
    expect(free).toBeCloseTo(BEETLE.speed);
  });

  it('poisons the enemies it hits: they lose health over time through armor, and the poison can defeat them', () => {
    const ARMORED: EnemyKind = { ...BEETLE, armor: 0.9 };
    const venom: TowerKind = { ...BOW, range: 500, damage: 0, cooldownMs: 100_000, poison: { dps: 10, durationMs: 2000 } };
    const battle = new Battle(level({ waves: [[{ kind: ARMORED, count: 1, spacingMs: 1000 }]] }));
    battle.build(battle.level.sites[1]!, venom);
    battle.endFlood();

    battle.update(100); // enters and is hit at once
    const enemy = battle.enemies[0]!;
    run(battle, 3000);

    // Two seconds of poison at 10 per second, and nothing after it wore off.
    expect(enemy.health).toBeCloseTo(ARMORED.health - 20);

    const frail = new Battle(level({ waves: [[{ kind: BUG, count: 1, spacingMs: 1000 }]] }));
    frail.build(frail.level.sites[1]!, { ...venom, poison: { dps: 40, durationMs: 2000 } });
    frail.endFlood();
    const withered = Array.from({ length: 10 }, () => frail.update(100).withered).flat();

    expect(withered.map((hit) => [hit.enemy.kind, hit.defeated])).toEqual([[BUG, true]]);
    expect(frail.ink).toBe(50 - BOW.cost + BUG.ink);
  });

  it('hits critically on its first hit of each enemy, or on every n-th shot', () => {
    const dawn: TowerKind = { ...BOW, range: 500, damage: 4, cooldownMs: 100, critFirst: 3 };
    const battle = new Battle(level({ waves: [[{ kind: BUG, count: 2, spacingMs: 1000 }]] }));
    battle.build(battle.level.sites[1]!, dawn);
    battle.endFlood();
    const shots = Array.from({ length: 15 }, () => battle.update(100).shots).flat();
    // The first bug takes 12, then 4 a shot; the second one, entering after 1 s, again starts with 12.
    expect(shots.map((shot) => [shot.health, shot.critical ?? false])).toEqual([
      [8, true],
      [4, false],
      [0, false],
      [8, true],
      [4, false],
      [0, false],
    ]);

    const midnight: TowerKind = { ...BOW, range: 500, damage: 4, cooldownMs: 100, critEvery: { every: 3, factor: 2 } };
    const counted = new Battle(level({ waves: [[{ kind: BEETLE, count: 1, spacingMs: 1000 }]] }));
    counted.build(counted.level.sites[1]!, midnight);
    counted.endFlood();
    const counts = Array.from({ length: 6 }, () => counted.update(100).shots).flat();
    expect(counts.map((shot) => shot.critical ?? false)).toEqual([false, false, true, false, false, true]);
  });

  it('reshapes a built tower for the given ink, and only a built one', () => {
    const battle = new Battle(level({ ink: 100 }));
    const [near, far] = battle.level.sites;
    battle.build(near!, BOW);
    const swift: TowerKind = { ...BOW, cooldownMs: 300, cost: 999 };

    expect(battle.reshape(far!, swift, 10)).toBe(false);
    expect(battle.reshape(near!, swift, 80)).toBe(false);
    expect(battle.reshape(near!, swift, 40)).toBe(true);
    expect([battle.towerAt(near!)!.kind, battle.ink]).toEqual([swift, 100 - BOW.cost - 40]);
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

describe('glowing enemies', () => {
  it('mark every n-th enemy of a squad, starting with the first', () => {
    const battle = new Battle(level({ waves: [[{ kind: BUG, count: 5, spacingMs: 100, markEvery: 2 }]] }));
    battle.endFlood();
    run(battle, 500);

    expect(battle.enemies.map((enemy) => enemy.marked)).toEqual([true, false, true, false, true]);
  });

  it('are struck down at once for their ink; unmarked or gone ones are not', () => {
    const battle = new Battle(level({ waves: [[{ kind: BEETLE, count: 2, spacingMs: 100, markEvery: 2 }]] }));
    battle.endFlood();
    run(battle, 200);
    const [marked, plain] = battle.enemies;

    expect(battle.strike(plain!)).toBe(false);
    expect(battle.strike(marked!)).toBe(true);
    expect(battle.enemies).toEqual([plain]);
    expect(battle.ink).toBe(50 + BEETLE.ink);
    expect(battle.strike(marked!)).toBe(false);
  });
});

describe('tough enemies', () => {
  const SHELLED: EnemyKind = { ...BEETLE, armor: 0.75, wordDamage: 40 };

  it('turn aside part of every tower hit with their armor', () => {
    const battle = new Battle(level({ waves: [[{ kind: SHELLED, count: 1, spacingMs: 1000 }]] }));
    battle.build(battle.level.sites[1]!, { ...BOW, range: 500, cooldownMs: 100_000 });
    battle.endFlood();

    const [shot] = battle.update(100).shots;

    expect(shot!.health).toBe(SHELLED.health - BOW.damage * 0.25);
  });

  it('are only wounded by a typed word, keep their glow, and fall to enough words for their ink', () => {
    const battle = new Battle(level({ ink: 0, waves: [[{ kind: SHELLED, count: 1, spacingMs: 1000, markEvery: 1 }]] }));
    battle.endFlood();
    battle.update(100);
    const enemy = battle.enemies[0]!;

    expect(battle.strike(enemy)).toBe(true);
    expect([enemy.health, battle.enemies]).toEqual([60, [enemy]]);
    battle.strike(enemy);
    battle.strike(enemy);

    expect(battle.enemies).toEqual([]);
    expect(battle.ink).toBe(SHELLED.ink);
  });
});

describe('spells', () => {
  const RAIN: Spell = { id: 'rain', name: 'Regen', word: 'regen', damage: 20, cooldownMs: 5000, cost: 0 };

  it('hit every enemy on the path through its armor, during an ebb only, then need time to return', () => {
    const shelled: EnemyKind = { ...BEETLE, armor: 0.9 };
    const battle = new Battle(level({ ink: 0, waves: [[{ kind: BUG, count: 1, spacingMs: 100 }, { kind: shelled, count: 1, spacingMs: 100 }]] }));
    expect(battle.cast(RAIN)).toBeNull();
    battle.endFlood();
    battle.update(100);

    const hits = battle.cast(RAIN)!;

    expect(hits.map((hit) => [hit.enemy.kind.id, hit.health, hit.defeated])).toEqual([
      ['bug', 0, true],
      ['beetle', shelled.health - 20, false],
    ]);
    expect(battle.ink).toBe(BUG.ink);
    expect(battle.cast(RAIN)).toBeNull();
    run(battle, 4900);
    expect(battle.spellReadyIn(RAIN)).toBe(100);
    battle.update(100);
    expect(battle.spellReadyIn(RAIN)).toBe(0);
  });

  it('cost their ink, and are not cast without enough of it', () => {
    const battle = new Battle(level({ ink: 50, waves: [[{ kind: BEETLE, count: 1, spacingMs: 100 }]] }));
    battle.endFlood();
    battle.update(100);

    expect(battle.cast({ ...RAIN, cost: 60 })).toBeNull();
    expect([battle.ink, battle.enemies[0]!.health]).toEqual([50, BEETLE.health]);
    expect(battle.cast({ ...RAIN, cost: 40 })).not.toBeNull();
    expect(battle.ink).toBe(10);
  });
});
