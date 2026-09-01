// =============================================================================
// FIREBASE & FIRESTORE CORE ENGINE (QUOTA-PROTECTED & HIGH-PERFORMANCE)
// =============================================================================
// Menggunakan arsitektur Cache-First, Smart Debouncing, Quota Protection, dan
// Lifecycle Management untuk mencegah kebocoran kuota/token limit Firestore.
// =============================================================================

// Inisialisasi Firebase & Firestore
firebase.initializeApp(fbC);
const db = firebase.firestore(); 
const auth = firebase.auth(); 

// Set Firestore log level untuk membungkam deprecation warning internal SDK
if (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.setLogLevel) {
  try { firebase.firestore.setLogLevel('error'); } catch (_) {}
}

// Konfigurasi Firestore dengan merge: true agar tidak memicu overriding host warning
try {
  db.settings({ ignoreUndefinedProperties: true, merge: true });
} catch (e) {}

// Aktifkan offline persistence multi-tab untuk menghemat pembacaan dokumen
try {
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
} catch (e) {}

// Helper timeout untuk Firestore agar tidak hang jika offline / koneksi lambat
const withTimeout = (promise, timeoutMs = 3500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore connection timeout")), timeoutMs))
  ]);
};

// ==========================================
// LICENSE VERIFICATION (CACHE FIRST & ZERO LEAK)
// ==========================================
window.verifyLicenseInDb = async (keyCode, expectedType = 'PRO') => {
  const codeToCheck = (keyCode || localStorage.getItem('freshmart_cache_' + expectedType) || appData?.licenseKey || '').trim().toUpperCase();
  if (!codeToCheck) return false;

  // 1. MASTER DEVELOPER KEYS (Langsung Aktif Instan & Permanen Tanpa Query Firestore)
  const masterKeys = ['TOKOGRAFIKA2026', 'GRAFIKA-PRO-2026', 'GRAFIKA-MASTER-PRO', 'PRO-DEV-2026', 'PRO'];
  if (masterKeys.includes(codeToCheck)) {
    localStorage.setItem('freshmart_cache_' + expectedType, codeToCheck);
    localStorage.setItem('freshmart_is_pro', 'true');
    if (appData) appData.licenseKey = codeToCheck;
    isPro = true;
    return true;
  }

  // 2. CHECK LOCAL CACHE (Hemat 100% Kuota jika sudah tervalidasi sebelumnya)
  const cachedCode = (localStorage.getItem('freshmart_cache_' + expectedType) || '').trim().toUpperCase();
  if (cachedCode === codeToCheck && localStorage.getItem('freshmart_is_pro') === 'true') {
    isPro = true;
    return true;
  }

  // 3. FIRESTORE DATABASE LOOKUP (Hanya dipanggil sekali saat aktivasi pertama)
  try {
    if (typeof db !== 'undefined' && db.collection) {
      const doc = await withTimeout(db.collection("freshmart_licenses").doc(codeToCheck).get(), 3500);
      const isValid = doc.exists && doc.data().isActive === true && doc.data().type === expectedType;
      
      if (isValid) {
        localStorage.setItem('freshmart_cache_' + expectedType, codeToCheck);
        localStorage.setItem('freshmart_is_pro', 'true');
        if (appData) appData.licenseKey = codeToCheck;
        isPro = true;
        return true;
      }
    }
  } catch (e) {
    console.warn("[FreshMart] Server lisensi offline/timeout. Menggunakan fallback lokal:", e);
  }

  // Fallback cadangan jika pernah aktif
  if (cachedCode === codeToCheck && cachedCode !== '') {
    isPro = true;
    return true;
  }

  return false;
};

// ==========================================
// LOAD APP DATA (HIGH PERFORMANCE & ZERO OVERFETCH)
// ==========================================
const loadAppData = async () => {
  if (document.documentElement.classList.contains('dark')) { 
    const icon = el('icon-theme'); 
    if (icon) icon.className = 'fa-solid fa-sun text-sm text-amber-500'; 
  }

  // 0. INSTANT PRO ACTIVATION: Cek apakah lisensi PRO sudah tersimpan
  const savedPro = (localStorage.getItem('freshmart_cache_PRO') || '').trim().toUpperCase();
  if (savedPro) {
    const masterKeys = ['TOKOGRAFIKA2026', 'GRAFIKA-PRO-2026', 'GRAFIKA-MASTER-PRO', 'PRO-DEV-2026', 'PRO'];
    if (masterKeys.includes(savedPro) || localStorage.getItem('freshmart_is_pro') === 'true') {
      isPro = true;
    }
  }

  // 1. FAST FIRST RENDER: Cek cache lokal (0 milidetik!)
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

  // 2. BACKGROUND / ASYNC SYNC: Ambil data terbaru dari Firestore (Hemat Kuota: 1 Dokumen Baca)
  try {
    const d = await withTimeout(db.collection("freshmart").doc("cms_data").get(), 4000);
    let localProducts = JSON.parse(sL('freshmart_products') || 'null');
    let localUpdate = parseInt(sL('freshmart_last_update') || '0');
    
    if (d.exists) {
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
    console.warn('[FreshMart] Firestore offline, using local cache fallback'); 
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
      if (window.applyBgStyle) applyBgStyle(appData.store?.bgStyle);
      if (window.updateStoreSeo) updateStoreSeo();
      
      try {
        let savedProKey = (appData.licenseKey || localStorage.getItem('freshmart_cache_PRO') || '').trim().toUpperCase();
        isPro = await verifyLicenseInDb(savedProKey, 'PRO');
      } catch (e) {}
      
      const pid = new URLSearchParams(window.location.search).get('p'); 
      if (pid) {
        const targetProd = (appData.products || []).find(x => String(x.id) === String(pid));
        if (targetProd) {
          setTimeout(() => {
            openProductModal(targetProd.id);
            try {
              const cleanUrl = window.location.origin + window.location.pathname + (window.location.hash || '');
              window.history.replaceState({ modal: 'product', id: targetProd.id }, '', cleanUrl);
            } catch (e) {}
          }, 250);
        }
      }
      
      buildAndInjectManifest();
      startPriceWatcher();
    } catch (err) {
      console.error('[FreshMart] Final render error:', err);
    } finally {
      hLoad();
    }
  }
};

// ==========================================
// SAVE APP (SMART DEBOUNCED & QUOTA-PROTECTED)
// ==========================================
let _saveAppDebounceTimer = null;

const saveApp = async (forceImmediate = false) => { 
  // 1. Simpan ke LocalStorage secara instan (0ms) untuk keandalan data
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
  } catch (e) {
    console.warn('[FreshMart] Local storage notice:', e);
  }

  // 2. Fungsi eksekusi sync ke Firestore
  const _executeSync = async () => {
    try {
      if (typeof db !== 'undefined' && db.collection) {
        const copyData = { ...appData }; 
        delete copyData.products; 
        await withTimeout(db.collection("freshmart").doc("cms_data").set(copyData), 5000); 
      }
    } catch (e) { 
      console.warn('[FreshMart] Firestore save notice:', e);
      showToast("Tersimpan Lokal"); 
    } 
  };

  if (forceImmediate) {
    clearTimeout(_saveAppDebounceTimer);
    return await _executeSync();
  }

  // 3. Debounce 250ms untuk mencegah write spamming ke Firestore
  return new Promise(resolve => {
    clearTimeout(_saveAppDebounceTimer);
    _saveAppDebounceTimer = setTimeout(async () => {
      await _executeSync();
      resolve();
    }, 250);
  });
};

// ==========================================
// TWO-WAY MANUAL CLOUD SYNC & REFRESH
// ==========================================
window.syncCloudDataNow = async () => {
  sLoad('Menyinkronkan Cloud...');
  try {
    // 1. Simpan data lokal saat ini ke Firestore
    await saveApp(true);

    // 2. Tarik update terbaru dari subkoleksi produk dan metadata
    if (typeof db !== 'undefined' && db.collection) {
      const pSnap = await withTimeout(db.collection("freshmart").doc("cms_data").collection("products").get(), 5000);
      if (pSnap && !pSnap.empty) {
        const cloudProds = pSnap.docs.map(doc => doc.data());
        if (cloudProds.length > 0) {
          appData.products = cloudProds.sort((a, b) => (b.id || 0) - (a.id || 0));
          ssL('freshmart_products', JSON.stringify(appData.products));
        }
      }
    }

    // 3. Update stempel waktu dan render ulang tampilan aktif
    const nowStr = new Date().toLocaleString('id-ID');
    const syncTimeEl = el('bs-cloud-last-sync-time');
    if (syncTimeEl) syncTimeEl.innerText = nowStr;
    const prodCountEl = el('bs-cloud-prod-count');
    if (prodCountEl) prodCountEl.innerText = `${(appData.products || []).length} Produk`;

    // Buat auto snapshot sebagai restore point setelah sync sukses
    if (window.createAutoRestorePoint) {
      window.createAutoRestorePoint('Sync Cloud Manual');
    }

    hLoad();
    showToast('Data berhasil disinkronkan ke Cloud! ☁️');
  } catch (e) {
    console.warn('[SyncCloud] Error:', e);
    hLoad();
    showToast('Tersimpan di Lokal (Koneksi Cloud Timeout)');
  }
};

window.refreshFromCloud = async () => {
  sLoad('Mengambil Data Cloud...');
  try {
    localStorage.removeItem('freshmart_last_update');
    localStorage.removeItem('freshmart_products');
    localStorage.removeItem('freshmart_cms_data');
    if (typeof loadAppData === 'function') {
      await loadAppData();
    }
    hLoad();
    showToast('Data toko diperbarui dari Cloud! 🔄');
    setTimeout(() => location.reload(), 600);
  } catch(e) {
    hLoad();
    showToast('Gagal memuat ulang data cloud!');
  }
};

// ==========================================
// SMART VISIBILITY & FIRESTORE QUOTA GUARD
// ==========================================
// Disconnect/Pause realtime listener saat tab browser di-minimize atau di latar belakang
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (window.stopPriceWatcher) window.stopPriceWatcher();
    } else {
      if (window.startPriceWatcher) window.startPriceWatcher();
    }
  });
}
