/* Disposable debug-only renderer. No game dependencies, storage or master asset access. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('test') !== '1') return;
  var ns = 'http://www.w3.org/2000/svg';
  // Bounds and anchors are in logical pixels, not CSS pixels. Back-to-front order.
  var spec = {
    version: 1, width: 1024, height: 1536,
    zones: [
      ['back', 270, 330, 484, 840, 512, 355],
      ['legs', 355, 810, 314, 530, 512, 835],
      ['feet', 325, 1290, 374, 150, 512, 1320],
      ['torso', 325, 360, 374, 480, 512, 390],
      ['arms', 215, 390, 594, 540, 512, 410],
      ['waist', 325, 790, 374, 120, 512, 825],
      ['head', 380, 120, 264, 265, 512, 340],
      ['offHand', 130, 660, 260, 420, 260, 770],
      ['mainHand', 735, 530, 160, 710, 790, 785]
    ]
  };
  function element(tag, attrs) {
    var node = document.createElementNS(ns, tag);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }
  function module(zone, variant) {
    var id = zone[0], x = zone[1], y = zone[2], w = zone[3], h = zone[4];
    var group = element('g', {'data-zone': id, 'data-module': id + '-' + variant, transform: 'translate(' + x + ' ' + y + ')'});
    var shape;
    if (id === 'torso' && variant === 'custode') {
      shape = element('path', {d: 'M0 50 L75 0 L187 45 L299 0 L374 50 L340 330 L187 480 L34 330 Z', fill: '#57697d'});
      group.appendChild(shape);
      group.appendChild(element('path', {d: 'M187 45 V410 M40 160 L187 210 L334 160', fill: 'none', stroke: '#e9b86e', 'stroke-width': 12}));
    } else if (id === 'arms' || id === 'legs' || id === 'feet') {
      // Paired placeholder pieces leave the central torso visible.
      var breadth = id === 'arms' ? 90 : id === 'legs' ? 115 : 140;
      shape = element('path', {d: 'M8 8 H' + breadth + ' V' + (h - 8) + ' H8 Z M' + (w - breadth) + ' 8 H' + (w - 8) + ' V' + (h - 8) + ' H' + (w - breadth) + ' Z', fill: '#314955'});
      group.appendChild(shape);
    } else {
      // Intentional calibration placeholders, not production artwork.
      shape = element('rect', {x: 8, y: 8, width: w - 16, height: h - 16, rx: 26, fill: id === 'head' ? '#aa8473' : '#314955'});
      group.appendChild(shape);
    }
    shape.setAttribute('stroke', '#94a6b1'); shape.setAttribute('stroke-width', '5');
    var label = element('text', {x: id === 'arms' || id === 'legs' || id === 'feet' ? 60 : w / 2, y: h / 2, fill: '#ffffff', 'text-anchor': 'middle', 'font-size': 30});
    label.textContent = id === 'torso' ? variant.toUpperCase() : id;
    group.appendChild(label);
    return group;
  }
  function createRenderer(svg) {
    svg.setAttribute('viewBox', '0 0 1024 1536');
    spec.zones.forEach(function (zone) { svg.appendChild(module(zone, 'base')); });
    return {
      setTorso: function (variant) {
        if (variant !== 'base' && variant !== 'custode') throw new Error('Unknown POC torso');
        var zone = spec.zones.filter(function (row) { return row[0] === 'torso'; })[0];
        var previous = svg.querySelector('[data-zone="torso"]');
        svg.replaceChild(module(zone, variant), previous);
      }
    };
  }
  function initialize() {
    var mount = document.getElementById('debug-tools');
    if (!mount || document.getElementById('modular-character-poc')) return;
    var section = document.createElement('details');
    section.id = 'modular-character-poc';
    section.innerHTML = '<summary>Modular Character POC</summary><p>PLACEHOLDER · Character Asset Spec v1 · 1024×1536. Nessun asset definitivo. BODY MASTER v2 invariato.</p><div class="poc-switch" role="group" aria-label="Modulo torso"><button data-poc-torso="base" aria-pressed="true">BASE</button><button data-poc-torso="custode" aria-pressed="false">CUSTODE</button></div><svg role="img" aria-label="Personaggio composto da nove zone placeholder indipendenti"></svg><p role="status" aria-live="polite">Torso BASE · altri 8 moduli invariati</p>';
    var style = document.createElement('style');
    style.textContent = '#modular-character-poc {margin-block:16px;padding:12px;border:1px solid #657583;min-width:0} #modular-character-poc summary {min-height:44px;cursor:pointer} #modular-character-poc p {overflow-wrap:anywhere} #modular-character-poc svg {display:block;width:100%;max-width:340px;height:auto;margin:12px auto;background:#101c24} #modular-character-poc .poc-switch {display:flex;gap:8px;flex-wrap:wrap} #modular-character-poc button {min-height:44px;min-width:88px} #modular-character-poc button[aria-pressed="true"] {outline:2px solid #e9b86e}';
    section.appendChild(style);
    mount.appendChild(section);
    var renderer = createRenderer(section.querySelector('svg'));
    section.addEventListener('click', function (event) {
      var button = event.target.closest('[data-poc-torso]');
      if (!button) return;
      var variant = button.dataset.pocTorso;
      renderer.setTorso(variant);
      section.querySelectorAll('[data-poc-torso]').forEach(function (control) { control.setAttribute('aria-pressed', String(control === button)); });
      section.querySelector('[role="status"]').textContent = 'Torso ' + variant.toUpperCase() + ' · altri 8 moduli invariati';
    });
  }
  // Read-only schema exposed only in Test Mode for inspection; no game API hooks.
  spec.zones.forEach(Object.freeze); Object.freeze(spec.zones); Object.freeze(spec);
  window.CharacterModularPOC = Object.freeze({spec: spec});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
