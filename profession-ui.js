/* M7.3 mobile profession vertical slice. Presentation only; engine owns durable changes. */
const ProfessionUI = (() => {
  const engine=ProfessionEngine.create(), root=document.getElementById("profession-root"), status=document.getElementById("profession-status");
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const matName=id=>ProfessionData.materials.find(x=>x.id===id)?.name||id;
  function render(){
    if(!root)return; const s=engine.state, current=ProgressionStore.state.frontier.location;
    root.innerHTML=`<header class="profession-head"><span class="world-eyebrow">VESPER FRONTIER</span><h1>Professions</h1><p class="hint">Gather, learn and turn frontier knowledge into useful materials.</p></header>
    <div class="profession-list">${ProfessionData.professions.map(p=>{const r=s.professions[p.id],need=engine.threshold(r.level);return `<article class="profession-card"><div><strong>${esc(p.name)}</strong><small>Level ${r.level} · ${r.xp}/${need} XP</small></div><div class="xp-bar"><span style="width:${Math.min(100,r.xp/need*100)}%"></span></div></article>`}).join("")}</div>
    <h3>Gathering sites</h3><p class="hint">Current location: ${esc(WorldData.location(current)?.name||current)}</p><div class="profession-actions">${ProfessionData.gathering.map(n=>`<button data-prof-gather="${n.id}" ${n.location!==current?"disabled":""}><strong>${esc(matName(n.material))}</strong><small>${esc(WorldData.location(n.location)?.name||n.location)} · +${n.amount} · ${n.xp} XP</small></button>`).join("")}</div>
    <h3>Recipes</h3><div class="profession-actions">${ProfessionData.recipes.map(r=>`<button data-prof-craft="${r.id}"><strong>${esc(r.id==="forge-iron"?"Forge Iron":r.id==="frontier-brace"?"Frontier Brace":"Chart Vesper Fragment")}</strong><small>Lv. ${r.level} · ${Object.entries(r.costs).map(([k,v])=>v+" "+matName(k)).join(" + ")}</small></button>`).join("")}</div>
    <h3>Materials</h3><div class="profession-materials">${ProfessionData.materials.map(m=>`<span><strong>${s.materials[m.id]||0}</strong><small>${esc(m.name)}</small></span>`).join("")}</div>
    ${s.discoveries.includes("vesper-fragment-chart")?'<p class="profession-discovery"><strong>Chart assembled</strong><br><small>The fragments reveal a coherent frontier route. Future world integration will use this knowledge.</small></p>':""}`;
    status.textContent=engine.storageIssue?"Profession save unavailable. Changes are disabled until storage returns.":"";
  }
  root?.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;let r;if(b.dataset.profGather)r=engine.gather(b.dataset.profGather,ProgressionStore.state.frontier.location);if(b.dataset.profCraft)r=engine.craft(b.dataset.profCraft);if(r){status.textContent=r.ok?(r.material?`Gathered ${r.amount} ${matName(r.material)}.`:"Crafting complete."):r.message;render();if(r.ok)status.textContent=r.material?`Gathered ${r.amount} ${matName(r.material)}.`:"Crafting complete."; }});
  window.addEventListener("pageshow",()=>{engine.load();render()}); document.addEventListener("nymeria:navigation",e=>{if(e.detail.screen==="professions"){engine.load();render()}});
  render(); return {engine,render};
})();