import React, { useEffect, useRef } from 'react';
import { VelocityMarquee } from './fx/ScrollFx';
import { setHudBackdrop } from './fx/hudBackdrop';

const words = ['Artificial Intelligence', 'WebGL', 'Product Design', 'Machine Learning', 'Frontend Engineering', 'Startup Execution'];

/** Two endless bands of keywords between Projects and Capabilities; they react to scroll speed. */
export function MarqueeBand() {
  const ref = useRef<HTMLDivElement>(null);
  // while the band is on screen, the HUD's corner readouts get a dark backing so they stay readable
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHudBackdrop(e.isIntersecting));
    io.observe(el);
    return () => {
      io.disconnect();
      setHudBackdrop(false);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="relative z-10 w-full py-10 md:py-20 select-none overflow-x-clip">
      <div className="-rotate-2 scale-[1.04] border-y border-white/[0.06] bg-[#05030a]/60 py-5 md:py-7">
        <VelocityMarquee
          items={words}
          itemClassName="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-white/85"
        />
      </div>
      <div className="rotate-1 scale-[1.04] -mt-2 py-4 md:py-6">
        <VelocityMarquee
          items={words}
          reverse
          speed={1.6}
          itemClassName="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(196,181,253,0.45)]"
        />
      </div>
    </div>
  );
}
