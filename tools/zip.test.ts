import assert from "node:assert/strict";
import { crc32 } from "./png.ts";
import { zip, zipDirectory } from "./zip.ts";

interface Entry {
  readonly name: string;
  readonly method: number;
  readonly flags: number;
  readonly data: Uint8Array<ArrayBuffer>;
}

async function inflate(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Reads an archive back through its central directory, checking each local header against it. */
async function unzip(archive: Uint8Array<ArrayBuffer>): Promise<Entry[]> {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  const end = archive.length - 22;
  assert.equal(view.getUint32(end, true), 0x06054b50);
  const count = view.getUint16(end + 10, true);
  assert.equal(view.getUint16(end + 8, true), count);
  let offset = view.getUint32(end + 16, true);
  assert.equal(
    offset + view.getUint32(end + 12, true),
    end,
    "the directory ends at the end record",
  );
  const entries: Entry[] = [];
  for (let i = 0; i < count; i++) {
    assert.equal(view.getUint32(offset, true), 0x02014b50);
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const crc = view.getUint32(offset + 16, true);
    const compressed = view.getUint32(offset + 20, true);
    const length = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const local = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(archive.subarray(offset + 46, offset + 46 + nameLength));
    // The local header repeats the directory's fields.
    assert.equal(view.getUint32(local, true), 0x04034b50);
    assert.equal(view.getUint16(local + 6, true), flags);
    assert.equal(view.getUint16(local + 8, true), method);
    assert.equal(view.getUint32(local + 14, true), crc);
    assert.equal(view.getUint32(local + 18, true), compressed);
    assert.equal(view.getUint32(local + 22, true), length);
    assert.equal(view.getUint16(local + 26, true), nameLength);
    const start = local + 30 + nameLength + view.getUint16(local + 28, true);
    const body = archive.subarray(start, start + compressed);
    const data = method === 0 ? body : new Uint8Array(await inflate(body));
    assert.equal(data.length, length);
    assert.equal(crc32(data), crc);
    entries.push({ name, method, flags, data });
    offset += 46 + nameLength + view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
  return entries;
}

const text = (s: string) => new TextEncoder().encode(s);

/** Bytes deflate can't shrink: a fixed pseudo-random sequence. */
function noise(length: number): Uint8Array<ArrayBuffer> {
  let state = 12345;
  return Uint8Array.from({ length }, () => (state = (state * 1103515245 + 12345) >>> 0) >>> 24);
}

Deno.test("zip: every file reads back under its UTF-8 name, deflated when that shrinks it", async () => {
  const files = [
    { name: "index.html", data: text("<p>Draw my code</p>\n".repeat(50)) },
    { name: "assets/café.css", data: text("body { color: black; }\n".repeat(20)) },
    { name: "empty.txt", data: new Uint8Array() },
    { name: "noise.bin", data: noise(256) },
  ];
  const entries = await unzip(await zip(files));
  assert.deepEqual(entries.map((e) => e.name), files.map((f) => f.name));
  entries.forEach((entry, i) => assert.deepEqual(entry.data, files[i]?.data));
  assert.deepEqual(entries.map((e) => e.method), [8, 8, 0, 0]);
  for (const entry of entries) assert.equal(entry.flags & 0x0800, 0x0800, "UTF-8 names");
});

Deno.test("zip: the same files give the same bytes", async () => {
  const files = [{ name: "a.txt", data: text("a".repeat(100)) }];
  assert.deepEqual(await zip(files), await zip(files));
});

Deno.test("zip: no files is an empty archive", async () => {
  assert.deepEqual(await unzip(await zip([])), []);
});

Deno.test("zipDirectory: every file of a folder, by its path inside it, in order", async () => {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${dir}/assets`);
    await Deno.writeTextFile(`${dir}/index.html`, "<p>root</p>");
    await Deno.writeTextFile(`${dir}/assets/game.js`, "console.log(1);");
    const entries = await unzip(await zipDirectory(dir));
    assert.deepEqual(entries.map((e) => e.name), ["assets/game.js", "index.html"]);
    assert.equal(new TextDecoder().decode(entries[1]?.data), "<p>root</p>");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
