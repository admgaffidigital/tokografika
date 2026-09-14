// Changelog Fetching & Rendering Logic
window.fetchChangelogData = async (force = false) => {
  const c = document.getElementById('changelog-content');
  const btnRefresh = document.getElementById('btn-refresh-changelog');
  if (!c) return;

  const refreshIcon = btnRefresh?.querySelector('i');
  if (refreshIcon) refreshIcon.classList.add('fa-spin');

  // If force is false and we have cached data, display it first (Stale-While-Revalidate)
  const cached = sessionStorage.getItem('tokografika_changelog');
  if (cached && !force && c.children.length > 0 && !c.querySelector('.animate-spin')) {
    // Already showing something
  } else if (cached && !force) {
    c.innerHTML = cached;
  } else {
    c.innerHTML = `
      <div class="flex items-center justify-center py-10 flex-col gap-3">
        <div class="animate-spin text-indigo-500 text-2xl">
          <i class="fa-solid fa-circle-notch"></i>
        </div>
        <p class="text-xs text-slate-500 font-bold animate-pulse">Memuat riwayat pembaruan...</p>
      </div>
    `;
  }

  try {
    // Query with sha=main and timestamp to bypass browser cache completely
    const timestamp = Date.now();
    let res = await fetch(`https://api.github.com/repos/admgaffidigital/tokografika/commits?sha=main&per_page=20&_t=${timestamp}`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    
    // Fallback without sha if main isn't found
    if (!res.ok && res.status !== 403) {
      res = await fetch(`https://api.github.com/repos/admgaffidigital/tokografika/commits?per_page=20&_t=${timestamp}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
    }

    if (!res.ok) {
      if (res.status === 403 && cached) {
        c.innerHTML = cached;
        if (typeof showToast === 'function') showToast('Limit GitHub API, menampilkan cache.');
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
      throw new Error('Format data tidak valid');
    }

    let html = '<div class="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">';
    
    data.forEach((commit, i) => {
      const date = new Date(commit.commit.author.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const rawMsg = commit.commit.message || '';
      const msg = rawMsg.split('\n')[0];
      const desc = rawMsg.split('\n').slice(1).filter(l => l.trim()).join(' ');
      
      // Determine badge styling based on conventional commits
      let badgeType = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      let icon = 'fa-code-commit';
      let tag = 'Update';

      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.startsWith('feat')) {
        badgeType = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
        icon = 'fa-wand-magic-sparkles';
        tag = 'Fitur Baru';
      } else if (lowerMsg.startsWith('fix')) {
        badgeType = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
        icon = 'fa-bug-slash';
        tag = 'Perbaikan';
      } else if (lowerMsg.startsWith('style') || lowerMsg.startsWith('ui')) {
        badgeType = 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
        icon = 'fa-palette';
        tag = 'Tampilan UI';
      }

      html += `
        <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 ${badgeType} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
            <i class="fa-solid ${icon} text-xs"></i>
          </div>
          <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-xs hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeType}">${tag}</span>
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500">${date}</span>
            </div>
            <p class="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-bold leading-snug">${typeof esc === 'function' ? esc(msg) : msg}</p>
            ${desc ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">${typeof esc === 'function' ? esc(desc) : desc}</p>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';

    c.innerHTML = html;
    sessionStorage.setItem('tokografika_changelog', html);
    if (force && typeof showToast === 'function') showToast('Riwayat berhasil diperbarui!');
  } catch (error) {
    console.warn('[Changelog] Gagal memuat riwayat:', error);
    if (cached) {
      c.innerHTML = cached;
      if (force && typeof showToast === 'function') showToast('Menampilkan data tersimpan.');
    } else {
      c.innerHTML = `
        <div class="flex items-center justify-center py-10 flex-col gap-3 text-center">
          <div class="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center text-xl">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Gagal Memuat Riwayat</p>
            <p class="text-xs text-slate-500 mt-1">Periksa koneksi internet Anda atau coba lagi nanti.</p>
          </div>
          <button type="button" onclick="fetchChangelogData(true)" class="btn-primary text-xs px-4 py-2 mt-2">
            <i class="fa-solid fa-rotate mr-1"></i> Coba Lagi
          </button>
        </div>
      `;
    }
  } finally {
    if (refreshIcon) refreshIcon.classList.remove('fa-spin');
  }
};

window.openChangelogModal = () => {
  const m = document.getElementById('changelog-modal');
  const b = document.getElementById('changelog-modal-box');
  if (!m || !b) return;

  m.classList.remove('hidden');
  m.classList.add('flex');
  setTimeout(() => {
    m.classList.remove('opacity-0');
    b.classList.remove('scale-95');
  }, 10);

  // Always revalidate when opened so it stays continuously up-to-date
  fetchChangelogData(false);
};

window.closeChangelogModal = () => {
  const m = document.getElementById('changelog-modal');
  const b = document.getElementById('changelog-modal-box');
  if (!m || !b) return;
  m.classList.add('opacity-0');
  b.classList.add('scale-95');
  setTimeout(() => {
    m.classList.add('hidden');
    m.classList.remove('flex');
  }, 300);
};
