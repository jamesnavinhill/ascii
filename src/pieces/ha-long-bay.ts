/*
 * ha long bay: early morning on the water. The limestone towers — tall,
 * sheer, jungle-capped karst — rise straight out of the mist-flat sea in
 * ranks that fade back into haze, long-tail fishing boats cross between
 * them leaving their own slow wake, and the light comes soft and wet from
 * a low haze sun that never quite appears.
 */
import type { Frame, Meta } from "../types.ts";

export interface HaLongOptions {
  [key: string]: unknown;
  /** Speed of the boat crossing. */
  boat: number;
  /** How fast the haze shifts. */
  haze: number;
}

export const meta = {
  name: "ha long bay",
  category: "scenes",
  note: "limestone towers in morning haze, boats crossing the glass-flat sea",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#20303a",
  options: {
    boat: 2.2,
    haze: 1,
  },
  params: {
    boat: { label: "boat crossing", min: 0, max: 8, step: 0.2 },
    haze: { label: "haze motion", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#20303a", "#2a4250", "#365a66", "#4a747c", "#6a948e",
    "#92b2a2", "#b8ccae", "#d9e0be", "#ecddc0", "#f6e8cc",
    "#fdf6e0", "#ffffff",
  ],
} satisfies Meta<HaLongOptions>;

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

export default function haLongBay(o: Partial<HaLongOptions> = {}): Frame {
  const boat = o.boat ?? meta.options.boat;
  const hazeSpeed = o.haze ?? meta.options.haze;

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

  const HORIZON = 56;
  // the Karst towers: each is a sheer-sided limestone pillar, wider at the base
  const KARSTS = [
    { cx: 30, top: 16, half: 14, dist: 0.9 },
    { cx: 62, top: 26, half: 10, dist: 0.6 },
    { cx: 88, top: 20, half: 12, dist: 0.75 },
    { cx: 118, top: 30, half: 8, dist: 0.45 },
    { cx: 146, top: 24, half: 11, dist: 0.65 },
    { cx: 178, top: 34, half: 7, dist: 0.35 },
  ];

  return (t, { color } = {}) => {
    const hazeDrift = (t * hazeSpeed * 0.25) % 16;
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the haze sky: soft milk-green, brightest where the sun sits
        const v = clamp(y / HORIZON);
        const warm = clamp(1 - Math.abs(x - 160) / 100);
        let cr = mix(0.13, 0.4 + 0.24 * warm, v);
        let cg = mix(0.17, 0.42 + 0.22 * warm, v);
        let cb = mix(0.19, 0.4 + 0.14 * warm, v);

        // drifting sheets of haze above the horizon
        const sheet = noise(x * 0.03, y * 0.05 + hazeDrift, 4);
        if (y < HORIZON && sheet > 0.55) {
          const s = (sheet - 0.55) * 1.6;
          cr = mix(cr, 0.55, s * 0.5), cg = mix(cg, 0.58, s * 0.5), cb = mix(cb, 0.55, s * 0.5);
        }

        // the karst pillars, back to front: sheer walls, jungle crowns
        for (const K of KARSTS) {
          const taper = K.half * (0.62 + 0.38 * clamp((HORIZON - K.top === 0) ? 0 : (y - K.top) / (HORIZON - K.top)));
          const dx = Math.abs(x - K.cx);
          if (dx < taper && y > K.top && y < HORIZON) {
            // the rock wall: soft sea-washed grey-green, sun side lighter
            const sideLit = clamp(0.45 + 0.55 * (x < K.cx ? 1 : 0.35));
            const streaks = noise(x * 0.5, y * 0.12, 0) * 0.15;
            let g = 0.22 + 0.3 * sideLit + streaks;
            // distance haze lifts each pillar up
            g = mix(g, 0.62, (1 - K.dist) * 0.85);
            cr = g * 0.82, cg = g * 1.02, cb = g * 1.0;
            // the jungle crown on top
            const crown = clamp((K.top + 6 - y) / 6);
            if (crown > 0) {
              const jg = g * mix(1, 0.72, crown);
              cr = jg * 0.72, cg = jg * 1.12, cb = jg * 0.75;
            }
            break;
          }
        }

        // the sea: mist-flat, broad haze-mirror from the horizon down
        if (y >= HORIZON) {
          const dz = y - HORIZON;
          const hz = noise(x * 0.05, dz * 0.09, 4);
          const mk = clamp(1 - dz / 30);
          let mcr = 0.3 + 0.12 * hz + 0.14 * warm, mcg = 0.34 + 0.12 * hz + 0.12 * warm, mcb = 0.36 + 0.1 * hz;
          // faint pillar reflections: soft grey smears
          for (const K of KARSTS) {
            if (Math.abs(x - K.cx) < K.half) {
              mcr = mix(mcr, 0.4, mk * 0.25), mcg = mix(mcg, 0.44, mk * 0.25), mcb = mix(mcb, 0.44, mk * 0.25);
            }
          }
          cr = mix(cr, mcr, mk * 0.9), cg = mix(cg, mcg, mk * 0.9), cb = mix(cb, mcb, mk * 0.9);
          // faint ripple sheens, slow
          const glint = hash(Math.floor(x / 4), Math.floor(dz + t * hazeSpeed)) > 0.975;
          if (glint) {
            cr += 0.14, cg += 0.15, cb += 0.12;
          }

          // a long-tail boat crossing with its wake
          if (boat > 0) {
            const bx = ((boat * t * 5 + 70) % 300) - 50;
            const boatY = HORIZON + 12;
            if (Math.abs(x - bx) < 3.5 && Math.abs(y - boatY) < 1) {
              cr = 0.85, cg = 0.82, cb = 0.72;
              // the boat's own dark hull line
              if (y - boatY > 0.4) cr = 0.32, cg = 0.34, cb = 0.3;
            }
            const wake = Math.abs(x - (bx - 5)) < 2.6 && y > boatY - 0.4 && y < boatY + 2.4;
            if (wake) {
              cr += 0.1, cg += 0.12, cb += 0.12;
            }
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
