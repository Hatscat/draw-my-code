import { expect, test } from "@playwright/test";

test("the app loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("./");

  await expect(page.getByRole("heading", { name: "Draw my code" })).toBeVisible();
  expect(errors).toEqual([]);
});
