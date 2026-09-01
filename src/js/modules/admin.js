// =============================================================================
// FRESHMART ADMIN DASHBOARD & CMS MODULE
// =============================================================================

window.canViewCostPrice = () => {
  if (cRole === 'admin') return true;
  return Array.isArray(cPerms) && cPerms.includes('view_cost_price');
};

const aF = {
  products: [
    { key: 'name', label: 'Nama Produk', type: 'text' }, 
    { key: 'sku', label: 'Barcode / SKU (Bisa Auto / Manual)', type: 'sku' },
    { key: 'price', label: 'Harga Jual Dasar (Rp)', type: 'number' }, 
    { key: 'costPrice', label: 'Harga Modal / HPP (Rp)', type: 'costPrice' }, 
    { key: 'stock', label: 'Stok Tersedia (Jumlah)', type: 'stock' }, 
    { key: 'isUnlimited', label: 'Tipe Manajemen Stok', type: 'select', options: [{ val: 'false', text: 'Terbatas (Sesuai Jumlah Stok)' }, { val: 'true', text: '∞ Unlimited (Selalu Tersedia / Tanpa Batas Stok)' }] },
    { key: 'unit', label: 'Satuan (cth: pcs, kg, lusin)', type: 'unit_selector' },
    { key: 'img', label: 'URL Gambar', type: 'text' },
    { key: 'category', label: 'Kategori', type: 'dynamic_select_category' }, 
    { key: 'supplierId', label: 'Asal Rekanan Supplier (Vendor)', type: 'dynamic_select_supplier' },
    { key: 'tag', label: 'Label/Tag', type: 'text' },
    { key: 'isActive', label: 'Status Visibilitas Toko', type: 'select', options: [{ val: 'true', text: 'Aktif (Tampil di Toko)' }, { val: 'false', text: 'Nonaktif (Disembunyikan)' }] },
    { key: 'desc', label: 'Deskripsi', type: 'textarea' }, 
    { key: 'wholesale', label: 'Grosir', type: 'wholesale_builder' },
    { key: 'variants', label: 'Varian', type: 'variants_builder' }
  ],
  categories: [{ key: 'name', label: 'Kategori', type: 'text' }, { key: 'img', label: 'URL Ikon', type: 'text' }],
  vouchers: [{ key: 'code', label: 'Kode', type: 'text' }, { key: 'type', label: 'Jenis', type: 'select', options: [{ val: 'product_percent', text: 'Diskon Produk (%)' }, { val: 'shipping_percent', text: 'Diskon Ongkir (%)' }, { val: 'shipping_flat', text: 'Potongan Ongkir (Rp)' }] }, { key: 'value', label: 'Nilai', type: 'number' }, { key: 'expiredAt', label: 'Berlaku Sampai (kosongkan = tidak ada batas)', type: 'text' }],
  banks: [{ key: 'bankName', label: 'Nama Bank', type: 'text' }, { key: 'bankAccount', label: 'No. Rekening', type: 'text' }, { key: 'bankOwner', label: 'Atas Nama', type: 'text' }],
  banners: [{ key: 'title', label: 'Judul', type: 'text' }, { key: 'subtitle', label: 'Sub-judul', type: 'text' }, { key: 'img', label: 'URL Gambar', type: 'text' }],
  accounts: [
    { key: 'name', label: 'Nama Pegawai/Kasir', type: 'text' }, 
    { key: 'username', label: 'Username Login', type: 'text' }, 
    { key: 'password', label: 'Password Login', type: 'text' },
    { key: 'isActive', label: 'Status Akun', type: 'select', options: [{ val: 'true', text: 'Aktif' }, { val: 'false', text: 'Ditangguhkan' }] },
    { key: 'permissions', label: 'Hak Akses Kasir (Dicentang = Boleh)', type: 'permissions_builder' }
  ]
};

window.checkAdminAccess = () => isAdm ? (changeView('view-admin'), openAdminMenu()) : (setV('login-username', ''), setV('login-password', ''), changeView('view-admin-login'));

window.openAdminMenu = () => {
  show('admin-dashboard-view'); 
  hide('admin-content-view'); 
  hide('btn-admin-back'); 
  show('admin-logo-box');
  setIn('admin-header-title', cRole === 'cashier' ? 'Panel Kasir' : 'CMS Toko'); 
  if (aOrdLst) { aOrdLst(); aOrdLst = null; }

  document.querySelectorAll("[onclick^='openAdminTab']").forEach(btn => {
    const tabMatch = btn.getAttribute('onclick').match(/'([^']+)'/);
    if (tabMatch) {
      const tabName = tabMatch[1];
      if (cRole === 'cashier') {
        const isSensitive = ['settings', 'banks', 'accounts'].includes(tabName);
        const hasReportPerm = tabName === 'reports' && cPerms.includes('view_reports');
        if (isSensitive || (tabName === 'reports' ? !hasReportPerm : !cPerms.includes(tabName))) {
          btn.classList.add('hidden'); btn.classList.remove('flex');
        } else {
          btn.classList.remove('hidden'); btn.classList.add('flex');
        }
      } else {
        btn.classList.remove('hidden'); btn.classList.add('flex');
      }
    }
  });
};

window.processAdminLogin = () => {
  const now = Date.now();
  const attempts = parseInt(sL('_fm_la') || '0');
  const lastFail = parseInt(sL('_fm_lf') || '0');
  if (attempts >= 5 && (now - lastFail) < 30000) {
    const sisa = Math.ceil((30000 - (now - lastFail)) / 1000);
    return showToast(`Terlalu banyak percobaan. Tunggu ${sisa} detik.`);
  }
  if ((now - lastFail) >= 30000) { ssL('_fm_la', '0'); }

  const u = getV('login-username'), p = getV('login-password');
  
  // 1. JALUR KHUSUS DEVELOPER (Firebase Auth)
  if (u.includes('@') && u.includes('.')) {
    sLoad('Otentikasi Developer...');
    firebase.auth().signInWithEmailAndPassword(u, p)
      .then((userCredential) => {
        hLoad(); 
        isAdm = !0; isPro = !0; cRole = 'admin'; cPerms = ['all'];
        setH('admin-pro-badge', '<span class="badge badge-xs badge-solid-amber"><i class="fa-solid fa-crown"></i> PRO DEV</span>');
        changeView('view-admin'); 
        openAdminMenu(); 
        showToast("Akses Developer Aktif!");
      })
      .catch((error) => {
        hLoad();
        let errorMessage = "Gagal Login!";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          errorMessage = "Email atau Password salah!";
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = "Fitur Email/Password belum diaktifkan!";
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = "Format email salah!";
        } else {
          errorMessage = error.message; 
        }
        showToast(errorMessage);
      });
    return; 
  }

  // 2. JALUR TAB KASIR (Direct to POS Mode)
  if (typeof currentLoginTab !== 'undefined' && currentLoginTab === 'cashier') {
    const kasir = (appData.accounts || []).find(a => a.username === u && a.password === p && a.isActive !== 'false' && a.isActive !== false);
    if (kasir) {
      ssL('_fm_la', '0');
      isAdm = !0;
      cRole = 'cashier';
      cPerms = kasir.permissions || [];
      activeCashier = kasir;
      showToast(`Selamat bertugas, ${kasir.name}!`);
      if (typeof initPosView === 'function') initPosView();
      else changeView('view-pos');
      return;
    } else if (u === appData.auth.username && p === appData.auth.password) {
      // Master Admin juga bisa membuka POS Kasir
      ssL('_fm_la', '0');
      isAdm = !0;
      cRole = 'admin';
      cPerms = ['all'];
      activeCashier = { name: 'Admin Master' };
      showToast("Membuka POS Kasir (Mode Admin)");
      if (typeof initPosView === 'function') initPosView();
      else changeView('view-pos');
      return;
    } else {
      const fa = parseInt(sL('_fm_la') || '0') + 1;
      ssL('_fm_la', fa.toString());
      ssL('_fm_lf', Date.now().toString());
      showToast("Akun kasir tidak ditemukan / password salah!");
      return;
    }
  }

  // 3. JALUR TAB ADMIN (Master CMS Toko)
  if (u === appData.auth.username && p === appData.auth.password) {
    ssL('_fm_la', '0');
    isAdm = !0; 
    cRole = 'admin'; cPerms = ['all'];
    activeCashier = { name: 'Admin Master' };
    setH('admin-pro-badge', isPro ? '<span class="badge badge-xs badge-solid-amber"><i class="fa-solid fa-crown"></i> PRO</span>' : '<span class="badge badge-xs badge-solid-slate">FREE</span>');
    changeView('view-admin'); 
    openAdminMenu();
  } else {
    // Jalur Kasir dengan Izin Akses CMS
    const kasir = (appData.accounts || []).find(a => a.username === u && a.password === p && a.isActive !== 'false' && a.isActive !== false);
    if (kasir) {
      isAdm = !0; 
      cRole = 'cashier'; cPerms = kasir.permissions || [];
      activeCashier = kasir;
      setH('admin-pro-badge', '<span class="badge badge-xs badge-solid-blue"><i class="fa-solid fa-user-tie"></i> KASIR</span>');
      changeView('view-admin'); 
      openAdminMenu(); 
      showToast(`Selamat bertugas, ${kasir.name}!`);
    } else {
      const fa = parseInt(sL('_fm_la') || '0') + 1;
      ssL('_fm_la', fa.toString()); 
      ssL('_fm_lf', Date.now().toString());
      showToast("Data Admin Tidak Ditemukan / Password Salah!");
    }
  }
};

window.logoutAdmin = () => { 
  isAdm = !1; 
  isPro = !1; 
  if (aOrdLst) { aOrdLst(); aOrdLst = null; } 
  changeView('view-catalog'); 
};

window.checkProPrint = () => { openReceiptPreview(); };

window.openAdminTab = (t, fH = !1) => {
  cTab = t; aSq = '';
  
  if (cRole === 'cashier') {
    const isSensitive = ['settings', 'banks', 'accounts'].includes(t);
    const hasReportPerm = t === 'reports' && cPerms.includes('view_reports');
    if (isSensitive || (t === 'reports' ? !hasReportPerm : !cPerms.includes(t))) {
      hide('admin-dashboard-view'); 
      show('admin-content-view'); 
      show('btn-admin-back'); 
      hide('admin-logo-box'); 
      setIn('admin-header-title', 'Akses Ditolak');
      setH('admin-content', `<div class="text-center py-10 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-200 dark:border-rose-900/30 shadow-sm px-6 max-w-lg mx-auto mt-4"><div class="w-16 h-16 bg-white dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fa-solid fa-hand text-3xl"></i></div><h2 class="text-base font-bold text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2><p class="text-xs text-slate-500 dark:text-slate-400 font-bold mb-6">Akun Anda tidak diizinkan membuka fitur <b>${t.toUpperCase()}</b>.</p></div>`);
      return;
    }
  }

  if (!fH) history.pushState({ view: 'view-admin', tab: t }, '', '');
  
  hide('admin-dashboard-view'); 
  show('admin-content-view'); 
  show('btn-admin-back'); 
  hide('admin-logo-box');
  const titles = { 
    'orders': 'Daftar Pesanan', 
    'reports': 'Laporan Penjualan & Laba Rugi',
    'purchases': 'Pembelian, Hutang & Supplier',
    'stock_opname': 'Stok Opname & Audit Fisik',
    'settings': 'Pengaturan Toko', 
    'products': 'Kelola Produk', 
    'categories': 'Kelola Kategori', 
    'vouchers': 'Kelola Voucher', 
    'banks': 'Rekening Bank', 
    'banners': 'Kelola Banner', 
    'accounts': 'Kelola Akun Kasir' 
  };
  setIn('admin-header-title', titles[t] || 'CMS Toko');
  
  if (t !== 'orders' && aOrdLst) { aOrdLst(); aOrdLst = null; }
  if (t === 'settings') rAdmSet(); 
  else if (t === 'orders') rAdmOrd(); 
  else if (t === 'reports') rAdmReports();
  else if (t === 'purchases') rAdmPurchases();
  else if (t === 'stock_opname') rAdmStockOpname();
  else rAdmL(t);
};

// =============================================================================
// LAPORAN KEUANGAN, LABA RUGI & MODAL TOKO (APP-STYLE CARD BOX DESIGN)
// =============================================================================
let reportPeriod = 'today';
let reportSubTab = 'products'; // 'products' | 'transactions'
let reportCustomStart = '';
let reportCustomEnd = '';
let cachedReportOrders = [];
let reportSearchQuery = '';

window.rAdmReports = async () => {
  setH('admin-content', `
    <div class="space-y-4 pb-20">
      ${window.getTabHelpBanner ? window.getTabHelpBanner('reports') : ''}
      <!-- Header App-Style Card Box -->
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm" style="background-color:var(--clr-p-bg);color:var(--clr-p)">
              <i class="fa-solid fa-chart-pie"></i>
            </div>
            <div>
              <h2 class="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <span>Laporan Penjualan & Laba</span>
              </h2>
              <p class="text-[11px] font-semibold text-slate-400 mt-0.5">Rekapitulasi Omset, Total Modal (HPP), & Keuntungan Bersih.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="printFinancialReport()" class="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
              <i class="fa-solid fa-print text-sm"></i> <span>Cetak</span>
            </button>
            <button type="button" onclick="exportFinancialReportCsv()" class="flex-1 sm:flex-initial px-4 py-2 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95" style="background-color:var(--clr-p)">
              <i class="fa-solid fa-file-excel text-sm"></i> <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Periode Segmented App Pills -->
      <div class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i class="fa-solid fa-calendar-check text-emerald-500"></i> Periode:
          </span>
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <button type="button" onclick="setReportPeriod('today')" class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${reportPeriod === 'today' ? 'text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" style="${reportPeriod === 'today' ? 'background-color:var(--clr-p);color:#fff' : ''}">Hari Ini</button>
            <button type="button" onclick="setReportPeriod('7days')" class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${reportPeriod === '7days' ? 'text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" style="${reportPeriod === '7days' ? 'background-color:var(--clr-p);color:#fff' : ''}">7 Hari</button>
            <button type="button" onclick="setReportPeriod('month')" class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${reportPeriod === 'month' ? 'text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" style="${reportPeriod === 'month' ? 'background-color:var(--clr-p);color:#fff' : ''}">Bulan Ini</button>
            <button type="button" onclick="setReportPeriod('year')" class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${reportPeriod === 'year' ? 'text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" style="${reportPeriod === 'year' ? 'background-color:var(--clr-p);color:#fff' : ''}">Tahun Ini</button>
            <button type="button" onclick="setReportPeriod('all')" class="px-3.5 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${reportPeriod === 'all' ? 'text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}" style="${reportPeriod === 'all' ? 'background-color:var(--clr-p);color:#fff' : ''}">Semua</button>
          </div>
        </div>

        <!-- Custom Date Range Bar -->
        <div class="pt-3 border-t border-slate-100 dark:border-slate-700/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0"><i class="fa-regular fa-calendar-days mr-1"></i> Sesuaikan:</span>
          <div class="flex items-center gap-2 flex-1">
            <input type="date" id="report-start-date" value="${reportCustomStart}" class="admin-input !py-1.5 !px-3 !text-xs !rounded-lg bg-slate-50 dark:bg-slate-900 flex-1 font-bold"/>
            <span class="text-xs font-bold text-slate-400">s/d</span>
            <input type="date" id="report-end-date" value="${reportCustomEnd}" class="admin-input !py-1.5 !px-3 !text-xs !rounded-lg bg-slate-50 dark:bg-slate-900 flex-1 font-bold"/>
          </div>
          <button type="button" onclick="applyCustomReportDate()" class="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-black rounded-lg shrink-0 transition-all shadow-sm active:scale-95">
            Terapkan
          </button>
        </div>
      </div>

      <!-- Report Dynamic Output Container -->
      <div id="report-data-container" class="space-y-4">
        <div class="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <i class="fa-solid fa-spinner fa-spin text-3xl" style="color:var(--clr-p)"></i>
          <p class="text-xs font-bold text-slate-400 mt-3">Menghitung laporan keuangan...</p>
        </div>
      </div>
    </div>
  `);

  try {
    if (typeof db !== 'undefined' && db.collection) {
      const snap = await db.collection("freshmart_orders").orderBy("timestamp", "desc").limit(500).get();
      cachedReportOrders = snap.docs.map(doc => doc.data());
    } else {
      cachedReportOrders = [];
    }
  } catch (err) {
    console.warn('[Reports] Fetch error:', err);
    cachedReportOrders = [];
  }

  renderReportView();
};

window.setReportPeriod = (period) => {
  reportPeriod = period;
  if (period !== 'custom') {
    reportCustomStart = '';
    reportCustomEnd = '';
  }
  rAdmReports();
};

window.setReportSubTab = (subTab) => {
  reportSubTab = subTab;
  renderReportView();
};

window.applyCustomReportDate = () => {
  const start = (el('report-start-date')?.value || '').trim();
  const end = (el('report-end-date')?.value || '').trim();
  if (!start || !end) return showToast('Pilih tanggal mulai & tanggal selesai!');
  reportCustomStart = start;
  reportCustomEnd = end;
  reportPeriod = 'custom';
  renderReportView();
};

window.onReportSearch = (val) => {
  reportSearchQuery = (val || '').toLowerCase().trim();
  renderReportView();
};

window.renderReportView = () => {
  const container = el('report-data-container');
  if (!container) return;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thisMonthStr = now.toISOString().slice(0, 7);
  const thisYearStr = now.getFullYear().toString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Filter orders
  const validOrders = (cachedReportOrders || []).filter(order => {
    if (order.status === 'Dibatalkan') return false;
    
    let orderDate = null;
    if (order.timestamp && order.timestamp.toDate) {
      orderDate = order.timestamp.toDate();
    } else if (order.dateString || order.createdAt) {
      orderDate = new Date(order.dateString || order.createdAt);
    } else {
      orderDate = new Date();
    }
    const orderDateStr = orderDate.toISOString().slice(0, 10);

    if (reportPeriod === 'today') {
      return orderDateStr === todayStr;
    } else if (reportPeriod === '7days') {
      return orderDate >= sevenDaysAgo;
    } else if (reportPeriod === 'month') {
      return orderDateStr.startsWith(thisMonthStr);
    } else if (reportPeriod === 'year') {
      return orderDateStr.startsWith(thisYearStr);
    } else if (reportPeriod === 'custom') {
      return orderDateStr >= reportCustomStart && orderDateStr <= reportCustomEnd;
    }
    return true;
  });

  // Calculate Metrics
  let totalSales = 0;
  let totalCost = 0;
  let totalItemsSold = 0;
  const paymentBreakdown = { cash: 0, qris: 0, transfer: 0, edc: 0, cod: 0, other: 0 };
  const productAgg = {};

  validOrders.forEach(o => {
    const grand = parseFloat(o.payment?.grandTotal || o.payment?.total || 0) || 0;
    totalSales += grand;

    const methodKey = (o.payment?.methodKey || o.payment?.method || 'cash').toLowerCase();
    if (methodKey.includes('tunai') || methodKey === 'cash') paymentBreakdown.cash += grand;
    else if (methodKey.includes('qris')) paymentBreakdown.qris += grand;
    else if (methodKey.includes('transfer')) paymentBreakdown.transfer += grand;
    else if (methodKey.includes('edc') || methodKey.includes('debit')) paymentBreakdown.edc += grand;
    else if (methodKey.includes('cod')) paymentBreakdown.cod += grand;
    else paymentBreakdown.other += grand;

    let orderCost = 0;
    (o.items || []).forEach(item => {
      const qty = parseInt(item.qty) || 1;
      totalItemsSold += qty;
      const price = parseFloat(item.price || item.effectivePrice) || 0;

      let costPerUnit = typeof item.costPrice !== 'undefined' && item.costPrice !== '' ? (parseFloat(item.costPrice) || 0) : 0;
      if (!costPerUnit) {
        const prod = (appData.products || []).find(p => String(p.id) === String(item.id) || p.name === item.name);
        if (prod) {
          if (item.variantName && prod.variants && prod.variants.length > 0) {
            const v = prod.variants.find(vr => vr.name === item.variantName);
            costPerUnit = parseFloat(v?.costPrice) || parseFloat(prod.costPrice) || 0;
          } else {
            costPerUnit = parseFloat(prod.costPrice) || 0;
          }
        }
      }
      const itemCost = costPerUnit * qty;
      orderCost += itemCost;

      const pKey = `${item.name}${item.variantName ? ' (' + item.variantName + ')' : ''}`;
      if (!productAgg[pKey]) {
        productAgg[pKey] = { name: pKey, qty: 0, sales: 0, cost: 0, profit: 0 };
      }
      productAgg[pKey].qty += qty;
      productAgg[pKey].sales += (price * qty);
      productAgg[pKey].cost += itemCost;
      productAgg[pKey].profit += ((price * qty) - itemCost);
    });

    totalCost += orderCost;
  });

  const netProfit = totalSales - totalCost;
  const marginPct = totalSales > 0 && netProfit > 0 ? Math.round((netProfit / totalSales) * 100) : 0;
  
  let productList = Object.values(productAgg).sort((a, b) => b.profit - a.profit);
  if (reportSearchQuery) {
    productList = productList.filter(p => p.name.toLowerCase().includes(reportSearchQuery));
  }

  let filteredOrders = validOrders;
  if (reportSearchQuery) {
    filteredOrders = validOrders.filter(o => {
      const id = String(o.orderId || o.id || '').toLowerCase();
      const c = String(o.cashier || o.source || '').toLowerCase();
      const m = String(o.payment?.method || '').toLowerCase();
      return id.includes(reportSearchQuery) || c.includes(reportSearchQuery) || m.includes(reportSearchQuery);
    });
  }

  let periodLabel = 'Hari Ini';
  if (reportPeriod === '7days') periodLabel = '7 Hari Terakhir';
  else if (reportPeriod === 'month') periodLabel = `Bulan ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
  else if (reportPeriod === 'year') periodLabel = `Tahun ${thisYearStr}`;
  else if (reportPeriod === 'custom') periodLabel = `${reportCustomStart} s/d ${reportCustomEnd}`;
  else if (reportPeriod === 'all') periodLabel = 'Semua Transaksi';

  container.innerHTML = `
    <!-- 4 Clean 1px-Border Metric Card Boxes -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Card 1: Total Omset -->
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2 sm:mb-3">
            <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Total Omset</span>
            <div class="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xs sm:text-sm"><i class="fa-solid fa-wallet"></i></div>
          </div>
          <div class="text-base sm:text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">${fCur(totalSales)}</div>
        </div>
        <p class="text-[10px] font-bold text-slate-400 mt-2 truncate">${periodLabel}</p>
      </div>

      <!-- Card 2: Total Modal (HPP) -->
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2 sm:mb-3">
            <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Modal (HPP)</span>
            <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center text-xs sm:text-sm"><i class="fa-solid fa-boxes-packing"></i></div>
          </div>
          <div class="text-base sm:text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">${fCur(totalCost)}</div>
        </div>
        <p class="text-[10px] font-bold text-slate-400 mt-2">Beban modal produk</p>
      </div>

      <!-- Card 3: Laba Bersih -->
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border ${netProfit >= 0 ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20' : 'border-rose-300 dark:border-rose-700 bg-rose-50/20'} shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2 sm:mb-3">
            <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">Laba Bersih</span>
            <div class="w-8 h-8 rounded-xl ${netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-rose-100 text-rose-600'} flex items-center justify-center text-xs sm:text-sm"><i class="fa-solid fa-arrow-trend-up"></i></div>
          </div>
          <div class="text-base sm:text-xl font-black ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'} leading-tight mb-1">${fCur(netProfit)}</div>
        </div>
        <div class="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-md mt-2 w-fit ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'}">
          Margin: ${marginPct}%
        </div>
      </div>

      <!-- Card 4: Transaksi & Volume -->
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2 sm:mb-3">
            <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">Total Transaksi</span>
            <div class="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-xs sm:text-sm"><i class="fa-solid fa-receipt"></i></div>
          </div>
          <div class="text-base sm:text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">${validOrders.length} <span class="text-xs font-bold text-slate-400">Trx</span></div>
        </div>
        <p class="text-[10px] font-bold text-slate-400 mt-2">${totalItemsSold} pcs produk terjual</p>
      </div>
    </div>

    <!-- Rincian Metode Pembayaran Card Box -->
    <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2.5">
      <h3 class="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <i class="fa-solid fa-money-bill-wave text-emerald-500"></i> Rincian Pembayaran Masuk
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
          <span class="text-[9px] font-bold text-slate-400 block mb-0.5">TUNAI</span>
          <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-white">${fCur(paymentBreakdown.cash)}</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
          <span class="text-[9px] font-bold text-slate-400 block mb-0.5">QRIS</span>
          <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-white">${fCur(paymentBreakdown.qris)}</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
          <span class="text-[9px] font-bold text-slate-400 block mb-0.5">TRANSFER</span>
          <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-white">${fCur(paymentBreakdown.transfer)}</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
          <span class="text-[9px] font-bold text-slate-400 block mb-0.5">EDC / DEBIT</span>
          <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-white">${fCur(paymentBreakdown.edc)}</span>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center col-span-2 sm:col-span-1">
          <span class="text-[9px] font-bold text-slate-400 block mb-0.5">COD</span>
          <span class="text-xs sm:text-sm font-black text-slate-800 dark:text-white">${fCur(paymentBreakdown.cod)}</span>
        </div>
      </div>
    </div>

    <!-- Segmented Navigation Tab & Search Bar (Mobile App Style) -->
    <div class="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Segmented Tab Switch -->
        <div class="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button type="button" onclick="setReportSubTab('products')" class="py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${reportSubTab === 'products' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
            <i class="fa-solid fa-trophy text-amber-500"></i> <span>Produk (${productList.length})</span>
          </button>
          <button type="button" onclick="setReportSubTab('transactions')" class="py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${reportSubTab === 'transactions' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
            <i class="fa-solid fa-receipt text-purple-500"></i> <span>Transaksi (${filteredOrders.length})</span>
          </button>
        </div>

        <!-- Quick Search Bar -->
        <div class="relative flex-1 max-w-sm">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" placeholder="Cari nama produk / ID transaksi..." value="${reportSearchQuery}" oninput="onReportSearch(this.value)" class="admin-input !py-2 !pl-9 !pr-3 !text-xs !rounded-xl bg-slate-50 dark:bg-slate-900 w-full font-bold"/>
        </div>
      </div>
    </div>

    <!-- LIST VIEW CARD BOX CONTAINER -->
    ${reportSubTab === 'products' ? `
      <!-- LIST VIEW: KONTRIBUSI PRODUK -->
      <div class="space-y-2.5">
        ${productList.length === 0 ? `
          <div class="text-center py-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
              <i class="fa-solid fa-box-open"></i>
            </div>
            <h4 class="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada produk terjual</h4>
            <p class="text-[10px] text-slate-400 mt-1">Coba ganti filter periode laporan Anda.</p>
          </div>
        ` : productList.map((p, idx) => {
          const pMargin = p.sales > 0 && p.profit > 0 ? Math.round((p.profit / p.sales) * 100) : 0;
          return `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200' : idx === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' : idx === 2 ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500'}">
                  #${idx + 1}
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">${esc(p.name)}</h4>
                  <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-[11px] text-slate-400 font-semibold">
                    <span class="inline-flex items-center gap-1"><i class="fa-solid fa-cubes text-[9px]"></i> Terjual: <b class="text-slate-700 dark:text-slate-200">${p.qty} pcs</b></span>
                    <span>•</span>
                    <span>Modal: <b class="text-slate-500 font-bold">${fCur(p.cost)}</b></span>
                    <span>•</span>
                    <span>Omset: <b class="text-slate-800 dark:text-slate-200 font-black">${fCur(p.sales)}</b></span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/50 shrink-0">
                <div class="text-left sm:text-right">
                  <span class="text-[9px] uppercase font-black text-slate-400 block">Laba Bersih</span>
                  <span class="text-xs sm:text-sm font-black ${p.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}">${fCur(p.profit)}</span>
                </div>
                <span class="px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${p.profit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                  ${pMargin}% Margin
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <!-- LIST VIEW: RIWAYAT TRANSAKSI -->
      <div class="space-y-2.5">
        ${filteredOrders.length === 0 ? `
          <div class="text-center py-14 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/50 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
              <i class="fa-solid fa-receipt"></i>
            </div>
            <h4 class="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada transaksi</h4>
            <p class="text-[10px] text-slate-400 mt-1">Belum ada data pesanan pada periode ini.</p>
          </div>
        ` : filteredOrders.map(o => {
          const grand = parseFloat(o.payment?.grandTotal || o.payment?.total || 0) || 0;
          let ordCost = 0;
          let itemCount = 0;
          (o.items || []).forEach(it => {
            const q = parseInt(it.qty) || 1;
            itemCount += q;
            let cpu = typeof it.costPrice !== 'undefined' && it.costPrice !== '' ? (parseFloat(it.costPrice) || 0) : 0;
            if (!cpu) {
              const pr = (appData.products || []).find(p => String(p.id) === String(it.id) || p.name === it.name);
              if (pr) {
                if (it.variantName && pr.variants && pr.variants.length > 0) {
                  const vr = pr.variants.find(v => v.name === it.variantName);
                  cpu = parseFloat(vr?.costPrice) || parseFloat(pr.costPrice) || 0;
                } else {
                  cpu = parseFloat(pr.costPrice) || 0;
                }
              }
            }
            ordCost += (cpu * q);
          });
          const ordProfit = grand - ordCost;
          let dtStr = o.dateString ? new Date(o.dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-';

          return `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0" style="background-color:var(--clr-p-bg);color:var(--clr-p)">
                    <i class="fa-solid fa-receipt"></i>
                  </div>
                  <div class="min-w-0">
                    <span class="font-mono font-bold text-xs text-slate-900 dark:text-white block truncate">${esc(o.orderId || o.id)}</span>
                    <span class="text-[10px] text-slate-400 font-semibold block">${dtStr} • ${esc(o.cashier || o.source || 'Kasir')} • ${itemCount} item</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                    ${esc(o.payment?.method || 'Tunai')}
                  </span>
                  <span class="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    ${esc(o.status || 'Selesai')}
                  </span>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 text-center">
                <div>
                  <span class="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Omset</span>
                  <span class="text-xs font-black text-slate-900 dark:text-white">${fCur(grand)}</span>
                </div>
                <div>
                  <span class="text-[9px] uppercase font-black text-slate-400 block mb-0.5">Modal HPP</span>
                  <span class="text-xs font-bold text-slate-500">${fCur(ordCost)}</span>
                </div>
                <div>
                  <span class="text-[9px] uppercase font-black text-emerald-600 dark:text-emerald-400 block mb-0.5">Laba</span>
                  <span class="text-xs font-black ${ordProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}">${fCur(ordProfit)}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;
};

window.printFinancialReport = () => {
  if (!cachedReportOrders || cachedReportOrders.length === 0) {
    return showToast('Tidak ada data transaksi untuk dicetak!');
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thisMonthStr = now.toISOString().slice(0, 7);
  const thisYearStr = now.getFullYear().toString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Filter Orders
  const validOrders = (cachedReportOrders || []).filter(order => {
    if (order.status === 'Dibatalkan') return false;
    let orderDate = null;
    if (order.timestamp && order.timestamp.toDate) {
      orderDate = order.timestamp.toDate();
    } else if (order.dateString || order.createdAt) {
      orderDate = new Date(order.dateString || order.createdAt);
    } else {
      orderDate = new Date();
    }
    const orderDateStr = orderDate.toISOString().slice(0, 10);

    if (reportPeriod === 'today') return orderDateStr === todayStr;
    if (reportPeriod === '7days') return orderDate >= sevenDaysAgo;
    if (reportPeriod === 'month') return orderDateStr.startsWith(thisMonthStr);
    if (reportPeriod === 'year') return orderDateStr.startsWith(thisYearStr);
    if (reportPeriod === 'custom') return orderDateStr >= reportCustomStart && orderDateStr <= reportCustomEnd;
    return true;
  });

  if (!validOrders.length) {
    return showToast('Tidak ada data transaksi pada periode ini!');
  }

  // 2. Metrics Calculation
  let totalSales = 0;
  let totalCost = 0;
  let totalItems = 0;
  const productAgg = {};

  validOrders.forEach(o => {
    const grand = parseFloat(o.payment?.grandTotal || o.payment?.total || 0) || 0;
    totalSales += grand;

    let ordCost = 0;
    (o.items || []).forEach(it => {
      const q = parseInt(it.qty) || 1;
      totalItems += q;
      const p = parseFloat(it.price || it.effectivePrice) || 0;

      let cpu = typeof it.costPrice !== 'undefined' && it.costPrice !== '' ? (parseFloat(it.costPrice) || 0) : 0;
      if (!cpu) {
        const pr = (appData.products || []).find(x => String(x.id) === String(it.id) || x.name === it.name);
        if (pr) {
          if (it.variantName && pr.variants && pr.variants.length > 0) {
            const vr = pr.variants.find(v => v.name === it.variantName);
            cpu = parseFloat(vr?.costPrice) || parseFloat(pr.costPrice) || 0;
          } else {
            cpu = parseFloat(pr.costPrice) || 0;
          }
        }
      }
      const itemCost = cpu * q;
      ordCost += itemCost;

      const pKey = `${it.name}${it.variantName ? ' (' + it.variantName + ')' : ''}`;
      if (!productAgg[pKey]) {
        productAgg[pKey] = { name: pKey, qty: 0, sales: 0, cost: 0, profit: 0 };
      }
      productAgg[pKey].qty += q;
      productAgg[pKey].sales += (p * q);
      productAgg[pKey].cost += itemCost;
      productAgg[pKey].profit += ((p * q) - itemCost);
    });

    totalCost += ordCost;
  });

  const netProfit = totalSales - totalCost;
  const marginPct = totalSales > 0 && netProfit > 0 ? Math.round((netProfit / totalSales) * 100) : 0;
  const periodLabelMap = {
    today: 'Hari Ini (' + now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ')',
    '7days': '7 Hari Terakhir',
    month: 'Bulan Ini (' + now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) + ')',
    year: 'Tahun ' + now.getFullYear(),
    all: 'Semua Waktu',
    custom: `${reportCustomStart || '-'} s/d ${reportCustomEnd || '-'}`
  };
  const periodText = periodLabelMap[reportPeriod] || reportPeriod;
  const printDateText = now.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  // 3. Build HTML Output for Printing
  let h = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#0f172a;max-width:800px;margin:0 auto;padding:10px 0;background:#ffffff;">
      <!-- Header Laporan -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:14px;margin-bottom:16px;">
        <div>
          <h1 style="font-size:20px;font-weight:900;color:#0f172a;margin:0;letter-spacing:-0.02em;">${esc(appData.store?.name || 'TOKO GRAFIKA')}</h1>
          <p style="font-size:11px;color:#64748b;margin:2px 0 0 0;">${esc(appData.store?.slogan || 'Ritel & Grosir Online')}</p>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0 0;">${esc(appData.store?.address || '')} ${appData.store?.wa ? ' · WA: ' + appData.store.wa : ''}</p>
        </div>
        <div style="text-align:right;">
          <h2 style="font-size:15px;font-weight:900;color:#059669;margin:0;text-transform:uppercase;letter-spacing:0.04em;">LAPORAN PENJUALAN & LABA</h2>
          <p style="font-size:11px;font-weight:700;color:#334155;margin:3px 0 0 0;">Periode: ${esc(periodText)}</p>
          <p style="font-size:9px;color:#94a3b8;margin:2px 0 0 0;">Dicetak: ${printDateText}</p>
        </div>
      </div>

      <!-- 4 Kotak Ringkasan KPI Finansial -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px;">
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#f8fafc;">
          <p style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;margin:0 0 4px 0;">Total Penjualan</p>
          <p style="font-size:14px;font-weight:900;color:#059669;margin:0;">${fCur(totalSales)}</p>
          <p style="font-size:8.5px;color:#94a3b8;margin:2px 0 0 0;">${validOrders.length} transaksi</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#f8fafc;">
          <p style="font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;margin:0 0 4px 0;">Total Modal (HPP)</p>
          <p style="font-size:14px;font-weight:900;color:#dc2626;margin:0;">${fCur(totalCost)}</p>
          <p style="font-size:8.5px;color:#94a3b8;margin:2px 0 0 0;">${totalItems} qty produk</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#ecfdf5;border-color:#a7f3d0;">
          <p style="font-size:9px;font-weight:800;color:#047857;text-transform:uppercase;margin:0 0 4px 0;">Laba Bersih</p>
          <p style="font-size:14px;font-weight:900;color:#047857;margin:0;">${fCur(netProfit)}</p>
          <p style="font-size:8.5px;color:#059669;margin:2px 0 0 0;">Omset - HPP</p>
        </div>
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;background:#eff6ff;border-color:#bfdbfe;">
          <p style="font-size:9px;font-weight:800;color:#1d4ed8;text-transform:uppercase;margin:0 0 4px 0;">Margin Profit</p>
          <p style="font-size:14px;font-weight:900;color:#1d4ed8;margin:0;">${marginPct}%</p>
          <p style="font-size:8.5px;color:#2563eb;margin:2px 0 0 0;">Rasio Profitabilitas</p>
        </div>
      </div>

      <!-- Tabel Rincian Transaksi Penjualan -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:12px;font-weight:800;color:#334155;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.04em;">Rincian Transaksi Kasir & Online (${validOrders.length})</h3>
        <table style="width:100%;border-collapse:collapse;font-size:10px;text-align:left;">
          <thead>
            <tr style="background:#f1f5f9;border-top:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;">
              <th style="padding:6px 8px;font-weight:800;color:#475569;width:5%;">No</th>
              <th style="padding:6px 8px;font-weight:800;color:#475569;width:16%;">Waktu / Tanggal</th>
              <th style="padding:6px 8px;font-weight:800;color:#475569;width:15%;">No Order</th>
              <th style="padding:6px 8px;font-weight:800;color:#475569;width:16%;">Kasir / Sumber</th>
              <th style="padding:6px 8px;font-weight:800;color:#475569;width:12%;">Metode</th>
              <th style="padding:6px 8px;font-weight:800;color:#475569;text-align:right;width:12%;">Omset</th>
              <th style="padding:6px 8px;font-weight:800;color:#475569;text-align:right;width:12%;">Modal (HPP)</th>
              <th style="padding:6px 8px;font-weight:800;color:#475569;text-align:right;width:12%;">Laba Bersih</th>
            </tr>
          </thead>
          <tbody>
            ${validOrders.map((o, idx) => {
              const grand = parseFloat(o.payment?.grandTotal || o.payment?.total || 0) || 0;
              let ordCost = 0;
              (o.items || []).forEach(it => {
                const q = parseInt(it.qty) || 1;
                let cpu = typeof it.costPrice !== 'undefined' && it.costPrice !== '' ? (parseFloat(it.costPrice) || 0) : 0;
                if (!cpu) {
                  const pr = (appData.products || []).find(x => String(x.id) === String(it.id) || x.name === it.name);
                  if (pr) {
                    if (it.variantName && pr.variants && pr.variants.length > 0) {
                      const vr = pr.variants.find(v => v.name === it.variantName);
                      cpu = parseFloat(vr?.costPrice) || parseFloat(pr.costPrice) || 0;
                    } else {
                      cpu = parseFloat(pr.costPrice) || 0;
                    }
                  }
                }
                ordCost += (cpu * q);
              });
              const ordProfit = grand - ordCost;
              const dt = o.dateString ? new Date(o.dateString).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : (o.createdAt || '-');
              const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

              return `
                <tr style="background:${bg};border-bottom:1px solid #f1f5f9;">
                  <td style="padding:6px 8px;color:#64748b;">${idx + 1}</td>
                  <td style="padding:6px 8px;color:#334155;white-space:nowrap;">${dt}</td>
                  <td style="padding:6px 8px;font-weight:700;color:#0f172a;font-family:'JetBrains Mono',monospace;">#${esc(o.orderId || o.id)}</td>
                  <td style="padding:6px 8px;color:#475569;">${esc(o.cashier || o.source || 'Online')}</td>
                  <td style="padding:6px 8px;color:#475569;text-transform:uppercase;font-size:9px;">${esc(o.payment?.method || 'Tunai')}</td>
                  <td style="padding:6px 8px;text-align:right;font-weight:700;color:#0f172a;">${fCur(grand)}</td>
                  <td style="padding:6px 8px;text-align:right;color:#dc2626;">${fCur(ordCost)}</td>
                  <td style="padding:6px 8px;text-align:right;font-weight:800;color:#059669;">${fCur(ordProfit)}</td>
                </tr>
              `;
            }).join('')}
            <tr style="background:#f1f5f9;border-top:2px solid #cbd5e1;font-weight:900;">
              <td colspan="5" style="padding:8px;text-align:right;text-transform:uppercase;">TOTAL KESELURUHAN:</td>
              <td style="padding:8px;text-align:right;color:#0f172a;">${fCur(totalSales)}</td>
              <td style="padding:8px;text-align:right;color:#dc2626;">${fCur(totalCost)}</td>
              <td style="padding:8px;text-align:right;color:#059669;">${fCur(netProfit)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tanda Tangan Pengesahan Laporan -->
      <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:10px;text-align:center;font-size:10px;">
        <div style="width:200px;">
          <p style="margin:0 0 45px 0;color:#64748b;">Dibuat Oleh (Admin/Kasir),</p>
          <p style="font-weight:800;border-bottom:1px solid #94a3b8;padding-bottom:2px;margin:0;">( ..................................... )</p>
        </div>
        <div style="width:200px;">
          <p style="margin:0 0 45px 0;color:#64748b;">Mengetahui (Owner Toko),</p>
          <p style="font-weight:800;border-bottom:1px solid #94a3b8;padding-bottom:2px;margin:0;">${esc(appData.store?.name || 'Toko Grafika')}</p>
        </div>
      </div>
    </div>
  `;

  // 4. Inject ke #report-print-section
  let printEl = document.getElementById('report-print-section');
  if (!printEl) {
    printEl = document.createElement('div');
    printEl.id = 'report-print-section';
    document.body.appendChild(printEl);
  }
  printEl.innerHTML = h;

  // 5. Masuk ke mode report print & panggil window.print()
  document.body.classList.add('print-mode-report');
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-report');
    }, 1000);
  }, 150);
};

window.exportFinancialReportCsv = () => {
  if (!cachedReportOrders || cachedReportOrders.length === 0) {
    return showToast('Tidak ada data laporan untuk diekspor!');
  }

  let csv = '\uFEFF';
  csv += `LAPORAN PENJUALAN & LABA RUGI - ${appData.store?.name || 'Toko Grafika'}\n`;
  csv += `Periode: ${reportPeriod.toUpperCase()}\n`;
  csv += `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}\n\n`;

  csv += `No. Order,Tanggal/Waktu,Kasir/Sumber,Metode Pembayaran,Total Penjualan (Omset),Total Modal (HPP),Laba Bersih,Status\n`;

  cachedReportOrders.forEach(o => {
    if (o.status === 'Dibatalkan') return;
    const grand = parseFloat(o.payment?.grandTotal || o.payment?.total || 0) || 0;
    let ordCost = 0;
    (o.items || []).forEach(it => {
      const q = parseInt(it.qty) || 1;
      let cpu = typeof it.costPrice !== 'undefined' && it.costPrice !== '' ? (parseFloat(it.costPrice) || 0) : 0;
      if (!cpu) {
        const pr = (appData.products || []).find(p => String(p.id) === String(it.id) || p.name === it.name);
        if (pr) {
          if (it.variantName && pr.variants && pr.variants.length > 0) {
            const vr = pr.variants.find(v => v.name === it.variantName);
            cpu = parseFloat(vr?.costPrice) || parseFloat(pr.costPrice) || 0;
          } else {
            cpu = parseFloat(pr.costPrice) || 0;
          }
        }
      }
      ordCost += (cpu * q);
    });
    const ordProfit = grand - ordCost;
    const dtStr = o.dateString || o.createdAt || '';
    csv += `"${o.orderId || o.id}","${dtStr}","${o.cashier || o.source || 'Online'}","${o.payment?.method || 'Tunai'}",${grand},${ordCost},${ordProfit},"${o.status || 'Selesai'}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Laba_Rugi_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Laporan CSV berhasil diunduh!');
};

window.activatePro = async () => {
  if (isSaving) return;
  const c = getV('pro-license-input').trim().toUpperCase();
  
  sLoad('Memverifikasi Lisensi...');
  const isValid = await verifyLicenseInDb(c, 'PRO');
  
  if (isValid) {
    appData.licenseKey = c; 
    localStorage.setItem('freshmart_cache_PRO', c);
    isPro = !0;
    setH('admin-pro-badge', '<span class="badge badge-xs badge-solid-amber"><i class="fa-solid fa-crown"></i> PRO</span>');
    await saveApp(); 
    showToast("Akses PRO Terbuka!"); 
    openAdminTab(cTab);
  } else {
    showToast("Kode Lisensi Tidak Valid / Nonaktif!");
  }
  hLoad();
};

// =============================================================================
// STOK OPNAME & AUDIT FISIK BARANG (STOCK TAKE & INVENTORY AUDIT)
// =============================================================================
window.soFilterStatus = 'all'; // 'all' | 'minus' | 'plus' | 'match'
window.soSearchQuery = '';
window.soCurrentProduct = null;
window.soCurrentVariant = null;

window.rAdmStockOpname = () => {
  appData.stockOpname = appData.stockOpname || [];
  
  // Hitung ringkasan
  let totalAudit = appData.stockOpname.length;
  let totalDiffUnits = 0;
  let totalDiffValue = 0;
  let countMinus = 0;
  let countPlus = 0;
  let countMatch = 0;

  appData.stockOpname.forEach(item => {
    const diff = Number(item.diffQty || 0);
    const val = Number(item.totalDiffValue || 0);
    totalDiffUnits += diff;
    totalDiffValue += val;
    if (diff < 0) countMinus++;
    else if (diff > 0) countPlus++;
    else countMatch++;
  });

  const getPillCls = (key) => window.soFilterStatus === key 
    ? 'ring-2 ring-cyan-500 scale-[1.02] shadow-md border-cyan-500 bg-white dark:bg-slate-800' 
    : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-600 opacity-80 hover:opacity-100 shadow-xs';

  setH('admin-content', `
    <div class="space-y-4 pb-20">
      ${window.getTabHelpBanner ? window.getTabHelpBanner('stock_opname') : ''}
      
      <!-- Header App-Style Card Box -->
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-lg shrink-0 shadow-sm border border-cyan-200/60 dark:border-cyan-800/50">
              <i class="fa-solid fa-clipboard-check"></i>
            </div>
            <div>
              <h2 class="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <span>Stok Opname & Audit Fisik</span>
              </h2>
              <p class="text-[11px] font-semibold text-slate-400 mt-0.5">Penyesuaian stok sistem dengan hitung fisik nyata & audit selisih HPP.</p>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
            <button type="button" onclick="printStockOpnameReport()" class="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
              <i class="fa-solid fa-print text-sm"></i> <span>Cetak Log</span>
            </button>
            <button type="button" onclick="exportStockOpnameCsv()" class="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
              <i class="fa-solid fa-file-excel text-sm"></i> <span>Export CSV</span>
            </button>
            <button type="button" onclick="openStockOpnameModal()" class="w-full sm:w-auto px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95" style="background-color:var(--clr-p)">
              <i class="fa-solid fa-plus"></i> <span>Catat Opname</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Ringkasan Statistik 3 Card Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base shrink-0">
            <i class="fa-solid fa-list-check"></i>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Audit Tercatat</p>
            <h3 class="text-lg font-black text-slate-800 dark:text-white leading-tight">${totalAudit} Kali</h3>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl ${totalDiffUnits < 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' : (totalDiffUnits > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')} flex items-center justify-center text-base shrink-0">
            <i class="fa-solid ${totalDiffUnits < 0 ? 'fa-arrow-trend-down' : (totalDiffUnits > 0 ? 'fa-arrow-trend-up' : 'fa-check')}"></i>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Selisih Unit</p>
            <h3 class="text-lg font-black ${totalDiffUnits < 0 ? 'text-rose-600' : (totalDiffUnits > 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-white')} leading-tight">
              ${totalDiffUnits > 0 ? '+' : ''}${totalDiffUnits} Unit
            </h3>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl ${totalDiffValue < 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' : (totalDiffValue > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')} flex items-center justify-center text-base shrink-0">
            <i class="fa-solid fa-coins"></i>
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Nilai Selisih (HPP)</p>
            <h3 class="text-lg font-black ${totalDiffValue < 0 ? 'text-rose-600' : (totalDiffValue > 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-white')} leading-tight">
              ${totalDiffValue < 0 ? '-' : (totalDiffValue > 0 ? '+' : '')}${fCur(Math.abs(totalDiffValue))}
            </h3>
          </div>
        </div>
      </div>

      <!-- Filter Tabs & Search Bar -->
      <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <!-- Filter Tabs -->
        <div class="grid grid-cols-4 gap-1.5 w-full sm:w-auto">
          <button type="button" onclick="window.soFilterStatus='all';renderStockOpnameList()" class="cursor-pointer border rounded-xl py-2 px-3 text-center transition-all text-xs font-bold ${getPillCls('all')}">
            Semua (${totalAudit})
          </button>
          <button type="button" onclick="window.soFilterStatus='minus';renderStockOpnameList()" class="cursor-pointer border rounded-xl py-2 px-3 text-center transition-all text-xs font-bold ${getPillCls('minus')} text-rose-600">
            Minus (${countMinus})
          </button>
          <button type="button" onclick="window.soFilterStatus='plus';renderStockOpnameList()" class="cursor-pointer border rounded-xl py-2 px-3 text-center transition-all text-xs font-bold ${getPillCls('plus')} text-emerald-600">
            Plus (${countPlus})
          </button>
          <button type="button" onclick="window.soFilterStatus='match';renderStockOpnameList()" class="cursor-pointer border rounded-xl py-2 px-3 text-center transition-all text-xs font-bold ${getPillCls('match')} text-slate-600 dark:text-slate-300">
            Sesuai (${countMatch})
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative w-full sm:w-72">
          <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input id="so-search-input" placeholder="Cari nama barang, SKU, alasan..." oninput="clearTimeout(window._soST);window._soST=setTimeout(()=>{window.soSearchQuery=this.value.toLowerCase();renderStockOpnameList()},200)" class="admin-input !pl-9 !py-2.5 !text-xs !rounded-xl" />
        </div>
      </div>

      <!-- Riwayat List Container -->
      <div id="stock-opname-list-container" class="space-y-3">
        <!-- Rendered via renderStockOpnameList() -->
      </div>
    </div>
  `);

  renderStockOpnameList();
};

window.renderStockOpnameList = () => {
  const container = el('stock-opname-list-container');
  if (!container) return;

  const rawList = [...(appData.stockOpname || [])];
  rawList.sort((a, b) => (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0));

  const filtered = rawList.filter(item => {
    const diff = Number(item.diffQty || 0);
    if (window.soFilterStatus === 'minus' && diff >= 0) return false;
    if (window.soFilterStatus === 'plus' && diff <= 0) return false;
    if (window.soFilterStatus === 'match' && diff !== 0) return false;

    if (window.soSearchQuery) {
      const q = window.soSearchQuery;
      const matchName = (item.productName || '').toLowerCase().includes(q);
      const matchVar = (item.variantName || '').toLowerCase().includes(q);
      const matchReason = (item.reasonLabel || item.reason || '').toLowerCase().includes(q);
      const matchUser = (item.user || '').toLowerCase().includes(q);
      const matchNote = (item.note || '').toLowerCase().includes(q);
      if (!matchName && !matchVar && !matchReason && !matchUser && !matchNote) return false;
    }
    return true;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="text-center py-16 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200/80 dark:border-slate-700/80 shadow-sm">
        <i class="fa-solid fa-clipboard-list text-4xl mb-3 opacity-40 block"></i>
        Belum ada riwayat stok opname ${window.soFilterStatus !== 'all' ? `dengan filter ${window.soFilterStatus}` : ''}
      </div>
    `;
    return;
  }

  const reasonNames = {
    'lost': 'Selisih Hitung / Hilang',
    'damage': 'Barang Rusak / Pecah',
    'expired': 'Barang Kadaluarsa / Expired',
    'supplier_bonus': 'Bonus / Kelebihan Supplier',
    'initial_correction': 'Koreksi Saldo Awal',
    'other': 'Lainnya'
  };

  container.innerHTML = filtered.map(item => {
    const diff = Number(item.diffQty || 0);
    const val = Number(item.totalDiffValue || 0);
    const isMinus = diff < 0;
    const isPlus = diff > 0;
    const isMatch = diff === 0;

    const badgeCls = isMinus 
      ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60' 
      : (isPlus 
        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60' 
        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600');

    const pr = (appData.products || []).find(p => String(p.id) === String(item.productId));
    const thumbImg = pr?.img || '';

    return `
      <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <!-- Info Produk & Waktu -->
        <div class="flex items-start gap-3.5 min-w-0 flex-1">
          <div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
            ${thumbImg ? `<img src="${thumbImg}" class="w-full h-full object-cover" alt="Produk" />` : `<i class="fa-solid fa-box text-slate-400 text-lg"></i>`}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">${item.productName || 'Produk'}</h4>
              ${item.variantName ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">${item.variantName}</span>` : ''}
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeCls}">
                ${isPlus ? `+${diff}` : diff} ${item.unit || 'Unit'}
              </span>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-slate-400 font-medium flex-wrap">
              <span><i class="fa-regular fa-clock mr-1"></i>${item.dateString || '-'}</span>
              <span><i class="fa-regular fa-user mr-1"></i>Oleh: <b>${item.user || 'Admin'}</b></span>
              <span><i class="fa-solid fa-tag mr-1"></i>Alasan: <b>${reasonNames[item.reason] || item.reason || '-'}</b></span>
            </div>
            ${item.note ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">"${item.note}"</p>` : ''}
          </div>
        </div>

        <!-- Perbandingan Stok & Nilai Selisih -->
        <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-100 dark:border-slate-700 sm:border-t-0 shrink-0">
          <div class="text-left sm:text-right">
            <div class="text-[10px] text-slate-400 uppercase font-semibold">Penyesuaian Stok</div>
            <div class="text-xs font-bold text-slate-700 dark:text-slate-300">
              <span class="line-through text-slate-400">${item.systemStock}</span> ➔ <span class="font-black text-slate-900 dark:text-white">${item.physicalStock} ${item.unit || 'Pcs'}</span>
            </div>
            <div class="text-[11px] font-black ${isMinus ? 'text-rose-600' : (isPlus ? 'text-emerald-600' : 'text-slate-500')} mt-0.5">
              Nilai: ${isMinus ? '-' : (isPlus ? '+' : '')}${fCur(Math.abs(val))}
            </div>
          </div>

          <!-- Tombol Hapus Log Record -->
          <button type="button" onclick="deleteStockOpnameLog('${item.id}')" class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 hover:bg-rose-600 hover:text-white border border-rose-100 dark:border-rose-800 transition-all flex items-center justify-center text-xs shadow-xs active:scale-95" title="Hapus Riwayat Opname Ini">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.openStockOpnameModal = (productId = null, variantId = null) => {
  const modal = el('stock-opname-modal');
  const box = el('stock-opname-modal-box');
  if (!modal || !box) return;

  // Populate products dropdown
  const select = el('so-product-select');
  if (select) {
    const prods = [...(appData.products || [])];
    prods.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    select.innerHTML = `<option value="">-- Pilih Produk Toko --</option>` + prods.map(p => {
      return `<option value="${p.id}">${p.name} (Stok: ${p.stock ?? 0} ${p.unit || 'Pcs'})</option>`;
    }).join('');
  }

  // Reset fields
  setV('so-search-keyword', '');
  setV('so-physical-stock-input', '');
  setV('so-note-input', '');
  setV('so-reason-select', 'lost');
  hide('so-variant-container');
  hide('so-product-info-card');
  setIn('so-diff-qty-badge', '0 Unit');
  setIn('so-diff-value-badge', 'Rp 0');

  if (productId) {
    if (select) select.value = productId;
    handleSoProductChange(productId, variantId);
  }

  show('stock-opname-modal');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    box.classList.remove('translate-y-full', 'sm:scale-95');
    box.classList.add('translate-y-0', 'sm:scale-100');
  }, 10);
};

window.closeStockOpnameModal = () => {
  const modal = el('stock-opname-modal');
  const box = el('stock-opname-modal-box');
  if (!modal || !box) return;

  modal.classList.add('opacity-0');
  box.classList.add('translate-y-full', 'sm:scale-95');
  box.classList.remove('translate-y-0', 'sm:scale-100');
  setTimeout(() => hide('stock-opname-modal'), 300);
};

window.handleSoProductChange = (prodId, targetVarId = null) => {
  if (!prodId) {
    window.soCurrentProduct = null;
    window.soCurrentVariant = null;
    hide('so-variant-container');
    hide('so-product-info-card');
    return;
  }

  const p = (appData.products || []).find(x => String(x.id) === String(prodId));
  if (!p) return;

  window.soCurrentProduct = p;
  const hasVars = p.variants && p.variants.length > 0;

  const varContainer = el('so-variant-container');
  const varSelect = el('so-variant-select');

  if (hasVars && varContainer && varSelect) {
    show('so-variant-container');
    varSelect.innerHTML = p.variants.map((v, idx) => {
      const vId = v.id || idx;
      return `<option value="${vId}">${v.name} (Stok: ${v.stock ?? 0}, HPP: ${fCur(v.costPrice || p.costPrice || 0)})</option>`;
    }).join('');

    if (targetVarId) varSelect.value = targetVarId;
    window.soCurrentVariant = p.variants.find((v, idx) => String(v.id || idx) === String(varSelect.value)) || p.variants[0];
  } else {
    hide('so-variant-container');
    window.soCurrentVariant = null;
  }

  updateSoProductInfoDisplay();
  calcStockOpnameLiveDiff();
};

window.handleSoVariantChange = (varId) => {
  if (!window.soCurrentProduct || !window.soCurrentProduct.variants) return;
  window.soCurrentVariant = window.soCurrentProduct.variants.find((v, idx) => String(v.id || idx) === String(varId)) || window.soCurrentProduct.variants[0];
  updateSoProductInfoDisplay();
  calcStockOpnameLiveDiff();
};

const updateSoProductInfoDisplay = () => {
  const p = window.soCurrentProduct;
  if (!p) return;

  show('so-product-info-card');
  const v = window.soCurrentVariant;

  const imgEl = el('so-info-img');
  if (imgEl) imgEl.src = (v && v.img) || p.img || 'https://via.placeholder.com/150';

  setIn('so-info-title', p.name + (v ? ` - ${v.name}` : ''));
  setIn('so-info-category', p.category || 'Kategori Umum');

  const currentSysStock = v ? Number(v.stock ?? 0) : Number(p.stock ?? 0);
  const currentHpp = v ? (Number(v.costPrice) || Number(p.costPrice) || 0) : (Number(p.costPrice) || 0);

  setIn('so-info-system-stock', `${currentSysStock} ${p.unit || 'Pcs'}`);
  setIn('so-info-hpp', `${fCur(currentHpp)} / ${p.unit || 'Pcs'}`);
  setIn('so-unit-label', `Unit: ${p.unit || 'Pcs'}`);
};

window.filterSoProducts = (keyword) => {
  const select = el('so-product-select');
  if (!select) return;
  const q = (keyword || '').trim().toLowerCase();
  const prods = [...(appData.products || [])];
  prods.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const filtered = !q ? prods : prods.filter(p => {
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    const varMatch = (p.variants || []).some(v => (v.name || '').toLowerCase().includes(q) || (v.sku || '').toLowerCase().includes(q));
    return nameMatch || skuMatch || varMatch;
  });

  select.innerHTML = `<option value="">-- Pilih Produk Toko (${filtered.length}) --</option>` + filtered.map(p => {
    return `<option value="${p.id}">${p.name} ${p.sku ? `[${p.sku}]` : ''} (Stok: ${p.stock ?? 0} ${p.unit || 'Pcs'})</option>`;
  }).join('');

  if (q) {
    const exactSku = prods.find(p => p.sku && p.sku.toLowerCase() === q);
    if (exactSku) {
      select.value = exactSku.id;
      handleSoProductChange(exactSku.id);
      return;
    }
    if (filtered.length === 1 && q.length >= 2) {
      select.value = filtered[0].id;
      handleSoProductChange(filtered[0].id);
    }
  }
};

window.handleSoBarcodeScan = (barcode) => {
  if (!barcode) return;
  const b = barcode.trim().toLowerCase();
  
  // Find product by SKU / barcode
  let foundProd = null;
  let foundVar = null;

  for (const p of (appData.products || [])) {
    if (p.sku && p.sku.toLowerCase() === b) {
      foundProd = p;
      break;
    }
    if (p.variants && p.variants.length > 0) {
      const v = p.variants.find(vr => vr.sku && vr.sku.toLowerCase() === b);
      if (v) {
        foundProd = p;
        foundVar = v;
        break;
      }
    }
  }

  if (foundProd) {
    filterSoProducts('');
    setV('so-search-keyword', foundProd.name);
    const select = el('so-product-select');
    if (select) select.value = foundProd.id;
    handleSoProductChange(foundProd.id, foundVar?.id);
    showToast(`Produk terdeteksi: ${foundProd.name}`);
    const input = el('so-physical-stock-input');
    if (input) input.focus();
  } else {
    showToast(`Barcode "${barcode}" tidak cocok dengan produk manapun`);
  }
};

window.calcStockOpnameLiveDiff = () => {
  const p = window.soCurrentProduct;
  if (!p) return;

  const v = window.soCurrentVariant;
  const currentSysStock = v ? Number(v.stock ?? 0) : Number(p.stock ?? 0);
  const currentHpp = v ? (Number(v.costPrice) || Number(p.costPrice) || 0) : (Number(p.costPrice) || 0);

  const physInputVal = getV('so-physical-stock-input');
  if (physInputVal === '' || isNaN(physInputVal)) {
    setIn('so-diff-qty-badge', '0 Unit');
    setIn('so-diff-value-badge', 'Rp 0');
    return;
  }

  const physicalStock = parseFloat(physInputVal) || 0;
  const diffQty = physicalStock - currentSysStock;
  const diffValue = diffQty * currentHpp;

  const badgeEl = el('so-diff-qty-badge');
  const valEl = el('so-diff-value-badge');
  const cardEl = el('so-diff-result-card');

  if (badgeEl) {
    if (diffQty < 0) {
      badgeEl.className = 'font-black text-sm px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300';
      badgeEl.innerText = `${diffQty} ${p.unit || 'Unit'} (Kurang)`;
    } else if (diffQty > 0) {
      badgeEl.className = 'font-black text-sm px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300';
      badgeEl.innerText = `+${diffQty} ${p.unit || 'Unit'} (Lebih)`;
    } else {
      badgeEl.className = 'font-black text-sm px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
      badgeEl.innerText = `0 ${p.unit || 'Unit'} (Sesuai / Pas)`;
    }
  }

  if (valEl) {
    valEl.className = `font-black text-sm ${diffValue < 0 ? 'text-rose-600' : (diffValue > 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200')}`;
    valEl.innerText = `${diffValue < 0 ? '-' : (diffValue > 0 ? '+' : '')}${fCur(Math.abs(diffValue))}`;
  }

  if (cardEl) {
    if (diffQty < 0) cardEl.className = 'p-3.5 rounded-2xl border transition-all space-y-2 bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50';
    else if (diffQty > 0) cardEl.className = 'p-3.5 rounded-2xl border transition-all space-y-2 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50';
    else cardEl.className = 'p-3.5 rounded-2xl border transition-all space-y-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700';
  }
};

window.saveStockOpnameAdjustment = async () => {
  if (isSaving) return;
  const p = window.soCurrentProduct;
  if (!p) return showToast('Silakan pilih produk terlebih dahulu!');

  const physInputVal = getV('so-physical-stock-input');
  if (physInputVal === '' || isNaN(physInputVal) || Number(physInputVal) < 0) {
    return showToast('Masukkan jumlah fisik di rak dengan benar!');
  }

  const physicalStock = parseFloat(physInputVal);
  const v = window.soCurrentVariant;
  const currentSysStock = v ? Number(v.stock ?? 0) : Number(p.stock ?? 0);
  const currentHpp = v ? (Number(v.costPrice) || Number(p.costPrice) || 0) : (Number(p.costPrice) || 0);
  const diffQty = physicalStock - currentSysStock;
  const totalDiffValue = diffQty * currentHpp;
  const reason = getV('so-reason-select') || 'lost';
  const note = getV('so-note-input').trim();

  sLoad('Menerapkan Penyesuaian Stok...');
  isSaving = true;

  try {
    // 1. Update stok produk di appData
    if (v) {
      v.stock = physicalStock;
    } else {
      p.stock = physicalStock;
    }

    // 2. Buat log entry
    appData.stockOpname = appData.stockOpname || [];
    const logEntry = {
      id: 'SO-' + Date.now(),
      timestamp: Date.now(),
      dateString: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      productId: p.id,
      productName: p.name,
      variantId: v?.id || null,
      variantName: v?.name || null,
      systemStock: currentSysStock,
      physicalStock: physicalStock,
      diffQty: diffQty,
      unit: p.unit || 'Pcs',
      hpp: currentHpp,
      totalDiffValue: totalDiffValue,
      reason: reason,
      note: note,
      user: cUser || (cRole === 'cashier' ? 'Kasir' : 'Admin')
    };

    appData.stockOpname.unshift(logEntry);

    // 3. Simpan ke database
    await saveApp();

    closeStockOpnameModal();
    showToast(`Stok Opname berhasil diterapkan! Stok sekarang: ${physicalStock} ${p.unit || 'Pcs'}`);

    if (cTab === 'stock_opname') {
      rAdmStockOpname();
    } else if (cTab === 'products') {
      rAdmItms('products');
    }
  } catch (err) {
    console.error('Error stock opname:', err);
    showToast('Gagal menyimpan penyesuaian stok!');
  } finally {
    isSaving = false;
    hLoad();
  }
};

window.deleteStockOpnameLog = async (logId) => {
  if (!confirm('Hapus catatan riwayat audit stok opname ini?')) return;
  appData.stockOpname = (appData.stockOpname || []).filter(item => item.id !== logId);
  sLoad('Menghapus...');
  await saveApp();
  hLoad();
  showToast('Catatan riwayat opname berhasil dihapus');
  if (cTab === 'stock_opname') rAdmStockOpname();
};

window.exportStockOpnameCsv = () => {
  if (!appData.stockOpname || appData.stockOpname.length === 0) {
    return showToast('Tidak ada data riwayat stok opname untuk diekspor!');
  }

  let csv = '\uFEFF';
  csv += `LAPORAN RIWAYAT STOK OPNAME & AUDIT FISIK - ${appData.store?.name || 'Toko Grafika'}\n`;
  csv += `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}\n\n`;

  csv += `ID Log,Waktu,Petugas,Nama Produk,Varian,Stok Sistem,Stok Fisik,Selisih Unit,Satuan,HPP Modal,Nilai Selisih Keuangan (Rp),Alasan,Catatan\n`;

  const reasonNames = {
    'lost': 'Selisih Hitung / Hilang',
    'damage': 'Barang Rusak / Pecah',
    'expired': 'Barang Kadaluarsa / Expired',
    'supplier_bonus': 'Bonus / Kelebihan Supplier',
    'initial_correction': 'Koreksi Saldo Awal',
    'other': 'Lainnya'
  };

  appData.stockOpname.forEach(item => {
    const diff = Number(item.diffQty || 0);
    const val = Number(item.totalDiffValue || 0);
    const rName = reasonNames[item.reason] || item.reason || '-';
    csv += `"${item.id}","${item.dateString}","${item.user || 'Admin'}","${item.productName || ''}","${item.variantName || '-'}","${item.systemStock}","${item.physicalStock}","${diff}","${item.unit || 'Pcs'}",${item.hpp || 0},${val},"${rName}","${item.note || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Laporan_Stok_Opname_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Laporan CSV Stok Opname berhasil diunduh!');
};

window.printStockOpnameReport = () => {
  if (!appData.stockOpname || appData.stockOpname.length === 0) {
    return showToast('Tidak ada data stok opname untuk dicetak!');
  }

  let totalDiffUnits = 0;
  let totalDiffVal = 0;
  appData.stockOpname.forEach(it => {
    totalDiffUnits += Number(it.diffQty || 0);
    totalDiffVal += Number(it.totalDiffValue || 0);
  });

  const reasonNames = {
    'lost': 'Selisih Hitung / Hilang',
    'damage': 'Barang Rusak / Pecah',
    'expired': 'Kadaluarsa',
    'supplier_bonus': 'Bonus Supplier',
    'initial_correction': 'Koreksi Saldo Awal',
    'other': 'Lainnya'
  };

  const rows = appData.stockOpname.map((it, idx) => {
    const diff = Number(it.diffQty || 0);
    const val = Number(it.totalDiffValue || 0);
    return `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:6px 8px;font-size:11px;">${idx + 1}</td>
        <td style="padding:6px 8px;font-size:11px;">${it.dateString || '-'}<br/><span style="color:#64748b;font-size:9.5px;">Oleh: ${it.user || 'Admin'}</span></td>
        <td style="padding:6px 8px;font-size:11px;font-weight:700;">${it.productName}${it.variantName ? ` (${it.variantName})` : ''}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:center;">${it.systemStock} ➔ <b>${it.physicalStock}</b></td>
        <td style="padding:6px 8px;font-size:11px;text-align:center;font-weight:800;color:${diff < 0 ? '#e11d48' : (diff > 0 ? '#059669' : '#475569')};">${diff > 0 ? '+' : ''}${diff} ${it.unit || ''}</td>
        <td style="padding:6px 8px;font-size:11px;text-align:right;font-weight:800;color:${val < 0 ? '#e11d48' : (val > 0 ? '#059669' : '#475569')};">${val < 0 ? '-' : (val > 0 ? '+' : '')}${fCur(Math.abs(val))}</td>
        <td style="padding:6px 8px;font-size:10.5px;color:#475569;">${reasonNames[it.reason] || it.reason || '-'}${it.note ? `<br/><i style="font-size:9.5px;">${it.note}</i>` : ''}</td>
      </tr>
    `;
  }).join('');

  const h = `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:24px;color:#0f172a;max-width:850px;margin:0 auto;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h2 style="font-size:16px;font-weight:900;margin:0;text-transform:uppercase;color:#0f172a;">${appData.store?.name || 'TOKO GRAFIKA'}</h2>
          <p style="font-size:10.5px;color:#64748b;margin:2px 0 0 0;">${appData.store?.address || 'Alamat Toko'}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:14px;font-weight:900;color:#0891b2;margin:0;text-transform:uppercase;">BERITA ACARA STOK OPNAME</h3>
          <p style="font-size:10px;color:#64748b;margin:2px 0 0 0;">Dicetak: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="padding:10px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
          <span style="font-size:10px;color:#64748b;display:block;text-transform:uppercase;font-weight:700;">Total Audit</span>
          <b style="font-size:14px;color:#0f172a;">${appData.stockOpname.length} Penyesuaian</b>
        </div>
        <div style="padding:10px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
          <span style="font-size:10px;color:#64748b;display:block;text-transform:uppercase;font-weight:700;">Total Selisih Fisik</span>
          <b style="font-size:14px;color:${totalDiffUnits < 0 ? '#e11d48' : '#059669'};">${totalDiffUnits > 0 ? '+' : ''}${totalDiffUnits} Unit</b>
        </div>
        <div style="padding:10px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;">
          <span style="font-size:10px;color:#64748b;display:block;text-transform:uppercase;font-weight:700;">Total Nilai Selisih (HPP)</span>
          <b style="font-size:14px;color:${totalDiffVal < 0 ? '#e11d48' : '#059669'};">${totalDiffVal < 0 ? '-' : (totalDiffVal > 0 ? '+' : '')}${fCur(Math.abs(totalDiffVal))}</b>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1;font-size:10.5px;text-transform:uppercase;color:#475569;">
            <th style="padding:8px;text-align:left;">No</th>
            <th style="padding:8px;text-align:left;">Waktu & Petugas</th>
            <th style="padding:8px;text-align:left;">Nama Produk & Varian</th>
            <th style="padding:8px;text-align:center;">Sistem ➔ Fisik</th>
            <th style="padding:8px;text-align:center;">Selisih</th>
            <th style="padding:8px;text-align:right;">Nilai Rp HPP</th>
            <th style="padding:8px;text-align:left;">Alasan & Ket.</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div style="display:flex;justify-content:space-between;margin-top:32px;page-break-inside:avoid;">
        <div style="text-align:center;width:180px;">
          <p style="font-size:11px;font-weight:700;margin-bottom:50px;">Petugas Penghitung Fisik,</p>
          <div style="border-bottom:1px solid #000;margin-bottom:4px;"></div>
          <p style="font-size:10.5px;color:#64748b;margin:0;">( Petugas Toko )</p>
        </div>
        <div style="text-align:center;width:180px;">
          <p style="font-size:11px;font-weight:700;margin-bottom:50px;">Disetujui / Diverifikasi,</p>
          <div style="border-bottom:1px solid #000;margin-bottom:4px;"></div>
          <p style="font-size:10.5px;color:#64748b;margin:0;">( Kepala Toko / Owner )</p>
        </div>
      </div>
    </div>
  `;

  let printEl = document.getElementById('report-print-section');
  if (!printEl) {
    printEl = document.createElement('div');
    printEl.id = 'report-print-section';
    document.body.appendChild(printEl);
  }
  printEl.innerHTML = h;

  document.body.classList.add('print-mode-report');
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-report');
    }, 1000);
  }, 150);
};

const rAdmOrd = () => {
  setH('admin-content', `
    <div class="space-y-4 pb-12">
      ${window.getTabHelpBanner ? window.getTabHelpBanner('orders') : ''}
      <div class="flex justify-between items-center px-1">
        <h2 class="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span>Daftar Pesanan Online</span>
          <i class="fa-solid fa-satellite-dish animate-pulse text-emerald-500"></i>
        </h2>
      </div>
      
      <div id="admin-orders-list" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="col-span-full text-center py-12"><i class="fa-solid fa-spinner fa-spin text-2xl text-emerald-500"></i></div>
      </div>
    </div>
  `);

  const s = () => {
    if (aOrdLst) { aOrdLst(); aOrdLst = null; }
    
    aOrdLst = db.collection("freshmart_orders").orderBy("timestamp", "desc").limit(50).onSnapshot(p => {
      gOrds = [];
      if (p.empty) {
        setH('admin-orders-list', `<div class="col-span-full text-center py-16 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm"><i class="fa-solid fa-receipt text-4xl mb-3 opacity-40 block"></i>Belum ada pesanan</div>`);
        setIn('stat-orders', 0);
        return;
      }
      setIn('stat-orders', p.size + (p.size >= 50 ? '+' : ''));

      let orderHtml = '';

      p.docs.forEach(d => {
        const o = d.data(); gOrds.push(o);
        
        let bC = "text-slate-500 border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-600"; 
        let iC = "fa-clock";
        if (o.status === 'Baru') { bC = "text-rose-500 border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 animate-pulse"; iC = "fa-asterisk"; }
        else if (o.status === 'Diproses') { bC = "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"; iC = "fa-spinner fa-spin"; }
        else if (o.status === 'Selesai') { bC = "text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800"; iC = "fa-check-double"; }
        else if (o.status === 'Dibatalkan') { bC = "text-slate-400 border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700"; iC = "fa-xmark"; }
        
        let pI = "fa-wallet"; 
        let method = o.payment?.method || '';
        if (method === 'transfer') pI = "fa-building-columns"; 
        else if (method === 'qris') pI = "fa-qrcode"; 
        else if (method === 'cod') pI = "fa-hand-holding-dollar"; 
        else if (method === 'cashier') pI = "fa-cash-register";
        
        let itemCount = o.items ? o.items.reduce((sum, item) => sum + item.qty, 0) : 0;
        const dStr = o.dateString ? new Date(o.dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        
        orderHtml += `
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative group flex flex-col gap-4 overflow-hidden" onclick="openOrderDetail('${o.orderId}')">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 dark:bg-slate-700/30 rounded-full blur-2xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors pointer-events-none"></div>
          <button onclick="event.stopPropagation(); deleteOrder('${o.orderId}')" title="Hapus Pesanan" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all z-20 shadow-sm">
            <i class="fa-solid fa-trash text-[10px]"></i>
          </button>
          <div class="flex items-start justify-between pr-10 relative z-10">
            <div class="flex flex-col">
              <div class="flex items-center gap-2 mb-1">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shrink-0">
                  <i class="fa-solid fa-receipt text-sm"></i>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-none">#${o.orderId}</h3>
              </div>
              <p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 ml-10">
                <i class="fa-regular fa-clock"></i> ${dStr}
              </p>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700 flex flex-col gap-3 relative z-10">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm shrink-0 border border-slate-200 dark:border-slate-700">
                  <i class="fa-solid fa-user text-[10px]"></i>
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">${esc(o.customer?.name || 'Anonim')}</p>
                  <p class="text-[9px] text-slate-500 dark:text-slate-400 truncate">${esc(o.customer?.address || 'Ambil di Toko')}</p>
                </div>
              </div>
              <div class="shrink-0 text-right">
                <div class="badge ${bC}">
                  <i class="fa-solid ${iC}"></i> ${esc(o.status)}
                </div>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
              <span class="badge badge-xs badge-slate badge-normal-case">
                <i class="fa-solid fa-box text-emerald-500"></i> ${itemCount} Item
              </span>
              <span class="badge badge-xs badge-slate">
                <i class="fa-solid ${pI} text-emerald-600 dark:text-emerald-400"></i> ${esc(method)}
              </span>
              ${o.customer?.note ? `<span class="badge badge-xs badge-amber badge-normal-case max-w-[120px] truncate"><i class="fa-solid fa-note-sticky shrink-0"></i> <span class="truncate">${esc(o.customer.note)}</span></span>` : ''}
            </div>
          </div>
          <div class="flex items-end justify-between mt-auto relative z-10 pt-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Belanja</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400 text-xl leading-none drop-shadow-sm">${fCur(o.payment?.grandTotal)}</span>
          </div>
        </div>
        `;
      });
      
      setH('admin-orders-list', orderHtml);
    }, e => {
      setH('admin-orders-list', `<div class="col-span-full text-center text-rose-500 font-bold">Koneksi terputus. Retrying...</div>`);
      setTimeout(s, 5000);
    });
  }; 
  s();
};

window.openOrderDetail = i => {
  const o = gOrds.find(x => x.orderId === i);
  if (!o) return;
  cVOrd = i;
  
  let sSel = `
  <div class="relative w-full">
    <select onchange="updateOrderStatus('${o.orderId}', this.value)" class="w-full text-xs font-semibold ${o.status === 'Baru' ? 'text-rose-600 bg-rose-50 border-rose-300' : o.status === 'Diproses' ? 'text-amber-600 bg-amber-50 border-amber-300' : o.status === 'Selesai' ? 'text-emerald-600 bg-emerald-50 border-emerald-300' : 'text-slate-500 bg-slate-50 border-slate-300'} border-2 px-3 py-2.5 rounded-xl focus:border-emerald-500 outline-none appearance-none cursor-pointer transition-colors">
      <option value="Baru" ${o.status === 'Baru' ? 'selected' : ''} class="text-slate-800 font-bold">Baru (Pending)</option>
      <option value="Diproses" ${o.status === 'Diproses' ? 'selected' : ''} class="text-slate-800 font-bold">Diproses</option>
      <option value="Selesai" ${o.status === 'Selesai' ? 'selected' : ''} class="text-slate-800 font-bold">Selesai</option>
      <option value="Dibatalkan" ${o.status === 'Dibatalkan' ? 'selected' : ''} class="text-slate-800 font-bold">Dibatalkan</option>
    </select>
    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
  </div>
  `;

  setH('admin-order-modal-content', `
  <div class="flex flex-col gap-3 text-xs">
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-2 gap-3">
      <div>
        <p class="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><i class="fa-solid fa-spinner fa-spin-pulse text-emerald-500"></i> Status</p>
        ${sSel}
      </div>
      <div class="text-right flex flex-col justify-center">
        <p class="text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">ID Pesanan</p>
        <p class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white break-all">#${o.orderId}</p>
        <p class="text-[9px] font-bold text-slate-400 mt-0.5">${o.dateString ? new Date(o.dateString).toLocaleString('id-ID') : ''}</p>
      </div>
    </div>
    
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
      <div class="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10"></div>
      <h4 class="font-bold text-slate-800 dark:text-white text-xs border-b border-slate-100 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/30"><i class="fa-solid fa-user"></i></div> Data Pemesan
      </h4>
      <div class="space-y-2">
        <div class="flex justify-between items-center"><span class="text-slate-500 dark:text-slate-400 font-bold">Nama</span><span class="font-bold text-slate-800 dark:text-white">${esc(o.customer?.name || '-')}</span></div>
        <div class="mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
          <span class="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mb-1.5"><i class="fa-solid fa-map-location-dot"></i> Alamat Pengiriman</span>
          <div class="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 leading-relaxed">${esc(o.customer?.address || '-')}</div>
        </div>
        ${o.customer?.note ? `<div class="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 mt-2"><p class="text-[8px] font-medium text-amber-600 uppercase tracking-widest mb-0.5"><i class="fa-solid fa-note-sticky"></i> Catatan</p><p class="text-xs text-amber-900 dark:text-amber-100 font-bold">${esc(o.customer.note)}</p></div>` : ''}
      </div>
    </div>
    
    <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
      <div class="absolute top-0 right-0 w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10"></div>
      <h4 class="font-bold text-slate-800 dark:text-white text-xs border-b border-slate-100 dark:border-slate-700 pb-2 mb-3 flex items-center gap-2">
        <div class="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/30"><i class="fa-solid fa-box-open"></i></div> Rincian Item
      </h4>
      <div class="space-y-2.5">
      ${o.items.map(t => `
        <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-500 shrink-0"><i class="fa-solid fa-tag text-xs"></i></div>
            <div>
              <p class="font-semibold text-xs text-slate-800 dark:text-white">${esc(t.name)} ${t.variantName ? `<span class="badge badge-xs badge-slate badge-normal-case ml-1">${esc(t.variantName)}</span>` : ''}</p>
              <p class="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">${t.qty}${t.unit ? ' '+t.unit : ''} × ${fCur(t.effectivePrice)}</p>
            </div>
          </div>
          <div class="font-semibold text-xs text-slate-900 dark:text-white ml-2">${fCur(t.effectivePrice * t.qty)}</div>
        </div>
      `).join('')}
      </div>
    </div>
    
    <div class="bg-slate-900 dark:bg-[#020617] p-5 rounded-xl text-white shadow-lg border border-slate-800 relative overflow-hidden">
      <div class="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl"></div>
      <h4 class="font-medium text-[10px] uppercase tracking-widest border-b border-slate-700 pb-2 mb-3 text-slate-300 flex items-center gap-1.5">
        <i class="fa-solid fa-wallet text-emerald-400"></i> Pembayaran 
        <span class="badge badge-xs ml-auto" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.15)">${esc(o.payment?.method || '').toUpperCase()}</span>
      </h4>
      <div class="space-y-1.5 font-medium">
        <div class="flex justify-between text-slate-300"><span>Subtotal Produk</span><span>${fCur(o.payment?.subtotal)}</span></div>
        ${o.payment?.productDiscount ? `<div class="flex justify-between text-emerald-400"><span>Diskon Produk</span><span>-${fCur(o.payment.productDiscount)}</span></div>` : ''}
        ${o.customer?.deliveryMethod === 'delivery' ? `<div class="flex justify-between text-slate-300"><span>Ongkos Kirim</span><span>${fCur(o.payment?.shippingCost)}</span></div>` : ''}
        ${o.payment?.shippingDiscount ? `<div class="flex justify-between text-emerald-400"><span>Diskon Ongkir</span><span>-${fCur(o.payment.shippingDiscount)}</span></div>` : ''}
      </div>
      <div class="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-slate-700">
        <span class="text-xs font-semibold text-slate-200">Total Tagihan</span>
        <span class="text-lg font-bold text-emerald-400">${fCur(o.payment?.grandTotal)}</span>
      </div>
    </div>

    <!-- Hub Cetak Dokumen Pesanan (Supermarket POS & Bisnis) -->
    <div class="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <i class="fa-solid fa-print"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 dark:text-white text-xs">Cetak Dokumen Pesanan</h4>
            <p class="text-[10px] text-slate-400 font-medium">Pilih format cetak struk kasir atau dokumen A4</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <!-- Tombol 1: Struk Kasir Thermal -->
        <button type="button" onclick="openReceiptPreview()" class="p-3.5 rounded-xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 hover:border-emerald-400 transition-all text-left flex flex-col justify-between gap-2.5 group active:scale-95 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-receipt"></i>
            </div>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">POS</span>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-white leading-tight">Struk Kasir</div>
            <div class="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">Thermal 58 / 80mm</div>
          </div>
        </button>

        <!-- Tombol 2: Invoice Tagihan A4 -->
        <button type="button" onclick="generateA4Document('invoice')" class="p-3.5 rounded-xl border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 hover:border-blue-400 transition-all text-left flex flex-col justify-between gap-2.5 group active:scale-95 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs shadow-sm group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-file-invoice"></i>
            </div>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-blue-200/80 dark:bg-blue-800/60 text-blue-800 dark:text-blue-200 uppercase tracking-wider">PDF A4</span>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-white leading-tight">Faktur / Invoice</div>
            <div class="text-[10px] text-blue-700 dark:text-blue-300 font-semibold mt-0.5">Tagihan Resmi Bisnis</div>
          </div>
        </button>

        <!-- Tombol 3: Surat Jalan A4 -->
        <button type="button" onclick="generateA4Document('surat-jalan')" class="p-3.5 rounded-xl border-2 border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 hover:border-rose-400 transition-all text-left flex flex-col justify-between gap-2.5 group active:scale-95 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center text-xs shadow-sm group-hover:scale-110 transition-transform">
              <i class="fa-solid fa-truck"></i>
            </div>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-200/80 dark:bg-rose-800/60 text-rose-800 dark:text-rose-200 uppercase tracking-wider">PDF A4</span>
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-white leading-tight">Surat Jalan</div>
            <div class="text-[10px] text-rose-700 dark:text-rose-300 font-semibold mt-0.5">Ekspedisi & Logistik</div>
          </div>
        </button>
      </div>
    </div>
  </div>
  `);
  
  show('admin-order-modal');
  setTimeout(() => {
    el('admin-order-modal').classList.remove('opacity-0');
    el('admin-order-modal-box').classList.remove('scale-95');
  }, 10);
};

window.closeOrderDetailModal = () => { 
  const modal = el('admin-order-modal'); 
  const box = el('admin-order-modal-box'); 
  if (!modal || !box) return; 
  modal.classList.add('opacity-0'); 
  box.classList.add('scale-95'); 
  setTimeout(() => hide('admin-order-modal'), 300);
};

window.updateOrderStatus = async (i, s) => {
  if (isSaving) return;
  isSaving = !0;
  sLoad('Update Status...');
  try {
    await db.collection("freshmart_orders").doc(i).update({ status: s });
    showToast("Status diupdate!");
  } catch (e) {
    showToast("Gagal update!");
  }
  isSaving = !1;
  hLoad();
};

window.deleteOrder = i => {
  showConfirm("Hapus Pesanan", "Yakin ingin menghapus pesanan ini?", async () => {
    if (isSaving) return;
    isSaving = !0;
    sLoad('Menghapus...');
    try {
      await db.collection("freshmart_orders").doc(i).delete();
      showToast("Pesanan dihapus!");
      if (cVOrd === i) closeOrderDetailModal();
    } catch (e) {
      showToast("Gagal menghapus!");
    }
    isSaving = !1;
    hLoad();
  });
};

const rAdmSet = () => {
  setH('admin-content', `
  <div class="space-y-6 w-full pb-12">
    ${window.getTabHelpBanner ? window.getTabHelpBanner('settings') : ''}

    <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      
      <h3 class="font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4 flex items-center gap-3 text-base sm:text-lg">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center"><i class="fa-solid fa-store"></i></div>
        Informasi Dasar Toko
      </h3>
      
      <div class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-tag text-emerald-500 mr-1"></i> Nama Toko</label>
            <input id="set-name" value="${esc(appData.store.name)}" class="admin-input !py-3 w-full" placeholder="Contoh: Toko Maju Jaya"/>
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-bullhorn text-emerald-500 mr-1"></i> Slogan</label>
            <input id="set-slogan" value="${esc(appData.store.slogan)}" class="admin-input !py-3 w-full" placeholder="Contoh: Murah dan Lengkap"/>
          </div>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-brands fa-whatsapp text-emerald-500 mr-1"></i> WhatsApp Admin</label>
            <input id="set-wa" value="${esc(appData.store.wa)}" class="admin-input !py-3 w-full" placeholder="Contoh: 08123456789"/>
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-shoe-prints text-emerald-500 mr-1"></i> Teks Footer Struk/Web</label>
            <input id="set-footer-text" value="${esc(appData.store.footerText || '')}" class="admin-input !py-3 w-full" placeholder="Terima kasih telah berbelanja..."/>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-image text-emerald-500 mr-1"></i> Logo Toko (URL / Icon Class)</label>
          <div class="flex gap-2">
            <input id="set-logo" value="${esc(appData.store.logo)}" class="admin-input flex-1 !py-3" placeholder="https://... atau fa-store" />
            <label onclick="if(window.AppInventor){ event.preventDefault(); window.AppInventor.setWebViewString('BUKA_GALERI|||set-logo|||null'); }" class="bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl px-5 flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:text-emerald-500 transition-all shrink-0 font-bold text-xs gap-2 shadow-sm">
              <i class="fa-solid fa-cloud-arrow-up"></i> <span class="hidden sm:inline">Upload</span>
              <input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(this, 'set-logo')" />
            </label>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-map-location-dot text-emerald-500 mr-1"></i> Alamat Lengkap Toko</label>
          <textarea id="set-address" class="admin-input resize-none !py-3 w-full leading-relaxed" rows="2" placeholder="Jl. Raya No 1...">${esc(appData.store.address)}</textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-coins text-emerald-500 mr-1"></i> Ongkir per KM (Rp)</label>
            <input type="number" id="set-cost" value="${appData.store.costPerKm || 0}" class="admin-input !py-3 w-full" />
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-motorcycle text-emerald-500 mr-1"></i> Layanan Kurir</label>
            <div class="relative">
              <select id="set-delivery-enabled" class="admin-input cursor-pointer !py-3 appearance-none w-full font-bold">
                <option value="true" ${appData.store.isDeliveryEnabled !== !1 ? 'selected' : ''}>Aktif</option>
                <option value="false" ${appData.store.isDeliveryEnabled === !1 ? 'selected' : ''}>Nonaktif</option>
              </select>
              <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-person-walking text-emerald-500 mr-1"></i> Ambil di Toko</label>
            <div class="relative">
              <select id="set-pickup-enabled" class="admin-input cursor-pointer !py-3 appearance-none w-full font-bold">
                <option value="true" ${appData.store.isPickupEnabled !== !1 ? 'selected' : ''}>Aktif</option>
                <option value="false" ${appData.store.isPickupEnabled === !1 ? 'selected' : ''}>Nonaktif</option>
              </select>
              <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
            </div>
          </div>
        </div>

        <div class="bg-amber-50 dark:bg-amber-900/10 p-5 sm:p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800/30 mt-6 relative overflow-hidden">
          <i class="fa-solid fa-map-pin absolute -bottom-5 -right-5 text-8xl text-amber-500/10 rotate-[20deg] pointer-events-none"></i>
          <h4 class="font-bold text-amber-700 dark:text-amber-500 mb-4 uppercase tracking-widest flex items-center gap-2 text-xs">
            <i class="fa-solid fa-location-crosshairs text-amber-500"></i> Koordinat GPS (Titik Toko)
          </h4>
          <div class="space-y-4 relative z-10">
            <input id="set-coords" onchange="autoParseCoords(this)" class="admin-input bg-white dark:bg-[#0f172a] !border-amber-300 dark:!border-amber-700/50 !py-3 w-full focus:!border-amber-500" placeholder="Paste Lat,Lng dari Google Maps di sini..." />
            <div class="grid grid-cols-2 gap-4">
              <input id="set-lat" value="${appData.store.lat}" class="admin-input text-xs font-mono bg-amber-100/50 dark:bg-[#0f172a]/50 !border-amber-200 dark:!border-amber-800/30 !py-3 w-full" readonly="readonly" placeholder="Latitude" />
              <input id="set-lng" value="${appData.store.lng}" class="admin-input text-xs font-mono bg-amber-100/50 dark:bg-[#0f172a]/50 !border-amber-200 dark:!border-amber-800/30 !py-3 w-full" readonly="readonly" placeholder="Longitude" />
            </div>
          </div>
        </div>

        <!-- Pengaturan Mode Manajemen Stok Toko & POS Kasir -->
        <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mt-4">
          <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
            <i class="fa-solid fa-boxes-stacked text-emerald-500 mr-1"></i> Mode Manajemen Stok Toko & POS Kasir
          </label>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3 leading-relaxed">Tentukan apakah toko membatasi penjualan sesuai jumlah stok barang nyata atau mengizinkan transaksi bebas tanpa batas stok (Unlimited Stock).</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${appData.store.stockMode !== 'unlimited' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
              <input type="radio" name="store-stock-mode" value="tracked" ${appData.store.stockMode !== 'unlimited' ? 'checked' : ''} onchange="appData.store.stockMode='tracked'" class="text-emerald-600 focus:ring-emerald-500" />
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><i class="fa-solid fa-box-archive text-emerald-500"></i> Mode Catat Stok (Ketat)</div>
                <div class="text-[10px] text-slate-400">Transaksi memotong stok & dibatasi jika stok 0 / habis.</div>
              </div>
            </label>
            <label class="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${appData.store.stockMode === 'unlimited' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
              <input type="radio" name="store-stock-mode" value="unlimited" ${appData.store.stockMode === 'unlimited' ? 'checked' : ''} onchange="appData.store.stockMode='unlimited'" class="text-emerald-600 focus:ring-emerald-500" />
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><i class="fa-solid fa-infinity text-cyan-500"></i> Mode Bebas Stok (Unlimited)</div>
                <div class="text-[10px] text-slate-400">Transaksi selalu bisa dilakukan bebas tanpa batasan stok.</div>
              </div>
            </label>
          </div>
        <!-- Pengaturan Ukuran Printer Struk Kasir (58mm / 80mm) -->
        <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mt-4 space-y-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
              <i class="fa-solid fa-print text-emerald-500 mr-1"></i> Ukuran Kertas Printer Struk Thermal Kasir
            </label>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">Pilih ukuran lebar kertas printer thermal default yang digunakan toko untuk mencetak struk kasir & pesanan.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${appData.store.printerPaper !== '80' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="store-printer-paper" value="58" ${appData.store.printerPaper !== '80' ? 'checked' : ''} onchange="appData.store.printerPaper='58'; try{localStorage.setItem('freshmart_printer_paper','58');}catch(e){}" class="text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <div class="text-xs font-bold text-slate-800 dark:text-white">Printer 58mm (Kecil / Portabel)</div>
                  <div class="text-[10px] text-slate-400">Standar 30/32 Kolom (Bluetooth mini kasir)</div>
                </div>
              </label>
              <label class="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${appData.store.printerPaper === '80' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="store-printer-paper" value="80" ${appData.store.printerPaper === '80' ? 'checked' : ''} onchange="appData.store.printerPaper='80'; try{localStorage.setItem('freshmart_printer_paper','80');}catch(e){}" class="text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <div class="text-xs font-bold text-slate-800 dark:text-white">Printer 80mm (Besar / Standar POS)</div>
                  <div class="text-[10px] text-slate-400">Standar 42/48 Kolom (Desktop POS / Kasir Resto & Minimarket)</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Posisi Perataan Struk (Tengah Pas / Rata Kiri) -->
          <div class="pt-3 border-t border-slate-200/80 dark:border-slate-700">
            <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">
              <i class="fa-solid fa-align-center text-emerald-500 mr-1"></i> Posisi Perataan Struk di Kertas Thermal
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label class="flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${(appData.store.receiptAlignment !== 'left') ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="store-receipt-align" value="center" ${(appData.store.receiptAlignment !== 'left') ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <div class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1"><span class="text-emerald-500">🎯</span> Posisi Tengah Pas (Simetris)</div>
                  <div class="text-[10px] text-slate-400">Rekomendasi untuk semua printer thermal roll</div>
                </div>
              </label>
              <label class="flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${appData.store.receiptAlignment === 'left' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="store-receipt-align" value="left" ${appData.store.receiptAlignment === 'left' ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <div class="text-xs font-bold text-slate-800 dark:text-white">Rata Kiri Penuh (Flush Left)</div>
                  <div class="text-[10px] text-slate-400">Untuk printer dengan margin driver lebar</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Pengaturan Format & Panjang Struk Kasir (Header & Footer) -->
        <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 mt-4 space-y-4">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">
              <i class="fa-solid fa-receipt text-emerald-500 mr-1"></i> Format Panjang Struk Kasir (Header & Footer)
            </label>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3">Pilih format panjang struk agar hemat kertas thermal dan tidak terlalu panjang saat dicetak.</p>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label class="flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${appData.store.receiptLayoutMode === 'full' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="store-receipt-mode" value="full" ${appData.store.receiptLayoutMode === 'full' ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <div class="text-xs font-bold text-slate-800 dark:text-white">Format Lengkap</div>
                  <div class="text-[10px] text-slate-400">Header komplit, barcode & catatan</div>
                </div>
              </label>
              <label class="flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${(appData.store.receiptLayoutMode === 'compact' || !appData.store.receiptLayoutMode) ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="store-receipt-mode" value="compact" ${(appData.store.receiptLayoutMode === 'compact' || !appData.store.receiptLayoutMode) ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <div class="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1"><span class="text-amber-500">⚡</span> Ringkas (Rekomendasi)</div>
                  <div class="text-[10px] text-slate-400">Header padat, hemat kertas ~40%</div>
                </div>
              </label>
              <label class="flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all bg-white dark:bg-slate-800 ${appData.store.receiptLayoutMode === 'minimal' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="store-receipt-mode" value="minimal" ${appData.store.receiptLayoutMode === 'minimal' ? 'checked' : ''} class="text-emerald-600 focus:ring-emerald-500" />
                <div>
                  <div class="text-xs font-bold text-slate-800 dark:text-white">Super Pendek (Eco)</div>
                  <div class="text-[10px] text-slate-400">Hanya nama toko, item & total</div>
                </div>
              </label>
            </div>
          </div>

          <!-- Opsi Toggle Rinci Elemen Struk -->
          <div class="pt-3 border-t border-slate-200/80 dark:border-slate-700">
            <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">Kustomisasi Elemen Header & Footer Struk:</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input type="checkbox" id="set-receipt-show-slogan" ${appData.store.receiptShowSlogan === true ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                <span class="font-medium text-slate-700 dark:text-slate-300">Tampilkan Slogan Toko</span>
              </label>
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input type="checkbox" id="set-receipt-show-address" ${appData.store.receiptShowAddress !== false ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                <span class="font-medium text-slate-700 dark:text-slate-300">Tampilkan Alamat Toko</span>
              </label>
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input type="checkbox" id="set-receipt-show-wa" ${appData.store.receiptShowWa !== false ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                <span class="font-medium text-slate-700 dark:text-slate-300">Tampilkan No. Telp/WA</span>
              </label>
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input type="checkbox" id="set-receipt-show-barcode" ${appData.store.receiptShowBarcode === true ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                <span class="font-medium text-slate-700 dark:text-slate-300">Tampilkan Garis Barcode Visual</span>
              </label>
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input type="checkbox" id="set-receipt-show-notes" ${appData.store.receiptShowNotes === true ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                <span class="font-medium text-slate-700 dark:text-slate-300">Tampilkan Catatan Pengembalian</span>
              </label>
              <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input type="checkbox" id="set-receipt-show-powered" ${appData.store.receiptShowPowered !== false ? 'checked' : ''} class="rounded text-emerald-600 focus:ring-emerald-500" />
                <span class="font-medium text-slate-700 dark:text-slate-300">Tampilkan "Powered by"</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      
      <h3 class="font-bold text-slate-800 dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-700 pb-4 flex items-center gap-3 text-base sm:text-lg">
        <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><i class="fa-solid fa-palette"></i></div>
        Tema & Visual Aplikasi
      </h3>
      
      <div class="space-y-6">
        <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-widest text-center">Pilih Warna Utama (Branding)</label>
          <div class="flex flex-wrap justify-center gap-3.5">
          ${[
            { id: 'emerald', hex: '#10b981', name: 'Emerald' },
            { id: 'teal', hex: '#14b8a6', name: 'Teal' },
            { id: 'cyan', hex: '#06b6d4', name: 'Cyan' },
            { id: 'sky', hex: '#0ea5e9', name: 'Sky Blue' },
            { id: 'blue', hex: '#3b82f6', name: 'Royal Blue' },
            { id: 'indigo', hex: '#6366f1', name: 'Indigo' },
            { id: 'violet', hex: '#8b5cf6', name: 'Violet' },
            { id: 'purple', hex: '#a855f7', name: 'Purple' },
            { id: 'pink', hex: '#ec4899', name: 'Pink' },
            { id: 'rose', hex: '#f43f5e', name: 'Rose' },
            { id: 'red', hex: '#ef4444', name: 'Ruby Red' },
            { id: 'orange', hex: '#f97316', name: 'Orange' },
            { id: 'amber', hex: '#f59e0b', name: 'Amber Gold' },
            { id: 'lime', hex: '#84cc16', name: 'Lime' }
          ].map(t => `
            <button type="button" onclick="setTempTheme('${t.id}')" title="${t.name}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-4 transition-all hover:scale-110 focus:outline-none ${appData.store.themeColor === t.id || (!appData.store.themeColor && t.id === 'emerald') ? 'border-slate-800 dark:border-white scale-125 shadow-lg' : 'border-white dark:border-slate-800 shadow-sm'}" style="background-color: ${t.hex};" id="btn-theme-${t.id}"></button>
          `).join('')}
          </div>
          <input type="hidden" id="set-theme-color" value="${esc(appData.store.themeColor || 'emerald')}" />
        </div>

        <!-- Background Style Picker (Storefront & CMS - Crisp & Sharp) -->
        <div class="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <i class="fa-solid fa-shapes text-emerald-500 mr-1"></i> Gaya Background Toko & CMS (Tajam & Nyata)
            </label>
            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Non-Blur</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-3.5 leading-relaxed">Pilih gaya visual background yang tegas, tajam, dan tidak blur agar toko dan CMS terlihat berkelas seperti aplikasi profesional.</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
          ${[
            { id: 'hero-arch', name: 'Hero Arch', desc: 'Header lengkung solid', icon: 'fa-solid fa-cloud' },
            { id: 'geometric-poly', name: 'Geometris 3D', desc: 'Vektor sudut presisi', icon: 'fa-solid fa-cube' },
            { id: 'diagonal-accent', name: 'Diagonal Skew', desc: 'Aksen garis tegas', icon: 'fa-solid fa-slash' },
            { id: 'dual-tone', name: 'Dual-Tone', desc: 'Header solid 2 warna', icon: 'fa-solid fa-layer-group' },
            { id: 'solid-clean', name: 'Minimalis', desc: 'Polos bersih elegan', icon: 'fa-solid fa-square' }
          ].map(bg => {
            const currentBg = appData.store.bgStyle || 'hero-arch';
            const isActive = currentBg === bg.id || (currentBg === 'mesh-aurora' && bg.id === 'hero-arch');
            return `
            <button type="button" onclick="setTempBgStyle('${bg.id}')" id="btn-bg-style-${bg.id}" class="p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-1.5 bg-white dark:bg-slate-800 ${isActive ? 'border-emerald-600 ring-2 ring-emerald-500 shadow-md scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'}">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">
                <i class="${bg.icon}"></i>
              </div>
              <span class="text-xs font-bold text-slate-800 dark:text-white leading-tight">${bg.name}</span>
              <span class="text-[9px] text-slate-400 font-medium leading-tight">${bg.desc}</span>
            </button>
            `;
          }).join('')}
          </div>
          <input type="hidden" id="set-bg-style" value="${esc(appData.store.bgStyle || 'hero-arch')}" />

          <!-- Custom Wallpaper Image Upload -->
          <div class="pt-3 border-t border-slate-200 dark:border-slate-700">
            <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
              <i class="fa-solid fa-image text-indigo-500 mr-1"></i> Gambar / Wallpaper Background Kustom (Opsional)
            </label>
            <div class="flex gap-2">
              <input id="set-bg-image" value="${esc(appData.store.bgImage || '')}" oninput="previewBgImage(this.value)" class="admin-input flex-1 !py-2.5 text-xs" placeholder="URL Gambar Background (Opsional, contoh: https://...)" />
              <label onclick="if(window.AppInventor){ event.preventDefault(); window.AppInventor.setWebViewString('BUKA_GALERI|||set-bg-image|||null'); }" class="bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl px-4 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition-all shrink-0 font-bold text-xs gap-1.5 shadow-sm">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload
                <input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(this, 'set-bg-image')" />
              </label>
            </div>
            <p class="text-[10px] text-slate-400 mt-1.5">Jika diisi, gambar akan otomatis terpasang tajam dan jernih sebagai wallpaper latar belakang toko dan CMS.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-list-ul text-emerald-600 mr-1"></i> Desain Menu Kategori</label>
            <div class="relative">
              <select id="set-category-style" class="admin-input cursor-pointer !py-3 appearance-none w-full font-bold">
                <option value="image" ${appData.store.categoryStyle === 'image' || !appData.store.categoryStyle ? 'selected' : ''}>Kartu Ikon Squircle Visual (E-Commerce)</option>
                <option value="text" ${appData.store.categoryStyle === 'text' || appData.store.categoryStyle === 'chips' ? 'selected' : ''}>Pill Chips Modern (+ Jumlah Produk)</option>
                <option value="grid" ${appData.store.categoryStyle === 'grid' ? 'selected' : ''}>Grid Menu 2 Baris (Ala App Mobile)</option>
              </select>
              <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-icons text-emerald-600 mr-1"></i> Ikon "Semua Produk"</label>
            <div class="flex gap-2">
              <input id="set-all-cat-icon" value="${esc(appData.store.allProductsIcon || '')}" class="admin-input flex-1 !py-3" placeholder="URL Gambar Ikon" />
              <label onclick="if(window.AppInventor){ event.preventDefault(); window.AppInventor.setWebViewString('BUKA_GALERI|||set-all-cat-icon|||null'); }" class="bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl px-5 flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:text-emerald-600 transition-all shrink-0 font-bold text-xs gap-2 shadow-sm">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(this, 'set-all-cat-icon')" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-32 h-32 bg-purple-50 dark:bg-purple-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      
      <h3 class="font-bold text-slate-800 dark:text-white mb-2 border-b-2 border-slate-100 dark:border-slate-700 pb-4 flex items-center gap-3 text-base sm:text-lg">
        <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center"><i class="fa-solid fa-share-nodes"></i></div>
        Tautan Media Sosial
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">Kosongkan kolom jika Anda tidak ingin menampilkan ikon media sosial tersebut di footer toko.</p>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div class="relative">
          <i class="fa-brands fa-facebook absolute left-4 top-[38px] text-[#1877f2] text-lg"></i>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Facebook</label>
          <input type="text" id="set-soc-fb" value="${esc(appData.store.social?.fb || '')}" class="admin-input !py-3 !pl-12 w-full" placeholder="https://facebook.com/..." />
        </div>
        <div class="relative">
          <i class="fa-brands fa-instagram absolute left-4 top-[38px] text-[#e1306c] text-lg"></i>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Instagram</label>
          <input type="text" id="set-soc-ig" value="${esc(appData.store.social?.ig || '')}" class="admin-input !py-3 !pl-12 w-full" placeholder="https://instagram.com/..." />
        </div>
        <div class="relative">
          <i class="fa-brands fa-tiktok absolute left-4 top-[38px] text-slate-800 dark:text-white text-lg"></i>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">TikTok</label>
          <input type="text" id="set-soc-tt" value="${esc(appData.store.social?.tt || '')}" class="admin-input !py-3 !pl-12 w-full" placeholder="https://tiktok.com/@..." />
        </div>
        <div class="relative">
          <i class="fa-brands fa-youtube absolute left-4 top-[38px] text-[#ff0000] text-lg"></i>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">YouTube</label>
          <input type="text" id="set-soc-yt" value="${esc(appData.store.social?.yt || '')}" class="admin-input !py-3 !pl-12 w-full" placeholder="https://youtube.com/..." />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
        <h3 class="font-bold text-slate-800 dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-700 pb-4 flex items-center gap-3 text-base">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center"><i class="fa-solid fa-qrcode"></i></div>
          QRIS Payment
        </h3>
        <div>
          <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Gambar Barcode QRIS</label>
          <div class="flex gap-2">
            <input id="set-qris-url" value="${esc(appData.payment.qrisUrl)}" class="admin-input flex-1 !py-3" placeholder="URL Gambar" />
            <label onclick="if(window.AppInventor){ event.preventDefault(); window.AppInventor.setWebViewString('BUKA_GALERI|||set-qris-url|||null'); }" class="bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl px-4 flex items-center justify-center cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition-all shrink-0 font-bold shadow-sm">
              <i class="fa-solid fa-upload"></i>
              <input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(this, 'set-qris-url')" />
            </label>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
        <div class="absolute top-0 right-0 w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
        <h3 class="font-bold text-slate-800 dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-700 pb-4 flex items-center gap-3 text-base">
          <div class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center"><i class="fa-solid fa-shield-halved"></i></div>
          Akses Admin Panel
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Username Baru</label>
            <input type="text" id="set-auth-user" value="${esc(appData.auth.username)}" class="admin-input !py-3 w-full" placeholder="Admin123"/>
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Password Baru</label>
            <input type="text" id="set-auth-pass" value="${esc(appData.auth.password)}" class="admin-input !py-3 w-full" placeholder="Rahasia123" />
          </div>
        </div>
      </div>
    </div>

    <div class="pt-6 mt-4 border-t-2 border-slate-200 dark:border-slate-800">
      <div class="flex flex-col sm:flex-row gap-4 mb-4">
        <button onclick="backupData()" class="flex-1 bg-slate-800 dark:bg-slate-700 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-all text-sm flex items-center justify-center gap-2 border-2 border-slate-900 dark:border-slate-600 shadow-md">
          <i class="fa-solid fa-download text-emerald-400"></i> Backup Data (JSON)
        </button>
        <button onclick="el('restore-file').click()" class="flex-1 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold py-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm flex items-center justify-center gap-2 shadow-sm">
          <i class="fa-solid fa-upload text-blue-500"></i> Restore Data
        </button>
      </div>
      <button onclick="saveAdminSettings()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 py-4 rounded-2xl text-sm font-semibold tracking-wide shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2">
        <i class="fa-solid fa-save text-lg"></i> SIMPAN SEMUA PENGATURAN
      </button>
    </div>

  </div>
  `);
};

window.saveAdminSettings = async () => {
  if (isSaving) return;
  isSaving = true;
  sLoad('Menyimpan...');
  try {
    appData.store.name = getV('set-name');
    appData.store.slogan = getV('set-slogan');
    appData.store.logo = fixD(getV('set-logo'));
    appData.store.categoryStyle = getV('set-category-style');
    appData.store.allProductsIcon = fixD(getV('set-all-cat-icon'));
    appData.store.footerText = getV('set-footer-text');
    const rawWa = getV('set-wa').replace(/\D/g,'');
    if (rawWa && rawWa.length < 9) { isSaving = false; hLoad(); return showToast('Nomor WA tidak valid! Minimal 9 digit.'); }
    appData.store.wa = rawWa;
    appData.store.address = getV('set-address');
    appData.store.costPerKm = getV('set-cost');
    appData.store.isDeliveryEnabled = getV('set-delivery-enabled') === 'true';
    appData.store.isPickupEnabled = getV('set-pickup-enabled') === 'true';
    appData.store.lat = getV('set-lat');
    appData.store.lng = getV('set-lng');
    
    appData.store.themeColor = getV('set-theme-color');
    appData.store.bgStyle = getV('set-bg-style') || appData.store.bgStyle || 'hero-arch';
    appData.store.bgImage = fixD(getV('set-bg-image'));
    const selPaper = document.querySelector('input[name="store-printer-paper"]:checked')?.value || '58';
    appData.store.printerPaper = selPaper;
    const selStockMode = document.querySelector('input[name="store-stock-mode"]:checked')?.value || 'tracked';
    appData.store.stockMode = selStockMode;
    const selReceiptAlign = document.querySelector('input[name="store-receipt-align"]:checked')?.value || 'center';
    appData.store.receiptAlignment = selReceiptAlign;
    const selReceiptMode = document.querySelector('input[name="store-receipt-mode"]:checked')?.value || 'compact';
    appData.store.receiptLayoutMode = selReceiptMode;
    appData.store.receiptShowSlogan = el('set-receipt-show-slogan')?.checked ?? false;
    appData.store.receiptShowAddress = el('set-receipt-show-address')?.checked ?? true;
    appData.store.receiptShowWa = el('set-receipt-show-wa')?.checked ?? true;
    appData.store.receiptShowBarcode = el('set-receipt-show-barcode')?.checked ?? false;
    appData.store.receiptShowNotes = el('set-receipt-show-notes')?.checked ?? false;
    appData.store.receiptShowPowered = el('set-receipt-show-powered')?.checked ?? true;
    try { 
      localStorage.setItem('freshmart_bg_style', appData.store.bgStyle); 
      localStorage.setItem('freshmart_bg_image', appData.store.bgImage || '');
      localStorage.setItem('freshmart_printer_paper', selPaper);
    } catch(e) {}

    if(!appData.store.social) appData.store.social = {};
    appData.store.social.fb = getV('set-soc-fb');
    appData.store.social.ig = getV('set-soc-ig');
    appData.store.social.tt = getV('set-soc-tt');
    appData.store.social.yt = getV('set-soc-yt');
    
    appData.payment.qrisUrl = fixD(getV('set-qris-url'));
    appData.auth.username = getV('set-auth-user');
    appData.auth.password = getV('set-auth-pass');
    
    await saveApp();
    showToast("Tersimpan! Memuat ulang tema...");
    
    updateThemeVars();
    applyGlobalTheme();
    applyBgStyle(appData.store.bgStyle);
    Object.keys(_pwaIconCache).forEach(k => delete _pwaIconCache[k]);
    try { await buildAndInjectManifest(); } catch(e) {}
    
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    showToast("Gagal menyimpan pengaturan");
  }
  isSaving = false;
  hLoad();
};

window.backupData = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(appData)], { type: "application/json" }));
  a.download = `Backup.json`;
  a.click();
  showToast("Terunduh");
};

window.restoreData = e => {
  const r = new FileReader();
  r.onload = v => {
    try {
      let currLic = appData.licenseKey;
      const parsed = JSON.parse(v.target.result);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.products) || typeof parsed.store !== 'object' || typeof parsed.auth !== 'object') {
        return showToast('File bukan backup FreshMart yang valid!');
      }
      appData = parsed;
      if (currLic && !appData.licenseKey) appData.licenseKey = currLic;
      saveApp();
      setTimeout(() => location.reload(), 1000);
    } catch (x) {
      showToast('Gagal! File tidak valid atau rusak.');
    }
  };
  r.readAsText(e.target.files[0]);
};

const rAdmL = t => {
  let helpBanner = window.getTabHelpBanner ? window.getTabHelpBanner(t) : '';
  let stats = '';
  let extraBtns = '';
  if (t === 'products') {
    stats = `<div id="admin-product-stats" class="mb-4"></div>`;
    const suppList = appData.suppliers || [];
    extraBtns = `
      <div class="relative w-full sm:w-auto shrink-0">
        <select id="admin-supplier-filter" onchange="window.aPrtSupplierFilter=this.value;rAdmItms('products')" class="admin-input !py-3 !pl-3.5 !pr-8 !text-xs font-bold w-full sm:w-48 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl appearance-none cursor-pointer">
          <option value="all">Semua Supplier</option>
          <option value="unassigned" ${window.aPrtSupplierFilter === 'unassigned' ? 'selected' : ''}>Tanpa Supplier</option>
          ${suppList.map(s => {
            const pCount = (appData.products || []).filter(p => String(p.supplierId) === String(s.id)).length;
            return `<option value="${s.id}" ${String(window.aPrtSupplierFilter) === String(s.id) ? 'selected' : ''}>${esc(s.name)} (${pCount})</option>`;
          }).join('')}
        </select>
        <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
      </div>
      <button type="button" onclick="openPricetagModal()" class="w-full sm:w-auto px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white border-2 border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0" title="Cetak Label Harga & Barcode Rak (Price Tag)">
        <i class="fa-solid fa-tags text-sm"></i> Price Tag
      </button>
    `;
  }

  setH('admin-content', helpBanner + stats + `<div class="mb-5 flex flex-col sm:flex-row gap-3 items-center"><div class="relative w-full flex-1"><i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i><input id="admin-search-input" placeholder="Cari nama, SKU..." oninput="clearTimeout(window._admST);const _v=this.value;window._admST=setTimeout(()=>{aSq=_v.toLowerCase();rAdmItms('${t}')},200)" class="admin-input !pl-10 !pr-[2.5rem] !py-3 !text-sm !rounded-xl shadow-sm" /><button onclick="openCameraScanner('admin-search-input')" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"><i class="fa-solid fa-qrcode text-sm"></i></button></div>${extraBtns}<button onclick="oAAdd()" class="w-full sm:w-auto text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 shrink-0" style="background-color:var(--clr-p)"><i class="fa-solid fa-plus"></i> Tambah Baru</button></div><div id="admin-list-container" class="space-y-3 pb-12"></div>`);
  rAdmItms(t);
};

window.rAdmItms = t => {
  window.aPrtSort = window.aPrtSort || 'all';
  window.aPrtSupplierFilter = window.aPrtSupplierFilter || 'all';
  
  if (t === 'products') {
    let totalAll = (appData.products || []).length;
    let countActive = 0, countEmpty = 0, countInactive = 0;
    (appData.products || []).forEach(p => {
      let isOff = (p.isActive === 'false' || p.isActive === false);
      let isUnlimited = (appData.store?.stockMode === 'unlimited') || p.isUnlimited === true || p.isUnlimited === 'true';
      if (isOff) {
        countInactive++;
      } else if (isUnlimited) {
        countActive++;
      } else {
        let hasVars = p.variants && p.variants.length > 0;
        let totalStock = hasVars ? p.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0) : Number(p.stock ?? 100);
        if (totalStock <= 0) countEmpty++;
        else countActive++;
      }
    });

    let s = el('admin-product-stats');
    if (s) {
      const getPillCls = (key) => window.aPrtSort === key 
        ? 'ring-2 ring-emerald-500 scale-[1.02] shadow-md border-emerald-500 bg-white dark:bg-slate-800' 
        : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-600 opacity-80 hover:opacity-100 shadow-xs';

      s.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <!-- Tab 1: Semua -->
        <div onclick="window.aPrtSort='all';rAdmItms('products')" class="cursor-pointer border-2 rounded-2xl p-3 flex items-center gap-2.5 transition-all ${getPillCls('all')}">
          <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 text-sm"><i class="fa-solid fa-boxes-stacked"></i></div>
          <div class="min-w-0"><p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">Semua</p><h4 class="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-none">${totalAll}</h4></div>
        </div>

        <!-- Tab 2: Aktif & Ready -->
        <div onclick="window.aPrtSort='active';rAdmItms('products')" class="cursor-pointer border-2 rounded-2xl p-3 flex items-center gap-2.5 transition-all ${getPillCls('active')}">
          <div class="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-sm"><i class="fa-solid fa-check"></i></div>
          <div class="min-w-0"><p class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">Aktif Ready</p><h4 class="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 leading-none">${countActive}</h4></div>
        </div>

        <!-- Tab 3: Stok Kosong (Tampil) -->
        <div onclick="window.aPrtSort='empty';rAdmItms('products')" class="cursor-pointer border-2 rounded-2xl p-3 flex items-center gap-2.5 transition-all ${getPillCls('empty')}">
          <div class="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-sm"><i class="fa-solid fa-box-open"></i></div>
          <div class="min-w-0"><p class="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider truncate">Stok Kosong</p><h4 class="text-base sm:text-lg font-black text-amber-700 dark:text-amber-300 leading-none">${countEmpty}</h4></div>
        </div>

        <!-- Tab 4: Nonaktif (Disembunyikan) -->
        <div onclick="window.aPrtSort='inactive';rAdmItms('products')" class="cursor-pointer border-2 rounded-2xl p-3 flex items-center gap-2.5 transition-all ${getPillCls('inactive')}">
          <div class="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 text-sm"><i class="fa-solid fa-eye-slash"></i></div>
          <div class="min-w-0"><p class="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider truncate">Nonaktif</p><h4 class="text-base sm:text-lg font-black text-rose-700 dark:text-rose-300 leading-none">${countInactive}</h4></div>
        </div>
      </div>`;
    }
  }
  
  let rawList = [...(appData[t] || [])];
  rawList.sort((a, b) => {
    return (b.id || 0) - (a.id || 0);
  });
  
  let i = rawList.filter(x => {
    let m = (x.name || x.title || x.code || x.bankName || x.sku || '').toLowerCase().includes(aSq);
    if (t === 'products' && !m && x.variants) m = x.variants.some(v => v.sku && v.sku.toLowerCase().includes(aSq));
    if (!m) return false;

    if (t === 'products') {
      const isOff = x.isActive === 'false' || x.isActive === false;
      const isUnlimited = (appData.store?.stockMode === 'unlimited') || x.isUnlimited === true || x.isUnlimited === 'true';
      const hasVars = x.variants && x.variants.length > 0;
      const totalStock = hasVars ? x.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0) : Number(x.stock ?? 100);
      const isOutOfStock = !isOff && !isUnlimited && totalStock <= 0;
      
      if (window.aPrtSort === 'active') return !isOff && !isOutOfStock;
      if (window.aPrtSort === 'empty') return !isOff && isOutOfStock;
      if (window.aPrtSort === 'inactive') return isOff;

      if (window.aPrtSupplierFilter && window.aPrtSupplierFilter !== 'all') {
        if (window.aPrtSupplierFilter === 'unassigned') {
          if (x.supplierId) return false;
        } else if (String(x.supplierId) !== String(window.aPrtSupplierFilter)) {
          return false;
        }
      }
    }
    return true;
  });
  
  if (!i.length) return setH('admin-list-container', `<div class="text-center py-16 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm"><i class="fa-solid fa-folder-open text-4xl mb-3 opacity-40 block"></i>Data tidak ditemukan</div>`);

  setH('admin-list-container', i.map(x => {
    let isP = t === 'products';
    let isOff = isP && (x.isActive === 'false' || x.isActive === false);
    let isUnlimited = isP && ((appData.store?.stockMode === 'unlimited') || x.isUnlimited === true || x.isUnlimited === 'true');
    let hasVars = isP && x.variants && x.variants.length > 0;
    let totalStock = isP ? (hasVars ? x.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0) : Number(x.stock ?? 100)) : 0;
    let isOutOfStock = isP && !isOff && !isUnlimited && totalStock <= 0;

    let bC = isOff 
      ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20' 
      : (isOutOfStock 
        ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/20' 
        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800');
    
    let tC = isOff ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100';
    
    let statusBadge = '';
    if (isP) {
      if (isOff) {
        statusBadge = `<span class="badge badge-xs bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold"><i class="fa-solid fa-eye-slash text-[8px]"></i> Nonaktif (Sembunyi)</span>`;
      } else if (isUnlimited) {
        statusBadge = `<span class="badge badge-xs bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-bold"><i class="fa-solid fa-infinity text-[8px]"></i> Stok Bebas</span>`;
      } else if (isOutOfStock) {
        statusBadge = `<span class="badge badge-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold"><i class="fa-solid fa-box-open text-[8px]"></i> Stok Kosong (0 ${esc(x.unit||'Pcs')})</span>`;
      } else {
        statusBadge = `<span class="badge badge-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold"><i class="fa-solid fa-check text-[8px]"></i> Aktif (${totalStock} ${esc(x.unit||'Pcs')})</span>`;
      }
    }

    let img = x.img 
      ? `<div class="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0"><img loading="lazy" src="${esc(x.img)}" onerror="this.onerror=null;this.src='https://placehold.co/100?text=Img'" class="w-full h-full rounded-xl object-cover border-2 border-slate-100 dark:border-slate-700 ${isOff?'grayscale opacity-50':(isOutOfStock?'grayscale opacity-75':'')} shadow-sm"/></div>` 
      : `<div class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-400 shrink-0 shadow-sm"><i class="fa-solid fa-image text-xl"></i></div>`;
    
    let skuBadge = isP && x.sku ? `<span class="badge badge-xs badge-slate badge-normal-case"><i class="fa-solid fa-barcode"></i> ${esc(x.sku)}</span>` : '';
    let suppBadge = (isP && (x.supplierName || x.supplierId)) ? `<span class="badge badge-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 font-bold" title="Rekanan Asal Supplier"><i class="fa-solid fa-truck-field text-[8px]"></i> ${esc(x.supplierName || 'Supplier Tertaut')}</span>` : '';
    let varsBadge = isP && hasVars ? `<span class="badge badge-xs badge-indigo">${x.variants.length} Varian</span>` : '';
    let wholBadge = isP && x.wholesale && x.wholesale.length ? `<span class="badge badge-xs badge-purple"><i class="fa-solid fa-tags"></i> Grosir</span>` : '';
    let costBadge = (isP && x.costPrice) ? `<span class="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">HPP: <b class="text-slate-700 dark:text-slate-300">${fCur(x.costPrice)}</b></span>` : '';
    
    return `
    <div class="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer border-2 ${bC} shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 gap-3.5 group" onclick="oAEd('${t}',${x.id})">
      <div class="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
        ${img}
        <div class="min-w-0 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <p class="text-sm sm:text-base font-bold ${tC} truncate">${esc(x.name||x.title||x.bankName||x.code||'Item')}</p>
            ${statusBadge}
          </div>
          ${isP ? `
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm drop-shadow-sm">${fCur(x.price)}</span>
            ${costBadge}
            ${skuBadge}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${suppBadge}
            ${varsBadge}
            ${wholBadge}
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Action Toolbar (Clean, Unified Pill Container) -->
      <div class="flex items-center gap-1.5 sm:gap-2 pt-2.5 sm:pt-0 border-t border-slate-100 dark:border-slate-700/80 sm:border-t-0 shrink-0 justify-end flex-wrap">
        ${isP ? `
        <!-- Tombol Cetak Price Tag / Label Harga -->
        <button type="button" onclick="event.stopPropagation(); openPricetagForSingleProduct(${x.id})" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-xs shadow-xs active:scale-95 shrink-0" title="Cetak Price Tag / Label Harga Barang Ini"><i class="fa-solid fa-tags"></i></button>

        <!-- Tombol Edit Cepat -->
        <button type="button" onclick="openQuickEditProduct(${x.id})" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-xs shadow-xs active:scale-95 shrink-0" title="Edit Cepat (Stok, HPP & Harga)"><i class="fa-solid fa-bolt"></i></button>

        <!-- Tombol Stok Opname Instan -->
        <button type="button" onclick="openStockOpnameModal(${x.id})" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center text-xs shadow-xs active:scale-95 shrink-0" title="Stok Opname (Audit Fisik)"><i class="fa-solid fa-clipboard-check"></i></button>

        <!-- Tombol Toggle Visibilitas Toko -->
        <button type="button" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${isOff ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-emerald-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-600 hover:text-white'} border border-slate-200 dark:border-slate-600 transition-all flex items-center justify-center text-xs shadow-xs active:scale-95 shrink-0" onclick="event.stopPropagation(); toggleProductStatus(${x.id}, ${isOff})" title="${isOff ? 'Tampilkan di Toko' : 'Sembunyikan dari Toko'}">
          <i class="fa-solid ${isOff ? 'fa-eye-slash' : 'fa-eye'}"></i>
        </button>

        <!-- Tombol Duplikat -->
        <button type="button" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center text-xs shadow-xs active:scale-95 shrink-0" onclick="event.stopPropagation(); duplicateProduct(${x.id})" title="Duplikat Produk">
          <i class="fa-solid fa-copy"></i>
        </button>
        ` : ''}

        <!-- Tombol Edit Detail Lengkap -->
        <button type="button" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-white dark:hover:text-slate-800 transition-all flex items-center justify-center text-xs shadow-xs active:scale-95 shrink-0" onclick="event.stopPropagation(); oAEd('${t}',${x.id})" title="Edit Detail Lengkap">
          <i class="fa-solid fa-pen"></i>
        </button>

        <!-- Tombol Hapus -->
        <button type="button" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center text-xs shadow-xs active:scale-95 shrink-0" onclick="event.stopPropagation(); oADel('${t}',${x.id})" title="Hapus Permanen">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`;
  }).join(''));
};

window.oAAdd = () => { if (!isAdm) return; oAEd(cTab, null); };

window.oAEd = (t, id) => {
  if (!isAdm) return;
  window.cModalTab = t;
  eId = id; 
  let d = id ? (appData[t] || []).find(x => x.id === id) : null;
  
  setIn('admin-modal-title', id ? 'Edit Data' : 'Tambah Data');
  let f = aF[t] || []; 
  let h = '';
  
  if (t === 'products') {
    tVars = d && d.variants ? JSON.parse(JSON.stringify(d.variants)) : [];
    tWhol = d && d.wholesale ? JSON.parse(JSON.stringify(d.wholesale)) : [];
  }

  const getIcon = (key) => {
    const icons = {
      name: 'fa-box-open', sku: 'fa-barcode', price: 'fa-tag', costPrice: 'fa-coins', stock: 'fa-boxes-stacked', unit: 'fa-ruler', img: 'fa-image',
      category: 'fa-layer-group', supplierId: 'fa-truck-field', tag: 'fa-hashtag', isActive: 'fa-power-off',
      desc: 'fa-align-left', wholesale: 'fa-boxes-stacked', variants: 'fa-sitemap',
      code: 'fa-ticket', type: 'fa-filter', value: 'fa-coins',
      bankName: 'fa-building-columns', bankAccount: 'fa-money-check-dollar', bankOwner: 'fa-user-tie',
      title: 'fa-heading', subtitle: 'fa-quote-left',
      username: 'fa-user-shield', password: 'fa-key', permissions: 'fa-list-check'
    };
    return icons[key] || 'fa-pen';
  };

  f.forEach(k => {
    let v = d ? d[k.key] || '' : '';
    let iconClass = getIcon(k.key);
    
    h += `<div class="mb-4">
    <label class="flex items-center gap-2 text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">
      <i class="fa-solid ${iconClass} text-emerald-500 text-sm"></i> ${k.label}
    </label>`;
    
    if (k.type === 'textarea') {
      h += `<textarea id="af-${k.key}" class="admin-input resize-none !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full focus:bg-white dark:focus:bg-slate-800 transition-all leading-relaxed" rows="3" placeholder="Tuliskan deskripsi lengkap...">${esc(v)}</textarea>`;
    } else if (k.type === 'select') {
      h += `<div class="relative"><select id="af-${k.key}" class="admin-input cursor-pointer !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full appearance-none font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 transition-all">`;
      k.options.forEach(o => { h += `<option value="${o.val}" ${v == o.val || (v === 'true' && o.val === 'true') || (v === 'false' && o.val === 'false') ? 'selected' : ''}>${o.text}</option>`; });
      h += `</select><i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i></div>`;
    } else if (k.type === 'dynamic_select_category') {
      h += `<div class="relative"><select id="af-${k.key}" class="admin-input cursor-pointer !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full appearance-none font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 transition-all"><option value="">Pilih Kategori</option>`;
      appData.categories.forEach(c => { h += `<option value="${esc(c.name)}" ${v === c.name ? 'selected' : ''}>${esc(c.name)}</option>`; });
      h += `</select><i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i></div>`;
    } else if (k.type === 'dynamic_select_supplier') {
      const suppliers = appData.suppliers || [];
      h += `<div class="relative"><select id="af-${k.key}" class="admin-input cursor-pointer !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full appearance-none font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 transition-all"><option value="">-- Tanpa Rekanan Supplier (Beli Bebas) --</option>`;
      suppliers.forEach(s => { h += `<option value="${esc(s.id)}" ${v === s.id || String(v) === String(s.id) ? 'selected' : ''}>${esc(s.name)} ${s.pic ? `(PIC: ${esc(s.pic)})` : ''}</option>`; });
      h += `</select><i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i></div>
      <p class="text-[10px] text-slate-400 font-semibold mt-1 italic">*Tautkan barang ke supplier untuk memudahkan pengelompokan produk dan pencatatan asal barang kulakan.</p>`;
    } else if (k.type === 'unit_selector') {
      const unitList = ['pcs','kg','gram','liter','ml','dus','karton','lusin','gross','pak','roll','lembar','meter','cm','botol','kaleng','bungkus','ikat','renceng','slop','buah','porsi'];
      h += `<div class="flex gap-2">
      <div class="relative flex-1">
        <select id="af-unit-preset" class="admin-input cursor-pointer !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full appearance-none font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 transition-all" onchange="(function(s){var c=document.getElementById('af-unit');if(s.value){c.value=s.value;}})(this)">
          <option value="">-- Pilih --</option>
          ${unitList.map(u => `<option value="${u}" ${v===u?'selected':''}>${u}</option>`).join('')}
        </select>
        <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
      </div>
      <input type="text" id="af-unit" value="${esc(v)}" class="admin-input !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-32 focus:bg-white dark:focus:bg-slate-800 transition-all font-bold" placeholder="atau ketik..." oninput="(function(inp){var s=document.getElementById('af-unit-preset');if([...s.options].some(o=>o.value===inp.value)){s.value=inp.value;}else{s.value='';}})(this)"/>
      </div>
      <p class="text-[10px] text-slate-400 font-medium mt-1.5 italic">Pilih dari daftar atau ketik satuan kustom. Contoh: <span class="font-bold text-slate-500">pack isi 6</span>, <span class="font-bold text-slate-500">per meter</span></p>`;
    } else if (k.type === 'variants_builder') {
      h += `<div id="variants-builder-container" class="bg-slate-50 dark:bg-slate-900 p-4 sm:p-5 rounded-[1.25rem] border-2 border-slate-100 dark:border-slate-700 shadow-inner"></div>`;
    } else if (k.type === 'wholesale_builder') {
      h += `<div id="wholesale-builder-container" class="bg-amber-50/50 dark:bg-amber-900/10 p-4 sm:p-5 rounded-[1.25rem] border-2 border-amber-100 dark:border-amber-800/30 shadow-inner"></div>`;
    } else if (k.type === 'permissions_builder') {
      const availPerms = [
        { id: 'orders', name: 'Kelola Pesanan' },
        { id: 'products', name: 'Kelola Produk' },
        { id: 'categories', name: 'Kelola Kategori' },
        { id: 'vouchers', name: 'Kelola Voucher' },
        { id: 'banners', name: 'Kelola Banner' },
        { id: 'view_cost_price', name: 'Boleh Lihat Harga Modal (HPP)' },
        { id: 'edit_stock', name: 'Boleh Ubah Stok Produk' },
        { id: 'view_reports', name: 'Boleh Lihat Laporan Keuntungan' }
      ];
      let vArr = Array.isArray(v) ? v : [];
      h += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">`;
      availPerms.forEach(p => {
        const isChecked = vArr.includes(p.id) ? 'checked' : '';
        h += `<label class="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 transition-all shadow-sm"><input type="checkbox" value="${p.id}" class="perm-checkbox w-4 h-4 text-emerald-600 rounded border-gray-300" ${isChecked}/> <span>${p.name}</span></label>`;
      });
      h += `</div><p class="text-[9px] text-slate-400 mt-2 italic font-medium">*Secara default, Kasir TIDAK BISA melihat harga modal/HPP dan pengaturan toko kecuali dicentang oleh Admin.</p>`;
    } else if (k.key === 'sku') {
      h += `<div class="relative flex items-center gap-1.5">
        <div class="relative flex-1">
          <input type="text" id="af-${k.key}" value="${esc(v)}" class="admin-input !py-3 !pr-10 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full font-mono text-xs focus:bg-white dark:focus:bg-slate-800 transition-all font-bold" placeholder="Scan barcode atau ketik manual..." />
          <button type="button" onclick="openCameraScanner('af-${k.key}')" class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-600 rounded-lg transition-all" title="Scan Barcode via HP"><i class="fa-solid fa-qrcode text-xs"></i></button>
        </div>
        <button type="button" onclick="generateAutoSku('af-${k.key}')" class="px-3.5 py-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border-2 border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-xs shrink-0 transition-all flex items-center gap-1.5 shadow-sm active:scale-95" title="Generate SKU Otomatis"><i class="fa-solid fa-wand-magic-sparkles text-xs"></i> <span>Auto SKU</span></button>
      </div>`;
    } else if (k.key === 'price') {
      h += `<div class="relative">
        <input type="number" min="0" step="1" id="af-${k.key}" value="${esc(v)}" oninput="updateProductMarginPreview()" class="admin-input !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full focus:bg-white dark:focus:bg-slate-800 transition-all font-bold" placeholder="Masukkan harga jual..."/>
      </div>`;
    } else if (k.key === 'costPrice') {
      if (!window.canViewCostPrice()) {
        h += `<div class="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-slate-400 font-bold text-xs">
          <i class="fa-solid fa-lock text-amber-500 text-sm"></i>
          <span>Harga Modal (HPP) Terkunci (Khusus Akun Admin & Kasir Berizin)</span>
        </div>`;
      } else {
        h += `<div class="relative">
          <input type="number" min="0" step="1" id="af-${k.key}" value="${esc(v)}" oninput="updateProductMarginPreview()" class="admin-input !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full focus:bg-white dark:focus:bg-slate-800 transition-all font-bold" placeholder="Masukkan harga modal (HPP)..."/>
          <div id="product-margin-preview" class="mt-2 text-[11px] font-bold"></div>
        </div>`;
      }
    } else if (k.key === 'stock') {
      h += `<div class="relative">
        <input type="number" min="0" step="1" id="af-${k.key}" value="${v !== undefined && v !== '' ? esc(v) : '100'}" class="admin-input !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full focus:bg-white dark:focus:bg-slate-800 transition-all font-bold" placeholder="Jumlah stok produk (cth: 100)..."/>
        <p class="text-[10px] text-slate-400 font-semibold mt-1 italic">*Stok otomatis berkurang saat transaksi kasir berhasil</p>
      </div>`;
    } else if (k.key === 'img') {
      h += `<div class="flex flex-col sm:flex-row gap-2">
        <input type="text" id="af-${k.key}" value="${esc(v)}" class="admin-input flex-1 !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-xs focus:bg-white dark:focus:bg-slate-800 transition-all" placeholder="https://URL Gambar" />
        <label onclick="if(window.AppInventor){ event.preventDefault(); window.AppInventor.setWebViewString('BUKA_GALERI|||af-${k.key}|||null'); }" class="bg-white dark:bg-slate-800 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-xl py-3 px-5 flex items-center justify-center cursor-pointer hover:bg-emerald-500 hover:text-white dark:hover:text-white transition-all shrink-0 shadow-sm font-semibold text-xs gap-2">
          <i class="fa-solid fa-cloud-arrow-up"></i> Upload Foto
          <input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(this, 'af-${k.key}')" />
        </label>
      </div>`;
    } else {
      h += `<input type="${k.type}" id="af-${k.key}" value="${esc(v)}" class="admin-input !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full focus:bg-white dark:focus:bg-slate-800 transition-all" placeholder="Masukkan ${k.label.toLowerCase()}..."/>`;
    }
    h += `</div>`;
  });
  
  setH('admin-modal-form', h);
  if (t === 'products') { 
    rVarsB(); 
    rWholB(); 
    if (window.canViewCostPrice()) setTimeout(updateProductMarginPreview, 50);
  }
  show('admin-modal');
  setTimeout(() => { 
    el('admin-modal').classList.remove('opacity-0'); 
    el('admin-modal-box').classList.remove('scale-95'); 
  }, 10);
};

window.generateAutoSku = (targetId = 'af-sku') => {
  const code = 'SKU' + Math.floor(100000 + Math.random() * 900000);
  const input = el(targetId);
  if (input) {
    input.value = code;
    showToast(`SKU dibuat: ${code}`);
  }
  return code;
};

window.generateAutoVarSku = (index) => {
  const parentSku = (getV('af-sku') || 'SKU' + Date.now().toString().slice(-4)).trim();
  const code = `${parentSku}-V${index + 1}`;
  if (tVars[index]) {
    tVars[index].sku = code;
  }
  const input = el(`var-sku-${index}`);
  if (input) input.value = code;
  showToast(`SKU Varian dibuat: ${code}`);
};

window.updateProductMarginPreview = () => {
  if (!window.canViewCostPrice()) return;
  const price = parseFloat(getV('af-price')) || 0;
  const cost = parseFloat(getV('af-costPrice')) || 0;
  const container = el('product-margin-preview');
  if (!container) return;
  if (price <= 0 && cost <= 0) {
    container.innerHTML = '';
    return;
  }
  const profit = price - cost;
  const pct = (price > 0 && profit > 0) ? Math.round((profit / price) * 100) : 0;
  if (cost > 0) {
    if (profit >= 0) {
      container.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><i class="fa-solid fa-arrow-trend-up"></i> Estimasi Laba Bersih: ${fCur(profit)} (Margin ${pct}%)</span>`;
    } else {
      container.innerHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"><i class="fa-solid fa-arrow-trend-down"></i> Potensi Rugi: ${fCur(profit)}</span>`;
    }
  } else {
    container.innerHTML = `<span class="text-slate-400 font-medium italic text-[10px]">*Isi harga modal (HPP) untuk melihat kalkulasi margin laba</span>`;
  }
};

window.rVarsB = () => {
  const isCostPriceAllowed = window.canViewCostPrice();
  let h = `<div class="space-y-3 mb-4">` + tVars.map((v, i) => {
    const profit = (parseFloat(v.price) || 0) - (parseFloat(v.costPrice) || 0);
    const marginPct = (v.price > 0 && profit > 0) ? Math.round((profit / v.price) * 100) : 0;
    const showProfit = isCostPriceAllowed && (parseFloat(v.costPrice) || 0) > 0;
    return `
    <div class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/40 shadow-sm relative overflow-hidden group">
      <div class="flex items-center justify-between mb-3 border-b-2 border-slate-50 dark:border-slate-700 pb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><i class="fa-solid fa-sitemap"></i> Varian ${i+1}</span>
          <span id="var-profit-badge-${i}" class="text-[9px] px-2 py-0.5 rounded-full font-black ${profit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}" style="${showProfit ? '' : 'display:none;'}">Laba: ${fCur(profit)} (${marginPct}%)</span>
        </div>
        <button onclick="rmVar(${i})" class="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center" title="Hapus Varian"><i class="fa-solid fa-xmark text-sm"></i></button>
      </div>
      
      <div class="space-y-2.5">
        <!-- Row 1: Nama Varian & Stok Varian -->
        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <label class="text-[9px] font-bold text-slate-500 block mb-1">NAMA VARIAN</label>
            <input placeholder="Cth: 22 Oz / Merah / 1 Kg" class="admin-input !py-2.5 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold w-full" value="${esc(v.name)}" oninput="uVar(${i},'name',this.value)"/>
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-500 block mb-1">STOK</label>
            <input placeholder="Stok" type="number" min="0" class="admin-input !py-2.5 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold text-center w-full" value="${v.stock !== undefined && v.stock !== '' ? v.stock : '100'}" oninput="uVar(${i},'stock',this.value)"/>
          </div>
        </div>

        <!-- Row 2: Harga Jual & Harga Modal / HPP -->
        <div class="grid grid-cols-${isCostPriceAllowed ? '2' : '1'} gap-2">
          <div>
            <label class="text-[9px] font-bold text-slate-500 block mb-1">HARGA JUAL (Rp)</label>
            <div class="relative">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
              <input placeholder="0" type="number" min="0" class="admin-input !py-2 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold" value="${v.price || ''}" oninput="uVar(${i},'price',this.value)"/>
            </div>
          </div>
          ${isCostPriceAllowed ? `
          <div>
            <label class="text-[9px] font-bold text-slate-500 block mb-1">MODAL / HPP (Rp)</label>
            <div class="relative">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
              <input placeholder="0" type="number" min="0" class="admin-input !py-2 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold" value="${v.costPrice || ''}" oninput="uVar(${i},'costPrice',this.value)"/>
            </div>
          </div>` : ''}
        </div>

        <!-- Row 3: SKU with Auto Generator & Foto Varian -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="relative flex items-center gap-1">
            <div class="relative flex-1">
              <input id="var-sku-${i}" placeholder="SKU Barcode" class="admin-input !py-2.5 !pr-7 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs w-full font-bold" value="${esc(v.sku||'')}" oninput="uVar(${i},'sku',this.value)"/>
              <button type="button" onclick="openCameraScanner('var-sku-${i}')" class="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-emerald-600 rounded transition-all" title="Scan Barcode"><i class="fa-solid fa-qrcode text-[10px]"></i></button>
            </div>
            <button type="button" onclick="generateAutoVarSku(${i})" class="px-2.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-[10px] shrink-0 transition-all flex items-center gap-1" title="Auto SKU Varian"><i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i> <span>Auto</span></button>
          </div>
          <div class="flex gap-1.5">
            <input id="var-img-${i}" placeholder="URL Gambar Varian" class="admin-input !py-2.5 !text-xs flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 min-w-0" value="${esc(v.img||'')}" oninput="uVar(${i},'img',this.value)"/>
            <label onclick="if(window.AppInventor){ event.preventDefault(); window.AppInventor.setWebViewString('BUKA_GALERI|||var-img-${i}|||${i}'); }" class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-xl w-10 flex items-center justify-center cursor-pointer hover:bg-emerald-600 hover:text-white transition-all shrink-0"><i class="fa-solid fa-image text-[11px]"></i><input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(this, 'var-img-${i}', ${i})" /></label>
          </div>
        </div>
      </div>
    </div>`;
  }).join('') + `</div>
  <button onclick="addVar()" class="w-full py-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-bold rounded-xl text-[10px] uppercase tracking-widest border-2 border-emerald-200 dark:border-emerald-800 border-dashed hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"><i class="fa-solid fa-plus text-sm"></i> Tambah Varian Produk</button>`;
  setH('variants-builder-container', h);
};

window.addVar = () => { tVars.push({ name: '', price: 0, costPrice: 0, stock: 100, sku: '', img: '' }); rVarsB(); };
window.rmVar = i => { tVars.splice(i, 1); rVarsB(); };
window.uVar = (i, k, v) => { 
  if (!tVars[i]) return;
  tVars[i][k] = (k === 'price' || k === 'costPrice' || k === 'stock') ? parseFloat(v) || 0 : (k === 'img' ? fixD(v) : v); 
  if (k === 'price' || k === 'costPrice') {
    const badge = el(`var-profit-badge-${i}`);
    if (badge && window.canViewCostPrice()) {
      const pVal = parseFloat(tVars[i].price) || 0;
      const cVal = parseFloat(tVars[i].costPrice) || 0;
      const profit = pVal - cVal;
      const marginPct = (pVal > 0 && profit > 0) ? Math.round((profit / pVal) * 100) : 0;
      if (cVal > 0) {
        badge.className = `text-[9px] px-2 py-0.5 rounded-full font-black ${profit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}`;
        badge.innerText = `Laba: ${fCur(profit)} (${marginPct}%)`;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }
};

window.rWholB = () => {
  let h = `<div class="space-y-3 mb-4">` + tWhol.map((w, i) => `
  <div class="flex gap-2 items-center bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-amber-100 dark:border-amber-800/40 shadow-sm relative overflow-hidden">
    <div class="flex-1 flex gap-2 items-center relative z-10">
      <div class="relative w-1/3">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-amber-500">>=</span>
        <input type="number" placeholder="Min. Qty" class="admin-input !py-2.5 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold" value="${w.minQty}" oninput="uWhol(${i},'minQty',this.value)"/>
      </div>
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-amber-500">Rp</span>
        <input type="number" placeholder="Harga Satuan Grosir" class="admin-input !py-2.5 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold" value="${w.price}" oninput="uWhol(${i},'price',this.value)"/>
      </div>
    </div>
    <button onclick="rmWhol(${i})" class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shrink-0 relative z-10 flex items-center justify-center shadow-sm"><i class="fa-solid fa-trash text-[11px]"></i></button>
  </div>`).join('') + `</div>
  <button onclick="addWhol()" class="w-full py-3.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-bold rounded-xl text-[10px] uppercase tracking-widest border-2 border-amber-300 dark:border-amber-800 border-dashed hover:bg-amber-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"><i class="fa-solid fa-plus text-sm"></i> Tambah Harga Grosir</button>`;
  setH('wholesale-builder-container', h);
};

window.addWhol = () => { tWhol.push({ minQty: 2, price: 0 }); rWholB(); };
window.rmWhol = i => { tWhol.splice(i, 1); rWholB(); };
window.uWhol = (i, k, v) => { tWhol[i][k] = parseFloat(v) || 0; };

window.submitAdminForm = async () => {
  if (isSaving) return;
  isSaving = true;
  
  let activeTab = window.cModalTab || cTab; 
  let d = {}, f = aF[activeTab] || [];
  
  for (let k of f) {
    if (k.type === 'variants_builder') d.variants = tVars.filter(v => v.name.trim() !== '');
    else if (k.type === 'wholesale_builder') d.wholesale = tWhol.filter(w => w.minQty > 1 && w.price > 0);
    else if (k.type === 'unit_selector') {
      d[k.key] = (getV('af-unit') || '').trim();
    } else if (k.type === 'permissions_builder') {
      const cbs = document.querySelectorAll('.perm-checkbox:checked');
      d[k.key] = Array.from(cbs).map(cb => cb.value);
    } else {
      let v = getV(`af-${k.key}`);
      if (typeof v === 'string') {
        if (v.startsWith('data:image/') && v.length > 300000) {
          isSaving = false;
          return showToast("Gambar Base64 terlalu besar! Upload file.");
        }
        if (k.key === 'img') v = fixD(v);
      }
      d[k.key] = k.type === 'number' ? parseFloat(v) || 0 : v;
    }
  }
  
  if (!d.name && !d.title && !d.bankName && !d.code && !d.username) {
    isSaving = false;
    return showToast("Data penting wajib diisi!");
  }
  
  if (activeTab === 'products') {
    if (!d.sku) d.sku = 'SKU' + Date.now().toString().slice(-6);
    if (d.supplierId) {
      const supp = (appData.suppliers || []).find(s => String(s.id) === String(d.supplierId));
      d.supplierName = supp ? supp.name : '';
    } else {
      d.supplierId = '';
      d.supplierName = '';
    }
  }
  
  if (!appData[activeTab]) appData[activeTab] = [];
  
  if (eId) {
    d.id = eId;
    let i = appData[activeTab].findIndex(x => x.id === eId);
    if (i > -1) appData[activeTab][i] = d;
  } else {
    d.id = Date.now();
    appData[activeTab].unshift(d);
  }
  
  sLoad('Menyimpan...');
  try {
    if (activeTab === 'products') {
      await db.collection("freshmart").doc("cms_data").collection("products").doc(d.id.toString()).set(d);
      appData.lastUpdate = Date.now();
    }
    await saveApp();
    closeAdminModal();
    rAdmItms(cTab);
    showToast("Tersimpan!");
  } catch (e) {
    showToast("Gagal menyimpan!");
  }
  isSaving = false;
  hLoad();
};

window.oADel = async (t, id) => {
  showConfirm("Hapus Data", "Data yang dihapus tidak bisa dikembalikan lagi.", async () => {
    if (isSaving) return;
    isSaving = true;
    appData[t] = appData[t].filter(x => x.id !== id);
    sLoad('Menghapus...');
    try {
      if (t === 'products') {
        await db.collection("freshmart").doc("cms_data").collection("products").doc(id.toString()).delete();
        appData.lastUpdate = Date.now();
        await saveApp();
        cart = cart.filter(i => i.id !== id);
        wishlist = wishlist.filter(i => i.id !== id);
        updCart();
        updWish();
        ssL('freshmart_cart', JSON.stringify(cart));
        ssL('freshmart_wishlist', JSON.stringify(wishlist));
      } else {
        await saveApp();
      }
      rAdmItms(t);
      showToast("Berhasil Dihapus!");
    } catch (e) {
      showToast("Gagal menghapus!");
    }
    isSaving = false;
    hLoad();
  });
};

window.duplicateProduct = async (id) => {
  showConfirm("Duplikat Produk", "Menyalin data produk ini ke item baru?", async () => {
    if (isSaving) return;
    isSaving = true;
    const original = appData.products.find(x => x.id === id);
    if (!original) { isSaving = false; return; }
    let duplicated = JSON.parse(JSON.stringify(original));
    duplicated.id = Date.now() + Math.floor(Math.random() * 1000);
    duplicated.name = duplicated.name + " COPY";
    duplicated.sku = "";
    if (duplicated.variants && duplicated.variants.length > 0) {
      duplicated.variants = duplicated.variants.map(v => { v.sku = ""; return v; });
    }
    appData.products.unshift(duplicated);
    sLoad('Menyalin...');
    try {
      await db.collection("freshmart").doc("cms_data").collection("products").doc(duplicated.id.toString()).set(duplicated);
      appData.lastUpdate = Date.now();
      await saveApp();
      rAdmItms('products');
      showToast("Produk berhasil disalin!");
    } catch (e) {
      showToast("Gagal menyalin!");
    }
    isSaving = false;
    hLoad();
  }, "Ya, Salin", false);
};

window.closeAdminModal = () => {
  el('admin-modal').classList.add('opacity-0');
  el('admin-modal-box').classList.add('scale-95');
  setTimeout(() => hide('admin-modal'), 300);
  window.cModalTab = null;
  eId = null;
};

window.openQuickEditProduct = (id) => {
  const p = (appData.products || []).find(x => x.id === id || String(x.id) === String(id));
  if (!p) return;
  window._currentQuickEditProdId = p.id;
  
  const m = el('quick-edit-modal');
  const box = el('quick-edit-modal-box');
  const cont = el('quick-edit-modal-content');
  const sub = el('qe-product-subtitle');
  if (!m || !box || !cont) return;

  if (sub) sub.innerText = p.name || 'Edit Cepat';

  const hasVars = p.variants && p.variants.length > 0;
  const isOff = p.isActive === 'false' || p.isActive === false;

  let html = `
    <!-- Product Header Info Card -->
    <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
      <img src="${esc(p.img || 'https://placehold.co/100?text=Img')}" onerror="this.src='https://placehold.co/100?text=Img'" class="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"/>
      <div class="min-w-0 flex-1">
        <h4 class="font-bold text-slate-800 dark:text-white text-xs sm:text-sm truncate">${esc(p.name)}</h4>
        <p class="text-[10px] text-slate-400 font-semibold">${esc(p.category || 'Umum')} • SKU: ${esc(p.sku || '-')}</p>
      </div>
    </div>

    <!-- Visibility Toggle -->
    <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
      <div>
        <label class="block text-xs font-bold text-slate-800 dark:text-white">Status Visibilitas Toko Online</label>
        <p class="text-[10px] text-slate-400">Jika nonaktif, produk disembunyikan total dari katalog & pencarian pembeli</p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="qe-is-active" class="sr-only peer" ${!isOff ? 'checked' : ''} />
        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
      </label>
    </div>

    <!-- Unlimited Stock Toggle -->
    <div class="p-3 bg-cyan-50/60 dark:bg-cyan-950/30 rounded-xl border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-between">
      <div>
        <label class="block text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><i class="fa-solid fa-infinity text-cyan-500"></i> Stok Unlimited (Bebas Transaksi)</label>
        <p class="text-[10px] text-slate-400">Jika aktif, produk selalu bisa dijual di kasir & online tanpa batasan kuota stok</p>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" id="qe-is-unlimited" class="sr-only peer" ${p.isUnlimited === true || p.isUnlimited === 'true' ? 'checked' : ''} />
        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-600"></div>
      </label>
    </div>
    <!-- Rekanan Asal Supplier Selector -->
    <div class="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60">
      <label class="block text-xs font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-1.5"><i class="fa-solid fa-truck-field text-amber-500"></i> Rekanan Asal Supplier (Vendor)</label>
      <div class="relative">
        <select id="qe-supplier-id" class="admin-input !py-2.5 !text-xs font-bold w-full appearance-none cursor-pointer bg-white dark:bg-slate-800">
          <option value="">-- Tanpa Supplier Tertaut (Beli Bebas) --</option>
          ${(appData.suppliers || []).map(s => `<option value="${s.id}" ${String(p.supplierId) === String(s.id) ? 'selected' : ''}>${esc(s.name)} ${s.pic ? `(PIC: ${esc(s.pic)})` : ''}</option>`).join('')}
        </select>
        <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
      </div>
    </div>
  `;

  if (!hasVars) {
    html += `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider"><i class="fa-solid fa-tag text-emerald-600 mr-1"></i> Harga Jual (Rp)</label>
        <input type="number" id="qe-price" value="${p.price || 0}" class="admin-input !py-2.5 !text-sm font-bold w-full" placeholder="0" min="0" />
      </div>
      <div>
        <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider"><i class="fa-solid fa-coins text-amber-500 mr-1"></i> HPP / Modal (Rp)</label>
        <input type="number" id="qe-cost-price" value="${p.costPrice || 0}" class="admin-input !py-2.5 !text-sm font-bold w-full" placeholder="0" min="0" />
      </div>
      <div>
        <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider"><i class="fa-solid fa-boxes-stacked text-indigo-500 mr-1"></i> Stok (${esc(p.unit || 'Pcs')})</label>
        <input type="number" id="qe-stock" value="${p.stock ?? 100}" class="admin-input !py-2.5 !text-sm font-bold w-full" placeholder="0" min="0" />
      </div>
    </div>
    `;
  } else {
    html += `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest"><i class="fa-solid fa-layer-group text-indigo-500 mr-1"></i> Edit Cepat Varian Produk (${p.variants.length} Varian)</label>
      </div>
      <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1 hide-scrollbar">
      ${p.variants.map((v, idx) => `
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-xs text-slate-800 dark:text-white truncate">${esc(v.name)}</span>
            <span class="text-[9px] font-mono font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">SKU: ${esc(v.sku || '-')}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <span class="block text-[9px] font-semibold text-slate-400 mb-0.5">Harga (Rp)</span>
              <input type="number" id="qe-var-price-${idx}" value="${v.price || 0}" class="admin-input !py-1.5 !px-2 !text-xs font-bold w-full" min="0" />
            </div>
            <div>
              <span class="block text-[9px] font-semibold text-slate-400 mb-0.5">HPP (Rp)</span>
              <input type="number" id="qe-var-cost-${idx}" value="${v.costPrice || 0}" class="admin-input !py-1.5 !px-2 !text-xs font-bold w-full" min="0" />
            </div>
            <div>
              <span class="block text-[9px] font-semibold text-slate-400 mb-0.5">Stok</span>
              <input type="number" id="qe-var-stock-${idx}" value="${v.stock ?? 100}" class="admin-input !py-1.5 !px-2 !text-xs font-bold w-full" min="0" />
            </div>
          </div>
        </div>
      `).join('')}
      </div>
    </div>
    `;
  }

  cont.innerHTML = html;

  show('quick-edit-modal');
  setTimeout(() => {
    m.classList.remove('opacity-0');
    box.classList.remove('translate-y-full', 'sm:scale-95');
  }, 10);
};

window.closeQuickEditModal = () => {
  const m = el('quick-edit-modal');
  const box = el('quick-edit-modal-box');
  if (!m || !box) return;
  m.classList.add('opacity-0');
  box.classList.add('translate-y-full', 'sm:scale-95');
  setTimeout(() => hide('quick-edit-modal'), 300);
  window._currentQuickEditProdId = null;
};

window.openQuickEditModal = window.openQuickEditProduct;

window.saveQuickEditProduct = async () => {
  const id = window._currentQuickEditProdId;
  if (!id) return;
  const p = (appData.products || []).find(x => x.id === id);
  if (!p) return;

  const isActive = el('qe-is-active') ? el('qe-is-active').checked : true;
  p.isActive = isActive ? 'true' : 'false';

  const isUnlimited = el('qe-is-unlimited') ? el('qe-is-unlimited').checked : false;
  p.isUnlimited = isUnlimited ? 'true' : 'false';

  const hasVars = p.variants && p.variants.length > 0;
  if (!hasVars) {
    p.price = Math.max(0, Number(getV('qe-price') || 0));
    p.costPrice = Math.max(0, Number(getV('qe-cost-price') || 0));
    p.stock = Math.max(0, Number(getV('qe-stock') || 0));
  } else {
    p.variants.forEach((v, idx) => {
      const vP = el(`qe-var-price-${idx}`);
      const vC = el(`qe-var-cost-${idx}`);
      const vS = el(`qe-var-stock-${idx}`);
      if (vP) v.price = Math.max(0, Number(vP.value || 0));
      if (vC) v.costPrice = Math.max(0, Number(vC.value || 0));
      if (vS) v.stock = Math.max(0, Number(vS.value || 0));
    });
    // Set base price & cost to lowest variant
    p.price = Math.min(...p.variants.map(v => v.price));
    p.costPrice = Math.min(...p.variants.map(v => v.costPrice || 0));
  }

  const qeSuppId = getV('qe-supplier-id');
  if (qeSuppId) {
    const sObj = (appData.suppliers || []).find(s => String(s.id) === String(qeSuppId));
    p.supplierId = qeSuppId;
    p.supplierName = sObj ? sObj.name : '';
  } else {
    p.supplierId = '';
    p.supplierName = '';
  }

  sLoad('Menyimpan perubahan...');
  try {
    await db.collection("freshmart").doc("cms_data").collection("products").doc(id.toString()).set(p);
    appData.lastUpdate = Date.now();
    await saveApp();
    rAdmItms('products');
    closeQuickEditModal();
    showToast("Produk berhasil diperbarui!");
  } catch(e) {
    showToast("Gagal menyimpan perubahan!");
  }
  hLoad();
};

window.toggleProductStatus = async (id, toActive) => {
  if (isSaving) return;
  isSaving = true;
  const i = appData.products.findIndex(x => x.id === id);
  if (i > -1) {
    appData.products[i].isActive = toActive ? 'true' : 'false';
    sLoad(toActive ? 'Menampilkan di toko...' : 'Menyembunyikan dari toko...');
    try {
      await db.collection("freshmart").doc("cms_data").collection("products").doc(id.toString()).update({ isActive: toActive ? 'true' : 'false' });
      appData.lastUpdate = Date.now();
      await saveApp();
      rAdmItms('products');
      showToast(toActive ? "Produk Ditampilkan di Toko!" : "Produk Disembunyikan dari Toko!");
    } catch (e) {
      showToast("Gagal update status!");
    }
  }
  isSaving = false;
  hLoad();
};

// =============================================================================
// CMS GUIDE & INTERACTIVE TUTORIAL SYSTEM
// =============================================================================

window.toggleTabHelp = (t) => {
  const b = el(`tab-help-body-${t}`);
  const ic = el(`tab-help-icon-${t}`);
  if (!b) return;
  const isHidden = b.classList.contains('hidden');
  if (isHidden) {
    b.classList.remove('hidden');
    if (ic) ic.style.transform = 'rotate(180deg)';
  } else {
    b.classList.add('hidden');
    if (ic) ic.style.transform = 'rotate(0deg)';
  }
};

window.getTabHelpBanner = (t) => {
  const titles = {
    products: 'Kelola Produk, HPP & Grosir',
    categories: 'Kelola Kategori Produk',
    vouchers: 'Kelola Voucher & Kupon Promo',
    banks: 'Rekening Bank & QRIS Toko',
    banners: 'Kelola Banner Slider Beranda',
    accounts: 'Kelola Kasir & Hak Akses',
    orders: 'Kelola Pesanan Masuk Online',
    reports: 'Laporan Penjualan & Laba Rugi',
    settings: 'Pengaturan Profil & Tampilan Toko',
    stock_opname: 'Stok Opname & Audit Fisik Toko',
    purchases: 'Pembelian Supplier & Buku Hutang'
  };
  
  const snippets = {
    products: `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-bolt text-amber-500"></i> 1. Edit Cepat</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Klik tombol petir kuning untuk update <b>Stok</b>, <b>HPP Modal</b>, dan <b>Harga Jual</b> secara instan.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-box-open text-emerald-500"></i> 2. Stok Kosong</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Produk stok 0 <b>tetap tampil di katalog</b> dengan label <i>Stok Habis</i> agar pelanggan tetap tahu ketersediaannya.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-eye-slash text-rose-500"></i> 3. Nonaktif (Sembunyi)</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Klik tombol mata jika ingin <b>menyembunyikan total</b> produk dari etalase online pembeli.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-layer-group text-indigo-500"></i> 4. Varian & Grosir</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Dukung banyak varian rasa/ukuran dan harga grosir bertingkat dengan diskon otomatis.</p>
        </div>
      </div>
    `,
    reports: `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-wallet text-blue-500"></i> 1. Omset & Modal HPP</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400"><b>Total Omset</b> = Total uang masuk kotor. <b>Modal HPP</b> = Total beban modal pokok dari produk yang terjual.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-arrow-trend-up text-emerald-500"></i> 2. Laba Bersih & Margin</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400"><b>Laba Bersih</b> = Omset dikurangi Beban HPP. Margin (%) menunjukkan efisiensi keuntungan bersih toko Anda.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 sm:col-span-2 md:col-span-1">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-file-excel text-purple-500"></i> 3. Export & Cetak</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Gunakan tombol <b>Cetak</b> untuk arsip PDF nota fisik atau <b>Export CSV</b> untuk olah data di Microsoft Excel.</p>
        </div>
      </div>
    `,
    orders: `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-bell text-rose-500"></i> 1. Pesanan Masuk Real-Time</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Pesanan dari website langsung masuk ke status <b>Baru</b>. Cek rincian barang, kurir, dan bukti pembayaran.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-print text-emerald-500"></i> 2. Cetak Dokumen 1-Klik</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Buka pesanan lalu klik <b>Struk Kasir (58/80mm)</b>, <b>Invoice A4</b>, atau <b>Surat Jalan</b> tanpa ribet.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 sm:col-span-2 md:col-span-1">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-brands fa-whatsapp text-emerald-500"></i> 3. WhatsApp Otomatis</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Klik tombol WhatsApp pada pesanan untuk chat instan konfirmasi pesanan ke nomor pembeli.</p>
        </div>
      </div>
    `,
    settings: `
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-store text-emerald-500"></i> 1. Profil & WhatsApp</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Nama toko, slogan, nomor WhatsApp admin, dan alamat fisik toko dikonfigurasi di sini.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-print text-blue-500"></i> 2. Printer 58mm / 80mm</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Pilih default lebar kertas printer kasir: <b>58mm (mini)</b> atau <b>80mm (supermarket)</b>.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 sm:col-span-2 md:col-span-1">
          <div class="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-1"><i class="fa-solid fa-palette text-purple-500"></i> 3. Tema & Background</div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Pilih warna branding toko dan gaya background non-blur yang tajam dan berkelas.</p>
        </div>
      </div>
    `,
    categories: `
      <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> <b>Tips Kategori</b>: Kelompokkan barang dagangan Anda ke dalam kategori yang jelas (contoh: Makanan, Minuman, Elektronik, ATK) agar pelanggan dan kasir mudah memfilter produk.
      </div>
    `,
    vouchers: `
      <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> <b>Tips Voucher</b>: Anda dapat membuat kode promo potongan persentase (%) atau nominal rupiah (Rp) untuk menarik minat pelanggan berbelanja lebih banyak.
      </div>
    `,
    banks: `
      <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> <b>Tips Rekening</b>: Daftarkan nomor rekening BCA, Mandiri, BRI, atau e-wallet (GoPay, OVO, Dana) agar pelanggan online bisa mentransfer pembayaran dengan mudah saat checkout.
      </div>
    `,
    banners: `
      <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> <b>Tips Banner</b>: Pasang banner promo berukuran rekomendasi <b>1200 x 675 px</b> (16:9) untuk menyapa pelanggan di halaman depan katalog online Anda.
      </div>
    `,
    stock_opname: `
      <div class="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-100 dark:border-cyan-800/60 text-[11px] text-cyan-800 dark:text-cyan-300">
        <i class="fa-solid fa-lightbulb text-cyan-600 mr-1"></i> <b>Tips Stok Opname</b>: Lakukan pencatatan berkala dengan menghitung stok fisik nyata di rak toko. Sistem otomatis menghitung selisih unit dan nilai kerugian/keuntungan (HPP) serta merekam riwayat audit yang dapat dicetak atau diekspor ke format Excel CSV.
      </div>
    `,
    accounts: `
      <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
        <i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> <b>Tips Akun Kasir</b>: Daftarkan akun login untuk petugas kasir Anda. Anda bisa mengatur hak akses kasir agar tidak bisa melihat harga modal (HPP), tidak bisa edit produk, atau hanya bisa transaksi kasir.
      </div>
    `
  };

  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-3.5 sm:p-4 shadow-sm mb-4">
      <div class="flex items-center justify-between cursor-pointer select-none" onclick="toggleTabHelp('${t}')">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-xs font-bold shrink-0">
            <i class="fa-solid fa-lightbulb"></i>
          </div>
          <div>
            <h4 class="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>Panduan Cepat: ${titles[t] || t.toUpperCase()}</span>
            </h4>
            <p class="text-[10px] font-semibold text-slate-400">Klik untuk melihat tips & cara penggunaan fitur ini</p>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button" onclick="event.stopPropagation(); openCmsGuide('${t}')" class="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black hover:bg-emerald-100 transition-all flex items-center gap-1 shadow-sm active:scale-95">
            <i class="fa-solid fa-book-open text-emerald-500"></i> <span class="hidden sm:inline">Panduan Lengkap</span>
          </button>
          <div class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-400 flex items-center justify-center text-xs transition-transform duration-200" id="tab-help-icon-${t}">
            <i class="fa-solid fa-chevron-down"></i>
          </div>
        </div>
      </div>
      <div id="tab-help-body-${t}" class="hidden mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs space-y-2 text-slate-600 dark:text-slate-300">
        ${snippets[t] || ''}
      </div>
    </div>
  `;
};

const guideTopicsData = {
  products: {
    title: 'Panduan Produk, Modal HPP, Edit Cepat & Manajemen Stok',
    icon: 'fa-box-open',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-circle-check"></i> Dasar Pengisian Produk, Modal HPP & Status Toko
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Kelola katalog produk toko Anda secara profesional. Atur harga modal (HPP) untuk perhitungan laba bersih otomatis, harga jual eceran, multi-varian, barcode SKU scanner kasir, hingga visibilitas di etalase toko online.
          </p>
        </div>

        <!-- Highlight Fitur Baru: Edit Cepat & 3 Status Produk -->
        <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
          <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-black text-xs sm:text-sm">
            <i class="fa-solid fa-bolt text-amber-500 text-base"></i>
            <span>FITUR UNGGULAN TERBARU: Edit Cepat & 3 Status Produk</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
              <span class="font-bold text-amber-600 dark:text-amber-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-bolt"></i> Tombol Edit Cepat (Ikon Petir)</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Klik ikon petir kuning pada kartu produk untuk memperbarui <b>Stok</b>, <b>HPP Modal</b>, dan <b>Harga Jual</b> secara instan tanpa perlu membuka form edit yang panjang.</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
              <span class="font-bold text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-box"></i> Stok Kosong (Tetap Tampil)</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Produk dengan stok 0 <b>tetap tampil di katalog online</b> dengan tanda <i>"STOK HABIS"</i> agar pelanggan tahu toko menyediakan produk tersebut saat restok.</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
              <span class="font-bold text-rose-600 dark:text-rose-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-eye-slash"></i> Nonaktif (Disembunyikan)</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Klik ikon mata untuk menonaktifkan barang. Produk nonaktif <b>disembunyikan total</b> dari etalase online dan kasir.</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
              <span class="font-bold text-indigo-600 dark:text-indigo-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-filter"></i> 4 Tab Filter Status</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Filter daftar produk dengan 1 klik: <b>Semua Produk</b>, <b>Aktif Ready</b>, <b>Stok Kosong</b>, atau <b>Nonaktif</b>.</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">1</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Foto & Nama Produk</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Masukkan nama produk yang jelas dan spesifik. Masukkan URL gambar produk beresolusi tajam.</p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">2</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Harga Jual vs Modal (HPP)</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed"><b>Harga Jual</b> = harga beli konsumen. <b>Harga Modal (HPP)</b> = modal kulakan Anda untuk menghitung laba bersih otomatis.</p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">3</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Barcode / SKU Scanner</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Ketik nomor barcode kemasan asli atau buat acak untuk dipindai menggunakan scanner kasir kamera/USB.</p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">4</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Stok Realtime & Satuan</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Tentukan satuan (pcs, pak, botol, box, kg). Setiap transaksi kasir atau order online otomatis memotong stok gudang.</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  variants: {
    title: 'Panduan Multi-Varian & Harga Grosir Bertingkat',
    icon: 'fa-layer-group',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-tags"></i> Menjual Produk Bervariasi & Diskon Grosir Otomatis
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            1 produk dapat memiliki pilihan variasi (ukuran, warna, rasa, kemasan) dengan harga, modal HPP, dan stok terpisah, serta potongan harga grosir bertingkat saat beli banyak.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs shadow-sm font-bold" style="background-color:var(--clr-p)">A</span>
              Cara Menggunakan Multi-Varian:
            </h5>
            <ul class="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <li>Pada form produk, buka bagian <b>Pilihan Varian Produk</b>.</li>
              <li>Klik tombol <b>"+ Tambah Varian"</b>.</li>
              <li>Ketik nama varian (contoh: <i>Ukuran L</i>, <i>Rasa Cokelat</i>, atau <i>Kemasan 1 Kg</i>).</li>
              <li>Isi <b>Harga Jual</b>, <b>Harga Modal HPP</b>, dan <b>Stok</b> tersendiri untuk varian tersebut.</li>
            </ul>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs shadow-sm font-bold" style="background-color:var(--clr-p)">B</span>
              Setting Harga Grosir Bertingkat:
            </h5>
            <ul class="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <li>Pada form produk, buka bagian <b>Harga Grosir Bertingkat</b>.</li>
              <li>Klik tombol <b>"+ Tambah Tier Grosir"</b>.</li>
              <li>Masukkan <b>Min Pembelian</b> (misal: <i>12 pcs</i>) dan <b>Harga Khusus</b> (misal: <i>Rp 15.000</i>).</li>
              <li>Sistem POS Kasir & Toko Online langsung menghitung potongan harga otomatis saat kuota grosir terpenuhi!</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },
  pos: {
    title: 'Panduan Lengkap POS Kasir Toko & Barcode Scanner',
    icon: 'fa-cash-register',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-bolt"></i> Kasir Cepat, Scan Otomatis & Terintegrasi
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            POS Kasir Toko Grafika dirancang untuk transaksi kasir super cepat tanpa jeda. Dilengkapi fitur scan barcode instan, antrian pending/tahan, multi metode bayar, dan cetak struk thermal 58mm/80mm presisi.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">1</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Pilih / Scan Otomatis</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Klik produk dari katalog atau scan barcode dengan kamera / scanner USB (barang otomatis masuk ke keranjang!).</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">2</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Metode Pembayaran Lengkap</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Pilih Tunai (kembalian dihitung otomatis), QRIS dinamis, Transfer Bank, Debit EDC, atau Bayar Nanti.</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">3</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Cetak Struk 58/80mm & A4</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Cetak struk kasir Bluetooth/USB thermal 58mm & 80mm format supermarket, atau invoice A4 resmi.</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm bg-amber-500">4</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Tahan / Pending Antrian</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Simpan antrian saat pembeli mengambil barang tambahan, layani antrian lain, lalu lanjutkan kapan saja.</p>
          </div>
        </div>

        <!-- Panduan Scan Barcode & Input Cepat -->
        <div class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2.5">
          <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
            <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs shadow-sm font-black bg-emerald-600"><i class="fa-solid fa-qrcode"></i></span>
            Fitur Scan Barcode & Keyboard Shortcut Kasir:
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30">
              <span class="font-bold text-emerald-700 dark:text-emerald-300 block mb-1"><i class="fa-solid fa-barcode mr-1"></i> Scanner Fisik USB / Bluetooth</span>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Arahkan scanner ke barcode kemasan barang. Kode langsung terisi di kolom pencarian dan otomatis menambah item ke keranjang dengan suara beep!</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/60 dark:border-emerald-800/30">
              <span class="font-bold text-emerald-700 dark:text-emerald-300 block mb-1"><i class="fa-solid fa-keyboard mr-1"></i> Shortcut Keyboard Kasir</span>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Tekan tombol <b>F4</b> atau <b>Spasi</b> untuk langsung membuka modal pembayaran. Tekan <b>Esc</b> untuk menutup popup.</p>
            </div>
          </div>
        </div>

        <!-- Panduan Pending Transaksi -->
        <div class="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-3">
          <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
            <span class="w-6 h-6 rounded-lg text-slate-900 flex items-center justify-center text-xs shadow-sm font-black bg-amber-400"><i class="fa-solid fa-pause"></i></span>
            Cara Menggunakan Fitur Pending / Tahan Transaksi:
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/60 dark:border-amber-800/30">
              <span class="font-bold text-amber-700 dark:text-amber-400 block mb-1">1. Tahan Keranjang</span>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Klik tombol <b>Tahan</b> di keranjang kasir (atau tab <b>Pending</b> di header). Beri nama pelanggan jika diperlukan.</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/60 dark:border-amber-800/30">
              <span class="font-bold text-amber-700 dark:text-amber-400 block mb-1">2. Layani Antrian Lain</span>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Keranjang kasir seketika bersih. Kasir dapat langsung melayani pelanggan berikutnya tanpa antrian macet.</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200/60 dark:border-amber-800/30">
              <span class="font-bold text-amber-700 dark:text-amber-400 block mb-1">3. Lanjutkan Belanja</span>
              <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Buka tab <b>Pending</b>, lalu klik tombol <b><i class="fa-solid fa-play text-[10px] mr-1 text-emerald-600"></i> Lanjutkan</b> pada antrian yang siap dibayar.</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  print_docs: {
    title: 'Panduan Cetak Struk Kasir (58mm/80mm) & Dokumen A4 Resmi',
    icon: 'fa-print',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-receipt"></i> Standarisasi Struk Kasir Presisi & Dokumen Bisnis Modern
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Toko Grafika mendukung 2 jenis printer thermal kasir (58mm & 80mm) dengan perataan flexbox presisi tinggi tanpa terpotong margin, serta faktur A4 dan surat jalan ekspedisi resmi.
          </p>
        </div>

        <!-- 1. Opsi Printer 58mm vs 80mm -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
            <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs shadow-sm font-bold bg-emerald-600">1</span>
            Pilihan Ukuran Kertas Printer Thermal:
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 shadow-xs">
              <span class="font-bold text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-print"></i> Printer 58mm (Portabel / Mini Bluetooth)</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Lebar kertas 58mm dengan perataan 2 kolom flexbox rata kanan-kiri murni. Sangat cocok untuk printer Bluetooth portabel kasir, booth, atau kurir.</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200/70 dark:border-emerald-800/40 shadow-xs">
              <span class="font-bold text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-print"></i> Printer 80mm (Standar Supermarket/Retail)</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Lebar kertas 80mm dengan layout luas dan lega, standar kasir minimarket, resto, dan retail besar.</p>
            </div>
          </div>
          <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 font-medium">
            <i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> <b>Cara Mengatur Default Printer:</b> Masuk ke menu <b>CMS Toko &gt; Pengaturan Toko</b>, lalu pada bagian <i>Ukuran Kertas Printer</i> pilih 58mm atau 80mm dan klik Simpan. Anda juga bisa beralih instan dengan menekan tombol <b>[58mm]</b> atau <b>[80mm]</b> di jendela preview struk!
          </div>
        </div>

        <!-- 2. Fitur Struk Kasir Supermarket -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
          <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
            <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs shadow-sm font-bold bg-blue-600">2</span>
            Anatomi Struk Kasir Supermarket Otentik:
          </h5>
          <ul class="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
            <li><b>Kop Toko Lengkap:</b> Menampilkan Nama Toko, Slogan, Alamat Lengkap, dan No. WhatsApp CS.</li>
            <li><b>Metadata Transaksi:</b> Nomor struk resmi, waktu hingga detik, nama kasir, dan nama pelanggan.</li>
            <li><b>Daftar Belanja:</b> Baris nama produk, rincian <code>Qty x Harga</code>, dan subtotal yang sejajar rapi.</li>
            <li><b>Rekap Jumlah Item:</b> Menghitung total item dan total kuantitas barang belanjaan secara otomatis.</li>
            <li><b>Banner Hemat Belanja:</b> Menampilkan <code>*** ANDA HEMAT: Rp XX.XXX ***</code> jika transaksi mendapatkan diskon produk atau voucher.</li>
            <li><b>Barcode Visual Code128:</b> Dilengkapi garis barcode visual modern di bagian bawah struk.</li>
          </ul>
        </div>

        <!-- 3. Dokumen A4 Resmi (Faktur & Surat Jalan) -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
            <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs shadow-sm font-bold bg-purple-600">3</span>
            Dokumen Bisnis Standar A4 (Multi-Page Presisi):
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span class="font-bold text-blue-600 dark:text-blue-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-file-invoice"></i> Faktur / Invoice Tagihan</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Dokumen penagihan resmi untuk pelanggan, instansi, atau perusahaan. Memuat kolom Qty angka murni, subtotal, potongan diskon, dan total tagihan.</p>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span class="font-bold text-rose-600 dark:text-rose-400 block mb-1 flex items-center gap-1.5"><i class="fa-solid fa-truck"></i> Surat Jalan Pengiriman</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Dokumen serah terima barang ekspedisi / kurir. Tabel item tanpa nominal harga dan dilengkapi kotak tanda tangan 3-pihak: <i>Penerima, Pengemudi/Kurir, dan Toko</i>.</p>
            </div>
          </div>
          <div class="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-800 dark:text-purple-200 font-medium">
            <i class="fa-solid fa-file-lines text-purple-600 mr-1"></i> <b>Teknologi Multi-Page Diskrit:</b> Berapapun banyaknya barang (hingga 50+ item), sistem otomatis membaginya menjadi Halaman 1, 2, ... N ukuran A4 penuh tanpa ada baris yang terpotong di tengah jalan.
          </div>
        </div>

        <!-- 4. Tombol 1-Klik di Detail Pesanan -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm">
            <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs shadow-sm font-bold bg-amber-600">4</span>
            Akses Cepat 1-Klik dari Menu Pesanan:
          </h5>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Pada setiap detail pesanan, Anda dapat langsung mengklik tombol kartu dokumen atau tombol footer di bagian bawah:
            <br>&bull; <b>Struk Kasir (Hijau)</b>: Membuka preview struk thermal (58mm/80mm).
            <br>&bull; <b>Invoice (Biru)</b>: Membuka pratinjau faktur tagihan A4 PDF.
            <br>&bull; <b>Surat Jalan (Amber)</b>: Membuka pratinjau surat jalan ekspedisi A4 PDF.
          </p>
        </div>
      </div>
    `
  },
  reports: {
    title: 'Panduan Membaca Laporan Penjualan & Laba Rugi',
    icon: 'fa-chart-line',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-coins"></i> Analisis Performa Keuangan & Arus Kas Toko
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Pantau omset penjualan, laba bersih toko, modal HPP yang keluar, serta performa produk terlaris secara realtime dan akurat.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs mb-1"><i class="fa-solid fa-money-bill-wave text-emerald-500 mr-1"></i> Total Omset (Penjualan)</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Total penerimaan kotor dari semua transaksi yang telah lunas pada periode terpilih.</p>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs mb-1"><i class="fa-solid fa-box-archive text-amber-500 mr-1"></i> Total Modal (HPP)</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Total beban modal pokok kulakan dari seluruh produk yang telah berhasil terjual.</p>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-xs mb-1" style="color:var(--clr-p)"><i class="fa-solid fa-sack-dollar mr-1"></i> Laba Bersih & Margin (%)</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Keuntungan bersih murni (Omset dikurangi Modal HPP) beserta rasio persentase keuntungan.</p>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs mb-1"><i class="fa-solid fa-file-excel text-green-600 mr-1"></i> Export Excel CSV & Cetak</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Unduh data pembukuan lengkap ke format Excel CSV atau cetak ringkasan laporan keuangan A4.</p>
          </div>
        </div>
      </div>
    `
  },
  stock_opname: {
    title: 'Panduan Stok Opname, Audit Fisik & Rekonsiliasi Selisih',
    icon: 'fa-clipboard-check',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border bg-cyan-50/60 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/60">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
            <i class="fa-solid fa-clipboard-check"></i> Mengapa Stok Opname Sangat Penting?
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Stok Opname adalah proses mencocokkan stok barang yang tercatat di sistem komputer dengan jumlah fisik nyata barang di rak toko atau gudang. Fitur ini membantu mendeteksi kehilangan barang, barang rusak/expired, salah input kasir, serta menghitung nilai kerugian/keuntungan finansial berdasarkan Modal HPP secara akurat.
          </p>
        </div>

        <div class="space-y-2.5">
          <h5 class="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Langkah-Langkah Melakukan Stok Opname:</h5>
          
          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0">1</div>
            <div>
              <span class="font-bold text-slate-800 dark:text-white text-xs block">Pilih Produk atau Scan Barcode</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Buka menu <b>Stok Opname</b> lalu klik <b>+ Catat Stok Opname</b> (atau klik ikon clipboard di samping kartu produk). Anda bisa memilih produk dari daftar atau langsung scan barcode kemasan barang menggunakan kamera HP maupun scanner barcode fisik USB.</p>
            </div>
          </div>

          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0">2</div>
            <div>
              <span class="font-bold text-slate-800 dark:text-white text-xs block">Input Jumlah Fisik di Rak</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sistem akan menampilkan stok yang tercatat saat ini. Ketikkan jumlah barang hasil hitungan nyata di rak toko Anda.</p>
            </div>
          </div>

          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0">3</div>
            <div>
              <span class="font-bold text-slate-800 dark:text-white text-xs block">Lihat Selisih Unit & Nilai Rupiah Otomatis</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sistem secara otomatis menghitung selisih unit (Minus jika kurang, Plus jika lebih) dan mengalikan selisih tersebut dengan Modal HPP untuk mengetahui nilai rupiah kerugian atau keuntungan barang.</p>
            </div>
          </div>

          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-3">
            <div class="w-6 h-6 rounded-full bg-cyan-500 text-white font-bold text-xs flex items-center justify-center shrink-0">4</div>
            <div>
              <span class="font-bold text-slate-800 dark:text-white text-xs block">Pilih Alasan & Terapkan Penyesuaian</span>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pilih alasan (Barang Rusak, Expired, Selisih Hitung/Hilang, Bonus Supplier, atau Koreksi Saldo Awal). Begitu diklik <b>Terapkan Stok Opname</b>, stok toko otomatis ter-update dan riwayat audit tersimpan rapi.</p>
            </div>
          </div>
        </div>

        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <span class="font-bold text-slate-800 dark:text-white text-xs block mb-1">📄 Ekspor & Cetak Laporan Audit:</span>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Seluruh riwayat penyesuaian stok opname dapat di-filter berdasarkan tanggal/status selisih, dicetak dalam format resmi berita acara fisik, atau diunduh ke <b>Microsoft Excel (CSV)</b> untuk audit bulanan toko.</p>
        </div>
      </div>
    `
  },
  orders: {
    title: 'Panduan Memproses Pesanan Masuk Toko Online',
    icon: 'fa-receipt',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-truck"></i> Mengelola Pesanan Online Masuk Realtime
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Pesanan dari pembeli melalui toko online Anda akan langsung masuk ke menu Pesanan dengan notifikasi badge angka merah.
          </p>
        </div>

        <div class="space-y-3">
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div class="flex items-center gap-2">
              <span class="badge badge-ribbon-inset badge-solid-rose shrink-0">1. BARU</span>
              <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">Pesanan baru masuk dari pembeli. Periksa rincian barang, alamat tujuan kirim, dan konfirmasi bukti bayar.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-ribbon-inset badge-solid-amber shrink-0">2. DIPROSES</span>
              <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">Ubah status ke Diproses saat Anda sedang menyiapkan packing barang atau menyerahkannya ke pihak kurir ekspedisi.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-ribbon-inset badge-solid-emerald shrink-0">3. SELESAI</span>
              <p class="text-xs text-slate-600 dark:text-slate-300 font-medium">Ubah ke Selesai setelah pesanan diterima dengan baik oleh pembeli atau diambil di toko.</p>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06);color:var(--clr-p)">
            <i class="fa-brands fa-whatsapp text-lg"></i>
            <span>Klik tombol WhatsApp pada pesanan untuk langsung chat konfirmasi status pengiriman ke nomor pembeli tanpa simpan kontak!</span>
          </div>
        </div>
      </div>
    `
  },
  purchases: {
    title: 'Panduan Pembelian Supplier, Buku Hutang & Pembayaran',
    icon: 'fa-cart-flatbed',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border bg-teal-50/60 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <i class="fa-solid fa-cart-flatbed"></i> Kelola Pembelian Barang Masuk, Hutang Supplier & HPP Otomatis
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Modul <b>Pembelian & Hutang</b> memudahkan Anda mencatat barang masuk dari distributor, memperbarui stok toko & harga modal (HPP) secara otomatis, memantau tagihan tempo yang mendekati jatuh tempo, hingga mencatat pembayaran cicilan atau titipan dana.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <span class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black bg-emerald-600">1</span>
              Input Faktur & Tambah Stok:
            </span>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Klik <b>+ Input Pembelian Baru</b>, pilih Supplier, cari/scan produk yang dibeli, isi jumlah (qty) dan harga beli satuan. Saat disimpan, <b>stok etalase & POS bertambah otomatis</b> dan HPP produk ikut terupdate.
            </p>
          </div>

          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <span class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black bg-amber-600">2</span>
              Pembelian CASH vs TEMPO:
            </span>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pilih <b>CASH</b> jika pembelian langsung lunas, atau pilih <b>TEMPO</b> jika pembayaran bertahap. Tentukan termin (7, 14, 30 hari atau custom) dan isi uang muka/DP awal jika ada.
            </p>
          </div>

          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <span class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black bg-indigo-600">3</span>
              Buku Hutang & Catat Cicilan:
            </span>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pada tab <b>Buku Hutang</b>, pantau tagihan yang belum lunas dan yang lewat jatuh tempo. Klik tombol <b>Catat Pembayaran</b> untuk mencatat uang titipan/transfer cicilan hingga lunas.
            </p>
          </div>

          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <span class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black bg-cyan-600">4</span>
              Kontak Supplier & Rekap:
            </span>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Kelola nomor WhatsApp sales, alamat, dan rekening bank supplier di tab <b>Data Supplier</b>. Lihat rekapitulasi total belanja dan sisa kewajiban di tab <b>Rekap Keuangan</b>.
            </p>
          </div>
        </div>

        <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <span class="font-bold text-slate-800 dark:text-white text-xs block"><i class="fa-solid fa-lightbulb text-amber-500 mr-1"></i> Tips Efisiensi:</span>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Gunakan barcode scanner fisik USB atau tombol scan kamera di kolom pencarian produk untuk memasukkan barang masuk secara kilat tanpa perlu memilih satu per satu di dropdown!
          </p>
        </div>
      </div>
    `
  },
  unlimited_stock: {
    title: 'Panduan Transaksi Bebas / Tanpa Stok (Unlimited Stock)',
    icon: 'fa-infinity',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border bg-cyan-50/60 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800/60">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
            <i class="fa-solid fa-infinity"></i> Bebas Transaksi Tanpa Terhalang Kuota Stok
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Fitur <b>Mode Stok Unlimited</b> memungkinkan toko melayani penjualan produk jasa (seperti <i>Jasa Desain, Digital Print, Sablon, Pre-Order, Sewa, atau Kursus</i>) maupun barang retail tanpa batasan kuota stok. Transaksi di kasir POS dan toko online tidak akan pernah terblokir oleh validasi stok kosong.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <span class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black bg-cyan-600">1</span>
              Tingkat Toko (Global Setting):
            </span>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Buka menu <b>Pengaturan Toko</b>, lalu pada bagian <i>Mode Manajemen Stok Toko</i> pilih <b>Mode Bebas Stok (Unlimited)</b>. Seluruh produk toko seketika dapat ditransaksikan bebas di kasir & online tanpa pengurangan stok ke angka minus.
            </p>
          </div>

          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <span class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
              <span class="w-6 h-6 rounded-lg text-white flex items-center justify-center text-xs font-black bg-indigo-600">2</span>
              Tingkat Satuan Produk (Per-Item):
            </span>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Jika toko tetap ingin mencatat stok untuk barang fisik, Anda dapat mengaktifkan toggle <b>Stok Unlimited (Bebas Transaksi)</b> hanya pada item produk tertentu via tombol <b>Edit Cepat ⚡</b> atau form edit produk.
            </p>
          </div>
        </div>

        <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
          <span class="font-bold text-slate-800 dark:text-white text-xs block"><i class="fa-solid fa-circle-info text-cyan-500 mr-1"></i> Tampilan di Kasir & Toko Online:</span>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Produk bertipe unlimited akan diberi badge <b><i class="fa-solid fa-infinity text-cyan-500 text-[10px]"></i> Stok Bebas</b> di kasir POS dan tidak akan pernah berstatus <i>"STOK HABIS"</i> di katalog toko online, sehingga pelanggan dapat langsung memesan tanpa hambatan.
          </p>
        </div>
      </div>
    `
  },
  barcode_scanner: {
    title: 'Panduan Scanner Barcode Kamera, USB Scanner & SKU Auto',
    icon: 'fa-barcode',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-barcode"></i> Efisiensi Kasir dengan Barcode Scanner & SKU Cerdas
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Toko Grafika mendukung pemindaian barcode instan dari kamera smartphone, scanner barcode fisik USB/Bluetooth kasir, hingga pembuatan nomor barcode SKU otomatis dalam 1-klik.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5"><i class="fa-solid fa-camera text-emerald-500"></i> Scanner Kamera HP</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Klik ikon QR/Barcode di samping kolom pencarian atau input SKU untuk membuka kamera dan memindai kemasan barang langsung tanpa alat tambahan.</p>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5"><i class="fa-solid fa-barcode text-indigo-500"></i> Scanner Fisik USB / BT</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Colokkan barcode scanner USB ke komputer kasir. Setiap kali barcode ditembak, item langsung otomatis masuk ke keranjang kasir POS dengan notifikasi suara!</p>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5"><i class="fa-solid fa-wand-magic-sparkles text-amber-500"></i> Auto SKU Generator</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Jika produk tidak memiliki barcode pabrik, klik tombol <b>Auto SKU</b> saat membuat produk atau varian untuk menghasilkan kode barcode unik otomatis.</p>
          </div>
        </div>
      </div>
    `
  },
  pwa_app: {
    title: 'Panduan Aplikasi Mobile PWA (Install di Android & iOS)',
    icon: 'fa-mobile-screen-button',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <i class="fa-solid fa-mobile-screen"></i> Pasang Toko Grafika Sebagai Aplikasi di Layar HP
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Toko Grafika telah mengadopsi teknologi <b>Progressive Web App (PWA)</b> generasi terbaru. Aplikasi dapat di-install langsung ke layar utama smartphone tanpa perlu mengunduh dari Google Play Store atau Apple App Store.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs"><i class="fa-brands fa-android text-emerald-500 text-sm"></i> Cara Install di HP Android:</h5>
            <ol class="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <li>Buka website <b>tokogrosir.id</b> di Google Chrome.</li>
              <li>Klik tombol <b>"Install Aplikasi"</b> yang muncul di layar (atau tekan menu titik 3 di pojok kanan atas Chrome).</li>
              <li>Pilih <b>"Tambahkan ke Layar Utama" / "Install Aplikasi"</b>.</li>
              <li>Ikon Toko Grafika akan langsung muncul di homescreen HP Anda dan siap digunakan seperti aplikasi kasir profesional!</li>
            </ol>
          </div>

          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs"><i class="fa-brands fa-apple text-slate-800 dark:text-white text-sm"></i> Cara Install di iPhone (iOS):</h5>
            <ol class="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <li>Buka website <b>tokogrosir.id</b> di browser Safari.</li>
              <li>Tekan tombol <b>Share</b> (ikon kotak dengan panah ke atas di bagian bawah Safari).</li>
              <li>Gulir ke bawah dan pilih <b>"Add to Home Screen" (Tambah ke Layar Utama)</b>.</li>
              <li>Tekan <b>Add</b> di pojok kanan atas. Aplikasi siap dibuka dalam mode layar penuh!</li>
            </ol>
          </div>
        </div>
      </div>
    `
  },
  settings: {
    title: 'Panduan Pengaturan Toko, Rekening & Akun Kasir',
    icon: 'fa-gear',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-sliders"></i> Konfigurasi Sistem & Hak Akses Kasir
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Atur identitas toko, nomor WhatsApp admin, rekening bank & QRIS dinamis, voucher promo, banner slider promo, hingga pembatasan hak akses akun kasir.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs mb-1 flex items-center gap-1.5"><i class="fa-solid fa-store" style="color:var(--clr-p)"></i> Profil & Kontak</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Atur Nama Toko, Slogan, Alamat Lengkap, dan Nomor WhatsApp CS untuk menerima pesanan online.</p>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs mb-1 flex items-center gap-1.5"><i class="fa-solid fa-credit-card" style="color:var(--clr-p)"></i> Rekening & QRIS</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Daftarkan rekening bank / e-wallet dan upload foto barcode QRIS pembayaran toko Anda.</p>
          </div>
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs mb-1 flex items-center gap-1.5"><i class="fa-solid fa-user-shield" style="color:var(--clr-p)"></i> Hak Akses Kasir</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Buat akun kasir dengan PIN khusus dan batasi akses agar kasir tidak dapat melihat modal (HPP) dan laporan laba.</p>
          </div>
        </div>
      </div>
    `
  }
};

window.openCmsGuide = (topic = 'products') => {
  const m = el('cms-guide-modal');
  const box = el('cms-guide-modal-box');
  if (!m || !box) return;
  m.classList.remove('hidden');
  setTimeout(() => {
    m.classList.remove('opacity-0');
    box.classList.remove('translate-y-full');
    box.classList.remove('sm:scale-95');
  }, 10);
  window.showGuideTopic(topic);
};

window.closeCmsGuide = () => {
  const m = el('cms-guide-modal');
  const box = el('cms-guide-modal-box');
  if (!m || !box) return;
  m.classList.add('opacity-0');
  box.classList.add('translate-y-full');
  box.classList.add('sm:scale-95');
  setTimeout(() => m.classList.add('hidden'), 300);
};

window.showGuideTopic = (topic) => {
  let target = topic;
  if (!guideTopicsData[target]) {
    if (target === 'categories' || target === 'vouchers' || target === 'banks' || target === 'banners' || target === 'accounts') {
      target = 'settings';
    } else {
      target = 'products';
    }
  }

  // Update active pill button with dynamic theme styling
  document.querySelectorAll('.guide-topic-btn').forEach(btn => {
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.classList.remove('shadow-sm', 'text-white');
    btn.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-200/60', 'dark:hover:bg-slate-800');
  });

  const activeBtn = el(`guide-btn-${target}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-200/60', 'dark:hover:bg-slate-800');
    activeBtn.classList.add('shadow-sm', 'text-white');
    activeBtn.style.backgroundColor = 'var(--clr-p)';
    activeBtn.style.color = '#ffffff';
  }

  const data = guideTopicsData[target];
  const container = el('cms-guide-content');
  if (container && data) {
    container.innerHTML = `
      <div class="space-y-4 fade-in">
        <div class="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-700/60">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm" style="background-color:var(--clr-p-bg);color:var(--clr-p)">
            <i class="fa-solid ${data.icon}"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">${data.title}</h4>
            <p class="text-[10px] sm:text-xs text-slate-400 font-medium">Panduan resmi penggunaan fitur Toko Grafika</p>
          </div>
        </div>
        ${data.content}
      </div>
    `;
  }
};


