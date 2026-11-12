/* =========================================================================
   soundGames.js — Two audio-first learning games for the Animal Jungle.
   • whoMakesSound  — hear a call, tap the animal/bird that makes it (labels on).
   • whoAmI         — pure guess-from-sound (no names shown until the reveal).
   Both route every call through the reusable Kido.AudioManager (single channel,
   a real recording when bundled, else the live synth), pronounce the NAME with
   Kido.Voice separately from the sound, reveal age-branched educational info via
   Kido.facts, and never punish — a miss just replays the call and encourages.
   Rendering mirrors the arcade custom-game pattern and ends via engine.finish.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  Kido.activities = Kido.activities || {};

  function shell(spec, title, hint) {
    var m = document.getElementById("screen"); m.innerHTML = ""; m.scrollTop = 0;
    var wrap = U.el("div", { class: "game game--safari" });
    wrap.appendChild(U.el("div", { class: "game__head" }, [
      U.el("div", { class: "game__prompt", html: title }),
      U.el("div", { class: "arcade__status", id: "arc-status", text: hint || "" })
    ]));
    var stage = U.el("div", { class: "stage arcade sound-game-stage" });
    wrap.appendChild(stage); m.appendChild(wrap);
    if (spec.instruction) Kido.mascot.say(spec.instruction);
    return stage;
  }
  function status(msg) { var s = document.getElementById("arc-status"); if (s) s.textContent = msg; }
  function cfg() { return (Kido.age && Kido.age.cfg && Kido.age.cfg()) || { difficulty: 3, rounds: 4, optionsPerQuestion: 3 }; }

  function playSoundQuiz(spec, options) {
    var stage = shell(spec, options.title, options.hint);
    stage.style.position = "relative";
    var C = Kido.content || {};
    var cf = cfg();
    var nOpts = Math.max(2, Math.min(5, cf.optionsPerQuestion || 3));
    var band = (Kido.age && Kido.age.current) ? Kido.age.current() : null;
    var pool = tagAll(C.animals, "animals").concat(tagAll(C.birds, "birds")).filter(function (x) {
      return x.key !== "fish" && x.key !== "tropical_fish" && x.key !== "pufferfish" && x.key !== "goldfish";
    }).concat(SOUND_ONLY.filter(function (x) {   // only while its real recording is confirmed available
      return Kido.AudioManager && Kido.AudioManager.available && Kido.AudioManager.available(x.kind, x.key);
    }));
    var rounds = buildRounds(pool, Math.max(3, Math.min(7, cf.rounds || 4)), nOpts);
    var idx = 0, correct = 0, tries = 0, current = null, finished = false;

    var play = U.el("button", {
      class: "btn btn--leaf btn--play-sound",
      html: '<svg viewBox="0 0 24 24" width="24" height="24" style="vertical-align:middle;margin-right:8px;" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg><span>Play the sound</span>'
    });
    play.addEventListener("click", function () {
      play.classList.add("anim-bounce");
      setTimeout(function () { play.classList.remove("anim-bounce"); }, 500);
      if (current) playCall(current);
    });
    var grid = U.el("div", { class: "options sound-game-options" });
    stage.appendChild(play); stage.appendChild(grid);
    step();

    function playCall(t) {
      if (Kido.AudioManager && Kido.AudioManager.play) Kido.AudioManager.play(t.kind, t.key);
      else if (t.kind === "birds") Kido.audio.playBirdSound(t.key, t.name);
      else Kido.audio.playAnimalSound(t.key, t.name);
    }
    function step() {
      if (idx >= rounds.length) { done(); return; }
      var r = rounds[idx]; current = r.target; tries = 0;
      status("Sound " + (idx + 1) + " of " + rounds.length);
      var cols = r.choices.length <= 2 ? 2 : (r.choices.length === 3 ? 3 : 2);
      grid.className = "options sound-game-options cols-" + cols;
      grid.innerHTML = "";
      r.choices.forEach(function (c) {
        var label = options.showLabels ? "<span class='opt__name'>" + c.name + "</span>" : "";
        var btn = U.el("button", { class: "opt opt--pic opt--animal-card", "aria-label": options.showLabels ? c.name : "mystery", html: '<div class="opt__pic-wrap">' + vis(c) + '</div>' + label });
        btn.addEventListener("click", function () { onPick(btn, c, r); });
        grid.appendChild(btn);
      });
      var prompt = options.showLabels ? "Listen closely... who makes this sound?" : "Ooh, listen closely... who am I?";
      Kido.mascot.say(prompt, { silent: false });
      setTimeout(function () { playCall(r.target); }, 600);
    }
    function onPick(btn, c, r) {
      if (btn.classList.contains("is-disabled")) return;
      if (c.key === r.target.key && c.kind === r.target.kind) {
        if (tries === 0) correct++;
        Array.prototype.forEach.call(grid.querySelectorAll(".opt"), function (b) { b.classList.add("is-disabled"); });
        btn.classList.add("is-correct");
        if (Kido.audio.playCorrectSound) Kido.audio.playCorrectSound();
        Kido.fx.sparkleEl(btn);
        reveal(r.target, btn);
        var hasFact = Kido.facts && Kido.facts.sentence(r.target.kind, r.target.key, r.target.name, band);
        var waitMs = hasFact ? 6400 : (options.revealBig ? 2800 : 2200);
        setTimeout(function () { idx++; step(); }, waitMs);
      } else {
        tries++;
        btn.classList.add("is-wrong", "is-disabled");
        if (Kido.audio.playIncorrectSound) Kido.audio.playIncorrectSound();
        Kido.fx.shake(btn);
        if (Kido.Voice && Kido.Voice.speakEncouragement) Kido.Voice.speakEncouragement();
        else Kido.mascot.say(U.pick(["Almost! Listen one more time!", "Good try, explorer! Give it another go!"]));
        setTimeout(function () { if (current === r.target) playCall(r.target); }, 600);   // replay to help, never punish
      }
    }
    function reveal(t, btn) {
      status("It's a " + t.name + "! 🎉");
      if (Kido.fx.toast) Kido.fx.toast(t.name + "!", "ok");
      if (btn && !options.showLabels) btn.innerHTML = '<div class="opt__pic-wrap">' + vis(t) + '</div>' + "<span class='opt__name'>" + t.name + "</span>";
      if (Kido.Voice && Kido.Voice.speakCorrect) {
        Kido.Voice.speakCorrect({ text: "Spot on! That's the " + t.name + "!" });
      } else {
        Kido.mascot.say("Spot on! That's the " + t.name + "!", { silent: false });
      }
      var line = Kido.facts ? Kido.facts.sentence(t.kind, t.key, t.name, band) : "";
      if (line) setTimeout(function () { Kido.audio.speak(line); }, 2400);
      if (options.revealBig) {
        var big = U.el("div", { class: "sg-big", style: "position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font-size:6.5rem;text-align:center;pointer-events:none;z-index:20;", html: vis(t) });
        stage.appendChild(big); setTimeout(function () { big.remove(); }, 2400);
      }
    }
    function done() {
      if (finished) return; finished = true;
      if (Kido.Voice && Kido.Voice.speakCheer) Kido.Voice.speakCheer();
      else Kido.mascot.say("Whoa, fantastic listening today!");
      Kido.engine.finish(spec, correct, rounds.length);
    }
  }

  // One art source: real registry SVG when the species has authored art, else
  // the honest emoji fallback. Guarded so non-slice species stay unchanged.
  function vis(c) { return (Kido.creatures && Kido.creatures.hasArt(c.key)) ? Kido.creatures.render(c.key, { name: c.name }) : c.emoji; }

  // Species with a real recording that stay out of the content lists (their photos would break the shadow
  // and other picture games), so the sound quizzes add them here.
  var SOUND_ONLY = [{ kind: "animals", key: "grasshopper", name: "Grasshopper" }];
  function tagAll(list, kind) { return (list || []).map(function (x) { return { kind: kind, key: x.key, name: x.name, emoji: x.emoji }; }); }
  // reveal() lines for every species, recorded by scripts/voice/harvest.js (scenes/animalSound.js says the same praise)
  (Kido.voiceGen = Kido.voiceGen || []).push(function (band) {
    var C = Kido.content || {};
    return tagAll(C.animals, "animals").concat(tagAll(C.birds, "birds"), SOUND_ONLY).reduce(function (out, t) {
      out.push("Spot on! That's the " + t.name + "!");
      if (Kido.facts) out.push(Kido.facts.sentence(t.kind, t.key, t.name, band));
      return out;
    }, []);
  });
  function buildRounds(pool, n, nOpts) {
    return U.sample(pool, Math.min(n, pool.length)).map(function (t) {
      // de-dup by species key (duck/hen sit in both lists; photo-only birds have no emoji)
      var seen = {}; seen[t.key] = 1; var others = [];
      U.shuffle(pool).forEach(function (x) { if (!seen[x.key] && others.length < nOpts - 1) { seen[x.key] = 1; others.push(x); } });
      return { target: t, choices: U.shuffle([t].concat(others)) };
    });
  }

  Kido.activities.whoMakesSound = function (spec) { return playSoundQuiz(spec, { title: "❓ Who Makes This Sound?", hint: "Listen, then tap who makes it!", showLabels: true, revealBig: false }); };
  Kido.activities.whoAmI = function (spec) { return playSoundQuiz(spec, { title: "🎧 Who Am I?", hint: "Guess the animal from its sound!", showLabels: false, revealBig: true }); };
})(window);
