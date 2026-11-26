import React, { useState, useMemo } from 'react';
import { formatRupiah, formatDateTime } from '../utils/format';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Trash2, 
  Edit3, 
  Image as ImageIcon,
  X,
  Calendar,
  Clock
} from 'lucide-react';

export default function TransactionList({ 
  transactions, 
  loading, 
  onEdit, 
  onDelete, 
  filterType, 
  setFilterType, 
  search, 
  setSearch,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const getBookBadge = (book) => {
    switch (book) {
      case 'WIFI':
        return <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">WiFi</span>;
      case 'SERVIS':
        return <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">Servis</span>;
      case 'PRIBADI':
        return <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-semibold">Pribadi</span>;
      default:
        return null;
    }
  };

  // Helper untuk format teks tanggal pembatas
  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === '1970-01-01') return 'Tanpa Tanggal';

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const formatted = d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      if (dateStr === today) {
        return `Hari Ini • ${formatted}`;
      } else if (dateStr === yesterday) {
        return `Kemarin • ${formatted}`;
      }
      return formatted;
    }
    return dateStr;
  };

  // Helper untuk format jam
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Mengelompokkan transaksi per tanggal dan menghitung total masuk & keluar harian
  const groupedTransactions = useMemo(() => {
    const groups = [];
    const dateMap = {};

    transactions.forEach((tx) => {
      const rawDate = tx.date ? tx.date.slice(0, 10) : '1970-01-01';
      const isIncome = (tx.type === 'INCOME' || tx.type === 'in');
      const amt = parseFloat(tx.amount) || 0;

      if (!dateMap[rawDate]) {
        dateMap[rawDate] = {
          dateStr: rawDate,
          totalIncome: 0,
          totalExpense: 0,
          items: []
        };
        groups.push(dateMap[rawDate]);
      }

      if (isIncome) {
        dateMap[rawDate].totalIncome += amt;
      } else {
        dateMap[rawDate].totalExpense += amt;
      }

      dateMap[rawDate].items.push(tx);
    });

    return groups;
  }, [transactions]);

  return (
    <div className="px-4 py-3 pb-28">
      {/* Search & Filter Bar */}
      <div className="space-y-2 mb-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi / keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Type Tabs & Date Inputs */}
        <div className="flex items-center justify-between gap-2">
          {/* Type Buttons: Semua / Masuk (Hijau) / Keluar (Merah) */}
          <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${filterType === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('INCOME')}
              className={`px-2.5 py-1 rounded-md transition ${filterType === 'INCOME' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Masuk
            </button>
            <button
              onClick={() => setFilterType('EXPENSE')}
              className={`px-2.5 py-1 rounded-md transition ${filterType === 'EXPENSE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Keluar
            </button>
          </div>

          {/* Quick Date Inputs */}
          <div className="flex items-center gap-1 text-[11px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs">Memuat catatan kas...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-300 mt-2">
          <p className="text-xs font-medium text-slate-500">Belum ada catatan transaksi</p>
          <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol [+] atau [-] di bawah untuk mencatat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedTransactions.map((group) => (
            <div key={group.dateStr} className="space-y-2">
              
              {/* TANGGAL PEMBATAS DENGAN SALDO KELUAR & MASUK KECIL DI PINGGIR */}
              <div className="flex items-center justify-between pt-2 pb-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateLabel(group.dateStr)}</span>
                </div>
                
                {/* Saldo Masuk (+) & Keluar (-) Kecil di Pinggir Kanan */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {group.totalIncome > 0 && (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200/80 shadow-xs">
                      Masuk: +{formatRupiah(group.totalIncome)}
                    </span>
                  )}
                  {group.totalExpense > 0 && (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold border border-rose-200/80 shadow-xs">
                      Keluar: -{formatRupiah(group.totalExpense)}
                    </span>
                  )}
                </div>
              </div>

              {/* Daftar Transaksi dalam Tanggal Ini */}
              <div className="space-y-2">
                {group.items.map((tx) => {
                  const isIncome = (tx.type === 'INCOME' || tx.type === 'in');
                  const timeStr = formatTime(tx.date);

                  return (
                    <div 
                      key={tx.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Garis Aksen Kiri: HIJAU untuk Pemasukan, MERAH untuk Pengeluaran */}
                      <div 
                        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      />

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {/* Ikon: Panah Hijau untuk Masuk, Panah Merah untuk Keluar */}
                          <div 
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isIncome ? <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />}
                          </div>

                          {/* Detail Transaksi */}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-slate-800">
                                {tx.category}
                              </span>
                              {getBookBadge(tx.book)}
                            </div>

                            {tx.notes && (
                              <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                                {tx.notes}
                              </p>
                            )}

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1.5">
                              {timeStr && (
                                <>
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{timeStr}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>Oleh: <strong className="text-slate-600">{tx.user_name || 'User'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Nominal Transaksi: HIJAU (+) untuk Pemasukan, MERAH (-) untuk Pengeluaran */}
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold font-mono text-sm sm:text-base ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                          </p>

                          <div className="flex items-center justify-end gap-1.5 mt-2">
                            {tx.receipt_url && (
                              <button
                                onClick={() => setSelectedReceipt(tx.receipt_url)}
                                className="p-1 text-slate-500 hover:text-emerald-600 rounded bg-slate-50 hover:bg-emerald-50 border border-slate-200"
                                title="Lihat Bukti Struk"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onEdit(tx)}
                              className="p-1 text-slate-500 hover:text-blue-600 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200"
                              title="Edit Catatan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDelete(tx.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded bg-slate-50 hover:bg-rose-50 border border-slate-200"
                              title="Hapus Catatan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modal Popup Gambar Struk/Nota */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <span className="font-semibold text-xs text-slate-700">Bukti Struk / Nota</span>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img 
                src={selectedReceipt} 
                alt="Foto Struk" 
                className="rounded-lg object-contain max-h-[60vh] w-auto shadow-sm"
              />
            </div>
            <div className="p-3 text-center">
              <a 
                href={selectedReceipt} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-emerald-600 font-medium hover:underline"
              >
                Buka gambar di tab baru
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}