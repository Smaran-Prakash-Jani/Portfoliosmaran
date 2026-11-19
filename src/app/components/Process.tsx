import React, { Suspense, lazy, useCallback, useRef, useState } from 'react';
import { GLSlot } from './fx/GLSlot';
import { motion, useMotionTemplate, useTransform, type MotionValue } from 'motion/react';
import { useScrollProgress } from '../lib/useScrollProgress';

// three.js is heavy, so the 3D scene loads after the rest of the page
const ShardMorph = lazy(() => import('./fx/ShardMorph'));

type Side = 'left' | 'right' | 'center';

// Each line of copy shows while its shape holds still (see MORPH_STOPS in fx/shapes.ts)
const stages: Array<{ code: string; title: string; body: string; side: Side; range: number[] }> = [
  {
    code: 'Stage 01 // Input',
    title: 'Intelligence is the raw material.',
    body: 'Models, data and logic. Enormous power, with no shape of its own.',
    side: 'left',
    range: [0, 0.1, 0.16],
  },
  {
    code: 'Stage 02 // Entropy',
    title: 'Left alone, it scatters.',
    body: 'Fragments across tools, pipelines and screens that never quite connect.',
    side: 'center',
    range: [0.2, 0.25, 0.36, 0.42],
  },
  {
    code: 'Stage 03 // Concept',
    title: 'Then comes the idea.',
    body: 'One clear concept that pulls every fragment into a single system.',
    side: 'right',
    range: [0.48, 0.53, 0.62, 0.68],
  },
  {
    code: 'Stage 04 // Output',
    title: 'Shipped to the real world.',
    body: 'Precise, fast, beautiful products that people can actually feel.',
    side: 'left',
    range: [0.74, 0.8, 1],
  },
];

const segments: Array<[number, number]> = [
  [0, 0.2],
  [0.2, 0.48],
  [0.48, 0.74],
  [0.74, 1],
];

const sideClass: Record<Side, string> = {
  left: 'md:left-12 lg:left-[8%] md:right-auto md:top-1/2 md:-translate-y-1/2 md:max-w-md lg:max-w-lg',
  right: 'md:left-auto md:right-28 lg:right-[10%] md:top-1/2 md:-translate-y-1/2 md:max-w-md lg:max-w-lg',
  center: 'md:left-1/2 md:right-auto md:-translate-x-1/2 md:top-1/2 md:-translate-y-1/2 md:max-w-2xl md:text-center',
};

function StageText({ stage, index, progress }: { stage: (typeof stages)[number]; index: number; progress: MotionValue<number> }) {
  const first = index === 0;
  const last = index === stages.length - 1;
  const out = first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0];
  const opacity = useTransform(progress, stage.range, out);
  const y = useTransform(progress, stage.range, first ? [0, 0, -40] : last ? [40, 0, 0] : [40, 0, 0, -40]);
  const blur = useTransform(progress, stage.range, first ? [0, 0, 12] : last ? [12, 0, 0] : [12, 0, 0, 12]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  return (
    <motion.div
      style={{ opacity, y, filter }}
      className={`absolute left-8 right-8 bottom-28 md:bottom-auto pointer-events-none ${sideClass[stage.side]}`}
    >
      <motion.div
        initial={first ? { opacity: 0, filter: 'blur(12px)', y: 30 } : false}
        whileInView={first ? { opacity: 1, filter: 'blur(0px)', y: 0 } : undefined}
        viewport={{ once: true, margin: '0px 0px -20% 0px' }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        {/* dark halo so the copy stays readable over the particles */}
        <div className="absolute -inset-x-16 -inset-y-12 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(3,3,3,0.82),rgba(3,3,3,0.45)_45%,transparent_72%)]" />
        <span className="inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] uppercase text-[#C4B5FD]/90">
          <span className="w-1 h-1 border border-[#8B5CF6]/80 rounded-full" />
          {stage.code}
        </span>
        <h3 className="mt-4 md:mt-5 text-[2.1rem] md:text-5xl lg:text-6xl font-medium tracking-tighter leading-[1.05] text-white">
          {stage.title}
        </h3>
        <p className="mt-4 md:mt-6 text-base md:text-lg text-white/60 font-light leading-relaxed">{stage.body}</p>
      </motion.div>
    </motion.div>
  );
}

function Segment({ range, progress }: { range: [number, number]; progress: MotionValue<number> }) {
  const scaleX = useTransform(progress, range, [0, 1]);
  return (
    <div className="relative w-8 md:w-12 h-[2px] bg-white/10 overflow-hidden">
      <motion.div className="absolute inset-0 origin-left bg-[#8B5CF6] shadow-[0_0_8px_rgba(139,92,246,0.8)]" style={{ scaleX }} />
    </div>
  );
}

/** Pinned interlude: a brain of metal shards that bursts apart, becomes a lightbulb, then a globe. */
export function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef, 'pin');
  const [exploded, setExploded] = useState(false);
  const hotspotRef = useRef<HTMLButtonElement>(null);
  const collapse = useCallback(() => setExploded(false), []);

  return (
    <section id="process" ref={sectionRef} aria-label="Process" className="relative z-10 w-full h-[330svh] md:h-[380svh]">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <GLSlot>
        <Suspense fallback={null}>
          <ShardMorph
            sectionRef={sectionRef}
            exploded={exploded}
            onCollapse={collapse}
            hotspotRef={hotspotRef}
            className="absolute inset-0 w-full h-full [mask-image:linear-gradient(to_bottom,transparent,#000_10%,#000_90%,transparent)]"
          />
        </Suspense>
        </GLSlot>

        {/* Invisible hotspot the scene keeps over the shape: the cursor locks onto it, a click opens it */}
        <button
          ref={hotspotRef}
          type="button"
          onClick={() => setExploded((v) => !v)}
          aria-label={exploded ? 'Rebuild the shape' : 'Look inside the shape'}
          data-cursor-label={exploded ? 'Rebuild' : 'Open it'}
          className="absolute hidden rounded-full cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#A78BFA]/70"
        />

        {/* Stage tracker */}
        <div className="absolute top-[76px] md:top-28 inset-x-0 flex flex-col items-center gap-2.5 pointer-events-none">
          <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/50">01.B // Process</span>
          <div className="flex gap-1.5">
            {segments.map((range, i) => (
              <Segment key={i} range={range} progress={progress} />
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExploded((v) => !v);
            }}
            aria-pressed={exploded}
            className="pointer-events-auto mt-1 flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-[#C4B5FD]/90 hover:text-white transition-colors"
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inset-0 rounded-full bg-[#A78BFA] animate-ping opacity-60" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
            </span>
            {exploded ? 'Click to rebuild' : 'Click to look inside'}
          </button>
        </div>

        {stages.map((stage, i) => (
          <StageText key={stage.code} stage={stage} index={i} progress={progress} />
        ))}
      </div>
    </section>
  );
}
