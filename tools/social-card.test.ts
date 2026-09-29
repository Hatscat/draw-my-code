import assert from "node:assert/strict";
import { createCanvas } from "./pixel-art.ts";
import { drawText, renderSocialCard, SOCIAL_CARD } from "./social-card.ts";

const pixel = (
  rgb: Uint8Array,
  width: number,
  x: number,
  y: number,
) => [...rgb.subarray((y * width + x) * 3, (y * width + x) * 3 + 3)];
const INK = [0xf3, 0xf2, 0xec];
const RED = [0xff, 0x3b, 0x3b];

Deno.test("the social card is 1200×630 with puzzle #1's disc on the right", () => {
  const card = renderSocialCard();
  assert.equal(card.width, SOCIAL_CARD.width);
  assert.equal(card.height, SOCIAL_CARD.height);
  assert.equal(card.rgb.length, 1200 * 630 * 3);
  // Cell (3, 3) of the grid, 442 px wide and 88 px from the right edge.
  const left = 1200 - 88 - 442;
  const top = (630 - 442) / 2;
  assert.deepEqual(pixel(card.rgb, 1200, left + 3 * 56 + 25, top + 3 * 56 + 25), RED);
});

Deno.test("the title stays left of the grid", () => {
  const card = renderSocialCard();
  let inked = 0;
  for (let y = 0; y < 630; y++) {
    for (let x = 0; x < 1200; x++) {
      if (pixel(card.rgb, 1200, x, y).join() !== INK.join()) continue;
      inked++;
      assert.ok(x < 1200 - 88 - 442 - 40, `title ink at ${x}, ${y}`);
    }
  }
  assert.ok(inked > 1000, "the title is drawn");
});

Deno.test("drawText returns the right edge, and refuses a character without a glyph", () => {
  const canvas = createCanvas(100, 20, "#000000");
  // Two glyphs 5 columns wide, 7 columns apart, at scale 2: 7 * 2 + 5 * 2.
  assert.equal(drawText(canvas, [["AC", "#ffffff"]], 0, 0, 2, 7), 24);
  assert.throws(() => drawText(canvas, [["?", "#ffffff"]], 0, 0, 1, 6), /no glyph for "\?"/);
});
