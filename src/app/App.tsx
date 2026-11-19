import React, { useEffect, useState } from 'react';
import { motion, MotionConfig, useMotionValue, useTransform } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Process } from './components/Process';
import { Projects } from './components/Projects';
import { Capabilities } from './components/Capabilities';
import { Footer } from './components/Footer';

import { GhostUI } from './components/GhostUI';
import { SystemResumePanel } from './components/SystemResumePanel';
import { MenuOverlay } from './components/MenuOverlay';
import TargetCursor from './components/reactbits/TargetCursor';
import { Portrait } from './components/Portrait';
import { StarDust } from './components/fx/StarDust';
import { MarqueeBand } from './components/MarqueeBand';
import { LoadingScreen } from './components/LoadingScreen';
import { initSmoothScroll, setSmoothScrollPaused } from './lib/smoothScroll';

// The page itself never depends on the menu / resume state, so opening either one doesn't
// re-render every section (that alone cost a visible hitch on the click)
const Page = React.memo(function Page() {
  return (
    <>
      <main className="flex flex-col w-full">
        <Hero />
        <Portrait />
        <About />
        <Process />
        <Projects />
        <MarqueeBand />
        <Capabilities />
      </main>
      <Footer />
    </>
  );
});
const StaticGhostUI = React.memo(GhostUI);
const StaticNavbar = React.memo(Navbar);
const StaticStarDust = React.memo(StarDust);
const StaticCursor = React.memo(function StaticCursor() {
  return (
    <TargetCursor
      targetSelector="a, button, [data-cursor-label], .cursor-target"
      spinDuration={2.6}
      hideDefaultCursor
      cursorColor="#ffffff"
      cursorColorOnTarget="#c4b5fd"
      size={30}
      cornerSize={10}
      thickness={2}
      padding={7}
    />
  );
});

export default function App() {
  // The glow is painted once and moved with a transform, so mouse moves never repaint the page
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const glowX = useTransform(mouseX, (v) => v - 800);
  const glowY = useTransform(mouseY, (v) => v - 800);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeResume = React.useCallback(() => setIsResumeOpen(false), []);
  // the loader lifts first (the page becomes scrollable), then unmounts once the butterfly has flown off
  const [loading, setLoading] = useState(true);
  const [booting, setBooting] = useState(true);
  const revealed = React.useCallback(() => setLoading(false), []);
  // the loading screen paints (and its butterfly starts) first; the page is built behind it a
  // couple of frames later, so that heavy first build never delays the loader appearing
  const [pageMounted, setPageMounted] = useState(false);
  useEffect(() => {
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setPageMounted(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const booted = React.useCallback(() => setBooting(false), []);

  // Inertia scrolling for the whole page; paused while the resume panel or the menu is open
  useEffect(() => initSmoothScroll(), []);
  useEffect(() => setSmoothScrollPaused(loading || isResumeOpen || isMenuOpen), [loading, isResumeOpen, isMenuOpen]);
  // The resume panel covers the whole page, so the WebGL scenes behind it can stop rendering
  useEffect(() => {
    window.dispatchEvent(new CustomEvent<boolean>('site-overlay', { detail: isResumeOpen }));
  }, [isResumeOpen]);

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
    <MotionConfig reducedMotion="user">
    {booting && <LoadingScreen onReveal={revealed} onDone={booted} />}
    <div className="min-h-screen bg-[#030303] text-[#E5E5E5] selection:bg-white/20 selection:text-white font-sans overflow-x-clip antialiased">
      {/* Global Mouse Glow Effect - Ultra Subtle */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-0 w-[1600px] h-[1600px] rounded-full will-change-transform"
        style={{ x: glowX, y: glowY, background: 'radial-gradient(800px circle at center, rgba(255, 255, 255, 0.03), transparent 40%)' }}
      />
      
      {/* Cinematic Film Grain */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Star dust: drifts with parallax, streaks when you scroll fast */}
      <StaticStarDust className="pointer-events-none fixed inset-0 z-0 w-full h-full" />

      {/* Engineering Dot Grid */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.25]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}
      />

      {/* Global Boundary Lines */}
      <div className="pointer-events-none fixed inset-0 z-0 flex justify-between px-4 md:px-12 opacity-80">
        <div className="w-[1px] h-full bg-white/[0.06] relative">
          <div className="absolute top-[20%] -left-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[40%] -left-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[60%] -left-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[80%] -left-1 w-2 h-[1px] bg-white/20" />
        </div>
        <div className="w-[1px] h-full bg-white/[0.06] relative">
          <div className="absolute top-[20%] -right-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[40%] -right-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[60%] -right-1 w-2 h-[1px] bg-white/20" />
          <div className="absolute top-[80%] -right-1 w-2 h-[1px] bg-white/20" />
        </div>
      </div>

      <div className="relative z-10 w-full">
        <StaticGhostUI />
        <SystemResumePanel isOpen={isResumeOpen} onClose={closeResume} />
        <StaticNavbar />
        {/* Bracket cursor: locks onto links, buttons and anything with a data-cursor-label */}
        <StaticCursor />
        <MenuOverlay open={isMenuOpen} onOpenChange={setIsMenuOpen} />
        {pageMounted && <Page />}
      </div>
    </div>
    </MotionConfig>
  );
}
