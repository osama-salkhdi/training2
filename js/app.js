// =====================================================================
//  منصة تدريب أولمبياد الرياضيات — الواجهة
// =====================================================================
import { API, DEMO, hashPw, examPublic, resultFor, gradeAttempt } from './api.js';
import { importFile, parseText, sanitize } from './importer.js';
import { bars3D, pie3D, legend, cssv } from './charts.js';

/* ================= utilities ================= */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today=()=>iso(new Date());
const parseD=s=>{const[a,b,c]=String(s||today()).slice(0,10).split('-').map(Number);return new Date(a,(b||1)-1,c||1)};
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const addMonths=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n,d.getDate());
const monthsDiff=(a,b)=>(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth())-(b.getDate()<a.getDate()?1:0);
const MONTHS=['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const fmtD=s=>{if(!s)return'—';const d=parseD(s);return d.getDate()+' '+MONTHS[d.getMonth()]+' '+d.getFullYear()};
const ago=t=>{const m=Math.round((Date.now()-new Date(t))/6e4);if(!(m>=0))return'';if(m<1)return'الآن';if(m<60)return'قبل '+m+' دقيقة';const h=Math.round(m/60);if(h<24)return'قبل '+h+' ساعة';const d=Math.round(h/24);return d<30?'قبل '+d+' يوم':fmtD(String(t).slice(0,10))};
const fsize=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(0)+' KB':(b/1048576).toFixed(1)+' MB';
const errMsg=e=>(e&&(e.message||e.error_description||e.msg))||String(e);

/* ================= icons ================= */
const IC={
home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.3 2 5 4.9"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4.2-6.5 8-6.5s7 2.3 8 6.5"/>',
track:'<path d="M4 19V5l8 3 8-3v14l-8 3-8-3z"/><path d="M12 8v14"/>',
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
task:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
inbox:'<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/>',
cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 15l2.5 2 4.5-4.5"/>',
report:'<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4"/><path d="M9 17v-3M12 17v-6M15 17v-4"/>',
survey:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l1.5 1.5L12 7M8 14l1.5 1.5L12 13M14 8h3M14 14h3"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
logout:'<path d="M15 4h4v16h-4"/><path d="M10 17l-5-5 5-5M5 12h11"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
upload:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
download:'<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
print:'<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
up:'<path d="M12 19V5M6 11l6-6 6 6"/>',down:'<path d="M12 5v14M6 13l6 6 6-6"/>',
check:'<path d="M5 12l5 5 9-10"/>',
exam:'<path d="M9 3h6l1 2h3v16H5V5h3z"/><path d="M9 11l2 2 4-4M9 17h6"/>',bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',send:'<path d="M21 3L3 11l7 3 3 7z"/><path d="M10 14l11-11"/>',
book:'<path d="M12 6c-2-1.6-5-2-8-1.5v13c3-.5 6-.1 8 1.5 2-1.6 5-2 8-1.5v-13c-3-.5-6-.1-8 1.5z"/><path d="M12 6v13"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',card:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 16c.6-1.6 1.9-2.4 3.5-2.4s2.9.8 3.5 2.4M15 10h4M15 14h3"/>',
geo:'<path d="M4 19h16L7 5z"/><circle cx="15.5" cy="9" r="3.2"/>',alg:'<path d="M5 6l5 6-5 6"/><path d="M13 8h6M13 16h6M16 5v6"/>',comb:'<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="7" cy="17" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M9.5 7h5M7 9.5v5M9 9l6 6"/>',nt:'<path d="M9 4L7 20M17 4l-2 16M4 9h17M3 15h17"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'};
const ic=(n,cls='')=>`<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;
const DEFAULT_LOGO=`<svg viewBox="0 0 100 100"><defs><linearGradient id="lgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9b46a"/><stop offset="1" stop-color="#a87a2e"/></linearGradient></defs><g fill="none" stroke="url(#lgG)" stroke-width="5" stroke-linecap="round"><path d="M50 8v10M50 82v10M8 50h10M82 50h10M20 20l7 7M73 73l7 7M80 20l-7 7M27 73l-7 7"/><circle cx="50" cy="50" r="28"/></g><path d="M50 30l6 14 15 1-11 10 4 15-14-8-14 8 4-15-11-10 15-1z" fill="url(#lgG)"/></svg>`;
// رابط الواجهة الرئيسية الجامعة للاختصاصات: من الإعدادات، وإلا المستودع المجاور olympiad
const portalUrl=()=>(S&&S.settings&&S.settings.portal)||'../olympiad/';
const backPortal=cls=>`<a class="backp ${cls||''}" href="${esc(portalUrl())}" title="العودة إلى واجهة الاختصاصات">→ كل الاختصاصات</a>`;
const logoHTML=()=>`<img src="${S.settings.logo||'icons/logo.png'}" alt="" onerror="this.style.visibility='hidden'">`;
const PALETTES=[['#214539','#2d5c4b'],['#123f3e','#1b6b67'],['#16324f','#2563a8'],['#33264f','#6b4bb0'],['#4a2338','#a8436e'],['#333d1f','#6b7f2e'],['#4a3517','#a87a2e'],['#2b3035','#55606b']];
const TASK_TYPES=['وظيفة مسائل','ورقة عمل','بحث','تقرير','مراجعة','أخرى'];
const DEV_NAME='المهندس أسامة ياسر الصلخدي';
const AXES=[['geo','الهندسة','#2d5c4b'],['alg','الجبر','#ba925f'],['comb','التحليل التوافقي','#8a5a44'],['nt','نظرية الأعداد','#3f6f8f']];
const SPECS=['الرياضيات','الفيزياء','الكيمياء','علم الأحياء','المعلوماتية','العلوم النووية'];
const SEC_COLORS=['#2d5c4b','#ba925f','#8a5a44','#3f6f8f','#6b4b8a','#a0463f','#4f7a3a','#5b6470'];
const specName=()=>(S&&S.settings&&S.settings.spec)||SPECS[0];
const subT=()=>S.settings.subtitle||`تدريب طلاب الأولمبياد العلمي السوري في ${specName()}`;
// أقسام المرحلة (محاور أو أي تقسيم آخر). الرياضيات تبدأ بالمحاور الأربعة، وبقية الاختصاصات بلا أقسام (محاضرات مباشرة)
const defSections=spec=>spec===SPECS[0]?AXES.map(([id,name,color])=>({id,name,color})):[];
const secsOf=g=>(g&&g.sections)||[];
const secOf=(stage,id)=>secsOf(stageById(stage)).find(x=>x.id===id);
const STAGE_NAMES=['المرحلة الأولى','المرحلة الثانية','المرحلة الثالثة'];
const ROLES={dev:'المطور',admin:'مشرف',mentor:'مشرف',student:'طالب'};
const PERIODS={w:'أسبوعي',m:'شهري',q:'ربع سنوي',h:'نصف سنوي',y:'سنوي'};
const QTYPES={single:'اختيار واحد',multi:'اختيار متعدد',scale:'مقياس موافقة (1–5)',rating:'تقييم من 1 إلى 10',yesno:'نعم / لا',text:'إجابة نصية'};
const SCALE=['لا أوافق بشدة','لا أوافق','محايد','أوافق','أوافق بشدة'];
const SCALE_COLORS=['#c0392b','#e67e22','#a0a7ad','#5aa469','#2f855a'];

/* ================= state ================= */
let S=null,ME=null,ROUTE='home',PEND=[];
const VIEWS={},UI={};
const PREFS=(()=>{try{return JSON.parse(localStorage.getItem('olymp-prefs')||'{}')}catch(e){return{}}})();
const savePrefs=()=>{try{localStorage.setItem('olymp-prefs',JSON.stringify(PREFS))}catch(e){}};

function defaultSettings(){return{name:'مكتب الأولمبياد العلمي السوري بدرعا',subtitle:'',spec:'الرياضيات',logo:'',hero:'',palette:0,theme:'light',startDate:'2026-09-01',years:1}}
const ARRAYS=['users','students','tasks','subs','sessions','notes','activity','surveys','responses','participation','exams','attempts','notifications','reads','stages','materials','unlocks','creds'];
function seedStages(spec){return STAGE_NAMES.map((name,i)=>({id:String(i+1),name,desc:'',open:i===0,restrict:false,allowed:[],sections:defSections(spec||SPECS[0])}))}
function blankState(withAdmin){const st={settings:defaultSettings(),stages:seedStages(),stagePw:{}};ARRAYS.forEach(k=>{if(!st[k])st[k]=[]});
  if(withAdmin){const s1=uid(),s2=uid();st.users=[{id:'u_dev',username:'dev',name:DEV_NAME,role:'dev',salt:s1,hash:hashPw(s1,'dev12345'),mustChange:true},{id:'u_admin',username:'admin',name:'مشرف التدريب',role:'admin',salt:s2,hash:hashPw(s2,'admin123')}]}return st}
function normalize(st){st=st||{};const out={...st};out.settings={...defaultSettings(),...(st.settings||{})};ARRAYS.forEach(k=>{if(!Array.isArray(out[k]))out[k]=[]});
  out.tracks=[];out.history=[];out.stagePw=out.stagePw||{};
  // المراحل الثلاث ثابتة: إن لم تكن محفوظة بعد تُعرض بقيمها الافتراضية
  const def=seedStages(out.settings.spec);out.stages=def.map(d=>({...d,...(out.stages.find(x=>String(x.id)===d.id)||{}),id:d.id}));return out}
function surveyTemplate(kind){
  const q=(type,text,options,required=true)=>({id:uid(),type,text,options:options||[],required});
  if(kind==='monthly')return{title:'استبيان الرضا الشهري',desc:'رأيك يساعدنا على تحسين التدريب. الإجابة تستغرق دقيقتين.',questions:[
    q('scale','أنا راضٍ عن مستوى التدريب هذا الشهر'),q('scale','المدرّب متاح عندما أحتاج المساعدة'),q('scale','حجم الوظائف مناسب ولا يتعارض مع دراستي'),
    q('scale','أشعر أنني أتقدم في حل مسائل الأولمبياد'),q('rating','ما مدى احتمال أن تنصح زميلاً بالانضمام للتدريب؟'),
    q('single','أكثر ما استفدت منه هذا الشهر',['المحاضرات','أسئلة الدورات','الاختبارات التجريبية','الوظائف']),
    q('multi','ما الذي تحتاجه أكثر؟ (يمكن اختيار أكثر من واحد)',['جلسات إضافية','مسائل محلولة أكثر','وقت أطول للوظائف','اختبارات تجريبية أكثر','متابعة فردية']),
    q('text','ما أكثر شيء أعجبك؟',[],false),q('text','ما الذي تقترح تحسينه؟',[],false)]};
  if(kind==='session')return{title:'تقييم جلسة تدريب',desc:'',questions:[q('rating','قيّم الجلسة بشكل عام'),q('scale','الشرح كان واضحاً'),q('scale','المسائل كانت مناسبة لمستواي'),q('yesno','هل تحتاج مراجعة لهذا الموضوع؟'),q('text','ملاحظات',[],false)]};
  return{title:'',desc:'',questions:[]};
}
const genPw=()=>String(Math.floor(100000+Math.random()*900000));
function demoPage(title,body){return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/tajawal@5.3.0/400.css"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/tajawal@5.3.0/700.css"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/rakkas@5.2.5/400.css"><style>body{margin:0;font:400 17px/1.9 Tajawal,sans-serif;background:#f7eee7;color:#214539}header{background:#f7eee7;border-bottom:2px solid #ba925f;padding:14px 20px;position:sticky;top:0}h1{font-family:Rakkas,serif;font-weight:400;margin:0;font-size:28px}main{max-width:820px;margin:0 auto;padding:18px}.c{background:#fff9f3;border:1px solid #e6d6c4;border-top:6px solid #214539;border-radius:14px;padding:16px 20px;margin-bottom:16px}.c b{color:#a0763f}button{font:inherit;background:#ba925f;color:#214539;border:0;border-radius:10px;padding:6px 16px;font-weight:700;cursor:pointer}.s{display:none;background:#fff;border:1px solid #e6d6c4;border-radius:10px;padding:10px 14px;margin-top:10px}</style></head><body><header><h1>${title}</h1></header><main>${body}</main><script>document.addEventListener('click',e=>{if(e.target.tagName==='BUTTON'){const s=e.target.nextElementSibling;s.style.display=s.style.display==='block'?'none':'block'}})<\/script></body></html>`}
function seedDemo(st,withUsers){
  const names=['أحمد محمد الحلبي','سارة خالد المصري','محمد علي العلي','لين سامر الخطيب','يوسف حسن الحسن','رهف أيمن الزعبي','عمر فادي النابلسي','مايا رامي الشامي','خالد وليد الأحمد','نور الدين قاسم','جود ماهر الحمصي','آية باسل السعدي'];
  const now=new Date(),start=addMonths(new Date(now.getFullYear(),now.getMonth(),1),-3);st.settings.startDate=iso(start);
  names.forEach((nm,i)=>{const sid='d'+uid();const s={id:sid,demo:true,name:nm,spec:'الرياضيات',school:['ثانوية المتفوقين','ثانوية درعا','ثانوية انخل'][i%3],grade:'العاشر',phone:'',joined:iso(start),photo:'',examNo:String(1001+i)};st.students.push(s);
    if(withUsers){const salt=uid(),pw='123456';st.users.push({id:'du'+i,demo:true,username:'student'+(i+1),name:nm,role:'student',studentId:sid,salt,hash:hashPw(salt,pw)});st.creds.push({sid,username:'student'+(i+1),password:pw})}});
  st.stagePw={1:'1111',2:'2222',3:'3333'};st.stages=seedStages();st.stages[1].open=true;
  const card=(t,q,a)=>`<div class="c"><b>${t}</b><p>${q}</p><button>إظهار الحل</button><div class="s">${a}</div></div>`;
  const M=(stage,kind,axis,title,html,order)=>st.materials.push({id:'d'+uid(),demo:true,stage:String(stage),kind,axis,title,desc:'',format:'html',inline:demoPage(title,html),size:html.length,order,created:today()});
  M(1,'session','geo','الجلسة 1: المثلثات وفيثاغورس',card('مثال 1','مثلث قائم ضلعاه القائمان 6 و 8. ما طول الوتر؟','من فيثاغورس: 36 + 64 = 100، فالوتر 10.')+card('مثال 2','ما مساحة مثلث أضلاعه 5، 5، 6؟','الارتفاع على القاعدة 6 يساوي 4، فالمساحة 12.'),1);
  M(1,'session','alg','الجلسة 1: المتطابقات الشهيرة',card('مثال','إذا كان x + 1/x = 3 فما قيمة x² + 1/x²؟','نربّع الطرفين: x² + 2 + 1/x² = 9، فالمطلوب 7.'),1);
  M(1,'session','comb','الجلسة 1: مبدأ العدّ',card('مثال','كم عدداً من ثلاث خانات مختلفة يمكن تكوينه من الأرقام 1 إلى 5؟','5 × 4 × 3 = 60.'),1);
  M(1,'session','nt','الجلسة 1: قابلية القسمة',card('مثال','ما باقي قسمة 2¹⁰ على 7؟','2³ = 8 ≡ 1، إذن 2¹⁰ = 2⁹·2 ≡ 2.'),1);
  M(1,'past','','أسئلة دورة سابقة (نموذج)',card('سؤال 1','ما عدد قواسم العدد 72؟','72 = 2³·3²، فعدد القواسم 4 × 3 = 12.')+card('سؤال 2','ما مجموع زوايا مضلع محدب له 7 أضلاع؟','(7 − 2) × 180° = 900°.'),1);
  seedDemoExams(st,withUsers);
  const ts=[['حل 10 مسائل على فيثاغورس والتشابه','وظيفة مسائل',-40],['ورقة عمل: المتطابقات والتحليل','ورقة عمل',-18],['مسائل العدّ والتباديل','وظيفة مسائل',-5],['مراجعة: قابلية القسمة والبواقي','مراجعة',6]];
  ts.forEach(([title,type,dd])=>{const task={id:'d'+uid(),demo:true,title,type,trackId:'',due:iso(addDays(now,dd)),desc:'',created:iso(addDays(now,dd-10))};st.tasks.push(task);
    st.students.forEach(s=>{if(dd>0&&Math.random()<.6)return;if(Math.random()<.15)return;const graded=dd<0&&Math.random()<.8;st.subs.push({id:'d'+uid(),demo:true,taskId:task.id,sid:s.id,date:iso(addDays(now,dd-Math.floor(Math.random()*4))),note:'',link:'',files:[],status:graded?'graded':'submitted',score:graded?Math.round(55+Math.random()*45):null,feedback:graded?'عمل جيد، انتبه لتبرير كل خطوة.':''})})});
  const topics=['المثلثات وفيثاغورس','المتطابقات الشهيرة','مبدأ العدّ','قابلية القسمة','الدائرة والزوايا المحيطية','المتراجحات','مبدأ برج الحمام','المعادلات الديوفانتية','حل مسائل جماعي'];
  for(let k=0;k<12;k++){const d=addDays(start,7*k+3);if(d>now)break;st.sessions.push({id:'d'+uid(),demo:true,date:iso(d),topic:topics[k%topics.length],hours:2,trackId:'',present:st.students.filter(()=>Math.random()<.88).map(s=>s.id)})}
  const tpl=surveyTemplate('monthly');const sv={id:'d'+uid(),demo:true,...tpl,anonymous:false,trackId:'',status:'open',deadline:iso(addDays(now,5)),created:iso(addDays(now,-6))};st.surveys.push(sv);
  if(withUsers){const pos=['الجلسات ممتازة ومفيدة','المدرّب متعاون جداً','أحببت مسائل الهندسة','الشرح واضح والمسائل ممتعة','تعلمت طرقاً جديدة في العدّ'],neg=['الوظائف كثيرة وقت الامتحانات','أحتاج وقتاً أطول للوظائف','بعض الشرح سريع','أريد مسائل محلولة أكثر','نحتاج اختبارات تجريبية أكثر'];
    st.students.forEach((s,i)=>{if(i>9)return;const u=st.users.find(x=>x.studentId===s.id);const base=2+Math.random()*3;const sc=()=>clamp(Math.round(base+(Math.random()*2-1)),1,5);
      const ans={};sv.questions.forEach((q,qi)=>{if(q.type==='scale')ans[q.id]=qi===2?clamp(sc()-1,1,5):sc();else if(q.type==='rating')ans[q.id]=clamp(Math.round(base*2+Math.random()*2),1,10);else if(q.type==='single')ans[q.id]=q.options[Math.floor(Math.random()*q.options.length)];else if(q.type==='multi')ans[q.id]=q.options.filter(()=>Math.random()<.4);else if(q.type==='text')ans[q.id]=qi===7?pos[i%pos.length]:neg[i%neg.length]});
      st.participation.push({surveyId:sv.id,userId:u.id,date:iso(addDays(now,-Math.floor(Math.random()*5)))});st.responses.push({id:'d'+uid(),surveyId:sv.id,sid:s.id,trackId:'',answers:ans,date:today()})})}
  st.activity.unshift({id:uid(),t:'حُمِّلت بيانات تجريبية لتجربة المنصة',d:new Date().toISOString()});
  st.notifications.unshift({id:'d'+uid(),demo:true,title:'مرحباً بكم في منصة التدريب 👋',body:'افتح تبويب «المحاضرات العلمية»، واختر مرحلتك، وأدخل كلمة السر التي أعطاك إياها المشرف. داخل المرحلة تجد المحاور الأربعة وأسئلة الدورات والاختبارات التجريبية.',target:'all',trackId:'',sid:'',createdAt:new Date().toISOString(),createdBy:'u_admin'});
}
function seedDemoExams(st,withUsers){
  const Q=(text,options,correct,explanation='')=>({id:uid(),text,options,correct,points:1,sec:null,explanation});
  const e1={id:'d'+uid(),demo:true,title:'اختبار تجريبي 1: أساسيات المحاور الأربعة',desc:'10 دقائق لكامل الاختبار. اقرأ كل سؤال بعناية.',trackId:'',stage:'1',status:'open',timerMode:'total',totalMinutes:10,perQuestionSec:60,passMark:50,showAnswers:true,shuffle:false,created:today(),questions:[
    Q('مثلث قائم ضلعاه القائمان <b>5</b> و <b>12</b>. ما طول الوتر؟',['13','15','17','11'],0,'25 + 144 = 169 = 13².'),
    Q('إذا كان <b>a + b = 5</b> و <b>ab = 6</b> فما قيمة a² + b²؟',['25','13','19','11'],1,'a² + b² = (a + b)² − 2ab = 25 − 12 = 13.'),
    Q('بكم طريقة يمكن ترتيب 4 كتب مختلفة على رف؟',['12','16','24','4'],2,'4! = 24.'),
    Q('ما باقي قسمة 100 على 7؟',['1','2','3','4'],1,'100 = 14 × 7 + 2.'),
    Q('ما عدد أقطار المضلع السداسي المحدب؟',['6','9','12','15'],1,'n(n − 3)/2 = 6 × 3 / 2 = 9.')]};
  const e2={id:'d'+uid(),demo:true,title:'اختبار سريع: نظرية الأعداد',desc:'لكل سؤال 30 ثانية، ولا يمكن الرجوع للسؤال السابق.',trackId:'',stage:'1',status:'open',timerMode:'perQuestion',totalMinutes:null,perQuestionSec:30,passMark:60,showAnswers:true,shuffle:true,created:today(),questions:[
    Q('القاسم المشترك الأكبر للعددين 36 و 48 هو:',['6','12','18','24'],1),Q('كم عدداً أولياً أصغر من 20؟',['7','8','9','10'],1),Q('آحاد العدد 7² هو:',['9','7','3','1'],0)]};
  st.exams.push(e1,e2);
  if(withUsers){st.students.forEach((s,i)=>{if(i>8)return;const u=st.users.find(x=>x.studentId===s.id);if(!u)return;const ans={};e1.questions.forEach(q=>{ans[q.id]=Math.random()<.35+i*.06?q.correct:(q.correct+1)%q.options.length});
    const g=gradeAttempt(e1,ans);const dur=180+Math.round(Math.random()*400);const fin=new Date(Date.now()-86400000*(1+i%3));
    st.attempts.push({id:'d'+uid(),demo:true,examId:e1.id,sid:s.id,userId:u.id,status:'submitted',startedAt:new Date(fin-dur*1000).toISOString(),finishedAt:fin.toISOString(),duration:dur,score:g.score,max:g.max,answers:ans,late:false})})}
}

/* ================= model helpers ================= */
const trackOf=()=>null;
const stuById=id=>S.students.find(s=>s.id===id);
const taskById=id=>S.tasks.find(t=>t.id===id);
const goalById=()=>null;
// «الإنجاز» في هذه المنصة = متوسط علامات الاختبارات التجريبية (حتى تاريخ معيّن إن طُلب)
function studentPct(s,date){const a=S.attempts.filter(x=>x.sid===s.id&&x.status==='submitted'&&x.max&&(!date||String(x.finishedAt||'').slice(0,10)<=date));return a.length?Math.round(a.reduce((t,x)=>t+x.score*100/x.max,0)/a.length):null}
function status(s){const p=studentPct(s);return p==null?['لم يُختبر بعد','b-mut']:p>=75?['متقدم','b-ok']:p>=50?['جيد','b-info']:['يحتاج متابعة','b-bad']}
const stageById=id=>S.stages.find(g=>String(g.id)===String(id));
const stageUnlocked=id=>S.unlocks.some(u=>String(u.stage)===String(id)&&u.userId===ME.id);
function canStage(id){if(isStaff())return true;const g=stageById(id);if(!g||!g.open)return false;if(g.restrict&&!(g.allowed||[]).includes(ME.studentId))return false;return stageUnlocked(id)}
const matsOf=(stage,kind,axis)=>S.materials.filter(m=>String(m.stage)===String(stage)&&m.kind===kind&&(axis==null||m.axis===axis)).sort((a,b)=>(+a.order||0)-(+b.order||0)||String(a.created).localeCompare(String(b.created)));
const credOf=sid=>S.creds.find(c=>c.sid===sid);
const tasksFor=s=>[...S.tasks];
const subOf=(tid,sid)=>S.subs.find(x=>x.taskId===tid&&x.sid===sid);
function attendance(s,from,to){const ss=S.sessions.filter(x=>x.date>=(s.joined||'')&&(!from||x.date>=from)&&(!to||x.date<=to));return ss.length?Math.round(ss.filter(x=>(x.present||[]).includes(s.id)).length*100/ss.length):null}
function avgScore(subs){const g=subs.filter(x=>x.status==='graded'&&x.score!=null);return g.length?Math.round(g.reduce((a,x)=>a+ +x.score,0)/g.length):null}
function submitRate(s){const due=tasksFor(s).filter(t=>t.due<=today());return due.length?Math.round(due.filter(t=>subOf(t.id,s.id)).length*100/due.length):null}
const isStaff=()=>ME&&ME.role!=='student';
const isDev=()=>ME&&ME.role==='dev';
const isAdmin=()=>isStaff();
const myStudent=()=>ME&&ME.studentId?stuById(ME.studentId):null;
function log(t){S.activity.unshift({id:uid(),t,d:new Date().toISOString(),by:ME?ME.name:''});if(API.mode==='demo')S.activity=S.activity.slice(0,200)}
// الاستبيانات
const svTargets=sv=>S.students;
const svParts=id=>S.participation.filter(p=>p.surveyId===id);
const svResp=id=>S.responses.filter(r=>r.surveyId===id);
const answeredByMe=id=>S.participation.some(p=>p.surveyId===id&&p.userId===ME.id);
function mySurveys(){const s=myStudent();return S.surveys.filter(v=>v.status!=='draft')}

/* ================= persistence ================= */
let syncState='ok';
function setSync(s){syncState=s;const el=$('#sync');if(el){el.className='sync '+s;el.lastElementChild.textContent=s==='ok'?(API.mode==='supabase'?'متصل: محفوظ على الخادم':'تجريبي: محفوظ في هذا المتصفح'):s==='saving'?'جارٍ الحفظ…':'تعذّر الحفظ'}}
const snap=()=>JSON.parse(JSON.stringify(S));
async function mutate(fn){const prev=snap();fn(S);render();setSync('saving');
  try{await API.commit(prev,S);setSync('ok');return true}
  catch(e){console.error(e);setSync('err');toast('تعذّر الحفظ: '+errMsg(e),'err');await reload();return false}}
async function reload(){try{const st=await API.loadAll();if(st){S=normalize(st);if(ME){const me=S.users.find(u=>u.id===ME.id);if(me)ME=me}}}catch(e){console.error(e);toast('تعذّر تحميل البيانات: '+errMsg(e),'err')}render()}

/* ================= UI helpers ================= */
function toast(t,cls=''){const el=$('#toast');el.textContent=t;el.className='toast show '+cls;clearTimeout(el._t);el._t=setTimeout(()=>el.className='toast',3200)}
function modal(html,wide){const m=$('#modal');m.innerHTML=`<div class="mbox ${wide?'wide':''}">${html}</div>`;m.classList.add('open');return m.firstElementChild}
function closeModal(){const m=$('#modal');m.classList.remove('open');m.innerHTML=''}
const mhead=t=>`<div class="mhead"><h2>${t}</h2><button class="icon-btn" data-close>×</button></div>`;
function field(f){const v=esc(f.value??''),req=f.required?'required':'',full=f.full?'full':'';
  if(f.type==='select')return `<label class="${full}">${f.label}<select name="${f.name}" ${req}>${f.options.map(o=>{const[val,lab]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}" ${String(val)===String(f.value??'')?'selected':''}>${esc(lab)}</option>`}).join('')}</select>${f.hint?`<span class="hint">${f.hint}</span>`:''}</label>`;
  if(f.type==='textarea')return `<label class="${full||'full'}">${f.label}<textarea name="${f.name}" rows="${f.rows||3}" ${req}>${v}</textarea></label>`;
  if(f.type==='file')return `<label class="${full||'full'}">${f.label}<input type="file" name="${f.name}" ${f.multiple?'multiple':''} ${f.accept?`accept="${f.accept}"`:''} ${req}>${f.hint?`<span class="hint">${f.hint}</span>`:''}</label>`;
  if(f.type==='checkbox')return `<label class="ck ${full}"><input type="checkbox" name="${f.name}" ${f.value?'checked':''}> ${f.label}</label>`;
  if(f.type==='html')return f.html;
  return `<label class="${full}">${f.label}<input type="${f.type||'text'}" name="${f.name}" value="${v}" ${req} ${f.min!=null?`min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''} ${f.step?`step="${f.step}"`:''} ${f.ltr?'dir="ltr"':''} placeholder="${esc(f.ph||'')}" ${f.ac?`autocomplete="${f.ac}"`:''}>${f.hint?`<span class="hint">${f.hint}</span>`:''}</label>`}
function formModal({title,fields,submit='حفظ',onSubmit,wide}){
  const box=modal(mhead(title)+`<form class="fgrid">${fields.map(field).join('')}<div class="factions"><button class="btn pri">${submit}</button><button type="button" class="btn" data-close>إلغاء</button></div></form>`,wide);
  const form=$('form',box);form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form),d={};
    fields.forEach(f=>{if(!f.name)return;if(f.type==='file')d[f.name]=fd.getAll(f.name).filter(x=>x&&x.size);else if(f.type==='checkbox')d[f.name]=fd.get(f.name)==='on';else d[f.name]=String(fd.get(f.name)??'').trim()});
    const btn=$('button.pri',form);btn.disabled=true;try{const r=await onSubmit(d,form);if(r!==false)closeModal()}catch(err){toast(errMsg(err),'err')}finally{btn.disabled=false}};
  return box}
function confirmBox(text,onYes,yes='حذف'){const b=modal(mhead('تأكيد')+`<p>${text}</p><div class="factions"><button class="btn pri" style="background:var(--bad);border-color:var(--bad)" data-yes>${yes}</button><button class="btn" data-close>إلغاء</button></div>`);$('[data-yes]',b).onclick=()=>{closeModal();onYes()}}
function readImage(file,max,q=.85,forceJpeg){return new Promise(res=>{if(!file)return res('');const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const png=!forceJpeg&&/png|svg/.test(file.type);res(c.toDataURL(png?'image/png':'image/jpeg',q))};img.onerror=()=>res('');img.src=fr.result};fr.readAsDataURL(file)})}
async function compressForUpload(f){if(!/^image\/(jpeg|png|webp)$/.test(f.type))return f;const du=await readImage(f,1600,.85,true);if(!du)return f;const b=await(await fetch(du)).blob();return b.size<f.size?new File([b],f.name.replace(/\.(png|webp)$/i,'.jpg'),{type:'image/jpeg'}):f}
const avatar=(s,cls='')=>`<span class="av ${cls}">${s&&s.photo?`<img src="${s.photo}" alt="">`:esc((s&&s.name||'?').trim()[0]||'?')}</span>`;
const pbar=(p,c)=>`<span class="pbar"><span><i style="width:${clamp(p||0)}%;${c?`background:${c}`:''}"></i></span><b>${p??0}%</b></span>`;
const ring=(p,c,lg,txt)=>`<span class="ring ${lg?'lg':''}" style="--p:${clamp(p||0)};${c?`--c:${c}`:''}" data-v="${txt!=null?txt:p==null?'—':p+'%'}"></span>`;
const kpi=(p,l,v,c,txt)=>`<div class="kpi">${ring(p,c,false,txt)}<div><div class="l">${l}</div>${v?`<div class="v">${v}</div>`:''}</div></div>`;
const tdot=t=>`<span class="tdot" style="background:${t?t.color:'#999'}"></span>`;
const subBadge=x=>!x?'<span class="badge b-mut">لم يُسلَّم</span>':x.status==='graded'?`<span class="badge b-ok">مُقيَّم ${x.score}%</span>`:x.status==='returned'?'<span class="badge b-warn">مُعاد للتعديل</span>':'<span class="badge b-info">بانتظار التقييم</span>';
function chart(id,fn){PEND.push(()=>fn($('#'+id)))}
function download(blob,name){if(window.__nativeSave){window.__nativeSave(blob,name).then(()=>toast('حُفظ الملف ✓')).catch(e=>toast('تعذّر حفظ الملف: '+errMsg(e),'err'));return}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
const csvCell=v=>{v=v==null?'':Array.isArray(v)?v.join('، '):typeof v==='object'?JSON.stringify(v):String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
const toCSV=rows=>'﻿'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
let JSZipP=null;function loadJSZip(){return JSZipP||(JSZipP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';s.onload=()=>res(window.JSZip);s.onerror=()=>{JSZipP=null;rej(new Error('تعذّر تحميل مكتبة الضغط، تحقق من الإنترنت'))};document.head.appendChild(s)}))}

/* ================= layout ================= */
function navItems(){
  const unread=unreadCount();
  if(ME.role==='student'){const pendS=mySurveys().filter(v=>v.status==='open'&&!answeredByMe(v.id)).length;return [['home','home','الرئيسية'],['inbox','bell','الإشعارات',unread],['lectures','book','المحاضرات العلمية'],['my-tasks','task','وظائفي'],['surveys','survey','الاستبيانات',pendS],['reports','report','تقاريري']]}
  const pend=S.subs.filter(x=>x.status==='submitted').length;
  const a=[['home','home','الرئيسية'],['inbox','bell','الإشعارات',unread],['students','users','الطلاب'],['lectures','book','المحاضرات العلمية'],['tasks','task','الوظائف والأبحاث'],['subs','inbox','التسليمات',pend],['surveys','survey','الاستبيانات'],['sessions','cal','الجلسات والحضور'],['reports','report','التقارير'],['users','key','المستخدمون']];
  if(isDev())a.push(['settings','settings','الإعدادات']);return a}
function applyTheme(){const pi=PREFS.palette??S.settings.palette??0,p=PALETTES[pi]||PALETTES[0];const r=document.documentElement.style;r.setProperty('--side',p[0]);r.setProperty('--acc',p[1]);document.body.classList.toggle('dark',(PREFS.theme||S.settings.theme)==='dark');document.title=S.settings.name}
const ALLOWED_STUDENT=['home','my-tasks','reports','surveys','lectures','inbox'];
function render(){if(S){S.tracks=S.tracks||[];S.history=S.history||[]}
  applyTheme();PEND=[];
  if(!ME){$('#root').innerHTML=vLogin();bindLogin();return}
  let base=ROUTE.split(':')[0];
  if(ME.role==='student'&&!ALLOWED_STUDENT.includes(base)){ROUTE=base='home'}
  if(!isDev()&&base==='settings'){ROUTE=base='home'}
  const V=VIEWS[base]||VIEWS.home;let body;
  try{body=V(ROUTE.split(':')[1])}catch(e){console.error(e);body=`<div class="panel">حدث خطأ في عرض الصفحة: ${esc(e.message)}</div>`}
  const st=myStudent(),pi=PREFS.palette??S.settings.palette??0,th=PREFS.theme||S.settings.theme;
  const onNav=r=>base===r||(base==='student'&&r==='students')||(base==='survey'&&r==='surveys')||((base==='exam'||base==='exams')&&r==='lectures');const unr=unreadCount();
  $('#root').innerHTML=`<button class="btn mtoggle noprint" data-act="menu" aria-label="القائمة">${ic('menu')}</button><div class="app"><aside class="side" id="side">
    ${backPortal()}<div class="brand"><div class="lg">${logoHTML()}</div><b>${esc(S.settings.name)}</b></div>
    <div class="cap">مساحة العمل</div><nav class="nav">${navItems().map(([r,i,l,cnt])=>`<a href="#${r}" class="${onNav(r)?'on':''}">${ic(i)}<span>${l}</span>${cnt?`<span class="cnt">${cnt}</span>`:''}</a>`).join('')}</nav>
    <div class="bottom">
      <div class="sbox"><div class="t">لون الواجهة</div><div class="dots">${PALETTES.map((p,i)=>`<button style="background:${p[1]}" class="${pi===i?'on':''}" data-act="palette" data-i="${i}" title="لون ${i+1}"></button>`).join('')}</div></div>
      <div class="sbox"><div class="t">سمة الواجهة</div><div class="seg"><button class="${th!=='dark'?'on':''}" data-act="theme" data-v="light">☀ نهاري</button><button class="${th==='dark'?'on':''}" data-act="theme" data-v="dark">☾ ليلي</button></div></div>
      <div class="sbox"><div class="me">${avatar(st||{name:ME.name})}<div style="flex:1;min-width:0"><b>${esc(ME.name)}</b><small>${ROLES[ME.role]}</small></div><button class="icon-btn" style="color:#e9e2d2" title="تغيير كلمة المرور" data-act="mypw">${ic('key')}</button><button class="icon-btn" style="color:#e9e2d2" title="خروج" data-act="logout">${ic('logout')}</button></div>
      <div class="sync ${syncState}" id="sync"><i></i><span></span></div></div>
      <div class="credit">تطوير وإشراف<br><b>${DEV_NAME}</b></div>
    </div></aside><main><a class="bell noprint" href="#inbox" title="الإشعارات">${ic('bell')}${unr?`<b>${unr}</b>`:''}</a>${DEMO?`<div class="banner noprint">🧪 <span><b>الوضع التجريبي:</b> البيانات محفوظة في هذا المتصفح فقط. لربط المنصة بـ Supabase ضع بياناته في <code>js/config.js</code>.</span></div>`:''}${ME.mustChange?`<div class="banner noprint">🔐 أنت تستخدم كلمة المرور الافتراضية، غيّرها الآن.<button class="btn sm" data-act="mypw">تغيير كلمة المرور</button></div>`:''}${body}</main></div>`;
  setSync(syncState);
  const run=()=>PEND.forEach(f=>{try{f()}catch(e){console.error(e)}});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run);else run();
}
function hero(title,sub,chips,search=true){
  return `<section class="hero ${S.settings.hero?'hasimg':''}">${S.settings.hero?`<div class="bgimg" style="background-image:url(${S.settings.hero})"></div><img class="hstrip" src="${(S.settings.heroM&&(document.body.classList.contains('mobile')||innerWidth<=1100))?S.settings.heroM:S.settings.hero}" alt="">`:'<div class="pat"></div>'}<div class="veil"></div>
  <div class="hlogo">${logoHTML()}</div><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div>
  ${search?`<div class="hsearch noprint"><input id="gsearch" placeholder="ابحث عن طالب، جلسة، وظيفة، استبيان…" autocomplete="off"><span class="sbtn">${ic('search')}</span><div class="sres" id="sres"></div></div>`:''}
  ${chips?`<div class="chips">${chips}</div>`:''}</section>`}

/* ================= views ================= */
function vLogin(){return `<div class="login"><div class="box">${backPortal('top')}<div class="lg">${logoHTML()}</div><h1>${esc(S.settings.name)}</h1><div class="muted">${esc(subT())}</div>
  <form id="loginF"><input name="u" placeholder="اسم المستخدم" autocomplete="username" required dir="ltr" autocapitalize="none"><input name="p" type="password" placeholder="كلمة المرور" autocomplete="current-password" required dir="ltr"><div class="err" id="lerr"></div><button class="btn pri" style="justify-content:center;padding:10px">دخول</button></form>
  <div class="credit dark">تطوير وإشراف: <b>${DEV_NAME}</b></div>
  ${DEMO?`<p class="muted" style="margin-top:14px;font-size:13px">الوضع التجريبي — المطور: <b dir="ltr">dev</b> / <b dir="ltr">dev12345</b> · المشرف: <b dir="ltr">admin</b> / <b dir="ltr">admin123</b><br>الطلاب: <b dir="ltr">student1</b> … <b dir="ltr">student12</b> — كلمة المرور <b dir="ltr">123456</b> — الأرقام الامتحانية 1001 … 1012</p>`:''}</div></div>`}
function bindLogin(){$('#loginF').onsubmit=async e=>{e.preventDefault();const f=e.target,btn=$('button',f);btn.disabled=true;$('#lerr').textContent='';
  try{const me=await API.login(f.u.value,f.p.value);ME=me;await afterLogin();ROUTE='home';if(location.hash!=='#home')location.hash='home';else render()}
  catch(err){$('#lerr').textContent=errMsg(err)}finally{btn.disabled=false}}}
let subscribed=false,rlT=null;
async function afterLogin(){
  if(API.mode==='supabase'){const st=await API.loadAll();const hadSettings=!!st.settings;S=normalize(st);ME=S.users.find(u=>u.id===ME.id)||ME;
    if(isDev()&&!hadSettings){await mutate(S=>{S.settings={...defaultSettings(),initialized:today()};S.stages=seedStages();log('تم تجهيز المنصة لأول مرة')})}
    if(!subscribed){subscribed=true;API.subscribe(()=>{clearTimeout(rlT);rlT=setTimeout(async()=>{if(RUN||$('#modal').classList.contains('open')||(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)))return;const before=unreadCount();UI.myEx=null;await reload();const after=unreadCount();if(after>before){const n=myNotifs().find(x=>!isRead(x.id));if(n)toast('📬 إشعار جديد: '+n.title)}},1500)})}}
  else{ME=S.users.find(u=>u.id===ME.id)||ME}
}

const avgOf=a=>{a=a.filter(x=>x!=null);return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length):null};
function stageCards(){return `<div class="stgrid">${S.stages.map((g,i)=>{const can=canStage(g.id),n=S.materials.filter(m=>String(m.stage)===g.id).length,ne=S.exams.filter(e=>String(e.stage)===g.id).length;
  const st=isStaff()?(g.open?'<span class="badge b-ok">مفتوحة</span>':'<span class="badge b-mut">مغلقة</span>'):(!g.open?'<span class="badge b-mut">مغلقة</span>':can?'<span class="badge b-ok">مفتوحة لك</span>':'<span class="badge b-warn">تحتاج كلمة سر</span>');
  return `<a class="stcard ${can?'':'locked'}" href="#lectures:${g.id}" data-act="openStage" data-id="${g.id}"><span class="stn">${i+1}</span><div class="sti">${ic(can?'unlock':'lock')}</div><b>${esc(g.name)}</b>${g.desc?`<small>${esc(g.desc)}</small>`:''}<div>${st}</div>${isStaff()?`<small>${n} ملفاً · ${ne} اختباراً · دخلها ${S.unlocks.filter(u=>String(u.stage)===g.id).length} طالباً</small>`:''}</a>`}).join('')}</div>`}
VIEWS.home=()=>{
  if(ME.role==='student')return vStudentHome();
  const st=S.students,n=st.length,avg=avgOf(st.map(s=>studentPct(s)));
  const sr=avgOf(st.map(submitRate)),at=avgOf(st.map(s=>attendance(s)));
  const pend=S.subs.filter(x=>x.status==='submitted').length,openSv=S.surveys.filter(v=>v.status==='open').length,openEx=S.exams.filter(e=>e.status==='open').length;
  const demo=S.students.some(s=>s.demo);
  const card=(r,i,t,d)=>`<a class="scard" href="#${r}">${ic(i)}<b>${t}</b><small>${d}</small></a>`;
  const tested=st.filter(s=>studentPct(s)!=null);
  chart('cStu',cv=>bars3D(cv,[...tested].sort((a,b)=>studentPct(b)-studentPct(a)).map(s=>({label:s.name.split(' ')[0],value:studentPct(s),color:'#2d5c4b',id:s.id})),{rot:tested.length>10,onClick:it=>go('student:'+it.id)}));
  const mG={};S.materials.filter(m=>m.kind==='session').forEach(m=>{const sc=secOf(m.stage,m.axis),k=sc?sc.name:'محاضرات عامة';mG[k]=mG[k]||{label:k,value:0,color:sc?sc.color:'#5b6470'};mG[k].value++});const mItems=Object.values(mG);
  chart('cTr',cv=>pie3D(cv,mItems,{hole:String(mItems.reduce((a,x)=>a+x.value,0))}));
  const sb=[['مُقيَّمة',S.subs.filter(x=>x.status==='graded').length,'#2f855a'],['بانتظار التقييم',pend,'#2b6cb0'],['مُعادة',S.subs.filter(x=>x.status==='returned').length,'#b7791f']].map(([label,value,color])=>({label,value,color})).filter(x=>x.value);
  chart('cSub',cv=>pie3D(cv,sb,{height:220}));
  return `${demo?`<div class="banner noprint">🧪 تعرض المنصة بيانات تجريبية. يمكنك مسحها من الإعدادات عند البدء الفعلي.${isDev()?'<a class="btn sm" href="#settings">الإعدادات</a>':''}</div>`:''}
  ${hero(S.settings.name,subT(),`<span class="chip">الاختصاص: <b>${esc(specName())}</b></span><span class="chip"><b>${n}</b> طالباً</span><span class="chip"><b>${S.materials.length}</b> ملف محاضرات</span><span class="chip"><b>${S.exams.length}</b> اختباراً تجريبياً</span><span class="chip"><b>${S.tasks.length}</b> وظيفة</span>`)}
  <section class="panel"><div class="ph"><h3>المحاضرات العلمية</h3><a class="btn sm" href="#lectures">فتح</a></div>${stageCards()}</section>
  <div class="home-grid"><section class="panel"><div class="ph"><h3>الأقسام</h3></div>
    <div class="gtitle">الطلاب والتدريب</div><div class="cards">${card('students','users','الطلاب','الحسابات والبطاقات والأرقام الامتحانية')}${card('lectures','book','المحاضرات العلمية','المراحل والمحاور والاختبارات التجريبية')}${card('sessions','cal','الجلسات والحضور','سجل التدريب والغياب')}</div>
    <div class="gtitle">العمل والتقييم</div><div class="cards">${card('tasks','task','الوظائف والأبحاث','إسناد المهام للطلاب')}${card('subs','inbox','التسليمات',pend?pend+' بانتظار التقييم':'مراجعة وتقييم')}${card('surveys','survey','الاستبيانات',openSv?openSv+' مفتوح الآن':'إنشاء وتحليل')}${card('reports','report','التقارير','أسبوعية، شهرية، ربعية، سنوية')}${card('inbox','bell','الإشعارات','تعاميم للطلاب')}${card('users','key','المستخدمون','الحسابات والصلاحيات')}${isDev()?card('settings','settings','الإعدادات','الشعار والهوية والنسخ الاحتياطي'):''}</div></section>
  <aside class="panel"><div class="ph"><h3>آخر النشاطات</h3></div><div class="act">${S.activity.slice(0,12).map(a=>`<div class="it">${esc(a.t)}<small>${ago(a.d)}${a.by?' · '+esc(a.by):''}</small></div>`).join('')||'<div class="muted">لا نشاطات بعد</div>'}</div></aside></div>
  <div class="kpis">${kpi(avg,'متوسط علامات الاختبارات التجريبية',`${openEx} اختباراً مفتوحاً الآن`)}${kpi(sr,'نسبة تسليم الوظائف','المستحقة حتى اليوم','#2b6cb0')}${kpi(at,'نسبة الحضور','في جلسات التدريب','#2f855a')}${kpi(n?Math.round(S.users.filter(u=>u.role==='student').length*100/n):null,'طلاب لديهم حساب دخول','','var(--gold)')}</div>
  <div class="grid2"><section class="panel"><h3>متوسط علامات كل طالب في الاختبارات التجريبية</h3>${tested.length?'<div class="cwrap"><canvas id="cStu"></canvas></div><p class="muted" style="margin:6px 0 0">اضغط على عمود لفتح ملف الطالب.</p>':'<div class="empty">لم يقدّم أحد اختباراً بعد</div>'}</section>
  <section class="panel"><h3>توزع المحاضرات على الأقسام</h3>${mItems.length?'<div class="cwrap"><canvas id="cTr"></canvas></div>'+legend(mItems):'<div class="empty">لم تُرفع جلسات بعد</div>'}</section></div>
  <section class="panel"><h3>حالة التسليمات</h3>${sb.length?'<div class="cwrap"><canvas id="cSub"></canvas></div>'+legend(sb):'<div class="empty">لا تسليمات بعد</div>'}</section>`};
function vStudentHome(){const s=myStudent();if(!s)return `<div class="panel">هذا الحساب غير مرتبط بطالب. راجع المشرف.</div>`;
  const p=studentPct(s),[stl]=status(s);
  const open=tasksFor(s).filter(x=>{const b=subOf(x.id,s.id);return !b||b.status==='returned'}).sort((a,b)=>a.due.localeCompare(b.due));
  const svs=mySurveys().filter(v=>v.status==='open'&&!answeredByMe(v.id));
  return hero('أهلاً '+s.name.split(' ')[0],subT(),`<span class="chip">المستوى: <b>${stl}</b></span>${s.examNo?`<span class="chip">رقمك الامتحاني: <b dir="ltr">${esc(s.examNo)}</b></span>`:''}`,false)+
  (svs.length?`<div class="banner noprint">📋 لديك ${svs.length} استبيان بانتظار إجابتك.<a class="btn sm" href="#surveys">أجب الآن</a></div>`:'')+
  `<section class="panel"><div class="ph"><h3>المحاضرات العلمية</h3><span class="muted">اختر مرحلتك وأدخل كلمة السر التي أعطاك إياها المشرف</span></div>${stageCards()}</section>
  <div class="kpis">${kpi(p,'متوسط علاماتي في الاختبارات التجريبية','')}${kpi(submitRate(s),'نسبة تسليم وظائفي','','#2b6cb0')}${kpi(attendance(s),'نسبة حضوري','','#2f855a')}${kpi(avgScore(S.subs.filter(x=>x.sid===s.id)),'متوسط علامات وظائفي','','#6b4bb0')}</div>
  <section class="panel"><div class="ph"><h3>وظائف تنتظرني</h3><a class="btn sm" href="#my-tasks">كل الوظائف</a></div>${open.slice(0,6).map(x=>`<div class="file"><span><b>${esc(x.title)}</b><br><small class="muted">${esc(x.type)} · التسليم ${fmtD(x.due)}</small></span>${x.due<today()?'<span class="badge b-bad">متأخرة</span>':''}<button class="btn sm gold" data-act="submit" data-id="${x.id}">${ic('upload')} تسليم</button></div>`).join('')||'<div class="empty">لا وظائف معلّقة 🎉</div>'}</section>`}

VIEWS.students=()=>{
  const f=UI.sf||{q:'',t:''};const q=normAr(f.q||'').trim();const list=S.students.filter(s=>!q||normAr(s.name).includes(q)||String(s.examNo||'').includes(q)||((credOf(s.id)||{}).username||'').includes(q.toLowerCase()));
  return `<div class="pagehead"><div><h2>الطلاب</h2><div class="sub">${S.students.length} طالباً · ${S.creds.length} لديهم بطاقة دخول</div></div><div class="tools noprint"><input id="sq" placeholder="بحث بالاسم أو الرقم الامتحاني" value="${esc(f.q)}"><button class="btn gold" data-act="importStudents">${ic('upload')} استيراد طلاب (Excel / HTML)</button><button class="btn" data-act="genAccounts" title="لمن ليس لديه حساب أو رقم امتحاني">${ic('key')} توليد حسابات وأرقام للناقصين</button><button class="btn" data-act="credsCsv">${ic('download')} تصدير كل البطاقات</button><button class="btn pri" data-act="addStudent">${ic('plus')} إضافة طالب</button></div></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>الطالب</th><th>الاختصاص</th><th>الرقم الامتحاني</th><th>اسم المستخدم</th><th>كلمة السر</th><th>متوسط الاختبارات</th><th>المستوى</th><th>الحضور</th><th class="noprint"></th></tr></thead><tbody>
  ${list.map(s=>{const[a,b]=status(s),at=attendance(s),c=credOf(s.id),u=S.users.find(x=>x.studentId===s.id),p=studentPct(s);return `<tr class="click" data-go="student:${s.id}"><td><div class="who">${avatar(s)}<div><b>${esc(s.name)}</b>${s.school?`<br><small class="muted">${esc(s.school)}</small>`:''}</div></div></td><td>${esc(s.spec)||'—'}</td><td dir="ltr" style="text-align:right"><b>${esc(s.examNo)||'—'}</b></td><td dir="ltr" style="text-align:right">${esc(u?u.username:'')||'<span class="badge b-warn">بلا حساب</span>'}</td><td dir="ltr" style="text-align:right">${c?`<code>${esc(c.password)}</code>`:'<span class="muted">—</span>'}</td><td>${p==null?'—':pbar(p)}</td><td><span class="badge ${b}">${a}</span></td><td>${at==null?'—':at+'%'}</td><td class="noprint"><button class="btn sm gold" data-act="credCard" data-id="${s.id}">${ic('card')} بطاقة</button></td></tr>`}).join('')}
  </tbody></table></div>${list.length?'':'<div class="empty">لا يوجد طلاب. أضف طالباً أو استورد قائمة من ملف Excel.</div>'}</section>`};
VIEWS.student=id=>{const s=stuById(id);return s?studentDetail(s):'<div class="panel">الطالب غير موجود</div>'};
function studentDetail(s){
  const p=studentPct(s),[stl,stc]=status(s),subs=S.subs.filter(x=>x.sid===s.id),staff=isStaff();
  const atts=S.attempts.filter(a=>a.sid===s.id&&a.status==='submitted').sort((a,b)=>String(a.finishedAt).localeCompare(String(b.finishedAt)));
  chart('cAx',cv=>bars3D(cv,atts.slice(-12).map(a=>({label:((S.exams.find(e=>e.id===a.examId)||{}).title||'اختبار').slice(0,14),value:pctOf(a),color:'#2d5c4b'})),{height:280,rot:atts.length>5}));
  const notes=S.notes.filter(n=>n.sid===s.id&&n.text).sort((a,b)=>b.key.localeCompare(a.key));
  const acc=S.users.find(u=>u.studentId===s.id);
  return `<div class="pagehead noprint"><div class="tools">${staff?`<a class="btn" href="#students">→ الطلاب</a>`:''}</div><div class="tools">${staff?`<button class="btn gold" data-act="credCard" data-id="${s.id}">${ic('card')} بطاقة الدخول</button><button class="btn" data-act="editStudent" data-id="${s.id}">${ic('edit')} تعديل</button>`:''}<a class="btn" href="#reports" data-act="reportFor" data-id="${s.id}">${ic('report')} تقرير</a>${isAdmin()?`<button class="btn danger" data-act="delStudent" data-id="${s.id}">${ic('trash')} حذف</button>`:''}</div></div>
  <section class="panel"><div class="prof">${avatar(s,'lg')}<div style="flex:1;min-width:200px"><h2>${esc(s.name)}</h2><div class="muted">الاختصاص: ${esc(s.spec)||'—'}${s.school?' · '+esc(s.school):''}${s.grade?' · الصف '+esc(s.grade):''} ${s.phone?'· '+esc(s.phone):''}</div><div style="margin-top:6px"><span class="badge ${stc}">${stl}</span> <span class="muted">انضم في ${fmtD(s.joined)}${s.examNo?' · الرقم الامتحاني: <b dir="ltr">'+esc(s.examNo)+'</b>':''}</span>${staff?` · <span class="muted">${acc?'حساب الدخول: <b dir="ltr">'+esc(acc.username)+'</b>':'لا يوجد حساب دخول'}</span>`:''}</div>
  ${staff?`<div class="muted" style="margin-top:6px">المراحل التي دخلها: ${acc?S.stages.filter(g=>S.unlocks.some(u=>String(u.stage)===g.id&&u.userId===acc.id)).map(g=>esc(g.name)).join('، ')||'لا شيء بعد':'—'}</div>`:''}</div>${ring(p,null,true)}</div></section>
  <div class="kpis">${kpi(p,'متوسط الاختبارات التجريبية',`${atts.length} اختباراً`)}${kpi(submitRate(s),'نسبة التسليم',`${subs.length} تسليماً`,'#2b6cb0')}${kpi(attendance(s),'الحضور','','#2f855a')}${kpi(avgScore(subs),'متوسط علامات الوظائف','','#6b4bb0')}</div>
  <section class="panel"><h3>علامات الاختبارات التجريبية</h3>${atts.length?'<div class="cwrap"><canvas id="cAx"></canvas></div>':'<div class="empty">لم يقدّم اختباراً بعد</div>'}</section>
  <section class="panel"><h3>الوظائف والتسليمات</h3><div class="tw"><table><thead><tr><th>الوظيفة</th><th>النوع</th><th>الاستحقاق</th><th>الحالة</th><th></th></tr></thead><tbody>${tasksFor(s).sort((a,b)=>b.due.localeCompare(a.due)).map(x=>{const b=subOf(x.id,s.id);return `<tr><td>${esc(x.title)}</td><td>${esc(x.type)}</td><td>${fmtD(x.due)}</td><td>${subBadge(b)}</td><td>${b?`<button class="btn sm" data-act="review" data-id="${b.id}">عرض</button>`:''}</td></tr>`}).join('')}</tbody></table></div></section>
  ${staff?studentExamsSection(s):''}
  <section class="panel"><h3>ملاحظات المدرّب الدورية</h3>${notes.map(n=>`<div style="margin-bottom:10px"><small class="muted">${esc(periodLabelFromKey(n.key))}</small><div class="note">${esc(n.text)}</div></div>`).join('')||'<div class="muted">تُكتب الملاحظات من صفحة التقارير.</div>'}</section>`}

VIEWS.tasks=()=>{const list=[...S.tasks].sort((a,b)=>b.due.localeCompare(a.due));
  return `<div class="pagehead"><div><h2>الوظائف والأبحاث</h2><div class="sub">وظائف المسائل وأوراق العمل والأبحاث المسندة للطلاب</div></div><button class="btn pri noprint" data-act="addTask">${ic('plus')} وظيفة جديدة</button></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>العنوان</th><th>النوع</th><th>الاستحقاق</th><th>التسليم</th><th>متوسط العلامة</th><th></th></tr></thead><tbody>
  ${list.map(x=>{const ss=S.students,sb=S.subs.filter(b=>b.taskId===x.id),pc=ss.length?Math.round(sb.length*100/ss.length):0,av=avgScore(sb);
  return `<tr class="click" data-act="taskInfo" data-id="${x.id}"><td><b>${esc(x.title)}</b></td><td>${esc(x.type)}</td><td>${fmtD(x.due)} ${x.due<today()?'':'<span class="badge b-info">مفتوحة</span>'}</td><td>${pbar(pc)}</td><td>${av==null?'—':av+'%'}</td><td class="noprint"><button class="btn sm" data-act="editTask" data-id="${x.id}">${ic('edit')}</button></td></tr>`}).join('')}</tbody></table></div>${list.length?'':'<div class="empty">لا وظائف بعد</div>'}</section>`};
VIEWS['my-tasks']=()=>{const s=myStudent();if(!s)return '<div class="panel">الحساب غير مرتبط بطالب</div>';const list=tasksFor(s).sort((a,b)=>b.due.localeCompare(a.due));
  return `<div class="pagehead"><div><h2>وظائفي</h2><div class="sub">ارفع حلولك وأوراق عملك هنا</div></div></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>الوظيفة</th><th>النوع</th><th>الاستحقاق</th><th>الحالة</th><th>ملاحظات المدرّب</th><th></th></tr></thead><tbody>${list.map(x=>{const b=subOf(x.id,s.id);return `<tr><td><b>${esc(x.title)}</b>${x.desc?`<br><small class="muted">${esc(x.desc)}</small>`:''}</td><td>${esc(x.type)}</td><td>${fmtD(x.due)} ${!b&&x.due<today()?'<span class="badge b-bad">متأخرة</span>':''}</td><td>${subBadge(b)}</td><td class="muted">${b&&b.feedback?esc(b.feedback):''}</td><td>${!b||b.status!=='graded'?`<button class="btn sm gold" data-act="submit" data-id="${x.id}">${ic('upload')} ${b?'إعادة التسليم':'تسليم'}</button>`:''} ${b?`<button class="btn sm" data-act="review" data-id="${b.id}">عرض</button>`:''}</td></tr>`}).join('')}</tbody></table></div>${list.length?'':'<div class="empty">لا وظائف بعد</div>'}</section>`};
VIEWS.subs=()=>{const f=UI.subf??'submitted';const list=S.subs.filter(x=>!f||x.status===f).sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="pagehead"><div><h2>التسليمات</h2><div class="sub">مراجعة ما رفعه الطلاب وتقييمه</div></div><div class="tools noprint"><select id="subf"><option value="submitted" ${f==='submitted'?'selected':''}>بانتظار التقييم</option><option value="graded" ${f==='graded'?'selected':''}>مُقيَّمة</option><option value="returned" ${f==='returned'?'selected':''}>مُعادة للتعديل</option><option value="" ${!f?'selected':''}>الكل</option></select></div></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>الطالب</th><th>الوظيفة</th><th>تاريخ التسليم</th><th>الملفات</th><th>الحالة</th><th></th></tr></thead><tbody>${list.map(x=>{const s=stuById(x.sid),t=taskById(x.taskId);return `<tr class="click" data-act="review" data-id="${x.id}"><td><div class="who">${avatar(s)}${esc(s?s.name:'—')}</div></td><td>${esc(t?t.title:'—')}</td><td>${fmtD(x.date)} ${t&&x.date>t.due?'<span class="badge b-warn">متأخر</span>':''}</td><td>${(x.files||[]).length}${x.link?' + رابط':''}</td><td>${subBadge(x)}</td><td><button class="btn sm pri">مراجعة</button></td></tr>`}).join('')}</tbody></table></div>${list.length?'':'<div class="empty">لا تسليمات في هذا التصنيف</div>'}</section>`};
VIEWS.sessions=()=>{const list=[...S.sessions].sort((a,b)=>b.date.localeCompare(a.date));
  chart('cAt',cv=>bars3D(cv,S.students.map(s=>({label:s.name.split(' ')[0],value:attendance(s)||0,color:'#2d5c4b'})),{rot:S.students.length>10,height:260}));
  return `<div class="pagehead"><div><h2>الجلسات والحضور</h2><div class="sub">${list.length} جلسة · ${list.reduce((a,x)=>a+(+x.hours||0),0)} ساعة تدريب</div></div><button class="btn pri noprint" data-act="addSession">${ic('plus')} تسجيل جلسة</button></div>
  ${S.students.length?'<section class="panel"><h3>نسبة حضور كل طالب</h3><div class="cwrap"><canvas id="cAt"></canvas></div></section>':''}
  <section class="panel"><div class="tw"><table><thead><tr><th>التاريخ</th><th>الموضوع</th><th>الساعات</th><th>الحضور</th><th>الغائبون</th><th></th></tr></thead><tbody>${list.map(x=>{const el=S.students.filter(s=>x.date>=(s.joined||'')),ab=el.filter(s=>!(x.present||[]).includes(s.id));return `<tr><td>${fmtD(x.date)}</td><td>${esc(x.topic)}</td><td>${esc(x.hours)}</td><td>${el.length-ab.length}/${el.length}</td><td class="muted">${ab.map(s=>esc(s.name)).join('، ')||'—'}</td><td class="noprint"><button class="btn sm" data-act="editSession" data-id="${x.id}">${ic('edit')}</button></td></tr>`}).join('')}</tbody></table></div>${list.length?'':'<div class="empty">لا جلسات بعد</div>'}</section>`};

/* ---------- reports ---------- */
function periodRange(type,ds){const d=parseD(ds);
  if(type==='w'){const s=addDays(d,-((d.getDay()+1)%7)),e=addDays(s,6);return{s,e,key:'w:'+iso(s),label:`الأسبوع من ${fmtD(iso(s))} إلى ${fmtD(iso(e))}`}}
  if(type==='m'){const s=new Date(d.getFullYear(),d.getMonth(),1),e=new Date(d.getFullYear(),d.getMonth()+1,0);return{s,e,key:'m:'+iso(s),label:`شهر ${MONTHS[d.getMonth()]} ${d.getFullYear()}`}}
  const n={q:3,h:6,y:12}[type],st=parseD(S.settings.startDate),k=Math.max(0,Math.floor(monthsDiff(st,d)/n)),s=addMonths(st,k*n),e=addDays(addMonths(st,(k+1)*n),-1);
  const label=type==='q'?`الربع ${k%4+1} من السنة ${Math.floor(k/4)+1}`:type==='h'?`النصف ${k%2+1} من السنة ${Math.floor(k/2)+1}`:`السنة ${k+1} من التدريب`;
  return{s,e,key:type+':'+iso(s),label:label+` (${fmtD(iso(s))} ← ${fmtD(iso(e))})`}}
function periodLabelFromKey(key){const[t,d]=String(key).split(':');return PERIODS[t]?'تقرير '+PERIODS[t]+': '+periodRange(t,d).label:key}
function reportRow(s,r){const from=iso(r.s),to=iso(r.e<new Date()?r.e:new Date()),p0=studentPct(s,iso(addDays(r.s,-1))),p1=studentPct(s,to);
  const sb=S.subs.filter(x=>x.sid===s.id&&x.date>=from&&x.date<=iso(r.e)),due=tasksFor(s).filter(t=>t.due>=from&&t.due<=iso(r.e)),done=due.filter(t=>subOf(t.id,s.id));
  return{p0,p1,delta:(p1??0)-(p0??0),subs:sb.length,due:due.length,done:done.length,avg:avgScore(sb),att:attendance(s,from,iso(r.e)),sb,dueList:due}}
VIEWS.reports=()=>{const R=UI.r||(UI.r={type:'m',date:today(),scope:'',track:''});if(ME.role==='student')R.scope=ME.studentId;
  const r=periodRange(R.type,R.date);const stu=R.scope?[stuById(R.scope)].filter(Boolean):S.students.filter(s=>!R.track||s.trackId===R.track);
  const rows=stu.map(s=>[s,reportRow(s,r)]);
  const A=k=>{const v=rows.map(([,x])=>x[k]).filter(v=>v!=null);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null};
  const staff=isStaff();
  const ctl=`<div class="panel noprint"><div class="tools"><b>نوع التقرير:</b>${Object.entries(PERIODS).map(([k,l])=>`<button class="btn sm ${R.type===k?'pri':''}" data-act="rtype" data-v="${k}">${l}</button>`).join('')}<input type="date" id="rdate" value="${R.date}">${staff?`<select id="rscope"><option value="">الدفعة كاملة</option>${S.students.map(s=>`<option value="${s.id}" ${R.scope===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>`:''}<button class="btn gold" data-act="print" style="margin-inline-start:auto">${ic('print')} طباعة / PDF</button></div></div>`;
  const trName=R.track&&S.tracks.find(t=>t.id===R.track);
  const head=`<div class="rhead"><div class="lg">${logoHTML()}</div><div style="flex:1"><h2>${esc(S.settings.name)}: تقرير ${PERIODS[R.type]}</h2><div class="muted">${esc(r.label)}${R.scope&&stu[0]?' · الطالب: <b>'+esc(stu[0].name)+'</b>':trName?' · '+esc(trName.name):''}</div></div><div class="muted" style="text-align:left">تاريخ الإصدار<br>${fmtD(today())}</div></div>`;
  if(R.scope&&stu[0]){const s=stu[0],x=rows[0][1],note=S.notes.find(q=>q.sid===s.id&&q.key===r.key);
    const pa=S.attempts.filter(a=>a.sid===s.id&&a.status==='submitted'&&String(a.finishedAt||'').slice(0,10)>=iso(r.s)&&String(a.finishedAt||'').slice(0,10)<=iso(r.e));
    chart('cR1',cv=>bars3D(cv,pa.map(a=>({label:((S.exams.find(e=>e.id===a.examId)||{}).title||'اختبار').slice(0,14),value:pctOf(a),color:'#2d5c4b'})),{height:260}));
    return ctl+`<section class="panel">${head}
    <div class="kpis">${kpi(x.p1,'متوسط الاختبارات في نهاية الفترة',x.p0==null?'':`كان ${x.p0}% في بدايتها`)}${kpi(clamp(x.delta*5),'التقدم خلال الفترة','نقطة مئوية','var(--gold)',(x.delta>=0?'+':'')+x.delta)}${kpi(x.due?Math.round(x.done*100/x.due):null,'تسليم وظائف الفترة',`${x.done} من ${x.due}`,'#2b6cb0')}${kpi(x.avg,'متوسط العلامات',`${x.subs} تسليماً`,'#6b4bb0')}${kpi(x.att,'الحضور','','#2f855a')}</div>
    <div class="grid2e"><div><h3>اختبارات الفترة</h3>${pa.length?'<div class="cwrap"><canvas id="cR1"></canvas></div>':'<div class="muted">لم يقدّم اختباراً في هذه الفترة</div>'}</div><div><h3>وظائف الفترة</h3>${x.dueList.map(tk=>`<div class="file"><span>${esc(tk.title)}</span>${subBadge(subOf(tk.id,s.id))}</div>`).join('')||'<div class="muted">لا وظائف مستحقة في هذه الفترة</div>'}</div></div>
    <h3>ملاحظة المدرّب</h3>${staff?`<textarea rows="4" data-act="note" data-sid="${s.id}" data-key="${r.key}" placeholder="اكتب تقييمك للطالب في هذه الفترة: نقاط القوة، ما يحتاج تحسيناً، الخطة للفترة القادمة…">${esc(note?note.text:'')}</textarea>`:`<div class="note">${esc(note?note.text:'لا ملاحظات')}</div>`}</section>`}
  chart('cR',cv=>bars3D(cv,rows.map(([s,x])=>({label:s.name.split(' ')[0],value:x.p1||0,color:'#2d5c4b'})),{rot:rows.length>10,height:280}));
  chart('cRd',cv=>bars3D(cv,rows.map(([s,x])=>({label:s.name.split(' ')[0],value:Math.max(0,x.delta),color:'#b98a3e'})),{rot:rows.length>10,height:280,max:Math.max(10,...rows.map(([,x])=>x.delta)),unit:''}));
  const ad=A('delta')||0;
  return ctl+`<section class="panel">${head}
  <div class="kpis">${kpi(A('p1'),'متوسط الاختبارات في نهاية الفترة',A('p0')==null?'':`كان ${A('p0')}% في بدايتها`)}${kpi(clamp(ad*5),'متوسط التقدم خلال الفترة','نقطة مئوية','var(--gold)',(ad>=0?'+':'')+ad)}${kpi(A('avg'),'متوسط العلامات',`${rows.reduce((a,[,x])=>a+x.subs,0)} تسليماً`,'#6b4bb0')}${kpi(A('att'),'متوسط الحضور','','#2f855a')}</div>
  <div class="grid2e"><div><h3>متوسط الاختبارات لكل طالب</h3><div class="cwrap"><canvas id="cR"></canvas></div></div><div><h3>نقاط التقدم خلال الفترة</h3><div class="cwrap"><canvas id="cRd"></canvas></div></div></div>
  <h3>التفاصيل</h3><div class="tw"><table><thead><tr><th>الطالب</th><th>بداية الفترة</th><th>نهايتها</th><th>التقدم</th><th>الوظائف</th><th>العلامات</th><th>الحضور</th><th>المستوى</th><th style="min-width:220px">ملاحظة المدرّب</th></tr></thead><tbody>
  ${rows.map(([s,x])=>{const[a,b]=status(s),note=S.notes.find(q=>q.sid===s.id&&q.key===r.key);return `<tr><td><a href="#" data-act="rscopeTo" data-id="${s.id}"><b>${esc(s.name)}</b></a></td><td>${x.p0==null?'—':x.p0+'%'}</td><td>${x.p1==null?'—':pbar(x.p1)}</td><td><b dir="ltr" style="color:${x.delta>0?'var(--ok)':'var(--mut)'}">${x.delta>0?'+':''}${x.delta}</b></td><td>${x.done}/${x.due}</td><td>${x.avg==null?'—':x.avg+'%'}</td><td>${x.att==null?'—':x.att+'%'}</td><td><span class="badge ${b}">${a}</span></td><td>${staff?`<textarea rows="2" data-act="note" data-sid="${s.id}" data-key="${r.key}">${esc(note?note.text:'')}</textarea>`:esc(note?note.text:'')}</td></tr>`}).join('')}</tbody></table></div></section>`};

/* ================= الاستبيانات ================= */
VIEWS.surveys=()=>{
  if(ME.role==='student'){const list=mySurveys();const st=v=>answeredByMe(v.id)?'<span class="badge b-ok">✓ أجبت</span>':v.status==='open'?'<span class="badge b-info">بانتظار إجابتك</span>':'<span class="badge b-mut">مغلق</span>';
    return `<div class="pagehead"><div><h2>الاستبيانات</h2><div class="sub">رأيك يساعد على تحسين التدريب</div></div></div>
    <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${list.map(v=>`<div class="svcard"><div class="ph" style="margin:0"><h3>${esc(v.title)}</h3>${st(v)}</div>${v.desc?`<div class="muted">${esc(v.desc)}</div>`:''}<div class="muted">${v.questions.length} سؤالاً${v.deadline?' · حتى '+fmtD(v.deadline):''} · ${v.anonymous?'🔒 مجهول الهوية':'بالاسم'}</div>${v.status==='open'&&!answeredByMe(v.id)?`<button class="btn gold" data-act="answerSv" data-id="${v.id}" style="align-self:flex-start">أجب الآن</button>`:''}</div>`).join('')||'<div class="empty">لا استبيانات حالياً</div>'}</div>`}
  const list=[...S.surveys].sort((a,b)=>String(b.created||'').localeCompare(String(a.created||'')));
  const stB=v=>v.status==='open'?'<span class="badge b-ok">مفتوح</span>':v.status==='closed'?'<span class="badge b-mut">مغلق</span>':'<span class="badge b-warn">مسودة</span>';
  return `<div class="pagehead"><div><h2>الاستبيانات</h2><div class="sub">أنشئ استبياناً، وانشره للطلاب، وحلّل نتائجه تلقائياً</div></div><div class="tools noprint"><button class="btn" data-act="svTpl" data-k="monthly">${ic('copy')} من قالب: الرضا الشهري</button><button class="btn" data-act="svTpl" data-k="session">${ic('copy')} من قالب: تقييم جلسة</button><button class="btn pri" data-act="newSv">${ic('plus')} استبيان جديد</button></div></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>الاستبيان</th><th>الهوية</th><th>الحالة</th><th>نسبة الاستجابة</th><th>الموعد</th><th></th></tr></thead><tbody>
  ${list.map(v=>{const tg=svTargets(v).length,np=svParts(v.id).length;return `<tr class="click" data-go="survey:${v.id}"><td><b>${esc(v.title)}</b><br><small class="muted">${v.questions.length} سؤالاً</small></td><td>${v.anonymous?'🔒 مجهول':'بالاسم'}</td><td>${stB(v)}</td><td>${pbar(tg?Math.round(np*100/tg):0)} <small class="muted">${np}/${tg}</small></td><td>${v.deadline?fmtD(v.deadline):'—'}</td><td class="tools noprint">${v.status!=='open'?`<button class="btn sm gold" data-act="svStatus" data-id="${v.id}" data-v="open">نشر</button>`:`<button class="btn sm" data-act="svStatus" data-id="${v.id}" data-v="closed">إغلاق</button>`}<button class="btn sm" data-act="editSv" data-id="${v.id}">${ic('edit')}</button><button class="btn sm" data-act="dupSv" data-id="${v.id}" title="نسخ">${ic('copy')}</button><button class="btn sm danger" data-act="delSv" data-id="${v.id}">${ic('trash')}</button></td></tr>`}).join('')}
  </tbody></table></div>${list.length?'':'<div class="empty">لا استبيانات بعد. ابدأ من قالب جاهز أو أنشئ استبياناً جديداً.</div>'}</section>`};

function surveyBuilder(sv){
  const draft=JSON.parse(JSON.stringify(sv));const hasResp=svParts(sv.id).length>0;
  const box=modal(mhead(sv._new?'استبيان جديد':'تعديل الاستبيان')+`
  ${hasResp?'<div class="banner">⚠️ هذا الاستبيان فيه إجابات. تعديل الأسئلة أو حذفها قد يجعل تحليل الإجابات السابقة غير دقيق.</div>':''}
  <div class="fgrid"><label class="full">عنوان الاستبيان<input id="svT" value="${esc(draft.title)}" placeholder="مثلاً: استبيان الرضا عن الشهر الأول"></label>
  <label class="full">وصف أو تعليمات (اختياري)<textarea id="svD" rows="2">${esc(draft.desc||'')}</textarea></label>
  <input type="hidden" id="svTr" value="">
  <label>آخر موعد للإجابة (اختياري)<input type="date" id="svDl" value="${esc(draft.deadline||'')}"></label>
  <label class="ck full"><input type="checkbox" id="svAn" ${draft.anonymous?'checked':''} ${hasResp?'disabled':''}> 🔒 استبيان مجهول الهوية: لا يُحفظ اسم الطالب مع إجاباته، ويُعرف فقط من أجاب ومن لم يجب</label></div>
  <h3 style="margin-top:16px">الأسئلة</h3><div id="qb"></div>
  <div class="qb-add">${Object.entries(QTYPES).map(([k,l])=>`<button class="btn sm" data-qadd="${k}">${ic('plus')} ${l}</button>`).join('')}</div>
  <div class="factions" style="margin-top:16px"><button class="btn pri" data-svsave="keep">حفظ</button>${draft.status!=='open'?'<button class="btn gold" data-svsave="open">حفظ ونشر للطلاب</button>':''}<button class="btn" data-close>إلغاء</button></div>`,true);
  const renderQ=()=>{$('#qb',box).innerHTML=draft.questions.map((q,i)=>`<div class="qb-item"><div class="qhead"><b>${i+1}</b><input data-qi="${i}" data-k="text" value="${esc(q.text)}" placeholder="نص السؤال"><select data-qi="${i}" data-k="type">${Object.entries(QTYPES).map(([k,l])=>`<option value="${k}" ${q.type===k?'selected':''}>${l}</option>`).join('')}</select>
    <label class="ck" style="display:flex;gap:4px;align-items:center;font-size:13px"><input type="checkbox" data-qi="${i}" data-k="required" ${q.required?'checked':''}> إلزامي</label>
    <button class="icon-btn" data-qmv="${i}" data-d="-1" title="لأعلى">${ic('up')}</button><button class="icon-btn" data-qmv="${i}" data-d="1" title="لأسفل">${ic('down')}</button><button class="icon-btn" data-qdel="${i}" title="حذف">${ic('trash')}</button></div>
    ${q.type==='single'||q.type==='multi'?`<textarea data-qi="${i}" data-k="options" rows="3" placeholder="خيار في كل سطر">${esc((q.options||[]).join('\n'))}</textarea>`:`<div class="muted" style="font-size:12.5px">${q.type==='scale'?SCALE.join(' · '):q.type==='rating'?'مقياس من 1 (الأدنى) إلى 10 (الأعلى)':q.type==='yesno'?'نعم · لا':'مربع نص يكتب فيه الطالب إجابته'}</div>`}</div>`).join('')||'<div class="empty">أضف أول سؤال من الأزرار في الأسفل</div>'};
  renderQ();
  box.addEventListener('input',e=>{const el=e.target;if(el.dataset.qi==null)return;const q=draft.questions[+el.dataset.qi];const k=el.dataset.k;
    if(k==='text')q.text=el.value;else if(k==='options')q.options=el.value.split('\n').map(x=>x.trim()).filter(Boolean)});
  box.addEventListener('change',e=>{const el=e.target;if(el.dataset.qi==null)return;const q=draft.questions[+el.dataset.qi];const k=el.dataset.k;
    if(k==='type'){q.type=el.value;if((q.type==='single'||q.type==='multi')&&!(q.options||[]).length)q.options=['الخيار الأول','الخيار الثاني'];renderQ()}else if(k==='required')q.required=el.checked});
  box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.qadd){draft.questions.push({id:uid(),type:b.dataset.qadd,text:'',options:b.dataset.qadd==='single'||b.dataset.qadd==='multi'?['الخيار الأول','الخيار الثاني']:[],required:b.dataset.qadd!=='text'});renderQ();const its=$$('.qb-item input[data-k=text]',box);its[its.length-1].focus();return}
    if(b.dataset.qdel!=null){draft.questions.splice(+b.dataset.qdel,1);renderQ();return}
    if(b.dataset.qmv!=null){const i=+b.dataset.qmv,j=i+ +b.dataset.d;if(j<0||j>=draft.questions.length)return;[draft.questions[i],draft.questions[j]]=[draft.questions[j],draft.questions[i]];renderQ();return}
    if(b.dataset.svsave){draft.title=$('#svT',box).value.trim();draft.desc=$('#svD',box).value.trim();draft.trackId=$('#svTr',box).value;draft.deadline=$('#svDl',box).value;if(!hasResp)draft.anonymous=$('#svAn',box).checked;
      if(!draft.title){toast('اكتب عنوان الاستبيان','err');return}if(!draft.questions.length){toast('أضف سؤالاً واحداً على الأقل','err');return}
      const bad=draft.questions.findIndex(q=>!q.text.trim()||((q.type==='single'||q.type==='multi')&&(q.options||[]).length<2));if(bad>=0){toast(`السؤال ${bad+1}: اكتب نصه، وخيارين على الأقل للاختيار`,'err');return}
      if(b.dataset.svsave==='open')draft.status='open';const isNew=draft._new;delete draft._new;closeModal();
      mutate(S=>{const i=S.surveys.findIndex(x=>x.id===draft.id);if(i>=0)S.surveys[i]=draft;else S.surveys.push(draft);log((isNew?'أُنشئ':'عُدّل')+' الاستبيان: '+draft.title+(draft.status==='open'?' (منشور)':''))});go('surveys')}});
}
function answerForm(id){const v=S.surveys.find(x=>x.id===id);if(!v)return;
  const qh=(q,i)=>{const n=`q_${q.id}`;let inner='';
    if(q.type==='single'||q.type==='yesno')inner=`<div class="opts">${(q.type==='yesno'?['نعم','لا']:q.options).map(o=>`<label><input type="radio" name="${n}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</div>`;
    else if(q.type==='multi')inner=`<div class="opts">${q.options.map(o=>`<label><input type="checkbox" name="${n}" value="${esc(o)}"> ${esc(o)}</label>`).join('')}</div>`;
    else if(q.type==='scale')inner=`<div class="scale-row">${SCALE.map((l,k)=>`<label><input type="radio" name="${n}" value="${k+1}"><span>${l}</span></label>`).join('')}</div>`;
    else if(q.type==='rating')inner=`<div class="scale-row r10">${Array.from({length:10},(_,k)=>`<label><input type="radio" name="${n}" value="${k+1}"><b>${k+1}</b></label>`).join('')}</div>`;
    else inner=`<textarea name="${n}" rows="3" maxlength="2000"></textarea>`;
    return `<div class="q"><b>${i+1}. ${esc(q.text)} ${q.required?'<span class="req">*</span>':''}</b>${inner}</div>`};
  const box=modal(mhead(esc(v.title))+`${v.desc?`<div class="note" style="margin-bottom:12px">${esc(v.desc)}</div>`:''}<div class="muted" style="margin-bottom:10px">${v.anonymous?'🔒 هذا الاستبيان مجهول الهوية: لن يُحفظ اسمك مع إجاباتك.':'ستُحفظ إجاباتك باسمك ليتابعها المدرّب.'}</div><form class="qform">${v.questions.map(qh).join('')}<div class="factions"><button class="btn pri">إرسال الإجابات</button><button type="button" class="btn" data-close>إلغاء</button></div></form>`,true);
  $('form',box).onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target),ans={};
    for(const [i,q] of v.questions.entries()){const n=`q_${q.id}`;let val;
      if(q.type==='multi')val=fd.getAll(n);else if(q.type==='scale'||q.type==='rating'){val=fd.get(n);val=val==null?null:+val}else{val=fd.get(n);val=val==null?null:String(val).trim()}
      const empty=val==null||val===''||(Array.isArray(val)&&!val.length);if(q.required&&empty){toast(`أجب عن السؤال ${i+1}`,'err');return}if(!empty)ans[q.id]=val}
    const btn=$('button.pri',e.target);btn.disabled=true;
    try{await API.submitSurvey(v.id,ans);closeModal();toast('شكراً، أُرسلت إجاباتك ✓');if(API.mode==='supabase')await reload();else{S=normalize(await API.loadAll());render()}}
    catch(err){toast(errMsg(err),'err');btn.disabled=false}}}

/* ---------- تحليل النتائج ---------- */
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const median=a=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const sdev=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(a.length-1))};
const f1=x=>x==null?'—':(+x).toFixed(1);
const STOP=new Set('في من على الى إلى عن مع هذا هذه ذلك تلك التي الذي الذين ان أن إن او أو و ثم لا ما لم لن قد كان كانت يكون تكون هو هي هم نحن انا أنا انت أنت كل بعض اي أي جدا جداً شي شيء اكثر أكثر اقل أقل عند كما لكن بل حتى اذا إذا لو فيه فيها به بها له لها لي لنا لهم منه منها عليه عليها يعني ايضا أيضا فقط غير بين خلال بعد قبل حول كيف لماذا متى هل نعم ممكن يمكن اريد أريد يجب كذلك مثل وفي وعلى ومن الى'.split(' ').map(w=>normAr(w)));
function normAr(w){return String(w).replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')}
function tokens(t){return normAr(t).replace(/[^؀-ۿa-zA-Z0-9\s]/g,' ').split(/\s+/).map(w=>{w=w.toLowerCase();if(w.startsWith('وال')&&w.length>5)w=w.slice(3);else if(w.startsWith('ال')&&w.length>4)w=w.slice(2);return w}).filter(w=>w.length>2&&!STOP.has(w)&&!/^\d+$/.test(w))}
const POS=['ممتاز','رايع','جيد','مفيد','ممتع','احب','احببت','سهل','واضح','افضل','شكرا','مميز','تحسن','نجاح','متحمس','جميل','مناسب','متعاون','استفدت','تعلمت','ممتازه','مفيده','رايعه','جيده','واضحه','سعيد','راض','راضي','مريح'].map(normAr);
const NEG=['سيء','سيي','صعب','صعبه','ممل','مله','ضعيف','ضعيفه','مشكله','مشاكل','معقد','تاخير','قليل','قليله','نقص','متعب','مرهق','ضغط','سلبي','اسوا','كثيره','سريع','مزعج','بطيء','صعوبه','تعب','غامض','ملل','مشتت','ناقص'].map(normAr);
function sentiment(text){const w=tokens(text).concat(normAr(text).split(/\s+/));let p=0,n=0;w.forEach(x=>{if(POS.some(k=>x.includes(k)))p++;if(NEG.some(k=>x.includes(k)))n++});if(/(غير|لا|ليس|ليست)\s+\S*(واضح|مفيد|مناسب|جيد)/.test(normAr(text))){n+=2;p=Math.max(0,p-1)}return p>n?1:n>p?-1:0}
function hlist(items,total,color){return `<div class="hlist">${items.map(([l,c])=>{const p=total?Math.round(c*100/total):0;return `<div class="r"><div>${esc(l)}</div><span><i style="width:${p}%;${color?`background:${color}`:''}"></i></span><div class="muted">${c} · ${p}%</div></div>`}).join('')}</div>`}
function analyzeQuestion(q,resp,idx,sv){
  const vals=resp.map(r=>r.answers[q.id]).filter(v=>v!=null&&v!==''&&!(Array.isArray(v)&&!v.length));const n=vals.length,cid=`qc_${idx}`,ins=[];
  let body='';
  if(q.type==='single'||q.type==='yesno'){const opts=q.type==='yesno'?['نعم','لا']:[...q.options];vals.forEach(v=>{if(!opts.includes(v))opts.push(v)});
    const cnt=opts.map(o=>[o,vals.filter(v=>v===o).length]);const cols=['#1b6b67','#b98a3e','#2563a8','#a8436e','#6b7f2e','#6b4bb0','#c0392b','#55606b'];
    const items=cnt.map(([l,c],i)=>({label:l,value:c,color:q.type==='yesno'?(i===0?'#2f855a':'#c0392b'):cols[i%cols.length]})).filter(x=>x.value);
    if(items.length)chart(cid,cv=>pie3D(cv,items,{height:220}));
    const top=[...cnt].sort((a,b)=>b[1]-a[1])[0];if(n&&top){const p=Math.round(top[1]*100/n);ins.push(p>=60?['g',`إجماع واضح في «${q.text}»: ${p}% اختاروا «${top[0]}».`]:['',`الخيار الأكثر في «${q.text}»: «${top[0]}» (${p}%).`])}
    body=`<div class="grid2e"><div>${items.length?`<div class="cwrap"><canvas id="${cid}"></canvas></div>`+legend(items):''}</div><div>${hlist([...cnt].sort((a,b)=>b[1]-a[1]),n)}</div></div>`}
  else if(q.type==='multi'){const opts=[...q.options];vals.flat().forEach(v=>{if(!opts.includes(v))opts.push(v)});const cnt=opts.map(o=>[o,vals.filter(v=>Array.isArray(v)&&v.includes(o)).length]).sort((a,b)=>b[1]-a[1]);
    chart(cid,cv=>bars3D(cv,cnt.map(([l,c])=>({label:l,value:n?Math.round(c*100/n):0,color:'#2563a8'})),{height:240,rot:cnt.length>5}));
    if(n&&cnt[0])ins.push(['',`أكثر ما اختاره الطلاب في «${q.text}»: «${cnt[0][0]}» (${Math.round(cnt[0][1]*100/n)}% من المجيبين)${cnt[1]&&cnt[1][1]?`، ثم «${cnt[1][0]}»`:''}.`]);
    body=`<div class="grid2e"><div class="cwrap"><canvas id="${cid}"></canvas></div><div>${hlist(cnt,n)}<p class="muted" style="font-size:12px">النسبة من عدد المجيبين، ويمكن للطالب اختيار أكثر من خيار.</p></div></div>`}
  else if(q.type==='scale'||q.type==='rating'){const nums=vals.map(Number).filter(x=>!isNaN(x)),max=q.type==='scale'?5:10,m=mean(nums),md=median(nums),sd=sdev(nums);
    const dist=Array.from({length:max},(_,k)=>nums.filter(x=>x===k+1).length);const idxv=m==null?null:Math.round((m-1)/(max-1)*100);
    if(q.type==='scale'){chart(cid,cv=>bars3D(cv,dist.map((c,k)=>({label:SCALE[k],value:n?Math.round(c*100/n):0,color:SCALE_COLORS[k]})),{height:240}));
      const agree=n?Math.round((dist[3]+dist[4])*100/n):0,dis=n?Math.round((dist[0]+dist[1])*100/n):0;
      body=`<div class="stats3"><div>المتوسط<b>${f1(m)} / 5</b></div><div>الوسيط<b>${f1(md)}</b></div><div>الانحراف المعياري<b>${f1(sd)}</b></div><div>مؤشر الرضا<b>${idxv??'—'}%</b></div><div style="background:var(--okb)">موافقون<b>${agree}%</b></div><div style="background:var(--badb)">غير موافقين<b>${dis}%</b></div></div><div class="cwrap"><canvas id="${cid}"></canvas></div>`;
      if(n){if(dis>=40)ins.push(['w',`تحتاج متابعة: ${dis}% غير موافقين على «${q.text}».`]);else if(agree>=75)ins.push(['g',`نقطة قوة: ${agree}% موافقون على «${q.text}».`]);if(sd>1.2&&n>=4)ins.push(['w',`الآراء منقسمة حول «${q.text}» (الانحراف المعياري ${f1(sd)}): بعض الطلاب راضون جداً وبعضهم غير راضٍ. يستحق نقاشاً فردياً.`])}}
    else{const prom=nums.filter(x=>x>=9).length,det=nums.filter(x=>x<=6).length,nps=n?Math.round((prom-det)*100/n):null;
      chart(cid,cv=>bars3D(cv,dist.map((c,k)=>({label:String(k+1),value:c,color:k<6?'#c0392b':k<8?'#a0a7ad':'#2f855a'})),{height:240,unit:'',max:Math.max(3,...dist)}));
      body=`<div class="stats3"><div>المتوسط<b>${f1(m)} / 10</b></div><div>الوسيط<b>${f1(md)}</b></div><div>الانحراف المعياري<b>${f1(sd)}</b></div><div>مؤشر صافي التوصية (NPS)<b dir="ltr">${nps??'—'}</b></div></div><div class="cwrap"><canvas id="${cid}"></canvas></div><p class="muted" style="font-size:12px">NPS = نسبة من أعطوا 9–10 ناقص نسبة من أعطوا 1–6. فوق 0 جيد، وفوق 50 ممتاز.</p>`;
      if(n)ins.push([m>=7.5?'g':m<5.5?'w':'',`متوسط تقييم «${q.text}»: ${f1(m)} من 10.`])}
    q._mean=m;q._idx=idxv}
  else{const texts=vals.map(String);const freq={},orig={};texts.forEach(t=>t.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g,' ').split(/\s+/).forEach(raw=>{const w=tokens(raw)[0];if(!w)return;freq[w]=(freq[w]||0)+1;const o=(orig[w]=orig[w]||{});const r=raw.replace(/^و(?=ال)/,'');o[r]=(o[r]||0)+1}));const disp=w=>Object.entries(orig[w]||{[w]:1}).sort((a,b)=>b[1]-a[1])[0][0];const top=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,18).map(([w,c])=>[disp(w),c]);const mx=top.length?top[0][1]:1,mn=top.length?top[top.length-1][1]:1;
    const sent=texts.map(sentiment),sp=sent.filter(x=>x>0).length,sn=sent.filter(x=>x<0).length,s0=n-sp-sn;
    const sItems=[{label:'إيجابية',value:sp,color:'#2f855a'},{label:'محايدة',value:s0,color:'#a0a7ad'},{label:'سلبية',value:sn,color:'#c0392b'}].filter(x=>x.value);
    if(sItems.length)chart(cid,cv=>pie3D(cv,sItems,{height:200}));
    body=`<div class="grid2e"><div><b style="font-size:13px">الكلمات الأكثر تكراراً</b><div class="cloud">${top.map(([w,c])=>`<span style="font-size:${mx>mn?14+Math.round((c-mn)/(mx-mn)*16):16}px;opacity:${mx>mn?.6+.4*(c-mn)/(mx-mn):.85}" title="${c} مرة">${esc(w)}</span>`).join('')||'<span class="muted">—</span>'}</div>
      <b style="font-size:13px">الإجابات (${n})</b><div class="answers">${texts.map((t,i)=>`<div>${sent[i]>0?'🟢':sent[i]<0?'🔴':'⚪'} ${esc(t)}</div>`).join('')||'<span class="muted">لا إجابات</span>'}</div></div>
      <div>${sItems.length?`<b style="font-size:13px">اتجاه الإجابات (تقريبي)</b><div class="cwrap"><canvas id="${cid}"></canvas></div>${legend(sItems)}<p class="muted" style="font-size:12px">تصنيف تقريبي يعتمد على كلمات مفتاحية، فاقرأ الإجابات نفسها قبل أي قرار.</p>`:''}</div></div>`;
    if(top.length)ins.push(['',`أبرز الكلمات في «${q.text}»: ${top.slice(0,4).map(x=>'«'+x[0]+'»').join('، ')}.`]);if(n>=3&&sn>sp)ins.push(['w',`أغلب الإجابات النصية في «${q.text}» تميل للسلبية: راجعها بعناية.`])}
  return{html:`<div class="qres"><h4>${idx+1}. ${esc(q.text)}</h4><div class="meta">${QTYPES[q.type]} · ${n} إجابة${resp.length&&n<resp.length?` (تخطّاه ${resp.length-n})`:''}</div>${n?body:'<div class="muted">لا إجابات بعد</div>'}</div>`,ins}}
VIEWS.survey=id=>{if(!isStaff())return '';const v=S.surveys.find(x=>x.id===id);if(!v)return '<div class="panel">الاستبيان غير موجود</div>';
  const fT=UI.svTrack||'';let resp=svResp(id);if(fT)resp=resp.filter(r=>r.trackId===fT);
  const tg=svTargets(v),parts=svParts(id),partU=new Set(parts.map(p=>p.userId)),rate=tg.length?Math.round(tg.filter(s=>{const u=S.users.find(x=>x.studentId===s.id);return u&&partU.has(u.id)}).length*100/tg.length):0;
  const noAcc=tg.filter(s=>!S.users.some(u=>u.studentId===s.id));const missing=tg.filter(s=>{const u=S.users.find(x=>x.studentId===s.id);return u&&!partU.has(u.id)});
  const Q=v.questions.map(q=>({...q}));const parts2=Q.map((q,i)=>analyzeQuestion(q,resp,i,v));
  const ins=[];if(tg.length)ins.push(rate<60?['w',`نسبة الاستجابة ${rate}% منخفضة؛ النتائج قد لا تمثل كل الطلاب. ذكّر ${missing.length} طالباً لم يجيبوا بعد.`]:['g',`نسبة الاستجابة ${rate}%: النتائج تمثل الدفعة بشكل جيد.`]);
  const sc=Q.filter(q=>q.type==='scale'&&q._mean!=null).sort((a,b)=>b._mean-a._mean);if(sc.length>1){ins.push(['g',`أعلى رضا: «${sc[0].text}» (${f1(sc[0]._mean)}/5).`]);ins.push(['w',`أدنى رضا: «${sc[sc.length-1].text}» (${f1(sc[sc.length-1]._mean)}/5). ابدأ التحسين من هنا.`])}
  if(sc.length){const all=Math.round(mean(sc.map(q=>q._idx)));ins.unshift([all>=70?'g':all<50?'w':'',`مؤشر الرضا العام لهذا الاستبيان: ${all}% (متوسط أسئلة المقياس).`])}
  parts2.forEach(p=>ins.push(...p.ins));
  let low='';if(!v.anonymous){const scQ=Q.filter(q=>q.type==='scale');if(scQ.length){const lows=resp.filter(r=>r.sid).map(r=>{const xs=scQ.map(q=>+r.answers[q.id]).filter(x=>x>0);return[r.sid,mean(xs)]}).filter(([,m])=>m!=null&&m<=2.5);
    if(lows.length)low=`<div class="insights" style="margin-top:8px"><div class="w">👤 طلاب يحتاجون حديثاً فردياً (متوسط موافقتهم 2.5 أو أقل): ${lows.map(([sid,m])=>{const s=stuById(sid);return `<a href="#student:${sid}">${esc(s?s.name:'—')}</a> (${f1(m)})`}).join('، ')}</div></div>`}}
  let cross='';const trks=[...new Set(svResp(id).map(r=>r.trackId).filter(Boolean))];const numQ=Q.filter(q=>q.type==='scale'||q.type==='rating');
  if(trks.length>1&&numQ.length&&!fT){const T=trks.map(t=>S.tracks.find(x=>x.id===t)).filter(Boolean);
    cross=`<section class="panel"><h3>مقارنة بين المسارات</h3><div class="tw"><table><thead><tr><th>السؤال</th>${T.map(t=>`<th>${tdot(t)}${esc(t.name)}</th>`).join('')}<th>الفرق</th></tr></thead><tbody>${numQ.map(q=>{const ms=T.map(t=>mean(svResp(id).filter(r=>r.trackId===t.id).map(r=>+r.answers[q.id]).filter(x=>x>0)));const vv=ms.filter(x=>x!=null);const diff=vv.length>1?Math.max(...vv)-Math.min(...vv):0;const lim=q.type==='scale'?.7:1.4;return `<tr><td>${esc(q.text)}</td>${ms.map(m=>`<td>${f1(m)}</td>`).join('')}<td>${diff>=lim?`<span class="badge b-warn">${f1(diff)}</span>`:f1(diff)}</td></tr>`}).join('')}</tbody></table></div><p class="muted" style="font-size:12px">الفرق المميَّز بالأصفر كبير، ويستحق البحث عن سببه في المسار الأضعف.</p></section>`;
    const big=numQ.map(q=>{const ms=T.map(t=>[t,mean(svResp(id).filter(r=>r.trackId===t.id).map(r=>+r.answers[q.id]).filter(x=>x>0))]).filter(x=>x[1]!=null);if(ms.length<2)return null;ms.sort((a,b)=>a[1]-b[1]);return{q,lo:ms[0],hi:ms[ms.length-1],d:ms[ms.length-1][1]-ms[0][1]}}).filter(x=>x&&x.d>=(x.q.type==='scale'?.7:1.4));
    big.forEach(b=>ins.push(['w',`فرق بين المسارات في «${b.q.text}»: ${b.hi[0].name} ${f1(b.hi[1])} مقابل ${b.lo[0].name} ${f1(b.lo[1])}.`]))}
  return `<div class="pagehead noprint"><div class="tools"><a class="btn" href="#surveys">→ الاستبيانات</a></div><div class="tools">${trks.length>1?`<select id="svtf"><option value="">كل المسارات</option>${S.tracks.map(t=>`<option value="${t.id}" ${fT===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select>`:''}<button class="btn" data-act="svCsv" data-id="${id}">${ic('download')} تصدير Excel</button><button class="btn gold" data-act="print">${ic('print')} طباعة / PDF</button></div></div>
  <section class="panel"><div class="rhead"><div class="lg">${logoHTML()}</div><div style="flex:1"><h2>نتائج: ${esc(v.title)}</h2><div class="muted">${v.anonymous?'🔒 مجهول الهوية':'بالاسم'} · ${v.trackId?esc((S.tracks.find(t=>t.id===v.trackId)||{}).name||''):'كل الطلاب'} · أُنشئ ${fmtD(v.created)}${fT?' · مُصفّى: '+esc((S.tracks.find(t=>t.id===fT)||{}).name||''):''}</div></div><div class="muted" style="text-align:left">تاريخ الإصدار<br>${fmtD(today())}</div></div>
  <div class="kpis">${kpi(rate,'نسبة الاستجابة',`${parts.length} من ${tg.length} طالباً`)}${kpi(null,'عدد الإجابات','',null,String(resp.length))}${kpi(v.status==='open'?100:0,'الحالة','',v.status==='open'?'#2f855a':'#8a94a0',v.status==='open'?'مفتوح':v.status==='closed'?'مغلق':'مسودة')}</div>
  <h3>📊 ملخص التحليل</h3><div class="insights">${ins.map(([c,t])=>`<div class="${c}">${c==='w'?'⚠️':c==='g'?'✅':'💡'} <span>${esc(t)}</span></div>`).join('')||'<div>لا إجابات بعد</div>'}</div>${low}
  ${missing.length||noAcc.length?`<div class="muted" style="margin-top:10px;font-size:13px">${missing.length?`لم يجيبوا بعد: ${missing.map(s=>esc(s.name)).join('، ')}.`:''} ${noAcc.length?`<br>بلا حساب دخول (لا يستطيعون الإجابة): ${noAcc.map(s=>esc(s.name)).join('، ')}.`:''}</div>`:''}</section>
  ${cross}<section class="panel"><h3>تحليل الأسئلة</h3>${parts2.map(p=>p.html).join('')}</section>
  ${!v.anonymous&&resp.length?`<section class="panel"><h3>الإجابات الفردية</h3><div class="tw"><table><thead><tr><th>الطالب</th>${Q.map((q,i)=>`<th title="${esc(q.text)}">س${i+1}</th>`).join('')}</tr></thead><tbody>${resp.map(r=>{const s=stuById(r.sid);return `<tr><td>${esc(s?s.name:'—')}</td>${Q.map(q=>{const a=r.answers[q.id];return `<td style="font-size:13px">${esc(Array.isArray(a)?a.join('، '):q.type==='scale'&&a?SCALE[a-1]:a??'—')}</td>`}).join('')}</tr>`}).join('')}</tbody></table></div></section>`:''}`};
function exportSurveyCSV(id){const v=S.surveys.find(x=>x.id===id),resp=svResp(id);
  const head=[...(v.anonymous?[]:['الطالب']),'الاختصاص','التاريخ',...v.questions.map(q=>q.text)];
  const rows=resp.map(r=>{const s=stuById(r.sid);return[...(v.anonymous?[]:[s?s.name:'']),s?s.spec:'',r.date,...v.questions.map(q=>{const a=r.answers[q.id];return q.type==='scale'&&a?`${a} - ${SCALE[a-1]}`:a})]});
  download(new Blob([toCSV([head,...rows])],{type:'text/csv;charset=utf-8'}),`نتائج-${v.title}.csv`)}

VIEWS.users=()=>{if(!isStaff())return '';const canEdit=u=>isDev()||u.role==='student';return `<div class="pagehead"><div><h2>المستخدمون</h2><div class="sub">${isDev()?'المطور ينشئ حسابات المشرفين والطلاب':'المشرف ينشئ حسابات الطلاب ويعدّلها'}${API.mode==='supabase'?' · الإنشاء وتغيير كلمات المرور يتمان عبر خادم Supabase بأمان':''}</div></div><button class="btn pri" data-act="addUser">${ic('plus')} ${isDev()?'مستخدم جديد':'حساب طالب جديد'}</button></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>الاسم</th><th>اسم المستخدم</th><th>الدور</th><th>الطالب المرتبط</th><th></th></tr></thead><tbody>${S.users.map(u=>{const s=u.studentId&&stuById(u.studentId);return `<tr><td><b>${esc(u.name)}</b></td><td dir="ltr" style="text-align:right">${esc(u.username)}</td><td><span class="badge ${u.role==='dev'?'b-bad':u.role==='student'?'b-mut':'b-warn'}">${ROLES[u.role]}</span></td><td>${s?esc(s.name):'—'}</td><td class="tools">${canEdit(u)?`<button class="btn sm" data-act="editUser" data-id="${u.id}">${ic('edit')} تعديل</button>${u.id!==ME.id?`<button class="btn sm danger" data-act="delUser" data-id="${u.id}">${ic('trash')}</button>`:''}`:'<span class="muted" style="font-size:12px">للمطور فقط</span>'}</td></tr>`}).join('')}</tbody></table></div></section>`};
VIEWS.settings=()=>{if(!isDev())return '';const s=S.settings;const demoData=S.students.some(x=>x.demo);
  return `<div class="pagehead"><div><h2>الإعدادات</h2><div class="sub">هوية المنصة والبيانات والنسخ الاحتياطي</div></div></div>
  <div class="grid2e"><section class="panel"><h3>الهوية والواجهة</h3><form id="setId" class="fgrid">
   <label class="full">اسم المنصة<input name="name" value="${esc(s.name)}" required></label>
   <label class="full">العنوان الفرعي<input name="subtitle" value="${esc(s.subtitle)}"></label>
   <label>الشعار (PNG أو JPG)<input type="file" name="logo" accept="image/*"></label>
   <label>صورة خلفية الواجهة (للحاسوب، عريضة 1600×320)<input type="file" name="hero" accept="image/*"></label>
   <label>صورة الواجهة للهاتف (اختياري، 1600×560)<input type="file" name="heroM" accept="image/*"><span class="hint">تظهر شريطاً أعلى الترويسة على الهاتف. إن تركتها فارغة تُستعمل صورة الحاسوب.</span></label>
   <label>اللون الافتراضي للجميع<select name="palette">${PALETTES.map((p,i)=>`<option value="${i}" ${(s.palette||0)===i?'selected':''}>اللون ${i+1}</option>`).join('')}</select></label>
   <label>السمة الافتراضية<select name="theme"><option value="light">نهاري</option><option value="dark" ${s.theme==='dark'?'selected':''}>ليلي</option></select></label>
   <div class="full tools"><span class="muted">الشعار الحالي:</span><span style="width:54px;height:54px;display:inline-grid">${logoHTML()}</span>${s.logo?'<button type="button" class="btn sm" data-act="rmLogo">إزالة الشعار</button>':''}${s.hero?'<button type="button" class="btn sm" data-act="rmHero">إزالة الخلفية</button>':''}</div>
   <div class="factions"><button class="btn pri">حفظ</button></div></form></section>
  <section class="panel"><h3>التدريب</h3><form id="setProg" class="fgrid">
   <label class="full">اختصاص هذه المنصة<select name="spec">${[...new Set([...SPECS,s.spec||SPECS[0]])].map(x=>`<option ${x===(s.spec||SPECS[0])?'selected':''}>${esc(x)}</option>`).join('')}<option value="__other">اختصاص آخر (اكتبه في الحقل التالي)…</option></select></label>
   <label class="full">اسم اختصاص آخر (اختياري)<input name="specOther" placeholder="يُستعمل فقط إن اخترت «اختصاص آخر»"><span class="hint">الاختصاص يظهر في الترويسة والبطاقات، ويكون الافتراضي للطلاب الجدد. الرياضيات تبدأ مراحلها بالمحاور الأربعة، وبقية الاختصاصات تبدأ بمحاضرات دون محاور، وتضيف ما تشاء من داخل كل مرحلة.</span></label>
   <label class="full">رابط الواجهة الرئيسية (كل الاختصاصات)<input name="portal" dir="ltr" value="${esc(s.portal||'')}" placeholder="../olympiad/"><span class="hint">يفتحه سهم «كل الاختصاصات». اتركه فارغاً إن كان مستودع الواجهة اسمه olympiad في الحساب نفسه.</span></label>
   <label class="full">تاريخ بدء التدريب<input type="date" name="startDate" value="${esc(s.startDate)}" required><span class="hint">تُحسب منه فترات التقارير الربعية والنصفية والسنوية.</span></label>
   <div class="full note">المطوّر والمشرف العام: <b>${DEV_NAME}</b></div>
   <div class="factions"><button class="btn pri">حفظ</button></div></form></section></div>
  <section class="panel"><h3>البيانات والنسخ الاحتياطي</h3>
   <p class="muted">وضع التخزين: <b>${API.mode==='supabase'?'Supabase: البيانات على الخادم ومشتركة بين كل الأجهزة':'تجريبي: البيانات في متصفح هذا الجهاز فقط'}</b>.<br>النسخة الاحتياطية ملف ZIP فيه كل شيء: الجداول (JSON، وCSV يفتح في Excel)، والملفات المرفوعة${API.mode==='supabase'?'، و<b>الحسابات بكلمات مرورها المشفّرة</b>. عند نقل المنصة إلى خادم Supabase جديد: نفّذ schema.sql، وأنشئ حساب المطور، ثم استعد النسخة من هنا، فيعود كل شيء كما كان ويدخل الجميع بنفس كلمات مرورهم. ⚠️ احفظ الملف في مكان آمن':''}. خذ نسخة مرة في الشهر على الأقل.</p>
   <div class="tools"><button class="btn gold" data-act="backup">${ic('download')} نسخة احتياطية كاملة</button>
   <label class="btn">${ic('upload')} استعادة نسخة (ZIP)<input type="file" id="restore" accept=".zip" hidden></label>
   ${demoData?`<button class="btn danger" data-act="clearDemo">${ic('trash')} مسح البيانات التجريبية</button>`:`<button class="btn" data-act="loadDemo">تحميل بيانات تجريبية</button>`}
   ${API.mode==='demo'?`<button class="btn danger" data-act="resetAll">${ic('trash')} إعادة ضبط المنصة بالكامل</button>`:''}</div>
   ${API.mode==='supabase'?'<p class="muted" style="font-size:12.5px;margin-top:10px">البيانات التجريبية في وضع Supabase تُنشئ طلاباً ووظائف بلا حسابات دخول، لتجربة الشاشات والتقارير فقط.</p>':''}</section>`};

/* ================= forms / actions ================= */
function studentForm(s){const isNew=!s;s=s||{};const u=isNew?null:S.users.find(x=>x.studentId===s.id);
  formModal({title:isNew?'إضافة طالب':'تعديل بيانات الطالب',fields:[
    {name:'name',label:'الاسم الثلاثي',value:s.name,required:true,full:true},
    {name:'spec',label:'الاختصاص',value:s.spec||specName()},{name:'grade',label:'الصف',value:s.grade},
    {name:'school',label:'المدرسة',value:s.school},{name:'phone',label:'الهاتف',value:s.phone,ltr:true},
    {name:'joined',label:'تاريخ الانضمام',type:'date',value:s.joined||today()},{name:'examNo',label:'الرقم الامتحاني',value:s.examNo,ltr:true,hint:isNew?'اتركه فارغاً ليُولَّد تلقائياً':'يُدخله الطالب عند بدء كل اختبار'},{name:'photo',label:'الصورة',type:'file',accept:'image/*'},
    ...(isNew?[{name:'mk',label:'إنشاء حساب دخول تلقائياً (اسم مستخدم وكلمة سر)',type:'checkbox',value:true,full:true}]:[]),
    ...(u?[{type:'html',html:`<div class="full muted">حساب الطالب: <b dir="ltr">${esc(u.username)}</b>، وتُغيَّر كلمة سره من صفحة المستخدمين أو من بطاقته.</div>`}]:[])],
    onSubmit:async d=>{if(!d.examNo&&isNew)d.examNo=nextExamNos(1)[0];if(d.examNo&&S.students.some(x=>x.examNo===d.examNo&&x.id!==s.id)){toast('هذا الرقم الامتحاني مستخدم لطالب آخر','err');return false}const photo=d.photo&&d.photo[0]?await readImage(d.photo[0],180):null;const id=s.id||uid();
      await mutate(S=>{let x=S.students.find(q=>q.id===id);if(!x){x={id};S.students.push(x)}
        Object.assign(x,{name:d.name,spec:d.spec,grade:d.grade,school:d.school,phone:d.phone,joined:d.joined,examNo:d.examNo});if(photo)x.photo=photo;log((isNew?'أُضيف الطالب ':'عُدّلت بيانات ')+d.name)});
      if(isNew&&d.mk){try{await makeAccount(stuById(id));await reload();toast('أُضيف الطالب وحسابه ✓');credCard(id)}catch(e){toast('أُضيف الطالب، لكن تعذّر إنشاء الحساب: '+errMsg(e),'err')}return false}else toast('تم الحفظ')}})}
function taskForm(x){formModal({title:x?'تعديل الوظيفة':'وظيفة جديدة',wide:true,fields:[{name:'title',label:'العنوان',value:x&&x.title,required:true,full:true},{name:'type',label:'النوع',type:'select',options:TASK_TYPES,value:x&&x.type},{name:'due',label:'تاريخ الاستحقاق',type:'date',value:x?x.due:iso(addDays(new Date(),7)),required:true},{name:'desc',label:'التعليمات',type:'textarea',rows:4,value:x&&x.desc}],
  onSubmit:d=>{const id=x?x.id:uid();mutate(S=>{let t=S.tasks.find(q=>q.id===id);if(!t){t={id,created:today()};S.tasks.push(t)}Object.assign(t,d);log((x?'عُدّلت ':'أُسندت ')+'الوظيفة: '+d.title)})}});
  if(x)$('#modal .factions').insertAdjacentHTML('beforeend',`<button type="button" class="btn danger" style="margin-inline-start:auto" data-act="delTask" data-id="${x.id}">${ic('trash')} حذف</button>`)}
function sessionForm(x){const sel=x?(x.present||[]):S.students.map(s=>s.id);
  formModal({title:x?'تعديل الجلسة':'تسجيل جلسة',wide:true,fields:[{name:'date',label:'التاريخ',type:'date',value:x?x.date:today(),required:true},{name:'hours',label:'الساعات',type:'number',step:.5,min:0,value:x?x.hours:3},{name:'topic',label:'موضوع الجلسة',value:x&&x.topic,required:true,full:true},
   {type:'html',html:`<div class="full"><div class="muted" style="margin-bottom:6px">الحضور (أزل العلامة عن الغائب):</div><div class="tools">${S.students.map(s=>`<label class="chip" style="cursor:pointer"><input type="checkbox" class="pres" value="${s.id}" ${sel.includes(s.id)?'checked':''}> ${esc(s.name)}</label>`).join('')}</div></div>`}],
   onSubmit:(d,f)=>{const present=$$('.pres',f).filter(c=>c.checked).map(c=>c.value),id=x?x.id:uid();mutate(S=>{let q=S.sessions.find(z=>z.id===id);if(!q){q={id};S.sessions.push(q)}Object.assign(q,d,{present});log('سُجّلت جلسة: '+d.topic)})}});
  if(x)$('#modal .factions').insertAdjacentHTML('beforeend',`<button type="button" class="btn danger" style="margin-inline-start:auto" data-act="delSession" data-id="${x.id}">${ic('trash')} حذف</button>`)}
function submitForm(tid){const s=myStudent(),t=taskById(tid),prev=subOf(tid,s.id);
  formModal({title:'تسليم: '+t.title,fields:[{type:'html',html:t.desc?`<div class="full note">${esc(t.desc)}</div>`:''},{name:'files',label:'الملفات (PDF، صور، ملف مضغوط…)',type:'file',multiple:true,hint:(prev?'الملفات الجديدة تُضاف إلى ملفاتك السابقة. ':'')+'الحد 20MB لكل ملف، والصور تُضغط تلقائياً. للملفات الأكبر (فيديو مثلاً) ضع رابط Drive أو YouTube.'},{name:'link',label:'رابط (Drive مثلاً، اختياري)',value:prev&&prev.link,ltr:true,full:true},{name:'note',label:'ملاحظة للمرشد',type:'textarea',value:prev&&prev.note}],submit:'تسليم',
   onSubmit:async d=>{if(!d.files.length&&!d.link&&!prev){toast('أرفق ملفاً أو رابطاً','err');return false}
     const metas=[];for(let f of d.files){f=await compressForUpload(f);if(f.size>20*1048576){toast('الملف أكبر من 20 ميغابايت: '+f.name+'. ضعه كرابط.','err');return false}
       const fid=uid(),path=API.uid()+'/'+fid;try{await API.putFile(path,f)}catch(e){toast('تعذّر رفع '+f.name+': '+errMsg(e),'err');return false}metas.push({id:fid,path,name:f.name,size:f.size,type:f.type})}
     const id=prev?prev.id:uid();await mutate(S=>{let b=S.subs.find(q=>q.id===id);if(!b){b={id,taskId:tid,sid:s.id,files:[]};S.subs.push(b)}b.files=(b.files||[]).concat(metas);Object.assign(b,{date:today(),link:d.link,note:d.note,status:'submitted'});log(s.name+' سلّم: '+t.title)});toast('تم التسليم ✓')}})}
function reviewBox(id){const x=S.subs.find(q=>q.id===id);if(!x)return;const s=stuById(x.sid),t=taskById(x.taskId),gl=null,staff=isStaff();
  const b=modal(mhead('تسليم: '+esc(t?t.title:''))+`<div class="who" style="margin-bottom:10px">${avatar(s)}<div><b>${esc(s?s.name:'')}</b><div class="muted">سُلِّم في ${fmtD(x.date)} ${t&&x.date>t.due?'<span class="badge b-warn">بعد الموعد</span>':''} · ${subBadge(x)}</div></div></div>
   ${x.note?`<div class="note" style="margin-bottom:10px">${esc(x.note)}</div>`:''}
   <div class="files">${(x.files||[]).map(f=>`<div class="file">${ic('file')}<span>${esc(f.name)}</span><small class="muted">${fsize(f.size)}</small><button class="btn sm" data-act="dl" data-path="${esc(f.path||f.id)}" data-name="${esc(f.name)}">${ic('download')} تنزيل</button></div>`).join('')}${x.link?`<div class="file">🔗<span><a href="${esc(/^https?:\/\//.test(x.link)?x.link:'https://'+x.link)}" target="_blank" rel="noopener" dir="ltr">${esc(x.link)}</a></span></div>`:''}${!(x.files||[]).length&&!x.link?'<div class="muted">لا ملفات</div>':''}</div>
   ${staff?`<form class="fgrid" style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px"><label>العلامة (من 100)<input type="number" name="score" min="0" max="100" value="${x.score??''}"></label><label>القرار<select name="status"><option value="graded">قبول وتقييم</option><option value="returned" ${x.status==='returned'?'selected':''}>إعادة للتعديل</option></select></label><label class="full">ملاحظات للطالب<textarea name="feedback" rows="3">${esc(x.feedback||'')}</textarea></label>${gl?`<label class="ck full"><input type="checkbox" name="apply" checked> تحديث إنجاز الهدف «${esc(gl.g.title)}» ليصبح العلامة إن كانت أعلى من الحالي</label>`:''}<div class="factions"><button class="btn pri">حفظ التقييم</button><button type="button" class="btn" data-close>إغلاق</button></div></form>`:(x.feedback?`<h3>ملاحظات المدرّب</h3><div class="note">${esc(x.feedback)}</div>`:'')}`);
  const f=$('form',b);if(f)f.onsubmit=e=>{e.preventDefault();const fd=new FormData(f),sc=fd.get('score')===''?null:clamp(+fd.get('score')),stt=fd.get('status'),fb=String(fd.get('feedback')||''),ap=fd.get('apply')==='on';
    if(stt==='graded'&&sc==null){toast('أدخل العلامة','err');return}closeModal();
    mutate(S=>{const q=S.subs.find(z=>z.id===id);Object.assign(q,{score:sc,status:stt,feedback:fb});if(ap&&stt==='graded'&&gl){const st=S.students.find(z=>z.id===q.sid);st.progress=st.progress||{};const cur=+(st.progress[gl.g.id]||0);if(sc>cur){st.progress[gl.g.id]=sc;S.history.push({id:uid(),sid:st.id,gid:gl.g.id,date:today(),value:sc})}}log('قُيِّم تسليم '+(s?s.name:'')+(sc!=null?': '+sc+'%':''))});toast('تم الحفظ')}}
function userForm(u){const studs=[['','—'],...S.students.map(s=>[s.id,s.name])];
  formModal({title:u?'تعديل المستخدم':'مستخدم جديد',fields:[{name:'name',label:'الاسم',value:u&&u.name,required:true},{name:'username',label:'اسم المستخدم (إنجليزي)',value:u&&u.username,required:true,ltr:true,ac:'off'},{name:'role',label:'الدور',type:'select',options:isDev()?[['admin','مشرف'],['student','طالب'],['dev','مطور']]:[['student','طالب']],value:u?(u.role==='mentor'?'admin':u.role):(isDev()?'admin':'student')},{name:'studentId',label:'الطالب المرتبط (لحساب الطالب)',type:'select',options:studs,value:u&&u.studentId},{name:'password',label:u?'كلمة مرور جديدة (اتركها فارغة للإبقاء)':'كلمة المرور (6 أحرف على الأقل)',ltr:true,required:!u,full:true,ac:'new-password'}],
   onSubmit:async d=>{if(d.role==='student'&&!d.studentId){toast('اختر الطالب المرتبط بالحساب','err');return false}
     if(u)await API.updateUser(u.id,{name:d.name,username:d.username,role:d.role,studentId:d.role==='student'?d.studentId:'',password:d.password||undefined});
     else await API.createUser({username:d.username,password:d.password,name:d.name,role:d.role,studentId:d.studentId});
     if(d.role==='student'&&d.studentId){const old=credOf(d.studentId);if(d.password||old)try{await API.saveCred(d.studentId,d.username.trim().toLowerCase(),d.password||(old?old.password:''))}catch(e){console.error(e)}}
     await reload();toast('تم الحفظ ✓')}})}
function myPw(){formModal({title:'تغيير كلمة المرور',fields:[{name:'old',label:'كلمة المرور الحالية',type:'password',required:true,full:true,ac:'current-password'},{name:'n1',label:'كلمة المرور الجديدة',type:'password',required:true,ac:'new-password'},{name:'n2',label:'تأكيدها',type:'password',required:true,ac:'new-password'}],
  onSubmit:async d=>{if(d.n1!==d.n2){toast('كلمتا المرور غير متطابقتين','err');return false}await API.changePassword(d.old,d.n1);if(ME.mustChange){ME.mustChange=false}if(API.mode==='demo')S=normalize(await API.loadAll()),ME=S.users.find(u=>u.id===ME.id)||ME;render();toast('تم تغيير كلمة المرور ✓')}})}
function taskInfo(id){const x=taskById(id),ss=S.students;
  modal(mhead(esc(x.title))+`<div class="muted">${esc(x.type)} · الاستحقاق ${fmtD(x.due)}</div>${x.desc?`<div class="note" style="margin:10px 0">${esc(x.desc)}</div>`:''}<div class="tw"><table><thead><tr><th>الطالب</th><th>الحالة</th><th></th></tr></thead><tbody>${ss.map(s=>{const b=subOf(x.id,s.id);return `<tr><td>${esc(s.name)}</td><td>${subBadge(b)}</td><td>${b?`<button class="btn sm" data-act="review" data-id="${b.id}">مراجعة</button>`:''}</td></tr>`}).join('')}</tbody></table></div><div class="factions" style="margin-top:12px"><button class="btn" data-act="editTask" data-id="${x.id}">${ic('edit')} تعديل</button></div>`,true)}
async function backup(){try{toast('جارٍ تجهيز النسخة الاحتياطية…');const JSZip=await loadJSZip();const zip=new JSZip();const st=snap();
  zip.file('data.json',JSON.stringify({app:'olymp-platform',version:2,date:new Date().toISOString(),mode:API.mode,state:st},null,1));
  const flat=x=>{const o={};for(const[k,v]of Object.entries(x))o[k]=v;return o};
  ['students','tasks','subs','sessions','notes','history','surveys','responses','participation','users','activity','tracks'].forEach(k=>{const arr=(st[k]||[]).map(x=>{const o=flat(x);delete o.salt;delete o.hash;delete o.photo;return o});const keys=[...new Set(arr.flatMap(o=>Object.keys(o)))];zip.file(`csv/${k}.csv`,toCSV([keys,...arr.map(o=>keys.map(k2=>o[k2]))]))});
  let n=0;for(const x of st.subs)for(const f of (x.files||[])){try{const b=await API.getFile(f.path||f.id);if(b){zip.file('files/'+(f.path||f.id),b);n++}}catch(e){}}
  const blob=await zip.generateAsync({type:'blob'});download(blob,`نسخة-احتياطية-${today()}.zip`);toast(`تم: البيانات و${n} ملفاً ✓`)}catch(e){toast(errMsg(e),'err')}}
async function restore(file){try{const JSZip=await loadJSZip();const zip=await JSZip.loadAsync(file);const j=JSON.parse(await zip.file('data.json').async('string'));if(!j.state)throw 0;
  confirmBox('ستُستبدل كل البيانات الحالية بمحتوى النسخة الاحتياطية. هل أنت متأكد؟',async()=>{const files=Object.keys(zip.files).filter(p=>p.startsWith('files/')&&!zip.files[p].dir);for(const p of files)await API.putFile(p.slice(6),await zip.file(p).async('blob'));
   S=normalize(j.state);if(!S.users.length)S.users=blankState(true).users;await API.commit(null,S);const me=S.users.find(u=>u.id===ME.id);if(!me){await API.logout();ME=null}else ME=me;render();toast('تمت الاستعادة ✓')},'استعادة')}catch(e){toast('الملف ليس نسخة احتياطية صالحة','err')}}

/* ================= الإشعارات ================= */
function notifVisibleToStudent(n){const s=myStudent();return n.target==='all'||(n.target==='student'&&s&&n.sid===s.id)}
function myNotifs(){if(!ME)return[];return S.notifications.filter(n=>isStaff()?n.target==='staff':notifVisibleToStudent(n))}
function isRead(id){return S.reads.some(r=>r.nid===id&&r.userId===ME.id)}
function unreadCount(){return ME?myNotifs().filter(n=>!isRead(n.id)).length:0}
const targetLabel=n=>n.target==='all'?'كل الطلاب':n.target==='staff'?'المشرفون':'الطالب: '+esc((stuById(n.sid)||{}).name||'—');
function audienceUsers(n){if(n.target==='staff')return S.users.filter(u=>u.role!=='student');return S.users.filter(u=>{if(u.role!=='student')return false;const s=stuById(u.studentId);if(!s)return false;return n.target==='all'||(n.target==='student'&&s.id===n.sid)})}
async function markRead(ids){ids=ids.filter(id=>!isRead(id));if(!ids.length)return;const at=new Date().toISOString();ids.forEach(nid=>S.reads.push({nid,userId:ME.id,at}));render();try{await API.markRead(ids)}catch(e){console.error(e)}}
VIEWS.inbox=()=>{const tab=isStaff()?(UI.inTab||'sent'):'in';const list=tab==='in'?myNotifs():[...S.notifications].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));const un=myNotifs().filter(n=>!isRead(n.id));
  return `<div class="pagehead"><div><h2>الإشعارات</h2><div class="sub">${un.length?un.length+' غير مقروء':'لا إشعارات جديدة'}</div></div><div class="tools noprint">${isStaff()?`<div class="seg2"><button class="btn sm ${tab==='sent'?'pri':''}" data-act="inTab" data-v="sent">المرسلة</button><button class="btn sm ${tab==='in'?'pri':''}" data-act="inTab" data-v="in">الواردة${un.length?` (${un.length})`:''}</button></div><button class="btn gold" data-act="sendNotif">${ic('send')} إرسال إشعار / تعميم</button>`:''}${un.length?`<button class="btn" data-act="readAll">${ic('check')} تحديد الكل كمقروء</button>`:''}</div></div>
  <section class="panel">${list.map(n=>{const unr=tab==='in'&&!isRead(n.id);const aud=tab==='sent'?audienceUsers(n):[];const rd=tab==='sent'?aud.filter(u=>S.reads.some(r=>r.nid===n.id&&r.userId===u.id)).length:0;
    return `<div class="notif ${unr?'unread':''}" data-act="openNotif" data-id="${n.id}"><div class="nh">${unr?'<i class="dot"></i>':''}<b>${esc(n.title)}</b><small class="muted">${ago(n.createdAt)}</small></div><div class="nb">${esc(n.body).replace(/\n/g,'<br>')}</div>${tab==='sent'?`<div class="muted" style="font-size:12.5px;margin-top:6px">إلى: ${targetLabel(n)} · قرأه ${rd} من ${aud.length} <button class="btn sm danger noprint" data-act="delNotif" data-id="${n.id}" style="margin-inline-start:8px">${ic('trash')}</button></div>`:''}</div>`}).join('')||'<div class="empty">لا إشعارات</div>'}</section>`};
function sendNotifForm(pre={}){formModal({title:'إرسال إشعار / تعميم',fields:[{name:'title',label:'العنوان',required:true,full:true,value:pre.title},{name:'body',label:'النص',type:'textarea',rows:5,value:pre.body},
  {name:'target',label:'إلى',type:'select',options:[['all','كل الطلاب'],['student','طالب محدد'],['staff','المشرفون']],value:pre.target||'all'},
  {name:'sid',label:'الطالب (عند اختيار طالب محدد)',type:'select',options:S.students.map(s=>[s.id,s.name]),value:pre.sid,full:true}],submit:'إرسال',
  onSubmit:d=>{const n={id:uid(),title:d.title,body:d.body,target:d.target,trackId:'',sid:d.target==='student'?d.sid:'',createdAt:new Date().toISOString(),createdBy:ME.id};
    mutate(S=>{S.notifications.unshift(n);log('أُرسل إشعار: '+d.title)});toast('أُرسل الإشعار ✓')}})}

/* ================= الاختبارات ================= */
const timerLabel=e=>e.timerMode==='total'?`${e.totalMinutes||0} دقيقة للاختبار`:e.timerMode==='perQuestion'?`${e.perQuestionSec||60} ثانية لكل سؤال`:'بدون مؤقت';
const fmtDur=s=>{if(s==null)return'—';s=Math.max(0,Math.round(s));const m=Math.floor(s/60),x=s%60;return m?`${m} د ${x} ث`:`${x} ث`};
const fN=x=>x==null?'—':Number.isInteger(+x)?String(+x):(+x).toFixed(1);
const pctOf=a=>a&&a.max?Math.round(a.score*100/a.max):0;
const examTargets=e=>S.students;
const LET=['أ','ب','ج','د','هـ','و','ز','ح'];
const toLocalInput=v=>{if(!v)return'';const d=new Date(v);if(isNaN(d))return'';return iso(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
VIEWS.exams=()=>{ROUTE='lectures';return VIEWS.lectures()};
function examsView(stage){
  if(ME.role==='student'){if(!UI.myEx){UI.myEx='loading';API.listMyExams().then(x=>{UI.myEx=x||[];render()}).catch(e=>{UI.myEx=[];toast(errMsg(e),'err');render()})}
    if(UI.myEx==='loading')return '<div class="loading">جارٍ تحميل الاختبارات…</div>';const s=myStudent(),myEx=UI.myEx.filter(e=>String(e.stage||'')===String(stage));
    return `<div class="ph"><h3>الاختبارات التجريبية</h3><span class="muted">${s&&s.examNo?'تحتاج رقمك الامتحاني عند بدء كل اختبار':'لم يُحدَّد لك رقم امتحاني بعد، راجع المشرف'}</span></div>
    <div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">${myEx.map(e=>{const a=e.attempt,done=a&&a.status==='submitted',p=done?pctOf(a):0,pass=e.passMark==null||p>=e.passMark;
      return `<div class="svcard"><div class="ph" style="margin:0"><h3>${esc(e.title)}</h3>${done?`<span class="badge ${pass?'b-ok':'b-bad'}">${p}%</span>`:a?'<span class="badge b-warn">لم يكتمل</span>':e.status==='open'?'<span class="badge b-info">متاح</span>':'<span class="badge b-mut">مغلق</span>'}</div>${e.desc?`<div class="muted">${esc(e.desc)}</div>`:''}
      <div class="muted">${e.count} سؤالاً · ${ic('clock','ii')} ${timerLabel(e)}${e.openTo?' · حتى '+fmtD(e.openTo):''}</div>
      ${done?`<div class="muted">العلامة ${fN(a.score)} من ${fN(a.max)} · المدة ${fmtDur(a.duration)}</div><button class="btn" data-act="myResult" data-id="${a.id}" style="align-self:flex-start">عرض النتيجة</button>`:(e.status==='open'||a)?`<button class="btn gold" data-act="startExam" data-id="${e.id}" style="align-self:flex-start">${a?'متابعة الاختبار':'ابدأ الاختبار'}</button>`:''}</div>`}).join('')||'<div class="empty">لا اختبارات حالياً</div>'}</div>`}
  const list=S.exams.filter(e=>String(e.stage||'')===String(stage)).sort((a,b)=>String(b.created||'').localeCompare(String(a.created||'')));
  const stB=e=>e.status==='open'?'<span class="badge b-ok">مفتوح</span>':e.status==='closed'?'<span class="badge b-mut">مغلق</span>':'<span class="badge b-warn">مسودة</span>';
  return `<div class="ph"><div><h3>الاختبارات التجريبية</h3><span class="muted">أنشئ اختباراً أو استورد أسئلته من ملف HTML أو PDF، وتابع العلامات</span></div><div class="tools noprint"><button class="btn" data-act="allMarksCsv">${ic('download')} تصدير كل العلامات</button><button class="btn pri" data-act="newExam" data-stage="${stage}">${ic('plus')} اختبار جديد</button></div></div>
  <section class="panel"><div class="tw"><table><thead><tr><th>الاختبار</th><th>المؤقت</th><th>الحالة</th><th>قدّمه</th><th>المتوسط</th><th></th></tr></thead><tbody>
  ${list.map(e=>{const done=S.attempts.filter(a=>a.examId===e.id&&a.status==='submitted'),tg=examTargets(e).length,av=done.length?Math.round(done.reduce((x,a)=>x+pctOf(a),0)/done.length):null;
   return `<tr class="click" data-go="exam:${e.id}"><td><b>${esc(e.title)}</b><br><small class="muted">${(e.questions||[]).length} سؤالاً</small></td><td>${timerLabel(e)}</td><td>${stB(e)}</td><td>${pbar(tg?Math.round(done.length*100/tg):0)} <small class="muted">${done.length}/${tg}</small></td><td>${av==null?'—':av+'%'}</td><td class="tools noprint">${e.status!=='open'?`<button class="btn sm gold" data-act="exStatus" data-id="${e.id}" data-v="open">نشر</button>`:`<button class="btn sm" data-act="exStatus" data-id="${e.id}" data-v="closed">إغلاق</button>`}<button class="btn sm" data-act="editExam" data-id="${e.id}">${ic('edit')}</button><button class="btn sm" data-act="dupExam" data-id="${e.id}" title="نسخ">${ic('copy')}</button><button class="btn sm danger" data-act="delExam" data-id="${e.id}">${ic('trash')}</button></td></tr>`}).join('')}
  </tbody></table></div>${list.length?'':'<div class="empty">لا اختبارات بعد. أنشئ اختباراً واستورد أسئلته من ملف HTML (بصيغة const QUESTIONS) أو PDF.</div>'}</section>`};

function examEditor(ex){const draft=JSON.parse(JSON.stringify(ex));const hasAtt=S.attempts.some(a=>a.examId===ex.id);
  const box=modal(mhead(ex._new?'اختبار جديد':'تعديل الاختبار')+`${hasAtt?'<div class="banner">⚠️ قدّم بعض الطلاب هذا الاختبار. تعديل الإجابات الصحيحة لا يعيد تصحيح المحاولات السابقة.</div>':''}
  <div class="fgrid"><label class="full">عنوان الاختبار<input id="exT" value="${esc(draft.title)}" placeholder="مثلاً: اختبار تجريبي 1"></label>
  <label class="full">تعليمات للطالب (اختياري)<textarea id="exD" rows="2">${esc(draft.desc||'')}</textarea></label>
  <label>المرحلة<select id="exTr">${S.stages.map(g=>`<option value="${g.id}" ${String(draft.stage||'1')===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></label>
  <label>المؤقت<select id="exTm"><option value="none" ${draft.timerMode==='none'?'selected':''}>بدون مؤقت</option><option value="total" ${draft.timerMode==='total'?'selected':''}>مؤقت عام: ينتهي الاختبار بانتهائه</option><option value="perQuestion" ${draft.timerMode==='perQuestion'?'selected':''}>مؤقت لكل سؤال</option></select></label>
  <label>مدة الاختبار (دقائق)<input type="number" id="exMin" min="1" value="${esc(draft.totalMinutes??30)}"></label>
  <label>وقت السؤال الافتراضي (ثوانٍ)<input type="number" id="exSec" min="5" value="${esc(draft.perQuestionSec??60)}"></label>
  <label>علامة النجاح (%)<input type="number" id="exPass" min="0" max="100" value="${esc(draft.passMark??50)}"></label>
  <label>الحالة<select id="exSt"><option value="draft" ${draft.status==='draft'?'selected':''}>مسودة</option><option value="open" ${draft.status==='open'?'selected':''}>منشور (مفتوح)</option><option value="closed" ${draft.status==='closed'?'selected':''}>مغلق</option></select></label>
  <label>متاح من (اختياري)<input type="datetime-local" id="exFrom" value="${toLocalInput(draft.openFrom)}"></label>
  <label>متاح حتى (اختياري)<input type="datetime-local" id="exTo" value="${toLocalInput(draft.openTo)}"></label>
  <label class="ck"><input type="checkbox" id="exShow" ${draft.showAnswers!==false?'checked':''}> إظهار الإجابات الصحيحة للطالب بعد التسليم</label>
  <label class="ck"><input type="checkbox" id="exShuf" ${draft.shuffle?'checked':''}> خلط ترتيب الأسئلة والخيارات</label>
  <label class="ck full"><input type="checkbox" id="exNotify" ${ex._new?'checked':''}> إرسال إشعار للطلاب عند النشر</label></div>
  <div class="ph" style="margin-top:16px"><h3 style="margin:0">الأسئلة <span class="muted" id="qcount"></span></h3><div class="tools"><label class="btn gold">${ic('upload')} استيراد من ملف (HTML / PDF / TXT)<input type="file" id="exImp" accept=".html,.htm,.pdf,.txt,.json" hidden></label><button class="btn" data-xpaste>لصق نص</button><button class="btn" data-xadd>${ic('plus')} سؤال</button></div></div>
  <div id="xpaste" style="display:none" class="panel"><div class="muted" style="margin-bottom:6px">الصق الأسئلة بهذا الشكل: سؤال يبدأ برقم، وخيارات تبدأ بحروف، والإجابة الصحيحة بعلامة * أو بسطر «الإجابة: ب».</div><textarea id="xpt" rows="8" placeholder="1. ما ناتج 2 + 3؟&#10;أ) 4&#10;ب) 5 *&#10;ج) 6&#10;&#10;2. ...&#10;الإجابة: ج"></textarea><div class="tools" style="margin-top:8px"><button class="btn pri" data-xparse>تحويل إلى أسئلة</button></div></div>
  <div id="xq"></div>
  <div class="factions" style="margin-top:16px"><button class="btn pri" data-xsave>حفظ الاختبار</button><button class="btn" data-close>إلغاء</button></div>`,true);
  const renderQ=()=>{$('#qcount',box).textContent=`(${draft.questions.length})`;const miss=draft.questions.filter(q=>q.correct==null).length;
    $('#xq',box).innerHTML=(miss?`<div class="banner">⚠️ ${miss} سؤالاً بلا إجابة صحيحة محددة. حدّدها قبل الحفظ (مُعلَّمة بالأصفر).</div>`:'')+draft.questions.map((q,i)=>`<div class="qb-item ${q.correct==null?'warnq':''}"><div class="qhead"><b>${i+1}</b><textarea data-qi="${i}" data-k="text" rows="2" style="flex:1;min-width:220px" placeholder="نص السؤال (يُسمح بتنسيق HTML)">${esc(q.text)}</textarea>
      <button class="icon-btn" data-xmv="${i}" data-d="-1" title="لأعلى">${ic('up')}</button><button class="icon-btn" data-xmv="${i}" data-d="1" title="لأسفل">${ic('down')}</button><button class="icon-btn" data-xdel="${i}" title="حذف">${ic('trash')}</button></div>
      <div class="xgrid"><label>الخيارات (خيار في كل سطر)<textarea data-qi="${i}" data-k="options" rows="${Math.max(3,(q.options||[]).length)}">${esc((q.options||[]).join('\n'))}</textarea></label>
      <div class="xside"><label>الإجابة الصحيحة<select data-qi="${i}" data-k="correct"><option value="">— اختر —</option>${(q.options||[]).map((o,k)=>`<option value="${k}" ${q.correct===k?'selected':''}>${LET[k]||k+1}) ${esc(String(o).replace(/<[^>]*>/g,'').slice(0,40))}</option>`).join('')}</select></label>
      <div style="display:flex;gap:8px"><label>العلامة<input type="number" data-qi="${i}" data-k="points" min="0" step="0.5" value="${esc(q.points??1)}" style="width:80px"></label><label>ثوانٍ (اختياري)<input type="number" data-qi="${i}" data-k="sec" min="5" value="${esc(q.sec??'')}" style="width:90px" placeholder="افتراضي"></label></div>
      <label>الشرح بعد التسليم (اختياري)<input data-qi="${i}" data-k="explanation" value="${esc(q.explanation||'')}"></label></div></div></div>`).join('')};
  renderQ();
  const addQs=(qs,src)=>{draft.questions.push(...qs);renderQ();const miss=qs.filter(q=>q.correct==null).length;toast(`استُورد ${qs.length} سؤالاً من ${src}${miss?` · ${miss} بلا إجابة صحيحة`:''}`)};
  $('#exImp',box).onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{toast('جارٍ قراءة الملف…');const r=await importFile(f);addQs(r.questions,r.source);r.warnings.forEach(w=>setTimeout(()=>toast(w),3300))}catch(err){toast(errMsg(err),'err')}};
  box.addEventListener('input',e=>{const el=e.target;if(el.dataset.qi==null)return;const q=draft.questions[+el.dataset.qi],k=el.dataset.k;
    if(k==='text'||k==='explanation')q[k]=el.value;else if(k==='points')q.points=el.value===''?1:+el.value;else if(k==='sec')q.sec=el.value===''?null:+el.value;
    else if(k==='options'){q.options=el.value.split('\n').map(x=>x.trim()).filter(Boolean);if(q.correct!=null&&q.correct>=q.options.length)q.correct=null;const sel=el.closest('.qb-item').querySelector('select[data-k=correct]');sel.innerHTML='<option value="">— اختر —</option>'+q.options.map((o,k2)=>`<option value="${k2}" ${q.correct===k2?'selected':''}>${LET[k2]||k2+1}) ${esc(o.replace(/<[^>]*>/g,'').slice(0,40))}</option>`).join('')}});
  box.addEventListener('change',e=>{const el=e.target;if(el.dataset.k==='correct'){const q=draft.questions[+el.dataset.qi];q.correct=el.value===''?null:+el.value;el.closest('.qb-item').classList.toggle('warnq',q.correct==null)}});
  box.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-xadd')){draft.questions.push({id:uid(),text:'',options:['',''].filter(Boolean),correct:null,points:1,sec:null,explanation:''});renderQ();const t=$$('#xq textarea[data-k=text]',box);t[t.length-1].focus();return}
    if(b.hasAttribute('data-xpaste')){const p=$('#xpaste',box);p.style.display=p.style.display==='none'?'block':'none';return}
    if(b.hasAttribute('data-xparse')){const qs=parseText($('#xpt',box).value);if(!qs.length){toast('لم أتعرف على أسئلة. تأكد من الترقيم والحروف.','err');return}addQs(qs,'النص الملصق');$('#xpt',box).value='';$('#xpaste',box).style.display='none';return}
    if(b.dataset.xdel!=null){draft.questions.splice(+b.dataset.xdel,1);renderQ();return}
    if(b.dataset.xmv!=null){const i=+b.dataset.xmv,j=i+ +b.dataset.d;if(j<0||j>=draft.questions.length)return;[draft.questions[i],draft.questions[j]]=[draft.questions[j],draft.questions[i]];renderQ();return}
    if(b.hasAttribute('data-xsave')){const g=id=>$(id,box);const wasOpen=ex.status==='open';
      Object.assign(draft,{title:g('#exT').value.trim(),desc:g('#exD').value.trim(),trackId:'',stage:g('#exTr').value,timerMode:g('#exTm').value,totalMinutes:+g('#exMin').value||30,perQuestionSec:+g('#exSec').value||60,passMark:g('#exPass').value===''?null:+g('#exPass').value,status:g('#exSt').value,openFrom:g('#exFrom').value?new Date(g('#exFrom').value).toISOString():null,openTo:g('#exTo').value?new Date(g('#exTo').value).toISOString():null,showAnswers:g('#exShow').checked,shuffle:g('#exShuf').checked});
      if(!draft.title){toast('اكتب عنوان الاختبار','err');return}if(!draft.questions.length){toast('أضف سؤالاً واحداً على الأقل','err');return}
      const bad=draft.questions.findIndex(q=>!String(q.text).trim()||(q.options||[]).length<2||q.correct==null);if(bad>=0){toast(`السؤال ${bad+1}: يحتاج نصاً وخيارين على الأقل وإجابة صحيحة`,'err');return}
      const notify=g('#exNotify').checked&&draft.status==='open'&&!wasOpen;const isNew=draft._new;delete draft._new;closeModal();
      mutate(S=>{const i=S.exams.findIndex(x=>x.id===draft.id);if(i>=0)S.exams[i]=draft;else S.exams.push(draft);log((isNew?'أُنشئ':'عُدّل')+' الاختبار: '+draft.title);
        if(notify)S.notifications.unshift({id:uid(),title:'اختبار جديد: '+draft.title,body:`${draft.questions.length} سؤالاً · ${timerLabel(draft)}${draft.openTo?' · متاح حتى '+fmtD(draft.openTo):''}. ادخل إلى «المحاضرات العلمية» ← ${(stageById(draft.stage)||{}).name||''} ← «اختبارات تجريبية» وجهّز رقمك الامتحاني.`,target:'all',trackId:'',sid:'',createdAt:new Date().toISOString(),createdBy:ME.id})});go('exam:'+draft.id)}});
}
// تفاصيل النتيجة (مشتركة بين الطالب والمشرف)
function resultHTML(r,who){const p=r.max?Math.round(r.score*100/r.max):0,pass=r.passMark==null||p>=r.passMark;const ok=r.questions.filter(q=>q.ok).length;
  return `<div class="rhead"><div class="lg">${logoHTML()}</div><div style="flex:1"><h2>نتيجة: ${esc(r.title)}</h2><div class="muted">${who?esc(who)+' · ':''}${r.finished_at?fmtD(r.finished_at):''}${r.late?' · <span class="badge b-warn">تجاوز الوقت</span>':''}</div></div>${ring(p,pass?'#2f855a':'#c0392b',true)}</div>
  <div class="stats3"><div>العلامة<b><span dir="ltr">${fN(r.score)} / ${fN(r.max)}</span></b></div><div>النسبة<b>${p}%</b></div><div>${pass?'✅':'❌'} النتيجة<b>${r.passMark==null?'—':pass?'ناجح':'لم ينجح'}</b></div><div>الإجابات الصحيحة<b>${ok} من ${r.questions.length}</b></div><div>${ic('clock','ii')} المدة<b>${fmtDur(r.duration)}</b></div></div>
  ${r.showAnswers?`<h3>مراجعة الإجابات</h3>${r.questions.map((q,i)=>`<div class="rq ${q.ok?'ok':q.chosen==null?'skip':'bad'}"><div class="rqh"><b>${i+1}.</b> <span class="qt">${sanitize(q.text)}</span><span class="badge ${q.ok?'b-ok':q.chosen==null?'b-mut':'b-bad'}">${q.ok?'✓ صحيحة':q.chosen==null?'لم يُجب':'✗ خاطئة'}</span></div>
    <div class="ropts">${q.options.map((o,k)=>`<div class="ro ${k===q.correct?'c':''} ${k===q.chosen&&!q.ok?'w':''}"><span class="lt">${LET[k]||k+1}</span><span>${sanitize(o)}</span>${k===q.correct?'<small>الإجابة الصحيحة</small>':k===q.chosen?'<small>إجابتك</small>':''}</div>`).join('')}</div>
    ${q.explanation?`<div class="note" style="margin-top:6px">💡 ${sanitize(q.explanation)}</div>`:''}${q.time!=null?`<small class="muted">الوقت: ${fmtDur(q.time)}</small>`:''}</div>`).join('')}`:'<div class="note">لا يعرض هذا الاختبار الإجابات الصحيحة بعد التسليم.</div>'}`}
VIEWS.exam=id=>{if(!isStaff())return '';const e=S.exams.find(x=>x.id===id);if(!e)return '<div class="panel">الاختبار غير موجود</div>';
  const atts=S.attempts.filter(a=>a.examId===id),done=atts.filter(a=>a.status==='submitted'),prog=atts.filter(a=>a.status!=='submitted'),tg=examTargets(e);
  const dir=UI.exSort||'asc';const rows=[...done].sort((a,b)=>dir==='asc'?pctOf(a)-pctOf(b)||(a.duration-b.duration):pctOf(b)-pctOf(a)||(a.duration-b.duration));
  const ps=done.map(pctOf),avg=ps.length?Math.round(ps.reduce((a,b)=>a+b,0)/ps.length):null,passN=e.passMark==null?null:ps.filter(p=>p>=e.passMark).length,avgD=done.length?Math.round(done.reduce((a,x)=>a+(x.duration||0),0)/done.length):null;
  const notStarted=tg.filter(s=>!atts.some(a=>a.sid===s.id));
  chart('cEx',cv=>bars3D(cv,rows.map(a=>({label:(stuById(a.sid)||{name:'—'}).name.split(' ')[0],value:pctOf(a),color:e.passMark!=null&&pctOf(a)<e.passMark?'#c0392b':'#2f855a'})),{rot:rows.length>8,height:280}));
  const qstat=(e.questions||[]).map((q,i)=>{const n=done.filter(a=>a.answers[q.id]!=null).length,c=done.filter(a=>String(a.answers[q.id])===String(q.correct)).length;return{i,q,p:done.length?Math.round(c*100/done.length):0,n}});
  chart('cExQ',cv=>bars3D(cv,qstat.map(x=>({label:'س'+(x.i+1),value:x.p,color:x.p<40?'#c0392b':x.p<70?'#b98a3e':'#2f855a'})),{height:240}));
  const hard=[...qstat].sort((a,b)=>a.p-b.p).slice(0,3).filter(x=>done.length&&x.p<60);
  return `<div class="pagehead noprint"><div class="tools"><a class="btn" href="#lectures:${e.stage||1}:exams">→ ${esc((stageById(e.stage)||{}).name||'المحاضرات')}</a></div><div class="tools"><button class="btn" data-act="editExam" data-id="${id}">${ic('edit')} تعديل</button><button class="btn" data-act="exCsv" data-id="${id}">${ic('download')} تصدير العلامات</button><button class="btn gold" data-act="print">${ic('print')} طباعة / PDF</button></div></div>
  <section class="panel"><div class="rhead"><div class="lg">${logoHTML()}</div><div style="flex:1"><h2>${esc(e.title)}</h2><div class="muted">${(e.questions||[]).length} سؤالاً · ${timerLabel(e)} · ${esc((stageById(e.stage)||{}).name||'')}${e.passMark!=null?' · النجاح من '+e.passMark+'%':''}</div></div><div class="muted" style="text-align:left">تاريخ الإصدار<br>${fmtD(today())}</div></div>
  <div class="kpis">${kpi(tg.length?Math.round(done.length*100/tg.length):0,'قدّموا الاختبار',`${done.length} من ${tg.length}`)}${kpi(avg,'متوسط العلامات','','var(--gold)')}${kpi(ps.length?Math.max(...ps):null,'أعلى علامة','','#2f855a')}${kpi(ps.length?Math.min(...ps):null,'أدنى علامة','','#c0392b')}${passN!=null?kpi(done.length?Math.round(passN*100/done.length):null,'نسبة النجاح',`${passN} ناجحاً`,'#2b6cb0'):''}${kpi(null,'متوسط المدة','','#6b4bb0',avgD==null?'—':Math.round(avgD/60)+'د')}</div>
  ${done.length?`<div class="grid2e"><div><h3>علامات الطلاب (مرتبة)</h3><div class="cwrap"><canvas id="cEx"></canvas></div></div><div><h3>نسبة الإجابة الصحيحة لكل سؤال</h3><div class="cwrap"><canvas id="cExQ"></canvas></div>${hard.length?`<div class="insights" style="margin-top:8px">${hard.map(x=>`<div class="w">⚠️ <span>السؤال ${x.i+1} صعب: أجاب عنه صحيحاً ${x.p}% فقط. قد يحتاج الموضوع شرحاً إضافياً.</span></div>`).join('')}</div>`:''}</div></div>`:''}</section>
  <section class="panel"><div class="ph"><h3>قائمة العلامات</h3><div class="tools noprint"><span class="muted">الترتيب:</span><button class="btn sm ${dir==='asc'?'pri':''}" data-act="exSort" data-v="asc">تصاعدي ↑</button><button class="btn sm ${dir==='desc'?'pri':''}" data-act="exSort" data-v="desc">تنازلي ↓</button></div></div>
  <div class="tw"><table><thead><tr><th>#</th><th>الطالب</th><th>الرقم الامتحاني</th><th>العلامة</th><th>النسبة</th><th>النتيجة</th><th>المدة</th><th>التسليم</th><th class="noprint"></th></tr></thead><tbody>
  ${rows.map((a,i)=>{const s=stuById(a.sid),p=pctOf(a),pass=e.passMark==null||p>=e.passMark;return `<tr><td>${i+1}</td><td><b>${esc(s?s.name:'—')}</b></td><td dir="ltr" style="text-align:right">${esc(s?s.examNo:'')}</td><td><span dir="ltr">${fN(a.score)} / ${fN(a.max)}</span></td><td>${pbar(p,pass?'#2f855a':'#c0392b')}</td><td><span class="badge ${pass?'b-ok':'b-bad'}">${e.passMark==null?'—':pass?'ناجح':'راسب'}</span>${a.late?' <span class="badge b-warn">تجاوز الوقت</span>':''}</td><td>${fmtDur(a.duration)}</td><td>${a.finishedAt?fmtD(a.finishedAt):'—'}</td><td class="tools noprint"><button class="btn sm" data-act="attDetail" data-id="${a.id}">الإجابات</button><button class="btn sm danger" data-act="resetAtt" data-id="${a.id}" title="السماح بإعادة الاختبار">إعادة</button></td></tr>`}).join('')}
  ${prog.map(a=>{const s=stuById(a.sid);return `<tr><td>—</td><td>${esc(s?s.name:'—')}</td><td dir="ltr" style="text-align:right">${esc(s?s.examNo:'')}</td><td colspan="5"><span class="badge b-warn">بدأ ولم يُنهِ</span> <small class="muted">منذ ${ago(a.startedAt)}</small></td><td class="noprint"><button class="btn sm danger" data-act="resetAtt" data-id="${a.id}">إعادة</button></td></tr>`}).join('')}
  </tbody></table></div>${!atts.length?'<div class="empty">لم يقدّم أحد هذا الاختبار بعد</div>':''}
  ${notStarted.length?`<div class="muted" style="margin-top:10px;font-size:13px">لم يبدؤوا بعد (${notStarted.length}): ${notStarted.map(s=>esc(s.name)+(s.examNo?'':' <span class="badge b-warn">بلا رقم امتحاني</span>')).join('، ')}</div>`:''}</section>`};
function studentExamsSection(s){const atts=S.attempts.filter(a=>a.sid===s.id&&a.status==='submitted');
  return `<section class="panel"><div class="ph"><h3>الاختبارات</h3>${atts.length?`<button class="btn sm noprint" data-act="stuExCsv" data-id="${s.id}">${ic('download')} تقرير اختبارات الطالب</button>`:''}</div>${atts.length?`<div class="tw"><table><thead><tr><th>الاختبار</th><th>العلامة</th><th>النسبة</th><th>المدة</th><th>التاريخ</th><th class="noprint"></th></tr></thead><tbody>${atts.sort((a,b)=>String(b.finishedAt).localeCompare(String(a.finishedAt))).map(a=>{const e=S.exams.find(x=>x.id===a.examId)||{},p=pctOf(a);return `<tr><td>${esc(e.title||'—')}</td><td><span dir="ltr">${fN(a.score)} / ${fN(a.max)}</span></td><td>${pbar(p,e.passMark!=null&&p<e.passMark?'#c0392b':'#2f855a')}</td><td>${fmtDur(a.duration)}</td><td>${fmtD(a.finishedAt)}</td><td class="noprint"><button class="btn sm" data-act="attDetail" data-id="${a.id}">الإجابات</button></td></tr>`}).join('')}</tbody></table></div>`:'<div class="muted">لم يقدّم أي اختبار بعد</div>'}</section>`}
function exportExamCSV(id){const e=S.exams.find(x=>x.id===id);const rows=S.attempts.filter(a=>a.examId===id&&a.status==='submitted').sort((a,b)=>pctOf(a)-pctOf(b));
  const head=['الترتيب','الطالب','الرقم الامتحاني','الاختصاص','العلامة','من','النسبة %','النتيجة','المدة (ثانية)','المدة','تاريخ التسليم','تجاوز الوقت',...(e.questions||[]).map((q,i)=>'س'+(i+1))];
  download(new Blob([toCSV([head,...rows.map((a,i)=>{const s=stuById(a.sid)||{},p=pctOf(a);return[i+1,s.name,s.examNo,s.spec,a.score,a.max,p,e.passMark==null?'':p>=e.passMark?'ناجح':'راسب',a.duration,fmtDur(a.duration),a.finishedAt?new Date(a.finishedAt).toLocaleString('ar-SY'):'',a.late?'نعم':'',...(e.questions||[]).map(q=>a.answers[q.id]==null?'—':String(a.answers[q.id])===String(q.correct)?'✓':'✗')]})])],{type:'text/csv;charset=utf-8'}),`علامات-${e.title}.csv`)}
function exportStudentExamsCSV(sid){const s=stuById(sid);const rows=S.attempts.filter(a=>a.sid===sid&&a.status==='submitted');
  download(new Blob([toCSV([['الطالب','الرقم الامتحاني','الاختبار','العلامة','من','النسبة %','النتيجة','المدة','التاريخ'],...rows.map(a=>{const e=S.exams.find(x=>x.id===a.examId)||{},p=pctOf(a);return[s.name,s.examNo,e.title,a.score,a.max,p,e.passMark==null?'':p>=e.passMark?'ناجح':'راسب',fmtDur(a.duration),a.finishedAt?fmtD(a.finishedAt):'']}),[],['المتوسط','','','','',rows.length?Math.round(rows.reduce((x,a)=>x+pctOf(a),0)/rows.length):'']])],{type:'text/csv;charset=utf-8'}),`اختبارات-${s.name}.csv`)}
function exportAllMarksCSV(){const ex=[...S.exams].filter(e=>S.attempts.some(a=>a.examId===e.id));const head=['الطالب','الرقم الامتحاني','الاختصاص',...ex.map(e=>e.title+' %'),'المتوسط %'];
  const rows=[...S.students].map(s=>{const vals=ex.map(e=>{const a=S.attempts.find(x=>x.examId===e.id&&x.sid===s.id&&x.status==='submitted');return a?pctOf(a):''});const nums=vals.filter(v=>v!=='');return[s.name,s.examNo,s.spec,...vals,nums.length?Math.round(nums.reduce((a,b)=>a+b,0)/nums.length):'']}).sort((a,b)=>(+a[a.length-1]||0)-(+b[b.length-1]||0));
  download(new Blob([toCSV([head,...rows])],{type:'text/csv;charset=utf-8'}),`كل-العلامات-${today()}.csv`)}

/* ---------- تقديم الاختبار (الطالب) ---------- */
let RUN=null;
function seeded(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296}}
function shuffled(n,rnd){const a=[...Array(n).keys()];for(let i=n-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function startExamPrompt(id){const e=(UI.myEx||[]).find(x=>x.id===id)||{};
  formModal({title:'بدء الاختبار: '+esc(e.title||''),fields:[{type:'html',html:`<div class="full note">${e.count||''} سؤالاً · ${timerLabel(e)}${e.timerMode==='total'?'. يبدأ العد فور الدخول، ويُسلَّم الاختبار تلقائياً عند انتهاء الوقت':e.timerMode==='perQuestion'?'. لكل سؤال وقته، ولا يمكن الرجوع إلى سؤال سابق':''}.</div>`},{name:'no',label:'الرقم الامتحاني',required:true,full:true,ltr:true,ac:'off',ph:'مثلاً 1001'}],submit:'دخول الاختبار',
    onSubmit:async d=>{const r=await API.startExam(id,d.no);if(r.finished){toast('انتهى وقت الاختبار وسُلِّمت إجاباتك المحفوظة');UI.myEx=null;const res=await API.examResult(r.attempt_id);showResult(res);return}runExam(r)}})}
function runExam(r){
  const rnd=seeded(r.attempt_id);const order=r.shuffle?shuffled(r.questions.length,rnd):[...r.questions.keys()];const optOrder={};r.questions.forEach(q=>{optOrder[q.id]=r.shuffle?shuffled(q.options.length,rnd):[...q.options.keys()]});
  const answers={...(r.answers||{})};let idx=0;if(r.timerMode==='perQuestion'){idx=order.findIndex(i=>answers[r.questions[i].id]==null);if(idx<0)idx=order.length-1}
  RUN={r,order,optOrder,answers,qtimes:{},idx,qStart:Date.now(),offset:new Date(r.server_now)-Date.now(),startedAt:new Date(r.started_at).getTime(),qDeadline:null,saveT:null,busy:false};
  const el=document.createElement('div');el.id='examRun';el.className='examrun';document.body.appendChild(el);document.body.classList.add('noscroll');
  window.onbeforeunload=()=>'سيُحفظ تقدمك، لكن الوقت يستمر بالعد. هل تريد المغادرة؟';
  showQ();RUN.tick=setInterval(tick,250);tick();
}
const qNow=()=>RUN.r.questions[RUN.order[RUN.idx]];
function qSec(q){return +q.sec||+RUN.r.perQuestionSec||60}
function showQ(){const R=RUN,r=R.r,q=qNow(),n=r.questions.length,pq=r.timerMode==='perQuestion';if(pq)R.qDeadline=Date.now()+qSec(q)*1000;R.qStart=Date.now();
  const answered=Object.keys(R.answers).length;
  $('#examRun').innerHTML=`<div class="erbar"><div class="lg">${logoHTML()}</div><div class="ert"><b>${esc(r.title)}</b><small>${esc(r.student_name||'')} · الرقم الامتحاني <span dir="ltr">${esc(r.exam_no||'')}</span></small></div><div class="timer" id="erTimer">${ic('clock')}<span>--:--</span></div></div>
  <div class="erprog"><span style="width:${Math.round((R.idx+1)*100/n)}%"></span></div>
  <div class="erbody"><div class="ermeta">السؤال ${R.idx+1} من ${n} · أُجيب عن ${answered}${q.points!=1?` · ${fN(q.points)} علامة`:''}</div>
  <div class="erq">${sanitize(q.text)}</div>
  <div class="eropts">${R.optOrder[q.id].map((k,j)=>`<button class="eropt ${String(R.answers[q.id])===String(k)?'sel':''}" data-ans="${k}"><span class="lt">${LET[j]||j+1}</span><span>${sanitize(q.options[k])}</span></button>`).join('')}</div>
  ${pq?'':`<div class="ermap">${R.order.map((qi,j)=>`<button data-goq="${j}" class="${j===R.idx?'cur':''} ${R.answers[r.questions[qi].id]!=null?'done':''}">${j+1}</button>`).join('')}</div>`}</div>
  <div class="erfoot">${pq?'':`<button class="btn" data-qprev ${R.idx===0?'disabled':''}>→ السابق</button>`}${R.idx<n-1?`<button class="btn pri" data-qnext>${pq?'تأكيد والانتقال':'التالي'} ←</button>`:''}<button class="btn gold" data-qfinish style="margin-inline-start:auto">${ic('check')} إنهاء وتسليم</button></div>`;
}
function tick(){const R=RUN;if(!R||R.busy)return;const r=R.r,el=$('#erTimer span'),box=$('#erTimer');if(!el)return;let left=null;
  const now=Date.now()+R.offset;
  if(r.limitSec!=null&&r.timerMode==='total')left=r.limitSec*1000-(now-R.startedAt);
  if(r.timerMode==='perQuestion'){left=R.qDeadline-Date.now();const totalLeft=r.limitSec*1000-(now-R.startedAt);if(totalLeft<=0){finishExam(true);return}}
  if(left==null){const s=Math.floor((now-R.startedAt)/1000);el.textContent=`${pad(Math.floor(s/60))}:${pad(s%60)}`;return}
  const s=Math.max(0,Math.ceil(left/1000));el.textContent=`${pad(Math.floor(s/60))}:${pad(s%60)}`;box.classList.toggle('low',s<=(r.timerMode==='perQuestion'?5:60));
  if(left<=0){if(r.timerMode==='perQuestion'&&R.idx<r.questions.length-1){recTime();R.idx++;showQ();scheduleSave()}else finishExam(true)}}
function recTime(){const R=RUN,q=qNow();R.qtimes[q.id]=Math.round((R.qtimes[q.id]||0)+(Date.now()-R.qStart)/1000)}
function scheduleSave(){clearTimeout(RUN.saveT);RUN.saveT=setTimeout(async()=>{if(!RUN)return;try{const x=await API.saveExamProgress(RUN.r.attempt_id,RUN.answers);if(x&&x.finished)finishExam(true,true)}catch(e){console.warn('save',e)}},1200)}
async function finishExam(auto,serverDone){const R=RUN;if(!R||R.busy)return;
  if(!auto){const un=R.r.questions.filter(q=>R.answers[q.id]==null).length;const c=document.createElement('div');c.className='erconfirm';c.innerHTML=`<div class="panel"><h3>تسليم الاختبار؟</h3><p>${un?`⚠️ لم تُجب عن ${un} سؤالاً.`:'أجبت عن كل الأسئلة.'} لا يمكن التعديل بعد التسليم.</p><div class="tools"><button class="btn gold" data-yes>نعم، سلّم</button><button class="btn" data-no>رجوع</button></div></div>`;$('#examRun').appendChild(c);
    c.querySelector('[data-no]').onclick=()=>c.remove();c.querySelector('[data-yes]').onclick=()=>{c.remove();finishExam(true)};return}
  R.busy=true;clearInterval(R.tick);recTime();$('#examRun').innerHTML=`<div class="loading">${auto&&!serverDone?'⏰ انتهى الوقت. ':''}جارٍ تسليم الاختبار…</div>`;
  for(let i=0;i<4;i++){try{const res=serverDone?await API.examResult(R.r.attempt_id):await API.submitExam(R.r.attempt_id,R.answers,R.qtimes);closeRunner();UI.myEx=null;showResult(res);toast('سُلِّم الاختبار ✓');return}catch(e){console.error(e);await new Promise(x=>setTimeout(x,1500*(i+1)))}}
  $('#examRun').innerHTML=`<div class="loading"><div class="panel" style="max-width:480px">تعذّر الاتصال لتسليم الاختبار. إجاباتك محفوظة على الخادم حتى آخر تعديل.<br><br><button class="btn pri" data-retry>إعادة المحاولة</button></div></div>`;
  $('#examRun [data-retry]').onclick=()=>{R.busy=false;finishExam(true,serverDone)}}
function closeRunner(){if(RUN){clearInterval(RUN.tick);clearTimeout(RUN.saveT)}RUN=null;window.onbeforeunload=null;const el=$('#examRun');if(el)el.remove();document.body.classList.remove('noscroll')}
function showResult(res,who){const b=modal(mhead('النتيجة')+resultHTML(res,who)+`<div class="factions" style="margin-top:14px"><button class="btn gold noprint" data-act="print">${ic('print')} طباعة</button><button class="btn" data-close>إغلاق</button></div>`,true);if(ROUTE.startsWith('exams'))render()}
document.addEventListener('click',e=>{if(!RUN||!e.target.closest('#examRun'))return;const R=RUN,b=e.target.closest('button');if(!b||R.busy)return;
  if(b.dataset.ans!=null){const q=qNow();R.answers[q.id]=+b.dataset.ans;$$('#examRun .eropt').forEach(x=>x.classList.toggle('sel',x===b));const m=$(`#examRun .ermap [data-goq="${R.idx}"]`);if(m)m.classList.add('done');scheduleSave();return}
  if(b.hasAttribute('data-qnext')){recTime();R.idx++;showQ();scheduleSave();return}
  if(b.hasAttribute('data-qprev')){recTime();R.idx--;showQ();return}
  if(b.dataset.goq!=null){recTime();R.idx=+b.dataset.goq;showQ();return}
  if(b.hasAttribute('data-qfinish'))finishExam(false)},true);
function attDetailStaff(aid){const a=S.attempts.find(x=>x.id===aid),e=S.exams.find(x=>x.id===a.examId),s=stuById(a.sid);showResult(resultFor(e,{...a,qTimes:a.qTimes||{}},true),s?s.name+(s.examNo?' ('+s.examNo+')':''):'')}

/* ================= النسخة الاحتياطية الكاملة ================= */
async function backupAll(){try{toast('جارٍ تجهيز النسخة الاحتياطية الكاملة…');const JSZip=await loadJSZip();const zip=new JSZip();let paths=[];
  if(API.mode==='supabase'){const dump=await API.exportBackup();zip.file('data.json',JSON.stringify(dump));
    for(const[t,rows]of Object.entries(dump.tables)){const keys=[...new Set(rows.flatMap(o=>Object.keys(o)))];zip.file(`csv/${t}.csv`,toCSV([keys,...rows.map(o=>keys.map(k=>o[k]))]))}
    paths=dump.tables.submissions.flatMap(x=>((x.data||{}).files||[]).map(f=>f.path||f.id)).concat(dump.tables.materials.map(x=>(x.data||{}).path).filter(Boolean))}
  else{const st=snap();zip.file('data.json',JSON.stringify({format:'olymp-demo-backup',version:3,date:new Date().toISOString(),state:st}));
    ['students','tasks','subs','sessions','notes','surveys','responses','participation','exams','attempts','notifications','users','activity','stages','materials','creds'].forEach(k=>{const arr=(st[k]||[]).map(x=>{const o={...x};delete o.salt;delete o.hash;delete o.photo;delete o.inline;return o});const keys=[...new Set(arr.flatMap(o=>Object.keys(o)))];zip.file(`csv/${k}.csv`,toCSV([keys,...arr.map(o=>keys.map(k2=>o[k2]))]))});
    paths=st.subs.flatMap(x=>(x.files||[]).map(f=>f.path||f.id)).concat(st.materials.map(m=>m.path).filter(Boolean))}
  let n=0;for(const p of paths){try{const b=await API.getFile(p);if(b){zip.file('files/'+p,b);n++}}catch(e){}}
  zip.file('اقرأني.txt',`نسخة احتياطية كاملة من ${S.settings.name}\nالتاريخ: ${new Date().toLocaleString('ar-SY')}\nللاستعادة: الإعدادات ← استعادة نسخة (ZIP) بحساب المطور.\n⚠️ هذا الملف يحتوي كل البيانات وبطاقات دخول الطلاب وكلمات سر المراحل: احفظه في مكان آمن.`);
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});download(blob,`نسخة-احتياطية-كاملة-${today()}.zip`);toast(`تمت النسخة: كل البيانات و${n} ملفاً ✓`)}catch(e){toast(errMsg(e),'err')}}
async function restoreAll(file){try{const JSZip=await loadJSZip();const zip=await JSZip.loadAsync(file);const j=JSON.parse(await zip.file('data.json').async('string'));
  const files=Object.keys(zip.files).filter(p=>p.startsWith('files/')&&!zip.files[p].dir);
  if(API.mode==='supabase'){if(j.format!=='olymp-db-backup')throw new Error('هذه نسخة من الوضع التجريبي، ولا تُستعاد على خادم Supabase');
    confirmBox(`استعادة نسخة بتاريخ ${fmtD(j.date)}: ${j.auth_users.length} حساباً، ${j.tables.students.length} طالباً، ${files.length} ملفاً. البيانات الموجودة بنفس المعرّفات تُستبدل، ولا يُحذف شيء آخر. متابعة؟`,async()=>{
      try{toast('جارٍ الاستعادة… لا تغلق الصفحة');let k=0;for(const p of files){await API.putFile(p.slice(6),await zip.file(p).async('blob'));k++}
        const r=await API.restoreBackup(j);await reload();toast(`تمت الاستعادة ✓ حسابات جديدة: ${r.users_created}، مطابقة: ${r.users_matched}، ملفات: ${k}`)}catch(e){toast('فشلت الاستعادة: '+errMsg(e),'err')}},'استعادة')}
  else{if(!j.state)throw new Error('هذه نسخة من خادم Supabase، وتُستعاد على خادم Supabase فقط');
    confirmBox('ستُستبدل كل البيانات الحالية بمحتوى النسخة الاحتياطية. هل أنت متأكد؟',async()=>{for(const p of files)await API.putFile(p.slice(6),await zip.file(p).async('blob'));
      S=normalize(j.state);if(!S.users.length)S.users=blankState(true).users;await API.commit(null,S);const me=S.users.find(u=>u.id===ME.id);if(!me){await API.logout();ME=null}else ME=me;render();toast('تمت الاستعادة ✓')},'استعادة')}}
  catch(e){toast(errMsg(e)||'الملف ليس نسخة احتياطية صالحة','err')}}

/* ================= events ================= */
function go(r){location.hash=r}
const ACT={
  menu:()=>$('#side').classList.toggle('open'),
  palette:el=>{PREFS.palette=+el.dataset.i;savePrefs();render()},
  theme:el=>{PREFS.theme=el.dataset.v;savePrefs();render()},
  logout:async()=>{await API.logout();ME=null;location.hash='';render()},
  mypw:myPw,addStudent:()=>studentForm(),editStudent:el=>studentForm(stuById(el.dataset.id)),
  delStudent:el=>{const s=stuById(el.dataset.id);confirmBox(`حذف الطالب «${esc(s.name)}» وكل تسليماته وسجلاته وحسابه؟`,async()=>{go('students');const paths=S.subs.filter(x=>x.sid===s.id).flatMap(x=>(x.files||[]).map(f=>f.path||f.id));const accs=S.users.filter(u=>u.studentId===s.id);
    await mutate(S=>{S.students=S.students.filter(x=>x.id!==s.id);S.subs=S.subs.filter(x=>x.sid!==s.id);S.notes=S.notes.filter(n=>n.sid!==s.id);S.sessions.forEach(q=>q.present=(q.present||[]).filter(i=>i!==s.id));S.stages.forEach(g=>g.allowed=(g.allowed||[]).filter(i=>i!==s.id));log('حُذف الطالب '+s.name)});
    try{await API.delFiles(paths);await API.delCred(s.id);for(const u of accs)await API.deleteUser(u.id)}catch(e){toast(errMsg(e),'err')}await reload()})},
  addTask:()=>taskForm(),editTask:el=>taskForm(taskById(el.dataset.id)),taskInfo:el=>taskInfo(el.dataset.id),
  delTask:el=>confirmBox('حذف الوظيفة وكل تسليماتها؟',async()=>{const paths=S.subs.filter(x=>x.taskId===el.dataset.id).flatMap(x=>(x.files||[]).map(f=>f.path||f.id));await mutate(S=>{S.subs=S.subs.filter(x=>x.taskId!==el.dataset.id);S.tasks=S.tasks.filter(t=>t.id!==el.dataset.id)});API.delFiles(paths).catch(()=>{})}),
  addSession:()=>sessionForm(),editSession:el=>sessionForm(S.sessions.find(x=>x.id===el.dataset.id)),
  delSession:el=>confirmBox('حذف هذه الجلسة؟',()=>mutate(S=>S.sessions=S.sessions.filter(x=>x.id!==el.dataset.id))),
  submit:el=>submitForm(el.dataset.id),review:el=>reviewBox(el.dataset.id),
  dl:async el=>{const b=await API.getFile(el.dataset.path);if(b)download(b,el.dataset.name);else toast('تعذّر تنزيل الملف','err')},
  addUser:()=>userForm(),editUser:el=>userForm(S.users.find(u=>u.id===el.dataset.id)),
  delUser:el=>confirmBox('حذف هذا المستخدم؟ لن يستطيع الدخول بعد ذلك.',async()=>{try{await API.deleteUser(el.dataset.id);await reload();toast('حُذف ✓')}catch(e){toast(errMsg(e),'err')}}),
  rtype:el=>{UI.r.type=el.dataset.v;render()},rscopeTo:el=>{UI.r.scope=el.dataset.id;render();scrollTo(0,0)},
  reportFor:el=>{UI.r=Object.assign(UI.r||{type:'m',date:today(),track:''},{scope:el.dataset.id})},
  print:()=>window.print(),backup:backupAll,
  inTab:el=>{UI.inTab=el.dataset.v;render()},sendNotif:()=>sendNotifForm(),readAll:()=>markRead(myNotifs().map(n=>n.id)),
  openNotif:el=>{el.classList.toggle('open');if(myNotifs().some(n=>n.id===el.dataset.id))markRead([el.dataset.id])},
  delNotif:el=>confirmBox('حذف هذا الإشعار؟',()=>mutate(S=>{S.notifications=S.notifications.filter(n=>n.id!==el.dataset.id);S.reads=S.reads.filter(r=>r.nid!==el.dataset.id)})),
  newExam:el=>examEditor({id:uid(),_new:true,title:'',desc:'',trackId:'',stage:String(el.dataset.stage||'1'),status:'draft',timerMode:'total',totalMinutes:30,perQuestionSec:60,passMark:50,showAnswers:true,shuffle:false,created:today(),questions:[]}),
  editExam:el=>examEditor(S.exams.find(x=>x.id===el.dataset.id)),
  dupExam:el=>{const e=S.exams.find(x=>x.id===el.dataset.id);examEditor({...JSON.parse(JSON.stringify(e)),id:uid(),_new:true,demo:undefined,title:e.title+' (نسخة)',status:'draft',created:today(),questions:e.questions.map(q=>({...q,id:uid()}))})},
  delExam:el=>{const e=S.exams.find(x=>x.id===el.dataset.id);confirmBox(`حذف الاختبار «${esc(e.title)}» وكل محاولاته وعلاماته؟`,()=>{if(ROUTE.startsWith('exam:'))go('lectures:'+(e.stage||1)+':exams');mutate(S=>{S.exams=S.exams.filter(x=>x.id!==e.id);S.attempts=S.attempts.filter(a=>a.examId!==e.id);log('حُذف الاختبار: '+e.title)})})},
  exStatus:el=>mutate(S=>{const e=S.exams.find(x=>x.id===el.dataset.id);const pub=el.dataset.v==='open'&&e.status!=='open';e.status=el.dataset.v;log((e.status==='open'?'نُشر':'أُغلق')+' الاختبار: '+e.title);
    if(pub)S.notifications.unshift({id:uid(),title:'اختبار جديد: '+e.title,body:`${(e.questions||[]).length} سؤالاً · ${timerLabel(e)}. ادخل إلى «المحاضرات العلمية» ← ${(stageById(e.stage)||{}).name||''} ← «اختبارات تجريبية» وجهّز رقمك الامتحاني.`,target:'all',trackId:'',sid:'',createdAt:new Date().toISOString(),createdBy:ME.id})}),
  exSort:el=>{UI.exSort=el.dataset.v;render()},exCsv:el=>exportExamCSV(el.dataset.id),stuExCsv:el=>exportStudentExamsCSV(el.dataset.id),allMarksCsv:exportAllMarksCSV,
  attDetail:el=>attDetailStaff(el.dataset.id),
  resetAtt:el=>confirmBox('حذف محاولة الطالب والسماح له بإعادة الاختبار؟',async()=>{try{await API.resetAttempt(el.dataset.id);S.attempts=S.attempts.filter(a=>a.id!==el.dataset.id);render();toast('يمكن للطالب إعادة الاختبار الآن')}catch(e){toast(errMsg(e),'err')}},'إعادة'),
  startExam:el=>startExamPrompt(el.dataset.id),
  myResult:async el=>{try{showResult(await API.examResult(el.dataset.id))}catch(e){toast(errMsg(e),'err')}},
  rmLogo:()=>mutate(S=>S.settings.logo=''),rmHero:()=>mutate(S=>{S.settings.hero='';S.settings.heroM=''}),
  clearDemo:()=>confirmBox('مسح كل الطلاب والوظائف والجلسات والاستبيانات التجريبية؟ (الإعدادات والمراحل تبقى)',async()=>{const du=S.users.filter(u=>u.demo);
    await mutate(S=>{const ds=new Set(S.students.filter(s=>s.demo).map(s=>s.id)),dt=new Set(S.tasks.filter(t=>t.demo).map(t=>t.id)),dv=new Set(S.surveys.filter(v=>v.demo).map(v=>v.id));S.students=S.students.filter(s=>!s.demo);if(API.mode==='demo')S.users=S.users.filter(u=>!u.demo);S.tasks=S.tasks.filter(t=>!t.demo);S.subs=S.subs.filter(x=>!x.demo&&!ds.has(x.sid)&&!dt.has(x.taskId));S.sessions=S.sessions.filter(x=>!x.demo);S.notes=S.notes.filter(n=>!ds.has(n.sid));S.surveys=S.surveys.filter(v=>!v.demo);const de=new Set(S.exams.filter(e=>e.demo).map(e=>e.id));S.exams=S.exams.filter(e=>!e.demo);S.materials=S.materials.filter(m=>!m.demo);S.notifications=S.notifications.filter(n=>!n.demo);if(API.mode==='demo'){S.attempts=S.attempts.filter(a=>!de.has(a.examId));S.creds=S.creds.filter(c=>!ds.has(c.sid));S.responses=S.responses.filter(r=>!dv.has(r.surveyId));S.participation=S.participation.filter(p=>!dv.has(p.surveyId));S.activity=[]}log('مُسحت البيانات التجريبية، المنصة جاهزة للعمل')});if(API.mode==='supabase')await reload()},'مسح'),
  loadDemo:()=>mutate(S=>seedDemo(S,API.mode==='demo')),
  resetAll:()=>confirmBox('سيُحذف كل شيء وتعود المنصة لحالتها الأولى (admin / admin123). هل أنت متأكد تماماً؟',async()=>{await API.reset();await API.logout();location.reload()},'إعادة الضبط'),
  newSv:()=>surveyBuilder({id:uid(),_new:true,title:'',desc:'',anonymous:false,trackId:'',status:'draft',deadline:'',created:today(),questions:[]}),
  svTpl:el=>surveyBuilder({id:uid(),_new:true,...surveyTemplate(el.dataset.k),anonymous:el.dataset.k==='monthly',trackId:'',status:'draft',deadline:'',created:today()}),
  editSv:el=>surveyBuilder(S.surveys.find(v=>v.id===el.dataset.id)),
  dupSv:el=>{const v=S.surveys.find(x=>x.id===el.dataset.id);surveyBuilder({...JSON.parse(JSON.stringify(v)),id:uid(),_new:true,demo:undefined,title:v.title+' (نسخة)',status:'draft',created:today(),questions:v.questions.map(q=>({...q,id:uid()}))})},
  delSv:el=>{const v=S.surveys.find(x=>x.id===el.dataset.id);confirmBox(`حذف الاستبيان «${esc(v.title)}» وكل إجاباته؟`,async()=>{try{await API.deleteResponses(v.id)}catch(e){}await mutate(S=>{S.surveys=S.surveys.filter(x=>x.id!==v.id);S.responses=S.responses.filter(r=>r.surveyId!==v.id);S.participation=S.participation.filter(p=>p.surveyId!==v.id);log('حُذف الاستبيان: '+v.title)});if(ROUTE.startsWith('survey:'))go('surveys')})},
  svStatus:el=>mutate(S=>{const v=S.surveys.find(x=>x.id===el.dataset.id);v.status=el.dataset.v;log((v.status==='open'?'نُشر':'أُغلق')+' الاستبيان: '+v.title)}),
  answerSv:el=>answerForm(el.dataset.id),svCsv:el=>exportSurveyCSV(el.dataset.id)
};
/* =====================================================================
   المحاضرات العلمية: المراحل ← (المحاور | أسئلة دورات | اختبارات تجريبية)
   ===================================================================== */
const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs',PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
let pdfjsP=null;function loadPdfjs(){return pdfjsP||(pdfjsP=import(PDFJS_URL).then(m=>{m.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;return m}).catch(e=>{pdfjsP=null;throw new Error('تعذّر تحميل قارئ PDF، تحقق من الإنترنت')}))}
let XLSXP=null;function loadXLSX(){return XLSXP||(XLSXP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=()=>res(window.XLSX);s.onerror=()=>{XLSXP=null;rej(new Error('تعذّر تحميل قارئ Excel، تحقق من الإنترنت'))};document.head.appendChild(s)}))}
const lecRoute=()=>{const p=ROUTE.split(':');return{stage:p[1]||'',tab:p[2]||'axes',axis:p[3]||''}};
const ltab=(stage,k,l,i,on,cnt)=>`<a class="ltab ${on?'on':''}" href="#lectures:${stage}:${k}">${ic(i)}<span>${l}</span>${cnt!=null?`<i>${cnt}</i>`:''}</a>`;
const secCard=(g,x,staff)=>{const n=matsOf(g.id,'session',x.id).length;return `<a class="axcard" href="#lectures:${g.id}:axis:${x.id}" style="--c:${x.color||SEC_COLORS[0]}"><div class="axi">${ic(IC[x.id]?x.id:'book')}</div><b>${esc(x.name)}</b><small>${n?n+' محاضرة':'لا محاضرات بعد'}</small>${staff?`<span class="axtools noprint"><button class="btn sm" data-act="editSec" data-stage="${g.id}" data-id="${x.id}" title="تعديل">${ic('edit')}</button><button class="btn sm danger" data-act="delSec" data-stage="${g.id}" data-id="${x.id}" title="حذف">${ic('trash')}</button></span>`:''}</a>`};
VIEWS.lectures=()=>{
  const R=lecRoute(),g=R.stage&&stageById(R.stage),staff=isStaff();
  if(!g)return `<div class="pagehead"><div><h2>المحاضرات العلمية</h2><div class="sub">${staff?'ثلاث مراحل، ولكل مرحلة كلمة سر وقائمة طلاب ومحاضراتها واختباراتها الخاصة':'اختر مرحلتك. يطلب منك الدخول كلمة السر التي أعطاك إياها المشرف'}</div></div></div>
    <section class="panel">${stageCards()}</section>`;
  if(!canStage(g.id)){const why=!g.open?'هذه المرحلة مغلقة حالياً. تُفتح عندما يعلن المشرف ذلك.':g.restrict&&!(g.allowed||[]).includes(ME.studentId)?'اسمك ليس ضمن قائمة الطلاب المسموح لهم بدخول هذه المرحلة. راجع المشرف.':'';
    return `<div class="pagehead"><div><a class="btn" href="#lectures">→ المراحل</a></div></div><section class="panel lockbox"><div class="lk">${ic('lock')}</div><h2>${esc(g.name)}</h2>
    ${why?`<p class="muted">${why}</p>`:`<p class="muted">أدخل كلمة سر المرحلة التي أعطاك إياها المشرف.</p><form id="unlockF" data-stage="${g.id}"><input name="pw" type="password" placeholder="كلمة سر المرحلة" required dir="ltr" autocomplete="off"><button class="btn pri">${ic('unlock')} دخول المرحلة</button></form>`}</section>`}
  const secs=secsOf(g),mainL=secs.length?'المحاور':'المحاضرات';
  const nS=S.materials.filter(m=>String(m.stage)===g.id&&m.kind==='session').length,nP=matsOf(g.id,'past').length,nE=staff?S.exams.filter(e=>String(e.stage||'')===g.id).length:null;
  const tab=['axes','axis','extra','past','exams','manage'].includes(R.tab)?R.tab:'axes',isX=['extra','past','exams'].includes(tab);
  UI.xg=UI.xg||{};let body='';
  if(isX&&!staff&&!UI.xg[ME.id+':'+g.id])body=`<div class="lockbox" style="margin:10px auto"><div class="lk">${ic('lock')}</div><h2>أسئلة الدورات والاختبارات التجريبية</h2><p class="muted">أدخل كلمة سر المرحلة نفسها للمتابعة.</p><form id="unlockX" data-stage="${g.id}"><input name="pw" type="password" placeholder="كلمة سر المرحلة" required dir="ltr" autocomplete="off"><button class="btn pri">${ic('unlock')} متابعة</button></form></div>`;
  else if(tab==='axes'){const orphans=matsOf(g.id,'session').filter(m=>!secs.some(x=>x.id===m.axis));
    body=`<div class="ph"><h3>${mainL}</h3>${staff?`<div class="tools noprint">${secs.length?'':`<button class="btn pri" data-act="addMat" data-stage="${g.id}" data-kind="session" data-axis="">${ic('plus')} إضافة محاضرة</button>`}<button class="btn gold" data-act="addSec" data-stage="${g.id}">${ic('plus')} إضافة محور / قسم</button>${!secs.length&&specName()===SPECS[0]?`<button class="btn" data-act="defSecs" data-stage="${g.id}">المحاور الأربعة الافتراضية</button>`:''}</div>`:''}</div>
    ${secs.length?`<div class="axgrid">${secs.map(x=>secCard(g,x,staff)).join('')}</div>${orphans.length?`<h3 style="margin-top:18px">محاضرات عامة</h3>${matList(orphans,'')}`:''}`:matList(orphans,'لا محاضرات بعد')}`}
  else if(tab==='axis'){const ax=secs.find(a=>a.id===R.axis);body=ax?`<div class="ph"><div class="tools"><a class="btn sm" href="#lectures:${g.id}:axes">→ ${mainL}</a><h3 style="margin:0">${ic(IC[ax.id]?ax.id:'book','ii')} ${esc(ax.name)}</h3></div>${staff?`<button class="btn pri noprint" data-act="addMat" data-stage="${g.id}" data-kind="session" data-axis="${ax.id}">${ic('plus')} إضافة محاضرة</button>`:''}</div>${matList(matsOf(g.id,'session',ax.id),'لا محاضرات هنا بعد')}`:'<div class="empty">هذا القسم غير موجود</div>'}
  else if(tab==='extra')body=`<div class="axgrid two"><a class="axcard" href="#lectures:${g.id}:exams" style="--c:#214539"><div class="axi">${ic('exam')}</div><b>اختبارات تجريبية</b><small>${nE!=null?nE+' اختباراً':'اختبر نفسك برقمك الامتحاني'}</small></a><a class="axcard" href="#lectures:${g.id}:past" style="--c:#ba925f"><div class="axi">${ic('file')}</div><b>أسئلة دورات</b><small>${nP?nP+' ملفاً':'لا ملفات بعد'}</small></a></div>`;
  else if(tab==='past')body=`<div class="ph"><div class="tools"><a class="btn sm" href="#lectures:${g.id}:extra">→ رجوع</a><h3 style="margin:0">أسئلة دورات</h3></div>${staff?`<button class="btn pri noprint" data-act="addMat" data-stage="${g.id}" data-kind="past" data-axis="">${ic('plus')} إضافة ملف أسئلة دورة</button>`:''}</div>${matList(matsOf(g.id,'past'),'لم تُرفع أسئلة دورات بعد')}`;
  else if(tab==='exams')body=`<div class="tools noprint" style="margin-bottom:8px"><a class="btn sm" href="#lectures:${g.id}:extra">→ رجوع</a></div>`+examsView(g.id);
  else if(tab==='manage'&&staff)body=stageManage(g);
  return `<div class="pagehead"><div class="tools"><a class="btn" href="#lectures">→ المراحل</a><div><h2>${esc(g.name)}</h2>${g.desc?`<div class="sub">${esc(g.desc)}</div>`:''}</div></div>${staff?`<div class="tools">${g.open?'<span class="badge b-ok">مفتوحة للطلاب</span>':'<span class="badge b-mut">مغلقة</span>'}</div>`:''}</div>
  <nav class="ltabs noprint">${ltab(g.id,'axes',mainL,secs.length?'target':'book',tab==='axes'||tab==='axis',nS)}${ltab(g.id,'extra','أسئلة الدورات والاختبارات التجريبية','exam',isX,staff?nP+nE:null)}${staff?ltab(g.id,'manage','إدارة المرحلة والدخول','key',tab==='manage'):''}</nav>
  <section class="panel">${body}</section>`};
function secForm(stage,x){const g=stageById(stage);formModal({title:x?'تعديل المحور / القسم':'إضافة محور / قسم',fields:[
  {name:'name',label:'الاسم',value:x&&x.name,required:true,full:true,ph:'مثلاً: الميكانيك، الكيمياء العضوية، الوحدة الأولى…'},
  {name:'color',label:'اللون',type:'select',options:SEC_COLORS.map((c,i)=>[c,['أخضر','ذهبي','بنّي','أزرق','بنفسجي','أحمر','زيتي','رمادي'][i]]),value:x?x.color:SEC_COLORS[secsOf(g).length%SEC_COLORS.length]},
  {name:'order',label:'الترتيب',type:'number',min:1,value:x?secsOf(g).indexOf(x)+1:secsOf(g).length+1}],
  onSubmit:d=>{setStage(stage,g=>{const L=[...(g.sections||[])];let it=x&&L.find(q=>q.id===x.id);if(it)L.splice(L.indexOf(it),1);else it={id:'sec'+uid()};it.name=d.name.trim();it.color=d.color;L.splice(clamp((+d.order||1)-1,0,L.length),0,it);g.sections=L});toast('تم الحفظ')}})}
function matList(list,empty){const staff=isStaff();
  return `<div class="mats">${list.map((m,i)=>`<div class="mat" data-act="openMat" data-id="${m.id}"><span class="mn">${i+1}</span><div class="mt"><b>${esc(m.title)}</b>${m.desc?`<small class="muted">${esc(m.desc)}</small>`:''}<small class="muted">${m.format==='pdf'?'PDF':'HTML تفاعلي'}${m.size?' · '+fsize(m.size):''}</small></div><span class="badge ${m.format==='pdf'?'b-warn':'b-ok'}">${m.format==='pdf'?'PDF':'تفاعلي'}</span><button class="btn sm gold">${ic('eye')} فتح</button>${staff?`<button class="btn sm noprint" data-act="editMat" data-id="${m.id}" title="تعديل">${ic('edit')}</button><button class="btn sm danger noprint" data-act="delMat" data-id="${m.id}" title="حذف">${ic('trash')}</button>`:''}</div>`).join('')||`<div class="empty">${empty}</div>`}</div>`}
function stageManage(g){const pw=S.stagePw[g.id]||'',al=(g.allowed||[]).map(stuById).filter(Boolean),un=S.unlocks.filter(u=>String(u.stage)===g.id);
  const entered=sid=>{const u=S.users.find(x=>x.studentId===sid);return u&&un.some(x=>x.userId===u.id)};
  return `<div class="grid2e"><div><h3>الحالة وكلمة السر</h3>
   <div class="file"><span><b>المرحلة ${g.open?'مفتوحة':'مغلقة'}</b><br><small class="muted">${g.open?'يدخلها من معه كلمة السر'+(g.restrict?' واسمه في القائمة':''):'لا يدخلها أي طالب حتى لو كان معه كلمة السر'}</small></span><button class="btn ${g.open?'danger':'gold'}" data-act="stToggle" data-id="${g.id}" data-k="open">${g.open?'إغلاق المرحلة':'فتح المرحلة'}</button></div>
   <div class="file" style="margin-top:8px"><span><b>كلمة السر الحالية:</b> ${pw?`<code dir="ltr" style="font-size:17px">${esc(pw)}</code>`:'<span class="badge b-warn">لم تُحدَّد بعد</span>'}<br><small class="muted">عند تغييرها يُطلب من كل الطلاب إدخال الكلمة الجديدة.</small></span></div>
   <form id="stPwF" data-stage="${g.id}" class="tools" style="margin-top:8px"><input name="pw" placeholder="كلمة سر جديدة" dir="ltr" autocomplete="off" required minlength="3" style="flex:1"><button type="button" class="btn" data-act="stGenPw">توليد</button><button class="btn pri">حفظ كلمة السر</button></form>
   <h3 style="margin-top:18px">اسم المرحلة</h3><form id="stNameF" data-stage="${g.id}" class="fgrid"><label>الاسم<input name="name" value="${esc(g.name)}" required></label><label>وصف قصير (اختياري)<input name="desc" value="${esc(g.desc||'')}"></label><div class="factions"><button class="btn pri">حفظ</button></div></form>
   <p class="muted" style="font-size:13px">دخل هذه المرحلة حتى الآن <b>${un.length}</b> طالباً. <button class="btn sm" data-act="stKick" data-id="${g.id}">إخراج الجميع (يطلب كلمة السر من جديد)</button></p></div>
  <div><h3>الطلاب المسموح لهم</h3>
   <div class="file"><span><b>${g.restrict?'الدخول للقائمة فقط':'الدخول لكل من معه كلمة السر'}</b><br><small class="muted">${g.restrict?`في القائمة ${al.length} طالباً`:'فعّل القائمة لتحصر الدخول بطلاب محددين'}</small></span><button class="btn" data-act="stToggle" data-id="${g.id}" data-k="restrict">${g.restrict?'السماح للجميع':'حصر الدخول بالقائمة'}</button></div>
   <div class="tools" style="margin:10px 0"><label class="btn gold">${ic('upload')} رفع قائمة (Excel / PDF)<input type="file" id="allowFile" data-stage="${g.id}" accept=".xlsx,.xls,.csv,.pdf,.html,.htm,.txt" hidden></label><button class="btn" data-act="stPick" data-id="${g.id}">${ic('users')} إضافة / اختيار يدوي</button>${al.length?`<button class="btn danger" data-act="stClear" data-id="${g.id}">تفريغ القائمة</button>`:''}</div>
   <div class="tw" style="max-height:340px;overflow:auto"><table><thead><tr><th>الطالب</th><th>الرقم الامتحاني</th><th>دخل؟</th><th></th></tr></thead><tbody>${al.map(s=>`<tr><td>${esc(s.name)}</td><td dir="ltr" style="text-align:right">${esc(s.examNo)||'—'}</td><td>${entered(s.id)?'<span class="badge b-ok">نعم</span>':'<span class="badge b-mut">لا</span>'}</td><td><button class="btn sm danger" data-act="stDrop" data-id="${g.id}" data-sid="${s.id}">منع</button></td></tr>`).join('')}</tbody></table></div>${al.length?'':'<div class="empty">القائمة فارغة</div>'}</div></div>`}
function setStage(id,fn){return mutate(S=>{const g=S.stages.find(x=>String(x.id)===String(id));fn(g)})}
function matForm(stage,kind,axis,m){
  const secs=secsOf(stageById(stage));formModal({title:m?'تعديل الملف':kind==='past'?'إضافة ملف أسئلة دورة':'إضافة محاضرة'+((secOf(stage,axis)||{}).name?' — '+secOf(stage,axis).name:''),wide:true,fields:[
    {name:'title',label:'العنوان',value:m&&m.title,required:true,full:true,ph:kind==='past'?'مثلاً: أسئلة دورة المحافظات':'مثلاً: المحاضرة 1'},
    ...(kind==='session'&&secs.length?[{name:'axis',label:'المحور / القسم',type:'select',options:[...secs.map(a=>[a.id,a.name]),['','محاضرات عامة (بلا قسم)']],value:m?m.axis:axis}]:[]),
    {name:'order',label:'الترتيب',type:'number',min:1,value:m?m.order:(matsOf(stage,kind,kind==='session'?(axis||''):null).length+1)},
    {name:'file',label:m?'استبدال الملف (اختياري)':'الملف (HTML أو PDF)',type:'file',accept:'.html,.htm,.pdf',required:!m,hint:'الحد 45MB للملف الواحد.'},
    {name:'pdfMode',label:'إن كان الملف PDF',type:'select',options:[['pdf','يبقى PDF كما هو'],['html','يُحوَّل إلى صفحة HTML بهوية المنصة']],value:'pdf',hint:'التحويل يحفظ كل صفحة كصورة داخل صفحة HTML، فيزيد حجم الملف.'},
    {name:'desc',label:'وصف قصير (اختياري)',type:'textarea',rows:2,value:m&&m.desc}],submit:m?'حفظ':'رفع وحفظ',
   onSubmit:async(d,form)=>{const id=m?m.id:uid();let meta={};let f=d.file&&d.file[0];
     if(f){const isPdf=/\.pdf$/i.test(f.name)||f.type==='application/pdf',isHtml=/\.html?$/i.test(f.name)||f.type==='text/html';
       if(!isPdf&&!isHtml){toast('الملف يجب أن يكون HTML أو PDF','err');return false}
       let blob=f,format=isPdf?'pdf':'html';const btn=$('button.pri',form);
       if(isPdf&&d.pdfMode==='html'){btn.textContent='جارٍ التحويل…';blob=await pdfToHtml(f,d.title,t=>btn.textContent=t);format='html'}
       else if(isHtml)blob=new Blob([await f.arrayBuffer()],{type:'text/html'});
       if(blob.size>45*1048576){toast('الملف أكبر من 45 ميغابايت ('+fsize(blob.size)+')','err');btn.textContent='رفع وحفظ';return false}
       const path=`mat/s${stage}/${id}-${Date.now().toString(36)}.${format}`;btn.textContent='جارٍ الرفع…';
       try{await API.putFile(path,blob)}catch(e){btn.textContent='رفع وحفظ';toast('تعذّر رفع الملف: '+errMsg(e),'err');return false}
       if(m&&m.path)API.delFiles([m.path]).catch(()=>{});
       meta={format,path,size:blob.size,name:f.name,inline:undefined}}
     await mutate(S=>{let x=S.materials.find(q=>q.id===id);if(!x){x={id,stage:String(stage),kind,created:today()};S.materials.push(x)}
       Object.assign(x,{title:d.title,desc:d.desc,order:+d.order||1,axis:kind==='session'?(d.axis||''):''},meta);if(meta.path)delete x.inline;log((m?'عُدّل ':'رُفع ')+(kind==='past'?'ملف أسئلة دورة: ':'محاضرة: ')+d.title)});toast('تم الحفظ ✓')}})}
// تحويل PDF إلى صفحة HTML مستقلة بهوية المنصة (كل صفحة صورة)
async function pdfToHtml(file,title,onStep){const pdfjs=await loadPdfjs();const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const imgs=[];
  for(let i=1;i<=pdf.numPages;i++){if(onStep)onStep(`جارٍ تحويل الصفحة ${i} من ${pdf.numPages}…`);const pg=await pdf.getPage(i),v0=pg.getViewport({scale:1}),sc=Math.min(2.2,1300/v0.width),vp=pg.getViewport({scale:sc});
    const c=document.createElement('canvas');c.width=Math.round(vp.width);c.height=Math.round(vp.height);const cx=c.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,c.width,c.height);await pg.render({canvasContext:cx,viewport:vp}).promise;imgs.push(c.toDataURL('image/jpeg',.8));c.width=c.height=0}
  const html=`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>*{box-sizing:border-box}body{margin:0;font:400 17px/1.8 Tajawal,Tahoma,sans-serif;background:#f7eee7;color:#214539}header{position:sticky;top:0;z-index:5;background:#f7eee7;border-bottom:2px solid #ba925f;padding:10px 16px;display:flex;align-items:center;gap:12px;justify-content:space-between}h1{margin:0;font-size:20px;font-weight:800}header span{color:#7c8b82;font-size:13px}main{max-width:980px;margin:0 auto;padding:14px}.pg{background:#fff9f3;border:1px solid #e6d6c4;border-top:6px solid #214539;border-radius:14px;padding:8px;margin-bottom:16px;box-shadow:0 2px 10px rgba(60,45,20,.06)}.pg img{display:block;width:100%;height:auto;border-radius:8px}.pg small{display:block;text-align:center;color:#7c8b82;padding-top:4px}footer{text-align:center;color:#7c8b82;font-size:13px;padding:10px 0 24px}</style></head><body><header><h1>${esc(title)}</h1><span>${imgs.length} صفحة</span></header><main>${imgs.map((u,i)=>`<div class="pg"><img loading="lazy" alt="الصفحة ${i+1}" src="${u}"><small>${i+1} / ${imgs.length}</small></div>`).join('')}</main><footer>إعداد: ${DEV_NAME}</footer></body></html>`;
  return new Blob([html],{type:'text/html'})}
// عارض الملفات: HTML داخل إطار معزول، وPDF يُرسم صفحةً صفحة
let MAT=null;
// داخل الإطار المعزول لا تعمل روابط التنقل الداخلية (#قسم) من تلقاء نفسها، فنضيف للملف سكربتاً صغيراً يمرّر إلى القسم المطلوب
const MAT_FIX=`\n<script>(function(){document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var h=a.getAttribute('href')||'';if(h.charAt(0)!=='#')return;e.preventDefault();if(h.length<2){window.scrollTo({top:0,behavior:'smooth'});return}var id=decodeURIComponent(h.slice(1)),t=document.getElementById(id)||document.getElementsByName(id)[0];if(t)t.scrollIntoView({behavior:'smooth',block:'start'})},true)})()<\/script>`;
// حفظ الملف في متصفح الطالب بعد أول فتح: لا يُنزَّل من جديد إلا إذا استُبدل (مسار الملف يتغيّر عند كل رفع)
const MATC='olymp-mat-v1',matKey=p=>'/__mat/'+encodeURIComponent(p);
async function matBlob(m){let c=null;try{c=await caches.open(MATC);const r=await c.match(matKey(m.path));if(r)return await r.blob()}catch(e){c=null}
  const blob=await API.getFile(m.path);
  if(blob&&c){try{await c.put(matKey(m.path),new Response(blob,{headers:{'Content-Type':blob.type||'application/octet-stream'}}));const keep=new Set(S.materials.filter(x=>x.path).map(x=>matKey(x.path)));for(const k of await c.keys()){if(!keep.has(new URL(k.url).pathname))c.delete(k)}}catch(e){}}
  return blob}
async function openMaterial(id){const m=S.materials.find(x=>x.id===id);if(!m)return;if(!canStage(m.stage)){toast('ادخل المرحلة أولاً','err');return}
  closeMat(true);const el=document.createElement('div');el.id='matView';el.className='matview';
  el.innerHTML=`<div class="mvh"><button class="btn" data-act="closeMat">→ رجوع</button><b>${esc(m.title)}</b><span class="tools">${isStaff()?`<button class="btn sm" data-act="dlMat" data-id="${m.id}">${ic('download')} تنزيل</button>`:'<small class="muted">للمشاهدة فقط</small>'}</span></div><div class="mvb" id="mvb"><div class="loading">جارٍ تحميل الملف…</div></div>`;
  if(!isStaff()){el.classList.add('nodl');el.addEventListener('contextmenu',e=>e.preventDefault());el.addEventListener('dragstart',e=>e.preventDefault())}document.body.appendChild(el);document.body.classList.add('noscroll');MAT={id,url:null,alive:true};const me=MAT;
  try{let blob=m.inline!=null?new Blob([m.inline],{type:'text/html'}):await matBlob(m);if(!me.alive)return;if(!blob)throw new Error('تعذّر تحميل الملف');
    const box=$('#mvb',el);
    if(m.format==='pdf'){box.innerHTML='<div class="pdfpages" id="pdfpages"></div>';const pdfjs=await loadPdfjs();const pdf=await pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer())}).promise;const host=$('#pdfpages',el);
      const W=Math.min(host.clientWidth||900,1000),dpr=Math.min(2,window.devicePixelRatio||1);
      for(let i=1;i<=pdf.numPages;i++){if(!me.alive)return;const pg=await pdf.getPage(i),v0=pg.getViewport({scale:1}),vp=pg.getViewport({scale:W/v0.width*dpr});const c=document.createElement('canvas');c.width=Math.round(vp.width);c.height=Math.round(vp.height);c.style.width='100%';host.appendChild(c);await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise}}
    else{const html=new Blob([await blob.arrayBuffer(),MAT_FIX],{type:'text/html;charset=utf-8'});me.url=URL.createObjectURL(html);box.innerHTML=`<iframe class="mvf" sandbox="allow-scripts ${isStaff()?'allow-downloads allow-popups ':''}allow-modals allow-forms" referrerpolicy="no-referrer" src="${me.url}" title="${esc(m.title)}"></iframe>`}}
  catch(e){if(me.alive)$('#mvb',el).innerHTML=`<div class="panel" style="margin:20px">${esc(errMsg(e))}</div>`}}
function closeMat(silent){const el=$('#matView');if(el)el.remove();document.body.classList.remove('noscroll');if(MAT){MAT.alive=false;if(MAT.url)URL.revokeObjectURL(MAT.url)}MAT=null}
window.__closeMat=closeMat;

/* ================= الطلاب: الاستيراد والحسابات والبطاقات ================= */
function nextExamNos(n){const used=new Set(S.students.map(s=>String(s.examNo||'')).filter(Boolean));const nums=[...used].map(Number).filter(x=>x>0&&x<1e9);let k=Math.max(1000,...nums)+1;const out=[];while(out.length<n){if(!used.has(String(k))){out.push(String(k));used.add(String(k))}k++}return out}
async function makeAccount(s,username,password){const taken=new Set(S.users.map(u=>u.username));let un=String(username||('s'+(s.examNo||uid().slice(-5)))).trim().toLowerCase().replace(/[^a-z0-9._-]/g,'');if(un.length<3)un='s'+(s.examNo||uid().slice(-5));let base=un,k=2;while(taken.has(un))un=base+'_'+k++;
  const pw=password&&String(password).length>=6?String(password):genPw();
  await API.createUser({username:un,password:pw,name:s.name,role:'student',studentId:s.id});await API.saveCred(s.id,un,pw);
  if(API.mode!=='demo'){S.users.push({id:'tmp'+uid(),username:un,name:s.name,role:'student',studentId:s.id});S.creds=S.creds.filter(c=>c.sid!==s.id);S.creds.push({sid:s.id,username:un,password:pw})}
  return{username:un,password:pw}}
async function readTable(file){const nm=file.name.toLowerCase();
  if(/\.(xlsx|xls|csv)$/.test(nm)){const X=await loadXLSX();const wb=X.read(await file.arrayBuffer(),{type:'array'});let rows=[];wb.SheetNames.forEach(n=>{rows=rows.concat(X.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:false}))});return rows.map(r=>r.map(c=>String(c??'').trim())).filter(r=>r.some(Boolean))}
  if(/\.html?$/.test(nm)){const doc=new DOMParser().parseFromString(await file.text(),'text/html');const tbs=[...doc.querySelectorAll('table')].sort((a,b)=>b.rows.length-a.rows.length);
    if(tbs[0])return [...tbs[0].rows].map(r=>[...r.cells].map(c=>c.textContent.replace(/\s+/g,' ').trim())).filter(r=>r.some(Boolean));
    return [...doc.querySelectorAll('li,p,div')].filter(e=>!e.children.length).map(e=>[e.textContent.replace(/\s+/g,' ').trim()]).filter(r=>r[0])}
  if(/\.pdf$/.test(nm)){const pdfjs=await loadPdfjs();const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const rows=[];
    for(let i=1;i<=pdf.numPages;i++){const tc=await(await pdf.getPage(i)).getTextContent();const L={};tc.items.forEach(it=>{const y=Math.round(it.transform[5]/4);(L[y]=L[y]||[]).push(it)});
      Object.keys(L).sort((a,b)=>b-a).forEach(y=>{const its=L[y].sort((a,b)=>b.transform[4]-a.transform[4]);rows.push([its.map(x=>x.str).join(' ').replace(/\s+/g,' ').trim(),...its.map(x=>x.str.trim()).filter(Boolean)])})}
    return rows.filter(r=>r[0])}
  return (await file.text()).split(/\r?\n/).map(l=>l.split(/\t|,|؛|;/).map(c=>c.trim())).filter(r=>r.some(Boolean))}
const COLS={name:/اسم|الطالب|name/i,spec:/اختصاص|ماد[ةه]|spec/i,school:/مدرس|school/i,grade:/صف|grade/i,phone:/هاتف|موبايل|جوال|phone/i,examNo:/امتحاني|اكتتاب|exam/i,username:/مستخدم|user/i,password:/كلم[ةه]|سر|مرور|pass/i};
function mapStudentRows(rows){let hi=-1,map={};
  for(let i=0;i<Math.min(6,rows.length);i++){const m={};rows[i].forEach((c,j)=>{for(const k in COLS)if(m[k]==null&&COLS[k].test(c)&&c.length<30&&!(k==='name'&&COLS.username.test(c)))m[k]=j});if(m.name!=null){hi=i;map=m;break}}
  if(hi<0){const nc=Math.max(...rows.map(r=>r.length));let best=0,bs=-1;for(let j=0;j<nc;j++){const sc=rows.filter(r=>/^[؀-ۿ\s.]{5,}$/.test(r[j]||'')&&(r[j]||'').trim().split(/\s+/).length>=2).length;if(sc>bs){bs=sc;best=j}}map={name:best}}
  const out=[];rows.slice(hi+1).forEach(r=>{const o={};for(const k in map)o[k]=String(r[map[k]]??'').trim();if(o.name&&/[؀-ۿa-zA-Z]{2}/.test(o.name)&&!/^(الاسم|اسم الطالب|الاسم الكامل|الاسم الثلاثي|اسم|name)$/i.test(o.name.trim()))out.push(o)});return{list:out,map,header:hi>=0}}
async function importStudents(file){let parsed;try{toast('جارٍ قراءة الملف…');parsed=mapStudentRows(await readTable(file))}catch(e){toast(errMsg(e),'err');return}
  const ex=new Set(S.students.map(s=>normAr(s.name).replace(/\s+/g,' ').trim()));const seen=new Set();
  const list=parsed.list.filter(o=>{const k=normAr(o.name).replace(/\s+/g,' ').trim();if(ex.has(k)||seen.has(k))return false;seen.add(k);return true});const dup=parsed.list.length-list.length;
  if(!parsed.list.length){toast('لم أجد أسماء طلاب في الملف. ضع عموداً عنوانه «الاسم».','err');return}
  const cols=Object.keys(parsed.map),LBL={name:'الاسم',spec:'الاختصاص',school:'المدرسة',grade:'الصف',phone:'الهاتف',examNo:'الرقم الامتحاني',username:'اسم المستخدم',password:'كلمة السر'};
  const box=modal(mhead('استيراد طلاب من ملف')+`<p>وُجد <b>${list.length}</b> طالباً جديداً${dup?`، وتُجوهل <b>${dup}</b> لأنهم موجودون أو مكررون`:''}. الأعمدة المقروءة: ${cols.map(c=>LBL[c]).join('، ')}${parsed.header?'':' (لم أجد صف عناوين، فاعتمدت عمود الأسماء)'}.</p>
   <div class="tw" style="max-height:240px;overflow:auto"><table><thead><tr><th>#</th>${cols.map(c=>`<th>${LBL[c]}</th>`).join('')}</tr></thead><tbody>${list.slice(0,60).map((o,i)=>`<tr><td>${i+1}</td>${cols.map(c=>`<td>${esc(o[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
   <div class="fgrid" style="margin-top:12px"><label>الاختصاص الافتراضي (لمن لا اختصاص له في الملف)<input id="impSpec" value="${esc(specName())}"></label><label class="ck"><input type="checkbox" id="impAcc" checked> توليد اسم مستخدم وكلمة سر لكل طالب</label></div>
   <p class="muted" style="font-size:13px">يُولَّد لكل طالب رقم امتحاني، واسم مستخدم من الشكل <b dir="ltr">s1001</b>، وكلمة سر من 6 أرقام (إن لم تكن في الملف). بعدها تجد لكل طالب «بطاقة» فيها بياناته لترسلها إليه.</p>
   <div class="prog" id="impProg"></div><div class="factions"><button class="btn pri" data-imp ${list.length?'':'disabled'}>استيراد ${list.length} طالباً</button><button class="btn" data-close>إلغاء</button></div>`,true);
  $('[data-imp]',box).onclick=async e=>{const btn=e.target;btn.disabled=true;const spec=$('#impSpec',box).value.trim(),acc=$('#impAcc',box).checked,prog=$('#impProg',box);
    const used=new Set(S.students.map(s=>String(s.examNo||'')));const free=nextExamNos(list.length);let fi=0;
    const recs=list.map(o=>{let no=o.examNo&&!used.has(o.examNo)?o.examNo:free[fi++];used.add(no);return{id:uid()+Math.random().toString(36).slice(2,5),name:o.name.replace(/\s+/g,' '),spec:o.spec||spec,school:o.school||'',grade:o.grade||'',phone:o.phone||'',joined:today(),photo:'',examNo:no,_u:o.username,_p:o.password}});
    prog.textContent='جارٍ حفظ الطلاب…';const ok=await mutate(S=>{recs.forEach(r=>{const x={...r};delete x._u;delete x._p;S.students.push(x)});log('استُورد '+recs.length+' طالباً من ملف')});
    if(!ok){btn.disabled=false;return}
    let done=0,fail=0;if(acc){const m=$('#modal');for(const r of recs){if(!m.contains(prog))break;prog.textContent=`جارٍ إنشاء الحسابات: ${done+fail+1} من ${recs.length}…`;try{await makeAccount(stuById(r.id)||r,r._u,r._p);done++}catch(er){console.error(er);fail++}}}
    closeModal();await reload();toast(`استُورد ${recs.length} طالباً${acc?` · حسابات: ${done}${fail?' · تعذّر '+fail:''}`:''} ✓`,fail?'err':'')}}
async function genAccounts(){const noNo=S.students.filter(s=>!s.examNo),noAcc=S.students.filter(s=>!S.users.some(u=>u.studentId===s.id));
  if(!noNo.length&&!noAcc.length){toast('كل الطلاب لديهم أرقام امتحانية وحسابات');return}
  confirmBox(`سيُولَّد رقم امتحاني لـ ${noNo.length} طالباً، وحساب دخول بكلمة سر لـ ${noAcc.length} طالباً. متابعة؟`,async()=>{
    if(noNo.length){const nos=nextExamNos(noNo.length);const ids=Object.fromEntries(noNo.map((s,i)=>[s.id,nos[i]]));await mutate(S=>{S.students.forEach(s=>{if(ids[s.id])s.examNo=ids[s.id]});log('وُلّدت أرقام امتحانية لـ '+noNo.length+' طالباً')})}
    let done=0,fail=0;for(const s of noAcc){toast(`جارٍ إنشاء الحسابات: ${done+fail+1} من ${noAcc.length}…`);try{await makeAccount(stuById(s.id));done++}catch(e){console.error(e);fail++}}
    await reload();toast(`تم ✓ أرقام: ${noNo.length} · حسابات: ${done}${fail?' · تعذّر '+fail:''}`,fail?'err':'')},'توليد')}
const siteUrl=()=>location.origin+location.pathname;
function credText(s){const c=credOf(s.id),u=S.users.find(x=>x.studentId===s.id);
  return `${S.settings.name}\nالاسم: ${s.name}\nالاختصاص: ${s.spec||'—'}\nاسم المستخدم: ${c?c.username:u?u.username:'—'}\nكلمة السر: ${c?c.password:'—'}\nالرقم الامتحاني: ${s.examNo||'—'}\nرابط المنصة: ${siteUrl()}`}
async function credCanvas(s){const c=credOf(s.id),u=S.users.find(x=>x.studentId===s.id);
  try{await Promise.all([document.fonts.load('400 60px Rakkas'),document.fonts.load('700 40px Tajawal'),document.fonts.load('500 40px Tajawal')])}catch(e){}
  const W=1080,H=1240,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  const rr=(a,b,w,h,r)=>{x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()};
  x.fillStyle='#f7eee7';x.fillRect(0,0,W,H);x.fillStyle='#fff9f3';rr(50,50,W-100,H-100,34);x.fill();x.strokeStyle='#e6d6c4';x.lineWidth=3;x.stroke();
  x.save();rr(50,50,W-100,230,34);x.clip();x.fillStyle='#214539';x.fillRect(50,50,W-100,230);x.restore();x.fillStyle='#214539';x.fillRect(50,200,W-100,80);x.fillStyle='#ba925f';x.fillRect(50,280,W-100,8);
  x.direction='rtl';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#f4e3bf';x.font='400 56px Rakkas, Tajawal';x.fillText(S.settings.name,W/2,135,W-160);x.fillStyle='#d9bc8c';x.font='500 30px Tajawal';x.fillText('بطاقة دخول الطالب',W/2,220,W-180);
  x.fillStyle='#214539';x.font='800 54px Tajawal';x.fillText(s.name,W/2,370,W-160);x.fillStyle='#a0763f';x.font='500 34px Tajawal';x.fillText('الاختصاص: '+(s.spec||'—'),W/2,440,W-160);
  const rows=[['اسم المستخدم',c?c.username:u?u.username:'—'],['كلمة السر',c?c.password:'—'],['الرقم الامتحاني',s.examNo||'—']];
  rows.forEach(([l,v],i)=>{const y=520+i*150;x.fillStyle='#f7eee7';rr(110,y,W-220,120,22);x.fill();x.strokeStyle='#e6d6c4';x.lineWidth=2;x.stroke();
    x.direction='rtl';x.textAlign='right';x.fillStyle='#7c8b82';x.font='500 34px Tajawal';x.fillText(l,W-150,y+62);
    x.direction='ltr';x.textAlign='left';x.fillStyle='#214539';x.font='800 56px Tajawal';x.fillText(String(v),150,y+64,W-560)});
  x.direction='rtl';x.textAlign='center';x.fillStyle='#7c8b82';x.font='500 28px Tajawal';x.fillText('تدخل المنصة باسم المستخدم وكلمة السر، وتبدأ كل اختبار برقمك الامتحاني',W/2,1000,W-180);
  x.direction='ltr';x.fillStyle='#214539';x.font='700 30px Tajawal';x.fillText(siteUrl().replace(/^https?:\/\//,''),W/2,1050,W-180);
  x.fillStyle='#ba925f';x.fillRect(110,1100,W-220,3);x.direction='rtl';x.fillStyle='#7c8b82';x.font='500 26px Tajawal';x.fillText('تطوير وإشراف: '+DEV_NAME,W/2,1142,W-180);
  return cv}
async function credCard(sid){const s=stuById(sid);if(!s)return;const c=credOf(sid),u=S.users.find(x=>x.studentId===sid);
  const box=modal(mhead('بطاقة دخول: '+esc(s.name))+`<div class="credwrap"><div class="credimg" id="credImg"><div class="loading">…</div></div><div class="credside">
    <pre class="credtxt" id="credTxt">${esc(credText(s))}</pre>
    ${!u?'<div class="banner">لا يوجد حساب دخول لهذا الطالب بعد.</div>':!c?'<div class="banner">كلمة سر هذا الحساب غير محفوظة في البطاقات. ولّد كلمة جديدة لتظهر هنا.</div>':''}
    <div class="tools"><button class="btn gold" data-cpng>${ic('download')} تنزيل صورة</button><button class="btn" data-ctxt>${ic('copy')} نسخ النص</button>${navigator.share?`<button class="btn" data-cshare>${ic('send')} مشاركة</button>`:''}</div>
    <div class="tools" style="margin-top:8px"><button class="btn" data-cnew>${ic('key')} ${u?'توليد كلمة سر جديدة':'إنشاء حساب دخول'}</button></div></div></div>`,true);
  let cv=null;credCanvas(s).then(x=>{cv=x;const h=$('#credImg',box);if(h){h.innerHTML='';x.style.width='100%';h.appendChild(x)}});
  const blobOf=()=>new Promise(r=>cv.toBlob(r,'image/png'));
  box.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-cpng')&&cv)download(await blobOf(),`بطاقة-${s.name}.png`);
    if(b.hasAttribute('data-ctxt')){try{await navigator.clipboard.writeText(credText(s));toast('نُسخ النص ✓')}catch(er){const r=document.createRange();r.selectNodeContents($('#credTxt',box));const sel=getSelection();sel.removeAllRanges();sel.addRange(r);toast('حدّدت النص، انسخه يدوياً')}}
    if(b.hasAttribute('data-cshare')&&cv){try{const f=new File([await blobOf()],'card.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],text:credText(s)});else await navigator.share({text:credText(s)})}catch(er){}}
    if(b.hasAttribute('data-cnew')){b.disabled=true;try{if(u){const pw=genPw();await API.updateUser(u.id,{password:pw});await API.saveCred(sid,u.username,pw)}else{if(!s.examNo){const no=nextExamNos(1)[0];await mutate(S=>{S.students.find(q=>q.id===sid).examNo=no})}await makeAccount(stuById(sid))}
      closeModal();await reload();toast('تم ✓');credCard(sid)}catch(er){b.disabled=false;toast(errMsg(er),'err')}}})}
function credsCsv(){const rows=[...S.students].sort((a,b)=>String(a.examNo).localeCompare(String(b.examNo),'en',{numeric:true})).map(s=>{const c=credOf(s.id),u=S.users.find(x=>x.studentId===s.id);return[s.name,s.spec,s.school,s.grade,s.examNo,c?c.username:u?u.username:'',c?c.password:'']});
  download(new Blob([toCSV([['الاسم','الاختصاص','المدرسة','الصف','الرقم الامتحاني','اسم المستخدم','كلمة السر'],...rows])],{type:'text/csv;charset=utf-8'}),`بطاقات-الطلاب-${today()}.csv`)}
// قائمة المسموح لهم: مطابقة ملف (Excel / PDF) مع الطلاب بالرقم الامتحاني أو بالاسم
async function importAllowed(stage,file){let rows;try{toast('جارٍ قراءة الملف…');rows=await readTable(file)}catch(e){toast(errMsg(e),'err');return}
  const cells=new Set(),lines=[];rows.forEach(r=>{lines.push(normAr(r.join(' ')).replace(/\s+/g,' '));r.forEach(c=>{c=String(c).trim();if(c)cells.add(normAr(c).replace(/\s+/g,' '))})});const text=' '+lines.join(' \n ')+' ';
  const hit=S.students.filter(s=>{const nm=normAr(s.name).replace(/\s+/g,' ').trim();if(nm.length>4&&(cells.has(nm)||text.includes(nm)))return true;return !!s.examNo&&String(s.examNo).length>=3&&(cells.has(String(s.examNo))||new RegExp('(^|[^0-9])'+s.examNo+'([^0-9]|$)').test(text))});
  if(!hit.length){toast('لم يُطابق أي طالب. تأكد أن الملف يحوي الأسماء كما في المنصة أو الأرقام الامتحانية.','err');return}
  const g=stageById(stage);confirmBox(`طابقتُ <b>${hit.length}</b> طالباً من الملف مع طلاب المنصة (من ${rows.length} سطراً). أضيفهم إلى قائمة «${esc(g.name)}» وأحصر الدخول بالقائمة؟<div class="muted" style="max-height:160px;overflow:auto;margin-top:8px;font-size:13px">${hit.map(s=>esc(s.name)).join('، ')}</div>`,()=>{setStage(stage,g=>{g.allowed=[...new Set([...(g.allowed||[]),...hit.map(s=>s.id)])];g.restrict=true});toast(`أُضيف ${hit.length} طالباً إلى القائمة ✓`)},'إضافة')}
function pickAllowed(stage){const g=stageById(stage),cur=new Set(g.allowed||[]);
  const box=modal(mhead('الطلاب المسموح لهم: '+esc(g.name))+`<div class="tools" style="margin-bottom:8px"><input id="pkq" placeholder="بحث بالاسم أو الرقم" style="flex:1"><button class="btn sm" data-pall="1">تحديد الكل</button><button class="btn sm" data-pall="0">إلغاء الكل</button></div>
   <div class="picklist">${S.students.map(s=>`<label class="chip" data-k="${esc(normAr(s.name)+' '+(s.examNo||''))}"><input type="checkbox" value="${s.id}" ${cur.has(s.id)?'checked':''}> ${esc(s.name)} <small dir="ltr">${esc(s.examNo||'')}</small></label>`).join('')||'<div class="empty">لا طلاب بعد</div>'}</div>
   <div class="factions" style="margin-top:12px"><button class="btn pri" data-psave>حفظ القائمة</button><button class="btn" data-close>إلغاء</button></div>`,true);
  $('#pkq',box).oninput=e=>{const q=normAr(e.target.value.trim());$$('.picklist label',box).forEach(l=>l.style.display=!q||l.dataset.k.includes(q)?'':'none')};
  box.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.pall!=null)$$('.picklist label',box).forEach(l=>{if(l.style.display!=='none')$('input',l).checked=b.dataset.pall==='1'});
    if(b.hasAttribute('data-psave')){const ids=$$('.picklist input:checked',box).map(i=>i.value);closeModal();setStage(stage,g=>{g.allowed=ids;if(ids.length)g.restrict=true});toast('حُفظت القائمة ✓')}})}
Object.assign(ACT,{
  openStage:el=>{const id=el.dataset.id,g=stageById(id);if(!isStaff()&&!g.open){toast('هذه المرحلة مغلقة حالياً');return}go('lectures:'+id)},
  addMat:el=>matForm(el.dataset.stage,el.dataset.kind,el.dataset.axis),
  addSec:el=>secForm(el.dataset.stage),editSec:el=>secForm(el.dataset.stage,secOf(el.dataset.stage,el.dataset.id)),
  defSecs:el=>setStage(el.dataset.stage,g=>{g.sections=defSections(SPECS[0])}),
  delSec:el=>{const x=secOf(el.dataset.stage,el.dataset.id),n=matsOf(el.dataset.stage,'session',x.id).length;confirmBox(`حذف «${esc(x.name)}»؟${n?` محاضراته (${n}) لا تُحذف، بل تنتقل إلى «محاضرات عامة».`:''}`,()=>setStage(el.dataset.stage,g=>{g.sections=(g.sections||[]).filter(q=>q.id!==x.id)}))},
  editMat:el=>{const m=S.materials.find(x=>x.id===el.dataset.id);matForm(m.stage,m.kind,m.axis,m)},
  delMat:el=>{const m=S.materials.find(x=>x.id===el.dataset.id);confirmBox(`حذف «${esc(m.title)}» نهائياً؟`,async()=>{await mutate(S=>{S.materials=S.materials.filter(x=>x.id!==m.id);log('حُذف ملف: '+m.title)});if(m.path)API.delFiles([m.path]).catch(()=>{})})},
  openMat:el=>openMaterial(el.dataset.id),closeMat:()=>closeMat(),
  dlMat:async el=>{if(!isStaff())return;const m=S.materials.find(x=>x.id===el.dataset.id);const b=m.inline!=null?new Blob([m.inline],{type:'text/html'}):await API.getFile(m.path);if(b)download(b,m.title+'.'+(m.format==='pdf'?'pdf':'html'));else toast('تعذّر تنزيل الملف','err')},
  stToggle:el=>{const k=el.dataset.k;setStage(el.dataset.id,g=>{g[k]=!g[k];log((k==='open'?(g.open?'فُتحت ':'أُغلقت '):'عُدّل حصر الدخول في ')+g.name)})},
  stGenPw:el=>{el.closest('form').pw.value=genPw()},
  stKick:el=>confirmBox('إخراج كل الطلاب من هذه المرحلة؟ سيُطلب منهم إدخال كلمة السر من جديد.',async()=>{try{await API.setStagePassword(el.dataset.id,S.stagePw[el.dataset.id]||genPw());await reload();toast('تم ✓')}catch(e){toast(errMsg(e),'err')}},'إخراج'),
  stPick:el=>pickAllowed(el.dataset.id),
  stClear:el=>confirmBox('تفريغ قائمة المسموح لهم؟',()=>setStage(el.dataset.id,g=>{g.allowed=[]})),
  stDrop:el=>setStage(el.dataset.id,g=>{g.allowed=(g.allowed||[]).filter(i=>i!==el.dataset.sid)}),
  importStudents:()=>{const i=document.createElement('input');i.type='file';i.accept='.xlsx,.xls,.csv,.html,.htm,.txt';i.onchange=()=>i.files[0]&&importStudents(i.files[0]);i.click()},
  genAccounts,credCard:el=>credCard(el.dataset.id),credsCsv
});
document.addEventListener('change',e=>{const el=e.target;if(el.id==='allowFile'&&el.files[0]){importAllowed(el.dataset.stage,el.files[0]);el.value=''}});
document.addEventListener('submit',async e=>{const f=e.target;
  if(f.id==='unlockF'){e.preventDefault();const btn=$('button',f);btn.disabled=true;try{await API.unlockStage(f.dataset.stage,f.pw.value);UI.myEx=null;await reload();toast('أهلاً بك في المرحلة ✓')}catch(err){toast(errMsg(err),'err');btn.disabled=false}}
  if(f.id==='unlockX'){e.preventDefault();const btn=$('button',f);btn.disabled=true;try{await API.unlockStage(f.dataset.stage,f.pw.value);UI.xg=UI.xg||{};UI.xg[ME.id+':'+f.dataset.stage]=true;UI.myEx=null;render()}catch(err){toast(errMsg(err),'err');btn.disabled=false}}
  if(f.id==='stPwF'){e.preventDefault();const pw=f.pw.value.trim();if(pw.length<3){toast('كلمة السر 3 أحرف على الأقل','err');return}try{await API.setStagePassword(f.dataset.stage,pw);await reload();toast('حُفظت كلمة السر ✓ وعلى الطلاب إدخالها من جديد')}catch(err){toast(errMsg(err),'err')}}
  if(f.id==='stNameF'){e.preventDefault();const fd=new FormData(f);setStage(f.dataset.stage,g=>{g.name=String(fd.get('name')).trim()||g.name;g.desc=String(fd.get('desc')).trim()});toast('تم الحفظ')}});
window.__back=()=>{if($('#matView')){closeMat();return true}if($('#modal').classList.contains('open')&&!RUN){closeModal();return true}return false};

document.addEventListener('click',e=>{
  if(e.target.id==='modal'||e.target.closest('[data-close]')){closeModal();return}
  const sr=$('#sres');if(sr&&!e.target.closest('.hsearch'))sr.classList.remove('open');
  if(e.target.closest('#modal [data-qadd],#modal [data-qdel],#modal [data-qmv],#modal [data-svsave]'))return;
  const el0=e.target.closest('[data-act]');const g=e.target.closest('[data-go]');
  if(g&&!e.target.closest('button,a,input,select,textarea')){go(g.dataset.go);return}
  const el=el0;if(!el||el.matches('input,textarea,select'))return;
  const fn=ACT[el.dataset.act];if(!fn)return;if((el.tagName==='A'&&el.dataset.act!=='reportFor')||(el.tagName==='BUTTON'&&el.closest('a')))e.preventDefault();fn(el)});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.act==='note'){const{sid,key}=el.dataset,text=el.value;mutate(S=>{const nid=sid+'|'+key;let n=S.notes.find(q=>q.id===nid||(q.sid===sid&&q.key===key));if(!n){n={id:nid,sid,key};S.notes.push(n)}n.text=text});toast('حُفظت الملاحظة');return}
  if(el.id==='st'){UI.sf={...(UI.sf||{q:''}),t:el.value};render()}
  if(el.id==='subf'){UI.subf=el.value;render()}
  if(el.id==='svtf'){UI.svTrack=el.value;render()}
  if(el.id==='rdate'){UI.r.date=el.value||today();render()}
  if(el.id==='rscope'){UI.r.scope=el.value;render()}
  if(el.id==='rtrack'){UI.r.track=el.value;render()}
  if(el.id==='restore'&&el.files[0]){restoreAll(el.files[0]);el.value=''}
});
document.addEventListener('input',e=>{const el=e.target;
  if(el.id==='sq'){UI.sf={...(UI.sf||{t:''}),q:el.value};const pos=el.selectionStart;render();const n=$('#sq');n.focus();n.setSelectionRange(pos,pos)}
  if(el.id==='gsearch')gsearch(el.value)});
document.addEventListener('submit',async e=>{const f=e.target;
  if(f.id==='setId'){e.preventDefault();const fd=new FormData(f),lf=fd.get('logo'),hf=fd.get('hero'),mf=fd.get('heroM');const logo=lf&&lf.size?await readImage(lf,320):null,hero=hf&&hf.size?await readImage(hf,1600,.82,true):null,heroM=mf&&mf.size?await readImage(mf,1200,.82,true):null;
    mutate(S=>{S.settings.name=fd.get('name');S.settings.subtitle=fd.get('subtitle');S.settings.palette=+fd.get('palette');S.settings.theme=fd.get('theme');if(logo)S.settings.logo=logo;if(hero)S.settings.hero=hero;if(heroM)S.settings.heroM=heroM});delete PREFS.palette;delete PREFS.theme;savePrefs();toast('تم الحفظ')}
  if(f.id==='setProg'){e.preventDefault();const fd=new FormData(f);{let sp=fd.get('spec');if(sp==='__other')sp=String(fd.get('specOther')||'').trim()||specName();const old=specName();mutate(S=>{S.settings.startDate=fd.get('startDate');S.settings.portal=String(fd.get('portal')||'').trim();S.settings.spec=sp;if(sp!==old)S.stages.forEach(g=>{if(!S.materials.some(m=>String(m.stage)===g.id&&m.kind==='session'))g.sections=defSections(sp)})})}toast('تم الحفظ')}});
function gsearch(q){const box=$('#sres');q=q.trim();if(!q){box.classList.remove('open');return}const R=[];
  S.students.forEach(s=>s.name.includes(q)&&R.push([`#student:${s.id}`,'user',s.name,'طالب']));
  S.materials.forEach(m=>m.title.includes(q)&&canStage(m.stage)&&R.push([`#lectures:${m.stage}:${m.kind==='past'?'past':secOf(m.stage,m.axis)?'axis:'+m.axis:'axes'}`,'book',m.title,m.kind==='past'?'أسئلة دورات':'محاضرة'+(secOf(m.stage,m.axis)?' · '+secOf(m.stage,m.axis).name:'')]));
  S.tasks.forEach(t=>t.title.includes(q)&&R.push(['#tasks','task',t.title,'وظيفة']));
  S.surveys.forEach(v=>v.title.includes(q)&&R.push([`#survey:${v.id}`,'survey',v.title,'استبيان']));
  box.innerHTML=R.slice(0,12).map(([h,i,l,k])=>`<a href="${h}">${ic(i)}${esc(l)}<small>${k}</small></a>`).join('')||'<a>لا نتائج</a>';box.classList.add('open')}
window.addEventListener('hashchange',()=>{if(RUN)return;ROUTE=(location.hash.slice(1)||'home');if(ROUTE.startsWith('lectures')&&ME&&ME.role==='student'&&UI.myEx!=='loading'&&ROUTE.endsWith(':exams'))UI.myEx=null;if(window.__closeMat)window.__closeMat(true);const sd=$('#side');if(sd)sd.classList.remove('open');render();scrollTo(0,0)});
let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(ME&&!$('#modal').classList.contains('open')&&!(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)))render()},250)});

/* ================= boot ================= */
(async()=>{
  // متصفح الهاتف في وضع «نسخة سطح المكتب»: نعرض تخطيط الهاتف
  try{if(matchMedia('(pointer:coarse)').matches&&Math.min(screen.width,screen.height)<820&&innerWidth>=820)document.body.classList.add('mobile')}catch(e){}
  $('#root').innerHTML='<div class="loading">جارٍ التحميل…</div>';
  S=normalize(null);API.attach(()=>S);
  try{
    const {state,me}=await API.init();
    if(API.mode==='demo'){
      if(!state){S=blankState(true);seedDemo(S,true);await API.commit(null,S)}else S=normalize(state);
      ME=me?S.users.find(u=>u.id===me.id)||null:null;
    }else{S=normalize(state);ME=me;if(ME)await afterLogin()}
  }catch(e){console.error(e);$('#root').innerHTML=`<div class="loading"><div class="panel" style="max-width:520px">تعذّر الاتصال بالخادم: ${esc(errMsg(e))}<br><br><button class="btn pri" onclick="location.reload()">إعادة المحاولة</button></div></div>`;return}
  ROUTE=location.hash.slice(1)||'home';render();
})();
window.__app={get S(){return S},get ME(){return ME},reviewBox,API};
