import type { Epoch, Level, Puzzle, SpecialLevel } from "../levels/types.ts";
import { addDays, type CalendarDate, daysBetween } from "./date.ts";

/** Puzzle #N for a local date: #1 on the launch date. Zero or less before launch. */
export function puzzleNumber(launch: CalendarDate, today: CalendarDate): number {
  return daysBetween(launch, today) + 1;
}

/** The local date on which puzzle #N goes live. */
export function puzzleDate(launch: CalendarDate, n: number): CalendarDate {
  return addDays(launch, n - 1);
}

/** Everything the daily schedule is made of, as tools/levels.ts generates it. */
export interface Levels {
  /** The pool, in order: it loops forever. */
  readonly daily: readonly Level[];
  readonly special: readonly SpecialLevel[];
  /** Sorted by `from`; the first starts at puzzle 1. */
  readonly epochs: readonly Epoch[];
}

/** What the daily screen shows on a given local date. */
export type Daily =
  | { readonly kind: "before-launch"; readonly launch: CalendarDate }
  | { readonly kind: "puzzle"; readonly number: number; readonly level: Puzzle };

export function dailyFor(launch: CalendarDate, date: CalendarDate, levels: Levels): Daily {
  const number = puzzleNumber(launch, date);
  return number < 1
    ? { kind: "before-launch", launch }
    : { kind: "puzzle", number, level: levelFor(levels, launch, number) };
}

/** Puzzle #n's level (n from 1): its date's special, or the pool level the loop reaches. */
export function levelFor(levels: Levels, launch: CalendarDate, n: number): Puzzle {
  const { m, d } = puzzleDate(launch, n);
  const special = levels.special.find((level) => level.month === m && level.day === d);
  if (special) return special;
  // Wrapped at the pool's current length: a pool that shrank leaves no past day without a level.
  const level = levels.daily[poolIndex(levels.epochs, n) % levels.daily.length];
  // The generator guarantees a pool and epochs that cover every puzzle from 1.
  if (!level) throw new Error(`no daily level for puzzle ${n}`);
  return level;
}

/** Which pool level (from 0) puzzle #n shows, specials aside. */
export function poolIndex(epochs: readonly Epoch[], n: number): number {
  const epoch = epochs.findLast((e) => e.from <= n);
  if (!epoch || epoch.size < 1) throw new Error(`no epoch covers puzzle ${n}`);
  return (epoch.start + n - epoch.from) % epoch.size;
}

/**
 * The epochs once the pool has `size` levels, for a change that takes effect with puzzle `from`
 * (tomorrow, anywhere): puzzles before it keep their levels, and the loop carries on from where
 * it was. Before launch, or for a first pool, a single epoch.
 */
export function growEpochs(epochs: readonly Epoch[], size: number, from: number): Epoch[] {
  const kept = epochs.filter((e) => e.from < from);
  const last = kept.at(-1);
  if (from <= 1 || !last) return [{ from: 1, size, start: 0 }];
  if (last.size === size) return kept;
  return [...kept, { from, size, start: poolIndex(kept, from) % size }];
}
