# Freshmart Blogger PWA Template

Tema Blogger PWA Modern & Modular dengan integrasi Firebase Firestore, Tailwind CSS, dan workflow development berbasis **Vite**.

## 🚀 Fitur Utama
- ⚡ **Vite Powered**: Development server super cepat dengan live reload otomatis.
- 📱 **PWA Ready**: Dukungan Progressive Web App (manifest dinamis, service worker ready, installable di Android/iOS/Desktop).
- 🔥 **Firebase Firestore**: Sinkronisasi data katalog produk, keranjang, dan pesanan secara realtime.
- 📑 **Invoice & Surat Jalan**: Generator cetak struk/nota ukuran thermal dan dokumen invoice A4 otomatis.
- 🎨 **Modular Architecture**: Pemisahan komponen CSS, JS, dan HTML yang rapi di dalam direktori `src/`.

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

## 📁 Struktur Direktori

```
├── dist/                  # Output build produksi (theme.xml, index.html, preview.html)
│   ├── index.html         # Preview web untuk deployment (Vercel / Netlify)
│   ├── preview.html       # Standalone local HTML preview
│   └── theme.xml          # Kode XML Theme siap diimpor ke Blogger
├── scripts/               # Utilitas build & testing
│   ├── audit-bugs.js      # Audit konsistensi ID DOM dan event handler JS
│   ├── build.js           # Engine compiler modular @include
│   └── validate-xml.js    # Validator kepatuhan sintaks Blogger XML 1.0
├── src/                   # Source code modular
│   ├── components/        # Komponen template & tampilan HTML
│   ├── css/               # File styling CSS utama
│   ├── js/                # Logika aplikasi JS & integrasi Firebase
│   └── template.xml       # Template induk Blogger
├── index.html             # Entry point Vite dev server
├── vercel.json            # Konfigurasi deployment Vercel
└── vite.config.mjs        # Konfigurasi & custom plugin Vite
```

---

## 🌐 Cara Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com).
2. Pilih **Import Git Repository** (`admgaffidigital/tokografika`).
3. Vercel akan otomatis mengenali konfigurasi `vite` dan `dist/`.
4. Klik **Deploy**.

---

## 📝 Cara Pasang ke Blogger

1. Buka dashboard **Blogger** > Menu **Tema (Theme)**.
2. Klik ikon panah ke bawah di sebelah tombol **Sesuaikan (Customize)** > Pilih **Edit HTML**.
3. Buka file [`dist/theme.xml`](dist/theme.xml), salin seluruh isinya, lalu tempelkan (paste) menggantikan seluruh kode di editor Blogger.
4. Klik **Simpan (Save)**.
