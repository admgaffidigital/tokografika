# 📘 PANDUAN PENGELOLAAN SAAS & LISENSI DEVELOPER
### Toko Grafika - FreshMart PWA & POS Kasir Premium

Dokumen ini berisi panduan teknis bagi Developer / Pemilik Sistem untuk mengelola sistem berlangganan (SaaS), lisensi toko klien, manajemen Harga Pokok Penjualan (HPP), dan generator Auto SKU.

---

## 🌟 1. Paket & Skema Bisnis SaaS
| Nama Paket | Harga Normal | Harga Promo | Keterangan |
| :--- | :--- | :--- | :--- |
| **Freemium (Free)** | Rp 0 | Rp 0 | Website toko online reguler (katalog, keranjang, checkout WA). |
| **Paket Bulanan** | Rp 50.000 / bln | **Rp 35.000 / bln** | Full POS Kasir, Struk Thermal 58mm, Invoice A4, HPP, Auto SKU. |
| **Paket Tahunan** | Rp 420.000 / thn | **Rp 350.000 / thn** | Hemat 2 bulan + Gratis Setup & Prioritas CS. |

---

## 🔑 2. Cara Membuat & Mengaktifkan Lisensi Klien (Firebase Console)
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

## ⛔ 3. Cara Menonaktifkan / Mencabut Langganan Klien
Jika masa langganan klien habis atau belum melakukan pembayaran:
1. Buka koleksi **`freshmart_licenses`** di Firebase Console.
2. Cari Document ID lisensi milik klien tersebut.
3. Ubah field **`isActive`** menjadi **`false`** (atau hapus dokumen tersebut).
4. Akses POS Kasir & fitur HPP pada aplikasi klien akan **otomatis terkunci kembali** ke versi Free saat aplikasi dimuat ulang.

---

## 👑 4. Akun Master Developer (Bypass Otomatis)
Jika Anda ingin masuk ke CMS dan POS Kasir dengan hak akses **PRO DEV** tanpa perlu memasukkan kode lisensi:
- Di form login Admin, gunakan akun **Email & Password Firebase Auth Developer** Anda (mengandung karakter `@` dan `.`).
- Sistem otomatis mengaktifkan status `isAdm = true; isPro = true; cRole = 'admin'; cPerms = ['all']`.

---

## ⚡ 5. Perintah Uji Coba Cepat di Console Browser (Testing)
Buka DevTools Browser (Tekan `F12` > tab `Console`):

- **Aktifkan Mode PRO Langsung**:
  ```javascript
  localStorage.setItem('freshmart_cache_PRO', 'DEV-MASTER-PRO');
  isPro = true;
  location.reload();
  ```

- **Nonaktifkan Mode PRO (Uji Paywall Free)**:
  ```javascript
  localStorage.removeItem('freshmart_cache_PRO');
  isPro = false;
  location.reload();
  ```

---

## 🛡️ 6. Keamanan Firestore Security Rules
Aturan keamanan pada `freshmart_licenses` dirancang khusus anti-bocor:
- `allow get: if true;` -> Klien hanya bisa memvalidasi 1 kode lisensi miliknya.
- `allow list: if false;` -> Klien dilarang melihat daftar kode toko lain.
- `allow write: if false;` -> Klien dilarang membuat atau mengubah lisensi sendiri.
