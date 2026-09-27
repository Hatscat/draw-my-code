import assert from "node:assert/strict";
import { INITIAL_STATE, type PlayerState } from "./storage.ts";
import { skipTutorial, tutorialLevelToShow, tutorialSolved } from "./tutorial.ts";

const at = (next: number, done = false): PlayerState => ({
  ...INITIAL_STATE,
  tutorial: { done, next },
});

Deno.test("a first visit starts the tutorial at level 1", () => {
  assert.equal(tutorialLevelToShow(INITIAL_STATE, 5), 1);
});

Deno.test("solving a level makes a reload resume at the next one", () => {
  const state = tutorialSolved(INITIAL_STATE, 1, 5);
  assert.deepEqual(state.tutorial, { done: false, next: 2 });
  assert.equal(tutorialLevelToShow(state, 5), 2);
});

Deno.test("solving the last level completes the tutorial", () => {
  const state = tutorialSolved(at(5), 5, 5);
  assert.deepEqual(state.tutorial, { done: true, next: 1 });
  assert.equal(tutorialLevelToShow(state, 5), undefined);
});

Deno.test("skipping completes the tutorial from anywhere", () => {
  assert.equal(skipTutorial(at(3)).tutorial.done, true);
  assert.equal(tutorialLevelToShow(skipTutorial(INITIAL_STATE), 5), undefined);
});

Deno.test("a finished tutorial is left alone: replays don't change it", () => {
  const done = at(1, true);
  assert.equal(tutorialSolved(done, 2, 5), done);
  assert.equal(skipTutorial(done), done);
});

Deno.test("progress never goes backwards", () => {
  assert.deepEqual(tutorialSolved(at(4), 2, 5).tutorial, {
    done: false,
    next: 4,
  });
});

Deno.test("a stored level beyond the tutorial's length resumes at its last level", () => {
  assert.equal(tutorialLevelToShow(at(9), 5), 5);
  assert.equal(tutorialLevelToShow(INITIAL_STATE, 0), undefined);
});
