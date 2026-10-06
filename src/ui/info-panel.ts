import { el } from "./dom.ts";

export interface InfoPanel {
  readonly element: HTMLElement;
  setOpen(open: boolean): void;
  setShowDigits(on: boolean): void;
}

/** The "?" panel: how to play, the Show digits setting, and optional extra actions. */
export function createInfoPanel(
  attempts: string,
  onShowDigits: (on: boolean) => void,
  actions: readonly HTMLElement[] = [],
): InfoPanel {
  // On or off shows as a mark, not by color alone; screen readers get aria-checked instead.
  const mark = el("span", { "aria-hidden": "true" }, "[ ] ");
  const digits = el(
    "button",
    {
      type: "button",
      role: "switch",
      class: "text-button switch",
      "aria-checked": "false",
    },
    mark,
    "Show digits",
  );
  digits.addEventListener("click", () => {
    onShowDigits(digits.getAttribute("aria-checked") !== "true");
  });
  const element = el(
    "section",
    {
      id: "info",
      class: "panel info-panel",
      "aria-label": "How to play and settings",
      hidden: true,
    },
    el(
      "p",
      {},
      ...[
        "f(x, y) returns a color index from 0 to 7 for every cell.",
        "x runs left to right, y top to bottom, both from 0 to 7.",
        "Pick a swatch, then tap or drag across the grid to paint.",
        "Painting 0 leaves a dot, to keep track of checked cells.",
        "Keys 0–7 pick a color; arrows move, Space paints.",
        attempts,
      ].map((sentence) => el("span", { class: "info-line" }, sentence, " ")),
    ),
    el("div", { class: "info-actions" }, digits, ...actions),
  );
  return {
    element,
    setOpen(open) {
      element.hidden = !open;
    },
    setShowDigits(on) {
      digits.setAttribute("aria-checked", String(on));
      mark.textContent = on ? "[x] " : "[ ] ";
    },
  };
}
