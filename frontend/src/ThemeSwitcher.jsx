import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = [
  {
    id: 'default',
    class: '',
    nameEn: 'Emerald Oasis',
    nameAr: 'الواحة الزمردية',
    colorClass: 'bg-emerald-500'
  },
  {
    id: 'purple',
    class: 'theme-purple',
    nameEn: 'Royal Amethyst',
    nameAr: 'الجمشت الملكي',
    colorClass: 'bg-purple-500'
  },
  {
    id: 'blue',
    class: 'theme-blue',
    nameEn: 'Oceanic Sapphire',
    nameAr: 'الياقوت الأزرق',
    colorClass: 'bg-blue-500'
  },
  {
    id: 'amber',
    class: 'theme-amber',
    nameEn: 'Amber Glow',
    nameAr: 'الوهج الكهرماني',
    colorClass: 'bg-amber-500'
  }
];

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('manar_theme') || 'default';
  });

  const isRtl = document.documentElement.dir === 'rtl';

  useEffect(() => {
    // Apply theme class to <html> element
    const htmlEl = document.documentElement;
    THEMES.forEach(t => {
      if (t.class) {
        htmlEl.classList.remove(t.class);
      }
    });

    const selected = THEMES.find(t => t.id === activeTheme);
    if (selected && selected.class) {
      htmlEl.classList.add(selected.class);
    }
    localStorage.setItem('manar_theme', activeTheme);
  }, [activeTheme]);

  const currentTheme = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 transition-all duration-200"
        title="Change Color Theme"
      >
        <span className={`w-3.5 h-3.5 rounded-full ${currentTheme.colorClass} ring-2 ring-white/20`} />
        <span className="hidden sm:inline">
          {isRtl ? currentTheme.nameAr : currentTheme.nameEn}
        </span>
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click to close */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            {/* Dropdown Card */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute mt-2 w-52 bg-gray-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl z-50 ${
                isRtl ? 'left-0' : 'right-0'
              }`}
            >
              <div className="px-3 py-1.5 border-b border-white/5 mb-1 text-[9px] font-black tracking-widest text-gray-500 uppercase">
                {isRtl ? 'اختر مظهر الألوان' : 'Select Color Theme'}
              </div>
              
              <div className="space-y-1">
                {THEMES.map(theme => {
                  const isSelected = theme.id === activeTheme;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setActiveTheme(theme.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        isSelected 
                          ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full ${theme.colorClass} ring-2 ring-white/10`} />
                        <span>{isRtl ? theme.nameAr : theme.nameEn}</span>
                      </div>
                      {isSelected && <span className="text-lime-400">✓</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
