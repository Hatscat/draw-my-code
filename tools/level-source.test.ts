import assert from "node:assert/strict";
import {
  displayCode,
  levelId,
  numberingErrors,
  sourceErrors,
  specialDate,
} from "./level-source.ts";

const level = (...body: string[]) => ["int f(int x, int y) {", ...body, "}", ""].join("\n");

Deno.test("levelId reads tutorial and daily file names", () => {
  assert.equal(levelId("tutorial", "01-one-cell.c"), 1);
  assert.equal(levelId("tutorial", "12-a-b-c.c"), 12);
  assert.equal(levelId("daily", "0001.c"), 1);
  assert.equal(levelId("daily", "0412.c"), 412);
});

Deno.test("levelId rejects names outside the patterns", () => {
  for (const name of ["1-one.c", "01_one.c", "01-One.c", "01-.c", "01-one.h", "00-zero.c"]) {
    assert.equal(levelId("tutorial", name), undefined, name);
  }
  for (const name of ["1.c", "00001.c", "0000.c", "0001.txt", "0001-x.c", "abcd.c"]) {
    assert.equal(levelId("daily", name), undefined, name);
  }
});

Deno.test("specialDate reads MM-DD-name.c, Feb 29 included", () => {
  assert.deepEqual(specialDate("10-31-halloween.c"), { month: 10, day: 31, name: "halloween" });
  assert.deepEqual(specialDate("02-29-leap-day.c"), { month: 2, day: 29, name: "leap-day" });
  for (const name of ["13-01-x.c", "02-30-x.c", "04-31-x.c", "1-01-x.c", "10-31.c", "10-31-X.c"]) {
    assert.equal(specialDate(name), undefined, name);
  }
});

Deno.test("numberingErrors accepts 1..n in any order", () => {
  assert.deepEqual(numberingErrors("daily", [3, 1, 2]), []);
  assert.deepEqual(numberingErrors("daily", []), []);
});

Deno.test("numberingErrors reports gaps and duplicates", () => {
  assert.deepEqual(numberingErrors("daily", [1, 2, 4]), [
    "0003 is missing: levels are numbered from 1 with no gap",
  ]);
  assert.deepEqual(numberingErrors("tutorial", [2]), [
    "01 is missing: levels are numbered from 1 with no gap",
  ]);
  assert.deepEqual(numberingErrors("daily", [1, 1]), ["two files are numbered 0001"]);
});

Deno.test("displayCode drops only the final newline", () => {
  assert.equal(displayCode(level("  return x;")), "int f(int x, int y) {\n  return x;\n}");
});

Deno.test("sourceErrors accepts a well-formed level with comments", () => {
  const source = [
    "// Hint: x runs left to right.",
    "int f(int x, int y) {",
    "  /* 0x1F and 7u are integers */",
    "  int dx = abs(x - 4), dy = 0x1F&y;",
    "",
    "  return min(dx + dy, 7u);",
    "}",
    "",
  ].join("\n");
  assert.deepEqual(sourceErrors(source), []);
});

Deno.test("sourceErrors: printable ASCII and LF only", () => {
  assert.deepEqual(sourceErrors(level("\treturn x;")), [
    "line 2: a tab (indent with spaces): only printable ASCII is allowed",
  ]);
  assert.deepEqual(sourceErrors(level("  return x;").replaceAll("\n", "\r\n")), [
    "line 1: a carriage return (use LF line endings): only printable ASCII is allowed",
    "line 2: a carriage return (use LF line endings): only printable ASCII is allowed",
    "line 3: a carriage return (use LF line endings): only printable ASCII is allowed",
  ]);
  assert.deepEqual(sourceErrors(level("  return x; // café")), [
    "line 2: U+00E9: only printable ASCII is allowed",
  ]);
  assert.deepEqual(sourceErrors("﻿" + level("  return x;")), [
    "line 1: U+FEFF: only printable ASCII is allowed",
  ]);
});

Deno.test("sourceErrors: exactly one final newline", () => {
  assert.deepEqual(sourceErrors(level("  return x;").slice(0, -1)), [
    "the file must end with a newline",
  ]);
  assert.deepEqual(sourceErrors(level("  return x;") + "\n"), [
    "remove the blank lines at the end of the file",
  ]);
});

Deno.test("sourceErrors: at most 12 lines of 36 characters", () => {
  const long = "  return x + y + x + y + x - y - x - y;";
  assert.equal(long.length, 39);
  assert.deepEqual(sourceErrors(level(long)), [
    "line 2: 39 characters, at most 36 fit a 320 px screen",
  ]);
  assert.deepEqual(sourceErrors(level(...Array(10).fill("  x++;"), "  return x;")), [
    "13 lines: at most 12 fit a 320 px screen",
  ]);
  assert.deepEqual(sourceErrors(level(...Array(9).fill("  x++;"), "  return x;")), []);
});

Deno.test("sourceErrors: trailing whitespace and indentation other than 2 spaces per level", () => {
  assert.deepEqual(sourceErrors(level("  return x; ")), ["line 2: trailing whitespace"]);
  assert.deepEqual(sourceErrors(level("   return x;")), ["line 2: indent with 2 spaces per level"]);
  assert.deepEqual(sourceErrors(level("    return x;")), [
    "line 2: indent with 2 spaces per level",
  ]);
  assert.deepEqual(sourceErrors(level("  if (x)", "    return x;", "  return y;")), []);
});

Deno.test("sourceErrors accepts a comment after the signature", () => {
  assert.deepEqual(sourceErrors("int f(int x, int y) { // a hint\n  return x;\n}\n"), []);
});

Deno.test("sourceErrors: the code starts with the exact signature", () => {
  const message = "the code must start with `int f(int x, int y) {` on its own line";
  assert.deepEqual(sourceErrors("int f(int y, int x) {\n  return x;\n}\n"), [message]);
  assert.deepEqual(sourceErrors("int g;\nint f(int x, int y) {\n  return x;\n}\n"), [message]);
  assert.deepEqual(sourceErrors("int f(int x, int y)\n{\n  return x;\n}\n"), [message]);
});

Deno.test("sourceErrors: no preprocessor, trigraphs or line continuations", () => {
  assert.deepEqual(sourceErrors("#include <stdlib.h>\n" + level("  return x;")), [
    "the code must start with `int f(int x, int y) {` on its own line",
    "line 1: no preprocessor directives",
  ]);
  assert.deepEqual(sourceErrors(level("  %:define A 1", "  return x;")), [
    "line 2: no preprocessor directives",
  ]);
  assert.deepEqual(sourceErrors(level("  return x ??- y;")), ["line 2: no trigraphs"]);
  assert.deepEqual(sourceErrors(level("  // looks harmless \\", "  x = 7;", "  return x;")), [
    "line 2: no line continuation",
  ]);
});

Deno.test("sourceErrors: no identifier starting with an underscore", () => {
  assert.deepEqual(sourceErrors(level("  return __builtin_popcount(x);")), [
    "line 2: `__builtin_popcount`: no identifier starting with _",
  ]);
  assert.deepEqual(sourceErrors(level('  _Pragma("GCC diagnostic ignored")', "  return x;")), [
    "line 2: no string or character literals: integers only",
    "line 2: `_Pragma`: no identifier starting with _",
  ]);
});

Deno.test("sourceErrors: integers only", () => {
  assert.deepEqual(sourceErrors(level("  double d = x;", "  return d;")), [
    "line 2: `double`: integers only",
  ]);
  assert.deepEqual(sourceErrors(level("  char c = x;", "  return c;")), [
    "line 2: `char`: integers only",
  ]);
  assert.deepEqual(sourceErrors(level("  return x * 0.5;")), ["line 2: `0.5`: integers only"]);
  assert.deepEqual(sourceErrors(level("  return x / 1e1;")), ["line 2: `1e1`: integers only"]);
  assert.deepEqual(sourceErrors(level("  return 0x1p3;")), ["line 2: `0x1p3`: integers only"]);
  assert.deepEqual(sourceErrors(level('  return "abc"[x];')), [
    "line 2: no string or character literals: integers only",
  ]);
  assert.deepEqual(sourceErrors(level("  return x == 'a';")), [
    "line 2: no string or character literals: integers only",
  ]);
});

Deno.test("sourceErrors ignores forbidden words inside comments", () => {
  assert.deepEqual(sourceErrors(level("  // a double #define in a comment", "  return x;")), []);
  assert.deepEqual(sourceErrors(level("  /* _Pragma 0.5 */ return x;")), []);
});
