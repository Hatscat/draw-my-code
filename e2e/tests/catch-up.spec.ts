import { cell, expect, openPuzzle, paintRows, solutionOf, test } from "./fixtures.ts";

/** Moves the page's clock past the next local midnight, and lets a tick see it. */
async function pastMidnight(page: import("@playwright/test").Page) {
  const untilMidnight = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  });
  await page.clock.fastForward(untilMidnight + 5_000);
  await page.clock.runFor(5_000);
}

// Each test seeds its own results: the tutorial is done, and some puzzles are finished already.
test.use({ tutorialDone: false });

async function withResults(
  page: import("@playwright/test").Page,
  results: Record<number, number | "X">,
) {
  await page.addInitScript((seeded) => {
    if (localStorage.getItem("draw-my-code") !== null) return;
    localStorage.setItem(
      "draw-my-code",
      JSON.stringify({ v: 1, tutorial: { done: true, next: 1 }, results: seeded }),
    );
  }, results);
}

const streak = (page: import("@playwright/test").Page) =>
  page.locator(".stat", { hasText: "Current streak" }).locator("dd");

test("a missed puzzle stays open for a week, and catching it up joins the streak", async ({ page }) => {
  // Puzzles 1 and 3 solved; today is 3, so 2 was missed.
  await withResults(page, { 1: 1, 3: 1 });
  await openPuzzle(page, 3);
  await expect(streak(page)).toHaveText("1");
  await expect(page.getByText("Missed this week: solve them to keep your streak.")).toBeVisible();

  await page.getByRole("button", { name: "#2 · Oct 6" }).click();
  await expect(page.locator(".header-label")).toHaveText("#2 · Oct 6");
  await paintRows(page, solutionOf(2));
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  await expect(streak(page)).toHaveText("3");
  // The highlighted bar is this puzzle's result, not today's.
  await expect(page.getByRole("listitem", { name: "In 1: 3, #2" })).toBeVisible();
  await expect(page.locator(".missed")).toBeHidden();

  await page.getByRole("button", { name: "Back to #3" }).click();
  await expect(page.locator(".header-label")).toHaveText("#3");
  await expect(streak(page)).toHaveText("3");
});

test("leaving a missed puzzle for today's keeps its drawing for later", async ({ page }) => {
  await withResults(page, { 1: 1, 3: 1 });
  await openPuzzle(page, 3);
  await page.getByRole("button", { name: "#2 · Oct 6" }).click();
  await page.keyboard.press("5");
  await cell(page, 0, 0).click();
  await page.getByRole("button", { name: "Back to today's puzzle" }).click();
  await expect(page.locator(".header-label")).toHaveText("#3");
  await page.getByRole("button", { name: "#2 · Oct 6" }).click();
  await expect(cell(page, 0, 0)).toHaveAccessibleName("x 0, y 0: 5 green");
});

test("a puzzle older than a week is no longer offered", async ({ page }) => {
  // Today is 10: 3 to 9 are still open, 2 has closed.
  await withResults(page, { 1: 1, 10: 1 });
  await openPuzzle(page, 10);
  const missed = page.locator(".missed-list").getByRole("button");
  await expect(missed).toHaveText([
    "#3 · Oct 7",
    "#4 · Oct 8",
    "#5 · Oct 9",
    "#6 · Oct 10",
    "#7 · Oct 11",
    "#8 · Oct 12",
    "#9 · Oct 13",
  ]);
});

test.describe("on a small phone screen", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("tapping a missed puzzle opens it at the top of the page", async ({ page }) => {
    await withResults(page, { 1: 1, 3: 1 });
    await openPuzzle(page, 3);
    await page.getByRole("button", { name: "#2 · Oct 6" }).click();
    await expect(page.locator(".header-label")).toHaveText("#2 · Oct 6");
    // The header says which missed puzzle this is: it must be in view.
    await expect(page.locator(".header-label")).toBeInViewport({ ratio: 1 });
  });
});

test("a page left open across midnights keeps its list of missed puzzles current", async ({ page }) => {
  test.slow();
  await withResults(page, { 1: 1 });
  await openPuzzle(page, 9);
  // Puzzle 9 in progress at midnight: it stays on screen, and the page won't reload again.
  const solution = solutionOf(9).join("");
  const at = [...solution].findIndex((digit) => digit !== "0");
  await page.keyboard.press(solution[at] ?? "1");
  await cell(page, at % 8, Math.floor(at / 8)).click();
  await pastMidnight(page);
  await paintRows(page, solutionOf(9));
  await page.getByRole("button", { name: "Submit" }).click();
  const missed = page.locator(".missed-list").getByRole("button");
  // Today is 10: puzzles 3 to 8 are open and missed.
  await expect(missed.first()).toHaveText("#3 · Oct 7");
  await pastMidnight(page);
  // Today is 11: puzzle 3 has closed, and 10 was missed.
  await expect(missed.first()).toHaveText("#4 · Oct 8");
  await expect(missed.last()).toHaveText("#10 · Oct 14");
});
