/* =========================================================================
   thinkLab5.js — Think Lab batch 5 (content: js/data/thinkLab.js)
     Kido.activities.momoCare(spec)     Momo's Breakfast — look after Momo: each need is filled by a small puzzle
                                         (food: find the different one · bath: pop bubbles in order · bed: routine order)
     Kido.activities.stickerWorld(spec) Sticker World    — free play: put real animal stickers in a scene, tap to hear them
   Generators are pure (Kido.thinkLab.gen5) and checked by scripts/thinklab-check.mjs.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var T = Kido.thinkLab;
  Kido.activities = Kido.activities || {};

  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------------- Momo's Breakfast generators ---------------- */
  /** Four plates: three alike and one different (by kind, or for older children by colour). fruits: [{key, color}] */
  function foodRound(d, fruits, rnd) {
    rnd = rnd || Math.random;
    var byColour = d >= 4;
    for (var attempt = 0; attempt < 100; attempt++) {
      var odd, same;
      if (!byColour) {
        var pair = shuffle(fruits, rnd).slice(0, 2); same = [pair[0], pair[0], pair[0]]; odd = pair[1];
      } else {
        var coloured = fruits.filter(function (f) { return f.color; });   // only fruits with a clear colour take part
        var groups = {}; coloured.forEach(function (f) { (groups[f.color] = groups[f.color] || []).push(f); });
        var big = Object.keys(groups).filter(function (c) { return groups[c].length >= 3; });
        if (!big.length) { byColour = false; continue; }
        var col = big[(rnd() * big.length) | 0];
        same = shuffle(groups[col], rnd).slice(0, 3);
        var others = coloured.filter(function (f) { return f.color !== col; });
        odd = others[(rnd() * others.length) | 0];
      }
      var plates = shuffle(same.concat([odd]), rnd);
      return { plates: plates, odd: plates.indexOf(odd), byColour: byColour };
    }
    return null;
  }
  function bubbleRound(d, rnd) {
    rnd = rnd || Math.random;
    var n = T.care.bubbles(d), spots = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) spots.push([14 + c * 24, 18 + r * 30]);
    return shuffle(spots, rnd).slice(0, n).map(function (p, i) { return { n: i + 1, x: p[0] + (rnd() * 8 - 4), y: p[1] + (rnd() * 8 - 4) }; });
  }
  function sleepRound(d, rnd) {
    rnd = rnd || Math.random;
    var order = T.care.routine(d);
    return { order: order, shown: shuffle(order, rnd) };
  }
  T.gen5 = { foodRound: foodRound, bubbleRound: bubbleRound, sleepRound: sleepRound };

  /** Every fixed line batch 5 can say (for scripts/voice/harvest.js). */
  T.lines5 = function () {
    var C = T.care, S = T.stickers;
    var out = [C.hello, C.food, C.foodColour, C.same, C.sleep, C.full, C.done, S.hello, S.move].concat(C.yum, C.clean, C.sleepy, S.done);
    for (var n = 1; n <= 9; n++) out.push(C.bath(n), C.next(n), String(n));
    var habits = {}; (Kido.content && Kido.content.habits || []).forEach(function (h) { habits[h.key] = h.name; });
    ["toys", "bath", "brush", "sleep"].forEach(function (k) { if (habits[k]) out.push(C.first(habits[k].toLowerCase()), habits[k]); });
    return out.filter(function (s, i) { return out.indexOf(s) === i; });
  };

  function cfg() { return (Kido.age && Kido.age.cfg()) || { difficulty: 3, rounds: 5 }; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function shell(cls, title) {
    var m = document.getElementById("screen"); m.innerHTML = ""; m.scrollTop = 0;
    var game = U.el("div", { class: "game tl-game " + cls });
    var prompt = U.el("div", { class: "game__prompt", html: title }), status = U.el("div", { class: "arcade__status" });
    game.appendChild(U.el("div", { class: "game__head" }, [prompt, status]));
    var stage = U.el("div", { class: "tl-stage" });
    game.appendChild(stage); m.appendChild(game);
    return { game: game, prompt: prompt, status: status, stage: stage, alive: function () { return game.isConnected; } };
  }
  function photo(k) { var c = Kido.creatures.get(k); return (c && c.img) || ""; }
  function nameOf(k) { var c = Kido.creatures.get(k); return (c && c.name) || k; }

  /* =============================== MOMO'S BREAKFAST =============================== */
  Kido.activities.momoCare = function (spec) {
    var d = cfg().difficulty, C = T.care, per = C.perNeed(d), clean = 0, tasks = 0;
    var ui = shell("tl-care", "🧸 Momo's Breakfast");
    var room = U.el("div", { class: "mc-room" }), task = U.el("div", { class: "mc-task" });
    ui.stage.appendChild(room); ui.stage.appendChild(task);
    var momo = Kido.Characters.create("momo", { size: 120, className: "mc-momo" });
    var needs = { food: 0, bath: 0, sleep: 0 }, ICON = { food: "🍎", bath: "🛁", sleep: "🌙" };
    var bar = U.el("div", { class: "mc-needs" });
    room.appendChild(momo.el); room.appendChild(bar);
    var fruits = C.fruits.map(function (k) { return { key: k, color: C.colour[k] || null }; }).filter(function (f) { return photo(f.key); });
    var habits = {}; (Kido.content.habits || []).forEach(function (h) { habits[h.key] = h; });

    function paintNeeds() {
      bar.innerHTML = "";
      Object.keys(needs).forEach(function (k) {
        var full = needs[k] >= per;
        var b = U.el("button", { class: "mc-need" + (full ? " is-full" : ""), "aria-label": k, html: '<span class="mc-need__icon">' + ICON[k] + '</span><span class="mc-meter"><i style="width:' + (needs[k] / per * 100) + '%"></i></span>' });
        b.addEventListener("click", function () { open(k); });
        bar.appendChild(b);
      });
      var done = Object.keys(needs).filter(function (k) { return needs[k] >= per; }).length;
      ui.status.textContent = done + " / 3";
      momo.set(done === 3 ? "celebrating" : done ? "happy" : "sad");
    }
    var openSeq = 0;                                                     // bumps when a puzzle opens
    function open(k) {
      Kido.audio.unlock(); openSeq++;
      if (needs[k] >= per) { Kido.audio.speak(C.full); return; }
      bar.querySelectorAll(".mc-need").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("aria-label") === k); });
      ({ food: food, bath: bath, sleep: sleep })[k]();
    }
    function solved(k, firstTry, lines) {
      tasks++; if (firstTry) clean++;
      needs[k]++;
      task.innerHTML = "";
      momo.set("excited").pose("jump");
      Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(momo.el);
      paintNeeds();
      var mySeq = openSeq;
      Promise.resolve(Kido.audio.speak(U.pick(lines))).then(function () {
        if (!ui.alive()) return;
        var allFull = Object.keys(needs).every(function (n) { return needs[n] >= per; });
        if (!allFull && openSeq !== mySeq) return;                     // the child already opened another puzzle
        if (Object.keys(needs).every(function (n) { return needs[n] >= per; })) {
          Kido.fx.confetti(50);
          Promise.resolve(Kido.audio.speak(C.done)).then(function () { return wait(400); }).then(function () { if (ui.alive()) Kido.engine.finish(spec, clean, tasks); });
        } else if (needs[k] < per) open(k);                       // keep going on the same need until it is full
        else task.innerHTML = '<div class="mc-pick">' + Object.keys(needs).filter(function (n) { return needs[n] < per; }).map(function (n) { return ICON[n]; }).join(" ") + "</div>";
      });
    }

    function food() {
      var rd = foodRound(d, fruits), tries = 0;
      task.__rd = rd;                                                   // read by automated checks only
      task.innerHTML = '<div class="mc-plates"></div>';
      var wrap = task.querySelector(".mc-plates");
      rd.plates.forEach(function (f, i) {
        var b = U.el("button", { class: "mc-plate", "aria-label": nameOf(f.key), html: '<img src="' + photo(f.key) + '" alt="" draggable="false"/>' });
        b.addEventListener("click", function () {
          if (b.classList.contains("is-wrong")) return;
          if (i === rd.odd) { b.classList.add("is-eaten"); setTimeout(function () { solved("food", !tries, C.yum); }, 350); return; }
          tries++; b.classList.add("is-wrong"); Kido.fx.shake(b); Kido.audio.playIncorrectSound(); Kido.audio.speak(C.same);
        });
        wrap.appendChild(b);
      });
      Kido.audio.speak(rd.byColour ? C.foodColour : C.food);
    }
    function bath() {
      var bubbles = bubbleRound(d), next = 1, tries = 0;
      task.innerHTML = '<div class="mc-tub"></div>';
      var tub = task.querySelector(".mc-tub");
      bubbles.forEach(function (bb) {
        var b = U.el("button", { class: "mc-bubble", "aria-label": String(bb.n), html: "<span>" + bb.n + "</span>" });
        b.style.left = bb.x + "%"; b.style.top = bb.y + "%";
        b.addEventListener("click", function () {
          if (b.classList.contains("is-popped")) return;
          if (bb.n === next) {
            b.classList.add("is-popped"); Kido.audio.cue ? Kido.audio.cue("fx.pop") : null; Kido.audio.speak(String(bb.n));
            if (++next > bubbles.length) setTimeout(function () { solved("bath", !tries, C.clean); }, 400);
          } else { tries++; Kido.fx.shake(b); Kido.audio.playIncorrectSound(); Kido.audio.speak(C.next(next)); }
        });
        tub.appendChild(b);
      });
      Kido.audio.speak(C.bath(bubbles.length));
    }
    function sleep() {
      var rd = sleepRound(d), at = 0, tries = 0;
      task.innerHTML = '<div class="mc-steps"></div>';
      var wrap = task.querySelector(".mc-steps");
      rd.shown.forEach(function (k) {
        var h = habits[k] || { name: k };
        var b = U.el("button", { class: "mc-step", "aria-label": h.name, html: (h.img ? '<img src="' + h.img + '" alt="" draggable="false"/>' : "") + "<span>" + h.name + "</span><b class=\"mc-step__n\"></b>" });
        b.addEventListener("click", function () {
          if (b.classList.contains("is-done")) return;
          if (k === rd.order[at]) {
            at++; b.classList.add("is-done"); b.querySelector(".mc-step__n").textContent = at; Kido.audio.speak(h.name);
            if (at === rd.order.length) setTimeout(function () { solved("sleep", !tries, C.sleepy); }, 500);
          } else {
            tries++; Kido.fx.shake(b); Kido.audio.playIncorrectSound();
            Kido.audio.speak(C.first((habits[rd.order[at]] || { name: rd.order[at] }).name.toLowerCase()));
          }
        });
        wrap.appendChild(b);
      });
      Kido.audio.speak(C.sleep);
    }
    paintNeeds();
    task.innerHTML = '<div class="mc-pick">' + ICON.food + " " + ICON.bath + " " + ICON.sleep + "</div>";
    Kido.audio.speak(C.hello);
  };

  /* =============================== STICKER WORLD =============================== */
  Kido.activities.stickerWorld = function (spec) {
    var S = T.stickers, sceneKey = "farm", placed = 0;
    var ui = shell("tl-stickers", "🖼️ Sticker World");
    var scene = U.el("div", { class: "sw-scene sw-scene--farm" }), bin = U.el("div", { class: "sw-bin", "aria-label": "Bin", html: "🗑️" });
    var side = U.el("div", { class: "sw-side" }), pick = U.el("div", { class: "sw-scenes" }), tray = U.el("div", { class: "sw-tray" });
    var done = U.el("button", { class: "cs-done sw-done", html: "Done ✓" });
    scene.appendChild(bin);
    side.appendChild(pick); side.appendChild(tray); side.appendChild(done);
    ui.stage.appendChild(scene); ui.stage.appendChild(side);
    var AM = Kido.AudioManager;

    Object.keys(S.scenes).forEach(function (k) {
      var b = U.el("button", { class: "sw-scene-btn" + (k === sceneKey ? " is-on" : ""), "aria-label": S.scenes[k].label, html: S.scenes[k].icon });
      b.addEventListener("click", function () {
        sceneKey = k; scene.className = "sw-scene sw-scene--" + k;
        scene.querySelectorAll(".sw-sticker").forEach(function (s) { s.remove(); });
        pick.querySelectorAll(".is-on").forEach(function (e) { e.classList.remove("is-on"); }); b.classList.add("is-on");
        fillTray(); Kido.audio.speak(S.scenes[k].label);
      });
      pick.appendChild(b);
    });
    function fillTray() {
      tray.innerHTML = "";
      S.scenes[sceneKey].animals.filter(photo).forEach(function (k) {
        var b = U.el("button", { class: "sw-tray-item", "aria-label": nameOf(k), html: '<img src="' + photo(k) + '" alt="" draggable="false"/>' });
        b.addEventListener("click", function () { drop(k); });
        tray.appendChild(b);
      });
    }
    function sound(k) {
      var g = Kido.creatures.group ? Kido.creatures.group(k) : "animals";
      if (AM && AM.play && /birds|animals/.test(g)) AM.play(g, k);
      setTimeout(function () { Kido.audio.speak(nameOf(k)); }, 900);
    }
    function drop(k) {
      Kido.audio.unlock();
      var st = U.el("div", { class: "sw-sticker", role: "button", tabindex: "0", "aria-label": nameOf(k), html: '<img src="' + photo(k) + '" alt="" draggable="false"/>' });
      st.style.left = (12 + Math.random() * 64) + "%"; st.style.top = (18 + Math.random() * 56) + "%";
      scene.appendChild(st); placed++;
      Kido.audio.playTapSound && Kido.audio.playTapSound();
      sound(k);
      // drag to move (or onto the bin to remove); a tap without moving plays the sound again
      var sx, sy, moved = false;
      st.addEventListener("pointerdown", function (e) {
        e.preventDefault(); sx = e.clientX; sy = e.clientY; moved = false;
        try { st.setPointerCapture(e.pointerId); } catch (_) {}
        st.classList.add("is-lifted");
      });
      st.addEventListener("pointermove", function (e) {
        if (!st.classList.contains("is-lifted")) return;
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 8) moved = true;
        if (!moved) return;
        var r = scene.getBoundingClientRect();
        st.style.left = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)) + "%";
        st.style.top = Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) + "%";
        var b = bin.getBoundingClientRect();
        bin.classList.toggle("is-over", e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom);
      });
      function up(e) {
        if (!st.classList.contains("is-lifted")) return;
        st.classList.remove("is-lifted");
        if (bin.classList.contains("is-over")) { bin.classList.remove("is-over"); st.remove(); Kido.audio.playTapSound && Kido.audio.playTapSound(); return; }
        if (!moved) { st.classList.remove("sw-sticker--hop"); void st.offsetWidth; st.classList.add("sw-sticker--hop"); sound(k); }
      }
      st.addEventListener("pointerup", up); st.addEventListener("pointercancel", up);
      st.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sound(k); } });
    }
    done.addEventListener("click", function () {
      Kido.fx.confetti(40);
      Promise.resolve(Kido.audio.speak(U.pick(S.done))).then(function () {
        if (ui.alive()) Kido.engine.finish(spec, placed >= 3 ? 3 : Math.max(1, placed), 3);   // creative play: never fewer than one star
      });
    });
    fillTray();
    Kido.mascot.say(S.hello + " " + S.move, { parts: [S.hello, S.move] });
  };
})(window);
