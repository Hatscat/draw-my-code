/** Tutorial progress in the saved state. The tutorial's plays themselves are never saved. */

import type { PlayerState } from "./storage.ts";

/**
 * Records that the player solved tutorial level `level` (from 1) of `total`: a reload resumes at
 * the next one, and solving the last one completes the tutorial.
 */
export function tutorialSolved(
  state: PlayerState,
  level: number,
  total: number,
): PlayerState {
  if (state.tutorial.done) return state;
  return level >= total ? { ...state, tutorial: { done: true, next: 1 } } : {
    ...state,
    tutorial: { done: false, next: Math.max(state.tutorial.next, level + 1) },
  };
}

export function skipTutorial(state: PlayerState): PlayerState {
  return state.tutorial.done ? state : { ...state, tutorial: { done: true, next: 1 } };
}

/** The tutorial level (from 1) to show on load, or undefined once it is done or skipped. */
export function tutorialLevelToShow(
  state: PlayerState,
  total: number,
): number | undefined {
  if (state.tutorial.done || total === 0) return undefined;
  return Math.min(Math.max(1, state.tutorial.next), total);
}
