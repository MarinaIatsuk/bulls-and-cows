export interface GuessResult {
  readonly bulls: number;
  readonly cows: number;
}

export type DigitValidator = (character: string) => boolean;

export function createDigitValidator(base: number): DigitValidator {
  if (!Number.isInteger(base) || base < 2 || base > 16) {
    throw new RangeError('Base must be an integer from 2 to 16');
  }

  const digits = new Set(
    Array.from({ length: base }, (_, value) => value.toString(16)),
  );

  return (character: string): boolean =>
    character.length === 1 && digits.has(character.toLowerCase());
}

export function generateSecret(
  length: number,
  base: number,
  random: () => number = Math.random,
): string {
  void length;
  void base;
  void random;
  throw new Error('Not implemented');
}

export function evaluateGuess(secret: string, guess: string): GuessResult {
  void secret;
  void guess;
  throw new Error('Not implemented');
}

export function isValidGuess(guess: string, length: number, base: number): boolean {
  void guess;
  void length;
  void base;
  throw new Error('Not implemented');
}

export function countPossibleSecrets(length: number, base: number): number {
  void length;
  void base;
  throw new Error('Not implemented');
}