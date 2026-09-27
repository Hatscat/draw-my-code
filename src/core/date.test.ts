import assert from "node:assert/strict";
import {
  addDays,
  type CalendarDate,
  dayNumber,
  daysBetween,
  formatIsoDate,
  fromDayNumber,
  isValidDate,
  parseIsoDate,
} from "./date.ts";

const date = (y: number, m: number, d: number): CalendarDate => ({ y, m, d });

Deno.test("dayNumber counts from the Unix epoch", () => {
  assert.equal(dayNumber(date(1970, 1, 1)), 0);
  assert.equal(dayNumber(date(1969, 12, 31)), -1);
  assert.equal(dayNumber(date(2000, 3, 1)), 11017);
});

Deno.test("dayNumber agrees with Date.UTC over four centuries", () => {
  // Date.UTC is only the oracle here; core itself never uses Date.
  for (let days = dayNumber(date(1900, 1, 1)); days <= dayNumber(date(2300, 1, 1)); days += 1) {
    const utc = new Date(days * 86_400_000);
    const expected = date(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
    assert.deepEqual(fromDayNumber(days), expected);
    assert.equal(dayNumber(expected), days);
  }
});

Deno.test("daysBetween crosses month and year boundaries", () => {
  assert.equal(daysBetween(date(2026, 1, 31), date(2026, 2, 1)), 1);
  assert.equal(daysBetween(date(2026, 12, 31), date(2027, 1, 1)), 1);
  assert.equal(daysBetween(date(2027, 1, 1), date(2026, 12, 31)), -1);
  assert.equal(daysBetween(date(2026, 9, 27), date(2026, 9, 27)), 0);
});

Deno.test("daysBetween follows leap years, including the century rules", () => {
  assert.equal(daysBetween(date(2024, 2, 28), date(2024, 3, 1)), 2); // leap
  assert.equal(daysBetween(date(2026, 2, 28), date(2026, 3, 1)), 1); // common
  assert.equal(daysBetween(date(2000, 2, 28), date(2000, 3, 1)), 2); // divisible by 400
  assert.equal(daysBetween(date(2100, 2, 28), date(2100, 3, 1)), 1); // divisible by 100 only
  assert.equal(daysBetween(date(2024, 1, 1), date(2025, 1, 1)), 366);
});

Deno.test("daysBetween ignores DST: calendar days only", () => {
  // Europe: 2026-03-29 and 2026-10-25; US: 2026-03-08 and 2026-11-01. Each is one plain day.
  assert.equal(daysBetween(date(2026, 3, 28), date(2026, 3, 30)), 2);
  assert.equal(daysBetween(date(2026, 10, 24), date(2026, 10, 26)), 2);
  assert.equal(daysBetween(date(2026, 3, 7), date(2026, 3, 9)), 2);
  assert.equal(daysBetween(date(2026, 10, 31), date(2026, 11, 2)), 2);
});

Deno.test("addDays moves across boundaries both ways", () => {
  assert.deepEqual(addDays(date(2026, 12, 31), 1), date(2027, 1, 1));
  assert.deepEqual(addDays(date(2024, 2, 28), 1), date(2024, 2, 29));
  assert.deepEqual(addDays(date(2024, 3, 1), -1), date(2024, 2, 29));
  assert.deepEqual(addDays(date(2026, 11, 1), 0), date(2026, 11, 1));
  assert.deepEqual(addDays(date(2026, 11, 1), 365), date(2027, 11, 1));
});

Deno.test("isValidDate rejects impossible dates", () => {
  assert.equal(isValidDate(date(2024, 2, 29)), true);
  assert.equal(isValidDate(date(2026, 2, 29)), false);
  assert.equal(isValidDate(date(2026, 2, 30)), false);
  assert.equal(isValidDate(date(2026, 4, 31)), false);
  assert.equal(isValidDate(date(2026, 13, 1)), false);
  assert.equal(isValidDate(date(2026, 0, 1)), false);
  assert.equal(isValidDate(date(2026, 1, 0)), false);
  assert.equal(isValidDate(date(2026, 1, 1.5)), false);
  assert.equal(isValidDate(date(2026, 1, NaN)), false);
});

Deno.test("parseIsoDate accepts exactly YYYY-MM-DD", () => {
  assert.deepEqual(parseIsoDate("2026-09-27"), date(2026, 9, 27));
  assert.deepEqual(parseIsoDate("2024-02-29"), date(2024, 2, 29));
  for (
    const bad of ["2026-9-27", "2026-09-27T00:00", " 2026-09-27", "2026-02-30", "27/09/2026", ""]
  ) {
    assert.equal(parseIsoDate(bad), undefined, bad);
  }
});

Deno.test("formatIsoDate pads every part", () => {
  assert.equal(formatIsoDate(date(2026, 1, 5)), "2026-01-05");
  assert.equal(formatIsoDate(date(999, 12, 31)), "0999-12-31");
});
