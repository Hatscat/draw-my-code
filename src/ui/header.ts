import { el } from "./dom.ts";

export interface Header {
  readonly element: HTMLElement;
  setLabel(label: string): void;
  setHelpOpen(open: boolean): void;
  focusHelp(): void;
}

/** Title, the puzzle's name (`#12`, `Tutorial 2/9`) and the "?" button of the info panel. */
export function createHeader(onHelp: () => void): Header {
  const label = el("span", { class: "header-label" });
  const help = el("button", {
    type: "button",
    class: "help",
    "aria-expanded": "false",
    "aria-controls": "info",
    "aria-label": "How to play and settings",
  }, "?");
  help.addEventListener("click", onHelp);
  const element = el(
    "header",
    { class: "header" },
    el("h1", {}, "Draw my code"),
    el("div", { class: "header-right" }, label, help),
  );
  return {
    element,
    setLabel(text) {
      label.textContent = text;
    },
    setHelpOpen(open) {
      help.setAttribute("aria-expanded", String(open));
    },
    focusHelp() {
      help.focus();
    },
  };
}
