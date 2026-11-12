/* =========================================================================
   wordRun.js — Flagship scene #6 (Word Adventure: "Collect the Letters")
   Momo blasts through space collecting glowing letter-orbs to spell a word,
   in order, into the HUD slots. Tapping the right next letter advances Momo;
   wrong taps just wobble (never punished). Word length + theme + distractor
   count scale with the age band (theme via spec.theme, default "animals").
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido;

  // the word lines for every word list, recorded by scripts/voice/harvest.js (else: the device voice)
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var W = (Kido.content || {}).words || {}, out = [];
    Object.keys(W).forEach(function (k) {
      (W[k] || []).forEach(function (w) {
        var c = Kido.creatures && Kido.creatures.get(w.toLowerCase());
        out.push("Spell " + w + "! Tap the letters in order.", "Look, it's a " + (c && c.name ? c.name : w) + "!");
      });
    });
    return out;
  });

  Kido.Scene.register("scene-wordrun", {
    music: "adventure", bg: "bg-cityroad",
    build: function (api) {
      var WORDS = (Kido.content || {}).words || {};
      var theme = (api.spec && api.spec.theme) || "animals";
      var cfg = api.cfg || {};
      var maxLen = Math.max(3, Math.min(8, cfg.maxWordLen || 4));
      var diff = cfg.difficulty || 3;

      var list = (WORDS[theme] || WORDS.animals || ["CAT", "DOG"]).filter(function (w) { return w.length <= maxLen; });
      if (!list.length) list = ["CAT"];
      var nWords = diff <= 2 ? 1 : 2;
      var words = api.sample(list, Math.min(nWords, list.length));

      // Momo running on the realistic city asphalt road
      var momo = api.char("momo", 120, 520, { size: 145 });
      momo.set("happy");

      var wi = 0, correctWords = 0;

      // Preload creature pictures & authentic audio calls
      words.forEach(function (w) {
        var k = w.toLowerCase();
        var rec = Kido.creatures && Kido.creatures.get(k);
        if (rec && rec.img) {
          var im = new Image(); im.src = rec.img;
        }
      });
      if (Kido.AudioManager && Kido.AudioManager.preload) {
        Kido.AudioManager.preload("animals", words.map(function (w) { return w.toLowerCase(); }));
      }

      playWord();

      function playWord() {
        Array.prototype.forEach.call(api.layers.actors.querySelectorAll(".actor"), function (a) { a.remove(); });
        var oldHud = api.layers.ui.querySelector(".wr-hud"); if (oldHud) oldHud.remove();
        if (wi >= words.length) { api.finish(correctWords, words.length); return; }
        api.setProgress(wi, words.length);

        // Reset Momo back to starting line for each word
        momo.el.style.left = "120px";
        momo.pose("idle");

        function doMomoJump() {
          momo.pose("jump");
          api.tween(momo.el, [
            { transform: "translateY(0)" },
            { transform: "translateY(-85px)" },
            { transform: "translateY(0)" }
          ], { duration: 380 }).then(function () {
            if (next < word.length) momo.pose("idle");
          });
          if (Kido.audio && Kido.audio.playTapSound) Kido.audio.playTapSound();
        }

        api.tap(momo.el, doMomoJump);

        // Tap ANYWHERE on the screen (stage, road, background) triggers Momo's jump!
        if (api.dom && api.dom.stage) {
          api.dom.stage.addEventListener("pointerdown", function (e) {
            if (e.target && (e.target.closest(".wr-slot") || e.target.closest(".actor--tappable") || e.target.closest(".scene-topbar") || e.target.closest("button"))) return;
            doMomoJump();
          });
        }

        var word = words[wi], clean = true, next = 0;

        var hud = api.el("div", { class: "wr-hud" }), slots = [];
        word.split("").forEach(function () { var sl = api.el("div", { class: "wr-slot" }); hud.appendChild(sl); slots.push(sl); });
        api.layers.ui.appendChild(hud);

        var extra = api.shuffle("ABCDEFGHIJKLMNOPRSTUW".split("").filter(function (L) { return word.indexOf(L) === -1; })).slice(0, diff >= 4 ? 2 : 0);
        var orbLetters = api.shuffle(word.split("").concat(extra));
        var spots = spread(orbLetters.length);

        orbLetters.forEach(function (L, i) {
          var orb = orbEl(L);
          api.place(orb, spots[i][0], spots[i][1], { layer: "actors" });
          api.tween(orb, [
            { opacity: 0, transform: "translate(-50%,-50%) scale(.3)" },
            { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }
          ], { duration: 300, delay: i * 55 });
          api.tap(orb, function () {
            if (orb.dataset.used) return;
            if (L === word[next]) {
              orb.dataset.used = "1";
              slots[next].classList.add("filled"); slots[next].textContent = L;
              speak(L);
              api.particles.sparkle(spots[i][0], spots[i][1], { count: 8 });
              api.tween(orb, [
                { opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
                { opacity: 0, transform: "translate(-50%,-50%) scale(.2)" }
              ], { duration: 300 }).then(function () { orb.remove(); });
              next++;
              var mx = 120 + 760 * next / word.length;
              momo.pose("jump");
              api.tween(momo.el, [
                { left: momo.el.style.left || "120px", transform: "translateY(0)" },
                { transform: "translateY(-75px)" },
                { left: mx + "px", transform: "translateY(0)" }
              ], { duration: 420 }).then(function () {
                if (next < word.length) momo.pose("idle");
              });
              if (next >= word.length) {
                // Celebrate the HUD slots
                slots.forEach(function (sl) { sl.classList.add("celebrate"); });

                // Fade away any remaining distractors or stray orbs
                Array.prototype.forEach.call(api.layers.actors.querySelectorAll(".actor--tappable"), function (o) {
                  if (o !== momo.el) {
                    api.tween(o, [
                      { opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
                      { opacity: 0, transform: "translate(-50%,-50%) scale(.2)" }
                    ], { duration: 250 }).then(function () { o.remove(); });
                  }
                });

                momo.set("celebrating"); momo.pose("cheer");
                if (clean) correctWords++;

                var aKey = word.toLowerCase();
                var isCreature = Kido.creatures && (Kido.creatures.has(aKey) || Kido.creatures.hasArt(aKey));
                var cInfo = (Kido.creatures && Kido.creatures.get(aKey)) || null;

                if (isCreature) {
                  var card = api.el("div", {
                    class: "actor wr-reveal-card actor--tappable",
                    html: '<div class="wr-reveal-pic">' +
                            Kido.creatures.render(aKey, { className: "wr-creature" }) +
                          '</div>' +
                          '<div class="wr-reveal-badge">' +
                            '<span class="wr-reveal-sound-btn" aria-hidden="true">🔊</span>' +
                            '<span class="wr-reveal-name">' + (cInfo && cInfo.name ? cInfo.name : word) + '</span>' +
                          '</div>'
                  });
                  api.place(card, 500, 280, { layer: "actors", z: 40 });

                  api.tween(card, [
                    { opacity: 0, transform: "translate(-50%,-50%) scale(.2)" },
                    { opacity: 1, transform: "translate(-50%,-50%) scale(1.08)" },
                    { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }
                  ], { duration: 420, easing: "cubic-bezier(.34, 1.56, .64, 1)" });

                  api.tap(card, function () {
                    playAnimalAudio(aKey);
                    api.particles.sparkle(500, 280, { count: 14 });
                    api.tween(card, [
                      { transform: "translate(-50%,-50%) scale(1) rotate(-3deg)" },
                      { transform: "translate(-50%,-50%) scale(1.06) rotate(3deg)" },
                      { transform: "translate(-50%,-50%) scale(1) rotate(0)" }
                    ], { duration: 320 });
                  });

                  api.particles.confetti(500, 240, { count: 60 });
                  api.say("Look, it's a " + (cInfo && cInfo.name ? cInfo.name : word) + "! 🌟", { peek: "🌟", id: "wr-done-" + aKey });

                  // Play the authentic animal call/voice
                  playAnimalAudio(aKey);

                  // Speak the spelled word clearly after an 800ms beat
                  api.wait(800).then(function () {
                    speak(word);
                  });

                  // Display the celebration card for ~3s before advancing to next word
                  api.wait(3000).then(function () {
                    api.tween(card, [
                      { opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
                      { opacity: 0, transform: "translate(-50%,-50%) scale(.3)" }
                    ], { duration: 320 }).then(function () {
                      card.remove();
                      wi++;
                      playWord();
                    });
                  });
                } else {
                  speak(word);
                  api.particles.confetti(500, 240, { count: 54 });
                  api.wait(1400).then(function () { wi++; playWord(); });
                }
              }
            } else {
              clean = false; api.encourage();
              api.tween(orb, [
                { transform: "translate(-50%,-50%) rotate(-10deg)" },
                { transform: "translate(-50%,-50%) rotate(10deg)" },
                { transform: "translate(-50%,-50%) rotate(0)" }
              ], { duration: 300 });
            }
          });
        });

        momo.set("thinking");
        api.say("Spell " + word + "! Tap the letters in order.", { peek: "🚀", id: "word-" + word });
      }

      function speak(s) { if (api.voice) api.voice.speakWord(s); else if (Kido.audio.speak) Kido.audio.speak(s); }
      function playAnimalAudio(key) {
        var grp = (Kido.creatures && Kido.creatures.group(key)) || "animals";
        if (grp === "birds") {
          if (Kido.AudioManager && Kido.AudioManager.playBird) Kido.AudioManager.playBird(key);
          else if (Kido.audio && Kido.audio.playBirdSound) Kido.audio.playBirdSound(key);
        } else {
          if (Kido.AudioManager && Kido.AudioManager.playAnimal) Kido.AudioManager.playAnimal(key);
          else if (Kido.audio && Kido.audio.playAnimalSound) Kido.audio.playAnimalSound(key);
        }
      }
      function spread(n) {
        var out = [], cols = Math.min(n, 5);
        for (var i = 0; i < n; i++) {
          var col = i % cols, row = Math.floor(i / cols);
          var x = 500 - (cols - 1) * 150 / 2 + col * 150 + api.randInt(-18, 18);
          var y = 260 + row * 110 + api.randInt(-8, 8);
          out.push([x, y]);
        }
        return out;
      }
      function orbEl(L) {
        return api.el("div", { class: "actor actor--tappable", html:
          '<div style="width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 35% 32%,#FEF08A,#FACC15 55%,#CA8A04 100%);border:4px solid #FEF9C3;display:flex;align-items:center;justify-content:center;font-family:\'Baloo 2\',sans-serif;font-weight:800;font-size:52px;color:#713F12;box-shadow:0 0 24px rgba(250,204,21,.75),0 8px 16px rgba(0,0,0,.3);text-shadow:0 1px 2px rgba(255,255,255,.8);">' + L + '</div>' });
      }
    }
  });
})(window);
