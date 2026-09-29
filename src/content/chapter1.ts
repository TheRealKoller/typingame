import type { Chapter } from './types';

export const chapter1: Chapter = {
  id: 1,
  place: 'Kinderzimmer',
  sections: [
    {
      id: '1a',
      newKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l'],
      sounds: [
        { word: 'lala', object: 'musicBox', reaction: 'Die Spieluhr beginnt zu spielen.' },
        { word: 'dada', object: 'mobile', reaction: 'Das Mobile über dem Bett dreht sich.' },
        { word: 'jaja', object: 'bed', reaction: 'Das Bett schaukelt sanft.' },
      ],
    },
    {
      id: '1b',
      newKeys: ['g', 'h'],
      sounds: [
        { word: 'haha', object: 'teddy', reaction: 'Der Teddy wackelt.' },
        { word: 'gaga', object: 'duck', reaction: 'Die Quietscheente quietscht.' },
        { word: 'aha', object: 'nightLight', reaction: 'Das Nachtlicht geht an.' },
      ],
    },
  ],
};
