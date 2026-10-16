/*
 * Every palette entry of earthrise, named by its role in the scene's own
 * shading: the lunar regolith's grey ladder, the Earth's day side (its deep
 * space, the ocean, the cloud deck, the terminator), and the continents.
 */

export const labels: string[] = [
  // the lunar ground, black to pale regolith (0-11)
  "regolith · black",
  "regolith · near black",
  "regolith · dark grey",
  "regolith · grey",
  "regolith · mid grey",
  "regolith · warm grey",
  "regolith · light grey",
  "regolith · pale grey",
  "regolith · grey tan",
  "regolith · pale tan",
  "regolith · very pale",
  "regolith · near white",
  // the space beyond the limb (12-15)
  "space · black",
  "space · deep blue",
  "space · night blue",
  "space · dusk blue",
  // the Earth's day side (16-24)
  "earth · day pale",
  "ocean · deep blue",
  "ocean · blue",
  "ocean · mid blue",
  "ocean · bright blue",
  "ocean · vivid blue",
  "ocean · sky blue",
  "ocean · pale blue",
  "ocean · very pale",
  // the Earth's clouds and terminator (25-27)
  "clouds · white",
  "terminator · grey blue",
  "terminator · dusk blue",
  // the continents, in the scene's own greens and tans (28-37)
  "land · deep green",
  "land · dark green",
  "land · green",
  "land · light green",
  "land · olive",
  "land · dry grass",
  "land · tan",
  "land · ochre",
  "land · desert tan",
  "land · desert brown",
];
