import { ATTEMPTS } from "./config.ts";
import { type Grid, sameGrid, SIZE } from "./grid.ts";

/** By color value: emoji has a square for each of the palette's eight colors. */
const SQUARES = ["⬛", "⬜", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪"] as const;
/** The top half only: a short text, and half the answer still hidden. */
const SHOWN_ROWS = SIZE / 2;

/**
 * The text a player shares for a finished daily: the score, then the top half of the solution as a
 * picture, even for a failed puzzle. Players who don't want to give that half away delete its rows.
 */
export function shareText(
  puzzle: number,
  submissions: readonly Grid[],
  solution: Grid,
  siteUrl: string,
): string {
  const last = submissions.at(-1);
  const score = last && sameGrid(last, solution) ? String(submissions.length) : "X";
  const rows = Array.from(
    { length: SHOWN_ROWS },
    (_, y) => solution.slice(y * SIZE, (y + 1) * SIZE).map((color) => SQUARES[color]).join(""),
  );
  return [`Draw my code #${puzzle} ${score}/${ATTEMPTS}`, ...rows, siteUrl].join("\n");
}
