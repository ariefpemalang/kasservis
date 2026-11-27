import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { getStoredCategories, subscribeToCategories } from '../utils/categories';
import { parseSmartInput } from '../utils/aiParser';
import { 
  X, 
  Mic, 
  MicOff, 
  Camera, 
  Check, 
  ArrowRight,
  Coffee,
  Receipt,
  PiggyBank,
  Heart,
  ShoppingCart,
  Utensils,
  GraduationCap,
  Bus,
  Users,
  Shirt,
  Wine,
  Activity,
  Wrench,
  Smile,
  Plus,
  Wifi,
  Smartphone,
  DollarSign,
  Send
} from 'lucide-react';

export default function TransactionModal({ 
  isOpen, 
  onClose, 
  initialType = 'EXPENSE', 
  currentBook = 'SERVIS', 
  editingTx = null, 
  onSuccess,
  currentTheme
}) {
  const { user, profile, isOwner, isKasir, isTeknisi } = useAuth();
  const fileInputRef = useRef(null);
  const aiInputRef = useRef(null);

  const [type, setType] = useState(initialType);
  const [book, setBook] = useState(currentBook === 'ALL' ? 'SERVIS' : currentBook);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiptUrl, setReceiptUrl] = useState('');
  
  // State Bilah AI
  const [aiText, setAiText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Icon mapping untuk kategori persis seperti tampilan 1Money di screenshot
  const getCatIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('tidak tercatat')) return <Coffee className="w-5 h-5" />;
    if (n.includes('makan') || n.includes('kuliner') || n.includes('warung') || n.includes('lawuh')) return <Utensils className="w-5 h-5" />;
    if (n.includes('minum') || n.includes('kopi') || n.includes('susu') || n.includes('bearbrand')) return <Wine className="w-5 h-5" />;
    if (n.includes('trans') || n.includes('bensin') || n.includes('bbm') || n.includes('ojek')) return <Bus className="w-5 h-5" />;
    if (n.includes('belanja') || n.includes('pasar') || n.includes('mart')) return <ShoppingCart className="w-5 h-5" />;
    if (n.includes('tagihan') || n.includes('listrik') || n.includes('air') || n.includes('pdam')) return <Receipt className="w-5 h-5" />;
    if (n.includes('pajak')) return <Receipt className="w-5 h-5" />;
    if (n.includes('nabung') || n.includes('invest') || n.includes('tabungan')) return <PiggyBank className="w-5 h-5" />;
    if (n.includes('kluarga') || n.includes('keluarga') || n.includes('sangu')) return <Heart className="w-5 h-5" />;
    if (n.includes('anak') || n.includes('adek') || n.includes('jajan')) return <Smile className="w-5 h-5" />;
    if (n.includes('perbaikan') || n.includes('servis') || n.includes('alat') || n.includes('rusak')) return <Wrench className="w-5 h-5" />;
    if (n.includes('wifi') || n.includes('internet')) return <Wifi className="w-5 h-5" />;
    if (n.includes('qrin') || n.includes('qris') || n.includes('hp') || n.includes('laptop')) return <Smartphone className="w-5 h-5" />;
    if (n.includes('gaji') || n.includes('omset') || n.includes('pendapatan') || n.includes('uang masuk')) return <DollarSign className="w-5 h-5" />;
    if (n.includes('sekolah') || n.includes('didik') || n.includes('pendidikan')) return <GraduationCap className="w-5 h-5" />;
    if (n.includes('sehat') || n.includes('obat') || n.includes('kesehatan')) return <Activity className="w-5 h-5" />;
    if (n.includes('pakaian') || n.includes('baju')) return <Shirt className="w-5 h-5" />;
    if (n.includes('sosial') || n.includes('infaq') || n.includes('sedekah')) return <Users className="w-5 h-5" />;
    if (n.includes('peliharaan') || n.includes('kucing') || n.includes('anjing')) return <Smile className="w-5 h-5" />;
    return <Coffee className="w-5 h-5" />;
  };

  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type === 'in' || editingTx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
      setBook(editingTx.book || 'SERVIS');
      setAmount(editingTx.amount.toString());
      setCategory(editingTx.category);
      setNotes(editingTx.notes || '');
      setDate(editingTx.date ? editingTx.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setReceiptUrl(editingTx.receipt_url || '');
    } else {
      setType(initialType);
      if (isKasir) setBook('WIFI');
      else if (isTeknisi) setBook('SERVIS');
      else setBook(currentBook === 'ALL' ? 'SERVIS' : currentBook);

      setAmount('');
      setCategory('');
      setNotes('');
      setDate(new Date().toISOString().slice(0, 10));
      setReceiptUrl('');
      setAiText('');
    }
    setError('');
  }, [isOpen, editingTx, initialType, currentBook, isKasir, isTeknisi]);

  // Cek dukungan Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);

  const [allCategories, setAllCategories] = useState(getStoredCategories());

  useEffect(() => {
    if (isOpen) {
      setAllCategories(getStoredCategories());
      // Otomatis fokuskan kursor ke Bilah AI saat modal dibuka
      const timer = setTimeout(() => {
        if (aiInputRef.current) {
          aiInputRef.current.focus();
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = subscribeToCategories((newCats) => {
      setAllCategories({ ...newCats });
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const activeCategories = (allCategories[book] && allCategories[book][type]) || [];

  // Tema Dinamis Khusus Modal Transaksi (Latar Belakang Putih Bersih):
  // - SERVIS: Aksen Biru
  // - WIFI: Aksen Pink
  // - PRIBADI: Aksen dinamis sesuai tema aktif Pribadi
  const getThemeStyles = () => {
    const targetBook = book || currentBook;
    if (targetBook === 'SERVIS') {
      return {
        bookName: 'SERVICE',
        textAccent: 'text-blue-600',
        textAccentHover: 'hover:text-blue-700',
        bgAccent: 'bg-blue-600',
        bgAccentHover: 'hover:bg-blue-700',
        btnText: 'text-white',
        borderAccent: 'border-blue-500',
        focusBorder: 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100',
        badgeActive: 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25',
        headerBadge: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
    if (targetBook === 'WIFI') {
      return {
        bookName: 'WIFI',
        textAccent: 'text-pink-600',
        textAccentHover: 'hover:text-pink-700',
        bgAccent: 'bg-pink-600',
        bgAccentHover: 'hover:bg-pink-700',
        btnText: 'text-white',
        borderAccent: 'border-pink-500',
        focusBorder: 'focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-100',
        badgeActive: 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/25',
        headerBadge: 'bg-pink-50 text-pink-700 border-pink-200'
      };
    }
    // Default PRIBADI
    if (currentTheme?.id === 'emerald') {
      return {
        bookName: 'PRIBADI',
        textAccent: 'text-emerald-600',
        textAccentHover: 'hover:text-emerald-700',
        bgAccent: 'bg-emerald-600',
        bgAccentHover: 'hover:bg-emerald-700',
        btnText: 'text-white',
        borderAccent: 'border-emerald-500',
        focusBorder: 'focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100',
        badgeActive: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25',
        headerBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (currentTheme?.id === 'amber') {
      return {
        bookName: 'PRIBADI',
        textAccent: 'text-amber-600',
        textAccentHover: 'hover:text-amber-700',
        bgAccent: 'bg-amber-600',
        bgAccentHover: 'hover:bg-amber-700',
        btnText: 'text-white',
        borderAccent: 'border-amber-500',
        focusBorder: 'focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100',
        badgeActive: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25',
        headerBadge: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    return {
      bookName: 'PRIBADI',
      textAccent: 'text-purple-600',
      textAccentHover: 'hover:text-purple-700',
      bgAccent: 'bg-purple-600',
      bgAccentHover: 'hover:bg-purple-700',
      btnText: 'text-white',
      borderAccent: 'border-purple-500',
      focusBorder: 'focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100',
      badgeActive: 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25',
      headerBadge: 'bg-purple-50 text-purple-700 border-purple-200'
    };
  };

  const themeStyles = getThemeStyles();

  // Jalankan AI Parsing saat pengguna mengetik atau selesai voice
  const handleApplyAiText = (inputStr) => {
    const targetText = inputStr || aiText;
    if (!targetText.trim()) return;

    const parsed = parseSmartInput(targetText, activeCategories);
    if (parsed) {
      if (parsed.amount > 0) {
        setAmount(parsed.amount.toString());
      }
      if (parsed.type) {
        setType(parsed.type);
      }
      if (parsed.category) {
        setCategory(parsed.category);
      }
      if (parsed.notes) {
        setNotes(parsed.notes);
      }
    }
  };

  // Otomatis Simpan Langsung dari Bilah AI tanpa perlu klik tombol Simpan
  const handleAiDirectSave = async (inputStr) => {
    const targetText = (inputStr || aiText || '').trim();
    if (!targetText) return;
    if (loading) return;

    setError('');
    const parsed = parseSmartInput(targetText, activeCategories);

    let finalAmount = parsed?.amount || parseFloat(amount.replace(/[^0-9]/g, '')) || 0;
    if (!finalAmount || finalAmount <= 0) {
      setError('Nominal belum terdeteksi. Contoh ketik: "bensin 32rb" atau "makan 20.000"');
      return;
    }

    const finalType = parsed?.type || type;
    const dbType = finalType === 'INCOME' ? 'in' : 'out';

    let finalCategory = parsed?.category || category;
    if (!finalCategory) {
      if (activeCategories.length > 0) {
        finalCategory = activeCategories[0];
      } else {
        finalCategory = finalType === 'INCOME' ? 'Gaji' : 'Tidak Tercatat';
      }
    }

    const finalNotes = parsed?.notes || targetText;

    setLoading(true);
    try {
      const payload = {
        type: dbType,
        amount: finalAmount,
        category: finalCategory,
        notes: finalNotes,
        date: date,
        book: book,
        payment_method: 'Tunai',
        receipt_url: receiptUrl || null,
        user_id: user?.id,
        user_name: profile?.name || 'User',
        created_at: editingTx?.created_at || new Date().toISOString()
      };

      if (editingTx) {
        const { error: updateErr } = await supabase
          .from('bukukas_transactions')
          .update(payload)
          .eq('id', editingTx.id);

        if (updateErr) throw updateErr;
      } else {
        payload.id = `trx-${Date.now()}`;
        const { error: insertErr } = await supabase
          .from('bukukas_transactions')
          .insert([payload]);

        if (insertErr) throw insertErr;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Gagal simpan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Voice Input Handler (Speech-to-Text Bahasa Indonesia)
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Browser Anda belum mendukung input suara. Anda dapat mengetik di bilah AI.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; // Bahasa Indonesia
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiText(transcript);
        handleApplyAiText(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Upload Foto Struk
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !supabase) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(filePath);

      setReceiptUrl(publicUrl);
    } catch (err) {
      alert('Gagal mengunggah foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const finalCategory = category.trim();
    if (!finalCategory) {
      setError('Pilih salah satu kategori transaksi di atas.');
      return;
    }

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      setError('Nominal harus diisi lebih dari 0.');
      return;
    }

    setLoading(true);
    try {
      const dbType = type === 'INCOME' ? 'in' : 'out';

      const payload = {
        type: dbType,
        amount: numericAmount,
        category: finalCategory,
        notes: notes.trim() || aiText.trim() || '',
        date: date,
        book: book,
        payment_method: 'Tunai',
        receipt_url: receiptUrl || null,
        user_id: user?.id,
        user_name: profile?.name || 'User',
        created_at: editingTx?.created_at || new Date().toISOString()
      };

      if (editingTx) {
        const { error: updateErr } = await supabase
          .from('bukukas_transactions')
          .update(payload)
          .eq('id', editingTx.id);

        if (updateErr) throw updateErr;
      } else {
        payload.id = `trx-${Date.now()}`;
        const { error: insertErr } = await supabase
          .from('bukukas_transactions')
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white text-slate-800 w-full sm:max-w-md h-[95vh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* TOP BAR: Batalkan | Tambahkan | Simpan (Hitam) */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <button 
            type="button" 
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Batalkan
          </button>
          
          <h2 className="text-base font-bold text-slate-900">
            {editingTx ? 'Ubah Catatan' : 'Tambahkan'}
          </h2>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || uploading}
            className="text-sm font-bold text-slate-900 hover:text-black disabled:opacity-50 transition"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>

        {/* SEGMENTED CONTROL: Pengeluaran | Pemasukan */}
        <div className="px-4 pt-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'EXPENSE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                type === 'INCOME' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pemasukan
            </button>
          </div>
        </div>

        {/* INPUT NOMINAL BESAR */}
        <div className="px-4 pt-4 pb-2 text-center">
          <div className="inline-flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={amount ? Number(amount.replace(/[^0-9]/g, '')).toLocaleString('id-ID') : ''}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              className="text-3xl font-extrabold font-mono bg-transparent text-slate-900 focus:outline-none text-center max-w-[240px] tracking-tight placeholder-slate-300"
            />
          </div>

          {/* Sub info ringkas (Kategori terpilih / Catatan) */}
          <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px] text-slate-500">
            <span className={category ? `${themeStyles.textAccent} font-semibold` : 'text-slate-400'}>
              {category ? `Kategori: ${category}` : 'Pilih kategori di bawah'}
            </span>
            {notes && <span>• {notes}</span>}
            {receiptUrl && (
              <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                <Check className="w-3 h-3" /> Ada Struk
              </span>
            )}
          </div>

          {error && (
            <p className="text-rose-500 text-xs mt-1.5 font-medium">{error}</p>
          )}
        </div>

        {/* GRID ICON KATEGORI PERSIS SEPERTI GAMBAR */}
        <div className="px-4 py-2 overflow-y-auto flex-1 bg-white">
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 pt-2 pb-4">
            {activeCategories.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform"
                >
                  <div className={`w-13 h-13 rounded-full flex items-center justify-center transition border ${
                    isSelected 
                      ? themeStyles.badgeActive 
                      : 'bg-slate-100 text-slate-700 border-slate-200/90 group-hover:bg-slate-200/80 group-hover:border-slate-300'
                  }`}>
                    {getCatIcon(cat)}
                  </div>
                  <span className={`text-[11px] text-center line-clamp-1 max-w-[70px] ${
                    isSelected ? `${themeStyles.textAccent} font-bold` : 'text-slate-600 font-medium'
                  }`}>
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BILAH AI FLOATING PALING BAWAH (Voice + Foto Struk) */}
        <div className="p-3 bg-white border-t border-slate-100">
          <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-full border transition-all ${
            isListening 
              ? 'bg-rose-50 border-rose-400 shadow-md shadow-rose-500/10' 
              : `bg-slate-50 border-slate-200 ${themeStyles.focusBorder}`
          }`}>
            
            {/* Input AI Teks */}
            <input
              ref={aiInputRef}
              type="text"
              placeholder={isListening ? 'Mendengarkan suara Anda...' : 'Untuk apa dan berapa harganya?'}
              value={aiText}
              onChange={(e) => {
                setAiText(e.target.value);
                handleApplyAiText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAiDirectSave(aiText);
                }
              }}
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />

            {/* Tombol Mikrofon (Voice Input) */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-1.5 rounded-full transition ${
                isListening 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
              title="Bicara dengan suara (contoh: 'bensin 32rb')"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Tombol Foto Struk Belanja */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-1.5 rounded-full transition ${
                uploading 
                  ? 'text-amber-500 animate-spin' 
                  : receiptUrl 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
              title="Ambil foto struk belanja"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Hidden Input File Kamera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Tombol Terapkan & Simpan Otomatis Langsung */}
            {aiText ? (
              <button
                type="button"
                onClick={() => handleAiDirectSave(aiText)}
                disabled={loading}
                className={`p-1.5 ${themeStyles.bgAccent} ${themeStyles.bgAccentHover} ${themeStyles.btnText} font-bold rounded-full transition-transform active:scale-95 shadow-md flex items-center justify-center`}
                title="Terapkan & Simpan Otomatis Langsung"
              >
                {loading ? (
                  <div className={`w-4 h-4 border-2 ${themeStyles.btnText === 'text-white' ? 'border-white' : 'border-black'} border-t-transparent rounded-full animate-spin`} />
                ) : (
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            ) : null}

          </div>
        </div>

      </div>
    </div>
  );
}
