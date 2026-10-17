const DEPN=10,fee=(t,id)=>t==='i'?Math.round((6+3*S.lv)*(IR(id)+1)):Math.round(4+2*S.lv);
function depPanel(m){S.dep=S.dep||[];const D=S.dep,lines=[];
 ov.hidden=false;ov.innerHTML='<div class="sheet"><h2>Deposito di Veyra</h2><div class="card"><b>Cassa speciale: '+D.length+'/'+DEPN+' slot</b><small>Ogni slot costa una tassa quando ci depositi qualcosa. Una pila di materiali (fino a 99) occupa un solo slot. Ritirare è gratis.</small><small>Hai '+S.g+' Corone.</small></div>'+(m?'<div class="card" role="status">'+m+'</div>':'')+
 '<h2>Nel deposito</h2>'+(D.length?D.map((d,i)=>'<div class="card row"><div><b>'+(d.t==='i'?itn(d.u):mcn(d.id)+' ×'+d.n)+'</b>'+(d.t==='i'?'<small>'+QN[d.i.q-1]+(d.i.by?' · '+d.i.by:'')+'</small>':'')+'</div><button data-a="dg" data-v="'+i+'">Ritira</button></div>').join(''):'<p class="mu">Vuoto.</p>')+
 '<h2>Dal tuo zaino</h2>'+Object.keys(S.items).filter(u=>!eqd(u)).map(u=>'<div class="card row"><div><b>'+itl(u)+'</b><small>'+QN[S.items[u].q-1]+' · Tassa '+fee('i',u)+' Corone</small></div><button data-a="dp" data-v="i:'+u+'">Deposita</button></div>').join('')+
 Object.entries(S.inv).filter(([k,v])=>v>0).map(([k,v])=>'<div class="card row"><div><b>'+mcn(k)+' ×'+Math.min(v,99)+'</b><small>Tassa '+fee('m',k)+' Corone</small></div><button data-a="dp" data-v="m:'+k+'">Deposita</button></div>').join('')+'<button data-a="ok">Chiudi</button></div>'}
function depPut(v){S.dep=S.dep||[];const t=v[0],id=v.slice(2),f=fee(t,id);
 if(S.dep.length>=DEPN)return depPanel('Il deposito è pieno: ritira qualcosa prima.');if(S.g<f)return depPanel('Non hai abbastanza Corone per la tassa ('+f+').');
 if(t==='i'){if(!S.items[id]||eqd(id))return;S.dep.push({t:'i',u:id,i:S.items[id]});delete S.items[id]}
 else{const n=Math.min(S.inv[id]||0,99);if(!n)return;S.inv[id]-=n;S.dep.push({t:'m',id,n})}
 S.g-=f;save();depPanel('Depositato. Tassa: '+f+' Corone.')}
function depGet(i){const d=(S.dep||[])[+i];if(!d)return;
 if(d.t==='i'){if(usedM()>=CAPM())return depPanel('Zaino pieno: fai spazio.');S.items[d.u]=d.i;S.dep.splice(+i,1)}
 else{const a=inv(d.id,d.n,1);d.n-=a;if(d.n<=0)S.dep.splice(+i,1);if(a===0)return depPanel('Non hai spazio.')}
 save();depPanel('Ritirato.')}
