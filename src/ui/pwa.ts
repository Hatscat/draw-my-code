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
