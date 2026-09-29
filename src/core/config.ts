import type { CalendarDate } from "./date.ts";

/**
 * Puzzle #1's local date. Placeholder, set before launch. Frozen after launch: changing it renumbers
 * every stored result.
 */
export const LAUNCH_DATE: CalendarDate = { y: 2026, m: 10, d: 5 };

/** Attempts per daily puzzle. Frozen after launch: stored results and share grids depend on it. */
export const ATTEMPTS = 3;

/** Past days whose puzzle stays open: a missed day can still be played, and keep the streak. */
export const CATCH_UP_DAYS = 7;

/** Shown as "Follow for new games" in the result panel; hidden when empty. */
export const FOLLOW_URL = "https://lone-bee.itch.io/";
