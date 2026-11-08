import { describe, expect, it } from 'vitest';
import {
  countPossibleSecrets,
  createDigitValidator,
  evaluateGuess,
  generateSecret,
  isValidGuess,
} from '../src/game.js';

describe('createDigitValidator', () => {
  it('accepts only digits available in the selected base', () => {
    const isBinaryDigit = createDigitValidator(2);

    expect(isBinaryDigit('0')).toBe(true);
    expect(isBinaryDigit('1')).toBe(true);
    expect(isBinaryDigit('2')).toBe(false);
    expect(isBinaryDigit('')).toBe(false);
    expect(isBinaryDigit('01')).toBe(false);
  });

  it('accepts upper- and lower-case hexadecimal digits', () => {
    const isHexDigit = createDigitValidator(16);

    expect(isHexDigit('a')).toBe(true);
    expect(isHexDigit('A')).toBe(true);
    expect(isHexDigit('f')).toBe(true);
    expect(isHexDigit('G')).toBe(false);
  });

  it('rejects unsupported bases', () => {
    expect(() => createDigitValidator(1)).toThrow(RangeError);
    expect(() => createDigitValidator(17)).toThrow(RangeError);
  });
});

describe('generateSecret', () => {
  it('uses the injected random source and permits a leading zero', () => {
    expect(generateSecret(4, 10, () => 0)).toBe('0123');
  });

  it('generates unique lowercase hexadecimal digits', () => {
    expect(generateSecret(2, 16, () => 0.99)).toBe('fe');
  });

  it('rejects impossible lengths and invalid random values', () => {
    expect(() => generateSecret(3, 2, () => 0)).toThrow(RangeError);
    expect(() => generateSecret(2, 10, () => 1)).toThrow(RangeError);
  });
});

describe('evaluateGuess', () => {
  it('counts bulls and cows for a mixed result', () => {
    expect(evaluateGuess('4271', '4872')).toEqual({ bulls: 2, cows: 1 });
  });

  it('counts a fully correct guess as bulls only', () => {
    expect(evaluateGuess('4271', '4271')).toEqual({ bulls: 4, cows: 0 });
  });

  it('counts digits in the wrong positions as cows', () => {
    expect(evaluateGuess('4271', '1742')).toEqual({ bulls: 0, cows: 4 });
  });

  it('compares hexadecimal letters without regard to case', () => {
    expect(evaluateGuess('A1B2', 'b2a1')).toEqual({ bulls: 0, cows: 4 });
  });

  it('does not count a repeated guess digit more than once', () => {
    expect(evaluateGuess('1234', '1123')).toEqual({ bulls: 1, cows: 2 });
  });

  it('rejects guesses with a different length', () => {
    expect(() => evaluateGuess('1234', '123')).toThrow(RangeError);
  });
});

describe('isValidGuess', () => {
  it('accepts a correctly sized guess with unique digits', () => {
    expect(isValidGuess('0123', 4, 10)).toBe(true);
  });

  it('rejects repeated, invalid, or incorrectly sized digits', () => {
    expect(isValidGuess('0122', 4, 10)).toBe(false);
    expect(isValidGuess('01a3', 4, 10)).toBe(false);
    expect(isValidGuess('012', 4, 10)).toBe(false);
  });

  it('accepts uppercase hex and treats duplicate letter case as the same digit', () => {
    expect(isValidGuess('A1F0', 4, 16)).toBe(true);
    expect(isValidGuess('A1fF', 4, 16)).toBe(false);
  });

  it('rejects a length larger than the number of available digits', () => {
    expect(isValidGuess('010', 3, 2)).toBe(false);
  });
});


