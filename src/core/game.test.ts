import assert from "node:assert/strict";
import {
  canSubmit,
  lastWrongCount,
  nextAttempt,
  paint,
  type Play,
  startPlay,
  status,
  submit,
} from "./game.ts";
import { cellIndex, type Color, gridFromRows } from "./grid.ts";

// Tutorial level 1: a single white cell at (3, 4).
const ONE_CELL = gridFromRows([
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

const paintAll = (play: Play, cells: [number, Color][]) =>
  cells.reduce((p, [index, color]) => paint(p, index, color), play);

Deno.test("a new play is blank, playing, and can be submitted right away", () => {
  const play = startPlay(ONE_CELL, 3);
  assert.ok(play.drawing.every((cell) => cell === 0));
  assert.equal(status(play), "playing");
  assert.equal(canSubmit(play), true);
  assert.equal(nextAttempt(play), 1);
  assert.equal(lastWrongCount(play), undefined);
});

Deno.test("a single tap then submit solves a one-cell level on attempt 1", () => {
  const solved = submit(paint(startPlay(ONE_CELL, 3), TARGET, 1));
  assert.equal(status(solved), "solved");
  assert.equal(solved.submissions.length, 1);
  assert.equal(lastWrongCount(solved), 0);
});

Deno.test("a wrong submit gives only the wrong count and the next attempt number", () => {
  const wrong = submit(paint(startPlay(ONE_CELL, 3), 0, 1));
  assert.equal(status(wrong), "playing");
  assert.equal(lastWrongCount(wrong), 2);
  assert.equal(nextAttempt(wrong), 2);
});

Deno.test("an unchanged grid can't be resubmitted, a changed one can", () => {
  const wrong = submit(startPlay(ONE_CELL, 3));
  assert.equal(canSubmit(wrong), false);
  assert.equal(submit(wrong), wrong, "a double tap burns nothing");
  const changed = paint(wrong, 5, 4);
  assert.equal(canSubmit(changed), true);
  // Painting back to the submitted drawing makes it unchanged again.
  assert.equal(canSubmit(paint(changed, 5, 0)), false);
});

Deno.test("painting the color a cell already has changes nothing", () => {
  const play = startPlay(ONE_CELL, 3);
  assert.equal(paint(play, 0, 0), play);
});

Deno.test("the last allowed wrong submit fails the puzzle", () => {
  let play = startPlay(ONE_CELL, 3);
  for (const color of [2, 3, 4] as Color[]) play = submit(paint(play, TARGET, color));
  assert.equal(status(play), "failed");
  assert.equal(play.submissions.length, 3);
  assert.equal(canSubmit(play), false);
});

Deno.test("a finished play ignores painting and submitting", () => {
  const solved = submit(paint(startPlay(ONE_CELL, 3), TARGET, 1));
  assert.equal(paint(solved, 0, 5), solved);
  assert.equal(submit(solved), solved);
});

Deno.test("solving on the last attempt counts as solved, not failed", () => {
  const play = paintAll(startPlay(ONE_CELL, 2), [[TARGET, 2]]);
  const last = submit(paint(submit(play), TARGET, 1));
  assert.equal(status(last), "solved");
  assert.equal(last.submissions.length, 2);
});

Deno.test("the tutorial allows any number of attempts", () => {
  let play = startPlay(ONE_CELL, Infinity);
  for (let i = 0; i < 10; i++) play = submit(paint(play, 0, (i % 7 + 1) as Color));
  assert.equal(status(play), "playing");
  assert.equal(nextAttempt(play), 11);
});
