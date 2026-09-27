import assert from "node:assert/strict";
import type { CalendarDate } from "./date.ts";
import { puzzleDate, puzzleNumber } from "./schedule.ts";

const date = (y: number, m: number, d: number): CalendarDate => ({ y, m, d });
const LAUNCH = date(2026, 11, 1);

Deno.test("puzzleNumber is 1 on the launch date and counts calendar days", () => {
  assert.equal(puzzleNumber(LAUNCH, date(2026, 11, 1)), 1);
  assert.equal(puzzleNumber(LAUNCH, date(2026, 11, 2)), 2);
  assert.equal(puzzleNumber(LAUNCH, date(2026, 12, 1)), 31);
  assert.equal(puzzleNumber(LAUNCH, date(2027, 1, 1)), 62);
});

Deno.test("puzzleNumber is zero or negative before launch", () => {
  assert.equal(puzzleNumber(LAUNCH, date(2026, 10, 31)), 0);
  assert.equal(puzzleNumber(LAUNCH, date(2026, 9, 27)), -34);
});

Deno.test("puzzleNumber spans leap days and DST changes as plain days", () => {
  const launch = date(2028, 2, 28);
  assert.equal(puzzleNumber(launch, date(2028, 2, 29)), 2);
  assert.equal(puzzleNumber(launch, date(2028, 3, 1)), 3);
  // Europe/Paris springs forward on 2028-03-26: still one puzzle per calendar day.
  assert.equal(
    puzzleNumber(launch, date(2028, 3, 27)) - puzzleNumber(launch, date(2028, 3, 25)),
    2,
  );
});

Deno.test("puzzleDate is the inverse of puzzleNumber", () => {
  assert.deepEqual(puzzleDate(LAUNCH, 1), LAUNCH);
  assert.deepEqual(puzzleDate(LAUNCH, 62), date(2027, 1, 1));
  for (let n = -5; n <= 800; n++) {
    assert.equal(puzzleNumber(LAUNCH, puzzleDate(LAUNCH, n)), n);
  }
});
