import { LAUNCH_DATE } from "./config.ts";
import { type CalendarDate, formatIsoDate } from "./date.ts";

/*
 * The daily reminder players can add to their own calendar: no server, nothing stored. Every day,
 * 9:00 to 9:15 in floating time (no time zone): 9:00 wherever the player is, before and after a DST
 * change. Its link opens the game in the browser: on an iPhone with the game installed, that is
 * Safari, whose save is separate from the app's.
 */
const TITLE = "Draw my code";
const RULE = "RRULE:FREQ=DAILY";
// The link last, so no punctuation sticks to it when calendars make it clickable.
const description = (siteUrl: string) => `Today's puzzle is ready: ${siteUrl}`;
const day = (date: CalendarDate) => formatIsoDate(date).replaceAll("-", "");
const start = (date: CalendarDate) => `${day(date)}T090000`;
const end = (date: CalendarDate) => `${day(date)}T091500`;

/** iCalendar text: backslashes, semicolons and commas are escaped (RFC 5545, 3.3.11). */
const escapeText = (text: string) => text.replace(/[\\;,]/g, "\\$&");

/**
 * A line longer than 75 octets goes on in lines that start with a space (RFC 5545, 3.1). Every
 * line here is ASCII, a URL's href included, so characters are octets.
 */
function fold(line: string): string {
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
}

/** The reminder as an .ics file, for Apple Calendar, Outlook and the others: from launch day on. */
export function reminderIcs(siteUrl: string): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lone Bee//Draw my code//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // The same in every build, so adding the file again doesn't double the event. Nor does it
    // update it on Apple Calendar: a reminder added earlier keeps its old text.
    "UID:draw-my-code-daily@lonebee.games",
    `DTSTAMP:${day(LAUNCH_DATE)}T000000Z`,
    `DTSTART:${start(LAUNCH_DATE)}`,
    `DTEND:${end(LAUNCH_DATE)}`,
    RULE,
    `SUMMARY:${TITLE}`,
    `DESCRIPTION:${escapeText(description(siteUrl))}`,
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
  ].map(fold).join("\r\n");
}

/**
 * Google Calendar's new event form, filled with the same event: Google Calendar can't import a file
 * on Android. It starts on `today`, since Google ends a series after 730 occurrences. The form can't
 * set an alert: the player's default notifications apply. Its `recur` and `crm` parameters are
 * documented by the community, not by Google.
 */
export function googleCalendarUrl(today: CalendarDate, siteUrl: string): string {
  const query = Object.entries({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${start(today)}/${end(today)}`,
    recur: RULE,
    // Shown as free, like the file's event: the form defaults to busy.
    crm: "AVAILABLE",
    details: description(siteUrl),
  }).map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  return `https://calendar.google.com/calendar/render?${query.join("&")}`;
}
