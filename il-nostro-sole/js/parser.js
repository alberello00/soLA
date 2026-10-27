// Parsing dell'export WhatsApp (.txt) → [{date, who, type}]
/* ---------- parsing WhatsApp ---------- */
const CLEAN=/[‎‏‪-‮﻿]/g;
const H_IOS=/^\[(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?\]\s*(.*)$/;
const H_AND=/^(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{2,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?\s*([AaPp]\.?\s?[Mm]\.?)?\s+[-–]\s+(.*)$/;

function typeFromFile(f){
  f=f.toLowerCase();
  if(/sticker|stk-|\.webp$/.test(f))return 'sticker';
  if(/gif/.test(f))return 'sticker';
  if(/photo|img-|\.(jpe?g|png|heic)$/.test(f))return 'foto';
  if(/audio|ptt-|aud-|\.(opus|m4a|mp3|aac|ogg)$/.test(f))return 'audio';
  if(/video|vid-|\.(mp4|mov|3gp)$/.test(f))return 'video';
  return 'documento';
}
function classify(body){
  const b=body.replace(CLEAN,'').trim().toLowerCase();
  let m=b.match(/<(?:allegato|attached|allegati):\s*([^>]+)>/);
  if(m)return typeFromFile(m[1]);
  m=b.match(/^(\S+\.[a-z0-9]{2,5})\s+\((?:file allegato|file attached)\)/);
  if(m)return typeFromFile(m[1]);
  if(/^(immagine|foto) omess|^image omitted/.test(b))return 'foto';
  if(/^audio omess|^audio omitted/.test(b))return 'audio';
  if(/^video omess|^video omitted/.test(b))return 'video';
  if(/^sticker omess|^sticker omitted|^gif (esclusa|omessa|omitted)/.test(b))return 'sticker';
  if(/^documento omess|^document omitted|omesso$|omitted$/.test(b)&&/document|pdf|\.\w{2,4}/.test(b))return 'documento';
  if(/<media omess[io]>|<media omitted>/.test(b))return 'media';
  if(/^(chiamata|videochiamata|missed voice call|missed video call|voice call|video call)/.test(b)||/chiamata (vocale|video) (persa|senza risposta)/.test(b))return 'chiamata';
  if(/^(posizione|location|posizione in tempo reale|live location)/.test(b))return 'link';
  if(/(https?:\/\/|www\.)/.test(b))return 'link';
  if(/^(questo messaggio è stato eliminato|hai eliminato questo messaggio|this message was deleted|you deleted this message)/.test(b))return null;
  return 'testo';
}
function parseChat(text){
  const lines=text.replace(/\r/g,'').split('\n');
  const raw=[];
  for(let line of lines){
    line=line.replace(CLEAN,'').replace(/[  ]/g,' ');
    const m=line.match(H_IOS)||line.match(H_AND);
    if(!m)continue;
    const rest=m[8];const i=rest.indexOf(': ');
    if(i<1)continue; // messaggio di sistema
    raw.push({a:+m[1],b:+m[2],c:+m[3],h:+m[4],mi:+m[5],s:+(m[6]||0),ap:m[7],who:rest.slice(0,i).trim(),body:rest.slice(i+2)});
  }
  if(!raw.length)throw new Error('Non ho trovato messaggi nel file. È l\'export di una chat WhatsApp (.txt o .zip)?');
  let order='dmy';
  if(raw.some(r=>r.a>31))order='ymd';
  else if(raw.some(r=>r.a>12))order='dmy';
  else if(raw.some(r=>r.b>12))order='mdy';
  const out=[];
  for(const r of raw){
    let d,mo,y;
    if(order==='ymd'){y=r.a;mo=r.b;d=r.c}else if(order==='mdy'){mo=r.a;d=r.b;y=r.c}else{d=r.a;mo=r.b;y=r.c}
    if(y<100)y+=2000;
    let h=r.h;
    if(r.ap){const pm=/p/i.test(r.ap);if(pm&&h<12)h+=12;if(!pm&&h===12)h=0}
    const type=classify(r.body);
    if(!type)continue;
    const date=new Date(y,mo-1,d,h,r.mi,r.s);
    if(isNaN(date))continue;
    out.push({date,who:r.who,type});
  }
  return out;
}
