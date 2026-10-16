/*
 * statue of liberty: liberty island at blue hour. The copper figure stands
 * green with its patina, high on the stone pedestal, the raised torch the
 * one warm gold light in the harbor, the crown's spikes black against the
 * dusk. Water carries the torch down in a long shiver, ferries cross with
 * their lights, and the city's glow sits far off at the horizon.
 */
import type { Frame, Meta } from "../types.ts";

export interface LibertyOptions {
  [key: string]: unknown;
  /** How fast the ferry crosses; 0 keeps the harbor empty. */
  ferry: number;
  /** The torch flame's shimmer. */
  flame: number;
}

export const meta = {
  name: "statue liberty",
  category: "scenes",
  note: "liberty at blue hour, the torch one gold light in the harbor",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#081222",
  options: {
    ferry: 3.2,
    flame: 1,
  },
  params: {
    ferry: { label: "ferry crossing", min: 0, max: 8, step: 0.2 },
    flame: { label: "torch shimmer", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#08122a", "#10283a", "#1d4550", "#2f685e", "#4b8b78",
    "#78a995", "#a9c6ae", "#d0d9c2", "#e8b956", "#ffd977",
    "#fff0b0", "#28416a", "#3d5c8a",
  ],
} satisfies Meta<LibertyOptions>;

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

export default function statueLiberty(o: Partial<LibertyOptions> = {}): Frame {
  const ferrySpeed = o.ferry ?? meta.options.ferry;
  const flame = o.flame ?? meta.options.flame;

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

  // the figure stands on a star-shaped fort and a stepped pedestal: CX its axis
  const CX = 92;
  const PEDESTAL_TOP = 58, PEDESTAL_BOT = 74;
  const FIGURE_TOP = 16, FIGURE_FEET = PEDESTAL_TOP;
  const TORCH = [CX + 7, 14];

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        let cr = 0.03, cg = 0.06, cb = 0.14;
        // the dusk sky: deep blue, paler toward the horizon, city glow far right
        const horizon = 74;
        const v = clamp(y / horizon);
        cr = mix(0.02, 0.05, v), cg = mix(0.04, 0.09, v), cb = mix(0.09, 0.22, v);
        const cityGlow = Math.max(0, 1 - Math.abs(x - 160) / 60) * Math.exp(-(horizon - y) / 18) * 0.5;
        cr += cityGlow * 0.55, cg += cityGlow * 0.3, cb += cityGlow * 0.2;
        // a few stars, well clear of the island
        const s = hash(x * 7 + 3, r * 11);
        if (s > 0.9965 && y < 40 && Math.abs(x - CX) > 14) {
          cr = 0.85, cg = 0.9, cb = 1;
        }

        // torch light: one warm wash over everything, falling off with distance
        const tdx = x - TORCH[0], tdy = y - TORCH[1];
        const td = Math.sqrt(tdx * tdx + tdy * tdy);
        const flicker = flame ? 0.92 + 0.08 * noise(t * 7, Math.floor(x / 5), 2) : 1;
        const warm = Math.exp(-td / 62) * flicker;

        if (y >= PEDESTAL_BOT) {
          // the water: deep dusk blue, the torch shivering down in a column
          const wSeed = fbm(x * 0.08, y * 0.14 + Math.floor(t * 3), 2, 0);
          const roadK = Math.exp(-Math.abs(x - CX) / 7) * (0.4 + 0.6 * wSeed);
          cr = 0.03 + 0.04 * wSeed, cg = 0.07 + 0.07 * wSeed, cb = 0.16 + 0.08 * wSeed;
          const shiver = roadK * Math.exp(-(y - PEDESTAL_BOT) / 26) * 1.1;
          cr += shiver * 0.95, cg += shiver * 0.6, cb += shiver * 0.15;
          // the island's low shadow under the pedestal
          if (y < PEDESTAL_BOT + 2 && Math.abs(x - CX) < 26) {
            cr = 0.04, cg = 0.07, cb = 0.1;
          }
          // a ferry: one warm pane lit, moving slowly, leaving its own shiver
          if (ferrySpeed > 0) {
            const fx0 = ((ferrySpeed * t * 6 + 30) % 250) - 30;
            if (Math.abs(x - fx0) < 4 && Math.abs(y - 80) < 1) {
              const stern = x > fx0;
              cr = stern ? 0.9 : 0.7, cg = 0.75, cb = 0.5;
            }
          }
        } else if (y >= PEDESTAL_TOP) {
          // the stone pedestal: stepped blocks, cool grey-blue
          const stepY = Math.floor((y - PEDESTAL_TOP) / 4);
          const taper = 26 - stepY * 2.2;
          const inBlock = Math.abs(x - CX) < taper;
          cr = 0.1, cg = 0.14, cb = 0.2;
          if (inBlock) {
            const edgeLight = (x - (CX - taper)) / (taper * 2);
            cr = mix(0.07, 0.16, edgeLight), cg = mix(0.11, 0.2, edgeLight), cb = mix(0.17, 0.28, edgeLight);
          } else if (Math.abs(x - CX) < taper + 1 && Math.floor((y - PEDESTAL_TOP) / 2) % 2 === 0) {
            cr = 0.08, cg = 0.12, cb = 0.18;
          }
          cr = mix(cr, 0.6, warm * 0.35), cg = mix(cg, 0.5, warm * 0.4), cb = mix(cb, 0.22, warm * 0.4);
        } else if (y >= FIGURE_TOP) {
          // the figure: copper green, grayed by the dusk, arm raised
          const fy = (y - FIGURE_TOP) / (FIGURE_FEET - FIGURE_TOP);
          // the body: a robe's slender taper
          const bodyHalf = mix(6.5, 3.2, clamp(fy)) + (Math.sin(fy * 9) * 0.25);
          const dx = Math.abs(x - CX);
          // her right arm: from the shoulder up to the torch, a little bent
          const armX = CX + mix(3, 7.5, clamp(fy * 1.6 - 0.35));
          const onArm = fy < 0.62 && Math.abs(x - armX) < 1.5 && y < TORCH[1] + 4;
          // her left: the tablet against the body
          const onTablet = dx > bodyHalf * 0.7 && dx < bodyHalf + 2.2 && y > FIGURE_TOP + 16 && y < FIGURE_TOP + 26;
          if (dx < bodyHalf || onArm || onTablet) {
            // patina green: lit sides warm, and the torch's gold over all
            const lit = clamp(0.35 + 0.65 * ((x - (CX - bodyHalf)) / (bodyHalf * 2)));
            const robe = noise(x * 0.7, y * 0.5, 2) * 0.3;
            cr = 0.32 * lit + 0.08 * robe;
            cg = 0.46 * lit + 0.1 * robe;
            cb = 0.34 * lit + 0.07 * robe;
          }
          // the crown: spikes and band
          if (fy < 0.14) {
            const crownY = FIGURE_TOP + 5;
            if (Math.abs(y - crownY) < 1.6 && dx < 5.5) {
              cr = 0.36, cg = 0.5, cb = 0.38;
            } else if (y < crownY && y > crownY - 5 && dx < 6.2) {
              const spike = Math.abs(((dx * 2) % 3) - 1.5) < 0.5;
              if (spike) cr = 0.3, cg = 0.42, cb = 0.32;
            }
          }
        }

        // the torch flame itself: the one saturated gold in the scene
        if (Math.abs(x - TORCH[0]) < 2.2 && Math.abs(y - TORCH[1]) < 3.5) {
          const f = noise(x * 2 + t * 5, y * 2 - t * 9, 2);
          cr = 0.98, cg = 0.8 + 0.15 * f, cb = 0.55 * f;
        }

        // the ferry's running lights, a small warm shiver in their wake
        if (y >= 88) {
          const dx2 = Math.abs(x - CX);
          if (dx2 < 9 && y < 92) {
            const wSeed = fbm(x * 0.08, y * 0.14 + Math.floor(t * 3), 2, 0);
            cr += (1 - y / 92) * 0.05 * wSeed;
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
