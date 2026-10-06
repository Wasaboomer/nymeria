/* Existing mannequin, now driven by appearanceItem rather than gameplay stats. */
const Character = (() => {
  const rig = document.querySelector("#rig");
  const extraOrder = [
    "cloak",
    "hair-back",
    "body / skin",
    "ears",
    "legs",
    "boots",
    "torso",
    "arms/gloves",
    "gloves",
    "belt",
    "necklace",
    "eyes",
    "hair-front",
    "head",
    "earLeft",
    "earRight",
    "braceletLeft",
    "braceletRight",
    "ringLeft",
    "ringRight",
    "support",
    "weapon",
  ];
  for (const layer of extraOrder) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.dataset.layer = layer;
    g.classList.add("layer");
    rig.append(g);
  }
  const groups = Object.fromEntries(
    [...rig.children].map((g) => [g.dataset.layer, g]),
  );
  const color = (palette, id) =>
    PALETTES[palette].find((x) => x.id === id).color;
  const weaponAssets = {
    sword: ITEMS.weapon[0].svg,
    staff: ITEMS.weapon[1].svg,
    dagger:
      '<path fill="url(#blade)" d="M220 222L217 260 224 279 231 260 228 222Z"/><path fill="#c2ad80" d="M213 218H235V225H213Z"/><path fill="#50404a" d="M221 195H227V219H221Z"/>',
    wand: '<path fill="#66504b" d="M221 199H227V266H221Z"/><path fill="#a1cdbf" d="M224 180L233 194 224 207 215 194Z"/><path fill="none" stroke="#c7b17e" d="M216 191Q203 207 218 220M232 191Q244 207 230 220"/>',
    bow: '<path fill="none" stroke="#ad9167" stroke-width="5" d="M223 147Q258 218 222 298"/><path fill="none" stroke="#c9d5ca" stroke-width="1" d="M223 147L219 220 222 298"/><path fill="url(#metal)" d="M218 206H227V231H218Z"/>',
    crossbow:
      '<path fill="#635047" d="M221 185H229V268H221Z"/><path fill="none" stroke="#91a9a3" stroke-width="5" d="M197 224Q224 191 251 224"/><path fill="none" stroke="#a9b4a6" d="M197 224H251M224 203V256"/><path fill="#c7b17e" d="M217 234H233V248H217Z"/>',
    greatsword:
      '<path fill="url(#blade)" d="M214 224H234L237 327 224 361 211 327Z"/><path fill="none" stroke="#ecedd4" d="M224 235V342"/><path fill="#c2ad80" d="M201 219L208 212 224 218 240 212 246 219 232 230H216Z"/><path fill="#50404a" d="M220 183H228V217H220Z"/><path fill="#b6c5ba" d="M224 175L232 184 224 194 216 184Z"/>',
    spear:
      '<path fill="#65534a" d="M222 126H228V381H222Z"/><path fill="url(#blade)" d="M225 68L237 104 225 136 213 104Z"/><path fill="none" stroke="#e7e6d9" d="M225 84V120"/><path fill="#c7b17e" d="M216 135H234V142H216Z"/>',
  };
  function supportAsset(type) {
    const assets = {
      shield:
        '<path fill="url(#metal)" d="M70 198L96 185 119 198 114 240 96 262 75 243Z"/><path fill="#305960" d="M79 205L96 197 111 205 106 236 96 249 84 237Z"/><path fill="none" stroke="#c7b17e" d="M96 203V239M86 217H106"/>',
      dagger:
        '<path fill="url(#blade)" d="M95 234L89 275 97 286 103 275 101 234Z"/><path fill="#c7b17e" d="M85 229H110V236H85Z"/>',
      offhandBlade:
        '<path fill="url(#blade)" d="M95 234L89 309 97 325 104 309 101 234Z"/><path fill="#c7b17e" d="M84 229H111V236H84Z"/>',
      quiver:
        '<path fill="#615445" d="M77 201L103 210 94 271 70 262Z"/><path fill="none" stroke="#d2c5a0" stroke-width="2" d="M82 208L94 173M88 211L101 177M95 212L109 181"/><path fill="#667f76" d="M85 198L104 203 98 220 80 215Z"/>',
      bolts:
        '<path fill="#414d54" d="M78 214H106L103 258H76Z"/><path fill="none" stroke="#cad2c3" stroke-width="3" d="M83 219V194M92 218V190M101 220V196"/>',
      book: '<path fill="#405f70" d="M69 210L97 204 117 213 109 247 89 241 64 244Z"/><path fill="#c8c0a4" d="M97 209L111 216 106 240 91 237 70 241 75 216Z"/><path fill="none" stroke="#405f70" d="M97 209L91 237M77 222L89 219M76 229L87 226M99 221L105 224"/>',
      orb: '<circle fill="#476d77" cx="93" cy="226" r="18"/><path fill="#9ac4bc" d="M93 210L104 226 93 242 82 226Z"/><path fill="none" stroke="#c7b17e" stroke-width="2" d="M74 233Q93 252 112 233M80 250H107"/>',
      focus:
        '<path fill="url(#metal)" d="M93 201L108 222 93 248 78 222Z"/><path fill="#c7b17e" d="M93 211L100 222 93 234 86 222Z"/><path fill="none" stroke="#c7b17e" d="M82 241L72 262M104 241L113 262"/>',
    };
    return assets[type] || "";
  }
  function smallAsset(slot, asset) {
    if (slot === "head")
      return asset === "helm"
        ? '<path fill="url(#metal)" d="M123 80L130 67 150 60 170 67 179 80 176 107 165 100 161 81 150 74 139 81 135 100 124 107Z"/><path fill="none" stroke="#c7b17e" d="M150 65V73M128 80L139 76M162 76L174 80"/>'
        : '<path fill="none" stroke="#c7b17e" stroke-width="3" d="M124 84L140 81 150 73 161 81 177 84"/><path fill="#b5d7cc" d="M150 74L156 82 150 90 144 82Z"/>';
    if (slot === "gloves")
      return `<path fill="${asset === "iron" ? "url(#metal)" : "#62545c"}" d="M95 214L110 219 111 232 103 240 94 233 91 225ZM213 190L223 190 232 198 229 210 220 211 209 203Z"/><path fill="none" stroke="#c7b17e" d="M97 224L106 226M217 199L227 202"/>`;
    if (slot === "belt")
      return `<path fill="${asset === "gold" ? "#ab9367" : "#69564b"}" d="M120 217L177 217 181 230 117 230Z"/><path fill="#344b52" d="M142 215H157V232H142Z"/><path fill="none" stroke="#d3c19b" d="M147 219H153V228H147Z"/>`;
    if (slot === "necklace")
      return `<path fill="none" stroke="#c7b17e" d="M135 139Q150 174 166 139"/><path fill="${asset === "moon" ? "#9ac4bc" : "#b9a37b"}" d="M150 159L156 169 150 177 144 169Z"/>`;
    const left = slot.endsWith("Left"),
      x = left ? 116 : 184;
    if (slot.startsWith("ear"))
      return `<path fill="none" stroke="#c7b17e" d="M${x} 99v9"/><path fill="${asset === "tear" ? "#9ac4bc" : asset === "ember" ? "#bf7c5b" : "#c7b17e"}" d="M${x} 107l4 6-4 6-4-6Z"/>`;
    const wristX = left ? 101 : 218,
      wristY = left ? 218 : 199;
    if (slot.startsWith("bracelet"))
      return `<path fill="none" stroke="${asset === "iron" ? "#a3bcb5" : asset === "leaf" ? "#829a77" : "#b5a3c0"}" stroke-width="4" d="M${wristX - 7} ${wristY}l12 4"/>`;
    if (slot.startsWith("ring"))
      return `<circle fill="none" stroke="#c7b17e" stroke-width="2" cx="${left ? 103 : 225}" cy="${left ? 232 : 204}" r="3"/><circle fill="${asset === "tide" ? "#9ac4bc" : asset === "dusk" ? "#b498b0" : "#c7b17e"}" stroke="none" cx="${left ? 103 : 225}" cy="${left ? 230 : 202}" r="1.8"/>`;
    return "";
  }
  const baseClothes = {
    torso:
      '<path fill="#253a43" d="M126 140L112 151 124 190 126 230H174L176 190 188 151 174 140 161 147H139Z"/><path fill="none" stroke="#526970" d="M134 156L150 166 166 156"/>',
    legs: ITEMS.legs[0].svg,
    boots:
      '<path fill="#4a4240" d="M124 355L141 355 139 371 131 379H109V371L121 366ZM159 355H176L180 366 192 371V379H169L161 371Z"/>',
  };
  const rendered = new Map();
  function updateGroup(layer, markup, id) {
    const group = groups[layer];
    if (group.dataset.item !== id || rendered.get(layer) !== markup) {
      group.innerHTML = markup;
      group.dataset.item = id;
      rendered.set(layer, markup);
    }
  }
  function render() {
    const state = Equipment.state.character;
    for (const layer of ["body / skin", "ears", "arms/gloves"])
      updateGroup(layer, ANATOMY[layer], "base");
    const hair = ITEMS.hair.find((x) => x.id === state.hair);
    updateGroup("hair-back", hair.back, state.hair);
    updateGroup("hair-front", hair.front, state.hair);
    updateGroup(
      "eyes",
      '<path fill="none" stroke="#503e3c" d="M131 94L142 92M158 92L169 94"/><path fill="#eee5d3" stroke="none" d="M132 98Q137 94 142 98Q137 101 132 98ZM158 98Q163 94 168 98Q163 101 158 98Z"/><path fill="var(--eyes)" stroke="#233b3d" stroke-width=".8" d="M136 95H139V100H136ZM161 95H164V100H161Z"/>',
      "eyes",
    );
    for (const slot of GearData.slots) {
      const layer = slot.id === "mainHand" ? "weapon" : slot.id;
      const item = Equipment.appearance(slot.id);
      let markup = baseClothes[layer] || "";
      if (item?.appearance) {
        const asset = item.appearance.asset;
        if (["torso", "legs", "boots", "cloak"].includes(layer))
          markup = ITEMS[layer].find((x) => x.id === asset)?.svg || "";
        else if (layer === "weapon") markup = weaponAssets[asset] || "";
        else if (layer === "support") markup = supportAsset(asset);
        else markup = smallAsset(layer, asset);
      }
      updateGroup(layer, markup, item?.id || "empty");
    }
    rig.style.setProperty("--hair", color("hair", state.hairColor));
    rig.style.setProperty("--eyes", color("eyes", state.eyes));
    groups.torso.style.setProperty(
      "--dye",
      color("dye", Equipment.state.equipmentAppearance.dye),
    );
  }
  function renderStats() {
    const values = Equipment.state.resultingStats;
    document.querySelector("#power").textContent = Equipment.state.power;
    document.querySelector("#stats").innerHTML = Object.entries(values)
      .slice(0, 4)
      .map(
        ([k, v]) =>
          `<div><dt>${GearData.statLabels[k]}</dt><dd>${v}</dd></div>`,
      )
      .join("");
    document.querySelectorAll(".panel-summary").forEach((x) => {
      x.innerHTML = `<div><span>POTERE</span><strong>${Equipment.state.power}</strong></div><p>${Object.entries(
        values,
      )
        .map(
          ([k, v]) =>
            `${GearData.statLabels[k]} <b>${v}${k === "critical" || k === "speed" ? "%" : ""}</b>`,
        )
        .join(" · ")}</p>`;
    });
  }
  return { render, renderStats, color };
})();
