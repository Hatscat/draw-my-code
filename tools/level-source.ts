/**
 * Checks on a level's source text, before gcc sees it: file names and numbering, the byte-level
 * format players see, and the C constructs a level may use. gcc and nm check the rest.
 */

export type LevelKind = "tutorial" | "daily";

/** Longest line and line count that still fit a 320 px screen at the 11 px minimum code size. */
export const MAX_COLUMNS = 36;
export const MAX_LINES = 12;

const FILE_NAME = {
  tutorial: /^(\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.c$/,
  daily: /^(\d{4})\.c$/,
} as const;

/** Expected file name shape, for error messages. */
export const FILE_NAME_HELP = {
  tutorial: "NN-name.c (e.g. 01-one-cell.c)",
  daily: "NNNN.c (e.g. 0001.c)",
} as const;

/** The level number encoded in a file name, or undefined if the name doesn't follow the pattern. */
export function levelId(kind: LevelKind, fileName: string): number | undefined {
  const match = FILE_NAME[kind].exec(fileName);
  if (!match) return undefined;
  const id = Number(match[1]);
  return id >= 1 ? id : undefined;
}

export function formatId(kind: LevelKind, id: number): string {
  return String(id).padStart(kind === "daily" ? 4 : 2, "0");
}

/** Levels must be numbered 1, 2, 3… with no gap and no duplicate. */
export function numberingErrors(kind: LevelKind, ids: readonly number[]): string[] {
  const errors: string[] = [];
  const seen = new Set<number>();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`two files are numbered ${formatId(kind, id)}`);
    seen.add(id);
  }
  const highest = Math.max(0, ...seen);
  for (let id = 1; id <= highest; id++) {
    if (!seen.has(id)) {
      errors.push(`${formatId(kind, id)} is missing: levels are numbered from 1 with no gap`);
    }
  }
  return errors;
}

/** What players see: the file without its final newline. */
export function displayCode(source: string): string {
  return source.endsWith("\n") ? source.slice(0, -1) : source;
}

/** Every format and construct problem in a level file, as "line N: …" messages. */
export function sourceErrors(source: string): string[] {
  const formatProblems = formatErrors(source);
  // Construct checks assume clean ASCII lines; they would only add noise on a malformed file.
  return formatProblems.length > 0 ? formatProblems : constructErrors(source);
}

function formatErrors(source: string): string[] {
  const errors: string[] = [];
  const lines = displayCode(source).split("\n");
  if (!source.endsWith("\n")) errors.push("the file must end with a newline");
  else if (source.endsWith("\n\n")) errors.push("remove the blank lines at the end of the file");
  if (lines.length > MAX_LINES) {
    errors.push(`${lines.length} lines: at most ${MAX_LINES} fit a 320 px screen`);
  }
  let previousIndent = 0;
  lines.forEach((line, index) => {
    const at = `line ${index + 1}`;
    const bad = /[^\x20-\x7e]/.exec(line);
    if (bad) {
      const char = bad[0];
      const name = char === "\t"
        ? "a tab (indent with spaces)"
        : char === "\r"
        ? "a carriage return (use LF line endings)"
        : `U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}`;
      errors.push(`${at}: ${name}: only printable ASCII is allowed`);
      return;
    }
    if (line.length > MAX_COLUMNS) {
      errors.push(`${at}: ${line.length} characters, at most ${MAX_COLUMNS} fit a 320 px screen`);
    }
    if (/ $/.test(line)) errors.push(`${at}: trailing whitespace`);
    if (line.trim() === "") return;
    const indent = /^ */.exec(line)?.[0].length ?? 0;
    // Deeper by one level (2 spaces) at most; dedenting any number of levels is fine.
    if (indent % 2 !== 0 || indent > previousIndent + 2) {
      errors.push(`${at}: indent with 2 spaces per level`);
    }
    previousIndent = indent;
  });
  return errors;
}

// Comments, string literals and character literals, in the order C reads them.
const COMMENT_OR_LITERAL = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g;

function constructErrors(source: string): string[] {
  const errors: string[] = [];
  const lineOf = (offset: number) => source.slice(0, offset).split("\n").length;

  // Blank comments and literals, keeping newlines so line numbers still match the file.
  const code = source.replace(COMMENT_OR_LITERAL, (match, offset: number) => {
    if (!match.startsWith("/")) {
      errors.push(`line ${lineOf(offset)}: no string or character literals: integers only`);
    }
    return match.replace(/[^\n]/g, " ");
  });

  // Trailing spaces are allowed: a comment after the brace is blank by now.
  if (!/^int f\(int x, int y\) \{ *\n/.test(code.trimStart())) {
    errors.push("the code must start with `int f(int x, int y) {` on its own line");
  }
  // Checked on the raw text: a backslash ending a // comment silently comments out the next line.
  source.split("\n").forEach((line, index) => {
    if (line.endsWith("\\")) errors.push(`line ${index + 1}: no line continuation`);
  });
  code.split("\n").forEach((line, index) => {
    const at = `line ${index + 1}`;
    if (/#|%:/.test(line)) errors.push(`${at}: no preprocessor directives`);
    if (/\?\?[=/'()!<>-]/.test(line)) errors.push(`${at}: no trigraphs`);
    for (const [id] of line.matchAll(/(?<![\w.])[A-Za-z_]\w*/g)) {
      if (id.startsWith("_")) errors.push(`${at}: \`${id}\`: no identifier starting with _`);
      if (id === "float" || id === "double" || id === "char") {
        errors.push(`${at}: \`${id}\`: integers only`);
      }
    }
    // C preprocessing numbers: a float has a dot or an exponent (p/P for hex floats).
    for (const [number] of line.matchAll(/(?<![\w.])\.?\d(?:[eEpP][+-]|[\w.])*/g)) {
      const isFloat = /^0[xX]/.test(number) ? /[pP]/.test(number) : /[.eE]/.test(number);
      if (isFloat) errors.push(`${at}: \`${number}\`: integers only`);
    }
  });
  return errors;
}
