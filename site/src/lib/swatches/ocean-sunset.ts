/*
 * Every palette entry of ocean sunset, named by its role in the scene's own
 * shading (ocean-sunset.ts): the sky's indigo-to-violet gradient, the heaped
 * cloud's magentas, the glint's hot pinks, the sun's coral-to-cream ladder
 * with the land rim's reds, then the dark-page half of the themed palette.
 */

export const labels: string[] = [
  // sky, top of frame down toward the horizon (0-4)
  "sky · deep indigo",
  "sky · indigo",
  "sky · dusk violet",
  "sky · violet",
  "sky · mauve",
  // heaped cloud, undersides lit from below (5-9)
  "cloud · plum",
  "cloud · magenta",
  "cloud · rose",
  "cloud · pink",
  "cloud · pale pink",
  // the glint path and its hot edge (10-13)
  "glint · deep pink",
  "glint · hot pink",
  "glint · pale pink",
  "cloud · deep plum",
  // the sun and its glitter path (14-20)
  "sun · coral rim",
  "sun · orange",
  "sun · bright orange",
  "sun · gold",
  "sun · bright gold",
  "sun · pale gold",
  "sun · cream core",
  // the headland and sea stack where they catch the sun (21-23)
  "land rim · deep red",
  "land rim · red",
  "land rim · bright red",
  // dark page: the same sky again, dimmed (24-31)
  "dark · plum sky",
  "dark · plum",
  "dark · dusk plum",
  "dark · mauve",
  "dark · rose mauve",
  "dark · pale coral",
  "dark · pale peach",
  "dark · cream peach",
  // dark page: the sea (32-38)
  "dark · sea indigo",
  "dark · sea blue",
  "dark · sea violet",
  "dark · sea dusk",
  "dark · sea mauve",
  "dark · deep blue",
  "dark · sea slate",
  // dark page: the clouds (39-42)
  "dark · cloud violet",
  "dark · cloud orchid",
  "dark · cloud pink",
  "dark · cloud pale pink",
];
