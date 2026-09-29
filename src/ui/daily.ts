import { completionEvent, isTracking, track } from "../analytics.ts";
import { ATTEMPTS, LAUNCH_DATE } from "../core/config.ts";
import type { CalendarDate } from "../core/date.ts";
import { canSubmit, lastWrongCount, nextAttempt } from "../core/game.ts";
import { gridFromRows } from "../core/grid.ts";
import { dailyPlay, isFinished, paintDaily, setShowDigits, submitDaily } from "../core/player.ts";
import { puzzleNumber } from "../core/schedule.ts";
import { recordShare } from "../core/sent.ts";
import { shareText } from "../core/share.ts";
import { computeStats } from "../core/stats.ts";
import type { PlayerState } from "../core/storage.ts";
import type { Level } from "../levels/types.ts";
import { formatCountdown, msUntilNextDay } from "./clock.ts";
import { installButton } from "./install-dialog.ts";
import { showPuzzleView } from "./puzzle-view.ts";
import { replayButton } from "./replay.ts";
import { createResultPanel, type Shown } from "./result-panel.ts";
import type { Screen } from "./screen.ts";
import { shareResult } from "./share.ts";
import type { Store } from "./storage.ts";
import type { Toast } from "./toast.ts";

export interface DailyOptions {
  readonly store: Store;
  readonly number: number;
  readonly level: Level;
  /** Whether the bundle has puzzle #n's level: no countdown to a puzzle that won't come. */
  hasLevel(n: number): boolean;
  readonly siteUrl: string;
  readonly toast: Toast;
  onReplayTutorial(): void;
}

export function showDaily(root: HTMLElement, options: DailyOptions): Screen {
  const { store, number: n, toast } = options;
  const solution = gridFromRows(options.level.solution);
  let shown: Shown = "solution";
  // The date the app last reported: today's number may be past n after midnight.
  let lastToday: CalendarDate | undefined;

  const view = showPuzzleView(root, {
    label: `#${n}`,
    fileName: `daily_${String(n).padStart(4, "0")}.c`,
    code: options.level.code,
    attempts: `You have ${ATTEMPTS} attempts.`,
    infoActions: [replayButton(options.onReplayTutorial), installButton()],
    // Every action applies to freshly read storage: another tab may have played meanwhile.
    onPaint: (index, color) => save(paintDaily(store.read(), n, solution, index, color)),
    onSubmit() {
      const before = store.read();
      const after = submitDaily(before, n, solution);
      save(after);
      const outcome = after.results[n];
      if (isFinished(before, n) || outcome === undefined) return;
      if (outcome !== "X") view.celebrate();
      updateNext(new Date());
      result.focus();
      // Without persistent storage a reload could replay and count the puzzle again.
      if (store.persistent()) track(completionEvent(outcome));
    },
    onShowDigits: (on) => save(setShowDigits(store.read(), on)),
  });

  const result = createResultPanel({
    onShare() {
      const play = dailyPlay(store.read(), n, solution);
      const text = shareText(n, play.submissions, play.solution, options.siteUrl);
      shareResult(text).then((outcome) => {
        if (outcome === "copied") toast.show("Copied");
        else if (outcome === "failed") result.showManualCopy(text);
        if (outcome === "shared" || outcome === "copied") countShare();
      });
    },
    onShow(value) {
      shown = value;
      render(store.read());
    },
    onPlayNext: () => location.reload(),
  });

  /** One share event per puzzle, however many times the player shares. */
  let shareQueued = false;
  function countShare() {
    if (!isTracking() || !store.persistent() || shareQueued) return;
    const state = store.read();
    if (recordShare(state, n) === state) return;
    shareQueued = true;
    track("share", () => store.write(recordShare(store.read(), n)));
  }

  function save(state: PlayerState) {
    store.write(state);
    render(state);
  }

  function render(state: PlayerState) {
    const play = dailyPlay(state, n, solution);
    const outcome = state.results[n];
    if (outcome === undefined) {
      view.render(play.drawing, { editable: true, showDigits: state.showDigits });
      const wrong = lastWrongCount(play);
      const submittable = canSubmit(play);
      view.setStatus(
        wrong === undefined ? [] : [
          `${wrong} wrong · attempt ${nextAttempt(play)}/${ATTEMPTS}`,
          ...(submittable ? [] : ["Change a cell to submit again"]),
        ],
      );
      view.setSubmit("Submit", submittable);
      view.setGridName("Your drawing");
      view.showResult(undefined);
      return;
    }
    // A failed puzzle shows the solution by default; a toggle shows the last drawing instead.
    const last = play.submissions.at(-1);
    const toggle = outcome === "X" && last ? shown : undefined;
    // play.solution, not the bundle's: a level edited after the fact doesn't rewrite history.
    const drawing = toggle === "drawing" && last;
    view.render(drawing ? last : play.solution, { editable: false, showDigits: state.showDigits });
    view.setGridName(drawing ? "Your last drawing" : "The solution");
    result.render({
      result: outcome,
      stats: computeStats(state.results, todayNumber()),
      shown: toggle,
      canShare: play.submissions.length > 0,
    });
    view.showResult(result);
  }

  function todayNumber(): number {
    return lastToday ? Math.max(n, puzzleNumber(LAUNCH_DATE, lastToday)) : n;
  }

  function updateNext(now: Date) {
    const current = todayNumber();
    if (current > n) {
      result.setNext(
        options.hasLevel(current) ? { kind: "play", number: current } : { kind: "none" },
      );
    } else if (options.hasLevel(n + 1)) {
      result.setNext({ kind: "countdown", text: formatCountdown(msUntilNextDay(now)) });
    } else result.setNext({ kind: "none" });
  }

  render(store.read());
  return {
    tick(now, today) {
      lastToday = today;
      if (isFinished(store.read(), n)) updateNext(now);
    },
    refresh: () => render(store.read()),
    destroy: () => view.destroy(),
    focus: () => (isFinished(store.read(), n) ? result.focus() : view.focusSubmit()),
  };
}
