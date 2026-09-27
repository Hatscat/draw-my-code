import type { Level } from "../levels/types.ts";
import { addDays, type CalendarDate, daysBetween } from "./date.ts";

/** Puzzle #N for a local date: #1 on the launch date. Zero or less before launch. */
export function puzzleNumber(launch: CalendarDate, today: CalendarDate): number {
  return daysBetween(launch, today) + 1;
}

/** The local date on which puzzle #N goes live. */
export function puzzleDate(launch: CalendarDate, n: number): CalendarDate {
  return addDays(launch, n - 1);
}

/** What the daily screen shows on a given local date. */
export type Daily =
  | { readonly kind: "before-launch"; readonly launch: CalendarDate }
  | { readonly kind: "puzzle"; readonly number: number; readonly level: Level }
  | { readonly kind: "no-puzzle"; readonly number: number };

export function dailyFor(
  launch: CalendarDate,
  date: CalendarDate,
  daily: readonly Level[],
): Daily {
  const number = puzzleNumber(launch, date);
  if (number < 1) return { kind: "before-launch", launch };
  const level = levelFor(daily, number);
  return level ? { kind: "puzzle", number, level } : { kind: "no-puzzle", number };
}

export function levelFor(daily: readonly Level[], number: number): Level | undefined {
  return daily.find((level) => level.id === number);
}
