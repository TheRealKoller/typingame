import type { BuildSite, EnemyKind, Level, Spell, TowerKind } from './level';
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
  /** Glows and carries a word; typing it strikes the enemy down (see `strike`). */
  readonly marked: boolean;
  /** Time left at reduced speed after a slowing hit, and the factor that applies meanwhile. */
  slowMs: number;
  slowFactor: number;
  /** Time left poisoned, and the health it loses per second meanwhile. */
  poisonMs: number;
  poisonDps: number;
}

export interface Tower {
  readonly site: BuildSite;
  /** Changes when the tower is upgraded. */
  kind: TowerKind;
  /** Time until the tower can attack again. */
  cooldownMs: number;
  /** Shots fired so far, for towers whose every n-th shot is critical. */
  shots: number;
  /** Enemies this tower has hit, for towers whose first hit is critical. */
  readonly struck: Set<number>;
}

/** One enemy hit by an attack. */
export interface Hit {
  readonly enemy: Enemy;
  /** Health of the enemy right after this hit; the enemy itself may take more hits before the scene shows this one. */
  readonly health: number;
  readonly defeated: boolean;
  /** Dealt more than the tower's usual damage. */
  readonly critical?: boolean;
}

/** One attack of a tower in an `update` step, for the scene to show: the target, and others caught in the splash. */
export interface Shot extends Hit {
  readonly tower: Tower;
  readonly splash: readonly Hit[];
}

/** What happened in one `update` step. */
export interface Step {
  readonly shots: readonly Shot[];
  /** Enemies that reached the ward circle and weakened it. */
  readonly arrived: readonly Enemy[];
  /** Enemies defeated by poison in this step. */
  readonly withered: readonly Hit[];
}

const NOTHING: Step = { shots: [], arrived: [], withered: [] };

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
  /** Time until each spell cast so far can be cast again, by spell id. */
  readonly #spellCooldowns = new Map<string, number>();

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
    this.#towers.push({ site, kind, cooldownMs: 0, shots: 0, struck: new Set() });
    return true;
  }

  /** Upgrades the tower on `site` to its next stage if there is one, there is enough ink and the level still runs. */
  upgrade(site: BuildSite): boolean {
    const tower = this.towerAt(site);
    const next = tower?.kind.upgrade;
    if (!tower || !next || this.#phase === 'won' || this.#phase === 'lost' || this.#ink < next.cost) return false;
    this.#ink -= next.cost;
    tower.kind = next;
    return true;
  }

  /** Turns the tower on `site` into `kind` for `cost` ink, if there is enough and the level still runs. */
  reshape(site: BuildSite, kind: TowerKind, cost: number): boolean {
    const tower = this.towerAt(site);
    if (!tower || this.#phase === 'won' || this.#phase === 'lost' || this.#ink < cost) return false;
    this.#ink -= cost;
    tower.kind = kind;
    return true;
  }

  /**
   * Hits a marked enemy with a typed word: it falls at once, or takes its
   * kind's `wordDamage`. A defeated enemy leaves its ink. False if it is not
   * marked or already gone.
   */
  strike(enemy: Enemy): boolean {
    if (!enemy.marked || !this.#enemies.includes(enemy)) return false;
    enemy.health = Math.max(0, enemy.health - (enemy.kind.wordDamage ?? enemy.health));
    if (enemy.health === 0) {
      this.#ink += enemy.kind.ink;
      this.#enemies = this.#enemies.filter((other) => other !== enemy);
    }
    return true;
  }

  /** Time until `spell` can be cast again; 0 when it is ready. */
  spellReadyIn(spell: Spell): number {
    return this.#spellCooldowns.get(spell.id) ?? 0;
  }

  /**
   * Casts `spell` on every enemy on the path while a wave advances; the
   * defeated leave their ink. Null if it is not ready or no wave advances.
   */
  cast(spell: Spell): Hit[] | null {
    if (this.#phase !== 'ebb' || this.spellReadyIn(spell) > 0) return null;
    this.#spellCooldowns.set(spell.id, spell.cooldownMs);
    return [...this.#enemies].map((enemy) => this.#damage(enemy, spell.damage));
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
        // Every `markEvery`-th enemy of a squad glows, starting with the first.
        const marked = squad.markEvery !== undefined && spawned % squad.markEvery === 0;
        this.#enemies.push({ id: this.#nextId++, kind: squad.kind, distance: 0, health: squad.kind.health, marked, slowMs: 0, slowFactor: 1, poisonMs: 0, poisonDps: 0 });
        spawned++;
      }
      this.#spawned[i] = spawned;
    });
    this.#waveMs += deltaMs;
    for (const [id, left] of this.#spellCooldowns) this.#spellCooldowns.set(id, Math.max(0, left - deltaMs));

    for (const enemy of this.#enemies) {
      // The slowed part of the step runs at the reduced speed, the rest at full speed.
      const slowed = Math.min(enemy.slowMs, deltaMs);
      enemy.distance += (enemy.kind.speed * (slowed * enemy.slowFactor + (deltaMs - slowed))) / 1000;
      enemy.slowMs -= slowed;
    }
    const withered = this.#poison(deltaMs);
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
    return { shots, arrived, withered };
  }

  /** Poisoned enemies lose health over the step; returns those it defeats. */
  #poison(deltaMs: number): Hit[] {
    const withered: Hit[] = [];
    for (const enemy of [...this.#enemies]) {
      if (enemy.poisonMs <= 0) continue;
      const poisoned = Math.min(enemy.poisonMs, deltaMs);
      enemy.poisonMs -= poisoned;
      const hit = this.#damage(enemy, (enemy.poisonDps * poisoned) / 1000);
      if (hit.defeated) withered.push(hit);
    }
    return withered;
  }

  /**
   * Every ready tower hits the enemy in range that is furthest along the path;
   * a splashing tower hits every enemy near the target as well.
   */
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
      tower.shots++;
      const { splash } = tower.kind;
      const center = this.positionOf(target);
      const others =
        splash === undefined
          ? []
          : this.#enemies.filter((enemy) => {
              if (enemy === target) return false;
              const at = this.positionOf(enemy);
              return Math.hypot(at.x - center.x, at.y - center.y) <= splash;
            });
      const [hit, ...splashed] = [target, ...others].map((enemy) => this.#hit(enemy, tower));
      shots.push({ ...hit!, tower, splash: splashed });
    }
    return shots;
  }

  /** `tower` hits `enemy`: damage through its armor, maybe critical, maybe a slowdown or poison. */
  #hit(enemy: Enemy, tower: Tower): Hit {
    const { kind } = tower;
    if (kind.slow) {
      enemy.slowMs = kind.slow.durationMs;
      enemy.slowFactor = kind.slow.factor;
    }
    if (kind.poison) {
      enemy.poisonMs = kind.poison.durationMs;
      enemy.poisonDps = kind.poison.dps;
    }
    let factor = 1;
    if (kind.critFirst !== undefined && !tower.struck.has(enemy.id)) factor = Math.max(factor, kind.critFirst);
    if (kind.critEvery && tower.shots % kind.critEvery.every === 0) factor = Math.max(factor, kind.critEvery.factor);
    tower.struck.add(enemy.id);
    const hit = this.#damage(enemy, factor * kind.damage * (1 - (enemy.kind.armor ?? 0)));
    return factor > 1 ? { ...hit, critical: true } : hit;
  }

  /** `enemy` loses `amount` health; a defeated enemy leaves its ink and the battle. */
  #damage(enemy: Enemy, amount: number): Hit {
    enemy.health -= amount;
    const defeated = enemy.health <= 0;
    if (defeated) {
      this.#ink += enemy.kind.ink;
      this.#enemies = this.#enemies.filter((other) => other !== enemy);
    }
    return { enemy, health: Math.max(0, enemy.health), defeated };
  }
}
