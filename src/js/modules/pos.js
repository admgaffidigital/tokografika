// =============================================================================
// POS KASIR (POINT OF SALE) ENGINE - 3-STEP WIZARD + FULL PRINT SUPPORT
// =============================================================================

let posCart = [];
let activeCashier = null;
let currentLoginTab = 'admin';
let posActiveCategory = 'Semua Produk';
let posSearchQuery = '';
let posPaymentMethod = 'cash';
let posClockInterval = null;
let posViewMode = 'grid'; // 'grid' | 'list'
let currentEditingCartIndex = null;
let currentSelectedVariantProduct = null;

// Wizard State
let posCurrentStep = 1;
let posDeliveryMethod = 'pickup'; // 'pickup' | 'delivery'
let posShippingCost = 0;
let posLastOrder = null; // holds completed order for printing

// -----------------------------------------------------------------------------
// 1. LOGIN TAB SWITCHER & AUTHENTICATION
// -----------------------------------------------------------------------------
window.switchLoginTab = (tab) => {
  currentLoginTab = tab;
  const btnAdmin = el('tab-login-admin');
  const btnCashier = el('tab-login-cashier');
  const icon = el('login-icon');
  const title = el('login-title');
  const subtitle = el('login-subtitle');
  const uInput = el('login-username');
  const pInput = el('login-password');
  const uLabel = el('login-user-label');
  const pLabel = el('login-pass-label');
  const submitBtn = el('btn-submit-login');

  if (tab === 'admin') {
    if (btnAdmin) {
      btnAdmin.className = 'flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700';
      btnAdmin.innerHTML = '<i class="fa-solid fa-shield-halved text-xs" style="color:var(--clr-p)"></i> <span>Admin</span>';
    }
    if (btnCashier) {
      btnCashier.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
      btnCashier.innerHTML = '<i class="fa-solid fa-cash-register text-xs"></i> <span>POS Kasir</span>';
    }
    if (icon) icon.className = 'fa-solid fa-shield-halved';
    if (title) title.innerText = 'Admin Master';
    if (subtitle) subtitle.innerText = 'Portal masuk ke CMS Pengaturan Toko';
    if (uLabel) uLabel.innerText = 'Username Admin';
    if (pLabel) pLabel.innerText = 'Password Admin';
    if (uInput) uInput.placeholder = 'Masukkan username admin...';
    if (pInput) pInput.placeholder = 'Masukkan password admin...';
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-1"></i> Masuk Sebagai Admin';
  } else {
    if (btnAdmin) {
      btnAdmin.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
      btnAdmin.innerHTML = '<i class="fa-solid fa-shield-halved text-xs"></i> <span>Admin</span>';
    }
    if (btnCashier) {
      btnCashier.className = 'flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700';
      btnCashier.innerHTML = '<i class="fa-solid fa-cash-register text-xs" style="color:var(--clr-p)"></i> <span>POS Kasir</span>';
    }
    if (icon) icon.className = 'fa-solid fa-cash-register';
    if (title) title.innerText = 'POS Kasir';
    if (subtitle) subtitle.innerText = 'Portal transaksi staf kasir';
    if (uLabel) uLabel.innerText = 'Username / Kode Kasir';
    if (pLabel) pLabel.innerText = 'Password / PIN Kasir';
    if (uInput) uInput.placeholder = 'Masukkan username kasir...';
    if (pInput) pInput.placeholder = 'Masukkan password kasir...';
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-cash-register mr-1"></i> Buka POS Kasir';
  }
};

window.checkAdminAccess = () => {
  if (isAdm) {
    if (cRole === 'cashier') {
      initPosView();
    } else {
      changeView('view-admin');
      openAdminMenu();
    }
  } else {
    changeView('view-admin-login');
    switchLoginTab('admin');
  }
};

window.openSubscriptionModal = (msg) => {
  const modal = el('pos-subscription-modal');
  const box = el('pos-subscription-box');
  const msgEl = el('pos-sub-modal-msg');
  if (msg && msgEl) msgEl.innerText = msg;
  if (!modal || !box) return;
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    box.classList.remove('scale-95');
  }, 10);
};

window.closeSubscriptionModal = () => {
  const modal = el('pos-subscription-modal');
  const box = el('pos-subscription-box');
  if (!modal || !box) return;
  modal.classList.add('opacity-0');
  box.classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 300);
};

window.orderSubscriptionWa = (planName) => {
  let waNumber = appData.store?.wa || '6285156550244';
  waNumber = waNumber.replace(/\D/g, '');
  if (waNumber.startsWith('0')) waNumber = '62' + waNumber.substring(1);
  const storeName = appData.store?.name || 'Toko Grafika';
  const text = `Halo Admin Toko Grafika,\nSaya ingin berlangganan *Full Premium POS Kasir* untuk toko saya:\n\n🏪 *Nama Toko:* ${storeName}\n📦 *Paket:* ${planName}\n\nMohon petunjuk aktivasi lisensi. Terima kasih! 🙏`;
  window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
};

window.activateSubscriptionToken = async () => {
  const tokenInput = el('pos-sub-token-input');
  if (!tokenInput) return;
  const token = tokenInput.value.trim().toUpperCase();
  if (!token) return showToast('Masukkan kode lisensi!');

  sLoad('Memverifikasi Lisensi...');
  const isValid = await verifyLicenseInDb(token, 'PRO');
  hLoad();

  if (isValid) {
    appData.licenseKey = token;
    localStorage.setItem('freshmart_cache_PRO', token);
    isPro = true;
    const badge = el('admin-pro-badge');
    if (badge) badge.innerHTML = '<span class="badge badge-xs badge-solid-amber"><i class="fa-solid fa-crown"></i> PRO</span>';
    await saveApp();
    showToast('🎉 Langganan Full Premium Aktif!');
    closeSubscriptionModal();
    initPosView();
  } else {
    showToast('Kode Lisensi tidak valid / kadaluarsa!');
  }
};

// -----------------------------------------------------------------------------
// 2. POS VIEW INITIALIZATION & CLOCK
// -----------------------------------------------------------------------------
window.initPosView = async () => {
  if (!isPro) {
    const cachedToken = (localStorage.getItem('freshmart_cache_PRO') || appData?.licenseKey || '').trim().toUpperCase();
    if (cachedToken) {
      isPro = await verifyLicenseInDb(cachedToken, 'PRO');
    }
  }

  if (!isPro) {
    window.openSubscriptionModal('Fitur POS Kasir & Struk hanya tersedia untuk pengguna Toko Grafika POS Premium (Promo Rp 35.000/bln).');
    return;
  }

  changeView('view-pos');
  
  const storeName = appData.store?.name || 'FreshMart Store';
  setIn('pos-store-name', storeName);
  
  const cashierName = activeCashier?.name || (cRole === 'admin' ? 'Admin Master' : 'Kasir Toko');
  setIn('pos-cashier-name', cashierName);
  
  const roleBadge = el('pos-role-badge');
  if (roleBadge) {
    roleBadge.innerText = cRole === 'admin' ? 'MASTER' : 'KASIR';
    roleBadge.className = cRole === 'admin' 
      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40 text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full'
      : 'bg-white/20 text-white border border-white/30 text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full';
  }

  const btnCms = el('btn-pos-to-admin');
  if (btnCms) {
    const hasAdminPerm = cRole === 'admin' || (cPerms && cPerms.length > 0);
    btnCms.classList.toggle('hidden', !hasAdminPerm);
  }

  if (posClockInterval) clearInterval(posClockInterval);
  updatePosClock();
  posClockInterval = setInterval(updatePosClock, 1000);

  renderPosCategories();
  renderPosProducts();
  renderPosCart();
};

const updatePosClock = () => {
  const clockEl = el('pos-clock');
  if (clockEl) {
    const now = new Date();
    clockEl.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
  }
};

// -----------------------------------------------------------------------------
// 3. POS CATALOG & CATEGORY CONTROLS (DRAWER MODAL & SPACIOUS CARDS)
// -----------------------------------------------------------------------------
let posCategorySearchQuery = '';

window.openPosCategoryModal = () => {
  posCategorySearchQuery = '';
  const filterInput = el('pos-category-filter-input');
  if (filterInput) filterInput.value = '';
  renderPosCategories();

  const modal = el('pos-category-modal');
  const box = el('pos-category-box');
  if (modal && box) {
    show('pos-category-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-full', 'sm:scale-95');
      box.classList.add('sm:scale-100');
      filterInput?.focus();
    }, 10);
  }
};

window.closePosCategoryModal = () => {
  const modal = el('pos-category-modal');
  const box = el('pos-category-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-full');
    box.classList.remove('sm:scale-100');
    box.classList.add('sm:scale-95');
    setTimeout(() => hide('pos-category-modal'), 300);
  }
};

window.filterCategoryModalList = (q) => {
  posCategorySearchQuery = (q || '').trim().toLowerCase();
  renderPosCategories();
};

const renderPosCategories = () => {
  const labelEl = el('pos-active-cat-label');
  if (labelEl) labelEl.innerText = posActiveCategory;

  const listContainer = el('pos-category-modal-list');
  if (!listContainer) return;

  const allProducts = appData.products || [];
  const categories = [
    { name: 'Semua Produk', count: allProducts.length, icon: 'fa-boxes-stacked' },
    ...(appData.categories || []).map(c => ({
      name: c.name,
      count: allProducts.filter(p => p.category === c.name).length,
      icon: 'fa-tag'
    }))
  ];

  const filteredCats = categories.filter(c => {
    if (!posCategorySearchQuery) return true;
    return c.name.toLowerCase().includes(posCategorySearchQuery);
  });

  if (!filteredCats.length) {
    listContainer.innerHTML = `
      <div class="py-8 text-center text-slate-400 font-bold text-xs">
        <i class="fa-solid fa-folder-open text-2xl mb-1.5 block opacity-40"></i>
        Kategori tidak ditemukan
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filteredCats.map(cat => {
    const isSelected = posActiveCategory === cat.name;
    return `
      <button type="button" onclick="selectPosCategory('${esc(cat.name)}')" 
        class="w-full p-3 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer text-left active:scale-98 ${isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm' : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700'}">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 ${isSelected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}">
            <i class="fa-solid ${cat.icon}"></i>
          </div>
          <div class="min-w-0">
            <p class="text-xs sm:text-sm font-extrabold truncate">${esc(cat.name)}</p>
            <p class="text-[10px] font-semibold opacity-70 mt-0.5">${cat.count} Produk</p>
          </div>
        </div>
        ${isSelected ? `<span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-sm"><i class="fa-solid fa-check"></i></span>` : `<i class="fa-solid fa-chevron-right text-slate-300 text-xs shrink-0"></i>`}
      </button>
    `;
  }).join('');
};

window.selectPosCategory = (cat) => {
  posActiveCategory = cat;
  const labelEl = el('pos-active-cat-label');
  if (labelEl) labelEl.innerText = cat;
  closePosCategoryModal();
  renderPosProducts();
};

window.filterPosCategory = (cat) => {
  window.selectPosCategory(cat);
};

window.setPosViewMode = (mode) => {
  posViewMode = mode;
  const btnGrid = el('btn-pos-view-grid');
  const btnList = el('btn-pos-view-list');
  
  if (mode === 'grid') {
    if (btnGrid) {
      btnGrid.className = 'px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 shadow-md border border-slate-200/50 dark:border-slate-700';
    }
    if (btnList) {
      btnList.className = 'px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all text-white/70 hover:text-white';
    }
  } else {
    if (btnGrid) {
      btnGrid.className = 'px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all text-white/70 hover:text-white';
    }
    if (btnList) {
      btnList.className = 'px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black transition-all text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 shadow-md border border-slate-200/50 dark:border-slate-700';
    }
  }

  renderPosProducts();
};

window.handlePosSearch = (val) => {
  posSearchQuery = (val || '').trim();
  const clearBtn = el('pos-btn-clear-search');
  if (clearBtn) clearBtn.classList.toggle('hidden', !posSearchQuery);
  renderPosProducts();
};

window.clearPosSearch = () => {
  const input = el('pos-search-input');
  if (input) input.value = '';
  posSearchQuery = '';
  const clearBtn = el('pos-btn-clear-search');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderPosProducts();
};

const renderPosProducts = () => {
  const container = el('pos-product-container');
  if (!container) return;

  const filtered = (appData.products || []).filter(p => {
    if (posActiveCategory !== 'Semua Produk' && p.category !== posActiveCategory) return false;
    if (!posSearchQuery) return true;
    const q = posSearchQuery.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.variants && p.variants.some(v => (v.sku || '').toLowerCase().includes(q) || (v.name || '').toLowerCase().includes(q)));
  });

  if (!filtered.length) {
    container.className = 'w-full py-20 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm';
    container.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
        <i class="fa-solid fa-box-open text-2xl"></i>
      </div>
      <p class="text-sm font-black text-slate-700 dark:text-slate-300">Produk Tidak Ditemukan</p>
      <p class="text-[10px] text-slate-400 mt-1 max-w-[220px] mx-auto">Coba cari dengan kata kunci lain atau pilih kategori Semua Produk</p>
    `;
    return;
  }

  if (posViewMode === 'grid') {
    container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4';
    container.innerHTML = filtered.map(p => renderPosProductCardGrid(p)).join('');
  } else {
    container.className = 'space-y-2.5 max-w-4xl mx-auto';
    container.innerHTML = filtered.map(p => renderPosProductCardList(p)).join('');
  }
};

const getEffP = (item) => item.effectivePrice || item.price || 0;

const _getPosMainPrice = (p) => {
  if (p.variants && p.variants.length > 0) {
    const prices = p.variants.map(v => parseFloat(v.price) || 0);
    return Math.min(...prices);
  }
  return parseFloat(p.salePrice > 0 ? p.salePrice : (p.price || 0)) || 0;
};

const renderPosProductCardGrid = (p) => {
  const hasVariants = p.variants && p.variants.length > 0;
  const stock = typeof p.stock !== 'undefined' && p.stock !== '' ? (parseInt(p.stock) || 0) : 100;
  const totalStock = hasVariants ? (p.variants || []).reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0) : stock;
  const isOutOfStock = (p.isActive === 'false' || p.isActive === false) || totalStock <= 0;
  const price = _getPosMainPrice(p);
  const rawImg = p.img || p.image || (p.images && p.images[0]) || '';
  const imgUrl = rawImg ? (typeof fixD === 'function' ? fixD(rawImg) : rawImg) : '';
  const cartQty = posCart.filter(c => String(c.id) === String(p.id)).reduce((s, c) => s + c.qty, 0);
  const isGrosir = (p.wholesalePrice > 0 && p.wholesaleMinQty > 0) || (p.wholesale && p.wholesale.length > 0);

  return `
    <div class="bg-white dark:bg-slate-900 rounded-3xl border ${isOutOfStock ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xl'} overflow-hidden transition-all duration-200 cursor-pointer group flex flex-col justify-between active:scale-[0.98] shadow-sm hover:-translate-y-0.5" onclick="${isOutOfStock ? '' : (hasVariants ? `openPosVariantModal('${esc(p.id)}')` : `addToCartPos('${esc(p.id)}', null, 1)`)}" title="${esc(p.name)}">
      
      <!-- Image Box with Badges -->
      <div class="relative aspect-square bg-slate-50 dark:bg-slate-800/60 overflow-hidden m-2 sm:m-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center">
        ${imgUrl ? `<img src="${esc(imgUrl)}" alt="${esc(p.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="if(window.imgErrRetry) window.imgErrRetry(this, 'No Image', 400); else this.style.display='none';"/>` : `<div class="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><i class="fa-solid fa-image text-3xl"></i></div>`}
        
        <!-- Cart Counter Badge (Floating Top Right) -->
        ${cartQty > 0 ? `
          <div class="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-xl shadow-lg border border-white/50 flex items-center gap-1">
            <i class="fa-solid fa-check text-[9px]"></i>
            <span>${cartQty}</span>
          </div>` : ''}

        <!-- Wholesale Badge (Top Left) -->
        ${isGrosir ? `<div class="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm tracking-wider uppercase">Grosir</div>` : ''}

        <!-- Variant Count Badge (Bottom Right) -->
        ${hasVariants ? `
          <div class="absolute bottom-1.5 right-1.5 bg-slate-900/85 text-white text-[8px] sm:text-[9px] font-extrabold px-2 py-0.5 rounded-lg border border-white/20 backdrop-blur-sm flex items-center gap-1">
            <i class="fa-solid fa-layer-group text-[8px]"></i>
            <span>${p.variants.length} Varian</span>
          </div>` : ''}

        <!-- Out of Stock Overlay -->
        ${isOutOfStock ? `<div class="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center"><span class="text-[10px] font-black text-rose-600 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full shadow-md">Habis</span></div>` : ''}
      </div>

      <!-- Info & Price Content -->
      <div class="p-3 pt-1 flex flex-col flex-1 justify-between">
        <div>
          <h4 class="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${esc(p.name)}</h4>
          <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 truncate">${esc(p.category || 'Umum')}${p.sku ? ' · ' + esc(p.sku) : ''}</p>
        </div>

        <div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
          <div class="min-w-0">
            ${hasVariants ? `<span class="text-[9px] font-bold text-slate-400 block leading-tight">Mulai · Stok: ${totalStock}</span>` : `<span class="text-[9px] font-bold ${stock > 5 ? 'text-slate-400' : (stock > 0 ? 'text-amber-500 font-black' : 'text-rose-500 font-black')} block leading-tight">Stok: ${stock} ${esc(p.unit || 'pcs')}</span>`}
            <span class="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">${fCur(price)}</span>
          </div>
          
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all shadow-sm shrink-0">
            <i class="fa-solid fa-plus text-[11px]"></i>
          </div>
        </div>
      </div>
    </div>
  `;
};

const renderPosProductCardList = (p) => {
  const hasVariants = p.variants && p.variants.length > 0;
  const stock = typeof p.stock !== 'undefined' && p.stock !== '' ? (parseInt(p.stock) || 0) : 100;
  const totalStock = hasVariants ? (p.variants || []).reduce((acc, v) => acc + (parseInt(v.stock) || 0), 0) : stock;
  const isOutOfStock = (p.isActive === 'false' || p.isActive === false) || totalStock <= 0;
  const price = _getPosMainPrice(p);
  const rawImg = p.img || p.image || (p.images && p.images[0]) || '';
  const imgUrl = rawImg ? (typeof fixD === 'function' ? fixD(rawImg) : rawImg) : '';
  const cartQty = posCart.filter(c => String(c.id) === String(p.id)).reduce((s, c) => s + c.qty, 0);
  const isGrosir = (p.wholesalePrice > 0 && p.wholesaleMinQty > 0) || (p.wholesale && p.wholesale.length > 0);

  return `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border ${isOutOfStock ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md'} p-3 sm:p-3.5 flex items-center gap-3.5 transition-all cursor-pointer group active:scale-[0.99] shadow-sm" onclick="${isOutOfStock ? '' : (hasVariants ? `openPosVariantModal('${esc(p.id)}')` : `addToCartPos('${esc(p.id)}', null, 1)`)}" title="${esc(p.name)}">
      
      <!-- List Thumbnail -->
      <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
        ${imgUrl ? `<img src="${esc(imgUrl)}" alt="${esc(p.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onerror="if(window.imgErrRetry) window.imgErrRetry(this, 'No Image', 400); else this.style.display='none';"/>` : `<i class="fa-solid fa-image text-slate-300 dark:text-slate-600 text-xl"></i>`}
        ${cartQty > 0 ? `<span class="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-md">${cartQty}</span>` : ''}
      </div>

      <!-- List Info -->
      <div class="flex-1 min-w-0 pr-1">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${esc(p.category || 'Umum')}</span>
          ${isGrosir ? `<span class="text-[8px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.2 rounded-md uppercase">Grosir</span>` : ''}
          ${hasVariants ? `<span class="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded-md">${p.variants.length} Varian</span>` : ''}
          <span class="text-[8px] font-black ${totalStock > 5 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : (totalStock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700')} px-1.5 py-0.2 rounded-md">Stok: ${totalStock}</span>
          ${isOutOfStock ? `<span class="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded-md">Habis</span>` : ''}
        </div>
        <h4 class="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 transition-colors">${esc(p.name)}</h4>
        <div class="flex items-baseline gap-1 mt-1">
          ${hasVariants ? `<span class="text-[9px] font-bold text-slate-400">Mulai</span>` : ''}
          <span class="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">${fCur(price)}</span>
          ${p.unit ? `<span class="text-[10px] text-slate-400 font-semibold">/${esc(p.unit)}</span>` : ''}
        </div>
      </div>

      <!-- Quick Add / Action Button -->
      <div class="flex items-center gap-2 shrink-0">
        ${!isOutOfStock ? `
          <button type="button" class="px-3 py-2 rounded-xl flex items-center gap-1.5 font-extrabold text-xs transition-all shadow-sm active:scale-95 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white border border-emerald-200 dark:border-emerald-800" onclick="event.stopPropagation(); ${hasVariants ? `openPosVariantModal('${esc(p.id)}')` : `addToCartPos('${esc(p.id)}', null, 1)`}">
            <i class="fa-solid fa-plus text-[10px]"></i>
            <span class="hidden sm:inline">${hasVariants ? 'Pilih Varian' : 'Tambah'}</span>
          </button>` : ''}
      </div>
    </div>
  `;
};

// -----------------------------------------------------------------------------
// 4. ADD TO CART
// -----------------------------------------------------------------------------
window.addToCartPos = (productId, variantId = null, qty = 1) => {
  const product = (appData.products || []).find(p => String(p.id) === String(productId));
  if (!product) {
    console.warn('[POS] Product not found for ID:', productId);
    return;
  }

  if (variantId) {
    const variant = (product.variants || []).find(v => String(v.id || v.name) === String(variantId));
    if (!variant) return;
    
    const existingIdx = posCart.findIndex(c => String(c.id) === String(productId) && String(c.variantId) === String(variantId));
    if (existingIdx > -1) {
      posCart[existingIdx].qty = Math.round((posCart[existingIdx].qty + qty) * 100) / 100;
    } else {
      const basePrice = parseFloat(variant.price) || 0;
      const isWholesale = product.wholesaleMinQty > 0 && (qty >= product.wholesaleMinQty);
      const effectivePrice = isWholesale ? (product.wholesalePrice || basePrice) : (product.salePrice > 0 ? product.salePrice : basePrice);
      
      const vImg = variant.img || product.img || product.image || '';
      posCart.push({
        id: String(productId),
        variantId: String(variantId),
        name: product.name,
        variantName: variant.name || String(variantId),
        price: basePrice,
        effectivePrice,
        unit: variant.unit || product.unit || '',
        qty,
        image: vImg ? (typeof fixD === 'function' ? fixD(vImg) : vImg) : '',
        wholesaleMinQty: product.wholesaleMinQty || 0,
        wholesalePrice: product.wholesalePrice || 0
      });
    }
  } else {
    const existingIdx = posCart.findIndex(c => String(c.id) === String(productId) && !c.variantId);
    if (existingIdx > -1) {
      const newQty = Math.round((posCart[existingIdx].qty + qty) * 100) / 100;
      posCart[existingIdx].qty = newQty;
      // Re-check wholesale
      if (product.wholesaleMinQty > 0) {
        posCart[existingIdx].effectivePrice = newQty >= product.wholesaleMinQty ? (product.wholesalePrice || product.price) : (product.salePrice > 0 ? product.salePrice : product.price);
      }
    } else {
      const basePrice = parseFloat(product.salePrice > 0 ? product.salePrice : (product.price || 0)) || 0;
      const isWholesale = product.wholesaleMinQty > 0 && (qty >= product.wholesaleMinQty);
      const effectivePrice = isWholesale ? (product.wholesalePrice || basePrice) : basePrice;
      const pImg = product.img || product.image || (product.images && product.images[0]) || '';
      
      posCart.push({
        id: String(productId),
        variantId: null,
        name: product.name,
        variantName: null,
        price: basePrice,
        effectivePrice,
        unit: product.unit || '',
        qty,
        image: pImg ? (typeof fixD === 'function' ? fixD(pImg) : pImg) : '',
        wholesaleMinQty: product.wholesaleMinQty || 0,
        wholesalePrice: product.wholesalePrice || 0
      });
    }
  }

  renderPosCart();
  renderPosProducts();
  showToast(`${product.name} ditambahkan!`);
};

window.removeFromPosCart = (index) => {
  posCart.splice(index, 1);
  renderPosCart();
  renderPosProducts();
};

window.clearPosCart = () => {
  if (!posCart.length) return;
  posCart = [];
  renderPosCart();
  renderPosProducts();
};

window.changePosQty = (index, delta) => {
  if (!posCart[index]) return;
  const item = posCart[index];
  const newQty = Math.round((item.qty + delta) * 100) / 100;
  if (newQty <= 0) {
    posCart.splice(index, 1);
  } else {
    posCart[index].qty = newQty;
    // Re-check wholesale
    if (item.wholesaleMinQty > 0) {
      item.effectivePrice = newQty >= item.wholesaleMinQty ? (item.wholesalePrice || item.price) : item.price;
    }
  }
  renderPosCart();
  renderPosProducts();
};

// -----------------------------------------------------------------------------
// 5. VARIANT MODAL
// -----------------------------------------------------------------------------
window.openPosVariantModal = (productId) => {
  currentSelectedVariantProduct = (appData.products || []).find(p => String(p.id) === String(productId));
  if (!currentSelectedVariantProduct || !currentSelectedVariantProduct.variants) return;

  const p = currentSelectedVariantProduct;
  const rawImg = p.img || p.image || (p.images && p.images[0]) || '';
  const imgUrl = rawImg ? (typeof fixD === 'function' ? fixD(rawImg) : rawImg) : '';
  const variantImgEl = el('pos-variant-prod-img');
  if (variantImgEl) {
    variantImgEl.src = imgUrl;
    variantImgEl.onerror = () => {
      if (window.imgErrRetry) window.imgErrRetry(variantImgEl, 'No Image', 400);
      else variantImgEl.style.display = 'none';
    };
  }
  setIn('pos-variant-prod-name', p.name);
  setIn('pos-variant-prod-sku', 'SKU: ' + (p.sku || '-'));

  const list = el('pos-variant-options-list');
  if (list) {
    list.innerHTML = (p.variants || []).map(v => {
      const vKey = v.id || v.name;
      const cartQty = posCart.filter(c => String(c.id) === String(p.id) && String(c.variantId) === String(vKey)).reduce((s, c) => s + c.qty, 0);
      const vStock = typeof v.stock !== 'undefined' && v.stock !== '' ? (parseInt(v.stock) || 0) : 100;
      const isOut = v.isActive === 'false' || v.isActive === false || vStock <= 0;
      return `
        <button type="button" onclick="addToCartPos('${esc(p.id)}', '${esc(vKey)}', 1); closePosVariantModal();" 
          class="w-full flex items-center justify-between p-3 rounded-xl border ${isOut ? 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 active:scale-98'} transition-all cursor-pointer"
          ${isOut ? 'disabled' : ''}>
          <div class="text-left">
            <p class="text-sm font-bold text-slate-800 dark:text-slate-200">${esc(v.name)} ${isOut ? '<span class="text-[9px] text-rose-500 font-black ml-1">(Habis)</span>' : ''}</p>
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">SKU: ${esc(v.sku || '-')} · Stok: ${vStock} ${esc(v.unit || p.unit || 'PCS')}</p>
          </div>
          <div class="flex items-center gap-2.5">
            ${cartQty > 0 ? `<span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">${cartQty} di keranjang</span>` : ''}
            <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">${fCur(v.price || 0)}</span>
          </div>
        </button>
      `;
    }).join('');
  }

  show('pos-variant-modal');
  setTimeout(() => {
    el('pos-variant-modal').classList.remove('opacity-0');
    el('pos-variant-box').classList.remove('scale-95');
  }, 10);
};

window.closePosVariantModal = () => {
  el('pos-variant-modal').classList.add('opacity-0');
  el('pos-variant-box').classList.add('scale-95');
  setTimeout(() => hide('pos-variant-modal'), 300);
};

// -----------------------------------------------------------------------------
// 6. QTY DECIMAL MODAL
// -----------------------------------------------------------------------------
window.openPosQtyModal = (index) => {
  currentEditingCartIndex = index;
  const item = posCart[index];
  if (!item) return;
  setIn('pos-qty-modal-title', `Ubah Jumlah: ${item.name}`);
  setIn('pos-qty-prod-name', item.variantName ? `${item.name} (${item.variantName})` : item.name);
  setIn('pos-qty-modal-unit', item.unit || 'PCS');
  if (el('pos-qty-modal-input')) el('pos-qty-modal-input').value = item.qty;

  show('pos-qty-modal');
  setTimeout(() => {
    el('pos-qty-modal').classList.remove('opacity-0');
    el('pos-qty-box').classList.remove('scale-95');
    el('pos-qty-modal-input')?.focus();
    el('pos-qty-modal-input')?.select();
  }, 10);
};

window.closePosQtyModal = () => {
  el('pos-qty-modal').classList.add('opacity-0');
  el('pos-qty-box').classList.add('scale-95');
  setTimeout(() => hide('pos-qty-modal'), 300);
};

window.setPosQtyPreset = (val) => {
  if (el('pos-qty-modal-input')) el('pos-qty-modal-input').value = val;
};

window.savePosQtyModal = () => {
  const val = parseFloat(el('pos-qty-modal-input')?.value || '1');
  if (val <= 0 || isNaN(val)) {
    posCart.splice(currentEditingCartIndex, 1);
  } else {
    posCart[currentEditingCartIndex].qty = Math.round(val * 100) / 100;
    const item = posCart[currentEditingCartIndex];
    if (item.wholesaleMinQty > 0) {
      item.effectivePrice = item.qty >= item.wholesaleMinQty ? (item.wholesalePrice || item.price) : item.price;
    }
  }
  closePosQtyModal();
  renderPosCart();
  renderPosProducts();
};

// -----------------------------------------------------------------------------
// 7. RENDER CART
// -----------------------------------------------------------------------------
const renderPosCart = () => {
  const drawerContainer = el('pos-drawer-cart-items-container');
  const floatDock = el('pos-floating-cart-dock');
  const floatDockCount = el('pos-float-dock-count');
  const floatDockTotal = el('pos-float-dock-total');
  const drawerCount = el('pos-drawer-cart-count');
  const topBadge = el('pos-cart-header-badge');

  const totalItems = posCart.length;
  const totalQty = posCart.reduce((acc, item) => acc + item.qty, 0);
  const formattedQty = Math.round(totalQty * 100) / 100;
  const subtotal = posCart.reduce((acc, item) => acc + (getEffP(item) * item.qty), 0);
  const origTotal = posCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const discount = origTotal - subtotal;

  if (topBadge) {
    topBadge.innerText = formattedQty;
    topBadge.classList.toggle('hidden', totalItems === 0);
  }
  if (floatDockCount) floatDockCount.innerText = `${totalItems} Item (${formattedQty})`;
  if (drawerCount) drawerCount.innerText = `${totalItems} Produk (${formattedQty} Unit)`;

  setIn('pos-drawer-summary-subtotal', fCur(subtotal));
  setIn('pos-drawer-summary-discount', discount > 0 ? `-${fCur(discount)}` : fCur(0));
  setIn('pos-drawer-summary-total', fCur(subtotal));
  if (floatDockTotal) floatDockTotal.innerText = fCur(subtotal);

  if (!posCart.length) {
    if (drawerContainer) {
      drawerContainer.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
          <div class="w-16 h-16 rounded-full bg-slate-200/60 dark:bg-slate-800/60 flex items-center justify-center mb-3 text-slate-400">
            <i class="fa-solid fa-basket-shopping text-2xl"></i>
          </div>
          <p class="text-xs font-black text-slate-700 dark:text-slate-300">Keranjang Masih Kosong</p>
          <p class="text-[10px] text-slate-400 mt-1 max-w-[200px]">Pilih produk dari katalog atau scan barcode untuk menambah belanjaan</p>
        </div>
      `;
    }
    if (floatDock) {
      floatDock.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
    }
    return;
  }

  if (floatDock) {
    floatDock.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
  }

  if (drawerContainer) {
    drawerContainer.innerHTML = posCart.map((item, idx) => {
      const effPrice = getEffP(item);
      const isGrosir = item.wholesaleMinQty > 0 && item.qty >= item.wholesaleMinQty;
      const lineTotal = effPrice * item.qty;
      const isDecimal = item.unit && ['kg', 'gram', 'liter', 'ml', 'ons', 'm', 'cm'].some(u => item.unit.toLowerCase().includes(u));

      return `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex items-start gap-3 shadow-sm">
          ${item.image ? `<img src="${esc(item.image)}" class="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700" onerror="if(window.imgErrRetry) window.imgErrRetry(this, 'No Image', 400); else this.style.display='none';"/>` : `<div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center"><i class="fa-solid fa-image text-slate-300 dark:text-slate-600"></i></div>`}
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">${esc(item.name)}${item.variantName ? ` <span class="text-slate-500">(${esc(item.variantName)})</span>` : ''}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              ${isGrosir ? `<span class="text-[8px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded-full">GROSIR</span>` : ''}
              <span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">${fCur(effPrice)} × ${item.qty}${item.unit ? ' ' + item.unit : ''}</span>
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-sm font-black text-emerald-600 dark:text-emerald-400">${fCur(lineTotal)}</span>
              <div class="flex items-center gap-1.5">
                <button type="button" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all active:scale-95" onclick="changePosQty(${idx}, -${isDecimal ? 0.5 : 1})">
                  <i class="fa-solid fa-minus text-[10px] text-slate-600 dark:text-slate-400"></i>
                </button>
                <button type="button" class="min-w-[32px] text-center text-xs font-black text-slate-900 dark:text-white px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors" onclick="openPosQtyModal(${idx})">
                  ${item.qty}
                </button>
                <button type="button" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all active:scale-95" onclick="changePosQty(${idx}, ${isDecimal ? 0.5 : 1})">
                  <i class="fa-solid fa-plus text-[10px] text-slate-600 dark:text-slate-400"></i>
                </button>
                <button type="button" class="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition-all active:scale-95" onclick="removeFromPosCart(${idx})">
                  <i class="fa-solid fa-trash-can text-[10px] text-rose-500"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

// -----------------------------------------------------------------------------
// 8. CART DRAWER
// -----------------------------------------------------------------------------
window.openPosCartDrawer = () => {
  const modal = el('pos-cart-drawer-modal');
  const box = el('pos-cart-drawer-box');
  if (modal && box) {
    show('pos-cart-drawer-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-full', 'sm:translate-x-full');
    }, 10);
  }
};

window.closePosCartDrawer = () => {
  const modal = el('pos-cart-drawer-modal');
  const box = el('pos-cart-drawer-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-full', 'sm:translate-x-full');
    setTimeout(() => hide('pos-cart-drawer-modal'), 300);
  }
};

// -----------------------------------------------------------------------------
// 9. PAYMENT WIZARD
// -----------------------------------------------------------------------------
const _getPosSubtotal = () => posCart.reduce((s, i) => s + (getEffP(i) * i.qty), 0);
const _getPosGrandTotal = () => _getPosSubtotal() + posShippingCost;

window.openPosPaymentModal = () => {
  if (!posCart.length) { showToast('Keranjang masih kosong!'); return; }
  
  // Reset wizard state
  posDeliveryMethod = 'pickup';
  posShippingCost = 0;
  posPaymentMethod = 'cash';
  posCurrentStep = 1;

  _renderPosStep1();
  goPosStep(1);

  const modal = el('pos-payment-modal');
  const box = el('pos-payment-box');
  show('pos-payment-modal');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    box.classList.remove('translate-y-full', 'sm:scale-95');
    box.classList.add('sm:scale-100');
  }, 10);
};

window.closePosPaymentModal = () => {
  const modal = el('pos-payment-modal');
  const box = el('pos-payment-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-full');
    box.classList.remove('sm:scale-100');
    box.classList.add('sm:scale-95');
    setTimeout(() => hide('pos-payment-modal'), 300);
  }
};

// Make posCurrentStep accessible from window
window.posCurrentStep = posCurrentStep;

window.goPosStep = (step) => {
  // Validate current step before proceeding
  if (step > posCurrentStep) {
    if (posCurrentStep === 3) return; // Can't go beyond step 3
  }
  
  // Validation
  if (step === 3 && posCurrentStep === 2) {
    // Validate delivery step
    if (posDeliveryMethod === 'delivery') {
      const addr = el('pos-delivery-address')?.value?.trim();
      if (!addr) { showToast('Masukkan alamat pengiriman terlebih dahulu!'); return; }
    }
    posShippingCost = posDeliveryMethod === 'delivery' ? (parseFloat(el('pos-shipping-cost')?.value || '0') || 0) : 0;
  }

  posCurrentStep = step;

  // Hide all steps
  ['pos-step-1', 'pos-step-2', 'pos-step-3'].forEach(id => {
    const el2 = el(id);
    if (el2) el2.classList.add('hidden');
  });

  // Show current step
  const currentStepEl = el(`pos-step-${step}`);
  if (currentStepEl) currentStepEl.classList.remove('hidden');

  // Update step dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.querySelector(`.pos-step-dot-${i}`);
    const label = document.querySelector(`.pos-step-label-${i}`);
    if (dot) {
      if (i < step) {
        dot.className = `w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all pos-step-dot-${i} bg-emerald-600 text-white`;
        dot.innerHTML = '<i class="fa-solid fa-check text-[10px]"></i>';
      } else if (i === step) {
        dot.className = `w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all pos-step-dot-${i} bg-emerald-600 text-white shadow-md`;
        dot.innerHTML = String(i);
      } else {
        dot.className = `w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all pos-step-dot-${i} bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400`;
        dot.innerHTML = String(i);
      }
    }
    if (label) {
      label.className = `text-[10px] font-bold pos-step-label-${i} hidden sm:block ${i <= step ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`;
    }
  }

  // Update step lines
  const line12 = document.querySelector('.pos-step-line-12');
  const line23 = document.querySelector('.pos-step-line-23');
  if (line12) line12.className = `h-px w-8 transition-all pos-step-line-12 ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`;
  if (line23) line23.className = `h-px w-8 transition-all pos-step-line-23 ${step > 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`;

  // Update title & subtitle
  const titles = {
    1: ['Ringkasan Belanja', 'Periksa item & data pelanggan'],
    2: ['Metode Pengiriman', 'Pilih cara penyerahan barang'],
    3: ['Metode Pembayaran', 'Pilih cara pembayaran pelanggan']
  };
  setIn('pos-wizard-title', titles[step][0]);
  setIn('pos-wizard-subtitle', titles[step][1]);

  // Update nav buttons
  const btnPrev = el('pos-btn-prev');
  const btnNext = el('pos-btn-next');
  const btnLabel = el('pos-btn-next-label');
  const btnIcon = btnNext?.querySelector('i');

  if (btnPrev) btnPrev.classList.toggle('hidden', step === 1);

  if (step === 3) {
    if (btnLabel) btnLabel.innerText = 'Proses Pembayaran';
    if (btnIcon) { btnIcon.className = 'fa-solid fa-check text-xs'; }
    if (btnNext) btnNext.onclick = submitPosTransaction;
    _renderPosStep3();
  } else {
    if (btnLabel) btnLabel.innerText = 'Lanjut';
    if (btnIcon) { btnIcon.className = 'fa-solid fa-arrow-right text-xs'; }
    if (btnNext) btnNext.onclick = () => goPosStep(posCurrentStep + 1);
    if (step === 2) _renderPosStep2();
  }
};

const _renderPosStep1 = () => {
  const subtotal = _getPosSubtotal();
  const totalQty = posCart.reduce((s, i) => s + i.qty, 0);
  setIn('pos-modal-total-display', fCur(subtotal));
  setIn('pos-modal-items-count', `${posCart.length} item · ${Math.round(totalQty * 100) / 100} unit`);

  const listEl = el('pos-step1-items-list');
  if (listEl) {
    listEl.innerHTML = posCart.map(item => {
      const effP = getEffP(item);
      const isGrosir = item.wholesaleMinQty > 0 && item.qty >= item.wholesaleMinQty;
      return `
        <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
          <div class="flex-1 min-w-0 mr-3">
            <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${esc(item.name)}${item.variantName ? ` <span class="text-slate-400">(${esc(item.variantName)})</span>` : ''}</p>
            <p class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">${item.qty}${item.unit ? ' ' + item.unit : ''} × ${fCur(effP)} ${isGrosir ? '<span class="text-amber-600 font-black">Grosir</span>' : ''}</p>
          </div>
          <span class="text-sm font-black text-slate-900 dark:text-white shrink-0">${fCur(effP * item.qty)}</span>
        </div>
      `;
    }).join('');
  }
};

const _renderPosStep2 = () => {
  setPosDeliveryMethod(posDeliveryMethod);
};

const _renderPosStep3 = () => {
  const subtotal = _getPosSubtotal();
  const grandTotal = subtotal + posShippingCost;

  setIn('pos-pay-subtotal', fCur(subtotal));
  setIn('pos-pay-grand-total', fCur(grandTotal));

  const shippingRow = el('pos-pay-shipping-row');
  if (shippingRow) {
    if (posDeliveryMethod === 'delivery') {
      shippingRow.classList.remove('hidden');
      const courier = el('pos-courier-name')?.value?.trim() || '';
      setIn('pos-pay-shipping-label', courier ? `Ongkir (${courier})` : 'Ongkir');
      setIn('pos-pay-shipping-cost', fCur(posShippingCost));
    } else {
      shippingRow.classList.add('hidden');
    }
  }

  setPosPaymentMethod(posPaymentMethod);
  if (el('pos-cash-received-input')) el('pos-cash-received-input').value = '';
  setIn('pos-change-display', 'Rp 0');
  const changeBox = el('pos-change-display-box');
  if (changeBox) changeBox.className = 'p-3.5 rounded-2xl border-2 border-dashed flex items-center justify-between transition-all border-slate-200 dark:border-slate-700';
};

window.setPosDeliveryMethod = (method) => {
  posDeliveryMethod = method;
  const pickupBtn = el('pos-delivery-pickup-btn');
  const sendBtn = el('pos-delivery-send-btn');
  const detailsSection = el('pos-delivery-details-section');
  const pickupInfo = el('pos-pickup-info-section');

  const activeClass = 'p-4 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-all border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm';
  const inactiveClass = 'p-4 rounded-2xl border-2 font-bold text-xs flex flex-col items-center gap-2 transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300';

  if (method === 'pickup') {
    if (pickupBtn) pickupBtn.className = activeClass;
    if (sendBtn) sendBtn.className = inactiveClass;
    if (detailsSection) detailsSection.classList.add('hidden');
    if (pickupInfo) pickupInfo.classList.remove('hidden');
  } else {
    if (pickupBtn) pickupBtn.className = inactiveClass;
    if (sendBtn) sendBtn.className = activeClass;
    if (detailsSection) detailsSection.classList.remove('hidden');
    if (pickupInfo) pickupInfo.classList.add('hidden');
  }
};

window.recalcPosTotal = () => {
  posShippingCost = parseFloat(el('pos-shipping-cost')?.value || '0') || 0;
};

window.setPosPaymentMethod = (method) => {
  posPaymentMethod = method;
  
  document.querySelectorAll('.pos-method-btn').forEach(btn => {
    const m = btn.getAttribute('data-method');
    const isSelected = m === method;
    btn.className = `pos-method-btn p-2.5 rounded-xl border-2 font-bold text-[10px] flex flex-col items-center gap-1.5 transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'} ${btn.className.includes('col-span') ? 'col-span-3 sm:col-span-1' : ''}`;
  });

  const cashSection = el('pos-cash-input-section');
  const noncashSection = el('pos-noncash-info-section');
  
  if (cashSection) cashSection.classList.toggle('hidden', method !== 'cash');
  if (noncashSection) noncashSection.classList.toggle('hidden', method === 'cash');

  const noncashText = el('pos-noncash-info-text');
  if (noncashText) {
    const texts = {
      qris: 'Arahkan pelanggan untuk scan QRIS. Pastikan notifikasi pembayaran sudah masuk sebelum menekan proses.',
      transfer: 'Pastikan transfer bank sudah diterima dan terkonfirmasi di rekening toko sebelum menekan proses.',
      edc: 'Gesek atau tap kartu debit/kredit pelanggan di mesin EDC. Pastikan struk EDC tercetak sebelum proses.',
      cod: 'Pembayaran dilakukan saat barang diterima oleh pelanggan di tujuan pengiriman.'
    };
    noncashText.innerText = texts[method] || 'Pastikan pembayaran sudah dikonfirmasi sebelum menekan tombol proses.';
  }
};

window.setQuickCash = (amount) => {
  const grand = _getPosGrandTotal();
  const input = el('pos-cash-received-input');
  if (!input) return;
  if (amount === 'exact') {
    input.value = grand;
  } else {
    input.value = amount;
  }
  calculatePosChange();
};

window.addQuickCash = (amount) => {
  const input = el('pos-cash-received-input');
  if (!input) return;
  const current = parseFloat(input.value || '0') || 0;
  input.value = current + amount;
  calculatePosChange();
};

window.calculatePosChange = () => {
  const grand = _getPosGrandTotal();
  const received = parseFloat(el('pos-cash-received-input')?.value || '0');
  const change = received - grand;

  const changeDisplay = el('pos-change-display');
  const changeBox = el('pos-change-display-box');
  
  if (changeDisplay) {
    if (received === 0) {
      changeDisplay.innerText = 'Rp 0';
      changeDisplay.className = 'text-xl font-black text-slate-400';
    } else if (change < 0) {
      changeDisplay.innerText = `Kurang ${fCur(Math.abs(change))}`;
      changeDisplay.className = 'text-xl font-black text-rose-500 dark:text-rose-400';
      if (changeBox) changeBox.className = 'p-3.5 rounded-2xl border-2 border-dashed flex items-center justify-between transition-all border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30';
    } else {
      changeDisplay.innerText = fCur(change);
      changeDisplay.className = 'text-xl font-black text-emerald-600 dark:text-emerald-400';
      if (changeBox) changeBox.className = 'p-3.5 rounded-2xl border-2 border-dashed flex items-center justify-between transition-all border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30';
    }
  }
};

// -----------------------------------------------------------------------------
// 10. SUBMIT TRANSACTION
// -----------------------------------------------------------------------------
window.submitPosTransaction = async () => {
  if (!posCart.length) return;

  const grand = _getPosGrandTotal();
  const subtotal = _getPosSubtotal();
  const received = parseFloat(el('pos-cash-received-input')?.value || '0');

  if (posPaymentMethod === 'cash' && received < grand) {
    showToast('Uang yang diterima kurang dari total tagihan!');
    return;
  }

  const custName = (el('pos-customer-name')?.value || '').trim() || 'Pelanggan Umum (Walk-in)';
  const custNote = (el('pos-customer-note')?.value || '').trim();
  const deliveryAddr = (el('pos-delivery-address')?.value || '').trim();
  const courierName = (el('pos-courier-name')?.value || '').trim();
  const cashierName = activeCashier?.name || (cRole === 'admin' ? 'Admin Master' : 'Kasir Toko');
  const orderId = `POS-${Date.now().toString().slice(-8)}`;

  const methodLabels = {
    cash: 'Tunai',
    qris: 'QRIS',
    transfer: 'Transfer Bank',
    edc: 'Debit/EDC',
    cod: 'COD'
  };

  const orderData = {
    id: orderId,
    orderId: orderId,
    type: 'pos',
    source: 'POS Kasir',
    customer: {
      name: custName,
      phone: '-',
      address: posDeliveryMethod === 'delivery' ? deliveryAddr : 'Ambil di Toko (Walk-in)',
      deliveryMethod: posDeliveryMethod,
      courier: courierName || null,
      note: custNote || null,
      method: posDeliveryMethod === 'pickup' ? 'Ambil di Toko' : 'Dikirim'
    },
    items: posCart.map(item => ({
      id: item.id,
      name: item.name,
      variantName: item.variantName || null,
      price: item.price,
      effectivePrice: getEffP(item),
      qty: item.qty,
      unit: item.unit || ''
    })),
    payment: {
      subtotal: subtotal,
      shippingCost: posShippingCost,
      grandTotal: grand,
      method: methodLabels[posPaymentMethod] || posPaymentMethod,
      methodKey: posPaymentMethod,
      status: 'Lunas',
      cashReceived: posPaymentMethod === 'cash' ? received : grand,
      change: posPaymentMethod === 'cash' ? Math.max(0, received - grand) : 0
    },
    status: 'Selesai',
    cashier: cashierName,
    timestamp: typeof firebase !== 'undefined' && firebase.firestore ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
    dateString: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  sLoad('Menyimpan Transaksi...');

  try {
    if (typeof db !== 'undefined' && db.collection) {
      await db.collection('freshmart_orders').doc(orderId).set(orderData);
    }

    // Pengurangan Stok Produk & Varian Otomatis
    posCart.forEach(cartItem => {
      const prod = (appData.products || []).find(p => String(p.id) === String(cartItem.id));
      if (prod) {
        if (cartItem.variantName || cartItem.variantId) {
          if (prod.variants && prod.variants.length > 0) {
            const vObj = prod.variants.find(v => (v.name === cartItem.variantName || String(v.id || v.name) === String(cartItem.variantId)));
            if (vObj) {
              const currentVStock = typeof vObj.stock !== 'undefined' && vObj.stock !== '' ? (parseInt(vObj.stock) || 0) : 100;
              vObj.stock = Math.max(0, currentVStock - cartItem.qty);
            }
            prod.stock = prod.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
          }
        } else {
          const currentStock = typeof prod.stock !== 'undefined' && prod.stock !== '' ? (parseInt(prod.stock) || 0) : 100;
          prod.stock = Math.max(0, currentStock - cartItem.qty);
        }
        
        // Sync perubahan stok ke Firestore
        if (typeof db !== 'undefined' && db.collection) {
          db.collection('freshmart').doc('cms_data').collection('products').doc(prod.id.toString()).set(prod).catch(() => {});
        }
      }
    });
    
    hLoad();
    closePosPaymentModal();

    // Store last order for print access
    posLastOrder = orderData;

    // Open success modal
    _openPosSuccessModal(orderData);

    posCart = [];
    renderPosCart();
    renderPosProducts();
    if (el('pos-customer-name')) el('pos-customer-name').value = '';
    if (el('pos-customer-note')) el('pos-customer-note').value = '';
    if (el('pos-delivery-address')) el('pos-delivery-address').value = '';
    if (el('pos-courier-name')) el('pos-courier-name').value = '';
    if (el('pos-shipping-cost')) el('pos-shipping-cost').value = '0';
    
  } catch (error) {
    console.error('[FreshMart POS] Transaction error:', error);
    hLoad();
    showToast('Gagal menyimpan transaksi: ' + error.message);
  }
};

// -----------------------------------------------------------------------------
// 11. SUCCESS MODAL
// -----------------------------------------------------------------------------
const _openPosSuccessModal = (order) => {
  setIn('pos-success-order-id', 'ID: ' + order.orderId);
  setIn('pos-success-total', fCur(order.payment?.grandTotal || 0));
  setIn('pos-success-method', order.payment?.method || '-');
  setIn('pos-success-delivery', order.customer?.deliveryMethod === 'delivery' ? `Dikirim${order.customer?.courier ? ' via ' + order.customer.courier : ''}` : 'Ambil di Toko');

  const changeRow = el('pos-success-change-row');
  if (changeRow) {
    if (order.payment?.methodKey === 'cash') {
      changeRow.classList.remove('hidden');
      setIn('pos-success-change', fCur(order.payment?.change || 0));
    } else {
      changeRow.classList.add('hidden');
    }
  }

  const modal = el('pos-success-modal');
  const box = el('pos-success-box');
  show('pos-success-modal');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    box.classList.remove('scale-75');
    box.classList.add('scale-100');
  }, 10);
};

window.closePosSuccessModal = () => {
  const modal = el('pos-success-modal');
  const box = el('pos-success-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.remove('scale-100');
    box.classList.add('scale-75');
    setTimeout(() => hide('pos-success-modal'), 300);
  }
};

// -----------------------------------------------------------------------------
// 12. PRINT FUNCTIONS (called from success modal)
// -----------------------------------------------------------------------------
window.printPosReceipt = () => {
  if (!posLastOrder) { showToast('Tidak ada data transaksi!'); return; }
  if (typeof openReceiptPreview === 'function') {
    openReceiptPreview(posLastOrder);
  } else {
    showToast('Fungsi cetak struk belum tersedia!');
  }
};

window.printPosInvoice = () => {
  if (!posLastOrder) { showToast('Tidak ada data transaksi!'); return; }
  if (typeof generatePosA4Document === 'function') {
    generatePosA4Document('invoice', posLastOrder);
  } else {
    showToast('Fungsi cetak invoice belum tersedia!');
  }
};

window.printPosSuratJalan = () => {
  if (!posLastOrder) { showToast('Tidak ada data transaksi!'); return; }
  if (typeof generatePosA4Document === 'function') {
    generatePosA4Document('suratjalan', posLastOrder);
  } else {
    showToast('Fungsi cetak surat jalan belum tersedia!');
  }
};
