import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TrackedButterfly } from './fx/TrackedButterfly';
import { BlurText } from './fx/TextFx';
import LatticeLoader from './reactbits/LatticeLoader';
import { markSiteReady } from '../lib/boot';

/**
 * Loading screen: the neon butterfly, a cinematic title and a progress bar that follows real
 * work (fonts, the page's files, the hero video, the 3D scene being built in the background).
 * The butterfly appears once the heavy setup behind the curtain has settled (so it never
 * stutters), turns the homepage's silver and lavender when everything has loaded, and then
 * flies off into the distance — smaller and smaller — along a different random path every
 * visit, while the hero plays in behind it.
 */

const MIN_MS_FIRST = 2200; // long enough for the butterfly and the title to land
const MIN_MS_REPEAT = 900; // a returning visitor in the same session waits less
const MAX_MS = 6000; // never hold anyone longer than this
const FLIGHT_S = 2.4;
const BUTTERFLY_STAGE_MS = 1400; // the butterfly's time on screen before it may fly off
const BUTTERFLY_WAIT_MS = 1500; // it appears by then at the latest

const withTimeout = (p: Promise<unknown>, ms: number) =>
  Promise.race([p, new Promise((resolve) => window.setTimeout(resolve, ms))]);

const onceEvent = (name: string) => new Promise<void>((resolve) => window.addEventListener(name, () => resolve(), { once: true }));

const pageLoaded = () =>
  document.readyState === 'complete' ? Promise.resolve() : new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }));

// the hero video: wait for its element, then for enough data to play
const heroVideoReady = () =>
  new Promise<void>((resolve) => {
    let tries = 0;
    const look = () => {
      const v = document.querySelector<HTMLVideoElement>('#hero video');
      if (!v) {
        if (++tries > 80) resolve();
        else window.setTimeout(look, 50);
        return;
      }
      if (v.readyState >= 3) resolve();
      else {
        v.addEventListener('canplay', () => resolve(), { once: true });
        v.addEventListener('error', () => resolve(), { once: true });
      }
    };
    look();
  });

const repeatVisit = () => {
  try {
    const seen = sessionStorage.getItem('spj-loaded') === '1';
    sessionStorage.setItem('spj-loaded', '1');
    return seen;
  } catch {
    return false;
  }
};

/** a random way off the screen: any direction, a gentle curve, shrinking as it flies into the distance */
function randomFlight() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const angle = Math.random() * Math.PI * 2;
  const reach = Math.hypot(vw, vh) * 0.85;
  const dx = Math.cos(angle) * reach;
  const dy = Math.sin(angle) * reach;
  const bend = (Math.random() < 0.5 ? -1 : 1) * (0.18 + Math.random() * 0.2) * reach;
  // the curve's middle: a third of the way out, pushed sideways
  const mx = dx * 0.35 - Math.sin(angle) * bend;
  const my = dy * 0.35 + Math.cos(angle) * bend - vh * 0.04;
  const tilt = Math.max(-28, Math.min(28, (Math.cos(angle) * 180) / Math.PI / 3));
  return {
    x: [0, mx, dx],
    y: [0, my, dy],
    // farther away = smaller, steadily
    scale: [1, 0.5, 0.06],
    rotate: [0, tilt * 0.6, tilt],
  };
}

export function LoadingScreen({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'done' | 'leaving'>('loading');
  const [butterflyIn, setButterflyIn] = useState(false);
  const [flight] = useState(randomFlight);
  const barRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const cb = useRef({ onReveal, onDone });
  cb.current = { onReveal, onDone };

  // the butterfly lives on its own layer above the curtain, laid over its place in the layout,
  // so it can stay in view and fly off after the curtain has gone
  useLayoutEffect(() => {
    const place = () => {
      const slot = slotRef.current;
      const fly = flyRef.current;
      if (!slot || !fly) return;
      const r = slot.getBoundingClientRect();
      fly.style.left = `${r.left}px`;
      fly.style.top = `${r.top}px`;
      fly.style.width = `${r.width}px`;
      fly.style.height = `${r.height}px`;
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, []);

  useEffect(() => {
    const started = performance.now();
    const minMs = repeatVisit() ? MIN_MS_REPEAT : MIN_MS_FIRST;
    // weighted steps of real work
    const tasks: Array<[number, Promise<unknown>]> = [
      [3, pageLoaded()],
      [1, document.fonts ? document.fonts.ready : Promise.resolve()],
      [2, withTimeout(heroVideoReady(), 6000)],
      [1, import('./fx/ShardMorph').catch(() => undefined)],
      [2, withTimeout(onceEvent('shards-ready'), 4500)],
      [1, import('./reactbits/DitherVeil').catch(() => undefined)],
    ];
    const total = tasks.reduce((s, [w]) => s + w, 0);
    let finished = 0;
    let target = 0;
    let shown = 0;
    let complete = false;
    let alive = true;
    tasks.forEach(([w, p]) =>
      p.finally(() => {
        finished += w;
        target = finished / total;
      })
    );
    const all = Promise.all(tasks.map(([, p]) => p.catch(() => undefined)));
    const minWait = new Promise((r) => window.setTimeout(r, minMs));
    // the butterfly comes in once the heaviest setup (the page and the 3D scene) has settled,
    // then has its moment on screen before the curtain may lift
    const settled = withTimeout(Promise.all([tasks[0][1], tasks[4][1]]), BUTTERFLY_WAIT_MS);
    const stage = settled.then(() => {
      if (alive) setButterflyIn(true);
      return new Promise((r) => window.setTimeout(r, BUTTERFLY_STAGE_MS));
    });
    withTimeout(Promise.all([all, minWait, stage]), MAX_MS + BUTTERFLY_STAGE_MS).then(() => {
      complete = true;
      target = 1;
    });

    // the bar eases towards real progress, creeping gently so it never looks stuck
    let raf = 0;
    let last = started;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const goal = complete ? 1 : Math.min(0.96, Math.max(target, shown + dt * 0.02));
      shown += (goal - shown) * (1 - Math.exp(-dt * (complete ? 9 : 3.5)));
      if (complete && 1 - shown < 0.002) shown = 1;
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown})`;
      if (pctRef.current) pctRef.current.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      if (shown >= 1) {
        if (!alive) return;
        setPhase('done');
        // a beat on the check mark, then lift the curtain and let the butterfly go
        window.setTimeout(() => {
          if (!alive) return;
          setPhase('leaving');
          markSiteReady();
          cb.current.onReveal();
        }, 520);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  const leaving = phase === 'leaving';

  return (
    <>
      <AnimatePresence>
        {!leaving && (
          <motion.div
            key="curtain"
            role="status"
            aria-label="Loading"
            className="fixed inset-0 z-[400] flex flex-col items-center justify-center overflow-hidden bg-[#030303] text-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
          >
            {/* faint grid and a soft glow behind the butterfly */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '48px 48px' }}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(167,139,250,0.09),transparent_55%)]" />

            {/* HUD frame */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-4 md:inset-8">
              <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-white/40" />
              <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-white/40" />
              <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/40" />
              <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/40" />
              <span className="absolute left-6 top-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/45">SPJ // Boot sequence</span>
              <span className="absolute right-6 top-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/45">Init</span>
            </div>

            <motion.div
              className="relative flex w-full flex-col items-center px-6"
              exit={{ y: -12, filter: 'blur(6px)', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
            >
              {/* where the butterfly sits (it is drawn on its own layer, above) */}
              <div ref={slotRef} aria-hidden="true" className="h-[min(46vh,420px)] w-[min(92vw,600px)]" />

              {/* a film-title line: thin, widely spaced capitals that blur in letter by letter */}
              <h1 className="mt-2 max-w-[92vw] text-center font-['Montserrat'] font-light uppercase leading-[1.9] text-white/90">
                <BlurText
                  text={"The Butterfly Effect of\u00A0Universe"}
                  split="chars"
                  playOn="mount"
                  delay={0.35}
                  stagger={0.035}
                  duration={1.2}
                  className="text-[12px] tracking-[0.42em] md:text-[17px] md:tracking-[0.6em]"
                />
              </h1>

              {/* progress */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 w-[min(72vw,340px)] md:mt-12"
              >
                <div className="relative h-px w-full overflow-hidden bg-white/10">
                  <div
                    ref={barRef}
                    className="absolute inset-0 origin-left bg-gradient-to-r from-[#A78BFA]/70 via-[#C4B5FD] to-white"
                    style={{ transform: 'scaleX(0)', transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">
                  <LatticeLoader
                    status={phase === 'loading' ? 'working' : 'done'}
                    label="Loading"
                    doneLabel="Ready in"
                    pattern="orbit"
                    grid={3}
                    shape="round"
                    color="#C4B5FD"
                    doneColor="#C4B5FD"
                    cellSize={4}
                    gap={2}
                    fontSize={10}
                    step={90}
                    idleOpacity={0.18}
                    glow
                    showTimer
                  />
                  <span className="tabular-nums text-white/70">
                    <span ref={pctRef}>000</span>%
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the butterfly: stays in view while the curtain fades, then flies off the screen */}
      <motion.div
        ref={flyRef}
        aria-hidden="true"
        className="pointer-events-none fixed z-[401] will-change-transform"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={leaving ? { ...flight, opacity: 1 } : butterflyIn ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
        transition={
          leaving
            ? { default: { duration: FLIGHT_S, ease: [0.5, 0, 0.75, 0.4], times: [0, 0.42, 1] }, opacity: { duration: 0.2 } }
            : { duration: 0.6, ease: 'easeOut' }
        }
        onAnimationComplete={() => {
          if (leaving) cb.current.onDone();
        }}
      >
        <TrackedButterfly flying={leaving} home={phase !== 'loading'} className="block h-full w-full" />
      </motion.div>
    </>
  );
}
