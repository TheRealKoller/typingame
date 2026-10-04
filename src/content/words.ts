/**
 * German words for build sites and other words in battle, all lowercase,
 * grouped roughly by the keys they first need. Each stage of the game uses
 * those that only contain its unlocked keys (`wordsFor`). Entries with a
 * space need the space bar.
 */
export const WORDS: readonly string[] = [
  // Home row
  'das', 'dass', 'als', 'all', 'fall', 'falls', 'lass', 'saal', 'fass', 'salsa',
  'hals', 'half', 'hall', 'kahl', 'lag', 'sag', 'gas', 'glas', 'jagd', 'ja',
  // With e i
  'eis', 'keks', 'see', 'fee', 'leise', 'ei', 'feld', 'geld', 'held', 'helfe', 'hilfe', 'fisch',
  'seife', 'kiesel', 'adler', 'idee', 'lied', 'segel', 'esel', 'insel', 'lesen', 'feile', 'weil',
  // With r u
  'uhr', 'gurke', 'reis', 'rede', 'feuer', 'dach', 'haus', 'frage', 'regal', 'ruder', 'rauch',
  'garde', 'drache', 'hirsch', 'kreide', 'feder', 'sieg', 'graus', 'burg', 'ruhe', 'lauf',
  // With t z
  'tinte', 'turm', 'zeit', 'herz', 'satz', 'katze', 'tasse', 'staub', 'stuhl', 'treue', 'zauber',
  'glut', 'kraft', 'zettel', 'zeile', 'tisch', 'tafel', 'stift', 'schatz', 'treppe', 'eiche',
  // With o p
  'ort', 'boot', 'post', 'papier', 'kopf', 'pult', 'opfer', 'oper', 'pfote', 'stolz', 'schloss',
  'tor', 'hoffnung', 'poet', 'spur', 'trost', 'feuerstoss', 'lupe', 'koch', 'ofen', 'rose',
  // With w q
  'wort', 'welt', 'wache', 'wasser', 'weg', 'wolke', 'quelle', 'qual', 'quarz', 'wald', 'waage',
  'wirt', 'wiese', 'wolf', 'werk', 'quark', 'weise', 'wurzel', 'zwerg', 'schwert',
  // With n m
  'name', 'nacht', 'mut', 'mond', 'mensch', 'meister', 'nebel', 'sinn', 'stimme', 'mann',
  'kamin', 'linie', 'magie', 'mantel', 'nadel', 'rauschen', 'mauer', 'flamme', 'turmspitze',
  // With b v
  'buch', 'bann', 'bild', 'brief', 'vers', 'vogel', 'bote', 'boden', 'blatt', 'brand', 'nebelbank',
  'vorrat', 'brunnen', 'verbot', 'bibel', 'buchstabe', 'bibliothek',
  // With c x y
  'hexe', 'axt', 'text', 'pony', 'fuchs', 'chor', 'lexikon', 'yeti', 'xylofon', 'echo', 'cello',
  // With the space bar
  'hund weg', 'maus weg', 'das buch', 'die flut', 'der turm', 'ein wort', 'alte tinte',
  'kalte glut', 'leise worte', 'feuer frei',
];

/** Words from `WORDS` that can be typed with `keys` alone. */
export function wordsFor(keys: Iterable<string>): string[] {
  const allowed = new Set(keys);
  return WORDS.filter((word) => [...word].every((char) => allowed.has(char)));
}
