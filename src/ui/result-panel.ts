import { ATTEMPTS, FOLLOW_URL } from "../core/config.ts";
import { distributionSlot, type Result, type Stats } from "../core/stats.ts";
import { el } from "./dom.ts";
import { createStatsView } from "./stats-view.ts";

export type Shown = "solution" | "drawing";

export interface ResultView {
  readonly result: Result;
  readonly stats: Stats;
  /** Which puzzle's result this is, for screen readers: "today", or "#2" for a missed one. */
  readonly puzzle: string;
  /** For a failed puzzle whose drawing is kept: which one the grid shows. */
  readonly shown: Shown | undefined;
  readonly canShare: boolean;
}

export type Next =
  | { readonly kind: "countdown"; readonly text: string }
  | { readonly kind: "play"; readonly number: number }
  /** From a missed puzzle: back to today's. */
  | { readonly kind: "today" };

/** A missed puzzle still open, as the result panel offers it. */
export interface Missed {
  readonly number: number;
  /** Such as "#10 · Oct 14". */
  readonly label: string;
}

export interface ResultPanelHandlers {
  onShare(): void;
  onShow(shown: Shown): void;
  onPlayNext(): void;
  onToday(): void;
  onOpen(n: number): void;
}

export interface ResultPanel {
  /** Above the grid: the result, and for a failed puzzle what the grid shows. */
  readonly top: HTMLElement;
  /** Below the grid: stats, share and when the next puzzle comes. */
  readonly bottom: HTMLElement;
  render(view: ResultView): void;
  setNext(next: Next): void;
  /** The missed puzzles still open this week; none hides the section. */
  setMissed(missed: readonly Missed[]): void;
  /** Sharing and copying both failed: show the text to copy by hand. */
  showManualCopy(text: string): void;
  focus(): void;
}

/** Shown once the daily is over, in place of the swatches and of Submit. */
export function createResultPanel(handlers: ResultPanelHandlers): ResultPanel {
  const heading = el("h2", { id: "result-title", class: "heading", tabindex: -1 });
  const showButtons = (["solution", "drawing"] as const).map((shown) => {
    const button = el(
      "button",
      { type: "button", "aria-pressed": "false" },
      shown === "solution" ? "Solution" : "Your drawing",
    );
    button.addEventListener("click", () => handlers.onShow(shown));
    return { shown, button };
  });
  const toggle = el(
    "div",
    { class: "toggle", role: "group", "aria-label": "The grid shows" },
    ...showButtons.map((b) => b.button),
  );
  const top = el("div", { class: "result-top" }, heading, toggle);

  const stats = createStatsView();
  const share = el("button", { type: "button", class: "button share" }, "Share");
  share.addEventListener("click", () => handlers.onShare());
  const manualCopy = el("textarea", {
    class: "manual-copy",
    readonly: true,
    rows: 10,
    "aria-label": "Your result, to copy",
    hidden: true,
  });
  const missedList = el("div", { class: "missed-list" });
  const missedSection = el(
    "section",
    { class: "missed", "aria-labelledby": "missed-title", hidden: true },
    el("p", { id: "missed-title" }, "Missed this week: solve them to keep your streak."),
    missedList,
  );
  // Kept at its height while empty, so the countdown's arrival doesn't move the page.
  const next = el("div", { class: "next" });
  const follow = FOLLOW_URL
    ? el(
      "a",
      { class: "follow", href: FOLLOW_URL, target: "_blank", rel: "noopener" },
      "Follow for new games",
    )
    : "";
  const bottom = el(
    "section",
    { class: "result", "aria-labelledby": "result-title" },
    stats.element,
    share,
    manualCopy,
    missedSection,
    next,
    follow,
  );

  let nextKey = "";
  let missedKey = "";
  return {
    top,
    bottom,
    render(view) {
      heading.textContent = view.result === "X"
        ? `X/${ATTEMPTS}`
        : `Solved in ${view.result}/${ATTEMPTS}`;
      toggle.hidden = view.shown === undefined;
      for (const { shown, button } of showButtons) {
        button.setAttribute("aria-pressed", String(view.shown === shown));
      }
      stats.render(view.stats, { slot: distributionSlot(view.result), puzzle: view.puzzle });
      share.hidden = !view.canShare;
    },
    setNext(value) {
      const key = value.kind === "play" ? `play ${value.number}` : value.kind;
      if (key === nextKey) {
        // Same kind as a second ago: only the countdown's text changes. Rebuilding would drop
        // the focus of a keyboard user, and swallow a click in progress.
        if (value.kind === "countdown" && next.firstChild) {
          next.firstChild.textContent = `Next puzzle in ${value.text}`;
        }
        return;
      }
      nextKey = key;
      if (value.kind === "countdown") {
        next.replaceChildren(el("p", {}, `Next puzzle in ${value.text}`));
        return;
      }
      const label = value.kind === "play" ? `Play #${value.number}` : "Back to today's puzzle";
      const button = el("button", { type: "button", class: "button play-next" }, label);
      button.addEventListener(
        "click",
        () => (value.kind === "play" ? handlers.onPlayNext() : handlers.onToday()),
      );
      next.replaceChildren(button);
    },
    setMissed(missed) {
      // Rebuilt only when the list changes: every tick calls this.
      const key = missed.map((m) => m.number).join();
      if (key === missedKey) return;
      missedKey = key;
      missedSection.hidden = missed.length === 0;
      missedList.replaceChildren(
        ...missed.map(({ number, label }) => {
          const button = el("button", { type: "button", class: "text-button" }, label);
          button.addEventListener("click", () => handlers.onOpen(number));
          return button;
        }),
      );
    },
    showManualCopy(text) {
      manualCopy.value = text;
      manualCopy.hidden = false;
      manualCopy.focus();
      manualCopy.select();
    },
    focus() {
      heading.focus();
    },
  };
}
