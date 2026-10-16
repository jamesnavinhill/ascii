/*
 * Every palette entry of edge orbit, named by its role in the scene's own
 * shading: the night side, the rim of air burning Cloudflare orange, the
 * sodium-lit cities, and the network's lights.
 */

export const labels: string[] = [
  // the night side and its limb, deep to pale (0-7)
  "night · black",
  "night · deep indigo",
  "night · indigo",
  "night · dark blue",
  "night · blue",
  "night · slate blue",
  "night · pale blue",
  "night · palest blue",
  // the shadow of the limb's underside (8-11)
  "limb · black",
  "limb · near black",
  "limb · charcoal",
  "limb · dusk grey",
  // the rim of air at sunrise (12-19)
  "air rim · deep ember",
  "air rim · dark orange",
  "air rim · burnt orange",
  "air rim · orange",
  "air rim · bright orange",
  "air rim · cloudflare orange",
  "air rim · light orange",
  "air rim · tangerine",
  // the cities' sodium glow (20-25)
  "cities · deep sodium",
  "cities · dark gold",
  "cities · gold",
  "cities · warm gold",
  "cities · bright gold",
  "cities · pale gold",
  // the network's own white (26)
  "network · white",
];
