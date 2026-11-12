/* =========================================================================
   thinkLab.js — Think Lab activities (content: js/data/thinkLab.js)
     Kido.activities.peekaboo(spec)     Peekaboo Pals — an animal hides in a bush; one part peeks out
     Kido.activities.picnicSeats(spec)  Picnic Seats  — seat friends so every "next to" rule holds
     Kido.activities.robotClues(spec)   Robot Clues   — count robot parts, compare, charge the right robot
   Generators are pure (Kido.thinkLab.gen.*) so scripts/thinklab-check.mjs can test them in Node:
   every Picnic puzzle has exactly one answer and every robot clue fits exactly one robot.
   Wrong answers always explain themselves (the broken rule, or the counts), and nothing is ever taken away.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var T = Kido.thinkLab;
  Kido.activities = Kido.activities || {};

  /* ---------------- small pure helpers (also used by the Node check) ---------------- */
  function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function between(lo, hi, rnd) { return lo + ((rnd() * (hi - lo + 1)) | 0); }
  function adjacent(p, q, C) { var dr = Math.abs(((p / C) | 0) - ((q / C) | 0)), dc = Math.abs((p % C) - (q % C)); return dr + dc === 1; }

  /* Picnic: rules that are true for a random seating are added until only that seating works. */
  function ruleHolds(r, at, C) { var adj = adjacent(at[r.a], at[r.b], C); return r.type === "wants" ? adj : !adj; }
  function solutions(pz, rules, limit) {
    var empty = [], found = [];
    for (var c = 0; c < pz.R * pz.C; c++) if (Object.keys(pz.fixed).every(function (g) { return pz.fixed[g] !== c; })) empty.push(c);
    (function place(i, at, used) {
      if (found.length >= (limit || 99)) return;
      if (i === pz.placed.length) {
        if (rules.every(function (r) { return ruleHolds(r, at, pz.C); })) found.push(Object.assign({}, at));
        return;
      }
      empty.forEach(function (cell) {
        if (used[cell]) return;
        at[pz.placed[i]] = cell; used[cell] = true;
        place(i + 1, at, used);
        delete at[pz.placed[i]]; used[cell] = false;
      });
    })(0, Object.assign({}, pz.fixed), {});
    return found;
  }
  function picnicPuzzle(d, rnd) {
    rnd = rnd || Math.random;
    var L = T.picnic.levels[Math.max(1, Math.min(7, d))], R = L[0], C = L[1], F = L[2], P = L[3], maxRules = L[4], kinds = L[5];
    for (var attempt = 0; attempt < 300; attempt++) {
      var who = shuffle(T.picnic.guests, rnd).slice(0, F + P), cells = shuffle(Array.from({ length: R * C }, function (_, i) { return i; }), rnd);
      var pz = { R: R, C: C, fixed: {}, placed: who.slice(F), rules: [], answer: {} };
      who.slice(0, F).forEach(function (g, i) { pz.fixed[g] = cells[i]; });
      pz.placed.forEach(function (g, i) { pz.answer[g] = cells[F + i]; });
      var at = Object.assign({}, pz.fixed, pz.answer), cands = [];
      pz.placed.forEach(function (a) {
        who.forEach(function (b) {
          if (a === b) return;
          var adj = adjacent(at[a], at[b], C);
          if (adj && kinds.indexOf("wants") >= 0) cands.push({ type: "wants", a: a, b: b });
          if (!adj && kinds.indexOf("not") >= 0) cands.push({ type: "not", a: a, b: b });
        });
      });
      var n = solutions(pz, []).length;
      while (n > 1 && pz.rules.length < maxRules) {
        var best = null, bestN = n;
        shuffle(cands, rnd).forEach(function (r) {
          if (pz.rules.some(function (x) { return (x.a === r.a && x.b === r.b) || (x.a === r.b && x.b === r.a); })) return;
          var m = solutions(pz, pz.rules.concat([r])).length;
          if (m < bestN) { best = r; bestN = m; }
        });
        if (!best) break;
        pz.rules.push(best); n = bestN;
      }
      if (n === 1 && pz.rules.length) return pz;
    }
    return null;
  }

  /* Robots: a clue (or two) that exactly one robot fits. */
  var PARTS = Object.keys(T.robots.parts);
  function partWord(f, n) { var p = T.robots.parts[f]; return n === 0 ? "no " + p.many : n + " " + (n === 1 ? p.one : p.many); }
  function fits(rb, clue) {
    if (clue.kind === "has") return rb[clue.f] === clue.n;
    var x = rb[clue.a], y = rb[clue.b];
    return clue.rel === "more" ? x > y : clue.rel === "fewer" ? x < y : x === y;
  }
  function clueText(clue, first) {
    if (clue.kind === "has") return first ? "Charge the robot with " + partWord(clue.f, clue.n) + "." : "It has " + partWord(clue.f, clue.n) + ".";
    var A = T.robots.parts[clue.a].many, B = T.robots.parts[clue.b].many;
    return "Charge the robot with " + (clue.rel === "same" ? "as many " + A + " as " + B : clue.rel + " " + A + " than " + B) + ".";
  }
  /** Why this robot does not fit a clue: [what it has, why that is not it] (each part can be its own recording). */
  function whyNot(rb, clue) {
    if (clue.kind === "has") return ["This robot has " + partWord(clue.f, rb[clue.f]) + "."];
    var x = rb[clue.a], y = rb[clue.b];
    return ["This robot has " + partWord(clue.a, x) + " and " + partWord(clue.b, y) + ".",
      clue.rel === "same" ? x + " and " + y + " are not the same." : x + " is not " + clue.rel + " than " + y + "."];
  }
  function robotRound(d, rnd) {
    rnd = rnd || Math.random;
    var n = T.robots.count(d), kind = T.robots.clue(d), rels = d >= 4 ? ["more", "fewer", "same"] : ["more", "fewer"];
    for (var attempt = 0; attempt < 500; attempt++) {
      var robots = [], colors = shuffle(T.robots.colors, rnd);
      for (var i = 0; i < n; i++) {
        var rb = { color: colors[i % colors.length] };
        PARTS.forEach(function (f) { rb[f] = between(T.robots.parts[f].min, T.robots.parts[f].max, rnd); });
        robots.push(rb);
      }
      var target = (rnd() * n) | 0, t = robots[target], clues;
      if (kind === "single") {
        var f = PARTS[(rnd() * PARTS.length) | 0];
        clues = [{ kind: "has", f: f, n: t[f] }];
      } else {
        var pair = shuffle(PARTS, rnd).slice(0, 2), rel = rels.filter(function (r) { return fits(t, { a: pair[0], b: pair[1], rel: r }); })[0];
        if (!rel) continue;
        clues = [{ kind: "compare", a: pair[0], b: pair[1], rel: rel }];
        if (kind === "two") {
          var g = PARTS.filter(function (p) { return pair.indexOf(p) < 0; })[(rnd() * 2) | 0];
          clues.push({ kind: "has", f: g, n: t[g] });
        }
      }
      var ok = robots.filter(function (rb) { return clues.every(function (c) { return fits(rb, c); }); });
      if (ok.length !== 1) continue;
      // with two clues, each clue alone must leave more than one robot (so both are needed)
      if (clues.length === 2 && clues.some(function (c) { return robots.filter(function (rb) { return fits(rb, c); }).length < 2; })) continue;
      return { robots: robots, target: target, clues: clues };
    }
    return null;
  }

  function peekRounds(d, animals, rounds, rnd) {
    rnd = rnd || Math.random;
    var picks = shuffle(animals, rnd).slice(0, Math.min(rounds, animals.length)), k = T.peekaboo.options(d), sides = T.peekaboo.sides(d);
    return picks.map(function (a) {
      var others = shuffle(animals.filter(function (x) { return x.key !== a.key; }), rnd).slice(0, k - 1);
      return { target: a, options: shuffle(others.concat([a]), rnd), side: sides[(rnd() * sides.length) | 0] };
    });
  }

  T.gen = { picnicPuzzle: picnicPuzzle, solutions: solutions, ruleHolds: ruleHolds, adjacent: adjacent,
            robotRound: robotRound, fits: fits, clueText: clueText, whyNot: whyNot, partWord: partWord, peekRounds: peekRounds };

  /** Every fixed line these games can say (for scripts/voice/harvest.js, so each can get a recorded clip). */
  T.lines = function (names) {
    var out = [T.peekaboo.ask, T.peekaboo.more, T.picnic.ask, T.picnic.oops, T.picnic.nextTo, T.robots.lead].concat(T.picnic.solved, T.robots.done);
    var nm = names || {};
    Object.keys(nm).forEach(function (k) { out.push(T.peekaboo.found(nm[k]), "That's the " + nm[k] + "!"); });
    T.picnic.guests.forEach(function (a) {
      if (nm[a]) out.push(T.picnic.hint(nm[a].toLowerCase()));
      T.picnic.guests.forEach(function (b) {
        if (a === b || !nm[a] || !nm[b]) return;
        ["not", "wants"].forEach(function (k) { out.push(T.picnic.rule[k](nm[a].toLowerCase(), nm[b].toLowerCase())); });
      });
    });
    PARTS.forEach(function (f) {
      var p = T.robots.parts[f];
      for (var n = p.min; n <= p.max; n++) {
        out.push(clueText({ kind: "has", f: f, n: n }, true), clueText({ kind: "has", f: f, n: n }, false), "This robot has " + partWord(f, n) + ".");
        PARTS.forEach(function (g) {
          if (g === f) return;
          var q = T.robots.parts[g];
          for (var m = q.min; m <= q.max; m++) out.push("This robot has " + partWord(f, n) + " and " + partWord(g, m) + ".");
        });
      }
      PARTS.forEach(function (g) { if (g !== f) ["more", "fewer", "same"].forEach(function (rel) { out.push(clueText({ kind: "compare", a: f, b: g, rel: rel })); }); });
    });
    for (var x = 0; x <= 4; x++) for (var y = 0; y <= 4; y++) {          // only what a wrong robot can make true
      if (x <= y) out.push(x + " is not more than " + y + ".");
      if (x >= y) out.push(x + " is not fewer than " + y + ".");
      if (x !== y) out.push(x + " and " + y + " are not the same.");
    }
    return out.filter(function (s, i) { return out.indexOf(s) === i; });
  };

  /* ---------------- shared UI ---------------- */
  function cfg() { return (Kido.age && Kido.age.cfg()) || { difficulty: 3, rounds: 5 }; }
  function shell(spec, cls, title) {
    var m = document.getElementById("screen"); m.innerHTML = ""; m.scrollTop = 0;
    var game = U.el("div", { class: "game tl-game " + cls });
    var prompt = U.el("div", { class: "game__prompt", html: title }), status = U.el("div", { class: "arcade__status" });
    game.appendChild(U.el("div", { class: "game__head" }, [prompt, status]));
    var stage = U.el("div", { class: "tl-stage" });
    game.appendChild(stage); m.appendChild(game);
    return { game: game, prompt: prompt, status: status, stage: stage, alive: function () { return game.isConnected; } };
  }
  function nameOf(key) {
    var a = (Kido.content.animals || []).filter(function (x) { return x.key === key; })[0];
    return a ? a.name : key;
  }
  function photo(key) { var c = Kido.creatures.get(key); return (c && c.img) || ""; }
  function say(parts) { return Kido.mascot.say(parts.join(" "), { parts: parts }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* =============================== PEEKABOO PALS =============================== */
  var BUSH = '<svg class="pk-bush__art" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<rect x="6" y="-5" width="100" height="110" fill="#2F8F46"/>' +
    [8, 22, 36, 50, 64, 78, 92].map(function (y, i) {
      return '<circle cx="' + (i % 2 ? 5 : 8) + '" cy="' + y + '" r="8" fill="' + (i % 2 ? "#3FAE57" : "#2F8F46") + '"/>';
    }).join("") +
    '<g fill="#4CC266" opacity=".85"><ellipse cx="30" cy="20" rx="9" ry="5" transform="rotate(-25 30 20)"/>' +
    '<ellipse cx="55" cy="45" rx="10" ry="5" transform="rotate(20 55 45)"/><ellipse cx="35" cy="72" rx="9" ry="5" transform="rotate(-15 35 72)"/>' +
    '<ellipse cx="72" cy="85" rx="10" ry="5" transform="rotate(30 72 85)"/><ellipse cx="78" cy="18" rx="9" ry="5" transform="rotate(10 78 18)"/></g></svg>';

  Kido.activities.peekaboo = function (spec) {
    var d = cfg().difficulty, ui = shell(spec, "tl-peek", "🌿 " + T.peekaboo.ask);
    var animals = (Kido.content.animals || []).filter(function (a) { return photo(a.key); });
    var rounds = peekRounds(d, animals, cfg().rounds || 5), idx = 0, firstTry = 0, tries = 0, busy = false, peek = 0;
    var hide = U.el("div", { class: "pk-hide" }), opts = U.el("div", { class: "pk-opts" });
    ui.stage.appendChild(hide); ui.stage.appendChild(opts);

    function setPeek(p) { peek = Math.min(0.8, p); hide.style.setProperty("--p", peek); }
    function round() {
      if (!ui.alive()) return;
      if (idx >= rounds.length) { Kido.engine.finish(spec, firstTry, rounds.length); return; }
      var r = rounds[idx]; tries = 0; busy = false;
      ui.status.textContent = (idx + 1) + " / " + rounds.length;
      hide.className = "pk-hide pk-hide--" + r.side;
      hide.innerHTML = '<img src="' + photo(r.target.key) + '" alt="" draggable="false"/><div class="pk-bush">' + BUSH + "</div>";
      setPeek(T.peekaboo.peek(d) + (r.side === "top" ? 0 : T.peekaboo.sideExtra));
      hide.classList.add("pk-hide--rustle");
      opts.innerHTML = "";
      r.options.forEach(function (a) {
        var b = U.el("button", { class: "pk-opt", "aria-label": a.name, html: '<img src="' + photo(a.key) + '" alt="" draggable="false"/>' +
          (cfg().showText !== false ? "<span>" + a.name + "</span>" : "") });
        b.addEventListener("click", function () { choose(b, a, r); });
        opts.appendChild(b);
      });
      Kido.audio.speak(T.peekaboo.ask);
    }
    function choose(btn, a, r) {
      if (busy || btn.classList.contains("is-wrong")) return;
      Kido.audio.unlock();
      if (a.key === r.target.key) {
        busy = true; if (tries === 0) firstTry++;
        btn.classList.add("is-right"); hide.classList.add("pk-hide--found");
        Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(hide);
        Promise.resolve(Kido.audio.speak(T.peekaboo.found(a.name))).then(function () {
          if (!ui.alive()) return;
          // the real call only (the name was just said); older path says the name again, so it is the fallback
          var AM = Kido.AudioManager;
          if (AM && AM.play) AM.play("animals", a.key); else Kido.audio.playAnimalSound(a.key, a.name);
          return wait(1500);
        }).then(function () { idx++; round(); });
      } else {
        tries++;
        btn.classList.add("is-wrong"); Kido.fx.shake(btn); Kido.audio.playIncorrectSound();
        setPeek(peek + T.peekaboo.grow);                          // the hint: the bush opens a little more
        hide.classList.remove("pk-hide--rustle"); void hide.offsetWidth; hide.classList.add("pk-hide--rustle");
        say(["That's the " + a.name + "!", T.peekaboo.more]);
      }
    }
    Kido.mascot.say("Someone is playing peekaboo! Look at the part you can see.", { silent: true });
    setTimeout(round, 600);
  };

  /* =============================== PICNIC SEATS =============================== */
  Kido.activities.picnicSeats = function (spec) {
    var d = cfg().difficulty, levels = T.picnic.count(d), lv = 0, perfect = 0;
    var ui = shell(spec, "tl-picnic", "🧺 " + T.picnic.ask);
    var hintBtn = U.el("button", { class: "tl-hint", "aria-label": "Hint", html: "💡" });
    ui.game.querySelector(".game__head").appendChild(hintBtn);
    var rulesEl = U.el("div", { class: "pn-rules" }), board = U.el("div", { class: "pn-board" }), basket = U.el("div", { class: "pn-basket slot", "aria-label": "Basket" });
    ui.stage.appendChild(rulesEl); ui.stage.appendChild(U.el("div", { class: "pn-play" }, [board, basket]));
    var pz, seat, clean, busy, picked = null;

    function token(key, fixed) {
      var t = U.el("div", { class: "pn-tok" + (fixed ? " is-fixed" : ""), "data-id": key, role: fixed ? "img" : "button", tabindex: fixed ? "-1" : "0",
        "aria-label": nameOf(key), html: '<img src="' + photo(key) + '" alt="" draggable="false"/>' });
      return t;
    }
    function ruleText(r) { return T.picnic.rule[r.type](nameOf(r.a).toLowerCase(), nameOf(r.b).toLowerCase()); }
    function level() {
      if (!ui.alive()) return;
      if (lv >= levels) { Kido.engine.finish(spec, perfect, levels); return; }
      pz = picnicPuzzle(d); seat = {}; clean = true; busy = false;
      board.__pz = pz;                                                     // read by automated checks only
      ui.status.textContent = (lv + 1) + " / " + levels;
      rulesEl.innerHTML = "";
      pz.rules.forEach(function (r) {
        var card = U.el("button", { class: "pn-rule pn-rule--" + r.type, "aria-label": ruleText(r), html:
          '<img src="' + photo(r.a) + '" alt=""/><b>' + (r.type === "not" ? "✕" : "♥") + '</b><img src="' + photo(r.b) + '" alt=""/><span>' + ruleText(r) + "</span>" });
        card.addEventListener("click", function () { Kido.audio.speak(ruleText(r)); });
        rulesEl.appendChild(card);
      });
      board.innerHTML = ""; basket.innerHTML = "";
      board.parentNode.style.setProperty("--rows", pz.R); board.parentNode.style.setProperty("--cols", pz.C);
      var tap = Kido.engine.tapPlacement(place, { onPick: function (chip) { picked = chip; } });
      for (var c = 0; c < pz.R * pz.C; c++) {
        var cell = U.el("div", { class: "pn-cell slot", "data-cell": c, role: "button", tabindex: "0", "aria-label": "Seat " + (c + 1) });
        tap.slot(cell); board.appendChild(cell);
      }
      Object.keys(pz.fixed).forEach(function (g) { board.children[pz.fixed[g]].appendChild(token(g, true)); });
      tap.slot(basket);
      pz.placed.forEach(function (g) {
        var t = token(g, false);
        Kido.engine.makeDraggable(t, { onDrop: function (el) { return place(t, el && el.closest(".pn-cell, .pn-basket")); } });
        tap.chip(t); basket.appendChild(t);
      });
      say([T.picnic.ask].concat(pz.rules.map(ruleText)));      // read the rule cards; stops if the child is already playing
    }
    function clearMarks() { board.querySelectorAll(".pn-cell").forEach(function (c) { c.classList.remove("is-no", "is-clash"); }); }
    function place(chip, target) {
      if (busy || !chip || !target) return false;
      var g = chip.getAttribute("data-id");
      if (target.classList.contains("pn-basket")) {
        if (chip.parentElement === basket) return false;                 // the tap that picked it bubbled here: keep it picked
        basket.appendChild(chip); delete seat[g]; chip.classList.remove("is-seated"); return true; }
      if (target.querySelector(".pn-tok")) return false;                  // someone already sits there
      target.appendChild(chip); chip.classList.add("is-seated", "pn-tok--snap");
      setTimeout(function () { chip.classList.remove("pn-tok--snap"); }, 260);
      seat[g] = +target.getAttribute("data-cell");
      Kido.audio.playTapSound && Kido.audio.playTapSound();
      clearMarks();
      if (Object.keys(seat).length === pz.placed.length) setTimeout(check, 350);
      return true;
    }
    function check() {
      if (!ui.alive()) return;
      var at = Object.assign({}, pz.fixed, seat);
      var broken = pz.rules.filter(function (r) { return !ruleHolds(r, at, pz.C); })[0];
      if (!broken) {
        busy = true; if (clean) perfect++;
        board.querySelectorAll(".pn-tok").forEach(function (t, i) { t.style.animationDelay = (i * 70) + "ms"; t.classList.add("pn-tok--hop"); });
        Kido.audio.playCorrectSound(); Kido.fx.confetti(40);
        Promise.resolve(Kido.audio.speak(U.pick(T.picnic.solved))).then(function () { return wait(500); }).then(function () { lv++; level(); });
        return;
      }
      clean = false;
      Kido.audio.playIncorrectSound();
      [broken.a, broken.b].forEach(function (g) { var c = board.children[at[g]]; if (c) c.classList.add("is-clash"); });
      Array.prototype.forEach.call(rulesEl.children, function (card, i) { card.classList.toggle("is-broken", pz.rules[i] === broken); });
      var back = pz.placed.indexOf(broken.a) >= 0 ? broken.a : broken.b;   // the guest that moves back to the basket
      var parts = [T.picnic.oops, ruleText(broken)];
      var pa = at[broken.a], pb = at[broken.b];                           // corner to corner is not "next to"
      if (broken.type === "wants" && Math.abs(((pa / pz.C) | 0) - ((pb / pz.C) | 0)) === 1 && Math.abs(pa % pz.C - pb % pz.C) === 1) parts.push(T.picnic.nextTo);
      say(parts);
      setTimeout(function () {
        if (!ui.alive()) return;
        var t = board.querySelector('.pn-tok[data-id="' + back + '"]');
        if (t) { basket.appendChild(t); t.classList.remove("is-seated"); delete seat[back]; }
        Kido.fx.shake(basket);
      }, 1300);
      setTimeout(function () { clearMarks(); rulesEl.querySelectorAll(".is-broken").forEach(function (c) { c.classList.remove("is-broken"); }); }, 2600);
    }
    // Hint: the seats that would break a rule for the guest in hand (or the first guest in the basket) dim
    hintBtn.addEventListener("click", function () {
      if (busy) return;
      var chip = (picked && picked.isConnected && !picked.classList.contains("is-seated")) ? picked : basket.querySelector(".pn-tok");
      if (!chip) return;
      clean = false;
      var g = chip.getAttribute("data-id"), at = Object.assign({}, pz.fixed, seat);
      clearMarks();
      board.querySelectorAll(".pn-cell").forEach(function (cell) {
        if (cell.querySelector(".pn-tok")) return;
        var c = +cell.getAttribute("data-cell"), test = Object.assign({}, at); test[g] = c;
        var bad = pz.rules.some(function (r) { return (r.a === g || r.b === g) && test[r.a] != null && test[r.b] != null && !ruleHolds(r, test, pz.C); });
        if (bad) cell.classList.add("is-no");
      });
      chip.classList.add("pn-tok--hint"); setTimeout(function () { chip.classList.remove("pn-tok--hint"); }, 900);
      Kido.audio.speak(T.picnic.hint(nameOf(g).toLowerCase()));
    });
    Kido.mascot.say("Picnic time! Read the cards and seat every friend.", { silent: true });
    setTimeout(level, 600);
  };

  /* =============================== ROBOT CLUES =============================== */
  function robotSvg(rb) {
    var s = '<svg viewBox="0 0 120 150" aria-hidden="true">', i, x;
    for (i = 0; i < rb.antennas; i++) {                                   // antennas on the head
      x = 60 + (i - (rb.antennas - 1) / 2) * 18;
      s += '<line x1="' + x + '" y1="32" x2="' + x + '" y2="12" stroke="#334155" stroke-width="3"/><circle cx="' + x + '" cy="10" r="5" fill="#FACC15"/>';
    }
    s += '<rect x="28" y="30" width="64" height="40" rx="12" fill="' + rb.color + '"/>';
    for (i = 0; i < rb.eyes; i++) {
      x = 60 + (i - (rb.eyes - 1) / 2) * 17;
      s += '<circle cx="' + x + '" cy="50" r="7" fill="#fff"/><circle class="rb-pupil" cx="' + x + '" cy="51" r="3.4" fill="#0F172A"/>';
    }
    s += '<rect x="56" y="68" width="8" height="8" fill="#64748B"/><rect x="24" y="74" width="72" height="46" rx="10" fill="' + rb.color + '" opacity=".85"/>' +
      '<rect x="42" y="86" width="36" height="20" rx="5" fill="#E2E8F0"/><rect class="rb-batt" x="45" y="89" width="0" height="14" rx="3" fill="#22C55E"/>';
    var left = Math.ceil(rb.arms / 2), right = rb.arms - left;
    [[left, -1], [right, 1]].forEach(function (side) {
      for (var k = 0; k < side[0]; k++) {
        var y = side[0] === 1 ? 90 : 80 + k * (28 / (side[0] - 1)), x0 = side[1] < 0 ? 24 : 96, x1 = x0 + side[1] * 16;
        s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + (y - 6) + '" stroke="#334155" stroke-width="4" stroke-linecap="round"/>' +
          '<circle cx="' + x1 + '" cy="' + (y - 6) + '" r="4.5" fill="#94A3B8"/>';
      }
    });
    for (i = 0; i < rb.wheels; i++) {
      x = 60 + (i - (rb.wheels - 1) / 2) * 22;
      s += '<circle cx="' + x + '" cy="131" r="10" fill="#1E293B"/><circle cx="' + x + '" cy="131" r="4" fill="#94A3B8"/>';
    }
    return s + "</svg>";
  }
  var ICON = { eyes: "👁️", arms: "🦾", wheels: "🛞", antennas: "📡" };
  function cluePicture(c) {
    if (c.kind === "has") return '<span class="rb-pic">' + ICON[c.f] + " = " + c.n + "</span>";
    return '<span class="rb-pic">' + ICON[c.a] + (c.rel === "more" ? " &gt; " : c.rel === "fewer" ? " &lt; " : " = ") + ICON[c.b] + "</span>";
  }

  Kido.activities.robotClues = function (spec) {
    var d = cfg().difficulty, rounds = Math.min(cfg().rounds || 5, 6), idx = 0, firstTry = 0, tries = 0, busy = false, rd;
    var ui = shell(spec, "tl-robots", "🤖 " + T.robots.lead);
    var clueEl = U.el("div", { class: "rb-clue", role: "button", tabindex: "0" }), row = U.el("div", { class: "rb-row" });
    var charger = U.el("div", { class: "rb-charger slot", "aria-label": "Charger", html: '<div class="rb-charger__pad">⚡</div><small>Charger</small>' });
    ui.stage.appendChild(clueEl); ui.stage.appendChild(U.el("div", { class: "rb-floor" }, [row, charger]));
    function clueLines() { return rd.clues.map(function (c, i) { return clueText(c, i === 0); }); }
    function readClue() { return say(clueLines()); }
    clueEl.addEventListener("click", readClue);

    function round() {
      if (!ui.alive()) return;
      if (idx >= rounds) { Kido.engine.finish(spec, firstTry, rounds); return; }
      rd = robotRound(d); tries = 0; busy = false;
      row.__rd = rd;                                                       // read by automated checks only
      ui.status.textContent = (idx + 1) + " / " + rounds;
      clueEl.innerHTML = rd.clues.map(function (c, i) { return '<div class="rb-clue__line">' + cluePicture(c) + "<span>" + clueText(c, i === 0) + "</span></div>"; }).join("");
      row.innerHTML = ""; charger.classList.remove("is-on");
      rd.robots.forEach(function (rb, i) {
        var el = U.el("div", { class: "rb-bot", role: "button", tabindex: "0", "data-id": "rb" + i, "aria-label": "Robot " + (i + 1), html: robotSvg(rb) });
        el.style.animationDelay = (i * 90) + "ms";
        Kido.engine.makeDraggable(el, { onDrop: function (t) { if (t && t.closest(".rb-charger")) { pick(el, i); return true; } return false; } });
        el.addEventListener("click", function () { if (el.__dragMoved) { el.__dragMoved = false; return; } pick(el, i); });
        el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(el, i); } });
        row.appendChild(el);
      });
      readClue();
    }
    function pick(el, i) {
      if (busy || el.classList.contains("is-wrong")) return;
      Kido.audio.unlock();
      var rb = rd.robots[i];
      if (i === rd.target) {
        busy = true; if (tries === 0) firstTry++;
        var a = el.getBoundingClientRect(), b = charger.getBoundingClientRect();
        el.style.setProperty("--dx", (b.left + b.width / 2 - a.left - a.width / 2) + "px");
        el.style.setProperty("--dy", (b.top - a.top - a.height * 0.25) + "px");
        el.classList.add("is-right"); charger.classList.add("is-on");
        Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(charger);
        setTimeout(function () { el.classList.add("is-charged"); }, 650);
        Promise.resolve(Kido.audio.speak(U.pick(T.robots.done))).then(function () { return wait(900); }).then(function () { idx++; round(); });
        return;
      }
      tries++;
      el.classList.add("is-wrong"); Kido.fx.shake(el); Kido.audio.playIncorrectSound();
      var failed = rd.clues.filter(function (c) { return !fits(rb, c); })[0];
      say(whyNot(rb, failed));
      clueEl.classList.remove("rb-clue--pulse"); void clueEl.offsetWidth; clueEl.classList.add("rb-clue--pulse");
    }
    Kido.mascot.say("The robots are low on power! Read the clue and charge the right one.", { silent: true });
    setTimeout(round, 600);
  };
})(window);
