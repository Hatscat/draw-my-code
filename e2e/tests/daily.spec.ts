import {
  cell,
  confettiBursts,
  countConfetti,
  expect,
  INSTAGRAM_USER_AGENT,
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
  // Disabled shows in the fill, not by fading the whole button: that would fade its focus ring too.
  expect(await submit.evaluate((button) => getComputedStyle(button).opacity)).toBe("1");

  // Pressing it again does nothing: still attempt 2.
  await page.keyboard.press("Enter");
  await expect(status).toContainText("attempt 2/3");

  // Painting keeps the count line and makes Submit usable again.
  await cell(page, 0, 0).click();
  await expect(status).toContainText(`${COLORED} wrong · attempt 2/3`);
  await expect(status).not.toContainText("Change a cell");
  await expect(submit).toHaveAttribute("aria-disabled", "false");
});

test("Submit answers the mouse: hovering lights and grows it, pressing pushes it in", async ({ page, isMobile }) => {
  test.skip(isMobile, "hover needs a mouse");
  // No transitions: each state's style applies at once.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPuzzle(page, 1);
  const submit = page.getByRole("button", { name: "Submit" });
  const color = () => submit.evaluate((button) => getComputedStyle(button).backgroundColor);
  const width = () => submit.evaluate((button) => button.getBoundingClientRect().width);
  // Its box in the layout, which transforms leave alone.
  const place = () =>
    submit.evaluate((button: HTMLElement) => [
      button.offsetLeft,
      button.offsetTop,
      button.offsetWidth,
      button.offsetHeight,
    ]);
  await page.mouse.move(0, 0);
  const rest = await color();
  const restWidth = await width();
  const restPlace = await place();
  await submit.hover();
  const hovered = await color();
  expect(hovered).not.toBe(rest);
  // It also grows, without moving anything around it.
  expect(await width()).toBeGreaterThan(restWidth);
  expect(await place()).toEqual(restPlace);
  await page.mouse.down();
  // Pressed wins over hovered: back to its size, and it sinks a pixel.
  expect(await color()).not.toBe(hovered);
  expect(await width()).toBe(restWidth);
  expect(await submit.evaluate((button) => getComputedStyle(button).transform)).not.toBe("none");
  await page.mouse.up();

  // An unselected swatch lifts under the mouse: a ring would vanish on the white and yellow ones.
  const yellow = page.getByRole("radio", { name: "4 yellow" });
  await yellow.hover();
  expect(await yellow.evaluate((swatch) => getComputedStyle(swatch).transform)).not.toBe("none");
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
    // Above the confetti (z-index 10), which may still be falling.
    const layer = await page.locator(".toast").evaluate((toast) => getComputedStyle(toast).zIndex);
    expect(Number(layer)).toBeGreaterThan(10);
  }
  // The confetti, drawn over the page all along, never got in the way, and is gone after a while.
  await expect(page.locator(".confetti")).toHaveCount(0);
});

test("the result offers a daily reminder in the player's own calendar", async ({ page, request }) => {
  // Puzzle #30, on Nov 3, 2026: Google's event starts that day, the file's on launch day.
  await openPuzzle(page, 30);
  await paintRows(page, solutionOf(30));
  await page.getByRole("button", { name: "Submit" }).click();
  const google = page.getByRole("link", { name: "Google Calendar" });
  const file = page.getByRole("link", { name: "Apple, Outlook, others (.ics)" });
  await expect(google).toBeHidden();
  await page.getByText("Add a daily reminder to your calendar").click();
  await expect(
    page.getByText("A reminder every day at 9:00. You can change its time in your calendar."),
  ).toBeVisible();

  // Google Calendar can't import a file on Android: its own new event form, filled in.
  await expect(google).toHaveAttribute("target", "_blank");
  const form = new URL((await google.getAttribute("href")) ?? "");
  expect(form.origin + form.pathname).toBe("https://calendar.google.com/calendar/render");
  expect(Object.fromEntries(form.searchParams)).toEqual({
    action: "TEMPLATE",
    text: "Draw my code",
    // No time zone: 9:00 wherever the player is, before and after a DST change. From today:
    // Google ends a series after 730 days.
    dates: "20261103T090000/20261103T091500",
    recur: "RRULE:FREQ=DAILY",
    // Shown as free, like the file's event: Google's form defaults to busy.
    crm: "AVAILABLE",
    details: "Today's puzzle is ready.",
  });

  // The same event as a file for every other calendar: the website's, which serves it as a
  // calendar, so an iPhone offers to add it. Checked here in this build, served locally.
  await expect(file).toHaveAttribute("target", "_blank");
  await expect(file).toHaveAttribute("href", new URL("reminder.ics", SITE_URL).href);
  const response = await request.get(new URL("reminder.ics", page.url()).href);
  expect(response.headers()["content-type"]).toMatch(/^text\/calendar/);
  const ics = await response.text();
  for (const line of ["DTSTART:20261005T090000", "RRULE:FREQ=DAILY", "TRANSP:TRANSPARENT"]) {
    expect(ics).toContain(`\r\n${line}\r\n`);
  }
  // No link to the game: from an iPhone's installed app it would open Safari, whose save is
  // separate.
  expect(ics).not.toContain("http");

  // Opened, it still fits a 320 px screen.
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test.describe("in an iOS app's own browser, such as Instagram's", () => {
  test.use({ userAgent: INSTAGRAM_USER_AGENT });

  test("the reminder says where to open its calendar file: only Safari can add it", async ({ page }) => {
    await openPuzzle(page, 1);
    await paintRows(page, SOLUTION);
    await page.getByRole("button", { name: "Submit" }).click();
    await page.getByText("Add a daily reminder to your calendar").click();
    await expect(page.getByRole("link", { name: "Apple, Outlook, others (.ics)" })).toHaveCount(0);
    const file = new URL("reminder.ics", SITE_URL);
    await expect(
      page.getByText(`For Apple Calendar, open ${file.host}${file.pathname} in Safari.`),
    ).toBeVisible();
    // Google's form works wherever the player is signed in.
    await expect(page.getByRole("link", { name: "Google Calendar" })).toBeVisible();
  });
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

test("3 wrong attempts fail: X/3, the solution, and a toggle to your drawing", async ({ page }) => {
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
  await expect(page.getByRole("grid", { name: /^Your drawing/ })).toBeVisible();
  await expect(page.getByRole("gridcell", { name: /: 1 white$/ })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Your drawing" })).toBeFocused();
  // Nothing clips the focused side's ring: keyboard players see which side has the focus.
  expect(await page.locator(".toggle").evaluate((group) => getComputedStyle(group).overflow))
    .toBe("visible");

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

test("dots are notes: a wrong submit keeps them, and they never re-enable Submit", async ({ page }) => {
  await openPuzzle(page, 1);
  const submit = page.getByRole("button", { name: "Submit" });
  const status = page.locator(".status");
  await page.getByRole("radio", { name: "0 black" }).click();
  await cell(page, 1, 1).click();
  await submit.click();
  await expect(status).toContainText("Change a cell to submit again");
  await expect(cell(page, 1, 1)).toHaveAccessibleName("x 1, y 1: 0 black, marked");
  await cell(page, 0, 0).click();
  await expect(cell(page, 0, 0)).toHaveAccessibleName("x 0, y 0: 0 black, marked");
  await expect(status).toContainText("Change a cell to submit again");
  await expect(submit).toHaveAttribute("aria-disabled", "true");
  await cell(page, 0, 0).click();
  await expect(cell(page, 0, 0)).toHaveAccessibleName("x 0, y 0: 0 black");
  await expect(submit).toHaveAttribute("aria-disabled", "true");
});

test("once the puzzle is over, the grid shows no dots", async ({ page }) => {
  await openPuzzle(page, 1);
  const dots = page.getByRole("gridcell", { name: /, marked$/ });
  // A dot where the solution is black: painting the solution leaves it there.
  const y = SOLUTION.findIndex((row) => row.includes("0"));
  const x = SOLUTION[y]?.indexOf("0") ?? 0;
  await page.getByRole("radio", { name: "0 black" }).click();
  await cell(page, x, y).click();
  await expect(dots).toHaveCount(1);
  await paintRows(page, SOLUTION);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  await expect(dots).toHaveCount(0);
});

test("a failed puzzle shows no dots, in either view", async ({ page }) => {
  await openPuzzle(page, 1);
  const dots = page.getByRole("gridcell", { name: /, marked$/ });
  const submit = page.getByRole("button", { name: "Submit" });
  await page.getByRole("radio", { name: "0 black" }).click();
  await cell(page, 0, 0).click();
  await expect(dots).toHaveCount(1);
  await submit.click();
  await page.getByRole("radio", { name: "1 white" }).click();
  for (const x of [1, 2]) {
    await cell(page, x, 0).click();
    await submit.click();
  }
  await expect(page.getByRole("heading", { name: "X/3" })).toBeVisible();
  await expect(dots).toHaveCount(0);
  await page.getByRole("button", { name: "Your drawing" }).click();
  await expect(page.getByRole("button", { name: "Your drawing" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dots).toHaveCount(0);
});
