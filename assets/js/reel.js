/* ------------------------------------------------------------------
   Hero reel — crossfading self-hosted background clips.

   Self-hosted rather than YouTube-embedded, deliberately. A YouTube iframe
   paints its own chrome (a centred pause glyph) that CSS cannot reach, and
   picks its own rendition regardless of what you ask for — measured: the
   visible player pinned to `medium` with hd1080 sitting in its available
   list. Native <video> has no chrome, no ABR, no cookies, and no API.

   Two <video> elements alternate: the incoming one starts playing off-screen
   and only fades up once it is actually rendering frames, so a stalled clip
   never shows as a frozen frame.

   TIMING: the caption, the progress bar and the advance timer are all driven
   by real playback, never by the wall clock. They start when the incoming
   clip actually produces frames, and they freeze while it rebuffers. On a
   slow connection the older wall-clock version drifted — the caption moved on
   while the previous clip was still on screen, and the error accumulated
   across clips. A stall watchdog still forces an advance if a clip never
   recovers, so the reel cannot deadlock on a bad connection.

   Falls back to a poster-still slideshow on small screens and under
   prefers-reduced-motion.
------------------------------------------------------------------ */
(function () {
  var root = document.querySelector('[data-reel]');
  if (!root) return;

  var clips = [];
  try { clips = JSON.parse(root.getAttribute('data-clips')); } catch (e) { return; }
  if (!clips.length) return;

  var DURATION  = parseInt(root.getAttribute('data-duration'), 10) || 30000;
  var FIRSTWAIT = 10000;   // give up waiting for first frames, show the still
  var STALLMAX  = 8000;    // give up waiting for a rebuffer, move on

  var posters  = [].slice.call(root.querySelectorAll('.hero__poster'));
  var videos   = [].slice.call(root.querySelectorAll('video.hero__player'));
  var capInner = document.querySelector('.reel-caption__inner');
  var capLink  = document.querySelector('.reel-caption a');
  var capIndex = document.querySelector('.reel-caption__index');
  var capText  = document.querySelector('.reel-caption__text');
  var bars     = [].slice.call(document.querySelectorAll('.reel-nav button'));

  var index = 0, slot = 0, videoMode = false;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small   = window.matchMedia('(max-width: 760px)').matches;

  /* The reel is 26MB of decoration. Skip it outright when the browser says the
     connection cannot carry it -- Save-Data, a 2g-class link, or a measured
     downlink under 1.5Mbps, at which the first clip alone would take a minute.
     Chromium-family only; elsewhere this is undefined and we just play. */
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slowNet = !!(conn && (conn.saveData === true
                 || /2g/.test(conn.effectiveType || '')
                 || (typeof conn.downlink === 'number' && conn.downlink > 0 && conn.downlink < 1.5)));

  /* ---------- a clock that follows the picture ---------- */

  var timer = null, stallTimer = null, remaining = 0, startedAt = 0, running = false;

  function playState(s) { root.style.setProperty('--reel-play', s); }

  function startClock(d) { stopClock(); remaining = d; resumeClock(); }

  function resumeClock() {
    if (running || remaining <= 0) return;
    window.clearTimeout(stallTimer);
    running = true; startedAt = Date.now();
    playState('running');
    timer = window.setTimeout(function () { running = false; go(index + 1); }, remaining);
  }

  function pauseClock() {
    if (!running) return;
    window.clearTimeout(timer);
    remaining -= (Date.now() - startedAt);
    running = false;
    playState('paused');
    // Never wait forever for a clip that is not coming back.
    window.clearTimeout(stallTimer);
    stallTimer = window.setTimeout(function () { go(index + 1); }, STALLMAX);
  }

  function stopClock() {
    window.clearTimeout(timer); window.clearTimeout(stallTimer);
    running = false; remaining = 0;
  }

  /* ---------- shared UI ---------- */

  function afterLoad(fn) {
    if (document.readyState === 'complete') { fn(); return; }
    window.addEventListener('load', function once() {
      window.removeEventListener('load', once); fn();
    });
  }

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

  // Caption, bar and clock move together, and only once the picture has.
  function reveal(i) {
    var d = (clips[i] && clips[i].duration) ? clips[i].duration : DURATION;
    root.style.setProperty('--reel-duration', (d / 1000) + 's');
    paintCaption(i);
    paintBars(i);
    startClock(d);
  }

  /* ---------- poster-only mode ---------- */

  function goPoster(i) {
    index = ((i % clips.length) + clips.length) % clips.length;
    paintPoster(index);
    reveal(index);
  }

  /* ---------- video mode ---------- */

  function onWaiting() { pauseClock(); }
  function onResume()  { resumeClock(); }

  function watch(v)   { if (!v) return;
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('stalled', onWaiting);
    v.addEventListener('playing', onResume);
  }
  function unwatch(v) { if (!v) return;
    v.removeEventListener('waiting', onWaiting);
    v.removeEventListener('stalled', onWaiting);
    v.removeEventListener('playing', onResume);
  }

  // Resolve when the element is genuinely producing frames, not merely "loaded".
  function whenPlaying(v, cb) {
    var done = false, net;
    function fire(viaNet) {
      if (done) return; done = true;
      window.clearTimeout(net);
      v.removeEventListener('playing', onFire);
      v.removeEventListener('timeupdate', check);
      cb(!!viaNet);
    }
    function onFire() { fire(false); }
    function check() { if (v.currentTime > 0.05) fire(false); }
    v.addEventListener('playing', onFire);
    v.addEventListener('timeupdate', check);
    net = window.setTimeout(function () { fire(true); }, FIRSTWAIT);
  }

  function go(i) {
    if (!videoMode) return goPoster(i);

    index = ((i % clips.length) + clips.length) % clips.length;
    var next = 1 - slot;
    var v = videos[next];
    if (!v) return goPoster(index);

    stopClock();
    playState('paused');          // bar holds while the next clip buffers

    v.src = clips[index].src;
    v.load();
    var play = v.play();
    if (play && play.catch) play.catch(function (err) {
      window.console && console.warn('[reel] play() rejected:', err && err.name);
    });

    whenPlaying(v, function (timedOut) {
      var outgoing = slot;
      unwatch(videos[outgoing]);
      if (!timedOut) {
        videos[next].classList.add('is-active');
        videos[outgoing].classList.remove('is-active');
        slot = next;
        watch(videos[next]);
      } else {
        // Never started. Show the still instead of a black rectangle.
        videos[outgoing].classList.remove('is-active');
        videos[next].classList.remove('is-active');
        window.console && console.warn('[reel] clip', index + 1, 'never started — showing still');
      }
      paintPoster(index);
      reveal(index);
      window.setTimeout(function () {
        try { videos[outgoing].pause(); } catch (e) {}
      }, 1800);
    });
  }

  /* ---------- boot ---------- */

  paintPoster(0); paintCaption(0); paintBars(0);

  bars.forEach(function (b, n) { b.addEventListener('click', function () { go(n); }); });

  window.console && console.info('[reel] clips:', clips.length,
    '| reduced-motion:', reduced, '| small screen:', small,
    '| slow network:', slowNet, conn ? '(' + conn.effectiveType + ', ' + conn.downlink + 'Mbps)' : '(unknown)',
    '|', (reduced || small || slowNet) ? 'POSTER MODE (no video by design)' : 'video mode');

  if (reduced || small || slowNet) {
    reveal(0);                           // poster slideshow only
  } else {
    videoMode = true;
    // Wait for load, not DOMContentLoaded: the clip must not compete with the
    // stylesheet, the font and the poster still for bandwidth on a reload.
    afterLoad(function () {
      var first = videos[0];
      first.preload = 'auto';
      if (!first.getAttribute('src')) first.src = clips[0].src;
      var p0 = first.play();
      if (p0 && p0.catch) p0.catch(function (err) {
        window.console && console.warn('[reel] autoplay blocked:', err && err.name, '— staying on stills');
      });
      whenPlaying(first, function (timedOut) {
        if (!timedOut) { first.classList.add('is-active'); watch(first); }
        reveal(0);                       // clock starts with the picture
      });
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pauseClock(); window.clearTimeout(stallTimer); try { videos[slot].pause(); } catch (e) {} }
    else { try { videos[slot].play(); } catch (e) {} resumeClock(); }
  });
})();
