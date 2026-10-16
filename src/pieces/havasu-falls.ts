/*
 * havasu falls: the canyon at high day. Red rock walls close the sky to a
 * bright slot while Havasu Creek's famous falls drop over a mineral
 * apron into turquoise water, the green cottonwoods crowd the banks, and
 * the mist coming off the plunge pool drifts in the redirected light.
 */
import type { Frame, Meta } from "../types.ts";

export interface HavasuOptions {
  [key: string]: unknown;
  /** How the mist drifts. */
  mist: number;
}

export const meta = {
  name: "havasu falls",
  category: "scenes",
  note: "falls over their mineral apron, red walls, turquoise pool, mist",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#5a2016",
  options: {
    mist: 1,
  },
  params: {
    mist: { label: "mist drift", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#3a130c", "#5c2014", "#7c3320", "#a04d2c", "#c26a3c",
    "#d98c5a", "#e9b584", "#f2d4ae", "#f8ecd2", "#ffffff",
    "#1c6a6e", "#2f9aa0", "#5fc4c6", "#9fe6e4",
  ],
} satisfies Meta<HavasuOptions>;

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

export default function havasuFalls(o: Partial<HavasuOptions> = {}): Frame {
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

  // the walls: a red canyon slot, opening to a bright sky at x 70..130
  const WALL_L = (y: number): number => 64 - y * 0.5;  // left wall's inner edge
  const WALL_R = (y: number): number => 136 + y * 0.4; // right wall's inner edge
  const FALL_TOP = 30, POOL = 72;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      const mistDrift = (t * mistSpeed * 0.4) % 14;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // the sky visible in the slot: hot pale blue
        let cr = 0.5, cg = 0.72, cb = 0.9;
        const inSlot = x > WALL_L(y) && x < WALL_R(y);

        if (!inSlot) {
          // red canyon wall: layered sandstone, sunlit or shaded
          const layers = Math.abs(((x + y * 0.4) * 0.08) % 1 - 0.5) * 2;
          const grain = noise(x * 0.3, y * 0.3, 3);
          let g = 0.3 + 0.4 * layers * 0.5 + grain * 0.12;
          // walls lit on the sun's inner edge, deep red in shade
          const sunEdge = x < WALL_L(y) ? (x - WALL_L(y)) / 40 : (x - WALL_R(y)) / 40;
          g = mix(g * 0.4, g, clamp(0.5 + 0.5 * sunEdge));
          cr = g * 1.25, cg = g * 0.5, cb = g * 0.32;
        } else {
          const waterX = 88;

          // the falls: a falling white green-tinged sheet over the apron
          if (y > FALL_TOP + 8 && y < POOL) {
            const fallK = (y - FALL_TOP - 8) / (POOL - FALL_TOP - 8);
            const twist = noise(x * 0.3, y * 0.14 - t * mistSpeed * 0.8, 2);
            const inFall = x > waterX - 12 + twist * 2 && x < waterX + 12 + twist * 2;
            if (inFall) {
              // streaked falling water, bright white at the lip
              const streak = noise(x * 0.8, (y + t * mistSpeed * 3) * 0.3, 2);
              let w = 0.85 + 0.15 * streak - fallK * 0.08;
              cr = w * 0.9, cg = w, cb = w * 0.96;
            }
          }
          // the mineral apron: travertine terraces, cream rounded
          if (y > POOL - 6 && y < POOL) {
            const apronX = x > waterX - 26 && x < waterX + 26;
            if (apronX) {
              const terrace = Math.abs(((y * 1.4 + x * 0.2) % 3) - 1.5) < 1.2;
              const g = terrace ? 0.86 : 0.74;
              cr = g, cg = g, cb = g * 0.9;
            }
          }

          // the turquoise pool: unreal blue-green, mist over it
          if (y >= POOL) {
            const dz = y - POOL;
            const swirl = noise(x * 0.08, dz * 0.12 + t * mistSpeed * 0.3, 3);
            let tc = 0.35 + 0.4 * clamp(swirl * 1.5 - 0.25);
            cr = tc * 0.35, cg = tc * 0.95, cb = tc * 0.9;
            // the sun's bright patch on the pool
            const patch = Math.max(0, 1 - Math.abs(x - 96) / 26);
            cr += patch * 0.2, cg += patch * 0.25, cb += patch * 0.15;
          }

          // the mist rising off the plunge pool, drifting
          const mistK = clamp((POOL - 4 - y) / 30 + 0.7) * noise(x * 0.05, y * 0.08 + mistDrift * 0.5, 4);
          if (y > POOL - 22 && y < POOL + 4) {
            const mc = clamp((mistK - 0.45) * 1.8);
            if (mc > 0.05) {
              cr = mix(cr, 0.92, mc * 0.65), cg = mix(cg, 0.95, mc * 0.65), cb = mix(cb, 0.92, mc * 0.65);
            }
          }

          // cottonwoods: bunches of flat green along the banks
          const treeBand = y > 56 && y < 72;
          const treeX = (x > WALL_L(y) && x < waterX - 30) || (x > waterX + 30 && x < WALL_R(y));
          if (treeBand && treeX) {
            const leafy = noise(x * 0.5, y * 0.5, 2);
            if (leafy > 0.3) {
              const g = 0.2 + leafy * 0.3;
              cr = g * 0.6, cg = g * 1.2, cb = g * 0.5;
            }
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
