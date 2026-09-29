import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readGenerated } from "./level-output.ts";
import { generate, type Options } from "./levels.ts";

const TOOLS = fileURLToPath(new URL(".", import.meta.url));
const LAUNCH = { y: 2026, m: 11, d: 1 };

const body = (expression: string) => `int f(int x, int y) {\n  return ${expression};\n}\n`;

/** A throwaway repository: levels/, src/levels/ and a link to the real tools/. */
async function repo(files: Record<string, string>): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: "dmc-repo-" });
  await Deno.mkdir(`${root}/levels/tutorial`, { recursive: true });
  await Deno.mkdir(`${root}/levels/daily`, { recursive: true });
  await Deno.mkdir(`${root}/levels/special`, { recursive: true });
  await Deno.mkdir(`${root}/src/levels`, { recursive: true });
  await Deno.symlink(TOOLS, `${root}/tools`);
  for (const [path, text] of Object.entries(files)) {
    await Deno.writeTextFile(`${root}/${path}`, text);
  }
  return root;
}

function options(root: string, overrides: Partial<Options> = {}): Options {
  return {
    root,
    check: false,
    allowPublishedEdit: false,
    today: { y: 2026, m: 9, d: 27 },
    launch: LAUNCH,
    ...overrides,
  };
}

const SEED = {
  "levels/tutorial/01-return-x.c": body("x"),
  "levels/daily/0001.c": body("x ^ y"),
  "levels/daily/0002.c": body("(x & y) == 0"),
};

Deno.test("generate writes generated.ts, deterministically, and --check then passes", async () => {
  const root = await repo(SEED);
  try {
    const first = await generate(options(root));
    assert.equal(first.ok, true, first.lines.join("\n"));
    assert.ok(first.lines.includes("Wrote src/levels/generated.ts"));
    const written = await Deno.readTextFile(`${root}/src/levels/generated.ts`);
    assert.match(written, /export const daily: readonly Level\[\] = \[/);

    const second = await generate(options(root));
    assert.equal(second.ok, true);
    assert.ok(!second.lines.includes("Wrote src/levels/generated.ts"));
    assert.equal(await Deno.readTextFile(`${root}/src/levels/generated.ts`), written);

    const check = await generate(options(root, { check: true }));
    assert.equal(check.ok, true, check.lines.join("\n"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("--check fails when a level changed since the last generation", async () => {
  const root = await repo(SEED);
  try {
    await generate(options(root));
    await Deno.writeTextFile(`${root}/levels/daily/0002.c`, body("x | y"));
    const check = await generate(options(root, { check: true }));
    assert.equal(check.ok, false);
    assert.ok(
      check.lines.includes("src/levels/generated.ts is out of date: run `deno task levels`"),
    );
    assert.ok(check.lines.includes("  changed: levels/daily/0002.c"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("generate rejects numbering gaps and misnamed files", async () => {
  const root = await repo({
    "levels/daily/0001.c": body("x"),
    "levels/daily/0003.c": body("y"),
    "levels/daily/notes.c": body("y"),
  });
  try {
    const report = await generate(options(root));
    assert.equal(report.ok, false);
    assert.ok(report.lines.includes("levels/daily/notes.c: name level files NNNN.c (e.g. 0001.c)"));
    assert.ok(
      report.lines.includes(
        "levels/daily: 0002 is missing: levels are numbered from 1 with no gap",
      ),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("generate names the failing file and writes nothing", async () => {
  const root = await repo({
    "levels/daily/0001.c": body("x + y"),
    "levels/daily/0002.c": body("x ").replace("x ;", "x; "),
  });
  try {
    const report = await generate(options(root));
    assert.equal(report.ok, false);
    const text = report.lines.join("\n");
    assert.match(
      text,
      /✗ levels\/daily\/0001\.c\n {4}f\(7, 1\) = 8: every value must be in \[0, 7\]/,
    );
    assert.match(text, /✗ levels\/daily\/0002\.c\n {4}line 2: trailing whitespace/);
    await assert.rejects(Deno.stat(`${root}/src/levels/generated.ts`), Deno.errors.NotFound);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

/** Ten dailies, each drawing a different grid. */
const TEN = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [
    `levels/daily/${String(i + 1).padStart(4, "0")}.c`,
    body(`(x + ${i}) % 8`),
  ]),
);
async function levelsIn(root: string) {
  const levels = await readGenerated(`${root}/src/levels/generated.ts`);
  if (!levels) throw new Error("generated.ts can't be read");
  return levels;
}

Deno.test("generate refuses to change what an open puzzle shows: today's or the past week's", async () => {
  const root = await repo(TEN);
  // Nov 3 is puzzle 3: puzzles 1 to 3 are open, and they show pool levels 1 to 3.
  const onDay3 = { today: { y: 2026, m: 11, d: 3 } };
  try {
    await generate(options(root));
    await Deno.writeTextFile(`${root}/levels/daily/0002.c`, body("x | y"));
    const refused = await generate(options(root, onDay3));
    assert.equal(refused.ok, false);
    assert.match(refused.lines.join("\n"), /puzzle #2 \(2026-11-02\) would change/);

    const allowed = await generate(options(root, { ...onDay3, allowPublishedEdit: true }));
    assert.equal(allowed.ok, true, allowed.lines.join("\n"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("generate lets a level change while no open puzzle shows it", async () => {
  const root = await repo(TEN);
  try {
    await generate(options(root));
    await Deno.writeTextFile(`${root}/levels/daily/0009.c`, body("x | y"));
    const report = await generate(options(root, { today: { y: 2026, m: 11, d: 3 } }));
    assert.equal(report.ok, true, report.lines.join("\n"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("a pool that grows after launch loops on from tomorrow, and no open puzzle changes", async () => {
  const root = await repo(SEED);
  // Nov 5 is puzzle 5: with 2 levels, puzzle 6 would show level 2 (index 1).
  const onDay5 = { today: { y: 2026, m: 11, d: 5 } };
  try {
    await generate(options(root));
    assert.deepEqual((await levelsIn(root)).epochs, [{ from: 1, size: 2, start: 0 }]);
    await Deno.writeTextFile(`${root}/levels/daily/0003.c`, body("x & 3"));
    const grown = await generate(options(root, onDay5));
    assert.equal(grown.ok, true, grown.lines.join("\n"));
    assert.deepEqual((await levelsIn(root)).epochs, [
      { from: 1, size: 2, start: 0 },
      { from: 6, size: 3, start: 1 },
    ]);
    // Regenerating another day keeps the epochs: --check still passes.
    const check = await generate(options(root, { check: true, today: { y: 2026, m: 11, d: 20 } }));
    assert.equal(check.ok, true, check.lines.join("\n"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("specials: MM-DD-name.c, a real date, one level per date", async () => {
  const root = await repo({
    ...SEED,
    "levels/special/10-31-ghost.c": body("x == y"),
    "levels/special/02-29-leap.c": body("x != y"),
  });
  try {
    const report = await generate(options(root));
    assert.equal(report.ok, true, report.lines.join("\n"));
    // Sorted by date, with the name from the file.
    const { special } = await levelsIn(root);
    assert.deepEqual(special.map(({ month, day, name }) => [month, day, name]), [
      [2, 29, "leap"],
      [10, 31, "ghost"],
    ]);

    await Deno.writeTextFile(`${root}/levels/special/10-31-pumpkin.c`, body("x"));
    await Deno.writeTextFile(`${root}/levels/special/02-30-never.c`, body("x"));
    const refused = await generate(options(root));
    assert.equal(refused.ok, false);
    const lines = refused.lines.join("\n");
    assert.match(
      lines,
      /levels\/special\/10-31-pumpkin\.c: levels\/special\/10-31-ghost\.c already has this date/,
    );
    assert.match(lines, /levels\/special\/02-30-never\.c: name special levels MM-DD-name\.c/);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("a special goes through the same checks as any level", async () => {
  const root = await repo({ ...SEED, "levels/special/12-25-tree.c": body("x +") });
  try {
    const report = await generate(options(root));
    assert.equal(report.ok, false);
    assert.match(report.lines.join("\n"), /✗ levels\/special\/12-25-tree\.c/);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("the daily pool can't be empty", async () => {
  const root = await repo({ "levels/tutorial/01-return-x.c": body("x") });
  try {
    const report = await generate(options(root));
    assert.equal(report.ok, false);
    assert.ok(report.lines.includes("levels/daily: add a level: the daily pool is empty"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("the report sums up the pool and the date", async () => {
  const root = await repo(SEED);
  try {
    const before = await generate(options(root));
    assert.ok(
      before.lines.includes(
        "1 tutorial levels, 2 daily levels (one loop every 2 days), 0 special dates",
      ),
    );
    assert.ok(before.lines.includes("Puzzle #1 on 2026-11-01"));
    const after = await generate(options(root, { today: { y: 2026, m: 11, d: 9 } }));
    assert.ok(after.lines.includes("Today, in UTC+14: puzzle #9"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("after launch, an unreadable generated.ts stops the generator: its epochs are state", async () => {
  const root = await repo(TEN);
  const onDay5 = { today: { y: 2026, m: 11, d: 5 } };
  try {
    await generate(options(root));
    await Deno.writeTextFile(`${root}/src/levels/generated.ts`, "<<<<<<< HEAD\nbroken\n");
    const refused = await generate(options(root, onDay5));
    assert.equal(refused.ok, false);
    assert.match(refused.lines.join("\n"), /src\/levels\/generated\.ts can't be read/);
    // Before launch there is nothing to keep: it regenerates.
    assert.equal((await generate(options(root))).ok, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("the frozen window reaches back to the oldest puzzle open anywhere, in UTC-12", async () => {
  const root = await repo(TEN);
  // Nov 12 in UTC+14 is puzzle 12; UTC-12 can still be on Nov 10, with puzzle 3 open there.
  const onDay12 = { today: { y: 2026, m: 11, d: 12 } };
  try {
    await generate(options(root));
    await Deno.writeTextFile(`${root}/levels/daily/0003.c`, body("x | y"));
    const refused = await generate(options(root, onDay12));
    assert.equal(refused.ok, false);
    assert.match(refused.lines.join("\n"), /puzzle #3 \(2026-11-03\) would change/);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("--check with --base freezes open puzzles against the deployed schedule", async () => {
  const root = await repo(TEN);
  try {
    // Deployed on Nov 1 with ten levels.
    await generate(options(root));
    const deployed = await levelsIn(root);
    // Level 6, shown on Nov 6, is edited on Nov 1: allowed then, since nobody could open it yet.
    await Deno.writeTextFile(`${root}/levels/daily/0006.c`, body("x | y"));
    assert.equal((await generate(options(root, { today: LAUNCH }))).ok, true);
    // Pushed on Nov 8: puzzle 6 is open by then, and players have the deployed version.
    const late = { check: true, today: { y: 2026, m: 11, d: 8 } };
    assert.equal((await generate(options(root, late))).ok, true);
    const refused = await generate(options(root, { ...late, base: deployed }));
    assert.equal(refused.ok, false);
    assert.match(refused.lines.join("\n"), /puzzle #6 \(2026-11-06\) would change/);
    // CI can't take the flag: the refusal names the commit message marker CI reads instead.
    assert.match(refused.lines.join("\n"), /\[allow-published-edit\] in the commit message/);
    const meant = await generate(
      options(root, { ...late, base: deployed, allowPublishedEdit: true }),
    );
    assert.equal(meant.ok, true, meant.lines.join("\n"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
