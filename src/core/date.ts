/** A calendar date, month 1–12. Time enters core only in this form, never as a timestamp. */
export interface CalendarDate {
  readonly y: number;
  readonly m: number;
  readonly d: number;
}

/**
 * Days since 1970-01-01 in the proleptic Gregorian calendar (Howard Hinnant's days_from_civil).
 * Pure integer arithmetic: no Date object, so no time zone or DST can leak in.
 */
export function dayNumber({ y, m, d }: CalendarDate): number {
  const year = m <= 2 ? y - 1 : y;
  const era = Math.floor(year / 400);
  const yearOfEra = year - era * 400;
  const dayOfYear = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5) + d - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) +
    dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/** Inverse of `dayNumber` (Howard Hinnant's civil_from_days). */
export function fromDayNumber(days: number): CalendarDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) / 365,
  );
  const dayOfYear = dayOfEra -
    (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const mp = Math.floor((5 * dayOfYear + 2) / 153);
  const d = dayOfYear - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: yearOfEra + era * 400 + (m <= 2 ? 1 : 0), m, d };
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(dayNumber(date) + days);
}

/** Calendar days from `from` to `to`: positive when `to` is later. */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return dayNumber(to) - dayNumber(from);
}

/** True for a real calendar date: rejects 2026-02-30, month 13, fractions and so on. */
export function isValidDate(date: CalendarDate): boolean {
  const { y, m, d } = date;
  if (![y, m, d].every(Number.isInteger)) return false;
  const back = fromDayNumber(dayNumber(date));
  return back.y === y && back.m === m && back.d === d;
}

/** Parses exactly `YYYY-MM-DD`; anything else, including impossible dates, gives undefined. */
export function parseIsoDate(text: string): CalendarDate | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return undefined;
  const date = { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  return isValidDate(date) ? date : undefined;
}

export function formatIsoDate({ y, m, d }: CalendarDate): string {
  const pad = (n: number, width: number) => String(n).padStart(width, "0");
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}
