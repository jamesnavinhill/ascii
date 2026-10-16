/*
 * iguazu: devils throat at full volume. Where the river's whole plateau
 * pours off a curved amphitheatre edge, the water arrives as a rolling
 * boiling white field — the great U-shape feeding from the left swallow
 * the frame's centre — and the mist it throws up soaks the whole gorge in
 * a wet glare out of which the jungle meets the sky.
 */
import type { Frame, Meta } from "../types.ts";

export interface IguazuOptions {
  [key: string]: unknown;
  /** How the mist rolls. */
  mist: number;
}

export const meta = {
  name: "iguazu",
  category: "scenes",
  note: "devils throat: the boiling white field of water, mist in the gorge",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#1e3626",
  options: {
    mist: 1,
  },
  params: {
    mist: { label: "mist roll", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#0d1810", "#1e3626", "#2a4a34", "#3a6242", "#4f7c54", "#6c985e",
    "#95b76f", "#bad78e", "#dcedb4", "#ecf2cf", "#f6f9e4",
    "#fbfdf0", "#ffffff",
  ],
} satisfies Meta<IguazuOptions>;

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

export default function iguazu(o: Partial<IguazuOptions> = {}): Frame {
  const mistSpeed = o.mist ?? meta.options.mist;

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

  // the amphitheatre: the lip runs across with a deep U dipping at center
  const LIP = (x: number): number => 38 - 8 * Math.exp(-(((x - 100) / 42) ** 2));
  const GORGE = 86;

  return (t, { color } = {}) => {
    const mistDrift = (t * mistSpeed * 0.5) % 12;
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the sky carried above the falls, hot washed white a little above
        const v = clamp(y / 34);
        let cr = mix(0.66, 0.72, v), cg = mix(0.78, 0.86, v), cb = mix(0.86, 0.94, v);

        const lipY = LIP(x);
        // the far river feeding the edge: broad, channeled
        if (y < lipY) {
          // upstream jungle shadows and steel water behind the lip
          if (x > 150) {
            // woods on the right bank
            const leafy = noise(x * 0.4, y * 0.4, 2);
            const g = 0.16 + 0.26 * leafy;
            cr = g * 0.7, cg = g * 1.15, cb = g * 0.6;
          } else {
            // the flat plateau of the river, wind-streaked
            const chop = fbm(x * 0.06, y * 0.1 + t * mistSpeed * 0.2, 2, 0);
            const g = 0.55 + 0.25 * chop;
            cr = g * 0.9, cg = g, cb = g;
          }
        }

        // the falls themselves: from the lip down to the gorge floor
        if (y >= lipY && y < GORGE) {
          const dz = y - lipY;
          // the boiling field: white columns with green shadows between
          const col = noise(x * 0.5, (y + t * mistSpeed * 3.2) * 0.35, 2);
          const col2 = fbm(x * 0.2, (y + t * mistSpeed * 4.5) * 0.16, 2, 2);
          let w = 0.78 + 0.22 * col - 0.16 * col2;
          // a lower spill of the cascade on the light side (longer tail)
          const spill = clamp(1.1 - Math.abs(x - 62) / 22) * clamp(dz / 12);
          cr = w * 0.94, cg = w * 1.02, cb = w * 0.9;
          // the vertical shadows of the mortar joints and steps
          const shadeCol = (Math.floor(x / 7) * 7919 + Math.floor(x / 13)) % 3 === 0;
          if (shadeCol) cr *= 0.82, cg *= 0.84, cb *= 0.86;
          if (spill > 0.5) {
            cr = mix(cr, 0.85, 0.35), cg = mix(cg, 0.95, 0.35), cb = mix(cb, 0.85, 0.35);
          }
        }

        // the gorge: a green canal fed by the falls' foam
        if (y >= GORGE) {
          const dz = y - GORGE;
          const foam = noise(x * 0.09, dz * 0.12 + t * mistSpeed, 2);
          let g = 0.26 + 0.32 * foam;
          cr = g * 0.9, cg = g, cb = g * 0.85;
          // foam rafts drifting down the middle of the gorge
          if (hash(Math.floor(x / 5), Math.floor(dz * 1.6 + t * mistSpeed)) > 0.8) {
            cr = mix(cr, 0.9, 0.6), cg = mix(cg, 0.94, 0.6), cb = mix(cb, 0.88, 0.6);
          }
        }

        // the mist: a rolling cushion over the gorge that eats the falls' feet
        const mistK = clamp((GORGE - 6 - y) / 34 + 0.75) * clamp(0.4 + 0.6 * noise(x * 0.04, y * 0.07 + mistDrift, 4));
        if (y > 62) {
          const mc = clamp((mistK - 0.45) * 1.5);
          if (mc > 0.05) {
            cr = mix(cr, 0.95, mc * 0.7), cg = mix(cg, 0.97, mc * 0.7), cb = mix(cb, 0.94, mc * 0.7);
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
