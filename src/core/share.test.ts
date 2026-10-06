import assert from "node:assert/strict";
import { gridFromRows } from "./grid.ts";
import { shareText } from "./share.ts";

const URL = "https://hatscat.github.io/draw-my-code/";
const RED = gridFromRows(Array<string>(8).fill("22222222"));
const BLANK = gridFromRows(Array<string>(8).fill("00000000"));
const RED_ROWS = Array<string>(4).fill("🟥🟥🟥🟥🟥🟥🟥🟥");

Deno.test("shareText: each color is its own square, row by row", () => {
  const solution = gridFromRows([
    "01234567",
    "76543210",
    ...Array<string>(6).fill("00000000"),
  ]);
  assert.equal(
    shareText(1, [solution], solution, URL),
    [
      "Draw my code #1 1/3",
      "⬛⬜🟥🟧🟨🟩🟦🟪",
      "🟪🟦🟩🟨🟧🟥⬜⬛",
      "⬛⬛⬛⬛⬛⬛⬛⬛",
      "⬛⬛⬛⬛⬛⬛⬛⬛",
      "https://hatscat.github.io/draw-my-code/",
    ].join("\n"),
  );
});

Deno.test("shareText: only the top half shows, the bottom half stays hidden", () => {
  const solution = gridFromRows([
    ...Array<string>(4).fill("00000000"),
    ...Array<string>(4).fill("11111111"),
  ]);
  assert.equal(
    shareText(1, [solution], solution, URL),
    ["Draw my code #1 1/3", ...Array<string>(4).fill("⬛⬛⬛⬛⬛⬛⬛⬛"), URL].join("\n"),
  );
});

Deno.test("shareText: solved on the second attempt, the picture is the solution", () => {
  const first = gridFromRows(["22222222", "22220000", ...Array<string>(6).fill("00000000")]);
  assert.equal(
    shareText(12, [first, RED], RED, URL),
    ["Draw my code #12 2/3", ...RED_ROWS, URL].join("\n"),
  );
});

Deno.test("shareText: failed, it still shows the solution, never the last drawing", () => {
  const top = gridFromRows(["22222222", ...Array<string>(7).fill("00000000")]);
  const almost = gridFromRows(["22222220", ...Array<string>(7).fill("22222222")]);
  assert.equal(
    shareText(12, [BLANK, top, almost], RED, URL),
    ["Draw my code #12 X/3", ...RED_ROWS, URL].join("\n"),
  );
});

Deno.test("shareText has no trailing newline", () => {
  assert.ok(shareText(1, [RED], RED, URL).endsWith(URL));
});
