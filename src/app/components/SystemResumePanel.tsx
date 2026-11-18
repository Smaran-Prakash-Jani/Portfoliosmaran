import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import sphereVideo from "../../imports/37a7390a12291015429da39931bf1e58.mp4";

interface SystemResumePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemResumePanel({ isOpen, onClose }: SystemResumePanelProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 1. Backdrop Dimming */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-[#030303]/90 backdrop-blur-md"
          />

          {/* 2. Panel Formation Container */}
          <div className="relative w-[90vw] max-w-5xl h-[85vh] flex flex-col z-20">
            
            {/* -- Frame Building Borders -- */}
            {/* Center horizontal line (expands left/right) */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: [0, 1, 1, 0] }}
              transition={{ 
                width: { duration: 0.2, delay: 0.1, ease: "linear" },
                opacity: { times: [0, 0.1, 0.9, 1], duration: 0.4, delay: 0.1 } 
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1px] bg-white z-20"
            />

            {/* Left vertical edge */}
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "100%", opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3, ease: "linear" }}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] bg-white/20 z-20"
            />

            {/* Right vertical edge */}
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "100%", opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3, ease: "linear" }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] bg-white/20 z-20"
            />

            {/* Top horizontal edge */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.5, ease: "linear" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] bg-white/20 z-20"
            />

            {/* Bottom horizontal edge */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.5, ease: "linear" }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] bg-white/20 z-20"
            />

            {/* Cyberpunk Corners */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.7, ease: "easeOut" }}
              className="absolute inset-0 pointer-events-none z-30"
            >
              <div className="absolute top-0 left-0 w-6 h-6 border-t-[1px] border-l-[1px] border-white/60" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-[1px] border-r-[1px] border-white/60" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[1px] border-l-[1px] border-white/60" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[1px] border-r-[1px] border-white/60" />
            </motion.div>

            {/* Panel Background (fades in last) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              className="absolute inset-0 bg-black/60 z-10 shadow-[0_0_60px_rgba(0,0,0,0.8)] pointer-events-none"
            >
              {/* Subtle panel inner grid */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
            </motion.div>
            
            {/* 3. Content Reveal Container */}
            <div className="relative z-40 flex flex-col h-full w-full overflow-hidden">
              {/* Header Bar */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.1, ease: "linear" }}
                className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0 bg-black/40"
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                    <span className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
                      STATUS: ACTIVE
                    </span>
                  </div>
                  <div className="hidden md:block w-px h-4 bg-white/20" />
                  <span className="hidden md:block font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase">
                    SYS.ID: SPJ_INDEX
                  </span>
                </div>
                
                <button
                  onClick={onClose}
                  className="group flex items-center gap-3 hover:bg-white/[0.03] px-3 py-1.5 transition-colors border border-transparent hover:border-white/10"
                >
                  <span className="font-mono text-[10px] tracking-[0.2em] text-white/50 group-hover:text-white transition-colors uppercase">
                    CLOSE_SYS
                  </span>
                  <div className="relative w-4 h-4 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <div className="absolute w-[1px] h-full bg-white rotate-45" />
                    <div className="absolute w-[1px] h-full bg-white -rotate-45" />
                  </div>
                </button>
              </motion.div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-8 md:p-12 custom-scrollbar">
                <div className="max-w-4xl mx-auto flex flex-col gap-16">
                  
                  {/* Profile Header */}
                  <motion.div 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.2, ease: "linear" }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
                  >
                    <div className="flex flex-col gap-2 flex-1">
                      <h1 className="text-3xl md:text-5xl font-light tracking-[0.1em] text-white uppercase">
                        Smaran Prakash Jani
                      </h1>
                      <h2 className="text-sm md:text-base tracking-[0.3em] text-[#8B5CF6] uppercase">
                        Founder / Technologist
                      </h2>
                      <p className="mt-4 max-w-2xl text-xs md:text-sm text-white/50 font-mono leading-relaxed uppercase relative group">
                        <span className="absolute -left-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#8B5CF6]">_</span>
                        &gt; Specialized in crafting high-end digital experiences, merging visionary design with robust engineering architectures.
                      </p>
                    </div>
                    
                    <div className="relative w-40 h-40 shrink-0 overflow-hidden pointer-events-none opacity-50">
                      <video 
                        src={sphereVideo} 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-contain mix-blend-screen" 
                      />
                    </div>
                  </motion.div>

                  {/* Grid Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    
                    {/* Left Column: Experience */}
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.1, duration: 0.2, ease: "linear" }}
                      className="flex flex-col gap-8"
                    >
                      <div className="flex items-center gap-4 border-b border-white/10 pb-4 relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#8B5CF6]/50 to-transparent scale-x-0 animate-[scan_2s_ease-out_infinite]" />
                        <span className="font-mono text-[10px] text-white/30 tracking-[0.2em]">01 //</span>
                        <h3 className="text-[12px] uppercase tracking-[0.3em] text-white/80">Experience Node</h3>
                      </div>
                      
                      <div className="flex flex-col gap-8 border-l border-white/5 pl-4">
                        {[
                          { year: "2026—PRES", role: "Full-Stack Developer", corp: "CRM TECHNOLOGY · FREELANCE", desc: "Designed and built the company's own commerce platform to replace their Shopify store: storefront, dealer portal, quotes and PDF invoices, PC builder and a 2FA-secured admin. Live in production." },
                          { year: "2025", role: "Cyber Security Intern", corp: "CODEALPHA", desc: "Built a Python password-strength checker and a socket-based port scanner, and wrote a security-awareness report on phishing and malware." }
                        ].map((item, idx) => (
                          <div key={idx} className="group relative flex flex-col gap-2">
                            <div className="absolute -left-[21px] top-1.5 w-[9px] h-[1px] bg-white/20 group-hover:bg-[#8B5CF6] transition-colors" />
                            <div className="absolute -left-[21px] top-1 w-1 h-1 bg-white/40 group-hover:bg-[#8B5CF6] transition-colors rounded-full shadow-[0_0_8px_rgba(139,92,246,0)] group-hover:shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                            
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] text-white uppercase tracking-widest">{item.role}</span>
                              <span className="font-mono text-[9px] text-white/40 tracking-widest">{item.year}</span>
                            </div>
                            <span className="font-mono text-[10px] text-[#8B5CF6] uppercase tracking-wider">{item.corp}</span>
                            <p className="font-mono text-[10px] text-white/40 mt-1 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Right Column: Skills & Projects */}
                    <div className="flex flex-col gap-12">
                      
                      {/* Skills Module */}
                      <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.2, ease: "linear" }}
                        className="flex flex-col gap-8"
                      >
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4 relative overflow-hidden">
                           <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#8B5CF6]/50 to-transparent scale-x-0 animate-[scan_2s_ease-out_infinite_0.5s]" />
                          <span className="font-mono text-[10px] text-white/30 tracking-[0.2em]">02 //</span>
                          <h3 className="text-[12px] uppercase tracking-[0.3em] text-white/80">Skills Module</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          {["TypeScript", "React", "Next.js", "Tailwind CSS", "Framer Motion", "PostgreSQL", "Python", "FastAPI", "Rust", "LLM Integration", "UI/UX Design"].map((skill, idx) => (
                            <div 
                              key={idx}
                              className="px-3 py-1.5 border border-white/10 text-white/60 hover:text-white hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 transition-all font-mono text-[10px] uppercase tracking-widest cursor-default hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                            >
                              {skill}
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Projects Matrix */}
                      <motion.div 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.3, duration: 0.2, ease: "linear" }}
                        className="flex flex-col gap-8"
                      >
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4 relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#8B5CF6]/50 to-transparent scale-x-0 animate-[scan_2s_ease-out_infinite_1s]" />
                          <span className="font-mono text-[10px] text-white/30 tracking-[0.2em]">03 //</span>
                          <h3 className="text-[12px] uppercase tracking-[0.3em] text-white/80">Projects Matrix</h3>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                          {([
                            { name: "GHOST_OS", status: "PRIVATE", desc: "A cinematic personal operating system interface. Link made private for a while." },
                            { name: "AETHER_UI", status: "PRIVATE", desc: "React component library for minimalist design. Link made private for a while." },
                            { name: "AURA", status: "ONLINE", desc: "Base44 Ideathon prototype that encodes an emotional memory into a 5-character code you can decode later.", href: "https://aura-09d1828b.base44.app/" },
                            { name: "A11YSHIP", status: "PROTOTYPE", desc: "AI accessibility auditor: paste a URL, get every WCAG violation explained in plain English with the exact code fix." },
                            { name: "DRIVER_DOCTOR", status: "IN DEV", desc: "Read-only Rust + GTK4 desktop app that reports hardware, active drivers, firmware and pending updates across apt, dnf and pacman distros." }
                          ] as { name: string; status: string; desc: string; href?: string }[]).map((proj, idx) => {
                            const Card = proj.href ? 'a' : 'div';
                            return (
                              <Card
                                key={idx}
                                {...(proj.href ? { href: proj.href, target: '_blank', rel: 'noopener noreferrer' } : {})}
                                className="group p-4 border border-white/5 bg-white/[0.01] hover:bg-[#8B5CF6]/[0.02] hover:border-[#8B5CF6]/30 transition-all flex flex-col gap-3 relative overflow-hidden"
                              >
                                <div className="absolute top-0 left-0 w-1 h-full bg-white/10 group-hover:bg-[#8B5CF6] transition-colors" />
                                <div className="flex items-center justify-between pl-2">
                                  <span className="font-mono text-[11px] text-white tracking-widest group-hover:text-[#8B5CF6] transition-colors">{proj.name}</span>
                                  <span className={`font-mono text-[9px] tracking-widest ${proj.status === 'ONLINE' ? 'text-[#8B5CF6] animate-pulse' : 'text-white/30'}`}>
                                    [{proj.status}]
                                  </span>
                                </div>
                                <p className="font-mono text-[10px] text-white/40 pl-2">{proj.desc}</p>
                              </Card>
                            );
                          })}
                        </div>
                      </motion.div>

                    </div>
                  </div>

                  {/* Footer / Contact Protocol */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4, duration: 0.2, ease: "linear" }}
                    className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0"
                  >
                    <div className="flex items-center gap-3 group">
                      <span className="w-1.5 h-1.5 bg-white/40 group-hover:bg-[#8B5CF6] transition-colors rounded-full" />
                      <span className="font-mono text-[10px] tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-colors uppercase">
                        END OF RECORD
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <a href="mailto:smaranprakash@gmail.com"className="font-mono text-[10px] tracking-[0.2em] text-white/60 hover:text-white transition-colors uppercase relative group">
                        INITIATE_CONTACT
                        <div className="absolute -bottom-1 left-0 w-full h-px bg-[#8B5CF6] scale-x-0 group-hover:scale-x-100 transition-transform origin-left shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                      </a>
                      <a href="https://github.com/Smaran-Prakash-Jani" target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] tracking-[0.2em] text-white/60 hover:text-white transition-colors uppercase relative group">
                        SYS_GITHUB
                        <div className="absolute -bottom-1 left-0 w-full h-px bg-[#8B5CF6] scale-x-0 group-hover:scale-x-100 transition-transform origin-left shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                      </a>
                    </div>
                  </motion.div>

                </div>
              </div>
            </div>
            
            {/* Scrollbar styles (global override for this component) */}
            <style dangerouslySetInnerHTML={{__html: `
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.02);
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255,255,255,0.3);
              }
            `}} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}