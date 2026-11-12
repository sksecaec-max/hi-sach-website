/* =========================================================================
   thinkLab4.js — Think Lab batch 4 (content: js/data/thinkLab.js)
     Kido.activities.rocketRoute(spec)  Rocket Route  — plan arrow moves on a grid (pick a route, or build the program)
     Kido.activities.kidoMarket(spec)   Kido Market   — pay the exact price with rupee coins (later: with the fewest coins)
     Kido.activities.snailTrail(spec)   Snail Trail   — draw a figure in one go, never along the same line twice
     Kido.activities.colourStudio(spec) Colour Studio — tap a colour, tap a part of a Kido picture to fill it
   Generators are pure (Kido.thinkLab.gen4) and checked by scripts/thinklab-check.mjs.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var T = Kido.thinkLab;
  Kido.activities = Kido.activities || {};

  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function lvl(table, d) { return table[Math.max(1, Math.min(7, d))]; }

  /* ---------------- Rocket Route ---------------- */
  var STEP = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }, ARROW = { up: "⬆", down: "⬇", left: "⬅", right: "➡" };
  /** Run a program from start: { at, path, result: "goal" | "rock" | "off" | "short" | "past" }. */
  function runRoute(pz, prog) {
    var at = pz.start.slice(), path = [at.slice()];
    for (var i = 0; i < prog.length; i++) {
      var s = STEP[prog[i]], r = at[0] + s[0], c = at[1] + s[1];
      if (r < 0 || r >= pz.R || c < 0 || c >= pz.C) return { at: at, path: path, result: "off", step: i };
      at = [r, c]; path.push(at.slice());
      if (pz.rocks.some(function (k) { return k[0] === r && k[1] === c; })) return { at: at, path: path, result: "rock", step: i };
      if (r === pz.goal[0] && c === pz.goal[1]) return { at: at, path: path, result: i === prog.length - 1 ? "goal" : "past", step: i };
    }
    return { at: at, path: path, result: "short", step: prog.length };
  }
  function routePuzzle(d, rnd) {
    rnd = rnd || Math.random;
    var L = lvl(T.rocket.levels, d), R = L[0], C = L[1];
    for (var attempt = 0; attempt < 400; attempt++) {
      var start = [(rnd() * R) | 0, (rnd() * C) | 0], len = L[2] + ((rnd() * (L[3] - L[2] + 1)) | 0);
      var prog = [], at = start.slice(), seen = {}; seen[at.join()] = true;
      for (var k = 0; k < len; k++) {
        var opts = Object.keys(STEP).filter(function (dir) {
          var r = at[0] + STEP[dir][0], c = at[1] + STEP[dir][1];
          return r >= 0 && r < R && c >= 0 && c < C && !seen[r + "," + c];
        });
        if (!opts.length) break;
        var dir = opts[(rnd() * opts.length) | 0]; prog.push(dir);
        at = [at[0] + STEP[dir][0], at[1] + STEP[dir][1]]; seen[at.join()] = true;
      }
      if (prog.length < L[2]) continue;
      var free = [];
      for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (!seen[r + "," + c]) free.push([r, c]);
      var rocks = shuffle(free, rnd).slice(0, L[4]);
      var pz = { R: R, C: C, start: start, goal: at, rocks: rocks, answer: prog, build: L[5] };
      if (runRoute(pz, prog).result !== "goal") continue;
      if (!pz.build) {                                    // two wrong routes that look close (one changed or swapped step)
        var wrong = [], tries = 0;
        while (wrong.length < 2 && tries++ < 60) {
          var w = prog.slice(), i = (rnd() * w.length) | 0;
          if (rnd() < 0.5 && w.length > 1) { var j = (i + 1) % w.length, t = w[i]; w[i] = w[j]; w[j] = t; }
          else w[i] = shuffle(Object.keys(STEP).filter(function (x) { return x !== w[i]; }), rnd)[0];
          if (runRoute(pz, w).result === "goal" || w.join() === prog.join() || wrong.some(function (x) { return x.join() === w.join(); })) continue;
          wrong.push(w);
        }
        if (wrong.length < 2) continue;
        pz.options = shuffle([prog].concat(wrong), rnd);
      }
      return pz;
    }
    return null;
  }

  /* ---------------- Kido Market ---------------- */
  function fewestCoins(price, coins) {             // greedy is exact for 1, 2, 5, 10
    var n = 0, left = price;
    coins.slice().sort(function (a, b) { return b - a; }).forEach(function (c) { n += Math.floor(left / c); left %= c; });
    return left ? Infinity : n;
  }
  function marketRounds(d, rnd) {
    rnd = rnd || Math.random;
    var L = lvl(T.market.levels, d), k = T.market.rounds(d), goods = shuffle(T.market.goods, rnd);
    return Array.from({ length: k }, function (_, i) {
      var price = L[0] + ((rnd() * (L[1] - L[0] + 1)) | 0);
      return { item: goods[i % goods.length], price: price, coins: L[2], fewest: L[3] ? fewestCoins(price, L[2]) : 0 };
    });
  }

  /* ---------------- Snail Trail ---------------- */
  function degrees(fig) { var d = fig.dots.map(function () { return 0; }); fig.lines.forEach(function (l) { d[l[0]]++; d[l[1]]++; }); return d; }
  function eulerStart(fig) {                          // an odd dot if there are two, else any dot
    var deg = degrees(fig), odd = deg.map(function (v, i) { return v % 2 ? i : -1; }).filter(function (i) { return i >= 0; });
    return odd.length ? odd[0] : 0;
  }
  function hasEulerPath(fig) {
    var deg = degrees(fig), odd = deg.filter(function (v) { return v % 2; }).length;
    if (odd !== 0 && odd !== 2) return false;
    var seen = {}, stack = [0]; seen[0] = true;       // connected
    while (stack.length) { var v = stack.pop(); fig.lines.forEach(function (l) { var o = l[0] === v ? l[1] : l[1] === v ? l[0] : -1; if (o >= 0 && !seen[o]) { seen[o] = true; stack.push(o); } }); }
    return Object.keys(seen).length === fig.dots.length;
  }
  function snailFigures(d, rnd) {
    rnd = rnd || Math.random;
    var cap = d <= 2 ? 2 : d <= 4 ? 3 : 4;
    var pool = T.snail.figures.filter(function (f) { return f.level <= cap; });
    return shuffle(pool, rnd).slice(0, Math.min(T.snail.count(d), pool.length)).sort(function (a, b) { return a.level - b.level; });
  }

  T.gen4 = { runRoute: runRoute, routePuzzle: routePuzzle, fewestCoins: fewestCoins, marketRounds: marketRounds,
             degrees: degrees, eulerStart: eulerStart, hasEulerPath: hasEulerPath, snailFigures: snailFigures };

  /* ---------------- Colour Studio pictures (drawn for Kido; every <path class="cz"> is a part to colour) ---------------- */
  var PICTURES = [
    { name: "House", svg: '<path class="cz" d="M20 55 H80 V92 H20 Z"/><path class="cz" d="M14 57 L50 22 L86 57 Z"/><path class="cz" d="M43 70 H57 V92 H43 Z"/>' +
      '<path class="cz" d="M26 62 H38 V74 H26 Z"/><path class="cz" d="M62 62 H74 V74 H62 Z"/><path class="cz" d="M66 30 H74 V44 L66 38 Z"/><path class="cz" d="M0 92 H100 V100 H0 Z"/>' },
    { name: "Fish", svg: '<path class="cz" d="M18 50 C30 25 62 22 74 50 C62 78 30 75 18 50 Z"/><path class="cz" d="M74 50 L94 32 V68 Z"/>' +
      '<path class="cz" d="M40 30 C46 18 56 20 58 30 Z"/><path class="cz" d="M42 70 C46 80 54 80 56 70 Z"/><circle class="cz" cx="30" cy="46" r="5"/>' +
      '<path class="cz" d="M46 34 C52 44 52 56 46 66 C42 56 42 44 46 34 Z"/>' },
    { name: "Butterfly", svg: '<path class="cz" d="M50 30 C30 5 6 14 10 34 C14 50 36 50 50 46 Z"/><path class="cz" d="M50 30 C70 5 94 14 90 34 C86 50 64 50 50 46 Z"/>' +
      '<path class="cz" d="M50 52 C32 52 16 62 22 78 C30 92 46 80 50 64 Z"/><path class="cz" d="M50 52 C68 52 84 62 78 78 C70 92 54 80 50 64 Z"/>' +
      '<path class="cz" d="M46 26 C46 20 54 20 54 26 V76 C54 82 46 82 46 76 Z"/><circle class="cz" cx="26" cy="30" r="6"/><circle class="cz" cx="74" cy="30" r="6"/>' },
    { name: "Rocket", svg: '<path class="cz" d="M50 6 C66 20 68 46 64 70 H36 C32 46 34 20 50 6 Z"/><circle class="cz" cx="50" cy="38" r="9"/>' +
      '<path class="cz" d="M36 52 L20 74 L36 70 Z"/><path class="cz" d="M64 52 L80 74 L64 70 Z"/><path class="cz" d="M40 70 H60 L56 80 H44 Z"/>' +
      '<path class="cz" d="M44 80 C44 92 50 98 50 98 C50 98 56 92 56 80 Z"/>' },
    { name: "Flower", svg: '<circle class="cz" cx="50" cy="16" r="12"/><circle class="cz" cx="70" cy="30" r="12"/><circle class="cz" cx="62" cy="52" r="12"/>' +
      '<circle class="cz" cx="38" cy="52" r="12"/><circle class="cz" cx="30" cy="30" r="12"/><circle class="cz" cx="50" cy="35" r="10"/>' +
      '<path class="cz" d="M47 62 H53 V96 H47 Z"/><path class="cz" d="M53 80 C64 66 78 70 78 72 C70 82 60 84 53 84 Z"/><path class="cz" d="M47 76 C36 64 22 68 22 70 C30 80 40 82 47 80 Z"/>' },
    { name: "Car", svg: '<path class="cz" d="M10 58 H90 V76 H10 Z"/><path class="cz" d="M26 58 L36 38 H66 L76 58 Z"/><path class="cz" d="M38 42 H50 V56 H31 Z"/>' +
      '<path class="cz" d="M53 42 H64 L71 56 H53 Z"/><circle class="cz" cx="28" cy="78" r="10"/><circle class="cz" cx="72" cy="78" r="10"/><path class="cz" d="M84 62 H90 V68 H84 Z"/>' }
  ];
  T.colourPictures = PICTURES;

  /** Every fixed line batch 4 can say (for scripts/voice/harvest.js). */
  T.lines4 = function () {
    var R = T.rocket, M = T.market, S = T.snail, C = T.colour;
    var out = [R.pick, R.build, R.bump, R.short, R.off, R.wrong, M.fewest, M.fewer, S.ask, S.stuck, S.startHere, S.noLine, S.used, C.ask]
      .concat(R.done, M.done, S.done, C.done);
    Object.keys(R.dirs).forEach(function (k) { out.push(R.dirs[k]); });
    C.names.forEach(function (n) { out.push(C.pick(n)); });
    var names = {}; M.goods.forEach(function (g) { var c = Kido.creatures && Kido.creatures.get(g); names[g] = (c && c.name || g).toLowerCase(); });
    M.goods.forEach(function (g) { for (var p = 1; p <= 30; p++) out.push(M.ask(names[g], p)[0]); });
    out.push(M.ask("x", 2)[1]);
    for (var q = 1; q <= 40; q++) out.push(M.tooMuch(q, 1)[0], M.tooFew(q, 2)[0]);
    for (var p = 1; p <= 30; p++) out.push(M.tooMuch(40, p)[1], M.tooFew(0, p)[1]);
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
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rowsThatFit(ui, perCell, extra) {
    var top = ui.stage.getBoundingClientRect().top;
    return Math.max(3, Math.floor((window.innerHeight - top - 12 - extra) / perCell));
  }

  /* =============================== ROCKET ROUTE =============================== */
  Kido.activities.rocketRoute = function (spec) {
    var d = cfg().difficulty, R = T.rocket, rounds = R.rounds(d), idx = 0, clean = 0;
    var ui = shell("tl-rocket", "🚀 Rocket Route");
    var space = U.el("div", { class: "rr-space" }), side = U.el("div", { class: "rr-side" });
    ui.stage.appendChild(space); ui.stage.appendChild(side);

    function round() {
      if (!ui.alive()) return;
      if (idx >= rounds) { Kido.engine.finish(spec, clean, rounds); return; }
      var pz = routePuzzle(d), mistakes = 0, busy = false, prog = [];
      var maxRows = rowsThatFit(ui, 46, innerHeight > innerWidth ? 150 : 8);   // portrait: the arrow pad sits below the sky
      for (var dd = d - 1; pz.R > maxRows && dd >= 1; dd--) pz = routePuzzle(dd);   // short phone: a smaller sky
      space.__pz = pz;                                                 // read by automated checks only
      ui.status.textContent = (idx + 1) + " / " + rounds;
      space.style.setProperty("--rows", pz.R); space.style.setProperty("--cols", pz.C);
      var html = "";
      for (var r = 0; r < pz.R; r++) for (var c = 0; c < pz.C; c++) {
        var rock = pz.rocks.some(function (k) { return k[0] === r && k[1] === c; });
        var goal = pz.goal[0] === r && pz.goal[1] === c;
        html += '<div class="rr-cell" data-rc="' + r + "," + c + '">' + (rock ? '<span class="rr-rock">🪨</span>' : goal ? '<span class="rr-planet">🪐</span>' : "") + "</div>";
      }
      space.innerHTML = html + '<svg class="rr-trail" viewBox="0 0 ' + pz.C + " " + pz.R + '" preserveAspectRatio="none"><polyline points=""/></svg><div class="rr-ship">🚀</div>';
      placeShip(pz.start, true);
      side.innerHTML = "";
      if (!pz.build) {
        ui.prompt.innerHTML = "🚀 " + R.pick;
        pz.options.forEach(function (o) {
          var btn = U.el("button", { class: "rr-route", "aria-label": o.join(" "), html: o.map(function (s) { return "<b>" + ARROW[s] + "</b>"; }).join("") });
          btn.addEventListener("click", function () { if (!busy && !btn.classList.contains("is-wrong")) fly(o, btn); });
          side.appendChild(btn);
        });
        Kido.audio.speak(R.pick);
      } else {
        ui.prompt.innerHTML = "🚀 " + R.build;
        var strip = U.el("div", { class: "rr-prog", "aria-live": "polite" });
        var pad = U.el("div", { class: "rr-pad" });
        ["up", "left", "right", "down"].forEach(function (s) {
          var b = U.el("button", { class: "rr-key rr-key--" + s, "aria-label": s, html: ARROW[s] });
          b.addEventListener("click", function () { if (busy || prog.length >= 10) return; prog.push(s); paint(); Kido.audio.playTapSound && Kido.audio.playTapSound(); });
          pad.appendChild(b);
        });
        var undo = U.el("button", { class: "rr-undo", "aria-label": "Undo", html: "↩" }), go = U.el("button", { class: "rr-go", html: "Go!" });
        undo.addEventListener("click", function () { if (!busy) { prog.pop(); paint(); } });
        go.addEventListener("click", function () { if (!busy && prog.length) fly(prog.slice(), null); });
        side.appendChild(strip); side.appendChild(pad); side.appendChild(U.el("div", { class: "rr-act" }, [undo, go]));
        function paint() { strip.innerHTML = prog.map(function (s) { return "<b>" + ARROW[s] + "</b>"; }).join("") || '<i class="rr-hint">…</i>'; }
        paint();
        Kido.audio.speak(R.build);
      }
      function placeShip(p, instant) {
        var ship = space.querySelector(".rr-ship"); ship.style.transition = instant ? "none" : "";
        ship.style.left = ((p[1] + 0.5) / pz.C * 100) + "%"; ship.style.top = ((p[0] + 0.5) / pz.R * 100) + "%";
      }
      function fly(o, btn) {
        busy = true; Kido.audio.unlock();
        var run = runRoute(pz, o), i = 0, line = space.querySelector(".rr-trail polyline");
        (function step() {
          if (!ui.alive()) return;
          var p = run.path[i];
          placeShip(p);
          line.setAttribute("points", run.path.slice(0, i + 1).map(function (q) { return (q[1] + 0.5) + "," + (q[0] + 0.5); }).join(" "));
          if (++i < run.path.length) { setTimeout(step, 380); return; }
          setTimeout(function () { land(run, btn); }, 380);
        })();
      }
      function land(run, btn) {
        if (run.result === "goal") {
          if (!mistakes) clean++;
          Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(space.querySelector(".rr-ship"));
          Promise.resolve(Kido.audio.speak(U.pick(R.done))).then(function () { return wait(500); }).then(function () { idx++; round(); });
          return;
        }
        mistakes++; Kido.audio.playIncorrectSound();
        var cell = space.querySelector('[data-rc="' + run.at.join() + '"]'); if (cell) Kido.fx.shake(cell);
        if (btn) { btn.classList.add("is-wrong"); Kido.audio.speak(R.wrong); }
        else Kido.audio.speak(run.result === "rock" ? R.bump : run.result === "off" ? R.off : run.result === "short" ? R.short : R.wrong);
        setTimeout(function () {                                       // back to the start and try again
          if (!ui.alive()) return;
          placeShip(pz.start, true); space.querySelector(".rr-trail polyline").setAttribute("points", ""); busy = false;
        }, 1500);
      }
    }
    Kido.mascot.say("Be the rocket pilot! Plan the route to the planet.", { silent: true });
    setTimeout(round, 600);
  };

  /* =============================== KIDO MARKET =============================== */
  function coinSvg(v) {
    var big = v >= 10, fill = v === 1 ? "#D1D5DB" : v === 2 ? "#E5E7EB" : v === 5 ? "#FCD34D" : "#FBBF24";
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="' + fill + '" stroke="#92400E" stroke-width="4"/>' +
      '<circle cx="50" cy="50" r="36" fill="none" stroke="rgba(146,64,14,.35)" stroke-width="3" stroke-dasharray="4 5"/>' +
      '<text x="50" y="' + (big ? 62 : 64) + '" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="' + (big ? 34 : 40) + '" fill="#78350F">₹' + v + "</text></svg>";
  }
  Kido.activities.kidoMarket = function (spec) {
    var d = cfg().difficulty, M = T.market, rounds = marketRounds(d), idx = 0, clean = 0;
    var ui = shell("tl-market", "🛒 Kido Market");
    var stall = U.el("div", { class: "km-stall" }), purse = U.el("div", { class: "km-purse" });
    ui.stage.appendChild(stall); ui.stage.appendChild(purse);
    var nameOf = function (k) { var c = Kido.creatures.get(k); return (c && c.name || k).toLowerCase(); };

    function round() {
      if (!ui.alive()) return;
      if (idx >= rounds.length) { Kido.engine.finish(spec, clean, rounds.length); return; }
      var rd = rounds[idx], paid = [], mistakes = 0, busy = false, item = Kido.creatures.get(rd.item) || {};
      ui.status.textContent = (idx + 1) + " / " + rounds.length;
      stall.innerHTML = '<div class="km-item"><img src="' + (item.img || "") + '" alt="" draggable="false"/><div class="km-tag">₹' + rd.price + "</div></div>" +
        '<div class="km-tray" aria-label="Coins paid"></div><div class="km-sum"></div><button class="km-pay">Pay</button>';
      purse.innerHTML = "";
      rd.coins.forEach(function (v) {
        var b = U.el("button", { class: "km-coin", "aria-label": v + " rupees", html: coinSvg(v) });
        b.addEventListener("click", function () { if (busy || paid.length >= 14) return; Kido.audio.unlock(); paid.push(v); paint(); Kido.audio.playTapSound && Kido.audio.playTapSound(); });
        purse.appendChild(b);
      });
      var tray = stall.querySelector(".km-tray"), sum = stall.querySelector(".km-sum");
      function paint() {
        tray.innerHTML = "";
        paid.forEach(function (v, i) {
          var c = U.el("button", { class: "km-coin km-coin--paid", "aria-label": "Take back " + v, html: coinSvg(v) });
          c.addEventListener("click", function () { if (!busy) { paid.splice(i, 1); paint(); } });
          tray.appendChild(c);
        });
        var total = paid.reduce(function (a, b) { return a + b; }, 0);
        sum.textContent = "₹" + total + " / ₹" + rd.price;
        sum.classList.toggle("is-even", total === rd.price);
      }
      paint();
      stall.querySelector(".km-pay").addEventListener("click", function () {
        if (busy) return;
        var total = paid.reduce(function (a, b) { return a + b; }, 0);
        if (total === rd.price && (!rd.fewest || paid.length <= rd.fewest)) {
          busy = true; if (!mistakes) clean++;
          Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(stall.querySelector(".km-item"));
          stall.querySelector(".km-item").classList.add("is-bought");
          Promise.resolve(Kido.audio.speak(U.pick(M.done))).then(function () { return wait(500); }).then(function () { idx++; round(); });
          return;
        }
        mistakes++; Kido.audio.playIncorrectSound(); Kido.fx.shake(tray);
        if (total === rd.price) Kido.audio.speak(M.fewer);
        else { var parts = total > rd.price ? M.tooMuch(total, rd.price) : M.tooFew(total, rd.price); Kido.mascot.say(parts.join(" "), { parts: parts }); }
      });
      var parts = M.ask(nameOf(rd.item), rd.price).concat(rd.fewest ? [M.fewest] : []);
      Kido.mascot.say(parts.join(" "), { parts: parts });
    }
    Kido.mascot.say("Welcome to the market! Pay with your coins.", { silent: true });
    setTimeout(round, 600);
  };

  /* =============================== SNAIL TRAIL =============================== */
  Kido.activities.snailTrail = function (spec) {
    var d = cfg().difficulty, S = T.snail, figs = snailFigures(d), idx = 0, clean = 0;
    var ui = shell("tl-snail", "🐌 Snail Trail");
    var board = U.el("div", { class: "st-board" });
    ui.stage.appendChild(board);

    function figure() {
      if (!ui.alive()) return;
      if (idx >= figs.length) { Kido.engine.finish(spec, clean, figs.length); return; }
      var fig = figs[idx], used = {}, at = -1, path = [], mistakes = 0, busy = false, startDot = eulerStart(fig);
      board.__fig = fig;                                                 // read by automated checks only
      ui.status.textContent = (idx + 1) + " / " + figs.length;
      var s = '<svg viewBox="-6 -6 112 112" class="st-svg">';
      fig.lines.forEach(function (l, i) {
        var a = fig.dots[l[0]], b = fig.dots[l[1]];
        s += '<line class="st-line" data-l="' + i + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/>';
      });
      s += '<polyline class="st-trail" points=""/>';
      fig.dots.forEach(function (p, i) { s += '<g class="st-dot" data-d="' + i + '" role="button" tabindex="0" aria-label="Dot ' + (i + 1) + '"><circle class="st-hit" cx="' + p[0] + '" cy="' + p[1] + '" r="12"/><circle class="st-pin" cx="' + p[0] + '" cy="' + p[1] + '" r="3.6"/></g>'; });
      board.innerHTML = s + '</svg><div class="st-snail">🐌</div>';
      glow(true);
      // tap dots one by one, or slide a finger from dot to dot (found under the finger: touch keeps the first target)
      function dotAt(e) { var t = document.elementFromPoint(e.clientX, e.clientY), g = t && t.closest(".st-dot"); return g && board.contains(g) ? +g.getAttribute("data-d") : -1; }
      board.onpointerdown = function (e) { var i = dotAt(e); if (i < 0) return; e.preventDefault(); try { board.releasePointerCapture(e.pointerId); } catch (_) {} tap(i, false); };
      board.onpointermove = function (e) { if (!e.buttons && e.pointerType === "mouse") return; var i = dotAt(e); if (i >= 0 && i !== at) tap(i, true); };
      board.querySelectorAll(".st-dot").forEach(function (g) {
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(+g.getAttribute("data-d"), false); } });
      });
      Kido.audio.speak(S.ask);

      function glow(on) { var g = board.querySelector('.st-dot[data-d="' + startDot + '"]'); if (g) g.classList.toggle("is-start", on); }
      function lineBetween(a, b) { for (var i = 0; i < fig.lines.length; i++) { var l = fig.lines[i]; if ((l[0] === a && l[1] === b) || (l[0] === b && l[1] === a)) return i; } return -1; }
      function moveSnail(i) {
        var p = fig.dots[i], sn = board.querySelector(".st-snail");
        sn.style.left = ((p[0] + 6) / 112 * 100) + "%"; sn.style.top = ((p[1] + 6) / 112 * 100) + "%";
      }
      function tap(i, slide) {
        if (busy) return;
        Kido.audio.unlock();
        if (at < 0) {
          if (slide) return;
          if (i !== startDot && degrees(fig).filter(function (v) { return v % 2; }).length && degrees(fig)[i] % 2 === 0) {
            mistakes++; Kido.audio.speak(S.startHere); Kido.fx.shake(board.querySelector('.st-dot[data-d="' + startDot + '"]')); return;
          }
          at = i; path = [i]; glow(false); board.querySelector('.st-dot[data-d="' + i + '"]').classList.add("is-on"); moveSnail(i); draw(); return;
        }
        if (i === at) return;
        var li = lineBetween(at, i);
        if (li < 0) { if (!slide) Kido.audio.speak(S.noLine); return; }                 // sliding past other dots is fine
        if (used[li]) { if (slide) return; mistakes++; Kido.audio.playIncorrectSound(); Kido.audio.speak(S.used); return; }
        used[li] = true; at = i; path.push(i);
        board.querySelector('.st-line[data-l="' + li + '"]').classList.add("is-done");
        board.querySelector('.st-dot[data-d="' + i + '"]').classList.add("is-on");
        moveSnail(i); draw();
        Kido.audio.playTapSound && Kido.audio.playTapSound();
        if (Object.keys(used).length === fig.lines.length) {
          busy = true; if (!mistakes) clean++;
          Kido.audio.playCorrectSound(); Kido.fx.confetti(32);
          Promise.resolve(Kido.audio.speak(U.pick(S.done))).then(function () { return wait(600); }).then(function () { idx++; figure(); });
          return;
        }
        // stuck: no unused line from here
        var more = fig.lines.some(function (l, k) { return !used[k] && (l[0] === at || l[1] === at); });
        if (!more) {
          mistakes++; busy = true; Kido.audio.playIncorrectSound(); Kido.audio.speak(S.stuck);
          setTimeout(function () { if (!ui.alive()) return; busy = false; reset(); }, 1800);
        }
      }
      function draw() {
        board.querySelector(".st-trail").setAttribute("points", path.map(function (k) { return fig.dots[k].join(","); }).join(" "));
      }
      function reset() {
        used = {}; at = -1; path = []; draw(); glow(true);
        board.querySelectorAll(".is-done, .is-on").forEach(function (e) { e.classList.remove("is-done", "is-on"); });
        var sn = board.querySelector(".st-snail"); sn.style.left = sn.style.top = "";
      }
    }
    Kido.mascot.say("Draw the picture in one go, like a snail leaving a trail!", { silent: true });
    setTimeout(figure, 600);
  };

  /* =============================== COLOUR STUDIO =============================== */
  Kido.activities.colourStudio = function (spec) {
    var C = T.colour, pics = PICTURES.slice(), idx = 0, colour = 0;
    var ui = shell("tl-colour", "🎨 Colour Studio");
    var canvas = U.el("div", { class: "cs-canvas" }), pal = U.el("div", { class: "cs-palette" });
    var next = U.el("button", { class: "cs-done", html: "Done ✓" });
    ui.stage.appendChild(canvas); ui.stage.appendChild(U.el("div", { class: "cs-side" }, [pal, next]));
    C.palette.forEach(function (hex, i) {
      var b = U.el("button", { class: "cs-swatch" + (i === 0 ? " is-on" : ""), "aria-label": C.names[i], style: "background:" + hex });
      b.addEventListener("click", function () {
        colour = i; pal.querySelectorAll(".is-on").forEach(function (e) { e.classList.remove("is-on"); }); b.classList.add("is-on");
        Kido.audio.unlock(); Kido.audio.speak(C.pick(C.names[i]));
      });
      pal.appendChild(b);
    });
    var shown = 0, done = 0;
    function picture() {
      if (!ui.alive()) return;
      var p = pics[idx % pics.length];
      ui.status.textContent = (shown + 1) + " / 3";
      canvas.innerHTML = '<svg viewBox="0 0 100 100" aria-label="' + p.name + '">' + p.svg + "</svg>";
      canvas.querySelectorAll(".cz").forEach(function (z) {
        z.setAttribute("fill", "#FFFFFF");
        z.addEventListener("click", function () {
          z.setAttribute("fill", C.palette[colour]);
          z.classList.remove("cz--pop"); void z.getBoundingClientRect(); z.classList.add("cz--pop");
          Kido.audio.playTapSound && Kido.audio.playTapSound();
        });
      });
    }
    next.addEventListener("click", function () {
      var filled = Array.prototype.filter.call(canvas.querySelectorAll(".cz"), function (z) { return z.getAttribute("fill") !== "#FFFFFF"; }).length;
      if (filled) done++;
      Kido.fx.sparkleEl(canvas);
      Promise.resolve(Kido.audio.speak(U.pick(C.done))).then(function () {
        if (!ui.alive()) return;
        shown++; idx++;
        if (shown >= 3) Kido.engine.finish(spec, Math.max(1, done), 3);   // creative play: never fewer than one star
        else picture();
      });
    });
    idx = (Math.random() * pics.length) | 0;
    picture();
    Kido.audio.speak(C.ask);
  };
})(window);
