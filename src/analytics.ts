/**
 * The only module that talks to Umami. The tracker loads only in a production build, on the
 * production host, with a website id; anywhere else every call does nothing. Analytics failures
 * never reach the game.
 */

/** Everything the game ever sends. Events carry no properties: each would count as one more. */
export type AnalyticsEvent =
  | "pageview"
  | "puzzle_complete_1"
  | "puzzle_complete_2"
  | "puzzle_complete_3"
  | "puzzle_complete_x"
  | "share"
  | "tutorial_complete";

const SCRIPT_URL = "https://cloud.umami.is/script.js";

/** The attempt count goes in the event's name: as a property it would count as a second event. */
export function completionEvent(result: number | "X"): AnalyticsEvent {
  switch (result) {
    case 1:
      return "puzzle_complete_1";
    case 2:
      return "puzzle_complete_2";
    case 3:
      return "puzzle_complete_3";
    default:
      return "puzzle_complete_x";
  }
}

interface Umami {
  /** No argument: a pageview. */
  track(event?: string): void;
}

export interface AnalyticsSettings {
  readonly production: boolean;
  readonly websiteId: string | undefined;
  readonly siteUrl: string;
  readonly hostname: string;
}

/** Only the real site sends anything: not dev builds, previews, forks or local e2e runs. */
export function analyticsEnabled(settings: AnalyticsSettings): boolean {
  return settings.production && Boolean(settings.websiteId) &&
    settings.hostname === new URL(settings.siteUrl).hostname;
}

// Events waiting for the script to load; undefined while analytics are off.
let pending: AnalyticsEvent[] | undefined;

export function startAnalytics(): void {
  try {
    const settings: AnalyticsSettings = {
      production: import.meta.env.PROD,
      websiteId: import.meta.env.VITE_UMAMI_WEBSITE_ID,
      siteUrl: import.meta.env.VITE_SITE_URL,
      hostname: location.hostname,
    };
    if (!analyticsEnabled(settings) || !settings.websiteId) return;
    pending = [];
    const script = document.createElement("script");
    script.defer = true;
    script.src = SCRIPT_URL;
    script.dataset.websiteId = settings.websiteId;
    script.dataset.domains = settings.hostname;
    // No automatic pageviews: one per day is sent by hand, to stay within the quota.
    script.dataset.autoTrack = "false";
    script.addEventListener("load", flush);
    script.addEventListener("error", () => (pending = undefined));
    document.head.append(script);
  } catch {
    pending = undefined;
  }
}

/** Whether events are being sent: callers skip recording markers when they aren't. */
export function isTracking(): boolean {
  return pending !== undefined;
}

export function track(event: AnalyticsEvent): void {
  if (!pending) return;
  pending.push(event);
  flush();
}

function flush() {
  try {
    const umami = (globalThis as unknown as { umami?: Umami }).umami;
    if (!umami || !pending) return;
    for (const event of pending.splice(0)) {
      if (event === "pageview") umami.track();
      else umami.track(event);
    }
  } catch {
    pending = undefined;
  }
}
