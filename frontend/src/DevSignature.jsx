import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * DevSignature — Premium "Developed by M.GH.AL" footer component.
 * Text-glitch + expand + glow animation on hover.
 */
export default function DevSignature({ centered = true }) {
  const { i18n } = useTranslation();
  const isAr = i18n?.language === 'ar';

  return (
    <motion.div
      className={`${centered ? 'text-center' : ''} py-1.5 flex items-center justify-center gap-1.5 flex-wrap`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <span
        className="text-[11px] font-black tracking-[0.20em] uppercase text-gray-500"
      >
        {isAr ? 'برمجة وتطوير ' : 'Developed by '}
      </span>
      <motion.a
        href="https://github.com/mghalaosimi-web"
        target="_blank"
        rel="noopener noreferrer"
        className="relative inline-block text-[12px] md:text-[13px] font-black tracking-[0.25em] uppercase cursor-pointer select-none"
        style={{ 
          color: 'var(--accent)', 
          textDecoration: 'none',
          textShadow: '0 0 10px var(--accent-glow)'
        }}
        whileHover="glitch"
        initial="idle"
      >
        {/* Main visible text */}
        <motion.span
          className="relative z-10 inline-block font-extrabold"
          variants={{
            idle: { textShadow: '0 0 8px var(--accent-glow)', scale: 1 },
            glitch: {
              textShadow: [
                '0 0 8px var(--accent-glow)',
                '2px 0 0 #f87171, -2px 0 0 #60c4ff',
                '0 0 20px var(--accent)',
                '-2px 0 0 #f87171, 2px 0 0 #60c4ff',
                '0 0 24px var(--accent)',
              ],
              scale: [1, 1.08, 1.03, 1.1, 1.05],
              transition: { duration: 0.55, ease: 'linear', repeat: Infinity, repeatType: 'reverse' },
            },
          }}
        >
          M.GH.AL
        </motion.span>
 
        {/* Glow underline that expands on hover */}
        <motion.span
          className="absolute bottom-[-2px] left-0 h-[2px] rounded-full"
          style={{ background: 'var(--accent)' }}
          variants={{
            idle:   { width: '0%', opacity: 0 },
            glitch: { width: '100%', opacity: 1, boxShadow: '0 0 14px var(--accent)' },
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.a>
    </motion.div>
  );
}
