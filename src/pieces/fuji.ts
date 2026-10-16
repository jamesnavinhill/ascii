/*
 * fuji: the cone above its lake at dawn. The sleeping volcano fills the
 * frame's width with one long, symmetrical line, snow in its summit
 * crater glowing first gold while the body stays violet, the lakefront
 * pines a black row at the foot, and the whole cone drops into the calm
 * water as a perfect downward cone, tiptoeing with every tiny stir.
 */
import type { Frame, Meta } from "../types.ts";

export interface FujiOptions {
  [key: string]: unknown;
  /** Stir of the lake. */
  stir: number;
}

export const meta = {
  name: "fuji",
  category: "scenes",
  note: "the cone at dawn, snow summit glowing, its reflection stirring below",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#1c2038",
  options: {
    stir: 1,
  },
  params: {
    stir: { label: "lake stir", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#1c2038", "#28294a", "#383a5e", "#4c4a70", "#666288",
    "#8c86a0", "#b2acc0", "#d5ccd6", "#e9dbe0", "#f4e6d8",
    "#fbeecf", "#fff4dc", "#ffffff",
  ],
} satisfies Meta<FujiOptions>;

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

export default function fuji(o: Partial<FujiOptions> = {}): Frame {
  const stir = o.stir ?? meta.options.stir;

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

  // the cone: symmetric, flat chunk of a slope, crater at the summit
  const CX = 100;
  const APEX = 20, FOOT = 62;
  // slope: dz/dx of Fuji's near-half
  const halfWidth = (y: number): number => ((y - APEX) / (FOOT - APEX)) * 78;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the dawn sky: thin violet, warm at the summit's left of frame
        const v = clamp(y / FOOT);
        const warmUp = Math.max(0, 1 - Math.abs(x - 78) / 80) * clamp(1 - y / (APEX + 16));
        let cr = mix(0.1, 0.3 + 0.34 * warmUp, v);
        let cg = mix(0.09, 0.26 + 0.3 * warmUp, v);
        let cb = mix(0.22, 0.42 + 0.2 * warmUp, v);
        // a few morning stars at the very top
        if (y < 14 && hash(x * 7 + 3, r * 11) > 0.997) {
          cr = 0.8, cg = 0.85, cb = 1;
        }

        // the cone: violet body with the snow line visible inside
        const hw = halfWidth(y);
        if (Math.abs(x - CX) < hw && y > APEX && y < FOOT) {
          const elev = 1 - (y - APEX) / (FOOT - APEX);
          // snow: from the crater down a third, jagged edge
          const snowEdge = 0.62 + 0.25 * noise(x * 0.25, 7, 2);
          const isSnow = elev > snowEdge && Math.abs(x - CX) < hw * 0.3;
          const rocky = noise(x * 0.3, y * 0.3, 2);
          if (isSnow) {
            // the snow glows gold on the east face, stays blue on the west
            const face = x > CX - hw * 0.1 ? 1 : 0.65;
            const g = (0.62 + 0.2 * rocky) * face;
            cr = g, cg = g * 0.96, cb = g * 0.86;
          } else {
            let g = 0.2 + 0.14 * rocky;
            g = mix(g, 0.4, elev * 0.4);
            cr = g * 0.9, cg = g * 0.85, cb = g * 1.2;
          }
          // the crater's dip at the very summit
          if (y < APEX + 4 && Math.abs(x - CX) < 5) {
            cr *= 0.8, cg *= 0.8, cb *= 0.85;
          }
        }

        // the tree line at the mountain's foot
        if (y > FOOT - 2.5 && y < FOOT + 3) {
          const tree = noise(x * 0.3, 11, 2);
          if (tree > 0.4) {
            const g = 0.09 + tree * 0.07;
            cr = g * 0.6, cg = g * 1.05, cb = g * 0.8;
          }
        }

        // the lake: from the foot down, the cone dropping into it
        if (y >= FOOT + 3) {
          const dz = y - FOOT - 3;
          const wobble = noise(x * 0.09, dz * 0.14 + t * stir * 0.5, 3);
          // mirrored sky: violet, warmer near the horizon
          let mcr = 0.2 + 0.1 * wobble, mcg = 0.18 + 0.1 * wobble, mcb = 0.32 + 0.16 * wobble;
          const mk = clamp(1 - dz / 34);
          cr = mix(cr, mcr, mk), cg = mix(cg, mcg, mk), cb = mix(cb, mcb, mk);
          // the inverted cone: the snow band and body, trembling cut
          const srcY = FOOT + 3 - dz;
          const hwMirror = halfWidth(srcY);
          if (Math.abs(x - CX) < hwMirror && srcY > APEX && srcY < FOOT) {
            const cut = hash(Math.floor(x / 3), Math.floor(dz * 2.4 + t * stir * 1.4)) > 0.3;
            if (cut) {
              const elevM = 1 - (srcY - APEX) / (FOOT - APEX);
              const snowEdgeM = 0.62 + 0.25 * noise(x * 0.25, 7, 2);
              const isSnowM = elevM > snowEdgeM && Math.abs(x - CX) < hwMirror * 0.3;
              const g = isSnowM ? 0.5 : 0.16;
              cr = mix(cr, g, mk * 0.75), cg = mix(cg, g * 0.95, mk * 0.75), cb = mix(cb, isSnowM ? g * 0.85 : g * 1.3, mk * 0.75);
            }
          }
          // a couple of fishing lanterns along the far shore edges
          if (hash(Math.floor(x / 9), 4) > 0.94 && y > FOOT + 5 && y < FOOT + 9) {
            cr = 0.95, cg = 0.8, cb = 0.5;
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
