/* Small prototype panel; changing identity never silently equips or deletes gear. */
const ClassUI = (() => {
  const node = (id) => document.getElementById(id);
  function render() {
    const cls = ClassSystem.selected(),
      build = ClassSystem.build();
    node("class-choices").innerHTML = Object.values(ClassesData.classes)
      .map(
        (c) =>
          `<button data-class-id="${c.id}" aria-pressed="${c.id === cls.id}">${c.name}<small>${c.role}</small></button>`,
      )
      .join("");
    node("class-info").innerHTML =
      `<h3>${cls.name} · ${cls.role}</h3><p>${cls.description}</p><dl><div><dt>Risorsa</dt><dd>${cls.resource.name} · ${cls.resource.max}</dd></div><div><dt>Statistiche consigliate</dt><dd>${cls.preferredStats.map((s) => GearData.statLabels[s]).join(" · ")}</dd></div><div><dt>Equipaggiamento richiesto</dt><dd>${cls.requirement}</dd></div></dl><p><strong>${cls.passive.name}</strong> — ${cls.passive.description}</p><h3>Abilità</h3><ul>${cls.abilities.map((a) => `<li><strong>${a.name}</strong> — ${a.description} <small>Costo ${a.cost} · CD ${a.cooldown}s${a.resourceGain ? ` · recupera ${a.resourceGain}` : ""}</small></li>`).join("")}</ul>`;
    node("build-choices").innerHTML = cls.buildIds
      .map((id) => ClassesData.builds[id])
      .map(
        (b) =>
          `<button data-build-id="${b.id}" aria-pressed="${b.id === build.id}"><strong>${b.name}</strong><small>${b.description}</small></button>`,
      )
      .join("");
    node("build-weights").textContent = `Pesi provvisori — ${Object.entries(
      build.weights,
    )
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => `${GearData.statLabels[key]} ${value}`)
      .join(
        " · ",
      )}. Consigli per gli oggetti posseduti, non per tutto il gioco.`;
    node("class-save-status").textContent = ClassSystem.storageError
      ? "Salvataggio locale non disponibile."
      : "Classe e tendenza salvate su questo dispositivo. Cambio libero nel prototipo.";
    node("identity-class").textContent = cls.name;
  }
  node("panel-class").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button?.dataset.classId)
      ClassSystem.selectClass(button.dataset.classId);
    if (button?.dataset.buildId)
      ClassSystem.selectBuild(button.dataset.buildId);
  });
  ClassSystem.subscribe(render);
  render();
  return { render };
})();
