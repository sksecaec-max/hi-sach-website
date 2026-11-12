/* =========================================================================
   animalSound.js — Flagship scene #5 (Animals: "Find the Animal Sound")
   HEAR then FIND: Momo plays an animal's sound and names it; the child taps
   the matching animal from a lineup. A 🔊 button replays the sound. Option
   count and round count scale with the age band.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido;

  Kido.Scene.register("scene-animalsound", {
    music: "jungle", bg: "bg-jungle",
    build: function (api) {
      var C = (Kido.content || {}).animals || [];
      var cfg = api.cfg || {};
      var opts = Math.max(2, Math.min(4, cfg.optionsPerQuestion || 3));
      var totalRounds = Math.max(3, Math.min(5, cfg.rounds || 4));
      // Ages ~5+ (difficulty >= 3) also HEAR a short age-branched fact on a correct
      // tap, so this fast match game teaches like whatsAnimal/soundGames do — not
      // just the name. Youngest stay snappy (name only).
      var doLearn = (cfg.difficulty || 3) >= 3;
      if (Kido.AudioManager && Kido.AudioManager.preloadAnimals) Kido.AudioManager.preloadAnimals(C.map(function (x) { return x.key; }));

      api.layers.ground.appendChild(api.el("div", { class: "ground-strip ground-green" }));
      var momo = api.char("momo", 500, 520, { size: 150, className: "guide-momo" });

      var idx = 0, correct = 0, current = null;
      var speakerEl = api.el("button", {
        class: "scene-speaker-btn",
        "aria-label": "Replay sound",
        html: '<svg viewBox="0 0 100 100" class="speaker-svg"><circle cx="50" cy="50" r="45" fill="#FFC83B"/><path d="M32 40 h10 l14 -12 v44 l-14 -12 h-10 z" fill="#2B2151"/><path class="speaker-wave-1" d="M62 38 Q68 50 62 62" fill="none" stroke="#2B2151" stroke-width="4.5" stroke-linecap="round"/><path class="speaker-wave-2" d="M70 30 Q80 50 70 70" fill="none" stroke="#2B2151" stroke-width="4.5" stroke-linecap="round"/></svg>'
      });
      api.layers.ui.appendChild(speakerEl);
      api.tap(speakerEl, function () {
        speakerEl.classList.remove("is-playing");
        void speakerEl.offsetWidth;
        speakerEl.classList.add("is-playing");
        if (current) playSound(current);
      });

      var PROMPTS = [
        "Listen closely, explorer! Which animal makes this sound?",
        "Ooh, hear that? Who do you think is calling out?",
        "Can you listen to the sound and tap the matching animal?"
      ];

      step();

      function step() {
        Array.prototype.forEach.call(api.layers.actors.querySelectorAll(".actor"), function (a) { a.remove(); });
        if (idx >= totalRounds) { api.finish(correct, totalRounds); return; }
        api.setProgress(idx, totalRounds);

        var soundAnimals = C.filter(function (x) {
          return ["dog", "cat", "cow", "lion", "elephant", "tiger", "horse", "monkey", "sheep", "pig", "duck", "frog", "goat", "bear", "rooster", "hen"].indexOf(x.key) !== -1;
        });
        var targetPool = soundAnimals.length ? soundAnimals : C;
        var target = api.pick(targetPool); current = target;
        var wrongs = api.shuffle(C.filter(function (x) { return x.key !== target.key; })).slice(0, opts - 1);
        var choices = api.shuffle([target].concat(wrongs));
        var clean = true;

        var n = choices.length;
        var cardSize, cols, colGapX, rowYs;

        // Cover ~60% of the active stage background dynamically based on number of animals:
        // - 2 animals: large cards (280x280) covering ~60% of width (630px span) and vertical space
        // - 3 animals: spacious row (230x230) covering ~65% of width (760px span)
        // - 4 animals: balanced 2x2 grid (195x195) covering ~60% of width and height
        if (n <= 2) {
          cardSize = 280;
          cols = 2;
          colGapX = 350;
          rowYs = [265];
        } else if (n === 3) {
          cardSize = 230;
          cols = 3;
          colGapX = 265;
          rowYs = [265];
        } else {
          cardSize = 195;
          cols = 2;
          colGapX = 290;
          rowYs = [175, 375];
        }

        choices.forEach(function (c, i) {
          var r = Math.floor(i / cols);
          var inRow = Math.min(cols, n - r * cols);
          var posInRow = i - r * cols;
          var cx = 500 + (posInRow - (inRow - 1) / 2) * colGapX;
          var cy = rowYs[r] != null ? rowYs[r] : 265;
          var a = api.creature(c.key, cx, cy, { size: cardSize, layer: "actors", emoji: c.emoji });
          a.classList.add("animal-choice-card");
          api.tween(a, [
            { opacity: 0, transform: "translate(-50%,-50%) scale(.4)" },
            { opacity: 1, transform: "translate(-50%,-50%) scale(1.08)" },
            { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }
          ], { duration: 380, delay: i * 80, easing: "cubic-bezier(.34,1.56,.64,1)" });

          api.tap(a, function () {
            if (c.key === target.key) {
              api.correct({ at: [cx, cy], silent: true });
              api.tween(a, [
                { transform: "translate(-50%,-50%) scale(1)" },
                { transform: "translate(-50%,-50%) scale(1.18, .86) translateY(8px)" },
                { transform: "translate(-50%,-50%) scale(.92, 1.16) translateY(-48px)" },
                { transform: "translate(-50%,-50%) scale(1.04, .96) translateY(0)" },
                { transform: "translate(-50%,-50%) scale(1) translateY(0)" }
              ], { duration: 600, easing: "cubic-bezier(.34,1.56,.64,1)" });

              momo.set("celebrating"); momo.pose("cheer");
              if (clean) correct++;

              var praiseLine = "Spot on! That's the " + target.name + "!";
              api.say(praiseLine, { peek: "⭐", id: "praise-" + target.key });

              var fact = doLearn && Kido.facts ? Kido.facts.sentence("animals", target.key, target.name, api.band) : "";
              if (fact) {
                api.wait(2800).then(function () { api.say(fact, { peek: "💡", id: "as-fact-" + target.key }); });
                api.wait(6800).then(function () { idx++; step(); });
              } else {
                api.wait(2800).then(function () { idx++; step(); });
              }
            } else {
              clean = false; api.encourage();
              api.tween(a, [
                { transform: "translate(-50%,-50%) translateX(0)" },
                { transform: "translate(-50%,-50%) translateX(-14px) rotate(-6deg)" },
                { transform: "translate(-50%,-50%) translateX(14px) rotate(6deg)" },
                { transform: "translate(-50%,-50%) translateX(-8px) rotate(-3deg)" },
                { transform: "translate(-50%,-50%) translateX(0) rotate(0)" }
              ], { duration: 420 });
            }
          });
        });

        momo.set("thinking");
        var promptText = api.pick(PROMPTS);
        api.say(promptText, { peek: "👂", id: "listen-sound-" + idx });
        api.wait(3600).then(function () {
          speakerEl.classList.add("is-playing");
          playSound(target);
          setTimeout(function () { speakerEl.classList.remove("is-playing"); }, 2000);
        });
      }

      function speak(s) { if (api.voice) api.voice.speakWord(s); else if (Kido.audio.speak) Kido.audio.speak(s); }
      function playSound(t) {
        if (!t) return;
        if (Kido.AudioManager && Kido.AudioManager.playAnimal) Kido.AudioManager.playAnimal(t.key);
        else if (Kido.audio.playAnimalSound) Kido.audio.playAnimalSound(t.key);
      }
    }
  });
})(window);
