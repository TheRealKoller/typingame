// Prints generated ash maps as JSON for replicate.py, which draws them as sketches.
// Run: node -e "import('vite').then((v) => v.runnerImport('./experiments/135-art-style/map-json.ts'))" -- <seed>...
import { generateAshMap, LAYOUT, seededRandom } from '../../src/content/mapgen';

// The project has no Node types; only these two are used.
declare const process: { argv: string[]; stdout: { write(text: string): void } };

// `node -e` puts the script's arguments after its own path, with or without the `--`.
const seeds = process.argv.filter((arg) => /^\d+$/.test(arg)).map(Number);
const maps = seeds.map((seed) => ({ seed, ...generateAshMap(seededRandom(seed), `probe-${seed}`, 'Probe') }));
process.stdout.write(JSON.stringify({ layout: LAYOUT, maps }));
