/* ============================================================================
 * motion.js — theme switch, ambient field, hero disc, pointer light on cards
 * ============================================================================
 * Loaded in <head> without defer so the saved theme applies before first
 * paint. Everything else waits for the DOM. Decorative only: with JS off the
 * page is the static graphite site; with reduced motion on, motion.css keeps
 * every layer still.
 * ==========================================================================*/
(function () {
  'use strict';

  var KEY = 'gga-theme';
  var root = document.documentElement;

  function readTheme() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function saveTheme(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: choice lasts this page only */ }
  }
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  var saved = readTheme();
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function buildAmbient() {
    var field = document.createElement('div');
    field.className = 'ambient';
    field.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 3; i++) field.appendChild(document.createElement('span'));
    document.body.insertBefore(field, document.body.firstChild);
  }

  /* Lathe-cut disc for the index hero: grooves, a turning dashed ring, a
   * sweeping beam and one outward pulse. */
  function buildDisc() {
    var hero = document.querySelector('.hero');
    if (!hero || hero.classList.contains('hero--compact')) return;
    var wrap = document.createElement('div');
    wrap.className = 'disc';
    wrap.setAttribute('aria-hidden', 'true');
    var beam = document.createElement('div');
    beam.className = 'disc__beam';
    wrap.appendChild(beam);

    var s = svg('svg', { viewBox: '0 0 400 400', focusable: 'false' });
    var grooves = svg('g', { fill: 'none', stroke: 'currentColor', 'stroke-width': '1' });
    for (var r = 64; r <= 176; r += 8) {
      grooves.appendChild(svg('circle', { cx: 200, cy: 200, r: r, opacity: (0.35 + (r - 64) / 280).toFixed(2) }));
    }
    s.appendChild(grooves);
    var spin = svg('g', { 'class': 'disc__spin', fill: 'none', stroke: 'currentColor' });
    spin.appendChild(svg('circle', { cx: 200, cy: 200, r: 192, 'stroke-width': '1', 'stroke-dasharray': '2 10' }));
    spin.appendChild(svg('circle', { cx: 200, cy: 200, r: 40, 'stroke-width': '1', 'stroke-dasharray': '18 6' }));
    s.appendChild(spin);
    s.appendChild(svg('circle', { 'class': 'disc__pulse', cx: 200, cy: 200, r: 190 }));
    s.appendChild(svg('circle', { cx: 200, cy: 200, r: 4, fill: 'currentColor' }));
    wrap.appendChild(s);
    hero.insertBefore(wrap, hero.firstChild);
  }

  function buildSwitch() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-switch';
    var dot = document.createElement('span');
    dot.className = 'theme-switch__dot';
    dot.setAttribute('aria-hidden', 'true');
    var label = document.createElement('span');
    btn.appendChild(dot);
    btn.appendChild(label);

    function render() {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      label.textContent = next === 'light' ? 'Light' : 'Dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    }
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      saveTheme(next);
      render();
    });
    render();
    document.body.appendChild(btn);
  }

  /* One delegated listener: the light under the pointer on any card. */
  function trackPointer() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.card, .prep-card, .step');
      if (!el) return;
      var box = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - box.left) + 'px');
      el.style.setProperty('--my', (e.clientY - box.top) + 'px');
    }, { passive: true });
  }

  function init() {
    buildAmbient();
    buildDisc();
    buildSwitch();
    trackPointer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
