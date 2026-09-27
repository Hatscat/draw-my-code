import process from "node:process";
import { defineConfig } from "vite";
import { siteUrl } from "./tools/site-url.ts";

export default defineConfig(({ command, isPreview }) => {
  const site = siteUrl(process.env.VITE_SITE_URL);
  if (process.env.CI && site.protocol !== "https:") {
    throw new Error(`VITE_SITE_URL must be https in CI, got ${site.href}`);
  }
  return {
    // The dev server stays at "/": under a sub-path, forwarded errors lose their code frames.
    base: command === "serve" && !isPreview ? "/" : site.pathname,
    // Unknown paths get a 404, like GitHub Pages, instead of index.html.
    appType: "mpa",
    define: { "import.meta.env.VITE_SITE_URL": JSON.stringify(site.href) },
    server: {
      // `true` would forward only warnings and errors.
      forwardConsole: { unhandledErrors: true, logLevels: ["error", "warn", "info", "log"] },
    },
  };
});
