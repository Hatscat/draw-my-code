import { ATTEMPTS } from "./config.ts";
import { type Grid, sameGrid, SIZE } from "./grid.ts";

/** Index k: the cell was correct from attempt k + 1 on. One per attempt, see the share test. */
export const CORRECT_FROM = ["🟩", "🟨", "🟧"] as const;
export const STILL_WRONG = "⬛";

/**
 * Per cell, the attempt (from 1) from which it stayed correct until the last submission, or 0
 * when it is still wrong at the end.
 */
export function correctSince(submissions: readonly Grid[], solution: Grid): number[] {
  return solution.map((expected, i) => {
    let since = 0;
    submissions.forEach((grid, k) => {
      if (grid[i] !== expected) since = 0;
      else if (since === 0) since = k + 1;
    });
    return since;
  });
}

/**
 * The text a player shares for a finished daily. It shows when each cell became right, never the
 * solution's colors (though a blank first submit can reveal its shape).
 */
export function shareText(
  puzzle: number,
  submissions: readonly Grid[],
  solution: Grid,
  siteUrl: string,
): string {
  const last = submissions.at(-1);
  const score = last && sameGrid(last, solution) ? String(submissions.length) : "X";
  const cells = correctSince(submissions, solution).map((since) =>
    since === 0 ? STILL_WRONG : CORRECT_FROM[since - 1] ?? STILL_WRONG
  );
  const rows = Array.from(
    { length: SIZE },
    (_, y) => cells.slice(y * SIZE, (y + 1) * SIZE).join(""),
  );
  return [`Draw my code #${puzzle} ${score}/${ATTEMPTS}`, ...rows, siteUrl].join("\n");
}
