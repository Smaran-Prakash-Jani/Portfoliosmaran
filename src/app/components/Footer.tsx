import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, FileText, Github, Instagram, Linkedin, Twitter } from 'lucide-react';
import { BlurText, ScrambleText } from './fx/TextFx';
import { GhostNumeral, Magnetic, ScrollRevealText } from './fx/ScrollFx';
import { ChromeTracker } from './fx/ChromeTracker';
import { ChromeFollower } from './fx/ChromeFollower';

const socials = [
  { label: 'GitHub', href: 'https://github.com/Smaran-Prakash-Jani', Icon: Github },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/smaranprakashjani', Icon: Linkedin },
  { label: 'X / Twitter', href: 'https://x.com/PrakashSmaran', Icon: Twitter },
  { label: 'Instagram', href: 'https://www.instagram.com/_.smarann._/', Icon: Instagram },
];

const openResume = (e: React.MouseEvent) => {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('open-resume'));
};

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <footer ref={footerRef} id="contact" className="relative w-full max-w-[90rem] mx-auto px-8 md:pl-12 md:pr-28 pt-16 pb-28 md:py-48 z-10 overflow-hidden">
      {/* one chrome blob breaks away and follows the cursor around this section */}
      <ChromeFollower sectionRef={footerRef} />
      {/* Cinematic Ambient Glow */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none rounded-full" />
      <GhostNumeral className="left-[1%] top-[4%]">04</GhostNumeral>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-200px' }}
        className="flex flex-col text-center md:text-left relative z-10"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-center md:justify-start gap-6 mb-10 md:mb-24 w-full relative">
          <div className="flex flex-col gap-1 text-left hidden md:flex">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-medium relative flex items-center gap-3">
              <span className="w-1 h-1 border-[1px] border-[#8B5CF6]/60 rounded-full" />
              <ScrambleText text="04 // Next Steps" />
            </h2>
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/45 pl-4">SEC.04_END</span>
          </div>

          <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }} className="flex-1 h-[1px] bg-white/[0.12] relative mx-4 hidden md:block origin-left">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/45 rounded-full" />
            <div className="absolute right-[20%] top-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/45" />
            <div className="absolute right-[70%] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/45" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/45" />
          </motion.div>

          <span className="font-mono text-[8px] tracking-[0.2em] text-white/45 hidden md:block">INIT.SEQ_04</span>
          
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-medium md:hidden">04 // Next Steps</h2>
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

          {/* Liquid chrome under a computer-vision tracking pass */}
          <ChromeTracker className="pointer-events-none relative block mx-auto -mt-6 mb-4 h-72 w-full max-w-md md:h-80 lg:absolute lg:mx-0 lg:mb-0 lg:mt-0 lg:right-[2%] lg:top-[2%] lg:h-[72%] lg:w-[50%] lg:max-w-none" />

          <h3 className="relative z-10 text-6xl md:text-[8rem] lg:text-[10rem] font-medium tracking-tighter text-white mb-12 md:mb-20 leading-[0.8] select-none">
            <BlurText text={"Let's\nBuild."} stagger={0.14} duration={1.3} />
          </h3>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <p className="max-w-2xl text-lg md:text-2xl text-white/80 font-light tracking-wide leading-relaxed text-center md:text-left">
              <ScrollRevealText text="Seeking opportunities to architect intelligence and craft premium digital experiences. Available for elite engagements." />
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
            <Magnetic>
            <a
              href="mailto:smaranprakash@gmail.com"
              data-cursor-label="Email"
              className="group/btn relative flex items-center justify-center gap-4 px-12 py-6 bg-transparent border border-white/20 text-white font-medium tracking-[0.15em] text-xs uppercase overflow-hidden transition-all duration-500 hover:border-white"
            >
              <div className="absolute inset-0 bg-white translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1]" />
              <span className="relative z-10 flex items-center gap-3 group-hover/btn:text-black transition-colors duration-500">
                <Mail className="w-4 h-4" />
                Initiate Contact
              </span>
              <ArrowRight className="w-4 h-4 relative z-10 opacity-0 -translate-x-4 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 group-hover/btn:text-black transition-all duration-500 ease-out" />
            </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#resume"
                onClick={openResume}
                data-cursor-label="Resume"
                className="group/cv relative flex items-center justify-center gap-3 px-10 py-6 border border-[#A78BFA]/50 bg-[#8B5CF6]/10 text-[#E9E4FF] font-medium tracking-[0.15em] text-xs uppercase overflow-hidden shadow-[0_0_28px_rgba(139,92,246,0.25)] transition-all duration-500 hover:border-[#C4B5FD] hover:shadow-[0_0_40px_rgba(139,92,246,0.45)]"
              >
                <span className="absolute inset-0 bg-[#8B5CF6]/30 translate-y-[100%] group-hover/cv:translate-y-0 transition-transform duration-500 ease-[0.22,1,0.36,1]" />
                <FileText className="relative w-4 h-4" />
                <span className="relative">View Resume</span>
              </a>
            </Magnetic>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full flex flex-col md:flex-row items-center justify-between pt-16 gap-12">
          <div className="flex items-center gap-4 text-white/55 text-[10px] uppercase tracking-[0.2em] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"></span>
            SPJ © {new Date().getFullYear()}
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-3">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="group relative flex items-center gap-2.5 h-11 pl-3.5 pr-4 border border-white/[0.14] bg-white/[0.03] text-white/75 hover:text-white hover:border-[#A78BFA]/60 hover:bg-[#8B5CF6]/10 hover:shadow-[0_0_22px_rgba(139,92,246,0.35)] transition-all duration-300"
              >
                <Icon className="w-4 h-4" strokeWidth={1.6} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{label}</span>
              </a>
            ))}
          </div>

          <a
            href="#resume"
            onClick={openResume}
            className="iris-edge group flex items-center gap-3 h-11 px-5 border border-[#A78BFA]/45 bg-[#8B5CF6]/10 text-[#E9E4FF] text-[10px] uppercase tracking-[0.25em] font-medium shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:border-[#C4B5FD] hover:shadow-[0_0_32px_rgba(139,92,246,0.45)] transition-all duration-300"
          >
            <FileText className="w-4 h-4" strokeWidth={1.6} />
            Resume / Index
            <ArrowRight className="w-3.5 h-3.5 -translate-x-1 group-hover:translate-x-0 transition-transform duration-300" />
          </a>
        </motion.div>
      </motion.div>
    </footer>
  );
}
