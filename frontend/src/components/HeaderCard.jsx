import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../utils/format';
import { 
  Wifi, 
  Wrench, 
  User, 
  Layers, 
  ArrowUpRight, 
  ArrowDownLeft, 
  LogOut, 
  Users, 
  FileText,
  Settings
} from 'lucide-react';

export default function HeaderCard({ 
  currentBook, 
  setCurrentBook, 
  summary, 
  realtimeConnected,
  onOpenReport, 
  onOpenUserMgmt,
  onOpenConfig
}) {
  const { profile, logout, isOwner } = useAuth();

  let totalIncome = 0;
  let totalExpense = 0;
  let balance = 0;

  if (summary) {
    if (currentBook === 'ALL' && summary.grandTotal) {
      totalIncome = summary.grandTotal.totalIncome;
      totalExpense = summary.grandTotal.totalExpense;
      balance = summary.grandTotal.balance;
    } else if (summary.books && summary.books[currentBook]) {
      totalIncome = summary.books[currentBook].totalIncome;
      totalExpense = summary.books[currentBook].totalExpense;
      balance = summary.books[currentBook].balance;
    }
  }

  const getBookTitle = () => {
    switch (currentBook) {
      case 'WIFI': return 'Buku Kas WiFi';
      case 'SERVIS': return 'Buku Kas Servis';
      case 'PRIBADI': return 'Buku Kas Pribadi';
      default: return 'Ringkasan Semua Kas';
    }
  };

  const getBookIcon = () => {
    switch (currentBook) {
      case 'WIFI': return <Wifi className="w-5 h-5 text-blue-300" />;
      case 'SERVIS': return <Wrench className="w-5 h-5 text-amber-300" />;
      case 'PRIBADI': return <User className="w-5 h-5 text-purple-300" />;
      default: return <Layers className="w-5 h-5 text-emerald-300" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white rounded-b-3xl shadow-xl px-4 pt-5 pb-6">
      
      {/* Top Bar: Profile & Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-sm text-emerald-300">
            {profile?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight">{profile?.name || 'Pengguna'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-emerald-200 uppercase">
                {profile?.role === 'owner' ? 'Owner' : profile?.role === 'kasir_wifi' ? 'Kasir WiFi' : 'Teknisi'}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] text-white/70">
                {realtimeConnected ? 'Supabase Realtime' : 'Menghubungkan...'}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                onClick={onOpenUserMgmt}
                title="Kelola Akun Kasir & Teknisi"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 transition backdrop-blur-sm"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenReport}
                title="Laporan & Export"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 transition backdrop-blur-sm"
              >
                <FileText className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={onOpenConfig}
            title="Pengaturan Supabase"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/90 transition backdrop-blur-sm"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={logout}
            title="Keluar"
            className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Book Switcher Tabs (HANYA MUNCUL UNTUK OWNER) */}
      {isOwner && (
        <div className="flex bg-black/25 p-1 rounded-2xl mb-4 text-xs font-medium backdrop-blur-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => setCurrentBook('ALL')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 whitespace-nowrap ${
              currentBook === 'ALL' ? 'bg-emerald-500 text-white font-bold shadow' : 'text-white/70 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Kas</span>
          </button>
          <button
            onClick={() => setCurrentBook('WIFI')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 whitespace-nowrap ${
              currentBook === 'WIFI' ? 'bg-blue-600 text-white font-bold shadow' : 'text-white/70 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Kas WiFi</span>
          </button>
          <button
            onClick={() => setCurrentBook('SERVIS')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 whitespace-nowrap ${
              currentBook === 'SERVIS' ? 'bg-amber-600 text-white font-bold shadow' : 'text-white/70 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Kas Servis</span>
          </button>
          <button
            onClick={() => setCurrentBook('PRIBADI')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 whitespace-nowrap ${
              currentBook === 'PRIBADI' ? 'bg-purple-600 text-white font-bold shadow' : 'text-white/70 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Kas Pribadi</span>
          </button>
        </div>
      )}

      {/* Main Balance Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shadow-inner">
        <div className="flex items-center justify-between text-xs text-white/80 mb-1">
          <div className="flex items-center gap-1.5 font-medium">
            {getBookIcon()}
            <span>{getBookTitle()}</span>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
            {balance >= 0 ? 'Surplus' : 'Defisit'}
          </span>
        </div>

        {/* Saldo Nominal */}
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white my-1 font-mono">
          {formatRupiah(balance)}
        </div>

        {/* Income vs Expense Split */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/70">Pemasukan (+)</p>
              <p className="font-bold text-emerald-300 font-mono text-xs sm:text-sm">
                {formatRupiah(totalIncome)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/70">Pengeluaran (-)</p>
              <p className="font-bold text-rose-300 font-mono text-xs sm:text-sm">
                {formatRupiah(totalExpense)}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
