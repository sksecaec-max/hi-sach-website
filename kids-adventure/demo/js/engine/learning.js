/* =========================================================================
   learning.js — Kido.Learning: the quiet adaptive layer.

   Kido learns from play, never from tests:
     • a small LEARNING PROFILE (skills, stories, discoveries, preferences,
       the current session) stored inside Kido.progress ("learning" key) —
       on this device only, never sent anywhere;
     • per-skill LEVELS that start from the child's age and move one step at a
       time, only after several consistent observations (never one mistake);
     • SELECTION helpers the existing engines ask: which puzzle next, at what
       level, which discovery / story, and a varied "Today's Adventure".

   Event-driven: it only runs when something finishes (puzzle, story,
   discovery, mini-game) or starts. All numbers live in js/data/learningConfig.js.

   Used by: PuzzleEngine (level + hint timing), Kido.puzzles.next/after
   (Thinking Stone + result "Next"), StoryEngine (text length + guidance),
   the Quick Discovery activity, Kido.engine.finish, the world's daily
   journey, and the parent area (summary + reset).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var KEY = "learning";
  var rng = Math.random;                         // swappable for tests (Kido.Learning._setRng)

  function C() { return Kido.learningConfig || {}; }
  function P() { return Kido.progress; }
  function now() { return Date.now(); }
  function iso() { return new Date().toISOString(); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function pickOne(a) { return a[(rng() * a.length) | 0]; }

  /* ---------------- profile (one blob inside Kido.progress) ---------------- */
  function blank() {
    return {
      v: 1, createdISO: iso(),
      skills: {},                     // skillId → { level, evidence[], plays, provisional, changes{} }
      recent: { puzzles: [], types: [], discoveries: [], stories: [] },
      stories: {},                    // storyId → { completions, lastISO, tapMs, guided }
      discoveries: {},                // topic → { seen, lastISO, activityId }
      preferences: { worlds: {}, kinds: {} },
      sessions: 0, session: null, lastSession: null
    };
  }
  // Always read through Kido.progress (no private copy), so a parent's full
  // progress reset can never be overwritten by stale data.
  function profile() {
    var p = P() && P().get(KEY);
    if (!p || p.v !== 1) { p = blank(); if (P()) P().set(KEY, p); }
    return p;
  }
  function save() { if (P()) P().set(KEY, profile()); }

  /* ---------------- sessions ---------------- */
  function session() {
    var p = profile(), s = p.session, gap = (C().session && C().session.gapMinutes || 30) * 60000;
    var today = iso().slice(0, 10);
    if (!s || now() - Date.parse(s.lastISO) > gap || s.startISO.slice(0, 10) !== today) {
      if (s) p.lastSession = { id: s.id, startISO: s.startISO, lastISO: s.lastISO, items: s.items.length };
      p.sessions = (p.sessions || 0) + 1;
      s = p.session = { id: p.sessions, startISO: iso(), lastISO: iso(), items: [] };
    }
    return s;
  }
  function addItem(item) {
    var s = session();
    item.at = iso();
    s.items.push(item);
    var keep = (C().session && C().session.itemsKept) || 40;
    if (s.items.length > keep) s.items.splice(0, s.items.length - keep);
    s.lastISO = item.at;
  }
  function pushRecent(list, v) {
    var keep = (C().repetition && C().repetition.recentKept) || 12;
    var i = list.indexOf(v); if (i > -1) list.splice(i, 1);
    list.unshift(v);
    if (list.length > keep) list.length = keep;
  }

  /* ---------------- skills + levels ---------------- */
  function skillOfType(type) {
    var sk = C().skills || {};
    for (var id in sk) if ((sk[id].puzzleTypes || []).indexOf(type) !== -1) return id;
    return null;
  }
  function skillOfActivity(activityId) {
    var sk = C().skills || {};
    for (var id in sk) if ((sk[id].activities || []).indexOf(activityId) !== -1) return id;
    return null;
  }
  function skillState(id) {
    var p = profile();
    return p.skills[id] || (p.skills[id] = { level: null, evidence: [], plays: 0, provisional: null, changes: {} });
  }
  /** The age's starting level (the existing PuzzleEngine tier for this age band). */
  function baseLevel() {
    return Kido.PuzzleEngine && Kido.PuzzleEngine.tier ? Kido.PuzzleEngine.tier() : 3;
  }
  function bounds() {
    var b = baseLevel(), L = C().levels || { min: 1, max: 5 }, ab = C().ability || { aboveAge: 2, belowAge: 2 };
    return { min: Math.max(L.min, b - ab.belowAge), max: Math.min(L.max, b + ab.aboveAge), base: b };
  }
  /** Where this skill sits now: the age start point, refined by play (within bounds). */
  function levelFor(skill) {
    var s = skill && profile().skills[skill], b = bounds();
    var lvl = s && s.level != null ? s.level : b.base;
    return clamp(lvl, b.min, b.max);
  }
  function recentPuzzleEvidence(s) { return s.evidence.filter(function (e) { return e.src === "puzzle" && !e.used; }); }
  /** Several recent hard ones at (or below) the level → support mode. */
  function inSupport(skill) {
    var s = profile().skills[skill]; if (!s) return false;
    var d = C().difficulty, at = recentPuzzleEvidence(s).filter(function (e) { return e.rel <= 0; }).slice(-3);
    return at.filter(function (e) { return e.o === "struggle"; }).length >= (d.supportAfterStruggles || 2);
  }

  /** Read one finished puzzle. One mistake is "ok", never "struggle". */
  function outcomeOf(st) {
    var o = C().outcome;
    if (!st || st.skipped || st.solved === false) return "struggle";
    if (st.mistakes >= o.struggleMinMistakes || st.hints >= o.struggleMinHints) return "struggle";
    if (st.mistakes > 0 && st.ms > o.slowMs) return "struggle";
    if (st.mistakes <= o.successMaxMistakes && st.hints <= o.successMaxHints && st.ms <= o.successMaxMs) return "success";
    return "ok";
  }

  /** Move a skill's level by at most one step — only on consistent evidence. */
  function adjust(skill) {
    var s = skillState(skill), d = C().difficulty, sid = session().id, b = bounds();
    var lvl = levelFor(skill), ev = recentPuzzleEvidence(s);
    var last = ev[ev.length - 1];
    function change(dir, why, exempt) {
      var to = clamp(lvl + dir * Math.min(1, d.maxStepChange || 1), b.min, b.max);
      if (to === lvl) return null;
      if (!exempt && (s.changes[sid] || 0) >= (d.maxChangesPerSession || 1)) return null;
      if (!exempt) s.changes[sid] = (s.changes[sid] || 0) + 1;
      s.level = to;
      s.evidence.forEach(function (e) { e.used = true; });   // the next change needs fresh evidence
      s.provisional = dir > 0 ? { sid: sid, from: lvl } : null;
      s.lastChange = { dir: dir, why: why, at: iso(), sid: sid };
      return { skill: skill, from: lvl, to: to, why: why };
    }
    // A raise is provisional: two hard tries at the new level take it straight back.
    if (s.provisional) {
      var since = ev.filter(function (e) { return e.rel >= 0; });
      if (since.filter(function (e) { return e.o === "struggle"; }).length >= (d.revertProvisionalAfterStruggles || 2)) return change(-1, "settle", true);
      if (last && last.o === "success" && last.rel >= 0 && last.sid !== s.provisional.sid) s.provisional = null;   // held in a later session
    }
    var up = ev.filter(function (e) { return e.rel >= 0; }).slice(-(d.increaseAfterSuccesses || 3));
    if (up.length >= (d.increaseAfterSuccesses || 3) && up.every(function (e) { return e.o === "success"; })) return change(1, "consistent-success");
    var down = ev.filter(function (e) { return e.rel <= 0; }).slice(-(d.decreaseAfterStruggles || 3));
    if (down.length >= (d.decreaseAfterStruggles || 3) && down.every(function (e) { return e.o === "struggle"; })) return change(-1, "consistent-struggle");
    return null;
  }

  function addEvidence(skill, e) {
    var s = skillState(skill), keep = C().difficulty.evidenceKept || 8;
    e.sid = session().id; e.at = iso();
    s.evidence.push(e);
    if (s.evidence.length > keep) s.evidence.splice(0, s.evidence.length - keep);
    if (e.src === "puzzle") s.plays += 1; else s.games = (s.games || 0) + 1;
  }

  /* ---------------- puzzle planning (asked by PuzzleEngine at start) ---------------- */
  /** Level for this play of a puzzle: the skill's level, sometimes one up (challenge)
      or one down (reinforcement) by the configured mix — never a jump. */
  function planPuzzle(puzzle) {
    var skill = skillOfType(puzzle.type), lvl = levelFor(skill), b = bounds();
    var s = skill && profile().skills[skill];
    var ev = s ? recentPuzzleEvidence(s) : [], last = ev[ev.length - 1];
    var support = skill ? inSupport(skill) : false;
    var mix = C().contentMix || { current: 0.6, challenge: 0.25, reinforcement: 0.15 };
    var band = "current";
    var justChanged = s && s.lastChange && !ev.length;                         // first play since a step up or down
    if (support) band = "reinforcement";
    else if (justChanged) band = "current";                                   // meet the new level itself
    else if (s && s.plays > 0) {
      var r = rng(), cw = (last && last.o === "struggle") ? 0 : mix.challenge;    // no stretch right after a hard one
      band = r < mix.reinforcement ? "reinforcement" : r < mix.reinforcement + cw ? "challenge" : "current";
    }
    var delta = band === "challenge" ? 1 : band === "reinforcement" ? -1 : 0;
    var L = C().levels || { min: 1, max: 5 };
    var level = clamp(lvl + delta, L.min, Math.min(L.max, b.max + 1));
    if (level === lvl) band = "current";
    var top = s && s.maxLevel;
    var isNew = top != null && level > top;             // harder than anything before → "Here's a new challenge!"
    return {
      skill: skill, skillLevel: lvl, level: Math.max(1, Math.min(5, level + (puzzle.difficulty || 0))), band: band,
      support: support, line: isNew ? pickOne(C().lines.challenge) : null
    };
  }

  /* ---------------- recording (event-based) ---------------- */
  function recordPuzzle(puzzle, levelPlayed, plan, st) {
    plan = plan || {};
    var skill = plan.skill || skillOfType(puzzle.type), p = profile();
    var o = outcomeOf(st), result = { outcome: o, change: null };
    if (skill) {
      var s = skillState(skill);
      addEvidence(skill, { src: "puzzle", o: o, lvl: levelPlayed, rel: levelPlayed - (plan.skillLevel != null ? plan.skillLevel : levelFor(skill)),
        m: st.mistakes || 0, h: st.hints || 0, ms: st.ms || 0, id: puzzle.id });
      s.lastLevel = levelPlayed;
      s.maxLevel = Math.max(s.maxLevel || 0, levelPlayed);
      result.change = adjust(skill);
      result.support = inSupport(skill);
    }
    if (!puzzle.storyOnly) { pushRecent(p.recent.puzzles, puzzle.id); pushRecent(p.recent.types, puzzle.type); }
    memo = null;
    addItem({ kind: "puzzle", id: puzzle.id, skill: skill, o: o, lvl: levelPlayed, band: plan.band || null });
    save();
    return result;
  }

  /** Mini-games that finish with correct/total (memory, sorting, shadow match). */
  function recordActivity(activityId, correct, total) {
    var skill = skillOfActivity(activityId);
    if (!skill || !total) return null;
    var a = C().activitySignal, acc = correct / total;
    var o = acc >= a.successAt ? "success" : acc < a.struggleBelow ? "struggle" : "ok";
    addEvidence(skill, { src: "game", o: o, rel: 0, id: activityId });
    save();
    return o;
  }

  function recordStory(story, info) {
    info = info || {};
    var p = profile(), r = p.stories[story.id] || { completions: 0 };
    var waits = (info.tapWaits || []).slice().sort(function (a, b) { return a - b; });
    if (info.completed) r.completions += 1;
    r.lastISO = iso();
    r.tapMs = waits.length ? waits[(waits.length / 2) | 0] : r.tapMs || null;    // median time to find what to tap
    r.guided = !!info.guided;
    p.stories[story.id] = r;
    pushRecent(p.recent.stories, story.id);
    addItem({ kind: "story", id: story.id, completed: !!info.completed });
    save();
  }

  function recordDiscovery(entry, info) {
    info = info || {};
    var p = profile(), topic = entry.topic || entry.id, r = p.discoveries[topic] || { seen: 0 };
    r.seen += 1; r.lastISO = iso(); r.activityId = entry.discovery && entry.discovery.activityId;
    r.firstTry = (info.tries || 0) === 0;
    p.discoveries[topic] = r;
    pushRecent(p.recent.discoveries, topic);
    addItem({ kind: "discovery", id: entry.id, topic: topic, mode: info.mode || null });
    save();
  }

  /** Every activity start (session memory + a light preference for worlds/kinds). */
  function noteStart(activityId, spec) {
    var p = profile(), w = Kido.world && Kido.world.worldOf ? Kido.world.worldOf(activityId) : null;
    var kind = spec && (spec.puzzleId ? "puzzle" : spec.storyId ? "story" : spec.videoId ? "discovery" : "game");
    if (w) p.preferences.worlds[w] = (p.preferences.worlds[w] || 0) + 1;
    if (kind) p.preferences.kinds[kind] = (p.preferences.kinds[kind] || 0) + 1;
    addItem({ kind: "start", id: activityId, as: kind });
    save();
  }
  /** Kido.engine.finish → the reward moment (and mini-game observations). */
  function noteResult(spec, result) {
    if (!spec) return;
    if (spec.activityId && !spec.puzzleId && !spec.storyId && !spec.videoId) recordActivity(spec.activityId, result.correct, result.total);
    addItem({ kind: "reward", id: spec.activityId, stars: result.stars || 0 });
    save();
  }

  /* ---------------- selection ---------------- */
  function puzzlesPool() { return Kido.puzzles ? Kido.puzzles.list() : []; }
  /** Which puzzle next: rotate puzzles and types, prefer the not-yet-tried and the
      least recently played; finished puzzles come back later for reinforcement. */
  var memo = null;   // the plain "what's next?" answer stays put until something is played
  function pickPuzzle(opts) {
    var plain = !opts;
    if (plain && memo) return memo;
    opts = opts || {};
    var p = profile(), rep = C().repetition, pool = puzzlesPool();
    var exclude = [].concat(opts.exclude || []);
    if (!pool.length) return null;
    var recentIds = p.recent.puzzles.slice(0, rep.avoidLastPuzzles), recentTypes = p.recent.types.slice(0, rep.avoidLastTypes);
    var cands = pool.filter(function (x) { return exclude.indexOf(x.id) === -1 && exclude.indexOf(x.activityId) === -1; });
    var fresh = cands.filter(function (x) { return recentIds.indexOf(x.id) === -1 && recentTypes.indexOf(x.type) === -1; });
    if (!fresh.length) fresh = cands.filter(function (x) { return recentIds.indexOf(x.id) === -1; });
    if (!fresh.length) fresh = cands.length ? cands : pool;
    var thisSession = session().items.filter(function (i) { return i.kind === "puzzle"; }).map(function (i) { return i.id; });
    function lastAt(x) { var i = p.recent.puzzles.indexOf(x.id); return i === -1 ? 1e9 : i; }   // bigger = longer ago
    function score(x) {
      var sk = skillOfType(x.type), st = sk && p.skills[sk];
      var sc = 0;
      if (!st || !st.plays) sc += 4;                                   // something new to try
      if (thisSession.indexOf(x.id) === -1) sc += 2;                   // not yet today
      if (opts.want === "familiar" && st && st.plays) sc += 6;
      if (opts.want === "challenge" && (!st || !st.plays || readyToStretch(sk))) sc += 6;
      return sc + Math.min(lastAt(x), 12) / 12 + rng() * 0.5;
    }
    fresh.sort(function (a, b) { return score(b) - score(a); });
    if (plain) memo = fresh[0].activityId;
    return fresh[0].activityId;
  }
  function readyToStretch(skill) {
    var s = profile().skills[skill]; if (!s) return false;
    var ev = recentPuzzleEvidence(s), last = ev[ev.length - 1];
    return !!last && last.o === "success" && levelFor(skill) < bounds().max;
  }

  function discoveryPool() {
    return (Kido.videos ? Kido.videos.list() : []).filter(function (v) { return v.discovery && Kido.catalog && Kido.catalog.get(v.discovery.activityId); });
  }
  /** Prefer a topic the child hasn't explored lately. opts.ok(activityId) narrows the pool (e.g. to the child's age). */
  function pickDiscovery(opts) {
    opts = opts || {};
    var p = profile(), pool = discoveryPool().filter(function (v) { return !opts.ok || opts.ok(v.discovery.activityId); });
    if (!pool.length) return null;
    var avoid = p.recent.discoveries.slice(0, C().repetition.avoidLastDiscoveries);
    var cands = pool.filter(function (v) { return avoid.indexOf(v.topic || v.id) === -1; });
    if (!cands.length) cands = pool;                                    // all seen recently: the longest-ago one
    cands.sort(function (a, b) {
      var ra = p.discoveries[a.topic || a.id], rb = p.discoveries[b.topic || b.id];
      return String(ra ? ra.lastISO : "").localeCompare(String(rb ? rb.lastISO : ""));
    });
    return cands[0].discovery.activityId;
  }
  function pickStory() {
    var p = profile(), pool = (Kido.storyAdventures || []).filter(function (s) { return Kido.catalog && Kido.catalog.get(s.activityId); });
    if (!pool.length) return null;
    pool.sort(function (a, b) {
      var ra = p.stories[a.id], rb = p.stories[b.id];
      return ((ra && ra.completions) || 0) - ((rb && rb.completions) || 0) || String(ra ? ra.lastISO : "").localeCompare(String(rb ? rb.lastISO : ""));
    });
    return pool[0].activityId;
  }
  /** Today's Adventure core: one familiar puzzle, one new challenge, one discovery or story. */
  function today() {
    var p = profile(), out = [];
    var anyPlayed = Object.keys(p.skills).some(function (k) { return p.skills[k].plays > 0; });
    var fam = anyPlayed ? pickPuzzle({ want: "familiar" }) : null;
    if (fam) out.push({ role: "familiar", id: fam });
    var ch = pickPuzzle({ want: "challenge", exclude: out.map(function (x) { return x.id; }) });
    if (ch && out.every(function (x) { return x.id !== ch; })) out.push({ role: "challenge", id: ch });
    var d = pickDiscovery(), seen = d && p.discoveries && Object.keys(p.discoveries).some(function (k) { return p.discoveries[k].activityId === d; });
    var st = pickStory(), storyDone = st && (Kido.storyAdventures || []).some(function (s) { return s.activityId === st && p.stories[s.id] && p.stories[s.id].completions; });
    var third = (d && !seen) ? d : (st && !storyDone) ? st : (d || st);
    if (third) out.push({ role: third === d ? "discovery" : "story", id: third });
    return out;
  }

  /* ---------------- stories (light touch) ---------------- */
  /** short: shorter lines · guided: extra visual pointing · details: show choice detail text */
  function storyStyle(story) {
    var cfg = Kido.age.cfg(), pre = Kido.age.isPreReader();
    var p = profile(), sc = C().story || {};
    var supportSkills = Object.keys(p.skills).filter(function (k) { return inSupport(k); }).length;
    var rec = story && p.stories[story.id];
    var guided = (rec && rec.tapMs != null && rec.tapMs > sc.slowTapMs) || supportSkills >= (sc.guideWhenSupportSkills || 2);
    var short = pre || guided;
    return { short: short, guided: guided, details: !short && (cfg.reading === "full" || cfg.reading === "some") };
  }

  /* ---------------- parent summary (descriptive words, no grades) ---------------- */
  function summary() {
    var p = profile(), W = C().words, sk = C().skills, rows = [];
    Object.keys(sk).forEach(function (id) {
      var s = p.skills[id]; if (!s || !(s.plays || s.games)) return;
      var ev = s.evidence.slice(-4), succ = ev.filter(function (e) { return e.o === "success"; }).length;
      var word = (s.plays || 0) + (s.games || 0) < 2 ? W.start
        : inSupport(id) || ev.filter(function (e) { return e.o === "struggle"; }).length >= 2 ? W.practicing
        : (s.level != null && s.level > bounds().base) || succ >= 3 ? W.strong : W.growing;
      rows.push({ skill: id, label: sk[id].label, word: word });
    });
    var stories = Object.keys(p.stories).reduce(function (n, k) { return n + (p.stories[k].completions || 0); }, 0);
    var discoveries = Object.keys(p.discoveries).length;
    var solved = Object.keys(p.skills).reduce(function (n, k) { return n + (p.skills[k].plays || 0); }, 0);
    return { skills: rows, stories: stories, discoveries: discoveries, puzzles: solved };
  }

  function reset() {
    memo = null;
    if (P()) { P().set(KEY, blank()); P().set("puzzleStats", {}); }
  }

  Kido.Learning = {
    profile: profile,
    session: session,
    skillOfType: skillOfType,
    levelFor: levelFor,
    baseLevel: baseLevel,
    inSupport: inSupport,
    outcomeOf: outcomeOf,
    planPuzzle: planPuzzle,
    recordPuzzle: recordPuzzle,
    recordActivity: recordActivity,
    recordStory: recordStory,
    recordDiscovery: recordDiscovery,
    noteStart: noteStart,
    noteResult: noteResult,
    pickPuzzle: pickPuzzle,
    pickDiscovery: pickDiscovery,
    pickStory: pickStory,
    today: today,
    storyStyle: storyStyle,
    summary: summary,
    reset: reset,
    _setRng: function (fn) { rng = typeof fn === "function" ? fn : Math.random; }
  };
})(window);
