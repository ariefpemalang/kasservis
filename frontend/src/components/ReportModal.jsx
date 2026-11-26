import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { formatRupiah, formatDate, formatDateTime } from '../utils/format';
import { 
  X, 
  Printer, 
  FileSpreadsheet, 
  PieChart, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Wifi, 
  Wrench, 
  User,
  ArrowDownLeft,
  ArrowUpRight,
  ListFilter
} from 'lucide-react';

export default function ReportModal({ isOpen, onClose, transactions: initialTransactions, currentBook: initialBook }) {
  const { isOwner, isKasir, isTeknisi } = useAuth();

  // Tab State: 'CATEGORY' (Laporan Kategori) atau 'TRANSACTIONS' (Rincian)
  const [activeTab, setActiveTab] = useState('CATEGORY');
  
  // Filter State
  const [selectedBook, setSelectedBook] = useState(initialBook || 'ALL');
  const [periodPreset, setPeriodPreset] = useState('THIS_MONTH'); // THIS_MONTH, LAST_MONTH, ALL, CUSTOM
  
  // Tanggal default bulan ini
  const getInitialDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { firstDay, lastDay };
  };

  const [startDate, setStartDate] = useState(getInitialDates().firstDay);
  const [endDate, setEndDate] = useState(getInitialDates().lastDay);

  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sesuaikan hak akses role
  useEffect(() => {
    if (isKasir) setSelectedBook('WIFI');
    else if (isTeknisi) setSelectedBook('SERVIS');
    else if (initialBook) setSelectedBook(initialBook);
  }, [initialBook, isKasir, isTeknisi]);

  // Handle Preset Periode
  const handlePresetChange = (preset) => {
    setPeriodPreset(preset);
    const now = new Date();

    if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Mengambil Data dari Supabase secara Realtime berdasarkan filter
  useEffect(() => {
    if (!isOpen) return;

    const fetchReportData = async () => {
      setLoading(true);
      try {
        if (!supabase) {
          setDataList(initialTransactions || []);
          return;
        }

        let query = supabase
          .from('bukukas_transactions')
          .select('*')
          .order('date', { ascending: false });

        if (isKasir) {
          query = query.eq('book', 'WIFI');
        } else if (isTeknisi) {
          query = query.eq('book', 'SERVIS');
        } else if (selectedBook && selectedBook !== 'ALL') {
          query = query.eq('book', selectedBook);
        }

        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        setDataList(data || []);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setDataList(initialTransactions || []);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [isOpen, selectedBook, startDate, endDate, isKasir, isTeknisi, initialTransactions]);

  // Kalkulasi Breakdown Berdasarkan Kategori
  const {
    totalIncome,
    totalExpense,
    balance,
    incomeCategories,
    expenseCategories
  } = useMemo(() => {
    let incTotal = 0;
    let expTotal = 0;
    const incMap = {};
    const expMap = {};

    dataList.forEach((t) => {
      const amt = parseFloat(t.amount) || 0;
      const isInc = (t.type === 'INCOME' || t.type === 'in');
      const isExp = (t.type === 'EXPENSE' || t.type === 'out');
      const cat = t.category || 'Lain-lain';

      if (isInc) {
        incTotal += amt;
        if (!incMap[cat]) incMap[cat] = { category: cat, total: 0, count: 0 };
        incMap[cat].total += amt;
        incMap[cat].count += 1;
      } else if (isExp) {
        expTotal += amt;
        if (!expMap[cat]) expMap[cat] = { category: cat, total: 0, count: 0 };
        expMap[cat].total += amt;
        expMap[cat].count += 1;
      }
    });

    const incList = Object.values(incMap).sort((a, b) => b.total - a.total);
    const expList = Object.values(expMap).sort((a, b) => b.total - a.total);

    return {
      totalIncome: incTotal,
      totalExpense: expTotal,
      balance: incTotal - expTotal,
      incomeCategories: incList,
      expenseCategories: expList
    };
  }, [dataList]);

  if (!isOpen) return null;

  // Export Laporan Kategori ke CSV
  const exportCategoryCSV = () => {
    if (dataList.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const lines = [];
    lines.push(`LAPORAN KAS BERDASARKAN KATEGORI`);
    lines.push(`Buku Kas: ${selectedBook}`);
    lines.push(`Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`);
    lines.push(`Total Pemasukan: ${formatRupiah(totalIncome)}`);
    lines.push(`Total Pengeluaran: ${formatRupiah(totalExpense)}`);
    lines.push(`Laba Bersih / Saldo: ${formatRupiah(balance)}`);
    lines.push(``);

    lines.push(`PEMASUKAN BERDASARKAN KATEGORI`);
    lines.push(`Kategori,Jumlah Transaksi,Total (Rp),Persentase`);
    incomeCategories.forEach((c) => {
      const pct = totalIncome > 0 ? ((c.total / totalIncome) * 100).toFixed(1) : 0;
      lines.push(`"${c.category}",${c.count},${c.total},"${pct}%"`);
    });
    lines.push(``);

    lines.push(`PENGELUARAN BERDASARKAN KATEGORI`);
    lines.push(`Kategori,Jumlah Transaksi,Total (Rp),Persentase`);
    expenseCategories.forEach((c) => {
      const pct = totalExpense > 0 ? ((c.total / totalExpense) * 100).toFixed(1) : 0;
      lines.push(`"${c.category}",${c.count},${c.total},"${pct}%"`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Kategori_${selectedBook}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Rincian Transaksi Lengkap ke CSV
  const exportAllTransactionsCSV = () => {
    if (dataList.length === 0) {
      alert('Tidak ada transaksi untuk diekspor.');
      return;
    }

    const headers = ['ID', 'Buku Kas', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Keterangan', 'Tanggal', 'Dicatat Oleh'];
    const rows = dataList.map(t => {
      const isInc = (t.type === 'INCOME' || t.type === 'in');
      return [
        t.id,
        t.book,
        isInc ? 'Pemasukan' : 'Pengeluaran',
        `"${t.category}"`,
        t.amount,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        `"${t.date}"`,
        `"${t.user_name || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rincian_Transaksi_${selectedBook}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 leading-tight">Laporan & Rekap Kas</h2>
              <p className="text-[11px] text-slate-500">Analisis per Kategori & Ekspor Data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-slate-50 p-3 border-b border-slate-200 space-y-2 text-xs">
          
          {/* Pilihan Buku Kas (Khusus Owner) */}
          {isOwner && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">Buku Kas:</span>
              <button
                type="button"
                onClick={() => setSelectedBook('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedBook === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedBook('WIFI')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  selectedBook === 'WIFI' ? 'bg-pink-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                WiFi
              </button>
              <button
                type="button"
                onClick={() => setSelectedBook('SERVIS')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  selectedBook === 'SERVIS' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Servis
              </button>
              <button
                type="button"
                onClick={() => setSelectedBook('PRIBADI')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  selectedBook === 'PRIBADI' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Pribadi
              </button>
            </div>
          )}

          {/* Preset Periode */}
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePresetChange('THIS_MONTH')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  periodPreset === 'THIS_MONTH' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('LAST_MONTH')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  periodPreset === 'LAST_MONTH' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('ALL')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  periodPreset === 'ALL' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Semua
              </button>
            </div>

            {/* Custom Date Range */}
            <div className="flex items-center gap-1 text-[11px]">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodPreset('CUSTOM');
                }}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-slate-700"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodPreset('CUSTOM');
                }}
                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Tab Selector: Kategori vs Rincian */}
        <div className="flex border-b border-slate-200 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('CATEGORY')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'CATEGORY' 
                ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold bg-emerald-50/40' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Laporan Kategori
          </button>
          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`flex-1 py-2.5 text-center transition flex items-center justify-center gap-1.5 ${
              activeTab === 'TRANSACTIONS' 
                ? 'border-b-2 border-emerald-600 text-emerald-700 font-bold bg-emerald-50/40' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Daftar Transaksi ({dataList.length})
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          
          {/* Ringkasan Finansial Card (Putih Bersih) */}
          <div className="grid grid-cols-3 gap-2 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs text-center">
            <div>
              <p className="text-[10px] text-emerald-700 uppercase font-semibold">Pemasukan (+)</p>
              <p className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5">{formatRupiah(totalIncome)}</p>
            </div>
            <div className="border-x border-slate-200">
              <p className="text-[10px] text-rose-700 uppercase font-semibold">Pengeluaran (-)</p>
              <p className="text-xs sm:text-sm font-bold text-rose-600 mt-0.5">{formatRupiah(totalExpense)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">Laba / Sisa</p>
              <p className={`text-xs sm:text-sm font-bold mt-0.5 ${balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {formatRupiah(balance)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Memuat laporan kas...
            </div>
          ) : dataList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
              Tidak ada transaksi tercatat pada periode ini.
            </div>
          ) : activeTab === 'CATEGORY' ? (
            /* TAB LAPORAN KATEGORI */
            <div className="space-y-4">
              
              {/* Seksi Pemasukan per Kategori */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    <span>Pemasukan per Kategori</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {formatRupiah(totalIncome)}
                  </span>
                </div>

                {incomeCategories.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Tidak ada pemasukan tercatat.</p>
                ) : (
                  <div className="space-y-2.5">
                    {incomeCategories.map((cat) => {
                      const pct = totalIncome > 0 ? ((cat.total / totalIncome) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                              {cat.category}
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-emerald-600">{formatRupiah(cat.total)}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">({pct}% • {cat.count}x)</span>
                            </div>
                          </div>
                          {/* Progress bar visual */}
                          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seksi Pengeluaran per Kategori */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    <span>Pengeluaran per Kategori</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700">
                    {formatRupiah(totalExpense)}
                  </span>
                </div>

                {expenseCategories.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Tidak ada pengeluaran tercatat.</p>
                ) : (
                  <div className="space-y-2.5">
                    {expenseCategories.map((cat) => {
                      const pct = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                              {cat.category}
                            </span>
                            <div className="text-right">
                              <span className="font-bold text-rose-600">{formatRupiah(cat.total)}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5">({pct}% • {cat.count}x)</span>
                            </div>
                          </div>
                          {/* Progress bar visual */}
                          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-rose-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* TAB DAFTAR TRANSAKSI */
            <div className="space-y-2">
              {dataList.map((t) => {
                const isInc = (t.type === 'INCOME' || t.type === 'in');
                return (
                  <div key={t.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{t.category}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 uppercase font-semibold">
                          {t.book}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t.date} • {t.notes || 'Tanpa keterangan'}
                      </p>
                    </div>
                    <div className="text-right font-bold">
                      <span className={isInc ? 'text-emerald-600' : 'text-rose-600'}>
                        {isInc ? '+' : '-'}{formatRupiah(t.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer: Tombol Ekspor & Cetak disembunyikan sesuai permintaan */}
      </div>
    </div>
  );
}