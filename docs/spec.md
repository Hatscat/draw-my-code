# Draw my code — v1 spec

## Goal

A polished, free daily puzzle that doubles as a showcase and builds an audience for my future games.
No ads, no accounts, no backend. English only.

## Core loop

1. Every day at local midnight a new puzzle #N unlocks: same puzzle for everyone on a given local
   date, like Wordle. Puzzle #1 is `LAUNCH_DATE`.
2. The player reads `int f(int x, int y)`, picks colors and paints the 8×8 grid.
3. The grid starts filled with 0, so Submit is always available: a sparse level can be solved in a
   single tap. Wrong cells get marked. 3 attempts.
4. Solved or out of attempts: the puzzle is over, the result panel appears, the player shares.

## Rules

- Grid 8×8. Origin top-left, x grows right, y grows down, x and y in [0, 7].
- Palette: 0 black, 1 white, 2 red, 3 orange, 4 yellow, 5 green, 6 blue, 7 purple. With 0 black and
  1 white, C booleans draw white on black, like a 1-bit screen.
- No empty state: every cell always holds a value in [0, 7], starting at 0.
- 3 attempts per daily puzzle (`ATTEMPTS` in config). After a wrong submit, wrong cells are marked
  (× and inner outline, as in `design/`) and a line above Submit shows `N wrong · attempt 2/3`.
  Painting a cell clears the marks.
- A finished puzzle can't be replayed. Reloading restores both in-progress and finished states.
- Levels have no title: the puzzle number is their only name.

Config lives in `src/core/config.ts`: `LAUNCH_DATE` (placeholder, I'll set it), `ATTEMPTS`,
`FOLLOW_URL` (optional).

## Tutorial

- 5 levels, shown automatically on the first visit, skippable, replayable from a "?" button.
- Unlimited attempts, no stats, no share. Analytics: only `tutorial_complete`, once.

## Result panel

- Solved: "Solved in N/3". Failed: "X/3", plus a toggle between the player's last drawing and the
  solution.
- Stats (played, win %, current streak, max streak, distribution 1/2/3/X).
- Share button, countdown to the next puzzle, optional follow link (hidden when `FOLLOW_URL` is
  empty).

## Share

Text that never reveals the solution's colors:

```
Draw my code #12 2/3
🟩🟩🟩🟨🟨🟩🟩🟩
…(8 rows of 8)
https://<site URL>
```

Per cell: 🟩 correct from attempt 1 on, 🟨 from attempt 2 on, 🟧 from attempt 3 on, ⬛ still wrong at
the end. "Correct from attempt k on" = correct in attempt k and in every later attempt.

Touch devices (`pointer: coarse`) with `navigator.share`: Web Share API. Otherwise: clipboard and a
"Copied" toast.

## Stats and streaks

Stored locally as per-puzzle results (attempt count or failed); played, win %, streaks and
distribution are derived from them. A streak counts consecutive puzzle numbers solved; a failed or
missed puzzle resets the current streak.

## Dates

- Puzzle number = calendar days between `LAUNCH_DATE` and the player's local date, + 1. Computed from
  `{ y, m, d }` only: no timestamps, no DST bugs.
- No level for today (schedule ran out): friendly "No puzzle today, come back tomorrow" state.
- Before `LAUNCH_DATE`: tutorial, then "First puzzle on <date>".
- Dev builds only: `?date=YYYY-MM-DD` overrides today.

## UI

Follow `design/`. What was designed:

- Single centered column: header, code panel, instruction "Draw the output in each cell", 8 numbered
  swatches, 8×8 grid with axis labels 0–7, Submit button.
- Selected swatch: light outline, slightly larger, bold number.
- The screenshot predates two changes: 0 is now black and 1 white, and there is no empty-cell state.
  Black cells must stay clearly visible against the dark page: keep crisp grid lines.
- Keys 0–7 select a color. On desktop, hovering a cell shows `f(x, y)` for it and highlights both
  axis labels.
- On short screens the grid shrinks to fit one screen, never below 250 px wide.

Additions:

- Header right: `#N` for the daily, `Tutorial 2/5` in the tutorial; a "?" button. Code panel label:
  `daily_0012.c` / `tutorial_2.c`.
- Keyboard on the grid: roving focus, arrows move, Space/Enter paints with the selected color.
- Code font scales so the longest line fits without horizontal scroll, never below 11 px.
- Syntax highlighting with a tiny hand-written tokenizer (keywords, types, numbers, operators,
  identifiers, comments). No library.
- Fonts: self-hosted woff2 subset or a system monospace stack, precached. No font CDN.
- Dark theme only in v1.

## Levels

Sources:

- `levels/tutorial/01-return-x.c` … `05-*.c`
- `levels/daily/0001.c`, `0002.c`, … contiguous; puzzle #N is `daily/NNNN.c`.

Format: the file is exactly what players see, byte for byte: the function, 2-space indentation.
Comments are allowed and shown to players, so they can serve as hints.

```c
int f(int x, int y) {
  int dx = x - 4, dy = y - 4;
  return dx*dx + dy*dy < 9 ? 2 : 0;
}
```

Generator `tools/levels.ts` (`deno task levels`):

1. Compile `tools/harness.c` with the level using
   `gcc -std=c11 -O1 -Wall -Wextra -Werror -Wno-unused-parameter -fsanitize=undefined -fno-sanitize-recover=all -include tools/prelude.h`.
   The harness prints the 64 values, row by row.
2. Reject with a clear message: compile error or warning, UB at runtime, value outside [0, 7],
   numbering gap, more than 12 lines or 36 columns (the code must fit a 320 px screen).
3. Write `src/levels/generated.ts`, deterministic and `deno fmt`-clean: `id`, `code`, and
   `solution` as 8 strings of 8 digits, one per row, so the drawing is readable in diffs.
4. Print every new or changed level: its code next to an ANSI truecolor preview of the grid, then
   `Daily puzzles scheduled until YYYY-MM-DD (N days left)`.

`--check` regenerates in memory and fails if the file differs; it warns when fewer than 7 days remain.

Seed content:

- Tutorial, in this order: `return x == 3 && y == 4;` (one tap: teaches the axes, and that C
  booleans are 0/1) · `return x;` · `return x / 2;` · `return (x + y) % 2;` · `return x > y ? x : y;`
- Daily samples, which I will curate and replace:
  - 0001: the circle above
  - 0002: `return (x & y) == 0 ? 1 : 0;`
  - 0003: `return x ^ y;`
  - 0004–0007: yours, increasing difficulty, varied techniques (distance, modulo, bitwise,
    `abs`/`min`/`max`).

## PWA

- `manifest.webmanifest`: name, short_name, `standalone`, theme and background colors from the design,
  relative `start_url` and `scope`, icons 192/512 plus maskable.
- Icons: pixel art from an 8×8 grid in the palette, generated by `tools/icons.ts` with a minimal PNG
  encoder (CompressionStream + CRC32), committed to `public/icons/`. No image library.
- Service worker, hand-written, no Workbox or PWA plugin. A small custom Vite plugin injects the list
  of built assets and a build hash. Precache the app shell on install, cache-first for hashed assets,
  network-first with cache fallback for navigations, delete old caches on activate. A new version
  takes over on the next load, with no update prompt.
- Fully playable offline after the first visit (levels ship in the bundle).
- Base path and site URL come from the GitHub Pages configuration at build time, never hard-coded, so
  a custom domain later needs no code change. The site URL is used in the share text and in the
  analytics host check.

## Analytics — Umami Cloud (Hobby plan)

- `src/analytics.ts` injects the Umami script only when it's a production build, on the production
  host, and `VITE_UMAMI_WEBSITE_ID` is set (GitHub Actions repository variable). Also set
  `data-domains`.
- Events: automatic pageview · `puzzle_complete` with a single property `attempts` (1, 2, 3 or X) ·
  `share` · `tutorial_complete` (once per player). Nothing else.
- Typed no-op when the script isn't loaded. No cookie banner in v1.

## Tests

Unit (`deno test`):

- core: puzzle number (month and year boundaries, leap years, DST dates), grid diff, attempt state
  machine, share text (exact), stats and streaks (missed day, failed day), storage load, migration and
  corrupted data.
- tools: every rejection case with fixtures (out of range, UB overflow, compile
  error, numbering gap, line too long); deterministic output.
- highlighter tokenizer.

E2E (Playwright; projects: Desktop Chrome, Pixel 7, iPhone 14 on WebKit):

- First visit → tutorial → skip → daily puzzle.
- Painting: tap, drag (mouse, and touch via pointer events with `pointerType: "touch"`), keyboard,
  keys 0–7.
- Wrong submit → marks and count; painting clears marks; solve → result panel, stats, exact share
  text.
- 3 failed attempts → solution revealed, X/3.
- Reload mid-puzzle restores state; a finished puzzle stays finished; next day (`page.clock`) → new
  puzzle and updated streak; no-puzzle-today state.
- Offline reload after the first visit (Chromium only).
- 320 px wide: no horizontal scroll, every control reachable.
- No console errors, no request to the analytics host.

## CI/CD — `.github/workflows/ci.yml`

- Triggers: pull requests, pushes to `main`, and a weekly schedule (the scheduled run only runs
  `check`).
- `check`: pinned Deno, cached deps, `deno task check`, `deno task levels:check`. Fewer than 7 days
  of puzzles left: warning annotation on normal runs, failure on the scheduled run so GitHub emails
  me.
- `build`: a single build, with the base path and site URL from the Pages configuration.
- `e2e` (needs `build`): Node and Deno, cached Playwright browsers, tests that exact build; HTML report
  uploaded as an artifact on failure.
- `deploy` (needs `e2e`, pushes to `main` only): deploys the exact artifact that passed e2e to GitHub
  Pages.
- Least-privilege permissions per job, a concurrency group for Pages, current major versions of the
  official actions (check their READMEs).

## Out of scope for v1

Accounts, backend, leaderboards, global stats, hints, puzzle archive, push notifications, newsletter
form, i18n, light theme, sound.

## Milestones

1. Skeleton: `deno.json` tasks, Vite 8 run by Deno (with `server.forwardConsole`), strict TS, fmt and
   lint config, CI `check` job.
2. Level pipeline, seed levels, tests, README (setup on Kubuntu/Ubuntu, where
   `sudo apt install build-essential` brings gcc and the UBSan runtime; how to add a level).
3. Core logic and tests.
4. UI from `design/`: rendering, palette, grid, painting, keyboard.
5. Daily flow: submit, attempts, result panel, stats, share, persistence, dates.
6. Tutorial.
7. PWA: manifest, icons, service worker, offline.
8. Analytics.
9. E2E suite; `build`, `e2e` and `deploy` jobs.

Commit after each milestone. Stop and ask only when the spec is ambiguous or a decision is expensive
to reverse. If running Vite under Deno causes real trouble, tell me instead of working around it
silently.
