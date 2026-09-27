import assert from "node:assert/strict";
import { type Token, tokenize, tokenLines } from "./tokenize.ts";

const kinds = (code: string) =>
  tokenize(code).filter((t) => t.kind !== "space").map((t) => `${t.kind}:${t.text}`);

Deno.test("tokenize colors the design's circle level", () => {
  assert.deepEqual(kinds("int f(int x, int y) {"), [
    "type:int",
    "function:f",
    "punctuation:(",
    "type:int",
    "identifier:x",
    "punctuation:,",
    "type:int",
    "identifier:y",
    "punctuation:)",
    "punctuation:{",
  ]);
  assert.deepEqual(kinds("return dx*dx + dy*dy < 9 ? 2 : 0;"), [
    "keyword:return",
    "identifier:dx",
    "operator:*",
    "identifier:dx",
    "operator:+",
    "identifier:dy",
    "operator:*",
    "identifier:dy",
    "operator:<",
    "number:9",
    "operator:?",
    "number:2",
    "operator::",
    "number:0",
    "punctuation:;",
  ]);
});

Deno.test("tokenize marks calls to abs, min and max as functions", () => {
  assert.deepEqual(kinds("max (abs(x), y)"), [
    "function:max",
    "punctuation:(",
    "function:abs",
    "punctuation:(",
    "identifier:x",
    "punctuation:)",
    "punctuation:,",
    "identifier:y",
    "punctuation:)",
  ]);
});

Deno.test("tokenize keeps multi-character operators and C numbers whole", () => {
  assert.deepEqual(kinds("x <<= 0x1F; y != 07u && z >= 1e3;"), [
    "identifier:x",
    "operator:<<=",
    "number:0x1F",
    "punctuation:;",
    "identifier:y",
    "operator:!=",
    "number:07u",
    "operator:&&",
    "identifier:z",
    "operator:>=",
    "number:1e3",
    "punctuation:;",
  ]);
});

Deno.test("tokenize reads comments, including one left unclosed", () => {
  assert.deepEqual(kinds("x; // hint: x*2\n/* two\nlines */ y /* open"), [
    "identifier:x",
    "punctuation:;",
    "comment:// hint: x*2",
    "comment:/* two\nlines */",
    "identifier:y",
    "comment:/* open",
  ]);
});

Deno.test("tokenize loses no character, whatever the input", () => {
  const inputs = [
    "int f(int x, int y) {\n  int dx = x - 4;\n  return dx < 0 ? -dx : dx;\n}",
    "@#`$\\ é 'a' \"s\" []",
    "",
    "   \n\n",
  ];
  for (const input of inputs) {
    assert.equal(tokenize(input).map((t) => t.text).join(""), input);
  }
});

Deno.test("tokenLines splits tokens at line breaks", () => {
  const lines = tokenLines("int x; /* a\nb */\n}");
  const text = (line: Token[] | undefined) => line?.map((t) => t.text).join("");
  assert.equal(lines.length, 3);
  assert.equal(text(lines[0]), "int x; /* a");
  assert.equal(text(lines[1]), "b */");
  assert.deepEqual(lines[1]?.map((t) => t.kind), ["comment"]);
  assert.equal(text(lines[2]), "}");
});

Deno.test("tokenLines keeps empty lines", () => {
  assert.deepEqual(tokenLines("a\n\nb").map((line) => line.length), [1, 0, 1]);
});
