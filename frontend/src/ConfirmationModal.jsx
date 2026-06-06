import React from 'react';

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'Cancel', options = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-850 dark:bg-gray-850 border border-gray-800 dark:border-gray-800 w-full max-w-sm rounded-xl p-6 shadow-2xl space-y-5 text-gray-200">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {options && options.length > 0 && (
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onConfirm(opt.value)}
                className="w-full py-2 bg-gray-850 hover:bg-gray-750 border border-gray-700 hover:border-lime-500 text-xs font-bold rounded-lg text-gray-300 hover:text-white transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white font-semibold text-xs rounded transition"
          >
            {cancelText}
          </button>
          {!options || options.length === 0 ? (
            <button
              onClick={() => onConfirm(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-400 text-black font-extrabold text-xs rounded shadow-md shadow-red-500/10 transition"
            >
              {confirmText}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
