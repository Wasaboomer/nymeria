function show(t){ov.hidden=false;ov.innerHTML='<div class="sheet"><p>'+t+'</p><button data-a="ok">Continua</button></div>'}
function ask(t,o){AO=o;ov.hidden=false;ov.innerHTML='<div class="sheet"><p>'+t+'</p>'+o.map((c,i)=>'<button data-a="ao" data-v="'+i+'">'+c[0]+(c[1]?'<small>'+c[1]+'</small>':'')+'</button>').join('')+'</div>'}
