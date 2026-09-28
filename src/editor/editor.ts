/**
 * The level editor (`deno task editor`): a level's source, what players see of it, and the grid
 * gcc computes from it, checked again as you type. The dev server does the work, with the level
 * pipeline (tools/level-editor.ts); this page only shows the results.
 */

import "../styles.css";
import "./editor.css";
import type { LevelResult } from "../../tools/level-compile.ts";
import type { EditorLevel } from "../../tools/level-editor.ts";
import { displayCode, MAX_COLUMNS, MAX_LINES } from "../../tools/level-source.ts";
import type { Report } from "../../tools/levels.ts";
import { blankGrid, type Grid, gridFromString, SIZE } from "../core/grid.ts";
import { createBoard } from "../ui/board.ts";
import { type CodePanel, createCodePanel } from "../ui/code-panel.ts";
import { el } from "../ui/dom.ts";
import { PALETTE } from "../ui/palette.ts";

const NEW_DAILY = "int f(int x, int y) {\n  return (x + y) % 8;\n}\n";
const CHECK_DELAY_MS = 250;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/__editor/${path}`, {
    method,
    headers: body === undefined ? {} : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = typeof data === "object" && data !== null && "error" in data;
    throw new Error(error ? String(data.error) : `${response.status} ${response.statusText}`);
  }
  // The dev server's own answers: tools/level-editor.ts.
  return data as T;
}

const levelUrl = (level: EditorLevel) => `level?path=${encodeURIComponent(level.path)}`;
const fileName = (level: EditorLevel) => level.path.split("/").at(-1) ?? "level.c";
/** The name the game shows above the code. */
const gameFileName = (level: EditorLevel | undefined) =>
  level?.kind === "tutorial"
    ? `tutorial_${level.id}.c`
    : `daily_${String(level?.id ?? 0).padStart(4, "0")}.c`;

function start(root: HTMLElement) {
  const picker = el("select", { "aria-label": "Level file" });
  const newDaily = el("button", { type: "button" }, "New daily");
  const save = el("button", { type: "button", disabled: true }, "Save");
  const saveState = el("span", { class: "editor-note editor-save-state", role: "status" });
  const update = el("button", { type: "button" }, "Update the game");
  const bar = el(
    "header",
    { class: "editor-bar" },
    el("h1", {}, "Level editor"),
    picker,
    newDaily,
    save,
    saveState,
    update,
  );

  const published = el("p", { class: "editor-warning", hidden: true });
  const source = el("textarea", {
    class: "editor-source",
    "aria-label": "Source",
    spellcheck: "false",
    autocapitalize: "off",
    autocomplete: "off",
    wrap: "off",
  });
  const counts = el("p", { class: "editor-note" });
  const checkState = el("p", { class: "editor-check", role: "status" });
  const errors = el("div", { class: "editor-errors" });
  const report = el("pre", { class: "editor-report", hidden: true });
  const left = el(
    "section",
    { class: "editor-left" },
    published,
    source,
    counts,
    checkState,
    errors,
    report,
  );

  const codeSlot = el("div", { class: "editor-code" });
  const readout = el("p", { class: "editor-readout" });
  const digits = el("input", { type: "checkbox", checked: true });
  const board = createBoard({
    onPaint() {},
    onPoint(index) {
      pointed = index;
      showPointed();
    },
  });
  board.setEditable(false);
  board.setName("f(x, y) for every cell");
  const preview = el(
    "section",
    { class: "editor-preview", "aria-label": "What players see" },
    codeSlot,
    board.element,
    readout,
    el("label", { class: "editor-note editor-digits" }, digits, "Show digits"),
  );
  root.replaceChildren(bar, el("div", { class: "editor-body" }, left, preview));

  let levels: EditorLevel[] = [];
  let current: EditorLevel | undefined;
  let saved = "";
  let code: CodePanel | undefined;
  let grid: Grid = blankGrid();
  let pointed: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let checking = false;
  let checkAgain = false;

  const dirty = () => current !== undefined && source.value !== saved;

  function showPointed() {
    board.setPointed(pointed);
    if (pointed === undefined) {
      code?.clearCall();
      readout.textContent = "Point at a cell for its value";
      return;
    }
    const x = pointed % SIZE;
    const y = Math.floor(pointed / SIZE);
    code?.showCall(x, y);
    const value = grid[pointed] ?? 0;
    readout.textContent = `f(${x}, ${y}) = ${value}, ${PALETTE[value]?.name ?? ""}`;
  }

  function renderGrid() {
    board.render(grid, digits.checked);
    showPointed();
  }

  /** After every edit: what players see, the size limits, and a check soon. */
  function edited() {
    const text = source.value;
    code = createCodePanel(gameFileName(current), displayCode(text));
    codeSlot.replaceChildren(code.element);
    showPointed();
    const lines = displayCode(text).split("\n");
    const widest = Math.max(...lines.map((line) => line.length));
    counts.textContent = `${lines.length}/${MAX_LINES} lines · widest ${widest}/${MAX_COLUMNS} ` +
      "columns";
    showSaveState();
    clearTimeout(timer);
    timer = setTimeout(check, CHECK_DELAY_MS);
  }

  function showSaveState(note?: string) {
    save.disabled = !dirty();
    saveState.textContent = note ?? (current === undefined ? "" : dirty() ? "Unsaved" : "Saved");
  }

  /** One check at a time: edits made meanwhile are checked right after. */
  async function check() {
    if (checking) {
      checkAgain = true;
      return;
    }
    checking = true;
    checkState.textContent = "Checking with gcc…";
    try {
      const name = current ? fileName(current) : "level.c";
      showCheck(await call<LevelResult>("POST", "check", { source: source.value, name }));
    } catch (error) {
      showCheck({ ok: false, errors: [String(error)] });
    } finally {
      checking = false;
      if (checkAgain) {
        checkAgain = false;
        check();
      }
    }
  }

  function showCheck(result: LevelResult) {
    const values = result.ok ? gridFromString(result.values.join("")) : undefined;
    preview.classList.toggle("stale", !values);
    if (values) {
      grid = values;
      renderGrid();
      const colored = values.filter((value) => value !== 0).length;
      const colors = new Set(values).size;
      checkState.textContent = `✓ Valid level · ${colored} colored cells · ${colors} colors`;
      errors.replaceChildren();
      return;
    }
    const problems = result.ok ? ["gcc printed values outside [0, 7]"] : result.errors;
    checkState.textContent = `✗ ${problems.length} problem${problems.length > 1 ? "s" : ""}: ` +
      "the grid shows the last valid version";
    errors.replaceChildren(...problems.map((problem) => el("pre", {}, problem)));
  }

  async function refreshList() {
    levels = await call<EditorLevel[]>("GET", "levels");
    const option = (level: EditorLevel) =>
      el(
        "option",
        { value: level.path },
        level.kind === "tutorial"
          ? `Tutorial ${level.id} · ${fileName(level)}`
          : `#${level.id} · ${level.live}${level.published ? " · live" : ""}`,
      );
    picker.replaceChildren(
      ...(["tutorial", "daily"] as const).map((kind) =>
        el(
          "optgroup",
          { label: kind === "tutorial" ? "Tutorial" : "Daily" },
          ...levels.filter((level) => level.kind === kind).map(option),
        )
      ),
    );
    if (current) picker.value = current.path;
  }

  async function open(level: EditorLevel) {
    if (dirty() && current && !confirm(`Discard your changes to ${current.path}?`)) {
      picker.value = current.path;
      return;
    }
    const { source: text } = await call<{ source: string }>("GET", levelUrl(level));
    current = level;
    saved = text;
    source.value = text;
    picker.value = level.path;
    history.replaceState(null, "", `?level=${encodeURIComponent(level.path)}`);
    published.hidden = !level.published;
    published.textContent = `⚠ Daily #${level.id} went live on ${level.live}: players already ` +
      "have results for it, so Update the game refuses to change it.";
    report.hidden = true;
    edited();
  }

  async function saveFile(): Promise<boolean> {
    if (!current || !dirty()) return true;
    const text = source.value;
    try {
      await call("PUT", levelUrl(current), { source: text });
    } catch (error) {
      showSaveState(`Not saved: ${error}`);
      return false;
    }
    saved = text;
    showSaveState();
    return true;
  }

  picker.addEventListener("change", () => {
    const level = levels.find((l) => l.path === picker.value);
    if (level) open(level);
  });
  source.addEventListener("input", edited);
  source.addEventListener("keydown", (event) => {
    // A new line keeps the indentation of the one before.
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const before = source.value.slice(0, source.selectionStart);
    const indent = /[^\n]*$/.exec(before)?.[0].match(/^ */)?.[0] ?? "";
    // execCommand, deprecated as it is, keeps the edit in the textarea's undo history.
    document.execCommand("insertText", false, `\n${indent}`);
  });
  save.addEventListener("click", saveFile);
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      saveFile();
    }
  });
  addEventListener("beforeunload", (event) => {
    if (dirty()) event.preventDefault();
  });
  digits.addEventListener("change", renderGrid);

  newDaily.addEventListener("click", async () => {
    const id = Math.max(0, ...levels.filter((l) => l.kind === "daily").map((l) => l.id)) + 1;
    const path = `levels/daily/${String(id).padStart(4, "0")}.c`;
    await call("PUT", `level?path=${encodeURIComponent(path)}`, { source: NEW_DAILY });
    await refreshList();
    const level = levels.find((l) => l.path === path);
    if (level) await open(level);
  });

  update.addEventListener("click", async () => {
    // The game is built from the files: save first.
    if (!(await saveFile())) return;
    update.disabled = true;
    report.hidden = false;
    report.textContent = "Running deno task levels…";
    try {
      const result = await call<Report>("POST", "generate");
      report.textContent = [result.ok ? "✓ Updated" : "✗ Not updated", ...result.lines]
        .join("\n");
    } catch (error) {
      report.textContent = `✗ ${error}`;
    } finally {
      update.disabled = false;
    }
  });

  // A file changed on disk, from this page or another editor.
  import.meta.hot?.on("editor:levels-changed", async (data: unknown) => {
    await refreshList();
    const path = typeof data === "object" && data !== null && "path" in data ? data.path : "";
    if (!current || path !== current.path) return;
    const { source: text } = await call<{ source: string }>("GET", levelUrl(current));
    if (text === saved) return;
    if (dirty()) {
      showSaveState("Changed on disk: saving overwrites that version");
      return;
    }
    saved = text;
    source.value = text;
    edited();
  });

  renderGrid();
  refreshList().then(() => {
    const wanted = new URLSearchParams(location.search).get("level");
    const first = levels.find((l) => l.path === wanted) ??
      levels.find((l) => l.kind === "daily") ?? levels[0];
    if (first) open(first);
  });
}

const root = document.querySelector("#editor");
if (root instanceof HTMLElement) start(root);
