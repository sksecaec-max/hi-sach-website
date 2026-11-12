/* =========================================================================
   parent.js — Parent gate + the Kido Parent Zone

   Entry: the top-bar parent button → a grown-up gate (a two-digit × one-digit
   question, a fresh one after each wrong answer, closed after three) → the Parent Zone.

   The Parent Zone only READS what Kido already stores (via Kido.insights) and
   offers the settings Kido actually supports. Sections:
     Overview · Child profile · Recent activity · Learning progress ·
     Discoveries · Stories · Rewards & collections · How Kido adapts · Settings
   Phones: an overview page that links to each section (with a Back button).
   Wide screens: a section rail beside the content.

   While it is open, the child's screen behind it is inert, the child's voice
   lines are held, and music/ambience dip. Closing returns to the same place
   (or to Kido World if the age group, name or progress changed).
   Everything stays on this device.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var P = Kido.progress;
  // the age-change confirmation for every band, recorded by scripts/voice/harvest.js
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    return Kido.age.BANDS.map(function (b) { return "Age group set to " + Kido.age.labelFor(b) + ". Progress is kept."; });
  });
  function I() { return Kido.insights; }
  function layer() { return document.getElementById("modal"); }
  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ---------------- line icons (grown-up chrome) ---------------- */
  var ICON = {
    home: '<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.8V20h4.5v-5.5h3V20H18V9.8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c.6-4 3.8-6 7.5-6s6.9 2 7.5 6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    sprout: '<path d="M12 20v-8"/><path d="M12 12c-.4-3.6-2.8-5.6-7-5.6.3 3.7 2.8 5.6 7 5.6z"/><path d="M12 10.2c.4-3 2.4-4.8 6-4.8-.3 3.1-2.3 4.8-6 4.8z"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.4 8.6l-1.9 4.9-4.9 1.9 1.9-4.9z"/>',
    book: '<path d="M4 5h5.5c1.4 0 2.5 1.1 2.5 2.5V20c0-1.1-.9-2-2-2H4z"/><path d="M20 5h-5.5C13.1 5 12 6.1 12 7.5V20c0-1.1.9-2 2-2h6z"/>',
    award: '<circle cx="12" cy="9" r="5"/><path d="M9.2 13.4L8 21l4-2.2 4 2.2-1.2-7.6"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.4 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/>',
    adapt: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/><circle cx="12" cy="12" r="6.5"/>',
    chevron: '<path d="M9.5 6l6 6-6 6"/>',
    back: '<path d="M14.5 6l-6 6 6 6"/>',
    close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    puzzle: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    game: '<path d="M12 3.8l2.4 5 5.4.6-4 3.7 1.1 5.4L12 15.8l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>'
  };
  function ico(name) {
    return '<svg class="pk-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICON[name] || "") + "</svg>";
  }
  var KIND_ICON = { puzzle: "puzzle", story: "book", discovery: "compass", game: "game", reward: "award" };

  /* ---------------- sections ---------------- */
  var SECTIONS = [
    { id: "home", title: "Overview", icon: "home" },
    { id: "profile", title: "Child profile", icon: "user" },
    { id: "activity", title: "Recent activity", icon: "clock" },
    { id: "learning", title: "Learning progress", icon: "sprout" },
    { id: "discoveries", title: "Discoveries", icon: "compass" },
    { id: "stories", title: "Stories", icon: "book" },
    { id: "rewards", title: "Rewards & collections", icon: "award" },
    { id: "adapt", title: "How Little Explorers adapts", icon: "adapt" },
    { id: "settings", title: "Settings", icon: "gear" },
    { id: "credits", title: "Credits & privacy", icon: "heart" }
  ];
  var SECTION = {};
  SECTIONS.forEach(function (s) { SECTION[s.id] = s; });

  /* ---------------- the child's screen waits while a grown-up is here ---------------- */
  var BACKGROUND = ["topbar", "screen", "tabbar", "mascot", "toast"];
  function holdChildScreen(on) {
    BACKGROUND.forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert");
    });
    if (Kido.AudioManager) {
      if (on) Kido.AudioManager.duck("parent", { music: 0.25, ambience: 0.25 });
      else Kido.AudioManager.unduck("parent");
    }
    if (on && Kido.Voice && Kido.Voice.stop) Kido.Voice.stop();
  }

  var zone = null;          // the open Parent Zone
  var returnFocus = null;   // where focus goes back to on close

  function onKey(e) {
    if (e.key !== "Escape" && e.key !== "Esc") return;
    e.preventDefault();
    if (zone && zone.dialog) { zone.dialog.close(); return; }
    if (!parent.back()) parent.close();
  }

  /* A text field saves on "change", which only fires on blur or Enter. Escape and
     Back tear the view down while the field still has focus, and Safari/Firefox
     fire no blur for a removed element, so blur it first to commit what was typed. */
  function commitField() {
    var a = document.activeElement;
    if (zone && a && a.tagName === "INPUT" && zone.root.contains(a)) a.blur();
  }

  var parent = Kido.parent = {
    isOpen: function () { var l = layer(); return !!l && !l.hidden; },

    close: function () {
      var l = layer(); if (!l || l.hidden) return;
      commitField();
      var changed = !!(zone && zone.dirty);
      if (zone && zone.statusT) clearTimeout(zone.statusT);
      zone = null;
      l.hidden = true; l.innerHTML = ""; l.className = "modal-layer";
      document.removeEventListener("keydown", onKey, true);
      holdChildScreen(false);
      if (changed) Kido.nav.setTab("home");           // age / name / progress changed: repaint what the child sees
      var f = returnFocus; returnFocus = null;
      if (f && f.isConnected && f.focus) { try { f.focus({ preventScroll: true }); } catch (e) {} }
    },

    /** Show a node in the overlay layer. opts.zone: full Parent Zone layout. */
    open: function (node, opts) {
      opts = opts || {};
      var l = layer();
      if (!l.__backdrop) {      // one listener for the layer's lifetime (it used to be added on every open)
        l.__backdrop = true;
        l.addEventListener("click", function (e) { if (e.target === l) parent.close(); });
      }
      var first = l.hidden;
      l.innerHTML = "";
      l.className = "modal-layer" + (opts.zone ? " is-zone" : "");
      l.appendChild(node);
      if (first) {
        returnFocus = document.activeElement;
        holdChildScreen(true);
        document.addEventListener("keydown", onKey, true);
      }
      l.hidden = false;
    },

    /* ---- Gate: a multiplication question; a new one after each miss; closes after three ---- */
    /** opts (Change #23): help: the line under the title; onPass: what a right answer opens (default: the Parent Zone). */
    openGate: function (opts) {
      opts = opts || {};
      Kido.audio.unlock();
      var tries = 0, a = 0, b = 0;
      var label = U.el("label", { class: "sr-only", for: "pk-gate-answer" });
      var q = U.el("p", { class: "pk-gate__q", "aria-hidden": "true" });
      var input = U.el("input", { type: "text", inputmode: "numeric", pattern: "[0-9]*", autocomplete: "off", maxlength: "3",
        class: "pk-gate__input", id: "pk-gate-answer", enterkeyhint: "go" });
      var msg = U.el("p", { class: "pk-gate__msg", role: "status", "aria-live": "polite" });
      var ok = U.el("button", { class: "btn btn--block", type: "submit", text: "Continue" });
      var cancel = U.el("button", { class: "btn btn--ghost btn--block", type: "button", text: "Cancel" });
      var form = U.el("form", { class: "modal pk-gate", role: "dialog", "aria-modal": "true", "aria-labelledby": "pk-gate-title",
        "aria-describedby": "pk-gate-help", novalidate: "novalidate" }, [
        U.el("h2", { class: "pk-gate__title", id: "pk-gate-title", html: ico("lock") + "<span>For grown-ups</span>" }),
        U.el("p", { class: "pk-gate__help", id: "pk-gate-help", text: opts.help || "Answer this question to open the parent zone." }),
        q, label, input, msg,
        U.el("div", { class: "pk-gate__actions" }, [ok, cancel])
      ]);
      function ask() {
        // Two-digit × one-digit (33–76): quick for an adult, unlikely for a 3–10-year-old by chance.
        a = 11 + ((Math.random() * 9) | 0); b = 3 + ((Math.random() * 2) | 0);
        q.textContent = a + " × " + b + " = ?";
        label.textContent = "What is " + a + " times " + b + "?";
        input.value = "";
      }
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var raw = String(input.value).trim();
        if (!raw) { msg.textContent = "Type the answer first."; input.focus(); return; }
        if (parseInt(raw, 10) === a * b) { if (opts.onPass) opts.onPass(); else parent.openZone("home"); return; }
        tries++;
        if (tries >= 3) {
          msg.textContent = "That isn't right. Please ask a grown-up to help.";
          input.disabled = true; ok.disabled = true;
          setTimeout(function () { if (form.isConnected) parent.close(); }, 1800);
          return;
        }
        msg.textContent = "Not quite. Here's a new question.";
        ask();
        if (!calm() && Kido.fx && Kido.fx.shake) Kido.fx.shake(form);
        input.focus();
      });
      cancel.addEventListener("click", function () { parent.close(); });
      ask();
      parent.open(form);
      setTimeout(function () { if (input.isConnected) input.focus(); }, 60);
    },

    /* ---- The Parent Zone ---- */
    openZone: function (view) {
      var back = U.el("button", { class: "pk-iconbtn pk-back", type: "button", "aria-label": "Back to overview", html: ico("back") });
      var title = U.el("h1", { class: "pk-title", id: "pk-title", tabindex: "-1" });
      var close = U.el("button", { class: "pk-iconbtn pk-close", type: "button", "aria-label": "Close the parent zone", html: ico("close") });
      var head = U.el("header", { class: "pk-head" }, [
        back,
        U.el("span", { class: "pk-brand", "aria-hidden": "true", html: Kido.icons ? Kido.icons.momo() : "" }),
        U.el("div", { class: "pk-head__text" }, [U.el("span", { class: "pk-kicker", text: "Parent Zone" }), title]),
        close
      ]);
      var rail = U.el("nav", { class: "pk-rail", "aria-label": "Parent zone sections" });
      SECTIONS.forEach(function (s) {
        var b = U.el("button", { class: "pk-rail__item", type: "button", "data-view": s.id, html: ico(s.icon) + "<span>" + s.title + "</span>" });
        b.addEventListener("click", function () { show(s.id); });
        rail.appendChild(b);
      });
      var main = U.el("div", { class: "pk-main" });
      var status = U.el("div", { class: "pk-status", role: "status", "aria-live": "polite" });
      var root = U.el("div", { class: "pk", role: "dialog", "aria-modal": "true", "aria-labelledby": "pk-title" }, [
        head, U.el("div", { class: "pk-body" }, [rail, main]), status
      ]);
      back.addEventListener("click", function () { show("home"); });
      close.addEventListener("click", function () { parent.close(); });
      var keepDirty = zone && zone.dirty;
      zone = { root: root, main: main, title: title, back: back, rail: rail, status: status, view: null, dirty: !!keepDirty, dialog: null };
      parent.open(root, { zone: true });
      show(view || "home");
    },

    /** Older callers asked for "settings" directly. */
    openSettings: function () { parent.openZone("settings"); },

    /** Hardware back / Escape: a section goes back to the overview first. */
    back: function () {
      if (zone && zone.dialog) { zone.dialog.close(); return true; }
      if (zone && zone.view && zone.view !== "home") { show("home"); return true; }
      return false;
    },

    /** Which section is showing (tests / debugging). */
    view: function () { return zone ? zone.view : null; }
  };

  /* ---------------- view plumbing ---------------- */
  function show(id, focusSel) {
    if (!zone) return;
    commitField();
    var def = SECTION[id] || SECTION.home;
    zone.view = def.id;
    zone.root.setAttribute("data-view", def.id);
    zone.title.textContent = def.id === "home" ? "Overview" : def.title;
    zone.back.hidden = def.id === "home";
    Array.prototype.forEach.call(zone.rail.children, function (b) {
      if (b.getAttribute("data-view") === def.id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    zone.main.innerHTML = "";
    zone.main.scrollTop = 0;
    var v = U.el("div", { class: "pk-view pk-view--" + def.id });
    VIEWS[def.id](v);
    zone.main.appendChild(v);
    var target = focusSel && v.querySelector(focusSel);
    try { (target || zone.title).focus({ preventScroll: true }); } catch (e) {}
  }
  function say(text) {
    if (!zone) return;
    var z = zone;
    z.status.textContent = text;
    z.status.classList.add("is-on");
    clearTimeout(z.statusT);
    z.statusT = setTimeout(function () { z.status.classList.remove("is-on"); }, 3600);
  }
  function block(title, linkTo, linkText) {
    var head = U.el("div", { class: "pk-block__head" }, [U.el("h2", { text: title })]);
    if (linkTo) head.appendChild(go(linkText || "See all", linkTo));
    return U.el("section", { class: "pk-block" }, [head]);
  }
  function go(text, view, focusSel) {
    var b = U.el("button", { class: "pk-link", type: "button", html: "<span>" + text + "</span>" + ico("chevron") });
    b.addEventListener("click", function () { show(view, focusSel); });
    return b;
  }
  function empty(text) { return U.el("p", { class: "pk-empty", text: text }); }
  function para(text, cls) { return U.el("p", { class: cls || "pk-text", text: text }); }
  function pill(text, tone) { return U.el("span", { class: "pk-pill pk-pill--" + (tone || "plain"), text: text }); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function listText(arr) { return arr.length <= 1 ? arr.join("") : arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1]; }

  /* Times: real stored times only, shown in the device's own format. */
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function dayLabel(iso) {
    var d = new Date(iso), now = new Date(), y = new Date(); y.setDate(now.getDate() - 1);
    if (sameDay(d, now)) return "Today";
    if (sameDay(d, y)) return "Yesterday";
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  }
  function timeOf(iso) { return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
  function when(iso) { if (!iso) return ""; var d = dayLabel(iso); return d === "Today" || d === "Yesterday" ? d.toLowerCase() + " at " + timeOf(iso) : "on " + d; }
  function dateOnly(iso) { return iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : ""; }

  function countChips(c) {
    var parts = [];
    if (c.puzzle) parts.push(plural(c.puzzle, "puzzle", "puzzles"));
    if (c.story) parts.push(plural(c.story, "story", "stories"));
    if (c.discovery) parts.push(plural(c.discovery, "discovery", "discoveries"));
    if (c.game) parts.push(plural(c.game, "game", "games"));
    var ul = U.el("ul", { class: "pk-chips" });
    parts.forEach(function (t) { ul.appendChild(U.el("li", { class: "pk-chip", text: t })); });
    return ul;
  }
  function entryRow(e, showDay) {
    var meta = [e.kindLabel, e.status, (showDay ? dayLabel(e.at) + ", " : "") + timeOf(e.at)];
    if (e.world) meta.push(e.world);
    var extra = [];
    e.badges.forEach(function (b) { extra.push(b + " badge"); });
    if (e.stickers) extra.push(plural(e.stickers, "sticker", "stickers"));
    return U.el("li", { class: "pk-row" }, [
      U.el("span", { class: "pk-kind pk-kind--" + e.kind, html: ico(KIND_ICON[e.kind] || "game") }),
      U.el("div", { class: "pk-row__main" }, [
        U.el("div", { class: "pk-row__title", text: e.name }),
        U.el("div", { class: "pk-row__meta", text: meta.join(" · ") }),
        extra.length ? U.el("div", { class: "pk-row__extra", text: "Earned: " + listText(extra) }) : null
      ])
    ]);
  }
  var TONE_LABEL = { complete: "Completed", "in-progress": "In progress", "not-started": "Not started" };

  /* ---------------- views ---------------- */
  var VIEWS = {};

  VIEWS.home = function (v) {
    var prof = I().childProfile(), act = I().activitySummary(), sk = I().skillSummary(), recent = I().recentActivities(3);

    var card = U.el("button", { class: "pk-profile", type: "button", "aria-label": "Child profile: " + (prof.name || "name not added") + (prof.ageLabel ? ", " + prof.ageLabel : "") }, [
      U.el("span", { class: "pk-avatar", "aria-hidden": "true", html: Kido.icons ? Kido.icons.momo() : "" }),
      U.el("span", { class: "pk-profile__text" }, [
        U.el("span", { class: "pk-profile__name", text: prof.name || "Your child" }),
        U.el("span", { class: "pk-profile__meta", text: prof.ageLabel ? prof.ageLabel + " · " + prof.stage : "Age group not chosen yet" })
      ]),
      U.el("span", { class: "pk-profile__go", "aria-hidden": "true", html: ico("chevron") })
    ]);
    card.addEventListener("click", function () { show("profile"); });
    v.appendChild(card);

    var today = block("Today", "activity", "Recent activity");
    if (act.today.total) {
      today.appendChild(countChips(act.today));
      if (act.todayWorlds.length) today.appendChild(para("Played in " + listText(act.todayWorlds) + ".", "pk-text pk-text--soft"));
    } else {
      today.appendChild(empty(act.any ? "No adventures yet today. The last one was " + when(act.lastISO) + "." : "No adventures yet."));
    }
    v.appendChild(today);

    var learn = block("Learning progress", "learning");
    if (sk.rows.length) {
      var ul = U.el("ul", { class: "pk-list" });
      sk.rows.slice(0, 3).forEach(function (r) {
        ul.appendChild(U.el("li", { class: "pk-row pk-row--tight" }, [
          U.el("div", { class: "pk-row__main" }, [U.el("div", { class: "pk-row__title", text: r.label })]),
          pill(r.state, r.tone)
        ]));
      });
      learn.appendChild(ul);
    } else learn.appendChild(empty("No puzzle history yet."));
    v.appendChild(learn);

    var ra = block("Recent adventures", "activity");
    if (recent.length) {
      var rl = U.el("ul", { class: "pk-list" });
      recent.forEach(function (e) { rl.appendChild(entryRow(e, true)); });
      ra.appendChild(rl);
    } else ra.appendChild(empty("No adventures yet."));
    v.appendChild(ra);

    // Phones: the other sections (wide screens have the side rail instead).
    var d = I().discoverySummary(), st = I().storySummary(), rw = I().rewardSummary();
    var more = U.el("nav", { class: "pk-more", "aria-label": "More in the parent zone" });
    [
      ["discoveries", d.explored.length ? plural(d.explored.length, "discovery explored", "discoveries explored") : "None explored yet"],
      ["stories", st.completed ? plural(st.completed, "story completed", "stories completed") : st.inProgress ? "A story is in progress" : "None completed yet"],
      ["rewards", rw.stars || rw.badges.length ? plural(rw.stars, "star", "stars") + " · " + plural(rw.badges.length, "badge", "badges") : "None yet"],
      ["adapt", "How puzzles adjust to your child"],
      ["settings", "Profile, sound, accessibility and data"],
      ["credits", "Who made the sounds and voices; what the app keeps"]
    ].forEach(function (x) {
      var s = SECTION[x[0]];
      var b = U.el("button", { class: "pk-more__item", type: "button" }, [
        U.el("span", { class: "pk-kind", html: ico(s.icon) }),
        U.el("span", { class: "pk-row__main" }, [U.el("span", { class: "pk-row__title", text: s.title }), U.el("span", { class: "pk-row__meta", text: x[1] })]),
        U.el("span", { class: "pk-more__go", "aria-hidden": "true", html: ico("chevron") })
      ]);
      b.addEventListener("click", function () { show(s.id); });
      more.appendChild(b);
    });
    v.appendChild(more);
  };

  VIEWS.profile = function (v) {
    var prof = I().childProfile();
    var hero = U.el("section", { class: "pk-block pk-hero" }, [
      U.el("span", { class: "pk-avatar pk-avatar--lg", "aria-hidden": "true", html: Kido.icons ? Kido.icons.momo() : "" }),
      U.el("div", {}, [
        U.el("h2", { class: "pk-hero__name", text: prof.name || "No name added yet" }),
        U.el("p", { class: "pk-text pk-text--soft", text: prof.name ? "Little Explorers greets " + prof.name + " by name." : "Add a name and Little Explorers will use it in greetings." })
      ])
    ]);
    v.appendChild(hero);
    var b = block("Profile");
    var dl = U.el("dl", { class: "pk-facts" });
    function fact(k, val) { dl.appendChild(U.el("dt", { text: k })); dl.appendChild(U.el("dd", { text: val })); }
    fact("Name", prof.name || "Not added yet");
    fact("Age group", prof.ageLabel || "Not chosen yet");
    if (prof.stage) fact("Stage", prof.stage + " — Little Explorers's name for the " + prof.ageLabel + " stage");
    if (prof.sinceISO) fact("Progress kept since", dateOnly(prof.sinceISO));
    if (prof.streak >= 2) fact("Days in a row", prof.streak + " days");
    b.appendChild(dl);
    var edit = U.el("button", { class: "btn btn--ghost pk-btn", type: "button", text: prof.name ? "Edit name or age group" : "Add a name" });
    edit.addEventListener("click", function () { show("settings", "#pk-name"); });
    b.appendChild(edit);
    v.appendChild(b);
    v.appendChild(para("This profile is stored on this device only.", "pk-note"));
  };

  VIEWS.activity = function (v) {
    var act = I().activitySummary(), recent = I().recentActivities(60);
    var t = block("Today");
    t.appendChild(act.today.total ? countChips(act.today) : empty(act.any ? "No adventures yet today." : "No adventures yet."));
    if (act.todayWorlds.length) t.appendChild(para("Played in " + listText(act.todayWorlds) + ".", "pk-text pk-text--soft"));
    // Today's Adventure (Change #12): one quiet line, never a target.
    var adv = I().adventureSummary ? I().adventureSummary() : null;
    if (adv && adv.today) t.appendChild(para("Today's Adventure completed" + (adv.today > 1 ? " " + adv.today + " times" : "") + ".", "pk-text pk-text--soft"));
    if (adv && adv.current) t.appendChild(para((adv.today ? "Another adventure" : "An adventure") + " is under way: " + adv.current.done + " of " + adv.current.total + " steps done.", "pk-text pk-text--soft"));
    v.appendChild(t);
    if (act.any || (adv && adv.total)) {
      var w = block("Last 7 days");
      w.appendChild(act.week.total ? countChips(act.week) : empty("Nothing in the last 7 days."));
      if (adv && adv.week) w.appendChild(para(plural(adv.week, "adventure", "adventures") + " completed.", "pk-text pk-text--soft"));
      v.appendChild(w);
    }
    var pl = block("Places explored");
    if (act.places.length) {
      var ul = U.el("ul", { class: "pk-list" });
      act.places.forEach(function (p) {
        ul.appendChild(U.el("li", { class: "pk-row pk-row--tight" }, [
          U.el("div", { class: "pk-row__main" }, [U.el("div", { class: "pk-row__title", text: p.name })]),
          U.el("span", { class: "pk-row__meta", text: plural(p.activities, "activity finished", "activities finished") })
        ]));
      });
      pl.appendChild(ul);
    } else pl.appendChild(empty("No places explored yet."));
    v.appendChild(pl);

    var r = block("Recent activity");
    if (!recent.length) r.appendChild(empty("No adventures yet. Finished activities will appear here."));
    var day = null, list = null;
    recent.forEach(function (e) {
      var d = dayLabel(e.at);
      if (d !== day) {
        day = d;
        r.appendChild(U.el("h3", { class: "pk-day", text: d }));
        list = U.el("ul", { class: "pk-list" });
        r.appendChild(list);
      }
      list.appendChild(entryRow(e, false));
    });
    v.appendChild(r);
  };

  VIEWS.learning = function (v) {
    var s = I().skillSummary();
    v.appendChild(para("Little Explorers notices how puzzles and games go and adjusts quietly. Your child never sees levels or scores. These notes describe recent play only.", "pk-intro"));
    var practice = Kido.progress.get("practice") || {};
    var practiceIds = ["scene-brush", "scene-plant"].filter(function (id) { return practice[id]; });
    if (practiceIds.length) {
      var practical = block("Hands-on practice");
      practiceIds.forEach(function (id) {
        var record = practice[id], evidence = record.evidence || {};
        practical.appendChild(para(record.summary + ". Played " + record.plays + " time" + (record.plays === 1 ? "" : "s") + ".", "pk-text"));
        if (id === "scene-brush") practical.appendChild(para("Last time: " + (evidence.surfaces || 0) + " tooth surfaces explored. " + (evidence.bathSteps ? evidence.bathSteps + " bath steps completed. " : "") + (evidence.assistedActions || 0) + " tap-assisted cleaning actions. This records game practice, not real toothbrushing.", "pk-note"));
        if (id === "scene-plant" && evidence.predictionAttempts) practical.appendChild(para("Last prediction: " + evidence.predictionAttempts + " attempt" + (evidence.predictionAttempts === 1 ? "" : "s") + ".", "pk-note"));
      });
      practical.appendChild(para("These activities earn a star for taking part. They do not produce an accuracy or mastery score.", "pk-note"));
      v.appendChild(practical);
    }
    var b = block("Skills being practised");
    if (!s.rows.length) b.appendChild(empty("No puzzle history yet. Skills appear here after a few puzzles or games."));
    else {
      var ul = U.el("ul", { class: "pk-list" });
      s.rows.forEach(function (r) {
        ul.appendChild(U.el("li", { class: "pk-row pk-row--skill" }, [
          U.el("div", { class: "pk-row__main" }, [
            U.el("div", { class: "pk-row__title", text: r.label }),
            U.el("div", { class: "pk-row__text", text: r.sentence }),
            r.lastISO ? U.el("div", { class: "pk-row__meta", text: "Last played " + when(r.lastISO) }) : null
          ]),
          pill(r.state, r.tone)
        ]));
      });
      b.appendChild(ul);
    }
    v.appendChild(b);
    if (s.untried.length) {
      var n = block("Not explored yet");
      n.appendChild(para(listText(s.untried.map(function (x) { return x.label; })) + ".", "pk-text pk-text--soft"));
      v.appendChild(n);
    }
    if (s.puzzles) v.appendChild(para(plural(s.puzzles, "puzzle", "puzzles") + " played so far.", "pk-note"));
    v.appendChild(go("How Little Explorers adapts", "adapt"));
  };

  VIEWS.discoveries = function (v) {
    var d = I().discoverySummary();
    if (!d.explored.length) {
      var e = block("Explored");
      e.appendChild(empty("Explore your first discovery to see it here."));
      v.appendChild(e);
    }
    Object.keys(d.groups).forEach(function (cat) {
      var b = block(cat);
      var ul = U.el("ul", { class: "pk-list" });
      d.groups[cat].forEach(function (x) {
        var meta = [plural(x.times || 1, "time", "times") + " explored"];
        if (x.lastISO) meta.push("last " + when(x.lastISO));
        if (x.world) meta.push(x.world);
        ul.appendChild(U.el("li", { class: "pk-row" }, [
          U.el("span", { class: "pk-kind pk-kind--discovery", html: ico("compass") }),
          U.el("div", { class: "pk-row__main" }, [
            U.el("div", { class: "pk-row__title", text: x.name }),
            U.el("div", { class: "pk-row__text", text: x.title }),
            U.el("div", { class: "pk-row__meta", text: meta.join(" · ") })
          ])
        ]));
      });
      b.appendChild(ul);
      v.appendChild(b);
    });
    if (d.notYet.length) {
      var n = block("Still to explore");
      n.appendChild(para(listText(d.notYet.map(function (x) { return x.name + (x.world ? " (" + x.world + ")" : ""); })) + ".", "pk-text pk-text--soft"));
      v.appendChild(n);
    }
  };

  VIEWS.stories = function (v) {
    var s = I().storySummary();
    if (!s.completed && !s.inProgress) v.appendChild(para("Complete your first story to see it here.", "pk-intro"));
    var b = block("All stories");
    var ul = U.el("ul", { class: "pk-list" });
    s.stories.forEach(function (x) {
      var detail = x.status === "complete"
        ? "Finished " + plural(x.times || 1, "time", "times") + (x.lastISO ? " · last " + when(x.lastISO) : "") + (x.replaying ? " · reading it again now" : "")
        : x.status === "in-progress" ? "Paused part-way" + (x.lastISO ? " · " + when(x.lastISO) : "")
        : "Not started yet";
      ul.appendChild(U.el("li", { class: "pk-row" }, [
        U.el("span", { class: "pk-kind pk-kind--story", html: ico("book") }),
        U.el("div", { class: "pk-row__main" }, [
          U.el("div", { class: "pk-row__title", text: x.title }),
          U.el("div", { class: "pk-row__meta", text: x.type + " · " + detail })
        ]),
        pill(TONE_LABEL[x.status], x.status)
      ]));
    });
    b.appendChild(ul);
    v.appendChild(b);
  };

  VIEWS.rewards = function (v) {
    var r = I().rewardSummary();
    if (!r.stars && !r.badges.length && !r.stickers.length) {
      v.appendChild(para("No rewards yet. Stars, badges and stickers appear here as your child plays.", "pk-intro"));
    } else {
      var sum = U.el("ul", { class: "pk-chips pk-chips--summary" });
      [plural(r.stars, "star", "stars"),
       r.badges.length + " of " + r.badgesTotal + " badges",
       r.stickers.length + " of " + r.stickersTotal + " stickers",
       plural(r.activities, "activity completed", "activities completed")].forEach(function (t) { sum.appendChild(U.el("li", { class: "pk-chip", text: t })); });
      v.appendChild(sum);
    }
    var b = block("Badges");
    if (r.badges.length) {
      var ul = U.el("ul", { class: "pk-list" });
      r.badges.forEach(function (x) {
        ul.appendChild(U.el("li", { class: "pk-row pk-row--tight" }, [
          U.el("span", { class: "pk-emoji", "aria-hidden": "true", text: x.icon }),
          U.el("div", { class: "pk-row__main" }, [U.el("div", { class: "pk-row__title", text: x.name }),
            U.el("div", { class: "pk-row__meta", text: "Earned " + when(x.at) })])
        ]));
      });
      b.appendChild(ul);
      if (r.badgesTotal > r.badges.length) b.appendChild(para(plural(r.badgesTotal - r.badges.length, "more badge", "more badges") + " to discover.", "pk-note"));
    } else b.appendChild(empty("No badges yet."));
    v.appendChild(b);
    var sb = block("Sticker album");
    if (r.stickers.length) {
      var grid = U.el("ul", { class: "pk-stickers" });
      r.stickers.forEach(function (x) {
        grid.appendChild(U.el("li", { class: "pk-sticker", title: x.name }, [
          U.el("span", { class: "pk-emoji", "aria-hidden": "true", text: x.icon }), U.el("span", { class: "pk-sticker__name", text: x.name })]));
      });
      sb.appendChild(grid);
    } else sb.appendChild(empty("No stickers yet."));
    v.appendChild(sb);
    if (r.streak >= 2) v.appendChild(para("Played on " + r.streak + " days in a row.", "pk-note"));
  };

  VIEWS.credits = function (v) {
    var p = block("Your child's privacy");
    p.appendChild(para("Little Explorers works fully offline. It has no ads, no accounts, no tracking or analytics services and no in-app purchases, and it sends nothing anywhere."));
    p.appendChild(para("Your child's first name, age group, avatar, stars and progress stay on this device. Reset or remove them any time in Settings, or by uninstalling the app."));
    v.appendChild(p);

    var list = Kido.credits || [];
    [["sound", "Sounds", "These real recordings are shared under Creative Commons licences. Thank you to their recordists. Some were shortened and their loudness evened out."],
     ["picture", "Photos", "These photos are shared under Creative Commons licences. Thank you to their photographers. They were cropped and resized; our versions are shared under the same licences."]
    ].forEach(function (g) {
      var items = list.filter(function (x) { return x.kind === g[0]; });
      if (!items.length) return;
      var c = block(g[1]);
      c.appendChild(para(g[2]));
      var ul = U.el("ul", { class: "pk-list" });
      items.forEach(function (x) {
        ul.appendChild(U.el("li", { class: "pk-row pk-row--tight" }, [U.el("div", { class: "pk-row__main" }, [
          U.el("div", { class: "pk-row__title", text: x.what.charAt(0).toUpperCase() + x.what.slice(1).replace(/_/g, " ") }),
          U.el("div", { class: "pk-row__text", text: x.author + " · " + x.licence + " · " + (x.url || x.source) })])]));
      });
      c.appendChild(ul);
      v.appendChild(c);
    });

    var m = block("Also made with");
    [
      "Voices: Kokoro-82M by hexgrad (Apache License 2.0), generated offline. Momo and the narrator are computer voices.",
      "Other sounds: recordings in the public domain; the remaining animal calls are made by the app itself.",
      "Other photos and videos: Wikimedia Commons and NASA (public domain / CC0), plus Little Explorers's own drawings. Chiku's pictures were made with an AI image tool.",
      "Fonts: Baloo 2 and Fredoka (SIL Open Font License 1.1).",
      "Licences: CC BY and CC BY-SA at creativecommons.org/licenses; Apache 2.0 at apache.org/licenses."
    ].forEach(function (t) { m.appendChild(para(t)); });
    v.appendChild(m);
  };

  VIEWS.adapt = function (v) {
    var a = I().adaptiveSummary();
    if (!a) { v.appendChild(empty("Learning adjustments aren't available.")); return; }
    var b = block("In short");
    a.intro.forEach(function (t) { b.appendChild(para(t)); });
    v.appendChild(b);
    if (a.skills.length) {
      var s = block("Right now");
      var ul = U.el("ul", { class: "pk-list" });
      a.skills.forEach(function (x) {
        ul.appendChild(U.el("li", { class: "pk-row pk-row--tight" }, [U.el("div", { class: "pk-row__main" }, [
          U.el("div", { class: "pk-row__title", text: x.label }), U.el("div", { class: "pk-row__text", text: x.text })])]));
      });
      s.appendChild(ul);
      a.stories.forEach(function (t) { s.appendChild(para(t, "pk-text pk-text--soft")); });
      v.appendChild(s);
    }
    if (a.skills.length) v.appendChild(para("Little Explorers only adjusts after several similar results in a row, never after a single mistake. To start the learning side afresh, use Reset learning in Settings.", "pk-note"));
    v.appendChild(go("Settings", "settings"));
  };

  VIEWS.settings = function (v) {
    /* Child profile */
    var pr = block("Child profile");
    var nameInput = U.el("input", { type: "text", id: "pk-name", class: "pk-input", maxlength: "12", autocomplete: "off",
      value: (I().childProfile().name || "") });
    nameInput.addEventListener("change", function () {
      var val = nameInput.value.trim();
      P.set("childName", val || "friend");
      zone.dirty = true;
      if (Kido.screens && Kido.screens.refreshTopbar) Kido.screens.refreshTopbar();
      say(val ? "Name saved." : "Name removed.");
    });
    pr.appendChild(field("Child's name", nameInput, "pk-name", "Shown in Little Explorers's greetings. Up to 12 letters."));
    var ageSel = U.el("select", { id: "pk-age", class: "pk-input" });
    Kido.age.BANDS.forEach(function (bnd) {
      var o = U.el("option", { value: bnd, text: Kido.age.labelFor(bnd) + " · " + Kido.age.cfg(bnd).label });
      if (P.hasOnboarded() && bnd === Kido.age.current()) o.selected = true;
      ageSel.appendChild(o);
    });
    if (!P.hasOnboarded()) ageSel.insertBefore(U.el("option", { value: "", text: "Choose an age group", selected: "selected", disabled: "disabled" }), ageSel.firstChild);
    ageSel.addEventListener("change", function () {
      if (!ageSel.value) return;
      Kido.age.set(ageSel.value);
      zone.dirty = true;
      say("Age group set to " + Kido.age.labelFor(ageSel.value) + ". Progress is kept.");
    });
    pr.appendChild(field("Age group", ageSel, "pk-age",
      "Changing the age group changes the difficulty and content Little Explorers picks for future activities. Stars, badges, stories and discoveries are kept."));
    v.appendChild(pr);

    /* Sound (the existing mixer controls) */
    var sound = block("Sound");
    sound.appendChild(soundPanel());
    v.appendChild(sound);

    /* Accessibility */
    var acc = block("Accessibility");
    acc.appendChild(toggle("Reduce motion", "reduceMotion", "Fewer animations and transitions."));
    acc.appendChild(toggle("Big text", "bigText", "Larger text across Kido."));
    acc.appendChild(toggle("High contrast", "highContrast", "Stronger outlines and colours."));
    v.appendChild(acc);

    /* Learning */
    var lr = block("Learning");
    lr.appendChild(para("Little Explorers sets puzzle difficulty from the age group and adjusts it from play. Resetting learning starts that over from the age group; stars, badges and stickers stay.", "pk-text pk-text--soft"));
    var resetL = U.el("button", { class: "btn btn--ghost pk-btn", type: "button", text: "Reset learning…" });
    resetL.addEventListener("click", function () {
      confirmBox(lr, resetL, "Start learning afresh? Puzzle difficulty goes back to the age group's starting point. Stars, badges and stickers stay.",
        "Yes, reset learning", function () { Kido.Learning.reset(); say("Learning reset."); });
    });
    lr.appendChild(resetL);
    v.appendChild(lr);

    /* Data */
    var data = block("Data");
    data.appendChild(para("Little Explorers keeps everything on this device. Nothing is sent anywhere.", "pk-text pk-text--soft"));
    var resetAll = U.el("button", { class: "btn pk-btn pk-btn--danger", type: "button", text: "Reset all progress…" });
    resetAll.addEventListener("click", openResetDialog);
    data.appendChild(resetAll);
    v.appendChild(data);
  };

  /* ---------------- settings controls ---------------- */
  function field(label, control, id, help) {
    var helpId = id + "-help";
    if (help) control.setAttribute("aria-describedby", helpId);
    return U.el("div", { class: "pk-field" }, [
      U.el("label", { class: "pk-field__label", for: id, text: label }),
      control,
      help ? U.el("p", { class: "pk-field__help", id: helpId, text: help }) : null
    ]);
  }
  function toggle(label, key, help) {
    var on = (key === "sound" || key === "music") ? P.settings()[key] !== false : !!P.settings()[key];
    var input = U.el("input", { type: "checkbox", "aria-label": label });   // named for screen readers
    input.checked = on;
    input.addEventListener("change", function () { P.setSetting(key, input.checked); Kido.applySettings(); });
    var sw = U.el("label", { class: "switch" }, [input, U.el("span", { class: "switch__track" })]);
    return U.el("div", { class: "modal__row" }, [
      U.el("div", { class: "modal__label", html: label + (help ? "<small>" + help + "</small>" : "") }), sw]);
  }
  function soundPanel() {
    var AM = Kido.AudioManager;
    var box = U.el("div", { class: "sound-panel", role: "group", "aria-label": "Sound" });
    box.appendChild(toggle("All sound", "sound", "Turns every sound and voice off or on."));
    box.appendChild(toggle("Music", "music"));
    var narrator=U.el('select',{id:'pk-narrator',class:'pk-input','aria-label':'Narration accent'});
    Kido.audio.narratorAccents.forEach(function(a){narrator.appendChild(U.el('option',{value:a.id,text:a.label}));});
    var voiceChoice=U.el('select',{id:'pk-narrator-voice',class:'pk-input','aria-label':'Narrator voice on this device'});
    var voiceNote=para('', 'pk-note'); voiceNote.setAttribute('role','status');
    function refreshVoices(){
      var info=Kido.audio.narratorInfo(); narrator.value=info.accent;
      voiceChoice.innerHTML='';voiceChoice.appendChild(U.el('option',{value:'',text:'Automatic · prefer a female voice'}));
      info.voices.forEach(function(v){voiceChoice.appendChild(U.el('option',{value:v.voiceURI||v.name,text:Kido.audio.voiceLabel(v)}));});
      voiceChoice.value=P.settings().narratorVoice||'';
      if(voiceChoice.selectedIndex<0)voiceChoice.value='';
      voiceNote.textContent=info.voice ? 'Using '+info.voice.name+' ('+info.voice.lang+'). '+(!info.exact?'This accent is unavailable here; using another English voice. ':'')+(!info.female?'This voice’s gender is not confirmed. Use the preview to choose.':'') : 'No device voice is available yet. Install an English voice in your device speech settings, then reopen this panel.';
    }
    narrator.addEventListener('change',function(){Kido.audio.setNarrator(narrator.value,'');refreshVoices();});
    voiceChoice.addEventListener('change',function(){Kido.audio.setNarrator(narrator.value,voiceChoice.value);refreshVoices();});
    var preview=U.el('button',{type:'button',class:'btn btn--ghost pk-btn',text:'Preview narrator'});
    preview.addEventListener('click',function(){refreshVoices();Kido.audio.unlock();Kido.audio.speak('Hello! I’m your learning friend. Let’s explore, play, and learn together.',{parentZone:true,lang:'en',pitch:1,rate:.98}).then(function(ok){if(box.isConnected&&!ok)voiceNote.textContent='Preview could not play. Check All sound, Master and Voice volume, and try again.';});});
    box.appendChild(U.el('label',{class:'modal__row',for:'pk-narrator',text:'Narration accent'}));box.appendChild(narrator);
    box.appendChild(U.el('label',{class:'modal__row',for:'pk-narrator-voice',text:'Voice on this device'}));box.appendChild(voiceChoice);
    box.appendChild(voiceNote);box.appendChild(preview);refreshVoices();
    // Refresh delayed voice lists when the parent opens either selector.
    narrator.addEventListener('focus',refreshVoices);voiceChoice.addEventListener('focus',refreshVoices);
    if (!AM || !AM.volumes) return box;
    var chans = (Kido.audioRegistry && Kido.audioRegistry.channels) || {};
    var sliders = [];
    ["master", "music", "sfx", "voice", "ambience"].forEach(function (ch) {
      var name = (chans[ch] && chans[ch].label) || ch;
      var pct = Math.round(AM.volumes()[ch] * 100);
      var out = U.el("output", { class: "vol__pct", text: pct + "%" });
      var input = U.el("input", { type: "range", min: "0", max: "100", step: "5", value: String(pct), class: "vol__range",
        "aria-label": name + " volume", "aria-valuetext": pct + "%" });
      input.addEventListener("input", function () {
        var val = +input.value;
        out.textContent = val + "%"; input.setAttribute("aria-valuetext", val + "%");
        AM.setVolume(ch, val / 100);
      });
      // Let the grown-up hear the new level once they let go.
      input.addEventListener("change", function () {
        if (ch === "voice") Kido.audio.speak("Hello! This is how loud I am.", { kind: "dialogue", parentZone: true });
        else if (ch !== "music" && ch !== "ambience") Kido.audio.cue("ui.select");
      });
      sliders.push({ ch: ch, input: input, out: out });
      box.appendChild(U.el("label", { class: "modal__row vol" }, [U.el("span", { class: "modal__label", text: name }),
        U.el("span", { class: "vol__ctl" }, [input, out])]));
    });
    var reset = U.el("button", { class: "btn btn--ghost pk-btn sound-panel__reset", type: "button", text: "Reset sound levels" });
    reset.addEventListener("click", function () {
      AM.resetVolumes();
      sliders.forEach(function (s) { var p = Math.round(AM.volumes()[s.ch] * 100); s.input.value = String(p); s.out.textContent = p + "%"; s.input.setAttribute("aria-valuetext", p + "%"); });
      Kido.audio.cue("ui.select");
      say("Sound levels reset.");
    });
    box.appendChild(reset);
    return box;
  }
  /** Inline "are you sure?" for a lighter action (reset learning). */
  function confirmBox(host, trigger, question, yesText, onYes) {
    trigger.hidden = true;
    var yes = U.el("button", { class: "btn pk-btn pk-btn--danger", type: "button", text: yesText });
    var no = U.el("button", { class: "btn btn--ghost pk-btn", type: "button", text: "Cancel" });
    var box = U.el("div", { class: "pk-confirm", role: "group", "aria-label": "Confirm" }, [para(question), U.el("div", { class: "pk-actions" }, [no, yes])]);
    function done() { box.remove(); trigger.hidden = false; trigger.focus(); }
    yes.addEventListener("click", function () { onYes(); done(); });
    no.addEventListener("click", done);
    host.appendChild(box);
    no.focus();
  }

  /* ---------------- reset all progress: an explicit, explained confirmation ---------------- */
  function openResetDialog() {
    if (!zone || zone.dialog) return;
    var r = I().rewardSummary(), st = I().storySummary(), d = I().discoverySummary();
    var cancel = U.el("button", { class: "btn btn--ghost pk-btn", type: "button", text: "Cancel" });
    var confirm = U.el("button", { class: "btn pk-btn pk-btn--danger", type: "button", text: "Reset progress" });
    var removes = U.el("ul", { class: "pk-bullets" });
    [plural(r.stars, "star", "stars") + ", " + plural(r.badges.length, "badge", "badges") + " and " + plural(r.stickers.length, "sticker", "stickers"),
     plural(r.activities, "completed activity", "completed activities") + " and the activity history",
     "Story progress (" + plural(st.completed, "story completed", "stories completed") + ") and " + plural(d.explored.length, "discovery", "discoveries") + " explored",
     "Learning progress — puzzles start again from the age group",
     "Today's adventure board and the day streak"].forEach(function (t) { removes.appendChild(U.el("li", { text: t })); });
    var keeps = U.el("ul", { class: "pk-bullets" });
    ["Name and age group", "Sound, accessibility and display settings"].forEach(function (t) { keeps.appendChild(U.el("li", { text: t })); });
    var box = U.el("div", { class: "pk-dialog", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "pk-reset-title", "aria-describedby": "pk-reset-desc" }, [
      U.el("h2", { id: "pk-reset-title", text: "Reset this child's Little Explorers progress?" }),
      U.el("div", { id: "pk-reset-desc" }, [
        para("This removes, on this device:", "pk-text pk-text--strong"), removes,
        para("This keeps:", "pk-text pk-text--strong"), keeps,
        para("This can't be undone.", "pk-text pk-text--warn")
      ]),
      U.el("div", { class: "pk-actions" }, [cancel, confirm])
    ]);
    var wrap = U.el("div", { class: "pk-dialog-wrap" }, [box]);
    var inner = [zone.root.querySelector(".pk-head"), zone.root.querySelector(".pk-body")];
    function closeDialog() {
      wrap.remove();
      inner.forEach(function (el) { if (el) el.removeAttribute("inert"); });
      if (zone) zone.dialog = null;
    }
    cancel.addEventListener("click", function () { closeDialog(); var b = zone && zone.main.querySelector(".pk-btn--danger"); if (b) b.focus(); });
    confirm.addEventListener("click", function () {
      P.reset(true, true);                 // keeps name, age group and settings; clears everything else
      Kido.applySettings();
      zone.dirty = true;
      closeDialog();
      show("home");
      say("Progress reset. Name, age group and settings were kept.");
    });
    inner.forEach(function (el) { if (el) el.setAttribute("inert", ""); });
    zone.root.appendChild(wrap);
    zone.dialog = { close: function () { cancel.click(); } };
    cancel.focus();
  }
})(window);
