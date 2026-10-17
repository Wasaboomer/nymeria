/* Mappe dipinte: mondo e regioni, con luoghi cliccabili (posizioni in % sull'immagine) */
const MPOS={
vespro:{v:[55,16],p:[31,31],r:[12,46],b:[29,64],f:[59,40],c:[88,50],u:[68,74]},
selva:{sa:[92,48],sb:[46,28],sc:[63,72],sd:[11,15],se:[16,71]},
karuun:{g:[16,15],gh:[73,24],k:[35,46],gi:[83,67]},
neve:{na:[17,70],nb:[48,43],nc:[23,21],nd:[76,15],ne:[82,61]},
cenere:{da:[31,15],db:[65,31],dc:[42,62],dd:[83,74],de:[10,47]},
mare:{ma:[42,17],mb:[10,33],mc:[62,53],md:[90,26],me:[35,66]}};
const MEX={vespro:{g:[93,10],sa:[3,60],ma:[36,95],da:[96,66]},selva:{r:[97,57]},karuun:{v:[4,32],na:[30,3]},neve:{g:[8,92]},cenere:{c:[33,2]},mare:{b:[46,2]}},SHN={vespro:'Vespro',selva:'Selva',karuun:'Karuun',neve:'Terre di neve',cenere:'Ceneri',mare:'Mare'};
const MAR={vespro:1280/960,selva:1.5,karuun:1280/960,neve:1280/960,cenere:1.5,mare:1.5,mondo:1.5};
const MW={vespro:[49,32],selva:[20,25],karuun:[78,36],neve:[77,14],cenere:[78,70],mare:[38,76]};
let MZ=1;
function mapSvg(rg){const pins=qPins();rg=rg||(LC[S.loc]&&LC[S.loc].rg)||'vespro';const pos=MPOS[rg],ex=MEX[rg]||{},W=1000,H=Math.round(W/MAR[rg]),adj=nb(S.loc),k=2.6;
 const P=(id)=>{const q=pos[id]||ex[id];return q?[q[0]*W/100,q[1]*H/100]:null};
 const ids=[...Object.keys(pos),...Object.keys(ex)];
 let s='<svg viewBox="0 0 '+W+' '+H+'" style="width:'+Math.round(MZ*100)+'%;display:block"><image href="'+MAPIMG[rg]+'" x="0" y="0" width="'+W+'" height="'+H+'" preserveAspectRatio="none"/>';
 E.filter(e=>P(e[0])&&P(e[1])).forEach(e=>{const a=P(e[0]),b=P(e[1]),mx=(a[0]+b[0])/2+(b[1]-a[1])*.12,my=(a[1]+b[1])/2-(b[0]-a[0])*.12,d='M'+a[0]+' '+a[1]+' Q'+mx+' '+my+' '+b[0]+' '+b[1];s+='<path d="'+d+'" fill="none" stroke="#000" stroke-opacity=".55" stroke-width="9" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="#f0cf7a" stroke-opacity=".9" stroke-width="4" stroke-dasharray="14 10" stroke-linecap="round"/>'});
 ids.forEach(id=>{const l=LC[id],p=P(id);if(!l||!p)return;const here=id===S.loc,ok=adj.some(a=>a[0]===id),ext=!pos[id],r=here?22:17,lab=ext?'→ '+SHN[l.rg]:l.n,fs=27,w=lab.length*fs*.52+22,ly=ext&&p[1]>H*.85?p[1]-40:p[1]+(r+30);
  const lx=Math.max(w/2+4,Math.min(W-w/2-4,p[0]));
  s+='<g '+(ok?'data-a="trav" data-v="'+id+'" style="cursor:pointer"':'')+' opacity="'+(l.wip?.8:1)+'">'+(ok?'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="36" fill="#6fd0ff" fill-opacity=".18"/>':'')+'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(r+4)+'" fill="#000" fill-opacity=".55"/><circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+r+'" fill="'+(here?'#e0b050':ok?'#5f9fb8':l.wip?'#3a3a42':'#55555e')+'" stroke="'+(here?'#fff':'#e6e1d5')+'" stroke-width="3"'+(l.wip?' stroke-dasharray="6 4"':'')+'/>'+(here?'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="#07080a"/>':'')+
   '<rect x="'+(lx-w/2)+'" y="'+(ly-fs*.85)+'" width="'+w+'" height="'+(fs*1.25)+'" rx="8" fill="#07080a" fill-opacity=".72"/><text x="'+lx+'" y="'+ly+'" text-anchor="middle" font-size="'+fs+'" font-family="Spectral,Georgia,serif" fill="'+(l.wip?'#b4b4bc':'#f0ebde')+'">'+lab+'</text>'+
   '<g transform="scale('+k+')">'+(pins[id]||[]).map((c,n)=>pinSvg(c,(p[0]+r+8+n*30)/k,(p[1]-r-8)/k)).join('')+'</g></g>'});
 return s+'</svg>'}
function mapFocus(){const m=document.querySelector('#ov .mapz');if(!m)return;const rg=(LC[S.loc]&&LC[S.loc].rg)||'vespro',sv=m.querySelector('svg'),q=MPOS[m.dataset.rg]&&MPOS[m.dataset.rg][S.loc];if(!sv)return;if(q){m.scrollLeft=Math.max(0,sv.clientWidth*q[0]/100-m.clientWidth/2);m.scrollTop=Math.max(0,sv.clientHeight*q[1]/100-m.clientHeight/2)}}
function worldSvg(){const here=(LC[S.loc]&&LC[S.loc].rg)||'vespro',W=1000,H=Math.round(W/MAR.mondo);
 return'<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;display:block"><image href="'+MAPIMG.mondo+'" x="0" y="0" width="'+W+'" height="'+H+'" preserveAspectRatio="none"/>'+Object.entries(RG).map(([id,r])=>{const q=MW[id],x=q[0]*W/100,y=q[1]*H/100,h=id===here,fs=34,lab=r.n,w=lab.length*fs*.52+24;return'<g data-a="rgn" data-v="'+id+'" style="cursor:pointer"><circle cx="'+x+'" cy="'+y+'" r="'+(h?30:24)+'" fill="#000" fill-opacity=".5"/><circle cx="'+x+'" cy="'+y+'" r="'+(h?24:19)+'" fill="'+(h?'#e0b050':r.wip?'#3a3a42':'#5f9fb8')+'" stroke="#fff" stroke-width="3"'+(r.wip?' stroke-dasharray="6 4"':'')+'/><rect x="'+(x-w/2)+'" y="'+(y+34)+'" width="'+w+'" height="'+(fs*1.3)+'" rx="9" fill="#07080a" fill-opacity=".75"/><text x="'+x+'" y="'+(y+34+fs)+'" text-anchor="middle" font-size="'+fs+'" font-family="Spectral,Georgia,serif" fill="#f0ebde">'+lab+'</text></g>'}).join('')+'</svg>'}
