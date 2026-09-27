/** Offline support and installed-app niceties. Production builds only. */
export function setUpPwa(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const base = import.meta.env.BASE_URL;
  navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
    // Without a service worker the game still works online.
  });
  // An installed app is where losing stats would hurt most: ask the browser to keep them.
  if (matchMedia("(display-mode: standalone)").matches) {
    navigator.storage?.persist?.().catch(() => {});
  }
}

/**
 * On the no-puzzle screen an old bundle may simply lack today's level: look for a new version
 * once, and reload when it takes over.
 */
export function checkForNewVersion(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  if (!navigator.onLine) {
    addEventListener("online", checkForNewVersion, { once: true });
    return;
  }
  // Only a page run by an older worker can get a newer one. On a first visit, the worker taking
  // control is no news, and reloading then would only race with the player.
  if (!navigator.serviceWorker.controller) return;
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), {
    once: true,
  });
  navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(
    () => {},
  );
}
