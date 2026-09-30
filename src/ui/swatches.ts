import type { Color } from "../core/grid.ts";
import { el } from "./dom.ts";
import { PALETTE } from "./palette.ts";

export interface Swatches {
  readonly element: HTMLElement;
  select(color: Color): void;
}

const STEPS: Readonly<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/** The 8 numbered colors, as a radio group: Tab enters it, arrow keys move the selection. */
export function createSwatches(onSelect: (color: Color) => void): Swatches {
  const buttons = PALETTE.map(({ name, hex }, value) => {
    const button = el("button", {
      type: "button",
      role: "radio",
      class: "swatch",
      "aria-checked": "false",
      "aria-label": `${value} ${name}`,
      "data-value": value,
      tabindex: -1,
    }, String(value));
    button.style.backgroundColor = hex;
    button.addEventListener("click", () => onSelect(value as Color));
    return button;
  });

  const group = el("div", { class: "swatches", role: "radiogroup", "aria-label": "Colors" });
  group.append(...buttons);
  group.addEventListener("keydown", (event) => {
    const step = STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const current = buttons.findIndex((b) => b.getAttribute("aria-checked") === "true");
    const next = (current + step + buttons.length) % buttons.length;
    onSelect(next as Color);
    buttons[next]?.focus();
  });

  return {
    element: group,
    select(color) {
      // Keys 0-7 can change the selection while a swatch has the focus: the focus follows it, so
      // it never stays on a swatch that is unchecked and out of the Tab order.
      const focused = group.contains(document.activeElement);
      buttons.forEach((button, value) => {
        button.setAttribute("aria-checked", String(value === color));
        button.tabIndex = value === color ? 0 : -1;
      });
      if (focused) buttons[color]?.focus();
    },
  };
}
