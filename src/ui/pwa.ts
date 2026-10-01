import { ITCH } from "../itch.ts";

/** Offline support and installed-app niceties. Production builds only, and not on itch.io. */
export function setUpPwa(): void {
  if (ITCH || !import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const base = import.meta.env.BASE_URL;
  navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
    // Without a service worker the game still works online.
  });
  // An installed app is where losing stats would hurt most: ask the browser to keep them.
  if (matchMedia("(display-mode: standalone)").matches) {
    navigator.storage?.persist?.().catch(() => {});
  }
}
