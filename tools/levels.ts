/**
 * Level generator: `deno task levels` compiles every level with gcc, validates it and regenerates
 * src/levels/generated.ts; `deno task levels:check` fails if that file is stale. See docs/spec.md,
 * "Levels".
 */

import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATCH_UP_DAYS, LAUNCH_DATE } from "../src/core/config.ts";
import { type CalendarDate, formatIsoDate } from "../src/core/date.ts";
import { growEpochs, levelFor, puzzleDate, puzzleNumber } from "../src/core/schedule.ts";
import type { Level, Puzzle, SpecialLevel } from "../src/levels/types.ts";
import { compileLevel, gccVersion, prepareToolchain, type Toolchain } from "./level-compile.ts";
import {
  denoFmt,
  type LevelSet,
  preview,
  readGenerated,
  renderGenerated,
  sameLevel,
  toRows,
} from "./level-output.ts";
import {
  displayCode,
  FILE_NAME_HELP,
  formatId,
  levelId,
  type LevelKind,
  numberingErrors,
  sourceErrors,
  SPECIAL_NAME_HELP,
  specialDate,
} from "./level-source.ts";

export interface Options {
  /** Repository root, holding levels/, tools/ and src/levels/. */
  readonly root: string;
  /** Compare instead of writing. */
  readonly check: boolean;
  /** Allow changing what a puzzle players can still open shows: today's or the past week's. */
  readonly allowPublishedEdit: boolean;
  /** Today in UTC+14, the first time zone to reach each date. */
  readonly today: CalendarDate;
  readonly launch: CalendarDate;
}

export interface Report {
  readonly ok: boolean;
  readonly lines: readonly string[];
}

const KINDS: readonly LevelKind[] = ["tutorial", "daily"];
const OUTPUT = "src/levels/generated.ts";

type LevelFile =
  | { readonly kind: LevelKind; readonly id: number; readonly path: string; readonly label: string }
  | {
    readonly kind: "special";
    readonly month: number;
    readonly day: number;
    readonly name: string;
    readonly path: string;
    readonly label: string;
  };

export async function generate(options: Options): Promise<Report> {
  const lines: string[] = [];
  const errors: string[] = [];

  const files = await findLevelFiles(options.root, errors);
  const workDir = await Deno.makeTempDir({ prefix: "dmc-levels-" });
  const built: { file: LevelFile; puzzle: Puzzle }[] = [];
  try {
    lines.push(await gccVersion());
    const toolchain = await prepareToolchain(join(options.root, "tools"), workDir);
    const results = await mapPool(
      files,
      navigator.hardwareConcurrency || 4,
      (file) => buildLevel(file, toolchain, options.root),
    );
    for (const result of results) {
      if ("errors" in result) errors.push(...result.errors);
      else built.push(result);
    }
  } finally {
    await Deno.remove(workDir, { recursive: true });
  }
  if (errors.length > 0) return { ok: false, lines: [...lines, ...errors] };

  const numbered = (kind: LevelKind): Level[] =>
    built.flatMap(({ file, puzzle }) =>
      file.kind === kind && "id" in file ? [{ id: file.id, ...puzzle }] : []
    );
  const special: SpecialLevel[] = built.flatMap(({ file, puzzle }) =>
    file.kind === "special" && "month" in file
      ? [{ month: file.month, day: file.day, name: file.name, ...puzzle }]
      : []
  ).sort((a, b) => a.month - b.month || a.day - b.day);
  const daily = numbered("daily");
  if (daily.length === 0) {
    return { ok: false, lines: [...lines, "levels/daily: add a level: the daily pool is empty"] };
  }

  const outputPath = join(options.root, OUTPUT);
  const previous = await readGenerated(outputPath);
  const today = puzzleNumber(options.launch, options.today);
  const levels: LevelSet = {
    tutorial: numbered("tutorial"),
    daily,
    special,
    // A new pool size applies from tomorrow, anywhere: today and before keep their levels.
    epochs: growEpochs(previous.epochs, daily.length, today + 1),
  };
  const generated = await denoFmt(renderGenerated(levels), options.root);
  const existing = await readTextOr(outputPath, "");
  const changes = diff(previous, levels);

  if (!options.allowPublishedEdit) {
    errors.push(...openPuzzleChanges(previous, levels, options.launch, today));
  }

  if (options.check) {
    if (generated !== existing) {
      errors.push(`${OUTPUT} is out of date: run \`deno task levels\``);
      for (const { title } of changes) errors.push(`  ${title}`);
    }
  } else if (errors.length === 0) {
    for (const { title, puzzle } of changes) {
      lines.push("", puzzle ? preview(title, puzzle) : title);
    }
    if (generated !== existing) {
      await Deno.writeTextFile(outputPath, generated);
      lines.push("", `Wrote ${OUTPUT}`);
    }
  }

  lines.push(
    "",
    `${levels.tutorial.length} tutorial levels, ${daily.length} daily levels (one loop every ` +
      `${daily.length} days), ${special.length} special dates`,
    today >= 1
      ? `Today, in UTC+14: puzzle #${today}`
      : `Puzzle #1 on ${formatIsoDate(options.launch)}`,
  );
  return { ok: errors.length === 0, lines: [...lines, ...errors] };
}

/**
 * Changes to what a puzzle players can still open shows: today's and the past week's, which a
 * player may be playing right now or come back to.
 */
function openPuzzleChanges(
  before: LevelSet,
  after: LevelSet,
  launch: CalendarDate,
  today: number,
): string[] {
  // Nothing generated yet: nothing was shown.
  if (before.daily.length === 0 || before.epochs.length === 0) return [];
  const errors: string[] = [];
  for (let n = Math.max(1, today - CATCH_UP_DAYS); n <= today; n++) {
    if (sameLevel(levelFor(before, launch, n), levelFor(after, launch, n))) continue;
    errors.push(
      `puzzle #${n} (${formatIsoDate(puzzleDate(launch, n))}) would change, and players can ` +
        `still open it: today's and the past ${CATCH_UP_DAYS} days' puzzles are frozen. Re-run ` +
        "with --allow-published-edit if you really mean it.",
    );
  }
  return errors;
}

async function findLevelFiles(root: string, errors: string[]): Promise<LevelFile[]> {
  const files: LevelFile[] = [];
  for (const kind of KINDS) {
    const dir = join(root, "levels", kind);
    const found: { kind: LevelKind; id: number; path: string; label: string }[] = [];
    for (const entry of await readDirOr(dir)) {
      if (entry.name.startsWith(".")) continue;
      const label = `levels/${kind}/${entry.name}`;
      const id = entry.isFile ? levelId(kind, entry.name) : undefined;
      if (id === undefined) {
        errors.push(`${label}: name level files ${FILE_NAME_HELP[kind]}`);
        continue;
      }
      found.push({ kind, id, path: join(dir, entry.name), label });
    }
    for (const error of numberingErrors(kind, found.map((file) => file.id))) {
      errors.push(`levels/${kind}: ${error}`);
    }
    files.push(...found.sort((a, b) => a.id - b.id));
  }
  const dates = new Map<string, string>();
  for (const entry of await readDirOr(join(root, "levels", "special"))) {
    if (entry.name.startsWith(".")) continue;
    const label = `levels/special/${entry.name}`;
    const date = entry.isFile ? specialDate(entry.name) : undefined;
    if (!date) {
      errors.push(`${label}: name special levels ${SPECIAL_NAME_HELP}, with a real date`);
      continue;
    }
    const key = entry.name.slice(0, 5);
    const other = dates.get(key);
    if (other) errors.push(`${label}: ${other} already has this date`);
    dates.set(key, label);
    files.push({
      kind: "special",
      ...date,
      path: join(root, "levels", "special", entry.name),
      label,
    });
  }
  return files;
}

type Built = { readonly file: LevelFile; readonly puzzle: Puzzle } | {
  readonly file: LevelFile;
  readonly errors: readonly string[];
};

async function buildLevel(file: LevelFile, toolchain: Toolchain, root: string): Promise<Built> {
  const source = await Deno.readTextFile(file.path);
  const fail = (messages: readonly string[]): Built => ({
    file,
    errors: [`✗ ${file.label}`, ...messages.map((m) => indent(m.replaceAll(`${root}/`, "")))],
  });
  const problems = sourceErrors(source);
  if (problems.length > 0) return fail(problems);
  // Unique per file: two specials may share a date (an error, but both still get compiled).
  const workName = "id" in file
    ? `${file.kind}-${file.id}`
    : `special-${basename(file.path, ".c")}`;
  const result = await compileLevel(file.path, workName, toolchain);
  if (!result.ok) return fail(result.errors);
  return { file, puzzle: { code: displayCode(source), solution: toRows(result.values) } };
}

interface Change {
  readonly title: string;
  /** Absent for a removed level. */
  readonly puzzle?: Puzzle;
}

/** New, changed and removed levels, with a title for each, in file order. */
function diff(before: LevelSet, after: LevelSet): Change[] {
  const changes: Change[] = [];
  const compare = <T extends Puzzle>(
    old: readonly T[],
    now: readonly T[],
    key: (level: T) => string,
    name: (level: T) => string,
  ) => {
    for (const level of now) {
      const was = old.find((o) => key(o) === key(level));
      if (!was) changes.push({ title: `new: ${name(level)}`, puzzle: level });
      else if (!sameLevel(was, level)) {
        changes.push({ title: `changed: ${name(level)}`, puzzle: level });
      }
    }
    for (const level of old) {
      if (!now.some((n) => key(n) === key(level))) {
        changes.push({ title: `removed: ${name(level)}` });
      }
    }
  };
  compare(before.tutorial, after.tutorial, (l) => String(l.id), (l) => `tutorial level ${l.id}`);
  compare(
    before.daily,
    after.daily,
    (l) => String(l.id),
    (l) => `levels/daily/${formatId("daily", l.id)}.c`,
  );
  compare(
    before.special,
    after.special,
    (l) => `${l.month}-${l.day}`,
    (l) =>
      `special ${String(l.month).padStart(2, "0")}-${String(l.day).padStart(2, "0")} (${l.name})`,
  );
  return changes;
}

function indent(message: string): string {
  return message.split("\n").map((line) => `    ${line}`).join("\n");
}

async function readDirOr(dir: string): Promise<Deno.DirEntry[]> {
  try {
    return (await Array.fromAsync(Deno.readDir(dir))).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
}

async function readTextOr(path: string, fallback: string): Promise<string> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return fallback;
    throw error;
  }
}

/** Runs `task` over `items` with at most `limit` running at once, keeping the order. */
async function mapPool<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const worker = async () => {
    for (let i = next++; i < items.length; i = next++) {
      const item = items[i];
      if (item !== undefined) results[i] = await task(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Today's date in UTC+14: a puzzle counts as published once its date has begun anywhere. */
export function todayInUtcPlus14(): CalendarDate {
  const now = new Date(Date.now() + 14 * 3_600_000);
  return { y: now.getUTCFullYear(), m: now.getUTCMonth() + 1, d: now.getUTCDate() };
}

if (import.meta.main) {
  const flags = ["--check", "--allow-published-edit"];
  const unknown = Deno.args.filter((arg) => !flags.includes(arg));
  if (unknown.length > 0) {
    console.error(`Unknown option ${unknown.join(" ")}. Options: ${flags.join(" ")}`);
    Deno.exit(2);
  }
  const report = await generate({
    root: fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, ""),
    check: Deno.args.includes("--check"),
    allowPublishedEdit: Deno.args.includes("--allow-published-edit"),
    today: todayInUtcPlus14(),
    launch: LAUNCH_DATE,
  });
  for (const line of report.lines) console.log(line);
  if (!report.ok) Deno.exit(1);
}
