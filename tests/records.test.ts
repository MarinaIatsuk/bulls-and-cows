import { describe, expect, it } from 'vitest';
import { formatDuration, rankRecords, type ScoreRecord } from '../src/records.js';

const records: ScoreRecord[] = [
  { base: 10, length: 4, attempts: 5, timeMs: 18000, achievedAt: 3 },
  { base: 10, length: 4, attempts: 3, timeMs: 29000, achievedAt: 2 },
  { base: 10, length: 4, attempts: 3, timeMs: 12000, achievedAt: 1 },
];

describe('rankRecords', () => {
  it('sorts by attempts, then by time', () => {
    expect(
      rankRecords(records).map(({ attempts, timeMs }) => [attempts, timeMs]),
    ).toEqual([
      [3, 12000],
      [3, 29000],
      [5, 18000],
    ]);
  });

  it('returns only the requested number without mutating the input', () => {
    const originalOrder = [...records];

    expect(rankRecords(records, 2)).toHaveLength(2);
    expect(records).toEqual(originalOrder);
  });
});

describe('formatDuration', () => {
  it('formats elapsed time as minutes and seconds', () => {
    expect(formatDuration(65000)).toBe('01:05');
    expect(formatDuration(0)).toBe('00:00');
  });

  it('never displays a negative duration', () => {
    expect(formatDuration(-5000)).toBe('00:00');
  });
});
