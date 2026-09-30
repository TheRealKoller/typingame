import type { Chapter } from './types';

export const chapter1: Chapter = {
  id: 1,
  place: 'Kinderzimmer',
  sections: [
    {
      id: '1a',
      room: 'Kinderzimmer',
      newKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
      words: [
        { text: 'lala', object: 'musicBox', reaction: 'Die Spieluhr beginnt zu spielen.' },
        { text: 'dada', object: 'mobile', reaction: 'Das Mobile über dem Bett dreht sich.' },
        { text: 'jaja', object: 'bed', reaction: 'Das Bett schaukelt sanft.' },
      ],
    },
    {
      id: '1b',
      room: 'Kinderzimmer',
      newKeys: ['g', 'h'],
      words: [
        { text: 'haha', object: 'teddy', reaction: 'Der Teddy wackelt.' },
        { text: 'gaga', object: 'duck', reaction: 'Die Quietscheente quietscht.' },
        { text: 'aha', object: 'nightLight', reaction: 'Das Nachtlicht geht an.' },
      ],
    },
  ],
};
