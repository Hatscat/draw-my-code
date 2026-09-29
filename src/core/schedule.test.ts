import assert from "node:assert/strict";
import type { Level, SpecialLevel } from "../levels/types.ts";
import type { CalendarDate } from "./date.ts";
import {
  dailyFor,
  growEpochs,
  levelFor,
  type Levels,
  poolIndex,
  puzzleDate,
  puzzleNumber,
} from "./schedule.ts";

const date = (y: number, m: number, d: number): CalendarDate => ({ y, m, d });
const LAUNCH = date(2026, 11, 1);
const level = (id: number): Level => ({ id, code: `pool ${id}`, solution: [] });
const special = (month: number, day: number, name: string): SpecialLevel => ({
  month,
  day,
  name,
  code: name,
  solution: [],
});
const POOL = [level(1), level(2), level(3)];
const LEVELS: Levels = {
  daily: POOL,
  special: [special(12, 25, "christmas")],
  epochs: [{ from: 1, size: 3, start: 0 }],
};

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

Deno.test("dailyFor: before launch, then a puzzle every day, forever", () => {
  assert.deepEqual(dailyFor(LAUNCH, date(2026, 10, 31), LEVELS), {
    kind: "before-launch",
    launch: LAUNCH,
  });
  assert.deepEqual(dailyFor(LAUNCH, date(2026, 11, 1), LEVELS), {
    kind: "puzzle",
    number: 1,
    level: POOL[0],
  });
  // Ten years on, still a puzzle.
  assert.equal(dailyFor(LAUNCH, date(2036, 11, 1), LEVELS).kind, "puzzle");
});

Deno.test("levelFor loops over the pool: after the last level comes the first again", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((n) => levelFor(LEVELS, LAUNCH, n)), [
    POOL[0],
    POOL[1],
    POOL[2],
    POOL[0],
    POOL[1],
    POOL[2],
    POOL[0],
  ]);
});

Deno.test("levelFor shows a special on its date every year, and the loop carries on around it", () => {
  const christmas = puzzleNumber(LAUNCH, date(2026, 12, 25));
  assert.equal(levelFor(LEVELS, LAUNCH, christmas).code, "christmas");
  assert.equal(
    levelFor(LEVELS, LAUNCH, puzzleNumber(LAUNCH, date(2027, 12, 25))).code,
    "christmas",
  );
  // The day after, the pool goes on as if the special weren't there: nothing shifts.
  assert.equal(levelFor(LEVELS, LAUNCH, christmas + 1), POOL[christmas % 3]);
});

Deno.test("a special on Feb 29 shows in leap years only", () => {
  const levels = { ...LEVELS, special: [special(2, 29, "leap")] };
  assert.equal(levelFor(levels, LAUNCH, puzzleNumber(LAUNCH, date(2028, 2, 29))).code, "leap");
  assert.notEqual(levelFor(levels, LAUNCH, puzzleNumber(LAUNCH, date(2027, 3, 1))).code, "leap");
});

Deno.test("levelFor throws when no epoch covers the puzzle: the generator prevents it", () => {
  assert.throws(() => levelFor({ ...LEVELS, epochs: [] }, LAUNCH, 1), /no epoch covers puzzle 1/);
  assert.throws(() => levelFor({ ...LEVELS, daily: [] }, LAUNCH, 1), /no daily level/);
});

Deno.test("poolIndex follows the latest epoch that has started", () => {
  const epochs = [{ from: 1, size: 3, start: 0 }, { from: 10, size: 5, start: 1 }];
  assert.deepEqual([1, 2, 3, 4, 9].map((n) => poolIndex(epochs, n)), [0, 1, 2, 0, 2]);
  assert.deepEqual([10, 11, 13, 14, 15].map((n) => poolIndex(epochs, n)), [1, 2, 4, 0, 1]);
  assert.throws(() => poolIndex([{ from: 5, size: 3, start: 0 }], 4), /no epoch covers puzzle 4/);
});

Deno.test("growEpochs: before launch or for a first pool, a single epoch from puzzle 1", () => {
  assert.deepEqual(growEpochs([], 84, 1), [{ from: 1, size: 84, start: 0 }]);
  assert.deepEqual(growEpochs([{ from: 1, size: 84, start: 0 }], 90, -20), [
    { from: 1, size: 90, start: 0 },
  ]);
  assert.deepEqual(growEpochs([], 84, 30), [{ from: 1, size: 84, start: 0 }]);
});

Deno.test("growEpochs keeps the epochs when the pool size is unchanged", () => {
  const epochs = [{ from: 1, size: 3, start: 0 }];
  assert.deepEqual(growEpochs(epochs, 3, 50), epochs);
});

Deno.test("a pool that grows after launch changes no past day, and the loop carries on", () => {
  const before: Levels = { daily: POOL, special: [], epochs: [{ from: 1, size: 3, start: 0 }] };
  // On puzzle day 8 two levels are added; the change applies from puzzle 9 on.
  const grown = [...POOL, level(4), level(5)];
  const after: Levels = { daily: grown, special: [], epochs: growEpochs(before.epochs, 5, 9) };
  for (let n = 1; n <= 8; n++) {
    assert.equal(levelFor(after, LAUNCH, n), levelFor(before, LAUNCH, n), `puzzle ${n}`);
  }
  // Puzzle 8 showed pool index 1; 9 carries on with index 2, then the new levels.
  assert.deepEqual([9, 10, 11, 12].map((n) => levelFor(after, LAUNCH, n)), [
    grown[2],
    grown[3],
    grown[4],
    grown[0],
  ]);
});

Deno.test("growEpochs replaces an epoch that hasn't started yet", () => {
  const epochs = [{ from: 1, size: 3, start: 0 }, { from: 20, size: 5, start: 1 }];
  assert.deepEqual(growEpochs(epochs, 6, 20), [
    { from: 1, size: 3, start: 0 },
    { from: 20, size: 6, start: 1 },
  ]);
});

Deno.test("growEpochs wraps the start into a pool that shrank", () => {
  const epochs = [{ from: 1, size: 10, start: 0 }];
  // Puzzle 9 would show index 8, beyond a 5-level pool: it wraps to 3.
  assert.deepEqual(growEpochs(epochs, 5, 9)[1], { from: 9, size: 5, start: 3 });
});

Deno.test("a pool that shrank still gives every past and future puzzle a level", () => {
  const pool = Array.from({ length: 10 }, (_, i) => level(i + 1));
  const epochs = [{ from: 1, size: 10, start: 0 }];
  // On puzzle day 20, levels 6 to 10 were removed: puzzles 16 to 20 pointed at them.
  const shrunk: Levels = {
    daily: pool.slice(0, 5),
    special: [],
    epochs: growEpochs(epochs, 5, 21),
  };
  for (let n = 1; n <= 40; n++) {
    assert.ok(shrunk.daily.includes(levelFor(shrunk, LAUNCH, n) as Level), `puzzle ${n}`);
  }
  // Past indexes wrap at the pool's current length: puzzle 16 showed index 5, now index 0.
  assert.equal(levelFor(shrunk, LAUNCH, 16), shrunk.daily[0]);
});
