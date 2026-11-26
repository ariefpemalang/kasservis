// Smart AI Parser untuk Input Suara & Teks Bahasa Indonesia
// Menganalisis kalimat seperti: "bensin 32rb", "warung madura 13.000", "gajian 1.384.000", "sangu mamas 5rb"

export const parseSmartInput = (text, availableCategories = []) => {
  if (!text) return null;
  const raw = text.toLowerCase().trim();

  let amount = 0;
  let remainingText = raw;

  // 1. Ekstraksi Nominal Uang
  // Cek format jutaan: "1.5 jt", "2 juta", "1,384 jt"
  const jutaMatch = remainingText.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
  if (jutaMatch) {
    const val = parseFloat(jutaMatch[1].replace(',', '.'));
    amount = Math.round(val * 1000000);
    remainingText = remainingText.replace(jutaMatch[0], '');
  } else {
    // Cek format ribuan: "32rb", "25k", "50 ribu", "13 rb"
    const ribuMatch = remainingText.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)/i);
    if (ribuMatch) {
      const val = parseFloat(ribuMatch[1].replace(',', '.'));
      amount = Math.round(val * 1000);
      remainingText = remainingText.replace(ribuMatch[0], '');
    } else {
      // Cek angka dengan titik ribuan e.g. "1.384.000" atau "50.000" atau angka murni >= 1000
      const numMatch = remainingText.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,})/i);
      if (numMatch) {
        amount = parseInt(numMatch[1].replace(/\./g, ''), 10);
        remainingText = remainingText.replace(numMatch[0], '');
      } else {
        // Cek angka 2-3 digit jika diawali atau diakhiri konteks uang (e.g. "32" jika tidak ada angka lain)
        const smallNumMatch = remainingText.match(/(?:rp\.?\s*)?(\d{2,3})(?!\d)/i);
        if (smallNumMatch) {
          // Asumsi angka puluhan di catatan harian adalah ribuan (misal "bensin 32" -> 32000)
          const val = parseInt(smallNumMatch[1], 10);
          if (val >= 10 && val <= 999) {
            amount = val * 1000;
            remainingText = remainingText.replace(smallNumMatch[0], '');
          }
        }
      }
    }
  }

  // 2. Deteksi Tipe (Pemasukan vs Pengeluaran)
  let detectedType = 'EXPENSE';
  if (/gaji|gajian|pemasukan|terima|dapat|masuk|laba|untung|omset|iuran|ongkos servis|jual/i.test(raw)) {
    detectedType = 'INCOME';
  }

  // 3. Pencocokan Kategori Otomatis berdasarkan Kamus Kata Kunci
  let matchedCategory = '';
  // Bersihkan kata-kata bantu
  let cleanedNotes = remainingText
    .replace(/\b(beli|bayar|ongkos|biaya|untuk|buat|ke|di|rp|tadi|kemarin)\b/gi, '')
    .replace(/[-+]/g, '')
    .trim();

  // Bersihkan spasi ganda
  cleanedNotes = cleanedNotes.replace(/\s+/g, ' ');

  const keywordMap = {
    'Makanan': ['makan', 'warung', 'soto', 'bakso', 'nasi', 'ayam', 'mie', 'miayam', 'kebab', 'lapar', 'snack', 'roti', 'kue', 'resto', 'jajan', 'lawuh', 'lawuhan', 'sarapan', 'madura'],
    'Minuman': ['minum', 'kopi', 'teh', 'es', 'jus', 'boba', 'bearbrand', 'susu', 'air', 'aqua', 'leminerale'],
    'Transportasi': ['bensin', 'bbm', 'pertalite', 'pertamax', 'solar', 'parkir', 'ojek', 'grab', 'gojek', 'tol', 'bus', 'angkot'],
    'Anak-anak': ['adek', 'anak', 'susu adek', 'pampers', 'mainan', 'bocil'],
    'kluarga': ['sangu', 'mamas', 'ibu', 'istri', 'keluarga', 'ortu', 'bapak'],
    'Belanja': ['belanja', 'pasar', 'supermarket', 'indomaret', 'alfamart', 'sayur', 'sabun', 'shampoo'],
    'tagihan': ['listrik', 'pln', 'air', 'pdam', 'wifi', 'internet', 'pulsa', 'kuota', 'sewa'],
    'pajak': ['pajak', 'stnk', 'pbb', 'bpjs'],
    'Perbaikan': ['servis', 'service', 'sparepart', 'lcd', 'baterai', 'ganti', 'rusak', 'solder', 'bengkel', 'soket', 'tombol', 'alat'],
    'Pakaian': ['pakaian', 'baju', 'celana', 'kaos', 'sepatu', 'sandal', 'jaket'],
    'Kesehatan': ['obat', 'dokter', 'klinik', 'apotek', 'vitamin', 'sakit', 'paracetamol'],
    'Peliharaan': ['kucing', 'anjing', 'whiskas', 'pakan', 'peliharaan'],
    'Pendidikan': ['sekolah', 'spp', 'buku', 'kursus', 'kuliah', 'pendidikan'],
    'Sosial': ['sedekah', 'infaq', 'kondangan', 'sosial', 'sumbangan', 'donasi'],
    'nabung': ['nabung', 'simpan', 'investasi', 'deposito', 'tabungan'],
    'qrin': ['qris', 'qrin', 'scan'],
    'Gaji': ['gaji', 'gajian', 'bonus', 'omset', 'upah', 'laba']
  };

  for (const [catName, keywords] of Object.entries(keywordMap)) {
    if (keywords.some(kw => raw.includes(kw))) {
      matchedCategory = catName;
      break;
    }
  }

  // Jika belum cocok, cari kecocokan pada daftar kategori aktif
  if (!matchedCategory && availableCategories && availableCategories.length > 0) {
    const found = availableCategories.find(c => raw.includes(c.toLowerCase()));
    if (found) matchedCategory = found;
  }

  // Notes yang rapi untuk ditampilkan di riwayat transaksi
  const finalNotes = cleanedNotes || raw.replace(/\d+/g, '').replace(/rp|rb|k|ribu|jt|juta/gi, '').trim() || (matchedCategory || 'Transaksi');

  return {
    amount,
    type: detectedType,
    category: matchedCategory,
    notes: finalNotes
  };
};
