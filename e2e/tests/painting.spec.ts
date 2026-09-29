import { daily } from "../../src/levels/generated.ts";
import {
  cell,
  cellCenter,
  expect,
  openPuzzle,
  paintRows,
  shownCode,
  solutionOf,
  test,
} from "./fixtures.ts";

test.beforeEach(async ({ page }) => {
  await openPuzzle(page, 1);
});

test("the grid starts black with white selected", async ({ page }) => {
  await expect(page.getByRole("gridcell", { name: /: 0 black$/ })).toHaveCount(
    64,
  );
  await expect(page.getByRole("radio", { name: "1 white" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("the pointer is a crosshair over a grid that paints, an arrow once it can't", async ({ page }) => {
  await expect(cell(page, 0, 0)).toHaveCSS("cursor", "crosshair");
  await paintRows(page, solutionOf(1));
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Solved in 1/3" })).toBeVisible();
  await expect(cell(page, 0, 0)).toHaveCSS("cursor", "default");
});

test("the screen shows the day's puzzle: number, file name and code, byte for byte", async ({ page }) => {
  await expect(page.locator(".header-label")).toHaveText("#1");
  await expect(page.getByText("daily_0001.c")).toBeVisible();
  expect(await shownCode(page)).toBe(daily[0]?.code);
});

test("painted cells take the palette's colors", async ({ page }) => {
  await expect(cell(page, 0, 0)).toHaveCSS("background-color", "rgb(0, 0, 0)");
  await page.keyboard.press("2");
  await cell(page, 1, 1).click();
  await expect(cell(page, 1, 1)).toHaveCSS("background-color", "rgb(255, 59, 59)");
  await page.keyboard.press("6");
  await cell(page, 2, 1).click();
  await expect(cell(page, 2, 1)).toHaveCSS("background-color", "rgb(47, 123, 255)");
});

test("a tap paints one cell with the selected color", async ({ page, isMobile }) => {
  await page.getByRole("radio", { name: "2 red" }).click();
  const { clientX, clientY } = await cellCenter(page, 3, 4);
  if (isMobile) await page.touchscreen.tap(clientX, clientY);
  else await page.mouse.click(clientX, clientY);
  await expect(cell(page, 3, 4)).toHaveAccessibleName("x 3, y 4: 2 red");
  await expect(page.getByRole("gridcell", { name: /: 0 black$/ })).toHaveCount(
    63,
  );
});

test("a mouse drag paints every cell it crosses, even skipped ones", async ({ page }) => {
  await page.keyboard.press("5");
  const from = await cellCenter(page, 0, 2);
  const to = await cellCenter(page, 7, 2);
  await page.mouse.move(from.clientX, from.clientY);
  await page.mouse.down();
  // One move event from x 0 to x 7: the cells in between must be filled in.
  await page.mouse.move(to.clientX, to.clientY);
  await page.mouse.up();
  for (let x = 0; x < 8; x++) {
    await expect(cell(page, x, 2)).toHaveAccessibleName(`x ${x}, y 2: 5 green`);
  }
  await expect(page.getByRole("gridcell", { name: /: 5 green$/ })).toHaveCount(
    8,
  );
});

test.describe("on a screen short enough to scroll", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("a touch drag paints from coordinates and never scrolls the page", async ({ page }) => {
    await page.keyboard.press("6");
    const grid = page.getByRole("grid");
    // The browser's own touch scrolling is off on the grid; the page itself can scroll.
    expect(await grid.evaluate((element) => getComputedStyle(element).touchAction)).toBe("none");
    await page.evaluate(() => scrollTo(0, 20));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    const scrollBefore = await page.evaluate(() => scrollY);

    // Playwright has no touch drag: dispatch touch pointer events as the browser would, all
    // targeted at the grid even as the finger moves (implicit capture).
    const touch = { pointerType: "touch", pointerId: 2, isPrimary: true, button: 0, buttons: 1 };
    await grid.dispatchEvent("pointerdown", { ...touch, ...(await cellCenter(page, 1, 5)) });
    for (const y of [4, 3, 2]) {
      await grid.dispatchEvent("pointermove", { ...touch, ...(await cellCenter(page, 1, y)) });
    }
    await grid.dispatchEvent("pointerup", {
      ...touch,
      buttons: 0,
      ...(await cellCenter(page, 1, 2)),
    });
    for (const y of [5, 4, 3, 2]) {
      await expect(cell(page, 1, y)).toHaveAccessibleName(`x 1, y ${y}: 6 blue`);
    }
    await expect(page.getByRole("gridcell", { name: /: 6 blue$/ })).toHaveCount(4);
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  });

  test("Space paints instead of scrolling the page", async ({ page }) => {
    await page.evaluate(() => scrollTo(0, 20));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    const scrollBefore = await page.evaluate(() => scrollY);
    await cell(page, 4, 4).focus();
    await page.keyboard.press(" ");
    await expect(cell(page, 4, 4)).toHaveAccessibleName("x 4, y 4: 1 white");
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  });
});

test("a drag that leaves the grid and comes back paints no line on the way", async ({ page }) => {
  await page.keyboard.press("3");
  const start = await cellCenter(page, 0, 0);
  const end = await cellCenter(page, 0, 7);
  const grid = await page.getByRole("grid").boundingBox();
  if (!grid) throw new Error("no grid");
  await page.mouse.move(start.clientX, start.clientY);
  await page.mouse.down();
  await page.mouse.move(grid.x - 20, start.clientY);
  await page.mouse.move(grid.x - 20, end.clientY);
  await page.mouse.move(end.clientX, end.clientY);
  await page.mouse.up();
  await expect(page.getByRole("gridcell", { name: /: 3 orange$/ })).toHaveCount(2);
  await expect(cell(page, 0, 7)).toHaveAccessibleName("x 0, y 7: 3 orange");
});

test("keyboard: arrows move, Space and Enter paint, keys 0-7 pick the color", async ({ page }) => {
  await cell(page, 0, 0).focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowDown");
  await expect(cell(page, 3, 4)).toBeFocused();
  await page.keyboard.press("4");
  await expect(page.getByRole("radio", { name: "4 yellow" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.keyboard.press(" ");
  await expect(cell(page, 3, 4)).toHaveAccessibleName("x 3, y 4: 4 yellow");
  // Space paints; it must not also pick color 0.
  await expect(page.getByRole("radio", { name: "4 yellow" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press(" ");
  await expect(cell(page, 2, 4)).toHaveAccessibleName("x 2, y 4: 4 yellow");
  await page.keyboard.press("End");
  await page.keyboard.press("7");
  await page.keyboard.press("Enter");
  await expect(cell(page, 7, 4)).toHaveAccessibleName("x 7, y 4: 7 purple");
  await page.keyboard.press("Control+Home");
  await expect(cell(page, 0, 0)).toBeFocused();
});

test("keys 0-7 with a modifier are left to the browser", async ({ page }) => {
  await page.keyboard.press("Alt+3");
  await expect(page.getByRole("radio", { name: "1 white" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("the swatches are one radio group driven by arrow keys", async ({ page }) => {
  await page.getByRole("radio", { name: "1 white" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "2 red" })).toBeFocused();
  await expect(page.getByRole("radio", { name: "2 red" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("radio", { name: "0 black" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("hovering or focusing a cell shows its call, never its value", async ({ page, isMobile }) => {
  const readout = page.locator(".code-domain");
  await expect(readout).toHaveText("x,y ∈ [0,7]");
  if (!isMobile) {
    const { clientX, clientY } = await cellCenter(page, 5, 6);
    await page.mouse.move(clientX, clientY);
    await expect(readout).toHaveText("f(5, 6)");
  }
  await cell(page, 2, 7).focus();
  await expect(readout).toHaveText("f(2, 7)");
  await expect(page.locator(".axis-x .on")).toHaveText("2");
  await expect(page.locator(".axis-y .on")).toHaveText("7");
  if (!isMobile) {
    // The mouse passing over and leaving hands the readout back to the focused cell.
    const { clientX, clientY } = await cellCenter(page, 5, 6);
    await page.mouse.move(clientX, clientY);
    await expect(readout).toHaveText("f(5, 6)");
    await page.mouse.move(1, 1);
    await expect(readout).toHaveText("f(2, 7)");
  }
});

test("Show digits prints each cell's value", async ({ page }) => {
  await cell(page, 0, 0).click();
  await page.getByRole("button", { name: "How to play and settings" }).click();
  const digits = page.getByRole("switch", { name: "Show digits" });
  await expect(digits).toHaveAttribute("aria-checked", "false");
  await expect(cell(page, 0, 0)).toHaveText("");
  await digits.click();
  await expect(digits).toHaveAttribute("aria-checked", "true");
  await expect(cell(page, 0, 0)).toHaveText("1");
  await expect(cell(page, 1, 0)).toHaveText("0");
});
