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
  createDigitValidator(base);

  if (!Number.isInteger(length) || length < 1 || length > base) {
    throw new RangeError('Length must be an integer from 1 to the base');
  }

  const selection = Array.from({ length }).reduce<{
    availableDigits: string[];
    secretDigits: string[];
  }>(
    (state) => {
      const randomValue = random();

      if (
        !Number.isFinite(randomValue) ||
        randomValue < 0 ||
        randomValue >= 1
      ) {
        throw new RangeError('Random source must return a number in [0, 1)');
      }

      const randomIndex = Math.floor(
        randomValue * state.availableDigits.length,
      );
      const selectedDigit = state.availableDigits[randomIndex];

      return {
        availableDigits: state.availableDigits.filter(
          (_, index) => index !== randomIndex,
        ),
        secretDigits: [...state.secretDigits, selectedDigit],
      };
    },
    {
      availableDigits: Array.from(
        { length: base },
        (_, value) => value.toString(16),
      ),
      secretDigits: [],
    },
  );

  return selection.secretDigits.join('');
}

export function evaluateGuess(secret: string, guess: string): GuessResult {
  const secretDigits = Array.from(secret.toLowerCase());
  const guessDigits = Array.from(guess.toLowerCase());

  if (secretDigits.length !== guessDigits.length) {
    throw new RangeError('Secret and guess must have the same length');
  }

  const bulls = secretDigits.filter(
    (digit, index) => digit === guessDigits[index],
  ).length;

  const unmatchedSecretDigits = secretDigits.filter(
    (digit, index) => digit !== guessDigits[index],
  );
  const unmatchedGuessDigits = guessDigits.filter(
    (digit, index) => digit !== secretDigits[index],
  );

  const { cows } = unmatchedGuessDigits.reduce(
    (result, guessDigit) => {
      const matchIndex = result.remainingSecretDigits.indexOf(guessDigit);
      if (matchIndex === -1) return result;

      return {
        remainingSecretDigits: result.remainingSecretDigits.filter(
          (_, index) => index !== matchIndex,
        ),
        cows: result.cows + 1,
      };
    },
    { remainingSecretDigits: unmatchedSecretDigits, cows: 0 },
  );

  return { bulls, cows };
}

export function isValidGuess(
  guess: string,
  length: number,
  base: number,
): boolean {
  const isAllowedDigit = createDigitValidator(base);

  if (!Number.isInteger(length) || length < 1 || length > base) return false;

  const digits = Array.from(guess.toLowerCase());

  return (
    digits.length === length &&
    digits.every(isAllowedDigit) &&
    new Set(digits).size === digits.length
  );
}
const possibleSecretsCache = new Map<string, number>();

export function countPossibleSecrets(length: number, base: number): number {
  createDigitValidator(base);

  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError('Length must be a non-negative integer');
  }
  if (length > base) return 0;

  const count = (remainingLength: number, availableDigits: number): number => {
    if (remainingLength === 0) return 1;
    if (remainingLength > availableDigits) return 0;

    const cacheKey = `${remainingLength}:${availableDigits}`;
    const cachedCount = possibleSecretsCache.get(cacheKey);
    if (cachedCount !== undefined) return cachedCount;

    const result =
      availableDigits * count(remainingLength - 1, availableDigits - 1);

    possibleSecretsCache.set(cacheKey, result);
    return result;
  };

  return count(length, base);
}