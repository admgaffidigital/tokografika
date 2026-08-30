// =============================================================================
// FRESHMART CHECKOUT & PAYMENT PROCESSING MODULE
// =============================================================================

window.getLocation = () => {
  if (!navigator.geolocation) return showToast("GPS tidak dukung");
  el('btn-location').innerHTML = `<i class="fa-solid fa-spinner fa-spin text-sm"></i>`;
  navigator.geolocation.getCurrentPosition(
    p => {
      cust.lat = p.coords.latitude;
      cust.lng = p.coords.longitude;
      hide('btn-location'); 
      show('location-status'); 
      el('location-status').classList.add('flex');
      showToast("GPS Dapat");
    }, 
    e => {
      el('btn-location').innerHTML = `<i class="fa-solid fa-location-crosshairs text-emerald-400"></i> GPS`;
      showToast("Gagal GPS");
    }, 
    { enableHighAccuracy: !0, timeout: 15000 }
  );
};

window.applyVoucher = () => {
  const i = getV('voucher-input').toUpperCase();
  const f = (appData.vouchers || []).find(v => v.code.toUpperCase() === i);
  show('voucher-msg-container');
  if (f) {
    if (f.expiredAt) {
      const exp = new Date(f.expiredAt);
      if (!isNaN(exp) && exp < new Date()) {
        vouch = null;
        setH('voucher-msg', `<i class="fa-solid fa-clock mr-1"></i> Voucher Sudah Kadaluarsa`);
        el('voucher-msg-container').className = "bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 p-3 rounded-xl mt-3 text-center";
        el('voucher-msg').className = "text-xs font-bold text-rose-600 dark:text-rose-400";
        if (el('view-payment').classList.contains('flex')) rPay();
        return;
      }
    }
    vouch = f;
    setH('voucher-msg', `<i class="fa-solid fa-check-circle mr-1"></i> Voucher Aktif!`);
    el('voucher-msg-container').className = "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl mt-3 text-center";
    el('voucher-msg').className = "text-xs font-bold text-emerald-700 dark:text-emerald-400";
  } else if (i === '') {
    vouch = null;
    hide('voucher-msg-container');
  } else {
    vouch = null;
    setH('voucher-msg', `<i class="fa-solid fa-times-circle mr-1"></i> Tidak Valid`);
    el('voucher-msg-container').className = "bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 p-3 rounded-xl mt-3 text-center";
    el('voucher-msg').className = "text-xs font-bold text-rose-600 dark:text-rose-400";
  }
  if (el('view-payment').classList.contains('flex')) rPay();
};

window.getShippingCost = (distance, method) => {
  if (method === 'pickup') return 0;
  if (method === 'delivery') {
    const tarif = parseFloat(appData.store.costPerKm || 0);
    return Math.ceil((parseFloat(distance) || 0) * tarif / 500) * 500;
  }
  return 0;
};

window.toggleDeliveryMethod = () => {
  const m = (document.querySelector('input[name="delivery-method"]:checked') || {}).value;
  toggleCls('address-container', 'hidden', m === 'pickup');
};

window.validateAndGoToPayment = () => {
  const n = getV('cust-name');
  const m = (document.querySelector('input[name="delivery-method"]:checked') || {}).value;
  
  if (!n || !m) return showToast("Lengkapi form nama & metode!");
  
  cust.name = n;
  cust.deliveryMethod = m;
  cust.note = getV('cust-note');
  
  if (m === 'delivery') {
    cust.address = getV('cust-address');
    if (!cust.address || !cust.lat || !cust.lng) return showToast("Alamat & GPS wajib diisi!");
    cust.distance = getDist(parseFloat(appData.store.lat || 0), parseFloat(appData.store.lng || 0), cust.lat, cust.lng) || 0;
  } else {
    cust.address = "Ambil di Toko";
    cust.distance = 0;
  }
  changeView('view-payment');
};

const rChck = () => {
  let d = appData.store.isDeliveryEnabled !== false;
  let p = appData.store.isPickupEnabled !== false;
  
  let gridHtml = '';
  if (d) {
    gridHtml += `<label class='cursor-pointer relative'>
      <input class='peer sr-only custom-radio' name='delivery-method' onchange='toggleDeliveryMethod()' type='radio' value='delivery' checked>
      <div class='border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl transition-all flex flex-col items-center text-center gap-2 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-900/20'>
        <i class='fa-solid fa-truck text-xl text-slate-400 dark:text-slate-500 peer-checked:text-emerald-600 dark:peer-checked:text-emerald-400 radio-icon transition-transform'></i>
        <span class='font-bold text-xs text-slate-800 dark:text-slate-200'>Pengiriman Toko</span>
      </div>
    </label>`;
  }
  if (p) {
    gridHtml += `<label class='cursor-pointer relative'>
      <input class='peer sr-only custom-radio' name='delivery-method' onchange='toggleDeliveryMethod()' type='radio' value='pickup' ${!d ? 'checked' : ''}>
      <div class='border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl transition-all flex flex-col items-center text-center gap-2 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-900/20'>
        <i class='fa-solid fa-store text-xl text-slate-400 dark:text-slate-500 peer-checked:text-emerald-600 dark:peer-checked:text-emerald-400 radio-icon transition-transform'></i>
        <span class='font-bold text-xs text-slate-800 dark:text-slate-200'>Ambil di Toko</span>
      </div>
    </label>`;
  }
  const grid = el('delivery-methods-grid');
  if (grid) grid.innerHTML = gridHtml;
  
  const warnEl = el('no-delivery-warning');
  const b = el('btn-checkout-next');

  if (!(d || p)) {
    if(warnEl) {
      warnEl.innerText = "Mohon maaf, toko tidak melayani pemesanan online saat ini.";
      show('no-delivery-warning');
    }
    if(grid) hide('delivery-methods-grid');
    if(b) {
      b.setAttribute('disabled', 'true');
      b.classList.add('opacity-50');
    }
  } else {
    if(warnEl) hide('no-delivery-warning');
    if(grid) {
      show('delivery-methods-grid');
      grid.className = `grid gap-3 grid-cols-2`;
    }
    if(b) {
      b.removeAttribute('disabled');
      b.classList.remove('opacity-50');
    }
  }
  toggleDeliveryMethod();
};

window.togglePaymentDetails = () => {
  const m = (document.querySelector('input[name="payment"]:checked') || {}).value;
  toggleCls('detail-transfer', 'hidden', m !== 'transfer');
  toggleCls('detail-qris', 'hidden', m !== 'qris');
};

const rPay = () => {
  const sub = cart.reduce((s, i) => s + (parseFloat(getEffP(i)) || 0) * (parseInt(i.qty) || 0), 0);
  let sC = getShippingCost(cust.distance, cust.deliveryMethod);
  
  let pD = 0, sD = 0;
  if (vouch) {
    const v = parseFloat(vouch.value) || 0;
    if (vouch.type === 'product_percent') pD = sub * (v / 100);
    else if (vouch.type === 'shipping_percent') sD = sC * (v / 100);
    else if (vouch.type === 'shipping_flat') sD = v;
  }
  sD = Math.min(sD, sC); 
  pD = Math.min(pD, sub);
  const t = Math.max(0, sub - pD + sC - sD);
  
  setIn('summary-subtotal', fCur(sub));
  toggleCls('summary-product-discount-row', 'hidden', !pD);
  if (pD) setIn('summary-product-discount', `-${fCur(pD)}`);
  toggleCls('summary-shipping-row', 'hidden', cust.deliveryMethod === 'pickup');
  
  if (cust.deliveryMethod !== 'pickup') {
    const shippingSpan = document.querySelector('#summary-shipping-row span');
    if (shippingSpan) shippingSpan.innerText = 'Ongkos Kirim';
    setIn('summary-distance', `(${cust.distance.toFixed(1)}km)`);
    setIn('summary-shipping', fCur(sC));
  }
  
  toggleCls('summary-discount-row', 'hidden', !sD);
  if (sD) setIn('summary-discount', `-${fCur(sD)}`);
  setIn('summary-total', fCur(t));
  
  setIn('payment-cust-name', cust.name || '-');
  
  let methodStr = cust.deliveryMethod === 'delivery' ? `Kurir Toko (${cust.distance.toFixed(1)}km)` : 'Ambil di Toko';
  
  setIn('payment-cust-method', methodStr);
  setIn('payment-cust-address', cust.address || '-');
  
  setH('payment-items-preview', cart.map(i => `
    <div class="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 min-w-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <img src="${esc(i.img)}" class="w-10 h-10 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/400?text=No+Image'"/>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-800 dark:text-white truncate">${esc(i.name)}${i.variantName ? ` (${i.variantName})` : ''}</p>
          <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">${i.qty}${i.unit ? ' '+esc(i.unit) : ''} × ${fCur(getEffP(i))}</p>
        </div>
      </div>
      <div class="text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap ml-2 shrink-0">${fCur(getEffP(i) * i.qty)}</div>
    </div>
  `).join(''));
  
  if (cust.note) {
    setIn('payment-note-text', `"${cust.note}"`);
    show('payment-note-preview');
  } else hide('payment-note-preview');
  
  setH('dynamic-banks-container', appData.banks?.length ? appData.banks.map(b => `
    <div class="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Bank ${esc(b.bankName)}</p>
      <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">${esc(b.bankAccount)}</p>
      <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">a.n <span class="font-bold text-slate-700 dark:text-white">${esc(b.bankOwner)}</span></p>
    </div>
  `).join('') : '<div class="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center"><p class="text-xs text-rose-500 font-bold">Rekening belum diatur.</p></div>');
  
  const co = el('payment-option-cashier'), cc = el('payment-option-cod');
  if (co && cc) {
    if (cust.deliveryMethod === 'pickup') {
      show('payment-option-cashier'); hide('payment-option-cod');
      const cashierInput = document.querySelector('input[value="cashier"]');
      if ((document.querySelector('input[name="payment"]:checked') || {}).value === 'cod' && cashierInput) cashierInput.checked = !0;
    } else {
      hide('payment-option-cashier'); show('payment-option-cod');
      const transferInput = document.querySelector('input[value="transfer"]');
      if ((document.querySelector('input[name="payment"]:checked') || {}).value === 'cashier' && transferInput) transferInput.checked = !0;
    }
    togglePaymentDetails();
  }
  
  el('tnc-checkbox').checked = !1;
  toggleOrderButton();
};

window.toggleOrderButton = () => {
  el('tnc-checkbox').checked ? el('btn-process-order').classList.remove('btn-disabled') : el('btn-process-order').classList.add('btn-disabled');
};

window.processOrder = async () => {
  if (!el('tnc-checkbox').checked || isSaving) return;
  
  const lO = sL('freshmart_last_order'); 
  if (lO && (Date.now() - parseInt(lO)) < 60000) return showToast("Tunggu 1 menit untuk pesanan baru!");
  
  isSaving = !0;
  const sub = cart.reduce((s, i) => s + (parseFloat(getEffP(i)) || 0) * (parseInt(i.qty) || 0), 0);
  
  let sC = getShippingCost(cust.distance, cust.deliveryMethod);
  
  let pD = 0, sD = 0;
  if (vouch) {
    const v = parseFloat(vouch.value) || 0;
    if (vouch.type === 'product_percent') pD = sub * (v / 100);
    else if (vouch.type === 'shipping_percent') sD = sC * (v / 100);
    else if (vouch.type === 'shipping_flat') sD = v;
  }
  sD = Math.min(sD, sC); 
  pD = Math.min(pD, sub);
  const tot = Math.max(0, sub - pD + sC - sD);
  const m = (document.querySelector('input[name="payment"]:checked') || {}).value;
  if (!m) { isSaving = !1; return showToast('Pilih metode pembayaran!'); }
  const oI = 'ORD' + Date.now();
  
  const oD = {
    orderId: oI, 
    timestamp: firebase.firestore.FieldValue.serverTimestamp(), 
    dateString: new Date().toISOString(),
    customer: cust, 
    items: cart.map(i => ({ ...i, effectivePrice: getEffP(i) })),
    payment: { method: m, subtotal: sub, shippingCost: sC, productDiscount: pD, shippingDiscount: sD, grandTotal: tot },
    status: 'Baru'
  };
  
  sLoad('Proses Pesanan...');
  try {
    await db.collection("freshmart_orders").doc(oI).set(oD); 
    ssL('freshmart_last_order', Date.now().toString());
    
    let w = appData.store.wa || '';
    w = w.replace(/\D/g, '');
    if (w.startsWith('0')) w = '62' + w.substring(1);
    
    let x = `*Order ${appData.store.name}* 🛒\n`;
    x += `_ID: ${oI}_\n\n*👤 PEMESAN*\nNama: ${cust.name}\nAlamat: ${cust.address}\n`;
    if (cust.deliveryMethod === 'delivery' && cust.lat) x += `GPS: https://www.google.com/maps?q=${cust.lat},${cust.lng}\n`;
    if (cust.note) x += `\n*📝 CATATAN:*\n_${cust.note}_\n`;
    
    x += `\n*🛍️ DETAIL*\n`;
    cart.forEach(i => { x += `▫️ ${i.qty}${i.unit ? ' '+i.unit : ''} ${i.name}${i.variantName ? ` (${i.variantName})` : ''} - ${fCur(getEffP(i) * i.qty)}\n`; });
    x += `\nSubtotal: ${fCur(sub)}\n`;
    if (pD) x += `Diskon Produk: -${fCur(pD)}\n`;
    if (cust.deliveryMethod === 'delivery') x += `Ongkir Toko: ${fCur(sC)}\n`;
    if (sD) x += `Diskon Ongkir: -${fCur(sD)}\n`;
    x += `*TOTAL: ${fCur(tot)}*\nBayar: ${m.toUpperCase()}\n`;
    if (m === 'cod') x += `_*(Siapkan Uang Pas!)*_\n`;
    
    hLoad();
    try { window.open(`https://wa.me/${w}?text=${encodeURIComponent(x)}`, '_blank'); } catch(waErr) { console.warn('[FreshMart] WA popup diblokir browser:', waErr); }
    
    setTimeout(() => {
      cart = []; 
      setV('cust-name', ''); 
      setV('cust-address', ''); 
      setV('voucher-input', ''); 
      setV('cust-note', '');
      cust = { name: '', address: '', lat: null, lng: null, deliveryMethod: 'delivery', distance: 0, note: '' };
      vouch = null; 
      hide('voucher-msg-container'); 
      hide('location-status');
      if (el('btn-location')) show('btn-location');
      updCart(); 
      changeView('view-catalog'); 
      showToast("Pesanan Dibuat! 🎉"); 
      isSaving = !1;
    }, 2000);
  } catch (e) {
    console.error(e); 
    hLoad(); 
    showToast(e.code === 'resource-exhausted' ? "Quota Server Penuh!" : "Gagal proses"); 
    isSaving = !1;
  }
};
