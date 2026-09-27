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

- 5 levels, shown automatically until finished or skipped (a `Skip tutorial` link). Replayable from
  the info panel.
- Unlimited attempts, no stats, no share. After a wrong submit the status line shows `N wrong` (no
  attempt count). After a solve it says `Right!` and Submit becomes `Next` (`Done` on the last
  level), which leads on to the daily (or the pre-launch screen). Keyboard focus follows onto the
  new level.
- A reload resumes at the current tutorial level with a blank grid. A replay starts at 1/5 and never
  touches the daily's state.
- Analytics: only `tutorial_complete`, the first time level 5 is solved (never on skip).

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
- The page may scroll while the panel is open.

## Result panel

- Inline: the result and the failed-puzzle toggle take the place of the instruction and swatches,
  right above the grid, so the toggle's effect is in view; stats, share and the countdown take the
  place of the status line and Submit. The grid stays visible and read-only. The page may scroll
  once the puzzle is over.
- Solved: "Solved in N/3". Failed: "X/3", plus a toggle `Solution` (default) / `Your drawing`. Both
  are shown plain, with no per-cell marks: toggling is how the player compares them.
- Stats (played, win %, current streak, max streak, distribution 1/2/3/X). Distribution bars show
  their counts; today's bar is highlighted by more than color.
- Share button, `Next puzzle in HH:MM:SS` (or `New puzzles are on the way` when the bundle has no
  next level; or a `Play #N` button when the puzzle was finished after midnight and today's level
  exists), optional `Follow for new games` link (hidden when `FOLLOW_URL` is empty).

## Share

Exact text, lines joined by `\n`, no trailing newline:

```
Draw my code #12 2/3
🟩🟩🟩🟨🟨🟩🟩🟩
…(8 rows of 8)
https://hatscat.github.io/draw-my-code/
```

A failed puzzle reads `Draw my code #12 X/3`. The URL is the site URL, with its trailing slash.

Per cell: 🟩 correct from attempt 1 on, 🟨 from attempt 2 on, 🟧 from attempt 3 on, ⬛ still wrong
at the end. "Correct from attempt k on" = correct in attempt k and in every later attempt. The text
never reveals the solution's colors, but it may reveal its shape (a blank first submit followed by a
solve outlines the non-black cells).

Touch devices (`pointer: coarse`) with `navigator.share`: `navigator.share({ text })`, called
directly in the click handler; a cancel does nothing. Otherwise: clipboard and a "Copied" toast. If
both fail, the text is shown in a read-only field to copy by hand.

## Stats and streaks

Stored locally as per-puzzle results (1, 2, 3 or X), never pruned; played, win %, streaks and
distribution are derived from them.

- Played = finished dailies. Win % = floor(100 × solved / played), 0 when nothing was played.
- Current streak: let h be the highest finished puzzle number. If h ≥ today − 1, it is the run of
  consecutive solved numbers ending at h, otherwise 0. So an unplayed today doesn't show 0 all
  morning; a failed or missed puzzle resets it.
- Max streak: the longest run over all results. Results numbered after today (the device clock moved
  back) count for played and max streak, not for the current streak.
- A day without a level (schedule ran out) counts as missed; the CI reminder exists to prevent it.

## Dates

- Puzzle number = calendar days between `LAUNCH_DATE` and the player's local date, + 1. Computed
  from `{ y, m, d }` only: no timestamps, no DST bugs.
- Midnight while the page stays open: the date is re-checked on every countdown tick and whenever
  the app comes back to the foreground. A finished or untouched puzzle then reloads to today's. An
  in-progress puzzle stays until finished, and its result counts for its own number. The tutorial is
  never interrupted: if the day changed meanwhile, its end leads to today's puzzle.
- No level for today (schedule ran out): friendly "No puzzle today. New puzzles are on the way."
  state, with stats if any. When online, it checks once per date for a new version of the site.
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
  stay true. Finished plays are kept for today and yesterday, unfinished ones for a week (one may be
  open in another tab).
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
- The grid is at least 250 px wide. When the content doesn't fit one screen (long levels, short
  screens, open info panel) the page scrolls; painting gestures never scroll or zoom it. Tighter
  spacing below about 700 px of viewport height.

Additions:

- Header right: `#N` for the daily, `Tutorial 2/5` in the tutorial; a "?" button. Code panel label:
  `daily_0012.c` / `tutorial_2.c`.
- Keyboard on the grid: roving focus, arrows, Home/End, Space/Enter paints with the selected color.
  Each cell's accessible name includes its value and color name.
- Code font scales so the longest line fits without horizontal scroll, never below 11 px.
- Syntax highlighting with a tiny hand-written tokenizer (keywords, types, function name, numbers,
  operators, identifiers, comments). No library.
- Font: JetBrains Mono, a variable woff2 subset (ASCII plus `·`, `×`, `∈`) downloaded once from
  Google Fonts and committed with its OFL license, precached; system monospace fallback; ligatures
  off. No font CDN.
- Screens that weren't designed (result panel, tutorial controls, toast, pre-launch and no-puzzle)
  reuse the design's tokens.
- Dark theme only in v1.

## Levels

Sources:

- `levels/tutorial/01-one-cell.c` … `05-max.c` (`NN-name.c`, lowercase name).
- `levels/daily/0001.c`, `0002.c`, … contiguous; puzzle #N is `daily/NNNN.c`.

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
  variable-length arrays. Loops and recursion are allowed.

Generator `tools/levels.ts` (`deno task levels`):

1. Compile `tools/harness.c` with the level three times, using
   `gcc -std=c11 -Wall -Wextra -Werror -Wno-unused-parameter -fsanitize=undefined -fno-sanitize-recover=all -fno-builtin -include tools/prelude.h`
   plus `-O1`; `-O0 -ftrivial-auto-var-init=pattern -fanalyzer`; and
   `-O0 -ftrivial-auto-var-init=zero`. The -O0 builds catch UB that -O1 folds away; the two fills
   and the analyzer catch uninitialized variables in the usual cases; `-fno-builtin` keeps calls to
   library builtins visible. All three runs must print the same 64 values, row by row.
2. Reject with a clear message: file format, forbidden construct (token check, and `nm`: only `f`
   and the prelude's helpers defined, only UBSan handlers and the stack protector undefined),
   compile error or warning, UB at runtime, timeout (2 s), crash (any signal), value outside [0, 7],
   all-0 solution, numbering gap. The harness is not dumpable, so a crashing level leaves no core
   dump.
3. Write `src/levels/generated.ts`, deterministic and `deno fmt`-clean: `tutorial` and `daily` lists
   of `id`, `code`, and `solution` as 8 strings of 8 digits, one per row, so the drawing is readable
   in diffs.
4. Print every new or changed level: its code next to an ANSI truecolor preview of the grid, then
   `Daily puzzles scheduled until YYYY-MM-DD (N days left)`, counted from today in UTC+14 (the first
   time zone to reach a date). Past 50 days left, it reminds that GitHub disables scheduled
   workflows after 60 days without a commit.

`deno task levels` refuses to change or remove a daily whose date has come, unless run with
`--allow-published-edit`. `--check` regenerates in memory and fails if the file differs. With fewer
than 7 days left it warns (a GitHub annotation in CI), and fails with `--strict`.

Seed content:

- Tutorial, in this order: `return x == 3 && y == 4;` (one tap: teaches the axes, and that C
  booleans are 0/1) · `return x;` · `return x / 2;` · `return (x + y) % 2;` ·
  `return x > y ? x : y;`
- Daily samples, which I will curate and replace:
  - 0001: the disc above
  - 0002: `return (x & y) == 0 ? 1 : 0;`
  - 0003: `return x ^ y;`
  - 0004–0007: yours, increasing difficulty, varied techniques (distance, modulo, bitwise,
    `abs`/`min`/`max`).

## PWA

- `manifest.webmanifest`: name, short_name, `standalone`, theme and background colors from the
  design, relative `start_url` and `scope`, `id` "draw-my-code" (an id resolves against the origin,
  so "./" would claim the whole origin), icons 192/512 plus maskable.
- Icons: pixel art from an 8×8 grid in the palette, generated by `tools/icons.ts` with a minimal PNG
  encoder (CompressionStream + CRC32), committed to `public/icons/`. No image library. Also a 32 px
  favicon and an opaque 180 px apple-touch-icon (iOS ignores maskable icons).
- Service worker, hand-written, no Workbox or PWA plugin. A small custom Vite plugin injects the
  list of built assets and a build hash. Precache the app shell on install, cache-first for hashed
  assets, network-first with a timeout and cache fallback for navigations, same-origin GET only.
  Cache names start with `draw-my-code-`; on activate, delete only those old caches (the origin may
  host other games). `skipWaiting` + `clients.claim`: a new version takes over on the next load,
  with no update prompt.
- Fully playable offline after the first visit (levels ship in the bundle).
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
  - `puzzle_complete_1`, `_2`, `_3` or `_x`: when a daily finishes.
  - `share`: once per puzzle, after a successful share or copy.
  - `tutorial_complete`: once per player.
- Dedupe markers are saved only once Umami has the event, so a failed script load doesn't use up the
  day's pageview. Without persistent storage (blocked, full, a newer version's data) nothing is
  sent: the dedupe couldn't survive a reload.
- Nothing else. Typed no-op when the script isn't loaded. No cookie banner in v1.

## Tests

Unit (`deno task test`, assertions from the built-in `node:assert/strict`):

- core: puzzle number (month and year boundaries, leap years, DST dates), grid diff, attempt state
  machine (a wrong submit yields only the wrong count; an unchanged grid can't be resubmitted),
  share text (exact), stats and streaks (missed day, failed day, today unplayed, win % rounding,
  nothing played), storage load, migration, corrupted and newer-version data.
- ui: the local-date and next-midnight helpers, under several time zones; the highlighter tokenizer.
- tools: every rejection case with fixtures (format, forbidden constructs, out of range, UB
  overflow, compile error, timeout, crash, numbering gap, line too long); deterministic output.

E2E (Playwright; projects: Desktop Chrome, Pixel 7, iPhone 14 on WebKit; Chromium runs the full
browser build, whose text metrics match real devices; time zone and locale pinned):

- First visit → tutorial → skip → daily puzzle.
- Painting: tap, drag (mouse, and touch via pointer events with `pointerType: "touch"`), keyboard,
  keys 0–7. Dragging never scrolls the page.
- Wrong submit → count line and no per-cell indication on the grid; Submit disabled until the grid
  changes, keyboard focus kept; painting keeps the count line; solve → result panel, stats, exact
  share text (Web Share and clipboard stubs, including a cancelled share).
- 3 failed attempts → solution revealed, X/3.
- Reload mid-puzzle restores state; a finished puzzle stays finished; midnight while open; next day
  (`page.clock`) → new puzzle and updated streak; no-puzzle-today state.
- Offline reload after the first visit (Chromium only).
- 320 px wide: no horizontal scroll, every control reachable; a 12-line, 36-column level at 320×568
  keeps the grid at least 250 px wide.
- No console errors, no request to the analytics hosts.

## CI/CD — `.github/workflows/ci.yml`

- Triggers: pull requests, pushes to `main`, and a daily schedule (the scheduled run only runs
  `check`). All jobs run on a pinned `ubuntu-26.04` (same gcc as local).
- `check`: pinned Deno, cached deps, `deno task check`, `deno task levels:check` (`--strict` on the
  scheduled run, so fewer than 7 days of puzzles fails and GitHub emails me; a warning annotation
  otherwise).
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

Accounts, backend, leaderboards, global stats, hints, puzzle archive, push notifications, newsletter
form, i18n, light theme, sound.

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
