import type { Chapter } from './types';

export const chapter2: Chapter = {
  id: 2,
  place: 'Haus',
  sections: [
    {
      id: '2a',
      room: 'Küche',
      newKeys: ['e', 'i'],
      words: [
        { text: 'eis', object: 'iceCream', reaction: 'Das Eis schmilzt ein bisschen.' },
        { text: 'keks', object: 'cookie', reaction: 'Der Keks krümelt.' },
        { text: 'kaffee', object: 'coffee', reaction: 'Der Kaffee dampft.' },
        { text: 'essig', object: 'vinegar', reaction: 'Die Essigflasche gluckert.' },
      ],
    },
    {
      id: '2b',
      room: 'Küche',
      newKeys: ['r', 'u'],
      words: [
        { text: 'uhr', object: 'clock', reaction: 'Die Uhr tickt.' },
        { text: 'gurke', object: 'cucumber', reaction: 'Die Gurke kullert hin und her.' },
        { text: 'reis', object: 'rice', reaction: 'Der Reis rieselt.' },
      ],
    },
    {
      id: '2c',
      room: 'Wohnzimmer',
      newKeys: ['t', 'z'],
      words: [
        { text: 'katze', object: 'cat', reaction: 'Die Katze streckt sich.' },
        { text: 'stuhl', object: 'chair', reaction: 'Der Stuhl wackelt.' },
        { text: 'tee', object: 'tea', reaction: 'Der Tee duftet.' },
        { text: 'tasse', object: 'cup', reaction: 'Die Tasse klirrt leise.' },
      ],
    },
    {
      id: '2d',
      room: 'Wohnzimmer',
      newKeys: ['o', 'p'],
      words: [
        { text: 'sofa', object: 'sofa', reaction: 'Das Sofa federt.' },
        { text: 'puppe', object: 'doll', reaction: 'Die Puppe winkt.' },
        { text: 'foto', object: 'photo', reaction: 'Das Foto schaukelt am Nagel.' },
        { text: 'radio', object: 'radio', reaction: 'Das Radio spielt leise Musik.' },
        { text: 'papagei', object: 'parrot', reaction: 'Der Papagei plustert sich auf.' },
      ],
    },
    {
      id: '2e',
      room: 'Bad',
      newKeys: ['w', 'q'],
      words: [
        { text: 'wasser', object: 'water', reaction: 'Das Wasser plätschert.' },
        { text: 'waage', object: 'scale', reaction: 'Die Waage wippt.' },
        { text: 'seife', object: 'soap', reaction: 'Die Seife schäumt.' },
        { text: 'spiegel', object: 'mirror', reaction: 'Der Spiegel glänzt.' },
        { text: 'qualle', object: 'jellyfish', reaction: 'Die Qualle schwimmt eine Runde.' },
      ],
    },
  ],
};
