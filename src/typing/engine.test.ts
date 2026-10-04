import { describe, expect, it } from 'vitest';
import { TypingEngine } from './engine';

const typeAll = (engine: TypingEngine, chars: string) => [...chars].flatMap((char) => engine.type(char));

describe('TypingEngine', () => {
  describe('target selection', () => {
    it('narrows the candidates to words starting with the first character', () => {
      const engine = new TypingEngine(['lala', 'dada', 'haha']);

      expect(engine.type('d')).toEqual([{ type: 'correct', char: 'd' }]);
      expect(engine.candidates).toEqual(['dada']);
      expect(engine.typed).toBe('d');
    });

    it('keeps every word with the typed prefix until they diverge', () => {
      const engine = new TypingEngine(['haha', 'hallo', 'lala']);

      typeAll(engine, 'ha');
      expect(engine.candidates).toEqual(['haha', 'hallo']);
      expect(engine.expectedChars).toEqual(['h', 'l']);

      engine.type('l');
      expect(engine.candidates).toEqual(['hallo']);
    });

    it('offers the first letters of all visible words before anything is typed', () => {
      const engine = new TypingEngine(['lala', 'dada', 'da', 'haha']);

      expect(engine.candidates).toEqual(['lala', 'dada', 'da', 'haha']);
      expect(engine.expectedChars).toEqual(['l', 'd', 'h']);
    });
  });

  describe('errors', () => {
    it('reports a wrong character inside a word and waits for the right one', () => {
      const engine = new TypingEngine(['dada']);
      typeAll(engine, 'da');

      expect(engine.type('s')).toEqual([{ type: 'wrong', char: 's', expected: ['d'] }]);
      expect(engine.typed).toBe('da');

      expect(typeAll(engine, 'da')).toEqual([
        { type: 'correct', char: 'd' },
        { type: 'correct', char: 'a' },
        { type: 'complete', word: 'dada' },
      ]);
    });

    it('lists every accepted character when several candidates remain', () => {
      const engine = new TypingEngine(['haha', 'hallo']);
      typeAll(engine, 'ha');

      expect(engine.type('x')).toEqual([{ type: 'wrong', char: 'x', expected: ['h', 'l'] }]);
      expect(engine.candidates).toEqual(['haha', 'hallo']);
    });

    it('reports a first character that starts no word without selecting anything', () => {
      const engine = new TypingEngine(['lala', 'dada']);

      expect(engine.type('k')).toEqual([{ type: 'wrong', char: 'k', expected: ['l', 'd'] }]);
      expect(engine.typed).toBe('');
      expect(engine.candidates).toEqual(['lala', 'dada']);
    });

    it('rejects every character when no word is visible', () => {
      const engine = new TypingEngine();

      expect(engine.type('a')).toEqual([{ type: 'wrong', char: 'a', expected: [] }]);
    });

    it('does not let a wrong character switch to another word', () => {
      const engine = new TypingEngine(['lala', 'dada']);
      engine.type('l');

      expect(engine.type('d')).toEqual([{ type: 'wrong', char: 'd', expected: ['a'] }]);
      expect(engine.candidates).toEqual(['lala']);
    });
  });

  describe('completion', () => {
    it('completes a word on its last character and starts over', () => {
      const engine = new TypingEngine(['ja', 'lala']);

      expect(typeAll(engine, 'ja')).toEqual([
        { type: 'correct', char: 'j' },
        { type: 'correct', char: 'a' },
        { type: 'complete', word: 'ja' },
      ]);
      expect(engine.typed).toBe('');
      expect(engine.candidates).toEqual(['ja', 'lala']);
    });

    it('lets a finished word be typed again while it stays visible', () => {
      const engine = new TypingEngine(['lala']);
      typeAll(engine, 'lala');

      expect(typeAll(engine, 'lala').at(-1)).toEqual({ type: 'complete', word: 'lala' });
    });

    it('completes the shorter word when it is the prefix of another', () => {
      const engine = new TypingEngine(['dada', 'da']);

      expect(typeAll(engine, 'da').at(-1)).toEqual({ type: 'complete', word: 'da' });
      expect(engine.typed).toBe('');
    });
  });

  describe('changing the visible words', () => {
    it('keeps progress while a candidate is still visible', () => {
      const engine = new TypingEngine(['haha', 'hallo']);
      typeAll(engine, 'hal');

      engine.setWords(['hallo', 'lala']);

      expect(engine.typed).toBe('hal');
      expect(engine.candidates).toEqual(['hallo']);
    });

    it('drops progress when no candidate is visible anymore', () => {
      const engine = new TypingEngine(['haha', 'lala']);
      typeAll(engine, 'ha');

      engine.setWords(['lala', 'dada']);

      expect(engine.typed).toBe('');
      expect(engine.candidates).toEqual(['lala', 'dada']);
    });
  });

  describe('cancelling', () => {
    it('abandons the started word so another one can be chosen', () => {
      const engine = new TypingEngine(['haha', 'lala']);
      typeAll(engine, 'ha');

      engine.cancel();

      expect(engine.typed).toBe('');
      expect(engine.candidates).toEqual(['haha', 'lala']);
      expect(typeAll(engine, 'lala').at(-1)).toEqual({ type: 'complete', word: 'lala' });
    });
  });
});
