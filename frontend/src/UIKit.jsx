import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/* ── Page transition wrapper — wrap any page content with this ── */
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: -12 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

/* ── Minimalist loading spinner ─────────────────────────────── */
export function Spinner({ size = 28, color = 'var(--accent)', label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid rgba(255,255,255,0.06)`,
          borderTop: `2px solid ${color}`,
        }}
      />
      {label && (
        <p className="text-[10px] font-black tracking-[0.25em] uppercase"
           style={{ color: 'var(--text-secondary)' }}>
          {label}
        </p>
      )}
    </div>
  );
}

/* ── Skeleton block (for card loading) ─────────────────────── */
export function SkeletonBlock({ height = 80, rounded = 12 }) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      style={{
        height,
        borderRadius: rounded,
        background: 'var(--border-color)',
      }}
    />
  );
}

/* ── Hover button wrapper ───────────────────────────────────── */
export function NeonButton({ children, onClick, disabled, className = '', style = {}, variant = 'neon' }) {
  const baseStyle = variant === 'neon'
    ? { background: 'var(--accent)', color: '#000' }
    : { background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.04, boxShadow: '0 0 24px var(--accent-glow)' }}
      whileTap={disabled  ? {} : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`font-black rounded-xl transition-colors ${className}`}
      style={{ ...baseStyle, ...style, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {children}
    </motion.button>
  );
}
