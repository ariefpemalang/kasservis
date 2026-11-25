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
      'Gaji / Bagi Hasil Usaha',
      'Pendapatan Lain Pribadi',
      'Investasi / Dividen'
    ],
    EXPENSE: [
      'Nabung',
      'Makan & Minum',
      'Laundry',
      'Pulsa',
      'Bocil / Keluarga',
      'Infaq / Sedekah',
      'Kebutuhan Pribadi & Keluarga',
      'Belanja Bulanan'
    ]
  }
};

const STORAGE_KEY = 'bukukas_custom_categories';

export const getStoredCategories = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategories = (cats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
};

export const addCategory = (book, type, categoryName) => {
  const cats = getStoredCategories();
  if (!cats[book]) cats[book] = { INCOME: [], EXPENSE: [] };
  if (!cats[book][type]) cats[book][type] = [];

  const trimmed = categoryName.trim();
  if (trimmed && !cats[book][type].includes(trimmed)) {
    cats[book][type].push(trimmed);
    saveCategories(cats);
  }
  return cats;
};

export const deleteCategory = (book, type, categoryName) => {
  const cats = getStoredCategories();
  if (cats[book] && cats[book][type]) {
    cats[book][type] = cats[book][type].filter(c => c !== categoryName);
    saveCategories(cats);
  }
  return cats;
};
