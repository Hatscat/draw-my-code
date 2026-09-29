import assert from "node:assert/strict";
import { createCanvas, fillRect } from "./pixel-art.ts";

Deno.test("fillRect paints inside the canvas and clips what falls outside", () => {
  const canvas = createCanvas(4, 3, "#000000");
  fillRect(canvas, 2, 1, 5, 5, "#ff0000");
  const red = (x: number, y: number) => canvas.rgb[(y * 4 + x) * 3] === 0xff;
  assert.deepEqual(
    [0, 1, 2].map((y) => [0, 1, 2, 3].map((x) => (red(x, y) ? 1 : 0)).join("")),
    ["0000", "0011", "0011"],
  );
  fillRect(canvas, -3, -3, 2, 2, "#00ff00");
  assert.equal(canvas.rgb.length, 4 * 3 * 3);
});
