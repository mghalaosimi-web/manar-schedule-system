import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

/**
 * ErrorModal — Global animated replacement for window.alert / window.confirm
 * Usage:
 *   <ErrorModal
 *     isOpen={bool}
 *     type="confirm" | "alert" | "error"
 *     title="..."
 *     message="..."
 *     onConfirm={() => {}}   // for confirm type
 *     onCancel={() => {}}
 *     confirmLabel="Delete"  // optional
 *     cancelLabel="Cancel"   // optional
 *   />
 */
export default function ErrorModal({
  isOpen,
  type = 'alert',     // 'alert' | 'confirm' | 'error'
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
}) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const iconMap = {
    alert:   { icon: '⚠', color: '#fbbf24', glow: 'rgba(251,191,36,0.18)'   },
    confirm: { icon: '?', color: 'var(--accent)', glow: 'rgba(222,255,154,0.15)' },
    error:   { icon: '✕', color: '#f87171', glow: 'rgba(248,113,113,0.18)'   },
  };
  const { icon, color, glow } = iconMap[type] || iconMap.alert;

  const defaultConfirm = confirmLabel || (isAr ? 'تأكيد' : 'Confirm');
  const defaultCancel  = cancelLabel  || (isAr ? 'إلغاء'  : 'Cancel');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={onCancel}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{    opacity: 0, scale: 0.92,  y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            dir={isAr ? 'rtl' : 'ltr'}
            className="relative w-full max-w-md frosted-panel rounded-2xl overflow-hidden"
            style={{ boxShadow: `0 0 80px ${glow}, 0 32px 64px rgba(0,0,0,0.6)` }}
          >
            {/* Top accent line */}
            <div className="h-0.5 w-full" style={{ background: color }} />

            <div className="p-8 space-y-6">
              {/* Icon + Title */}
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl font-black"
                  style={{ background: glow, color, border: `1px solid ${color}33` }}
                >
                  {icon}
                </motion.div>
                <div>
                  <h2 className="font-black text-lg leading-tight" style={{ color: '#fff' }}>
                    {title}
                  </h2>
                </div>
              </div>

              {/* Message */}
              {message && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {message}
                </p>
              )}

              {/* Actions */}
              <div className={`flex gap-3 ${isAr ? 'flex-row-reverse' : ''}`}>
                {type === 'confirm' && onConfirm && (
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${glow}` }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onConfirm}
                    className="flex-1 py-3 rounded-xl text-sm font-black transition-all"
                    style={{
                      background: type === 'confirm' ? 'rgba(248,113,113,0.12)' : color,
                      color: type === 'confirm' ? '#f87171' : '#000',
                      border: `1px solid ${type === 'confirm' ? 'rgba(248,113,113,0.35)' : 'transparent'}`,
                    }}
                  >
                    {defaultConfirm}
                  </motion.button>
                )}
                {type === 'error' && onConfirm && (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onConfirm}
                    className="flex-1 py-3 rounded-xl text-sm font-black"
                    style={{ background: color, color: '#000' }}
                  >
                    {defaultConfirm}
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onCancel}
                  className="flex-1 py-3 rounded-xl text-sm font-black btn-ghost"
                >
                  {type === 'alert' ? (isAr ? 'حسناً' : 'OK') : defaultCancel}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
