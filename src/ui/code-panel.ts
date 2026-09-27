import { el } from "./dom.ts";
import { type TokenKind, tokenLines } from "./tokenize.ts";

const DOMAIN = "x,y ∈ [0,7]";

const TOKEN_CLASS: Readonly<Partial<Record<TokenKind, string>>> = {
  type: "tok-type",
  keyword: "tok-keyword",
  function: "tok-function",
  number: "tok-number",
  operator: "tok-operator",
  comment: "tok-comment",
};

export interface CodePanel {
  readonly element: HTMLElement;
  /** Shows the call for the cell under the pointer or focus, never its value. */
  showCall(x: number, y: number): void;
  clearCall(): void;
}

/** The level's code with line numbers and highlighting, and its file name. */
export function createCodePanel(fileName: string, code: string): CodePanel {
  const lines = tokenLines(code);
  const numberWidth = String(lines.length).length;
  const pre = el("pre", { class: "code" });
  // The CSS scales the font so the longest line fits: it needs the width in characters.
  const longest = Math.max(...code.split("\n").map((line) => line.length));
  pre.style.setProperty("--chars", String(longest + numberWidth));
  pre.style.setProperty("--number-width", `${numberWidth}ch`);
  lines.forEach((tokens, i) => {
    const line = el("span", { class: "code-line" });
    line.append(el("span", { class: "code-number", "aria-hidden": "true" }, String(i + 1)));
    for (const token of tokens) {
      const className = TOKEN_CLASS[token.kind];
      line.append(className ? el("span", { class: className }, token.text) : token.text);
    }
    pre.append(line, i < lines.length - 1 ? "\n" : "");
  });

  const readout = el("span", { class: "code-domain" }, DOMAIN);
  const element = el(
    "section",
    { class: "panel code-panel", "aria-label": `Code of ${fileName}` },
    el("div", { class: "panel-head" }, el("span", {}, fileName), readout),
    pre,
  );
  return {
    element,
    showCall(x, y) {
      readout.textContent = `f(${x}, ${y})`;
      readout.classList.add("active");
    },
    clearCall() {
      readout.textContent = DOMAIN;
      readout.classList.remove("active");
    },
  };
}
