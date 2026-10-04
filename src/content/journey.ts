import type { Level } from '../battle/level';
import { wallShelves, type BattleMap } from './library';
import { generateAshMap, generateWaves, type Foes, type Random } from './mapgen';
import { SILENT_FIREBUG, SILENT_SCORPION } from './raid';

/** A place on the world map held by the Silence; typing its word selects it. */
export interface WorldPoint {
  readonly id: string;
  readonly name: string;
  readonly word: string;
  /** Position on the 1280 × 720 world map. */
  readonly x: number;
  readonly y: number;
  /** 1 for the first place; the waves grow with it. */
  readonly difficulty: number;
  /** A fixed map for special places; the others get a fresh one each time. */
  readonly map?: BattleMap;
}

/** A region of the world map; only the ash fields can be entered so far. */
export interface Region {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly open: boolean;
}

/** The creatures of the Silence in the ash fields. */
const ASH_FOES: Foes = { small: SILENT_SCORPION, large: SILENT_FIREBUG };

/** What is left of the reading room: soot on the floor, burnt shelves, no banners, no torches. */
export const RUIN: BattleMap = {
  id: 'ruin',
  name: 'Bibliotheksruine',
  indoor: true,
  floor: 'stone',
  ash: true,
  path: [
    { x: -40, y: 200 },
    { x: 240, y: 200 },
    { x: 240, y: 400 },
    { x: 600, y: 400 },
    { x: 600, y: 200 },
    { x: 900, y: 200 },
    { x: 900, y: 380 },
    { x: 1150, y: 380 },
  ],
  sites: [
    { id: 'a', x: 120, y: 330 },
    { id: 'b', x: 420, y: 300 },
    { id: 'c', x: 750, y: 330 },
    { id: 'd', x: 1030, y: 260 },
    { id: 'e', x: 780, y: 440 },
  ],
  props: [
    ...wallShelves([64, 128, 384, 448, 512, 704, 768, 1024, 1088, 1152], 'burnt-bookshelf'),
    { kind: 'book-pile', variant: 1, x: 60, y: 440 },
    { kind: 'book-pile', variant: 0, x: 1180, y: 250 },
    { kind: 'scroll', x: 420, y: 160 },
    { kind: 'scroll', x: 1220, y: 440 },
  ],
};

/** The cellar under the library: the fire did not reach it; torches still burn. */
export const CELLAR: BattleMap = {
  id: 'cellar',
  name: 'Kellergewölbe',
  indoor: true,
  floor: 'slab',
  path: [
    { x: -40, y: 380 },
    { x: 180, y: 380 },
    { x: 180, y: 210 },
    { x: 480, y: 210 },
    { x: 480, y: 400 },
    { x: 820, y: 400 },
    { x: 820, y: 210 },
    { x: 1150, y: 210 },
  ],
  sites: [
    { id: 'a', x: 70, y: 270 },
    { id: 'b', x: 330, y: 340 },
    { id: 'c', x: 650, y: 300 },
    { id: 'd', x: 980, y: 340 },
    { id: 'e', x: 650, y: 150 },
  ],
  props: [
    ...wallShelves([96, 288, 352, 960, 1024]),
    { kind: 'book-pile', variant: 0, x: 330, y: 440 },
    { kind: 'book-pile', variant: 1, x: 1180, y: 430 },
    { kind: 'scroll', x: 980, y: 440 },
  ],
  torches: [180, 560, 760, 1220],
};

/** The ash fields around the burnt library, in the order they open up. */
export const WORLD_POINTS: readonly WorldPoint[] = [
  { id: 'ruin', name: 'Bibliotheksruine', word: 'ruine', x: 170, y: 470, difficulty: 1, map: RUIN },
  { id: 'smoke', name: 'Rauchsenke', word: 'rauch', x: 360, y: 300, difficulty: 2 },
  { id: 'cellar', name: 'Kellergewölbe', word: 'keller', x: 400, y: 580, difficulty: 3, map: CELLAR },
  { id: 'embers', name: 'Glutfeld', word: 'glut', x: 600, y: 430, difficulty: 4 },
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

/** A battle at a place of the world map: where it is fought and what comes. */
export interface JourneyBattle {
  readonly map: BattleMap;
  readonly level: Level;
}

/** The battle at `point`: its fixed map or a fresh one, and fresh waves for its difficulty. */
export function journeyBattle(point: WorldPoint, random: Random): JourneyBattle {
  const map = point.map ?? generateAshMap(random, point.id, point.name);
  const waves = generateWaves(random, point.difficulty, ASH_FOES);
  return { map, level: { id: `journey-${point.id}`, path: map.path, sites: map.sites, ward: 10, ink: 150, waves } };
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
