// =============================================================================
// FRESHMART CART & WISHLIST MODULE
// =============================================================================

window.confirmAddProductToCart = () => {
  if (!cProd) return;
  if (cProd.isActive === 'false' || cProd.isActive === false) {
    showToast("Produk ini sedang dinonaktifkan!");
    return;
  }
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

  if (wishlist.find(i => String(i.id) === String(cProd.id) && i.variantName === vN)) {
    return showToast("Sudah di Favorit!");
  }
  wishlist.push({ id: cProd.id, name: cProd.name, variantName: vN, price: v?.price ?? cProd.price, img: v?.img || cProd.img, unit: cProd.unit || '' });
  ssL('freshmart_wishlist', JSON.stringify(wishlist));
  updWish();
  closeProductModal();
  showToast("Dimasukkan ke Favorit");
};

// =============================================================================
// SINKRONISASI REALTIME HARGA MASTER UNTUK WISHLIST & KERANJANG
// =============================================================================

window.syncWishlistPrices = () => {
  if (!wishlist || !wishlist.length || !appData?.products || !appData.products.length) return false;
  let changed = false;

  wishlist.forEach(item => {
    const p = appData.products.find(x => String(x.id) === String(item.id));
    if (!p) return;

    // Sinkronisasi nama & satuan
    if (p.name && item.name !== p.name) {
      item.name = p.name;
      changed = true;
    }
    if (item.unit !== (p.unit || '')) {
      item.unit = p.unit || '';
      changed = true;
    }

    // Dapatkan harga terbaru sesuai varian atau master
    let latestPrice = Number(p.price) || 0;
    let latestImg = p.img || '';

    if (item.variantName && p.variants && p.variants.length > 0) {
      const v = p.variants.find(v => v.name === item.variantName);
      if (v) {
        if (v.price !== undefined && v.price !== null) latestPrice = Number(v.price);
        if (v.img) latestImg = v.img;
      }
    }

    if (latestImg && item.img !== fixD(latestImg)) {
      item.img = fixD(latestImg);
      changed = true;
    }

    if (Number(item.price) !== latestPrice) {
      item.price = latestPrice;
      changed = true;
    }
  });

  if (changed) {
    ssL('freshmart_wishlist', JSON.stringify(wishlist));
  }
  return changed;
};

window.syncCartPrices = () => {
  if (!cart || !cart.length || !appData?.products || !appData.products.length) return false;
  let changed = false;

  cart.forEach(item => {
    const p = appData.products.find(x => String(x.id) === String(item.id));
    if (!p) return;

    if (p.name && item.name !== p.name) {
      item.name = p.name;
      changed = true;
    }
    if (item.unit !== (p.unit || '')) {
      item.unit = p.unit || '';
      changed = true;
    }

    let latestPrice = Number(p.price) || 0;
    let latestImg = p.img || '';

    if (item.variantName && p.variants && p.variants.length > 0) {
      const v = p.variants.find(v => v.name === item.variantName);
      if (v) {
        if (v.price !== undefined && v.price !== null) latestPrice = Number(v.price);
        if (v.img) latestImg = v.img;
      }
    }

    if (latestImg && item.img !== fixD(latestImg)) {
      item.img = fixD(latestImg);
      changed = true;
    }

    if (Number(item.price) !== latestPrice) {
      item.price = latestPrice;
      changed = true;
    }
  });

  if (changed) {
    ssL('freshmart_cart', JSON.stringify(cart));
  }
  return changed;
};

const updWish = () => {
  const b = el('wishlist-badge');
  if (b) {
    b.innerText = wishlist.length;
    b.classList.toggle('scale-0', !wishlist.length);
  }
  if (typeof rCat === 'function' && el('view-catalog') && !el('view-catalog').classList.contains('hidden')) {
    rCat();
  }
};

const updCart = () => {
  ssL('freshmart_cart', JSON.stringify(cart));
  const q = cart.reduce((s, i) => s + i.qty, 0);
  setIn('cart-badge', q);
  const b = el('cart-badge');
  if (b) b.classList.toggle('scale-0', !q);
  if (typeof rCat === 'function' && el('view-catalog') && !el('view-catalog').classList.contains('hidden')) {
    rCat();
  }
};

// =============================================================================
// SEARCH / FILTER ITEM DI KERANJANG & FAVORIT
// =============================================================================

window.cartSearchQuery = '';
window.wishlistSearchQuery = '';

window.handleCartSearch = (val) => {
  clearTimeout(window._cartSearchTimer);
  const q = (val || '').trim();
  const clearBtn = el('btn-cart-search-clear');
  if (clearBtn) {
    if (q) {
      clearBtn.classList.remove('hidden');
      clearBtn.classList.add('flex');
    } else {
      clearBtn.classList.add('hidden');
      clearBtn.classList.remove('flex');
    }
  }
  window._cartSearchTimer = setTimeout(() => {
    window.cartSearchQuery = q.toLowerCase();
    renderCart();
  }, 150);
};

window.clearCartSearch = () => {
  const inp = el('cart-search-input');
  if (inp) inp.value = '';
  const clearBtn = el('btn-cart-search-clear');
  if (clearBtn) {
    clearBtn.classList.add('hidden');
    clearBtn.classList.remove('flex');
  }
  window.cartSearchQuery = '';
  renderCart();
};

window.handleWishlistSearch = (val) => {
  clearTimeout(window._wishSearchTimer);
  const q = (val || '').trim();
  const clearBtn = el('btn-wishlist-search-clear');
  if (clearBtn) {
    if (q) {
      clearBtn.classList.remove('hidden');
      clearBtn.classList.add('flex');
    } else {
      clearBtn.classList.add('hidden');
      clearBtn.classList.remove('flex');
    }
  }
  window._wishSearchTimer = setTimeout(() => {
    window.wishlistSearchQuery = q.toLowerCase();
    renderWish();
  }, 150);
};

window.clearWishlistSearch = () => {
  const inp = el('wishlist-search-input');
  if (inp) inp.value = '';
  const clearBtn = el('btn-wishlist-search-clear');
  if (clearBtn) {
    clearBtn.classList.add('hidden');
    clearBtn.classList.remove('flex');
  }
  window.wishlistSearchQuery = '';
  renderWish();
};

window.searchInCatalogFromCart = (keyword) => {
  changeView('view-catalog');
  const si = el('search-input');
  if (si) {
    si.value = keyword;
    if (typeof handleSearch === 'function') handleSearch(keyword);
  }
};

window.rmWish = i => {
  wishlist.splice(i, 1);
  ssL('freshmart_wishlist', JSON.stringify(wishlist));
  updWish();
  renderWish();
};

window.moveWish = i => {
  const it = wishlist[i];
  if (!it) return;
  const prod = (appData.products || []).find(p => String(p.id) === String(it.id));
  if (prod && (prod.isActive === 'false' || prod.isActive === false)) {
    showToast("Produk ini sedang dinonaktifkan!");
    return;
  }

  // Dapatkan harga live produk terkini
  let livePrice = it.price;
  if (prod) {
    livePrice = Number(prod.price) || it.price;
    if (it.variantName && prod.variants && prod.variants.length > 0) {
      const v = prod.variants.find(v => v.name === it.variantName);
      if (v && v.price !== undefined && v.price !== null) livePrice = Number(v.price);
    }
  }

  const e = cart.find(c => String(c.id) === String(it.id) && c.variantName === it.variantName);
  if (e) {
    e.qty++;
    e.price = livePrice;
  } else {
    cart.push({ ...it, price: livePrice, qty: 1 });
  }
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
  if (typeof syncWishlistPrices === 'function') syncWishlistPrices();
  if (!wishlist.length) {
    hide('wishlist-search-container');
    hide('wishlist-search-status');
    const inp = el('wishlist-search-input');
    if (inp) inp.value = '';
    window.wishlistSearchQuery = '';
    show('wishlist-empty-state');
    hide('btn-clear-wishlist');
    show('spacer-wishlist');
    setH('wishlist-items-container', '');
    return;
  }
  hide('wishlist-empty-state');
  show('wishlist-search-container');
  show('btn-clear-wishlist');
  hide('spacer-wishlist');

  const q = window.wishlistSearchQuery || '';
  const statusEl = el('wishlist-search-status');
  const statusText = el('wishlist-search-status-text');
  const filteredWish = q ? wishlist.filter(i => (i.name || '').toLowerCase().includes(q) || (i.variantName || '').toLowerCase().includes(q)) : wishlist;

  if (q) {
    show('wishlist-search-status');
    if (statusText) statusText.innerText = `Menampilkan ${filteredWish.length} dari ${wishlist.length} barang di favorit`;
  } else {
    hide('wishlist-search-status');
  }

  if (q && !filteredWish.length) {
    setH('wishlist-items-container', `
      <div class="card-modern p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div class="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500 mb-3 text-lg border border-rose-100 dark:border-rose-900/60">
          <i class="fa-solid fa-heart-crack"></i>
        </div>
        <h4 class="font-bold text-slate-800 dark:text-white text-xs sm:text-sm mb-1">Item Belum Ada di Favorit</h4>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">Barang "<span class="font-bold text-slate-800 dark:text-white">${esc(q)}</span>" belum disimpan ke daftar favorit Anda.</p>
        <div class="flex items-center justify-center gap-2">
          <button type="button" onclick="searchInCatalogFromCart('${esc(q)}')" class="btn-primary !py-2.5 !px-4 !text-xs flex items-center gap-1.5 shadow-sm active:scale-95"><i class="fa-solid fa-magnifying-glass text-[10px]"></i> Cari di Katalog Toko</button>
          <button type="button" onclick="clearWishlistSearch()" class="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all active:scale-95">Reset</button>
        </div>
      </div>
    `);
    return;
  }

  setH('wishlist-items-container', filteredWish.map((i) => {
    const x = wishlist.indexOf(i);
    const p = (appData.products || []).find(prod => String(prod.id) === String(i.id));
    const isOff = p && (p.isActive === 'false' || p.isActive === false);
    const isUnlimited = (appData.store?.stockMode === 'unlimited') || (p && (p.isUnlimited === true || p.isUnlimited === 'true'));
    const hasVars = p && p.variants && p.variants.length > 0;

    let isOutOfStock = false;
    if (p && !isUnlimited && !isOff) {
      if (i.variantName && hasVars) {
        const v = p.variants.find(v => v.name === i.variantName);
        if (v && v.stock !== undefined && v.stock !== null && v.stock !== '' && Number(v.stock) <= 0) {
          isOutOfStock = true;
        }
      } else {
        if (p.stock !== undefined && p.stock !== null && p.stock !== '' && Number(p.stock) <= 0) {
          isOutOfStock = true;
        }
      }
    }

    const curProdOrVar = (p && i.variantName && hasVars) ? p.variants.find(v => v.name === i.variantName) : p;
    const wishInc = (!isOff && curProdOrVar) ? window.getPriceIncreaseInfo(curProdOrVar) : null;

    return `
    <div class="card-modern p-4 flex gap-3 shadow-sm min-w-0 border ${isOff ? 'border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 opacity-80' : 'border-slate-200 dark:border-slate-700'}">
      <div class="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <img src="${esc(i.img)}" class="w-full h-full object-cover ${isOff ? 'grayscale opacity-60' : (isOutOfStock ? 'grayscale opacity-75' : '')}" onerror="this.onerror=null;this.src='https://placehold.co/400?text=No+Image'"/>
        ${isOff ? `<div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-1 text-center"><span class="text-[8px] font-black text-white bg-slate-800/90 px-1.5 py-0.5 rounded shadow">NONAKTIF</span></div>` : (isOutOfStock ? `<div class="absolute inset-0 bg-black/50 flex items-center justify-center p-1 text-center"><span class="text-[8px] font-black text-white bg-amber-600/90 px-1.5 py-0.5 rounded shadow">HABIS</span></div>` : '')}
      </div>
      <div class="flex-1 flex flex-col min-w-0">
        <h4 class="text-sm font-semibold ${isOff ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white'} mb-1 truncate">${esc(i.name)}</h4>
        <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
          ${i.variantName ? `<span class="badge badge-xs badge-slate badge-normal-case">${esc(i.variantName)}</span>` : ''}
          ${i.unit ? `<span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold">/ ${esc(i.unit)}</span>` : ''}
          ${isOff ? `<span class="badge badge-xs bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold">Tidak Tersedia</span>` : ''}
        </div>
        ${wishInc ? `
          <div class="flex items-center gap-1.5 mb-1 flex-wrap">
            <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 line-through leading-none">${fCur(wishInc.prev)}</span>
            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 leading-none shadow-2xs">
              <i class="fa-solid fa-arrow-trend-up text-[7px]"></i> Naik ${fCur(wishInc.diff)}
            </span>
          </div>
        ` : ''}
        <p class="${isOff ? 'text-slate-400 dark:text-slate-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'} mb-2 text-sm drop-shadow-sm">${fCur(i.price)}</p>
        <div class="flex gap-2 mt-auto">
          ${isOff ? `
            <button disabled class="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-[10px] font-bold py-2 rounded-lg cursor-not-allowed">Tidak Tersedia</button>
          ` : (isOutOfStock ? `
            <button disabled class="flex-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold py-2 rounded-lg cursor-not-allowed">Stok Habis</button>
          ` : `
            <button onclick="moveWish(${x})" class="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 transition-all">Ke Keranjang</button>
          `)}
          <button onclick="rmWish(${x})" class="w-8 h-8 shrink-0 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-90 transition-all" title="Hapus dari Favorit"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>
      </div>
    </div>
    `;
  }).join(''));
};

const renderCart = () => {
  if (typeof syncCartPrices === 'function') syncCartPrices();
  if (!cart.length) {
    hide('cart-search-container');
    hide('cart-search-status');
    const inp = el('cart-search-input');
    if (inp) inp.value = '';
    window.cartSearchQuery = '';
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
  show('cart-search-container');
  show('cart-bottom-bar');
  show('btn-clear-cart');
  hide('spacer-cart');

  // Subtotal dihitung dari seluruh item keranjang agar akurat
  let s = 0;
  cart.forEach(i => {
    s += getEffP(i) * i.qty;
  });
  setIn('cart-subtotal', fCur(s));

  const q = window.cartSearchQuery || '';
  const statusEl = el('cart-search-status');
  const statusText = el('cart-search-status-text');
  const filteredCart = q ? cart.filter(i => (i.name || '').toLowerCase().includes(q) || (i.variantName || '').toLowerCase().includes(q)) : cart;

  if (q) {
    show('cart-search-status');
    if (statusText) statusText.innerText = `Menampilkan ${filteredCart.length} dari ${cart.length} barang di keranjang`;
  } else {
    hide('cart-search-status');
  }

  if (q && !filteredCart.length) {
    setH('cart-items-container', `
      <div class="card-modern p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 mb-3 text-lg">
          <i class="fa-solid fa-cart-arrow-down"></i>
        </div>
        <h4 class="font-bold text-slate-800 dark:text-white text-xs sm:text-sm mb-1">Item Belum Ada di Keranjang</h4>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-4 font-medium leading-relaxed">Barang "<span class="font-bold text-slate-800 dark:text-white">${esc(q)}</span>" belum dimasukkan ke keranjang belanja Anda.</p>
        <div class="flex items-center justify-center gap-2">
          <button type="button" onclick="searchInCatalogFromCart('${esc(q)}')" class="btn-primary !py-2.5 !px-4 !text-xs flex items-center gap-1.5 shadow-sm active:scale-95"><i class="fa-solid fa-magnifying-glass text-[10px]"></i> Cari di Katalog Toko</button>
          <button type="button" onclick="clearCartSearch()" class="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all active:scale-95">Reset</button>
        </div>
      </div>
    `);
  } else {
    setH('cart-items-container', filteredCart.map((i) => {
      const x = cart.indexOf(i);
      let e = getEffP(i), w = e < i.price;
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
  }

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
  const inactiveItem = cart.find(c => {
    const p = (appData.products || []).find(x => x.id === c.id || String(x.id) === String(c.id));
    return p && (p.isActive === 'false' || p.isActive === false);
  });
  if (inactiveItem) {
    showToast(`Produk "${inactiveItem.name}" sedang dinonaktifkan. Silakan hapus item tersebut dari keranjang.`);
    return;
  }
  changeView('view-checkout');
};
