'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function KeepsakeMockupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 overflow-hidden relative" style={{ backgroundColor: '#EBE5D9' }}>
      {/* Plaster Wall Texture */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#dcd4c3] opacity-50 pointer-events-none" />
      
      {/* Title */}
      <div className="absolute top-12 left-0 right-0 text-center z-20">
        <h1 className="text-3xl font-bold font-serif text-[#4a3f35] mb-2">The Family Wall</h1>
        <p className="text-sm tracking-widest uppercase text-[#8a7a65]">Tap a portrait to read their story</p>
      </div>
      
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-16 max-w-4xl w-full place-items-center mt-12" style={{ perspective: '1200px' }}>
        <KeepsakeFrame 
          name="Shri Ram Prasad" 
          role="Kul Karta (Founder)" 
          years="1920 – 1995"
          imageUrl="https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=500&auto=format&fit=crop"
          style="teak"
          story="The foundational pillar of our family branch. Known for unyielding dedication to dharma and the establishment of the ancestral home in Varanasi. He never missed a single morning of Sandhya Vandana in 50 years. His diary remains our family's most prized possession."
        />
        <KeepsakeFrame 
          name="Anjali Sharma" 
          role="Current Guardian" 
          years="Living"
          imageUrl="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=500&auto=format&fit=crop"
          style="brass"
          story="Taking the family traditions forward into the modern era. She instituted the annual Kul gathering and digitised the family tree so the younger generation spread across the globe could remain connected to their roots."
        />
      </div>
    </div>
  );
}

function KeepsakeFrame({ name, role, years, imageUrl, style, story }: { name: string, role: string, years: string, imageUrl: string, style: 'teak' | 'brass', story: string }) {
  const [isOpen, setIsOpen] = useState(false);

  // Material Definitions
  const frameStyles = {
    teak: {
      outer: 'linear-gradient(145deg, #3A2312, #1A1008)',
      border: '2px solid #4A3320',
      shadow: '0 25px 50px -12px rgba(26,16,8,0.5), 0 10px 20px -5px rgba(0,0,0,0.4)',
      nameplate: 'linear-gradient(to right, #b49157, #e2c792, #b49157)',
      plateBorder: '1px solid #8a6c32',
    },
    brass: {
      outer: 'linear-gradient(145deg, #d4b572, #9a7c42)',
      border: '2px solid #e5c683',
      shadow: '0 25px 50px -12px rgba(154,124,66,0.3), 0 10px 20px -5px rgba(0,0,0,0.2)',
      nameplate: 'linear-gradient(to right, #f4f4f4, #ffffff, #f4f4f4)',
      plateBorder: '1px solid #dcdcdc',
    }
  };

  const currentStyle = frameStyles[style];

  return (
    <motion.div 
      className="relative cursor-pointer group"
      onClick={() => setIsOpen(!isOpen)}
      whileHover={{ scale: 1.04, rotateY: 4, rotateX: -2, z: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* The Physical 3D Frame */}
      <motion.div 
        className="w-64 h-80 rounded-sm relative"
        style={{ 
          background: currentStyle.outer,
          border: currentStyle.border,
          boxShadow: isOpen ? '0 10px 20px rgba(0,0,0,0.2)' : currentStyle.shadow,
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: isOpen ? 180 : 0 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 150, damping: 20 }}
      >
        {/* ================= FRONT OF FRAME ================= */}
        <div className="absolute inset-0 p-3 flex flex-col" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          {/* Inner Matte (Off-white cardboard border) */}
          <div className="flex-1 bg-[#F9F6F0] shadow-[inset_0_4px_12px_rgba(0,0,0,0.2)] p-2.5 flex flex-col relative overflow-hidden border border-black/10">
            {/* Matte Texture */}
            <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/white-paper.png')" }} />
            
            {/* The Photo Canvas */}
            <div className="flex-1 relative overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] bg-black">
              {/* Photo Image with Vintage/Sepia filter */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                style={{ 
                  backgroundImage: `url(${imageUrl})`,
                  filter: 'sepia(0.35) contrast(1.15) brightness(0.9) saturate(0.8)',
                }}
              />
              
              {/* Glass Reflection Sweep (Triggers on hover) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 -translate-x-full group-hover:translate-x-full ease-in-out pointer-events-none" />
              
              {/* Glass Vignette */}
              <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] pointer-events-none" />
            </div>

            {/* Brass/Silver Nameplate */}
            <div className="mt-4 h-9 rounded-[2px] flex flex-col items-center justify-center shadow-[0_3px_6px_rgba(0,0,0,0.2)] z-10 relative"
                 style={{ background: currentStyle.nameplate, border: currentStyle.plateBorder }}>
                 {/* Metal Texture */}
                 <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/brushed-alum.png')" }} />
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2a2a2a] font-serif leading-none relative z-10" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
                   {name}
                 </p>
            </div>
          </div>
        </div>

        {/* ================= BACK OF FRAME (The Story) ================= */}
        <div className="absolute inset-0 p-2.5 rounded-sm" 
             style={{ 
               backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', 
               transform: 'rotateY(180deg)', 
               background: '#c4bbae', // Dust cover backing board color
               border: '1px solid #a39988'
             }}>
          {/* Handwritten Note / Diary Page */}
          <div className="w-full h-full bg-[#fdfbf7] shadow-[inset_0_0_20px_rgba(0,0,0,0.06)] p-5 relative overflow-hidden border border-[#dcd4c3]">
             {/* Handmade Paper Texture */}
             <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/handmade-paper.png')" }} />
             
             {/* Content */}
             <div className="relative z-10 flex flex-col h-full text-[#3a3025]">
                <h3 className="font-serif text-xl font-bold border-b border-[#3a3025]/10 pb-2 mb-2 text-[#2a2218]">{name}</h3>
                
                <div className="flex justify-between items-baseline mb-4">
                  <p className="text-[9px] uppercase tracking-widest font-bold opacity-60 text-[#8c4b38]">{role}</p>
                  <p className="text-[10px] italic opacity-80 font-serif">{years}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                  <p className="text-sm leading-relaxed font-serif opacity-90 text-justify">
                    {story}
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-[#3a3025]/10 flex items-center justify-center gap-2 opacity-50">
                  <span className="w-4 h-[1px] bg-[#3a3025]"></span>
                  <p className="text-[8px] uppercase tracking-[0.2em] font-bold">Tap to flip</p>
                  <span className="w-4 h-[1px] bg-[#3a3025]"></span>
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
