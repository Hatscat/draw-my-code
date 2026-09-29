import { ATTEMPTS, CATCH_UP_DAYS } from "./config.ts";

/** A finished daily: solved in that many attempts (1 to ATTEMPTS), or "X" for failed. */
export type Result = number | "X";

/** Finished dailies by puzzle number. */
export type Results = Readonly<Record<number, Result>>;

export interface Stats {
  readonly played: number;
  readonly winPercent: number;
  readonly currentStreak: number;
  readonly maxStreak: number;
  /** Puzzles solved in 1, 2, … ATTEMPTS attempts, then failed ones. */
  readonly distribution: readonly number[];
}

/** The distribution bar a result counts in: solved in 1, 2, … ATTEMPTS, then failed. */
export function distributionSlot(result: Result): number {
  return result === "X" ? ATTEMPTS : result - 1;
}

export function isResult(value: unknown): value is Result {
  return value === "X" || (Number.isInteger(value) && (value as number) >= 1 &&
    (value as number) <= ATTEMPTS);
}

/**
 * Stats for the result panel. `today` is today's puzzle number. The current streak is the run of
 * solved puzzles up to the latest one, and it survives the puzzles after it while they can still
 * be caught up (CATCH_UP_DAYS): an unplayed today doesn't read 0 all morning, and a missed day
 * doesn't break it until that puzzle closes. A failure breaks it.
 */
export function computeStats(results: Results, today: number): Stats {
  const entries = Object.entries(results).map(([n, result]) => ({ n: Number(n), result }));
  const solved = new Set(entries.filter((e) => e.result !== "X").map((e) => e.n));
  const played = entries.length;

  const distribution = Array<number>(ATTEMPTS + 1).fill(0);
  for (const { result } of entries) {
    const slot = distributionSlot(result);
    distribution[slot] = (distribution[slot] ?? 0) + 1;
  }

  // Results dated after today only exist if the clock moved back; they don't count as current.
  const current = entries.filter((e) => e.n <= today);
  const latestSolved = Math.max(...current.filter((e) => e.result !== "X").map((e) => e.n));
  const failedSince = current.some((e) => e.n > latestSolved && e.result === "X");
  // The first puzzle after the run is unplayed: it must still be open.
  const stillOpen = latestSolved + 1 >= today - CATCH_UP_DAYS;
  let currentStreak = 0;
  if (!failedSince && stillOpen) {
    for (let n = latestSolved; solved.has(n); n--) currentStreak++;
  }

  let maxStreak = 0;
  for (const n of solved) {
    if (solved.has(n - 1)) continue; // only count from the start of each run
    let length = 1;
    while (solved.has(n + length)) length++;
    maxStreak = Math.max(maxStreak, length);
  }

  return {
    played,
    winPercent: played === 0 ? 0 : Math.floor((100 * solved.size) / played),
    currentStreak,
    maxStreak,
    distribution,
  };
}
