// =============================================================================
// MODUL PEMBELIAN BARANG, SUPPLIER, HUTANG/TEMPO & PEMBAYARAN
// =============================================================================

let purchasesActiveSubTab = 'invoices'; // 'invoices' | 'debts' | 'suppliers' | 'reports'
let purchasesSearchQuery = '';
let purchasesFilterSupplier = 'all';
let purchasesFilterStatus = 'all';
let currentPurchaseItems = [];
let isSupplierFromPurchase = false;
let currentViewingPurchase = null;
let currentPayingPurchase = null;

// Helper format date
const _fDate = (dStr) => {
  if (!dStr) return '-';
  try {
    const d = new Date(dStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dStr;
  }
};

// =============================================================================
// 1. MANAJEMEN SUPPLIER
// =============================================================================
window.openSupplierModal = (id = null, fromPurchase = false) => {
  isSupplierFromPurchase = fromPurchase;
  setV('supp-id', id || '');
  
  if (id) {
    const s = (appData.suppliers || []).find(x => String(x.id) === String(id));
    if (s) {
      setIn('supplier-modal-title', 'Edit Data Supplier');
      setV('supp-name', s.name || '');
      setV('supp-phone', s.phone || '');
      setV('supp-pic', s.pic || '');
      setV('supp-address', s.address || '');
      setV('supp-bank', s.bankInfo || '');
      setV('supp-notes', s.notes || '');
    }
  } else {
    setIn('supplier-modal-title', 'Tambah Supplier Baru');
    setV('supp-name', '');
    setV('supp-phone', '');
    setV('supp-pic', '');
    setV('supp-address', '');
    setV('supp-bank', '');
    setV('supp-notes', '');
  }

  const modal = el('supplier-modal');
  const box = el('supplier-modal-box');
  if (modal && box) {
    show('supplier-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-5');
    }, 10);
  }
};

window.closeSupplierModal = () => {
  isSupplierFromPurchase = false;
  const modal = el('supplier-modal');
  const box = el('supplier-modal-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-5');
    setTimeout(() => hide('supplier-modal'), 250);
  }
};

window.saveSupplier = async () => {
  const id = getV('supp-id');
  const name = getV('supp-name').trim();
  const phone = getV('supp-phone').trim();
  const pic = getV('supp-pic').trim();
  const address = getV('supp-address').trim();
  const bankInfo = getV('supp-bank').trim();
  const notes = getV('supp-notes').trim();

  if (!name) return showToast('Nama supplier wajib diisi!');

  if (!appData.suppliers) appData.suppliers = [];

  let savedSupplierId = id;
  if (id) {
    const idx = appData.suppliers.findIndex(x => String(x.id) === String(id));
    if (idx > -1) {
      appData.suppliers[idx] = {
        ...appData.suppliers[idx],
        name, phone, pic, address, bankInfo, notes,
        updatedAt: Date.now()
      };
    }
  } else {
    savedSupplierId = 'SUPP-' + Date.now();
    appData.suppliers.push({
      id: savedSupplierId,
      name, phone, pic, address, bankInfo, notes,
      createdAt: Date.now()
    });
  }

  sLoad('Menyimpan Supplier...');
  await saveApp();
  hLoad();
  showToast('Data supplier berhasil disimpan!');
  
  const wasFromPurchase = isSupplierFromPurchase;
  closeSupplierModal();

  if (wasFromPurchase) {
    _populateSupplierDropdown(savedSupplierId);
  } else {
    rAdmPurchases();
  }
};

window.deleteSupplier = async (id) => {
  const supp = (appData.suppliers || []).find(x => String(x.id) === String(id));
  if (!supp) return;

  const hasPurchases = (appData.purchases || []).some(p => String(p.supplierId) === String(id));
  if (hasPurchases) {
    return showToast('Supplier ini memiliki riwayat transaksi faktur dan tidak bisa dihapus!');
  }

  showConfirm(`Hapus supplier "${supp.name}"?`, async () => {
    appData.suppliers = (appData.suppliers || []).filter(x => String(x.id) !== String(id));
    sLoad('Menghapus...');
    await saveApp();
    hLoad();
    showToast('Supplier telah dihapus!');
    rAdmPurchases();
  });
};

// =============================================================================
// 2. INPUT TRANSAKSI PEMBELIAN BARANG
// =============================================================================
const _generateInvoiceNo = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `FB-${y}${m}${d}-${rand}`;
};

window.isPurchSupplierOnlyFilter = false;

const _populateSupplierDropdown = (selectedId = null) => {
  const sel = el('purch-supplier-id');
  if (!sel) return;
  const list = appData.suppliers || [];
  sel.innerHTML = '<option value="">-- Pilih Supplier --</option>' + list.map(s => `
    <option value="${esc(s.id)}" ${selectedId && String(s.id) === String(selectedId) ? 'selected' : ''}>
      ${esc(s.name)} ${s.pic ? `(${esc(s.pic)})` : ''}
    </option>
  `).join('');
};

window.onPurchaseSupplierChange = (supplierId) => {
  const btn = el('purch-filter-supp-only-btn');
  const txt = el('purch-filter-supp-only-text');
  if (!supplierId) {
    if (btn) btn.classList.add('hidden');
    window.isPurchSupplierOnlyFilter = false;
    filterPurchProducts(getV('purch-search-keyword'));
    return;
  }

  const suppProdsCount = (appData.products || []).filter(p => String(p.supplierId) === String(supplierId)).length;

  if (btn && txt) {
    btn.classList.remove('hidden');
    if (suppProdsCount > 0) {
      txt.innerText = window.isPurchSupplierOnlyFilter 
        ? `Menampilkan ${suppProdsCount} Produk Supplier Ini (Klik utk Semua)` 
        : `Hanya Produk Supplier Ini (${suppProdsCount})`;
    } else {
      txt.innerText = `Belum ada produk tertaut (Tampilkan Semua)`;
      window.isPurchSupplierOnlyFilter = false;
    }
  }

  filterPurchProducts(getV('purch-search-keyword'));
};

window.togglePurchSupplierOnlyFilter = () => {
  const suppId = getV('purch-supplier-id');
  if (!suppId) return showToast('Pilih supplier terlebih dahulu!');
  
  const suppProdsCount = (appData.products || []).filter(p => String(p.supplierId) === String(suppId)).length;
  if (suppProdsCount === 0 && !window.isPurchSupplierOnlyFilter) {
    return showToast('Supplier ini belum memiliki produk tertaut. Anda bisa memilih produk bebas di bawah untuk ditautkan otomatis saat faktur disimpan.');
  }

  window.isPurchSupplierOnlyFilter = !window.isPurchSupplierOnlyFilter;
  const btn = el('purch-filter-supp-only-btn');
  const txt = el('purch-filter-supp-only-text');
  if (btn && txt) {
    if (window.isPurchSupplierOnlyFilter) {
      btn.className = 'text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 text-white border border-amber-600 shadow-sm flex items-center gap-1 transition-all';
      txt.innerText = `Menampilkan ${suppProdsCount} Produk Supplier Ini`;
    } else {
      btn.className = 'text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-all flex items-center gap-1';
      txt.innerText = `Hanya Produk Supplier Ini (${suppProdsCount})`;
    }
  }

  filterPurchProducts(getV('purch-search-keyword'));
};

window.filterPurchProducts = (keyword) => {
  const sel = el('purch-item-prod');
  if (!sel) return;
  const q = (keyword || '').trim().toLowerCase();
  const selectedSuppId = getV('purch-supplier-id');
  let list = [...(appData.products || [])];
  list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (window.isPurchSupplierOnlyFilter && selectedSuppId) {
    list = list.filter(p => String(p.supplierId) === String(selectedSuppId));
  }

  const filtered = !q ? list : list.filter(p => {
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const skuMatch = (p.sku || '').toLowerCase().includes(q);
    const varMatch = (p.variants || []).some(v => (v.name || '').toLowerCase().includes(q) || (v.sku || '').toLowerCase().includes(q));
    return nameMatch || skuMatch || varMatch;
  });

  sel.innerHTML = `<option value="">-- Pilih Produk (${filtered.length}) --</option>` + filtered.map(p => {
    const suppTag = p.supplierName ? ` [📦 ${esc(p.supplierName)}]` : '';
    const skuTag = p.sku ? ` [${esc(p.sku)}]` : '';
    return `<option value="${esc(p.id)}">${esc(p.name)}${skuTag}${suppTag}</option>`;
  }).join('');

  if (q) {
    const exactMatch = list.find(p => p.sku && p.sku.toLowerCase() === q);
    if (exactMatch) {
      sel.value = exactMatch.id;
      onPurchaseProductSelect();
      el('purch-item-qty')?.focus();
      return;
    }
    if (filtered.length === 1 && q.length >= 2) {
      sel.value = filtered[0].id;
      onPurchaseProductSelect();
    }
  }
};

window.handlePurchBarcodeScan = (barcode) => {
  if (!barcode) return;
  const b = barcode.trim().toLowerCase();
  let found = (appData.products || []).find(p => (p.sku && p.sku.toLowerCase() === b) || (p.barcode && p.barcode.toLowerCase() === b));
  if (!found) {
    found = (appData.products || []).find(p => (p.variants || []).some(v => (v.sku && v.sku.toLowerCase() === b) || (v.barcode && v.barcode.toLowerCase() === b)));
  }
  if (found) {
    filterPurchProducts('');
    setV('purch-search-keyword', found.name);
    const sel = el('purch-item-prod');
    if (sel) {
      sel.value = found.id;
      onPurchaseProductSelect();
      showToast(`Produk terdeteksi: ${found.name}`);
      el('purch-item-qty')?.focus();
    }
  } else {
    showToast(`Barcode "${barcode}" tidak cocok dengan produk manapun`);
  }
};

window.openPurchaseModal = () => {
  currentPurchaseItems = [];
  window.isPurchSupplierOnlyFilter = false;
  setV('purch-inv-no', _generateInvoiceNo());
  setV('purch-search-keyword', '');
  
  const todayStr = new Date().toISOString().split('T')[0];
  setV('purch-date', todayStr);
  
  _populateSupplierDropdown();
  
  const filterBtn = el('purch-filter-supp-only-btn');
  if (filterBtn) {
    filterBtn.classList.add('hidden');
    filterBtn.className = 'hidden text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-all flex items-center gap-1';
  }

  filterPurchProducts('');
  
  onPurchaseProductSelect();
  _renderPurchaseItemsTable();
  
  const cashRadio = document.querySelector('input[name="purch-payment-type"][value="cash"]');
  if (cashRadio) cashRadio.checked = true;
  togglePurchasePaymentType();

  // Set default due date (+14 hari)
  const d14 = new Date();
  d14.setDate(d14.getDate() + 14);
  setV('purch-due-date', d14.toISOString().split('T')[0]);
  setV('purch-initial-paid', '0');
  setV('purch-notes', '');
  calculatePurchaseTotals();

  const modal = el('purchase-modal');
  const box = el('purchase-modal-box');
  if (modal && box) {
    show('purchase-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-5');
    }, 10);
  }
};

window.closePurchaseModal = () => {
  const modal = el('purchase-modal');
  const box = el('purchase-modal-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-5');
    setTimeout(() => hide('purchase-modal'), 250);
  }
};

window.onPurchaseProductSelect = () => {
  const pId = getV('purch-item-prod');
  const varWrap = el('purch-variant-wrapper');
  const varSel = el('purch-item-var');
  const priceInput = el('purch-item-price');

  if (!pId) {
    if (varSel) varSel.innerHTML = '<option value="">- Tanpa Varian -</option>';
    if (priceInput) priceInput.value = 0;
    return;
  }

  const p = (appData.products || []).find(x => String(x.id) === String(pId));
  if (!p) return;

  if (p.variants && p.variants.length > 0) {
    if (varWrap) varWrap.classList.remove('hidden');
    if (varSel) {
      varSel.innerHTML = p.variants.map((v, i) => `
        <option value="${esc(v.id || v.name || i)}">${esc(v.name)} (Modal: ${fCur(v.costPrice || 0)})</option>
      `).join('');
      varSel.onchange = () => {
        const selV = p.variants.find(v => String(v.id || v.name) === String(varSel.value));
        if (priceInput && selV) priceInput.value = selV.costPrice || selV.buyPrice || Math.round((selV.price || 0) * 0.8);
      };
      const firstV = p.variants[0];
      if (priceInput && firstV) priceInput.value = firstV.costPrice || firstV.buyPrice || Math.round((firstV.price || 0) * 0.8);
    }
  } else {
    if (varSel) varSel.innerHTML = '<option value="">- Tanpa Varian -</option>';
    if (priceInput) priceInput.value = p.costPrice || p.buyPrice || Math.round((p.price || 0) * 0.8);
  }
};

window.addPurchaseItemRow = () => {
  const pId = getV('purch-item-prod');
  if (!pId) return showToast('Pilih produk terlebih dahulu!');

  const p = (appData.products || []).find(x => String(x.id) === String(pId));
  if (!p) return;

  const varSel = el('purch-item-var');
  const varVal = varSel ? varSel.value : '';
  const qty = parseFloat(getV('purch-item-qty')) || 0;
  const buyPrice = parseFloat(getV('purch-item-price')) || 0;

  if (qty <= 0) return showToast('Jumlah (qty) harus lebih dari 0!');
  if (buyPrice < 0) return showToast('Harga beli tidak boleh minus!');

  let varName = '';
  let variantObj = null;
  if (p.variants && p.variants.length > 0 && varVal) {
    variantObj = p.variants.find(v => String(v.id || v.name) === String(varVal));
    if (variantObj) varName = variantObj.name;
  }

  // Cek jika item sudah ada di daftar
  const existingIdx = currentPurchaseItems.findIndex(i => String(i.productId) === String(pId) && String(i.variantId || '') === String(varVal || ''));
  if (existingIdx > -1) {
    currentPurchaseItems[existingIdx].qty += qty;
    currentPurchaseItems[existingIdx].buyPrice = buyPrice;
    currentPurchaseItems[existingIdx].subtotal = currentPurchaseItems[existingIdx].qty * buyPrice;
  } else {
    currentPurchaseItems.push({
      productId: String(p.id),
      variantId: varVal || '',
      productName: p.name,
      variantName: varName,
      unit: p.unit || variantObj?.unit || 'pcs',
      qty,
      buyPrice,
      subtotal: qty * buyPrice
    });
  }

  // Reset item inputs
  setV('purch-item-qty', '1');
  _renderPurchaseItemsTable();
  calculatePurchaseTotals();
  showToast(`"${p.name}" ditambahkan!`);
};

window.removePurchaseItemRow = (idx) => {
  currentPurchaseItems.splice(idx, 1);
  _renderPurchaseItemsTable();
  calculatePurchaseTotals();
};

const _renderPurchaseItemsTable = () => {
  const tbody = el('purch-items-tbody');
  const mList = el('purch-items-mobile-list');

  if (!currentPurchaseItems.length) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-4 text-center text-slate-400 font-medium">Belum ada barang dimasukkan</td>
        </tr>
      `;
    }
    if (mList) {
      mList.innerHTML = `
        <div class="p-3.5 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs font-medium">
          <i class="fa-solid fa-basket-shopping text-slate-300 dark:text-slate-600 mr-1.5"></i> Belum ada barang dimasukkan
        </div>
      `;
    }
    return;
  }

  // Desktop Table
  if (tbody) {
    tbody.innerHTML = currentPurchaseItems.map((item, i) => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
        <td class="p-2.5 font-bold text-slate-500">${i + 1}</td>
        <td class="p-2.5 font-extrabold text-slate-800 dark:text-slate-200">
          ${esc(item.productName)}
          ${item.variantName ? `<span class="block text-[10px] text-slate-400 font-semibold">[${esc(item.variantName)}]</span>` : ''}
        </td>
        <td class="p-2.5 text-center font-black text-slate-800 dark:text-slate-200">${item.qty} ${esc(item.unit)}</td>
        <td class="p-2.5 text-right font-bold text-slate-600 dark:text-slate-300">${fCur(item.buyPrice)}</td>
        <td class="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">${fCur(item.subtotal)}</td>
        <td class="p-2.5 text-center">
          <button type="button" class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" onclick="removePurchaseItemRow(${i})" title="Hapus Item">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Mobile Cards
  if (mList) {
    mList.innerHTML = currentPurchaseItems.map((item, i) => `
      <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center gap-3 text-xs">
        <div class="min-w-0 flex-1">
          <div class="font-extrabold text-slate-800 dark:text-slate-100 leading-tight truncate">
            ${esc(item.productName)}
          </div>
          ${item.variantName ? `<span class="inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">[${esc(item.variantName)}]</span>` : ''}
          <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            <span class="font-bold text-slate-700 dark:text-slate-300">${item.qty} ${esc(item.unit)}</span> × ${fCur(item.buyPrice)}
          </div>
        </div>
        <div class="text-right shrink-0 flex flex-col items-end gap-1">
          <div class="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">${fCur(item.subtotal)}</div>
          <button type="button" class="text-rose-500 hover:text-rose-700 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-[10px] font-bold active:scale-95 transition-all" onclick="removePurchaseItemRow(${i})">
            <i class="fa-solid fa-trash-can mr-0.5"></i> Hapus
          </button>
        </div>
      </div>
    `).join('');
  }
};

window.togglePurchasePaymentType = () => {
  const pType = document.querySelector('input[name="purch-payment-type"]:checked')?.value || 'cash';
  const tempoBox = el('purch-tempo-details');
  const debtBox = el('purch-debt-box');
  
  if (pType === 'credit') {
    if (tempoBox) tempoBox.classList.remove('hidden');
    if (debtBox) debtBox.classList.remove('hidden');
  } else {
    if (tempoBox) tempoBox.classList.add('hidden');
    if (debtBox) debtBox.classList.add('hidden');
  }
  calculatePurchaseTotals();
};

window.onPurchaseTermPresetChange = () => {
  const preset = getV('purch-term-preset');
  const dateInput = el('purch-due-date');
  if (!dateInput) return;

  if (preset === 'custom') {
    dateInput.focus();
    return;
  }

  const days = parseInt(preset) || 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  dateInput.value = d.toISOString().split('T')[0];
};

window.calculatePurchaseTotals = () => {
  const total = currentPurchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  const pType = document.querySelector('input[name="purch-payment-type"]:checked')?.value || 'cash';
  
  let paid = total;
  if (pType === 'credit') {
    paid = parseFloat(getV('purch-initial-paid')) || 0;
    if (paid > total) paid = total;
  }
  const remaining = Math.max(0, total - paid);

  setIn('purch-total-amount-display', fCur(total));
  setIn('purch-paid-amount-display', fCur(paid));
  setIn('purch-remaining-debt-display', fCur(remaining));
};

window.savePurchaseInvoice = async () => {
  if (isSaving) return;
  if (!currentPurchaseItems.length) return showToast('Daftar barang masih kosong! Tambahkan produk terlebih dahulu.');

  const supplierId = getV('purch-supplier-id');
  if (!supplierId) return showToast('Pilih supplier terlebih dahulu!');

  const supplier = (appData.suppliers || []).find(s => String(s.id) === String(supplierId));
  const supplierName = supplier ? supplier.name : 'Supplier';

  const invoiceNo = getV('purch-inv-no').trim() || _generateInvoiceNo();
  const date = getV('purch-date') || new Date().toISOString().split('T')[0];
  const paymentType = document.querySelector('input[name="purch-payment-type"]:checked')?.value || 'cash';
  const totalAmount = currentPurchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  let paidAmount = totalAmount;
  let dueDate = '';
  if (paymentType === 'credit') {
    paidAmount = parseFloat(getV('purch-initial-paid')) || 0;
    dueDate = getV('purch-due-date') || '';
  }

  const remainingDebt = Math.max(0, totalAmount - paidAmount);
  let status = 'paid';
  if (paymentType === 'credit') {
    if (remainingDebt <= 0) status = 'paid';
    else if (paidAmount > 0) status = 'partial';
    else status = 'unpaid';
  }

  const notes = getV('purch-notes').trim();

  // Riwayat pembayaran pertama (jika ada DP/Cash)
  const initialPayments = [];
  if (paidAmount > 0) {
    initialPayments.push({
      id: 'PAY-' + Date.now(),
      date: date,
      amount: paidAmount,
      method: paymentType === 'cash' ? 'cash' : 'deposit',
      note: paymentType === 'cash' ? 'Pembayaran Lunas (Cash)' : 'Uang Muka / DP Awal',
      recordedAt: Date.now()
    });
  }

  const purchaseDoc = {
    id: 'PURCH-' + Date.now(),
    invoiceNo,
    supplierId: String(supplierId),
    supplierName,
    date,
    paymentType,
    dueDate,
    totalAmount,
    paidAmount,
    remainingDebt,
    status,
    items: currentPurchaseItems,
    payments: initialPayments,
    notes,
    createdAt: Date.now()
  };

  // 1. UPDATE STOK & HPP PRODUK SECARA OTOMATIS + RECORD ASAL SUPPLIER
  if (!appData.products) appData.products = [];
  currentPurchaseItems.forEach(item => {
    const pIdx = appData.products.findIndex(p => String(p.id) === String(item.productId));
    if (pIdx > -1) {
      const prod = appData.products[pIdx];
      // Tautkan asal rekanan supplier & record kulakan terakhir
      if (supplierId) {
        prod.supplierId = String(supplierId);
        prod.supplierName = supplierName;
      }
      prod.lastPurchasePrice = item.buyPrice;
      prod.lastPurchaseDate = Date.now();
      prod.lastPurchaseInvoice = invoiceNo;

      if (item.variantId && prod.variants && prod.variants.length > 0) {
        const vIdx = prod.variants.findIndex(v => String(v.id || v.name) === String(item.variantId));
        if (vIdx > -1) {
          const v = prod.variants[vIdx];
          v.stock = (parseInt(v.stock) || 0) + item.qty;
          v.costPrice = item.buyPrice; // Update HPP Varian
          v.buyPrice = item.buyPrice;
          v.lastPurchasePrice = item.buyPrice;
          v.lastPurchaseDate = Date.now();
        }
      } else {
        prod.stock = (parseInt(prod.stock) || 0) + item.qty;
        prod.costPrice = item.buyPrice; // Update HPP Produk
        prod.buyPrice = item.buyPrice;
      }
    }
  });

  // 2. SIMPAN DATA KE PURCHASES
  if (!appData.purchases) appData.purchases = [];
  appData.purchases.unshift(purchaseDoc);

  sLoad('Menyimpan Faktur & Menambah Stok...');
  isSaving = true;
  try {
    await saveApp();
    showToast('Faktur pembelian berhasil disimpan & stok bertambah!');
    closePurchaseModal();
    rAdmPurchases();
  } catch (e) {
    showToast('Gagal menyimpan transaksi pembelian!');
  } finally {
    isSaving = false;
    hLoad();
  }
};

window.deletePurchaseInvoice = async (id) => {
  const purch = (appData.purchases || []).find(p => String(p.id) === String(id));
  if (!purch) return;

  showConfirm(`Hapus Faktur "${purch.invoiceNo}"?\n(Catatan: Stok produk tidak akan otomatis dikurangi secara sepihak)`, async () => {
    appData.purchases = (appData.purchases || []).filter(p => String(p.id) !== String(id));
    sLoad('Menghapus...');
    await saveApp();
    hLoad();
    showToast('Faktur pembelian dihapus!');
    rAdmPurchases();
  });
};

// =============================================================================
// 3. PENCATATAN PEMBAYARAN HUTANG SUPPLIER (CICILAN / TITIPAN)
// =============================================================================
window.openPurchasePaymentModal = (purchaseId) => {
  const p = (appData.purchases || []).find(x => String(x.id) === String(purchaseId));
  if (!p) return showToast('Faktur tidak ditemukan!');
  currentPayingPurchase = p;

  setV('pay-purchase-id', p.id);
  setIn('pay-modal-subtitle', `Faktur: ${p.invoiceNo}`);
  setIn('pay-supplier-name', p.supplierName);
  setIn('pay-total-amount', fCur(p.totalAmount));
  setIn('pay-already-paid', fCur(p.paidAmount));
  
  const remaining = Math.max(0, p.totalAmount - p.paidAmount);
  setIn('pay-remaining-debt', fCur(remaining));

  const todayStr = new Date().toISOString().split('T')[0];
  setV('pay-date', todayStr);
  setV('pay-amount', remaining.toString());
  setV('pay-notes', '');

  // Render riwayat pembayaran
  const histContainer = el('pay-history-list');
  if (histContainer) {
    const list = p.payments || [];
    if (!list.length) {
      histContainer.innerHTML = '<p class="text-[10px] text-slate-400 font-medium italic">Belum ada catatan pembayaran sebelumnya</p>';
    } else {
      histContainer.innerHTML = list.map(pay => `
        <div class="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <div>
            <div class="font-bold text-slate-800 dark:text-slate-200">${fCur(pay.amount)}</div>
            <div class="text-[9px] text-slate-400 font-medium">${_fDate(pay.date)} • ${pay.method ? pay.method.toUpperCase() : 'CASH'} ${pay.note ? `(${esc(pay.note)})` : ''}</div>
          </div>
          <span class="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">Terbayar</span>
        </div>
      `).join('');
    }
  }

  const modal = el('purchase-payment-modal');
  const box = el('purchase-payment-box');
  if (modal && box) {
    show('purchase-payment-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-5');
    }, 10);
  }
};

window.closePurchasePaymentModal = () => {
  const modal = el('purchase-payment-modal');
  const box = el('purchase-payment-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-5');
    setTimeout(() => hide('purchase-payment-modal'), 250);
  }
};

window.fillPayFullAmount = () => {
  if (!currentPayingPurchase) return;
  const remaining = Math.max(0, currentPayingPurchase.totalAmount - currentPayingPurchase.paidAmount);
  setV('pay-amount', remaining.toString());
};

window.savePurchasePayment = async () => {
  if (!currentPayingPurchase) return;
  const pId = getV('pay-purchase-id');
  const pIdx = (appData.purchases || []).findIndex(p => String(p.id) === String(pId));
  if (pIdx === -1) return showToast('Data faktur tidak ditemukan!');

  const amount = parseFloat(getV('pay-amount')) || 0;
  if (amount <= 0) return showToast('Nominal pembayaran harus lebih dari 0!');

  const date = getV('pay-date') || new Date().toISOString().split('T')[0];
  const method = getV('pay-method') || 'cash';
  const note = getV('pay-notes').trim();

  const purchase = appData.purchases[pIdx];
  const newPaidAmount = purchase.paidAmount + amount;
  const newRemainingDebt = Math.max(0, purchase.totalAmount - newPaidAmount);

  let newStatus = 'partial';
  if (newRemainingDebt <= 0) newStatus = 'paid';

  if (!purchase.payments) purchase.payments = [];
  purchase.payments.push({
    id: 'PAY-' + Date.now(),
    date,
    amount,
    method,
    note,
    recordedAt: Date.now()
  });

  purchase.paidAmount = newPaidAmount;
  purchase.remainingDebt = newRemainingDebt;
  purchase.status = newStatus;

  sLoad('Menyimpan Pembayaran...');
  isSaving = true;
  try {
    await saveApp();
    showToast('Pembayaran berhasil dicatat!');
    closePurchasePaymentModal();
    rAdmPurchases();
  } catch (e) {
    showToast('Gagal mencatat pembayaran!');
  } finally {
    isSaving = false;
    hLoad();
  }
};

// =============================================================================
// 4. DETAIL FAKTUR & CETAK NOTA
// =============================================================================
window.openPurchaseDetailModal = (purchaseId) => {
  const p = (appData.purchases || []).find(x => String(x.id) === String(purchaseId));
  if (!p) return showToast('Faktur tidak ditemukan!');
  currentViewingPurchase = p;

  setIn('purch-detail-inv-title', `Faktur: ${p.invoiceNo}`);
  setIn('purch-detail-inv-date', `Tanggal: ${_fDate(p.date)}`);

  const container = el('purch-detail-printable-content');
  if (container) {
    const statusBadge = p.status === 'paid' 
      ? '<span class="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">LUNAS</span>'
      : (p.status === 'partial' 
        ? '<span class="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">SEBAGIAN (DICICIL)</span>'
        : '<span class="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">BELUM LUNAS</span>');

    container.innerHTML = `
      <!-- Header Nota -->
      <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
        <div class="flex justify-between items-start">
          <div>
            <h2 class="font-black text-sm text-slate-800 dark:text-white uppercase">${appData.store?.name || 'TOKO GRAFIKA'}</h2>
            <p class="text-[10px] text-slate-400 font-medium">${appData.store?.address || 'Alamat Toko'}</p>
          </div>
          <div class="text-right">
            ${statusBadge}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
          <div>
            <span class="text-slate-400 font-bold block text-[9px] uppercase">Supplier</span>
            <span class="font-black text-slate-800 dark:text-slate-200">${esc(p.supplierName)}</span>
          </div>
          <div>
            <span class="text-slate-400 font-bold block text-[9px] uppercase">Metode / Jatuh Tempo</span>
            <span class="font-black text-slate-800 dark:text-slate-200">${p.paymentType === 'cash' ? 'CASH (Tunai)' : `TEMPO (${_fDate(p.dueDate)})`}</span>
          </div>
        </div>
      </div>

      <!-- Item List Table -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[9px]">
            <tr>
              <th class="p-2.5">No</th>
              <th class="p-2.5">Nama Barang</th>
              <th class="p-2.5 text-center">Qty</th>
              <th class="p-2.5 text-right">Harga Beli</th>
              <th class="p-2.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            ${(p.items || []).map((it, idx) => `
              <tr>
                <td class="p-2.5 font-bold text-slate-400">${idx + 1}</td>
                <td class="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                  ${esc(it.productName)}
                  ${it.variantName ? `<span class="block text-[10px] text-slate-400 font-medium">[${esc(it.variantName)}]</span>` : ''}
                </td>
                <td class="p-2.5 text-center font-bold">${it.qty} ${esc(it.unit)}</td>
                <td class="p-2.5 text-right font-medium">${fCur(it.buyPrice)}</td>
                <td class="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">${fCur(it.subtotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Ringkasan Keuangan -->
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 font-bold">
        <div class="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Total Pembelian</span>
          <span class="font-black text-slate-900 dark:text-white">${fCur(p.totalAmount)}</span>
        </div>
        <div class="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span>Total Sudah Terbayar</span>
          <span class="font-black">${fCur(p.paidAmount)}</span>
        </div>
        <div class="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between text-amber-600 dark:text-amber-400 font-black text-sm">
          <span>Sisa Hutang ke Supplier</span>
          <span>${fCur(p.remainingDebt || 0)}</span>
        </div>
      </div>

      <!-- Riwayat Pembayaran -->
      <div>
        <h4 class="font-black text-xs text-slate-800 dark:text-white mb-2 uppercase tracking-wider">Riwayat Cicilan / Pembayaran</h4>
        <div class="space-y-2">
          ${(p.payments || []).map(pay => `
            <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <div class="font-bold text-slate-800 dark:text-slate-200">${fCur(pay.amount)}</div>
                <div class="text-[10px] text-slate-400">${_fDate(pay.date)} • Met: ${pay.method ? pay.method.toUpperCase() : 'CASH'} ${pay.note ? `• ${esc(pay.note)}` : ''}</div>
              </div>
              <span class="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">Lunas</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  const modal = el('purchase-detail-modal');
  const box = el('purchase-detail-box');
  if (modal && box) {
    show('purchase-detail-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-5');
    }, 10);
  }
};

window.closePurchaseDetailModal = () => {
  const modal = el('purchase-detail-modal');
  const box = el('purchase-detail-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-5');
    setTimeout(() => hide('purchase-detail-modal'), 250);
  }
};

window.printPurchaseInvoice = () => {
  if (!currentViewingPurchase) return;
  const p = currentViewingPurchase;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return showToast('Popup browser diblokir!');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Faktur Pembelian ${p.invoiceNo}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; color: #1e293b; }
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 16px; text-transform: uppercase; }
        .grid { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .summary { float: right; width: 250px; font-size: 11px; margin-bottom: 30px; }
        .summary-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .summary-total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${appData.store?.name || 'TOKO GRAFIKA'}</h1>
        <div>${appData.store?.address || 'Alamat Toko'}</div>
      </div>
      <div class="grid">
        <div>
          <b>FAKTUR PEMBELIAN BARANG</b><br>
          No: ${p.invoiceNo}<br>
          Tanggal: ${_fDate(p.date)}
        </div>
        <div style="text-align: right;">
          <b>SUPPLIER:</b><br>
          ${esc(p.supplierName)}<br>
          Status: <b>${p.status.toUpperCase()}</b>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Produk / Varian</th>
            <th class="text-center">Jumlah</th>
            <th class="text-right">Harga Beli</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${(p.items || []).map((it, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td>${esc(it.productName)} ${it.variantName ? `[${esc(it.variantName)}]` : ''}</td>
              <td class="text-center">${it.qty} ${esc(it.unit)}</td>
              <td class="text-right">${fCur(it.buyPrice)}</td>
              <td class="text-right">${fCur(it.subtotal)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="summary">
        <div class="summary-row"><span>Total Faktur:</span> <b>${fCur(p.totalAmount)}</b></div>
        <div class="summary-row"><span>Sudah Terbayar:</span> <b>${fCur(p.paidAmount)}</b></div>
        <div class="summary-row summary-total"><span>Sisa Hutang:</span> <b>${fCur(p.remainingDebt || 0)}</b></div>
      </div>
      <script>window.onload = function() { window.print(); };<\/script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

// =============================================================================
// 5. RENDER CMS TAB: PEMBELIAN, HUTANG & SUPPLIER
// =============================================================================
window.setPurchasesSubTab = (subTab) => {
  purchasesActiveSubTab = subTab;
  rAdmPurchases();
};

window.rAdmPurchases = () => {
  const purchases = appData.purchases || [];
  const suppliers = appData.suppliers || [];

  // Hitung total ringkasan
  const totalPurchaseVal = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const totalPaidVal = purchases.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalRemainingDebt = purchases.reduce((sum, p) => sum + (p.remainingDebt || 0), 0);
  const totalDebtsCount = purchases.filter(p => p.status === 'unpaid' || p.status === 'partial').length;

  const content = el('admin-content');
  if (!content) return;

  const tabBtnClass = (t) => purchasesActiveSubTab === t
    ? '!bg-emerald-600 !text-white font-black shadow-md whitespace-nowrap shrink-0'
    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-bold border border-slate-200/80 dark:border-slate-700 whitespace-nowrap shrink-0';

  let subTabHtml = '';
  if (purchasesActiveSubTab === 'invoices') {
    subTabHtml = _renderInvoicesSubTab(purchases);
  } else if (purchasesActiveSubTab === 'debts') {
    subTabHtml = _renderDebtsSubTab(purchases);
  } else if (purchasesActiveSubTab === 'suppliers') {
    subTabHtml = _renderSuppliersSubTab(suppliers, purchases);
  } else if (purchasesActiveSubTab === 'reports') {
    subTabHtml = _renderReportsSubTab(purchases, suppliers);
  }

  content.innerHTML = `
    <div class="space-y-5 pb-20 w-full">
      
      <!-- Helper Banner Panduan Cepat -->
      <div class="bg-teal-50/70 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-800/40 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-sm shrink-0">
            <i class="fa-solid fa-cart-flatbed"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
              Pusat Pengadaan & Hutang Supplier Toko
            </p>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Catat faktur masuk, auto-update stok & HPP, pantau jatuh tempo, dan kelola cicilan supplier.
            </p>
          </div>
        </div>
        <button type="button" onclick="openCmsGuide('purchases')" class="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all shrink-0">
          <i class="fa-solid fa-book-open-reader text-xs"></i> <span>Buku Panduan</span>
        </button>
      </div>

      <!-- Top Overview Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <!-- Card 1: Total Pembelian -->
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg sm:text-xl shrink-0">
            <i class="fa-solid fa-cart-flatbed"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight truncate">Total Pembelian Barang</p>
            <h4 class="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight mt-0.5 truncate">${fCur(totalPurchaseVal)}</h4>
            <p class="text-[9px] text-slate-400 font-medium">${purchases.length} Transaksi Faktur</p>
          </div>
        </div>

        <!-- Card 2: Total Pembayaran Keluar -->
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center gap-3.5">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg sm:text-xl shrink-0">
            <i class="fa-solid fa-money-bill-transfer"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight truncate">Total Sudah Terbayar</p>
            <h4 class="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 leading-tight mt-0.5 truncate">${fCur(totalPaidVal)}</h4>
            <p class="text-[9px] text-slate-400 font-medium">Cash & Cicilan Keluar</p>
          </div>
        </div>

        <!-- Card 3: Sisa Hutang ke Supplier -->
        <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border ${totalRemainingDebt > 0 ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/20' : 'border-slate-200/80 dark:border-slate-700'} shadow-sm flex items-center gap-3.5">
          <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${totalRemainingDebt > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'} flex items-center justify-center text-lg sm:text-xl shrink-0">
            <i class="fa-solid fa-hourglass-half"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[9.5px] sm:text-[10px] font-bold ${totalRemainingDebt > 0 ? 'text-amber-700 dark:text-amber-300 font-black' : 'text-slate-400'} uppercase tracking-wider leading-tight truncate">Total Sisa Hutang Supplier</p>
            <h4 class="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 leading-tight mt-0.5 truncate">${fCur(totalRemainingDebt)}</h4>
            <p class="text-[9px] text-slate-400 font-medium">${totalDebtsCount} Tagihan Belum Lunas</p>
          </div>
        </div>
      </div>

      <!-- Sub-Tab Navigation Bar (Smooth Mobile Horizontal Scroll) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto -mx-1 px-1">
          <button type="button" class="px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 ${tabBtnClass('invoices')}" onclick="setPurchasesSubTab('invoices')">
            <i class="fa-solid fa-file-invoice text-xs"></i>
            <span>Faktur (${purchases.length})</span>
          </button>

          <button type="button" class="px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 ${tabBtnClass('debts')}" onclick="setPurchasesSubTab('debts')">
            <i class="fa-solid fa-book-bookmark text-xs"></i>
            <span>Buku Hutang</span>
            ${totalDebtsCount > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white ml-0.5">${totalDebtsCount}</span>` : ''}
          </button>

          <button type="button" class="px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 ${tabBtnClass('suppliers')}" onclick="setPurchasesSubTab('suppliers')">
            <i class="fa-solid fa-truck-field text-xs"></i>
            <span>Supplier (${suppliers.length})</span>
          </button>

          <button type="button" class="px-3.5 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 ${tabBtnClass('reports')}" onclick="setPurchasesSubTab('reports')">
            <i class="fa-solid fa-chart-pie text-xs"></i>
            <span>Rekap</span>
          </button>
        </div>

        <div class="flex items-center shrink-0 w-full sm:w-auto">
          <button type="button" class="btn-solid no-glass w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all whitespace-nowrap" onclick="openPurchaseModal()">
            <i class="fa-solid fa-plus text-xs"></i>
            <span>Input Pembelian Baru</span>
          </button>
        </div>
      </div>

      <!-- Sub-Tab Content -->
      <div id="purchases-subtab-container">
        ${subTabHtml}
      </div>

    </div>
  `;
};

// Sub-Tab 1: Faktur Pembelian
const _renderInvoicesSubTab = (purchases) => {
  if (!purchases.length) {
    return `
      <div class="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-cart-flatbed"></i>
        </div>
        <h4 class="font-black text-sm text-slate-800 dark:text-white">Belum Ada Transaksi Pembelian</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Klik tombol "Input Pembelian Baru" di atas untuk mencatat faktur pembelian barang dari supplier.</p>
      </div>
    `;
  }

  return `
    <div class="space-y-3">
      ${purchases.map(p => {
        const isPaid = p.status === 'paid';
        const isPartial = p.status === 'partial';
        const badge = isPaid 
          ? '<span class="px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">LUNAS</span>'
          : (isPartial 
            ? `<span class="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">DICICIL (Sisa ${fCur(p.remainingDebt)})</span>`
            : `<span class="px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">BELUM BAYAR (Hutang ${fCur(p.remainingDebt)})</span>`);

        return `
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 flex items-center justify-center text-lg shrink-0 mt-0.5">
                <i class="fa-solid fa-file-invoice"></i>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white leading-tight font-mono">${esc(p.invoiceNo)}</h4>
                  ${badge}
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Supplier: <b class="text-slate-700 dark:text-slate-200">${esc(p.supplierName)}</b> • ${_fDate(p.date)}
                </p>
                <p class="text-[10px] text-slate-400 mt-0.5">
                  ${(p.items || []).length} jenis barang (${(p.items || []).reduce((acc, it) => acc + it.qty, 0)} unit)
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
              <div class="text-right">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Faktur</span>
                <span class="text-sm sm:text-base font-black text-slate-800 dark:text-white">${fCur(p.totalAmount)}</span>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                ${!isPaid ? `
                  <button type="button" class="btn-solid no-glass px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs" onclick="openPurchasePaymentModal('${p.id}')" title="Catat Pembayaran Cicilan">
                    <i class="fa-solid fa-money-bill-wave text-[10px]"></i> Bayar
                  </button>` : ''}
                <button type="button" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1" onclick="openPurchaseDetailModal('${p.id}')" title="Rincian Faktur">
                  <i class="fa-solid fa-eye text-[10px]"></i> Detail
                </button>
                <button type="button" class="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors" onclick="deletePurchaseInvoice('${p.id}')" title="Hapus Faktur">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

// Sub-Tab 2: Buku Hutang Supplier
const _renderDebtsSubTab = (purchases) => {
  const debtPurchases = purchases.filter(p => p.status === 'unpaid' || p.status === 'partial');

  if (!debtPurchases.length) {
    return `
      <div class="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center text-2xl mx-auto mb-3">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="font-black text-sm text-slate-800 dark:text-white">Tidak Ada Hutang Supplier</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Hebat! Semua tagihan faktur pembelian barang ke supplier telah lunas terbayar.</p>
      </div>
    `;
  }

  const today = new Date();

  return `
    <div class="space-y-3">
      ${debtPurchases.map(p => {
        const isOverdue = p.dueDate && new Date(p.dueDate) < today;
        return `
          <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 ${isOverdue ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20' : 'border-amber-200 dark:border-amber-800/50'} shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-xs font-mono text-slate-800 dark:text-white">${esc(p.invoiceNo)}</span>
                <span class="text-xs font-bold text-slate-600 dark:text-slate-300">• ${esc(p.supplierName)}</span>
                ${isOverdue ? `<span class="px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-500 text-white">LEWAT JATUH TEMPO</span>` : `<span class="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-500 text-white">TEMPO</span>`}
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                Jatuh Tempo: <b class="${isOverdue ? 'text-rose-600 font-black' : 'text-amber-600'}">${_fDate(p.dueDate)}</b> • Transaksi: ${_fDate(p.date)}
              </p>
              <div class="flex items-center gap-3 mt-1 text-[11px] font-bold">
                <span class="text-slate-400">Total: ${fCur(p.totalAmount)}</span>
                <span class="text-emerald-600">Terbayar: ${fCur(p.paidAmount)}</span>
              </div>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
              <div class="text-left sm:text-right">
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Hutang</span>
                <span class="text-base font-black text-amber-600 dark:text-amber-400">${fCur(p.remainingDebt)}</span>
              </div>
              <button type="button" class="btn-solid no-glass px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95" onclick="openPurchasePaymentModal('${p.id}')">
                <i class="fa-solid fa-money-bill-wave"></i> Bayar
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

// Sub-Tab 3: Daftar Rekanan Supplier
const _renderSuppliersSubTab = (suppliers, purchases) => {
  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Daftar Rekanan Supplier (${suppliers.length})</h4>
        <button type="button" class="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1 hover:bg-indigo-600 hover:text-white transition-all" onclick="openSupplierModal()">
          <i class="fa-solid fa-plus text-xs"></i> Tambah Supplier
        </button>
      </div>

      ${!suppliers.length ? `
        <div class="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div class="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center text-2xl mx-auto mb-3">
            <i class="fa-solid fa-truck-field"></i>
          </div>
          <h4 class="font-black text-sm text-slate-800 dark:text-white">Belum Ada Data Supplier</h4>
          <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Tambahkan kontak supplier atau distributor untuk mempermudah pembelian barang.</p>
        </div>
      ` : `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          ${suppliers.map(s => {
            const suppPurchases = purchases.filter(p => String(p.supplierId) === String(s.id));
            const suppProducts = (appData.products || []).filter(p => String(p.supplierId) === String(s.id));
            const totalBuy = suppPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
            const totalDebt = suppPurchases.reduce((acc, p) => acc + (p.remainingDebt || 0), 0);

            return `
              <div class="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <h4 class="font-black text-sm text-slate-800 dark:text-white truncate">${esc(s.name)}</h4>
                    <div class="flex items-center gap-1">
                      <button type="button" class="text-slate-400 hover:text-indigo-600 p-1 rounded-lg" onclick="openSupplierModal('${s.id}')" title="Edit">
                        <i class="fa-solid fa-pen-to-square text-xs"></i>
                      </button>
                      <button type="button" class="text-slate-400 hover:text-rose-600 p-1 rounded-lg" onclick="deleteSupplier('${s.id}')" title="Hapus">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>

                  ${s.pic ? `<p class="text-[11px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1"><i class="fa-solid fa-user-tie text-[10px] text-slate-400"></i> ${esc(s.pic)}</p>` : ''}
                  ${s.phone ? `<p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1"><i class="fa-brands fa-whatsapp text-xs"></i> ${esc(s.phone)}</p>` : ''}
                  ${s.address ? `<p class="text-[10px] text-slate-400 mt-1 line-clamp-1"><i class="fa-solid fa-location-dot mr-1"></i>${esc(s.address)}</p>` : ''}
                  ${s.bankInfo ? `<p class="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium mt-1"><i class="fa-solid fa-credit-card mr-1"></i>${esc(s.bankInfo)}</p>` : ''}
                  
                  <div class="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span class="badge badge-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 font-bold">
                      <i class="fa-solid fa-boxes-stacked text-[8px]"></i> ${suppProducts.length} Produk Tertaut
                    </span>
                  </div>
                </div>

                <div class="pt-2.5 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <div class="flex justify-between items-center text-[10px] font-bold">
                    <div>
                      <span class="text-slate-400 block text-[9px] uppercase">Total Beli</span>
                      <span class="text-slate-800 dark:text-slate-200">${fCur(totalBuy)}</span>
                    </div>
                    <div class="text-right">
                      <span class="text-slate-400 block text-[9px] uppercase">Sisa Hutang</span>
                      <span class="${totalDebt > 0 ? 'text-amber-600 font-black' : 'text-emerald-600'}">${fCur(totalDebt)}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-1.5 pt-1">
                    <button type="button" onclick="openSupplierProductsModal('${s.id}')" class="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs" title="Lihat & Kelola Produk Asal Supplier Ini">
                      <i class="fa-solid fa-layer-group text-[10px] text-amber-500"></i> Produk (${suppProducts.length})
                    </button>
                    <button type="button" onclick="openPurchaseModalForSupplier('${s.id}')" class="px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs" title="Beli Barang dari Supplier Ini">
                      <i class="fa-solid fa-cart-plus text-[10px]"></i> Beli Barang
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
};

// Sub-Tab 4: Rekap & Laporan Keuangan Pembelian
const _renderReportsSubTab = (purchases, suppliers) => {
  return `
    <div class="space-y-4">
      <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3 sm:space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-white uppercase tracking-wider">Rekapitulasi Pembelian & Kas</h4>
          <span class="text-[10px] sm:text-[11px] font-bold text-slate-400">${purchases.length} Total Faktur</span>
        </div>

        <!-- Mobile Card List View (No Horizontal Scrollbar) -->
        <div class="sm:hidden space-y-2.5">
          ${!suppliers.length ? `
            <div class="p-4 text-center text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <i class="fa-solid fa-truck-field text-slate-300 mr-1.5"></i> Belum ada data supplier
            </div>
          ` : suppliers.map(s => {
            const sPurch = purchases.filter(p => String(p.supplierId) === String(s.id));
            const totalB = sPurch.reduce((acc, p) => acc + p.totalAmount, 0);
            const totalP = sPurch.reduce((acc, p) => acc + p.paidAmount, 0);
            const totalH = sPurch.reduce((acc, p) => acc + (p.remainingDebt || 0), 0);
            return `
              <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-extrabold text-slate-800 dark:text-white truncate text-xs">${esc(s.name)}</span>
                  ${totalH <= 0 ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">LUNAS</span>' : `<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">HUTANG</span>`}
                </div>
                <div class="grid grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px]">
                  <div>
                    <span class="text-slate-400 block uppercase font-bold text-[9px]">Total Beli</span>
                    <span class="font-bold text-slate-800 dark:text-slate-200">${fCur(totalB)}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block uppercase font-bold text-[9px]">Terbayar</span>
                    <span class="font-bold text-emerald-600">${fCur(totalP)}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-400 block uppercase font-bold text-[9px]">Sisa Hutang</span>
                    <span class="font-black ${totalH > 0 ? 'text-amber-600' : 'text-slate-400'}">${fCur(totalH)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Desktop Table View -->
        <div class="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[9px]">
              <tr>
                <th class="p-3">Nama Supplier</th>
                <th class="p-3 text-center">Jml Faktur</th>
                <th class="p-3 text-right">Total Pembelian</th>
                <th class="p-3 text-right">Total Terbayar</th>
                <th class="p-3 text-right">Sisa Hutang</th>
                <th class="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 font-medium">
              ${!suppliers.length ? `
                <tr><td colspan="6" class="p-4 text-center text-slate-400">Belum ada data supplier</td></tr>
              ` : suppliers.map(s => {
                const sPurch = purchases.filter(p => String(p.supplierId) === String(s.id));
                const totalB = sPurch.reduce((acc, p) => acc + p.totalAmount, 0);
                const totalP = sPurch.reduce((acc, p) => acc + p.paidAmount, 0);
                const totalH = sPurch.reduce((acc, p) => acc + (p.remainingDebt || 0), 0);
                return `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-3 font-extrabold text-slate-800 dark:text-slate-200">${esc(s.name)}</td>
                    <td class="p-3 text-center font-bold">${sPurch.length}</td>
                    <td class="p-3 text-right font-bold text-slate-800 dark:text-slate-200">${fCur(totalB)}</td>
                    <td class="p-3 text-right font-bold text-emerald-600">${fCur(totalP)}</td>
                    <td class="p-3 text-right font-black ${totalH > 0 ? 'text-amber-600' : 'text-slate-400'}">${fCur(totalH)}</td>
                    <td class="p-3 text-center">
                      ${totalH <= 0 ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700">LUNAS</span>' : `<span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800">HUTANG</span>`}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};

// ==========================================
// MODAL KATALOG & PENGELOMPOKAN PRODUK SUPPLIER
// ==========================================
window.suppProdModalSubTab = 'list'; // 'list' | 'link'
window._suppProdSearchQuery = '';

window.openSupplierProductsModal = (supplierId) => {
  const s = (appData.suppliers || []).find(x => String(x.id) === String(supplierId));
  if (!s) return showToast('Data supplier tidak ditemukan!');
  window._currentViewingSupplierId = s.id;
  window.suppProdModalSubTab = 'list';
  window._suppProdSearchQuery = '';

  setIn('supp-prod-modal-title', `Katalog Produk: ${s.name}`);
  setIn('supp-prod-modal-subtitle', `${s.pic ? `PIC: ${s.pic} • ` : ''}${s.phone ? `WA: ${s.phone}` : ''}`);

  renderSupplierProductsModalContent();

  const modal = el('supplier-products-modal');
  const box = el('supplier-products-modal-box');
  if (modal && box) {
    show('supplier-products-modal');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      box.classList.remove('translate-y-5');
    }, 10);
  }
};

window.closeSupplierProductsModal = () => {
  const modal = el('supplier-products-modal');
  const box = el('supplier-products-modal-box');
  if (modal && box) {
    modal.classList.add('opacity-0');
    box.classList.add('translate-y-5');
    setTimeout(() => hide('supplier-products-modal'), 250);
  }
  window._currentViewingSupplierId = null;
};

window.setSupplierProductsSubTab = (tab) => {
  window.suppProdModalSubTab = tab;
  renderSupplierProductsModalContent();
};

window.renderSupplierProductsModalContent = (searchQuery = null) => {
  if (searchQuery !== null) window._suppProdSearchQuery = searchQuery;
  const suppId = window._currentViewingSupplierId;
  const s = (appData.suppliers || []).find(x => String(x.id) === String(suppId));
  if (!s) return;

  const q = (window._suppProdSearchQuery || '').trim().toLowerCase();
  const allSuppProds = (appData.products || []).filter(p => String(p.supplierId) === String(s.id));
  const unlinkedProds = (appData.products || []).filter(p => String(p.supplierId) !== String(s.id));

  const totalItems = allSuppProds.length;
  const totalStock = allSuppProds.reduce((sum, p) => {
    if (p.variants && p.variants.length > 0) {
      return sum + p.variants.reduce((vSum, v) => vSum + Number(v.stock || 0), 0);
    }
    return sum + Number(p.stock || 0);
  }, 0);
  const totalAssetHpp = allSuppProds.reduce((sum, p) => {
    if (p.variants && p.variants.length > 0) {
      return sum + p.variants.reduce((vSum, v) => vSum + (Number(v.stock || 0) * Number(v.costPrice || p.costPrice || 0)), 0);
    }
    return sum + (Number(p.stock || 0) * Number(p.costPrice || 0));
  }, 0);

  const activeTab = window.suppProdModalSubTab || 'list';

  let subTabNav = `
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
      <button type="button" onclick="setSupplierProductsSubTab('list')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'list' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
        <i class="fa-solid fa-boxes-stacked text-xs"></i>
        <span>Produk Asal Supplier (${totalItems})</span>
      </button>
      <button type="button" onclick="setSupplierProductsSubTab('link')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'link' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}">
        <i class="fa-solid fa-link text-xs"></i>
        <span>Tautkan Produk Toko (${unlinkedProds.length})</span>
      </button>
    </div>
  `;

  let contentHtml = '';

  if (activeTab === 'list') {
    const filtered = !q ? allSuppProds : allSuppProds.filter(p => {
      return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    });

    contentHtml = `
      <!-- Top Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base shrink-0">
            <i class="fa-solid fa-boxes-stacked"></i>
          </div>
          <div>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Produk Asal</span>
            <h4 class="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-none mt-0.5">${totalItems} Produk</h4>
          </div>
        </div>

        <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base shrink-0">
            <i class="fa-solid fa-warehouse"></i>
          </div>
          <div>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Stok di Rak</span>
            <h4 class="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">${totalStock} Unit</h4>
          </div>
        </div>

        <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-base shrink-0">
            <i class="fa-solid fa-coins"></i>
          </div>
          <div>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nilai Modal (HPP)</span>
            <h4 class="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">${fCur(totalAssetHpp)}</h4>
          </div>
        </div>
      </div>

      <!-- Search Input -->
      <div class="relative w-full">
        <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input type="text" value="${esc(window._suppProdSearchQuery)}" placeholder="Cari nama produk, SKU, kategori dari supplier ini..." oninput="renderSupplierProductsModalContent(this.value)" class="admin-input !py-2.5 !pl-9 w-full text-xs font-bold" />
      </div>

      <!-- Product Cards List -->
      <div class="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
        ${!filtered.length ? `
          <div class="p-10 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <i class="fa-solid fa-box-open text-3xl text-slate-300 dark:text-slate-600 mb-2 block"></i>
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400">${q ? `Tidak ada produk yang cocok dengan "${q}"` : 'Belum ada produk toko yang ditautkan ke supplier ini.'}</p>
            <button type="button" onclick="setSupplierProductsSubTab('link')" class="mt-3 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-600 hover:text-white transition-all">
              + Tautkan Produk Sekarang
            </button>
          </div>
        ` : filtered.map(p => {
          const hasVars = p.variants && p.variants.length > 0;
          const curStock = hasVars ? p.variants.reduce((sum, v) => sum + Number(v.stock || 0), 0) : Number(p.stock ?? 0);
          const lastBuyDateStr = p.lastPurchaseDate ? _fDate(p.lastPurchaseDate) : 'Belum Ada';
          const lastBuyPriceStr = p.lastPurchasePrice ? fCur(p.lastPurchasePrice) : (p.costPrice ? fCur(p.costPrice) : '-');

          return `
            <div class="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <img src="${esc(p.img || 'https://placehold.co/100?text=Img')}" onerror="this.src='https://placehold.co/100?text=Img'" class="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h4 class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">${esc(p.name)}</h4>
                    <span class="badge badge-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono font-bold">${esc(p.sku || '-')}</span>
                  </div>
                  <div class="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5 flex-wrap">
                    <span>Kategori: <b>${esc(p.category || 'Umum')}</b></span>
                    <span>•</span>
                    <span>Stok: <b class="${curStock <= 5 ? 'text-rose-500 font-black' : 'text-emerald-600'}">${curStock} ${esc(p.unit || 'Pcs')}</b></span>
                    <span>•</span>
                    <span>HPP: <b class="text-slate-700 dark:text-slate-300">${fCur(p.costPrice || 0)}</b></span>
                    <span>•</span>
                    <span>Jual: <b class="text-emerald-600">${fCur(p.price || 0)}</b></span>
                  </div>
                  ${p.lastPurchaseDate ? `
                    <div class="text-[9px] text-amber-600 dark:text-amber-400 font-medium mt-1 flex items-center gap-1">
                      <i class="fa-solid fa-clock-rotate-left"></i> Asal Kulakan Terakhir: <b>${lastBuyPriceStr}</b> (${lastBuyDateStr})
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700 justify-end">
                <button type="button" onclick="createPurchaseForSpecificProduct('${s.id}', '${p.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition-all font-bold text-xs flex items-center gap-1 shadow-xs" title="Beli / Buat Faktur Barang Ini">
                  <i class="fa-solid fa-cart-plus text-[10px]"></i> Beli
                </button>
                <button type="button" onclick="unlinkProductFromSupplier('${p.id}')" class="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all text-xs" title="Lepas Hubungan dari Supplier Ini">
                  <i class="fa-solid fa-link-slash"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    // TAB LINK
    const filteredUnlinked = !q ? unlinkedProds : unlinkedProds.filter(p => {
      return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    });

    contentHtml = `
      <div class="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 text-xs space-y-1">
        <h5 class="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
          <i class="fa-solid fa-link"></i> Hubungkan Produk Toko ke Supplier "${esc(s.name)}"
        </h5>
        <p class="text-[11px] text-slate-500 dark:text-slate-400">
          Pilih produk di bawah untuk menandai bahwa barang tersebut disuplai oleh vendor ini. Pengelompokan ini mempermudah pencarian saat membuat faktur pembelian.
        </p>
      </div>

      <!-- Search Input -->
      <div class="relative w-full">
        <i class="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input type="text" value="${esc(window._suppProdSearchQuery)}" placeholder="Cari nama produk yang ingin ditautkan..." oninput="renderSupplierProductsModalContent(this.value)" class="admin-input !py-2.5 !pl-9 w-full text-xs font-bold" />
      </div>

      <div class="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        ${!filteredUnlinked.length ? `
          <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400 font-medium">
            Tidak ada produk lain yang tersedia untuk ditautkan.
          </div>
        ` : filteredUnlinked.map(p => {
          return `
            <div class="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-indigo-400 flex items-center justify-between gap-3 transition-all">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <img src="${esc(p.img || 'https://placehold.co/100?text=Img')}" onerror="this.src='https://placehold.co/100?text=Img'" class="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                <div class="min-w-0 flex-1">
                  <h4 class="font-bold text-xs text-slate-800 dark:text-white truncate">${esc(p.name)}</h4>
                  <p class="text-[10px] text-slate-400">${p.sku ? `SKU: ${esc(p.sku)} • ` : ''}${p.supplierName ? `<span class="text-amber-600 font-semibold">Saat ini: ${esc(p.supplierName)}</span>` : '<span class="text-slate-400">Belum Ada Supplier</span>'}</p>
                </div>
              </div>
              <button type="button" onclick="linkProductToSupplier('${p.id}', '${s.id}')" class="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-200 dark:border-indigo-800 font-bold text-xs flex items-center gap-1 shadow-xs transition-all shrink-0">
                <i class="fa-solid fa-link text-[10px]"></i> Tautkan
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  setH('supp-prod-modal-body', subTabNav + contentHtml);

  // Footer Action
  setH('supp-prod-modal-footer-actions', `
    <div class="flex items-center gap-2 flex-wrap justify-end">
      <button type="button" onclick="closeSupplierProductsModal(); openPricetagModal([${allSuppProds.map(p => p.id).join(',')}])" class="px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs" title="Cetak Price Tag untuk seluruh produk supplier ini">
        <i class="fa-solid fa-tags text-xs"></i> Cetak Label (${allSuppProds.length})
      </button>
      <button type="button" onclick="openPurchaseModalForSupplier('${s.id}')" class="btn-solid no-glass px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
        <i class="fa-solid fa-plus text-xs"></i> Buat Faktur Pembelian
      </button>
    </div>
  `);
};

window.linkProductToSupplier = async (productId, supplierId) => {
  const s = (appData.suppliers || []).find(x => String(x.id) === String(supplierId));
  const p = (appData.products || []).find(x => String(x.id) === String(productId));
  if (!s || !p) return;

  p.supplierId = s.id;
  p.supplierName = s.name;

  sLoad('Menautkan Produk...');
  try {
    await db.collection("freshmart").doc("cms_data").collection("products").doc(p.id.toString()).update({ supplierId: s.id, supplierName: s.name });
    await saveApp();
    showToast(`Produk "${p.name}" berhasil ditautkan ke ${s.name}!`);
    renderSupplierProductsModalContent();
    rAdmPurchases();
  } catch(e) {
    showToast('Gagal menautkan produk!');
  }
  hLoad();
};

window.unlinkProductFromSupplier = async (productId) => {
  const p = (appData.products || []).find(x => String(x.id) === String(productId));
  if (!p) return;
  showConfirm(`Lepas tautan barang "${p.name}" dari supplier ini?`, async () => {
    p.supplierId = '';
    p.supplierName = '';
    sLoad('Memperbarui...');
    try {
      await db.collection("freshmart").doc("cms_data").collection("products").doc(p.id.toString()).update({ supplierId: '', supplierName: '' });
      await saveApp();
      showToast('Tautan supplier berhasil dilepas!');
      renderSupplierProductsModalContent();
      rAdmPurchases();
    } catch(e) {
      showToast('Gagal melepas tautan!');
    }
    hLoad();
  });
};

window.openPurchaseModalForSupplier = (supplierId) => {
  closeSupplierProductsModal();
  openPurchaseModal();
  setTimeout(() => {
    const suppSel = el('purch-supplier-id');
    if (suppSel) {
      suppSel.value = supplierId;
      onPurchaseSupplierChange(supplierId);
      window.isPurchSupplierOnlyFilter = true;
      filterPurchProducts('');
      const btn = el('purch-filter-supp-only-btn');
      const suppProdsCount = (appData.products || []).filter(p => String(p.supplierId) === String(supplierId)).length;
      if (btn) {
        btn.className = 'text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 text-white border border-amber-600 shadow-sm flex items-center gap-1 transition-all';
        const txt = el('purch-filter-supp-only-text');
        if (txt) txt.innerText = `Menampilkan ${suppProdsCount} Produk Supplier Ini`;
      }
    }
  }, 100);
};

window.createPurchaseForSpecificProduct = (supplierId, productId) => {
  closeSupplierProductsModal();
  openPurchaseModal();
  setTimeout(() => {
    const suppSel = el('purch-supplier-id');
    if (suppSel) {
      suppSel.value = supplierId;
      onPurchaseSupplierChange(supplierId);
    }
    const prodSel = el('purch-item-prod');
    if (prodSel) {
      prodSel.value = productId;
      onPurchaseProductSelect();
      el('purch-item-qty')?.focus();
    }
  }, 100);
};

