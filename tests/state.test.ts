import { describe, expect, it } from 'vitest';
import { createInitialGameState, startRound, submitGuess } from '../src/state.js';

describe('game state transitions', () => {
  it('starts a new round with an empty immutable history', () => {
    const initialState = createInitialGameState({ length: 3, base: 10 });
    const playingState = startRound({ length: 3, base: 10 }, '123', 1000);

    expect(initialState.status).toBe('settings');
    expect(initialState.attempts).toEqual([]);
    expect(playingState.status).toBe('playing');
    expect(playingState.secret).toBe('123');
    expect(playingState.startedAt).toBe(1000);
    expect(playingState.attempts).toEqual([]);
  });

  it('adds a guess by creating a new history array', () => {
    const initialState = startRound({ length: 3, base: 10 }, '123', 1000);
    const nextState = submitGuess(initialState, '456', 2000);

    expect(initialState.attempts).toEqual([]);
    expect(nextState).not.toBe(initialState);
    expect(nextState.attempts).toEqual([
      { guess: '456', bulls: 0, cows: 0, submittedAt: 2000 },
    ]);
    expect(nextState.status).toBe('playing');
  });

  it('finishes the round when every digit is a bull', () => {
    const playingState = startRound({ length: 3, base: 10 }, '123', 1000);
    const wonState = submitGuess(playingState, '123', 4500);

    expect(wonState.status).toBe('won');
    expect(wonState.finishedAt).toBe(4500);
    expect(wonState.attempts).toHaveLength(1);
    expect(wonState.attempts[0]?.bulls).toBe(3);
  });

  it('does not add an invalid or repeated guess', () => {
    const playingState = startRound({ length: 3, base: 10 }, '123', 1000);
    const afterFirstGuess = submitGuess(playingState, '456', 2000);

    expect(submitGuess(afterFirstGuess, '45', 3000)).toBe(afterFirstGuess);
    expect(submitGuess(afterFirstGuess, '456', 4000)).toBe(afterFirstGuess);
    expect(afterFirstGuess.attempts).toHaveLength(1);
  });
});
