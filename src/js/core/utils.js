// =============================================================================
// FRESHMART UTILITIES & HELPERS
// =============================================================================

const el = id => document.getElementById(id);
const show = id => { const e = el(id); if (e) { e.classList.remove('hidden'); e.style.display = ''; } };
const hide = id => { const e = el(id); if (e) { e.classList.add('hidden'); e.style.display = 'none'; } };
const toggleCls = (id, c, f) => { const e = el(id); if (e) e.classList.toggle(c, f); };
const setIn = (id, t) => { const e = el(id); if (e) e.innerText = t; };

const setH = (id, h) => { 
  const e = el(id); 
  if (e) {
    let tc = appData?.store?.themeColor || 'emerald';
    // Replace warna emerald ke warna tema pilihan secara otomatis saat render
    e.innerHTML = tc !== 'emerald' ? h.replace(/(bg-|text-|border-|ring-|from-|to-|shadow-|border-[tblr]-)emerald/g, '$1' + tc) : h;
  }
};

// Peta warna tema ke nilai hex & dark variant
const THEME_COLORS = {
  emerald: { p:'#059669', dark:'#047857', bg:'#ecfdf5', r:5, g:150, b:105 },
  teal: { p:'#0d9488', dark:'#0f766e', bg:'#f0fdfa', r:13, g:148, b:136 },
  cyan: { p:'#0891b2', dark:'#0e7490', bg:'#ecfeff', r:8, g:145, b:178 },
  sky: { p:'#0284c7', dark:'#0369a1', bg:'#f0f9ff', r:2, g:132, b:199 },
  blue: { p:'#2563eb', dark:'#1d4ed8', bg:'#eff6ff', r:37, g:99, b:235 },
  indigo: { p:'#4f46e5', dark:'#4338ca', bg:'#eef2ff', r:79, g:70, b:229 },
  violet: { p:'#7c3aed', dark:'#6d28d9', bg:'#f5f3ff', r:124, g:58, b:237 },
  purple: { p:'#9333ea', dark:'#7e22ce', bg:'#faf5ff', r:147, g:51, b:234 },
  pink: { p:'#db2777', dark:'#be185d', bg:'#fdf2f8', r:219, g:39, b:119 },
  rose: { p:'#e11d48', dark:'#be123c', bg:'#fff1f2', r:225, g:29, b:72 },
  red: { p:'#dc2626', dark:'#b91c1c', bg:'#fef2f2', r:220, g:38, b:38 },
  orange: { p:'#ea580c', dark:'#c2410c', bg:'#fff7ed', r:234, g:88, b:12 },
  amber: { p:'#d97706', dark:'#b45309', bg:'#fffbeb', r:217, g:119, b:6 },
  lime: { p:'#65a30d', dark:'#4d7c0f', bg:'#f7fee7', r:101, g:163, b:13 },
};

// Update CSS variables & meta tag setiap kali tema berubah
window.updateThemeVars = () => {
  let tc = appData?.store?.themeColor;
  if (!tc) {
    try {
      tc = localStorage.getItem('freshmart_theme_color');
      if (!tc) {
        const cms = JSON.parse(localStorage.getItem('freshmart_cms_data') || '{}');
        if (cms?.store?.themeColor) tc = cms.store.themeColor;
      }
    } catch(e) {}
  }
  tc = tc || 'emerald';
  const t = THEME_COLORS[tc] || THEME_COLORS.emerald;
  const root = document.documentElement;
  root.style.setProperty('--clr-p', t.p);
  root.style.setProperty('--clr-p-dark', t.dark);
  root.style.setProperty('--clr-p-bg', t.bg);
  root.style.setProperty('--clr-p-10', `rgba(${t.r},${t.g},${t.b},0.10)`);
  root.style.setProperty('--clr-p-25', `rgba(${t.r},${t.g},${t.b},0.25)`);
  root.style.setProperty('--clr-p-35', `rgba(${t.r},${t.g},${t.b},0.35)`);
  
  // Sinkronkan SEMUA meta theme-color untuk PWA toolbar, Android Chrome, & iOS status bar
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => {
    m.content = t.p;
  });
  const metaTheme = document.getElementById('pwa-theme-color');
  if (metaTheme) metaTheme.content = t.p;

  // Sinkronkan elemen PWA install banner jika sedang tampil
  const pwaInner = document.getElementById('pwa-banner-inner');
  if (pwaInner) {
    pwaInner.style.backgroundColor = t.p;
    pwaInner.style.borderColor = t.dark;
  }
  const pwaBtn = document.getElementById('pwa-install-btn');
  if (pwaBtn) {
    pwaBtn.style.color = t.p;
  }
};

window.applyGlobalTheme = () => {
  const tc = appData?.store?.themeColor || localStorage.getItem('freshmart_theme_color') || 'emerald';
  updateThemeVars();
  if (tc !== 'emerald') {
    document.querySelectorAll('[class*="emerald"]').forEach(e => {
      e.className = e.className.replace(/(bg-|text-|border-|ring-|from-|to-|shadow-|border-[tblr]-)emerald/g, '$1' + tc);
    });
  }
};

window.setTempTheme = (t) => {
  setV('set-theme-color', t);
  document.querySelectorAll('[id^="btn-theme-"]').forEach(b => {
    b.classList.remove('border-slate-800', 'dark:border-white', 'scale-125', 'shadow-md');
    b.classList.add('border-white', 'dark:border-slate-800');
  });
  const active = el('btn-theme-' + t);
  if (active) {
    active.classList.remove('border-white', 'dark:border-slate-800');
    active.classList.add('border-slate-800', 'dark:border-white', 'scale-125', 'shadow-md');
  }
  if (appData && appData.store) {
    appData.store.themeColor = t;
  }
  try { localStorage.setItem('freshmart_theme_color', t); } catch(e) {}
  updateThemeVars();
  applyGlobalTheme();
  try { buildAndInjectManifest(); } catch(e) {}
};

const setV = (id, v) => { const e = el(id); if (e) e.value = v; };
const getV = id => { const e = el(id); return e ? e.value : ''; };
const esc = s => !s ? '' : s.toString().replace(/[&<>'"]/g, t => ({ '&': '&', '<': '<', '>': '>', "'": '&#39;', '"': '&quot;' }[t]));

const fixD = v => {
  if (typeof v !== 'string' || !v.trim()) return v;
  v = v.trim();
  
  // 1. Google Drive Link converter -> gunakan endpoint thumbnail Google yang terbukti stabil & anti-429
  const gDriveMatch = v.match(/(?:drive\.google\.com.*(?:id=|\/d\/)|googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch) {
    return `https://drive.google.com/thumbnail?id=${gDriveMatch[1]}&sz=w800`;
  }
  
  // 2. Google Image Search URL (extract original imgurl parameter)
  if (v.includes('google.com/imgres') || v.includes('google.co.id/imgres')) {
    try {
      const urlObj = new URL(v);
      const imgParam = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url');
      if (imgParam) return decodeURIComponent(imgParam);
    } catch(e) {}
  }

  // 3. Dropbox direct link converter
  if (v.includes('dropbox.com')) {
    return v.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
  }

  return v;
};

// Helper fallback gambar cerdas: jika gambar gagal muat / 404, langsung fallback ke SVG inline instan tanpa request berulang
window.imgErrRetry = (imgEl, fallbackText = 'No Image', w = 400) => {
  if (!imgEl) return;
  imgEl.onerror = null;
  imgEl.classList.remove('opacity-0');
  imgEl.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}"><rect width="100%" height="100%" fill="%23f8fafc"/><circle cx="${w/2}" cy="${w/2 - 12}" r="${w/8}" fill="%23e2e8f0"/><path d="M${w/4} ${w*0.8} Q ${w/2} ${w*0.5} ${w*0.75} ${w*0.8} Z" fill="%23cbd5e1"/><text x="50%" y="${w*0.9}" font-family="sans-serif" font-weight="700" font-size="12" fill="%2394a3b8" dominant-baseline="middle" text-anchor="middle">${encodeURIComponent(fallbackText)}</text></svg>`;
};

// Engine Lazy Loading Gambar
window.lazyObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.onload = () => img.classList.remove('opacity-0');
        img.onerror = () => window.imgErrRetry(img, 'No Image', 400);
        observer.unobserve(img);
      }
    }
  });
}, { rootMargin: "100px 0px" });

window.observeLazyImages = () => {
  document.querySelectorAll('img.lazy-load').forEach(img => {
    window.lazyObserver.observe(img);
  });
};

const sLoad = t => { if (t) setIn('loader-text', t); show('global-loader'); };
const hLoad = () => hide('global-loader');

const _curFormatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
const fCur = a => {
  const n = Number(a);
  return (isNaN(n) || a === null) ? 'Rp 0' : _curFormatter.format(Math.abs(n)).replace(/^/, n < 0 ? '-' : '');
};

window.getDist = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

window.autoParseCoords = (input) => {
  const val = input.value.trim();
  const coords = val.split(',');
  if (coords.length >= 2) {
    const lat = parseFloat(coords[0].trim());
    const lng = parseFloat(coords[1].trim());
    if (!isNaN(lat) && !isNaN(lng)) {
      setV('set-lat', lat);
      setV('set-lng', lng);
      showToast("Koordinat tersalin!");
      return;
    }
  }
  showToast("Format salah! Coba: Lat, Lng");
};

window.handleImageUpload = async (inputElement, targetInputId, varIndex = null) => {
  const file = inputElement.files[0]; 
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) { inputElement.value = ''; return showToast("Maksimal gambar 3MB!"); }
  if (!GAS_UPLOAD_URL || GAS_UPLOAD_URL.includes("ISI_DENGAN")) { inputElement.value = ''; return showToast("URL Google Apps Script belum diisi!"); }
  
  sLoad('Upload Gambar...'); 
  const reader = new FileReader(); 
  reader.readAsDataURL(file);
  
  reader.onload = async () => {
    try {
      const base64Data = reader.result.split(',')[1];
      const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const payload = { name: "POS_" + Date.now() + "_" + safeName, mimeType: file.type, data: base64Data };
      
      const gasController = new AbortController();
      const gasTimeout = setTimeout(() => gasController.abort(), 30000);
      const res = await fetch(GAS_UPLOAD_URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', signal: gasController.signal });
      clearTimeout(gasTimeout);
      const textRes = await res.text(); 
      let responseData;
      try { 
        responseData = JSON.parse(textRes); 
      } catch(e) { 
        hLoad(); inputElement.value = ''; 
        return showToast('Server GAS Error! Deploy ulang versi terbaru.'); 
      }
      if (responseData.status === 'success') {
        const finalUrl = fixD(responseData.url);
        const targetInput = el(targetInputId);
        if (targetInput) {
          targetInput.value = finalUrl; 
          targetInput.dispatchEvent(new Event('input', {bubbles:true})); 
          targetInput.dispatchEvent(new Event('change', {bubbles:true}));
          if (varIndex !== null) uVar(varIndex, 'img', finalUrl);
          showToast("Gambar berhasil diupload!");
        }
      } else {
        showToast("Gagal Drive: " + (responseData.message || "Unknown error"));
      }
    } catch (e) { 
      showToast("Koneksi terputus/CORS diblokir browser."); 
    }
    hLoad(); 
    inputElement.value = ''; 
  };
  reader.onerror = () => { showToast("Gagal membaca file!"); hLoad(); inputElement.value = ''; };
};

window.showToast = m => { 
  setIn('toast-message', m); 
  const t = el('toast'); 
  if (t) { 
    clearTimeout(toastT); 
    t.style.top = '24px'; 
    toastT = setTimeout(() => {
      t.style.top = '-120px';
    }, 3000); 
  } 
};

window.copyVoucher = (code) => {
  const copyProses = () => {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`Kode ${code} berhasil disalin! 🎉`);
    } catch (err) {
      showToast("Gagal menyalin kode.");
    }
    document.body.removeChild(textArea);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`Kode ${code} berhasil disalin! 🎉`);
    }).catch(() => copyProses());
  } else {
    copyProses();
  }
};

window.toggleTheme = () => {
  const html = document.documentElement; 
  const icon = el('icon-theme');
  if (html.classList.contains('dark')) { 
    html.classList.remove('dark'); 
    localStorage.setItem('freshmart_theme', 'light'); 
    if (icon) icon.className = 'fa-solid fa-moon text-sm'; 
  } else { 
    html.classList.add('dark'); 
    localStorage.setItem('freshmart_theme', 'dark'); 
    if (icon) icon.className = 'fa-solid fa-sun text-sm text-amber-500'; 
  }
};

window.showConfirm = (t, m, cb, btnText = "Ya, Hapus", isDanger = true) => {
  setIn('confirm-title', t); 
  setIn('confirm-msg', m); 
  const b = el('confirm-yes-btn');
  if (b) {
    b.innerText = btnText;
    if (isDanger) {
      b.className = 'flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all text-sm shadow-md shadow-rose-500/20 border-2 border-rose-700';
      el('confirm-icon-box').className = 'w-14 h-14 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border-2 border-rose-100 dark:border-rose-800';
      el('confirm-icon').className = 'fa-solid fa-triangle-exclamation';
    } else {
      b.className = 'flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all text-sm shadow-md shadow-emerald-500/20 border-2 border-emerald-700';
      el('confirm-icon-box').className = 'w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border-2 border-emerald-100 dark:border-emerald-800';
      el('confirm-icon').className = 'fa-solid fa-copy';
    }
  }
  confirmCb = cb; 
  show('custom-confirm-modal'); 
  setTimeout(() => {
    el('custom-confirm-modal').classList.remove('opacity-0');
    el('custom-confirm-box').classList.remove('scale-95');
  }, 10);
};

window.closeConfirm = () => {
  el('custom-confirm-modal').classList.add('opacity-0');
  el('custom-confirm-box').classList.add('scale-95');
  setTimeout(() => hide('custom-confirm-modal'), 300);
};

window.executeConfirm = () => {
  if (confirmCb) confirmCb();
  closeConfirm();
};

// Inisialisasi CSS variables awal sebelum data async dimuat
(function initThemeEarly() {
  try {
    const directTheme = localStorage.getItem('freshmart_theme_color');
    if (directTheme) {
      appData.store = appData.store || {};
      appData.store.themeColor = directTheme;
    } else {
      const cached = sessionStorage.getItem('freshmart_cms_data') || localStorage.getItem('freshmart_cms_data');
      if (cached) {
        const d = JSON.parse(cached);
        if (d.store && d.store.themeColor) {
          appData.store = appData.store || {};
          appData.store.themeColor = d.store.themeColor;
        }
      }
    }
  } catch(e) { console.warn('[FreshMart] Gagal parse theme cache:', e); }
  const THEME_COLORS_EARLY = {
    emerald:'#059669,#047857,#ecfdf5,5,150,105',
    teal:'#0d9488,#0f766e,#f0fdfa,13,148,136',
    cyan:'#0891b2,#0e7490,#ecfeff,8,145,178',
    sky:'#0284c7,#0369a1,#f0f9ff,2,132,199',
    blue:'#2563eb,#1d4ed8,#eff6ff,37,99,235',
    indigo:'#4f46e5,#4338ca,#eef2ff,79,70,229',
    violet:'#7c3aed,#6d28d9,#f5f3ff,124,58,237',
    purple:'#9333ea,#7e22ce,#faf5ff,147,51,234',
    pink:'#db2777,#be185d,#fdf2f8,219,39,119',
    rose:'#e11d48,#be123c,#fff1f2,225,29,72',
    red:'#dc2626,#b91c1c,#fef2f2,220,38,38',
    orange:'#ea580c,#c2410c,#fff7ed,234,88,12',
    amber:'#d97706,#b45309,#fffbeb,217,119,6',
    lime:'#65a30d,#4d7c0f,#f7fee7,101,163,13',
  };
  const tc = (appData.store && appData.store.themeColor) || 'emerald';
  const v = (THEME_COLORS_EARLY[tc] || THEME_COLORS_EARLY.emerald).split(',');
  const r = document.documentElement;
  r.style.setProperty('--clr-p', v[0]);
  r.style.setProperty('--clr-p-dark', v[1]);
  r.style.setProperty('--clr-p-bg', v[2]);
  r.style.setProperty('--clr-p-10', `rgba(${v[3]},${v[4]},${v[5]},0.10)`);
  r.style.setProperty('--clr-p-25', `rgba(${v[3]},${v[4]},${v[5]},0.25)`);
  r.style.setProperty('--clr-p-35', `rgba(${v[3]},${v[4]},${v[5]},0.35)`);
})();
