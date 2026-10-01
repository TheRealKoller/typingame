import { describe, expect, it } from 'vitest';
import { playOrder } from '../content/chapters';
import { rooms } from './rooms';

// The scene looks up rooms by name and things by the content's object ids; a gap stops the game there.
describe('rooms', () => {
  it('has a room for every section and a thing there for every word', () => {
    const missing = playOrder.flatMap(({ section }) => {
      const room = rooms[section.room];
      if (!room) return [`${section.id}: no room "${section.room}"`];
      return section.words
        .filter((word) => !(word.object in room.things))
        .map((word) => `${section.id}: no thing "${word.object}" for "${word.text}" in ${section.room}`);
    });
    expect(missing).toEqual([]);
  });

  // Phaser keeps textures by key, globally: two rooms using one key for different images
  // would silently show the wrong drawing.
  it('points every asset key at one image across all rooms', () => {
    const byKey = new Map<string, string>();
    const clashes: string[] = [];
    for (const [name, room] of Object.entries(rooms)) {
      for (const { key, url } of room.assets ?? []) {
        const seen = byKey.get(key);
        if (seen !== undefined && seen !== url) clashes.push(`${name}: "${key}" is used for two different images`);
        byKey.set(key, url);
      }
    }
    expect(clashes).toEqual([]);
  });
});
