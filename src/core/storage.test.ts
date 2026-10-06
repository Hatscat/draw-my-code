import assert from "node:assert/strict";
import { blankGrid, gridFromRows, gridToString, setCell } from "./grid.ts";
import { noMarks, setMark } from "./marks.ts";
import { INITIAL_STATE, loadState, type PlayerState, serializeState } from "./storage.ts";

const SOLUTION = gridFromRows(Array<string>(8).fill("01234567"));
const DRAWING = setCell(blankGrid(), 1, 1);

const SAVED: PlayerState = {
  tutorial: { done: true, next: 6 },
  results: { 11: 1, 12: "X" },
  plays: {
    // A dot on cell 0, which DRAWING leaves black.
    13: {
      solution: SOLUTION,
      drawing: DRAWING,
      marks: setMark(noMarks(), 0, true),
      submissions: [blankGrid()],
    },
  },
  sent: { pageview: "2026-11-13", shared: [11], tutorialComplete: true },
  showDigits: true,
};

const stored = (fields: Record<string, unknown>) => JSON.stringify({ v: 2, ...fields });

Deno.test("serializeState and loadState round-trip", () => {
  const text = serializeState(SAVED);
  assert.deepEqual(loadState(text), { state: SAVED, writable: true });
});

Deno.test("serializeState stores grids as 64 digits and records the version", () => {
  const data = JSON.parse(serializeState(SAVED));
  assert.equal(data.v, 2);
  assert.equal(data.plays["13"].drawing, gridToString(DRAWING));
  assert.equal(data.plays["13"].marks, "1" + "0".repeat(63));
  assert.deepEqual(data.plays["13"].submissions, ["0".repeat(64)]);
  assert.deepEqual(data.results, { 11: 1, 12: "X" });
});

Deno.test("loadState: nothing stored means a first visit", () => {
  assert.deepEqual(loadState(null), { state: INITIAL_STATE, writable: true });
  assert.equal(INITIAL_STATE.tutorial.done, false);
});

Deno.test("loadState: unreadable data resets cleanly", () => {
  for (const raw of ["", "{", "null", "42", '"text"', "[]", "{}", '{"v":"1"}', '{"v":0}']) {
    assert.deepEqual(loadState(raw), { state: INITIAL_STATE, writable: true }, raw);
  }
});

Deno.test("loadState: data from a newer version is played in memory and never overwritten", () => {
  const loaded = loadState(JSON.stringify({ v: 3, anything: [1, 2, 3] }));
  assert.equal(loaded.writable, false);
  assert.equal(loaded.state.tutorial.done, true, "not a first-time player");
  assert.deepEqual(loaded.state.results, {});
});

Deno.test("loadState: a damaged field falls back alone, the others survive", () => {
  const loaded = loadState(stored({
    tutorial: { done: "yes", next: 2 },
    results: { 11: 1, 12: 7, 13: "x", "01": 1, "-1": 1, "1.5": 1, abc: 1, 14: "X" },
    plays: "broken",
    sent: { pageview: "yesterday", shared: [3, "4", 0, 5.5, 6], tutorialComplete: "true" },
    showDigits: 1,
  }));
  assert.equal(loaded.writable, true);
  assert.deepEqual(loaded.state, {
    tutorial: INITIAL_STATE.tutorial,
    results: { 11: 1, 14: "X" },
    plays: {},
    sent: { pageview: "", shared: [3, 6], tutorialComplete: false },
    showDigits: false,
  });
});

Deno.test("loadState drops malformed plays and keeps valid ones", () => {
  const good = { solution: gridToString(SOLUTION), drawing: "0".repeat(64), submissions: [] };
  const loaded = loadState(stored({
    plays: {
      13: good,
      14: { ...good, drawing: "8".repeat(64) },
      15: { ...good, submissions: ["0".repeat(63)] },
      16: {
        ...good,
        submissions: ["0".repeat(64), "0".repeat(64), "0".repeat(64), "1".repeat(64)],
      },
      17: { ...good, solution: undefined },
      18: [],
    },
  }));
  assert.deepEqual(Object.keys(loaded.state.plays), ["13"]);
});

Deno.test("loadState fills missing fields with defaults", () => {
  assert.deepEqual(loadState(stored({})), { state: INITIAL_STATE, writable: true });
});

Deno.test("loadState: version 1 data loads as version 2, its plays with no dots", () => {
  // Saved before dots existed: a finished play, as the game wrote it.
  const play = { solution: gridToString(SOLUTION), drawing: "0".repeat(64), submissions: [] };
  const loaded = loadState(JSON.stringify({
    v: 1,
    tutorial: { done: true, next: 1 },
    results: { 12: "X" },
    plays: { 13: play },
  }));
  assert.equal(loaded.writable, true);
  assert.deepEqual(loaded.state.tutorial, { done: true, next: 1 });
  assert.deepEqual(loaded.state.results, { 12: "X" });
  assert.deepEqual(loaded.state.plays[13], {
    solution: SOLUTION,
    drawing: blankGrid(),
    marks: noMarks(),
    submissions: [],
  });
  assert.equal(JSON.parse(serializeState(loaded.state)).v, 2);
});

Deno.test("loadState reads dots on their own: bad ones are dropped, never the play", () => {
  const good = {
    solution: gridToString(SOLUTION),
    drawing: gridToString(DRAWING),
    submissions: [],
  };
  const loaded = loadState(stored({
    plays: {
      13: { ...good, marks: 7 },
      14: { ...good, marks: "1".repeat(63) },
      15: { ...good, marks: "2".repeat(64) },
      16: good,
      // DRAWING paints cell 1 white: its dot is dropped, cell 0's is kept.
      17: { ...good, marks: "11" + "0".repeat(62) },
    },
  }));
  assert.deepEqual(Object.keys(loaded.state.plays), ["13", "14", "15", "16", "17"]);
  for (const n of [13, 14, 15, 16]) assert.deepEqual(loaded.state.plays[n]?.marks, noMarks());
  assert.deepEqual(loaded.state.plays[17]?.marks, setMark(noMarks(), 0, true));
});
