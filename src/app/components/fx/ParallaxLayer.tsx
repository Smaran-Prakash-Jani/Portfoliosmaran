import React, { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { useScrollProgress } from '../../lib/useScrollProgress';

/**
 * Fills its (overflow-hidden) parent. The content settles from a zoom when it first
 * appears, then drifts slower than the page while you scroll past it.
 */
export function ParallaxLayer({ children, amount = 8 }: { children: React.ReactNode; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollYProgress = useScrollProgress(ref, 'pass');
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);

  return (
    <div ref={ref} className="absolute inset-0">
      <motion.div style={{ y, top: `-${amount}%`, bottom: `-${amount}%` }} className="absolute inset-x-0">
        <motion.div
          initial={{ scale: 1.35 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
