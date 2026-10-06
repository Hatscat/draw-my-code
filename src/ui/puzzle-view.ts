import { type Color, type Grid, SIZE } from "../core/grid.ts";
import type { Marks } from "../core/marks.ts";
import { createBoard } from "./board.ts";
import { createCodePanel } from "./code-panel.ts";
import { celebrate } from "./confetti.ts";
import { el } from "./dom.ts";
import { createHeader } from "./header.ts";
import { createInfoPanel } from "./info-panel.ts";
import { createSwatches } from "./swatches.ts";

export interface PuzzleViewOptions {
  /** Header right: `#12` or `Tutorial 2/9`. */
  readonly label: string;
  readonly fileName: string;
  readonly code: string;
  /** The info panel's last sentence: attempts allowed. */
  readonly attempts: string;
  /** Extra buttons for the info panel, such as Replay tutorial. */
  readonly infoActions?: readonly HTMLElement[];
  /** Extra buttons under Submit, such as Skip tutorial. */
  readonly footerActions?: readonly HTMLElement[];
  /** Whether anything changed, color or dot. */
  onPaint(index: number, color: Color): boolean;
  /** A tap again on a cell, or Space or Enter, that changed nothing: with 0, the dot goes. */
  onTapAgain(index: number): void;
  onSubmit(): void;
  onShowDigits(on: boolean): void;
}

export interface PuzzleView {
  /** Draws a grid; `editable` is false once the puzzle is over, which also leaves out the dots. */
  render(
    grid: Grid,
    options: { readonly editable: boolean; readonly showDigits: boolean; readonly marks?: Marks },
  ): void;
  /** The line above Submit: an error (the wrong count) by default, or good news. */
  setStatus(lines: readonly string[], tone?: "error" | "success"): void;
  /** Submit's label, and whether it does anything. It stays focusable either way. */
  setSubmit(label: string, enabled: boolean): void;
  /**
   * Shows a finished puzzle's panels, `top` over the instruction and swatches and `bottom` in
   * place of the status line and Submit; undefined restores them. The grid keeps its size and
   * position.
   */
  showResult(panels: { readonly top: HTMLElement; readonly bottom: HTMLElement } | undefined): void;
  /** The grid's accessible name: it shows the player's drawing, or the solution. */
  setGridName(name: string): void;
  /** Confetti out of the grid, for a puzzle just solved. */
  celebrate(): void;
  focusSubmit(): void;
  /** Removes the page-wide key listener. */
  destroy(): void;
}

/**
 * The puzzle screen of design/: header, code, swatches, grid, status line and Submit. It owns
 * input (selected color, pointer, keys); the caller applies the rules and calls `render`.
 */
export function showPuzzleView(root: HTMLElement, options: PuzzleViewOptions): PuzzleView {
  let selected: Color = 1;
  let infoOpen = false;
  const listeners = new AbortController();

  const header = createHeader(() => {
    infoOpen = !infoOpen;
    info.setOpen(infoOpen);
    header.setHelpOpen(infoOpen);
  });
  header.setLabel(options.label);
  const info = createInfoPanel(options.attempts, options.onShowDigits, options.infoActions);
  const code = createCodePanel(options.fileName, options.code);
  const swatches = createSwatches(select);
  const board = createBoard({
    onPaint: (index) => options.onPaint(index, selected),
    onTapAgain: (index) => options.onTapAgain(index),
    onPoint(index) {
      if (index === undefined) code.clearCall();
      else code.showCall(index % SIZE, Math.floor(index / SIZE));
      board.setPointed(index);
    },
  });
  const controls = el(
    "div",
    { class: "controls" },
    el("p", { class: "instruction" }, "Draw the output in each cell"),
    swatches.element,
  );
  const resultTop = el("div", { class: "result-slot" });
  // The result's heading covers the controls instead of replacing them: the grid stays put.
  const top = el("div", { class: "top" }, controls, resultTop);
  const resultBottom = el("div", { class: "result-slot" });
  const status = el("p", { class: "status", role: "status" });
  const submit = el("button", { type: "button", class: "button submit" }, "Submit");
  submit.addEventListener("click", () => {
    if (submit.getAttribute("aria-disabled") !== "true") options.onSubmit();
  });
  const footer = el("div", { class: "footer" }, status, submit, ...(options.footerActions ?? []));

  function select(color: Color) {
    selected = color;
    swatches.select(color);
  }

  select(selected);
  root.replaceChildren(
    header.element,
    info.element,
    code.element,
    top,
    board.element,
    footer,
    resultBottom,
  );

  document.addEventListener("keydown", (event) => {
    // A regex, not Number(): Number(" ") is 0, and Space paints.
    if (event.ctrlKey || event.metaKey || event.altKey || !/^[0-7]$/.test(event.key)) return;
    select(Number(event.key) as Color);
  }, { signal: listeners.signal });

  return {
    render(grid, { editable, showDigits, marks }) {
      board.render(grid, showDigits, marks);
      board.setEditable(editable);
      info.setShowDigits(showDigits);
    },
    setStatus(lines, tone = "error") {
      status.classList.toggle("success", tone === "success");
      // A live region: rewriting the same text on every painted cell would announce it again.
      if (status.textContent === lines.join("")) return;
      status.replaceChildren(...lines.map((line) => el("span", { class: "status-line" }, line)));
    },
    setSubmit(label, enabled) {
      submit.textContent = label;
      submit.setAttribute("aria-disabled", String(!enabled));
    },
    showResult(panels) {
      const finished = panels !== undefined;
      controls.style.visibility = finished ? "hidden" : "";
      footer.hidden = finished;
      // Re-inserting a panel that is already shown would drop the keyboard focus inside it.
      const place = (slot: HTMLElement, panel: HTMLElement | undefined) => {
        if (slot.firstChild !== (panel ?? null)) slot.replaceChildren(...(panel ? [panel] : []));
      };
      place(resultTop, panels?.top);
      place(resultBottom, panels?.bottom);
    },
    setGridName(name) {
      board.setName(name);
    },
    celebrate() {
      celebrate(board.rect());
    },
    focusSubmit() {
      submit.focus();
    },
    destroy() {
      listeners.abort();
    },
  };
}
