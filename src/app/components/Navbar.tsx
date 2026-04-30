import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function Navbar() {
  const [activeSection, setActiveSection] = useState('');

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

  const navLinks = [
    { name: 'About', id: '01', href: '#about', sectionId: 'about' },
    { name: 'Projects', id: '02', href: '#projects', sectionId: 'projects' },
    { name: 'Experience', id: '03', href: '#capabilities', sectionId: 'capabilities' },
    { name: 'Contact', id: '04', href: '#contact', sectionId: 'contact' },
  ];

  return (
    <motion.nav 
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex"
    >
      <div className="flex flex-col items-center gap-6 py-8 px-3 bg-[#0a0a0a]/40 backdrop-blur-3xl border border-white/[0.05] relative shadow-[0_16px_40px_rgba(0,0,0,0.8)]">
        
        {/* Technical Corner Accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-white/30" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-white/30" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-white/30" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-white/30" />
        
        {/* Segmented Track Line - Background */}
        <div className="absolute right-[2px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-transparent via-white/[0.05] to-transparent pointer-events-none" />
        <div className="absolute right-[4px] top-1/2 -translate-y-1/2 flex flex-col gap-[2px] opacity-20 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="w-[2px] h-[1px] bg-white" />
          ))}
        </div>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="flex flex-col items-center gap-3 mb-4 group"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)] group-hover:scale-150 transition-transform duration-500" />
          <span 
            className="text-white group-hover:text-white/80 transition-colors font-semibold text-[10px] tracking-[0.3em] uppercase" 
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            SPJ.
          </span>
        </a>
        
        <div className="w-[1px] h-10 bg-white/[0.15]" />
        
        <div className="flex flex-col items-center gap-8 mt-4 relative w-full">
          {navLinks.map((link) => {
            const isActive = activeSection === link.sectionId;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(link.sectionId)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group relative flex items-center justify-center w-8 py-3"
              >
                {/* Cyberpunk Scanner Pointer (Outer Right Edge) */}
                {isActive && (
                  <motion.div
                    layoutId="cyberPointer"
                    className="absolute top-1/2 -translate-y-1/2 -right-[15px] flex items-center pointer-events-none"
                    transition={{ type: "spring", stiffness: 350, damping: 35 }}
                  >
                    <span className="text-[#8B5CF6] text-[14px] font-light drop-shadow-[0_0_10px_rgba(139,92,246,1)] -mr-1 z-10">
                      ‹
                    </span>
                    <div className="w-[1.5px] h-8 bg-gradient-to-b from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_12px_rgba(139,92,246,0.8)] rounded-full" />
                  </motion.div>
                )}
                
                {/* Number Indicator */}
                <span 
                  className={`transition-all duration-500 text-[10px] font-mono tracking-wider z-10 ${
                    isActive ? 'text-[#8B5CF6] drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'text-white/30 group-hover:text-white/70'
                  }`} 
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  {link.id}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
