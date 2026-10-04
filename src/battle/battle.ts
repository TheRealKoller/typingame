import type { BuildSite, EnemyKind, Level, TowerKind } from './level';
import { pathLength, pointAt, type Point } from './path';

/**
 * flood: the ward is strong, the enemies stay back and the player builds.
 * ebb: the ward is weak and the current wave advances.
 */
export type Phase = 'flood' | 'ebb' | 'won' | 'lost';

export interface Enemy {
  readonly id: number;
  readonly kind: EnemyKind;
  /** Pixels travelled along the path. */
  distance: number;
  health: number;
}

export interface Tower {
  readonly site: BuildSite;
  readonly kind: TowerKind;
  /** Time until the tower can attack again. */
  cooldownMs: number;
}

/** One attack of a tower in an `update` step, for the scene to show. */
export interface Shot {
  readonly tower: Tower;
  readonly enemy: Enemy;
  /** Health of the enemy right after this hit; the enemy itself may take more hits before the scene shows this one. */
  readonly health: number;
  readonly defeated: boolean;
}

/** What happened in one `update` step. */
export interface Step {
  readonly shots: readonly Shot[];
  /** Enemies that reached the ward circle and weakened it. */
  readonly arrived: readonly Enemy[];
}

const NOTHING: Step = { shots: [], arrived: [] };

/**
 * One running level without rendering. Time advances only through `update`,
 * so the battle runs the same in the game and in tests.
 */
export class Battle {
  readonly level: Level;
  readonly #length: number;
  #phase: Phase = 'flood';
  #wave = 0;
  #ward: number;
  #ink: number;
  #enemies: Enemy[] = [];
  readonly #towers: Tower[] = [];
  #nextId = 1;
  /** Enemies of each squad of the current wave that have entered so far. */
  #spawned: number[] = [];
  /** Time since the current wave began. */
  #waveMs = 0;

  constructor(level: Level) {
    if (level.path.length < 2) throw new Error(`level ${level.id}: the path needs at least two points`);
    if (level.waves.length === 0) throw new Error(`level ${level.id}: there are no waves`);
    this.level = level;
    this.#length = pathLength(level.path);
    this.#ward = level.ward;
    this.#ink = level.ink;
  }

  get phase(): Phase {
    return this.#phase;
  }

  /** Index of the wave that advances in the current ebb, or the next one during a flood. */
  get wave(): number {
    return this.#wave;
  }

  get ward(): number {
    return this.#ward;
  }

  get ink(): number {
    return this.#ink;
  }

  get enemies(): readonly Enemy[] {
    return this.#enemies;
  }

  get towers(): readonly Tower[] {
    return this.#towers;
  }

  positionOf(enemy: Enemy): Point {
    return pointAt(this.level.path, enemy.distance);
  }

  towerAt(site: BuildSite): Tower | undefined {
    return this.#towers.find((tower) => tower.site.id === site.id);
  }

  /** Builds `kind` on `site` if the site is free, there is enough ink and the level still runs. */
  build(site: BuildSite, kind: TowerKind): boolean {
    if (this.#phase === 'won' || this.#phase === 'lost') return false;
    if (this.towerAt(site) || this.#ink < kind.cost) return false;
    this.#ink -= kind.cost;
    this.#towers.push({ site, kind, cooldownMs: 0 });
    return true;
  }

  /** Ends the flood when the player is ready; the next wave starts to advance. */
  endFlood(): void {
    if (this.#phase !== 'flood') return;
    this.#phase = 'ebb';
    this.#spawned = [];
    this.#waveMs = 0;
  }

  /** Advances the battle by `deltaMs`. */
  update(deltaMs: number): Step {
    if (this.#phase !== 'ebb') return NOTHING;
    const wave = this.level.waves[this.#wave];
    if (!wave) return NOTHING;

    // Each squad sends its first enemy after its delay, the others one spacing apart.
    wave.forEach((squad, i) => {
      let spawned = this.#spawned[i] ?? 0;
      while (spawned < squad.count && this.#waveMs >= (squad.delayMs ?? 0) + spawned * squad.spacingMs) {
        this.#enemies.push({ id: this.#nextId++, kind: squad.kind, distance: 0, health: squad.kind.health });
        spawned++;
      }
      this.#spawned[i] = spawned;
    });
    this.#waveMs += deltaMs;

    for (const enemy of this.#enemies) enemy.distance += (enemy.kind.speed * deltaMs) / 1000;
    const arrived = this.#enemies.filter((enemy) => enemy.distance >= this.#length);
    this.#enemies = this.#enemies.filter((enemy) => enemy.distance < this.#length);
    for (const enemy of arrived) this.#ward = Math.max(0, this.#ward - enemy.kind.wardDamage);

    const shots = this.#attack(deltaMs);

    if (this.#ward === 0) {
      this.#phase = 'lost';
    } else if (wave.every((squad, i) => this.#spawned[i] === squad.count) && this.#enemies.length === 0) {
      this.#wave++;
      this.#phase = this.#wave < this.level.waves.length ? 'flood' : 'won';
    }
    return { shots, arrived };
  }

  /** Every ready tower hits the enemy in range that is furthest along the path. */
  #attack(deltaMs: number): Shot[] {
    const shots: Shot[] = [];
    for (const tower of this.#towers) {
      tower.cooldownMs = Math.max(0, tower.cooldownMs - deltaMs);
      if (tower.cooldownMs > 0) continue;
      const target = this.#enemies
        .filter((enemy) => {
          const at = this.positionOf(enemy);
          return Math.hypot(at.x - tower.site.x, at.y - tower.site.y) <= tower.kind.range;
        })
        .reduce<Enemy | undefined>((best, enemy) => (best && best.distance >= enemy.distance ? best : enemy), undefined);
      if (!target) continue;

      tower.cooldownMs = tower.kind.cooldownMs;
      target.health -= tower.kind.damage;
      const defeated = target.health <= 0;
      if (defeated) {
        this.#ink += target.kind.ink;
        this.#enemies = this.#enemies.filter((enemy) => enemy !== target);
      }
      shots.push({ tower, enemy: target, health: Math.max(0, target.health), defeated });
    }
    return shots;
  }
}
