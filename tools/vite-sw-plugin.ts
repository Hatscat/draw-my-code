/**
 * A small Vite plugin: compiles src/sw.ts to sw.js at the site root, with the list of files to
 * precache and a hash of the whole build injected. No Workbox, no PWA plugin.
 */

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { minify, type Plugin, type ResolvedConfig, transformWithOxc } from "vite";

async function listFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { recursive: true, withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => relative(dir, join(e.parentPath, e.name)));
  } catch {
    return [];
  }
}

export function serviceWorker(entry: string): Plugin {
  let config: ResolvedConfig;
  return {
    name: "draw-my-code:service-worker",
    apply: "build",
    // index.html only joins the bundle through Vite's own post plugins.
    enforce: "post",
    configResolved(resolved) {
      config = resolved;
    },
    async generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((file) => !file.endsWith(".map")).sort();
      // og.png is only for link-preview crawlers, which never go through the service worker: not in
      // the precache, nor in the hash (a new preview image alone doesn't make players re-download).
      const copied = config.publicDir
        ? (await listFiles(config.publicDir)).filter((file) => file !== "og.png").sort()
        : [];

      // The hash changes whenever any file does, so each deploy gets a fresh cache.
      const hash = createHash("sha256");
      for (const file of built) {
        const output = bundle[file];
        if (!output) continue;
        hash.update(file).update(output.type === "chunk" ? output.code : output.source);
      }
      for (const file of copied) {
        hash.update(file).update(await readFile(join(config.publicDir, file)));
      }

      // Relative to sw.js, which sits at the base path: nothing depends on the base path itself.
      const url = (file: string) => (file === "index.html" ? "./" : `./${file}`);
      const precache = [...built, ...copied].map(url);
      const path = join(config.root, entry);
      const { code } = await transformWithOxc(await readFile(path, "utf8"), path, { lang: "ts" });
      const script = code
        .replace("__PRECACHE__", JSON.stringify(precache))
        .replace("__BUILD_HASH__", JSON.stringify(hash.digest("hex").slice(0, 12)));
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: (await minify("sw.js", script)).code,
      });
    },
  };
}
