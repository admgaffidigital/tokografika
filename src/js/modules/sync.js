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
  // Listener Subcollection products
  if (!_priceWatcherUnsub) {
    _priceWatcherUnsub = db.collection('freshmart')
      .doc('cms_data')
      .collection('products')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'modified') {
            const updatedProduct = change.doc.data();
            const idx = appData.products.findIndex(p => p.id == updatedProduct.id);
            if (idx > -1) {
              appData.products[idx] = { ...appData.products[idx], ...updatedProduct };
            }
            _debouncedSync(updatedProduct);
          }
        });
      }, err => {
        console.warn('[PriceWatcher] Subcollection error, retry in 10s:', err);
        _priceWatcherUnsub = null;
        setTimeout(() => { if (!_priceWatcherUnsub) startPriceWatcher(); }, 10000);
      });
  }

  // Listener cms_data document (fallback / legacy)
  if (!_priceWatcherLegacyUnsub) {
    let _legacyPrevProducts = null;
    _priceWatcherLegacyUnsub = db.collection('freshmart')
      .doc('cms_data')
      .onSnapshot(snapshot => {
        const data = snapshot.data();
        if (!data || !data.products || !Array.isArray(data.products)) return;
        if (_legacyPrevProducts) {
          data.products.forEach(newProd => {
            const oldProd = _legacyPrevProducts.find(p => p.id == newProd.id);
            if (oldProd && (oldProd.price !== newProd.price ||
                JSON.stringify(oldProd.variants) !== JSON.stringify(newProd.variants))) {
              const idx = appData.products.findIndex(p => p.id == newProd.id);
              if (idx > -1) appData.products[idx] = { ...appData.products[idx], ...newProd };
              _debouncedSync(newProd);
            }
          });
        }
        _legacyPrevProducts = data.products;
      }, err => {
        console.warn('[PriceWatcher] cms_data listener error:', err);
        _priceWatcherLegacyUnsub = null;
      });
  }
};

window.stopPriceWatcher = () => {
  if (_priceWatcherUnsub) { _priceWatcherUnsub(); _priceWatcherUnsub = null; }
  if (_priceWatcherLegacyUnsub) { _priceWatcherLegacyUnsub(); _priceWatcherLegacyUnsub = null; }
  clearTimeout(_priceDebounceTimer);
};
