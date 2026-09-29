/**
 * The link preview image (Open Graph and Twitter cards), written to public/og.png by
 * `deno task icons`: the title in a pixel font, the function signature in the game's syntax
 * colors, and puzzle #1's disc as the icons draw it.
 */

import { BACKGROUND, type Canvas, createCanvas, fillRect, paintGrid } from "./pixel-art.ts";

/** 1200×630: the size every link preview crops well from. */
export const SOCIAL_CARD = { width: 1200, height: 630 } as const;

const INK = "#f3f2ec";
const MUTED = "#a7abb4";
const TEXT = "#d6d9e0";
const TYPE = "#7fd3d0";
const FUNCTION = "#8fb4ff";

/** 5×7 glyphs, only the ones the card uses. */
const GLYPHS: Readonly<Record<string, readonly string[]>> = {
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  f: ["..##.", ".#..#", ".#...", "###..", ".#...", ".#...", ".#..."],
  i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  t: [".#...", ".#...", "####.", ".#...", ".#...", ".#..#", "..##."],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  y: [".....", ".....", "#...#", "#...#", ".####", "....#", ".###."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  ",": [".....", ".....", ".....", ".....", ".##..", "..#..", ".#..."],
};

/** Colored runs of text: [text, color]. */
type Spans = readonly (readonly [string, string])[];

/**
 * Draws text with square pixels of `scale`, glyphs `advance` glyph columns apart; returns the
 * right edge. Throws on a character without a glyph, rather than drawing a gap.
 */
export function drawText(
  canvas: Canvas,
  spans: Spans,
  left: number,
  top: number,
  scale: number,
  advance: number,
): number {
  let x = left;
  for (const [text, hex] of spans) {
    for (const char of text) {
      const glyph = GLYPHS[char];
      if (!glyph) throw new Error(`no glyph for ${JSON.stringify(char)}`);
      glyph.forEach((row, gy) =>
        [...row].forEach((dot, gx) => {
          if (dot === "#") fillRect(canvas, x + gx * scale, top + gy * scale, scale, scale, hex);
        })
      );
      x += advance * scale;
    }
  }
  return x - (advance - 5) * scale;
}

export function renderSocialCard(): Canvas {
  const canvas = createCanvas(SOCIAL_CARD.width, SOCIAL_CARD.height, BACKGROUND);
  // The same grid as the icons, as large as the card's height allows with a margin.
  const cell = 50;
  const gap = 6;
  const board = 8 * cell + 7 * gap;
  paintGrid(canvas, SOCIAL_CARD.width - 88 - board, (SOCIAL_CARD.height - board) / 2, cell, gap);
  // Title letter-spaced like the game's header; code monospaced like its code panel.
  drawText(canvas, [["DRAW MY", INK]], 88, 130, 11, 7);
  drawText(canvas, [["CODE", INK]], 88, 240, 11, 7);
  drawText(
    canvas,
    [["int", TYPE], [" ", TEXT], ["f", FUNCTION], ["(", TEXT], ["int", TYPE], [" x, ", TEXT], [
      "int",
      TYPE,
    ], [" y)", TEXT]],
    88,
    384,
    4,
    6,
  );
  drawText(canvas, [["A DAILY C PUZZLE", MUTED]], 88, 444, 4, 6);
  return canvas;
}
