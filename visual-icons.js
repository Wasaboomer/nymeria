/* Original 24px navigation glyphs. Labels remain part of every destination. */
const VisualIcons = (() => {
  const paths = {
    character:
      "M8 6Q8 2 12 2T16 6L15 10 12 12 9 10ZM5 22L6 16 10 13H14L18 16 19 22M9 17V22M15 17V22",
    world:
      "M3 20L5 6 11 3 18 6 21 20 14 18 8 21ZM11 3L8 21M18 6L14 18M7 11L17 13",
    activities: "M4 19L7 5H17L20 19 12 22ZM7 5L12 11 17 5M12 11V18M9 15H15",
    menu: "M3 4H9V10H3ZM15 4H21V10H15ZM3 15H9V21H3ZM15 15H21V21H15Z",
    equipment:
      "M7 3L3 7 6 12 8 10 6 22H18L16 10 18 12 21 7 17 3 12 7ZM12 10V18M9 13L12 16 15 13",
    inventory: "M5 7L8 3H16L19 7V21H5ZM5 8H19M8 12H16V17H8ZM10 3V7M14 3V7",
    class: "M12 2L17 8 12 14 7 8ZM3 20L12 15 21 20M4 14L8 11M20 14L16 11",
    journal: "M4 3H18L21 6V21H4ZM18 3V7H21M8 9H15M8 13H17M8 17H14",
    discoveries: "M12 2L15 8 22 11 15 15 12 22 9 15 2 11 9 8ZM12 7V15M8 11H16",
    combat:
      "M5 3L15 13 13 15 3 5ZM19 3L9 13 11 15 21 5ZM4 14L10 20M14 20L20 14M7 17L3 21M17 17L21 21",
    crowns: "M3 8L7 12 12 4 17 12 21 8 19 19H5ZM6 22H18M9 16H15",
    xp: "M12 2L16 8H21L17 13 19 21 12 17 5 21 7 13 3 8H8ZM12 7V13M9 10H15",
    loot: "M3 10L8 3H17L22 10 18 21H6ZM3 10H22M8 3L10 10 12 21M17 3L15 10 12 21",
    map: "M3 3L9 6 15 3 21 6V21L15 18 9 21 3 18ZM9 6V21M15 3V18",
  };
  function svg(type) {
    return `<svg class="nymeria-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[type] || paths.loot}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  return { paths, svg };
})();
