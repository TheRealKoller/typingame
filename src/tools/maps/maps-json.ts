// Prints battle maps as JSON for paint_maps.py, which sketches them and has FLUX.2 klein paint them (#143, #151).
// Run: node -e "import('vite').then((v) => v.runnerImport('./src/tools/maps/maps-json.ts'))" -- <map>...
// A map is the id of a fixed map (`ruin`) or `<place>:<seed>` for a generated place (`smoke:3`), built by
// `generateAshMap(seededRandom(seed), …)` as the journey does. Without maps it lists what can be painted.
import { CELLAR, RUIN, WORLD_POINTS } from '../../content/journey';
import { ARCHIVE, COURTYARD, READING_ROOM, SHELF_BOTTOM } from '../../content/library';
import { generateAshMap, LAYOUT, seededRandom } from '../../content/mapgen';

// The project has no Node types; only these two are used.
declare const process: { argv: string[]; stdout: { write(text: string): void } };

const FIXED = Object.fromEntries([READING_ROOM, ARCHIVE, COURTYARD, RUIN, CELLAR].map((map) => [map.id, map]));
const GENERATED = WORLD_POINTS.filter((point) => !point.map);

// `node -e` puts the script's arguments after its own path, with or without the `--`.
const keys = process.argv.filter((arg) => /^[a-z-]+(:\d+)?$/.test(arg) && arg !== 'import');
const maps = keys.map((key) => {
  const [place, seed] = key.split(':');
  const fixed = FIXED[place!];
  if (fixed) return { key, seed: null, ...fixed };
  const point = GENERATED.find((candidate) => candidate.id === place);
  if (!point || seed === undefined) throw new Error(`unknown map ${key}`);
  return { key, seed: Number(seed), ...generateAshMap(seededRandom(Number(seed)), point.id, point.name, point.paths ?? 1) };
});
process.stdout.write(
  JSON.stringify({
    layout: { ...LAYOUT, shelfBottom: SHELF_BOTTOM },
    fixed: Object.keys(FIXED),
    generated: GENERATED.map((point) => point.id),
    maps,
  }),
);
