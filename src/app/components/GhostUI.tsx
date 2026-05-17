import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export function GhostUI() {
  const [time, setTime] = useState("00:00:00");
  const [ms, setMs] = useState("000");

  const { scrollY } = useScroll();
  // Transform scroll position into a pseudo-coordinate
  const yCoord = useTransform(scrollY, [0, 5000], [0.08, 34.55]);
  const yDisplay = useTransform(yCoord, (v) => v.toFixed(3));

  useEffect(() => {
    // 1-second interval for main timestamp
    const timer = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    }, 1000);

    // Fast interval for purely visual 'millisecond' technical effect
    // We decouple this from actual Date to prevent actual time lag feeling
    const msTimer = setInterval(() => {
      setMs(String(Math.floor(Math.random() * 999)).padStart(3, '0'));
    }, 50);

    // Initial set
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);

    return () => {
      clearInterval(timer);
      clearInterval(msTimer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {/* Subtle Scanner Lines - Gentle moving vertical background pattern */}
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "0px 100px"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40" 
        style={{ 
          maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)',
          WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)'
        }}
      />
      
      {/* Vertical Tech Lines */}
      <div className="absolute top-0 bottom-0 left-[3%] w-[1px] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute top-0 bottom-0 right-[3%] w-[1px] bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

      {/* Calibration Crosshairs & Circles - Top Left */}
      <motion.div 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex flex-col gap-3 opacity-100"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-12 h-12 border-[1px] border-white/50 rounded-full flex items-center justify-center relative">
          <motion.div 
            animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1], boxShadow: ["0 0 4px rgba(255,255,255,0.2)", "0 0 12px rgba(255,255,255,0.9)", "0 0 4px rgba(255,255,255,0.2)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 bg-white rounded-full" 
          />
          <motion.div 
            animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute inset-1 border-[1px] border-white/40 rounded-full" 
          />
          <div className="absolute -top-2 bottom-0 w-[1px] bg-white/60 h-16" />
          <div className="absolute -left-2 right-0 h-[1px] bg-white/60 w-16" />
        </div>
        <span className="text-[10px] font-mono text-white/80 tracking-widest uppercase">
          SYS.CAL // 0.001
        </span>
      </motion.div>

      {/* Data Labels - Top Right */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 flex flex-col items-end gap-1.5 opacity-100">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-white/90 tracking-wider">
            {time}
          </span>
          <span className="text-[9px] font-mono text-white/60 w-6 text-right">
            {ms}
          </span>
        </div>
        <div className="flex gap-1 mt-1">
          {[...Array(5)].map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              className={`w-3 h-[2px] ${i < 3 ? 'bg-white/90' : 'bg-white/40'}`} 
            />
          ))}
        </div>
        <motion.span 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="text-[9px] font-mono text-white/70 tracking-[0.2em] mt-2 uppercase"
        >
          Data Stream: Active
        </motion.span>
      </div>

      {/* Frame Corners - Bottom Left */}
      <motion.div 
        className="absolute bottom-6 left-6 md:bottom-8 md:left-8 flex flex-col gap-2"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-12 h-12 border-l-[1px] border-b-[1px] border-white/[0.35]" />
        <div className="flex gap-2 text-[10px] font-mono text-white/25 tracking-widest">
          <span>X: -14.2</span>
          <span className="text-white/10">//</span>
          <div className="flex gap-1">
            <span>Y:</span>
            <motion.span>{yDisplay}</motion.span>
          </div>
        </div>
      </motion.div>

      {/* Frame Corners - Bottom Right */}
      <motion.div 
        className="absolute bottom-6 right-6 md:bottom-8 md:right-8 flex flex-col items-end gap-2"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3.5 }}
      >
        <div className="w-12 h-12 border-r-[1px] border-b-[1px] border-white/[0.35]" />
        <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase mt-[-24px] mr-3">
          PWR. 100%
        </span>
      </motion.div>

      {/* Screen Edge Ticks */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col gap-8 opacity-40">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-2 h-[1px] bg-white/40" />
        ))}
      </div>

      {/* Center Reticle (Ultra faint) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] flex items-center justify-center">
        <div className="absolute w-40 h-40 border-[1px] border-white rounded-full" />
        <div className="absolute w-52 h-[1px] bg-white" />
        <div className="absolute w-[1px] h-52 bg-white" />
      </div>
    </div>
  );
}
