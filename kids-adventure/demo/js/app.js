/* =========================================================================
   app.js — Bootstrap
   Applies saved settings, unlocks audio on first touch, then routes to the
   age picker (first launch) or straight into the Learning World.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var P = Kido.progress;

  /** Reflect settings onto <html>/<body> classes + speech state. Safe to call any time. */
  Kido.applySettings = function () {
    var s = P.settings();
    var html = document.documentElement;
    html.classList.toggle("reduce-motion", !!s.reduceMotion);
    html.classList.toggle("high-contrast", !!s.highContrast);
    if (Kido.age && Kido.age.applyLook) Kido.age.applyLook();   // ages 2-5: picture mode
    document.body.classList.toggle("big-text", !!s.bigText);
    // Sound: one place applies Mute all, the Music switch and every channel volume.
    if (Kido.AudioManager && Kido.AudioManager.applySettings) Kido.AudioManager.applySettings();
    if (Kido.Music) { if (s.music === false) Kido.Music.stop(250, true); else Kido.Music.resumeWanted(); }
    if (Kido.Music && Kido.Music.refreshButton) Kido.Music.refreshButton();
  };

  // Ages 2-5 read pictures, not sentences: a status line of three or more words gets "is-wordy" (hidden by CSS for
  // html.is-little); short counts like "1 / 3" stay. Momo says every one of these lines aloud anyway.
  function watchWordy() {
    var t = null;
    function mark() {
      t = null;
      document.querySelectorAll(".arcade__status").forEach(function (e) {
        var s = (e.textContent || "").trim();
        e.classList.toggle("is-wordy", s.split(/\s+/).filter(function (w) { return /[A-Za-zऀ-ॿ]/.test(w); }).length >= 3);
      });
    }
    new MutationObserver(function () { if (!t) t = setTimeout(mark, 30); })
      .observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  function boot() {
    watchWordy();
    Kido.applySettings();

    // Unlock Web Audio + speech on the very first user gesture (mobile policy).
    var unlock = function () {
      Kido.audio.unlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);

    // Reveal app: hide splash after a short, friendly beat.
    setTimeout(function () {
      var splash = document.getElementById("splash");
      if (splash) splash.classList.add("hide");
      if (Kido.nav.routeHash && Kido.nav.routeHash()) return;
      if (P.hasOnboarded()) Kido.nav.setTab("home");
      else Kido.nav.go("age");
    }, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
