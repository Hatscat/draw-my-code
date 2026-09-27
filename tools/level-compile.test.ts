import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import {
  compileLevel,
  type LevelResult,
  parseOutput,
  prepareToolchain,
  runFailure,
  symbolErrors,
  type Toolchain,
  valueErrors,
} from "./level-compile.ts";

const TOOLS = fileURLToPath(new URL(".", import.meta.url));
const FIXTURES = `${TOOLS}fixtures/`;

async function withToolchain(run: (toolchain: Toolchain) => Promise<void>) {
  const workDir = await Deno.makeTempDir({ prefix: "dmc-test-" });
  try {
    await run(await prepareToolchain(TOOLS, workDir));
  } finally {
    await Deno.remove(workDir, { recursive: true });
  }
}

function errorsOf(result: LevelResult): string {
  assert.equal(result.ok, false, "expected the level to be rejected");
  return result.ok ? "" : result.errors.join("\n");
}

Deno.test("compileLevel runs the harness and returns 64 values", async () => {
  await withToolchain(async (toolchain) => {
    const result = await compileLevel(`${FIXTURES}valid.c`, "valid", toolchain);
    assert.ok(result.ok);
    assert.equal(result.values.length, 64);
    assert.deepEqual(result.values.slice(0, 8), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.deepEqual(result.values.slice(56), [7, 0, 1, 2, 3, 4, 5, 6]);
  });
});

Deno.test("compileLevel rejects every broken fixture with a clear message", async () => {
  const expected: Record<string, RegExp> = {
    "compile-error.c": /compile-error\.c:2:13: error: expected expression/,
    "warning.c": /unused variable .unused. \[-Werror=unused-variable\]/,
    "out-of-range.c": /f\(7, 1\) = 8: every value must be in \[0, 7\]/,
    "all-zero.c": /every cell is 0: submitting the blank grid would solve it/,
    "ub-overflow.c": /ub-overflow\.c:2:7: runtime error: signed integer overflow/,
    "ub-shift.c": /runtime error: shift exponent 35 is too large/,
    "ub-divide-by-zero.c": /runtime error: division by zero/,
    "abs-int-min.c": /undefined behavior in abs\(\): abs\(INT_MIN\) overflows/,
    "uninitialized.c": /uninitialized/,
    "uninitialized-truth.c": /uninitialized/,
    "uninitialized-flag.c": /uninitialized/,
    "infinite-loop.c": /infinite loop/,
    "timeout.c": /did not finish within 2 s/,
    "crash.c": /crashed \(SIGSEGV\)/,
    "static-state.c": /defines `calls\.0`: a level is the single function f/,
    "external-call.c": /calls `rand`: only abs, min and max are available/,
    "builtin-call.c": /calls `labs`: only abs, min and max are available/,
    "variable-length-array.c": /variable-length array/,
  };
  await withToolchain(async (toolchain) => {
    const verdicts = await Promise.all(
      Object.keys(expected).map((file) =>
        compileLevel(`${FIXTURES}${file}`, file.replace(".c", ""), toolchain)
      ),
    );
    Object.values(expected).forEach((pattern, i) => {
      const verdict = verdicts[i];
      assert.ok(verdict);
      assert.match(errorsOf(verdict), pattern);
    });
  });
});

Deno.test("symbolErrors allows f, the prelude helpers and UBSan's handlers", () => {
  const nm = [
    "0000000000000000 T f",
    "0000000000000040 t abs",
    "                 U __ubsan_handle_add_overflow",
    "                 U __stack_chk_fail",
  ].join("\n");
  assert.deepEqual(symbolErrors(nm), []);
});

Deno.test("symbolErrors flags calls, helpers and global state", () => {
  const nm = [
    "0000000000000000 T f",
    "0000000000000040 t helper",
    "0000000000000000 b counter.0",
    "0000000000000000 D table",
    "                 U printf",
  ].join("\n");
  assert.deepEqual(symbolErrors(nm), [
    "defines `helper`: a level is the single function f, with no global state",
    "defines `counter.0`: a level is the single function f, with no global state",
    "defines `table`: a level is the single function f, with no global state",
    "calls `printf`: only abs, min and max are available",
  ]);
});

Deno.test("parseOutput reads 8 lines of 8 integers", () => {
  const grid = Array.from({ length: 8 }, (_, y) => `${y} 1 2 3 4 5 6 -7`).join("\n") + "\n";
  const values = parseOutput(grid);
  assert.equal(values?.length, 64);
  assert.equal(values?.[8], 1);
  assert.equal(values?.[63], -7);
  assert.equal(parseOutput("1 2 3\n"), undefined);
  assert.equal(parseOutput(grid.replace("5", "x")), undefined);
});

Deno.test("valueErrors lists the first out-of-range cells by call", () => {
  const values = Array.from({ length: 64 }, (_, i) => (i < 8 ? 9 : 1));
  assert.deepEqual(valueErrors(values), [
    "f(0, 0) = 9: every value must be in [0, 7]",
    "f(1, 0) = 9: every value must be in [0, 7]",
    "f(2, 0) = 9: every value must be in [0, 7]",
    "f(3, 0) = 9: every value must be in [0, 7]",
    "f(4, 0) = 9: every value must be in [0, 7]",
    "… and 3 more cells out of range",
  ]);
  assert.deepEqual(valueErrors(Array(64).fill(-1)).at(-1), "… and 59 more cells out of range");
});

Deno.test("valueErrors rejects the all-0 grid and accepts any other in range", () => {
  assert.deepEqual(valueErrors(Array(64).fill(0)), [
    "every cell is 0: submitting the blank grid would solve it",
  ]);
  assert.deepEqual(valueErrors([...Array(63).fill(0), 7]), []);
});

Deno.test("runFailure explains crashes and points abs(INT_MIN) at the level", () => {
  assert.equal(
    runFailure({ signal: "SIGSEGV", stderr: "" }, "/x/prelude.h"),
    "crashed (SIGSEGV): probably unbounded recursion",
  );
  assert.equal(runFailure({ signal: "SIGABRT", stderr: "" }, "/x/prelude.h"), "crashed (SIGABRT)");
  assert.equal(
    runFailure({ signal: null, stderr: "a.c:2:7: runtime error: division by zero\nmore" }, "/p.h"),
    "a.c:2:7: runtime error: division by zero",
  );
  assert.equal(
    runFailure(
      { signal: null, stderr: "/x/prelude.h:9:40: runtime error: negation of -2" },
      "/x/prelude.h",
    ),
    "undefined behavior in abs(): abs(INT_MIN) overflows (negation of -2)",
  );
});
