/*
 * golden gate: the bridge in its fog, seen from the water at first light.
 * The deck runs the frame with its two art deco towers, the main cables sag
 * between them and their suspenders, the towers wear their international
 * orange, and a cool fog bank drifts through, erasing the far shore. A low
 * warm sun glows behind the far tower; the bay carries it up in long dull
 * glints, and the first commuters have started across the deck, white ahead
 * and red away.
 */
import type { Frame, Meta } from "../types.ts";

export interface GoldenGateOptions {
  [key: string]: unknown;
  /** How fast the fog bank drifts. */
  fogDrift: number;
  /** The sun's column, behind the towers somewhere. */
  sunX: number;
  /** How strongly the sun lifts its half of the fog. */
  sunGlow: number;
  /** Speed of the traffic crossing the deck. */
  traffic: number;
}

export const meta = {
  name: "golden gate",
  category: "scenes",
  note: "the bridge in its fog at first light, towers in international orange",
  cols: 200,
  rows: 100,
  cell: 1,
  fps: 12,
  loop: 16,
  ground: "#0a1520",
  options: {
    fogDrift: 0.5,
    sunX: 52,
    sunGlow: 1,
    traffic: 9,
  },
  params: {
    fogDrift: { label: "fog drift", min: 0, max: 2, step: 0.05 },
    sunX: { label: "sun position", min: 5, max: 60, step: 1 },
    sunGlow: { label: "sun glow", min: 0, max: 2, step: 0.05 },
    traffic: { label: "traffic speed", min: 0, max: 30, step: 0.5 },
  },
  palette: [
    "#0a1520", "#14232f", "#233844", "#3c5462", "#5f7781",
    "#8fa3a6", "#b5bfb9", "#d5cbba", "#f3e6cf", "#7c2e12",
    "#a83a1e", "#c74a24", "#e45a3d", "#f0804b", "#ff9c55",
    "#fff0c8", "#0e1319", "#1d2a33",
  ],
} satisfies Meta<GoldenGateOptions>;

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

export default function goldenGate(o: Partial<GoldenGateOptions> = {}): Frame {
  const fogDrift = o.fogDrift ?? meta.options.fogDrift;
  const SUNX = o.sunX ?? meta.options.sunX;
  const glow = o.sunGlow ?? meta.options.sunGlow;
  const trafficSpeed = o.traffic ?? meta.options.traffic;

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

  const deckAt = (x: number) => 57 + Math.abs(x - 100) * 0.02;
  const TOWERS = [54, 146];
  // main cable: rises from the deck out of frame to each tower, then sags midspan
  const cableY = (x: number): number => {
    for (const tx of TOWERS) {
      const d = Math.abs(x - tx);
      if (d <= 46) {
        const u = d / 46;
        return mix(16, 52, u * u);
      }
    }
    return 52;
  };
  // precomputed per-column constants, frame-independent
  const DECK = new Float32Array(W);
  const TOWER_HIT = new Uint8Array(W);
  const CABLE = new Float32Array(W);
  const SUSPEND = new Uint8Array(W);
  for (let x = 0; x < W; x++) {
    DECK[x] = deckAt(x);
    TOWER_HIT[x] = Math.abs(x - TOWERS[0]) <= 4.5 || Math.abs(x - TOWERS[1]) <= 4.5 ? 1 : 0;
    CABLE[x] = cableY(x);
    const inSpan = Math.abs(x - TOWERS[0]) < 46 || Math.abs(x - TOWERS[1]) < 46;
    SUSPEND[x] = inSpan && Math.abs((x % 7) - 3.5) < 0.4 ? 1 : 0;
  }

  const SUN = [SUNX, 46]
  // fog reflected, wet road? the bay: mirrored sky, dimmer, with slow glooms
  const bayShade = (x: number, y: number) => clamp(0.16 + 0.10 * fbm(x * 0.11, y * 0.2 + 4, 2, 0));
  const fogAt = (x: number, y: number, phase: number, low: number) => {
    const d = fbm(x * 0.04 + phase, y * 0.08, 2, 8);
    // sharpen into cloud masses instead of uniform speckle
    const mass = clamp((d - 0.42) * 2.6);
    return clamp(mass * low);
  };
  // reused per-frame buffers, filled at the top of each frame read per cell
  const nearArr = new Float32Array(W), fogRArr = new Float32Array(W), fogGArr = new Float32Array(W), fogBArr = new Float32Array(W), warmArr = new Float32Array(W);
  const lowRow = new Float32Array(H);

  // static: nothing big to precompute; everything is evaluated per cell cheap
  return (t, { color } = {}) => {
    const fogPhase = (t * 0.5 * fogDrift) % 8;
    const glowPulse = 1 + 0.08 * Math.sin(t * 1.2);
    // per-column and per-row constants hoisted out of the cell loop
    for (let x = 0; x < W; x++) {
      const nx = Math.exp(-Math.abs(x - SUN[0]) / 70);
      nearArr[x] = nx;
      fogRArr[x] = mix(0.16 + 0.1 * nx, 0.34, nx);
      fogGArr[x] = mix(0.20 + 0.12 * nx, 0.30, nx);
      fogBArr[x] = mix(0.24 + 0.06 * nx, 0.30, nx * 0.7);
      warmArr[x] = clamp(0.4 + 0.6 * nx);
    }
    for (let r = 0; r < H; r++) lowRow[r] = smooth(66, 30, r + 0.5) * 0.85 + 0.15;
    for (let r = 0; r < H; r++) {
      const y = r + 0.5;
      const low = lowRow[r];
      for (let x = 0; x < W; x++) {
        const k = r * W + x;
        const dx = x + 0.5 - SUN[0];
        let cr: number, cg: number, cb: number;
        const fog = fogAt(x, y, fogPhase, low);
        // the fog's color: cool grey lifted toward the sun's side of the sky
        const near = nearArr[x];
        const fogR = fogRArr[x];
        const fogG = fogGArr[x];
        const fogB = fogBArr[x];
        const warmSide = warmArr[x] * glow * glowPulse;
        if (y < DECK[x] - 1) {
          // sky, then fog eats it from the low side; sun sits behind the fog
          const v = clamp(y / Math.max(DECK[x], 1));
          cr = mix(0.05, 0.30, v), cg = mix(0.09, 0.34, v), cb = mix(0.15, 0.40, v);
          const glowK = Math.exp(-Math.abs(dx) / 34) * Math.exp(-(deckAt(x) - y) / 20) * 0.5;
          cr = mix(cr, 0.95, clamp(glowK * warmSide)), cg = mix(cg, 0.55, clamp(glowK * warmSide)), cb = mix(cb, 0.3, clamp(glowK * warmSide * 0.8));
          const fA = clamp(fog * (1 - 0.35 * Math.exp(-Math.abs(dx) / 26)));
          cr = mix(cr, fogR * (1 + 0.5 * warmSide), fA);
          cg = mix(cg, fogG * (1 + 0.45 * warmSide), fA);
          cb = mix(cb, fogB, fA);
        } else if (y < DECK[x] + 2.2) {
          // steel: deck slab and the orange towers, legs only above the deck
          if (TOWER_HIT[x]) {
            // tower: two legs with struts
            const legDist = Math.abs(Math.abs(x - (Math.abs(x - TOWERS[0]) <= 4.5 ? TOWERS[0] : TOWERS[1])) - 4.5);
            const isLeg = legDist < 1.6 || (Math.abs(Math.abs(x - TOWERS[1]) - 4.5) < 1.6);
            const isStrut = Math.abs(y - 22) < 1.2 || Math.abs(y - 32) < 1.2 || Math.abs(y - 42) < 1.2 || Math.abs(y - 50) < 1.2;
            const warm = clamp(0.35 + 0.65 * near) * glow * glowPulse;
            const lit = 0.55 + 0.45 * Math.exp(-((x - SUNX) ** 2) / 900);
            if (isLeg || isStrut) {
              cr = 0.55 * lit + 0.2, cg = 0.22 * lit + 0.08, cb = 0.1 * lit + 0.05;
              cr = mix(cr, 0.98, warm * 0.55), cg = mix(cg, 0.6, warm * 0.5), cb = mix(cb, 0.35, warm * 0.4);
            } else {
              cr = 0.45 * lit, cg = 0.18 * lit, cb = 0.09 * lit;
            }
          } else {
            // deck slab and its railing
            cr = 0.5, cg = 0.2, cb = 0.1;
            if (Math.abs(y - DECK[x]) < 0.6) cr = 0.7, cg = 0.3, cb = 0.13;
            // traffic: head lights going one way, tail lights the other
            const span = 200;
            for (let car = 0; car < 5; car++) {
              const head = (trafficSpeed * t + car * 41) % span;
              const tail = span - ((trafficSpeed * t + car * 37) % span);
              if (Math.abs(x - head) < 1 && Math.abs(y - DECK[x]) < 0.8) cr = 1, cg = 0.95, cb = 0.8;
              if (Math.abs(x - tail) < 1 && Math.abs(y - DECK[x]) < 0.8) cr = 1, cg = 0.25, cb = 0.15;
            }
          }
        } else if (y < DECK[x] + 2.2 + 44) {
          // everything steel below the deck: none, straight into the bay
          const v = bayShade(x, y);
          const glintSeed = hash(x * 7 + Math.floor(t * 2.0), Math.floor((y - DECK[x] + 4) * 3));
          const glint = Math.exp(-Math.abs(x - SUNX) / 26) * (glintSeed > 0.972 ? 1 : 0);
          const fA = clamp(fog * 0.9);
          cr = mix(v * 0.8 + 0.05 * near, fogR, fA * 0.8) + glint;
          cg = mix(v * 0.9 + 0.03 * near, fogG, fA * 0.8) + glint * 0.7;
          cb = mix(v * 1.1, fogB, fA * 0.8) + glint * 0.3;
        } else {
          // open water right up to the towers, fog all the way at the far end
          const v = bayShade(x, y);
          const glintSeed = hash(x * 7 + Math.floor(t * 2.0), Math.floor((y - DECK[x] + 4) * 3));
          const glint = Math.exp(-Math.abs(x - SUNX) / 26) * (glintSeed > 0.972 ? 1 : 0);
          const fA = clamp(fog * 1.05);
          cr = mix(v * 0.8 + 0.05 * near, fogR, fA * 0.9) + glint;
          cg = mix(v * 0.9 + 0.03 * near, fogG, fA * 0.9) + glint * 0.7;
          cb = mix(v * 1.1, fogB, fA * 0.9) + glint * 0.3;
        }

        // main cables and suspenders ride over everything
        const cy = CABLE[x];
        if (Math.abs(y - cy) < 0.7) {
          cr = 0.72, cg = 0.3, cb = 0.13;
          // suspenders every 7 cols, straight down to the deck
          if (SUSPEND[x] && y < DECK[x] && y > cy) {
            cr = 0.6, cg = 0.24, cb = 0.11;
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
