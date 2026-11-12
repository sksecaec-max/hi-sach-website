/* =========================================================================
   miniGames.js — Arcade mini-games ("Game Zone")
   Five self-contained "custom" activities that reuse the shared finish/reward
   flow. Each renders into #screen and calls Kido.engine.finish(spec, ...).
   Nothing here punishes: a loss or a draw still earns a star and warm words,
   just like the rest of Kido.
   Games: ticTacToe | memory | shapeSorter | bubblePop | simon
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  Kido.activities = Kido.activities || {};

  function mount() { return document.getElementById("screen"); }
  function clear() { var m = mount(); m.innerHTML = ""; m.scrollTop = 0; return m; }
  function cfg() { return (Kido.age && Kido.age.cfg()) || { difficulty: 3, maxNumber: 6 }; }

  /* Shared arcade shell: a title, a live status line, and a stage to fill. */
  function shell(spec, title, hint) {
    var m = clear();
    var bgClass = (spec && spec.bg) ? spec.bg : ((spec && (spec.activityId === "memory-match" || spec.activityId === "memory")) ? "game--safari" : "");
    var wrap = U.el("div", { class: "game" + (bgClass ? " " + bgClass : "") });
    wrap.appendChild(U.el("div", { class: "game__head" }, [
      U.el("div", { class: "game__prompt", html: title }),
      U.el("div", { class: "arcade__status", id: "arc-status", text: hint || "" })
    ]));
    var stage = U.el("div", { class: "arcade" });
    wrap.appendChild(stage);
    m.appendChild(wrap);
    if (spec && spec.instruction) Kido.mascot.say(spec.instruction);
    return stage;
  }
  function status(msg) { var s = document.getElementById("arc-status"); if (s) s.textContent = msg; }

  /* Map an outcome to finish() args so stars never drop below 1 (kind by design):
     great -> 3 stars, good -> 2 stars, ok -> 1 star. */
  function reward(spec, quality) {
    if (quality === "great") return Kido.engine.finish(spec, 1, 1);
    if (quality === "good") return Kido.engine.finish(spec, 4, 5);
    return Kido.engine.finish(spec, 1, 4);
  }

  /* =============================== TIC-TAC-TOE =============================== */
  /* Child plays as kitty 🐱; friendly puppy 🐶 plays along with real portraits. */
  Kido.activities.ticTacToe = function (spec) {
    var stage = shell(spec, "🐱 Tic-Tac-Toe 🐶", "Tap a box. Get three in a row!");
    var HUMAN = "cat", CPU = "dog", over = false, finished = false;
    var board = new Array(9).fill(null);
    var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

    var grid = U.el("div", { class: "ttt" }), cells = [];
    for (var i = 0; i < 9; i++) (function (idx) {
      var cell = U.el("button", { class: "ttt__cell", "aria-label": "box " + (idx + 1) });
      cell.addEventListener("click", function () { humanMove(idx); });
      cells.push(cell); grid.appendChild(cell);
    })(i);
    stage.appendChild(grid);
    paint();

    function renderPiece(v) {
      if (!v) return "";
      if (Kido.creatures) {
        return Kido.creatures.render(v, { name: v === "cat" ? "Kitty" : "Puppy" });
      }
      return "<span>" + (v === "cat" ? "🐱" : "🐶") + "</span>";
    }

    function paint() {
      board.forEach(function (v, i) {
        cells[i].innerHTML = renderPiece(v);
        cells[i].disabled = !!v || over;
      });
    }
    function winner() {
      for (var i = 0; i < LINES.length; i++) {
        var L = LINES[i];
        if (board[L[0]] && board[L[0]] === board[L[1]] && board[L[1]] === board[L[2]]) return { who: board[L[0]], line: L };
      }
      return null;
    }
    function empties() { var e = []; board.forEach(function (v, i) { if (!v) e.push(i); }); return e; }
    function line2(mark) {   // return the winning/blocking cell for `mark`, or -1
      for (var i = 0; i < LINES.length; i++) {
        var L = LINES[i], vals = [board[L[0]], board[L[1]], board[L[2]]];
        if (vals.filter(function (v) { return v === mark; }).length === 2 && vals.indexOf(null) !== -1) return L[vals.indexOf(null)];
      }
      return -1;
    }
    function humanMove(idx) {
      if (over || board[idx]) return;
      Kido.audio.playTapSound(); board[idx] = HUMAN; paint();
      if (!endCheck()) setTimeout(cpuMove, 520);
    }
    function cpuMove() {
      if (over) return;
      var e = empties(); if (!e.length) return;
      var pick = -1;
      if (Math.random() < 0.5) pick = line2(CPU);                 // sometimes take the win
      if (pick < 0 && Math.random() < 0.4) pick = line2(HUMAN);   // sometimes block
      if (pick < 0) pick = e[(Math.random() * e.length) | 0];     // mostly just wander
      board[pick] = CPU; Kido.audio.playTapSound(); paint(); endCheck();
    }
    function endCheck() {
      var w = winner();
      if (w) {
        over = true; paint();
        w.line.forEach(function (i) { cells[i].classList.add("win"); });
        if (w.who === HUMAN) { status("You win! 🎉"); Kido.mascot.say("You did it! Three in a row! Amazing strategy!"); setTimeout(function () { done("great"); }, 1100); }
        else { status("Puppy got three! Good game 🐶"); Kido.mascot.say("Puppy got three! That was super fun, want to play another round?"); setTimeout(function () { done("ok"); }, 1100); }
        return true;
      }
      if (empties().length === 0) { over = true; status("It's a tie! 🤝"); Kido.mascot.say("Oh wow, a tie! You both played so well!"); setTimeout(function () { done("good"); }, 1100); return true; }
      return false;
    }
    function done(q) { if (finished) return; finished = true; reward(spec, q); }
  };

  /* =============================== MEMORY MATCH =============================== */
  Kido.activities.memory = function (spec) {
    spec = spec || {};
    spec.bg = "game--safari";
    spec.activityId = spec.activityId || "memory-match";
    var d = cfg().difficulty;
    var pairs = d <= 2 ? 3 : (d <= 4 ? 4 : (d <= 5 ? 5 : 6));
    // Prefer real registry art & photos so cards showcase gorgeous safari animals
    var reg = Kido.creatures;
    var animalList = (Kido.content && Kido.content.animals) || [];
    var art = animalList.filter(function (a) { return reg && (reg.has(a.key) || reg.hasArt(a.key)); });
    if (!art.length) art = animalList;
    var faces = U.sample(art, Math.min(pairs, art.length)).map(function (a) {
      return { id: a.key, html: reg ? reg.render(a.key, { name: a.name }) : a.name };
    });
    var deck = U.shuffle(faces.reduce(function (a, f) { return a.concat([f, f]); }, []));
    var stage = shell(spec, "🧠 Safari Memory Match", "Flip two cards. Find the animal pairs!");
    var grid = U.el("div", { class: "memory" });
    grid.style.gridTemplateColumns = "repeat(" + (pairs <= 3 ? 3 : 4) + ", 1fr)";
    grid.style.setProperty("--mem-cols", pairs <= 3 ? 3 : 4);   // the board's width follows its columns (QA 2026-11-11)
    var first = null, lock = false, found = 0, mistakes = 0;

    deck.forEach(function (face) {
      var card = U.el("button", { class: "mem-card", "aria-label": "card" }, [
        U.el("div", { class: "mem-card__inner" }, [
          U.el("div", { class: "mem-face mem-face--back", html: '<span class="mem-back-mark">❓</span>' }),
          U.el("div", { class: "mem-face mem-face--front", html: face.html })
        ])
      ]);
      card._id = face.id; card._done = false;
      card.addEventListener("click", function () { flip(card); });
      grid.appendChild(card);
    });
    stage.appendChild(grid);

    function flip(card) {
      if (lock || card._done || card.classList.contains("flipped")) return;
      Kido.audio.playTapSound();
      card.classList.add("flipped");
      if (!first) { first = card; return; }
      if (first === card) return;
      if (first._id === card._id) {
        first.classList.add("done"); card.classList.add("done");
        first._done = card._done = true;
        Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(card);
        first = null; found++;
        status(found + " of " + pairs + " pairs!");
        if (found === pairs) { Kido.fx.toast("All matched!", "ok"); Kido.mascot.say("Wow, what a memory!"); setTimeout(function () { Kido.engine.finish(spec, pairs, pairs + Math.floor(mistakes / 2)); }, 750); }
      } else {
        mistakes++; lock = true;
        Kido.audio.playIncorrectSound();
        var a = first, b = card; first = null;
        setTimeout(function () { a.classList.remove("flipped"); b.classList.remove("flipped"); lock = false; }, 850);
      }
    }
  };

  /* =============================== SHAPE SORTER =============================== */
  /* Drag each colourful shape onto its greyed silhouette hole. */
  Kido.activities.shapeSorter = function (spec) {
    var C = Kido.content, d = cfg().difficulty;
    var n = d <= 2 ? 3 : (d <= 4 ? 4 : 5);
    var picks = U.sample(C.shapes, n);
    var stage = shell(spec, "🔷 Shape Sorter", "Drag or tap each shape to its hole!");
    var placed = 0, mistakes = 0;
    var byId = {}; picks.forEach(function (s) { byId[s.key] = s; });
    var tap = Kido.engine.tapPlacement(doPlace);   // tap / keyboard / switch drop path

    var wrap = U.el("div", { class: "match" });
    var pool = U.el("div", { class: "match__pool" });
    var targets = U.el("div", { class: "match__targets" });

    picks.forEach(function (s) {
      var shapeArt = (Kido.creatures && Kido.creatures.hasArt(s.key)) ? Kido.creatures.render(s.key) : s.emoji;
      var slot = U.el("div", { class: "slot", "data-id": s.key,
        role: "button", tabindex: "0", "aria-label": "Hole for the " + s.name }, [
        U.el("div", { class: "slot__key shape-hole", html: shapeArt }),
        U.el("div", { class: "slot__drop", "data-id": s.key })
      ]);
      tap.slot(slot);
      targets.appendChild(slot);
    });
    U.shuffle(picks).forEach(function (s) {
      var shapeArt = (Kido.creatures && Kido.creatures.hasArt(s.key)) ? Kido.creatures.render(s.key) : s.emoji;
      var chip = U.el("div", { class: "chip", "data-id": s.key, role: "button", tabindex: "0",
        "aria-pressed": "false", "aria-label": s.name, html: shapeArt });   // QA 2026-11-10: no name under the shape (it gave the answer away; the name is spoken on a match)
      Kido.engine.makeDraggable(chip, { onDrop: function (target) { return doPlace(chip, target && target.closest(".slot")); } });
      tap.chip(chip);
      pool.appendChild(chip);
    });
    wrap.appendChild(pool); wrap.appendChild(targets);
    stage.appendChild(wrap);

    // Single placement path shared by pointer-drag, tap and keyboard.
    function doPlace(chip, slot) {
      if (!chip || !slot) return false;
      var s = byId[chip.getAttribute("data-id")];
      if (slot.getAttribute("data-id") === chip.getAttribute("data-id") && !slot.classList.contains("filled")) {
        slot.classList.add("filled");
        var key = slot.querySelector(".slot__key"); if (key) key.classList.remove("shape-hole");
        var shapeArt = (Kido.creatures && Kido.creatures.hasArt(s.key)) ? Kido.creatures.render(s.key) : s.emoji;
        slot.querySelector(".slot__drop").innerHTML = shapeArt;
        chip.remove(); placed++;
        Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(slot); Kido.audio.speak(s.name);
        status(placed + " of " + picks.length + " sorted!");
        if (placed === picks.length) { Kido.fx.toast("All sorted!", "ok"); Kido.mascot.say("Perfect sorting!"); setTimeout(function () { Kido.engine.finish(spec, placed, placed + mistakes); }, 700); }
        return true;
      }
      mistakes++; Kido.audio.playIncorrectSound(); Kido.fx.shake(slot);
      return false;
    }
  };

  /* =============================== BUBBLE POP (falling bubbles) =============================== */
  var BUBBLE_TARGETS = [
    { emoji: "⭐", name: "Star" },
    { emoji: "🍎", name: "Apple" },
    { emoji: "🎈", name: "Balloon" },
    { emoji: "🦋", name: "Butterfly" },
    { emoji: "🚗", name: "Car" },
    { emoji: "🌸", name: "Flower" },
    { emoji: "🧸", name: "Teddy" },
    { emoji: "⚽", name: "Ball" },
    { emoji: "🚀", name: "Rocket" }
  ];
  function plural(name) { return /s$/.test(name) ? name : /[^aeiou]y$/.test(name) ? name.slice(0, -1) + "ies" : name + "s"; }   // Butterflies
  // Every line Bubble Pop glues together, recorded by scripts/voice/harvest.js (else: the device voice).
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    return BUBBLE_TARGETS.reduce(function (out, t) {
      out.push("Pop every " + t.name + " falling from the sky!", "Look at the sky! Pop every " + t.name + "!",
        "Oops! Find the " + t.name + "!", "You popped all the " + plural(t.name) + "! Wonderful!");
      return out;
    }, []);
  });

  Kido.activities.bubblePop = function (spec) {
    var TARGETS = BUBBLE_TARGETS;

    var ALL_OBJECTS = [
      "⭐", "🍎", "🎈", "🦋", "🚗", "🌸", "🧸", "⚽", "🚀",
      "🍓", "🍌", "🍬", "🍩", "🍦", "🐥", "🐞", "🐶", "🐱",
      "🌻", "🌈", "💎", "🍇", "🍊", "🍄", "🍉", "🐬"
    ];

    var picked = U.pick(TARGETS);
    var targetEmoji = picked.emoji;
    var targetName = picked.name;
    var distractorsPool = ALL_OBJECTS.filter(function (e) { return e !== targetEmoji; });

    var targetGoal = Math.max(4, Math.min(6, cfg().maxNumber));
    var stage = shell(spec, "🫧 Bubble Pop", "Pop every " + targetEmoji + " " + targetName + "! (0 of " + targetGoal + " popped)");
    var field = U.el("div", { class: "bubble-field" });
    field.appendChild(U.el("div", { class: "bubble-field__clouds" }));
    field.appendChild(U.el("div", { class: "bubble-field__grass" }));
    stage.appendChild(field);

    var popped = 0, mistakes = 0;
    var running = true;
    var bubbles = [];

    // Distinct lanes across the field width for natural, organic distribution
    var LANES = [7, 19, 31, 43, 55, 67, 79, 89];
    var TOTAL_BUBBLES = 11; // 3 target bubbles + 8 varied distractors simultaneously on screen
    var TARGET_ON_SCREEN = 3;

    // Build the initial 11 bubbles with a rich mix of objects scattered across the sky
    for (var i = 0; i < TOTAL_BUBBLES; i++) {
      var isTarget = (i < TARGET_ON_SCREEN);
      var emoji = isTarget ? targetEmoji : U.pick(distractorsPool);

      // Stagger Y so bubbles are already visibly distributed falling in the sky!
      var startY = (i * 65) % 360 - (i >= 6 ? 130 : 0);

      createBubble(isTarget, emoji, startY, LANES[i % LANES.length]);
    }

    function createBubble(isTarget, emoji, startY, lanePct) {
      var itemHtml = (Kido.creatures && (Kido.creatures.hasArt(emoji) || Kido.creatures.keyForEmoji(emoji)))
        ? Kido.creatures.render(emoji)
        : ('<span class="bubble__emoji">' + emoji + '</span>');
      var b = U.el("div", {
        class: "bubble",
        role: "button",
        tabindex: "0",
        "aria-label": isTarget ? ("Pop the " + targetName) : ("Bubble with " + emoji)
      }, [
        U.el("span", { class: "bubble__content", html: itemHtml })
      ]);

      var bObj = {
        el: b,
        isTarget: isTarget,
        emoji: emoji,
        y: startY !== undefined ? startY : (-90 - Math.random() * 80),
        lanePercent: lanePct !== undefined ? lanePct : (6 + Math.random() * 84),
        speed: 68 + Math.random() * 24, // gentle, toddler-friendly float down (~70-92px/s)
        swayAmp: 10 + Math.random() * 12,
        swayFreq: 1.2 + Math.random() * 0.8,
        swayPhase: Math.random() * Math.PI * 2,
        popped: false
      };

      var popAction = function (e) {
        if (e) e.preventDefault();
        if (bObj.popped || !running) return;

        if (bObj.isTarget) {
          bObj.popped = true;
          b.classList.add("pop");

          // Expanding ripple ring
          var ring = U.el("div", { class: "bubble-ring" });
          ring.style.left = (b.offsetLeft + 43) + "px";
          ring.style.top = (b.offsetTop + 43) + "px";
          field.appendChild(ring);
          setTimeout(function () { ring.remove(); }, 400);

          Kido.audio.playCorrectSound();
          Kido.fx.sparkleEl(b);
          popped++;
          status("Pop every " + targetEmoji + " " + targetName + "! (" + popped + " of " + targetGoal + " popped) ✨");
          Kido.audio.speak(String(popped));

          if (popped >= targetGoal) {
            running = false;
            status("All " + targetGoal + " " + targetEmoji + " " + plural(targetName) + " popped! 🎉");
            Kido.fx.toast("All popped! 🎉", "ok");
            Kido.mascot.say("You popped all the " + plural(targetName) + "! Wonderful!");
            setTimeout(function () {
              // Pop remaining bubbles with celebration
              bubbles.forEach(function (ob) {
                if (!ob.popped) { ob.popped = true; ob.el.classList.add("pop"); }
              });
              Kido.engine.finish(spec, targetGoal, targetGoal + mistakes);
            }, 850);
          } else {
            // Respawn a new target bubble from the top after 450ms so targets keep floating down
            setTimeout(function () {
              if (running) {
                bObj.popped = false;
                b.classList.remove("pop");
                bObj.y = -95 - Math.random() * 60;
                bObj.lanePercent = LANES[Math.floor(Math.random() * LANES.length)] + (Math.random() * 6 - 3);
                bObj.isTarget = true;
                bObj.emoji = targetEmoji;
                var cnt = b.querySelector(".bubble__content");
                if (cnt) cnt.textContent = targetEmoji;
              }
            }, 500);
          }
        } else {
          // Distractor tapped
          mistakes++;
          Kido.audio.playIncorrectSound();
          b.classList.remove("wobble");
          void b.offsetWidth;
          b.classList.add("wobble");
          setTimeout(function () { b.classList.remove("wobble"); }, 400);
          Kido.mascot.say("Oops! Find the " + targetName + "!");
        }
      };

      b.addEventListener("pointerdown", popAction);
      b.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") popAction(e);
      });

      field.appendChild(b);
      bubbles.push(bObj);
    }

    // 60fps smooth float loop
    var lastTime = performance.now();
    var animId = null;

    function tick(now) {
      if (!running || !field.isConnected) {
        if (animId) cancelAnimationFrame(animId);
        return;
      }
      var dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      var fieldH = field.clientHeight || 450;
      var fieldW = field.clientWidth || 800;

      bubbles.forEach(function (bObj) {
        if (bObj.popped) return;
        bObj.y += bObj.speed * dt;
        var sway = Math.sin((now / 1000) * bObj.swayFreq + bObj.swayPhase) * bObj.swayAmp;
        var posX = (bObj.lanePercent / 100) * (fieldW - 96) + sway;
        posX = Math.max(8, Math.min(fieldW - 96, posX));

        bObj.el.style.left = posX.toFixed(1) + "px";
        bObj.el.style.top = bObj.y.toFixed(1) + "px";

        // When a bubble floats past the bottom of the field:
        if (bObj.y > fieldH + 15) {
          // Recycle back to above the top
          bObj.y = -95 - Math.random() * 80;
          bObj.lanePercent = LANES[Math.floor(Math.random() * LANES.length)] + (Math.random() * 6 - 3);

          // If it was a distractor, pick a fresh new random object from the pool!
          if (!bObj.isTarget) {
            bObj.emoji = U.pick(distractorsPool);
            var content = bObj.el.querySelector(".bubble__content");
            if (content) content.textContent = bObj.emoji;
          }
        }
      });

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    setTimeout(function () {
      Kido.audio.speak("Pop every " + targetName + " falling from the sky!");
      Kido.mascot.say("Look at the sky! Pop every " + targetName + "!");
    }, 450);
  };

  /* =============================== BEAT (Rainbow Piano Memory) =============================== */
  Kido.activities.simon = function (spec) {
    // 8-key rainbow diatonic piano (C4 to C5 octave)
    var PIANO_KEYS = [
      { k: "c4", note: "C", solfege: "Do", freq: 261.63, keynum: "1", hotkey: "a" },
      { k: "d4", note: "D", solfege: "Re", freq: 293.66, keynum: "2", hotkey: "s" },
      { k: "e4", note: "E", solfege: "Mi", freq: 329.63, keynum: "3", hotkey: "d" },
      { k: "f4", note: "F", solfege: "Fa", freq: 349.23, keynum: "4", hotkey: "f" },
      { k: "g4", note: "G", solfege: "Sol", freq: 392.00, keynum: "5", hotkey: "g" },
      { k: "a4", note: "A", solfege: "La", freq: 440.00, keynum: "6", hotkey: "h" },
      { k: "b4", note: "B", solfege: "Ti", freq: 493.88, keynum: "7", hotkey: "j" },
      { k: "c5", note: "C", solfege: "Do", freq: 523.25, keynum: "8", hotkey: "k" }
    ];

    var target = Math.min(6, 3 + Math.ceil(cfg().difficulty / 2));  // sequence length to reach
    var stage = shell(spec, "🎵 Copy the Beat", "Watch, listen, then tap the piano keys!");
    var pad = {}, seq = [], step = 0, mistakes = 0, accepting = false, finished = false;

    var pianoChassis = U.el("div", { class: "piano-chassis" });
    var pianoHeader = U.el("div", { class: "piano-header" }, [
      U.el("div", { class: "piano-speaker piano-speaker--left" }),
      U.el("div", { class: "piano-brand", html: "🎹 <span>Rainbow Piano</span>" }),
      U.el("div", { class: "piano-speaker piano-speaker--right" })
    ]);
    pianoChassis.appendChild(pianoHeader);

    // Visual sequence tracker dots
    var tracker = U.el("div", { class: "piano-tracker" });
    pianoChassis.appendChild(tracker);

    function updateTracker() {
      tracker.innerHTML = "";
      for (var s = 0; s < seq.length; s++) {
        var dot = U.el("div", {
          class: "piano-dot" + (s < step ? " done" : (s === step && accepting ? " active" : ""))
        });
        dot.textContent = s < step ? "⭐" : "🎵";
        tracker.appendChild(dot);
      }
    }

    // Piano keybed with all 8 piano keys
    var keysBed = U.el("div", { class: "piano-bed" });
    PIANO_KEYS.forEach(function (p) {
      var el = U.el("button", {
        class: "piano-key piano-key--" + p.k,
        "aria-label": "Piano key " + p.note + " (" + p.solfege + ")",
        tabindex: "0"
      }, [
        U.el("div", { class: "piano-key__top-reflect" }),
        U.el("div", { class: "piano-key__info" }, [
          U.el("span", { class: "piano-key__note", text: p.note }),
          U.el("span", { class: "piano-key__solfege", text: p.solfege })
        ])
      ]);

      el.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        tap(p);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          tap(p);
        }
      });
      pad[p.k] = el;
      keysBed.appendChild(el);
    });
    pianoChassis.appendChild(keysBed);
    stage.appendChild(pianoChassis);

    // Keyboard support (1-8 and A-K)
    function onKey(e) {
      if (!accepting || !stage.isConnected) return;
      var match = PIANO_KEYS.find(function (pk) {
        return pk.keynum === e.key || pk.hotkey === e.key.toLowerCase();
      });
      if (match) tap(match);
    }
    U.onWhile(stage, window, "keydown", onKey);

    grow();

    function floatNote(keyEl) {
      var symbols = ["♪", "♫", "♬", "✨", "🎵"];
      var noteEl = U.el("div", { class: "piano-floating-note", text: U.pick(symbols) });
      keyEl.appendChild(noteEl);
      setTimeout(function () { noteEl.remove(); }, 600);
    }

    function light(p, on) {
      var el = pad[p.k];
      if (!el) return;
      el.classList.toggle("lit", on);
      if (on) floatNote(el);
    }

    function playback() {
      accepting = false;
      step = 0;
      updateTracker();
      status("Listen to the piano… 🎶");
      var i = 0;
      (function nextNote() {
        if (!stage.isConnected) return;
        if (i >= seq.length) {
          accepting = true;
          updateTracker();
          status("Your turn! Tap the keys! 🎹");
          return;
        }
        var p = seq[i++];
        light(p, true);
        Kido.audio.tone(p.freq, 0.42, "sine");
        setTimeout(function () {
          light(p, false);
          setTimeout(nextNote, 220);
        }, 450);
      })();
    }

    function grow() {
      seq.push(PIANO_KEYS[(Math.random() * PIANO_KEYS.length) | 0]);
      updateTracker();
      status("Round " + seq.length + " of " + target);
      setTimeout(playback, 650);
    }

    function tap(p) {
      if (!accepting || !stage.isConnected) return;
      Kido.audio.tone(p.freq, 0.32, "sine");
      light(p, true);
      setTimeout(function () { light(p, false); }, 220);

      if (seq[step] && seq[step].k === p.k) {
        step++;
        updateTracker();
        if (step === seq.length) {
          accepting = false;
          if (seq.length >= target) {
            status("Amazing pianist! You copied the beat! 🎉");
            Kido.mascot.say("Wow! You copied the whole melody on the piano!");
            window.removeEventListener("keydown", onKey);
            if (!finished) {
              finished = true;
              setTimeout(function () { reward(spec, mistakes <= 1 ? "great" : "good"); }, 900);
            }
          } else {
            Kido.fx.toast("Sweet melody! 🎵", "ok");
            grow();
          }
        }
      } else {
        mistakes++;
        accepting = false;
        Kido.audio.playIncorrectSound();
        Kido.fx.shake(pad[p.k]);
        Kido.mascot.say("Oops! Listen to the piano again.");
        setTimeout(playback, 850);
      }
    }
  };

  /* =============================== SHADOW MATCH =============================== */
  /* Drag each animal onto its matching shadow (a dark silhouette). A correct
     match lights the shadow up into the real animal and plays its actual call
     (Kido.audio.playAnimalSound -> the live synth). Nothing punishes: a wrong
     drop just shakes and the animal stays in the tray to try again. */
  Kido.activities.shadowMatch = function (spec) {
    var C = Kido.content;
    // One art source: registry SVG when the species has authored art (the shadow
    // container's brightness(0) filter darkens it into the silhouette, and lifts
    // on reveal), else the honest emoji fallback. Guarded so non-art species stay.
    // 2026-11-03: cards show the animal's DRAWING, the same picture its shadow is made from, so the outlines match
    // (a photo with its background can't be turned into a matching shadow).
    function art(a) {
      var d = Kido.creatures && Kido.creatures.drawing && Kido.creatures.drawing(a.key);
      if (d) return '<span class="kido-creature" data-creature="' + a.key + '" role="img" aria-label="' + a.name + '">' + d + "</span>";
      return (Kido.creatures && Kido.creatures.hasArt(a.key)) ? Kido.creatures.render(a.key, { name: a.name }) : a.emoji;
    }
    var per = cfg().rounds <= 2 ? 2 : cfg().difficulty <= 1 ? 3 : cfg().difficulty <= 2 ? 4 : (cfg().difficulty <= 4 ? 6 : 8);   // 2-3: 2, 3-4: 3, 4-5: 4
    var roster = U.shuffle(C.animals.slice());          // ALL animals — drag each to its shadow
    var chunks = [];
    for (var i = 0; i < roster.length; i += per) chunks.push(roster.slice(i, i + per));
    var stage = shell(spec, "🐾 Shadow Match", "Drag or tap each animal onto its shadow!");
    stage.classList.add("shadow-stage");
    var scrollIdx = 0, total = 0, mistakes = 0, finished = false;

    var board = U.el("div", { class: "shadow-board" });
    stage.appendChild(board);
    renderScroll();
    setTimeout(function () { Kido.audio.speak("Drag or tap each animal to its shadow."); }, 450);

    function clampPct(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function renderScroll() {
      var chunk = chunks[scrollIdx], placed = 0;
      var byId = {}; chunk.forEach(function (a) { byId[a.key] = a; });
      var tap = Kido.engine.tapPlacement(doPlace);   // tap / keyboard / switch drop path
      board.innerHTML = "";
      var scroll = U.el("div", { class: "shadow-scroll anim-scroll-in" });
      var pool = U.el("div", { class: "match__pool shadow-tray" });

      // Scatter the shadows (drop targets) across the parchment, like the video.
      var n = chunk.length, cols = n <= 4 ? 2 : (n <= 6 ? 3 : 4), rows = Math.ceil(n / cols);
      chunk.forEach(function (a, i) {
        var col = i % cols, row = (i / cols) | 0;
        var cx = (col + 0.5) / cols * 100, cy = (row + 0.5) / rows * 100;
        var spot = U.el("div", { class: "slot shadow-spot", "data-id": a.key,
          role: "button", tabindex: "0", "aria-label": "Shadow — drop its animal here" }, [
          U.el("div", { class: "shadow-sil", html: Kido.creatures ? Kido.creatures.silhouette(a.key) : a.emoji })
        ]);
        // a little scatter, never enough for two shadows to touch (Change #28: was up to a third of a cell)
        spot.style.left = clampPct(cx + (Math.random() * 2 - 1) * (10 / cols), 10, 90) + "%";
        spot.style.top = clampPct(cy + (Math.random() * 2 - 1) * (8 / rows), 14, 82) + "%";
        tap.slot(spot);
        scroll.appendChild(spot);
      });

      // Colourful animals — draggable AND tap/keyboard selectable; shuffled so none sits on its own shadow.
      U.shuffle(chunk.slice()).forEach(function (a) {
        var chip = U.el("div", { class: "chip", "data-id": a.key, role: "button", tabindex: "0",
          "aria-pressed": "false", "aria-label": a.name, html: art(a) });   // QA 2026-11-10: no name under the animal (redundant; spoken on a match)
        Kido.engine.makeDraggable(chip, { onDrop: function (target) { return doPlace(chip, target && target.closest(".shadow-spot")); } });
        tap.chip(chip);
        pool.appendChild(chip);
      });

      board.appendChild(scroll); board.appendChild(pool);

      // Single placement path shared by pointer-drag, tap and keyboard (per-chunk).
      function doPlace(chip, slot) {
        if (!chip || !slot) return false;
        var a = byId[chip.getAttribute("data-id")];
        if (slot.getAttribute("data-id") === chip.getAttribute("data-id") && !slot.classList.contains("filled")) {
          slot.classList.add("filled");
          var sil = slot.querySelector(".shadow-sil");
          if (sil) { sil.classList.remove("shadow-sil"); sil.classList.add("shadow-reveal", "anim-reveal"); sil.innerHTML = art(a); }
          chip.remove(); placed++; total++;
          Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(slot);
          setTimeout(function () { Kido.audio.playAnimalSound(a.key, a.name); }, 220);
          status(total + " of " + roster.length + " found!");
          if (placed === chunk.length) advance();
          return true;
        }
        mistakes++; Kido.audio.playIncorrectSound(); Kido.fx.shake(slot);
        return false;
      }
    }

    function advance() {
      if (total >= roster.length) {
        Kido.fx.toast("All matched!", "ok"); Kido.mascot.say("You matched every animal to its shadow!");
        setTimeout(function () { if (!finished) { finished = true; Kido.engine.finish(spec, total, total + mistakes); } }, 950);
      } else {
        Kido.fx.toast("Great finding!", "ok"); Kido.mascot.say("More animals! Find their shadows.");
        scrollIdx++; setTimeout(renderScroll, 850);
      }
    }
  };

})(window);
