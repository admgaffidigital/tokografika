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
  if (mapEl) {
    if (appData.store.lat && appData.store.lng) {
      mapEl.href = `https://www.google.com/maps?q=${appData.store.lat},${appData.store.lng}`;
    } else {
      mapEl.href = `https://www.google.com/maps?q=${encodeURIComponent(appData.store.address || 'Toko')}`;
    }
  }
  
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

  // Render Menu Kategori
  const cL = [{ name: 'Semua Produk', img: appData.store.allProductsIcon || 'https://placehold.co/150/10b981/ffffff?text=All' }, ...(appData.categories || [])];
  
  setH('dynamic-categories-container', cL.map(c => 
    appData.store.categoryStyle === 'text' 
    ? `
    <div onclick="filterCategory(decodeURIComponent('${encodeURIComponent(c.name).replace(/'/g, "%27")}'))" class="cursor-pointer shrink-0 snap-start">
      <div class="px-4 py-2 rounded-full border-2 border-slate-200 dark:border-slate-700 ${aCat === c.name ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'} transition-all font-bold text-[10px] sm:text-xs text-center uppercase tracking-wider">
        ${esc(c.name)}
      </div>
    </div>
    ` 
    : `
    <div onclick="filterCategory(decodeURIComponent('${encodeURIComponent(c.name).replace(/'/g, "%27")}'))" class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 w-[64px] group snap-start">
      <div class="relative w-12 h-12 rounded-xl bg-white dark:bg-slate-800 transition-transform group-hover:-translate-y-1 ${aCat === c.name ? 'border-2 border-emerald-500 shadow-md' : 'border-2 border-slate-200 dark:border-slate-700 shadow-sm'}">
        <img data-src="${esc(c.img)}" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==" onerror="this.onerror=null;this.src='https://placehold.co/150/10b981/ffffff?text=Cat'" class="lazy-load opacity-0 transition-all duration-700 absolute inset-0 w-full h-full object-cover rounded-xl"/>
      </div>
      <span class="text-[9px] text-center w-full line-clamp-2 leading-tight px-1 ${aCat === c.name ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'font-bold text-slate-500 dark:text-slate-400'} uppercase">
        ${esc(c.name)}
      </span>
    </div>
    `
  ).join(''));
  
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
  let f = appData.products.filter(p => {
    if (aCat !== 'Semua Produk' && p.category !== aCat) return false;
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
    let a = p.isActive !== 'false' && p.isActive !== false;
    let nH = !a ? `<div class="absolute top-1.5 right-1.5 z-20"><span class="bg-rose-600/90 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">HABIS</span></div>` : '';
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
          <img data-src="${esc(p.img)}" src="${svgPlaceholder}" onerror="window.imgErrRetry(this,'No Image',400)" class="lazy-load opacity-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${!a ? 'grayscale' : ''}"/>
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
          <img data-src="${esc(p.img)}" src="${svgPlaceholder}" onerror="window.imgErrRetry(this,'No Image',400)" class="lazy-load opacity-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${!a ? 'grayscale' : ''}"/>
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
  const p = appData.products.find(x => x.id === i);
  if (!p) return;
  cProd = p; cVar = 0; cQty = 1; 
  setV('modal-qty-input', 1); 
  rProdMod();
  
  const m = el('product-modal'), c = el('product-modal-content');
  if (m && c) {
    if (m.classList.contains('hidden')) {
      history.pushState({ modal: 'product' }, '', '');
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
  }
};

window.shareProduct = async () => {
  if (!cProd) return;
  const u = new URL(window.location.href);
  u.searchParams.set('p', cProd.id);
  if (navigator.share) {
    try {
      await navigator.share({ title: cProd.name, text: `Cek ${cProd.name}`, url: u.href });
    } catch (e) {}
  } else {
    const e = document.createElement('textarea');
    e.value = u.href;
    document.body.appendChild(e);
    e.select();
    document.execCommand('copy');
    document.body.removeChild(e);
    showToast("Link disalin!");
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
  
  if (a) {
    show('modal-active-controls');
    hide('modal-inactive-controls');
    if (hV) {
      show('product-modal-options-container');
      setH('product-modal-options', p.variants.map((r, x) => `
        <button class="px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${x === cVar ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-600'}" onclick="selectVariant(${x})">
          ${esc(r.name)}
        </button>
      `).join(''));
    } else {
      hide('product-modal-options-container');
    }
  } else {
    hide('modal-active-controls');
    show('modal-inactive-controls');
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

window.updateModalQty = c => { cQty = Math.max(1, cQty + c); setV('modal-qty-input', cQty); uMPP(); };
window.handleModalQtyChange = v => { cQty = Math.max(1, parseInt(v) || 1); setV('modal-qty-input', cQty); uMPP(); };
window.selectVariant = i => { cVar = i; rProdMod(); };
