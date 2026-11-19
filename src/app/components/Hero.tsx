import React, { useRef } from 'react';
import { motion, useTransform, useMotionValue, useSpring, useMotionTemplate } from 'motion/react';
import sphereVideo from "../../imports/37a7390a12291015429da39931bf1e58.mp4";
import { WormholeTunnel } from './fx/WormholeTunnel';
import { BlurText, ScrambleText } from './fx/TextFx';
import { scrollToTarget } from '../lib/smoothScroll';
import { useScrollProgress } from '../lib/useScrollProgress';
import { useSiteReady } from '../lib/boot';

export function Hero() {
  // Ultra-premium buttery easing curve
  const ease = [0.22, 1, 0.36, 1];
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // The hero is pinned while you scroll through it: 0 = top, 1 = released.
  // Scrolling dives the camera into the vortex while the headline and sphere dissolve.
  const scrollYProgress = useScrollProgress(sectionRef, 'pin');
  // the headline's intro replays when the loading screen lifts, so it's seen
  const ready = useSiteReady();
  const intro = ready ? 'shown' : 'loading';
  const textOpacity = useTransform(scrollYProgress, [0.02, 0.4], [1, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.25]);
  const textBlur = useTransform(scrollYProgress, [0.02, 0.4], [0, 16]);
  const textFilter = useTransform(textBlur, (v) => (v < 0.05 ? 'none' : `blur(${v}px)`));
  const sphereScale = useTransform(scrollYProgress, [0, 0.85], [1, 2.6]);
  const sphereOpacity = useTransform(scrollYProgress, [0.2, 0.62], [1, 0]);
  const sphereBlur = useTransform(scrollYProgress, [0.2, 0.62], [0, 3]);
  const sphereFilter = useTransform(sphereBlur, (v) => (v < 0.05 ? 'none' : `blur(${v}px)`));
  const hudOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  // The fall ends when the tunnel's exit hole opens; the canvas then fades to the star dust behind the page
  const canvasFade = useTransform(scrollYProgress, [0.84, 1], [1, 0]);
  // once the tunnel has opened onto the portrait page, let the mouse reach it
  const heroPointer = useTransform(scrollYProgress, (v) => (v > 0.97 ? 'none' : 'auto'));

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
      ref={sectionRef}
      className="relative z-20 h-[170svh] md:h-[190svh] w-full"
    >
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ pointerEvents: heroPointer }}
      className="sticky top-0 h-svh w-full flex items-center justify-center overflow-hidden"
    >

      {/*
        The Containment Sphere / Cinematic Background
      */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">

        {/* Falling through a tunnel of light (WebGL); fades out at the end, revealing the star dust behind the page */}
        <motion.div className="absolute inset-0" style={{ opacity: canvasFade }}>
          <WormholeTunnel
            progress={scrollYProgress}
            clearCentre
            className="absolute inset-0 w-full h-full"
          />
          {/* film grain and a lens vignette: a photographic finish over the light */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
        </motion.div>


        <motion.div className="absolute inset-0" style={{ opacity: hudOpacity }}>
        {/* Ambient Left-Side HUD Frame */}
        <div className="absolute top-0 bottom-0 left-0 w-32 pointer-events-none z-10 hidden md:block">
          <div className="absolute top-0 bottom-0 left-4 md:left-8 w-[1px] bg-gradient-to-b from-transparent via-white/[0.5] to-transparent" />
          
          <div className="absolute top-32 left-8 md:left-12 flex flex-col gap-1.5 opacity-100">
            <span className="font-mono text-[8px] md:text-[9px] text-white tracking-widest uppercase">SYS.CAL</span>
            <span className="font-mono text-[7px] md:text-[8px] text-white/90 tracking-wider">SEC: ALPHA</span>
            <div className="flex gap-1 mt-1">
              <div className="w-4 h-[1px] bg-white/80" />
              <div className="w-2 h-[1px] bg-white/60" />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            transition={{ 
              opacity: { duration: 3, ease: "easeOut" },
              y: { duration: 15, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-1/2 -translate-y-1/2 left-8 md:left-12 w-8 md:w-12 flex flex-col gap-4 border-l-[1px] border-white/40 pl-3 py-2"
          >
            <span className="font-mono text-[7px] md:text-[8px] text-white tracking-[0.3em] uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
              ID_7X
            </span>
            <div className="flex flex-col gap-[2px] w-full mt-2 opacity-80">
              {[1, 3, 2, 4, 1, 2, 1, 5, 2].map((width, i) => (
                <div key={i} className="h-[1px] bg-white/90" style={{ width: `${width * 20}%` }} />
              ))}
            </div>
            <span className="font-mono text-[6px] md:text-[7px] text-white/70 tracking-wider mt-2 rotate-180" style={{ writingMode: 'vertical-rl' }}>
              ACTV
            </span>
            <div className="absolute -top-1 -left-1 w-2 h-2 border-l-[1px] border-t-[1px] border-white/60" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-[1px] border-b-[1px] border-white/60" />
          </motion.div>

          {/* Floating minimal particles */}
          <div className="absolute inset-0 overflow-hidden opacity-80">
            <motion.div animate={{ y: ['0vh', '-100vh'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="absolute top-[100%] left-[22px] md:left-[38px] w-[1.5px] h-[1.5px] bg-white/40 rounded-full" />
            <motion.div animate={{ y: ['0vh', '-100vh'] }} transition={{ duration: 55, repeat: Infinity, ease: 'linear', delay: 5 }} className="absolute top-[100%] left-[10px] md:left-[18px] w-[1px] h-[1px] bg-white/30 rounded-full" />
          </div>

          <div className="absolute bottom-32 left-4 md:left-8 w-6 h-6 border-l-[1px] border-b-[1px] border-white/60 opacity-100" />
          <span className="absolute bottom-32 left-12 md:left-16 mb-[-3px] font-mono text-[7px] md:text-[8px] text-white/90 tracking-widest">MEM_BANK.L</span>
        </div>

        {/* Cyberpunk Tracking Markers - Made more prominent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1200px] max-h-[800px] pointer-events-none opacity-[0.7] md:opacity-[0.85] flex items-center justify-center">
          <div className="absolute top-24 w-[calc(100%-8rem)] hidden md:flex justify-between">
            <div className="relative w-[1px] h-8 bg-white/50">
              <motion.div animate={{ height: ['0%', '100%'], opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute top-0 -left-[1px] w-[2px] bg-[#8B5CF6]/80" />
            </div>
            <div className="relative w-[1px] h-8 bg-white/50">
              <motion.div animate={{ height: ['0%', '100%'], opacity: [0, 1, 0] }} transition={{ duration: 3, delay: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 -left-[1px] w-[2px] bg-[#8B5CF6]/80" />
            </div>
          </div>
          <div className="absolute bottom-12 md:bottom-24 w-[calc(100%-4rem)] md:w-[calc(100%-8rem)] flex justify-between items-end">
            <div className="w-[1px] h-8 bg-white/50 relative">
              <motion.div animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute -bottom-4 -left-1.5 w-3 h-3 border-[1px] border-white/60" />
            </div>
            <div className="w-[1px] h-8 bg-white/50 relative">
              <motion.div animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute -bottom-4 -left-1.5 w-3 h-3 border-[1px] border-white/60" />
            </div>
          </div>
          
          <div className="absolute left-8 md:left-16 h-[calc(100%-8rem)] md:h-[calc(100%-16rem)] flex flex-col justify-between">
            <div className="w-6 h-[1px] bg-white/50" />
            <div className="w-6 h-[1px] bg-white/50" />
          </div>
          <div className="absolute right-8 md:right-16 h-[calc(100%-8rem)] md:h-[calc(100%-16rem)] flex flex-col justify-between items-end">
            <div className="w-6 h-[1px] bg-white/50 relative">
              <motion.div animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -top-3 -right-0 w-1.5 h-1.5 bg-[#8B5CF6]/80 rounded-full" />
            </div>
            <div className="w-6 h-[1px] bg-white/50 relative">
              <motion.div animate={{ opacity: [0.2, 0.9, 0.2] }} transition={{ duration: 5, delay: 2, repeat: Infinity, ease: "linear" }} className="absolute -top-3 -right-0 w-1.5 h-1.5 bg-white/80 rounded-full" />
            </div>
          </div>
          
          <motion.div 
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-4"
          >
            <div className="w-1.5 h-1.5 border-[1px] border-[#8B5CF6]/80 rounded-full flex items-center justify-center">
              <div className="w-[1px] h-[1px] bg-[#8B5CF6]" />
            </div>
            <span className="font-mono text-[9px] text-[#8B5CF6]/90 tracking-[0.25em]">SYS.OP_01</span>
            <div className="w-12 h-[1px] bg-white/40 relative overflow-hidden">
              <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-1/3 h-full bg-[#8B5CF6]/70" />
            </div>
          </motion.div>
        </div>
        </motion.div>

        {/* Sphere group: screen-blended onto the vortex so its black background disappears,
            and pushed towards the camera as you scroll */}
        <motion.div
          className="relative flex items-center justify-center mix-blend-screen pointer-events-none"
          style={{ scale: sphereScale, opacity: sphereOpacity, filter: sphereFilter }}
        >
        {/* The Liquid Film Membrane */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3, ease: ease }}
          style={{ 
             // Very subtle delay following cursor
             x: useTransform(springX, v => v * 0.15), 
             y: useTransform(springY, v => v * 0.15),
             perspective: 1000
          }}
          className="relative w-[340px] h-[340px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px] flex items-center justify-center pointer-events-none"
        >
          {/* Metallic Sphere Video */}
          <motion.div
            animate={{ 
              y: [-15, 15, -15],
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            style={{
              rotateX: useTransform(springY, v => v * -0.04),
              rotateY: useTransform(springX, v => v * 0.04),
            }}
            className="relative w-full h-full flex items-center justify-center pointer-events-none"
          >
            <video 
              src={sphereVideo} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-contain mix-blend-screen" 
            />
          </motion.div>

          {/* Orbital Space Station */}
          <motion.div
            animate={{ rotateZ: [0, 360] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 w-[125%] h-[125%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
            style={{
              // Give the orbit path some 3D tilt that shifts with the cursor
              rotateX: useTransform(springY, v => 60 + v * 0.2), 
              rotateY: useTransform(springX, v => v * 0.2),
              transformStyle: "preserve-3d"
            }}
          >
            {/* Faint orbital track */}
            <div className="absolute inset-0 rounded-full border-[1px] border-dashed border-white/[0.08]" />
            
            {/* The Space Station positioned on the track */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div 
                // Counter-rotate the station on the X axis to keep it facing the camera despite the tilted orbit
                style={{
                  rotateX: useTransform(springY, v => -60 - v * 0.2)
                }}
                className="relative flex items-center justify-center w-8 h-8"
              >
                <motion.div
                   animate={{ rotateZ: [0, -360] }}
                   transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                   className="relative flex items-center justify-center"
                >
                  {/* Core */}
                  <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.9),0_0_20px_rgba(139,92,246,0.6)] z-10" />
                  
                  {/* Solar Panels & Structure */}
                  <div className="absolute w-10 h-[1px] bg-white/60" />
                  <div className="absolute w-[1px] h-6 bg-white/30" />
                  <div className="absolute -left-3 w-3 h-1.5 border border-[#8B5CF6]/80 bg-[#030303]" />
                  <div className="absolute -right-3 w-3 h-1.5 border border-[#8B5CF6]/80 bg-[#030303]" />
                  
                  {/* Connecting Antenna */}
                  <div className="absolute top-1 w-[1px] h-3 bg-white/50" />
                  
                  {/* Blinking Beacon */}
                  <motion.div 
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 w-0.5 h-0.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,1)]"
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

        </motion.div>
        </motion.div>
      </div>

      {/* Cinematic Content - Centered with Subtle Asymmetry; dissolves into blur on scroll */}
      <motion.div
        key={intro}
        style={{ opacity: textOpacity, scale: textScale, filter: textFilter }}
        className="relative z-10 w-full px-8 md:px-12 flex flex-col items-center justify-center text-center mt-4"
      >

        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 0.8, ease }}
          className="flex items-center gap-3 md:gap-8 mb-10 md:mb-20"
        >
          <div className="w-6 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#8B5CF6]/30" />
          <ScrambleText
            text="Smaran Prakash Jani"
            playOn="mount"
            delay={0.9}
            className="text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] whitespace-nowrap text-white/70 font-medium"
          />
          <div className="w-6 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#8B5CF6]/30" />
        </motion.div>

        {/* Master Headline - Perfectly symmetrical, elegant sizing within the bubble */}
        <div className="relative py-4 flex flex-col items-center pointer-events-none">
          {/* Darkened background layer specifically behind the text to enhance contrast */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[160%] bg-[radial-gradient(ellipse_at_center,rgba(3,3,3,0.6)_0%,transparent_70%)] pointer-events-none -z-10 blur-xl" />

          {/* Symmetrical, properly scaled, without rotation to ensure balance */}
          <h1 className="relative z-10 select-none flex flex-col items-center drop-shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
            {/* The script word is "written" left to right out of a blur */}
            <span className="block font-['Pinyon_Script'] text-6xl md:text-[7rem] lg:text-[8.5rem] font-normal text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2 md:mb-4 z-10">
              <motion.span
                initial={{ clipPath: 'inset(0% 100% 0% 0%)', filter: 'blur(10px)', opacity: 0 }}
                animate={{ clipPath: 'inset(0% 0% 0% 0%)', filter: 'blur(0px)', opacity: 1 }}
                transition={{ duration: 2.4, delay: 1.1, ease }}
                className="inline-block px-[0.4em] -mx-[0.4em] py-[0.2em] -my-[0.2em]"
              >
                Architecting
              </motion.span>
            </span>
            <BlurText
              text="Intelligence"
              split="chars"
              playOn="mount"
              delay={1.8}
              stagger={0.055}
              duration={1.3}
              className="block font-['Montserrat'] text-[clamp(1.5rem,8.4vw,2.5rem)] md:text-[clamp(3.5rem,7vw,5.5rem)] font-extrabold uppercase tracking-[0.15em] text-white/95 leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] pl-[0.15em]"
            />
          </h1>
        </div>

        {/* Supporting Poetry - Deepened emotional identity */}
        <p className="max-w-2xl mx-auto mt-16 md:mt-20 text-lg md:text-xl text-white/60 font-light tracking-wide leading-[1.8] pointer-events-none">
          <BlurText
            playOn="mount"
            delay={2.6}
            stagger={0.045}
            text={'We give machines the capability to reason.\nIt requires human obsession to make them beautiful.'}
          />
        </p>
      </motion.div>

      {/* Seamless Continuous Boundary Line - Centered */}
      <motion.div
        key={`line-${intro}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 2.5, ease }}
        className="absolute bottom-[-175px] left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center justify-center cursor-pointer z-30 group"
        onClick={() => scrollToTarget('about')}
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
        key={`teaser-${intro}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, delay: 3, ease }}
        className="absolute bottom-0 left-0 w-full hidden md:flex justify-between items-end px-16 pb-12 pointer-events-none z-10"
      >
        <div className="flex flex-col gap-3 opacity-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 border border-white/50 rounded-full flex items-center justify-center">
              <div className="w-[1px] h-[1px] bg-[#A78BFA]" />
            </div>
            <span className="text-[8px] uppercase tracking-[0.3em] font-mono text-white/70">Next.Sequence</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-white/80 pl-4">01 / The Premise</span>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#8B5CF6]/[0.01] to-transparent pointer-events-none" />
      </motion.div>


    </motion.div>
    </section>
  );
}
