# 📱 Buku Kas Digital Realtime (Supabase Edition)

Aplikasi **Buku Kas Digital** (WiFi, Servis, dan Pribadi) yang kini menggunakan **Supabase** sebagai database PostgreSQL *realtime* & *serverless*.

### ✨ Keuntungan Menggunakan Supabase:
- **Tanpa Perlu Backend Node.js / PM2**: Tidak ada server yang perlu diatur di aaPanel.
- **Deploy Super Mudah**: Cukup upload folder `dist` ke **Website Biasa (HTML / Static)** di aaPanel.
- **Database Realtime PostgreSQL**: Setiap transaksi langsung tersinkronisasi otomatis antar HP tanpa refresh.
- **Penyimpanan Foto Bukti Struk**: Otomatis tersimpan di Supabase Storage (Bucket `receipts`).

---

## 🚀 Panduan Setup 3 Langkah Cepat

### Langkah 1: Siapkan Database di Supabase (2 Menit)
1. Buka **[https://supabase.com](https://supabase.com)** dan buat proyek baru (*New Project*).
2. Setelah proyek selesai dibuat, masuk ke menu **SQL Editor** di sebelah kiri.
3. Klik **New query**, lalu salin (copy) dan tempel (paste) seluruh isi file **[`supabase_setup.sql`](./supabase_setup.sql)**.
4. Klik tombol hijau **Run**. (Tabel `profiles`, `transactions`, storage bucket, dan hak akses RBAC otomatis selesai dibuat).

---

### Langkah 2: Ambil Kunci API Supabase
1. Di dashboard Supabase, buka menu **Project Settings** (ikon gerigi di kiri bawah) → **API**.
2. Salin 2 nilai berikut:
   - **Project URL** (contoh: `https://abcdefghijklm.supabase.co`)
   - **Project API Keys** → bagian **anon public** (contoh: `eyJhbGciOi...`)

---

### Langkah 3: Deploy di aaPanel Proxmox (Tanpa Perlu Node.js!)
Karena aplikasi sudah menggunakan Supabase, di aaPanel Anda **cukup membuat Website Biasa (Static / HTML)**:

1. Buka dashboard **aaPanel**.
2. Masuk ke menu **Website** → Klik **Add site**:
   - **Domain name**: Masukkan IP server Anda atau domain (misal: `192.168.1.100:8080` atau `kas.domainanda.com`).
   - **PHP version**: Pilih **Pure / Static** (atau versi PHP berapa saja bebas).
3. Buka menu **Files** di aaPanel, masuk ke folder website tersebut (misal `/www/wwwroot/kas.domainanda.com`).
4. Upload semua file yang ada di dalam folder **`frontend/dist`** proyek ini ke dalam folder website tersebut.
5. Selesai! Buka website tersebut di browser HP atau PC Anda.

---

## 🔑 Login & Pembuatan Akun Otomatis

1. Saat pertama kali web dibuka, akan muncul jendela konfigurasi untuk menempelkan **Supabase URL** dan **Anon Key**.
2. Di halaman login, klik tulisan:
   👉 **`"Akun belum ada di Supabase? Buat Akun Bawaan Otomatis"`**
3. Sistem akan otomatis mendaftarkan 3 akun bawaan:

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Owner (Superadmin)** | `admin` | `admin123` | Akses semua buku kas + kelola user |
| **Kasir WiFi** | `kasir` | `kasir123` | Hanya Buku Kas WiFi |
| **Teknisi** | `teknisi` | `teknisi123` | Hanya Buku Kas Servis |

4. Anda bisa langsung klik tombol login cepat untuk masuk ke akun yang diinginkan!
