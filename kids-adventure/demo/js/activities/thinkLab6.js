/* =========================================================================
   thinkLab6.js — Think Lab batch 6 (content: js/data/thinkLab.js)
     Kido.activities.thermoCheck(spec)  Weather Thermometer — pick the thermometer that fits the weather; older: order them
     Kido.activities.planetSums(spec)   Planet Sums  — each monster's number is the answer to one planet's sum
     Kido.activities.pictureSums(spec)  Picture Sums — an addition table whose pieces make an animal photo
     Kido.activities.clockMatch(spec)   Clock Match  — read the clock face, find the same digital time
     Kido.activities.fruitChart(spec)   Fruit Chart  — read a bar chart: most, fewest, how many, how many more
     Kido.activities.cubeCount(spec)    Block Count  — count blocks (younger) or the blocks that were added (older)
     Kido.activities.pizzaMaker(spec)   Pizza Maker  — finish the recipe: add the missing toppings, then bake
   Generators are pure (Kido.thinkLab.gen6) and checked by scripts/thinklab-check.mjs. All art is drawn in code
   (fruit and animal photos are Kido's own).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var T = Kido.thinkLab;
  Kido.activities = Kido.activities || {};

  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function between(lo, hi, rnd) { return lo + ((rnd() * (hi - lo + 1)) | 0); }
  /** n distinct numbers near `answer` (all >= min), the answer among them. */
  function numberChoices(answer, n, min, rnd) {
    var set = [answer], d = 1;
    while (set.length < n) {
      [answer + d, answer - d].forEach(function (v) { if (set.length < n && v >= min && set.indexOf(v) < 0 && rnd() < 0.8) set.push(v); });
      d++;
      if (d > 30) break;
    }
    return shuffle(set, rnd);
  }

  /* ---------------- generators ---------------- */
  var WEATHER = ["snow", "rain", "spring", "hot"];
  function thermoRound(d, rnd) {
    rnd = rnd || Math.random;
    var W = T.thermo.weather;
    function temp(k) { return between(W[k][0], W[k][1], rnd); }
    if (d >= 5) {
      var kinds = shuffle(WEATHER, rnd).slice(0, 3);
      var temps = kinds.map(temp);
      return { mode: "order", temps: temps, order: temps.slice().sort(function (a, b) { return a - b; }) };
    }
    var n = d <= 2 ? 2 : 3, kind = WEATHER[(rnd() * 4) | 0];
    var others = shuffle(WEATHER.filter(function (k) { return k !== kind; }), rnd).slice(0, n - 1);
    var opts = shuffle([kind].concat(others), rnd).map(function (k) { return { kind: k, temp: temp(k) }; });
    return { mode: "pick", kind: kind, options: opts, answer: opts.findIndex(function (o) { return o.kind === kind; }) };
  }

  function planetRound(d, rnd) {
    rnd = rnd || Math.random;
    var n = 3;
    for (var attempt = 0; attempt < 200; attempt++) {
      var out = [];
      for (var i = 0; i < n; i++) {
        var minus = d >= 5 && rnd() < 0.4, a, b, ans;
        if (minus) { a = between(d >= 7 ? 10 : 4, d >= 7 ? 20 : 10, rnd); b = between(1, a - 2, rnd); ans = a - b; }
        else { var top = d <= 2 ? 5 : d <= 4 ? 10 : 20; ans = between(d >= 5 ? 6 : 2, top, rnd); a = between(1, ans - 1, rnd); b = ans - a; }
        out.push({ a: a, b: b, op: minus ? "-" : "+", ans: ans });
      }
      if (new Set(out.map(function (p) { return p.ans; })).size === n) return { planets: out, monsters: shuffle(out.map(function (p) { return p.ans; }), rnd) };
    }
    return null;
  }

  function pictureGrid(d, rnd) {
    rnd = rnd || Math.random;
    var R = d <= 2 ? 2 : d <= 4 ? 2 : 3, C = d <= 2 ? 2 : 3, max = d <= 2 ? 3 : d <= 4 ? 5 : 9;
    for (var attempt = 0; attempt < 300; attempt++) {
      var rows = shuffle(Array.from({ length: max }, function (_, i) { return i + 1; }), rnd).slice(0, R);
      var cols = shuffle(Array.from({ length: max }, function (_, i) { return i + 1; }), rnd).slice(0, C);
      var sums = [];
      rows.forEach(function (r) { cols.forEach(function (c) { sums.push(r + c); }); });
      if (new Set(sums).size === sums.length) return { R: R, C: C, rows: rows, cols: cols, sums: sums };
    }
    return null;
  }

  function clockRound(d, rnd) {
    rnd = rnd || Math.random;
    var mins = d <= 2 ? [0] : d <= 4 ? [0, 30] : d <= 6 ? [0, 15, 30, 45] : Array.from({ length: 12 }, function (_, i) { return i * 5; });
    var n = d <= 2 ? 3 : 4, seen = {}, opts = [];
    while (opts.length < n) {
      var t = { h: between(1, 12, rnd), m: mins[(rnd() * mins.length) | 0] };
      if (opts.length && rnd() < 0.5) t.h = opts[0].h;                // decoys often share the hour: read the minute hand too
      if (opts.length && rnd() < 0.3 && mins.length > 1) t.m = opts[0].m;
      var k = t.h + ":" + t.m;
      if (!seen[k]) { seen[k] = true; opts.push(t); }
    }
    return { time: opts[0], options: shuffle(opts, rnd) };
  }

  function chartRound(d, rnd) {
    rnd = rnd || Math.random;
    var k = d <= 2 ? 3 : 4, max = d <= 2 ? 5 : 8;
    var fruits = shuffle(T.chart.fruits, rnd).slice(0, k);
    var counts = shuffle(Array.from({ length: max }, function (_, i) { return i + 1; }), rnd).slice(0, k);  // all different
    var kinds = d <= 2 ? ["most", "fewest"] : d <= 4 ? ["most", "fewest", "howMany"] : ["most", "fewest", "howMany", "more"];
    var kind = kinds[(rnd() * kinds.length) | 0], q = { kind: kind };
    if (kind === "most") q.answer = counts.indexOf(Math.max.apply(null, counts));
    else if (kind === "fewest") q.answer = counts.indexOf(Math.min.apply(null, counts));
    else if (kind === "howMany") { q.of = (rnd() * k) | 0; q.answer = counts[q.of]; q.options = numberChoices(q.answer, 4, 1, rnd); }
    else {
      var i = counts.indexOf(Math.max.apply(null, counts)), j = (i + 1 + ((rnd() * (k - 1)) | 0)) % k;
      q.a = i; q.b = j; q.answer = counts[i] - counts[j]; q.options = numberChoices(q.answer, 4, 1, rnd);
    }
    return { fruits: fruits, counts: counts, max: max, q: q };
  }

  /** Blocks on a small grid. heights[y][x]; added: list of [x, y, z] for the light blocks. */
  function cubeRound(d, rnd) {
    rnd = rnd || Math.random;
    if (d <= 2) {
      var n = between(2, d <= 1 ? 4 : 5, rnd), cells = shuffle([0, 1, 2, 3, 4, 5], rnd).slice(0, n);
      var h = [[0, 0, 0], [0, 0, 0]]; cells.forEach(function (c) { h[(c / 3) | 0][c % 3] = 1; });
      return { mode: "count", before: null, after: h, added: [], answer: n, options: numberChoices(n, 4, 1, rnd) };
    }
    var maxAdd = d <= 4 ? 3 : 5;
    for (var attempt = 0; attempt < 300; attempt++) {
      var H = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], total = 0;
      for (var y = 0; y < 3; y++) for (var x = 0; x < 3; x++) { H[y][x] = (rnd() < 0.6) ? between(1, 2, rnd) : 0; total += H[y][x]; }
      if (total < 3) continue;
      var A = H.map(function (r) { return r.slice(); }), added = [], k = between(1, maxAdd, rnd);
      for (var t = 0; t < 40 && added.length < k; t++) {
        var ax = (rnd() * 3) | 0, ay = (rnd() * 3) | 0, z = A[ay][ax];
        if (z >= 3) continue;
        var front = [[ax + 1, ay], [ax, ay + 1], [ax + 1, ay + 1]];
        // the new block must stay in sight: nothing in front of it is taller than the block underneath it
        if (front.some(function (f) { return f[0] < 3 && f[1] < 3 && A[f[1]][f[0]] > z; })) continue;
        A[ay][ax] = z + 1; added.push([ax, ay, z]);
      }
      if (added.length !== k) continue;
      // nothing added later may hide a block added earlier
      var hidden = added.some(function (b) { return [[b[0] + 1, b[1]], [b[0], b[1] + 1], [b[0] + 1, b[1] + 1]].some(function (f) { return f[0] < 3 && f[1] < 3 && A[f[1]][f[0]] > b[2]; }); });
      if (hidden) continue;
      return { mode: "added", before: H, after: A, added: added, answer: k, options: numberChoices(k, 4, 1, rnd) };
    }
    return null;
  }

  function pizzaRound(d, rnd) {
    rnd = rnd || Math.random;
    var total = d <= 2 ? between(2, 4, rnd) : d <= 4 ? between(3, 6, rnd) : between(5, 10, rnd);
    var have = between(1, total - 1, rnd), pair = shuffle(T.pizza.toppings, rnd).slice(0, 2);
    return { total: total, have: have, need: total - have, a: pair[0][0], b: pair[1][0] };
  }

  T.gen6 = { thermoRound: thermoRound, planetRound: planetRound, pictureGrid: pictureGrid, clockRound: clockRound,
             chartRound: chartRound, cubeRound: cubeRound, pizzaRound: pizzaRound, numberChoices: numberChoices };

  /* ---------------- words ---------------- */
  var CHART_NAMES = { apple: ["apple", "apples"], banana: ["banana", "bananas"], orange: ["orange", "oranges"], mango: ["mango", "mangoes"],
    grapes: ["grape", "grapes"], strawberry: ["strawberry", "strawberries"], pear: ["pear", "pears"], lemon: ["lemon", "lemons"] };
  function timeWords(t) {
    var next = t.h % 12 + 1;
    if (t.m === 0) return "It is " + t.h + " o'clock.";
    if (t.m === 30) return "It is half past " + t.h + ".";
    if (t.m === 15) return "It is quarter past " + t.h + ".";
    if (t.m === 45) return "It is quarter to " + next + ".";
    return t.m < 30 ? "It is " + t.m + " minutes past " + t.h + "." : "It is " + (60 - t.m) + " minutes to " + next + ".";
  }
  function digital(t) { return t.h + ":" + (t.m < 10 ? "0" : "") + t.m; }
  var CH = {
    most: "Which fruit has the most?", fewest: "Which fruit has the fewest?",
    howMany: function (f) { return "How many " + CHART_NAMES[f][1] + " are there?"; },
    more: function (a, b) { return "How many more " + CHART_NAMES[a][1] + " than " + CHART_NAMES[b][1] + "?"; },
    tallest: function (f) { return "Yes! The " + CHART_NAMES[f][0] + " bar is the tallest!"; },
    shortest: function (f) { return "Yes! The " + CHART_NAMES[f][0] + " bar is the shortest!"; },
    count: function (f, n) { return n === 1 ? "Yes! There is 1 " + CHART_NAMES[f][0] + "." : "Yes! There are " + n + " " + CHART_NAMES[f][1] + "."; },
    diff: function (n) { return "Yes! " + n + " more!"; }
  };

  /** Every fixed line batch 6 can say (for scripts/voice/harvest.js). */
  T.lines6 = function () {
    var th = T.thermo, pl = T.planets, ps = T.pictureSums, ck = T.clocks, ch = T.chart, cu = T.cubes, pz = T.pizza;
    var out = [th.pick, th.order, th.lowFirst, pl.ask, pl.wrong, ps.ask, ps.wrong, ck.ask, ck.hint, ch.look, cu.countAll, cu.added, cu.hint,
      pz.add, pz.tooMany, pz.tooFew, CH.most, CH.fewest].concat(th.done, pl.done, ck.done, ch.done, cu.done, pz.done);
    Object.keys(th.words).forEach(function (k) { out.push(th.why(th.words[k])); });
    ps.animals.forEach(function (a) { var c = Kido.creatures && Kido.creatures.get(a); out.push(ps.found(((c && c.name) || a).toLowerCase())); });
    for (var h = 1; h <= 12; h++) for (var m = 0; m < 60; m += 5) out.push(timeWords({ h: h, m: m }));
    ch.fruits.forEach(function (f) {
      out.push(CH.howMany(f), CH.tallest(f), CH.shortest(f));
      for (var n = 1; n <= 8; n++) out.push(CH.count(f, n));
      ch.fruits.forEach(function (g) { if (g !== f) out.push(CH.more(f, g)); });
    });
    for (var n2 = 1; n2 <= 7; n2++) out.push(CH.diff(n2));
    for (var t = 2; t <= 10; t++) out.push(pz.total(t));
    Object.keys(pz.names).forEach(function (k) { var nm = pz.names[k]; out.push(pz.missing(nm[1])); for (var n3 = 1; n3 <= 9; n3++) out.push(pz.have(n3, nm[0], nm[1])); });
    return out.filter(function (s, i) { return out.indexOf(s) === i; });
  };

  /* ---------------- shared UI ---------------- */
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
  function say(parts) { return Kido.mascot.say(parts.join(" "), { parts: parts }); }
  function photo(k) { var c = Kido.creatures.get(k); return (c && c.img) || ""; }
  /** Run `rounds` rounds of a tap-the-answer game: build(rd, answer, wrong) fills the stage. */
  function roundsGame(ui, spec, count, make, build) {
    var idx = 0, firstTry = 0;
    (function next() {
      if (!ui.alive()) return;
      if (idx >= count) { Kido.engine.finish(spec, firstTry, count); return; }
      ui.status.textContent = (idx + 1) + " / " + count;
      var tries = 0, busy = false, rd = make();
      ui.stage.__rd = rd;                                              // read by automated checks only
      build(rd, function right(line) {
        if (busy) return; busy = true; if (!tries) firstTry++;
        Kido.audio.playCorrectSound();
        Promise.resolve(line ? Kido.audio.speak(line) : null).then(function () { return wait(600); }).then(function () { idx++; next(); });
      }, function wrong(el, line) {
        if (busy) return; tries++;
        if (el) { Kido.fx.shake(el); el.classList.add("is-wrong"); }
        Kido.audio.playIncorrectSound();
        if (line) Kido.audio.speak(line);
      });
    })();
  }

  /* =============================== WEATHER THERMOMETER =============================== */
  function thermoSvg(t) {
    var top = 128 - (t + 10) / 50 * 110, s = '<svg viewBox="0 0 60 170" aria-hidden="true">';
    s += '<rect x="22" y="8" width="16" height="134" rx="8" fill="#F8FAFC" stroke="#94A3B8" stroke-width="2"/>';
    for (var v = -10; v <= 40; v += 10) {
      var y = 128 - (v + 10) / 50 * 110;
      s += '<line x1="38" y1="' + y + '" x2="46" y2="' + y + '" stroke="#64748B" stroke-width="1.5"/><text x="48" y="' + (y + 3.5) + '" font-size="9" fill="#475569" font-family="sans-serif">' + v + "</text>";
    }
    s += '<rect x="26" y="' + top + '" width="8" height="' + (146 - top) + '" rx="4" fill="#EF4444"/><circle cx="30" cy="150" r="14" fill="#EF4444" stroke="#94A3B8" stroke-width="2"/>';
    return s + "</svg>";
  }
  function weatherSvg(kind) {
    var s = '<svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
    if (kind === "snow") {
      s += '<rect width="160" height="100" fill="#BFDBFE"/><rect y="66" width="160" height="34" fill="#F8FAFC"/>' +
        '<circle cx="110" cy="70" r="13" fill="#fff" stroke="#CBD5E1"/><circle cx="110" cy="50" r="9" fill="#fff" stroke="#CBD5E1"/><path d="M110 50 l7 2 -7 2z" fill="#F97316"/>' +
        '<path d="M40 70 l14-26 14 26z" fill="#15803D"/><path d="M36 60 l18-30 18 30" fill="#fff" opacity=".7"/>';
      for (var i = 0; i < 22; i++) s += '<circle cx="' + ((i * 37) % 160) + '" cy="' + ((i * 23) % 62) + '" r="1.8" fill="#fff"/>';
    } else if (kind === "rain") {
      s += '<rect width="160" height="100" fill="#94A3B8"/><rect y="70" width="160" height="30" fill="#4D7C0F"/>' +
        '<g fill="#E2E8F0"><circle cx="45" cy="26" r="14"/><circle cx="62" cy="22" r="17"/><circle cx="80" cy="28" r="12"/><circle cx="110" cy="20" r="12"/><circle cx="125" cy="24" r="14"/></g>';
      for (var j = 0; j < 18; j++) s += '<line x1="' + (20 + j * 8) + '" y1="' + (44 + (j % 3) * 8) + '" x2="' + (16 + j * 8) + '" y2="' + (54 + (j % 3) * 8) + '" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round"/>';
      s += '<ellipse cx="60" cy="84" rx="18" ry="4" fill="#60A5FA" opacity=".7"/>';
    } else if (kind === "spring") {
      s += '<rect width="160" height="100" fill="#BAE6FD"/><rect y="64" width="160" height="36" fill="#4ADE80"/><circle cx="130" cy="24" r="12" fill="#FDE047"/>' +
        '<g fill="#F472B6"><circle cx="30" cy="76" r="4"/><circle cx="60" cy="82" r="4"/><circle cx="96" cy="74" r="4"/></g><g fill="#FDE047"><circle cx="30" cy="76" r="1.6"/><circle cx="60" cy="82" r="1.6"/><circle cx="96" cy="74" r="1.6"/></g>' +
        '<path d="M120 64 v-22" stroke="#92400E" stroke-width="4"/><circle cx="120" cy="38" r="12" fill="#16A34A"/>';
    } else {
      s += '<rect width="160" height="100" fill="#FDE68A"/><rect y="56" width="160" height="16" fill="#38BDF8"/><rect y="72" width="160" height="28" fill="#FCD34D"/>' +
        '<circle cx="40" cy="26" r="17" fill="#F97316"/><circle cx="40" cy="26" r="12" fill="#FACC15"/>' +
        '<path d="M120 90 v-30" stroke="#92400E" stroke-width="4"/><path d="M120 60 q-14 -6 -22 4 M120 60 q14 -6 22 4 M120 60 q-6 -12 -16 -12 M120 60 q6 -12 16 -12" stroke="#16A34A" stroke-width="5" fill="none" stroke-linecap="round"/>';
    }
    return s + "</svg>";
  }
  Kido.activities.thermoCheck = function (spec) {
    var d = cfg().difficulty, th = T.thermo;
    var ui = shell("tl-thermo", "🌡️ Weather Thermometer");
    roundsGame(ui, spec, th.rounds(d), function () { return thermoRound(d); }, function (rd, right, wrong) {
      ui.stage.innerHTML = "";
      if (rd.mode === "pick") {
        ui.stage.appendChild(U.el("div", { class: "wt-scene", html: weatherSvg(rd.kind) }));
        var row = U.el("div", { class: "wt-row" });
        rd.options.forEach(function (o, i) {
          var b = U.el("button", { class: "wt-thermo", "aria-label": o.temp + " degrees", html: thermoSvg(o.temp) });
          b.addEventListener("click", function () { if (b.classList.contains("is-wrong")) return; if (i === rd.answer) { b.classList.add("is-right"); right(U.pick(th.done)); } else wrong(b, th.why(th.words[rd.kind])); });
          row.appendChild(b);
        });
        ui.stage.appendChild(row);
        Kido.audio.speak(th.pick);
      } else {
        var at = 0, row2 = U.el("div", { class: "wt-row wt-row--order" });
        rd.temps.forEach(function (t) {
          var b = U.el("button", { class: "wt-thermo", "aria-label": t + " degrees", html: thermoSvg(t) + '<b class="wt-n"></b>' });
          b.addEventListener("click", function () {
            if (b.classList.contains("is-done")) return;
            if (t === rd.order[at]) { at++; b.classList.add("is-done"); b.querySelector(".wt-n").textContent = at; if (at === rd.temps.length) right(U.pick(th.done)); }
            else { wrong(b, th.lowFirst); setTimeout(function () { b.classList.remove("is-wrong"); }, 700); }
          });
          row2.appendChild(b);
        });
        ui.stage.appendChild(row2);
        Kido.audio.speak(th.order);
      }
    });
  };

  /* =============================== PLANET SUMS =============================== */
  var MON_COLORS = ["#22C55E", "#A855F7", "#EF4444", "#F59E0B", "#06B6D4"];
  function monsterSvg(n, col) {
    return '<svg viewBox="0 0 60 64" aria-hidden="true"><path d="M8 58 Q4 20 30 10 Q56 20 52 58 Z" fill="' + col + '"/>' +
      '<line x1="22" y1="12" x2="16" y2="2" stroke="' + col + '" stroke-width="3"/><circle cx="16" cy="2" r="3" fill="' + col + '"/>' +
      '<line x1="38" y1="12" x2="44" y2="2" stroke="' + col + '" stroke-width="3"/><circle cx="44" cy="2" r="3" fill="' + col + '"/>' +
      '<circle cx="22" cy="26" r="6" fill="#fff"/><circle cx="23" cy="27" r="3" fill="#0F172A"/><circle cx="38" cy="26" r="6" fill="#fff"/><circle cx="39" cy="27" r="3" fill="#0F172A"/>' +
      '<rect x="18" y="34" width="24" height="18" rx="6" fill="#fff"/><text x="30" y="49" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="16" fill="#0F172A">' + n + "</text></svg>";
  }
  var PLANET_FILLS = ["#F97316", "#38BDF8", "#FACC15", "#A78BFA", "#F472B6"];
  Kido.activities.planetSums = function (spec) {
    var d = cfg().difficulty, P = T.planets;
    var ui = shell("tl-planets", "🪐 Planet Sums");
    roundsGame(ui, spec, P.rounds(d), function () { return planetRound(d); }, function (rd, right, wrong) {
      ui.stage.innerHTML = "";
      var sky = U.el("div", { class: "ps-sky" }), dock = U.el("div", { class: "ps-dock" }), landed = 0;
      var tap = Kido.engine.tapPlacement(place);
      rd.planets.forEach(function (p, i) {
        var dots = p.op === "+" ? '<i class="ps-dots">' + "●".repeat(p.a) + " " + "●".repeat(p.b) + "</i>" : "";
        var pl = U.el("div", { class: "ps-planet slot", "data-ans": p.ans, role: "button", tabindex: "0", "aria-label": p.a + (p.op === "+" ? " plus " : " minus ") + p.b,
          html: '<div class="ps-ball" style="--pc:' + PLANET_FILLS[i % 5] + '"><b>' + p.a + " " + (p.op === "+" ? "+" : "−") + " " + p.b + "</b></div>" + dots + '<div class="ps-pad"></div>' });
        tap.slot(pl); sky.appendChild(pl);
      });
      rd.monsters.forEach(function (n, i) {
        var m = U.el("div", { class: "ps-mon", "data-id": "m" + n, "data-n": n, role: "button", tabindex: "0", "aria-label": String(n), html: monsterSvg(n, MON_COLORS[i % 5]) });
        Kido.engine.makeDraggable(m, { onDrop: function (t) { return place(m, t && t.closest(".ps-planet")); } });
        tap.chip(m); dock.appendChild(m);
      });
      ui.stage.appendChild(sky); ui.stage.appendChild(dock);
      Kido.audio.speak(P.ask);
      function place(m, pl) {
        if (!m || !pl || pl.classList.contains("filled")) return false;
        if (+m.getAttribute("data-n") === +pl.getAttribute("data-ans")) {
          pl.classList.add("filled"); pl.querySelector(".ps-pad").appendChild(m); m.classList.add("is-landed");
          Kido.audio.playTapSound && Kido.audio.playTapSound(); Kido.fx.sparkleEl(pl);
          if (++landed === rd.planets.length) right(U.pick(P.done));
          return true;
        }
        pl.classList.add("show-dots"); wrong(pl, P.wrong); setTimeout(function () { pl.classList.remove("is-wrong"); }, 600);
        return false;
      }
    });
  };

  /* =============================== PICTURE SUMS =============================== */
  Kido.activities.pictureSums = function (spec) {
    var d = cfg().difficulty, PS = T.pictureSums, animals = shuffle(PS.animals.filter(photo), Math.random);
    var ui = shell("tl-psums", "🧩 Picture Sums");
    roundsGame(ui, spec, 2, function () { var g = pictureGrid(d); g.animal = animals.pop(); return g; }, function (g, right, wrong) {
      ui.stage.innerHTML = "";
      var grid = U.el("div", { class: "sq-grid" }), tray = U.el("div", { class: "sq-tray" }), placed = 0, img = photo(g.animal);
      grid.style.setProperty("--rows", g.R); grid.style.setProperty("--cols", g.C);
      var tap = Kido.engine.tapPlacement(place);
      grid.appendChild(U.el("div", { class: "sq-corner", html: "+" }));
      g.cols.forEach(function (c) { grid.appendChild(U.el("div", { class: "sq-head", html: String(c) })); });
      g.rows.forEach(function (r, ri) {
        grid.appendChild(U.el("div", { class: "sq-head", html: String(r) }));
        g.cols.forEach(function (c, ci) {
          var cell = U.el("div", { class: "sq-cell slot", "data-sum": r + c, "data-pos": ri + "," + ci, role: "button", tabindex: "0", "aria-label": r + " plus " + c });
          tap.slot(cell); grid.appendChild(cell);
        });
      });
      var pieces = [];
      g.rows.forEach(function (r, ri) { g.cols.forEach(function (c, ci) { pieces.push({ sum: r + c, ri: ri, ci: ci }); }); });
      shuffle(pieces, Math.random).forEach(function (p) {
        var t = U.el("div", { class: "sq-piece", "data-id": "p" + p.sum, "data-sum": p.sum, role: "button", tabindex: "0", "aria-label": String(p.sum), html: "<b>" + p.sum + "</b>" });
        t.style.backgroundImage = "url(" + img + ")";
        t.style.backgroundSize = (g.C * 100) + "% " + (g.R * 100) + "%";
        t.style.backgroundPosition = (g.C > 1 ? p.ci / (g.C - 1) * 100 : 0) + "% " + (g.R > 1 ? p.ri / (g.R - 1) * 100 : 0) + "%";
        Kido.engine.makeDraggable(t, { onDrop: function (el) { return place(t, el && el.closest(".sq-cell")); } });
        tap.chip(t); tray.appendChild(t);
      });
      ui.stage.appendChild(grid); ui.stage.appendChild(tray);
      Kido.audio.speak(PS.ask);
      function place(t, cell) {
        if (!t || !cell || cell.classList.contains("filled")) return false;
        if (+t.getAttribute("data-sum") === +cell.getAttribute("data-sum")) {
          cell.classList.add("filled"); cell.appendChild(t); t.classList.add("is-placed");
          Kido.audio.playTapSound && Kido.audio.playTapSound();
          if (++placed === g.R * g.C) {
            grid.classList.add("is-done");
            var c = Kido.creatures.get(g.animal);
            setTimeout(function () { right(PS.found(((c && c.name) || g.animal).toLowerCase())); }, 500);
          }
          return true;
        }
        wrong(cell, PS.wrong); setTimeout(function () { cell.classList.remove("is-wrong"); }, 600);
        return false;
      }
    });
  };

  /* =============================== CLOCK MATCH =============================== */
  function clockSvg(t) {
    var s = '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#fff" stroke="#6C4BD6" stroke-width="6"/>';
    for (var i = 1; i <= 12; i++) {
      var a = i * Math.PI / 6;
      s += '<text x="' + (60 + 42 * Math.sin(a)).toFixed(1) + '" y="' + (60 - 42 * Math.cos(a) + 5).toFixed(1) + '" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="13" fill="#2B2151">' + i + "</text>";
    }
    for (var k = 0; k < 60; k++) if (k % 5) { var b = k * Math.PI / 30; s += '<circle cx="' + (60 + 51 * Math.sin(b)).toFixed(1) + '" cy="' + (60 - 51 * Math.cos(b)).toFixed(1) + '" r="1" fill="#94A3B8"/>'; }
    var ha = ((t.h % 12) + t.m / 60) * 30, ma = t.m * 6;
    s += '<line x1="60" y1="60" x2="60" y2="30" stroke="#2B2151" stroke-width="7" stroke-linecap="round" transform="rotate(' + ha + ' 60 60)"/>';
    s += '<line x1="60" y1="60" x2="60" y2="14" stroke="#EF4444" stroke-width="4" stroke-linecap="round" transform="rotate(' + ma + ' 60 60)"/>';
    return s + '<circle cx="60" cy="60" r="5" fill="#2B2151"/></svg>';
  }
  Kido.activities.clockMatch = function (spec) {
    var d = cfg().difficulty, CK = T.clocks;
    var ui = shell("tl-clock", "⏰ Clock Match");
    roundsGame(ui, spec, CK.rounds(d), function () { return clockRound(d); }, function (rd, right, wrong) {
      ui.stage.innerHTML = "";
      ui.stage.appendChild(U.el("div", { class: "cm-face", html: clockSvg(rd.time) }));
      var row = U.el("div", { class: "cm-opts" });
      rd.options.forEach(function (t) {
        var b = U.el("button", { class: "cm-digital", "aria-label": digital(t), html: digital(t) });
        b.addEventListener("click", function () {
          if (b.classList.contains("is-wrong")) return;
          if (t.h === rd.time.h && t.m === rd.time.m) { b.classList.add("is-right"); right(timeWords(t)); } else wrong(b, CK.hint);
        });
        row.appendChild(b);
      });
      ui.stage.appendChild(row);
      Kido.audio.speak(CK.ask);
    });
  };

  /* =============================== FRUIT CHART =============================== */
  Kido.activities.fruitChart = function (spec) {
    var d = cfg().difficulty, CHt = T.chart;
    var ui = shell("tl-chart", "📊 Fruit Chart");
    roundsGame(ui, spec, CHt.rounds(d), function () { return chartRound(d); }, function (rd, right, wrong) {
      ui.stage.innerHTML = "";
      var chart = U.el("div", { class: "fc-chart" });
      chart.style.setProperty("--n", rd.fruits.length); chart.style.setProperty("--max", rd.max);
      var axis = U.el("div", { class: "fc-axis" });
      for (var v = rd.max; v >= 0; v--) axis.appendChild(U.el("span", { html: String(v) }));
      chart.appendChild(axis);
      var plot = U.el("div", { class: "fc-plot" });
      rd.fruits.forEach(function (f, i) {
        var col = U.el("button", { class: "fc-col", "aria-label": CHART_NAMES[f][1] + " " + rd.counts[i],
          html: '<div class="fc-box"><div class="fc-bar" style="height:' + (rd.counts[i] / rd.max * 100) + '%"></div></div><img src="' + photo(f) + '" alt="" draggable="false"/>' });
        col.addEventListener("click", function () {
          var q = rd.q;
          if (q.kind !== "most" && q.kind !== "fewest") return;
          if (i === q.answer) right(q.kind === "most" ? CH.tallest(f) : CH.shortest(f)); else wrong(col, CHt.look);
          setTimeout(function () { col.classList.remove("is-wrong"); }, 600);
        });
        plot.appendChild(col);
      });
      chart.appendChild(plot);
      ui.stage.appendChild(chart);
      var q = rd.q, line;
      if (q.kind === "most") line = CH.most; else if (q.kind === "fewest") line = CH.fewest;
      else if (q.kind === "howMany") line = CH.howMany(rd.fruits[q.of]); else line = CH.more(rd.fruits[q.a], rd.fruits[q.b]);
      ui.prompt.innerHTML = "📊 " + line;
      if (q.options) {
        var opts = U.el("div", { class: "fc-opts" });
        q.options.forEach(function (n) {
          var b = U.el("button", { class: "fc-num", html: String(n) });
          b.addEventListener("click", function () {
            if (b.classList.contains("is-wrong")) return;
            if (n === q.answer) { b.classList.add("is-right"); right(q.kind === "howMany" ? CH.count(rd.fruits[q.of], n) : CH.diff(n)); } else wrong(b, CHt.look);
          });
          opts.appendChild(b);
        });
        ui.stage.appendChild(opts);
      }
      Kido.audio.speak(line);
    });
  };

  /* =============================== BLOCK COUNT =============================== */
  function isoSvg(H, added) {
    var rows = H.length, cols = H[0].length, s = 22, hgt = 22, list = [];
    var isAdded = function (x, y, z) { return added.some(function (a) { return a[0] === x && a[1] === y && a[2] === z; }); };
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) for (var z = 0; z < H[y][x]; z++) list.push([x, y, z]);
    list.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]) || a[2] - b[2]; });
    var ox = rows * s + 6, oy = 3 * hgt + 6, out = '<svg viewBox="0 0 ' + ((rows + cols) * s + 12) + " " + ((rows + cols) * s * 0.58 + 4 * hgt + 12) + '" aria-hidden="true">';
    // floor
    var P = function (x, y, z) { return [ox + (x - y) * s, oy + (x + y) * s * 0.58 - z * hgt]; };
    var f0 = P(0, 0, 0), f1 = P(cols, 0, 0), f2 = P(cols, rows, 0), f3 = P(0, rows, 0);
    out += '<polygon points="' + [f0, f1, f2, f3].map(function (p) { return p.join(","); }).join(" ") + '" fill="#E0E7FF" stroke="#A5B4FC" stroke-width="1.5"/>';
    list.forEach(function (c) {
      var x = c[0], y = c[1], z = c[2], lt = isAdded(x, y, z);
      var a = P(x, y, z + 1), b = P(x + 1, y, z + 1), cc = P(x + 1, y + 1, z + 1), dd = P(x, y + 1, z + 1);
      var b0 = P(x + 1, y, z), c0 = P(x + 1, y + 1, z), d0 = P(x, y + 1, z);
      var top = lt ? "#FEF3C7" : "#FB923C", left = lt ? "#FDE68A" : "#EA580C", right = lt ? "#FCD34D" : "#C2410C";
      var poly = function (pts, fill) { return '<polygon points="' + pts.map(function (p) { return p.join(","); }).join(" ") + '" fill="' + fill + '" stroke="#7C2D12" stroke-width="1" stroke-linejoin="round"/>'; };
      out += poly([dd, cc, c0, d0], left) + poly([cc, b, b0, c0], right) + poly([a, b, cc, dd], top);
    });
    return out + "</svg>";
  }
  Kido.activities.cubeCount = function (spec) {
    var d = cfg().difficulty, CU = T.cubes;
    var ui = shell("tl-cubes", "🧱 Block Count");
    roundsGame(ui, spec, CU.rounds(d), function () { return cubeRound(d); }, function (rd, right, wrong) {
      ui.stage.innerHTML = "";
      var view = U.el("div", { class: "cc-view" });
      if (rd.mode === "added") {
        view.appendChild(U.el("div", { class: "cc-build", html: isoSvg(rd.before, []) }));
        view.appendChild(U.el("div", { class: "cc-arrow", html: "➜" }));
      }
      view.appendChild(U.el("div", { class: "cc-build", html: isoSvg(rd.after, rd.added) }));
      ui.stage.appendChild(view);
      var opts = U.el("div", { class: "fc-opts" });
      rd.options.forEach(function (n) {
        var b = U.el("button", { class: "fc-num", html: String(n) });
        b.addEventListener("click", function () { if (b.classList.contains("is-wrong")) return; if (n === rd.answer) { b.classList.add("is-right"); right(U.pick(CU.done)); } else wrong(b, CU.hint); });
        opts.appendChild(b);
      });
      ui.stage.appendChild(opts);
      Kido.audio.speak(rd.mode === "added" ? CU.added : CU.countAll);
    });
  };

  /* =============================== PIZZA MAKER =============================== */
  var TOP = {};
  function toppingSvg(kind) {
    var col = T.pizza.toppings.filter(function (t) { return t[0] === kind; })[0][1];
    var inner = kind === "tomato" ? '<circle cx="12" cy="12" r="10" fill="' + col + '"/><circle cx="12" cy="12" r="6" fill="#FCA5A5"/><g fill="#FEF3C7"><circle cx="9" cy="10" r="1.3"/><circle cx="15" cy="10" r="1.3"/><circle cx="12" cy="15" r="1.3"/></g>'
      : kind === "olive" ? '<circle cx="12" cy="12" r="8" fill="' + col + '"/><circle cx="12" cy="12" r="3" fill="#FDE68A"/>'
      : kind === "onion" ? '<circle cx="12" cy="12" r="9" fill="none" stroke="' + col + '" stroke-width="3"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="' + col + '" stroke-width="2.5"/>'
      : kind === "mushroom" ? '<path d="M4 12 a8 8 0 0 1 16 0 z" fill="' + col + '" stroke="#78716C"/><rect x="9" y="12" width="6" height="7" rx="2" fill="#F5F5F4" stroke="#78716C"/>'
      : '<path d="M5 8 q7 -6 14 0 q-2 10 -7 12 q-5 -2 -7 -12z" fill="' + col + '" stroke="#15803D"/>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + "</svg>";
  }
  var SPOTS = [[50, 22], [72, 30], [80, 52], [70, 74], [50, 82], [28, 74], [20, 52], [28, 30], [42, 44], [60, 58], [58, 40], [40, 62]];
  Kido.activities.pizzaMaker = function (spec) {
    var d = cfg().difficulty, PZ = T.pizza;
    var ui = shell("tl-pizza", "🍕 Pizza Maker");
    roundsGame(ui, spec, PZ.rounds(d), function () { return pizzaRound(d); }, function (rd, right, wrong) {
      ui.stage.innerHTML = "";
      var na = PZ.names[rd.a], nb = PZ.names[rd.b], added = 0;
      var card = U.el("div", { class: "pm-card", html: '<div class="pm-line">' + toppingSvg(rd.a) + "<b>" + rd.have + "</b></div>" +
        '<div class="pm-line">' + toppingSvg(rd.b) + '<b class="pm-q">?</b></div><div class="pm-total">' + rd.total + "</div>" });
      var pie = U.el("div", { class: "pm-pizza" });
      for (var i = 0; i < rd.have; i++) pie.appendChild(top(rd.a, i, false));
      var bowl = U.el("button", { class: "pm-bowl", "aria-label": "Add " + nb[0], html: toppingSvg(rd.b) + toppingSvg(rd.b) + toppingSvg(rd.b) });
      var bake = U.el("button", { class: "pm-bake", html: "🔥 " + PZ.bake });
      ui.stage.appendChild(card); ui.stage.appendChild(pie); ui.stage.appendChild(U.el("div", { class: "pm-side" }, [bowl, bake]));
      function top(kind, slot, removable) {
        var el = U.el(removable ? "button" : "span", { class: "pm-top" + (removable ? " is-new" : ""), html: toppingSvg(kind) });
        el.style.left = SPOTS[slot][0] + "%"; el.style.top = SPOTS[slot][1] + "%";
        if (removable) el.addEventListener("click", function () { el.remove(); added--; });
        return el;
      }
      bowl.addEventListener("click", function () {
        Kido.audio.unlock();
        if (rd.have + added >= SPOTS.length) return;
        var used = Array.prototype.map.call(pie.querySelectorAll(".pm-top"), function (e) { return e.style.left + e.style.top; });
        var slot = SPOTS.findIndex(function (s) { return used.indexOf(s[0] + "%" + s[1] + "%") < 0; });
        pie.appendChild(top(rd.b, slot, true)); added++;
        Kido.audio.playTapSound && Kido.audio.playTapSound();
      });
      bake.addEventListener("click", function () {
        if (added === rd.need) { card.querySelector(".pm-q").textContent = rd.need; pie.classList.add("is-baked"); right(U.pick(PZ.done)); }
        else wrong(pie, added > rd.need ? PZ.tooMany : PZ.tooFew);
        setTimeout(function () { pie.classList.remove("is-wrong"); }, 600);
      });
      say([PZ.total(rd.total), PZ.have(rd.have, na[0], na[1]), PZ.missing(nb[1]), PZ.add]);
    });
  };
})(window);
