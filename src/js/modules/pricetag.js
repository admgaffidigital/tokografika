// =============================================================================
// FRESHMART PRICETAG & LABEL BARCODE STUDIO ENGINE (THEME-SYNCHRONIZED & PRECISE)
// =============================================================================
// Modul pembuatan & pencetakan label harga rak (shelf price tags) dan stiker barcode.
// Menggunakan kanvas standar Kertas A4 Potret (210 x 297 mm) dengan presisi millimeter,
// antarmuka tab bersegmen yang lega & responsif di smartphone maupun desktop.
// =============================================================================

window.pricetagItems = []; // Array of items to be printed
window.currentPricetagTab = 'products'; // 'products' | 'settings' | 'preview'

// Settings default (A4 Portrait Standar)
window.pricetagSettings = {
  paperType: 'a4_3x8', // 'a4_3x8' | 'a4_2x6' | 'a4_4x10' | 'thermal_58' | 'thermal_80'
  layoutTemplate: 'gondola_standard', // 'gondola_standard' | 'gondola_wholesale' | 'mini_barcode'
  showStoreName: true,
  showBarcode: true,
  showWholesale: true,
  showDate: true,
  showCutGuide: true,
  showUnit: true
};

// SVG Barcode Generator (Super Crisp Vector Barcode - 100% Vector No Pixelation)
const _generatePricetagBarcodeSvg = (codeStr, w = 75, h = 15) => {
  const clean = String(codeStr || '000000').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return '';

  // Deterministic Code-128 style vector bar pattern
  const pattern = [2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 2, 1, 1, 3, 1, 2, 1];
  
  const totalUnits = pattern.reduce((a, b) => a + b, 0);
  const unitWidth = w / totalUnits;
  
  let x = 0;
  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    const barW = pattern[i] * unitWidth;
    if (i % 2 === 0) {
      rects += `<rect x="${x.toFixed(2)}" y="0" width="${barW.toFixed(2)}" height="${h}" fill="#000000" />`;
    }
    x += barW;
  }

  return `
    <div style="display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; width:${w}px; max-width:100%; margin:0;">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="width:${w}px; height:${h}px; display:block;">
        ${rects}
      </svg>
      <span style="font-size:6pt; font-family:'Courier New', monospace; font-weight:800; letter-spacing:0.3px; line-height:1; color:#000000; margin-top:1px;">${clean}</span>
    </div>
  `;
};

// ==========================================
// TAB SWITCHER (PRODUCTS, SETTINGS, PREVIEW)
// ==========================================

window.switchPricetagTab = (tabKey) => {
  window.currentPricetagTab = tabKey || 'products';

  const tabs = ['products', 'settings', 'preview'];
  tabs.forEach(t => {
    const btn = el(`pt-tab-btn-${t}`);
    const view = el(`pt-tab-view-${t}`);
    
    if (t === window.currentPricetagTab) {
      if (btn) {
        btn.className = 'flex-1 sm:flex-none px-3.5 sm:px-5 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all bg-white dark:bg-slate-700 shadow-sm border-2';
        btn.style.color = 'var(--clr-p, #059669)';
        btn.style.borderColor = 'var(--clr-p, #059669)';
      }
      if (view) view.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = 'flex-1 sm:flex-none px-3.5 sm:px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border-2 border-transparent';
        btn.style.color = '';
        btn.style.borderColor = 'transparent';
      }
      if (view) view.classList.add('hidden');
    }
  });

  if (window.currentPricetagTab === 'preview') {
    renderPricetagPreview();
  }
};

// ==========================================
// MODAL CONTROLS & ITEM MANAGEMENT
// ==========================================

window.openPricetagModal = (presetProductIds = null) => {
  const modal = el('pricetag-modal');
  const box = el('pricetag-modal-box');
  if (!modal || !box) return;

  // Jika ada preset product IDs yang di-pass
  if (Array.isArray(presetProductIds) && presetProductIds.length > 0) {
    window.pricetagItems = [];
    presetProductIds.forEach(id => {
      const p = (appData.products || []).find(x => String(x.id) === String(id));
      if (p) {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach(v => {
            _addPricetagItemFromProduct(p, v);
          });
        } else {
          _addPricetagItemFromProduct(p, null);
        }
      }
    });
  } else if (!window.pricetagItems || window.pricetagItems.length === 0) {
    // Default: muat 3 produk pertama agar admin langsung melihat preview
    const sampleList = (appData.products || []).slice(0, 3);
    window.pricetagItems = [];
    sampleList.forEach(p => {
      _addPricetagItemFromProduct(p, null);
    });
  }

  // Set inputs according to state
  setV('pt-paper-type', window.pricetagSettings.paperType);
  setV('pt-layout-template', window.pricetagSettings.layoutTemplate);
  if (el('pt-opt-store-name')) el('pt-opt-store-name').checked = window.pricetagSettings.showStoreName;
  if (el('pt-opt-barcode')) el('pt-opt-barcode').checked = window.pricetagSettings.showBarcode;
  if (el('pt-opt-wholesale')) el('pt-opt-wholesale').checked = window.pricetagSettings.showWholesale;
  if (el('pt-opt-date')) el('pt-opt-date').checked = window.pricetagSettings.showDate;
  if (el('pt-opt-cut-guide')) el('pt-opt-cut-guide').checked = window.pricetagSettings.showCutGuide;
  if (el('pt-opt-unit')) el('pt-opt-unit').checked = window.pricetagSettings.showUnit;

  switchPricetagTab('products');
  renderPricetagItemList();
  renderPricetagPreview();

  show('pricetag-modal');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    box.classList.remove('translate-y-6');
  }, 10);
};

window.closePricetagModal = () => {
  const modal = el('pricetag-modal');
  const box = el('pricetag-modal-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-6');
    setTimeout(() => hide('pricetag-modal'), 250);
  }
};

const _addPricetagItemFromProduct = (p, variant = null, qty = 1) => {
  if (!p) return;
  const isVar = !!variant;
  const price = isVar ? (variant.price || p.price || 0) : (p.price || 0);
  const sku = isVar ? (variant.sku || p.sku || '-') : (p.sku || '-');
  const vName = isVar ? (variant.name || '') : '';
  const itemUid = 'PT-' + p.id + (isVar ? '-' + (variant.id || vName) : '');

  // Cek apakah item sudah ada di daftar
  const existing = window.pricetagItems.find(it => it.uid === itemUid);
  if (existing) {
    existing.qty += qty;
    return;
  }

  window.pricetagItems.push({
    uid: itemUid,
    productId: p.id,
    productName: p.name || 'Produk',
    category: p.category || 'Umum',
    sku: sku,
    variantId: isVar ? (variant.id || vName) : null,
    variantName: vName,
    unit: p.unit || 'Pcs',
    price: price,
    wholesale: Array.isArray(p.wholesale) ? p.wholesale : [],
    showWholesale: true,
    qty: Math.max(1, qty),
    supplierName: p.supplierName || ''
  });
};

window.openPricetagForSingleProduct = (productId) => {
  window.openPricetagModal([productId]);
};

window.openPricetagProductPicker = () => {
  const products = appData.products || [];
  if (!products.length) return showToast('Belum ada data produk di katalog!');

  const promptHtml = `
    <div class="p-2 space-y-3">
      <p class="text-xs text-slate-600 dark:text-slate-300 font-semibold">Pilih produk yang ingin ditambahkan ke daftar cetak label harga:</p>
      <div class="relative">
        <input type="text" id="pt-picker-search" placeholder="Cari nama produk / SKU..." oninput="(function(q){
          const items = document.querySelectorAll('.pt-picker-item');
          items.forEach(it => {
            const txt = it.getAttribute('data-text') || '';
            it.style.display = txt.includes(q.toLowerCase()) ? 'flex' : 'none';
          });
        })(this.value)" class="admin-input !py-2.5 !pl-9 text-xs w-full font-bold" />
        <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
      </div>
      <div class="max-h-64 overflow-y-auto space-y-2 pr-1" id="pt-picker-list">
        ${products.map(p => {
          const hasVars = p.variants && p.variants.length > 0;
          return `
            <div data-text="${esc((p.name + ' ' + (p.sku || '') + ' ' + (p.category || '')).toLowerCase())}" class="pt-picker-item flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 transition-all gap-2.5 shadow-xs">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <img src="${esc(p.img || 'https://placehold.co/100?text=Img')}" onerror="this.src='https://placehold.co/100?text=Img'" class="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                <div class="min-w-0 flex-1">
                  <span class="block font-bold text-xs text-slate-800 dark:text-white truncate">${esc(p.name)}</span>
                  <span class="text-[10px] text-slate-400 font-semibold">${p.sku ? `SKU: ${esc(p.sku)} • ` : ''}${hasVars ? `<span class="text-indigo-500 font-bold">${p.variants.length} Varian</span>` : fCur(p.price)}</span>
                </div>
              </div>
              <button type="button" onclick="addPricetagProductFromPicker('${p.id}')" class="px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1 shadow-xs shrink-0 active:scale-95 transition-all" style="background-color:var(--clr-p, #059669);">
                <i class="fa-solid fa-plus text-[10px]"></i> Tambah
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  showConfirm("Pilih Produk untuk Label Harga", promptHtml, () => {}, "Selesai", false);
};

window.addPricetagProductFromPicker = (productId) => {
  const p = (appData.products || []).find(x => String(x.id) === String(productId));
  if (!p) return;

  if (p.variants && p.variants.length > 0) {
    p.variants.forEach(v => _addPricetagItemFromProduct(p, v));
    showToast(`Semua varian "${p.name}" ditambahkan!`);
  } else {
    _addPricetagItemFromProduct(p, null);
    showToast(`"${p.name}" ditambahkan!`);
  }

  renderPricetagItemList();
  renderPricetagPreview();
};

window.addAllPricetags = () => {
  const products = appData.products || [];
  if (!products.length) return showToast('Belum ada produk!');
  
  products.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => _addPricetagItemFromProduct(p, v));
    } else {
      _addPricetagItemFromProduct(p, null);
    }
  });

  showToast(`Semua produk (${window.pricetagItems.length} label) ditambahkan!`);
  renderPricetagItemList();
  renderPricetagPreview();
};

window.openPricetagBatchCategoryPicker = () => {
  const categories = appData.categories || [];
  if (!categories.length) return showToast('Belum ada kategori!');

  const promptHtml = `
    <div class="p-2 space-y-2">
      <p class="text-xs text-slate-600 dark:text-slate-300 font-semibold">Pilih kategori untuk menambahkan seluruh produknya ke daftar cetak:</p>
      <div class="max-h-60 overflow-y-auto space-y-1.5">
        ${categories.map(c => {
          const pCount = (appData.products || []).filter(p => (p.category || '').toLowerCase() === (c.name || '').toLowerCase()).length;
          return `
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-500 transition-all">
              <div>
                <span class="font-bold text-xs text-slate-800 dark:text-white block">${esc(c.name)}</span>
                <span class="text-[10px] text-slate-400">${pCount} Produk</span>
              </div>
              <button type="button" onclick="addBatchPricetagByCategory('${esc(c.name)}')" class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                + Tambahkan
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  showConfirm("Pilih Kategori Produk", promptHtml, () => {}, "Tutup", false);
};

window.addBatchPricetagByCategory = (categoryName) => {
  const prods = (appData.products || []).filter(p => (p.category || '').toLowerCase() === (categoryName || '').toLowerCase());
  if (!prods.length) return showToast(`Tidak ada produk di kategori ${categoryName}!`);
  
  prods.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => _addPricetagItemFromProduct(p, v));
    } else {
      _addPricetagItemFromProduct(p, null);
    }
  });

  closeConfirm();
  showToast(`${prods.length} produk kategori "${categoryName}" ditambahkan!`);
  renderPricetagItemList();
  renderPricetagPreview();
};

window.openPricetagBatchSupplierPicker = () => {
  const suppliers = appData.suppliers || [];
  if (!suppliers.length) return showToast('Belum ada data supplier!');

  const promptHtml = `
    <div class="p-2 space-y-2">
      <p class="text-xs text-slate-600 dark:text-slate-300 font-semibold">Pilih supplier rekanan untuk menambahkan seluruh produknya:</p>
      <div class="max-h-60 overflow-y-auto space-y-1.5">
        ${suppliers.map(s => {
          const pCount = (appData.products || []).filter(p => String(p.supplierId) === String(s.id)).length;
          return `
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-500 transition-all">
              <div>
                <span class="font-bold text-xs text-slate-800 dark:text-white block">${esc(s.name)}</span>
                <span class="text-[10px] text-slate-400">${pCount} Produk Tertaut</span>
              </div>
              <button type="button" onclick="addBatchPricetagBySupplier('${s.id}')" class="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
                + Tambahkan
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  showConfirm("Pilih Supplier Rekanan", promptHtml, () => {}, "Tutup", false);
};

window.addBatchPricetagBySupplier = (supplierId) => {
  const s = (appData.suppliers || []).find(x => String(x.id) === String(supplierId));
  const prods = (appData.products || []).filter(p => String(p.supplierId) === String(supplierId));
  if (!prods.length) return showToast(`Tidak ada produk tertaut ke supplier ini!`);

  prods.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach(v => _addPricetagItemFromProduct(p, v));
    } else {
      _addPricetagItemFromProduct(p, null);
    }
  });

  closeConfirm();
  showToast(`${prods.length} produk dari "${s ? s.name : 'Supplier'}" ditambahkan!`);
  renderPricetagItemList();
  renderPricetagPreview();
};

window.clearPricetagItems = () => {
  window.pricetagItems = [];
  renderPricetagItemList();
  renderPricetagPreview();
  showToast('Daftar cetak dikosongkan.');
};

window.removePricetagItem = (index) => {
  window.pricetagItems.splice(index, 1);
  renderPricetagItemList();
  renderPricetagPreview();
};

window.updatePricetagQty = (index, deltaOrVal) => {
  const item = window.pricetagItems[index];
  if (!item) return;
  if (typeof deltaOrVal === 'number' && (deltaOrVal === 1 || deltaOrVal === -1)) {
    item.qty = Math.max(1, item.qty + deltaOrVal);
  } else {
    item.qty = Math.max(1, parseInt(deltaOrVal) || 1);
  }
  renderPricetagItemList();
  renderPricetagPreview();
};

window.setAllPricetagQty = (qty) => {
  const q = Math.max(1, parseInt(qty) || 1);
  window.pricetagItems.forEach(it => it.qty = q);
  renderPricetagItemList();
  renderPricetagPreview();
  showToast(`Semua kuantitas label diatur ke ${q} lembar.`);
};

window.togglePricetagItemWholesale = (index) => {
  const item = window.pricetagItems[index];
  if (!item) return;
  item.showWholesale = !item.showWholesale;
  renderPricetagItemList();
  renderPricetagPreview();
};

window.onPricetagSettingChange = () => {
  window.pricetagSettings.paperType = getV('pt-paper-type') || 'a4_3x8';
  window.pricetagSettings.layoutTemplate = getV('pt-layout-template') || 'gondola_standard';
  window.pricetagSettings.showStoreName = el('pt-opt-store-name') ? el('pt-opt-store-name').checked : true;
  window.pricetagSettings.showBarcode = el('pt-opt-barcode') ? el('pt-opt-barcode').checked : true;
  window.pricetagSettings.showWholesale = el('pt-opt-wholesale') ? el('pt-opt-wholesale').checked : true;
  window.pricetagSettings.showDate = el('pt-opt-date') ? el('pt-opt-date').checked : true;
  window.pricetagSettings.showCutGuide = el('pt-opt-cut-guide') ? el('pt-opt-cut-guide').checked : true;
  window.pricetagSettings.showUnit = el('pt-opt-unit') ? el('pt-opt-unit').checked : true;

  renderPricetagPreview();
};

// ==========================================
// RENDER ITEM LIST (TAB 1)
// ==========================================

window.renderPricetagItemList = () => {
  const container = el('pt-items-list');
  const badgeCount = el('pt-tab-badge-count');
  const topSummary = el('pt-top-summary');
  if (!container) return;

  const items = window.pricetagItems || [];
  const flatLabels = _getFlatLabelsList();
  const totalLabels = flatLabels.length;

  if (badgeCount) badgeCount.innerText = items.length;
  
  const labelsPerPage = window.pricetagSettings.paperType === 'a4_2x6' ? 12 : (window.pricetagSettings.paperType === 'a4_4x10' ? 40 : 24);
  const totalPages = Math.ceil(totalLabels / labelsPerPage) || 0;
  if (topSummary) topSummary.innerText = `${totalLabels} label • ${totalPages} lembar A4`;

  if (!items.length) {
    container.innerHTML = `
      <div class="p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div class="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-3.5 shadow-xs" style="background:rgba(var(--clr-p-rgb, 5, 150, 105), 0.12); color:var(--clr-p, #059669);">
          <i class="fa-solid fa-tags"></i>
        </div>
        <h4 class="text-sm font-black text-slate-800 dark:text-white">Belum Ada Produk di Daftar Cetak</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Klik tombol di bawah untuk memilih produk dari katalog toko atau gunakan opsi batch cepat.</p>
        <button type="button" onclick="openPricetagProductPicker()" class="mt-4 px-5 py-2.5 rounded-2xl text-white font-bold text-xs shadow-md active:scale-95 transition-all" style="background-color:var(--clr-p, #059669);">
          + Tambah Produk Sekarang
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((it, idx) => {
    const hasWhol = Array.isArray(it.wholesale) && it.wholesale.length > 0;
    return `
      <div class="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-slate-400 transition-all flex items-center justify-between gap-3 group">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <h5 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">${esc(it.productName)}</h5>
            ${it.variantName ? `<span class="px-2 py-0.5 rounded-md text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">${esc(it.variantName)}</span>` : ''}
          </div>
          
          <div class="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold flex-wrap">
            <span class="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">${esc(it.sku)}</span>
            <span class="font-black text-sm" style="color:var(--clr-p, #059669);">${fCur(it.price)}</span>
            <span class="text-slate-400 text-xs">/${esc(it.unit)}</span>
            ${hasWhol ? `
              <span class="cursor-pointer px-2 py-0.5 rounded-md text-[10px] font-bold ${it.showWholesale ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' : 'bg-slate-100 text-slate-400 line-through'}" onclick="togglePricetagItemWholesale(${idx})" title="Klik untuk toggle cetak rincian grosir">
                <i class="fa-solid fa-tags text-[9px]"></i> ${it.wholesale.length} Tier Grosir
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Quantity Stepper Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="flex items-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 shadow-xs">
            <button type="button" onclick="updatePricetagQty(${idx}, -1)" class="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs flex items-center justify-center active:scale-95 transition-all">-</button>
            <input type="number" min="1" value="${it.qty}" onchange="updatePricetagQty(${idx}, this.value)" class="w-9 text-center bg-transparent text-xs font-black text-slate-800 dark:text-white border-none p-0 focus:ring-0 focus:outline-none" />
            <button type="button" onclick="updatePricetagQty(${idx}, 1)" class="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-xs flex items-center justify-center active:scale-95 transition-all">+</button>
          </div>
          <button type="button" onclick="removePricetagItem(${idx})" class="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all text-xs" title="Hapus dari daftar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

// ==========================================
// RENDER LABEL CARD HTML
// ==========================================

const _buildSingleLabelHtml = (item, settings, isThermal = false, cardWidth = 'auto', cardHeight = 'auto') => {
  const storeName = (appData.store?.name || 'TOKO GRAFIKA').toUpperCase();
  const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const hasWholesale = settings.showWholesale && item.showWholesale && Array.isArray(item.wholesale) && item.wholesale.length > 0;
  const borderStyle = settings.showCutGuide ? 'border: 1px dashed #b0bec5;' : 'border: 1px solid transparent;';

  // === Auto-scale nama produk berdasarkan panjang teks ===
  const fullName = (item.productName + (item.variantName ? ` (${item.variantName})` : '')).toUpperCase();
  const nameLen = fullName.length;
  let nameFontSize, nameLineH, nameMaxLines;
  if (nameLen <= 22) {
    nameFontSize = '8.5pt'; nameLineH = '1.2'; nameMaxLines = 1;
  } else if (nameLen <= 36) {
    nameFontSize = '7.5pt'; nameLineH = '1.2'; nameMaxLines = 2;
  } else if (nameLen <= 50) {
    nameFontSize = '6.5pt'; nameLineH = '1.2'; nameMaxLines = 2;
  } else {
    nameFontSize = '5.5pt'; nameLineH = '1.15'; nameMaxLines = 3;
  }
  const nameClampStyle = `display:-webkit-box; -webkit-line-clamp:${nameMaxLines}; -webkit-box-orient:vertical; overflow:hidden;`;

  // ==========================================
  // LAYOUT 1: GONDOLA STANDAR MINIMARKET
  // ==========================================
  if (settings.layoutTemplate === 'gondola_standard') {
    const barcodeH = cardHeight === 'auto' ? 14 : 13;
    const barcodeW = cardHeight === 'auto' ? 80 : 70;
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:2mm 2.5mm; background:#ffffff; color:#000000; display:flex; flex-direction:column; gap:0; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid; border-radius:2px;">
        
        <!-- BARIS 1: Header Store + Tanggal -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #000000; padding-bottom:1.5px; margin-bottom:1.5px; flex-shrink:0; min-height:0;">
          ${settings.showStoreName ? `<span style="font-size:6.5pt; font-weight:900; letter-spacing:0.2px; color:#000000; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:65%;">${esc(storeName)}</span>` : `<span></span>`}
          ${settings.showDate ? `<span style="font-size:6pt; font-weight:700; color:#555555; white-space:nowrap; flex-shrink:0;">${dateStr}</span>` : ''}
        </div>

        <!-- BARIS 2: Nama Produk (FLEKSIBEL - tidak dipotong paksa) -->
        <div style="flex:1; min-height:0; overflow:hidden; margin-bottom:1.5px;">
          <div style="font-size:${nameFontSize}; font-weight:900; color:#000000; line-height:${nameLineH}; text-transform:uppercase; letter-spacing:-0.1px; word-break:break-word; ${nameClampStyle}">
            ${esc(fullName)}
          </div>
        </div>

        <!-- BARIS 3: Barcode (kiri) + Harga (kanan) -->
        <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:1.5mm; flex-shrink:0; min-height:0;">
          <!-- Barcode & SKU -->
          <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:flex-end; align-items:flex-start; overflow:hidden;">
            ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, barcodeW, barcodeH) : `<span style="font-size:6pt; font-family:monospace; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(item.sku)}</span>`}
          </div>

          <!-- Harga Jual Besar -->
          <div style="display:flex; flex-direction:column; align-items:flex-end; flex-shrink:0; text-align:right;">
            <div style="font-size:5.5pt; font-weight:800; color:#555555; line-height:1; text-transform:uppercase; white-space:nowrap;">
              ${settings.showUnit ? `PER ${esc(item.unit)}` : 'HARGA'}
            </div>
            <div style="font-size:12pt; font-weight:900; color:#000000; line-height:1.05; letter-spacing:-0.5px; font-family:Arial, sans-serif; white-space:nowrap;">
              ${fCur(item.price)}
            </div>
            ${hasWholesale ? `
              <div style="font-size:5pt; font-weight:800; background:#000000; color:#ffffff; padding:1px 2px; border-radius:1.5px; margin-top:1px; line-height:1; white-space:nowrap;">
                ≥${item.wholesale[0].minQty}${esc(item.unit)}: ${fCur(item.wholesale[0].price)}
              </div>
            ` : ''}
          </div>
        </div>

      </div>
    `;
  }

  // ==========================================
  // LAYOUT 2: GONDOLA GROSIR & PROMO LENGKAP
  // ==========================================
  else if (settings.layoutTemplate === 'gondola_wholesale') {
    const barcodeW2 = cardHeight === 'auto' ? 75 : 65;
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:2mm 2.5mm; background:#ffffff; color:#000000; display:flex; flex-direction:column; gap:0; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid; border-radius:2px;">

        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #000000; padding-bottom:1.5px; margin-bottom:1.5px; flex-shrink:0;">
          <span style="font-size:6.5pt; font-weight:900; color:#000; text-transform:uppercase; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:60%;">${esc(storeName)}</span>
          <span style="font-size:5.5pt; font-weight:800; background:#000; color:#fff; padding:0.5px 2.5px; border-radius:2px; white-space:nowrap; flex-shrink:0;">HEMAT GROSIR</span>
        </div>

        <!-- Nama Produk (Fleksibel) -->
        <div style="flex:1; min-height:0; overflow:hidden; margin-bottom:1.5px;">
          <div style="font-size:${nameFontSize}; font-weight:900; color:#000; line-height:${nameLineH}; text-transform:uppercase; word-break:break-word; ${nameClampStyle}">
            ${esc(fullName)}
          </div>
        </div>

        <!-- Kotak Harga Eceran + Grosir -->
        <div style="display:flex; justify-content:space-between; align-items:stretch; background:#f8fafc; border:1px solid #000; padding:1.5px 2.5px; border-radius:2px; margin-bottom:1.5px; flex-shrink:0;">
          <div style="display:flex; flex-direction:column; justify-content:center;">
            <span style="font-size:5pt; font-weight:bold; color:#444; line-height:1;">ECERAN:</span>
            <span style="font-size:9.5pt; font-weight:900; color:#000; line-height:1; white-space:nowrap;">${fCur(item.price)}</span>
          </div>
          ${hasWholesale ? `
            <div style="border-left:1px dashed #000; padding-left:3px; text-align:right; display:flex; flex-direction:column; justify-content:center;">
              <span style="font-size:5pt; font-weight:900; color:#000; line-height:1;">GROSIR ≥${item.wholesale[0].minQty} ${esc(item.unit)}:</span>
              <span style="font-size:9.5pt; font-weight:900; color:#000; line-height:1; white-space:nowrap;">${fCur(item.wholesale[0].price)}</span>
            </div>
          ` : `
            <div style="font-size:6pt; font-weight:bold; color:#666; display:flex; align-items:center;">/${esc(item.unit)}</div>
          `}
        </div>

        <!-- Barcode Footer -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-shrink:0;">
          ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, barcodeW2, 12) : `<span style="font-size:6pt; font-family:monospace; font-weight:bold; white-space:nowrap;">${esc(item.sku)}</span>`}
          ${settings.showDate ? `<span style="font-size:5.5pt; font-weight:bold; color:#666; white-space:nowrap;">${dateStr}</span>` : ''}
        </div>

      </div>
    `;
  }

  // ==========================================
  // LAYOUT 3: MINI BARCODE KOMPAK (4x10)
  // ==========================================
  else {
    // Nama lebih pendek untuk layout mini
    const miniNameLen = fullName.length;
    let miniFontSize = miniNameLen <= 20 ? '7pt' : miniNameLen <= 32 ? '6pt' : '5pt';
    const miniClamp = `display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;`;
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:1.5mm 2mm; background:#ffffff; color:#000000; display:flex; flex-direction:column; gap:0; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid; text-align:center; border-radius:2px;">
        
        <!-- Nama Produk (Mini, 2 baris maks) -->
        <div style="flex:1; min-height:0; overflow:hidden; margin-bottom:1px;">
          <div style="font-size:${miniFontSize}; font-weight:900; line-height:1.2; color:#000; text-transform:uppercase; word-break:break-word; ${miniClamp}">
            ${esc(fullName)}
          </div>
        </div>

        <!-- Barcode (Center) -->
        <div style="display:flex; justify-content:center; align-items:center; flex-shrink:0; margin:0.5px 0;">
          ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, 70, 12) : `<span style="font-size:5.5pt; font-family:monospace; font-weight:bold;">${esc(item.sku)}</span>`}
        </div>

        <!-- Satuan + Harga -->
        <div style="display:flex; justify-content:space-between; align-items:baseline; border-top:1px solid #000; padding-top:1px; flex-shrink:0;">
          <span style="font-size:5.5pt; font-weight:bold; color:#444; white-space:nowrap;">${esc(item.unit)}</span>
          <span style="font-size:9.5pt; font-weight:900; color:#000; white-space:nowrap;">${fCur(item.price)}</span>
        </div>

      </div>
    `;
  }
};

// ==========================================
// PREVIEW BUILDER (REALISTIC AUTO-FIT A4 CANVAS)
// ==========================================


const _getFlatLabelsList = () => {
  const items = window.pricetagItems || [];
  const flatLabels = [];
  items.forEach(it => {
    const q = Math.max(1, it.qty || 1);
    for (let i = 0; i < q; i++) {
      flatLabels.push(it);
    }
  });
  return flatLabels;
};

const _chunkArray = (arr, size) => {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
};

window.renderPricetagPreview = () => {
  const sheet = el('pt-live-preview-sheet');
  const summaryEl = el('pt-preview-summary');
  if (!sheet) return;

  const flatLabels = _getFlatLabelsList();
  const totalLabels = flatLabels.length;
  const settings = window.pricetagSettings;

  if (totalLabels === 0) {
    sheet.innerHTML = `
      <div class="py-16 text-center text-slate-400">
        <i class="fa-solid fa-tags text-4xl mb-3 opacity-40 block"></i>
        <span class="text-xs font-bold">Pilih produk di Tab "1. Pilih Produk" untuk melihat pratinjau lembaran A4</span>
      </div>
    `;
    if (summaryEl) summaryEl.innerText = '0 label • 0 lembar A4';
    return;
  }

  // 1. A4 GRID 3x8 (24 label per lembar A4 Potret)
  if (settings.paperType === 'a4_3x8') {
    const labelsPerPage = 24;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${pages.length} lembar A4 Potret (Grid 3x8)`;

    sheet.innerHTML = pages.map((pageItems, pageIdx) => `
      <div class="w-full max-w-[760px] bg-white rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-xl p-4 sm:p-6 mx-auto overflow-hidden relative" style="box-sizing:border-box;">
        <div class="flex justify-between items-center text-xs font-bold mb-3 pb-2 border-b border-slate-100">
          <span class="flex items-center gap-1.5" style="color:var(--clr-p, #059669);">
            <i class="fa-solid fa-file-lines"></i> Lembar A4 Potret (Grid 3x8)
          </span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">Halaman ${pageIdx + 1} dari ${pages.length}</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 2.5mm; width:100%;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '100%', '33.5mm')).join('')}
        </div>
      </div>
    `).join('');
  }
  // 2. A4 GRID BESAR 2x6 (12 label per lembar A4 Potret)
  else if (settings.paperType === 'a4_2x6') {
    const labelsPerPage = 12;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${pages.length} lembar A4 Potret (Grid 2x6 Besar)`;

    sheet.innerHTML = pages.map((pageItems, pageIdx) => `
      <div class="w-full max-w-[760px] bg-white rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-xl p-5 sm:p-7 mx-auto overflow-hidden relative" style="box-sizing:border-box;">
        <div class="flex justify-between items-center text-xs font-bold mb-3 pb-2 border-b border-slate-100">
          <span class="flex items-center gap-1.5" style="color:var(--clr-p, #059669);">
            <i class="fa-solid fa-file-lines"></i> Lembar A4 Potret (Grid 2x6 Besar)
          </span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">Halaman ${pageIdx + 1} dari ${pages.length}</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 4mm; width:100%;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '100%', '44.5mm')).join('')}
        </div>
      </div>
    `).join('');
  }
  // 3. A4 GRID MINI 4x10 (40 label per lembar A4 Potret)
  else if (settings.paperType === 'a4_4x10') {
    const labelsPerPage = 40;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${pages.length} lembar A4 Potret (Grid 4x10 Mini)`;

    sheet.innerHTML = pages.map((pageItems, pageIdx) => `
      <div class="w-full max-w-[760px] bg-white rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-xl p-4 sm:p-5 mx-auto overflow-hidden relative" style="box-sizing:border-box;">
        <div class="flex justify-between items-center text-xs font-bold mb-3 pb-2 border-b border-slate-100">
          <span class="flex items-center gap-1.5" style="color:var(--clr-p, #059669);">
            <i class="fa-solid fa-file-lines"></i> Lembar A4 Potret (Grid 4x10 Mini)
          </span>
          <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">Halaman ${pageIdx + 1} dari ${pages.length}</span>
        </div>
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 1.5mm; width:100%;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '100%', '26.5mm')).join('')}
        </div>
      </div>
    `).join('');
  }
  // 4. THERMAL ROLL (58mm / 80mm)
  else {
    const is80 = settings.paperType === 'thermal_80';
    const rollW = is80 ? '72mm' : '48mm';
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • Thermal ${is80 ? '80mm' : '58mm'} Continuous`;

    sheet.innerHTML = `
      <div class="bg-white rounded-3xl border-2 border-slate-300 shadow-md p-3 mx-auto" style="width:${rollW}; box-sizing:border-box;">
        <div style="display:flex; flex-direction:column; gap:2.5mm; width:100%;">
          ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, true, '100%', 'auto')).join('')}
        </div>
      </div>
    `;
  }
};

// ==========================================
// PRINT EXECUTION (PRECISE A4 PORTRAIT PAGINATION)
// ==========================================

const _generatePricetagPrintSheetHtml = () => {
  const flatLabels = _getFlatLabelsList();
  const settings = window.pricetagSettings;

  if (settings.paperType === 'a4_3x8') {
    const labelsPerPage = 24;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    return pages.map(pageItems => `
      <div class="pt-print-a4-page">
        <div style="display:grid; grid-template-columns: repeat(3, 64mm); grid-auto-rows: 33.5mm; gap: 2.5mm; width:100%; justify-content:center;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '64mm', '33.5mm')).join('')}
        </div>
      </div>
    `).join('');
  } else if (settings.paperType === 'a4_2x6') {
    const labelsPerPage = 12;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    return pages.map(pageItems => `
      <div class="pt-print-a4-page">
        <div style="display:grid; grid-template-columns: repeat(2, 96mm); grid-auto-rows: 44.5mm; gap: 4mm; width:100%; justify-content:center;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '96mm', '44.5mm')).join('')}
        </div>
      </div>
    `).join('');
  } else if (settings.paperType === 'a4_4x10') {
    const labelsPerPage = 40;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    return pages.map(pageItems => `
      <div class="pt-print-a4-page">
        <div style="display:grid; grid-template-columns: repeat(4, 47mm); grid-auto-rows: 26.5mm; gap: 2mm; width:100%; justify-content:center;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '47mm', '26.5mm')).join('')}
        </div>
      </div>
    `).join('');
  } else if (settings.paperType === 'thermal_58') {
    return `
      <div style="width:48mm; margin:0 auto; padding:0; box-sizing:border-box;">
        <div style="display:flex; flex-direction:column; gap:2mm; width:100%;">
          ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, true, '100%', 'auto')).join('')}
        </div>
      </div>
    `;
  } else {
    return `
      <div style="width:72mm; margin:0 auto; padding:0; box-sizing:border-box;">
        <div style="display:flex; flex-direction:column; gap:2.5mm; width:100%;">
          ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, true, '100%', 'auto')).join('')}
        </div>
      </div>
    `;
  }
};

window.printPricetags = () => {
  const items = window.pricetagItems || [];
  if (!items.length) return showToast('Pilih minimal 1 produk untuk dicetak!');

  let printSection = el('pricetag-print-section');
  if (!printSection) {
    printSection = document.createElement('div');
    printSection.id = 'pricetag-print-section';
    document.body.appendChild(printSection);
  }

  // Bersihkan kelas mode print sebelumnya
  document.body.classList.remove('print-mode-report', 'print-mode-pricetag');

  // Pasang kelas mode print
  document.body.classList.add('print-mode-pricetag');

  // Render HTML cetak murni dengan pagination A4 Potret
  printSection.innerHTML = _generatePricetagPrintSheetHtml();

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-pricetag');
    }, 600);
  }, 200);
};
