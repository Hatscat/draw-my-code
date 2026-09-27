import { expect, type Locator, type Page, test as base } from "@playwright/test";
import { LAUNCH_DATE } from "../../src/core/config.ts";
import { puzzleDate } from "../../src/core/schedule.ts";

/** Every test fails on a console error or an uncaught exception. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [async ({ page }, use) => {
    const errors: string[] = [];
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
