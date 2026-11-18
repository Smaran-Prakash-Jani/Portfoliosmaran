import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Projects } from './components/Projects';
import { Capabilities } from './components/Capabilities';
import { Footer } from './components/Footer';

import { GhostUI } from './components/GhostUI';
import { SystemResumePanel } from './components/SystemResumePanel';

export default function App() {
  // Motion values update the glow directly, without re-rendering the whole page on every mouse move
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const glowBackground = useMotionTemplate`radial-gradient(800px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 0.03), transparent 40%)`;
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsResumeOpen(true);
    const handleClose = () => setIsResumeOpen(false);
    window.addEventListener('open-resume', handleOpen);
    window.addEventListener('close-resume', handleClose);
    return () => {
      window.removeEventListener('open-resume', handleOpen);
      window.removeEventListener('close-resume', handleClose);
    };
  }, []);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener('mousemove', updateMousePosition, { passive: true });
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-[#030303] text-[#E5E5E5] selection:bg-white/20 selection:text-white font-sans overflow-x-hidden antialiased">
      {/* Global Mouse Glow Effect - Ultra Subtle */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500 opacity-100"
        style={{ background: glowBackground }}
      />
      
      {/* Cinematic Film Grain */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.015] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Engineering Dot Grid */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}
      />

      {/* Global Boundary Lines */}
      <div className="pointer-events-none fixed inset-0 z-0 flex justify-between px-4 md:px-12 opacity-40">
        <div className="w-[1px] h-full bg-white/[0.03] relative">
          <div className="absolute top-[20%] -left-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[40%] -left-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[60%] -left-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[80%] -left-1 w-2 h-[1px] bg-white/20" />
        </div>
        <div className="w-[1px] h-full bg-white/[0.03] relative">
          <div className="absolute top-[20%] -right-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[40%] -right-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[60%] -right-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[80%] -right-1 w-2 h-[1px] bg-white/20" />
        </div>
      </div>

      <div className="relative z-10 w-full">
        <GhostUI />
        <SystemResumePanel isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />
        <Navbar />
        <main className="flex flex-col w-full">
          <Hero />
          <About />
          <Projects />
          <Capabilities />
        </main>
        <Footer />
      </div>
    </div>
  );
}
