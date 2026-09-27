import assert from "node:assert/strict";
import { crc32, encodePng } from "./png.ts";

Deno.test("crc32 matches known values", () => {
  assert.equal(crc32(new TextEncoder().encode("IEND")), 0xae426082);
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  assert.equal(crc32(new Uint8Array()), 0);
});

Deno.test("encodePng writes a valid PNG whose pixels decode back", async () => {
  const width = 3;
  const height = 2;
  const rgb = new Uint8Array([
    ...[255, 0, 0, 0, 255, 0, 0, 0, 255],
    ...[0, 0, 0, 128, 128, 128, 255, 255, 255],
  ]);
  const png = await encodePng(width, height, rgb);
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // Walk the chunks, checking each CRC and collecting IHDR and IDAT.
  const view = new DataView(png.buffer);
  const types: string[] = [];
  let idat = new Uint8Array();
  for (let offset = 8; offset < png.length;) {
    const length = view.getUint32(offset);
    const type = new TextDecoder().decode(png.subarray(offset + 4, offset + 8));
    const data = png.subarray(offset + 8, offset + 8 + length);
    assert.equal(
      view.getUint32(offset + 8 + length),
      crc32(png.subarray(offset + 4, offset + 8 + length)),
    );
    if (type === "IHDR") {
      assert.equal(new DataView(data.buffer, data.byteOffset).getUint32(0), width);
      assert.equal(new DataView(data.buffer, data.byteOffset).getUint32(4), height);
    }
    if (type === "IDAT") idat = data;
    types.push(type);
    offset += 12 + length;
  }
  assert.deepEqual(types, ["IHDR", "IDAT", "IEND"]);

  const stream = new Blob([idat.slice()]).stream().pipeThrough(new DecompressionStream("deflate"));
  const raw = new Uint8Array(await new Response(stream).arrayBuffer());
  assert.deepEqual([...raw], [0, ...rgb.subarray(0, 9), 0, ...rgb.subarray(9)]);
});

Deno.test("encodePng rejects pixel data of the wrong size", async () => {
  await assert.rejects(encodePng(2, 2, new Uint8Array(11)), /doesn't match/);
});
