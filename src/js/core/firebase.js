// =============================================================================
// FRESHMART FIREBASE INITIALIZATION & DATA SYNC
// =============================================================================

firebase.initializeApp(fbC);
const db = firebase.firestore(); 
const auth = firebase.auth(); 

// Konfigurasi cache Firestore (dukung FirestoreSettings.cache modern jika tersedia, fallback gracefully)
try {
  if (firebase.firestore.persistentLocalCache && firebase.firestore.persistentMultipleTabManager) {
    db.settings({
      ignoreUndefinedProperties: true,
      localCache: firebase.firestore.persistentLocalCache({
        tabManager: firebase.firestore.persistentMultipleTabManager()
      })
    });
  } else {
    db.settings({ ignoreUndefinedProperties: true });
    db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  }
} catch (e) {
  try { db.settings({ ignoreUndefinedProperties: true }); } catch (_) {}
}

// Helper timeout untuk Firestore agar tidak hang jika offline / koneksi lambat
const withTimeout = (promise, timeoutMs = 3500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore connection timeout")), timeoutMs))
  ]);
};

window.verifyLicenseInDb = async (keyCode, expectedType) => {
  const codeToCheck = (keyCode || localStorage.getItem('freshmart_cache_' + expectedType) || '').trim().toUpperCase();
  if (!codeToCheck) return false;

  // 1. MASTER DEVELOPER KEYS (Langsung Aktif Instan)
  const masterKeys = ['TOKOGRAFIKA2026', 'GRAFIKA-PRO-2026', 'GRAFIKA-MASTER-PRO', 'PRO-DEV-2026'];
  if (masterKeys.includes(codeToCheck)) {
    localStorage.setItem('freshmart_cache_' + expectedType, codeToCheck);
    return true;
  }

  // 2. FIRESTORE DATABASE LICENSES LOOKUP (Untuk Klien SaaS)
  try {
    const doc = await withTimeout(db.collection("freshmart_licenses").doc(codeToCheck).get(), 3000);
    const isValid = doc.exists && doc.data().isActive === true && doc.data().type === expectedType;
    
    if (isValid) {
      localStorage.setItem('freshmart_cache_' + expectedType, codeToCheck);
    } else {
      localStorage.removeItem('freshmart_cache_' + expectedType);
    }
    return isValid;
  } catch (e) {
    console.warn("Gagal menghubungi server lisensi. Menggunakan cadangan lokal...", e);
    const cachedCode = localStorage.getItem('freshmart_cache_' + expectedType);
    return (cachedCode === codeToCheck) && (cachedCode !== null); 
  }
};

const loadAppData = async () => {
  console.log('[FreshMart] 1. loadAppData started');
  if (document.documentElement.classList.contains('dark')) { 
    const icon = el('icon-theme'); 
    if (icon) icon.className = 'fa-solid fa-sun text-sm text-amber-500'; 
  }

  // 1. FAST FIRST RENDER: Cek cache lokal
  const localCms = sL('freshmart_cms_data');
  const localProd = sL('freshmart_products');
  let hasLocalData = false;

  if (localCms) {
    try {
      const parsedCms = JSON.parse(localCms);
      appData = { ...defApp, ...parsedCms };
      if (localProd) appData.products = JSON.parse(localProd);
      hasLocalData = true;
      
      // Render katalog instan (0 milidetik!)
      rDyn();
      updWish();
      updCart();
      applyGlobalTheme();
    } catch(e) {
      console.warn('[FreshMart] Cache parse error:', e);
    }
  }

  if (!hasLocalData) {
    sLoad('Memuat Toko...');
  }

  // 2. BACKGROUND / ASYNC SYNC: Ambil data terbaru dari Firestore
  try {
    console.log('[FreshMart] 2. Fetching cms_data from Firestore...');
    const d = await withTimeout(db.collection("freshmart").doc("cms_data").get(), 4000);
    let localProducts = JSON.parse(sL('freshmart_products') || 'null');
    let localUpdate = parseInt(sL('freshmart_last_update') || '0');
    
    if (d.exists) {
      console.log('[FreshMart] 2a. cms_data document exists');
      const f = d.data(); 
      let oldLic = appData.licenseKey; 
      appData = { ...defApp, ...f }; 
      appData.licenseKey = f.licenseKey || oldLic || ""; 
      
      appData.store = { ...defApp.store, ...(f.store || {}) }; 
      if(!appData.store.social) appData.store.social = defApp.store.social;
      appData.auth = { ...defApp.auth, ...(f.auth || {}) }; 
      appData.payment = { ...defApp.payment, ...(f.payment || {}) };
      const serverUpdate = f.lastUpdate || 0;
      
      if (f.products && f.products.length > 0) {
        const batch = db.batch(); 
        f.products.forEach(p => { batch.set(db.collection("freshmart").doc("cms_data").collection("products").doc(p.id.toString()), p); });
        await batch.commit(); 
        await db.collection("freshmart").doc("cms_data").update({ products: firebase.firestore.FieldValue.delete(), lastUpdate: Date.now() });
        appData.products = f.products.sort((a, b) => (b.id || 0) - (a.id || 0)); 
        ssL('freshmart_products', JSON.stringify(appData.products));
      } else {
        if (localProducts && localUpdate >= serverUpdate) {
          appData.products = localProducts;
        } else { 
          const pSnap = await withTimeout(db.collection("freshmart").doc("cms_data").collection("products").get(), 4000); 
          appData.products = pSnap.docs.map(doc => doc.data()).sort((a, b) => (b.id || 0) - (a.id || 0)); 
          ssL('freshmart_products', JSON.stringify(appData.products)); 
          ssL('freshmart_last_update', serverUpdate.toString()); 
        }
      }
      // Update cache CMS
      const copyData = { ...appData };
      delete copyData.products;
      ssL('freshmart_cms_data', JSON.stringify(copyData));
    }
  } catch (e) { 
    console.warn('[FreshMart] 2c. Firestore offline or failed:', e.message); 
    if (!hasLocalData) {
      const l = JSON.parse(sL('freshmart_cms_data') || 'null'); 
      const lp = JSON.parse(sL('freshmart_products') || 'null');
      if (l) { 
        appData = { ...defApp, ...l }; 
        appData.store = { ...defApp.store, ...(l.store || {}) };
        if(!appData.store.social) appData.store.social = defApp.store.social;
      }
      if (lp) { appData.products = lp; } 
    }
  } finally {
    try {
      appData.products = appData.products || []; 
      appData.categories = appData.categories || [];
      appData.accounts = appData.accounts || []; 
      
      appData.products.forEach(p => { 
        if(p.img) p.img = fixD(p.img); 
        if (p.variants) p.variants.forEach(v => { if(v.img) v.img = fixD(v.img); }); 
      });
      
      if (appData.banners) appData.banners.forEach(b => { if(b.img) b.img = fixD(b.img); }); 
      if (appData.categories) appData.categories.forEach(c => { if(c.img) c.img = fixD(c.img); });
      
      if(appData.store.logo) appData.store.logo = fixD(appData.store.logo); 
      if(appData.store.allProductsIcon) appData.store.allProductsIcon = fixD(appData.store.allProductsIcon); 
      if(appData.payment.qrisUrl) appData.payment.qrisUrl = fixD(appData.payment.qrisUrl);
      
      cart.forEach(i => { if(i.img) i.img = fixD(i.img); }); 
      wishlist.forEach(i => { if(i.img) i.img = fixD(i.img); });
      
      updWish();
      updCart();
      sQ = '';
      const _si = el('search-input');
      if (_si) { _si.value = ''; el('btn-search-clear')?.classList.add('hidden'); }
      rDyn();
      applyGlobalTheme();
      
      try {
        let savedProKey = (appData.licenseKey || localStorage.getItem('freshmart_cache_PRO') || '').trim().toUpperCase();
        isPro = await verifyLicenseInDb(savedProKey, 'PRO');
      } catch (e) {}
      
      const pid = new URLSearchParams(window.location.search).get('p'); 
      if (pid && appData.products.find(x => x.id == parseInt(pid))) {
        setTimeout(() => openProductModal(parseInt(pid)), 600);
      }
      
      buildAndInjectManifest();
      startPriceWatcher();
    } catch (err) {
      console.error('[FreshMart] Final render error:', err);
    } finally {
      hLoad();
      console.log('[FreshMart] App initialization complete!');
    }
  }
};

const saveApp = async () => { 
  try { 
    appData.lastUpdate = Date.now(); 
    const copyData = { ...appData }; 
    delete copyData.products; 
    ssL('freshmart_cms_data', JSON.stringify(copyData)); 
    ssL('freshmart_last_update', appData.lastUpdate.toString()); 
    ssL('freshmart_products', JSON.stringify(appData.products)); 
    if (appData.store && appData.store.themeColor) {
      try { localStorage.setItem('freshmart_theme_color', appData.store.themeColor); } catch(e) {}
    }
    await db.collection("freshmart").doc("cms_data").set(copyData); 
  } catch (e) { 
    console.warn('[FreshMart] Firestore save notice:', e);
    showToast("Tersimpan Lokal"); 
  } 
};
