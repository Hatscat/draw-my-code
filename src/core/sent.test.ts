import assert from "node:assert/strict";
import { recordPageview, recordShare, recordTutorialComplete } from "./sent.ts";
import { INITIAL_STATE } from "./storage.ts";

Deno.test("recordPageview: once per date", () => {
  const first = recordPageview(INITIAL_STATE, "2026-11-01");
  assert.notEqual(first, INITIAL_STATE);
  assert.equal(recordPageview(first, "2026-11-01"), first, "a reload the same day sends nothing");
  const next = recordPageview(first, "2026-11-02");
  assert.equal(next.sent.pageview, "2026-11-02");
});

Deno.test("recordShare: once per puzzle, and the list stays short", () => {
  const shared = recordShare(INITIAL_STATE, 5);
  assert.deepEqual(shared.sent.shared, [5]);
  assert.equal(recordShare(shared, 5), shared, "sharing again sends nothing");
  assert.deepEqual(recordShare(shared, 6).sent.shared, [5, 6]);
  assert.deepEqual(recordShare(shared, 20).sent.shared, [20]);
});

Deno.test("recordTutorialComplete: once per player", () => {
  const done = recordTutorialComplete(INITIAL_STATE);
  assert.equal(done.sent.tutorialComplete, true);
  assert.equal(recordTutorialComplete(done), done);
});
