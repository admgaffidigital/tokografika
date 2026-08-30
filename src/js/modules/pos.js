// =============================================================================
// POS KASIR (POINT OF SALE) & LOGIN SWITCHER MODULE - MOBILE FIRST & SPACIOUS
// =============================================================================

let posCart = [];
let activeCashier = null;
let currentLoginTab = 'admin';
let posActiveCategory = 'Semua Produk';
let posSearchQuery = '';
let posPaymentMethod = 'cash';
let posClockInterval = null;

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
  
  // Set Kasir Name & Store Name
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

  // Tombol ke CMS jika kasir memiliki permission atau admin master
  const btnCms = el('btn-pos-to-admin');
  if (btnCms) {
    const hasAdminPerm = cRole === 'admin' || (cPerms && cPerms.length > 0);
    btnCms.classList.toggle('hidden', !hasAdminPerm);
  }

  // Start Realtime POS Clock
  if (posClockInterval) clearInterval(posClockInterval);
  updatePosClock();
  posClockInterval = setInterval(updatePosClock, 1000);

  // Render Categories & Catalog
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
// 3. POS CATALOG & PRODUCT SELECTION
// -----------------------------------------------------------------------------
const renderPosCategories = () => {
  const container = el('pos-categories-container');
  if (!container) return;

  const categories = ['Semua Produk', ...(appData.categories || []).map(c => c.name)];
  
  container.innerHTML = categories.map(cat => `
    <button type="button" onclick="filterPosCategory('${esc(cat)}')" class="shrink-0 px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${posActiveCategory === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'}">
      ${esc(cat)}
    </button>
  `).join('');
};

window.filterPosCategory = (cat) => {
  posActiveCategory = cat;
  renderPosCategories();
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
  const grid = el('pos-product-grid');
  if (!grid) return;

  const filtered = (appData.products || []).filter(p => {
    if (posActiveCategory !== 'Semua Produk' && p.category !== posActiveCategory) return false;
    if (!posSearchQuery) return true;
    const q = posSearchQuery.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q) ||
      (p.variants && p.variants.some(v => (v.sku || '').toLowerCase().includes(q)));
  });

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="col-span-full py-12 sm:py-16 text-center text-slate-400 dark:text-slate-500 font-bold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <i class="fa-solid fa-box-open text-3xl mb-2 block opacity-40"></i>
        Produk tidak ditemukan
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isActive = p.isActive !== 'false' && p.isActive !== false;
    return `
      <div class="card-modern bg-white dark:bg-slate-900 rounded-2xl p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-sm group flex flex-col justify-between active:scale-95 select-none" onclick="addPosItem(${p.id})">
        <div class="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-1.5 border border-slate-200/50 dark:border-slate-700/50">
          <img src="${esc(p.img || '')}" onerror="window.imgErrRetry(this,'No Image',200)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!isActive ? 'grayscale opacity-40' : ''}"/>
          ${!isActive ? '<div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center"><span class="badge badge-solid-rose text-[8px] font-bold">KOSONG</span></div>' : ''}
          ${p.wholesale?.length ? '<span class="absolute top-1 left-1 bg-amber-500 text-white text-[7px] sm:text-[8px] font-extrabold px-1.5 py-0.5 rounded shadow"><i class="fa-solid fa-tags"></i> Grosir</span>' : ''}
        </div>
        <div class="flex-1 flex flex-col justify-between min-w-0 px-0.5">
          <h4 class="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${esc(p.name)}</h4>
          <div class="flex items-baseline justify-between gap-1 mt-auto pt-1">
            <span class="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">${fCur(p.price)}</span>
            ${p.unit ? `<span class="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">/${esc(p.unit)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
};

// -----------------------------------------------------------------------------
// 4. POS CART MANAGEMENT & MOBILE BOTTOM SHEET
// -----------------------------------------------------------------------------
window.addPosItem = (productId, variantIndex = 0) => {
  const p = (appData.products || []).find(x => x.id === productId);
  if (!p) return;

  const isActive = p.isActive !== 'false' && p.isActive !== false;
  if (!isActive) {
    showToast("Produk sedang kosong!");
    return;
  }

  const v = p.variants?.[variantIndex];
  const vName = v?.name || null;
  const price = v?.price ?? p.price;

  const existing = posCart.find(item => item.id === p.id && item.variantName === vName);
  if (existing) {
    existing.qty += 1;
  } else {
    posCart.push({
      id: p.id,
      name: p.name,
      variantName: vName,
      price: price,
      img: v?.img || p.img,
      qty: 1,
      unit: p.unit || '',
      wholesale: p.wholesale || []
    });
  }

  renderPosCart();
};

window.updatePosQty = (index, delta) => {
  if (!posCart[index]) return;
  posCart[index].qty += delta;
  if (posCart[index].qty <= 0) {
    posCart.splice(index, 1);
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
    closePosCartBottomSheet();
    showToast("Keranjang transaksi dikosongkan");
  });
};

const renderPosCart = () => {
  const desktopContainer = el('pos-cart-items-container');
  const mobileContainer = el('pos-mob-cart-items-container');
  const emptyState = el('pos-cart-empty');
  const countEl = el('pos-cart-count');
  const mobCountEl = el('pos-mob-cart-count');
  const btnPay = el('btn-pos-pay');
  const mobFloatingBar = el('pos-mobile-floating-bar');
  const mobBarCount = el('pos-mob-bar-count');
  const mobBarTotal = el('pos-mob-bar-total');

  const totalQty = posCart.reduce((acc, item) => acc + item.qty, 0);
  if (countEl) countEl.innerText = `${totalQty} Item`;
  if (mobCountEl) mobCountEl.innerText = `${totalQty} Item`;
  if (mobBarCount) mobBarCount.innerText = `${totalQty} Item`;

  if (!posCart.length) {
    if (desktopContainer) desktopContainer.innerHTML = '';
    if (mobileContainer) mobileContainer.innerHTML = '<div class="py-12 text-center text-slate-400 text-xs font-bold"><i class="fa-solid fa-basket-shopping text-2xl mb-2 block opacity-40"></i>Keranjang Masih Kosong</div>';
    if (emptyState && desktopContainer) desktopContainer.appendChild(emptyState);
    if (btnPay) btnPay.disabled = true;
    if (mobFloatingBar) mobFloatingBar.classList.add('translate-y-24');

    setIn('pos-summary-subtotal', 'Rp 0');
    setIn('pos-summary-discount', 'Rp 0');
    setIn('pos-summary-total', 'Rp 0');
    setIn('pos-mob-summary-subtotal', 'Rp 0');
    setIn('pos-mob-summary-discount', 'Rp 0');
    setIn('pos-mob-summary-total', 'Rp 0');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (btnPay) btnPay.disabled = false;
  if (mobFloatingBar) mobFloatingBar.classList.remove('translate-y-24');

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
      <div class="bg-white dark:bg-[#0b1329] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-sm">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${esc(item.name)}</h5>
            ${isWholesale ? '<span class="badge badge-xs badge-amber font-bold">GROSIR</span>' : ''}
          </div>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            <span>${fCur(effPrice)}</span>
            ${item.unit ? `<span>/ ${esc(item.unit)}</span>` : ''}
            <span>•</span>
            <span class="font-extrabold text-slate-800 dark:text-slate-200">${fCur(itemSubtotal)}</span>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <div class="flex bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-7 overflow-hidden">
            <button type="button" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold" onclick="updatePosQty(${idx}, -1)">
              <i class="fa-solid fa-minus text-[9px]"></i>
            </button>
            <span class="w-7 flex items-center justify-center text-xs font-extrabold text-slate-800 dark:text-white bg-white dark:bg-slate-900">${item.qty}</span>
            <button type="button" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold" onclick="updatePosQty(${idx}, 1)">
              <i class="fa-solid fa-plus text-[9px]"></i>
            </button>
          </div>
          <button type="button" class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" onclick="removePosItem(${idx})">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (desktopContainer) desktopContainer.innerHTML = itemsHtml;
  if (mobileContainer) mobileContainer.innerHTML = itemsHtml;

  const grandTotal = subtotal - totalDiscount;
  const fSubtotal = fCur(subtotal);
  const fDiscount = totalDiscount > 0 ? `- ${fCur(totalDiscount)}` : 'Rp 0';
  const fGrand = fCur(grandTotal);

  setIn('pos-summary-subtotal', fSubtotal);
  setIn('pos-summary-discount', fDiscount);
  setIn('pos-summary-total', fGrand);

  setIn('pos-mob-summary-subtotal', fSubtotal);
  setIn('pos-mob-summary-discount', fDiscount);
  setIn('pos-mob-summary-total', fGrand);
  if (mobBarTotal) mobBarTotal.innerText = fGrand;
};

// Mobile Bottom Sheet Controls
window.openPosCartBottomSheet = () => {
  const modal = el('pos-mobile-cart-modal');
  const box = el('pos-mobile-cart-box');
  if (modal && box) {
    show('pos-mobile-cart-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-full');
    }, 10);
  }
};

window.closePosCartBottomSheet = () => {
  const modal = el('pos-mobile-cart-modal');
  const box = el('pos-mobile-cart-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-full');
    setTimeout(() => hide('pos-mobile-cart-modal'), 300);
  }
};

// -----------------------------------------------------------------------------
// 5. POS PAYMENT MODAL & CHECKOUT
// -----------------------------------------------------------------------------
window.openPosPaymentModal = () => {
  if (!posCart.length) return;

  const total = posCart.reduce((sum, item) => sum + (getEffP(item) * item.qty), 0);
  setIn('pos-modal-total-display', fCur(total));
  
  // Default to Tunai
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
    closePosCartBottomSheet();
    showToast("Transaksi Berhasil Disimpan! 🎉");

    // Buka Modal Cetak Struk Instan
    if (typeof openReceiptPreview === 'function') {
      openReceiptPreview(orderData);
    }

    // Reset Form & Keranjang
    posCart = [];
    renderPosCart();
    if (el('pos-customer-name')) el('pos-customer-name').value = '';
    
  } catch (error) {
    console.error('[FreshMart POS] Error submitting transaction:', error);
    hLoad();
    showToast("Gagal menyimpan transaksi POS: " + error.message);
  }
};
