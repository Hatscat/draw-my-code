import assert from "node:assert/strict";
import { googleCalendarUrl, reminderIcs } from "./reminder.ts";

Deno.test("reminderIcs: every day at 9:00 the player's time, from launch day, with an alert", () => {
  assert.equal(
    reminderIcs(),
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
      "DESCRIPTION:Today's puzzle is ready.",
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

Deno.test("googleCalendarUrl: the same event in Google's form, starting on the day it's added", () => {
  assert.equal(
    googleCalendarUrl({ y: 2027, m: 3, d: 17 }),
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Draw%20my%20code" +
      "&dates=20270317T090000%2F20270317T091500&recur=RRULE%3AFREQ%3DDAILY&crm=AVAILABLE" +
      "&details=Today's%20puzzle%20is%20ready.",
  );
});

Deno.test("googleCalendarUrl: single-digit months and days are padded", () => {
  assert.match(
    googleCalendarUrl({ y: 2026, m: 1, d: 5 }),
    /&dates=20260105T090000%2F20260105T091500&/,
  );
});
