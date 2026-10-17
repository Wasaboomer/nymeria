const isP=k=>k.slice(0,2)==='p_',CAPM=()=>20+(S.bx||0),CAPT=()=>20+(S.mx||0),
usedM=()=>Object.keys(S.items).filter(u=>!eqd(u)).length+Object.entries(S.inv).reduce((a,[k,v])=>a+(isP(k)?Math.ceil(v/20):0),0),
usedT=()=>Object.entries(S.inv).reduce((a,[k,v])=>a+(isP(k)?0:Math.ceil(v/99)),0),
room=k=>isP(k)?usedM()<CAPM()||(S.inv[k]||0)%20>0:usedT()<CAPT()||(S.inv[k]||0)%99>0;
function toast(t){let d=document.getElementById('ts');if(!d){d=document.createElement('div');d.id='ts';d.setAttribute('role','status');document.body.appendChild(d)}d.textContent=t;d.className='on';clearTimeout(toast.h);toast.h=setTimeout(()=>d.className='',Math.max(2600,t.length*55))}
function inv(k,n,q){let ok=0;for(let i=0;i<n;i++){if(!room(k))break;S.inv[k]=(S.inv[k]||0)+1;ok++}if(ok<n&&!q)toast((isP(k)?'Zaino pieno':'Borsa dei materiali piena')+': '+(n-ok)+' × '+(MN[k]||k)+' persi.');return ok}
