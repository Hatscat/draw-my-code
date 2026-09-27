import assert from "node:assert/strict";
import {
  dateOverride,
  formatCountdown,
  formatLongDate,
  localDate,
  msUntilNextDay,
} from "./clock.ts";

const HOUR = 3_600_000;

/** Runs `check` with the process time zone set to `zone`, then restores it. */
function inZone(zone: string, check: () => void) {
  const previous = Deno.env.get("TZ");
  Deno.env.set("TZ", zone);
  try {
    check();
  } finally {
    if (previous === undefined) Deno.env.delete("TZ");
    else Deno.env.set("TZ", previous);
  }
}

Deno.test("localDate reads the local calendar date, not the UTC one", () => {
  const instant = new Date("2026-09-27T23:30:00Z");
  inZone("UTC", () => assert.deepEqual(localDate(instant), { y: 2026, m: 9, d: 27 }));
  inZone("Europe/Paris", () => assert.deepEqual(localDate(instant), { y: 2026, m: 9, d: 28 }));
  inZone("America/Los_Angeles", () => {
    assert.deepEqual(localDate(instant), { y: 2026, m: 9, d: 27 });
  });
  inZone(
    "Pacific/Kiritimati",
    () => assert.deepEqual(localDate(instant), { y: 2026, m: 9, d: 28 }),
  );
});

Deno.test("msUntilNextDay on an ordinary day", () => {
  inZone("Europe/Paris", () => {
    assert.equal(msUntilNextDay(new Date("2026-09-27T20:00:00+02:00")), 4 * HOUR);
    assert.equal(msUntilNextDay(new Date("2026-09-27T23:59:59+02:00")), 1000);
    assert.equal(msUntilNextDay(new Date("2026-09-27T00:00:00+02:00")), 24 * HOUR);
  });
});

Deno.test("msUntilNextDay across DST changes: 23 and 25 hour days", () => {
  inZone("Europe/Paris", () => {
    assert.equal(msUntilNextDay(new Date("2026-03-29T00:00:00+01:00")), 23 * HOUR);
    assert.equal(msUntilNextDay(new Date("2026-10-25T00:00:00+02:00")), 25 * HOUR);
  });
  inZone("America/New_York", () => {
    assert.equal(msUntilNextDay(new Date("2026-03-08T00:00:00-05:00")), 23 * HOUR);
    assert.equal(msUntilNextDay(new Date("2026-11-01T00:00:00-04:00")), 25 * HOUR);
  });
});

Deno.test("msUntilNextDay where a DST change skips midnight", () => {
  // Chile moves its clocks forward at midnight: 2026-09-06 begins at 01:00.
  inZone("America/Santiago", () => {
    const noon = new Date("2026-09-05T12:00:00-04:00");
    assert.equal(msUntilNextDay(noon), 12 * HOUR);
    assert.deepEqual(localDate(new Date(noon.getTime() + msUntilNextDay(noon))), {
      y: 2026,
      m: 9,
      d: 6,
    });
  });
});

Deno.test("dateOverride reads ?date=YYYY-MM-DD and ignores anything else", () => {
  assert.deepEqual(dateOverride("?date=2026-11-03"), { y: 2026, m: 11, d: 3 });
  assert.deepEqual(dateOverride("?x=1&date=2026-11-03"), { y: 2026, m: 11, d: 3 });
  assert.equal(dateOverride(""), undefined);
  assert.equal(dateOverride("?date=2026-02-30"), undefined);
  assert.equal(dateOverride("?date=tomorrow"), undefined);
});

Deno.test("formatLongDate spells the date in English, whatever the time zone", () => {
  inZone("Pacific/Honolulu", () => {
    assert.equal(formatLongDate({ y: 2026, m: 11, d: 1 }), "November 1, 2026");
  });
  inZone("Asia/Tokyo", () => {
    assert.equal(formatLongDate({ y: 2027, m: 1, d: 31 }), "January 31, 2027");
  });
});

Deno.test("formatCountdown shows hours, minutes and seconds, rounding up", () => {
  assert.equal(formatCountdown(4 * HOUR), "04:00:00");
  assert.equal(formatCountdown(25 * HOUR), "25:00:00");
  assert.equal(formatCountdown(61_500), "00:01:02");
  assert.equal(formatCountdown(1), "00:00:01");
  assert.equal(formatCountdown(0), "00:00:00");
  assert.equal(formatCountdown(-5), "00:00:00");
});
