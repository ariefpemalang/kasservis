import React, { useState, useMemo } from 'react';
import { formatDateTime } from '../utils/format';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Image as ImageIcon,
  X,
  Wrench,
  Wifi,
  Smartphone,
  Laptop,
  ShoppingBag,
  DollarSign,
  Layers,
  FileText
} from 'lucide-react';

export default function TransactionList({ 
  transactions, 
  loading, 
  onEdit, 
  onDelete, 
  search, 
  setSearch,
  searchVisible
}) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [activeMenuTxId, setActiveMenuTxId] = useState(null);

  // Format angka tanpa simbol Rp untuk mencocokkan gaya di screenshot
  const formatPureNumber = (amount) => {
    if (!amount || isNaN(amount)) return '0';
    return Number(amount).toLocaleString('id-ID');
  };

  // Helper untuk format teks tanggal pembatas (contoh: "25 Nov  Rabu")
  const formatDateLabel = (dateStr) => {
    if (!dateStr || dateStr === '1970-01-01') return 'Tanpa Tanggal';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      
      const day = d.getDate();
      const monthShort = d.toLocaleDateString('id-ID', { month: 'short' });
      const weekday = d.toLocaleDateString('id-ID', { weekday: 'long' });

      return `${day} ${monthShort}  ${weekday}`;
    }
    return dateStr;
  };

  // Helper ikon kategori bergaya kuning/amber seperti di gambar screenshot
  const getCategoryIcon = (category, book) => {
    const catLower = (category || '').toLowerCase();
    
    if (catLower.includes('servis') || catLower.includes('lcd') || catLower.includes('soket') || catLower.includes('tombol')) {
      return <Wrench className="w-5 h-5 text-amber-500" />;
    }
    if (catLower.includes('wifi') || catLower.includes('iuran') || catLower.includes('bandwidth') || catLower.includes('voucher')) {
      return <Wifi className="w-5 h-5 text-amber-500" />;
    }
    if (catLower.includes('hp') || catLower.includes('ipon') || catLower.includes('infinix')) {
      return <Smartphone className="w-5 h-5 text-amber-500" />;
    }
    if (catLower.includes('laptop') || catLower.includes('pc')) {
      return <Laptop className="w-5 h-5 text-amber-500" />;
    }
    if (catLower.includes('beli') || catLower.includes('part') || catLower.includes('kater')) {
      return <ShoppingBag className="w-5 h-5 text-amber-500" />;
    }
    return <Wrench className="w-5 h-5 text-amber-500" />;
  };

  // Mengelompokkan transaksi per tanggal dan menghitung total pengeluaran & pemasukan harian
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
    <div className="pb-28 bg-white min-h-[70vh]">
      
      {/* Kolom Pencarian (jika tombol search di header ditekan) */}
      {searchVisible && (
        <div className="p-3 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Cari transaksi / keterangan / nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
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
        </div>
      )}

      {/* Daftar Transaksi */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs">Memuat data transaksi...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-slate-400 mt-6">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
          <p className="text-sm font-medium text-slate-600">Belum ada transaksi</p>
          <p className="text-xs text-slate-400 mt-1">Tekan tombol (+) biru di bawah untuk mencatat.</p>
        </div>
      ) : (
        <div>
          {groupedTransactions.map((group) => (
            <div key={group.dateStr}>
              
              {/* TANGGAL PEMBATAS SESUAI SCREENSHOT: 
                  "25 Nov  Rabu       Pengeluaran: 720.000  Pemasukan: 465.000" */}
              <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div>
                  <span>{formatDateLabel(group.dateStr)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Pengeluaran: {formatPureNumber(group.totalExpense)}</span>
                  <span>Pemasukan: {formatPureNumber(group.totalIncome)}</span>
                </div>
              </div>

              {/* LIST ITEM TRANSAKSI */}
              <div className="divide-y divide-slate-100">
                {group.items.map((tx) => {
                  const isIncome = (tx.type === 'INCOME' || tx.type === 'in');
                  const isMenuOpen = activeMenuTxId === tx.id;

                  // Teks judul: pakai keterangan jika ada, jika tidak pakai kategori
                  const title = tx.notes?.trim() || tx.category;
                  // Subtitle: nama user / @nama
                  const userTag = tx.user_name ? `@${tx.user_name}` : `@${tx.book || 'Admin'}`;

                  return (
                    <div key={tx.id} className="relative">
                      <div 
                        onClick={() => setActiveMenuTxId(isMenuOpen ? null : tx.id)}
                        className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 active:bg-slate-100 transition cursor-pointer"
                      >
                        {/* Kiri: Avatar Lingkaran Kuning/Amber dengan Ikon */}
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-xs">
                            {getCategoryIcon(tx.category, tx.book)}
                          </div>

                          {/* Tengah: Judul & @User */}
                          <div>
                            <p className="font-semibold text-sm text-slate-800 leading-snug">
                              {title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                              {userTag}
                            </p>
                          </div>
                        </div>

                        {/* Kanan: Nominal (+/-) */}
                        <div className="text-right flex-shrink-0">
                          <p className={`font-semibold text-base tracking-tight ${
                            isIncome ? 'text-slate-800' : 'text-slate-800'
                          }`}>
                            {isIncome ? '' : '-'}{formatPureNumber(tx.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Dropdown Menu Aksi ketika baris diklik */}
                      {isMenuOpen && (
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs animate-in fade-in">
                          <span className="text-slate-500 text-[11px]">
                            Kategori: <strong className="text-slate-700">{tx.category}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            {tx.receipt_url && (
                              <button
                                onClick={() => setSelectedReceipt(tx.receipt_url)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1 shadow-xs font-medium"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                                <span>Struk</span>
                              </button>
                            )}
                            <button
                              onClick={() => { onEdit(tx); setActiveMenuTxId(null); }}
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg border border-slate-200 flex items-center gap-1 shadow-xs font-medium"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Ubah</span>
                            </button>
                            <button
                              onClick={() => { onDelete(tx.id); setActiveMenuTxId(null); }}
                              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-slate-200 flex items-center gap-1 shadow-xs font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      )}
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
                className="text-xs text-blue-600 font-medium hover:underline"
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