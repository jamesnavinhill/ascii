/*
 * eiffel tower: the lattice at night, lit gold from below. Paris lies low
 * around it, its windows sleep, and the tower's own floodlight spills up
 * through the iron so the arches glow and the point disappears into the
 * sky. Every minute on the hour its beacon turns once, sweeping the clouds.
 */
import type { Frame, Meta } from "../types.ts";

export interface EiffelOptions {
  [key: string]: unknown;
  /** Seconds between the beacon's sweeps; 0 keeps it still. */
  beacon: number;
}

export const meta = {
  name: "eiffel tower",
  category: "scenes",
  note: "the lattice lit gold from below, paris asleep around it",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#070a16",
  options: {
    beacon: 8,
  },
  params: {
    beacon: { label: "beacon sweep", min: 0, max: 20, step: 0.5 },
  },
  palette: [
    "#070a16", "#0f1530", "#1a2342", "#2c3652", "#46506b",
    "#6d6f80", "#a08a6e", "#c89b50", "#e0b45c", "#f2cc79",
    "#ffe6a4", "#fff4d2", "#ffffff",
  ],
} satisfies Meta<EiffelOptions>;

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

export default function eiffelTower(o: Partial<EiffelOptions> = {}): Frame {
  const every = o.beacon ?? meta.options.beacon;

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

  // the tower's outline: half-width of the iron at each row
  const CX = 100;
  const halfWidth = (y: number): number => {
    // splayed legs at the bottom, waist at the second platform, taper upward
    const v = 1 - clamp(y / 92);
    const splay = 30 * Math.pow(v, 0.18) * (1 - 0.55 * Math.exp(-(y / 20)));
    return splay < 2.2 ? 2.2 : splay > 32 ? 32 : splay;
  };

  return (t, { color } = {}) => {
    const beaconAngle = every > 0 ? (Math.PI * 2 * (t % 16)) / 16 : null;
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        let cr = 0.03, cg = 0.05, cb = 0.12;
        // the sky: a deep indigo, brighter toward the horizon line
        const horizon = 78;
        if (y < horizon) {
          const v = clamp(y / horizon);
          cr = mix(0.02, 0.06, v), cg = mix(0.03, 0.09, v), cb = mix(0.07, 0.18, v);
          // a few faint stars, kept well clear of the tower
          const s = hash(x * 7 + 3, r * 11);
          if (s > 0.9955) {
            cr = 0.9, cg = 0.92, cb = 1;
          }
          // distant dormers: the pari roofs, lit sparsely
          const roofSeed = noise(x * 0.12, 0.5, 2);
          if (y > horizon - 8 && roofSeed > 0.55) {
            const warm = 0.4 + 0.6 * hash(x * 3, r);
            cr = 0.55 * warm, cg = 0.33 * warm, cb = 0.16 * warm;
          }
        } else if (y < 84) {
          // the ground plane: a dark plaza reflecting some gold
          const v = 1 - clamp((y - horizon) / 6);
          cr = 0.08 + 0.1 * v, cg = 0.07 + 0.08 * v, cb = 0.1 * v + 0.05;
        }

        // the tower itself: iron lattice, gold-lit from the feet up
        const hw = halfWidth(y);
        const dx = Math.abs(x - CX);
        if (dx < hw + 1.5) {
          // lattice body between the two faces: airy
          const edge = dx / Math.max(hw, 0.001);
          // the structure's density falls as it narrows
          const lattice = noise(x * 0.8, y * 0.8, 0) * 0.5 + 0.5;
          const strut = (Math.floor(y * 0.55) % 2 === 0 ? 0.75 : 0.35) * (1 - edge * 0.4);
          // warm gold from below; the higher up, the cooler the gold
          const warmth = clamp(1 - y / 92) * 0.75 + 0.25;
          const body = 0.45 + 0.55 * (1 - edge);
          cr = mix(0.85, 0.95, body) * warmth;
          cg = mix(0.62, 0.72, body) * warmth;
          cb = mix(0.25, 0.3, body) * (0.4 + 0.6 * warmth);
          if (lattice < 0.35) cr *= 0.3, cg *= 0.3, cb *= 0.3;
          if (strut > 0.6) cr *= 1.1, cg *= 1.1, cb *= 0.9;
          // the glow it spills: hot near the legs, cooler above
          const spill = Math.exp(-((dx / (hw + 6)) ** 2)) * (1 - y / 92);
          cr += 0.4 * spill, cg += 0.18 * spill, cb += 0.04 * spill;
        }
        // the feet's four arches: the ground shows through the base curve
        if (y > 74 && y < 88 && dx < 30) {
          const arch = Math.abs(y - 86) < 0.8 || Math.abs(dx - (28 - y * 0.12)) < 1.2;
          if (!arch && y > 80 && dx > 8 && dx < 30) {
            cr = 0.04, cg = 0.05, cb = 0.1;
          }
        }

        // the beacon's sweep: a beam swinging across the whole sky line
        if (beaconAngle !== null && y > 2 && y < 14) {
          const sweepX = CX + 88 * Math.cos(beaconAngle);
          const beam = Math.exp(-((x - sweepX) ** 2) / 220);
          if (beam > 0.04) {
            cr += beam * 0.7, cg += beam * 0.55, cb += beam * 0.3;
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
