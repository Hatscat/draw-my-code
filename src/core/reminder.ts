import { LAUNCH_DATE } from "./config.ts";
import { type CalendarDate, formatIsoDate } from "./date.ts";

/*
 * The daily reminder players can add to their own calendar: no server, nothing stored. Every day,
 * 9:00 to 9:15 in floating time (no time zone): 9:00 wherever the player is, before and after a DST
 * change. No link to the game: from an iPhone's installed app it would open Safari, whose save is
 * separate.
 */
const TITLE = "Draw my code";
const DESCRIPTION = "Today's puzzle is ready.";
const RULE = "RRULE:FREQ=DAILY";
const day = (date: CalendarDate) => formatIsoDate(date).replaceAll("-", "");
const start = (date: CalendarDate) => `${day(date)}T090000`;
const end = (date: CalendarDate) => `${day(date)}T091500`;

/** The reminder as an .ics file, for Apple Calendar, Outlook and the others: from launch day on. */
export function reminderIcs(): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lone Bee//Draw my code//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // The same in every build: adding it again updates the event instead of doubling it.
    "UID:draw-my-code-daily@lonebee.games",
    `DTSTAMP:${day(LAUNCH_DATE)}T000000Z`,
    `DTSTART:${start(LAUNCH_DATE)}`,
    `DTEND:${end(LAUNCH_DATE)}`,
    RULE,
    `SUMMARY:${TITLE}`,
    `DESCRIPTION:${DESCRIPTION}`,
    // Shown as free time: a reminder, not a meeting.
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${TITLE}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/**
 * Google Calendar's new event form, filled with the same event: Google Calendar can't import a file
 * on Android. It starts on `today`, since Google ends a series after 730 occurrences. The form can't
 * set an alert: the player's default notifications apply. Its `recur` and `crm` parameters are
 * documented by the community, not by Google.
 */
export function googleCalendarUrl(today: CalendarDate): string {
  const query = Object.entries({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${start(today)}/${end(today)}`,
    recur: RULE,
    // Shown as free, like the file's event: the form defaults to busy.
    crm: "AVAILABLE",
    details: DESCRIPTION,
  }).map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  return `https://calendar.google.com/calendar/render?${query.join("&")}`;
}
