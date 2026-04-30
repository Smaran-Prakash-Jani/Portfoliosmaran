import React from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Projects() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } },
  };

  const projects = [
    {
      id: '01',
      title: 'Neural Synthesizer',
      category: 'AI / Product',
      image: 'https://images.unsplash.com/photo-1771503735122-22405ba958f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwZ2xvd2luZ3xlbnwxfHx8fDE3NzczMzE4NTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'An advanced AI agent framework translating natural language into high-fidelity UI components. Built with React and LangChain.',
    },
    {
      id: '02',
      title: 'Aura Analytics',
      category: 'Frontend / Dashboard',
      image: 'https://images.unsplash.com/photo-1736773999645-2d85a5e8562a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZGFyayUyMG1vZGVybiUyMGludGVyZmFjZSUyMGFic3RyYWN0fGVufDF8fHx8MTc3NzMzMTg1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
      description: 'A premium data visualization suite for founders. Seamlessly blurring the lines between art and metrics.',
    },
    {
      id: '03',
      title: 'Vanguard OS',
      category: 'Design System / Architecture',
      image: 'https://images.unsplash.com/photo-1526906198213-3fdd3e9f94f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbWluaW1hbGlzdCUyMGFyY2hpdGVjdHVyZSUyMGFic3RyYWN0fGVufDF8fHx8MTc3NzMzMTg1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
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

  return (
    <section id="projects" className="relative w-full max-w-[90rem] mx-auto px-8 md:px-12 py-32 md:py-40 z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
        <div className="flex-1">
          <div className="flex items-center gap-6 mb-12 w-full">
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium relative flex items-center gap-3">
                <span className="w-1 h-1 border-[1px] border-[#8B5CF6]/60 rounded-full" />
                02 // Selected Work
              </h2>
              <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 pl-4">SEC.02_PRJ</span>
            </div>
            
            <div className="flex-1 h-[1px] bg-white/[0.05] relative mx-4">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/20 rounded-full" />
              <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/20" />
              <div className="absolute left-[70%] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/20" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/20" />
            </div>
            
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 hidden md:block">DATA.BLK_02</span>
          </div>
          <h3 className="text-5xl md:text-7xl lg:text-9xl font-medium tracking-tighter text-white leading-[0.9] max-w-4xl">
            Proof of<br />Work.
          </h3>
        </div>
        <p className="text-white/50 max-w-sm text-lg md:text-xl font-light tracking-wide leading-[1.7] pb-4">
          Four distinct projects. Built at the intersection of intelligence and design.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-200px' }}
        className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-32 md:gap-y-48"
      >
        {projects.map((project, idx) => (
          <motion.div
            key={project.id}
            variants={itemVariants}
            className={`group relative flex flex-col gap-6 p-4 md:p-8 border border-white/[0.02] hover:border-white/[0.08] bg-black/20 backdrop-blur-sm transition-colors duration-700 ${idx % 2 !== 0 ? 'md:mt-48' : ''}`}
          >
            {/* Technical Header for Card */}
            <div className="flex justify-between items-end border-b border-white/[0.05] pb-3 mb-2">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[8px] text-white/30 tracking-widest uppercase">
                  PRJ_ID: {project.id}.00{idx + 1}
                </span>
                <span className="text-white/20 font-mono text-[7px] tracking-[0.3em] uppercase hidden md:block">
                  SYS.RENDER_READY
                </span>
              </div>
              <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-1 h-1 bg-white/40" />
                <div className="w-1 h-1 border border-white/40" />
                <div className="w-1 h-1 border border-[#8B5CF6]/60" />
              </div>
            </div>

            {/* Image Container with Technical Corners */}
            <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.01] border border-white/[0.02]">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-[1px] border-l-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-[1px] border-r-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[1px] border-l-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[1px] border-r-[1px] border-white/20 z-20 pointer-events-none transition-all duration-700 group-hover:scale-125 group-hover:border-white/60" />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center z-20 opacity-0 group-hover:opacity-30 transition-all duration-1000">
                <div className="w-[1px] h-full bg-white/50" />
                <div className="h-[1px] w-full bg-white/50 absolute" />
                <div className="w-4 h-4 border border-white/50 rounded-full absolute" />
              </div>

              <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-transparent transition-colors duration-[1.5s] ease-out" />
              <ImageWithFallback 
                src={project.image} 
                alt={project.title} 
                className="w-full h-full object-cover object-center grayscale-[0.8] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-[1.5s] ease-[0.22,1,0.36,1]" 
              />
            </div>

            {/* Typography & Content */}
            <div className="relative z-20 flex flex-col gap-4 px-2">
              <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-4 group-hover:border-white/20 transition-colors duration-700">
                <h4 className="text-3xl md:text-4xl font-medium text-white tracking-tighter">
                  {project.title}
                </h4>
                <span className="text-white/20 font-mono text-[10px] tracking-widest uppercase">
                  (0{idx + 1})
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between gap-6 pt-2">
                <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-medium w-1/3">
                  {project.category}
                </p>
                <p className="text-white/50 text-base md:text-lg font-light leading-relaxed md:w-2/3">
                  {project.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
