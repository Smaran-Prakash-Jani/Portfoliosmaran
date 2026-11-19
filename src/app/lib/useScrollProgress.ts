import { useEffect, type RefObject } from 'react';
import { useMotionValue, type MotionValue } from 'motion/react';

/**
 * Scroll progress (0..1) of an element, measured from the real scroll position.
 * Used instead of motion's useScroll, whose browser-accelerated scroll timelines
 * produced wrong values for the pinned hero.
 *
 * - 'pin':  0 when the element's top reaches the top of the screen, 1 when its bottom reaches the bottom
 * - 'pass': 0 when the element enters at the bottom of the screen, 1 when it leaves at the top
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, mode: 'pin' | 'pass' = 'pin'): MotionValue<number> {
  const progress = useMotionValue(0);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const value = mode === 'pin' ? -rect.top / Math.max(rect.height - vh, 1) : (vh - rect.top) / (vh + rect.height);
      progress.set(Math.min(Math.max(value, 0), 1));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref, mode, progress]);

  return progress;
}
