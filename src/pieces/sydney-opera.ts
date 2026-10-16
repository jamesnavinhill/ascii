/*
 * sydney opera: the shells at sunset, seen across the harbour. The white
 * roofs overlap like sails on their low platform, the low sun catches their
 * western edges while the east faces go cool, the water carries it all in
 * long broken shards, and the city bridge sits far off behind.
 */
import type { Frame, Meta } from "../types.ts";

export interface SydneyOptions {
  [key: string]: unknown;
  /** Where the sun sits along the horizon. */
  sunX: number;
  /** The water's ripple speed. */
  ripple: number;
}

export const meta = {
  name: "sydney opera",
  category: "scenes",
  note: "the shells at sunset, their edges lit, the harbour carrying shards",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#0a1826",
  options: {
    sunX: 158,
    ripple: 1,
  },
  params: {
    sunX: { label: "sun position", min: 130, max: 185, step: 1 },
    ripple: { label: "water ripple", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#071827", "#102b3d", "#1c4558", "#326477", "#648b94",
    "#b7c9c6", "#dce0d5", "#f0e9d5", "#f2c17b", "#ffd98c",
    "#fff0c8", "#ffffff",
  ],
} satisfies Meta<SydneyOptions>;

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
const smooth = (a: number, b: number, v: number) => {
  const k = clamp((v - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);

export default function sydneyOpera(o: Partial<SydneyOptions> = {}): Frame {
  const SUNX = o.sunX ?? meta.options.sunX;
  const rippleSpeed = o.ripple ?? meta.options.ripple;

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

  // the building sits left of centre on its platform, three shells shown
  const PLATFORM = 64; // the deck's top row
  // each shell: a leaning ellipse arc from its base to its peak
  const SHELLS = [
    { cx: 52, base: PLATFORM, peak: 30, half: 17, lean: -6 },
    { cx: 78, base: PLATFORM, peak: 38, half: 15, lean: 5 },
    { cx: 100, base: PLATFORM, peak: 34, half: 13, lean: 10 },
  ];

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      const dy = Math.max(0, y - PLATFORM);
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        let cr = 0.03, cg = 0.07, cb = 0.12;
        // the sunset sky: amber toward the sun, blue-violet away
        const near = clamp(1 - Math.abs(x - SUNX) / 150);
        const v = clamp(y / PLATFORM);
        cr = mix(0.03, 0.30 + 0.3 * near, Math.pow(v, 0.9));
        cg = mix(0.06, 0.22 + 0.28 * near, Math.pow(v, 0.9));
        cb = mix(0.12, 0.14 + 0.16 * near, Math.pow(v, 0.9));
        // the sun itself, just at the roofline's height
        const sd = Math.sqrt((x - SUNX) ** 2 + (y - 28) ** 2);
        if (sd < 6) {
          const e = sd / 6;
          cr = mix(1, 0.85, e), cg = mix(0.85, 0.5, e), cb = mix(0.5, 0.25, e);
        }

        // the far shore and its bridge, right of frame
        if (y > 24 && y < 30 && x > 168) {
          const hump = Math.abs(x - 184) > 2 && y > 26;
          if (hump) cr = 0.05, cg = 0.08, cb = 0.14;
          else cr = 0.1, cg = 0.14, cb = 0.2;
        }

        // the shells: each is a pair of arcs; inside them is white shell, the
        // sun's side warm and the far side cool; the ribs run faintly through
        for (const s of SHELLS) {
          // an arc: ellipse centred below the platform height, leaning
          const ry = s.base - s.peak;
          const rx = s.half;
          const eR = 1.15;
          const nx = (x - s.cx) / rx, ny = (y - (s.base - ry * 0.28)) / (ry * eR);
          const d2 = nx * nx + ny * ny;
          const inShell = d2 < 1 && y < s.base && y > s.base - ry * 1.12;
          if (inShell) {
            // white shell, warm on the sun's side, cool on the far side
            const lit = clamp(0.5 + 0.5 * Math.sign(x - s.cx - s.lean) * near * 2);
            const tile = noise(x * 0.3, y * 0.3, 2) * 0.06;
            cr = mix(0.62, 0.98, lit) + tile;
            cg = mix(0.66, 0.96, lit) + tile;
            cb = mix(0.72, 0.9, lit) + tile * 0.5;
            if (lit > 0.9) {
              cr = mix(cr, 1, 0.3), cg = mix(cg, 0.9, 0.25), cb = mix(cb, 0.7, 0.2);
            }
            // the fan ribs: strokes along the arc's direction
            const ang = Math.atan2(y - (s.base - ry * 0.28), x - s.cx);
            const rib = Math.abs((ang * 14) % Math.PI / 14 - 0.5) < 0.28;
            if (rib) cr *= 0.92, cg *= 0.92, cb *= 0.94;
            // glass between shells: darker
            if (y > s.base - 6) cr *= 0.6, cg *= 0.65, cb *= 0.75;
            break;
          }
        }

        // the platform the shells sit on
        if (y >= PLATFORM && y < PLATFORM + 4) {
          cr = 0.3, cg = 0.34, cb = 0.38;
          if (y < PLATFORM + 1) cr = 0.5, cg = 0.52, cb = 0.55;
        }

        // the water: everything mirrored, broken by ripples into shards
        if (y >= PLATFORM + 4) {
          const dz = y - PLATFORM;
          const rowSeed = Math.floor(x / 6 + fbm(x * 0.05, (dz + t * 4 * rippleSpeed) * 0.08, 2, 8) * 6);
          const shard = hash(rowSeed, Math.floor(dz + t * rippleSpeed * 3)) > 0.35 ? 1 : 0.6;
          const mirrorK = clamp(1 - dz / 40);
          // the sky's mirror first, then the shells' white column
          const skyM = [0.3, 0.28, 0.34];
          let mcr = skyM[0] * (0.5 + 0.5 * near), mcg = skyM[1] * (0.5 + 0.5 * near), mcb = skyM[2];
          for (const s of SHELLS) {
            const away = Math.abs(x - s.cx) < s.half * 1.2;
            if (away) {
              const lit = clamp(0.4 + 0.6 * Math.sign(x - s.cx - s.lean) * near);
              mcr = mix(0.35, 0.85, lit), mcg = mix(0.4, 0.85, lit), mcb = mix(0.45, 0.8, lit);
            }
          }
          // the sun's own column runs straight down
          const sunRoad = Math.exp(-(((x - SUNX) / 5) ** 2));
          mcr += sunRoad * 0.8, mcg += sunRoad * 0.5, mcb += sunRoad * 0.1;
          cr = mix(cr, mcr, mirrorK * shard), cg = mix(cg, mcg, mirrorK * shard), cb = mix(cb, mcb, mirrorK * shard);
          // open water darkens with depth
          const deep = smooth(30, 46, dz);
          cr *= 1 - deep * 0.4, cg *= 1 - deep * 0.35, cb *= 1 - deep * 0.25;
        }

        halftone(k, r, x, clamp(cr), clamp(cg), clamp(cb), color);
      }
    }
    const lines: string[] = [];
    for (let r = 0; r < H; r++) lines.push(out.slice(r * W, (r + 1) * W).join(""));
    return lines.join("\n");
  };
}
