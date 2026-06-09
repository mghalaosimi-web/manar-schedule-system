import React, { useState } from 'react';
import { motion } from 'framer-motion';
import logoImg from './assets/logo.png';

export default function Logo({ size = 'md' }) {
  const [loaded, setLoaded] = useState(false);
  
  // Determine width and height classes based on size prop
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size] || 'w-10 h-10';

  return (
    <div className={`relative shrink-0 ${dimensions} overflow-hidden rounded-full border border-white/10 bg-black/20 shadow-md`}>
      {/* Progressive loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-[pulse_1.5s_infinite]" />
      )}
      
      <motion.img
        src={logoImg}
        alt="Al-Manar University College Logo"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover select-none ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        whileHover={{
          scale: 1.08,
          filter: 'drop-shadow(0 0 8px var(--accent-glow))',
        }}
        transition={{ duration: 0.25 }}
      />
    </div>
  );
}
