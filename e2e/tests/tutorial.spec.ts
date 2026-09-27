import { tutorial } from "../../src/levels/generated.ts";
import { cell, dayOf, expect, paintRows, test } from "./fixtures.ts";

test.use({ tutorialDone: false });

const label = (page: import("@playwright/test").Page) => page.locator(".header-label");

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
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  const submit = page.getByRole("button", { name: "Submit" });
  await submit.click();
  const status = page.locator(".status");
  await expect(status).toContainText("1 wrong");
  await expect(status).not.toContainText("attempt");
  await expect(submit).toHaveAttribute("aria-disabled", "true");

  // Level 1: one white cell at (3, 4), the selected color on load.
  await cell(page, 3, 4).click();
  await submit.click();
  await expect(status).toHaveText("Right!");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(label(page)).toHaveText(`Tutorial 2/${tutorial.length}`);
});

test("a reload resumes at the current tutorial level", async ({ page }) => {
  await page.clock.install({ time: dayOf(1) });
  await page.goto("./");
  await cell(page, 3, 4).click();
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
