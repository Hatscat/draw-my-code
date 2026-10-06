import assert from "node:assert/strict";
import { CELLS } from "./grid.ts";
import { marksFromString, marksToString, noMarks, setMark } from "./marks.ts";

const dots = (marks: readonly boolean[]) => marks.flatMap((mark, i) => (mark ? [i] : []));

Deno.test("noMarks: no dot on any of the 64 cells", () => {
  assert.equal(noMarks().length, CELLS);
  assert.deepEqual(dots(noMarks()), []);
});

Deno.test("setMark sets one dot and returns the same marks when nothing changes", () => {
  const marks = setMark(noMarks(), 9, true);
  assert.deepEqual(dots(marks), [9]);
  assert.equal(setMark(marks, 9, true), marks);
  assert.equal(setMark(marks, 10, false), marks);
  assert.deepEqual(dots(setMark(marks, 9, false)), []);
});

Deno.test("setMark ignores an index outside the grid", () => {
  const marks = noMarks();
  assert.equal(setMark(marks, -1, true), marks);
  assert.equal(setMark(marks, CELLS, true), marks);
});

Deno.test("marks round-trip through their stored form, 64 zeros and ones", () => {
  const marks = setMark(setMark(noMarks(), 0, true), 63, true);
  const text = marksToString(marks);
  assert.equal(text, "1" + "0".repeat(62) + "1");
  assert.deepEqual(marksFromString(text), marks);
});

Deno.test("marksFromString rejects anything but 64 zeros and ones", () => {
  for (const text of ["", "0".repeat(63), "0".repeat(65), "2".repeat(64), "0".repeat(63) + "x"]) {
    assert.equal(marksFromString(text), undefined, text);
  }
});
