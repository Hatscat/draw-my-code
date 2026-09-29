import { isTracking, track } from "../analytics.ts";
import { LAUNCH_DATE } from "../core/config.ts";
import { type CalendarDate, formatIsoDate } from "../core/date.ts";
import { canMoveOn, isPlayable } from "../core/player.ts";
import { type Daily, dailyFor, levelFor, type Levels, puzzleNumber } from "../core/schedule.ts";
import { recordPageview } from "../core/sent.ts";
import { tutorialLevelToShow } from "../core/tutorial.ts";
import { daily, epochs, special, tutorial } from "../levels/generated.ts";
import { dateOverride, localDate } from "./clock.ts";
import { showDaily } from "./daily.ts";
import { offerInstall } from "./install-dialog.ts";
import { showNotice } from "./notice.ts";
import type { Screen } from "./screen.ts";
import { openStore, type Store } from "./storage.ts";
import { createToast } from "./toast.ts";
import { showTutorial } from "./tutorial.ts";

const LEVELS: Levels = { daily, special, epochs };

export function startApp(root: HTMLElement): void {
  const override = import.meta.env.DEV ? dateOverride(location.search) : undefined;
  const today = (): CalendarDate => override ?? localDate(new Date());
  const store = openStore();
  const toast = createToast();
  document.body.append(toast.element);

  let shown = dailyFor(LAUNCH_DATE, today(), LEVELS);
  // The puzzle on screen: today's, or a missed one being caught up.
  let viewing = shown.kind === "puzzle" ? shown.number : 0;
  let screen: Screen | undefined;
  // The midnight reload waits while the tutorial is on screen: it would wipe the level in play.
  let inTutorial = false;
  // A puzzle in progress at midnight stays on screen, and the reload is off until the next one.
  let stayed = false;

  // Only a page someone is looking at counts as a visit: not a tab reloaded in the background.
  const pageview = countPageview(store);
  const countVisit = () => {
    if (document.visibilityState === "visible") pageview(today());
  };
  countVisit();

  function show(next: () => Screen) {
    // Replacing the screen removes the focused control: keep keyboard users in place. Not after
    // a tap: moving the focus would scroll a small screen down, away from the code.
    const active = document.activeElement;
    const hadFocus = active !== null && root.contains(active) && active.matches(":focus-visible");
    screen?.destroy();
    screen = next();
    screen.tick(new Date(), today());
    scrollTo(0, 0);
    if (hadFocus) screen.focus();
  }

  function showTutorialFrom(start: number, replay: boolean) {
    inTutorial = true;
    const onDone = (finished: boolean) => {
      showMain();
      // The end of a first tutorial: the moment to suggest playing every day from an app.
      if (finished && !replay) offerInstall();
    };
    show(() => showTutorial(root, { store, levels: tutorial, start, replay, onDone }));
  }

  /** The tutorial until it is done or skipped, then today's daily or a notice. */
  function showMain() {
    const level = tutorialLevelToShow(store.read(), tutorial.length);
    if (level !== undefined) {
      showTutorialFrom(level, false);
      return;
    }
    inTutorial = false;
    // The day may have changed during the tutorial or a missed puzzle. No reload: it would drop
    // the install invitation that follows a first tutorial.
    shown = dailyFor(LAUNCH_DATE, today(), LEVELS);
    stayed = false;
    show(() =>
      shown.kind === "puzzle" ? dailyScreen(shown.number) : showNotice(root, store, replay)
    );
  }

  const replay = () => showTutorialFrom(1, true);

  function dailyScreen(n: number): Screen {
    viewing = n;
    const todayNumber = shown.kind === "puzzle" ? shown.number : 0;
    return showDaily(root, {
      store,
      number: n,
      level: levelFor(LEVELS, LAUNCH_DATE, n),
      siteUrl: import.meta.env.VITE_SITE_URL,
      toast,
      today: todayNumber,
      onReplayTutorial: replay,
      onOpen(k) {
        // Only a missed puzzle still open: the list may have been drawn before midnight.
        if (isPlayable(k, puzzleNumber(LAUNCH_DATE, today()))) show(() => dailyScreen(k));
      },
      onToday: showMain,
    });
  }

  showMain();

  // Midnight while the page stays open, or an app resumed the next morning. A puzzle in progress
  // then stays: once finished, its result panel offers the new puzzle instead.
  const check = () => {
    const date = today();
    if (!inTutorial && !stayed && changed(shown, dailyFor(LAUNCH_DATE, date, LEVELS))) {
      if (shown.kind !== "puzzle" || canMoveOn(store.read(), viewing)) {
        location.reload();
        return;
      }
      stayed = true;
    }
    screen?.tick(new Date(), date);
  };
  setInterval(check, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    check();
    countVisit();
  });
  addEventListener("pageshow", check);
  store.onExternalChange(() => screen?.refresh());
}

/**
 * One pageview per local date, however many times the page loads. Returns the function to call
 * on each visible moment; it queues at most one pageview per date for this page.
 */
function countPageview(store: Store): (date: CalendarDate) => void {
  let queued = "";
  return (date) => {
    const day = formatIsoDate(date);
    if (!isTracking() || !store.persistent() || queued === day) return;
    const state = store.read();
    if (recordPageview(state, day) === state) return;
    queued = day;
    track("pageview", () => store.write(recordPageview(store.read(), day)));
  };
}

function changed(before: Daily, now: Daily): boolean {
  if (before.kind !== now.kind) return true;
  return before.kind !== "before-launch" && now.kind !== "before-launch" &&
    before.number !== now.number;
}
