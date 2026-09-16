/* ------------------------------------------------------------------
   Hero reel — crossfading self-hosted background clips.

   Self-hosted rather than YouTube-embedded, deliberately. A YouTube iframe
   paints its own chrome (a centred pause glyph) that CSS cannot reach, and
   picks its own rendition regardless of what you ask for — measured: the
   visible player pinned to `medium` with hd1080 sitting in its available
   list. Native <video> has no chrome, no ABR, no cookies, and no API.

   Two <video> elements alternate: the incoming one starts playing off-screen
   and only fades up once it is actually rendering frames, so a stalled clip
   never shows as a frozen frame. Falls back to a poster-still slideshow on
   mobile and under prefers-reduced-motion.
------------------------------------------------------------------ */
(function () {
  var root = document.querySelector('[data-reel]');
  if (!root) return;

  var clips = [];
  try { clips = JSON.parse(root.getAttribute('data-clips')); } catch (e) { return; }
  if (!clips.length) return;

  var DURATION = parseInt(root.getAttribute('data-duration'), 10) || 30000;

  var posters  = [].slice.call(root.querySelectorAll('.hero__poster'));
  var videos   = [].slice.call(root.querySelectorAll('video.hero__player'));
  var capInner = document.querySelector('.reel-caption__inner');
  var capLink  = document.querySelector('.reel-caption a');
  var capIndex = document.querySelector('.reel-caption__index');
  var capText  = document.querySelector('.reel-caption__text');
  var bars     = [].slice.call(document.querySelectorAll('.reel-nav button'));

  var index = 0, slot = 0, timer = null, videoMode = false;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small   = window.matchMedia('(max-width: 760px)').matches;

  /* ---------- shared UI ---------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function paintCaption(i) {
    var c = clips[i];
    if (!capInner) return;
    capInner.classList.remove('is-in');
    window.setTimeout(function () {
      if (capIndex) capIndex.textContent = pad(i + 1) + ' / ' + pad(clips.length);
      if (capText)  capText.textContent  = c.caption;
      if (capLink)  capLink.setAttribute('href', c.href || '#');
      capInner.classList.add('is-in');
    }, reduced ? 0 : 420);
  }

  function paintBars(i) {
    bars.forEach(function (b, n) {
      b.classList.toggle('is-past', n < i);
      if (n === i) { b.removeAttribute('aria-current'); void b.offsetWidth; b.setAttribute('aria-current', 'true'); }
      else b.removeAttribute('aria-current');
    });
  }

  function paintPoster(i) {
    posters.forEach(function (p, n) { p.classList.toggle('is-active', n === i); });
  }

  function schedule() {
    window.clearTimeout(timer);
    var d = (clips[index] && clips[index].duration) ? clips[index].duration : DURATION;
    root.style.setProperty('--reel-duration', (d / 1000) + 's');
    timer = window.setTimeout(function () { go(index + 1); }, d);
  }

  /* ---------- poster-only mode ---------- */

  function goPoster(i) {
    index = ((i % clips.length) + clips.length) % clips.length;
    paintPoster(index); paintCaption(index); paintBars(index);
    schedule();
  }

  /* ---------- video mode ---------- */

  // Resolve when the element is genuinely producing frames, not merely "loaded".
  function whenPlaying(v, cb) {
    var done = false;
    function fire() {
      if (done) return; done = true;
      v.removeEventListener('playing', fire);
      v.removeEventListener('timeupdate', check);
      cb();
    }
    function check() { if (v.currentTime > 0.05) fire(); }
    v.addEventListener('playing', fire);
    v.addEventListener('timeupdate', check);
    window.setTimeout(fire, 4000);           // safety net only
  }

  function go(i) {
    if (!videoMode) return goPoster(i);

    index = ((i % clips.length) + clips.length) % clips.length;
    var next = 1 - slot;
    var v = videos[next];
    if (!v) return goPoster(index);

    v.src = clips[index].src;
    v.load();
    var play = v.play();
    if (play && play.catch) play.catch(function (err) {
      window.console && console.warn('[reel] play() rejected:', err && err.name);
    });

    whenPlaying(v, function () {
      var outgoing = slot;
      videos[next].classList.add('is-active');
      videos[outgoing].classList.remove('is-active');
      slot = next;
      paintPoster(index);
      // Park the clip we just faded away from so only one decodes at a time.
      window.setTimeout(function () {
        try { videos[outgoing].pause(); } catch (e) {}
      }, 1800);
    });

    paintCaption(index);
    paintBars(index);
    schedule();
  }

  /* ---------- boot ---------- */

  paintPoster(0); paintCaption(0); paintBars(0);

  bars.forEach(function (b, n) { b.addEventListener('click', function () { go(n); }); });

  window.console && console.info('[reel] clips:', clips.length,
    '| reduced-motion:', reduced, '| small screen:', small,
    '|', (reduced || small) ? 'POSTER MODE (no video by design)' : 'video mode');

  if (reduced || small) {
    schedule();                          // poster slideshow only
  } else {
    videoMode = true;
    var first = videos[0];
    if (!first.getAttribute('src')) first.src = clips[0].src;
    var p0 = first.play();
    if (p0 && p0.catch) p0.catch(function (err) {
      window.console && console.warn('[reel] autoplay blocked:', err && err.name, '— staying on stills');
    });
    whenPlaying(first, function () {
      first.classList.add('is-active');
      window.console && console.info('[reel] clip 1 playing');
    });
    schedule();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { window.clearTimeout(timer); try { videos[slot].pause(); } catch (e) {} }
    else { try { videos[slot].play(); } catch (e) {} schedule(); }
  });
})();
