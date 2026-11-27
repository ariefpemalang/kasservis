import { supabase, supabaseUnauth } from '../supabaseClient';

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

export const notifyListeners = (categories) => {
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

// Channel WebSocket Realtime untuk broadcast instan antar perangkat (HP <-> PC)
let syncChannel = null;

const getSyncChannel = () => {
  if (!supabase) return null;
  if (!syncChannel) {
    syncChannel = supabase.channel('bukukas_categories_sync');
    syncChannel
      .on('broadcast', { event: 'categories_changed' }, (payload) => {
        if (payload?.payload) {
          const newCats = payload.payload;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newCats));
          }
          notifyListeners(newCats);
        }
      })
      .subscribe();
  }
  return syncChannel;
};

// Simpan kategori: update lokal seketika + simpan ke Supabase + broadcast ke HP/PC lain
export const saveCategories = async (cats) => {
  // 1. Simpan di memori lokal agar UI langsung update tanpa jeda
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
  }
  notifyListeners(cats);

  // 2. Broadcast instan via WebSocket Realtime (ringan, langsung sampai dalam hitungan milidetik)
  try {
    const ch = getSyncChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'categories_changed',
        payload: cats
      });
    }
  } catch (e) {
    console.warn('Broadcast error:', e);
  }

  // 3. Simpan permanen ke database Supabase (menggunakan client unauth untuk menghindari blokir RLS)
  const client = supabaseUnauth || supabase;
  if (client) {
    try {
      const { error } = await client.from('settings').upsert({
        id: SETTING_ID,
        data: cats,
        updated_at: new Date().toISOString()
      });
      if (error) {
        console.error('Gagal upsert kategori ke Supabase:', error);
      }
    } catch (err) {
      console.error('Koneksi database kategori bermasalah:', err);
    }
  }
};

// Ambil kategori terbaru dari Supabase dan sinkronkan ke cache lokal
export const fetchRemoteCategories = async () => {
  const client = supabaseUnauth || supabase;
  if (!client) return getStoredCategories();

  try {
    const { data, error } = await client
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

// Mulai pendengar realtime untuk kategori saat aplikasi dibuka
export const initCategoryRealtime = () => {
  getSyncChannel();
  fetchRemoteCategories();

  // Dengarkan juga event tab aktif (saat HP dibuka kuncinya atau PC pindah tab)
  if (typeof window !== 'undefined') {
    const handleFocus = () => {
      fetchRemoteCategories();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        fetchRemoteCategories();
      }
    });
  }
};
