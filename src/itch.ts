/**
 * The itch.io build: `deno task build:itch` (Vite's "itch" mode, into dist-itch/), or
 * `deno task itch` for the ZIP to upload. itch.io runs the game in an iframe of its page, served
 * from a folder of html-classic.itch.zone, an origin every itch.io web game shares.
 *
 * Everything that build changes is here, behind ITCH, or in vite.config.ts's itch mode:
 * - relative paths: itch.io picks the folder (vite.config.ts);
 * - no service worker, neither built nor registered: the origin and its caches belong to every
 *   itch.io game (vite.config.ts, src/ui/pwa.ts);
 * - no install offer: from itch's frame, it would install itch's page (src/ui/install.ts);
 * - no calendar file: the reminder links the website's (vite.config.ts).
 *
 * Share texts and links still point to the website. Analytics stay off on their own: the host isn't
 * the site's. The frame may not use the Clipboard API: Share copies the old way (src/ui/share.ts).
 * Saves stay in the frame's storage, apart from the website's. Every itch.io web game shares it, so
 * another game can fill it (play then goes on in memory) or clear it, and WebKit doesn't keep it
 * between visits: neither Safari nor any browser on iPhone or iPad.
 */
export const ITCH = import.meta.env.MODE === "itch";
