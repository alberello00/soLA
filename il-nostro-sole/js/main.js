// Stato, aggregazione per giorno, disegno D3 e interazioni
(function(){
const TYPES=[
  {k:'testo',label:'Messaggi di testo'},
  {k:'foto',label:'Foto'},
  {k:'audio',label:'Vocali'},
  {k:'video',label:'Video'},
  {k:'sticker',label:'Sticker e GIF'},
  {k:'link',label:'Link e posizioni'},
  {k:'documento',label:'Documenti'},
  {k:'chiamata',label:'Chiamate'},
  {k:'media',label:'Media senza tipo'}
];
const LABEL=Object.fromEntries(TYPES.map(t=>[t.k,t.label]));
const MESI=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const fmtDay=d=>`${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;

/* ---------- stato ---------- */
const state={msgs:[],days:[],people:[],active:new Set(TYPES.map(t=>t.k)),mode:'all',isExample:true,fileName:''};

function aggregate(msgs){
  msgs.sort((a,b)=>a.date-b.date);
  const start=d3.timeDay.floor(msgs[0].date),end=d3.timeDay.floor(msgs[msgs.length-1].date);
  const range=d3.timeDay.range(start,d3.timeDay.offset(end,1));
  const idx=new Map(range.map((d,i)=>[+d,i]));
  const days=range.map(d=>({date:d,byType:{},byWho:{}}));
  const cnt={};
  for(const m of msgs){
    const day=days[idx.get(+d3.timeDay.floor(m.date))];if(!day)continue;
    day.byType[m.type]=(day.byType[m.type]||0)+1;
    (day.byWho[m.who]||(day.byWho[m.who]={}))[m.type]=(day.byWho[m.who][m.type]||0)+1;
    cnt[m.who]=(cnt[m.who]||0)+1;
  }
  state.people=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(e=>e[0]);
  state.days=days;
}
const sumActive=o=>{let s=0;if(!o)return 0;for(const k in o)if(state.active.has(k))s+=o[k];return s};

/* ---------- disegno ---------- */
const svg=d3.select('#sun');
const R_OUT=400;
let geom={};
function render(){
  const days=state.days,N=days.length,split=state.mode==='split'&&state.people.length>=2;
  const [pA,pB]=state.people;
  const r0=split?235:150;
  svg.selectAll('*').remove();
  const ang=i=>(i/N)*Math.PI*2-Math.PI/2;
  const width=Math.max(0.5,Math.min(6,(2*Math.PI*r0/N)*0.78));
  geom={N,r0,split,ang};

  // nucleo
  svg.append('circle').attr('class','core').attr('r',split?62:r0-6);
  svg.append('circle').attr('class','ring').attr('r',r0);

  // scale
  let maxOut=1,maxIn=1;
  for(const d of days){
    if(split){maxOut=Math.max(maxOut,sumActive(d.byWho[pA]));maxIn=Math.max(maxIn,sumActive(d.byWho[pB]))}
    else maxOut=Math.max(maxOut,sumActive(d.byType));
  }
  if(split){const m=Math.max(maxOut,maxIn);maxOut=maxIn=m}
  const sOut=d3.scaleSqrt().domain([0,maxOut]).range([0,R_OUT-r0-4]);
  const sIn=d3.scaleSqrt().domain([0,maxIn]).range([0,r0-78]);

  const order=TYPES.map(t=>t.k).filter(k=>state.active.has(k));
  const raysG=svg.append('g').attr('class','rays');
  const drawStack=(g,counts,scale,dir,a)=>{
    const tot=sumActive(counts);if(!tot)return;
    const L=scale(tot);let r=r0+dir*2;
    const cx=Math.cos(a),cy=Math.sin(a);
    for(const k of order){
      const c=counts[k];if(!c)continue;
      const seg=L*c/tot;
      g.append('line').attr('class','ray').style('stroke',`var(--t-${k})`).attr('stroke-width',width)
        .attr('x1',cx*r).attr('y1',cy*r).attr('x2',cx*(r+dir*seg)).attr('y2',cy*(r+dir*seg));
      r+=dir*seg;
    }
  };
  days.forEach((d,i)=>{
    const g=raysG.append('g').attr('data-i',i);
    const a=ang(i+0.5);
    if(split){drawStack(g,d.byWho[pA],sOut,1,a);drawStack(g,d.byWho[pB],sIn,-1,a)}
    else drawStack(g,d.byType,sOut,1,a);
  });

  // tacche dei mesi e etichette
  const start=days[0].date,end=d3.timeDay.offset(days[N-1].date,1);
  const months=d3.timeMonth.range(d3.timeMonth.ceil(start),end);
  const showMonthLabels=months.length<=40;
  const tg=svg.append('g');
  for(const m of months){
    const i=d3.timeDay.count(start,m);const a=ang(i);
    const isYear=m.getMonth()===0;
    const r1=R_OUT+6,r2=R_OUT+(isYear?26:14);
    tg.append('line').attr('class','tick').attr('x1',Math.cos(a)*r1).attr('y1',Math.sin(a)*r1).attr('x2',Math.cos(a)*r2).attr('y2',Math.sin(a)*r2);
    if(isYear||showMonthLabels){
      const rl=R_OUT+(isYear?50:32);
      tg.append('text').attr('class',isYear?'yearlab':'ticklab').attr('x',Math.cos(a)*rl).attr('y',Math.sin(a)*rl)
        .attr('text-anchor','middle').attr('dominant-baseline','middle')
        .text(isYear?m.getFullYear():MESI[m.getMonth()]);
    }
  }
  // inizio
  tg.append('line').attr('class','tick').attr('x1',0).attr('y1',-r0+2).attr('x2',0).attr('y2',-R_OUT-30).style('stroke-dasharray','2 4');

  // centro
  const c=svg.append('g').attr('id','center');
  if(!split){
    c.append('text').attr('class','center-small').attr('y',-38).text('giorni insieme');
    c.append('text').attr('class','center-big').attr('id','cbig').attr('y',22).text(N.toLocaleString('it-IT'));
    c.append('text').attr('class','center-small').attr('id','csmall').attr('y',58).text('dal '+fmtDay(start));
  }else{
    c.append('text').attr('class','center-small').attr('y',-6).text(pB);
    c.append('text').attr('class','center-small').attr('y',14).style('font-size','10px').text('verso dentro');
  }

  // picco
  let peak=0,pv=-1;days.forEach((d,i)=>{const v=sumActive(d.byType);if(v>pv){pv=v;peak=i}});
  if(!split&&pv>0){
    const a=ang(peak+0.5),L=r0+2+sOut(pv);
    svg.append('circle').attr('class','peak').attr('cx',Math.cos(a)*(L+9)).attr('cy',Math.sin(a)*(L+9)).attr('r',7);
  }
  svg.append('line').attr('class','guide').attr('id','guide').style('display','none');

  renderSide(peak,pv);
}

/* ---------- pannello ---------- */
function renderSide(peak,pv){
  const tot={};for(const d of state.days)for(const k in d.byType)tot[k]=(tot[k]||0)+d.byType[k];
  const chips=d3.select('#chips');chips.selectAll('*').remove();
  for(const t of TYPES){
    if(!tot[t.k])continue;
    const b=chips.append('button').attr('type','button').attr('class','chip').attr('aria-pressed',state.active.has(t.k))
      .on('click',()=>{
        if(state.active.has(t.k)){if(state.active.size>1)state.active.delete(t.k)}else state.active.add(t.k);
        render();
      });
    b.append('span').attr('class','sw').style('background',`var(--t-${t.k})`);
    b.append('span').text(t.label);
    b.append('span').attr('class','n').text(tot[t.k].toLocaleString('it-IT'));
  }
  const N=state.days.length,signals=state.days.reduce((s,d)=>s+sumActive(d.byType),0);
  const active=state.days.filter(d=>sumActive(d.byType)>0).length;
  const rows=[
    ['Periodo',`${fmtDay(state.days[0].date)} – ${fmtDay(state.days[N-1].date)}`],
    ['Segnali mostrati',signals.toLocaleString('it-IT')],
    ['Giorni con segnali',`${active.toLocaleString('it-IT')} su ${N.toLocaleString('it-IT')}`],
    ['Media al giorno',(signals/N).toLocaleString('it-IT',{maximumFractionDigits:1})],
    ['Giorno più intenso',pv>0?`${fmtDay(state.days[peak].date)} (${pv})`:'—']
  ];
  const st=d3.select('#stats');st.selectAll('*').remove();
  for(const [k,v] of rows){st.append('dt').text(k);st.append('dd').text(v)}

  const [pA,pB]=state.people;
  const canSplit=state.people.length>=2;
  d3.select('#m-split').property('disabled',!canSplit);
  d3.select('#m-all').attr('aria-pressed',state.mode!=='split');
  d3.select('#m-split').attr('aria-pressed',state.mode==='split');
  d3.select('#who').html('');
  if(canSplit&&state.mode==='split'){
    d3.select('#who').append('span').text(`Verso fuori: ${pA}`);
    d3.select('#who').append('span').text(`Verso dentro: ${pB}`);
  }
  d3.select('#byline').text(canSplit?`${pA} & ${pB}`:'ispirato a Giorgia Lupi');
  const badge=d3.select('#badge');
  badge.classed('real',!state.isExample).text(state.isExample?'Dati di esempio':'La vostra chat');
  d3.select('#srcnote').text(state.isExample
    ?'Questo sole è disegnato con una chat inventata. Carica l\'export della vostra chat per vedere il vostro.'
    :`Letto da ${state.fileName}: ${state.msgs.length.toLocaleString('it-IT')} messaggi.`);
  const media=tot.media||0;
  const err=document.getElementById('err');
  if(!state.isExample&&media>state.msgs.length*0.03&&media>(tot.foto||0)+(tot.audio||0)){
    err.hidden=false;err.textContent=`${media.toLocaleString('it-IT')} allegati non hanno un tipo ("Media omessi"). Su Android esporta con "Includi media" per distinguere foto, vocali e video.`;
  }else if(!err.dataset.keep){err.hidden=true}
}

/* ---------- interazione ---------- */
const tip=document.getElementById('tip'),fig=document.getElementById('fig');
function pointer(ev){
  const pt=svg.node().createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;
  const p=pt.matrixTransform(svg.node().getScreenCTM().inverse());
  const r=Math.hypot(p.x,p.y);
  const guide=d3.select('#guide');
  if(r<40||r>R_OUT+10||playing){tip.hidden=true;guide.style('display','none');return}
  let a=Math.atan2(p.y,p.x)+Math.PI/2;if(a<0)a+=Math.PI*2;
  const i=Math.min(geom.N-1,Math.floor(a/(Math.PI*2)*geom.N));
  const d=state.days[i];
  const ga=geom.ang(i+0.5);
  guide.style('display',null).attr('x1',Math.cos(ga)*40).attr('y1',Math.sin(ga)*40).attr('x2',Math.cos(ga)*(R_OUT+4)).attr('y2',Math.sin(ga)*(R_OUT+4));
  const tot=sumActive(d.byType);
  let html=`<b>${fmtDay(d.date)}</b>`;
  if(!tot)html+='<div class="row"><span>Nessun segnale</span></div>';
  for(const t of TYPES){const c=d.byType[t.k];if(c&&state.active.has(t.k))html+=`<div class="row"><span><i style="background:var(--t-${t.k})"></i>${t.label}</span><span>${c}</span></div>`}
  if(state.people.length>=2&&tot){
    html+=`<div class="row" style="margin-top:4px;color:var(--ink-soft)"><span>${state.people.slice(0,2).map(p=>`${esc(p)} ${sumActive(d.byWho[p])}`).join(' · ')}</span></div>`;
  }
  tip.innerHTML=html;tip.hidden=false;
  const fr=fig.getBoundingClientRect();
  let x=ev.clientX-fr.left+14,y=ev.clientY-fr.top+14;
  const tw=tip.offsetWidth,th=tip.offsetHeight;
  if(x+tw>fr.width)x=ev.clientX-fr.left-tw-14;
  if(y+th>fr.height)y=ev.clientY-fr.top-th-14;
  tip.style.left=Math.max(0,x)+'px';tip.style.top=Math.max(0,y)+'px';
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
svg.on('pointermove',pointer).on('pointerleave',()=>{tip.hidden=true;d3.select('#guide').style('display','none')});

d3.select('#m-all').on('click',()=>{state.mode='all';render()});
d3.select('#m-split').on('click',()=>{if(state.people.length>=2){state.mode='split';render()}});

/* riproduzione: il sole cresce giorno dopo giorno */
let playing=false;
d3.select('#play').on('click',()=>{
  if(playing)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const groups=svg.selectAll('g.rays > g').nodes();
  const N=groups.length;if(!N||reduce)return;
  playing=true;tip.hidden=true;
  groups.forEach(g=>g.style.opacity=0);
  const cbig=document.getElementById('cbig'),csm=document.getElementById('csmall');
  const dur=Math.min(9000,Math.max(3500,N*6));const t0=performance.now();let shown=0;
  function frame(now){
    const k=Math.min(1,(now-t0)/dur);const upto=Math.floor(k*N);
    for(;shown<upto;shown++)groups[shown].style.opacity=1;
    if(cbig&&upto>0){cbig.textContent=upto.toLocaleString('it-IT');csm.textContent=fmtDay(state.days[upto-1].date)}
    if(k<1)requestAnimationFrame(frame);
    else{groups.forEach(g=>g.style.opacity=1);playing=false;
      if(cbig){cbig.textContent=N.toLocaleString('it-IT');csm.textContent='dal '+fmtDay(state.days[0].date)}}
  }
  requestAnimationFrame(frame);
});

/* caricamento file */
document.getElementById('file').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;
  const err=document.getElementById('err');err.hidden=true;delete err.dataset.keep;
  try{
    let text;
    if(/\.zip$/i.test(f.name)||f.type.includes('zip')){
      if(f.size>800*1024*1024)throw new Error('Lo .zip è troppo pesante per il browser. Estrailo e carica solo il file .txt della chat.');
      const zip=await JSZip.loadAsync(f);
      const txts=Object.values(zip.files).filter(z=>!z.dir&&/\.txt$/i.test(z.name));
      if(!txts.length)throw new Error('Nello .zip non c\'è un file .txt della chat.');
      txts.sort((a,b)=>(/_chat|chat/i.test(b.name)-/_chat|chat/i.test(a.name)));
      text=await txts[0].async('string');
    }else text=await f.text();
    const msgs=parseChat(text);
    if(msgs.length<2)throw new Error('Ho trovato troppo pochi messaggi per disegnare il sole.');
    state.msgs=msgs;state.isExample=false;state.fileName=f.name;
    state.active=new Set(TYPES.map(t=>t.k));
    aggregate(msgs);render();
  }catch(ex){
    err.hidden=false;err.dataset.keep='1';err.textContent=ex.message||'Non sono riuscito a leggere il file.';
  }
  e.target.value='';
});

/* avvio */
state.msgs=makeExample();aggregate(state.msgs);render();
})();
