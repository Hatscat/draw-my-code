import assert from "node:assert/strict";
import { analyticsEnabled, completionEvent, isTracking, track } from "./analytics.ts";

const PRODUCTION = {
  production: true,
  websiteId: "0b1c2d3e",
  siteUrl: "https://hatscat.github.io/draw-my-code/",
  hostname: "hatscat.github.io",
};

Deno.test("analytics run only in a production build, on the site's host, with a website id", () => {
  assert.equal(analyticsEnabled(PRODUCTION), true);
  assert.equal(analyticsEnabled({ ...PRODUCTION, production: false }), false);
  assert.equal(analyticsEnabled({ ...PRODUCTION, websiteId: undefined }), false);
  assert.equal(analyticsEnabled({ ...PRODUCTION, websiteId: "" }), false);
  assert.equal(analyticsEnabled({ ...PRODUCTION, hostname: "127.0.0.1" }), false);
  assert.equal(analyticsEnabled({ ...PRODUCTION, hostname: "someone.github.io" }), false);
});

Deno.test("analytics follow a custom domain given as the site URL", () => {
  const custom = {
    ...PRODUCTION,
    siteUrl: "https://drawmycode.example/",
    hostname: "drawmycode.example",
  };
  assert.equal(analyticsEnabled(custom), true);
});

Deno.test("track does nothing, without failing, when analytics never started", () => {
  assert.equal(isTracking(), false);
  track("share");
  assert.equal(isTracking(), false);
});

Deno.test("completionEvent names the result in the event", () => {
  assert.equal(completionEvent(1), "puzzle_complete_1");
  assert.equal(completionEvent(2), "puzzle_complete_2");
  assert.equal(completionEvent(3), "puzzle_complete_3");
  assert.equal(completionEvent("X"), "puzzle_complete_x");
});
