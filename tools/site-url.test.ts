import assert from "node:assert/strict";
import { LOCAL_SITE_URL, siteUrl } from "./site-url.ts";

Deno.test("siteUrl falls back to the local sub-path when CI passes nothing", () => {
  assert.equal(siteUrl(undefined).href, LOCAL_SITE_URL);
  assert.equal(siteUrl("").href, LOCAL_SITE_URL);
});

Deno.test("siteUrl adds the trailing slash that configure-pages leaves out", () => {
  assert.equal(
    siteUrl("https://hatscat.github.io/draw-my-code").href,
    "https://hatscat.github.io/draw-my-code/",
  );
  assert.equal(
    siteUrl("https://hatscat.github.io/draw-my-code/").href,
    "https://hatscat.github.io/draw-my-code/",
  );
});

Deno.test("siteUrl keeps a custom domain at the root", () => {
  const url = siteUrl("https://drawmycode.example");
  assert.equal(url.href, "https://drawmycode.example/");
  assert.equal(url.pathname, "/");
});

Deno.test("siteUrl rejects a relative URL", () => {
  assert.throws(() => siteUrl("/draw-my-code/"), TypeError);
});
