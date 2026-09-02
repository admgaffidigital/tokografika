// =============================================================================
// FRESHMART BOOTSTRAP, UNIVERSAL BACK NAVIGATION & ROUTING ORCHESTRATOR
// =============================================================================

// Memory penyimpanan posisi scroll per-view agar tidak lompat-lompat saat di-back
window._viewScrollPos = window._viewScrollPos || {};
let _lastBackPressTime = 0;

// Daftar handler seluruh modal di website untuk intersep tombol Back HP
const ALL_MODAL_HANDLERS = [
  { id: 'restore-preview-modal', close: () => typeof closeRestorePreviewModal === 'function' && closeRestorePreviewModal() },
  { id: 'pricetag-picker-modal', close: () => typeof closePricetagPickerModal === 'function' && closePricetagPickerModal() },
  { id: 'pdf-preview-modal', close: () => typeof closePdfPreviewModal === 'function' && closePdfPreviewModal() },
  { id: 'receipt-preview-modal', close: () => typeof closeReceiptPreview === 'function' && closeReceiptPreview() },
  { id: 'pos-qty-modal', close: () => typeof closePosQtyModal === 'function' && closePosQtyModal() },
  { id: 'pos-variant-modal', close: () => typeof closePosVariantModal === 'function' && closePosVariantModal() },
  { id: 'pos-category-modal', close: () => typeof closePosCategoryModal === 'function' && closePosCategoryModal() },
  { id: 'pos-pending-modal', close: () => typeof closePosPendingModal === 'function' && closePosPendingModal() },
  { id: 'pos-payment-modal', close: () => typeof closePosPaymentModal === 'function' && closePosPaymentModal() },
  { id: 'pos-success-modal', close: () => typeof closePosSuccessModal === 'function' && closePosSuccessModal() },
  { id: 'pos-cart-drawer', close: () => typeof closePosCartDrawer === 'function' && closePosCartDrawer() },
  { id: 'pos-subscription-modal', close: () => typeof closeSubscriptionModal === 'function' && closeSubscriptionModal() },
  { id: 'purchase-detail-modal', close: () => typeof closePurchaseDetailModal === 'function' && closePurchaseDetailModal() },
  { id: 'purchase-payment-modal', close: () => typeof closePurchasePaymentModal === 'function' && closePurchasePaymentModal() },
  { id: 'purchase-modal', close: () => typeof closePurchaseModal === 'function' && closePurchaseModal() },
  { id: 'supplier-products-modal', close: () => typeof closeSupplierProductsModal === 'function' && closeSupplierProductsModal() },
  { id: 'supplier-modal', close: () => typeof closeSupplierModal === 'function' && closeSupplierModal() },
  { id: 'stock-opname-modal', close: () => typeof closeStockOpnameModal === 'function' && closeStockOpnameModal() },
  { id: 'order-detail-modal', close: () => typeof closeOrderDetailModal === 'function' && closeOrderDetailModal() },
  { id: 'quick-edit-modal', close: () => typeof closeQuickEditModal === 'function' && closeQuickEditModal() },
  { id: 'camera-scanner-modal', close: () => typeof closeCameraScanner === 'function' && closeCameraScanner() },
  { id: 'pricetag-modal', close: () => typeof closePricetagModal === 'function' && closePricetagModal() },
  { id: 'backup-sync-modal', close: () => typeof closeBackupSyncModal === 'function' && closeBackupSyncModal() },
  { id: 'cms-guide-modal', close: () => typeof closeCmsGuide === 'function' && closeCmsGuide() },
  { id: 'buyer-guide-modal', close: () => typeof closeBuyerGuide === 'function' && closeBuyerGuide() },
  { id: 'share-modal', close: () => typeof closeShareModal === 'function' && closeShareModal(true) },
  { id: 'product-modal', close: () => typeof closeProductModal === 'function' && closeProductModal(true) },
  { id: 'admin-modal', close: () => typeof closeAdminModal === 'function' && closeAdminModal() },
  { id: 'confirm-modal', close: () => typeof closeConfirmModal === 'function' && closeConfirmModal() },
];

function isElementVisible(elem) {
  if (!elem) return false;
  if (elem.classList.contains('hidden')) return false;
  if (elem.classList.contains('opacity-0') && elem.classList.contains('pointer-events-none')) return false;
  if (elem.style.display === 'none') return false;
  return elem.offsetWidth > 0 || elem.offsetHeight > 0 || elem.getClientRects().length > 0;
}

// Menutup modal teratas yang sedang aktif di layar
window.closeTopOpenModal = function() {
  for (const m of ALL_MODAL_HANDLERS) {
    const domEl = document.getElementById(m.id);
    if (domEl && isElementVisible(domEl)) {
      try {
        m.close();
      } catch (e) {
        domEl.classList.add('hidden', 'opacity-0', 'pointer-events-none');
      }
      return true;
    }
  }
  return false;
};

// Auto-track modal terbuka agar tombol Back HP otomatis menutup modal
let _modalObserverTimeout = null;
const modalObserver = new MutationObserver(() => {
  if (_modalObserverTimeout) return;
  _modalObserverTimeout = setTimeout(() => {
    _modalObserverTimeout = null;
    let anyOpen = false;
    for (const m of ALL_MODAL_HANDLERS) {
      const domEl = document.getElementById(m.id);
      if (domEl && isElementVisible(domEl)) {
        anyOpen = true;
        break;
      }
    }
    if (anyOpen && !history.state?.modal) {
      history.pushState({ modal: true }, '', '');
    }
  }, 40);
});

if (document.body) {
  modalObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    modalObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
  });
}


// Transisi antar view yang mulus dengan scroll memory
window.changeView = (v, fH = !1) => {
  const current = [...document.querySelectorAll('.view-section')].find(e => !e.classList.contains('hidden'));
  const target = el(v);
  if (!target || (current && current.id === v)) return;

  // Simpan posisi scroll view saat ini sebelum berpindah
  if (current) {
    const curSc = current.querySelector('.scroll-content') || current;
    window._viewScrollPos[current.id] = curSc.scrollTop || 0;
  }

  if (!fH) {
    history.pushState({ view: v }, '', '');
  }

  // Guard double-tap cepat
  if (window._cvBusy) {
    document.querySelectorAll('.view-section').forEach(e => {
      e.classList.add('hidden'); e.classList.remove('flex');
      e.style.opacity = ''; e.style.transform = ''; e.style.transition = '';
    });
    target.classList.remove('hidden'); target.classList.add('flex');
    const r2 = { 'view-cart': renderCart, 'view-checkout': rChck, 'view-payment': rPay, 'view-wishlist': renderWish };
    if (r2[v]) r2[v]();
    
    const s2 = target.querySelector('.scroll-content') || target;
    if (s2) s2.scrollTop = fH ? (window._viewScrollPos[v] || 0) : 0;
    window._cvBusy = false;
    return;
  }

  // Jalankan render target terlebih dahulu
  const r = { 'view-cart': renderCart, 'view-checkout': rChck, 'view-payment': rPay, 'view-wishlist': renderWish };
  if (r[v]) r[v]();

  if (!current) {
    document.querySelectorAll('.view-section').forEach(e => { e.classList.add('hidden'); e.classList.remove('flex'); });
    target.classList.remove('hidden');
    target.classList.add('flex');
    const s = target.querySelector('.scroll-content') || target;
    if (s) s.scrollTop = fH ? (window._viewScrollPos[v] || 0) : 0;
    return;
  }

  window._cvBusy = true;

  // Fade out halus view lama (80ms agar sangat responsif dan tidak lompat)
  current.style.transition = 'opacity 0.09s ease';
  current.style.opacity = '0';

  setTimeout(() => {
    document.querySelectorAll('.view-section').forEach(e => {
      e.classList.add('hidden');
      e.classList.remove('flex');
      e.style.opacity = '';
      e.style.transform = '';
      e.style.transition = '';
    });
    target.classList.remove('hidden');
    target.classList.add('flex');
    
    // Pulihkan posisi scroll jika berasal dari back history, atau reset ke 0 jika navigasi baru
    const s = target.querySelector('.scroll-content') || target;
    if (s) {
      s.scrollTop = fH ? (window._viewScrollPos[v] || 0) : 0;
    }

    target.style.opacity = '0';
    target.style.transition = 'opacity 0.09s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.style.opacity = '1';
      });
    });
    
    setTimeout(() => {
      target.style.opacity = '';
      target.style.transform = '';
      target.style.transition = '';
      window._cvBusy = false;
    }, 100);
  }, 90);
};

// Global Browser / Mobile Hardware Back Navigation History (PopState)
window.addEventListener('popstate', e => {
  // 1. Jika ada modal yang terbuka di layar, tutup modal tersebut terlebih dahulu secara halus
  if (window.closeTopOpenModal()) {
    return;
  }

  const st = e.state;

  // 2. Jika sedang di dalam sub-menu admin tab (pesanan, produk, dll), kembali ke menu dashboard admin
  const curAdminView = el('view-admin');
  if (curAdminView && !curAdminView.classList.contains('hidden')) {
    const contentSubView = el('admin-content-view');
    if (contentSubView && !contentSubView.classList.contains('hidden')) {
      if (st?.tab) {
        openAdminTab(st.tab, true);
      } else {
        openAdminMenu();
      }
      return;
    }
  }

  // 3. View Routing Normal
  const targetView = st?.view || 'view-catalog';
  const curActive = [...document.querySelectorAll('.view-section')].find(el => !el.classList.contains('hidden'));

  // Jika sudah di view-catalog (beranda) dan menekan tombol back
  if (curActive && curActive.id === 'view-catalog' && targetView === 'view-catalog') {
    const now = Date.now();
    if (now - _lastBackPressTime < 2000) {
      return; // Biarkan browser keluar jika double back dalam 2 detik
    }
    _lastBackPressTime = now;
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      showToast('Tekan sekali lagi untuk keluar');
      history.pushState({ view: 'view-catalog', root: true }, '', '');
    }
    return;
  }

  if (targetView === 'view-admin' && !isAdm) {
    changeView('view-admin-login', true);
    return;
  }

  changeView(targetView, true);

  if (targetView === 'view-admin') {
    if (st?.tab) openAdminTab(st.tab, true);
    else openAdminMenu();
  }
});

// Set state awal saat aplikasi pertama kali dibuka agar back history rapi
if (!history.state) {
  history.replaceState({ view: 'view-catalog', root: true }, '', '');
}

// Global Unhandled Rejection Error Handler
window.addEventListener('unhandledrejection', e => {
  console.error('[FreshMart] Unhandled promise rejection:', e.reason);
  if (el('global-loader') && !el('global-loader').classList.contains('hidden')) {
    hLoad();
    showToast('Terjadi kesalahan. Silakan coba lagi.');
  }
});

// PWA Install Event Listeners
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _pwaInstallEvent = e;
  if (!sessionStorage.getItem('pwa_banner_dismissed')) {
    setTimeout(showPwaBanner, 2500);
  }
});

window.addEventListener('appinstalled', () => {
  showToast('Berhasil diinstall di layar utama!');
  dismissPwaBanner();
  _pwaInstallEvent = null;
});

if (isPwaInstalled()) {
  sessionStorage.setItem('pwa_banner_dismissed', '1');
}

// Register PWA Service Worker untuk caching instan dan performa super cepat
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      reg.update().catch(() => {});
    }).catch(() => {});
  });
}

// Inisialisasi Aplikasi FreshMart
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
  });
} else {
  loadAppData();
}

