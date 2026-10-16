/*
 * christ the redeemer: the mountain-top statue over Rio at blue hour. The
 * figure stands with arms level across the dark crest of Corcovado, backlit
 * hair-thin against the last of the western sky, the city below already a wash
 * of golden lights, the Sugarloaf a black cone at the bay's far end and the
 * water carrying the city up in long smears.
 */
import type { Frame, Meta } from "../types.ts";

export interface RioOptions {
  [key: string]: unknown;
  /** Sparkle of the city lights. */
  shimmer: number;
}

export const meta = {
  name: "christ redeemer",
  category: "scenes",
  note: "the hilltop statue over Rio at blue hour, city lights below, arms level",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#0a1220",
  options: {
    shimmer: 1,
  },
  params: {
    shimmer: { label: "city shimmer", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#0a1220", "#122036", "#1c3350", "#2c4a6e", "#45688e",
    "#6f8fae", "#a5b8c8", "#d6dbc2", "#e8c86a", "#f7df8e",
    "#fff1b8", "#ffffff",
  ],
} satisfies Meta<RioOptions>;

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

export default function christRedeemer(o: Partial<RioOptions> = {}): Frame {
  const shimmer = o.shimmer ?? meta.options.shimmer;

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

  // the statue: high and centered, arms level and straight
  const CX = 100;
  const HEAD_Y = 14;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // blue hour sky: deep indigo, warmest low over the old city
        const v = clamp(y / 62);
        let cr = mix(0.04, 0.1 + 0.3 * clamp(1 - Math.abs(x - 150) / 110), v);
        let cg = mix(0.05, 0.14 + 0.3 * clamp(1 - Math.abs(x - 150) / 110), v);
        let cb = mix(0.11, 0.22 + 0.24 * clamp(1 - Math.abs(x - 150) / 110), v);
        // stars
        if (hash(x * 7 + 3, r * 11) > 0.996 && y < 34) {
          cr = 0.8, cg = 0.88, cb = 1;
        }

        // the Sugarloaf: a black cone at the bay's far end (right)
        const loafY = 36 + 26 * Math.max(0, 1 - Math.abs(x - 178) / 14);
        if (Math.abs(x - 178) < 14 && y > loafY && y < 66) {
          cr = 0.05, cg = 0.07, cb = 0.1;
        }

        // the bay: water from y=66 down, city lights smeared in it
        if (y > 66) {
          const dz = y - 66;
          const wobble = fbm(x * 0.06, dz * 0.1 + t * shimmer * 0.35, 2, 8);
          let wc = 0.04 + 0.02 * wobble;
          cr = wc, cg = wc * 1.2, cb = wc * 1.6;
          // the light smears: vertical streaks under the city
          const streakSeed = hash(Math.floor(x / 3), 5);
          if (streakSeed > 0.55) {
            const sk = clamp(1 - dz / 26) * (0.3 + 0.7 * wobble);
            const warm = streakSeed > 0.8;
            if (warm) cr += sk * 0.8, cg += sk * 0.55, cb += sk * 0.2;
            else cr += sk * 0.4, cg += sk * 0.5, cb += sk * 0.7;
          }
        }

        // the city: a dense band of lights on its own dark hillside
        const cityLine = 66;
        if (y < cityLine && y > 40) {
          const hill = noise(x * 0.05, 3, 2) * 5;
          const top = hill + 44;
          if (y > top) {
            // dense speckle of warm lights
            const lx = Math.floor(x / 2), ly = Math.floor((y - top) / 2);
            const spark = hash(lx, ly);
            const spark2 = hash(lx * 3, ly * 7 + Math.floor(t * shimmer) % 5);
            if (spark > 0.4) {
              const bright = (spark - 0.4) * 1.7 + (spark2 > 0.7 ? 0.3 : 0);
              cr = 0.3 + bright * 0.7, cg = 0.24 + bright * 0.5, cb = 0.14 + bright * 0.2;
            } else {
              // dark hillside
              cr = 0.05, cg = 0.07, cb = 0.11;
            }
          }
        }

        // Corcovado: the sharp dark mountain under the statue (center-left)
        const mtTop = 48 + 10 * Math.exp(-(((x - CX) / 22) ** 2)) - 6 * Math.exp(-(((x - 70) / 24) ** 2));
        if (y > mtTop && y <= 66) {
          const rocky = noise(x * 0.4, y * 0.4, 2);
          cr = 0.05 + rocky * 0.05, cg = 0.08 + rocky * 0.06, cb = 0.11 + rocky * 0.06;
        }

        // the statue itself: silhouette, hair-thin highlight on its edge
        const fy = (y - HEAD_Y) / 22;
        if (fy > 0 && fy < 1 && y < 40) {
          const bodyHalf = mix(2.4, 2.8, clamp(fy));
          const dx = Math.abs(x - CX);
          // the arms: two straight wings level with the shoulders
          const armRow = fy > 0.3 && fy < 0.62;
          const armHalf = armRow ? 17 : 0;
          // the pedestal under the figure
          const onPed = fy >= 0.78 && dx < 4.2;
          if (dx < bodyHalf || (armRow && dx < armHalf) || onPed) {
            // the statue is floodlit from below: pale stone, warm rim
            const lit = dx < bodyHalf || onPed ? 0.85 : 0.35 + 0.5 * clamp(1 - (dx - bodyHalf) / (armHalf - bodyHalf + 1));
            let gCl = 0.8 * lit + 0.15;
            cr = gCl, cg = gCl * 0.98, cb = gCl * 0.92;
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
