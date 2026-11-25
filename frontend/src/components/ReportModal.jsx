import React from 'react';
import { formatRupiah, formatDateTime } from '../utils/format';
import { X, Download, Printer, FileSpreadsheet } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, transactions, currentBook, summary }) {
  if (!isOpen) return null;

  // Export ke format CSV
  const exportToCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diexport.');
      return;
    }

    const headers = ['ID', 'Buku Kas', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Keterangan', 'Waktu', 'Dicatat Oleh'];
    const rows = transactions.map(t => [
      t.id,
      t.book,
      t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      `"${t.category}"`,
      t.amount,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${formatDateTime(t.date)}"`,
      `"${t.user?.name || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_BukuKas_${currentBook}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <span className="font-bold text-sm">Laporan & Ekspor Catatan Kas</span>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Ringkasan Singkat */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <p className="font-bold text-slate-700">Ringkasan Buku Kas Saat Ini:</p>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Transaksi Tercatat:</span>
              <span className="font-bold text-slate-800">{transactions.length} transaksi</span>
            </div>
          </div>

          {/* Opsi Ekspor */}
          <div className="space-y-2.5">
            <button
              onClick={exportToCSV}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-[0.99]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Unduh File Excel / CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition active:scale-[0.99]"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            File CSV kompatibel dengan Microsoft Excel, Google Sheets, dan LibreOffice.
          </p>
        </div>

      </div>
    </div>
  );
}
