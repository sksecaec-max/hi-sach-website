/* =========================================================================
   adventure.js — Kido.adventure: Today's Adventure (Change #12)

   A small invitation that strings EXISTING content into one loop:

       DISCOVER   →   THINK    →   STORY / EXPLORE   →   complete!
       a discovery    a puzzle     a story, or a Kido World place

   Nothing here is a new engine, recommender or reward system:
     • Kido.Learning (Change #7) makes the choices — pickDiscovery, the puzzle
       from today(), pickStory. This file only adds availability fallbacks (an
       "explore" activity, a classic picture story, a place to explore), ordered
       by the same finish history, so an adventure is never empty.
     • Steps are ordinary catalog activities (Kido.screens.play) or a Kido World
       place (Kido.world.enter). A step is done when that activity finishes,
       wherever it was started — Kido.rewards.award calls noteFinish().
     • Finishing every step replays the existing celebration and adds one
       sticker to the existing album (Kido.rewards.bonusSticker); once the album
       is full the celebration itself is the reward.

   State lives in Kido.progress: "adventure" (the current one) and "adventures"
   (a short log of finished ones, for variety and the Parent Zone) — on this
   device only. Nothing expires: no timers, streaks, lives or "come back"
   messages. An unfinished adventure simply waits. A new one is planned once
   the last is finished and the child returns for another play session
   (Kido.Learning's session), or on a new day if the last one never began.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;

  var KEY = "adventure", LOG = "adventures", LOG_MAX = 60;
  var LATELY_DAYS = 3;   // a discovery / picture story / explore played this recently waits its turn

  /* Existing activities that stand in when Change #7's first choice can't be
     used (the one Quick Discovery was explored lately, no puzzle fits, …). */
  var FALLBACK = {
    discover: ["animal-explore", "bird-explore", "flower-explore", "fruit-explore", "vehicle-explore"],
    think: ["shape-sorter", "memory-match", "shadow-match"]
  };
  var ROLE = {
    discover: { label: "Discover", icon: "discover" },
    think:    { label: "Think",    icon: "think" },
    story:    { label: "Story",    icon: "stories" },
    world:    { label: "Explore",  icon: "explore" }
  };
  var THE = { jungle: true, ocean: true, space: true };   // "the Jungle", but "Puzzle Island"

  /* What Momo says — one line at each moment, never a running commentary. */
  var LINES = {
    discover: "Let's see what we can discover!",
    think: "Time for a thinking puzzle!",
    story: "Story time!",
    continueStory: "Let's continue your story!",
    world: "Let's explore {place}!",
    fresh: "Ready for today's adventure?",
    resume: "Continue Today's Adventure?",
    step: ["Great! What's next?", "Well done! What's next?", "Hooray! What's next?"],
    complete: "Your adventure is complete!"
  };

  function P() { return Kido.progress; }
  function L() { return Kido.Learning || null; }
  function W() { return Kido.world || null; }
  function iso() { return new Date().toISOString(); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  /** Local calendar day ("2026-10-03"). */
  function dayKey(t) { var d = t ? new Date(t) : new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function lately(t) { return !!t && Date.now() - Date.parse(t) < LATELY_DAYS * 864e5; }
  function icon(n) { return Kido.icons && Kido.icons[n] ? Kido.icons[n]() : ""; }
  function cue(id) { if (Kido.audio && Kido.audio.cue) Kido.audio.cue(id); }
  function tap() { if (Kido.audio && Kido.audio.playTapSound) Kido.audio.playTapSound(); }
  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function usable(id) { return !!(id && Kido.catalog && Kido.catalog.get(id)); }
  function worldOf(id) { return id && W() && W().worldOf ? W().worldOf(id) : null; }
  function sessionId() { try { var l = L(); return l && l.session ? l.session().id : null; } catch (e) { return null; } }
  function isDone(s) { return !!s.doneISO; }
  function showNames() { var c = Kido.age && Kido.age.cfg ? Kido.age.cfg() : null; return !c || c.showText !== false; }

  /* ---------------- what is suitable ---------------- */
  function storyOf(activityId) { return (Kido.storyAdventures || []).filter(function (s) { return s.activityId === activityId; })[0] || null; }
  function storyState(activityId) {
    var st = storyOf(activityId), sp = P().get("storyProgress") || {};
    return st && sp[st.id] ? sp[st.id].status : null;
  }
  /** Content with an ageRange (Quick Discoveries, story adventures, puzzles) is
      offered only when it overlaps the child's age band. */
  function ageRange(id) {
    var v = Kido.videos && Kido.videos.list ? Kido.videos.list().filter(function (x) { return x.discovery && x.discovery.activityId === id; })[0] : null;
    if (v) return v.ageRange || null;
    var st = storyOf(id);
    if (st) return st.ageRange || null;
    var pz = Kido.puzzles && Kido.puzzles.get ? Kido.puzzles.get(id) : null;
    return pz ? pz.ageRange || null : null;
  }
  function ageOk(id) {
    var r = ageRange(id); if (!r) return true;
    var b = String(Kido.age && Kido.age.current ? Kido.age.current() : "5-6").split("-").map(Number);
    return b[0] <= r[1] && b[1] >= r[0];
  }
  /** When an activity was last finished — the same record the Parent Zone reads. */
  function lastDone(id) { var r = (P().get("completed") || {})[id]; return (r && r.lastISO) || ""; }
  function leastRecent(ids) { return ids.slice().sort(function (a, b) { return lastDone(a).localeCompare(lastDone(b)); })[0] || null; }
  /** Change #7's discovery memory: when this discovery's topic was last explored. */
  function lastDiscovered(activityId) {
    var l = L(), d = l && l.profile ? l.profile().discoveries || {} : {}, t = "";
    Object.keys(d).forEach(function (k) { if (d[k].activityId === activityId && (d[k].lastISO || "") > t) t = d[k].lastISO; });
    return t || lastDone(activityId);
  }
  function keyOf(s) { return s.kind === "world" ? "world:" + s.world : s.id; }
  /** What the current and the last two finished adventures offered, so one is never a copy of the last. */
  function recentOffers() {
    var out = [];
    (P().get(LOG) || []).slice(0, 2).forEach(function (e) { out = out.concat(e.ids || []); });
    var cur = load(); if (cur) out = out.concat(cur.steps.map(keyOf));
    return out;
  }

  /* ---------------- choosing the steps (Change #7 first, then fallbacks) ---------------- */
  function discoverStep(avoid) {
    var l = L(), fits = function (a) { return usable(a) && ageOk(a) && avoid.indexOf(a) === -1; };
    var id = l && l.pickDiscovery ? l.pickDiscovery({ ok: fits }) : null;    // a topic for this age, not explored lately
    if (usable(id) && ageOk(id) && avoid.indexOf(id) === -1 && !lately(lastDiscovered(id))) return { role: "discover", kind: "discovery", id: id };
    var alt = FALLBACK.discover.filter(function (a) { return usable(a) && avoid.indexOf(a) === -1 && !lately(lastDone(a)); });
    if (!alt.length) alt = FALLBACK.discover.filter(function (a) { return usable(a) && avoid.indexOf(a) === -1; });
    if (alt.length) return { role: "discover", kind: "explore", id: leastRecent(alt) };
    if (usable(id) && ageOk(id)) return { role: "discover", kind: "discovery", id: id };   // everything is recent: a favourite returns
    return null;
  }
  function thinkStep(avoid) {
    var l = L(), plan = [];
    try { plan = l && l.today ? l.today() : []; } catch (e) { plan = []; }
    // Change #7's plan for today leads: a familiar puzzle once some are played, a new one before that.
    // The puzzle engine itself then sets the level (support, current or a stretch).
    var ids = plan.filter(function (x) { return (x.role === "familiar" || x.role === "challenge") && usable(x.id) && ageOk(x.id); })
      .map(function (x) { return x.id; });
    var id = ids.filter(function (x) { return avoid.indexOf(x) === -1; })[0] || null;
    if (!id && l && l.pickPuzzle) { var p = l.pickPuzzle({ exclude: avoid }); if (usable(p) && ageOk(p)) id = p; }
    id = id || ids[0] || null;
    if (id) return { role: "think", kind: "puzzle", id: id };
    var alt = FALLBACK.think.filter(function (a) { return usable(a) && avoid.indexOf(a) === -1; });
    if (!alt.length) alt = FALLBACK.think.filter(usable);
    return alt.length ? { role: "think", kind: "game", id: leastRecent(alt) } : null;
  }
  function storyStep(avoid) {
    var l = L(), id = l && l.pickStory ? l.pickStory() : null;                   // the story read least
    if (usable(id) && ageOk(id) && storyState(id) !== "complete" && avoid.indexOf(id) === -1) return { role: "adventure", kind: "story", id: id };
    // Story Castle's picture stories that weren't read lately (Change #17A: they are adventures now, with an age range).
    var castle = W() && W().WORLDS && W().WORLDS.castle;
    var books = castle ? castle.more.filter(function (a) { return a.indexOf("story-") === 0 && usable(a) && ageOk(a) && avoid.indexOf(a) === -1 && !lately(lastDone(a)); }) : [];
    return books.length ? { role: "adventure", kind: "story", id: leastRecent(books) } : null;
  }
  function worldStep(avoidWorlds) {
    var w = W(); if (!w || !w.ORDER) return null;
    var open = w.ORDER.filter(function (id) { return w.isOpen(id) && avoidWorlds.indexOf(id) === -1 && w.WORLDS[id].more.some(usable); });
    if (!open.length) return null;
    // The open place visited longest ago (or never), from the same finish history.
    function lastIn(id) { return w.WORLDS[id].more.reduce(function (t, a) { var x = lastDone(a); return x > t ? x : t; }, ""); }
    open.sort(function (a, b) { return lastIn(a).localeCompare(lastIn(b)); });
    return { role: "adventure", kind: "world", id: null, world: open[0] };
  }
  /** Third step: a story already under way first; otherwise a story and a place take turns. */
  function adventureStep(avoid, avoidWorlds, lastKind) {
    var going = (Kido.storyAdventures || []).filter(function (s) {
      return usable(s.activityId) && ageOk(s.activityId) && storyState(s.activityId) === "in-progress";
    })[0];
    if (going) return { role: "adventure", kind: "story", id: going.activityId };
    var story = storyStep(avoid), place = worldStep(avoidWorlds);
    return lastKind === "story" ? (place || story) : (story || place);
  }
  function thirdKind(a) { var s = a && a.steps.filter(function (x) { return x.role === "adventure"; })[0]; return s ? s.kind : null; }
  function plan(prev) {
    var avoid = recentOffers(), steps = [];
    var d = discoverStep(avoid); if (d) steps.push(d);
    var t = thinkStep(avoid.concat(steps.map(keyOf))); if (t) steps.push(t);
    var avoidWorlds = steps.map(function (s) { return worldOf(s.id); }).filter(Boolean)
      .concat(avoid.filter(function (k) { return k.indexOf("world:") === 0; }).map(function (k) { return k.slice(6); }));
    var lastKind = thirdKind(prev) || ((P().get(LOG) || [])[0] || {}).third || null;
    var a = adventureStep(avoid.concat(steps.map(keyOf)), avoidWorlds, lastKind); if (a) steps.push(a);
    return steps.length >= 2 ? steps : null;   // never offer a broken or near-empty adventure
  }
  /** A different step for the same role (content gone, a world closed, a start that failed). */
  function replacement(a, i) {
    var s = a.steps[i], avoid = recentOffers();
    if (s.role === "discover") return discoverStep(avoid);
    if (s.role === "think") return thinkStep(avoid);
    var worlds = a.steps.map(function (x) { return x.kind === "world" ? x.world : worldOf(x.id); }).filter(Boolean);
    return s.kind === "world" ? (worldStep(worlds) || storyStep(avoid)) : (storyStep(avoid) || worldStep(worlds));
  }

  /* ---------------- state ---------------- */
  function load() { var a = P() && P().get(KEY); return a && a.v === 1 && Array.isArray(a.steps) && a.steps.length ? a : null; }
  function save(a) { P().set(KEY, a); }
  function started(a) { return !!a.startedISO || a.steps.some(isDone); }
  /** The step to suggest: the one last started if it isn't finished, else the first not done. */
  function nextIndex(a) {
    if (a.current != null && a.steps[a.current] && !isDone(a.steps[a.current])) return a.current;
    for (var i = 0; i < a.steps.length; i++) if (!isDone(a.steps[i])) return i;
    return -1;
  }
  function fresh(prev) {
    var steps = plan(prev); if (!steps) return null;
    var a = { v: 1, id: (prev ? prev.id : 0) + 1, createdISO: iso(), dateKey: dayKey(), session: sessionId(),
      startedISO: null, current: null, completedISO: null, completedSession: null, rewardClaimed: false, reward: null,
      steps: steps.map(function (s) { s.doneISO = null; return s; }) };
    save(a);
    return a;
  }
  /** Swap any unfinished step that can no longer be played; null if too little is left. */
  function repair(a) {
    if (a.completedISO) return a;
    var changed = false;
    for (var i = a.steps.length - 1; i >= 0; i--) {
      var s = a.steps[i]; if (isDone(s)) continue;
      var ok = s.kind === "world" ? !!(W() && W().WORLDS && W().WORLDS[s.world] && W().isOpen(s.world)) : usable(s.id);
      if (ok) continue;
      var r = replacement(a, i);
      if (r) { r.doneISO = null; a.steps[i] = r; } else a.steps.splice(i, 1);
      if (a.current === i) a.current = null;
      changed = true;
    }
    if (a.steps.length < 2) return null;
    if (changed) save(a);
    return a;
  }
  /** The adventure to show now, planning a new one when it's time. */
  function ensure() {
    var a = load();
    if (a) a = repair(a);
    if (!a) return fresh(load());
    if (a.completedISO) return (a.rewardClaimed && a.completedSession !== sessionId()) ? (fresh(a) || a) : a;
    if (!started(a) && a.dateKey !== dayKey()) return fresh(a) || a;   // never begun: today gets fresh picks
    return a;                                                         // under way: it waits, nothing is lost
  }

  /* ---------------- progress ---------------- */
  var justDone = null;   // the step a finish just completed, read once by the result screen
  function matches(s, activityId) { return s.kind === "world" ? worldOf(activityId) === s.world : s.id === activityId; }
  /** Kido.rewards.award → was that one of today's steps? (Counts wherever it was played.) */
  function noteFinish(activityId) {
    var a = load(); if (!a || a.completedISO) return null;
    var i = -1;
    for (var k = 0; k < a.steps.length; k++) if (!isDone(a.steps[k]) && matches(a.steps[k], activityId)) { i = k; break; }
    if (i === -1) return null;
    var t = iso(), s = a.steps[i];
    s.doneISO = t;
    if (s.kind === "world") s.played = activityId;
    if (!a.startedISO) a.startedISO = t;
    if (a.steps.every(isDone)) { a.completedISO = t; a.completedSession = sessionId(); }
    save(a);
    justDone = { activityId: activityId, index: i, at: Date.now() };
    return justDone;
  }
  /** The reward for a finished adventure, given once: one sticker for the album (if any are left). */
  function claim(a) {
    if (!a || !a.completedISO) return null;
    if (a.rewardClaimed) return { sticker: null, already: true };
    var st = Kido.rewards && Kido.rewards.bonusSticker ? Kido.rewards.bonusSticker() : null;
    a.rewardClaimed = true;
    a.reward = st ? { sticker: st.id } : { generic: true };
    var log = P().get(LOG) || [];
    log.unshift({ id: a.id, createdISO: a.createdISO, startedISO: a.startedISO, completedISO: a.completedISO,
      ids: a.steps.map(keyOf), third: thirdKind(a) });
    if (log.length > LOG_MAX) log.length = LOG_MAX;
    P().set(LOG, log);
    save(a);
    return { sticker: st };
  }

  /* ---------------- names and pictures ---------------- */
  function roleOf(s) { return s.role === "adventure" ? (s.kind === "world" ? ROLE.world : ROLE.story) : ROLE[s.role]; }
  function placeName(id) { var w = W() && W().WORLDS && W().WORLDS[id]; return w ? w.name : ""; }
  function placePhrase(id) { return (THE[id] ? "the " : "") + placeName(id); }
  function stepName(s) {
    if (!s) return "";
    if (s.kind === "world") return placeName(s.world);
    var a = Kido.catalog && Kido.catalog.get(s.id);
    return a ? a.name : "";
  }
  /** Button wording for a step ("Explore the Ocean", "The Lost Little Bird"). */
  function stepAction(s) { return s.kind === "world" ? "Explore " + placePhrase(s.world) : stepName(s); }
  function medal(s) {
    if (s.kind === "world") {
      return '<span class="adv-medal__art adv-medal__art--place">' + (Kido.worldArt && Kido.worldArt.thumb ? Kido.worldArt.thumb(s.world) : icon("explore")) + "</span>";
    }
    var src = Kido.screens && Kido.screens.mediaFor ? Kido.screens.mediaFor(s.id) : null;
    if (src) return '<img class="adv-medal__img' + (/\.jpe?g(\?|$)/i.test(src) ? " is-photo" : "") + '" src="' + src + '" alt="" loading="lazy" draggable="false" />';
    return '<span class="adv-medal__art">' + icon(roleOf(s).icon) + "</span>";
  }
  function lineFor(a) {
    var s = a.steps[nextIndex(a)];
    if (!s) return LINES.complete;
    if (s.role === "discover") return LINES.discover;
    if (s.role === "think") return LINES.think;
    if (s.kind === "world") return LINES.world.replace("{place}", placePhrase(s.world));
    return storyState(s.id) === "in-progress" ? LINES.continueStory : LINES.story;
  }

  /* ---------------- the trail: DISCOVER → THINK → STORY/EXPLORE → finish ---------------- */
  function trail(a, opts) {
    opts = opts || {};
    var next = nextIndex(a), total = a.steps.length, names = !opts.compact && showNames();
    var list = U.el("ol", { class: "adv-trail" + (opts.compact ? " adv-trail--compact" : "") });
    a.steps.forEach(function (s, i) {
      var done = isDone(s), r = roleOf(s), name = stepName(s);
      var li = U.el("li", { class: "adv-step " + (done ? "is-done" : i === next ? "is-next" : "is-todo") + (opts.fresh === i ? " is-fresh" : "") });
      var label = "Step " + (i + 1) + " of " + total + ", " + r.label + ": " + name + (done ? ". Done" : i === next ? ". Next" : "");
      var tick = done ? '<span class="adv-medal__tick">' + icon("check") + "</span>" : "";
      var face;
      if (opts.onTap && !done) {
        face = U.el("button", { class: "adv-medal", type: "button", "aria-label": label, html: medal(s) + tick });
        face.addEventListener("click", function () { opts.onTap(i); });
      } else {
        face = U.el("span", { class: "adv-medal", role: "img", "aria-label": label, html: medal(s) + tick });
      }
      li.appendChild(face);
      li.appendChild(U.el("span", { class: "adv-step__role", "aria-hidden": "true", html: icon(r.icon) + "<span>" + r.label + "</span>" }));
      if (names) li.appendChild(U.el("span", { class: "adv-step__name", "aria-hidden": "true", text: name }));
      list.appendChild(li);
    });
    var won = !!a.completedISO;
    list.appendChild(U.el("li", { class: "adv-step adv-step--goal" + (won ? " is-done" : "") }, [
      U.el("span", { class: "adv-medal adv-medal--goal", role: "img", "aria-label": won ? "Adventure complete" : "The finish", html: icon("trophy") }),
      U.el("span", { class: "adv-step__role", "aria-hidden": "true", text: won ? "Done!" : "Finish" })
    ]));
    return list;
  }
  function stickerNote(st) {
    return U.el("div", { class: "adv-reward" }, [
      U.el("div", { class: "reveal-sticker" }, [
        U.el("div", { class: "reveal-sticker__emoji", text: st.emoji }),
        U.el("div", { class: "reveal-sticker__label", text: st.name }),
        U.el("div", { class: "reveal-sticker__tag", text: "NEW" })
      ]),
      U.el("p", { class: "adv-reward__msg", text: "A new sticker for your adventure!" })
    ]);
  }

  /* ---------------- the adventure card (from Kido World) ---------------- */
  var card = null;
  function momoSays(actor, text) {
    var p = Kido.audio && Kido.audio.speak ? Kido.audio.speak(text, { speaker: "Momo" }) : null;
    if (actor && actor.el && p && p.then) {
      actor.el.classList.add("is-talking");
      var done = function () { actor.el.classList.remove("is-talking"); };
      p.then(done, done);
    }
  }
  function warm(a) {   // only the next step is prepared (a discovery clip, if it has one)
    var s = a.steps[nextIndex(a)];
    if (s && s.id && Kido.videos && Kido.videos.preloadFor) Kido.videos.preloadFor(s.id);
  }
  /** opts: { mode: "resume", returnFocus } — false when there is nothing to show. */
  function open(opts) {
    opts = opts || {};
    if (Kido.parent && Kido.parent.isOpen && Kido.parent.isOpen()) return false;
    var a = ensure(); if (!a) return false;
    closeCard(true);
    var complete = !!a.completedISO, reward = complete ? claim(a) : null;
    var line = complete ? LINES.complete : opts.mode === "resume" ? LINES.resume : lineFor(a);

    var layer = U.el("div", { class: "adv-layer" });
    var sheet = U.el("div", { class: "kw-sheet adv-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "adv-title" });
    var box = U.el("div", { class: "kw-sheet__card adv-card" + (complete ? " is-complete" : "") });
    var x = U.el("button", { class: "kw-sheet__close", type: "button", "aria-label": "Close", html: icon("close") });
    box.appendChild(x);
    box.appendChild(U.el("h2", { class: "kw-sheet__title adv-card__title", id: "adv-title", text: complete ? "Adventure complete!" : "Today's Adventure" }));
    var actor = Kido.Characters && Kido.Characters.create ? Kido.Characters.create("momo", { size: 64, className: "adv-momo__rig" }) : null;
    var momo = U.el("div", { class: "adv-momo" });
    if (actor) { actor.set(complete ? "celebrating" : "excited"); momo.appendChild(actor.el); }
    momo.appendChild(U.el("p", { class: "adv-momo__say", text: line }));
    box.appendChild(momo);
    box.appendChild(trail(a, { onTap: complete ? null : function (i) { tap(); play(i); } }));
    if (reward && reward.sticker) box.appendChild(stickerNote(reward.sticker));

    var actions = U.el("div", { class: "adv-card__actions" }), primary = null;
    if (!complete) {
      primary = U.el("button", { class: "btn btn--leaf btn--block adv-go", type: "button",
        html: icon("play") + "<span>" + (started(a) ? "Continue" : "Let's go!") + "</span>" });
      primary.addEventListener("click", function () { tap(); play(nextIndex(a)); });
      actions.appendChild(primary);
    }
    var explore = U.el("button", { class: "btn btn--ghost btn--block adv-explore", type: "button", text: "Explore Adventure World" });
    explore.addEventListener("click", function () { tap(); closeCard(); });
    actions.appendChild(explore);
    box.appendChild(actions);
    sheet.appendChild(box);
    layer.appendChild(sheet);

    function onKey(e) {
      if (!card || (Kido.parent && Kido.parent.isOpen && Kido.parent.isOpen())) return;
      if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); closeCard(); return; }
      if (e.key !== "Tab") return;
      var f = [].slice.call(sheet.querySelectorAll("button:not([disabled])"));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    x.addEventListener("click", function () { tap(); closeCard(); });
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeCard(); });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(layer);
    var app = document.getElementById("app"); if (app) app.setAttribute("inert", "");   // the world waits behind the card
    card = { layer: layer, onKey: onKey, returnFocus: opts.returnFocus || null };
    try { (primary || explore).focus({ preventScroll: true }); } catch (e) {}

    // The fanfare plays when the reward is given; reopening a finished adventure just sparkles.
    var fanfare = complete && reward && !reward.already;
    cue(fanfare ? "adventure.complete" : complete ? "ui.sparkle" : "adventure.start");
    if (fanfare && !calm() && Kido.fx && Kido.fx.confetti) Kido.fx.confetti(50);
    momoSays(actor, line);
    if (!complete) warm(a);
    return true;
  }
  function closeCard(quiet) {
    if (!card) return;
    var c = card; card = null;
    document.removeEventListener("keydown", c.onKey, true);
    if (c.layer.parentNode) c.layer.parentNode.removeChild(c.layer);
    var app = document.getElementById("app"); if (app) app.removeAttribute("inert");
    if (!quiet && c.returnFocus && c.returnFocus.isConnected && c.returnFocus.focus) {
      try { c.returnFocus.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  /** Start a step: its activity, or a flight into its Kido World place. */
  function play(i) {
    var a = ensure(); if (!a) return;
    if (i == null || i < 0 || !a.steps[i] || isDone(a.steps[i])) i = nextIndex(a);
    var s = a.steps[i]; if (!s) return;
    closeCard(true);
    if (Kido.Voice && Kido.Voice.stop) Kido.Voice.stop();   // Momo's card line gives way to the activity
    cue("adventure.travel");
    var ok = false;
    if (s.kind === "world") {
      if (W() && W().isOpen(s.world) && W().enter) { W().enter(s.world); ok = true; }
    } else {
      var before = Kido._lastPlay; Kido._lastPlay = null;
      Kido.screens.play(s.id);
      ok = Kido._lastPlay === s.id;
      if (!ok) Kido._lastPlay = before;
    }
    if (ok) {
      a.current = i; if (!a.startedISO) a.startedISO = iso();
      save(a);
      return;
    }
    // It couldn't start: put another step of the same kind in its place and show the card again.
    var r = replacement(a, i);
    if (r) { r.doneISO = null; a.steps[i] = r; save(a); }
    open();
  }

  /* ---------------- the result screen ---------------- */
  /** Read once by showResult: did this finish complete one of today's steps? */
  function afterFinish(activityId) {
    var j = justDone; justDone = null;
    if (!j || j.activityId !== activityId || Date.now() - j.at > 20000) return null;
    var a = load(); if (!a) return null;
    var info = { adventure: a, index: j.index, completed: !!a.completedISO };
    if (info.completed) info.reward = claim(a);
    else {
      info.next = nextIndex(a);
      info.nextLabel = info.next > -1 ? stepAction(a.steps[info.next]) : "";
    }
    return info;
  }
  function resultBlock(info) {
    var a = info.adventure;
    var box = U.el("section", { class: "adv-result" + (info.completed ? " is-complete" : ""), "aria-label": "Today's Adventure" });
    box.appendChild(U.el("h2", { class: "adv-result__title", text: info.completed ? "Adventure complete!" : "Today's Adventure" }));
    box.appendChild(trail(a, { compact: true, fresh: info.index }));
    if (info.completed && info.reward && info.reward.sticker) box.appendChild(stickerNote(info.reward.sticker));
    // The adventure's moment lands after the activity's own celebration has had its turn.
    setTimeout(function () {
      if (!box.isConnected) return;
      box.classList.add("is-lit");
      // After new badges/stickers the strip can sit below the fold: bring it (and "Next") into view.
      var r = box.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) {
        try { box.scrollIntoView({ block: "center", behavior: calm() ? "auto" : "smooth" }); } catch (e) {}
        setTimeout(function () {   // where smooth scrolling never runs: just jump there
          var q = box.getBoundingClientRect();
          if (box.isConnected && (q.bottom > window.innerHeight || q.top < 0)) box.scrollIntoView({ block: "center" });
        }, 900);
      }
      if (info.completed) { cue("adventure.complete"); if (!calm() && Kido.fx && Kido.fx.confetti) Kido.fx.confetti(60); }
      else cue("adventure.step");
    }, calm() ? 300 : 1500);
    return box;
  }
  function momoLine(info) { return info.completed ? LINES.complete : U.pick(LINES.step); }

  /* ---------------- Kido World hooks ---------------- */
  /** What the map's button shows while an adventure has steps left (null otherwise). */
  function pill() {
    var a = ensure(); if (!a || (a.completedISO && a.rewardClaimed)) return null;
    var n = nextIndex(a), s = a.steps[n];
    var done = a.steps.filter(isDone).length, dots = "";
    a.steps.forEach(function (st) { dots += '<i class="' + (isDone(st) ? "on" : "") + '"></i>'; });
    var pips = '<span class="adv-pips" aria-hidden="true">' + dots + "</span>";
    if (!s) return { label: "Adventure complete!", sub: "Open your reward", thumb: icon("trophy") + pips, done: done, total: a.steps.length };
    return { label: "Today's Adventure", sub: (started(a) ? "Next: " : roleOf(s).label + ": ") + stepName(s),
      thumb: medal(s) + pips, done: done, total: a.steps.length };
  }
  /** "none" · "fresh" (not begun) · "active" (under way) · "complete". */
  function state() {
    var a = ensure(); if (!a) return "none";
    return a.completedISO ? "complete" : started(a) ? "active" : "fresh";
  }
  /* Returning to Kido mid-adventure: offer to continue — once on the first map
     visit of this visit to the app (or of a new play session), never as a block. */
  var offeredFor;
  function offerResume() {
    var sid = sessionId();
    if (offeredFor !== undefined && offeredFor === sid) return false;
    offeredFor = sid;
    return state() === "active";
  }

  Kido.adventure = {
    current: ensure,
    peek: load,
    state: state,
    pill: pill,
    offerResume: offerResume,
    open: open,
    close: function () { closeCard(); },
    isOpen: function () { return !!card; },
    play: play,
    noteFinish: noteFinish,
    afterFinish: afterFinish,
    resultBlock: resultBlock,
    momoLine: momoLine,
    nextIndex: nextIndex,
    log: function () { return (P().get(LOG) || []).slice(); },
    LINES: LINES
  };
})(window);
