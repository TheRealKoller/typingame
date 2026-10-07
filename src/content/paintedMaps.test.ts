import { describe, expect, it } from 'vitest';
import manifest from '../assets/maps/maps.json';
import { CELLAR, placeMap, RUIN, WORLD_POINTS } from './journey';
import { ARCHIVE, COURTYARD, READING_ROOM } from './library';
import { paintings } from './paintedMaps';

/** Every map is painted three times, so a place or practice map looks different when it comes round again. */
const PAINTINGS_PER_MAP = 3;
const FIXED = [READING_ROOM, ARCHIVE, COURTYARD, RUIN, CELLAR];
const GENERATED = WORLD_POINTS.filter((point) => !point.map);

describe('painted maps', () => {
  // A painting shows paths and sites where they were when it was painted: a later change to a map or to the generator
  // makes it stale, and it has to be painted again.
  it.each(FIXED)('paint $id three times, as it is now', (map) => {
    const shown = paintings(map.id);
    expect(shown).toHaveLength(PAINTINGS_PER_MAP);
    for (const painting of shown) {
      expect(painting.seed, painting.file).toBeNull();
      expect(painting.paths, painting.file).toEqual(map.paths);
      expect(painting.sites, painting.file).toEqual(map.sites);
    }
  });

  it.each(GENERATED)('paint three maps generated for $id, each as its seed generates it now', (point) => {
    const shown = paintings(point.id);
    expect(shown).toHaveLength(PAINTINGS_PER_MAP);
    expect(new Set(shown.map((painting) => painting.seed)).size).toBe(PAINTINGS_PER_MAP);
    for (const painting of shown) {
      const map = placeMap(point, painting);
      expect(painting.paths, painting.file).toEqual(map.paths);
      expect(painting.sites, painting.file).toEqual(map.sites);
    }
  });

  it('have an image for every painting and no image without one', () => {
    const listed: Readonly<Record<string, readonly { readonly file: string }[]>> = manifest;
    const files = Object.keys(import.meta.glob('../assets/maps/*.webp')).map((path) => path.slice('../assets/maps/'.length));
    expect(
      Object.values(listed)
        .flat()
        .map((painting) => painting.file)
        .sort(),
    ).toEqual(files.sort());
  });
});
