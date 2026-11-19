import React, { useEffect, useRef } from 'react';
import { createButterflyScene } from './butterflyScene';

/**
 * A neon butterfly that flaps in 3D and glitches between two looks: solid magenta, and a blue
 * "computer vision" pass with tracked points, x/y labels and bounding boxes. Canvas 2D.
 * It is drawn in a web worker when the browser can hand a canvas over (OffscreenCanvas), so
 * heavy work on the page — like everything being set up behind the loading screen — can never
 * make it stutter; otherwise it runs on the main thread.
 */
export function TrackedButterfly({
  className,
  flying = false,
  home = false,
}: {
  className?: string;
  /** taking off: faster wing beat, no more wandering inside its box */
  flying?: boolean;
  /** switch to the homepage's colours */
  home?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ setFlying: (on: boolean) => void; goHome: () => void } | null>(null);

  useEffect(() => {
    api.current?.setFlying(flying);
  }, [flying]);
  useEffect(() => {
    if (home) api.current?.goHome();
  }, [home]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phone = window.innerWidth < 768;
    const size = () => ({ width: canvas.clientWidth, height: canvas.clientHeight, dpr: Math.min(window.devicePixelRatio || 1, 2) });

    let run: (on: boolean) => void = () => {};
    let resize: () => void = () => {};
    let dispose: () => void = () => {};

    let worker: Worker | null = null;
    if ('transferControlToOffscreen' in canvas && typeof Worker !== 'undefined') {
      try {
        const offscreen = canvas.transferControlToOffscreen();
        worker = new Worker(new URL('./butterfly.worker.ts', import.meta.url), { type: 'module' });
        worker.postMessage({ type: 'init', canvas: offscreen, phone, reduced, ...size() }, [offscreen]);
        const w = worker;
        run = (on) => w.postMessage({ type: 'run', on });
        resize = () => w.postMessage({ type: 'resize', ...size() });
        api.current = { setFlying: (on) => w.postMessage({ type: 'flying', on }), goHome: () => w.postMessage({ type: 'home' }) };
        dispose = () => w.terminate();
      } catch {
        worker = null;
      }
    }
    if (!worker) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scene = createButterflyScene(canvas, ctx, {
        phone,
        makeCanvas: (n) => {
          const c = document.createElement('canvas');
          c.width = c.height = n;
          return c;
        },
      });
      let raf = 0;
      let running = false;
      const loop = (t: number) => {
        scene.step(t);
        raf = requestAnimationFrame(loop);
      };
      run = (on) => {
        if (reduced) return;
        if (on && !running) {
          running = true;
          scene.resetClock();
          raf = requestAnimationFrame(loop);
        } else if (!on && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      };
      resize = () => {
        const s = size();
        scene.resize(s.width, s.height, s.dpr);
        if (reduced) scene.still();
      };
      api.current = {
        setFlying: scene.setFlying,
        goHome: () => {
          scene.goHome();
          if (reduced) scene.still();
        },
      };
      dispose = () => run(false);
      resize();
    }
    api.current?.setFlying(flying);
    if (home) api.current?.goHome();

    // only animate while on screen and not covered by the menu / resume panel
    let onScreen = false;
    let covered = false;
    const update = () => run(onScreen && !covered);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(canvas);
    const onCover = (ev: Event) => {
      covered = (ev as CustomEvent<boolean>).detail;
      update();
    };
    window.addEventListener('site-overlay', onCover);
    let first = true;
    const ro = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      resize();
    });
    ro.observe(canvas);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('site-overlay', onCover);
      api.current = null;
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
