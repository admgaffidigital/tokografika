# 📋 Catatan Rilis & Riwayat Pembaruan (Changelog)

Semua pembaruan dan perbaikan pada sistem **Toko Grafika PWA** didokumentasikan di sini.

---

## [2026-09-15] - Penyesuaian Rasio Banner Beranda 16:9 & Tata Letak Rapi
### Perbaikan & Peningkatan:
- **Rasio Murni 16:9 (`aspect-video` & `aspect-ratio: 16 / 9`):**
  - Mengubah rasio kontainer dan elemen banner dari rasio lama (21:9 & 16:7) menjadi 16:9 presisi.
  - Gambar banner berukuran 16:9 (rekomendasi 1200x675 px, 1280x720 px, 1920x1080 px) kini tampil 100% utuh tanpa pemotongan gambar di bagian atas, bawah, maupun samping.
- **Tata Letak Desktop Simetris 50%-50%:**
  - Mengatur tampilan 2 banner berdampingan secara simetris di layar desktop (`lg:w-[calc(50%-0.5rem)] lg:flex-1`).
  - Menghilangkan bug overflow horizontal ke kanan layar yang sebelumnya memotong banner kedua.
- **Carousel & Navigasi Responsif di Mobile/Tablet:**
  - Banner dapat di-*swipe* secara horizontal dengan *snap scroll* mulus di perangkat HP/tablet.
  - Ditambahkan tombol navigasi panah kiri/kanan di desktop dan dot indikator slide di bagian bawah.
- **Kejernihan Visual & Desain Grafis:**
  - Menghilangkan overlay gradien gelap jika teks banner di CMS dikosongkan agar ilustrasi dan tulisan grafis banner tetap cerah maksimal.
  - Penyesuaian zoom hover halus (`scale-[1.02]`) agar teks tidak keluar bingkai.
- **Pratinjau Thumbnail 16:9 di CMS Admin:**
  - Tabel Kelola Banner di panel Admin CMS kini menampilkan pratinjau thumbnail berbentuk 16:9 rapi.

---

## [2026-09-14] - Revalidasi Live Changelog & Bebas Ongkir
- Revalidasi otomatis riwayat commit GitHub live, bypass cache browser, dan sinkronisasi branch utama.
- Fitur Promo Bebas Ongkir Otomatis (*Free Shipping Threshold*) & Panduan Belanja Pelanggan.

---

## [2026-09-13] - Standardisasi Geometri Squircle & UI/UX Modern
- Standardisasi global elemen UI menjadi bentuk squircle lembut, pill badge, dan micro-interaction hover.
- Optimalisasi Firestore debounce, sinkronisasi rDyn, dan konsistensi modal back handler.
