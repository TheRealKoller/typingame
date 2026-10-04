import type { Point } from './path';

/** A kind of enemy; levels refer to it by `id`. */
export interface EnemyKind {
  readonly id: string;
  /** Pixels per second along the path. */
  readonly speed: number;
  /** Ward strength lost when one enemy of this kind reaches the ward circle. */
  readonly wardDamage: number;
  readonly health: number;
  /** Ink left behind when an enemy of this kind is defeated. */
  readonly ink: number;
}

/** A kind of tower; it attacks on its own once built. */
export interface TowerKind {
  readonly id: string;
  /** Typed on a selected build site to build this tower there. */
  readonly keyword: string;
  /** Ink it costs to build. */
  readonly cost: number;
  /** Reach in pixels from the build site. */
  readonly range: number;
  readonly damage: number;
  /** Time between two attacks. */
  readonly cooldownMs: number;
}

/** Enemies of one kind within a wave, entering one after another. */
export interface Squad {
  readonly kind: EnemyKind;
  readonly count: number;
  /** Time between two enemies of this squad entering the path. */
  readonly spacingMs: number;
  /** Time after the wave begins until the first enemy of this squad enters; 0 if omitted. */
  readonly delayMs?: number;
  /** Every this many enemies, starting with the first, one glows and carries a word; none if omitted. */
  readonly markEvery?: number;
}

/** Squads that advance together during one ebb, each on its own schedule. */
export type Wave = readonly Squad[];

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
