/*
 * giza: the Great Pyramid at dusk. Kufu's hill of stone rises from the
 * plateau, one edge still lit amber by the low sun while the west face has
 * already gone violet, and the whole thing stands over a hard-edged dune
 * field that catches the sky in bands. A camel caravan crosses far off as
 * black marks, and the second pyramid peeks behind at the right of frame.
 */
import type { Frame, Meta } from "../types.ts";

export interface GizaOptions {
  [key: string]: unknown;
  /** Where the sun sits along the horizon. */
  sunX: number;
  /** How fast the caravan walks. */
  caravan: number;
}

export const meta = {
  name: "giza pyramid",
  category: "scenes",
  note: "the Great Pyramid at dusk, one edge amber, dunes in bands of light",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#151020",
  options: {
    sunX: 60,
    caravan: 1,
  },
  params: {
    sunX: { label: "sun position", min: 30, max: 130, step: 1 },
    caravan: { label: "caravan speed", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#151020", "#241a30", "#3b2a44", "#5c3d55", "#8a5c62",
    "#b9846e", "#d9ad8a", "#f0d4a4", "#fce7bd", "#fff6d8",
    "#ffffff",
  ],
} satisfies Meta<GizaOptions>;

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

export default function giza(o: Partial<GizaOptions> = {}): Frame {
  const SUNX = o.sunX ?? meta.options.sunX;
  const caravan = o.caravan ?? meta.options.caravan;

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

  // the Great Pyramid: apex near x=88, base from 48 to 128, top at y=18
  // the lit face is the east one (toward SUNX), the other in half-shadow
  const PX = 88, PY = 18, PL = 48, PR = 128;
  const HORIZON = 62;
  // the second pyramid, smaller and behind, to the right
  const PX2 = 148, PY2 = 34, PL2 = 126, PR2 = 170;

  return (t, { color } = {}) => {
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        let cr = 0.09, cg = 0.06, cb = 0.12;

        // ---- dusk sky: near-black at the top, a hot amber band near the sun
        const v = clamp(y / HORIZON);
        const near = clamp(1 - Math.abs(x - SUNX) / 110) * clamp(1.15 - v);
        cr = mix(0.02, 0.34 + 0.5 * near, Math.pow(v, 2.1));
        cg = mix(0.015, 0.2 + 0.4 * near, Math.pow(v, 2.1));
        cb = mix(0.04, 0.26 + 0.2 * near, Math.pow(v, 2.1));
        // stars: tiny hard points in the upper dark
        if (y < 30 && hash(x, y * 3 + 1) > 0.9985) {
          cr = 0.85, cg = 0.85, cb = 0.9;
        }

        // ---- the far pyramid, behind
        if (y > PY2) {
          const lx = PL2 + (PX2 - PL2) * (y - PY2) / (HORIZON - PY2);
          const rx = PR2 + (PX2 - PR2) * (y - PY2) / (HORIZON - PY2);
          if (x > lx && x < rx) {
            const lit = x > PX2 ? 0.35 : 0.6;
            cr = mix(0.18, 0.4, lit), cg = mix(0.12, 0.28, lit), cb = mix(0.2, 0.3, lit);
          }
        }

        // ---- the Great Pyramid: two faces meeting at the ridge
        if (y > PY && y < HORIZON) {
          const lx = PL + (PX - PL) * (y - PY) / (HORIZON - PY);
          const rx = PR + (PX - PR) * (y - PY) / (HORIZON - PY);
          if (x > lx && x < rx) {
            // block courses: faint horizontal stepping
            const course = Math.abs(((y - PY) % 3.2) - 1.6) < 0.35;
            const sideK = x < PX ? 0 : 1;
            // the sun-facing edge gets amber light, the away face violet
            const warm = sideK === 0 ? clamp(1 - Math.abs(lx - SUNX) / 90) : clamp(1 - Math.abs(rx - SUNX) / 90);
            let base = 0.32 + 0.55 * (sideK === 0 ? warm * 0.9 : warm * 0.2);
            base *= 0.92 + 0.08 * noise(x * 0.5, y * 0.5, 2);
            if (course) base *= 0.88;
            cr = base * mix(0.85, 1, warm), cg = base * mix(0.6, 0.9, warm), cb = base * mix(0.9, 0.65, warm);
            // a hard bright rim on the sun-lit slope
            if (sideK === 0 || SUNX > PX) {
              if (Math.abs((sideK === 0 ? lx : rx) - SUNX) < 30) {
                cr = mix(cr, 0.95, 0.4), cg = mix(cg, 0.8, 0.4), cb = mix(cb, 0.5, 0.4);
              }
            }
          }
        }

        // ---- the dunes: hard banded light from horizon down
        if (y >= HORIZON) {
          const dz = y - HORIZON;
          const ripple = fbm(x * 0.04, dz * 0.1, 2, 8);
          const ridge = Math.abs(((x * 0.06 + ripple * 14) % 20) - 10);
          // dune faces: lit side catches sky bands, slip face dark
          const band = clamp(1 - dz / 34);
          const face = ridge > 10 ? 0 : (ridge / 10);
          let dcr = 0.13 + 0.62 * face * face * band + 0.2 * band;
          let dcg = 0.09 + 0.5 * face * face * band + 0.16 * band;
          let dcb = 0.16 + 0.5 * face * band + 0.2 * band;
          // the caravan: black camel marks crossing at y ≈ HORIZON+10
          const camY = HORIZON + 8;
          if (y > camY - 2 && y < camY + 2) {
            const cx = Math.floor(x - (t * 12 * caravan) % 240);
            if ((cx % 22) === 0 || (cx % 22) === 1) {
              dcr = 0.06, dcg = 0.05, dcb = 0.08;
            }
          }
          cr = dcr, cg = dcg, cb = dcb;
        }

        halftone(k, r, x, clamp(cr), clamp(cg), clamp(cb), color);
      }
    }
    const lines: string[] = [];
    for (let r = 0; r < H; r++) lines.push(out.slice(r * W, (r + 1) * W).join(""));
    return lines.join("\n");
  };
}
