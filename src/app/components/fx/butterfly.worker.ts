/// <reference lib="webworker" />
import { createButterflyScene } from './butterflyScene';

/** Draws the loading-screen butterfly off the main thread, on a canvas handed over by the page. */
type Msg =
  | { type: 'init'; canvas: OffscreenCanvas; width: number; height: number; dpr: number; phone: boolean; reduced: boolean }
  | { type: 'resize'; width: number; height: number; dpr: number }
  | { type: 'flying'; on: boolean }
  | { type: 'home' }
  | { type: 'run'; on: boolean };

let scene: ReturnType<typeof createButterflyScene> | null = null;
let reduced = false;
let running = false;
let handle = 0;
const raf: (cb: (t: number) => void) => number =
  typeof self.requestAnimationFrame === 'function'
    ? (cb) => self.requestAnimationFrame(cb)
    : (cb) => self.setTimeout(() => cb(performance.now()), 16) as unknown as number;
const caf = (id: number) => (typeof self.cancelAnimationFrame === 'function' ? self.cancelAnimationFrame(id) : self.clearTimeout(id));

const loop = (t: number) => {
  if (!running || !scene) return;
  scene.step(t);
  handle = raf(loop);
};
const run = (on: boolean) => {
  if (!scene || reduced) return;
  if (on && !running) {
    running = true;
    scene.resetClock();
    handle = raf(loop);
  } else if (!on && running) {
    running = false;
    caf(handle);
  }
};

self.onmessage = (e: MessageEvent<Msg>) => {
  const m = e.data;
  if (m.type === 'init') {
    const ctx = m.canvas.getContext('2d');
    if (!ctx) return;
    reduced = m.reduced;
    scene = createButterflyScene(m.canvas, ctx, { phone: m.phone, makeCanvas: (size) => new OffscreenCanvas(size, size) });
    scene.resize(m.width, m.height, m.dpr);
    if (reduced) scene.still();
    else run(true);
  } else if (!scene) {
    return;
  } else if (m.type === 'resize') {
    scene.resize(m.width, m.height, m.dpr);
    if (reduced) scene.still();
  } else if (m.type === 'flying') {
    scene.setFlying(m.on);
  } else if (m.type === 'home') {
    scene.goHome();
    if (reduced) scene.still();
  } else if (m.type === 'run') {
    run(m.on);
  }
};
