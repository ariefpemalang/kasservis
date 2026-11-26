import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  Search, 
  Calendar, 
  ChevronDown, 
  Wifi, 
  Wrench, 
  User, 
  Layers, 
  X, 
  LogOut, 
  Users, 
  Tag, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Palette
} from 'lucide-react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function HeaderCard({ 
  currentBook, 
  setCurrentBook, 
  currentTheme,
  summary, 
  realtimeConnected,
  selectedYear,
  selectedMonth,
  onChangeMonth,
  searchVisible,
  setSearchVisible,
  onOpenReport, 
  onOpenUserMgmt,
  onOpenConfig,
  onOpenCategories,
  onOpenThemeModal,
  onOpenCalendar
}) {
  const { profile, logout, isOwner, isKasir, isTeknisi } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  // Ambil data total dari summary berdasarkan filter buku
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

  const formatNumberOnly = (val) => {
    if (!val || isNaN(val)) return '0';
    return Number(val).toLocaleString('id-ID');
  };

  const getBookTitle = () => {
    switch (currentBook) {
      case 'SERVIS': return 'SERVICE';
      case 'WIFI': return 'WIFI';
      case 'PRIBADI': return 'PRIBADI';
      default: return 'SEMUA KAS';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${currentTheme?.headerGradient || 'from-blue-600 via-sky-600 to-blue-500'} text-white shadow-md transition-all duration-300`}>
      
      {/* Top Bar: Hamburger Menu, Title, Icons */}
      <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDrawerOpen(true)}
            className="p-1 hover:bg-white/20 rounded-lg transition"
            title="Menu & Pilih Buku Kas"
          >
            <Menu className="w-6 h-6 stroke-[2.5]" />
          </button>
          
          <h1 className="text-lg font-black tracking-wider uppercase drop-shadow-sm">
            {getBookTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-1">
          {/* Tombol Pemilih Tema (Khusus Buku Kas Pribadi) */}
          {currentBook === 'PRIBADI' && (
            <button
              onClick={onOpenThemeModal}
              className="p-2 rounded-full hover:bg-white/15 text-white/90 transition"
              title="Ganti Tema Warna Pribadi"
            >
              <Palette className="w-5 h-5" />
            </button>
          )}

          {/* Tombol Toggle Pencarian */}
          <button 
            onClick={() => setSearchVisible(!searchVisible)}
            className={`p-2 rounded-full transition ${searchVisible ? 'bg-white/30 text-white' : 'hover:bg-white/15 text-white/90'}`}
            title="Cari Transaksi"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Tombol Kalender Transaksi (Kanan Atas) */}
          <button 
            onClick={() => {
              if (onOpenCalendar) onOpenCalendar();
              else setMonthPickerOpen(!monthPickerOpen);
            }}
            className="p-2 rounded-full hover:bg-white/15 text-white/90 transition active:scale-95"
            title="Buka Kalender Transaksi"
          >
            <Calendar className="w-5 h-5" />
          </button>

          {/* Status Realtime Indicator */}
          <div className="p-2 flex items-center justify-center" title={realtimeConnected ? 'Supabase Terhubung' : 'Menghubungkan...'}>
            <span className={`w-3 h-3 rounded-full border-2 border-white ${realtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          </div>
        </div>
      </div>

      {/* Sub-Header: Month Selector Pill & 3 Financial Columns */}
      <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-2">
        
        {/* Month & Year Button: e.g. 2026 Nov v */}
        <button
          onClick={() => setMonthPickerOpen(!monthPickerOpen)}
          className="bg-white/20 hover:bg-white/25 active:scale-95 border border-white/25 rounded-xl px-3 py-1.5 flex flex-col items-center justify-center transition shadow-xs min-w-[70px]"
        >
          <span className="text-[10px] text-white/80 font-medium leading-none">{selectedYear}</span>
          <div className="flex items-center gap-1 text-sm font-bold text-white leading-tight mt-0.5">
            <span>{MONTH_NAMES[selectedMonth - 1]}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </div>
        </button>

        {/* 3 Columns: Pengeluaran, Pemasukan, Saldo */}
        <div className="flex-1 grid grid-cols-3 gap-1 text-right">
          <div>
            <p className="text-[11px] text-white/85 font-medium leading-tight">Pengeluaran</p>
            <p className="text-xs sm:text-sm font-bold text-white tracking-tight mt-0.5 font-mono">
              {formatNumberOnly(totalExpense)}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-white/85 font-medium leading-tight">Pemasukan</p>
            <p className="text-xs sm:text-sm font-bold text-white tracking-tight mt-0.5 font-mono">
              {formatNumberOnly(totalIncome)}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-white/85 font-medium leading-tight">Saldo</p>
            <p className="text-xs sm:text-sm font-bold text-white tracking-tight mt-0.5 font-mono">
              {formatNumberOnly(balance)}
            </p>
          </div>
        </div>

      </div>

      {/* Popover / Dropdown Pemilih Bulan & Tahun */}
      {monthPickerOpen && (
        <div className="bg-slate-900/95 text-white p-3 border-t border-white/20 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10 text-xs">
            <button 
              onClick={() => onChangeMonth(selectedYear - 1, selectedMonth)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-sky-300">{selectedYear}</span>
            <button 
              onClick={() => onChangeMonth(selectedYear + 1, selectedMonth)}
              className="p-1 hover:bg-white/10 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-6 gap-1.5 text-xs text-center">
            {MONTH_NAMES.map((name, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonth === mNum;
              return (
                <button
                  key={name}
                  onClick={() => {
                    onChangeMonth(selectedYear, mNum);
                    setMonthPickerOpen(false);
                  }}
                  className={`py-1.5 rounded-lg font-semibold transition ${
                    isSelected ? 'bg-sky-500 text-white shadow' : 'bg-white/10 hover:bg-white/20 text-white/80'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sidebar Drawer (Slide dari Kiri) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-white text-slate-800 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            
            {/* Header Drawer */}
            <div className={`p-4 ${currentBook === 'WIFI' ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500' : (currentTheme?.headerGradient || 'from-blue-600 to-sky-600')} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-bold tracking-wider text-white/80">Buku Kas & Servis</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-base text-white border border-white/30">
                  {profile?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-snug">{profile?.name || 'Pengguna'}</h3>
                  <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-semibold uppercase">
                    {profile?.role === 'owner' ? 'Owner / Admin' : profile?.role === 'kasir_wifi' ? 'Kasir WiFi' : 'Teknisi Servis'}
                  </span>
                </div>
              </div>
            </div>

            {/* Body Drawer */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Pilihan Buku Kas (Khusus Owner) */}
              {isOwner && (
                <div>
                  <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">Pilih Buku Kas</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setCurrentBook('SERVIS'); setDrawerOpen(false); }}
                      className={`w-full p-2.5 rounded-xl font-bold flex items-center gap-2.5 transition ${
                        currentBook === 'SERVIS' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Wrench className="w-4 h-4 text-amber-500" />
                      <span>Buku Servis (SERVICE)</span>
                    </button>

                    <button
                      onClick={() => { setCurrentBook('WIFI'); setDrawerOpen(false); }}
                      className={`w-full p-2.5 rounded-xl font-bold flex items-center gap-2.5 transition ${
                        currentBook === 'WIFI' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Wifi className="w-4 h-4 text-pink-500" />
                      <span>Buku Kas WiFi</span>
                    </button>

                    <button
                      onClick={() => { setCurrentBook('PRIBADI'); setDrawerOpen(false); }}
                      className={`w-full p-2.5 rounded-xl font-bold flex items-center gap-2.5 transition ${
                        currentBook === 'PRIBADI' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <User className="w-4 h-4 text-purple-500" />
                      <span>Buku Kas Pribadi</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Menu Lain */}
              <div>
                <p className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-2">Pengaturan & Fitur</p>
                <div className="space-y-1">
                  {/* Pilihan Tema Pribadi jika di Buku Pribadi */}
                  {currentBook === 'PRIBADI' && (
                    <button
                      onClick={() => { onOpenThemeModal(); setDrawerOpen(false); }}
                      className="w-full p-2.5 rounded-xl font-medium flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition"
                    >
                      <Palette className="w-4 h-4 text-purple-600" />
                      <span>Ganti Tema Warna Pribadi</span>
                    </button>
                  )}

                  {/* Hanya Superadmin (Owner) yang bisa kelola kategori (Hanya di Buku Pribadi) */}
                  {isOwner && currentBook === 'PRIBADI' && (
                    <button
                      onClick={() => { onOpenCategories(); setDrawerOpen(false); }}
                      className="w-full p-2.5 rounded-xl font-medium flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition"
                    >
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>Kelola Kategori</span>
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={() => { onOpenUserMgmt(); setDrawerOpen(false); }}
                      className="w-full p-2.5 rounded-xl font-medium flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Kelola Akun Kasir & Teknisi</span>
                    </button>
                  )}

                  {/* Konfigurasi Supabase: Hanya muncul di Buku Kas Pribadi untuk Owner */}
                  {isOwner && currentBook === 'PRIBADI' && (
                    <button
                      onClick={() => { onOpenConfig(); setDrawerOpen(false); }}
                      className="w-full p-2.5 rounded-xl font-medium flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Konfigurasi Supabase</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Drawer: Logout */}
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={logout}
                className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}