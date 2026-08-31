# 🛒 Toko Grafika - Modern PWA Online Store & POS Kasir

Aplikasi Web Toko Online & POS Kasir Modern berbasis **Progressive Web App (PWA)** dengan integrasi **Firebase Firestore**, **Tailwind CSS**, dan alur pengembangan **Vite**.

Website Live: **[tokogrosir.id](https://tokogrosir.id/)** | **[tokografika.vercel.app](https://tokografika.vercel.app/)**

---

## 🌟 Fitur Unggulan

- 🛍️ **Katalog Online Responsif**: Pencarian instan, filter kategori, badge diskon, multi-varian produk, dan harga grosir bertingkat.
- 🏪 **POS Kasir (Point of Sale)**: Dirancang untuk transaksi cepat, scan barcode (Kamera Browser & Hybrid Kodular Bridge), kalkulasi otomatis diskon & kembalian, serta potong stok langsung.
- 🖨️ **Engine Cetak Terlengkap**:
  - **Struk Thermal**: Pilihan format 58mm & 80mm Bluetooth/USB dengan barcode visual authentic.
  - **Dokumen Bisnis A4**: Generator PDF Faktur Penjualan (Invoice) dan Surat Jalan Pengiriman logistik dengan layout multi-page presisi.
- 💬 **Checkout WhatsApp Otomatis**: Integrasi langsung format nota pesanan rapi ke WhatsApp toko beserta titik koordinat GPS Google Maps.
- 🔐 **Panel CMS & Hak Akses Kasir**: Pengelolaan produk, varian, HPP modal, kategori, voucher, banner, rekening bank, dan akun kasir ber-hak akses.
- 📱 **Progressive Web App (PWA)**: Dapat diinstall di layar utama HP (Android/iOS) dan Laptop/Desktop dengan dukungan cache offline cerdas (Service Worker v5).
- 🎨 **Kustomisasi Brand Dinamis**: Pilihan 14 tema warna brand dan background style dinamis yang langsung sinkron di seluruh aplikasi.

---

## 🎯 Standar Alur Pengembangan (Satu Jalur Tunggal)

Proyek ini menerapkan prinsip **Satu Pintu Utama (*Single Source of Truth*)**:

```
[Edit di src/] ──► [npm run build] ──► [git push origin main] ──► [Auto-Deploy di Vercel]
```

- **Branch Utama**: **`main`** (terhubung langsung ke Vercel).
- **Semua Perubahan**: Hanya dikerjakan di folder **`src/`**.

---

## 🛠️ Perintah Pengembangan (NPM Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Vite development server di `http://localhost:3000` dengan live-reload |
| `npm run build` | Mengompilasi source code `src/` menjadi bundle produksi di `dist/` dan `index.html` |
| `npm run preview` | Menjalankan local preview server untuk hasil build produksi |
| `npm test` | Menjalankan audit otomatis konsistensi DOM, Event Handlers, dan runtime safety |

---

## 📁 Struktur Direktori Proyek

```
├── dist/                  # Output build produksi siap deploy (Vercel)
│   ├── index.html         # Bundle HTML utama (HTML + CSS + JS)
│   └── sw.js              # Service Worker PWA produksi (v5)
├── docs/                  # Dokumentasi teknis & konfigurasi eksternal
│   ├── FIREBASE_CONFIG.md # Konfigurasi Firebase SDK
│   ├── FIRESTORE_RULES.txt# Aturan keamanan Cloud Firestore
│   ├── GOOGLE_APPS_SCRIPT.gs # Skrip upload foto Google Drive
│   └── PANDUAN_SAAS_DEVELOPER.md # Panduan developer & arsitektur
├── public/                # Aset statis & Service Worker master
│   └── sw.js              # Master Service Worker (PWA Cache v5)
├── scripts/               # Utilitas build & automated testing
│   ├── audit-bugs.js      # Audit konsistensi ID DOM & event handlers
│   └── build.js           # Compiler modular @include
├── src/                   # Source code utama aplikasi (Satu Pintu)
│   ├── components/        # Komponen HTML modular
│   │   ├── modals/        # Modal dialog (admin, detail order, panduan, quick edit, dll)
│   │   ├── templates/     # Template dokumen bisnis A4 (Invoice & Surat Jalan)
│   │   ├── views/         # Tampilan view (katalog, keranjang, checkout, payment, pos, admin)
│   │   ├── widgets/       # Global toast notification & loading spinner
│   │   └── body.html      # Master HTML body layout
│   ├── css/               # Styling CSS
│   │   ├── base.css       # Layout dasar, variabel warna tema & animasi
│   │   ├── components.css # Komponen UI (buttons, cards, badges, inputs)
│   │   ├── print.css      # Styling khusus media print thermal & A4
│   │   └── main.css       # Master CSS entry point
│   ├── js/                # Logika JavaScript modular
│   │   ├── core/          # Konfigurasi, Firebase, dan utilitas dasar
│   │   │   ├── config.js  # Global state & konfigurasi default
│   │   │   ├── firebase.js# Inisialisasi Firebase Firestore & Auth
│   │   │   └── utils.js   # Helper format rupiah, toast, konfirmasi, warna tema
│   │   ├── modules/       # Fitur-fitur modular aplikasi
│   │   │   ├── admin.js   # Panel CMS, CRUD produk, varian, laporan laba & akun
│   │   │   ├── cart.js    # Pengelola keranjang belanja & wishlist
│   │   │   ├── catalog.js # Render produk, filter kategori & pencarian katalog
│   │   │   ├── checkout.js# Kalkulasi ongkir KM, diskon voucher & WhatsApp order
│   │   │   ├── pos.js     # Engine POS Kasir, kalkulasi grosir & transaksi
│   │   │   ├── print.js   # Engine cetak thermal 58mm/80mm & PDF A4
│   │   │   ├── pwa.js     # Engine PWA, manifest generator & install prompt
│   │   │   ├── scanner.js # Kamera scanner barcode/QR & bridge Android hybrid
│   │   │   ├── seo.js     # Engine SEO meta tag & Schema.org JSON-LD Google
│   │   │   └── sync.js    # Realtime sync harga & stok produk
│   │   ├── bootstrap.js   # Inisialisasi routing & event listener awal
│   │   └── app.js         # Master JavaScript entry point
│   └── index.html         # Master template HTML
├── index.html             # Entry point Vite dev server
├── package.json           # Dependensi & script proyek
├── vercel.json            # Konfigurasi hosting & header zero-cache Vercel
└── vite.config.mjs        # Konfigurasi build plugin Vite
```

---

## 🔒 Konfigurasi Hosting (Vercel)

Proyek ini telah dikonfigurasi dengan header *zero-cache* pada file `vercel.json` untuk memastikan setiap kali Anda melakukan push ke branch **`main`**, Vercel akan langsung mengompilasi dan menampilkan versi teranyar dalam hitungan detik.

---

## 📄 Lisensi
Hak Cipta © 2026 **Toko Grafika**. Seluruh hak cipta dilindungi undang-undang.
