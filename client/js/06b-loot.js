// ---- Bottino: tabelle per fonte (nemico comune, raro, boss; dungeon e raid in arrivo) ----
// Regole: ogni fonte ha un tetto di rarità; la fortuna si accumula ("pietà"); il bottino è personale.
// Il pezzo migliore si crea: dungeon e raid danno materiali e progetti, il mestiere crea l'oggetto.
const LS={ // tier -> {g: probabilità base di un pezzo, w: pesi per rarità [grigio..oro], q: [prob. eccellente, prob. fine], cap: rarità massima}
 c:{n:'comune',g:.04,w:[80,20,0,0,0],q:[.01,.1],cap:1,xm:1},
 r:{n:'raro',g:.4,w:[15,55,30,0,0],q:[.05,.25],cap:2,xm:2.2},
 b:{n:'boss',g:1,w:[0,35,65,0,0],q:[.12,.35],cap:2,xm:1},
 d:{n:'dungeon',g:1,w:[0,0,60,40,0],q:[.15,.4],cap:3,xm:1},   // non ancora attivo
 R:{n:'raid',g:1,w:[0,0,0,60,40],q:[.2,.45],cap:4,xm:1}};   // non ancora attivo
const LM={ // materiali per mostro: [id, probabilità, min, max]
 verme:[['minerale',.3,1,1]],lupo:[['pelle',.6,1,1]],cinghiale:[['pelle',.6,1,2]],ragno:[['pelle',.35,1,1],['tela',.15,1,1]],
 brig:[['pelle',.4,1,1],['minerale',.25,1,1]],seguace:[['minerale',.2,1,1]],sch:[['frammento',.1,1,1],['minerale',.3,1,2]],
 falena:[['erba',.55,1,2]],spora:[['erba',.5,1,2],['ebano',.05,1,1]],
 anziano:[['frammento',.7,1,2],['ferro_puro',.6,1,2]],guardiano:[['ebano',.8,1,2],['erba',.8,2,3]],
 radice:[['legno',.6,1,2],['ebano',.12,1,1]],fuso:[['minerale',.6,1,2],['ferro_puro',.15,1,1]],albero:[['ebano',.9,2,3],['frammento',.8,1,2],['legno',.9,2,4]]};
const MT={anziano:'b',guardiano:'b',albero:'b'};
function lootPool(r){const o=[];Object.keys(SL).forEach(k=>{const tb=SL[k][0];Object.keys(tb).forEach(id=>{const b=tb[id];if(id[1]!=='0'&&(b.r||0)===r&&b.v>0&&!b.fz)o.push(id)})});return o}
function lootGear(tr,boost){const T=LS[tr];if(!T)return null;const pt=Math.min(.15,(S.pt||0)*.01);if(rnd()>=Math.min(1,T.g+pt+(boost||0)))return null;
 let x=rnd()*T.w.reduce((a,b)=>a+b,0),r=0;for(;r<T.w.length;r++){x-=T.w[r];if(x<0)break}r=Math.min(r,T.cap);
 let p=lootPool(r);while(!p.length&&r>0)p=lootPool(--r);if(!p.length)return null;
 const id=p[Math.floor(rnd()*p.length)],y=rnd(),q=y<T.q[0]?3:y<T.q[0]+T.q[1]?2:1;return{id,q}}
function lootRoll(e){const tr=e.rare?'r':(MT[e.id]||'c'),mats={},T=LS[tr];
 (LM[e.id]||[]).forEach(([m,p,a,b])=>{if(rnd()<p*(e.rare?1.6:1)*(S.race==='nivari'?1.15:1)){mats[m]=(mats[m]||0)+a+Math.floor(rnd()*(b-a+1))}});
 const g=lootGear(tr);S.pt=g?0:(S.pt||0)+1;return{mats,g,tr}}
