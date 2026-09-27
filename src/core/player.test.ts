import assert from "node:assert/strict";
import { status } from "./game.ts";
import { cellIndex, type Color, gridFromRows } from "./grid.ts";
import {
  canMoveOn,
  dailyPlay,
  isFinished,
  isUntouched,
  paintDaily,
  setShowDigits,
  submitDaily,
} from "./player.ts";
import { INITIAL_STATE, type PlayerState } from "./storage.ts";

const SOLUTION = gridFromRows([
  "00000000",
  "00000000",
  "00000000",
  "00000000",
  "00010000",
  "00000000",
  "00000000",
  "00000000",
]);
const TARGET = cellIndex(3, 4);

function wrongSubmit(state: PlayerState, n: number, color: Color): PlayerState {
  return submitDaily(paintDaily(state, n, SOLUTION, TARGET, color), n, SOLUTION);
}

Deno.test("dailyPlay starts blank for a puzzle never played", () => {
  const play = dailyPlay(INITIAL_STATE, 5, SOLUTION);
  assert.equal(play.submissions.length, 0);
  assert.equal(play.attempts, 3);
  assert.ok(play.drawing.every((cell) => cell === 0));
});

Deno.test("paintDaily saves the drawing so a reload restores it", () => {
  const state = paintDaily(INITIAL_STATE, 5, SOLUTION, 0, 4);
  assert.equal(dailyPlay(state, 5, SOLUTION).drawing[0], 4);
  assert.equal(paintDaily(state, 5, SOLUTION, 0, 4), state, "no change, same state");
});

Deno.test("submitDaily records the attempt count when the puzzle is solved", () => {
  const once = wrongSubmit(INITIAL_STATE, 5, 2);
  assert.equal(isFinished(once, 5), false);
  const solved = submitDaily(paintDaily(once, 5, SOLUTION, TARGET, 1), 5, SOLUTION);
  assert.equal(solved.results[5], 2);
  assert.equal(status(dailyPlay(solved, 5, SOLUTION)), "solved");
});

Deno.test("submitDaily records X after the last wrong attempt", () => {
  const failed = [2, 3, 4].reduce(
    (state, color) => wrongSubmit(state, 5, color as Color),
    INITIAL_STATE,
  );
  assert.equal(failed.results[5], "X");
  assert.equal(dailyPlay(failed, 5, SOLUTION).submissions.length, 3);
});

Deno.test("a finished puzzle can't be replayed", () => {
  const solved = submitDaily(paintDaily(INITIAL_STATE, 5, SOLUTION, TARGET, 1), 5, SOLUTION);
  assert.equal(paintDaily(solved, 5, SOLUTION, 0, 3), solved);
  assert.equal(submitDaily(solved, 5, SOLUTION), solved);
});

Deno.test("an unchanged grid can't be resubmitted", () => {
  const once = wrongSubmit(INITIAL_STATE, 5, 2);
  assert.equal(submitDaily(once, 5, SOLUTION), once);
});

Deno.test("two tabs applying actions to fresh storage can't exceed the attempts", () => {
  // Each tab re-reads storage before acting, so tab B's submit sees tab A's attempts.
  let storage = INITIAL_STATE;
  for (const color of [2, 3, 4, 5, 6] as Color[]) storage = wrongSubmit(storage, 5, color);
  assert.equal(storage.results[5], "X");
  assert.equal(dailyPlay(storage, 5, SOLUTION).submissions.length, 3);
});

Deno.test("an edited level drops its in-progress play but keeps finished results", () => {
  const edited = gridFromRows(Array<string>(8).fill("11111111"));
  const inProgress = wrongSubmit(INITIAL_STATE, 5, 2);
  assert.equal(dailyPlay(inProgress, 5, edited).submissions.length, 0);

  const solved = submitDaily(paintDaily(INITIAL_STATE, 5, SOLUTION, TARGET, 1), 5, SOLUTION);
  assert.equal(isFinished(solved, 5), true);
  assert.equal(submitDaily(solved, 5, edited), solved);
});

Deno.test("finished plays are kept for today and yesterday only", () => {
  let state = INITIAL_STATE;
  for (const n of [1, 2, 3]) {
    state = submitDaily(paintDaily(state, n, SOLUTION, TARGET, 1), n, SOLUTION);
  }
  state = paintDaily(state, 4, SOLUTION, 0, 1);
  assert.deepEqual(Object.keys(state.plays), ["3", "4"]);
  // Finishing yesterday's puzzle after midnight doesn't drop today's.
  state = submitDaily(paintDaily(state, 3, SOLUTION, 1, 1), 3, SOLUTION);
  assert.deepEqual(Object.keys(state.plays).sort(), ["3", "4"]);
});

Deno.test("an unfinished play is kept for a week: a tab left open keeps its attempts", () => {
  let state = wrongSubmit(INITIAL_STATE, 5, 2);
  state = paintDaily(state, 8, SOLUTION, 0, 1);
  assert.equal(dailyPlay(state, 5, SOLUTION).submissions.length, 1);
  state = paintDaily(state, 13, SOLUTION, 0, 1);
  assert.equal(state.plays[5], undefined);
});

Deno.test("a finished puzzle keeps its play and its own solution when its level is edited", () => {
  const solved = submitDaily(paintDaily(INITIAL_STATE, 5, SOLUTION, TARGET, 1), 5, SOLUTION);
  const play = dailyPlay(solved, 5, gridFromRows(Array<string>(8).fill("11111111")));
  assert.equal(play.submissions.length, 1);
  assert.deepEqual(play.solution, SOLUTION);
  assert.equal(status(play), "solved");
});

Deno.test("isUntouched until something is painted or submitted", () => {
  assert.equal(isUntouched(INITIAL_STATE, 5), true);
  const painted = paintDaily(INITIAL_STATE, 5, SOLUTION, 0, 3);
  assert.equal(isUntouched(painted, 5), false);
  // Painting a cell back to black leaves a blank drawing: nothing is lost by moving on.
  assert.equal(isUntouched(paintDaily(painted, 5, SOLUTION, 0, 0), 5), true);
  assert.equal(isUntouched(submitDaily(INITIAL_STATE, 5, SOLUTION), 5), false);
  assert.equal(isUntouched(INITIAL_STATE, 4), true, "other puzzles are separate");
});

Deno.test("a finished puzzle is not untouched, even when solved without painting", () => {
  const finished = { ...INITIAL_STATE, results: { 5: 1 } };
  assert.equal(isUntouched(finished, 5), false);
});

Deno.test("setShowDigits stores the setting and keeps the same state when unchanged", () => {
  const on = setShowDigits(INITIAL_STATE, true);
  assert.equal(on.showDigits, true);
  assert.equal(setShowDigits(on, true), on);
  assert.equal(setShowDigits(on, false).showDigits, false);
});

Deno.test("canMoveOn: finished or untouched puzzles make way, one in progress stays", () => {
  assert.equal(canMoveOn(INITIAL_STATE, 5), true);
  const inProgress = paintDaily(INITIAL_STATE, 5, SOLUTION, 0, 3);
  assert.equal(canMoveOn(inProgress, 5), false);
  const finished = submitDaily(paintDaily(INITIAL_STATE, 5, SOLUTION, TARGET, 1), 5, SOLUTION);
  assert.equal(canMoveOn(finished, 5), true);
});
