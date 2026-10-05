import { pickWord, type PracticeContext } from '../progress/practice';
import type { Battle, Enemy, Hit } from './battle';
import type { BuildSite, Spell, TowerKind } from './level';
import { compose, cost, fit, type Fit, type Grammar, type Lexeme } from './sentence';

/** What a completed word did. */
export type Command =
  | { readonly type: 'select'; readonly site: BuildSite }
  | { readonly type: 'build'; readonly site: BuildSite; readonly tower: TowerKind }
  /** The upgrade word of the tower on the selected site was typed; `tower` is its new stage. */
  | { readonly type: 'upgrade'; readonly site: BuildSite; readonly tower: TowerKind }
  /** The keyword or upgrade word was typed but the ink did not suffice; the selection is released. */
  | { readonly type: 'tooExpensive'; readonly site: BuildSite; readonly tower: TowerKind }
  /** The word of a glowing enemy was typed; it is hit, and maybe defeated. */
  | { readonly type: 'strike'; readonly enemy: Enemy; readonly defeated: boolean }
  /** A spell's word was typed; it hit every enemy on the path. */
  | { readonly type: 'cast'; readonly spell: Spell; readonly hits: readonly Hit[] }
  /** A word of the sentence on the selected site was typed. */
  | { readonly type: 'compose'; readonly site: BuildSite }
  /** Enter on a sentence without a base word: there is nothing to build yet. */
  | { readonly type: 'incomplete'; readonly site: BuildSite };

/** A word in the ring around a selected site in sentence mode: whether it fits the sentence, and its cost. */
export interface RingWord {
  readonly lexeme: Lexeme;
  /** `ok` if it can be typed; `expensive` if it fits but the ink does not suffice. */
  readonly fit: Fit | 'expensive';
}

/** A tower kind and every stage it can be upgraded to. */
function withUpgrades(kind: TowerKind): TowerKind[] {
  return kind.upgrade ? [kind, ...withUpgrades(kind.upgrade)] : [kind];
}

/**
 * Turns completed words into actions in a battle. Free build sites carry a
 * word; typing it selects the site, then a tower keyword builds there. A
 * tower keeps the word of its site while it can be upgraded; typing it
 * selects the tower, then its upgrade word upgrades it. Glowing enemies
 * carry a word as well; typing it strikes them down, or wounds the tough ones.
 * A spell's word can be typed whenever the spell is ready and a wave advances.
 *
 * With a grammar (experiment #125) a selected site takes a sentence instead of
 * a keyword: each word typed from the ring joins it, Enter (`confirm`) builds the
 * tower it describes. A tower keeps its site word while its sentence can grow;
 * more words make it stronger.
 */
export class Commands {
  readonly #battle: Battle;
  readonly #towers: readonly TowerKind[];
  readonly #spells: readonly Spell[];
  /** Keywords of the towers, all their upgrade words and the spell words: never site or enemy words. */
  readonly #keywords: readonly string[];
  readonly #pool: readonly string[];
  readonly #context: PracticeContext;
  readonly #siteWords = new Map<string, string>();
  /** Words of the glowing enemies on the path, by enemy. */
  #enemyWords = new Map<Enemy, string>();
  #selected: BuildSite | null = null;
  readonly #grammar: Grammar | null;
  /** The sentence of each tower built in sentence mode, by site id. */
  readonly #sentences = new Map<string, readonly Lexeme[]>();
  /** Words typed on the selected site, not yet built. */
  #draft: Lexeme[] = [];

  /**
   * Gives every build site a word from `pool`. Keywords are never site words,
   * and no two site words form a prefix pair.
   */
  constructor(
    battle: Battle,
    towers: readonly TowerKind[],
    pool: readonly string[],
    context: PracticeContext,
    spells: readonly Spell[] = [],
    grammar: Grammar | null = null,
  ) {
    this.#battle = battle;
    this.#towers = towers;
    this.#spells = spells;
    this.#grammar = grammar;
    this.#keywords = [
      ...towers.flatMap(withUpgrades).map((tower) => tower.keyword),
      ...spells.map((spell) => spell.word),
      ...(grammar?.lexicon.map((lexeme) => lexeme.word) ?? []),
    ];
    this.#pool = pool.filter((candidate) => !this.#keywords.includes(candidate));
    this.#context = context;
    const taken: string[] = [];
    for (const site of battle.level.sites) {
      // Spell words stand beside the site words, so they must not form prefix pairs with them.
      const word = pickWord(this.#pool, [...taken, ...spells.map((spell) => spell.word)], context);
      if (word === null) throw new Error(`no word left for build site ${site.id}`);
      taken.push(word);
      this.#siteWords.set(site.id, word);
    }
  }

  get selected(): BuildSite | null {
    return this.#selected;
  }

  /** The word on `site`: while it is free, or while its tower can still be upgraded or its sentence grow; otherwise null. */
  siteWord(site: BuildSite): string | null {
    const tower = this.#battle.towerAt(site);
    const done = this.#grammar ? this.sentence(site).length >= this.#grammar.maxWords : !tower?.kind.upgrade;
    return tower && done ? null : (this.#siteWords.get(site.id) ?? null);
  }

  /** The sentence of the tower on `site` in sentence mode; empty if none is built there. */
  sentence(site: BuildSite): readonly Lexeme[] {
    return this.#sentences.get(site.id) ?? [];
  }

  /** Words typed on the selected site in sentence mode, not yet built. */
  get draft(): readonly Lexeme[] {
    return this.#draft;
  }

  /**
   * The words around the selected site in sentence mode, each with whether it
   * fits the tower's sentence and the draft. Words that can never join (used,
   * a second base word or time) are left out; clashing or unaffordable ones stay
   * to show why they cannot be taken.
   */
  get ring(): readonly RingWord[] {
    const grammar = this.#grammar;
    const site = this.#selected;
    if (!grammar || !site) return [];
    const sentence = [...this.sentence(site), ...this.#draft];
    const left = this.#battle.ink - cost(this.#draft);
    return grammar.lexicon.flatMap((lexeme): RingWord[] => {
      const fits = fit(grammar, sentence, lexeme);
      if (fits === 'used' || fits === 'base' || fits === 'time') return [];
      return [{ lexeme, fit: fits === 'ok' && lexeme.cost > left ? 'expensive' : fits }];
    });
  }

  /** The tower on the selected site now, and what the draft would make of it for how much ink. */
  get preview(): { readonly before: TowerKind | null; readonly after: TowerKind | null; readonly cost: number } | null {
    const site = this.#selected;
    if (!this.#grammar || !site) return null;
    const sentence = this.sentence(site);
    return { before: compose(sentence), after: compose([...sentence, ...this.#draft]), cost: cost(this.#draft) };
  }

  /** Builds or extends the tower on the selected site from the draft (Enter); null if there is no draft. */
  confirm(): Command | null {
    const site = this.#selected;
    if (!this.#grammar || !site || this.#draft.length === 0) return null;
    const sentence = [...this.sentence(site), ...this.#draft];
    const tower = compose(sentence);
    if (!tower) return { type: 'incomplete', site };
    const built = this.#battle.towerAt(site) !== undefined;
    const paid = built ? this.#battle.reshape(site, tower, cost(this.#draft)) : this.#battle.build(site, tower);
    this.#selected = null;
    this.#draft = [];
    if (!paid) return { type: 'tooExpensive', site, tower };
    this.#sentences.set(site.id, sentence);
    return { type: built ? 'upgrade' : 'build', site, tower };
  }

  /** Takes the last word back out of the draft; false if there was none. */
  removeLast(): boolean {
    return this.#draft.pop() !== undefined;
  }

  /** The word a glowing enemy carries, or null. */
  enemyWord(enemy: Enemy): string | null {
    return this.#enemyWords.get(enemy) ?? null;
  }

  /**
   * Gives newly arrived glowing enemies a word and forgets the words of those
   * that are gone. A word never forms a prefix pair with a site word, a keyword
   * or another enemy's word; without such a word left, the enemy has none.
   */
  refresh(): void {
    const alive = new Set(this.#battle.enemies);
    this.#enemyWords = new Map([...this.#enemyWords].filter(([enemy]) => alive.has(enemy)));
    for (const enemy of this.#battle.enemies) {
      if (!enemy.marked || this.#enemyWords.has(enemy)) continue;
      const taken = [...this.#siteWords.values(), ...this.#keywords, ...this.#enemyWords.values()];
      // Tough enemies carry long words, if there are any left.
      const long = this.#pool.filter((candidate) => candidate.length >= (enemy.kind.minWordLength ?? 0));
      const word = pickWord(long, taken, this.#context) ?? pickWord(this.#pool, taken, this.#context);
      if (word !== null) this.#enemyWords.set(enemy, word);
    }
  }

  /** Spells that can be cast now. */
  get readySpells(): readonly Spell[] {
    return this.#battle.phase === 'ebb' ? this.#spells.filter((spell) => this.#battle.spellReadyIn(spell) === 0) : [];
  }

  /** Words that can be typed now. */
  get words(): readonly string[] {
    // Enemy words and ready spells can be typed at any time, also at a selected site.
    const always = [...this.#enemyWords.values(), ...this.readySpells.map((spell) => spell.word)];
    if (this.#selected) {
      if (this.#grammar) return [...this.ring.filter((option) => option.fit === 'ok').map((option) => option.lexeme.word), ...always];
      const tower = this.#battle.towerAt(this.#selected);
      const choices = tower ? (tower.kind.upgrade ? [tower.kind.upgrade] : []) : this.#towers;
      return [...choices.map((kind) => kind.keyword), ...always];
    }
    const sites = this.#battle.level.sites.map((site) => this.siteWord(site)).filter((word) => word !== null);
    return [...sites, ...always];
  }

  /** Leaves a selected build site without building; a draft is dropped. */
  cancel(): void {
    this.#selected = null;
    this.#draft = [];
  }

  complete(word: string): Command | null {
    const spell = this.readySpells.find((candidate) => candidate.word === word);
    if (spell) {
      const hits = this.#battle.cast(spell);
      return hits ? { type: 'cast', spell, hits } : null;
    }
    const enemy = [...this.#enemyWords].find(([, enemyWord]) => enemyWord === word)?.[0];
    if (enemy) {
      this.#enemyWords.delete(enemy);
      return this.#battle.strike(enemy) ? { type: 'strike', enemy, defeated: enemy.health === 0 } : null;
    }
    if (this.#selected) {
      const site = this.#selected;
      if (this.#grammar) {
        const option = this.ring.find((candidate) => candidate.lexeme.word === word && candidate.fit === 'ok');
        if (!option) return null;
        this.#draft.push(option.lexeme);
        return { type: 'compose', site };
      }
      const built = this.#battle.towerAt(site);
      if (built) {
        const next = built.kind.upgrade;
        if (!next || next.keyword !== word) return null;
        this.#selected = null;
        if (!this.#battle.upgrade(site)) return { type: 'tooExpensive', site, tower: next };
        return { type: 'upgrade', site, tower: next };
      }
      const tower = this.#towers.find((kind) => kind.keyword === word);
      if (!tower) return null;
      // Built or not, the player is back at the site words; staying selected without ink would only block.
      this.#selected = null;
      if (!this.#battle.build(site, tower)) return { type: 'tooExpensive', site, tower };
      return { type: 'build', site, tower };
    }
    const site = this.#battle.level.sites.find((candidate) => this.siteWord(candidate) === word);
    if (!site) return null;
    this.#selected = site;
    return { type: 'select', site };
  }
}
