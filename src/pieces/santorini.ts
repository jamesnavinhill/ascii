/*
 * santorini: the caldera edge in late afternoon. The white villages pour
 * down the crater lip in stepped cubes and blue domes, their west walls
 * catching the low sun full while the deep blue Aegean turns glassy below,
 * and a single ferry draws its wake far out. A whitewash town stacked over
 * a cliff, blinding where it is lit.
 */
import type { Frame, Meta } from "../types.ts";

export interface SantoriniOptions {
  [key: string]: unknown;
  /** The ferry's crossing speed; 0 keeps the bay empty. */
  ferry: number;
}

export const meta = {
  name: "santorini",
  category: "scenes",
  note: "white cubes over the caldera, blue domes, the Aegean below",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#1a3a50",
  options: {
    ferry: 3.5,
  },
  params: {
    ferry: { label: "ferry crossing", min: 0, max: 8, step: 0.2 },
  },
  palette: [
    "#0e2c40", "#123c55", "#1c4e6b", "#2b627e", "#417a8f",
    "#5f96a4", "#8ab3bb", "#b4d2d4", "#dcebe6", "#f2f7ef",
    "#ffffff", "#2d5f8a", "#3d78a8",
  ],
} satisfies Meta<SantoriniOptions>;

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

export default function santorini(o: Partial<SantoriniOptions> = {}): Frame {
  const ferrySpeed = o.ferry ?? meta.options.ferry;

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

  // the crater lip: a bright scarp running diagonally, town above the sea
  const HORIZON = 58;
  const rimY = (x: number): number => 18 + 10 * Math.sin(x * 0.03 + 1.2) + noise(x * 0.08, 3, 2) * 3;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the aegean sky: clear blue, brightening toward the horizon
        const v = clamp(y / rimY(x));
        let cr = mix(0.2, 0.5, v), cg = mix(0.4, 0.66, v), cb = mix(0.66, 0.85, v);

        const rim = rimY(x);
        if (y > rim && y < HORIZON) {
          // the caldera scarp: volcanic rock, poured over with white cubes
          const q = (y - rim) / (HORIZON - rim);
          // the village: stacked cube rows, whiter where sunlit (west = left)
          const row = Math.floor((y - rim) / 4.4);
          const cubeX = Math.floor(x / 5.5);
          const lit = clamp(0.55 + 0.45 * Math.cos((x - 62) * 0.03));
          // blue domes: sparse, on a few cubes
          const dome = hash(cubeX, row * 3) > 0.86 && q < 0.6;
          // bare rock shows between the cubes
          const isRock = hash(cubeX * 7, row) > 0.8 && q > 0.68;
          if (isRock) {
            const g = 0.3 + 0.14 * noise(x * 0.5, y * 0.5, 2);
            cr = g * 1.1, cg = g * 0.95, cb = g * 0.8;
          } else if (dome) {
            // a blue church dome: deep aegean blue with a highlight edge
            const dy = Math.abs(((y - rim) % 4.4) - 2.2);
            const dk = clamp(1.1 - dy / 2.2);
            cr = mix(0.16, 0.34, dk * lit), cg = mix(0.34, 0.52, dk * lit), cb = mix(0.62, 0.78, dk * lit);
          } else {
            // whitewashed cube, lit face warm-white, shadow face cool
            const shade = 0.82 + 0.18 * hash(cubeX, row * 5);
            cr = mix(0.92, 1, shade) * mix(0.75, 1, lit);
            cg = mix(0.93, 1, shade) * mix(0.76, 1, lit);
            cb = mix(0.92, 1, shade) * mix(0.8, 1, lit);
          }
        }

        // the sea: from the horizon down, glassy with a single wake
        if (y >= HORIZON) {
          const dz = y - HORIZON;
          const base = 0.1 + 0.1 * clamp(1 - dz / 40);
          cr = base * 0.7, cb = base * 2.1, cg = base * 1.5;
          // the sun's broad path: not a road, a wide soft silvering
          const path = Math.exp(-(((x - 130) / 30) ** 2)) * clamp(1 - dz / 30);
          cr += path * 0.5, cg += path * 0.6, cb += path * 0.8;
          // a single ferry and its wake, far out
          if (ferrySpeed > 0) {
            const fx0 = ((ferrySpeed * t * 5 + 40) % 260) - 40;
            const ferryY = HORIZON + 9;
            if (Math.abs(x - fx0) < 2.4 && Math.abs(y - ferryY) < 1) {
              cr = 0.95, cg = 0.95, cb = 0.9;
            }
            // its wake: a fading V behind it
            const inWake = Math.abs(x - (fx0 - 4)) < 3 && y > ferryY - 0.4 && y < ferryY + 2.6;
            if (inWake) {
              cr += 0.16, cg += 0.2, cb += 0.24;
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
