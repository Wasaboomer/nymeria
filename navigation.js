/* Navigation has no dependency on equipment, rendering or persistence modules.
   Keep this small bootstrap first in the deferred script order. */
(function () {
  function showScreen(screen) {
    if (
      screen !== "character" &&
      screen !== "equipment" &&
      screen !== "inventory" &&
      screen !== "combat" &&
      screen !== "class" &&
      screen !== "expeditions" &&
      screen !== "world"
    )
      return;
    var tabs = document.querySelectorAll(".screen-tabs button");
    document.body.setAttribute("data-screen", screen);
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var active = tab.getAttribute("data-screen") === screen;
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
      if (panel) {
        panel.hidden = !active;
        if (active) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      }
    }
  }

  function initialize() {
    var tabs = document.querySelectorAll(".screen-tabs button");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener("click", function (event) {
        showScreen(event.currentTarget.getAttribute("data-screen"));
      });
    }
    var tabList = document.querySelector(".screen-tabs");
    if (tabList)
      tabList.addEventListener("keydown", function (event) {
        var key = event.key;
        if (
          key !== "ArrowLeft" &&
          key !== "ArrowRight" &&
          key !== "Home" &&
          key !== "End"
        )
          return;
        var current = -1;
        for (var i = 0; i < tabs.length; i++)
          if (tabs[i] === event.target) current = i;
        if (current === -1) return;
        event.preventDefault();
        var index =
          key === "Home"
            ? 0
            : key === "End"
              ? tabs.length - 1
              : (current + (key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
        showScreen(tabs[index].getAttribute("data-screen"));
        tabs[index].focus();
      });
    document.addEventListener("nymeria:screen", function (event) {
      showScreen(event.detail);
    });
    showScreen("character");
  }

  window.NymeriaNavigation = { showScreen: showScreen };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
