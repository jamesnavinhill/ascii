/*
 * petra: the Treasury facade at golden hour, seen through the Siq. The
 * narrow canyon walls close in dark on both sides, and the opening they
 * frame is the rose-carved facade — columns, pediment, the urn on top —
 * caught in a single warm beam that leaves the sand in front glowing and
 * everything else in shadow. One light through a crack, exactly.
 */
import type { Frame, Meta } from "../types.ts";

export interface PetraOptions {
  [key: string]: unknown;
  /** The warm beam's angle of sway. */
  beam: number;
}

export const meta = {
  name: "petra treasury",
  category: "scenes",
  note: "the facade through the Siq: dark canyon walls, one warm beam of light",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#170b0c",
  options: {
    beam: 1,
  },
  params: {
    beam: { label: "beam sway", min: 0, max: 2, step: 0.05 },
  },
  palette: [
    "#170b0c", "#2c1517", "#4b2325", "#6e3733", "#8f4f3f",
    "#b06a4d", "#cd8a5f", "#e2ab76", "#f2c98e", "#fce6b4",
    "#fff5d8", "#ffffff",
  ],
} satisfies Meta<PetraOptions>;

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

export default function petra(o: Partial<PetraOptions> = {}): Frame {
  const beamSway = o.beam ?? meta.options.beam;
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

  // the Siq: two canyon walls converging toward the center at x≈100
  // facade: x 72..128, bottom y=86, top y=26
  return (t, { color } = {}) => {
    const sway = Math.sin(t / meta.loop * Math.PI * 2) * beamSway;
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        let cr = 0.06, cg = 0.03, cb = 0.035;

        // the canyon walls frame everything: they converge toward center
        const leftEdge = 30 - (y / H) * 8;
        const rightEdge = W - leftEdge;
        if (x < leftEdge || x > rightEdge) {
          // rough Nabataean rock: striated, barely lit
          const stri = noise(x * 0.3, y * 0.9, 2);
          const g = 0.07 + stri * 0.09;
          cr = g * 1.1, cg = g * 0.8, cb = g * 0.75;
        } else {
          // the opening. Everything beyond is either facade or far shadow.
          // the beam: a warm shaft, entering from the upper left, hitting
          // the facade and then the floor in front of it.
          const beamX = 100 + sway * 14;
          const beamW = 26;
          const shaft = Math.exp(-(((x - beamX) / beamW) ** 2));

          // facade occupies 72..128, from y=26 to the floor y=86
          const inFacade = y > 26 && y < 86 && x > 72 - (y - 26) * 0.05 && x < 128 + (y - 26) * 0.05;
          if (inFacade) {
            // rose stone base tone
            let g = 0.32 + noise(x * 0.4, y * 0.4, 2) * 0.06;
            cr = g * 1.25, cg = g * 0.95, cb = g * 0.85;
            // carved geometry, drawn as darker recesses:
            // the pediment (a triangle top)
            const ped = y < 34 && Math.abs(x - 100) < (34 - y) * 2.4;
            // the urn that crowns it
            const urn = y < 30 && Math.abs(x - 100) < 2;
            // six columns, at fixed x positions
            const colX = [76, 84, 92, 108, 116, 124];
            let onCol = false;
            for (const cx of colX) {
              if (Math.abs(x - cx) < 3 && y > 44 && y < 82) onCol = true;
            }
            // the door
            const door = y > 74 && Math.abs(x - 100) < 6;
            if (ped || urn || onCol || door) {
              cr *= 0.82, cg *= 0.82, cb *= 0.85;
            }
            // the beam lights the facade
            cr = mix(cr, cr * 1.9, shaft * 0.85);
            cg = mix(cg, cg * 1.7, shaft * 0.85);
            cb = mix(cb, cb * 1.4, shaft * 0.85);
            // facet glow at the beam's hot center
            const hot = Math.exp(-(((x - beamX) / 8) ** 2)) * Math.exp(-(((y - 52) / 30) ** 2));
            cr = mix(cr, 1, hot * 0.5); cg = mix(cg, 0.8, hot * 0.4); cb = mix(cb, 0.55, hot * 0.3);
          } else if (y > 26) {
            // far shadow beyond the facade edges
            cr = 0.05, cg = 0.03, cb = 0.04;
            // the beam also spills onto the ground in front
            if (y > 86) {
              const spill = shaft * clamp(1 - (y - 86) / 12);
              cr = mix(cr, 0.75, spill), cg = mix(cg, 0.5, spill), cb = mix(cb, 0.35, spill);
            }
          } else {
            // sky sliver at the very top of the opening
            cr = 0.25, cg = 0.2, cb = 0.24;
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
