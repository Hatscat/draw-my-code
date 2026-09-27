import { cell, expect, openPuzzle, test } from "./fixtures.ts";

test("the game plays offline after the first visit", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Playwright supports service workers in Chromium only");
  await openPuzzle(page, 1);
  // The first visit's page is controlled right away (clients.claim), so it can go offline.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  const response = await page.reload();
  expect(response?.fromServiceWorker()).toBe(true);
  await expect(page.locator(".header-label")).toHaveText("#1");
  await cell(page, 3, 4).click();
  await expect(cell(page, 3, 4)).toHaveAccessibleName("x 3, y 4: 1 white");
});

test("the manifest and all its icons are served", async ({ request, baseURL }) => {
  const manifestUrl = new URL("manifest.webmanifest", baseURL).href;
  const response = await request.get(manifestUrl);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    display: "standalone",
    start_url: "./",
    scope: "./",
    // An id resolves against the origin, not the manifest: "./" would claim the whole origin.
    id: "draw-my-code",
  });
  const purposes = manifest.icons.map((icon: { purpose: string }) => icon.purpose);
  expect(purposes).toContain("maskable");
  for (const icon of manifest.icons as { src: string }[]) {
    const image = await request.get(new URL(icon.src, manifestUrl).href);
    expect(image.ok(), icon.src).toBe(true);
    expect(image.headers()["content-type"]).toBe("image/png");
  }
});
