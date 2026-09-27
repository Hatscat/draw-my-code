/**
 * The service worker: the game plays offline after the first visit. Hand-written; the build
 * replaces __PRECACHE__ and __BUILD_HASH__ (tools/vite-sw-plugin.ts). A classic script without
 * imports, type-checked on its own with the WebWorker lib (tools/sw.deno.json).
 */

declare const self: ServiceWorkerGlobalScope;
declare const __PRECACHE__: readonly string[];
declare const __BUILD_HASH__: string;

// The origin may host other games: only caches with this prefix are ours to delete.
const PREFIX = "draw-my-code-";
const CACHE = `${PREFIX}${__BUILD_HASH__}`;
const NAVIGATION_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Bypass the HTTP cache: GitHub Pages serves max-age=600, which could pair new HTML with
    // stale files.
    await cache.addAll(__PRECACHE__.map((url) => new Request(url, { cache: "reload" })));
    // Take over on the next load instead of waiting for every tab to close.
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    // Control the page of the first visit too, so it works offline without a reload.
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? networkFirst(request) : cacheFirst(request));
});

/** Pages: the network when it answers in time, so new levels arrive; else the cached shell. */
async function networkFirst(request: Request): Promise<Response> {
  try {
    return await fetch(request, {
      cache: "no-cache",
      signal: AbortSignal.timeout(NAVIGATION_TIMEOUT_MS),
    });
  } catch {
    // A shared link may carry a query string (?fbclid=…): the shell is the same page.
    return (await caches.match("./", { ignoreSearch: true })) ?? Response.error();
  }
}

/** Hashed assets never change: the cache first. `ignoreVary`: some servers vary on Origin. */
async function cacheFirst(request: Request): Promise<Response> {
  return (await caches.match(request, { ignoreVary: true })) ?? fetch(request);
}
