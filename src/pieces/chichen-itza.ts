/*
 * chichen itza: El Castillo at late afternoon. The stepped pyramid sits
 * square in the frame, its nine terraces catching a raking light that
 * wraps each edge while the staircases fall in hard black shadow, and the
 * jungle around it is a textured green-dark that leans into the stone.
 * Swifts, the birds of the ruins, wheel in slow circles above.
 */
import type { Frame, Meta } from "../types.ts";

export interface ChichenOptions {
  [key: string]: unknown;
  /** Swift seed. */
  birds: number;
}

export const meta = {
  name: "chichen itza",
  category: "scenes",
  note: "El Castillo in raking light, stairs in shadow, swifts wheeling above",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#121a10",
  options: {
    birds: 1,
  },
  params: {
    birds: { label: "swifts", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#121a10", "#1f2c1a", "#2e4021", "#465c29", "#6a7d3a",
    "#93a254", "#b8bd74", "#d5d496", "#e8dcab", "#f4e6bd",
    "#fff3d2", "#ffffff",
  ],
} satisfies Meta<ChichenOptions>;

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

export default function chichenItza(o: Partial<ChichenOptions> = {}): Frame {
  const birds = o.birds ?? meta.options.birds;
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
    // a silent floor plus an expansive curve: deep values drop out to sparse
    // ink instead of filling the frame with mid-tone dots
    // a hard S-curve: values below the sky band go silent, the subjects
    // saturate, and only the real midtones carry the dot ladder
    const kk = clamp((Math.pow(peak, 0.55) - 0.22) / 0.5);
    const level = clamp(kk * kk * (3 - 2 * kk) * 1.04);
    const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
    out[k] = DOTS[step];
    if (color) {
      const want = step ? Math.min(1, (level + 0.06) / [0, 0.3, 0.6, 1][step]) : 0;
      const s = ((0.3 + 0.7 * want) * (0.4 + 0.6 * clamp(1 - level))) / peak;
      color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
    }
  };

  // the pyramid: 9 terraces from base y=88 to the temple at y=30.
  // square silhouette: base x 46..154, tapering to x 86..114 at the temple.
  const BASE_Y = 88, TOP_Y = 38;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the late afternoon sky: gold toward the left where the sun leans
        const w = clamp(1 - y / 50);
        let cr = mix(0.07, 0.3, w);
        let cg = mix(0.08, 0.26, w);
        let cb = mix(0.1, 0.2, w);

        // swifts: small curved marks loop high in the sky
        if (y < 34) {
          for (let b = 0; b < 7 * birds; b++) {
            const seed = hash(b * 13, 3);
            const R = 14 + seed * 16;
            const CX2 = 30 + seed * 140;
            const ph = (t / meta.loop) * Math.PI * 2 * (0.6 + seed) + b;
            const bx = CX2 + Math.cos(ph) * R;
            const by = 10 + seed * 20 + Math.sin(ph) * 5;
            if (Math.abs(x - bx) < 1.4 && Math.abs(y - by) < 0.9) {
              cr = 0.14, cg = 0.15, cb = 0.13;
            }
          }
        }

        // jungle canopy: textured, middle-ground, behind and beside
        if (y > 60) {
          const canopy = noise(x * 0.3, y * 0.35, 3);
          const leaf = 0.12 + canopy * 0.15;
          cr = leaf * 0.85, cg = leaf * 1.3, cb = leaf * 0.7;
          // Canopy bumps drawn against the sky at the top edge
          const bump = 62 + noise(x * 0.2, 7, 4) * 4;
          if (y < bump) cr = 0.07, cg = 0.12, cb = 0.1;
        }

        // the pyramid
        if (y < BASE_Y && y > TOP_Y) {
          // width narrows as we go up
          const yn = (BASE_Y - y) / (BASE_Y - TOP_Y);
          const halfW = 54 * (1 - yn) + 14;
          if (Math.abs(x - 100) < halfW) {
            // nine terraces: thin ledges catching light on their riser face
            const stepH = (BASE_Y - TOP_Y) / 9.6;
            const stepI = Math.floor((BASE_Y - y) / stepH);
            const inStep = (BASE_Y - y) - stepI * stepH;
            // riser (horizontal) vs tread (vertical) shading
            const tread = inStep > stepH * 0.62;
            let g = tread ? 0.28 : 0.55 + 0.1 * noise(x * 0.4, y * 0.4, 2);
            // sun-side warm, away-side cool
            const side = x < 100 ? 1 : 0.76;
            cr = g * 1.05 * side, cg = g * 0.95 * side, cb = g * 0.7 * side;
            // the great staircase: dark stairs and balustrades up the middle
            const stair = Math.abs(x - 100) < 7;
            const bal = Math.abs(Math.abs(x - 100) - 7) < 1.2;
            if (bal && y > 46) {
              cr = 0.5, cg = 0.48, cb = 0.4;
            } else if (stair) {
              const shad = 0.12 + 0.06 * noise(x * 0.7, y * 0.7, 2);
              cr = shad, cg = shad, cb = shad * 0.9;
            }
            // serpent heads at the stairs' base
            if (y > 82 && Math.abs(x - 100) < 10 && y < 86) {
              cr = 0.42, cg = 0.4, cb = 0.34;
            }
          } else {
            // jungle edge in front of the pyramid's base
            const canopy = noise(x * 0.25, y * 0.3, 3);
            cr = 0.06 + canopy * 0.06, cg = 0.1 + canopy * 0.1, cb = 0.05 + canopy * 0.04;
          }
        }

        // temple at the top: small box with a doorway
        if (y >= TOP_Y - 8 && y < TOP_Y) {
          if (Math.abs(x - 100) < 16) {
            let g = 0.35 + noise(x * 0.4, y * 0.4, 2) * 0.1;
            if (y > TOP_Y - 5 && Math.abs(x - 100) < 3) g = 0.08;
            const side = x < 100 ? 1 : 0.78;
            cr = g * 1.05 * side, cg = g * 0.95 * side, cb = g * 0.72 * side;
          } else if (y > 60) {
            cr = 0.1, cg = 0.16, cb = 0.07;
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
