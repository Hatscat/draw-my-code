import assert from "node:assert/strict";
import { computeStats, isResult, type Results } from "./stats.ts";

Deno.test("isResult accepts 1 to 3 and X", () => {
  for (const value of [1, 2, 3, "X"]) assert.equal(isResult(value), true);
  for (const value of [0, 4, 1.5, "x", "1", null]) assert.equal(isResult(value), false);
});

Deno.test("computeStats with nothing played", () => {
  assert.deepEqual(computeStats({}, 5), {
    played: 0,
    winPercent: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0],
  });
});

Deno.test("computeStats counts played, win % and the 1/2/3/X distribution", () => {
  const results: Results = { 1: 1, 2: 2, 3: "X", 4: 2, 5: 3 };
  const stats = computeStats(results, 5);
  assert.equal(stats.played, 5);
  assert.equal(stats.winPercent, 80);
  assert.deepEqual(stats.distribution, [1, 2, 1, 1]);
});

Deno.test("win % rounds down: 199 of 200 is 99%, a single loss is 0%", () => {
  const nearlyAll: Record<number, 1 | "X"> = { 1: "X" };
  for (let n = 2; n <= 200; n++) nearlyAll[n] = 1;
  assert.equal(computeStats(nearlyAll, 200).winPercent, 99);
  assert.equal(computeStats({ 1: "X" }, 1).winPercent, 0);
});

Deno.test("the current streak includes today once solved", () => {
  assert.equal(computeStats({ 3: 1, 4: 2, 5: 1 }, 5).currentStreak, 3);
});

Deno.test("an unplayed today keeps yesterday's streak", () => {
  assert.equal(computeStats({ 3: 1, 4: 2 }, 5).currentStreak, 2);
});

Deno.test("a missed day resets the current streak", () => {
  assert.equal(computeStats({ 1: 1, 2: 1, 3: 1 }, 5).currentStreak, 0);
  assert.equal(computeStats({ 1: 1, 2: 1, 4: 1, 5: 1 }, 5).currentStreak, 2);
});

Deno.test("a failed day resets the current streak", () => {
  assert.equal(computeStats({ 3: 1, 4: 1, 5: "X" }, 5).currentStreak, 0);
  assert.equal(computeStats({ 3: 1, 4: "X" }, 5).currentStreak, 0);
});

Deno.test("the max streak is the longest run of consecutive solved puzzles", () => {
  const results: Results = { 1: 1, 2: 1, 3: 1, 4: "X", 5: 2, 7: 1, 8: 1, 9: 1, 10: 1 };
  assert.equal(computeStats(results, 12).maxStreak, 4);
  assert.equal(computeStats(results, 12).currentStreak, 0);
});

Deno.test("results dated after today (clock moved back) don't count as the current streak", () => {
  const results: Results = { 4: 1, 5: 1, 9: 1 };
  assert.equal(computeStats(results, 5).currentStreak, 2);
  assert.equal(computeStats(results, 5).played, 3);
});
