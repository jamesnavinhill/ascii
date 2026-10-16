/*
 * Every palette entry of the Vercel piece, in the generator's layout:
 * indices 0-2 serve a light page (black ink, the glint's lifted grey, the
 * near-white peak), 3-5 the same ladder again for a dark page.
 */

export const labels: string[] = [
  // light page (0-2)
  "light · black",
  "light · lifted grey",
  "light · glint peak",
  // dark page (3-5)
  "dark · pale grey",
  "dark · pale lift",
  "dark · near white",
];
