import React from 'react';
import { motion } from 'motion/react';

export function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } },
  };

  const identityTags = [
    { label: 'AI/ML Systems Architecture' },
    { label: 'Premium Interaction Design' },
    { label: 'Frontend & WebGL Engineering' },
    { label: 'Product & Brand Strategy' },
  ];

  return (
    <section id="about" className="relative w-full max-w-[90rem] mx-auto px-8 md:px-12 pt-40 md:pt-48 pb-32 md:pb-40 z-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-24 lg:gap-40 items-start"
      >
        <div>
          <motion.div variants={childVariants} className="flex items-center gap-6 mb-16 w-full">
            <div className="flex flex-col gap-1">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-medium relative flex items-center gap-3">
                <span className="w-1 h-1 border-[1px] border-[#8B5CF6]/60 rounded-full" />
                01 // The Premise
              </h2>
              <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 pl-4">SEC.01_INIT</span>
            </div>
            
            <div className="flex-1 h-[1px] bg-white/[0.05] relative mx-4">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white/20 rounded-full" />
              <div className="absolute left-[30%] top-1/2 -translate-y-1/2 w-[1px] h-3 bg-white/20" />
              <div className="absolute left-[60%] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-white/20" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-[1px] bg-white/20" />
            </div>
            
            <span className="font-mono text-[8px] tracking-[0.2em] text-white/20 hidden md:block">DATA.BLK_01</span>
          </motion.div>
          
          <div className="relative p-6 md:p-12 border border-white/[0.03] bg-black/20 backdrop-blur-sm group hover:border-white/[0.08] transition-colors duration-700">
            {/* Corner Calibration Marks */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-[1px] border-l-[1px] border-white/30" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-[1px] border-r-[1px] border-white/30" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[1px] border-l-[1px] border-white/30" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[1px] border-r-[1px] border-white/30" />

            {/* Faint internal grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />

            <motion.h3 
              variants={childVariants} 
              className="relative text-3xl md:text-5xl lg:text-6xl font-medium tracking-tighter text-white mb-12 leading-[1.1] z-10"
            >
              Refining the raw power of intelligence into cinematic, zero-friction experiences.
            </motion.h3>
            
            <motion.div variants={childVariants} className="relative space-y-6 text-white/50 text-lg md:text-xl font-light leading-[1.7] max-w-2xl z-10">
              <p>
                I am a Computer Science student hyper-focused on Artificial Intelligence and Machine Learning. Yet, the backend is only the foundation.
              </p>
              <p>
                My true obsession lies in the final layer—translating complex systems into world-class, premium product designs. It is the tasteful restraint, the micro-interactions, and the typography that define elite software.
              </p>
              <p>
                Whether deploying neural networks or engineering a high-fidelity frontend, my objective is singular: absolute precision and uncompromised aesthetic authority.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="relative flex flex-col pt-4 lg:pt-32">
          {/* Vertical Ruler on Desktop */}
          <div className="absolute left-[-40px] top-32 bottom-0 w-[1px] bg-white/[0.05] hidden lg:block">
            <div className="absolute top-[10%] -left-1 w-2 h-[1px] bg-white/20" />
            <div className="absolute top-[30%] -left-1 w-2 h-[1px] bg-white/20" />
            <div className="absolute top-[50%] -left-1 w-2 h-[1px] bg-white/20" />
          </div>

          <motion.div 
            variants={containerVariants}
            className="flex flex-col gap-6 relative z-10"
          >
            {identityTags.map((tag, idx) => (
              <motion.div
                key={idx}
                variants={childVariants}
                className="group relative flex flex-col gap-2 p-6 border border-white/[0.02] hover:border-white/[0.08] bg-white/[0.01] transition-colors duration-500"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/30 font-mono text-[9px] tracking-widest uppercase">
                    ID.0{idx + 1}
                  </span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-white/20" />
                    <div className="w-1 h-1 border border-white/20" />
                  </div>
                </div>
                <h4 className="text-white/80 font-medium tracking-tight text-lg md:text-xl group-hover:text-white transition-colors duration-500">
                  {tag.label}
                </h4>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
