import React from 'react';
import { motion } from 'framer-motion';

/**
 * DevSignature — Premium "Developed by M.GH.AL" footer component.
 * Text-glitch + expand + glow animation on hover.
 */
export default function DevSignature({ centered = true }) {
  return (
    <motion.div
      className={`${centered ? 'text-center' : ''} py-1`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <span
        className="text-[10px] font-semibold tracking-[0.18em] uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        Developed by{' '}
      </span>
      <motion.a
        href="https://github.com/mghalaosimi-web"
        target="_blank"
        rel="noopener noreferrer"
        className="relative inline-block text-[10px] font-black tracking-[0.22em] uppercase cursor-pointer select-none"
        style={{ color: 'var(--accent)', textDecoration: 'none' }}
        whileHover="glitch"
        initial="idle"
      >
        {/* Main visible text */}
        <motion.span
          className="relative z-10 inline-block"
          variants={{
            idle: { textShadow: 'none', scale: 1 },
            glitch: {
              textShadow: [
                'none',
                '2px 0 0 #f87171, -2px 0 0 #60c4ff',
                '0 0 0 transparent',
                '-2px 0 0 #f87171, 2px 0 0 #60c4ff',
                '0 0 16px var(--accent)',
              ],
              scale: [1, 1.06, 1.02, 1.07, 1.04],
              transition: { duration: 0.55, ease: 'linear' },
            },
          }}
        >
          M.GH.AL
        </motion.span>

        {/* Glow underline that expands on hover */}
        <motion.span
          className="absolute bottom-0 left-0 h-[1.5px] rounded-full"
          style={{ background: 'var(--accent)' }}
          variants={{
            idle:   { width: '0%', opacity: 0 },
            glitch: { width: '100%', opacity: 1, boxShadow: '0 0 10px var(--accent)' },
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.a>
    </motion.div>
  );
}
