/* =========================================================================
   puzzleEngine.js — Kido.PuzzleEngine: one engine for every thinking challenge
   The engine owns everything a puzzle shares: loading the data, picking the
   level for the child's age, the stage (world backdrop, instruction, hint
   light, board), attempts, the hint ladder, feedback (sound / mascot / FX),
   timing + stats, and completion through Kido's existing reward flow.

   Puzzle TYPES only draw a board and report what happened. A type is
     Kido.PuzzleEngine.registerType("name", {
       build: function (ctx, level) {...},        // draw into ctx.board
       hint:  function (ctx, n) { return true; }  // n = 1 highlight, 2+ narrow down
     });
   and calls ctx.good(el) / ctx.miss(el, msg) / ctx.solved(). Types never play
   audio or award anything themselves.

   Reuses: Kido.engine (finish → Kido.rewards.award + celebrate + result screen,
   makeDraggable + tapPlacement for drag / tap / keyboard placement),
   Kido.audio, Kido.mascot, Kido.fx, Kido.age, Kido.progress.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;

  var TYPES = {};
  var DRAWINGS = {};

  /* Age band → puzzle tier. ageConfig difficulty runs 1..7 (bands 3-4 … 9-10). */
  var TIERS = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5, 7: 5 };
  var TIER_LABEL = { 1: "3–4", 2: "4–5", 3: "5–6", 4: "6–8", 5: "8–10" };
  var HINT_AFTER_MISTAKES = 2;       // offer help after this many misses since the last hint
  var HINT_AFTER_IDLE_MS = 22000;    // …or after this long without any interaction
  var STAGE_NAMES = { plant: ["seed", "sprout", "small plant", "bigger plant", "flowering plant"],
    bug: ["butterfly egg", "caterpillar", "chrysalis", "butterfly"],
    moon: ["new moon", "crescent moon", "half moon", "gibbous moon", "full moon"] };

  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function tier() { return TIERS[Kido.age.cfg().difficulty] || 3; }

  /* Difficulty = age tier + the puzzle's own offset. This is the starting point;
     Kido.Learning refines it from play (planPuzzle) when it is loaded. */
  function difficulty(puzzle) {
    var t = tier();
    return { tier: t, level: Math.max(1, Math.min(5, t + (puzzle.difficulty || 0))), ageLabel: TIER_LABEL[t] };
  }
  function pickLevel(puzzle, level) {
    var best = null;
    (puzzle.levels || []).forEach(function (l) { if (l.tier <= level && (!best || l.tier > best.tier)) best = l; });
    return best || puzzle.levels[0];
  }

  /* ---- art keys → markup ---- */
  function resolveKey(key) { var m = Kido.puzzles && Kido.puzzles.ART; return (m && m[key]) || key; }
  function art(key) {
    var k = resolveKey(key);
    if (k === "momo") return Kido.icons ? Kido.icons.momo() : "";
    if (k.indexOf("img:") === 0) return '<img class="pz-img" src="' + k.slice(4) + '" alt="" draggable="false" />';
    var m = /^(\w+)(?::(\w+))?$/.exec(k);
    var fn = m && (DRAWINGS[m[1]] || (Kido.puzzleArt && Kido.puzzleArt[m[1]]));
    return fn ? fn(m[2]) : "";
  }
  function isPhoto(key) { return /\.jpe?g$/i.test(resolveKey(key)); }
  function nameOf(key) {
    var m = /^(\w+):(\w+)$/.exec(key);
    if (m && STAGE_NAMES[m[1]]) return STAGE_NAMES[m[1]][(+m[2] || 1) - 1] || key;
    var named = m && Kido.puzzleArt && Kido.puzzleArt.labelOf && Kido.puzzleArt.labelOf(m[1], m[2]);   // number / letter cards
    if (named) return named;
    if (m) return m[2];
    return String(key).replace(/_/g, " ");
  }

  /* ---- stats (for the future adaptive model; nothing reads them to punish) ---- */
  function record(puzzle, lvl, st) {
    var all = Kido.progress.get("puzzleStats") || {};
    var s = all[puzzle.id] || { plays: 0, firstTry: 0 };
    s.plays += 1;
    if (!st.mistakes && !st.hints) s.firstTry += 1;
    s.last = { tier: lvl.tier, mistakes: st.mistakes, hints: st.hints, ms: Date.now() - st.t0, iso: new Date().toISOString() };
    all[puzzle.id] = s;
    Kido.progress.set("puzzleStats", all);
    // The adaptive layer reads the same moment (it never punishes; see js/engine/learning.js).
    return Kido.Learning ? Kido.Learning.recordPuzzle(puzzle, lvl.tier, st.plan,
      { mistakes: st.mistakes, hints: st.hints, ms: Date.now() - st.t0, solved: true }) : null;
  }

  var BULB = '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a6.5 6.5 0 00-3.8 11.8c.6.4.8 1 .8 1.7V18h6v-1.5c0-.7.3-1.3.8-1.7A6.5 6.5 0 0012 3z" fill="#FFC23D" stroke="#E59A12" stroke-width="1.2"/><rect x="9" y="18.5" width="6" height="2.6" rx="1.2" fill="#9FAECB"/><path d="M10 9.5a2.4 2.4 0 012-2" stroke="#FFF6D6" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  var SPEAKER = '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 010 6M18 6.5a8 8 0 010 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var GENTLE = ["Hmm, not that one. Try again!", "Good try! Look once more.", "Almost! Have another go."];

  /* opts (optional) — used when another engine hosts a puzzle (e.g. a story):
       host:   element to render into instead of the whole screen
       onDone: called with the final state instead of Kido's reward/result flow */
  function run(spec, opts) {
    opts = opts || {};
    var puzzle = Kido.puzzles && Kido.puzzles.get(spec.puzzleId);
    var type = puzzle && TYPES[puzzle.type];
    var mount = opts.host || document.getElementById("screen");
    mount.innerHTML = ""; mount.scrollTop = 0;
    if (!puzzle || !type) {
      console.warn("[Kido] Unknown puzzle", spec.puzzleId);
      if (opts.onDone) { opts.onDone({ skipped: true }); return; }
      Kido.fx.toast("Coming soon!"); return;
    }

    // Level: an explicit spec.level, else the adaptive plan (age start point refined by
    // play, with the configured mix of current / challenge / reinforcement), else age.
    var diff = difficulty(puzzle);
    var plan = !spec.level && Kido.Learning ? Kido.Learning.planPuzzle(puzzle) : null;
    var level = pickLevel(puzzle, spec.level || (plan ? plan.level : diff.level));
    var hintAfter = plan && plan.support ? 1 : HINT_AFTER_MISTAKES;   // finding it hard lately → help sooner
    var instruction = level.instruction || puzzle.instruction;
    var sayText = level.say || puzzle.say || instruction;

    var root = U.el("div", { class: "pz pz--" + puzzle.type + (calm() ? " is-calm" : "") + (opts.host ? " pz--hosted" : ""), "data-tier": String(level.tier) });
    if (Kido.worldArt && puzzle.world && !opts.host) {
      var wide = window.innerWidth / Math.max(1, window.innerHeight) >= 1.05;
      var a = Kido.worldArt.realm(puzzle.world, wide ? "L" : "P");
      var bg = U.el("div", { class: "pz-backdrop", "aria-hidden": "true" });
      bg.innerHTML = '<svg viewBox="0 0 ' + a.W + " " + a.H + '" preserveAspectRatio="xMidYMid slice">' + a.svg + "</svg>";
      root.appendChild(bg);
    }
    var stage = U.el("div", { class: "pz-stage" });
    var head = U.el("div", { class: "pz-head" });
    var again = U.el("button", { class: "pz-round pz-say", type: "button", "aria-label": "Hear it again", html: SPEAKER });
    var ask = U.el("h1", { class: "pz-ask", text: instruction });
    var hintBtn = U.el("button", { class: "pz-round pz-hint", type: "button", "aria-label": "Hint", html: BULB });
    head.appendChild(again); head.appendChild(ask); head.appendChild(hintBtn);
    var board = U.el("div", { class: "pz-board" });
    var live = U.el("div", { class: "sr-only", "aria-live": "polite" });
    stage.appendChild(head); stage.appendChild(board); stage.appendChild(live);
    root.appendChild(stage);
    mount.appendChild(root);

    var st = { t0: Date.now(), last: Date.now(), mistakes: 0, hints: 0, sinceHint: 0, steps: 0, solved: false, offered: false, plan: plan };
    var timers = [];
    var hintFn = null;

    function alive() { return root.isConnected; }
    function later(fn, ms) { var t = setTimeout(function () { if (alive()) fn(); }, ms); timers.push(t); return t; }
    function touch() { st.last = Date.now(); }
    // Sounds are named cues (js/data/audioRegistry.js); the question is a calm voice line.
    function sfx(id) { if (Kido.audio.cue) Kido.audio.cue(id); else Kido.audio.playTapSound(); }
    function say(text) { return Kido.Voice && Kido.Voice.say ? Kido.Voice.say(text, { kind: "question" }) : Kido.audio.speak(text); }
    function offerHint() {
      if (st.offered || st.solved) return;
      st.offered = true;
      hintBtn.classList.add("is-offered");
      Kido.mascot.say("Want a hint? Tap the light!", { mood: "thinking" });
    }
    function useHint() {
      if (st.solved) return;
      touch();
      st.hints++; st.sinceHint = 0; st.offered = false;
      hintBtn.classList.remove("is-offered");
      sfx("puzzle.hint");
      var n = st.hints;
      var did = hintFn ? hintFn(ctx, n) : false;
      if (n === 1) Kido.mascot.say(level.hint || puzzle.hint || "Look carefully!", { mood: "thinking" });
      else if (!did) Kido.mascot.say("You're so close! You can do it!", { mood: "excited" });
      else Kido.mascot.say("Here's a little help!", { mood: "happy" });
      live.textContent = "Hint " + n;
    }
    /* The challenge announcement, driven by audio events rather than fixed waits:
         banner + chime start together → the voice is asked to start so it begins
         as the chime's last note ends (chime end = its scheduled audio-clock time;
         start-up = the device voice's measured latency) → the banner stays until
         the line has been spoken (or long enough to read it when the voice is off)
         → the board opens and the question is asked as usual. */
    function announce(line) {
      var board = root.querySelector(".pz-board"), shownAt = Date.now();
      root.classList.add("is-announcing");
      if (board) board.setAttribute("inert", "");
      hintBtn.disabled = true;
      if (Kido.audio.prepareSpeech) Kido.audio.prepareSpeech();
      Kido.mascot.say(line, { mood: "excited", silent: true, hold: true, sound: false });
      var chime = Kido.audio.cue ? Kido.audio.cue("puzzle.challenge") : null;
      var c = Kido.audio.rawCtx ? Kido.audio.rawCtx() : null;
      var lead = Math.min(400, (Kido.audio.speechLatency && Kido.audio.speechLatency()) || 0);
      var speakAt;
      if (chime && chime.endsAt && c) speakAt = new Promise(function (r) { later(r, Math.max(0, (chime.endsAt - c.currentTime) * 1000 - lead)); });
      else speakAt = chime && chime.done ? chime.done : Promise.resolve();      // no chime (muted / not yet unlocked): speak now
      return speakAt.then(function () {
        if (!alive()) return null;
        var spoken = Kido.Voice && Kido.Voice.say ? Kido.Voice.say(line, { kind: "praise", speaker: "Momo" }) : Kido.audio.speak(line);
        Kido.mascot.talk(spoken);
        var readMs = 900 + line.length * 45;                                     // the words stay up long enough to read
        var cap = 4000 + line.length * 140;                                      // safety net if a device voice never reports "end"
        return Promise.race([
          Promise.all([spoken, new Promise(function (r) { later(r, Math.max(0, readMs - (Date.now() - shownAt))); })]),
          new Promise(function (r) { later(r, cap); })
        ]);
      }).then(function () {
        if (!alive()) return;
        root.classList.remove("is-announcing");
        if (board) board.removeAttribute("inert");
        if (!st.solved) hintBtn.disabled = false;
        Kido.mascot.hide();
      });
    }
    function watchIdle() {
      later(function () {
        if (!st.solved && Date.now() - st.last > HINT_AFTER_IDLE_MS) offerHint();
        if (!st.solved) watchIdle();
      }, 2000);
    }

    var ctx = {
      puzzle: puzzle, level: level, tier: level.tier, difficulty: diff, board: board, root: root,
      el: U.el, shuffle: U.shuffle, calm: calm, later: later, art: art, nameOf: nameOf,
      /** A picture token. tag "button" for things the child taps/drags. */
      token: function (key, o) {
        o = o || {};
        var t = U.el(o.tag || "div", {
          class: "pz-token" + (isPhoto(key) ? " pz-token--photo" : "") + (o.cls ? " " + o.cls : ""),
          "data-key": key, html: '<span class="pz-token__art">' + art(key) + "</span>" +
            (o.label ? '<span class="pz-token__label">' + o.label + "</span>" : "")
        });
        if (o.tag === "button") { t.type = "button"; t.setAttribute("aria-label", o.aria || o.label || nameOf(key)); }
        else if (o.aria !== false) { t.setAttribute("role", "img"); t.setAttribute("aria-label", o.aria || nameOf(key)); }
        return t;
      },
      say: function (text) { return say(text); },
      tap: function () { sfx("puzzle.select"); },
      status: function (text) { live.textContent = text; },
      onHint: function (fn) { hintFn = fn; },
      /** A right move (one step of the puzzle). */
      good: function (el, text) {
        touch(); st.steps++;
        sfx("puzzle.correct");
        if (el) { Kido.fx.sparkleEl(el); el.classList.remove("pz-good"); void el.offsetWidth; el.classList.add("pz-good"); }
        if (text) Kido.mascot.say(text, { mood: "celebrating", pose: "cheer" });
      },
      /** A gentle "not that one" — never a failure screen, never a lost life. */
      miss: function (el, text) {
        touch(); st.mistakes++; st.sinceHint++;
        sfx("puzzle.retry");
        if (el) Kido.fx.shake(el);
        Kido.mascot.say(text || GENTLE[st.mistakes % GENTLE.length], { mood: "thinking" });
        if (st.sinceHint >= hintAfter) offerHint();
      },
      /** Exploration that isn't wrong (e.g. bumping a rock in the maze). */
      nudge: function (el, text) {
        touch(); st.sinceHint++;
        sfx("puzzle.bump");
        if (el) Kido.fx.shake(el);
        if (text) Kido.mascot.say(text, { mood: "thinking" });
        if (st.sinceHint >= hintAfter + 1) offerHint();
      },
      /** Visual help: glow these for a few seconds. */
      highlight: function (els, ms) {
        (els || []).forEach(function (e) { if (e) { e.classList.remove("pz-glow"); void e.offsetWidth; e.classList.add("pz-glow"); } });
        later(function () { (els || []).forEach(function (e) { if (e) e.classList.remove("pz-glow"); }); }, ms || 3600);
      },
      /** Take a wrong choice off the table. */
      eliminate: function (el) {
        if (!el) return false;
        el.classList.add("pz-gone"); el.setAttribute("aria-hidden", "true"); el.setAttribute("tabindex", "-1");
        if (el.tagName === "BUTTON") el.disabled = true;
        return true;
      },
      /** Drag (touch + mouse) onto any .slot, via Kido's shared drag engine. */
      drag: function (chip, onDrop) { Kido.engine.makeDraggable(chip, { onDrop: onDrop }); },
      /** Tap-to-pick / tap-to-place + keyboard, the same path Kido's drag games use. */
      placement: function (attempt, o) { return Kido.engine.tapPlacement(attempt, o); },
      solved: function (extra) {
        if (st.solved) return;
        st.solved = true; touch();
        hintBtn.disabled = true; hintBtn.classList.remove("is-offered");
        root.classList.add("is-solved");
        record(puzzle, level, st);
        sfx("puzzle.complete");
        if (!opts.host && Kido.puzzles && Kido.puzzles.after) spec.followUp = Kido.puzzles.after(spec.activityId);   // a varied next one
        var praise = level.praise || puzzle.praise || "You solved it!", line = praise + (extra ? " " + extra : "");
        // praise and the "why" are separate recorded lines ("What a memory!" + "The banana went away!")
        Kido.mascot.say(line, { mood: "celebrating", pose: "cheer", parts: extra ? [praise, extra] : null });
        live.textContent = line;
        // Let the win land, then hand over to Kido's reward flow (stars, stickers, result screen).
        // Stars: right moves vs. right moves + misses + half a point per hint (first-try solve = 3 stars).
        var steps = Math.max(1, st.steps);
        if (opts.onDone) { later(function () { opts.onDone(ctx.state()); }, calm() ? 1200 : 1900); return; }
        spec.resultMsg = "You solved the puzzle";
        later(function () { Kido.engine.finish(spec, steps, steps + st.mistakes + st.hints * 0.5); }, calm() ? 1400 : 2300);
      },
      state: function () { return { mistakes: st.mistakes, hints: st.hints, steps: st.steps, ms: Date.now() - st.t0, solved: st.solved }; }
    };

    again.addEventListener("click", function () { touch(); say(sayText); });
    hintBtn.addEventListener("click", useHint);
    root.addEventListener("pointerdown", touch, { passive: true });
    root.addEventListener("keydown", touch);

    type.build(ctx, level);
    if (type.hint && !hintFn) hintFn = type.hint;
    if (plan && plan.line) {
      // Harder than last time: a happy "new challenge" moment — never a level or a score.
      announce(plan.line).then(function () { if (alive()) say(sayText); });
    } else {
      sfx("puzzle.start");
      later(function () { say(sayText); }, 250);
    }
    if (plan && plan.support) { hintBtn.classList.add("is-offered"); st.offered = true; }   // the light glows, ready to help
    watchIdle();
    return ctx;
  }

  Kido.PuzzleEngine = {
    TIERS: TIERS,
    registerType: function (name, def) { TYPES[name] = def; },
    registerArt: function (name, fn) { DRAWINGS[name] = fn; },
    types: function () { return Object.keys(TYPES); },
    tier: tier,
    difficulty: difficulty,
    pickLevel: pickLevel,
    art: art,
    nameOf: nameOf,
    run: run
  };
})(window);
