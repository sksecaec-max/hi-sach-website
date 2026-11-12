/* =========================================================================
   whatsAnimal.js — Flagship scene: "What's That Animal?"
   Guess-the-animal learning loop with circular candidate selection:

     SEE    → a pure, recognizable mystery shadow appears in the center
     GUESS  → circular candidate animal buttons orbit around the shadow
     REVEAL → on correct pick, shadow transforms into real full-colour animal!
     HEAR   → real animal sound plays + name letters bounce in
     REPEAT → hear and say the name
     INTERACT→ "what does it eat?" diet mini-game
     LEARN  → age-right educational fact
     REWARD → celebrations, sparkles, and progress pips!
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido;

  /* Speech-bubble icons — authored SVG (not OS emoji), same look on every device. */
  function peekIcon(inner) { return '<svg class="wta-peek" viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">' + inner + "</svg>"; }
  var PEEK = {
    guess: peekIcon('<circle cx="24" cy="24" r="22" fill="#7C5CE0"/><path d="M17.5 18.5a6.5 6.5 0 1 1 9.6 5.7c-2 1.1-3.1 2.4-3.1 4.6v1.2" fill="none" stroke="#FFFFFF" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="36.5" r="2.8" fill="#FFFFFF"/>'),
    say: peekIcon('<circle cx="24" cy="24" r="22" fill="#FFC83B"/><path d="M12.5 19.5h5.5l7.5-6.5v22l-7.5-6.5h-5.5z" fill="#2B2151"/><path d="M29.5 18.5q3.6 5.5 0 11" fill="none" stroke="#2B2151" stroke-width="2.8" stroke-linecap="round"/><path d="M33.5 14.5q6.4 9.5 0 19" fill="none" stroke="#2B2151" stroke-width="2.8" stroke-linecap="round"/>'),
    eat: peekIcon('<circle cx="24" cy="24" r="22" fill="#FFE7C2"/><circle cx="24" cy="25" r="12.5" fill="#FFFFFF" stroke="#E2C9A2" stroke-width="2"/><circle cx="24" cy="25" r="7.5" fill="none" stroke="#F0DEC2" stroke-width="2"/><path d="M8.6 13v6.5a2.3 2.3 0 0 0 4.6 0V13M10.9 13v24" fill="none" stroke="#8A6A45" stroke-width="2.2" stroke-linecap="round"/><path d="M39.5 13c-2.4 2-2.8 6.2-2.8 9.4h2.8V37" fill="none" stroke="#8A6A45" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    yum: peekIcon('<circle cx="24" cy="24" r="22" fill="#38C172"/><path d="M14 24.5l7 7 13-14" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'),
    learn: peekIcon('<circle cx="24" cy="24" r="22" fill="#FFF3C4"/><path d="M24 9.5a10 10 0 0 0 -5.8 18.1c.9.6 1.2 1.5 1.2 2.6V32.5h9.2v-2.3c0-1.1.5-2 1.2-2.6A10 10 0 0 0 24 9.5z" fill="#FFC23D" stroke="#E59A12" stroke-width="1.6"/><rect x="19.4" y="33.6" width="9.2" height="4.2" rx="1.8" fill="#9FAECB"/><path d="M20 19a4 4 0 0 1 3.4-3.6" fill="none" stroke="#FFF6D6" stroke-width="2.2" stroke-linecap="round"/>')
  };

  var STR = {
    en: {
      guess: "Ooh, who's hiding in the jungle shadows? Can you guess?",
      tapPeek: PEEK.guess,
      say: function (n) { return 'Your turn, explorer! Let\'s say it together: "' + n + '"!'; },
      eat: function (n) { return "Yum! What delicious food does the " + n + " love to eat?"; },
      eats: function (n, f) { return "Spot on! The " + n + " loves eating " + f + "! Delicious!"; }
    }
  };
  function T() { return STR.en; }
  // Every line this scene can glue together, so scripts/voice/harvest.js can record them (else: the device voice).
  (Kido.voiceGen = Kido.voiceGen || []).push(function (band) {
    var t = T(), out = [t.guess];
    Object.keys(Kido.wta.worlds).forEach(function (w) {
      Kido.wta.worlds[w].animals.forEach(function (key) {
        var info = Kido.wta.get(key); if (!info) return;
        out.push(info.name, t.say(info.name), t.eat(info.name));
        if (info.food) out.push(t.eats(info.name, info.food.correct.l));
        if (Kido.facts) out.push(Kido.facts.sentence(info.group, key, info.name, band));
      });
    });
    return out;
  });

  function palmTreeSVG() {
    return '<svg viewBox="0 0 160 220" class="scenery-palm"><path d="M74 210 Q80 120 70 60 Q78 50 86 60 Q82 120 84 210 Z" fill="#8C5C36"/><circle cx="78" cy="62" r="10" fill="#5A3A1E"/><circle cx="70" cy="68" r="9" fill="#5A3A1E"/><path class="scenery-sway-1" d="M78 58 Q40 30 10 50 Q45 20 78 58 Z" fill="#4CAF50"/><path class="scenery-sway-2" d="M78 58 Q120 30 150 50 Q115 20 78 58 Z" fill="#43A047"/><path class="scenery-sway-3" d="M78 58 Q70 10 50 0 Q65 18 78 58 Z" fill="#66BB6A"/><path class="scenery-sway-1" d="M78 58 Q90 10 110 0 Q95 18 78 58 Z" fill="#4CAF50"/></svg>';
  }
  function foliageSVG() {
    return '<svg viewBox="0 0 120 120" class="scenery-bush"><path class="scenery-sway-2" d="M10 110 Q20 40 60 20 Q50 60 30 110 Z" fill="#388E3C"/><path class="scenery-sway-1" d="M60 110 Q70 30 110 10 Q90 50 80 110 Z" fill="#4CAF50"/><path class="scenery-sway-3" d="M40 110 Q50 50 60 35 Q70 50 80 110 Z" fill="#2E7D32"/></svg>';
  }
  function flowerSVG() {
    return '<svg viewBox="0 0 100 100" class="scenery-flower"><g class="scenery-pulse"><circle cx="50" cy="50" r="12" fill="#FFEB3B"/><circle cx="50" cy="30" r="16" fill="#FF4081" opacity=".9"/><circle cx="70" cy="50" r="16" fill="#FF4081" opacity=".9"/><circle cx="50" cy="70" r="16" fill="#FF4081" opacity=".9"/><circle cx="30" cy="50" r="16" fill="#FF4081" opacity=".9"/></g></svg>';
  }

  Kido.Scene.register("scene-whatsanimal", {
    music: "jungle", bg: "bg-jungle",
    build: function (api) {
      var spec = api.spec || {};
      var world = (Kido.wta && Kido.wta.world) ? Kido.wta.world(spec.world || "jungle") : { animals: [], ground: "ground-green", bg: "bg-jungle", music: "jungle" };
      var t = T();

      api.stage.className = "scene-stage " + world.bg;
      if (Kido.Music && world.music) Kido.Music.play(world.music);

      var cfg = api.cfg || {};
      var d = cfg.difficulty || 3;
      var foodOpts = d <= 2 ? 2 : (d <= 4 ? 3 : 4);
      var doLearn = d >= 3;
      var maxByAge = d <= 2 ? 4 : 6;
      var totalRounds = Math.max(3, Math.min(world.animals.length, cfg.rounds || 4, maxByAge));

      // ---- scenery ----
      api.layers.ground.appendChild(api.el("div", { class: "ground-strip " + world.ground }));
      var treeLeft = api.el("div", { class: "actor scenery-tree", html: palmTreeSVG() });
      api.place(treeLeft, 140, 240, { layer: "mid", w: 220, h: 280 });
      var treeRight = api.el("div", { class: "actor scenery-tree", html: palmTreeSVG() });
      api.place(treeRight, 860, 240, { layer: "mid", w: 220, h: 280 });
      var bush = api.el("div", { class: "actor scenery-bush-wrap", html: foliageSVG() });
      api.place(bush, 66, 560, { layer: "props", w: 120, h: 120 });
      var flower = api.el("div", { class: "actor scenery-flower-wrap", html: flowerSVG() });
      api.place(flower, 936, 560, { layer: "props", w: 96, h: 96 });

      // ---- Momo the Mascot: standing visibly above the ground line, looking at the center ----
      var momo = api.char("momo", 860, 460, { size: 135, className: "guide-momo" });
      if (momo && momo.look) momo.look(-6, -2);

      // ---- the round set + preload its sounds ----
      var roundAnimals = api.sample(world.animals, totalRounds);
      var pre = { animals: [], birds: [] };
      roundAnimals.forEach(function (k) { var g = ((Kido.wta.get(k) || {}).group) || "animals"; pre[g].push(k); });
      if (Kido.AudioManager) {
        if (pre.animals.length) Kido.AudioManager.preloadAnimals(pre.animals);
        if (pre.birds.length) Kido.AudioManager.preloadBirds(pre.birds);
      }

      // ---- persistent replay speaker ----
      var current = null;
      var speakerEl = api.el("button", {
        class: "wta-speaker-btn",
        "aria-label": "Replay sound",
        html: '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#FFC83B"/><path d="M26 32 h8 l10 -9 v34 l-10 -9 h-8 z" fill="#2B2151"/><path class="speaker-wave-1" d="M48 30 Q54 40 48 50" fill="none" stroke="#2B2151" stroke-width="3.5" stroke-linecap="round"/><path class="speaker-wave-2" d="M55 24 Q63 40 55 56" fill="none" stroke="#2B2151" stroke-width="3.5" stroke-linecap="round"/></svg>'
      });
      api.layers.ui.appendChild(speakerEl);
      api.tap(speakerEl, function () {
        speakerEl.classList.remove("is-playing");
        void speakerEl.offsetWidth;
        speakerEl.classList.add("is-playing");
        if (current) playSound(current.group, current.key);
      });

      // True animal silhouette (Change #28): the animal's own photo cut-out, else its transparent vector art
      function silhouetteHTML(key) {
        if (Kido.creatures && Kido.creatures.silhouette) return Kido.creatures.silhouette(key);
        return '<span class="wta-emoji">' + ((Kido.wta && Kido.wta.emoji(key)) || "❓") + '</span>';
      }

      // Full-color real artwork/photo for reveal & candidate cards
      function artHTML(key) {
        // the same drawing the shadow is made from, so the child matches outline to outline
        var d = Kido.creatures && Kido.creatures.drawing && Kido.creatures.drawing(key);
        if (d) return d;
        return (Kido.wta && Kido.wta.art) ? Kido.wta.art(key)
          : '<span class="wta-emoji">' + ((Kido.wta && Kido.wta.emoji(key)) || "❓") + '</span>';
      }

      function playSound(group, key) {
        if (!Kido.AudioManager) return;
        if (group === "birds") Kido.AudioManager.playBird(key); else Kido.AudioManager.playAnimal(key);
      }
      function speakWord(s) { if (api.voice) api.voice.speakWord(s); }

      function clearRound() {
        Array.prototype.forEach.call(api.layers.actors.querySelectorAll(".wta-shadow-card"), function (a) { a.remove(); });
        Array.prototype.forEach.call(api.layers.ui.querySelectorAll(".wta-choice-btn,.wta-name,.wta-tray"), function (a) { a.remove(); });
        api.hideSay();
      }

      var idx = 0, correct = 0;
      function next() {
        clearRound();
        if (idx >= roundAnimals.length) { api.finish(correct, roundAnimals.length); return; }
        api.setProgress(idx, roundAnimals.length);
        playAnimal(roundAnimals[idx]);
      }

      function playAnimal(key) {
        var info = Kido.wta.get(key) || { group: "animals", name: key, tint: "#7A7A7A", food: null };
        var group = info.group, name = info.name;
        var clean = true;
        current = { group: group, key: key, name: name };

        // 1. Center Mystery Shadow Card (single adult animal only, no baby)
        var shadowCard = api.el("div", { class: "actor wta-shadow-card" });
        var shadowArt = api.el("div", { class: "wta-shadow-art", html: silhouetteHTML(key) });
        var revealArt = api.el("div", { class: "wta-reveal-art hidden", html: artHTML(key) });
        shadowCard.appendChild(shadowArt);
        shadowCard.appendChild(revealArt);
        api.place(shadowCard, 500, 236, { layer: "actors", w: 252, h: 194 });

        api.tween(shadowCard, [
          { opacity: 0, transform: "translate(-50%,-50%) scale(.6)" },
          { opacity: 1, transform: "translate(-50%,-50%) scale(1.05)" },
          { opacity: 1, transform: "translate(-50%,-50%) scale(1)" }
        ], { duration: 450, easing: "cubic-bezier(.34,1.56,.64,1)" });

        if (momo && momo.set) { momo.set("thinking"); if (momo.look) momo.look(-6, -2); }
        api.say(t.guess, { peek: t.tapPeek, id: "wta-guess-" + key });

        // 2. Circular Arrangement of Candidate Animals Orbiting the Shadow
        // 4 circular options symmetrically arranged in an orbit around (500, 236)
        var coords = [
          { x: 320, y: 145 },
          { x: 680, y: 145 },
          { x: 680, y: 330 },
          { x: 320, y: 330 }
        ];

        var otherKeys = world.animals.filter(function (k) { return k !== key; });
        // choices follow the age: 2 for ages 2-4, 3 for 4-5, 4 from 5 up (two sit left and right of the shadow)
        var nChoice = Math.max(2, Math.min(4, cfg.optionsPerQuestion || 4));
        if (nChoice === 2) coords = [{ x: 300, y: 236 }, { x: 700, y: 236 }];
        var distractors = api.sample(otherKeys, nChoice - 1);
        var candidateKeys = api.shuffle([key].concat(distractors));
        var choiceBtns = [];
        var guessActive = true;

        candidateKeys.forEach(function (candKey, i) {
          var pos = coords[i];
          var candInfo = Kido.wta.get(candKey) || { name: candKey };
          var b = api.el("button", {
            class: "wta-choice-btn",
            style: "left:" + pos.x + "px;top:" + pos.y + "px;animation-delay:" + (i * 0.08) + "s;",
            "aria-label": "Guess " + candInfo.name,
            html: artHTML(candKey)
          });

          api.on(b, "pointerup", function (e) {
            e.preventDefault();
            if (!guessActive) return;
            Kido.audio.unlock();

            if (candKey === key) {
              // Correct guess!
              guessActive = false;
              b.classList.add("is-correct");
              choiceBtns.forEach(function (otherBtn) {
                if (otherBtn !== b) otherBtn.classList.add("fade-out");
              });
              Kido.audio.playCorrectSound();
              if (Kido.fx && Kido.fx.sparkleEl) Kido.fx.sparkleEl(b);
              api.particles.sparkle(500, 236);
              reveal();
            } else {
              // Incorrect guess: gentle shake & encouraging tone
              clean = false;
              b.classList.remove("is-wrong");
              void b.offsetWidth;
              b.classList.add("is-wrong");
              Kido.audio.tone(240, 0.15, "sine", 0.2);
              if (momo && momo.react) momo.react("thinking");
              api.encourage();
            }
          });

          api.layers.ui.appendChild(b);
          choiceBtns.push(b);
        });

        // 3. REVEAL — shadow card morphs to real full-colour animal!
        function reveal() {
          shadowArt.classList.add("fade-out");
          revealArt.classList.remove("hidden");
          shadowCard.classList.add("is-revealed");
          api.camShake(5);
          showName();

          speakerEl.classList.add("is-playing");
          playSound(group, key);
          setTimeout(function () { speakerEl.classList.remove("is-playing"); }, 1800);

          if (momo && momo.set) { momo.set("celebrating").pose("cheer"); }

          api.wait(1600).then(function () {
            speakWord(name);
          });

          // Transition smoothly into the food mini-game
          api.wait(3200).then(function () {
            // Remove the remaining candidate buttons
            choiceBtns.forEach(function (btn) { if (btn.parentNode) btn.remove(); });
            repeatBeat();
          });
        }

        function showName() {
          var w = api.el("div", { class: "wta-name" });
          name.toUpperCase().split("").forEach(function (ch, i) {
            var s = api.el("span", { class: "wta-name__l", text: ch });
            s.style.color = info.tint || "#166534";
            w.appendChild(s);
            api.tween(s, [
              { opacity: 0, transform: "translateY(26px) scale(.4)" },
              { opacity: 1, transform: "translateY(0) scale(1)" }
            ], { duration: 340, delay: i * 70 });
          });
          api.layers.ui.appendChild(w);
        }

        // 4. REPEAT
        function repeatBeat() {
          api.say(t.say(name), { peek: PEEK.say, id: "wta-say-" + key });
          api.hint(speakerEl);
          api.wait(3000).then(function () {
            api.clearHint(speakerEl);
            if (info.food) foodGame(); else learnBeat();
          });
        }

        // 5. INTERACT — the diet mini-game ("what does it eat?")
        function foodGame() {
          api.say(t.eat(name), { peek: PEEK.eat, id: "wta-food-" + key });
          var opts = api.shuffle([info.food.correct].concat(api.sample(info.food.decoys, Math.max(1, foodOpts - 1))));
          var tray = api.el("div", { class: "wta-tray" });
          opts.forEach(function (f) {
            var b = api.el("button", { class: "wta-tray__item", "aria-label": f.l,
              html: '<img class="wta-tray__img" src="' + f.img + '" alt="" draggable="false" />' });
            api.on(b, "pointerup", function (e) {
              e.preventDefault(); Kido.audio.unlock();
              if (f === info.food.correct) {
                b.classList.add("yum");
                api.correct({ at: [500, 470], silent: true });
                if (momo && momo.set) momo.set("happy").pose("nod");
                api.say(t.eats(name, f.l), { peek: PEEK.yum, id: "wta-yum-" + key });
                tray.classList.add("gone");
                api.wait(3000).then(function () { if (tray.parentNode) tray.remove(); learnBeat(); });
              } else {
                clean = false;
                b.classList.add("no");
                if (momo && momo.react) momo.react("thinking");
                api.encourage();
              }
            });
            tray.appendChild(b);
          });
          api.layers.ui.appendChild(tray);
        }

        // 6. LEARN — age-appropriate educational line
        function learnBeat() {
          var line = doLearn && Kido.facts ? Kido.facts.sentence(group, key, name, api.band) : "";
          if (line) {
            api.say(line, { peek: PEEK.learn, id: "wta-learn-" + key });
            api.wait(api.reduced() ? 300 : 4000).then(finishAnimal);
          } else {
            finishAnimal();
          }
        }

        // 7. REWARD
        function finishAnimal() {
          api.particles.sparkle(500, 236);
          if (momo && momo.set) momo.set("celebrating").pose("cheer");
          if (clean) correct++;
          api.wait(1800).then(function () { idx++; next(); });
        }
      }

      next();
    }
  });
})(window);
