/*
 * stonehenge: solstice dawn. The sarsen circle stands on the plain at the
 * exact northeast, where the sun between two of the great uprights runs a
 * line straight down the Avenue. The trilithons and lintels catch the very
 * first light on their flanks, dew steams off the grass, and the low sun
 * floods the stone ring's heart while the rest of the plain stays gray.
 */
import type { Frame, Meta } from "../types.ts";

export interface StonehengeOptions {
  [key: string]: unknown;
  /** Haze stirring over the grass. */
  haze: number;
}

export const meta = {
  name: "stonehenge",
  category: "scenes",
  note: "solstice dawn: the sun rising through the ring, dew on the plain",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#20242a",
  options: {
    haze: 1,
  },
  params: {
    haze: { label: "dawn haze", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#20242a", "#2e343c", "#3e4650", "#545c66", "#6f7578",
    "#8f9188", "#acaa96", "#c8c4a4", "#e0d8ac", "#f0e4b4",
    "#faf0bc", "#fff8cc", "#ffffff",
  ],
} satisfies Meta<StonehengeOptions>;

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

export default function stonehenge(o: Partial<StonehengeOptions> = {}): Frame {
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

  const GROUND = 72;
  // the sarsen ring: a broken circle of paired uprights with lintels on top
  // seen slightly from the side: uprights as slabs with gaps
  const UPRIGHTS = [42, 58, 74, 106, 122, 138, 154]; // the back arc, gaps = fallen
  const TRILITHON = [86, 96]; // the big central pair, sun rises between them
  const SUN_X = 91;
  const RING_TOP = 34, RING_BOT = GROUND - 2;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      // haze pulses near the ring's foot each frame
      const steam = noise(0, (y + t * hazeSpeed * 0.5) * 0.1, 2);
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the dawn sky: gray-teal, gold seaming up from the gap
        const v = clamp(y / GROUND);
        const goldUp = Math.max(0, 1 - Math.abs(x - SUN_X) / 46) * clamp(1 - y / (RING_TOP + 6) + 0.25);
        let cr = mix(0.12, 0.34 + 0.42 * clamp(goldUp), v);
        let cg = mix(0.13, 0.34 + 0.36 * clamp(goldUp), v);
        let cb = mix(0.16, 0.38 + 0.2 * clamp(goldUp), v);
        // the sun in the gap: a dull gold disc, low and washed
        const sd = Math.sqrt((x - SUN_X) ** 2 + (y - 46) ** 2);
        if (sd < 5.5) {
          const e = sd / 5.5;
          cr = mix(1, 0.85, e), cg = mix(0.9, 0.6, e), cb = mix(0.5, 0.28, e);
        }

        // the uprights: dark sarsen slabs, gold on the sun-facing edge
        const onStone = (halfW: number, cx: number): boolean => Math.abs(x - cx) < halfW && y > RING_TOP && y < RING_BOT;
        let stone = false;
        let stoneEdge = 0;
        for (const ux of UPRIGHTS) {
          if (onStone(3.4, ux)) {
            stone = true;
            stoneEdge = clamp((x - (ux - 3.4)) / 6.8);
            break;
          }
        }
        // the trilithon pair in front
        let lintel = false;
        for (const tx of TRILITHON) {
          if (onStone(4, tx)) {
            stone = true;
            stoneEdge = clamp((x - (tx - 4)) / 8);
            if (y > RING_TOP && y < RING_TOP + 4) lintel = true;
          }
        }
        // lintel caps over the back arc, where the pair still stands
        for (let i = 0; i < UPRIGHTS.length - 1; i++) {
          const mid = (UPRIGHTS[i] + UPRIGHTS[i + 1]) / 2;
          if (Math.abs(x - mid) < 4.5 && y > RING_TOP - 1 && y < RING_TOP + 3.4) lintel = true;
          if (lintel) break;
        }
        if (stone) {
          const lit = clamp(0.18 + 0.72 * stoneEdge * (0.5 + 0.5 * goldUp));
          const grain = noise(x * 0.6, y * 0.6, 2) * 0.12;
          cr = mix(0.14, 0.92, lit) + grain;
          cg = mix(0.15, 0.88, lit) + grain;
          cb = mix(0.18, 0.74, lit) + grain * 0.8;
          if (lintel) {
            // the lintel catches light on its underside, the interior beam
            cr = mix(cr, 0.95, 0.2), cg = mix(cg, 0.9, 0.2), cb = mix(cb, 0.78, 0.2);
          }
        }

        // the plain: dewy grey-green grass, long shadows from the ring
        if (y >= GROUND) {
          const dz = y - GROUND;
          let g = 0.16 + 0.1 * noise(x * 0.4, y * 0.4, 3);
          cr = g, cg = g * 1.06, cb = g * 0.96;
          // shadows cast by the stones: long, to the right of the sun
          const shadowK = clamp(1 - dz / 16);
          for (const s of [...UPRIGHTS, ...TRILITHON]) {
            if (x > s && x - s < 26) {
              cr *= 1 - 0.5 * shadowK, cg *= 1 - 0.5 * shadowK, cb *= 1 - 0.3 * shadowK;
            }
          }
          // dew steam drifting low, faint gold where the sun reaches
          const steam2 = noise(x * 0.09, (y + t * hazeSpeed * 0.5) * 0.16 + 9, 4);
          if (steam2 > 0.6) {
            const sk = (steam2 - 0.6) * 1.4 * clamp(1 - dz / 24);
            cr = mix(cr, 0.6, sk * 0.7), cg = mix(cg, 0.58, sk * 0.7), cb = mix(cb, 0.5, sk * 0.7);
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
