/**
 * Which analytics events were already sent. Umami counts every event against a monthly quota:
 * each of these goes out at most once per day, per puzzle, or per player. Each function returns
 * the same state when the event was already sent, so callers send only when it changed.
 */

import type { PlayerState } from "./storage.ts";

/** At most one pageview per local date (`YYYY-MM-DD`), however many times the page loads. */
export function recordPageview(state: PlayerState, date: string): PlayerState {
  return state.sent.pageview === date
    ? state
    : { ...state, sent: { ...state.sent, pageview: date } };
}

/** At most one share event per puzzle, however many times the player shares. */
export function recordShare(state: PlayerState, puzzle: number): PlayerState {
  if (state.sent.shared.includes(puzzle)) return state;
  // Only the recent puzzles matter for deduplication: keep the list short.
  const shared = [...state.sent.shared.filter((n) => n > puzzle - 7), puzzle];
  return { ...state, sent: { ...state.sent, shared } };
}

/** tutorial_complete: once per player. */
export function recordTutorialComplete(state: PlayerState): PlayerState {
  return state.sent.tutorialComplete
    ? state
    : { ...state, sent: { ...state.sent, tutorialComplete: true } };
}
