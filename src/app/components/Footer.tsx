import React from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight } from 'lucide-react';

export function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <footer id="contact" className="relative w-full max-w-[90rem] mx-auto px-8 md:px-12 py-32 md:py-48 z-10 overflow-hidden">
      {/* Cinematic Ambient Glow */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none rounded-full" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-200px' }}
        className="flex flex-col text-center md:text-left relative z-10"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-center md:justify-start gap-6 mb-16 md:mb-24 w-full relative">
          <div className="flex flex-col gap-1 text-left hidden md:flex">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium relative flex items-center gap-3">
              <span className="w-1 h-1 border-[1px] border-[#8B5CF6]/60 rounded-full" />
              04 // Next Steps
            </h2>
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 pl-4">SEC.04_END</span>
          </div>

          <div className="flex-1 h-[1px] bg-white/[0.05] relative mx-4 hidden md:block">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/20 rounded-full" />
            <div className="absolute right-[20%] top-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/20" />
            <div className="absolute right-[70%] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/20" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/20" />
          </div>

          <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 hidden md:block">INIT.SEQ_04</span>
          
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium md:hidden">04 // Next Steps</h2>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="relative w-full border border-white/[0.02] bg-black/20 backdrop-blur-sm p-8 md:p-16 lg:p-24 overflow-hidden group hover:border-white/[0.08] transition-colors duration-700"
        >
          {/* Corner Calibration Marks */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-[1px] border-l-[1px] border-white/30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-[1px] border-r-[1px] border-white/30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[1px] border-l-[1px] border-white/30" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[1px] border-r-[1px] border-white/30" />

          {/* Barcode Graphic */}
          <div className="absolute right-8 top-8 opacity-20 hidden lg:flex gap-[2px] items-end pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="bg-white" style={{ width: Math.random() > 0.5 ? '2px' : '1px', height: `${Math.random() * 20 + 10}px` }} />
            ))}
            <span className="font-mono text-[7px] tracking-widest text-white ml-2 rotate-90 transform origin-left whitespace-nowrap -mb-1">
              SYS.END_492
            </span>
          </div>

          <h3 className="text-6xl md:text-[8rem] lg:text-[10rem] font-medium tracking-tighter text-white mb-12 md:mb-20 leading-[0.8] select-none">
            Let's<br />Build.
          </h3>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <p className="max-w-2xl text-lg md:text-2xl text-white/50 font-light tracking-wide leading-relaxed text-center md:text-left">
              Seeking opportunities to architect intelligence and craft premium digital experiences. Available for elite engagements.
            </p>

            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=smaranprakash@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative flex items-center justify-center gap-4 px-12 py-6 bg-transparent border border-white/20 text-white font-medium tracking-[0.15em] text-xs uppercase overflow-hidden transition-all duration-500 hover:border-white"
            >
              <div className="absolute inset-0 bg-white translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1]" />
              <span className="relative z-10 flex items-center gap-3 group-hover/btn:text-black transition-colors duration-500">
                <Mail className="w-4 h-4" />
                Initiate Contact
              </span>
              <ArrowRight className="w-4 h-4 relative z-10 opacity-0 -translate-x-4 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 group-hover/btn:text-black transition-all duration-500 ease-out" />
            </a>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full flex flex-col md:flex-row items-center justify-between pt-16 gap-12">
          <div className="flex items-center gap-4 text-white/30 text-[10px] uppercase tracking-[0.2em] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"></span>
            SPJ © {new Date().getFullYear()}
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {[
              { label: 'GITHUB', href: 'https://github.com/Smaran-Prakash-Jani' },
              { label: 'LINKEDIN', href: 'https://www.linkedin.com/in/smaranprakashjani' },
              { label: 'TWITTER', href: 'https://x.com/PrakashSmaran' },
            ].map((social, idx) => (
              <a
                key={idx}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-[rgba(255,255,255,0.95)] hover:tracking-[0.25em] text-[10px] uppercase tracking-[0.2em] font-medium transition-all duration-300 ease-out relative group hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                aria-label={social.label}
              >
                {social.label}
                <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-white/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
              </a>
            ))}
          </div>
          
          <div className="flex items-center gap-6 md:gap-8">
            <a 
              href="#resume" 
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-resume'));
              }}
              className="text-white/30 hover:text-[rgba(255,255,255,0.95)] hover:tracking-[0.25em] text-[10px] uppercase tracking-[0.2em] font-medium transition-all duration-300 ease-out relative group hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
            >
              RESUME
              <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-white/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
            </a>
            <span className="text-white/10 text-[10px] uppercase tracking-[0.2em]">/</span>
            <a 
              href="#index" 
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-resume'));
              }}
              className="text-white/30 hover:text-[rgba(255,255,255,0.95)] hover:tracking-[0.25em] text-[10px] uppercase tracking-[0.2em] font-medium transition-all duration-300 ease-out relative group hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
            >
              INDEX
              <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-white/40 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
            </a>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
