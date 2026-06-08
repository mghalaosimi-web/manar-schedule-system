import React from 'react';
import { motion } from 'framer-motion';

export default function Logo({ size = 'md' }) {
  // Determine width and height classes based on size prop
  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }[size] || 'w-12 h-12';

  return (
    <motion.div
      className={`relative flex items-center justify-center shrink-0 ${dimensions}`}
      whileHover="hover"
    >
      {/* Background soft glow that matches the active theme */}
      <div className="absolute inset-0 bg-lime-500/20 rounded-full blur-[8px] opacity-0 group-hover:opacity-100 transition duration-300" />
      
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none drop-shadow-[0_0_15px_rgba(var(--primary-color-rgb),0.35)]"
      >
        {/* Outer Academic Shield / Crest Outline */}
        <motion.path
          d="M50 5 L85 20 V50 C85 75 50 95 50 95 C50 95 15 75 15 50 V20 L50 5 Z"
          stroke="url(#shieldGrad)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />

        {/* Dynamic Inner Shield Pattern */}
        <path
          d="M50 12 L77 24 V48 C77 67 50 84 50 84 C50 84 23 67 23 48 V24 L50 12 Z"
          fill="url(#shieldInnerGrad)"
          opacity="0.1"
        />

        {/* Torch Handle / Lighthouse Base */}
        <path
          d="M44 65 L40 80 H60 L56 65 H44 Z"
          fill="url(#shieldGrad)"
          stroke="rgba(var(--primary-color-rgb), 0.5)"
          strokeWidth="1.5"
        />
        
        {/* Torch Basket / Lighthouse Lantern Room */}
        <path
          d="M36 58 C36 58 43 65 50 65 C57 65 64 58 64 58 H36 Z"
          fill="url(#shieldGrad)"
        />

        {/* The Torch Flame / Lighthouse Ray of Light (Framer Motion Animated) */}
        {/* Flame Layer 1: Large Outer Fire Glow */}
        <motion.path
          d="M50 18 C50 18 64 36 60 52 C56 68 44 68 40 52 C36 36 50 18 50 18 Z"
          fill="url(#flameOuter)"
          opacity="0.8"
          variants={{
            hover: {
              scale: [1, 1.08, 0.96, 1.04, 1],
              y: [0, -3, 1, -2, 0],
              skewX: [0, 3, -3, 2, 0],
              transition: {
                repeat: Infinity,
                duration: 2.2,
                ease: 'easeInOut'
              }
            }
          }}
        />

        {/* Flame Layer 2: Core Inner Glowing Hot Fire */}
        <motion.path
          d="M50 28 C50 28 58 40 56 50 C54 60 46 60 44 50 C42 40 50 28 50 28 Z"
          fill="url(#flameInner)"
          variants={{
            hover: {
              scale: [1, 0.94, 1.06, 0.98, 1],
              y: [0, 2, -2, 1, 0],
              skewX: [0, -2, 2, -1, 0],
              transition: {
                repeat: Infinity,
                duration: 1.8,
                ease: 'easeInOut'
              }
            }
          }}
        />

        {/* Definitions for gradients */}
        <defs>
          {/* Main Shield Gradient using CSS custom variables */}
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--primary-color-rgb))" />
            <stop offset="100%" stopColor="rgb(var(--secondary-color-rgb))" />
          </linearGradient>

          {/* Inner Shield fill */}
          <linearGradient id="shieldInnerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--primary-color-rgb))" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>

          {/* Outer Flame Gradient */}
          <linearGradient id="flameOuter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--primary-color-rgb))" />
            <stop offset="60%" stopColor="rgb(var(--secondary-color-rgb))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(var(--secondary-color-rgb))" stopOpacity="0" />
          </linearGradient>

          {/* Inner Core Flame Gradient */}
          <linearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="rgb(var(--primary-color-rgb))" />
            <stop offset="100%" stopColor="rgb(var(--secondary-color-rgb))" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
