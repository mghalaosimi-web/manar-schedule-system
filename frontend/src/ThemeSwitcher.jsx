import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEMES = [
  {
    id: 'default',
    class: '',
    nameEn: 'Neon Lime',
    nameAr: 'الليموني النيون',
    color: '#deff9a'
  },
  {
    id: 'purple',
    class: 'theme-purple',
    nameEn: 'Royal Amethyst',
    nameAr: 'الجمشت الملكي',
    color: '#a855f7'
  },
  {
    id: 'blue',
    class: 'theme-blue',
    nameEn: 'Oceanic Sapphire',
    nameAr: 'الياقوت الأزرق',
    color: '#3b82f6'
  },
  {
    id: 'amber',
    class: 'theme-amber',
    nameEn: 'Amber Glow',
    nameAr: 'الوهج الكهرماني',
    color: '#f59e0b'
  }
];

export default function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('manar_theme') || 'default';
  });
  
  // Theme modes: 'dark' | 'light' | 'system'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('manar_theme_mode') || 'dark';
  });

  const isRtl = document.documentElement.dir === 'rtl';

  // Apply theme color class
  useEffect(() => {
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

  // Apply dark/light/system theme mode
  useEffect(() => {
    const htmlEl = document.documentElement;
    localStorage.setItem('manar_theme_mode', themeMode);

    const applyMode = (mode) => {
      if (mode === 'light') {
        htmlEl.classList.add('light');
      } else if (mode === 'dark') {
        htmlEl.classList.remove('light');
      }
    };

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = (e) => {
        applyMode(e.matches ? 'dark' : 'light');
      };
      
      // Initial apply
      applyMode(mediaQuery.matches ? 'dark' : 'light');
      
      // Listen to system changes
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else {
      applyMode(themeMode);
    }

    // Trigger custom event to notify other components (like Settings.jsx)
    window.dispatchEvent(new Event('themeModeChanged'));
  }, [themeMode]);

  // Listen to external theme mode changes
  useEffect(() => {
    const handleModeChange = () => {
      const currentMode = localStorage.getItem('manar_theme_mode') || 'dark';
      if (currentMode !== themeMode) {
        setThemeMode(currentMode);
      }
    };
    window.addEventListener('themeModeChanged', handleModeChange);
    return () => window.removeEventListener('themeModeChanged', handleModeChange);
  }, [themeMode]);

  const cycleMode = () => {
    setThemeMode(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  const getModeLabel = () => {
    if (themeMode === 'light') return isRtl ? '☀️ النهار' : '☀️ Day';
    if (themeMode === 'dark') return isRtl ? '🌙 الليل' : '🌙 Night';
    return isRtl ? '💻 تلقائي' : '💻 System';
  };

  const currentTheme = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 transition-all duration-200"
        title="Change Theme & Appearance"
      >
        <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/20" style={{ backgroundColor: currentTheme.color }} />
        <span>{themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '💻'}</span>
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
              className={`absolute mt-2 w-56 bg-gray-950 border border-white/10 rounded-2xl p-2.5 shadow-2xl z-50 ${
                isRtl ? 'left-0' : 'right-0'
              }`}
            >
              <div className="px-3 py-1.5 border-b border-white/5 mb-1.5 text-[9px] font-black tracking-widest text-gray-500 uppercase text-right">
                {isRtl ? 'مظهر الألوان' : 'Color Theme'}
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
                      style={isSelected ? {
                        backgroundColor: 'var(--accent-dim)',
                        color: 'var(--accent)',
                        borderColor: 'var(--accent-glow)'
                      } : {}}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                        isSelected 
                          ? '' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-3.5 h-3.5 rounded-full ring-2 ring-white/10" style={{ backgroundColor: theme.color }} />
                        <span>{isRtl ? theme.nameAr : theme.nameEn}</span>
                      </div>
                      {isSelected && <span style={{ color: 'var(--accent)' }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Day/Night Mode Switcher section */}
              <div className="border-t border-white/5 mt-2.5 pt-2.5 flex items-center justify-between px-3 text-xs">
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  {isRtl ? 'وضع المظهر' : 'Appearance'}
                </span>
                <button
                  type="button"
                  onClick={cycleMode}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 font-bold text-[10px] text-gray-300 transition-all duration-200"
                >
                  {getModeLabel()}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
