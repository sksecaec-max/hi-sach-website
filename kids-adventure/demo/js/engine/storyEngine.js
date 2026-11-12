/* =========================================================================
   storyEngine.js — Kido.StoryEngine: interactive story adventures
   Plays a story written as DATA (js/data/storyAdventures.js): scenes in a
   place (Kido.worldArt.storyScene), a cast of rigged characters
   (Kido.Characters), and a list of BEATS per scene:

     { narrate: [short, long] }                 narrator line
     { say: "tiko", text: [short, long], mood, pose }
     { tap: "stump" | "tiko", ask: [..], then: {...} }   child touches something
     { choice: { ask: [..], options: [ { hot, label, detail, next } ] } }
     { puzzle: "footprints_001" }               runs Kido.PuzzleEngine, waits
     { video: "elephant_trunk_001" }            runs Kido.VideoManager, waits (skipped if not available)
     { move: { who, to } }  { mood: { who: state } }  { show | hide | reveal: key }  { sfx: key }
     { celebrate: true }    { end: true }       end → Kido's reward flow
     { celebrate: "treasure" }  Change #23: the big finish (light, three waves of confetti, a fanfare)
     story.achievement      Change #23: a shareable achievement card (js/achievement.js) shown before the rewards
     any beat may carry  when: { sceneId: optionId }  to play only after that choice

   Change #17A — the same engine, more ways for the child to take part:
     { seek: { ask, more, need: [n, n], items: [ { hot, label, react, then, beats, ends, no } ], hint } }
                     look around: find things in any order. `ends` marks the one that matters
                     (finding it ends the search); `no` makes a funny decoy with its own line.
     { sort: { ask, by, places: { key: { label, at } }, items: [ { hot, name, to, show, yes, no } ] } }
                     tidy up: tap where each thing belongs; it flies there.
     choice options may carry  no: [..] (a gentle clue, then try again) · yes: [..] · then · by · plate: "top"
     (an option or a sort place can show its name above it, when two names would touch below;
     on any screen, a name moves to the other side or is nudged when it would touch: spreadPlates)
     { fly: { what, to, keep, rotate, scale } }   a drawn thing travels across the scene
     { focus: key | false }   the camera leans in gently toward something (false = back out)
     { do: {...} }  { look: { who: key } }  { pose: { who: pose } }  { gone: key }  { wait: ms }
     then / do take  show · hide · mood · pose · look · focus · move · fly · reveal · gone · sfx
     (lead, on an interactive beat, takes the instant ones: show · hide · mood · pose · look · focus)
     interactive beats may carry  lead: {...}  — stage directions while the child decides
     any beat (choice option, seek item, sort item or place) may carry  ages: [from, to]
     scene: { reveal: [..], gone: [..] } — how the place looks as the scene opens (so a resumed
     story looks right) · ambience: "jungle" | null — the scene's own sound bed · tint: "night"

   [short, long] text pairs are picked by the child's age band (pre-readers get
   the short line); [few, more] counts (seek need) follow the same rule. Progress
   (current scene, choices, puzzles, completion) is saved in Kido.progress under
   "storyProgress", so a story can be resumed.
   Reuses: Kido.Characters, Kido.audio (speech + sounds), Kido.fx, Kido.mascot,
   Kido.PuzzleEngine, Kido.VideoManager, Kido.engine.finish (rewards + result).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var SVGNS = "http://www.w3.org/2000/svg";

  var voiceOn = true;          // story narration switch (session); the text is always on screen
  var live = null;             // the story currently on screen

  function stories() { return Kido.storyAdventures || []; }
  function get(id) { return stories().filter(function (s) { return s.id === id || s.activityId === id; })[0] || null; }
  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  var textShort = null;     // set per run from Kido.Learning.storyStyle (null = age default)
  function isShort() { return textShort == null ? Kido.age.isPreReader() : textShort; }
  function pickText(t) {
    if (!Array.isArray(t)) return t || "";
    return isShort() ? t[0] : (t[1] || t[0]);
  }
  /** [few, more] counts follow the same rule as [short, long] lines. */
  function pickNum(v) { return Array.isArray(v) ? (isShort() ? v[0] : (v[1] != null ? v[1] : v[0])) : v; }
  /** ages: [from, to] — content for some ages only, matched on the child's age band (e.g. "5-6" → 5). */
  function ageFits(r) {
    if (!r) return true;
    var lo = parseInt(Kido.age.current(), 10) || 5;
    return lo >= r[0] && lo <= r[1];
  }
  function fill(t, thing) {
    if (Array.isArray(t)) return t.map(function (x) { return fill(x, thing); });
    return String(t == null ? "" : t).replace(/\{thing\}/g, thing);
  }
  /** Name plates shown together (a choice, a sort) stay readable on any screen. Each sits below its
      thing (or above it, when the story asks: plate: "top"); when that side would run under the
      dialogue bar, over another thing to tap or off the screen, it takes the other side, or (last
      choice) the left or right. Plates that would still touch are nudged apart.
      avoid: elements to keep clear of (the dialogue bar). */
  var PLATE_SIDE = { below: "", above: "plate-top", left: "plate-left", right: "plate-right" };
  function plateSide(s, side) {
    s.classList.remove("plate-top", "plate-left", "plate-right");
    if (PLATE_SIDE[side]) s.classList.add(PLATE_SIDE[side]);
  }
  function spreadPlates(layer, avoid) {
    var spots = Array.prototype.slice.call(layer.querySelectorAll(".st-spot.has-plate"));
    spots.forEach(function (s) {
      var p = s.querySelector(".st-plate"); if (p) p.style.transform = "";
      plateSide(s, s.getAttribute("data-plate") === "top" ? "above" : "below");
    });
    if (!spots.length) return;
    var o = layer.getBoundingClientRect(), z = (layer.offsetWidth ? o.width / layer.offsetWidth : 1) || 1;   // the camera may be zoomed
    var W = layer.offsetWidth || o.width, H = layer.offsetHeight || o.height, gap = 6;
    function box(el) { var r = el.getBoundingClientRect(); return { x: (r.left - o.left) / z, y: (r.top - o.top) / z, w: r.width / z, h: r.height / z }; }
    function hit(a, c) {
      var ix = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), iy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
      return ix > 0 && iy > 0 ? ix * iy : 0;
    }
    function off(a) {
      var ix = Math.min(a.x + a.w, W) - Math.max(a.x, 0), iy = Math.min(a.y + a.h, H) - Math.max(a.y, 0);
      return a.w * a.h - Math.max(0, ix) * Math.max(0, iy);
    }
    var walls = [].concat(avoid || []).filter(function (el) { return el && !el.hidden && el.getClientRects().length; }).map(box);
    function settle(r) {             // where a plate ends up once it steps off the dialogue bar (as the nudge below does)
      walls.forEach(function (w) {
        var ox = Math.min(r.x + r.w, w.x + w.w) - Math.max(r.x, w.x) + gap, oy = Math.min(r.y + r.h, w.y + w.h) - Math.max(r.y, w.y) + gap;
        if (ox > 0 && oy > 0 && oy <= ox) r = { x: r.x, y: r.y + (r.y + r.h / 2 <= w.y + w.h / 2 ? -oy : oy), w: r.w, h: r.h };
      });
      return r;
    }
    var things = spots.map(box), placed = [], start = [];
    spots.forEach(function (s, i) {
      var p = s.querySelector(".st-plate"), best = null;
      var sides = s.getAttribute("data-plate") === "top" ? ["above", "below", "left", "right"] : ["below", "above", "left", "right"];
      sides.forEach(function (side, k) {
        plateSide(s, side);
        var r0 = box(p), r = settle(r0), cost = off(r) * 3 + r.w * r.h * [0, .15, .3, .3][k];   // the story's own side wins a tie
        walls.forEach(function (w) { cost += hit(r, w) * 2; });
        things.forEach(function (t, j) { if (j !== i) cost += hit(r, t) * 3; });   // a name on the wrong thing misleads
        placed.forEach(function (q) { cost += hit(r, q) * 2; });
        if (!best || cost < best.cost) best = { side: side, cost: cost, r0: r0, r: r };
      });
      plateSide(s, best.side);
      placed.push(best.r); start.push(best.r0);
    });
    var bs = start.map(function (r, i) { return { p: spots[i].querySelector(".st-plate"), x: r.x, y: r.y, w: r.w, h: r.h, dx: 0, dy: 0 }; });
    function keepOn(c) {
      c.dx = Math.max(4 - c.x, Math.min(W - 4 - c.w - c.x, c.dx));
      c.dy = Math.max(4 - c.y, Math.min(H - 4 - c.h - c.y, c.dy));
    }
    for (var pass = 0; pass < 8; pass++) {
      var moved = false;
      for (var i = 0; i < bs.length; i++) for (var j = i + 1; j < bs.length; j++) {
        var a = bs[i], b = bs[j], ax = a.x + a.dx, ay = a.y + a.dy, bx = b.x + b.dx, by = b.y + b.dy;
        var ox = Math.min(ax + a.w, bx + b.w) - Math.max(ax, bx) + gap, oy = Math.min(ay + a.h, by + b.h) - Math.max(ay, by) + gap;
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox <= oy && a.w + b.w + gap <= W - 8) { var sx = ax + a.w / 2 <= bx + b.w / 2 ? 1 : -1; a.dx -= sx * ox / 2; b.dx += sx * ox / 2; }   // side by side only if both fit across
        else { var sy = ay + a.h / 2 <= by + b.h / 2 ? 1 : -1; a.dy -= sy * oy / 2; b.dy += sy * oy / 2; }
      }
      bs.forEach(function (c) {          // the dialogue bar does not move: the plate steps off it
        walls.forEach(function (w) {
          var cx = c.x + c.dx, cy = c.y + c.dy;
          var ox = Math.min(cx + c.w, w.x + w.w) - Math.max(cx, w.x) + gap, oy = Math.min(cy + c.h, w.y + w.h) - Math.max(cy, w.y) + gap;
          if (ox <= 0 || oy <= 0) return;
          moved = true;
          if (oy <= ox) c.dy += (cy + c.h / 2 <= w.y + w.h / 2 ? -1 : 1) * oy;
          else c.dx += (cx + c.w / 2 <= w.x + w.w / 2 ? -1 : 1) * ox;
        });
      });
      bs.forEach(keepOn);
      if (!moved) break;
    }
    bs.forEach(function (c) {
      var dx = Math.round(c.dx), dy = Math.round(c.dy);
      if (dx || dy) c.p.style.transform = "translate(" + dx + "px, " + dy + "px)";
    });
  }

  /* ---- progress (one blob inside Kido.progress) ---- */
  function allProgress() { return Kido.progress.get("storyProgress") || {}; }
  function progressOf(id) { return allProgress()[id] || null; }
  function saveProgress(id, patch) {
    var all = allProgress(), cur = all[id] || { status: "new", choices: {}, puzzles: {}, completions: 0 };
    Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
    cur.updatedISO = new Date().toISOString();
    all[id] = cur;
    Kido.progress.set("storyProgress", all);
    return cur;
  }

  function stopLive() {
    if (!live) return;
    live.stopped = true;
    if (live.ro) live.ro.disconnect();
    if (Kido.Voice && Kido.Voice.stop) Kido.Voice.stop();
    else if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (Kido.AudioManager) Kido.AudioManager.releaseAmbience();   // the next screen may keep or change it
    live = null;
  }

  function run(spec) {
    stopLive();
    var story = get(spec.storyId);
    var mount = document.getElementById("screen");
    mount.innerHTML = ""; mount.scrollTop = 0;
    if (!story) { console.warn("[Kido] Unknown story", spec.storyId); Kido.fx.toast("Coming soon!"); return; }

    // Light adaptation: shorter lines / extra pointing / simpler choices when the
    // child's play suggests it (Kido.Learning) — the story itself never changes.
    var style = Kido.Learning ? Kido.Learning.storyStyle(story) : null;
    textShort = style ? style.short : null;
    var tapWaits = [];                     // how long finding each thing to tap took (the only story signal)
    var root = U.el("div", { class: "st" + (calm() ? " is-calm" : "") + (style && style.guided ? " is-guided" : "") });
    var svg = document.createElementNS(SVGNS, "svg");
    // st-art = the story's own rules; kw-art = Kido World's ambient life (trees sway, clouds drift, water
    // ripples), which the story places are drawn with too.
    svg.setAttribute("class", "st-art kw-art"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    var cam = U.el("div", { class: "st-cam" });            // the place, its touchable things and the cast: the camera moves them together
    var hotLayer = U.el("div", { class: "st-hot" });
    var castLayer = U.el("div", { class: "st-cast" });
    var vignette = U.el("div", { class: "st-vignette", "aria-hidden": "true" });
    var dlg = U.el("div", { class: "st-dlg", role: "group", "aria-label": "Story" });
    var portrait = U.el("div", { class: "st-dlg__face", "aria-hidden": "true" });
    var who = U.el("div", { class: "st-dlg__who" });
    var text = U.el("p", { class: "st-dlg__text", "aria-live": "polite" });
    var dots = U.el("div", { class: "st-dots", "aria-hidden": "true", hidden: "hidden" });   // how many things are left to find
    var voiceBtn = U.el("button", { class: "st-round st-voice", type: "button" });
    var nextBtn = U.el("button", { class: "st-round st-next", type: "button", "aria-label": "Next", html: Kido.icons ? Kido.icons.play() : "" });
    var body = U.el("div", { class: "st-dlg__body" }, [who, text, dots]);
    dlg.appendChild(portrait); dlg.appendChild(body); dlg.appendChild(voiceBtn); dlg.appendChild(nextBtn);
    var overlay = U.el("div", { class: "st-overlay", hidden: "hidden" });
    var veil = U.el("div", { class: "st-veil", "aria-hidden": "true" });
    cam.appendChild(svg); cam.appendChild(hotLayer); cam.appendChild(castLayer);
    root.appendChild(cam); root.appendChild(vignette); root.appendChild(dlg); root.appendChild(overlay); root.appendChild(veil);
    mount.appendChild(root);

    var me = live = { root: root, stopped: false, ro: null };
    var cast = {};               // key → { actor, anchor, hidden }
    var scene = null, mode = null, choices = {}, waitingNext = null;
    var artW = 1000, artH = 600; // the place drawing's design size (set by drawPlace)
    var placeOps = [];           // what has happened to this place so far — replayed if it is redrawn (screen turned)
    var flown = {};              // drawn things moved by { fly }: key → offset
    var focusKey = null;         // what the camera leans toward (null = whole place)

    function alive() { return !me.stopped && root.isConnected; }
    function paintVoice() {
      voiceBtn.innerHTML = voiceOn ? '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 010 6M18 6.5a8 8 0 010 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        : '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
      voiceBtn.setAttribute("aria-label", voiceOn ? "Turn story voice off" : "Turn story voice on");
      voiceBtn.setAttribute("aria-pressed", voiceOn ? "false" : "true");
    }
    voiceBtn.addEventListener("click", function () {
      voiceOn = !voiceOn; paintVoice();
      if (!voiceOn) stopVoice();
    });
    paintVoice();

    /* ---------- place + cast ---------- */
    function pickMode() { return root.clientWidth / Math.max(1, root.clientHeight) >= 1.05 ? "L" : "P"; }
    function drawPlace(place) {
      mode = pickMode();
      var art = Kido.worldArt.storyScene(place, mode);
      artW = art.W; artH = art.H;
      svg.setAttribute("viewBox", "0 0 " + art.W + " " + art.H);
      svg.innerHTML = art.svg;
      if (svg.__place !== place) { placeOps = []; flown = {}; }
      svg.__place = place;
      placeOps.forEach(function (op) { applyOp(op, true); });
    }
    /* Geometry in stage pixels (the camera's own space), worked out from the drawing's design
       coordinates — so it stays right while the camera is leaning in. */
    function fit() {
      var cw = cam.clientWidth || root.clientWidth || 1, ch = cam.clientHeight || root.clientHeight || 1;
      var k = Math.min(cw / artW, ch / artH);
      return { k: k, x: (cw - artW * k) / 2, y: (ch - artH * k) / 2 };
    }
    function scale() { return fit().k; }
    function toStage(x, y) { var f = fit(); return { x: f.x + x * f.k, y: f.y + y * f.k }; }
    function drawn(key) {
      return svg.querySelector('[data-prop="' + key + '"]') || svg.querySelector('[data-hot="' + key + '"]') || svg.querySelector('[data-reveal="' + key + '"]');
    }
    function anchorXY(key) {
      var a = svg.querySelector('[data-anchor="' + key + '"] circle');
      return a ? { x: +a.getAttribute("cx"), y: +a.getAttribute("cy") } : null;
    }
    function boxOf(el) { try { var b = el.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; } catch (e) { return null; } }
    function pointOf(key) { var p = anchorXY(key); return p ? toStage(p.x, p.y) : null; }
    function rectOf(el) {
      if (el && el.namespaceURI === SVGNS) {        // drawn things carry no transform of their own: their box is design coordinates
        var b = boxOf(el), f = fit();
        return b ? { x: f.x + b.x * f.k, y: f.y + b.y * f.k, w: b.w * f.k, h: b.h * f.k } : { x: 0, y: 0, w: 0, h: 0 };
      }
      var w = el.offsetWidth, h = el.offsetHeight;   // a character stands on its anchor (translate -50% -100%)
      return { x: (parseFloat(el.style.left) || 0) - w / 2, y: (parseFloat(el.style.top) || 0) - h, w: w, h: h };
    }
    /** Design-space centre of an anchor, a drawn thing (where it has flown to) or a character. */
    function centreOf(key) {
      var p = anchorXY(key); if (p) return p;
      var el = drawn(key), b = el && boxOf(el);
      if (b) { var o = flown[key]; return { x: b.x + b.w / 2 + (o ? o.dx : 0), y: b.y + b.h / 2 + (o ? o.dy : 0) }; }
      var c = cast[key];
      if (c && !c.actor.el.hidden) { var r = rectOf(c.actor.el), f = fit(); return { x: (r.x + r.w / 2 - f.x) / f.k, y: (r.y + r.h * .45 - f.y) / f.k }; }
      return null;
    }
    function actorFor(key) {
      if (cast[key]) return cast[key];
      var def = story.cast[key] || {};
      var a = Kido.Characters.create(def.rig || key, { className: "st-actor st-actor--" + key });
      a.el.setAttribute("aria-label", def.name || key);
      a.set("happy");
      castLayer.appendChild(a.el);
      cast[key] = { actor: a, anchor: null, hidden: false, size: def.size || 80 };
      return cast[key];
    }
    function placeActor(key, instant) {
      var c = cast[key]; if (!c || !c.anchor) return;
      var p = pointOf(c.anchor); if (!p) return;
      var s = scale(), w = c.size * s;
      var el = c.actor.el;
      if (instant) el.classList.add("no-move");
      el.style.width = w + "px"; el.style.height = (w * 1.2) + "px";
      el.style.left = p.x + "px"; el.style.top = p.y + "px";
      if (instant) { void el.offsetWidth; el.classList.remove("no-move"); }
    }
    function layout() {
      Object.keys(cast).forEach(function (k) { placeActor(k, true); });
      Array.prototype.forEach.call(hotLayer.children, function (b) { if (b.__place) b.__place(); });
      if (focusKey) setFocus(focusKey, true);
      spreadPlates(hotLayer, dlg);
    }
    function setupCast(sc) {
      var want = sc.cast || {};
      Object.keys(cast).forEach(function (k) { if (!want[k]) { cast[k].actor.el.hidden = true; cast[k].anchor = null; } });
      Object.keys(want).forEach(function (k) {
        var c = actorFor(k);
        c.anchor = want[k];
        c.hidden = (sc.hidden || []).indexOf(k) !== -1;
        c.actor.el.hidden = c.hidden;
        c.actor.set((sc.moods && sc.moods[k]) || "happy").pose("idle").look(0, 0);
      });
      layout();
    }

    /* ---------- the camera: a gentle lean toward what matters ---------- */
    function setFocus(key, instant) {
      focusKey = key || null;
      var p = null;
      if (key) { var c0 = centreOf(key); if (c0) p = toStage(c0.x, c0.y); }
      if (instant) cam.classList.add("no-move");
      if (!p) {
        cam.style.transform = "";
        root.classList.remove("is-focus");
      } else {
        var w = cam.clientWidth, h = cam.clientHeight, s = calm() ? 1 : 1.14;
        // the thing drifts a third of the way toward the middle; the place always still fills the stage
        var dx = p.x + (w / 2 - p.x) * .33, dy = p.y + (h * .45 - p.y) * .33;
        var tx = Math.min(0, Math.max(w * (1 - s), dx - s * p.x)), ty = Math.min(0, Math.max(h * (1 - s), dy - s * p.y));
        cam.style.transform = s === 1 ? "" : "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + s + ")";
        vignette.style.setProperty("--fx", (tx + s * p.x).toFixed(0) + "px");
        vignette.style.setProperty("--fy", (ty + s * p.y).toFixed(0) + "px");
        root.classList.add("is-focus");
      }
      if (instant) { void cam.offsetWidth; cam.classList.remove("no-move"); }
    }

    /* ---------- what happens to the place (kept, so a redraw looks the same) ---------- */
    function mark(el, cls, instant) {
      if (!el) return;
      if (instant) el.classList.add("no-fade");
      el.classList.add(cls);
    }
    function applyOp(op, instant) {
      if (op.reveal) [].concat(op.reveal).forEach(function (k) { mark(svg.querySelector('[data-reveal="' + k + '"]'), "is-shown", instant); });
      if (op.gone) [].concat(op.gone).forEach(function (k) { mark(drawn(k), "is-gone", instant); });
      if (op.fly) placeFlown(op.fly);
    }
    function record(op) { placeOps.push(op); applyOp(op, false); }
    function flyMath(f) {
      var el = drawn(f.what), b = el && boxOf(el), to = centreOf(f.to);
      if (!b || !to) return null;
      return { el: el, dx: to.x - (b.x + b.w / 2), dy: to.y - (b.y + b.h / 2), s: f.scale != null ? f.scale : (f.keep ? 1 : .5), r: f.rotate || 0 };
    }
    /** A moved thing turns and scales around its own middle, and never slides back through a CSS transition. */
    function pivot(el) { el.style.transformBox = "fill-box"; el.style.transformOrigin = "50% 50%"; el.style.transition = "opacity .45s ease"; }
    function xform(x) { return "translate(" + x.dx.toFixed(1) + "px," + x.dy.toFixed(1) + "px) rotate(" + x.r + "deg) scale(" + x.s + ")"; }
    function placeFlown(f) {
      var x = flyMath(f); if (!x) return;
      pivot(x.el);
      x.el.style.transform = xform(x);
      if (!f.keep) x.el.classList.add("is-gone", "no-fade");
      flown[f.what] = x;
    }
    /** A drawn thing travels (in a little arc) to an anchor or another drawn thing. */
    function fly(f) {
      var x = flyMath(f); if (!x) return Promise.resolve();
      var from = flown[f.what] || { dx: 0, dy: 0, s: 1, r: 0 };
      placeOps.push({ fly: f });
      flown[f.what] = x;
      x.el.classList.remove("st-lift");
      pivot(x.el);
      function land() { x.el.style.transform = xform(x); if (!f.keep) x.el.classList.add("is-gone"); }
      if (calm() || !x.el.animate) { land(); return wait(calm() ? 120 : 0); }
      var lift = f.arc != null ? f.arc : Math.min(110, 28 + Math.abs(x.dx - from.dx) * .18 + Math.abs(x.dy - from.dy) * .08);
      var mid = { dx: (from.dx + x.dx) / 2, dy: (from.dy + x.dy) / 2 - lift, s: Math.max(from.s, x.s) * 1.06, r: (from.r + x.r) / 2 };
      var anim = x.el.animate([{ transform: xform(from) }, { transform: xform(mid), offset: .5 }, { transform: xform(x) }],
        { duration: f.ms || 900, easing: "ease-in-out", fill: "forwards" });
      return new Promise(function (resolve) {
        var done = false;
        function fin() { if (done) return; done = true; land(); try { anim.cancel(); } catch (e) {} resolve(); }
        anim.onfinish = fin; anim.oncancel = fin;
        setTimeout(fin, (f.ms || 900) + 400);           // a hidden tab may never finish the animation
      });
    }
    function lookAt(whoKey, key) {
      var c = cast[whoKey]; if (!c) return;
      if (!key) { c.actor.look(0, 0); return; }
      var to = centreOf(key), f = fit(); if (!to) return;
      var r = rectOf(c.actor.el);
      var ex = (r.x + r.w / 2 - f.x) / f.k, ey = (r.y + r.h * .42 - f.y) / f.k;   // eye level, design units
      var dx = to.x - ex, dy = to.y - ey, L = Math.sqrt(dx * dx + dy * dy) || 1;
      c.actor.look(Math.round(dx / L * 8), Math.round(dy / L * 5));
    }

    /* ---------- dialogue ---------- */
    var faces = {};              // "@rig" portraits: a small live copy of the character for the dialogue bar
    function speaker(key, mood) {
      var def = key && story.cast[key];
      portrait.innerHTML = "";
      if (def && def.portrait === "@rig") {
        var f = faces[key] || (faces[key] = Kido.Characters.create(def.rig || key, { className: "st-face-rig" }));
        f.set(mood || "happy");
        portrait.appendChild(f.el);
      } else if (def && def.portrait && Kido.PuzzleEngine) portrait.innerHTML = Kido.PuzzleEngine.art(def.portrait);
      portrait.hidden = !portrait.firstChild;
      who.textContent = def ? def.name : "";
      who.hidden = !def;
      dlg.classList.toggle("is-narrator", !def);
    }
    /** Speak on the voice channel; the speaker's mouth moves while the line plays. */
    function voice(key, line) {
      if (!voiceOn || !line) return Promise.resolve(false);
      var def = key && story.cast[key];
      var v = (def && def.voice) || story.narratorVoice || {};
      var talker = def && cast[key] && !cast[key].actor.el.hidden ? cast[key].actor.el : null;
      if (talker) talker.classList.add("is-talking");
      var done = function (r) { if (talker) talker.classList.remove("is-talking"); return !!(r && r.spoken); };
      if (!Kido.Voice || !Kido.Voice.say) return Kido.audio.speak(line, { pitch: v.pitch, rate: v.rate }).then(done);
      return Kido.Voice.say(line, { kind: def ? "dialogue" : "narration", speaker: def ? def.name : null, pitch: v.pitch, rate: v.rate }).then(done, done);
    }
    function stopVoice() { if (Kido.Voice && Kido.Voice.stop) Kido.Voice.stop(); else if (window.speechSynthesis) window.speechSynthesis.cancel(); }
    function cue(id) { if (Kido.audio.cue) Kido.audio.cue(id); }
    function show(line) {
      text.textContent = line;
      text.classList.remove("is-in"); void text.offsetWidth; text.classList.add("is-in");
    }
    /** A spoken line the child moves past with Next (pre-readers: advances by itself after the voice). */
    function line(key, t, beat) {
      beat = beat || {};
      var l = pickText(t);
      speaker(key, beat.mood);
      show(l);
      if (key && cast[key]) {
        var a = cast[key].actor;
        a.set(beat.mood || "happy").pose(beat.pose || "nod");
      }
      if (beat.focus !== undefined) setFocus(beat.focus);
      if (typeof beat.look === "string") lookAt(key, beat.look);
      else if (beat.look) cueUp({ look: beat.look });
      dlg.classList.remove("is-waiting-tap");
      nextBtn.hidden = false; nextBtn.disabled = false;
      return new Promise(function (resolve) {
        var done = false;
        function go() { if (done) return; done = true; waitingNext = null; stopVoice(); resolve(); }
        waitingNext = go;
        voice(key, l).then(function (spoke) {
          if (done || !alive()) return;
          nextBtn.classList.add("is-ready");
          if (spoke && Kido.age.isPreReader() && story.autoAdvance !== false) wait(1300).then(go);
        });
        if (Kido.age.isPreReader() || calm()) nextBtn.classList.add("is-ready");
        nextBtn.focus({ preventScroll: true });
      });
    }
    /** A short line that doesn't wait for Next (praise, a gentle clue) — the story keeps moving. */
    function quick(key, t, mood) {
      var l = pickText(t); if (!l) return Promise.resolve();
      speaker(key, mood); show(l);
      if (key && cast[key]) cast[key].actor.set(mood || "happy").pose(mood === "thinking" ? "nod" : "jump");
      return Promise.all([Promise.race([voice(key, l), wait(5000)]), wait(calm() ? 500 : 1000)]);
    }
    nextBtn.addEventListener("click", function () { Kido.audio.playTapSound(); nextBtn.classList.remove("is-ready"); if (waitingNext) waitingNext(); });
    function paintDots(n, k) {
      dots.innerHTML = "";
      if (!n || n === Infinity || n < 2) { dots.hidden = true; return; }
      dots.hidden = false;
      for (var i = 0; i < n; i++) dots.appendChild(U.el("i", { class: i < (k || 0) ? "is-on" : "" }));
    }
    /** Ask the child to do something (no Next button; the things to touch glow). */
    function prompt(t, speak) {
      var l = pickText(t);
      speaker(null); show(l);
      dlg.classList.add("is-waiting-tap");
      nextBtn.hidden = true;
      if (speak !== false) voice(null, l);
      return l;
    }

    /* ---------- hotspots (things in the scene, or a character) ---------- */
    function target(key, opts) {
      opts = opts || {};
      var actorEl = !svg.querySelector('[data-hot="' + key + '"]') && cast[key] ? cast[key].actor.el : null;
      var b = U.el("button", { class: "st-spot" + (opts.plate ? " has-plate" : "") + (opts.plateTop ? " plate-top" : ""), type: "button", "aria-label": opts.aria || opts.label || key });
      if (opts.plate) b.innerHTML = '<span class="st-plate"><b>' + opts.label + "</b>" + (opts.detail ? "<small>" + opts.detail + "</small>" : "") + "</span>";
      if (opts.plateTop) b.setAttribute("data-plate", "top");
      var t = { btn: b, g: null, actorEl: actorEl };
      // Re-find the drawing each time: a rotation redraws the art mid-beat.
      b.__place = function () {
        t.g = actorEl ? null : svg.querySelector('[data-hot="' + key + '"]');
        if (t.g) t.g.classList.add("is-live");
        var r = rectOf(t.g || actorEl), pad = 6;
        b.style.left = (r.x - pad) + "px"; b.style.top = (r.y - pad) + "px";
        b.style.width = (r.w + pad * 2) + "px"; b.style.height = (r.h + pad * 2) + "px";
      };
      b.__place();
      hotLayer.appendChild(b);
      t.off = function () { b.remove(); if (t.g) t.g.classList.remove("is-live"); };
      return t;
    }
    function react(t, how) {
      var el = t.g || t.actorEl; if (!el) return;
      if (how) Array.prototype.slice.call(el.classList).forEach(function (c) { if (/^react-/.test(c) && c !== "react-" + how) el.classList.remove(c); });
      el.classList.remove("is-tapped"); void (el.getBoundingClientRect ? el.getBoundingClientRect() : 0); el.classList.add("is-tapped");
      if (how) el.classList.add("react-" + how);
    }
    /** Stage directions that happen at once: who appears or leaves, feelings, poses, glances, the camera. */
    function cueUp(o) {
      if (!o) return;
      if (o.show) [].concat(o.show).forEach(function (k) { var c = cast[k]; if (c) { c.actor.el.hidden = false; c.hidden = false; placeActor(k, true); c.actor.el.classList.add("st-pop"); } });
      if (o.hide) [].concat(o.hide).forEach(function (k) { var c = cast[k]; if (c) { c.actor.el.hidden = true; c.hidden = true; } });
      if (o.mood) Object.keys(o.mood).forEach(function (k) { if (cast[k]) cast[k].actor.set(o.mood[k]); });
      if (o.pose) Object.keys(o.pose).forEach(function (k) { if (cast[k]) cast[k].actor.pose(o.pose[k]); });
      if (o.look) Object.keys(o.look).forEach(function (k) { lookAt(k, o.look[k]); });
      if (o.focus !== undefined) setFocus(o.focus);
      if (o.tint !== undefined) root.classList.toggle("is-night", o.tint === "night");   // evening light on the cast
    }
    /** A character walks (hops, runs, flies…) to another anchor. */
    function moveActor(m) {
      var c = cast[m.who]; if (!c) return Promise.resolve();
      c.anchor = m.to;
      var el = c.actor.el, ms = m.ms || 1000;
      if (el.hidden) { placeActor(m.who, true); return Promise.resolve(); }
      c.actor.pose(m.pose || "cheer");                 // wings / arms flap on the way (or a hop, a run…)
      if (m.ms) el.style.transitionDuration = ms + "ms";
      placeActor(m.who, calm());
      return wait(calm() ? 150 : ms).then(function () { el.style.transitionDuration = ""; c.actor.pose("idle"); });
    }
    function doThen(o) {
      if (!o) return Promise.resolve();
      cueUp(o);
      var flying = Promise.all([].concat(o.fly || []).map(fly).concat([].concat(o.move || []).map(moveActor)));
      return flying.then(function () {
        if (!alive()) return;
        if (o.gone) record({ gone: o.gone });
        if (o.reveal) {
          record({ reveal: o.reveal });
          if (!o.quiet) cue("story.discover");          // something important just appeared
        }
        if (o.sfx) sfx(o.sfx);
        return wait(calm() ? 200 : (o.settle != null ? o.settle : 700));
      });
    }
    function sfx(key) {
      var def = story.sounds && story.sounds[key];
      if (def && def.cue) cue(def.cue);
      // A call never speaks over the dialogue — only an explicit { say } is spoken.
      else if (def && def.bird) Kido.audio.playBirdSound(def.bird, def.say);
      else if (def && def.animal) Kido.audio.playAnimalSound(def.animal, def.say);
      else Kido.audio.playTapSound();
    }
    /** Several beats one after another, inside another beat (a seek item's little scene). */
    function runList(list, i) {
      i = i || 0;
      if (!alive() || !list || i >= list.length) return Promise.resolve();
      var b = list[i];
      if (!allowed(b)) return runList(list, i + 1);
      var k = kindOf(b);
      if (k !== "narrate" && k !== "say") { nextBtn.hidden = true; nextBtn.classList.remove("is-ready"); }
      return (k ? BEATS[k](b) : Promise.resolve()).then(function () { return runList(list, i + 1); });
    }

    /* ---------- tidy up: one thing at a time, tap where it belongs ---------- */
    function sortOne(s, it, keys, room, n) {
      var others = U.shuffle(keys.filter(function (k) { return k !== it.to; })).slice(0, room - 1);
      var offer = keys.filter(function (k) { return k === it.to || others.indexOf(k) !== -1; });
      var thing = it.name || it.hot, el = drawn(it.hot);
      if (el) el.classList.add("st-lift");
      var ask = prompt(fill(it.ask || s.ask, thing));
      if (s.by) lookAt(s.by, it.hot);
      var shownAt = Date.now(), done = false;
      return new Promise(function (resolve) {
        var ts = offer.map(function (k) {
          var pl = s.places[k];
          var t = target(k, { plate: true, plateTop: pl.plate === "top", label: pl.label, aria: pl.label + ". " + ask });
          t.btn.classList.add("is-glow");
          t.btn.addEventListener("click", function () {
            if (done) return;
            tapWaits.push(Date.now() - shownAt);
            if (k !== it.to) {                    // not there: a friendly clue, and the child tries again
              cue("puzzle.retry"); react(t, "nope"); t.btn.classList.add("is-tried");
              quick(s.by || null, fill((it.no && it.no[k]) || s.no || ["Not there!", "Hmm, not there. Where does the {thing} belong?"], thing), "thinking");
              return;
            }
            done = true;
            ts.forEach(function (x) { x.off(); });
            dlg.classList.remove("is-waiting-tap");
            cue("story.select"); react(t, "shine");
            var happy = {}; if (s.by) happy[s.by] = "excited";
            doThen({ mood: happy, fly: { what: it.hot, to: s.places[it.to].at || it.to, ms: 850 }, reveal: it.show, quiet: true, sfx: it.sfx || s.sfx, settle: 200 })
              .then(function () { return doThen(it.then); })
              .then(function () {
                var praise = it.yes || (s.praise ? s.praise[n % s.praise.length] : null);
                return praise ? quick(s.by || null, fill(praise, thing), "happy") : null;
              })
              .then(resolve);
          });
          return t;
        });
        spreadPlates(hotLayer, dlg);
        if (ts[0]) ts[0].btn.focus({ preventScroll: true });
      });
    }

    /* ---------- beats ---------- */
    var BEATS = {
      narrate: function (b) { return line(null, b.narrate, b); },
      say: function (b) { return line(b.say, b.text, b); },
      sfx: function (b) { sfx(b.sfx); return wait(400); },
      mood: function (b) { return doThen({ mood: b.mood, pose: b.pose, look: b.look }); },
      show: function (b) { return doThen({ show: b.show }); },
      hide: function (b) { [].concat(b.hide).forEach(function (k) { if (cast[k]) cast[k].actor.el.hidden = true; }); return Promise.resolve(); },
      reveal: function (b) { return doThen({ reveal: b.reveal, quiet: b.quiet }); },
      tap: function (b) {
        cueUp(b.lead);
        var ask = prompt(b.ask);
        var t = target(b.tap, { aria: ask });
        t.btn.classList.add("is-glow");
        t.btn.focus({ preventScroll: true });
        var shownAt = Date.now();
        return new Promise(function (resolve) {
          t.btn.addEventListener("click", function once() {
            t.btn.removeEventListener("click", once);
            tapWaits.push(Date.now() - shownAt);
            cue("story.select");
            react(t, b.react);
            t.off();
            dlg.classList.remove("is-waiting-tap");
            doThen(b.then).then(resolve);
          });
        });
      },
      choice: function (b) {
        var c = b.choice;
        setFocus(c.focus === undefined ? null : c.focus);   // several things to choose from: see them all
        cueUp(b.lead);
        var ask = prompt(c.ask);
        var cfg = Kido.age.cfg();
        var ts = c.options.filter(allowed).map(function (o) {
          var details = style ? style.details : (cfg.reading === "full" || cfg.reading === "some");
          var t = target(o.hot, { plate: true, plateTop: o.plate === "top", label: o.label, detail: details ? o.detail : null, aria: o.label + (o.detail ? ". " + o.detail : "") });
          t.btn.classList.add("is-glow");
          return { o: o, t: t };
        });
        spreadPlates(hotLayer, dlg);
        if (ts[0]) ts[0].t.btn.focus({ preventScroll: true });
        var shownAt = Date.now(), done = false;
        return new Promise(function (resolve) {
          ts.forEach(function (x) {
            x.t.btn.addEventListener("click", function () {
              if (done) return;
              tapWaits.push(Date.now() - shownAt);
              if (x.o.no) {                         // a thinking choice: not this one — a friendly clue, then try again
                cue("puzzle.retry");
                react(x.t, "nope");
                x.t.btn.classList.add("is-tried");
                quick(x.o.by || c.by || null, x.o.no, "thinking");
                return;
              }
              done = true;
              cue("story.choice");
              react(x.t, "shine");
              ts.forEach(function (y) { y.t.off(); });
              dlg.classList.remove("is-waiting-tap");
              choices[c.key || scene.id] = x.o.id || x.o.hot;
              saveProgress(story.id, { choices: choices });
              wait(calm() ? 150 : 500)
                .then(function () { return doThen(x.o.then); })
                .then(function () { return x.o.yes ? line(x.o.by || c.by || null, x.o.yes, { mood: "excited", pose: "jump" }) : null; })
                .then(function () { resolve(x.o.next ? { next: x.o.next } : null); });
            });
          });
        });
      },
      puzzle: function (b) {
        var host = U.el("div", { class: "st-puzzle" });
        overlay.innerHTML = ""; overlay.appendChild(host); overlay.hidden = false;
        dlg.hidden = true;
        return new Promise(function (resolve) {
          Kido.PuzzleEngine.run({ puzzleId: b.puzzle, activityId: story.activityId, categoryId: "stories" }, {
            host: host,
            onDone: function (state) {
              var p = progressOf(story.id) || {}, pz = p.puzzles || {};
              pz[b.puzzle] = { solved: !state.skipped, mistakes: state.mistakes || 0, hints: state.hints || 0 };
              saveProgress(story.id, { puzzles: pz });
              overlay.hidden = true; overlay.innerHTML = ""; dlg.hidden = false;
              resolve();
            }
          });
        });
      },
      video: function (b) {
        var entry = Kido.videos && Kido.videos.get(b.video);
        if (!entry || !Kido.videos.isPlayable(entry) || !Kido.VideoManager) {
          console.info("[Kido] Story video '" + b.video + "' not available — story continues without it.");
          return Promise.resolve();
        }
        overlay.innerHTML = ""; overlay.hidden = false; dlg.hidden = true;
        var slot = U.el("div", { class: "st-video" });
        overlay.appendChild(slot);
        var player = Kido.VideoManager.create({ label: entry.title, aspect: entry.aspect, captions: entry.captions, skip: true, poster: entry.poster });
        slot.appendChild(player.el);
        return new Promise(function (resolve) {
          var done = false;
          function finish() { if (done) return; done = true; player.destroy(); overlay.hidden = true; overlay.innerHTML = ""; dlg.hidden = false; resolve(); }
          player.on("ended", function () { wait(700).then(finish); });
          player.on("skip", finish);
          player.on("error", finish);
          player.load(entry.video, { autoplay: !calm() });
        });
      },
      move: function (b) { return Promise.all([].concat(b.move).map(moveActor)); },
      celebrate: function (b) {
        var big = b && b.celebrate === "treasure";
        cue(big ? "reward.celebrate" : "story.celebrate");
        setFocus(null);
        Kido.fx.confetti(big ? 90 : 60);
        Object.keys(cast).forEach(function (k) { if (!cast[k].actor.el.hidden) cast[k].actor.set("celebrating").pose("cheer"); });
        if (!big) return wait(calm() ? 300 : 1400);
        // The big finish: golden light pours over the scene, more confetti, and the fanfare builds.
        var glow = U.el("div", { class: "st-treasure-fx", "aria-hidden": "true" });
        root.insertBefore(glow, dlg);
        root.classList.add("is-treasure");
        wait(650).then(function () { if (alive()) { Kido.fx.confetti(60); cue("story.celebrate"); } });
        wait(1400).then(function () { if (alive()) { Kido.fx.confetti(50); cue("adventure.complete"); Object.keys(cast).forEach(function (k) { if (!cast[k].actor.el.hidden) cast[k].actor.pose("jump"); }); } });
        return wait(calm() ? 600 : 2600);
      },
      end: function () { return Promise.resolve({ end: true }); },

      /* ---- Change #17A ---- */
      seek: function (b) {
        var s = b.seek, items = (s.items || []).filter(allowed), got = [], hinted = false, ts = [];
        var goal = items.some(function (it) { return it.ends; });
        var good = items.filter(function (it) { return !it.no; }).length;
        var need = goal ? Infinity : Math.max(1, Math.min(good, pickNum(s.need) || good));
        setFocus(s.focus === undefined ? null : s.focus);
        cueUp(b.lead);
        paintDots(need, 0);
        function found() { return got.filter(function (it) { return !it.no; }).length; }
        return new Promise(function (resolve) {
          function ask(first) {
            if (!alive()) return;
            var l = prompt(first || !s.more ? s.ask : s.more, first || !!s.more);
            var shownAt = Date.now();
            ts = items.filter(function (it) { return got.indexOf(it) === -1; }).map(function (it) {
              var t = target(it.hot, { aria: it.label ? it.label + ". " + l : l });   // each thing has its own name for screen readers
              t.btn.classList.add("is-glow", "is-seek");
              t.btn.addEventListener("click", function () { tapWaits.push(Date.now() - shownAt); pick(it, t); }, { once: true });
              return t;
            });
            if (ts[0]) ts[0].btn.focus({ preventScroll: true });
          }
          function pick(it, t) {
            ts.forEach(function (x) { if (x !== t) x.off(); });
            ts = [];
            got.push(it);
            dlg.classList.remove("is-waiting-tap");
            react(t, it.react || (it.no ? "nope" : null));
            t.off();
            var step;
            if (it.no) { cue("puzzle.retry"); step = quick(it.by || s.by || null, it.no, "thinking"); }
            else {
              cue("story.select");
              if (!goal) paintDots(need, found());
              step = doThen(it.then).then(function () { return runList(it.beats); });
            }
            step.then(function () {
              if (!alive()) return;
              var left = items.some(function (x) { return got.indexOf(x) === -1 && !x.no; });
              if (it.ends || (!goal && found() >= need) || !left) { paintDots(0); resolve(); return; }
              if (s.hint && !hinted && goal && got.length >= (s.hint.after || 2)) {   // a friend points the way
                hinted = true;
                line(s.hint.by || null, s.hint.text, s.hint).then(function () { ask(false); });
                return;
              }
              ask(false);
            });
          }
          ask(true);
        });
      },
      sort: function (b) {
        var s = b.sort, keys = Object.keys(s.places || {}).filter(function (k) { return allowed(s.places[k]); });
        var room = Math.max(2, Math.min(keys.length, s.max || Kido.age.cfg().optionsPerQuestion || 3));
        setFocus(null);
        cueUp(b.lead);
        return (s.items || []).filter(allowed).reduce(function (p, it, n) {
          return p.then(function () { return alive() ? sortOne(s, it, keys, room, n) : null; });
        }, Promise.resolve());
      },
      do: function (b) { return doThen(b.do); },
      focus: function (b) { setFocus(b.focus); return wait(b.focus && !calm() ? 700 : 150); },
      fly: function (b) { return Promise.all([].concat(b.fly).map(fly)).then(function () { return wait(calm() ? 100 : 250); }); },
      gone: function (b) { return doThen({ gone: b.gone, settle: 300 }); },
      look: function (b) { cueUp({ look: b.look }); return wait(300); },
      pose: function (b) { cueUp({ pose: b.pose }); return wait(calm() ? 100 : 500); },
      wait: function (b) { var ms = +b.wait || 0; return wait(calm() ? Math.min(ms, 300) : ms); }
    };
    function kindOf(b) {
      for (var k in BEATS) if (Object.prototype.hasOwnProperty.call(b, k)) return k;
      return null;
    }
    function allowed(b) {
      if (b.ages && !ageFits(b.ages)) return false;
      if (!b.when) return true;
      return Object.keys(b.when).every(function (sid) { return choices[sid] === b.when[sid]; });
    }

    /* ---------- scenes ---------- */
    function sceneById(id) { return story.scenes.filter(function (s) { return s.id === id; })[0]; }
    function playScene(id, first) {
      if (!alive()) return;
      scene = sceneById(id);
      if (!scene) { console.warn("[Kido] Missing scene", id); return; }
      saveProgress(story.id, { status: "in-progress", scene: id, choices: choices });
      var fade = first || calm() ? Promise.resolve() : veilOn();
      fade.then(function () {
        if (!alive()) return;
        setFocus(null, true);
        if (!svg.innerHTML || svg.__place !== scene.place) drawPlace(scene.place);
        hotLayer.innerHTML = "";
        paintDots(0);
        if (scene.reveal) { placeOps.push({ reveal: scene.reveal }); applyOp({ reveal: scene.reveal }, true); }
        if (scene.gone) { placeOps.push({ gone: scene.gone }); applyOp({ gone: scene.gone }, true); }
        root.classList.toggle("is-night", scene.tint === "night");
        setupCast(scene);
        if (scene.ambience !== undefined && Kido.AudioManager) Kido.AudioManager.ambience(scene.ambience || null);
        dlg.hidden = false;
        root.setAttribute("data-scene", id);
        return veilOff();
      }).then(function () { runBeats(0); });
    }
    function runBeats(i) {
      if (!alive()) return;
      var beats = scene.beats || [];
      if (i >= beats.length) { playScene(scene.next); return; }
      var b = beats[i];
      if (!allowed(b)) { runBeats(i + 1); return; }
      var k = kindOf(b);
      if (k !== "narrate" && k !== "say") { nextBtn.hidden = true; nextBtn.classList.remove("is-ready"); }   // Next only while a line waits
      var p = k ? BEATS[k](b) : Promise.resolve();
      p.then(function (res) {
        if (!alive()) return;
        if (res && res.end) { endStory(); return; }
        if (res && res.next) { playScene(res.next); return; }
        runBeats(i + 1);
      });
    }
    function veilOn() {
      cue("story.transition");
      veil.classList.add("is-on");
      return wait(360);
    }
    function veilOff() {
      root.classList.remove("is-entering"); void root.offsetWidth; root.classList.add("is-entering");
      veil.classList.remove("is-on");
      return wait(calm() ? 0 : 260);
    }

    /* ---------- ending: Kido's existing reward flow ---------- */
    function endStory() {
      var p = progressOf(story.id) || {};
      saveProgress(story.id, { status: "complete", scene: null, completedISO: new Date().toISOString(), completions: (p.completions || 0) + 1, rewarded: true });
      spec.resultMsg = story.resultMsg || "You finished the story";
      if (Kido.Learning) Kido.Learning.recordStory(story, { completed: true, tapWaits: tapWaits, guided: !!(style && style.guided) });
      // A story with an achievement card shows it first (the child continues; a grown-up may share it).
      var card = story.achievement && Kido.Achievement ? function () {
        dlg.hidden = true; overlay.innerHTML = ""; overlay.hidden = false;
        return Kido.Achievement.present(story.achievement, { host: overlay });
      } : function () { return null; };
      wait(calm() ? 200 : 600).then(function () { return alive() ? card() : null; })
        .then(function () { if (alive()) Kido.engine.finish(spec, 1, 1); });
    }

    /* ---------- title card: Start / Continue Story / Start Again ---------- */
    function titleCard() {
      var saved = progressOf(story.id);
      var resumable = saved && saved.status === "in-progress" && saved.scene && sceneById(saved.scene);
      var startScene = resumable ? sceneById(saved.scene) : sceneById(story.start);
      drawPlace(startScene.place);
      dlg.hidden = true;
      overlay.innerHTML = ""; overlay.hidden = false;
      var card = U.el("div", { class: "st-card", role: "dialog", "aria-label": story.title });
      var heroKey = story.hero && story.cast[story.hero] ? story.hero : Object.keys(story.cast)[0];
      var hero = Kido.Characters.create(story.cast[heroKey].rig || heroKey, { className: "st-card__hero" });
      hero.set(resumable ? "happy" : (story.heroMood || "sad"));
      card.appendChild(hero.el);
      card.appendChild(U.el("h1", { class: "st-card__title", text: story.title }));
      var btns = U.el("div", { class: "st-card__actions" });
      function begin(fresh) {
        Kido.audio.playTapSound();
        stopVoice();
        overlay.hidden = true; overlay.innerHTML = "";
        if (fresh) {
          choices = {};
          saveProgress(story.id, { status: "in-progress", scene: story.start, choices: {}, puzzles: {}, startedISO: new Date().toISOString() });
          playScene(story.start, true);
        } else {
          choices = saved.choices || {};
          playScene(saved.scene, true);
        }
      }
      if (resumable) {
        var c = U.el("button", { class: "btn st-card__go", type: "button", html: "<span>Continue Story</span>" + (Kido.icons ? Kido.icons.play() : "") });
        c.addEventListener("click", function () { begin(false); });
        var r = U.el("button", { class: "btn btn--ghost st-card__again", type: "button", text: "Start Again" });
        r.addEventListener("click", function () { begin(true); });
        btns.appendChild(c); btns.appendChild(r);
      } else {
        var s = U.el("button", { class: "btn st-card__go", type: "button", html: "<span>" + (saved && saved.status === "complete" ? "Play Again" : "Start") + "</span>" + (Kido.icons ? Kido.icons.play() : "") });
        s.addEventListener("click", function () { begin(true); });
        btns.appendChild(s);
      }
      card.appendChild(btns);
      overlay.appendChild(card);
      var first = btns.querySelector("button"); if (first) first.focus({ preventScroll: true });
      if (voiceOn) voice(null, resumable ? "Welcome back! Shall we continue the story?" : story.title);
      // The story's own soundscape: a quiet place bed under the calm story music.
      if (story.ambience && Kido.AudioManager) Kido.AudioManager.ambience(story.ambience);
    }

    // Keep scene geometry right when the screen turns or resizes.
    if (window.ResizeObserver) {
      me.ro = new ResizeObserver(function () {
        if (!alive()) return;
        if (pickMode() !== mode && svg.__place) drawPlace(svg.__place);
        layout();
      });
      me.ro.observe(root);
    }

    titleCard();
    return { story: story, root: root };
  }

  Kido.StoryEngine = {
    run: run,
    get: get,
    list: stories,
    progress: progressOf,
    /** Forget a child's place in a story (the next open starts fresh). */
    reset: function (id) { var all = allProgress(); delete all[id]; Kido.progress.set("storyProgress", all); },
    /** Place name plates so none hides another, the dialogue bar or the screen edge (every choice and sort uses it). */
    spreadPlates: spreadPlates,
    /** Stop narration when leaving the screen (navigation calls this). */
    stop: stopLive
  };
})(window);
