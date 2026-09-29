import { cell, expect, installPrompted, offerInstall, openPuzzle, test } from "./fixtures.ts";

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

test("the info panel offers to install the app when the browser can", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || isMobile, "desktop Chromium, with and without an offer");
  await openPuzzle(page, 1);
  await page.getByRole("button", { name: "How to play and settings" }).click();
  const install = page.getByRole("button", { name: "Install app" });
  await expect(install).toBeHidden();
  await offerInstall(page);
  await install.click();
  const dialog = page.getByRole("dialog", { name: "Install Draw my code" });
  await dialog.getByRole("button", { name: "Install" }).click();
  await expect.poll(() => installPrompted(page)).toBe(true);
  // A prompt can be shown once: the offer is gone, and the focus moved to a control still there.
  await expect(install).toBeHidden();
  await expect(page.getByRole("switch", { name: "Show digits" })).toBeFocused();
});

test("the service worker leaves the link preview image out of the offline cache", async ({ request, baseURL }) => {
  const script = await (await request.get(new URL("sw.js", baseURL).href)).text();
  expect(script).toContain("manifest.webmanifest");
  // Only link-preview crawlers fetch it, never the game.
  expect(script).not.toContain("og.png");
});
