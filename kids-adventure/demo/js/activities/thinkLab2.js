/* =========================================================================
   thinkLab2.js — Think Lab batch 2 (content: js/data/thinkLab.js)
     Kido.activities.frogHop(spec)      Frog Hop      — drag the frog onto the lily pads in counting order (on, by 2s/5s, backwards)
     Kido.activities.gardenSudoku(spec) Garden Sudoku — every row and column gets one of each fruit
     Kido.activities.treasureMap(spec)  Treasure Map  — grid squares by column letter and row number
     Kido.activities.lightWires(spec)   Light Wires   — wire each battery to its bulb; wires never cross
   (Number tracing reuses Kido.activities.trace — see catalog "trace-123".)
   Generators are pure (Kido.thinkLab.gen2) and checked by scripts/thinklab-check.mjs.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var T = Kido.thinkLab;
  Kido.activities = Kido.activities || {};

  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function lvl(table, d) { return table[Math.max(1, Math.min(7, d))]; }

  /* ---------------- Frog Hop: the numbers in order, and where the pads go ---------------- */
  // Left-to-right zigzags for the youngest (a different one each crossing, so no two crossings look alike).
  var YOUNG_PATHS = [[[0, 1], [1, 0], [2, 1], [3, 0]], [[0, 0], [1, 1], [2, 0], [3, 1]], [[0, 1], [1, 2], [2, 1], [3, 0]], [[0, 2], [1, 1], [2, 0], [3, 1]], [[0, 0], [1, 1], [2, 2], [3, 1]]];
  /** off: how many steps later the count starts (0 = the level's own start), so crossings use different numbers. */
  function frogRound(d, rnd, off) {
    rnd = rnd || Math.random;
    var L = lvl(T.frogHop.levels, d), nums = [], first = L[0] + (off || 0) * Math.abs(L[1]);
    for (var i = 0; i < L[2]; i++) nums.push(first + i * L[1]);
    // pads on a loose 4 x 3 field: shuffled slots with a little jitter (younger children: left to right in order)
    var slots = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) slots.push([c, r]);
    var order = d <= 1 ? YOUNG_PATHS[(rnd() * YOUNG_PATHS.length) | 0] : shuffle(slots, rnd).slice(0, nums.length);
    return { nums: nums, step: L[1], pads: nums.map(function (n, k) {
      var s = order[k % order.length];
      return { n: n, x: 21 + s[0] * 22 + (rnd() * 8 - 4), y: 18 + s[1] * 30 + (rnd() * 8 - 4) };   // x from 17%: clear of the bank
    }) };
  }

  /* ---------------- Garden Sudoku: a Latin square with exactly one way to fill the blanks ---------------- */
  function sudokuSolutions(grid, n, limit) {
    var found = 0, g = grid.slice();
    (function fill(i) {
      if (found >= limit) return;
      while (i < g.length && g[i] != null) i++;
      if (i === g.length) { found++; return; }
      var r = (i / n) | 0, c = i % n;
      for (var v = 0; v < n; v++) {
        var ok = true;
        for (var k = 0; k < n && ok; k++) if (g[r * n + k] === v || g[k * n + c] === v) ok = false;
        if (!ok) continue;
        g[i] = v; fill(i + 1); g[i] = null;
      }
    })(0);
    return found;
  }
  function sudokuPuzzle(d, rnd) {
    rnd = rnd || Math.random;
    var L = lvl(T.sudoku.levels, d), n = L[0];
    for (var attempt = 0; attempt < 200; attempt++) {
      var rows = shuffle(Array.from({ length: n }, function (_, i) { return i; }), rnd), cols = shuffle(rows, rnd), syms = shuffle(rows, rnd);
      var answer = [];
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) answer.push(syms[(rows[r] + cols[c]) % n]);
      var grid = answer.slice(), blanks = 0;
      shuffle(Array.from({ length: n * n }, function (_, i) { return i; }), rnd).some(function (i) {
        if (blanks >= L[1]) return true;
        var keep = grid[i]; grid[i] = null;
        if (sudokuSolutions(grid, n, 2) === 1) blanks++; else grid[i] = keep;
        return false;
      });
      if (blanks === L[1]) return { n: n, grid: grid, answer: answer };
    }
    return null;
  }
  /** Which filled cell in the same row / column already holds v (for the explanation). */
  function sudokuClash(grid, n, i, v) {
    var r = (i / n) | 0, c = i % n;
    for (var k = 0; k < n; k++) {
      if (r * n + k !== i && grid[r * n + k] === v) return { kind: "row", at: r * n + k };
      if (k * n + c !== i && grid[k * n + c] === v) return { kind: "col", at: k * n + c };
    }
    return null;
  }

  /* ---------------- Treasure Map ---------------- */
  function cellName(i, n) { return T.treasure.cols[i % n] + (((i / n) | 0) + 1); }
  function treasureRounds(d, rnd, maxN) {
    rnd = rnd || Math.random;
    var n = Math.min(T.treasure.size(d), maxN || 9), k = T.treasure.rounds(d), cells = shuffle(Array.from({ length: n * n }, function (_, i) { return i; }), rnd);
    return cells.slice(0, k).map(function (cell, i) {
      var animal = T.treasure.animals[(rnd() * T.treasure.animals.length) | 0];
      var mode = d >= 5 && i % 2 === 1 ? "find" : "put";
      var opts = null;
      if (mode === "find") {            // three square names; the decoys share the column or the row (the usual mix-up)
        var r = (cell / n) | 0, c = cell % n, near = [];
        for (var j = 0; j < n * n; j++) if (j !== cell && (((j / n) | 0) === r || j % n === c)) near.push(j);
        opts = shuffle([cell].concat(shuffle(near, rnd).slice(0, 2)), rnd).map(function (j) { return cellName(j, n); });
      }
      return { n: n, cell: cell, name: cellName(cell, n), animal: animal, mode: mode, options: opts };
    });
  }

  /* ---------------- Light Wires: lay random non-touching paths, keep their ends as batteries and bulbs ---------------- */
  function wiresPuzzle(d, rnd, maxN) {
    rnd = rnd || Math.random;
    var L = lvl(T.wires.levels, d), n = Math.min(L[0], maxN || 9), pairs = Math.min(L[1], n - 1);
    for (var attempt = 0; attempt < 400; attempt++) {
      var used = {}, paths = [], ok = true;
      for (var p = 0; p < pairs && ok; p++) {
        var free = Array.from({ length: n * n }, function (_, i) { return i; }).filter(function (i) { return !used[i]; });
        if (!free.length) { ok = false; break; }
        var path = [free[(rnd() * free.length) | 0]], want = 2 + ((rnd() * (n + 1)) | 0);
        used[path[0]] = true;
        while (path.length < want) {
          var at = path[path.length - 1], r = (at / n) | 0, c = at % n;
          var next = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(function (q) { return q[0] >= 0 && q[0] < n && q[1] >= 0 && q[1] < n && !used[q[0] * n + q[1]]; });
          if (!next.length) break;
          var q = next[(rnd() * next.length) | 0];
          path.push(q[0] * n + q[1]); used[q[0] * n + q[1]] = true;
        }
        if (path.length < 2) { ok = false; break; }
        // ends must not be side by side (a wire of length 0 is no puzzle) unless the grid is tiny
        if (path.length < 3 && n > 3) { ok = false; break; }
        paths.push(path);
      }
      if (!ok) continue;
      return { n: n, pairs: paths.map(function (pth, i) { return { color: T.wires.colors[i], a: pth[0], b: pth[pth.length - 1], solution: pth }; }) };
    }
    return null;
  }

  T.gen2 = { frogRound: frogRound, sudokuPuzzle: sudokuPuzzle, sudokuSolutions: sudokuSolutions, sudokuClash: sudokuClash,
             treasureRounds: treasureRounds, cellName: cellName, wiresPuzzle: wiresPuzzle };

  var FRUIT_A = { apple: "an apple", banana: "a banana", grapes: "grapes", watermelon: "a watermelon" };
  /** Every fixed line batch 2 can say (for scripts/voice/harvest.js). */
  T.lines2 = function () {
    var out = ["Trace the number with your finger!", "Good start! Now trace the whole number.", T.sudoku.ask, T.sudoku.look, T.wires.ask, T.wires.cross].concat(T.frogHop.done, T.sudoku.done, T.treasure.done, T.wires.done);
    out.push(FROG_SAY.intro, FROG_SAY.drag);
    for (var d = 1; d <= 7; d++) {
      for (var off = 0; off <= FROG_MAX_OFF; off++) {           // every start a crossing can use (frogHop offsets)
        var L = T.frogHop.levels[d], first = L[0] + off * Math.abs(L[1]), last = first + (L[2] - 1) * L[1];
        out.push(T.frogHop.ask(first, L[1], last), T.frogHop.start(first));
        for (var k = 0; k < L[2]; k++) { var v = first + k * L[1]; out.push(String(v), L[1] < 0 ? T.frogHop.before(v) : T.frogHop.after(v)); }
      }
    }
    T.sudoku.fruits.forEach(function (f) { out.push(T.sudoku.row(FRUIT_A[f]), T.sudoku.col(FRUIT_A[f])); });
    var names = {}; (Kido.content && Kido.content.animals || []).forEach(function (a) { names[a.key] = a.name.toLowerCase(); });
    for (var n = 3; n <= 5; n++) for (var i = 0; i < n * n; i++) {
      var cell = cellName(i, n);
      out.push(T.treasure.on(cell), T.treasure.help(cell[0], cell.slice(1)));
      T.treasure.animals.forEach(function (a) { out.push(T.treasure.put(names[a] || a, cell)); });
    }
    T.treasure.animals.forEach(function (a) { out.push(T.treasure.where(names[a] || a)); });
    T.wires.colors.forEach(function (c) { out.push(T.wires.lit(c[1])); });
    return out.filter(function (s, i) { return out.indexOf(s) === i; });
  };

  /* ---------------- shared UI ---------------- */
  function cfg() { return (Kido.age && Kido.age.cfg()) || { difficulty: 3, rounds: 5 }; }
  function shell(cls, title, extra) {
    var m = document.getElementById("screen"); m.innerHTML = ""; m.scrollTop = 0;
    var game = U.el("div", { class: "game tl-game " + cls });
    var prompt = U.el("div", { class: "game__prompt", html: title }), status = U.el("div", { class: "arcade__status" });
    var head = U.el("div", { class: "game__head" }, [prompt, status]);
    if (extra) head.appendChild(extra);
    game.appendChild(head);
    var stage = U.el("div", { class: "tl-stage" });
    game.appendChild(stage); m.appendChild(game);
    return { game: game, prompt: prompt, status: status, stage: stage, alive: function () { return game.isConnected; } };
  }
  function say(parts) { return Kido.mascot.say(parts.join(" "), { parts: parts }); }
  /** How many rows of cells fit under the stage top (a short landscape phone fits 4, not 5, rows of >= 44 px squares). */
  function rowsThatFit(ui, perCell, extra) {
    var top = ui.stage.getBoundingClientRect().top;
    return Math.max(3, Math.floor((window.innerHeight - top - 12 - extra) / perCell));
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function img(src, cls) { return '<img class="' + (cls || "") + '" src="' + src + '" alt="" draggable="false"/>'; }

  /* =============================== FROG HOP =============================== */
  // The child drags the frog itself onto the next lily pad (pads are not tap targets; Enter/Space on a focused pad
  // still hops, for keyboards). A tap on a pad only reminds them to drag.
  var FROG_SAY = { intro: "The frog wants to cross the pond. Drag the frog onto the lily pads in order!",
                   drag: "Drag the frog onto the lily pad!" };
  var FROG_MAX_OFF = 2;                                       // a crossing may start up to 2 steps later than the level

  Kido.activities.frogHop = function (spec) {
    var c = cfg(), d = c.difficulty, crossings = T.frogHop.crossings, k = 0, clean = 0;
    var ui = shell("tl-frog", "🐸 Frog Hop");
    var pond = U.el("div", { class: "fh-pond" });
    ui.stage.appendChild(pond);
    var frogImg = (Kido.creatures.get("frog") || {}).img;
    // a different start for each crossing, never past the numbers this age counts to
    var L = lvl(T.frogHop.levels, d), span = (L[2] - 1) * L[1], room = FROG_MAX_OFF;
    if (L[1] > 0) room = Math.max(0, Math.min(FROG_MAX_OFF, Math.floor(((c.maxNumber || 10) - (L[0] + span)) / L[1])));
    var offs = [];
    for (var o = 0; o <= room; o++) offs.push(o);
    offs = shuffle(offs, Math.random);
    if (offs[0] !== 0) offs.unshift(offs.splice(offs.indexOf(0), 1)[0]);   // the first crossing uses the level's own start

    function crossing() {
      if (!ui.alive()) return;
      if (k >= crossings) { Kido.engine.finish(spec, clean, crossings); return; }
      var rd = frogRound(d, Math.random, offs[k % offs.length]), next = 0, mistakes = 0, busy = false;
      ui.status.textContent = (k + 1) + " / " + crossings;
      var last = rd.nums[rd.nums.length - 1];
      ui.prompt.innerHTML = "🐸 " + T.frogHop.ask(rd.nums[0], rd.step, last);
      pond.innerHTML = '<svg class="fh-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points=""/></svg>' +
        '<div class="fh-bank">🌿</div>';
      var frog = U.el("div", { class: "fh-frog", role: "img", "aria-label": "Frog", html: img(frogImg) });
      var home = { x: 4, y: 50 };                              // where the frog sits now: the bank, then each pad it reached
      function put(x, y) { frog.style.left = x + "%"; frog.style.top = y + "%"; }
      put(home.x, home.y);
      var pts = ["4,50"], pads = [];
      rd.pads.forEach(function (p, i) {
        var pad = U.el("div", { class: "fh-pad", role: "button", tabindex: "0", "aria-label": String(p.n),
          html: "<span>" + p.n + "</span>" + (i === rd.pads.length - 1 ? '<i class="fh-lotus">🌸</i>' : "") });
        pad.style.left = p.x + "%"; pad.style.top = p.y + "%";
        pad.addEventListener("click", function () { if (!busy) { Kido.audio.speak(FROG_SAY.drag); wiggle(); } });
        pad.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); land(i); } });
        pond.appendChild(pad); pads.push(pad);
      });
      pond.appendChild(frog);
      Kido.audio.speak(T.frogHop.ask(rd.nums[0], rd.step, last));

      function wiggle() { frog.classList.remove("fh-frog--hop"); void frog.offsetWidth; frog.classList.add("fh-frog--hop"); }
      // ---- drag: the frog follows the finger; let go over a pad to hop onto it ----
      function toPct(e) {
        var r = pond.getBoundingClientRect();
        return { x: Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), y: Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100)) };
      }
      function padAt(e) {                                      // the pad under the finger (a little forgiving)
        var best = -1, bestD = Infinity;
        pads.forEach(function (pad, i) {
          var r = pad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), dd = dx * dx + dy * dy;
          if (dd < Math.pow(r.width * 0.65, 2) && dd < bestD) { best = i; bestD = dd; }
        });
        return best;
      }
      var over = -1, lastE = null;
      function mark(i) { if (over >= 0) pads[over].classList.remove("is-over"); over = i; if (i >= 0) pads[i].classList.add("is-over"); }
      frog.addEventListener("pointerdown", function (e) {
        if (busy) return;
        e.preventDefault(); Kido.audio.unlock();
        lastE = { clientX: e.clientX, clientY: e.clientY };
        try { frog.setPointerCapture(e.pointerId); } catch (x) {}
        frog.classList.add("is-dragging");
      });
      frog.addEventListener("pointermove", function (e) {
        if (!frog.classList.contains("is-dragging")) return;
        lastE = { clientX: e.clientX, clientY: e.clientY };
        var q = toPct(e); put(q.x, q.y); mark(padAt(e));
      });
      function drop(e) {
        if (!frog.classList.contains("is-dragging")) return;
        e = e && e.clientX != null ? e : lastE;
        frog.classList.remove("is-dragging"); mark(-1);
        var i = padAt(e);
        if (i >= 0 && !pads[i].classList.contains("is-done")) land(i);
        else put(home.x, home.y);                               // dropped in the water: back to where it was
      }
      frog.addEventListener("pointerup", drop);
      // capture can be lost without a pointerup (the system took the gesture): finish where the finger last was
      frog.addEventListener("lostpointercapture", function () { drop(lastE); });
      frog.addEventListener("pointercancel", function (e) { frog.classList.remove("is-dragging"); mark(-1); put(home.x, home.y); });

      function land(i) {
        var pad = pads[i];
        if (busy || pad.classList.contains("is-done")) return;
        Kido.audio.unlock();
        if (i === next) {
          pad.classList.add("is-done");
          var p = rd.pads[i];
          home = { x: p.x, y: p.y - 3 }; put(home.x, home.y); wiggle();
          pts.push(p.x + "," + p.y);
          pond.querySelector(".fh-trail polyline").setAttribute("points", pts.join(" "));
          Kido.audio.speak(String(p.n));
          next++;
          if (next === rd.pads.length) {
            busy = true; if (!mistakes) clean++;
            Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(pad);
            wait(600).then(function () { return Kido.audio.speak(U.pick(T.frogHop.done)); }).then(function () { return wait(500); }).then(function () { k++; crossing(); });
          }
        } else {
          mistakes++;
          put(home.x, home.y);                                  // the frog jumps back; the pad shakes
          Kido.fx.shake(pad); Kido.audio.playIncorrectSound();
          var hint = next === 0 ? T.frogHop.start(rd.nums[0]) : rd.step < 0 ? T.frogHop.before(rd.nums[next - 1]) : T.frogHop.after(rd.nums[next - 1]);
          Kido.audio.speak(hint);
          var want = pads[next];
          if (mistakes >= 2 && want) { want.classList.remove("fh-pad--hint"); void want.offsetWidth; want.classList.add("fh-pad--hint"); }
        }
      }
    }
    Kido.mascot.say(FROG_SAY.intro, { silent: true });
    setTimeout(crossing, 600);
  };

  /* =============================== GARDEN SUDOKU =============================== */
  Kido.activities.gardenSudoku = function (spec) {
    var d = cfg().difficulty, boards = T.sudoku.boards(d), b = 0, clean = 0;
    var ui = shell("tl-sudoku", "🍎 Garden Sudoku");
    var board = U.el("div", { class: "sd-board" }), picker = U.el("div", { class: "sd-picker" });
    ui.stage.appendChild(board); ui.stage.appendChild(picker);
    var fruits = T.sudoku.fruits.map(function (k) { var c = Kido.creatures.get(k) || {}; return { key: k, name: c.name || k, img: c.img }; });

    function puzzle() {
      if (!ui.alive()) return;
      if (b >= boards) { Kido.engine.finish(spec, clean, boards); return; }
      var pz = sudokuPuzzle(d), n = pz.n, grid = pz.grid.slice(), sel = -1, mistakes = 0, busy = false;
      board.__pz = pz;                                                  // read by automated checks only
      ui.status.textContent = (b + 1) + " / " + boards;
      board.style.setProperty("--n", n);
      board.innerHTML = ""; picker.innerHTML = "";
      grid.forEach(function (v, i) {
        var cell = U.el("button", { class: "sd-cell" + (v == null ? " is-blank" : ""), "data-i": i, "aria-label": v == null ? "Empty square" : fruits[v].name,
          html: v == null ? "" : img(fruits[v].img) });
        if (v == null) cell.addEventListener("click", function () { choose(i); });
        board.appendChild(cell);
      });
      fruits.slice(0, n).forEach(function (f, v) {
        var btn = U.el("button", { class: "sd-pick", "aria-label": f.name, html: img(f.img) + "<span>" + f.name + "</span>" });
        btn.addEventListener("click", function () { place(v); });
        picker.appendChild(btn);
      });
      picker.classList.remove("is-open");
      Kido.audio.speak(T.sudoku.ask);

      function cellEl(i) { return board.children[i]; }
      function choose(i) {
        if (busy || grid[i] != null) return;
        Kido.audio.unlock();
        if (sel >= 0) cellEl(sel).classList.remove("is-sel");
        sel = i; cellEl(i).classList.add("is-sel"); picker.classList.add("is-open");
      }
      function place(v) {
        if (busy || sel < 0 || grid[sel] != null) return;
        var i = sel, cell = cellEl(i);
        if (pz.answer[i] === v) {
          grid[i] = v; cell.classList.remove("is-blank", "is-sel"); cell.innerHTML = img(fruits[v].img); cell.classList.add("sd-cell--pop");
          sel = -1; picker.classList.remove("is-open");
          Kido.audio.playTapSound && Kido.audio.playTapSound();
          if (grid.every(function (x) { return x != null; })) {
            busy = true; if (!mistakes) clean++;
            Kido.audio.playCorrectSound(); Kido.fx.confetti(36);
            Promise.resolve(Kido.audio.speak(U.pick(T.sudoku.done))).then(function () { return wait(600); }).then(function () { b++; puzzle(); });
          }
          return;
        }
        mistakes++;
        Kido.audio.playIncorrectSound();
        cell.innerHTML = img(fruits[v].img, "is-try"); cell.classList.add("is-clash");
        var clash = sudokuClash(grid, n, i, v);
        if (clash) {
          var other = cellEl(clash.at); other.classList.add("is-clash");
          // light the whole row or column so the child sees where to look
          for (var k = 0; k < n; k++) cellEl(clash.kind === "row" ? ((i / n) | 0) * n + k : k * n + i % n).classList.add("is-line");
          Kido.audio.speak(T.sudoku[clash.kind](FRUIT_A[fruits[v].key]));
          setTimeout(function () { other.classList.remove("is-clash"); }, 1600);
        } else Kido.audio.speak(T.sudoku.look);
        setTimeout(function () {
          if (!ui.alive() || grid[i] != null) return;
          cell.innerHTML = ""; cell.classList.remove("is-clash");
          board.querySelectorAll(".is-line").forEach(function (c) { c.classList.remove("is-line"); });
        }, 1600);
      }
    }
    Kido.mascot.say("Help fill the fruit garden! No fruit twice in a row or column.", { silent: true });
    setTimeout(puzzle, 600);
  };

  /* =============================== TREASURE MAP =============================== */
  Kido.activities.treasureMap = function (spec) {
    var d = cfg().difficulty, idx = 0, firstTry = 0;
    var ui = shell("tl-map", "🗺️ Treasure Map");
    var rounds = treasureRounds(d, null, rowsThatFit(ui, 47, 46));       // 46 px: the letter row and the map padding
    var map = U.el("div", { class: "tm-map" }), side = U.el("div", { class: "tm-side" });
    ui.stage.appendChild(map); ui.stage.appendChild(side);
    var nameOf = function (k) { var a = (Kido.content.animals || []).filter(function (x) { return x.key === k; })[0]; return a ? a.name.toLowerCase() : k; };

    function draw(n) {
      map.style.setProperty("--n", n);
      var h = '<div class="tm-corner">🧭</div>';
      for (var c = 0; c < n; c++) h += '<div class="tm-col">' + T.treasure.cols[c] + "</div>";
      for (var r = 0; r < n; r++) {
        h += '<div class="tm-row">' + (r + 1) + "</div>";
        for (c = 0; c < n; c++) h += '<button class="tm-cell" data-i="' + (r * n + c) + '" aria-label="' + T.treasure.cols[c] + (r + 1) + '"></button>';
      }
      map.innerHTML = h;
    }
    function round() {
      if (!ui.alive()) return;
      if (idx >= rounds.length) { Kido.engine.finish(spec, firstTry, rounds.length); return; }
      var rd = rounds[idx], tries = 0, busy = false, animal = Kido.creatures.get(rd.animal) || {};
      ui.status.textContent = (idx + 1) + " / " + rounds.length;
      draw(rd.n); side.innerHTML = "";
      var cells = map.querySelectorAll(".tm-cell");
      if (rd.mode === "put") {
        var line = T.treasure.put(nameOf(rd.animal), rd.name);
        ui.prompt.innerHTML = "🗺️ Put the " + nameOf(rd.animal) + " on <b>" + rd.name + "</b>";
        side.innerHTML = '<div class="tm-token">' + img(animal.img) + '</div><div class="tm-target">' + rd.name + "</div>";
        Kido.audio.speak(line);
        cells.forEach(function (cell) {
          cell.addEventListener("click", function () {
            if (busy) return;
            Kido.audio.unlock();
            var i = +cell.getAttribute("data-i");
            if (i === rd.cell) {
              busy = true; if (!tries) firstTry++;
              cell.innerHTML = img(animal.img); cell.classList.add("is-right");
              side.querySelector(".tm-token").classList.add("is-gone");
              Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(cell);
              wait(1100).then(function () { idx++; round(); });
            } else {
              tries++; Kido.fx.shake(cell); Kido.audio.playIncorrectSound();
              guide(rd);
              Kido.audio.speak(T.treasure.help(rd.name[0], rd.name.slice(1)));
            }
          });
        });
      } else {
        cells[rd.cell].innerHTML = img(animal.img); cells[rd.cell].classList.add("is-shown");
        ui.prompt.innerHTML = "🗺️ " + T.treasure.where(nameOf(rd.animal));
        Kido.audio.speak(T.treasure.where(nameOf(rd.animal)));
        rd.options.forEach(function (name) {
          var btn = U.el("button", { class: "tm-opt", html: name });
          btn.addEventListener("click", function () {
            if (busy || btn.classList.contains("is-wrong")) return;
            Kido.audio.unlock();
            if (name === rd.name) {
              busy = true; if (!tries) firstTry++;
              btn.classList.add("is-right"); Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(cells[rd.cell]);
              Promise.resolve(Kido.audio.speak(T.treasure.on(rd.name))).then(function () { return wait(500); }).then(function () { idx++; round(); });
            } else {
              tries++; btn.classList.add("is-wrong"); Kido.fx.shake(btn); Kido.audio.playIncorrectSound();
              guide(rd);
              Kido.audio.speak(T.treasure.help(rd.name[0], rd.name.slice(1)));
            }
          });
          side.appendChild(btn);
        });
      }
    }
    // light the column label and row label of the answer, and the cells between them
    function guide(rd) {
      var n = rd.n, r = (rd.cell / n) | 0, c = rd.cell % n;
      map.querySelectorAll(".is-guide").forEach(function (e) { e.classList.remove("is-guide"); });
      map.querySelectorAll(".tm-col")[c].classList.add("is-guide");
      map.querySelectorAll(".tm-row")[r].classList.add("is-guide");
      map.querySelectorAll(".tm-cell").forEach(function (cell) {
        var i = +cell.getAttribute("data-i");
        if ((i % n === c && ((i / n) | 0) <= r) || (((i / n) | 0) === r && i % n <= c)) cell.classList.add("is-guide");
      });
    }
    Kido.mascot.say("Let's read the treasure map! Letters go across, numbers go down.", { silent: true });
    setTimeout(round, 600);
  };

  /* =============================== LIGHT WIRES =============================== */
  Kido.activities.lightWires = function (spec) {
    var d = cfg().difficulty, boards = T.wires.boards(d), b = 0, clean = 0;
    var hintBtn = U.el("button", { class: "tl-hint", "aria-label": "Hint", html: "💡" });
    var ui = shell("tl-wires", "💡 Light Wires", hintBtn);
    var grid = U.el("div", { class: "lw-grid" });
    ui.stage.appendChild(grid);
    var pz, owner, wires, drawing, done, hinted, crossSaid;

    function puzzle() {
      if (!ui.alive()) return;
      if (b >= boards) { Kido.engine.finish(spec, clean, boards); return; }
      pz = wiresPuzzle(d, null, rowsThatFit(ui, 48, 26)); owner = {}; wires = pz.pairs.map(function () { return []; }); drawing = -1; done = {}; hinted = false; crossSaid = false;
      grid.__pz = pz;                                                    // read by automated checks only
      ui.status.textContent = (b + 1) + " / " + boards;
      grid.style.setProperty("--n", pz.n);
      grid.innerHTML = '<svg class="lw-svg" viewBox="0 0 ' + pz.n + " " + pz.n + '" aria-hidden="true"></svg>';
      for (var i = 0; i < pz.n * pz.n; i++) grid.appendChild(U.el("div", { class: "lw-cell", "data-i": i }));
      pz.pairs.forEach(function (p, k) {
        grid.children[p.a + 1].innerHTML = '<span class="lw-end lw-batt" style="--c:' + p.color[0] + '">🔋</span>';
        grid.children[p.b + 1].innerHTML = '<span class="lw-end lw-bulb" style="--c:' + p.color[0] + '">💡</span>';
        grid.children[p.a + 1].setAttribute("data-end", k); grid.children[p.b + 1].setAttribute("data-end", k);
      });
      paint();
      Kido.audio.speak(T.wires.ask);
    }
    function cellAt(x, y) { var e = document.elementFromPoint(x, y); e = e && e.closest(".lw-cell"); return e && grid.contains(e) ? +e.getAttribute("data-i") : -1; }
    function adj(p, q) { var n = pz.n; return Math.abs(((p / n) | 0) - ((q / n) | 0)) + Math.abs(p % n - q % n) === 1; }
    function endOf(i) { var e = grid.children[i + 1].getAttribute("data-end"); return e == null ? -1 : +e; }
    function clearWire(k) { wires[k].forEach(function (i) { if (owner[i] === k) delete owner[i]; }); wires[k] = []; delete done[k]; }
    function start(i) {
      var k = endOf(i);
      if (k >= 0) { clearWire(k); wires[k] = [i]; owner[i] = k; drawing = k; paint(); return true; }
      if (owner[i] != null) {                                            // carry on from the loose end of a wire
        var w = wires[owner[i]];
        if (w[w.length - 1] === i && !done[owner[i]]) { drawing = owner[i]; return true; }
      }
      return false;
    }
    function extend(i) {
      if (drawing < 0 || i < 0) return;
      var w = wires[drawing], last = w[w.length - 1];
      if (i === last) return;
      if (w.length > 1 && i === w[w.length - 2]) { delete owner[w.pop()]; delete done[drawing]; paint(); return; }   // step back
      if (done[drawing] || !adj(last, i)) return;
      var e = endOf(i);
      if ((owner[i] != null && owner[i] !== drawing) || (e >= 0 && e !== drawing)) {     // someone else's wire or end
        if (!crossSaid) { crossSaid = true; Kido.audio.speak(T.wires.cross); setTimeout(function () { crossSaid = false; }, 2500); }
        Kido.fx.shake(grid.children[i + 1]);
        return;
      }
      if (owner[i] === drawing) return;                                  // no loops
      w.push(i); owner[i] = drawing;
      var p = pz.pairs[drawing];
      if (e === drawing && i !== w[0]) { done[drawing] = true; finishWire(drawing); drawing = -1; }
      paint();
    }
    function finishWire(k) {
      var p = pz.pairs[k];
      grid.children[p.b + 1].querySelector(".lw-bulb").classList.add("is-lit");
      grid.children[p.a + 1].querySelector(".lw-batt").classList.add("is-lit");
      Kido.audio.playCorrectSound && Kido.audio.playCorrectSound();
      if (Object.keys(done).length === pz.pairs.length) {
        if (!hinted) clean++;
        Kido.fx.confetti(40);
        Promise.resolve(Kido.audio.speak(U.pick(T.wires.done))).then(function () { return wait(700); }).then(function () { b++; puzzle(); });
      } else Kido.audio.speak(T.wires.lit(p.color[1]));
    }
    function paint() {
      var svg = grid.querySelector(".lw-svg"), n = pz.n, s = "";
      wires.forEach(function (w, k) {
        if (w.length < 2) return;
        var pts = w.map(function (i) { return ((i % n) + 0.5) + "," + (((i / n) | 0) + 0.5); }).join(" ");
        s += '<polyline points="' + pts + '" stroke="' + pz.pairs[k].color[0] + '" class="' + (done[k] ? "is-done" : "") + '"/>';
      });
      svg.innerHTML = s;
      grid.querySelectorAll(".lw-bulb").forEach(function (e) { var k = endOf(+e.parentNode.getAttribute("data-i")); e.classList.toggle("is-lit", !!done[k]); });
    }
    // drag: press on a battery/bulb (or a loose wire end) and slide through the squares
    var dragged = false;                                               // the click that ends a drag is not a tap
    grid.addEventListener("pointerdown", function (e) {
      var i = cellAt(e.clientX, e.clientY); if (i < 0) return;
      Kido.audio.unlock(); dragged = false;
      if (start(i)) { e.preventDefault(); try { grid.setPointerCapture(e.pointerId); } catch (_) {} }
    });
    grid.addEventListener("pointermove", function (e) { if (drawing >= 0) { var i = cellAt(e.clientX, e.clientY), w = wires[drawing]; if (i >= 0 && i !== w[w.length - 1]) dragged = true; extend(i); } });
    grid.addEventListener("pointerup", function () { if (drawing >= 0 && !done[drawing]) { /* keep the loose wire: tap its end to carry on */ } drawing = -1; });
    // tap path: tap a battery, then tap the squares one by one (no dragging needed)
    grid.addEventListener("click", function (e) {
      if (dragged) { dragged = false; return; }
      var i = cellAt(e.clientX, e.clientY); if (i < 0) return;
      var k = endOf(i);
      if (k >= 0 && (wires[k].length === 0 || done[k])) { start(i); drawing = k; return; }
      var open = wires.map(function (w, j) { return j; }).filter(function (j) { return wires[j].length && !done[j] && adj(wires[j][wires[j].length - 1], i); })[0];
      if (open != null) { drawing = open; extend(i); if (!done[open]) drawing = -1; }
    });
    hintBtn.addEventListener("click", function () {
      if (!pz) return;
      var k = pz.pairs.findIndex(function (p, j) { return !done[j]; }); if (k < 0) return;
      hinted = true;
      clearWire(k);
      pz.pairs[k].solution.forEach(function (i) {
        if (owner[i] != null) clearWire(owner[i]);
      });
      wires[k] = pz.pairs[k].solution.slice(); wires[k].forEach(function (i) { owner[i] = k; });
      done[k] = true; paint(); finishWire(k);
    });
    Kido.mascot.say("Help light the lab! Draw a wire from each battery to its bulb.", { silent: true });
    setTimeout(puzzle, 600);
  };
})(window);
