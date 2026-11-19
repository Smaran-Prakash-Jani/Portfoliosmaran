import React, { useRef, useState } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useScrollProgress } from '../../lib/useScrollProgress';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------------------
 * ScrollRevealText: words light up one after another as the text scrolls through
 * ------------------------------------------------------------------------- */

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{' '}
    </>
  );
}

export function ScrollRevealText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const progress = useScrollProgress(ref, 'pass');
  const [reduced] = useState(prefersReduced);
  if (reduced) return <span className={className}>{text}</span>;
  const words = text.split(' ');
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => {
          const a = 0.1 + (i / words.length) * 0.36;
          return (
            <Word key={i} progress={progress} range={[a, a + 0.06]}>
              {w}
            </Word>
          );
        })}
      </span>
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * TiltMedia: tilts towards the mouse in 3D, with a light glare that follows it
 * ------------------------------------------------------------------------- */

export function TiltMedia({ children, className, max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const rx = useSpring(0, { stiffness: 160, damping: 18 });
  const ry = useSpring(0, { stiffness: 160, damping: 18 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useSpring(0, { stiffness: 120, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.28), transparent 55%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
    glareOpacity.set(1);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
    glareOpacity.set(0);
  };

  return (
    <div className={className} style={{ perspective: 1100 }} onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div className="relative w-full h-full" style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}>
        {children}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 mix-blend-overlay"
          style={{ background: glare, opacity: glareOpacity }}
        />
      </motion.div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Magnetic: the child is pulled towards the cursor while it hovers nearby
 * ------------------------------------------------------------------------- */

export function Magnetic({ children, strength = 0.3, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const x = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div className={className} style={{ x, y }} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
 * GhostNumeral: a giant outlined number that drifts behind a section
 * ------------------------------------------------------------------------- */

export function GhostNumeral({ children, className }: { children: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(ref, 'pass');
  const y = useTransform(progress, [0, 1], ['30%', '-30%']);
  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none select-none absolute -z-10 ${className ?? ''}`}>
      <motion.span
        style={{ y, WebkitTextStroke: '1.5px rgba(196,181,253,0.13)' }}
        className="block font-medium tracking-tighter leading-none text-transparent text-[44vw] md:text-[24vw]"
      >
        {children}
      </motion.span>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * VelocityMarquee: an endless band that speeds up, flips and leans with your scroll
 * ------------------------------------------------------------------------- */

export function VelocityMarquee({
  items,
  reverse = false,
  className,
  itemClassName,
  speed = 2.2,
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
  speed?: number;
}) {
  const x = useMotionValue(0);
  const skew = useSpring(0, { stiffness: 120, damping: 20 });
  const xPct = useTransform(x, (v) => `${v}%`);
  const dir = useRef(reverse ? 1 : -1);
  const lastY = useRef<number | null>(null);
  const [reduced] = useState(prefersReduced);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const y = window.scrollY;
    const v = lastY.current === null ? 0 : ((y - lastY.current) / Math.max(delta, 1)) * 1000;
    lastY.current = y;
    if (Math.abs(v) > 30) dir.current = (v > 0 ? -1 : 1) * (reverse ? -1 : 1);
    const boost = 1 + Math.min(Math.abs(v) / 350, 7);
    let next = x.get() + dir.current * speed * boost * (delta / 1000);
    if (next <= -50) next += 50;
    if (next > 0) next -= 50;
    x.set(next);
    skew.set(Math.max(Math.min(-v / 140, 10), -10));
  });

  const row = (copy: number) => (
    <span key={copy} className="flex shrink-0 items-center" aria-hidden={copy > 0 ? 'true' : undefined}>
      {items.map((item) => (
        <React.Fragment key={item}>
          <span className={itemClassName}>{item}</span>
          <span className="mx-6 md:mx-10 inline-block w-2.5 h-2.5 md:w-3.5 md:h-3.5 rotate-45 border border-[#A78BFA]/70 shadow-[0_0_14px_rgba(139,92,246,0.7)]" />
        </React.Fragment>
      ))}
    </span>
  );

  return (
    <div className={`overflow-hidden ${className ?? ''}`}>
      <motion.div className="flex w-max whitespace-nowrap will-change-transform" style={{ x: xPct, skewX: skew }}>
        {row(0)}
        {row(1)}
      </motion.div>
    </div>
  );
}
