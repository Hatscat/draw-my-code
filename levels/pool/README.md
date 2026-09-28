# Level pool

Candidate daily levels from the level design round of 2026-09-28, kept for later. The same round
reworked dailies 1-12 and scheduled 13-84 in `levels/daily/`. The catalogue page
`docs/puzzle-pool.html` shows every candidate with its grid, aha, trap, painting effort and the
curator's notes; open it in a browser.

Each file here is exactly what players would see. To use one, copy it to the next free
`levels/daily/NNNN.c` (or open it in `deno task editor` and paste it into a New daily), then run
`deno task levels`. The generator ignores this folder, so these files are not checked in CI: recheck
any of them with the editor or `deno task levels` before scheduling it.

- `ready/` (37): graded A or B and not scheduled yet. B levels already carry the curator's tweak.
- `ungraded/` (9): extra levels from the two reviews, not graded by the curator. Several use C
  mechanisms no daily uses yet (`sizeof`, designated initializers).
- `needs-rule-change/` (16): need string literals, `char`, floats, libm or an `isqrt` helper, which
  the level rules forbid. The file name starts with the feature. Only strings and `char` were judged
  worth allowing, after launch and as their own change.
- `dropped/` (34): graded C (near-duplicates, painting chores, noise), kept for reference.

Reserved dates: `ready/rle-heart.c` for Valentine's Day (#133, Feb 14, 2027). A pi level would fit
#161 (Mar 14, 2027).

## Ready

| File                                             | Family    | Difficulty | Grade | Aha                                                                                                                                                            |
| ------------------------------------------------ | --------- | ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [archery.c](ready/archery.c)                     | rules     | 2          | B     | Concentric rings by distance from the center; the square root is a one-line loop, so it needs no helper.                                                       |
| [breakout.c](ready/breakout.c)                   | pictures  | 2          | A     | 0x0137 is 0000 / 0001 / 0011 / 0111: a staircase of destroyed bricks where the ball tunnelled in, over the classic red-orange-yellow-green rows.               |
| [brick-wall.c](ready/brick-wall.c)               | pictures  | 1          | A     | Each course of bricks shifts by half a brick, (x + 2*r) % 4, like a real wall.                                                                                 |
| [buggy-prime.c](ready/buggy-prime.c)             | numbers   | 3          | A     | This is a code-review puzzle: `d * d < n` should be `<=`.                                                                                                      |
| [capsule.c](ready/capsule.c)                     | geometry  | 3          | A     | Clamping x + y to [4, 10] picks the nearest point (t/2, t/2) on the segment.                                                                                   |
| [castle-default.c](ready/castle-default.c)       | mechanics | 3          | A     | default runs only when no case matches, wherever it sits, and then falls through into case 3/4.                                                                |
| [comma-envelope.c](ready/comma-envelope.c)       | mechanics | 3          | A     | c = x > y, x + y > 7 runs the assignment, then tests only x + y > 7.                                                                                           |
| [dead-else-if.c](ready/dead-else-if.c)           | mechanics | 2          | A     | Every d < 3 is already caught by d < 5, so the red branch is dead: a thick orange plus on blue corners, not nested crosses.                                    |
| [delannoy.c](ready/delannoy.c)                   | numbers   | 3          | A     | The sum of three odd numbers is odd, so only the odd colors appear (white, orange, green, purple).                                                             |
| [droste-twist.c](ready/droste-twist.c)           | mechanics | 3          | A     | The top-left quadrant is the whole picture shrunk by half and transposed (the call swaps x and y), so the picture repeats into the corner with red and yellow… |
| [duff-zero.c](ready/duff-zero.c)                 | mechanics | 4          | A     | It is Duff's device, so n = x: a rainbow staircase of bars.                                                                                                    |
| [eight-queens.c](ready/eight-queens.c)           | geometry  | 2          | A     | The queens sit a knight's move apart (columns 0, 2, 4, 6, 1, 3, 5, 7), the classic modular placement.                                                          |
| [eye.c](ready/eye.c)                             | geometry  | 2          | A     | Weighting v by 3 squashes the circle into an ellipse, the eye's white.                                                                                         |
| [font-42.c](ready/font-42.c)                     | pictures  | 2          | A     | 0x2A is 42.                                                                                                                                                    |
| [hypotenuse.c](ready/hypotenuse.c)               | geometry  | 3          | A     | The loop is floor(sqrt(x^2 + y^2)): each cell is colored by its rounded-down distance from the corner.                                                         |
| [knight-mobility.c](ready/knight-mobility.c)     | geometry  | 2          | A     | It counts the knight's legal moves from each square, minus one (n starts at -1): 2 in a corner, 8 in the center.                                               |
| [langton-ant.c](ready/langton-ant.c)             | mechanics | 5          | A     | It is Langton's ant: turn right on a blank cell and left on a marked one, flip the cell, step.                                                                 |
| [lewitt-quarters.c](ready/lewitt-quarters.c)     | research  | 2          | A     | It follows LeWitt's instruction literally: the wall is cut into quarters and each quarter gets one kind of line, vertical (yellow), horizontal (red), diagona… |
| [long-division.c](ready/long-division.c)         | numbers   | 3          | A     | Row y is the octal expansion of 1/(y+2).                                                                                                                       |
| [octants.c](ready/octants.c)                     | geometry  | 2          | A     | Left or right, top or bottom, and closer to the horizontal or vertical axis: three yes/no questions, 2^3 = 8 octants, each with its own palette color.         |
| [peasant.c](ready/peasant.c)                     | numbers   | 3          | A     | The loop is peasant multiplication (add x when y is odd, double x, halve y), so p = x * y.                                                                     |
| [plot.c](ready/plot.c)                           | pictures  | 2          | A     | Screen y points down and math y points up, so h = 7 - y turns the grid into a graph: white axes, a red parabola, a blue line.                                  |
| [pre-post-loops.c](ready/pre-post-loops.c)       | mechanics | 3          | A     | while (i++ < x) leaves i = x + 1 (the failing test increments too), while (++j < y) leaves j = y but never less than 1.                                        |
| [prime-count.c](ready/prime-count.c)             | numbers   | 2          | A     | The color steps up by one exactly at each prime, so the runs of a color are the prime gaps: the long runs sit at 23..28, 31..36 and 47..52.                    |
| [remainder-sign.c](ready/remainder-sign.c)       | research  | 2          | A     | In C, (y - x) % 4 has the sign of y - x.                                                                                                                       |
| [rle-heart.c](ready/rle-heart.c)                 | research  | 1          | A     | The array lists run lengths in reading order, alternating black and red: 1 black, 2 red, 2 black, ...                                                          |
| [roman.c](ready/roman.c)                         | numbers   | 3          | A     | The tables spell L, XL, X, IX, V, IV, I, so len is the number of letters in the Roman numeral for n.                                                           |
| [shadow-flag.c](ready/shadow-flag.c)             | mechanics | 3          | A     | int c = 6 declares a new c.                                                                                                                                    |
| [sierpinski-carpet.c](ready/sierpinski-carpet.c) | research  | 2          | A     | The loop reads x and y digit by digit in base 3.                                                                                                               |
| [snake.c](ready/snake.c)                         | pictures  | 4          | A     | The moves come from the right end of the number: FF is four ups, 00 four rights, 55 four downs, then A (two lefts) and F (two ups).                            |
| [square-factors.c](ready/square-factors.c)       | numbers   | 2          | A     | The returned d is always prime (2, 3, 5 or 7), because if 6^2 divides n then 2^2 already did.                                                                  |
| [square-remainders.c](ready/square-remainders.c) | numbers   | 2          | A     | Row y lists the squares mod y + 1.                                                                                                                             |
| [thales-circle.c](ready/thales-circle.c)         | geometry  | 3          | A     | d is the dot product PA .                                                                                                                                      |
| [thue-morse.c](ready/thue-morse.c)               | research  | 3          | B     | Each cell copies its parent cell (x/2, y/2) and flips green and blue when x+y is odd: a checkerboard of checkerboards.                                         |
| [venn.c](ready/venn.c)                           | geometry  | 3          | A     | Each circle adds its own weight (1, 2, 4), so every region of the Venn diagram gets a distinct color, and the purple center (7) sits inside all three.         |
| [xor-square.c](ready/xor-square.c)               | geometry  | 3          | A     | It looks like dx^2 + dy^2 < 9, a tiny disc.                                                                                                                    |
| [zero-padded.c](ready/zero-padded.c)             | rules     | 3          | A     | The zero-padded 004, 010, 020 and 040 are octal: 4, 8, 16, 32 (powers of two).                                                                                 |

## Ungraded

| File                                                  | Family | Difficulty | Grade | Aha                                                                        |
| ----------------------------------------------------- | ------ | ---------- | ----- | -------------------------------------------------------------------------- |
| [bit-twins.c](ungraded/bit-twins.c)                   | review |            |       | cells whose x and y have the same number of 1 bits                         |
| [designated.c](ungraded/designated.c)                 | review |            |       | designated initializers: `[5] = 6, 4, 2` fills 5, 6, 7; the rest is 0      |
| [negative-modulo.c](ungraded/negative-modulo.c)       | review |            |       | `%` keeps the sign of the dividend: (x - y) % 4 goes negative              |
| [octal-modulo.c](ungraded/octal-modulo.c)             | review |            |       | 010 is octal: the modulus is 8, not 10                                     |
| [pillow.c](ungraded/pillow.c)                         | review |            |       | recursion folds the grid into its top-left quarter                         |
| [short-circuit.c](ungraded/short-circuit.c)           | review |            |       | when the left of `\|\|` is true, the assignment on its right never happens |
| [six-nine.c](ungraded/six-nine.c)                     | review |            |       | a[63 - i] turns the table upside down: the 6 is a 9                        |
| [sizeof-unevaluated.c](ungraded/sizeof-unevaluated.c) | review |            |       | sizeof never evaluates its operand, so `y = 7 - y` never runs              |
| [ternary-precedence.c](ungraded/ternary-precedence.c) | review |            |       | `a + b ? c : d` is `(a + b) ? c : d`                                       |

## Needs a rule change

| File                                                                             | Family | Difficulty | Grade | Needs                           |
| -------------------------------------------------------------------------------- | ------ | ---------- | ----- | ------------------------------- |
| [char-alphabet-columns.c](needs-rule-change/char-alphabet-columns.c)             | rules  | 1          | C     | char type + character literals  |
| [char-overflow-check.c](needs-rule-change/char-overflow-check.c)                 | rules  | 3          | A     | char type (unsigned char)       |
| [char-rules-queen-and-knight.c](needs-rule-change/char-rules-queen-and-knight.c) | rules  | 3          | C     | char type + character literals  |
| [float-float-24-bits.c](needs-rule-change/float-float-24-bits.c)                 | rules  | 5          | C     | float type                      |
| [float-point-three.c](needs-rule-change/float-point-three.c)                     | rules  | 2          | C     | double with non-dyadic literals |
| [float-round-half-up.c](needs-rule-change/float-round-half-up.c)                 | rules  | 3          | C     | double                          |
| [float-three-quarters.c](needs-rule-change/float-three-quarters.c)               | rules  | 3          | C     | double                          |
| [isqrt-isqrt-hyperbolas.c](needs-rule-change/isqrt-isqrt-hyperbolas.c)           | rules  | 3          | C     | isqrt in prelude                |
| [isqrt-isqrt-two-stones.c](needs-rule-change/isqrt-isqrt-two-stones.c)           | rules  | 4          | C     | isqrt in prelude                |
| [libm-sqrt-rainbow.c](needs-rule-change/libm-sqrt-rainbow.c)                     | rules  | 4          | C     | libm sqrt                       |
| [libm-sqrt-tape-measure.c](needs-rule-change/libm-sqrt-tape-measure.c)           | rules  | 3          | C     | libm sqrt                       |
| [strings-color-names.c](needs-rule-change/strings-color-names.c)                 | rules  | 1          | A     | string literals + char          |
| [strings-invader-palette.c](needs-rule-change/strings-invader-palette.c)         | rules  | 2          | C     | string literals + char          |
| [strings-missing-comma.c](needs-rule-change/strings-missing-comma.c)             | rules  | 3          | A     | string literals + char          |
| [strings-paren-mountains.c](needs-rule-change/strings-paren-mountains.c)         | rules  | 3          | A     | string literals + char          |
| [strings-pi-bars.c](needs-rule-change/strings-pi-bars.c)                         | rules  | 1          | C     | string literals + char          |

## Dropped

| File                                                               | Family    | Difficulty | Grade | Why it was dropped                                                                                                                  |
| ------------------------------------------------------------------ | --------- | ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [antialiased-disc.c](dropped/antialiased-disc.c)                   | geometry  | 4          | C     | A fourth disc after D1, ball and crescent-moon.                                                                                     |
| [base3-digits.c](dropped/base3-digits.c)                           | mechanics | 3          | C     | A mild do-while trap (15 cells) on hyperbolic bands that peasant already draws.                                                     |
| [cursor.c](dropped/cursor.c)                                       | pictures  | 2          | C     | A third hex-row sprite after daily 10's cat and several others, and its bit-order trap repeats tutorial 8.                          |
| [fan-trap.c](dropped/fan-trap.c)                                   | geometry  | 2          | C     | The lure is the comment ('slope 1/2'), not the code, which breaks the rule that comments never lie, which both reviews ask for.     |
| [fibonacci-mod-8.c](dropped/fibonacci-mod-8.c)                     | research  | 2          | C     | A Pisano-period aha, but a noisy grid with 45 taps.                                                                                 |
| [five-queens.c](dropped/five-queens.c)                             | geometry  | 4          | C     | The answer is 5 dots on black, and guessing 'no safe square' beats checking 59 squares.                                             |
| [geometry-pac-man.c](dropped/geometry-pac-man.c)                   | geometry  | 2          | C     | The same disc-minus-wedge level as research/pac-man, which adds a pellet returned as a comparison.                                  |
| [half-sum.c](dropped/half-sum.c)                                   | mechanics | 2          | C     | Correct, but a one-idea polka-dot lattice with 16 taps.                                                                             |
| [heart.c](dropped/heart.c)                                         | geometry  | 2          | C     | Near-duplicate of research/rle-heart: the same pixel heart, one row lower.                                                          |
| [index-mod-7.c](dropped/index-mod-7.c)                             | research  | 2          | C     | A diagonal rainbow of 54 taps, and the aha (8 is 1 mod 7) is visible from the code.                                                 |
| [inscribed-angle.c](dropped/inscribed-angle.c)                     | geometry  | 4          | C     | A dot product and a cross product per cell, for an abstract yellow lens.                                                            |
| [knight-distance.c](dropped/knight-distance.c)                     | geometry  | 5          | C     | 63 isolated taps (no two neighbors share a color) and a BFS by hand where one slip cascades: a grind plus a painting chore.         |
| [lit-sphere.c](dropped/lit-sphere.c)                               | geometry  | 2          | C     | Another shaded ball.                                                                                                                |
| [mondrian-unsigned.c](dropped/mondrian-unsigned.c)                 | research  | 3          | C     | Its trap is the unsigned range check that danish-flag introduces at #5, and here it is worth only 6 cells.                          |
| [negative-remainder.c](dropped/negative-remainder.c)               | numbers   | 3          | C     | The same negative-% trap as research/remainder-sign, and 64 taps.                                                                   |
| [octal-root.c](dropped/octal-root.c)                               | numbers   | 3          | C     | 63 diagonal taps for what is (x + y - 1) % 7 + 1.                                                                                   |
| [odd-squares.c](dropped/odd-squares.c)                             | numbers   | 2          | C     | The 4x4 tile aha is nice, but it is 56 isolated taps.                                                                               |
| [partitions.c](dropped/partitions.c)                               | numbers   | 4          | C     | The companion of stairs, with a harder, uncommented recursion and wrapped rows that look like mistakes.                             |
| [pascal-mod-3.c](dropped/pascal-mod-3.c)                           | research  | 3          | C     | Pascal mod 2 is D2's Sierpinski, and mod 3 doesn't read at 8x8.                                                                     |
| [pixel-digits.c](dropped/pixel-digits.c)                           | numbers   | 1          | C     | The picture is read straight off the decimal literals: transcription, not computation.                                              |
| [powers-mod-8.c](dropped/powers-mod-8.c)                           | numbers   | 2          | C     | A sibling of fermat (same code, modulus 8) with a weaker aha.                                                                       |
| [primes.c](dropped/primes.c)                                       | research  | 2          | C     | 18 sparse taps.                                                                                                                     |
| [research-minesweeper.c](dropped/research-minesweeper.c)           | research  | 2          | C     | The same game as pictures/minesweeper.                                                                                              |
| [research-queen-and-knight.c](dropped/research-queen-and-knight.c) | research  | 2          | C     | A busier version of amazon's queen and knight lines.                                                                                |
| [riffle.c](dropped/riffle.c)                                       | numbers   | 2          | C     | Three out-shuffles restore the deck, which is cute, but every row is a permutation (49 taps) and the comment has to name the trick. |
| [rule-30.c](dropped/rule-30.c)                                     | research  | 5          | C     | 56 table lookups for chaotic noise.                                                                                                 |
| [rules-octal-sailboat.c](dropped/rules-octal-sailboat.c)           | rules     | 2          | C     | A duplicate of research/octal-sailboat, using shift and mask instead of / 8.                                                        |
| [tetris.c](dropped/tetris.c)                                       | mechanics | 2          | C     | The same line-clear mechanic as pictures/tetris-clear, with a smaller picture (a 16-cell tree).                                     |
| [thales.c](dropped/thales.c)                                       | rules     | 3          | C     | A third Thales level, and its clipped purple disc is close to D1.                                                                   |
| [times-seven.c](dropped/times-seven.c)                             | numbers   | 2          | C     | Byte-for-byte the same source as research/times-mod-7 ('x * y % 7').                                                                |
| [traffic.c](dropped/traffic.c)                                     | pictures  | 3          | C     | Bit-parallel rule 184 needs 29 scattered strokes.                                                                                   |
| [transpose-trap.c](dropped/transpose-trap.c)                       | research  | 2          | C     | The same arrow and the same index trap as the D11 rework (transposed-arrow, #9).                                                    |
| [truncation.c](dropped/truncation.c)                               | numbers   | 2          | C     | The same truncation trap on the same 2x - 7 bands as geometry/truncation-window, which has the cleaner symmetric picture.           |
| [wythoff.c](dropped/wythoff.c)                                     | numbers   | 5          | C     | A deep game-theory recursion whose payoff is 7 dots on black.                                                                       |
