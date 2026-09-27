import { expect, type Locator, type Page, test as base } from "@playwright/test";
import { LAUNCH_DATE } from "../../src/core/config.ts";
import { puzzleDate } from "../../src/core/schedule.ts";
import { daily } from "../../src/levels/generated.ts";
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
  const box = await cell(page, x, y).boundingBox();
  if (!box) throw new Error(`cell ${x}, ${y} is not visible`);
  return { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 };
}

/** Puzzle #n's solution: 8 rows of 8 digits, from the generated levels. */
export function solutionOf(n: number): readonly string[] {
  const level = daily.find((l) => l.id === n);
  if (!level) throw new Error(`no daily #${n}`);
  return level.solution;
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

/** The site URL the build under test puts in share texts. */
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
  }, [shareError, clipboardFails] as const);
}

export function sharedTexts(page: Page) {
  return page.evaluate(() => {
    const record = window as unknown as { shared: string[]; copied: string[]; attempts: number };
    return { shared: record.shared, copied: record.copied, attempts: record.attempts };
  });
}
