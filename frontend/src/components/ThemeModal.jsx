import React from 'react';
import { PRIBADI_PALETTES } from '../utils/theme';
import { X, Check, Palette } from 'lucide-react';

export default function ThemeModal({ isOpen, onClose, selectedTheme, onSelectTheme }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm">Pilih Tema Buku Pribadi</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          <p className="text-xs text-slate-500 mb-3">
            Pilih warna tema favorit sesuai selera Anda khusus untuk Buku Kas Pribadi:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {Object.values(PRIBADI_PALETTES).map((pal) => {
              const isSelected = selectedTheme === pal.id;
              return (
                <button
                  key={pal.id}
                  onClick={() => {
                    onSelectTheme(pal.id);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border-2 flex items-center gap-2.5 text-left transition ${
                    isSelected ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div 
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: pal.colorHex }}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 leading-tight">{pal.name}</p>
                    <span className="text-[10px] text-slate-400">Pribadi</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}