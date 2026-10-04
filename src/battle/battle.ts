import type { EnemyKind, Level } from './level';
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
}

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
  #nextId = 1;
  #spawned = 0;
  #sinceSpawnMs = 0;

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

  positionOf(enemy: Enemy): Point {
    return pointAt(this.level.path, enemy.distance);
  }

  /** Ends the flood when the player is ready; the next wave starts to advance. */
  endFlood(): void {
    if (this.#phase !== 'flood') return;
    this.#phase = 'ebb';
    this.#spawned = 0;
    this.#sinceSpawnMs = 0;
  }

  update(deltaMs: number): void {
    if (this.#phase !== 'ebb') return;
    const wave = this.level.waves[this.#wave];
    if (!wave) return;

    // The first enemy enters at once, the others one spacing apart.
    if (this.#spawned > 0) this.#sinceSpawnMs += deltaMs;
    while (this.#spawned < wave.count && (this.#spawned === 0 || this.#sinceSpawnMs >= wave.spacingMs)) {
      if (this.#spawned > 0) this.#sinceSpawnMs -= wave.spacingMs;
      this.#enemies.push({ id: this.#nextId++, kind: wave.kind, distance: 0 });
      this.#spawned++;
    }

    for (const enemy of this.#enemies) enemy.distance += (enemy.kind.speed * deltaMs) / 1000;
    const arrived = this.#enemies.filter((enemy) => enemy.distance >= this.#length);
    this.#enemies = this.#enemies.filter((enemy) => enemy.distance < this.#length);
    for (const enemy of arrived) this.#ward = Math.max(0, this.#ward - enemy.kind.wardDamage);

    if (this.#ward === 0) {
      this.#phase = 'lost';
    } else if (this.#spawned === wave.count && this.#enemies.length === 0) {
      this.#wave++;
      this.#phase = this.#wave < this.level.waves.length ? 'flood' : 'won';
    }
  }
}
