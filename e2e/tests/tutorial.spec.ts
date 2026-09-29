import { tutorial } from "../../src/levels/generated.ts";
import {
  cell,
  confettiBursts,
  countConfetti,
  dayOf,
  expect,
  installPrompted,
  offerInstall,
  paintRows,
  test,
} from "./fixtures.ts";

test.use({ tutorialDone: false });

type Page = import("@playwright/test").Page;

const label = (page: Page) => page.locator(".header-label");

// Level 1 has a single colored cell: its color, then one tap, solve it.
const LEVEL_1 = tutorial[0]?.solution.join("") ?? "";
const ONE = [...LEVEL_1].findIndex((digit) => digit !== "0");
const ONE_COLOR = LEVEL_1[ONE] ?? "1";
const oneCell = (page: Page) => cell(page, ONE % 8, Math.floor(ONE / 8));

async function solveLevel1(page: Page) {
  await page.keyboard.press(ONE_COLOR);
  await oneCell(page).click();
}

test("a first visit starts the tutorial, and Skip leads to the daily", async ({ page }) => {
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  await expect(label(page)).toHaveText(`Tutorial 1/${tutorial.length}`);
  await expect(page.getByText("tutorial_1.c")).toBeVisible();
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await expect(label(page)).toHaveText("#1");
  await page.reload();
  await expect(label(page)).toHaveText("#1");
});

test("a wrong submit shows only the count; a solve moves on with Next", async ({ page }) => {
  await countConfetti(page);
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  const submit = page.getByRole("button", { name: "Submit" });
  await submit.click();
  const status = page.locator(".status");
  await expect(status).toContainText("1 wrong");
  await expect(status).not.toContainText("attempt");
  await expect(submit).toHaveAttribute("aria-disabled", "true");
  expect(await confettiBursts(page)).toBe(0);

  await solveLevel1(page);
  await submit.click();
  await expect(status).toHaveText("Right!");
  expect(await confettiBursts(page)).toBe(1);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(label(page)).toHaveText(`Tutorial 2/${tutorial.length}`);
});

test("a reload resumes at the current tutorial level", async ({ page }) => {
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  await solveLevel1(page);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.reload();
  await expect(label(page)).toHaveText(`Tutorial 2/${tutorial.length}`);
});

test("finishing every level leads to the daily", async ({ page }) => {
  // Hundreds of cells painted one click at a time: slow on WebKit.
  test.slow();
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  for (const level of tutorial) {
    await expect(label(page)).toHaveText(
      `Tutorial ${level.id}/${tutorial.length}`,
    );
    await paintRows(page, level.solution);
    await page.getByRole("button", { name: "Submit" }).click();
    const next = level.id < tutorial.length ? "Next" : "Done";
    await page.getByRole("button", { name: next, exact: true }).click();
  }
  await expect(label(page)).toHaveText("#1");
});

test("Replay tutorial from the info panel leaves the daily as it was", async ({ page }) => {
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await page.keyboard.press("5");
  await cell(page, 6, 6).click();

  await page.getByRole("button", { name: "How to play and settings" }).click();
  await page.getByRole("button", { name: "Replay tutorial" }).click();
  await expect(label(page)).toHaveText(`Tutorial 1/${tutorial.length}`);
  await expect(page.getByRole("button", { name: "Replay tutorial" }))
    .toHaveCount(0);
  await page.getByRole("button", { name: "Skip tutorial" }).click();

  await expect(label(page)).toHaveText("#1");
  await expect(cell(page, 6, 6)).toHaveAccessibleName("x 6, y 6: 5 green");
});

test("before launch: the tutorial, then the first puzzle's date", async ({ page }) => {
  await page.clock.install({ time: dayOf(-3) });
  await page.goto("./");
  await expect(label(page)).toHaveText(`Tutorial 1/${tutorial.length}`);
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await expect(page.getByRole("heading", { name: /^First puzzle on / }))
    .toBeVisible();
});

test("keyboard focus follows onto the next level and into the daily", async ({ page }) => {
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  await page.keyboard.press(ONE_COLOR);
  await oneCell(page).focus();
  await page.keyboard.press(" ");
  const submit = page.getByRole("button", { name: "Submit" });
  await submit.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(label(page)).toHaveText(`Tutorial 2/${tutorial.length}`);
  await expect(page.getByRole("button", { name: "Submit" })).toBeFocused();

  await page.getByRole("button", { name: "Skip tutorial" }).focus();
  await page.keyboard.press("Enter");
  await expect(label(page)).toHaveText("#1");
  await expect(page.getByRole("button", { name: "Submit" })).toBeFocused();
});

test("midnight doesn't interrupt the tutorial; its end leads to today's puzzle", async ({ page }) => {
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  await cell(page, 0, 0).click();
  const untilMidnight = await page.evaluate(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  });
  await page.clock.fastForward(untilMidnight + 5_000);
  await page.clock.runFor(5_000);
  await expect(label(page)).toHaveText(`Tutorial 1/${tutorial.length}`);
  await expect(cell(page, 0, 0)).toHaveAccessibleName("x 0, y 0: 1 white");
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await expect(label(page)).toHaveText("#2");
});

/** Opens the tutorial at its last level, as a player who solved all the others. */
async function openLastLevel(page: Page) {
  await page.addInitScript((next) => {
    if (localStorage.getItem("draw-my-code") !== null) return;
    localStorage.setItem("draw-my-code", JSON.stringify({ v: 1, tutorial: { done: false, next } }));
  }, tutorial.length);
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  await expect(label(page)).toHaveText(`Tutorial ${tutorial.length}/${tutorial.length}`);
}

async function finishLastLevel(page: Page) {
  const last = tutorial.at(-1);
  if (!last) throw new Error("no tutorial levels");
  await paintRows(page, last.solution);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

test("finishing the tutorial offers to install the app", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "only Chromium offers an install prompt");
  await openLastLevel(page);
  await offerInstall(page);
  await finishLastLevel(page);
  const dialog = page.getByRole("dialog", { name: "Install Draw my code" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Install" })).toBeFocused();
  await dialog.getByRole("button", { name: "Install" }).click();
  await expect.poll(() => installPrompted(page)).toBe(true);
  await expect(dialog).toBeHidden();
  await expect(label(page)).toHaveText("#1");
});

test("on an iPhone, the end of the tutorial explains Add to Home Screen", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "the iPhone project runs on WebKit");
  await openLastLevel(page);
  await finishLastLevel(page);
  const dialog = page.getByRole("dialog", { name: "Install Draw my code" });
  await expect(dialog).toContainText("Add to Home Screen");
  await dialog.getByRole("button", { name: "Got it" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Submit" })).toBeFocused();
});

test("skipping the tutorial offers nothing", async ({ page }) => {
  await openLastLevel(page);
  await offerInstall(page);
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await expect(label(page)).toHaveText("#1");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
