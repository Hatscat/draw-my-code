import assert from "node:assert/strict";

/**
 * The stylesheet keeps its design tokens in `:root` (the design system's colors, type, spacing,
 * radii, sizes, motion and layers): every other rule uses them through var(). A raw color or size
 * outside `:root` fails here, so a new value has to join the tokens first.
 */

const CSS = await Deno.readTextFile(new URL("../src/styles.css", import.meta.url));

interface Declaration {
  readonly selector: string;
  readonly property: string;
  readonly value: string;
}

/** Every declaration outside `:root` and `@font-face`, except custom properties (token uses). */
function declarations(css: string): Declaration[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found: Declaration[] = [];
  const blocks: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "{") {
      blocks.push(text.slice(start, i).trim());
      start = i + 1;
    } else if (char === "}" || char === ";") {
      const chunk = text.slice(start, i).trim();
      const colon = chunk.indexOf(":");
      const inside = blocks.at(-1) ?? "";
      const skipped = blocks.some((header) => header === ":root" || header === "@font-face");
      if (colon > 0 && !skipped && !chunk.startsWith("--")) {
        found.push({
          selector: inside,
          property: chunk.slice(0, colon).trim(),
          value: chunk.slice(colon + 1).trim(),
        });
      }
      if (char === "}") blocks.pop();
      start = i + 1;
    }
  }
  return found;
}

const withoutTokens = (value: string) => value.replace(/var\(--[\w-]+\)/g, "");
const where = ({ selector, property, value }: Declaration) =>
  `${selector} { ${property}: ${value} }`;

const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/i;
const LENGTH = /(?<![\w.-])\d*\.?\d+(?:px|em|rem)\b/;
const DURATION = /(?<![\w.-])\d*\.?\d+m?s\b/;
const NUMBER = /\d/;

/** Properties whose lengths come from tokens: type, spacing, radii, borders, sizes, offsets. */
const SIZED =
  /^(?:font|font-size|letter-spacing|margin(?:-[a-z]+)*|padding(?:-[a-z]+)*|(?:row-|column-)?gap|border(?:-[a-z]+)*|outline(?:-[a-z]+)*|top|right|bottom|left|inset|(?:min-|max-)?(?:width|height)|grid-template-(?:columns|rows)|box-shadow|transform|background)$/;

Deno.test("styles.css: the check finds every declaration", () => {
  const all = declarations(CSS);
  assert.ok(all.length > 150, `only ${all.length} declarations found`);
  assert.ok(all.some((d) => d.selector === ".grid" && d.property === "touch-action"));
  assert.ok(!all.some((d) => d.property.startsWith("--")), "custom properties are token uses");
});

Deno.test("styles.css: colors come from the tokens in :root", () => {
  const raw = declarations(CSS).filter((d) => COLOR.test(withoutTokens(d.value)));
  assert.deepEqual(raw.map(where), []);
});

Deno.test("styles.css: type, spacing, radii, borders and sizes come from the tokens", () => {
  const raw = declarations(CSS).filter((d) =>
    SIZED.test(d.property) && LENGTH.test(withoutTokens(d.value))
  );
  assert.deepEqual(raw.map(where), []);
});

Deno.test("styles.css: line heights, layers and motion come from the tokens", () => {
  const raw = declarations(CSS).filter((d) =>
    (["line-height", "z-index"].includes(d.property) && NUMBER.test(withoutTokens(d.value))) ||
    (/^(?:transition|animation)/.test(d.property) && DURATION.test(withoutTokens(d.value)))
  );
  assert.deepEqual(raw.map(where), []);
});
