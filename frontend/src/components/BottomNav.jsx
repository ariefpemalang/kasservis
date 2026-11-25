import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Minus, 
  Wifi, 
  Wrench, 
  Layers, 
  User, 
  FileText 
} from 'lucide-react';

export default function BottomNav({ 
  currentBook, 
  setCurrentBook, 
  onAddIncome, 
  onAddExpense, 
  onOpenReport 
}) {
  const { isOwner, isKasir, isTeknisi } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-2xl safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        
        {/* Tombol Cepat Pemasukan [+] Hijau */}
        <button
          onClick={onAddIncome}
          className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Pemasukan</span>
        </button>

        {/* Tombol Cepat Pengeluaran [-] Merah */}
        <button
          onClick={onAddExpense}
          className="flex-1 py-3 px-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.97] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition"
        >
          <Minus className="w-5 h-5 stroke-[2.5]" />
          <span>Pengeluaran</span>
        </button>

      </div>
    </div>
  );
}
