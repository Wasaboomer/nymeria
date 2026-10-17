// Avatar del personaggio: ritratto (uno tra tanti per popolo) + sfondo + stemma + cornice di rango.
// PORTIMG è generata da tools/build.js dalle immagini in client/assets/ritratti.
const AVC={umano:48,kharun:24,velhiri:24,thalassi:24,nivari:24,draeth:24};
// sesso di ogni ritratto (f/m), per indice; stesso ordine delle tavole
const AVSX={umano:'fmfmmfmfmfmf'+'fmfmmfmfmfmf'+'fmfmmfmffmfm'+'fmfmmfmffmfm',kharun:'ffmm'.repeat(6),velhiri:'ffmm'.repeat(6),thalassi:'ffmm'.repeat(6),nivari:'ffmm'.repeat(6),draeth:'fm'.repeat(12)};
const avSx=(r,a)=>(S&&S.sx)||(AVSX[r]||AVSX.umano)[((a&&a.p)|0)%(AVC[r]||24)]||'f';
const avFaces=(r,x)=>{const t=AVSX[AVC[r]?r:'umano'],o=[];for(let i=0;i<t.length;i++)if(t[i]===x)o.push(i);return o};
// stendardo di ogni popolo: [colore, simbolo]
const AVF={umano:['#b8452e','☀'],kharun:['#c9a23a','▲'],velhiri:['#3f9a52','☘'],thalassi:['#2a8aa8','⚓'],nivari:['#7a9ac8','❄'],draeth:['#c4482a','☼']};
const flagHtml=r=>{const f=AVF[r];return'<div class="stn" style="--bc:'+f[0]+'"><span>'+f[1]+'︎</span></div>'};
const avKey=(r,p)=>{r=AVC[r]?r:'umano';const n=AVC[r];p=((p|0)%n+n)%n;return r==='umano'?'umano-'+'abcd'[Math.floor(p/12)]+String(p%12).padStart(2,'0'):r+'-'+String(p).padStart(2,'0')};
// sfondi: [nome, sfumatura dietro il ritratto, colore che tinge i bordi del ritratto]
const AVB=[['Notte','radial-gradient(circle at 50% 30%,#2a3550,#0e1220)','#3c5a9a'],['Brace','radial-gradient(circle at 50% 30%,#5a2418,#1a0a08)','#c4482a'],['Bosco','radial-gradient(circle at 50% 30%,#264a30,#0a1a10)','#3f9a52'],['Mare','radial-gradient(circle at 50% 30%,#1c4a5e,#08161e)','#2a8aa8'],['Neve','radial-gradient(circle at 50% 30%,#4a5a70,#151c28)','#7a9ac8'],['Cenere','radial-gradient(circle at 50% 30%,#4a3a36,#14100f)','#8a6a58'],['Oro antico','radial-gradient(circle at 50% 30%,#6a5428,#1c1608)','#c9a23a'],['Viola','radial-gradient(circle at 50% 30%,#43285e,#120a1c)','#8a4ac8'],['Ardesia','radial-gradient(circle at 50% 30%,#3a3f48,#101216)','#6a7480'],['Vespro','radial-gradient(circle at 50% 30%,#6a2230,#1a080c)','#c8384e']];
const AVE=['✦','❖','☽','☀','★','♛','⚜','✠','☘','❄','⚓','☠','♞','⚔','✿','♠','♣','♦','♥','☯','⚡','✪','⌘','⚘','✵','❂','♆','♜','♝','✺'].map(g=>g+'︎');
// rango: dal livello. [livello minimo, nome, colore cornice]
const AVR=[[1,'Viandante','#8a8f94'],[5,'Esploratore','#b87a3a'],[10,'Veterano','#cfd6de'],[20,'Eroe','#e0b050'],[35,'Leggenda','#ff9a2e']];
const avRk=lv=>AVR.filter(r=>lv>=r[0]).pop();
function avDef(race,sx){const n=AVC[race]||24,l=sx?avFaces(race,sx):null;return{p:l?l[Math.floor(rnd()*l.length)]:Math.floor(rnd()*n),bg:({kharun:8,velhiri:2,thalassi:3,nivari:4,draeth:5})[race]||0,em:Math.floor(rnd()*AVE.length)}}
// sz: numero (px) oppure stringa CSS come '100%'
function avHtml(a,sz,lv,race){a=a||S.av||{p:0,bg:0,em:0};race=race||a.r||S.race;lv=lv==null?S.lv:lv;const rk=avRk(lv),b=AVB[a.bg%AVB.length],k=avKey(race,a.p);
 return'<div class="av'+(rk[0]>=10?' hi':'')+'" style="--s:'+(typeof sz==='number'?sz+'px':sz)+';--fc:'+rk[2]+';background:'+b[1]+'"><img src="'+PORTIMG[k]+'" alt="" draggable="false"><i class="avt" style="background:radial-gradient(circle at 50% 42%,transparent 38%,'+b[2]+' 100%)"></i><span class="ave">'+AVE[a.em%AVE.length]+'</span></div>'}
// ritratto per i compagni di prova: stabile per ogni "look"
const avAlly=l=>({r:'umano',p:(l.f*5+l.hr*7+l.sk*3+l.hc*11+l.m*13)%48,bg:(l.sk+l.hc*2)%AVB.length,em:(l.f+l.hr*3+l.m*5)%AVE.length});
// Selettore: volti, sfondi, stemmi
function avPick(race,a,sx,noFace){const on=(k,i)=>a[k]===i?' on':'';let h='';
 if(!noFace){h='<h2>Volto</h2><div class="avg">';avFaces(race,sx).forEach((i,j)=>{h+='<button class="'+on('p',i).trim()+'" data-a="av" data-v="p:'+i+'" aria-label="Volto '+(j+1)+'"><img src="'+PORTIMG[avKey(race,i)]+'" alt="" draggable="false"></button>'});h+='</div>'}
 h+='<h2>Sfondo</h2><div class="avs">'+AVB.map((b,i)=>'<button class="'+on('bg',i).trim()+'" data-a="av" data-v="bg:'+i+'" style="background:'+b[1]+'" aria-label="'+b[0]+'"></button>').join('')+'</div><h2>Stemma</h2><div class="ave2">'+AVE.map((g,i)=>'<button class="'+on('em',i).trim()+'" data-a="av" data-v="em:'+i+'" aria-label="Stemma '+(i+1)+'">'+g+'</button>').join('')+'</div>';return h}
// Dati pubblici del personaggio, pronti per la scheda (e, più avanti, per la scheda degli altri giocatori)
function myProfile(){const sl=EQS.map(([k,nm])=>{const u=S.eq[k],none=bt(u)===k+'0';return{lb:nm,g:GLY(u),c:none?'var(--bd)':IC[IR(u)],n:none?'':itn(u),by:(S.items[u]&&S.items[u].by)||'',none}});
 EQL.forEach(l=>sl.push({lb:l,lock:1}));
 return{name:S.name||'Viandante',title:S.tt&&TIT[S.tt]?TIT[S.tt][0]:'',race:RN[S.race],cls:CL[S.spec].n,role:RLN[CL[S.spec].role],lv:S.lv,pw:pw(),av:S.av,rc:S.race,sl}}
function profHtml(P,o){o=o||{};const rk=avRk(P.lv);
 return'<div class="card prof">'+avHtml(P.av,112,P.lv,P.rc)+'<div class="hdi"><b class="pn">'+P.name+'</b>'+(P.title?'<small>«'+P.title+'»</small>':'')+'<small>'+P.race+' · '+P.cls+'</small><small>Livello '+P.lv+' · <span style="color:'+rk[2]+'">'+rk[1]+'</span></small><div class="pw">Potenza <b>'+P.pw+'</b></div>'+(o.edit?'<button class="sm" data-a="tab" data-v="c">Personalizza</button>':'')+'</div></div>'+(o.noSlots?'':
 '<div class="card"><b>Equipaggiamento</b><div class="pgr">'+P.sl.map(s=>s.lock?'<div class="ps"><div class="sl lk">🔒</div><small>'+s.lb+'</small></div>':'<div class="ps"><div class="sl" style="border-color:'+s.c+'">'+(s.none?'<span style="opacity:.25">'+s.g+'</span>':s.g)+'</div><small>'+(s.n||s.lb)+'</small>'+(s.by?'<small class="by">'+s.by+'</small>':'')+'</div>').join('')+'</div></div>')}
// avvio: per ultimo, quando tutte le costanti esistono
render();cloudInit();
