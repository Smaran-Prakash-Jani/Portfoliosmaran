import React, { useRef } from 'react';
import { motion, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';

export function Hero() {
  // Ultra-premium buttery easing curve
  const ease = [0.22, 1, 0.36, 1];
  const containerRef = useRef<HTMLElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring physics for very subtle interaction
  const springX = useSpring(mouseX, { stiffness: 30, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 30, damping: 25 });
  
  // For the exact reflection light tracking
  const rawMouseX = useMotionValue(0.5);
  const rawMouseY = useMotionValue(0.5);
  const springRawX = useSpring(rawMouseX, { stiffness: 20, damping: 30 });
  const springRawY = useSpring(rawMouseY, { stiffness: 20, damping: 30 });
  
  // Extremely faint, soft cursor light reflection (monochrome with a tiny hint of violet)
  const reflectionBg = useMotionTemplate`radial-gradient(circle at ${useTransform(springRawX, v => v * 100)}% ${useTransform(springRawY, v => v * 100)}%, rgba(255, 255, 255, 0.04), rgba(139, 92, 246, 0.01) 30%, transparent 70%)`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Parallax minimal movement
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x * 0.02); // Very minimal reaction
    mouseY.set(y * 0.02);
    
    // Exact position for reflection
    rawMouseX.set((e.clientX - rect.left) / rect.width);
    rawMouseY.set((e.clientY - rect.top) / rect.height);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    rawMouseX.set(0.5);
    rawMouseY.set(0.5);
  };

  return (
    <section 
      id="hero" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative z-20 min-h-screen w-full flex items-center justify-center bg-[#030303] overflow-hidden"
    >
      
      {/* 
        The Containment Sphere / Cinematic Background
      */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        
        {/* Ambient Left-Side HUD Frame */}
        <div className="absolute top-0 bottom-0 left-0 w-24 md:w-32 pointer-events-none z-10">
          <div className="absolute top-0 bottom-0 left-4 md:left-8 w-[1px] bg-gradient-to-b from-transparent via-white/[0.1] to-transparent" />
          
          <div className="absolute top-32 left-8 md:left-12 flex flex-col gap-1.5 opacity-[0.2]">
            <span className="font-mono text-[8px] md:text-[9px] text-white tracking-widest uppercase">SYS.CAL</span>
            <span className="font-mono text-[7px] md:text-[8px] text-white/80 tracking-wider">SEC: ALPHA</span>
            <div className="flex gap-1 mt-1">
              <div className="w-4 h-[1px] bg-white/60" />
              <div className="w-2 h-[1px] bg-white/40" />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.25, y: [0, -5, 0] }}
            transition={{ 
              opacity: { duration: 3, ease: "easeOut" },
              y: { duration: 15, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-1/2 -translate-y-1/2 left-8 md:left-12 w-8 md:w-12 flex flex-col gap-4 border-l-[1px] border-white/20 pl-3 py-2"
          >
            <span className="font-mono text-[7px] md:text-[8px] text-white tracking-[0.3em] uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
              ID_7X
            </span>
            <div className="flex flex-col gap-[2px] w-full mt-2 opacity-50">
              {[1, 3, 2, 4, 1, 2, 1, 5, 2].map((width, i) => (
                <div key={i} className="h-[1px] bg-white/70" style={{ width: `${width * 20}%` }} />
              ))}
            </div>
            <span className="font-mono text-[6px] md:text-[7px] text-white/50 tracking-wider mt-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>
              ACTV
            </span>
            <div className="absolute -top-1 -left-1 w-2 h-2 border-l-[1px] border-t-[1px] border-white/40" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-[1px] border-b-[1px] border-white/40" />
          </motion.div>

          {/* Floating minimal particles */}
          <div className="absolute inset-0 overflow-hidden opacity-50">
            <motion.div animate={{ y: ['0vh', '-100vh'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="absolute top-[100%] left-[22px] md:left-[38px] w-[1px] h-[1px] bg-white/20 rounded-full" />
            <motion.div animate={{ y: ['0vh', '-100vh'] }} transition={{ duration: 55, repeat: Infinity, ease: 'linear', delay: 5 }} className="absolute top-[100%] left-[10px] md:left-[18px] w-[1px] h-[1px] bg-white/10 rounded-full" />
          </div>

          <div className="absolute bottom-32 left-4 md:left-8 w-6 h-6 border-l-[1px] border-b-[1px] border-white/20 opacity-[0.2]" />
          <span className="absolute bottom-32 left-12 md:left-16 mb-[-3px] font-mono text-[7px] md:text-[8px] text-white/30 tracking-widest">MEM_BANK.L</span>
        </div>

        {/* Subtle Cyberpunk Tracking Markers - Faded even more */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1200px] max-h-[800px] pointer-events-none opacity-[0.2] flex items-center justify-center">
          <div className="absolute top-12 md:top-24 w-[calc(100%-4rem)] md:w-[calc(100%-8rem)] flex justify-between">
            <div className="relative w-[1px] h-8 bg-white/30">
              <motion.div animate={{ height: ['0%', '100%'], opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute top-0 -left-[1px] w-[2px] bg-[#8B5CF6]/50" />
            </div>
            <div className="relative w-[1px] h-8 bg-white/30">
              <motion.div animate={{ height: ['0%', '100%'], opacity: [0, 1, 0] }} transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 -left-[1px] w-[2px] bg-[#8B5CF6]/50" />
            </div>
          </div>
          <div className="absolute bottom-12 md:bottom-24 w-[calc(100%-4rem)] md:w-[calc(100%-8rem)] flex justify-between items-end">
            <div className="w-[1px] h-8 bg-white/30 relative">
              <motion.div animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute -bottom-4 -left-1.5 w-3 h-3 border-[1px] border-white/40" />
            </div>
            <div className="w-[1px] h-8 bg-white/30 relative">
              <motion.div animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute -bottom-4 -left-1.5 w-3 h-3 border-[1px] border-white/40" />
            </div>
          </div>
          
          <div className="absolute left-8 md:left-16 h-[calc(100%-8rem)] md:h-[calc(100%-16rem)] flex flex-col justify-between">
            <div className="w-6 h-[1px] bg-white/30" />
            <div className="w-6 h-[1px] bg-white/30" />
          </div>
          <div className="absolute right-8 md:right-16 h-[calc(100%-8rem)] md:h-[calc(100%-16rem)] flex flex-col justify-between items-end">
            <div className="w-6 h-[1px] bg-white/30 relative">
              <motion.div animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -top-3 -right-0 w-1 h-1 bg-[#8B5CF6]/50 rounded-full" />
            </div>
            <div className="w-6 h-[1px] bg-white/30 relative">
              <motion.div animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 5, delay: 2, repeat: Infinity, ease: "linear" }} className="absolute -top-3 -right-0 w-1 h-1 bg-white/50 rounded-full" />
            </div>
          </div>
          
          <motion.div 
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-4"
          >
            <div className="w-1.5 h-1.5 border-[1px] border-[#8B5CF6]/50 rounded-full flex items-center justify-center">
              <div className="w-[1px] h-[1px] bg-[#8B5CF6]/80 rounded-full" />
            </div>
            <span className="font-mono text-[9px] text-[#8B5CF6]/60 tracking-[0.25em]">SYS.OP_01</span>
            <div className="w-12 h-[1px] bg-white/20 relative overflow-hidden">
              <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-1/3 h-full bg-[#8B5CF6]/40" />
            </div>
          </motion.div>
        </div>

        {/* The Cinematic Containment Sphere (Fluid Glass Bubble) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.97, 1, 0.97], scale: [1, 1.01, 1] }} 
          style={{ 
             x: useTransform(springX, v => v * 0.4), 
             y: useTransform(springY, v => v * 0.4) 
          }}
          transition={{ 
            opacity: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative w-[320px] h-[320px] md:w-[480px] md:h-[480px] lg:w-[640px] lg:h-[640px] flex items-center justify-center pointer-events-none"
        >
          {/* Main Containment Sphere Body (Fluid Base) */}
          <div className="relative w-full h-full rounded-full overflow-hidden backdrop-blur-[24px] bg-black/[0.05] shadow-[0_0_30px_rgba(0,0,0,0.4)] flex items-center justify-center">
            
            {/* Refraction Lens Effect (Clear center, warped/darker edges) */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_100px_rgba(0,0,0,0.8),inset_0_0_30px_rgba(0,0,0,0.6)] pointer-events-none" />

            {/* Blurred grayscale human silhouette (Subtle) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.20] pointer-events-none mix-blend-screen">
               <motion.div 
                className="w-[90%] h-[90%] bg-cover bg-center bg-no-repeat rounded-full blur-[16px]"
                style={{ 
                  x: useTransform(springX, v => v * -0.6), 
                  y: useTransform(springY, v => v * -0.6),
                  backgroundImage: 'url("https://images.unsplash.com/photo-1543327380-fa1fa0a855b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBzaXR0aW5nJTIwYWxvbmUlMjBzaWxob3VldHRlJTIwYmxhY2slMjBhbmQlMjB3aGl0ZXxlbnwxfHx8fDE3NzczNDI4MTN8MA&ixlib=rb-4.1.0&q=80&w=1080")',
                  filter: 'grayscale(100%) contrast(1.1) brightness(0.6)'
                }}
              />
            </div>

            {/* Fluid Distortion / Moving Noise Texture */}
            <motion.div 
              animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%', '50% 0%', '0% 100%', '0% 0%'] 
              }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-50%] w-[200%] h-[200%] opacity-[0.07] mix-blend-overlay pointer-events-none transform -rotate-12"
              style={{ 
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
                backgroundSize: '300px 300px'
              }} 
            />
            
            {/* Soft Moving Highlights (Drifting organically across surface) */}
            <motion.div 
              animate={{ 
                x: ['-20%', '20%', '-10%', '-20%'],
                y: ['-10%', '15%', '20%', '-10%'],
                scale: [1, 1.1, 0.9, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-full pointer-events-none mix-blend-screen opacity-50"
            >
              <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_60%)] blur-[24px]" />
              <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.04)_0%,transparent_60%)] blur-[20px]" />
            </motion.div>

            {/* Irregular Edge Rim (Varying Opacity around circumference) */}
            <div className="absolute inset-0 rounded-full pointer-events-none">
              <motion.div 
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-white/5 border-t-white/20 border-l-white/10 border-b-transparent opacity-80"
              />
              <motion.div 
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-transparent border-r-[#8B5CF6]/30 border-b-[#8B5CF6]/10 opacity-60"
              />
              {/* Static subtle base border so it never fully vanishes */}
              <div className="absolute inset-0 rounded-full border-[1px] border-white/[0.04]" />
            </div>

            {/* Interactive Cursor Light (Extremely Faint) */}
            <motion.div 
              style={{ background: reflectionBg }}
              className="absolute inset-0 mix-blend-screen pointer-events-none opacity-40"
            />
          </div>
        </motion.div>
      </div>

      {/* Cinematic Content - Centered with Subtle Asymmetry */}
      <div className="relative z-10 w-full px-8 md:px-12 flex flex-col items-center justify-center text-center mt-4">
        
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 0.8, ease }}
          className="flex items-center gap-8 mb-16 md:mb-20"
        >
          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#8B5CF6]/30" />
          <span className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-white/70 font-medium">
            Smaran Prakash Jani
          </span>
          <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#8B5CF6]/30" />
        </motion.div>

        {/* Master Headline - Elegant sizing with subtle layout shift */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 1.2, ease }}
          className="relative py-4 flex flex-col items-center pointer-events-none"
        >
          {/* Darkened background layer specifically behind the text to enhance contrast */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[160%] bg-[radial-gradient(ellipse_at_center,rgba(3,3,3,0.6)_0%,transparent_70%)] pointer-events-none -z-10 blur-xl" />

          {/* Subtle Asymmetric Shift on "Intelligence" */}
          <h1 className="relative z-10 text-5xl md:text-[6.5rem] lg:text-[8.5rem] font-medium tracking-tight text-white leading-[1.05] select-none flex flex-col items-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            <span className="block pr-0 md:pr-12 lg:pr-24 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">Architecting</span>
            <span className="block pl-0 md:pl-12 lg:pl-24 text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/60 pb-4 drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">
               Intelligence.
            </span>
          </h1>
        </motion.div>

        {/* Supporting Poetry - Deepened emotional identity */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.8, ease }}
          className="max-w-2xl mx-auto mt-16 md:mt-20 text-lg md:text-xl text-white/60 font-light tracking-wide leading-[1.8] pointer-events-none"
        >
          We give machines the capability to reason. <br className="hidden md:block"/>
          It requires human obsession to make them beautiful.
        </motion.p>
      </div>

      {/* Seamless Continuous Boundary Line - Centered */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 2.5, ease }}
        className="absolute bottom-[-125px] md:bottom-[-175px] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center cursor-pointer z-30 group"
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <div className="w-[1px] h-[250px] md:h-[350px] bg-gradient-to-b from-transparent via-white/[0.1] to-transparent relative overflow-hidden group-hover:via-[#8B5CF6]/30 transition-colors duration-500">
          <motion.div
            animate={{ y: ['-200%', '300%'] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-transparent via-[#8B5CF6]/40 to-transparent shadow-[0_0_15px_rgba(139,92,246,0.3)]"
          />
        </div>
        
        {/* Subtle Pulse exactly at section boundary with technical bracket */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-6 h-[1px] bg-[#8B5CF6]/20 absolute" />
          <div className="h-6 w-[1px] bg-[#8B5CF6]/20 absolute" />
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 border border-[#8B5CF6]/50 bg-transparent rounded-full shadow-[0_0_10px_rgba(139,92,246,0.2)]" 
          />
        </div>
      </motion.div>

      {/* Premium Teaser Below Fold - Technical Data */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 3, ease }}
        className="absolute bottom-0 left-0 w-full flex justify-between items-end px-8 md:px-16 pb-12 pointer-events-none z-10"
      >
        <div className="flex flex-col gap-3 opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-[1px] h-[1px] bg-[#8B5CF6]/50" />
            </div>
            <span className="text-[8px] uppercase tracking-[0.3em] font-mono text-white/40">Next.Sequence</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/50 pl-4">01 / The Premise</span>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#8B5CF6]/[0.01] to-transparent pointer-events-none" />
      </motion.div>

    </section>
  );
}
