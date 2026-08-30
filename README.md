# Toko Grafika - Modern PWA Online Store & POS

Aplikasi Web Toko Online & Kasir (Point of Sale) Modern berbasis **Progressive Web App (PWA)** dengan integrasi Firebase Firestore, Tailwind CSS, dan workflow development **Vite**.

## 🚀 Fitur Utama
- ⚡ **Vite Powered**: Development server super cepat dengan live reload otomatis.
- 📱 **PWA Ready**: Dukungan Progressive Web App (manifest dinamis, installable di Android/iOS/Desktop).
- 🔥 **Firebase Firestore**: Sinkronisasi data katalog produk, keranjang, dan pesanan secara realtime.
- 📑 **Invoice & Surat Jalan**: Generator cetak struk/nota ukuran thermal dan dokumen invoice A4 otomatis.
- 🎨 **100% Modular Architecture**: Pemisahan komponen CSS, JS, dan HTML yang rapi di dalam direktori `src/`.

---

## 🛠️ Perintah Pengembangan (Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Vite dev server di `http://localhost:3000` dengan auto-reload |
| `npm run build` | Mengompilasi aplikasi web produksi menjadi `dist/index.html` |
| `npm run preview` | Menjalankan local preview server untuk hasil build produksi |
| `npm test` | Menjalankan audit bug konsistensi DOM dan event handler JS |

---

## 📁 Struktur Direktori Bersih & Modular

```
├── dist/                  # Output build produksi (ringkas & bersih)
│   └── index.html         # Web app bundle siap pakai untuk hosting (Vercel)
├── docs/                  # Dokumentasi & konfigurasi eksternal
│   ├── FIREBASE_CONFIG.md # Kredensial Firebase SDK
│   ├── FIRESTORE_RULES.txt# Aturan keamanan Cloud Firestore
│   └── GOOGLE_APPS_SCRIPT.gs # Skrip uploader Google Drive
├── scripts/               # Utilitas build & testing
│   ├── audit-bugs.js      # Audit konsistensi ID DOM dan event handler JS
│   └── build.js           # Engine compiler modular @include
├── src/                   # Source code modular
│   ├── components/        # Komponen HTML
│   │   ├── modals/        # Modal dialog (admin, order, product, pdf, receipt, scanner, confirm)
│   │   ├── templates/     # Template cetak dokumen A4 (Invoice & Surat Jalan)
│   │   ├── views/         # Tampilan halaman (catalog, cart, checkout, payment, wishlist, admin, login)
│   │   ├── widgets/       # Global toast & loader
│   │   └── body.html      # Master HTML body entry point
│   ├── css/               # Styling CSS
│   │   ├── base.css       # Layout dasar, variabel tema & animasi
│   │   ├── components.css # Komponen UI (buttons, cards, badges, inputs, radios)
│   │   ├── print.css      # Styling khusus cetak thermal 58mm
│   │   └── main.css       # Master CSS entry point
│   ├── js/                # Logika JavaScript
│   │   ├── core/          # Core config, Firebase sync, & utilities
│   │   │   ├── config.js  # Global state & konfigurasi
│   │   │   ├── firebase.js# Firebase Firestore initialization & sync
│   │   │   └── utils.js   # Helper format rupiah, toast, konfirmasi, tema
│   │   ├── modules/       # Fitur modular aplikasi
│   │   │   ├── admin.js   # CMS admin, CRUD produk/voucher/banner/akun
│   │   │   ├── cart.js    # Keranjang belanja & wishlist
│   │   │   ├── catalog.js # Render produk, filter kategori & pencarian
│   │   │   ├── checkout.js# Kalkulasi ongkir, diskon voucher & WhatsApp order
│   │   │   ├── print.js   # Engine cetak thermal 58mm & generator A4
│   │   │   ├── pwa.js     # Engine PWA & manifest generator
│   │   │   ├── scanner.js # Kamera scanner barcode/QR & hybrid bridge
│   │   │   └── sync.js    # Sinkronisasi harga & stok realtime
│   │   ├── bootstrap.js   # Routing & event listeners awal
│   │   └── app.js         # Master JS orchestrator entry point
│   └── index.html         # Master HTML template
├── index.html             # Entry point Vite dev server
├── vercel.json            # Konfigurasi deployment Vercel
└── vite.config.mjs        # Konfigurasi & custom plugin Vite
```

---

## 🌐 Cara Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com).
2. Pilih **Import Git Repository** (`admgaffidigital/tokografika`).
3. Vercel akan otomatis mengenali konfigurasi `vite` dan output `dist/index.html`.
4. Klik **Deploy**.
