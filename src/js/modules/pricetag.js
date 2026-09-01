// =============================================================================
// FRESHMART PRICETAG & LABEL BARCODE STUDIO ENGINE
// =============================================================================
// Modul pembuatan & pencetakan label harga rak (shelf price tags) dan stiker barcode.
// Mendukung kertas A4 Grid (Tom & Jerry 3x8, 2x6, 4x10), Thermal Roll (58/80mm),
// serta stiker thermal roll khusus (40x30, 60x40mm) dengan rincian varian & grosir.
// =============================================================================

window.pricetagItems = []; // Array of items to be printed

// Settings default
window.pricetagSettings = {
  paperType: 'a4_3x8', // 'a4_3x8' | 'a4_2x6' | 'a4_4x10' | 'thermal_58' | 'thermal_80' | 'sticker_40x30' | 'sticker_60x40' | 'sticker_70x40'
  layoutTemplate: 'gondola_standard', // 'gondola_standard' | 'gondola_wholesale' | 'mini_barcode'
  showStoreName: true,
  showBarcode: true,
  showWholesale: true,
  showDate: true,
  showCutGuide: true,
  showUnit: true
};

// SVG Barcode Generator (Super Crisp Vector Barcode)
const _generatePricetagBarcodeSvg = (codeStr, w = 130, h = 28) => {
  const clean = String(codeStr || '000000').toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Deterministic Code-128 style pattern
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
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; margin:2px 0;">
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="max-width:100%; height:${h}px; display:block;">
        ${rects}
      </svg>
      <span style="font-size:8px; font-family:'Courier New', monospace; font-weight:700; letter-spacing:1px; line-height:1; color:#000000; margin-top:1.5px;">${clean}</span>
    </div>
  `;
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
        })(this.value)" class="admin-input !py-2 !pl-8 text-xs w-full" />
        <i class="fa-solid fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
      </div>
      <div class="max-h-64 overflow-y-auto space-y-1.5 pr-1" id="pt-picker-list">
        ${products.map(p => {
          const hasVars = p.variants && p.variants.length > 0;
          return `
            <div data-text="${esc((p.name + ' ' + (p.sku || '') + ' ' + (p.category || '')).toLowerCase())}" class="pt-picker-item flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 transition-all gap-2">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                <img src="${esc(p.img || 'https://placehold.co/100?text=Img')}" onerror="this.src='https://placehold.co/100?text=Img'" class="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                <div class="min-w-0">
                  <span class="block font-bold text-xs text-slate-800 dark:text-white truncate">${esc(p.name)}</span>
                  <span class="text-[10px] text-slate-400 font-semibold">${p.sku ? `SKU: ${esc(p.sku)} • ` : ''}${hasVars ? `<span class="text-indigo-500 font-bold">${p.variants.length} Varian</span>` : fCur(p.price)}</span>
                </div>
              </div>
              <button type="button" onclick="addPricetagProductFromPicker('${p.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs shrink-0 active:scale-95 transition-all">
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
              <button type="button" onclick="addBatchPricetagByCategory('${esc(c.name)}')" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
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
              <button type="button" onclick="addBatchPricetagBySupplier('${s.id}')" class="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs">
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

  const badge = el('pt-badge-paper-format');
  if (badge) {
    const labels = {
      'a4_3x8': 'A4 Grid 3x8 (24 pcs)',
      'a4_2x6': 'A4 Grid Besar 2x6 (12 pcs)',
      'a4_4x10': 'A4 Grid Mini 4x10 (40 pcs)',
      'thermal_58': 'Thermal 58mm Roll',
      'thermal_80': 'Thermal 80mm Roll',
      'sticker_40x30': 'Stiker 40x30 mm',
      'sticker_60x40': 'Stiker 60x40 mm',
      'sticker_70x40': 'Stiker 70x40 mm'
    };
    badge.innerText = labels[window.pricetagSettings.paperType] || 'Format Cetak';
  }

  renderPricetagPreview();
};

// ==========================================
// RENDER ITEM LIST (LEFT PANE)
// ==========================================

window.renderPricetagItemList = () => {
  const container = el('pt-items-list');
  const countSpan = el('pt-item-count');
  if (!container) return;

  const items = window.pricetagItems || [];
  if (countSpan) countSpan.innerText = items.length;

  if (!items.length) {
    container.innerHTML = `
      <div class="p-8 text-center bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <i class="fa-solid fa-tags text-3xl text-slate-300 dark:text-slate-600 mb-2 block"></i>
        <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Belum ada produk di daftar cetak</p>
        <button type="button" onclick="openPricetagProductPicker()" class="mt-2.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-all">
          + Tambah Produk Sekarang
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map((it, idx) => {
    const hasWhol = Array.isArray(it.wholesale) && it.wholesale.length > 0;
    return `
      <div class="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3 group">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h5 class="font-bold text-xs text-slate-800 dark:text-white truncate">${esc(it.productName)}</h5>
            ${it.variantName ? `<span class="badge badge-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">${esc(it.variantName)}</span>` : ''}
          </div>
          
          <div class="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5 flex-wrap">
            <span class="font-mono">${esc(it.sku)}</span>
            <span>•</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">${fCur(it.price)}</span>
            <span>/${esc(it.unit)}</span>
            ${hasWhol ? `
              <span class="cursor-pointer ${it.showWholesale ? 'text-amber-600 font-bold' : 'text-slate-400 line-through'}" onclick="togglePricetagItemWholesale(${idx})" title="Klik untuk toggle cetak rincian grosir">
                <i class="fa-solid fa-tags text-[9px]"></i> ${it.wholesale.length} Grosir
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Quantity Controls -->
        <div class="flex items-center gap-2 shrink-0">
          <div class="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5 shadow-xs">
            <button type="button" onclick="updatePricetagQty(${idx}, -1)" class="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-xs flex items-center justify-center active:scale-95 transition-all">-</button>
            <input type="number" min="1" value="${it.qty}" onchange="updatePricetagQty(${idx}, this.value)" class="w-10 text-center bg-transparent text-xs font-black text-slate-800 dark:text-white border-none p-0 focus:ring-0 focus:outline-none" />
            <button type="button" onclick="updatePricetagQty(${idx}, 1)" class="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-xs flex items-center justify-center active:scale-95 transition-all">+</button>
          </div>
          <button type="button" onclick="removePricetagItem(${idx})" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all text-xs" title="Hapus dari daftar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

// ==========================================
// RENDER LIVE PREVIEW & PRINT ENGINE (RIGHT PANE)
// ==========================================

const _buildSingleLabelHtml = (item, settings, isThermal = false, cardWidth = 'auto', cardHeight = 'auto') => {
  const storeName = (appData.store?.name || 'TOKO GRAFIKA').toUpperCase();
  const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const hasWholesale = settings.showWholesale && item.showWholesale && Array.isArray(item.wholesale) && item.wholesale.length > 0;
  
  const borderStyle = settings.showCutGuide ? 'border: 1px dashed #cbd5e1;' : 'border: 1px solid transparent;';
  
  // Format Layout 1: Gondola Standar Minimarket
  if (settings.layoutTemplate === 'gondola_standard') {
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:4px 6px; background:#ffffff; color:#000000; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid;">
        <!-- Header: Store Name & Unit -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #000000; padding-bottom:1.5px; margin-bottom:2px;">
          ${settings.showStoreName ? `<span style="font-size:7.5px; font-weight:900; letter-spacing:0.5px; color:#000000; text-transform:uppercase;">${esc(storeName)}</span>` : `<span></span>`}
          ${settings.showDate ? `<span style="font-size:7px; font-weight:700; color:#555555;">${dateStr}</span>` : ''}
        </div>

        <!-- Product Name & Variant -->
        <div style="margin:1px 0; min-height:16px;">
          <h4 style="font-size:9.5px; font-weight:900; line-height:1.15; color:#000000; margin:0; word-break:break-word; max-height:22px; overflow:hidden; text-transform:uppercase;">
            ${esc(item.productName)} ${item.variantName ? `(${esc(item.variantName)})` : ''}
          </h4>
        </div>

        <!-- Middle / Bottom Section: Barcode on Left, Big Price on Right -->
        <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:4px; margin-top:auto;">
          <!-- Barcode & SKU -->
          <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:flex-end;">
            ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, 85, 20) : `<span style="font-size:8px; font-family:monospace; font-weight:bold;">${esc(item.sku)}</span>`}
          </div>

          <!-- Price Box (Big & Clear) -->
          <div style="text-align:right; shrink-0; display:flex; flex-direction:column; align-items:flex-end;">
            <div style="font-size:7.5px; font-weight:bold; color:#444; line-height:1;">
              ${settings.showUnit ? `PER ${esc(item.unit).toUpperCase()}` : 'HARGA'}
            </div>
            <div style="font-size:15px; font-weight:900; color:#000000; line-height:1; letter-spacing:-0.5px; font-family:Arial, sans-serif;">
              ${fCur(item.price)}
            </div>
            ${hasWholesale ? `
              <div style="font-size:7px; font-weight:800; background:#000; color:#fff; padding:1px 3px; border-radius:2px; margin-top:1.5px; line-height:1; white-space:nowrap;">
                ≥${item.wholesale[0].minQty} ${esc(item.unit)}: ${fCur(item.wholesale[0].price)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  } 
  
  // Format Layout 2: Gondola Grosir & Promo Lengkap
  else if (settings.layoutTemplate === 'gondola_wholesale') {
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:4px 6px; background:#ffffff; color:#000000; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #000000; padding-bottom:1.5px;">
          <span style="font-size:8px; font-weight:900; color:#000; text-transform:uppercase;">${esc(storeName)}</span>
          <span style="font-size:7px; font-weight:800; background:#000; color:#fff; padding:0.5px 3px; border-radius:2px;">HEMAT GROSIR</span>
        </div>

        <!-- Name -->
        <div style="margin:2px 0;">
          <h4 style="font-size:9.5px; font-weight:900; line-height:1.15; color:#000; margin:0; text-transform:uppercase;">
            ${esc(item.productName)} ${item.variantName ? `(${esc(item.variantName)})` : ''}
          </h4>
        </div>

        <!-- Price & Wholesale Tier Box -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #000; padding:2px 4px; border-radius:3px; margin:2px 0;">
          <div>
            <span style="font-size:7px; font-weight:bold; color:#444; display:block;">ECERAN:</span>
            <span style="font-size:12px; font-weight:900; color:#000;">${fCur(item.price)}</span>
          </div>
          ${hasWholesale ? `
            <div style="border-left:1px dashed #000; padding-left:4px; text-align:right;">
              <span style="font-size:7px; font-weight:900; color:#000; display:block;">GROSIR (≥${item.wholesale[0].minQty} ${esc(item.unit)}):</span>
              <span style="font-size:12px; font-weight:900; color:#000;">${fCur(item.wholesale[0].price)}</span>
            </div>
          ` : `
            <div style="font-size:8px; font-weight:bold; color:#666;">/${esc(item.unit)}</div>
          `}
        </div>

        <!-- Barcode Footer -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
          ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, 75, 16) : `<span style="font-size:7.5px; font-mono; font-weight:bold;">${esc(item.sku)}</span>`}
          ${settings.showDate ? `<span style="font-size:6.5px; font-weight:bold; color:#666;">${dateStr}</span>` : ''}
        </div>
      </div>
    `;
  }

  // Format Layout 3: Mini Barcode Kompak
  else {
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:3px 4px; background:#ffffff; color:#000000; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid; text-align:center;">
        <div style="font-size:8px; font-weight:900; line-height:1.1; color:#000; text-transform:uppercase; max-height:18px; overflow:hidden;">
          ${esc(item.productName)} ${item.variantName ? `(${esc(item.variantName)})` : ''}
        </div>
        
        <div style="margin:1px 0;">
          ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, 90, 18) : `<span style="font-size:7.5px; font-family:monospace; font-weight:bold;">${esc(item.sku)}</span>`}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:baseline; border-top:1px solid #000; padding-top:1px;">
          <span style="font-size:7px; font-weight:bold; color:#444;">${esc(item.unit)}</span>
          <span style="font-size:11px; font-weight:900; color:#000;">${fCur(item.price)}</span>
        </div>
      </div>
    `;
  }
};

window.renderPricetagPreview = () => {
  const sheet = el('pt-live-preview-sheet');
  const summaryEl = el('pt-preview-summary');
  if (!sheet) return;

  const items = window.pricetagItems || [];
  const settings = window.pricetagSettings;

  // Flatten items according to each item's qty
  const flatLabels = [];
  items.forEach(it => {
    const q = Math.max(1, it.qty || 1);
    for (let i = 0; i < q; i++) {
      flatLabels.push(it);
    }
  });

  const totalLabels = flatLabels.length;

  if (totalLabels === 0) {
    sheet.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; color: #94a3b8;">
        <i class="fa-solid fa-tags" style="font-size: 28px; margin-bottom: 8px; display: block;"></i>
        <span style="font-size: 11px; font-weight: bold;">Pilih produk di sebelah kiri untuk melihat pratinjau lembar label harga</span>
      </div>
    `;
    if (summaryEl) summaryEl.innerText = '0 label • 0 lembar';
    return;
  }

  // Handle Paper Types:
  // 1. A4 GRID 3x8 (24 per page)
  if (settings.paperType === 'a4_3x8') {
    const labelsPerPage = 24;
    const totalPages = Math.ceil(totalLabels / labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${totalPages} lembar A4 (Grid 3x8)`;

    sheet.style.width = '210mm';
    sheet.style.minHeight = '297mm';
    sheet.style.padding = '8mm 6mm';
    sheet.style.boxSizing = 'border-box';
    sheet.style.background = '#ffffff';

    sheet.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 34mm; gap: 2.5mm; width: 100%;">
        ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, false, '100%', '34mm')).join('')}
      </div>
    `;
  }
  // 2. A4 GRID BESAR 2x6 (12 per page)
  else if (settings.paperType === 'a4_2x6') {
    const labelsPerPage = 12;
    const totalPages = Math.ceil(totalLabels / labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${totalPages} lembar A4 (Grid 2x6 Besar)`;

    sheet.style.width = '210mm';
    sheet.style.minHeight = '297mm';
    sheet.style.padding = '10mm 8mm';
    sheet.style.boxSizing = 'border-box';
    sheet.style.background = '#ffffff';

    sheet.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 45mm; gap: 4mm; width: 100%;">
        ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, false, '100%', '45mm')).join('')}
      </div>
    `;
  }
  // 3. A4 GRID MINI 4x10 (40 per page)
  else if (settings.paperType === 'a4_4x10') {
    const labelsPerPage = 40;
    const totalPages = Math.ceil(totalLabels / labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${totalPages} lembar A4 (Grid 4x10 Mini)`;

    sheet.style.width = '210mm';
    sheet.style.minHeight = '297mm';
    sheet.style.padding = '8mm 6mm';
    sheet.style.boxSizing = 'border-box';
    sheet.style.background = '#ffffff';

    sheet.innerHTML = `
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 27mm; gap: 2mm; width: 100%;">
        ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, false, '100%', '27mm')).join('')}
      </div>
    `;
  }
  // 4. THERMAL ROLL (58mm / 80mm)
  else if (settings.paperType === 'thermal_58' || settings.paperType === 'thermal_80') {
    const is80 = settings.paperType === 'thermal_80';
    const rollW = is80 ? '72mm' : '48mm';
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • Thermal ${is80 ? '80mm' : '58mm'} Continuous`;

    sheet.style.width = is80 ? '80mm' : '58mm';
    sheet.style.minHeight = 'auto';
    sheet.style.padding = '2mm 3mm';
    sheet.style.boxSizing = 'border-box';
    sheet.style.background = '#ffffff';

    sheet.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:3mm; width:${rollW}; margin:0 auto;">
        ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, true, '100%', 'auto')).join('')}
      </div>
    `;
  }
  // 5. THERMAL STICKER LABELS (40x30 / 60x40 / 70x40)
  else {
    const is60 = settings.paperType === 'sticker_60x40';
    const is70 = settings.paperType === 'sticker_70x40';
    const stkW = is70 ? '70mm' : (is60 ? '60mm' : '40mm');
    const stkH = is70 ? '40mm' : (is60 ? '40mm' : '30mm');

    if (summaryEl) summaryEl.innerText = `${totalLabels} label • Stiker Label (${stkW} x ${stkH})`;

    sheet.style.width = stkW;
    sheet.style.minHeight = 'auto';
    sheet.style.padding = '1mm';
    sheet.style.boxSizing = 'border-box';
    sheet.style.background = '#ffffff';

    sheet.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:2mm; width:100%;">
        ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, true, '100%', stkH)).join('')}
      </div>
    `;
  }
};

// ==========================================
// PRINT EXECUTION
// ==========================================

window.printPricetags = () => {
  const items = window.pricetagItems || [];
  if (!items.length) return showToast('Pilih minimal 1 produk untuk dicetak!');

  let printSection = el('pricetag-print-section');
  if (!printSection) {
    printSection = document.createElement('div');
    printSection.id = 'pricetag-print-section';
    document.body.appendChild(printSection);
  }

  const liveSheet = el('pt-live-preview-sheet');
  if (!liveSheet) return;

  // Salin konten preview langsung ke print section
  printSection.innerHTML = liveSheet.innerHTML;
  printSection.style.cssText = liveSheet.style.cssText;

  // Pasang print class di body
  document.body.classList.add('print-mode-pricetag');

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-pricetag');
    }, 500);
  }, 150);
};
