/**
 * The player's saved state: one versioned JSON value under one localStorage key. Core only parses
 * and serializes it; src/ui reads and writes localStorage.
 */

import { ATTEMPTS } from "./config.ts";
import { type Grid, gridFromString, gridToString } from "./grid.ts";
import { type Marks, marksFromString, marksToString, noMarks } from "./marks.ts";
import { isResult, type Results } from "./stats.ts";

/** Namespaced: other games may share the site's origin. */
export const STORAGE_KEY = "draw-my-code";
export const STATE_VERSION = 2;

/** A daily's play, kept so a reload restores it and the share text can be rebuilt. */
export interface StoredPlay {
  /** The solution it was judged against: if the bundle's differs, the level was edited. */
  readonly solution: Grid;
  readonly drawing: Grid;
  /** The player's dots, on cells painted 0. */
  readonly marks: Marks;
  readonly submissions: readonly Grid[];
}

/** Analytics already sent, so that no event goes out more often than the budget allows. */
export interface Sent {
  /** Local date (YYYY-MM-DD) of the last pageview; empty before the first one. */
  readonly pageview: string;
  /** Puzzles already shared. */
  readonly shared: readonly number[];
  readonly tutorialComplete: boolean;
}

export interface PlayerState {
  /** `next`: the tutorial level (from 1) a reload resumes at. */
  readonly tutorial: { readonly done: boolean; readonly next: number };
  readonly results: Results;
  /** By puzzle number, while the puzzle is open: today's and the past week's. */
  readonly plays: Readonly<Record<number, StoredPlay>>;
  readonly sent: Sent;
  readonly showDigits: boolean;
}

export const INITIAL_STATE: PlayerState = {
  tutorial: { done: false, next: 1 },
  results: {},
  plays: {},
  sent: { pageview: "", shared: [], tutorialComplete: false },
  showDigits: false,
};

export interface Loaded {
  readonly state: PlayerState;
  /** False when a newer version wrote the data: play in memory and never overwrite it. */
  readonly writable: boolean;
}

/**
 * Reads the stored value. Missing or unreadable data gives the initial state; a damaged field
 * falls back to its default without losing the others. Never throws.
 */
export function loadState(raw: string | null): Loaded {
  const data = parseJson(raw);
  if (!isRecord(data) || !Number.isInteger(data.v)) return { state: INITIAL_STATE, writable: true };
  if ((data.v as number) > STATE_VERSION) {
    // Someone who has newer data isn't a first-time player: don't show them the tutorial.
    return { state: { ...INITIAL_STATE, tutorial: { done: true, next: 1 } }, writable: false };
  }
  // Version 1 had no dots: its plays load with none, and the next write saves version 2.
  if (data.v !== STATE_VERSION && data.v !== 1) return { state: INITIAL_STATE, writable: true };
  return {
    state: {
      tutorial: readTutorial(data.tutorial),
      results: readRecord(data.results, (value) => (isResult(value) ? value : undefined)),
      plays: readRecord(data.plays, readPlay),
      sent: readSent(data.sent),
      showDigits: typeof data.showDigits === "boolean" ? data.showDigits : false,
    },
    writable: true,
  };
}

export function serializeState(state: PlayerState): string {
  const plays = Object.fromEntries(
    Object.entries(state.plays).map(([n, play]) => [n, {
      solution: gridToString(play.solution),
      drawing: gridToString(play.drawing),
      marks: marksToString(play.marks),
      submissions: play.submissions.map(gridToString),
    }]),
  );
  return JSON.stringify({ v: STATE_VERSION, ...state, plays });
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPuzzleNumber(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1;
}

/** Keeps the entries whose key is a puzzle number and whose value reads back. */
function readRecord<T>(value: unknown, read: (item: unknown) => T | undefined): Record<number, T> {
  if (!isRecord(value)) return {};
  const entries: [number, T][] = [];
  for (const [key, item] of Object.entries(value)) {
    const n = Number(key);
    const parsed = read(item);
    if (isPuzzleNumber(n) && String(n) === key && parsed !== undefined) entries.push([n, parsed]);
  }
  return Object.fromEntries(entries);
}

function readTutorial(value: unknown): PlayerState["tutorial"] {
  if (isRecord(value) && typeof value.done === "boolean" && isPuzzleNumber(value.next)) {
    return { done: value.done, next: value.next };
  }
  return INITIAL_STATE.tutorial;
}

function readPlay(value: unknown): StoredPlay | undefined {
  if (!isRecord(value) || !Array.isArray(value.submissions)) return undefined;
  if (value.submissions.length > ATTEMPTS) return undefined;
  const grid = (text: unknown) => (typeof text === "string" ? gridFromString(text) : undefined);
  const solution = grid(value.solution);
  const drawing = grid(value.drawing);
  const submissions = value.submissions.map(grid);
  if (!solution || !drawing) return undefined;
  if (!submissions.every((submitted): submitted is Grid => submitted !== undefined)) {
    return undefined;
  }
  // Dots are read on their own: missing (version 1) or bad ones cost the play nothing, and a dot
  // only ever sits on a 0.
  const read = typeof value.marks === "string" ? marksFromString(value.marks) : undefined;
  const marks = read ? read.map((mark, i) => mark && drawing[i] === 0) : noMarks();
  return { solution, drawing, marks, submissions };
}

function readSent(value: unknown): Sent {
  if (!isRecord(value)) return INITIAL_STATE.sent;
  return {
    pageview: typeof value.pageview === "string" && /^(\d{4}-\d{2}-\d{2})?$/.test(value.pageview)
      ? value.pageview
      : "",
    shared: Array.isArray(value.shared) ? value.shared.filter(isPuzzleNumber) : [],
    tutorialComplete: value.tutorialComplete === true,
  };
}
