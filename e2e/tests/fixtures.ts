import { expect, type Locator, type Page, test as base } from "@playwright/test";
import { LAUNCH_DATE } from "../../src/core/config.ts";
import { levelFor, type Levels, puzzleDate } from "../../src/core/schedule.ts";
import { daily, epochs, special } from "../../src/levels/generated.ts";
import type { Puzzle } from "../../src/levels/types.ts";
import { siteUrl } from "../../tools/site-url.ts";

/**
 * Every test fails on a console error or an uncaught exception. Tests start with the tutorial
 * done unless they opt out with `test.use({ tutorialDone: false })`.
 */
export const test = base.extend<{ consoleErrors: string[]; tutorialDone: boolean }>({
  tutorialDone: [true, { option: true }],
  page: async ({ page, tutorialDone }, use) => {
    if (tutorialDone) {
      await page.addInitScript(() => {
        // Only on the first load: later loads must see what the test did.
        if (localStorage.getItem("draw-my-code") !== null) return;
        localStorage.setItem(
          "draw-my-code",
          JSON.stringify({ v: 1, tutorial: { done: true, next: 1 } }),
        );
      });
    }
    await use(page);
  },
  consoleErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    // Local and CI runs never talk to the analytics hosts.
    page.on("request", (request) => {
      const host = new URL(request.url()).hostname;
      if (host === "umami.is" || host.endsWith(".umami.is")) errors.push(`request to ${host}`);
    });
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});

export { expect };

/** Noon UTC on the day puzzle #n goes live: the same local date in every tested time zone. */
export function dayOf(n: number): Date {
  const { y, m, d } = puzzleDate(LAUNCH_DATE, n);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/** Opens the app with the clock set to the day of puzzle #n. */
export async function openPuzzle(page: Page, n: number): Promise<void> {
  await page.clock.install({ time: dayOf(n) });
  await page.goto("./");
  await expect(page.getByRole("grid")).toBeVisible();
}

export function cell(page: Page, x: number, y: number): Locator {
  return page.getByRole("gridcell", { name: new RegExp(`^x ${x}, y ${y}:`) });
}

/** The center of cell (x, y) in viewport coordinates. */
export async function cellCenter(page: Page, x: number, y: number) {
  // The whole grid, not just the cell: the centers of several cells, taken for one drag, stay
  // valid. With a long level, part of the grid starts below the fold.
  await page.getByRole("grid").scrollIntoViewIfNeeded();
  const box = await cell(page, x, y).boundingBox();
  if (!box) throw new Error(`cell ${x}, ${y} is not visible`);
  return { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
}

export const LEVELS: Levels = { daily, special, epochs };

/** Puzzle #n's level, as the game schedules it: its date's special, or the pool's. */
export function levelOf(n: number): Puzzle {
  return levelFor(LEVELS, LAUNCH_DATE, n);
}

/** Puzzle #n's solution: 8 rows of 8 digits, from the generated levels. */
export function solutionOf(n: number): readonly string[] {
  return levelOf(n).solution;
}

/** The code the code panel shows, without its line numbers. */
export function shownCode(page: Page): Promise<string> {
  return page.locator(".code").evaluate((pre) =>
    [...pre.querySelectorAll(".code-line")].map((line) =>
      [...line.childNodes]
        .filter((node) => !(node instanceof HTMLElement && node.classList.contains("code-number")))
        .map((node) => node.textContent)
        .join("")
    ).join("\n")
  );
}

/** The first puzzle that shows `level`. */
export function numberShowing(level: Puzzle): number {
  for (let n = 1; n <= 5000; n++) if (levelOf(n) === level) return n;
  throw new Error("no puzzle shows this level");
}

/** Paints `rows` (8 rows of 8 digits) onto a blank grid, one color at a time. */
export async function paintRows(page: Page, rows: readonly string[]): Promise<void> {
  for (const color of "1234567") {
    const cells = rows.flatMap((row, y) =>
      [...row].flatMap((d, x) => (d === color ? [[x, y]] : []))
    );
    if (cells.length === 0) continue;
    await page.keyboard.press(color);
    for (const [x, y] of cells) await cell(page, x ?? 0, y ?? 0).click();
  }
}

/** Instagram's browser on an iPhone: like most in-app browsers, it leaves Safari/ out. */
export const INSTAGRAM_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0";

/**
 * The site URL the build under test puts in share texts and links. Not where the tests load
 * pages: CI serves its production build from 127.0.0.1, at the site's path.
 */
// deno-lint-ignore no-process-global -- Playwright runs this file on Node
export const SITE_URL = siteUrl(process.env.VITE_SITE_URL).href;

/**
 * Replaces the Web Share API and the clipboard with recorders, before the page loads.
 * `shareError` makes navigator.share reject, as when the player cancels the share sheet.
 */
export async function stubShare(
  page: Page,
  shareError?: string,
  { clipboardFails = false } = {},
): Promise<void> {
  await page.addInitScript(([errorName, clipboardBroken]) => {
    const record = window as unknown as { shared: string[]; copied: string[]; attempts: number };
    record.shared = [];
    record.copied = [];
    record.attempts = 0;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: ShareData) => {
        record.attempts++;
        if (errorName) return Promise.reject(new DOMException("stubbed", errorName));
        record.shared.push(data.text ?? "");
        return Promise.resolve();
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          if (clipboardBroken) return Promise.reject(new DOMException("denied", "NotAllowedError"));
          record.copied.push(text);
          return Promise.resolve();
        },
      },
    });
    // The old way of copying, the game's fallback, fails along with the clipboard.
    const execCommand = document.execCommand.bind(document);
    document.execCommand = (command, ...rest) =>
      clipboardBroken && command === "copy" ? false : execCommand(command, ...rest);
  }, [shareError, clipboardFails] as const);
}

/**
 * Counts the confetti bursts from the first load on. Checking for none with this count can't
 * pass by waiting until a burst has gone, as checking for no canvas could.
 */
export async function countConfetti(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const record = window as unknown as { confetti: number };
    record.confetti = 0;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && node.classList.contains("confetti")) record.confetti++;
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
}

export function confettiBursts(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { confetti: number }).confetti);
}

/**
 * Fires the event Chromium sends when the app can be installed; headless Chromium never does.
 * Its prompt() records the call in window.installPrompted.
 */
export async function offerInstall(page: Page): Promise<void> {
  await page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: () => {
        (window as unknown as { installPrompted: boolean }).installPrompted = true;
        return Promise.resolve();
      },
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });
    dispatchEvent(event);
  });
}

export function installPrompted(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    (window as unknown as { installPrompted?: boolean }).installPrompted === true
  );
}

export function sharedTexts(page: Page) {
  return page.evaluate(() => {
    const record = window as unknown as { shared: string[]; copied: string[]; attempts: number };
    return { shared: record.shared, copied: record.copied, attempts: record.attempts };
  });
}
