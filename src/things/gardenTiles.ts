import tile0000 from '../assets/world/tile_0000.png';
import tile0001 from '../assets/world/tile_0001.png';
import tile0002 from '../assets/world/tile_0002.png';
import tile0016 from '../assets/world/tile_0016.png';
import tile0025 from '../assets/world/tile_0025.png';
import tile0028 from '../assets/world/tile_0028.png';
import tile0029 from '../assets/world/tile_0029.png';
import tile0040 from '../assets/world/tile_0040.png';
import tile0043 from '../assets/world/tile_0043.png';
import tile0129 from '../assets/world/tile_0129.png';
import { type RoomAsset } from './thing';

/** The world is drawn four times as large; interiors use eight (decision in #47). */
export const WORLD_ZOOM = 4;
/** Plain grass; the rooms scatter these over the whole screen. */
export const GRASS_KEYS = ['grass', 'grass2'];
/** Decoration scattered sparsely over the grass: a flower here, some stones there. */
export const DECOR_KEYS = ['grassFlower', 'grassSpeckled'];

/**
 * The tiles of the top-down world, all from Kenney's CC0 packs. Which one shows what was
 * read off the numbered sheets – see `src/assets/LICENSES.md`.
 */
export const GARDEN_TILES: readonly RoomAsset[] = [
  { key: 'grass', url: tile0000 },
  { key: 'grass2', url: tile0001 },
  { key: 'grassFlower', url: tile0002 },
  { key: 'grassSpeckled', url: tile0043 },
  { key: 'path', url: tile0025 },
  { key: 'soil', url: tile0040 },
  { key: 'tree', url: tile0016 },
  { key: 'fir', url: tile0028 },
  { key: 'mushroom', url: tile0029 },
  { key: 'axe', url: tile0129 },
];
