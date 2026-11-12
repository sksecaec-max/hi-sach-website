/* =========================================================================
   bodyTap.js — tap the body part on Chiku's real photo (js/data/chiku.js)
   mode "find":    "Tap Chiku's nose!" — face parts on the face photo, the rest
                   on the head-to-toe photo; a wrong tap says what it was.
   mode "explore": tap anywhere to hear the part and a fact; switch between
                   the whole body and the face; finishes after enough parts.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  Kido.activities = Kido.activities || {};

  function sceneHtml(name) {
    var S = Kido.chiku.SCENES[name], P = Kido.chiku.PARTS, zones = "";
    // big parts first so a small part on top of them (eyes on the face) wins the tap
    Object.keys(P).filter(function (k) { return P[k].scene === name && P[k].tap !== false; })
      .sort(function (a, b) { return P[b].z[0][2] * P[b].z[0][3] - P[a].z[0][2] * P[a].z[0][3]; })
      .forEach(function (k) {
        P[k].z.forEach(function (z) {
          zones += '<ellipse class="chiku-zone" data-part="' + k + '" cx="' + z[0] + '" cy="' + z[1] + '" rx="' + z[2] + '" ry="' + z[3] + '"/>';
        });
      });
    var v = S.view;   // the part of the photo shown: the img is scaled and shifted so the zones' viewBox lines up
    return '<div class="chiku-scene chiku-scene--' + name + '" style="--ar:' + (v[2] / v[3]) + '">' +
      '<img src="' + S.src + '" alt="Chiku" draggable="false" style="width:' + (S.w / v[2] * 100) + "%;height:" + (S.h / v[3] * 100) +
      "%;left:" + (-v[0] / v[2] * 100) + "%;top:" + (-v[1] / v[3] * 100) + '%"/>' +
      '<svg viewBox="' + v.join(" ") + '" preserveAspectRatio="none">' + zones + "</svg></div>";
  }

  /* Forgiving hit test. The smallest part actually under the finger wins (the knee over the leg, the eye over the
     face); only a tap on no part at all falls back to the nearest part within ~a fingertip (22 px on screen). */
  function partAt(svg, x, y) {
    var m = svg.getScreenCTM(); if (!m) return null;
    var pt = svg.createSVGPoint(); pt.x = x; pt.y = y; pt = pt.matrixTransform(m.inverse());
    var pad = 22 / m.a, under = null, near = null;
    svg.querySelectorAll(".chiku-zone").forEach(function (z) {
      var cx = +z.getAttribute("cx"), cy = +z.getAttribute("cy"), rx = +z.getAttribute("rx"), ry = +z.getAttribute("ry"), part = z.getAttribute("data-part");
      var d = Math.pow((pt.x - cx) / rx, 2) + Math.pow((pt.y - cy) / ry, 2);
      var dPad = Math.pow((pt.x - cx) / (rx + pad), 2) + Math.pow((pt.y - cy) / (ry + pad), 2);
      if (d <= 1 && (!under || rx * ry < under.area)) under = { part: part, area: rx * ry };
      else if (dPad <= 1 && (!near || dPad < near.d)) near = { part: part, d: dPad };
    });
    return under ? under.part : (near && near.part);
  }
  function isAre(name) { return /s$/.test(name) || name === "Feet" ? "are" : "is"; }
  // Every line the game glues together, recorded by scripts/voice/harvest.js (else: the device voice).
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var P = Kido.chiku.PARTS, out = [];
    Object.keys(P).forEach(function (k) {
      var p = P[k], want = p.name.toLowerCase();
      out.push(p.name + "! " + p.fact, "Yes! " + p.fact,
        "Where " + isAre(p.name) + " Chiku's " + want + "? Tap " + (isAre(p.name) === "are" ? "them" : "it") + "!");
    });
    return out;
  });

  Kido.activities.bodyTap = function (spec) {
    var C = Kido.chiku, P = C.PARTS, explore = spec.mode === "explore";
    var cfg = (Kido.age && Kido.age.cfg()) || { difficulty: 3, rounds: 5 };
    var m = document.getElementById("screen"); m.innerHTML = ""; m.scrollTop = 0;
    var game = U.el("div", { class: "game game--body" });
    var prompt = U.el("div", { class: "game__prompt" }), status = U.el("div", { class: "arcade__status" });
    game.appendChild(U.el("div", { class: "game__head" }, [prompt, status]));
    var stage = U.el("div", { class: "chiku-stage" }), holder = U.el("div", { class: "chiku-holder" });
    var card = U.el("div", { class: "chiku-card" });
    stage.appendChild(holder); stage.appendChild(card);
    game.appendChild(stage); m.appendChild(game);

    var current = null, busy = false, scene = null;
    function show(name) {
      if (scene === name) return;
      scene = name; holder.innerHTML = sceneHtml(name);
      holder.querySelector("svg").addEventListener("click", function (e) {
        onTap(partAt(e.currentTarget, e.clientX, e.clientY));
      });
    }
    function glow(part, cls, ms) {
      holder.querySelectorAll('.chiku-zone[data-part="' + part + '"]').forEach(function (z) {
        z.classList.add(cls); if (ms) setTimeout(function () { z.classList.remove(cls); }, ms);
      });
    }
    function say(t) { return Kido.audio.speak(t); }

    if (explore) {
      var seen = {}, need = Math.min(8, C.tapParts(cfg.difficulty).length);
      var flip = U.el("button", { class: "chiku-flip" });
      function setFlip() { flip.textContent = scene === "body" ? "🙂 Look at the face" : "🧍 Whole body"; }
      flip.addEventListener("click", function () { show(scene === "body" ? "face" : "body"); setFlip(); });
      prompt.textContent = "Tap any part of Chiku!";
      card.innerHTML = '<div class="chiku-card__name">Hi, I\'m Chiku!</div><div class="chiku-card__fact">Tap my nose, my hands, my feet…</div>';
      card.appendChild(flip);
      show("body"); setFlip();
      status.textContent = "0 / " + need;
      Kido.mascot.say("Meet Chiku! Tap any part of Chiku's body to learn about it.");
      var onTap = function (part, z) {
        if (!part) return;
        holder.querySelectorAll(".chiku-zone.on").forEach(function (x) { x.classList.remove("on"); });
        glow(part, "on");
        var p = P[part];
        card.querySelector(".chiku-card__name").textContent = p.name;
        card.querySelector(".chiku-card__fact").textContent = p.fact;
        Kido.audio.playTapSound && Kido.audio.playTapSound();
        seen[part] = true;
        var n = Object.keys(seen).length;
        status.textContent = Math.min(n, need) + " / " + need;
        Promise.resolve(say(p.name + "! " + p.fact)).then(function () {
          if (n >= need && game.isConnected && !busy) { busy = true; Kido.engine.finish(spec, need, need); }
        });
      };
      return;
    }

    // find mode: only Chiku's body while the question is open (no name card, no picture of the part, no naming of a
    // wrong tap). A right tap glows and says the fact; a wrong tap just shakes Chiku. The card shows the answer after.
    card.classList.add("is-hidden");
    var picks = U.sample(C.tapParts(cfg.difficulty), Math.min(cfg.rounds || 5, 8)), idx = 0, correct = 0, tries = 0;
    function next() {
      if (idx >= picks.length) { Kido.engine.finish(spec, correct, picks.length); return; }
      current = picks[idx]; tries = 0; busy = false;
      var p = P[current];
      show(p.scene);
      holder.querySelectorAll(".chiku-zone").forEach(function (x) { x.classList.remove("on", "miss"); });
      prompt.innerHTML = "Tap Chiku's <b>" + p.name.toLowerCase() + "</b>!";
      status.textContent = (idx + 1) + " / " + picks.length;
      card.innerHTML = ""; card.classList.add("is-hidden");
      say("Where " + isAre(p.name) + " Chiku's " + p.name.toLowerCase() + "? Tap " + (isAre(p.name) === "are" ? "them" : "it") + "!");
    }
    var onTap = function (part) {
      if (busy || !current) return;
      if (part === current) {
        busy = true;
        if (tries === 0) correct++;
        glow(part, "on");
        Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(holder);
        card.innerHTML = '<div class="chiku-card__name">' + P[part].name + '</div><div class="chiku-card__fact">' + P[part].fact + "</div>";
        card.classList.remove("is-hidden");
        Promise.resolve(say("Yes! " + P[part].fact)).then(function () { setTimeout(function () { if (game.isConnected) { idx++; next(); } }, 500); });
      } else {
        tries++;
        Kido.audio.playIncorrectSound();
        Kido.fx.shake(holder);
      }
    };
    Kido.mascot.say("Help Chiku! Tap the body part I say.");
    setTimeout(next, 900);
  };
})(window);
