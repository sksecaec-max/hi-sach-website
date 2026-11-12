/* =========================================================================
   thinkLab3.js — Think Lab batch 3 (content: js/data/thinkLab.js)
     Kido.activities.gardenSigns(spec)  Garden Signs  — plant flowers where the pot signs (a kind or a colour) allow
     Kido.activities.trainTrack(spec)   Train Track   — choose the missing track pieces; the train rides the line
     Kido.activities.stickSquares(spec) Stick Squares — take sticks away so just the right number of squares is left
   (Magic Shapes reuses Kido.activities.trace with outline shapes — see catalog "magic-shapes".)
   Generators are pure (Kido.thinkLab.gen3) and checked by scripts/thinklab-check.mjs.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var T = Kido.thinkLab;
  Kido.activities = Kido.activities || {};

  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function lvl(table, d) { return table[Math.max(1, Math.min(7, d))]; }

  /* ---------------- Garden Signs: every pot's sign is met, and only one way to plant them all ---------------- */
  function fitsSign(sign, f) { return !sign || (sign.kind ? f.kind === sign.kind : f.color === sign.color); }
  function plantings(pots, flowers) {       // how many ways put every flower in a pot whose sign it fits
    var count = 0, used = [];
    (function go(i) {
      if (i === pots.length) { count++; return; }
      for (var k = 0; k < flowers.length; k++) if (!used[k] && fitsSign(pots[i], flowers[k])) { used[k] = true; go(i + 1); used[k] = false; }
    })(0);
    return count;
  }
  function signsPuzzle(d, rnd) {
    rnd = rnd || Math.random;
    var G = T.gardenSigns, L = lvl(G.levels, d), n = L[0];
    for (var attempt = 0; attempt < 500; attempt++) {
      var all = [];
      G.kinds.forEach(function (k) { G.colors.forEach(function (c, ci) { all.push({ kind: k, color: ci }); }); });
      var flowers = shuffle(all, rnd).slice(0, n);
      var blanks = shuffle(Array.from({ length: n }, function (_, i) { return i; }), rnd).slice(0, L[1]);
      var pots = flowers.map(function (f, i) {
        if (blanks.indexOf(i) >= 0) return null;
        return rnd() < 0.5 ? { kind: f.kind } : { color: f.color };
      });
      if (plantings(pots, flowers) !== 1) continue;
      return { pots: pots, answer: flowers, tray: shuffle(flowers.map(function (f, i) { return i; }), rnd) };
    }
    return null;
  }

  /* ---------------- Train Track: a random line from the left edge to the right edge ---------------- */
  var DIRS = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] }, OPP = { N: "S", S: "N", E: "W", W: "E" };
  var TILES = ["EW", "NS", "EN", "ES", "SW", "NW"];          // a piece joins two sides (letters sorted)
  function tileOf(a, b) { return [a, b].sort().join(""); }
  function trackPuzzle(d, rnd) {
    rnd = rnd || Math.random;
    var size = T.trainTrack.size(d), R = size[0], C = size[1], gaps = T.trainTrack.gaps(d);
    for (var attempt = 0; attempt < 300; attempt++) {
      var start = (rnd() * R) | 0, path = [[start, 0]], seen = {}; seen[start + ",0"] = true;
      var ok = (function walk() {                           // depth-first, shuffled: reaches the last column
        var at = path[path.length - 1];
        if (at[1] === C - 1 && path.length >= C + 1) return true;
        var dirs = shuffle(["N", "S", "E", "E", "W"], rnd);
        for (var i = 0; i < dirs.length; i++) {
          var r = at[0] + DIRS[dirs[i]][0], c = at[1] + DIRS[dirs[i]][1];
          if (r < 0 || r >= R || c < 0 || c >= C || seen[r + "," + c]) continue;
          if (path.length > R * C * 0.7) return false;
          seen[r + "," + c] = true; path.push([r, c]);
          if (walk()) return true;
          path.pop(); delete seen[r + "," + c];
        }
        return false;
      })();
      if (!ok) continue;
      var cells = path.map(function (p, i) {
        var from = i === 0 ? "W" : dirTo(path[i - 1], p, true), to = i === path.length - 1 ? "E" : dirTo(p, path[i + 1], false);
        return { r: p[0], c: p[1], tile: tileOf(from, to) };
      });
      var inner = Array.from({ length: cells.length - 2 }, function (_, i) { return i + 1; });
      var holes = shuffle(inner, rnd).slice(0, gaps).sort(function (a, b) { return a - b; });
      return { R: R, C: C, cells: cells, holes: holes.map(function (i) {
        var want = cells[i].tile, others = shuffle(TILES.filter(function (t) { return t !== want; }), rnd).slice(0, 2);
        return { at: i, tile: want, options: shuffle([want].concat(others), rnd) };
      }) };
    }
    return null;
  }
  function dirTo(a, b, entering) {                            // side of b we enter from (entering) or side of a we leave by
    var dr = b[0] - a[0], dc = b[1] - a[1], leave = dr < 0 ? "N" : dr > 0 ? "S" : dc > 0 ? "E" : "W";
    return entering ? OPP[leave] : leave;
  }

  /* ---------------- Stick Squares ---------------- */
  // sticks of an R x C grid of unit squares: horizontal "h r c" (r 0..R, c 0..C-1), vertical "v r c" (r 0..R-1, c 0..C)
  function gridSticks(R, C) {
    var s = [];
    for (var r = 0; r <= R; r++) for (var c = 0; c < C; c++) s.push("h" + r + "," + c);
    for (r = 0; r < R; r++) for (c = 0; c <= C; c++) s.push("v" + r + "," + c);
    return s;
  }
  /** Small (one-cell) squares whose four sticks are all there, and how many sticks belong to none of them.
      Only small squares count: two overlapping big squares look like rectangles to a child (found in testing). */
  function squaresOf(R, C, have) {
    var squares = 0, used = {};
    for (var size = 1; size <= 1; size++) for (var r = 0; r + size <= R; r++) for (var c = 0; c + size <= C; c++) {
      var edge = [];
      for (var k = 0; k < size; k++) edge.push("h" + r + "," + (c + k), "h" + (r + size) + "," + (c + k), "v" + (r + k) + "," + c, "v" + (r + k) + "," + (c + size));
      if (edge.every(function (e) { return have[e]; })) { squares++; edge.forEach(function (e) { used[e] = true; }); }
    }
    var loose = Object.keys(have).filter(function (e) { return have[e] && !used[e]; }).length;
    return { squares: squares, loose: loose };
  }
  var STICK_GRIDS = { 1: [1, 2], 2: [1, 2], 3: [2, 2], 4: [2, 2], 5: [2, 3], 6: [2, 3], 7: [2, 3] };
  function sticksPuzzle(d, rnd) {
    rnd = rnd || Math.random;
    var g = lvl(STICK_GRIDS, d), R = g[0], C = g[1], all = gridSticks(R, C), maxK = d <= 2 ? 3 : 4;
    var full = {}; all.forEach(function (e) { full[e] = true; });
    var startSquares = squaresOf(R, C, full).squares, found = {};
    (function choose(i, picked) {                             // every way to take away up to maxK sticks
      if (picked.length && picked.length <= maxK) {
        var have = Object.assign({}, full); picked.forEach(function (e) { have[e] = false; });
        var q = squaresOf(R, C, have);
        if (!q.loose && q.squares > 0 && q.squares < startSquares) { var key = picked.length + ":" + q.squares; (found[key] = found[key] || []).push(picked.slice()); }
      }
      if (picked.length === maxK) return;
      for (var j = i; j < all.length; j++) { picked.push(all[j]); choose(j + 1, picked); picked.pop(); }
    })(0, []);
    var keys = Object.keys(found).filter(function (k) { return found[k].length <= 6; });     // few answers: a real puzzle
    if (!keys.length) keys = Object.keys(found);
    var key = keys[(rnd() * keys.length) | 0], parts = key.split(":");
    return { R: R, C: C, sticks: all, take: +parts[0], keep: +parts[1], answers: found[key] };
  }

  T.gen3 = { signsPuzzle: signsPuzzle, plantings: plantings, fitsSign: fitsSign, trackPuzzle: trackPuzzle, tileOf: tileOf,
             TILES: TILES, gridSticks: gridSticks, squaresOf: squaresOf, sticksPuzzle: sticksPuzzle };

  var FITS_BUT = "That flower fits this sign, but another flower needs this pot.";
  /** Every fixed line batch 3 can say (for scripts/voice/harvest.js). */
  T.lines3 = function () {
    var G = T.gardenSigns, out = ["Trace the shape with your finger!", "Good start! Now trace the whole shape.", G.ask, G.blank, G.start, FITS_BUT,
      T.trainTrack.ask, T.trainTrack.wrong, T.sticks.loose].concat(G.done, T.trainTrack.done, T.sticks.done);
    T.magicShapes.forEach(function (s) { out.push(s.say, s.done); });
    G.kinds.forEach(function (k) { out.push(G.wantKind(k)); });
    G.colors.forEach(function (c) { out.push(G.wantColor(c[1])); });
    for (var k = 1; k <= 4; k++) for (var m = 1; m <= 7; m++) out.push(T.sticks.ask(k, m));
    for (m = 0; m <= 8; m++) out.push(T.sticks.count(m));
    return out.filter(function (s, i) { return out.indexOf(s) === i; });
  };

  /* ---------------- shared UI ---------------- */
  function cfg() { return (Kido.age && Kido.age.cfg()) || { difficulty: 3, rounds: 5 }; }
  function shell(cls, title) {
    var m = document.getElementById("screen"); m.innerHTML = ""; m.scrollTop = 0;
    var game = U.el("div", { class: "game tl-game " + cls });
    var prompt = U.el("div", { class: "game__prompt", html: title }), status = U.el("div", { class: "arcade__status" });
    game.appendChild(U.el("div", { class: "game__head" }, [prompt, status]));
    var stage = U.el("div", { class: "tl-stage" });
    game.appendChild(stage); m.appendChild(game);
    return { game: game, prompt: prompt, status: status, stage: stage, alive: function () { return game.isConnected; } };
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* =============================== GARDEN SIGNS =============================== */
  function flowerSvg(kind, color) {
    var petals = "";
    if (kind === "daisy") for (var i = 0; i < 10; i++) petals += '<ellipse cx="50" cy="22" rx="7" ry="15" fill="' + color + '" transform="rotate(' + i * 36 + ' 50 38)"/>';
    var head = kind === "tulip"
      ? '<path d="M32 20 Q30 50 50 54 Q70 50 68 20 L59 32 L50 16 L41 32 Z" fill="' + color + '"/>'
      : kind === "rose"
        ? '<circle cx="50" cy="36" r="19" fill="' + color + '"/><path d="M50 36 m-11 0 a11 11 0 1 0 22 0 a8 8 0 1 0 -16 0 a5 5 0 1 0 10 0" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/>'
        : petals + '<circle cx="50" cy="38" r="9" fill="#F59E0B"/>';
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 54 V96" stroke="#16A34A" stroke-width="5"/>' +
      '<path d="M50 78 Q34 66 30 74 Q38 84 50 80" fill="#22C55E"/>' + head + "</svg>";
  }
  function signSvg(sign) {
    var G = T.gardenSigns;
    if (!sign) return '<div class="gs-sign is-blank" aria-label="No sign"></div>';
    if (sign.kind) return '<div class="gs-sign" aria-label="' + sign.kind + '">' + flowerSvg(sign.kind, "#64748B") + "</div>";
    return '<div class="gs-sign" aria-label="' + G.colors[sign.color][1] + '"><span class="gs-blob" style="background:' + G.colors[sign.color][0] + '"></span></div>';
  }
  Kido.activities.gardenSigns = function (spec) {
    var d = cfg().difficulty, G = T.gardenSigns, boards = G.boards(d), b = 0, clean = 0;
    var ui = shell("tl-signs", "🌷 Garden Signs");
    var bed = U.el("div", { class: "gs-bed" }), tray = U.el("div", { class: "gs-tray slot", "aria-label": "Flowers" });
    ui.stage.appendChild(bed); ui.stage.appendChild(tray);

    function board() {
      if (!ui.alive()) return;
      if (b >= boards) { Kido.engine.finish(spec, clean, boards); return; }
      var pz = signsPuzzle(d), placed = 0, mistakes = 0, busy = false;
      bed.__pz = pz;                                                     // read by automated checks only
      ui.status.textContent = (b + 1) + " / " + boards;
      bed.innerHTML = ""; tray.innerHTML = "";
      var tap = Kido.engine.tapPlacement(place);
      pz.pots.forEach(function (sign, i) {
        var pot = U.el("div", { class: "gs-pot slot", "data-i": i, role: "button", tabindex: "0", "aria-label": "Pot " + (i + 1),
          html: signSvg(sign) + '<div class="gs-hole"></div><div class="gs-pot__base"></div>' });
        tap.slot(pot); bed.appendChild(pot);
      });
      pz.tray.forEach(function (fi) {
        var f = pz.answer[fi];
        var chip = U.el("div", { class: "gs-flower", "data-f": fi, role: "button", tabindex: "0",
          "aria-label": G.colors[f.color][1] + " " + f.kind, html: flowerSvg(f.kind, G.colors[f.color][0]) });
        Kido.engine.makeDraggable(chip, { onDrop: function (t) { return place(chip, t && t.closest(".gs-pot")); } });
        tap.chip(chip); tray.appendChild(chip);
      });
      Kido.audio.speak(G.ask);

      function place(chip, pot) {
        if (busy || !chip || !pot || pot.querySelector(".gs-flower")) return false;
        var fi = +chip.getAttribute("data-f"), i = +pot.getAttribute("data-i"), f = pz.answer[fi], sign = pz.pots[i];
        if (fi === i) {
          pot.querySelector(".gs-hole").appendChild(chip); chip.classList.add("is-planted");
          Kido.audio.playTapSound && Kido.audio.playTapSound(); Kido.fx.sparkleEl(pot);
          if (++placed === pz.pots.length) {
            busy = true; if (!mistakes) clean++;
            Kido.audio.playCorrectSound(); Kido.fx.confetti(36);
            Promise.resolve(Kido.audio.speak(U.pick(G.done))).then(function () { return wait(600); }).then(function () { b++; board(); });
          }
          return true;
        }
        mistakes++;
        Kido.fx.shake(pot); Kido.audio.playIncorrectSound();
        pot.classList.remove("is-no"); void pot.offsetWidth; pot.classList.add("is-no");
        if (!fitsSign(sign, f)) Kido.audio.speak(sign.kind ? G.wantKind(sign.kind) : G.wantColor(G.colors[sign.color][1]));
        else Kido.mascot.say(FITS_BUT + " " + G.start, { parts: [FITS_BUT, G.start] });
        return false;
      }
    }
    Kido.mascot.say("Read the pot signs, then plant the flowers!", { silent: true });
    setTimeout(board, 600);
  };

  /* =============================== TRAIN TRACK =============================== */
  var RAIL = { E: "100,50", W: "0,50", N: "50,0", S: "50,100" };
  function tileSvg(tile) {
    var a = RAIL[tile[0]], c = RAIL[tile[1]], curve = tile !== "EW" && tile !== "NS";
    var d = "M" + a + (curve ? " Q50,50 " : " L") + c;
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="' + d + '" fill="none" stroke="#8B5A2B" stroke-width="26" stroke-dasharray="6 7"/>' +
      '<path d="' + d + '" fill="none" stroke="#6B7280" stroke-width="20"/><path d="' + d + '" fill="none" stroke="#C7A27A" stroke-width="13"/></svg>';
  }
  var TRAIN = '<svg viewBox="0 0 100 70" aria-hidden="true"><rect x="10" y="20" width="56" height="32" rx="6" fill="#EF4444"/>' +
    '<rect x="56" y="8" width="26" height="44" rx="5" fill="#2563EB"/><rect x="62" y="14" width="14" height="12" rx="2" fill="#BAE6FD"/>' +
    '<rect x="16" y="10" width="10" height="12" fill="#374151"/><circle cx="24" cy="56" r="9" fill="#111827"/><circle cx="50" cy="56" r="9" fill="#111827"/><circle cx="74" cy="56" r="9" fill="#111827"/></svg>';
  Kido.activities.trainTrack = function (spec) {
    var d = cfg().difficulty, boards = T.trainTrack.boards(d), b = 0, clean = 0;
    var ui = shell("tl-train", "🚂 Train Track");
    var map = U.el("div", { class: "tt-map" }), pick = U.el("div", { class: "tt-pick" });
    ui.stage.appendChild(map); ui.stage.appendChild(pick);

    function board() {
      if (!ui.alive()) return;
      if (b >= boards) { Kido.engine.finish(spec, clean, boards); return; }
      var pz = trackPuzzle(d), open = pz.holes.slice(), sel = 0, mistakes = 0, busy = false;
      map.__pz = pz;                                                     // read by automated checks only
      ui.status.textContent = (b + 1) + " / " + boards;
      map.style.setProperty("--rows", pz.R); map.style.setProperty("--cols", pz.C);
      var html = "";
      for (var r = 0; r < pz.R; r++) for (var c = 0; c < pz.C; c++) html += '<div class="tt-cell" data-rc="' + r + "," + c + '"></div>';
      map.innerHTML = html + '<div class="tt-train">' + TRAIN + "</div>";
      var cellAt = function (r, c) { return map.querySelector('[data-rc="' + r + "," + c + '"]'); };
      for (r = 0; r < pz.R; r++) for (c = 0; c < pz.C; c++) if (((r * 7 + c * 3 + b) % 5) === 0) cellAt(r, c).innerHTML = '<span class="tt-tree">🌳</span>';
      pz.cells.forEach(function (cell, i) {
        var el = cellAt(cell.r, cell.c);
        if (pz.holes.some(function (h) { return h.at === i; })) { el.innerHTML = '<button class="tt-hole" data-i="' + i + '" aria-label="Missing track"></button>'; }
        else el.innerHTML = tileSvg(cell.tile);
        if (i === 0) el.insertAdjacentHTML("beforeend", '<span class="tt-station tt-station--a">🏠</span>');
        if (i === pz.cells.length - 1) el.insertAdjacentHTML("beforeend", '<span class="tt-station tt-station--b">🏁</span>');
      });
      map.querySelectorAll(".tt-hole").forEach(function (h) {
        h.addEventListener("click", function () { sel = open.findIndex(function (o) { return o.at === +h.getAttribute("data-i"); }); paintPick(); });
      });
      placeTrain(0, true);
      paintPick();
      Kido.audio.speak(T.trainTrack.ask);

      function paintPick() {
        map.querySelectorAll(".tt-hole").forEach(function (h) { h.classList.toggle("is-sel", open[sel] && +h.getAttribute("data-i") === open[sel].at); });
        pick.innerHTML = "";
        if (!open[sel]) return;
        open[sel].options.forEach(function (tile) {
          var btn = U.el("button", { class: "tt-piece", "aria-label": "Track piece", html: tileSvg(tile) });
          btn.addEventListener("click", function () { choose(btn, tile); });
          pick.appendChild(btn);
        });
      }
      function choose(btn, tile) {
        if (busy || !open[sel]) return;
        Kido.audio.unlock();
        var hole = open[sel];
        if (tile === hole.tile) {
          var cell = pz.cells[hole.at], el = cellAt(cell.r, cell.c);
          el.querySelector(".tt-hole").remove(); el.insertAdjacentHTML("afterbegin", tileSvg(tile)); el.classList.add("tt-cell--pop");
          Kido.audio.playTapSound && Kido.audio.playTapSound();
          open.splice(sel, 1); sel = 0; paintPick();
          if (!open.length) ride();
          return;
        }
        mistakes++; Kido.fx.shake(btn); Kido.audio.playIncorrectSound(); btn.classList.add("is-wrong");
        Kido.audio.speak(T.trainTrack.wrong);
      }
      function placeTrain(i, instant) {
        var cell = pz.cells[i], t = map.querySelector(".tt-train");
        t.style.transition = instant ? "none" : "";
        t.style.left = ((cell.c + 0.5) / pz.C * 100) + "%"; t.style.top = ((cell.r + 0.5) / pz.R * 100) + "%";
      }
      function ride() {
        busy = true; if (!mistakes) clean++;
        Kido.audio.playCorrectSound();
        var i = 0;
        (function step() {
          if (!ui.alive()) return;
          if (i >= pz.cells.length) {
            Kido.fx.confetti(36);
            Promise.resolve(Kido.audio.speak(U.pick(T.trainTrack.done))).then(function () { return wait(500); }).then(function () { b++; board(); });
            return;
          }
          placeTrain(i++); setTimeout(step, 260);
        })();
      }
    }
    Kido.mascot.say("Fix the railway so the train can get home!", { silent: true });
    setTimeout(board, 600);
  };

  /* =============================== STICK SQUARES =============================== */
  Kido.activities.stickSquares = function (spec) {
    var d = cfg().difficulty, boards = T.sticks.boards(d), b = 0, clean = 0;
    var ui = shell("tl-sticks", "🍡 Stick Squares");
    var field = U.el("div", { class: "ss-field" }), counter = U.el("div", { class: "ss-count" });
    ui.stage.appendChild(field); ui.stage.appendChild(counter);

    function board() {
      if (!ui.alive()) return;
      if (b >= boards) { Kido.engine.finish(spec, clean, boards); return; }
      var pz = sticksPuzzle(d), gone = {}, mistakes = 0, busy = false, U2 = 100;
      field.__pz = pz;                                                   // read by automated checks only
      ui.status.textContent = (b + 1) + " / " + boards;
      var ask = T.sticks.ask(pz.take, pz.keep);
      ui.prompt.innerHTML = "🍡 " + ask;
      var w = pz.C * U2 + 40, h = pz.R * U2 + 40;
      var svg = '<svg viewBox="-20 -20 ' + w + " " + h + '" class="ss-svg">';
      pz.sticks.forEach(function (s) {
        var hz = s[0] === "h", rc = s.slice(1).split(","), r = +rc[0], c = +rc[1];
        var x = c * U2, y = r * U2, x2 = hz ? x + U2 : x, y2 = hz ? y : y + U2;
        svg += '<g class="ss-stick" data-s="' + s + '" role="button" tabindex="0" aria-label="Stick">' +
          '<line class="ss-hit" x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
          '<line class="ss-wood" x1="' + (hz ? x + 10 : x) + '" y1="' + (hz ? y : y + 10) + '" x2="' + (hz ? x2 - 10 : x2) + '" y2="' + (hz ? y2 : y2 - 10) + '"/></g>';
      });
      field.innerHTML = svg + "</svg>";
      counter.textContent = "0 / " + pz.take;
      field.querySelectorAll(".ss-stick").forEach(function (g) {
        function toggle() {
          if (busy) return;
          Kido.audio.unlock();
          var s = g.getAttribute("data-s");
          if (gone[s]) delete gone[s]; else gone[s] = true;
          g.classList.toggle("is-gone", !!gone[s]);
          Kido.audio.playTapSound && Kido.audio.playTapSound();
          var n = Object.keys(gone).length;
          counter.textContent = n + " / " + pz.take;
          if (n === pz.take) setTimeout(check, 350);
        }
        g.addEventListener("click", toggle);
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      });
      Kido.audio.speak(ask);

      function check() {
        if (!ui.alive()) return;
        var have = {}; pz.sticks.forEach(function (s) { have[s] = !gone[s]; });
        var q = squaresOf(pz.R, pz.C, have);
        if (q.squares === pz.keep && !q.loose) {
          busy = true; if (!mistakes) clean++;
          Kido.audio.playCorrectSound(); Kido.fx.confetti(36);
          Promise.resolve(Kido.audio.speak(U.pick(T.sticks.done))).then(function () { return wait(600); }).then(function () { b++; board(); });
          return;
        }
        mistakes++; busy = true; Kido.audio.playIncorrectSound();
        Kido.audio.speak(q.loose ? T.sticks.loose : T.sticks.count(q.squares));
        setTimeout(function () {                                         // put the sticks back and try again
          if (!ui.alive()) return;
          gone = {}; field.querySelectorAll(".ss-stick").forEach(function (g) { g.classList.remove("is-gone"); });
          counter.textContent = "0 / " + pz.take; busy = false;
        }, 2200);
      }
    }
    Kido.mascot.say("Tap a stick to take it away. Tap again to put it back.", { silent: true });
    setTimeout(board, 600);
  };
})(window);
