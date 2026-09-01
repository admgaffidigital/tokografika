// =============================================================================
// FRESHMART PWA ENGINE (DYNAMIC MANIFEST, ICONS, AND INSTALL BANNER)
// =============================================================================

const isPwaInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true ||
  document.referrer.includes('android-app://');

const _darkenHex = (hex, pct) => {
  const num = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * pct));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * pct));
  return '#' + ((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);
};

const _drawTextFallback = (ctx, size, storeName) => {
  const initials = (storeName || 'T').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  const fontSize = size * 0.38;
  ctx.font = '900 ' + fontSize + 'px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);
};

// Robust image loader dengan auto-proxy CORS untuk Google Drive & external CDN
const _loadImgOnce = (url) => new Promise((resolve, reject) => {
  if (!url || typeof url !== 'string') return reject(new Error('Invalid image URL'));
  
  let cleanUrl = fixD(url.trim());
  
  // Data URL tidak memerlukan proxy
  if (cleanUrl.startsWith('data:image/')) {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load data URL image'));
    img.src = cleanUrl;
    return;
  }
  
  // Gunakan wsrv.nl proxy untuk URL eksternal agar aman dari CORS block browser
  let targetUrl = cleanUrl;
  if (!cleanUrl.includes('wsrv.nl') && /^https?:\/\//i.test(cleanUrl)) {
    targetUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=512&output=png`;
  }
  
  let done = false;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    if (done) return;
    done = true;
    resolve(img);
  };
  
  img.onerror = () => {
    if (targetUrl !== cleanUrl) {
      // Coba fallback langsung jika proxy gagal
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.onload = () => { if (!done) { done = true; resolve(fallbackImg); } };
      fallbackImg.onerror = () => { if (!done) { done = true; reject(new Error('Image failed to load via CORS')); } };
      fallbackImg.src = cleanUrl;
    } else {
      if (!done) { done = true; reject(new Error('Image failed to load')); }
    }
  };
  
  setTimeout(() => {
    if (!done) {
      done = true;
      reject(new Error('Image load timeout'));
    }
  }, 3500);
  
  img.src = targetUrl;
});

const renderLogoToCanvas = async (logo, themeHex, storeName, size, isMaskable = false) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Fill background with Theme Color
  ctx.fillStyle = themeHex;
  ctx.fillRect(0, 0, size, size);

  const isImageUrl = logo && (logo.startsWith('http') || logo.startsWith('https') || logo.startsWith('data:'));
  const isFaIcon = logo && !isImageUrl && logo.trim().length > 0;
  // Use safe zone padding (18% for maskable Android, 10% for iOS / regular)
  const pad = isMaskable ? size * 0.18 : size * 0.10;

  if (isImageUrl) {
    try {
      const img = await _loadImgOnce(logo);
      const draw = size - pad * 2;
      let dw = draw, dh = draw;
      if (img.width > img.height) dh = draw * (img.height / img.width);
      else if (img.height > img.width) dw = draw * (img.width / img.height);
      
      // Render Solid White Circular Badge Base & Perfect Circle Clipping for Round Logo Look
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, draw / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.clip();
      
      ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
      ctx.restore();
      
      return canvas.toDataURL('image/png');
    } catch (e) {
      _drawTextFallback(ctx, size, storeName);
      return canvas.toDataURL('image/png');
    }
  } else if (isFaIcon) {
    const faMap = {
      'fa-store':'\uf54e','fa-shop':'\uf54f','fa-shopping-cart':'\uf07a','fa-shopping-bag':'\uf290',
      'fa-basket-shopping':'\uf291','fa-cart-shopping':'\uf07a','fa-tag':'\uf02b','fa-tags':'\uf02c',
      'fa-box':'\uf466','fa-box-open':'\uf49e','fa-boxes-stacked':'\uf468','fa-building':'\uf1ad',
      'fa-house':'\uf015','fa-home':'\uf015','fa-utensils':'\uf2e7','fa-burger':'\uf805',
      'fa-pizza-slice':'\uf818','fa-leaf':'\uf06c','fa-seedling':'\uf4d8','fa-tree':'\uf1bb',
      'fa-star':'\uf005','fa-heart':'\uf004','fa-gem':'\uf3a5','fa-crown':'\uf521',
      'fa-bolt':'\uf0e7','fa-fire':'\uf06d','fa-truck':'\uf0d1','fa-motorcycle':'\uf21c',
      'fa-bicycle':'\uf206','fa-tshirt':'\uf553','fa-shirt':'\uf553','fa-glasses':'\uf530',
      'fa-mobile':'\uf10b','fa-laptop':'\uf109','fa-camera':'\uf030','fa-music':'\uf001',
      'fa-book':'\uf02d','fa-gamepad':'\uf11b','fa-paw':'\uf1b0','fa-fish':'\uf578',
      'fa-apple-whole':'\uf5d1','fa-carrot':'\uf787','fa-bread-slice':'\uf7ec',
      'fa-coffee':'\uf0f4','fa-mug-hot':'\uf7b6','fa-wine-glass':'\uf4e3',
      'fa-pills':'\uf484','fa-spa':'\uf5bb','fa-scissors':'\uf0c4',
      'fa-wrench':'\uf0ad','fa-hammer':'\uf6e3','fa-paint-roller':'\uf5aa',
      'fa-palette':'\uf53f','fa-pen':'\uf304','fa-pencil':'\uf303'
    };
    const cleanClass = logo.replace(/^fa-(solid|regular|brands|light|thin|duotone)\s+/, '').trim();
    const unicode = faMap[cleanClass] || null;
    const iconSize = size * (isMaskable ? 0.44 : 0.52);
    return new Promise(resolve => {
      const tryRender = () => {
        // Draw white circle background for FA icon
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, (size - pad * 2) / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fill();
        ctx.restore();

        ctx.font = '900 ' + iconSize + 'px "Font Awesome 6 Free"';
        ctx.fillStyle = 'rgba(255,255,255,0.98)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(unicode || '\uf54e', size / 2, size / 2 + iconSize * 0.04);
        resolve(canvas.toDataURL('image/png'));
      };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(tryRender);
      else setTimeout(tryRender, 500);
    });
  } else {
    _drawTextFallback(ctx, size, storeName);
    return canvas.toDataURL('image/png');
  }
};

const _injectIosSplashScreen = async (logo, themeHex, storeName) => {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!isIos) return;

  document.querySelectorAll('link[rel="apple-touch-startup-image"]').forEach(el => el.remove());
  const splashSizes = [
    { w:1125, h:2436, media:'(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3)' },
    { w:1170, h:2532, media:'(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)' },
    { w:1290, h:2796, media:'(device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3)' },
    { w:828,  h:1792, media:'(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:2)' },
    { w:750,  h:1334, media:'(device-width:375px) and (device-height:667px) and (-webkit-device-pixel-ratio:2)' },
    { w:1536, h:2048, media:'(device-width:768px) and (device-height:1024px) and (-webkit-device-pixel-ratio:2)' },
    { w:2048, h:2732, media:'(device-width:1024px) and (device-height:1366px) and (-webkit-device-pixel-ratio:2)' }
  ];
  const renderSplash = async (w, h) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = themeHex;
    ctx.fillRect(0, 0, w, h);
    const logoSize = Math.round(w * 0.24);
    const logoX = (w - logoSize) / 2;
    const logoY = (h - logoSize) / 2 - h * 0.05;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, logoY + logoSize / 2, logoSize * 0.68, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.restore();
    
    const isImgUrl = logo && (logo.startsWith('http') || logo.startsWith('https') || logo.startsWith('data:'));
    if (isImgUrl) {
      try {
        const img = await _loadImgOnce(logo);
        let dw = logoSize, dh = logoSize;
        if (img.width > img.height) dh = logoSize * (img.height / img.width);
        else if (img.height > img.width) dw = logoSize * (img.width / img.height);
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.clip();
        ctx.drawImage(img, logoX + (logoSize - dw) / 2, logoY + (logoSize - dh) / 2, dw, dh);
        ctx.restore();
      } catch (e) {
        ctx.save(); ctx.translate(logoX, logoY); _drawTextFallback(ctx, logoSize, storeName); ctx.restore();
      }
    } else {
      ctx.save();
      ctx.translate(logoX, logoY);
      _drawTextFallback(ctx, logoSize, storeName);
      ctx.restore();
    }
    
    const nameFz = Math.round(w * 0.052);
    ctx.font = '700 ' + nameFz + 'px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(storeName, w / 2, logoY + logoSize + h * 0.032);
    return canvas.toDataURL('image/png');
  };
  
  for (const s of splashSizes) {
    try {
      const dataUrl = await renderSplash(s.w, s.h);
      const linkEl = document.createElement('link');
      linkEl.rel = 'apple-touch-startup-image';
      linkEl.href = dataUrl;
      linkEl.media = s.media;
      document.head.appendChild(linkEl);
    } catch(e) {}
  }
};

const buildAndInjectManifest = async () => {
  const storeName = appData?.store?.name || 'Toko';
  const storeSlogan = appData?.store?.slogan || '';
  const logo = appData?.store?.logo || '';
  const tc = appData?.store?.themeColor || 'emerald';
  const themeHex = THEME_COLORS[tc]?.p || '#059669';

  const metaTheme = document.getElementById('pwa-theme-color');
  if (metaTheme) metaTheme.content = themeHex;
  const metaIosTitle = document.getElementById('pwa-app-name-ios');
  if (metaIosTitle) metaIosTitle.content = storeName;

  const cacheKey = logo + '|' + themeHex + '|' + storeName;
  let icon192, icon512, icon180, iconMaskable192, iconMaskable512;
  if (_pwaIconCache[cacheKey]) {
    ({ icon192, icon512, icon180, iconMaskable192, iconMaskable512 } = _pwaIconCache[cacheKey]);
  } else {
    [icon192, icon512, icon180, iconMaskable192, iconMaskable512] = await Promise.all([
      renderLogoToCanvas(logo, themeHex, storeName, 192, false),
      renderLogoToCanvas(logo, themeHex, storeName, 512, false),
      renderLogoToCanvas(logo, themeHex, storeName, 180, false),
      renderLogoToCanvas(logo, themeHex, storeName, 192, true),
      renderLogoToCanvas(logo, themeHex, storeName, 512, true)
    ]);
    _pwaIconCache[cacheKey] = { icon192, icon512, icon180, iconMaskable192, iconMaskable512 };
  }

  const activeFaviconUrl = icon180 || icon192 || (logo && (logo.startsWith('http') || logo.startsWith('data:')) ? logo : '/favicon.png');

  ['pwa-favicon', 'pwa-favicon-shortcut'].forEach(id => {
    let elFav = document.getElementById(id);
    if (!elFav) {
      elFav = document.createElement('link');
      elFav.id = id;
      elFav.rel = id === 'pwa-favicon' ? 'icon' : 'shortcut icon';
      elFav.type = 'image/png';
      document.head.appendChild(elFav);
    }
    elFav.href = activeFaviconUrl;
  });

  ['pwa-apple-touch-icon','pwa-apple-touch-icon-76','pwa-apple-touch-icon-120',
   'pwa-apple-touch-icon-152','pwa-apple-touch-icon-180'].forEach(id => {
    const el2 = document.getElementById(id);
    if (el2) el2.href = icon180 || activeFaviconUrl;
  });

  // Sinkronkan pratinjau Open Graph & Twitter Card ke Logo Toko / Favicon PWA
  const ogImg = document.getElementById('seo-og-image');
  if (ogImg && !ogImg.dataset.productCustom) {
    ogImg.content = (logo && (logo.startsWith('http') || logo.startsWith('data:'))) ? logo : (icon512 || activeFaviconUrl);
  }
  const twImg = document.getElementById('seo-tw-image');
  if (twImg && !twImg.dataset.productCustom) {
    twImg.content = (logo && (logo.startsWith('http') || logo.startsWith('data:'))) ? logo : (icon512 || activeFaviconUrl);
  }

  _injectIosSplashScreen(logo, themeHex, storeName);

  const manifest = {
    name: storeName,
    short_name: storeName.length > 12 ? storeName.substring(0, 12) : storeName,
    description: storeSlogan || ('Belanja di ' + storeName),
    start_url: window.location.href.split('?')[0],
    scope: window.location.href.split('?')[0],
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: themeHex,
    theme_color: themeHex,
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: iconMaskable192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: iconMaskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    categories: ['shopping','business'],
    lang: 'id'
  };

  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(manifestBlob);
  const link = document.getElementById('pwa-manifest-link');
  if (link) {
    if (link.href && link.href.startsWith('blob:')) URL.revokeObjectURL(link.href);
    link.href = manifestUrl;
  }
};

window.showPwaBanner = () => {
  if (isPwaInstalled()) return;
  const banner = document.getElementById('pwa-install-banner');
  if (!banner) return;

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isDesktop = !('ontouchstart' in window) && !/android/i.test(navigator.userAgent) && !isIos;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isIos && isSafari) {
    setIn('pwa-banner-title', 'Tambah ke Layar Utama (iOS)');
    setIn('pwa-banner-desc', 'Ketuk ikon Bagikan → "Add to Home Screen"');
    const icon = document.getElementById('pwa-banner-icon');
    if (icon) icon.className = 'fa-solid fa-arrow-up-from-bracket text-white text-xl';
    const btn = document.getElementById('pwa-install-btn');
    if (btn) { btn.textContent = 'Cara Install'; btn.onclick = showIosInstallGuide; }
  } else if (isDesktop) {
    setIn('pwa-banner-title', 'Install Aplikasi di PC / Laptop');
    setIn('pwa-banner-desc', 'Buka lebih cepat tanpa browser, seperti aplikasi desktop');
    const icon = document.getElementById('pwa-banner-icon');
    if (icon) icon.className = 'fa-solid fa-desktop text-white text-xl';
  } else {
    setIn('pwa-banner-title', 'Tambahkan ke Layar Utama');
    setIn('pwa-banner-desc', 'Install aplikasi toko ini di HP Anda');
  }

  banner.classList.remove('hidden');
};

window.triggerPwaInstall = async () => {
  if (_pwaInstallEvent) {
    _pwaInstallEvent.prompt();
    const { outcome } = await _pwaInstallEvent.userChoice;
    if (outcome === 'accepted') {
      showToast('Aplikasi berhasil diinstall!');
      dismissPwaBanner();
    }
    _pwaInstallEvent = null;
  } else {
    showToast('Gunakan menu browser: Tambah ke Layar Utama');
  }
};

window.dismissPwaBanner = () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.transition = 'all 0.3s ease';
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-8px)';
    setTimeout(() => banner.classList.add('hidden'), 300);
  }
  sessionStorage.setItem('pwa_banner_dismissed', '1');
};

window.showIosInstallGuide = () => {
  showConfirm(
    'Cara Install di iPhone / iPad',
    '1. Ketuk ikon Bagikan (kotak + panah atas) di toolbar Safari\n2. Gulir ke bawah, pilih "Add to Home Screen"\n3. Ketuk "Add" di pojok kanan atas\n\nAplikasi akan muncul di layar utama Anda!',
    () => {},
    'Mengerti',
    false
  );
};
