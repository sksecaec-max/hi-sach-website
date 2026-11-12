/* =========================================================================
   tracing.js — Trace Letters (English A–Z and the Hindi varnamala)
   A big pale letter with a dashed outline; the child traces it with a finger.
   The trace is checked on a small grid: enough of the letter covered (coverage)
   and not too much scribbling outside it (precision). Each session traces a few
   letters and the next session carries on from where this one stopped.
   spec.letters = [{ ch, say, lang }], spec.lang = "en" | "hi"
   Shapes (Magic Shapes): an entry may carry `path` (SVG path in a 100 x 100 box) instead of a font glyph, a
   `label` for the prompt, `become` (HTML shown when the trace passes) and `done` (said when it passes).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  Kido.activities = Kido.activities || {};

  var GRID = 64;                                    // checking grid (GRID x GRID cells)
  var FONT = '"Baloo 2", "Fredoka", sans-serif';

  function store(key, val) {
    try { if (val === undefined) return parseInt(localStorage.getItem(key), 10) || 0; localStorage.setItem(key, String(val)); } catch (e) { return 0; }
  }

  // Draw the letter centred in a size x size box. Devanagari sits higher (the shirorekha line).
  function drawGlyph(ctx, ch, size, hindi) {
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var fs = size * (hindi ? (ch.length > 1 ? 0.62 : 0.72) : 0.8);
    ctx.font = "700 " + fs + "px " + FONT;
    var w = ctx.measureText(ch).width;
    if (w > size * 0.86) { fs *= size * 0.86 / w; ctx.font = "700 " + fs + "px " + FONT; }
    return { x: size / 2, y: size * (hindi ? 0.56 : 0.54), fs: fs };
  }

  // Thin the letter to its 1-cell centre-line (Zhang-Suen). A finished trace runs along nearly all of it.
  function skeleton(core) {
    var a = Array.from(core), changed = true;
    function px(x, y) { return x < 0 || y < 0 || x >= GRID || y >= GRID ? 0 : a[y * GRID + x]; }
    while (changed) {
      changed = false;
      for (var step = 0; step < 2; step++) {
        var del = [];
        for (var y = 0; y < GRID; y++) for (var x = 0; x < GRID; x++) {
          if (!a[y * GRID + x]) continue;
          var n = [px(x, y - 1), px(x + 1, y - 1), px(x + 1, y), px(x + 1, y + 1), px(x, y + 1), px(x - 1, y + 1), px(x - 1, y), px(x - 1, y - 1)];
          var b = 0, t = 0;
          for (var i = 0; i < 8; i++) { b += n[i]; if (!n[i] && n[(i + 1) % 8]) t++; }
          if (b < 2 || b > 6 || t !== 1) continue;
          if (step === 0 ? (n[0] * n[2] * n[4] || n[2] * n[4] * n[6]) : (n[0] * n[2] * n[6] || n[0] * n[4] * n[6])) continue;
          del.push(y * GRID + x);
        }
        for (var j = 0; j < del.length; j++) a[del[j]] = 0;
        if (del.length) changed = true;
      }
    }
    return Uint8Array.from(a);
  }

  // A shape outline in a 100 x 100 box, stroked at `width` (in box units) onto a size x size canvas.
  function strokeShape(ctx, path, size, width) {
    ctx.save(); ctx.scale(size / 100, size / 100);
    ctx.lineWidth = width; ctx.lineJoin = ctx.lineCap = "round"; ctx.stroke(new Path2D(path));
    ctx.restore();
  }

  // Cells covered by the letter itself (core), the letter plus a margin (zone), and its centre-line (skel).
  function letterMasks(ch, hindi, path) {
    var c = document.createElement("canvas"); c.width = c.height = GRID;
    var x = c.getContext("2d"), g = drawGlyph(x, ch, GRID, hindi);
    x.fillStyle = x.strokeStyle = "#000";
    if (path) strokeShape(x, path, GRID, 10); else x.fillText(ch, g.x, g.y);        // an outline about as thick as a letter stroke
    var core = x.getImageData(0, 0, GRID, GRID).data;
    if (path) strokeShape(x, path, GRID, 21); else { x.lineWidth = GRID * 0.11; x.lineJoin = "round"; x.strokeText(ch, g.x, g.y); }
    var zone = x.getImageData(0, 0, GRID, GRID).data;
    var a = new Uint8Array(GRID * GRID), b = new Uint8Array(GRID * GRID);
    for (var i = 0; i < a.length; i++) { a[i] = core[i * 4 + 3] > 100 ? 1 : 0; b[i] = zone[i * 4 + 3] > 40 ? 1 : 0; }
    return { core: a, zone: b, skel: skeleton(a) };
  }

  // score(masks, ink) -> { coverage, precision, parts }
  // `parts` = share of the letter's centre-line the crayon passed over. It is what stops a half-traced letter
  // passing: the crayon is nearly as wide as the letter's strokes, so ink coverage alone passed a letter with only
  // one or two strokes traced (owner's report, 2026-10-21). scripts/trace-check.js tests every letter.
  var REACH = 2;   // a centre-line cell counts as traced when the crayon passed within 2 cells (tracing along an edge)
  function near(ink, i) {
    var x0 = i % GRID, y0 = (i - x0) / GRID;
    for (var dy = -REACH; dy <= REACH; dy++) for (var dx = -REACH; dx <= REACH; dx++) {
      var x = x0 + dx, y = y0 + dy;
      if (x >= 0 && y >= 0 && x < GRID && y < GRID && dx * dx + dy * dy <= REACH * REACH && ink[y * GRID + x]) return true;
    }
    return false;
  }
  function score(m, ink) {
    var nCore = 0, hit = 0, nInk = 0, inside = 0, nSkel = 0, onSkel = 0;
    for (var i = 0; i < ink.length; i++) {
      if (m.core[i]) { nCore++; if (ink[i]) hit++; }
      if (m.skel[i]) { nSkel++; if (near(ink, i)) onSkel++; }
      if (ink[i]) { nInk++; if (m.zone[i]) inside++; }
    }
    return { coverage: nCore ? hit / nCore : 0, precision: nInk ? inside / nInk : 0, parts: nSkel ? onSkel / nSkel : 0 };
  }

  Kido.activities.trace = function (spec) {
    var hindi = spec.lang === "hi", letters = spec.letters, lang = hindi ? "hi-IN" : "en-US";
    var noun = spec.noun || "letter";                                    // "number" for trace-123 (digits 0-9)
    var key = "kido_trace_" + (hindi ? "hi" : noun === "letter" ? "en" : noun);
    var cfg = (Kido.age && Kido.age.cfg()) || { difficulty: 3, rounds: 5 };
    // to pass: most of the letter inked AND nearly every part of it traced (younger children get a little slack)
    var total = Math.min(cfg.rounds || 5, 6, letters.length), need = 0.6, needParts = 0.98;   // complete traces score 1.0 even wobbly or along the edge (scripts/trace-check.js)
    var nudged = false;
    var start = store(key) % letters.length, done = 0, traced = 0, busy = false;

    var m = document.getElementById("screen"); m.innerHTML = ""; m.scrollTop = 0;
    var game = U.el("div", { class: "game " + (hindi ? "game--hindi" : "game--alphabet") });
    var prompt = U.el("div", { class: "game__prompt" });
    var status = U.el("div", { class: "arcade__status" });
    game.appendChild(U.el("div", { class: "game__head" }, [prompt, status]));
    var stage = U.el("div", { class: "trace" });
    var box = U.el("div", { class: "trace__box" });
    var cv = U.el("canvas", { class: "trace__canvas", "aria-label": "Tracing board" });
    box.appendChild(cv);
    var hearBtn = U.el("button", { class: "trace__btn", html: "🔊<span>" + (hindi ? "सुनो" : "Hear") + "</span>" });
    var clearBtn = U.el("button", { class: "trace__btn", html: "↺<span>" + (hindi ? "मिटाओ" : "Clear") + "</span>" });
    var skipBtn = U.el("button", { class: "trace__btn", html: "⏭<span>" + (hindi ? "अगला" : "Next") + "</span>" });
    stage.appendChild(box);
    stage.appendChild(U.el("div", { class: "trace__tools" }, [hearBtn, clearBtn, skipBtn]));
    game.appendChild(stage);
    m.appendChild(game);
    Kido.mascot.say(hindi ? "उँगली से अक्षर बनाओ!" : "Trace the " + noun + " with your finger!", { lang: lang });

    var ctx = cv.getContext("2d"), size = 0, ink, masks, cur, last = null;
    var inkCv = document.createElement("canvas"); inkCv.width = inkCv.height = GRID;
    var inkCtx = inkCv.getContext("2d");

    function letter() { return letters[(start + done) % letters.length]; }
    function updateStatus() { status.textContent = (done + 1) + " / " + total; }

    function paintGuide() {
      var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      size = Math.max(120, Math.round(Math.min(r.width, r.height)));
      cv.width = cv.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      if (cur.path) {                                              // a shape: pale band with a dotted centre-line
        ctx.strokeStyle = "rgba(108, 75, 214, 0.13)"; strokeShape(ctx, cur.path, size, 10);
        ctx.setLineDash([size * 0.012, size * 0.03]);
        ctx.strokeStyle = "rgba(108, 75, 214, 0.6)"; strokeShape(ctx, cur.path, size, 1.4);
        ctx.setLineDash([]);
      } else {
      var g = drawGlyph(ctx, cur.ch, size, hindi);
      ctx.fillStyle = "rgba(108, 75, 214, 0.13)"; ctx.fillText(cur.ch, g.x, g.y);
      ctx.setLineDash([size * 0.02, size * 0.025]);
      ctx.strokeStyle = "rgba(108, 75, 214, 0.55)"; ctx.lineWidth = Math.max(2, size * 0.008); ctx.strokeText(cur.ch, g.x, g.y);
      ctx.setLineDash([]);
      }
      ctx.lineCap = ctx.lineJoin = "round";
    }

    function showLetter() {
      cur = letter(); busy = false; last = null; nudged = false;
      prompt.innerHTML = (hindi ? "अक्षर बनाओ: " : "Trace: ") + '<b class="trace__ch">' + (cur.label || cur.ch) + "</b>";
      var made = box.querySelector(".trace__become"); if (made) made.remove();
      updateStatus();
      inkCtx.clearRect(0, 0, GRID, GRID);
      masks = letterMasks(cur.ch, hindi, cur.path);
      paintGuide();
      Kido.audio.speak(cur.say, { lang: cur.lang || lang });
    }

    function point(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * size / r.width, y: (e.clientY - r.top) * size / r.height }; }
    function stroke(p) {
      var w = size * 0.12, k = GRID / size;          // a fat crayon, about as wide as the letter's stroke
      ctx.strokeStyle = "#FF7A45"; ctx.lineWidth = w;
      inkCtx.strokeStyle = "#000"; inkCtx.lineWidth = w * k; inkCtx.lineCap = inkCtx.lineJoin = "round";
      var a = last || p;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p.x + 0.01, p.y); ctx.stroke();
      inkCtx.beginPath(); inkCtx.moveTo(a.x * k, a.y * k); inkCtx.lineTo(p.x * k + 0.01, p.y * k); inkCtx.stroke();
      last = p;
    }
    cv.addEventListener("pointerdown", function (e) {
      if (busy) return; e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      last = null; stroke(point(e));
    });
    cv.addEventListener("pointermove", function (e) { if (last && !busy) stroke(point(e)); });
    function lift() { if (!last) return; last = null; check(); }
    cv.addEventListener("pointerup", lift);
    cv.addEventListener("pointercancel", lift);

    function check() {
      var d = inkCtx.getImageData(0, 0, GRID, GRID).data, a = new Uint8Array(GRID * GRID);
      for (var i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] > 60 ? 1 : 0;
      var s = score(masks, a);
      if (s.precision < 0.5 && s.coverage > 0.3) {               // mostly outside the letter: help, don't fail
        Kido.mascot.say(hindi ? "लाइन के अंदर बनाओ!" : "Stay inside the dotted line!", { lang: lang });
        return;
      }
      if (s.coverage >= need && s.parts >= needParts && s.precision >= 0.6) return pass(true);
      if (s.coverage > 0.3 && !nudged) {                           // part done: say so once, then let them carry on
        nudged = true;
        Kido.mascot.say(hindi ? "बढ़िया! पूरा अक्षर बनाओ।" : "Good start! Now trace the whole " + noun + ".", { lang: lang });
      }
    }

    function pass(ok) {
      busy = true;
      if (ok) {
        traced++;
        Kido.audio.playCorrectSound();
        Kido.fx.sparkleEl(box);
        Kido.fx.toast(hindi ? U.pick(["शाबाश!", "बहुत बढ़िया!", "कमाल!"]) : U.pick(["Beautiful!", "Great tracing!", "Well done!"]), "ok");
        if (cur.become) box.appendChild(U.el("div", { class: "trace__become", html: cur.become }));   // the shape turns into a thing
      }
      done++;
      store(key, (start + done) % letters.length);
      Promise.resolve(ok ? Kido.audio.speak(cur.done || cur.say, { lang: cur.lang || lang }) : null).then(function () {
        setTimeout(function () {
          if (!game.isConnected) return;
          if (done >= total) Kido.engine.finish(spec, traced, total);
          else showLetter();
        }, ok ? (cur.become ? 1100 : 500) : 150);
      });
    }

    hearBtn.addEventListener("click", function () { if (cur) Kido.audio.speak(cur.say, { lang: cur.lang || lang }); });
    clearBtn.addEventListener("click", function () { if (busy) return; inkCtx.clearRect(0, 0, GRID, GRID); paintGuide(); });
    skipBtn.addEventListener("click", function () { if (!busy) pass(false); });

    var ready = (document.fonts && document.fonts.load) ? document.fonts.load("700 80px " + FONT, letters.map(function (l) { return l.ch; }).join("")) : Promise.resolve();
    ready.catch(function () {}).then(function () { if (game.isConnected) setTimeout(showLetter, 30); });
    // A rotate / resize redraws the guide at the new size and starts the trace again.
    window.addEventListener("resize", function onResize() {
      if (!game.isConnected) return window.removeEventListener("resize", onResize);
      var r = cv.getBoundingClientRect();
      if (Math.round(Math.min(r.width, r.height)) === size) return;    // system bars etc.: same board, keep the trace
      if (cur && !busy) { inkCtx.clearRect(0, 0, GRID, GRID); paintGuide(); }
    });
  };

  Kido.activities.trace._score = score;      // for the self-check in the browser
  Kido.activities.trace._masks = letterMasks;
  Kido.activities.trace._GRID = GRID;
})(window);
