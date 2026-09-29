/**
 * Daily actions on the saved player state. Each is pure: the UI applies it to freshly loaded
 * storage and saves the result, so two tabs can't multiply attempts.
 */

import { ATTEMPTS, CATCH_UP_DAYS } from "./config.ts";
import { paint, type Play, startPlay, status, submit } from "./game.ts";
import { type Color, type Grid, sameGrid } from "./grid.ts";
import type { PlayerState } from "./storage.ts";

/**
 * Puzzle #n's play: the stored one, unless its level changed since, then a fresh one. A finished
 * puzzle keeps the play it was judged on, with its own solution, so its result and share text
 * stay true even if the level was edited later.
 */
export function dailyPlay(state: PlayerState, n: number, solution: Grid): Play {
  const stored = state.plays[n];
  if (stored && (isFinished(state, n) || sameGrid(stored.solution, solution))) {
    return { ...stored, attempts: ATTEMPTS };
  }
  return startPlay(solution, ATTEMPTS);
}

/**
 * Whether puzzle #n was never touched: nothing painted, nothing submitted. At midnight such a
 * puzzle can make way for the new one, while one in progress stays until it is finished.
 */
export function isUntouched(state: PlayerState, n: number): boolean {
  const play = state.plays[n];
  return !isFinished(state, n) &&
    (!play || (play.submissions.length === 0 && play.drawing.every((cell) => cell === 0)));
}

export function setShowDigits(state: PlayerState, on: boolean): PlayerState {
  return state.showDigits === on ? state : { ...state, showDigits: on };
}

/**
 * Whether the day may move on from puzzle #n, at midnight or when the app comes back: yes once
 * it is finished or if it was never touched. A puzzle in progress stays until it is finished,
 * and its result counts for its own number.
 */
export function canMoveOn(state: PlayerState, n: number): boolean {
  return isFinished(state, n) || isUntouched(state, n);
}

/** Whether puzzle #n is over. Its result, once recorded, never changes. */
export function isFinished(state: PlayerState, n: number): boolean {
  return state.results[n] !== undefined;
}

export function paintDaily(
  state: PlayerState,
  n: number,
  solution: Grid,
  index: number,
  color: Color,
): PlayerState {
  if (isFinished(state, n)) return state;
  const before = dailyPlay(state, n, solution);
  const after = paint(before, index, color);
  return after === before ? state : withPlay(state, n, after);
}

/** Submits the drawing, and records the result when this submit ends the puzzle. */
export function submitDaily(state: PlayerState, n: number, solution: Grid): PlayerState {
  if (isFinished(state, n)) return state;
  const before = dailyPlay(state, n, solution);
  const after = submit(before);
  if (after === before) return state;
  const next = withPlay(state, n, after);
  const outcome = status(after);
  if (outcome === "playing") return next;
  const result = outcome === "solved" ? after.submissions.length : "X";
  return { ...next, results: { ...next.results, [n]: result } };
}

/** Whether puzzle #n can be played on puzzle day `today`: today's, or a missed one still open. */
export function isPlayable(n: number, today: number): boolean {
  return n >= 1 && n <= today && n >= today - CATCH_UP_DAYS;
}

/** The past puzzles still open that the player hasn't finished, oldest first. */
export function missedPuzzles(state: PlayerState, today: number): number[] {
  const missed: number[] = [];
  for (let n = Math.max(1, today - CATCH_UP_DAYS); n < today; n++) {
    if (!isFinished(state, n)) missed.push(n);
  }
  return missed;
}

/**
 * Saves puzzle #n's play and drops the ones whose puzzle has closed. The others stay, finished
 * or not: a finished one shows its result and share text when reopened, an unfinished one keeps
 * its attempts (another tab may still have it open).
 */
function withPlay(state: PlayerState, n: number, play: Play): PlayerState {
  // Relative to the puzzle being played: catching up an old one never drops a newer one.
  const kept = Object.entries(state.plays).filter(([key]) => Number(key) >= n - CATCH_UP_DAYS);
  const { solution, drawing, submissions } = play;
  return {
    ...state,
    plays: { ...Object.fromEntries(kept), [n]: { solution, drawing, submissions } },
  };
}
