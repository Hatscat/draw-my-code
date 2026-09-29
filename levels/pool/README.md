# Level pool

Candidate levels from the level design rounds of 2026-09-28 and 2026-09-29, kept for later. The
first round reworked dailies 1-12 and scheduled 13-84; the second scheduled 85-196, replaced 27 and
82, and wrote the special dates in `levels/special/`. The catalogue page `docs/puzzle-pool.html`
shows the loop, the special dates and every candidate with its grid, aha, trap, painting effort and
the curator's notes; open it in a browser.

Each file here is exactly what players would see. To use one, copy it to the next free
`levels/daily/NNNN.c` (or open it in `deno task editor` and paste it into a New daily), then run
`deno task levels`. Add levels 7 at a time: the pool stays a multiple of 7 long, so each loop keeps
every level on its weekday. The generator ignores this folder, so these files are not checked in CI:
recheck any of them with the editor or `deno task levels` before scheduling it.

- `ready/` (5): graded A, or B with the curator's tweak, and not scheduled: the reserve, held back
  to space out circles, negative `%` and octal. `ghost.c` was daily 27 until a jack-o'-lantern took
  Halloween.
- `needs-rule-change/` (16): need string literals, `char`, floats, libm or an `isqrt` helper, which
  the level rules forbid. The file name starts with the feature. Only strings and `char` were judged
  worth allowing, after launch and as their own change.
- `dropped/` (64): graded C (near-duplicates, painting chores, noise, a mechanism a special took),
  kept for reference.

Holidays are special levels (`levels/special/MM-DD-name.c`), shown every year on their date.

## Ready

| File                                       | Family   | Difficulty | Grade | Aha                                                                                                           |
| ------------------------------------------ | -------- | ---------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| [archery.c](ready/archery.c)               | rules    | 2          | B     | Concentric rings by distance from the center; the square root is a one-line loop, so it needs no helper.      |
| [capsule.c](ready/capsule.c)               | geometry | 3          | A     | Clamping x + y to [4, 10] picks the nearest point (t/2, t/2) on the segment.                                  |
| [ghost.c](ready/ghost.c)                   | research | 2          | A     | It is Blinky, the red Pac-Man ghost: a dome top, white eyes with blue pupils looking right, and a wavy skirt. |
| [remainder-sign.c](ready/remainder-sign.c) | research | 2          | A     | In C, (y - x) % 4 has the sign of y - x.                                                                      |
| [zero-padded.c](ready/zero-padded.c)       | rules    | 3          | A     | The zero-padded 004, 010, 020 and 040 are octal: 4, 8, 16, 32 (powers of two).                                |

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

| File                                                               | Family      | Difficulty | Grade | Why it was dropped                                                                                                                                       |
| ------------------------------------------------------------------ | ----------- | ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [antialiased-disc.c](dropped/antialiased-disc.c)                   | geometry    | 4          | C     | A fourth disc after D1, ball and crescent-moon.                                                                                                          |
| [base3-digits.c](dropped/base3-digits.c)                           | mechanics   | 3          | C     | A mild do-while trap (15 cells) on hyperbolic bands that peasant already draws.                                                                          |
| [bell.c](dropped/bell.c)                                           | mechanics   | 3          | C     | =+ is the April Fools special's trap; a pool copy would spoil it, and its silhouette is 50/64 like pawn.                                                 |
| [binary-carries.c](dropped/binary-carries.c)                       | art-numbers | 2          | C     | Abstract and tap-heavy (21 taps); its black cells repeat #4's Sierpinski.                                                                                |
| [binary-tree-maze.c](dropped/binary-tree-maze.c)                   | art-numbers | 3          | C     | The same algorithm and look as algorithms/binary-tree-maze (56/64); keep one.                                                                            |
| [cake-cut.c](dropped/cake-cut.c)                                   | geometry    | 1          | C     | The code gives the half-plane away, and it is 0.88 like tutorial 6.                                                                                      |
| [cursor.c](dropped/cursor.c)                                       | pictures    | 2          | C     | A third hex-row sprite after daily 10's cat and several others, and its bit-order trap repeats tutorial 8.                                               |
| [detour.c](dropped/detour.c)                                       | geometry    | 2          | C     | A third taxicab level after taxi-race and moves, and its octagon rings echo hex-rings.                                                                   |
| [euclid-squares.c](dropped/euclid-squares.c)                       | geometry    | 2          | C     | Same Euclid cut as algorithms/euclid-squares, and its two touching 3x3 squares read as one orange block.                                                 |
| [fan-trap.c](dropped/fan-trap.c)                                   | geometry    | 2          | C     | The lure is the comment ('slope 1/2'), not the code, which breaks the rule that comments never lie, which both reviews ask for.                          |
| [fibonacci-mod-8.c](dropped/fibonacci-mod-8.c)                     | research    | 2          | C     | A Pisano-period aha, but a noisy grid with 45 taps.                                                                                                      |
| [fir-tree.c](dropped/fir-tree.c)                                   | specials    | 2          | C     | The Christmas special keeps the owner-curated tree (daily 82 until round 2): this fir tree is within a few cells of it.                                  |
| [five-queens.c](dropped/five-queens.c)                             | geometry    | 4          | C     | The answer is 5 dots on black, and guessing 'no safe square' beats checking 59 squares.                                                                  |
| [fox-and-hen.c](dropped/fox-and-hen.c)                             | geometry    | 3          | C     | A sparse blob in the crowded circle family.                                                                                                              |
| [geometry-pac-man.c](dropped/geometry-pac-man.c)                   | geometry    | 2          | C     | The same disc-minus-wedge level as research/pac-man, which adds a pellet returned as a comparison.                                                       |
| [gingham.c](dropped/gingham.c)                                     | mechanics   | 3          | C     | Another dead branch (#12, #59, dead-else-if) on plain plaid, with the trap at the 16-cell floor.                                                         |
| [golden-rectangle.c](dropped/golden-rectangle.c)                   | specials    | 2          | C     | Fibonacci Day: the page doesn't name the date, its grid is algorithms/euclid-squares' (pool #140), and it would hide #50 in the first year.              |
| [half-sum.c](dropped/half-sum.c)                                   | mechanics   | 2          | C     | Correct, but a one-idea polka-dot lattice with 16 taps.                                                                                                  |
| [hash-chains.c](dropped/hash-chains.c)                             | algorithms  | 2          | C     | 13 isolated taps and little picture; hashing is already drawn by #53 linear probing.                                                                     |
| [heart.c](dropped/heart.c)                                         | geometry    | 2          | C     | Near-duplicate of research/rle-heart: the same pixel heart, one row lower.                                                                               |
| [honeycomb.c](dropped/honeycomb.c)                                 | geometry    | 4          | C     | The busiest picture, the sheared hexagons do not read, and it repeats bathroom-floor's skeleton.                                                         |
| [hourglass.c](dropped/hourglass.c)                                 | art-numbers | 1          | C     | The New Year special is an hourglass; one hourglass is enough.                                                                                           |
| [house.c](dropped/house.c)                                         | mechanics   | 2          | C     | Its sky and roof are exactly daily 64's house (52/64).                                                                                                   |
| [index-mod-7.c](dropped/index-mod-7.c)                             | research    | 2          | C     | A diagonal rainbow of 54 taps, and the aha (8 is 1 mod 7) is visible from the code.                                                                      |
| [inscribed-angle.c](dropped/inscribed-angle.c)                     | geometry    | 4          | C     | A dot product and a cross product per cell, for an abstract yellow lens.                                                                                 |
| [kaleidoscope.c](dropped/kaleidoscope.c)                           | mechanics   | 3          | C     | The same fold-from-the-middle index trap as mechanics/invader (keep one), and its 4-fold flower is close to #37 and #57 (52/64).                         |
| [knight-distance.c](dropped/knight-distance.c)                     | geometry    | 5          | C     | 63 isolated taps (no two neighbors share a color) and a BFS by hand where one slip cascades: a grind plus a painting chore.                              |
| [launch-calendar.c](dropped/launch-calendar.c)                     | art-numbers | 2          | C     | A plain block picture tied to 2026; the 12-line limit leaves no room to mark launch day.                                                                 |
| [leaf.c](dropped/leaf.c)                                           | geometry    | 4          | C     | sqrt(a) + sqrt(b) <= 13 squared twice means products up to about 60000 per edge cell: an arithmetic grind, not a few minutes.                            |
| [lit-sphere.c](dropped/lit-sphere.c)                               | geometry    | 2          | C     | Another shaded ball.                                                                                                                                     |
| [max-square-ball.c](dropped/max-square-ball.c)                     | algorithms  | 3          | C     | Another disc when the circle family is already full, and tap-heavy diagonal gradients (about 33 strokes, 21 taps) for a DP the LCS table already covers. |
| [mondrian-unsigned.c](dropped/mondrian-unsigned.c)                 | research    | 3          | C     | Its trap is the unsigned range check that danish-flag introduces at #5, and here it is worth only 6 cells.                                               |
| [mountains.c](dropped/mountains.c)                                 | art-numbers | 1          | C     | A thin aha, and #43 and #72 already draw mountains.                                                                                                      |
| [negative-modulo.c](dropped/negative-modulo.c)                     | review      |            | C     | The transpose of ready/remainder-sign (64/64), and kite covers negative % with a better picture.                                                         |
| [negative-remainder.c](dropped/negative-remainder.c)               | numbers     | 3          | C     | The same negative-% trap as research/remainder-sign, and 64 taps.                                                                                        |
| [octal-modulo.c](dropped/octal-modulo.c)                           | review      |            | C     | Reading 010 as 10 gives colors 8 and 9, so the trap catches no one, and it is 56 diagonal taps.                                                          |
| [octal-root.c](dropped/octal-root.c)                               | numbers     | 3          | C     | 63 diagonal taps for what is (x + y - 1) % 7 + 1.                                                                                                        |
| [odd-squares.c](dropped/odd-squares.c)                             | numbers     | 2          | C     | The 4x4 tile aha is nice, but it is 56 isolated taps.                                                                                                    |
| [paperfolding.c](dropped/paperfolding.c)                           | art-numbers | 2          | C     | The same halve-while-even loop on n = 8y + x + 1 as #71, with the same constant-column look.                                                             |
| [partitions.c](dropped/partitions.c)                               | numbers     | 4          | C     | The companion of stairs, with a harder, uncommented recursion and wrapped rows that look like mistakes.                                                  |
| [pascal-mod-3.c](dropped/pascal-mod-3.c)                           | research    | 3          | C     | Pascal mod 2 is D2's Sierpinski, and mod 3 doesn't read at 8x8.                                                                                          |
| [pillow.c](dropped/pillow.c)                                       | review      |            | C     | The same fold-into-a-quarter recursion as #37.                                                                                                           |
| [pinwheel.c](dropped/pinwheel.c)                                   | art-numbers | 2          | C     | The same rotate-and-recolor recursion as geometry/pinwheel-proof, which adds a dissection proof and paints cheaper.                                      |
| [pixel-digits.c](dropped/pixel-digits.c)                           | numbers     | 1          | C     | The picture is read straight off the decimal literals: transcription, not computation.                                                                   |
| [plus-tiling.c](dropped/plus-tiling.c)                             | geometry    | 3          | C     | Busy clipped pluses; the same linear-form-mod-n skeleton as bathroom-floor, which reads better.                                                          |
| [powers-mod-8.c](dropped/powers-mod-8.c)                           | numbers     | 2          | C     | A sibling of fermat (same code, modulus 8) with a weaker aha.                                                                                            |
| [primes.c](dropped/primes.c)                                       | research    | 2          | C     | 18 sparse taps.                                                                                                                                          |
| [research-minesweeper.c](dropped/research-minesweeper.c)           | research    | 2          | C     | The same game as pictures/minesweeper.                                                                                                                   |
| [research-queen-and-knight.c](dropped/research-queen-and-knight.c) | research    | 2          | C     | A busier version of amazon's queen and knight lines.                                                                                                     |
| [riffle.c](dropped/riffle.c)                                       | numbers     | 2          | C     | Three out-shuffles restore the deck, which is cute, but every row is a permutation (49 taps) and the comment has to name the trick.                      |
| [rule-30.c](dropped/rule-30.c)                                     | research    | 5          | C     | 56 table lookups for chaotic noise.                                                                                                                      |
| [rules-octal-sailboat.c](dropped/rules-octal-sailboat.c)           | rules       | 2          | C     | A duplicate of research/octal-sailboat, using shift and mask instead of / 8.                                                                             |
| [shadow-on-the-wall.c](dropped/shadow-on-the-wall.c)               | geometry    | 2          | C     | The intercept theorem (#52) and a shadow (#72) again, with a staircase silhouette 53/64 like fenwick-blocks.                                             |
| [swiss.c](dropped/swiss.c)                                         | art-numbers | 1          | C     | A thin aha, and a plus like dead-else-if and #5's cross.                                                                                                 |
| [tetris.c](dropped/tetris.c)                                       | mechanics   | 2          | C     | The same line-clear mechanic as pictures/tetris-clear, with a smaller picture (a 16-cell tree).                                                          |
| [thales.c](dropped/thales.c)                                       | rules       | 3          | C     | A third Thales level, and its clipped purple disc is close to D1.                                                                                        |
| [three-shears.c](dropped/three-shears.c)                           | geometry    | 3          | C     | A sparse 16-cell L and the same "which way does it turn" puzzle as #45; the swap misreading is weak.                                                     |
| [times-seven.c](dropped/times-seven.c)                             | numbers     | 2          | C     | Byte-for-byte the same source as research/times-mod-7 ('x * y % 7').                                                                                     |
| [traffic.c](dropped/traffic.c)                                     | pictures    | 3          | C     | Bit-parallel rule 184 needs 29 scattered strokes.                                                                                                        |
| [transpose-trap.c](dropped/transpose-trap.c)                       | research    | 2          | C     | The same arrow and the same index trap as the D11 rework (transposed-arrow, #9).                                                                         |
| [triangle-sides.c](dropped/triangle-sides.c)                       | geometry    | 3          | C     | A noisy band; its author keeps it as a spare.                                                                                                            |
| [truncation.c](dropped/truncation.c)                               | numbers     | 2          | C     | The same truncation trap on the same 2x - 7 bands as geometry/truncation-window, which has the cleaner symmetric picture.                                |
| [unit-balls.c](dropped/unit-balls.c)                               | geometry    | 2          | C     | Mostly one color at 8x8, and distance norms are already covered by #8, #11 and hex-rings.                                                                |
| [wythoff.c](dropped/wythoff.c)                                     | numbers     | 5          | C     | A deep game-theory recursion whose payoff is 7 dots on black.                                                                                            |
