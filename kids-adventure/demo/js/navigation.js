/* =========================================================================
   navigation.js — Screen router, tab bar, back handling
   A tiny stack-based router. Tab roots reset the stack; region/play/result
   push onto it. Chrome (top bar + tab bar visibility, back arrow) is derived
   from the current entry. Android hardware-back maps to nav.back() via the
   History API.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var S = function () { return Kido.screens; };

  var TABS = [
    { id: "home",    label: "Home",    render: function () { S().world(); } },
    { id: "games",   label: "Games",   render: function () { S().gamesTab(); } },
    { id: "learn",   label: "Learn",   render: function () { S().learnTab(); } },
    { id: "create",  label: "Create",  render: function () { S().createTab(); } },
    { id: "stories", label: "Stories", render: function () { S().storiesTab(); } },
    { id: "rewards", label: "Rewards", render: function () { S().rewards(); } }
  ];

  // name -> how to render + chrome behaviour. `world: true` = full-bleed Kido
  // World view: the top bar floats over the art as a light HUD.
  var SCREENS = {
    age:       { chrome: "none", hideTab: true, fn: function () { S().age(); } },
    region:    { chrome: "app", fn: function (p) { S().region(p); } },
    realm:     { chrome: "app", hideTab: true, world: true, fn: function (p) { S().realm(p); } },
    worldlist: { chrome: "app", hideTab: true, fn: function (p) { S().worldList(p); } },
    play:      { chrome: "app", hideTab: true, fn: null },   // engine paints it
    result:    { chrome: "app", hideTab: true, fn: null },   // showResult paints it
    scene:     { chrome: "none", hideTab: true, fn: null }   // Scene.run paints (immersive)
  };
  TABS.forEach(function (t) { SCREENS[t.id] = { chrome: "app", tab: t.id, fn: t.render }; });
  // Home is the explorable world itself — the world provides the navigation.
  SCREENS.home.hideTab = true;
  SCREENS.home.world = true;

  var stack = [];
  var currentTab = "home";

  function top() { return stack[stack.length - 1]; }
  /** Screen change: voice stops now; music and ambience stop shortly unless the
      next screen asks for the same again (then they simply carry on). */
  function leaveAudio() {
    if (Kido.Voice && Kido.Voice.stop) Kido.Voice.stop();
    if (Kido.Music) { if (Kido.Music.release) Kido.Music.release(400); else Kido.Music.stop(400); }
    if (Kido.AudioManager) { Kido.AudioManager.releaseAmbience(); Kido.AudioManager.stopCurrent(); }
  }
  function def(name) { return SCREENS[name] || { chrome: "app" }; }

  var nav = Kido.nav = {
    tabs: TABS,

    /** Navigate to a screen. opts.render:false skips the render fn (used when
        the engine/result paints itself). opts.replace swaps the top entry. */
    go: function (name, params, opts) {
      if (Kido.Scene && Kido.Scene.teardown) Kido.Scene.teardown();
      if (Kido.VideoManager) Kido.VideoManager.releaseAll();   // no clip keeps playing off-screen
      if (Kido.StoryEngine) Kido.StoryEngine.stop();           // …and no story keeps talking
      if (Kido.AudioManager) Kido.AudioManager.releaseAmbience();   // a place's bed ends unless the next screen keeps it
      opts = opts || {};
      var entry = { name: name, params: params || {} };
      var d = def(name);
      if (d.tab) { stack = [entry]; currentTab = d.tab; }
      else if (opts.replace && stack.length) { stack[stack.length - 1] = entry; }
      else stack.push(entry);

      pushHistory();
      updateChrome();   // before painting, so world views measure the floating HUD
      if (opts.render !== false && d.fn) d.fn(entry.params);
    },

    /** Reset to a tab root. */
    setTab: function (tabId) {
      if (Kido.Scene && Kido.Scene.teardown) Kido.Scene.teardown();
      if (Kido.VideoManager) Kido.VideoManager.releaseAll({ preloads: true });
      if (Kido.StoryEngine) Kido.StoryEngine.stop();
      leaveAudio();
      var t = TABS.find(function (x) { return x.id === tabId; }) || TABS[0];
      currentTab = t.id;
      stack = [{ name: t.id, params: {} }];
      pushHistory();
      updateChrome();
      t.render();
    },

    back: function () {
      if (Kido.Scene && Kido.Scene.teardown) Kido.Scene.teardown();
      if (Kido.VideoManager) Kido.VideoManager.releaseAll();
      if (Kido.StoryEngine) Kido.StoryEngine.stop();
      leaveAudio();
      if (stack.length <= 1) { this.setTab("home"); return; }
      stack.pop();
      var e = top(), d = def(e.name);
      if (d.tab) currentTab = d.tab;
      if (!d.fn) { this.setTab(currentTab); return; }   // safety: shouldn't normally happen
      updateChrome();
      d.fn(e.params);                  // repaint destination (play/result have none)
    },

    current: function () { return top(); }
  };

  /* ---- chrome ---- */
  function updateChrome() {
    var e = top(); if (!e) return;
    var d = def(e.name);
    var topbar = document.getElementById("topbar");
    var tabbar = document.getElementById("tabbar");

    // "result" too: scene and lesson results then match game results (compact HUD, Momo docked top-right
    // instead of a big Momo whose bubble covered the stars)
    var isGame = (e.name === "play" || e.name === "scene" || e.name === "result");
    document.body.classList.toggle("in-gameplay", isGame);
    document.body.classList.toggle("is-worldview", !!d.world);
    if (!d.world && Kido.world) Kido.world.stop();
    // the map has its own Momo: a floating game Momo still talking from the last activity left two on screen (QA 2026-11-11)
    if (d.world && Kido.mascot && Kido.mascot.hide) Kido.mascot.hide();

    // Android app: launch splash is portrait; once past splash (age picker & beyond), lock to landscape.
    lockLandscape();
    if (d.chrome === "none") { topbar.hidden = true; tabbar.hidden = true; return; }
    topbar.hidden = false;
    topbar.classList.toggle("can-back", stack.length > 1);
    tabbar.hidden = !!d.hideTab;
    renderTabbar();
    Kido.screens.refreshTopbar();
  }

  function renderTabbar() {
    var el = document.getElementById("tabbar");
    if (el.childElementCount) { // already built; just update active state
      Array.prototype.forEach.call(el.children, function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-tab") === currentTab);
      });
      return;
    }
    TABS.forEach(function (t) {
      var b = document.createElement("button");
      b.className = "tab" + (t.id === currentTab ? " is-active" : "");
      b.setAttribute("data-tab", t.id);
      b.innerHTML = '<span class="tab__icon">' + (Kido.icons[t.id] ? Kido.icons[t.id]() : "") + '</span><span>' + t.label + '</span>';
      b.addEventListener("click", function () { Kido.audio.playTapSound(); nav.setTab(t.id); });
      el.appendChild(b);
    });
  }

  /* ---- top bar buttons ---- */
  document.addEventListener("DOMContentLoaded", function () {
    var back = document.getElementById("btn-back");
    if (back) back.addEventListener("click", function () { Kido.audio.playTapSound(); nav.back(); });
    var parent = document.getElementById("btn-parent");
    if (parent) parent.addEventListener("click", function () { Kido.parent.openGate(); });
    var avatar = document.getElementById("avatar-btn");
    if (avatar) avatar.addEventListener("click", function () { Kido.mascot.say("Hi! I'm Momo, your guide!"); });
    var stars = document.getElementById("btn-stars");
    if (stars) stars.addEventListener("click", function () { Kido.audio.playTapSound(); nav.setTab("rewards"); });
  });

  /* ---- Orientation (Android app only; KidoOrientationPlugin) ---- */
  function orientationPlugin() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.KidoOrientation; }
  // 2026-11-10 (owner): the Rewards screen turns portrait; every other screen stays landscape
  function lockLandscape() {
    var op = orientationPlugin(), e = top();
    if (op) op.set({ orientation: e && e.name === "rewards" ? "portrait" : "landscape" }).catch(function () {});
  }
  // Change #28: back from the background (or another app) re-asserts the lock and re-measures the system
  // bars, once the child is past the portrait splash (a screen has been shown).
  document.addEventListener("visibilitychange", function () {
    if (document.hidden || !stack.length) return;
    lockLandscape();
    var op = orientationPlugin();
    if (op && op.insets) op.insets().catch(function () {});
  });
  (function () { var op = orientationPlugin(); if (op && op.insets) op.insets().catch(function () {}); })();

  /* ---- Back: Android system Back, browser Back and every in-app Back share one path ---- */
  function pushHistory() {
    try { window.history.pushState({ k: stack.length }, ""); } catch (e) {}
  }
  function handleBack() {
    // Today's Adventure card open: Back just closes it (the child stays where they were).
    if (Kido.adventure && Kido.adventure.isOpen && Kido.adventure.isOpen()) { Kido.adventure.close(); return; }
    // Parent Zone / gate open: a section steps back to its overview first, then it closes.
    if (Kido.parent && Kido.parent.isOpen && Kido.parent.isOpen()) {
      if (!(Kido.parent.back && Kido.parent.back())) Kido.parent.close();
      return;
    }
    var e = top();
    if (e && (e.name === "age" || e.name === "home")) { exitApp(); return; }   // the first screen: Back closes the app
    if (stack.length > 1) nav.back();
    else nav.setTab("home");
  }
  function exitApp() {                             // Android app only; a browser tab just stays put
    var App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (App && App.exitApp) { try { var p = App.exitApp(); if (p && p.catch) p.catch(function () {}); } catch (err) {} }
  }
  nav.handleBack = handleBack;
  window.addEventListener("popstate", function () { handleBack(); pushHistory(); });
  // Change #28: in the Android app, system Back is handled here directly (Capacitor App plugin) instead of
  // by WebView history (goBack -> popstate), so it behaves exactly like the in-app Back on every screen.
  (function () {
    var App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (App && App.addListener) {
      try { var p = App.addListener("backButton", function () { handleBack(); }); if (p && p.catch) p.catch(function () {}); }
      catch (err) {}
    }
  })();

  /* ---- URL hash router for direct links & activities ---- */
  function routeHash() {
    var h = (window.location.hash || "").replace(/^#/, "");
    if (!h) return false;
    var parts = h.split("/");
    var action = parts[0];
    var param = parts[1];

    if (action === "tab") {
      nav.setTab(param || "home");
      return true;
    }
    if (action === "play" || action === "activity" || action === "game") {
      if (param && Kido.screens && Kido.screens.play) {
        Kido.screens.play(param);
        return true;
      }
    }
    if (action === "region") {
      nav.go("region", { id: param });
      return true;
    }
    if (action === "world" && Kido.world) {
      nav.setTab("home");
      if (Kido.world.isOpen(param)) Kido.world.enter(param, { quiet: true });
      return true;
    }
    return false;
  }

  window.addEventListener("hashchange", routeHash);
  nav.routeHash = routeHash;
})(window);
