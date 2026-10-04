import type { Level, Wave } from '../battle/level';
import { ARCHIVE, COURTYARD, READING_ROOM, type PracticeMap } from './library';
import { SILENT_FIREBUG, SILENT_SCORPION } from './raid';

/** A place on the world map held by the Silence; typing its word selects it. */
export interface WorldPoint {
  readonly id: string;
  readonly name: string;
  readonly word: string;
  /** Position on the 1280 × 720 world map. */
  readonly x: number;
  readonly y: number;
  /** Where the battle is fought; the ash fields borrow the library's maps for now. */
  readonly map: PracticeMap;
  readonly waves: readonly Wave[];
}

/** A region of the world map; only the ash fields can be entered so far. */
export interface Region {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly open: boolean;
}

const scorpions = (count: number, spacingMs: number, delayMs = 0): Wave[number] => ({
  kind: SILENT_SCORPION,
  count,
  spacingMs,
  delayMs,
  markEvery: 3,
});
const firebugs = (count: number, spacingMs: number, delayMs = 0): Wave[number] => ({
  kind: SILENT_FIREBUG,
  count,
  spacingMs,
  delayMs,
});

/** The ash fields around the burnt library, in the order they open up. */
export const WORLD_POINTS: readonly WorldPoint[] = [
  {
    id: 'ruin',
    name: 'Bibliotheksruine',
    word: 'ruine',
    x: 170,
    y: 470,
    map: READING_ROOM,
    waves: [[scorpions(6, 1800)], [scorpions(8, 1500)]],
  },
  {
    id: 'smoke',
    name: 'Rauchsenke',
    word: 'rauch',
    x: 360,
    y: 300,
    map: COURTYARD,
    waves: [[scorpions(8, 1500)], [firebugs(2, 2600)], [scorpions(10, 1300)]],
  },
  {
    id: 'cellar',
    name: 'Kellergewölbe',
    word: 'keller',
    x: 400,
    y: 580,
    map: ARCHIVE,
    waves: [[scorpions(8, 1500)], [scorpions(6, 1500), firebugs(2, 2600, 3000)], [firebugs(4, 2400)]],
  },
  {
    id: 'embers',
    name: 'Glutfeld',
    word: 'glut',
    x: 600,
    y: 430,
    map: COURTYARD,
    waves: [
      [scorpions(10, 1300)],
      [firebugs(3, 2400), scorpions(8, 1400, 1200)],
      [scorpions(12, 1100), firebugs(4, 2400, 800)],
    ],
  },
];

/** Paths between points; winning one opens those linked to it. */
export const WORLD_LINKS: readonly (readonly [string, string])[] = [
  ['ruin', 'smoke'],
  ['ruin', 'cellar'],
  ['smoke', 'embers'],
  ['cellar', 'embers'],
];

/** The journey starts at the ruin of the library. */
export const FIRST_POINT = 'ruin';

export const REGIONS: readonly Region[] = [
  { name: 'Aschefelder', x: 380, y: 160, open: true },
  { name: 'Flüsterwald', x: 1060, y: 240, open: false },
  { name: 'Nebelmoor', x: 1040, y: 600, open: false },
  { name: 'Salzöde', x: 1170, y: 360, open: false },
  { name: 'Gläserne Berge', x: 1150, y: 110, open: false },
];

export function worldPoint(id: string): WorldPoint {
  const point = WORLD_POINTS.find((candidate) => candidate.id === id);
  if (!point) throw new Error(`no world point ${id}`);
  return point;
}

/** The battle at `point`. */
export function journeyLevel(point: WorldPoint): Level {
  return { id: `journey-${point.id}`, path: point.map.path, sites: point.map.sites, ward: 10, ink: 150, waves: point.waves };
}

/** Freed points are won; open ones can be fought next; the rest stay locked. */
export type PointState = 'freed' | 'open' | 'locked';

export function pointState(id: string, freed: ReadonlySet<string>): PointState {
  if (freed.has(id)) return 'freed';
  if (id === FIRST_POINT) return 'open';
  const linked = WORLD_LINKS.some(([a, b]) => (a === id && freed.has(b)) || (b === id && freed.has(a)));
  return linked ? 'open' : 'locked';
}

/** What the apprentice says after a battle on the journey. */
export const JOURNEY_VERDICTS: Readonly<Record<'won' | 'lost', readonly string[]>> = {
  won: [
    'Das Verstummen weicht. Hier wird wieder gesprochen.',
    'Weg sind sie. Kalliope hätte gesagt: ordentlich. Ich sage: endlich.',
    'Ein Stück Land zurück. Es riecht immer noch nach Rauch, aber es gehört wieder uns.',
  ],
  lost: [
    'Der Bannkreis hat nachgegeben. Ich gehe zurück und sortiere meine Finger.',
    'Zu viele, zu schnell. Beim nächsten Mal tippe ich schneller als sie laufen.',
    'Rückzug. Nicht Niederlage. Rückzug klingt besser.',
  ],
};
