// =============================================================================
// FRESHMART CATALOG & STORE DISPLAY MODULE
// =============================================================================

window.getEffP = i => {
  const p = appData.products.find(x => x.id === i.id);
  if (!p || !p.wholesale || !p.wholesale.length) return i.price;
  const t = cart.filter(c => c.id === i.id).reduce((s, c) => s + c.qty, 0);
  for (let w of p.wholesale.slice().sort((a, b) => b.minQty - a.minQty)) {
    if (t >= w.minQty) return w.price;
  }
  return i.price;
};

const rDyn = () => {
  setIn('dyn-store-name', appData.store.name || 'TOKO GRAFIKA');
  setIn('dyn-store-slogan', appData.store.slogan || 'RITEL & GROSIR');
  setIn('footer-name', appData.store.name || 'TOKO GRAFIKA');
  setIn('footer-slogan', appData.store.slogan || 'RITEL & GROSIR');
  setIn('footer-desc', appData.store.footerText || 'Terima kasih telah berbelanja di toko kami.');
  setIn('footer-address', appData.store.address || 'Gg Rukun No.36, RT.08/RW.01...');
  setIn('footer-wa', appData.store.wa || '082137567097');
  setIn('footer-copy-name', appData.store.name || 'TOKO GRAFIKA');
  
  if (el('footer-year')) el('footer-year').innerText = new Date().getFullYear();
  
  let waNum = appData.store.wa || '082137567097';
  waNum = waNum.replace(/\D/g, '');
  if (waNum.startsWith('0')) waNum = '62' + waNum.substring(1);
  
  let waEl = el('footer-wa-link');
  if (waEl) waEl.href = `https://wa.me/${waNum}?text=Halo%20Admin%20Toko,%20saya%20ingin%20bertanya.`;
  
  let mapEl = el('footer-address-link');
  const mapFrame = el('footer-map-frame');
  const mapOverlayBtn = el('footer-map-overlay-btn');
  let mapQuery = '';
  if (appData.store.lat && appData.store.lng) {
    mapQuery = `${appData.store.lat},${appData.store.lng}`;
  } else if (appData.store.address) {
    mapQuery = appData.store.address;
  } else {
    mapQuery = appData.store.name || 'TOKO GRAFIKA';
  }

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  if (mapFrame && mapFrame.getAttribute('data-loaded-query') !== mapQuery) {
    mapFrame.src = embedUrl;
    mapFrame.setAttribute('data-loaded-query', mapQuery);
  }
  if (mapOverlayBtn) mapOverlayBtn.href = directMapsUrl;
  if (mapEl) mapEl.href = directMapsUrl;
  
  // Render Media Sosial
  let socHtml = '';
  if (appData.store.social) {
    const s = appData.store.social;
    if (s.fb) socHtml += `<a href="${esc(s.fb)}" target="_blank" title="Facebook" class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 group border-2 hover:text-white" style="background-color:rgba(24,119,242,0.18);color:#1877f2;border-color:rgba(24,119,242,0.4);" onmouseover="this.style.backgroundColor='#1877f2';this.style.borderColor='#1877f2'" onmouseout="this.style.backgroundColor='rgba(24,119,242,0.18)';this.style.borderColor='rgba(24,119,242,0.4)'"><i class="fa-brands fa-facebook-f text-sm group-hover:scale-110 transition-transform"></i></a>`;
    if (s.ig) socHtml += `<a href="${esc(s.ig)}" target="_blank" title="Instagram" class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 group border-2 hover:text-white" style="background-color:rgba(225,48,108,0.18);color:#e1306c;border-color:rgba(225,48,108,0.4);" onmouseover="this.style.backgroundColor='#e1306c';this.style.borderColor='#e1306c'" onmouseout="this.style.backgroundColor='rgba(225,48,108,0.18)';this.style.borderColor='rgba(225,48,108,0.4)'"><i class="fa-brands fa-instagram text-base group-hover:scale-110 transition-transform"></i></a>`;
    if (s.tt) socHtml += `<a href="${esc(s.tt)}" target="_blank" title="TikTok" class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 group border-2 hover:text-white" style="background-color:rgba(0,0,0,0.08);color:#0f172a;border-color:rgba(0,0,0,0.25);" onmouseover="this.style.backgroundColor='#000';this.style.borderColor='#000';this.style.color='#fff'" onmouseout="this.style.backgroundColor='rgba(0,0,0,0.08)';this.style.borderColor='rgba(0,0,0,0.25)';this.style.color='#0f172a'"><i class="fa-brands fa-tiktok text-sm group-hover:scale-110 transition-transform"></i></a>`;
    if (s.yt) socHtml += `<a href="${esc(s.yt)}" target="_blank" title="YouTube" class="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 group border-2 hover:text-white" style="background-color:rgba(255,0,0,0.18);color:#cc0000;border-color:rgba(255,0,0,0.4);" onmouseover="this.style.backgroundColor='#ff0000';this.style.borderColor='#ff0000'" onmouseout="this.style.backgroundColor='rgba(255,0,0,0.18)';this.style.borderColor='rgba(255,0,0,0.4)'"><i class="fa-brands fa-youtube text-base group-hover:scale-110 transition-transform"></i></a>`;
  }
  setH('footer-social-links', socHtml);
  
  // Render Logo Header & Footer
  const _logoImg = el('dyn-store-logo-img');
  const _logoIcon = el('dyn-store-logo-icon');
  const _fLogoImg = el('footer-logo-img');
  const _fLogoIcon = el('footer-logo-icon');

  const _showLogo = (img, icon, fImg, fIcon, isUrl, logoVal) => {
    if (isUrl) {
      if (img) {
        img.src = logoVal;
        img.style.display = 'block';
        img.classList.remove('hidden');
        img.onerror = () => {
          if (!img.dataset.retried) {
            img.dataset.retried = '1';
            img.src = `https://wsrv.nl/?url=${encodeURIComponent(logoVal)}&w=300`;
          } else {
            img.style.display = 'none';
            img.classList.add('hidden');
            if (icon) { icon.style.display = 'inline-block'; icon.classList.remove('hidden'); }
          }
        };
      }
      if (icon) { icon.style.display = 'none'; icon.classList.add('hidden'); }
      if (fImg) {
        fImg.src = logoVal;
        fImg.style.display = 'block';
        fImg.classList.remove('hidden');
        fImg.onerror = () => {
          if (!fImg.dataset.retried) {
            fImg.dataset.retried = '1';
            fImg.src = `https://wsrv.nl/?url=${encodeURIComponent(logoVal)}&w=300`;
          } else {
            fImg.style.display = 'none';
            fImg.classList.add('hidden');
            if (fIcon) { fIcon.style.display = 'inline-block'; fIcon.classList.remove('hidden'); }
          }
        };
      }
      if (fIcon) { fIcon.style.display = 'none'; fIcon.classList.add('hidden'); }
    } else if (logoVal) {
      if (icon) {
        icon.className = `fa-solid ${esc(logoVal)} text-xl text-emerald-600 dark:text-emerald-400`;
        icon.style.display = 'inline-block';
        icon.classList.remove('hidden');
      }
      if (img) { img.style.display = 'none'; img.classList.add('hidden'); }
      if (fIcon) {
        fIcon.className = `fa-solid ${esc(logoVal)} text-2xl text-emerald-600`;
        fIcon.style.display = 'inline-block';
        fIcon.classList.remove('hidden');
      }
      if (fImg) { fImg.style.display = 'none'; fImg.classList.add('hidden'); }
    } else {
      if (icon) {
        icon.className = 'fa-solid fa-store text-xl text-emerald-600 dark:text-emerald-400';
        icon.style.display = 'inline-block';
        icon.classList.remove('hidden');
      }
      if (img) { img.style.display = 'none'; img.classList.add('hidden'); }
      if (fIcon) {
        fIcon.className = 'fa-solid fa-store text-2xl text-emerald-600';
        fIcon.style.display = 'inline-block';
        fIcon.classList.remove('hidden');
      }
      if (fImg) { fImg.style.display = 'none'; fImg.classList.add('hidden'); }
    }
  };

  const _logoVal = appData.store.logo || '';
  const _isUrl = _logoVal.includes('http') || _logoVal.includes('data:');
  _showLogo(_logoImg, _logoIcon, _fLogoImg, _fLogoIcon, _isUrl, _logoVal);

  // Render Banner Promo
  setH('dynamic-banners-container', `
    <div class="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar">
    ${(appData.banners || []).map((b, i) => {
      const rawImg = (b.img || '').trim();
      const fixedImg = rawImg ? fixD(rawImg) : '';
      const hasImg = fixedImg.length > 0;
      const hasTitle = b.title && b.title.trim().length > 0;
      const bgTheme = i % 2 === 0 ? 'var(--clr-p)' : 'var(--clr-p-dark)';
      
      if (hasImg) {
        return `
        <div class="w-[88%] sm:w-[460px] md:w-[560px] lg:w-[640px] aspect-[16/7] sm:aspect-[21/9] snap-center shrink-0 rounded-2xl overflow-hidden shadow-md relative border border-slate-200 dark:border-slate-700 group cursor-pointer" style="background:${bgTheme}">
          <img src="${esc(fixedImg)}" loading="eager" onerror="this.style.display='none'" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white pointer-events-none ${hasTitle ? '' : 'opacity-0'}">
            <span class="badge badge-xs w-fit mb-1.5" style="background:var(--clr-p);color:#fff;border-color:transparent">Promo</span>
            <h2 class="font-bold text-base sm:text-lg leading-tight drop-shadow-md text-white">${esc(b.title || '')}</h2>
            ${b.subtitle ? `<p class="text-xs text-white/90 font-medium drop-shadow-sm mt-0.5">${esc(b.subtitle)}</p>` : ''}
          </div>
        </div>`;
      }

      return `
      <div class="w-[85%] sm:w-[320px] snap-center shrink-0 rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex items-center justify-between border-2 border-transparent" style="background: ${bgTheme}">
        <div class="flex-1 pr-2 relative z-10">
          <span class="badge badge-xs" style="background:rgba(255,255,255,.25);color:#fff;border-color:rgba(255,255,255,.35)">Promo</span>
          <h2 class="font-bold text-base sm:text-lg mt-2 mb-0.5 leading-tight text-white">${esc(b.title || 'Promo Menarik')}</h2>
          <p class="text-[10px] text-white/90 font-medium">${esc(b.subtitle || '')}</p>
        </div>
      </div>`;
    }).join('')}
    </div>
  `);

  // Render Kartu Voucher Dinamis
  const vCont = el('dynamic-vouchers-container');
  const vSect = el('voucher-section');
  
  if (vCont && vSect) {
    if (appData.vouchers && appData.vouchers.length > 0) {
      show('voucher-section');
      setH('dynamic-vouchers-container', appData.vouchers.map(v => {
        let desc = '';
        if (v.type === 'product_percent') desc = `Diskon Produk ${v.value}%`;
        else if (v.type === 'shipping_percent') desc = `Diskon Ongkir ${v.value}%`;
        else if (v.type === 'shipping_flat') desc = `Potongan Ongkir ${fCur(v.value)}`;
        
        return `
        <div class="snap-start shrink-0 w-64 bg-white dark:bg-slate-800 rounded-xl border-2 border-emerald-200 dark:border-emerald-800/50 shadow-sm flex overflow-hidden group cursor-pointer" onclick="copyVoucher('${esc(v.code)}')">
          <div class="bg-emerald-50 dark:bg-emerald-900/30 p-3 flex flex-col justify-center items-center border-r-2 border-dashed border-emerald-300 dark:border-emerald-700 w-[72px] shrink-0 relative overflow-hidden">
            <div class="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900 rounded-full border-r-2 border-emerald-200 dark:border-emerald-800/50"></div>
            <i class="fa-solid fa-ticket text-emerald-500 text-2xl mb-1 group-hover:scale-110 group-hover:-rotate-12 transition-transform"></i>
            <span class="badge badge-xs badge-emerald">Promo</span>
          </div>
          <div class="p-3 flex-1 flex flex-col justify-between min-w-0 relative">
            <div class="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-slate-50 dark:bg-slate-900 rounded-full border-l-2 border-emerald-200 dark:border-emerald-800/50"></div>
            <div class="mb-2 pr-2">
              <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">${desc}</p>
            </div>
            <div class="flex items-center justify-between gap-2 mt-auto pr-2">
              <span class="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 truncate">${esc(v.code)}</span>
              <button class="bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 group-hover:text-white border border-emerald-200 dark:border-emerald-700 px-3 py-1.5 rounded-lg text-[9px] font-medium uppercase tracking-widest transition-colors shrink-0 shadow-sm"><i class="fa-regular fa-copy"></i> Salin</button>
            </div>
          </div>
        </div>
        `;
      }).join(''));
    } else {
      hide('voucher-section');
      vCont.innerHTML = '';
    }
  }

  // Render Menu Kategori dengan Product Counter Otomatis
  const cL = [
    { name: 'Semua Produk', img: appData.store.allProductsIcon || '' }, 
    ...(appData.categories || [])
  ];

  const catStyle = appData.store.categoryStyle || 'image';
  const catCont = el('dynamic-categories-container');
  if (catCont) {
    if (catStyle === 'grid') {
      catCont.className = 'grid grid-rows-2 grid-flow-col auto-cols-[74px] sm:auto-cols-[88px] gap-2.5 sm:gap-3.5 overflow-x-auto hide-scrollbar no-scrollbar snap-x pb-2';
    } else {
      catCont.className = 'flex gap-2.5 sm:gap-3.5 overflow-x-auto hide-scrollbar no-scrollbar snap-x pb-1.5 items-center';
    }
  }

  const catBadge = el('dyn-cat-count-badge');
  if (catBadge) {
    catBadge.innerText = `${(appData.categories || []).length} Kategori`;
  }
  
  setH('dynamic-categories-container', cL.map(c => {
    const isAll = c.name === 'Semua Produk';
    const count = isAll 
      ? (appData.products || []).length 
      : (appData.products || []).filter(p => p.category === c.name).length;
    const isActive = aCat === c.name;
    const encodedName = encodeURIComponent(c.name).replace(/'/g, "%27");

    // Mode 1: Chips / Text (Pill Chips Modern + Counter Badge)
    if (catStyle === 'text' || catStyle === 'chips') {
      return `
      <div onclick="filterCategory(decodeURIComponent('${encodedName}'))" class="cursor-pointer shrink-0 snap-start">
        <div class="px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-full border-2 transition-all duration-200 flex items-center gap-2 font-bold text-xs text-center tracking-wide ${isActive ? 'text-white border-transparent shadow-md scale-[1.03]' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'}" style="${isActive ? 'background-color:var(--clr-p);' : ''}">
          <i class="fa-solid ${isAll ? 'fa-boxes-stacked' : 'fa-tag'} text-[11px] ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}"></i>
          <span>${esc(c.name)}</span>
          <span class="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}">${count}</span>
        </div>
      </div>
      `;
    }

    // Mode 3: Grid (2-Row Interactive App Grid)
    if (catStyle === 'grid') {
      const hasImg = c.img && (c.img.includes('http') || c.img.includes('data:'));
      return `
      <div onclick="filterCategory(decodeURIComponent('${encodedName}'))" class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 w-[74px] sm:w-[88px] group snap-start">
        <div class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all duration-300 group-hover:scale-105 flex items-center justify-center overflow-hidden ${isActive ? 'border-2 shadow-md ring-2 ring-offset-2 ring-emerald-500' : 'border-2 border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 shadow-sm hover:border-slate-300'}" style="${isActive ? 'border-color:var(--clr-p);background-color:var(--clr-p-bg);' : ''}">
          ${hasImg 
            ? `<img data-src="${esc(fixD(c.img))}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==" onerror="this.onerror=null;this.src='https://placehold.co/150/10b981/ffffff?text=Cat'" class="lazy-load opacity-0 transition-all duration-500 absolute inset-0 w-full h-full object-cover rounded-2xl"/>` 
            : `<i class="fa-solid ${isAll ? 'fa-store' : 'fa-layer-group'} text-lg ${isActive ? '' : 'text-slate-500 dark:text-slate-400'}" style="${isActive ? 'color:var(--clr-p);' : ''}"></i>`}
        </div>
        <div class="text-center w-full px-0.5">
          <span class="text-[10px] sm:text-[11px] block line-clamp-1 leading-tight ${isActive ? 'font-black' : 'font-bold text-slate-600 dark:text-slate-300'}" style="${isActive ? 'color:var(--clr-p);' : ''}">
            ${esc(c.name)}
          </span>
        </div>
      </div>
      `;
    }

    // Mode 2 (Default): Image Cards (Visual Squircle E-Commerce Icon Cards)
    const hasImg = c.img && (c.img.includes('http') || c.img.includes('data:'));
    return `
    <div onclick="filterCategory(decodeURIComponent('${encodedName}'))" class="flex flex-col items-center gap-2 cursor-pointer shrink-0 w-[74px] sm:w-[86px] group snap-start">
      <div class="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl transition-all duration-300 group-hover:scale-105 flex items-center justify-center overflow-hidden ${isActive ? 'border-2 shadow-md ring-2 ring-offset-2 ring-emerald-500' : 'border-2 border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-750 shadow-sm hover:border-slate-300'}" style="${isActive ? 'border-color:var(--clr-p);background-color:var(--clr-p-bg);' : ''}">
        ${hasImg 
          ? `<img data-src="${esc(fixD(c.img))}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==" onerror="this.onerror=null;this.src='https://placehold.co/150/10b981/ffffff?text=Cat'" class="lazy-load opacity-0 transition-all duration-500 absolute inset-0 w-full h-full object-cover rounded-2xl"/>` 
          : `<i class="fa-solid ${isAll ? 'fa-store' : 'fa-layer-group'} text-xl ${isActive ? '' : 'text-slate-500 dark:text-slate-400'}" style="${isActive ? 'color:var(--clr-p);' : ''}"></i>`}
        <span class="absolute bottom-1 right-1 text-[8px] font-black px-1 py-0.2 rounded-md ${isActive ? 'bg-white text-slate-800 shadow-sm' : 'bg-slate-900/60 text-white backdrop-blur-xs'}">${count}</span>
      </div>
      <div class="text-center w-full px-0.5">
        <span class="text-[10px] sm:text-[11px] block line-clamp-2 leading-tight ${isActive ? 'font-black' : 'font-bold text-slate-600 dark:text-slate-300'}" style="${isActive ? 'color:var(--clr-p);' : ''}">
          ${esc(c.name)}
        </span>
      </div>
    </div>
    `;
  }).join(''));
  
  if (el('dyn-qris-img') && appData.payment) el('dyn-qris-img').src = appData.payment.qrisUrl;
  
  cPage = 1;
  rCat();
};

window.filterCategory = c => { 
  aCat = c; 
  cPage = 1; 
  rDyn(); 
  const s = el('catalog-scroll'); 
  if (s) s.scrollTo({ top: 0, behavior: 'smooth' }); 
  if (window.updateStoreSeo) updateStoreSeo(c === 'Semua Produk' ? '' : `Kategori ${c}`);
};

window.scrollCatalogToTop = () => {
  const s = el('catalog-scroll');
  if (s) s.scrollTo({ top: 0, behavior: 'smooth' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.handleSearch = v => {
  clearTimeout(window._catST);
  const val = (v || '').trim();
  const cb = el('btn-search-clear');
  if (cb) cb.classList.toggle('hidden', !val);
  window._catST = setTimeout(() => {
    sQ = val;
    cPage = 1;
    rCat();
    const s = el('catalog-scroll');
    if (s && val) s.scrollTo({ top: 0, behavior: 'smooth' });
  }, 200);
};

window.clearSearch = () => {
  const si = el('search-input');
  if (si) si.value = '';
  const cb = el('btn-search-clear');
  if (cb) cb.classList.add('hidden');
  sQ = '';
  cPage = 1;
  rCat();
};

window.handleSort = v => { cSort = v; cPage = 1; rCat(); };

window.toggleView = v => {
  cView = v; cPage = 1;
  el('btn-view-grid').className = v === 'grid' ? "w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-sm transition-all" : "w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all";
  el('btn-view-list').className = v === 'list' ? "w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800 shadow-sm transition-all" : "w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all";
  rCat();
};

const rCat = () => {
  let f = (appData.products || []).filter(p => {
    // 1. Produk Nonaktif (Disembunyikan) tidak ditampilkan sama sekali di katalog
    if (p.isActive === 'false' || p.isActive === false) return false;
    
    // 2. Filter Kategori
    if (aCat !== 'Semua Produk' && p.category !== aCat) return false;
    
    // 3. Filter Pencarian
    if (!sQ) return true;
    let q = sQ.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || 
      ((p.sku || '').toLowerCase().includes(q)) || 
      (p.variants && p.variants.some(v => (v.sku || '').toLowerCase().includes(q)));
  }).sort((a, b) => {
    if (cSort === 'cheapest') return a.price - b.price;
    if (cSort === 'expensive') return b.price - a.price;
    if (cSort === 'az') return (a.name || '').localeCompare(b.name || '');
    if (cSort === 'za') return (b.name || '').localeCompare(a.name || '');
    if (cSort === 'oldest') return (a.id || 0) - (b.id || 0);
    return (b.id || 0) - (a.id || 0);
  });

  const c = el('product-container');
  c.className = cView === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5' : 'flex flex-col gap-3 max-w-4xl mx-auto';
  
  if (!f.length) {
    c.innerHTML = `
    <div class="col-span-full text-center py-20 text-slate-400 font-bold bg-white dark:bg-slate-800 rounded-[1.25rem] border-2 border-slate-200 dark:border-slate-700 text-sm">
      <i class="fa-solid fa-box-open text-4xl mb-3 opacity-50 block"></i>
      Produk tidak ditemukan
    </div>
    `;
    hide('load-more-container');
    return;
  }
  
  const svgPlaceholder = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==";
  const v = f.slice(0, cPage * iPP);

  c.innerHTML = v.map(p => {
    // Cek apakah produk kehabisan stok atau stok unlimited
    const isUnlimited = (appData.store?.stockMode === 'unlimited') || p.isUnlimited === true || p.isUnlimited === 'true';
    const hasVars = p.variants && p.variants.length > 0;
    const isOutOfStock = !isUnlimited && (hasVars 
      ? p.variants.every(v => v.stock !== undefined && v.stock !== null && v.stock !== '' && Number(v.stock) <= 0)
      : (p.stock !== undefined && p.stock !== null && p.stock !== '' && Number(p.stock) <= 0));

    let nH = isOutOfStock ? `<div class="absolute top-1.5 right-1.5 z-20"><span class="bg-amber-500/95 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">STOK HABIS</span></div>` : '';
    let bH = `
    <div class="mb-1 flex flex-wrap gap-1 items-center overflow-hidden shrink-0">
      ${p.tag ? `<span class="bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded text-[8px] font-bold truncate max-w-full"><i class="fa-solid fa-fire text-[7px]"></i> ${esc(p.tag)}</span>` : ''}
      <span class="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-semibold truncate max-w-full">
        <i class="fa-solid fa-check text-[7px]"></i> Official
      </span>
      ${p.wholesale?.length ? `<span class="bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[8px] font-semibold truncate max-w-full"><i class="fa-solid fa-tags text-[7px]"></i> Grosir</span>` : ''}
    </div>
    `;

    if (cView === 'grid') {
      return `
      <div class="card-modern overflow-hidden flex flex-col cursor-pointer group p-2.5 sm:p-3 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200" onclick="openProductModal(${p.id})">
        <div class="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 mb-2.5">
          <img data-src="${esc(p.img)}" src="${svgPlaceholder}" onerror="window.imgErrRetry(this,'No Image',400)" class="lazy-load opacity-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-75' : ''}"/>
          ${nH}
        </div>
        <div class="flex-1 flex flex-col justify-between min-w-0 px-0.5 pb-0.5">
          <div class="flex flex-col min-w-0">
            ${bH}
            <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${esc(p.name)}</h4>
          </div>
          <div class="mt-auto pt-1.5 flex items-baseline justify-between gap-1 flex-wrap">
            <span class="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm sm:text-base leading-none">${fCur(p.price)}</span>
            ${p.unit ? `<span class="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700 uppercase tracking-wide shrink-0">/${esc(p.unit)}</span>` : ''}
          </div>
        </div>
      </div>
      `;
    } else {
      return `
      <div class="card-modern flex items-center p-3 gap-3.5 cursor-pointer group border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200" onclick="openProductModal(${p.id})">
        <div class="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60">
          <img data-src="${esc(p.img)}" src="${svgPlaceholder}" onerror="window.imgErrRetry(this,'No Image',400)" class="lazy-load opacity-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-75' : ''}"/>
          ${nH}
        </div>
        <div class="flex-1 min-w-0 pr-1 flex flex-col justify-between py-0.5 h-full">
          <div>
            ${bH}
            <h4 class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">${esc(p.name)}</h4>
          </div>
          <div class="mt-auto pt-1 flex items-baseline gap-2">
            <span class="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm sm:text-base leading-none">${fCur(p.price)}</span>
            ${p.unit ? `<span class="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700 uppercase tracking-wide">/${esc(p.unit)}</span>` : ''}
          </div>
        </div>
      </div>
      `;
    }
  }).join('');
  
  setTimeout(observeLazyImages, 50); 
  v.length < f.length ? show('load-more-container') : hide('load-more-container');
};

window.loadMoreProducts = async () => {
  hide('load-more-container');
  await new Promise(r => setTimeout(r, 300));
  cPage++;
  rCat();
};

window.openProductModal = i => {
  const p = (appData.products || []).find(x => x.id === i || String(x.id) === String(i));
  if (!p) return;
  cProd = p; cVar = 0; cQty = 1; 
  setV('modal-qty-input', 1); 
  rProdMod();
  if (window.updateStoreSeo) updateStoreSeo(p.name, p.desc, p.img, p);
  
  // Sinkronkan URL dengan parameter ?p=ID agar saat di-share atau di-refresh langsung ke produk ini
  try {
    const u = new URL(window.location.href);
    if (u.searchParams.get('p') !== String(p.id)) {
      u.searchParams.set('p', p.id);
      history.replaceState({ modal: 'product', pid: p.id }, '', u.toString());
    }
  } catch (e) {}

  const m = el('product-modal'), c = el('product-modal-content');
  if (m && c) {
    if (m.classList.contains('hidden')) {
      history.pushState({ modal: 'product', pid: p.id }, '', '');
      oMods.push('product');
    }
    show('product-modal'); 
    c.scrollTo(0, 0);
    setTimeout(() => {
      m.classList.remove('opacity-0');
      c.classList.remove('translate-y-full', 'sm:translate-y-5');
    }, 10);
  }
};

window.closeProductModal = (fH = !1) => {
  const m = el('product-modal'), c = el('product-modal-content');
  if (m && c) {
    if (!fH && oMods[oMods.length - 1] === 'product') {
      oMods.pop();
      history.back();
    } else if (fH) {
      oMods.pop();
    }
    m.classList.add('opacity-0');
    c.classList.add('translate-y-full', 'sm:translate-y-5');
    setTimeout(() => hide('product-modal'), 300);
    if (window.updateStoreSeo) updateStoreSeo();
  }
  // Bersihkan parameter ?p dari URL secara halus tanpa reload
  try {
    const u = new URL(window.location.href);
    if (u.searchParams.has('p')) {
      u.searchParams.delete('p');
      history.replaceState({}, '', u.toString());
    }
  } catch (e) {}
};

// Objek helper untuk menyimpan data produk yang sedang siap dibagikan
let currentShareData = null;

window.getProductShareData = (productOrId) => {
  let p = productOrId;
  if (!p && cProd) p = cProd;
  if (typeof p === 'number' || typeof p === 'string') {
    p = (appData.products || []).find(x => x.id === p || String(x.id) === String(p));
  }
  if (!p) return null;

  const hV = p.variants?.length > 0;
  const v = hV ? p.variants[cVar || 0] : null;
  const priceVal = v?.price ?? p.price ?? 0;
  const priceFormatted = fCur(priceVal) + (p.unit ? ` / ${p.unit}` : '');
  const imgUrl = (v?.img || p.img || '').trim();
  const descClean = (p.desc || '').trim();

  // Buat direct link pembelian/detail produk
  const u = new URL(window.location.origin + window.location.pathname);
  u.searchParams.set('p', p.id);
  const directUrl = u.href;

  // Format pesan WhatsApp & Media Sosial yang rapi, lengkap dengan nama, harga, gambar/foto, deskripsi & link
  let rawText = `🛍️ *${p.name}*\n💰 *Harga:* ${priceFormatted}\n`;
  if (imgUrl && !imgUrl.startsWith('data:')) {
    rawText += `🖼️ *Foto Produk:* ${imgUrl}\n`;
  }
  rawText += `\n📝 *Deskripsi:*\n${descClean || '-'}\n\n👉 *Beli / Lihat Detail Disini:*\n${directUrl}`;

  return {
    id: p.id,
    name: p.name,
    price: priceFormatted,
    desc: descClean,
    img: imgUrl,
    url: directUrl,
    rawText: rawText
  };
};

window.shareProduct = (productOrId) => {
  const data = getProductShareData(productOrId);
  if (!data) return;
  currentShareData = data;

  // Isi data ke modal pratinjau share
  const imgEl = el('share-preview-img');
  if (imgEl) {
    imgEl.src = data.img || 'https://placehold.co/100x100?text=No+Image';
  }
  setIn('share-preview-title', data.name);
  setIn('share-preview-price', data.price);
  setIn('share-preview-desc', data.desc || 'Tanpa deskripsi tambahan.');
  setIn('share-preview-url', data.url);
  setIn('share-preview-rawtext', data.rawText);

  // Buka modal share
  const m = el('share-product-modal'), c = el('share-product-content');
  if (m && c) {
    show('share-product-modal');
    setTimeout(() => {
      m.classList.remove('opacity-0');
      c.classList.remove('translate-y-full', 'sm:translate-y-5');
    }, 10);
  }
};

window.closeShareModal = () => {
  const m = el('share-product-modal'), c = el('share-product-content');
  if (m && c) {
    m.classList.add('opacity-0');
    c.classList.add('translate-y-full', 'sm:translate-y-5');
    setTimeout(() => hide('share-product-modal'), 300);
  }
};

window.downloadShareImage = async () => {
  if (!currentShareData || !currentShareData.img) {
    showToast("Gambar produk tidak tersedia");
    return;
  }
  try {
    const a = document.createElement('a');
    a.href = currentShareData.img;
    a.download = `${(currentShareData.name || 'produk').replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Membuka / Mengunduh foto...");
  } catch (e) {
    window.open(currentShareData.img, '_blank');
  }
};

window.shareViaWhatsApp = () => {
  if (!currentShareData) return;
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(currentShareData.rawText)}`;
  window.open(waUrl, '_blank');
};

window.shareViaNative = async () => {
  if (!currentShareData) return;
  if (navigator.share) {
    let sharePayload = {
      title: currentShareData.name,
      text: currentShareData.rawText,
      url: currentShareData.url
    };

    // Upayakan lampirkan file gambar asli jika didukung browser HP
    if (currentShareData.img && navigator.canShare && !currentShareData.img.startsWith('data:')) {
      try {
        const res = await fetch(currentShareData.img, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const ext = blob.type.split('/')[1] || 'jpg';
          const file = new File([blob], `${currentShareData.name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`, { type: blob.type });
          if (navigator.canShare({ files: [file] })) {
            sharePayload.files = [file];
          }
        }
      } catch (err) {
        // Fallback ke payload teks jika CORS tidak mengizinkan fetch
      }
    }

    try {
      await navigator.share(sharePayload);
    } catch (e) {
      if (e.name !== 'AbortError') {
        copyShareText();
      }
    }
  } else {
    copyShareText();
  }
};

window.copyShareText = () => {
  if (!currentShareData) return;
  const text = currentShareData.rawText;
  const copyProses = () => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("Teks & Link Produk disalin!");
    } catch (err) {
      showToast("Gagal menyalin teks.");
    }
    document.body.removeChild(textArea);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Teks & Link Produk disalin!");
    }).catch(() => copyProses());
  } else {
    copyProses();
  }
};

window.copyShareLink = () => {
  if (!currentShareData) return;
  const link = currentShareData.url;
  const copyProses = () => {
    const textArea = document.createElement("textarea");
    textArea.value = link;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("Link Produk disalin!");
    } catch (err) {
      showToast("Gagal menyalin link.");
    }
    document.body.removeChild(textArea);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(link).then(() => {
      showToast("Link Produk disalin!");
    }).catch(() => copyProses());
  } else {
    copyProses();
  }
};

const rProdMod = () => {
  if (!cProd) return;
  let p = cProd;
  let a = p.isActive !== 'false' && p.isActive !== false;
  let hV = p.variants?.length > 0;
  let v = hV ? p.variants[cVar] : null;
  
  const i = el('product-modal-img');
  if (i) {
    i.style.opacity = 0;
    setTimeout(() => {
      i.src = (v?.img || p.img || '');
      i.style.opacity = 1;
    }, 150);
  }
  
  setIn('product-modal-title', p.name);
  setH('product-modal-price', `
    <div class="flex items-baseline gap-2 flex-wrap">
      <span class="text-emerald-600 dark:text-emerald-400 font-black text-2xl sm:text-3xl">${fCur(v?.price ?? p.price)}</span>
      ${p.unit ? `<span class="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-wider">/ ${esc(p.unit)}</span>` : ''}
    </div>
  `);
  setIn('product-modal-desc', p.desc || '-');
  
  setH('product-modal-badges', `
    <span class="badge badge-xs badge-slate badge-normal-case">
      <i class="fa-solid fa-barcode"></i> ${esc(v?.sku || p.sku || '-')}
    </span>
    <span class="badge badge-xs badge-indigo badge-normal-case">
      <i class="fa-solid fa-check"></i> Official
    </span>
    ${p.wholesale?.length ? `<span class="badge badge-xs badge-amber"><i class="fa-solid fa-tags"></i> Grosir</span>` : ''}
  `);
  
  setH('product-modal-wholesale-container', p.wholesale?.length ? `
    <div class="mb-4 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-4">
      <p class="text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-2 uppercase tracking-widest"><i class="fa-solid fa-tags mr-1"></i> Harga Grosir</p>
      <div class="flex flex-col gap-1.5">
      ${p.wholesale.slice().sort((a, b) => a.minQty - b.minQty).map(w => `
        <div class="flex justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <span class="font-bold text-slate-600 dark:text-slate-300">&gt;= ${w.minQty}${p.unit ? ' '+p.unit : ''}</span>
          <span class="font-bold text-emerald-600 dark:text-emerald-400">${fCur(w.price)}</span>
        </div>
      `).join('')}
      </div>
    </div>
  ` : '');
  
  const isUnlimited = (appData.store?.stockMode === 'unlimited') || p.isUnlimited === true || p.isUnlimited === 'true' || (hV && (v?.isUnlimited === true || v?.isUnlimited === 'true'));
  const curStock = hV ? (v?.stock) : p.stock;
  const isOutOfStock = !isUnlimited && (curStock !== undefined && curStock !== null && curStock !== '' && Number(curStock) <= 0);

  if (isOutOfStock) {
    hide('modal-active-controls');
    show('modal-inactive-controls');
    const inActTxt = el('modal-inactive-controls');
    if (inActTxt) {
      inActTxt.innerHTML = `
        <div class="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 text-center text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 shadow-xs">
          <i class="fa-solid fa-box-open text-base"></i>
          <span>Stok item ini sedang kosong. Silakan hubungi admin toko.</span>
        </div>
      `;
    }
  } else {
    show('modal-active-controls');
    hide('modal-inactive-controls');
  }

  if (hV) {
    show('product-modal-options-container');
    setH('product-modal-options', p.variants.map((r, x) => {
      const vStock = !isUnlimited && (r.stock !== undefined && r.stock !== null && r.stock !== '' && Number(r.stock) <= 0);
      return `
      <button class="px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${x === cVar ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-600'}" onclick="selectVariant(${x})">
        <span>${esc(r.name)}</span>
        ${vStock ? `<span class="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">Habis</span>` : ''}
      </button>
      `;
    }).join(''));
  } else {
    hide('product-modal-options-container');
  }
  uMPP();
};

const uMPP = () => {
  if (!cProd) return;
  let v = (cProd.variants || [])[cVar];
  let p = v?.price ?? cProd.price;
  let e = p;
  let eQ = cart.find(c => c.id === cProd.id)?.qty || 0;
  let tQ = cQty + eQ;
  
  if (cProd.wholesale?.length) {
    for (let w of cProd.wholesale.slice().sort((a, b) => b.minQty - a.minQty)) {
      if (tQ >= w.minQty) { e = w.price; break; }
    }
  }
  setIn('btn-modal-price-preview', fCur(e * cQty));
};

window.updateModalQty = c => { 
  let current = cQty;
  let isDecimal = !Number.isInteger(current) || current < 1;
  let step = (cProd?.unit && ['kg', 'gram', 'ons', 'meter', 'liter', 'm', 'l'].includes(cProd.unit.toLowerCase()) && isDecimal) ? 0.25 : 1;
  let next = parseFloat((current + (c * step)).toFixed(2));
  cQty = Math.max(0.01, next); 
  setV('modal-qty-input', cQty); 
  uMPP(); 
};

window.handleModalQtyChange = v => { 
  let parsed = parseFloat(v);
  if (isNaN(parsed) || parsed <= 0) parsed = 1;
  cQty = parseFloat(parsed.toFixed(2)); 
  setV('modal-qty-input', cQty); 
  uMPP(); 
};

window.selectVariant = i => { cVar = i; rProdMod(); };

// =============================================================================
// STOREFRONT BUYER GUIDE & CUSTOMER HELP SYSTEM
// =============================================================================

const buyerGuideTopicsData = {
  order_flow: {
    title: 'Panduan Cara Membuat Pesanan Online',
    icon: 'fa-cart-shopping',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-circle-check"></i> Alur Belanja Cepat & Praktis
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Pesan produk langsung dari katalog toko kami dalam beberapa langkah mudah. Pesanan otomatis tersimpan di sistem dan Anda langsung terhubung ke WhatsApp CS toko.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">1</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Pilih Produk & Varian</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Cari barang favorit Anda, pilih varian jika ada (ukuran, warna, rasa), lalu tentukan jumlah pesanan.</p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">2</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Masuk Keranjang & Voucher</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Tekan "Masuk Keranjang". Di keranjang, Anda bisa memasukkan kode kupon diskon promo jika ada.</p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">3</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Pengiriman & Titik GPS</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Pilih diantar kurir (klik tombol Deteksi GPS agar ongkir akurat) atau ambil sendiri di toko (Bebas Ongkir).</p>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 flex gap-3 items-start">
            <div class="w-8 h-8 rounded-xl text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm" style="background-color:var(--clr-p)">4</div>
            <div>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Pembayaran & Invoice WhatsApp</h5>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Pilih bayar via QRIS, Transfer Bank, atau COD. Pesanan langsung masuk ke sistem & WhatsApp toko!</p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  stock_info: {
    title: 'Informasi Stok & Ketersediaan Produk',
    icon: 'fa-box-open',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-boxes-stacked"></i> Status Ketersediaan Stok Realtime
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Katalog toko kami selalu menyinkronkan data ketersediaan barang secara realtime agar Anda selalu mendapatkan informasi stok yang akurat.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 uppercase">Ready Stock</span>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs">Produk Tersedia</h5>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Produk dengan stok siap kirim dapat langsung Anda masukkan ke keranjang belanja dan diproses checkout secara instan.
            </p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 uppercase">Stok Habis</span>
              <h5 class="font-bold text-slate-900 dark:text-white text-xs">Stok Sedang Kosong</h5>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Produk yang stoknya habis <b>tetap dapat Anda lihat spesifikasi dan harganya</b> di katalog. Anda dapat menghubungi CS kami via WhatsApp untuk menanyakan jadwal restock atau pre-order.
            </p>
          </div>
        </div>

        <div class="p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06);color:var(--clr-p)">
          <i class="fa-solid fa-bell text-amber-500 text-sm"></i>
          <span>Jika suatu produk memiliki varian, Anda dapat memilih varian lain yang masih memiliki sisa stok tersedia.</span>
        </div>
      </div>
    `
  },
  variants: {
    title: 'Panduan Memilih Multi-Varian Produk',
    icon: 'fa-layer-group',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-tags"></i> Ragam Pilihan Warna, Ukuran & Rasa
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Satu produk bisa memiliki beberapa pilihan varian. Setiap varian memiliki harga, foto, dan stok masing-masing.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">1</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Pilih Varian</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Ketuk tombol varian yang Anda inginkan pada pop-up produk (contoh: Size L, Warna Hitam, 500g).</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">2</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Harga Otomatis Update</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Nominal harga dan subtotal akan langsung berganti otomatis mengikuti varian yang aktif.</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">3</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Beli Varian Berbeda</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Anda bisa memasukkan beberapa varian berbeda dari produk yang sama ke keranjang belanja Anda.</p>
          </div>
        </div>
      </div>
    `
  },
  wholesale: {
    title: 'Panduan Cara Mendapatkan Harga Grosir Bertingkat',
    icon: 'fa-tags',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-arrow-down-wide-short"></i> Beli Banyak Makin Hemat & Murah
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Sistem otomatis menerapkan harga grosir jika jumlah pesanan Anda memenuhi batas minimal kuota pembelian.
          </p>
        </div>

        <div class="space-y-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs mb-2.5">Simulasi Harga Bertingkat:</h5>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between items-center p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span class="text-slate-600 dark:text-slate-300 font-medium">Beli 1 - 4 pcs (Eceran Normal)</span>
                <span class="font-bold text-slate-900 dark:text-white">Rp 50.000 / pcs</span>
              </div>
              <div class="flex justify-between items-center p-2.5 rounded-xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.08)">
                <span class="font-bold" style="color:var(--clr-p)">Beli Min 5 pcs (Grosir Tier 1)</span>
                <span class="font-black text-sm" style="color:var(--clr-p)">Rp 45.000 / pcs</span>
              </div>
              <div class="flex justify-between items-center p-2.5 rounded-xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.08)">
                <span class="font-bold" style="color:var(--clr-p)">Beli Min 20 pcs (Grosir Tier 2)</span>
                <span class="font-black text-sm" style="color:var(--clr-p)">Rp 40.000 / pcs</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06);color:var(--clr-p)">
            <i class="fa-solid fa-sparkles text-amber-500 text-sm"></i>
            <span>Badge "GROSIR" otomatis muncul di keranjang belanja saat jumlah item mencapai batas grosir!</span>
          </div>
        </div>
      </div>
    `
  },
  decimal: {
    title: 'Panduan Pembelian Jumlah Koma / Desimal (Kg, Meter, Liter)',
    icon: 'fa-scale-balanced',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-scale-balanced"></i> Satuan Timbangan & Ukuran Koma Bebas
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Untuk produk dengan satuan kiloan (kg), ons, gram, meteran, atau literan, Anda bebas membeli pecahan seperti 0.5 kg (setengah kilo).
          </p>
        </div>

        <div class="space-y-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Cara Mengisi Jumlah Desimal:</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400">Ketik angka desimal langsung pada kotak jumlah barang di pop-up produk:</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center">
                <span class="font-bold block text-sm" style="color:var(--clr-p)">0.5</span>
                <span class="text-[10px] text-slate-400">1/2 kg atau 1/2 m</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center">
                <span class="font-bold block text-sm" style="color:var(--clr-p)">1.5</span>
                <span class="text-[10px] text-slate-400">1.5 kg / meter</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center">
                <span class="font-bold block text-sm" style="color:var(--clr-p)">0.25</span>
                <span class="text-[10px] text-slate-400">250 gram / 1/4 kg</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center">
                <span class="font-bold block text-sm" style="color:var(--clr-p)">2.75</span>
                <span class="text-[10px] text-slate-400">2.75 kg / meter</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06);color:var(--clr-p)">
            <i class="fa-solid fa-calculator text-amber-500 text-sm"></i>
            <span>Subtotal dikalikan otomatis secara presisi matematis tanpa pembulatan yang merugikan.</span>
          </div>
        </div>
      </div>
    `
  },
  voucher: {
    title: 'Panduan Klaim & Menggunakan Kupon Diskon Promo',
    icon: 'fa-ticket',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-percent"></i> Belanja Lebih Hemat dengan Kupon
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Gunakan kode kupon promo untuk mendapatkan potongan persentase (%) produk atau gratis/potongan ongkir (Rp).
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">1</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Cek Voucher di Beranda</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Lihat daftar kupon di halaman depan, lalu klik "Salin Kode" pada voucher yang tersedia.</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">2</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Tempel di Keranjang</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Masukkan kode kupon pada kolom voucher keranjang belanja atau halaman checkout.</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-7 h-7 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-sm" style="background-color:var(--clr-p)">3</div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Diskon Terpotong</h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Total tagihan belanja Anda akan langsung berkurang seketika!</p>
          </div>
        </div>
      </div>
    `
  },
  shipping: {
    title: 'Panduan Pengiriman & Deteksi Titik GPS',
    icon: 'fa-motorcycle',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-location-dot"></i> Pilihan Pengantaran Cepat & Tepat
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Pilih metode pengantaran kurir toko dengan perhitungan ongkir per kilometer akurat, atau ambil sendiri langsung di toko.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <i class="fa-solid fa-motorcycle" style="color:var(--clr-p)"></i> Opsi Diantar Kurir:
            </h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pesanan diantar langsung oleh kurir toko ke alamat Anda. Klik tombol <b>"Deteksi Lokasi GPS"</b> agar sistem membaca titik rumah Anda dan menghitung ongkir per KM secara transparan.
            </p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <i class="fa-solid fa-store" style="color:var(--clr-p)"></i> Opsi Ambil di Toko:
            </h5>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Anda bisa mengambil barang pesanan langsung di gerai toko kami. <b>100% Bebas Ongkir (Gratis)</b>. Anda tinggal datang dan menunjukkan nomor invoice pesanan.
            </p>
          </div>
        </div>
      </div>
    `
  },
  payment: {
    title: 'Panduan Pembayaran (QRIS, Transfer Bank & COD)',
    icon: 'fa-wallet',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-shield-halved"></i> Transaksi Praktis, Aman & Terpercaya
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Tersedia metode pembayaran digital instan maupun bayar tunai di tempat saat barang sampai.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm" style="background-color:var(--clr-p-bg);color:var(--clr-p)">
              <i class="fa-solid fa-qrcode"></i>
            </div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">QRIS Digital</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Scan QRIS dari aplikasi GoPay, OVO, Dana, ShopeePay, LinkAja, atau Mobile Banking BCA/Mandiri/BRI/BNI.</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm" style="background-color:var(--clr-p-bg);color:var(--clr-p)">
              <i class="fa-solid fa-building-columns"></i>
            </div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Transfer Bank</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Transfer ke rekening bank toko, lalu unggah foto bukti transfer saat checkout pesanan.</p>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm" style="background-color:var(--clr-p-bg);color:var(--clr-p)">
              <i class="fa-solid fa-hand-holding-dollar"></i>
            </div>
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">COD (Bayar di Tempat)</h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Bayar tunai langsung kepada kurir toko saat barang telah Anda terima di lokasi tujuan.</p>
          </div>
        </div>
      </div>
    `
  },
  tracking: {
    title: 'Panduan Lacak Status Pesanan & Hubungi CS Toko',
    icon: 'fa-headset',
    content: `
      <div class="space-y-4 text-xs sm:text-sm">
        <div class="p-4 rounded-2xl border" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06)">
          <h4 class="font-bold text-sm mb-1.5 flex items-center gap-2" style="color:var(--clr-p)">
            <i class="fa-solid fa-headset"></i> Layanan Bantuan & Tracking Pesanan
          </h4>
          <p class="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
            Pantau proses pesanan Anda secara realtime dan hubungi tim CS kami jika memerlukan bantuan.
          </p>
        </div>

        <div class="space-y-3">
          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <h5 class="font-bold text-slate-900 dark:text-white text-xs">Tahapan Status Pesanan Anda:</h5>
            <div class="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div class="flex items-center gap-2">
                <span class="badge badge-ribbon-inset badge-solid-rose shrink-0">BARU</span>
                <span>Pesanan masuk ke sistem dan menunggu konfirmasi toko.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-ribbon-inset badge-solid-amber shrink-0">DIPROSES</span>
                <span>Barang sedang disiapkan dan dikemas rapi oleh tim toko.</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-ribbon-inset badge-solid-emerald shrink-0">SELESAI</span>
                <span>Pesanan telah dikirim kurir atau telah Anda ambil di toko.</span>
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-semibold" style="background-color:var(--clr-p-bg);border-color:rgba(0,0,0,0.06);color:var(--clr-p)">
            <i class="fa-brands fa-whatsapp text-lg"></i>
            <span>Ada pertanyaan khusus? Klik tombol WhatsApp di website untuk langsung chat dengan admin toko!</span>
          </div>
        </div>
      </div>
    `
  }
};

window.openBuyerGuide = (topic = 'order_flow') => {
  const m = el('buyer-guide-modal');
  const box = el('buyer-guide-modal-box');
  if (!m || !box) return;
  m.classList.remove('hidden');
  setTimeout(() => {
    m.classList.remove('opacity-0');
    box.classList.remove('translate-y-full');
    box.classList.remove('sm:scale-95');
  }, 10);
  window.showBuyerGuideTopic(topic);
};

window.closeBuyerGuide = () => {
  const m = el('buyer-guide-modal');
  const box = el('buyer-guide-modal-box');
  if (!m || !box) return;
  m.classList.add('opacity-0');
  box.classList.add('translate-y-full');
  box.classList.add('sm:scale-95');
  setTimeout(() => m.classList.add('hidden'), 300);
};

window.showBuyerGuideTopic = (topic) => {
  let target = topic;
  if (!buyerGuideTopicsData[target]) {
    target = 'order_flow';
  }

  // Update active pill buttons with dynamic theme styling
  document.querySelectorAll('.bguide-topic-btn').forEach(btn => {
    btn.style.backgroundColor = '';
    btn.style.color = '';
    btn.classList.remove('shadow-sm', 'text-white');
    btn.classList.add('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-200/60', 'dark:hover:bg-slate-800');
  });

  const activeBtn = el(`bguide-btn-${target}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-600', 'dark:text-slate-300', 'hover:bg-slate-200/60', 'dark:hover:bg-slate-800');
    activeBtn.classList.add('shadow-sm', 'text-white');
    activeBtn.style.backgroundColor = 'var(--clr-p)';
    activeBtn.style.color = '#ffffff';
    try {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } catch(e) {}
  }

  const data = buyerGuideTopicsData[target];
  const container = el('buyer-guide-content');
  if (container && data) {
    container.innerHTML = `
      <div class="space-y-4 fade-in">
        <div class="flex items-center gap-3.5 pb-3.5 border-b border-slate-100 dark:border-slate-700/60">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm" style="background-color:var(--clr-p-bg);color:var(--clr-p)">
            <i class="fa-solid ${data.icon}"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">${data.title}</h4>
            <p class="text-[10px] sm:text-xs text-slate-400 font-medium">Panduan Resmi Pelanggan Toko Grafika</p>
          </div>
        </div>
        ${data.content}
      </div>
    `;
  }
};


