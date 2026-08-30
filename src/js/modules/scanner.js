// =============================================================================
// FRESHMART SCANNER & HYBRID APP BRIDGE (KODULAR / APP INVENTOR)
// =============================================================================

window.openCameraScanner = (targetId = 'search-input') => {
  if (window.AppInventor) {
    window.AppInventor.setWebViewString("SCAN_BARCODE|||" + targetId);
  } else {
    show('scanner-modal');
    setTimeout(() => { el('scanner-modal').classList.remove('opacity-0'); }, 10);
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    setTimeout(() => {
      if (html5QrCode) {
        html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            let tEl = el(targetId);
            if (tEl) {
              tEl.value = decodedText;
              if (targetId === 'search-input') handleSearch(decodedText);
              else {
                tEl.dispatchEvent(new Event('input', { bubbles: true }));
                tEl.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
            showToast("Barcode discan!");
            closeCameraScanner();
          },
          (err) => {}
        ).catch(err => {
          showToast("Akses kamera ditolak/gagal!");
          closeCameraScanner();
        });
      }
    }, 100);
  }
};

window.closeCameraScanner = () => {
  el('scanner-modal').classList.add('opacity-0');
  if (html5QrCode) {
    try {
      if (html5QrCode.getState() === 2) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          html5QrCode = null;
        }).catch(e => {
          html5QrCode = null;
        });
      } else {
        html5QrCode.clear();
        html5QrCode = null;
      }
    } catch (err) {
      html5QrCode = null;
    }
  }
  setTimeout(() => {
    hide('scanner-modal');
  }, 300);
};

window.terimaBarcodeDariKodular = (targetId, hasilScan) => {
  let tEl = el(targetId);
  if (tEl) {
    tEl.value = hasilScan;
    if (targetId === 'search-input') handleSearch(hasilScan);
    else {
      tEl.dispatchEvent(new Event('input', { bubbles: true }));
      tEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    showToast("Barcode discan!");
  }
};

window.terimaGPSDariKodular = (lat, lng) => {
  cust.lat = parseFloat(lat);
  cust.lng = parseFloat(lng);
  hide('btn-location');
  show('location-status');
  el('location-status').classList.add('flex');
  showToast("GPS Didapat dari HP!");
};

window.terimaGambarDariKodular = (targetInputId, base64Url, varIndex) => {
  const targetInput = el(targetInputId);
  if (targetInput) {
    targetInput.value = base64Url;
    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
    if (varIndex !== null && varIndex !== 'null') uVar(parseInt(varIndex), 'img', base64Url);
    showToast("Gambar diatur dari HP!");
  }
};
