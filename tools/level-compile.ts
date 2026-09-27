/**
 * Compiles a level with gcc against tools/harness.c, checks its symbols with nm, runs it, and
 * returns the 64 values it prints. gcc is the only judge of what a level computes.
 */

import { join } from "node:path";

/** The spec's flags, shared by every build. */
const FLAGS = [
  "-std=c11",
  "-Wall",
  "-Wextra",
  "-Werror",
  "-Wno-unused-parameter",
  "-fsanitize=undefined",
  "-fno-sanitize-recover=all",
  // Otherwise gcc inlines library builtins such as labs() even at -O0, hiding the call from nm.
  "-fno-builtin",
];

/**
 * Three builds that must print the same grid. -O1 is the spec's build and warning gate. The -O0
 * builds keep the UBSan checks that -O1 folds away, and fill locals with a nonzero pattern and
 * with zeros: a level that reads an uninitialized variable then prints different grids. The
 * analyzer catches the reads that both fills would hide, such as `v < 2`.
 */
const BUILDS = {
  O1: ["-O1"],
  O0: ["-O0", "-ftrivial-auto-var-init=pattern", "-fanalyzer"],
  Z0: ["-O0", "-ftrivial-auto-var-init=zero"],
} as const;
const BUILD_NAMES = Object.keys(BUILDS) as Build[];
type Build = keyof typeof BUILDS;

const RUN_TIMEOUT_MS = 2000;

export interface Toolchain {
  readonly prelude: string;
  readonly workDir: string;
  readonly harnessObjects: Readonly<Record<Build, string>>;
}

export type LevelResult =
  | { readonly ok: true; readonly values: readonly number[] }
  | { readonly ok: false; readonly errors: readonly string[] };

interface Output {
  readonly success: boolean;
  readonly code: number;
  readonly signal: Deno.Signal | null;
  readonly stdout: string;
  readonly stderr: string;
}

async function run(command: string, args: string[], signal?: AbortSignal): Promise<Output> {
  const output = await new Deno.Command(command, { args, stdout: "piped", stderr: "piped", signal })
    .output();
  const text = new TextDecoder();
  return {
    success: output.success,
    code: output.code,
    signal: output.signal,
    stdout: text.decode(output.stdout),
    stderr: text.decode(output.stderr).trim(),
  };
}

/** First line of `gcc --version`, printed so CI and local runs can be compared. */
export async function gccVersion(): Promise<string> {
  try {
    const { stdout } = await run("gcc", ["--version"]);
    return stdout.split("\n")[0] ?? "gcc";
  } catch {
    throw new Error("gcc not found: on Ubuntu, `sudo apt install build-essential`");
  }
}

/** Compiles the harness once per build; every level links against these objects. */
export async function prepareToolchain(toolsDir: string, workDir: string): Promise<Toolchain> {
  const prelude = join(toolsDir, "prelude.h");
  const harnessObjects = {
    O1: join(workDir, "harness.O1.o"),
    O0: join(workDir, "harness.O0.o"),
    Z0: join(workDir, "harness.Z0.o"),
  };
  for (const build of BUILD_NAMES) {
    const result = await run("gcc", [
      ...FLAGS,
      ...BUILDS[build],
      "-include",
      prelude,
      "-c",
      join(toolsDir, "harness.c"),
      "-o",
      harnessObjects[build],
    ]);
    if (!result.success) throw new Error(`tools/harness.c does not compile:\n${result.stderr}`);
  }
  return { prelude, workDir, harnessObjects };
}

/** Compiles, checks and runs one level file. `name` keeps work files apart between levels. */
export async function compileLevel(
  path: string,
  name: string,
  toolchain: Toolchain,
): Promise<LevelResult> {
  const fail = (...errors: string[]): LevelResult => ({ ok: false, errors });
  const object = (build: Build) => join(toolchain.workDir, `${name}.${build}.o`);
  const binary = (build: Build) => join(toolchain.workDir, `${name}.${build}.bin`);

  for (const build of BUILD_NAMES) {
    const compiled = await run("gcc", [
      ...FLAGS,
      ...BUILDS[build],
      "-include",
      toolchain.prelude,
      "-c",
      path,
      "-o",
      object(build),
    ]);
    if (!compiled.success) return fail(compiled.stderr);
  }

  // Checked before linking: "calls printf" is clearer than a linker error, and at -O0 with
  // -fno-builtin every call stays visible.
  const symbols = await run("nm", [object("O0")]);
  const forbidden = symbolErrors(symbols.stdout);
  if (forbidden.length > 0) return fail(...forbidden);

  const grids: number[][] = [];
  for (const build of BUILD_NAMES) {
    const linked = await run("gcc", [
      "-fsanitize=undefined",
      toolchain.harnessObjects[build],
      object(build),
      "-o",
      binary(build),
    ]);
    if (!linked.success) return fail(linked.stderr);

    const timeout = AbortSignal.timeout(RUN_TIMEOUT_MS);
    const ran = await run(binary(build), [], timeout);
    if (timeout.aborted) return fail(`did not finish within ${RUN_TIMEOUT_MS / 1000} s`);
    if (!ran.success) return fail(runFailure(ran, toolchain.prelude));
    const values = parseOutput(ran.stdout);
    if (!values) return fail(`unexpected harness output:\n${ran.stdout}`);
    grids.push(values);
  }

  const [first, ...others] = grids;
  if (!first) return fail("internal error: no build produced a grid");
  if (others.some((grid) => grid.some((value, i) => value !== first[i]))) {
    return fail(
      "the builds print different grids: the level reads an uninitialized variable or depends " +
        "on undefined behavior",
    );
  }
  const values = valueErrors(first);
  return values.length > 0 ? fail(...values) : { ok: true, values: first };
}

const ALLOWED_UNDEFINED = /^__ubsan_handle_\w+$|^__stack_chk_fail$/;
const ALLOWED_LOCAL = new Set(["abs", "min", "max"]);

/**
 * Symbols of a level's -O0 object: it may define `f` (plus the prelude helpers it uses) and may
 * call only UBSan's handlers and the stack protector that Ubuntu's gcc adds for local arrays.
 */
export function symbolErrors(nmOutput: string): string[] {
  const errors: string[] = [];
  for (const line of nmOutput.split("\n")) {
    const match = /^\s*[0-9a-f]*\s+([A-Za-z])\s+(\S+)$/.exec(line);
    if (!match) continue;
    const [, type, name] = match;
    if (type === "U") {
      if (name === "memset" || name === "memcpy") {
        // The author never wrote these: gcc adds them to fill or copy large local arrays.
        errors.push(
          `gcc inserted a call to \`${name}\`: no variable-length array or large local array; ` +
            "use a small fixed-size one such as `int t[8]`",
        );
      } else if (!name || !ALLOWED_UNDEFINED.test(name)) {
        errors.push(`calls \`${name}\`: only abs, min and max are available`);
      }
    } else if (type === "T" && name === "f") {
      continue;
    } else if (type === "t" && name && ALLOWED_LOCAL.has(name)) {
      continue;
    } else {
      errors.push(`defines \`${name}\`: a level is the single function f, with no global state`);
    }
  }
  return errors;
}

/** The harness prints 8 lines of 8 integers; anything else is a harness bug. */
export function parseOutput(stdout: string): number[] | undefined {
  const lines = stdout.trimEnd().split("\n");
  if (lines.length !== 8) return undefined;
  const values = lines.flatMap((line) => line.split(" ").map(Number));
  return values.length === 64 && values.every(Number.isInteger) ? values : undefined;
}

/** Out-of-range cells, named as calls so the author can find them, and the all-0 grid. */
export function valueErrors(values: readonly number[]): string[] {
  const outside = values
    .map((value, i) => ({ value, x: i % 8, y: Math.floor(i / 8) }))
    .filter(({ value }) => value < 0 || value > 7);
  const errors = outside.slice(0, 5).map(({ value, x, y }) =>
    `f(${x}, ${y}) = ${value}: every value must be in [0, 7]`
  );
  if (outside.length > 5) errors.push(`… and ${outside.length - 5} more cells out of range`);
  if (outside.length === 0 && values.every((value) => value === 0)) {
    errors.push("every cell is 0: submitting the blank grid would solve it");
  }
  return errors;
}

/** Explains a harness run that exited with an error: UBSan, or a crash. */
export function runFailure(output: Pick<Output, "signal" | "stderr">, prelude: string): string {
  if (output.signal) {
    return `crashed (${output.signal})` +
      (output.signal === "SIGSEGV" ? ": probably unbounded recursion" : "");
  }
  const report = output.stderr.split("\n").find((line) => line.includes("runtime error:")) ??
    output.stderr;
  // UBSan points at the prelude when the level passes INT_MIN to abs().
  return report.includes(prelude)
    ? `undefined behavior in abs(): abs(INT_MIN) overflows (${report.split("runtime error: ")[1]})`
    : report;
}
