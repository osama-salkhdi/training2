// =====================================================================
//  طبقة البيانات: تعمل مع Supabase، أو بمحاكي داخل المتصفح (الوضع التجريبي)
//  الواجهة تتعامل مع كائن حالة واحد S، وهذه الطبقة تحوّل التغييرات إلى صفوف في الجداول.
// =====================================================================
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const DOMAIN = 'olymp.local';
export const DEMO = !SUPABASE_KEY || !/^https:\/\//.test(SUPABASE_URL) || /YOUR-|xxxx/i.test(SUPABASE_URL + SUPABASE_KEY);
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const BUCKET = 'submissions', MBUCKET = 'materials';
// ملفات المحاضرات مساراتها تبدأ بـ mat/ وتُخزَّن في bucket مستقل
const bk = p => String(p).startsWith('mat/') ? [MBUCKET, String(p).slice(4)] : [BUCKET, p];

/* ---------- أدوات ---------- */
export function sha256(s){const K=[],H=[];let p=2,c=0;const isP=n=>{for(let f=2;f*f<=n;f++)if(n%f===0)return false;return true};while(c<64){if(isP(p)){if(c<8)H[c]=(Math.pow(p,.5)*4294967296)|0;K[c++]=(Math.pow(p,1/3)*4294967296)|0}p++}
const b=new TextEncoder().encode(s),l=b.length,W=[];for(let i=0;i<l;i++)W[i>>2]|=b[i]<<((3-i%4)*8);W[l>>2]|=0x80<<((3-l%4)*8);const n=((l+8>>6)+1)*16;for(let i=0;i<n;i++)W[i]=W[i]|0;W[n-1]=l*8;
const h=H.slice(),w=[],r=(x,k)=>(x>>>k)|(x<<(32-k));for(let j=0;j<n;j+=16){const a=h.slice();for(let i=0;i<64;i++){if(i<16)w[i]=W[j+i];else{const s0=r(w[i-15],7)^r(w[i-15],18)^(w[i-15]>>>3),s1=r(w[i-2],17)^r(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}
const S1=r(a[4],6)^r(a[4],11)^r(a[4],25),ch=(a[4]&a[5])^(~a[4]&a[6]),t1=(a[7]+S1+ch+K[i]+w[i])|0,S0=r(a[0],2)^r(a[0],13)^r(a[0],22),mj=(a[0]&a[1])^(a[0]&a[2])^(a[1]&a[2]);a.pop();a.unshift((t1+S0+mj)|0);a[4]=(a[4]+t1)|0}for(let i=0;i<8;i++)h[i]=(h[i]+a[i])|0}
return h.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('')}
export const hashPw = (salt, pw) => sha256(salt + '|' + pw);
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const cleanUser = u => String(u || '').trim().toLowerCase();
function checkNewUser(username, password, needPw = true) {
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('اسم المستخدم: 3–32 حرفاً إنجليزياً أو أرقاماً أو . _ -');
  if ((needPw || password) && String(password || '').length < 6) throw new Error('كلمة المرور 6 أحرف على الأقل');
}
const strip = (x, extra = []) => { const o = { ...x }; delete o.id; extra.forEach(k => delete o[k]); return o; };
const prof = r => ({ id: r.id, username: r.username, name: r.name, role: r.role, studentId: r.student_id || '' });

/* ---------- خريطة المجموعات ← الجداول ---------- */
const T = {
  students: { table: 'students', to: x => ({ id: x.id, track_id: x.trackId || null, exam_no: (x.examNo || '').trim() || null, data: strip(x, ['trackId', 'examNo']) }), from: r => ({ ...r.data, id: r.id, trackId: r.track_id || '', examNo: r.exam_no || '' }) },
  tasks:    { table: 'tasks', to: x => ({ id: x.id, track_id: x.trackId || null, data: strip(x, ['trackId']) }), from: r => ({ ...r.data, id: r.id, trackId: r.track_id || '' }) },
  subs:     { table: 'submissions',
              to: x => ({ id: x.id, task_id: x.taskId, student_id: x.sid, status: x.status || 'submitted', score: x.score ?? null, feedback: x.feedback || '', data: strip(x, ['taskId', 'sid', 'status', 'score', 'feedback']) }),
              from: r => ({ ...r.data, id: r.id, taskId: r.task_id, sid: r.student_id, status: r.status, score: r.score == null ? null : +r.score, feedback: r.feedback || '' }) },
  sessions: { table: 'sessions', to: x => ({ id: x.id, data: strip(x) }), from: r => ({ ...r.data, id: r.id }) },
  notes:    { table: 'notes', to: x => ({ id: x.id, student_id: x.sid, data: strip(x, ['sid']) }), from: r => ({ ...r.data, id: r.id, sid: r.student_id }) },
  activity: { table: 'activity', insertOnly: true, to: x => ({ id: x.id, data: strip(x) }), from: r => ({ ...r.data, id: r.id }) },
  surveys:  { table: 'surveys', to: x => ({ id: x.id, data: strip(x) }), from: r => ({ ...r.data, id: r.id }) },
  exams:    { table: 'exams', to: x => ({ id: x.id, data: strip(x), updated_at: new Date().toISOString() }), from: r => ({ ...r.data, id: r.id }) },
  stages:   { table: 'stages', to: x => ({ id: x.id, data: strip(x) }), from: r => ({ ...r.data, id: r.id }) },
  materials:{ table: 'materials', to: x => ({ id: x.id, stage_id: String(x.stage), data: strip(x, ['stage']) }), from: r => ({ ...r.data, id: r.id, stage: r.stage_id }) },
  notifications: { table: 'notifications',
              to: x => ({ id: x.id, title: x.title || '', body: x.body || '', target: x.target || 'all', track_id: x.trackId || null, student_id: x.sid || null }),
              from: r => ({ id: r.id, title: r.title, body: r.body, target: r.target, trackId: r.track_id || '', sid: r.student_id || '', createdBy: r.created_by, createdAt: r.created_at }) },
};
const attemptFrom = r => ({ id: r.id, examId: r.exam_id, sid: r.student_id, userId: r.user_id, status: r.status, startedAt: r.started_at, finishedAt: r.finished_at,
  duration: r.duration_sec, score: r.score == null ? null : +r.score, max: r.max_score == null ? null : +r.max_score, answers: r.answers || {}, late: !!r.late });
const DB_TABLES = ['profiles', 'settings', 'students', 'tasks', 'submissions', 'sessions', 'notes', 'activity', 'surveys',
  'survey_responses', 'survey_participation', 'exams', 'exam_attempts', 'notifications', 'notification_reads',
  'stages', 'stage_secrets', 'stage_unlocks', 'materials', 'student_credentials'];

/* ---------- منطق الاختبارات للوضع التجريبي (نسخة من دوال الخادم) ---------- */
const num = v => (v === '' || v == null || isNaN(+v)) ? null : +v;
export function examLimitSec(e) {
  if (e.timerMode === 'total') return (num(e.totalMinutes) || 0) * 60;
  if (e.timerMode === 'perQuestion') return (e.questions || []).reduce((a, q) => a + (num(q.sec) ?? num(e.perQuestionSec) ?? 60), 0);
  return null;
}
export function examPublic(e) {
  return { id: e.id, title: e.title || '', desc: e.desc || '', status: e.status || 'draft', trackId: e.trackId || '', stage: e.stage || '', timerMode: e.timerMode || 'none',
    totalMinutes: num(e.totalMinutes), perQuestionSec: num(e.perQuestionSec), limitSec: examLimitSec(e), shuffle: !!e.shuffle,
    showAnswers: e.showAnswers !== false, passMark: num(e.passMark), openFrom: e.openFrom || null, openTo: e.openTo || null, count: (e.questions || []).length };
}
export function gradeAttempt(e, answers) {
  let score = 0, max = 0;
  for (const q of e.questions || []) { const p = num(q.points) ?? 1; max += p; if (answers[q.id] != null && String(answers[q.id]) === String(q.correct)) score += p; }
  return { score, max };
}
export function resultFor(e, a, show) {
  return { ...examPublic(e), attempt_id: a.id, score: a.score, max: a.max, duration: a.duration, started_at: a.startedAt, finished_at: a.finishedAt, late: a.late, showAnswers: show,
    questions: (e.questions || []).map(q => ({ id: q.id, text: q.text, options: q.options || [], points: num(q.points) ?? 1, chosen: a.answers[q.id] == null ? null : +a.answers[q.id],
      correct: show ? q.correct : null, explanation: show ? q.explanation : null, ok: a.answers[q.id] != null && String(a.answers[q.id]) === String(q.correct), time: (a.qTimes || {})[q.id] ?? null })) };
}
function demoFinalize(e, a) {
  if (a.status === 'submitted') return; const lim = examLimitSec(e), el = (Date.now() - new Date(a.startedAt)) / 1000;
  const g = gradeAttempt(e, a.answers);
  Object.assign(a, { status: 'submitted', finishedAt: new Date().toISOString(), duration: Math.round(lim != null ? Math.min(el, lim) : el), score: g.score, max: g.max, late: lim != null && el > lim + 60 });
}
export const COLLECTIONS = Object.keys(T);

/* ---------- IndexedDB لملفات الوضع التجريبي ---------- */
function idb() { return new Promise((res, rej) => { const r = indexedDB.open('olymp-demo-files', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function itx(db, mode, fn) { return new Promise((res, rej) => { const t = db.transaction('files', mode), q = fn(t.objectStore('files')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); }

/* =====================================================================
   1) المحاكي التجريبي (localStorage + IndexedDB)
   ===================================================================== */
const LS = 'olymp-demo-v1';
const demoApi = {
  mode: 'demo', me: null, db: null, get: () => null,
  attach(getState) { this.get = getState; },
  async init() {
    try { this.db = await idb(); } catch (e) { this.db = null; }
    let st = null; try { st = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}
    let me = null; try { const id = sessionStorage.getItem('olymp_uid'); me = st && st.users.find(u => u.id === id) || null; } catch (e) {}
    this.me = me; return { state: st, me };
  },
  async login(u, p) {
    const S = this.get(); const usr = S.users.find(x => x.username.toLowerCase() === cleanUser(u));
    if (!usr || hashPw(usr.salt, p) !== usr.hash) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    this.me = usr; try { sessionStorage.setItem('olymp_uid', usr.id); } catch (e) {}
    return usr;
  },
  async logout() { this.me = null; try { sessionStorage.removeItem('olymp_uid'); } catch (e) {} },
  async loadAll() { return JSON.parse(localStorage.getItem(LS) || 'null'); },
  async commit(prev, next) { localStorage.setItem(LS, JSON.stringify(next)); },
  uid() { return this.me ? this.me.id : 'anon'; },
  async createUser(d) {
    const S = this.get(), username = cleanUser(d.username); checkNewUser(username, d.password);
    if (S.users.some(x => x.username === username)) throw new Error('اسم المستخدم مستخدم مسبقاً');
    const salt = rid(); S.users.push({ id: 'u' + rid(), username, name: d.name || username, role: d.role, studentId: d.role === 'student' ? (d.studentId || '') : '', salt, hash: hashPw(salt, d.password) });
    await this.commit(null, S);
  },
  async updateUser(id, d) {
    const S = this.get(), x = S.users.find(u => u.id === id); if (!x) throw new Error('غير موجود');
    if (d.username !== undefined) { const un = cleanUser(d.username); checkNewUser(un, d.password, false); if (S.users.some(u => u.username === un && u.id !== id)) throw new Error('اسم المستخدم مستخدم مسبقاً'); x.username = un; }
    if (d.name !== undefined) x.name = d.name; if (d.role !== undefined) x.role = d.role; if (d.studentId !== undefined) x.studentId = d.studentId || '';
    if (d.password) { if (d.password.length < 6) throw new Error('كلمة المرور 6 أحرف على الأقل'); x.salt = rid(); x.hash = hashPw(x.salt, d.password); x.mustChange = false; }
    await this.commit(null, S);
  },
  async deleteUser(id) { const S = this.get(); S.users = S.users.filter(u => u.id !== id); await this.commit(null, S); },
  async changePassword(oldp, newp) {
    const S = this.get(), x = S.users.find(u => u.id === this.me.id);
    if (hashPw(x.salt, oldp) !== x.hash) throw new Error('كلمة المرور الحالية غير صحيحة');
    if (newp.length < 6) throw new Error('كلمة المرور 6 أحرف على الأقل');
    x.salt = rid(); x.hash = hashPw(x.salt, newp); x.mustChange = false; this.me = x; await this.commit(null, S);
  },
  async putFile(path, blob) { if (!this.db) throw new Error('المتصفح لا يدعم تخزين الملفات'); await itx(this.db, 'readwrite', o => o.put(blob, path)); },
  async getFile(path) { return this.db ? await itx(this.db, 'readonly', o => o.get(path)) : null; },
  async delFiles(paths) { if (this.db) for (const p of paths) await itx(this.db, 'readwrite', o => o.delete(p)); },
  async submitSurvey(surveyId, answers) {
    const S = this.get(), sv = S.surveys.find(s => s.id === surveyId);
    if (!sv || sv.status !== 'open') throw new Error('الاستبيان غير متاح للإجابة');
    if (S.participation.some(p => p.surveyId === surveyId && p.userId === this.me.id)) throw new Error('سبق أن أجبت على هذا الاستبيان');
    const st = S.students.find(s => s.id === this.me.studentId);
    const today = new Date().toISOString().slice(0, 10);
    S.participation.push({ surveyId, userId: this.me.id, date: today });
    S.responses.push({ id: rid(), surveyId, sid: sv.anonymous ? null : (this.me.studentId || null), trackId: st ? st.trackId : '', answers, date: today });
    await this.commit(null, S);
  },
  async deleteResponses(surveyId) { const S = this.get(); S.responses = S.responses.filter(r => r.surveyId !== surveyId); S.participation = S.participation.filter(p => p.surveyId !== surveyId); await this.commit(null, S); },
  _stu() { const S = this.get(); return S.students.find(s => s.id === this.me.studentId); },
  _canStage(id) {
    const S = this.get(); if (this.me.role !== 'student') return true; if (!id) return true;
    const g = S.stages.find(x => String(x.id) === String(id)); if (!g || !g.open) return false;
    if (g.restrict && !(g.allowed || []).includes(this.me.studentId)) return false;
    return S.unlocks.some(u => String(u.stage) === String(id) && u.userId === this.me.id);
  },
  async unlockStage(id, pw) {
    const S = this.get(), g = S.stages.find(x => String(x.id) === String(id));
    if (!g || !g.open) throw new Error('هذه المرحلة مغلقة حالياً');
    if (g.restrict && !(g.allowed || []).includes(this.me.studentId)) throw new Error('غير مسموح لك بدخول هذه المرحلة، راجع المشرف');
    const real = (S.stagePw || {})[id]; if (!real) throw new Error('لم تُحدَّد كلمة سر لهذه المرحلة بعد');
    if (String(pw || '').trim() !== real) throw new Error('كلمة السر غير صحيحة');
    if (!S.unlocks.some(u => String(u.stage) === String(id) && u.userId === this.me.id)) S.unlocks.push({ stage: String(id), userId: this.me.id, at: new Date().toISOString() });
    await this.commit(null, S);
  },
  async setStagePassword(id, pw) { const S = this.get(); S.stagePw = { ...(S.stagePw || {}), [id]: pw }; S.unlocks = S.unlocks.filter(u => String(u.stage) !== String(id)); await this.commit(null, S); },
  async saveCred(sid, username, password) { const S = this.get(); S.creds = S.creds.filter(c => c.sid !== sid); S.creds.push({ sid, username, password }); await this.commit(null, S); },
  async delCred(sid) { const S = this.get(); S.creds = S.creds.filter(c => c.sid !== sid); await this.commit(null, S); },
  async listMyExams() {
    const S = this.get(), st = this._stu();
    return S.exams.filter(e => ['open', 'closed'].includes(e.status) && this._canStage(e.stage))
      .map(e => { const a = S.attempts.find(x => x.examId === e.id && x.userId === this.me.id); return { ...examPublic(e), attempt: a ? { id: a.id, status: a.status, score: a.score, max: a.max, duration: a.duration, started_at: a.startedAt, finished_at: a.finishedAt, late: a.late } : null }; });
  },
  async startExam(id, no) {
    const S = this.get(), st = this._stu(), e = S.exams.find(x => x.id === id);
    if (!st) throw new Error('هذا الحساب غير مرتبط بطالب'); if (!e) throw new Error('الاختبار غير موجود');
    if (!st.examNo) throw new Error('لم يُحدَّد لك رقم امتحاني بعد، راجع المشرف');
    if (String(no || '').trim() !== st.examNo) throw new Error('الرقم الامتحاني غير صحيح');
    if (!this._canStage(e.stage)) throw new Error('هذا الاختبار ضمن مرحلة لم تدخلها بعد');
    let a = S.attempts.find(x => x.examId === id && x.userId === this.me.id);
    if (a && a.status === 'submitted') throw new Error('سبق أن قدّمت هذا الاختبار');
    if (!a) {
      if (e.status !== 'open') throw new Error('الاختبار غير متاح حالياً');
      if (e.openFrom && Date.now() < new Date(e.openFrom)) throw new Error('لم يحن موعد الاختبار بعد');
      if (e.openTo && Date.now() > new Date(e.openTo)) throw new Error('انتهت فترة إتاحة الاختبار');
      a = { id: rid(), examId: id, sid: st.id, userId: this.me.id, status: 'in_progress', startedAt: new Date().toISOString(), answers: {}, qTimes: {}, late: false }; S.attempts.push(a);
    } else { const lim = examLimitSec(e); if (lim != null && (Date.now() - new Date(a.startedAt)) / 1000 > lim + 60) { demoFinalize(e, a); await this.commit(null, S); return { finished: true, attempt_id: a.id }; } }
    await this.commit(null, S);
    return { ...examPublic(e), attempt_id: a.id, started_at: a.startedAt, server_now: new Date().toISOString(), answers: a.answers, student_name: st.name, exam_no: st.examNo,
      questions: (e.questions || []).map(q => ({ id: q.id, text: q.text, options: q.options || [], points: num(q.points) ?? 1, sec: num(q.sec) })) };
  },
  async saveExamProgress(aid, answers) {
    const S = this.get(), a = S.attempts.find(x => x.id === aid && x.userId === this.me.id); if (!a) throw new Error('محاولة غير موجودة');
    if (a.status === 'submitted') return { finished: true }; const e = S.exams.find(x => x.id === a.examId), lim = examLimitSec(e);
    if (lim != null && (Date.now() - new Date(a.startedAt)) / 1000 > lim + 60) { demoFinalize(e, a); await this.commit(null, S); return { finished: true }; }
    a.answers = answers || {}; await this.commit(null, S); return { ok: true };
  },
  async submitExam(aid, answers, qtimes) {
    const S = this.get(), a = S.attempts.find(x => x.id === aid && x.userId === this.me.id); if (!a) throw new Error('محاولة غير موجودة');
    const e = S.exams.find(x => x.id === a.examId);
    if (a.status !== 'submitted') { const lim = examLimitSec(e); if (lim == null || (Date.now() - new Date(a.startedAt)) / 1000 <= lim + 120) a.answers = answers || {}; a.qTimes = qtimes || {}; demoFinalize(e, a); await this.commit(null, S); }
    return this.examResult(aid);
  },
  async examResult(aid) {
    const S = this.get(), a = S.attempts.find(x => x.id === aid); const staff = this.me.role !== 'student';
    if (!a || (a.userId !== this.me.id && !staff)) throw new Error('غير مسموح'); if (a.status !== 'submitted') throw new Error('لم يُسلَّم الاختبار بعد');
    const e = S.exams.find(x => x.id === a.examId); return resultFor(e, a, staff || e.showAnswers !== false);
  },
  async resetAttempt(aid) { const S = this.get(); S.attempts = S.attempts.filter(a => a.id !== aid); await this.commit(null, S); },
  async markRead(ids) { const S = this.get(); const at = new Date().toISOString(); ids.forEach(nid => { if (!S.reads.some(r => r.nid === nid && r.userId === this.me.id)) S.reads.push({ nid, userId: this.me.id, at }); }); await this.commit(null, S); },
  subscribe() {},
  async reset() { localStorage.removeItem(LS); if (this.db) await itx(this.db, 'readwrite', o => o.clear()); },
};

/* =====================================================================
   2) Supabase
   ===================================================================== */
let sb = null;
const chk = async q => { const { error } = await q; if (error) throw error; };
async function fetchAll(table, mod) {
  const out = []; let from = 0;
  for (;;) {
    let q = sb.from(table).select('*').range(from, from + 999); if (mod) q = mod(q);
    const { data, error } = await q; if (error) throw error;
    out.push(...data); if (data.length < 1000) break; from += 1000;
  }
  return out;
}
const sbApi = {
  mode: 'supabase', user: null, me: null,
  attach() {},
  async init() {
    const { createClient } = await import(SUPABASE_JS);
    sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return { state: null, me: null };
    this.user = session.user; const me = await this.profile();
    if (!me) { await sb.auth.signOut(); return { state: null, me: null }; }
    this.me = me; return { state: await this.loadAll(), me };
  },
  async profile() { const { data, error } = await sb.from('profiles').select('*').eq('id', this.user.id).maybeSingle(); if (error) throw error; return data && prof(data); },
  async login(u, p) {
    const { data, error } = await sb.auth.signInWithPassword({ email: cleanUser(u) + '@' + DOMAIN, password: p });
    if (error) throw new Error(/invalid/i.test(error.message) ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : error.message);
    this.user = data.user; const me = await this.profile();
    if (!me) { await sb.auth.signOut(); throw new Error('هذا الحساب غير مرتبط بملف في المنصة'); }
    this.me = me; return me;
  },
  async logout() { await sb.auth.signOut(); this.me = null; },
  async loadAll() {
    const [settings, profiles, attempts, reads, unlocks, secrets, creds, activity, responses, participation, ...cols] = await Promise.all([
      fetchAll('settings'), fetchAll('profiles'), fetchAll('exam_attempts'), fetchAll('notification_reads'),
      fetchAll('stage_unlocks'), fetchAll('stage_secrets'), fetchAll('student_credentials'),
      sb.from('activity').select('*').order('created_at', { ascending: false }).limit(80).then(({ data, error }) => { if (error) throw error; return data; }),
      fetchAll('survey_responses'), fetchAll('survey_participation'),
      ...COLLECTIONS.filter(k => k !== 'activity').map(k => fetchAll(T[k].table)),
    ]);
    const st = { settings: settings[0] ? settings[0].data : null, users: profiles.map(prof) };
    COLLECTIONS.filter(k => k !== 'activity').forEach((k, i) => st[k] = cols[i].map(T[k].from));
    st.activity = activity.map(r => ({ ...T.activity.from(r), d: r.data.d || r.created_at }));
    st.responses = responses.map(r => ({ id: r.id, surveyId: r.survey_id, sid: r.student_id, trackId: r.track_id || '', answers: r.data, date: r.created_on }));
    st.participation = participation.map(p => ({ surveyId: p.survey_id, userId: p.user_id, date: p.created_on }));
    st.attempts = attempts.map(attemptFrom);
    st.reads = reads.map(r => ({ nid: r.notification_id, userId: r.user_id, at: r.read_at }));
    st.unlocks = unlocks.map(r => ({ stage: r.stage_id, userId: r.user_id, at: r.unlocked_at }));
    st.stagePw = Object.fromEntries(secrets.map(r => [r.stage_id, r.password]));
    st.creds = creds.map(r => ({ sid: r.student_id, username: r.username, password: r.password }));
    st.notifications.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return st;
  },
  async commit(prev, next) {
    if (JSON.stringify(prev.settings) !== JSON.stringify(next.settings))
      await chk(sb.from('settings').upsert({ id: 1, data: next.settings, updated_at: new Date().toISOString() }));
    for (const k of COLLECTIONS) {
      const m = T[k], a = new Map((prev[k] || []).map(x => [x.id, x])), b = new Map((next[k] || []).map(x => [x.id, x]));
      const ups = [], dels = [];
      for (const [id, x] of b) { const o = a.get(id); if (!o) ups.push(m.to(x)); else if (!m.insertOnly && JSON.stringify(o) !== JSON.stringify(x)) ups.push(m.to(x)); }
      if (!m.insertOnly) for (const id of a.keys()) if (!b.has(id)) dels.push(id);
      for (let i = 0; i < ups.length; i += 500) {
        const chunk = ups.slice(i, i + 500);
        await chk(m.insertOnly ? sb.from(m.table).insert(chunk) : sb.from(m.table).upsert(chunk));
      }
      for (let i = 0; i < dels.length; i += 200) await chk(sb.from(m.table).delete().in('id', dels.slice(i, i + 200)));
    }
  },
  uid() { return this.user ? this.user.id : 'anon'; },
  async fn(body) {
    const { data, error } = await sb.functions.invoke('admin-users', { body });
    if (error) { let msg = error.message; try { const j = await error.context.json(); msg = j.error || msg; } catch (e) {} throw new Error(msg); }
    if (data && data.error) throw new Error(data.error); return data;
  },
  createUser(d) { return this.fn({ action: 'create', username: d.username, password: d.password, name: d.name, role: d.role, student_id: d.role === 'student' ? d.studentId : null }); },
  updateUser(id, d) { const b = { action: 'update', id }; ['username', 'name', 'role', 'password'].forEach(k => { if (d[k] !== undefined && d[k] !== '') b[k] = d[k]; }); if (d.studentId !== undefined) b.student_id = d.studentId || null; return this.fn(b); },
  deleteUser(id) { return this.fn({ action: 'delete', id }); },
  async changePassword(oldp, newp) {
    const { error: e1 } = await sb.auth.signInWithPassword({ email: this.user.email, password: oldp });
    if (e1) throw new Error('كلمة المرور الحالية غير صحيحة');
    if (newp.length < 6) throw new Error('كلمة المرور 6 أحرف على الأقل');
    const { error } = await sb.auth.updateUser({ password: newp }); if (error) throw error;
  },
  async putFile(path, blob) { const [b, n] = bk(path); const { error } = await sb.storage.from(b).upload(n, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' }); if (error) throw error; },
  async getFile(path) { const [b, n] = bk(path); const { data, error } = await sb.storage.from(b).download(n); return error ? null : data; },
  async delFiles(paths) { for (const B of [BUCKET, MBUCKET]) { const l = paths.filter(p => bk(p)[0] === B).map(p => bk(p)[1]); if (l.length) await sb.storage.from(B).remove(l); } },
  unlockStage(id, pw) { return this.rpc('unlock_stage', { p_stage: String(id), p_password: String(pw || '').trim() }); },
  setStagePassword(id, pw) { return this.rpc('set_stage_password', { p_stage: String(id), p_password: pw }); },
  async saveCred(sid, username, password) { await chk(sb.from('student_credentials').upsert({ student_id: sid, username, password, updated_at: new Date().toISOString() })); },
  async delCred(sid) { await chk(sb.from('student_credentials').delete().eq('student_id', sid)); },
  async submitSurvey(surveyId, answers) { const { error } = await sb.rpc('submit_survey', { p_survey: surveyId, p_answers: answers }); if (error) throw new Error(error.message); },
  async deleteResponses(surveyId) { await chk(sb.from('survey_responses').delete().eq('survey_id', surveyId)); await chk(sb.from('survey_participation').delete().eq('survey_id', surveyId)); },
  async rpc(name, args) { const { data, error } = await sb.rpc(name, args); if (error) throw new Error(error.message); return data; },
  listMyExams() { return this.rpc('list_my_exams', {}); },
  startExam(id, no) { return this.rpc('start_exam', { p_exam: id, p_exam_no: String(no || '').trim() }); },
  saveExamProgress(aid, answers) { return this.rpc('save_exam_progress', { p_attempt: aid, p_answers: answers }); },
  submitExam(aid, answers, qtimes) { return this.rpc('submit_exam', { p_attempt: aid, p_answers: answers, p_qtimes: qtimes }); },
  examResult(aid) { return this.rpc('exam_result', { p_attempt: aid }); },
  async resetAttempt(aid) { await chk(sb.from('exam_attempts').delete().eq('id', aid)); },
  async markRead(ids) { if (ids.length) await chk(sb.from('notification_reads').upsert(ids.map(id => ({ notification_id: id, user_id: this.user.id })), { onConflict: 'notification_id,user_id', ignoreDuplicates: true })); },
  // النسخة الاحتياطية الكاملة: كل الجداول كما هي + الحسابات بكلمات مرورها المشفّرة
  async exportBackup() {
    const tables = {}; for (const t of DB_TABLES) tables[t] = await fetchAll(t);
    const auth_users = await this.rpc('export_auth_users', {});
    return { format: 'olymp-db-backup', version: 3, date: new Date().toISOString(), source: SUPABASE_URL, tables, auth_users };
  },
  restoreBackup(dump) { return this.rpc('restore_backup', { p: { ...dump.tables, auth_users: dump.auth_users } }); },
  subscribe(cb) { sb.channel('olymp-all').on('postgres_changes', { event: '*', schema: 'public' }, () => cb()).subscribe(); },
  async reset() { throw new Error('غير متاح في وضع Supabase'); },
};

export const API = DEMO ? demoApi : sbApi;
