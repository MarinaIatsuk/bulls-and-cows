import { evaluateGuess, isValidGuess } from './game.js';

export interface GameSettings {
  readonly length: number;
  readonly base: number;
}

export interface Attempt {
  readonly guess: string;
  readonly bulls: number;
  readonly cows: number;
  readonly submittedAt: number;
}

export type GameStatus = 'settings' | 'playing' | 'won';

export interface GameState {
  readonly settings: GameSettings;
  readonly secret: string | null;
  readonly attempts: readonly Attempt[];
  readonly status: GameStatus;
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
}

export function createInitialGameState(
  settings: GameSettings = { length: 4, base: 10 },
): GameState {
  return {
    settings: { ...settings },
    secret: null,
    attempts: [],
    status: 'settings',
    startedAt: null,
    finishedAt: null,
  };
}

export function startRound(
  settings: GameSettings,
  secret: string,
  startedAt: number,
): GameState {
  if (!isValidGuess(secret, settings.length, settings.base)) {
    throw new RangeError('Secret must be a valid number for the selected settings.');
  }
  if (!Number.isFinite(startedAt)) {
    throw new RangeError('Start time must be a finite number.');
  }

  return {
    settings: { ...settings },
    secret: secret.toLowerCase(),
    attempts: [],
    status: 'playing',
    startedAt,
    finishedAt: null,
  };
}

export function submitGuess(
  state: GameState,
  guess: string,
  submittedAt: number,
): GameState {
  if (state.status !== 'playing' || state.secret === null) return state;
  if (!isValidGuess(guess, state.settings.length, state.settings.base)) return state;

  const normalizedGuess = guess.toLowerCase();
  const isDuplicate = state.attempts.some(
    (attempt) => attempt.guess.toLowerCase() === normalizedGuess,
  );
  if (isDuplicate) return state;

  const { bulls, cows } = evaluateGuess(state.secret, normalizedGuess);
  const attempts = [
    ...state.attempts,
    { guess: normalizedGuess, bulls, cows, submittedAt },
  ];
  const isWon = bulls === state.settings.length;

  return {
    ...state,
    attempts,
    status: isWon ? 'won' : 'playing',
    finishedAt: isWon ? submittedAt : null,
  };
}
