# 📋 Catatan Rilis & Riwayat Pembaruan (Changelog)

Semua pembaruan dan perbaikan pada sistem **Toko Grafika PWA** didokumentasikan di sini.

## [2026-11-11] - Pembaruan Tanda Kenaikan & Penurunan Harga: Durasi Tampil Lebih Lama (30 Hari / Fleksibel CMS), Warna Hijau/Merah, Info Waktu & Reset Cepat
### 1. Warna Lencana Perubahan Harga yang Intuitif & Jelas:
- **Kenaikan Harga (`▲ Naik Rp...`):** Menggunakan warna hijau zamrud (*emerald*) lembut dengan aksen teks hijau (`text-emerald-600 dark:text-emerald-400`), border halus, dan ikon `fa-arrow-trend-up`.
- **Penurunan Harga (`▼ Turun Rp...`):** Menggunakan warna merah mawar (*rose*) elegan (`text-rose-600 dark:text-rose-400`), border halus, dan ikon `fa-arrow-trend-down`.
- Berlaku seragam di seluruh aplikasi: Kartu Katalog Produk, Modal Rincian Produk, Modal Pilihan Varian, Keranjang & Favorit Saya, Kasir POS (Grid & List View), serta Daftar Produk Admin CMS.

### 2. Perpanjangan Durasi Tampil Indikator (Default 30 Hari / 1 Bulan):
- Sebelumnya, lencana perubahan harga dibatasi otomatis hilang setelah 14 hari saja.
- Standar bawaan sistem kini diperpanjang menjadi **30 Hari (1 Bulan)** agar pelanggan (terutama pelanggan grosir dan warung) dapat memantau pergerakan tren harga dengan jelas dan tidak ketinggalan informasi.

### 3. Pengaturan Durasi Fleksibel di Admin CMS (Tab Toko):
- Pemilik toko kini dapat mengatur sendiri masa aktif lencana perubahan harga di **Admin Panel > Tab Pengaturan Toko**:
  - **14 Hari (2 Minggu):** Cocok untuk barang cepat perputaran (*fast moving*).
  - **30 Hari (1 Bulan - Standar Default):** Rekomendasi seimbang untuk toko retail & kelontong.
  - **60 Hari (2 Bulan):** Sangat ideal untuk toko grosir / distributor.
  - **90 Hari (3 Bulan):** Untuk pemantauan harga triwulan (*quarterly*).
  - **Selamanya (Tanpa Batas Waktu):** Lencana tetap muncul terus menerus hingga harga produk tersebut diubah kembali di kemudian hari.
- Pengaturan tersimpan secara aman ke Firestore CMS (`appData.store.priceChangeDurationDays`) dan otomatis berlaku ke seluruh perangkat pelanggan.

### 4. Info Waktu Pembaruan Harga Relatif (*Relative Time Ago*):
- Pada Modal Rincian Produk (`rProdMod`), di samping lencana kenaikan/penurunan harga kini ditampilkan keterangan waktu pembaruan yang ramah pelanggan, seperti:
  - `· diperbarui baru saja`
  - `· diperbarui 5 jam lalu`
  - `· diperbarui kemarin`
  - `· diperbarui 3 hari lalu`
  - `· diperbarui 2 minggu lalu`
  - `· diperbarui 1 bulan lalu`

### 5. Tombol "Reset Tanda" Manual di Modal Edit Cepat Admin (*Quick Edit*):
- Jika admin ingin menghapus atau menghilangkan tanda kenaikan/penurunan harga lama sebelum durasinya habis (misalnya jika kenaikan harga sudah dianggap harga normal), admin cukup membuka **Edit Cepat (Quick Edit)**:
  - Terdapat tombol **"Reset Tanda"** berwarna merah di samping info harga lama.
  - Untuk produk bervarian, terdapat tombol **"Reset Tanda Varian"** untuk mereset seluruh riwayat harga varian sekaligus.
  - Dilengkapi dialog konfirmasi aman dan otomatis menyinkronkan data ke Firestore serta memperbarui tampilan seketika.

### 6. Info Perubahan Harga Lengkap & Banner Ringkasan di Keranjang Belanja & Favorit Saya:
- **Detail Perubahan pada Setiap Kartu Item (`view-cart` & `view-wishlist`):**
  - Menampilkan harga lama yang dicoret (`<s>Rp 10.800</s>`).
  - Lencana warna hijau (`▲ Naik Rp 100 (+1%)`) atau merah (`▼ Turun Rp 500 (-5%)`) lengkap dengan persentase.
  - Keterangan waktu pembaruan relatif (`· diperbarui baru saja`, `· diperbarui 3 hari lalu`, dll.).
  - Mendukung produk satuan maupun produk bervarian (DUS, SAK, PACK, dll.), serta otomatis mencatat perubahan harga apabila barang sudah tersimpan di keranjang/favorit sebelum harga toko berubah.
- **Bar Ringkasan Perubahan Harga (*Price Change Summary Bar*):**
  - Di bagian atas daftar Keranjang Belanja dan Favorit Saya, otomatis muncul bar ringkasan `Info Perubahan Harga: [▲ X Naik] [▼ Y Turun]` apabila terdapat barang di dalam daftar tersebut yang mengalami perubahan harga.
- **Akses Cepat Detail Produk:**
  - Gambar dan judul barang di dalam Keranjang Belanja dan Favorit Saya kini dapat diketuk langsung untuk membuka Modal Detail Produk.

### 7. Sinkronisasi & Auto-Normalisasi Harga Varian (`normalizeProductVariantPricing` & `submitAdminForm`):
- **Perbaikan Pencocokan ID Produk saat Simpan Edit Admin (`submitAdminForm`):**
  - Memperbaiki pencocokan `String(x.id) === String(eId)` saat produk diedit melalui form penuh Admin sehingga perubahan harga produk maupun varian selalu tercatat riwayat `previousPrice`-nya secara akurat.
- **Auto-Normalisasi Harga Utama & Varian (`normalizeProductVariantPricing`):**
  - Apabila produk memiliki varian (seperti `PCS` & `SLOP` pada *GAJAH BARU F16*) di mana harga varian utama telah diperbarui (misal `Rp 22.900`) sedangkan harga induk masih menyimpan harga lama (`Rp 22.500`), sistem otomatis menyelaraskan harga tampilan di Kartu Katalog (`Rp 22.900`) dan menampilkan lencana `<s>Rp 22.500</s> [▲ PCS Naik Rp 400]` di Katalog, Modal Detail Produk, Keranjang Belanja, dan Favorit Saya.
  - Memastikan varian dengan satuan berjenjang (seperti *Bawang Putih*: 1 KG, 1/2 KG, 1/2 ONS) tidak mengalami salah tafsir penurunan harga ekstrem (-93%).

### 8. Dukungan Input Harga Lama Varian di Admin & Pembaruan Tampilan Modal Storefront:
- **Input Harga Lama Varian di Form Penuh Admin (`rVarsB` & `uVar`):**
  - Setiap baris varian kini memiliki input khusus **"HARGA LAMA (Rp - Opsional)"** dengan preview langsung lencana kenaikan/penurunan harga.
- **Input Harga Lama Varian di Modal Edit Cepat (`openQuickEditProduct` & `saveQuickEditProduct`):**
  - Tabel varian di Edit Cepat kini menyediakan kolom input **"Harga Lama (Rp)"** (`id="qe-var-prev-${idx}"`) sehingga admin dapat mengatur atau mengoreksi harga lama varian secara instan tanpa perlu membuka form penuh.
- **Tampilan Lencana Varian Lengkap di Katalog & Modal Detail Produk:**
  - Kartu katalog Grid & List View kini menampilkan harga yang dicoret berserta nama varian yang mengalami perubahan harga (contoh: `<s>Rp 22.500</s> [▲ PCS Naik Rp 400]`).
  - Modal Detail Produk menampilkan coretan harga, badge kenaikan/penurunan, persentase, dan keterangan waktu update untuk varian yang dipilih, serta lencana varian pada tombol pilihan varian (`[PCS] [+Rp 400]`).
- **Cache-Buster & Pembaruan Service Worker PWA:**
  - Bumping versi `APP_DATA_VERSION = '2026-11-11-v6'` di `firebase.js` untuk membersihkan cache produk lawas di browser pelanggan secara otomatis saat toko dibuka.
  - Bumping cache Service Worker ke `CACHE_NAME = 'freshmart-pwa-v17'` di `sw.js` agar seluruh aset JavaScript dan HTML teranyar langsung aktif di semua perangkat.

### 9. Isolasi Total Data Varian: Harga Jual, Modal (HPP), dan Riwayat Harga Sepenuhnya Mandiri:
- **Penetapan Harga Modal (HPP) per Varian:**
  - Setiap varian memiliki harga modal/HPP (`v.costPrice`) yang berdiri sendiri dan tidak pernah mengambil atau terpengaruh oleh harga modal produk utama (`p.costPrice`).
  - Laporan laba/rugi, penjualan POS kasir, dan ringkasan transaksi kini secara mutlak menghitung keuntungan berdasarkan HPP varian yang terjual (`v.costPrice`).
- **Pemberantasan Acuan Silang Produk Induk (`normalizeProductVariantPricing`):**
  - Menghapus seluruh asumsi penyalinan harga lama antara produk induk dan varian. Setiap varian melacak riwayat perubahannya sendiri.
- **Tampilan Daftar Produk Admin yang Akurat:**
  - Pada daftar produk Admin, produk bervarian kini menampilkan rentang harga jual (`Rp Min - Rp Max`) dan rentang HPP (`HPP: Rp Min - Rp Max`), bukan lagi satu harga tunggal produk induk.




## [2026-11-11] - Fitur Drag & Drop Reordering, Step Buttons & Quick Sort di Keranjang Belanja & Favorit Saya
### 1. Drag & Drop Reordering (Touchscreen & Mouse Unified Engine):
- **Ikon Pegangan Khusus (*Grip Handle `⠿`*):**
  - Setiap kartu item di **Favorit Saya** (`view-wishlist`) dan **Keranjang Belanja** (`view-cart`) kini dilengkapi ikon pegangan sentuh bertekstur titik (`⠿` *Grip Handle*).
  - Menggunakan CSS standar `touch-action: none` pada pegangan handle dan Pointer Events API dengan `setPointerCapture` sehingga menggeser urutan barang di smartphone tidak pernah bentrok dengan scroll vertikal halaman.
  - Seluruh area kartu di luar handle tetap berfungsi normal untuk scrolling layar ke atas/bawah.
- **Efek Visual & Animasi:**
  - Kartu yang ditarik secara visual terangkat halus dengan GPU hardware acceleration (`translate3d`), bayangan mendalam (*elevation shadow-2xl*), dan ring emerald berkilau.
  - Kotak slot indikator putus-putus (*dashed placeholder*) muncul secara dinamis di posisi tujuan kartu.
  - Dilengkapi fitur *auto-scroll* otomatis saat kartu ditarik mendekati tepi atas atau tepi bawah layar.
- **Umpan Balik Haptik (*Haptic Feedback*):**
  - Ponsel bergetar mikro halus saat kartu mulai diangkat (`vibrate(25ms)`) dan saat kartu ditaruh di slot baru (`vibrate(30ms)`).
- **Penyimpanan Permanen Otomatis (*Auto-save Persistence*):**
  - Setiap perpindahan urutan langsung tersimpan ke `localStorage` (`freshmart_wishlist` & `freshmart_cart`) sehingga urutan belanja pelanggan tidak pernah hilang meskipun browser ditutup atau di-refresh.

### 2. Tombol Pengatur Cepat (*Step Order Buttons ▲ / ▼*):
- Menyediakan tombol panah naik (`▲`) dan turun (`▼`) di sisi ikon pegangan untuk memindahkan urutan barang 1 posisi dengan satu ketukan instan tanpa perlu menyeret layar.

### 3. Toolbar Urut Cerdas (*Quick Sort Toolbar*):
- Menambahkan toolbar pengurutan di bagian atas daftar Keranjang Belanja dan Favorit:
  - **Termurah:** Mengurutkan seluruh item dari harga paling terjangkau.
  - **Termahal:** Mengurutkan seluruh item dari harga tertinggi.
  - **A - Z:** Mengurutkan nama produk berdasarkan abjad.

## [2026-11-11] - Redesain Modal Detail Pesanan & Custom Glassmorphic WhatsApp Receipt Modal (Menghilangkan Pop-up Browser Klasik)
### 1. Modern Custom WhatsApp Receipt Modal (`#receipt-wa-modal`):
- **100% Menghapus Pop-up Dialog Bawaan Browser (`window.prompt`):**
  - Menggantikan dialog abu-abu bawaan browser yang tampak klasik/kuno dengan modal kustom elegan bertema glassmorphic modern.
  - Memiliki kartu ringkasan pesanan (No. Pesanan, Nama Pemesan, Total Tagihan, Metode Pembayaran).
  - Dilengkapi input nomor WhatsApp tujuan berformat telco Indonesia (`08xx` / `628xx`) dengan normalisasi otomatis saat dikirim.
  - Jika pesanan memiliki metode pembayaran **Transfer**, sistem menampilkan kartu notifikasi hijau bahwa rekening bank toko otomatis disertakan di dalam teks struk.
- **Aksi Cepat Berbagi Serbaguna:**
  - **Kirim ke WhatsApp:** Membuka chat langsung ke nomor yang dituju (atau buka contact picker jika dikosongkan).
  - **Pilih Kontak:** Membuka WhatsApp secara instan untuk memilih kontak pelanggan bebas di daftar obrolan WhatsApp.
  - **Salin Teks Struk:** Menyalin seluruh teks struk yang rapi ke clipboard untuk dikirimkan melalui SMS, Telegram, atau media lain.
  - **Preview Teks Struk (Collapsible):** Dapat melihat dan mengecek rincian teks pesan struk sebelum dikirimkan.
- **Terintegrasi Universal:**
  - Terhubung mulus dari tombol **Kirim WA** pada Modal Detail Pesanan Admin, Modal Cetak Struk Kasir (*Receipt Preview*), dan Layar Transaksi Berhasil POS Kasir.
  - Terdaftar pada `bootstrap.js` sehingga tombol back HP otomatis menutup modal secara alami.

### 2. Desain Ulang Tata Letak Modal Detail Pesanan Admin (`admin-order-modal`):
- **Pelebaran Dimensi Dialog yang Lega (*Spacious Layout*):**
  - Meningkatkan lebar maksimum modal dari sebelumnya yang sempit menjadi `sm:max-w-2xl md:max-w-3xl lg:max-w-4xl` sehingga data pesanan, pemesan, alamat, dan rincian belanja tampil lapang, profesional, dan nyaman dibaca di tablet maupun desktop.
- **Redesain Bilah Aksi Bawah (*Bottom Action Bar*):**
  - Menghilangkan tampilan 5 tombol yang berdesakan dalam 1 baris sempit.
  - Mengatur hierarki tombol secara rapi dan ergonomis:
    - **Aksi Utama (Kanan / Atas di Mobile):** Tombol hijau solid **Struk Kasir** dan tombol **Kirim WA** dengan ukuran lega dan proporsional.
    - **Aksi Sekunder (Kiri / Bawah di Mobile):** Tombol **Hapus**, **Invoice (A4)**, dan **Surat Jalan (A4)** dengan styling bersih dan elegan.
- **Pembaruan Hub Dokumen Pesanan (In-Modal Document Hub):**
  - Memperbarui grid dokumen menjadi 4 kartu responsif (`grid-cols-2 sm:grid-cols-4`):
    1. **Struk Kasir** (Thermal POS 58/80mm)
    2. **Kirim WA** (Struk & Rekening WhatsApp)
    3. **Faktur / Invoice** (PDF Resmi Bisnis A4)
    4. **Surat Jalan** (Ekspedisi & Logistik A4)

## [2026-11-10] - Harmonisasi Warna Indikator Perubahan Harga: Hijau untuk Naik & Merah untuk Turun
### 1. Warna Standar Finansial & Retail:
- **Harga Naik (`isUp: true`) → HIJAU (*Emerald*):**
  - Mengubah badge **▲ Naik Rp...** dari sebelumnya warna mawar/merah muda menjadi **Hijau Emerald** (`bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60`).
  - Diterapkan secara seragam di:
    - Kartu produk katalog etalase (Grid View & List View)
    - Modal rincian produk (harga utama & lencana header)
    - Pilihan varian produk (*variant selector pills*)
    - Halaman Wishlist / Favorit
    - Katalog kasir POS (*POS product cards*)
    - Daftar produk Admin CMS & Modal Edit Cepat (*Quick Edit*)
- **Harga Turun (`isUp: false`) → MERAH (*Rose/Red*):**
  - Ketika harga produk atau varian diturunkan dari harga sebelumnya, sistem menampilkan badge **▼ Turun Rp...** berwarna **Merah Rose** yang kontras (`bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60`).



## [2026-11-10] - Fitur Native Pull-to-Refresh Gesture (Tarik Layar ke Bawah untuk Muat Ulang)
### 1. Pengalaman Asli Aplikasi Mobile (*Native-like App Experience*):
- **Gesture Tarik ke Bawah (Pull-to-Refresh):**
  - Mengimplementasikan deteksi gesture sentuh (*touch gesture engine*) alami pada layar perangkat mobile, tablet, maupun standalone PWA.
  - Ketika pengguna berada di bagian paling atas halaman (`scrollTop <= 2px`) dan menarik layar ke bawah, indikator dinamis berbentuk kapsul mengambang (*floating pill with backdrop blur*) muncul secara mulus dari atas layar.
  - Memiliki kurva redaman elastis (*rubber-band damping curve*) dengan rotasi panah proporsional yang berputar hingga 180° dan berubah warna saat melewati ambang batas 65px.
  - **Umpan Balik Haptik (*Haptic Vibration*):** Menghasilkan getaran haptik mikro halus pada perangkat seluler saat ambang batas tarikan tercapai dan saat pembaruan berhasil.

### 2. Sinkronisasi Data Cerdas (*Smart Background Cloud Refresh*):
- **Pembaruan Tanpa Kedip Putih (*Flicker-Free In-Place Update*):**
  - Memanggil `refreshFromCloud()` untuk menyinkronkan data toko, katalog produk, kategori, banner, keranjang, dan harga langsung secara instan tanpa membuat layar ponsel berkedip putih seperti reload browser biasa.
  - Memeriksa pembaruan Service Worker PWA di latar belakang secara otomatis.
  - Dilengkapi pengaman konflik geser horizontal (misal geser tab atau slider) serta proteksi saat modal pop-up sedang terbuka.
  - Menyediakan fallback aman ke `location.reload()` jika terjadi anomali koneksi jaringan.



## [2026-11-10] - Fitur Kirim Struk WhatsApp & Integrasi Rekening Bank Toko Khusus Metode Transfer
### 1. Fitur Bagikan Struk ke WhatsApp (POS, Admin, & Preview Struk):
- **Tombol Kirim Struk WhatsApp (`shareReceiptWhatsApp`):**
  - Menambahkan tombol aksi hijau WhatsApp di modal **Preview Struk Kasir** (`receipt-modal.html`), modal **Sukses Transaksi POS** (`pos-success-modal`), dan **Detail Pesanan Admin** (`admin-order-modal.html`).
  - Mengirimkan rincian struk belanja digital yang rapi, mencakup kop nama toko, nomor struk, waktu transaksi, kasir, daftar belanjaan (qty × harga), subtotal, diskon, dan total akhir langsung ke WhatsApp pembeli (atau membuka pemilih kontak WhatsApp jika nomor pelanggan belum tercatat).

### 2. Integrasi Rekening Bank Khusus Metode Transfer (*Conditional Bank Details*):
- **Otomatis & Bersih Hanya Saat Metode Transfer Dipilih:**
  - **Pada Pesan WhatsApp:** Menampilkan daftar rekening bank toko (`appData.banks`: Nama Bank, No. Rekening, dan Atas Nama) secara otomatis saat metode pembayaran adalah **Transfer**. Jika metode yang dipilih adalah Tunai (Cash), COD, EDC, atau QRIS, daftar rekening bank **tidak** akan ditampilkan sehingga struk tetap ringkas dan tidak membingungkan.
  - **Pada Struk Kasir Thermal (Fisik 58mm/80mm & Digital Preview):** Menambahkan blok *"REKENING TRANSFER TOKO"* di bawah baris metode pembayaran khusus transaksi transfer. Tercetak jelas pada mode printer thermal Bluetooth/raw text (`executePrintReceipt`) maupun tampilan struk visual/gambar/PDF.
  - **Pada Checkout Web (`checkout.js`):** Saat pembeli melakukan pemesanan via katalog toko dan memilih metode bayar Transfer, rincian rekening toko otomatis disematkan pada pesan WhatsApp pemesanan beserta instruksi kirim bukti transfer.

### 3. Pengaturan Admin Fleksibel di Pengaturan Toko:
- **Toggle Konfigurasi Struk Kasir:**
  - Menambahkan sakelar `"Tampilkan Info Rekening Bank Toko (Khusus Pembayaran Transfer)"` (`set-receipt-show-bank`) di menu **Admin Toko → Format Struk Kasir**, sehingga pemilik toko dapat dengan mudah mengaktifkan atau menonaktifkan fitur ini sesuai preferensi.



## [2026-11-10] - Audit Menyeluruh Keamanan & Performa, Hardening Tipe ID Produk, serta Sinkronisasi POS Instan
### 1. Hardening & Pencegahan Bug Tipe ID Produk Admin:
- **Sanitasi Parameter ID Produk (`String` vs `Number`):**
  - Seluruh tombol aksi produk pada Admin CMS (Cetak Price Tag, Edit Cepat, Stok Opname, Toggle Visibilitas, Duplikat, Edit Lengkap, dan Hapus) kini dibungkus dengan tanda kutip aman `'${x.id}'`. Hal ini mencegah *Uncaught ReferenceError* ketika produk memiliki ID alfanumerik.
  - Memperbarui fungsi lookup produk (`oAEd`, `oADel`, `duplicateProduct`, `toggleProductStatus`) menggunakan pencarian tangguh `(x.id === id || String(x.id) === String(id))` dan fallback array aman.

### 2. Sinkronisasi Instan POS pada Penyimpanan Aplikasi (`saveApp`):
- **Real-Time POS In-Place Update:**
  - Memanggil `syncPosCartPrices()` dan `renderPosCart()` langsung di dalam siklus `saveApp()` lokal. Ketika admin atau kasir mengubah harga/stok pada tab atau perangkat lokal, keranjang kasir POS langsung terbarui seketika (0ms).

### 3. Audit Keamanan Database & Arsitektur Performa:
- **Audit Keamanan Database:**
  - Verifikasi sanitasi output HTML dinamis (`esc()`) terhadap potensi serangan XSS.
  - Verifikasi proteksi brute-force login admin & kasir (lockout 30 detik setelah 5x gagal).
  - Rekomendasi aturan keamanan Firestore Security Rules untuk membatasi hak akses tulis (*write*).
- **Audit Performa Website & PWA:**
  - Arsitektur Cache-First (First render ~0ms dari `localStorage`).
  - Efisiensi kuota Firestore: `startPriceWatcher` hanya memantau 1 dokumen metadata (`cms_data`).
  - Rendering bertahap (`adminProductRenderLimit = 30`) menjaga kelancaran 60 FPS pada mobile.
  - Image Lazy Loading dengan `IntersectionObserver` dan placeholder SVG ringan.

### 4. Redesain & Harmonisasi Badge Keranjang Produk Etalase:
- **Kapsul Proporsional & Selaras Tema Toko (`var(--clr-p)`):**
  - Mengubah bentuk badge `[x di Keranjang]` dari sebelumnya persegi panjang pipih (*gepeng & sempit*) menjadi bentuk kapsul elegan (*rounded-full pill*) dengan padding vertikal dan horizontal yang proporsional (`px-2.5 sm:px-3 py-1`).
  - Mengaitkan warna latar belakang badge langsung ke variabel tema toko (`var(--clr-p, #00897b)`), sehingga warnanya selalu selaras dengan palet header, tombol aksi, dan identitas toko.
  - Menambahkan cincin pemisah anti-bleed putih (`ring-2 ring-white/95 dark:ring-slate-900/95`) dan bayangan elevasi (*elevation shadow*) agar lencana terlihat kontras, mewah, dan jelas di atas berbagai warna foto produk.
  - Menyesuaikan ukuran tipografi dan ikon troli menjadi lebih tegas dan mudah dibaca (`text-[10px] sm:text-[11px]` dengan angka kuantitas tebal).
- **Adaptasi Khusus Mode Tampilan Daftar / List View (`cView === 'list'`):**
  - Pada thumbnail kecil mode list (80px), lencana disesuaikan menjadi mini-pill non-wrapping `[🛒 x]` (`whitespace-nowrap`) sehingga foto produk tidak tertutup oleh teks panjang yang terlipat 2 baris.
  - Keterangan lengkap `[🛒 x di Keranjang]` dipindahkan ke baris badge informasi produk di samping nama dan tag kategori, memanfaatkan ruang horizontal yang luas secara rapi dan estetis.

### 5. Redesain Menu Utama Admin CMS Menjadi List View Elegan:
- **Tampilan List View Modern & Informatif:**
  - Mengubah tampilan Menu Utama Admin CMS dari kotak-kotak grid masif (*chunky grid*) menjadi deretan kartu baris (*List View*) yang jauh lebih cantik, proporsional, dan nyaman di ponsel maupun desktop.
  - Setiap menu kini dilengkapi dengan:
    - Ikon berwarna tematik (*soft pastel & theme color squircle*).
    - Judul menu yang tegas dan jelas.
    - Subtitle deskripsi fungsi fitur yang informatif (misal: "Edit cepat, harga jual, modal HPP, varian, grosir & supplier").
    - Indikator panah navigasi (*chevron-right*) beranimasi halus saat disentuh/hover.
- **Dukungan Switcher Mode Tampilan (List ☰ / Grid ⊞):**
  - Menyediakan tombol pemilih mode tampilan di samping tombol Panduan CMS, memungkinkan pengguna beralih antara List View dan Grid View dengan preferensi tersimpan otomatis di penyimpanan lokal (`freshmart_admin_menu_view`), dengan default List View.

### 6. Maintenance & Perawatan Sistem (Service Worker v15 & Audit Bersih):
- **Peningkatan Service Worker PWA (`freshmart-pwa-v15`):**
  - Meningkatkan versi cache service worker ke `v15` (`public/sw.js` & `dist/sw.js`) untuk memastikan seluruh perangkat klien (Android PWA, iOS Safari, desktop) otomatis menghapus cache usang dan memuat versi terbaru tanpa jeda cache lama.
- **Audit Diagnostik End-to-End Komprehensif:**
  - 100% lulus seluruh rangkaian pengujian diagnostik otomatis: `audit-bugs.js`, `test-syntax.js`, `deep-audit.js`, `verify_all_references.js` (235/235 handler terverifikasi, 624 DOM ID cocok, 0 Broken Handlers, 0 Undefined References, 0 Syntax Errors).
  - Isolasi engine cetak struk Thermal POS & Price Tag SVG terverifikasi stabil.

---

## [2026-09-15] - Integrasi & Sinkronisasi Total POS Kasir Toko dengan Pembaruan Real-Time
### Integrasi POS Kasir & Transaksi Toko Fisik:
- **Sinkronisasi Otomatis POS Kasir Real-Time (`syncPosCartPrices`):**
  - Keranjang belanja kasir POS kini memiliki pemantau sinkronisasi otomatis (`syncPosCartPrices`). Saat admin memperbarui harga di CMS atau dari perangkat lain, harga barang di keranjang kasir otomatis menyesuaikan harga terbaru.
  - Listener Cloud Firestore (`startPriceWatcher`) dan tombol pembaruan instan (`refreshFromCloud`) otomatis memicu render ulang produk kasir (`renderPosProducts`) dan keranjang kasir (`renderPosCart`) secara seketika (*live in-place*).
- **Indikator Kenaikan Harga di Layar Kasir:**
  - Kartu produk POS kini menampilkan badge kenaikan harga `▲ Naik Rp...` sehingga kasir dapat memberikan informasi yang akurat dan transparan saat pelanggan menanyakan perubahan harga barang di toko fisik.
- **Pembedaan Status Nonaktif vs Stok Habis di POS:**
  - Kartu produk yang dinonaktifkan oleh admin menampilkan label tegas **"Nonaktif"** (bukan sekadar "Habis") dan pembelian dikunci otomatis, membedakannya secara jelas dengan produk yang hanya kehabisan stok fisik.

---

## [2026-09-15] - Pembaruan Menyeluruh Panduan Interaktif Toko (Buku Panduan CMS & Panduan Pembeli)
### Dokumentasi & Panduan Interaktif Sistem:
- **Pembaruan Buku Panduan CMS Admin (`cms-guide-modal`):**
  - **Edit Cepat Instan:** Panduan langkah demi langkah mengubah stok, HPP modal, harga jual, dan supplier tanpa form panjang.
  - **Pelacak Kenaikan Harga Otomatis:** Dokumentasi sistem deteksi kenaikan harga, pencatatan otomatis `previousPrice`, dan tampilan badge `▲ Naik Rp...` selama 14 hari.
  - **Sinkronisasi Cloud Real-Time:** Penjelasan sinkronisasi instan Firestore antar perangkat tanpa stale cache di iPhone/Safari.
  - **3 Status Produk:** Penjelasan detail status Aktif, Stok Habis (tetap tampil), dan Nonaktif (tampil abu-abu + checkout dikunci).
- **Pembaruan Panduan Pembeli Toko Online (`buyer-guide-modal`):**
  - **Panduan Stok & Ketersediaan:** Menjelaskan arti status *Ready Stock*, *Stok Habis*, dan *Tidak Tersedia*.
  - **Panduan Penanda Status Keranjang & Favorit:** Edukasi penggunaan lencana hijau `[x di Keranjang]` dan ikon hati `[❤️]` di katalog depan.
  - **Panduan Pencarian Cepat di Keranjang & Favorit:** Petunjuk mencari belanjaan di keranjang/wishlist serta shortcut "Cari di Katalog".
  - **Panduan Transparansi Kenaikan Harga:** Edukasi harga lama dicoret dan info penyesuaian nominal harga.

---

## [2026-09-15] - Harmonisasi UI/UX Mobile: Tampilan Etalase Seragam Bebas Jomplang & Toolbar Admin Responsif
### Optimalisasi Tampilan Antarmuka & Pengalaman Pengguna (UI/UX):
- **Kartu Produk Etalase Seragam & Sejajar (Bebas Jomplang):**
  - **Ketinggian Baris Badge Terstandarisasi (`h-5`):** Menstandarisasi baris badge status toko di bawah foto menjadi 1 baris konsisten (20px) sehingga tidak ada kartu yang melorot/jomplang akibat jumlah badge yang berbeda.
  - **Floating Status Badge pada Foto:** Menempatkan penanda kuantitas keranjang (`[🛒 x di Keranjang]`) dan penanda favorit (`[❤️]`) sebagai *floating overlay* elegan di sudut foto produk, mencegah penumpukan teks berdesakan di kartu mobile (*bebas sempit*).
  - **Baseline Judul Produk Seragam (`min-h-[2.35rem]`):** Mengunci ketinggian kotak nama produk dengan batasan 2 baris (`line-clamp-2`), memastikan posisi nominal harga selalu sejajar secara horizontal di seluruh kisi katalog 2 kolom mobile.
- **Bilah Aksi Admin CMS Responsif Layar Kecil:**
  - Mengonfigurasi bilah tombol aksi produk admin (`action toolbar`) dengan `justify-between w-full` pada layar ponsel sehingga ke-7 tombol terdistribusi proporsional seperti bilah navigasi aplikasi asli tanpa terdesak atau berhimpitan.
- **Pill Filter & Statistik Simetris:** Memastikan grid indikator status di admin tetap proporsional 2 kolom di mobile dan 4 kolom di desktop.

---

## [2026-09-15] - Perbaikan Bug Event Bubbling Modal Edit Cepat & Penyimpanan Produk Admin
### Perbaikan & Optimalisasi Sistem:
- **Penyelesaian Masalah Modal Edit Cepat Merembet ke Edit Data Produk:**
  - **Identifikasi Masalah:** Tombol petir (Edit Cepat) dan tombol Stok Opname pada daftar produk CMS Admin sebelumnya belum dilengkapi `event.stopPropagation()`. Ketika tombol Edit Cepat ditekan, event klik merembet (*bubble up*) ke baris kartu produk yang memiliki pemicu `onclick="oAEd('products', id)"`. Hal ini menyebabkan modal Edit Data Lengkap terbuka di belakang modal Edit Cepat secara bersamaan. Saat pengguna menekan "Simpan Perubahan", modal Edit Cepat tertutup namun pengguna mendapati dirinya berada di modal Edit Produk Lengkap.
  - **Isolasi Klik Bilah Aksi (`event.stopPropagation`):** Menambahkan `event.stopPropagation()` pada tombol Edit Cepat (`openQuickEditProduct`) dan Stok Opname (`openStockOpnameModal`), serta pada kontainer *action toolbar* sebagai proteksi lapis ganda.
  - **Auto-Dismiss Modal Lapis Belakang (`closeAdminModal`):** Saat modal Edit Cepat atau Stok Opname dibuka, dibatalkan, atau disimpan, sistem secara otomatis memastikan modal Edit Produk Lengkap ditutup bersih.
  - **Optimasi `saveQuickEditProduct`:** Menambahkan proteksi anti dobel klik (`isSaving`), sinkronisasi kalkulasi total stok produk dari akumulasi varian, serta toleransi pencarian ID produk berbasis numerik/string.

---

## [2026-09-15] - Perbaikan Bug Sinkronisasi Cache Data pada iPhone / Safari & Real-time Cloud Sync
### Perbaikan & Optimalisasi Sistem:
- **Penyelesaian Masalah Data Tidak Berubah di iPhone / Safari (`tokogrosir.id`):**
  - **Identifikasi Masalah:** Ditemukan bug pada listener sinkronisasi (`startPriceWatcher` di `sync.js`) di mana pembaruan produk dari subkoleksi Firestore tidak terpanggil saat metadata berubah, namun stempel waktu `freshmart_last_update` terlanjur diperbarui di `localStorage` iPhone. Akibatnya, saat pembeli me-refresh halaman di Safari, sistem menganggap data lokal sudah setara dengan server (`localUpdate >= serverUpdate`), sehingga produk lama dari cache lokal terus ditampilkan dan perubahan status/harga tidak terlihat.
  - **Mekanisme Cache-Buster Otomatis (`APP_DATA_VERSION = 2026-09-15-v4`):** Menambahkan sistem invalidasi versi cache otomatis pada `loadAppData`. Saat pembeli membuka toko di iPhone/Safari, sisa cache lokal lawas yang tersangkut otomatis dibersihkan dan dipaksa mengunduh data produk terbaru dari Firestore.
  - **Perbaikan Real-time Listener (`sync.js`):** `onSnapshot` kini secara aktif mengambil dokumen produk terbaru dari subkoleksi `products`, memperbarui `appData.products`, menyimpan cache baru ke `localStorage`, dan merender ulang katalog secara *live* tanpa perlu me-reload halaman.
  - **Penyimpanan Instan Tanpa Debounce Delay (`saveApp(true)`):** Semua tindakan perubahan admin (edit produk, quick edit, dan toggle status nonaktif) kini mengeksekusi sinkronisasi Firestore secara langsung (*force immediate*), memastikan data di cloud selalu terbarui seketika.
  - **Akses Pintasan Sinkronisasi:** Mengetuk nama atau logo toko di header beranda kini memicu sinkronisasi ulang data dari cloud secara instan (`refreshFromCloud`).
- **PWA Cache Update:** Versi Service Worker dinaikkan ke `freshmart-pwa-v14`.

---

## [2026-09-15] - Fitur Pencarian Cepat di Keranjang Belanja & Favorit serta Indikator Status Keranjang di Beranda
### Fitur & Peningkatan Sesuai Permintaan Pelanggan:
- **Pencarian Instan di Dalam Keranjang Belanja (`handleCartSearch`):**
  - Menyematkan bilah pencarian modern di bagian atas daftar keranjang belanja (`view-cart`) untuk mempermudah pembeli (khususnya grosir/ritel dengan banyak belanjaan) mengecek apakah suatu item sudah dimasukkan atau belum.
  - Memfilter daftar keranjang secara *real-time* saat pembeli mengetik nama produk atau nama varian.
  - Menampilkan ringkasan status pencarian (contoh: *“Menampilkan 1 dari 15 barang di keranjang”*) serta tombol reset (*“Lihat Semua”*).
  - Jika item belum ada di keranjang, sistem menyajikan pemberitahuan informatif *"Item Belum Ada di Keranjang"* dilengkapi tombol shortcut **[Cari di Katalog Toko]** yang langsung membuka katalog dan mencari kata kunci tersebut.
  - Subtotal keranjang dan alur checkout tetap aman terhitung dari seluruh isi keranjang.
- **Pencarian Instan di Dalam Favorit Saya (`handleWishlistSearch`):**
  - Menyematkan bilah pencarian responsif pada menu favorit (`view-wishlist`) dengan fungsi penyaringan langsung dan pesan informatif bila barang belum tersimpan di favorit.
- **Indikator Cerdas Status Keranjang & Favorit pada Kartu Produk di Beranda / Pencarian Global:**
  - Saat pembeli mencari atau menjelajahi produk di beranda, setiap kartu produk (Grid & List View) kini langsung menyajikan lencana status:
    - 🛒 **Di Keranjang (x3)**: Lencana hijau kontras di baris tag dan sudut foto produk yang menampilkan jumlah kuantitas barang yang telah masuk keranjang.
    - ❤️ **Favorit**: Lencana penanda merah muda dan ikon hati saat produk tersimpan di wishlist.
  - Pada modal detail produk (`product-modal`) dan tombol varian produk (`PILIH VARIAN`), kuantitas item yang telah berada di keranjang langsung terlihat jelas.
- **PWA Cache Update:** Versi Service Worker dinaikkan ke `freshmart-pwa-v13`.

---

## [2026-09-15] - Fitur Pelacak & Tampilan Nominal Kenaikan Harga Produk di Beranda & Modal
### Fitur & Peningkatan Sesuai Permintaan Pelanggan:
- **Tampilan Kenaikan Harga di Beranda (Grid & List View):**
  - Menampilkan informasi transparan ketika suatu produk mengalami kenaikan harga pada katalog etalase toko.
  - Kartu produk di beranda menampilkan harga lama yang dicoret serta badge naik yang elegan: e.g. `Rp 10.000` (coret) `▲ Naik Rp 800`.
  - Jika produk memiliki multi-varian dan ada varian yang naik harganya, kartu etalase otomatis menampilkan badge kenaikan harga varian (`▲ Naik Rp...`).
- **Detail Kenaikan Harga di Modal Produk (Detail Produk):**
  - Pada modal detail produk (`rProdMod`), saat varian atau produk dibuka, sistem menyajikan harga lama tercoret, nominal kenaikan harga, serta persentase penyesuaian harga (e.g. `▲ Naik Rp 800 (+8%)`).
  - Badge `Naik Rp...` disematkan di deretan badge produk.
  - Pilihan tombol varian (`PILIH VARIAN`) menampilkan badge `+Rp...` untuk varian yang harganya telah disesuaikan.
- **Penyelarasan Tampilan pada Menu Favorit Saya (Wishlist):**
  - Item di daftar favorit yang mengalami kenaikan harga juga menyajikan harga lama tercoret dan badge `▲ Naik Rp...` mendampingi nominal harga live terbaru.
- **Auto-Detection Cerdas di CMS Admin & Quick Edit:**
  - **Auto-Detection:** Saat pengelola toko mengedit produk lewat modal form standar (`submitAdminForm`) maupun modal *Quick Edit* (`saveQuickEditProduct`), jika harga baru lebih tinggi dari harga sebelumnya, sistem secara otomatis merekam `previousPrice = oldPrice` dan `priceIncreasedAt = Date.now()`.
  - **Reset Otomatis:** Jika di kemudian hari harga diturunkan kembali, indikator kenaikan harga otomatis di-reset (`previousPrice = 0`).
  - **Masa Kedaluwarsa:** Indikator kenaikan harga aktif selama 14 hari sejak penyesuaian (`isPriceIncreaseActive`), sehingga setelah 14 hari kartu etalase otomatis kembali normal tanpa badge kenaikan.
  - **Form Input Opsional:** Admin juga dapat mengisi atau mengosongkan manual kolom `Harga Sebelum Kenaikan (Rp - Opsional)` di CMS Admin.
  - **Indikator List Admin:** Di daftar produk admin (`rAdmItms`), produk yang mengalami kenaikan harga ditandai dengan badge merah muda `▲ Naik Rp...`.
- **PWA Cache Update:** Versi Service Worker dinaikkan ke `freshmart-pwa-v12`.

---

## [2026-09-15] - Sinkronisasi Realtime Harga Produk pada Daftar Favorit (Wishlist) & Keranjang
### Peningkatan & Perbaikan Sistem:
- **Sinkronisasi Otomatis Harga Favorit (`syncWishlistPrices`):**
  - Mengatasi masalah harga barang di menu "Favorit Saya" (Wishlist) yang sebelumnya tetap tertahan pada harga lama saat pertama kali disimpan ke bookmark lokal (misal: Mentega Amanda 250gr Dus tertahan di Rp 305.000 meskipun harga master telah naik ke Rp 306.000).
  - Setiap kali pelanggan membuka halaman Favorit (`renderWish`), sistem kini secara otomatis merekonsiliasi seluruh item favorit dengan data master produk terkini di `appData.products`, memperbarui harga dasar maupun harga multi-varian secara instan dan otomatis menyimpannya ke `localStorage`.
- **Sinkronisasi Otomatis Keranjang & Kalkulasi Harga Efektif (`syncCartPrices` & `getEffP`):**
  - Menghubungkan kalkulasi `getEffP` langsung ke harga live master produk di `appData.products` sehingga pesanan di keranjang, rincian subtotal, dan pesan WhatsApp checkout selalu menggunakan nominal harga terbaru yang valid.
  - Saat pelanggan memindahkan barang dari Favorit ke Keranjang (`moveWish`), nominal harga yang disalin dipastikan 100% menggunakan harga master live terbaru.
- **Pendeteksian Status Ketersediaan di Favorit:**
  - Item favorit yang produknya telah dinonaktifkan atau kehabisan stok otomatis menampilkan badge status `Tidak Tersedia` / `Stok Habis` dan tombol "Ke Keranjang" dikunci agar tidak dapat dipesan.
- **PWA Cache Update:** Versi Service Worker dinaikkan ke `freshmart-pwa-v11`.

---

## [2026-09-15] - Produk Nonaktif Tetap Tampil di Katalog (Grayscale Abu-Abu) & Proteksi Order
### Fitur & Peningkatan Sesuai Revisi:
- **Katalog Etalase Online (Storefront & Beranda):**
  - Produk berstatus **Nonaktif** kini tetap tampil di beranda dan hasil pencarian/kategori toko, menjaga katalog tetap terlihat kaya dan lengkap.
  - Kartu produk nonaktif otomatis diberi styling visual abu-abu (*grayscale opacity-60*), mematikan efek hover aktif, dan menampilkan badge **`TIDAK TERSEDIA`** di pojok foto produk.
- **Proteksi Pemesanan Pelanggan (*Customer Order Guard*):**
  - Pelanggan tetap dapat membuka modal detail produk untuk melihat foto dan membaca spesifikasi/deskripsi produk.
  - Bagian kontrol kuantitas dan tombol **"Masuk Keranjang"** otomatis digantikan banner abu-abu informatif: *"Produk Sedang Dinonaktifkan (belum dapat dipesan pelanggan)"*.
  - Proteksi lapis ganda di `cart.js` pada fungsi `confirmAddProductToCart`, `moveWish` (pindah dari favorit ke keranjang), dan validasi pra-checkout `validateCartToCheckout` untuk mencegah item nonaktif masuk ke transaksi.
- **Penyelarasan Panel CMS Admin:**
  - Status produk nonaktif di CMS Admin diperbarui dari `Nonaktif (Sembunyi)` menjadi **`Nonaktif (Tampil Abu-Abu)`** dengan ikon ban kontras.
  - Label dan deskripsi toggle pada form edit produk dan modal *Quick Edit* diselaraskan agar pengelola toko mengetahui bahwa produk nonaktif tetap tampil sebagai arsip abu-abu di katalog.
- **PWA Cache Update:** Versi Service Worker dinaikkan ke `freshmart-pwa-v10`.

---

## [2026-09-15] - Desain Ulang Riwayat Kas Keluar & Top Pengadaan Barang (Anti Teks Terpotong)
### Peningkatan & Perbaikan Visual:
- **Penyelesaian Bug Badge No. Faktur Terpotong (*Text-Wrap Hyphen Bug*):**
  - Mengatasi masalah teks nomor faktur (misal `FB-20260909-380`) yang sebelumnya terdesak oleh nama supplier panjang hingga terpotong menjadi 3 baris bertumpuk di layar HP.
  - Memisahkan nama supplier di baris utama dengan pemotongan teks aman (`truncate`), dan memindahkan badge nomor faktur ke baris kedua bersama tanggal dan metode pembayaran dengan atribut `whitespace-nowrap shrink-0` sehingga nomor faktur selalu utuh satu baris.
- **Header Finansial Premium & Navigasi Cepat:**
  - Header kartu kini menampilkan ikon transfer kas, jumlah bukti bayar/cicilan, serta total pengeluaran kas tebal di sisi kanan.
  - Setiap kartu transaksi kas keluar kini bersifat interaktif (`cursor-pointer`)—mengetuk kartu akan langsung membuka modal rincian faktur lengkap (`openPurchaseDetailModal`).
- **Penyempurnaan Top Komoditas Pengadaan:**
  - Desain kartu peringkat pengadaan (#1, #2, dst.) diperbarui simetris dengan badge nomor kontras, informasi total kuantitas masuk, rata-rata HPP satuan, serta total nilai belanja yang jelas dan rapi.
  - Mengganti scrollbar default browser dengan *custom smooth scrollbar* berpadding lega.
- **PWA Cache Update:** Versi Service Worker dinaikkan ke `freshmart-pwa-v9`.

---

## [2026-09-15] - Perbaikan Tampilan Terpotong & Desain Responsif Mobile-Friendly
### Peningkatan & Perbaikan Tampilan:
- **Penyelesaian Bug Kolom Terpotong di Layar HP (*Purchase Invoice Detail*):**
  - Mengatasi masalah tabel 5 kolom pada Detail Faktur Pembelian (`purchase-detail-modal`) di mana kolom *Subtotal* terpotong di tepi kanan layar ponsel.
  - Menerapkan arsitektur tampilan responsif ganda:
    - **Layar HP / Ponsel (`< sm`):** Konten barang otomatis beralih menjadi kartu rincian produk yang elegan (*Mobile Card List View*), menampilkan nomor urut, nama produk, tag varian, perhitungan `Qty × Harga Beli`, serta nominal *Subtotal* yang tebal dan jelas tanpa ada tulisan yang terpotong.
    - **Layar Desktop (`>= sm`):** Tetap menyajikan format tabel data lengkap (*Desktop Table View*) dengan bungkus kontainer `overflow-x-auto` yang aman dan presisi.
- **Transformasi Modal Menjadi Native Mobile Bottom Sheet:**
  - Mengubah modal-modal transaksi yang sebelumnya bertipe *centered dialog* kaku di ponsel menjadi *bottom sheet* fleksibel yang meluncur mulus dari bawah layar HP (`purchase-detail-modal`, `purchase-modal`, `purchase-payment-modal`, `supplier-modal`, dan `admin-order-modal`).
  - Menambahkan *drag handle pill* di bagian atas modal untuk kenyamanan sentuhan jari di HP.
  - Penyesuaian `max-h-[92dvh]` dan padding responsif (`p-3.5 sm:p-5`) mencegah konten bertumpukan dengan footer atau terpotong di bagian atas/bawah.
- **Perbaikan Header Nota & Ringkasan Keuangan:**
  - Alamat toko dan nama supplier kini mendukung pemotongan teks rapi (*line-clamp* / *break-words*) sehingga tidak memenuhi tinggi layar HP.
  - Ringkasan total unit dan jenis barang ditampilkan terpadu di dalam ringkasan finansial faktur.
- **PWA Cache Update:** Versi Service Worker dinaikkan ke `freshmart-pwa-v8`.

---

## [2026-09-15] - Perbaikan Sinkronisasi Laporan Penjualan & Pesanan Masuk (Realtime Sync)
### Peningkatan & Perbaikan Sistem:
- **Sinkronisasi Otomatis Realtime (`onSnapshot`):**
  - Mengubah pengambilan data laporan penjualan dari sebelumnya satu kali (*one-shot* `.get()`) menjadi *realtime listener* (`onSnapshot`).
  - Setiap kali ada pesanan baru masuk dari etalase online (checkout pelanggan) maupun transaksi kasir POS, data laporan penjualan (omset, modal/HPP, laba bersih, ringkasan produk, dan riwayat transaksi) langsung terbarui otomatis secara seketika tanpa perlu admin me-refresh atau mengklik ulang tab.
- **Pembersihan Listener Anti-Memory Leak:**
  - Menambahkan manajemen listener (`aReportLst`) yang otomatis di-`unsubscribe` saat admin berpindah dari tab Laporan ke tab lain (Produk, Pesanan, Kasir POS, Pengaturan), menjaga efisiensi memori browser.
- **Peningkatan Batas Kuota Query (Limit 2000):**
  - Menaikkan kuota query dokumen pesanan dari 500 menjadi 2.000 pesanan terbaru agar toko dengan volume transaksi tinggi tidak mengalami kekosongan data pada periode bulan atau tahun berjalan.
- **Perbaikan Bug Zona Waktu Lokal (WIB / WITA / WIT):**
  - Menerapkan fungsi konversi tanggal berbasis zona waktu lokal perangkat (`_toLocalDateStr`), mengatasi ketidaksinkronan konversi `toISOString()` UTC di mana pesanan yang dibuat dini hari (pukul 00:00 - 06:59 WIB) sebelumnya terhitung sebagai transaksi hari kemarin di laporan "Hari Ini" atau pada filter tanggal kustom.
- **Multi-Fallback Parsing Tanggal Pesanan (`_parseOrderDate`):**
  - Parsing tanggal mendukung Firestore Timestamp (`toDate()`), ISO Date String (`dateString`), Created At timestamp, string tanggal, hingga ekstraksi milidetik dari nomor order unik (`ORD<timestamp>`).
- **Konsistensi Logika Cetak Laporan Keuangan:**
  - Menyatukan filter periode pada tampilan layar (`renderReportView`) dan jendela cetak dokumen (`printFinancialReport`) menggunakan fungsi terpusat `_filterOrdersByPeriod` sehingga nominal omset dan laba yang tercetak 100% identik dengan yang tampil di dashboard.
- **Pencarian Transaksi Lebih Lengkap & Label Sumber Jelas:**
  - Fitur pencarian riwayat transaksi kini mendukung pencarian nama pemesan online atau nomor telepon.
  - Kartu riwayat transaksi kini menampilkan identitas pemesan online secara jelas: `Online (<Nama Pembeli>)` atau nama kasir.
- **PWA Cache Update:** `sw.js` diperbarui ke cache `v7`.

---

## [2026-09-15] - Maintenance & Audit Menyeluruh Website
### Bug Fixes & Code Quality:
- **Bug Fix Kritis (Back Button HP tidak menutup PDF Preview):**
  - `bootstrap.js`: Diperbaiki typo nama fungsi `closePdfPreviewModal` → `closePreviewModal` yang menyebabkan tombol Back hardware di HP tidak dapat menutup modal preview dokumen A4.
- **Upgrade PDF Preview Modal ke Zero-Flicker Engine:**
  - `pdf-preview-modal.html` & `print.js`: Modal preview dokumen A4 kini menggunakan `openModalSmooth`/`closeModalSmooth` sepenuhnya, konsisten dengan seluruh modal lain di aplikasi.
  - Menghapus kelas `fade-in` yang bertabrakan dengan engine transisi halus baru.
- **Deduplication CSS (Penghapusan Kode Ganda):**
  - `base.css`: Menghapus blok `html.dark body` duplikat yang menimpa warna dark mode yang benar.
  - `responsive.css`: Menyederhanakan blok `.scroll-content` terduplikasi, hanya simpan `min-height: 0`.
- **Kualitas Kode (Code Hygiene):**
  - `print.js`: Ditambahkan label deskriptif pada 3 pemanggilan `console.error(error)` yang sebelumnya kosong tanpa konteks.
  - `components.css`: Menghapus baris kosong berlebih di akhir file.
- **PWA Cache Update:** `sw.js` versi cache `v5` → `v6` agar semua klien PWA mendapatkan kode terbaru.
- **Audit 100% Bersih:** 305 event handler, 250 DOM ID referensi, dan 21 modal terverifikasi bersih.

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
