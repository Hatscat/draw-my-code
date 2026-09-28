/**
 * The level editor's server side (`deno task editor`, page in src/editor/): a dev-server-only
 * Vite plugin that lists, reads and saves level files, checks a source with the level pipeline
 * (the same source checks and gcc builds as `deno task levels`) and regenerates the game's levels.
 */

import { Buffer } from "node:buffer";
import type { IncomingHttpHeaders } from "node:http";
import { join, relative } from "node:path";
import type { Plugin } from "vite";
import { LAUNCH_DATE } from "../src/core/config.ts";
import { type CalendarDate, daysBetween, formatIsoDate } from "../src/core/date.ts";
import { puzzleDate } from "../src/core/schedule.ts";
import { PALETTE } from "../src/ui/palette.ts";
import {
  compileLevel,
  type LevelResult,
  prepareToolchain,
  type Toolchain,
} from "./level-compile.ts";
import { levelId, type LevelKind, sourceErrors } from "./level-source.ts";
import { generate, type Report, todayInUtcPlus14 } from "./levels.ts";

export interface EditorLevel {
  /** From the repository root, such as `levels/daily/0001.c`. */
  readonly path: string;
  readonly kind: LevelKind;
  readonly id: number;
  /** A daily's date, YYYY-MM-DD. */
  readonly live?: string;
  /** A daily whose date has come: `deno task levels` refuses to change it. */
  readonly published: boolean;
}

export interface EditorRequest {
  readonly method: string;
  /** Path and query under the editor's prefix, such as `/level?path=levels/daily/0001.c`. */
  readonly url: string;
  readonly headers: IncomingHttpHeaders;
  readonly body: string;
}

export interface EditorResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface Editor {
  respond(request: EditorRequest): Promise<EditorResponse>;
  close(): Promise<void>;
}

const PREFIX = "/__editor";
const KINDS: readonly LevelKind[] = ["tutorial", "daily"];
/** Far more than a 12-line level: anything bigger is a mistake. */
const MAX_BODY = 64 * 1024;
// deno-lint-ignore no-control-regex -- ANSI color codes start with the ESC control character
const ANSI_CELL = /\x1b\[48;2;(\d+);(\d+);(\d+)m {2}\x1b\[0m/g;
// deno-lint-ignore no-control-regex -- same
const ANSI_COLOR = /\x1b\[[\d;]*m/g;

/** A line of `deno task levels` output without its terminal colors: grid cells become digits. */
export function plainText(line: string): string {
  const hex = (channel: string) => Number(channel).toString(16).padStart(2, "0");
  return line
    .replace(ANSI_CELL, (_cell, r: string, g: string, b: string) => {
      const color = `#${hex(r)}${hex(g)}${hex(b)}`;
      return `${PALETTE.findIndex((entry) => entry.hex === color)} `;
    })
    .replace(ANSI_COLOR, "")
    .trimEnd();
}

/**
 * Checks run gcc and run what it builds, and saves write files: only the editor's own page may
 * ask. A page on another site gets a cross-site Sec-Fetch-Site; one reaching the server through
 * a DNS name it controls (DNS rebinding) sends that name as Host.
 */
export function isTrusted(headers: IncomingHttpHeaders): boolean {
  if (headers["sec-fetch-site"] !== "same-origin") return false;
  const host = /^(.*?)(?::\d+)?$/.exec(headers.host ?? "")?.[1];
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/** A level file's absolute path, from its path under the root; undefined for anything else. */
export function levelPath(root: string, path: string): string | undefined {
  const match = /^levels\/(tutorial|daily)\/([^/]+)$/.exec(path);
  const kind = KINDS.find((k) => k === match?.[1]);
  const name = match?.[2];
  if (!kind || !name || levelId(kind, name) === undefined) return undefined;
  return join(root, "levels", kind, name);
}

/** Every level file, tutorial first, in order; dailies with their date. */
export async function listLevels(
  root: string,
  launch: CalendarDate,
  today: CalendarDate,
): Promise<EditorLevel[]> {
  const levels: EditorLevel[] = [];
  for (const kind of KINDS) {
    const found: EditorLevel[] = [];
    try {
      for await (const entry of Deno.readDir(join(root, "levels", kind))) {
        const id = entry.isFile ? levelId(kind, entry.name) : undefined;
        if (id === undefined) continue;
        const path = `levels/${kind}/${entry.name}`;
        if (kind === "tutorial") {
          found.push({ path, kind, id, published: false });
          continue;
        }
        const live = puzzleDate(launch, id);
        found.push({
          path,
          kind,
          id,
          live: formatIsoDate(live),
          published: daysBetween(live, today) >= 0,
        });
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    levels.push(...found.sort((a, b) => a.id - b.id || a.path.localeCompare(b.path)));
  }
  return levels;
}

/**
 * Checks a level's source like `deno task levels` does, without saving it. Messages name the
 * file `name` instead of the temporary file gcc compiled.
 */
export async function checkSource(
  source: string,
  name: string,
  toolchain: Toolchain,
): Promise<LevelResult> {
  const problems = sourceErrors(source);
  if (problems.length > 0) return { ok: false, errors: problems };
  const dir = await Deno.makeTempDir({ dir: toolchain.workDir });
  try {
    const file = join(dir, name);
    await Deno.writeTextFile(file, source);
    const result = await compileLevel(file, "level", { ...toolchain, workDir: dir });
    return result.ok
      ? result
      : { ok: false, errors: result.errors.map((error) => error.replaceAll(`${dir}/`, "")) };
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

/** The editor's endpoints, independent of any HTTP server. */
export function createEditor(root: string): Editor {
  // Made on the first check: the harness is compiled once per server.
  let workDir: Promise<string> | undefined;
  let toolchain: Promise<Toolchain> | undefined;
  const reply = (status: number, body: unknown): EditorResponse => ({ status, body });

  async function respond(request: EditorRequest): Promise<EditorResponse> {
    if (!isTrusted(request.headers)) return reply(403, { error: "only the editor page may ask" });
    const url = new URL(request.url, "http://localhost");
    const route = `${request.method} ${url.pathname}`;
    if (route === "GET /levels") {
      return reply(200, await listLevels(root, LAUNCH_DATE, todayInUtcPlus14()));
    }
    if (route === "POST /generate") {
      const report = await generate({
        root,
        check: false,
        strict: false,
        allowPublishedEdit: false,
        today: todayInUtcPlus14(),
        launch: LAUNCH_DATE,
        annotate: false,
      });
      return reply(200, { ok: report.ok, lines: report.lines.map(plainText) } satisfies Report);
    }

    const body = request.body === "" ? {} : parseBody(request.body);
    if (!body) return reply(400, { error: "expected a JSON object" });
    const source = typeof body.source === "string" ? body.source : undefined;

    if (route === "POST /check") {
      if (source === undefined) return reply(400, { error: "expected { source, name }" });
      const name = typeof body.name === "string" && /^[\w-]+\.c$/.test(body.name)
        ? body.name
        : "level.c";
      workDir ??= Deno.makeTempDir({ prefix: "dmc-editor-" });
      toolchain ??= workDir.then((dir) => prepareToolchain(join(root, "tools"), dir));
      return reply(200, await checkSource(source, name, await toolchain));
    }

    const path = levelPath(root, url.searchParams.get("path") ?? "");
    if (!path) {
      return reply(400, {
        error: "not a level file: levels/tutorial/NN-name.c or levels/daily/NNNN.c",
      });
    }
    if (route === "GET /level") {
      try {
        return reply(200, { source: await Deno.readTextFile(path) });
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) return reply(404, { error: "no such level" });
        throw error;
      }
    }
    if (route === "PUT /level") {
      if (source === undefined) return reply(400, { error: "expected { source }" });
      await Deno.writeTextFile(path, source);
      return reply(200, { saved: relative(root, path) });
    }
    return reply(404, { error: `no route ${route}` });
  }

  return {
    respond,
    async close() {
      if (workDir) await Deno.remove(await workDir, { recursive: true }).catch(() => {});
    },
  };
}

function parseBody(text: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Serves the editor's endpoints under /__editor on the dev server, never in a build or preview,
 * and tells the page when a file under levels/ changes on disk.
 */
export function levelEditor(root: string): Plugin {
  return {
    name: "draw-my-code:level-editor",
    apply: (_config, env) => env.command === "serve" && !env.isPreview,
    configureServer(server) {
      const editor = createEditor(root);
      server.httpServer?.once("close", () => editor.close());
      const levels = join(root, "levels");
      server.watcher.on("all", (_event, file) => {
        if (file.startsWith(`${levels}/`)) {
          server.ws.send("editor:levels-changed", { path: relative(root, file) });
        }
      });
      server.middlewares.use(PREFIX, async (req, res) => {
        try {
          const chunks: Buffer[] = [];
          let size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > MAX_BODY) throw new Error("request too large");
            chunks.push(chunk);
          }
          const { status, body } = await editor.respond({
            method: req.method ?? "GET",
            url: req.url ?? "/",
            headers: req.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: String(error) }));
        }
      });
    },
  };
}
