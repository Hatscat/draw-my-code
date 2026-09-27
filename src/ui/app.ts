import { LAUNCH_DATE } from "../core/config.ts";
import type { CalendarDate } from "../core/date.ts";
import { canMoveOn } from "../core/player.ts";
import { type Daily, dailyFor, levelFor } from "../core/schedule.ts";
import { daily } from "../levels/generated.ts";
import { dateOverride, localDate } from "./clock.ts";
import { type Screen, showDaily } from "./daily.ts";
import { showNotice } from "./notice.ts";
import { openStore } from "./storage.ts";
import { createToast } from "./toast.ts";

export function startApp(root: HTMLElement): void {
  const override = import.meta.env.DEV ? dateOverride(location.search) : undefined;
  const today = (): CalendarDate => override ?? localDate(new Date());
  const store = openStore();
  const toast = createToast();
  document.body.append(toast.element);

  const shown = dailyFor(LAUNCH_DATE, today(), daily);
  const screen: Screen = shown.kind === "puzzle"
    ? showDaily(root, {
      store,
      number: shown.number,
      level: shown.level,
      hasLevel: (n) => levelFor(daily, n) !== undefined,
      siteUrl: import.meta.env.VITE_SITE_URL,
      toast,
    })
    : showNotice(root, shown.kind, store);

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
    screen.tick(new Date(), date);
  };
  check();
  setInterval(check, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
  addEventListener("pageshow", check);
  store.onExternalChange(() => screen.refresh());
}

function changed(before: Daily, now: Daily): boolean {
  if (before.kind !== now.kind) return true;
  return before.kind !== "before-launch" && now.kind !== "before-launch" &&
    before.number !== now.number;
}
