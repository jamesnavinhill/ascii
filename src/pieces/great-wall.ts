/*
 * great wall: the wall's ridgeline at early morning. The wall runs the
 * whole frame length, riding the mountain crest as a light ribbon of
 * parapets and watchtowers, while the valleys below are still full of
 * blue shadow andDlg the far ridges stack into the haze. The sun's first
 * warm light has reached the upper slopes only.
 */
import type { Frame, Meta } from "../types.ts";

export interface GreatWallOptions {
  [key: string]: unknown;
  /** The wall's slither speed. */
  drift: number;
}

export const meta = {
  name: "great wall",
  category: "scenes",
  note: "the wall at morning: towers on the crest, blue shadow in the valleys",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#111a24",
  options: {
    drift: 1,
  },
  params: {
    drift: { label: "cloud drift", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#111a24", "#1c2733", "#2a3d45", "#3a5558", "#54706a",
    "#75937c", "#9fb288", "#c4cfa0", "#e0e6b8", "#f4f0ce",
    "#fff8dc", "#ffffff",
  ],
} satisfies Meta<GreatWallOptions>;

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

export default function greatWall(o: Partial<GreatWallOptions> = {}): Frame {
  const drift = o.drift ?? meta.options.drift;
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

  // the ridge: analytic crest the wall follows, with layered ridges behind
  const ridge = (x: number): number => {
    const base = 46 - 22 * Math.exp(-(((x - 100) / 50) ** 2)) - 10 * Math.exp(-(((x - 40) / 26) ** 2)) - 8 * Math.exp(-(((x - 160) / 30) ** 2));
    return base + fbm(x * 0.05, 0, 2, 4) * 8;
  };
  const farRidge = (x: number, amp: number, yOff: number): number => yOff - amp * (0.5 + 0.5 * Math.sin(x * 0.05) + 0.3 * noise(x * 0.06, 5, 3));

  // all height fields are frame-independent: precompute per column
  const RIDGE = new Float32Array(W);
  const FAR1 = new Float32Array(W);
  const FAR2 = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    RIDGE[x] = ridge(x);
    FAR1[x] = farRidge(x, 16, 22);
    FAR2[x] = farRidge(x, 12, 32);
  }

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // morning sky: warm haze at the top of the frame
        const w = clamp(1 - y / 44);
        let cr = mix(0.07, 0.35, w);
        let cg = mix(0.1, 0.3, w);
        let cb = mix(0.16, 0.44, w);
        // thin cloud bands, drifting
        const cl = noise(x * 0.04, y * 0.08 + t * drift * 0.2, 4);
        if (y < 40 && cl > 0.6) {
          const b = (cl - 0.6) * 2;
          cr = mix(cr, 0.5, b * 0.4), cg = mix(cg, 0.45, b * 0.4), cb = mix(cb, 0.55, b * 0.4);
        }

        // far ridges: cold haze layers, stacked (precomputed per column)
        if (y > FAR1[x] && y < RIDGE[x] - 2) {
          cr = 0.09 + 0.028, cg = 0.13 + 0.0336, cb = 0.2 + 0.0392;
        } else if (y > FAR2[x] && y < RIDGE[x] - 2) {
          cr = 0.09 + 0.042, cg = 0.13 + 0.0504, cb = 0.2 + 0.0588;
        }

        const ry = RIDGE[x];
        // the mountains: warm on their sunlit crests, cold in the draws
        if (y > ry && y < H - 1) {
          const depth = clamp((y - ry) / 34);
          // the crest catches the morning light down a few rows
          const lit = clamp(1 - depth * 3.4);
          const rocky = noise(x * 0.5, y * 0.5, 2);
          const g = mix(0.42 + 0.2 * rocky, 0.14, depth);
          cr = mix(mix(0.35 + 0.45 * lit, 0.2, rocky * 0.4), 0.12, depth);
          cg = mix(mix(0.3 + 0.42 * lit, 0.2, rocky * 0.4), 0.12, depth);
          cb = mix(mix(0.32 + 0.34 * lit, 0.28, rocky * 0.4), 0.2, depth);
          // shadow in the valleys between crests: smooth blue cast
          const valley = 1 - clamp((y - (ry + 8)) / 12);
          cr *= mix(1, 0.7, valley * depth), cg *= mix(1, 0.75, valley * depth), cb *= mix(1, 0.9, valley * depth);
        }

        // the wall: a light stone ribbon that follows the ridge exactly
        const wy = ry;
        if (y > wy - 2 && y < wy + 4) {
          // the parapet catches the whole of the light, and shows crenels
          const crenel = ((x % 5) < 2) && y < wy - 1;
          let g = y < wy ? 0.72 : 0.6;
          if (crenel) g = 0.85;
          // watchtowers: every ~26 x, a taller box
          const tx = Math.abs(((x + 13) % 52) - 26);
          if (tx < 3 && y > wy - 6) g = 0.9;
          if (tx < 3 && y < wy - 6) g = 0.4;
          cr = g, cg = g * 0.96, cb = g * 0.88;
          // stone texture below the ridge line
          if (y > wy + 2) cr *= 0.9, cg *= 0.9, cb *= 0.9;
        }

        halftone(k, r, x, clamp(cr), clamp(cg), clamp(cb), color);
      }
    }
    const lines: string[] = [];
    for (let r = 0; r < H; r++) lines.push(out.slice(r * W, (r + 1) * W).join(""));
    return lines.join("\n");
  };
}
