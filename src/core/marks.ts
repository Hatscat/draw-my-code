import { CELLS } from "./grid.ts";

/**
 * The player's dots, one flag per cell, row by row like a grid. Black is both where every cell
 * starts and a real answer: a dot tells a 0 the player worked out from a cell nobody looked at
 * yet. Notes only, never part of the drawing, never judged.
 */
export type Marks = readonly boolean[];

export function noMarks(): Marks {
  return Array<boolean>(CELLS).fill(false);
}

/** Returns the same marks when nothing changes, including for an index outside the grid. */
export function setMark(marks: Marks, index: number, on: boolean): Marks {
  if (marks[index] === undefined || marks[index] === on) return marks;
  return marks.map((mark, i) => (i === index ? on : mark));
}

/** Marks as 64 zeros and ones, the form kept in storage. */
export function marksToString(marks: Marks): string {
  return marks.map((mark) => (mark ? "1" : "0")).join("");
}

/** Reads 64 zeros and ones; anything else gives undefined. */
export function marksFromString(text: string): Marks | undefined {
  if (!/^[01]{64}$/.test(text)) return undefined;
  return [...text].map((digit) => digit === "1");
}
