import React, { Suspense, lazy, useRef, useState } from 'react';
import { GLSlot } from './fx/GLSlot';
import { canvasDpr, qualityTier } from '../lib/quality';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight, Lock } from 'lucide-react';
// WebGL (ogl) ripples: loaded on demand; the plain image shows until then
const RippleDistortion = lazy(() => import('./reactbits/RippleDistortion'));
import { BlurText, ScrambleText } from './fx/TextFx';
import { ParallaxLayer } from './fx/ParallaxLayer';
import { GhostNumeral, ScrollRevealText, TiltMedia } from './fx/ScrollFx';

/** A project image as a liquid surface: the cursor sends ripples through it; colour comes in on hover. */
function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [hover, setHover] = useState(false);
  const still = <img src={src} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover grayscale" />;
  return (
    <div
      role="img"
      aria-label={alt}
      className="w-full h-full"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <GLSlot fallback={still}>
      <Suspense fallback={still}>
        <RippleDistortion
          src={src}
          grayscale={!hover}
          brushSize={140}
          strength={0.12}
          swirl={0.8}
          rings={4}
          dispersion={0.15}
          glint={0.35}
          tint="#a78bfa"
          tintAmount={0.15}
          quality={qualityTier() === 'high' ? 'medium' : 'low'}
        maxDpr={canvasDpr(2)}
        />
      </Suspense>
      </GLSlot>
    </div>
  );
}

/** The bottom-up wipe that opens a project image. It watches an unclipped wrapper: Chrome's
 *  IntersectionObserver measures the clipped box, so the fully clipped image only counted as
 *  "in view" once its bottom edge was, and stayed blank if you landed with its top above the fold. */
function WipeReveal({ children, className, ...rest }: React.ComponentProps<typeof motion.div>) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  return (
    <div ref={ref} data-gl-zone>
      <motion.div
        {...rest}
        className={className}
        initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
        animate={inView ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
        transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function Projects() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } },
  };

  // Earlier work. The links are private for now.
  const projects = [
    {
      id: '01',
      title: 'Neural Synthesizer',
      category: 'AI / Product',
      image: 'https://images.unsplash.com/photo-1771503735122-22405ba958f9?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwZ2xvd2luZ3xlbnwxfHx8fDE3NzczMzE4NTN8MA&ixlib=rb-4.1.0&q=70&w=1080',
      description: 'An advanced AI agent framework translating natural language into high-fidelity UI components. Built with React and LangChain.',
    },
    {
      id: '02',
      title: 'Aura Analytics',
      category: 'Frontend / Dashboard',
      image: 'https://images.unsplash.com/photo-1736773999645-2d85a5e8562a?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZGFyayUyMG1vZGVybiUyMGludGVyZmFjZSUyMGFic3RyYWN0fGVufDF8fHx8MTc3NzMzMTg1M3ww&ixlib=rb-4.1.0&q=70&w=1080',
      description: 'A premium data visualization suite for founders. Seamlessly blurring the lines between art and metrics.',
    },
    {
      id: '03',
      title: 'Vanguard OS',
      category: 'Design System / Architecture',
      image: 'https://images.unsplash.com/photo-1526906198213-3fdd3e9f94f7?crop=entropy&cs=tinysrgb&fit=max&auto=format&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbWluaW1hbGlzdCUyMGFyY2hpdGVjdHVyZSUyMGFic3RyYWN0fGVufDF8fHx8MTc3NzMzMTg1M3ww&ixlib=rb-4.1.0&q=70&w=1080',
      description: 'A matte-black, glassmorphic design language engineered for elite startup landing pages and minimal SAAS.',
    },
    {
      id: '04',
      title: 'Quantum Commerce',
      category: 'Full-Stack / E-commerce',
      image: 'https://images.unsplash.com/photo-1771011726574-60ab6028724a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG1vZGVybiUyMHRlY2hub2xvZ3klMjB0ZXh0dXJlfGVufDF8fHx8MTc3NzMzMTg1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'A headless e-commerce experience prioritizing speed, aesthetics, and zero friction in the checkout flow.',
    },
  ];

  // Recent builds, listed simply with their links.
  const recentProjects = [
    {
      id: '05',
      title: 'CRM Technology',
      category: 'Client / Full-Stack Commerce',
      description: 'The standalone commerce platform for a South African IT hardware retailer, replacing their Shopify store: storefront, dealer portal, quotes and PDF invoices, a compatibility-checked PC builder, and an admin with mandatory two-factor auth.',
      stack: ['Next.js 16', 'PostgreSQL', 'Drizzle', 'TypeScript'],
      links: [{ label: 'Live site', href: 'https://crm-technology-platform.vercel.app' }],
    },
    {
      id: '06',
      title: 'PowBI',
      category: 'AI / Data',
      description: 'Conversational business intelligence. Upload a CSV, ask a question in plain English, and PowBI writes the SQL with Gemini and answers with interactive charts and KPIs.',
      stack: ['React', 'FastAPI', 'Pandas', 'Gemini', 'Plotly'],
      links: [{ label: 'Source', href: 'https://github.com/Smaran-Prakash-Jani/PowBI' }],
    },
    {
      id: '07',
      title: 'BlackTrace',
      category: 'Security / AI',
      description: 'AI-native URL intelligence. Every link runs through brand-impersonation, entropy, redirect-chain and TLD analyzers plus live threat feeds; a risk engine scores it and explains the verdict in plain English.',
      stack: ['FastAPI', 'Next.js', 'Python', 'Threat Intel'],
      links: [{ label: 'Source', href: 'https://github.com/Smaran-Prakash-Jani/BlackTrace' }],
    },
  ];

  return (
    <section id="projects" className="relative w-full max-w-[90rem] mx-auto px-8 md:pl-12 md:pr-28 py-16 md:py-40 z-10">
      <GhostNumeral className="left-[1%] top-[1%]">02</GhostNumeral>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 mb-14 md:mb-32">
        <div className="flex-1">
          <div className="flex items-center gap-6 mb-8 md:mb-12 w-full">
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-medium relative flex items-center gap-3">
                <span className="w-1 h-1 border-[1px] border-[#8B5CF6]/60 rounded-full" />
                <ScrambleText text="02 // Selected Work" />
              </h2>
              <span className="font-mono text-[8px] tracking-[0.2em] text-white/45 pl-4">SEC.02_PRJ</span>
            </div>

            <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }} className="flex-1 h-[1px] bg-white/[0.12] relative mx-4 origin-left">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/45 rounded-full" />
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/45" />
              <div className="absolute left-[70%] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/45" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/45" />
            </motion.div>

            <span className="font-mono text-[8px] tracking-[0.2em] text-white/45 hidden md:block">DATA.BLK_02</span>
          </div>
          <h3 className="text-5xl md:text-7xl lg:text-9xl font-medium tracking-tighter text-white leading-[0.9] max-w-4xl">
            <BlurText text={'Proof of\nWork.'} stagger={0.12} />
          </h3>
        </div>
        <p className="text-white/80 max-w-sm text-lg md:text-xl font-light tracking-wide leading-[1.7] pb-4">
          <ScrollRevealText text="Seven projects. Built at the intersection of intelligence and design." />
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-200px' }}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-14 md:gap-y-48"
      >
        {projects.map((project, idx) => (
          <motion.div
            key={project.id}
            variants={itemVariants}
            data-fx-group
            className={`group relative flex flex-col gap-6 p-4 md:p-8 border border-white/[0.02] hover:border-white/[0.08] bg-black/20 backdrop-blur-sm transition-colors duration-700 ${idx % 2 !== 0 ? 'md:mt-48' : ''}`}
          >
            {/* Technical Header for Card */}
            <div className="flex justify-between items-end border-b border-white/[0.05] pb-3 mb-2">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[8px] text-white/50 tracking-widest uppercase">
                  PRJ_ID: {project.id}.00{idx + 1}
                </span>
                <span className="text-white/40 font-mono text-[7px] tracking-[0.3em] uppercase hidden md:block">
                  SYS.RENDER_READY
                </span>
              </div>
              <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-1 h-1 bg-white/40" />
                <div className="w-1 h-1 border border-white/40" />
                <div className="w-1 h-1 border border-[#8B5CF6]/60" />
              </div>
            </div>

            {/* Image Container with Technical Corners: wipes open from the bottom when it scrolls in,
                then tilts towards the mouse */}
            <TiltMedia className="relative" >
            <WipeReveal
              data-cursor-label="Private"
              className="relative aspect-[4/5] overflow-hidden bg-white/[0.01] border border-white/[0.02]"
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-[1px] border-l-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-[1px] border-r-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[1px] border-l-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[1px] border-r-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />

              <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center z-20 opacity-0 group-hover:opacity-30 transition-all duration-1000">
                <div className="w-[1px] h-full bg-white/50" />
                <div className="h-[1px] w-full bg-white/50 absolute" />
                <div className="w-4 h-4 border border-white/50 rounded-full absolute" />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-black/40 z-10 group-hover:bg-transparent transition-colors duration-[1.5s] ease-out" />
              <ParallaxLayer>
                <ProjectImage src={project.image} alt={project.title} />
              </ParallaxLayer>
            </WipeReveal>
            </TiltMedia>

            {/* Typography & Content */}
            <div className="relative z-20 flex flex-col gap-4 px-2">
              <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-4 group-hover:border-white/20 transition-colors duration-700">
                <h4 className="text-3xl md:text-4xl font-medium text-white tracking-tighter">
                  <ScrambleText text={project.title} replayOnHover />
                </h4>
                <span className="text-white/20 font-mono text-[10px] tracking-widest uppercase">
                  (0{idx + 1})
                </span>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
                <p className="text-white/55 text-[10px] uppercase tracking-[0.2em] font-medium w-1/3">
                  {project.category}
                </p>
                <p className="text-white/50 text-base md:text-lg font-light leading-relaxed md:w-2/3">
                  {project.description}
                </p>
              </div>

              {/* Private link notice */}
              <div className="flex items-center gap-2 pt-4 mt-2 border-t border-white/[0.04] font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                <Lock className="w-3 h-3 shrink-0" />
                Link made private for a while
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Builds: simple rows with links */}
      <div className="mt-24 md:mt-56">
        <div className="flex items-center gap-6 mb-8 md:mb-12 w-full">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-medium relative flex items-center gap-3">
              <span className="w-1 h-1 border-[1px] border-[#8B5CF6]/60 rounded-full" />
              <ScrambleText text="02.B // Recent Builds" />
            </h3>
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/45 pl-4">SEC.02_LOG</span>
          </div>
          <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }} className="flex-1 h-[1px] bg-white/[0.12] relative mx-4 origin-left">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/45 rounded-full" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/45" />
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="flex flex-col border-t border-white/[0.06]"
        >
          {recentProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              data-fx-group
              className="group grid grid-cols-1 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1.6fr)] gap-4 md:gap-12 py-10 md:py-14 border-b border-white/[0.06] hover:border-white/20 transition-colors duration-700"
            >
              <span className="font-mono text-[10px] text-white/20 tracking-widest md:pt-3">({project.id})</span>

              <div className="flex flex-col gap-3">
                <h4 className="text-3xl md:text-4xl font-medium text-white tracking-tighter">
                  <ScrambleText text={project.title} replayOnHover />
                </h4>
                <p className="text-white/55 text-[10px] uppercase tracking-[0.2em] font-medium">
                  {project.category}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <p className="text-white/50 text-base md:text-lg font-light leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 border border-white/[0.08] font-mono text-[9px] uppercase tracking-widest text-white/60"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-6">
                    {project.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link relative inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                        <span className="absolute -bottom-1 left-0 w-full h-px bg-[#8B5CF6] scale-x-0 group-hover/link:scale-x-100 transition-transform origin-left" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
