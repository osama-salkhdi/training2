// مخططات ثلاثية الأبعاد مرسومة على Canvas، بلا مكتبات خارجية
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
/* ================= 3D charts ================= */
export function shade(hex,f){let c=String(hex).replace('#','');if(c.length===3)c=c.split('').map(x=>x+x).join('');const n=parseInt(c,16);const m=v=>clamp(Math.round(f>1?v+(255-v)*(f-1):v*f),0,255);return `rgb(${m(n>>16)},${m(n>>8&255)},${m(n&255)})`}
export function cssv(n){return getComputedStyle(document.body).getPropertyValue(n).trim()}
function prep(cv,h){const w=cv.parentElement.clientWidth||600,dpr=window.devicePixelRatio||1;cv.width=w*dpr;cv.height=h*dpr;cv.style.height=h+'px';const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return{c,w,h}}
function anim(draw){const t0=performance.now();const step=t=>{const k=Math.min(1,(t-t0)/800);draw(1-Math.pow(1-k,3));if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
function tipFor(cv,hit){const wrap=cv.parentElement;let tip=$('.ctip',wrap);if(!tip){tip=document.createElement('div');tip.className='ctip';wrap.appendChild(tip)}
  cv.onmousemove=e=>{const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,h=hit(x,y);if(h){tip.textContent=h;tip.style.display='block';tip.style.left=Math.min(x+12,r.width-tip.offsetWidth-4)+'px';tip.style.top=(y-34)+'px'}else tip.style.display='none'};cv.onmouseleave=()=>tip.style.display='none'}
export function bars3D(cv,items,o={}){
  if(!cv)return;const H=o.height||300,max=o.max||100,unit=o.unit??'%',F=v=>o.dec?(+v).toFixed(o.dec):Math.round(v);
  const {c,w,h}=prep(cv,H);const ink=cssv('--ink'),mut=cssv('--mut'),line=cssv('--line');
  const dx=14,dy=-10,top=26,bot=o.rot?70:46,left=36,right=18,ph=h-top-bot,pw=w-left-right-dx,n=Math.max(items.length,1),slot=pw/n,bw=Math.min(54,slot*.62);
  const y0=top+ph,Y=v=>y0-ph*clamp(v,0,max)/max;const rects=[];
  const draw=k=>{c.clearRect(0,0,w,h);c.font='12px Tajawal, sans-serif';
    c.fillStyle=shade(line.startsWith('#')?line:'#e7dfcf',1);
    c.beginPath();c.moveTo(left,y0);c.lineTo(left+dx,y0+dy);c.lineTo(left+dx+pw,y0+dy);c.lineTo(left+pw,y0);c.closePath();c.globalAlpha=.6;c.fill();c.globalAlpha=1;
    for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);c.strokeStyle=line;c.lineWidth=1;c.beginPath();c.moveTo(left,y);c.lineTo(left+dx,y+dy);c.lineTo(left+dx+pw,y+dy);c.stroke();c.fillStyle=mut;c.textAlign='right';c.fillText(F(v)+(unit==='%'?'%':''),left-6,y+4)}
    c.beginPath();c.moveTo(left+dx,y0+dy);c.lineTo(left+dx,top+dy);c.stroke();
    rects.length=0;
    items.forEach((it,i)=>{const x=left+pw-(i+1)*slot+(slot-bw)/2,v=(it.value||0)*k,yv=Y(v),col=it.color||cssv('--acc')||'#1b6b67';
      c.fillStyle=shade(col,.72);c.beginPath();c.moveTo(x+bw,yv);c.lineTo(x+bw+dx,yv+dy);c.lineTo(x+bw+dx,y0+dy);c.lineTo(x+bw,y0);c.closePath();c.fill();
      const g=c.createLinearGradient(x,0,x+bw,0);g.addColorStop(0,shade(col,1.12));g.addColorStop(1,shade(col,.95));c.fillStyle=g;c.fillRect(x,yv,bw,y0-yv);
      c.fillStyle=shade(col,1.35);c.beginPath();c.moveTo(x,yv);c.lineTo(x+dx,yv+dy);c.lineTo(x+bw+dx,yv+dy);c.lineTo(x+bw,yv);c.closePath();c.fill();
      c.fillStyle=ink;c.textAlign='center';c.font='bold 12px Tajawal, sans-serif';c.fillText(F(v)+unit,x+bw/2+dx/2,yv+dy-5);
      c.font='12px Tajawal, sans-serif';c.fillStyle=mut;let lab=String(it.label||'');const mw=o.rot?bot*1.3:slot-4;while(lab.length>2&&c.measureText(lab).width>mw)lab=lab.slice(0,-2)+'…';
      if(o.rot){c.save();c.translate(x+bw/2,y0+12);c.rotate(-Math.PI/5);c.textAlign='right';c.fillText(lab,0,4);c.restore()}else c.fillText(lab,x+bw/2,y0+18);
      rects.push([x,Math.min(yv+dy,y0-4),x+bw+dx,y0,`${it.label}: ${F(it.value)}${unit}`])});
  };anim(draw);tipFor(cv,(x,y)=>{const r=rects.find(r=>x>=r[0]&&x<=r[2]&&y>=r[1]-14&&y<=r[3]);return r&&r[4]});
  if(o.onClick)cv.onclick=e=>{const b=cv.getBoundingClientRect(),x=e.clientX-b.left;const i=rects.findIndex(r=>x>=r[0]&&x<=r[2]);if(i>=0)o.onClick(items[i])},cv.style.cursor='pointer';
}
export function pie3D(cv,items,o={}){
  if(!cv)return;const H=o.height||250;const {c,w,h}=prep(cv,H);const tot=items.reduce((a,x)=>a+x.value,0)||1;
  const rx=Math.min(w*.42,150),ry=rx*.5,depth=24,cx=w/2,cy=h/2-depth/2+4;const card=cssv('--card');
  const draw=k=>{c.clearRect(0,0,w,h);const span=Math.PI*2*k;let segs=[],a=-Math.PI/2;items.forEach(it=>{const s=a,e=a+span*it.value/tot;segs.push([s,e,it]);a=e});
    for(let d=depth;d>0;d--)segs.forEach(([s,e,it])=>{if(e-s<=0)return;c.fillStyle=shade(it.color,.62+.1*(1-d/depth));c.beginPath();c.moveTo(cx,cy+d);c.ellipse(cx,cy+d,rx,ry,0,s,e);c.closePath();c.fill()});
    segs.forEach(([s,e,it])=>{if(e-s<=0)return;const g=c.createRadialGradient(cx-rx*.3,cy-ry*.5,10,cx,cy,rx);g.addColorStop(0,shade(it.color,1.3));g.addColorStop(1,it.color);c.fillStyle=g;c.beginPath();c.moveTo(cx,cy);c.ellipse(cx,cy,rx,ry,0,s,e);c.closePath();c.fill();c.strokeStyle=card;c.lineWidth=1.5;c.stroke();
      const m=(s+e)/2,pct=Math.round(it.value/tot*100);if(pct>=6&&k>.9){c.fillStyle='#fff';c.font='bold 13px Tajawal, sans-serif';c.textAlign='center';c.fillText(pct+'%',cx+Math.cos(m)*rx*.62,cy+Math.sin(m)*ry*.62+4)}});
    if(o.hole){c.fillStyle=card;c.beginPath();c.ellipse(cx,cy,rx*.45,ry*.45,0,0,Math.PI*2);c.fill();c.fillStyle=cssv('--ink');c.font='800 20px Tajawal, sans-serif';c.textAlign='center';c.fillText(o.hole,cx,cy+7)}};
  anim(draw);
  tipFor(cv,(x,y)=>{const ex=(x-cx)/rx,ey=(y-cy)/ry;if(ex*ex+ey*ey>1)return null;let ang=Math.atan2(y-cy,(x-cx)*ry/rx);let a=-Math.PI/2;for(const it of items){const e=a+Math.PI*2*it.value/tot;let t=ang;while(t<a)t+=Math.PI*2;if(t<=e)return `${it.label}: ${it.value} (${Math.round(it.value/tot*100)}%)`;a=e}return null});
}
export const legend=items=>`<div class="legend">${items.map(i=>`<span><i style="background:${i.color}"></i>${esc(i.label)} (${i.value})</span>`).join('')}</div>`;
