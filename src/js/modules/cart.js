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
  const curTarget = v || cProd;
  const e = cart.find(i => i.id === cProd.id && i.variantName === vN);

  if (e) {
    e.qty += cQty;
    if (curTarget?.previousPrice) {
      e.previousPrice = curTarget.previousPrice;
      e.priceIncreasedAt = curTarget.priceIncreasedAt || cProd.priceIncreasedAt || 0;
    }
  } else {
    cart.push({
      id: cProd.id,
      name: cProd.name,
      variantName: vN,
      price: v?.price ?? cProd.price,
      previousPrice: curTarget?.previousPrice || cProd.previousPrice || 0,
      priceIncreasedAt: curTarget?.priceIncreasedAt || cProd.priceIncreasedAt || 0,
      img: v?.img || cProd.img,
      qty: cQty,
      unit: cProd.unit || ''
    });
  }
  updCart();
  closeProductModal();
  showToast("Masuk Keranjang");
};

window.confirmAddToWishlist = () => {
  const v = cProd.variants?.[cVar];
  const vN = v?.name || null;
  const curTarget = v || cProd;

  if (wishlist.find(i => String(i.id) === String(cProd.id) && i.variantName === vN)) {
    return showToast("Sudah di Favorit!");
  }
  wishlist.push({
    id: cProd.id,
    name: cProd.name,
    variantName: vN,
    price: v?.price ?? cProd.price,
    previousPrice: curTarget?.previousPrice || cProd.previousPrice || 0,
    priceIncreasedAt: curTarget?.priceIncreasedAt || cProd.priceIncreasedAt || 0,
    img: v?.img || cProd.img,
    unit: cProd.unit || ''
  });
  ssL('freshmart_wishlist', JSON.stringify(wishlist));
  updWish();
  closeProductModal();
  showToast("Dimasukkan ke Favorit");
};

// =============================================================================
// SINKRONISASI REALTIME HARGA MASTER UNTUK WISHLIST & KERANJANG
// =============================================================================

window.getCartOrWishPriceChangeInfo = (item, prod) => {
  if (!item || typeof window.getPriceIncreaseInfo !== 'function') return null;
  const p = prod || (appData?.products || []).find(x => String(x.id) === String(item.id));
  if (p && typeof window.normalizeProductVariantPricing === 'function') window.normalizeProductVariantPricing(p);
  if (p && (p.isActive === 'false' || p.isActive === false)) return null;

  const hasVars = p && Array.isArray(p.variants) && p.variants.length > 0;
  const v = (p && item.variantName && hasVars)
    ? p.variants.find(vr => vr.name === item.variantName || (vr.name || '').trim().toLowerCase() === (item.variantName || '').trim().toLowerCase())
    : null;

  if (v) {
    return window.getPriceIncreaseInfo(v);
  } else if (p && !hasVars) {
    return window.getPriceIncreaseInfo(p);
  }

  return window.getPriceIncreaseInfo(item);
};

window.syncWishlistPrices = () => {
  if (!wishlist || !wishlist.length || !appData?.products || !appData.products.length) return false;
  let changed = false;

  wishlist.forEach(item => {
    const p = appData.products.find(x => String(x.id) === String(item.id));
    if (!p) return;
    if (typeof window.normalizeProductVariantPricing === 'function') window.normalizeProductVariantPricing(p);

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
    let masterPrevPrice = Number(p.previousPrice || 0);
    let masterIncAt = p.priceIncreasedAt || 0;

    if (item.variantName && p.variants && p.variants.length > 0) {
      const v = p.variants.find(v => v.name === item.variantName || (v.name || '').trim().toLowerCase() === (item.variantName || '').trim().toLowerCase());
      if (v) {
        if (v.price !== undefined && v.price !== null) latestPrice = Number(v.price);
        if (v.img) latestImg = v.img;
        if (v.previousPrice) {
          masterPrevPrice = Number(v.previousPrice);
          masterIncAt = v.priceIncreasedAt || masterIncAt;
        }
      }
    }

    if (latestImg && item.img !== fixD(latestImg)) {
      item.img = fixD(latestImg);
      changed = true;
    }

    const oldItemPrice = Number(item.price) || 0;
    if (oldItemPrice !== latestPrice) {
      if (oldItemPrice > 0) {
        item.previousPrice = (masterPrevPrice > 0 && masterPrevPrice !== latestPrice) ? masterPrevPrice : oldItemPrice;
        item.priceIncreasedAt = masterIncAt || Date.now();
      }
      item.price = latestPrice;
      changed = true;
    } else if (masterPrevPrice > 0 && masterPrevPrice !== latestPrice) {
      if (Number(item.previousPrice || 0) !== masterPrevPrice || item.priceIncreasedAt !== masterIncAt) {
        item.previousPrice = masterPrevPrice;
        item.priceIncreasedAt = masterIncAt;
        changed = true;
      }
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
    if (typeof window.normalizeProductVariantPricing === 'function') window.normalizeProductVariantPricing(p);

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
    let masterPrevPrice = Number(p.previousPrice || 0);
    let masterIncAt = p.priceIncreasedAt || 0;

    if (item.variantName && p.variants && p.variants.length > 0) {
      const v = p.variants.find(v => v.name === item.variantName || (v.name || '').trim().toLowerCase() === (item.variantName || '').trim().toLowerCase());
      if (v) {
        if (v.price !== undefined && v.price !== null) latestPrice = Number(v.price);
        if (v.img) latestImg = v.img;
        if (v.previousPrice) {
          masterPrevPrice = Number(v.previousPrice);
          masterIncAt = v.priceIncreasedAt || masterIncAt;
        }
      }
    }

    if (latestImg && item.img !== fixD(latestImg)) {
      item.img = fixD(latestImg);
      changed = true;
    }

    const oldItemPrice = Number(item.price) || 0;
    if (oldItemPrice !== latestPrice) {
      if (oldItemPrice > 0) {
        item.previousPrice = (masterPrevPrice > 0 && masterPrevPrice !== latestPrice) ? masterPrevPrice : oldItemPrice;
        item.priceIncreasedAt = masterIncAt || Date.now();
      }
      item.price = latestPrice;
      changed = true;
    } else if (masterPrevPrice > 0 && masterPrevPrice !== latestPrice) {
      if (Number(item.previousPrice || 0) !== masterPrevPrice || item.priceIncreasedAt !== masterIncAt) {
        item.previousPrice = masterPrevPrice;
        item.priceIncreasedAt = masterIncAt;
        changed = true;
      }
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

// =============================================================================
// ENGINE DRAG & DROP REORDER (TOUCH & MOUSE UNIFIED - WISHLIST & CART)
// =============================================================================
let _dragCtx = null;
let _dragEngineInitialized = false;

window.moveItemOrder = (type, fromIndex, toIndex) => {
  const arr = (type === 'wishlist') ? wishlist : cart;
  if (!arr || fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= arr.length || toIndex >= arr.length) return;

  const [movedItem] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, movedItem);

  if (type === 'wishlist') {
    ssL('freshmart_wishlist', JSON.stringify(wishlist));
    renderWish();
  } else {
    updCart();
    renderCart();
  }
};

window.stepItemOrder = (type, index, delta) => {
  const arr = (type === 'wishlist') ? wishlist : cart;
  if (!arr) return;
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= arr.length) return;
  window.moveItemOrder(type, index, targetIndex);
  if (navigator.vibrate) navigator.vibrate(20);
  showToast(delta < 0 ? 'Item digeser ke atas' : 'Item digeser ke bawah');
};

window.quickSortItems = (type, mode) => {
  const arr = (type === 'wishlist') ? wishlist : cart;
  if (!arr || arr.length <= 1) return;

  if (mode === 'cheap') {
    arr.sort((a, b) => {
      const pa = (type === 'cart' ? getEffP(a) : (a.price || 0));
      const pb = (type === 'cart' ? getEffP(b) : (b.price || 0));
      return pa - pb;
    });
    showToast('Diurutkan dari harga termurah');
  } else if (mode === 'expensive') {
    arr.sort((a, b) => {
      const pa = (type === 'cart' ? getEffP(a) : (a.price || 0));
      const pb = (type === 'cart' ? getEffP(b) : (b.price || 0));
      return pb - pa;
    });
    showToast('Diurutkan dari harga termahal');
  } else if (mode === 'az') {
    arr.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
    showToast('Diurutkan nama A sampai Z');
  }

  if (type === 'wishlist') {
    ssL('freshmart_wishlist', JSON.stringify(wishlist));
    renderWish();
  } else {
    updCart();
    renderCart();
  }
  if (navigator.vibrate) navigator.vibrate(25);
};

function _initDragAndDropEngine() {
  if (_dragEngineInitialized || typeof document === 'undefined') return;
  _dragEngineInitialized = true;

  document.addEventListener('pointerdown', e => {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;

    const dragType = handle.dataset.dragType;
    const fromIndex = parseInt(handle.dataset.dragIndex, 10);
    if (isNaN(fromIndex) || !dragType) return;

    const card = handle.closest(`[data-drag-item="${dragType}"]`);
    if (!card) return;

    const container = card.parentElement;
    if (!container) return;

    if (_dragCtx) _cleanupDrag();

    _dragCtx = {
      pointerId: e.pointerId,
      handle: handle,
      card: card,
      container: container,
      dragType: dragType,
      fromIndex: fromIndex,
      targetIndex: fromIndex,
      startY: e.clientY,
      currentY: e.clientY,
      isDragging: false,
      placeholder: null
    };

    try {
      handle.setPointerCapture(e.pointerId);
    } catch (_) {}

    e.preventDefault();
  }, { passive: false });

  document.addEventListener('pointermove', e => {
    if (!_dragCtx || e.pointerId !== _dragCtx.pointerId) return;

    const deltaY = e.clientY - _dragCtx.startY;

    if (!_dragCtx.isDragging) {
      if (Math.abs(deltaY) > 5) {
        _dragCtx.isDragging = true;
        _startDragging();
      } else {
        return;
      }
    }

    _dragCtx.currentY = e.clientY;
    _dragCtx.card.style.transform = `translate3d(0, ${deltaY}px, 0) scale(1.02)`;

    _updateDragTarget(e.clientY);
  });

  document.addEventListener('pointerup', e => {
    if (!_dragCtx || e.pointerId !== _dragCtx.pointerId) return;
    _finishDrag();
  });

  document.addEventListener('pointercancel', e => {
    if (!_dragCtx || e.pointerId !== _dragCtx.pointerId) return;
    _cancelDrag();
  });
}

function _startDragging() {
  const { card, container } = _dragCtx;

  const placeholder = document.createElement('div');
  placeholder.className = 'drag-placeholder w-full rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 my-2 transition-all duration-150 shrink-0';
  placeholder.style.height = `${card.offsetHeight}px`;

  container.insertBefore(placeholder, card);
  _dragCtx.placeholder = placeholder;

  card.classList.add(
    'relative', 'z-50', 'shadow-2xl', 'ring-2', 'ring-emerald-500', 
    'dark:ring-emerald-400', 'opacity-95', 'pointer-events-none'
  );
  card.style.willChange = 'transform';
  card.style.transition = 'none';

  if (navigator.vibrate) navigator.vibrate(25);
}

function _updateDragTarget(clientY) {
  const { container, card, placeholder, dragType } = _dragCtx;
  const cards = Array.from(container.querySelectorAll(`[data-drag-item="${dragType}"]`)).filter(c => c !== card);

  let newIndex = cards.length;
  for (let idx = 0; idx < cards.length; idx++) {
    const other = cards[idx];
    const rect = other.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;

    if (clientY < midPoint) {
      newIndex = idx;
      if (placeholder) {
        container.insertBefore(placeholder, other);
      }
      break;
    }
  }

  if (newIndex === cards.length && placeholder) {
    container.appendChild(placeholder);
  }

  _dragCtx.targetIndex = newIndex;

  // Auto-scroll saat drag mendekati tepi layar atas / bawah
  const scrollContainer = container.closest('.scroll-content') || window;
  const isWindow = scrollContainer === window;
  const scrollRect = isWindow ? { top: 0, bottom: window.innerHeight } : scrollContainer.getBoundingClientRect();
  const scrollSpeed = 8;

  if (clientY < scrollRect.top + 50) {
    if (isWindow) window.scrollBy(0, -scrollSpeed);
    else scrollContainer.scrollTop -= scrollSpeed;
  } else if (clientY > scrollRect.bottom - 50) {
    if (isWindow) window.scrollBy(0, scrollSpeed);
    else scrollContainer.scrollTop += scrollSpeed;
  }
}

function _finishDrag() {
  const { card, handle, pointerId, isDragging, dragType, fromIndex, targetIndex } = _dragCtx;

  try {
    handle.releasePointerCapture(pointerId);
  } catch (_) {}

  if (isDragging) {
    _cleanupDrag();

    if (targetIndex !== -1 && targetIndex !== fromIndex) {
      window.moveItemOrder(dragType, fromIndex, targetIndex);
      if (navigator.vibrate) navigator.vibrate(30);
      showToast('Urutan item berhasil diubah!');
    }
  } else {
    _cleanupDrag();
  }
}

function _cancelDrag() {
  if (_dragCtx) {
    try {
      _dragCtx.handle.releasePointerCapture(_dragCtx.pointerId);
    } catch (_) {}
    _cleanupDrag();
  }
}

function _cleanupDrag() {
  if (!_dragCtx) return;
  const { card, placeholder } = _dragCtx;

  if (placeholder && placeholder.parentNode) {
    placeholder.parentNode.removeChild(placeholder);
  }

  if (card) {
    card.classList.remove(
      'relative', 'z-50', 'shadow-2xl', 'ring-2', 'ring-emerald-500', 
      'dark:ring-emerald-400', 'opacity-95', 'pointer-events-none'
    );
    card.style.transform = '';
    card.style.willChange = '';
    card.style.transition = '';
  }

  _dragCtx = null;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initDragAndDropEngine);
  } else {
    _initDragAndDropEngine();
  }
}

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

  // Hitung ringkasan item yang naik / turun harga di daftar favorit ini
  let wishUpCount = 0;
  let wishDownCount = 0;
  filteredWish.forEach(i => {
    const p = (appData.products || []).find(prod => String(prod.id) === String(i.id));
    const inc = window.getCartOrWishPriceChangeInfo ? window.getCartOrWishPriceChangeInfo(i, p) : null;
    if (inc) {
      if (inc.isUp) wishUpCount++;
      else wishDownCount++;
    }
  });

  const wishPriceSummaryHtml = (wishUpCount > 0 || wishDownCount > 0) ? `
    <div class="flex items-center justify-between gap-2 px-3 py-2 mb-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-[11px]">
      <div class="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
        <i class="fa-solid fa-chart-line text-emerald-500"></i>
        <span>Info Perubahan Harga:</span>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap">
        ${wishUpCount > 0 ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60"><i class="fa-solid fa-arrow-trend-up text-[8px]"></i> ${wishUpCount} Naik</span>` : ''}
        ${wishDownCount > 0 ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60"><i class="fa-solid fa-arrow-trend-down text-[8px]"></i> ${wishDownCount} Turun</span>` : ''}
      </div>
    </div>
  ` : '';

  const sortToolbarHtml = (!q && wishlist.length > 1) ? `
    <div class="flex items-center justify-between text-xs px-1 mb-2.5 bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
      <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-[11px]">
        <i class="fa-solid fa-arrows-up-down text-emerald-500 text-xs"></i>
        <span>Atur Urutan</span>
        <span class="text-[10px] text-slate-400 font-normal hidden sm:inline">(Tahan ⠿ untuk geser)</span>
      </div>
      <div class="flex items-center gap-1">
        <button type="button" onclick="quickSortItems('wishlist', 'cheap')" class="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all active:scale-95 flex items-center gap-1 shadow-2xs" title="Urutkan dari harga termurah">
          <i class="fa-solid fa-arrow-down-1-9 text-emerald-500 text-[9px]"></i> <span>Termurah</span>
        </button>
        <button type="button" onclick="quickSortItems('wishlist', 'expensive')" class="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all active:scale-95 flex items-center gap-1 shadow-2xs" title="Urutkan dari harga termahal">
          <i class="fa-solid fa-arrow-down-9-1 text-blue-500 text-[9px]"></i> <span>Termahal</span>
        </button>
        <button type="button" onclick="quickSortItems('wishlist', 'az')" class="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all active:scale-95 flex items-center gap-1 shadow-2xs" title="Urutkan nama A sampai Z">
          <i class="fa-solid fa-arrow-down-a-z text-amber-500 text-[9px]"></i> <span>A-Z</span>
        </button>
      </div>
    </div>
  ` : '';

  setH('wishlist-items-container', wishPriceSummaryHtml + sortToolbarHtml + filteredWish.map((i) => {
    const x = wishlist.indexOf(i);
    const p = (appData.products || []).find(prod => String(prod.id) === String(i.id));
    const isOff = p && (p.isActive === 'false' || p.isActive === false);
    const isUnlimited = (appData.store?.stockMode === 'unlimited') || (p && (p.isUnlimited === true || p.isUnlimited === 'true'));
    const hasVars = p && p.variants && p.variants.length > 0;

    let isOutOfStock = false;
    if (p && !isUnlimited && !isOff) {
      if (i.variantName && hasVars) {
        const v = p.variants.find(v => v.name === i.variantName || (v.name || '').trim().toLowerCase() === (i.variantName || '').trim().toLowerCase());
        if (v && v.stock !== undefined && v.stock !== null && v.stock !== '' && Number(v.stock) <= 0) {
          isOutOfStock = true;
        }
      } else {
        if (p.stock !== undefined && p.stock !== null && p.stock !== '' && Number(p.stock) <= 0) {
          isOutOfStock = true;
        }
      }
    }

    const wishInc = (!isOff && typeof window.getCartOrWishPriceChangeInfo === 'function')
      ? window.getCartOrWishPriceChangeInfo(i, p)
      : null;

    return `
    <div class="card-modern p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3 shadow-sm min-w-0 border transition-transform duration-150 ${isOff ? 'border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 opacity-80' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}" data-drag-item="wishlist" data-drag-index="${x}">
      ${!q && wishlist.length > 1 ? `
      <!-- Grip Handle & Step Order Buttons -->
      <div class="flex flex-col items-center justify-center shrink-0 -ml-1 text-slate-300 dark:text-slate-600 select-none">
        <button type="button" onclick="event.stopPropagation(); stepItemOrder('wishlist', ${x}, -1)" class="w-6 h-5 flex items-center justify-center text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-75 transition-all ${x === 0 ? 'invisible pointer-events-none' : ''}" title="Geser ke Atas">
          <i class="fa-solid fa-chevron-up text-[9px]"></i>
        </button>
        <div class="drag-handle touch-none cursor-grab active:cursor-grabbing w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-drag-type="wishlist" data-drag-index="${x}" title="Tahan & geser untuk atur urutan">
          <i class="fa-solid fa-grip-vertical text-xs pointer-events-none"></i>
        </div>
        <button type="button" onclick="event.stopPropagation(); stepItemOrder('wishlist', ${x}, 1)" class="w-6 h-5 flex items-center justify-center text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-75 transition-all ${x === wishlist.length - 1 ? 'invisible pointer-events-none' : ''}" title="Geser ke Bawah">
          <i class="fa-solid fa-chevron-down text-[9px]"></i>
        </button>
      </div>
      ` : ''}

      <div onclick="openProductModal('${esc(i.id)}')" class="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer">
        <img src="${esc(i.img)}" class="w-full h-full object-cover ${isOff ? 'grayscale opacity-60' : (isOutOfStock ? 'grayscale opacity-75' : '')}" onerror="this.onerror=null;this.src='https://placehold.co/400?text=No+Image'"/>
        ${isOff ? `<div class="absolute inset-0 bg-slate-900/60 flex items-center justify-center p-1 text-center"><span class="text-[8px] font-black text-white bg-slate-800/90 px-1.5 py-0.5 rounded shadow">NONAKTIF</span></div>` : (isOutOfStock ? `<div class="absolute inset-0 bg-black/50 flex items-center justify-center p-1 text-center"><span class="text-[8px] font-black text-white bg-amber-600/90 px-1.5 py-0.5 rounded shadow">HABIS</span></div>` : '')}
      </div>
      <div class="flex-1 flex flex-col min-w-0 self-stretch justify-between">
        <div>
          <h4 onclick="openProductModal('${esc(i.id)}')" class="text-sm font-semibold ${isOff ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400'} mb-1 truncate cursor-pointer transition-colors">${esc(i.name)}</h4>
          <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
            ${i.variantName ? `<span class="badge badge-xs badge-slate badge-normal-case">${esc(i.variantName)}</span>` : ''}
            ${i.unit ? `<span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold">/ ${esc(i.unit)}</span>` : ''}
            ${isOff ? `<span class="badge badge-xs bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold">Tidak Tersedia</span>` : ''}
          </div>
          ${wishInc ? `
            <div class="flex items-center gap-1.5 mb-1 flex-wrap">
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 line-through leading-none">${fCur(wishInc.prev)}</span>
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black ${wishInc.badgeClass} leading-none shadow-2xs">
                <i class="fa-solid ${wishInc.icon} text-[8px]"></i> ${wishInc.isUp ? `Naik ${fCur(wishInc.diff)}${wishInc.pct > 0 ? ` (+${wishInc.pct}%)` : ''}` : `Turun ${fCur(wishInc.diff)}${wishInc.pct > 0 ? ` (-${wishInc.pct}%)` : ''}`}
              </span>
              ${wishInc.timeAgo ? `<span class="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">· diperbarui ${wishInc.timeAgo}</span>` : ''}
            </div>
          ` : ''}
          <p class="${isOff ? 'text-slate-400 dark:text-slate-500 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'} mb-1 text-sm drop-shadow-sm">${fCur(i.price)}</p>
        </div>
        <div class="flex gap-2 mt-auto pt-1 border-t border-slate-100 dark:border-slate-700/60">
          ${isOff ? `
            <button disabled class="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-[10px] font-bold py-2 rounded-lg cursor-not-allowed">Tidak Tersedia</button>
          ` : (isOutOfStock ? `
            <button disabled class="flex-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-bold py-2 rounded-lg cursor-not-allowed">Stok Habis</button>
          ` : `
            <button onclick="moveWish(${x})" class="flex-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold py-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <i class="fa-solid fa-cart-plus text-[10px]"></i> <span>Ke Keranjang</span>
            </button>
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
    // Hitung ringkasan item yang naik / turun harga di keranjang belanja ini
    let cartUpCount = 0;
    let cartDownCount = 0;
    filteredCart.forEach(i => {
      const p = (appData.products || []).find(prod => String(prod.id) === String(i.id));
      const inc = window.getCartOrWishPriceChangeInfo ? window.getCartOrWishPriceChangeInfo(i, p) : null;
      if (inc) {
        if (inc.isUp) cartUpCount++;
        else cartDownCount++;
      }
    });

    const cartPriceSummaryHtml = (cartUpCount > 0 || cartDownCount > 0) ? `
      <div class="flex items-center justify-between gap-2 px-3 py-2 mb-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-[11px]">
        <div class="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
          <i class="fa-solid fa-chart-line text-emerald-500"></i>
          <span>Info Perubahan Harga:</span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          ${cartUpCount > 0 ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60"><i class="fa-solid fa-arrow-trend-up text-[8px]"></i> ${cartUpCount} Naik</span>` : ''}
          ${cartDownCount > 0 ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60"><i class="fa-solid fa-arrow-trend-down text-[8px]"></i> ${cartDownCount} Turun</span>` : ''}
        </div>
      </div>
    ` : '';

    const sortToolbarHtml = (!q && cart.length > 1) ? `
      <div class="flex items-center justify-between text-xs px-1 mb-2.5 bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
        <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-[11px]">
          <i class="fa-solid fa-arrows-up-down text-emerald-500 text-xs"></i>
          <span>Atur Urutan Belanja</span>
          <span class="text-[10px] text-slate-400 font-normal hidden sm:inline">(Tahan ⠿ untuk geser)</span>
        </div>
        <div class="flex items-center gap-1">
          <button type="button" onclick="quickSortItems('cart', 'cheap')" class="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all active:scale-95 flex items-center gap-1 shadow-2xs" title="Urutkan dari harga termurah">
            <i class="fa-solid fa-arrow-down-1-9 text-emerald-500 text-[9px]"></i> <span>Termurah</span>
          </button>
          <button type="button" onclick="quickSortItems('cart', 'expensive')" class="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all active:scale-95 flex items-center gap-1 shadow-2xs" title="Urutkan dari harga termahal">
            <i class="fa-solid fa-arrow-down-9-1 text-blue-500 text-[9px]"></i> <span>Termahal</span>
          </button>
          <button type="button" onclick="quickSortItems('cart', 'az')" class="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-all active:scale-95 flex items-center gap-1 shadow-2xs" title="Urutkan nama A sampai Z">
            <i class="fa-solid fa-arrow-down-a-z text-amber-500 text-[9px]"></i> <span>A-Z</span>
          </button>
        </div>
      </div>
    ` : '';

    setH('cart-items-container', cartPriceSummaryHtml + sortToolbarHtml + filteredCart.map((i) => {
      const x = cart.indexOf(i);
      let e = getEffP(i), w = e < i.price;
      const p = (appData.products || []).find(prod => String(prod.id) === String(i.id));
      const isOff = p && (p.isActive === 'false' || p.isActive === false);
      const cartInc = (!isOff && typeof window.getCartOrWishPriceChangeInfo === 'function')
        ? window.getCartOrWishPriceChangeInfo(i, p)
        : null;

      return `
      <div class="card-modern p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 relative overflow-hidden group shadow-sm min-w-0 border transition-transform duration-150 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" data-drag-item="cart" data-drag-index="${x}">
        ${w ? `<div class="badge badge-ribbon badge-solid-amber">GROSIR</div>` : ''}

        ${!q && cart.length > 1 ? `
        <!-- Grip Handle & Step Order Buttons -->
        <div class="flex flex-col items-center justify-center shrink-0 -ml-1 text-slate-300 dark:text-slate-600 select-none">
          <button type="button" onclick="event.stopPropagation(); stepItemOrder('cart', ${x}, -1)" class="w-6 h-5 flex items-center justify-center text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-75 transition-all ${x === 0 ? 'invisible pointer-events-none' : ''}" title="Geser ke Atas">
            <i class="fa-solid fa-chevron-up text-[9px]"></i>
          </button>
          <div class="drag-handle touch-none cursor-grab active:cursor-grabbing w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" data-drag-type="cart" data-drag-index="${x}" title="Tahan & geser untuk atur urutan">
            <i class="fa-solid fa-grip-vertical text-xs pointer-events-none"></i>
          </div>
          <button type="button" onclick="event.stopPropagation(); stepItemOrder('cart', ${x}, 1)" class="w-6 h-5 flex items-center justify-center text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 active:scale-75 transition-all ${x === cart.length - 1 ? 'invisible pointer-events-none' : ''}" title="Geser ke Bawah">
            <i class="fa-solid fa-chevron-down text-[9px]"></i>
          </button>
        </div>
        ` : ''}

        <img onclick="openProductModal('${esc(i.id)}')" src="${esc(i.img)}" class="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer" onerror="this.onerror=null;this.src='https://placehold.co/400?text=No+Image'"/>
        <div class="flex-1 flex flex-col min-w-0 self-stretch justify-between">
          <div>
            <div class="flex items-start justify-between gap-1">
              <h4 onclick="openProductModal('${esc(i.id)}')" class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate cursor-pointer transition-colors">${esc(i.name)}</h4>
              <button onclick="rmCart(${x})" class="text-slate-400 hover:text-rose-500 bg-white dark:bg-slate-800 w-6 h-6 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all shrink-0 ml-1" title="Hapus item"><i class="fa-solid fa-xmark text-[10px]"></i></button>
            </div>
            ${i.variantName ? `<span class="mt-0.5 inline-flex items-center gap-1"><span class="badge badge-xs badge-slate badge-normal-case">${esc(i.variantName)}</span>${i.unit ? ` <span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold">· ${esc(i.unit)}</span>` : ''}</span>` : (i.unit ? `<span class="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 block">${esc(i.unit)}</span>` : '')}
            ${cartInc ? `
              <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 line-through leading-none">${fCur(cartInc.prev)}</span>
                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black ${cartInc.badgeClass} leading-none shadow-2xs">
                  <i class="fa-solid ${cartInc.icon} text-[8px]"></i> ${cartInc.isUp ? `Naik ${fCur(cartInc.diff)}${cartInc.pct > 0 ? ` (+${cartInc.pct}%)` : ''}` : `Turun ${fCur(cartInc.diff)}${cartInc.pct > 0 ? ` (-${cartInc.pct}%)` : ''}`}
                </span>
                ${cartInc.timeAgo ? `<span class="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">· diperbarui ${cartInc.timeAgo}</span>` : ''}
              </div>
            ` : ''}
          </div>
          <div class="flex justify-between items-end mt-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 min-w-0">
            <div>
              ${w ? `<p class="text-[9px] line-through text-slate-400 font-bold">${fCur(i.price)}</p>` : ''}
              <p class="text-emerald-600 dark:text-emerald-400 font-bold text-sm drop-shadow-sm">${fCur(e)}</p>
            </div>
            <div class="flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg h-7 overflow-hidden shrink-0">
              <button onclick="updCQty(${x},-1)" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"><i class="fa-solid fa-minus text-[8px]"></i></button>
              <span class="w-6 flex items-center justify-center text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white">${i.qty}</span>
              <button onclick="updCQty(${x},1)" class="w-7 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold"><i class="fa-solid fa-plus text-[8px]"></i></button>
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
