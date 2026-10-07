/* Character hub delegates all asset composition to the shared rig. */
const Character = (() => {
  const instance = VisualRenderer.create(document.querySelector("#character"));
  const color = (palette, id) =>
    (PALETTES[palette].find((x) => x.id === id) || PALETTES[palette][0]).color;
  const render = () => instance.render();
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
  return {
    render,
    renderStats,
    color,
    ready: instance.ready,
    diagnostics: instance.diagnostics,
  };
})();
