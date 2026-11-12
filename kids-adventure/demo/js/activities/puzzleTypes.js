/* =========================================================================
   puzzleTypes.js — the six built-in puzzle types for Kido.PuzzleEngine
     pattern      what comes next in a repeating row
     oddOneOut    tap the one that doesn't belong
     sequence     what comes next in a growth/story sequence, or put all in order
     match        take each item to its partner (drag, or tap-then-tap, or keys)
     sort         put items into the right basket
     maze         guide Momo to the star around the rocks (a puzzle may name its own hero + goal)
     missing      remember the pictures, then find the one that slipped away (no timer)
   Types only draw and judge; the engine does sound, mascot, hints, rewards.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var E = Kido.PuzzleEngine;
  if (!E) return;

  function firstWrong(buttons, answerKey) {
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (b.getAttribute("data-key") !== answerKey && !b.classList.contains("pz-gone") && !b.classList.contains("pz-tried")) return b;
    }
    for (var j = 0; j < buttons.length; j++) if (buttons[j].getAttribute("data-key") !== answerKey && !buttons[j].classList.contains("pz-gone")) return buttons[j];
    return null;
  }
  function left(buttons) { return buttons.filter(function (b) { return !b.classList.contains("pz-gone"); }).length; }

  /* ---- shared: a row with one missing piece + a tray of choices ---- */
  function missingPiece(ctx, rowKeys, options, answer, rowLabel, onHintRow, unit) {
    var row = ctx.el("div", { class: "pz-row", role: "group", "aria-label": rowLabel });
    row.style.setProperty("--n", Math.min(rowKeys.length, 5));   // CSS fallback until fitRow measures
    var slot = null, tokens = [];
    rowKeys.forEach(function (k, i) {
      var el;
      if (k === "?") {
        el = ctx.el("div", { class: "pz-slot slot", "aria-label": "Missing piece", html: '<span class="pz-q">?</span>' });
        slot = el;
      } else {
        el = ctx.token(k);
        tokens.push(el);
      }
      el.style.setProperty("--i", i);
      row.appendChild(el);
    });
    var tray = ctx.el("div", { class: "pz-tray", role: "group", "aria-label": "Choices" });
    var buttons = ctx.shuffle(options).map(function (k, i) {
      var b = ctx.token(k, { tag: "button", cls: "pz-choice" });
      b.style.setProperty("--i", i);
      function choose() {
        if (b.disabled || ctx.state().solved) return false;
        ctx.tap();
        if (k === answer) {
          slot.innerHTML = '<span class="pz-token__art">' + ctx.art(k) + "</span>";
          slot.classList.add("is-filled");
          buttons.forEach(function (x) { x.disabled = true; });
          b.classList.add("pz-picked");
          ctx.good(slot);
          ctx.solved();
          return true;
        }
        b.classList.add("pz-tried");
        ctx.miss(b);
        return false;
      }
      b.addEventListener("click", function () { if (b.__dragMoved) { b.__dragMoved = false; return; } choose(); });
      ctx.drag(b, function (target) { return target && target.closest && target.closest(".pz-slot") ? choose() : false; });
      tray.appendChild(b);
      return b;
    });
    ctx.board.appendChild(row);
    ctx.board.appendChild(tray);
    fitRow(row, rowKeys.length, unit || 1);
    ctx.onHint(function (c, n) {
      if (n === 1) { onHintRow(tokens, slot); return true; }
      return left(buttons) > 2 ? c.eliminate(firstWrong(buttons, answer)) : false;
    });
  }

  /* Lay a missing-piece row out so the pattern stays readable at any width:
     one line while pieces stay comfortably big; otherwise break only at whole
     repeats of the pattern (so each line starts the repeat again and the
     columns line up), and never leave a piece alone on the last line.
     Sizes come from CSS (--tok-max / --tok-comfy / --tok-min on .pz-row). */
  function fitRow(row, n, unit) {
    var cur = 0, ro = null;
    function px(cs, name, d) { var v = parseFloat(cs.getPropertyValue(name)); return isFinite(v) ? v : d; }
    function fit() {
      if (!row.isConnected) { if (ro) ro.disconnect(); return; }
      var w = row.clientWidth; if (!w) return;
      var cs = getComputedStyle(row), g = parseFloat(cs.columnGap) || 10;
      var max = px(cs, "--tok-max", 108), comfy = px(cs, "--tok-comfy", 52), min = px(cs, "--tok-min", 40);
      var single = Math.min(max, (w - (n - 1) * g) / n), cols = n;
      if (single < comfy) {
        var per = Math.max(1, Math.floor((w + g) / (comfy + g)));
        var c = unit > 1 && per >= unit ? Math.floor(per / unit) * unit : 0;
        if (c && c < n && n % c !== 1 && Math.ceil(n / c) <= 3) cols = c;          // whole repeats per line
        else if (single < min) cols = Math.max(1, Math.floor((w + g) / (min + g)));  // very narrow: plain wrap
      }
      if (cols !== cur) { cur = cols; row.style.setProperty("--cols", cols); }
    }
    fit();                                                                            // right away (layout is ready)
    if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(row); }   // then on rotate / resize
  }

  /* 1) PATTERN -------------------------------------------------------- */
  E.registerType("pattern", {
    build: function (ctx, lv) {
      missingPiece(ctx, lv.seq, lv.options, lv.answer, "Pattern", function (tokens, slot) {
        ctx.highlight(tokens.slice(0, lv.unit || 2).concat([slot]));   // the part that repeats
      }, lv.unit || 2);
    }
  });

  /* 2) ODD ONE OUT ---------------------------------------------------- */
  E.registerType("oddOneOut", {
    build: function (ctx, lv) {
      var grid = ctx.el("div", { class: "pz-grid", role: "group", "aria-label": "Pictures" });
      grid.style.setProperty("--n", lv.items.length);
      var buttons = ctx.shuffle(lv.items).map(function (k, i) {
        var b = ctx.token(k, { tag: "button", cls: "pz-choice pz-choice--big" });
        b.style.setProperty("--i", i);
        b.addEventListener("click", function () {
          if (b.disabled || ctx.state().solved) return;
          ctx.tap();
          if (k === lv.answer) {
            buttons.forEach(function (x) { x.disabled = true; if (x !== b) x.classList.add("pz-same"); });
            b.classList.add("pz-picked");
            ctx.good(b);
            ctx.solved(lv.why);
          } else {
            b.classList.add("pz-tried");
            ctx.miss(b, "That one belongs with the others. Try another!");
          }
        });
        grid.appendChild(b);
        return b;
      });
      ctx.board.appendChild(grid);
      ctx.onHint(function (c, n) {
        var same = buttons.filter(function (b) { return b.getAttribute("data-key") !== lv.answer && !b.classList.contains("pz-gone"); });
        if (n === 1) { c.highlight(same.slice(0, 2)); return true; }       // "these belong together"
        return left(buttons) > 2 ? c.eliminate(same[0]) : false;
      });
    }
  });

  /* 3) SEQUENCE ------------------------------------------------------- */
  E.registerType("sequence", {
    build: function (ctx, lv) {
      if (lv.mode !== "order") {
        missingPiece(ctx, lv.shown.concat(["?"]), lv.options, lv.answer, "Sequence", function (tokens, slot) {
          ctx.highlight([tokens[tokens.length - 1], slot]);                 // compare with the last one
        });
        return;
      }
      // "order": tap the pictures from first to last into the empty spaces.
      var row = ctx.el("div", { class: "pz-row pz-row--slots", role: "group", "aria-label": "Order" });
      row.style.setProperty("--n", Math.min(lv.order.length, 5));
      var slots = lv.order.map(function (k, i) {
        var s = ctx.el("div", { class: "pz-slot", "aria-label": "Space " + (i + 1), html: '<span class="pz-q">' + (i + 1) + "</span>" });
        row.appendChild(s);
        return s;
      });
      var tray = ctx.el("div", { class: "pz-tray", role: "group", "aria-label": "Pictures to put in order" });
      var next = 0;
      var buttons = ctx.shuffle(lv.order).map(function (k, i) {
        var b = ctx.token(k, { tag: "button", cls: "pz-choice" });
        b.style.setProperty("--i", i);
        b.addEventListener("click", function () {
          if (b.disabled || ctx.state().solved) return;
          ctx.tap();
          if (k === lv.order[next]) {
            var s = slots[next];
            s.innerHTML = '<span class="pz-token__art">' + ctx.art(k) + "</span>";
            s.classList.add("is-filled");
            b.disabled = true; b.classList.add("pz-gone");
            ctx.good(s);
            next++;
            ctx.status(ctx.nameOf(k) + " placed");
            if (next === lv.order.length) ctx.solved();
          } else {
            ctx.miss(b, next === 0 ? (lv.missFirst || "What comes first? Find the smallest!") : "Hmm, what comes right after that?");
          }
        });
        tray.appendChild(b);
        return b;
      });
      ctx.board.appendChild(row);
      ctx.board.appendChild(tray);
      ctx.onHint(function (c, n) {
        var want = buttons.filter(function (b) { return b.getAttribute("data-key") === lv.order[next]; })[0];
        if (n === 1) { c.highlight([slots[next], want]); return true; }
        var others = buttons.filter(function (b) { return b !== want && !b.disabled && !b.classList.contains("pz-dim"); });
        if (others.length <= 1) return false;
        others.slice(1).forEach(function (b) { b.classList.add("pz-dim"); });  // narrow to two candidates for now
        c.later(function () { others.forEach(function (b) { b.classList.remove("pz-dim"); }); }, 5000);
        return true;
      });
    }
  });

  /* ---- shared: drag / tap / keyboard placement onto targets ---- */
  function placeGame(ctx, opts) {
    var targetsWrap = ctx.el("div", { class: "pz-targets", role: "group", "aria-label": opts.targetsLabel });
    targetsWrap.style.setProperty("--n", opts.targets.length);
    var targets = opts.targets.map(function (t, i) {
      var s = ctx.el("div", { class: "pz-target slot", role: "button", tabindex: "0", "data-id": t.id, "aria-label": t.label });
      s.innerHTML = '<span class="pz-target__art">' + ctx.art(t.art) + "</span>" +
        (t.showLabel ? '<span class="pz-target__label">' + t.label + "</span>" : "") + '<span class="pz-target__items"></span>';
      s.style.setProperty("--i", i);
      targetsWrap.appendChild(s);
      return s;
    });
    var pool = ctx.el("div", { class: "pz-tray pz-pool", role: "group", "aria-label": opts.poolLabel });
    var remaining = opts.items.length;
    // While a token is picked, the places it can go breathe gently (.is-target-active) — "put it in here".
    var placer = ctx.placement(attempt, { onPick: function (chip) {
      targets.forEach(function (s) { s.classList.toggle("is-target-active", !!chip); });
    } });
    var chips = ctx.shuffle(opts.items).map(function (it, i) {
      var c = ctx.token(it.key, { tag: "button", cls: "pz-choice pz-chip", aria: ctx.nameOf(it.key) });
      c.setAttribute("aria-pressed", "false");
      c.setAttribute("data-goes", it.to);
      c.style.setProperty("--i", i);
      placer.chip(c);
      ctx.drag(c, function (t) { var s = t && t.closest && t.closest(".pz-target"); return s ? attempt(c, s) : false; });
      pool.appendChild(c);
      return c;
    });
    targets.forEach(function (s) { placer.slot(s); });

    function attempt(chip, slot) {
      if (chip.disabled || ctx.state().solved) return false;
      if (chip.getAttribute("data-goes") === slot.getAttribute("data-id")) {
        chip.disabled = true; chip.classList.remove("is-picked"); chip.classList.add("pz-placed");
        chip.setAttribute("aria-pressed", "false"); chip.setAttribute("tabindex", "-1");
        slot.querySelector(".pz-target__items").appendChild(chip);
        ctx.good(slot, opts.onGood ? opts.onGood(chip) : null);
        ctx.status(ctx.nameOf(chip.getAttribute("data-key")) + " placed");
        remaining--;
        if (!remaining) ctx.solved();
        return true;
      }
      ctx.miss(slot, opts.onMiss ? opts.onMiss(chip) : null);
      return false;
    }
    ctx.board.appendChild(pool);
    ctx.board.appendChild(targetsWrap);
    ctx.onHint(function (c, n) {
      var chip = chips.filter(function (x) { return !x.disabled; })[0];
      if (!chip) return false;
      var home = targets.filter(function (s) { return s.getAttribute("data-id") === chip.getAttribute("data-goes"); })[0];
      if (n === 1) { c.highlight([chip]); if (opts.clue) c.later(function () { Kido.mascot.say(opts.clue(chip), { mood: "thinking" }); }, 2600); return true; }
      c.highlight([chip, home], 5000);
      return true;
    });
  }

  /* 4) MATCHING ------------------------------------------------------- */
  // the wrong-home line for every item of every match puzzle, recorded by scripts/voice/harvest.js
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var out = [];
    (Kido.puzzles && Kido.puzzles.all ? Kido.puzzles.all() : []).forEach(function (pz) {
      if (pz.type !== "match") return;
      (pz.levels || []).forEach(function (lv) {
        (lv.pairs || []).forEach(function (p) {
          var who = E.nameOf(p[0]);
          out.push(lv.missText ? lv.missText.replace("{who}", who) : "Hmm, does the " + who + " live there? Try another home!");
        });
      });
    });
    return out;
  });
  E.registerType("match", {
    build: function (ctx, lv) {
      var clues = {};
      // lv.decoys: extra targets nobody belongs to (e.g. other animals' footprints).
      var targets = lv.pairs.map(function (p) { return p[1]; }).concat(lv.decoys || []);
      placeGame(ctx, {
        targetsLabel: lv.targetsLabel || "Homes", poolLabel: lv.poolLabel || "Animals",
        targets: (lv.decoys ? ctx.shuffle(targets) : targets).map(function (t) {
          return { id: t, art: t, label: (lv.labels && lv.labels[t]) || ctx.nameOf(t), showLabel: lv.showLabels !== false && Kido.age.cfg().showText };
        }),
        items: lv.pairs.map(function (p) { clues[p[0]] = p[2]; return { key: p[0], to: p[1] }; }),
        onGood: function (chip) { return clues[chip.getAttribute("data-key")]; },
        onMiss: function (chip) {
          var who = ctx.nameOf(chip.getAttribute("data-key"));
          return lv.missText ? lv.missText.replace("{who}", who) : "Hmm, does the " + who + " live there? Try another home!";
        },
        clue: function (chip) { return clues[chip.getAttribute("data-key")]; }
      });
    }
  });

  /* 5) SORTING -------------------------------------------------------- */
  // the wrong-basket and clue lines for every item of every sort puzzle, recorded by scripts/voice/harvest.js
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var out = [];
    (Kido.puzzles && Kido.puzzles.all ? Kido.puzzles.all() : []).forEach(function (pz) {
      if (pz.type !== "sort") return;
      (pz.levels || []).forEach(function (lv) {
        var names = {}, miss = lv.missText || pz.missText, clue = lv.clueText || pz.clueText;
        (lv.bins || []).forEach(function (b) { names[b[0]] = b[1]; });
        (lv.items || []).forEach(function (x) {
          var who = E.nameOf(x[0]);
          out.push(miss ? miss.replace("{thing}", who) : "Is a " + who + " " + (names[x[1]] === "Food" ? "an animal" : "food") + "? Try the other basket!",
            clue ? clue.replace("{thing}", who) : "Where does the " + who + " go?");
        });
      });
    });
    return out;
  });
  E.registerType("sort", {
    build: function (ctx, lv) {
      var names = {}, why = {};
      var miss = lv.missText || ctx.puzzle.missText, clue = lv.clueText || ctx.puzzle.clueText;   // "{thing}" = the item
      lv.bins.forEach(function (b) { names[b[0]] = b[1]; });
      ctx.board.classList.add("pz-board--sort");
      placeGame(ctx, {
        targetsLabel: lv.targetsLabel || ctx.puzzle.targetsLabel || "Baskets", poolLabel: "Things to sort",
        targets: lv.bins.map(function (b) { return { id: b[0], art: b[2], label: b[1], showLabel: true }; }),
        items: lv.items.map(function (x) { if (x[2]) why[x[0]] = x[2]; return { key: x[0], to: x[1] }; }),
        // Optional per-item "why" (third field) is said on a right placement: show -> try -> explain.
        onGood: function (chip) { return why[chip.getAttribute("data-key")] || null; },
        onMiss: function (chip) {
          var who = ctx.nameOf(chip.getAttribute("data-key"));
          if (miss) return miss.replace("{thing}", who);
          return "Is a " + who + " " + (names[chip.getAttribute("data-goes")] === "Food" ? "an animal" : "food") + "? Try the other basket!";
        },
        clue: function (chip) { var who = ctx.nameOf(chip.getAttribute("data-key")); return clue ? clue.replace("{thing}", who) : "Where does the " + who + " go?"; }
      });
    }
  });

  /* 6) SPATIAL: MAZE -------------------------------------------------- */
  E.registerType("maze", {
    build: function (ctx, lv) {
      var g = lv.grid, H = g.length, W = g[0].length, pos = null, goal = null;
      // Change #17A: a story maze can star its own hero and goal (Biscuit finding his home); default Momo + star.
      var pz = ctx.puzzle || {}, heroArt = pz.hero || "momo", goalArt = pz.goal || "goal", heroName = pz.heroName || "Momo", goalName = pz.goalName || "the star";
      var wrap = ctx.el("div", { class: "pz-maze-wrap" });
      var board = ctx.el("div", { class: "pz-maze", role: "application", tabindex: "0", "aria-label": "Maze. Use the arrow keys or the arrow buttons to move " + heroName + " to " + goalName + "." });
      board.style.setProperty("--cols", W); board.style.setProperty("--rows", H);
      var cells = [];
      g.forEach(function (row, y) {
        cells[y] = [];
        row.split("").forEach(function (ch, x) {
          var kind = ch === "#" ? "rock" : ch === "*" ? "bush" : "path";
          var c = ctx.el("div", { class: "pz-cell pz-cell--" + kind + ((x + y) % 2 ? " is-alt" : "") });
          if (kind !== "path") c.innerHTML = ctx.art(kind);
          if (ch === "S") pos = { x: x, y: y };
          if (ch === "G") { goal = { x: x, y: y }; c.innerHTML = ctx.art(goalArt); c.classList.add("pz-cell--goal"); }
          c.addEventListener("click", function () { tryStep(x - pos.x, y - pos.y, c); });
          cells[y][x] = c;
          board.appendChild(c);
        });
      });
      var hero = ctx.el("div", { class: "pz-hero" + (heroArt !== "momo" ? " pz-hero--rig" : ""), "aria-hidden": "true", html: ctx.art(heroArt) });
      board.appendChild(hero);
      function paint() {
        hero.style.transform = "translate(" + (pos.x * 100) + "%, " + (pos.y * 100) + "%)";
        cells[pos.y][pos.x].classList.add("is-visited");
      }
      function blocked(x, y) { return x < 0 || y < 0 || x >= W || y >= H || g[y][x] === "#" || g[y][x] === "*"; }
      function tryStep(dx, dy, fromCell) {
        if (ctx.state().solved) return;
        if (Math.abs(dx) + Math.abs(dy) !== 1) { if (fromCell && fromCell !== cells[pos.y][pos.x]) ctx.nudge(hero, "One step at a time! Tap a square next to " + heroName + "."); return; }
        var nx = pos.x + dx, ny = pos.y + dy;
        if (blocked(nx, ny)) {
          hero.classList.remove("pz-bump"); void hero.offsetWidth; hero.classList.add("pz-bump");
          ctx.nudge(null, nx < 0 || ny < 0 || nx >= W || ny >= H ? null : "Oops, something's in the way! Try another way.");
          return;
        }
        ctx.tap();
        pos = { x: nx, y: ny };
        paint();
        if (nx === goal.x && ny === goal.y) { ctx.good(cells[ny][nx]); ctx.solved(); }
      }
      // Arrow pad (big touch targets) + keyboard + swipe on the board.
      var pad = ctx.el("div", { class: "pz-pad", role: "group", "aria-label": "Move " + heroName });
      [["up", 0, -1, "M12 5l7 8h-4.5v6h-5v-6H5z"], ["left", -1, 0, "M5 12l8-7v4.5h6v5h-6V19z"], ["down", 0, 1, "M12 19l-7-8h4.5V5h5v6H19z"], ["right", 1, 0, "M19 12l-8 7v-4.5H5v-5h6V5z"]].forEach(function (d) {
        var b = ctx.el("button", { class: "pz-round pz-arrow pz-arrow--" + d[0], type: "button", "aria-label": "Move " + d[0],
          html: '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d[3] + '" fill="currentColor"/></svg>' });
        b.addEventListener("click", function () { tryStep(d[1], d[2]); });
        pad.appendChild(b);
      });
      board.addEventListener("keydown", function (e) {
        var k = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
        if (k) { e.preventDefault(); tryStep(k[0], k[1]); }
      });
      var sx = 0, sy = 0, swiping = false;
      board.addEventListener("pointerdown", function (e) { sx = e.clientX; sy = e.clientY; swiping = true; board.__swiped = false; });
      board.addEventListener("pointerup", function (e) {
        if (!swiping) return; swiping = false;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;             // a tap, not a swipe
        if (Math.abs(dx) > Math.abs(dy)) tryStep(dx > 0 ? 1 : -1, 0); else tryStep(0, dy > 0 ? 1 : -1);
        board.__swiped = true;
      });
      board.addEventListener("click", function (e) { if (board.__swiped) { board.__swiped = false; e.stopPropagation(); } }, true);
      wrap.appendChild(board);
      wrap.appendChild(pad);
      ctx.board.appendChild(wrap);
      paint();

      function nextSteps() {                                                 // shortest path from Momo (BFS)
        var q = [[pos.x, pos.y]], prev = {}, key = function (x, y) { return x + "," + y; };
        prev[key(pos.x, pos.y)] = null;
        while (q.length) {
          var c = q.shift();
          if (c[0] === goal.x && c[1] === goal.y) break;
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
            var nx = c[0] + d[0], ny = c[1] + d[1];
            if (blocked(nx, ny) || key(nx, ny) in prev) return;
            prev[key(nx, ny)] = c; q.push([nx, ny]);
          });
        }
        var path = [], cur = [goal.x, goal.y];
        while (cur && !(cur[0] === pos.x && cur[1] === pos.y)) { path.unshift(cur); cur = prev[key(cur[0], cur[1])]; }
        return path;
      }
      ctx.onHint(function (c, n) {
        var p = nextSteps();
        if (!p.length) return false;
        c.highlight(p.slice(0, n === 1 ? 1 : 2).map(function (s) { return cells[s[1]][s[0]]; }), 4500);
        return true;
      });
    }
  });

  /* 7) MEMORY: WHAT'S MISSING? (Change #20) ---------------------------
     Look at the pictures for as long as you like, tap "I'm ready", and one of
     them slips away: which one is missing? No timer, ever: the child decides
     when to look away. lv.items, lv.missing, lv.choices (tray size),
     lv.mix (the others swap places too, for older children). */
  E.registerType("missing", {
    build: function (ctx, lv) {
      var wrap = ctx.el("div", { class: "pz-memory" });
      var grid = ctx.el("div", { class: "pz-grid pz-memory__grid", role: "group", "aria-label": "Pictures to remember" });
      var tokens = lv.items.map(function (k, i) { var t = ctx.token(k); t.style.setProperty("--i", i); grid.appendChild(t); return t; });
      var ready = ctx.el("button", { class: "btn btn--mango pz-ready", type: "button", text: lv.readyText || ctx.puzzle.readyText || "I'm ready!" });
      wrap.appendChild(grid); wrap.appendChild(ready);
      ctx.board.appendChild(wrap);
      var slot = null, buttons = [];

      ready.addEventListener("click", function () {
        if (ready.disabled) return;
        ready.disabled = true; ctx.tap();
        grid.classList.add("is-peek");                       // a quick blink, so the change feels like magic
        ctx.later(function () {
          var gone = tokens[lv.items.indexOf(lv.missing)];
          slot = ctx.el("div", { class: "pz-slot slot pz-memory__slot", "aria-label": "Missing picture", html: '<span class="pz-q">?</span>' });
          grid.replaceChild(slot, gone);
          if (lv.mix) ctx.shuffle([].slice.call(grid.children)).forEach(function (el) { grid.appendChild(el); });
          grid.classList.remove("is-peek");
          ready.remove();
          var others = ctx.shuffle(lv.items.filter(function (k) { return k !== lv.missing; })).slice(0, Math.max(1, (lv.choices || 3) - 1));
          var tray = ctx.el("div", { class: "pz-tray", role: "group", "aria-label": "Which one is missing?" });
          buttons = ctx.shuffle(others.concat([lv.missing])).map(function (k, i) {
            var b = ctx.token(k, { tag: "button", cls: "pz-choice" });
            b.style.setProperty("--i", i);
            b.addEventListener("click", function () {
              if (b.disabled || ctx.state().solved) return;
              ctx.tap();
              if (k === lv.missing) {
                slot.innerHTML = '<span class="pz-token__art">' + ctx.art(k) + "</span>";
                slot.classList.add("is-filled");
                buttons.forEach(function (x) { x.disabled = true; });
                b.classList.add("pz-picked");
                ctx.good(slot);
                ctx.solved(lv.why || null);
              } else {
                b.classList.add("pz-tried");
                ctx.miss(b, lv.missText || ctx.puzzle.missText || "That one is still here! Look again.");
              }
            });
            tray.appendChild(b);
            return b;
          });
          wrap.appendChild(tray);
          ctx.say(lv.askText || ctx.puzzle.askText || "Something slipped away! What's missing?");
          ctx.status("One picture is missing. Choose it from the tray.");
          if (buttons[0]) buttons[0].focus({ preventScroll: true });
        }, ctx.calm() ? 150 : 650);
      });

      ctx.onHint(function (c, n) {
        if (!slot) { c.highlight([ready]); return true; }   // "tap me when you're ready"
        if (n === 1) { c.highlight([slot]); return true; }  // look where it used to be
        return left(buttons) > 2 ? c.eliminate(firstWrong(buttons, lv.missing)) : false;
      });
    }
  });
})(window);
