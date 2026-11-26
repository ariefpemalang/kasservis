// Smart AI Parser untuk Input Suara & Teks Bahasa Indonesia
// Menganalisis kalimat seperti: "Beli bensin 30rb", "Makan bakso 25 ribu", "Iuran wifi 165.000", "Gaji servis laptop 200k"

export const parseSmartInput = (text, availableCategories = []) => {
  if (!text) return null;
  const raw = text.toLowerCase().trim();

  let amount = 0;
  let remainingText = raw;

  // 1. Ekstraksi Nominal Uang
  // Cek satuan Juta (jt / juta)
  const jutaMatch = remainingText.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
  if (jutaMatch) {
    const val = parseFloat(jutaMatch[1].replace(',', '.'));
    amount = Math.round(val * 1000000);
    remainingText = remainingText.replace(jutaMatch[0], '');
  } else {
    // Cek satuan Ribu (rb / k / ribu)
    const ribuMatch = remainingText.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)/i);
    if (ribuMatch) {
      const val = parseFloat(ribuMatch[1].replace(',', '.'));
      amount = Math.round(val * 1000);
      remainingText = remainingText.replace(ribuMatch[0], '');
    } else {
      // Cek angka murni e.g. 50.000 atau 50000
      const numMatch = remainingText.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,})/i);
      if (numMatch) {
        amount = parseInt(numMatch[1].replace(/\./g, ''), 10);
        remainingText = remainingText.replace(numMatch[0], '');
      }
    }
  }

  // 2. Deteksi Tipe (Pemasukan vs Pengeluaran)
  let detectedType = 'EXPENSE';
  if (/gaji|pemasukan|terima|dapat|masuk|jual|laba|untung|omset|iuran/i.test(raw)) {
    detectedType = 'INCOME';
  }

  // 3. Pencocokan Kategori Otomatis
  let matchedCategory = '';
  const cleanedText = remainingText.replace(/beli|bayar|ongkos|biaya|untuk|buat|rp/gi, '').trim();

  const keywordMap = {
    'Makanan': ['makan', 'warung', 'soto', 'bakso', 'nasi', 'ayam', 'mie', 'miayam', 'kebab', 'lapar', 'snack', 'roti', 'kue', 'resto', 'jajan', 'lawuh', 'lawuhan'],
    'Minuman': ['minum', 'kopi', 'teh', 'es', 'jus', 'boba', 'bearbrand', 'susu', 'air'],
    'Transportasi': ['bensin', 'bbm', 'pertalite', 'pertamax', 'solar', 'parkir', 'ojek', 'grab', 'gojek', 'tol', 'bus', 'angkot'],
    'Belanja': ['belanja', 'pasar', 'supermarket', 'indomaret', 'alfamart', 'sayur', 'sabun'],
    'tagihan': ['listrik', 'pln', 'air', 'pdam', 'wifi', 'internet', 'pulsa', 'kuota', 'sewa'],
    'Perbaikan': ['servis', 'service', 'sparepart', 'lcd', 'baterai', 'ganti', 'rusak', 'solder', 'bengkel', 'soket', 'tombol'],
    'Anak-anak': ['adek', 'anak', 'susu anak', 'pampers', 'mainan'],
    'kluarga': ['sangu', 'mamas', 'ibu', 'istri', 'keluarga', 'ortu'],
    'Kesehatan': ['obat', 'dokter', 'klinik', 'apotek', 'vitamin', 'sakit'],
    'nabung': ['nabung', 'simpan', 'investasi', 'deposito']
  };

  for (const [catName, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => raw.includes(kw))) {
      matchedCategory = catName;
      break;
    }
  }

  // Jika belum cocok, cari kecocokan persis pada daftar kategori yang ada
  if (!matchedCategory && availableCategories.length > 0) {
    const found = availableCategories.find(c => raw.includes(c.toLowerCase()));
    if (found) matchedCategory = found;
  }

  return {
    amount,
    type: detectedType,
    category: matchedCategory,
    notes: cleanedText || raw
  };
};
