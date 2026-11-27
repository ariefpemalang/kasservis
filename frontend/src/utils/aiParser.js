// Smart AI Parser untuk Input Suara & Teks Bahasa Indonesia
// Menganalisis kalimat seperti: "bensin 32rb", "wifi 100rb", "gajian 1.5jt", "servis laptop 150k"

const KEYWORD_RULES = [
  // 1. ATURAN WIFI
  { 
    keywords: ['wifi', 'wi-fi', 'iuran wifi', 'bulanan wifi', 'tagihan wifi', 'bayar wifi', 'internet wifi'], 
    type: 'INCOME', 
    categoryKeywords: ['iuran bulanan wifi', 'wifi', 'pemasukan lain wifi'], 
    fallbackCategory: 'Iuran Bulanan WiFi' 
  },
  { 
    keywords: ['voucher', 'voucheran', 'hotspot', 'kupon wifi', 'kolektif voucher'], 
    type: 'INCOME', 
    categoryKeywords: ['voucheran hotspot', 'voucher', 'hotspot'], 
    fallbackCategory: 'Voucheran Hotspot' 
  },
  { 
    keywords: ['pasang baru', 'psb', 'biaya pasang', 'tarik kabel baru'], 
    type: 'INCOME', 
    categoryKeywords: ['biaya pasang baru', 'pasang baru'], 
    fallbackCategory: 'Biaya Pasang Baru' 
  },
  { 
    keywords: ['jual alat', 'jual router', 'jual modem'], 
    type: 'INCOME', 
    categoryKeywords: ['penjualan alat / router', 'jual alat'], 
    fallbackCategory: 'Penjualan Alat / Router' 
  },
  { 
    keywords: ['bandwidth', 'upstream', 'indihome', 'biznet', 'iconnet', 'astinet'], 
    type: 'EXPENSE', 
    categoryKeywords: ['beli bandwidth / upstream', 'bandwidth', 'upstream'], 
    fallbackCategory: 'Beli Bandwidth / Upstream' 
  },
  { 
    keywords: ['kabel fo', 'kabel', 'konektor', 'patchcord', 'ont', 'modem', 'router ont', 'tang crimping', 'roset'], 
    type: 'EXPENSE', 
    categoryKeywords: ['kabel fo & konektor', 'router / modem ont', 'kabel'], 
    fallbackCategory: 'Kabel FO & Konektor' 
  },
  { 
    keywords: ['operasional lapangan', 'tiang', 'sewa tiang', 'bensin lapangan'], 
    type: 'EXPENSE', 
    categoryKeywords: ['operasional lapangan', 'listrik / sewa tiang'], 
    fallbackCategory: 'Operasional Lapangan' 
  },

  // 2. ATURAN SERVIS
  { 
    keywords: ['ongkos servis laptop', 'servis laptop', 'service laptop', 'benerin laptop', 'servis pc', 'service pc', 'ongkos pc'], 
    type: 'INCOME', 
    categoryKeywords: ['ongkos servis laptop / pc', 'servis laptop', 'laptop'], 
    fallbackCategory: 'Ongkos Servis Laptop / PC' 
  },
  { 
    keywords: ['ongkos servis hp', 'servis hp', 'service hp', 'benerin hp', 'ganti lcd hp', 'servis handphone'], 
    type: 'INCOME', 
    categoryKeywords: ['ongkos servis hp', 'servis hp', 'hp'], 
    fallbackCategory: 'Ongkos Servis HP' 
  },
  { 
    keywords: ['ongkos servis', 'servis', 'service', 'ongkos jasa', 'jasa'], 
    type: 'INCOME', 
    categoryKeywords: ['ongkos servis laptop / pc', 'ongkos servis hp', 'ongkos'], 
    fallbackCategory: 'Ongkos Servis Laptop / PC' 
  },
  { 
    keywords: ['jual sparepart', 'aksesoris', 'casing hp', 'charger', 'kabel data'], 
    type: 'INCOME', 
    categoryKeywords: ['jual sparepart / aksesoris', 'sparepart'], 
    fallbackCategory: 'Jual Sparepart / Aksesoris' 
  },
  { 
    keywords: ['instal ulang', 'install windows', 'instal windows', 'software', 'aktivasi'], 
    type: 'INCOME', 
    categoryKeywords: ['instalasi windows / software', 'software'], 
    fallbackCategory: 'Instalasi Windows / Software' 
  },
  { 
    keywords: ['beli sparepart', 'lcd', 'baterai', 'sparepart', 'touchscreen', 'keyboard laptop', 'ic power'], 
    type: 'EXPENSE', 
    categoryKeywords: ['beli sparepart (lcd, baterai, dll)', 'sparepart'], 
    fallbackCategory: 'Beli Sparepart (LCD, Baterai, dll)' 
  },
  { 
    keywords: ['solder', 'timah', 'pasta', 'flux', 'blower', 'alat servis', 'obeng'], 
    type: 'EXPENSE', 
    categoryKeywords: ['alat servis (solder, pasta, timah)', 'alat servis'], 
    fallbackCategory: 'Alat Servis (Solder, Pasta, Timah)' 
  },
  { 
    keywords: ['ongkir', 'ongkos kirim', 'jnt', 'jne', 'sicepat'], 
    type: 'EXPENSE', 
    categoryKeywords: ['ongkos kirim sparepart', 'ongkir'], 
    fallbackCategory: 'Ongkos Kirim Sparepart' 
  },

  // 3. ATURAN PRIBADI (PEMASUKAN)
  { 
    keywords: ['gaji', 'gajian', 'salary', 'upah', 'insentif', 'honor', 'uang gaji'], 
    type: 'INCOME', 
    categoryKeywords: ['gaji'], 
    fallbackCategory: 'Gaji' 
  },
  { 
    keywords: ['investasi', 'dividen', 'profit', 'bunga', 'reksadana', 'crypto', 'saham'], 
    type: 'INCOME', 
    categoryKeywords: ['investasi'], 
    fallbackCategory: 'Investasi' 
  },
  { 
    keywords: ['uang masuk', 'transfer masuk', 'transferan', 'dapat uang', 'terima uang', 'rejeki', 'dikasih'], 
    type: 'INCOME', 
    categoryKeywords: ['uang masuk'], 
    fallbackCategory: 'Uang Masuk' 
  },
  { 
    keywords: ['pendapatan lain', 'omset', 'laba', 'untung', 'bonus'], 
    type: 'INCOME', 
    categoryKeywords: ['pendapatan lain'], 
    fallbackCategory: 'Pendapatan Lain' 
  },

  // 4. ATURAN PRIBADI (PENGELUARAN)
  { 
    keywords: ['makan', 'warung', 'bakso', 'soto', 'nasi', 'ayam', 'mie', 'miayam', 'kebab', 'lapar', 'snack', 'roti', 'kue', 'resto', 'jajan', 'lawuh', 'lawuhan', 'sarapan', 'madura'], 
    type: 'EXPENSE', 
    categoryKeywords: ['makanan'], 
    fallbackCategory: 'Makanan' 
  },
  { 
    keywords: ['minum', 'kopi', 'teh', 'es', 'jus', 'boba', 'bearbrand', 'susu', 'air', 'aqua', 'leminerale'], 
    type: 'EXPENSE', 
    categoryKeywords: ['minuman'], 
    fallbackCategory: 'Minuman' 
  },
  { 
    keywords: ['bensin', 'bbm', 'pertalite', 'pertamax', 'solar', 'parkir', 'ojek', 'grab', 'gojek', 'tol', 'bus', 'angkot'], 
    type: 'EXPENSE', 
    categoryKeywords: ['transportasi'], 
    fallbackCategory: 'Transportasi' 
  },
  { 
    keywords: ['adek', 'anak', 'susu adek', 'pampers', 'mainan', 'bocil', 'anak-anak'], 
    type: 'EXPENSE', 
    categoryKeywords: ['anak-anak'], 
    fallbackCategory: 'Anak-anak' 
  },
  { 
    keywords: ['sangu', 'mamas', 'ibu', 'istri', 'keluarga', 'kluarga', 'ortu', 'bapak'], 
    type: 'EXPENSE', 
    categoryKeywords: ['kluarga'], 
    fallbackCategory: 'kluarga' 
  },
  { 
    keywords: ['belanja', 'pasar', 'supermarket', 'indomaret', 'alfamart', 'sayur', 'sabun', 'shampoo', 'odol'], 
    type: 'EXPENSE', 
    categoryKeywords: ['belanja'], 
    fallbackCategory: 'Belanja' 
  },
  { 
    keywords: ['tagihan', 'listrik', 'pln', 'air', 'pdam', 'pulsa', 'kuota', 'sewa', 'token'], 
    type: 'EXPENSE', 
    categoryKeywords: ['tagihan'], 
    fallbackCategory: 'tagihan' 
  },
  { 
    keywords: ['pajak', 'stnk', 'pbb', 'bpjs'], 
    type: 'EXPENSE', 
    categoryKeywords: ['pajak'], 
    fallbackCategory: 'pajak' 
  },
  { 
    keywords: ['pakaian', 'baju', 'celana', 'kaos', 'sepatu', 'sandal', 'jaket'], 
    type: 'EXPENSE', 
    categoryKeywords: ['pakaian'], 
    fallbackCategory: 'Pakaian' 
  },
  { 
    keywords: ['obat', 'dokter', 'klinik', 'apotek', 'vitamin', 'sakit', 'paracetamol', 'bidan'], 
    type: 'EXPENSE', 
    categoryKeywords: ['kesehatan'], 
    fallbackCategory: 'Kesehatan' 
  },
  { 
    keywords: ['peliharaan', 'kucing', 'anjing', 'whiskas', 'pakan'], 
    type: 'EXPENSE', 
    categoryKeywords: ['peliharaan'], 
    fallbackCategory: 'Peliharaan' 
  },
  { 
    keywords: ['sekolah', 'spp', 'buku', 'kursus', 'kuliah', 'pendidikan'], 
    type: 'EXPENSE', 
    categoryKeywords: ['pendidikan'], 
    fallbackCategory: 'Pendidikan' 
  },
  { 
    keywords: ['sedekah', 'infaq', 'kondangan', 'sosial', 'sumbangan', 'donasi'], 
    type: 'EXPENSE', 
    categoryKeywords: ['sosial'], 
    fallbackCategory: 'Sosial' 
  },
  { 
    keywords: ['nabung', 'simpan', 'tabungan', 'celengan'], 
    type: 'EXPENSE', 
    categoryKeywords: ['nabung'], 
    fallbackCategory: 'nabung' 
  },
  { 
    keywords: ['qris', 'qrin', 'scan'], 
    type: 'EXPENSE', 
    categoryKeywords: ['qrin'], 
    fallbackCategory: 'qrin' 
  }
];

export const parseSmartInput = (text, categoriesData = {}, currentBook = 'PRIBADI') => {
  if (!text) return null;
  const raw = text.toLowerCase().trim();

  let amount = 0;
  let remainingText = raw;

  // 1. Ekstraksi Nominal Uang
  // Format jutaan: "1.5 jt", "2 juta", "1,384 jt"
  const jutaMatch = remainingText.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
  if (jutaMatch) {
    const val = parseFloat(jutaMatch[1].replace(',', '.'));
    amount = Math.round(val * 1000000);
    remainingText = remainingText.replace(jutaMatch[0], '');
  } else {
    // Format ribuan: "32rb", "25k", "50 ribu", "13 rb"
    const ribuMatch = remainingText.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)/i);
    if (ribuMatch) {
      const val = parseFloat(ribuMatch[1].replace(',', '.'));
      amount = Math.round(val * 1000);
      remainingText = remainingText.replace(ribuMatch[0], '');
    } else {
      // Format angka titik: "1.384.000" atau "50.000" atau angka murni >= 1000
      const numMatch = remainingText.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,})/i);
      if (numMatch) {
        amount = parseInt(numMatch[1].replace(/\./g, ''), 10);
        remainingText = remainingText.replace(numMatch[0], '');
      } else {
        // Angka 2-3 digit (misal: "bensin 32" -> 32000, "wifi 50" -> 50000)
        const smallNumMatch = remainingText.match(/(?:rp\.?\s*)?(\d{2,3})(?!\d)/i);
        if (smallNumMatch) {
          const val = parseInt(smallNumMatch[1], 10);
          if (val >= 10 && val <= 999) {
            amount = val * 1000;
            remainingText = remainingText.replace(smallNumMatch[0], '');
          }
        }
      }
    }
  }

  // Siapkan daftar kategori aktual yang tersedia
  let incomeCategories = [];
  let expenseCategories = [];

  if (Array.isArray(categoriesData)) {
    // Jika berbentuk array flat (kompatibilitas lama)
    incomeCategories = categoriesData;
    expenseCategories = categoriesData;
  } else if (categoriesData && (categoriesData.INCOME || categoriesData.EXPENSE)) {
    // Format { INCOME: [...], EXPENSE: [...] }
    incomeCategories = categoriesData.INCOME || [];
    expenseCategories = categoriesData.EXPENSE || [];
  } else if (categoriesData && currentBook && categoriesData[currentBook]) {
    // Format { WIFI: { INCOME: [...], EXPENSE: [...] } }
    incomeCategories = categoriesData[currentBook].INCOME || [];
    expenseCategories = categoriesData[currentBook].EXPENSE || [];
  }

  // 2. Pencocokan Kategori & Tipe Otomatis
  let detectedType = currentBook === 'PRIBADI' ? 'EXPENSE' : 'INCOME';
  let matchedCategory = '';

  // Langkah A: Cari melalui kamus aturan kata kunci cerdas
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => raw.includes(kw))) {
      detectedType = rule.type;
      
      // Cari nama kategori yang paling sesuai dari kategori riil di sistem
      const targetPool = rule.type === 'INCOME' ? incomeCategories : expenseCategories;
      
      const foundInPool = targetPool.find((c) => {
        const cLower = c.toLowerCase();
        return rule.categoryKeywords.some((ckw) => cLower.includes(ckw));
      });

      if (foundInPool) {
        matchedCategory = foundInPool;
      } else {
        matchedCategory = rule.fallbackCategory;
      }
      break;
    }
  }

  // Langkah B: Jika belum cocok, cari langsung dari nama kategori aktif di database
  if (!matchedCategory) {
    // Cek di Pemasukan dulu
    const foundIncome = incomeCategories.find((c) => raw.includes(c.toLowerCase()));
    if (foundIncome) {
      detectedType = 'INCOME';
      matchedCategory = foundIncome;
    } else {
      // Cek di Pengeluaran
      const foundExpense = expenseCategories.find((c) => raw.includes(c.toLowerCase()));
      if (foundExpense) {
        detectedType = 'EXPENSE';
        matchedCategory = foundExpense;
      }
    }
  }

  // Langkah C: Deteksi kata kerja umum jika belum ada tipe pasti
  if (!matchedCategory) {
    if (/gaji|pemasukan|terima|dapat|masuk|laba|untung|omset/i.test(raw)) {
      detectedType = 'INCOME';
    } else if (/beli|bayar|keluar|ongkos|biaya|habis/i.test(raw)) {
      detectedType = 'EXPENSE';
    }
  }

  // Bersihkan teks untuk keterangan catatan (notes)
  const cleanedNotes = raw
    .replace(/\b(beli|bayar|ongkos|biaya|untuk|buat|ke|di|rp|tadi|kemarin)\b/gi, '')
    .replace(/\d+/g, '')
    .replace(/rp|rb|k|ribu|jt|juta/gi, '')
    .replace(/[-+]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  const finalNotes = cleanedNotes || (matchedCategory || 'Transaksi');

  return {
    amount,
    type: detectedType,
    category: matchedCategory,
    notes: finalNotes
  };
};
