import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { canvasDpr } from '../lib/quality';
import { motion, useMotionValueEvent } from 'motion/react';
import Crosshair from './reactbits/Crosshair';
import { BlurText, ScrambleText } from './fx/TextFx';
import { useScrollProgress } from '../lib/useScrollProgress';

// WebGL (ogl) dither: kept out of the first download, fetched in the background after load
const loadDitherVeil = () => import('./reactbits/DitherVeil');
const DitherVeil = lazy(loadDitherVeil);

/**
 * The page the hero's tunnel drops you onto: a 1-bit dithered portrait that develops into the
 * real photo under the cursor, inside a viewfinder. It sits behind the end of the hero (negative
 * top margin, lower z-index) and is pinned while the tunnel's exit hole opens onto it.
 */
export function Portrait() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef, 'pin');
  const [arrived, setArrived] = useState(false);
  const [prepared, setPrepared] = useState(false);

  // Only start (and play the dither's intro) once the tunnel actually opens onto this page
  useMotionValueEvent(progress, 'change', (v) => {
    if (v > 0.001 && !arrived) setArrived(true);
  });
  useEffect(() => {
    if (progress.get() > 0.001) setArrived(true);
    // fetch the dither code and the photo in the background, then set it up while it's still hidden
    // behind the tunnel, so the moment the tunnel opens onto it nothing has to be built
    let alive = true;
    const t = window.setTimeout(() => {
      loadDitherVeil().then(() => {
        const go = () => alive && setPrepared(true);
        if ('requestIdleCallback' in window) window.requestIdleCallback(go, { timeout: 2000 });
        else go();
      });
    }, 600);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [progress]);

  return (
    <section
      id="me"
      ref={sectionRef}
      aria-label="About me"
      className="relative z-10 w-full -mt-[118svh] md:-mt-[123svh] h-[258svh] md:h-[263svh]"
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden flex items-center">
        <div className="relative w-full max-w-[90rem] mx-auto px-6 md:pl-12 md:pr-28 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,560px)] gap-8 lg:gap-20 items-center">
          {/* Copy */}
          <div className="order-2 lg:order-1">
            {arrived && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="flex items-center gap-3 mb-6 md:mb-10 font-mono text-[10px] tracking-[0.3em] uppercase text-white/70"
                >
                  <span className="w-1 h-1 border border-[#8B5CF6]/80 rounded-full" />
                  <ScrambleText text="00 // Subject located" playOn="mount" delay={0.3} />
                </motion.div>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter leading-[0.92] text-white">
                  <BlurText text={"Hi, I'm\nSmaran."} playOn="mount" delay={0.35} stagger={0.12} duration={1.2} />
                </h2>
                <motion.p
                  initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
                  className="mt-6 md:mt-10 max-w-lg text-lg md:text-xl text-white/70 font-light leading-relaxed"
                >
                  A Computer Science student, hyper-focused on artificial intelligence and machine learning, and obsessed
                  with the final layer: how it looks, moves and feels.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                  className="mt-8 md:mt-12 hidden md:flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] uppercase text-[#C4B5FD]/90"
                >
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-[#A78BFA] animate-ping opacity-60" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                  </span>
                  Move across the portrait to develop it · click to flash
                </motion.div>
              </>
            )}
          </div>

          {/* Viewfinder */}
          <div className="order-1 lg:order-2 relative mx-auto w-full max-w-[min(78vw,560px)] lg:max-w-none">
            <div ref={frameRef} className="relative aspect-square w-full" data-cursor-label="Develop">
              {(arrived || prepared) && (
                <Suspense fallback={null}>
                  <DitherVeil
                    hold={!arrived}
                    maxDpr={Math.max(1, canvasDpr(2))}
                    src="/portrait.jpg"
                    fit="cover"
                    pattern="floyd"
                    pixelSize={2}
                    inkColor="#030303"
                    paperColor="#e6e0ff"
                    contrast={1.2}
                    brightness={0.04}
                    revealRadius={150}
                    softness={0.65}
                    linger={1.4}
                    rimColor="#a78bfa"
                    rim={0.22}
                    wander
                  />
                </Suspense>
              )}
              <Crosshair containerRef={frameRef} color="#c4b5fd" opacity={0.7} smoothing={0.25} targetEffect="none" showCoordinates />
              {/* viewfinder corners and readouts */}
              <span className="pointer-events-none absolute -left-3 -top-3 w-6 h-6 border-l border-t border-white/70" />
              <span className="pointer-events-none absolute -right-3 -top-3 w-6 h-6 border-r border-t border-white/70" />
              <span className="pointer-events-none absolute -left-3 -bottom-3 w-6 h-6 border-l border-b border-white/70" />
              <span className="pointer-events-none absolute -right-3 -bottom-3 w-6 h-6 border-r border-b border-white/70" />
              <span className="pointer-events-none absolute left-0 -top-8 font-mono text-[9px] tracking-[0.3em] uppercase text-white/70">
                Subject // SPJ-01
              </span>
              <span className="pointer-events-none absolute right-0 -top-8 font-mono text-[9px] tracking-[0.3em] uppercase text-[#C4B5FD]/90">
                ● Rec
              </span>
              <span className="pointer-events-none absolute left-0 -bottom-8 font-mono text-[9px] tracking-[0.3em] uppercase text-white/55">
                Dither 1-bit<span className="hidden sm:inline"> · Floyd–Steinberg</span>
              </span>
              <span className="pointer-events-none absolute right-0 -bottom-8 font-mono text-[9px] tracking-[0.3em] uppercase text-white/55">
                ID verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
