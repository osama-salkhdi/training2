// =====================================================================
//  استيراد أسئلة الاختبار من: ملف HTML (فيه const QUESTIONS = [...])، أو PDF، أو نص
//  لا يُنفَّذ أي كود من الملف (لا eval): المصفوفة تُقرأ بمحلل خاص آمن.
// =====================================================================
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------- 1) محلل JavaScript literal آمن ---------- */
export function parseJsLiteral(src) {
  let i = 0;
  const err = m => { throw new Error(m + ' (الموضع ' + i + ')'); };
  const ws = () => {
    for (;;) {
      while (i < src.length && /\s/.test(src[i])) i++;
      if (src.startsWith('//', i)) { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
      break;
    }
  };
  const str = () => {
    const q = src[i++]; let out = '';
    while (i < src.length && src[i] !== q) {
      let c = src[i++];
      if (c === '\\') {
        const n = src[i++];
        const map = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
        if (n === 'u') { if (src[i] === '{') { const e = src.indexOf('}', i); c = String.fromCodePoint(parseInt(src.slice(i + 1, e), 16)); i = e + 1; } else { c = String.fromCharCode(parseInt(src.substr(i, 4), 16)); i += 4; } }
        else if (n === 'x') { c = String.fromCharCode(parseInt(src.substr(i, 2), 16)); i += 2; }
        else if (n === '\n') c = '';
        else c = map[n] ?? n;
      } else if (q === '`' && c === '$' && src[i] === '{') err('قوالب ${} غير مدعومة');
      out += c;
    }
    if (src[i] !== q) err('نص غير مغلق'); i++; return out;
  };
  const ident = () => { const m = /^[A-Za-z_$؀-ۿ][\w$؀-ۿ]*/.exec(src.slice(i)); if (!m) err('رمز غير متوقع «' + src[i] + '»'); i += m[0].length; return m[0]; };
  const val = () => {
    ws(); const c = src[i];
    if (c === '[') { i++; const a = []; for (;;) { ws(); if (src[i] === ']') { i++; return a; } a.push(val()); ws(); if (src[i] === ',') { i++; continue; } if (src[i] === ']') { i++; return a; } err('متوقع , أو ]'); } }
    if (c === '{') { i++; const o = {}; for (;;) { ws(); if (src[i] === '}') { i++; return o; }
      const k = (src[i] === '"' || src[i] === "'" || src[i] === '`') ? str() : /\d/.test(src[i]) ? String(num()) : ident();
      ws(); if (src[i] === ',' || src[i] === '}') { o[k] = undefined; } else { if (src[i] !== ':') err('متوقع :'); i++; o[k] = val(); }
      ws(); if (src[i] === ',') { i++; continue; } if (src[i] === '}') { i++; return o; } err('متوقع , أو }'); } }
    if (c === '"' || c === "'" || c === '`') return str();
    if (/[-+\d.]/.test(c)) return num();
    const id = ident();
    if (id === 'true') return true; if (id === 'false') return false; if (id === 'null' || id === 'undefined') return null;
    err('قيمة غير مدعومة: ' + id);
  };
  const num = () => { const m = /^[-+]?(0x[\da-f]+|\d*\.?\d+(e[-+]?\d+)?)/i.exec(src.slice(i)); if (!m) err('رقم غير صالح'); i += m[0].length; return Number(m[0]); };
  const v = val(); return v;
}

// يجد المصفوفة بعد const/let/var QUESTIONS = (أو أي اسم مشابه) ويقتطعها بموازنة الأقواس
export function extractArray(text, names = ['QUESTIONS', 'questions', 'QUIZ', 'quiz', 'DATA', 'data']) {
  for (const n of names) {
    const re = new RegExp('(?:const|let|var|window\\.)\\s*' + n + '\\s*=\\s*\\[', 'g');
    const m = re.exec(text); if (!m) continue;
    let i = m.index + m[0].length - 1, depth = 0, q = null;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === '`') { q = c; continue; }
      if (c === '/' && text[j + 1] === '/') { j = text.indexOf('\n', j); if (j < 0) break; continue; }
      if (c === '/' && text[j + 1] === '*') { j = text.indexOf('*/', j + 2) + 1; continue; }
      if (c === '[') depth++; else if (c === ']') { depth--; if (depth === 0) return text.slice(i, j + 1); }
    }
  }
  return null;
}

/* ---------- 2) توحيد شكل الأسئلة ---------- */
const AR_LETTERS = { 'أ': 0, 'ا': 0, 'ب': 1, 'ج': 2, 'د': 3, 'ه': 4, 'هـ': 4, 'و': 5 };
function letterIndex(s) {
  s = String(s).trim().replace(/[()\[\].:\-\s]/g, '');
  if (s in AR_LETTERS) return AR_LETTERS[s];
  if (/^[a-fA-F]$/.test(s)) return s.toLowerCase().charCodeAt(0) - 97;
  return null;
}
const pick = (o, keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return undefined; };
const strip = s => String(s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export function normalizeQuestions(arr) {
  if (!Array.isArray(arr)) throw new Error('الملف لا يحتوي مصفوفة أسئلة');
  const raw = arr.filter(q => q && typeof q === 'object').map(q => {
    const text = pick(q, ['q', 'question', 'text', 'title', 'stem', 'prompt', 'body', 'سؤال', 'السؤال']);
    let options = pick(q, ['options', 'choices', 'answers', 'opts', 'a', 'alternatives', 'الخيارات']);
    let correctFromOpts = null;
    if (!options) { const L = ['A', 'B', 'C', 'D', 'E', 'F'].filter(k => q[k] !== undefined); if (L.length >= 2) options = L.map(k => q[k]); }
    if (options && !Array.isArray(options) && typeof options === 'object') options = Object.values(options);
    options = (options || []).map((o, k) => {
      if (o && typeof o === 'object') { if (o.correct === true || o.isCorrect === true || o.right === true) correctFromOpts = k; return String(pick(o, ['text', 'label', 'value', 'answer', 'option']) ?? ''); }
      return String(o ?? '');
    });
    let correct = pick(q, ['answer', 'correct', 'correctIndex', 'correct_index', 'ans', 'c', 'key', 'correctAnswer', 'right', 'solutionIndex', 'الجواب', 'الإجابة']);
    return { text: String(text ?? ''), options, rawCorrect: correctFromOpts ?? correct,
      explanation: String(pick(q, ['explanation', 'explain', 'exp', 'hint', 'solution', 'feedback', 'الشرح']) ?? ''),
      points: Number(pick(q, ['points', 'score', 'mark', 'marks', 'weight'])) || 1,
      sec: Number(pick(q, ['time', 'sec', 'seconds', 'timer', 'timeLimit'])) || null };
  });
  // هل الأرقام تبدأ من 1؟ (إن لم يظهر 0 قط وظهرت قيمة تساوي عدد الخيارات)
  const nums = raw.filter(r => typeof r.rawCorrect === 'number');
  const oneBased = nums.length > 0 && !nums.some(r => r.rawCorrect === 0) && nums.some(r => r.rawCorrect === r.options.length);
  return raw.map(r => {
    let c = null, v = r.rawCorrect;
    if (Array.isArray(v)) v = v[0];
    if (typeof v === 'number') c = oneBased ? v - 1 : v;
    else if (typeof v === 'string') {
      const t = v.trim();
      if (/^\d+$/.test(t)) c = oneBased ? +t - 1 : +t;
      else if (letterIndex(t) !== null && t.replace(/[()\[\].:\-\s]/g, '').length <= 2) c = letterIndex(t);
      else { const k = r.options.findIndex(o => strip(o) === strip(t)); if (k >= 0) c = k; }
    }
    if (c !== null && (c < 0 || c >= r.options.length)) c = null;
    return { id: rid(), text: r.text, options: r.options, correct: c, points: r.points, sec: r.sec, explanation: r.explanation };
  }).filter(q => q.text || q.options.length);
}

/* ---------- 3) تحليل النص (من PDF أو لصق) ---------- */
const Q_RE = /^\s*(?:س\s*|سؤال\s*|Q\s*)?(\d{1,3})\s*[.)\-ـ:–]\s*(.*)$/i;
const OPT_RE = /^\s*[(\[]?\s*(أ|ا|ب|ج|د|هـ|ه|و|[a-fA-F])\s*[)\].\-:–]\s*(.+)$/;
const ANS_RE = /^\s*(?:الإجابة الصحيحة|الاجابة الصحيحة|الإجابة|الاجابة|الجواب الصحيح|الجواب|الحل|answer|ans|correct)\s*[:：\-–=]\s*(.+)$/i;
const EXP_RE = /^\s*(?:الشرح|التفسير|التعليل|explanation|explain)\s*[:：\-–]\s*(.+)$/i;
const MARK_RE = /\s*(\*|✓|✔|☑|\(صح\)|\(صحيح\)|\[صح\]|\(correct\))\s*/i;

export function parseText(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').map(l => l.replace(/‏|‎/g, '').trim()).filter(Boolean);
  const out = []; let cur = null;
  const push = () => { if (cur && (cur.text || cur.options.length)) out.push(cur); };
  for (const line of lines) {
    let m;
    if ((m = ANS_RE.exec(line)) && cur) {
      const v = m[1].trim(); const li = letterIndex(v.split(/\s|\)/)[0]);
      if (li !== null && li < cur.options.length) cur.correct = li;
      else { const k = cur.options.findIndex(o => strip(o) === strip(v)); if (k >= 0) cur.correct = k; else if (/^\d+$/.test(v) && +v >= 1 && +v <= cur.options.length) cur.correct = +v - 1; }
      continue;
    }
    if ((m = EXP_RE.exec(line)) && cur) { cur.explanation = m[1].trim(); continue; }
    if ((m = OPT_RE.exec(line)) && cur) {
      let t = m[2]; if (MARK_RE.test(t)) { t = t.replace(MARK_RE, ' ').trim(); cur.correct = cur.options.length; }
      cur.options.push(t); continue;
    }
    if ((m = Q_RE.exec(line)) && (!cur || cur.options.length || !cur.text)) {
      push(); cur = { id: rid(), text: m[2].trim(), options: [], correct: null, points: 1, sec: null, explanation: '' }; continue;
    }
    if (cur) { if (cur.options.length) cur.options[cur.options.length - 1] += ' ' + line; else cur.text += (cur.text ? ' ' : '') + line; }
  }
  push();
  return out.filter(q => q.options.length >= 2);
}

/* ---------- 4) قراءة الملفات ---------- */
function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html.replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr|\/section)[^>]*>/gi, '$&\n'), 'text/html');
  doc.querySelectorAll('script,style,noscript').forEach(n => n.remove());
  return (doc.body ? doc.body.textContent : '').replace(/\n\s*\n+/g, '\n');
}
async function pdfToText(file) {
  const pdfjs = await import(PDFJS);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p); const tc = await page.getTextContent();
    const rows = new Map();
    for (const it of tc.items) { if (!it.str || !it.str.trim()) continue; const y = Math.round(it.transform[5] / 3) * 3; if (!rows.has(y)) rows.set(y, []); rows.get(y).push(it); }
    [...rows.keys()].sort((a, b) => b - a).forEach(y => {
      const items = rows.get(y); const rtl = items.some(it => /[؀-ۿ]/.test(it.str));
      items.sort((a, b) => rtl ? b.transform[4] - a.transform[4] : a.transform[4] - b.transform[4]);
      lines.push(items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim());
    });
  }
  return lines.join('\n');
}

// النتيجة: { questions, source, warnings }
export async function importFile(file) {
  const name = (file.name || '').toLowerCase();
  const warnings = [];
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    const text = await pdfToText(file);
    const qs = parseText(text);
    if (!qs.length) throw new Error('لم أتعرف على أسئلة في ملف PDF. تأكد أن كل سؤال يبدأ برقم (1. أو 1-) وأن الخيارات تبدأ بحروف (أ) ب) ج) ...)، أو انسخ النص والصقه في «لصق نص».');
    warnings.push('النص المستخرج من PDF قد يحتاج مراجعة، خاصة مع العربية: راجع الأسئلة قبل الحفظ.');
    return { questions: qs, source: 'PDF', warnings, text };
  }
  const text = await file.text();
  if (name.endsWith('.json')) return { questions: normalizeQuestions(JSON.parse(text)), source: 'JSON', warnings };
  const arr = extractArray(text);
  if (arr) {
    let data; try { data = JSON.parse(arr); } catch (e) { data = parseJsLiteral(arr); }
    return { questions: normalizeQuestions(data), source: 'HTML (QUESTIONS)', warnings };
  }
  const qs = parseText(/<[a-z][\s\S]*>/i.test(text) ? htmlToText(text) : text);
  if (!qs.length) throw new Error('لم أجد مصفوفة QUESTIONS ولا أسئلة مرقّمة في الملف.');
  return { questions: qs, source: name.endsWith('.txt') ? 'نص' : 'HTML (نص)', warnings };
}

/* ---------- 5) منقّح HTML للأسئلة (يسمح بالتنسيق والكسور والمعادلات فقط) ---------- */
const OK_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'SUP', 'SUB', 'BR', 'SPAN', 'DIV', 'P', 'SMALL', 'CODE', 'PRE', 'TABLE', 'TBODY', 'TR', 'TD', 'TH', 'UL', 'OL', 'LI', 'IMG',
  'MATH', 'MI', 'MN', 'MO', 'MROW', 'MFRAC', 'MSUP', 'MSUB', 'MSQRT', 'MROOT', 'MTEXT', 'MSPACE', 'MSUBSUP', 'MOVER', 'MUNDER', 'MTABLE', 'MTR', 'MTD']);
const OK_STYLE = /^(color|background-color|font-weight|font-style|font-size|text-align|vertical-align|display|border-bottom|border-top|padding[\w-]*|margin[\w-]*|line-height|direction|width|text-decoration)$/i;
export function sanitize(html) {
  const s = String(html ?? '');
  if (!/[<&]/.test(s)) return s.replace(/\n/g, '<br>');
  const doc = new DOMParser().parseFromString('<div>' + s + '</div>', 'text/html');
  const walk = el => {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) return;
      if (n.nodeType !== 1 || !OK_TAGS.has(n.tagName.toUpperCase())) { if (n.nodeType === 1 && !/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/i.test(n.tagName)) { walk(n); n.replaceWith(...n.childNodes); } else n.remove(); return; }
      [...n.attributes].forEach(a => {
        const k = a.name.toLowerCase();
        if (k === 'style') { const st = a.value.split(';').map(x => x.trim()).filter(x => { const [p, v] = x.split(':'); return p && v && OK_STYLE.test(p.trim()) && !/url\(|expression|javascript/i.test(v); }).join(';'); st ? n.setAttribute('style', st) : n.removeAttribute('style'); }
        else if (k === 'src' && n.tagName.toUpperCase() === 'IMG') { if (!/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(a.value) && !/^https:\/\//i.test(a.value)) n.removeAttribute('src'); }
        else if (!['colspan', 'rowspan', 'alt', 'dir', 'mathvariant', 'display'].includes(k)) n.removeAttribute(a.name);
      });
      walk(n);
    });
  };
  const root = doc.body.firstChild; walk(root); return root.innerHTML;
}
