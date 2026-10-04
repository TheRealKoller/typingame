import { pickWord, type PracticeContext } from '../progress/practice';
import type { Battle } from './battle';
import type { BuildSite, TowerKind } from './level';

/** What a completed word did. */
export type Command =
  | { readonly type: 'select'; readonly site: BuildSite }
  | { readonly type: 'build'; readonly site: BuildSite; readonly tower: TowerKind }
  /** The keyword was typed but the ink did not suffice; the site stays selected. */
  | { readonly type: 'tooExpensive'; readonly site: BuildSite; readonly tower: TowerKind }
  | { readonly type: 'endFlood' };

/**
 * Turns completed words into actions in a battle. Free build sites carry a
 * word; typing it selects the site, then a tower keyword builds there.
 * During a flood, `floodWord` lets the next wave come.
 */
export class Commands {
  readonly #battle: Battle;
  readonly #towers: readonly TowerKind[];
  readonly #floodWord: string;
  readonly #siteWords = new Map<string, string>();
  #selected: BuildSite | null = null;

  /**
   * Gives every build site a word from `pool`. Keywords and the flood word are
   * never site words, and no two words that can be visible together form a prefix pair.
   */
  constructor(
    battle: Battle,
    towers: readonly TowerKind[],
    floodWord: string,
    pool: readonly string[],
    context: PracticeContext,
  ) {
    this.#battle = battle;
    this.#towers = towers;
    this.#floodWord = floodWord;
    const reserved = [floodWord, ...towers.map((tower) => tower.keyword)];
    const taken = [floodWord];
    for (const site of battle.level.sites) {
      const word = pickWord(
        pool.filter((candidate) => !reserved.includes(candidate)),
        taken,
        context,
      );
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

  /** Words that can be typed now. */
  get words(): readonly string[] {
    if (this.#selected) return this.#towers.map((tower) => tower.keyword);
    const sites = this.#battle.level.sites.map((site) => this.siteWord(site)).filter((word) => word !== null);
    return this.#battle.phase === 'flood' ? [this.#floodWord, ...sites] : sites;
  }

  /** Leaves a selected build site without building. */
  cancel(): void {
    this.#selected = null;
  }

  complete(word: string): Command | null {
    if (this.#selected) {
      const site = this.#selected;
      const tower = this.#towers.find((kind) => kind.keyword === word);
      if (!tower) return null;
      if (!this.#battle.build(site, tower)) return { type: 'tooExpensive', site, tower };
      this.#selected = null;
      return { type: 'build', site, tower };
    }
    if (word === this.#floodWord && this.#battle.phase === 'flood') {
      this.#battle.endFlood();
      return { type: 'endFlood' };
    }
    const site = this.#battle.level.sites.find((candidate) => this.siteWord(candidate) === word);
    if (!site) return null;
    this.#selected = site;
    return { type: 'select', site };
  }
}
