import { supabase } from '../supabaseClient';

// Default Kategori Bawaan untuk setiap Buku Kas
export const DEFAULT_CATEGORIES = {
  WIFI: {
    INCOME: [
      'Iuran Bulanan WiFi',
      'Voucheran Hotspot',
      'Biaya Pasang Baru',
      'Penjualan Alat / Router',
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
      'Gaji',
      'Investasi',
      'Pendapatan Lain',
      'Uang Masuk'
    ],
    EXPENSE: [
      'Tidak Tercatat',
      'tagihan',
      'pajak',
      'nabung',
      'kluarga',
      'qrin',
      'Belanja',
      'Makanan',
      'Pendidikan',
      'Transportasi',
      'Sosial',
      'Pakaian',
      'Minuman',
      'Kesehatan',
      'Peliharaan',
      'Perbaikan',
      'Anak-anak'
    ]
  }
};

const STORAGE_KEY = 'bukukas_custom_categories';
const SETTING_ID = 'bukukas_categories';

// Event listener array untuk pembaruan reaktif di seluruh komponen UI
const listeners = new Set();

export const subscribeToCategories = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyListeners = (categories) => {
  listeners.forEach((listener) => {
    try {
      listener(categories);
    } catch (err) {
      console.error('Error notifying category listener:', err);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bukukas:categories_changed', { detail: categories }));
  }
};

export const getStoredCategories = () => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return DEFAULT_CATEGORIES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = async (cats) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
  }
  notifyListeners(cats);

  // Simpan dan sinkronkan ke database Supabase agar realtime di semua perangkat (PC, HP, dll)
  if (supabase) {
    try {
      await supabase.from('settings').upsert({
        id: SETTING_ID,
        data: cats,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Gagal sinkronisasi kategori ke Supabase:', err);
    }
  }
};

// Ambil kategori terbaru dari Supabase dan simpan ke cache lokal
export const fetchRemoteCategories = async () => {
  if (!supabase) return getStoredCategories();
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('data')
      .eq('id', SETTING_ID)
      .single();

    if (!error && data?.data) {
      const remoteCats = data.data;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteCats));
      }
      notifyListeners(remoteCats);
      return remoteCats;
    }
  } catch (err) {
    console.warn('Gagal mengambil kategori dari remote Supabase:', err);
  }
  return getStoredCategories();
};

export const addCategory = async (book, type, categoryName) => {
  const cats = getStoredCategories();
  if (!cats[book]) cats[book] = { INCOME: [], EXPENSE: [] };
  if (!cats[book][type]) cats[book][type] = [];

  const trimmed = categoryName.trim();
  if (trimmed && !cats[book][type].includes(trimmed)) {
    cats[book][type].push(trimmed);
    await saveCategories(cats);
  }
  return cats;
};

export const deleteCategory = async (book, type, categoryName) => {
  const cats = getStoredCategories();
  if (cats[book] && cats[book][type]) {
    cats[book][type] = cats[book][type].filter(c => c !== categoryName);
    await saveCategories(cats);
  }
  return cats;
};

export const resetCategoriesToDefault = async () => {
  await saveCategories(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
};
