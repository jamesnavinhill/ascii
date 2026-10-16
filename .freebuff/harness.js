"use strict";
var SCENES_BUNDLE = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // scripts/scene-harness.ts
  var scene_harness_exports = {};
  __export(scene_harness_exports, {
    SCENES: () => SCENES
  });

  // src/pieces/golden-gate.ts
  var meta = {
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
      traffic: 9
    },
    params: {
      fogDrift: { label: "fog drift", min: 0, max: 2, step: 0.05 },
      sunX: { label: "sun position", min: 5, max: 60, step: 1 },
      sunGlow: { label: "sun glow", min: 0, max: 2, step: 0.05 },
      traffic: { label: "traffic speed", min: 0, max: 30, step: 0.5 }
    },
    palette: [
      "#0a1520",
      "#14232f",
      "#233844",
      "#3c5462",
      "#5f7781",
      "#8fa3a6",
      "#b5bfb9",
      "#d5cbba",
      "#f3e6cf",
      "#7c2e12",
      "#a83a1e",
      "#c74a24",
      "#e45a3d",
      "#f0804b",
      "#ff9c55",
      "#fff0c8",
      "#0e1319",
      "#1d2a33"
    ]
  };
  var W = 200;
  var H = 100;
  function hash(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var smooth = (a, b, v) => {
    const k = clamp((v - a) / (b - a));
    return k * k * (3 - 2 * k);
  };
  var mix = (a, b, k) => a + (b - a) * k;
  var hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function goldenGate(o = {}) {
    const fogDrift = o.fogDrift ?? meta.options.fogDrift;
    const SUNX = o.sunX ?? meta.options.sunX;
    const glow = o.sunGlow ?? meta.options.sunGlow;
    const trafficSpeed = o.traffic ?? meta.options.traffic;
    const P = meta.palette.map(hex);
    const out = new Array(W * H);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * smooth(0.12, 0.5, level)) / peak;
        color[k] = nearest(clamp(cr * s), clamp(cg * s), clamp(cb * s));
      }
    };
    const deckAt = (x) => 57 + Math.abs(x - 100) * 0.02;
    const TOWERS = [54, 146];
    const cableY = (x) => {
      for (const tx of TOWERS) {
        const d = Math.abs(x - tx);
        if (d <= 46) {
          const u = d / 46;
          return mix(16, 52, u * u);
        }
      }
      return 52;
    };
    const DECK = new Float32Array(W);
    const TOWER_HIT = new Uint8Array(W);
    const CABLE = new Float32Array(W);
    const SUSPEND = new Uint8Array(W);
    for (let x = 0; x < W; x++) {
      DECK[x] = deckAt(x);
      TOWER_HIT[x] = Math.abs(x - TOWERS[0]) <= 4.5 || Math.abs(x - TOWERS[1]) <= 4.5 ? 1 : 0;
      CABLE[x] = cableY(x);
      const inSpan = Math.abs(x - TOWERS[0]) < 46 || Math.abs(x - TOWERS[1]) < 46;
      SUSPEND[x] = inSpan && Math.abs(x % 7 - 3.5) < 0.4 ? 1 : 0;
    }
    const SUN = [SUNX, 46];
    const bayShade = (x, y) => clamp(0.16 + 0.1 * fbm(x * 0.11, y * 0.2 + 4, 2, 0));
    const fogAt = (x, y, phase, low) => {
      const d = fbm(x * 0.05 + phase, y * 0.09, 2, 8);
      return clamp((d * 1.25 - 0.38) * low);
    };
    const nearArr = new Float32Array(W), fogRArr = new Float32Array(W), fogGArr = new Float32Array(W), fogBArr = new Float32Array(W), warmArr = new Float32Array(W);
    const lowRow = new Float32Array(H);
    return (t, { color } = {}) => {
      const fogPhase = t * 0.5 * fogDrift % 8;
      const glowPulse = 1 + 0.08 * Math.sin(t * 1.2);
      for (let x = 0; x < W; x++) {
        const nx = Math.exp(-Math.abs(x - SUN[0]) / 70);
        nearArr[x] = nx;
        fogRArr[x] = mix(0.16 + 0.1 * nx, 0.34, nx);
        fogGArr[x] = mix(0.2 + 0.12 * nx, 0.3, nx);
        fogBArr[x] = mix(0.24 + 0.06 * nx, 0.3, nx * 0.7);
        warmArr[x] = clamp(0.4 + 0.6 * nx);
      }
      for (let r = 0; r < H; r++) lowRow[r] = smooth(66, 30, r + 0.5) * 0.85 + 0.15;
      for (let r = 0; r < H; r++) {
        const y = r + 0.5;
        const low = lowRow[r];
        for (let x = 0; x < W; x++) {
          const k = r * W + x;
          const dx = x + 0.5 - SUN[0];
          let cr, cg, cb;
          const fog = fogAt(x, y, fogPhase, low);
          const near = nearArr[x];
          const fogR = fogRArr[x];
          const fogG = fogGArr[x];
          const fogB = fogBArr[x];
          const warmSide = warmArr[x] * glow * glowPulse;
          if (y < DECK[x] - 1) {
            const v = clamp(y / Math.max(DECK[x], 1));
            cr = mix(0.05, 0.3, v), cg = mix(0.09, 0.34, v), cb = mix(0.15, 0.4, v);
            const glowK = Math.exp(-Math.abs(dx) / 34) * Math.exp(-(deckAt(x) - y) / 20) * 0.5;
            cr = mix(cr, 0.95, clamp(glowK * warmSide)), cg = mix(cg, 0.55, clamp(glowK * warmSide)), cb = mix(cb, 0.3, clamp(glowK * warmSide * 0.8));
            const fA = clamp(fog * (1 - 0.35 * Math.exp(-Math.abs(dx) / 26)));
            cr = mix(cr, fogR * (1 + 0.5 * warmSide), fA);
            cg = mix(cg, fogG * (1 + 0.45 * warmSide), fA);
            cb = mix(cb, fogB, fA);
          } else if (y < DECK[x] + 2.2 || TOWER_HIT[x]) {
            if (TOWER_HIT[x]) {
              const legDist = Math.abs(Math.abs(x - (Math.abs(x - TOWERS[0]) <= 4.5 ? TOWERS[0] : TOWERS[1])) - 4.5);
              const isLeg = legDist < 1.6 || Math.abs(Math.abs(x - TOWERS[1]) - 4.5) < 1.6;
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
              cr = 0.5, cg = 0.2, cb = 0.1;
              if (Math.abs(y - DECK[x]) < 0.6) cr = 0.7, cg = 0.3, cb = 0.13;
              const span = 200;
              for (let car = 0; car < 5; car++) {
                const head = (trafficSpeed * t + car * 41) % span;
                const tail = span - (trafficSpeed * t + car * 37) % span;
                if (Math.abs(x - head) < 1 && Math.abs(y - DECK[x]) < 0.8) cr = 1, cg = 0.95, cb = 0.8;
                if (Math.abs(x - tail) < 1 && Math.abs(y - DECK[x]) < 0.8) cr = 1, cg = 0.25, cb = 0.15;
              }
            }
          } else if (y < DECK[x] + 2.2 + 44) {
            const v = bayShade(x, y);
            const glintSeed = hash(x * 7 + Math.floor(t * 2), Math.floor((y - DECK[x] + 4) * 3));
            const glint = Math.exp(-Math.abs(x - SUNX) / 26) * (glintSeed > 0.972 ? 1 : 0);
            const fA = clamp(fog * 0.9);
            cr = mix(v * 0.8 + 0.05 * near, fogR, fA * 0.8) + glint;
            cg = mix(v * 0.9 + 0.03 * near, fogG, fA * 0.8) + glint * 0.7;
            cb = mix(v * 1.1, fogB, fA * 0.8) + glint * 0.3;
          } else {
            const v = bayShade(x, y);
            const glintSeed = hash(x * 7 + Math.floor(t * 2), Math.floor((y - DECK[x] + 4) * 3));
            const glint = Math.exp(-Math.abs(x - SUNX) / 26) * (glintSeed > 0.972 ? 1 : 0);
            const fA = clamp(fog * 1.05);
            cr = mix(v * 0.8 + 0.05 * near, fogR, fA * 0.9) + glint;
            cg = mix(v * 0.9 + 0.03 * near, fogG, fA * 0.9) + glint * 0.7;
            cb = mix(v * 1.1, fogB, fA * 0.9) + glint * 0.3;
          }
          const cy = CABLE[x];
          if (Math.abs(y - cy) < 0.7) {
            cr = 0.72, cg = 0.3, cb = 0.13;
            if (SUSPEND[x] && y < DECK[x] && y > cy) {
              cr = 0.6, cg = 0.24, cb = 0.11;
            }
          }
          halftone(k, r, x, clamp(cr), clamp(cg), clamp(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H; r++) lines.push(out.slice(r * W, (r + 1) * W).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/eiffel-tower.ts
  var meta2 = {
    name: "eiffel tower",
    category: "scenes",
    note: "the lattice lit gold from below, paris asleep around it",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#070a16",
    options: {
      beacon: 8
    },
    params: {
      beacon: { label: "beacon sweep", min: 0, max: 20, step: 0.5 }
    },
    palette: [
      "#070a16",
      "#0f1530",
      "#1a2342",
      "#2c3652",
      "#46506b",
      "#6d6f80",
      "#a08a6e",
      "#c89b50",
      "#e0b45c",
      "#f2cc79",
      "#ffe6a4",
      "#fff4d2",
      "#ffffff"
    ]
  };
  var W2 = 200;
  var H2 = 100;
  function hash2(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise2(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash2(x0, yi), b = hash2(x1, yi), c = hash2(x0, yi + 1), d = hash2(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp2 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix2 = (a, b, k) => a + (b - a) * k;
  var hex2 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function eiffelTower(o = {}) {
    const every = o.beacon ?? meta2.options.beacon;
    const P = meta2.palette.map(hex2);
    const out = new Array(W2 * H2);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp2(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp2(1 - level)) / peak;
        color[k] = nearest(clamp2(cr * s), clamp2(cg * s), clamp2(cb * s));
      }
    };
    const CX = 100;
    const halfWidth = (y) => {
      const v = 1 - clamp2(y / 92);
      const splay = 30 * Math.pow(v, 0.18) * (1 - 0.55 * Math.exp(-(y / 20)));
      return splay < 2.2 ? 2.2 : splay > 32 ? 32 : splay;
    };
    return (t, { color } = {}) => {
      const beaconAngle = every > 0 ? Math.PI * 2 * (t % 16) / 16 : null;
      for (let r = 0; r < H2; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W2; x++) {
          const k = r * W2 + x;
          let cr = 0.03, cg = 0.05, cb = 0.12;
          const horizon = 78;
          if (y < horizon) {
            const v = clamp2(y / horizon);
            cr = mix2(0.02, 0.06, v), cg = mix2(0.03, 0.09, v), cb = mix2(0.07, 0.18, v);
            const s = hash2(x * 7 + 3, r * 11);
            if (s > 0.9955) {
              cr = 0.9, cg = 0.92, cb = 1;
            }
            const roofSeed = noise2(x * 0.12, 0.5, 2);
            if (y > horizon - 8 && roofSeed > 0.55) {
              const warm = 0.4 + 0.6 * hash2(x * 3, r);
              cr = 0.55 * warm, cg = 0.33 * warm, cb = 0.16 * warm;
            }
          } else if (y < 84) {
            const v = 1 - clamp2((y - horizon) / 6);
            cr = 0.08 + 0.1 * v, cg = 0.07 + 0.08 * v, cb = 0.1 * v + 0.05;
          }
          const hw = halfWidth(y);
          const dx = Math.abs(x - CX);
          if (dx < hw + 1.5) {
            const edge = dx / Math.max(hw, 1e-3);
            const lattice = noise2(x * 0.8, y * 0.8, 0) * 0.5 + 0.5;
            const strut = (Math.floor(y * 0.55) % 2 === 0 ? 0.75 : 0.35) * (1 - edge * 0.4);
            const warmth = clamp2(1 - y / 92) * 0.75 + 0.25;
            const body = 0.45 + 0.55 * (1 - edge);
            cr = mix2(0.85, 0.95, body) * warmth;
            cg = mix2(0.62, 0.72, body) * warmth;
            cb = mix2(0.25, 0.3, body) * (0.4 + 0.6 * warmth);
            if (lattice < 0.35) cr *= 0.3, cg *= 0.3, cb *= 0.3;
            if (strut > 0.6) cr *= 1.1, cg *= 1.1, cb *= 0.9;
            const spill = Math.exp(-((dx / (hw + 6)) ** 2)) * (1 - y / 92);
            cr += 0.4 * spill, cg += 0.18 * spill, cb += 0.04 * spill;
          }
          if (y > 74 && y < 88 && dx < 30) {
            const arch = Math.abs(y - 86) < 0.8 || Math.abs(dx - (28 - y * 0.12)) < 1.2;
            if (!arch && y > 80 && dx > 8 && dx < 30) {
              cr = 0.04, cg = 0.05, cb = 0.1;
            }
          }
          if (beaconAngle !== null && y > 2 && y < 14) {
            const sweepX = CX + 88 * Math.cos(beaconAngle);
            const beam = Math.exp(-((x - sweepX) ** 2) / 220);
            if (beam > 0.04) {
              cr += beam * 0.7, cg += beam * 0.55, cb += beam * 0.3;
            }
          }
          halftone(k, r, x, clamp2(cr), clamp2(cg), clamp2(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H2; r++) lines.push(out.slice(r * W2, (r + 1) * W2).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/statue-liberty.ts
  var meta3 = {
    name: "statue liberty",
    category: "scenes",
    note: "liberty at blue hour, the torch one gold light in the harbor",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#081222",
    options: {
      ferry: 3.2,
      flame: 1
    },
    params: {
      ferry: { label: "ferry crossing", min: 0, max: 8, step: 0.2 },
      flame: { label: "torch shimmer", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#08122a",
      "#10283a",
      "#1d4550",
      "#2f685e",
      "#4b8b78",
      "#78a995",
      "#a9c6ae",
      "#d0d9c2",
      "#e8b956",
      "#ffd977",
      "#fff0b0",
      "#28416a",
      "#3d5c8a"
    ]
  };
  var W3 = 200;
  var H3 = 100;
  function hash3(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise3(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash3(x0, yi), b = hash3(x1, yi), c = hash3(x0, yi + 1), d = hash3(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm2(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise3(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp3 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix3 = (a, b, k) => a + (b - a) * k;
  var hex3 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function statueLiberty(o = {}) {
    const ferrySpeed = o.ferry ?? meta3.options.ferry;
    const flame = o.flame ?? meta3.options.flame;
    const P = meta3.palette.map(hex3);
    const out = new Array(W3 * H3);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp3(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp3(1 - level)) / peak;
        color[k] = nearest(clamp3(cr * s), clamp3(cg * s), clamp3(cb * s));
      }
    };
    const CX = 92;
    const PEDESTAL_TOP = 58, PEDESTAL_BOT = 74;
    const FIGURE_TOP = 16, FIGURE_FEET = PEDESTAL_TOP;
    const TORCH = [CX + 7, 14];
    return (t, { color } = {}) => {
      for (let r = 0; r < H3; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W3; x++) {
          const k = r * W3 + x;
          let cr = 0.03, cg = 0.06, cb = 0.14;
          const horizon = 74;
          const v = clamp3(y / horizon);
          cr = mix3(0.02, 0.05, v), cg = mix3(0.04, 0.09, v), cb = mix3(0.09, 0.22, v);
          const cityGlow = Math.max(0, 1 - Math.abs(x - 160) / 60) * Math.exp(-(horizon - y) / 18) * 0.5;
          cr += cityGlow * 0.55, cg += cityGlow * 0.3, cb += cityGlow * 0.2;
          const s = hash3(x * 7 + 3, r * 11);
          if (s > 0.9965 && y < 40 && Math.abs(x - CX) > 14) {
            cr = 0.85, cg = 0.9, cb = 1;
          }
          const tdx = x - TORCH[0], tdy = y - TORCH[1];
          const td = Math.sqrt(tdx * tdx + tdy * tdy);
          const flicker = flame ? 0.92 + 0.08 * noise3(t * 7, Math.floor(x / 5), 2) : 1;
          const warm = Math.exp(-td / 62) * flicker;
          if (y >= PEDESTAL_BOT) {
            const wSeed = fbm2(x * 0.08, y * 0.14 + Math.floor(t * 3), 2, 0);
            const roadK = Math.exp(-Math.abs(x - CX) / 7) * (0.4 + 0.6 * wSeed);
            cr = 0.03 + 0.04 * wSeed, cg = 0.07 + 0.07 * wSeed, cb = 0.16 + 0.08 * wSeed;
            const shiver = roadK * Math.exp(-(y - PEDESTAL_BOT) / 26) * 1.1;
            cr += shiver * 0.95, cg += shiver * 0.6, cb += shiver * 0.15;
            if (y < PEDESTAL_BOT + 2 && Math.abs(x - CX) < 26) {
              cr = 0.04, cg = 0.07, cb = 0.1;
            }
            if (ferrySpeed > 0) {
              const fx0 = (ferrySpeed * t * 6 + 30) % 250 - 30;
              if (Math.abs(x - fx0) < 4 && Math.abs(y - 80) < 1) {
                const stern = x > fx0;
                cr = stern ? 0.9 : 0.7, cg = 0.75, cb = 0.5;
              }
            }
          } else if (y >= PEDESTAL_TOP) {
            const stepY = Math.floor((y - PEDESTAL_TOP) / 4);
            const taper = 26 - stepY * 2.2;
            const inBlock = Math.abs(x - CX) < taper;
            cr = 0.1, cg = 0.14, cb = 0.2;
            if (inBlock) {
              const edgeLight = (x - (CX - taper)) / (taper * 2);
              cr = mix3(0.07, 0.16, edgeLight), cg = mix3(0.11, 0.2, edgeLight), cb = mix3(0.17, 0.28, edgeLight);
            } else if (Math.abs(x - CX) < taper + 1 && Math.floor((y - PEDESTAL_TOP) / 2) % 2 === 0) {
              cr = 0.08, cg = 0.12, cb = 0.18;
            }
            cr = mix3(cr, 0.6, warm * 0.35), cg = mix3(cg, 0.5, warm * 0.4), cb = mix3(cb, 0.22, warm * 0.4);
          } else if (y >= FIGURE_TOP) {
            const fy = (y - FIGURE_TOP) / (FIGURE_FEET - FIGURE_TOP);
            const bodyHalf = mix3(6.5, 3.2, clamp3(fy)) + Math.sin(fy * 9) * 0.25;
            const dx = Math.abs(x - CX);
            const armX = CX + mix3(3, 7.5, clamp3(fy * 1.6 - 0.35));
            const onArm = fy < 0.62 && Math.abs(x - armX) < 1.5 && y < TORCH[1] + 4;
            const onTablet = dx > bodyHalf * 0.7 && dx < bodyHalf + 2.2 && y > FIGURE_TOP + 16 && y < FIGURE_TOP + 26;
            if (dx < bodyHalf || onArm || onTablet) {
              const lit = clamp3(0.35 + 0.65 * ((x - (CX - bodyHalf)) / (bodyHalf * 2)));
              const robe = noise3(x * 0.7, y * 0.5, 2) * 0.3;
              cr = 0.32 * lit + 0.08 * robe;
              cg = 0.46 * lit + 0.1 * robe;
              cb = 0.34 * lit + 0.07 * robe;
            }
            if (fy < 0.14) {
              const crownY = FIGURE_TOP + 5;
              if (Math.abs(y - crownY) < 1.6 && dx < 5.5) {
                cr = 0.36, cg = 0.5, cb = 0.38;
              } else if (y < crownY && y > crownY - 5 && dx < 6.2) {
                const spike = Math.abs(dx * 2 % 3 - 1.5) < 0.5;
                if (spike) cr = 0.3, cg = 0.42, cb = 0.32;
              }
            }
          }
          if (Math.abs(x - TORCH[0]) < 2.2 && Math.abs(y - TORCH[1]) < 3.5) {
            const f = noise3(x * 2 + t * 5, y * 2 - t * 9, 2);
            cr = 0.98, cg = 0.8 + 0.15 * f, cb = 0.55 * f;
          }
          if (y >= 88) {
            const dx2 = Math.abs(x - CX);
            if (dx2 < 9 && y < 92) {
              const wSeed = fbm2(x * 0.08, y * 0.14 + Math.floor(t * 3), 2, 0);
              cr += (1 - y / 92) * 0.05 * wSeed;
            }
          }
          halftone(k, r, x, clamp3(cr), clamp3(cg), clamp3(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H3; r++) lines.push(out.slice(r * W3, (r + 1) * W3).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/sydney-opera.ts
  var meta4 = {
    name: "sydney opera",
    category: "scenes",
    note: "the shells at sunset, their edges lit, the harbour carrying shards",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#0a1826",
    options: {
      sunX: 158,
      ripple: 1
    },
    params: {
      sunX: { label: "sun position", min: 130, max: 185, step: 1 },
      ripple: { label: "water ripple", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#071827",
      "#102b3d",
      "#1c4558",
      "#326477",
      "#648b94",
      "#b7c9c6",
      "#dce0d5",
      "#f0e9d5",
      "#f2c17b",
      "#ffd98c",
      "#fff0c8",
      "#ffffff"
    ]
  };
  var W4 = 200;
  var H4 = 100;
  function hash4(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise4(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash4(x0, yi), b = hash4(x1, yi), c = hash4(x0, yi + 1), d = hash4(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm3(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise4(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp4 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var smooth2 = (a, b, v) => {
    const k = clamp4((v - a) / (b - a));
    return k * k * (3 - 2 * k);
  };
  var mix4 = (a, b, k) => a + (b - a) * k;
  var hex4 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function sydneyOpera(o = {}) {
    const SUNX = o.sunX ?? meta4.options.sunX;
    const rippleSpeed = o.ripple ?? meta4.options.ripple;
    const P = meta4.palette.map(hex4);
    const out = new Array(W4 * H4);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp4(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp4(1 - level)) / peak;
        color[k] = nearest(clamp4(cr * s), clamp4(cg * s), clamp4(cb * s));
      }
    };
    const PLATFORM = 64;
    const SHELLS = [
      { cx: 52, base: PLATFORM, peak: 30, half: 17, lean: -6 },
      { cx: 78, base: PLATFORM, peak: 38, half: 15, lean: 5 },
      { cx: 100, base: PLATFORM, peak: 34, half: 13, lean: 10 }
    ];
    return (t, { color } = {}) => {
      for (let r = 0; r < H4; r++) {
        const y = r + 0.5;
        const dy = Math.max(0, y - PLATFORM);
        for (let x = 0; x < W4; x++) {
          const k = r * W4 + x;
          let cr = 0.03, cg = 0.07, cb = 0.12;
          const near = clamp4(1 - Math.abs(x - SUNX) / 150);
          const v = clamp4(y / PLATFORM);
          cr = mix4(0.03, 0.3 + 0.3 * near, Math.pow(v, 0.9));
          cg = mix4(0.06, 0.22 + 0.28 * near, Math.pow(v, 0.9));
          cb = mix4(0.12, 0.14 + 0.16 * near, Math.pow(v, 0.9));
          const sd = Math.sqrt((x - SUNX) ** 2 + (y - 28) ** 2);
          if (sd < 6) {
            const e = sd / 6;
            cr = mix4(1, 0.85, e), cg = mix4(0.85, 0.5, e), cb = mix4(0.5, 0.25, e);
          }
          if (y > 24 && y < 30 && x > 168) {
            const hump = Math.abs(x - 184) > 2 && y > 26;
            if (hump) cr = 0.05, cg = 0.08, cb = 0.14;
            else cr = 0.1, cg = 0.14, cb = 0.2;
          }
          for (const s of SHELLS) {
            const ry = s.base - s.peak;
            const rx = s.half;
            const eR = 1.15;
            const nx = (x - s.cx) / rx, ny = (y - (s.base - ry * 0.28)) / (ry * eR);
            const d2 = nx * nx + ny * ny;
            const inShell = d2 < 1 && y < s.base && y > s.base - ry * 1.12;
            if (inShell) {
              const lit = clamp4(0.5 + 0.5 * Math.sign(x - s.cx - s.lean) * near * 2);
              const tile = noise4(x * 0.3, y * 0.3, 2) * 0.06;
              cr = mix4(0.62, 0.98, lit) + tile;
              cg = mix4(0.66, 0.96, lit) + tile;
              cb = mix4(0.72, 0.9, lit) + tile * 0.5;
              if (lit > 0.9) {
                cr = mix4(cr, 1, 0.3), cg = mix4(cg, 0.9, 0.25), cb = mix4(cb, 0.7, 0.2);
              }
              const ang = Math.atan2(y - (s.base - ry * 0.28), x - s.cx);
              const rib = Math.abs(ang * 14 % Math.PI / 14 - 0.5) < 0.28;
              if (rib) cr *= 0.92, cg *= 0.92, cb *= 0.94;
              if (y > s.base - 6) cr *= 0.6, cg *= 0.65, cb *= 0.75;
              break;
            }
          }
          if (y >= PLATFORM && y < PLATFORM + 4) {
            cr = 0.3, cg = 0.34, cb = 0.38;
            if (y < PLATFORM + 1) cr = 0.5, cg = 0.52, cb = 0.55;
          }
          if (y >= PLATFORM + 4) {
            const dz = y - PLATFORM;
            const rowSeed = Math.floor(x / 6 + fbm3(x * 0.05, (dz + t * 4 * rippleSpeed) * 0.08, 2, 8) * 6);
            const shard = hash4(rowSeed, Math.floor(dz + t * rippleSpeed * 3)) > 0.35 ? 1 : 0.6;
            const mirrorK = clamp4(1 - dz / 40);
            const skyM = [0.3, 0.28, 0.34];
            let mcr = skyM[0] * (0.5 + 0.5 * near), mcg = skyM[1] * (0.5 + 0.5 * near), mcb = skyM[2];
            for (const s of SHELLS) {
              const away = Math.abs(x - s.cx) < s.half * 1.2;
              if (away) {
                const lit = clamp4(0.4 + 0.6 * Math.sign(x - s.cx - s.lean) * near);
                mcr = mix4(0.35, 0.85, lit), mcg = mix4(0.4, 0.85, lit), mcb = mix4(0.45, 0.8, lit);
              }
            }
            const sunRoad = Math.exp(-(((x - SUNX) / 5) ** 2));
            mcr += sunRoad * 0.8, mcg += sunRoad * 0.5, mcb += sunRoad * 0.1;
            cr = mix4(cr, mcr, mirrorK * shard), cg = mix4(cg, mcg, mirrorK * shard), cb = mix4(cb, mcb, mirrorK * shard);
            const deep = smooth2(30, 46, dz);
            cr *= 1 - deep * 0.4, cg *= 1 - deep * 0.35, cb *= 1 - deep * 0.25;
          }
          halftone(k, r, x, clamp4(cr), clamp4(cg), clamp4(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H4; r++) lines.push(out.slice(r * W4, (r + 1) * W4).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/tokyo-night.ts
  var meta5 = {
    name: "tokyo night",
    category: "scenes",
    note: "Shibuya in the rain: neon tiers, umbrella crowds, the tower lit far off",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#0a0a14",
    options: {
      shimmer: 1,
      crowd: 1
    },
    params: {
      shimmer: { label: "neon shimmer", min: 0, max: 2, step: 0.05 },
      crowd: { label: "crowd flow", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#0a0a14",
      "#141428",
      "#1a2a3e",
      "#28344a",
      "#3d4a60",
      "#6a5878",
      "#a87898",
      "#d88aa0",
      "#e84d90",
      "#ff6a4c",
      "#ffc23e",
      "#62e28c",
      "#3eb8ff",
      "#ffffff"
    ]
  };
  var W5 = 200;
  var H5 = 100;
  function hash5(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise5(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash5(x0, yi), b = hash5(x1, yi), c = hash5(x0, yi + 1), d = hash5(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp5 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix5 = (a, b, k) => a + (b - a) * k;
  var hex5 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function tokyoNight(o = {}) {
    const shimmer = o.shimmer ?? meta5.options.shimmer;
    const crowd = o.crowd ?? meta5.options.crowd;
    const P = meta5.palette.map(hex5);
    const out = new Array(W5 * H5);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp5(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp5(1 - level)) / peak;
        color[k] = nearest(clamp5(cr * s), clamp5(cg * s), clamp5(cb * s));
      }
    };
    const TOWER = 170;
    const towerHalf = (y) => {
      const k = clamp5(y / 60);
      return 2 + 12 * k * k;
    };
    return (t, { color } = {}) => {
      for (let r = 0; r < H5; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W5; x++) {
          const k = r * W5 + x;
          let cr = 0.04, cg = 0.03, cb = 0.08;
          if (y < 70) {
            cr = 0.04, cg = 0.03, cb = 0.08;
          }
          if (y > 8 && y < 70) {
            const d = Math.abs(x - TOWER) - towerHalf(y);
            if (d < 2.4) {
              const strut = Math.abs((y - x * 0.25 + x - TOWER) % 8 - 4) < 1.8;
              const amber = y > 32 && y < 44 ? 1 : 0;
              const lit = 0.55 + 0.45 * noise5(x * 0.2, y * 0.2 + t * shimmer, 2);
              if (strut) {
                cr = mix5(0.9, 0.5, lit * 0.4), cg = mix5(0.4, 0.2, lit * 0.3), cb = 0.05;
                if (amber) cr = 1, cg = 0.75, cb = 0.2;
              } else if (d > 0) {
                cr = 0.05, cg = 0.03, cb = 0.07;
              } else {
                cr = 0.3 * lit, cg = 0.12 * lit, cb = 0.05;
              }
            }
          }
          if (y >= 34 && y < 70) {
            const isLeft = x < 70, isRight = x > 130;
            if (isLeft || isRight) {
              const u = isLeft ? x : W5 - x;
              const depth = isLeft ? (70 - x) / 70 : (x - 130) / 70;
              let wall = 0.08 + 0.06 * noise5(x * 0.3, y * 0.3, 3);
              const winCol = Math.floor(x / 4), winRow = Math.floor((y - 34) / 5);
              if ((winCol * 31 + winRow * 17) % 7 < 2) wall += 0.5;
              const barY = [38, 46, 54, 62];
              for (const by of barY) {
                const dyy = Math.abs(y - by);
                if (dyy < 2.2) {
                  const band = 1 - dyy / 2.2;
                  const fam = hash5(winCol, Math.floor(by / 8));
                  const glowK = 0.6 + 0.4 * noise5(x * 0.5 + t * shimmer * 2, by, 3);
                  if (fam < 0.4) {
                    wall = mix5(wall, 0.6, band * glowK);
                    wall = Math.max(wall, band * glowK);
                    if (band > 0.5) {
                      cr = mix5(cr, 1, band);
                      cg = mix5(cg, 0.35, band);
                      cb = mix5(cb, 0.55, band);
                    }
                  } else if (fam < 0.75) {
                    wall = Math.max(wall, band * glowK);
                    if (band > 0.5) {
                      cr = mix5(cr, 0.2, band);
                      cg = mix5(cg, 0.8, band);
                      cb = mix5(cb, 1, band);
                    }
                  } else {
                    wall = Math.max(wall, band * glowK);
                    if (band > 0.5) {
                      cr = mix5(cr, 1, band);
                      cg = mix5(cg, 0.75, band);
                      cb = mix5(cb, 0.2, band);
                    }
                  }
                }
              }
              cr = Math.max(cr, wall), cg = Math.max(cg, wall * 0.9), cb = Math.max(cb, wall);
            }
          }
          if (y >= 70) {
            const dz = y - 70;
            const stripe = (x + y * 1.4) % 24 < 2.5 || (x - y * 1.4) % 24 < 2.5;
            let fcr = 0.05, fcg = 0.05, fcb = 0.08;
            if (stripe) fcr = fcr = 0.55, fcg = 0.55, fcb = 0.6;
            if (dz > 4 && dz < 22) {
              const cellX = Math.floor((x + t * 30 * crowd % 200) / 6);
              const cellY = Math.floor((y - 70) / 4);
              const h = hash5(cellX, cellY * 7 + 3);
              if (h > 0.65) {
                const fam = hash5(cellX, 91);
                fcr = mix5(0.9, 0.3, fam), fcg = mix5(0.3, 0.8, fam), fcb = mix5(0.2, 1, fam);
                fcr *= 0.9, fcg *= 0.9, fcb *= 0.9;
              }
            }
            cr = fcr, cg = fcg, cb = fcb;
            const refK = clamp5(1 - dz / 28);
            const xFrom = [x - 1, x, x + 1];
            let rr = 0, rg = 0, rb = 0, n = 0;
            for (const sx of xFrom) {
              const srcY = 68 - Math.floor(dz * 0.7);
              const idx = srcY * W5 + sx;
              if (idx >= 0 && idx < W5 * H5) {
                for (const by of [38, 46, 54, 62]) {
                  const near = Math.abs(srcY - by) < 3;
                  if (near) {
                    const fam = hash5(Math.floor(sx / 4), Math.floor(by / 8));
                    if (fam < 0.4) rr += 1, rg += 0.3, rb += 0.5;
                    else if (fam < 0.75) rr += 0.2, rg += 0.7, rb += 1;
                    else rr += 1, rg += 0.7, rb += 0.2;
                    n++;
                  }
                }
              }
            }
            if (n > 0) {
              rr /= n;
              rg /= n;
              rb /= n;
              cr = mix5(cr, rr * 0.5, refK * 0.8);
              cg = mix5(cg, rg * 0.5, refK * 0.8);
              cb = mix5(cb, rb * 0.5, refK * 0.8);
            }
          }
          halftone(k, r, x, clamp5(cr), clamp5(cg), clamp5(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H5; r++) lines.push(out.slice(r * W5, (r + 1) * W5).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/giza.ts
  var meta6 = {
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
      caravan: 1
    },
    params: {
      sunX: { label: "sun position", min: 30, max: 130, step: 1 },
      caravan: { label: "caravan speed", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#151020",
      "#241a30",
      "#3b2a44",
      "#5c3d55",
      "#8a5c62",
      "#b9846e",
      "#d9ad8a",
      "#f0d4a4",
      "#fce7bd",
      "#fff6d8",
      "#ffffff"
    ]
  };
  var W6 = 200;
  var H6 = 100;
  function hash6(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise6(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash6(x0, yi), b = hash6(x1, yi), c = hash6(x0, yi + 1), d = hash6(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm4(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise6(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp6 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix6 = (a, b, k) => a + (b - a) * k;
  var hex6 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function giza(o = {}) {
    const SUNX = o.sunX ?? meta6.options.sunX;
    const caravan = o.caravan ?? meta6.options.caravan;
    const P = meta6.palette.map(hex6);
    const out = new Array(W6 * H6);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp6(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp6(1 - level)) / peak;
        color[k] = nearest(clamp6(cr * s), clamp6(cg * s), clamp6(cb * s));
      }
    };
    const PX = 88, PY = 18, PL = 48, PR = 128;
    const HORIZON = 62;
    const PX2 = 148, PY2 = 34, PL2 = 126, PR2 = 170;
    return (t, { color } = {}) => {
      for (let r = 0; r < H6; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W6; x++) {
          const k = r * W6 + x;
          let cr = 0.09, cg = 0.06, cb = 0.12;
          const v = clamp6(y / HORIZON);
          const near = clamp6(1 - Math.abs(x - SUNX) / 110) * clamp6(1.15 - v);
          cr = mix6(0.02, 0.34 + 0.5 * near, Math.pow(v, 2.1));
          cg = mix6(0.015, 0.2 + 0.4 * near, Math.pow(v, 2.1));
          cb = mix6(0.04, 0.26 + 0.2 * near, Math.pow(v, 2.1));
          if (y < 30 && hash6(x, y * 3 + 1) > 0.9985) {
            cr = 0.85, cg = 0.85, cb = 0.9;
          }
          if (y > PY2) {
            const lx = PL2 + (PX2 - PL2) * (y - PY2) / (HORIZON - PY2);
            const rx = PR2 + (PX2 - PR2) * (y - PY2) / (HORIZON - PY2);
            if (x > lx && x < rx) {
              const lit = x > PX2 ? 0.35 : 0.6;
              cr = mix6(0.18, 0.4, lit), cg = mix6(0.12, 0.28, lit), cb = mix6(0.2, 0.3, lit);
            }
          }
          if (y > PY && y < HORIZON) {
            const lx = PL + (PX - PL) * (y - PY) / (HORIZON - PY);
            const rx = PR + (PX - PR) * (y - PY) / (HORIZON - PY);
            if (x > lx && x < rx) {
              const course = Math.abs((y - PY) % 3.2 - 1.6) < 0.35;
              const sideK = x < PX ? 0 : 1;
              const warm = sideK === 0 ? clamp6(1 - Math.abs(lx - SUNX) / 90) : clamp6(1 - Math.abs(rx - SUNX) / 90);
              let base = 0.32 + 0.55 * (sideK === 0 ? warm * 0.9 : warm * 0.2);
              base *= 0.92 + 0.08 * noise6(x * 0.5, y * 0.5, 2);
              if (course) base *= 0.88;
              cr = base * mix6(0.85, 1, warm), cg = base * mix6(0.6, 0.9, warm), cb = base * mix6(0.9, 0.65, warm);
              if (sideK === 0 || SUNX > PX) {
                if (Math.abs((sideK === 0 ? lx : rx) - SUNX) < 30) {
                  cr = mix6(cr, 0.95, 0.4), cg = mix6(cg, 0.8, 0.4), cb = mix6(cb, 0.5, 0.4);
                }
              }
            }
          }
          if (y >= HORIZON) {
            const dz = y - HORIZON;
            const ripple = fbm4(x * 0.04, dz * 0.1, 2, 8);
            const ridge = Math.abs((x * 0.06 + ripple * 14) % 20 - 10);
            const band = clamp6(1 - dz / 34);
            const face = ridge > 10 ? 0 : ridge / 10;
            let dcr = 0.13 + 0.62 * face * face * band + 0.2 * band;
            let dcg = 0.09 + 0.5 * face * face * band + 0.16 * band;
            let dcb = 0.16 + 0.5 * face * band + 0.2 * band;
            const camY = HORIZON + 8;
            if (y > camY - 2 && y < camY + 2) {
              const cx = Math.floor(x - t * 12 * caravan % 240);
              if (cx % 22 === 0 || cx % 22 === 1) {
                dcr = 0.06, dcg = 0.05, dcb = 0.08;
              }
            }
            cr = dcr, cg = dcg, cb = dcb;
          }
          halftone(k, r, x, clamp6(cr), clamp6(cg), clamp6(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H6; r++) lines.push(out.slice(r * W6, (r + 1) * W6).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/petra.ts
  var meta7 = {
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
      beam: 1
    },
    params: {
      beam: { label: "beam sway", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#170b0c",
      "#2c1517",
      "#4b2325",
      "#6e3733",
      "#8f4f3f",
      "#b06a4d",
      "#cd8a5f",
      "#e2ab76",
      "#f2c98e",
      "#fce6b4",
      "#fff5d8",
      "#ffffff"
    ]
  };
  var W7 = 200;
  var H7 = 100;
  function hash7(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise7(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash7(x0, yi), b = hash7(x1, yi), c = hash7(x0, yi + 1), d = hash7(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp7 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix7 = (a, b, k) => a + (b - a) * k;
  var hex7 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function petra(o = {}) {
    const beamSway = o.beam ?? meta7.options.beam;
    const P = meta7.palette.map(hex7);
    const out = new Array(W7 * H7);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp7(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp7(1 - level)) / peak;
        color[k] = nearest(clamp7(cr * s), clamp7(cg * s), clamp7(cb * s));
      }
    };
    return (t, { color } = {}) => {
      const sway = Math.sin(t / meta7.loop * Math.PI * 2) * beamSway;
      for (let r = 0; r < H7; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W7; x++) {
          const k = r * W7 + x;
          let cr = 0.06, cg = 0.03, cb = 0.035;
          const leftEdge = 30 - y / H7 * 8;
          const rightEdge = W7 - leftEdge;
          if (x < leftEdge || x > rightEdge) {
            const stri = noise7(x * 0.3, y * 0.9, 2);
            const g = 0.07 + stri * 0.09;
            cr = g * 1.1, cg = g * 0.8, cb = g * 0.75;
          } else {
            const beamX = 100 + sway * 14;
            const beamW = 26;
            const shaft = Math.exp(-(((x - beamX) / beamW) ** 2));
            const inFacade = y > 26 && y < 86 && x > 72 - (y - 26) * 0.05 && x < 128 + (y - 26) * 0.05;
            if (inFacade) {
              let g = 0.32 + noise7(x * 0.4, y * 0.4, 2) * 0.06;
              cr = g * 1.25, cg = g * 0.95, cb = g * 0.85;
              const ped = y < 34 && Math.abs(x - 100) < (34 - y) * 2.4;
              const urn = y < 30 && Math.abs(x - 100) < 2;
              const colX = [76, 84, 92, 108, 116, 124];
              let onCol = false;
              for (const cx of colX) {
                if (Math.abs(x - cx) < 3 && y > 44 && y < 82) onCol = true;
              }
              const door = y > 74 && Math.abs(x - 100) < 6;
              if (ped || urn || onCol || door) {
                cr *= 0.82, cg *= 0.82, cb *= 0.85;
              }
              cr = mix7(cr, cr * 1.9, shaft * 0.85);
              cg = mix7(cg, cg * 1.7, shaft * 0.85);
              cb = mix7(cb, cb * 1.4, shaft * 0.85);
              const hot = Math.exp(-(((x - beamX) / 8) ** 2)) * Math.exp(-(((y - 52) / 30) ** 2));
              cr = mix7(cr, 1, hot * 0.5);
              cg = mix7(cg, 0.8, hot * 0.4);
              cb = mix7(cb, 0.55, hot * 0.3);
            } else if (y > 26) {
              cr = 0.05, cg = 0.03, cb = 0.04;
              if (y > 86) {
                const spill = shaft * clamp7(1 - (y - 86) / 12);
                cr = mix7(cr, 0.75, spill), cg = mix7(cg, 0.5, spill), cb = mix7(cb, 0.35, spill);
              }
            } else {
              cr = 0.25, cg = 0.2, cb = 0.24;
            }
          }
          halftone(k, r, x, clamp7(cr), clamp7(cg), clamp7(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H7; r++) lines.push(out.slice(r * W7, (r + 1) * W7).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/colosseum.ts
  var meta8 = {
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
      sunX: 40
    },
    params: {
      sunX: { label: "sun position", min: 10, max: 90, step: 1 }
    },
    palette: [
      "#1b130c",
      "#2e2013",
      "#4a3220",
      "#6a4a2c",
      "#8d6a42",
      "#b08a5a",
      "#d0ab74",
      "#e6c894",
      "#f4dda9",
      "#fcf0cf",
      "#ffffff"
    ]
  };
  var W8 = 200;
  var H8 = 100;
  function hash8(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise8(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    let x0 = (xi % period + period) % period, x1 = (x0 + 1) % period;
    const fx2 = x - xi, fy2 = y - yi;
    const u = fx2 * fx2 * (3 - 2 * fx2), v = fy2 * fy2 * (3 - 2 * fy2);
    const a = hash8(x0, yi), b = hash8(x1, yi), c = hash8(x0, yi + 1), d = hash8(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp8 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix8 = (a, b, k) => a + (b - a) * k;
  var hex8 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function colosseum(o = {}) {
    const SUNX = o.sunX ?? meta8.options.sunX;
    const P = meta8.palette.map(hex8);
    const out = new Array(W8 * H8);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp8(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp8(1 - level)) / peak;
        color[k] = nearest(clamp8(cr * s), clamp8(cg * s), clamp8(cb * s));
      }
    };
    const CX = 100, CY = 58;
    const ROX = 84, ROY = 34;
    const RIX = 46, RIY = 17;
    return (t, { color } = {}) => {
      for (let r = 0; r < H8; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W8; x++) {
          const k = r * W8 + x;
          const pulse = 0.92 + 0.08 * Math.sin(t / meta8.loop * Math.PI * 2);
          const near = clamp8(1 - Math.abs(x - SUNX) / 130) * pulse;
          let cr = mix8(0.09, 0.16 + 0.4 * near, clamp8(1 - y / 60));
          let cg = mix8(0.06, 0.12 + 0.3 * near, clamp8(1 - y / 60));
          let cb = mix8(0.1, 0.14 + 0.22 * near, clamp8(1 - y / 60));
          const ex = (x - CX) / ROX;
          const ey = (y - CY) / ROY;
          const dist = ex * ex + ey * ey;
          const ix = (x - CX) / RIX;
          const iy = (y - CY) / RIY;
          const dIn = ix * ix + iy * iy;
          if (dist < 1) {
            let tone = 0.34 + noise8(x * 0.4, y * 0.4, 2) * 0.08;
            const sunSide = clamp8(1 - Math.abs(x - SUNX) / ROX * 0.8);
            const storeyY = (y - (CY - ROY)) / (2 * ROY);
            const bandN = storeyY < 0.12 ? 3 : storeyY < 0.42 ? 1 : storeyY < 0.7 ? 2 : 3;
            const front = y > CY - 6;
            const archW = 9;
            const archA = Math.abs(x / archW % 1 - 0.5);
            const inArch = front && archA < 0.32 && storeyY > 0.06 && storeyY < 0.78;
            const jag = hash8(Math.floor(x / 3), 7) > 0.5;
            const topEdge = CY - ROY + (x > 30 && x < 130 && jag ? 8 : storeyY < 0.1 ? 0 : 0);
            if (y < topEdge) {
              cr = 0.09, cg = 0.06, cb = 0.1;
            } else if (inArch) {
              cr = tone * 0.55, cg = tone * 0.5, cb = tone * 0.4;
              const bounce = clamp8(1 - Math.abs(y - (CY + 10)) / 20);
              cr += bounce * 0.2, cg += bounce * 0.14, cb += bounce * 0.1;
            } else if (dIn < 1) {
              const sandy = 0.5 + 0.15 * noise8(x * 0.3, y * 0.3, 3);
              cr = sandy, cg = sandy * 0.9, cb = sandy * 0.7;
              const wall = Math.abs(x - CX) < 2 || Math.abs(y - CY) < 1.5;
              if (wall) cr *= 0.35, cg *= 0.35, cb *= 0.35;
            } else {
              let sh = tone * (0.6 + 0.5 * sunSide);
              cr = sh * 1.15, cg = sh * 0.95, cb = sh * 0.8;
              const course = Math.abs(y * 0.7 % 2.4 - 1.2) < 0.3;
              if (course) cr *= 0.88, cg *= 0.88, cb *= 0.9;
            }
          }
          halftone(k, r, x, clamp8(cr), clamp8(cg), clamp8(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H8; r++) lines.push(out.slice(r * W8, (r + 1) * W8).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/great-wall.ts
  var meta9 = {
    name: "great wall",
    category: "scenes",
    note: "the wall at morning: towers on the crest, blue shadow in the valleys",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#111a24",
    options: {
      drift: 1
    },
    params: {
      drift: { label: "cloud drift", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#111a24",
      "#1c2733",
      "#2a3d45",
      "#3a5558",
      "#54706a",
      "#75937c",
      "#9fb288",
      "#c4cfa0",
      "#e0e6b8",
      "#f4f0ce",
      "#fff8dc",
      "#ffffff"
    ]
  };
  var W9 = 200;
  var H9 = 100;
  function hash9(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise9(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash9(x0, yi), b = hash9(x1, yi), c = hash9(x0, yi + 1), d = hash9(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm5(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise9(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp9 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix9 = (a, b, k) => a + (b - a) * k;
  var hex9 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function greatWall(o = {}) {
    const drift = o.drift ?? meta9.options.drift;
    const P = meta9.palette.map(hex9);
    const out = new Array(W9 * H9);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp9(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp9(1 - level)) / peak;
        color[k] = nearest(clamp9(cr * s), clamp9(cg * s), clamp9(cb * s));
      }
    };
    const ridge = (x) => {
      const base = 46 - 22 * Math.exp(-(((x - 100) / 50) ** 2)) - 10 * Math.exp(-(((x - 40) / 26) ** 2)) - 8 * Math.exp(-(((x - 160) / 30) ** 2));
      return base + fbm5(x * 0.05, 0, 2, 4) * 8;
    };
    const farRidge = (x, amp, yOff) => yOff - amp * (0.5 + 0.5 * Math.sin(x * 0.05) + 0.3 * noise9(x * 0.06, 5, 3));
    const RIDGE = new Float32Array(W9);
    const FAR1 = new Float32Array(W9);
    const FAR2 = new Float32Array(W9);
    for (let x = 0; x < W9; x++) {
      RIDGE[x] = ridge(x);
      FAR1[x] = farRidge(x, 16, 22);
      FAR2[x] = farRidge(x, 12, 32);
    }
    return (t, { color } = {}) => {
      for (let r = 0; r < H9; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W9; x++) {
          const k = r * W9 + x;
          const w = clamp9(1 - y / 44);
          let cr = mix9(0.07, 0.35, w);
          let cg = mix9(0.1, 0.3, w);
          let cb = mix9(0.16, 0.44, w);
          const cl = noise9(x * 0.04, y * 0.08 + t * drift * 0.2, 4);
          if (y < 40 && cl > 0.6) {
            const b = (cl - 0.6) * 2;
            cr = mix9(cr, 0.5, b * 0.4), cg = mix9(cg, 0.45, b * 0.4), cb = mix9(cb, 0.55, b * 0.4);
          }
          if (y > FAR1[x] && y < RIDGE[x] - 2) {
            cr = 0.09 + 0.028, cg = 0.13 + 0.0336, cb = 0.2 + 0.0392;
          } else if (y > FAR2[x] && y < RIDGE[x] - 2) {
            cr = 0.09 + 0.042, cg = 0.13 + 0.0504, cb = 0.2 + 0.0588;
          }
          const ry = RIDGE[x];
          if (y > ry && y < H9 - 1) {
            const depth = clamp9((y - ry) / 34);
            const lit = clamp9(1 - depth * 3.4);
            const rocky = noise9(x * 0.5, y * 0.5, 2);
            const g = mix9(0.42 + 0.2 * rocky, 0.14, depth);
            cr = mix9(mix9(0.35 + 0.45 * lit, 0.2, rocky * 0.4), 0.12, depth);
            cg = mix9(mix9(0.3 + 0.42 * lit, 0.2, rocky * 0.4), 0.12, depth);
            cb = mix9(mix9(0.32 + 0.34 * lit, 0.28, rocky * 0.4), 0.2, depth);
            const valley = 1 - clamp9((y - (ry + 8)) / 12);
            cr *= mix9(1, 0.7, valley * depth), cg *= mix9(1, 0.75, valley * depth), cb *= mix9(1, 0.9, valley * depth);
          }
          const wy = ry;
          if (y > wy - 2 && y < wy + 4) {
            const crenel = x % 5 < 2 && y < wy - 1;
            let g = y < wy ? 0.72 : 0.6;
            if (crenel) g = 0.85;
            const tx = Math.abs((x + 13) % 52 - 26);
            if (tx < 3 && y > wy - 6) g = 0.9;
            if (tx < 3 && y < wy - 6) g = 0.4;
            cr = g, cg = g * 0.96, cb = g * 0.88;
            if (y > wy + 2) cr *= 0.9, cg *= 0.9, cb *= 0.9;
          }
          halftone(k, r, x, clamp9(cr), clamp9(cg), clamp9(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H9; r++) lines.push(out.slice(r * W9, (r + 1) * W9).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/chichen-itza.ts
  var meta10 = {
    name: "chichen itza",
    category: "scenes",
    note: "El Castillo in raking light, stairs in shadow, swifts wheeling above",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#121a10",
    options: {
      birds: 1
    },
    params: {
      birds: { label: "swifts", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#121a10",
      "#1f2c1a",
      "#2e4021",
      "#465c29",
      "#6a7d3a",
      "#93a254",
      "#b8bd74",
      "#d5d496",
      "#e8dcab",
      "#f4e6bd",
      "#fff3d2",
      "#ffffff"
    ]
  };
  var W10 = 200;
  var H10 = 100;
  function hash10(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise10(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash10(x0, yi), b = hash10(x1, yi), c = hash10(x0, yi + 1), d = hash10(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp10 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix10 = (a, b, k) => a + (b - a) * k;
  var hex10 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function chichenItza(o = {}) {
    const birds = o.birds ?? meta10.options.birds;
    const P = meta10.palette.map(hex10);
    const out = new Array(W10 * H10);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp10(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp10(1 - level)) / peak;
        color[k] = nearest(clamp10(cr * s), clamp10(cg * s), clamp10(cb * s));
      }
    };
    const BASE_Y = 88, TOP_Y = 38;
    return (t, { color } = {}) => {
      for (let r = 0; r < H10; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W10; x++) {
          const k = r * W10 + x;
          const w = clamp10(1 - y / 50);
          let cr = mix10(0.07, 0.3, w);
          let cg = mix10(0.08, 0.26, w);
          let cb = mix10(0.1, 0.2, w);
          if (y < 34) {
            for (let b = 0; b < 7 * birds; b++) {
              const seed = hash10(b * 13, 3);
              const R = 14 + seed * 16;
              const CX2 = 30 + seed * 140;
              const ph = t / meta10.loop * Math.PI * 2 * (0.6 + seed) + b;
              const bx = CX2 + Math.cos(ph) * R;
              const by = 10 + seed * 20 + Math.sin(ph) * 5;
              if (Math.abs(x - bx) < 1.4 && Math.abs(y - by) < 0.9) {
                cr = 0.14, cg = 0.15, cb = 0.13;
              }
            }
          }
          if (y > 60) {
            const canopy = noise10(x * 0.3, y * 0.35, 3);
            const leaf = 0.12 + canopy * 0.15;
            cr = leaf * 0.85, cg = leaf * 1.3, cb = leaf * 0.7;
            const bump = 62 + noise10(x * 0.2, 7, 4) * 4;
            if (y < bump) cr = 0.07, cg = 0.12, cb = 0.1;
          }
          if (y < BASE_Y && y > TOP_Y) {
            const yn = (BASE_Y - y) / (BASE_Y - TOP_Y);
            const halfW = 54 * (1 - yn) + 14;
            if (Math.abs(x - 100) < halfW) {
              const stepH = (BASE_Y - TOP_Y) / 9.6;
              const stepI = Math.floor((BASE_Y - y) / stepH);
              const inStep = BASE_Y - y - stepI * stepH;
              const tread = inStep > stepH * 0.62;
              let g = tread ? 0.28 : 0.55 + 0.1 * noise10(x * 0.4, y * 0.4, 2);
              const side = x < 100 ? 1 : 0.76;
              cr = g * 1.05 * side, cg = g * 0.95 * side, cb = g * 0.7 * side;
              const stair = Math.abs(x - 100) < 7;
              const bal = Math.abs(Math.abs(x - 100) - 7) < 1.2;
              if (bal && y > 46) {
                cr = 0.5, cg = 0.48, cb = 0.4;
              } else if (stair) {
                const shad = 0.12 + 0.06 * noise10(x * 0.7, y * 0.7, 2);
                cr = shad, cg = shad, cb = shad * 0.9;
              }
              if (y > 82 && Math.abs(x - 100) < 10 && y < 86) {
                cr = 0.42, cg = 0.4, cb = 0.34;
              }
            } else {
              const canopy = noise10(x * 0.25, y * 0.3, 3);
              cr = 0.06 + canopy * 0.06, cg = 0.1 + canopy * 0.1, cb = 0.05 + canopy * 0.04;
            }
          }
          if (y >= TOP_Y - 8 && y < TOP_Y) {
            if (Math.abs(x - 100) < 16) {
              let g = 0.35 + noise10(x * 0.4, y * 0.4, 2) * 0.1;
              if (y > TOP_Y - 5 && Math.abs(x - 100) < 3) g = 0.08;
              const side = x < 100 ? 1 : 0.78;
              cr = g * 1.05 * side, cg = g * 0.95 * side, cb = g * 0.72 * side;
            } else if (y > 60) {
              cr = 0.1, cg = 0.16, cb = 0.07;
            }
          }
          halftone(k, r, x, clamp10(cr), clamp10(cg), clamp10(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H10; r++) lines.push(out.slice(r * W10, (r + 1) * W10).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/machu-picchu.ts
  var meta11 = {
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
      mist: 1
    },
    params: {
      mist: { label: "mist motion", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#0d1410",
      "#16221a",
      "#223425",
      "#32492f",
      "#47633c",
      "#658052",
      "#8ba273",
      "#b3c39a",
      "#d4dcbc",
      "#e8e6c8",
      "#f4e9c0",
      "#fbf4d8",
      "#ffffff"
    ]
  };
  var W11 = 200;
  var H11 = 100;
  function hash11(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise11(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash11(x0, yi), b = hash11(x1, yi), c = hash11(x0, yi + 1), d = hash11(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm6(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise11(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp11 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix11 = (a, b, k) => a + (b - a) * k;
  var hex11 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function machuPicchu(o = {}) {
    const mistSpeed = o.mist ?? meta11.options.mist;
    const P = meta11.palette.map(hex11);
    const out = new Array(W11 * H11);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp11(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp11(1 - level)) / peak;
        color[k] = nearest(clamp11(cr * s), clamp11(cg * s), clamp11(cb * s));
      }
    };
    const CONE = (x) => {
      const cx = 58;
      if (Math.abs(x - cx) > 30) return 999;
      const u = 1 - Math.abs(x - cx) / 30;
      return 14 + (1 - u * u) * 30;
    };
    const CITY_TOP = 56;
    return (t, { color } = {}) => {
      const drift = t * mistSpeed * 0.3 % 16;
      for (let r = 0; r < H11; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W11; x++) {
          const k = r * W11 + x;
          const w = clamp11(1 - y / 40);
          const warmRight = clamp11(1 - Math.abs(x - 170) / 90);
          let cr = mix11(0.09, 0.34 + 0.2 * warmRight, w);
          let cg = mix11(0.11, 0.36 + 0.16 * warmRight, w);
          let cb = mix11(0.13, 0.4 + 0.1 * warmRight, w);
          const ridgeY = 48 + noise11(x * 0.04, 9, 3) * 6;
          if (y > ridgeY && y < CITY_TOP + 20 && x < 190) {
            const g = 0.1 + noise11(x * 0.3, y * 0.3, 2) * 0.08;
            cr = g * 0.7, cg = g * 1.15, cb = g * 0.65;
          }
          const coneY = CONE(x);
          if (y > coneY && y < 84) {
            const elev = clamp11((y - coneY) / 44);
            const steep = noise11(x * 0.4, y * 0.4, 2);
            let g = 0.34 + 0.22 * steep;
            g = mix11(g, 0.5 + 0.3 * steep, clamp11(1 - elev * 4));
            cr = g * 0.75, cg = g * 1.1, cb = g * 0.7;
            if (x > 40 && x < 76 && y > 58 && Math.abs((y - 58) * 0.8 % 2) < 0.4) {
              g *= 0.9;
              cr = g * 0.75, cg = g * 1.1, cb = g * 0.7;
            }
          }
          if (x > 76 && x < 150 && y > CITY_TOP && y < 84) {
            const ty = (y - CITY_TOP) / (84 - CITY_TOP);
            const stepI = Math.floor(ty * 9);
            const inStep = ty * 9 - stepI;
            const lit = clamp11(0.4 + 0.6 * ((x - 76) / 74));
            if (inStep < 0.55) {
              let g = (0.5 + 0.2 * lit) * (0.9 + 0.1 * noise11(x * 0.7, y * 0.7, 2));
              cr = g, cg = g * 0.98, cb = g * 0.85;
            } else {
              let g = 0.3 + 0.16 * noise11(x * 0.3, stepI * 3, 2);
              g = mix11(g, 0.62, lit * 0.6);
              cr = g * 0.8, cg = g * 1.05, cb = g * 0.68;
            }
          }
          const mistD = fbm6(x * 0.03, y * 0.05 + drift, 2, 8);
          const valleyMist = clamp11((y - 62) / 30) * clamp11(1 - Math.abs(x - 110) / 130) * clamp11(mistD * 1.6 - 0.35);
          if (valleyMist > 0.02) {
            const mc = 0.75 + 0.1 * mistD;
            cr = mix11(cr, mc * 0.97, clamp11(valleyMist * 1.4)), cg = mix11(cg, mc * 1.02, clamp11(valleyMist * 1.4)), cb = mix11(cb, mc * 0.98, clamp11(valleyMist * 1.4));
          }
          halftone(k, r, x, clamp11(cr), clamp11(cg), clamp11(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H11; r++) lines.push(out.slice(r * W11, (r + 1) * W11).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/christ-redeemer.ts
  var meta12 = {
    name: "christ redeemer",
    category: "scenes",
    note: "the hilltop statue over Rio at blue hour, city lights below, arms level",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#0a1220",
    options: {
      shimmer: 1
    },
    params: {
      shimmer: { label: "city shimmer", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#0a1220",
      "#122036",
      "#1c3350",
      "#2c4a6e",
      "#45688e",
      "#6f8fae",
      "#a5b8c8",
      "#d6dbc2",
      "#e8c86a",
      "#f7df8e",
      "#fff1b8",
      "#ffffff"
    ]
  };
  var W12 = 200;
  var H12 = 100;
  function hash12(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise12(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash12(x0, yi), b = hash12(x1, yi), c = hash12(x0, yi + 1), d = hash12(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm7(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise12(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp12 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix12 = (a, b, k) => a + (b - a) * k;
  var hex12 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function christRedeemer(o = {}) {
    const shimmer = o.shimmer ?? meta12.options.shimmer;
    const P = meta12.palette.map(hex12);
    const out = new Array(W12 * H12);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp12(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp12(1 - level)) / peak;
        color[k] = nearest(clamp12(cr * s), clamp12(cg * s), clamp12(cb * s));
      }
    };
    const CX = 100;
    const HEAD_Y = 14;
    return (t, { color } = {}) => {
      for (let r = 0; r < H12; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W12; x++) {
          const k = r * W12 + x;
          const v = clamp12(y / 62);
          let cr = mix12(0.04, 0.1 + 0.3 * clamp12(1 - Math.abs(x - 150) / 110), v);
          let cg = mix12(0.05, 0.14 + 0.3 * clamp12(1 - Math.abs(x - 150) / 110), v);
          let cb = mix12(0.11, 0.22 + 0.24 * clamp12(1 - Math.abs(x - 150) / 110), v);
          if (hash12(x * 7 + 3, r * 11) > 0.996 && y < 34) {
            cr = 0.8, cg = 0.88, cb = 1;
          }
          const loafY = 36 + 26 * Math.max(0, 1 - Math.abs(x - 178) / 14);
          if (Math.abs(x - 178) < 14 && y > loafY && y < 66) {
            cr = 0.05, cg = 0.07, cb = 0.1;
          }
          if (y > 66) {
            const dz = y - 66;
            const wobble = fbm7(x * 0.06, dz * 0.1 + t * shimmer * 0.35, 2, 8);
            let wc = 0.04 + 0.02 * wobble;
            cr = wc, cg = wc * 1.2, cb = wc * 1.6;
            const streakSeed = hash12(Math.floor(x / 3), 5);
            if (streakSeed > 0.55) {
              const sk = clamp12(1 - dz / 26) * (0.3 + 0.7 * wobble);
              const warm = streakSeed > 0.8;
              if (warm) cr += sk * 0.8, cg += sk * 0.55, cb += sk * 0.2;
              else cr += sk * 0.4, cg += sk * 0.5, cb += sk * 0.7;
            }
          }
          const cityLine = 66;
          if (y < cityLine && y > 40) {
            const hill = noise12(x * 0.05, 3, 2) * 5;
            const top = hill + 44;
            if (y > top) {
              const lx = Math.floor(x / 2), ly = Math.floor((y - top) / 2);
              const spark = hash12(lx, ly);
              const spark2 = hash12(lx * 3, ly * 7 + Math.floor(t * shimmer) % 5);
              if (spark > 0.4) {
                const bright = (spark - 0.4) * 1.7 + (spark2 > 0.7 ? 0.3 : 0);
                cr = 0.3 + bright * 0.7, cg = 0.24 + bright * 0.5, cb = 0.14 + bright * 0.2;
              } else {
                cr = 0.05, cg = 0.07, cb = 0.11;
              }
            }
          }
          const mtTop = 48 + 10 * Math.exp(-(((x - CX) / 22) ** 2)) - 6 * Math.exp(-(((x - 70) / 24) ** 2));
          if (y > mtTop && y <= 66) {
            const rocky = noise12(x * 0.4, y * 0.4, 2);
            cr = 0.05 + rocky * 0.05, cg = 0.08 + rocky * 0.06, cb = 0.11 + rocky * 0.06;
          }
          const fy = (y - HEAD_Y) / 22;
          if (fy > 0 && fy < 1 && y < 40) {
            const bodyHalf = mix12(2.4, 2.8, clamp12(fy));
            const dx = Math.abs(x - CX);
            const armRow = fy > 0.3 && fy < 0.62;
            const armHalf = armRow ? 17 : 0;
            const onPed = fy >= 0.78 && dx < 4.2;
            if (dx < bodyHalf || armRow && dx < armHalf || onPed) {
              const lit = dx < bodyHalf || onPed ? 0.85 : 0.35 + 0.5 * clamp12(1 - (dx - bodyHalf) / (armHalf - bodyHalf + 1));
              let gCl = 0.8 * lit + 0.15;
              cr = gCl, cg = gCl * 0.98, cb = gCl * 0.92;
            }
          }
          halftone(k, r, x, clamp12(cr), clamp12(cg), clamp12(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H12; r++) lines.push(out.slice(r * W12, (r + 1) * W12).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/angkor-wat.ts
  var meta13 = {
    name: "angkor wat",
    category: "scenes",
    note: "sunrise across the reflecting pool, towers in silhouette, one gold ray",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#141022",
    options: {
      stir: 1
    },
    params: {
      stir: { label: "pool stir", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#141022",
      "#201a34",
      "#302a4c",
      "#453f66",
      "#5f5a80",
      "#8a8098",
      "#b5aab0",
      "#d8c8a4",
      "#e6c084",
      "#f2d492",
      "#fae6b2",
      "#fff3d0",
      "#ffffff"
    ]
  };
  var W13 = 200;
  var H13 = 100;
  function hash13(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise13(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash13(x0, yi), b = hash13(x1, yi), c = hash13(x0, yi + 1), d = hash13(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp13 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix13 = (a, b, k) => a + (b - a) * k;
  var hex13 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function angkorWat(o = {}) {
    const stir = o.stir ?? meta13.options.stir;
    const P = meta13.palette.map(hex13);
    const out = new Array(W13 * H13);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp13(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp13(1 - level)) / peak;
        color[k] = nearest(clamp13(cr * s), clamp13(cg * s), clamp13(cb * s));
      }
    };
    const TOWERS = [
      { cx: 74, top: 22, half: 7 },
      { cx: 100, top: 12, half: 9 },
      { cx: 126, top: 22, half: 7 }
    ];
    const TREELINE = 52;
    const POOL_TOP = 72;
    return (t, { color } = {}) => {
      for (let r = 0; r < H13; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W13; x++) {
          const k = r * W13 + x;
          const v = clamp13(y / TREELINE);
          const gold = Math.max(0, 1 - Math.abs(x - 100) / 70) * clamp13(1 - y / TREELINE);
          let cr = mix13(0.08, 0.16 + 0.5 * gold, v);
          let cg = mix13(0.06, 0.14 + 0.45 * gold, v);
          let cb = mix13(0.13, 0.24 + 0.2 * gold, v);
          let onTower = null;
          for (const T of TOWERS) {
            const dx = Math.abs(x - T.cx);
            const dx2 = dx * dx;
            if (dx < T.half && y > T.top && y < TREELINE) {
              const h = (TREELINE - y) / (TREELINE - T.top);
              const budHalf = T.half * Math.sin(Math.min(1, h) * Math.PI * 0.55);
              if (dx2 < budHalf * budHalf + T.half / 6) {
                onTower = { T, lit: dx < 0 ? 0 : 0.4 + 0.6 * (1 - dx / T.half) };
                break;
              }
            }
          }
          if (onTower) {
            const lit = onTower.lit * clamp13(0.2 + 0.8 * gold * 1.6);
            cr = mix13(0.09, 0.42, lit), cg = mix13(0.07, 0.36, lit), cb = mix13(0.1, 0.3, lit);
          }
          if (y > TREELINE && y < POOL_TOP) {
            const bump = noise13(x * 0.16, 7, 3) * 1.6;
            let edge = false;
            if (y < TREELINE + bump) edge = true;
            const wallX = x > 62 && x < 138;
            if (!wallX && y > TREELINE + 6) edge = false;
            let g = 0.07 + noise13(x * 0.3, y * 0.4, 2) * 0.05;
            cr = g * 0.9, cg = g * 1.05, cb = g * 0.9;
            if (wallX && y > TREELINE + 3) cr *= 1.04;
          }
          if (y > POOL_TOP) {
            const dz = y - POOL_TOP;
            const srcY = TREELINE - dz * 0.72;
            const stir1 = noise13(x * 0.06, dz * 0.25 + t * stir * 0.4, 2);
            let mcr = 0.07, mcg = 0.05, mcb = 0.12;
            const mk = clamp13(1 - dz / 26);
            if (mk > 0) {
              const goldM = Math.max(0, 1 - Math.abs(x - 100) / 70) * clamp13(0.2 + 0.8 * stir1);
              mcr = mix13(0.12, 0.5 * goldM + 0.1, goldM), mcg = mix13(0.1, 0.42 * goldM + 0.08, goldM), mcb = mix13(0.16, 0.2 * goldM + 0.12, goldM);
              for (const T of TOWERS) {
                const dx = Math.abs(x - T.cx);
                if (dx < T.half && TREELINE - srcY < (TREELINE - T.top) * 0.8) {
                  mcr = mix13(mcr, 0.07, 0.7), mcg = mix13(mcg, 0.05, 0.7), mcb = mix13(mcb, 0.09, 0.7);
                }
              }
            }
            cr = mix13(cr, mcr, mk), cg = mix13(cg, mcg, mk), cb = mix13(cb, mcb, mk);
            const sliver = hash13(Math.floor((y - POOL_TOP) * 3 + t * stir), x) > 0.75;
            if (!sliver) cr *= 0.85, cg *= 0.85, cb *= 0.85;
          }
          halftone(k, r, x, clamp13(cr), clamp13(cg), clamp13(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H13; r++) lines.push(out.slice(r * W13, (r + 1) * W13).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/santorini.ts
  var meta14 = {
    name: "santorini",
    category: "scenes",
    note: "white cubes over the caldera, blue domes, the Aegean below",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#1a3a50",
    options: {
      ferry: 3.5
    },
    params: {
      ferry: { label: "ferry crossing", min: 0, max: 8, step: 0.2 }
    },
    palette: [
      "#0e2c40",
      "#123c55",
      "#1c4e6b",
      "#2b627e",
      "#417a8f",
      "#5f96a4",
      "#8ab3bb",
      "#b4d2d4",
      "#dcebe6",
      "#f2f7ef",
      "#ffffff",
      "#2d5f8a",
      "#3d78a8"
    ]
  };
  var W14 = 200;
  var H14 = 100;
  function hash14(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise14(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash14(x0, yi), b = hash14(x1, yi), c = hash14(x0, yi + 1), d = hash14(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp14 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix14 = (a, b, k) => a + (b - a) * k;
  var hex14 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function santorini(o = {}) {
    const ferrySpeed = o.ferry ?? meta14.options.ferry;
    const P = meta14.palette.map(hex14);
    const out = new Array(W14 * H14);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp14(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp14(1 - level)) / peak;
        color[k] = nearest(clamp14(cr * s), clamp14(cg * s), clamp14(cb * s));
      }
    };
    const HORIZON = 58;
    const rimY = (x) => 18 + 10 * Math.sin(x * 0.03 + 1.2) + noise14(x * 0.08, 3, 2) * 3;
    return (t, { color } = {}) => {
      for (let r = 0; r < H14; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W14; x++) {
          const k = r * W14 + x;
          const v = clamp14(y / rimY(x));
          let cr = mix14(0.2, 0.5, v), cg = mix14(0.4, 0.66, v), cb = mix14(0.66, 0.85, v);
          const rim = rimY(x);
          if (y > rim && y < HORIZON) {
            const q = (y - rim) / (HORIZON - rim);
            const row = Math.floor((y - rim) / 4.4);
            const cubeX = Math.floor(x / 5.5);
            const lit = clamp14(0.55 + 0.45 * Math.cos((x - 62) * 0.03));
            const dome = hash14(cubeX, row * 3) > 0.86 && q < 0.6;
            const isRock = hash14(cubeX * 7, row) > 0.8 && q > 0.68;
            if (isRock) {
              const g = 0.3 + 0.14 * noise14(x * 0.5, y * 0.5, 2);
              cr = g * 1.1, cg = g * 0.95, cb = g * 0.8;
            } else if (dome) {
              const dy = Math.abs((y - rim) % 4.4 - 2.2);
              const dk = clamp14(1.1 - dy / 2.2);
              cr = mix14(0.16, 0.34, dk * lit), cg = mix14(0.34, 0.52, dk * lit), cb = mix14(0.62, 0.78, dk * lit);
            } else {
              const shade = 0.82 + 0.18 * hash14(cubeX, row * 5);
              cr = mix14(0.92, 1, shade) * mix14(0.75, 1, lit);
              cg = mix14(0.93, 1, shade) * mix14(0.76, 1, lit);
              cb = mix14(0.92, 1, shade) * mix14(0.8, 1, lit);
            }
          }
          if (y >= HORIZON) {
            const dz = y - HORIZON;
            const base = 0.1 + 0.1 * clamp14(1 - dz / 40);
            cr = base * 0.7, cb = base * 2.1, cg = base * 1.5;
            const path = Math.exp(-(((x - 130) / 30) ** 2)) * clamp14(1 - dz / 30);
            cr += path * 0.5, cg += path * 0.6, cb += path * 0.8;
            if (ferrySpeed > 0) {
              const fx0 = (ferrySpeed * t * 5 + 40) % 260 - 40;
              const ferryY = HORIZON + 9;
              if (Math.abs(x - fx0) < 2.4 && Math.abs(y - ferryY) < 1) {
                cr = 0.95, cg = 0.95, cb = 0.9;
              }
              const inWake = Math.abs(x - (fx0 - 4)) < 3 && y > ferryY - 0.4 && y < ferryY + 2.6;
              if (inWake) {
                cr += 0.16, cg += 0.2, cb += 0.24;
              }
            }
          }
          halftone(k, r, x, clamp14(cr), clamp14(cg), clamp14(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H14; r++) lines.push(out.slice(r * W14, (r + 1) * W14).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/ha-long-bay.ts
  var meta15 = {
    name: "ha long bay",
    category: "scenes",
    note: "limestone towers in morning haze, boats crossing the glass-flat sea",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#20303a",
    options: {
      boat: 2.2,
      haze: 1
    },
    params: {
      boat: { label: "boat crossing", min: 0, max: 8, step: 0.2 },
      haze: { label: "haze motion", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#20303a",
      "#2a4250",
      "#365a66",
      "#4a747c",
      "#6a948e",
      "#92b2a2",
      "#b8ccae",
      "#d9e0be",
      "#ecddc0",
      "#f6e8cc",
      "#fdf6e0",
      "#ffffff"
    ]
  };
  var W15 = 200;
  var H15 = 100;
  function hash15(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise15(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash15(x0, yi), b = hash15(x1, yi), c = hash15(x0, yi + 1), d = hash15(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp15 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix15 = (a, b, k) => a + (b - a) * k;
  var hex15 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function haLongBay(o = {}) {
    const boat = o.boat ?? meta15.options.boat;
    const hazeSpeed = o.haze ?? meta15.options.haze;
    const P = meta15.palette.map(hex15);
    const out = new Array(W15 * H15);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp15(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp15(1 - level)) / peak;
        color[k] = nearest(clamp15(cr * s), clamp15(cg * s), clamp15(cb * s));
      }
    };
    const HORIZON = 56;
    const KARSTS = [
      { cx: 30, top: 16, half: 14, dist: 0.9 },
      { cx: 62, top: 26, half: 10, dist: 0.6 },
      { cx: 88, top: 20, half: 12, dist: 0.75 },
      { cx: 118, top: 30, half: 8, dist: 0.45 },
      { cx: 146, top: 24, half: 11, dist: 0.65 },
      { cx: 178, top: 34, half: 7, dist: 0.35 }
    ];
    return (t, { color } = {}) => {
      const hazeDrift = t * hazeSpeed * 0.25 % 16;
      for (let r = 0; r < H15; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W15; x++) {
          const k = r * W15 + x;
          const v = clamp15(y / HORIZON);
          const warm = clamp15(1 - Math.abs(x - 160) / 100);
          let cr = mix15(0.13, 0.4 + 0.24 * warm, v);
          let cg = mix15(0.17, 0.42 + 0.22 * warm, v);
          let cb = mix15(0.19, 0.4 + 0.14 * warm, v);
          const sheet = noise15(x * 0.03, y * 0.05 + hazeDrift, 4);
          if (y < HORIZON && sheet > 0.55) {
            const s = (sheet - 0.55) * 1.6;
            cr = mix15(cr, 0.55, s * 0.5), cg = mix15(cg, 0.58, s * 0.5), cb = mix15(cb, 0.55, s * 0.5);
          }
          for (const K of KARSTS) {
            const taper = K.half * (0.62 + 0.38 * clamp15(HORIZON - K.top === 0 ? 0 : (y - K.top) / (HORIZON - K.top)));
            const dx = Math.abs(x - K.cx);
            if (dx < taper && y > K.top && y < HORIZON) {
              const sideLit = clamp15(0.45 + 0.55 * (x < K.cx ? 1 : 0.35));
              const streaks = noise15(x * 0.5, y * 0.12, 0) * 0.15;
              let g = 0.22 + 0.3 * sideLit + streaks;
              g = mix15(g, 0.62, (1 - K.dist) * 0.85);
              cr = g * 0.82, cg = g * 1.02, cb = g * 1;
              const crown = clamp15((K.top + 6 - y) / 6);
              if (crown > 0) {
                const jg = g * mix15(1, 0.72, crown);
                cr = jg * 0.72, cg = jg * 1.12, cb = jg * 0.75;
              }
              break;
            }
          }
          if (y >= HORIZON) {
            const dz = y - HORIZON;
            const hz = noise15(x * 0.05, dz * 0.09, 4);
            const mk = clamp15(1 - dz / 30);
            let mcr = 0.3 + 0.12 * hz + 0.14 * warm, mcg = 0.34 + 0.12 * hz + 0.12 * warm, mcb = 0.36 + 0.1 * hz;
            for (const K of KARSTS) {
              if (Math.abs(x - K.cx) < K.half) {
                mcr = mix15(mcr, 0.4, mk * 0.25), mcg = mix15(mcg, 0.44, mk * 0.25), mcb = mix15(mcb, 0.44, mk * 0.25);
              }
            }
            cr = mix15(cr, mcr, mk * 0.9), cg = mix15(cg, mcg, mk * 0.9), cb = mix15(cb, mcb, mk * 0.9);
            const glint = hash15(Math.floor(x / 4), Math.floor(dz + t * hazeSpeed)) > 0.975;
            if (glint) {
              cr += 0.14, cg += 0.15, cb += 0.12;
            }
            if (boat > 0) {
              const bx = (boat * t * 5 + 70) % 300 - 50;
              const boatY = HORIZON + 12;
              if (Math.abs(x - bx) < 3.5 && Math.abs(y - boatY) < 1) {
                cr = 0.85, cg = 0.82, cb = 0.72;
                if (y - boatY > 0.4) cr = 0.32, cg = 0.34, cb = 0.3;
              }
              const wake = Math.abs(x - (bx - 5)) < 2.6 && y > boatY - 0.4 && y < boatY + 2.4;
              if (wake) {
                cr += 0.1, cg += 0.12, cb += 0.12;
              }
            }
          }
          halftone(k, r, x, clamp15(cr), clamp15(cg), clamp15(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H15; r++) lines.push(out.slice(r * W15, (r + 1) * W15).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/stonehenge.ts
  var meta16 = {
    name: "stonehenge",
    category: "scenes",
    note: "solstice dawn: the sun rising through the ring, dew on the plain",
    cols: 200,
    rows: 100,
    cell: 1,
    fps: 12,
    loop: 16,
    ground: "#20242a",
    options: {
      haze: 1
    },
    params: {
      haze: { label: "dawn haze", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#20242a",
      "#2e343c",
      "#3e4650",
      "#545c66",
      "#6f7578",
      "#8f9188",
      "#acaa96",
      "#c8c4a4",
      "#e0d8ac",
      "#f0e4b4",
      "#faf0bc",
      "#fff8cc",
      "#ffffff"
    ]
  };
  var W16 = 200;
  var H16 = 100;
  function hash16(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise16(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash16(x0, yi), b = hash16(x1, yi), c = hash16(x0, yi + 1), d = hash16(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp16 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix16 = (a, b, k) => a + (b - a) * k;
  var hex16 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function stonehenge(o = {}) {
    const hazeSpeed = o.haze ?? meta16.options.haze;
    const P = meta16.palette.map(hex16);
    const out = new Array(W16 * H16);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp16(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp16(1 - level)) / peak;
        color[k] = nearest(clamp16(cr * s), clamp16(cg * s), clamp16(cb * s));
      }
    };
    const GROUND = 72;
    const UPRIGHTS = [42, 58, 74, 106, 122, 138, 154];
    const TRILITHON = [86, 96];
    const SUN_X = 91;
    const RING_TOP = 34, RING_BOT = GROUND - 2;
    return (t, { color } = {}) => {
      for (let r = 0; r < H16; r++) {
        const y = r + 0.5;
        const steam = noise16(0, (y + t * hazeSpeed * 0.5) * 0.1, 2);
        for (let x = 0; x < W16; x++) {
          const k = r * W16 + x;
          const v = clamp16(y / GROUND);
          const goldUp = Math.max(0, 1 - Math.abs(x - SUN_X) / 46) * clamp16(1 - y / (RING_TOP + 6) + 0.25);
          let cr = mix16(0.12, 0.34 + 0.42 * clamp16(goldUp), v);
          let cg = mix16(0.13, 0.34 + 0.36 * clamp16(goldUp), v);
          let cb = mix16(0.16, 0.38 + 0.2 * clamp16(goldUp), v);
          const sd = Math.sqrt((x - SUN_X) ** 2 + (y - 46) ** 2);
          if (sd < 5.5) {
            const e = sd / 5.5;
            cr = mix16(1, 0.85, e), cg = mix16(0.9, 0.6, e), cb = mix16(0.5, 0.28, e);
          }
          const onStone = (halfW, cx) => Math.abs(x - cx) < halfW && y > RING_TOP && y < RING_BOT;
          let stone = false;
          let stoneEdge = 0;
          for (const ux of UPRIGHTS) {
            if (onStone(3.4, ux)) {
              stone = true;
              stoneEdge = clamp16((x - (ux - 3.4)) / 6.8);
              break;
            }
          }
          let lintel = false;
          for (const tx of TRILITHON) {
            if (onStone(4, tx)) {
              stone = true;
              stoneEdge = clamp16((x - (tx - 4)) / 8);
              if (y > RING_TOP && y < RING_TOP + 4) lintel = true;
            }
          }
          for (let i = 0; i < UPRIGHTS.length - 1; i++) {
            const mid = (UPRIGHTS[i] + UPRIGHTS[i + 1]) / 2;
            if (Math.abs(x - mid) < 4.5 && y > RING_TOP - 1 && y < RING_TOP + 3.4) lintel = true;
            if (lintel) break;
          }
          if (stone) {
            const lit = clamp16(0.18 + 0.72 * stoneEdge * (0.5 + 0.5 * goldUp));
            const grain = noise16(x * 0.6, y * 0.6, 2) * 0.12;
            cr = mix16(0.14, 0.92, lit) + grain;
            cg = mix16(0.15, 0.88, lit) + grain;
            cb = mix16(0.18, 0.74, lit) + grain * 0.8;
            if (lintel) {
              cr = mix16(cr, 0.95, 0.2), cg = mix16(cg, 0.9, 0.2), cb = mix16(cb, 0.78, 0.2);
            }
          }
          if (y >= GROUND) {
            const dz = y - GROUND;
            let g = 0.16 + 0.1 * noise16(x * 0.4, y * 0.4, 3);
            cr = g, cg = g * 1.06, cb = g * 0.96;
            const shadowK = clamp16(1 - dz / 16);
            for (const s of [...UPRIGHTS, ...TRILITHON]) {
              if (x > s && x - s < 26) {
                cr *= 1 - 0.5 * shadowK, cg *= 1 - 0.5 * shadowK, cb *= 1 - 0.3 * shadowK;
              }
            }
            const steam2 = noise16(x * 0.09, (y + t * hazeSpeed * 0.5) * 0.16 + 9, 4);
            if (steam2 > 0.6) {
              const sk = (steam2 - 0.6) * 1.4 * clamp16(1 - dz / 24);
              cr = mix16(cr, 0.6, sk * 0.7), cg = mix16(cg, 0.58, sk * 0.7), cb = mix16(cb, 0.5, sk * 0.7);
            }
          }
          halftone(k, r, x, clamp16(cr), clamp16(cg), clamp16(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H16; r++) lines.push(out.slice(r * W16, (r + 1) * W16).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/neuschwanstein.ts
  var meta17 = {
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
      flicker: 1
    },
    params: {
      flicker: { label: "pane flicker", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#131629",
      "#1d2238",
      "#2a3248",
      "#3c4862",
      "#3f6a52",
      "#566180",
      "#7a7f96",
      "#a3a4b0",
      "#c9c5c8",
      "#e6e0dc",
      "#f4f0ec",
      "#fffaf2",
      "#e8c878",
      "#ffd98c",
      "#ffffff"
    ]
  };
  var W17 = 200;
  var H17 = 100;
  function hash17(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise17(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash17(x0, yi), b = hash17(x1, yi), c = hash17(x0, yi + 1), d = hash17(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp17 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix17 = (a, b, k) => a + (b - a) * k;
  var hex17 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function neuschwanstein(o = {}) {
    const flicker = o.flicker ?? meta17.options.flicker;
    const P = meta17.palette.map(hex17);
    const out = new Array(W17 * H17);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp17(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp17(1 - level)) / peak;
        color[k] = nearest(clamp17(cr * s), clamp17(cg * s), clamp17(cb * s));
      }
    };
    const CRAG = (x) => 44 + 26 * Math.exp(-(((x - 92) / 34) ** 2));
    const LAKE = 84;
    return (t, { color } = {}) => {
      const winFlicker = 0.85 + 0.15 * noise17(t * flicker * 2.2, 0, 0);
      for (let r = 0; r < H17; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W17; x++) {
          const k = r * W17 + x;
          const v = clamp17(y / 60);
          const valleyGlow = Math.max(0, 1 - Math.abs(x - 150) / 70);
          let cr = mix17(0.04, 0.3 + 0.4 * valleyGlow, v);
          let cg = mix17(0.05, 0.26 + 0.34 * valleyGlow, v);
          let cb = mix17(0.12, 0.38 + 0.36 * valleyGlow, v);
          const alpY = 30 + 6 * Math.sin(x * 0.04 + 2) + noise17(x * 0.03, 5, 3) * 4;
          if (y > alpY && y < CRAG(x) - 2) {
            const g = 0.1 + noise17(x * 0.2, y * 0.3, 2) * 0.07;
            cr = g * 0.9, cg = g * 0.86, cb = g * 1.25;
          }
          const cragY = CRAG(x);
          if (y > cragY - 14 && y < cragY + 8) {
            const forest = noise17(x * 0.35, y * 0.35, 3);
            const g = 0.07 + forest * 0.13;
            cr = g * 0.65, cg = g * 1.1, cb = g * 0.8;
            if (y < cragY - 4 && forest > 0.5) {
              cr = g * 0.55, cg = g * 1.05, cb = g * 0.75;
            }
          }
          if (y > 22 && y < cragY + 2 && Math.abs(x - 92) < 26) {
            const tiers = [40, 48, 56, 64];
            const wallTop = 26;
            const towerL = 78, towerR = 104;
            const onTowerL = Math.abs(x - towerL) < 3.4 && y > 24;
            const onTowerR = Math.abs(x - towerR) < 3.4 && y > 26;
            const onBody = x > 80 && x < 102 && y > wallTop;
            if (onTowerL || onTowerR || onBody) {
              let g = 0.88 + 0.12 * noise17(x * 0.5, y * 0.5, 2);
              const side = x < 92 ? 1 : 0.9;
              cr = g * side, cg = g * side, cb = g * (side + 0.06);
              for (const tr of tiers) {
                const roofH = 5;
                if (y > tr - roofH && y < tr) {
                  const roofEdge = Math.abs((y * 2 + x) % 7 - 3.5) > 2;
                  if (roofEdge || y < tr - roofH + 1.4) {
                    cr = 0.2, cg = 0.25, cb = 0.42;
                  }
                }
              }
              if (onTowerL && y > 20 && y < 26) {
                cr = 0.2, cg = 0.25, cb = 0.42;
              }
              if (onTowerR && y > 22 && y < 28) {
                cr = 0.2, cg = 0.25, cb = 0.42;
              }
              const winX = Math.floor(x / 2), winY = Math.floor((y - wallTop) / 3);
              if ((winX * 31 + winY * 17) % 13 < 2 && y > wallTop && !onTowerL && !onTowerR) {
                cr = 0.95 * winFlicker, cg = 0.78 * winFlicker, cb = 0.45 * winFlicker;
              }
            }
          }
          if (y >= LAKE) {
            const dz = y - LAKE;
            const sheen = noise17(x * 0.1, dz * 0.1, 4);
            const mk = clamp17(1 - dz / 14);
            cr = mix17(cr, 0.16 + 0.18 * sheen, mk), cg = mix17(cg, 0.18 + 0.2 * sheen, mk), cb = mix17(cb, 0.28 + 0.26 * sheen, mk);
            if (Math.abs(x - 92) < 18) {
              cr = mix17(cr, 0.5, mk * 0.25), cg = mix17(cg, 0.5, mk * 0.25), cb = mix17(cb, 0.52, mk * 0.25);
            }
          }
          halftone(k, r, x, clamp17(cr), clamp17(cg), clamp17(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H17; r++) lines.push(out.slice(r * W17, (r + 1) * W17).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/havasu-falls.ts
  var meta18 = {
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
      mist: 1
    },
    params: {
      mist: { label: "mist drift", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#3a130c",
      "#5c2014",
      "#7c3320",
      "#a04d2c",
      "#c26a3c",
      "#d98c5a",
      "#e9b584",
      "#f2d4ae",
      "#f8ecd2",
      "#ffffff",
      "#1c6a6e",
      "#2f9aa0",
      "#5fc4c6",
      "#9fe6e4"
    ]
  };
  var W18 = 200;
  var H18 = 100;
  function hash18(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise18(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash18(x0, yi), b = hash18(x1, yi), c = hash18(x0, yi + 1), d = hash18(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp18 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix18 = (a, b, k) => a + (b - a) * k;
  var hex18 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function havasuFalls(o = {}) {
    const mistSpeed = o.mist ?? meta18.options.mist;
    const P = meta18.palette.map(hex18);
    const out = new Array(W18 * H18);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp18(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp18(1 - level)) / peak;
        color[k] = nearest(clamp18(cr * s), clamp18(cg * s), clamp18(cb * s));
      }
    };
    const WALL_L = (y) => 64 - y * 0.5;
    const WALL_R = (y) => 136 + y * 0.4;
    const FALL_TOP = 30, POOL = 72;
    return (t, { color } = {}) => {
      for (let r = 0; r < H18; r++) {
        const y = r + 0.5;
        const mistDrift = t * mistSpeed * 0.4 % 14;
        for (let x = 0; x < W18; x++) {
          const k = r * W18 + x;
          let cr = 0.5, cg = 0.72, cb = 0.9;
          const inSlot = x > WALL_L(y) && x < WALL_R(y);
          if (!inSlot) {
            const layers = Math.abs((x + y * 0.4) * 0.08 % 1 - 0.5) * 2;
            const grain = noise18(x * 0.3, y * 0.3, 3);
            let g = 0.3 + 0.4 * layers * 0.5 + grain * 0.12;
            const sunEdge = x < WALL_L(y) ? (x - WALL_L(y)) / 40 : (x - WALL_R(y)) / 40;
            g = mix18(g * 0.4, g, clamp18(0.5 + 0.5 * sunEdge));
            cr = g * 1.25, cg = g * 0.5, cb = g * 0.32;
          } else {
            const waterX = 88;
            if (y > FALL_TOP + 8 && y < POOL) {
              const fallK = (y - FALL_TOP - 8) / (POOL - FALL_TOP - 8);
              const twist = noise18(x * 0.3, y * 0.14 - t * mistSpeed * 0.8, 2);
              const inFall = x > waterX - 12 + twist * 2 && x < waterX + 12 + twist * 2;
              if (inFall) {
                const streak = noise18(x * 0.8, (y + t * mistSpeed * 3) * 0.3, 2);
                let w = 0.85 + 0.15 * streak - fallK * 0.08;
                cr = w * 0.9, cg = w, cb = w * 0.96;
              }
            }
            if (y > POOL - 6 && y < POOL) {
              const apronX = x > waterX - 26 && x < waterX + 26;
              if (apronX) {
                const terrace = Math.abs((y * 1.4 + x * 0.2) % 3 - 1.5) < 1.2;
                const g = terrace ? 0.86 : 0.74;
                cr = g, cg = g, cb = g * 0.9;
              }
            }
            if (y >= POOL) {
              const dz = y - POOL;
              const swirl = noise18(x * 0.08, dz * 0.12 + t * mistSpeed * 0.3, 3);
              let tc = 0.35 + 0.4 * clamp18(swirl * 1.5 - 0.25);
              cr = tc * 0.35, cg = tc * 0.95, cb = tc * 0.9;
              const patch = Math.max(0, 1 - Math.abs(x - 96) / 26);
              cr += patch * 0.2, cg += patch * 0.25, cb += patch * 0.15;
            }
            const mistK = clamp18((POOL - 4 - y) / 30 + 0.7) * noise18(x * 0.05, y * 0.08 + mistDrift * 0.5, 4);
            if (y > POOL - 22 && y < POOL + 4) {
              const mc = clamp18((mistK - 0.45) * 1.8);
              if (mc > 0.05) {
                cr = mix18(cr, 0.92, mc * 0.65), cg = mix18(cg, 0.95, mc * 0.65), cb = mix18(cb, 0.92, mc * 0.65);
              }
            }
            const treeBand = y > 56 && y < 72;
            const treeX = x > WALL_L(y) && x < waterX - 30 || x > waterX + 30 && x < WALL_R(y);
            if (treeBand && treeX) {
              const leafy = noise18(x * 0.5, y * 0.5, 2);
              if (leafy > 0.3) {
                const g = 0.2 + leafy * 0.3;
                cr = g * 0.6, cg = g * 1.2, cb = g * 0.5;
              }
            }
          }
          halftone(k, r, x, clamp18(cr), clamp18(cg), clamp18(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H18; r++) lines.push(out.slice(r * W18, (r + 1) * W18).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/giants-causeway.ts
  var meta19 = {
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
      surge: 1
    },
    params: {
      surge: { label: "foam surge", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#241418",
      "#35201c",
      "#4c2f24",
      "#663f2c",
      "#82553a",
      "#a1714e",
      "#bf8f68",
      "#d8ae8a",
      "#ecc9a8",
      "#f8e4c8",
      "#fff6e0",
      "#ffffff"
    ]
  };
  var W19 = 200;
  var H19 = 100;
  function hash19(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise19(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash19(x0, yi), b = hash19(x1, yi), c = hash19(x0, yi + 1), d = hash19(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp19 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix19 = (a, b, k) => a + (b - a) * k;
  var hex19 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function giantsCauseway(o = {}) {
    const surge = o.surge ?? meta19.options.surge;
    const P = meta19.palette.map(hex19);
    const out = new Array(W19 * H19);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp19(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp19(1 - level)) / peak;
        color[k] = nearest(clamp19(cr * s), clamp19(cg * s), clamp19(cb * s));
      }
    };
    const HORIZON = 30;
    const SHORE = 74;
    return (t, { color } = {}) => {
      for (let r = 0; r < H19; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W19; x++) {
          const k = r * W19 + x;
          const v = clamp19(y / HORIZON);
          const warm = clamp19(1 - y / HORIZON);
          let cr = mix19(0.3 + 0.3 * v, 0.55, warm);
          let cg = mix19(0.12 + 0.2 * v, 0.34, warm);
          let cb = mix19(0.1 + 0.12 * v, 0.24, warm);
          const sd = Math.sqrt((x - 120) ** 2 + (y - HORIZON + 2) ** 2);
          if (sd < 4 && y < HORIZON) {
            const e = sd / 4;
            cr = mix19(1, 0.9, e), cg = mix19(0.85, 0.55, e), cb = mix19(0.4, 0.2, e);
          }
          if (y >= HORIZON && y < SHORE - 2) {
            const dz = y - HORIZON;
            const chop = noise19(x * 0.12, dz * 0.2, 3);
            let sc = 0.07 + 0.05 * chop;
            cr = sc * 0.9, cg = sc * 1.06, cb = sc * 0.95;
            const roadK = Math.exp(-Math.abs(x - 120) / (8 + dz * 0.5)) * clamp19(1 - dz / 46);
            const stripe = noise19(x * 0.3 + t * surge * 0.7, dz * 0.2, 2);
            if (roadK > 0.08 && stripe > 0.45) {
              const rk = roadK * (0.5 + 0.5 * clamp19(stripe));
              cr += rk * 0.65, cg += rk * 0.32, cb += rk * 0.08;
            }
          }
          if (y >= SHORE - 2 && y < H19 + 1) {
            const dz = y - SHORE + 2;
            const scale = 0.55 + dz * 0.02;
            const hx = x / (6 * scale), hy = y / (6 * scale);
            const row = Math.floor(hy);
            const col = Math.floor(hx + row % 2 * 0.5);
            const cellSeed = hash19(col, row);
            const fx = hx + row % 2 * 0.5 - Math.floor(hx + row % 2 * 0.5);
            const fy = hy - row;
            const distC = Math.sqrt((fx - 0.5) ** 2 + (fy - 0.5) ** 2) / 0.7;
            const closer = clamp19(1 - distC * 1.15);
            const wet = clamp19(1 - (dz - 6) / 10) * clamp19(1 - dz / 20);
            let g = 0.14 + 0.5 * closer * clamp19(0.4 + 0.6 * cellSeed) + 0.06 * noise19(x * 0.4, y * 0.4, 2);
            g += closer * 0.28 * clamp19(1 - Math.abs(x - 120) / 90);
            cr = g * 1.1, cg = g * 0.62, cb = g * 0.4;
            if (wet > 0.3) {
              cr = mix19(cr, 0.5, wet * 0.35), cg = mix19(cg, 0.5, wet * 0.35), cb = mix19(cb, 0.52, wet * 0.35);
            }
            const foamLine = 3 + noise19(x * 0.15, t * surge * 1.1, 2) * 3;
            if (dz < foamLine) {
              const foam = noise19(x * 0.3, (y + t * surge * 2.2) * 0.5, 2);
              const fk = clamp19((foamLine - dz) / 3) * (0.4 + 0.6 * foam);
              cr = mix19(cr, 0.85, fk), cg = mix19(cg, 0.9, fk), cb = mix19(cb, 0.86, fk);
            }
          }
          halftone(k, r, x, clamp19(cr), clamp19(cg), clamp19(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H19; r++) lines.push(out.slice(r * W19, (r + 1) * W19).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/fuji.ts
  var meta20 = {
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
      stir: 1
    },
    params: {
      stir: { label: "lake stir", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#1c2038",
      "#28294a",
      "#383a5e",
      "#4c4a70",
      "#666288",
      "#8c86a0",
      "#b2acc0",
      "#d5ccd6",
      "#e9dbe0",
      "#f4e6d8",
      "#fbeecf",
      "#fff4dc",
      "#ffffff"
    ]
  };
  var W20 = 200;
  var H20 = 100;
  function hash20(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise20(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash20(x0, yi), b = hash20(x1, yi), c = hash20(x0, yi + 1), d = hash20(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  var clamp20 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix20 = (a, b, k) => a + (b - a) * k;
  var hex20 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function fuji(o = {}) {
    const stir = o.stir ?? meta20.options.stir;
    const P = meta20.palette.map(hex20);
    const out = new Array(W20 * H20);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp20(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp20(1 - level)) / peak;
        color[k] = nearest(clamp20(cr * s), clamp20(cg * s), clamp20(cb * s));
      }
    };
    const CX = 100;
    const APEX = 20, FOOT = 62;
    const halfWidth = (y) => (y - APEX) / (FOOT - APEX) * 78;
    return (t, { color } = {}) => {
      for (let r = 0; r < H20; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W20; x++) {
          const k = r * W20 + x;
          const v = clamp20(y / FOOT);
          const warmUp = Math.max(0, 1 - Math.abs(x - 78) / 80) * clamp20(1 - y / (APEX + 16));
          let cr = mix20(0.1, 0.3 + 0.34 * warmUp, v);
          let cg = mix20(0.09, 0.26 + 0.3 * warmUp, v);
          let cb = mix20(0.22, 0.42 + 0.2 * warmUp, v);
          if (y < 14 && hash20(x * 7 + 3, r * 11) > 0.997) {
            cr = 0.8, cg = 0.85, cb = 1;
          }
          const hw = halfWidth(y);
          if (Math.abs(x - CX) < hw && y > APEX && y < FOOT) {
            const elev = 1 - (y - APEX) / (FOOT - APEX);
            const snowEdge = 0.62 + 0.25 * noise20(x * 0.25, 7, 2);
            const isSnow = elev > snowEdge && Math.abs(x - CX) < hw * 0.3;
            const rocky = noise20(x * 0.3, y * 0.3, 2);
            if (isSnow) {
              const face = x > CX - hw * 0.1 ? 1 : 0.65;
              const g = (0.62 + 0.2 * rocky) * face;
              cr = g, cg = g * 0.96, cb = g * 0.86;
            } else {
              let g = 0.2 + 0.14 * rocky;
              g = mix20(g, 0.4, elev * 0.4);
              cr = g * 0.9, cg = g * 0.85, cb = g * 1.2;
            }
            if (y < APEX + 4 && Math.abs(x - CX) < 5) {
              cr *= 0.8, cg *= 0.8, cb *= 0.85;
            }
          }
          if (y > FOOT - 2.5 && y < FOOT + 3) {
            const tree = noise20(x * 0.3, 11, 2);
            if (tree > 0.4) {
              const g = 0.09 + tree * 0.07;
              cr = g * 0.6, cg = g * 1.05, cb = g * 0.8;
            }
          }
          if (y >= FOOT + 3) {
            const dz = y - FOOT - 3;
            const wobble = noise20(x * 0.09, dz * 0.14 + t * stir * 0.5, 3);
            let mcr = 0.2 + 0.1 * wobble, mcg = 0.18 + 0.1 * wobble, mcb = 0.32 + 0.16 * wobble;
            const mk = clamp20(1 - dz / 34);
            cr = mix20(cr, mcr, mk), cg = mix20(cg, mcg, mk), cb = mix20(cb, mcb, mk);
            const srcY = FOOT + 3 - dz;
            const hwMirror = halfWidth(srcY);
            if (Math.abs(x - CX) < hwMirror && srcY > APEX && srcY < FOOT) {
              const cut = hash20(Math.floor(x / 3), Math.floor(dz * 2.4 + t * stir * 1.4)) > 0.3;
              if (cut) {
                const elevM = 1 - (srcY - APEX) / (FOOT - APEX);
                const snowEdgeM = 0.62 + 0.25 * noise20(x * 0.25, 7, 2);
                const isSnowM = elevM > snowEdgeM && Math.abs(x - CX) < hwMirror * 0.3;
                const g = isSnowM ? 0.5 : 0.16;
                cr = mix20(cr, g, mk * 0.75), cg = mix20(cg, g * 0.95, mk * 0.75), cb = mix20(cb, isSnowM ? g * 0.85 : g * 1.3, mk * 0.75);
              }
            }
            if (hash20(Math.floor(x / 9), 4) > 0.94 && y > FOOT + 5 && y < FOOT + 9) {
              cr = 0.95, cg = 0.8, cb = 0.5;
            }
          }
          halftone(k, r, x, clamp20(cr), clamp20(cg), clamp20(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H20; r++) lines.push(out.slice(r * W20, (r + 1) * W20).join(""));
      return lines.join("\n");
    };
  }

  // src/pieces/iguazu.ts
  var meta21 = {
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
      mist: 1
    },
    params: {
      mist: { label: "mist roll", min: 0, max: 2, step: 0.05 }
    },
    palette: [
      "#0d1810",
      "#1e3626",
      "#2a4a34",
      "#3a6242",
      "#4f7c54",
      "#6c985e",
      "#95b76f",
      "#bad78e",
      "#dcedb4",
      "#ecf2cf",
      "#f6f9e4",
      "#fbfdf0",
      "#ffffff"
    ]
  };
  var W21 = 200;
  var H21 = 100;
  function hash21(x, y) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ h >>> 13, 1274126177);
    return ((h ^ h >>> 16) >>> 0) / 4294967296;
  }
  function noise21(x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    let x0 = xi, x1 = xi + 1;
    if (period) {
      x0 = (xi % period + period) % period;
      x1 = (x0 + 1) % period;
    }
    const a = hash21(x0, yi), b = hash21(x1, yi), c = hash21(x0, yi + 1), d = hash21(x1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm8(x, y, octaves, period) {
    let s = 0, n = 0, amp = 0.5, f = 1;
    for (let i = 0; i < octaves; i++) {
      s += amp * noise21(x * f, y * f, period * f);
      n += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / n;
  }
  var clamp21 = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
  var mix21 = (a, b, k) => a + (b - a) * k;
  var hex21 = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  function iguazu(o = {}) {
    const mistSpeed = o.mist ?? meta21.options.mist;
    const P = meta21.palette.map(hex21);
    const out = new Array(W21 * H21);
    const lut = new Uint16Array(32768).fill(65535);
    const nearest = (r, g, b) => {
      const k = Math.min(31, r * 31.99 | 0) << 10 | Math.min(31, g * 31.99 | 0) << 5 | Math.min(31, b * 31.99 | 0);
      if (lut[k] !== 65535) return lut[k];
      let best = 0, bd = 1e9;
      for (let i = 0; i < P.length; i++) {
        const dr = P[i][0] - r, dg = P[i][1] - g, db = P[i][2] - b;
        const d = 0.3 * dr * dr + 0.5 * dg * dg + 0.2 * db * db;
        if (d < bd) bd = d, best = i;
      }
      return lut[k] = best;
    };
    const DOTS = " \xB7\u2022\u25CF";
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.47);
    const halftone = (k, r, x, cr, cg, cb, color) => {
      const peak = Math.max(cr, cg, cb, 1e-4);
      const level = clamp21(Math.pow(peak, 0.9) * 1.05);
      const step = Math.max(0, Math.min(3, Math.round(level * 3 + BAYER[(r & 3) * 4 + (x & 3)])));
      out[k] = DOTS[step];
      if (color) {
        const want = step ? Math.min(1, (level + 0.05) / [0, 0.3, 0.6, 1][step]) : 0;
        const s = (0.32 + 0.68 * want) * (0.4 + 0.6 * clamp21(1 - level)) / peak;
        color[k] = nearest(clamp21(cr * s), clamp21(cg * s), clamp21(cb * s));
      }
    };
    const LIP = (x) => 38 - 8 * Math.exp(-(((x - 100) / 42) ** 2));
    const GORGE = 86;
    return (t, { color } = {}) => {
      const mistDrift = t * mistSpeed * 0.5 % 12;
      for (let r = 0; r < H21; r++) {
        const y = r + 0.5;
        for (let x = 0; x < W21; x++) {
          const k = r * W21 + x;
          const v = clamp21(y / 34);
          let cr = mix21(0.66, 0.72, v), cg = mix21(0.78, 0.86, v), cb = mix21(0.86, 0.94, v);
          const lipY = LIP(x);
          if (y < lipY) {
            if (x > 150) {
              const leafy = noise21(x * 0.4, y * 0.4, 2);
              const g = 0.16 + 0.26 * leafy;
              cr = g * 0.7, cg = g * 1.15, cb = g * 0.6;
            } else {
              const chop = fbm8(x * 0.06, y * 0.1 + t * mistSpeed * 0.2, 2, 0);
              const g = 0.55 + 0.25 * chop;
              cr = g * 0.9, cg = g, cb = g;
            }
          }
          if (y >= lipY && y < GORGE) {
            const dz = y - lipY;
            const col = noise21(x * 0.5, (y + t * mistSpeed * 3.2) * 0.35, 2);
            const col2 = fbm8(x * 0.2, (y + t * mistSpeed * 4.5) * 0.16, 2, 2);
            let w = 0.78 + 0.22 * col - 0.16 * col2;
            const spill = clamp21(1.1 - Math.abs(x - 62) / 22) * clamp21(dz / 12);
            cr = w * 0.94, cg = w * 1.02, cb = w * 0.9;
            const shadeCol = (Math.floor(x / 7) * 7919 + Math.floor(x / 13)) % 3 === 0;
            if (shadeCol) cr *= 0.82, cg *= 0.84, cb *= 0.86;
            if (spill > 0.5) {
              cr = mix21(cr, 0.85, 0.35), cg = mix21(cg, 0.95, 0.35), cb = mix21(cb, 0.85, 0.35);
            }
          }
          if (y >= GORGE) {
            const dz = y - GORGE;
            const foam = noise21(x * 0.09, dz * 0.12 + t * mistSpeed, 2);
            let g = 0.26 + 0.32 * foam;
            cr = g * 0.9, cg = g, cb = g * 0.85;
            if (hash21(Math.floor(x / 5), Math.floor(dz * 1.6 + t * mistSpeed)) > 0.8) {
              cr = mix21(cr, 0.9, 0.6), cg = mix21(cg, 0.94, 0.6), cb = mix21(cb, 0.88, 0.6);
            }
          }
          const mistK = clamp21((GORGE - 6 - y) / 34 + 0.75) * clamp21(0.4 + 0.6 * noise21(x * 0.04, y * 0.07 + mistDrift, 4));
          if (y > 62) {
            const mc = clamp21((mistK - 0.45) * 1.5);
            if (mc > 0.05) {
              cr = mix21(cr, 0.95, mc * 0.7), cg = mix21(cg, 0.97, mc * 0.7), cb = mix21(cb, 0.94, mc * 0.7);
            }
          }
          halftone(k, r, x, clamp21(cr), clamp21(cg), clamp21(cb), color);
        }
      }
      const lines = [];
      for (let r = 0; r < H21; r++) lines.push(out.slice(r * W21, (r + 1) * W21).join(""));
      return lines.join("\n");
    };
  }

  // scripts/scene-harness.ts
  var SCENES = [
    ["golden-gate", goldenGate, meta],
    ["eiffel-tower", eiffelTower, meta2],
    ["statue-liberty", statueLiberty, meta3],
    ["sydney-opera", sydneyOpera, meta4],
    ["tokyo-night", tokyoNight, meta5],
    ["giza", giza, meta6],
    ["petra", petra, meta7],
    ["colosseum", colosseum, meta8],
    ["great-wall", greatWall, meta9],
    ["chichen-itza", chichenItza, meta10],
    ["machu-picchu", machuPicchu, meta11],
    ["christ-redeemer", christRedeemer, meta12],
    ["angkor-wat", angkorWat, meta13],
    ["santorini", santorini, meta14],
    ["ha-long-bay", haLongBay, meta15],
    ["stonehenge", stonehenge, meta16],
    ["neuschwanstein", neuschwanstein, meta17],
    ["havasu-falls", havasuFalls, meta18],
    ["giants-causeway", giantsCauseway, meta19],
    ["fuji", fuji, meta20],
    ["iguazu", iguazu, meta21]
  ];
  return __toCommonJS(scene_harness_exports);
})();
