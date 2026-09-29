# Draw my code

A free daily puzzle: read a tiny C function `int f(int x, int y)` and paint its output on an 8×8
grid. Product spec: [docs/spec.md](docs/spec.md). Conventions: [CLAUDE.md](CLAUDE.md).

## Setup on Ubuntu or Kubuntu

```sh
sudo apt install build-essential curl        # gcc, nm, the UBSan runtime; curl for the installer
curl -fsSL https://deno.land/install.sh | sh # Deno 2.9 or later (CI pins 2.9.7)
export PATH="$HOME/.deno/bin:$PATH"          # or open a new terminal
deno install                                 # Vite
```

The level generator and the unit tests compile C, so `deno task check` needs gcc too.

For the end-to-end tests, also install Node.js 22 or later (24 LTS recommended), then:

```sh
cd e2e
npm ci
npx playwright install --with-deps --no-shell chromium webkit
```

## Everyday commands

| Command            | What it does                                                     |
| ------------------ | ---------------------------------------------------------------- |
| `deno task dev`    | Dev server; the browser console shows up in the terminal         |
| `deno task editor` | Dev server, opened on the level editor                           |
| `deno task check`  | Formatting, lint, type-check and unit tests: run before a commit |
| `deno task levels` | Compile and validate every level, regenerate the level list      |
| `deno task e2e`    | Production build, then the Playwright tests                      |

In `deno task dev`, add `?date=YYYY-MM-DD` to the URL to pretend today is another day. Production
builds ignore it.

## Adding a level

The daily levels are one pool, `levels/daily/`, that loops forever: after the last level comes the
first again, so the game never runs out. In the first loop, puzzle #N (on `LAUNCH_DATE` plus N − 1
days, at local midnight) shows `levels/daily/NNNN.c`. A level for a date that comes back every year,
a holiday say, goes in `levels/special/MM-DD-name.c` instead (e.g. `10-31-halloween.c`): it replaces
the pool's level on that date.

1. Create `levels/daily/NNNN.c` with the next number (`0085.c` after `0084.c`, no gaps), or a
   special.
2. Write the function exactly as players will see it:

   ```c
   // Hint: rings around (4, 4).
   int f(int x, int y) {
     int dx = abs(x - 4);
     int dy = abs(y - 4);
     return max(dx, dy) % 3 + 2;
   }
   ```

3. Run `deno task levels`. It compiles the level with gcc three times under UBSan (`-O1`, then `-O0`
   with locals filled with a pattern, and with zeros, plus gcc's static analyzer), checks the rules
   below, shows the code next to a color preview of its grid, and rewrites
   `src/levels/generated.ts`.
4. Commit the level and `src/levels/generated.ts` together. CI fails if they disagree.

### The level editor

`deno task editor` opens `/src/editor/` on the dev server: pick a level, or `New daily` (the next
number, starting from `return 0;`, which fails the checks until you change it), and edit it. The
page shows what players see and the grid gcc computes, checked again as you type with the same
checks and gcc builds as `deno task levels`, errors included. Hover a cell for its value. `Save`
(Ctrl+S) writes the file; `Update the game` saves, then runs `deno task levels` and shows its
report. Changes made to the file elsewhere, in VS Code say, show up in the page. The editor only
exists on the dev server, which answers its requests only from the page itself: a check compiles and
runs the code.

The rules, all checked by the generator:

- Every cell's value is in [0, 7], and not every cell is 0.
- No undefined behavior (overflow, bad shifts, division by zero), no uninitialized variable (the
  three builds and the analyzer catch the usual slips, not every possible one), no endless loop (2 s
  limit), no crash.
- One function, exactly `int f(int x, int y)`. Integers only: no `float`, `double`, `char`, string
  or character literals. No `#` directives, trigraphs or line continuations, no identifier starting
  with `_`. The only functions available are `abs`, `min` and `max` (from `tools/prelude.h`) and `f`
  itself: no helper functions, no static or global variables (a lookup table is a local
  `int t[8] = {...}`), no variable-length arrays.
- Standard C11 only: gcc rejects its own extensions, such as binary literals (`0b101`, standard only
  since C23: write `0x5` and the binary in a comment) or `x ?: y`.
- At most 12 lines of at most 36 characters, 2-space indentation, printable ASCII, LF line endings,
  no trailing spaces, exactly one final newline. That is what fits a 320 px screen.

Today's puzzle and the past week's are frozen (anywhere: the generator counts in UTC+14): players
can still open them. `deno task levels` refuses to change what they show unless you pass
`--allow-published-edit`. Every other level may change.

Adding levels makes the loop longer. After launch, the generator makes the change start tomorrow,
carrying on from where the loop was, so no day already shown changes.

## Deploying

CI (`.github/workflows/ci.yml`) runs on pull requests and on pushes to `main`: `check`, a build of
the site with the base path and URL from the Pages configuration (so Pages must be set up first),
and the end-to-end tests on that exact build. Pushes to `main` then deploy that build to GitHub
Pages. One-time setup:

1. Make the repository public: GitHub Free serves Pages only from public repositories.
2. Settings > Pages > Source: GitHub Actions.
3. Optional, for analytics: Settings > Secrets and variables > Actions > Variables, add
   `VITE_UMAMI_WEBSITE_ID`. Without it nothing is tracked.
4. Set `LAUNCH_DATE` in `src/core/config.ts` to the first puzzle's date. After launch, don't change
   it (or `ATTEMPTS`): stored results depend on both.

Choose the final domain before launch: player data belongs to the site's origin, so moving to a
custom domain later starts everyone over. The code needs no change for a custom domain.

## Tutorial levels

`levels/tutorial/NN-name.c` (e.g. `01-one-cell.c`), numbered from 01 in play order. Same rules.

## End-to-end tests from VS Code

The VS Code snap leaks `GIO_MODULE_DIR` into its terminals, which breaks Playwright's WebKit. The
Playwright config removes that variable for WebKit, so `deno task e2e` works from any terminal.
