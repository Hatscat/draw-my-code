import process from "node:process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { reminderIcs } from "./src/core/reminder.ts";
import { levelEditor } from "./tools/level-editor.ts";
import { siteUrl } from "./tools/site-url.ts";
import { serviceWorker } from "./tools/vite-sw-plugin.ts";

const root = fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, "");

export default defineConfig(({ command, isPreview, mode }) => {
  // The itch.io build (src/itch.ts): relative paths, no service worker, no calendar file.
  const itch = mode === "itch";
  const site = siteUrl(process.env.VITE_SITE_URL);
  if (process.env.CI && site.protocol !== "https:") {
    throw new Error(`VITE_SITE_URL must be https in CI, got ${site.href}`);
  }
  if (itch && site.protocol !== "https:") {
    // Its share texts and the reminder's file point to the website.
    throw new Error(`VITE_SITE_URL must be the website in an itch build, got ${site.href}`);
  }
  return {
    // The dev server stays at "/": under a sub-path, forwarded errors lose their code frames.
    // itch.io serves the game from a folder of its choosing.
    base: itch ? "./" : command === "serve" && !isPreview ? "/" : site.pathname,
    build: { outDir: itch ? "dist-itch" : "dist" },
    // Unknown paths get a 404, like GitHub Pages, instead of index.html.
    appType: "mpa",
    define: { "import.meta.env.VITE_SITE_URL": JSON.stringify(site.href) },
    // The level editor (src/editor/) only exists on the dev server.
    plugins: [
      !itch && serviceWorker("src/sw.ts"),
      levelEditor(root),
      {
        name: "draw-my-code:site-url",
        transformIndexHtml: (html) => html.replaceAll("%SITE_URL%", site.href),
      },
      !itch && {
        // The daily reminder's calendar file: the same event as its Google link, from one source.
        name: "draw-my-code:reminder",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "reminder.ics",
            source: reminderIcs(site.href),
          });
        },
      },
    ],
    server: {
      // `true` would forward only warnings and errors.
      forwardConsole: { unhandledErrors: true, logLevels: ["error", "warn", "info", "log"] },
    },
  };
});
