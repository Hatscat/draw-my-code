import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import type { Level } from "../src/levels/types.ts";
import {
  denoFmt,
  type LevelSet,
  preview,
  readGenerated,
  renderGenerated,
  sameLevel,
  schedule,
  toRows,
} from "./level-output.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const date = (y: number, m: number, d: number) => ({ y, m, d });

const circle: Level = {
  id: 1,
  code: 'int f(int x, int y) {\n  // "quoted" \\ backslash\n  return x & 1;\n}',
  solution: toRows(Array.from({ length: 64 }, (_, i) => i % 2)),
};
const levels: LevelSet = {
  tutorial: [{ ...circle, id: 1 }, { ...circle, id: 2 }],
  daily: [circle],
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
  assert.deepEqual(await readGenerated(`${dir}/missing.ts`), { tutorial: [], daily: [] });
  await Deno.writeTextFile(`${dir}/bad.ts`, "export const tutorial = [{ id: 'x' }];");
  assert.deepEqual(await readGenerated(`${dir}/bad.ts`), { tutorial: [], daily: [] });
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sameLevel compares code and solution", () => {
  assert.equal(sameLevel(circle, { ...circle, id: 9 }), true);
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

Deno.test("schedule counts the days left until the last daily", () => {
  const launch = date(2026, 11, 1);
  assert.deepEqual(schedule(launch, 7, date(2026, 11, 1)), {
    line: "Daily puzzles scheduled until 2026-11-07 (6 days left)",
    daysLeft: 6,
  });
  assert.deepEqual(schedule(launch, 7, date(2026, 11, 7)).daysLeft, 0);
  assert.deepEqual(schedule(launch, 7, date(2026, 11, 9)), {
    line: "Daily puzzles ran out on 2026-11-07 (2 days ago)",
    daysLeft: -2,
  });
  assert.deepEqual(schedule(launch, 0, date(2026, 11, 1)), {
    line: "No daily puzzles yet",
    daysLeft: -1,
  });
});
