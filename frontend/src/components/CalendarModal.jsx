import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X,
  Utensils,
  Wine,
  Bus,
  ShoppingCart,
  Receipt,
  PiggyBank,
  Heart,
  Smile,
  Wrench,
  Wifi,
  Smartphone,
  DollarSign
} from 'lucide-react';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function CalendarModal({
  isOpen,
  onClose,
  currentBook = 'WIFI',
  currentTheme,
  selectedYear = 2026,
  selectedMonth = 11,
  onChangeMonth,
  transactions = [],
  onAddNew,
  onEditTransaction
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  // Tema warna top bar & FAB berdasarkan Buku Kas
  const themeColor = useMemo(() => {
    if (currentBook === 'WIFI') {
      return {
        headerBg: 'bg-[#f43f5e] text-white',
        fabBg: 'bg-[#f43f5e] hover:bg-[#e11d48] text-white shadow-rose-500/30',
        activePill: 'bg-[#f43f5e] text-white'
      };
    }
    if (currentBook === 'SERVIS') {
      return {
        headerBg: 'bg-blue-600 text-white',
        fabBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30',
        activePill: 'bg-blue-600 text-white'
      };
    }
    // Buku Pribadi
    return {
      headerBg: currentTheme?.headerGradient ? `bg-gradient-to-r ${currentTheme.headerGradient} text-white` : 'bg-purple-600 text-white',
      fabBg: currentTheme?.primaryBg ? `${currentTheme.primaryBg} text-white shadow-purple-500/30` : 'bg-purple-600 text-white',
      activePill: currentTheme?.primaryBg || 'bg-purple-600 text-white'
    };
  }, [currentBook, currentTheme]);

  // Kelompokkan transaksi per tanggal dalam bulan yang dipilih
  const dailyData = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const dateStr = tx.date ? tx.date.slice(0, 10) : '';
      if (!dateStr) return;

      const amt = parseFloat(tx.amount) || 0;
      const isIncome = tx.type === 'INCOME' || tx.type === 'in';

      if (!map[dateStr]) {
        map[dateStr] = {
          totalIncome: 0,
          totalExpense: 0,
          items: []
        };
      }

      if (isIncome) {
        map[dateStr].totalIncome += amt;
      } else {
        map[dateStr].totalExpense += amt;
      }
      map[dateStr].items.push(tx);
    });
    return map;
  }, [transactions]);

  // Format angka ringkas untuk kalender (misal 515.000 atau 1.030....)
  const formatCompactAmount = (amt) => {
    if (!amt || isNaN(amt)) return '';
    const rounded = Math.round(amt);
    const str = rounded.toLocaleString('id-ID');
    if (str.length > 7) {
      return str.slice(0, 5) + '...';
    }
    return str;
  };

  // Hitung jumlah hari dan hari pertama dalam bulan
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const startDayOfWeek = useMemo(() => {
    // 0 = Minggu (Min), 1 = Senin (Sen), dst.
    return new Date(selectedYear, selectedMonth - 1, 1).getDay();
  }, [selectedYear, selectedMonth]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER (Pink untuk WiFi, Biru untuk Servis) */}
      <div className={`px-4 py-3.5 ${themeColor.headerBg} flex items-center justify-between shadow-md`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-lg font-bold tracking-wide">
            Kalender
          </h1>
        </div>

        {/* Dropdown Pemilih Bulan & Tahun */}
        <button 
          onClick={() => setPickerOpen(!pickerOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/20 font-bold text-sm transition active:scale-95"
        >
          <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* POPUP DROPDOWN PEMILIH BULAN & TAHUN */}
      {pickerOpen && (
        <div className="bg-slate-50 border-b border-slate-200 p-4 animate-in slide-in-from-top-2 shadow-inner">
          <div className="max-w-md mx-auto">
            {/* Navigasi Tahun */}
            <div className="flex items-center justify-between mb-3 px-2">
              <button 
                onClick={() => onChangeMonth(selectedYear - 1, selectedMonth)}
                className="p-1 text-slate-600 hover:text-slate-900 font-bold"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-extrabold text-sm text-slate-800">{selectedYear}</span>
              <button 
                onClick={() => onChangeMonth(selectedYear + 1, selectedMonth)}
                className="p-1 text-slate-600 hover:text-slate-900 font-bold"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Grid 12 Bulan */}
            <div className="grid grid-cols-6 gap-2 text-xs text-center">
              {MONTH_NAMES.map((name, idx) => {
                const mNum = idx + 1;
                const isSelected = selectedMonth === mNum;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      onChangeMonth(selectedYear, mNum);
                      setPickerOpen(false);
                    }}
                    className={`py-1.5 rounded-xl font-bold transition ${
                      isSelected 
                        ? `${themeColor.activePill} shadow-md` 
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. BODY KALENDER */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 max-w-md w-full mx-auto flex flex-col">
        
        {/* Header Nama Hari: Min  Sen  Sel  Rab  Kam  Jum  Sab */}
        <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-slate-700">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Tanggal Kalender (7 Kolom) */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Kotak kosong sebelum tanggal 1 */}
          {Array.from({ length: startDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-16 sm:h-20" />
          ))}

          {/* Kotak Tanggal 1 s.d. Akhir Bulan */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayData = dailyData[dateStr];
            const hasIncome = dayData && dayData.totalIncome > 0;
            const hasExpense = dayData && dayData.totalExpense > 0;
            const hasTx = hasIncome || hasExpense;

            return (
              <div
                key={dateStr}
                onClick={() => {
                  if (dayData && dayData.items.length > 0) {
                    setSelectedDayDetail({ dateStr, dayNum, dayData });
                  }
                }}
                className={`h-16 sm:h-20 rounded-xl p-1 flex flex-col justify-between transition-all cursor-pointer ${
                  hasTx 
                    ? 'bg-[#dcfce7] border border-[#bbf7d0] hover:bg-[#bbf7d0]/60 active:scale-95 shadow-2xs' 
                    : 'bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80'
                }`}
              >
                {/* Angka Tanggal */}
                <div className="text-center font-bold text-xs sm:text-sm text-slate-800 leading-none pt-0.5">
                  {dayNum}
                </div>

                {/* Info Finansial Transaksi */}
                <div className="flex flex-col text-center justify-end overflow-hidden pb-0.5">
                  {/* Pemasukan (Hijau) */}
                  {hasIncome && (
                    <span className="text-[10px] font-bold text-[#16a34a] leading-tight truncate">
                      {formatCompactAmount(dayData.totalIncome)}
                    </span>
                  )}
                  {/* Pengeluaran (Merah) */}
                  {hasExpense && (
                    <span className="text-[10px] font-bold text-[#ef4444] leading-tight truncate">
                      {formatCompactAmount(dayData.totalExpense)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* 3. FLOATING ACTION BUTTON (+) DI KANAN BAWAH */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30">
        <button
          onClick={() => {
            if (onAddNew) onAddNew();
          }}
          className={`w-14 h-14 rounded-full ${themeColor.fabBg} shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all`}
          title="Tambah Transaksi"
        >
          <Plus className="w-8 h-8 stroke-[3.5]" />
        </button>
      </div>

      {/* 4. MODAL POPUP DETAIL TRANSAKSI HARI TERPILIH */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white text-slate-800 w-full sm:max-w-md max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            {/* Header Popup Hari */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedDayDetail.dayNum} {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h3>
                <div className="flex items-center gap-2 text-[11px] mt-0.5 font-semibold">
                  <span className="text-emerald-600">
                    Masuk: {selectedDayDetail.dayData.totalIncome.toLocaleString('id-ID')}
                  </span>
                  <span>•</span>
                  <span className="text-rose-600">
                    Keluar: {selectedDayDetail.dayData.totalExpense.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDayDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Transaksi Hari Ini */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
              {selectedDayDetail.dayData.items.map((tx) => {
                const isInc = tx.type === 'INCOME' || tx.type === 'in';
                return (
                  <div 
                    key={tx.id}
                    onClick={() => {
                      if (onEditTransaction) {
                        onEditTransaction(tx);
                        setSelectedDayDetail(null);
                      }
                    }}
                    className="pt-2 pb-1 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 rounded-lg px-2 transition"
                  >
                    <div>
                      <p className="font-semibold text-xs text-slate-800">
                        {tx.notes || tx.category}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {tx.category} {tx.user_name ? `• @${tx.user_name}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${isInc ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isInc ? '+' : '-'}{Number(tx.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
