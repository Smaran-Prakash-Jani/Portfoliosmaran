/**
 * One quality tier for the whole site, picked once per visit from what the device reports.
 * Every effect still runs on every tier; lower tiers draw fewer particles at a lower resolution.
 *
 *   high   – dedicated or strong GPUs (most desktops, Apple silicon Macs)
 *   medium – phones, tablets, integrated laptop GPUs, 4-core / 4 GB machines
 *   low    – software rendering (no GPU acceleration), 2-core / 2 GB devices, data saver
 *
 * Force a tier for testing with ?quality=high|medium|low in the URL.
 */
export type QualityTier = 'high' | 'medium' | 'low';

type Settings = {
  /** cap on the device-pixel ratio used by WebGL canvases */
  dpr: number;
  /** multiplier for particle / instance counts */
  count: number;
  /** segments per light trail in the hero tunnel */
  trailSegments: number;
  /** most pixels a full-window canvas may draw (keeps big monitors on weak GPUs in check) */
  pixels: number;
  /** frame-rate cap for the heavy 3D scenes: steady beats fast-then-stuttering */
  fps: number;
};

const SETTINGS: Record<QualityTier, Settings> = {
  high: { dpr: 1.75, count: 1, trailSegments: 4, pixels: 6_000_000, fps: Infinity },
  medium: { dpr: 1.25, count: 0.5, trailSegments: 3, pixels: 2_000_000, fps: 60 },
  low: { dpr: 0.75, count: 0.22, trailSegments: 2, pixels: 700_000, fps: 30 },
};

let cached: QualityTier | null = null;

function gpuName() {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return null;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return null;
  }
}

export function qualityTier(): QualityTier {
  if (cached) return cached;
  const forced = new URLSearchParams(window.location.search).get('quality');
  if (forced === 'high' || forced === 'medium' || forced === 'low') return (cached = forced);

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency || 8;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const gpu = gpuName();

  const software = gpu === null || /swiftshader|llvmpipe|softpipe|software|basic render/i.test(gpu);
  // Safari reports every Apple GPU as "Apple GPU": strong on Macs, phone-class on iPhones / iPads
  const appleMac = /apple/i.test(gpu ?? '') && !touch;
  const integrated = !appleMac && /intel|mali|adreno|powervr|apple|videocore|vivante|tegra|uhd|iris/i.test(gpu ?? '');

  let tier: QualityTier = 'high';
  if (software || memory <= 2 || cores <= 2 || nav.connection?.saveData) tier = 'low';
  else if (touch || integrated || memory <= 4 || cores <= 4) tier = 'medium';
  cached = tier;
  return tier;
}

export function quality(): Settings & { tier: QualityTier } {
  const tier = qualityTier();
  return { tier, ...SETTINGS[tier] };
}

/**
 * Device-pixel ratio for a canvas: the device's own, capped by the tier, by the tier's pixel
 * budget for a window-sized canvas, and by an optional cap of its own.
 */
export function canvasDpr(cap = Infinity) {
  const s = SETTINGS[qualityTier()];
  const area = Math.max(1, window.innerWidth * window.innerHeight);
  const budget = Math.sqrt(s.pixels / area);
  return Math.max(0.5, Math.min(window.devicePixelRatio || 1, s.dpr, budget, cap));
}

/**
 * Frame limiter for the heavy scenes: returns true when a frame should be drawn now.
 * Uncapped on the high tier (a 120 / 165 Hz screen gets every frame).
 */
export function createFrameLimiter() {
  const fps = SETTINGS[qualityTier()].fps;
  if (!Number.isFinite(fps)) return () => true;
  const interval = 1000 / fps - 2; // a little slack so a 60 Hz screen still draws every frame at 60
  let lastDraw = -Infinity;
  return (now: number) => {
    if (now - lastDraw < interval) return false;
    lastDraw = now;
    return true;
  };
}
