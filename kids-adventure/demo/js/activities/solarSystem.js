/* =========================================================================
   solarSystem.js — Change #22: the Solar System explorer (Space Station).
   The Sun and eight planets circle on tilted orbits; the child taps anything
   (or its button below) to meet it. What they hear and read follows the age
   band (Kido.space.lines); Momo can set a gentle "find the …" challenge
   (no timer, no score shown, a miss just helps). Finishing goes through the
   normal reward path (Kido.engine.finish).
   Motion: one requestAnimationFrame loop moving nine elements with
   transform only; it stops when the screen goes away. Reduced motion: the
   planets rest in place.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  Kido.activities = Kido.activities || {};

  // Orbit size (fraction of the half-width), on-screen body size (fraction of the half-width), seconds per orbit.
  var GEO = {
    sun:     { o: 0,    s: .22,  p: 0 },
    mercury: { o: .27,  s: .07,  p: 9 },
    venus:   { o: .36,  s: .09,  p: 14 },
    earth:   { o: .45,  s: .095, p: 19 },
    mars:    { o: .535, s: .08,  p: 25 },
    jupiter: { o: .635, s: .16,  p: 36 },
    saturn:  { o: .735, s: .24,  p: 46 },   // the drawing's box includes the rings
    uranus:  { o: .83,  s: .12,  p: 58 },
    neptune: { o: .92,  s: .115, p: 70 }
  };
  var TILT = .45;                       // orbit height / width: a gentle "looking down from above" view
  var NEED = { young: 3, mid: 5, old: 6 };   // bodies explored before the reward is offered

  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function art(key) { return Kido.puzzleArt.planet(key); }
  function cue(id) { if (Kido.audio && Kido.audio.cue) Kido.audio.cue(id); }
  // A list is spoken line by line (each fact line has its own recorded clip; the joined text has none). Later lines
  // stop once anything else is said or the screen changes.
  function speak(t) {
    if (!Kido.audio || !Kido.audio.speak) return null;
    if (!Array.isArray(t)) return Kido.audio.speak(t);
    var seen = null, gen0 = Kido.Voice ? Kido.Voice.generation() : 0;
    return t.reduce(function (p, part) {
      return p.then(function (go) {
        if (go === false || (seen !== null && Kido.audio.spoke() !== seen) || (Kido.Voice && Kido.Voice.generation() !== gen0)) return false;
        var s = Kido.audio.speak(part); seen = Kido.audio.spoke(); return s;
      });
    }, Promise.resolve(true));
  }

  Kido.activities.solarSystem = function (spec) {
    var S = Kido.space, band = S.band(), keys = S.BODIES;
    var mount = document.getElementById("screen"); mount.innerHTML = ""; mount.scrollTop = 0;
    var root = U.el("div", { class: "game ss ss--" + band });
    root.appendChild(U.el("div", { class: "game__head" }, [
      U.el("h2", { class: "game__prompt", text: "The Solar System" }),
      U.el("div", { class: "arcade__status ss-status", id: "arc-status", role: "status", "aria-live": "polite",
        text: band === "young" ? "Tap the Sun or a planet!" : "Tap the Sun or a planet to meet it!" })
    ]));

    /* ---- the sky: stars + orbit paths (SVG, redrawn on resize) + the moving bodies ---- */
    var stage = U.el("div", { class: "ss-stage", "aria-hidden": "true" });
    var sky = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    sky.setAttribute("class", "ss-sky");
    stage.appendChild(sky);
    var els = {}, ang = {}, geo = { w: 0, h: 0, cx: 0, cy: 0, R: 0 };
    keys.forEach(function (k, i) {
      var e = U.el("div", { class: "ss-body ss-body--" + k, html: art(k) });
      stage.appendChild(e); els[k] = e;
      ang[k] = Math.PI / 2 + i * 2.4;   // spread out to start (golden-ish steps)
    });
    root.appendChild(stage);

    /* ---- what the child just met ---- */
    var info = U.el("div", { class: "ss-info", role: "region", "aria-label": "About this planet" });
    root.appendChild(info);

    /* ---- one big button per body (always reachable, keyboard and screen-reader friendly) ---- */
    var strip = U.el("div", { class: "ss-strip", role: "group", "aria-label": "The Sun and the planets" });
    var btns = {};
    keys.forEach(function (k, i) {
      var name = S.get(k).name;
      var b = U.el("button", { class: "ss-pick", type: "button", "aria-label": name + (i ? ", planet " + i + " from the Sun" : ""),
        html: '<span class="ss-pick__art">' + art(k) + "</span>" +
          (band !== "young" && i ? '<span class="ss-pick__n" aria-hidden="true">' + i + "</span>" : "") +
          '<span class="ss-pick__name">' + name + "</span>" });
      b.addEventListener("click", function () { pick(k); });
      strip.appendChild(b); btns[k] = b;
    });
    root.appendChild(strip);

    var tools = U.el("div", { class: "ss-tools" });
    var chalBtn = U.el("button", { class: "btn ss-chal", type: "button", hidden: true, html: "<span>Momo's challenge</span>" });
    var doneBtn = U.el("button", { class: "btn btn--mango ss-done", type: "button", hidden: true, html: (Kido.icons ? Kido.icons.star() : "") + "<span>I explored space!</span>" });
    tools.appendChild(chalBtn); tools.appendChild(doneBtn);
    root.appendChild(tools);
    mount.appendChild(root);

    /* ---- geometry + drawing ---- */
    function layout() {
      var w = stage.clientWidth; if (!w) return;
      var R = w / 2 - 6, h = Math.round(2 * R * GEO.neptune.o * TILT + R * GEO.saturn.s + 24);
      stage.style.height = h + "px";
      geo = { w: w, h: h, cx: w / 2, cy: h / 2, R: R };
      var svg = '<defs><radialGradient id="ss-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD86B" stop-opacity=".35"/><stop offset="1" stop-color="#FFD86B" stop-opacity="0"/></radialGradient></defs>';
      for (var i = 0; i < 60; i++) {
        var x = (i * 137.5) % w, y = (i * 71.3) % h;
        svg += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (i % 5 ? .8 : 1.4) + '" fill="#FFFFFF" opacity="' + (.35 + (i % 4) * .15) + '"/>';
      }
      svg += '<circle cx="' + geo.cx + '" cy="' + geo.cy + '" r="' + (R * .5) + '" fill="url(#ss-glow)"/>';
      S.ORDER.forEach(function (k) {
        var rx = R * GEO[k].o;
        svg += '<ellipse class="ss-orbit" data-k="' + k + '" cx="' + geo.cx + '" cy="' + geo.cy + '" rx="' + rx.toFixed(1) + '" ry="' + (rx * TILT).toFixed(1) + '"/>';
      });
      sky.setAttribute("viewBox", "0 0 " + w + " " + h);
      sky.innerHTML = svg;
      keys.forEach(function (k) { var px = Math.round(R * GEO[k].s * 2); els[k].style.width = els[k].style.height = px + "px"; els[k].__px = px; });
      if (picked) markOrbit(picked);
      place();
    }
    var pos = {};
    function place() {
      keys.forEach(function (k) {
        var g = GEO[k], rx = geo.R * g.o, a = ang[k];
        var x = geo.cx + Math.cos(a) * rx, y = geo.cy + Math.sin(a) * rx * TILT, half = els[k].__px / 2;
        pos[k] = { x: x, y: y, r: half };
        els[k].style.transform = "translate3d(" + (x - half).toFixed(1) + "px," + (y - half).toFixed(1) + "px,0)";
        // In front of the Sun on the near half of the orbit, behind it on the far half.
        var front = k === "sun" ? 2 : (Math.sin(a) > 0 ? 3 : 1);
        if (els[k].__z !== front) { els[k].style.zIndex = front; els[k].__z = front; }
      });
    }

    /* ---- the loop: transform-only, stops itself when the screen is gone ---- */
    var last = 0, still = calm();
    function frame(t) {
      if (!root.isConnected) return;
      var dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
      if (!still) S.ORDER.forEach(function (k) { if (k !== picked) ang[k] -= dt * 2 * Math.PI / GEO[k].p; });   // anticlockwise, like the real planets
      place();
      requestAnimationFrame(frame);
    }

    /* ---- tapping the sky picks the nearest body (small, moving targets stay easy to hit) ---- */
    stage.addEventListener("click", function (e) {
      var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = 1e9;
      keys.forEach(function (k) {
        var p = pos[k]; if (!p) return;
        var d = Math.hypot(p.x - x, p.y - y) - p.r * (k === "saturn" ? .5 : 1);
        if (d < bd) { bd = d; best = k; }
      });
      if (best && bd < Math.max(26, geo.R * .09)) pick(best);
    });

    /* ---- picking ---- */
    var picked = null, seen = {}, nSeen = 0, chal = null, chalDone = {}, chalGot = 0;
    function markOrbit(k) {
      Array.prototype.forEach.call(sky.querySelectorAll(".ss-orbit"), function (o) { o.classList.toggle("is-on", o.getAttribute("data-k") === k); });
    }
    function pick(k) {
      if (picked && els[picked]) els[picked].classList.remove("is-picked");
      if (picked && btns[picked]) btns[picked].classList.remove("is-on");
      picked = k;
      els[k].classList.add("is-picked"); btns[k].classList.add("is-on");
      markOrbit(k);
      if (!seen[k]) { seen[k] = 1; nSeen++; }
      clearTimeout(idleT);
      var x = S.get(k);
      if (chal) {
        if (k === chal.key) {
          cue("game.correct"); chalGot++;
          if (Kido.fx && Kido.fx.confetti) Kido.fx.confetti(18);
          var yes = "Yes! You found " + (k === "sun" ? "the Sun" : x.name) + "!";
          status(yes); show(k, yes); chalDone[chal.ask] = 1; chal = null;
          chalBtn.querySelector("span").textContent = "Another challenge";
        } else {
          var close = chal.avoid.indexOf(k) >= 0;   // fits the clue a little (Uranus's thin rings): no "wrong" sound
          cue(close ? "ui.select" : "game.retry");
          var again = (close ? "Close! " : "") + "That's " + (k === "sun" ? "the Sun" : x.name) + ". " + chal.ask.replace(/^Find/, "Can you find").replace(/[.!]$/, "?");
          status(again); show(k, again);
        }
      } else {
        cue("world.discover");
        show(k);
      }
      if (nSeen >= 2) chalBtn.hidden = false;
      if (nSeen >= NEED[band]) doneBtn.hidden = false;
      if (nSeen === NEED[band] && Kido.mascot) Kido.mascot.say("Wow, you're a real space explorer! Tap the star button when you're ready.");
    }
    function show(k, lead) {
      var x = S.get(k), lines = S.lines(k);
      var disc = k === "sun" ? "discovery-sun" : "discovery-" + k;
      var html = '<div class="ss-info__art">' + art(k) + "</div><div class=\"ss-info__text\"><h3>" + x.name + "</h3>" +
        // The heading already names it; keep the rest of the first line ("It is the 6th planet from the Sun.").
        lines.map(function (l, i) { return i ? l : l.replace(/^This is [^!]+! ?/, ""); }).filter(Boolean)
          .map(function (l) { return "<p>" + l + "</p>"; }).join("");
      if (band === "old") html += compare(k);
      html += "</div>";
      info.innerHTML = html;
      var row = U.el("div", { class: "ss-info__btns" });
      var hear = U.el("button", { class: "btn btn--ghost ss-hear", type: "button", html: (Kido.icons ? Kido.icons.play() : "") + "<span>Hear it</span>" });
      hear.addEventListener("click", function () { speak(lines); });
      row.appendChild(hear);
      if (Kido.catalog && Kido.catalog.get(disc)) {
        var go = U.el("button", { class: "btn btn--leaf ss-discover", type: "button", html: (Kido.icons ? Kido.icons.discover() : "") + "<span>Discover " + (k === "sun" ? "the Sun" : x.name) + "</span>" });
        go.addEventListener("click", function () { Kido.screens.play(disc); });
        row.appendChild(go);
      }
      info.querySelector(".ss-info__text").appendChild(row);
      info.classList.remove("is-new"); void info.offsetWidth; info.classList.add("is-new");
      speak((lead ? [lead] : []).concat(lines));
    }
    /* 7–10: how big is it next to Earth? Two drawings to scale (the Sun's Earth is just a dot). */
    function compare(k) {
      if (k === "earth") return "";
      var s = S.SIZE[k], big = 84, a = s >= 1 ? big : Math.round(big * s), e = s >= 1 ? Math.max(3, Math.round(big / s)) : big;
      return '<div class="ss-size" aria-label="' + S.get(k).name + " next to Earth, drawn to size" + '">' +
        '<span class="ss-size__b" style="width:' + a + "px;height:" + a + 'px">' + art(k) + "</span>" +
        '<span class="ss-size__b ss-size__earth" style="width:' + e + "px;height:" + e + 'px">' + art("earth") + "</span>" +
        '<small>' + S.get(k).name + " and Earth, to size</small></div>";
    }
    function status(t) { var s = root.querySelector(".ss-status"); if (s) s.textContent = t; }

    chalBtn.addEventListener("click", function () {
      var all = S.clues(), open = all.filter(function (c) { return !chalDone[c.ask]; });
      if (!open.length) { chalDone = {}; open = all; }
      chal = open[Math.floor(Math.random() * open.length)];
      cue("puzzle.challenge");
      status(chal.ask);
      if (Kido.mascot) Kido.mascot.say(chal.ask);
      else speak(chal.ask);
    });
    doneBtn.addEventListener("click", function () {
      doneBtn.disabled = true;
      Kido.engine.finish(spec, nSeen, nSeen);
    });

    // A gentle nudge if nothing has been tapped for a while (said once, never repeated).
    var idleT = setTimeout(function () {
      if (root.isConnected && !nSeen && Kido.mascot) Kido.mascot.say(band === "young" ? "Tap the planet with the rings!" : "Try tapping a planet. Which one is your favourite?");
    }, 15000);

    info.innerHTML = '<p class="ss-info__intro">' + (band === "young" ? "The planets go round and round the Sun. Tap one!"
      : band === "mid" ? "Eight planets travel around the Sun. Tap one to meet it!"
      : "Eight planets orbit the Sun, each on its own path. Tap one to explore it!") + "</p>";
    if (Kido.mascot) Kido.mascot.say(band === "young" ? "Look! The planets go round and round the Sun!" : "Welcome to the Solar System! Tap a planet to meet it.");

    layout();
    // Re-lay out after the observer returns (layout() changes the stage's height, which would loop the observer).
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        if (!root.isConnected) { ro.disconnect(); return; }
        setTimeout(function () { if (root.isConnected && stage.clientWidth !== geo.w) layout(); }, 0);
      });
      ro.observe(stage);
    }
    requestAnimationFrame(frame);
  };
})(window);
