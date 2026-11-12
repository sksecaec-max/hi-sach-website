/* =========================================================================
   mascotLife.js — Momo moves like a little guide, not a sticker (2026-11-02)
   Builds on js/mascot.js (the rigged Momo) and only adds behaviour:
     - outside games he WALKS IN when he appears, paces a little and looks around while idle;
     - while he talks he gestures (nod / wave / point) instead of standing still;
     - in a game he stays in his corner, points at the play area while giving the instruction,
       cheers at a right answer and scratches his head at a wrong one;
     - his eyes follow where the child taps;
     - tapping the game's instruction makes him say it again (the 🔊 on the instruction pill).
   Reduced motion (parent setting or the device's): poses and eye moves only, no walking or hopping.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  if (!Kido.mascot || !Kido.mascot.actor) return;

  var M = Kido.mascot, body = document.body;
  var layer = function () { return document.getElementById("mascot"); };
  var inGame = function () { return body.classList.contains("in-gameplay"); };
  var calm = function () {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };
  var visible = function () { var l = layer(); return !!(l && !l.hidden && !M.isHidden()); };
  var A = function () { return M.actor(); };
  var talking = function () { var a = A(); return !!(a && a.el.classList.contains("is-talking")); };
  function later(fn, ms) { return setTimeout(fn, ms); }

  /* ---- where Momo stands (outside games): a small walk along the bottom-left corner ---- */
  var x = 0;
  function walkTo(nx, ms) {
    var l = layer(), a = A(); if (!l || !a || calm() || inGame()) return;
    nx = Math.max(0, Math.min(nx, Math.min(180, window.innerWidth * 0.18)));
    if (Math.abs(nx - x) < 8) return;
    a.el.classList.toggle("face-left", nx < x);
    l.style.transition = "translate " + (ms || 900) + "ms cubic-bezier(.45,.05,.4,1)";
    l.style.translate = nx + "px 0";
    if (!talking()) a.pose("run");
    x = nx;
    later(function () { var b = A(); if (b && !talking()) { b.pose(Math.random() < .5 ? "nod" : "idle"); b.el.classList.remove("face-left"); } }, ms || 900);
  }
  function enter() {                        // he walks in from the left edge instead of popping up
    var l = layer(), a = A(); if (!l || !a || calm() || inGame()) return;
    l.style.transition = "none"; l.style.translate = "-150px 0"; void l.offsetWidth;
    x = -150; walkTo(20 + Math.random() * 40, 850);
    later(function () { var b = A(); if (b && !talking()) b.pose("wave"); }, 900);
  }
  function homeCorner() { var l = layer(); if (l) { l.style.transition = "none"; l.style.translate = ""; x = 0; } var a = A(); if (a) a.el.classList.remove("face-left"); }

  /* ---- gestures while talking ---- */
  var gestureT = null, gi = 0;
  function gestures(on) {
    clearInterval(gestureT); gestureT = null;
    var a = A(); if (!a) return;
    if (!on) { later(function () { var b = A(); if (b && !talking()) b.pose("idle").look(0, 0); }, 250); return; }
    var seq = inGame() ? ["point-l", "nod", "point-l", "wave"] : ["wave", "nod", "point", "nod"];
    var step = function () { var b = A(); if (!b || !talking()) return; b.pose(seq[gi++ % seq.length]).look((Math.random() * 8 - 4) | 0, -2); };
    step(); gestureT = setInterval(step, 1500);
  }

  /* ---- reactions to answers ---- */
  var reactT = null;
  function reaction(kind) {
    var a = A(); if (!a || !visible()) return;
    clearTimeout(reactT);
    if (kind === "right") { a.set("celebrating").pose(calm() ? "nod" : "cheer"); }
    else {
      a.set("thinking").pose("nod");
      var n = 0, t = setInterval(function () { var b = A(); if (!b || ++n > 4) { clearInterval(t); if (b) b.look(0, 0); return; } b.look(n % 2 ? -6 : 6, 0); }, 160);
    }
    reactT = later(function () { var b = A(); if (b && !talking()) b.set("happy").pose("idle"); }, kind === "right" ? 1400 : 1200);
  }
  ["playCorrectSound", "playIncorrectSound"].forEach(function (fn) {
    var orig = Kido.audio && Kido.audio[fn]; if (!orig) return;
    Kido.audio[fn] = function () { try { reaction(fn === "playCorrectSound" ? "right" : "wrong"); } catch (e) {} return orig.apply(this, arguments); };
  });

  /* ---- eyes follow taps ---- */
  var lookT = null;
  document.addEventListener("pointerdown", function (e) {
    var a = A(); if (!a || !visible() || talking()) return;
    var r = a.el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 3);
    var d = Math.max(1, Math.hypot(dx, dy));
    a.look(Math.round(dx / d * 6), Math.round(dy / d * 5));
    clearTimeout(lookT); lookT = later(function () { var b = A(); if (b) b.look(0, 0); }, 1300);
  }, { passive: true });

  /* ---- idle life: every few seconds a small thing, never while he talks ---- */
  setInterval(function () {
    var a = A(); if (!a || !visible() || talking() || document.hidden) return;
    var r = Math.random();
    if (!inGame() && !calm() && r < 0.35) { walkTo(Math.random() * 180, 1000); return; }
    if (r < 0.6) { a.look(-6, 0); later(function () { var b = A(); if (b) b.look(6, -2); }, 600); later(function () { var b = A(); if (b) b.look(0, 0); }, 1300); }
    else if (r < 0.8 && !calm()) { a.pose("hop"); later(function () { var b = A(); if (b && !talking()) b.pose("idle"); }, 600); }
    else { a.pose(r < 0.9 ? "sniff" : "wave"); later(function () { var b = A(); if (b && !talking()) b.pose("idle"); }, 1100); }
  }, 6500);

  /* ---- hooks: appearance, talking, games ---- */
  var watched = null;
  function watchActor() {
    var a = A(); if (!a || watched === a.el) return;
    watched = a.el;
    new MutationObserver(function () { gestures(talking()); }).observe(a.el, { attributes: true, attributeFilter: ["class"] });
  }
  var lyr = layer();
  if (lyr) new MutationObserver(function () {
    watchActor();
    if (!lyr.hidden && !inGame()) enter(); else if (lyr.hidden) homeCorner();
  }).observe(lyr, { attributes: true, attributeFilter: ["hidden"] });

  // In a game Momo stays in his corner the whole time (his lines still come and go).
  var hide0 = M.hide;
  M.hide = function () {
    if (inGame() && !M.isHidden()) { var a = A(); if (a && !talking()) a.set("happy").pose("idle").look(0, 0); return; }
    return hide0.apply(this, arguments);
  };
  var wasGame = inGame();
  new MutationObserver(function () {
    if (inGame() === wasGame) return;                     // only when a game starts or ends
    wasGame = inGame();
    if (inGame()) {
      homeCorner();
      if (layer() && layer().hidden) {
        M.say("", { silent: true, hold: true, sound: false, pose: "wave" });
        later(function () { var b = A(); if (b && !talking()) b.pose("idle"); }, 1600);   // a hello, not a wave forever
      }
    } else if (layer() && !layer().hidden && !talking()) hide0.call(M);
  }).observe(body, { attributes: true, attributeFilter: ["class"] });

  /* ---- games speak through Kido.audio, not Kido.mascot: in a game, any narration is Momo talking ---- */
  var ownTalk = false;
  if (Kido.AudioManager && Kido.AudioManager.on) {
    Kido.AudioManager.on("voice:start", function () {
      var a = A(); if (!a || !inGame() || !visible() || a.el.classList.contains("is-talking")) return;
      ownTalk = true; a.el.classList.add("is-talking");
    });
    Kido.AudioManager.on("voice:end", function () {
      var a = A(); if (ownTalk && a) a.el.classList.remove("is-talking"); ownTalk = false;
    });
  }

  /* ---- tap the instruction: Momo says it again ---- */
  var lastLine = "", lastScreen = null;
  if (Kido.AudioManager && Kido.AudioManager.on) Kido.AudioManager.on("voice:start", function (c) {
    var t = c && String(c.text || "").trim(); if (!t) return;
    if (/^(yes|yay|oops|great|awesome|brilliant|fantastic|spot on|you got it|almost|nearly|not|try|well done|wow|super|good|that's|hooray|perfect|so close|terrific)/i.test(t)) return;   // feedback, not the task
    lastLine = t; lastScreen = document.getElementById("screen") && document.getElementById("screen").firstElementChild;
    body.classList.add("has-replay");
  });
  new MutationObserver(function () {                      // a new screen forgets the old line
    var s = document.getElementById("screen"), first = s && s.firstElementChild;
    if (first !== lastScreen) { lastLine = ""; body.classList.remove("has-replay"); }
  }).observe(document.getElementById("screen") || body, { childList: true });
  document.addEventListener("click", function (e) {
    var p = e.target.closest && e.target.closest(".game__prompt, .pz-ask, .kd-title, .game__head .arcade__status");
    if (!p || !inGame() || !lastLine || talking()) return;
    if (Kido.audio && Kido.audio.unlock) Kido.audio.unlock();
    M.talk(Kido.audio.speak(lastLine, { speaker: "Momo" }));
    var a = A(); if (a) a.set("excited").pose("point-l");
  });
})(window);
