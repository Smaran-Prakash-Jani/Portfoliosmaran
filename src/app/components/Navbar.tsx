import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import { FileText } from 'lucide-react';
import { scrollToTarget } from '../lib/smoothScroll';

const navLinks = [
  { name: 'About', short: 'About', id: '01', sectionId: 'about' },
  { name: 'Projects', short: 'Work', id: '02', sectionId: 'projects' },
  { name: 'Capabilities', short: 'Skills', id: '03', sectionId: 'capabilities' },
  { name: 'Contact', short: 'Contact', id: '04', sectionId: 'contact' },
];
const home = { name: 'Home', short: 'Home', id: '00', sectionId: '' };

const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
  e.preventDefault();
  scrollToTarget(sectionId);
};

const scrollToTop = (e: React.MouseEvent) => {
  e.preventDefault();
  scrollToTarget(0);
};

const openResume = (e: React.MouseEvent) => {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('open-resume'));
};

const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-white/60" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-white/60" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-white/60" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-white/60" />
  </>
);

export function Navbar() {
  const [activeSection, setActiveSection] = useState('');
  const [open, setOpen] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const blades = useAnimationControls();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    const sections = document.querySelectorAll('section, footer');
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  // The Process interlude belongs to About (01.B)
  const activeIdx = navLinks.findIndex((l) => l.sectionId === (activeSection === 'process' ? 'about' : activeSection));
  const current = activeIdx >= 0 ? navLinks[activeIdx] : home;

  // A shutter "click": the blades close over the rail, the view changes behind them, they open again
  const shutter = (next: boolean) => {
    blades.start({ scaleY: [0, 1, 1, 0], transition: { duration: 0.62, times: [0, 0.32, 0.5, 1], ease: 'easeInOut' } });
    window.setTimeout(() => setOpen(next), 200);
  };

  // Close when clicking elsewhere or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!railRef.current?.contains(e.target as Node)) shutter(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && shutter(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const go = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    if (sectionId) scrollToTarget(sectionId);
    else scrollToTarget(0);
    shutter(false);
  };

  return (
    <>
      {/* Desktop: a glass rail on the right edge. Closed, it focuses on the current section like a
          lens; clicking opens it like a shutter to show every section. */}
      <motion.nav
        aria-label="Sections"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex"
      >
        <div
          ref={railRef}
          className="relative flex flex-col items-center w-14 py-6 overflow-hidden bg-white/[0.06] backdrop-blur-xl backdrop-saturate-150 border border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(255,255,255,0.06),inset_0_0_18px_rgba(196,181,253,0.07),0_0_22px_rgba(139,92,246,0.14),0_12px_32px_rgba(0,0,0,0.45)]"
        >
          {/* glass sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.09] to-transparent" />
          <CornerAccents />

          <a href="#" onClick={(e) => go(e, '')} aria-label="Back to top" className="relative flex flex-col items-center gap-3 group">
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)] group-hover:scale-150 transition-transform duration-500" />
            <span
              className="text-white group-hover:text-white/80 transition-colors font-semibold text-[10px] tracking-[0.3em] uppercase"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              SPJ.
            </span>
          </a>

          <div className="relative w-[1px] h-8 my-4 bg-white/[0.2]" />

          {/* Closed: the reel window shows only where you are */}
          <motion.div
            initial={false}
            animate={open ? { height: 0, opacity: 0 } : { height: 'auto', opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full overflow-hidden"
          >
            <button
              type="button"
              onClick={() => shutter(true)}
              aria-expanded={open}
              aria-label={`Current section: ${current.name}. Show all sections`}
              data-cursor-label="Sections"
              className="group relative flex flex-col items-center gap-3 w-full py-1"
            >
              {/* the section number, seated in a small glass lens with a thin iridescent ring */}
              <span className="iris-lens relative block w-9 h-9">
                <span className="absolute inset-0 overflow-hidden rounded-full">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={current.id}
                      initial={{ y: '110%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={{ y: '-110%', opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                      className="absolute inset-0 flex items-center justify-center font-mono text-[12px] tracking-wider text-[#E9E4FF] drop-shadow-[0_0_6px_rgba(196,181,253,0.6)]"
                    >
                      {current.id}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
              <span className="relative block h-16 w-full overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={current.short}
                    initial={{ y: '60%', opacity: 0 }}
                    animate={{ y: '0%', opacity: 1 }}
                    exit={{ y: '-60%', opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
                    className="absolute inset-0 flex justify-center font-mono text-[9px] tracking-[0.3em] uppercase text-white/80"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    {current.short}
                  </motion.span>
                </AnimatePresence>
              </span>
              {/* where you are among the four */}
              <span className="flex flex-col gap-1">
                {navLinks.map((l, i) => (
                  <span key={l.id} className={`block w-[3px] h-2 transition-colors duration-500 ${i === activeIdx ? 'bg-[#A78BFA] shadow-[0_0_6px_rgba(139,92,246,0.9)]' : 'bg-white/25'}`} />
                ))}
              </span>
            </button>
          </motion.div>

          {/* Open: every section, revealed blade by blade */}
          <motion.div
            initial={false}
            animate={open ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full overflow-hidden"
          >
            <div className="flex flex-col items-center gap-6 py-1">
              {navLinks.map((link, i) => {
                const isActive = i === activeIdx;
                return (
                  <motion.a
                    key={link.name}
                    href={`#${link.sectionId}`}
                    onClick={(e) => go(e, link.sectionId)}
                    aria-label={link.name}
                    title={link.name}
                    aria-current={isActive ? 'location' : undefined}
                    tabIndex={open ? 0 : -1}
                    initial={false}
                    animate={open ? { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 } : { clipPath: 'inset(50% 0% 50% 0%)', opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1], delay: open ? 0.12 + Math.abs(i - Math.max(activeIdx, 0)) * 0.06 : 0 }}
                    className="group relative flex items-center justify-center w-8 py-2"
                  >
                    {isActive && (
                      <span className="absolute top-1/2 -translate-y-1/2 -right-[13px] flex items-center pointer-events-none">
                        <span className="text-[#8B5CF6] text-[14px] font-light drop-shadow-[0_0_10px_rgba(139,92,246,1)] -mr-1 z-10">‹</span>
                        <span className="w-[1.5px] h-7 bg-gradient-to-b from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_12px_rgba(139,92,246,0.8)] rounded-full" />
                      </span>
                    )}
                    <span
                      className={`transition-all duration-500 text-[10px] font-mono tracking-wider ${
                        isActive ? 'text-[#C4B5FD] drop-shadow-[0_0_8px_rgba(139,92,246,0.7)]' : 'text-white/75 group-hover:text-white'
                      }`}
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {link.id}
                    </span>
                  </motion.a>
                );
              })}

              <div className="w-[1px] h-6 bg-white/[0.2]" />
              <a
                href="#resume"
                onClick={(e) => {
                  openResume(e);
                  shutter(false);
                }}
                aria-label="Open resume"
                title="Resume"
                tabIndex={open ? 0 : -1}
                className="group flex flex-col items-center gap-2 text-white/75 hover:text-[#C4B5FD] transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="font-mono text-[9px] tracking-[0.25em]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  CV
                </span>
              </a>
            </div>
          </motion.div>

          {/* shutter blades */}
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            animate={blades}
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 origin-top bg-[#0d0a16]/90 backdrop-blur-md border-b border-white/30"
          />
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            animate={blades}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-[#0d0a16]/90 backdrop-blur-md border-t border-white/30"
          />
        </div>
      </motion.nav>

      {/* Mobile: compact bar along the bottom so it never covers the text */}
      <motion.nav
        aria-label="Sections"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="fixed bottom-4 inset-x-0 z-50 flex justify-center md:hidden pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center gap-1 pl-4 pr-2 bg-white/[0.07] backdrop-blur-xl backdrop-saturate-150 border border-white/[0.18] relative shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_0_18px_rgba(196,181,253,0.07),0_0_20px_rgba(139,92,246,0.14),0_12px_32px_rgba(0,0,0,0.5)]">
          <CornerAccents />

          <a
            href="#"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="flex items-center gap-2 pr-3 py-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)]" />
            <span className="text-white font-semibold text-[10px] tracking-[0.3em] uppercase">SPJ.</span>
          </a>

          <div className="h-5 w-[1px] bg-white/[0.15] mr-1" />

          {navLinks.map((link) => {
            const isActive = activeSection === link.sectionId;
            return (
              <a
                key={link.name}
                href={`#${link.sectionId}`}
                onClick={(e) => scrollToSection(e, link.sectionId)}
                aria-label={link.name}
                aria-current={isActive ? 'location' : undefined}
                className="relative flex items-center justify-center w-11 h-11"
              >
                {isActive && (
                  <motion.div
                    layoutId="cyberPointerMobile"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[1.5px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_12px_rgba(139,92,246,0.8)] rounded-full pointer-events-none"
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  />
                )}
                <span
                  className={`transition-colors duration-500 text-[11px] font-mono tracking-wider ${
                    isActive ? 'text-[#A78BFA] drop-shadow-[0_0_8px_rgba(139,92,246,0.7)]' : 'text-white/75'
                  }`}
                >
                  {link.id}
                </span>
              </a>
            );
          })}

          <div className="h-5 w-[1px] bg-white/[0.15] mx-1" />
          <a href="#resume" onClick={openResume} aria-label="Open resume" className="flex items-center justify-center w-11 h-11 text-white/75">
            <FileText className="w-4 h-4" />
          </a>
        </div>
      </motion.nav>
    </>
  );
}
