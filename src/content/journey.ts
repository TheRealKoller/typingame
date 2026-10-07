import type { EnemyKind, Level, Spell } from '../battle/level';
import type { Grammar } from '../battle/sentence';
import { MAP_SCALE, wallShelves, type BattleMap } from './library';
import { GRAMMAR } from './lexicon';
import { generateAshMap, generateWaves, seededRandom, type Foes, type Random } from './mapgen';
import { paintings, type PaintedMap, type Painting } from './paintedMaps';
import { SILENT_FIREBUG, SILENT_SCORPION } from './raid';
import { INK_RAIN } from './spells';

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
  /** A fixed map for special places; the others are generated, one map for each of their paintings (`placeMap`). */
  readonly map?: BattleMap;
  /**
   * Ways in on a generated map, 1 if omitted; the same in every painting. From the second chapter some places have
   * two, late ones three, never all places of a chapter (#147). A fixed map brings its own.
   */
  readonly paths?: number;
  /** Found when the place is freed the first time; kept for every later battle. */
  readonly reward?: Reward;
}

/**
 * Something found at a freed place that carries the story on: a book cart, a
 * lost scroll, a book or a note. It teaches words for the tower sentences, and
 * a scroll may teach a spell as well.
 */
export interface Reward {
  /** What was found, e.g. »Ein Bücherkarren aus dem Keller«. */
  readonly title: string;
  /** What it says or shows, as the apprentice reads it. */
  readonly text: string;
  /** Words of the lexicon it teaches. */
  readonly words: readonly string[];
  readonly spell?: Spell;
}

/** Words of the tower sentences known when the journey begins. */
export const START_WORDS: readonly string[] = ['jagd', 'wilde', 'weite'];

/** A region of the world map; only the ash fields can be entered so far. */
export interface Region {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly open: boolean;
}

/** Ink at the start of a battle on the journey: enough for two towers. */
const START_INK = 100;

/** A wasp of the Silence: fast and frail, in swarms that slip past slow towers. */
export const SILENT_WASP: EnemyKind = { id: 'firewasp', speed: 75, wardDamage: 1, health: 12, ink: 8 };

/**
 * A beetle of the Silence in a shell of hardened ink: towers barely scratch
 * it, but every typed word cracks it. It always glows and carries long words.
 */
export const SHELLED_BEETLE: EnemyKind = {
  id: 'clampbeetle',
  speed: 24,
  // Two of them break a fresh ward: the last place cannot be held without typing.
  wardDamage: 5,
  health: 210,
  ink: 40,
  armor: 0.9,
  wordDamage: 70,
  minWordLength: 7,
};

/** The creatures of the Silence in the ash fields. */
const ASH_FOES: Foes = { small: SILENT_SCORPION, large: SILENT_FIREBUG, swift: SILENT_WASP, armored: SHELLED_BEETLE };

/** What is left of the reading room: soot on the floor, burnt shelves, no banners, no torches. */
export const RUIN: BattleMap = {
  id: 'ruin',
  name: 'Bibliotheksruine',
  indoor: true,
  floor: 'stone',
  ash: true,
  scale: MAP_SCALE,
  paths: [[
    { x: -40, y: 250 },
    { x: 190, y: 250 },
    { x: 190, y: 420 },
    { x: 420, y: 420 },
    { x: 420, y: 250 },
    { x: 660, y: 250 },
    { x: 660, y: 420 },
    { x: 900, y: 420 },
    { x: 900, y: 280 },
    { x: 1176, y: 280 },
  ]],
  sites: [
    { id: 'a', x: 90, y: 200 },
    { id: 'b', x: 320, y: 340 },
    { id: 'c', x: 450, y: 200 },
    { id: 'd', x: 580, y: 200 },
    { id: 'e', x: 760, y: 350 },
    { id: 'f', x: 940, y: 230 },
    { id: 'g', x: 1070, y: 230 },
  ],
  props: [
    ...wallShelves([64, 128, 384, 448, 512, 704, 768, 1024, 1088, 1152], 'burnt-bookshelf'),
    { kind: 'book-pile', variant: 1, x: 60, y: 440 },
    { kind: 'book-pile', variant: 0, x: 1120, y: 440 },
    { kind: 'scroll', x: 540, y: 380 },
    { kind: 'scroll', x: 1220, y: 440 },
  ],
};

/** The cellar under the library: the fire did not reach it; torches still burn. */
export const CELLAR: BattleMap = {
  id: 'cellar',
  name: 'Kellergewölbe',
  indoor: true,
  floor: 'slab',
  scale: MAP_SCALE,
  paths: [[
    { x: -40, y: 410 },
    { x: 170, y: 410 },
    { x: 170, y: 250 },
    { x: 410, y: 250 },
    { x: 410, y: 420 },
    { x: 650, y: 420 },
    { x: 650, y: 250 },
    { x: 890, y: 250 },
    { x: 890, y: 400 },
    { x: 1176, y: 400 },
  ]],
  sites: [
    { id: 'a', x: 70, y: 330 },
    { id: 'b', x: 220, y: 200 },
    { id: 'c', x: 350, y: 200 },
    { id: 'd', x: 530, y: 370 },
    { id: 'e', x: 700, y: 200 },
    { id: 'f', x: 840, y: 200 },
    { id: 'g', x: 1010, y: 330 },
  ],
  props: [
    ...wallShelves([96, 288, 352, 960, 1024]),
    { kind: 'book-pile', variant: 0, x: 60, y: 200 },
    { kind: 'book-pile', variant: 1, x: 1230, y: 250 },
    { kind: 'scroll', x: 1000, y: 200 },
  ],
  torches: [180, 560, 760, 1220],
};

/** The ash fields around the burnt library, in the order they open up. */
export const WORLD_POINTS: readonly WorldPoint[] = [
  {
    id: 'ruin',
    name: 'Bibliotheksruine',
    word: 'ruine',
    x: 170,
    y: 470,
    difficulty: 1,
    map: RUIN,
    reward: {
      title: 'Ein Bücherkarren aus dem Keller der Bibliothek',
      text: 'Unter verkohlten Balken steht ein Karren, den das Feuer verschont hat. Obenauf ein Band über Winterzauber, am Rand Kalliopes Schrift: »Kälte macht langsam. Auch Ungeheuer.«',
      words: ['eisnadel', 'frostige'],
    },
  },
  {
    id: 'smoke',
    name: 'Rauchsenke',
    word: 'rauch',
    x: 360,
    y: 300,
    difficulty: 2,
    reward: {
      title: 'Eine verlorene Schriftrolle und eine Notiz',
      text: 'Die Rolle beschreibt einen Regen aus Tinte. Darin steckt ein Zettel der Meisterin: »Die Viper wartet, bis der Panzer schläft. Ihr Gift fragt nicht, wie dick die Haut ist.«',
      words: ['viper', 'der viper'],
      spell: INK_RAIN,
    },
  },
  {
    id: 'cellar',
    name: 'Kellergewölbe',
    word: 'keller',
    x: 400,
    y: 580,
    difficulty: 3,
    map: CELLAR,
    reward: {
      title: 'Ein Bücherkarren mit einem alten Kampfbuch',
      text: 'Zwischen den Fässern ein Karren, darauf ein zerlesenes Buch. Eine Seite ist eingeknickt: »Wer im Morgengrauen zuschlägt, trifft, bevor der Feind erwacht. Und schwere Worte treffen schwer.«',
      words: ['schwere', 'im morgengrauen'],
    },
  },
  {
    id: 'embers',
    name: 'Glutfeld',
    word: 'glut',
    x: 600,
    y: 430,
    difficulty: 4,
    reward: {
      title: 'Ein Buch, das nicht brennt',
      text: 'Mitten in der Glut liegt ein Buch, die Seiten warm wie Brot. »Flammen springen über. Um Mitternacht trifft jeder vierte Hieb doppelt so hart.« Darunter, dick unterstrichen: »Feuer und Frost vertragen sich nicht.«',
      words: ['flammende', 'um mitternacht'],
    },
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

/** A battle at a place of the world map: where it is fought, what comes, which words build towers, which spells can be cast. */
export interface JourneyBattle extends PaintedMap {
  readonly level: Level;
  readonly grammar: Grammar;
  readonly spells: readonly Spell[];
}

/** What a reward brings, as the apprentice reads it after the battle. */
export function rewardText(reward: Reward): string {
  const words = `Neue Wörter: ${reward.words.map((word) => `»${word}«`).join(', ')}`;
  const spell = reward.spell
    ? `\nNeuer Zauber: ${reward.spell.name} (»${reward.spell.word}«, ${reward.spell.cost} Tinte) – trifft bei Ebbe jeden Gegner auf dem Weg.`
    : '';
  return `${reward.title}.\n${reward.text}\n${words}${spell}`;
}

/** Rewards of the places freed so far, in the order of the world map. */
export function rewardsFor(freed: ReadonlySet<string>): Reward[] {
  return WORLD_POINTS.flatMap((point) => (point.reward && freed.has(point.id) ? [point.reward] : []));
}

/** The words of the tower sentences known with the places in `freed`: the start words and what was found there. */
export function knownWords(freed: ReadonlySet<string>): Set<string> {
  return new Set([...START_WORDS, ...rewardsFor(freed).flatMap((reward) => reward.words)]);
}

/**
 * The map `painting` shows at `point`: its fixed map, or the map generated from the painting's seed as it was when
 * painted (`paintedMaps.test.ts` checks it still is).
 */
export function placeMap(point: WorldPoint, painting: Painting): BattleMap {
  if (point.map) return point.map;
  if (painting.seed === null) throw new Error(`painting ${painting.file} of the generated place ${point.id} has no seed`);
  return generateAshMap(seededRandom(painting.seed), point.id, point.name, point.paths ?? 1);
}

/**
 * The battle at `point` on `painting`, or on one of the place's paintings picked by `random`: its map, fresh waves
 * for its difficulty, the words known and every spell from a scroll found at the places in `freed`.
 */
export function journeyBattle(point: WorldPoint, random: Random, freed: ReadonlySet<string>, painting?: Painting): JourneyBattle {
  const shown = paintings(point.map?.id ?? point.id);
  const fought = painting ?? shown[Math.floor(random() * shown.length)]!;
  const map = placeMap(point, fought);
  const waves = generateWaves(random, point.difficulty, ASH_FOES, map.paths.length);
  const known = knownWords(freed);
  const grammar = { ...GRAMMAR, lexicon: GRAMMAR.lexicon.filter((lexeme) => known.has(lexeme.word)) };
  const spells = rewardsFor(freed).flatMap((reward) => (reward.spell ? [reward.spell] : []));
  return {
    map,
    painting: fought,
    grammar,
    spells,
    level: { id: `journey-${point.id}`, paths: map.paths, sites: map.sites, ward: 10, ink: START_INK, waves, scale: map.scale },
  };
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
