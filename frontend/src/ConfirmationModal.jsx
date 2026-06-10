import React from 'react';

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'Cancel', options = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="frosted-panel w-full max-w-sm rounded-xl p-6 shadow-2xl space-y-5 text-gray-250">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>
        </div>

        {options && options.length > 0 && (
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onConfirm(opt.value)}
                className="w-full py-3 bg-white/3 hover:bg-white/8 border border-[var(--border-color)] hover:border-[var(--accent)] text-xs font-bold rounded-lg text-gray-300 hover:text-white transition-all duration-200"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-white/3 hover:bg-white/8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs rounded-lg transition-all duration-200"
          >
            {cancelText}
          </button>
          {!options || options.length === 0 ? (
            <button
              onClick={() => onConfirm(true)}
              className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/35 border border-red-500/30 text-red-400 font-extrabold text-xs rounded-lg transition-all duration-200"
            >
              {confirmText}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
