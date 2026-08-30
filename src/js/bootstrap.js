// =============================================================================
// FRESHMART BOOTSTRAP & ROUTING ORCHESTRATOR
// =============================================================================

window.changeView = (v, fH = !1) => {
  if (!fH) history.pushState({ view: v }, '', '');
  const current = [...document.querySelectorAll('.view-section')].find(e => !e.classList.contains('hidden'));
  const target = el(v);
  if (!target || (current && current.id === v)) return;

  // Guard double-tap: jika sedang animasi, langsung skip ke target tanpa transisi
  if (window._cvBusy) {
    document.querySelectorAll('.view-section').forEach(e => {
      e.classList.add('hidden'); e.classList.remove('flex');
      e.style.opacity = ''; e.style.transform = ''; e.style.transition = '';
    });
    target.classList.remove('hidden'); target.classList.add('flex');
    const r2 = { 'view-cart': renderCart, 'view-checkout': rChck, 'view-payment': rPay, 'view-wishlist': renderWish };
    if (r2[v]) r2[v]();
    const s2 = target.querySelector('.scroll-content');
    if (s2) s2.scrollTo(0, 0);
    window._cvBusy = false;
    return;
  }

  // Jalankan render target dulu sebelum animasi mulai
  const r = { 'view-cart': renderCart, 'view-checkout': rChck, 'view-payment': rPay, 'view-wishlist': renderWish };
  if (r[v]) r[v]();
  const s = target.querySelector('.scroll-content');
  if (s) s.scrollTo(0, 0);

  if (!current) {
    document.querySelectorAll('.view-section').forEach(e => { e.classList.add('hidden'); e.classList.remove('flex'); });
    target.classList.remove('hidden');
    target.classList.add('flex');
    return;
  }

  window._cvBusy = true;

  // Fade out view lama
  current.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
  current.style.opacity = '1';
  current.style.transform = 'translateY(0)';
  requestAnimationFrame(() => {
    current.style.opacity = '0';
    current.style.transform = 'translateY(6px)';
  });

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
    target.style.opacity = '0';
    target.style.transform = 'translateY(6px)';
    target.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        target.style.opacity = '1';
        target.style.transform = 'translateY(0)';
      });
    });
    
    // Bersihkan kolom pencarian saat kembali ke katalog
    if (v === 'view-catalog') {
      const si = el('search-input');
      if (si && si.value) { si.value = ''; sQ = ''; cPage = 1; rCat(); }
      const cb = el('btn-search-clear');
      if (cb) cb.classList.add('hidden');
    }
    setTimeout(() => {
      target.style.opacity = '';
      target.style.transform = '';
      target.style.transition = '';
      window._cvBusy = false;
    }, 200);
  }, 180);
};

// Global Browser Navigation History (PopState)
window.addEventListener('popstate', e => {
  if (oMods.length) {
    const m = oMods.pop();
    if (m === 'product') closeProductModal(!0);
    else closeAdminModal();
  } else {
    const st = e.state;
    const v = st?.view || 'view-catalog';
    if (v === 'view-admin' && !isAdm) {
      changeView('view-admin-login', !0);
      return;
    }
    changeView(v, !0);
    if (v === 'view-admin') {
      if (st?.tab) openAdminTab(st.tab, !0);
      else openAdminMenu();
    }
  }
});

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
  showToast('Berhasil diinstall di layar utama! 🎉');
  dismissPwaBanner();
  _pwaInstallEvent = null;
});

if (isPwaInstalled()) {
  sessionStorage.setItem('pwa_banner_dismissed', '1');
}

// Inisialisasi Aplikasi FreshMart
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
  });
} else {
  loadAppData();
}
