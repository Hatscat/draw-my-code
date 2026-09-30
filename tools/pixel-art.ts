/**
 * Pixel art for the images in public/ (tools/icons.ts, tools/social-card.ts): a canvas of RGB
 * pixels and the red disc of the last tutorial level, drawn like the game's grid.
 */

import { PALETTE } from "../src/ui/palette.ts";

/** The red disc of the last tutorial level, as the game's grid shows it. */
const PIXELS = [
  "00000000",
  "00222200",
  "02222220",
  "02222220",
  "02222220",
  "02222220",
  "00222200",
  "00000000",
];
export const BACKGROUND = "#0c0d0f";
const GRID_LINES = "#545a66";

/** Pixels, row by row, 3 bytes each. */
export interface Canvas {
  readonly width: number;
  readonly height: number;
  readonly rgb: Uint8Array;
}

function rgbOf(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

export function createCanvas(width: number, height: number, hex: string): Canvas {
  const canvas = { width, height, rgb: new Uint8Array(width * height * 3) };
  fillRect(canvas, 0, 0, width, height, hex);
  return canvas;
}

/** Fills a rectangle, clipped to the canvas. */
export function fillRect(
  canvas: Canvas,
  left: number,
  top: number,
  width: number,
  height: number,
  hex: string,
): void {
  const color = rgbOf(hex);
  for (let y = Math.max(0, top); y < Math.min(canvas.height, top + height); y++) {
    for (let x = Math.max(0, left); x < Math.min(canvas.width, left + width); x++) {
      canvas.rgb.set(color, (y * canvas.width + x) * 3);
    }
  }
}

/** The red disc with its grid lines, its top-left corner at (left, top). */
export function paintGrid(canvas: Canvas, left: number, top: number, cell: number, gap: number) {
  const board = 8 * cell + 7 * gap;
  fillRect(canvas, left, top, board, board, GRID_LINES);
  PIXELS.forEach((row, y) =>
    [...row].forEach((digit, x) => {
      const hex = PALETTE[Number(digit)]?.hex ?? BACKGROUND;
      fillRect(canvas, left + x * (cell + gap), top + y * (cell + gap), cell, cell, hex);
    })
  );
}
