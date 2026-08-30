// =============================================================================
// FRESHMART ADMIN DASHBOARD & CMS MODULE
// =============================================================================

const aF = {
  products: [
    { key: 'name', label: 'Nama Produk', type: 'text' }, 
    { key: 'sku', label: 'Barcode / SKU (Bisa Auto / Manual)', type: 'sku' },
    { key: 'price', label: 'Harga Jual Dasar (Rp)', type: 'number' }, 
    { key: 'costPrice', label: 'Harga Modal / HPP (Rp)', type: 'number' }, 
    { key: 'unit', label: 'Satuan (cth: pcs, kg, lusin)', type: 'unit_selector' },
    { key: 'img', label: 'URL Gambar', type: 'text' },
    { key: 'category', label: 'Kategori', type: 'dynamic_select_category' }, 
    { key: 'tag', label: 'Label/Tag', type: 'text' },
    { key: 'isActive', label: 'Status', type: 'select', options: [{ val: 'true', text: 'Tersedia' }, { val: 'false', text: 'Habis' }] },
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
    { key: 'permissions', label: 'Hak Akses Fitur (Dicentang = Boleh)', type: 'permissions_builder' }
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
        if (isSensitive || !cPerms.includes(tabName)) {
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
      showToast(`Selamat bertugas, ${kasir.name}! 🛒`);
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
      showToast("Membuka POS Kasir (Mode Admin) 🛒");
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
    if (isSensitive || !cPerms.includes(t)) {
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
  
  const lockedTabs = ['settings', 'vouchers', 'banks', 'banners', 'accounts'];
  if (!isPro && lockedTabs.includes(t)) {
    hide('admin-dashboard-view'); 
    show('admin-content-view'); 
    show('btn-admin-back'); 
    hide('admin-logo-box'); 
    setIn('admin-header-title', 'Akses Terkunci');
    setH('admin-content', `
    <div class="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/30 shadow-sm px-6 max-w-lg mx-auto mt-4">
      <div class="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fa-solid fa-lock text-3xl"></i>
      </div>
      <h2 class="text-base font-bold text-slate-900 dark:text-white mb-2">Fitur Terkunci (Versi PRO)</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-bold mb-6">Menu <b>${t.toUpperCase()}</b> hanya untuk pengguna PRO. Masukkan kode lisensi Anda.</p>
      <div class="max-w-xs mx-auto flex flex-col gap-3">
        <input id="pro-license-input" type="text" placeholder="KODE LISENSI..." class="admin-input !py-3 text-center uppercase tracking-widest font-semibold text-xs"/>
        <button onclick="activatePro()" class="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-3 rounded-xl shadow-sm transition-all text-xs border border-amber-500">
          <i class="fa-solid fa-key mr-1.5"></i> Aktivasi Sekarang
        </button>
      </div>
    </div>
    `);
    return;
  }
  
  hide('admin-dashboard-view'); 
  show('admin-content-view'); 
  show('btn-admin-back'); 
  hide('admin-logo-box');
  const titles = { 'orders': 'Daftar Pesanan', 'settings': 'Pengaturan Toko', 'products': 'Kelola Produk', 'categories': 'Kelola Kategori', 'vouchers': 'Kelola Voucher', 'banks': 'Rekening Bank', 'banners': 'Kelola Banner', 'accounts': 'Kelola Akun Kasir' };
  setIn('admin-header-title', titles[t] || 'CMS Toko');
  
  if (t !== 'orders' && aOrdLst) { aOrdLst(); aOrdLst = null; }
  if (t === 'settings') rAdmSet(); 
  else if (t === 'orders') rAdmOrd(); 
  else rAdmL(t);
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

const rAdmOrd = () => {
  setH('admin-content', `
    <div class="mb-4 flex justify-between items-center px-1">
      <h2 class="font-semibold text-sm text-slate-800 dark:text-slate-200">Daftar Pesanan <i class="fa-solid fa-satellite-dish animate-pulse text-emerald-500 ml-1"></i></h2>
    </div>
    
    <div id="admin-orders-list" class="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-12">
      <div class="col-span-full text-center py-12"><i class="fa-solid fa-spinner fa-spin text-2xl text-emerald-500"></i></div>
    </div>
  `);

  const s = () => {
    if (aOrdLst) { aOrdLst(); aOrdLst = null; }
    
    aOrdLst = db.collection("freshmart_orders").orderBy("timestamp", "desc").limit(300).onSnapshot(p => {
      gOrds = [];
      if (p.empty) {
        setH('admin-orders-list', `<div class="col-span-full text-center py-16 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-[1.5rem] border-2 border-slate-200 dark:border-slate-700 shadow-sm"><i class="fa-solid fa-receipt text-4xl mb-3 opacity-40 block"></i>Belum ada pesanan</div>`);
        setIn('stat-orders', 0);
        return;
      }
      setIn('stat-orders', p.size + (p.size >= 300 ? '+' : ''));

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
        <div class="bg-white dark:bg-slate-800 rounded-[1.5rem] p-5 border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative group flex flex-col gap-4 overflow-hidden" onclick="openOrderDetail('${o.orderId}')">
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
  </div>
  `);
  
  show('admin-order-modal');
  setTimeout(() => {
    el('admin-order-modal').classList.remove('opacity-0');
    el('admin-order-modal-box').classList.remove('scale-95');
  }, 10);
};

window.closeOrderDetailModal = () => { 
  const menu = el('print-options-menu'); 
  if (menu) menu.classList.add('hidden'); 
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
  <div class="space-y-6 max-w-4xl mx-auto pb-10">

    <div class="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      
      <h3 class="font-bold text-slate-800 dark:text-white mb-6 border-b-2 border-slate-100 dark:border-slate-700 pb-4 flex items-center gap-3 text-base sm:text-lg">
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
                <option value="true" ${appData.store.isDeliveryEnabled !== !1 ? 'selected' : ''}>✅ Aktif</option>
                <option value="false" ${appData.store.isDeliveryEnabled === !1 ? 'selected' : ''}>❌ Nonaktif</option>
              </select>
              <i class="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[10px]"></i>
            </div>
          </div>
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-person-walking text-emerald-500 mr-1"></i> Ambil di Toko</label>
            <div class="relative">
              <select id="set-pickup-enabled" class="admin-input cursor-pointer !py-3 appearance-none w-full font-bold">
                <option value="true" ${appData.store.isPickupEnabled !== !1 ? 'selected' : ''}>✅ Aktif</option>
                <option value="false" ${appData.store.isPickupEnabled === !1 ? 'selected' : ''}>❌ Nonaktif</option>
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

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-list-ul text-emerald-600 mr-1"></i> Desain Menu Kategori</label>
            <div class="relative">
              <select id="set-category-style" class="admin-input cursor-pointer !py-3 appearance-none w-full font-bold">
                <option value="image" ${appData.store.categoryStyle !== 'text' ? 'selected' : ''}>Kartu Gambar (Visual)</option>
                <option value="text" ${appData.store.categoryStyle === 'text' ? 'selected' : ''}>Teks Pill (Minimalis)</option>
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
  let stats = '';
  if (t === 'products') {
    stats = `<div id="admin-product-stats" class="mb-4"></div>`;
  } else if (t === 'banners') {
    stats = `
    <div class="mb-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
          <i class="fa-solid fa-panorama"></i>
        </div>
        <div>
          <h4 class="font-bold text-slate-800 dark:text-white text-sm sm:text-base">Panduan Banner Landscape & Ukuran Presisi</h4>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Format banner otomatis menyesuaikan frame layar tanpa terpotong atau gepeng</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
        <div class="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <p class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1"><i class="fa-solid fa-crop-simple text-emerald-500"></i> Rasio Ideal (16:9 / 21:9)</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Rekomendasi: <b>1200 x 675 px</b> (16:9) atau <b>1200 x 514 px</b> (21:9) untuk tampilan landscape penuh.</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <p class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1"><i class="fa-solid fa-wand-magic-sparkles text-emerald-500"></i> Auto-Fit & Responsive</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Gambar landscape otomatis menyesuaikan lebar layar HP & Desktop (<i>object-cover</i> presisi).</p>
        </div>
        <div class="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <p class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1"><i class="fa-solid fa-image text-emerald-500"></i> Mode Gambar Murni</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Jika banner sudah memuat teks/desain, kosongkan kolom judul agar banner tampil bersih.</p>
        </div>
      </div>
    </div>`;
  }

  setH('admin-content', stats + `<div class="mb-5 flex flex-col sm:flex-row gap-3 items-center"><div class="relative w-full flex-1"><i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i><input id="admin-search-input" placeholder="Cari nama, SKU..." oninput="clearTimeout(window._admST);window._admST=setTimeout(()=>{aSq=this.value.toLowerCase();rAdmItms('${t}')},250)" class="admin-input !pl-10 !pr-[2.5rem] !py-3 !text-sm !rounded-xl shadow-sm" /><button onclick="openCameraScanner('admin-search-input')" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"><i class="fa-solid fa-qrcode text-sm"></i></button></div><button onclick="oAAdd()" class="w-full sm:w-auto bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm shadow-md border-2 border-emerald-700"><i class="fa-solid fa-plus"></i> Tambah Baru</button></div><div id="admin-list-container" class="space-y-3 pb-12"></div>`);
  rAdmItms(t);
};

window.rAdmItms = t => {
  window.aPrtSort = window.aPrtSort || 'all';
  
  if (t === 'products') {
    let a = 0, i = 0;
    (appData.products || []).forEach(p => {
      if (p.isActive === 'false' || p.isActive === false) i++;
      else a++;
    });
    let s = el('admin-product-stats');
    if (s) {
      let acSt = window.aPrtSort === 'active' ? 'ring-2 ring-emerald-500 scale-[1.02] shadow-md' : 'opacity-70 hover:opacity-100';
      let inSt = window.aPrtSort === 'inactive' ? 'ring-2 ring-rose-500 scale-[1.02] shadow-md' : 'opacity-70 hover:opacity-100';
      s.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        <div onclick="window.aPrtSort=window.aPrtSort==='active'?'all':'active';rAdmItms('products')" class="cursor-pointer bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-[1.25rem] p-3 sm:p-4 flex items-center gap-3 transition-all ${acSt}">
          <div class="w-10 h-10 rounded-xl bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0"><i class="fa-solid fa-box-open text-lg"></i></div>
          <div><p class="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Produk Aktif</p><h4 class="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300 leading-none">${a}</h4></div>
        </div>
        <div onclick="window.aPrtSort=window.aPrtSort==='inactive'?'all':'inactive';rAdmItms('products')" class="cursor-pointer bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-[1.25rem] p-3 sm:p-4 flex items-center gap-3 transition-all ${inSt}">
          <div class="w-10 h-10 rounded-xl bg-rose-200/50 dark:bg-rose-800/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0"><i class="fa-solid fa-ban text-lg"></i></div>
          <div><p class="text-[9px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-0.5">Kosong / Nonaktif</p><h4 class="text-lg sm:text-xl font-bold text-rose-700 dark:text-rose-300 leading-none">${i}</h4></div>
        </div>
      </div>`;
    }
  }
  
  let rawList = [...(appData[t] || [])];
  rawList.sort((a, b) => {
    if (t === 'products' && window.aPrtSort !== 'all') {
      let aOff = (a.isActive === 'false' || a.isActive === false) ? 1 : 0;
      let bOff = (b.isActive === 'false' || b.isActive === false) ? 1 : 0;
      if (window.aPrtSort === 'inactive' && aOff !== bOff) return bOff - aOff;
      if (window.aPrtSort === 'active' && aOff !== bOff) return aOff - bOff;
    }
    return (b.id || 0) - (a.id || 0);
  });
  
  let i = rawList.filter(x => {
    let m = (x.name || x.title || x.code || x.bankName || x.sku || '').toLowerCase().includes(aSq);
    if (t === 'products' && !m && x.variants) m = x.variants.some(v => v.sku && v.sku.toLowerCase().includes(aSq));
    return m;
  });
  
  if (!i.length) return setH('admin-list-container', `<div class="text-center py-16 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm"><i class="fa-solid fa-folder-open text-4xl mb-3 opacity-40 block"></i>Data tidak ditemukan</div>`);

  setH('admin-list-container', i.map(x => {
    let isP = t === 'products';
    let isOff = isP && (x.isActive === 'false' || x.isActive === false);
    
    let bC = isOff ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800';
    let tC = isOff ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200';
    let badg = isOff ? `<span class="badge badge-ribbon-inset badge-solid-rose">KOSONG</span>` : '';
    
    let img = x.img 
      ? `<div class="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0"><img loading="lazy" src="${esc(x.img)}" onerror="this.onerror=null;this.src='https://placehold.co/100?text=Img'" class="w-full h-full rounded-xl object-cover border-2 border-slate-100 dark:border-slate-700 ${isOff?'grayscale opacity-60':''} shadow-sm"/>${badg}</div>` 
      : `<div class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-50 dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-400 shrink-0 shadow-sm"><i class="fa-solid fa-image text-xl"></i>${badg}</div>`;
    
    let tglBtn = isP 
      ? (isOff 
        ? `<button class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm" onclick="event.stopPropagation(); toggleProductStatus(${x.id}, true)" title="Aktifkan Stok"><i class="fa-solid fa-check text-sm"></i></button>` 
        : `<button class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 text-amber-600 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center shadow-sm" onclick="event.stopPropagation(); toggleProductStatus(${x.id}, false)" title="Kosongkan Stok"><i class="fa-solid fa-ban text-sm"></i></button>`) 
      : '';
    
    let skuBadge = isP && x.sku ? `<span class="badge badge-xs badge-slate badge-normal-case"><i class="fa-solid fa-barcode"></i> ${esc(x.sku)}</span>` : '';
    let varsBadge = isP && x.variants && x.variants.length ? `<span class="badge badge-xs badge-indigo">${x.variants.length} Varian</span>` : '';
    let wholBadge = isP && x.wholesale && x.wholesale.length ? `<span class="badge badge-xs badge-purple"><i class="fa-solid fa-tags"></i> Grosir</span>` : '';
    
    return `
    <div class="p-4 sm:p-5 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer border-2 ${bC} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 gap-4 group" onclick="oAEd('${t}',${x.id})">
      <div class="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0 flex-1">
        ${img}
        <div class="min-w-0 flex flex-col justify-center">
          <p class="text-sm sm:text-base font-bold ${tC} truncate mb-1">${esc(x.name||x.title||x.bankName||x.code||'Item')}</p>
          ${isP ? `
          <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm drop-shadow-sm">${fCur(x.price)}</span>
            ${skuBadge}
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${varsBadge}
            ${wholBadge}
          </div>
          ` : ''}
        </div>
      </div>
      <div class="flex items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-100 dark:border-slate-700 sm:border-t-0 shrink-0 justify-end">
        ${tglBtn}
        ${isP ? `<button class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm" onclick="event.stopPropagation(); duplicateProduct(${x.id})" title="Duplikat Produk"><i class="fa-solid fa-copy text-sm"></i></button>` : ''}
        <button class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-800 hover:text-white dark:hover:bg-white dark:hover:text-slate-800 transition-all flex items-center justify-center shadow-sm" onclick="event.stopPropagation(); oAEd('${t}',${x.id})" title="Edit Detail"><i class="fa-solid fa-pen text-sm"></i></button>
        <button class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm" onclick="event.stopPropagation(); oADel('${t}',${x.id})" title="Hapus Permanen"><i class="fa-solid fa-trash text-sm"></i></button>
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
      name: 'fa-box-open', sku: 'fa-barcode', price: 'fa-tag', costPrice: 'fa-coins', unit: 'fa-ruler', img: 'fa-image',
      category: 'fa-layer-group', tag: 'fa-hashtag', isActive: 'fa-power-off',
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
        {id: 'orders', name: 'Kelola Pesanan'}, {id: 'products', name: 'Kelola Produk'},
        {id: 'categories', name: 'Kategori'}, {id: 'vouchers', name: 'Voucher'}, {id: 'banners', name: 'Banner'}
      ];
      let vArr = Array.isArray(v) ? v : [];
      h += `<div class="grid grid-cols-2 gap-2 mt-1">`;
      availPerms.forEach(p => {
        const isChecked = vArr.includes(p.id) ? 'checked' : '';
        h += `<label class="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-400 transition-all shadow-sm"><input type="checkbox" value="${p.id}" class="perm-checkbox w-4 h-4 text-emerald-600 rounded border-gray-300" ${isChecked}/> ${p.name}</label>`;
      });
      h += `</div><p class="text-[9px] text-slate-400 mt-2 italic font-medium">*Pengaturan Toko, Rekening, dan Kelola Akun otomatis terkunci untuk Kasir.</p>`;
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
      h += `<div class="relative">
        <input type="number" min="0" step="1" id="af-${k.key}" value="${esc(v)}" oninput="updateProductMarginPreview()" class="admin-input !py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 w-full focus:bg-white dark:focus:bg-slate-800 transition-all font-bold" placeholder="Masukkan harga modal (HPP)..."/>
        <div id="product-margin-preview" class="mt-2 text-[11px] font-bold"></div>
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
    setTimeout(updateProductMarginPreview, 50);
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
  let h = `<div class="space-y-3 mb-4">` + tVars.map((v, i) => {
    const profit = (parseFloat(v.price) || 0) - (parseFloat(v.costPrice) || 0);
    const marginPct = (v.price > 0 && profit > 0) ? Math.round((profit / v.price) * 100) : 0;
    return `
    <div class="bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/40 shadow-sm relative overflow-hidden group">
      <div class="flex items-center justify-between mb-3 border-b-2 border-slate-50 dark:border-slate-700 pb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><i class="fa-solid fa-sitemap"></i> Varian ${i+1}</span>
          ${(parseFloat(v.costPrice) || 0) > 0 ? `<span class="text-[9px] px-2 py-0.5 rounded-full font-black ${profit >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700'}">Laba: ${fCur(profit)} (${marginPct}%)</span>` : ''}
        </div>
        <button onclick="rmVar(${i})" class="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center" title="Hapus Varian"><i class="fa-solid fa-xmark text-sm"></i></button>
      </div>
      
      <div class="space-y-2.5">
        <!-- Row 1: Nama Varian -->
        <div>
          <input placeholder="Nama Varian (Cth: 22 Oz / Merah / 1 Kg)" class="admin-input !py-2.5 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold w-full" value="${esc(v.name)}" onchange="uVar(${i},'name',this.value)"/>
        </div>

        <!-- Row 2: Harga Jual & Harga Modal / HPP -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[9px] font-bold text-slate-500 block mb-1">HARGA JUAL (Rp)</label>
            <div class="relative">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
              <input placeholder="0" type="number" min="0" class="admin-input !py-2 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold" value="${v.price || ''}" oninput="uVar(${i},'price',this.value); rVarsB();"/>
            </div>
          </div>
          <div>
            <label class="text-[9px] font-bold text-slate-500 block mb-1">MODAL / HPP (Rp)</label>
            <div class="relative">
              <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Rp</span>
              <input placeholder="0" type="number" min="0" class="admin-input !py-2 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-bold" value="${v.costPrice || ''}" oninput="uVar(${i},'costPrice',this.value); rVarsB();"/>
            </div>
          </div>
        </div>

        <!-- Row 3: SKU with Auto Generator & Foto Varian -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div class="relative flex items-center gap-1">
            <div class="relative flex-1">
              <input id="var-sku-${i}" placeholder="SKU Barcode" class="admin-input !py-2.5 !pr-7 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 font-mono text-xs w-full font-bold" value="${esc(v.sku||'')}" onchange="uVar(${i},'sku',this.value)"/>
              <button type="button" onclick="openCameraScanner('var-sku-${i}')" class="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-emerald-600 rounded transition-all" title="Scan Barcode"><i class="fa-solid fa-qrcode text-[10px]"></i></button>
            </div>
            <button type="button" onclick="generateAutoVarSku(${i})" class="px-2.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-[10px] shrink-0 transition-all flex items-center gap-1" title="Auto SKU Varian"><i class="fa-solid fa-wand-magic-sparkles text-[9px]"></i> <span>Auto</span></button>
          </div>
          <div class="flex gap-1.5">
            <input id="var-img-${i}" placeholder="URL Gambar Varian" class="admin-input !py-2.5 !text-xs flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 min-w-0" value="${esc(v.img||'')}" onchange="uVar(${i},'img',this.value)"/>
            <label onclick="if(window.AppInventor){ event.preventDefault(); window.AppInventor.setWebViewString('BUKA_GALERI|||var-img-${i}|||${i}'); }" class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-200 dark:border-emerald-800 rounded-xl w-10 flex items-center justify-center cursor-pointer hover:bg-emerald-600 hover:text-white transition-all shrink-0"><i class="fa-solid fa-image text-[11px]"></i><input type="file" accept="image/*" class="hidden" onchange="handleImageUpload(this, 'var-img-${i}', ${i})" /></label>
          </div>
        </div>
      </div>
    </div>`;
  }).join('') + `</div>
  <button onclick="addVar()" class="w-full py-3.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-bold rounded-xl text-[10px] uppercase tracking-widest border-2 border-emerald-200 dark:border-emerald-800 border-dashed hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"><i class="fa-solid fa-plus text-sm"></i> Tambah Varian Produk</button>`;
  setH('variants-builder-container', h);
};

window.addVar = () => { tVars.push({ name: '', price: 0, costPrice: 0, sku: '', img: '' }); rVarsB(); };
window.rmVar = i => { tVars.splice(i, 1); rVarsB(); };
window.uVar = (i, k, v) => { 
  tVars[i][k] = (k === 'price' || k === 'costPrice') ? parseFloat(v) || 0 : (k === 'img' ? fixD(v) : v); 
};

window.rWholB = () => {
  let h = `<div class="space-y-3 mb-4">` + tWhol.map((w, i) => `
  <div class="flex gap-2 items-center bg-white dark:bg-slate-800 p-3 rounded-2xl border-2 border-amber-100 dark:border-amber-800/40 shadow-sm relative overflow-hidden">
    <div class="flex-1 flex gap-2 items-center relative z-10">
      <div class="relative w-1/3">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-amber-500">>=</span>
        <input type="number" placeholder="Min. Qty" class="admin-input !py-2.5 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" value="${w.minQty}" onchange="uWhol(${i},'minQty',this.value)"/>
      </div>
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-amber-500">Rp</span>
        <input type="number" placeholder="Harga Satuan Grosir" class="admin-input !py-2.5 !pl-8 !text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" value="${w.price}" onchange="uWhol(${i},'price',this.value)"/>
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
  
  if (activeTab === 'products' && !d.sku) d.sku = 'SKU' + Date.now().toString().slice(-6);
  
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

window.toggleProductStatus = async (id, toActive) => {
  if (isSaving) return;
  isSaving = true;
  const i = appData.products.findIndex(x => x.id === id);
  if (i > -1) {
    appData.products[i].isActive = toActive ? 'true' : 'false';
    sLoad(toActive ? 'Mengaktifkan...' : 'Menonaktifkan...');
    try {
      await db.collection("freshmart").doc("cms_data").collection("products").doc(id.toString()).update({ isActive: toActive ? 'true' : 'false' });
      appData.lastUpdate = Date.now();
      await saveApp();
      rAdmItms('products');
      showToast(toActive ? "Produk Aktif!" : "Stok Dikosongkan!");
    } catch (e) {
      showToast("Gagal update status!");
    }
  }
  isSaving = false;
  hLoad();
};
