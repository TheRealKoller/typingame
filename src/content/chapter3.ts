import type { Chapter } from './types';

export const chapter3: Chapter = {
  id: 3,
  place: 'Garten',
  sections: [
    {
      id: '3a',
      room: 'Wiese',
      newKeys: ['n', 'm'],
      words: [
        { text: 'mama', object: 'mama', reaction: 'Mama lächelt und winkt dir zu.' },
        { text: 'sonne', object: 'sun', reaction: 'Die Sonne strahlt warm.' },
        { text: 'hund', object: 'dog', reaction: 'Der Hund wedelt mit dem Schwanz.' },
        { text: 'maus', object: 'mouse', reaction: 'Die Maus huscht ein Stück.' },
        { text: 'gartenzwerg', object: 'gnome', reaction: 'Der Gartenzwerg wackelt.' },
      ],
    },
    {
      id: '3b',
      room: 'Beet',
      newKeys: ['b', 'v'],
      words: [
        { text: 'baum', object: 'tree', reaction: 'Der Baum raschelt im Wind.' },
        { text: 'blume', object: 'flower', reaction: 'Die Blume wiegt sich.' },
        { text: 'biene', object: 'bee', reaction: 'Die Biene summt um die Blume.' },
        { text: 'vogel', object: 'bird', reaction: 'Der Vogel flattert mit den Flügeln.' },
        { text: 'ball', object: 'ball', reaction: 'Der Ball hüpft.' },
        { text: 'bank', object: 'bench', reaction: 'Ein Blatt segelt auf die Bank.' },
      ],
    },
    {
      id: '3c',
      room: 'Hof',
      newKeys: ['c', 'x', 'y'],
      words: [
        { text: 'axt', object: 'axe', reaction: 'Die Axt wackelt im Hackklotz.' },
        { text: 'pony', object: 'pony', reaction: 'Das Pony wiehert.' },
        { text: 'fuchs', object: 'fox', reaction: 'Der Fuchs spitzt die Ohren.' },
        { text: 'milchkanne', object: 'milkCan', reaction: 'Die Milchkanne klirrt.' },
        { text: 'kirsche', object: 'cherry', reaction: 'Die Kirsche wackelt am Stiel.' },
        { text: 'schnecke', object: 'snail', reaction: 'Die Schnecke kriecht ein Stück.' },
      ],
    },
    {
      // The first word pairs; the space bar turns them into two words. Their first words belong to
      // the meadow, so no pair starts with a word the yard shows.
      id: '3d',
      room: 'Hof',
      newKeys: [' '],
      words: [
        { text: 'hund weg', object: 'dog', reaction: 'Der Hund läuft davon.' },
        { text: 'maus weg', object: 'mouse', reaction: 'Die Maus huscht davon.' },
      ],
    },
  ],
};
