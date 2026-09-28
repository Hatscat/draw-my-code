import assert from "node:assert/strict";
import type { IncomingHttpHeaders } from "node:http";
import { fileURLToPath } from "node:url";
import { prepareToolchain } from "./level-compile.ts";
import {
  checkSource,
  createEditor,
  type EditorRequest,
  isTrusted,
  levelPath,
  listLevels,
  plainText,
} from "./level-editor.ts";
import { preview } from "./level-output.ts";

const TOOLS = fileURLToPath(new URL(".", import.meta.url));
const LAUNCH = { y: 2026, m: 11, d: 1 };
const PAGE: IncomingHttpHeaders = { "sec-fetch-site": "same-origin", host: "localhost:5173" };

const body = (expression: string) => `int f(int x, int y) {\n  return ${expression};\n}\n`;

/** A throwaway repository: two dailies, a tutorial level, and a link to the real tools/. */
async function repo(): Promise<string> {
  const root = await Deno.makeTempDir({ prefix: "dmc-editor-test-" });
  await Deno.mkdir(`${root}/levels/tutorial`, { recursive: true });
  await Deno.mkdir(`${root}/levels/daily`, { recursive: true });
  await Deno.symlink(TOOLS, `${root}/tools`);
  await Deno.writeTextFile(`${root}/levels/tutorial/01-return-x.c`, body("x"));
  await Deno.writeTextFile(`${root}/levels/daily/0002.c`, body("y"));
  await Deno.writeTextFile(`${root}/levels/daily/0001.c`, body("x ^ y"));
  await Deno.writeTextFile(`${root}/levels/daily/notes.txt`, "not a level");
  return root;
}

function request(method: string, url: string, body = "", headers = PAGE): EditorRequest {
  return { method, url, headers, body };
}

Deno.test("isTrusted accepts only the editor page, served on this machine", () => {
  assert.equal(isTrusted(PAGE), true);
  assert.equal(isTrusted({ ...PAGE, host: "127.0.0.1:5173" }), true);
  assert.equal(isTrusted({ ...PAGE, host: "[::1]:5173" }), true);
  assert.equal(isTrusted({ ...PAGE, host: "localhost" }), true);
  // Another site, another local port, or no browser at all.
  assert.equal(isTrusted({ ...PAGE, "sec-fetch-site": "cross-site" }), false);
  assert.equal(isTrusted({ ...PAGE, "sec-fetch-site": "same-site" }), false);
  assert.equal(isTrusted({ host: "localhost:5173" }), false);
  // DNS rebinding: a name the attacker controls, pointing at this machine.
  assert.equal(isTrusted({ ...PAGE, host: "evil.example:5173" }), false);
  assert.equal(isTrusted({ ...PAGE, host: "localhost.evil.example" }), false);
  assert.equal(isTrusted({ "sec-fetch-site": "same-origin" }), false);
});

Deno.test("levelPath accepts level files only, and never leaves levels/", () => {
  assert.equal(levelPath("/repo", "levels/daily/0001.c"), "/repo/levels/daily/0001.c");
  assert.equal(
    levelPath("/repo", "levels/tutorial/01-one-cell.c"),
    "/repo/levels/tutorial/01-one-cell.c",
  );
  for (
    const path of [
      "",
      "levels/daily/1.c",
      "levels/daily/0000.c",
      "levels/daily/0001.h",
      "levels/tutorial/0001.c",
      "levels/other/0001.c",
      "levels/daily/../../deno.json",
      "levels/daily/0001.c/../../x",
      "/etc/passwd",
      "./levels/daily/0001.c",
      "levels\\daily\\0001.c",
    ]
  ) {
    assert.equal(levelPath("/repo", path), undefined, path);
  }
});

Deno.test("listLevels lists tutorial then dailies in order, with dates and what went live", async () => {
  const root = await repo();
  try {
    const levels = await listLevels(root, LAUNCH, { y: 2026, m: 11, d: 1 });
    assert.deepEqual(levels, [
      { path: "levels/tutorial/01-return-x.c", kind: "tutorial", id: 1, published: false },
      { path: "levels/daily/0001.c", kind: "daily", id: 1, live: "2026-11-01", published: true },
      { path: "levels/daily/0002.c", kind: "daily", id: 2, live: "2026-11-02", published: false },
    ]);
    await Deno.remove(`${root}/levels/tutorial`, { recursive: true });
    assert.equal((await listLevels(root, LAUNCH, LAUNCH)).length, 2);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("checkSource checks like the level pipeline, naming the author's file", async () => {
  const workDir = await Deno.makeTempDir({ prefix: "dmc-editor-test-" });
  try {
    const toolchain = await prepareToolchain(TOOLS, workDir);
    const valid = await checkSource(body("(x + y) % 8"), "0009.c", toolchain);
    assert.ok(valid.ok);
    assert.deepEqual(valid.values.slice(0, 8), [0, 1, 2, 3, 4, 5, 6, 7]);

    const format = await checkSource(
      `int f(int x, int y) {\n\treturn x;\n}\n`,
      "0009.c",
      toolchain,
    );
    assert.deepEqual(format, {
      ok: false,
      errors: ["line 2: a tab (indent with spaces): only printable ASCII is allowed"],
    });

    const compile = await checkSource(body("x +"), "0009.c", toolchain);
    assert.equal(compile.ok, false);
    const message = compile.ok ? "" : compile.errors.join("\n");
    assert.match(message, /^0009\.c:2:13: error: expected expression/m);
    assert.doesNotMatch(message, new RegExp(workDir));

    const ub = await checkSource(body("x << (y + 30)"), "0009.c", toolchain);
    assert.match(ub.ok ? "" : ub.errors.join("\n"), /0009\.c:2:12: runtime error: left shift/);

    // Every check cleans up after itself.
    const left = await Array.fromAsync(Deno.readDir(workDir));
    assert.deepEqual(left.map((e) => e.name).filter((n) => !n.startsWith("harness.")), []);
  } finally {
    await Deno.remove(workDir, { recursive: true });
  }
});

Deno.test("plainText turns the terminal preview's colored cells into digits", () => {
  const level = { id: 8, code: "int f(int x, int y) {\n  return x;\n}", solution: [] as string[] };
  const lines = preview("new", { ...level, solution: Array(8).fill("01234567") }).split("\n");
  assert.deepEqual(lines.map(plainText).slice(0, 3), [
    "new",
    "  int f(int x, int y) {                 0 1 2 3 4 5 6 7",
    "    return x;                           0 1 2 3 4 5 6 7",
  ]);
  assert.equal(plainText("\x1b[1mbold\x1b[0m  "), "bold");
});

Deno.test("the editor's endpoints read, save and check levels for its page only", async () => {
  const root = await repo();
  const editor = createEditor(root);
  try {
    const refused = await editor.respond(
      request("GET", "/levels", "", { "sec-fetch-site": "cross-site", host: "localhost:5173" }),
    );
    assert.equal(refused.status, 403);

    const list = await editor.respond(request("GET", "/levels"));
    assert.equal(list.status, 200);
    assert.equal(Array.isArray(list.body) && list.body.length, 3);

    const read = await editor.respond(request("GET", "/level?path=levels/daily/0001.c"));
    assert.deepEqual(read, { status: 200, body: { source: body("x ^ y") } });
    assert.equal(
      (await editor.respond(request("GET", "/level?path=levels/daily/0009.c"))).status,
      404,
    );
    assert.equal((await editor.respond(request("GET", "/level?path=../deno.json"))).status, 400);

    // Saving creates a file, or replaces one.
    const saved = await editor.respond(
      request("PUT", "/level?path=levels/daily/0003.c", JSON.stringify({ source: body("x") })),
    );
    assert.equal(saved.status, 200);
    assert.equal(await Deno.readTextFile(`${root}/levels/daily/0003.c`), body("x"));
    assert.equal(
      (await editor.respond(request("PUT", "/level?path=levels/daily/0003.c", "{"))).status,
      400,
    );
    assert.equal(
      (await editor.respond(request("PUT", "/level?path=levels/daily/0003.c", "{}"))).status,
      400,
    );

    const checked = await editor.respond(
      request("POST", "/check", JSON.stringify({ source: body("x"), name: "../0003.c" })),
    );
    assert.equal(checked.status, 200);
    assert.equal((checked.body as { ok: boolean }).ok, true);
    assert.equal((await editor.respond(request("POST", "/check", "[]"))).status, 400);
    assert.equal(
      (await editor.respond(request("DELETE", "/level?path=levels/daily/0003.c"))).status,
      404,
    );
  } finally {
    await editor.close();
    await Deno.remove(root, { recursive: true });
  }
});
