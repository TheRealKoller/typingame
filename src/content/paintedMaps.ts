import type { BuildSite } from '../battle/level';
import type { Point } from '../battle/path';
import manifest from '../assets/maps/maps.json';
import type { BattleMap } from './library';

/**
 * One painting of a battle map (#151): the battle area above the desk, 1280 × 470 px, with ground, paths, props,
 * wall shelves and the build plots. The scene draws only what is in play on top of it.
 */
export interface Painting {
  /** Image file in `src/assets/maps/`. */
  readonly file: string;
  /** Where the image is loaded from. */
  readonly url: string;
  /** For a generated place, the seed of `seededRandom` the painted map was generated from; null for a fixed map. */
  readonly seed: number | null;
  /** Paths and sites of the map when it was painted; `paintedMaps.test.ts` checks they still match. */
  readonly paths: readonly (readonly Point[])[];
  readonly sites: readonly BuildSite[];
}

/** A battle map and the painting it is fought on. */
export interface PaintedMap {
  readonly map: BattleMap;
  readonly painting: Painting;
}

/** The manifest of `src/assets/maps/`: the paintings of each map, by the fixed map's id or the generated place's id. */
const MANIFEST: Readonly<Record<string, readonly Omit<Painting, 'url'>[]>> = manifest;

const URLS = import.meta.glob<string>('../assets/maps/*.webp', { eager: true, query: '?url', import: 'default' });

/** The paintings of the fixed map or generated place `id`; fails only for that map if it has none or a file is missing. */
export function paintings(id: string): Painting[] {
  const entries = MANIFEST[id];
  if (!entries?.length) throw new Error(`no painting of map ${id}`);
  return entries.map((entry) => {
    const url = URLS[`../assets/maps/${entry.file}`];
    if (url === undefined) throw new Error(`painting ${entry.file} of map ${id} is missing`);
    return { ...entry, url };
  });
}
