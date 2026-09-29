import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import type { Level } from "../src/levels/types.ts";
import {
  denoFmt,
  type LevelSet,
  NO_LEVELS,
  preview,
  readGenerated,
  renderGenerated,
  sameLevel,
  toRows,
} from "./level-output.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const circle: Level = {
  id: 1,
  code: 'int f(int x, int y) {\n  // "quoted" \\ backslash\n  return x & 1;\n}',
  solution: toRows(Array.from({ length: 64 }, (_, i) => i % 2)),
};
const levels: LevelSet = {
  tutorial: [{ ...circle, id: 1 }, { ...circle, id: 2 }],
  daily: [circle],
  special: [{ month: 10, day: 31, name: "ghost", code: circle.code, solution: circle.solution }],
  epochs: [{ from: 1, size: 1, start: 0 }],
};

Deno.test("toRows groups the 64 values as 8 rows of 8 digits", () => {
  const rows = toRows(Array.from({ length: 64 }, (_, i) => i % 8));
  assert.equal(rows.length, 8);
  assert.ok(rows.every((row) => row === "01234567"));
});

Deno.test("renderGenerated round-trips through deno fmt and readGenerated", async () => {
  const text = await denoFmt(renderGenerated(levels), ROOT);
  const dir = await Deno.makeTempDir({ prefix: "dmc-generated-" });
  await Deno.writeTextFile(`${dir}/generated.ts`, text);
  assert.deepEqual(await readGenerated(`${dir}/generated.ts`), levels);
  await Deno.remove(dir, { recursive: true });
  // One solution row per line, so drawings stay readable in diffs.
  assert.match(text, /\n {4}"01010101",\n/);
  assert.equal(await denoFmt(text, ROOT), text);
});

Deno.test("readGenerated reads a missing or malformed file as no levels", async () => {
  const dir = await Deno.makeTempDir({ prefix: "dmc-generated-" });
  assert.deepEqual(await readGenerated(`${dir}/missing.ts`), NO_LEVELS);
  await Deno.writeTextFile(`${dir}/bad.ts`, "export const tutorial = [{ id: 'x' }];");
  assert.deepEqual(await readGenerated(`${dir}/bad.ts`), NO_LEVELS);
  // A file from before specials and epochs reads with none of them.
  await Deno.writeTextFile(`${dir}/old.ts`, "export const tutorial = []; export const daily = [];");
  assert.deepEqual(await readGenerated(`${dir}/old.ts`), NO_LEVELS);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sameLevel compares code and solution", () => {
  assert.equal(sameLevel(circle, { code: circle.code, solution: circle.solution }), true);
  assert.equal(sameLevel(circle, { ...circle, code: circle.code + " " }), false);
  assert.equal(sameLevel(circle, { ...circle, solution: toRows(Array(64).fill(1)) }), false);
});

Deno.test("preview shows the code next to a truecolor grid", () => {
  const text = preview("new: daily #1", circle);
  const lines = text.split("\n");
  assert.equal(lines[0], "new: daily #1");
  assert.equal(lines.length, 1 + 8);
  assert.ok(lines[1]?.startsWith("  int f(int x, int y) {"));
  assert.ok(lines[1]?.includes("\x1b[48;2;0;0;0m  \x1b[0m\x1b[48;2;243;242;236m  \x1b[0m"));
});
