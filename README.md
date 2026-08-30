# Freshmart Blogger PWA Template

Tema Blogger PWA Modern & Modular dengan integrasi Firebase Firestore, Tailwind CSS, dan workflow development berbasis **Vite**.

## 🚀 Fitur Utama
- ⚡ **Vite Powered**: Development server super cepat dengan live reload otomatis.
- 📱 **PWA Ready**: Dukungan Progressive Web App (manifest dinamis, service worker ready, installable di Android/iOS/Desktop).
- 🔥 **Firebase Firestore**: Sinkronisasi data katalog produk, keranjang, dan pesanan secara realtime.
- 📑 **Invoice & Surat Jalan**: Generator cetak struk/nota ukuran thermal dan dokumen invoice A4 otomatis.
- 🎨 **100% Modular Architecture**: Pemisahan komponen CSS, JS, dan HTML yang sangat rapi di dalam direktori `src/`.

---

## 🛠️ Perintah Pengembangan (Scripts)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Vite dev server di `http://localhost:3000` dengan auto-reload |
| `npm run build` | Mengompilasi seluruh kode modular menjadi `dist/theme.xml` dan `dist/index.html` |
| `npm run build:xml` | Menjalankan builder XML Blogger secara mandiri |
| `npm run preview` | Menjalankan local preview server untuk hasil build produksi |
| `npm test` | Menjalankan audit bug dan validasi kepatuhan sintaks XML Blogger |

---

## 📁 Struktur Direktori Modular

```
├── dist/                  # Output build produksi (ringkas & bersih)
│   ├── index.html         # Web preview untuk deployment (Vercel)
│   └── theme.xml          # XML Theme siap pakai untuk Blogger
├── scripts/               # Utilitas build & testing
│   ├── audit-bugs.js      # Audit konsistensi ID DOM dan event handler JS
│   ├── build.js           # Engine compiler modular @include
│   └── validate-xml.js    # Validator kepatuhan sintaks Blogger XML 1.0
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
│   └── template.xml       # Master template Blogger
├── index.html             # Entry point Vite dev server
├── vercel.json            # Konfigurasi deployment Vercel
└── vite.config.mjs        # Konfigurasi & custom plugin Vite
```

---

## 🌐 Cara Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com).
2. Pilih **Import Git Repository** (`admgaffidigital/tokografika`).
3. Vercel akan otomatis mengenali konfigurasi `vite` dan output `dist/`.
4. Klik **Deploy**.

---

## 📝 Cara Pasang ke Blogger

1. Buka dashboard **Blogger** > Menu **Tema (Theme)**.
2. Klik ikon panah ke bawah di sebelah tombol **Sesuaikan (Customize)** > Pilih **Edit HTML**.
3. Buka file [`dist/theme.xml`](dist/theme.xml), salin seluruh isinya, lalu tempelkan (paste) menggantikan seluruh kode di editor Blogger.
4. Klik **Simpan (Save)**.
