/**
 * Generates the PWA icons in public/icons/ (`deno task icons`): pixel art from an 8×8 grid in the
 * palette, drawn like the game's grid, encoded by tools/png.ts.
 */

import { PALETTE } from "../src/ui/palette.ts";
import { encodePng } from "./png.ts";

/** The disc of puzzle #1, as the game's grid shows it. */
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
const BACKGROUND = "#0c0d0f";
const GRID_LINES = "#545a66";

export interface IconSpec {
  readonly file: string;
  readonly size: number;
  /** Cell and grid-line widths in pixels: whole numbers keep the edges crisp. */
  readonly cell: number;
  readonly gap: number;
}

export const ICONS: readonly IconSpec[] = [
  { file: "favicon-32.png", size: 32, cell: 4, gap: 0 },
  // iOS rounds the corners and ignores maskable icons: keep a margin.
  { file: "apple-touch-icon.png", size: 180, cell: 18, gap: 2 },
  { file: "icon-192.png", size: 192, cell: 22, gap: 2 },
  { file: "icon-512.png", size: 512, cell: 60, gap: 4 },
  // Launchers may crop maskable icons to a circle of radius 40%: the grid fits inside it.
  { file: "maskable-512.png", size: 512, cell: 32, gap: 4 },
];

function rgbOf(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** The icon's pixels, row by row, 3 bytes each. */
export function renderIcon({ size, cell, gap }: IconSpec): Uint8Array {
  const board = 8 * cell + 7 * gap;
  const margin = Math.floor((size - board) / 2);
  const pitch = cell + gap;
  const rgb = new Uint8Array(size * size * 3);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const bx = px - margin;
      const by = py - margin;
      let hex = BACKGROUND;
      if (bx >= 0 && by >= 0 && bx < board && by < board) {
        const inCell = bx % pitch < cell && by % pitch < cell;
        const digit = PIXELS[Math.floor(by / pitch)]?.[Math.floor(bx / pitch)] ?? "0";
        hex = inCell ? PALETTE[Number(digit)]?.hex ?? BACKGROUND : GRID_LINES;
      }
      rgb.set(rgbOf(hex), (py * size + px) * 3);
    }
  }
  return rgb;
}

if (import.meta.main) {
  for (const spec of ICONS) {
    const path = new URL(`../public/icons/${spec.file}`, import.meta.url);
    await Deno.writeFile(path, await encodePng(spec.size, spec.size, renderIcon(spec)));
    console.log(`Wrote public/icons/${spec.file}`);
  }
}
