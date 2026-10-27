// Chat inventata usata finché non si carica un file vero
/* ---------- dati di esempio ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function makeExample(){
  const rnd=mulberry32(27);const out=[];
  const start=new Date(2024,9,27),end=new Date(2026,9,26);
  const vacA=new Date(2025,7,4),vacB=new Date(2025,7,20);
  const span=end-start;
  for(const day of d3.timeDay.range(start,d3.timeDay.offset(end,1))){
    const t=(day-start)/span;
    let base=16+9*Math.sin(t*Math.PI*6)+rnd()*14;
    if(t<0.08)base*=1.9;
    if(day>=vacA&&day<vacB)base*=0.12;
    if(rnd()<0.04)base*=2.4;
    const wk=day.getDay()===0||day.getDay()===6;
    const n=Math.max(0,Math.round(base));
    for(let i=0;i<n;i++){
      const r=rnd();let type;
      const pf=wk?0.14:0.07;
      if(r<pf)type='foto';else if(r<pf+0.07)type='audio';else if(r<pf+0.11)type='sticker';
      else if(r<pf+0.13)type='link';else if(r<pf+0.145)type='video';else if(r<pf+0.15)type='documento';else type='testo';
      out.push({date:new Date(+day+rnd()*864e5),who:rnd()<0.53?'Albi':'Lei',type});
    }
    if(rnd()<0.35)out.push({date:new Date(+day+79e6),who:rnd()<0.5?'Albi':'Lei',type:'chiamata'});
  }
  return out;
}
