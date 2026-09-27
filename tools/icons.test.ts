import assert from "node:assert/strict";
import { ICONS, renderIcon } from "./icons.ts";

const pixel = (
  rgb: Uint8Array,
  size: number,
  x: number,
  y: number,
) => [...rgb.subarray((y * size + x) * 3, (y * size + x) * 3 + 3)];

const RED = [0xff, 0x3b, 0x3b];
const BLACK = [0, 0, 0];
const BACKGROUND = [0x0c, 0x0d, 0x0f];

Deno.test("every icon's grid fits its canvas with whole-pixel cells", () => {
  for (const spec of ICONS) {
    const board = 8 * spec.cell + 7 * spec.gap;
    assert.ok(board <= spec.size, spec.file);
    assert.equal(renderIcon(spec).length, spec.size * spec.size * 3, spec.file);
  }
});

Deno.test("icons draw the red disc on black cells", () => {
  for (const spec of ICONS) {
    const rgb = renderIcon(spec);
    const margin = Math.floor((spec.size - (8 * spec.cell + 7 * spec.gap)) / 2);
    const middleOf = (n: number) => margin + n * (spec.cell + spec.gap) + Math.floor(spec.cell / 2);
    assert.deepEqual(
      pixel(rgb, spec.size, middleOf(3), middleOf(3)),
      RED,
      `${spec.file} cell 3, 3`,
    );
    assert.deepEqual(pixel(rgb, spec.size, margin, margin), BLACK, `${spec.file} corner cell`);
  }
});

Deno.test("the maskable icon keeps its whole grid inside the 40% safe circle", () => {
  const spec = ICONS.find((icon) => icon.file === "maskable-512.png");
  assert.ok(spec);
  const rgb = renderIcon(spec);
  const middle = spec.size / 2;
  for (let y = 0; y < spec.size; y++) {
    for (let x = 0; x < spec.size; x++) {
      if (Math.hypot(x + 0.5 - middle, y + 0.5 - middle) <= spec.size * 0.4) continue;
      assert.deepEqual(pixel(rgb, spec.size, x, y), BACKGROUND, `pixel ${x}, ${y}`);
    }
  }
});
