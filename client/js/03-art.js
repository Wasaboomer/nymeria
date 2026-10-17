// ---- Grafica vettoriale ----
const R=s=>()=>(s=(s*9301+49297)%233280)/233280;
function scene(id){const L=LC[id],r=R(id.charCodeAt(0)*7),t=L.t;let s='<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g'+id+'" x2="0" y2="1"><stop offset="0" stop-color="'+L.pal[0]+'"/><stop offset="1" stop-color="'+L.pal[1]+'"/></linearGradient></defs><rect width="300" height="150" fill="url(#g'+id+')"/><circle cx="'+(50+r()*200|0)+'" cy="30" r="13" fill="#eadfbf" opacity=".6"/><path d="M0 100Q60 62 130 94T300 86V150H0z" fill="#0007"/>';
 if(['forest','road'].includes(t))for(let i=0;i<15;i++){const x=i*21+r()*9|0,h=34+r()*34|0;s+='<path d="M'+x+' 135l-10 0 10-'+h+' 10 '+h+'z" fill="#0a120f"/>'}
 if(t==='town')s+='<path d="M30 135V80h40v55zM110 135V70h30v65zM180 135V85h45v55zM60 80l-10-14h20zM125 70l-15-18h30zM205 85l-18-14h36z" fill="#120d0f"/><circle cx="90" cy="118" r="4" fill="#f0b94a"/><circle cx="160" cy="118" r="4" fill="#f0b94a"/>';
 if(t==='hut')s+='<path d="M90 135V95h90v40zM80 98l55-34 55 34z" fill="#140f0a"/><rect x="125" y="110" width="20" height="25" fill="#f0b94a" opacity=".85"/>';
 if(t==='bridge')s+='<rect y="120" width="300" height="30" fill="#0b2a33"/><path d="M20 112h260v8H20zM60 120a35 28 0 0 1 70 0zM170 120a35 28 0 0 1 70 0z" fill="#10161a"/>';
 if(t==='ruin')for(let i=0;i<6;i++)s+='<rect x="'+(25+i*45)+'" y="'+(90+r()*20|0)+'" width="14" height="50" fill="#14161a"/>';
 if(t==='cave')s+='<path d="M60 150V95Q150 20 240 95V150z" fill="#050506"/>';
 return s+'<rect y="132" width="300" height="18" fill="#0009"/></svg>'}
const nbAll=l=>E.filter(e=>e[0]===l||e[1]===l).map(e=>[e[0]===l?e[1]:e[0],e[2]]),nb=l=>nbAll(l).filter(a=>!LC[a[0]].wip);
const lblLines=t=>{const w=t.split(' ');let l=[t];if(t.length>13&&w.length>1){let b=1,bd=99;for(let k=1;k<w.length;k++){const d=Math.abs(w.slice(0,k).join(' ').length-w.slice(k).join(' ').length);if(d<bd){bd=d;b=k}}l=[w.slice(0,b).join(' '),w.slice(b).join(' ')]}return l};
const lbl=(t,x,y,fs,fill,an)=>{const l=lblLines(t);return'<text text-anchor="'+(an||'middle')+'" font-size="'+fs+'" fill="'+fill+'" stroke="#06080b" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke" opacity="1">'+l.map((q,i)=>'<tspan x="'+x+'" y="'+(y+i*fs*1.15)+'">'+q+'</tspan>').join('')+'</text>'};
// posizione dell'etichetta senza sovrapposizioni: sotto, sopra, a destra, a sinistra
function lblPlace(t,x,y,fs,taken,nodes){const l=lblLines(t),w=Math.max(...l.map(q=>q.length))*fs*.5+2,h=l.length*fs*1.15+1;
 const cand=[['middle',x,y+13,x-w/2,y+13-fs,w,h],['middle',x,y-12-(l.length-1)*fs*1.15,x-w/2,y-12-(l.length-1)*fs*1.15-fs,w,h],['start',x+9,y+3,x+9,y+3-fs,w,h],['end',x-9,y+3,x-w-9,y+3-fs,w,h]];
 const hit=(c)=>c[3]<2||c[3]+c[5]>198||taken.some(b=>c[3]<b[0]+b[2]&&b[0]<c[3]+c[5]&&c[4]<b[1]+b[3]&&b[1]<c[4]+c[6])||nodes.some(n=>n[0]>c[3]-6&&n[0]<c[3]+c[5]+6&&n[1]>c[4]-6&&n[1]<c[4]+c[6]+6&&!(Math.abs(n[0]-x)<1&&Math.abs(n[1]-y)<1));
 const c=cand.find(c=>!hit(c))||cand[0];taken.push([c[3],c[4],c[5],c[6]]);return c}
// Sfondi delle mappe: ogni regione mostra la sua peculiarità
function mapBg(rg,W,H){const r=R(rg.charCodeAt(0)*131+rg.length*17),g=(a,b,c,d)=>'<linearGradient id="bg'+rg+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient>',rx=m=>r()*m;let o='<defs>'+({
 vespro:g('#2a2f3a','#14161c'),karuun:g('#26201e','#0c0908'),selva:g('#16301f','#07130b'),mare:g('#123a56','#07182a'),neve:g('#3a5068','#141c28'),cenere:g('#3a1a14','#0e0606')})[rg]+'</defs><rect width="'+W+'" height="'+H+'" fill="url(#bg'+rg+')"/>';
 const n=(c,f)=>{for(let i=0;i<c;i++)o+=f(i)};
 if(rg==='vespro'){ // pianure nebbiose, colline, alberi spogli, nebbia
  n(3,i=>'<path d="M0 '+(H*.55+i*14)+'Q'+(W*.3)+' '+(H*.42+i*14)+' '+(W*.6)+' '+(H*.58+i*14)+'T'+W+' '+(H*.5+i*14)+'V'+H+'H0z" fill="#1d212b" opacity="'+(.35+i*.15)+'"/>');
  n(16,()=>{const x=rx(W),y=H*.45+rx(H*.5);return'<path d="M'+x+' '+y+'v-9M'+x+' '+(y-5)+'l-3-3M'+x+' '+(y-7)+'l3-3" stroke="#0e1015" stroke-width="1.2" fill="none" opacity=".7"/>'});
  n(5,i=>'<ellipse cx="'+rx(W)+'" cy="'+(H*.25+i*H*.15)+'" rx="'+(40+rx(40))+'" ry="'+(5+rx(5))+'" fill="#c9cfdc" opacity=".08"/>');
  o+='<circle cx="'+(W*.82)+'" cy="'+(H*.14)+'" r="9" fill="#d8d2b8" opacity=".25"/>'}
 else if(rg==='karuun'){ // roccia, stalattiti, venature di metallo e bagliori di forgia
  n(14,i=>{const x=i*W/13+rx(8),h=8+rx(22);return'<path d="M'+(x-5)+' 0L'+x+' '+h+'L'+(x+5)+' 0z" fill="#3a302c" opacity=".8"/>'});
  n(12,()=>'<path d="M'+rx(W)+' '+rx(H)+'l'+(rx(30)-15)+' '+(8+rx(18))+'l'+(rx(20)-10)+' '+(8+rx(14))+'" stroke="#0a0706" stroke-width="1.2" fill="none" opacity=".6"/>');
  n(7,()=>{const x=rx(W),y=H*.3+rx(H*.65);return'<circle cx="'+x+'" cy="'+y+'" r="'+(10+rx(14))+'" fill="#ff7a2a" opacity=".07"/><circle cx="'+x+'" cy="'+y+'" r="2" fill="#ffb060" opacity=".5"/>'});
  n(18,()=>'<rect x="'+rx(W)+'" y="'+rx(H)+'" width="'+(2+rx(3))+'" height="'+(1+rx(2))+'" fill="#8a96a8" opacity=".35"/>')}
 else if(rg==='selva'){ // chiome fitte, liane, luce verde
  n(30,()=>{const x=rx(W),y=rx(H),q=9+rx(14);return'<circle cx="'+x+'" cy="'+y+'" r="'+q+'" fill="#1f4a2b" opacity="'+(.25+rx(.3))+'"/>'});
  n(8,()=>{const x=rx(W);return'<path d="M'+x+' 0q'+(rx(14)-7)+' '+(H*.25)+' '+(rx(10)-5)+' '+(H*.35+rx(H*.2))+'" stroke="#3c7a46" stroke-width="1.4" fill="none" opacity=".45"/>'});
  n(22,()=>'<circle cx="'+rx(W)+'" cy="'+rx(H)+'" r="1.4" fill="#d8f58a" opacity="'+(.3+rx(.5))+'"/>')}
 else if(rg==='mare'){ // onde, isolette, schiuma
  n(10,i=>'<path d="M0 '+(14+i*H/10)+'q'+(W/8)+' -6 '+(W/4)+' 0t'+(W/4)+' 0t'+(W/4)+' 0t'+(W/4)+' 0" stroke="#7ec4e8" stroke-width="1" fill="none" opacity="'+(.12+(i%3)*.05)+'"/>');
  n(4,()=>{const x=rx(W),y=H*.15+rx(H*.7);return'<ellipse cx="'+x+'" cy="'+y+'" rx="'+(14+rx(14))+'" ry="'+(6+rx(5))+'" fill="#6a5a3c" opacity=".55"/><ellipse cx="'+x+'" cy="'+(y-2)+'" rx="'+(9+rx(8))+'" ry="3.5" fill="#3f7a4a" opacity=".6"/>'});
  n(14,()=>'<circle cx="'+rx(W)+'" cy="'+rx(H)+'" r="'+(.8+rx(1.2))+'" fill="#e8f6ff" opacity=".35"/>')}
 else if(rg==='neve'){ // vette, ghiaccio, fiocchi
  n(5,i=>{const x=i*W/4+rx(14)-7,h=34+rx(40),y=H*.62;return'<path d="M'+(x-26)+' '+y+'L'+x+' '+(y-h)+'L'+(x+26)+' '+y+'z" fill="#cfe2f2" opacity=".22"/><path d="M'+(x-9)+' '+(y-h+12)+'L'+x+' '+(y-h)+'L'+(x+9)+' '+(y-h+12)+'z" fill="#fff" opacity=".35"/>'});
  o+='<rect y="'+(H*.62)+'" width="'+W+'" height="'+(H*.38)+'" fill="#dfeaf5" opacity=".1"/>';
  n(40,()=>'<circle cx="'+rx(W)+'" cy="'+rx(H)+'" r="'+(.7+rx(1.1))+'" fill="#fff" opacity="'+(.3+rx(.5))+'"/>')}
 else if(rg==='cenere'){ // vulcano, crepe di lava, cenere
  o+='<path d="M'+(W*.62)+' '+(H*.7)+'L'+(W*.78)+' '+(H*.28)+'L'+(W*.94)+' '+(H*.7)+'z" fill="#2a1612"/><path d="M'+(W*.74)+' '+(H*.31)+'L'+(W*.78)+' '+(H*.26)+'L'+(W*.82)+' '+(H*.31)+'z" fill="#ff6a20" opacity=".8"/><ellipse cx="'+(W*.78)+'" cy="'+(H*.18)+'" rx="22" ry="8" fill="#4a3a36" opacity=".5"/>';
  n(9,()=>'<path d="M'+rx(W)+' '+(H*.5+rx(H*.5))+'l'+(rx(26)-8)+' '+(rx(10)-5)+'l'+(rx(22)-6)+' '+(rx(10)-5)+'" stroke="#ff5a1a" stroke-width="1.2" fill="none" opacity=".5"/>');
  n(36,()=>'<circle cx="'+rx(W)+'" cy="'+rx(H)+'" r="'+(.6+rx(1))+'" fill="#d8c0b0" opacity="'+(.15+rx(.3))+'"/>');
  n(5,()=>'<ellipse cx="'+rx(W)+'" cy="'+(H*.7+rx(H*.3))+'" rx="'+(10+rx(12))+'" ry="3" fill="#6a4a3a" opacity=".4"/>')}
 return o}
function pinSvg(c,x,y){const t={'!':['#f0cf5a','!'],'?':['#6fd0ff','?'],'o':['#ffffff',''],'p':['#ff7a5a','']}[c];
 if(c==='o')return'<path d="M'+x+' '+(y-6)+'l5 6-5 6-5-6z" fill="#fff" stroke="#07080a" stroke-width="1.5"/>';
 if(c==='p')return'<circle cx="'+x+'" cy="'+y+'" r="5.5" fill="none" stroke="#ff7a5a" stroke-width="2"/><circle cx="'+x+'" cy="'+y+'" r="1.8" fill="#ff7a5a"/>';
 return'<circle cx="'+x+'" cy="'+y+'" r="6" fill="'+t[0]+'" stroke="#07080a" stroke-width="1.5"/><text x="'+x+'" y="'+(y+3.6)+'" font-size="10" font-weight="700" font-family="Arial,sans-serif" text-anchor="middle" fill="#07080a">'+t[1]+'</text>'}
function doll(l,e,spec,race){const sk=(race==='kharun'?SKK:race==='velhiri'?SKV:SKN)[l.sk],hc=HCL[l.hc],a1=e.a==='a1'||e.a==='a2';
 let x='<svg viewBox="0 0 120 200" width="150" role="img" aria-label="Il tuo personaggio" style="display:block;margin:auto">';
 x+='<rect x="44" y="125" width="14" height="58" fill="#2a2a32"/><rect x="62" y="125" width="14" height="58" fill="#2a2a32"/><rect x="42" y="180" width="18" height="8" fill="#16161a"/><rect x="60" y="180" width="18" height="8" fill="#16161a"/>';
 x+='<rect x="28" y="70" width="12" height="55" rx="5" fill="'+sk+'"/><rect x="80" y="70" width="12" height="55" rx="5" fill="'+sk+'"/>';
 x+='<path d="M38 68h44l4 62H34z" fill="'+(e.a==='a5'?'#3a2a5a':e.a==='a4'?'#5a6a8a':e.a==='a3'?'#2c5a52':e.a==='a2'?'#2c3038':a1?'#8a929c':'#5a4a3a')+'"/>';
 if(e.a==='a5')x+='<path d="M34 126h52l6 54H28z" fill="#2a1c44"/><path d="M60 68v112" stroke="#c9a24d" stroke-width="1.5"/><path d="M46 80h28" stroke="#c9a24d"/>';
 if(e.a==='a4')x+='<path d="M34 126h52l6 54H28z" fill="#4a5a78"/><path d="M48 70l12 14 12-14" fill="none" stroke="#e8e0cc" stroke-width="2"/>';
 if(e.a==='a3')x+='<path d="M34 126h52l6 54H28z" fill="#244a44"/><path d="M60 68v112" stroke="#c9a24d" stroke-width="1.5"/><circle cx="60" cy="96" r="5" fill="#f2b84a"/>';
 if(a1)x+='<path d="M60 68v62M38 92h44" stroke="#5a626c" stroke-width="1.5"/><rect x="26" y="66" width="16" height="10" fill="#aab2bc"/><rect x="78" y="66" width="16" height="10" fill="#aab2bc"/>';
 if(e.a==='a2')x+='<path d="M38 68h44l4 62H34z" fill="none" stroke="#c9a24d" stroke-width="1.5"/><path d="M60 72l8 12-8 12-8-12z" fill="#c9a24d"/><rect x="26" y="66" width="16" height="10" fill="#3a3f48" stroke="#c9a24d"/><rect x="78" y="66" width="16" height="10" fill="#3a3f48" stroke="#c9a24d"/>';
 x+='<rect x="52" y="56" width="16" height="14" fill="'+sk+'"/><ellipse cx="60" cy="42" rx="17" ry="20" fill="'+sk+'"/>';
 if(e.h==='h0'){if(l.hr===0)x+='<path d="M43 40Q44 18 60 18T77 40Q70 30 60 30T43 40z" fill="'+hc+'"/>';
  if(l.hr===1)x+='<path d="M43 42Q42 16 60 16T77 42L80 80H70L68 38Q60 30 52 38L50 80H40z" fill="'+hc+'"/>';
  if(l.hr===2)x+='<path d="M54 24L58 8L62 8L66 24z" fill="'+hc+'"/>'}
 x+=l.f===1?'<circle cx="53" cy="44" r="2" fill="#111"/><circle cx="67" cy="44" r="2" fill="#111"/><path d="M54 54Q60 58 66 54" stroke="#111" fill="none"/>':l.f===2?'<path d="M49 41l8 3M71 41l-8 3" stroke="#111" stroke-width="2"/><circle cx="53" cy="46" r="1.8" fill="#111"/><circle cx="67" cy="46" r="1.8" fill="#111"/><path d="M54 55h12" stroke="#111"/>':'<path d="M50 44h6M64 44h6" stroke="#111" stroke-width="2.5"/><path d="M54 55h12" stroke="#111"/>';
 if(l.m===1)x+='<path d="M48 36L58 52" stroke="#a8362e" stroke-width="2"/>';
 if(l.m===2)x+='<path d="M70 40q5 6 0 12M73 40q5 6 0 12" stroke="#3a6a9a" fill="none" stroke-width="1.5"/>';
 if(e.h==='h1')x+='<path d="M41 40Q42 14 60 14T79 40Q70 30 60 30T41 40z" fill="#6a5a4a"/><path d="M42 24l-6-10 12 4zM78 24l6-10-12 4z" fill="#4a3d30"/>';
 if(e.h==='h4')x+='<path d="M38 52Q36 8 60 6T82 52L74 58Q72 24 60 24T46 58z" fill="#3a2a4a"/><path d="M46 58Q60 66 74 58" fill="#1a1020"/>';
 if(e.h==='h5')x+='<path d="M38 44Q40 12 60 10T82 44L90 50H30z" fill="#5a3a6a"/><path d="M38 44h44" stroke="#c9a24d" stroke-width="2"/>';
 if(e.h==='h3')x+='<path d="M40 50Q38 10 60 10T80 50L76 54H44z" fill="#7a828c" stroke="#c9a24d"/><rect x="50" y="40" width="20" height="4" fill="#111"/>';
 if(e.h==='h2')x+='<path d="M40 50Q38 12 60 12T80 50L74 52Q72 28 60 28T46 52z" fill="#3a3a30"/>';
 const wk=(CL[spec]||{}).wk;
 x+=wk==='arco'?'<path d="M94 56Q112 104 94 152" stroke="'+(e.w==='w3'?'#6a3aa0':e.w==='w2'?'#c9a24d':e.w==='w1'?'#a07a3a':'#6a4a2a')+'" fill="none" stroke-width="4" stroke-linecap="round"/><path d="M94 56L94 152" stroke="#d8d0b8" stroke-width="1"/><path d="M94 104H70" stroke="#8a6a3a" stroke-width="2"/>':wk==='liuto'?'<ellipse cx="94" cy="122" rx="13" ry="17" fill="#8a5a2a" stroke="#c9a24d"/><circle cx="94" cy="122" r="4" fill="#2a1a0a"/><rect x="92" y="62" width="4" height="44" fill="#5a3a1a"/>':wk==='pugnali'?'<path d="M88 112L86 84l3-4 3 4-1 28z" fill="#c8d0d8"/><rect x="84" y="110" width="10" height="3" fill="#3a3a40"/><path d="M30 112L28 84l3-4 3 4-1 28z" fill="#c8d0d8"/><rect x="26" y="110" width="10" height="3" fill="#3a3a40"/>':wk==='bastone'?'<rect x="89" y="50" width="4" height="138" fill="#6a4a2a"/><circle cx="91" cy="46" r="7" fill="#e8d890"/>':'<rect x="88" y="104" width="5" height="12" fill="#5a3a2a"/>'+(e.w==='w3'?'<path d="M89 104L87 44l3-8 3 8-1 60z" fill="#2a1a3a"/><path d="M90 44v58" stroke="#a060e0" stroke-width="1.5"/><rect x="82" y="100" width="16" height="5" fill="#6a3aa0"/>':e.w==='w2'?'<path d="M89 104L87 44l3-8 3 8-1 60z" fill="#e8eef4"/><rect x="82" y="100" width="16" height="5" fill="#c9a24d"/><path d="M90 44v58" stroke="#6aa0c8" stroke-width="1"/>':e.w==='w1'?'<path d="M89 104L87 52h9l-2 52z" fill="#dfe5ea"/><rect x="83" y="100" width="16" height="4" fill="#9a7a30"/>':'<path d="M90 104L89 66h5l-1 38z" fill="#8a8f94"/><rect x="85" y="101" width="14" height="3" fill="#6a5a3a"/>');
 if(race==='velhiri')x+='<path d="M44 44l-10-8 12-2zM76 44l10-8-12-2z" fill="'+sk+'"/><path d="M52 24q8-8 16 0" stroke="#4a7a3a" stroke-width="2" fill="none"/>';
 if(race==='kharun')x+='<path d="M44 28l-6-10 11 5zM76 28l6-10-11 5z" fill="#4a4e56"/><path d="M30 80v30M90 80v30M57 36l4 10" stroke="#c9a24d" stroke-width="1.2"/>';
 if(spec==='guard')x+='<path d="M12 82h22v22Q23 118 12 104z" fill="#6a4a2a" stroke="#c9a24d" stroke-width="1.5"/>';
 return x+'</svg>'}
