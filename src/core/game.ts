import { blankGrid, type Color, type Grid, sameGrid, setCell, wrongCount } from "./grid.ts";
import { type Marks, noMarks, setMark } from "./marks.ts";

/** One puzzle in play: a daily (limited attempts) or a tutorial level (unlimited). */
export interface Play {
  readonly solution: Grid;
  readonly drawing: Grid;
  /** The player's dots, on the cells they painted 0. Never submitted. */
  readonly marks: Marks;
  /** Every submitted grid, oldest first. */
  readonly submissions: readonly Grid[];
  /** Attempts allowed: `ATTEMPTS` for a daily, Infinity in the tutorial. */
  readonly attempts: number;
}

export type Status = "playing" | "solved" | "failed";

export function startPlay(solution: Grid, attempts: number): Play {
  return { solution, drawing: blankGrid(), marks: noMarks(), submissions: [], attempts };
}

export function status(play: Play): Status {
  const last = play.submissions.at(-1);
  if (last && sameGrid(last, play.solution)) return "solved";
  return play.submissions.length >= play.attempts ? "failed" : "playing";
}

/**
 * Paints one cell: 0 leaves a dot on it, another color takes the dot off, so a dot only ever sits
 * on a 0. Once the puzzle is over, the drawing is frozen.
 */
export function paint(play: Play, index: number, color: Color): Play {
  if (status(play) !== "playing") return play;
  const drawing = setCell(play.drawing, index, color);
  const marks = setMark(play.marks, index, color === 0);
  return drawing === play.drawing && marks === play.marks ? play : { ...play, drawing, marks };
}

/** Takes a cell's dot off, the cell staying 0: what a second tap with 0 does. */
export function unmark(play: Play, index: number): Play {
  if (status(play) !== "playing") return play;
  const marks = setMark(play.marks, index, false);
  return marks === play.marks ? play : { ...play, marks };
}

/**
 * Whether Submit does anything: not once the puzzle is over, and not while the drawing equals the
 * one just submitted, so a double tap can't burn an attempt.
 */
export function canSubmit(play: Play): boolean {
  if (status(play) !== "playing") return false;
  const last = play.submissions.at(-1);
  return !last || !sameGrid(last, play.drawing);
}

export function submit(play: Play): Play {
  return canSubmit(play) ? { ...play, submissions: [...play.submissions, play.drawing] } : play;
}

/** Wrong cells in the last submission: the only feedback a wrong submit gives. */
export function lastWrongCount(play: Play): number | undefined {
  const last = play.submissions.at(-1);
  return last ? wrongCount(last, play.solution) : undefined;
}

/** The attempt about to be played, from 1: after one wrong submit, "attempt 2/3". */
export function nextAttempt(play: Play): number {
  return play.submissions.length + 1;
}
