// =============================================================================
// FRESHMART CART & WISHLIST MODULE
// =============================================================================

window.confirmAddProductToCart = () => {
  const v = cProd.variants?.[cVar];
  const vN = v?.name || null;
  const e = cart.find(i => i.id === cProd.id && i.variantName === vN);
  
  if (e) {
    e.qty += cQty;
  } else {
    cart.push({ id: cProd.id, name: cProd.name, variantName: vN, price: v?.price ?? cProd.price, img: v?.img || cProd.img, qty: cQty, unit: cProd.unit || '' });
  }
  updCart();
  closeProductModal();
  showToast("Masuk Keranjang");
};

window.confirmAddToWishlist = () => {
  const v = cProd.variants?.[cVar];
  const vN = v?.name || null;
  
  if (wishlist.find(i => i.id === cProd.id && i.variantName === vN)) {
    return showToast("Sudah di Favorit!");
  }
  wishlist.push({ id: cProd.id, name: cProd.name, variantName: vN, price: v?.price ?? cProd.price, img: v?.img || cProd.img, unit: cProd.unit || '' });
  ssL('freshmart_wishlist', JSON.stringify(wishlist));
  updWish();
  closeProductModal();
  showToast("Dimasukkan ke Favorit");
};

const updWish = () => {
  const b = el('wishlist-badge');
  if (b) {
    b.innerText = wishlist.length;
    b.classList.toggle('scale-0', !wishlist.length);
  }
};

const updCart = () => {
  ssL('freshmart_cart', JSON.stringify(cart));
  const q = cart.reduce((s, i) => s + i.qty, 0);
  setIn('cart-badge', q);
  const b = el('cart-badge');
  if (b) b.classList.toggle('scale-0', !q);
};

window.rmWish = i => { 
  wishlist.splice(i, 1); 
  ssL('freshmart_wishlist', JSON.stringify(wishlist)); 
  updWish(); 
  renderWish(); 
};

window.moveWish = i => {
  const it = wishlist[i];
  const e = cart.find(c => c.id === it.id && c.variantName === it.variantName);
  if (e) e.qty++; else cart.push({ ...it, qty: 1 });
  updCart();
  showToast("Ke Keranjang!");
};

window.clearWishlist = () => {
  showConfirm("Hapus Favorit", "Semua produk impianmu akan hilang. Yakin ingin menghapus?", () => {
    wishlist = [];
    ssL('freshmart_wishlist', JSON.stringify(wishlist));
    updWish(); 
    renderWish(); 
    showToast("Favorit dibersihkan");
  });
};

window.clearCart = () => {
  showConfirm("Kosongkan Keranjang", "Semua barang di keranjang belanja akan dihapus. Lanjutkan?", () => {
    cart = []; 
    updCart(); 
    renderCart(); 
    showToast("Keranjang dibersihkan");
  });
};

const renderWish = () => {
  if (!wishlist.length) {
    show('wishlist-empty-state'); 
    hide('btn-clear-wishlist'); 
    show('spacer-wishlist'); 
    setH('wishlist-items-container', '');
    return;
  }
  hide('wishlist-empty-state'); 
  show('btn-clear-wishlist'); 
  hide('spacer-wishlist');
  
  setH('wishlist-items-container', wishlist.map((i, x) => `
    <div class="card-modern p-4 flex gap-3 shadow-sm min-w-0 border border-slate-200 dark:border-slate-700">
      <img src="${esc(i.img)}" class="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/400?text=No+Image'"/>
      <div class="flex-1 flex flex-col min-w-0">
        <h4 class="text-sm font-semibold text-slate-800 dark:text-white mb-1 truncate">${esc(i.name)}</h4>
        ${i.variantName ? `<span class="mb-1.5 inline-flex"><span class="badge badge-xs badge-slate badge-normal-case">${esc(i.variantName)}</span></span>` : ''}
        <p class="text-emerald-600 dark:text-emerald-400 font-bold mb-2 text-sm drop-shadow-sm">${fCur(i.price)}</p>
        <div class="flex gap-2 mt-auto">
          <button onclick="moveWish(${x})" class="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 transition-all">Ke Keranjang</button>
          <button onclick="rmWish(${x})" class="w-8 h-8 shrink-0 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-90 transition-all"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>
      </div>
    </div>
  `).join(''));
};

const renderCart = () => {
  if (!cart.length) {
    show('cart-empty-state'); 
    hide('cart-bottom-bar'); 
    hide('btn-clear-cart'); 
    show('spacer-cart'); 
    setH('cart-items-container', '');
    hide('cart-free-shipping-container');
    const fsc = el('cart-free-shipping-container');
    if (fsc) fsc.innerHTML = '';
    return;
  }
  hide('cart-empty-state'); 
  show('cart-bottom-bar'); 
  show('btn-clear-cart'); 
  hide('spacer-cart');
  
  let s = 0;
  setH('cart-items-container', cart.map((i, x) => {
    let e = getEffP(i), w = e < i.price;
    s += e * i.qty;
    return `
    <div class="card-modern p-3.5 flex gap-3 relative overflow-hidden group shadow-sm min-w-0 border border-slate-200 dark:border-slate-700">
      ${w ? `<div class="badge badge-ribbon badge-solid-amber">GROSIR</div>` : ''}
      <img src="${esc(i.img)}" class="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0" onerror="this.onerror=null;this.src='https://placehold.co/400?text=No+Image'"/>
      <div class="flex-1 flex flex-col min-w-0">
        <h4 class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white pr-6 truncate">${esc(i.name)}</h4>
        ${i.variantName ? `<span class="mt-1 inline-flex items-center gap-1"><span class="badge badge-xs badge-slate badge-normal-case">${esc(i.variantName)}</span>${i.unit ? ` <span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold">· ${esc(i.unit)}</span>` : ''}</span>` : (i.unit ? `<span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">${esc(i.unit)}</span>` : '')}
        <div class="flex justify-between items-end mt-auto pt-2 min-w-0">
          <div>
            ${w ? `<p class="text-[9px] line-through text-slate-400 font-bold">${fCur(i.price)}</p>` : ''}
            <p class="text-emerald-600 dark:text-emerald-400 font-semibold text-sm drop-shadow-sm">${fCur(e)}</p>
          </div>
          <div class="flex flex-col items-end gap-1.5">
            <button onclick="rmCart(${x})" class="text-slate-400 hover:text-rose-500 absolute top-3 right-3 bg-white dark:bg-slate-800 w-6 h-6 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"><i class="fa-solid fa-xmark text-[10px]"></i></button>
            <div class="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-7 overflow-hidden shrink-0">
              <button onclick="updCQty(${x},-1)" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"><i class="fa-solid fa-minus text-[8px]"></i></button>
              <span class="w-6 flex items-center justify-center text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white">${i.qty}</span>
              <button onclick="updCQty(${x},1)" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"><i class="fa-solid fa-plus text-[8px]"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }).join(''));
  setIn('cart-subtotal', fCur(s));

  // Progress Bar Gratis Ongkir Otomatis
  const fsContainer = el('cart-free-shipping-container');
  if (fsContainer) {
    const store = appData.store || {};
    const fsEnabled = !!store.freeShippingEnabled;
    const fsMin = parseFloat(store.freeShippingMin || 0);

    if (fsEnabled && fsMin > 0) {
      show('cart-free-shipping-container');
      if (s >= fsMin) {
        fsContainer.innerHTML = `
          <div class="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-3 sm:p-3.5 shadow-sm transition-all">
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <i class="fa-solid fa-check"></i>
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-emerald-800 dark:text-emerald-300 truncate">
                    🎉 Selamat! Kamu Dapat Gratis Ongkir!
                  </p>
                  <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Belanja minimum ${fCur(fsMin)} telah tercapai
                  </p>
                </div>
              </div>
              <button type="button" onclick="openBuyerGuide('free_shipping')" class="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 flex items-center gap-1">
                <span>Syarat</span> <i class="fa-solid fa-chevron-right text-[7px]"></i>
              </button>
            </div>
            <div class="w-full bg-emerald-100 dark:bg-emerald-900/50 h-2 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style="width: 100%"></div>
            </div>
          </div>
        `;
      } else {
        const remaining = fsMin - s;
        const pct = Math.min(99, Math.max(5, Math.round((s / fsMin) * 100)));
        fsContainer.innerHTML = `
          <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-3.5 shadow-sm transition-all">
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xs shrink-0">
                  <i class="fa-solid fa-truck-fast"></i>
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-slate-800 dark:text-white truncate">
                    Tambah <span class="text-emerald-600 dark:text-emerald-400 font-black">${fCur(remaining)}</span> lagi
                  </p>
                  <p class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    Untuk klaim promo <b>Gratis Ongkir</b> otomatis!
                  </p>
                </div>
              </div>
              <button type="button" onclick="changeView('view-catalog')" class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shrink-0">
                + Belanja
              </button>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }
    } else {
      hide('cart-free-shipping-container');
      fsContainer.innerHTML = '';
    }
  }
};

window.updCQty = (i, c) => {
  let current = cart[i].qty;
  let isDecimal = !Number.isInteger(current) || current < 1;
  let step = (cart[i].unit && ['kg', 'gram', 'ons', 'meter', 'liter', 'm', 'l'].includes(cart[i].unit.toLowerCase()) && isDecimal) ? 0.25 : 1;
  let next = parseFloat((current + (c * step)).toFixed(2));
  if (next > 0) cart[i].qty = next; 
  else cart.splice(i, 1); 
  renderCart(); 
  updCart(); 
};

window.rmCart = i => { 
  cart.splice(i, 1); 
  renderCart(); 
  updCart(); 
};

window.validateCartToCheckout = () => {
  if (!cart.length) return;
  changeView('view-checkout');
};
