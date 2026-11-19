/**
 * Point clouds for the Process section: a brain, scattered fragments, a lightbulb and a globe.
 * Deterministic, so every visit builds the same shapes.
 */

// Scroll stops inside the pinned section: [progress, shape]. Shapes: 0 brain, 1 fragments, 2 bulb, 3 globe
export const MORPH_STOPS: Array<[number, number]> = [
  [0.08, 0],
  [0.22, 1],
  [0.36, 1],
  [0.5, 2],
  [0.62, 2],
  [0.76, 3],
];

// ---------- deterministic random + noise for building the shapes ----------

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNoise(rand: () => number) {
  const perm = new Uint8Array(512);
  const vals = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    perm[i] = i;
    vals[i] = rand();
  }
  for (let i = 255; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    const tmp = perm[i];
    perm[i] = perm[j];
    perm[j] = tmp;
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  const v = (x: number, y: number, z: number) => vals[perm[(x & 255) + perm[(y & 255) + perm[z & 255]]]];
  const s = (t: number) => t * t * (3 - 2 * t);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = s(x - xi);
    const w = s(y - yi);
    const q = s(z - zi);
    return l(
      l(l(v(xi, yi, zi), v(xi + 1, yi, zi), u), l(v(xi, yi + 1, zi), v(xi + 1, yi + 1, zi), u), w),
      l(l(v(xi, yi, zi + 1), v(xi + 1, yi, zi + 1), u), l(v(xi, yi + 1, zi + 1), v(xi + 1, yi + 1, zi + 1), u), w),
      q,
    );
  };
}

export type Vec3 = [number, number, number];

export function randDir(rand: () => number): Vec3 {
  const u = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(a), u, s * Math.sin(a)];
}

/** Side-on brain: front is +x, the two hemispheres sit either side of z = 0. */
export function brainPoint(rand: () => number, noise: (x: number, y: number, z: number) => number): Vec3 {
  const r = rand();
  if (r < 0.82) {
    // Cerebrum: rejection-sample so the folds (gyri) come out denser than the grooves
    for (let tries = 0; tries < 30; tries++) {
      const side = rand() < 0.5 ? 1 : -1;
      const d = randDir(rand);
      const x = d[0] * 1.5;
      let y = d[1] * 1.0;
      const outward = d[2] * side; // > 0 points away from the midline
      const lz = outward > 0 ? outward * 0.55 : outward * 0.38; // flat inner face, narrow fissure
      if (y < -0.35) y = -0.35 + (y + 0.35) * 0.5; // flatter underside
      if (y < 0) y -= 0.2 * Math.exp(-((x - 0.25) ** 2) / 0.3); // temporal lobe hangs lower
      const z = side * (0.42 + lz);
      const n = noise(x * 3.4 + 10, y * 3.4, z * 3.4 + side * 7);
      const ridge = 1 - Math.abs(n * 2 - 1);
      if (rand() > 0.25 + 0.75 * ridge * ridge) continue;
      const disp = 0.09 * ridge * ridge * ridge - 0.02;
      const interior = rand() < 0.06 ? 0.55 + rand() * 0.4 : 1;
      return [
        (x + d[0] * disp) * interior,
        (y + d[1] * disp) * interior + 0.12,
        side * (0.42 + lz + outward * disp) * interior,
      ];
    }
  }
  if (r < 0.94) {
    // Cerebellum, with horizontal folds
    for (let tries = 0; tries < 30; tries++) {
      const d = randDir(rand);
      const y = d[1] * 0.3;
      if (rand() > 0.35 + 0.65 * Math.abs(Math.sin(y * 42))) continue;
      return [-1.05 + d[0] * 0.48, -0.62 + y, d[2] * 0.72];
    }
  }
  // Brain stem
  const t = rand();
  const a = rand() * Math.PI * 2;
  const rad = 0.16 * (1 - t * 0.25);
  return [-0.42 - t * 0.2 + Math.cos(a) * rad * 0.6, -0.5 - t * 0.85, Math.sin(a) * rad];
}

/** Lightbulb standing upright: glass globe, neck, screw base and a glowing filament. */
export function makeBulbSampler(rand: () => number) {
  const yc = 0.55;
  const R = 0.95;
  const yNeck = yc - R * 0.62;
  const rNeck = Math.sqrt(R * R - (yNeck - yc) ** 2);
  const profile = (y: number) => {
    if (y >= yNeck) return Math.sqrt(Math.max(R * R - (y - yc) ** 2, 0));
    if (y >= -0.62) {
      const t = (y + 0.62) / (yNeck + 0.62);
      return 0.4 + (rNeck - 0.4) * (1 - Math.cos(t * Math.PI)) * 0.5;
    }
    if (y >= -1.2) return 0.4 + 0.035 * Math.sin(((y + 0.62) / 0.12) * Math.PI * 2);
    const t = (y + 1.2) / -0.18;
    return 0.32 - 0.24 * t;
  };
  const steps = 500;
  const top = yc + R;
  const bottom = -1.38;
  const ys: number[] = [];
  const cdf: number[] = [];
  let acc = 0;
  let prevR = profile(top);
  for (let i = 0; i <= steps; i++) {
    const y = top - ((top - bottom) * i) / steps;
    const r = profile(y);
    const ds = Math.hypot((top - bottom) / steps, r - prevR);
    acc += r * ds + 0.002;
    ys.push(y);
    cdf.push(acc);
    prevR = r;
  }
  return (): Vec3 => {
    if (rand() < 0.07) {
      // Filament: two support wires and a coil between them
      const f = rand();
      if (f < 0.45) {
        const side = rand() < 0.5 ? -1 : 1;
        const t = rand();
        return [side * 0.2 * (0.6 + t * 0.4), -0.45 + t * 0.95, 0];
      }
      const t = rand();
      const ang = t * Math.PI * 2 * 9;
      return [-0.2 + t * 0.4, 0.52 + Math.sin(ang) * 0.05, Math.cos(ang) * 0.05];
    }
    const target = rand() * acc;
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const y = ys[lo];
    const r = profile(y) * (1 + (rand() - 0.5) * 0.02);
    const a = rand() * Math.PI * 2;
    return [Math.cos(a) * r, y + 0.05, Math.sin(a) * r];
  };
}

/** Globe: latitude/longitude lines plus noisy continents. */
export function globePoint(rand: () => number, noise: (x: number, y: number, z: number) => number): Vec3 {
  const R = 1.3;
  const r = rand();
  if (r < 0.42) {
    const a = rand() * Math.PI * 2;
    if (rand() < 0.5) {
      const lat = ((((rand() * 7) | 0) - 3) * 22 * Math.PI) / 180;
      return [Math.cos(lat) * Math.cos(a) * R, Math.sin(lat) * R, Math.cos(lat) * Math.sin(a) * R];
    }
    const lon = (((rand() * 12) | 0) * Math.PI) / 6;
    return [Math.cos(a) * Math.cos(lon) * R, Math.sin(a) * R, Math.cos(a) * Math.sin(lon) * R];
  }
  for (let tries = 0; tries < 40; tries++) {
    const d = randDir(rand);
    const n = noise(d[0] * 1.8 + 3, d[1] * 1.8, d[2] * 1.8 + 5);
    if (n < 0.52 && rand() > 0.12) continue;
    return [d[0] * R, d[1] * R, d[2] * R];
  }
  const d = randDir(rand);
  return [d[0] * R, d[1] * R, d[2] * R];
}

export function fragmentPoint(rand: () => number): Vec3 {
  // kept behind z = 1 so no fragment flies right into the camera
  return [(rand() * 2 - 1) * 6.5, (rand() * 2 - 1) * 3.8, -6 + rand() * 7];
}
