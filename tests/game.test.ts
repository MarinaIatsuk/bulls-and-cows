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

