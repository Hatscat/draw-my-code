import { cellIndex, type Grid, SIZE } from "../core/grid.ts";
import { el } from "./dom.ts";
import { PALETTE } from "./palette.ts";

export interface BoardHandlers {
  /** Paint the cell at `index` with the selected color. */
  onPaint(index: number): void;
  /** The cell under the mouse or the keyboard focus, or undefined when there is none. */
  onPoint(index: number | undefined): void;
}

export interface Board {
  readonly element: HTMLElement;
  render(grid: Grid, showDigits: boolean): void;
  /** Painting is turned off once the puzzle is over; moving around still works. */
  setEditable(editable: boolean): void;
  /** Highlights the axis labels of a cell. */
  setPointed(index: number | undefined): void;
  setName(name: string): void;
  /** Keeps the grid at its current size (while the info panel is open), or lets it fit again. */
  freeze(frozen: boolean): void;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const xOf = (index: number) => index % SIZE;
const yOf = (index: number) => Math.floor(index / SIZE);

/** The 8x8 grid with its axis labels. Paints by pointer (tap or drag) and by keyboard. */
export function createBoard(handlers: BoardHandlers): Board {
  const cells: HTMLElement[] = [];
  const rows = range(SIZE).map((y) =>
    el(
      "div",
      { role: "row", class: "grid-row" },
      ...range(SIZE).map((x) => {
        const cell = el("div", { role: "gridcell", class: "cell", tabindex: x + y === 0 ? 0 : -1 });
        cells.push(cell);
        return cell;
      }),
    )
  );
  const grid = el("div", { class: "grid", role: "grid" }, ...rows);
  const name = (what: string) =>
    grid.setAttribute(
      "aria-label",
      `${what}: 8 by 8 cells, x from left to right, y from top to bottom`,
    );
  name("Your drawing");
  const columnLabels = range(SIZE).map((x) => el("span", {}, String(x)));
  const rowLabels = range(SIZE).map((y) => el("span", {}, String(y)));
  const element = el(
    "div",
    { class: "board" },
    el(
      "div",
      { class: "board-inner" },
      el("div", { class: "axis axis-x", "aria-hidden": "true" }, ...columnLabels),
      el("div", { class: "axis axis-y", "aria-hidden": "true" }, ...rowLabels),
      grid,
    ),
  );

  let editable = true;
  let focused = 0;
  // The pointer painting right now, and the last cell it painted (undefined once it left the grid).
  let stroke: { readonly id: number; last: number | undefined } | undefined;

  // From coordinates, not event.target: a touch stays targeted at the cell where it started.
  function cellAt(clientX: number, clientY: number): number | undefined {
    const first = cells[0]?.getBoundingClientRect();
    const last = cells[SIZE * SIZE - 1]?.getBoundingClientRect();
    if (!first || !last) return undefined;
    if (clientX < first.left || clientX >= last.right) return undefined;
    if (clientY < first.top || clientY >= last.bottom) return undefined;
    const pitchX = (last.left - first.left) / (SIZE - 1);
    const pitchY = (last.top - first.top) / (SIZE - 1);
    const x = Math.min(SIZE - 1, Math.floor((clientX - first.left) / pitchX));
    const y = Math.min(SIZE - 1, Math.floor((clientY - first.top) / pitchY));
    return cellIndex(x, y);
  }

  grid.addEventListener("pointerdown", (event) => {
    if (!editable || stroke || !event.isPrimary || event.button !== 0) return;
    const index = cellAt(event.clientX, event.clientY);
    if (index === undefined) return;
    event.preventDefault();
    stroke = { id: event.pointerId, last: index };
    try {
      grid.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events (tests) have no active pointer to capture.
    }
    handlers.onPaint(index);
  });

  grid.addEventListener("pointermove", (event) => {
    const index = cellAt(event.clientX, event.clientY);
    // Mice and pens hover; a finger only touches.
    if (event.pointerType !== "touch") handlers.onPoint(index ?? focusedInside());
    if (!stroke || event.pointerId !== stroke.id || index === stroke.last) return;
    if (index === undefined) {
      // Left the grid: coming back elsewhere must not draw a line through cells never crossed.
      stroke.last = undefined;
      return;
    }
    // A fast drag skips cells between two events: fill the gap.
    const crossed = stroke.last === undefined ? [index] : cellsBetween(stroke.last, index);
    for (const cell of crossed) handlers.onPaint(cell);
    stroke.last = index;
  });

  const endStroke = (event: PointerEvent) => {
    if (stroke?.id === event.pointerId) stroke = undefined;
  };
  grid.addEventListener("pointerup", endStroke);
  grid.addEventListener("pointercancel", endStroke);
  grid.addEventListener("lostpointercapture", endStroke);
  grid.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") handlers.onPoint(focusedInside());
  });

  // When the mouse leaves, the readout goes back to the keyboard-focused cell, if any.
  function focusedInside(): number | undefined {
    return grid.contains(document.activeElement) ? focused : undefined;
  }
  grid.addEventListener("contextmenu", (event) => event.preventDefault());

  // Roving focus: only the current cell is in the tab order.
  function setFocused(index: number) {
    const previous = cells[focused];
    const next = cells[index];
    if (previous) previous.tabIndex = -1;
    if (next) next.tabIndex = 0;
    focused = index;
  }

  grid.addEventListener("keydown", (event) => {
    const x = xOf(focused);
    const y = yOf(focused);
    const last = SIZE - 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [x - 1, y],
      ArrowRight: [x + 1, y],
      ArrowUp: [x, y - 1],
      ArrowDown: [x, y + 1],
      Home: event.ctrlKey ? [0, 0] : [0, y],
      End: event.ctrlKey ? [last, last] : [last, y],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      const [nx, ny] = move.map((v) => Math.max(0, Math.min(last, v)));
      const index = cellIndex(nx ?? x, ny ?? y);
      setFocused(index);
      cells[index]?.focus();
    } else if (event.key === " " || event.key === "Enter") {
      // Also stops Space from scrolling the page.
      event.preventDefault();
      if (editable && !event.repeat) handlers.onPaint(focused);
    }
  });

  grid.addEventListener("focusin", (event) => {
    const index = cells.findIndex((cell) => cell === event.target);
    if (index < 0) return;
    setFocused(index);
    handlers.onPoint(index);
  });
  grid.addEventListener("focusout", () => handlers.onPoint(undefined));

  return {
    element,
    render(drawing, showDigits) {
      cells.forEach((cell, i) => {
        const value = drawing[i] ?? 0;
        const color = PALETTE[value];
        if (!color) return;
        cell.style.backgroundColor = color.hex;
        cell.dataset.value = String(value);
        cell.textContent = showDigits ? String(value) : "";
        cell.setAttribute("aria-label", `x ${xOf(i)}, y ${yOf(i)}: ${value} ${color.name}`);
      });
    },
    setEditable(value) {
      editable = value;
      if (!value) stroke = undefined;
      grid.setAttribute("aria-readonly", String(!value));
    },
    setName(what) {
      name(what);
    },
    freeze(frozen) {
      if (frozen) {
        element.style.setProperty("--frozen-side", `${grid.getBoundingClientRect().width}px`);
      } else element.style.removeProperty("--frozen-side");
    },
    setPointed(index) {
      columnLabels.forEach((label, x) =>
        label.classList.toggle("on", index !== undefined && xOf(index) === x)
      );
      rowLabels.forEach((label, y) =>
        label.classList.toggle("on", index !== undefined && yOf(index) === y)
      );
    },
  };
}

/** The cells on a straight line from `from` (excluded) to `to` (included). */
function* cellsBetween(from: number, to: number): Generator<number> {
  let x = xOf(from);
  let y = yOf(from);
  const [tx, ty] = [xOf(to), yOf(to)];
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let error = dx + dy;
  while (x !== tx || y !== ty) {
    const double = 2 * error;
    if (double >= dy) {
      error += dy;
      x += sx;
    }
    if (double <= dx) {
      error += dx;
      y += sy;
    }
    yield cellIndex(x, y);
  }
}
