/**
 * Installing the app: Chromium browsers offer a prompt the page can open; iOS and Safari on macOS
 * only install from their own menus, so the game can at best explain where.
 */

/** How this browser installs the app, or undefined if it can't or already has. */
export type InstallWay = "prompt" | "ios" | "mac-safari";

/** Chromium's `beforeinstallprompt` event, which lib.dom doesn't describe. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
  readonly userChoice: Promise<{ readonly outcome: "accepted" | "dismissed" }>;
}

let offer: InstallPromptEvent | undefined;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((listener) => listener());

/** Listens for the browser's install offer. Call once, early: the offer can come any time. */
export function watchInstall(): void {
  addEventListener("beforeinstallprompt", (event) => {
    // Keeps Chrome's own install bar away: the game offers at the end of the tutorial instead.
    event.preventDefault();
    offer = event as InstallPromptEvent;
    changed();
  });
  addEventListener("appinstalled", () => {
    offer = undefined;
    changed();
  });
}

/** Calls `listener` whenever the install offer comes or goes; returns the unsubscribe. */
export function onInstallChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const standalone = () =>
  (navigator as { readonly standalone?: boolean }).standalone === true ||
  matchMedia("(display-mode: standalone)").matches;

// iPadOS reports itself as a Mac, but a touch screen gives it away.
const apple = (agent: string) =>
  /iPhone|iPad|iPod/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1);

/**
 * An iOS app's own browser, such as Instagram's or Facebook's. Safari, Chrome, Firefox and Edge all
 * say Safari/ on iOS; most in-app browsers leave it out. They have no Add to Home Screen, and can't
 * hand a calendar file to Calendar.
 */
export function inIosAppBrowser(): boolean {
  const agent = navigator.userAgent;
  return !standalone() && apple(agent) && !/Safari\//.test(agent);
}

export function installWay(): InstallWay | undefined {
  if (standalone()) return undefined;
  if (offer) return "prompt";
  const agent = navigator.userAgent;
  if (apple(agent) && /Safari\//.test(agent)) return "ios";
  if (/Macintosh/.test(agent) && /Version\/[\d.]+ Safari\//.test(agent)) return "mac-safari";
  return undefined;
}

/** Opens the browser's install prompt; the offer is spent either way. */
export async function promptInstall(): Promise<void> {
  const event = offer;
  if (!event) return;
  offer = undefined;
  changed();
  try {
    await event.prompt();
    await event.userChoice;
  } catch {
    // The browser refused to show it: nothing to do, the game plays on in the tab.
  }
}
