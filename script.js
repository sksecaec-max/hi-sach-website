/* ============================================================
   Hi-Sach — script.js
   Loader · header · nav · cursor · reveals · counters · tilt ·
   Three.js scenes (hero / ecosystem / cta) · contact form.
   Vanilla JS, no build step. Runs from file:// — Three.js is the
   classic global build loaded before this file (window.THREE).
   ============================================================ */
(function () {
  'use strict';

  /* Mark that JS is active so the CSS can safely hide reveal elements. */
  document.documentElement.classList.add('js');

  /* ---------- Small helpers ---------- */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var isMobile = window.matchMedia('(max-width: 760px)').matches;

  /* Detect WebGL support once — decides whether the 3D scenes are built. */
  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  var webglOK = hasWebGL() && !!window.THREE;

  /* Enable 3D only when it's actually worth it (WebGL + motion allowed). */
  var enable3D = webglOK && !reduceMotion;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* Clamp helper. */
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* ============================================================
     LOADER — animate a short progress bar, then reveal the page.
     ============================================================ */
  function initLoader() {
    var loader = $('#loader');
    if (!loader) return;
    document.body.classList.add('no-scroll');
    var fill = $('.loader__fill', loader);
    var pct = 0, finished = false;

    var timer = setInterval(function () {
      pct = Math.min(100, pct + Math.random() * 18 + 6);
      if (fill) fill.style.width = pct + '%';
      if (pct >= 100) { clearInterval(timer); done(); }
    }, 130);

    function done() {
      if (finished) return;
      finished = true;
      if (fill) fill.style.width = '100%';
      setTimeout(function () {
        loader.classList.add('is-done');
        document.body.classList.remove('no-scroll');
        setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 700);
      }, 200);
    }

    // Safety nets so the loader can never trap the page.
    window.addEventListener('load', function () { pct = 100; });
    setTimeout(function () { clearInterval(timer); done(); }, 4000);
  }

  /* ============================================================
     HEADER — solid glass background once the page has scrolled.
     ============================================================ */
  function initHeader() {
    var header = $('#header');
    if (!header) return;
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 20); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     ACTIVE NAV — highlight the section currently in the viewport.
     ============================================================ */
  function initActiveNav() {
    var links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) {
      var href = l.getAttribute('href');
      if (href && href.charAt(0) === '#') map[href.slice(1)] = l;
    });
    var sections = Object.keys(map)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        if (map[e.target.id]) map[e.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ============================================================
     MOBILE MENU — hamburger toggle with focus + ESC handling.
     ============================================================ */
  function initMobileMenu() {
    var btn = $('#hamburger'), menu = $('#mobileMenu');
    if (!btn || !menu) return;

    function open() { setState(true); }
    function close() { setState(false); }
    function setState(isOpen) {
      btn.classList.toggle('is-open', isOpen);
      menu.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      menu.setAttribute('aria-hidden', String(!isOpen));
      document.body.classList.toggle('no-scroll', isOpen);
      btn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    }

    btn.addEventListener('click', function () {
      setState(!menu.classList.contains('is-open'));
    });
    $$('.mobile-menu__link', menu).forEach(function (l) {
      l.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { close(); btn.focus(); }
    });
  }

  /* ============================================================
     CUSTOM CURSOR — pointer devices only (disabled on touch / reduced
     motion). A dot tracks 1:1; a ring eases behind it and grows over
     interactive targets. [data-magnetic] elements pull toward the pointer.
     ============================================================ */
  function initCursor() {
    if (isTouch || reduceMotion) return;
    var dot = $('.cursor--dot'), ring = $('.cursor--ring');
    if (!dot || !ring) return;

    document.body.classList.add('cursor-ready');
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    var hoverSel = 'a,button,.service,.project,.contact-card,input,textarea,select';
    $$(hoverSel).forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); dot.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); dot.classList.remove('is-hover'); });
    });

    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.25) + 'px,' + (dy * 0.25) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ============================================================
     SCROLL REVEALS — fade/slide [data-reveal] elements into view.
     Siblings sharing a parent are staggered for a cascade effect.
     ============================================================ */
  function initReveals() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    // Stagger siblings within a shared parent (looks great on card grids).
    var counts = {};
    items.forEach(function (el, idx) {
      var pid = el.parentNode.__revealId || (el.parentNode.__revealId = 'g' + idx);
      var i = counts[pid] || 0;
      if (!el.style.getPropertyValue('--reveal-delay')) {
        el.style.setProperty('--reveal-delay', Math.min(i * 0.08, 0.4) + 's');
      }
      counts[pid] = i + 1;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     COUNTERS — animate .stat__num[data-count] when scrolled into view.
     Honours reduced motion by snapping straight to the final value.
     ============================================================ */
  function initCounters() {
    var nums = $$('.stat__num[data-count]');
    if (!nums.length) return;

    function fmt(v, decimals) {
      return v.toLocaleString('en-US', {
        minimumFractionDigits: decimals, maximumFractionDigits: decimals
      });
    }
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var decimals = (String(target).split('.')[1] || '').length;
      if (reduceMotion) { el.textContent = fmt(target, decimals) + suffix; return; }
      var dur = 1600, start = null;
      (function step(ts) {
        if (start === null) start = ts;
        var p = clamp((ts - start) / dur, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = fmt(target * eased, decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target, decimals) + suffix;
      })();
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     TILT — subtle 3D pointer tilt on [data-tilt]/.tilt cards, and feed
     --mx/--my so the .service__glow radial tracks the pointer. Pointer
     devices only; skipped on touch / reduced motion.
     ============================================================ */
  function initTilt() {
    if (isTouch || reduceMotion) return;
    var MAX = 7; // degrees
    $$('[data-tilt], .tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * MAX * 2;
        var ry = (px - 0.5) * MAX * 2;
        el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ============================================================
     THREE.JS SCENES — hero network sphere, draggable ecosystem crystal,
     and the CTA octahedron. All gated behind enable3D (WebGL + motion
     allowed). When disabled or on error, the container gets .is-fallback
     and the CSS orb shows instead. One shared RAF loop drives every
     scene and pauses whenever the tab / Browser pane is hidden.
     ============================================================ */
  var _scenes = [];
  var _sceneRAF = null, _lastT = 0;

  function _sceneLoop(t) {
    _sceneRAF = requestAnimationFrame(_sceneLoop);
    var dt = (t - _lastT) / 1000;
    if (!(dt > 0) || dt > 0.05) dt = 0.016;
    _lastT = t;
    for (var i = 0; i < _scenes.length; i++) {
      try { _scenes[i].render(dt, t); } catch (e) {}
    }
  }
  function _startSceneLoop() {
    if (_sceneRAF == null && _scenes.length) { _lastT = performance.now(); _sceneRAF = requestAnimationFrame(_sceneLoop); }
  }
  function _stopSceneLoop() {
    if (_sceneRAF != null) { cancelAnimationFrame(_sceneRAF); _sceneRAF = null; }
  }

  function initScenes() {
    var hero = $('#heroScene'), eco = $('#ecoScene'), cta = $('.cta__scene');
    if (!enable3D) {
      [hero, eco, cta].forEach(function (el) { if (el) el.classList.add('is-fallback'); });
      return;
    }
    try { buildHeroScene(); } catch (e) { if (hero) hero.classList.add('is-fallback'); }
    try { buildEcoScene(); }  catch (e) { if (eco)  eco.classList.add('is-fallback'); }
    try { buildCtaScene(); }  catch (e) { if (cta)  cta.classList.add('is-fallback'); }

    window.addEventListener('resize', function () {
      for (var i = 0; i < _scenes.length; i++) { try { _scenes[i].resize(); } catch (e) {} }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) _stopSceneLoop(); else _startSceneLoop();
    });
    _startSceneLoop();
  }

  /* Hero: a rotating sphere of nodes joined by proximity lines, floating
     in a soft particle field, with gentle mouse parallax on the camera. */
  function buildHeroScene() {
    var wrap = $('#heroScene'), canvas = $('#heroCanvas');
    if (!wrap || !canvas) return;
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(55, 1, 0.1, 100); cam.position.z = 3.5;
    var group = new T.Group(); scene.add(group);

    var N = isMobile ? 42 : 84, R = 1.5, pts = [];
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(Math.max(0, 1 - y * y));
      var th = Math.PI * (3 - Math.sqrt(5)) * i;
      pts.push(new T.Vector3(Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R));
    }
    group.add(new T.Points(new T.BufferGeometry().setFromPoints(pts),
      new T.PointsMaterial({ color: 0x22d3ee, size: 0.05, transparent: true, opacity: 0.95 })));
    var segs = [];
    for (var a = 0; a < N; a++) for (var b = a + 1; b < N; b++) {
      if (pts[a].distanceTo(pts[b]) < 0.62) segs.push(pts[a], pts[b]);
    }
    group.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(segs),
      new T.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.22 })));

    var pc = isMobile ? 240 : 500, pp = new Float32Array(pc * 3);
    for (var k = 0; k < pc * 3; k++) pp[k] = (Math.random() - 0.5) * 9;
    var pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pp, 3));
    scene.add(new T.Points(pg, new T.PointsMaterial({ color: 0x9fb4d8, size: 0.018, transparent: true, opacity: 0.5 })));

    var tx = 0, ty = 0;
    if (!isTouch) window.addEventListener('mousemove', function (e) {
      tx = e.clientX / window.innerWidth - 0.5; ty = e.clientY / window.innerHeight - 0.5;
    });
    function resize() {
      var w = wrap.clientWidth || 1, h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    resize();
    _scenes.push({ render: function (dt) {
      group.rotation.y += 0.12 * dt; group.rotation.x += 0.03 * dt;
      cam.position.x += (tx * 0.8 - cam.position.x) * 0.05;
      cam.position.y += (-ty * 0.6 - cam.position.y) * 0.05;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
    }, resize: resize });
  }

  /* Ecosystem: a wireframe crystal core ringed by orbiting satellites.
     Drag to rotate (pointer events cover mouse + touch); it auto-rotates
     again shortly after you let go. */
  function buildEcoScene() {
    var wrap = $('#ecoScene'), canvas = $('#ecoCanvas');
    if (!wrap || !canvas) return;
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(50, 1, 0.1, 100); cam.position.z = 4.3;
    var root = new T.Group(); scene.add(root);
    var core = new T.Mesh(new T.IcosahedronGeometry(1.05, 1),
      new T.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.5 }));
    root.add(core);
    var sats = new T.Group(); root.add(sats);
    var COUNT = isMobile ? 5 : 8;
    for (var i = 0; i < COUNT; i++) {
      var ring = new T.Group();
      ring.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      var m = new T.Mesh(new T.SphereGeometry(0.085, 16, 16),
        new T.MeshBasicMaterial({ color: i % 2 ? 0x8b5cf6 : 0x22d3ee }));
      m.position.x = 1.9; ring.add(m);
      ring.userData.s = 0.3 + Math.random() * 0.5; sats.add(ring);
    }
    var drag = false, lx = 0, ly = 0, idle = 0;
    canvas.addEventListener('pointerdown', function (e) {
      drag = true; lx = e.clientX; ly = e.clientY; idle = 0;
      wrap.classList.add('is-grabbing');
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!drag) return;
      root.rotation.y += (e.clientX - lx) * 0.005; root.rotation.x += (e.clientY - ly) * 0.005;
      lx = e.clientX; ly = e.clientY; idle = 0;
    });
    function release() { drag = false; wrap.classList.remove('is-grabbing'); }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    function resize() {
      var w = wrap.clientWidth || 1, h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    resize();
    _scenes.push({ render: function (dt) {
      idle += dt;
      if (!drag && idle > 0.4) root.rotation.y += 0.15 * dt;
      core.rotation.y -= 0.1 * dt; core.rotation.x += 0.05 * dt;
      for (var j = 0; j < sats.children.length; j++) sats.children[j].rotation.z += sats.children[j].userData.s * dt;
      renderer.render(scene, cam);
    }, resize: resize });
  }

  /* CTA: a slowly spinning octahedron — dark solid, bright wireframe
     edges, and a larger violet halo cage that breathes. */
  function buildCtaScene() {
    var wrap = $('.cta__scene'), canvas = $('#ctaCanvas');
    if (!wrap || !canvas) return;
    var T = window.THREE;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(50, 1, 0.1, 100); cam.position.z = 4;
    var g = new T.Group(); scene.add(g);
    g.add(new T.Mesh(new T.OctahedronGeometry(1.15, 0),
      new T.MeshBasicMaterial({ color: 0x0b1220 })));
    g.add(new T.Mesh(new T.OctahedronGeometry(1.16, 0),
      new T.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.85 })));
    var halo = new T.Mesh(new T.OctahedronGeometry(1.55, 0),
      new T.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.22 }));
    g.add(halo);
    function resize() {
      var w = wrap.clientWidth || 1, h = wrap.clientHeight || 1;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    resize();
    _scenes.push({ render: function (dt, t) {
      g.rotation.y += 0.3 * dt; g.rotation.x += 0.12 * dt;
      halo.rotation.y -= 0.5 * dt; halo.rotation.z += 0.2 * dt;
      var s = 1 + Math.sin(t * 0.0015) * 0.04; g.scale.set(s, s, s);
      renderer.render(scene, cam);
    }, resize: resize });
  }

  /* ============================================================
     CONTACT FORM — front-end validation + a simulated submit. Actual
     delivery is left as a clearly marked backend integration point.
     ============================================================ */
  function initForm() {
    var form = $('#contactForm');
    if (!form) return;
    var status = $('#formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var phoneRe = /^[0-9+()\-\s]{7,}$/;

    // Field id -> validator returning an error string ('' means valid).
    var rules = {
      'cf-name':    function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
      'cf-email':   function (v) { if (!v.trim()) return 'Please enter your email.'; return emailRe.test(v.trim()) ? '' : 'Enter a valid email address.'; },
      'cf-phone':   function (v) { return (!v.trim() || phoneRe.test(v.trim())) ? '' : 'Enter a valid phone number.'; },
      'cf-service': function (v) { return v ? '' : 'Please choose a service.'; },
      'cf-message': function (v) { return v.trim().length >= 10 ? '' : 'Tell us a little more (10+ characters).'; }
    };

    function field(id) { return document.getElementById(id); }
    function setErr(id, msg) {
      var el = field(id), err = document.getElementById(id + '-err');
      if (el) { el.classList.toggle('is-invalid', !!msg); el.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
      if (err) err.textContent = msg || '';
      return !msg;
    }
    function validate(id) { return rules[id] ? setErr(id, rules[id](field(id) ? field(id).value : '')) : true; }

    // Live-clear a field's error as the user corrects it; validate on blur.
    Object.keys(rules).forEach(function (id) {
      var el = field(id);
      if (!el) return;
      var ev = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(ev, function () { if (el.classList.contains('is-invalid')) validate(id); });
      el.addEventListener('blur', function () { validate(id); });
    });

    function setStatus(msg, state) {
      if (!status) return;
      status.textContent = msg;
      status.classList.remove('is-sending', 'is-success', 'is-error');
      if (state) status.classList.add(state);
    }

    function handleSubmit(e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      Object.keys(rules).forEach(function (id) {
        if (!validate(id)) { ok = false; if (!firstBad) firstBad = field(id); }
      });
      if (!ok) {
        setStatus('Please fix the highlighted fields.', 'is-error');
        if (firstBad) firstBad.focus();
        return;
      }
      form.classList.add('is-sending');
      setStatus('Sending…', 'is-sending');

      /* -------------------------------------------------------------
         BACKEND INTEGRATION POINT — v1 ships with no backend, so the
         send is simulated below. To deliver for real, POST the form
         to your endpoint here, e.g.:
           fetch('/api/contact', { method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(Object.fromEntries(new FormData(form))) })
             .then(function (r) { if (!r.ok) throw 0; })
             .then(onSuccess).catch(onError);
         Keep the .is-sending / success / error UI updates below.
         ------------------------------------------------------------- */
      setTimeout(function () {
        form.classList.remove('is-sending');
        form.reset();
        Object.keys(rules).forEach(function (id) { setErr(id, ''); });
        setStatus('Thanks — your message is on its way. We’ll be in touch soon.', 'is-success');
      }, 1300);
    }

    form.addEventListener('submit', handleSubmit);
  }

  /* ============================================================
     BOOT — wire everything up once the DOM is ready.
     ============================================================ */
  ready(function () {
    initLoader();
    initHeader();
    initActiveNav();
    initMobileMenu();
    initCursor();
    initReveals();
    initCounters();
    initTilt();
    initScenes();
    initForm();
    // Keep the footer year current if a placeholder is present.
    var yr = document.getElementById('year');
    if (yr) yr.textContent = new Date().getFullYear();
  });
})();
