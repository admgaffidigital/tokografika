// =============================================================================
// FRESHMART REALTIME PRICE & INVENTORY SYNCHRONIZATION
// =============================================================================

const syncProductPrice = (updatedProduct) => {
  if (!updatedProduct || !updatedProduct.id) return;

  let cartChanged = false;
  let wishlistChanged = false;

  // --- Sinkronisasi KERANJANG ---
  cart.forEach(item => {
    if (item.id !== updatedProduct.id) return;

    if (item.unit !== (updatedProduct.unit || '')) {
      item.unit = updatedProduct.unit || '';
      cartChanged = true;
    }

    const newBasePrice = updatedProduct.price;
    let newVariantPrice = newBasePrice;
    if (item.variantName && updatedProduct.variants && updatedProduct.variants.length > 0) {
      const matchedVariant = updatedProduct.variants.find(v => v.name === item.variantName);
      if (matchedVariant) newVariantPrice = matchedVariant.price;
    }

    const oldPrice = item.price;
    item.price = newVariantPrice;

    if (item.variantName && updatedProduct.variants) {
      const mv = updatedProduct.variants.find(v => v.name === item.variantName);
      if (mv && mv.img) item.img = fixD(mv.img);
    } else if (updatedProduct.img) {
      item.img = fixD(updatedProduct.img);
    }

    if (oldPrice !== item.price) cartChanged = true;
  });

  // --- Sinkronisasi FAVORIT (WISHLIST) ---
  wishlist.forEach(item => {
    if (item.id !== updatedProduct.id) return;

    if (item.unit !== (updatedProduct.unit || '')) {
      item.unit = updatedProduct.unit || '';
      wishlistChanged = true;
    }

    const newBasePrice = updatedProduct.price;
    let newVariantPrice = newBasePrice;
    if (item.variantName && updatedProduct.variants && updatedProduct.variants.length > 0) {
      const matchedVariant = updatedProduct.variants.find(v => v.name === item.variantName);
      if (matchedVariant) newVariantPrice = matchedVariant.price;
    }

    const oldPrice = item.price;
    item.price = newVariantPrice;

    if (item.variantName && updatedProduct.variants) {
      const mv = updatedProduct.variants.find(v => v.name === item.variantName);
      if (mv && mv.img) item.img = fixD(mv.img);
    } else if (updatedProduct.img) {
      item.img = fixD(updatedProduct.img);
    }

    if (oldPrice !== item.price) wishlistChanged = true;
  });

  if (cartChanged) {
    ssL('freshmart_cart', JSON.stringify(cart));
    updCart();
    const cartView = document.getElementById('view-cart');
    if (cartView && cartView.classList.contains('flex')) renderCart();
    const payView = document.getElementById('view-payment');
    if (payView && payView.classList.contains('flex')) rPay();
  }

  if (wishlistChanged) {
    ssL('freshmart_wishlist', JSON.stringify(wishlist));
    updWish();
    const wishView = document.getElementById('view-wishlist');
    if (wishView && wishView.classList.contains('flex')) renderWish();
  }

  if (cProd && cProd.id === updatedProduct.id) {
    cProd = updatedProduct;
    rProdMod();
  }

  if (cartChanged || wishlistChanged) {
    showToast('💰 Harga produk telah diperbarui!');
  }
};

const _debouncedSync = (updatedProduct) => {
  clearTimeout(_priceDebounceTimer);
  _priceDebounceTimer = setTimeout(() => syncProductPrice(updatedProduct), 120);
};

window.startPriceWatcher = () => {
  // Hanya pasang 1 listener hemat kuota pada dokumen metadata cms_data (Bukan membaca semua subkoleksi!)
  if (!_priceWatcherLegacyUnsub && typeof db !== 'undefined' && db.collection) {
    let _lastSeenUpdate = parseInt(sL('freshmart_last_update') || '0');
    _priceWatcherLegacyUnsub = db.collection('freshmart')
      .doc('cms_data')
      .onSnapshot(snapshot => {
        if (!snapshot.exists) return;
        const data = snapshot.data();
        if (!data) return;

        const serverUpdate = data.lastUpdate || 0;
        // Jika ada pembaruan data dari admin di server
        if (serverUpdate && serverUpdate > _lastSeenUpdate) {
          _lastSeenUpdate = serverUpdate;
          ssL('freshmart_last_update', serverUpdate.toString());

          // Jika ada produk lama di cms_data
          if (data.products && Array.isArray(data.products)) {
            data.products.forEach(newProd => {
              const idx = appData.products.findIndex(p => p.id == newProd.id);
              if (idx > -1) appData.products[idx] = { ...appData.products[idx], ...newProd };
              _debouncedSync(newProd);
            });
          }
        }
      }, err => {
        console.warn('[PriceWatcher] Listener error:', err);
        _priceWatcherLegacyUnsub = null;
      });
  }
};

window.stopPriceWatcher = () => {
  if (_priceWatcherUnsub) { _priceWatcherUnsub(); _priceWatcherUnsub = null; }
  if (_priceWatcherLegacyUnsub) { _priceWatcherLegacyUnsub(); _priceWatcherLegacyUnsub = null; }
  clearTimeout(_priceDebounceTimer);
};
