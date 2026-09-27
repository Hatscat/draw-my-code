/** Syntax-highlighting tokens for the tiny C subset levels use. Not a C lexer: colors only. */

export type TokenKind =
  | "type"
  | "keyword"
  | "function"
  | "number"
  | "operator"
  | "identifier"
  | "comment"
  | "punctuation"
  | "space";

export interface Token {
  readonly kind: TokenKind;
  readonly text: string;
}

const TYPES = new Set(["int", "unsigned", "signed", "long", "short", "char", "void", "float"]);
const KEYWORDS = new Set([
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "default",
  "break",
  "continue",
  "goto",
  "const",
  "static",
  "sizeof",
]);

// One alternative per token kind, tried in order at each position.
const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))`,
    String.raw`(?<space>\s+)`,
    String.raw`(?<number>\.?\d(?:[eEpP][+-]|[\w.])*)`,
    String.raw`(?<word>[A-Za-z_]\w*)`,
    String.raw`(?<operator>[-+*/%=<>!&|^~?:]+)`,
    String.raw`(?<punctuation>[\s\S])`,
  ].join("|"),
  "y",
);

/** Splits code into tokens whose texts, joined, give back the code exactly. */
export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  TOKEN.lastIndex = 0;
  for (let match = TOKEN.exec(code); match; match = TOKEN.exec(code)) {
    const text = match[0];
    const groups = match.groups ?? {};
    if (groups.word !== undefined) {
      const rest = code.slice(TOKEN.lastIndex);
      const kind: TokenKind = TYPES.has(text)
        ? "type"
        : KEYWORDS.has(text)
        ? "keyword"
        : /^\s*\(/.test(rest)
        ? "function"
        : "identifier";
      tokens.push({ kind, text });
    } else {
      const kind = (["comment", "space", "number", "operator"] as const).find((name) =>
        groups[name] !== undefined
      );
      tokens.push({ kind: kind ?? "punctuation", text });
    }
  }
  return tokens;
}

/** Tokens per line: a multi-line comment is split at its line breaks. */
export function tokenLines(code: string): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(code)) {
    token.text.split("\n").forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines.at(-1)?.push({ kind: token.kind, text: part });
    });
  }
  return lines;
}
