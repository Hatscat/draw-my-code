/**
 * The one place where timestamps become calendar dates. Local time is read here, in src/ui, so core
 * only ever sees `{ y, m, d }`.
 */

import { type CalendarDate, parseIsoDate } from "../core/date.ts";

/** The player's local calendar date at `now`. */
export function localDate(now: Date): CalendarDate {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

/**
 * Milliseconds until the next local date begins. The Date constructor normalizes local times, so
 * DST days (23 or 25 hours) and zones that skip midnight (the day then starts at 01:00) come out
 * right, which subtracting 24 hours would not.
 */
export function msUntilNextDay(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Dev builds only: `?date=YYYY-MM-DD` pretends today is another day. */
export function dateOverride(search: string): CalendarDate | undefined {
  const value = new URLSearchParams(search).get("date");
  return value === null ? undefined : parseIsoDate(value);
}

/** "October 1, 2026", from a calendar date, whatever the player's time zone. */
export function formatLongDate({ y, m, d }: CalendarDate): string {
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
