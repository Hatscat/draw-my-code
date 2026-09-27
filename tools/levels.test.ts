import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { generate, type Options } from "./levels.ts";

const TOOLS = fileURLToPath(new URL(".", import.meta.url));
const LAUNCH = { y: 2026, m: 11, d: 1 };

const body = (expression: string) => `int f(int x, int y) {\n  return ${expression};\n}\n`;

/** A throwaway repository: levels/, src/levels/ and a link to the real tools/. */
async function repo(files: Record<string, string>): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: "dmc-repo-" });
  await Deno.mkdir(`${root}/levels/tutorial`, { recursive: true });
  await Deno.mkdir(`${root}/levels/daily`, { recursive: true });
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
    strict: false,
    allowPublishedEdit: false,
    today: { y: 2026, m: 9, d: 27 },
    launch: LAUNCH,
    annotate: false,
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
    assert.ok(check.lines.includes("  changed: levels/daily/0002"));
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

Deno.test("generate refuses to change a daily whose date has come", async () => {
  const root = await repo(SEED);
  const onDay2 = { today: { y: 2026, m: 11, d: 2 } };
  try {
    await generate(options(root));
    await Deno.writeTextFile(`${root}/levels/daily/0002.c`, body("x | y"));
    const refused = await generate(options(root, onDay2));
    assert.equal(refused.ok, false);
    assert.match(refused.lines.join("\n"), /levels\/daily\/0002\.c went live on 2026-11-02/);

    const allowed = await generate(options(root, { ...onDay2, allowPublishedEdit: true }));
    assert.equal(allowed.ok, true, allowed.lines.join("\n"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("generate allows changing a daily that isn't live yet", async () => {
  const root = await repo(SEED);
  try {
    await generate(options(root));
    await Deno.writeTextFile(`${root}/levels/daily/0002.c`, body("x | y"));
    const report = await generate(options(root, { today: { y: 2026, m: 11, d: 1 } }));
    assert.equal(report.ok, true, report.lines.join("\n"));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("a short schedule warns, and fails with --strict", async () => {
  const root = await repo(SEED);
  const lastDay = { today: { y: 2026, m: 11, d: 2 } };
  const message = "Fewer than 7 days of daily puzzles left: add levels to levels/daily/";
  try {
    const warned = await generate(options(root, lastDay));
    assert.equal(warned.ok, true);
    assert.ok(warned.lines.includes("Daily puzzles scheduled until 2026-11-02 (0 days left)"));
    assert.ok(warned.lines.includes(message));

    const annotated = await generate(options(root, { ...lastDay, annotate: true }));
    assert.ok(annotated.lines.includes(`::warning title=Puzzle schedule::${message}`));

    const strict = await generate(options(root, { ...lastDay, check: true, strict: true }));
    assert.equal(strict.ok, false);
    assert.ok(strict.lines.includes(message));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
