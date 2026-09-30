# Draw my code — v1 spec

## Goal

A polished, free daily puzzle that doubles as a showcase and builds an audience for my future games.
No ads, no accounts, no backend. English only.

## Core loop

1. Every day at local midnight a new puzzle #N unlocks: same puzzle for everyone on a given local
   date, like Wordle. Puzzle #1 is `LAUNCH_DATE`.
2. The player reads `int f(int x, int y)`, picks colors and paints the 8×8 grid.
3. The grid starts filled with 0, so Submit is available from the start: a sparse level can be
   solved in a single tap. A wrong submit only tells how many cells are wrong. 3 attempts.
4. Solved or out of attempts: the puzzle is over, the result panel appears, the player shares.

## Rules

- Grid 8×8. Origin top-left, x grows right, y grows down, x and y in [0, 7].
- Palette: 0 black, 1 white, 2 red, 3 orange, 4 yellow, 5 green, 6 blue, 7 purple. With 0 black and
  1 white, C booleans draw white on black, like a 1-bit screen.
- No empty state: every cell always holds a value in [0, 7], starting at 0.
- The selected color is 1 (white) whenever a puzzle loads, so the first tap always paints.
- 3 attempts per daily puzzle (`ATTEMPTS` in config). After a wrong submit, the only feedback is a
  line above Submit: `N wrong · attempt 2/3`, where 2 is the attempt about to be played. It stays
  until the next submit; painting doesn't clear it. Cells are never marked, in the daily or the
  tutorial: per-cell marks would give the solution away.
- After a wrong submit, while the grid equals the last submitted drawing, Submit is disabled and a
  second line says `Change a cell to submit again`, so a double tap can't burn an attempt. Submit
  stays focusable (`aria-disabled`): a truly disabled button drops keyboard focus.
- A finished puzzle can't be replayed. Reloading restores both in-progress and finished states.
- Levels have no title: the puzzle number is their only name.

Config lives in `src/core/config.ts`: `LAUNCH_DATE` (placeholder in the future, I'll set it),
`ATTEMPTS`, `FOLLOW_URL` (optional). `LAUNCH_DATE` and `ATTEMPTS` are frozen after launch: changing
them renumbers or reinterprets every stored result.

## Tutorial

- 9 levels (the files in `levels/tutorial/`), shown automatically until finished or skipped (a
  `Skip tutorial` link). Replayable from the info panel.
- Unlimited attempts, no stats, no share. After a wrong submit the status line shows `N wrong` (no
  attempt count). After a solve it says `Right!` and Submit becomes `Next` (`Done` on the last
  level), which leads on to the daily (or the pre-launch screen). The new level shows from the top
  of the page; keyboard focus follows onto it.
- A reload resumes at the current tutorial level with a blank grid. A replay starts at level 1 and
  never touches the daily's state.
- Analytics: only `tutorial_complete`, the first time the last level is solved (never on skip).

## Info panel

The "?" button toggles the info panel of `design/spec_screenshot_tooltip_info.png`
(`aria-expanded`):

- `f(x, y) returns a color index from 0 to 7 for every cell.` /
  `x runs left to right, y top to
  bottom, both from 0 to 7.` /
  `Pick a swatch, then tap or drag across the grid to paint.` /
  `Keys
  0–7 pick a color; arrows move, Space paints.` / `You have 3 attempts.` (from `ATTEMPTS`;
  `Unlimited attempts.` in the tutorial).
- A `Show digits` switch (off by default, saved): prints each cell's value in the corner, like the
  swatches, for players who can't tell some colors apart.
- A `Replay tutorial` button, hidden during the tutorial.
- An `Install app` button while the browser can install the game (see PWA).
- The page may scroll while the panel is open.

## Result panel

- Inline: the result and the failed-puzzle toggle cover the instruction and swatches, right above
  the grid, so the toggle's effect is in view; stats, share and the countdown take the place of the
  status line and Submit. The grid stays visible and read-only. The page may scroll once the puzzle
  is over.
- Solved: "Solved in N/3". Failed: "X/3", plus a toggle `Solution` (default) / `Your drawing`. Both
  are shown plain, with no per-cell marks: toggling is how the player compares them.
- Stats (played, win %, current streak, max streak, distribution 1/2/3/X). Distribution bars show
  their counts; the bar of the result on screen is highlighted by more than color, and screen
  readers hear whose it is: `In 2: 5, today`, or `In 2: 5, #10` for a missed puzzle.
- Share button, `Next puzzle in HH:MM:SS` (or a `Play #N` button when the puzzle was finished after
  midnight), a `Follow for new games` link to the author's itch.io page, in a new tab (`FOLLOW_URL`;
  hidden when empty).

## Share

Exact text, lines joined by `\n`, no trailing newline:

```
Draw my code #12 2/3
🟩🟩🟩🟨🟨🟩🟩🟩
…(8 rows of 8)
https://drawmycode.lonebee.games/
```

A failed puzzle reads `Draw my code #12 X/3`. The URL is the site URL, with its trailing slash.

Per cell: 🟩 correct from attempt 1 on, 🟨 from attempt 2 on, 🟧 from attempt 3 on, ⬛ still wrong
at the end. "Correct from attempt k on" = correct in attempt k and in every later attempt. The text
never reveals the solution's colors, but it may reveal its shape (a blank first submit followed by a
solve outlines the non-black cells).

Touch devices (`pointer: coarse`) with `navigator.share`: `navigator.share({ text })`, called
directly in the click handler; a cancel does nothing. Otherwise: clipboard and a "Copied" toast. If
both fail, the text is shown in a read-only field to copy by hand.

Link previews, for the URL in shared texts: the page's description, Open Graph and Twitter card tags
(`summary_large_image`) with absolute URLs built from the site URL, and `public/og.png` (1200×630:
the title in a pixel font, `int f(int x, int y)` and the red disc of the last tutorial level), drawn
by `deno task icons` like the icons.

## Stats and streaks

Stored locally as per-puzzle results (1, 2, 3 or X), never pruned; played, win %, streaks and
distribution are derived from them.

- Played = finished dailies. Win % = floor(100 × solved / played), 0 when nothing was played.
- Current streak: let h be the highest solved puzzle number. It is the run of consecutive solved
  numbers ending at h, as long as no puzzle after h failed and the first puzzle after h is still
  open (h + 1 ≥ today − `CATCH_UP_DAYS`); otherwise 0. So an unplayed today doesn't show 0 all
  morning, and a missed day doesn't break the streak until it closes: catching it up joins the runs.
  A failed puzzle breaks it.
- Max streak: the longest run over all results. Results numbered after today (the device clock moved
  back) count for played and max streak, not for the current streak.

## Catching up

- A missed puzzle stays open for `CATCH_UP_DAYS` (7) days: on puzzle day T, puzzles T − 7 to T can
  be played, and count like any other.
- Once a puzzle is over, its result panel lists the missed puzzles still open ("Missed this week:
  solve them to keep your streak.", then buttons such as `#10 · Oct 14`), oldest first.
- A missed puzzle's screen shows `#10 · Oct 14` in the header and a `Back to today's puzzle` link
  under Submit. Once over, its result panel offers a `Back to today's puzzle` button in place of the
  countdown.
- Only today's puzzle sends analytics: catching up a week in one day would blow the daily event
  budget.

## Dates

- Puzzle number = calendar days between `LAUNCH_DATE` and the player's local date, + 1. Computed
  from `{ y, m, d }` only: no timestamps, no DST bugs.
- Midnight while the page stays open: the date is re-checked on every countdown tick and whenever
  the app comes back to the foreground. A finished or untouched puzzle then reloads to today's. An
  in-progress puzzle stays until finished, and its result counts for its own number; its result
  panel keeps its streak and missed puzzles current through later midnights. The tutorial is never
  interrupted: if the day changed meanwhile, its end leads to today's puzzle without a reload, so a
  first tutorial's install invitation still shows.
- Before `LAUNCH_DATE`: tutorial on the first visit, then "First puzzle on <Month D, YYYY>" (e.g.
  "First puzzle on October 1, 2026") and a countdown: `Starts in N days`, then `Starts in HH:MM:SS`
  on the last day. On both screens the header shows only "?".
- Dev builds only: `?date=YYYY-MM-DD` overrides today.
- Known limits, accepted: changing the device clock opens past puzzles, and the bundle contains
  every future solution.

## Player data

- One localStorage key, `draw-my-code`, holding versioned JSON: tutorial progress, per-puzzle
  results, the current puzzle's play state (its solution, drawing and every submitted grid, needed
  to rebuild the share text), analytics dedupe markers and the `Show digits` setting.
- Corrupted data: defaults, written at the next write (a player action, or the day's pageview marker
  in production). Data from a newer version (an old tab or cached bundle): play in memory, never
  write. Older versions: migrate.
- Every action re-reads storage before writing, and other tabs re-render on `storage` events, so two
  tabs can't multiply attempts.
- If a stored in-progress solution differs from the bundle's (a level was edited), that play state
  is dropped. A finished puzzle keeps its play and its own solution, so its result and share text
  stay true. Plays, finished or not, are kept while their puzzle is open: today's and the past
  `CATCH_UP_DAYS` days' (a finished one shows its result and share text again; an unfinished one may
  be open in another tab).
- localStorage unavailable: the game still works, in memory (and sends no analytics).
- Known limits, accepted: an installed iOS app doesn't share storage with Safari, and Safari clears
  site data after 7 days without a visit. Installed apps call `navigator.storage.persist()`.
- Player data belongs to the site's origin: choose the final domain before launch, since moving to
  another one later resets everyone.

## UI

Follow `design/`. What was designed:

- Single centered column: header, code panel, instruction "Draw the output in each cell", 8 numbered
  swatches, 8×8 grid with axis labels 0–7, Submit button.
- Selected swatch: light outline, slightly larger, bold number.
- The screenshots show × marks and inner outlines on wrong cells: ignore them, cells are never
  marked. Black cells must stay clearly visible against the dark page: keep crisp grid lines.
- Contrast fixes over the design (WCAG AA): axis and domain labels `#7a808b`, inner grid lines
  `#545a66` (the design's outer border color).
- Keys 0–7 select a color (not with Ctrl, Meta or Alt). Hovering a cell (fine pointers) or focusing
  it shows the call `f(3, 4)`, never its value, in the code panel header in place of `x,y ∈ [0,7]`,
  and highlights both axis labels.
- The grid spans the column's full width, however long the code: 266 px at 320 px wide, 426 px at
  most. When the content doesn't fit one screen (long levels, short screens, open info panel) the
  page scrolls; painting gestures never scroll or zoom it. Tighter spacing below about 700 px of
  viewport height.
- The grid never moves or changes size within a puzzle: its size depends only on the column's width,
  the status line always has room for its two lines, and the result covers the controls instead of
  pushing the grid.

Additions:

- Header right: `#N` for the daily, `Tutorial 2/9` in the tutorial; a "?" button. Code panel label:
  `daily_0012.c` / `tutorial_2.c`.
- Keyboard on the grid: roving focus, arrows, Home/End, Space/Enter paints with the selected color.
  Each cell's accessible name includes its value and color name.
- Over a grid that paints, the mouse pointer is a crosshair; the default arrow once the puzzle is
  over.
- Buttons show their state. Filled buttons light up on hover and sink a pixel, darker, while
  pressed; outlined ones brighten their edge on hover and fill faintly while pressed; an unselected
  swatch lifts on hover and shrinks while pressed. Hover only where a mouse can hover. A disabled
  Submit shows in its fill, never by fading the whole button, and nothing clips a focus ring. iOS
  Safari needs an empty `touchstart` listener to show pressed states.
- Code font scales so the longest line fits without horizontal scroll, never below 11 px.
- Syntax highlighting with a tiny hand-written tokenizer (keywords, types, function name, numbers,
  operators, identifiers, comments). No library.
- Font: JetBrains Mono, a variable woff2 subset (ASCII plus `·`, `×`, `∈`) downloaded once from
  Google Fonts and committed with its OFL license, precached; system monospace fallback; ligatures
  off. No font CDN.
- Screens that weren't designed (result panel, tutorial controls, toast, pre-launch) reuse the
  design's tokens.
- A new screen (the tutorial's next level, a missed puzzle, back to today's) shows from the top of
  the page. Keyboard focus moves into it only when a key pressed the button (`:focus-visible`):
  after a tap, focusing Submit would scroll a small screen down, away from the code.
- Solving a daily or a tutorial level bursts confetti in the palette's colors (not black) out of the
  grid, for 3 s, over the page: a canvas that never takes input. Not on a failure, not when a solved
  puzzle is reopened, and never with `prefers-reduced-motion`: the result text says it all.
- Dark theme only in v1.

## Levels

Sources:

- `levels/tutorial/01-one-cell.c` … `09-center.c` (`NN-name.c`, lowercase name).
- `levels/daily/0001.c`, `0002.c`, … contiguous: the daily pool, in order.
- `levels/special/MM-DD-name.c` (e.g. `10-31-halloween.c`): a level shown every year on that date,
  in place of the pool's. Feb 29 is allowed and shows in leap years only. One level per date.

Schedule: the pool loops forever, so there is always a puzzle after launch. Puzzle #N shows its
date's special if there is one; otherwise pool level `(start + N − from) mod size`, counted from 0,
for the latest epoch `{ from, size, start }` with `from ≤ N`. The first epoch is `{ 1, P, 0 }`. When
the pool changes size after launch, the generator adds an epoch starting tomorrow (in UTC+14) that
carries on from where the loop was, so no day already shown changes level. A special takes its day
without shifting the pool: the level it replaces comes back in a later loop. If the pool shrinks, a
past day whose level is gone wraps around the new pool: every day always has a level.

Format: the file is exactly what players see, byte for byte: the function, 2-space indentation.
Comments are allowed and shown to players, so they can serve as hints.

```c
int f(int x, int y) {
  int dx = 2*x - 7, dy = 2*y - 7;
  return dx*dx + dy*dy < 40 ? 2 : 0;
}
```

- Printable ASCII and LF only; no tabs, no trailing whitespace; exactly one final newline, which
  isn't displayed.
- At most 12 lines, counting the signature and the closing brace, of at most 36 characters.
- One function, exactly `int f(int x, int y)`. Integers only (no `float`, `double` or `char`, no
  string or character literals), no preprocessor, trigraphs or line continuations, no identifier
  starting with `_`, no calls except `abs`, `min`, `max` and `f`, no static or global variables, no
  variable-length arrays. Standard C11 only: no GNU extension such as `0b101` or `x ?: y`. Loops and
  recursion are allowed.

Generator `tools/levels.ts` (`deno task levels`):

1. Compile `tools/harness.c` with the level three times, using
   `gcc -std=c11 -pedantic-errors -Wall -Wextra -Werror -Wno-unused-parameter -fsanitize=undefined -fno-sanitize-recover=all -fno-builtin -include tools/prelude.h`
   plus `-O1`; `-O0 -ftrivial-auto-var-init=pattern -fanalyzer`; and
   `-O0 -ftrivial-auto-var-init=zero`. The -O0 builds catch UB that -O1 folds away; the two fills
   and the analyzer catch uninitialized variables in the usual cases; `-pedantic-errors` rejects GNU
   extensions; `-fno-builtin` keeps calls to library builtins visible. All three runs must print the
   same 64 values, row by row.
2. Reject with a clear message: file format, forbidden construct (token check, and `nm`: only `f`
   and the prelude's helpers defined, only UBSan handlers and the stack protector undefined),
   compile error or warning, UB at runtime, timeout (2 s), crash (any signal), value outside [0, 7],
   all-0 solution, numbering gap. The harness is not dumpable, so a crashing level leaves no core
   dump.
3. Write `src/levels/generated.ts`, deterministic and `deno fmt`-clean: `tutorial` and `daily` lists
   of `id`, `code`, and `solution` as 8 strings of 8 digits, one per row, so the drawing is readable
   in diffs; `special` (month, day, name, code, solution) and `epochs`. The daily pool can't be
   empty.
4. Print every new or changed level: its code next to an ANSI truecolor preview of the grid. Then
   the pool's size (one loop every N days), the number of special dates, and today's puzzle number
   in UTC+14, the first time zone to reach a date.

`deno task levels` refuses any change to what an open puzzle shows, unless run with
`--allow-published-edit`: open anywhere, from today's in UTC+14 back to the oldest still open in
UTC−12, `CATCH_UP_DAYS` + 2 days earlier (UTC−12 can be two dates behind). Any other level may
change, even one shown in an earlier loop: finished plays keep their own solution. After launch it
also stops when `src/levels/generated.ts` is missing, unreadable (a merge conflict) or has no
epochs: its epochs are state, and rebuilding them from nothing would move past days to other levels.
`--check` regenerates in memory and fails if the file differs. `--base=<file>` freezes open puzzles
against another `generated.ts` than the one on disk: CI passes the deployed commit's (the push's
previous head, or the pull request's base), so levels generated days before their push can't change
a puzzle that opened meanwhile. In CI, `[allow-published-edit]` in a pushed commit's message (or a
pull request's title) stands for the flag.

Level editor, for the author (`deno task editor`, dev server only, never built or deployed): a page
(`src/editor/`) with a level's source, the code panel and grid as players see them, and every check
of the generator, run by gcc on the dev server (`tools/level-editor.ts`) as the author types. It
lists, opens, creates (never over an existing file, from a placeholder that fails the checks), and
saves level files, follows changes made on disk, and runs the generator. Its endpoints answer only
same-origin requests to a localhost host: a check runs the code.

Content:

- Tutorial, one idea per level, reworked by the owner after a playtest: one red cell (the axes, and
  numbers as colors) · `x` · integer division · `%` · `max` (the prelude's helpers) · a comparison
  as 0 or 1 · an array lookup · a bit mask · the grid's center (`2*x - 7`) and the squared distance
  to it, which draws a disc (daily #1 until the owner made it the last tutorial level). The files in
  `levels/tutorial/` are the reference.
- Daily puzzles: a pool of 196 levels in `levels/daily/` (a loop of 28 weeks), curated by the owner,
  and 7 special dates in `levels/special/`: New Year, Valentine's Day, Pi Day, April Fools' Day,
  Programmers' Day (Sep 13, the 256th day), Halloween and Christmas. Unscheduled candidates wait in
  `levels/pool/` (its README lists them); `docs/puzzle-pool.html` shows the loop, the special dates
  and every candidate of the 2026-09-28 and 2026-09-29 design rounds with its grid and notes.

Level design. The generator can't check these; they apply when a level is written or reviewed.

- Every level has an aha (a shape to discover, a trap, a C rule), not 64 cells of arithmetic, and is
  solvable in the head or on paper in under 10 minutes.
- The player can debug `N wrong`: symmetry, a repeated tile, rows that are permutations, or a
  recognizable picture.
- The painting budget is counted in strokes, not cells: a drag paints a straight run, so diagonals
  and isolated cells are taps. At most one tap-heavy level a week.
- No shift of a negative value: `<<` is undefined and `>>` implementation-defined, in C23 too. `~`,
  `&`, `|` and `^` may take negative operands: levels assume two's complement (the only
  representation gcc supports and C23 allows), so `~n` is `-n - 1`. No result may depend on a type's
  width or on `sizeof`.
- Comments are truthful hints, never lures.
- A trap turns on one visible token, in standard C, never on a compiler quirk. Its plausible naive
  reading is at least 15 cells off, and the true grid is still worth painting.
- House style, since players see the code byte for byte: tight products (`2*x`, `dx*dx`); spaces
  around `+`, `-`, comparisons and `?:`; lowercase comment fragments without a final period; a
  single-statement body on its own line, without braces; squeeze spacing only where the 36-column
  limit forces it.
- Weekly rhythm: Monday easy or a picture; Tuesday to Thursday one or two ideas; Friday a trick or a
  trap; Saturday the hardest; Sunday a picture or a game. The pool stays a multiple of 7 levels
  long, so every loop keeps each level on its weekday, and the spacing rules below also hold across
  the seam, from the pool's last levels to its first.
- Traps: one or two a week, never on consecutive days, a new mechanism each time. Bitwise levels: at
  most two a week, never on consecutive days. Circles: at most one every two weeks. Levels with the
  same skeleton (Minesweeper and Life, a sieve and a buggy sieve) at least four weeks apart.
- Holidays and other yearly dates are specials, never pool levels: a pool position falls on a given
  date only once. Their players are casual: difficulty 2 or 3, instantly recognizable once painted.
  The spacing rules count them in the first loop (Pi Day's pie is a circle, the April Fools' fish a
  trap); later years put them next to other pool levels.

## PWA

- `manifest.webmanifest`: name, short_name, `standalone`, theme and background colors from the
  design, relative `start_url` and `scope`, `id` "draw-my-code" (an id resolves against the origin,
  so "./" would claim the whole origin), icons 192/512 plus maskable.
- Icons: pixel art from an 8×8 grid in the palette, generated by `tools/icons.ts` with a minimal PNG
  encoder (CompressionStream + CRC32), committed to `public/icons/`. No image library. Also a 32 px
  favicon and an opaque 180 px apple-touch-icon (iOS ignores maskable icons).
- Service worker, hand-written, no Workbox or PWA plugin. A small custom Vite plugin injects the
  list of built assets and a build hash. Precache the app shell on install (not `og.png`: only
  link-preview crawlers fetch it), cache-first for hashed assets, network-first with a timeout and
  cache fallback for navigations, same-origin GET only. Cache names start with `draw-my-code-`; on
  activate, delete only those old caches (the origin may host other games). `skipWaiting` +
  `clients.claim`: a new version takes over on the next load, with no update prompt.
- Fully playable offline after the first visit (levels ship in the bundle).
- Installing: finishing the tutorial for the first time (not Skip, not a replay) opens a dialog
  inviting the player to install the game. Chromium browsers get an `Install` button that opens the
  browser's own prompt (`beforeinstallprompt`, whose default mini-infobar is suppressed); browsers
  on iOS and iPadOS (Safari, Chrome, Firefox, Edge: their user agents say `Safari/`) get the Share,
  then Add to Home Screen steps, and a note that the home screen app keeps its own progress (iOS
  gives it separate storage); Safari on macOS gets File, then Add to Dock. Other browsers, in-app
  browsers such as Instagram's (no `Safari/`, no Add to Home Screen), and the installed app itself
  get no dialog. The info panel's `Install app` button opens the same dialog. The dialog is a modal
  `<dialog>`: Escape or `Not now`/`Got it` closes it and puts the focus back on its opener, or, when
  the prompt just spent hid that button, on the first control beside it.
- Base path and site URL come from the GitHub Pages configuration at build time, never hard-coded,
  so a custom domain later needs no code change. Local builds default to
  `http://127.0.0.1:4173/draw-my-code/`, so they also run under a sub-path. The site URL is used in
  the share text and in the analytics host check.

## Analytics — Umami Cloud (Hobby plan)

- `src/analytics.ts` injects the Umami script only when it's a production build, on the production
  host (the site URL's), and `VITE_UMAMI_WEBSITE_ID` is set (GitHub Actions repository variable).
  Also set `data-domains`, `data-auto-track="false"` and `data-exclude-search="true"` (shared links
  come back with click ids).
- Umami counts each event property as an event, and Hobby allows 100K events/month and 1 website.
  Budget: at most 4 events per player per day, so no event has properties:
  - `pageview`: sent manually, at most once per local date, and only while the page is visible (not
    for a tab reloaded in the background at midnight).
  - `puzzle_complete_1`, `_2`, `_3` or `_x`: when today's daily finishes (not a missed one caught
    up).
  - `share`: once per puzzle, after a successful share or copy of today's puzzle.
  - `tutorial_complete`: once per player.
- Dedupe markers are saved only once Umami has the event, so a failed script load doesn't use up the
  day's pageview. Without persistent storage (blocked, full, a newer version's data) nothing is
  sent: the dedupe couldn't survive a reload.
- Nothing else. Typed no-op when the script isn't loaded. No cookie banner in v1.

## Tests

Unit (`deno task test`, assertions from the built-in `node:assert/strict`):

- core: puzzle number (month and year boundaries, leap years, DST dates), grid diff, attempt state
  machine (a wrong submit yields only the wrong count; an unchanged grid can't be resubmitted),
  share text (exact), stats and streaks (missed day still open or closed, catching up, failed day,
  today unplayed, win % rounding, nothing played), the looping schedule (specials, Feb 29, a pool
  that grows or shrinks after launch), open puzzles and play retention, storage load, migration,
  corrupted and newer-version data.
- ui: the local-date and next-midnight helpers, under several time zones; the highlighter tokenizer.
- tools: every rejection case with fixtures (format, forbidden constructs, out of range, UB
  overflow, compile error, timeout, crash, numbering gap, line too long); deterministic output; the
  freeze (open puzzles back to UTC−12, against `--base`), an unreadable `generated.ts` after launch.

E2E (Playwright; projects: Desktop Chrome, Pixel 7, iPhone 14 on WebKit; Chromium runs the full
browser build, whose text metrics match real devices; time zone and locale pinned):

- First visit → tutorial → skip → daily puzzle.
- Painting: tap, drag (mouse, and touch via pointer events with `pointerType: "touch"`), keyboard,
  keys 0–7. Dragging never scrolls the page.
- Wrong submit → count line and no per-cell indication on the grid; Submit disabled until the grid
  changes, keyboard focus kept; painting keeps the count line; solve → result panel, stats, the
  follow link, exact share text (Web Share and clipboard stubs, including a cancelled share).
- 3 failed attempts → solution revealed, X/3.
- Reload mid-puzzle restores state; a finished puzzle stays finished; midnight while open; next day
  (`page.clock`) → new puzzle and updated streak; after the pool's last level, the first again; a
  special date's level; catching up a missed puzzle joins the streak, leaving it keeps its drawing,
  and a puzzle older than a week isn't offered; the list of missed puzzles stays current across
  midnights.
- At 320×568, tapping a missed puzzle or the tutorial's Next shows the new screen from the top.
- The install dialog: at the end of a first tutorial, also past midnight; its iOS steps, and none in
  an in-app browser; from the info panel, with the focus kept on a control still there.
- Offline reload after the first visit (Chromium only); the precache leaves `og.png` out.
- 320 px wide: no horizontal scroll, every control reachable; a 12-line, 36-column level at 320×568
  keeps the grid at least 250 px wide. On every device, the grid spans the column, even for the
  longest level.
- Submit's hover and pressed states (with a mouse).
- A two-line status and the result panel (solved, and failed at 320 px) leave the grid exactly where
  and as large as it was, also with the classic scrollbars of desktop Chrome, which appear with the
  result (reserved in windows from 495 px wide, where they never narrow the column).
- Confetti on a solve (daily and tutorial), gone after a few seconds and never in the way of the
  next tap; none on a failure or with reduced motion.
- No console errors, no request to the analytics hosts.

## CI/CD — `.github/workflows/ci.yml`

- Triggers: pull requests and pushes to `main`. All jobs run on a pinned `ubuntu-26.04` (same gcc as
  local).
- `check`: pinned Deno, cached deps, `deno task check`, `deno task levels:check` against the
  deployed commit's levels (see Levels).
- `build`: a single build, with the base path and site URL from the Pages configuration.
- `e2e` (needs `build`): pinned Node LTS and Deno, npm cache, browsers installed fresh each run
  (Playwright advises against caching them), tests that exact build; HTML report uploaded as an
  artifact on failure.
- `deploy` (needs `check` and `e2e`, pushes to `main` only): deploys the exact artifact that passed
  e2e to GitHub Pages.
- Least-privilege permissions per job, a concurrency group for Pages on `deploy`, current major
  versions of the official actions (check their READMEs).
- One-time setup before M9: the repo must be public (GitHub Free only serves Pages from public
  repos), Pages source set to "GitHub Actions", and the `VITE_UMAMI_WEBSITE_ID` repository variable.

## Out of scope for v1

Accounts, backend, leaderboards, global stats, hints, an archive beyond the past week, push
notifications, newsletter form, i18n, light theme, sound.

## Milestones

1. Skeleton: `deno.json` tasks, Vite 8 run by Deno (with `server.forwardConsole`), strict TS, fmt
   and lint config, CI `check` job, Playwright harness with a smoke test.
2. Level pipeline, seed levels, tests, README (setup on Kubuntu/Ubuntu, where
   `sudo apt install build-essential` brings gcc and the UBSan runtime; how to add a level).
3. Core logic and tests.
4. UI from `design/`: rendering, palette, grid, painting, keyboard.
5. Daily flow: submit, attempts, result panel, stats, share, persistence, dates.
6. Tutorial.
7. PWA: manifest, icons, service worker, offline.
8. Analytics.
9. `build`, `e2e` and `deploy` jobs; e2e hardening.

Every milestone from 1 on adds the e2e specs for what it builds. Commit after each milestone, on
`main`, never pushed. Stop and ask only when the spec is ambiguous or a decision is expensive to
reverse. If running Vite under Deno causes real trouble, tell me instead of working around it
silently.
