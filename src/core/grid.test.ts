import assert from "node:assert/strict";
import {
  blankGrid,
  cellIndex,
  CELLS,
  type Color,
  gridFromRows,
  gridFromString,
  gridToString,
  isColor,
  sameGrid,
  setCell,
  wrongCount,
} from "./grid.ts";

const digits = "0123456701234567012345670123456701234567012345670123456701234567";

Deno.test("isColor accepts the 8 palette indexes only", () => {
  for (const value of [0, 1, 7]) assert.equal(isColor(value), true);
  for (const value of [-1, 8, 1.5, NaN, "1", null, undefined]) assert.equal(isColor(value), false);
});

Deno.test("cellIndex walks rows top to bottom, x left to right", () => {
  assert.equal(cellIndex(0, 0), 0);
  assert.equal(cellIndex(7, 0), 7);
  assert.equal(cellIndex(0, 1), 8);
  assert.equal(cellIndex(3, 4), 35);
  assert.equal(cellIndex(7, 7), 63);
});

Deno.test("blankGrid is 64 black cells", () => {
  const grid = blankGrid();
  assert.equal(grid.length, CELLS);
  assert.ok(grid.every((cell) => cell === 0));
});

Deno.test("gridFromString and gridToString round-trip 64 digits", () => {
  const grid = gridFromString(digits);
  assert.ok(grid);
  assert.equal(grid[9], 1);
  assert.equal(gridToString(grid), digits);
});

Deno.test("gridFromString rejects anything but 64 digits in [0, 7]", () => {
  for (const bad of ["", digits.slice(1), digits + "0", digits.replace("7", "8"), ` ${digits}`]) {
    assert.equal(gridFromString(bad), undefined, JSON.stringify(bad));
  }
});

Deno.test("gridFromRows reads a generated solution and rejects malformed ones", () => {
  const rows = Array<string>(8).fill("01234567");
  assert.equal(gridFromRows(rows)[cellIndex(7, 7)], 7);
  assert.throws(() => gridFromRows(rows.slice(1)), /Malformed solution/);
  assert.throws(() => gridFromRows([...rows.slice(1), "0123456"]), /Malformed solution/);
});

Deno.test("setCell returns a new grid, and the same one when nothing changes", () => {
  const grid = blankGrid();
  const painted = setCell(grid, 35, 2);
  assert.notEqual(painted, grid);
  assert.equal(painted[35], 2);
  assert.equal(grid[35], 0, "the original grid is untouched");
  assert.equal(setCell(painted, 35, 2), painted);
  assert.equal(setCell(grid, 64, 2), grid);
  assert.equal(setCell(grid, -1, 2), grid);
});

Deno.test("sameGrid compares every cell", () => {
  assert.equal(sameGrid(blankGrid(), blankGrid()), true);
  assert.equal(sameGrid(blankGrid(), setCell(blankGrid(), 63, 1)), false);
});

Deno.test("wrongCount counts the cells that differ from the solution", () => {
  const solution = gridFromRows(Array<string>(8).fill("22222222"));
  assert.equal(wrongCount(blankGrid(), solution), 64);
  assert.equal(wrongCount(solution, solution), 0);
  const almost = [3, 9, 63].reduce((grid, i) => setCell(grid, i, 1 as Color), solution);
  assert.equal(wrongCount(almost, solution), 3);
});
