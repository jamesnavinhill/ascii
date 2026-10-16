/*
 * angkor wat: the temple at sunrise, seen across its reflecting pool. The
 * lotus towers climb out of the dark treeline in silhouette at first, then
 * the sun's first ray hits the western face gold while everything around it
 * stays violet-blue, and the pool in front carries the whole profile down
 * in a trembling copy, cut into pieces by the water's stir.
 */
import type { Frame, Meta } from "../types.ts";

export interface AngkorOptions {
  [key: string]: unknown;
  /** Stir of the reflecting pool. */
  stir: number;
}

export const meta = {
  name: "angkor wat",
  category: "scenes",
  note: "sunrise across the reflecting pool, towers in silhouette, one gold ray",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#141022",
  options: {
    stir: 1,
  },
  params: {
    stir: { label: "pool stir", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#141022", "#201a34", "#302a4c", "#453f66", "#5f5a80",
    "#8a8098", "#b5aab0", "#d8c8a4", "#e6c084", "#f2d492",
    "#fae6b2", "#fff3d0", "#ffffff",
  ],
} satisfies Meta<AngkorOptions>;

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

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);

export default function angkorWat(o: Partial<AngkorOptions> = {}): Frame {
  const stir = o.stir ?? meta.options.stir;

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

  // the five lotus towers: three stacked heights, center tallest
  // tower silhouette: a bud on a stepped plinth
  const TOWERS = [
    { cx: 74, top: 22, half: 7 },
    { cx: 100, top: 12, half: 9 },
    { cx: 126, top: 22, half: 7 },
  ];
  const TREELINE = 52;
  const POOL_TOP = 72;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the sunrise sky: violet-blue with a gold seam low over the towers
        const v = clamp(y / TREELINE);
        const gold = Math.max(0, 1 - Math.abs(x - 100) / 70) * clamp(1 - y / TREELINE);
        let cr = mix(0.08, 0.16 + 0.5 * gold, v);
        let cg = mix(0.06, 0.14 + 0.45 * gold, v);
        let cb = mix(0.13, 0.24 + 0.2 * gold, v);

        // the towers: dark silhouettes against the seam
        let onTower = null;
        for (const T of TOWERS) {
          const dx = Math.abs(x - T.cx);
          const dx2 = dx * dx;
          // the bud: a pointed cone from TREELINE up, widest a bit above its base
          if (dx < T.half && y > T.top && y < TREELINE) {
            const h = (TREELINE - y) / (TREELINE - T.top);
            const budHalf = T.half * Math.sin(Math.min(1, h) * Math.PI * 0.55);
            if (dx2 < budHalf * budHalf + (T.half / 6)) {
              onTower = { T, lit: dx < 0 ? 0 : 0.4 + 0.6 * (1 - dx / T.half) };
              break;
            }
          }
        }
        if (onTower) {
          const lit = onTower.lit * clamp(0.2 + 0.8 * gold * 1.6);
          cr = mix(0.09, 0.42, lit), cg = mix(0.07, 0.36, lit), cb = mix(0.1, 0.3, lit);
        }

        // the treeline: solid dark band
        if (y > TREELINE && y < POOL_TOP) {
          const bump = noise(x * 0.16, 7, 3) * 1.6;
          let edge = false;
          if (y < TREELINE + bump) edge = true;
          const wallX = x > 62 && x < 138;
          if (!wallX && y > TREELINE + 6) edge = false;
          let g = 0.07 + noise(x * 0.3, y * 0.4, 2) * 0.05;
          cr = g * 0.9, cg = g * 1.05, cb = g * 0.9;
          // the communal galleries between towers: a low dark causeway
          if (wallX && y > TREELINE + 3) cr *= 1.04;
        }

        // the reflecting pool: from POOL_TOP down, the whole profile mirrored
        if (y > POOL_TOP) {
          const dz = y - POOL_TOP;
          // sample the profile at the mirrored height
          const srcY = TREELINE - dz * 0.72;
          const stir1 = noise(x * 0.06, dz * 0.25 + t * stir * 0.4, 2);
          let mcr = 0.07, mcg = 0.05, mcb = 0.12;
          const mk = clamp(1 - dz / 26);
          if (mk > 0) {
            // gold seam reflection
            const goldM = Math.max(0, 1 - Math.abs(x - 100) / 70) * clamp(0.2 + 0.8 * stir1);
            mcr = mix(0.12, 0.5 * goldM + 0.1, goldM), mcg = mix(0.1, 0.42 * goldM + 0.08, goldM), mcb = mix(0.16, 0.2 * goldM + 0.12, goldM);
            // tower silhouettes reflected: dark cones
            for (const T of TOWERS) {
              const dx = Math.abs(x - T.cx);
              if (dx < T.half && (TREELINE - srcY) < (TREELINE - T.top) * 0.8) {
                mcr = mix(mcr, 0.07, 0.7), mcg = mix(mcg, 0.05, 0.7), mcb = mix(mcb, 0.09, 0.7);
              }
            }
          }
          cr = mix(cr, mcr, mk), cg = mix(cg, mcg, mk), cb = mix(cb, mcb, mk);
          // the pool's ripples cut the mirror into horizontal slivers
          const sliver = hash(Math.floor((y - POOL_TOP) * 3 + t * stir), x) > 0.75;
          if (!sliver) cr *= 0.85, cg *= 0.85, cb *= 0.85;
        }

        halftone(k, r, x, clamp(cr), clamp(cg), clamp(cb), color);
      }
    }
    const lines: string[] = [];
    for (let r = 0; r < H; r++) lines.push(out.slice(r * W, (r + 1) * W).join(""));
    return lines.join("\n");
  };
}
