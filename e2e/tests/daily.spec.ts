import {
  cell,
  confettiBursts,
  countConfetti,
  expect,
  openPuzzle,
  paintRows,
  sharedTexts,
  SITE_URL,
  solutionOf,
  stubShare,
  test,
} from "./fixtures.ts";

const SOLUTION = solutionOf(1);
const COLORED = SOLUTION.join("").replaceAll("0", "").length;

test("a wrong submit only tells the count; Submit waits for a change", async ({ page }) => {
  await openPuzzle(page, 1);
  const grid = page.getByRole("grid");
  const before = await grid.evaluate((element) => element.outerHTML);
  const submit = page.getByRole("button", { name: "Submit" });
  await submit.focus();
  await page.keyboard.press("Enter");

  const status = page.locator(".status");
  await expect(status).toContainText(`${COLORED} wrong · attempt 2/3`);
  await expect(status).toContainText("Change a cell to submit again");
  // No per-cell indication at all: the grid's markup is exactly what it was.
  expect(await grid.evaluate((element) => element.outerHTML)).toBe(before);
  await expect(submit).toHaveAttribute("aria-disabled", "true");
  await expect(submit).toBeFocused();

  // Pressing it again does nothing: still attempt 2.
  await page.keyboard.press("Enter");
  await expect(status).toContainText("attempt 2/3");

  // Painting keeps the count line and makes Submit usable again.
  await cell(page, 0, 0).click();
  await expect(status).toContainText(`${COLORED} wrong · attempt 2/3`);
  await expect(status).not.toContainText("Change a cell");
  await expect(submit).toHaveAttribute("aria-disabled", "false");
});

test("Submit answers the mouse: hovering lights it, pressing pushes it in", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover needs a mouse");
  // No transitions: each state's style applies at once.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPuzzle(page, 1);
  const submit = page.getByRole("button", { name: "Submit" });
  const color = () => submit.evaluate((button) => getComputedStyle(button).backgroundColor);
  await page.mouse.move(0, 0);
  const rest = await color();
  await submit.hover();
  const hovered = await color();
  expect(hovered).not.toBe(rest);
  await page.mouse.down();
  // Pressed wins over hovered, and the button sinks a pixel.
  expect(await color()).not.toBe(hovered);
  expect(await submit.evaluate((button) => getComputedStyle(button).transform)).not.toBe("none");
  await page.mouse.up();
});

test("solving shows the result, the stats and the exact share text", async ({ page, isMobile }) => {
  await stubShare(page);
  await countConfetti(page);
  await openPuzzle(page, 1);
  await page.getByRole("button", { name: "Submit" }).click();
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Solved in 2/3" })).toBeFocused();
  expect(await confettiBursts(page)).toBe(1);
  const stats = page.locator(".stats");
  for (
    const [label, value] of [["Played", "1"], ["Win %", "100"], ["Current streak", "1"], [
      "Max streak",
      "1",
    ]]
  ) {
    await expect(stats.locator(".stat", { hasText: label }).locator("dd")).toHaveText(value ?? "");
  }
  await expect(page.getByRole("listitem", { name: "In 2: 1, today" })).toBeVisible();
  await expect(page.locator(".next")).toContainText(/Next puzzle in \d\d:\d\d:\d\d/);
  // The author's itch.io page, where players can follow for new games, in a new tab.
  const follow = page.getByRole("link", { name: "Follow for new games" });
  await expect(follow).toHaveAttribute("href", "https://lone-bee.itch.io/");
  await expect(follow).toHaveAttribute("target", "_blank");

  // A blank first attempt: black cells were right from attempt 1, colored ones from attempt 2.
  const rows = SOLUTION.map((row) => [...row].map((d) => (d === "0" ? "🟩" : "🟨")).join(""));
  const expected = ["Draw my code #1 2/3", ...rows, SITE_URL].join("\n");
  await page.getByRole("button", { name: "Share" }).click();
  if (isMobile) {
    await expect.poll(async () => (await sharedTexts(page)).shared).toEqual([expected]);
  } else {
    await expect.poll(async () => (await sharedTexts(page)).copied).toEqual([expected]);
    await expect(page.locator(".toast")).toHaveText("Copied");
  }
  // The confetti, drawn over the page all along, never got in the way, and is gone after a while.
  await expect(page.locator(".confetti")).toHaveCount(0);
});

test("no confetti for players who prefer reduced motion", async ({ page }) => {
  await countConfetti(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPuzzle(page, 1);
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  // Bursts start with the result: had there been one, it would have been counted by now.
  expect(await confettiBursts(page)).toBe(0);
});

test("a cancelled share sheet does nothing", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the share sheet is only used on touch devices");
  await stubShare(page, "AbortError");
  await openPuzzle(page, 1);
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  // The sheet was offered and cancelled: no copy, no toast, no copy-by-hand field.
  await expect.poll(async () => (await sharedTexts(page)).attempts).toBe(1);
  expect(await sharedTexts(page)).toEqual({ shared: [], copied: [], attempts: 1 });
  await expect(page.getByRole("textbox", { name: "Your result, to copy" })).toBeHidden();
  await expect(page.locator(".toast")).not.toHaveText("Copied");
});

test("3 wrong attempts fail: X/3, the solution, and a toggle to the last drawing", async ({ page }) => {
  await stubShare(page);
  await countConfetti(page);
  await openPuzzle(page, 1);
  // Two cells that are black in the solution, painted white in attempts 2 and 3.
  const zeros = SOLUTION.flatMap((row, y) =>
    [...row].flatMap((d, x) => (d === "0" ? [[x, y]] : []))
  );
  const [first, second] = zeros;
  if (!first || !second) throw new Error("puzzle #1 needs two black cells");
  const submit = page.getByRole("button", { name: "Submit" });
  await submit.click();
  await cell(page, first[0] ?? 0, first[1] ?? 0).click();
  await submit.click();
  await cell(page, second[0] ?? 0, second[1] ?? 0).click();
  await submit.click();

  await expect(page.getByRole("heading", { name: "X/3" })).toBeVisible();
  expect(await confettiBursts(page)).toBe(0);
  await expect(page.getByRole("button", { name: "Solution" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("grid", { name: /^The solution/ })).toBeVisible();
  const colored = page.getByRole("gridcell", { name: /: [1-7] \w+$/ });
  await expect(colored).toHaveCount(COLORED);

  await page.getByRole("button", { name: "Your drawing" }).click();
  await expect(page.getByRole("grid", { name: /^Your last drawing/ })).toBeVisible();
  await expect(page.getByRole("gridcell", { name: /: 1 white$/ })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Your drawing" })).toBeFocused();

  // Never right: every colored cell, plus the two black cells painted white later on.
  const whitened = (x: number, y: number) => [first, second].some((c) => c[0] === x && c[1] === y);
  const rows = SOLUTION.map((row, y) =>
    [...row].map((d, x) => (d !== "0" || whitened(x, y) ? "⬛" : "🟩")).join("")
  );
  await page.getByRole("button", { name: "Share" }).click();
  const expected = ["Draw my code #1 X/3", ...rows, SITE_URL].join("\n");
  await expect.poll(async () => {
    const { shared, copied } = await sharedTexts(page);
    return [...shared, ...copied];
  }).toEqual([expected]);
});

test("a solved puzzle has no Solution / Your drawing toggle", async ({ page }) => {
  await openPuzzle(page, 1);
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Solution" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Your drawing" })).toBeHidden();
});

test("a finished puzzle can't be painted any more", async ({ page }) => {
  await openPuzzle(page, 1);
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  await expect(page.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
  const before = await cell(page, 0, 0).getAttribute("aria-label");
  await page.keyboard.press(SOLUTION[0]?.[0] === "7" ? "6" : "7");
  await cell(page, 0, 0).click();
  await expect(cell(page, 0, 0)).toHaveAttribute("aria-label", before ?? "");
  await expect(page.getByRole("radio", { name: "1 white" })).toBeHidden();
});

test("when the share sheet fails, the result is copied instead", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the share sheet is only used on touch devices");
  await stubShare(page, "NotAllowedError");
  await openPuzzle(page, 1);
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.locator(".toast")).toHaveText("Copied");
  expect((await sharedTexts(page)).copied).toHaveLength(1);
});

test("when sharing and copying both fail, the result is shown to copy by hand", async ({ page }) => {
  await stubShare(page, "NotAllowedError", { clipboardFails: true });
  await openPuzzle(page, 1);
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Share" }).click();
  const field = page.getByRole("textbox", { name: "Your result, to copy" });
  await expect(field).toBeVisible();
  await expect(field).toHaveValue(new RegExp(`^Draw my code #1 1/3\n[^]*\n${SITE_URL}$`));
  await expect(page.locator(".toast")).not.toHaveText("Copied");
});

test.describe("on a phone-sized screen", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("a finished puzzle's page scrolls from a swipe on the grid, and fits 320 px", async ({ page }) => {
    await openPuzzle(page, 1);
    await paintRows(page, SOLUTION);
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
    expect(await page.getByRole("grid").evaluate((grid) => getComputedStyle(grid).touchAction))
      .not.toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    const share = page.getByRole("button", { name: "Share" });
    await share.scrollIntoViewIfNeeded();
    await expect(share).toBeInViewport();
  });
});
