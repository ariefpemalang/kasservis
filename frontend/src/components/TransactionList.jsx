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
  FileText,
  Utensils,
  Bus,
  Fuel,
  Smile,
  Coffee,
  Heart
} from 'lucide-react';

export default function TransactionList({ 
  transactions, 
  loading, 
  onEdit, 
  onDelete, 
  search, 
  setSearch, 
  searchVisible,
  currentTheme
}) {
  const isDark = currentTheme?.isDark;
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

  // Helper ikon kategori dengan warna-warni bulat seperti di screenshot tema dark
  const getCategoryBadge = (category, notes, book) => {
    const text = `${category || ''} ${notes || ''}`.toLowerCase();
    
    // Makanan / Minuman (Mint / Hijau Toska)
    if (text.includes('warung') || text.includes('makan') || text.includes('miayam') || text.includes('mie') || text.includes('kebab') || text.includes('lawuh') || text.includes('minum')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#10b981] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Utensils className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    // Minuman / Susu / Kopi (Salmon Red / Coral)
    if (text.includes('kopi') || text.includes('bearbrand') || text.includes('susu') || text.includes('teh')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#f87171] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Coffee className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    // Bensin / Transport (Salmon Red / Bus)
    if (text.includes('bensin') || text.includes('bbm') || text.includes('pertalite') || text.includes('transport') || text.includes('ojek')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#f87171] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Bus className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    // Jajan Anak / Adek / Sangu (Rose / Peach / Pink)
    if (text.includes('jajan') || text.includes('adek') || text.includes('anak') || text.includes('bocil')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#fb923c] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Smile className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    if (text.includes('sangu') || text.includes('mamas') || text.includes('keluarga') || text.includes('istri')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#ec4899] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Heart className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    // Gajian / Uang Masuk (Emerald / Hijau Uang)
    if (text.includes('gaji') || text.includes('bonus') || text.includes('omset') || text.includes('untung')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <DollarSign className="w-5 h-5 stroke-[2.5]" />
        </div>
      );
    }
    // HP / Gadget (Amber / Kuning Emas)
    if (text.includes('hp') || text.includes('ipon') || text.includes('infinix') || text.includes('xiaomi') || text.includes('samsung')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Smartphone className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    // Servis / Alat Bengkel (Amber Kuning)
    if (text.includes('servis') || text.includes('lcd') || text.includes('soket') || text.includes('tombol') || text.includes('laptop')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Wrench className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }
    // WiFi (Biru / Pink tergantung buku)
    if (text.includes('wifi') || text.includes('iuran') || text.includes('bandwidth') || text.includes('voucher')) {
      return (
        <div className="w-10 h-10 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <Wifi className="w-5 h-5 stroke-[2.2]" />
        </div>
      );
    }

    // Default Amber
    return (
      <div className="w-10 h-10 rounded-full bg-[#f59e0b] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
      </div>
    );
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
    <div className={`pb-28 ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-slate-800'} min-h-[70vh] transition-colors duration-200`}>
      
      {/* Kolom Pencarian (jika tombol search di header ditekan) */}
      {searchVisible && (
        <div className={`p-3 ${isDark ? 'bg-[#1c1c1c] border-zinc-800' : 'bg-slate-50 border-slate-200'} border-b animate-in slide-in-from-top-1`}>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Cari transaksi / keterangan / nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 ${
                isDark ? 'bg-[#282828] border-zinc-700 text-white placeholder-zinc-500' : 'bg-white border-slate-200 text-slate-800'
              } border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xs`}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Daftar Transaksi */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
          <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs">Memuat data transaksi...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 mt-6">
          <FileText className="w-10 h-10 mx-auto text-zinc-600 mb-2 stroke-[1.5]" />
          <p className="text-sm font-medium text-zinc-300">Belum ada transaksi</p>
          <p className="text-xs text-zinc-500 mt-1">Tekan tombol (+) di bawah untuk mencatat.</p>
        </div>
      ) : (
        <div>
          {groupedTransactions.map((group) => (
            <div key={group.dateStr}>
              
              {/* TANGGAL PEMBATAS: Contoh "25 Nov  Rabu       Pengeluaran: 50.000" */}
              <div className={`px-4 py-2 ${
                isDark ? 'bg-[#202020] text-zinc-400 border-zinc-800/80' : 'bg-slate-50 text-slate-500 border-slate-100'
              } border-y flex items-center justify-between text-xs font-medium`}>
                <div>
                  <span>{formatDateLabel(group.dateStr)}</span>
                </div>
                <div className="flex items-center gap-3">
                  {group.totalExpense > 0 && (
                    <span>Pengeluaran: {formatPureNumber(group.totalExpense)}</span>
                  )}
                  {group.totalIncome > 0 && (
                    <span>Pemasukan: {formatPureNumber(group.totalIncome)}</span>
                  )}
                </div>
              </div>

              {/* LIST ITEM TRANSAKSI */}
              <div className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
                {group.items.map((tx) => {
                  const isIncome = (tx.type === 'INCOME' || tx.type === 'in');
                  const isMenuOpen = activeMenuTxId === tx.id;

                  // Teks judul: pakai keterangan jika ada, jika tidak pakai kategori
                  const title = tx.notes?.trim() || tx.category;
                  // Subtitle: nama user / @nama
                  const userTag = tx.user_name ? `@${tx.user_name}` : `@${tx.book || 'User'}`;

                  return (
                    <div key={tx.id} className="relative">
                      <div 
                        onClick={() => setActiveMenuTxId(isMenuOpen ? null : tx.id)}
                        className={`px-4 py-3 flex items-center justify-between ${
                          isDark ? 'hover:bg-[#1c1c1c] active:bg-[#252525]' : 'hover:bg-slate-50/80 active:bg-slate-100'
                        } transition cursor-pointer`}
                      >
                        {/* Kiri: Avatar Lingkaran Warna-warni dengan Ikon Spesifik */}
                        <div className="flex items-center gap-3.5">
                          {getCategoryBadge(tx.category, tx.notes, tx.book)}

                          {/* Tengah: Judul & @User */}
                          <div>
                            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'} leading-snug`}>
                              {title}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5 font-normal">
                              {userTag}
                            </p>
                          </div>
                        </div>

                        {/* Kanan: Nominal (+/-) */}
                        <div className="text-right flex-shrink-0">
                          <p className={`font-semibold text-base tracking-tight ${
                            isDark ? 'text-white' : 'text-slate-800'
                          }`}>
                            {isIncome ? '' : '-'}{formatPureNumber(tx.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Dropdown Menu Aksi ketika baris diklik */}
                      {isMenuOpen && (
                        <div className={`px-4 py-2 ${
                          isDark ? 'bg-[#181818] border-zinc-800' : 'bg-slate-50 border-slate-200'
                        } border-b flex items-center justify-between text-xs animate-in fade-in`}>
                          <span className={`${isDark ? 'text-zinc-400' : 'text-slate-500'} text-[11px]`}>
                            Kategori: <strong className={isDark ? 'text-zinc-200' : 'text-slate-700'}>{tx.category}</strong>
                          </span>
                          <div className="flex items-center gap-2">
                            {tx.receipt_url && (
                              <button
                                onClick={() => setSelectedReceipt(tx.receipt_url)}
                                className={`px-2.5 py-1 ${
                                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                } rounded-lg border flex items-center gap-1 shadow-xs font-medium`}
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                                <span>Struk</span>
                              </button>
                            )}
                            <button
                              onClick={() => { onEdit(tx); setActiveMenuTxId(null); }}
                              className={`px-2.5 py-1 ${
                                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border-zinc-700' : 'bg-white hover:bg-blue-50 text-blue-700 border-slate-200'
                              } rounded-lg border flex items-center gap-1 shadow-xs font-medium`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Ubah</span>
                            </button>
                            <button
                              onClick={() => { onDelete(tx.id); setActiveMenuTxId(null); }}
                              className={`px-2.5 py-1 ${
                                isDark ? 'bg-zinc-800 hover:bg-rose-950 text-rose-400 border-zinc-700' : 'bg-white hover:bg-rose-50 text-rose-700 border-slate-200'
                              } rounded-lg border flex items-center gap-1 shadow-xs font-medium`}
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${isDark ? 'bg-[#181818] border-zinc-800' : 'bg-white border-slate-200'} border rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in`}>
            <div className={`flex items-center justify-between p-3 border-b ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
              <span className={`font-semibold text-xs ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>Bukti Struk / Nota</span>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className={`p-3 ${isDark ? 'bg-[#121212]' : 'bg-slate-100'} flex items-center justify-center max-h-[70vh] overflow-auto`}>
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
                className="text-xs text-amber-400 font-medium hover:underline"
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