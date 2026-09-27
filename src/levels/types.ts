export interface Level {
  /** Puzzle number for a daily, position (from 1) for a tutorial level. */
  readonly id: number;
  /** The level file exactly as players see it, without its final newline. */
  readonly code: string;
  /** 8 rows of 8 digits, y down: row y, column x holds f(x, y). Produced by gcc. */
  readonly solution: readonly string[];
}
