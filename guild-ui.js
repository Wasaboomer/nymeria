(() => {
  if(typeof document==="undefined") return;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function render(){
    const root=$("guild-root"); if(!root||!window.GuildSystem) return;
    const g=GuildSystem.state.guild;
    if(!g){root.innerHTML='<div class="guild-empty"><span class="guild-sigil">◇</span><h2>Fonda una gilda</h2><p class="hint">Crea una comunità persistente. In M7.1 i contributi alimenteranno veri progetti collettivi.</p><form id="guild-create"><label>Nome<input name="name" maxlength="28" required placeholder="Es. Custodi del Vespro"></label><label>Motto<input name="motto" maxlength="72" placeholder="Una promessa condivisa"></label><fieldset><legend>Sigillo</legend><label><input type="radio" name="sigil" value="tower" checked> Torre</label><label><input type="radio" name="sigil" value="sun"> Sole</label><label><input type="radio" name="sigil" value="wolf"> Lupo</label></fieldset><button>Crea gilda</button><p id="guild-status" role="status"></p></form></div>';return;}
    const need=GuildData.xpForLevel(g.level), pct=Math.min(100,Math.round(g.xp/need*100));
    root.innerHTML='<header class="guild-hero"><span class="guild-sigil">'+({tower:"♜",sun:"☼",wolf:"◇"}[g.sigil]||"◇")+'</span><div><span class="eyebrow">GILDA · LIVELLO '+g.level+'</span><h1>'+esc(g.name)+'</h1><p>'+esc(g.motto||"Nessun motto")+'</p></div></header>'+
      '<section class="guild-xp"><strong>Reputazione di gilda</strong><span>'+g.xp+' / '+need+' XP</span><div class="xp-bar"><span style="width:'+pct+'%"></span></div></section>'+
      '<section><div class="section-title"><h2>Tesoreria</h2><span>CONDIVISA</span></div><div class="guild-treasury"><b>'+g.treasury.crowns+'<small>Corone</small></b><b>'+g.treasury.iron+'<small>Ferro</small></b><b>'+g.treasury.fiber+'<small>Fibre</small></b><b>'+g.treasury.ether+'<small>Etere</small></b></div><form id="guild-contribute"><select name="kind"><option value="crowns">Corone</option><option value="iron">Ferro</option><option value="fiber">Fibre</option><option value="ether">Etere</option></select><input name="amount" type="number" min="1" max="9999" value="10"><button>Contribuisci</button></form><p class="hint">M7.0: contributi locali di prova. Il collegamento all'inventario personale arriva dopo la validazione.</p></section>'+
      '<section><div class="section-title"><h2>Membri</h2><span>'+g.members.length+'</span></div><div class="guild-members">'+g.members.map(m=>'<article><span class="guild-avatar">'+esc(m.name[0])+'</span><div><strong>'+esc(m.name)+'</strong><small>'+esc(GuildData.roles[m.role]||m.role)+' · Liv. '+m.level+'</small></div><b>'+Number(m.contribution||0)+'<small> contributi</small></b></article>').join("")+'</div></section>';
  }
  document.addEventListener("submit",e=>{
    if(e.target.id==="guild-create"){e.preventDefault();const f=new FormData(e.target),r=GuildSystem.createGuild({name:f.get("name"),motto:f.get("motto"),sigil:f.get("sigil")});if(!r.ok)$("guild-status").textContent=r.message;else render();}
    if(e.target.id==="guild-contribute"){e.preventDefault();const f=new FormData(e.target);GuildSystem.contribute(f.get("kind"),f.get("amount"));render();}
  });
  document.addEventListener("DOMContentLoaded",()=>{render();GuildSystem?.subscribe(render)});
})();
