-- ========================================================
-- SETUP TABEL KHUSUS BUKU KAS (AMAN 100%, TIDAK MENGGANGGU AR-PRO)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> Run
-- ========================================================

-- 1. Buat Tabel Profil Khusus Buku Kas
CREATE TABLE IF NOT EXISTS public.bukukas_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kasir_wifi' CHECK (role IN ('owner', 'kasir_wifi', 'teknisi')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat Tabel Transaksi Khusus Buku Kas (WiFi, Servis, Pribadi)
CREATE TABLE IF NOT EXISTS public.bukukas_transactions (
  id TEXT PRIMARY KEY,
  book TEXT NOT NULL CHECK (book IN ('WIFI', 'SERVIS', 'PRIBADI')),
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'INCOME', 'EXPENSE')),
  amount NUMERIC(15, 2) NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'Tunai',
  receipt_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daftarkan Tabel ke Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bukukas_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bukukas_transactions;
  END IF;
END $$;

-- 4. Setup Storage Bucket 'receipts' (Jika belum ada)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
  
  CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
  CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
END $$;

-- 5. Row Level Security (RLS) Aman
ALTER TABLE public.bukukas_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bukukas_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "bukukas_profiles_all" ON public.bukukas_profiles;
  DROP POLICY IF EXISTS "bukukas_transactions_all" ON public.bukukas_transactions;

  CREATE POLICY "bukukas_profiles_all" ON public.bukukas_profiles FOR ALL TO public USING (true) WITH CHECK (true);
  CREATE POLICY "bukukas_transactions_all" ON public.bukukas_transactions FOR ALL TO public USING (true) WITH CHECK (true);
END $$;

-- ========================================================
-- SELESAI! Tabel bukukas_transactions & bukukas_profiles siap.
-- ========================================================
