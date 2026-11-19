import React, { useCallback, useEffect, useRef } from 'react';
import { motion, type Variants } from 'motion/react';

const ease = [0.22, 1, 0.36, 1] as const;
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>[]{}_-';

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Text that "decodes" from random glyphs into the real string.
 * Plays when it first scrolls into view (or on mount), and again on hover of the
 * closest ancestor marked with data-fx-group.
 */
export function ScrambleText({
  text,
  className,
  delay = 0,
  playOn = 'view',
  replayOnHover = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  playOn?: 'view' | 'mount' | 'hover';
  replayOnHover?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);

  const run = useCallback(
    (wait = 0) => {
      const el = ref.current;
      if (!el || prefersReduced()) return;
      cancelAnimationFrame(raf.current);
      const reveal = Array.from(text, (_, i) => 120 + (i / Math.max(text.length, 1)) * 650 + Math.random() * 220);
      const t0 = performance.now() + wait;
      const tick = (now: number) => {
        const t = now - t0;
        let out = '';
        let done = true;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (ch === ' ' || t >= reveal[i]) out += ch;
          else {
            done = false;
            out += t < 0 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
        }
        el.textContent = out;
        if (!done) raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [text],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = text;
    const cleanups: Array<() => void> = [];

    if (playOn === 'mount') run(delay * 1000);
    if (playOn === 'view') {
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            run(delay * 1000);
            io.disconnect();
          }
        },
        { rootMargin: '0px 0px -10% 0px' },
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());
    }
    if (replayOnHover || playOn === 'hover') {
      const group = el.closest('[data-fx-group]') ?? el;
      const onEnter = () => run(0);
      group.addEventListener('mouseenter', onEnter);
      cleanups.push(() => group.removeEventListener('mouseenter', onEnter));
    }
    return () => {
      cancelAnimationFrame(raf.current);
      cleanups.forEach((fn) => fn());
    };
  }, [text, delay, playOn, replayOnHover, run]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true" />
    </span>
  );
}

const pieceVariants: Variants = {
  hidden: { opacity: 0, y: '0.45em', filter: 'blur(14px)' },
  shown: (c: { i: number; delay: number; stagger: number; duration: number }) => ({
    opacity: 1,
    y: '0em',
    filter: 'blur(0px)',
    transition: { duration: c.duration, ease, delay: c.delay + c.i * c.stagger },
  }),
};

/**
 * Splits text into words (or letters) that sharpen out of a blur, one after another.
 * Use "\n" in the text for a line break.
 */
export function BlurText({
  text,
  className,
  split = 'words',
  delay = 0,
  stagger = 0.07,
  duration = 1.1,
  playOn = 'view',
}: {
  text: string;
  className?: string;
  split?: 'words' | 'chars';
  delay?: number;
  stagger?: number;
  duration?: number;
  playOn?: 'view' | 'mount';
}) {
  let i = 0;
  const lines = text.split('\n');
  const trigger =
    playOn === 'mount'
      ? { initial: 'hidden', animate: 'shown' }
      : { initial: 'hidden', whileInView: 'shown', viewport: { once: true, margin: '0px 0px -12% 0px' } };

  return (
    <motion.span className={className} {...trigger}>
      <span className="sr-only">{text.replace(/\n/g, ' ')}</span>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" className={lines.length > 1 ? 'block' : undefined}>
          {line.split(' ').map((word, wi, words) => (
            <React.Fragment key={wi}>
              {split === 'words' ? (
                <motion.span variants={pieceVariants} custom={{ i: i++, delay, stagger, duration }} className="inline-block will-change-transform">
                  {word}
                </motion.span>
              ) : (
                <span className="inline-block whitespace-nowrap">
                  {Array.from(word).map((ch, ci) => (
                    <motion.span key={ci} variants={pieceVariants} custom={{ i: i++, delay, stagger, duration }} className="inline-block will-change-transform">
                      {ch}
                    </motion.span>
                  ))}
                </span>
              )}
              {wi < words.length - 1 ? ' ' : null}
            </React.Fragment>
          ))}
        </span>
      ))}
    </motion.span>
  );
}
