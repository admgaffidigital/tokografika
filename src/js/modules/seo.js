// =============================================================================
// FRESHMART SEO ENGINE (SEARCH ENGINE OPTIMIZATION & RICH SCHEMA JSON-LD)
// =============================================================================

/**
 * Update dynamic SEO meta tags, OpenGraph, Twitter Cards, and canonical links.
 * Digunakan saat store load, routing, filter kategori, atau saat melihat produk.
 */
window.updateStoreSeo = (customTitle, customDesc, customImg, productObj) => {
  try {
    const storeName = appData?.store?.name || 'Toko Grafika';
    const storeSlogan = appData?.store?.slogan || 'Ritel & Grosir Online';
    const storeLogo = appData?.store?.logo || '';
    const origin = window.location.origin || '';
    const currentUrl = window.location.href.split('#')[0];

    // 1. Page Title & Meta Description
    let title = customTitle || `${storeName} - ${storeSlogan}`;
    if (!title.toLowerCase().includes(storeName.toLowerCase())) {
      title = `${title} | ${storeName}`;
    }
    document.title = title;

    let desc = customDesc || storeSlogan || `Belanja aneka kebutuhan harian, eceran dan grosir harga termurah di ${storeName}.`;
    if (desc.length > 160) desc = desc.substring(0, 157) + '...';

    const elDesc = document.getElementById('seo-meta-description');
    if (elDesc) elDesc.content = desc;

    const elAuth = document.getElementById('seo-meta-author');
    if (elAuth) elAuth.content = storeName;

    const elCanon = document.getElementById('seo-canonical');
    if (elCanon) elCanon.href = currentUrl;

    // 2. OpenGraph Meta Tags (WhatsApp, Facebook, Telegram)
    const ogTitle = document.getElementById('seo-og-title');
    if (ogTitle) ogTitle.content = title;

    const ogDesc = document.getElementById('seo-og-description');
    if (ogDesc) ogDesc.content = desc;

    const ogSite = document.getElementById('seo-og-site-name');
    if (ogSite) ogSite.content = storeName;

    const ogUrl = document.getElementById('seo-og-url');
    if (ogUrl) ogUrl.content = currentUrl;

    const ogType = document.getElementById('seo-og-type');
    if (ogType) ogType.content = productObj ? 'product' : 'website';

    const shareImg = customImg || storeLogo || (appData?.banners?.[0]?.img) || '';
    const ogImg = document.getElementById('seo-og-image');
    if (ogImg) ogImg.content = shareImg;

    // 3. Twitter Card
    const twTitle = document.getElementById('seo-tw-title');
    if (twTitle) twTitle.content = title;

    const twDesc = document.getElementById('seo-tw-description');
    if (twDesc) twDesc.content = desc;

    const twImg = document.getElementById('seo-tw-image');
    if (twImg) twImg.content = shareImg;

    // 4. Inject / Update Schema.org JSON-LD Store Structured Data
    injectStoreSchema(storeName, storeSlogan, storeLogo, currentUrl);

    // 5. Inject / Update Schema.org Product Structured Data if viewing product
    if (productObj) {
      injectProductSchema(productObj, storeName, currentUrl);
    } else {
      const prodScript = document.getElementById('schema-org-product');
      if (prodScript) prodScript.textContent = '';
    }
  } catch (err) {
    console.warn('[SEO] Failed to update meta tags:', err);
  }
};

/**
 * Injeksi Schema.org Store / LocalBusiness ke Google Search Engine
 */
const injectStoreSchema = (storeName, storeSlogan, storeLogo, currentUrl) => {
  const scriptEl = document.getElementById('schema-org-store');
  if (!scriptEl) return;

  const addressText = appData?.store?.address || '';
  const phoneText = appData?.store?.wa ? `+62${appData.store.wa.replace(/^0/, '')}` : '';
  const lat = parseFloat(appData?.store?.lat || 0);
  const lng = parseFloat(appData?.store?.lng || 0);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${currentUrl}#store`,
    'name': storeName,
    'description': storeSlogan,
    'url': currentUrl,
    'logo': storeLogo || undefined,
    'image': storeLogo || undefined,
    'telephone': phoneText || undefined,
    'priceRange': 'Rp',
    'currenciesAccepted': 'IDR',
    'paymentAccepted': 'Cash, QRIS, Bank Transfer, COD',
    'address': addressText ? {
      '@type': 'PostalAddress',
      'streetAddress': addressText,
      'addressCountry': 'ID'
    } : undefined,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${currentUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  if (lat && lng) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      'latitude': lat,
      'longitude': lng
    };
    schema.hasMap = `https://www.google.com/maps?q=${lat},${lng}`;
  }

  scriptEl.textContent = JSON.stringify(schema, null, 2);
};

/**
 * Injeksi Schema.org Product Structured Data untuk Google Rich Snippets
 */
const injectProductSchema = (p, storeName, currentUrl) => {
  const scriptEl = document.getElementById('schema-org-product');
  if (!scriptEl || !p) return;

  const productPrice = parseFloat(p.price || 0);
  const isAvailable = (p.stock !== 0 && p.stock !== '0' && p.isActive !== false && p.isActive !== 'false');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${currentUrl}#product-${p.id}`,
    'name': p.name || p.title || 'Produk',
    'image': p.img ? [p.img] : undefined,
    'description': p.desc || p.name || p.title || 'Produk berkualitas harga terbaik',
    'sku': p.sku || `PROD-${p.id}`,
    'category': p.category || 'General',
    'offers': {
      '@type': 'Offer',
      'url': `${currentUrl}?p=${p.id}`,
      'priceCurrency': 'IDR',
      'price': productPrice,
      'priceValidUntil': '2030-12-31',
      'itemCondition': 'https://schema.org/NewCondition',
      'availability': isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      'seller': {
        '@type': 'Organization',
        'name': storeName
      }
    }
  };

  scriptEl.textContent = JSON.stringify(schema, null, 2);
};
