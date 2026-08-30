// =============================================================================
// POS KASIR (POINT OF SALE) ENGINE - UNIVERSAL FLOATING CART SYSTEM
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
    }
    if (btnCashier) {
      btnCashier.className = 'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
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
    }
    if (btnCashier) {
      btnCashier.className = 'flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700';
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

// -----------------------------------------------------------------------------
// 2. POS VIEW INITIALIZATION & CLOCK
// -----------------------------------------------------------------------------
window.initPosView = () => {
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
// 3. POS CATALOG & CATEGORY CONTROLS
// -----------------------------------------------------------------------------
const renderPosCategories = () => {
  const container = el('pos-categories-container');
  if (!container) return;

  const categories = ['Semua Produk', ...(appData.categories || []).map(c => c.name)];
  
  container.innerHTML = categories.map(cat => {
    const isSelected = posActiveCategory === cat;
    return `
      <button type="button" onclick="filterPosCategory('${esc(cat)}')" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-sm border border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 border border-slate-200 shadow-sm'}">
        ${esc(cat)}
      </button>
    `;
  }).join('');
};

window.filterPosCategory = (cat) => {
  posActiveCategory = cat;
  renderPosCategories();
  renderPosProducts();
};

window.setPosViewMode = (mode) => {
  posViewMode = mode;
  const btnGrid = el('btn-pos-view-grid');
  const btnList = el('btn-pos-view-list');
  
  if (mode === 'grid') {
    if (btnGrid) btnGrid.className = 'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm';
    if (btnList) btnList.className = 'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
  } else {
    if (btnGrid) btnGrid.className = 'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';
    if (btnList) btnList.className = 'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm';
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
    container.className = 'w-full py-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800';
    container.innerHTML = `
      <i class="fa-solid fa-box-open text-3xl mb-2 block opacity-40"></i>
      Produk tidak ditemukan
    `;
    return;
  }

  if (posViewMode === 'grid') {
    container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4';
    container.innerHTML = filtered.map(p => {
      const isActive = p.isActive !== 'false' && p.isActive !== false;
      const hasVariants = p.variants && p.variants.length > 0;
      return `
        <div class="card-modern bg-white dark:bg-slate-900 rounded-2xl p-2 sm:p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-sm group flex flex-col justify-between active:scale-95 select-none" onclick="handlePosProductClick(${p.id})">
          <div class="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2 border border-slate-200/50 dark:border-slate-700/50">
            <img src="${esc(p.img || '')}" onerror="window.imgErrRetry(this,'No Image',200)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isActive ? 'grayscale opacity-40' : ''}"/>
            ${!isActive ? '<div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center"><span class="badge badge-solid-rose text-[8px] font-bold">KOSONG</span></div>' : ''}
            ${hasVariants ? '<span class="absolute top-1.5 right-1.5 bg-indigo-600 text-white text-[7px] sm:text-[8px] font-bold px-1.5 py-0.5 rounded shadow"><i class="fa-solid fa-layer-group"></i> Varian</span>' : ''}
            ${p.wholesale?.length ? '<span class="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[7px] sm:text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow"><i class="fa-solid fa-tags"></i> Grosir</span>' : ''}
          </div>
          <div class="flex-1 flex flex-col justify-between min-w-0 px-0.5">
            <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${esc(p.name)}</h4>
            <div class="flex items-baseline justify-between gap-1 mt-auto pt-1">
              <span class="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">${fCur(p.price)}</span>
              ${p.unit ? `<span class="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">/${esc(p.unit)}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    // List View
    container.className = 'flex flex-col gap-2 max-w-4xl mx-auto';
    container.innerHTML = filtered.map(p => {
      const isActive = p.isActive !== 'false' && p.isActive !== false;
      const hasVariants = p.variants && p.variants.length > 0;
      return `
        <div class="card-modern bg-white dark:bg-slate-900 rounded-xl p-2.5 sm:p-3 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-sm flex items-center justify-between gap-3 active:scale-98 select-none" onclick="handlePosProductClick(${p.id})">
          <div class="flex items-center gap-3 min-w-0">
            <div class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50 dark:border-slate-700/50">
              <img src="${esc(p.img || '')}" onerror="window.imgErrRetry(this,'No Image',100)" class="w-full h-full object-cover"/>
              ${!isActive ? '<div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-[7px] text-white font-bold">KOSONG</div>' : ''}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <h4 class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">${esc(p.name)}</h4>
                ${hasVariants ? '<span class="badge badge-xs badge-indigo">Varian</span>' : ''}
                ${p.wholesale?.length ? '<span class="badge badge-xs badge-amber">Grosir</span>' : ''}
              </div>
              <p class="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5 truncate">${esc(p.sku || '-')}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right">
              <p class="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400">${fCur(p.price)}</p>
              ${p.unit ? `<p class="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">/${esc(p.unit)}</p>` : ''}
            </div>
            <button type="button" class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
};

// -----------------------------------------------------------------------------
// 4. POS PRODUCT SELECTION & MULTI-VARIANT MODAL
// -----------------------------------------------------------------------------
window.handlePosProductClick = (productId) => {
  const p = (appData.products || []).find(x => x.id === productId);
  if (!p) return;

  const isActive = p.isActive !== 'false' && p.isActive !== false;
  if (!isActive) {
    showToast("Produk sedang kosong!");
    return;
  }

  if (p.variants && p.variants.length > 0) {
    openPosVariantModal(productId);
  } else {
    addPosItemDirect(p, null, p.price);
  }
};

window.openPosVariantModal = (productId) => {
  const p = (appData.products || []).find(x => x.id === productId);
  if (!p) return;

  currentSelectedVariantProduct = p;
  setIn('pos-variant-prod-name', p.name);
  setIn('pos-variant-prod-sku', `SKU: ${p.sku || '-'}`);
  
  const imgEl = el('pos-variant-prod-img');
  if (imgEl) imgEl.src = p.img || '';

  const optionsContainer = el('pos-variant-options-list');
  if (optionsContainer) {
    optionsContainer.innerHTML = p.variants.map((v, vIdx) => `
      <button type="button" class="w-full p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 flex items-center justify-between gap-2 transition-all active:scale-98 group text-left" onclick="selectPosVariant(${vIdx})">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
            <img src="${esc(v.img || p.img || '')}" class="w-full h-full object-cover"/>
          </div>
          <div class="min-w-0">
            <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600">${esc(v.name)}</h5>
            <p class="text-[10px] text-slate-400 font-semibold">${esc(v.sku || '-')}</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">${fCur(v.price ?? p.price)}</span>
          ${p.unit ? `<span class="text-[8px] font-bold text-slate-400 block uppercase">/${esc(p.unit)}</span>` : ''}
        </div>
      </button>
    `).join('');
  }

  const modal = el('pos-variant-modal');
  const box = el('pos-variant-box');
  if (modal && box) {
    show('pos-variant-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('scale-95');
    }, 10);
  }
};

window.closePosVariantModal = () => {
  const modal = el('pos-variant-modal');
  const box = el('pos-variant-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('scale-95');
    setTimeout(() => hide('pos-variant-modal'), 300);
  }
};

window.selectPosVariant = (variantIndex) => {
  if (!currentSelectedVariantProduct) return;
  const p = currentSelectedVariantProduct;
  const v = p.variants[variantIndex];
  addPosItemDirect(p, v.name, v.price ?? p.price, v.img || p.img);
  closePosVariantModal();
};

const addPosItemDirect = (product, variantName = null, price = 0, variantImg = null) => {
  const existing = posCart.find(item => item.id === product.id && item.variantName === variantName);
  if (existing) {
    existing.qty = Math.round((existing.qty + 1) * 100) / 100;
  } else {
    posCart.push({
      id: product.id,
      name: product.name,
      variantName: variantName,
      price: price || product.price,
      img: variantImg || product.img,
      qty: 1,
      unit: product.unit || '',
      wholesale: product.wholesale || []
    });
  }

  renderPosCart();
};

// -----------------------------------------------------------------------------
// 5. UNIVERSAL FLOATING CART MANAGEMENT & DRAWER
// -----------------------------------------------------------------------------
window.openPosCartDrawer = () => {
  const modal = el('pos-cart-drawer-modal');
  const box = el('pos-cart-drawer-box');
  if (modal && box) {
    show('pos-cart-drawer-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-full');
      box.classList.remove('sm:translate-x-full');
    }, 10);
  }
};

window.closePosCartDrawer = () => {
  const modal = el('pos-cart-drawer-modal');
  const box = el('pos-cart-drawer-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-full');
    box.classList.add('sm:translate-x-full');
    setTimeout(() => hide('pos-cart-drawer-modal'), 300);
  }
};

window.updatePosQty = (index, delta) => {
  if (!posCart[index]) return;
  const newQty = Math.round((posCart[index].qty + delta) * 100) / 100;
  if (newQty <= 0) {
    posCart.splice(index, 1);
  } else {
    posCart[index].qty = newQty;
  }
  renderPosCart();
};

window.removePosItem = (index) => {
  if (!posCart[index]) return;
  posCart.splice(index, 1);
  renderPosCart();
};

window.clearPosCart = () => {
  if (!posCart.length) return;
  showConfirm("Kosongkan Keranjang", "Batalkan seluruh item di transaksi kasir saat ini?", () => {
    posCart = [];
    renderPosCart();
    closePosCartDrawer();
    showToast("Keranjang transaksi dikosongkan");
  });
};

// Modal Edit Kuantitas Desimal
window.openPosQtyModal = (cartIndex) => {
  if (!posCart[cartIndex]) return;
  currentEditingCartIndex = cartIndex;
  const item = posCart[cartIndex];

  setIn('pos-qty-prod-name', `${item.name}${item.variantName ? ` (${item.variantName})` : ''}`);
  setIn('pos-qty-modal-unit', item.unit || 'PCS');

  const input = el('pos-qty-modal-input');
  if (input) {
    input.value = item.qty;
  }

  const modal = el('pos-qty-modal');
  const box = el('pos-qty-box');
  if (modal && box) {
    show('pos-qty-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('scale-95');
      if (input) { input.focus(); input.select(); }
    }, 10);
  }
};

window.closePosQtyModal = () => {
  const modal = el('pos-qty-modal');
  const box = el('pos-qty-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('scale-95');
    setTimeout(() => hide('pos-qty-modal'), 300);
  }
};

window.setPosQtyPreset = (amount) => {
  const input = el('pos-qty-modal-input');
  if (input) input.value = amount;
};

window.savePosQtyModal = () => {
  if (currentEditingCartIndex === null || !posCart[currentEditingCartIndex]) return;
  const val = parseFloat(el('pos-qty-modal-input')?.value || '1');
  if (val <= 0 || isNaN(val)) {
    posCart.splice(currentEditingCartIndex, 1);
  } else {
    posCart[currentEditingCartIndex].qty = Math.round(val * 100) / 100;
  }
  closePosQtyModal();
  renderPosCart();
};

const renderPosCart = () => {
  const drawerContainer = el('pos-drawer-cart-items-container');
  const floatDock = el('pos-floating-cart-dock');
  const floatDockCount = el('pos-float-dock-count');
  const floatDockTotal = el('pos-float-dock-total');
  const drawerCount = el('pos-drawer-cart-count');

  const totalItems = posCart.length;
  const totalQty = posCart.reduce((acc, item) => acc + item.qty, 0);
  const formattedQty = Math.round(totalQty * 100) / 100;

  if (topBadge) {
    topBadge.innerText = formattedQty;
    topBadge.classList.toggle('hidden', totalItems === 0);
  }
  if (floatDockCount) floatDockCount.innerText = `${totalItems} Item (${formattedQty})`;
  if (drawerCount) drawerCount.innerText = `${totalItems} Produk (${formattedQty} Unit)`;

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

    setIn('pos-drawer-summary-subtotal', 'Rp 0');
    setIn('pos-drawer-summary-discount', 'Rp 0');
    setIn('pos-drawer-summary-total', 'Rp 0');
    if (floatDockTotal) floatDockTotal.innerText = 'Rp 0';
    return;
  }

  // Show Floating Cart Dock
  if (floatDock) {
    floatDock.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
  }

  let subtotal = 0;
  let totalDiscount = 0;

  const itemsHtml = posCart.map((item, idx) => {
    const origPrice = item.price;
    const effPrice = getEffP(item);
    const itemSubtotal = effPrice * item.qty;
    const isWholesale = effPrice < origPrice;

    subtotal += origPrice * item.qty;
    totalDiscount += (origPrice - effPrice) * item.qty;

    return `
      <div class="bg-white dark:bg-[#0b1329] p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 shadow-sm">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${esc(item.name)}</h5>
            ${item.variantName ? `<span class="badge badge-xs badge-slate font-bold">${esc(item.variantName)}</span>` : ''}
            ${isWholesale ? '<span class="badge badge-xs badge-amber font-bold">GROSIR</span>' : ''}
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            <span>${fCur(effPrice)}</span>
            ${item.unit ? `<span>/ ${esc(item.unit)}</span>` : ''}
            <span>•</span>
            <span class="font-black text-slate-800 dark:text-slate-200">${fCur(itemSubtotal)}</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <div class="flex bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl h-8 overflow-hidden">
            <button type="button" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors" onclick="updatePosQty(${idx}, -1)">
              <i class="fa-solid fa-minus text-[8px]"></i>
            </button>
            <button type="button" class="min-w-[32px] px-1.5 flex items-center justify-center text-xs font-black text-slate-800 dark:text-white bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors" onclick="openPosQtyModal(${idx})" title="Klik untuk ubah desimal">
              ${item.qty}
            </button>
            <button type="button" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors" onclick="updatePosQty(${idx}, 1)">
              <i class="fa-solid fa-plus text-[8px]"></i>
            </button>
          </div>
          <button type="button" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors" onclick="removePosItem(${idx})" title="Hapus Item">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (drawerContainer) drawerContainer.innerHTML = itemsHtml;

  const grandTotal = subtotal - totalDiscount;
  const fSubtotal = fCur(subtotal);
  const fDiscount = totalDiscount > 0 ? `- ${fCur(totalDiscount)}` : 'Rp 0';
  const fGrand = fCur(grandTotal);

  setIn('pos-drawer-summary-subtotal', fSubtotal);
  setIn('pos-drawer-summary-discount', fDiscount);
  setIn('pos-drawer-summary-total', fGrand);
  if (floatDockTotal) floatDockTotal.innerText = fGrand;
};

// -----------------------------------------------------------------------------
// 6. POS QUICK PAYMENT MODAL & CHECKOUT
// -----------------------------------------------------------------------------
window.openPosPaymentModal = () => {
  if (!posCart.length) return;

  const total = posCart.reduce((sum, item) => sum + (getEffP(item) * item.qty), 0);
  setIn('pos-modal-total-display', fCur(total));
  
  setPosPaymentMethod('cash');
  
  const cashInput = el('pos-cash-received-input');
  if (cashInput) {
    cashInput.value = total;
    calculatePosChange();
  }

  const modal = el('pos-payment-modal');
  const box = el('pos-payment-box');
  if (modal && box) {
    show('pos-payment-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('scale-95');
      if (cashInput) cashInput.focus();
    }, 10);
  }
};

window.closePosPaymentModal = () => {
  const modal = el('pos-payment-modal');
  const box = el('pos-payment-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('scale-95');
    setTimeout(() => hide('pos-payment-modal'), 300);
  }
};

window.setPosPaymentMethod = (method) => {
  posPaymentMethod = method;
  
  const buttons = document.querySelectorAll('.pos-method-btn');
  buttons.forEach(btn => {
    const isSelected = btn.getAttribute('data-method') === method;
    if (isSelected) {
      btn.className = 'p-2 sm:p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all pos-method-btn border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300';
    } else {
      btn.className = 'p-2 sm:p-2.5 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all pos-method-btn border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300';
    }
  });

  const cashSection = el('pos-cash-input-section');
  if (cashSection) {
    cashSection.classList.toggle('hidden', method !== 'cash');
  }
};

window.setQuickCash = (amount) => {
  const total = posCart.reduce((sum, item) => sum + (getEffP(item) * item.qty), 0);
  const input = el('pos-cash-received-input');
  if (!input) return;

  if (amount === 'exact') {
    input.value = total;
  } else {
    input.value = amount;
  }
  calculatePosChange();
};

window.calculatePosChange = () => {
  const total = posCart.reduce((sum, item) => sum + (getEffP(item) * item.qty), 0);
  const received = parseFloat(el('pos-cash-received-input')?.value || '0');
  const change = received - total;

  const changeDisplay = el('pos-change-display');
  if (changeDisplay) {
    if (change < 0) {
      changeDisplay.innerText = `Kurang ${fCur(Math.abs(change))}`;
      changeDisplay.className = 'text-base sm:text-lg font-black text-rose-500';
    } else {
      changeDisplay.innerText = fCur(change);
      changeDisplay.className = 'text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400';
    }
  }
};

window.submitPosTransaction = async () => {
  if (!posCart.length) return;

  const total = posCart.reduce((sum, item) => sum + (getEffP(item) * item.qty), 0);
  const received = parseFloat(el('pos-cash-received-input')?.value || '0');

  if (posPaymentMethod === 'cash' && received < total) {
    showToast("Uang yang diterima kurang dari total tagihan!");
    return;
  }

  const custName = (el('pos-customer-name')?.value || '').trim() || 'Pelanggan Umum (Walk-in)';
  const cashierName = activeCashier?.name || (cRole === 'admin' ? 'Admin Master' : 'Kasir Toko');
  const orderId = `POS-${Date.now().toString().slice(-6)}`;

  const orderData = {
    id: orderId,
    type: 'pos',
    source: 'POS Kasir',
    customer: {
      name: custName,
      phone: '-',
      address: 'Transaksi Langsung di Kasir',
      method: 'Ambil di Toko / POS Kasir'
    },
    items: posCart.map(item => ({
      id: item.id,
      name: item.name,
      variantName: item.variantName || null,
      price: getEffP(item),
      qty: item.qty,
      unit: item.unit || ''
    })),
    subtotal: total,
    total: total,
    payment: {
      method: posPaymentMethod === 'cash' ? 'Tunai (Kasir)' : (posPaymentMethod === 'qris' ? 'QRIS E-Wallet' : (posPaymentMethod === 'transfer' ? 'Transfer Bank' : 'Debit/EDC')),
      status: 'Lunas',
      cashReceived: posPaymentMethod === 'cash' ? received : total,
      change: posPaymentMethod === 'cash' ? (received - total) : 0
    },
    status: 'Selesai',
    cashier: cashierName,
    createdAt: new Date().toISOString()
  };

  sLoad("Menyimpan Transaksi POS...");

  try {
    if (typeof db !== 'undefined' && db.collection) {
      await db.collection('orders').doc(orderId).set(orderData);
    }
    
    hLoad();
    closePosPaymentModal();
    closePosCartDrawer();
    showToast("Transaksi Berhasil Disimpan! 🎉");

    if (typeof openReceiptPreview === 'function') {
      openReceiptPreview(orderData);
    }

    posCart = [];
    renderPosCart();
    if (el('pos-customer-name')) el('pos-customer-name').value = '';
    
  } catch (error) {
    console.error('[FreshMart POS] Error submitting transaction:', error);
    hLoad();
    showToast("Gagal menyimpan transaksi POS: " + error.message);
  }
};
