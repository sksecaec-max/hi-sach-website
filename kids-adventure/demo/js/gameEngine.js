/* =========================================================================
   gameEngine.js — Shared, data-driven game engine
   A handful of reusable game "types" cover every category. A game SPEC is a
   plain object (built in catalog.js from content data + the age config), so
   adding an activity means adding data, not code.

   Types: quiz | match | soundboard | order | assembly
   Signature games (runner, story) live in js/activities/ and reuse this file's
   helpers + finish flow.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  /* ---------------- tiny DOM + array utilities ---------------- */
  var util = Kido.util = {
    /** A window/document listener that removes itself once `el` has left the page (QA 2026-11-10: games that
        listened on window kept their handlers, and the old game they pointed at, alive after the child left). */
    onWhile: function (el, target, type, fn, opts) {
      function h(e) { if (!el.isConnected) { target.removeEventListener(type, h, opts); return; } return fn(e); }
      target.addEventListener(type, h, opts);
      return h;
    },
    el: function (tag, attrs, kids) {
      var e = document.createElement(tag);
      if (attrs) Object.keys(attrs).forEach(function (k) {
        if (k === "class") e.className = attrs[k];
        else if (k === "html") e.innerHTML = attrs[k];
        else if (k === "text") e.textContent = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") e.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
      });
      (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
      return e;
    },
    shuffle: function (a) {
      a = a.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    sample: function (a, n) { return util.shuffle(a).slice(0, n); },
    randInt: function (lo, hi) { return lo + ((Math.random() * (hi - lo + 1)) | 0); },
    pick: function (a) { return a[(Math.random() * a.length) | 0]; }
  };

  function mount() { return document.getElementById("screen"); }
  function clearMount() { var m = mount(); m.innerHTML = ""; m.scrollTop = 0; return m; }

  /* ---------------- shared game chrome ---------------- */
  function header(spec, state) {
    var dots = util.el("div", { class: "game__progress" });
    for (var i = 0; i < state.total; i++) {
      var cls = i < state.index ? "done" : (i === state.index ? "current" : "");
      dots.appendChild(util.el("i", { class: cls }));
    }
    return util.el("div", { class: "game__head" }, [
      // aria-live so screen-reader users hear each new round's prompt as it changes.
      util.el("div", { class: "game__prompt", id: "g-prompt", "aria-live": "polite", "aria-atomic": "true" }),
      spec.showRounds === false ? null : dots,
      util.el("div", { class: "game__hint", id: "g-hint", text: spec.hint || "" })
    ]);
  }

  // a long question gets a third, smaller line on phones instead of being cut off with "…" (QA 2026-11-10)
  function setPrompt(html) { var p = document.getElementById("g-prompt"); if (p) { p.innerHTML = html; p.classList.toggle("is-long", (p.textContent || "").length > 58); } }

  /* ---------------- finish / result flow ---------------- */
  // Change #28: the run that is on screen. Games end on a short celebration timer; if the child pressed Back
  // (or opened another game) during it, that late finish must not paint a result over the new screen, and a
  // run only finishes once.
  var activeSpec = null;
  function finish(spec, correct, total) {
    var e = Kido.nav && Kido.nav.current && Kido.nav.current();
    if (spec !== activeSpec || !e || e.name !== "play") return;
    activeSpec = null;
    var result = Kido.rewards.award(spec.activityId, spec.categoryId, correct, total);
    result.correct = correct; result.total = total;
    if (Kido.Learning) Kido.Learning.noteResult(spec, result);   // session memory + mini-game observations (local only)
    Kido.rewards.celebrate(result);
    Kido.screens.showResult(spec, result);
  }

  /* ============================================================
     QUIZ  — tap the correct option
     Covers: identify, count, odd-one-out, missing letter, more/less,
             greetings, beginning sound, body-part-tap.
     spec.rounds[i] = {
       prompt: html,  showcase: html (optional big object row/word),
       options: [ { html, correct:bool, speak:str } ],
       say: str  (spoken when the round appears)
     }
     ============================================================ */
  function getBgClass(spec) {
    if (spec.bg) return spec.bg;
    var cat = spec.categoryId || "";
    var act = spec.activityId || "";
    if (cat === "hindi" || act.indexOf("hindi") === 0) return "game--hindi";
    if (cat === "animals" || cat === "birds" || act === "bird-find" || act === "animal-find" || act === "bird-explore" || act === "animal-explore" || act === "memory-match" || act === "shadow-match" || act === "who-makes-sound" || act === "who-am-i") return "game--safari";
    if (cat === "flowers" || cat === "nature" || act === "flower-find" || act === "flower-explore") return "game--orchard";
    if (cat === "numbers" || act === "count" || act === "sequence" || act === "moreless" || act === "number-order") return "game--orchard";
    if (cat === "vehicles" || act === "vehicle-find" || act === "vehicle-explore") return "game--city";
    if (cat === "habits" || cat === "greetings" || act === "habit-choose" || act === "habit-routine" || act === "greetings") return "game--home";
    if (cat === "body" || act === "body") return "game--body";
    if (cat === "shapes" || act === "shape-find" || act === "shape-sorter" || act === "odd") return "game--shapes";
    if (cat === "alphabet" || act === "alphabet-find" || act === "alphabet-match") return "game--alphabet";
    return "";
  }

  function playQuiz(spec) {
    var m = clearMount();
    var state = { index: 0, total: spec.rounds.length, correct: 0 };
    var bgClass = getBgClass(spec);
    var game = util.el("div", { class: "game" + (bgClass ? " " + bgClass : "") });
    game.appendChild(header(spec, state));
    var stage = util.el("div", { class: "stage", id: "g-stage" });
    game.appendChild(stage);
    m.appendChild(game);
    var isHindi = spec.lang === "hi" || (spec.instruction && /[\u0900-\u097F]/.test(spec.instruction));
    if (spec.instruction) Kido.mascot.say(spec.instruction, { lang: isHindi ? "hi-IN" : "en-US" });

    var roundSeq = 0;
    renderRound();

    function renderRound() {
      var currentSeq = ++roundSeq;
      var r = spec.rounds[state.index];
      updateDots(state);
      setPrompt(r.prompt !== undefined ? r.prompt : (spec.instruction || ""));
      stage.innerHTML = "";
      if (r.showcase) {
        var sc = util.el("div", { class: (r.showcaseClass || "showcase") + (r.say ? " showcase--tappable" : ""), html: r.showcase });
        if (r.say) {
          sc.style.cursor = "pointer";
          sc.setAttribute("title", "Tap to listen again");
          sc.addEventListener("click", function () {
            Kido.audio.speak(r.say, { lang: isHindi ? "hi-IN" : "en-US" });
            if (Kido.fx && Kido.fx.popEl) Kido.fx.popEl(sc);
          });
        }
        stage.appendChild(sc);
      }

      var opts = r.options.slice();
      if (spec.shuffleOptions !== false) opts = util.shuffle(opts);
      var cols = opts.length <= 2 ? 2 : (opts.length === 3 ? 3 : 2);
      // Picture options (o.pic) carry long inline SVG markup — don't let that
      // length collapse the grid; only real wordy text should force 2 columns.
      if (opts.some(function (o) { return !o.pic && (o.html || "").length > 6; })) cols = Math.min(cols, 2);
      var grid = util.el("div", { class: "options cols-" + cols });

      // Stagger sequential reveal if requested by spec, round, or for wordy dialogue quizzes
      var shouldStagger = spec.narrateOptions === false ? false : (spec.narrateOptions || r.narrateOptions || (r.say && opts.some(function (o) { return !o.pic; })));

      var optBtns = [];
      opts.forEach(function (o) {
        var plain = (o.html || "").replace(/<[^>]*>/g, "").trim();
        var isNum = /^\d+$/.test(plain);
        var isFruitGrp = (o.html || "").indexOf("count-mini-group") !== -1;
        var isPic = !isFruitGrp && (o.pic || (!isNum && plain && !/[A-Za-z]{3,}/.test(plain)));
        var btnCls = "opt" + (isPic ? " opt--pic" : "") + (isNum ? " opt--number" : "") + (isFruitGrp ? " opt--fruit-group" : "") + (shouldStagger ? " opt--staged" : "") + (o.cls ? " " + o.cls : "");
        // a bare emoji/letter is wrapped so CSS can size it from its own card (container units resolve against an ancestor)
        var btn = util.el("button", { class: btnCls, html: isPic && (o.html || "").indexOf("<") < 0 ? '<span class="opt__glyph">' + o.html + "</span>" : o.html, "aria-label": o.speak || "option" });
        btn.addEventListener("click", function () { onPick(btn, o, r); });
        optBtns.push(btn);
        grid.appendChild(btn);
      });
      stage.appendChild(grid);

      // Entrance for a still-hidden (staged) option — never replayed on one already showing
      // (that blinked the whole grid out on the first tap and made a quick second tap miss).
      // The class is dropped once it has played so it can't override :active or the shake.
      function popIn(b) {
        if (!b.classList.contains("opt--staged")) return;
        b.classList.remove("opt--staged");
        b.classList.add("anim-pop-in");
        b.addEventListener("animationend", function done(e) {
          if (e.animationName !== "optPopIn") return;
          b.removeEventListener("animationend", done);
          b.classList.remove("anim-pop-in");
        });
      }

      function revealAllRemaining() { optBtns.forEach(function (b) { popIn(b); }); }

      function revealNextOption(i) {
        if (currentSeq !== roundSeq) return;
        if (i >= optBtns.length) return;
        var b = optBtns[i];
        var o = opts[i];
        popIn(b);
        Kido.audio.tone(520 + i * 70, 0.08, "triangle", 0.15);

        var textToSay = o.speak || (o.html || "").replace(/<[^>]*>/g, "").trim();
        if (textToSay && (!o.pic || spec.narrateOptions || r.narrateOptions)) {
          Kido.audio.whenQuiet(4000, 150).then(function () {
            return currentSeq === roundSeq && Kido.audio.speak(textToSay, { lang: isHindi ? "hi-IN" : "en-US", rate: 1.04 });
          }).then(function () {
            if (currentSeq !== roundSeq) return;
            setTimeout(function () { revealNextOption(i + 1); }, 280);
          });
        } else {
          setTimeout(function () { revealNextOption(i + 1); }, 380);
        }
      }

      // Speak the question / showcase first, then reveal options one-by-one!
      var delay = (state.index === 0 && spec.instruction) ? 1750 : 350;
      setTimeout(function () {
        if (currentSeq !== roundSeq) return;
        // the question waits for a line still playing (the answer just given, the game's opening instruction)
        var promptP = r.say ? Kido.audio.whenQuiet().then(function () {
          if (currentSeq !== roundSeq) return;
          return Kido.audio.speak(r.say, { lang: isHindi ? "hi-IN" : "en-US" });
        }) : Promise.resolve();
        promptP.then(function () {
          if (currentSeq !== roundSeq) return;
          if (shouldStagger) {
            setTimeout(function () { revealNextOption(0); }, 320);
          }
        });
      }, delay);

      state.tries = 0;
      state.revealAll = revealAllRemaining;
    }

    function onPick(btn, o, r) {
      if (state.revealAll) state.revealAll();
      if (btn.classList.contains("is-disabled")) return;
      Kido.audio.playTapSound();
      if (o.correct) {
        btn.classList.add("is-correct");
        Kido.fx.sparkleEl(btn);
        Kido.audio.playCorrectSound();
        Array.prototype.forEach.call(stage.querySelectorAll(".opt"), function (b) { b.classList.add("is-disabled"); });
        if (state.tries === 0) state.correct++;
        var toastMsg = isHindi
          ? util.pick(["बहुत बढ़िया!", "शानदार!", "कमाल!", "एकदम सही!"])
          : util.pick(["Awesome!", "Spot on!", "Fantastic!", "You got it!", "Brilliant!"]);
        Kido.fx.toast(toastMsg, "ok");

        var factToSay = o.fact || r.fact;
        if (factToSay) {
          // Speak the rich educational fact and wait for narration before moving forward!
          setTimeout(function () {
            Kido.audio.speak(factToSay, { lang: isHindi ? "hi-IN" : "en-US" }).then(function () {
              setTimeout(next, 700);
            });
          }, 200);
        } else {
          if (o.speak) setTimeout(function () { Kido.audio.speak(o.speak, { lang: isHindi ? "hi-IN" : "en-US" }); }, 120);
          setTimeout(next, 950);
        }
      } else {
        state.tries++;
        btn.classList.add("is-wrong", "is-disabled");
        Kido.fx.shake(btn);
        Kido.audio.playIncorrectSound();
        if (o.wrongSay) {                                    // classify games: say the truth (e.g. "Ice is cold!")
          Kido.mascot.say(o.wrongSay, { lang: isHindi ? "hi-IN" : "en-US" });
        } else if (o.speak && r.say) {
          // only a "Find the X" prompt names a target ("How many?" used to give "Let's find the How many!")
          var plainPrompt = r.prompt ? r.prompt.replace(/<[^>]*>/g, "") : "";
          var targetName = r.targetName || (/Find /i.test(plainPrompt) ? plainPrompt.replace(/^.*Find (the )?/i, "").replace(/[!?.]/g, "").trim() : "");
          // "an" before a vowel sound: apple, R ("ar"), 8 ("eight"), 11, 18
          var an = /^[A-Z]$/.test(o.speak) ? /[AEFHILMNORSX]/.test(o.speak) : /^[aeiou]/i.test(o.speak) || /^(8|11|18)(\D|$)|^8\d/.test(o.speak);
          var encParts = isHindi
            ? ["यह " + o.speak + " है!", targetName ? targetName + " ढूँढो।" : "फिर से सोचो।"]
            : ["That's " + (an ? "an " : "a ") + o.speak + "!", "Let's find " + (targetName ? "the " + targetName : "the right one") + "!"];
          // spoken in two parts so each can be a recorded clip (names x targets would be thousands of whole lines)
          Kido.mascot.say(encParts.join(" "), { lang: isHindi ? "hi-IN" : "en-US", parts: encParts });
        } else {
          var encMsg = isHindi
            ? util.pick(["अरे! बहुत करीब, फिर से कोशिश करो।", "कोई बात नहीं! एक बार और सोचो।", "लगभग हो गया! दूसरा चुनो।"])
            : util.pick(["Almost there! Let's give it another go.", "Good thinking! Try one more time.", "Nearly had it! You can do this!"]);
          Kido.mascot.say(encMsg, { lang: isHindi ? "hi-IN" : "en-US" });
        }
      }
    }

    function next() {
      state.index++;
      if (state.index >= state.total) finish(spec, state.correct, state.total);
      else renderRound();
    }
  }

  /* ============================================================
     MATCH — drag chips onto their matching slots (drag & drop)
     spec.rounds[i] = { prompt, pairs: [ {id, key:{emoji,label}, value:{emoji,label}} ] }
     ============================================================ */
  function playMatch(spec) {
    var m = clearMount();
    var state = { index: 0, total: spec.rounds.length, correct: 0 };
    var bgClass = getBgClass(spec);
    var game = util.el("div", { class: "game" + (bgClass ? " " + bgClass : "") });
    game.appendChild(header(spec, state));
    var stage = util.el("div", { class: "stage", id: "g-stage" });
    game.appendChild(stage);
    m.appendChild(game);
    var isHindi = spec.lang === "hi" || (spec.instruction && /[\u0900-\u097F]/.test(spec.instruction));
    if (spec.instruction) Kido.mascot.say(spec.instruction, { lang: isHindi ? "hi-IN" : "en-US" });
    renderRound();

    function renderRound() {
      var r = spec.rounds[state.index];
      updateDots(state);
      setPrompt(r.prompt || spec.instruction || "");
      stage.innerHTML = "";
      var placed = 0, mistakes = 0;
      var byId = {};
      r.pairs.forEach(function (p) { byId[p.id] = p; });
      var tap = tapPlacement(doPlace);

      var wrapEl = util.el("div", { class: "match" });
      var pool = util.el("div", { class: "match__pool" });
      var targets = util.el("div", { class: "match__targets" });

      // Targets (keys) — real buttons so switch / keyboard / screen-reader users can drop here too.
      r.pairs.forEach(function (p) {
        var keyName = stripTags(p.key.emoji) || "picture";
        var slot = util.el("div", { class: "slot", "data-id": p.id, role: "button", tabindex: "0",
          "aria-label": "Drop the match for " + keyName }, [
          util.el("div", { class: "slot__key", html: p.key.emoji }),
          util.el("div", { class: "slot__drop", "data-id": p.id })
        ]);
        tap.slot(slot);
        targets.appendChild(slot);
      });

      // Chips (values), shuffled — draggable AND tap/keyboard selectable.
      util.shuffle(r.pairs).forEach(function (p) {
        var chipName = p.value.label || stripTags(p.value.emoji) || "picture";
        var chip = util.el("div", { class: "chip", "data-id": p.id, role: "button", tabindex: "0",
          "aria-pressed": "false", "aria-label": chipName,
          html: p.value.emoji + (p.value.label ? '<small>' + p.value.label + '</small>' : '') });
        makeDraggable(chip, { onDrop: function (target) { return doPlace(chip, target && target.closest(".slot")); } });
        tap.chip(chip);
        pool.appendChild(chip);
      });

      wrapEl.appendChild(pool);
      wrapEl.appendChild(targets);
      stage.appendChild(wrapEl);

      // Single placement path shared by pointer-drag, tap and keyboard. Returns true when consumed.
      function doPlace(chip, slot) {
        if (!chip || !slot) return false;
        var p = byId[chip.getAttribute("data-id")];
        if (slot.getAttribute("data-id") === chip.getAttribute("data-id") && !slot.classList.contains("filled")) {
          slot.classList.add("filled");
          slot.querySelector(".slot__drop").innerHTML = p.value.emoji;
          chip.remove();
          placed++;
          Kido.audio.playCorrectSound();
          Kido.fx.sparkleEl(slot);
          if (p.value.say || p.value.label) Kido.audio.speak(p.value.say || p.value.label, { lang: isHindi ? "hi-IN" : "en-US" });
          if (placed === r.pairs.length) {
            if (mistakes === 0) state.correct++;
            Kido.fx.toast(isHindi ? "सब मिल गए!" : "All matched!", "ok");
            setTimeout(next, 800);
          }
          return true;
        }
        mistakes++;
        Kido.audio.playIncorrectSound();
        Kido.fx.shake(slot);
        return false;
      }
    }

    function next() {
      state.index++;
      if (state.index >= state.total) finish(spec, state.correct, state.total);
      else renderRound();
    }
  }

  /* ============================================================
     SOUNDBOARD — explore: tap a tile -> it animates, plays a sound,
     shows + speaks its name. Great for animals / birds / vehicles.
     spec.items = [ { key, emoji, name, sound:'animal'|'bird'|'vehicle', lang } ]
     Tapping every picture finishes it (and rewards the exploring).
     ============================================================ */
  function playSoundboard(spec) {
    var m = clearMount();
    var bgClass = getBgClass(spec);
    var game = util.el("div", { class: "game" + (bgClass ? " " + bgClass : "") });
    var head = util.el("div", { class: "game__head" }, [
      util.el("div", { class: "game__prompt", html: spec.title || "Tap to explore!" }),
      util.el("div", { class: "game__hint", text: spec.hint || "Tap a picture to hear its sound." })
    ]);
    game.appendChild(head);
    var stage = util.el("div", { class: "stage" });
    var board = util.el("div", { class: "board" + (spec.boardClass ? " " + spec.boardClass : "") });
    var tapped = {};
    // One art source: registry SVG when the species has authored art (guarded so
    // vehicles/shapes/letters keep their emoji), else the honest emoji fallback.
    function vis(it) { if (it.html) return it.html; return (Kido.creatures && Kido.creatures.hasArt(it.key)) ? Kido.creatures.render(it.key, { name: it.name }) : it.emoji; }
    // Animal/bird boards get the full react->sound->name->voice->fact->reward flow via the reusable AudioManager; other boards keep their lighter behaviour.
    var kind = (spec.items[0] && spec.items[0].sound) || "name";
    var rich = (kind === "animal" || kind === "bird");
    var group = kind === "bird" ? "birds" : "animals";
    var AM = Kido.AudioManager;
    var gen = 0, timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    spec.items.forEach(function (it) {
      var tile = util.el("button", { class: "board-tile", "aria-label": it.name }, [
        util.el("div", { class: "board-tile__emoji", html: vis(it) }),
        util.el("div", { class: "board-tile__name", text: it.name })
      ]);
      tile.addEventListener("click", function () { onTap(it, tile); });
      board.appendChild(tile);
    });
    stage.appendChild(board);
    // Owner (2026-10-27): no card beside the board — the tapped picture's call plays and its name is said;
    // the board uses the whole width.
    // Change #28: no "I explored them all" button. Once every picture has been tapped, the activity finishes
    // by itself after the last picture's sound, name (and fact) have played.
    var finishTimer = null;
    function maybeDone(wait) {
      clearTimeout(finishTimer);
      if (Object.keys(tapped).length < spec.items.length) return;
      finishTimer = setTimeout(function () { if (AM && AM.stopCurrent) AM.stopCurrent(); finish(spec, spec.items.length, spec.items.length); }, wait);
    }
    game.appendChild(stage);
    m.appendChild(game);
    if (spec.instruction) Kido.mascot.say(spec.instruction, spec.lang === "hi" ? { lang: "hi-IN" } : undefined);
    if (rich && AM && AM.preload) AM.preload(group, spec.items.map(function (x) { return x.key; }));
    function onTap(it, tile) {
      var face = tile.querySelector(".board-tile__emoji");
      face.classList.remove("anim-jump", "anim-wiggle", "anim-drive");
      void face.offsetWidth;
      face.classList.add(kind === "vehicle" ? "anim-wiggle" : "anim-jump");
      clearTimeout(finishTimer);                             // a new tap: wait for this one to finish playing
      if (!rich) {
        if (kind === "vehicle") Kido.audio.playVehicleSound(it.key, it.name);
        else if (kind === "name") Kido.audio.speak(it.say || it.name, it.lang ? { lang: it.lang } : undefined);
        else Kido.audio.playAnimalSound(it.key, it.name);
        Kido.mascot.say(it.name, { silent: true });
        tapped[it.key] = true; maybeDone(kind === "vehicle" ? 4500 : 2600); return;   // sound, then its name
      }
      // Rich sequence: react -> SOUND -> name appears -> voice -> fact -> reward.
      var myGen = ++gen; clearTimers();
      if (AM && AM.play) AM.play(group, it.key);            // sound only (name is separate)
      else if (kind === "bird") Kido.audio.playBirdSound(it.key);
      else Kido.audio.playAnimalSound(it.key);
      Kido.fx.sparkleEl(tile);
      tapped[it.key] = true;
      later(function () {                                    // VOICE pronounces the name after the call
        if (myGen !== gen) return;
        var said = Kido.Voice && Kido.Voice.speakWord ? Kido.Voice.speakWord(it.name) : Kido.audio.speak(it.name);
        Promise.resolve(said).then(function () { if (myGen === gen) maybeDone(900); });
      }, 1150);
    }
  }

  /* ============================================================
     ORDER — tap items in the correct sequence (number ordering,
     smallest→largest, alphabet order).
     spec.rounds[i] = { prompt, items: [ {html, speak} ] in correct order }
     ============================================================ */
  function playOrder(spec) {
    var m = clearMount();
    var state = { index: 0, total: spec.rounds.length, correct: 0 };
    var bgClass = getBgClass(spec);
    var game = util.el("div", { class: "game" + (bgClass ? " " + bgClass : "") });
    game.appendChild(header(spec, state));
    var stage = util.el("div", { class: "stage" });
    game.appendChild(stage);
    m.appendChild(game);
    if (spec.instruction) Kido.mascot.say(spec.instruction, spec.lang === "hi" ? { lang: "hi-IN" } : undefined);
    renderRound();

    function renderRound() {
      var r = spec.rounds[state.index];
      updateDots(state);
      setPrompt(r.prompt || spec.instruction || "");
      stage.innerHTML = "";
      var expected = 0, mistakes = 0;

      var track = util.el("div", { class: "seq__track" });
      r.items.forEach(function () { track.appendChild(util.el("div", { class: "seq__box" })); });

      var pool = util.el("div", { class: "match__pool" });
      util.shuffle(r.items.map(function (it, i) { return { it: it, i: i }; })).forEach(function (o) {
        var chip = util.el("button", { class: "chip", html: o.it.html });
        chip.addEventListener("click", function () {
          if (chip.disabled) return;
          if (o.i === expected) {
            var box = track.children[expected];
            box.classList.add("filled"); box.innerHTML = o.it.html;
            chip.disabled = true; chip.style.opacity = ".3";
            Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(box);
            if (o.it.speak) Kido.audio.speak(o.it.speak, spec.lang === "hi" ? { lang: "hi-IN" } : undefined);
            expected++;
            if (expected === r.items.length) {
              if (mistakes === 0) state.correct++;
              Kido.fx.toast("In order!", "ok");
              setTimeout(next, 800);
            }
          } else {
            mistakes++;
            Kido.audio.playIncorrectSound();
            Kido.fx.shake(chip);
            Kido.mascot.say(r.wrongSay || spec.wrongSay || "What comes next? Try the small one first.", spec.lang === "hi" ? { lang: "hi-IN" } : undefined);
          }
        });
        pool.appendChild(chip);
      });

      var seq = util.el("div", { class: "seq" }, [track, pool]);
      stage.appendChild(seq);
    }

    function next() {
      state.index++;
      if (state.index >= state.total) finish(spec, state.correct, state.total);
      else renderRound();
    }
  }

  /* ============================================================
     ASSEMBLY — drag labelled parts onto their outlined slots.
     Used by construction (build a bridge/house) and electronics.
     spec.rounds[i] = { prompt, frameLabel, slots: [ {id,label,emoji,x,y,w,h} ] }
     Coords are percentages of the frame.
     ============================================================ */
  function playAssembly(spec) {
    var m = clearMount();
    var state = { index: 0, total: spec.rounds.length, correct: 0 };
    var bgClass = getBgClass(spec);
    var game = util.el("div", { class: "game" + (bgClass ? " " + bgClass : "") });
    game.appendChild(header(spec, state));
    var stage = util.el("div", { class: "stage" });
    game.appendChild(stage);
    m.appendChild(game);
    if (spec.instruction) Kido.mascot.say(spec.instruction);
    renderRound();

    function renderRound() {
      var r = spec.rounds[state.index];
      updateDots(state);
      setPrompt(r.prompt || spec.instruction || "");
      stage.innerHTML = "";
      var placed = 0, mistakes = 0;
      var byId = {};
      r.slots.forEach(function (s) { byId[s.id] = s; });
      var tap = tapPlacement(doPlace);

      var wrapEl = util.el("div", { class: "assembly" });
      var theme = r.theme || (r.slots && r.slots[0] && r.slots[0].id && r.slots[0].id.indexOf("p1") !== -1 ? "bridge" : (r.slots && r.slots[0] && r.slots[0].id && r.slots[0].id.indexOf("wall") !== -1 ? "house" : ""));
      var frame = util.el("div", { class: "assembly__frame" + (theme ? " assembly__frame--" + theme : "") });

      // Themed backdrops
      if (theme === "bridge") {
        var bgBridge = util.el("div", { class: "assembly__backdrop-bridge", html:
          '<svg viewBox="0 0 500 250" preserveAspectRatio="none" width="100%" height="100%">' +
            '<defs>' +
              '<linearGradient id="scSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#BAE6FD"/><stop offset="100%" stop-color="#E0F2FE"/></linearGradient>' +
              '<linearGradient id="scWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0284C7"/><stop offset="100%" stop-color="#075985"/></linearGradient>' +
            '</defs>' +
            '<rect width="500" height="250" fill="url(#scSky)"/>' +
            '<circle cx="430" cy="45" r="28" fill="#FDE047" opacity="0.8"/>' +
            '<path d="M0 145 C150 140, 350 140, 500 145 L500 250 L0 250 Z" fill="url(#scWater)"/>' +
            '<path d="M0 120 C60 120, 100 135, 110 180 L0 200 Z" fill="#22C55E"/>' +
            '<path d="M500 120 C440 120, 400 135, 390 180 L500 200 Z" fill="#22C55E"/>' +
            '<path d="M120 185 C170 180, 240 180, 300 185" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7"/>' +
            '<path d="M220 215 C270 210, 340 210, 400 215" stroke="#7DD3FC" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7"/>' +
          '</svg>'
        });
        frame.appendChild(bgBridge);
      } else if (theme === "house") {
        var bgHouse = util.el("div", { class: "assembly__backdrop-house", html:
          '<svg viewBox="0 0 500 250" preserveAspectRatio="none" width="100%" height="100%">' +
            '<defs>' +
              '<linearGradient id="shSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#BAE6FD"/><stop offset="100%" stop-color="#E0F2FE"/></linearGradient>' +
              '<linearGradient id="shGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4ADE80"/><stop offset="100%" stop-color="#15803D"/></linearGradient>' +
            '</defs>' +
            '<rect width="500" height="250" fill="url(#shSky)"/>' +
            '<circle cx="80" cy="45" r="26" fill="#FDE047" opacity="0.8"/>' +
            '<path d="M0 160 C120 145, 380 145, 500 160 L500 250 L0 250 Z" fill="url(#shGrass)"/>' +
            '<ellipse cx="140" cy="180" rx="6" ry="7" fill="#F43F5E"/>' +
            '<ellipse cx="360" cy="185" rx="6" ry="7" fill="#FACC15"/>' +
            '<ellipse cx="380" cy="190" rx="5" ry="6" fill="#38BDF8"/>' +
          '</svg>'
        });
        frame.appendChild(bgHouse);
      }

      frame.appendChild(util.el("div", { class: "assembly__base", text: r.frameLabel || "" }));

      r.slots.forEach(function (s) {
        var slot = util.el("div", { class: "build-slot", "data-id": s.id, text: s.label,
          role: "button", tabindex: "0", "aria-label": "Place " + s.label });
        slot.style.left = s.x + "%"; slot.style.top = s.y + "%";
        slot.style.width = s.w + "%"; slot.style.height = s.h + "%";
        tap.slot(slot);
        frame.appendChild(slot);
      });

      var pool = util.el("div", { class: "match__pool" });
      util.shuffle(r.slots).forEach(function (s) {
        var chipVisual = s.art ? '<div class="chip__art-preview">' + s.art + '</div>' : s.emoji;
        var chip = util.el("div", { class: "chip chip--assembly", "data-id": s.id, role: "button", tabindex: "0",
          "aria-pressed": "false", "aria-label": s.label,
          html: chipVisual + '<small>' + s.label + '</small>' });
        makeDraggable(chip, { onDrop: function (target) { return doPlace(chip, target && target.closest(".build-slot")); } });
        tap.chip(chip);
        pool.appendChild(chip);
      });

      wrapEl.appendChild(frame);
      wrapEl.appendChild(pool);
      stage.appendChild(wrapEl);

      // Single placement path shared by pointer-drag, tap and keyboard.
      function doPlace(chip, slot) {
        if (!chip || !slot) return false;
        var s = byId[chip.getAttribute("data-id")];
        if (slot.getAttribute("data-id") === chip.getAttribute("data-id") && !slot.classList.contains("filled")) {
          slot.classList.add("filled");
          slot.innerHTML = s.art || s.emoji;
          chip.remove(); placed++;
          Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(slot);
          Kido.audio.speak(s.label);
          if (placed === r.slots.length) {
            if (mistakes === 0) state.correct++;
            Kido.fx.toast("You built it!", "ok");

            if (theme === "bridge") {
              // Zoom cute toy car across newly built bridge!
              var car = util.el("div", { class: "bridge-crossing-car", html:
                '<svg viewBox="0 0 54 30" width="60" height="34">' +
                  '<ellipse cx="27" cy="27" rx="22" ry="3" fill="#000" opacity="0.35"/>' +
                  '<circle cx="12" cy="23" r="5" fill="#1E293B"/><circle cx="12" cy="23" r="2.2" fill="#FFFFFF"/>' +
                  '<circle cx="42" cy="23" r="5" fill="#1E293B"/><circle cx="42" cy="23" r="2.2" fill="#FFFFFF"/>' +
                  '<path d="M4 19 C4 14, 8 11, 14 11 L18 4 C20 2, 34 2, 36 4 L40 11 C46 11, 50 14, 50 19 L50 21 L4 21 Z" fill="#EF4444"/>' +
                  '<path d="M19 5 L26 5 L26 10 L15 10 Z" fill="#BAE6FD"/>' +
                  '<path d="M28 5 L35 5 L39 10 L28 10 Z" fill="#BAE6FD"/>' +
                  '<circle cx="48" cy="15" r="2" fill="#FEF08A"/>' +
                '</svg>'
              });
              car.style.position = "absolute";
              car.style.top = "24%";
              car.style.left = "-15%";
              car.style.zIndex = "10";
              car.style.transition = "left 1.5s cubic-bezier(.25,.1,.25,1)";
              frame.appendChild(car);
              setTimeout(function () {
                car.style.left = "105%";
                if (Kido.audio && Kido.audio.playCarHorn) Kido.audio.playCarHorn();
              }, 120);
            } else if (theme === "house") {
              frame.classList.add("house-built-celebrate");
              Kido.fx.sparkleEl(frame);
            }

            setTimeout(next, 2000);
          }
          return true;
        }
        mistakes++; Kido.audio.playIncorrectSound(); Kido.fx.shake(slot);
        return false;
      }
    }

    function next() {
      state.index++;
      if (state.index >= state.total) finish(spec, state.correct, state.total);
      else renderRound();
    }
  }

  /* ---------------- Accessible tap / keyboard placement ----------------
     Complements pointer drag on the match & assembly games. Pick a chip
     (tap, Enter or Space) then activate a slot to drop it there — so switch,
     keyboard and screen-reader users can play games that were drag-only.
     `attempt(chip, slot)` is the game's shared placement fn; returns true
     when the chip was consumed. One chip is "picked" at a time. */
  function stripTags(html) { return String(html == null ? "" : html).replace(/<[^>]*>/g, "").trim(); }

  function tapPlacement(attempt, opts) {
    var picked = null;
    var onPick = opts && opts.onPick;   // optional: told the picked chip (or null) so a game can show where it can go
    function clearPick() {
      var had = picked;
      if (picked) { picked.classList.remove("is-picked"); picked.setAttribute("aria-pressed", "false"); }
      picked = null;
      if (had && onPick) onPick(null);
    }
    function pick(chip) {
      if (!chip || !document.body.contains(chip)) return;
      if (picked === chip) { clearPick(); return; }   // tap the same chip again to put it back
      clearPick();
      picked = chip;
      chip.classList.add("is-picked");
      chip.setAttribute("aria-pressed", "true");
      Kido.audio.unlock();
      if (onPick) onPick(chip);
    }
    function drop(slot) {
      if (!picked) { Kido.fx.shake(slot); return; }    // nothing picked: gentle visual nudge, no penalty
      if (attempt(picked, slot)) clearPick();          // placed → release; wrong → keep it picked to retry
    }
    return {
      chip: function (chip) {
        chip.addEventListener("click", function () {
          if (chip.__dragMoved) { chip.__dragMoved = false; return; } // ignore the click that ends a drag
          pick(chip);
        });
        chip.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); pick(chip); }
        });
      },
      slot: function (slot) {
        slot.addEventListener("click", function () { drop(slot); });
        slot.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); drop(slot); }
        });
      }
    };
  }

  /* ---------------- Pointer-based drag & drop (touch + mouse) ---------------- */
  function makeDraggable(chip, handlers) {
    var ghost = null, activeTarget = null, startId = chip.getAttribute("data-id");

    chip.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      chip.__dragMoved = false;   // reset so tapPlacement can tell a tap from a drag-end click
      Kido.audio.unlock();
      chip.classList.add("dragging");
      ghost = chip.cloneNode(true);
      ghost.classList.add("ghost"); ghost.classList.remove("dragging");
      document.body.appendChild(ghost);
      moveGhost(e.clientX, e.clientY);
      chip.setPointerCapture(e.pointerId);
      chip.addEventListener("pointermove", onMove);
      chip.addEventListener("pointerup", onUp);
      chip.addEventListener("pointercancel", onUp);
    });

    function onMove(e) {
      chip.__dragMoved = true;    // any movement means this gesture is a drag, not a tap
      moveGhost(e.clientX, e.clientY);
      var t = elementUnder(e.clientX, e.clientY);
      var slot = t && t.closest(".slot, .build-slot");
      if (slot !== activeTarget) {
        if (activeTarget) activeTarget.classList.remove("over");
        activeTarget = slot;
        if (activeTarget) activeTarget.classList.add("over");
      }
    }
    function onUp(e) {
      var t = elementUnder(e.clientX, e.clientY);
      chip.classList.remove("dragging");
      if (activeTarget) activeTarget.classList.remove("over");
      var ok = handlers.onDrop(t);
      cleanup();
      if (!ok && ghostRefExists()) { /* chip stays in pool */ }
    }
    function ghostRefExists() { return true; }
    function moveGhost(x, y) { if (ghost) { ghost.style.left = x + "px"; ghost.style.top = y + "px"; } }
    function elementUnder(x, y) {
      if (ghost) ghost.style.display = "none";
      var el = document.elementFromPoint(x, y);
      if (ghost) ghost.style.display = "";
      return el;
    }
    function cleanup() {
      if (ghost) { ghost.remove(); ghost = null; }
      activeTarget = null;
      chip.removeEventListener("pointermove", onMove);
      chip.removeEventListener("pointerup", onUp);
      chip.removeEventListener("pointercancel", onUp);
    }
  }

  function updateDots(state) {
    var dots = document.querySelectorAll(".game__progress i");
    Array.prototype.forEach.call(dots, function (d, i) {
      d.className = i < state.index ? "done" : (i === state.index ? "current" : "");
    });
  }

  /* ---------------- public dispatch ---------------- */
  Kido.engine = {
    finish: finish,
    makeDraggable: makeDraggable,
    tapPlacement: tapPlacement,   // shared tap/keyboard drop path for activity-level drag games
    play: function (spec) {
      activeSpec = spec;
      switch (spec.type) {
        case "quiz": return playQuiz(spec);
        case "match": return playMatch(spec);
        case "soundboard": return playSoundboard(spec);
        case "order": return playOrder(spec);
        case "assembly": return playAssembly(spec);
        case "scene": return Kido.Scene.run(spec.sceneId, spec);
        default:
          if (spec.custom && typeof spec.custom === "function") return spec.custom(spec);
          console.warn("Unknown game type:", spec.type);
      }
    }
  };
})(window);
