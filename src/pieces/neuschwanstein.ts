/*
 * neuschwanstein: the fairy-tale castle at alpine dusk. Its white walls
 * and blue-grey roofs climb the wooded crag in stacked tiers — gatehouse,
 * palas, the tall round towers — while the pines below go deep green-blue
 * and the first windows light warm. The Alps beyond stand violet, and one
 * quiet lake lies silver in the valley.
 */
import type { Frame, Meta } from "../types.ts";

export interface NeuschOptions {
  [key: string]: unknown;
  /** Pane-light flicker. */
  flicker: number;
}

export const meta = {
  name: "neuschwanstein",
  category: "scenes",
  note: "the white towers on their wooded crag at dusk, first windows lit",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#131629",
  options: {
    flicker: 1,
  },
  params: {
    flicker: { label: "pane flicker", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#131629", "#1d2238", "#2a3248", "#3c4862", "#3f6a52", "#566180",
    "#7a7f96", "#a3a4b0", "#c9c5c8", "#e6e0dc", "#f4f0ec",
    "#fffaf2", "#e8c878", "#ffd98c", "#ffffff",
  ],
} satisfies Meta<NeuschOptions>;

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

export default function neuschwanstein(o: Partial<NeuschOptions> = {}): Frame {
  const flicker = o.flicker ?? meta.options.flicker;

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

  // the crag: the castle sits on a rocky cone, left-of-centre
  const CRAG = (x: number): number => 44 + 26 * Math.exp(-(((x - 92) / 34) ** 2));
  const LAKE = 84;

  return (t, { color } = {}) => {
    const winFlicker = 0.85 + 0.15 * noise(t * flicker * 2.2, 0, 0);
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        // alpine dusk sky: violet, pale amber in the valley gap
        const v = clamp(y / 60);
        const valleyGlow = Math.max(0, 1 - Math.abs(x - 150) / 70);
        let cr = mix(0.04, 0.3 + 0.4 * valleyGlow, v);
        let cg = mix(0.05, 0.26 + 0.34 * valleyGlow, v);
        let cb = mix(0.12, 0.38 + 0.36 * valleyGlow, v);

        // the far Alps: violet mass, back of frame
        const alpY = 30 + 6 * Math.sin(x * 0.04 + 2) + noise(x * 0.03, 5, 3) * 4;
        if (y > alpY && y < CRAG(x) - 2) {
          const g = 0.1 + noise(x * 0.2, y * 0.3, 2) * 0.07;
          cr = g * 0.9, cg = g * 0.86, cb = g * 1.25;
        }

        // the pine forest on the crag's lower flanks
        const cragY = CRAG(x);
        if (y > cragY - 14 && y < cragY + 8) {
          const forest = noise(x * 0.35, y * 0.35, 3);
          const g = 0.07 + forest * 0.13;
          cr = g * 0.65, cg = g * 1.1, cb = g * 0.8;
          // pines farther up its shoulders
          if (y < cragY - 4 && forest > 0.5) {
            cr = g * 0.55, cg = g * 1.05, cb = g * 0.75;
          }
        }

        // the castle itself: stacked white tiers with blue-grey roofs
        if (y > 22 && y < cragY + 2 && Math.abs(x - 92) < 26) {
          const tiers = [40, 48, 56, 64]; // roof ridge lines
          const wallTop = 26;
          // the gatehouse wall east, the palas centre, two round towers
          const towerL = 78, towerR = 104;
          const onTowerL = Math.abs(x - towerL) < 3.4 && y > 24;
          const onTowerR = Math.abs(x - towerR) < 3.4 && y > 26;
          const onBody = x > 80 && x < 102 && y > wallTop;
          if (onTowerL || onTowerR || onBody) {
            // white wall, cool in the blue hour, warmer where low sun lingers
            let g = 0.88 + 0.12 * noise(x * 0.5, y * 0.5, 2);
            const side = x < 92 ? 1 : 0.9;
            cr = g * side, cg = g * side, cb = g * (side + 0.06);
            // the roofs: steep blue-grey caps on each tier
            for (const tr of tiers) {
              const roofH = 5;
              if (y > tr - roofH && y < tr) {
                const roofEdge = Math.abs(((y * 2 + x) % 7) - 3.5) > 2;
                if (roofEdge || y < tr - roofH + 1.4) {
                  cr = 0.2, cg = 0.25, cb = 0.42;
                }
              }
            }
            // the round towers' conical caps
            if (onTowerL && y > 20 && y < 26) {
              cr = 0.2, cg = 0.25, cb = 0.42;
            }
            if (onTowerR && y > 22 && y < 28) {
              cr = 0.2, cg = 0.25, cb = 0.42;
            }
            // the lit windows: sparse warm points on the walls
            const winX = Math.floor(x / 2), winY = Math.floor((y - wallTop) / 3);
            if (((winX * 31 + winY * 17) % 13) < 2 && y > wallTop && !onTowerL && !onTowerR) {
              cr = 0.95 * winFlicker, cg = 0.78 * winFlicker, cb = 0.45 * winFlicker;
            }
          }
        }

        // the lake: silver-grey mirror in the valley bottom
        if (y >= LAKE) {
          const dz = y - LAKE;
          const sheen = noise(x * 0.1, dz * 0.1, 4);
          const mk = clamp(1 - dz / 14);
          cr = mix(cr, 0.16 + 0.18 * sheen, mk), cg = mix(cg, 0.18 + 0.2 * sheen, mk), cb = mix(cb, 0.28 + 0.26 * sheen, mk);
          // the castle's reflection: pale smears
          if (Math.abs(x - 92) < 18) {
            cr = mix(cr, 0.5, mk * 0.25), cg = mix(cg, 0.5, mk * 0.25), cb = mix(cb, 0.52, mk * 0.25);
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
