import type { Page } from "@playwright/test";
import { daily } from "../../src/levels/generated.ts";
import {
  cell,
  expect,
  numberShowing,
  openPuzzle,
  paintRows,
  solutionOf,
  test,
} from "./fixtures.ts";

// The daily with the most code: the seed schedule includes one at the limit (12 lines, 36 columns).
const largest = [...daily].sort((a, b) => {
  const size = (code: string) =>
    code.split("\n").length * 100 +
    Math.max(...code.split("\n").map((l) => l.length));
  return size(b.code) - size(a.code);
})[0];

// The daily with the fewest lines. A short level leaves the whole grid on screen; a long one pushes
// it down, and the page scrolls.
const shortest =
  [...daily].sort((a, b) => a.code.split("\n").length - b.code.split("\n").length)[0];

/** The grid's box in page coordinates: scrolling doesn't move it, layout changes do. */
const gridBox = (page: Page) =>
  page.getByRole("grid").evaluate((grid) => {
    const { x, y, width, height } = grid.getBoundingClientRect();
    return { x: x + scrollX, y: y + scrollY, width, height };
  });

test.describe("at 320 px wide", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("the longest level fits without horizontal scroll", async ({ page }) => {
    if (!largest) throw new Error("no daily levels");
    const lines = largest.code.split("\n");
    // Otherwise this test no longer checks the worst case the generator allows.
    expect(
      [lines.length, Math.max(...lines.map((line) => line.length))],
      "keep one daily at 12 lines with a 36-character line",
    ).toEqual([12, 36]);

    await openPuzzle(page, numberShowing(largest));
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );

    // Every code line ends inside the code panel: no clipped or scrolling code.
    const overflow = await page.locator(".code").evaluate((pre) => {
      const box = pre.getBoundingClientRect();
      const right = box.right - parseFloat(getComputedStyle(pre).paddingRight);
      return [...pre.querySelectorAll(".code-line")].map((line) => {
        const range = document.createRange();
        range.selectNodeContents(line);
        return range.getBoundingClientRect().right - right;
      });
    });
    expect(Math.max(...overflow)).toBeLessThanOrEqual(0.5);
    const fontSize = await page.locator(".code").evaluate((el) => getComputedStyle(el).fontSize);
    expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(11);

    const grid = await page.getByRole("grid").boundingBox();
    expect(grid?.width).toBeGreaterThanOrEqual(250);
    // Every control can be brought into view.
    const controls = [
      page.getByRole("button", { name: "How to play and settings" }),
      ...(await page.getByRole("radio").all()),
      page.getByRole("gridcell").first(),
      page.getByRole("gridcell").last(),
      page.getByRole("button", { name: "Submit" }),
    ];
    for (const control of controls) {
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeInViewport();
    }
    await page.getByRole("button", { name: "How to play and settings" }).click();
    const digits = page.getByRole("switch", { name: "Show digits" });
    await digits.scrollIntoViewIfNeeded();
    await expect(digits).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
  });

  test("a failed puzzle's result, the tallest, doesn't move or resize the grid", async ({ page }) => {
    await openPuzzle(page, 1);
    await page.evaluate(() => document.fonts.ready);
    const before = await gridBox(page);
    const submit = page.getByRole("button", { name: "Submit" });
    await submit.click();
    await cell(page, 0, 0).click();
    await submit.click();
    await cell(page, 1, 0).click();
    await submit.click();
    await expect(page.getByRole("button", { name: "Your drawing" })).toBeVisible();
    expect(await gridBox(page)).toEqual(before);
  });
});

test("a short level's grid fits the screen on each device", async ({ page }) => {
  if (!shortest) throw new Error("no daily levels");
  await openPuzzle(page, numberShowing(shortest));
  await page.evaluate(() => document.fonts.ready);
  const width = page.viewportSize()?.width ?? 0;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
  const grid = await page.getByRole("grid").boundingBox();
  expect(grid?.width).toBeGreaterThanOrEqual(250);
  await expect(page.getByRole("grid")).toBeInViewport({ ratio: 1 });
});

test("opening the info panel pushes the page down instead of shrinking the grid", async ({ page }) => {
  await openPuzzle(page, 1);
  const before = (await page.getByRole("grid").boundingBox())?.width;
  await page.getByRole("button", { name: "How to play and settings" }).click();
  await expect(page.getByRole("region", { name: "How to play" })).toBeVisible();
  expect((await page.getByRole("grid").boundingBox())?.width).toBe(before);
});

test("the grid never shrinks as the window gets taller", async ({ page }) => {
  await openPuzzle(page, 1);
  let previous = 0;
  for (const height of [600, 650, 700, 701, 750, 800, 900]) {
    await page.setViewportSize({ width: 448 + 32, height });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const width = (await page.getByRole("grid").boundingBox())?.width ?? 0;
    expect(width, `grid width at ${height} px`).toBeGreaterThanOrEqual(previous);
    previous = width;
  }
});

test("neither a wrong submit nor the result moves or resizes the grid", async ({ page }) => {
  await openPuzzle(page, 1);
  await page.evaluate(() => document.fonts.ready);
  const before = await gridBox(page);

  await page.getByRole("button", { name: "Submit" }).click();
  // The longest status: two lines.
  await expect(page.locator(".status")).toContainText("Change a cell to submit again");
  expect(await gridBox(page)).toEqual(before);

  await paintRows(page, solutionOf(1));
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Solved in 2/3" })).toBeVisible();
  expect(await gridBox(page)).toEqual(before);
});

test("the scrollbar the result brings doesn't move the grid", async ({ playwright, browserName, isMobile, baseURL }) => {
  test.skip(browserName !== "chromium" || isMobile, "classic scrollbars: desktop Chromium only");
  // Headless Chromium hides scrollbars; desktop Chrome on Linux and Windows takes 15 px for them.
  const browser = await playwright.chromium.launch({
    channel: "chromium",
    ignoreDefaultArgs: ["--hide-scrollbars"],
  });
  try {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 800 },
      timezoneId: "Europe/Paris",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem(
        "draw-my-code",
        JSON.stringify({ v: 1, tutorial: { done: true, next: 1 } }),
      );
    });
    await openPuzzle(page, 1);
    const before = await gridBox(page);
    const submit = page.getByRole("button", { name: "Submit" });
    await submit.click();
    await cell(page, 0, 0).click();
    await submit.click();
    await cell(page, 1, 0).click();
    await submit.click();
    await expect(page.getByRole("heading", { name: "X/3" })).toBeVisible();
    // The stats below make the page scroll: the scrollbar is there now.
    expect(await page.evaluate(() => innerWidth - document.documentElement.clientWidth)).toBe(15);
    expect(await gridBox(page)).toEqual(before);
  } finally {
    await browser.close();
  }
});
