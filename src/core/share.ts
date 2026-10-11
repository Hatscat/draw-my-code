import { ATTEMPTS } from "./config.ts";
import { type Grid, sameGrid } from "./grid.ts";

/** The palette's eight colors, 0 to 7, the same every day: it recalls the game, spoiling nothing. */
const PALETTE_LINE = "⬛⬜🟥🟧🟨🟩🟦🟪";

/** The text a player shares for a finished daily: the score, the palette and the site URL. */
export function shareText(
  puzzle: number,
  submissions: readonly Grid[],
  solution: Grid,
  siteUrl: string,
): string {
  const last = submissions.at(-1);
  const score = last && sameGrid(last, solution) ? String(submissions.length) : "X";
  return [`Draw my code #${puzzle} ${score}/${ATTEMPTS}`, PALETTE_LINE, siteUrl].join("\n");
}
