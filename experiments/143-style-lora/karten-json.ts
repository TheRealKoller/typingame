// Prints battle maps as JSON for karten.py, which sketches them and has FLUX.2 klein paint them (#143).
// Run: node -e "import('vite').then((v) => v.runnerImport('./experiments/143-style-lora/karten-json.ts'))" -- <map>...
// A map is `<place>:<seed>:<paths>` for a generated one (e.g. `smoke:3:1`) or the id of a fixed one (`ruin`).
import { CELLAR, RUIN, WORLD_POINTS } from '../../src/content/journey';
import { ARCHIVE, COURTYARD, READING_ROOM, SHELF_BOTTOM } from '../../src/content/library';
import { generateAshMap, LAYOUT, seededRandom } from '../../src/content/mapgen';

// The project has no Node types; only these two are used.
declare const process: { argv: string[]; stdout: { write(text: string): void } };

const FIXED = Object.fromEntries([READING_ROOM, ARCHIVE, COURTYARD, RUIN, CELLAR].map((map) => [map.id, map]));

// `node -e` puts the script's arguments after its own path, with or without the `--`.
const maps = process.argv
  .filter((arg) => /^[a-z-]+(:\d+:\d)?$/.test(arg) && arg !== 'import')
  .map((arg) => {
    const [place, seed, paths] = arg.split(':');
    const fixed = FIXED[place!];
    if (fixed) return { key: place, ...fixed };
    const point = WORLD_POINTS.find((candidate) => candidate.id === place);
    if (!point) throw new Error(`unknown place ${place}`);
    return { key: arg.replaceAll(':', '-'), ...generateAshMap(seededRandom(Number(seed)), point.id, point.name, Number(paths)) };
  });
process.stdout.write(JSON.stringify({ layout: { ...LAYOUT, shelfBottom: SHELF_BOTTOM }, maps }));
