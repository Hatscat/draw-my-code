import { expect, test } from "@playwright/test";
import { SITE_URL } from "./fixtures.ts";

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
  // The page under the site's path; the endpoints at the server's root, where the dev server has them.
  for (const path of ["src/editor/", "src/editor/index.html", "/__editor/levels"]) {
    const response = await request.get(new URL(path, baseURL).href);
    expect(response.status(), path).toBe(404);
  }
});

test("link previews get a description and an image the site serves", async ({ page, request, baseURL }) => {
  await page.goto("./");
  const meta = (key: string) => page.locator(`meta[name="${key}"], meta[property="${key}"]`);
  await expect(meta("description")).toHaveAttribute("content", /tiny C function/);
  // Absolute URLs, as scrapers need: the site's own, like share texts.
  await expect(meta("og:url")).toHaveAttribute("content", SITE_URL);
  await expect(meta("og:image")).toHaveAttribute("content", `${SITE_URL}og.png`);
  await expect(meta("twitter:card")).toHaveAttribute("content", "summary_large_image");

  const image = await request.get(new URL("og.png", baseURL).href);
  expect(image.ok()).toBe(true);
  expect(image.headers()["content-type"]).toBe("image/png");
  const png = await image.body();
  // The PNG header's width and height.
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
