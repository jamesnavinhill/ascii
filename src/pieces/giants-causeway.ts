/*
 * giants causeway: the basalt columns at sunset. The steps run from the
 * sand down to the sea in that famous hex jumble, their tops catching the
 * last orange light on thousands of close-packed knuckles, the foam surging
 * green-white over the lowest steps, and the Atlantic behind sits dark with
 * a long warm road of reflected light.
 */
import type { Frame, Meta } from "../types.ts";

export interface CausewayOptions {
  [key: string]: unknown;
  /** How fast the foam surges. */
  surge: number;
}

export const meta = {
  name: "giants causeway",
  category: "scenes",
  note: "basalt columns at sunset, foam surging over the lowest steps",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#241418",
  options: {
    surge: 1,
  },
  params: {
    surge: { label: "foam surge", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#241418", "#35201c", "#4c2f24", "#663f2c", "#82553a",
    "#a1714e", "#bf8f68", "#d8ae8a", "#ecc9a8", "#f8e4c8",
    "#fff6e0", "#ffffff",
  ],
} satisfies Meta<CausewayOptions>;

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

export default function giantsCauseway(o: Partial<CausewayOptions> = {}): Frame {
  const surge = o.surge ?? meta.options.surge;

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

  const HORIZON = 30;
  // the columns: the shore reaches the water line about y=74
  const SHORE = 74;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the sunset sky: dark red low, orange band, warm haze above
        const v = clamp(y / HORIZON);
        const warm = clamp(1 - y / HORIZON);
        let cr = mix(0.3 + 0.3 * v, 0.55, warm);
        let cg = mix(0.12 + 0.2 * v, 0.34, warm);
        let cb = mix(0.1 + 0.12 * v, 0.24, warm);
        // sun: just clipped by the horizon at x=120
        const sd = Math.sqrt((x - 120) ** 2 + (y - HORIZON + 2) ** 2);
        if (sd < 4 && y < HORIZON) {
          const e = sd / 4;
          cr = mix(1, 0.9, e), cg = mix(0.85, 0.55, e), cb = mix(0.4, 0.2, e);
        }

        // the sea: dark green-black, a long warm road from the sun
        if (y >= HORIZON && y < SHORE - 2) {
          const dz = y - HORIZON;
          const chop = noise(x * 0.12, dz * 0.2, 3);
          let sc = 0.07 + 0.05 * chop;
          cr = sc * 0.9, cg = sc * 1.06, cb = sc * 0.95;
          // the light road: wobbling stripes of orange going at the viewer
          const roadK = Math.exp(-Math.abs(x - 120) / (8 + dz * 0.5)) * clamp(1 - dz / 46);
          const stripe = noise(x * 0.3 + t * surge * 0.7, dz * 0.2, 2);
          if (roadK > 0.08 && stripe > 0.45) {
            const rk = roadK * (0.5 + 0.5 * clamp(stripe));
            cr += rk * 0.65, cg += rk * 0.32, cb += rk * 0.08;
          }
        }

        // the causeway: the hex column tops, thousands of knuckles
        if (y >= SHORE - 2 && y < H + 1) {
          const dz = y - SHORE + 2;
          // hex jumble: two offset hex lattices, scaled by depth
          const scale = 0.55 + dz * 0.02;
          const hx = x / (6 * scale), hy = y / (6 * scale);
          // offset every other row: the hex lattice's stagger
          const row = Math.floor(hy);
          const col = Math.floor(hx + (row % 2) * 0.5);
          const cellSeed = hash(col, row);
          // each column top: a lit knuckle with a shadow crack between
          const fx = hx + (row % 2) * 0.5 - Math.floor(hx + (row % 2) * 0.5);
          const fy = hy - row;
          const distC = Math.sqrt((fx - 0.5) ** 2 + (fy - 0.5) ** 2) / 0.7;
          const closer = clamp(1 - distC * 1.15);
          // wet columns shine lower and closer to the foam line
          const wet = clamp((1 - (dz - 6) / 10)) * clamp(1 - dz / 20);
          let g = 0.14 + 0.5 * closer * clamp(0.4 + 0.6 * cellSeed) + 0.06 * noise(x * 0.4, y * 0.4, 2);
          // the sunset light caps every knuckle on its sun side
          g += closer * 0.28 * clamp(1 - Math.abs(x - 120) / 90);
          cr = g * 1.1, cg = g * 0.62, cb = g * 0.4;
          if (wet > 0.3) {
            cr = mix(cr, 0.5, wet * 0.35), cg = mix(cg, 0.5, wet * 0.35), cb = mix(cb, 0.52, wet * 0.35);
          }
          // the foam: surging green-white over the lowest steps
          const foamLine = 3 + noise(x * 0.15, t * surge * 1.1, 2) * 3;
          if (dz < foamLine) {
            const foam = noise(x * 0.3, (y + t * surge * 2.2) * 0.5, 2);
            const fk = clamp((foamLine - dz) / 3) * (0.4 + 0.6 * foam);
            cr = mix(cr, 0.85, fk), cg = mix(cg, 0.9, fk), cb = mix(cb, 0.86, fk);
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
