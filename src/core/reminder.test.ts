import assert from "node:assert/strict";
import { googleCalendarUrl, reminderIcs } from "./reminder.ts";

const SITE = "https://drawmycode.lonebee.games/";
const unfold = (ics: string) => ics.replaceAll("\r\n ", "");

Deno.test("reminderIcs: every day at 9:00 the player's time, from launch day, with an alert", () => {
  assert.equal(
    reminderIcs(SITE),
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Lone Bee//Draw my code//EN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:draw-my-code-daily@lonebee.games",
      "DTSTAMP:20261005T000000Z",
      "DTSTART:20261005T090000",
      "DTEND:20261005T091500",
      "RRULE:FREQ=DAILY",
      "SUMMARY:Draw my code",
      "DESCRIPTION:Today's puzzle is ready: https://drawmycode.lonebee.games/",
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Draw my code",
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n"),
  );
});

Deno.test("reminderIcs: a line of exactly 75 octets stays whole", () => {
  const ics = reminderIcs("https://hatscat.github.io/draw-my-cod/");
  assert.ok(
    ics.includes(
      "\r\nDESCRIPTION:Today's puzzle is ready: https://hatscat.github.io/draw-my-cod/\r\n",
    ),
  );
});

Deno.test("reminderIcs: a longer line goes on in lines that start with a space", () => {
  assert.ok(
    reminderIcs("https://hatscat.github.io/draw-my-code/").includes(
      "\r\nDESCRIPTION:Today's puzzle is ready: https://hatscat.github.io/draw-my-code\r\n /\r\n",
    ),
  );
  const long = `https://example.com/${"a".repeat(200)}/`;
  const ics = reminderIcs(long);
  assert.ok(ics.split("\r\n").every((line) => line.length <= 75));
  assert.ok(unfold(ics).includes(`\r\nDESCRIPTION:Today's puzzle is ready: ${long}\r\n`));
});

Deno.test("reminderIcs: backslashes, commas and semicolons in the link are escaped", () => {
  // A URL keeps a backslash in its query: the one place a site URL could hold one.
  assert.ok(
    reminderIcs("https://example.com/a,b;c/?d\\e").includes(
      "\r\nDESCRIPTION:Today's puzzle is ready: https://example.com/a\\,b\\;c/?d\\\\e\r\n",
    ),
  );
});

Deno.test("googleCalendarUrl: the same event in Google's form, starting on the day it's added", () => {
  assert.equal(
    googleCalendarUrl({ y: 2027, m: 3, d: 17 }, SITE),
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Draw%20my%20code" +
      "&dates=20270317T090000%2F20270317T091500&recur=RRULE%3AFREQ%3DDAILY&crm=AVAILABLE" +
      "&details=Today's%20puzzle%20is%20ready%3A%20https%3A%2F%2Fdrawmycode.lonebee.games%2F",
  );
});

Deno.test("googleCalendarUrl: single-digit months and days are padded", () => {
  assert.match(
    googleCalendarUrl({ y: 2026, m: 1, d: 5 }, SITE),
    /&dates=20260105T090000%2F20260105T091500&/,
  );
});
