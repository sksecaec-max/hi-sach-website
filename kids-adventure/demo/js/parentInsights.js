/* =========================================================================
   parentInsights.js — Kido.insights: READ-ONLY summaries for the Parent Zone.

   Nothing here stores, scores or decides anything. Every number and sentence
   is derived on demand from data Kido already keeps on this device:
     Kido.progress   completed activities, history, stars, badges, stickers,
                     story progress (storyProgress), age, name, streak,
                     Today's Adventure (adventure + the adventures log)
     Kido.Learning   the Change #7 learning profile (skills, discoveries, stories)
     Kido.rewards    badge + sticker definitions
     Kido.catalog / Kido.world / Kido.videos / Kido.storyAdventures   names & places
   If a piece of data doesn't exist, the matching helper returns an empty
   result — it never fills gaps with invented values or timestamps.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  function P() { return Kido.progress; }
  function L() { return Kido.Learning || null; }
  function C() { return Kido.learningConfig || {}; }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  /** Local calendar day of an ISO time ("2026-10-03"). */
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function newestFirst(a, b) { return String(b.at || "").localeCompare(String(a.at || "")); }

  /* ---------------- what an activity is ---------------- */
  var KIND_LABEL = { puzzle: "Puzzle", story: "Story", discovery: "Discovery", game: "Game" };
  var CATEGORY_LABEL = { animals: "Animals", birds: "Animals", nature: "Nature", flowers: "Nature", science: "Science", space: "Space" };

  function adventureOf(id) {
    return (Kido.storyAdventures || []).filter(function (s) { return s.activityId === id || s.id === id; })[0] || null;
  }
  function discoveryOf(id) {
    return (Kido.videos ? Kido.videos.list() : []).filter(function (v) { return v.discovery && v.discovery.activityId === id; })[0] || null;
  }
  function kindOf(id) {
    if (/^puzzle-/.test(id) && Kido.puzzles && Kido.puzzles.get(id)) return "puzzle";
    if (adventureOf(id)) return "story";
    var a = Kido.catalog && Kido.catalog.get(id);
    if (a && a.categoryId === "stories" && /^story-/.test(id)) return "story";
    if (discoveryOf(id)) return "discovery";
    return "game";
  }
  function nameOf(id) { var a = Kido.catalog && Kido.catalog.get(id); return a ? a.name : null; }
  function worldName(wid) { var w = Kido.world && Kido.world.WORLDS[wid]; return w ? w.name : null; }
  function worldOf(id) { return Kido.world && Kido.world.worldOf ? Kido.world.worldOf(id) : null; }

  /* ---------------- child profile ---------------- */
  function childProfile() {
    var p = P(), raw = String(p.get("childName") || "").trim();
    var named = raw && raw.toLowerCase() !== "friend";          // "friend" is the app's placeholder
    var onboarded = p.hasOnboarded();
    var band = onboarded ? Kido.age.current() : null;
    return {
      name: named ? cap(raw) : null,
      onboarded: onboarded,
      ageBand: band,
      ageLabel: band ? Kido.age.labelFor(band) : null,
      stage: band ? Kido.age.cfg(band).label : null,            // Kido's name for the age group's stage
      sinceISO: p.get("createdISO") || null,
      streak: (p.streak() && p.streak().count) || 0
    };
  }

  /* ---------------- events (real, timestamped) ---------------- */
  /** Everything with a real time stamp, newest first:
      done (finished activity), badge, sticker, story-progress (paused adventure). */
  function events() {
    var p = P(), out = [], seen = {};
    p.history().forEach(function (h) {
      if (!h || !h.id || !h.at) return;
      out.push({ type: "done", id: h.id, kind: kindOf(h.id), at: h.at });
      seen[h.id + "@" + h.at] = true;
    });
    // Finishes from before the history existed: only their latest (real) time is known.
    var comp = p.get("completed") || {};
    Object.keys(comp).forEach(function (id) {
      var r = comp[id];
      if (r && r.lastISO && !seen[id + "@" + r.lastISO]) out.push({ type: "done", id: id, kind: kindOf(id), at: r.lastISO, older: true });
    });
    var badges = p.get("badges") || {};
    Object.keys(badges).forEach(function (id) { if (badges[id]) out.push({ type: "badge", id: id, at: badges[id] }); });
    var stickers = p.stickers() || {};
    Object.keys(stickers).forEach(function (id) { if (stickers[id]) out.push({ type: "sticker", id: id, at: stickers[id] }); });
    var sp = p.get("storyProgress") || {};
    Object.keys(sp).forEach(function (sid) {
      var r = sp[sid], st = adventureOf(sid);
      if (r && st && r.status === "in-progress" && r.updatedISO) out.push({ type: "story-progress", id: st.activityId, kind: "story", at: r.updatedISO });
    });
    return out.sort(newestFirst);
  }

  function countsOf(list) {
    var c = { puzzle: 0, story: 0, discovery: 0, game: 0, total: 0 };
    list.forEach(function (e) { c[e.kind] = (c[e.kind] || 0) + 1; c.total++; });
    return c;
  }

  /* ---------------- activity summary ---------------- */
  function activitySummary(now) {
    now = now || Date.now();
    var done = events().filter(function (e) { return e.type === "done"; });
    var today = dayKey(now);
    var start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6);
    var todayList = done.filter(function (e) { return dayKey(e.at) === today; });
    var weekList = done.filter(function (e) { return Date.parse(e.at) >= start.getTime(); });
    var wToday = [];
    todayList.forEach(function (e) { var w = worldOf(e.id); if (w && wToday.indexOf(w) === -1) wToday.push(w); });
    // Places explored (all time): from completed activities and where they live in Kido World.
    var comp = P().get("completed") || {}, per = {};
    Object.keys(comp).forEach(function (id) { var w = worldOf(id); if (w) per[w] = (per[w] || 0) + 1; });
    var places = Object.keys(per).map(function (w) { return { id: w, name: worldName(w), activities: per[w] }; })
      .filter(function (x) { return x.name; }).sort(function (a, b) { return b.activities - a.activities; });
    return {
      any: done.length > 0,
      lastISO: done.length ? done[0].at : null,
      today: countsOf(todayList),
      todayWorlds: wToday.map(worldName).filter(Boolean),
      week: countsOf(weekList),
      places: places
    };
  }

  /* ---------------- recent activity ---------------- */
  /** Finished activities, newest first, each with the badges/stickers earned in
      that same moment (same award call ⇒ the same few milliseconds). */
  function recentActivities(limit) {
    var ev = events(), used = {}, out = [];
    var rewards = ev.filter(function (e) { return e.type === "badge" || e.type === "sticker"; });
    var items = [];
    ev.forEach(function (e) {
      if (e.type !== "done" && e.type !== "story-progress") return;
      var item = { type: e.type, id: e.id, kind: e.kind, kindLabel: KIND_LABEL[e.kind] || "Activity", name: nameOf(e.id) || "An activity",
        at: e.at, status: e.type === "story-progress" ? "In progress" : e.kind === "discovery" ? "Explored" : "Completed",
        world: worldName(worldOf(e.id)), badges: [], stickers: 0, _t: e.type === "done" ? Date.parse(e.at) : null };
      items.push(item);
      out.push(item);
    });
    // Each badge/sticker belongs to the finish it was awarded for: award() records the
    // finish first, then the rewards, so it is the closest finish at or just before it.
    rewards.forEach(function (r, i) {
      var t = Date.parse(r.at), best = null, gap = 3000;
      items.forEach(function (it) {
        if (it._t == null || it._t > t) return;
        if (t - it._t <= gap) { gap = t - it._t; best = it; }
      });
      if (!best) return;
      used[i] = true;
      if (r.type === "badge") { var b = badgeDef(r.id); if (b) best.badges.push(b.name); }
      else best.stickers++;
    });
    items.forEach(function (it) { delete it._t; });
    // A badge that wasn't earned alongside a finish still shows on its own.
    rewards.forEach(function (r, i) {
      if (used[i] || r.type !== "badge") return;
      var b = badgeDef(r.id); if (!b) return;
      out.push({ type: "badge", id: r.id, kind: "reward", kindLabel: "Reward", name: b.name + " badge", at: r.at, status: "Earned", badges: [], stickers: 0 });
    });
    out.sort(newestFirst);
    return limit ? out.slice(0, limit) : out;
  }

  /* ---------------- skills (read from the Change #7 profile) ---------------- */
  function fill(tpl, about) {
    tpl = tpl || "{About}.";
    return tpl.replace("{about}", about).replace("{About}", cap(about));
  }
  function skillSummary() {
    var Lr = L(); if (!Lr) return { rows: [], untried: [], puzzles: 0 };
    var cfg = C(), W = cfg.words || {}, S = cfg.sentences || {}, defs = cfg.skills || {};
    var prof = Lr.profile(), sum = Lr.summary();
    var rows = sum.skills.map(function (r) {
      var tone = r.word === W.strong ? "strong" : r.word === W.practicing ? "practicing" : r.word === W.start ? "start" : "growing";
      var help = tone === "practicing" && Lr.inSupport(r.skill);
      var about = (defs[r.skill] && defs[r.skill].about) || String(r.label).toLowerCase();
      var s = prof.skills[r.skill] || {}, ev = s.evidence || [];
      return { skill: r.skill, label: r.label, state: r.word, tone: tone,
        sentence: fill(S[help ? "practicingHelp" : tone], about),
        lastISO: ev.length ? ev[ev.length - 1].at : null };
    }).sort(newestFirstBy("lastISO"));
    var tried = rows.map(function (r) { return r.skill; });
    var untried = Object.keys(defs).filter(function (k) { return tried.indexOf(k) === -1; })
      .map(function (k) { return { skill: k, label: defs[k].label }; });
    return { rows: rows, untried: untried, puzzles: sum.puzzles };
  }
  function newestFirstBy(key) { return function (a, b) { return String(b[key] || "").localeCompare(String(a[key] || "")); }; }

  /* ---------------- discoveries ---------------- */
  /** "sea_turtle" -> "Sea Turtle" (the creature's own name when Kido has one), "float-sink" -> "Float sink". */
  function topicLabel(t) {
    var c = t && Kido.creatures && Kido.creatures.get(t);
    return c && c.name ? c.name : cap(String(t || "").replace(/[_-]+/g, " "));
  }
  function discoverySummary() {
    var comp = P().get("completed") || {}, Lr = L(), prof = Lr ? Lr.profile() : null;
    var all = (Kido.videos ? Kido.videos.list() : []).filter(function (v) { return v.discovery && Kido.catalog && Kido.catalog.get(v.discovery.activityId); });
    var explored = [], notYet = [];
    all.forEach(function (v) {
      var c = comp[v.discovery.activityId], d = prof && prof.discoveries[v.topic || v.id];
      var item = { activityId: v.discovery.activityId, name: v.discovery.name, title: v.title, topic: topicLabel(v.topic),
        category: CATEGORY_LABEL[v.category] || cap(v.category || "Other"), world: worldName(v.world) };
      if (c || d) {
        item.times = Math.max(c ? c.plays || 0 : 0, d ? d.seen || 0 : 0);
        item.lastISO = [c && c.lastISO, d && d.lastISO].filter(Boolean).sort().pop() || null;
        explored.push(item);
      } else notYet.push(item);
    });
    explored.sort(newestFirstBy("lastISO"));
    var groups = {};
    explored.forEach(function (x) { (groups[x.category] = groups[x.category] || []).push(x); });
    return { explored: explored, groups: groups, notYet: notYet, total: all.length };
  }

  /* ---------------- stories ---------------- */
  function storySummary() {
    var p = P(), comp = p.get("completed") || {}, sp = p.get("storyProgress") || {}, out = [];
    (Kido.storyAdventures || []).forEach(function (s) {
      if (!Kido.catalog || !Kido.catalog.get(s.activityId)) return;
      var r = sp[s.id] || null, c = comp[s.activityId] || null;
      var finished = !!(c || (r && (r.completions > 0 || r.status === "complete")));
      var playing = !!(r && r.status === "in-progress");
      out.push({ activityId: s.activityId, title: s.title, type: "Interactive adventure",
        status: finished ? "complete" : playing ? "in-progress" : "not-started",
        replaying: finished && playing,
        times: Math.max((r && r.completions) || 0, (c && c.plays) || 0),
        lastISO: (r && r.updatedISO) || (c && c.lastISO) || null });
    });
    var acts = (Kido.catalog && Kido.catalog.activities) || {};
    Object.keys(acts).forEach(function (id) {
      var a = acts[id];
      if (a.categoryId !== "stories" || !/^story-/.test(id)) return;
      if (adventureOf(id)) return;     // Change #17A: the picture stories are adventures now (listed above, once)
      var c = comp[id] || null;
      out.push({ activityId: id, title: a.name, type: "Story", status: c ? "complete" : "not-started",
        replaying: false, times: c ? c.plays : 0, lastISO: c ? c.lastISO : null });
    });
    var rank = { "in-progress": 0, complete: 1, "not-started": 2 };
    out.sort(function (a, b) { return rank[a.status] - rank[b.status] || String(b.lastISO || "").localeCompare(String(a.lastISO || "")); });
    return { stories: out, completed: out.filter(function (s) { return s.status === "complete"; }).length,
      inProgress: out.filter(function (s) { return s.status === "in-progress" || s.replaying; }).length };
  }

  /* ---------------- rewards ---------------- */
  function badgeDef(id) { return ((Kido.rewards && Kido.rewards.badges) || []).filter(function (b) { return b.id === id; })[0] || null; }
  function rewardSummary() {
    var p = P(), R = Kido.rewards || { badges: [], stickerCatalog: [] };
    var bm = p.get("badges") || {}, sm = p.stickers() || {};
    var badges = R.badges.filter(function (b) { return bm[b.id]; })
      .map(function (b) { return { id: b.id, name: b.name, icon: b.icon, at: bm[b.id] }; }).sort(newestFirst);
    var stickers = R.stickerCatalog.filter(function (s) { return sm[s.id]; })
      .map(function (s) { return { id: s.id, name: s.name, icon: s.emoji, at: sm[s.id] }; }).sort(newestFirst);
    return { stars: p.stars(), badges: badges, badgesTotal: R.badges.length, stickers: stickers, stickersTotal: R.stickerCatalog.length,
      activities: p.completedCount(), streak: (p.streak() && p.streak().count) || 0 };
  }

  /* ---------------- how Kido is adapting (from stored data only) ---------------- */
  function adaptiveSummary() {
    var Lr = L(); if (!Lr) return null;
    var cfg = C(), defs = cfg.skills || {}, prof = Lr.profile(), base = Lr.baseLevel();
    var who = childProfile().name || "your child";
    var band = Kido.progress.hasOnboarded() ? Kido.age.labelFor(Kido.age.current()) : null;
    var intro = [], skills = [];
    intro.push("Puzzles begin at the level suggested for " + (band || "the chosen age group") + " and change gently as " + who + " plays.");
    var tried = Object.keys(prof.skills).filter(function (k) {
      return prof.skills[k].plays > 0 && defs[k] && (defs[k].puzzleTypes || []).length;
    });
    if (!tried.length) {
      intro.push("Little Explorers starts adjusting after a few puzzles. A single mistake never changes anything; only several similar results in a row do.");
      return { intro: intro, skills: skills, stories: [] };
    }
    var mix = cfg.contentMix || {};
    function oneIn(x) { return x > 0 ? "about 1 in " + Math.max(2, Math.round(1 / x)) : null; }
    var harder = oneIn(mix.challenge), easier = oneIn(mix.reinforcement);
    intro.push("Most puzzles are at " + who + "'s current level" + (harder ? "; " + harder + " is a little harder" : "") +
      (easier ? " and " + easier + " a little easier, for confident wins" : "") + ". Puzzle types take turns, so the same puzzle doesn't repeat back-to-back.");
    tried.forEach(function (k) {
      var s = prof.skills[k], lvl = Lr.levelFor(k), about = cap(defs[k].about || defs[k].label), text;
      if (Lr.inSupport(k)) text = about + " are a little easier for now, with hints offered sooner.";
      else if (s.provisional) text = about + " recently became a little more challenging. Little Explorers keeps checking that it still feels right.";
      else if (lvl > base) text = about + " now include some more challenging versions, after consistent success.";
      else if (lvl < base) text = about + " are at a gentler level for now.";
      else text = about + " are at the starting level for this age group.";
      skills.push({ skill: k, label: defs[k].label, text: text });
    });
    var stories = [];
    (Kido.storyAdventures || []).forEach(function (st) {
      if (!prof.stories[st.id] || !Lr.storyStyle) return;
      var style = Lr.storyStyle(st);
      if (style.guided) stories.push("In “" + st.title + "”, Little Explorers currently shows extra pointing hints and shorter lines.");
    });
    return { intro: intro, skills: skills, stories: stories };
  }

  /* ---------------- Today's Adventure (Change #12) ---------------- */
  /** Finished adventures today / in the last 7 days, and one under way (if any steps are done). */
  function adventureSummary(now) {
    now = now || Date.now();
    var log = (P().get("adventures") || []).filter(function (e) { return e && e.completedISO; });
    var cur = P().get("adventure"), current = null;
    var start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 6);
    if (cur && cur.v === 1 && Array.isArray(cur.steps) && !cur.completedISO) {
      var n = cur.steps.filter(function (s) { return s.doneISO; }).length;
      if (n) current = { done: n, total: cur.steps.length };
    }
    return {
      today: log.filter(function (e) { return dayKey(e.completedISO) === dayKey(now); }).length,
      week: log.filter(function (e) { return Date.parse(e.completedISO) >= start.getTime(); }).length,
      total: log.length,
      current: current
    };
  }

  Kido.insights = {
    childProfile: childProfile,
    events: events,
    activitySummary: activitySummary,
    recentActivities: recentActivities,
    skillSummary: skillSummary,
    discoverySummary: discoverySummary,
    storySummary: storySummary,
    rewardSummary: rewardSummary,
    adaptiveSummary: adaptiveSummary,
    adventureSummary: adventureSummary,
    kindOf: kindOf,
    dayKey: dayKey,
    KIND_LABEL: KIND_LABEL
  };
})(window);
