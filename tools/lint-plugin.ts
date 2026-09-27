/**
 * Project lint rules for what TypeScript's lib settings can't catch. src/core/ already type-checks
 * without the DOM; this bans the clock, randomness and UI imports there, and TS suppression comments
 * everywhere (the built-in ban-ts-comment accepts them when a reason follows).
 */

const PURE = "src/core stays pure: pass dates and randomness in from src/ui";

function inCore(filename: string): boolean {
  return filename.replaceAll("\\", "/").includes("/src/core/");
}

function importsUi(source: string): boolean {
  return /(^|\/)ui\//.test(source);
}

const plugin: Deno.lint.Plugin = {
  name: "dmc",
  rules: {
    "core-purity": {
      create(context) {
        if (!inCore(context.filename)) return {};
        const report = (node: Deno.lint.Node) => context.report({ node, message: PURE });
        const reportUiSource = (node: Deno.lint.Node, source: string) => {
          if (importsUi(source)) report(node);
        };
        return {
          // Member expressions, not calls: `clock = Date.now` smuggles the clock in as a value.
          'MemberExpression[object.name=/^(Date|performance)$/][property.name="now"]': report,
          'MemberExpression[object.name="Temporal"][property.name="Now"]': report,
          'MemberExpression[object.name="Math"][property.name="random"]': report,
          'MemberExpression[object.name="crypto"]': report,
          'CallExpression[callee.name="Date"]': report,
          // Build settings reach core as arguments from src/ui, like dates.
          'MemberExpression[object.type="MetaProperty"][property.name="env"]': report,
          NewExpression(node) {
            if (node.callee.type === "Identifier" && node.callee.name === "Date") {
              if (node.arguments.length === 0) report(node);
            }
          },
          ImportDeclaration(node) {
            reportUiSource(node, node.source.value);
          },
          ExportAllDeclaration(node) {
            reportUiSource(node, node.source.value);
          },
          ExportNamedDeclaration(node) {
            if (node.source) reportUiSource(node, node.source.value);
          },
          ImportExpression(node) {
            // A computed specifier can't be checked, so it isn't allowed in core.
            if (node.source.type !== "Literal" || typeof node.source.value !== "string") {
              report(node);
            } else {
              reportUiSource(node, node.source.value);
            }
          },
        };
      },
    },
    "no-ts-directive": {
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (/@ts-(ignore|nocheck|expect-error)/.test(comment.value)) {
                context.report({
                  range: comment.range,
                  message: "Fix the type instead of silencing the checker",
                });
              }
            }
          },
        };
      },
    },
  },
};

export default plugin;
