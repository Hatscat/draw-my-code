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

test("the level editor stays on the dev server", async ({ request, baseURL }) => {
  for (const path of ["src/editor/", "src/editor/index.html", "__editor/levels"]) {
    const response = await request.get(new URL(path, baseURL).href);
    expect(response.status(), path).toBe(404);
  }
});
