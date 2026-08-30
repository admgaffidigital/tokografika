// =============================================================================
// FRESHMART PRINT & PDF ENGINE (58MM THERMAL & A4 INVOICE / SURAT JALAN)
// =============================================================================

let currentPaperSize = localStorage.getItem('freshmart_printer_paper') || (window.appData?.store?.printerPaper) || '58';

window.setReceiptPaperSize = (size) => {
  currentPaperSize = (size === '80') ? '80' : '58';
  localStorage.setItem('freshmart_printer_paper', currentPaperSize);
  if (window.appData?.store) {
    window.appData.store.printerPaper = currentPaperSize;
  }
  updatePaperSizeButtons();
  renderReceiptContent(cVOrd);
  showToast(`Format struk diset ke ${currentPaperSize}mm`);
};

window.updatePaperSizeButtons = () => {
  const is80 = currentPaperSize === '80';
  const btn58 = el('btn-paper-58');
  const btn80 = el('btn-paper-80');
  const modalBox = el('receipt-preview-modal-box');
  const paperContent = el('receipt-paper-content');
  const btnPrint = el('btn-print-thermal-action');

  if (btn58) {
    btn58.className = is80 
      ? 'px-3 py-1 rounded-md transition-all text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900' 
      : 'px-3 py-1 rounded-md transition-all text-xs font-bold bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm';
  }
  if (btn80) {
    btn80.className = is80 
      ? 'px-3 py-1 rounded-md transition-all text-xs font-bold bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
      : 'px-3 py-1 rounded-md transition-all text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900';
  }
  if (modalBox) {
    modalBox.style.maxWidth = is80 ? '420px' : '340px';
  }
  if (paperContent) {
    paperContent.style.width = is80 ? '360px' : '260px';
    paperContent.style.fontSize = is80 ? '12px' : '11px';
  }
  if (btnPrint) {
    btnPrint.innerHTML = `<i class="fa-solid fa-print"></i> Print Thermal (${is80 ? '80mm' : '58mm'})`;
  }
};

const _generateReceiptBarcodeSvg = (codeStr) => {
  const clean = String(codeStr || '000000').toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Deterministic bar widths pattern for crisp visual supermarket barcode
  const pattern = [2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 2, 1, 1, 3, 1, 2, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 2, 1, 1, 3, 1, 2, 1];
  let x = 0;
  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    const w = pattern[i] * 1.4;
    if (i % 2 === 0) {
      rects += `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="30" fill="#000" />`;
    }
    x += w;
  }
  return `
    <div style="display:flex; flex-direction:column; align-items:center; margin: 8px 0 4px 0;">
      <svg width="${x.toFixed(0)}" height="30" viewBox="0 0 ${x.toFixed(0)} 30" style="max-width:100%; height:26px; display:block;">
        ${rects}
      </svg>
      <div style="font-size:9px; letter-spacing:2.5px; font-weight:bold; margin-top:2px; font-family:monospace;">*${clean}*</div>
    </div>
  `;
};

const _renderReceiptHtml = (o, paperSize = '58') => {
  if (!o) return '';
  const is80 = paperSize === '80';
  const len = is80 ? 48 : 32;
  const d = (o.dateString || o.createdAt) 
    ? new Date(o.dateString || o.createdAt).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    : new Date().toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const sN = (appData.store.name || "TOKO GRAFIKA").toUpperCase();
  const sSlogan = appData.store.slogan || "";
  const sAddr = appData.store.address || "";
  const sW = appData.store.wa || "";
  const sFooter = appData.store.footerText || "Terima kasih atas kunjungan Anda";
  
  const pL = (l, r, targetLen = len) => {
    const p = targetLen - l.length - r.length;
    return l + (p > 0 ? ' '.repeat(p) : ' ') + r;
  };

  const dLine = '='.repeat(len);
  const sLine = '-'.repeat(len);

  // Total items and total qty
  let totalQty = 0;
  let totalItemsCount = (o.items || []).length;
  (o.items || []).forEach(i => {
    totalQty += Number(i.qty || 1);
  });

  let h = `
    <div style="text-align:center; font-weight:900; font-size:${is80 ? '16px' : '13px'}; letter-spacing:0.5px; line-height:1.2; margin-bottom:2px;">${esc(sN)}</div>
    ${sSlogan ? `<div style="text-align:center; font-size:${is80 ? '11px' : '9px'}; font-weight:600; color:#333; margin-bottom:2px;">${esc(sSlogan)}</div>` : ''}
    ${sAddr ? `<div style="text-align:center; font-size:${is80 ? '10px' : '9px'}; color:#444; line-height:1.2; margin-bottom:2px; word-break:break-word;">${esc(sAddr)}</div>` : ''}
    ${sW ? `<div style="text-align:center; font-size:${is80 ? '11px' : '9px'}; font-weight:bold; margin-bottom:4px;">TELP/WA: ${esc(sW)}</div>` : ''}
    
    <div style="font-family:monospace; font-weight:bold; line-height:1; font-size:${is80 ? '11px' : '10px'}; margin: 4px 0;">${dLine}</div>
    
    <div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('No.Struk: #' + (o.orderId || o.id), '')}</div>
    <div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Waktu   : ' + d, '')}</div>
    <div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Kasir   : ' + esc(o.cashier || 'Admin / Kasir-1'), '')}</div>
    <div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Pelanggan: ' + esc(o.customer?.name || 'Umum / Walk-in').substring(0, is80 ? 30 : 16), '')}</div>
    <div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Layanan : ' + (o.type === 'pos' ? 'POS KASIR TOKO' : (o.customer?.deliveryMethod === 'delivery' ? 'PENGIRIMAN KURIR' : 'AMBIL DI TOKO')), '')}</div>
    ${o.customer?.note ? `<div style="white-space:pre-wrap; word-break:break-word; font-size:${is80 ? '11px' : '9.5px'}; line-height:1.3; color:#333; margin-top:2px;">Catatan : ${esc(o.customer.note)}</div>` : ''}

    <div style="font-family:monospace; font-weight:bold; line-height:1; font-size:${is80 ? '11px' : '10px'}; margin: 4px 0;">${sLine}</div>
  `;

  // Item Listings
  (o.items || []).forEach(i => {
    const rawName = esc(i.name) + (i.variantName ? ` (${esc(i.variantName)})` : '');
    const effP = i.effectivePrice || i.price || 0;
    const qty = i.qty || 1;
    const unit = i.unit ? ' ' + i.unit : '';
    const itemTotal = qty * effP;
    
    const qtyPriceStr = `${qty}${unit} x ${effP.toLocaleString('id-ID')}`;
    const totalStr = itemTotal.toLocaleString('id-ID');

    if (is80) {
      const truncatedName = rawName.substring(0, 48);
      h += `
        <div style="white-space:pre-wrap; font-weight:bold; font-size:12px; line-height:1.25; margin-top:3px; word-break:break-word;">${truncatedName}</div>
        <div style="white-space:pre; font-size:11.5px; line-height:1.3; margin-bottom:3px;">${pL('  ' + qtyPriceStr, totalStr, 48)}</div>
      `;
    } else {
      const truncatedName = rawName.substring(0, 32);
      h += `
        <div style="white-space:pre-wrap; font-weight:bold; font-size:10.5px; line-height:1.25; margin-top:2.5px; word-break:break-word;">${truncatedName}</div>
        <div style="white-space:pre; font-size:10px; line-height:1.3; margin-bottom:2.5px;">${pL(qtyPriceStr, totalStr, 32)}</div>
      `;
    }
  });

  const sub = o.payment?.subtotal || o.subtotal || 0;
  const grand = o.payment?.grandTotal || o.total || 0;
  const prodDisc = o.payment?.productDiscount || 0;
  const shipDisc = o.payment?.shippingDiscount || 0;
  const totalSavings = prodDisc + shipDisc;

  h += `
    <div style="font-family:monospace; font-weight:bold; line-height:1; font-size:${is80 ? '11px' : '10px'}; margin: 4px 0;">${sLine}</div>
    <div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Total Item / Qty', `${totalItemsCount} Brg / ${totalQty} Pcs`)}</div>
    <div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Subtotal', sub.toLocaleString('id-ID'))}</div>
  `;

  if (prodDisc > 0) {
    h += `<div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Diskon Promo', '-' + prodDisc.toLocaleString('id-ID'))}</div>`;
  }
  if (o.customer?.deliveryMethod !== 'pickup' && o.type !== 'pos') {
    h += `<div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Ongkos Kirim', (o.payment?.shippingCost || 0).toLocaleString('id-ID'))}</div>`;
  }
  if (shipDisc > 0) {
    h += `<div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Potongan Ongkir', '-' + shipDisc.toLocaleString('id-ID'))}</div>`;
  }

  h += `
    <div style="font-family:monospace; font-weight:bold; line-height:1; font-size:${is80 ? '11px' : '10px'}; margin: 4px 0;">${dLine}</div>
    <div style="white-space:pre; font-weight:900; font-size:${is80 ? '14px' : '12px'}; line-height:1.4;">${pL('TOTAL AKHIR', 'Rp ' + grand.toLocaleString('id-ID'))}</div>
    <div style="font-family:monospace; font-weight:bold; line-height:1; font-size:${is80 ? '11px' : '10px'}; margin: 4px 0;">${dLine}</div>
  `;

  const payMethod = String(o.payment?.method || 'TUNAI').toUpperCase();
  h += `<div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Metode Bayar', payMethod)}</div>`;

  if (o.payment?.cashReceived) {
    h += `<div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Bayar Tunai', o.payment.cashReceived.toLocaleString('id-ID'))}</div>`;
    h += `<div style="white-space:pre; font-size:${is80 ? '11px' : '10px'}; line-height:1.35;">${pL('Kembalian', (o.payment.change || 0).toLocaleString('id-ID'))}</div>`;
  }

  // Supermarket Savings Banner
  if (totalSavings > 0) {
    h += `
      <div style="margin: 6px 0; padding: 3px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; text-align:center; font-weight:900; font-size:${is80 ? '11px' : '9.5px'};">
        *** ANDA HEMAT: Rp ${totalSavings.toLocaleString('id-ID')} ***
      </div>
    `;
  }

  // Barcode and Authentic Supermarket Footer
  h += `
    ${_generateReceiptBarcodeSvg(o.orderId || o.id)}
    <div style="font-family:monospace; font-weight:bold; line-height:1; font-size:${is80 ? '11px' : '10px'}; margin: 4px 0;">${sLine}</div>
    <div style="text-align:center; font-weight:bold; font-size:${is80 ? '11px' : '9.5px'}; line-height:1.3; margin-top:2px;">
      ${esc(sFooter)}
    </div>
    <div style="text-align:center; font-size:${is80 ? '10px' : '8.5px'}; color:#555; line-height:1.3; margin-top:2px;">
      Barang yang sudah dibeli tidak dapat ditukar/dikembalikan
    </div>
    <div style="font-family:monospace; font-weight:bold; line-height:1; font-size:${is80 ? '11px' : '10px'}; margin: 4px 0;">${dLine}</div>
    <div style="text-align:center; font-size:${is80 ? '9.5px' : '8px'}; color:#777; margin-top:2px;">
      Powered by Toko Grafika POS &bull; www.tokografika.com
    </div>
    <div style="height:12px;"></div>
  `;

  return h;
};

window.renderReceiptContent = (orderId) => {
  const o = (typeof posLastOrder !== 'undefined' && posLastOrder && (posLastOrder.orderId === orderId || posLastOrder.id === orderId)) ? posLastOrder : gOrds.find(x => x.orderId === orderId);
  if (!o) return;
  const h = _renderReceiptHtml(o, currentPaperSize);
  setH('receipt-paper-content', h);
};

window.openReceiptPreview = (directOrder = null) => {
  if (directOrder) {
    cVOrd = directOrder.orderId || directOrder.id;
  }
  const o = directOrder || gOrds.find(x => x.orderId === cVOrd);
  if (!o) return;

  currentPaperSize = localStorage.getItem('freshmart_printer_paper') || (appData?.store?.printerPaper) || '58';
  updatePaperSizeButtons();
  renderReceiptContent(cVOrd);

  show('receipt-preview-modal');
  setTimeout(() => {
    el('receipt-preview-modal').classList.remove('opacity-0');
    el('receipt-preview-modal-box').classList.remove('scale-95');
  }, 10);
};

window.closeReceiptPreviewModal = () => {
  el('receipt-preview-modal').classList.add('opacity-0');
  el('receipt-preview-modal-box').classList.add('scale-95');
  setTimeout(() => hide('receipt-preview-modal'), 300);
};

window.executePrintReceipt = () => {
  const o = (typeof posLastOrder !== 'undefined' && posLastOrder && (posLastOrder.orderId === cVOrd || posLastOrder.id === cVOrd)) ? posLastOrder : gOrds.find(x => x.orderId === cVOrd);
  if (!o) return;

  const is80 = currentPaperSize === '80';
  const len = is80 ? 48 : 32;

  if (window.AppInventor) {
    try {
      const pC = t => {
        let s = String(t).substring(0, len);
        let sp = Math.max(0, Math.floor((len - s.length) / 2));
        return " ".repeat(sp) + s;
      };
      const pLR = (l, r) => {
        let ls = String(l);
        let rs = String(r);
        let ll = ls.substring(0, len - rs.length - 1);
        return ll + " ".repeat(Math.max(0, len - ll.length - rs.length)) + rs;
      };
      let sT = pC(appData.store.name || "TOKO GRAFIKA") + "\n";
      if (appData.store.slogan) sT += pC(appData.store.slogan) + "\n";
      if (appData.store.address) sT += pC(appData.store.address) + "\n";
      if (appData.store.wa) sT += pC("WA: " + appData.store.wa) + "\n";
      sT += "=".repeat(len) + "\n";
      sT += pLR("No.Struk: #" + (o.orderId || o.id), "") + "\n";
      let ds = (o.dateString || o.createdAt) ? new Date(o.dateString || o.createdAt).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('id-ID');
      sT += pLR("Waktu   : " + ds, "") + "\n";
      sT += pLR("Kasir   : " + (o.cashier || "Admin / Kasir-1"), "") + "\n";
      sT += pLR("Plg     : " + (o.customer?.name || "Umum").substring(0, is80 ? 28 : 18), "") + "\n";
      sT += pLR("Layanan : " + (o.type === 'pos' ? 'POS KASIR' : (o.customer?.deliveryMethod === 'delivery' ? 'KURIR' : 'AMBIL DI TOKO')), "") + "\n";
      sT += "-".repeat(len) + "\n";
      
      let totQ = 0;
      (o.items || []).forEach(i => {
        totQ += Number(i.qty || 1);
        let n = String(i.name);
        if (i.variantName) n += ` (${i.variantName})`;
        n = n.substring(0, len);
        sT += n + "\n";
        let q = `${i.qty} x ${(i.effectivePrice || 0).toLocaleString('id-ID')}`;
        let t = ((i.effectivePrice || 0) * (i.qty || 0)).toLocaleString('id-ID');
        sT += pLR(" " + q, t) + "\n";
      });
      sT += "-".repeat(len) + "\n";
      sT += pLR("Total Item / Qty", `${(o.items || []).length} Brg / ${totQ} Pcs`) + "\n";
      sT += pLR("Subtotal", (o.payment?.subtotal || 0).toLocaleString('id-ID')) + "\n";
      if (o.payment?.productDiscount) sT += pLR("Diskon Promo", "-" + o.payment.productDiscount.toLocaleString('id-ID')) + "\n";
      if (o.customer?.deliveryMethod !== 'pickup' && o.type !== 'pos') {
        sT += pLR("Ongkos Kirim", (o.payment?.shippingCost || 0).toLocaleString('id-ID')) + "\n";
      }
      if (o.payment?.shippingDiscount) sT += pLR("Pot. Ongkir", "-" + o.payment.shippingDiscount.toLocaleString('id-ID')) + "\n";
      sT += "=".repeat(len) + "\n";
      sT += pLR("TOTAL AKHIR", "Rp " + (o.payment?.grandTotal || 0).toLocaleString('id-ID')) + "\n";
      sT += "=".repeat(len) + "\n";
      sT += pLR("Metode Bayar", String(o.payment?.method || "TUNAI").toUpperCase()) + "\n";
      if (o.payment?.cashReceived) {
        sT += pLR("Bayar Tunai", (o.payment.cashReceived).toLocaleString('id-ID')) + "\n";
        sT += pLR("Kembalian", (o.payment.change || 0).toLocaleString('id-ID')) + "\n";
      }
      const savings = (o.payment?.productDiscount || 0) + (o.payment?.shippingDiscount || 0);
      if (savings > 0) {
        sT += "-".repeat(len) + "\n";
        sT += pC(`*** ANDA HEMAT: Rp ${savings.toLocaleString('id-ID')} ***`) + "\n";
      }
      sT += "-".repeat(len) + "\n";
      sT += pC(appData.store.footerText || "Terima Kasih Atas Kunjungan Anda") + "\n";
      sT += pC("Barang yang sudah dibeli") + "\n";
      sT += pC("tidak dapat ditukar/dikembalikan") + "\n\n\n\n";
      let b64 = btoa(unescape(encodeURIComponent(sT)));
      window.AppInventor.setWebViewString("PRINT_THERMAL|||base64," + b64);
      showToast(`Mengirim ke printer (${currentPaperSize}mm)...`);
    } catch (err) {
      showToast('Gagal memuat struk: error encode');
    }
  } else {
    if (is80) {
      document.body.classList.add('print-paper-80');
    } else {
      document.body.classList.remove('print-paper-80');
    }
    const p = el('receipt-paper-content').innerHTML, t = el('thermal-print-section');
    if (t) {
      t.innerHTML = p;
      window.print();
    }
  }
};

window.downloadReceiptImage = async () => {
  if (isSaving) return;
  isSaving = true;
  sLoad('Menyimpan Gambar...');
  try {
    const element = el('receipt-paper-content');
    const clone = element.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    document.body.appendChild(clone);
    
    const canvas = await html2canvas(clone, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true 
    });
    
    document.body.removeChild(clone);
    
    const link = document.createElement('a');
    link.download = `Struk_Pesanan_${cVOrd}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    showToast("Gambar berhasil disimpan!");
  } catch (error) {
    console.error(error);
    showToast("Gagal menyimpan gambar!");
  }
  isSaving = false;
  hLoad();
};

window.downloadReceiptPDF = async () => {
  if (isSaving) return;
  if (!window.jspdf) {
    showToast("Library PDF belum termuat!");
    return;
  }
  isSaving = true;
  sLoad('Menyimpan PDF...');
  try {
    const element = el('receipt-paper-content');
    const clone = element.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.left = '-9999px';
    clone.style.height = 'auto';
    clone.style.overflow = 'visible';
    document.body.appendChild(clone);
    
    const canvas = await html2canvas(clone, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true
    });
    
    document.body.removeChild(clone);
    
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    
    const pdfWidth = 58;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Struk_Pesanan_${cVOrd}.pdf`);
    
    showToast("PDF berhasil disimpan!");
  } catch (error) {
    console.error(error);
    showToast("Gagal menyimpan PDF!");
  }
  isSaving = false;
  hLoad();
};

window.togglePrintMenu = () => {
  const menu = document.getElementById('print-options-menu');
  if (menu) menu.classList.toggle('hidden');
};

window.closePreviewModal = () => {
  document.getElementById('pdf-preview-modal').classList.add('hidden');
  tempPdfData = null; 
};

window.executeDownloadPdf = () => {
  if (!tempPdfData) return;
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const a4Width = 210;
  const a4Height = 297;

  if (tempPdfData.pageCanvases && tempPdfData.pageCanvases.length > 0) {
    tempPdfData.pageCanvases.forEach((canvas, idx) => {
      const pageImgData = canvas.toDataURL('image/png');
      if (idx > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(pageImgData, 'PNG', 0, 0, a4Width, a4Height, undefined, 'FAST');
    });
  } else if (tempPdfData.imgData) {
    pdf.addImage(tempPdfData.imgData, 'PNG', 0, 0, a4Width, a4Height, undefined, 'FAST');
  }

  pdf.save(tempPdfData.fileName);
  showToast(tempPdfData.type === 'invoice' ? 'Invoice A4 berhasil diunduh!' : 'Surat Jalan A4 berhasil diunduh!');
  closePreviewModal();
};

window.executeDownloadImage = () => {
  if (!tempPdfData) return;
  if (tempPdfData.pageCanvases && tempPdfData.pageCanvases.length > 1) {
    // If multi-page, stitch vertically for single image download
    const firstCanvas = tempPdfData.pageCanvases[0];
    const totalHeight = tempPdfData.pageCanvases.reduce((sum, c) => sum + c.height, 0);
    const stitchCanvas = document.createElement('canvas');
    stitchCanvas.width = firstCanvas.width;
    stitchCanvas.height = totalHeight;
    const ctx = stitchCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, stitchCanvas.width, stitchCanvas.height);
    
    let currentY = 0;
    tempPdfData.pageCanvases.forEach(c => {
      ctx.drawImage(c, 0, currentY);
      currentY += c.height;
    });

    const link = document.createElement('a');
    link.download = tempPdfData.fileName.replace('.pdf', '.png');
    link.href = stitchCanvas.toDataURL('image/png');
    link.click();
  } else {
    const link = document.createElement('a');
    link.download = tempPdfData.fileName.replace('.pdf', '.png'); 
    link.href = tempPdfData.imgData;
    link.click();
  }
  showToast('Gambar A4 berhasil disimpan!');
  closePreviewModal();
};

const _hexToRgba = (hex, alpha = 0.12) => {
  if (!hex || typeof hex !== 'string') return `rgba(5, 150, 105, ${alpha})`;
  let c = hex.trim().replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) return `rgba(5, 150, 105, ${alpha})`;
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
};

const _urlToBase64 = async (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  if (rawUrl.startsWith('data:image/')) return rawUrl;
  
  const hImg = el('dyn-store-logo-img') || el('footer-logo-img');
  if (hImg && hImg.complete && hImg.naturalWidth > 0 && !hImg.classList.contains('hidden')) {
    try {
      const c = document.createElement('canvas');
      c.width = hImg.naturalWidth || 120;
      c.height = hImg.naturalHeight || 120;
      const ctx = c.getContext('2d');
      ctx.drawImage(hImg, 0, 0, c.width, c.height);
      const dataUri = c.toDataURL('image/png');
      if (dataUri && dataUri.length > 200) return dataUri;
    } catch (e) {}
  }

  let targetUrl = rawUrl.trim();
  const gIdMatch = targetUrl.match(/(?:drive\.google\.com.*(?:id=|\/d\/)|googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/);
  if (gIdMatch) {
    targetUrl = `https://drive.google.com/thumbnail?id=${gIdMatch[1]}&sz=w600`;
  }

  const loadImgAsBase64 = (srcUrl) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let done = false;
    img.onload = () => {
      if (done) return;
      done = true;
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 120;
        c.height = img.naturalHeight || 120;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/png'));
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => {
      if (!done) { done = true; resolve(null); }
    };
    setTimeout(() => {
      if (!done) { done = true; resolve(null); }
    }, 2000);
    img.src = srcUrl;
  });

  let result = await loadImgAsBase64(`https://wsrv.nl/?url=${encodeURIComponent(targetUrl)}&w=300&output=png`);
  if (result) return result;

  result = await loadImgAsBase64(targetUrl);
  return result;
};

// =============================================================================
// DISCRETE A4 PAGES GENERATOR (PREVENTING SQUEEZED / SQUISHED TEXT)
// =============================================================================

const _buildInvoicePages = ({ o, formattedDate, themeClr, base64Logo, storeName, storeAddress, storeWa, footerText }) => {
  const items = o.items || [];
  const totalItems = items.length;
  const pages = [];

  if (totalItems <= 12) {
    pages.push({ isFirst: true, isLast: true, items: items });
  } else {
    // Page 1: first 12 items
    pages.push({ isFirst: true, isLast: false, items: items.slice(0, 12) });
    let cursor = 12;

    while (cursor < totalItems) {
      const remaining = totalItems - cursor;
      if (remaining <= 10) {
        pages.push({ isFirst: false, isLast: true, items: items.slice(cursor, cursor + remaining) });
        cursor += remaining;
      } else if (remaining <= 20) {
        pages.push({ isFirst: false, isLast: false, items: items.slice(cursor, cursor + (remaining - 10)) });
        cursor += (remaining - 10);
      } else {
        pages.push({ isFirst: false, isLast: false, items: items.slice(cursor, cursor + 18) });
        cursor += 18;
      }
    }
  }

  const totalPages = pages.length;

  return pages.map((pg, idx) => {
    const pageNum = idx + 1;
    let topSection = '';

    if (pg.isFirst) {
      topSection = `
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, ${themeClr} 0%, #0284c7 100%);"></div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px; max-width: 430px;">
            <div style="width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background-color: ${themeClr}; color: #ffffff; overflow: hidden; flex-shrink: 0; border: 1px solid #e2e8f0;">
              ${base64Logo ? `<img src="${base64Logo}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo" />` : `<svg style="width: 32px; height: 32px; fill: #ffffff;" viewBox="0 0 24 24"><path d="M4 4h16l1 5v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2V9L4 4zm1 9.5a1.5 1.5 0 0 0 3 0V11H5v2.5zm4 0a1.5 1.5 0 0 0 3 0V11H9v2.5zm4 0a1.5 1.5 0 0 0 3 0V11h-3v2.5zm4 0a1.5 1.5 0 0 0 3 0V11h-3v2.5zM5 18h14v2H5v-2z" fill="#ffffff"/></svg>`}
            </div>
            <div>
              <h1 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1; text-transform: uppercase; letter-spacing: -0.02em;">${esc(storeName)}</h1>
              <p style="font-size: 10.5px; font-weight: 500; color: #64748b; margin: 4px 0 0 0; line-height: 1.35;">${esc(storeAddress)}</p>
              <p style="font-size: 10.5px; font-weight: 700; color: #334155; margin: 3px 0 0 0;"><i class="fa-brands fa-whatsapp" style="color: #10b981; margin-right: 4px;"></i>WA: ${esc(storeWa)}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; padding: 4px 12px; background-color: #0f172a; color: #ffffff; border-radius: 8px; font-size: 11px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">
              FAKTUR / INVOICE
            </div>
            <p style="font-size: 13.5px; font-weight: 900; color: #0f172a; margin: 2px 0 0 0; font-family: monospace;">#${esc(o.orderId)}</p>
            <p style="font-size: 10.5px; font-weight: 600; color: #64748b; margin: 2px 0 0 0;">${formattedDate}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
          <div style="padding: 12px 14px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 8.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px 0;">DITAGIHKAN KEPADA:</p>
            <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">${esc(o.customer?.name || 'Pelanggan')}</h3>
            <p style="font-size: 10px; font-weight: 500; color: #475569; margin: 4px 0 0 0; line-height: 1.35;">${esc(o.customer?.address || '-')}</p>
          </div>
          <div style="padding: 12px 14px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <p style="font-size: 8.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px 0;">METODE & STATUS BAYAR:</p>
              <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                <span style="padding: 2px 8px; border-radius: 6px; font-size: 9.5px; font-weight: 900; background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; text-transform: uppercase;">
                  ${esc(o.payment?.method || 'CASH')}
                </span>
                <span style="padding: 2px 6px; border-radius: 6px; font-size: 9.5px; font-weight: 700; background-color: #e2e8f0; color: #334155;">DOKUMEN SAH</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      topSection = `
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, ${themeClr} 0%, #0284c7 100%);"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background-color: ${themeClr}; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 12px;">
              ${base64Logo ? `<img src="${base64Logo}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo" />` : 'TG'}
            </div>
            <div>
              <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase;">${esc(storeName)}</h2>
              <p style="font-size: 9.5px; color: #64748b; margin: 0;">Faktur Penjualan #${esc(o.orderId)} (Lanjutan)</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="padding: 3px 8px; border-radius: 6px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-size: 9.5px; font-weight: 700; color: #475569;">
              Halaman ${pageNum} dari ${totalPages}
            </span>
          </div>
        </div>
      `;
    }

    const tableHtml = `
      <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
        <table style="width: 100%; text-align: left; border-collapse: collapse; table-layout: fixed;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; color: #334155;">
              <th style="padding: 8px 10px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; width: 14%;">Qty</th>
              <th style="padding: 8px 10px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; width: 46%;">Nama Barang &amp; Varian</th>
              <th style="padding: 8px 10px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 20%;">Harga Satuan</th>
              <th style="padding: 8px 12px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: right; width: 20%;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${pg.items.map((item, iIdx) => {
              const isGrosir = item.effectivePrice < item.price;
              const varKeterangan = [item.variantName, (isGrosir ? 'Grosir' : '')].filter(Boolean).join(' · ');
              return `
              <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10.5px; color: #0f172a; background-color: ${iIdx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                <td style="padding: 7px 10px; font-weight: 800; vertical-align: middle; white-space: nowrap; text-align: center;">
                  <span style="display:inline-block; padding: 2px 8px; background:#f1f5f9; border-radius: 5px; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; color: #0f172a;">
                    ${item.qty}
                  </span>
                </td>
                <td style="padding: 7px 10px; vertical-align: middle; line-height: 1.35; word-break: break-word;">
                  <div style="font-weight: 700; color: #0f172a;">${esc(item.name)}</div>
                  ${varKeterangan ? `<div style="font-size: 9px; color: #64748b; font-weight: 600; margin-top: 1px;"><i class="fa-solid fa-tag" style="font-size: 7.5px; margin-right: 3px;"></i>${esc(varKeterangan)}</div>` : ''}
                </td>
                <td style="padding: 7px 10px; text-align: right; vertical-align: middle; font-weight: 600; color: #475569;">
                  ${fCur(item.effectivePrice)}
                </td>
                <td style="padding: 7px 12px; text-align: right; font-weight: 800; color: #0f172a; vertical-align: middle; font-family: monospace; font-size: 11px;">
                  ${fCur(item.effectivePrice * item.qty)}
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    let bottomSection = '';
    if (pg.isLast) {
      bottomSection = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 16px;">
          <div style="flex: 1; max-width: 350px; font-size: 9.5px; color: #64748b; line-height: 1.4;">
            <p style="font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 4px 0; font-size: 9px;">Catatan &amp; Kebijakan:</p>
            <p style="margin: 0 0 3px 0;">1. Bukti pembayaran ini sah dan diterbitkan secara digital oleh sistem kasir toko.</p>
            <p style="margin: 0;">2. Harap simpan invoice ini sebagai bukti transaksi dan klaim garansi yang berlaku.</p>
          </div>

          <div style="width: 280px; background-color: #f8fafc; padding: 12px 14px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 5px;">
              <span style="font-weight: 500;">Subtotal Produk:</span>
              <span style="font-weight: 700; color: #0f172a;">${fCur(o.payment?.subtotal || 0)}</span>
            </div>
            ${o.payment?.productDiscount ? `
            <div style="display: flex; justify-content: space-between; color: #e11d48; margin-bottom: 5px;">
              <span style="font-weight: 500;">Diskon Promo:</span>
              <span style="font-weight: 700;">-${fCur(o.payment.productDiscount)}</span>
            </div>
            ` : ''}
            ${o.customer?.deliveryMethod !== 'pickup' ? `
            <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 5px;">
              <span style="font-weight: 500;">Ongkos Kirim:</span>
              <span style="font-weight: 700; color: #0f172a;">${fCur(o.payment?.shippingCost || 0)}</span>
            </div>
            ` : ''}
            ${o.payment?.shippingDiscount ? `
            <div style="display: flex; justify-content: space-between; color: #e11d48; margin-bottom: 5px;">
              <span style="font-weight: 500;">Potongan Ongkir:</span>
              <span style="font-weight: 700;">-${fCur(o.payment.shippingDiscount)}</span>
            </div>
            ` : ''}
            <div style="padding-top: 8px; border-top: 2px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
              <span style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">TOTAL AKHIR:</span>
              <span style="font-size: 15px; font-weight: 900; color: #047857; font-family: monospace;">${fCur(o.payment?.grandTotal || 0)}</span>
            </div>
          </div>
        </div>
      `;
    }

    const footerHtml = `
      <div style="border-top: 1.5px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #94a3b8;">
        <p style="margin: 0; font-weight: 500;">${esc(footerText || 'Terima kasih atas kunjungan dan kepercayaan Anda.')}</p>
        <p style="margin: 0; font-weight: 700; color: #64748b;">Halaman ${pageNum} dari ${totalPages}</p>
      </div>
    `;

    return `
      <div class="a4-page-sheet" data-page="${pageNum}" style="width: 794px; min-width: 794px; max-width: 794px; height: 1123px; min-height: 1123px; max-height: 1123px; padding: 40px 48px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; background-color: #ffffff; position: relative; overflow: hidden;">
        <div>
          ${topSection}
          ${tableHtml}
          ${bottomSection}
        </div>
        ${footerHtml}
      </div>
    `;
  });
};

const _buildSuratJalanPages = ({ o, formattedDate, themeClr, base64Logo, storeName, storeAddress, storeWa }) => {
  const items = o.items || [];
  const totalItems = items.length;
  const pages = [];

  if (totalItems <= 14) {
    pages.push({ isFirst: true, isLast: true, items: items });
  } else {
    pages.push({ isFirst: true, isLast: false, items: items.slice(0, 14) });
    let cursor = 14;

    while (cursor < totalItems) {
      const remaining = totalItems - cursor;
      if (remaining <= 10) {
        pages.push({ isFirst: false, isLast: true, items: items.slice(cursor, cursor + remaining) });
        cursor += remaining;
      } else if (remaining <= 20) {
        pages.push({ isFirst: false, isLast: false, items: items.slice(cursor, cursor + (remaining - 10)) });
        cursor += (remaining - 10);
      } else {
        pages.push({ isFirst: false, isLast: false, items: items.slice(cursor, cursor + 18) });
        cursor += 18;
      }
    }
  }

  const totalPages = pages.length;

  return pages.map((pg, idx) => {
    const pageNum = idx + 1;
    let topSection = '';

    if (pg.isFirst) {
      topSection = `
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);"></div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px; max-width: 430px;">
            <div style="width: 54px; height: 54px; border-radius: 14px; display: flex; align-items: center; justify-content: center; background-color: #0284c7; color: #ffffff; overflow: hidden; flex-shrink: 0; border: 1px solid #e2e8f0;">
              ${base64Logo ? `<img src="${base64Logo}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo" />` : `<svg style="width: 32px; height: 32px; fill: #ffffff;" viewBox="0 0 24 24"><path d="M4 4h16l1 5v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2 2 2 2 0 0 1-2-2 2 2 0 0 1-2-2V9L4 4zm1 9.5a1.5 1.5 0 0 0 3 0V11H5v2.5zm4 0a1.5 1.5 0 0 0 3 0V11H9v2.5zm4 0a1.5 1.5 0 0 0 3 0V11h-3v2.5zm4 0a1.5 1.5 0 0 0 3 0V11h-3v2.5zM5 18h14v2H5v-2z" fill="#ffffff"/></svg>`}
            </div>
            <div>
              <h1 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.1; text-transform: uppercase; letter-spacing: -0.02em;">${esc(storeName)}</h1>
              <p style="font-size: 10.5px; font-weight: 500; color: #64748b; margin: 4px 0 0 0; line-height: 1.35;">${esc(storeAddress)}</p>
              <p style="font-size: 10.5px; font-weight: 700; color: #334155; margin: 3px 0 0 0;"><i class="fa-brands fa-whatsapp" style="color: #0284c7; margin-right: 4px;"></i>WA: ${esc(storeWa)}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; padding: 4px 12px; background-color: #0369a1; color: #ffffff; border-radius: 8px; font-size: 11px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px;">
              SURAT JALAN PENGIRIMAN
            </div>
            <p style="font-size: 13.5px; font-weight: 900; color: #0f172a; margin: 2px 0 0 0; font-family: monospace;">#SJ-${esc(o.orderId)}</p>
            <p style="font-size: 10.5px; font-weight: 600; color: #64748b; margin: 2px 0 0 0;">${formattedDate}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
          <div style="padding: 12px 14px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 8.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px 0;">PENGIRIM (ASAL BARANG):</p>
            <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">${esc(storeName)}</h3>
            <p style="font-size: 10px; font-weight: 500; color: #475569; margin: 4px 0 0 0; line-height: 1.35;">Pengiriman logistik resmi &amp; serah terima barang</p>
          </div>
          <div style="padding: 12px 14px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 8.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 4px 0;">PENERIMA (TUJUAN LOKASI):</p>
            <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2;">${esc(o.customer?.name || 'Pelanggan')}</h3>
            <p style="font-size: 10px; font-weight: 500; color: #475569; margin: 4px 0 0 0; line-height: 1.35;">${esc(o.customer?.address || '-')}</p>
            ${o.customer?.note ? `<p style="font-size: 9.5px; font-weight: 700; color: #075985; margin: 6px 0 0 0; background: #e0f2fe; border: 1px solid #bae6fd; padding: 3px 8px; border-radius: 6px;">Catatan: ${esc(o.customer.note)}</p>` : ''}
          </div>
        </div>
      `;
    } else {
      topSection = `
        <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background-color: #0284c7; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 12px;">
              ${base64Logo ? `<img src="${base64Logo}" style="width: 100%; height: 100%; object-fit: contain;" alt="Logo" />` : 'TG'}
            </div>
            <div>
              <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase;">${esc(storeName)}</h2>
              <p style="font-size: 9.5px; color: #64748b; margin: 0;">Surat Jalan Pengiriman #SJ-${esc(o.orderId)} (Lanjutan)</p>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="padding: 3px 8px; border-radius: 6px; background-color: #f1f5f9; border: 1px solid #e2e8f0; font-size: 9.5px; font-weight: 700; color: #475569;">
              Halaman ${pageNum} dari ${totalPages}
            </span>
          </div>
        </div>
      `;
    }

    const tableHtml = `
      <div style="border-radius: 10px; border: 1px solid #cbd5e1; overflow: hidden; margin-bottom: 16px;">
        <table style="width: 100%; text-align: left; border-collapse: collapse; table-layout: fixed;">
          <thead>
            <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; color: #334155;">
              <th style="padding: 8px 12px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; width: 52%; border-right: 1px solid #cbd5e1;">Nama Barang / Deskripsi</th>
              <th style="padding: 8px 10px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; width: 14%; border-right: 1px solid #cbd5e1;">Qty</th>
              <th style="padding: 8px 10px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; width: 24%; border-right: 1px solid #cbd5e1;">Varian / Spesifikasi</th>
              <th style="padding: 8px 8px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; width: 10%;">Cek</th>
            </tr>
          </thead>
          <tbody>
            ${pg.items.map((item, iIdx) => {
              const isGrosir = item.effectivePrice < item.price;
              const varKeterangan = [item.variantName, (isGrosir ? 'Grosir' : '')].filter(Boolean).join(' · ');
              return `
              <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10.5px; color: #0f172a; background-color: ${iIdx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                <td style="padding: 7px 12px; font-weight: 700; vertical-align: middle; border-right: 1px solid #e2e8f0; line-height: 1.35; word-break: break-word;">
                  ${esc(item.name)}
                </td>
                <td style="padding: 7px 10px; text-align: center; vertical-align: middle; font-weight: 800; border-right: 1px solid #e2e8f0; white-space: nowrap;">
                  <span style="display:inline-block; padding: 2px 8px; background:#f0f9ff; border-radius: 5px; border: 1px solid #bae6fd; color:#0369a1; font-size: 11px; font-weight: 800;">
                    ${item.qty}
                  </span>
                </td>
                <td style="padding: 7px 10px; color: #475569; vertical-align: middle; border-right: 1px solid #e2e8f0; font-size: 9.5px; font-weight: 600;">
                  ${varKeterangan ? esc(varKeterangan) : '<span style="color:#cbd5e1;">-</span>'}
                </td>
                <td style="padding: 7px 8px; text-align: center; vertical-align: middle;">
                  <span style="display:inline-block; width: 14px; height: 14px; border: 1.5px solid #94a3b8; border-radius: 3px;"></span>
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    let bottomSection = '';
    if (pg.isLast) {
      bottomSection = `
        <div style="margin-bottom: 16px;">
          <p style="font-size: 8.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; text-align: center;">SERAH TERIMA &amp; VALIDASI DOKUMEN (3 PIHAK)</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; text-align: center;">
            <div style="padding: 10px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; height: 110px; box-sizing: border-box;">
              <p style="font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 0;">Penerima Barang</p>
              <div>
                <p style="font-size: 10.5px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; margin: 0 0 2px 0;">( ................................ )</p>
                <p style="font-size: 8.5px; color: #94a3b8; margin: 0;">Tgl: ...... / ...... / 202...</p>
              </div>
            </div>
            <div style="padding: 10px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; height: 110px; box-sizing: border-box;">
              <p style="font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 0;">Kurir / Pengantar</p>
              <div>
                <p style="font-size: 10.5px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; margin: 0 0 2px 0;">( ................................ )</p>
                <p style="font-size: 8.5px; color: #94a3b8; margin: 0;">No. Polisi Kendaraan</p>
              </div>
            </div>
            <div style="padding: 10px; background-color: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; height: 110px; box-sizing: border-box;">
              <p style="font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 0;">Hormat Kami (Gudang)</p>
              <div>
                <p style="font-size: 10.5px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px; margin: 0 0 2px 0;">${esc(storeName)}</p>
                <p style="font-size: 8.5px; color: #94a3b8; margin: 0;">Cap Toko &amp; Tanda Tangan</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const footerHtml = `
      <div style="border-top: 1.5px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #94a3b8;">
        <p style="margin: 0; font-weight: 500;">Surat Jalan Pengiriman Resmi &bull; Dokumen Sah Logistik &amp; Serah Terima Barang.</p>
        <p style="margin: 0; font-weight: 700; color: #64748b;">Halaman ${pageNum} dari ${totalPages}</p>
      </div>
    `;

    return `
      <div class="a4-page-sheet" data-page="${pageNum}" style="width: 794px; min-width: 794px; max-width: 794px; height: 1123px; min-height: 1123px; max-height: 1123px; padding: 40px 48px; font-family: 'Plus Jakarta Sans', Arial, sans-serif; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; background-color: #ffffff; position: relative; overflow: hidden;">
        <div>
          ${topSection}
          ${tableHtml}
          ${bottomSection}
        </div>
        ${footerHtml}
      </div>
    `;
  });
};

window.generateA4Document = async (type, directOrder = null) => {
  if (isSaving) return;
  if (directOrder) {
    cVOrd = directOrder.orderId || directOrder.id;
  }
  const o = directOrder || gOrds.find(x => x.orderId === cVOrd);
  if (!o) return;
  
  isSaving = true;
  const menu = el('print-options-menu');
  if (menu) menu.classList.add('hidden'); 
  
  sLoad('Membuat Dokumen A4...'); 

  try {
    const dateObj = o.dateString ? new Date(o.dateString) : new Date();
    const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const rawTheme = getComputedStyle(document.documentElement).getPropertyValue('--clr-p').trim() || '#059669';
    const themeClr = rawTheme.startsWith('#') ? rawTheme : (rawTheme.startsWith('rgb') ? rawTheme : '#059669');
    const logoVal = appData.store?.logo || 'fa-store';
    const isLogoUrl = /^(https?:\/\/|data:image\/)/i.test(logoVal);
    
    let base64Logo = null;
    if (isLogoUrl) {
      base64Logo = await _urlToBase64(logoVal);
    }

    const storeName = appData.store.name || 'TOKO GRAFIKA';
    const storeAddress = appData.store.address || 'Alamat Toko';
    const storeWa = appData.store.wa || '-';
    const footerText = appData.store.footerText || 'Terima kasih atas kunjungan dan kepercayaan Anda.';

    // Generate discrete A4 pages
    const pagesHtml = type === 'invoice' 
      ? _buildInvoicePages({ o, formattedDate, themeClr, base64Logo, storeName, storeAddress, storeWa, footerText })
      : _buildSuratJalanPages({ o, formattedDate, themeClr, base64Logo, storeName, storeAddress, storeWa });

    // Render each page into an offscreen container to create high-res canvases
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '794px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.zIndex = '-9999';
    document.body.appendChild(tempContainer);

    const pageCanvases = [];
    for (let i = 0; i < pagesHtml.length; i++) {
      tempContainer.innerHTML = pagesHtml[i];
      const sheetElement = tempContainer.querySelector('.a4-page-sheet');
      
      const canvas = await html2canvas(sheetElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        imageTimeout: 1500,
        logging: false,
        width: 794,
        height: 1123,
        windowWidth: 794,
        windowHeight: 1123,
        scrollX: 0,
        scrollY: 0
      });
      pageCanvases.push(canvas);
    }

    document.body.removeChild(tempContainer);

    // Save multi-page canvases in tempPdfData
    const firstImgData = pageCanvases[0].toDataURL('image/png');
    tempPdfData = {
      imgData: firstImgData,
      pageCanvases: pageCanvases,
      width: pageCanvases[0].width,
      height: pageCanvases[0].height,
      type: type,
      fileName: type === 'invoice' ? `Invoice_${o.orderId}.pdf` : `Surat_Jalan_${o.orderId}.pdf`
    };

    // Populate preview container with all page sheets and clear boundary separators
    const previewContainer = el('preview-pages-container');
    if (previewContainer) {
      previewContainer.innerHTML = pageCanvases.map((c, idx) => {
        const pageImg = c.toDataURL('image/png');
        return `
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-file-lines text-emerald-500"></i> Halaman ${idx + 1} dari ${pageCanvases.length}</span>
            <span class="text-[10px] uppercase tracking-wider bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-xs">Standar A4 (210 x 297 mm)</span>
          </div>
          <div class="bg-white rounded-md shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden">
            <img class="w-full h-auto block" src="${pageImg}" alt="Halaman ${idx + 1}" />
          </div>
        </div>
        `;
      }).join('');
    } else {
      const prevImg = el('preview-img-result');
      if (prevImg) prevImg.src = firstImgData;
    }

    const previewModal = document.getElementById('pdf-preview-modal');
    if (previewModal) {
      previewModal.classList.remove('hidden');
      previewModal.classList.add('flex');
    }
    
    const btnPdf = el('btn-download-pdf-a4');
    if (btnPdf) btnPdf.style.backgroundColor = themeClr;
    
  } catch (error) {
    console.error(error);
    showToast('Gagal memproses dokumen A4!');
  } finally {
    isSaving = false;
    hLoad();
  }
};

window.generatePosA4Document = (type, orderData) => {
  return window.generateA4Document(type, orderData);
};

// =============================================================================
// MODUL CETAK PRICETAG RAK TOKO & LABEL BARCODE PRODUK (A4 HVS & STIKER)
// =============================================================================
let currentPricetagMode = 'pricetag'; // 'pricetag' | 'barcode'
let selectedPrintProducts = {}; // { [productId]: quantity }
let pricetagSearchQuery = '';
let pricetagCatFilter = 'all';
let currentPricetagSheets = []; // Array of HTML strings per A4 page

window.openPricetagBarcodeModal = (preselectedId = null) => {
  const modal = el('pricetag-barcode-modal');
  const box = el('pricetag-barcode-modal-box');
  if (!modal || !box) return;

  // Populate category filter dropdown
  const catSelect = el('pricetag-cat-filter');
  if (catSelect) {
    const cats = appData.categories || [];
    catSelect.innerHTML = `<option value="all">Semua Kategori</option>` + 
      cats.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
    catSelect.value = 'all';
  }
  
  const searchInput = el('pricetag-search-input');
  if (searchInput) searchInput.value = '';
  pricetagSearchQuery = '';
  pricetagCatFilter = 'all';

  // Initialize selected products
  selectedPrintProducts = {};
  const products = appData.products || [];
  if (preselectedId !== null) {
    selectedPrintProducts[preselectedId] = 1;
  } else {
    // Default: select all active products with 1 qty each
    products.forEach(p => {
      const isOff = (p.isActive === 'false' || p.isActive === false);
      if (!isOff) {
        selectedPrintProducts[p.id] = 1;
      }
    });
  }

  window.showPricetagStep('selection');
  window.switchPricetagMode(currentPricetagMode || 'pricetag');
  window.renderPricetagProductList();

  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    box.classList.remove('scale-95');
  }, 10);
};

window.closePricetagBarcodeModal = () => {
  const modal = el('pricetag-barcode-modal');
  const box = el('pricetag-barcode-modal-box');
  if (!modal || !box) return;
  modal.classList.add('opacity-0');
  box.classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 300);
};

window.switchPricetagMode = (mode) => {
  currentPricetagMode = mode === 'barcode' ? 'barcode' : 'pricetag';
  const btnPt = el('btn-tab-pricetag');
  const btnBc = el('btn-tab-barcode');
  const sizeWrap = el('tag-size-select-wrap');

  if (btnPt && btnBc) {
    if (currentPricetagMode === 'pricetag') {
      btnPt.className = 'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-black';
      btnBc.className = 'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900';
      if (sizeWrap) sizeWrap.classList.remove('hidden');
    } else {
      btnBc.className = 'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 font-black';
      btnPt.className = 'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900';
      if (sizeWrap) sizeWrap.classList.add('hidden');
    }
  }

  // If already in preview step, regenerate preview sheets
  const stepPreview = el('pricetag-step-preview');
  if (stepPreview && !stepPreview.classList.contains('hidden')) {
    window.proceedToPricetagPreview();
  }
};

window.showPricetagStep = (step) => {
  const sSelect = el('pricetag-step-selection');
  const sPrev = el('pricetag-step-preview');
  const btnProceed = el('btn-proceed-preview-pricetag');
  const prevActions = el('pricetag-preview-actions');

  if (step === 'preview') {
    if (sSelect) sSelect.classList.add('hidden');
    if (sPrev) sPrev.classList.remove('hidden');
    if (btnProceed) btnProceed.classList.add('hidden');
    if (prevActions) prevActions.classList.remove('hidden');
  } else {
    if (sSelect) sSelect.classList.remove('hidden');
    if (sPrev) sPrev.classList.add('hidden');
    if (btnProceed) btnProceed.classList.remove('hidden');
    if (prevActions) prevActions.classList.add('hidden');
  }
};

window.filterPrintProductsList = () => {
  const sInput = el('pricetag-search-input');
  const cSelect = el('pricetag-cat-filter');
  pricetagSearchQuery = sInput ? sInput.value.trim().toLowerCase() : '';
  pricetagCatFilter = cSelect ? cSelect.value : 'all';
  window.renderPricetagProductList();
};

// Helper: build flattened print items (expanding variants)
function _getPrintableItemList() {
  const products = appData.products || [];
  const list = [];
  products.forEach(p => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v, vIdx) => {
        list.push({
          uid: `${p.id}__var__${vIdx}`,
          parentId: p.id,
          isVariant: true,
          variantName: v.name,
          name: p.name,
          displayName: `${p.name} - ${v.name}`,
          price: parseFloat(v.price) || parseFloat(p.price) || 0,
          sku: v.sku || p.sku || '',
          barcode: v.barcode || v.sku || p.barcode || p.sku || String(p.id),
          img: v.img || p.img || '',
          category: p.category || '',
          unit: p.unit || '',
          wholesale: p.wholesale || []
        });
      });
    } else {
      list.push({
        uid: String(p.id),
        parentId: p.id,
        isVariant: false,
        name: p.name,
        displayName: p.name,
        price: parseFloat(p.price) || 0,
        sku: p.sku || '',
        barcode: p.barcode || p.sku || String(p.id),
        img: p.img || '',
        category: p.category || '',
        unit: p.unit || '',
        wholesale: p.wholesale || []
      });
    }
  });
  return list;
}

window.toggleSelectAllPrintProducts = (selectAll) => {
  const items = _getPrintableItemList();
  const filtered = items.filter(item => {
    if (pricetagCatFilter !== 'all' && item.category !== pricetagCatFilter) return false;
    if (pricetagSearchQuery) {
      const matchName = (item.displayName || '').toLowerCase().includes(pricetagSearchQuery);
      const matchSku = (item.sku || '').toLowerCase().includes(pricetagSearchQuery);
      const matchBarcode = (item.barcode || '').toLowerCase().includes(pricetagSearchQuery);
      if (!matchName && !matchSku && !matchBarcode) return false;
    }
    return true;
  });

  if (selectAll) {
    filtered.forEach(p => {
      selectedPrintProducts[p.uid] = 1;
    });
  } else {
    selectedPrintProducts = {};
  }
  window.renderPricetagProductList();
};

window.toggleSelectPrintProduct = (uid) => {
  if (selectedPrintProducts[uid]) {
    delete selectedPrintProducts[uid];
  } else {
    selectedPrintProducts[uid] = 1;
  }
  window.renderPricetagProductList();
};

window.changePrintProductQty = (uid, delta) => {
  const current = selectedPrintProducts[uid] || 0;
  const next = Math.max(0, current + delta);
  if (next <= 0) {
    delete selectedPrintProducts[uid];
  } else {
    selectedPrintProducts[uid] = next;
  }
  window.renderPricetagProductList();
};

window.setPrintProductQty = (uid, val) => {
  const num = parseInt(val, 10);
  if (isNaN(num) || num <= 0) {
    delete selectedPrintProducts[uid];
  } else {
    selectedPrintProducts[uid] = Math.min(999, num);
  }
  window.renderPricetagProductList();
};

window.renderPricetagProductList = () => {
  const container = el('pricetag-product-list-container');
  if (!container) return;

  const items = _getPrintableItemList();
  let filtered = items.filter(p => {
    if (pricetagCatFilter !== 'all' && p.category !== pricetagCatFilter) return false;
    if (pricetagSearchQuery) {
      const matchName = (p.displayName || '').toLowerCase().includes(pricetagSearchQuery);
      const matchSku = (p.sku || '').toLowerCase().includes(pricetagSearchQuery);
      const matchBarcode = (p.barcode || '').toLowerCase().includes(pricetagSearchQuery);
      if (!matchName && !matchSku && !matchBarcode) return false;
    }
    return true;
  });

  // Calculate totals
  let selectedCount = 0;
  let totalLabels = 0;
  Object.keys(selectedPrintProducts).forEach(uid => {
    const q = selectedPrintProducts[uid];
    if (q > 0) {
      selectedCount++;
      totalLabels += q;
    }
  });

  const summaryEl = el('pricetag-selected-summary');
  if (summaryEl) {
    summaryEl.textContent = `${selectedCount} Item Dipilih (${totalLabels} Label)`;
  }
  const footerBadge = el('pricetag-footer-count-badge');
  if (footerBadge) {
    footerBadge.innerHTML = `<span class="badge badge-solid-emerald text-xs px-3 py-1 font-bold shadow-xs">${totalLabels} Label Siap Dicetak</span>`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400">
        <i class="fa-solid fa-box-open text-3xl mb-2"></i>
        <p class="text-xs font-semibold">Tidak ada produk yang cocok dengan pencarian.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isSelected = !!selectedPrintProducts[p.uid];
    const qty = selectedPrintProducts[p.uid] || 0;
    const cleanImg = p.img ? fixD(p.img) : '';
    const img = cleanImg 
      ? `<img src="${esc(cleanImg)}" onerror="this.onerror=null;this.outerHTML='<div class=\\'w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center shrink-0 text-sm border border-slate-200 dark:border-slate-700 shadow-xs\\'><i class=\\'fa-solid fa-box\\'></i></div>';" class="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs" loading="lazy" alt="" />`
      : `<div class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center shrink-0 text-sm border border-slate-200 dark:border-slate-700 shadow-xs"><i class="fa-solid fa-box"></i></div>`;

    const variantBadge = p.isVariant 
      ? `<span class="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 font-black"><i class="fa-solid fa-sitemap text-[9px] mr-1"></i>Varian: ${esc(p.variantName)}</span>`
      : '';

    const wholesaleBadge = (p.wholesale && p.wholesale.length > 0)
      ? `<span class="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 font-black"><i class="fa-solid fa-tags text-[9px] mr-1"></i>Ada Grosir (${p.wholesale.length} Tingkat)</span>`
      : '';

    return `
      <div class="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-all ${isSelected ? 'border-l-4' : ''}" style="${isSelected ? 'background-color:var(--clr-p-10); border-left-color:var(--clr-p);' : ''}">
        <div class="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1 cursor-pointer select-none" onclick="toggleSelectPrintProduct('${esc(p.uid)}')">
          <input type="checkbox" ${isSelected ? 'checked' : ''} class="w-4 h-4 sm:w-5 sm:h-5 mt-1 sm:mt-0 rounded-md cursor-pointer shrink-0" style="accent-color:var(--clr-p)" onclick="event.stopPropagation(); toggleSelectPrintProduct('${esc(p.uid)}')" />
          ${img}
          <div class="min-w-0 flex-1 pr-1">
            <h4 class="font-black text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">${esc(p.name)}</h4>
            <div class="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span class="font-black text-sm" style="color:var(--clr-p)">${fCur(p.price)}</span>
              ${variantBadge}
              ${wholesaleBadge}
              ${p.sku ? `<span class="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">SKU: ${esc(p.sku)}</span>` : ''}
              ${p.category ? `<span class="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">${esc(p.category)}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Qty Cetak Stepper -->
        <div class="flex items-center self-end sm:self-auto gap-1 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-xs mt-2 sm:mt-0">
          <button type="button" onclick="changePrintProductQty('${esc(p.uid)}', -1)" class="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold active:scale-95 transition-all" title="Kurangi">
            <i class="fa-solid fa-minus"></i>
          </button>
          <input type="number" min="0" max="999" value="${qty}" onchange="setPrintProductQty('${esc(p.uid)}', this.value)" class="w-10 sm:w-12 text-center text-xs sm:text-sm font-black bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-white p-0" />
          <button type="button" onclick="changePrintProductQty('${esc(p.uid)}', 1)" class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold active:scale-95 transition-all shadow-xs" style="background-color:var(--clr-p-bg);color:var(--clr-p)" title="Tambah">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.setPricetagZoom = (scale) => {
  const wrapper = el('pricetag-sheets-zoom-wrapper');
  if (!wrapper) return;
  wrapper.style.transform = `scale(${scale})`;
  wrapper.style.transformOrigin = 'top center';
  wrapper.style.marginBottom = scale < 1 ? `-${Math.round((1 - scale) * 1140)}px` : '0px';

  ['50', '75', '100'].forEach(s => {
    const b = el(`btn-zoom-${s}`);
    if (b) {
      const match = (s === '50' && Math.abs(scale - 0.5) < 0.05) || (s === '75' && Math.abs(scale - 0.75) < 0.05) || (s === '100' && Math.abs(scale - 1) < 0.05);
      b.className = match
        ? 'px-2.5 py-1 rounded-lg bg-white dark:bg-slate-600 shadow-xs text-slate-900 dark:text-white font-black'
        : 'px-2.5 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all';
    }
  });
};

window.refreshPricetagPreviewIfActive = () => {
  const stepPreview = el('pricetag-step-preview');
  if (stepPreview && !stepPreview.classList.contains('hidden')) {
    window.proceedToPricetagPreview();
  }
};

window.proceedToPricetagPreview = () => {
  // Check if any product selected
  const selectedUids = Object.keys(selectedPrintProducts).filter(uid => selectedPrintProducts[uid] > 0);
  if (selectedUids.length === 0) {
    return showToast("Pilih minimal 1 produk untuk dicetak!");
  }

  sLoad("Membuat Lembaran A4...");
  try {
    const itemsMap = {};
    _getPrintableItemList().forEach(item => { itemsMap[item.uid] = item; });

    // Flatten array of items based on Qty
    const printQueue = [];
    selectedUids.forEach(uid => {
      const p = itemsMap[uid];
      if (p) {
        const qty = selectedPrintProducts[uid];
        for (let i = 0; i < qty; i++) {
          printQueue.push(p);
        }
      }
    });

    const storeName = esc(appData.store?.name || 'TOKO GRAFIKA');
    const layoutSize = el('tag-layout-size')?.value || 'standard';
    const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    let itemsPerPage = 16;
    let gridColsClass = 'grid-cols-2';
    let cardHeight = '34mm';
    let cardMinHeight = '125px';

    if (currentPricetagMode === 'pricetag') {
      if (layoutSize === 'large') {
        itemsPerPage = 10;
        gridColsClass = 'grid-cols-2';
        cardHeight = '55mm';
        cardMinHeight = '200px';
      } else if (layoutSize === 'compact') {
        itemsPerPage = 24;
        gridColsClass = 'grid-cols-3';
        cardHeight = '34mm';
        cardMinHeight = '125px';
      } else {
        // standard
        itemsPerPage = 16;
        gridColsClass = 'grid-cols-2';
        cardHeight = '34mm';
        cardMinHeight = '125px';
      }
    } else {
      // Barcode stickers sheet (3 cols x 10 rows = 30 per page)
      itemsPerPage = 30;
      gridColsClass = 'grid-cols-3';
      cardHeight = '27mm';
      cardMinHeight = '100px';
    }

    // Split printQueue into pages
    const pages = [];
    for (let i = 0; i < printQueue.length; i += itemsPerPage) {
      pages.push(printQueue.slice(i, i + itemsPerPage));
    }

    currentPricetagSheets = pages.map((pageItems, pageIdx) => {
      const totalPages = pages.length;
      
      const cardsHtml = pageItems.map(p => {
        const barcodeVal = p.barcode || p.sku || String(p.uid);
        const barcodeSvg = _generateReceiptBarcodeSvg(barcodeVal);
        const unit = p.unit ? ` / ${esc(p.unit)}` : '';

        // Wholesale tiers info for Shelf Pricetags
        let wholesaleSnippet = '';
        if (p.wholesale && p.wholesale.length > 0) {
          const sortedWhol = p.wholesale.slice().sort((a, b) => a.minQty - b.minQty);
          wholesaleSnippet = `
            <div class="mt-1 pt-1 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-1">
              <span class="text-[8px] uppercase font-black px-1 py-0.2 rounded bg-purple-100 text-purple-900">Grosir:</span>
              ${sortedWhol.map(w => `
                <span class="text-[8.5px] bg-amber-50 text-amber-900 border border-amber-200 px-1 py-0.2 rounded font-black">
                  ≥${w.minQty} @${fCur(w.price).replace('Rp\u00a0','').replace('Rp ','')}
                </span>
              `).join('')}
            </div>
          `;
        }

        const variantLine = p.isVariant 
          ? `<div class="text-[9.5px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded inline-block mt-0.5"><i class="fa-solid fa-sitemap text-[8px] mr-1"></i>Varian: ${esc(p.variantName)}</div>`
          : '';

        if (currentPricetagMode === 'pricetag') {
          return `
            <div class="pricetag-card bg-white text-slate-900 border border-dashed border-slate-300 rounded-lg p-2.5 flex flex-col justify-between relative overflow-hidden box-border shadow-xs" style="min-height:${cardMinHeight}; height:${cardHeight};">
              <!-- Top Header: Store & Date -->
              <div class="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                <span class="truncate max-w-[120px]"><i class="fa-solid fa-store mr-0.5" style="color:var(--clr-p)"></i> ${storeName}</span>
                <span class="text-slate-400 font-mono">${nowStr}</span>
              </div>

              <!-- Middle: Product Name, Variant, Category -->
              <div class="my-1">
                <h3 class="font-black text-slate-900 text-xs sm:text-[13px] leading-tight line-clamp-2 uppercase">${esc(p.name)}</h3>
                ${variantLine}
                <div class="flex items-center gap-1.5 text-[9.5px] text-slate-500 font-bold mt-0.5">
                  ${p.category ? `<span class="bg-slate-100 px-1.5 py-0.5 rounded">${esc(p.category)}</span>` : ''}
                  ${p.sku ? `<span class="font-mono text-slate-400">SKU: ${esc(p.sku)}</span>` : ''}
                </div>
                ${wholesaleSnippet}
              </div>

              <!-- Bottom: Barcode + Prominent Price Box -->
              <div class="flex items-end justify-between gap-2 pt-1 border-t border-slate-100 mt-auto">
                <div class="shrink-0 max-w-[45%]">
                  ${barcodeSvg}
                </div>
                <div class="text-right">
                  <div class="text-[9px] font-black uppercase text-slate-400 tracking-wider">Harga Eceran</div>
                  <div class="text-base sm:text-lg font-black text-slate-950 leading-none tracking-tight">
                    <span class="text-[10px] font-extrabold align-top mr-0.5" style="color:var(--clr-p)">Rp</span>${fCur(p.price).replace('Rp\u00a0','').replace('Rp ','')}
                  </div>
                  <div class="text-[8.5px] font-bold text-slate-400">${unit}</div>
                </div>
              </div>
            </div>
          `;
        } else {
          // Label Stiker Barcode Mode
          return `
            <div class="barcode-sticker-card bg-white text-slate-900 border border-dashed border-slate-300 rounded-md p-1.5 flex flex-col justify-between items-center text-center relative overflow-hidden box-border" style="min-height:${cardMinHeight}; height:${cardHeight};">
              <div class="text-[8px] font-black uppercase tracking-wider text-slate-400 truncate w-full border-b border-slate-100 pb-0.5">
                ${storeName}
              </div>
              <div class="w-full my-0.5">
                <div class="text-[10px] font-bold text-slate-800 truncate w-full leading-tight uppercase">${esc(p.displayName || p.name)}</div>
              </div>
              <div class="w-full my-0.5 transform scale-90 origin-center">
                ${barcodeSvg}
              </div>
              <div class="text-[11px] font-black text-slate-950 leading-none mt-auto pt-0.5 border-t border-slate-100 w-full flex items-center justify-center gap-0.5">
                <span class="text-[8px] font-bold" style="color:var(--clr-p)">Rp</span>${fCur(p.price).replace('Rp\u00a0','').replace('Rp ','')}
              </div>
            </div>
          `;
        }
      }).join('');

      return `
        <div class="a4-pricetag-page bg-white text-slate-900 p-5 rounded-2xl shadow-xl border border-slate-300 mx-auto box-border" style="width: 794px; min-width: 794px; max-width: 794px; min-height: 1123px; box-sizing: border-box; position: relative;">
          <!-- A4 Header Meta -->
          <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-200 pb-2 mb-3">
            <span class="uppercase tracking-widest"><i class="fa-solid fa-tags mr-1" style="color:var(--clr-p)"></i> ${currentPricetagMode === 'pricetag' ? 'Lembar Pricetag Rak Toko' : 'Lembar Label Stiker Barcode'}</span>
            <span>Halaman ${pageIdx + 1} dari ${totalPages} &bull; Kertas A4 (210 x 297 mm)</span>
          </div>

          <!-- Tags Grid -->
          <div class="grid ${gridColsClass} gap-2">
            ${cardsHtml}
          </div>

          <!-- Bottom Cut Instructions -->
          <div class="absolute bottom-3 left-6 right-6 flex items-center justify-between text-[8.5px] text-slate-400 border-t border-slate-100 pt-1.5 font-medium">
            <span>✂️ Potong mengikuti garis putus-putus (*cut lines*) dengan gunting / cutter kertas.</span>
            <span class="font-bold">${storeName} &bull; Cetak Presisi Toko Grafika</span>
          </div>
        </div>
      `;
    });

    const previewContainer = el('pricetag-sheets-render-container');
    if (previewContainer) {
      previewContainer.innerHTML = currentPricetagSheets.join('');
    }

    const pageInfoEl = el('pricetag-preview-page-info');
    if (pageInfoEl) {
      pageInfoEl.textContent = `Total ${pages.length} Halaman A4 (${printQueue.length} Label)`;
    }

    const navContainer = el('pricetag-page-nav-btns');
    if (navContainer) {
      if (pages.length > 1) {
        navContainer.innerHTML = `
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600 shadow-xs">
            <span class="text-[10px] text-slate-400 uppercase font-bold">Ke Hal:</span>
            <select onchange="const pages = document.querySelectorAll('.a4-pricetag-page'); if(pages[this.value]) pages[this.value].scrollIntoView({behavior:'smooth', block:'start'});" class="bg-transparent border-0 font-black cursor-pointer text-slate-800 dark:text-white focus:ring-0 p-0 text-xs">
              ${pages.map((_, idx) => `<option value="${idx}">Hal ${idx + 1} / ${pages.length}</option>`).join('')}
            </select>
          </div>
        `;
      } else {
        navContainer.innerHTML = '';
      }
    }

    // Auto-fit on mobile screens
    if (window.innerWidth < 640) {
      const scale = Math.min(0.85, (window.innerWidth - 32) / 794);
      window.setPricetagZoom(scale);
    } else if (window.innerWidth < 900) {
      window.setPricetagZoom(0.75);
    } else {
      window.setPricetagZoom(1);
    }

    window.showPricetagStep('preview');
  } catch (err) {
    console.error(err);
    showToast("Gagal memproses pratinjau!");
  } finally {
    hLoad();
  }
};

window.executePrintPricetags = () => {
  if (!currentPricetagSheets || currentPricetagSheets.length === 0) {
    return showToast("Tidak ada lembar pricetag untuk dicetak!");
  }

  const printSection = el('pricetag-print-section');
  if (printSection) {
    printSection.innerHTML = currentPricetagSheets.join('');
  }

  document.body.classList.add('print-mode-pricetag');
  window.print();
  setTimeout(() => {
    document.body.classList.remove('print-mode-pricetag');
  }, 1500);
};

window.downloadPricetagPdf = async () => {
  const container = el('pricetag-sheets-render-container');
  if (!container || !window.jspdf || !window.html2canvas) {
    return showToast("Library PDF belum siap, gunakan tombol Cetak ke Printer!");
  }

  const pages = container.querySelectorAll('.a4-pricetag-page');
  if (pages.length === 0) return showToast("Tidak ada halaman untuk diunduh!");

  sLoad("Mengenerate PDF A4...");
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    }

    const modeName = currentPricetagMode === 'pricetag' ? 'Pricetag_Rak' : 'Label_Barcode';
    pdf.save(`${modeName}_A4_${Date.now()}.pdf`);
    showToast("✅ Berkas PDF A4 berhasil diunduh!");
  } catch (err) {
    console.error(err);
    showToast("Gagal mengunduh PDF!");
  } finally {
    hLoad();
  }
};

window.downloadPricetagImage = async () => {
  const container = el('pricetag-sheets-render-container');
  const firstPage = container?.querySelector('.a4-pricetag-page');
  if (!firstPage || !window.html2canvas) {
    return showToast("Gagal mengambil gambar!");
  }

  sLoad("Menyimpan Gambar PNG...");
  try {
    const canvas = await html2canvas(firstPage, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const link = document.createElement('a');
    link.download = `Pricetag_A4_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast("✅ Gambar PNG berhasil disimpan!");
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan gambar!");
  } finally {
    hLoad();
  }
};

