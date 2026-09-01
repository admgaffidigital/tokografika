// =============================================================================
// FRESHMART PRICETAG & LABEL BARCODE STUDIO ENGINE (A4 PORTRAIT OPTIMIZED)
// =============================================================================
// Modul pembuatan & pencetakan label harga rak (shelf price tags) dan stiker barcode.
// Menggunakan kanvas standar Kertas A4 Potret (210 x 297 mm) dengan presisi millimeter
// dan pagination otomatis per lembar A4.
// =============================================================================

window.pricetagItems = []; // Array of items to be printed

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
      'a4_3x8': 'A4 Potret 3x8 (24 Label)',
      'a4_2x6': 'A4 Potret 2x6 (12 Label)',
      'a4_4x10': 'A4 Potret 4x10 (40 Label)',
      'thermal_58': 'Thermal 58mm Roll',
      'thermal_80': 'Thermal 80mm Roll'
    };
    badge.innerText = labels[window.pricetagSettings.paperType] || 'A4 Potret 3x8';
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
// RENDER LABEL CARD HTML
// ==========================================

const _buildSingleLabelHtml = (item, settings, isThermal = false, cardWidth = 'auto', cardHeight = 'auto') => {
  const storeName = (appData.store?.name || 'TOKO GRAFIKA').toUpperCase();
  const dateStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const hasWholesale = settings.showWholesale && item.showWholesale && Array.isArray(item.wholesale) && item.wholesale.length > 0;
  
  const borderStyle = settings.showCutGuide ? 'border: 1px dashed #94a3b8;' : 'border: 1px solid transparent;';
  
  // Format Layout 1: Gondola Standar Minimarket
  if (settings.layoutTemplate === 'gondola_standard') {
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; max-height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:2.5mm 3mm; background:#ffffff; color:#000000; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid; border-radius:2px;">
        <!-- Header: Store Name & Date -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #000000; padding-bottom:1px; margin-bottom:1px;">
          ${settings.showStoreName ? `<span style="font-size:7.5pt; font-weight:900; letter-spacing:0.3px; color:#000000; text-transform:uppercase;">${esc(storeName)}</span>` : `<span></span>`}
          ${settings.showDate ? `<span style="font-size:6.5pt; font-weight:700; color:#555555;">${dateStr}</span>` : ''}
        </div>

        <!-- Product Name & Variant -->
        <div style="margin:0.5mm 0; line-height:1.15; max-height:18px; overflow:hidden;">
          <h4 style="font-size:8.5pt; font-weight:900; color:#000000; margin:0; word-break:break-word; text-transform:uppercase; letter-spacing:-0.2px;">
            ${esc(item.productName)} ${item.variantName ? `(${esc(item.variantName)})` : ''}
          </h4>
        </div>

        <!-- Middle / Bottom Section: Barcode on Left, Big Price on Right -->
        <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:2mm; margin-top:auto;">
          <!-- Barcode & SKU -->
          <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:flex-end; align-items:flex-start;">
            ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, 75, 14) : `<span style="font-size:7pt; font-family:monospace; font-weight:bold;">${esc(item.sku)}</span>`}
          </div>

          <!-- Price Box (Big & Clear) -->
          <div style="text-align:right; shrink-0; display:flex; flex-direction:column; align-items:flex-end;">
            <div style="font-size:6pt; font-weight:800; color:#444444; line-height:1; text-transform:uppercase;">
              ${settings.showUnit ? `PER ${esc(item.unit)}` : 'HARGA'}
            </div>
            <div style="font-size:13pt; font-weight:900; color:#000000; line-height:1.05; letter-spacing:-0.5px; font-family:Arial, sans-serif;">
              ${fCur(item.price)}
            </div>
            ${hasWholesale ? `
              <div style="font-size:5.5pt; font-weight:800; background:#000000; color:#ffffff; padding:1px 2.5px; border-radius:1.5px; margin-top:1px; line-height:1; white-space:nowrap;">
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
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; max-height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:2.5mm 3mm; background:#ffffff; color:#000000; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid; border-radius:2px;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid #000000; padding-bottom:1px;">
          <span style="font-size:7.5pt; font-weight:900; color:#000; text-transform:uppercase;">${esc(storeName)}</span>
          <span style="font-size:6pt; font-weight:800; background:#000; color:#fff; padding:0.5px 3px; border-radius:2px;">HEMAT GROSIR</span>
        </div>

        <!-- Name -->
        <div style="margin:0.5mm 0; line-height:1.15; max-height:16px; overflow:hidden;">
          <h4 style="font-size:8pt; font-weight:900; color:#000; margin:0; text-transform:uppercase;">
            ${esc(item.productName)} ${item.variantName ? `(${esc(item.variantName)})` : ''}
          </h4>
        </div>

        <!-- Price & Wholesale Tier Box -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #000; padding:1.5px 3px; border-radius:2px; margin:1px 0;">
          <div>
            <span style="font-size:5.5pt; font-weight:bold; color:#444; display:block; line-height:1;">ECERAN:</span>
            <span style="font-size:10pt; font-weight:900; color:#000; line-height:1;">${fCur(item.price)}</span>
          </div>
          ${hasWholesale ? `
            <div style="border-left:1px dashed #000; padding-left:3px; text-align:right;">
              <span style="font-size:5.5pt; font-weight:900; color:#000; display:block; line-height:1;">GROSIR (≥${item.wholesale[0].minQty} ${esc(item.unit)}):</span>
              <span style="font-size:10pt; font-weight:900; color:#000; line-height:1;">${fCur(item.wholesale[0].price)}</span>
            </div>
          ` : `
            <div style="font-size:7pt; font-weight:bold; color:#666;">/${esc(item.unit)}</div>
          `}
        </div>

        <!-- Barcode Footer -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:auto;">
          ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, 70, 13) : `<span style="font-size:6.5pt; font-family:monospace; font-weight:bold;">${esc(item.sku)}</span>`}
          ${settings.showDate ? `<span style="font-size:6pt; font-weight:bold; color:#666;">${dateStr}</span>` : ''}
        </div>
      </div>
    `;
  }

  // Format Layout 3: Mini Barcode Kompak
  else {
    return `
      <div class="pricetag-label-card" style="width:${cardWidth}; height:${cardHeight}; max-height:${cardHeight}; box-sizing:border-box; ${borderStyle} padding:2mm 2.5mm; background:#ffffff; color:#000000; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; font-family:'Plus Jakarta Sans', Arial, sans-serif; page-break-inside:avoid; text-align:center; border-radius:2px;">
        <div style="font-size:7.5pt; font-weight:900; line-height:1.1; color:#000; text-transform:uppercase; max-height:16px; overflow:hidden;">
          ${esc(item.productName)} ${item.variantName ? `(${esc(item.variantName)})` : ''}
        </div>
        
        <div style="margin:1px auto;">
          ${settings.showBarcode ? _generatePricetagBarcodeSvg(item.sku, 75, 14) : `<span style="font-size:7pt; font-family:monospace; font-weight:bold;">${esc(item.sku)}</span>`}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:baseline; border-top:1px solid #000; padding-top:1px;">
          <span style="font-size:6pt; font-weight:bold; color:#444;">${esc(item.unit)}</span>
          <span style="font-size:10.5pt; font-weight:900; color:#000;">${fCur(item.price)}</span>
        </div>
      </div>
    `;
  }
};

// ==========================================
// PREVIEW BUILDER (REALISTIC A4 CANVAS)
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
      <div style="padding: 60px 20px; text-align: center; color: #94a3b8;">
        <i class="fa-solid fa-tags" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.5;"></i>
        <span style="font-size: 12px; font-weight: bold;">Pilih produk di sebelah kiri untuk melihat kanvas A4 Potret</span>
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

    sheet.style.width = '100%';
    sheet.style.maxWidth = '210mm';
    sheet.style.background = 'transparent';
    sheet.style.boxShadow = 'none';

    sheet.innerHTML = pages.map((pageItems, pageIdx) => `
      <div style="background:#ffffff; width:210mm; min-height:297mm; max-height:297mm; padding:6mm 6mm; box-sizing:border-box; margin:0 auto ${pages.length > 1 ? '16px' : '0'} auto; box-shadow:0 4px 20px rgba(0,0,0,0.12); border-radius:4px; border:1px solid #e2e8f0; position:relative; overflow:hidden;">
        <div style="position:absolute; top:2mm; right:6mm; font-size:7pt; color:#94a3b8; font-weight:bold;">
          A4 Potret • Lembar ${pageIdx + 1} dari ${pages.length}
        </div>
        <div style="display:grid; grid-template-columns: repeat(3, 64mm); grid-auto-rows: 33.5mm; gap: 2.5mm; width:100%; justify-content:center; margin-top:2mm;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '64mm', '33.5mm')).join('')}
        </div>
      </div>
    `).join('');
  }
  // 2. A4 GRID BESAR 2x6 (12 label per lembar A4 Potret)
  else if (settings.paperType === 'a4_2x6') {
    const labelsPerPage = 12;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${pages.length} lembar A4 Potret (Grid 2x6 Besar)`;

    sheet.style.width = '100%';
    sheet.style.maxWidth = '210mm';
    sheet.style.background = 'transparent';
    sheet.style.boxShadow = 'none';

    sheet.innerHTML = pages.map((pageItems, pageIdx) => `
      <div style="background:#ffffff; width:210mm; min-height:297mm; max-height:297mm; padding:8mm 6mm; box-sizing:border-box; margin:0 auto ${pages.length > 1 ? '16px' : '0'} auto; box-shadow:0 4px 20px rgba(0,0,0,0.12); border-radius:4px; border:1px solid #e2e8f0; position:relative; overflow:hidden;">
        <div style="position:absolute; top:2mm; right:6mm; font-size:7pt; color:#94a3b8; font-weight:bold;">
          A4 Potret • Lembar ${pageIdx + 1} dari ${pages.length}
        </div>
        <div style="display:grid; grid-template-columns: repeat(2, 96mm); grid-auto-rows: 44.5mm; gap: 4mm; width:100%; justify-content:center; margin-top:2mm;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '96mm', '44.5mm')).join('')}
        </div>
      </div>
    `).join('');
  }
  // 3. A4 GRID MINI 4x10 (40 label per lembar A4 Potret)
  else if (settings.paperType === 'a4_4x10') {
    const labelsPerPage = 40;
    const pages = _chunkArray(flatLabels, labelsPerPage);
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • ${pages.length} lembar A4 Potret (Grid 4x10 Mini)`;

    sheet.style.width = '100%';
    sheet.style.maxWidth = '210mm';
    sheet.style.background = 'transparent';
    sheet.style.boxShadow = 'none';

    sheet.innerHTML = pages.map((pageItems, pageIdx) => `
      <div style="background:#ffffff; width:210mm; min-height:297mm; max-height:297mm; padding:6mm 6mm; box-sizing:border-box; margin:0 auto ${pages.length > 1 ? '16px' : '0'} auto; box-shadow:0 4px 20px rgba(0,0,0,0.12); border-radius:4px; border:1px solid #e2e8f0; position:relative; overflow:hidden;">
        <div style="position:absolute; top:2mm; right:6mm; font-size:7pt; color:#94a3b8; font-weight:bold;">
          A4 Potret • Lembar ${pageIdx + 1} dari ${pages.length}
        </div>
        <div style="display:grid; grid-template-columns: repeat(4, 47mm); grid-auto-rows: 26.5mm; gap: 2mm; width:100%; justify-content:center; margin-top:2mm;">
          ${pageItems.map(item => _buildSingleLabelHtml(item, settings, false, '47mm', '26.5mm')).join('')}
        </div>
      </div>
    `).join('');
  }
  // 4. THERMAL ROLL (58mm / 80mm)
  else {
    const is80 = settings.paperType === 'thermal_80';
    const rollW = is80 ? '72mm' : '48mm';
    if (summaryEl) summaryEl.innerText = `${totalLabels} label • Thermal ${is80 ? '80mm' : '58mm'} Continuous`;

    sheet.style.width = is80 ? '80mm' : '58mm';
    sheet.style.minHeight = 'auto';
    sheet.style.padding = '2mm 3mm';
    sheet.style.boxSizing = 'border-box';
    sheet.style.background = '#ffffff';

    sheet.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:2.5mm; width:${rollW}; margin:0 auto;">
        ${flatLabels.map(item => _buildSingleLabelHtml(item, settings, true, '100%', 'auto')).join('')}
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
