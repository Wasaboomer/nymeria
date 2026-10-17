// ---- Note di prova: segnala un problema con il contesto già compilato ----
const NK='nymeria.notes';
function notesGet(){try{return JSON.parse(localStorage.getItem(NK))||[]}catch(e){return[]}}
function notesPut(a){try{localStorage.setItem(NK,JSON.stringify(a.slice(-100)))}catch(e){}}
function noteCtx(){const q=(typeof mq==='function'&&mq())||null;return{t:new Date().toISOString().slice(0,16).replace('T',' '),loc:LC[S.loc]?LC[S.loc].n:S.loc,lv:S.lv,race:S.race,cl:S.spec,q:q?q.t:'-',tab:T}}
function noteText(n){return'['+n.t+'] '+n.race+' '+n.cl+' lv'+n.lv+' · '+n.loc+' · missione: '+n.q+' · schermata '+n.tab+'\n'+n.txt}
function noteSheet(msg){const a=notesGet();ov.hidden=false;ov.innerHTML='<div class="sheet"><h2>Segnala</h2><small class="mu">Scrivi cosa non va o dove ti annoi. Aggiungo io luogo, livello e missione.</small><textarea id="nt" rows="4" maxlength="400" aria-label="Nota" style="width:100%;margin:10px 0"></textarea>'+(msg?'<p class="mu">'+msg+'</p>':'')+'<div class="brow"><button data-a="nsv">Salva nota</button><button data-a="ncp">Copia tutte ('+a.length+')</button></div><div class="brow"><button data-a="ncl">Svuota</button><button data-a="ok">Chiudi</button></div></div>'}
function noteSave(){const el=$('#nt'),v=(el&&el.value||'').replace(/[<>&]/g,'').trim().slice(0,400);if(!v)return noteSheet('Scrivi qualcosa prima.');const a=notesGet();a.push(Object.assign(noteCtx(),{txt:v}));notesPut(a);noteSheet('Nota salvata.')}
function noteCopy(){const a=notesGet();if(!a.length)return noteSheet('Non ci sono note.');const txt=a.map(noteText).join('\n\n');const fb=()=>{noteSheet();const el=$('#nt');el.value=txt;el.focus();el.select();ov.querySelector('p')||el.insertAdjacentHTML('afterend','<p class="mu">Non riesco a copiare da solo: seleziona il testo e copialo.</p>')};try{navigator.clipboard.writeText(txt).then(()=>noteSheet('Copiate '+a.length+' note.'),fb)}catch(e){fb()}}
function noteClear(){notesPut([]);noteSheet('Note cancellate.')}
