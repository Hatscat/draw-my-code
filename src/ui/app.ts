import { isTracking, track } from "../analytics.ts";
import { LAUNCH_DATE } from "../core/config.ts";
import { type CalendarDate, formatIsoDate } from "../core/date.ts";
import { canMoveOn } from "../core/player.ts";
import { type Daily, dailyFor, levelFor } from "../core/schedule.ts";
import { recordPageview } from "../core/sent.ts";
import { tutorialLevelToShow } from "../core/tutorial.ts";
import { daily, tutorial } from "../levels/generated.ts";
import { dateOverride, localDate } from "./clock.ts";
import { showDaily } from "./daily.ts";
import { showNotice } from "./notice.ts";
import type { Screen } from "./screen.ts";
import { openStore, type Store } from "./storage.ts";
import { createToast } from "./toast.ts";
import { showTutorial } from "./tutorial.ts";

export function startApp(root: HTMLElement): void {
  const override = import.meta.env.DEV ? dateOverride(location.search) : undefined;
  const today = (): CalendarDate => override ?? localDate(new Date());
  const store = openStore();
  const toast = createToast();
  document.body.append(toast.element);

  const shown = dailyFor(LAUNCH_DATE, today(), daily);
  countPageview(store, today());
  let screen: Screen | undefined;

  function show(next: () => Screen) {
    screen?.destroy();
    screen = next();
    screen.tick(new Date(), today());
    scrollTo(0, 0);
  }

  function showTutorialFrom(start: number, replay: boolean) {
    show(() => showTutorial(root, { store, levels: tutorial, start, replay, onDone: showMain }));
  }

  /** The tutorial until it is done or skipped, then today's daily or a notice. */
  function showMain() {
    const level = tutorialLevelToShow(store.read(), tutorial.length);
    if (level !== undefined) {
      showTutorialFrom(level, false);
      return;
    }
    const replay = () => showTutorialFrom(1, true);
    show(() =>
      shown.kind === "puzzle"
        ? showDaily(root, {
          store,
          number: shown.number,
          level: shown.level,
          hasLevel: (n) => levelFor(daily, n) !== undefined,
          siteUrl: import.meta.env.VITE_SITE_URL,
          toast,
          onReplayTutorial: replay,
        })
        : showNotice(root, shown.kind, store, replay)
    );
  }

  showMain();

  // Midnight while the page stays open, or an app resumed the next morning. A puzzle in progress
  // then stays for good: once finished, its result panel offers the new puzzle instead.
  let stayed = false;
  const check = () => {
    const date = today();
    if (!stayed && changed(shown, dailyFor(LAUNCH_DATE, date, daily))) {
      if (shown.kind !== "puzzle" || canMoveOn(store.read(), shown.number)) {
        location.reload();
        return;
      }
      stayed = true;
    }
    screen?.tick(new Date(), date);
  };
  setInterval(check, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
  addEventListener("pageshow", check);
  store.onExternalChange(() => screen?.refresh());
}

/** One pageview per local date, however many times the page loads. */
function countPageview(store: Store, date: CalendarDate) {
  if (!isTracking()) return;
  const state = store.read();
  const next = recordPageview(state, formatIsoDate(date));
  if (next === state) return;
  store.write(next);
  track("pageview");
}

function changed(before: Daily, now: Daily): boolean {
  if (before.kind !== now.kind) return true;
  return before.kind !== "before-launch" && now.kind !== "before-launch" &&
    before.number !== now.number;
}
