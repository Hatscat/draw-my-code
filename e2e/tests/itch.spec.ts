import { dayOf, expect, solutionOf, test } from "./fixtures.ts";

// The itch.io build, `deno task build:itch`, as itch.io serves it: from a folder of its game host,
// in an iframe of its own page. Outside that folder, every path is a 404: an absolute path in the
// build would break the game.
const GAME = "https://html-classic.itch.zone/html/12345678/";
const PAGE = "https://lone-bee.itch.io/draw-my-code";

type Page = import("@playwright/test").Page;

/** Opens itch's page for the game, with today's puzzle #1 already solved in one attempt. */
async function openOnItch(page: Page) {
  await page.route("https://html-classic.itch.zone/**", (route) => {
    const url = route.request().url();
    if (!url.startsWith(GAME)) return route.fulfill({ status: 404 });
    const file = new URL(url).pathname.slice(new URL(GAME).pathname.length) || "index.html";
    // Relative to e2e/, where Playwright runs.
    return route.fulfill({ path: `../dist-itch/${file}` }).catch(() =>
      route.fulfill({ status: 404 })
    );
  });
  await page.route(PAGE, (route) =>
    route.fulfill({
      contentType: "text/html",
      // itch's own iframe, as of 2026: no sandbox, so links can open new tabs, and no
      // clipboard-write.
      body: `<!doctype html><iframe src="${GAME}index.html?v=1790000000" width="500" height="900"
        allow="autoplay; fullscreen *; web-share" allowfullscreen></iframe>`,
    }));
  await page.clock.install({ time: dayOf(1) });
  const solution = solutionOf(1).join("");
  await page.addInitScript((grid) => {
    if (location.hostname !== "html-classic.itch.zone") return;
    localStorage.setItem(
      "draw-my-code",
      JSON.stringify({
        v: 1,
        tutorial: { done: true, next: 1 },
        results: { 1: 1 },
        plays: { 1: { solution: grid, drawing: grid, submissions: [grid] } },
      }),
    );
    // A registration would fail the test, through its console error, on every browser.
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: () => {
          console.error("a service worker was registered");
          return Promise.reject(new Error("stub"));
        },
      },
    });
  }, solution);
  await page.goto(PAGE);
  const game = page.frameLocator("iframe");
  await expect(game.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  return game;
}

test("the itch.io build plays in itch's frame, from its folder, and points to the website", async ({ page }) => {
  const game = await openOnItch(page);

  // No service worker registered (see openOnItch): the frame's origin, and its caches, belong to
  // every itch.io game.
  // No install offer: from itch's frame, it would install itch's page instead of the game.
  await game.getByRole("button", { name: "How to play and settings" }).click();
  await expect(game.getByRole("button", { name: "Install app" })).toBeHidden();
  // The reminder's file is the website's, which serves it as a calendar.
  await game.getByText("Add a daily reminder to your calendar").click();
  await expect(game.getByRole("link", { name: "Apple, Outlook, others (.ics)" }))
    .toHaveAttribute("href", "https://drawmycode.lonebee.games/reminder.ics");
});

test("in itch's frame, Share still copies, though the Clipboard API is blocked there", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "chromium" || isMobile, "desktop Chromium enforces the frame's policy");
  const game = await openOnItch(page);
  await game.getByRole("button", { name: "Share" }).click();
  await expect(game.locator(".toast")).toHaveText("Copied");
  await expect(game.getByRole("textbox", { name: "Your result, to copy" })).toBeHidden();
});
