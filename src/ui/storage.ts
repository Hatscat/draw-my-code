import {
  INITIAL_STATE,
  loadState,
  type PlayerState,
  serializeState,
  STORAGE_KEY,
} from "../core/storage.ts";

export interface Store {
  /** The saved state, read fresh each time so another tab's changes are seen. */
  read(): PlayerState;
  write(state: PlayerState): void;
  /** Calls `listener` when another tab changes the saved state. */
  onExternalChange(listener: () => void): void;
  /**
   * False once play runs in memory (storage blocked or full, or a newer version's data): nothing
   * survives a reload then, so the analytics dedupe can't work and nothing is sent.
   */
  persistent(): boolean;
}

/**
 * The player's state in localStorage. Falls back to memory, and the game goes on, when storage is
 * blocked or full, or when it holds data from a newer version that must not be overwritten.
 */
/** `storage`: null when the browser blocks site data (the default reads localStorage). */
export function openStore(storage: Storage | null = localStorageOrNull()): Store {
  let memory: PlayerState | undefined = storage ? undefined : INITIAL_STATE;
  // The last state read or written: if a newer version takes over storage mid-game, play goes
  // on from here rather than from a blank state.
  let last: PlayerState = INITIAL_STATE;

  return {
    read() {
      if (memory) return memory;
      try {
        const { state, writable } = loadState(storage?.getItem(STORAGE_KEY) ?? null);
        if (!writable) {
          memory = last === INITIAL_STATE ? state : last;
          return memory;
        }
        last = state;
        return state;
      } catch {
        memory = INITIAL_STATE;
        return memory;
      }
    },
    write(state) {
      last = state;
      if (memory || !storage) {
        memory = state;
        return;
      }
      try {
        storage.setItem(STORAGE_KEY, serializeState(state));
      } catch {
        memory = state;
      }
    },
    persistent: () => memory === undefined,
    onExternalChange(listener) {
      addEventListener("storage", (event) => {
        if (!memory && (event.key === STORAGE_KEY || event.key === null)) listener();
      });
    },
  };
}

function localStorageOrNull(): Storage | null {
  try {
    // Merely reading the property throws when site data is blocked.
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}
