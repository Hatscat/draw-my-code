import { ATTEMPTS, LAUNCH_DATE } from "../core/config.ts";
import { paint, startPlay } from "../core/game.ts";
import { type Color, gridFromRows, SIZE } from "../core/grid.ts";
import { dailyFor } from "../core/schedule.ts";
import { daily } from "../levels/generated.ts";
import type { Level } from "../levels/types.ts";
import { createBoard } from "./board.ts";
import { dateOverride, formatLongDate, localDate } from "./clock.ts";
import { createCodePanel } from "./code-panel.ts";
import { el } from "./dom.ts";
import { createHeader } from "./header.ts";
import { createInfoPanel } from "./info-panel.ts";
import { createSwatches } from "./swatches.ts";

export function startApp(root: HTMLElement): void {
  const override = import.meta.env.DEV ? dateOverride(location.search) : undefined;
  const today = dailyFor(LAUNCH_DATE, override ?? localDate(new Date()), daily);
  if (today.kind === "puzzle") {
    showPuzzle(root, {
      label: `#${today.number}`,
      fileName: `daily_${String(today.number).padStart(4, "0")}.c`,
      level: today.level,
      attempts: ATTEMPTS,
    });
    return;
  }
  const header = createHeader(() => {});
  const notice = today.kind === "before-launch"
    ? `First puzzle on ${formatLongDate(today.launch)}`
    : "No puzzle today. New puzzles are on the way.";
  root.replaceChildren(header.element, el("p", { class: "notice" }, notice));
}

interface PuzzleOptions {
  readonly label: string;
  readonly fileName: string;
  readonly level: Level;
  readonly attempts: number;
}

function showPuzzle(root: HTMLElement, options: PuzzleOptions): void {
  let play = startPlay(gridFromRows(options.level.solution), options.attempts);
  let selected: Color = 1;
  let showDigits = false;
  let infoOpen = false;

  const header = createHeader(() => setInfoOpen(!infoOpen));
  const attempts = options.attempts === Infinity
    ? "Unlimited attempts."
    : `You have ${options.attempts} attempts.`;
  const info = createInfoPanel(attempts, (on) => {
    showDigits = on;
    info.setShowDigits(on);
    board.render(play.drawing, showDigits);
  });
  const code = createCodePanel(options.fileName, options.level.code);
  const swatches = createSwatches(select);
  const board = createBoard({
    onPaint(index) {
      play = paint(play, index, selected);
      board.render(play.drawing, showDigits);
    },
    onPoint(index) {
      if (index === undefined) code.clearCall();
      else code.showCall(index % SIZE, Math.floor(index / SIZE));
      board.setPointed(index);
    },
  });
  const status = el("p", { class: "status", role: "status" });
  const submit = el("button", { type: "button", class: "submit" }, "Submit");

  function select(color: Color) {
    selected = color;
    swatches.select(color);
  }
  function setInfoOpen(open: boolean) {
    infoOpen = open;
    // The panel pushes the page down, as in the design, instead of shrinking the grid.
    board.freeze(open);
    info.setOpen(open);
    header.setHelpOpen(open);
  }

  header.setLabel(options.label);
  select(selected);
  board.render(play.drawing, showDigits);
  root.replaceChildren(
    header.element,
    info.element,
    code.element,
    el("p", { class: "instruction" }, "Draw the output in each cell"),
    swatches.element,
    board.element,
    status,
    submit,
  );

  document.addEventListener("keydown", (event) => {
    // A regex, not Number(): Number(" ") is 0, and Space paints.
    if (event.ctrlKey || event.metaKey || event.altKey || !/^[0-7]$/.test(event.key)) return;
    select(Number(event.key) as Color);
  });
}
