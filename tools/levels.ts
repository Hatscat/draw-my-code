/**
 * Level generator: `deno task levels` compiles every level with gcc, validates it and regenerates
 * src/levels/generated.ts; `deno task levels:check` fails if that file is stale. See docs/spec.md,
 * "Levels".
 */

import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { LAUNCH_DATE } from "../src/core/config.ts";
import { type CalendarDate, daysBetween, formatIsoDate } from "../src/core/date.ts";
import { puzzleDate } from "../src/core/schedule.ts";
import type { Level } from "../src/levels/types.ts";
import { compileLevel, gccVersion, prepareToolchain, type Toolchain } from "./level-compile.ts";
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
import {
  displayCode,
  FILE_NAME_HELP,
  formatId,
  levelId,
  type LevelKind,
  numberingErrors,
  sourceErrors,
} from "./level-source.ts";

export interface Options {
  /** Repository root, holding levels/, tools/ and src/levels/. */
  readonly root: string;
  /** Compare instead of writing. */
  readonly check: boolean;
  /** Fail, instead of warning, when fewer than 7 days of daily puzzles remain. */
  readonly strict: boolean;
  /** Allow changing a daily puzzle whose date has come. */
  readonly allowPublishedEdit: boolean;
  /** Today in UTC+14, the first time zone to reach each date. */
  readonly today: CalendarDate;
  readonly launch: CalendarDate;
  /** Emit GitHub Actions annotations. */
  readonly annotate: boolean;
}

export interface Report {
  readonly ok: boolean;
  readonly lines: readonly string[];
}

const KINDS: readonly LevelKind[] = ["tutorial", "daily"];
const OUTPUT = "src/levels/generated.ts";
const LOW_SCHEDULE_DAYS = 7;
// GitHub disables scheduled workflows after 60 days without a commit.
const SCHEDULE_REMINDER_DAYS = 50;

interface LevelFile {
  readonly kind: LevelKind;
  readonly id: number;
  readonly path: string;
  /** Path relative to the root, for messages. */
  readonly label: string;
}

export async function generate(options: Options): Promise<Report> {
  const lines: string[] = [];
  const errors: string[] = [];
  const annotate = (level: "warning" | "error", message: string) =>
    options.annotate ? `::${level} title=Puzzle schedule::${message}` : message;

  const files = await findLevelFiles(options.root, errors);
  const workDir = await Deno.makeTempDir({ prefix: "dmc-levels-" });
  let levels: LevelSet;
  try {
    lines.push(await gccVersion());
    const toolchain = await prepareToolchain(join(options.root, "tools"), workDir);
    const results = await mapPool(
      files,
      navigator.hardwareConcurrency || 4,
      (file) => buildLevel(file, toolchain, options.root),
    );
    const failed = results.filter((result) => "errors" in result);
    for (const result of failed) errors.push(...result.errors);
    levels = {
      tutorial: results.filter((r) => "level" in r && r.kind === "tutorial").map(levelOf),
      daily: results.filter((r) => "level" in r && r.kind === "daily").map(levelOf),
    };
  } finally {
    await Deno.remove(workDir, { recursive: true });
  }
  if (errors.length > 0) return { ok: false, lines: [...lines, ...errors] };

  const outputPath = join(options.root, OUTPUT);
  const generated = await denoFmt(renderGenerated(levels), options.root);
  const existing = await readTextOr(outputPath, "");
  const previous = await readGenerated(outputPath);
  const changes = diff(previous, levels);

  if (!options.allowPublishedEdit) {
    for (const { kind, id } of changes.changed.concat(changes.removed)) {
      if (kind !== "daily") continue;
      const live = puzzleDate(options.launch, id);
      if (daysBetween(live, options.today) >= 0) {
        errors.push(
          `levels/daily/${formatId(kind, id)}.c went live on ${formatIsoDate(live)}: changing a ` +
            "published puzzle changes results players already have. Re-run with " +
            "--allow-published-edit if you really mean it.",
        );
      }
    }
  }

  if (options.check) {
    if (generated !== existing) {
      errors.push(`${OUTPUT} is out of date: run \`deno task levels\``);
      for (const { kind, id, what } of changes.all) {
        errors.push(`  ${what}: levels/${kind}/${formatId(kind, id)}`);
      }
    }
  } else if (errors.length === 0) {
    for (const { kind, id, what } of changes.all) {
      const level = levels[kind].find((l) => l.id === id);
      const title = kind === "daily"
        ? `${what}: daily #${id}, live on ${formatIsoDate(puzzleDate(options.launch, id))}`
        : `${what}: tutorial level ${id}`;
      lines.push("", level ? preview(title, level) : title);
    }
    if (generated !== existing) {
      await Deno.writeTextFile(outputPath, generated);
      lines.push("", `Wrote ${OUTPUT}`);
    }
  }

  lines.push("", `${levels.tutorial.length} tutorial levels, ${levels.daily.length} daily puzzles`);
  const { line, daysLeft } = schedule(options.launch, levels.daily.length, options.today);
  lines.push(line);
  if (daysLeft < LOW_SCHEDULE_DAYS) {
    const message = `Fewer than ${LOW_SCHEDULE_DAYS} days of daily puzzles left: add levels to ` +
      "levels/daily/";
    if (options.strict) errors.push(annotate("error", message));
    else lines.push(annotate("warning", message));
  } else if (daysLeft > SCHEDULE_REMINDER_DAYS) {
    lines.push(
      "Reminder: GitHub disables scheduled workflows after 60 days without a commit, and the " +
        "daily check is what warns you before puzzles run out.",
    );
  }

  return { ok: errors.length === 0, lines: [...lines, ...errors] };
}

async function findLevelFiles(root: string, errors: string[]): Promise<LevelFile[]> {
  const files: LevelFile[] = [];
  for (const kind of KINDS) {
    const dir = join(root, "levels", kind);
    const found: LevelFile[] = [];
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
  return files;
}

type Built =
  | { readonly kind: LevelKind; readonly level: Level }
  | { readonly kind: LevelKind; readonly errors: readonly string[] };

function levelOf(built: Built): Level {
  if ("level" in built) return built.level;
  throw new Error("internal error: a failed level reached the output");
}

async function buildLevel(file: LevelFile, toolchain: Toolchain, root: string): Promise<Built> {
  const source = await Deno.readTextFile(file.path);
  const fail = (messages: readonly string[]): Built => ({
    kind: file.kind,
    errors: [`✗ ${file.label}`, ...messages.map((m) => indent(m.replaceAll(`${root}/`, "")))],
  });
  const problems = sourceErrors(source);
  if (problems.length > 0) return fail(problems);
  const result = await compileLevel(file.path, `${file.kind}-${file.id}`, toolchain);
  if (!result.ok) return fail(result.errors);
  return {
    kind: file.kind,
    level: { id: file.id, code: displayCode(source), solution: toRows(result.values) },
  };
}

interface Change {
  readonly kind: LevelKind;
  readonly id: number;
  readonly what: "new" | "changed" | "removed";
}

function diff(before: LevelSet, after: LevelSet) {
  const all: Change[] = [];
  for (const kind of KINDS) {
    for (const level of after[kind]) {
      const old = before[kind].find((l) => l.id === level.id);
      if (!old) all.push({ kind, id: level.id, what: "new" });
      else if (!sameLevel(old, level)) all.push({ kind, id: level.id, what: "changed" });
    }
    for (const old of before[kind]) {
      if (!after[kind].some((l) => l.id === old.id)) {
        all.push({ kind, id: old.id, what: "removed" });
      }
    }
  }
  return {
    all,
    changed: all.filter((c) => c.what === "changed"),
    removed: all.filter((c) => c.what === "removed"),
  };
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
  const flags = ["--check", "--strict", "--allow-published-edit"];
  const unknown = Deno.args.filter((arg) => !flags.includes(arg));
  if (unknown.length > 0) {
    console.error(`Unknown option ${unknown.join(" ")}. Options: ${flags.join(" ")}`);
    Deno.exit(2);
  }
  const report = await generate({
    root: fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, ""),
    check: Deno.args.includes("--check"),
    strict: Deno.args.includes("--strict"),
    allowPublishedEdit: Deno.args.includes("--allow-published-edit"),
    today: todayInUtcPlus14(),
    launch: LAUNCH_DATE,
    annotate: Deno.env.get("GITHUB_ACTIONS") === "true",
  });
  for (const line of report.lines) console.log(line);
  if (!report.ok) Deno.exit(1);
}
