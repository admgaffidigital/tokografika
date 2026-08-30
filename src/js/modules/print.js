// =============================================================================
// FRESHMART PRINT & PDF ENGINE (58MM THERMAL & A4 INVOICE / SURAT JALAN)
// =============================================================================

window.openReceiptPreview = () => {
  const o = gOrds.find(x => x.orderId === cVOrd);
  if (!o) return;
  const d = o.dateString ? new Date(o.dateString).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const sN = appData.store.name || "Toko";
  const sW = appData.store.wa || "";
  const pL = (l, r, len = 32) => {
    const p = len - l.length - r.length;
    return l + (p > 0 ? ' '.repeat(p) : ' ') + r;
  };

  let h = `<div class="text-center font-bold" style="font-size:13px;margin-bottom:2px;">${esc(sN)}</div>${sW ? `<div class="text-center" style="margin-bottom:4px;">WA: ${esc(sW)}</div>` : ''}<div class="border-b border-dashed border-black my-2"></div><div style="white-space:pre;">Order: #${o.orderId}</div><div style="white-space:pre;">Tgl : ${d}</div><div style="white-space:pre;">Plg : ${esc(o.customer.name || 'Guest').substring(0, 20)}</div><div style="white-space:pre;">Tipe : ${o.customer.deliveryMethod === 'delivery' ? 'Kurir' : 'Toko'}</div><div class="border-b border-dashed border-black my-2"></div>${o.customer.note ? `<div style="white-space:pre-wrap;word-break:break-all;">Cat: ${esc(o.customer.note)}</div><div class="border-b border-dashed border-black my-2"></div>` : ''}`;

  o.items.forEach(i => {
    const n = (esc(i.name) + (i.variantName ? ` (${esc(i.variantName)})` : '')).substring(0, 32);
    const q = `${i.qty}${i.unit ? ' ' + i.unit : ''} x ${i.effectivePrice.toLocaleString('id-ID')}`;
    const t = (i.qty * i.effectivePrice).toLocaleString('id-ID');
    h += `<div style="white-space:pre-wrap;font-weight:bold;word-break:break-all;">${n}</div><div style="white-space:pre;font-size:11px;">${pL(q, t)}</div>`;
  });

  h += `<div class="border-b border-dashed border-black my-2"></div><div style="white-space:pre;">${pL('Subtotal', (o.payment?.subtotal || 0).toLocaleString('id-ID'))}</div>`;
  if (o.payment?.productDiscount) {
    h += `<div style="white-space:pre;">${pL('Diskon', `-${o.payment.productDiscount.toLocaleString('id-ID')}`)}</div>`;
  }
  if (o.customer?.deliveryMethod !== 'pickup') {
    h += `<div style="white-space:pre;">${pL('Ongkir', (o.payment?.shippingCost || 0).toLocaleString('id-ID'))}</div>`;
  }
  if (o.payment?.shippingDiscount) {
    h += `<div style="white-space:pre;">${pL('Pot.Ongkir', `-${o.payment.shippingDiscount.toLocaleString('id-ID')}`)}</div>`;
  }
  h += `<div class="border-b border-dashed border-black my-2"></div><div style="white-space:pre;font-weight:bold;font-size:12px;">${pL('TOTAL', 'Rp ' + (o.payment?.grandTotal || 0).toLocaleString('id-ID'))}</div><div style="white-space:pre;">${pL('Bayar:', String(o.payment?.method || '').toUpperCase())}</div><div class="border-b border-dashed border-black my-2"></div><div class="text-center my-2" style="font-size:10px;">Terima Kasih</div><div class="border-b border-dashed border-black my-2"></div><div style="height:15px;"></div>`;

  setH('receipt-paper-content', h);
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
  const o = gOrds.find(x => x.orderId === cVOrd);
  if (!o) return;
  if (window.AppInventor) {
    try {
      const len = 32;
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
      let sT = pC(appData.store.name || "Toko") + "\n";
      if (appData.store.slogan) sT += pC(appData.store.slogan) + "\n";
      sT += "-".repeat(len) + "\n";
      sT += pLR("ID: " + o.orderId, "") + "\n";
      let ds = o.dateString ? new Date(o.dateString).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleString('id-ID');
      sT += pLR("Tgl: " + ds, "") + "\n";
      sT += pLR("Plg: " + (o.customer?.name || "Guest").substring(0, 18), "") + "\n";
      sT += pLR("Tipe: " + (o.customer?.deliveryMethod === 'delivery' ? 'Kurir' : 'Toko'), "") + "\n";
      sT += "-".repeat(len) + "\n";
      (o.items || []).forEach(i => {
        let n = String(i.name);
        if (i.variantName) n += ` (${i.variantName})`;
        n = n.substring(0, len);
        sT += n + "\n";
        let q = `${i.qty}${i.unit ? ' ' + i.unit : ''} x ${(i.effectivePrice || 0).toLocaleString('id-ID')}`;
        let t = ((i.effectivePrice || 0) * (i.qty || 0)).toLocaleString('id-ID');
        sT += pLR(" " + q, t) + "\n";
      });
      sT += "-".repeat(len) + "\n";
      sT += pLR("Subtotal", (o.payment?.subtotal || 0).toLocaleString('id-ID')) + "\n";
      if (o.payment?.productDiscount) sT += pLR("Diskon Brg", "-" + o.payment.productDiscount.toLocaleString('id-ID')) + "\n";
      if (o.customer?.deliveryMethod !== 'pickup') {
        sT += pLR("Ongkir", (o.payment?.shippingCost || 0).toLocaleString('id-ID')) + "\n";
      }
      sT += "-".repeat(len) + "\n";
      sT += pLR("TOTAL", "Rp " + (o.payment?.grandTotal || 0).toLocaleString('id-ID')) + "\n";
      sT += pLR("BAYAR", String(o.payment?.method || "").toUpperCase()) + "\n";
      sT += "-".repeat(len) + "\n";
      sT += pC("Terima Kasih") + "\n";
      sT += pC("Barang yg sudah dibeli") + "\n";
      sT += pC("tidak dpt dikembalikan") + "\n\n\n\n";
      let b64 = btoa(unescape(encodeURIComponent(sT)));
      window.AppInventor.setWebViewString("PRINT_THERMAL|||base64," + b64);
      showToast("Mengirim ke printer...");
    } catch (err) {
      showToast('Gagal memuat struk: error encode');
    }
  } else {
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
  const imgRatio = tempPdfData.width / tempPdfData.height;
  const a4Ratio = a4Width / a4Height;
  let renderW = a4Width;
  let renderH = a4Height;
  let offsetX = 0;
  let offsetY = 0;
  if (imgRatio > a4Ratio) {
    renderH = a4Width / imgRatio;
    offsetY = (a4Height - renderH) / 2;
  } else {
    renderW = a4Height * imgRatio;
    offsetX = (a4Width - renderW) / 2;
  }
  pdf.addImage(tempPdfData.imgData, 'PNG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
  pdf.save(tempPdfData.fileName);
  showToast(tempPdfData.type === 'invoice' ? 'Invoice A4 berhasil diunduh!' : 'Surat Jalan A4 berhasil diunduh!');
  closePreviewModal();
};

window.executeDownloadImage = () => {
  if (!tempPdfData) return;
  const link = document.createElement('a');
  link.download = tempPdfData.fileName.replace('.pdf', '.png'); 
  link.href = tempPdfData.imgData;
  link.click();
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

window.generateA4Document = async (type) => {
  if (isSaving) return;
  const o = gOrds.find(x => x.orderId === cVOrd);
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

    if (type === 'invoice') {
      setIn('inv-store-name', appData.store.name || 'TOKO GRAFIKA');
      setIn('inv-store-address', appData.store.address || 'Alamat Toko');
      setH('inv-store-wa', `<i class='fa-brands fa-whatsapp text-emerald-600 mr-1'></i> WA: ${esc(appData.store.wa || '-')}`);
      setIn('inv-id', '#' + o.orderId);
      setIn('inv-date', formattedDate);
      setIn('inv-cust-name', o.customer?.name || 'Pelanggan');
      setIn('inv-cust-address', o.customer?.address || '-');
      setIn('inv-method', (o.payment?.method || 'CASH').toUpperCase());
      
      const invLogoBox = el('inv-logo-box');
      const invLogoImg = el('inv-logo-img');
      const invLogoSvg = el('inv-logo-svg');

      if (invLogoBox) invLogoBox.style.backgroundColor = themeClr;

      if (base64Logo) {
        if (invLogoImg) {
          invLogoImg.src = base64Logo;
          invLogoImg.style.display = 'block';
          invLogoImg.classList.remove('hidden');
        }
        if (invLogoSvg) {
          invLogoSvg.style.display = 'none';
          invLogoSvg.classList.add('hidden');
        }
      } else {
        if (invLogoImg) {
          invLogoImg.style.display = 'none';
          invLogoImg.classList.add('hidden');
        }
        if (invLogoSvg) {
          invLogoSvg.style.display = 'block';
          invLogoSvg.classList.remove('hidden');
        }
      }
      
      let itemsHtml = (o.items || []).map((item, index) => {
        const isGrosir = item.effectivePrice < item.price;
        const varKeterangan = [item.variantName, (isGrosir ? 'Grosir' : '')].filter(Boolean).join(' · ');

        return `
        <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #334155;">
          <td style="padding: 10px 8px 10px 0; font-weight: 800; color: #0f172a; vertical-align: middle; width: 26%; white-space: nowrap;">
            ${item.qty}${item.unit ? ` <span style="color:${themeClr}; font-weight:700;">${esc(item.unit)}</span>` : ''}${varKeterangan ? ` <span style="font-size:9px; color:#64748b; font-weight:600;">(${esc(varKeterangan)})</span>` : ''}
          </td>
          <td style="padding: 10px 8px; font-weight: 600; vertical-align: middle; width: 34%; word-break: break-word; line-height: 1.4;">
            ${esc(item.name)}
          </td>
          <td style="padding: 10px 8px; text-align: right; vertical-align: middle; width: 20%; word-break: break-word;">
            ${fCur(item.effectivePrice)}
          </td>
          <td style="padding: 10px 0 10px 8px; text-align: right; font-weight: 800; color: #0f172a; vertical-align: middle; width: 20%; word-break: break-word;">
            ${fCur(item.effectivePrice * item.qty)}
          </td>
        </tr>
        `;
      }).join('');
      setH('inv-items', itemsHtml);
      
      setIn('inv-subtotal', fCur(o.payment?.subtotal || 0));
      if (o.payment?.productDiscount) {
        show('inv-discount-row');
        setIn('inv-discount', '-' + fCur(o.payment.productDiscount));
      } else hide('inv-discount-row');
      
      if (o.customer?.deliveryMethod !== 'pickup') {
        show('inv-shipping-row');
        setIn('inv-shipping', fCur(o.payment?.shippingCost || 0));
      } else hide('inv-shipping-row');

      if (o.payment?.shippingDiscount) {
        show('inv-shipping-discount-row');
        setIn('inv-shipping-discount', '-' + fCur(o.payment.shippingDiscount));
      } else hide('inv-shipping-discount-row');
      
      setIn('inv-grandtotal', fCur(o.payment?.grandTotal || 0));
      setIn('inv-footer-text', appData.store.footerText || 'Terima kasih telah berbelanja.');
      
    } else {
      setIn('sj-store-name', appData.store.name || 'TOKO GRAFIKA');
      setIn('sj-store-address', appData.store.address || '-');
      setIn('sj-store-wa', 'WA: ' + (appData.store.wa || '-'));
      setIn('sj-id', '#SJ-' + o.orderId);
      setIn('sj-date', formattedDate);
      setIn('sj-sender-name', appData.store.name || 'TOKO GRAFIKA');
      setIn('sj-cust-name', o.customer?.name || 'Anonim');
      setIn('sj-cust-address', o.customer?.address || '-');
      setIn('sj-sign-store', appData.store.name || 'Pihak Toko');
      
      const sjLogoBox = el('sj-logo-box');
      const sjLogoImg = el('sj-logo-img');
      const sjLogoSvg = el('sj-logo-svg');

      if (sjLogoBox) sjLogoBox.style.backgroundColor = themeClr;

      if (base64Logo) {
        if (sjLogoImg) {
          sjLogoImg.src = base64Logo;
          sjLogoImg.style.display = 'block';
          sjLogoImg.classList.remove('hidden');
        }
        if (sjLogoSvg) {
          sjLogoSvg.style.display = 'none';
          sjLogoSvg.classList.add('hidden');
        }
      } else {
        if (sjLogoImg) {
          sjLogoImg.style.display = 'none';
          sjLogoImg.classList.add('hidden');
        }
        if (sjLogoSvg) {
          sjLogoSvg.style.display = 'block';
          sjLogoSvg.classList.remove('hidden');
        }
      }

      if (o.customer?.note) {
        show('sj-cust-note');
        setIn('sj-cust-note', 'Catatan: ' + o.customer.note);
      } else hide('sj-cust-note');
      
      let itemsHtml = (o.items || []).map((item, index) => {
        const isGrosir = item.effectivePrice < item.price;
        const varKeterangan = [item.variantName, (isGrosir ? 'Grosir' : '')].filter(Boolean).join(' · ');
        const varHtml = varKeterangan ? `${esc(varKeterangan)}` : '-';

        return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #334155;">
          <td style="padding: 10px 16px; border-right: 1px solid #e2e8f0; vertical-align: top; width: 48%; word-break: break-word; line-height: 1.4;">
            ${esc(item.name)}
          </td>
          <td style="padding: 10px 16px; border-right: 1px solid #e2e8f0; text-align: center; vertical-align: top; font-weight: 800; color: #0f172a; width: 20%; word-break: break-word;">
            ${item.qty}${item.unit ? ' <span style="font-size:9px; color:'+themeClr+'; font-weight:700;">'+esc(item.unit)+'</span>' : ''}
          </td>
          <td style="padding: 10px 16px; color: #64748b; vertical-align: top; width: 32%; word-break: break-word; font-size: 10px;">
            ${varHtml}
          </td>
        </tr>
        `;
      }).join('');
      setH('sj-items', itemsHtml);
    }
    
    const targetId = type === 'invoice' ? 'template-invoice' : 'template-surat-jalan';
    const element = document.getElementById(targetId);
    
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '-9999px'; 
    tempContainer.style.width = '794px'; 
    tempContainer.style.minWidth = '794px';
    tempContainer.style.maxWidth = '794px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.zIndex = '-9999'; 
    tempContainer.style.overflow = 'hidden';
    
    const clone = element.cloneNode(true);
    clone.style.display = 'flex';
    clone.style.width = '794px'; 
    clone.style.minHeight = '1123px';
    clone.style.margin = '0';
    clone.style.boxSizing = 'border-box';
    
    const cloneImg = clone.querySelector(type === 'invoice' ? '#inv-logo-img' : '#sj-logo-img');
    const cloneSvg = clone.querySelector(type === 'invoice' ? '#inv-logo-svg' : '#sj-logo-svg');
    if (base64Logo) {
      if (cloneImg) {
        cloneImg.src = base64Logo;
        cloneImg.style.display = 'block';
        cloneImg.style.width = '100%';
        cloneImg.style.height = '100%';
        cloneImg.style.objectFit = 'contain';
        cloneImg.classList.remove('hidden');
      }
      if (cloneSvg) cloneSvg.remove();
    } else {
      if (cloneImg) cloneImg.remove();
      if (cloneSvg) {
        cloneSvg.style.display = 'block';
        cloneSvg.classList.remove('hidden');
      }
    }
    
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      imageTimeout: 1500,
      logging: false,
      width: 794,
      windowWidth: 794,
      scrollX: 0, 
      scrollY: 0
    });
    
    document.body.removeChild(tempContainer);
    
    const imgData = canvas.toDataURL('image/png');
    
    tempPdfData = {
      imgData: imgData,
      width: canvas.width,
      height: canvas.height,
      type: type,
      fileName: type === 'invoice' ? `Invoice_${o.orderId}.pdf` : `Surat_Jalan_${o.orderId}.pdf`
    };

    document.getElementById('preview-img-result').src = imgData;
    const previewModal = document.getElementById('pdf-preview-modal');
    previewModal.classList.remove('hidden');
    previewModal.classList.add('flex');
    
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
