// ---- Account online (facoltativo) ----
// Funziona solo quando il gioco è servito da server/server.js; altrove (file locale, anteprima) la scheda non compare
// e il gioco continua a salvare solo sul dispositivo.
const CK='nymeria.cloud';
let CLD=(()=>{try{return JSON.parse(localStorage.getItem(CK))||{}}catch(e){return{}}})(),cT=0,cBusy=0,cAsk=0;
const cStore=()=>{try{localStorage.setItem(CK,JSON.stringify({token:CLD.token,user:CLD.user,rev:CLD.rev}))}catch(e){}};
async function cApi(m,u,b){const r=await fetch(u,{method:m,headers:{'Content-Type':'application/json',...(CLD.token?{Authorization:'Bearer '+CLD.token}:{})},body:b===undefined?undefined:JSON.stringify(b)});let j=null;try{j=await r.json()}catch(e){}return{s:r.status,j:j||{}}}
function cloudPush(){if(!CLD.on||!CLD.token||!S)return;clearTimeout(cT);cT=setTimeout(cPush,2500)}
function cApply(d,rev){try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}S=load();CLD.rev=rev;cStore();CLD.st='ok';T='w';C=null;render()}
async function cPush(){if(!CLD.on||!CLD.token||!S||cAsk)return;if(cBusy){cloudPush();return}cBusy=1;
 try{const r=await cApi('PUT','/api/save',{rev:CLD.rev||0,data:S});
  if(r.s===200){CLD.rev=r.j.rev;cStore();CLD.st='ok'}
  else if(r.s===409&&r.j.data){cAsk=1;ask('Su un altro dispositivo c’è un salvataggio diverso. Quale tieni?',[['Usa quello online','Livello '+r.j.data.lv+'. Questo dispositivo viene sostituito',()=>{cAsk=0;cApply(r.j.data,r.j.rev)}],['Tieni questo dispositivo','Il salvataggio online viene sostituito',()=>{cAsk=0;CLD.rev=r.j.rev;cPush()}]])}
  else if(r.s===401){CLD.token='';CLD.st='scaduto';cStore()}
  else CLD.st=r.j.error||'errore'}
 catch(e){CLD.st='offline'}cBusy=0}
async function cloudInit(){if(!/^https?:$/.test(location.protocol)){CLD.on=false;return}try{const r=await cApi('GET','/api/health');CLD.on=r.s===200&&r.j.ok}catch(e){CLD.on=false}
 if(!CLD.on){return}
 if(CLD.token){try{const r=await cApi('GET','/api/save');
  if(r.s===401){CLD.token='';CLD.st='scaduto';cStore()}
  else if(r.s===200&&r.j.data&&r.j.rev>(CLD.rev||0)&&!C){cAsk=1;ask('Online c’è un salvataggio più recente (livello '+r.j.data.lv+'). Lo usi?',[['Sì, usa quello online','',()=>{cAsk=0;cApply(r.j.data,r.j.rev)}],['No, tieni questo','Verrà sostituito online al prossimo salvataggio',()=>{cAsk=0;CLD.rev=r.j.rev;cStore();cPush()}]])}
  else CLD.st='ok'}catch(e){CLD.st='offline'}}
 if(!ov.hidden||T==='u'||!S)render()}
async function cloudAuth(mode){const u=($('#cu')||{}).value||'',p=($('#cp')||{}).value||'';
 try{const r=await cApi('POST','/api/'+mode,{user:u.trim(),pass:p});
  if(r.s>=400){toast(r.j.error||'Errore.');return}
  CLD.token=r.j.token;CLD.user=r.j.user;CLD.rev=0;cStore();
  const g=await cApi('GET','/api/save');
  if(g.j.data){CLD.rev=g.j.rev;cStore();
   if(!S)return cApply(g.j.data,g.j.rev);
   cAsk=1;ask('Su questo account c’è già un personaggio (livello '+g.j.data.lv+'). Quale usi?',[['Usa il personaggio online','Quello di questo dispositivo viene sostituito',()=>{cAsk=0;cApply(g.j.data,g.j.rev)}],['Carica questo personaggio','Sostituisce quello online',()=>{cAsk=0;cPush();render()}]])}
  else{CLD.st='ok';if(S)cPush();render()}}
 catch(e){toast('Server non raggiungibile.')}}
async function cloudOut(){try{await cApi('POST','/api/logout',{})}catch(e){}CLD.token='';CLD.user='';CLD.rev=0;CLD.st='';cStore();render()}
function cloudCard(){if(!CLD.on)return'';
 if(CLD.token)return'<div class="card"><b>Account online: '+CLD.user+'</b><small>'+(CLD.st==='ok'?'Salvataggio online attivo.':CLD.st==='offline'?'Senza connessione: salvo solo su questo dispositivo.':CLD.st||'Connesso.')+'</small><small>Pagina pubblica: '+location.origin+'/p/'+CLD.user+'</small><div class="brow"><button data-a="csync">Salva ora</button><button data-a="cout">Esci</button></div></div>';
 return'<div class="card"><b>Account online</b><small>Salva il personaggio sul server e riprendilo da un altro dispositivo.'+(CLD.st==='scaduto'?' L’accesso è scaduto: accedi di nuovo.':'')+'</small><input id="cu" maxlength="16" placeholder="Nome account" autocomplete="username" aria-label="Nome account"><input id="cp" type="password" maxlength="128" placeholder="Password (almeno 8 caratteri)" autocomplete="current-password" aria-label="Password"><div class="brow"><button data-a="cin">Accedi</button><button data-a="creg">Registrati</button></div></div>'}
