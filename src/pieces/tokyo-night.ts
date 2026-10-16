/*
 * tokyo night: Shibuya crossing and Tokyo Tower seen from the heights. The
 * crossing is a wet tile stain of crossings and culture: red beacon light,
 * neon signs in stacked tiers, a tide of umbrellas and rain. Tokyo Tower
 * stands far off as a lit truss, its_ISO red and the cold rain of the city
 * around it.
 */
import type { Frame, Meta } from "../types.ts";

export interface TokyoOptions {
  [key: string]: unknown;
  /** How fast the neon shimmers. */
  shimmer: number;
  /** Crowd flow intensity. */
  crowd: number;
}

export const meta = {
  name: "tokyo night",
  category: "scenes",
  note: "Shibuya in the rain: neon tiers, umbrella crowds, the tower lit far off",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#0a0a14",
  options: {
    shimmer: 1,
    crowd: 1,
  },
  params: {
    shimmer: { label: "neon shimmer", min: 0, max: 2, step: 0.05 },
    crowd: { label: "crowd flow", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#0a0a14", "#141428", "#1a2a3e", "#28344a", "#3d4a60",
    "#6a5878", "#a87898", "#d88aa0", "#e84d90", "#ff6a4c",
    "#ffc23e", "#62e28c", "#3eb8ff", "#ffffff",
  ],
} satisfies Meta<TokyoOptions>;

const W = 200, H = 100;

function hash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, y: number, period: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  let x0 = xi, x1 = xi + 1;
  if (period) {
    x0 = ((xi % period) + period) % period;
    x1 = (x0 + 1) % period;
  }
  const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, octaves: number, period: number): number {
  let s = 0, n = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    s += amp * noise(x * f, y * f, period * f);
    n += amp;
    amp *= 0.5;
    f *= 2;
  }
  return s / n;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);

export default function tokyoNight(o: Partial<TokyoOptions> = {}): Frame {
  const shimmer = o.shimmer ?? meta.options.shimmer;
  const crowd = o.crowd ?? meta.options.crowd;

  const P = meta.palette.map(hex);
  const out: string[] = new Array(W * H);

  const lut = new Uint16Array(32768).fill(65535);
  const nearest = (r: number, g: number, b: number): number => {
    const k = (Math.min(31, (r * 31.99) | 0) << 10) | (Math.min(31, (g * 31.99) | 0) << 5) | Math.min(31, (b * 31.99) | 0);
    if (lut[k] !== 65535) return lut[k];
    let best = 0, bd = 1e9;
    for (let i = 0; i < P.length; i++) {
      const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
      const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
      if (d < bd) (bd = d), (best = i);
    }
    return (lut[k] = best);
  };

  const DOTS = " ·•●";
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
  const halftone = (k: number, r: number, x: number, cr: number, cg: number, cb: number, color: Uint8Array | undefined) => {
    const peak = Math.max(cr, cg, cb, 1e-4);
    const level = clamp(Math.pow(peak, 0.9) * 1.05);
    const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
    out[k] = DOTS[step];
    if (color) {
      const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
      const s = ((0.32 + 0.68 * want) * (0.4 + 0.6 * clamp(1 - level))) / peak;
      color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
    }
  };

  // Tokyo Tower's silhouette: a tall Eiffel-like truss, far off at x=170
  const TOWER = 170;
  const towerHalf = (y: number): number => {
    // widening downward: legs go from x=168..172 at apex to 158..182 at base
    const k = clamp(y / 60);
    return 2 + 12 * k * k;
  };

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        let cr = 0.04, cg = 0.03, cb = 0.08;

        // ---- the sky: dark, and a light haze above the crowd's glow
        if (y < 70) {
          cr = 0.04, cg = 0.03, cb = 0.08;
        }

        // ---- Tokyo Tower: neon truss, far off
        if (y > 8 && y < 70) {
          const d = Math.abs(x - TOWER) - towerHalf(y);
          if (d < 2.4) {
            // truss: red-orange struts crossing, lit from within and below
            const strut = Math.abs((y - x * 0.25 + x - TOWER) % 8 - 4) < 1.8;
            const amber = (y > 32 && y < 44) ? 1 : 0; // the observatory deck band
            const lit = 0.55 + 0.45 * noise(x * 0.2, y * 0.2 + t * shimmer, 2);
            if (strut) {
              cr = mix(0.9, 0.5, lit * 0.4), cg = mix(0.4, 0.2, lit * 0.3), cb = 0.05;
              if (amber) cr = 1, cg = 0.75, cb = 0.2;
            } else if (d > 0) {
              cr = 0.05, cg = 0.03, cb = 0.07;
            } else {
              cr = 0.3 * lit, cg = 0.12 * lit, cb = 0.05;
            }
          }
        }

        // ---- the neon tiers: stacked signage bars on both side buildings
        if (y >= 34 && y < 70) {
          // left block x 0..70, right block x 130..200, the crossing visible
          // between them through x 70..130
          const isLeft = x < 70, isRight = x > 130;
          if (isLeft || isRight) {
            const u = isLeft ? x : W - x;
            const depth = (isLeft ? (70 - x) / 70 : (x - 130) / 70);
            // base wall of city with windows
            let wall = 0.08 + 0.06 * noise(x * 0.3, y * 0.3, 3);
            // windows: a few lit ones
            const winCol = Math.floor(x / 4), winRow = Math.floor((y - 34) / 5);
            if ((winCol * 31 + winRow * 17) % 7 < 2) wall += 0.5;
            // stacked neon bars: rows of glowing signs at y 38, 46, 54, 62
            const barY = [38, 46, 54, 62];
            for (const by of barY) {
              const dyy = Math.abs(y - by);
              if (dyy < 2.2) {
                const band = 1 - dyy / 2.2;
                // pick a family by column
                const fam = hash(winCol, Math.floor(by / 8));
                const glowK = 0.6 + 0.4 * noise(x * 0.5 + t * shimmer * 2, by, 3);
                if (fam < 0.4) {
                  // pink/red
                  wall = mix(wall, 0.6, band * glowK);
                  wall = Math.max(wall, band * glowK);
                  if (band > 0.5) { cr = mix(cr, 1, band); cg = mix(cg, 0.35, band); cb = mix(cb, 0.55, band); }
                } else if (fam < 0.75) {
                  // cyan/blue
                  wall = Math.max(wall, band * glowK);
                  if (band > 0.5) { cr = mix(cr, 0.2, band); cg = mix(cg, 0.8, band); cb = mix(cb, 1, band); }
                } else {
                  // amber
                  wall = Math.max(wall, band * glowK);
                  if (band > 0.5) { cr = mix(cr, 1, band); cg = mix(cg, 0.75, band); cb = mix(cb, 0.2, band); }
                }
              }
            }
            cr = Math.max(cr, wall), cg = Math.max(cg, wall * 0.9), cb = Math.max(cb, wall);
          }
        }

        // ---- the crossing floor: wet tiles from y=70 down, reflections
        if (y >= 70) {
          const dz = y - 70;
          // white crossing lines: diagonal bands like Shibuya's famous stripes
          const stripe = ((x + y * 1.4) % 24 < 2.5) || ((x - y * 1.4) % 24 < 2.5);
          let fcr = 0.05, fcg = 0.05, fcb = 0.08;
          if (stripe) fcr = fcr = 0.55, fcg = 0.55, fcb = 0.6;
          // umbrella crowd walking through the middle band
          if (dz > 4 && dz < 22) {
            const cellX = Math.floor((x + (t * 30 * crowd) % 200) / 6);
            const cellY = Math.floor((y - 70) / 4);
            const h = hash(cellX, cellY * 7 + 3);
            if (h > 0.65) {
              // umbrella color runs through a palette of neon
              const fam = hash(cellX, 91);
              fcr = mix(0.9, 0.3, fam), fcg = mix(0.3, 0.8, fam), fcb = mix(0.2, 1, fam);
              fcr *= 0.9, fcg *= 0.9, fcb *= 0.9;
            }
          }
          cr = fcr, cg = fcg, cb = fcb;
          // reflections: the neon tiers smear downward in long verticals
          const refK = clamp(1 - dz / 28);
          const xFrom = [x - 1, x, x + 1];
          let rr = 0, rg = 0, rb = 0, n = 0;
          for (const sx of xFrom) {
            const srcY = 68 - Math.floor(dz * 0.7);
            const idx = srcY * W + sx;
            if (idx >= 0 && idx < W * H) {
              // can't easily read back the spec; approximate: signs glow at
              // fixed tiers, so reproduce their glow here
              for (const by of [38, 46, 54, 62]) {
                const near = Math.abs(srcY - by) < 3;
                if (near) {
                  const fam = hash(Math.floor(sx / 4), Math.floor(by / 8));
                  if (fam < 0.4) (rr += 1), (rg += 0.3), (rb += 0.5);
                  else if (fam < 0.75) (rr += 0.2), (rg += 0.7), (rb += 1);
                  else (rr += 1), (rg += 0.7), (rb += 0.2);
                  n++;
                }
              }
            }
          }
          if (n > 0) {
            rr /= n; rg /= n; rb /= n;
            cr = mix(cr, rr * 0.5, refK * 0.8);
            cg = mix(cg, rg * 0.5, refK * 0.8);
            cb = mix(cb, rb * 0.5, refK * 0.8);
          }
        }

        halftone(k, r, x, clamp(cr), clamp(cg), clamp(cb), color);
      }
    }
    const lines: string[] = [];
    for (let r = 0; r < H; r++) lines.push(out.slice(r * W, (r + 1) * W).join(""));
    return lines.join("\n");
  };
}
