import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'motion/react';
import { ArrowRight } from 'lucide-react';

function CapabilityCard({ item, index, isHovered, onHover, onLeave }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const background = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(139, 92, 246, 0.05), transparent 80%)`;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.1 }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onMouseMove={handleMouseMove}
      className="group relative border-b border-white/[0.04] py-10 md:py-16 lg:py-24 flex flex-col lg:flex-row lg:items-start justify-between gap-6 md:gap-12 cursor-pointer transition-colors duration-700 hover:border-[#8B5CF6]/30 overflow-hidden bg-transparent"
    >
      {/* Dynamic Hover Glow */}
      <motion.div 
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" 
        style={{ background }} 
      />

      {/* Corner Indicators on hover */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-[1px] border-l-[1px] border-white/0 group-hover:border-[#8B5CF6]/50 transition-colors duration-500 z-10" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-[1px] border-r-[1px] border-white/0 group-hover:border-[#8B5CF6]/50 transition-colors duration-500 z-10" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1px] border-l-[1px] border-white/0 group-hover:border-[#8B5CF6]/50 transition-colors duration-500 z-10" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1px] border-r-[1px] border-white/0 group-hover:border-[#8B5CF6]/50 transition-colors duration-500 z-10" />

      {/* Vertical Divider */}
      <div className="absolute left-[41.666667%] top-0 bottom-0 w-[1px] bg-white/[0.02] group-hover:bg-[#8B5CF6]/20 transition-colors duration-500 hidden lg:block z-10" />

      {/* Left side: Number & Title */}
      <div className="flex gap-8 lg:gap-24 w-full lg:w-5/12 items-start relative z-10 px-4 md:px-8">
        <span className="font-mono text-[10px] tracking-widest text-white/20 mt-3 group-hover:text-[#8B5CF6]/80 transition-colors duration-500">
          (0{index + 1})
        </span>
        <h4 className="text-4xl md:text-5xl lg:text-6xl font-medium text-white/40 group-hover:text-white transition-colors duration-700 tracking-tighter leading-none">
          {item.title}
        </h4>
      </div>

      {/* Right side: Description & Tools */}
      <div className="w-full lg:w-6/12 flex flex-col justify-between lg:pl-12 relative z-10 px-4 md:px-0">
        <p className="text-white/40 group-hover:text-white/70 text-lg md:text-2xl font-light leading-relaxed mb-8 transition-colors duration-700 max-w-2xl">
          {item.description}
        </p>
        
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
                {item.tools.map((tool: string, i: number) => (
                  <div 
                    key={i} 
                    className="flex justify-between items-center px-4 py-3 border border-white/[0.05] bg-black/20 text-[9px] uppercase font-mono text-white/40 tracking-[0.2em] group-hover:border-[#8B5CF6]/30 group-hover:text-[#8B5CF6]/90 transition-all duration-500"
                  >
                    <span>{tool}</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full group-hover:bg-[#8B5CF6]/60 transition-colors" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Arrow Icon */}
      <div className="absolute right-8 top-16 lg:static transform -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-700 ease-[0.22,1,0.36,1] hidden md:flex items-center justify-center z-10">
        <ArrowRight className="w-8 h-8 text-[#8B5CF6]/60" />
      </div>
    </motion.div>
  );
}

export function Capabilities() {
  const capabilities = [
    {
      id: '01',
      title: 'Artificial Intelligence',
      description: 'Leveraging machine learning models, neural networks, and LLMs to create autonomous, data-driven systems that push the boundaries of user experience.',
      tools: ['TensorFlow', 'PyTorch', 'LangChain', 'OpenAI API']
    },
    {
      id: '02',
      title: 'Frontend Engineering',
      description: 'Crafting pixel-perfect, highly performant web applications with deep focus on micro-interactions, complex state management, and cinematic motion.',
      tools: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion']
    },
    {
      id: '03',
      title: 'Product Design',
      description: 'Architecting user interfaces that blend aesthetic minimalism with functional clarity. Every pixel serves a purpose, every layout tells a story.',
      tools: ['Figma', 'Prototyping', 'Design Systems', 'UX Architecture']
    },
    {
      id: '04',
      title: 'Startup Execution',
      description: 'Moving with founders velocity. Translating ambiguous ideas into shipping products with zero friction and uncompromised quality.',
      tools: ['Agile', 'Product Strategy', 'Growth Hacking', 'GTM']
    }
  ];

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="capabilities" className="relative w-full max-w-[90rem] mx-auto px-8 md:pl-12 md:pr-28 py-16 md:py-40 z-10">
      <div className="flex flex-col gap-8 mb-10 md:mb-32 relative w-full">
        <div className="flex items-center gap-6 mb-4 w-full">
          <div className="flex flex-col gap-1">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium relative flex items-center gap-3">
              <span className="w-1 h-1 border-[1px] border-[#8B5CF6]/60 rounded-full" />
              03 // Capabilities
            </h2>
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 pl-4">SEC.03_SYS</span>
          </div>

          <div className="flex-1 h-[1px] bg-white/[0.05] relative mx-4">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/20 rounded-full" />
            <div className="absolute left-[15%] top-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/20" />
            <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/20" />
            <div className="absolute left-[85%] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/20" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/20" />
          </div>

          <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 hidden md:block">SYS.CAP_03</span>
        </div>
        <h3 className="text-5xl md:text-7xl lg:text-9xl font-medium tracking-tighter text-white leading-[0.9]">
          Capabilities.
        </h3>
        
        {/* Decorative Grid Top Right */}
        <div className="absolute right-0 top-0 w-32 h-32 opacity-20 hidden md:grid grid-cols-4 grid-rows-4 gap-1 pointer-events-none">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-sm hover:bg-[#8B5CF6]/40 transition-colors duration-1000" />
          ))}
        </div>
      </div>

      <div className="flex flex-col border-t border-white/[0.04]">
        {capabilities.map((item, index) => (
          <CapabilityCard 
            key={item.id} 
            item={item} 
            index={index}
            isHovered={hoveredIndex === index}
            onHover={() => setHoveredIndex(index)}
            onLeave={() => setHoveredIndex(null)}
          />
        ))}
      </div>
    </section>
  );
}
