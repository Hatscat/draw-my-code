/**
 * Generates the PWA icons in public/icons/ and the link preview image public/og.png
 * (`deno task icons`): pixel art from an 8×8 grid in the palette, drawn like the game's grid,
 * encoded by tools/png.ts.
 */

import { encodePng } from "./png.ts";
import { BACKGROUND, createCanvas, paintGrid } from "./pixel-art.ts";
import { renderSocialCard, SOCIAL_CARD } from "./social-card.ts";

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

/** The icon's pixels, row by row, 3 bytes each. */
export function renderIcon({ size, cell, gap }: IconSpec): Uint8Array {
  const margin = Math.floor((size - (8 * cell + 7 * gap)) / 2);
  const canvas = createCanvas(size, size, BACKGROUND);
  paintGrid(canvas, margin, margin, cell, gap);
  return canvas.rgb;
}

if (import.meta.main) {
  for (const spec of ICONS) {
    const path = new URL(`../public/icons/${spec.file}`, import.meta.url);
    await Deno.writeFile(path, await encodePng(spec.size, spec.size, renderIcon(spec)));
    console.log(`Wrote public/icons/${spec.file}`);
  }
  const card = renderSocialCard();
  await Deno.writeFile(
    new URL("../public/og.png", import.meta.url),
    await encodePng(SOCIAL_CARD.width, SOCIAL_CARD.height, card.rgb),
  );
  console.log("Wrote public/og.png");
}
