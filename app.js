/* Application wiring and legacy appearance editor; gameplay rules live in equipment.js. */
(() => {
  const CATEGORIES = {
    appearance: "Aspetto",
    torso: "Corazza",
    legs: "Gambe",
    boots: "Stivali",
    cloak: "Mantello",
    weapon: "Arma",
    dye: "Tintura",
  };
  let category = "appearance",
    noticeTimer;
  function notify(text) {
    const n = document.querySelector("#notice");
    n.textContent = text;
    n.classList.add("show");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => n.classList.remove("show"), 3800);
  }
  function swatches(key, palette) {
    return `<div class="swatches">${PALETTES[palette].map((x) => `<button class="swatch" style="--swatch:${x.color}" data-key="${key}" data-id="${x.id}" aria-label="${x.name}" title="${x.name}" aria-pressed="${Equipment.state.character[key] === x.id}"></button>`).join("")}</div>`;
  }
  function renderOptions() {
    const state = Equipment.state.character;
    const options = document.querySelector("#options");
    if (category === "appearance")
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
    else if (category === "dye")
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
    '<button data-category="cloak" aria-label="Mantello">◬<small>04</small></button><button data-category="weapon" aria-label="Arma">†<small>05</small></button><button data-category="appearance" aria-label="Aspetto">✧<small>06</small></button>';
  document.querySelector(".stage").append(right);
  document.addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    if (b.dataset.category) selectCategory(b.dataset.category);
    if (b.dataset.key) Equipment.setCharacter(b.dataset.key, b.dataset.id);
    if (b.dataset.quickEquip)
      notify(
        Equipment.equip(b.dataset.quickEquip, b.dataset.quickSlot).message,
      );
  });
  document.addEventListener("nymeria:notice", (e) => notify(e.detail));
  document.querySelector("#random").addEventListener("click", () => {
    Equipment.randomizeCharacter();
    notify("Aspetto casuale · equipaggiamento invariato");
  });
  document
    .querySelector("#save")
    .addEventListener("click", () =>
      notify(
        Equipment.save()
          ? "Aspetto e inventario salvati su questo dispositivo"
          : "Salvataggio non disponibile in questo browser",
      ),
    );
  document.querySelector("#reset-demo").addEventListener("click", () => {
    InventoryUI.close();
    Equipment.reset();
    category = "appearance";
    selectCategory(category);
    notify("Demo ripristinata: inventario, equipaggiamento e aspetto iniziali");
  });
  function refresh() {
    Character.render();
    Character.renderStats();
    InventoryUI.render();
    renderOptions();
  }
  Equipment.save();
  Equipment.subscribe(refresh);
  refresh();
  window.NymeriaNavigation.showScreen("character");
  if (Equipment.storageIssue)
    notify(
      "Dati locali non leggibili. Demo caricata; verifica il salvataggio.",
    );
})();
