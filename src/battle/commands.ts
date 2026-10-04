import { pickWord, type PracticeContext } from '../progress/practice';
import type { Battle, Enemy } from './battle';
import type { BuildSite, TowerKind } from './level';

/** What a completed word did. */
export type Command =
  | { readonly type: 'select'; readonly site: BuildSite }
  | { readonly type: 'build'; readonly site: BuildSite; readonly tower: TowerKind }
  /** The keyword was typed but the ink did not suffice; the selection is released. */
  | { readonly type: 'tooExpensive'; readonly site: BuildSite; readonly tower: TowerKind }
  /** The word of a glowing enemy was typed; it is struck down. */
  | { readonly type: 'strike'; readonly enemy: Enemy };

/**
 * Turns completed words into actions in a battle. Free build sites carry a
 * word; typing it selects the site, then a tower keyword builds there.
 * Glowing enemies carry a word as well; typing it strikes them down.
 */
export class Commands {
  readonly #battle: Battle;
  readonly #towers: readonly TowerKind[];
  readonly #pool: readonly string[];
  readonly #context: PracticeContext;
  readonly #siteWords = new Map<string, string>();
  /** Words of the glowing enemies on the path, by enemy. */
  #enemyWords = new Map<Enemy, string>();
  #selected: BuildSite | null = null;

  /**
   * Gives every build site a word from `pool`. Keywords are never site words,
   * and no two site words form a prefix pair.
   */
  constructor(battle: Battle, towers: readonly TowerKind[], pool: readonly string[], context: PracticeContext) {
    this.#battle = battle;
    this.#towers = towers;
    this.#pool = pool.filter((candidate) => !towers.some((tower) => tower.keyword === candidate));
    this.#context = context;
    const taken: string[] = [];
    for (const site of battle.level.sites) {
      const word = pickWord(this.#pool, taken, context);
      if (word === null) throw new Error(`no word left for build site ${site.id}`);
      taken.push(word);
      this.#siteWords.set(site.id, word);
    }
  }

  get selected(): BuildSite | null {
    return this.#selected;
  }

  /** The word on `site`, or null once a tower stands there. */
  siteWord(site: BuildSite): string | null {
    return this.#battle.towerAt(site) ? null : (this.#siteWords.get(site.id) ?? null);
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
      const taken = [...this.#siteWords.values(), ...this.#towers.map((tower) => tower.keyword), ...this.#enemyWords.values()];
      const word = pickWord(this.#pool, taken, this.#context);
      if (word !== null) this.#enemyWords.set(enemy, word);
    }
  }

  /** Words that can be typed now. */
  get words(): readonly string[] {
    const enemies = [...this.#enemyWords.values()];
    if (this.#selected) return [...this.#towers.map((tower) => tower.keyword), ...enemies];
    const sites = this.#battle.level.sites.map((site) => this.siteWord(site)).filter((word) => word !== null);
    return [...sites, ...enemies];
  }

  /** Leaves a selected build site without building. */
  cancel(): void {
    this.#selected = null;
  }

  complete(word: string): Command | null {
    const enemy = [...this.#enemyWords].find(([, enemyWord]) => enemyWord === word)?.[0];
    if (enemy) {
      this.#enemyWords.delete(enemy);
      return this.#battle.strike(enemy) ? { type: 'strike', enemy } : null;
    }
    if (this.#selected) {
      const site = this.#selected;
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
