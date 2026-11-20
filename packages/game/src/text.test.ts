import { describe, expect, it } from 'vitest';
import { cleanText, matchGuess, sameAnswer } from './text';

describe('cleanText', () => {
  it('collapses whitespace, strips invisible characters and truncates', () => {
    expect(cleanText('  hello \n\t world​ ', 60)).toBe('hello world');
    expect(cleanText('abcdef', 3)).toBe('abc');
  });
});

describe('sameAnswer (duplicate orders)', () => {
  it('ignores case, punctuation, articles and plurals', () => {
    expect(sameAnswer('The Leeches!', 'leech')).toBe(true);
    expect(sameAnswer('A strongly worded note', 'strongly-worded note')).toBe(true);
    expect(sameAnswer('coffee', 'tea')).toBe(false);
    expect(sameAnswer('', '')).toBe(false);
  });
});

describe('matchGuess', () => {
  const answers = ['funny bone', 'ulnar nerve'];
  it('accepts exact, spaced, plural and article variants', () => {
    expect(matchGuess('Funny Bone', answers)).toBe('correct');
    expect(matchGuess('the funnybone', answers)).toBe('correct');
    expect(matchGuess('funny bones', answers)).toBe('correct');
    expect(matchGuess('ulnar nerve!', answers)).toBe('correct');
  });
  it('forgives one typo on longer answers', () => {
    expect(matchGuess('funy bone', answers)).toBe('correct');
  });
  it('flags near misses as close', () => {
    expect(matchGuess('stethscpe', ['stethoscope'])).toBe('close');
  });
  it('rejects wrong guesses', () => {
    expect(matchGuess('kneecap', answers)).toBe('wrong');
    expect(matchGuess('', answers)).toBe('wrong');
  });
});
