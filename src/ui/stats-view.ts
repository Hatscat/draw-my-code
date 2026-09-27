import type { Stats } from "../core/stats.ts";
import { el } from "./dom.ts";

export interface StatsView {
  readonly element: HTMLElement;
  /** `today`: the distribution slot of today's result, highlighted. */
  render(stats: Stats, today: number | undefined): void;
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
    render(stats, today) {
      const numbers = [stats.played, stats.winPercent, stats.currentStreak, stats.maxStreak];
      values.forEach(({ value }, i) => (value.textContent = String(numbers[i] ?? 0)));
      const highest = Math.max(1, ...stats.distribution);
      const failedSlot = stats.distribution.length - 1;
      bars.replaceChildren(...stats.distribution.map((count, slot) => {
        const label = slot === failedSlot ? "X" : String(slot + 1);
        const isToday = slot === today;
        const bar = el("span", { class: "bar" }, String(count));
        bar.style.setProperty("--share", String(count / highest));
        return el(
          "li",
          {
            class: isToday ? "today" : undefined,
            "aria-current": isToday ? "true" : undefined,
            "aria-label": `${slot === failedSlot ? "Failed" : `In ${label}`}: ${count}` +
              (isToday ? ", today" : ""),
          },
          el("span", { class: "bar-label", "aria-hidden": "true" }, label),
          bar,
        );
      }));
    },
  };
}
