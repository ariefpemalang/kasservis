import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Camera, 
  Check, 
  Wifi, 
  Wrench, 
  User 
} from 'lucide-react';

const CATEGORIES = {
  WIFI: {
    INCOME: [
      'Iuran Bulanan WiFi',
      'Voucheran Hotspot',
      'Biaya Pasang Baru',
      'Pemasukan Lain WiFi'
    ],
    EXPENSE: [
      'Beli Bandwidth / Upstream',
      'Kabel FO & Konektor',
      'Router / Modem ONT',
      'Operasional Lapangan',
      'Listrik / Sewa Tiang',
      'Pengeluaran Lain WiFi'
    ]
  },
  SERVIS: {
    INCOME: [
      'Ongkos Servis Laptop / PC',
      'Ongkos Servis HP',
      'Jual Sparepart / Aksesoris',
      'Instalasi Windows / Software',
      'Pemasukan Lain Servis'
    ],
    EXPENSE: [
      'Beli Sparepart (LCD, Baterai, dll)',
      'Alat Servis (Solder, Pasta, Timah)',
      'Ongkos Kirim Sparepart',
      'Operasional Bengkel Servis',
      'Pengeluaran Lain Servis'
    ]
  },
  PRIBADI: {
    INCOME: [
      'Gaji / Bagi Hasil Usaha',
      'Pendapatan Lain Pribadi',
      'Investasi / Dividen'
    ],
    EXPENSE: [
      'Kebutuhan Pribadi & Keluarga',
      'Makan & Minum',
      'Belanja Bulanan',
      'Cicilan / Tagihan Pribadi',
      'Pengeluaran Lain Pribadi'
    ]
  }
};

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  initialType = 'INCOME', 
  currentBook = 'WIFI', 
  editingTx = null, 
  onSuccess 
}) {
  const { user, profile, isOwner, isKasir, isTeknisi } = useAuth();

  const [type, setType] = useState(initialType);
  const [book, setBook] = useState(currentBook === 'ALL' ? 'WIFI' : currentBook);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setBook(editingTx.book);
      setAmount(editingTx.amount.toString());
      setCategory(editingTx.category);
      setNotes(editingTx.notes || '');
      setDate(new Date(editingTx.date).toISOString().slice(0, 16));
      setReceiptUrl(editingTx.receipt_url || '');
    } else {
      setType(initialType);
      if (isKasir) setBook('WIFI');
      else if (isTeknisi) setBook('SERVIS');
      else setBook(currentBook === 'ALL' ? 'WIFI' : currentBook);

      setAmount('');
      setCategory('');
      setCustomCategory('');
      setNotes('');
      setDate(new Date().toISOString().slice(0, 16));
      setReceiptUrl('');
    }
    setError('');
  }, [isOpen, editingTx, initialType, currentBook, isKasir, isTeknisi]);

  if (!isOpen) return null;

  // Upload ke Supabase Storage (Bucket 'receipts')
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !supabase) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { data, error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      // Ambil Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      setReceiptUrl(publicUrl);
    } catch (err) {
      alert('Gagal mengunggah foto struk: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalCategory = customCategory.trim() || category;
    if (!finalCategory) {
      setError('Pilih atau ketik kategori transaksi.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        book,
        type,
        amount: numericAmount,
        category: finalCategory,
        notes: notes.trim() || null,
        date: new Date(date).toISOString(),
        receipt_url: receiptUrl || null,
        user_id: user?.id,
        user_name: profile?.name || user?.email || 'User'
      };

      if (editingTx) {
        const { error: updateErr } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', editingTx.id);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('transactions')
          .insert([payload]);

        if (insertErr) throw insertErr;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeCategories = CATEGORIES[book]?.[type] || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
        
        {/* Header Modal */}
        <div className={`p-4 flex items-center justify-between text-white ${type === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          <div className="flex items-center gap-2">
            {type === 'INCOME' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            <span className="font-bold text-sm tracking-tight">
              {editingTx ? 'Ubah Catatan' : type === 'INCOME' ? 'Catat Pemasukan (+)' : 'Catat Pengeluaran (-)'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/20 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Type Toggle: Pemasukan / Pengeluaran */}
          {!editingTx && (
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  type === 'INCOME' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  type === 'EXPENSE' ? 'bg-rose-600 text-white shadow' : 'text-slate-600'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Pengeluaran
              </button>
            </div>
          )}

          {/* Book Selector (Khusus Owner, Kasir & Teknisi otomatis terkunci) */}
          {isOwner && !editingTx && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Pilih Buku Kas
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBook('WIFI')}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                    book === 'WIFI' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Wifi className="w-4 h-4 text-blue-600" />
                  Buku WiFi
                </button>
                <button
                  type="button"
                  onClick={() => setBook('SERVIS')}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                    book === 'SERVIS' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-amber-600" />
                  Buku Servis
                </button>
                <button
                  type="button"
                  onClick={() => setBook('PRIBADI')}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition ${
                    book === 'PRIBADI' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <User className="w-4 h-4 text-purple-600" />
                  Buku Pribadi
                </button>
              </div>
            </div>
          )}

          {/* Nominal Input Besar */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-base">
                Rp
              </span>
              <input
                type="text"
                required
                autoFocus
                placeholder="0"
                value={amount ? Number(amount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(raw);
                }}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Pilihan Kategori Cepat */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {activeCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    setCustomCategory('');
                  }}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition ${
                    category === cat && !customCategory
                      ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Atau ketik kategori lain..."
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                setCategory('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Keterangan / Catatan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Keterangan / Catatan
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Iuran WiFi Pak Budi, Beli LCD Asus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Tanggal & Upload Struk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Waktu Transaksi
              </label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Foto Struk / Nota (Supabase Storage)
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs text-slate-600 transition">
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>{uploading ? 'Mengunggah...' : receiptUrl ? 'Ganti Foto' : 'Ambil Foto Struk'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {receiptUrl && (
                  <button
                    type="button"
                    onClick={() => setReceiptUrl('')}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
                    title="Hapus Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {receiptUrl && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Foto tersimpan di Supabase
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || uploading}
            className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 ${
              type === 'INCOME'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
            }`}
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <span>Simpan Catatan</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
