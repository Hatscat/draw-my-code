/**
 * A minimal ZIP writer, for the itch.io upload (`deno task itch`): deflate from CompressionStream,
 * the CRC from png.ts. No zip library, no zip command. Usage: zip.ts <folder> <archive.zip>
 */

import { crc32 } from "./png.ts";

export interface ZipFile {
  /** Its path inside the archive, with `/` between folders. */
  readonly name: string;
  readonly data: Uint8Array<ArrayBuffer>;
}

// Every file dated 1980-01-01 00:00, the format's first day: the same files give the same bytes.
const DOS_DATE = (1 << 5) | 1;
const UTF8_NAMES = 0x0800;
const DEFLATE = 8;
const STORE = 0;

async function deflateRaw(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** An archive of `files`, each deflated when that shrinks it, stored as it is otherwise. */
export async function zip(files: readonly ZipFile[]): Promise<Uint8Array<ArrayBuffer>> {
  const encoder = new TextEncoder();
  const entries = await Promise.all(files.map(async ({ name, data }) => {
    const deflated = await deflateRaw(data);
    const smaller = deflated.length < data.length;
    return {
      name: encoder.encode(name),
      crc: crc32(data),
      size: data.length,
      method: smaller ? DEFLATE : STORE,
      body: smaller ? deflated : data,
    };
  }));
  const local = entries.reduce((sum, e) => sum + 30 + e.name.length + e.body.length, 0);
  const central = entries.reduce((sum, e) => sum + 46 + e.name.length, 0);
  const out = new Uint8Array(local + central + 22);
  const view = new DataView(out.buffer);
  // The fields a local header and its central directory record share, from "version needed".
  const fields = (at: number, entry: (typeof entries)[number]) => {
    view.setUint16(at, 20, true); // version 2.0: deflate
    view.setUint16(at + 2, UTF8_NAMES, true);
    view.setUint16(at + 4, entry.method, true);
    view.setUint16(at + 8, DOS_DATE, true);
    view.setUint32(at + 10, entry.crc, true);
    view.setUint32(at + 14, entry.body.length, true);
    view.setUint32(at + 18, entry.size, true);
    view.setUint16(at + 22, entry.name.length, true);
  };

  // Zeros everywhere else: time 00:00, no extra fields, comments or attributes, one disk.
  const starts: number[] = [];
  let offset = 0;
  for (const entry of entries) {
    starts.push(offset);
    view.setUint32(offset, 0x04034b50, true);
    fields(offset + 4, entry);
    out.set(entry.name, offset + 30);
    out.set(entry.body, offset + 30 + entry.name.length);
    offset += 30 + entry.name.length + entry.body.length;
  }
  entries.forEach((entry, i) => {
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true); // made by: MS-DOS, version 2.0
    fields(offset + 6, entry);
    view.setUint32(offset + 42, starts[i] ?? 0, true);
    out.set(entry.name, offset + 46);
    offset += 46 + entry.name.length;
  });
  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, entries.length, true);
  view.setUint16(offset + 10, entries.length, true);
  view.setUint32(offset + 12, central, true);
  view.setUint32(offset + 16, local, true);
  return out;
}

/** Every file under `dir`, by its path inside it, sorted so the archive doesn't depend on disk order. */
async function filesIn(dir: string, prefix = ""): Promise<ZipFile[]> {
  const entries: Deno.DirEntry[] = [];
  for await (const entry of Deno.readDir(`${dir}/${prefix}`)) entries.push(entry);
  entries.sort((a, b) => (a.name < b.name ? -1 : 1));
  const files: ZipFile[] = [];
  for (const entry of entries) {
    const name = prefix + entry.name;
    if (entry.isDirectory) files.push(...await filesIn(dir, `${name}/`));
    else if (entry.isFile) files.push({ name, data: await Deno.readFile(`${dir}/${name}`) });
  }
  return files;
}

/** An archive of the folder's files, the folder itself not included: itch wants index.html at the top. */
export async function zipDirectory(dir: string): Promise<Uint8Array<ArrayBuffer>> {
  return zip(await filesIn(dir));
}

if (import.meta.main) {
  const [dir, archive] = Deno.args;
  if (!dir || !archive) throw new Error("Usage: zip.ts <folder> <archive.zip>");
  await Deno.writeFile(archive, await zipDirectory(dir));
  console.log(`${archive}: the files of ${dir}/`);
}
