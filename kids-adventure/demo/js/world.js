/* =========================================================================
   world.js — Kido World (the explorable home) + its seven destinations
   The home screen is a place, not a menu: one illustrated world where each
   landmark is a destination. Tapping one flies the camera in and opens that
   destination — a small scene where a few things invite a tap, each of which
   opens an EXISTING activity. Nothing here is a new game; this file only maps
   the catalog into places and handles travel, Continue, unlocks and a few
   hidden discoveries.

   Art + geometry come from Kido.worldArt (js/art/worldArt.js). Screens are
   registered on Kido.screens (world / realm / worldList) and routed by
   navigation.js.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var P = Kido.progress;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* =====================================================================
     WORLD MODEL — every catalog activity belongs to exactly one place.
     `spots` are the few things drawn in the scene; `more` is the complete
     list reachable from the signpost. "@story" / "@word" pick the child's
     next unplayed story / word run; "@journey" opens today's board.
     ===================================================================== */
  var WORLDS = {
    village: {
      name: "Adventure Village", need: 0, music: "playful", tint: "#FFE7C2",
      hello: "Welcome home to Adventure Village!", hint: "Tap the house, the market or the garden!",
      spots: [
        { key: "home", act: "scene-brush", label: "Adventure House" },
        { key: "stall", act: "fruit-explore", label: "Fruit Market" },
        { key: "garden", act: "flower-explore", label: "Flower Garden" },
        { key: "board", act: "@journey", label: "Today's Adventure" }
      ],
      more: ["momo-care", "scene-brush", "habit-routine", "habit-choose", "habit-goodbad", "hot-cold", "greetings", "body", "fruit-explore", "fruit-find",
        "fruit-catch", "scene-count", "flower-explore", "flower-find",
        "discovery-bee", "discovery-butterfly", "puzzle-lifecycle-001", "puzzle-insect-001",
        "discovery-cardinal", "discovery-firefly", "discovery-grasshopper", "discovery-dandelion", "discovery-pomegranate",
        "puzzle-fruitodd-001", "puzzle-missing-003"]
    },
    jungle: {
      name: "Jungle", need: 0, music: "safari", tint: "#3E9A63",
      hello: "Welcome to the Jungle! Who lives here?", hint: "Tap the elephant to discover something!",
      spots: [
        { key: "lion", act: "scene-whatsanimal", label: "What's That Animal?" },
        { key: "elephant", act: "discovery-elephant", label: "Meet the Elephant" },
        { key: "parrot", act: "bird-explore", label: "Bird Songs" },
        { key: "ducks", act: "animal-babies", label: "Animal Babies" }
      ],
      more: ["peekaboo", "sticker-world", "discovery-elephant", "scene-whatsanimal", "scene-animalsound", "animal-explore", "animal-find", "animal-babies",
        "bird-explore", "bird-find", "who-makes-sound", "who-am-i", "discovery-chameleon", "puzzle-food-001", "puzzle-legs-001",
        "discovery-kangaroo", "discovery-tortoise", "puzzle-groups-001"]
    },
    puzzle: {
      name: "Puzzle Island", need: 0, music: "playful", tint: "#7CD6EA",
      hello: "Puzzle Island! Let's put on our thinking caps.", hint: "Tap the glowing Thinking Stone for a puzzle!",
      spots: [
        { key: "mystery", act: "adventure-lost-treasure", label: "Treasure Hunt" },
        { key: "stone", act: "@puzzle", label: "Thinking Stone" },
        { key: "shapes", act: "shape-sorter", label: "Shape Sorter" },
        { key: "treasure", act: "memory-match", label: "Memory Match" },
        { key: "drums", act: "beat", label: "Copy the Beat" },
        { key: "cave", act: "shadow-match", label: "Shadow Match" }
      ],
      more: ["picnic-seats", "garden-sudoku", "treasure-map", "garden-signs", "train-track", "stick-squares", "magic-shapes", "rocket-route", "snail-trail", "colour-studio", "cube-count", "puzzle-pattern-001", "puzzle-odd-001", "puzzle-sequence-001", "puzzle-match-001", "puzzle-sort-001", "puzzle-maze-001",
        "puzzle-shapepattern-001", "puzzle-shapesort-001", "puzzle-shapeodd-001", "puzzle-missing-001", "puzzle-missing-002", "puzzle-maze-002",
        "shape-sorter", "memory-match", "beat", "shadow-match", "tic-tac-toe", "odd", "fruit-memory", "fruit-sorter",
        "adventure-lost-treasure"]
    },
    castle: {
      name: "Story Castle", need: 0, music: "garden", tint: "#C9B2FF",
      hello: "Story Castle! Shall we read a story?", hint: "Tap the big book for a story!",
      spots: [
        { key: "birdstory", act: "adventure-lost-little-bird", label: "The Lost Little Bird" },
        { key: "book", act: "@story", label: "Story Time" },
        { key: "tower", act: "scene-apple", label: "A is for Apple" },
        { key: "wordpath", act: "@word", label: "Word Run" },
        { key: "lanterns", act: "alphabet-find", label: "Letter Hunt" }
      ],
      more: ["adventure-lost-little-bird", "adventure-garden-helpers", "story-rabbit", "story-puppy", "story-cleanroom", "story-explorer", "story-garden",
        "abc-book", "trace-abc", "scene-apple", "alphabet-find", "alphabet-match", "puzzle-firstsound-001",
        "word-animals", "word-fruits", "word-vehicles", "word-objects", "word-colors", "word-school",
        "hindi-book", "trace-hindi", "hindi-swar", "hindi-vyanjan", "hindi-varnamala", "hindi-match"]
    },
    ocean: {
      name: "Ocean", need: 3, music: "garden", tint: "#3BB6E0",
      hello: "Splash! Welcome to the Ocean!", hint: "Tap the boat or the coral!",
      spots: [
        { key: "boatspot", act: "vehicle-explore", label: "Vehicle Sounds" },
        { key: "reef", act: "discovery-dolphin", label: "Meet the Dolphin" },
        { key: "shells", act: "shape-find", label: "Find the Shape" }
      ],
      more: ["discovery-dolphin", "discovery-whale", "discovery-sea-turtle", "discovery-sea-otter", "puzzle-sealand-001",
        "bubble-pop", "shape-find", "vehicle-explore", "vehicle-find"]
    },
    lab: {
      name: "Adventure Lab", need: 6, music: "playful", tint: "#CFC6F6",
      hello: "Adventure Lab! Let's build and discover.", hint: "Tap the computer to build one!",
      spots: [
        { key: "computer", act: "electronics", label: "Build a Computer" },
        { key: "jar", act: "scene-plant", label: "Grow a Plant" },
        { key: "blueprint", act: "build-bridge", label: "Build a Bridge" }
      ],
      more: ["electronics", "robot-clues", "light-wires", "thermo-check", "scene-plant", "build-bridge", "build-house",
        "discovery-magnets", "discovery-float", "puzzle-magnet-001", "puzzle-float-001", "puzzle-living-001"]
    },
    space: {
      name: "Space Station", need: 10, music: "space", tint: "#6A56D8",
      hello: "Blast off! Welcome to the Space Station!", hint: "Tap the little Solar System to visit the planets!",
      spots: [
        { key: "orrery", act: "solar-system", label: "Solar System" },
        { key: "telescope", act: "discovery-moon", label: "See the Moon" },
        { key: "rocket", act: "scene-wordrun", label: "Collect Letters" },
        { key: "panel", act: "number-order", label: "In Order" },
        { key: "scale", act: "moreless", label: "More or Less" }
      ],
      more: ["scene-wordrun", "count", "trace-123", "frog-hop", "kido-market", "planet-sums", "picture-sums", "clock-match", "fruit-chart", "pizza-maker", "number-order", "moreless", "sequence", "big-small", "tall-short",
        "discovery-moon", "discovery-rocket", "discovery-earth", "puzzle-moon-001",
        "puzzle-countmatch-001", "puzzle-numpattern-001", "puzzle-towers-001", "puzzle-sums-001",
        "solar-system", "planet-find", "puzzle-planetmatch-001", "puzzle-planetorder-001", "puzzle-orbit-001", "puzzle-spacemissing-001",
        "discovery-sun", "discovery-mercury", "discovery-venus", "discovery-mars", "discovery-jupiter", "discovery-saturn",
        "discovery-uranus", "discovery-neptune"]
    }
  };
  var ORDER = ["village", "jungle", "puzzle", "castle", "ocean", "lab", "space"];
  var FIRST_WORLD = "jungle";   // where Momo waits for a brand-new explorer

  function worldOf(actId) {
    for (var i = 0; i < ORDER.length; i++) if (WORLDS[ORDER[i]].more.indexOf(actId) !== -1) return ORDER[i];
    return null;
  }
  function isOpen(id) { var w = WORLDS[id]; return !!w && P.stars() >= w.need; }
  function doneIn(id) { return WORLDS[id].more.filter(function (a) { return P.isCompleted(a); }).length; }
  function pipsFor(id) {
    var d = doneIn(id), t = WORLDS[id].more.length;
    if (!d) return 0;
    return d / t < .34 ? 1 : d / t < .67 ? 2 : 3;
  }
  function firstUnplayed(ids) {
    for (var i = 0; i < ids.length; i++) if (!P.isCompleted(ids[i]) && Kido.catalog.get(ids[i])) return ids[i];
    return ids[0];
  }
  function resolve(act) {
    if (act === "@story") return firstUnplayed(WORLDS.castle.more.filter(function (a) { return a.indexOf("story-") === 0; }));
    if (act === "@word") return firstUnplayed(WORLDS.castle.more.filter(function (a) { return a.indexOf("word-") === 0; }));
    if (act === "@puzzle") return Kido.puzzles ? Kido.puzzles.next() : "odd";   // the Thinking Stone's next challenge
    return act;
  }
  function lastPlay() { var lp = P.get("lastPlay"); return lp && lp.id && WORLDS[lp.world] ? lp : null; }
  /** The activity to resume in a world: an unfinished last play, else the first unplayed thing. */
  /** Every activity of a place: the scene's spots first, then the rest (once each, only ones that exist). */
  function allIn(id) {
    var w = WORLDS[id], seen = {};
    return w.spots.map(function (s) { return resolve(s.act); }).filter(function (a) { return a && a.charAt(0) !== "@"; }).concat(w.more)
      .filter(function (a) { if (seen[a] || !Kido.catalog.get(a)) return false; seen[a] = true; return true; });
  }
  function nextIn(id) {
    var w = WORLDS[id], lp = lastPlay();
    if (lp && lp.world === id && !P.isCompleted(lp.id)) return lp.id;
    var order = allIn(id);
    for (var i = 0; i < order.length; i++) if (!P.isCompleted(order[i]) && Kido.catalog.get(order[i])) return order[i];
    return (lp && lp.world === id) ? lp.id : order[0];
  }
  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function icon(name) { return Kido.icons && Kido.icons[name] ? Kido.icons[name]() : ""; }
  function speak(t) { if (Kido.audio && Kido.audio.speak) Kido.audio.speak(t); }
  function tapSound() { if (Kido.audio && Kido.audio.playTapSound) Kido.audio.playTapSound(); }
  function cue(id) { if (Kido.audio && Kido.audio.cue) Kido.audio.cue(id); else tapSound(); }
  function reg() { return Kido.audioRegistry || {}; }

  /* =====================================================================
     SCREEN LIFECYCLE — one live world view at a time; its timers and
     observers die with it (and self-cancel if the DOM was swapped out).
     ===================================================================== */
  var live = null;
  var greeted = false;          // map greeting once per session
  var pendingReturn = null;     // realm id to zoom back out of on the next map render
  function stopLive() {
    if (!live) return;
    live.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    if (live.ro) live.ro.disconnect();
    live = null;
  }
  function later(fn, ms) {
    var own = live;
    var t = setTimeout(function () { if (live === own && own && own.root.isConnected) fn(); }, ms);
    if (own) own.timers.push(t);
    return t;
  }
  function every(fn, ms) {
    var own = live;
    var t = setInterval(function () { if (live === own && own && own.root.isConnected) fn(); else clearInterval(t); }, ms);
    if (own) own.timers.push(t);
  }

  function hudHeight() {
    var tb = document.getElementById("topbar");
    return tb && !tb.hidden ? tb.offsetHeight : 0;
  }
  function pickMode(root) {
    var w = root.clientWidth, h = root.clientHeight - hudHeight();
    return w / Math.max(1, h) >= 1.05 ? "L" : "P";
  }
  /* Map the W×H design rect into the area below the HUD (contain), and let the
     SVG paint its overscanned art into any letterbox space around it. */
  var CTRL_PX = 86;                         // bottom Continue/More strip (portrait)
  var BAND = { map: 78, realm: 92 };        // open meadow the art leaves at its bottom edge
  function fit(v) {
    var cw = v.root.clientWidth, ch = v.root.clientHeight;
    if (!cw || !ch) return;
    // Portrait: the art keeps an open strip for the bottom controls; when the
    // screen is short that strip is too thin, so lift the world above them.
    var hud = hudHeight(), sh, s, b = 0, ctrl = v.mode === "P" ? CTRL_PX : 0;
    for (var k = 0; k < 3; k++) {
      sh = Math.max(40, ch - hud - b);
      s = Math.min(cw / v.W, sh / v.H);
      b = Math.max(0, ctrl - BAND[v.kind] * s);
    }
    var dw = v.W * s, dh = v.H * s, left = (cw - dw) / 2, top = hud + (sh - dh) / 2;
    v.svg.setAttribute("viewBox", [-left / s, -top / s, cw / s, ch / s].map(function (x) { return Math.round(x * 100) / 100; }).join(" "));
    v.layer.style.left = left + "px"; v.layer.style.top = top + "px";
    v.layer.style.width = dw + "px"; v.layer.style.height = dh + "px";
    v.layer.style.setProperty("--kw-s", s.toFixed(3));
    v.s = s; v.left = left; v.top = top;
  }
  function pct(v, x, y) { return { x: x / v.W * 100, y: y / v.H * 100 }; }

  function buildView(kind, extraClass) {
    stopLive();
    var screen = document.getElementById("screen");
    screen.innerHTML = ""; screen.scrollTop = 0;
    var root = U.el("div", { class: "kw-root kw-" + kind + (extraClass ? " " + extraClass : "") });
    var zoom = U.el("div", { class: "kw-zoom" });
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "kw-art");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var layer = U.el("div", { class: "kw-layer" });
    zoom.appendChild(svg); zoom.appendChild(layer); root.appendChild(zoom);
    var veil = U.el("div", { class: "kw-veil", "aria-hidden": "true" });
    root.appendChild(veil);
    screen.appendChild(root);
    live = { root: root, zoom: zoom, svg: svg, layer: layer, veil: veil, timers: [], kind: kind };
    return live;
  }
  // The home map gets its own extra-wide layout ("X") on wide screens, so its places fill the left and right.
  function modeFor(v) {
    var m = pickMode(v.root), w = v.root.clientWidth, h = v.root.clientHeight - hudHeight();
    return m === "L" && v.kind === "map" && w / Math.max(1, h) >= 1.6 ? "X" : m;
  }
  function setMode(v) {
    v.mode = modeFor(v);
    // Wide screens: Continue / More ride in the HUD row instead of covering the scene.
    v.root.classList.toggle("is-wide", v.mode !== "P");
    return v.mode;
  }
  function watchResize(v, rerender) {
    if (!window.ResizeObserver) { window.addEventListener("resize", function h() { if (!v.root.isConnected) { window.removeEventListener("resize", h); return; } onResize(); }); return; }
    function onResize() {
      if (!v.root.isConnected) return;
      if (modeFor(v) !== v.mode) rerender(); else { fit(v); }
    }
    v.ro = new ResizeObserver(onResize);
    v.ro.observe(v.root);
  }

  /* ---- Momo, physically standing in the world ---- */
  function placeMomo(v, xy, onTap) {
    if (!Kido.Characters || !Kido.Characters.create) return null;
    var m = Kido.Characters.create("momo", { size: 60, className: "kw-momo" });
    var p = pct(v, xy[0], xy[1]);
    m.el.style.left = p.x + "%"; m.el.style.top = p.y + "%";
    m.el.setAttribute("role", "button");
    m.el.setAttribute("tabindex", "0");
    m.el.setAttribute("aria-label", "Momo the fox");
    m.set("happy");
    var bubble = U.el("div", { class: "kw-bubble", role: "status", "aria-live": "polite" });
    bubble.style.left = p.x + "%"; bubble.style.top = p.y + "%";
    bubble.style.setProperty("--ax", p.x > 62 ? "-84%" : p.x < 38 ? "-16%" : "-50%");
    v.layer.appendChild(m.el); v.layer.appendChild(bubble);
    function act() { tapSound(); onTap(); }
    m.el.addEventListener("click", act);
    m.el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); act(); } });
    // Idle life: glance around now and then, the odd wave.
    var k = 0;
    every(function () {
      k++;
      if (k % 3 === 0) m.pose("wave");
      else m.look(k % 2 ? -5 : 5, -1);
    }, 5200);
    v.momo = m; v.bubble = bubble;
    return m;
  }
  function say(v, text, opts) {
    opts = opts || {};
    if (!v || !v.bubble) return;
    v.bubble.textContent = text;
    v.bubble.classList.remove("is-on"); void v.bubble.offsetWidth; v.bubble.classList.add("is-on");
    if (v.momo) { v.momo.set(opts.mood || "excited").pose(opts.pose || "jump"); later(function () { v.momo.set("happy"); }, 1600); }
    if (!opts.silent) {
      var p = Kido.audio && Kido.audio.speak ? Kido.audio.speak(text, { speaker: "Momo" }) : null;
      var me = v.momo && v.momo.el;                  // Momo's mouth moves while he talks
      if (me && p && p.then) { me.classList.add("is-talking"); p.then(function () { me.classList.remove("is-talking"); }); }
    }
    clearTimeout(v.bubbleT);
    v.bubbleT = later(function () { v.bubble.classList.remove("is-on"); }, opts.ms || 3600);
  }

  /* ---- hidden discoveries (rare, subtle, never a menu) ---- */
  function wireDiscoveries(v) {
    v.svg.addEventListener("click", function (e) {
      var d = e.target.closest && e.target.closest("[data-disc]");
      if (!d || d.classList.contains("is-on")) return;
      var kind = d.getAttribute("data-disc");
      d.classList.toggle("has-extra", Math.random() < 0.55);   // the critter / fish only sometimes shows
      d.classList.add("is-on");
      cue((reg().discoveries || {})[kind] || "world.discover");
      later(function () { d.classList.remove("is-on", "has-extra"); }, kind === "fly" ? 5200 : 1900);
    });
  }

  function bboxPct(v, el) {
    var b;
    try { b = el.getBBox(); } catch (e) { return null; }
    if (!b || !b.width) return null;
    // Trim the soft cast-shadow slop so hit areas hug the drawn object.
    var ix = b.width * .07, iy = b.height * .05;
    return { x: (b.x + ix) / v.W * 100, y: (b.y + iy) / v.H * 100, w: (b.width - 2 * ix) / v.W * 100, h: (b.height - 2 * iy) / v.H * 100 };
  }
  function positionHit(btn, r) {
    btn.style.left = r.x + "%"; btn.style.top = r.y + "%";
    btn.style.width = r.w + "%"; btn.style.height = r.h + "%";
  }

  /* =====================================================================
     TRAVEL — camera flies into a landmark, the destination settles in.
     ===================================================================== */
  function flyInto(v, el, tint, done) {
    var fired = false;
    cue("world.travel");
    function go() { if (fired) return; fired = true; done(); }
    v.root.classList.add("is-travelling");
    v.veil.style.background = "radial-gradient(circle at 50% 50%, #ffffff 0%, " + tint + " 75%)";
    if (calm() || !v.zoom.animate) {
      v.veil.style.opacity = "1";
      later(go, 140);
      return;
    }
    var r = el.getBoundingClientRect(), rr = v.root.getBoundingClientRect();
    v.zoom.style.transformOrigin = (r.left + r.width / 2 - rr.left) + "px " + (r.top + r.height / 2 - rr.top) + "px";
    var a = v.zoom.animate([{ transform: "scale(1)" }, { transform: "scale(2.6)" }], { duration: 560, easing: "cubic-bezier(.5,0,.75,.35)", fill: "forwards" });
    v.veil.animate([{ opacity: 0 }, { opacity: 0, offset: .4 }, { opacity: 1 }], { duration: 560, fill: "forwards" });
    a.onfinish = go;
    setTimeout(go, 900);   // safety net if the animation is throttled
  }
  function settleIn(v, tint, fromScale, originEl) {
    v.veil.style.background = "radial-gradient(circle at 50% 50%, #ffffff 0%, " + tint + " 75%)";
    if (calm() || !v.zoom.animate) {
      v.veil.animate ? v.veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }) : (v.veil.style.opacity = "0");
      return;
    }
    if (originEl) {
      var r = originEl.getBoundingClientRect(), rr = v.root.getBoundingClientRect();
      v.zoom.style.transformOrigin = (r.left + r.width / 2 - rr.left) + "px " + (r.top + r.height / 2 - rr.top) + "px";
    } else v.zoom.style.transformOrigin = "50% 55%";
    v.zoom.animate([{ transform: "scale(" + fromScale + ")" }, { transform: "scale(1)" }], { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)" });
    v.veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 460, easing: "ease-out", fill: "forwards" });
  }
  // 2026-11-07 (owner): a place on the map opens straight onto ALL its activities, no in-between scene.
  function enter(id, opts) {
    Kido.nav.go("worldlist", { id: id });
  }

  /* Today's Adventure (the Village notice board and the map button) lives in
     js/adventure.js (Change #12); it replaced the old daily journey list. */

  /* =====================================================================
     HOME — the Kido World map
     ===================================================================== */
  function renderMap() {
    var v = buildView("map");
    // The map has a soft music bed of its own and no ambience (each place brings its own).
    var mapMusic = (reg().music || {}).map;
    if (mapMusic && Kido.Music) Kido.Music.play(mapMusic);
    if (Kido.AudioManager) Kido.AudioManager.ambience(null);
    var from = pendingReturn; pendingReturn = null;
    v.root.appendChild(U.el("h1", { class: "sr-only", text: "Adventure World" }));

    var locked = {};
    ORDER.forEach(function (id) { locked[id] = !isOpen(id); });
    setMode(v);
    var art = Kido.worldArt.map(v.mode, locked);
    v.W = art.W; v.H = art.H;
    v.svg.innerHTML = art.svg;
    fit(v);

    var lay = Kido.worldArt.mapLayout(v.mode);
    var btns = {};
    ORDER.forEach(function (id) {
      var w = WORLDS[id];
      var g = v.svg.querySelector('[data-place="' + id + '"]');
      var r = g && bboxPct(v, g); if (!r) return;
      var lock = locked[id];
      var pips = pipsFor(id), pipHtml = "";
      for (var i = 0; i < 3; i++) pipHtml += '<i class="' + (i < pips ? "on" : "") + '"></i>';
      var plate = lock
        ? '<span class="kw-plate kw-plate--locked">' + icon("lock") + '<span>' + w.need + "</span>" + icon("star") + "</span>"
        : "";   // 2026-11-10 (owner): no place names on the home map — the picture is the button (aria-label keeps the name)
      var b = U.el("button", {
        class: "kw-hit kw-hit--place" + (lock ? " is-locked" : ""),
        "data-id": id,
        "aria-label": lock ? w.name + ". Locked. Collect " + w.need + " stars to open it." : w.name + (pips ? ". " + doneIn(id) + " played." : ""),
        html: plate
      });
      positionHit(b, r);
      b.addEventListener("click", function () {
        if (lock) {
          g.classList.remove("is-shake"); void g.getBoundingClientRect(); g.classList.add("is-shake");
          say(v, "Collect " + w.need + " stars to open the " + w.name + "!", { mood: "thinking", pose: "nod" });
          return;
        }
        if (v.root.classList.contains("is-travelling")) return;
        tapSound();
        if (v.momo) v.momo.set("excited").pose("jump");
        flyInto(v, b, w.tint, function () { enter(id); });
      });
      v.layer.appendChild(b);
      btns[id] = b;
    });

    // Momo waits beside the place the child is most likely heading to.
    var lp = lastPlay();
    var target = lp && isOpen(lp.world) ? lp.world : FIRST_WORLD;
    placeMomo(v, lay.momo[target], function () {
      say(v, target === "village" ? "Let's explore Adventure World!" : "Let's go to the " + WORLDS[target].name + "!");
    });

    // One button: Today's Adventure while it has steps left, else Continue / a first adventure.
    var adv = Kido.adventure ? Kido.adventure.pill() : null;
    var cont = U.el("button", { class: "kw-continue" + (adv ? " kw-continue--adventure" : "") });
    var label, sub, go, thumb = Kido.worldArt.thumb(target);
    if (adv) {
      label = adv.label; sub = adv.sub; thumb = adv.thumb;
      go = function () { Kido.adventure.open({ returnFocus: cont }); };
    } else if (lp && isOpen(lp.world)) {
      var nextId = nextIn(lp.world), nextA = Kido.catalog.get(nextId);
      label = "Continue"; sub = WORLDS[lp.world].name + (nextA ? " · " + nextA.name : "");
      go = function () { Kido.screens.play(nextId); };
    } else {
      label = "Start Adventure"; sub = WORLDS[FIRST_WORLD].name;
      go = function () { if (btns[FIRST_WORLD]) btns[FIRST_WORLD].click(); };
    }
    cont.innerHTML = '<span class="kw-continue__thumb">' + thumb + "</span>" +
      '<span class="kw-continue__text"><b>' + label + "</b><small>" + sub + "</small></span>" +
      '<span class="kw-continue__go">' + icon("play") + "</span>";
    cont.setAttribute("aria-label", label + ": " + sub + (adv ? ", " + adv.done + " of " + adv.total + " steps done" : ""));
    cont.addEventListener("click", function () { tapSound(); go(); });
    v.root.appendChild(cont);

    wireDiscoveries(v);
    watchResize(v, renderMap);

    // Arrival: fly back out of the world we just left, or say hello.
    if (from && btns[from]) settleIn(v, WORLDS[from].tint, 2.6, btns[from]);

    // Newly unlocked places get one little celebration.
    var seen = P.get("worldsOpened") || {};
    var fresh = ORDER.filter(function (id) { return WORLDS[id].need > 0 && !locked[id] && !seen[id]; });
    // Back mid-adventure: offer to carry on, once per visit (asked on every render so the "first map visit" is the one that counts).
    var resume = Kido.adventure ? Kido.adventure.offerResume() : false;
    if (fresh.length) {
      later(function () {
        // Mark as seen only once the child actually sees the celebration.
        fresh.forEach(function (id) { seen[id] = true; });
        P.set("worldsOpened", seen);
        fresh.forEach(function (id) { var g = v.svg.querySelector('[data-place="' + id + '"]'); if (g) g.classList.add("is-new"); });
        if (Kido.fx && Kido.fx.confetti) Kido.fx.confetti(30);
        say(v, "Hooray! The " + WORLDS[fresh[0]].name + " is open now!", { mood: "celebrating", pose: "cheer", ms: 4200 });
      }, from ? 700 : 500);
      // Both on one return: the celebration first, then the offer to carry on.
      if (resume) later(function () { Kido.adventure.open({ mode: "resume", returnFocus: cont }); }, (from ? 700 : 500) + 4400);
    } else if (resume) {
      greeted = true;
      later(function () { Kido.adventure.open({ mode: "resume", returnFocus: cont }); }, from ? 700 : 600);
    } else if (!greeted) {
      greeted = true;
      var hello = Kido.adventure && Kido.adventure.state() === "fresh" ? Kido.adventure.LINES.fresh : "Where shall we go today?";
      later(function () { say(v, hello, { pose: "wave" }); }, 700);
    }
  }

  /* =====================================================================
     DESTINATION — one world, a few things to tap
     ===================================================================== */
  function renderRealm(params) {
    var id = params && params.id, w = WORLDS[id];
    if (!w || !isOpen(id)) { Kido.nav.setTab("home"); return; }
    var v = buildView("realm", "kw-realm--" + id);
    pendingReturn = id;
    v.root.appendChild(U.el("h1", { class: "sr-only", text: w.name }));
    setMode(v);
    var art = Kido.worldArt.realm(id, v.mode);
    v.W = art.W; v.H = art.H;
    v.svg.innerHTML = art.svg;
    fit(v);
    var lay = Kido.worldArt.realmLayout(id, v.mode);

    var nudges = 0;
    w.spots.forEach(function (sp) {
      var g = v.svg.querySelector('[data-spot="' + sp.key + '"]');
      var r = g && bboxPct(v, g); if (!r) return;
      var actId = resolve(sp.act);
      var played = actId && actId.charAt(0) !== "@" && P.isCompleted(actId);
      // Idle "tap me": unplayed spots take turns giving a little hop (3 s apart).
      if (!played && !calm()) { g.classList.add("is-nudge"); g.style.setProperty("--nudge-at", (2 + 3 * nudges++) + "s"); }
      var b = U.el("button", {
        class: "kw-hit kw-hit--spot" + (played ? " is-played" : ""),
        "aria-label": sp.label + (played ? ", played" : ""),
        html: '<span class="kw-plate kw-plate--spot"><span class="kw-plate__name">' + sp.label + "</span>" + (played ? icon("check") : "") + "</span>"
      });
      positionHit(b, r);
      b.addEventListener("click", function () {
        tapSound();
        g.classList.remove("is-pop"); void g.getBoundingClientRect(); g.classList.add("is-pop");
        if (sp.act === "@journey") {
          if (!(Kido.adventure && Kido.adventure.open({ returnFocus: b }))) say(v, "Let's explore Adventure World!");
          return;
        }
        later(function () { Kido.screens.play(resolve(sp.act)); }, calm() ? 0 : 180);
      });
      v.layer.appendChild(b);
    });

    // A discovery clip on screen here is likely next: warm it up (skipped if not added yet / data saver).
    if (Kido.videos) w.spots.forEach(function (sp) { Kido.videos.preloadFor(resolve(sp.act)); });

    placeMomo(v, lay.momo, function () { say(v, w.hint); });

    // Bottom controls: "More" signpost (everything in this world) + Continue.
    var more = U.el("button", { class: "kw-more", "aria-label": "Everything in the " + w.name, html: icon("sign") + "<span>More</span>" });
    more.addEventListener("click", function () { tapSound(); Kido.nav.go("worldlist", { id: id }); });
    v.root.appendChild(more);
    var lp = lastPlay();
    if (lp && lp.world === id) {
      var nextId = nextIn(id), a = Kido.catalog.get(nextId);
      if (a) {
        var media = Kido.screens.mediaFor ? Kido.screens.mediaFor(nextId) : null;
        var cont = U.el("button", { class: "kw-continue kw-continue--realm", "aria-label": "Continue: " + a.name });
        cont.innerHTML = '<span class="kw-continue__thumb">' + (media ? '<img src="' + media + '" alt="" />' : Kido.worldArt.thumb(id)) + "</span>" +
          '<span class="kw-continue__text"><b>Continue</b><small>' + a.name + "</small></span>" +
          '<span class="kw-continue__go">' + icon("play") + "</span>";
        cont.addEventListener("click", function () { tapSound(); Kido.screens.play(nextId); });
        v.root.appendChild(cont);
      }
    }

    var title = U.el("div", { class: "kw-title", "aria-hidden": "true", text: w.name });
    v.root.appendChild(title);
    later(function () { title.classList.add("is-gone"); }, 2400);

    wireDiscoveries(v);
    watchResize(v, function () { renderRealm({ id: id }); });
    if (Kido.Music && Kido.Music.play) Kido.Music.play(w.music);
    // Each place's soundscape (js/data/audioRegistry.js → worlds); quiet places stay quiet.
    if (Kido.AudioManager) Kido.AudioManager.ambience(Kido.AudioManager.ambienceFor(id));

    if (params.arrive) {
      params.arrive = false;   // coming back here from an activity shouldn't replay the arrival
      settleIn(v, w.tint, 1.16);
      later(function () { say(v, w.hello); }, calm() ? 150 : 520);
    }
  }

  function renderWorldList(params) {
    var w = WORLDS[params && params.id];
    if (!w) { Kido.nav.setTab("home"); return; }
    Kido.screens.refreshTopbar();
    Kido.screens.list(w.name, allIn(params.id));   // 2026-11-10 (owner): no subtitle
  }

  /* ---- register screens + public API ---- */
  Kido.screens.world = function () { this.refreshTopbar(); renderMap(); };
  Kido.screens.realm = function (p) { this.refreshTopbar(); renderRealm(p); };
  Kido.screens.worldList = renderWorldList;

  Kido.world = {
    WORLDS: WORLDS,
    ORDER: ORDER,
    worldOf: worldOf,
    isOpen: isOpen,
    /** Remember where the child was playing, for Continue. */
    notePlay: function (actId) {
      var wid = worldOf(actId);
      if (wid) P.set("lastPlay", { id: actId, world: wid, iso: new Date().toISOString() });
    },
    /** From a result screen: return to the world that activity lives in. */
    backTo: function (actId) {
      var wid = worldOf(actId);
      Kido.nav.setTab("home");
      if (wid && isOpen(wid)) enter(wid, { quiet: true });
    },
    enter: enter,
    stop: stopLive
  };
})(window);
