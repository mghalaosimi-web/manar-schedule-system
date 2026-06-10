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
    <motion.div 
      className={`relative shrink-0 ${dimensions} overflow-hidden rounded-full border border-white/10 bg-black/20 shadow-md`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Progressive loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 animate-shimmer" />
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

      {/* Repeating premium shimmer shine overlay */}
      {loaded && (
        <motion.div
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ left: '-150%' }}
          animate={{ left: '150%' }}
          transition={{
            duration: 1.8,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 4
          }}
        />
      )}
    </motion.div>
  );
}
