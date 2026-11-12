// =====================================================================
//  PWA + تطبيق أندرويد (Capacitor)
//  - في المتصفح: يسجّل Service Worker لتثبيت المنصة كتطبيق.
//  - داخل تطبيق أندرويد: يحوّل التنزيلات إلى حفظ/مشاركة، والطباعة إلى PDF، ويدير زر الرجوع.
// =====================================================================
const C = window.Capacitor;
const NATIVE = !!(C && C.isNativePlatform && C.isNativePlatform());

if (!NATIVE && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

if (NATIVE) {
  document.documentElement.classList.add('native');
  const P = C.Plugins || {};
  const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  // التنزيل: يُحفظ الملف في ذاكرة التطبيق المؤقتة ثم تُفتح نافذة «مشاركة / حفظ»
  window.__nativeSave = async (blob, name) => {
    const safe = String(name || 'file').replace(/[\\/:*?"<>|]/g, '-');
    const r = await P.Filesystem.writeFile({ path: safe, data: await toB64(blob), directory: 'CACHE' });
    await P.Share.share({ title: safe, url: r.uri, dialogTitle: 'حفظ أو مشاركة الملف' });
  };
  // الطباعة: تُحوَّل الصفحة الحالية إلى PDF ثم تُشارك
  const load = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('تعذّر تحميل مكتبة PDF')); document.head.appendChild(s); });
  window.print = async () => {
    try {
      if (!window.htmlToImage) await load('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js');
      if (!window.jspdf) await load('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      const el = document.querySelector('#modal.open .mbox') || document.querySelector('main');
      const cv = await window.htmlToImage.toCanvas(el, { pixelRatio: 1.5, backgroundColor: '#ffffff', filter: n => !(n.classList && n.classList.contains('noprint')) });
      const pdf = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' }), W = 595, H = 842, m = 20, w = W - 2 * m, pageH = Math.floor((H - 2 * m) * cv.width / w);
      for (let y = 0, i = 0; y < cv.height; y += pageH, i++) {
        const c = document.createElement('canvas'); c.width = cv.width; c.height = Math.min(pageH, cv.height - y);
        c.getContext('2d').drawImage(cv, 0, -y); if (i) pdf.addPage();
        pdf.addImage(c.toDataURL('image/jpeg', .9), 'JPEG', m, m, w, c.height * w / cv.width);
      }
      await window.__nativeSave(pdf.output('blob'), document.title + '.pdf');
    } catch (e) { alert('تعذّر إنشاء ملف PDF: ' + (e.message || e)); }
  };
  // زر الرجوع: يغلق العارض أو النافذة، ثم يرجع صفحة، ثم يخرج من التطبيق من الرئيسية
  if (P.App) P.App.addListener('backButton', () => {
    if (window.__back && window.__back()) return;
    const h = location.hash.slice(1);
    if (h && h !== 'home') history.back(); else P.App.exitApp();
  });
  if (P.StatusBar) { P.StatusBar.setBackgroundColor({ color: '#214539' }).catch(() => {}); P.StatusBar.setStyle({ style: 'DARK' }).catch(() => {}); }
}
