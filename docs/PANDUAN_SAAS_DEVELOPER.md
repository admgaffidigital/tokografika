# 📘 PANDUAN PENGELOLAAN SAAS & LISENSI DEVELOPER
### Toko Grafika - FreshMart PWA & POS Kasir Premium

Dokumen ini berisi panduan teknis bagi Developer / Pemilik Sistem untuk mengelola sistem berlangganan (SaaS), lisensi toko klien, manajemen Stok & Harga Pokok Penjualan (HPP), pembagian hak akses kasir, serta arsitektur hemat kuota Firestore.

---

## 🌟 1. Paket & Skema Bisnis SaaS
| Nama Paket | Harga Normal | Harga Promo | Keterangan |
| :--- | :--- | :--- | :--- |
| **Freemium (Free)** | Rp 0 | Rp 0 | Website toko online reguler (katalog, keranjang, checkout WA). |
| **Paket Bulanan** | Rp 50.000 / bln | **Rp 35.000 / bln** | Full POS Kasir, Struk Thermal 58mm, Invoice A4, HPP, Auto SKU, Manajemen Stok. |
| **Paket Tahunan** | Rp 420.000 / thn | **Rp 350.000 / thn** | Hemat 2 bulan + Gratis Setup & Prioritas CS. |

---

## 🔑 2. Kode Master Developer & Aktivasi Instan
Developer memiliki kode lisensi master yang **selalu aktif permanen (0 Read Firestore)**:
- **`TOKOGRAFIKA2026`** *(Utama)*
- `GRAFIKA-PRO-2026`
- `GRAFIKA-MASTER-PRO`

---

## 🏬 3. Cara Membuat & Mengaktifkan Lisensi Klien (Firebase Console)
Setiap kali ada klien yang berlangganan:
1. Buka [**Firebase Console**](https://console.firebase.google.com/) > Pilih Project Anda.
2. Buka **Firestore Database** > Pilih koleksi **`freshmart_licenses`**.
3. Klik **`+ Add Document`**:
   - **Document ID**: Masukkan kode unik langganan (Contoh: `GRAFIKA-PRO-849201` atau `SUB-08123456789`).
   - Masukkan Field berikut:

| Field | Type | Value Contoh | Deskripsi |
| :--- | :--- | :--- | :--- |
| `isActive` | `boolean` | `true` | **Wajib `true`** agar fitur aktif |
| `type` | `string` | `"PRO"` | **Wajib `"PRO"`** |
| `storeName` | `string` | `"Toko Berkah Jaya"` | Catatan nama toko klien |
| `plan` | `string` | `"Bulanan Promo Rp 35.000"` | Paket yang dipilih |
| `createdAt` | `timestamp` | `2026-08-30` | Tanggal pembuatan |
| `expiredAt` | `string` | `"2026-09-30"` | Tanggal jatuh tempo |

4. Klik **Save**. Berikan kode **Document ID** kepada klien untuk dimasukkan pada modal aktivasi aplikasi.

---

## ⛔ 4. Cara Menonaktifkan / Mencabut Langganan Klien
Jika masa langganan klien habis atau belum melakukan pembayaran:
1. Buka koleksi **`freshmart_licenses`** di Firebase Console.
2. Cari Document ID lisensi milik klien tersebut.
3. Ubah field **`isActive`** menjadi **`false`** (atau hapus dokumen tersebut).
4. Akses POS Kasir pada aplikasi klien akan **otomatis terkunci kembali** ke versi Free saat aplikasi dimuat ulang.

---

## 📦 5. Manajemen Stok & Live Deduction
1. **Input Stok**: Setiap produk dan varian memiliki field `stock` di form CMS Admin.
2. **Pemotongan Otomatis**: Setiap transaksi POS Kasir berhasil diselesaikan, stok produk/varian otomatis berkurang di `appData.products` dan database Firestore.
3. **Indikator Habis**: Produk/varian dengan stok 0 otomatis diberi badge `(Habis)` dan dinonaktifkan di POS agar tidak bisa dibeli.

---

## 🔒 6. Pembagian Hak Akses Kasir Terbatas vs Admin
Secara default, akun dengan role Kasir (`cashier`) memiliki akses terbatas:
- **TIDAK BISA** melihat Harga Modal (HPP) produk dan margin keuntungan.
- **TIDAK BISA** mengubah stok atau melihat laporan keuangan kecuali dicentang oleh Admin di CMS > **Kelola Akun Kasir**:
  - `[x] 🔓 Boleh Lihat Harga Modal (HPP)`
  - `[x] 📦 Boleh Ubah Stok Produk`
  - `[x] 📊 Boleh Lihat Laporan Keuntungan`

---

## 🛡️ 7. Arsitektur Ultra-Hemat Kuota Firestore (Free Tier Friendly)
1. **Smart Cache 1-Read**: Saat pengunjung membuka toko, sistem hanya membaca 1 dokumen metadata (`cms_data.lastUpdate`). Jika data belum diubah oleh admin, produk dimuat dari cache lokal `localStorage` (**Hemat ~98% kuota read**).
2. **24-Hour License TTL**: Status lisensi PRO tersimpan permanen di browser, mencegah query berulang ke Firestore pada setiap reload.
3. **Metadata-Only Real-time Listener**: Real-time price watcher hanya mendengarkan dokumen metadata `cms_data`, bukan seluruh subkoleksi produk.
