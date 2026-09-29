import { LAUNCH_DATE } from "../../src/core/config.ts";
import { formatIsoDate } from "../../src/core/date.ts";
import { puzzleDate, puzzleNumber } from "../../src/core/schedule.ts";
import { daily, special } from "../../src/levels/generated.ts";
import {
  cell,
  dayOf,
  expect,
  levelOf,
  numberShowing,
  openPuzzle,
  paintRows,
  shownCode,
  solutionOf,
  test,
} from "./fixtures.ts";

const submit = { name: "Submit" } as const;

test("a reload mid-puzzle restores the drawing and the attempts", async ({ page }) => {
  await openPuzzle(page, 1);
  await page.keyboard.press("3");
  await cell(page, 2, 2).click();
  await page.getByRole("button", submit).click();
  await cell(page, 5, 5).click();
  await page.reload();

  await expect(cell(page, 2, 2)).toHaveAccessibleName("x 2, y 2: 3 orange");
  await expect(cell(page, 5, 5)).toHaveAccessibleName("x 5, y 5: 3 orange");
  await expect(page.locator(".status")).toContainText("attempt 2/3");
  // The selected color is back to white on every load.
  await expect(page.getByRole("radio", { name: "1 white" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("a finished puzzle stays finished after a reload", async ({ page }) => {
  await openPuzzle(page, 1);
  await paintRows(page, solutionOf(1));
  await page.getByRole("button", submit).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  await expect(page.getByRole("button", submit)).toBeHidden();
});

test("midnight brings the next puzzle, and the streak grows", async ({ page }) => {
  await openPuzzle(page, 1);
  await paintRows(page, solutionOf(1));
  await page.getByRole("button", submit).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();

  // The page stays open past midnight: a finished puzzle makes way for the new one.
  await page.clock.fastForward("24:00:00");
  await expect(page.locator(".header-label")).toHaveText("#2");
  await paintRows(page, solutionOf(2));
  await page.getByRole("button", submit).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  const streak = page.locator(".stat", { hasText: "Current streak" }).locator("dd");
  await expect(streak).toHaveText("2");
});

test("a puzzle in progress at midnight stays until it's finished", async ({ page }) => {
  await openPuzzle(page, 1);
  // Start with one right cell, so the puzzle is in progress.
  const solution = solutionOf(1);
  const y = solution.findIndex((row) => /[1-7]/.test(row));
  const x = solution[y]?.search(/[1-7]/) ?? 0;
  await page.keyboard.press(solution[y]?.[x] ?? "1");
  await cell(page, x, y).click();

  // Ten seconds before local midnight, then twenty seconds on.
  const untilMidnight = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  });
  await page.clock.fastForward(untilMidnight - 10_000);
  await page.clock.runFor(20_000);
  await expect(page.locator(".header-label")).toHaveText("#1");

  await paintRows(page, solution);
  await page.getByRole("button", submit).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  await page.getByRole("button", { name: "Play #2" }).click();
  await expect(page.locator(".header-label")).toHaveText("#2");
});

test("an untouched puzzle makes way for the new one at midnight", async ({ page }) => {
  await openPuzzle(page, 1);
  const untilMidnight = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  });
  await page.clock.fastForward(untilMidnight - 10_000);
  await page.clock.runFor(20_000);
  await expect(page.locator(".header-label")).toHaveText("#2");
});

test("an app coming back to the foreground the next day shows the new puzzle", async ({ page }) => {
  await openPuzzle(page, 1);
  // Timers don't run while an app sleeps: move the clock without firing them.
  await page.clock.pauseAt(new Date(dayOf(1).getTime() + 60_000));
  await page.clock.setSystemTime(dayOf(2));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.locator(".header-label")).toHaveText("#2");
});

test("Play #2 keeps the keyboard focus while the seconds tick", async ({ page }) => {
  await openPuzzle(page, 1);
  await cell(page, 0, 0).click();
  const untilMidnight = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  });
  await page.clock.fastForward(untilMidnight + 1_000);
  await page.keyboard.press("0");
  await cell(page, 0, 0).click();
  await paintRows(page, solutionOf(1));
  await page.getByRole("button", submit).click();
  const play = page.getByRole("button", { name: "Play #2" });
  await play.focus();
  await page.clock.runFor(3_000);
  await expect(play).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".header-label")).toHaveText("#2");
});

test("until a missed day is caught up, the current streak counts from after it", async ({ page }) => {
  await openPuzzle(page, 1);
  await paintRows(page, solutionOf(1));
  await page.getByRole("button", submit).click();
  await page.clock.fastForward("48:00:00");
  await expect(page.locator(".header-label")).toHaveText("#3");
  await paintRows(page, solutionOf(3));
  await page.getByRole("button", submit).click();
  await expect(page.locator(".stat", { hasText: "Current streak" }).locator("dd")).toHaveText("1");
  await expect(page.locator(".stat", { hasText: "Max streak" }).locator("dd")).toHaveText("1");
  await expect(page.locator(".stat", { hasText: "Played" }).locator("dd")).toHaveText("2");
});

test("after the pool's last level, the loop starts over", async ({ page }) => {
  // The first day after the pool's first pass that isn't a special date.
  let n = daily.length + 1;
  while (levelOf(n) !== daily[(n - 1) % daily.length]) n++;
  await openPuzzle(page, n);
  await expect(page.locator(".header-label")).toHaveText(`#${n}`);
  expect(await shownCode(page)).toBe(levelOf(n).code);
});

test("a special date shows its special level, year after year", async ({ page }) => {
  const [first] = special;
  test.skip(!first, "no special level");
  if (!first) return;
  // A year after its first showing: the same date, whatever the pool shows around it.
  const { y, m, d } = puzzleDate(LAUNCH_DATE, numberShowing(first));
  const nextYear = puzzleNumber(LAUNCH_DATE, { y: y + 1, m, d });
  await openPuzzle(page, nextYear);
  expect(await shownCode(page)).toBe(first.code);
});

test("before launch: the first puzzle's date and a countdown", async ({ page }) => {
  await page.clock.install({ time: dayOf(-30) });
  await page.goto("./");
  const { y, m, d } = LAUNCH_DATE;
  const launch = new Date(y, m - 1, d).toLocaleDateString("en-US", { dateStyle: "long" });
  await expect(page.getByRole("heading", { name: `First puzzle on ${launch}` })).toBeVisible();
  await expect(page.getByText("Starts in 31 days")).toBeVisible();
  await expect(page.locator(".header-label")).toHaveText("");
});

test("two tabs share one set of attempts", async ({ page, context }) => {
  await openPuzzle(page, 1);
  const other = await context.newPage();
  await other.goto("./");
  await page.getByRole("button", submit).click();
  // The other tab follows along and can't submit the same blank grid again.
  await expect(other.locator(".status")).toContainText("attempt 2/3");
  await expect(other.getByRole("button", submit)).toHaveAttribute("aria-disabled", "true");
});

test("production builds ignore the ?date= override", async ({ page }) => {
  await page.clock.install({ time: dayOf(1) });
  // Puzzle #3's date: honoured, it would show #3.
  await page.goto(`./?date=${formatIsoDate(puzzleDate(LAUNCH_DATE, 3))}`);
  await expect(page.locator(".header-label")).toHaveText("#1");
});

test("the day before launch counts down, then the first puzzle opens at midnight", async ({ page }) => {
  await page.clock.install({ time: dayOf(0) });
  await page.goto("./");
  await expect(page.getByText(/^Starts in \d\d:\d\d:\d\d$/)).toBeVisible();
  const untilMidnight = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  });
  await page.clock.fastForward(untilMidnight - 5_000);
  await page.clock.runFor(10_000);
  await expect(page.locator(".header-label")).toHaveText("#1");
});
