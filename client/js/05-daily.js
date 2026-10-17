const DQP={kill:{t:n=>'Sconfiggi '+n+' nemici',n:l=>4+Math.floor(l/2),w:l=>40+2*l},gat:{t:n=>'Raccogli '+n+' materiali',n:l=>8+2*l,w:l=>100+5*l,ok:()=>Object.keys(S.tools).length>0},craft:{t:n=>'Crea '+n+' oggetti o consegne',n:l=>2+Math.floor(l/10),w:l=>10+Math.floor(l/5),ok:()=>!!S.craft},trav:{t:n=>'Compi '+n+' viaggi',n:l=>3,w:l=>25}};
const dayN=()=>Math.floor(NOW()/864e5),weekN=()=>Math.floor((dayN()+3)/7);
function ensureQ(){const d=dayN(),w=weekN(),el=Object.keys(DQP).filter(k=>!DQP[k].ok||DQP[k].ok());
 if(!S.dq||S.dq.d!==d){S.dq={d,g:el.map(k=>[k,hs('dq'+d+k)]).sort((a,b)=>a[1]-b[1]).slice(0,3).map(([k])=>({k,n:DQP[k].n(S.lv),p:0,ok:0}))}}
 if(!S.wq||S.wq.w!==w){const k=el.map(k=>[k,hs('wq'+w+k)]).sort((a,b)=>a[1]-b[1])[0][0];S.wq={w,g:{k,n:DQP[k].w(S.lv),p:0,ok:0},seen:[],cl:[]}}}
const rwD=m=>({xp:Math.round(25*Math.pow(S.lv,1.2)*.3*m),g:Math.round((4+2.5*S.lv)*m)});
function qa(k,n){if(!S||!n)return;S.st=S.st||{};S.st[k]=(S.st[k]||0)+n;ftSet({trav:'mv',gat:'ga',kill:'ki'}[k]);ensureQ();const out=[],d=dayN();
 const gain=(r,lab)=>{const up=addXp(r.xp);S.g+=r.g;out.push(lab+': +'+r.xp+' XP, +'+r.g+' Corone'+(up?' · livello '+S.lv+'!':''))};
 S.dq.g.forEach(g=>{if(g.k===k&&!g.ok){g.p=Math.min(g.n,g.p+n);if(g.p>=g.n){g.ok=1;gain(rwD(1),'Impresa completata');if(!S.wq.seen.includes(d))S.wq.seen.push(d)}}});
 const w=S.wq.g;if(w.k===k&&!w.ok){w.p=Math.min(w.n,w.p+n);if(w.p>=w.n){w.ok=1;gain(rwD(3),'Grande impresa della settimana')}}
 [3,5,7].forEach((t,i)=>{if(S.wq.seen.length>=t&&!S.wq.cl.includes(t)){S.wq.cl.push(t);const m=i+1;const r={xp:Math.round(25*Math.pow(S.lv,1.2)*.4*m),g:Math.round(m*(10+4*S.lv))};gain(r,'Registro: '+t+' giorni attivi');if(m>=2)inv('p_vig',2);if(m>=3)inv('p_cus',1)}});
 if(out.length){save();toast(out.join(' · '))}else save()}
function dqHint(){ensureQ();const g=S.dq.g,k=g.filter(x=>x.ok).length;return'<div class="card row"><div><b>Imprese del giorno</b><small>'+k+'/'+g.length+' completate · registro settimana '+S.wq.seen.length+'/7</small></div><button data-a="tab" data-v="j">Vedi</button></div>'}
function dqView(){ensureQ();const left=(dayN()+1)*864e5-NOW(),hh=Math.floor(left/36e5),mm=Math.floor(left%36e5/6e4),wl=(weekN()*7+4-3)*864e5;const wleft=((weekN()+1)*7-3)*864e5-NOW(),wd=Math.floor(wleft/864e5),wh=Math.floor(wleft%864e5/36e5);
 const row=(g,big)=>'<div class="card"><b>'+DQP[g.k].t(g.n)+'</b><div class="bar"><i class="'+(g.ok?'gn':'')+'" style="width:'+(100*g.p/g.n)+'%"></i></div><small>'+(g.ok?'✔ Completata':g.p+'/'+g.n)+' · ricompensa '+rwD(big?3:1).xp+' XP, '+rwD(big?3:1).g+' Corone</small></div>';
 const sn=S.wq.seen.length;
 return'<h2>Imprese del giorno</h2><small class="mu">Nuove tra '+hh+' h '+mm+' min. Si completano da sole mentre giochi.</small>'+S.dq.g.map(g=>row(g,0)).join('')+
 '<h2>Registro della settimana</h2><div class="card"><b>Giorni attivi: '+sn+'/7</b><div class="bar"><i style="width:'+(100*sn/7)+'%"></i></div><small>Un giorno è attivo se completi almeno un’impresa. Non serve la serie: i giorni si sommano.</small><small>'+[3,5,7].map((t,i)=>(sn>=t?'✔ ':'○ ')+t+' giorni: '+['Corone e XP','più 2 elisir di vigore','più un elisir del custode'][i]).join('<br>')+'</small><small>Si azzera tra '+wd+' g '+wh+' h.</small></div>'+
 '<h2>Grande impresa</h2>'+row(S.wq.g,1)}
