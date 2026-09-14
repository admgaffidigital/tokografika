// Changelog Fetching & Rendering Logic
window.openChangelogModal = async () => {
  const m = document.getElementById('changelog-modal');
  const b = document.getElementById('changelog-modal-box');
  const c = document.getElementById('changelog-content');
  if (!m || !b || !c) return;

  m.classList.remove('hidden');
  m.classList.add('flex');
  setTimeout(() => {
    m.classList.remove('opacity-0');
    b.classList.remove('scale-95');
  }, 10);

  // Use cached changelog if available
  const cached = sessionStorage.getItem('tokografika_changelog');
  if (cached) {
    c.innerHTML = cached;
    return;
  }

  c.innerHTML = `
    <div class="flex items-center justify-center py-10 flex-col gap-3">
      <div class="animate-spin text-indigo-500 text-2xl">
        <i class="fa-solid fa-circle-notch"></i>
      </div>
      <p class="text-xs text-slate-500 font-bold animate-pulse">Mengambil data terbaru...</p>
    </div>
  `;

  try {
    const res = await fetch('https://api.github.com/repos/admgaffidigital/tokografika/commits?per_page=15');
    if (!res.ok) throw new Error('Network response was not ok');
    const data = await res.json();
    
    let html = '<div class="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">';
    
    data.forEach((commit, i) => {
      const date = new Date(commit.commit.author.date).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
      const msg = commit.commit.message.split('\n')[0];
      
      // Determine badge color based on conventional commits
      let badgeType = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      let icon = 'fa-code-commit';
      
      if (msg.toLowerCase().startsWith('feat')) {
        badgeType = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
        icon = 'fa-wand-magic-sparkles';
      } else if (msg.toLowerCase().startsWith('fix')) {
        badgeType = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
        icon = 'fa-bug-slash';
      } else if (msg.toLowerCase().startsWith('style') || msg.toLowerCase().startsWith('ui')) {
        badgeType = 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400';
        icon = 'fa-palette';
      }

      html += `
        <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div class="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 ${badgeType} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
            <i class="fa-solid ${icon} text-xs"></i>
          </div>
          <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-xs hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500">${date}</span>
            </div>
            <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">${msg}</p>
          </div>
        </div>
      `;
    });
    html += '</div>';
    
    c.innerHTML = html;
    sessionStorage.setItem('tokografika_changelog', html);

  } catch (error) {
    c.innerHTML = `
      <div class="flex items-center justify-center py-10 flex-col gap-3 text-center">
        <div class="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center text-xl">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Gagal Memuat Riwayat</p>
          <p class="text-xs text-slate-500 mt-1">Silakan coba beberapa saat lagi.</p>
        </div>
      </div>
    `;
  }
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
