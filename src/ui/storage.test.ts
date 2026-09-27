import assert from "node:assert/strict";
import { INITIAL_STATE, loadState, serializeState, STORAGE_KEY } from "../core/storage.ts";
import { openStore } from "./storage.ts";

/** An in-memory Storage that can be made to fail, like a full or blocked localStorage. */
function fakeStorage(initial: Record<string, string> = {}, { failWrites = false } = {}) {
  const items = new Map(Object.entries(initial));
  let writes = 0;
  const storage = {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key: string) => items.get(key) ?? null,
    key: (index: number) => [...items.keys()][index] ?? null,
    removeItem: (key: string) => void items.delete(key),
    setItem: (key: string, value: string) => {
      if (failWrites) throw new DOMException("full", "QuotaExceededError");
      writes++;
      items.set(key, value);
    },
  } satisfies Storage;
  return { storage, items, writes: () => writes };
}

const played = { ...INITIAL_STATE, results: { 1: 2 } };

Deno.test("openStore reads and writes the one key", () => {
  const { storage, items } = fakeStorage();
  const store = openStore(storage);
  assert.deepEqual(store.read(), INITIAL_STATE);
  store.write(played);
  assert.deepEqual(loadState(items.get(STORAGE_KEY) ?? null).state, played);
  assert.deepEqual(store.read(), played);
});

Deno.test("without storage (site data blocked) the game plays on in memory", () => {
  const store = openStore(null);
  assert.deepEqual(store.read(), INITIAL_STATE);
  store.write(played);
  assert.deepEqual(store.read(), played);
});

Deno.test("a full storage falls back to memory without losing the move", () => {
  const { storage } = fakeStorage({}, { failWrites: true });
  const store = openStore(storage);
  store.write(played);
  assert.deepEqual(store.read(), played);
});

Deno.test("data from a newer version is never overwritten", () => {
  const newer = JSON.stringify({ v: 99, future: true });
  const { storage, items, writes } = fakeStorage({ [STORAGE_KEY]: newer });
  const store = openStore(storage);
  assert.equal(store.read().tutorial.done, true);
  store.write(played);
  assert.equal(items.get(STORAGE_KEY), newer);
  assert.equal(writes(), 0);
  assert.deepEqual(store.read(), played, "the game goes on in memory");
});

Deno.test("a newer version taking over mid-game keeps the game where it was", () => {
  const { storage, items } = fakeStorage();
  const store = openStore(storage);
  store.write(played);
  items.set(STORAGE_KEY, JSON.stringify({ v: 99 }));
  assert.deepEqual(store.read(), played);
});

Deno.test("corrupted data is left alone until the next real action", () => {
  const { storage, items, writes } = fakeStorage({ [STORAGE_KEY]: "{broken" });
  const store = openStore(storage);
  assert.deepEqual(store.read(), INITIAL_STATE);
  assert.equal(items.get(STORAGE_KEY), "{broken");
  store.write(played);
  assert.equal(writes(), 1);
  assert.equal(items.get(STORAGE_KEY), serializeState(played));
});

Deno.test("persistent: false as soon as play runs in memory", () => {
  assert.equal(openStore(fakeStorage().storage).persistent(), true);
  assert.equal(openStore(null).persistent(), false);

  const full = openStore(fakeStorage({}, { failWrites: true }).storage);
  full.read();
  assert.equal(full.persistent(), true);
  full.write(played);
  assert.equal(full.persistent(), false);

  const newer = openStore(fakeStorage({ [STORAGE_KEY]: JSON.stringify({ v: 99 }) }).storage);
  newer.read();
  assert.equal(newer.persistent(), false);
});
