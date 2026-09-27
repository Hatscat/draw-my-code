# Draw my code

Daily puzzle web game (PWA). The player reads a tiny C function `int f(int x, int y)` and paints its
output on an 8×8 grid, one palette color (0–7) per cell. Static site on GitHub Pages: no backend, no
accounts, no cookies.

- Product spec: `docs/spec.md`. Read it before touching gameplay, UI, levels or CI.
- Visual reference: `design/`. It is the source of truth for look and layout.

## Commands

| Command                  | Purpose                                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `deno task dev`          | Vite dev server; the browser console is forwarded to the terminal       |
| `deno task check`        | fmt check + lint + type-check + unit tests. Run before every commit     |
| `deno task test`         | Unit tests only (`src/**/*.test.ts`, `tools/**/*.test.ts`)              |
| `deno task levels`       | Compile levels with gcc, validate, regenerate `src/levels/generated.ts` |
| `deno task levels:check` | Fail if `generated.ts` is stale or any level is invalid (CI)            |
| `deno task icons`        | Regenerate the PWA icons in `public/icons/`                             |
| `deno task build`        | Production build to `dist/`                                             |
| `deno task preview`      | Serve `dist/`                                                           |
| `deno task e2e`          | Build, then run Playwright (Node) from `e2e/`                           |
| `deno task e2e:run`      | Run Playwright against the existing `dist/` (what CI does)              |

One unit test file: `deno task test <file>` (plain `deno test` lacks the permissions). One e2e spec:
`deno task e2e <spec>`. `check`, `test` and `levels` need gcc and the UBSan runtime. Format with a
bare `deno fmt` from the root: given a path under `e2e/`, it picks up `e2e/package.json` instead of
`deno.json` and formats at 80 columns.

## Layout

```
src/core/         Pure game logic. Zero DOM, zero dependencies, fully unit-tested.
src/ui/           Rendering and input. No game rules.
src/levels/       generated.ts (never edit by hand) + level types.
src/analytics.ts  The only module that talks to Umami.
src/sw.ts         Service worker (WebWorker lib, type-checked separately).
src/fonts/        JetBrains Mono subset + OFL license
levels/           Level sources: tutorial/NN-name.c, daily/NNNN.c
tools/            Level generator, harness.c, prelude.h, icons, lint plugin, SW Vite plugin (Deno)
e2e/              Playwright specs, own package.json (Node)
design/           UI reference from Claude Design
docs/spec.md      Product spec
```

## Hard rules

### Dependencies

- Zero runtime dependencies. Native Web APIs only.
- Allowed dev dependencies: `vite` (root); `@playwright/test` and `typescript` (in `e2e/` only).
  Anything else: ask me first, with the reason and the cost. Built-in `node:` modules (e.g.
  `node:assert/strict` for unit tests) are not dependencies.
- Deno runs everything except Playwright, which runs on Node.

### Code

- TypeScript strict. No `any`; no `@ts-ignore`, `@ts-expect-error` or `@ts-nocheck`; a `!` only
  behind `// deno-lint-ignore no-non-null-assertion -- <why it is safe>`. `deno lint` enforces all
  three, e2e/ included.
- `src/core/` never touches the DOM, `window`, `localStorage`, `import.meta.env`, `Date.now()` or
  randomness, and never imports from `src/ui/`. Time enters core as calendar dates `{ y, m, d }`,
  never as timestamps. Its lib config (no DOM) and the lint plugin in `tools/` enforce this.
- `src/ui/` holds no rules: it calls core and renders the result.
- Every grid cell always holds a value in [0, 7] and starts at 0 (black). There is no empty state:
  no `null`, no `undefined`, no sentinel.
- Small modules with explicit names. Functions over classes. No abstraction without a second use
  case.
- Comments explain why, not what.

### Levels

- gcc is the source of truth. Never hand-write or edit a solution, never evaluate C in TypeScript.
- Never edit `src/levels/generated.ts`: change `levels/` or `tools/`, then run `deno task levels`.
- Every level returns a value in [0, 7] for all 64 cells, has no undefined behavior (UBSan), and
  uses nothing but `abs`, `min`, `max` from `tools/prelude.h`. The generator enforces all of this.
- Players see the level file byte for byte, comments included. Levels have no title, only a number.

### Player data and privacy

- Player state lives in one versioned localStorage key. Schema change = migration + test. Corrupted
  data resets cleanly; data from a newer version is played in memory and never overwritten. Storage
  problems never crash the game.
- Analytics: Umami, only through `src/analytics.ts`, only in production builds on the production
  host. Nothing identifying, ever. Every event and every event property counts against a 100K/month
  quota: stay within 4 events per player per day, so events carry no properties. Analytics failures
  never affect gameplay.

### UI

- Match `design/`. Works from 320 px wide: no horizontal scroll, and painting gestures never scroll
  or zoom the page.
- Pointer Events only. Find the cell under the pointer from coordinates, not `event.target`: touch
  pointers stay captured by the element where the touch started.
- Everything works with the keyboard alone. Never convey state by color alone.
- Respect `prefers-reduced-motion`.

## Testing

- Core: every exported function is tested, edge cases first (calendar boundaries, DST days, streak
  breaks, corrupted storage). Share text is asserted exactly.
- Bug fix = failing test first, then the fix.
- E2E tests user-visible flows only. Control time with `page.clock`; stub `navigator.share` and the
  clipboard with init scripts. No fixed waits, web-first assertions only, zero tolerance for flaky
  tests.
- Local WebKit fails under the VS Code snap (it leaks `GIO_MODULE_DIR`); the Playwright config
  removes that variable for WebKit.

## Definition of done

1. `deno task check` passes; `deno task e2e` passes if UI, flows, PWA or build config changed.
2. No new dependency without my approval.
3. `docs/spec.md` and this file are updated when behavior or conventions change.
4. One small, focused commit with an imperative message. Never push unless asked.

## Working style

- Non-trivial change: a short plan first, then code.
- Prefer deleting code to adding it. If a task grows beyond its scope, stop and ask.
- Tooling moves fast (Vite, Deno, Playwright, GitHub Actions): check current docs rather than
  trusting memory.
- If something in this file or the spec looks wrong, say so instead of working around it.
