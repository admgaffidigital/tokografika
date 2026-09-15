# 📋 Catatan Rilis & Riwayat Pembaruan (Changelog)

Semua pembaruan dan perbaikan pada sistem **Toko Grafika PWA** didokumentasikan di sini.

---

## [2026-09-15] - Perbaikan Total Bottom Sheet & Modal Engine (Hardware-Accelerated Zero Flicker)
### Perbaikan & Peningkatan:
- **Penyelesaian Bug Layar Berkedip (*Anti-Flicker Architecture*):**
  - Mengeliminasi *race condition* `setTimeout(10ms)` yang sering memicu kedipan/stutter rendering saat modal dibuka di layar HP.
  - Menerapkan siklus sinkronisasi DOM layout (`void m.offsetHeight`) dan *rendering pipeline* via `requestAnimationFrame`, memastikan posisi awal *off-screen* terkomit sempurna di GPU buffer sebelum transisi luncur dimulai.
- **Isolasi Transisi CSS Murni (`.bottom-sheet-smooth` & `.modal-box-smooth`):**
  - Mengganti kelas `transition-all` menjadi transisi properti terisolasi (`transition: transform` dan `transition: opacity`), mencegah browser melakukan kalkulasi ulang dimensi tinggi dinamis di tengah animasi.
  - Menghilangkan kelas animasi internal `.fade-in` pada konten topik panduan yang sebelumnya memicu tabrakan gerakan Y-axis ganda.
  - Mematikan pemanggilan `scrollIntoView()` global saat bottom sheet masih dalam status transisi luncur agar jendela layar HP tidak meloncat (*jump-scrolling*).
- **Perbaikan Total Menyeluruh (*Storefront, CMS Admin, POS Kasir & Purchases*):**
  - **Storefront:** Panduan Belanja Pelanggan (`buyer-guide-modal`), Modal Detail Produk (`product-modal`), Modal Bagikan Produk (`share-product-modal`).
  - **CMS Admin:** Buku Panduan CMS & POS (`cms-guide-modal`), Form Edit Data (`admin-modal`), Detail Pesanan & Cetak (`admin-order-modal`), Edit Cepat Stok/Harga (`quick-edit-modal`), Stock Opname (`stock-opname-modal`), Pusat Cadangan & Cloud Sync (`backup-sync-modal`), Pratinjau Restore (`restore-preview-modal`).
  - **POS Kasir:** Antrian Transaksi Ditahan/Pending (`pos-pending-modal`), Floating Cart Drawer (`pos-cart-drawer-modal`), Pemilih Kategori (`pos-category-modal`), Pemilih Varian (`pos-variant-modal`), Input Desimal Qty (`pos-qty-modal`), Checkout Wizard (`pos-payment-modal`), Transaksi Berhasil (`pos-success-modal`), Paywall Langganan POS (`pos-subscription-modal`).
  - **Shared & Keuangan:** Pricetag Studio (`pricetag-modal`), Modal Pembelian Supplier (`purchase-modal`), Detail Faktur Pembelian (`purchase-detail-modal`), Pembayaran Hutang/Tempo (`purchase-payment-modal`), Katalog Produk Supplier (`supplier-products-modal`), Preview Struk Kasir (`receipt-preview-modal`), Dialog Konfirmasi (`custom-confirm-modal`), Riwayat Pembaruan (`changelog-modal`), Scanner Kamera (`scanner-modal`).
- **Akselerasi GPU Penuh:**
  - Menambahkan properti `-webkit-backface-visibility: hidden`, `backface-visibility: hidden`, `transform-style: preserve-3d`, dan `overscroll-behavior: contain` untuk *scrolling* super halus tanpa efek pantulan (*rubber-band*) di perangkat sentuh.

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
