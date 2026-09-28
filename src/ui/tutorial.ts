import {
  canSubmit,
  lastWrongCount,
  paint,
  type Play,
  startPlay,
  status,
  submit,
} from "../core/game.ts";
import { isTracking, track } from "../analytics.ts";
import { gridFromRows } from "../core/grid.ts";
import { setShowDigits } from "../core/player.ts";
import { recordTutorialComplete } from "../core/sent.ts";
import { skipTutorial, tutorialSolved } from "../core/tutorial.ts";
import type { Level } from "../levels/types.ts";
import { el } from "./dom.ts";
import { showPuzzleView } from "./puzzle-view.ts";
import type { Screen } from "./screen.ts";
import type { Store } from "./storage.ts";

export interface TutorialOptions {
  readonly store: Store;
  readonly levels: readonly Level[];
  /** The level to start at, from 1. */
  readonly start: number;
  /** A replay from the info panel never saves progress: the tutorial is already done. */
  readonly replay: boolean;
  /** Called after the last level or Skip. */
  onDone(): void;
}

/** The tutorial: unlimited attempts, no stats, no share. Its drawings are never saved. */
export function showTutorial(
  root: HTMLElement,
  options: TutorialOptions,
): Screen {
  const { store, levels } = options;
  let index = Math.min(Math.max(options.start, 1), levels.length) - 1;
  let view = showLevel();

  function showLevel() {
    const level = levels[index];
    if (!level) throw new Error(`no tutorial level ${index + 1}`);
    const number = index + 1;
    let play: Play = startPlay(gridFromRows(level.solution), Infinity);

    const skip = el(
      "button",
      { type: "button", class: "text-button skip" },
      "Skip tutorial",
    );
    skip.addEventListener("click", () => {
      if (!options.replay) store.write(skipTutorial(store.read()));
      options.onDone();
    });

    const levelView = showPuzzleView(root, {
      label: `Tutorial ${number}/${levels.length}`,
      fileName: `tutorial_${number}.c`,
      code: level.code,
      attempts: "Unlimited attempts.",
      footerActions: [skip],
      onPaint(cell, color) {
        play = paint(play, cell, color);
        render();
      },
      onSubmit() {
        if (status(play) === "solved") {
          next();
          return;
        }
        play = submit(play);
        const solved = status(play) === "solved";
        if (solved && !options.replay) {
          store.write(tutorialSolved(store.read(), number, levels.length));
        }
        if (solved && number === levels.length) countCompletion();
        render();
        if (solved) levelView.celebrate();
        levelView.focusSubmit();
      },
      onShowDigits(on) {
        store.write(setShowDigits(store.read(), on));
        render();
      },
    });

    function render() {
      const solved = status(play) === "solved";
      levelView.render(play.drawing, {
        editable: !solved,
        showDigits: store.read().showDigits,
      });
      if (solved) {
        levelView.setStatus(["Right!"], "success");
        levelView.setSubmit(number < levels.length ? "Next" : "Done", true);
        return;
      }
      const wrong = lastWrongCount(play);
      const submittable = canSubmit(play);
      levelView.setStatus(
        wrong === undefined ? [] : [
          `${wrong} wrong`,
          ...(submittable ? [] : ["Change a cell to submit again"]),
        ],
      );
      levelView.setSubmit("Submit", submittable);
    }

    render();
    return levelView;
  }

  /** tutorial_complete: the first time the last level is solved, never on Skip. */
  let completionQueued = false;
  function countCompletion() {
    if (!isTracking() || !store.persistent() || completionQueued) return;
    const state = store.read();
    if (recordTutorialComplete(state) === state) return;
    completionQueued = true;
    track("tutorial_complete", () => store.write(recordTutorialComplete(store.read())));
  }

  function next() {
    view.destroy();
    if (index + 1 >= levels.length) {
      options.onDone();
      return;
    }
    index++;
    view = showLevel();
    // The Next button just pressed is gone: the new level's Submit takes its place.
    view.focusSubmit();
  }

  return {
    tick() {},
    refresh() {},
    destroy: () => view.destroy(),
    focus: () => view.focusSubmit(),
  };
}
