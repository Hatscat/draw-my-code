import { daily } from "../../src/levels/generated.ts";
import { expect, openPuzzle, test } from "./fixtures.ts";

// The daily with the most code: the seed schedule includes one at the limit (12 lines, 36 columns).
const largest = [...daily].sort((a, b) => {
  const size = (code: string) =>
    code.split("\n").length * 100 +
    Math.max(...code.split("\n").map((l) => l.length));
  return size(b.code) - size(a.code);
})[0];

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

    await openPuzzle(page, largest.id);
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
});

test("the grid fits the screen on each device", async ({ page }) => {
  await openPuzzle(page, 1);
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
