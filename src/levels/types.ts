/** What a daily shows: the level file and gcc's grid. */
export interface Puzzle {
  /** The level file exactly as players see it, without its final newline. */
  readonly code: string;
  /** 8 rows of 8 digits, y down: row y, column x holds f(x, y). Produced by gcc. */
  readonly solution: readonly string[];
}

export interface Level extends Puzzle {
  /** Position (from 1) in the daily pool, or in the tutorial. */
  readonly id: number;
}

/** A level shown every year on its calendar date, in place of the pool's. */
export interface SpecialLevel extends Puzzle {
  readonly month: number;
  readonly day: number;
  /** From its file name, such as "halloween". */
  readonly name: string;
}

/**
 * From puzzle `from` on, the pool loops over its first `size` levels, from index `start`. The
 * generator starts a new epoch when the pool changes size after launch, so past days keep their
 * levels.
 */
export interface Epoch {
  readonly from: number;
  readonly size: number;
  readonly start: number;
}
