export interface GuessResult {
  readonly bulls: number;
  readonly cows: number;
}

export type DigitValidator = (character: string) => boolean;

export function createDigitValidator(base: number): DigitValidator {
  void base;
  throw new Error('Not implemented');
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