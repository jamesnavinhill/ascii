/*
 * Every palette entry of black prism, named by its role in the scene's own
 * shading: the void's greys, the white beam and its passage through the
 * glass, and the spectrum fanned out of the right face, each hue with its
 * deep variant for the prism's shadow side.
 */

export const labels: string[] = [
  // the void's greys, black to white (0-9)
  "void · black",
  "void · near black",
  "void · dark grey",
  "void · grey",
  "void · mid grey",
  "void · light grey",
  "void · pale grey",
  "void · silver",
  "void · near white",
  "void · white",
  // the spectrum, each hue with its deep shadow variant (10-23)
  "spectrum · red",
  "spectrum · deep red",
  "spectrum · orange",
  "spectrum · deep orange",
  "spectrum · yellow",
  "spectrum · deep yellow",
  "spectrum · green",
  "spectrum · deep green",
  "spectrum · cyan",
  "spectrum · deep cyan",
  "spectrum · blue",
  "spectrum · deep blue",
  "spectrum · violet",
  "spectrum · deep violet",
  // the beam itself (24-26)
  "beam · warm white",
  "beam · ice white",
  "beam · pale edge",
];
