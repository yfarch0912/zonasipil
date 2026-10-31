/* ZonaSipil — vanilla JS: mobile nav, scroll reveals, live calculators.
   Formulas per index.html formula block; verified in docs QA notes. */
(function () {
  'use strict';

  /* Mobile nav */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('navMain');
  if (toggle && nav) {
    var tIcon = document.getElementById('navToggleIcon');
    var setIcon = function (open) {
      if (tIcon) tIcon.setAttribute('href', 'assets/icons/icons.svg#' + (open ? 'i-close' : 'i-menu'));
    };
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      setIcon(open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        setIcon(false);
      }
    });
  }

  /* Scroll reveals — skipped entirely under reduced motion */
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Calculators */
  function num(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) && v > 0 ? v : 0;
  }
  function fmt(v, dec) {
    return v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  var form = document.getElementById('calcForm');
  var panel = form;
  function recalc() {
    /* Volume beton: V = p x l x t x n, cadangan = asumsi pengguna (%) */
    var bersih = num('inP') * num('inL') * num('inT') * num('inN');
    var wasteEl = document.getElementById('inW');
    var waste = wasteEl ? parseFloat(wasteEl.value) || 0 : 0;
    if (waste < 0) waste = 0;
    var total = bersih * (1 + waste / 100);
    document.getElementById('outVolNet').textContent = fmt(bersih, 2) + ' m³';
    document.getElementById('outVol').textContent = fmt(total, 2) + ' m³';
    /* Berat tulangan: w = 0,006165 x d^2 (kg/m), dari pi/4 x d^2 x 7850 kg/m3 */
    var d = num('inD');
    var wm = 0.006165 * d * d;
    document.getElementById('outWm').textContent = fmt(wm, 3) + ' kg/m';
    document.getElementById('outW').textContent = fmt(wm * num('inLen'), 1) + ' kg';
    if (panel && !reduced) {
      panel.classList.remove('flash');
      void panel.offsetWidth;
      panel.classList.add('flash');
    }
  }
  if (form) {
    form.addEventListener('input', recalc);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    recalc();
  }
})();
