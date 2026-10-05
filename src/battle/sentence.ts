import type { TowerKind } from './level';

/** However many words hurry a tower, it takes at least this share of its base time between two attacks. */
const MIN_COOLDOWN_SHARE = 0.4;

/** What a word brings into a tower; elements decide which words go together. */
export type Element = 'frost' | 'fire' | 'poison';

/** How a word changes the tower made of the words before it. */
export interface Effect {
  /** Added to the damage. */
  readonly damage?: number;
  /** The damage is multiplied by it; the factors of several words add up (see `compose`). */
  readonly damageFactor?: number;
  /** The time between two attacks is multiplied by it; the factors of several words add up (see `compose`). */
  readonly cooldownFactor?: number;
  /** Added to the range. */
  readonly range?: number;
  readonly splash?: number;
  readonly slow?: TowerKind['slow'];
  readonly poison?: TowerKind['poison'];
  readonly critFirst?: number;
  readonly critEvery?: TowerKind['critEvery'];
}

/** The kind of tower a base word builds: its art and its stats before other words change them. */
export interface BaseTower {
  /** Art of the tower, see `towerArt`. */
  readonly id: string;
  /** Kind of tower, e.g. »Pfeil«. */
  readonly name: string;
  readonly range: number;
  readonly damage: number;
  readonly cooldownMs: number;
  readonly slow?: TowerKind['slow'];
  readonly poison?: TowerKind['poison'];
  readonly splash?: number;
}

/**
 * One word or fixed phrase of a tower sentence. A sentence holds exactly one
 * base word; traits and a time stand before or after it, in that order when read.
 */
export type Lexeme =
  | { readonly word: string; readonly role: 'base'; readonly cost: number; readonly element?: Element; readonly tower: BaseTower; readonly note: string }
  | {
      readonly word: string;
      readonly role: 'trait' | 'time';
      readonly cost: number;
      readonly element?: Element;
      /** Traits stand before the base word (»wilde jagd«) or after it (»jagd der viper«); a time always stands last. */
      readonly position: 'before' | 'after';
      readonly effect: Effect;
      /** Short description of the effect, e.g. »schneller«. */
      readonly note: string;
    };

/** The words of a sentence, the elements that cannot meet in one tower, and how long a sentence may grow. */
export interface Grammar {
  readonly lexicon: readonly Lexeme[];
  readonly conflicts: readonly (readonly [Element, Element])[];
  readonly maxWords: number;
}

/** Why a word can or cannot join a sentence. */
export type Fit = 'ok' | 'used' | 'base' | 'time' | 'conflict' | 'full';

/** Whether `lexeme` can join `sentence`. */
export function fit(grammar: Grammar, sentence: readonly Lexeme[], lexeme: Lexeme): Fit {
  if (sentence.includes(lexeme)) return 'used';
  if (lexeme.role === 'base' && sentence.some((other) => other.role === 'base')) return 'base';
  if (lexeme.role === 'time' && sentence.some((other) => other.role === 'time')) return 'time';
  const element = lexeme.element;
  if (
    element &&
    sentence.some(
      (other) => other.element && grammar.conflicts.some(([a, b]) => (a === element && b === other.element) || (b === element && a === other.element)),
    )
  ) {
    return 'conflict';
  }
  if (sentence.length >= grammar.maxWords) return 'full';
  return 'ok';
}

/** Ink the words cost together. */
export function cost(words: readonly Lexeme[]): number {
  return words.reduce((sum, lexeme) => sum + lexeme.cost, 0);
}

const READING_ORDER = (lexeme: Lexeme): number => {
  if (lexeme.role === 'base') return 1;
  if (lexeme.role === 'time') return 3;
  return lexeme.position === 'before' ? 0 : 2;
};

/** The sentence as it reads: traits before the base word, then the base word, traits after it, the time last. */
export function read(sentence: readonly Lexeme[]): string {
  return [...sentence]
    .map((lexeme, i) => ({ lexeme, i }))
    .sort((a, b) => READING_ORDER(a.lexeme) - READING_ORDER(b.lexeme) || a.i - b.i)
    .map(({ lexeme }) => lexeme.word)
    .join(' ');
}

/** The stronger of two slowdowns or poisons: the one with the larger effect wins, durations take the longer. */
function stronger<T extends { readonly durationMs: number }>(a: T | undefined, b: T | undefined, worse: (x: T, y: T) => boolean): T | undefined {
  if (!a || !b) return a ?? b;
  const best = worse(a, b) ? b : a;
  return { ...best, durationMs: Math.max(a.durationMs, b.durationMs) };
}

/**
 * The tower a sentence builds, with the whole sentence's cost; null without a
 * base word. Its stage grows with the words, so longer sentences look grander.
 * Factors of several words add up instead of multiplying (1,6 and 1,6 make 2,2,
 * not 2,56): a long sentence grows steadily, it does not run away.
 */
export function compose(sentence: readonly Lexeme[]): TowerKind | null {
  const base = sentence.find((lexeme): lexeme is Extract<Lexeme, { role: 'base' }> => lexeme.role === 'base');
  if (!base) return null;
  const { tower } = base;
  const effects = sentence.flatMap((lexeme) => (lexeme.role === 'base' ? [] : [lexeme.effect]));
  const sum = (value: (effect: Effect) => number) => effects.reduce((total, effect) => total + value(effect), 0);
  let kind: TowerKind = {
    id: tower.id,
    name: read(sentence),
    keyword: '',
    cost: cost(sentence),
    range: tower.range + sum((e) => e.range ?? 0),
    damage: (tower.damage + sum((e) => e.damage ?? 0)) * (1 + sum((e) => (e.damageFactor ?? 1) - 1)),
    cooldownMs: Math.round(tower.cooldownMs * Math.max(MIN_COOLDOWN_SHARE, 1 + sum((e) => (e.cooldownFactor ?? 1) - 1))),
    level: Math.min(3, sentence.length),
    ...(tower.slow ? { slow: tower.slow } : {}),
    ...(tower.splash !== undefined ? { splash: tower.splash } : {}),
    ...(tower.poison ? { poison: tower.poison } : {}),
  };
  for (const e of effects) {
    const slow = stronger(kind.slow, e.slow, (x, y) => y.factor < x.factor);
    const poison = stronger(kind.poison, e.poison, (x, y) => y.dps > x.dps);
    kind = {
      ...kind,
      ...(e.splash !== undefined ? { splash: Math.max(kind.splash ?? 0, e.splash) } : {}),
      ...(slow ? { slow } : {}),
      ...(poison ? { poison } : {}),
      ...(e.critFirst !== undefined ? { critFirst: Math.max(kind.critFirst ?? 1, e.critFirst) } : {}),
      ...(e.critEvery ? { critEvery: e.critEvery } : {}),
    };
  }
  return kind;
}
