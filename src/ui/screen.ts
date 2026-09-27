import type { CalendarDate } from "../core/date.ts";

/** What the app shows: the tutorial, the daily, or a notice. The app keeps it up to date. */
export interface Screen {
  /** Every second and whenever the app comes back to the foreground. */
  tick(now: Date, today: CalendarDate): void;
  /** Another tab changed the saved state. */
  refresh(): void;
  /** Before another screen replaces this one. */
  destroy(): void;
}
