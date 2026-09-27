import assert from "node:assert/strict";
import { ATTEMPTS } from "./config.ts";
import { gridFromRows } from "./grid.ts";
import { CORRECT_FROM, correctSince, shareText } from "./share.ts";

const URL = "https://hatscat.github.io/draw-my-code/";
const RED = gridFromRows(Array<string>(8).fill("22222222"));
const BLANK = gridFromRows(Array<string>(8).fill("00000000"));

Deno.test("there is one 'correct from' square per attempt", () => {
  assert.equal(CORRECT_FROM.length, ATTEMPTS);
});

Deno.test("shareText: solved on the first attempt", () => {
  assert.equal(
    shareText(1, [RED], RED, URL),
    [
      "Draw my code #1 1/3",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "https://hatscat.github.io/draw-my-code/",
    ].join("\n"),
  );
});

Deno.test("shareText: solved on the second attempt after a partly right first one", () => {
  const first = gridFromRows(["22222222", "22220000", ...Array<string>(6).fill("00000000")]);
  assert.equal(
    shareText(12, [first, RED], RED, URL),
    [
      "Draw my code #12 2/3",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟩🟩🟩🟩🟨🟨🟨🟨",
      "🟨🟨🟨🟨🟨🟨🟨🟨",
      "🟨🟨🟨🟨🟨🟨🟨🟨",
      "🟨🟨🟨🟨🟨🟨🟨🟨",
      "🟨🟨🟨🟨🟨🟨🟨🟨",
      "🟨🟨🟨🟨🟨🟨🟨🟨",
      "🟨🟨🟨🟨🟨🟨🟨🟨",
      "https://hatscat.github.io/draw-my-code/",
    ].join("\n"),
  );
});

Deno.test("shareText: failed, with cells that were right, then wrong, then right again", () => {
  const attempts = [
    [
      "22222222",
      "00000000",
      "00000000",
      "00000000",
      "22220000",
      "00000000",
      "00000000",
      "00000000",
    ],
    [
      "22222222",
      "22222222",
      "00000000",
      "00000000",
      "00002222",
      "00000000",
      "00000000",
      "00000000",
    ],
    [
      "22222222",
      "22222222",
      "22222222",
      "00000000",
      "22222222",
      "00000000",
      "00000000",
      "20000000",
    ],
  ].map(gridFromRows);
  assert.equal(
    shareText(12, attempts, RED, URL),
    [
      "Draw my code #12 X/3",
      "🟩🟩🟩🟩🟩🟩🟩🟩",
      "🟨🟨🟨🟨🟨🟨🟨🟨",
      "🟧🟧🟧🟧🟧🟧🟧🟧",
      "⬛⬛⬛⬛⬛⬛⬛⬛",
      "🟧🟧🟧🟧🟨🟨🟨🟨",
      "⬛⬛⬛⬛⬛⬛⬛⬛",
      "⬛⬛⬛⬛⬛⬛⬛⬛",
      "🟧⬛⬛⬛⬛⬛⬛⬛",
      "https://hatscat.github.io/draw-my-code/",
    ].join("\n"),
  );
});

Deno.test("shareText never shows colors: a blank first submit outlines the black cells", () => {
  const solution = gridFromRows(["00000000", "01234567", ...Array<string>(6).fill("00000000")]);
  const text = shareText(3, [BLANK, solution], solution, URL);
  assert.equal(text.split("\n")[1], "🟩🟩🟩🟩🟩🟩🟩🟩");
  assert.equal(text.split("\n")[2], "🟩🟨🟨🟨🟨🟨🟨🟨");
  assert.doesNotMatch(text, /[0-7]{2}|red|🟥|🟦|🟪|⬜/);
});

Deno.test("shareText has no trailing newline", () => {
  assert.ok(shareText(1, [RED], RED, URL).endsWith(URL));
});

Deno.test("correctSince is 0 for a cell wrong in the last submission", () => {
  const since = correctSince([RED, BLANK], RED);
  assert.ok(since.every((k) => k === 0));
  assert.deepEqual(correctSince([], RED).slice(0, 2), [0, 0]);
});
