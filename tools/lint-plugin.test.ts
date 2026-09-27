import assert from "node:assert/strict";
import plugin from "./lint-plugin.ts";

function ids(file: string, source: string): string[] {
  return Deno.lint.runPlugin(plugin, file, source).map((d) => d.id);
}

const CORE = "/repo/src/core/game.ts";
const UI = "/repo/src/ui/grid.ts";

Deno.test("core-purity flags the clock and randomness in src/core", () => {
  const impure = [
    "Date.now();",
    "new Date();",
    "Date();",
    "performance.now();",
    "Math.random();",
    "crypto.randomUUID();",
    "Temporal.Now.plainDateISO();",
    "function a(clock = Date.now) { return clock; }",
    "const n = performance.now;",
    "const pick = Math.random;",
    "const url = import.meta.env.VITE_SITE_URL;",
  ];
  for (const source of impure) {
    assert.deepEqual(ids(CORE, source), ["dmc/core-purity"], source);
  }
});

Deno.test("core-purity allows pure date arithmetic in src/core", () => {
  assert.deepEqual(ids(CORE, "Date.UTC(2026, 0, 1); new Date(0); Math.floor(1.5);"), []);
  assert.deepEqual(ids(CORE, "const s = { now: 1, random: 2 }; s.now + s.random;"), []);
});

Deno.test("core-purity flags imports from src/ui in src/core", () => {
  assert.deepEqual(ids(CORE, 'import { render } from "../ui/grid.ts";'), ["dmc/core-purity"]);
  assert.deepEqual(ids(CORE, 'export * from "../ui/grid.ts";'), ["dmc/core-purity"]);
  assert.deepEqual(ids(CORE, 'export { render } from "../ui/grid.ts";'), ["dmc/core-purity"]);
  assert.deepEqual(ids(CORE, 'import { ATTEMPTS } from "./config.ts";'), []);
  assert.deepEqual(ids(CORE, 'await import("../ui/grid.ts");'), ["dmc/core-purity"]);
  assert.deepEqual(ids(CORE, "await import(path);"), ["dmc/core-purity"]);
  assert.deepEqual(ids(CORE, 'await import("./config.ts");'), []);
});

Deno.test("core-purity ignores files outside src/core", () => {
  assert.deepEqual(ids(UI, 'Date.now(); Math.random(); import "../ui/x.ts";'), []);
});

Deno.test("no-ts-directive flags every TypeScript suppression comment, with or without a reason", () => {
  for (const directive of ["@ts-ignore", "@ts-ignore: reason", "@ts-expect-error", "@ts-nocheck"]) {
    assert.deepEqual(ids(UI, `// ${directive}\nconst a = 1;`), ["dmc/no-ts-directive"], directive);
  }
  assert.deepEqual(ids(UI, "// a plain comment\nconst a = 1;"), []);
});
