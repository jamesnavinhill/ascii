/*
 * Every palette entry of the Vercel piece, in the generator's six-format:
 * paper run, glint's pale lift, full-glint brightness, each again for a
 * dark page. The mono-to-white ladder is the glint working the black ink.
 */

export const labels: string[] = [
  // dark page: black ink, lifted, glint peak; then bright pass's run
  "ink · black",
  "ink · lifted grey",
  "ink · glint peak",
  "ink · pale grey",
  "ink · pale lift",
  "ink · near white",
  // light page: the same three again
  "ink · black",
  "ink · lifted grey",
  "ink · glint peak",
  "ink · pale grey",
  "ink · pale lift",
  "ink · near white",
];
