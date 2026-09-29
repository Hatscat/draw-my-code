import type { Stats } from "../core/stats.ts";
import { el } from "./dom.ts";

export interface StatsView {
  readonly element: HTMLElement;
  /** `current`: the result on screen, highlighted in the distribution and named by `puzzle`. */
  render(stats: Stats, current?: { readonly slot: number; readonly puzzle: string }): void;
}

/** Played, win %, streaks, and the 1/2/3/X distribution as bars with their counts. */
export function createStatsView(): StatsView {
  const values = ["Played", "Win %", "Current streak", "Max streak"].map((label) => {
    const value = el("dd", {}, "0");
    // Label first for screen readers; CSS puts the number on top.
    return { item: el("div", { class: "stat" }, el("dt", {}, label), value), value };
  });
  const bars = el("ol", { class: "distribution", "aria-label": "Results by attempts" });
  const element = el(
    "div",
    { class: "stats-view" },
    el("dl", { class: "stats" }, ...values.map((v) => v.item)),
    bars,
  );
  return {
    element,
    render(stats, current) {
      const numbers = [stats.played, stats.winPercent, stats.currentStreak, stats.maxStreak];
      values.forEach(({ value }, i) => (value.textContent = String(numbers[i] ?? 0)));
      const highest = Math.max(1, ...stats.distribution);
      const failedSlot = stats.distribution.length - 1;
      bars.replaceChildren(...stats.distribution.map((count, slot) => {
        const label = slot === failedSlot ? "X" : String(slot + 1);
        const isCurrent = slot === current?.slot;
        const bar = el("span", { class: "bar" }, String(count));
        bar.style.setProperty("--share", String(count / highest));
        return el(
          "li",
          {
            class: isCurrent ? "current" : undefined,
            "aria-current": isCurrent ? "true" : undefined,
            "aria-label": `${slot === failedSlot ? "Failed" : `In ${label}`}: ${count}` +
              (isCurrent ? `, ${current.puzzle}` : ""),
          },
          el("span", { class: "bar-label", "aria-hidden": "true" }, label),
          bar,
        );
      }));
    },
  };
}
