/*
 * colosseum: the Flavian Amphitheatre in late-day Roman gold. The broken
 * ring fills the frame's width, its three arcaded storeys climbing to the
 * jagged upper edge where the storm-hearted stone has crumbled away. The
 * low sun lights the outer shell on one side while the arcade's shadow
 * marches through each arch, and the arena's sand floor shows through the
 * great broken-eye opening in the middle.
 */
import type { Frame, Meta } from "../types.ts";

export interface ColosseumOptions {
  [key: string]: unknown;
  /** The sun's side of the shell */
  sunX: number;
}

export const meta = {
  name: "colosseum",
  category: "scenes",
  note: "broken ring at golden hour: arcaded storeys, the arena showing through",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#1b130c",
  options: {
    sunX: 40,
  },
  params: {
    sunX: { label: "sun position", min: 10, max: 90, step: 1 },
  },
  palette: [
    "#1b130c", "#2e2013", "#4a3220", "#6a4a2c", "#8d6a42",
    "#b08a5a", "#d0ab74", "#e6c894", "#f4dda9", "#fcf0cf",
    "#ffffff",
  ],
} satisfies Meta<ColosseumOptions>;

const W = 200, H = 100;

function hash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise(x: number, y: number, period: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  let x0 = ((xi % period) + period) % period, x1 = (x0 + 1) % period;
  const fx2 = x - xi, fy2 = y - yi;
  const u = fx2 * fx2 * (3 - 2 * fx2), v = fy2 * fy2 * (3 - 2 * fy2);
  const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);

export default function colosseum(o: Partial<ColosseumOptions> = {}): Frame {
  const SUNX = o.sunX ?? meta.options.sunX;
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

  // the amphitheatre: an ellipse seen slightly from above.
  // center (100, 58), outer rx 84, ry 34; the crater (arena) rx 46, ry 17.
  const CX = 100, CY = 58;
  const ROX = 84, ROY = 34;
  const RIX = 46, RIY = 17;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the roman dusk sky: soft warm gold toward the sun, cooler away
        // a slow light pulse rides the sun side, so the scene breathes
        const pulse = 0.92 + 0.08 * Math.sin((t / meta.loop) * Math.PI * 2);
        const near = clamp(1 - Math.abs(x - SUNX) / 130) * pulse;
        let cr = mix(0.09, 0.16 + 0.4 * near, clamp(1 - y / 60));
        let cg = mix(0.06, 0.12 + 0.3 * near, clamp(1 - y / 60));
        let cb = mix(0.1, 0.14 + 0.22 * near, clamp(1 - y / 60));

        const ex = (x - CX) / ROX;
        const ey = (y - CY) / ROY;
        const dist = ex * ex + ey * ey;
        const ix = (x - CX) / RIX;
        const iy = (y - CY) / RIY;
        const dIn = ix * ix + iy * iy;

        if (dist < 1) {
          // outer shell or arena opening
          let tone = 0.34 + noise(x * 0.4, y * 0.4, 2) * 0.08;
          // the sunlit face: warmest where facing the sun's x
          const sunSide = clamp(1 - Math.abs(x - SUNX) / ROX * 0.8);
          // arcade shading: three storeys of arches, plus attic
          const storeyY = (y - (CY - ROY)) / (2 * ROY);
          const bandN = storeyY < 0.12 ? 3 : storeyY < 0.42 ? 1 : storeyY < 0.7 ? 2 : 3;
          // arch openings: repeating, only on the front arc (visible shell)
          const front = y > CY - 6; // the arc we see from outside
          const archW = 9;
          const archA = Math.abs(((x / archW) % 1) - 0.5);
          const inArch = front && archA < 0.32 && storeyY > 0.06 && storeyY < 0.78;
          // crumbled top: the jagged upper edge, on the left of frame only
          const jag = hash(Math.floor(x / 3), 7) > 0.5;
          const topEdge = CY - ROY + (x > 30 && x < 130 && jag ? 8 : storeyY < 0.1 ? 0 : 0);
          if (y < topEdge) {
            cr = 0.09, cg = 0.06, cb = 0.1;
          } else if (inArch) {
            // the arch recess: darker, but with a warm bounce from the sand
            cr = tone * 0.55, cg = tone * 0.5, cb = tone * 0.4;
            const bounce = clamp(1 - Math.abs(y - (CY + 10)) / 20);
            cr += bounce * 0.2, cg += bounce * 0.14, cb += bounce * 0.1;
          } else if (dIn < 1) {
            // arena: hypogeum walls and sand
            const sandy = 0.5 + 0.15 * noise(x * 0.3, y * 0.3, 3);
            cr = sandy, cg = sandy * 0.9, cb = sandy * 0.7;
            // the hypogeum: a cross of dark walls under the broken floor
            const wall = Math.abs(x - CX) < 2 || Math.abs(y - CY) < 1.5;
            if (wall) cr *= 0.35, cg *= 0.35, cb *= 0.35;
          } else {
            // the shell stone itself
            let sh = tone * (0.6 + 0.5 * sunSide);
            cr = sh * 1.15, cg = sh * 0.95, cb = sh * 0.8;
            // stone courses
            const course = Math.abs(((y * 0.7) % 2.4) - 1.2) < 0.3;
            if (course) cr *= 0.88, cg *= 0.88, cb *= 0.9;
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
