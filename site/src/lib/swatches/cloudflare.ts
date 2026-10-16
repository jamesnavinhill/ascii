/*
 * Every palette entry of the Cloudflare piece, in the generator's layout:
 * indices 0-2 serve a light page (base ink, the glint's pale lift, the
 * glint's peak), 3-5 the same three for a dark page. The hexes repeat the
 * same three colours; the grid labels each by the page it serves.
 */

export const labels: string[] = [
  // light page (0-2)
  "light · cloudflare orange",
  "light · lifted pale",
  "light · glint peak",
  // dark page (3-5)
  "dark · cloudflare orange",
  "dark · lifted pale",
  "dark · glint peak",
];
