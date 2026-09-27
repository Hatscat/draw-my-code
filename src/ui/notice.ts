import { ATTEMPTS, LAUNCH_DATE } from "../core/config.ts";
import { type CalendarDate, daysBetween } from "../core/date.ts";
import { setShowDigits } from "../core/player.ts";
import { puzzleNumber } from "../core/schedule.ts";
import { computeStats } from "../core/stats.ts";
import { formatCountdown, formatLongDate, msUntilNextDay } from "./clock.ts";
import { replayButton } from "./replay.ts";
import type { Screen } from "./screen.ts";
import { el } from "./dom.ts";
import { createHeader } from "./header.ts";
import { createInfoPanel } from "./info-panel.ts";
import { createStatsView } from "./stats-view.ts";
import type { Store } from "./storage.ts";

/** The screens without a puzzle: before launch, and when the schedule has run out. */
export function showNotice(
  root: HTMLElement,
  kind: "before-launch" | "no-puzzle",
  store: Store,
  onReplayTutorial: () => void,
): Screen {
  let infoOpen = false;
  const header = createHeader(() => {
    infoOpen = !infoOpen;
    info.setOpen(infoOpen);
    header.setHelpOpen(infoOpen);
  });
  const info = createInfoPanel(`You have ${ATTEMPTS} attempts.`, (on) => {
    const state = setShowDigits(store.read(), on);
    store.write(state);
    info.setShowDigits(on);
  }, [replayButton(onReplayTutorial)]);
  const heading = el(
    "h2",
    { class: "notice-title" },
    kind === "before-launch" ? `First puzzle on ${formatLongDate(LAUNCH_DATE)}` : "No puzzle today",
  );
  const line = el(
    "p",
    { class: "notice" },
    kind === "no-puzzle" ? "New puzzles are on the way." : "",
  );
  const stats = createStatsView();
  const statsSection = el("section", { class: "notice-stats", "aria-label": "Your stats" });

  function render(today: CalendarDate) {
    const state = store.read();
    info.setShowDigits(state.showDigits);
    const values = computeStats(state.results, puzzleNumber(LAUNCH_DATE, today));
    stats.render(values, undefined);
    statsSection.replaceChildren(...(values.played > 0 ? [stats.element] : []));
  }

  root.replaceChildren(header.element, info.element, heading, line, statsSection);
  let lastDate: CalendarDate | undefined;
  return {
    tick(now, today) {
      lastDate = today;
      render(today);
      if (kind !== "before-launch") return;
      const days = daysBetween(today, LAUNCH_DATE);
      line.textContent = days > 1
        ? `Starts in ${days} days`
        : `Starts in ${formatCountdown(msUntilNextDay(now))}`;
    },
    refresh() {
      if (lastDate) render(lastDate);
    },
    destroy() {},
  };
}
