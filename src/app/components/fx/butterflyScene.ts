
/**
 * A neon butterfly that flaps in 3D and glitches between two looks:
 * solid magenta, and a blue "computer vision" pass with tracked points,
 * x/y labels and bounding boxes. Canvas 2D, no WebGL.
 */

type P = { x: number; y: number; body: boolean; s: number; glow: boolean };

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Right-wing shapes in butterfly units (body along y, wing towards +x)
const WINGS = [
  { cx: 0.62, cy: 0.36, rx: 0.66, ry: 0.4, rot: (28 * Math.PI) / 180 }, // forewing
  { cx: 0.45, cy: -0.38, rx: 0.45, ry: 0.35, rot: (-32 * Math.PI) / 180 }, // hindwing
];

function insideWing(x: number, y: number) {
  return WINGS.some((w) => {
    const dx = x - w.cx;
    const dy = y - w.cy;
    const c = Math.cos(-w.rot);
    const s = Math.sin(-w.rot);
    const u = (dx * c - dy * s) / w.rx;
    const v = (dx * s + dy * c) / w.ry;
    return u * u + v * v <= 1;
  });
}

function wingEdge(w: (typeof WINGS)[number], a: number): [number, number] {
  const u = Math.cos(a) * w.rx;
  const v = Math.sin(a) * w.ry;
  const c = Math.cos(w.rot);
  const s = Math.sin(w.rot);
  return [w.cx + u * c - v * s, w.cy + u * s + v * c];
}

function buildPoints(count: number) {
  const rand = mulberry32(7);
  const pts: P[] = [];
  const add = (x: number, y: number, body = false) =>
    pts.push({ x, y, body, s: 0.6 + rand() * 1.2, glow: rand() < 0.22 });

  const n = count;
  // Wing fill
  while (pts.length < n * 0.4) {
    const x = rand() * 1.35;
    const y = rand() * 1.8 - 0.88;
    if (x > 0.03 && insideWing(x, y)) add(x, y);
  }
  // Wing outlines (only where they aren't covered by the other wing)
  while (pts.length < n * 0.72) {
    const w = WINGS[rand() < 0.62 ? 0 : 1];
    const [x, y] = wingEdge(w, rand() * Math.PI * 2);
    const other = WINGS.find((o) => o !== w)!;
    const dx = x - other.cx;
    const dy = y - other.cy;
    const c = Math.cos(-other.rot);
    const s = Math.sin(-other.rot);
    const u = (dx * c - dy * s) / other.rx;
    const v = (dx * s + dy * c) / other.ry;
    if (x > 0.03 && u * u + v * v > 0.98) add(x, y);
  }
  // Veins radiating from the wing root
  const veins = [0.1, 0.35, 0.6, 0.85, 1.1, 1.35, -0.25, -0.55, -0.85, -1.1];
  while (pts.length < n * 0.9) {
    const ang = veins[(rand() * veins.length) | 0];
    const t = rand();
    const x = 0.04 + Math.cos(ang) * t * 1.4;
    const y = 0.02 + Math.sin(ang) * t * 1.4;
    if (insideWing(x, y)) add(x, y);
  }
  // Body, head and antennae
  while (pts.length < n) {
    const r = rand();
    if (r < 0.6) {
      const a = rand() * Math.PI * 2;
      const k = Math.sqrt(rand());
      add(Math.cos(a) * 0.045 * k, -0.05 + Math.sin(a) * 0.45 * k, true);
    } else if (r < 0.75) {
      const a = rand() * Math.PI * 2;
      add(Math.cos(a) * 0.06 * Math.sqrt(rand()), 0.45 + Math.sin(a) * 0.06, true);
    } else {
      const t = rand();
      const side = rand() < 0.5 ? 1 : -1;
      add(side * (0.02 + t * 0.25 + Math.sin(t * 3) * 0.02), 0.5 + t * 0.45, true);
    }
  }
  return pts;
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function glowSprite(makeCanvas: (size: number) => AnyCanvas, color: string) {
  const c = makeCanvas(64);
  const g = c.getContext('2d') as Ctx2D;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.25, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

/**
 * The butterfly scene, independent of where it runs: a web worker drawing on an OffscreenCanvas
 * (so the page's own work can never make it stutter) or the main thread as a fallback.
 */
export function createButterflyScene(
  canvas: AnyCanvas,
  ctx: Ctx2D,
  { phone, makeCanvas }: { phone: boolean; makeCanvas: (size: number) => AnyCanvas }
) {
  const pts = buildPoints(phone ? 380 : 700);
  const pinkGlow = glowSprite(makeCanvas, 'rgba(255,61,189,0.6)');
  const blueGlow = glowSprite(makeCanvas, 'rgba(56,189,248,0.6)');
  const silverGlow = glowSprite(makeCanvas, 'rgba(196,181,253,0.6)');
  const rand = Math.random;

  let W = 0;
  let H = 0;
  let dpr = 1;
  const resize = (w: number, h: number, ratio: number) => {
    dpr = ratio;
    W = w;
    H = h;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
  };

  // Look switching: 'neon' (magenta) and 'track' (blue + tracking overlay)
  // 'home': the homepage's own light (silver-white with lavender), once the site has loaded
  let mode: 'neon' | 'track' | 'home' = 'track';
  let nextSwitch = 0.9;
  let glitchUntil = 0;
  // Tracked features: [point index, wing side], spread out over both wings
  let tracked: Array<[number, number]> = [];
  const pickTracked = () => {
    const out: Array<[number, number]> = [];
    const want = phone ? 8 : 13;
    for (let tries = 0; tries < 600 && out.length < want; tries++) {
      const i = (rand() * pts.length) | 0;
      const p = pts[i];
      if (p.body) continue;
      const m = rand() < 0.5 ? 1 : -1;
      if (out.every(([j, mj]) => Math.hypot(pts[j].x * mj - p.x * m, pts[j].y - p.y) > 0.26)) out.push([i, m]);
    }
    // walk them around the body so the connecting line traces an outline
    tracked = out.sort((a, b) => Math.atan2(pts[a[0]].y, pts[a[0]].x * a[1]) - Math.atan2(pts[b[0]].y, pts[b[0]].x * b[1]));
  };
  pickTracked();

  const project = (x: number, y: number, z: number, t: number, cx: number, cy: number, size: number) => {
    const yaw = Math.sin(t * 0.6) * 0.45 + 0.25;
    const pitch = -0.55 + Math.sin(t * 0.8) * 0.12;
    const roll = Math.sin(t * 0.5) * 0.15 - 0.2;
    // roll (z), then yaw (y), then pitch (x)
    let px = x * Math.cos(roll) - y * Math.sin(roll);
    let py = x * Math.sin(roll) + y * Math.cos(roll);
    let pz = z;
    const x2 = px * Math.cos(yaw) + pz * Math.sin(yaw);
    pz = -px * Math.sin(yaw) + pz * Math.cos(yaw);
    px = x2;
    const y2 = py * Math.cos(pitch) - pz * Math.sin(pitch);
    pz = py * Math.sin(pitch) + pz * Math.cos(pitch);
    py = y2;
    const f = 5 / (5 - pz);
    return [cx + px * size * f, cy - py * size * f] as const;
  };

  // wing beat (faster once it takes off) and how far into the take-off it is
  let flapPhase = 0;
  let flightMix = 0;

  const drawFrame = (t: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (W < 10 || H < 10) return;
    const size = Math.min(W, H) * (phone ? 0.33 : 0.36);
    const cx = W * 0.5 + W * 0.1 * Math.sin(t * 0.37) * (1 - flightMix);
    const cy = H * 0.52 + H * 0.07 * Math.sin(t * 0.53) * (1 - flightMix);
    const flap = 0.15 + 1.05 * (0.5 + 0.5 * Math.sin(flapPhase));
    const home = mode === 'home';
    // the homepage look draws like the neon one (no tracking overlay), in silver and lavender
    const neon = mode === 'neon' || home;

    const screen = (p: P, mirror: number) => {
      const x = p.body ? p.x : p.x * Math.cos(flap) * mirror;
      const z = p.body ? 0 : p.x * Math.sin(flap);
      return project(x, p.y, z, t, cx, cy, size);
    };

    // Wing membranes
    ctx.globalCompositeOperation = 'lighter';
    for (const mirror of [1, -1]) {
      for (const w of WINGS) {
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const [ex, ey] = wingEdge(w, (i / 40) * Math.PI * 2);
          const [sx, sy] = screen({ x: Math.max(ex, 0.02), y: ey, body: false, s: 1, glow: false }, mirror);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        const [rx, ry] = project(0, 0, 0, t, cx, cy, size);
        const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, size * 1.4);
        if (home) {
          grad.addColorStop(0, 'rgba(248,247,255,0.55)');
          grad.addColorStop(0.35, 'rgba(196,181,253,0.38)');
          grad.addColorStop(1, 'rgba(110,100,170,0.22)');
        } else if (neon) {
          grad.addColorStop(0, 'rgba(255,230,250,0.55)');
          grad.addColorStop(0.35, 'rgba(255,61,189,0.42)');
          grad.addColorStop(1, 'rgba(150,20,140,0.25)');
        } else {
          grad.addColorStop(0, 'rgba(200,250,255,0.45)');
          grad.addColorStop(0.4, 'rgba(37,99,235,0.35)');
          grad.addColorStop(1, 'rgba(30,64,175,0.2)');
        }
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    // Particles
    const coordsR: Array<[number, number]> = new Array(pts.length);
    const coordsL: Array<[number, number]> = new Array(pts.length);
    const at = ([i, m]: [number, number]) => (m > 0 ? coordsR[i] : coordsL[i]);
    for (const mirror of [1, -1]) {
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.body && mirror < 0) continue;
        const [sx, sy] = screen(p, mirror);
        if (mirror > 0) coordsR[i] = [sx, sy];
        else coordsL[i] = [sx, sy];
        const tw = 0.6 + 0.4 * Math.sin(t * 3 + i);
        if (p.glow) {
          const g = 8 + p.s * 8;
          ctx.globalAlpha = 0.35 * tw;
          ctx.drawImage(home ? silverGlow : neon ? pinkGlow : blueGlow, sx - g / 2, sy - g / 2, g, g);
        }
        ctx.globalAlpha = 0.9 * tw;
        ctx.fillStyle = home
          ? i % 3 === 0 ? '#C4B5FD' : '#F4F2FF'
          : neon ? (i % 5 === 0 ? '#ffffff' : '#ff7ad9') : i % 4 === 0 ? '#ffffff' : '#67e8f9';
        ctx.fillRect(sx - p.s * 0.6, sy - p.s * 0.6, p.s * 1.2, p.s * 1.2);
      }
    }
    ctx.globalAlpha = 1;

    if (neon) {
      // Light streaks trailing off the wings
      for (let i = 0; i < 6; i++) {
        const [sx, sy] = at(tracked[i % tracked.length]);
        const len = 20 + ((i * 37 + Math.floor(t * 8)) % 60);
        ctx.fillStyle = home ? `rgba(226,220,255,${0.22 + (i % 3) * 0.12})` : `rgba(255,90,210,${0.25 + (i % 3) * 0.12})`;
        ctx.fillRect(sx, sy + ((i * 13) % 9) - 4, len, 1.5);
      }
    } else {
      // Tracking pass: points, connections, labels, boxes
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      tracked.forEach((tp, k) => {
        const [sx, sy] = at(tp);
        if (k === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();

      ctx.font = `${phone ? 8 : 9}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = 'middle';
      tracked.forEach((tp) => {
        const [sx, sy] = at(tp);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(`x: ${Math.round(sx * 1.6)} y: ${Math.round(sy * 1.6)}`, sx + 6, sy);
      });

      const box = (ids: Array<[number, number]>, color: string) => {
        if (!ids.length) return;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const tp of ids) {
          const [sx, sy] = at(tp);
          x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12);
      };
      box(tracked.slice(0, 3), 'rgba(239,68,68,0.9)');
      box(tracked.slice(5, 8), 'rgba(255,255,255,0.6)');

      // Dashed ellipse around the body
      const [bx, by] = project(0, 0, 0, t, cx, cy, size);
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(bx, by, size * 0.55, size * 0.3, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  const glitch = () => {
    // Slice the frame into bands and shove some sideways, plus a ghosted copy
    const w = canvas.width;
    const h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 7; i++) {
      const y = (rand() * h) | 0;
      const bh = (4 + rand() * h * 0.08) | 0;
      const dx = ((rand() - 0.5) * w * 0.12) | 0;
      ctx.drawImage(canvas, 0, y, w, bh, dx, y, w, bh);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.drawImage(canvas, 4 * dpr, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  let last = 0;
  let time = 0;
  let flying = false;
  // one animation step; now is in milliseconds
  const step = (now: number) => {
    const dt = Math.min((now - (last || now)) / 1000, 0.05);
    last = now;
    time += dt;
    flightMix += ((flying ? 1 : 0) - flightMix) * Math.min(1, dt * 4);
    flapPhase += dt * (6.5 + 5 * flightMix);
    if (mode !== 'home' && time > nextSwitch) {
      mode = mode === 'neon' ? 'track' : 'neon';
      // mostly calm holds, sometimes a quick flicker
      nextSwitch = time + (rand() < 0.3 ? 0.08 + rand() * 0.12 : 0.6 + rand() * 1.3);
      glitchUntil = time + 0.12 + rand() * 0.1;
      if (mode === 'track') pickTracked();
    }
    drawFrame(time);
    if (time < glitchUntil) glitch();
  };
  return {
    resize,
    step,
    /** a still frame (reduced motion) */
    still: () => drawFrame(1.3),
    /** restart timing after a pause, so the next step doesn't jump */
    resetClock: () => {
      last = 0;
    },
    /** switch to the homepage's colours for good (with one last glitch as it changes) */
    goHome: () => {
      if (mode === 'home') return;
      mode = 'home';
      glitchUntil = time + 0.16;
    },
    setFlying: (on: boolean) => {
      flying = on;
    },
  };
}
