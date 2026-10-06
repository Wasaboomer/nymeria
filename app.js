/* Application wiring. Character creation and Equipment Appearance remain separate. */
(() => {
  const CATEGORIES = {
    torso: "Corazza",
    legs: "Gambe",
    boots: "Stivali",
    cloak: "Mantello",
    weapon: "Arma",
    dye: "Tintura",
  };
  let category = "torso",
    noticeTimer;
  function notify(text) {
    const n = document.querySelector("#notice");
    n.textContent = text;
    n.classList.add("show");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => n.classList.remove("show"), 3800);
  }
  function swatches(key, palette) {
    const selected =
      key === "dye"
        ? Equipment.state.equipmentAppearance.dye
        : Equipment.state.character[key];
    return `<div class="swatches">${PALETTES[palette].map((x) => `<button class="swatch" style="--swatch:${x.color}" ${key === "dye" ? `data-equipment-dye="${x.id}"` : `data-key="${key}" data-id="${x.id}"`} aria-label="${x.name}" title="${x.name}" aria-pressed="${selected === x.id}"></button>`).join("")}</div>`;
  }
  function renderCreator() {
    const available = Equipment.creatorAvailable;
    document.querySelector("#character-creator").hidden = !available;
    document.querySelector("#creator-actions").hidden = !available;
    const options = document.querySelector("#character-appearance-options");
    options.textContent = "";
    if (available) {
      const state = Equipment.state.character;
      document.querySelector("#creator-heading").textContent =
        Equipment.state.characterCreated
          ? "Editor personaggio · DEBUG"
          : "Crea il tuo personaggio";
      document.querySelector("#save").innerHTML =
        `${Equipment.state.characterCreated ? "Conferma aspetto · DEBUG" : "Crea personaggio"} <span>→</span>`;
      options.innerHTML =
        '<p class="option-label">SILHOUETTE CAPELLI</p><div class="item-grid">' +
        ITEMS.hair
          .map(
            (x) =>
              `<button class="item" data-key="hair" data-id="${x.id}" aria-pressed="${state.hair === x.id}"><svg viewBox="105 50 90 90" aria-hidden="true" style="--hair:${Character.color("hair", state.hairColor)}"><g class="layer">${x.back + x.front}</g></svg><span><strong>${x.name}</strong><small>${x.detail}</small></span></button>`,
          )
          .join("") +
        '</div><p class="option-label">COLORE CAPELLI</p>' +
        swatches("hairColor", "hair") +
        '<p class="option-label">COLORE OCCHI</p>' +
        swatches("eyes", "eyes");
    }
    document.querySelector("#reset-demo").hidden = !Equipment.testMode;
    document.querySelector("#creator-debug").hidden = !Equipment.testMode;
    document.querySelector("#creator-debug").disabled = available;
  }
  function renderOptions() {
    const options = document.querySelector("#options");
    if (category === "dye")
      options.innerHTML =
        '<p class="option-label">TINTURA DELLA CORAZZA</p>' +
        swatches("dye", "dye") +
        '<p class="hint">Il pigmento cambia soltanto gli inserti della corazza, senza alterare le statistiche.</p>';
    else {
      const slot = category === "weapon" ? "mainHand" : category;
      options.innerHTML =
        '<div class="item-grid">' +
        Equipment.state.inventory
          .filter((i) => Equipment.compatibleSlots(i).includes(slot))
          .map(
            (i) =>
              `<button class="item" data-quick-equip="${i.id}" data-quick-slot="${slot}" aria-pressed="${Equipment.equipped(slot)?.id === i.id}">${GearData.icon(i)}<span><strong>${i.name}</strong><small>${i.rarity} · iLv ${i.itemLevel}${i.handedness ? ` · ${i.handedness}` : ""}</small></span></button>`,
          )
          .join("") +
        '</div><p class="hint">Per confronti e supporti, apri Inventario. Ogni scelta aggiorna anche l’equipaggiamento.</p>';
    }
  }
  function selectCategory(next) {
    if (!CATEGORIES[next]) return;
    category = next;
    document.querySelector("#selection-label").textContent =
      CATEGORIES[category];
    document
      .querySelectorAll("#categories button")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.category === category)),
      );
    document
      .querySelectorAll(".equipment button")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.category === category),
      );
    renderOptions();
  }
  document.querySelector("#categories").innerHTML = Object.entries(CATEGORIES)
    .map(
      ([id, label]) =>
        `<button data-category="${id}" aria-pressed="${id === category}">${label}</button>`,
    )
    .join("");
  const right = document.createElement("nav");
  right.className = "equipment right";
  right.setAttribute("aria-label", "Slot destri");
  right.innerHTML =
    '<button data-category="cloak" aria-label="Mantello">◬<small>04</small></button><button data-category="weapon" aria-label="Arma">†<small>05</small></button><button data-open-slot="head" aria-label="Copricapo">✧<small>06</small></button>';
  document.querySelector(".stage").append(right);
  document.addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.category) selectCategory(b.dataset.category);
    if (b.dataset.key) Equipment.setCharacter(b.dataset.key, b.dataset.id);
    if (b.dataset.equipmentDye)
      Equipment.setEquipmentDye(b.dataset.equipmentDye);
    if (b.dataset.quickEquip)
      notify(
        Equipment.equip(b.dataset.quickEquip, b.dataset.quickSlot).message,
      );
  });
  document.addEventListener("nymeria:notice", (e) => notify(e.detail));
  document.querySelector("#random").addEventListener("click", () => {
    if (Equipment.randomizeCharacter())
      notify("Aspetto casuale · equipaggiamento invariato");
  });
  document
    .querySelector("#save")
    .addEventListener("click", () =>
      notify(Equipment.createCharacter().message),
    );
  document.querySelector("#creator-debug").addEventListener("click", () => {
    if (!Equipment.debugReopenCreator()) return;
    window.NymeriaNavigation.showScreen("character");
    notify(
      "DEBUG · Character Creator riaperto solo in Test Mode. Progressione conservata.",
    );
  });
  document.querySelector("#reset-demo").addEventListener("click", () => {
    if (!Equipment.testMode) return;
    InventoryUI.close();
    Equipment.reset();
    selectCategory("torso");
    notify(
      "DEBUG · Equipaggiamento demo ripristinato; personaggio creato e progressione conservati",
    );
  });
  function refresh() {
    Character.render();
    Character.renderStats();
    InventoryUI.render();
    renderCreator();
    renderOptions();
  }
  window.addEventListener("storage", (event) => {
    if (event.key === Equipment.SAVE_KEY || event.key === null) {
      Equipment.reconcileCreator();
      refresh();
    }
  });
  Equipment.save();
  Equipment.subscribe(refresh);
  refresh();
  if (Equipment.storageIssue)
    notify(
      "Dati locali non leggibili. Demo caricata; verifica il salvataggio.",
    );
})();
