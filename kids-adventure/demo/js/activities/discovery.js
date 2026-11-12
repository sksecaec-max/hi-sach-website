/* =========================================================================
   discovery.js — Kido Quick Discoveries (custom activity renderer)
   DISCOVER → SHORT VIDEO → WOW → SIMPLE QUESTION → REWARD → EXISTING GAME

   Runs like any other catalog activity (screens.play → engine custom), so the
   play screen, music, "Continue", rewards and result screen are the ones Kido
   already has. This file only composes them:
     video      Kido.VideoManager         (js/engine/videoManager.js)
     content    Kido.videos manifest      (js/data/videos.js)
     reactions  Kido.mascot / Kido.fx / Kido.audio
     reward     Kido.engine.finish → Kido.rewards.award + celebrate + showResult
     next       the result screen's "Next" opens spec.followUp (the existing game)
   When the clip isn't available (not added yet, or fails to load) it becomes
   an honest picture discovery: the real photo (or a Kido science scene) + spoken fact.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  Kido.activities = Kido.activities || {};

  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---- answer pictures: the same elephant, one part lit up ---- */
  function elephantPart(part) {
    function c(p) { return p === part ? "#FFB020" : "#C3CADB"; }
    var glow = { trunk: [20, 64, 18], tail: [106, 54, 16], ear: [46, 40, 20] }[part];
    return '<svg class="kd-pic" viewBox="0 0 124 96" aria-hidden="true" focusable="false">' +
      (glow ? '<circle cx="' + glow[0] + '" cy="' + glow[1] + '" r="' + glow[2] + '" fill="#FFE9A8" opacity=".8"/>' : "") +
      '<ellipse cx="66" cy="90" rx="42" ry="4" fill="#23304A" opacity=".12"/>' +
      '<path d="M98 42 C106 46 108 54 106 64" fill="none" stroke="' + c("tail") + '" stroke-width="' + (part === "tail" ? 5 : 3) + '" stroke-linecap="round"/>' +
      '<path d="M103 62 l6 8 l-8 -2 z" fill="' + c("tail") + '"/>' +
      '<rect x="46" y="62" width="11" height="26" rx="4" fill="#AEB6CB"/><rect x="80" y="62" width="11" height="26" rx="4" fill="#AEB6CB"/>' +
      '<rect x="56" y="64" width="10" height="24" rx="4" fill="#C3CADB"/><rect x="88" y="64" width="10" height="24" rx="4" fill="#C3CADB"/>' +
      '<ellipse cx="72" cy="50" rx="32" ry="23" fill="#C3CADB"/>' +
      '<circle cx="34" cy="40" r="19" fill="#C3CADB"/>' +
      '<ellipse cx="47" cy="40" rx="12" ry="17" fill="' + c("ear") + '"/>' +
      '<ellipse cx="48" cy="40" rx="7" ry="11" fill="' + (part === "ear" ? "#FFD27A" : "#F4C9D4") + '" opacity=".85"/>' +
      '<path d="M22 44 C14 52 12 66 16 80 C17 84 22 84 23 80 C20 68 22 58 28 50 Z" fill="' + c("trunk") + '"/>' +
      '<path d="M26 50 C22 50 20 52 20 55 C24 54 26 53 28 52 Z" fill="#FFFBF0"/>' +
      '<circle cx="29" cy="35" r="2.4" fill="#2B2151"/><circle cx="29.8" cy="34.2" r=".8" fill="#fff"/>' +
      "</svg>";
  }
  var PICTURES = { elephant: elephantPart };
  function picture(art) {
    var m = /^(\w+):(\w+)$/.exec(art || "");
    if (m && PICTURES[m[1]]) return PICTURES[m[1]](m[2]);
    // Everything else comes from the shared puzzle art: photo names ("dolphin") and Kido drawings ("moon:5", "thing:clip").
    var html = art && Kido.PuzzleEngine && Kido.PuzzleEngine.art ? Kido.PuzzleEngine.art(art) : "";
    return html ? '<span class="kd-pic kd-pic--art' + (/<img/.test(html) ? " kd-pic--photo" : "") + '" aria-hidden="true">' + html + "</span>" : "";
  }
  /** Children 6+ hear one more true thing about the animal: where it lives, or what kind of animal it is (Kido.facts, age-branched). */
  function moreFact(entry) {
    if ((entry.category !== "animals" && entry.category !== "birds") || !Kido.facts) return "";
    var c = Kido.creatures && Kido.creatures.get(entry.topic);
    var line = Kido.facts.sentence(entry.category, entry.topic, String((c && c.name) || entry.topic).toLowerCase(), Kido.age.current());
    var e = Kido.facts.get(entry.category, entry.topic);
    // Only the deeper lines (where it lives / what kind of animal it is): the discovery already told its fun fact.
    return line && (!e || line !== e.fact) && entry.fact.indexOf(line) === -1 ? line : "";
  }

  Kido.activities.discovery = function (spec) {
    var entry = Kido.videos && Kido.videos.get(spec.videoId);
    var mount = document.getElementById("screen");
    mount.innerHTML = ""; mount.scrollTop = 0;
    if (!entry) { Kido.fx.toast("Coming soon!"); Kido.nav.back(); return; }

    var root = U.el("div", { class: "kd kd--" + entry.category + (calm() ? " is-calm" : "") });
    // The world this discovery belongs to, softly behind the "viewing window".
    if (Kido.worldArt && entry.world) {
      var wide = window.innerWidth / Math.max(1, window.innerHeight) >= 1.05;
      var art = Kido.worldArt.realm(entry.world, wide ? "L" : "P");
      var bg = U.el("div", { class: "kd-backdrop", "aria-hidden": "true" });
      bg.innerHTML = '<svg viewBox="0 0 ' + art.W + " " + art.H + '" preserveAspectRatio="xMidYMid slice">' + art.svg + "</svg>";
      root.appendChild(bg);
    }
    var stage = U.el("div", { class: "kd-stage" });
    var title = U.el("h1", { class: "kd-title", text: entry.title });
    var slot = U.el("div", { class: "kd-slot" });
    var actions = U.el("div", { class: "kd-actions" });
    var ask = U.el("div", { class: "kd-ask", hidden: "hidden" });
    stage.appendChild(title); stage.appendChild(slot); stage.appendChild(actions); stage.appendChild(ask);
    root.appendChild(stage);
    mount.appendChild(root);
    // Optional soundscape of the discovery's world; it dips right down while a clip talks.
    if (Kido.AudioManager) Kido.AudioManager.ambience(entry.ambience || Kido.AudioManager.ambienceFor(entry.world));

    var player = null, watched = false, pictureRun = 0;

    /* ---------- 1) DISCOVER: the clip, or the honest picture fallback ---------- */
    function watch() {
      watched = false;
      actions.innerHTML = "";
      if (Kido.videos.isPlayable(entry) && Kido.VideoManager) playVideo();
      else showPicture("not-added");
    }

    var seenAs = null;                     // "video" | "picture" (for the learning profile)
    function playVideo() {
      seenAs = "video";
      slot.innerHTML = "";
      player = Kido.VideoManager.create({
        label: entry.title, aspect: entry.aspect, poster: entry.poster || (entry.fallback && entry.fallback.image),
        captions: entry.captions, skip: true
      });
      slot.appendChild(player.el);
      player.on("ended", onWatched);
      player.on("skip", onWatched);
      player.on("error", function (why) {
        player.destroy(); player = null;
        showPicture(why);
      });
      // Start buffering now; roll the clip once Momo has said what we're discovering.
      // Reduced motion: never autoplay — the big play button waits for a tap.
      player.load(entry.video, { autoplay: false });
      var mine = player;
      Kido.audio.speak(entry.title).then(function () {
        if (player === mine && !calm() && mine.state() !== "error") mine.play();
      });
    }

    function showPicture(reason) {
      seenAs = "picture";
      if (reason) console.info("[Kido] Quick Discovery '" + entry.id + "': video " + reason + " (" + entry.video + ") — showing the picture discovery instead.");
      var run = ++pictureRun;
      slot.innerHTML = "";
      var card = U.el("div", { class: "kv-player kd-picture is-playing", role: "img", "aria-label": entry.fact });
      var aspect = String(entry.aspect || "16:9").split(":");
      card.style.setProperty("--kv-ar", aspect[0] + " / " + aspect[1]);
      var frame = U.el("div", { class: "kv-frame" });
      var fb = entry.fallback || {};
      if (fb.image) {
        var pic = U.el("img", { class: "kd-picture__img", src: fb.image, alt: "" });
        if (fb.focus) pic.style.objectPosition = fb.focus;     // keep the animal in a 16:9 window
        if (fb.fit) pic.style.objectFit = fb.fit;              // "contain": a whole studio photo / the whole Earth
        frame.appendChild(pic);
      }
      if (fb.bg) frame.style.background = fb.bg;
      var more = moreFact(entry);
      frame.appendChild(U.el("div", { class: "kd-picture__fact", text: entry.fact + (more ? " " + more : "") }));
      if (more) card.setAttribute("aria-label", entry.fact + " " + more);
      card.appendChild(frame);
      slot.appendChild(card);
      var soundFinished=wait(400).then(function(){
        if(run!==pictureRun||!root.isConnected)return;
        if(entry.fallback&&entry.fallback.sound){Kido.audio.playAnimalSound(entry.fallback.sound);return Kido.AudioManager.creatureDone();}
      });
      // Long enough to look and listen even when narration is switched off.
      Promise.all([
        soundFinished.then(function () { return run === pictureRun && root.isConnected ? Kido.audio.speak(entry.fact) : null; }).then(function () { return more && run === pictureRun && root.isConnected ? Kido.audio.speak(more) : null; }),
        wait(Math.min(6000, (entry.duration || 8) * 500))
      ]).then(function () { if (run === pictureRun && root.isConnected) setTimeout(onWatched, 500); });
    }

    /* ---------- 2) WOW: react, then offer Continue / Watch again ---------- */
    function onWatched() {
      if (watched || !root.isConnected) return;
      watched = true;
      Kido.mascot.say(entry.wow || "Wow!", { mood: "celebrating", pose: "cheer" });
      // The animal call has already played before the fact; do not interrupt the reaction.
      Kido.fx.sparkleEl(slot);
      actions.innerHTML = "";
      var again = U.el("button", { class: "btn btn--ghost kd-again", type: "button", html: (Kido.icons ? Kido.icons.play() : "") + "<span>Watch again</span>" });
      again.addEventListener("click", function () {
        Kido.audio.playTapSound();
        if (player) { watched = false; actions.innerHTML = ""; player.replay(); } else watch();
      });
      var cont = U.el("button", { class: "btn kd-continue", type: "button", html: "<span>Continue</span>" + (Kido.icons ? Kido.icons.play() : "") });
      cont.addEventListener("click", function () { Kido.audio.playTapSound(); askQuestion(); });
      actions.appendChild(again); actions.appendChild(cont);
      cont.focus({ preventScroll: true });
    }

    /* ---------- 3) SIMPLE QUESTION (age-picked from the manifest) ---------- */
    function askQuestion() {
      var q = Kido.videos.questionFor(entry, Kido.age.current());
      if (!q) { finish(0); return; }
      if (player) { player.destroy(); player = null; }
      pictureRun++;
      slot.innerHTML = ""; actions.innerHTML = "";
      root.classList.add("is-asking");
      title.textContent = q.ask;
      var showText = Kido.age.cfg().showText !== false;
      ask.hidden = false; ask.innerHTML = "";
      var row = U.el("div", { class: "kd-options" });
      var tries = 0;
      U.shuffle(q.options).forEach(function (o) {
        var pic = picture(o.art);
        var b = U.el("button", {
          class: "opt kd-opt" + (pic ? "" : " kd-opt--text"), type: "button", "aria-label": o.label,   // words-only answers (readers) sit in a list
          html: pic + (showText || !pic ? '<span class="kd-opt__label">' + o.label + "</span>" : "")
        });
        b.addEventListener("click", function () {
          if (b.classList.contains("is-disabled")) return;
          Kido.audio.playTapSound();
          if (o.correct) {
            b.classList.add("is-correct");
            Array.prototype.forEach.call(row.children, function (x) { x.classList.add("is-disabled"); });
            Kido.audio.playCorrectSound();
            Kido.fx.sparkleEl(b);
            Kido.mascot.say(q.praise || "Yes! Well done!", { mood: "celebrating", pose: "cheer" });
            wait(1700).then(function () { return Kido.audio.speak(entry.fact); })
              .then(function () { return wait(500); })
              .then(function () { if (root.isConnected) finish(tries); });
          } else {
            tries++;
            b.classList.add("is-wrong", "is-disabled");   // gentle: that option steps aside, try another
            Kido.fx.shake(b);
            Kido.audio.playIncorrectSound();
            Kido.mascot.say(o.hint || "Almost! Try another one.", { mood: "thinking" });
          }
        });
        row.appendChild(b);
      });
      ask.appendChild(row);
      Kido.audio.speak(q.ask);
      var first = row.querySelector(".kd-opt");
      if (first) first.focus({ preventScroll: true });
    }

    /* ---------- 4) REWARD through the existing engine → result screen ---------- */
    // The child always ends up finding the answer: 1 found out of the tries it took
    // (first try = 3 stars; the result screen never says "0 of 1").
    function finish(wrongTries) {
      // The learning profile remembers the topic, so the next pick can be a different one.
      if (Kido.Learning) Kido.Learning.recordDiscovery(entry, { tries: wrongTries || 0, mode: seenAs });
      Kido.engine.finish(spec, 1, 1 + (wrongTries || 0));
    }

    watch();
  };
})(window);
