import assert from "node:assert/strict";
import { gridFromRows } from "./grid.ts";
import { shareText } from "./share.ts";

const URL = "https://hatscat.github.io/draw-my-code/";
const RED = gridFromRows(Array<string>(8).fill("22222222"));
const BLANK = gridFromRows(Array<string>(8).fill("00000000"));

Deno.test("shareText gives nothing of the solution away: one palette line, whatever the solution", () => {
  const other = gridFromRows(Array<string>(8).fill("01234567"));
  assert.equal(shareText(1, [RED], RED, URL), shareText(1, [other], other, URL));
});

Deno.test("shareText: solved on the first attempt", () => {
  assert.equal(
    shareText(1, [RED], RED, URL),
    [
      "Draw my code #1 1/3",
      "⬛⬜🟥🟧🟨🟩🟦🟪",
      "https://hatscat.github.io/draw-my-code/",
    ].join("\n"),
  );
});

Deno.test("shareText: solved on the second attempt", () => {
  const first = gridFromRows(["22222222", "22220000", ...Array<string>(6).fill("00000000")]);
  assert.equal(
    shareText(12, [first, RED], RED, URL),
    ["Draw my code #12 2/3", "⬛⬜🟥🟧🟨🟩🟦🟪", URL].join("\n"),
  );
});

Deno.test("shareText: failed", () => {
  const top = gridFromRows(["22222222", ...Array<string>(7).fill("00000000")]);
  const almost = gridFromRows(["22222220", ...Array<string>(7).fill("22222222")]);
  assert.equal(
    shareText(12, [BLANK, top, almost], RED, URL),
    ["Draw my code #12 X/3", "⬛⬜🟥🟧🟨🟩🟦🟪", URL].join("\n"),
  );
});

Deno.test("shareText has no trailing newline", () => {
  assert.ok(shareText(1, [RED], RED, URL).endsWith(URL));
});
