/* Traguardi: contatori, premi (Corone, reputazione, titoli) e punti */
const ACH=[
{id:'kill',n:'Cacciatore',d:'Sconfiggi nemici',c:()=>S.st.kill,t:[[25,20],[100,60],[300,150,'cac',60]]},
{id:'gat',n:'Raccoglitore',d:'Raccogli materiali',c:()=>S.st.gat,t:[[40,20],[150,60],[400,150,'rac',60]]},
{id:'trav',n:'Viandante',d:'Compi viaggi tra i luoghi',c:()=>S.st.trav,t:[[40,20],[150,60],[400,150,'via',60]]},
{id:'craft',n:'Artigiano',d:'Crea oggetti nel tuo mestiere',c:()=>S.st.craft,t:[[3,20],[12,60],[40,150,'art',60]]},
{id:'quest',n:'Aiuto del popolo',d:'Completa missioni',c:()=>Object.keys(S.q).filter(k=>S.q[k]===2).length,t:[[8,30],[20,80],[40,200,'aiu',100]]},
{id:'rare',n:'Cacciatore di rari',d:'Sconfiggi creature rare diverse',c:()=>Object.keys(S.rare||{}).length,t:[[1,30],[5,80,0,40],[9,200,0,100]]},
{id:'eco',n:'Ascoltatore',d:'Ascolta gli Echi di Nymeria',c:()=>S.ec||0,t:[[3,20],[10,60],[25,150,0,50]]},
{id:'lv',n:'Esperienza',d:'Raggiungi il livello',c:()=>S.lv,t:[[5,20],[10,100]]},
{id:'rep',n:'Amico dei popoli',d:'Raggiungi il grado Amico con più fazioni',c:()=>Object.keys(FZ).filter(f=>!FZ[f].wip&&repGr(f)>=2).length,t:[[1,50],[2,100],[3,200,'ami']]},
{id:'ch1',n:'Luci nel Vespro',d:'Concludi il capitolo 1',c:()=>S.ch1?1:0,t:[[1,60,'luc']]},
{id:'ch2',n:'Radici nere',d:'Concludi il capitolo 2',c:()=>S.ch2?1:0,t:[[1,100]]},
{id:'ch4',n:'I popoli sapevano',d:'Concludi l’atto II',c:()=>S.ch4?1:0,t:[[1,150]]},
{id:'ch3',n:'La gabbia di luce',d:'Concludi il capitolo 3',c:()=>S.ch3?1:0,t:[[1,100]]},
{id:'alb',n:'Il destino dell’Albero',d:'Decidi la sorte dell’Albero Madre',c:()=>S.fl&&S.fl.albero?1:0,t:[[1,0,'albx']]}];
const TIT2={cac:['Spada della Frontiera','300 nemici sconfitti.'],rac:['Mano del Bosco','400 raccolte.'],via:['Passo Lungo','400 viaggi.'],art:['Maestro Artigiano','40 oggetti creati.'],aiu:['Cuore del Popolo','40 missioni completate.'],ami:['Amico dei popoli','Amico con tre fazioni.'],luc:['Portatore di Luce','Hai concluso il capitolo 1.'],albx:['Voce dell’Albero','Hai deciso il destino dell’Albero Madre.']};
Object.keys(TIT2).forEach(k=>{TIT[k]=[TIT2[k][0],TIT2[k][1],()=>(S.ti||[]).includes(k)]});
const ROM=['I','II','III','IV'];
function achCheck(){if(!S||!S.q||!S.lv)return;S.st=S.st||{};S.ach=S.ach||{};S.ti=S.ti||[];const out=[];
 ACH.forEach(a=>{let v=a.c()||0,i=S.ach[a.id]||0;while(i<a.t.length&&v>=a.t[i][0]){const [,co,ti,rp]=a.t[i];i++;S.ach[a.id]=i;S.g+=co;const det=[];if(co)det.push('+'+co+' Corone');const f=FRC[S.race];if(rp&&f){S.rep=S.rep||{};S.rep[f]=(S.rep[f]||0)+rp;det.push('+'+rp+' reputazione')}if(ti&&!S.ti.includes(ti)){S.ti.push(ti);det.push('titolo «'+TIT[ti][0]+'»')}out.push(a.n+' '+ROM[i-1]+(det.length?' ('+det.join(', ')+')':''))}});
 if(out.length){save();toast('Traguardo: '+out.slice(0,2).join(' · ')+(out.length>2?' · +'+(out.length-2)+' altri':''))}}
const achPts=()=>ACH.reduce((s,a)=>s+((S.ach&&S.ach[a.id])||0)*5,0);
function achHtml(){S.st=S.st||{};S.ach=S.ach||{};
 return'<h2>Traguardi</h2><small>Si completano giocando: danno Corone, reputazione e titoli. Punti traguardo: <b>'+achPts()+'</b></small><div class="card">'+ACH.map(a=>{const v=a.c()||0,i=S.ach[a.id]||0,done=i>=a.t.length,n=done?a.t[a.t.length-1][0]:a.t[i][0];return'<div style="margin:6px 0"><b>'+a.n+(i?' '+ROM[i-1]:'')+'</b><small>'+a.d+' · '+(done?'completato':Math.min(v,n)+' / '+n)+'</small><div class="bar"><i style="width:'+(done?100:Math.min(100,100*v/n))+'%"></i></div></div>'}).join('')+'</div>'}
