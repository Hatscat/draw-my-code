import { addDays, type CalendarDate, daysBetween } from "./date.ts";

/** Puzzle #N for a local date: #1 on the launch date. Zero or less before launch. */
export function puzzleNumber(launch: CalendarDate, today: CalendarDate): number {
  return daysBetween(launch, today) + 1;
}

/** The local date on which puzzle #N goes live. */
export function puzzleDate(launch: CalendarDate, n: number): CalendarDate {
  return addDays(launch, n - 1);
}
