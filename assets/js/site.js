/* header state, mobile nav, scroll reveals */
(function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-stuck', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }

  var targets = document.querySelectorAll('[data-reveal]');
  if (targets.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }
})();

/* talk-list filtering */
(function () {
  var bar = document.querySelector('[data-filters]');
  if (!bar) return;
  var rows = Array.prototype.slice.call(document.querySelectorAll('.talk'));
  var heads = Array.prototype.slice.call(document.querySelectorAll('.group-head'));

  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var want = btn.getAttribute('data-filter');

    bar.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    rows.forEach(function (r) {
      r.hidden = !(want === 'all' || r.getAttribute('data-kind') === want);
    });
    // hide a year heading whose talks are all filtered out
    heads.forEach(function (h) {
      var list = h.nextElementSibling, any = false;
      if (list) {
        list.querySelectorAll('.talk').forEach(function (r) { if (!r.hidden) any = true; });
        h.hidden = !any;
        list.hidden = !any;
      }
    });
  });
})();

/* project filtering — two independent groups (research direction, keyword) that
   AND together, with the state mirrored in the URL so a filtered view is
   shareable and so the front page can deep-link into one direction. */
(function () {
  var grid = document.querySelector('[data-project-grid]');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var bars = Array.prototype.slice.call(document.querySelectorAll('[data-filter-group]'));
  var empty = document.querySelector('[data-empty]');
  var state = { direction: 'all', keyword: 'all' };

  function apply() {
    var shown = 0;
    cards.forEach(function (c) {
      var dirs = (c.getAttribute('data-direction') || '').split('|');
      var tags = (c.getAttribute('data-tags') || '').split('|');
      var ok = (state.direction === 'all' || dirs.indexOf(state.direction) !== -1) &&
               (state.keyword === 'all' || tags.indexOf(state.keyword) !== -1);
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
    bars.forEach(function (bar) {
      var group = bar.getAttribute('data-filter-group');
      Array.prototype.forEach.call(bar.querySelectorAll('button'), function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === state[group]));
      });
    });
  }

  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = [];
    if (state.direction !== 'all') params.push('d=' + encodeURIComponent(state.direction));
    if (state.keyword !== 'all') params.push('k=' + encodeURIComponent(state.keyword));
    history.replaceState(null, '', window.location.pathname + (params.length ? '?' + params.join('&') : ''));
  }

  bars.forEach(function (bar) {
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      state[bar.getAttribute('data-filter-group')] = btn.getAttribute('data-value');
      apply();
      syncUrl();
    });
  });

  /* Deep link from the front-page direction cards: /projects/?d=<key> */
  var q = new URLSearchParams(window.location.search);
  if (q.get('d')) state.direction = q.get('d');
  if (q.get('k')) state.keyword = q.get('k');
  apply();
})();
