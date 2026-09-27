// Playwright runs this file on Node, where process is a real global (declared in env.d.ts).
// deno-lint-ignore-file no-process-global
import { defineConfig, devices } from "@playwright/test";
import { siteUrl } from "../tools/site-url.ts";

// Same site URL as the build under test, served locally by `vite preview` under its path.
const baseURL = new URL(siteUrl(process.env.VITE_SITE_URL).pathname, "http://127.0.0.1:4173").href;

// The VS Code snap leaks GIO_MODULE_DIR, which makes WebKit's network process load the snap's
// libraries and fail every navigation.
const webkitEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] =>
    entry[0] !== "GIO_MODULE_DIR" && entry[1] !== undefined
  ),
);

export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    timezoneId: "Europe/Paris",
    locale: "en-US",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "deno task preview",
    cwd: "..",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // The full Chromium build: the default headless shell rounds glyph widths to whole pixels,
    // so text metrics wouldn't match real devices.
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"], channel: "chromium" } },
    { name: "pixel-7", use: { ...devices["Pixel 7"], channel: "chromium" } },
    { name: "iphone-14", use: { ...devices["iPhone 14"], launchOptions: { env: webkitEnv } } },
  ],
});
