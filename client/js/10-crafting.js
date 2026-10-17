let FM='';
function forge(){if(!S.craft)return show('Per usare un mestiere devi sceglierlo: parla con Brann a Veyra.');FM='';forgePanel()}
const recs=()=>REC.filter(r=>r.cr===S.craft&&(!r.fam||r.fam===FAM[CL[S.spec].wk]));
function forgePanel(){const C0=CR[S.craft],lv=smithLv(),a=8*(lv-1)**2,b=8*lv**2,day=Math.floor(NOW()/864e5),OL=ORD[S.craft],od=OL[Math.floor(hs('ord'+day)*OL.length)];
 const have=(inn)=>Object.entries(inn).every(([k,v])=>(S.inv[k]||0)>=v),ins=inn=>Object.entries(inn).map(([k,v])=>mcn(k)+' '+Math.min(S.inv[k]||0,v)+'/'+v).join(', ');
 const left=(day+1)*864e5-NOW(),hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),gold=Math.round(od.g*(1+.12*S.lv));
 ov.hidden=false;ov.innerHTML='<div class="sheet"><h2>'+C0.pl+' di Veyra</h2><div class="card"><b>'+C0.n+' livello '+lv+'</b><div class="bar"><i style="width:'+Math.min(100,100*(S.cx-a)/(b-a))+'%"></i></div><small>'+(S.cx-a)+'/'+(b-a)+' esperienza</small></div>'+
 '<div class="card nd '+(S.od===day?'out':have(od.in)?'ok':'out')+'"><b>Commissione del giorno</b><small>'+od.n+': '+ins(od.in)+'</small><small>Ricompensa: '+gold+' Corone, '+C0.n+' +'+od.x+(S.od===day?' · già consegnata, nuova tra '+hh+' h '+mm+' min':'')+'</small>'+(S.od!==day&&have(od.in)?'<button data-a="od">Consegna</button>':'')+'</div>'+
 recs().map(r=>{const bg=r.bag?(S.bc||{})[r.id]||0:0,done=r.bag&&bg>=r.mx,lock=lv<r.min,ok=have(r.in),d=lv-r.min,pe=Math.min(.12,.03+.02*d),pf=Math.min(.35,.12+.04*d),k=r.id[0],tb=r.eq?SL[k][0]:null;
  return'<div class="card it nd '+(lock?'lock':done?'out':ok?'ok':'out')+'"><b'+(r.eq?' style="color:'+IC[IR(r.id)]+'"':'')+'>'+(r.eq?HN(r.id,r.n):r.n)+'</b>'+(r.eq?'<small>'+RAR[IR(r.id)]+' · +'+tb[r.id].v+' '+(k==='w'?'attacco':'vita')+' · Fine '+Math.round(pf*100)+'%, Eccellente '+Math.round(pe*100)+'% · vs ora '+dlt(tb[r.id].v,IV(S.eq[k]),'')+'</small><small>Ogni oggetto è unico e porta la tua firma.</small>':'')+(r.pot?'<small>Per 30 minuti: '+(r.pot.hp?'+'+Math.round(r.pot.hp*100)+'% vita ':'')+(r.pot.at?'+'+Math.round(r.pot.at*100)+'% attacco':'')+(S.inv[r.id]?' · ne hai '+S.inv[r.id]:'')+'</small>':'')+(r.bag?'<small>+'+r.bag[1]+' slot '+(r.bag[0]==='bx'?'dello zaino':'della borsa dei materiali')+' · '+bg+'/'+r.mx+' create</small>':'')+'<small>'+ins(r.in)+'</small><small>'+(lock?'🔒 Richiede '+C0.n+' livello '+r.min:done?'✔ Limite raggiunto ('+r.mx+'/'+r.mx+')':ok?'✔ Pronto':'✖ Mancano materiali')+'</small>'+(!lock&&!done&&ok?'<button data-a="fg" data-v="'+r.id+'">Crea</button>':'')+'</div>'}).join('')+
 (FM?'<div class="card" role="status">'+FM+'</div>':'')+'<button data-a="ok">Chiudi</button></div>'}
function doForge(id){const r=recs().find(x=>x.id===id),lv=smithLv();if(!r||lv<r.min||!Object.entries(r.in).every(([k,v])=>(S.inv[k]||0)>=v))return;
 if(r.bag&&(S.bc=S.bc||{},(S.bc[id]||0)>=r.mx))return;
 if(r.eq&&usedM()>=CAPM()){FM='Zaino pieno: fai spazio prima di creare un nuovo oggetto.';return forgePanel()}
 if(r.bag){Object.entries(r.in).forEach(([k,v])=>S.inv[k]-=v);S.bc[id]=(S.bc[id]||0)+1;S[r.bag[0]]=(S[r.bag[0]]||0)+r.bag[1];S.cx+=r.xp;FM=r.n+' creata: +'+r.bag[1]+' slot.';save();return forgePanel()}
 if(r.mat&&!room(r.mat)){FM='Non hai spazio per il risultato.';return forgePanel()}
 Object.entries(r.in).forEach(([k,v])=>S.inv[k]-=v);S.cx+=r.xp;let t;qa('craft',1);
 if(r.mat){inv(r.mat,1);t=r.n+' ×1.'}
 else{const d=lv-r.min,pe=Math.min(.12,.03+.02*d),pf=Math.min(.35,.12+.04*d),x=rnd(),q=x<pe?3:x<pe+pf?2:1,vr=Math.min(.1,(rnd()*2-1)*.04+.008*Math.max(0,d)),k=id[0];
  const u=giveItem(id,{q,vr,by:S.name||'Viandante',cl:lv}),cm=cmpItem(u),bt2=IV(u)>IV(S.eq[k]);if(bt2)S.eq[k]=u;
  t='Hai creato: '+itn(u)+' ('+QN[q-1]+', firmata '+(S.name||'Viandante')+'). '+(bt2?'Lo equipaggi: ':'Non è meglio di quello che usi, lo trovi in Borsa: ')+cm}
 FM=t+' '+CR[S.craft].n+' +'+r.xp+(smithLv()>lv?'. Sali al livello '+smithLv()+'!':'.');save();forgePanel()}
function doOrder(){const day=Math.floor(NOW()/864e5),OL=ORD[S.craft],od=OL[Math.floor(hs('ord'+day)*OL.length)];if(S.od===day||!Object.entries(od.in).every(([k,v])=>(S.inv[k]||0)>=v))return;
 Object.entries(od.in).forEach(([k,v])=>S.inv[k]-=v);const g=Math.round(od.g*(1+.12*S.lv)),lv0=smithLv();S.g+=g;S.cx+=od.x;S.od=day;qa('craft',1);
 FM='Commissione consegnata: +'+g+' Corone, '+CR[S.craft].n+' +'+od.x+(smithLv()>lv0?'. Sali al livello '+smithLv()+'!':'.');save();forgePanel()}
function usePot(id){const r=REC.find(x=>x.id===id);if(!r||!r.pot||!(S.inv[id]>0)||C)return;S.inv[id]--;S.buf={t:NOW()+30*6e4,hp:r.pot.hp||0,at:r.pot.at||0};save();show(r.n+' bevuto: effetto per 30 minuti.');}
