// Interacción de las tres fases de Más allá del brillo.
(()=>{
const phase=document.body.dataset.phase;

if(phase==='inicio'){
const canvas=document.querySelector('#space'),svg=document.querySelector('#constellations');
let seed=739;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const ns='http://www.w3.org/2000/svg';
function element(tag,attrs,parent=svg){const node=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))node.setAttribute(key,value);parent.append(node);return node}
function paint(){
 seed=739;const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 // A blue cloud of distant starlight follows the left edge.
 const mist=ctx.createRadialGradient(-w*.09,h*.45,0,w*.02,h*.5,w*.4);mist.addColorStop(0,'#053574');mist.addColorStop(.5,'#031b3d');mist.addColorStop(1,'#02050b');ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
 for(let i=0;i<3700;i++){const y=random()*h,x=(random()**2)*w*.28+Math.sin(y/h*15)*w*.018;const r=random()*4+.3;ctx.fillStyle=`rgba(8,83,177,${random()*.24})`;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
 for(let i=0;i<w*h/1500;i++){const x=random()*w,y=random()*h;ctx.fillStyle=`rgba(165,205,244,${random()*.32+.06})`;ctx.beginPath();ctx.arc(x,y,random()*.65+.15,0,Math.PI*2);ctx.fill()}
 svg.querySelectorAll('g').forEach(g=>g.remove());svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const mobile=w<701;
 const clusters=mobile?[[.15,.58,.84,.66],[.02,.93,.29,.99]]:[[.59,.08,.94,.48],[.07,.65,.37,.92]];
 for(const [left,top,right,bottom]of clusters){const group=element('g',{});const points=Array.from({length:15},()=>({x:(left+random()*(right-left))*w,y:(top+random()*(bottom-top))*h}));points.sort((a,b)=>a.x-b.x);
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];element('path',{d:`M${a.x},${a.y} L${b.x},${b.y}`,pathLength:1,class:'trace',style:`--duration:${7+random()*4}s;--delay:-${random()*10}s`},group);if(i>2&&i%2===0){const c=points[i-3];element('path',{d:`M${c.x},${c.y} L${b.x},${b.y}`,pathLength:1,class:'trace',style:`--duration:10s;--delay:-${random()*10}s`},group)}}
 for(const p of points){const star=element('g',{class:'star-pulse',style:`--delay:-${random()*4}s`},group),r=12+random()*10;element('circle',{cx:p.x,cy:p.y,r,fill:'url(#glow)'},star);element('path',{d:`M${p.x-5},${p.y}h10 M${p.x},${p.y-5}v10`,stroke:'#b9eaff','stroke-width':.7},star);element('circle',{cx:p.x,cy:p.y,r:1.5,class:'star-core'},star)}}
}
addEventListener('resize',paint);paint();

}

else if(phase==='mapa'){
const $=s=>document.querySelector(s),ns='http://www.w3.org/2000/svg',museums=window.MUSEUMS;
// A symbolic CDMX silhouette. Museum positions are not geographic coordinates.
const boundary=museums.filter(museum=>museum.boundary);
const edges=boundary.map((museum,index)=>[museum.id,boundary[(index+1)%boundary.length].id,true]);
function segmentInside(a,b){
 for(let t=.1;t<1;t+=.1){const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;let hit=false;for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){
  const p=boundary[i],q=boundary[j];if((p.y>y)!==(q.y>y)&&x<(q.x-p.x)*(y-p.y)/(q.y-p.y)+p.x)hit=!hit;
 }if(!hit)return false}return true;
}
const interior=museums.filter(museum=>!museum.boundary);
interior.forEach(museum=>{
 const neighbors=museums.filter(other=>other.id!==museum.id).sort((a,b)=>Math.hypot(a.x-museum.x,a.y-museum.y)-Math.hypot(b.x-museum.x,b.y-museum.y)).filter(other=>!museum.newInterior||segmentInside(museum,other)).slice(0,museum.newInterior?2:3);
 neighbors.forEach(other=>{if(!edges.some(([a,b])=>(a===museum.id&&b===other.id)||(b===museum.id&&a===other.id)))edges.push([museum.id,other.id,false])});
});
$('.count').textContent=`${museums.length} museos y espacios culturales`;
$('#viewport').setAttribute('aria-label',`Constelación interactiva de ${museums.length} museos`);
function el(tag,attrs,parent){const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.append(e);return e}
const root=$('#universe');
// Reference coordinates are symbolic, not geographic locations or attendance rankings.
const pos=d=>({x:d.x+180,y:d.y+55});
const threads=edges.map(([a,b,isBoundary],index)=>{
 const p=pos(museums[a-1]),q=pos(museums[b-1]);
 
 const path=el('path',{d:`M ${p.x} ${p.y} L ${q.x} ${q.y}`,class:'thread'},root);
 const length=Math.hypot(q.x-p.x,q.y-p.y);
 return {path,p,q,nx:-(q.y-p.y)/length,ny:(q.x-p.x)/length,phase:index*1.73};
});
// Each anchored connection is drawn toward its neighbor and erased back.
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let threadFrame=null;
threads.forEach(({path})=>{path.setAttribute('pathLength','1');path.style.strokeDasharray='1 1'});
function drawThreads(time){
 const t=time*.001;
 threads.forEach(({path,phase})=>{
  const progress=(1-Math.cos(t*1.05+phase*.35))/2;
  path.style.strokeDashoffset=String(1-progress);
 });
 threadFrame=requestAnimationFrame(drawThreads);
}
function syncThreadMotion(){
 if(threadFrame!==null)cancelAnimationFrame(threadFrame);
 threadFrame=null;
 if(!reducedMotion.matches&&!document.hidden)threadFrame=requestAnimationFrame(drawThreads);
 else threads.forEach(({path})=>{path.style.strokeDashoffset='0'});
}
reducedMotion.addEventListener('change',syncThreadMotion);
document.addEventListener('visibilitychange',syncThreadMotion);
syncThreadMotion();
// Balance each museum label across two or three centered lines.
function museumNameLines(name){
 const words=name.split(/\s+/);
 const count=words.length>6||name.length>36?3:2;
 let best=null;
 function split(start,parts,lines){
  if(parts===1){
   const result=[...lines,words.slice(start).join(' ')];
   const lengths=result.map(line=>line.length);
   const average=lengths.reduce((a,b)=>a+b,0)/count;
   const cost=lengths.reduce((total,len)=>total+(len-average)**2,0);
   if(!best||cost<best.cost)best={lines:result,cost};
   return;
  }
  for(let end=start+1;end<=words.length-parts+1;end++)split(end,parts-1,[...lines,words.slice(start,end).join(' ')]);
 }
 split(0,Math.min(count,words.length),[]);
 return best.lines;
}
const maxVisits2025=Math.max(...museums.map(d=>d.years['2025']?.value||0));
museums.forEach((d,i)=>{const p=pos(d),r=[1,2,3].includes(d.id)?8:d.newInterior?2.6:4;const g=el('g',{class:'star',transform:`translate(${p.x} ${p.y})`,'data-id':d.id},root);const pulseStrength=Math.sqrt((d.years['2025']?.value||0)/maxVisits2025);g.style.setProperty('--pulse-scale',String(1.10+pulseStrength*.65));g.style.setProperty('--pulse-duration',(3.6+(i%5)*.28)+'s');g.style.setProperty('--pulse-delay',(-i*.41)+'s');const hit=el('circle',{r:d.newInterior?13:18,fill:'transparent',role:'button',tabindex:0,'aria-label':d.name},g);const light=el('g',{class:'star-light','aria-hidden':'true'},g);el('circle',{r:r*7,fill:'url(#halo)',class:'halo',opacity:.8},light);el('circle',{r:r*1.7,fill:'#2198ff',filter:'url(#glow)'},light);el('path',{d:`M ${-r*4} 0 H ${r*4} M 0 ${-r*4} V ${r*4} M ${-r*2} ${-r*2} L ${r*2} ${r*2} M ${-r*2} ${r*2} L ${r*2} ${-r*2}`,class:'rays'},light);el('circle',{r,class:'core'},light);el('circle',{r:19,class:'focus-ring'},g);const lines=museumNameLines(d.name),labelX=d.id===24?48:38;
const t=el('text',{x:labelX,y:-15-(lines.length-1)*14,class:'label','text-anchor':'middle'},g);
lines.forEach((line,index)=>{el('tspan',{x:labelX,dy:index===0?0:14},t).textContent=line});g.addEventListener('click',()=>{if(!moved)openMuseum(d,hit)});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openMuseum(d,hit)}})});
const REVEAL_ZOOM=1.35;
// Place labels on both sides of the silhouette, reserving space around stars.
function arrangeMuseumLabels(){
 const placed=[];
 const stars=museums.map(m=>({...pos(m),radius:[1,2,3].includes(m.id)?36:20}));
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 const yancuic=pos(museums.find(museum=>museum.id===39));
 const interiorLabelPositions={39:{x:yancuic.x-42,y:yancuic.y+4}};
 const ordered=[...museums].sort((a,b)=>Number(Boolean(interiorLabelPositions[b.id]))-Number(Boolean(interiorLabelPositions[a.id]))||a.y-b.y);
 ordered.forEach(museum=>{
  const g=document.querySelector(`.star[data-id="${museum.id}"]`),label=g.querySelector('.label');
  const spans=[...label.children],box=label.getBBox(),w=box.width+16,h=box.height+12,p=pos(museum);
  let direction=0;
  const index=boundary.indexOf(museum);
  if(index>=0){const prev=pos(boundary[(index+boundary.length-1)%boundary.length]),next=pos(boundary[(index+1)%boundary.length]);direction=Math.atan2(-(next.x-prev.x),next.y-prev.y)}
  const angles=[direction,direction+Math.PI,0,Math.PI,-Math.PI/2,Math.PI/2,-Math.PI/4,Math.PI/4,-3*Math.PI/4,3*Math.PI/4];
  const preferred=interiorLabelPositions[museum.id];
  let best=null;
  for(const distance of (preferred?[0,25,50,80,110]:[55,80,110,145,185,230,280]))for(let i=0;i<angles.length;i++){
   const angle=angles[i],cx=(preferred?.x??p.x)+Math.cos(angle)*distance,cy=(preferred?.y??p.y)+Math.sin(angle)*distance;
   const rect={x:cx-w/2,y:cy-h/2,w,h};
   let cost=distance+(i===0?0:i===1?8:22);
   for(const other of placed)cost+=overlap(rect,other)*100;
   for(const star of stars)cost+=overlap(rect,{x:star.x-star.radius,y:star.y-star.radius,w:star.radius*2,h:star.radius*2})*100;
   cost+=overlap(rect,{x:0,y:0,w:650,h:490})*20;
   if(rect.x<420||rect.x+w>1580||rect.y<10||rect.y+h>1135)cost+=100000;
   if(!best||cost<best.cost)best={rect,cx,cy,cost};
  }
  placed.push(best.rect);
  const lx=best.cx-p.x,ly=best.cy-p.y-(spans.length-1)*7+4;
  label.setAttribute('x',lx);label.setAttribute('y',ly);
  spans.forEach(span=>span.setAttribute('x',lx));
  let guide=g.querySelector('.label-guide');
  if(!guide){guide=el('line',{class:'label-guide','aria-hidden':'true'},g);g.insertBefore(guide,label)}
  const dx=best.cx-p.x,dy=best.cy-p.y,len=Math.hypot(dx,dy),end=Math.max(22,len-Math.min(w,h)/2-8);
  guide.setAttribute('x1',dx/len*20);guide.setAttribute('y1',dy/len*20);guide.setAttribute('x2',dx/len*end);guide.setAttribute('y2',dy/len*end);
 });
}
document.fonts.ready.then(()=>{if(museums.length<60)arrangeMuseumLabels()});
let scale=1,tx=160,ty=0,moved=false,returnFocus=null;
function render(){root.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);const unlocked=scale>=REVEAL_ZOOM;$('#map').classList.toggle('names',unlocked);document.querySelectorAll('.star [role="button"]').forEach(star=>{star.setAttribute('aria-disabled',String(!unlocked));star.setAttribute('tabindex',unlocked?'0':'-1')});if(museums.length>=60)queueLabelLayout()}
function zoom(f,cx=980,cy=550){const next=Math.min(12,Math.max(.7,scale*f));tx=cx-(cx-tx)*next/scale;ty=cy-(cy-ty)*next/scale;scale=next;render()}
function point(e){const p=$('#map').createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform($('#map').getScreenCTM().inverse())}

const pointers=new Map();let gesture=null;
$('#viewport').addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoom(Math.exp(-e.deltaY*.0015),p.x,p.y)},{passive:false});
$('#viewport').addEventListener('pointerdown',e=>{if(e.button>0)return;const p=point(e);pointers.set(e.pointerId,p);moved=false;if(pointers.size===1)gesture={start:p,tx,ty};else{const a=[...pointers.values()];gesture={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}}$('#viewport').classList.add('dragging')});
window.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const a=[...pointers.values()],dist=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(gesture.distance)zoom(dist/gesture.distance,(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2);gesture={distance:dist};moved=true}else if(gesture?.start){const dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;tx=gesture.tx+dx;ty=gesture.ty+dy;render()}});
function release(e){pointers.delete(e.pointerId);if(pointers.size===1){gesture={start:[...pointers.values()][0],tx,ty}}else gesture=null;$('#viewport').classList.remove('dragging')}
window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
const links={INAH:'https://www.datos.inah.gob.mx/datos-abiertos/visitantes-museos',INBAL:'https://datos.gob.mx/dataset/asistentes_red_museos_historico','The Art Newspaper':'https://www.ccb.pt/wp-content/uploads/2026/04/TOP150ArtNewspaper1.pdf'};
let counterFrame=null;
function stopCounters(){if(counterFrame!==null)cancelAnimationFrame(counterFrame);counterFrame=null}
function animateCounters(){
 stopCounters();
 const counters=[...document.querySelectorAll('#records .counter')];
 const finish=()=>counters.forEach(el=>{el.textContent=Number(el.dataset.value).toLocaleString('es-MX')});
 if(reducedMotion.matches){finish();return}
 const start=performance.now(),duration=1450;
 counters.forEach(el=>{el.textContent='0'});
 function tick(now){
  const progress=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-progress,3);
  counters.forEach(el=>{el.textContent=Math.round(Number(el.dataset.value)*eased).toLocaleString('es-MX')});
  if(progress<1)counterFrame=requestAnimationFrame(tick);
  else{finish();counterFrame=null}
 }
 counterFrame=requestAnimationFrame(tick);
}
$('#card').addEventListener('close',stopCounters);
function openMuseum(d,hit){if(scale<REVEAL_ZOOM)return;returnFocus=hit;$('#museumTitle').textContent=d.name+(d.warning?' ⚠':'');$('#museumDescription').textContent=d.description||'';$('#museumStatus').textContent=d.status||'';$('#museumStatus').hidden=!d.status;$('#museumAddress').textContent=d.address;$('#museumReflection').textContent=d.reflection;$('#museumQuestion').textContent=d.reflectionQuestion;$('#institution').textContent=`ESTRELLA ${String(d.id).padStart(2,'0')} / ${d.source}`;$('#starNumber').textContent='CDMX · '+String(d.id).padStart(2,'0');$('#card h3').textContent='Visitas registradas';$('#records').replaceChildren();for(let y=2023;y<=2026;y++){if((d.id===24&&y===2023)||(d.hideMissing&&d.years[y]?.value==null))continue;const row=document.createElement('div');const item=d.years[y];row.className='record'+(item?.yearLabel?' range':'');row.innerHTML=`<span class="year">${item?.yearLabel||y}</span><div class="value ${item?'':'unavailable'}">${item&&item.value!==null?`<span class="qualifier">${item.qualifier||''}</span><span class="counter" data-value="${item.value}" aria-label="${item.value.toLocaleString('es-MX')}">${item.value.toLocaleString('es-MX')}</span>`+(item.marker||''):item?'ND':'No disponible'}<span class="period">${item?item.period:'Sin cifra verificada'}</span></div>`;if(y===2026&&typeof item?.value!=='number'){row.innerHTML='<span class="year">2026</span><div class="value unavailable">Aún no se publican</div>'}$('#records').append(row)}if(d.attendanceNote){const note=document.createElement('p');note.className='comparison';note.textContent=Object.values(d.years||{}).some(year=>typeof year.value==='number')?d.attendanceNote:'No hay visitas publicadas';$('#records').append(note)}const img=$('#museumImage');img.removeAttribute('src');img.alt='';if(d.image){img.src=d.image;img.alt='Vista de '+d.name}$('#card').showModal();$('#card').scrollTop=0;animateCounters()}
for(const dialog of document.querySelectorAll('dialog')){dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}})}$('#card').addEventListener('close',()=>returnFocus?.focus());
// Deterministic background stars; no remote library or tracking.
function sky(){const c=$('#cosmos'),dpr=Math.min(devicePixelRatio,2);c.width=innerWidth*dpr;c.height=innerHeight*dpr;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';const ctx=c.getContext('2d');ctx.scale(dpr,dpr);let seed=47;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};// Dense distant dust and a few softly glowing nearby stars.
const amount=Math.min(6000,Math.max(1600,Math.round(innerWidth*innerHeight/290)));
for(let i=0;i<amount;i++){
 const x=rnd()*innerWidth,y=rnd()*innerHeight,depth=rnd();
 const radius=depth<.76?.35+rnd()*.40:depth<.98?.7+rnd()*.45:1.1+rnd()*.45;
 const alpha=depth<.76?.24+rnd()*.28:depth<.98?.42+rnd()*.28:.65+rnd()*.18;
 // Keep the central constellation visually dominant.
 const distance=Math.hypot((x/innerWidth-.59)/.25,(y/innerHeight-.5)/.55);
 const quiet=distance<1?.76:1;
 ctx.fillStyle=`rgba(190,213,245,${alpha*quiet})`;
 if(depth>.98){ctx.shadowColor='rgba(135,185,255,.45)';ctx.shadowBlur=4}
 ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
}
for(let i=0;i<2200;i++){const y=rnd()*innerHeight,x=(Math.sin(y*.009)*.055+.06)*innerWidth+rnd()*innerWidth*.13;ctx.fillStyle=`rgba(0,95,225,${rnd()*.13})`;ctx.beginPath();ctx.arc(x,y,rnd()*6,0,Math.PI*2);ctx.fill()}}
// With the full directory, reveal readable names progressively as the user zooms.
let labelLayoutFrame=null,activeLabelId=null;
function queueLabelLayout(){if(labelLayoutFrame!==null)return;labelLayoutFrame=requestAnimationFrame(()=>{labelLayoutFrame=null;arrangeDenseLabels()})}
function arrangeDenseLabels(){
 if(museums.length<60||scale<REVEAL_ZOOM)return;
 const matrix=$('#map').getScreenCTM(),unit=matrix.a*scale,font=12/unit;
 const placed=[],reserved=[...document.querySelectorAll('header,.controls,footer')].map(el=>el.getBoundingClientRect());
 const intersects=(a,b,pad=4)=>a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;
 const projected=museums.map(m=>{const p=pos(m);return {id:m.id,x:matrix.a*(tx+scale*p.x)+matrix.e,y:matrix.d*(ty+scale*p.y)+matrix.f,r:Math.max(5,([1,2,3].includes(m.id)?8:m.newInterior?2.6:4)*unit)+3}});
 const ordered=[...museums].sort((a,b)=>Number(b.id===activeLabelId)-Number(a.id===activeLabelId)||Number(a.newInterior||false)-Number(b.newInterior||false)||a.id-b.id);
 for(const m of ordered){
  const g=document.querySelector(`.star[data-id="${m.id}"]`),label=g.querySelector('.label'),p=projected[m.id-1];
  g.classList.add('label-hidden');
  if(p.x<-80||p.x>innerWidth+80||p.y<-60||p.y>innerHeight+60)continue;
  label.style.fontSize=font+'px';label.style.strokeWidth=(3/unit)+'px';
  const spans=[...label.children];spans.forEach((span,i)=>span.setAttribute('dy',i?font*1.2:0));
  const box=label.getBBox(),w=box.width*unit+6,h=box.height*unit+6;
  let best=null;
  for(const extra of [8,26,48])for(const [dx,dy]of [[1,0],[-1,0],[0,-1],[0,1],[1,-1],[-1,1],[1,1],[-1,-1]]){
   const cx=p.x+dx*(w/2+p.r+extra),cy=p.y+dy*(h/2+p.r+extra),rect={x:cx-w/2,y:cy-h/2,w,h};
   if(rect.x<8||rect.x+w>innerWidth-8||rect.y<8||rect.y+h>innerHeight-8)continue;
   if(reserved.some(r=>intersects(rect,{x:r.x,y:r.y,w:r.width,h:r.height})))continue;
   if(placed.some(r=>intersects(rect,r)))continue;
   if(projected.some(s=>intersects(rect,{x:s.x-s.r,y:s.y-s.r,w:s.r*2,h:s.r*2},1)))continue;
   best={rect,cx,cy};break;
  }
  if(!best)continue;
  placed.push(best.rect);g.classList.remove('label-hidden');
  const lx=(best.cx-p.x)/unit,ly=(best.cy-p.y)/unit-(spans.length-1)*font*.6+font*.32;
  label.setAttribute('x',lx);label.setAttribute('y',ly);spans.forEach(span=>span.setAttribute('x',lx));
  let guide=g.querySelector('.label-guide');if(!guide){guide=el('line',{class:'label-guide','aria-hidden':'true'},g);g.insertBefore(guide,label)}
  const dx=best.cx-p.x,dy=best.cy-p.y,len=Math.hypot(dx,dy),end=Math.max(p.r,len-Math.min(w,h)/2-4);
  guide.setAttribute('x1',dx/len*p.r/unit);guide.setAttribute('y1',dy/len*p.r/unit);guide.setAttribute('x2',dx/len*end/unit);guide.setAttribute('y2',dy/len*end/unit);
 }
}
if(museums.length>=60){
 document.querySelectorAll('.star').forEach(g=>{
  g.addEventListener('mouseenter',()=>{activeLabelId=Number(g.dataset.id);queueLabelLayout()});
  g.addEventListener('mouseleave',()=>{activeLabelId=null;queueLabelLayout()});
  g.addEventListener('focusin',()=>{activeLabelId=Number(g.dataset.id);queueLabelLayout()});
 });
 addEventListener('resize',queueLabelLayout);document.fonts.ready.then(queueLabelLayout);
}

window.addEventListener('resize',sky);sky();render();
// Refresh the local preview when an HTML, CSS or JavaScript file is saved.
if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){
 let stamp=null;
 setInterval(async()=>{try{const paths=['experiencia.html','estilo.css','main.js','datos.js'];const current=(await Promise.all(paths.map(async path=>{const r=await fetch(path,{method:'HEAD',cache:'no-store'});return r.headers.get('last-modified')+'|'+r.headers.get('content-length')}))).join(';');if(stamp!==null&&stamp!==current)location.reload();stamp=current}catch{}},2000);
}


// Alphabetical directory: every museum can be selected from one list.
const museumSelect=$('#museumSelect');
[...museums].sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'})).forEach(m=>{
 const option=document.createElement('option');option.value=m.id;option.textContent=m.name;museumSelect.append(option);
});
museumSelect.addEventListener('change',()=>{
 const museum=museums.find(m=>m.id===Number(museumSelect.value));if(!museum)return;
 document.querySelectorAll('.star.located').forEach(star=>star.classList.remove('located'));
 const star=document.querySelector(`.star[data-id="${museum.id}"]`);star.classList.add('located');
 activeLabelId=museum.id;
 const p=pos(museum);tx=980-p.x*scale;ty=550-p.y*scale;render();

});

}

else if(phase==='reflexion'){
// Decorative crop of the same constellation: no targets, names or interaction.
(()=>{
 const canvas=document.querySelector('#reflectionSky');
 function sky(){
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);let seed=739;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};
  const mist=ctx.createRadialGradient(-w*.09,h*.45,0,w*.02,h*.5,w*.4);mist.addColorStop(0,'#053574');mist.addColorStop(.5,'#031b3d');mist.addColorStop(1,'#02050b');ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
  for(let i=0;i<3700;i++){const y=random()*h,x=random()**2*w*.28+Math.sin(y/h*15)*w*.018;ctx.fillStyle=`rgba(8,83,177,${random()*.24})`;ctx.beginPath();ctx.arc(x,y,random()*4+.3,0,Math.PI*2);ctx.fill()}
  for(let i=0;i<w*h/1400;i++){ctx.fillStyle=`rgba(165,205,244,${random()*.3+.06})`;ctx.beginPath();ctx.arc(random()*w,random()*h,random()*.65+.15,0,Math.PI*2);ctx.fill()}
 }
 sky();addEventListener('resize',sky);
 const ns='http://www.w3.org/2000/svg',group=document.querySelector('#decoration'),museums=window.MUSEUMS;
 function el(tag,attrs,parent=group){const node=document.createElementNS(ns,tag);for(const[key,value]of Object.entries(attrs))node.setAttribute(key,value);parent.append(node);return node}
 const boundary=museums.filter(m=>m.boundary),edges=boundary.map((m,i)=>[m,boundary[(i+1)%boundary.length]]);
 museums.filter(m=>!m.boundary).forEach(m=>{museums.filter(n=>n!==m).sort((a,b)=>Math.hypot(a.x-m.x,a.y-m.y)-Math.hypot(b.x-m.x,b.y-m.y)).slice(0,2).forEach(n=>{if(!edges.some(([a,b])=>a===m&&b===n||a===n&&b===m))edges.push([m,n])})});
 edges.forEach(([a,b],i)=>el('path',{d:`M${a.x} ${a.y}L${b.x} ${b.y}`,pathLength:1,class:'decoration-thread',style:`--duration:${5+i%5}s;--delay:-${i*.37}s`}));
 const max=Math.max(...museums.map(m=>m.years['2025']?.value||0));
 museums.forEach((m,i)=>{
  const r=[1,2,3].includes(m.id)?7:m.newInterior?2.2:3.3;
  const g=el('g',{transform:`translate(${m.x} ${m.y})`}),light=el('g',{class:'decor-light',style:`--pulse:${1.12+Math.sqrt((m.years['2025']?.value||0)/max)*.55};--duration:${3.6+i%5*.25}s;--delay:-${i*.41}s`},g);
  el('circle',{r:r*7,fill:'url(#reflectionHalo)'},light);
  el('path',{d:`M${-r*4} 0H${r*4}M0 ${-r*4}V${r*4}M${-r*2} ${-r*2}L${r*2} ${r*2}M${-r*2} ${r*2}L${r*2} ${-r*2}`,stroke:'#aee7ff','stroke-width':.8,opacity:.85},light);
  el('circle',{r,fill:'#e5faff'},light);
 });
 const dialog=document.querySelector('#projectDialog'),button=document.querySelector('#projectButton');
 button.onclick=()=>{dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.dialog-close').focus({preventScroll:true})};
 dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>button.focus());
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
})();

}

})();

// Música compartida.
// One persistent soundtrack in the entry page serves all three phases.
(()=>{
 const embedded=new URLSearchParams(location.search).has('embedded');
 document.querySelector('.music-controls')?.remove();
 if(embedded){
  document.querySelector('#experienceMusic')?.remove();
  const unlock=()=>parent.postMessage({type:'start-soundtrack'},location.origin);
  document.addEventListener('pointerdown',unlock);
  document.addEventListener('keydown',unlock);
  return;
 }
 const audio=document.querySelector('#experienceMusic');if(!audio)return;
 audio.loop=true;audio.autoplay=true;audio.controls=false;audio.volume=0;
 const peakVolume=.35,fadeInSeconds=4,fadeOutSeconds=5;
 let entranceTime=null;
 function updateFade(){
  const entrance=entranceTime===null?0:(performance.now()-entranceTime)/1000/fadeInSeconds;
  const loopEntrance=audio.currentTime/fadeInSeconds;
  const ending=Number.isFinite(audio.duration)?(audio.duration-audio.currentTime)/fadeOutSeconds:1;
  const gain=Math.max(0,Math.min(1,entrance,loopEntrance,ending));
  audio.volume=peakVolume*gain;
 }
 audio.addEventListener('play',()=>{if(entranceTime===null)entranceTime=performance.now();updateFade()});
 audio.addEventListener('timeupdate',updateFade);
 if(!audio.paused)entranceTime=performance.now();
 setInterval(()=>{if(!audio.paused)updateFade()},50);
 let saved={};try{saved=JSON.parse(sessionStorage.getItem('soundtrack')||'{}')}catch{}
 let starting=false;
 async function play(){
  if(starting||!audio.paused)return;
  starting=true;
  try{await audio.play()}catch{}finally{starting=false}
 }
 audio.addEventListener('loadedmetadata',()=>{
  if(Number.isFinite(saved.time)&&saved.time>0&&saved.time<audio.duration)audio.currentTime=saved.time;
  play();
 },{once:true});
 function save(){try{sessionStorage.setItem('soundtrack',JSON.stringify({time:audio.currentTime}))}catch{}}
 audio.addEventListener('timeupdate',save);addEventListener('pagehide',save);
 document.addEventListener('pointerdown',play);document.addEventListener('keydown',play);
 addEventListener('message',event=>{
  const trustedFrame=[...document.querySelectorAll('#phaseTwo,#phaseThree')].some(frame=>frame.contentWindow===event.source);
  if(event.origin===location.origin&&trustedFrame&&event.data?.type==='start-soundtrack')play();
 });
 play();
})();


// Navegación entre fases.
(()=>{
 const embedded=new URLSearchParams(location.search).has('embedded');
 if(embedded){
  for(const [selector,type]of [['.back-home','show-intro'],['.next-reflection','show-reflection'],['.back-map','show-map']]){
   document.querySelector(selector)?.addEventListener('click',event=>{event.preventDefault();parent.postMessage({type},location.origin)});
  }
  return;
 }
 const mapFrame=document.querySelector('#phaseTwo');if(!mapFrame)return;
 const reflectionFrame=document.createElement('iframe');
 reflectionFrame.id='phaseThree';reflectionFrame.title='Fase 3 · Reflexión';reflectionFrame.hidden=true;
 document.body.append(reflectionFrame);
 const frames=[mapFrame,reflectionFrame];
 let transitionId=0,activeFrame=null;
 const hideTimers=new Map();
 function cancelHides(){for(const timer of hideTimers.values())clearTimeout(timer);hideTimers.clear()}
 function hideAfterFade(frame){
  frame.classList.remove('phase-visible');
  hideTimers.set(frame,setTimeout(()=>{if(frame!==activeFrame)frame.hidden=true;hideTimers.delete(frame)},900));
 }
 async function showPhase(phase){
  const id=++transitionId;cancelHides();
  const incoming=phase===3?reflectionFrame:mapFrame;
  const src=phase===3?'reflexion.html?embedded=1':'experiencia.html?embedded=1';
  // Prepare the incoming page separately: the outgoing page remains visible and intact.
  if(incoming!==activeFrame)incoming.classList.remove('phase-visible');
  incoming.hidden=false;
  if((phase===2&&incoming!==activeFrame)||incoming.getAttribute('src')!==src){
   await new Promise(resolve=>{incoming.addEventListener('load',resolve,{once:true});incoming.src=src});
  }
  try{await incoming.contentDocument.fonts.ready}catch{}
  if(id!==transitionId)return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(id!==transitionId)return;
   const outgoing=activeFrame;activeFrame=incoming;
   document.body.classList.add('in-map');incoming.classList.add('phase-visible');
   if(outgoing&&outgoing!==incoming)hideAfterFade(outgoing);
   document.title=phase===3?'Más allá del brillo · Reflexión':'Más allá del brillo · Constelación de museos';
  }));
 }
 function showIntro(){
  ++transitionId;cancelHides();activeFrame=null;
  document.body.classList.remove('in-map');document.title='Más allá del brillo · Inicio';
  frames.forEach(hideAfterFade);
 }
 function go(phase){history.pushState({phase},'',phase===1?location.pathname:'#fase-'+phase);if(phase===1)showIntro();else showPhase(phase)}
 document.querySelector('.start').addEventListener('click',event=>{event.preventDefault();go(2)});
 addEventListener('message',event=>{
  if(event.origin!==location.origin||!frames.some(frame=>frame.contentWindow===event.source))return;
  if(event.data?.type==='show-intro')go(1);
  else if(event.data?.type==='show-map')go(2);
  else if(event.data?.type==='show-reflection')go(3);
 });
 function restore(){if(location.hash==='#fase-3')showPhase(3);else if(location.hash==='#fase-2')showPhase(2);else showIntro()}
 addEventListener('popstate',restore);restore();
})();
