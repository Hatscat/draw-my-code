/**
 * Where local builds and e2e runs pretend to live when CI doesn't pass the Pages URL. A sub-path,
 * like the real Pages site, so base-path bugs show up locally too.
 */
export const LOCAL_SITE_URL = "http://127.0.0.1:4173/draw-my-code/";

/**
 * The public site URL: CI passes actions/configure-pages' `base_url`, which has no trailing slash.
 * The trailing slash matters: it is the Vite base path and ends the share text.
 */
export function siteUrl(fromEnv: string | undefined): URL {
  const url = new URL(fromEnv || LOCAL_SITE_URL);
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}
