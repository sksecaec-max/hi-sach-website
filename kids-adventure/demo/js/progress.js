/* =========================================================================
   progress.js — Persistent state (localStorage)
   Single source of truth for age, stars, badges, per-activity completion and
   settings. Feature modules keep their own keys here too (learning,
   storyProgress, adventure…). Structured as one JSON blob so a backend
   (Firebase/Supabase) can later sync it wholesale.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var KEY = "kido.state.v1";
  var HISTORY_MAX = 300;          // ≈ several weeks of play, a few KB

  var DEFAULTS = {
    childName: "friend",
    avatar: "🦊",
    age: null,                 // set on first launch
    stars: 0,
    badges: {},                // badgeId -> earnedISO
    stickers: {},              // stickerId -> earnedISO (collectible reward loop)
    completed: {},             // activityId -> { plays, bestStars, lastISO }
    history: [],               // newest first: { id, at, stars } per finished activity (bounded; Parent Zone reads it)
    catStars: {},              // categoryId -> stars earned in that category
    streak: { count: 0, lastDate: null },
    analytics: { scenes: {}, totalPlays: 0, totalCorrect: 0, totalQuestions: 0, byHour: {} },
    settings: { sound: true, music: true, reduceMotion: false, bigText: false, highContrast: false },
    createdISO: null
  };

  var state = load();

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULTS);
      var parsed = JSON.parse(raw);
      return deepMerge(clone(DEFAULTS), parsed);
    } catch (e) {
      return clone(DEFAULTS);
    }
  }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function deepMerge(base, over) {
    Object.keys(over || {}).forEach(function (k) {
      if (over[k] && typeof over[k] === "object" && !Array.isArray(over[k]) && typeof base[k] === "object") {
        deepMerge(base[k], over[k]);
      } else { base[k] = over[k]; }
    });
    return base;
  }

  Kido.progress = {
    all: function () { return state; },
    get: function (k) { return state[k]; },
    set: function (k, v) { state[k] = v; save(); },

    settings: function () { return state.settings; },
    setSetting: function (k, v) { state.settings[k] = v; save(); },

    hasOnboarded: function () { return !!state.age; },

    /* ---- Stars ---- */
    stars: function () { return state.stars; },
    addStars: function (n, categoryId) {
      state.stars += n;
      if (categoryId) state.catStars[categoryId] = (state.catStars[categoryId] || 0) + n;
      save();
      return state.stars;
    },

    /* ---- Activity completion ---- */
    completeActivity: function (activityId, stars) {
      var rec = state.completed[activityId] || { plays: 0, bestStars: 0, lastISO: null };
      rec.plays += 1;
      rec.bestStars = Math.max(rec.bestStars, stars || 0);
      rec.lastISO = new Date().toISOString();
      state.completed[activityId] = rec;
      // A real, timestamped record of every finish (on this device only) — powers
      // "Today" and "Recent activity" for parents without inventing anything.
      if (!Array.isArray(state.history)) state.history = [];
      state.history.unshift({ id: activityId, at: rec.lastISO, stars: stars || 0 });
      if (state.history.length > HISTORY_MAX) state.history.length = HISTORY_MAX;
      touchStreak();
      save();
      return rec;
    },
    /** Finished activities, newest first (copy). */
    history: function () { return (state.history || []).slice(); },
    isCompleted: function (activityId) { return !!state.completed[activityId]; },
    completedCount: function () { return Object.keys(state.completed).length; },
    categoryStars: function (categoryId) { return state.catStars[categoryId] || 0; },

    /* ---- Badges ---- */
    earnBadge: function (id) {
      if (state.badges[id]) return false;
      state.badges[id] = new Date().toISOString();
      save();
      return true;
    },
    hasBadge: function (id) { return !!state.badges[id]; },
    badgeCount: function () { return Object.keys(state.badges).length; },

    /* ---- Stickers (collectible reward loop) ---- */
    earnSticker: function (id) {
      if (state.stickers[id]) return false;
      state.stickers[id] = new Date().toISOString();
      save();
      return true;
    },
    hasSticker: function (id) { return !!state.stickers[id]; },
    stickerCount: function () { return Object.keys(state.stickers).length; },
    stickers: function () { return state.stickers; },

    streak: function () { return state.streak; },

    /* ---- Analytics (scene learning insights; does NOT grant stars) ---- */
    analytics: function () { return state.analytics; },
    trackScene: function (activityId, categoryId, correct, total) {
      var a = state.analytics;
      var rec = a.scenes[activityId] || { plays: 0, correct: 0, total: 0, lastISO: null };
      rec.plays += 1; rec.correct += (correct || 0); rec.total += (total || 0);
      rec.lastISO = new Date().toISOString();
      a.scenes[activityId] = rec;
      a.totalPlays += 1; a.totalCorrect += (correct || 0); a.totalQuestions += (total || 0);
      var h = new Date().getHours(); a.byHour[h] = (a.byHour[h] || 0) + 1;
      save();
      return rec;
    },

    /* ---- Reset (parent action) ----
       keepAge: keep the child's profile (age group, name, avatar).
       keepSettings: keep sound, volume and display/accessibility settings. */
    reset: function (keepAge, keepSettings) {
      var age = state.age, name = state.childName, avatar = state.avatar, settings = state.settings;
      state = clone(DEFAULTS);
      if (keepAge) { state.age = age; state.childName = name; state.avatar = avatar; }
      if (keepSettings && settings) state.settings = settings;
      state.createdISO = new Date().toISOString();
      save();
    }
  };

  function touchStreak() {
    var today = new Date().toISOString().slice(0, 10);
    var s = state.streak;
    if (s.lastDate === today) return;
    var yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    s.count = (s.lastDate === yest) ? s.count + 1 : 1;
    s.lastDate = today;
  }

  if (!state.createdISO) { state.createdISO = new Date().toISOString(); save(); }
})(window);
