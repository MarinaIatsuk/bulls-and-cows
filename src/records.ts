export interface ScoreRecord {
  readonly base: number;
  readonly length: number;
  readonly attempts: number;
  readonly timeMs: number;
  readonly achievedAt: number;
}

export function rankRecords(records: readonly ScoreRecord[], limit = 10): ScoreRecord[] {
  if (!Number.isInteger(limit) || limit < 0) {
    throw new RangeError('Limit must be a non-negative integer.');
  }

  return [...records]
    .sort(
      (left, right) =>
        left.attempts - right.attempts ||
        left.timeMs - right.timeMs ||
        left.achievedAt - right.achievedAt,
    )
    .slice(0, limit);
}

export function isScoreRecord(value: unknown): value is ScoreRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;

  return (
    Number.isInteger(record.base) &&
    Number.isInteger(record.length) &&
    Number.isInteger(record.attempts) &&
    Number.isFinite(record.timeMs) &&
    Number.isFinite(record.achievedAt)
  );
}

export function formatDuration(timeMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, timeMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
