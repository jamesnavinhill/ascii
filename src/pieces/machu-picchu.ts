/*
 * machu picchu: dawn over the citadel. The terraced stone city rides its
 * saddle between Huayna Picchu's tall green cone and the ridge behind, the
 * morning mist fills the Urubamba valley below and runs between the peaks,
 * and the first light touches the haut stones warm while the cloud sits
 * gray-green in the gorge.
 */
import type { Frame, Meta } from "../types.ts";

export interface MachuOptions {
  [key: string]: unknown;
  /** How fast the mist boils up the valley. */
  mist: number;
}

export const meta = {
  name: "machu picchu",
  category: "scenes",
  note: "dawn over the terraced citadel, Huayna Picchu rising, mist in the gorge",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#101812",
  options: {
    mist: 1,
  },
  params: {
    mist: { label: "mist motion", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#0d1410", "#16221a", "#223425", "#32492f", "#47633c",
    "#658052", "#8ba273", "#b3c39a", "#d4dcbc", "#e8e6c8",
    "#f4e9c0", "#fbf4d8", "#ffffff",
  ],
} satisfies Meta<MachuOptions>;

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

export default function machuPicchu(o: Partial<MachuOptions> = {}): Frame {
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

  // Huayna Picchu: the tall cone, left of the citadel
  const CONE = (x: number): number => {
    const cx = 58;
    if (Math.abs(x - cx) > 30) return 999;
    const u = 1 - Math.abs(x - cx) / 30;
    return 14 + (1 - u * u) * 30;
  };
  // the citadel: terrace steps between x=76 and x=150
  const CITY_TOP = 56;

  return (t, { color } = {}) => {
    const drift = (t * mistSpeed * 0.3) % 16;
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // dawn sky: cool green-grey, warm low on the right
        const w = clamp(1 - y / 40);
        const warmRight = clamp(1 - Math.abs(x - 170) / 90);
        let cr = mix(0.09, 0.34 + 0.2 * warmRight, w);
        let cg = mix(0.11, 0.36 + 0.16 * warmRight, w);
        let cb = mix(0.13, 0.4 + 0.1 * warmRight, w);

        // the back ridge: dark treeline behind the city
        const ridgeY = 48 + noise(x * 0.04, 9, 3) * 6;
        if (y > ridgeY && y < CITY_TOP + 20 && x < 190) {
          const g = 0.1 + noise(x * 0.3, y * 0.3, 2) * 0.08;
          cr = g * 0.7, cg = g * 1.15, cb = g * 0.65;
        }

        // Huayna Picchu cone: forest-green with mist at its base
        const coneY = CONE(x);
        if (y > coneY && y < 84) {
          const elev = clamp((y - coneY) / 44);
          const steep = noise(x * 0.4, y * 0.4, 2);
          let g = 0.34 + 0.22 * steep;
          // its peak catches the first light
          g = mix(g, 0.5 + 0.3 * steep, clamp(1 - elev * 4));
          cr = g * 0.75, cg = g * 1.1, cb = g * 0.7;
          // the mound's terraces on the flank
          if (x > 40 && x < 76 && y > 58 && Math.abs(((y - 58) * 0.8) % 2) < 0.4) {
            g *= 0.9;
            cr = g * 0.75, cg = g * 1.1, cb = g * 0.7;
          }
        }

        // the citadel: terraces toward the viewer, stone glinting warm
        if (x > 76 && x < 150 && y > CITY_TOP && y < 84) {
          const ty = (y - CITY_TOP) / (84 - CITY_TOP);
          // terraces: alternating grass ledge and stone step
          const stepI = Math.floor(ty * 9);
          const inStep = ty * 9 - stepI;
          const lit = clamp(0.4 + 0.6 * ((x - 76) / 74));
          if (inStep < 0.55) {
            // the stone wall of each terrace, catching dawn light
            let g = (0.5 + 0.2 * lit) * (0.9 + 0.1 * noise(x * 0.7, y * 0.7, 2));
            cr = g, cg = g * 0.98, cb = g * 0.85;
          } else {
            // the grass top of the terrace
            let g = 0.3 + 0.16 * noise(x * 0.3, stepI * 3, 2);
            g = mix(g, 0.62, lit * 0.6);
            cr = g * 0.8, cg = g * 1.05, cb = g * 0.68;
          }
        }

        // the mist: boiling in the valley floor, drifting between peaks
        const mistD = fbm(x * 0.03, y * 0.05 + drift, 2, 8);
        const valleyMist = clamp((y - 62) / 30) * clamp(1 - Math.abs(x - 110) / 130) * clamp(mistD * 1.6 - 0.35);
        if (valleyMist > 0.02) {
          const mc = 0.75 + 0.1 * mistD;
          cr = mix(cr, mc * 0.97, clamp(valleyMist * 1.4)), cg = mix(cg, mc * 1.02, clamp(valleyMist * 1.4)), cb = mix(cb, mc * 0.98, clamp(valleyMist * 1.4));
        }

        halftone(k, r, x, clamp(cr), clamp(cg), clamp(cb), color);
      }
    }
    const lines: string[] = [];
    for (let r = 0; r < H; r++) lines.push(out.slice(r * W, (r + 1) * W).join(""));
    return lines.join("\n");
  };
}
