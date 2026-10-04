import type { Point } from './path';

/** A kind of enemy; levels refer to it by `id`. */
export interface EnemyKind {
  readonly id: string;
  /** Pixels per second along the path. */
  readonly speed: number;
  /** Ward strength lost when one enemy of this kind reaches the ward circle. */
  readonly wardDamage: number;
}

/** Enemies that advance together during one ebb. */
export interface Wave {
  readonly kind: EnemyKind;
  readonly count: number;
  /** Time between two enemies entering the path. */
  readonly spacingMs: number;
}

/** A place next to the path where a tower can be built. */
export interface BuildSite {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}

/** One level as data: the map, the ward circle and the waves. */
export interface Level {
  readonly id: string;
  /** Waypoints from where the enemies enter to the ward circle at the end. */
  readonly path: readonly Point[];
  readonly sites: readonly BuildSite[];
  /** Strength of the ward circle at the start; the level is lost when it drops to zero. */
  readonly ward: number;
  /** Ink at the start. */
  readonly ink: number;
  readonly waves: readonly Wave[];
}
