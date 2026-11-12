/* =========================================================================
   videoManager.js — Kido.VideoManager: the one place video playback lives
   Activities never touch <video> directly. They ask for a player, load a
   source and listen for events; this module owns loading/preload, play /
   pause / replay, mute + volume, captions, errors and timeouts, cleanup, and
   the small child-friendly control set (big play, progress, mute, replay).

     var p = Kido.VideoManager.create({ label, aspect: "16:9", captions, poster, skip });
     host.appendChild(p.el);
     p.on("ended", fn); p.on("error", fn);   // also: loading, ready, play, pause, progress, skip
     p.load("assets/videos/animals/x.mp4", { autoplay: true });
     ...
     p.destroy();                            // or Kido.VideoManager.releaseAll() on navigation

   Sound is never forced: players start muted when the parent has turned
   sound off, and the child's mute choice sticks for the session. Background
   music (Kido.Music) is ducked only while a video is audibly playing.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var LOAD_TIMEOUT_MS = 12000;
  var live = [];                 // players currently mounted
  var preloaded = null;          // { src, video } — at most one warmed-up clip
  var mutedPref = null;          // session choice; null = follow the Sound setting
  var seq = 0;                   // per-player id for the mixer's duck

  function soundSetting() { var s = Kido.progress && Kido.progress.settings(); return !s || s.sound !== false; }
  function startMuted() { return mutedPref == null ? !soundSetting() : mutedPref; }
  function icon(name) { return Kido.icons && Kido.icons[name] ? Kido.icons[name]() : ""; }
  function el(tag, attrs) { return Kido.util.el(tag, attrs); }
  function saveData() { var c = navigator.connection; return !!(c && c.saveData); }

  var SPEAKER_ON = '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 010 6M18 6.5a8 8 0 010 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var SPEAKER_OFF = '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var REPLAY = '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5a7 7 0 11-6.6 4.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M4 4v5.5h5.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var PAUSE = '<svg class="kido-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6.5" y="5.5" width="4" height="13" rx="1.5" fill="currentColor"/><rect x="13.5" y="5.5" width="4" height="13" rx="1.5" fill="currentColor"/></svg>';

  function makeVideo() {
    var v = document.createElement("video");
    v.setAttribute("playsinline", "");            // iOS / Android WebView: never jump to fullscreen
    v.setAttribute("webkit-playsinline", "");
    v.setAttribute("disablepictureinpicture", "");
    v.setAttribute("controlslist", "nodownload noplaybackrate noremoteplayback");
    v.disableRemotePlayback = true;
    v.preload = "metadata";
    return v;
  }
  function release(v) {
    if (!v) return;
    try { v.pause(); } catch (e) {}
    v.removeAttribute("src");
    Array.prototype.forEach.call(v.querySelectorAll("source,track"), function (n) { n.remove(); });
    try { v.load(); } catch (e) {}                // frees the decoder + buffered media
    if (v.parentNode) v.parentNode.removeChild(v);
  }

  function create(opts) {
    opts = opts || {};
    var handlers = {};
    var state = "idle", timer = null, ducked = false, destroyed = false, src = null;
    var video = null;

    var root = el("div", { class: "kv-player is-idle", role: "region", "aria-label": opts.label || "Video", tabindex: "0" });
    var ar = String(opts.aspect || "16:9").split(":");
    root.style.setProperty("--kv-ar", (+ar[0] || 16) + " / " + (+ar[1] || 9));
    var frame = el("div", { class: "kv-frame" });
    var poster = opts.poster ? el("img", { class: "kv-poster", src: opts.poster, alt: "" }) : null;
    var loading = el("div", { class: "kv-loading", "aria-hidden": "true", html: "<i></i><i></i><i></i>" });
    var bigPlay = el("button", { class: "kv-bigplay", type: "button", "aria-label": "Play video", html: icon("play") });
    var endCard = el("div", { class: "kv-end" });
    var replayBtn = el("button", { class: "kv-replay", type: "button", "aria-label": "Watch again", html: REPLAY + "<span>Again</span>" });
    endCard.appendChild(replayBtn);
    var bar = el("div", { class: "kv-bar" });
    var playBtn = el("button", { class: "kv-btn kv-btn--play", type: "button", "aria-label": "Pause video", html: PAUSE });
    var track = el("div", { class: "kv-track", role: "progressbar", "aria-label": "Video progress", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": "0" });
    var fill = el("i", { class: "kv-fill" });
    track.appendChild(fill);
    var muteBtn = el("button", { class: "kv-btn kv-btn--mute", type: "button" });
    var ccBtn = opts.captions ? el("button", { class: "kv-btn kv-btn--cc", type: "button", "aria-pressed": "true", "aria-label": "Captions", text: "CC" }) : null;
    bar.appendChild(playBtn); bar.appendChild(track); if (ccBtn) bar.appendChild(ccBtn); bar.appendChild(muteBtn);
    var skipBtn = opts.skip ? el("button", { class: "kv-skip", type: "button", "aria-label": "Skip video", html: "<span>Skip</span>" + icon("play") }) : null;

    if (poster) frame.appendChild(poster);
    frame.appendChild(loading); frame.appendChild(bigPlay); frame.appendChild(endCard); frame.appendChild(bar);
    if (skipBtn) frame.appendChild(skipBtn);
    root.appendChild(frame);

    function emit(name, a) { (handlers[name] || []).forEach(function (fn) { try { fn(a, api); } catch (e) { console.error(e); } }); }
    // Controls step out of the way while the clip plays; any touch / key / focus brings them back.
    var idleT = null;
    function wake() {
      root.classList.remove("is-idle");
      clearTimeout(idleT);
      idleT = setTimeout(function () { if (state === "playing") root.classList.add("is-idle"); }, 2500);
    }
    function setState(s) {
      state = s;
      var idle = root.classList.contains("is-idle") && s === "playing";
      root.className = "kv-player is-" + s + (isMuted() ? " is-muted" : "") + (idle ? " is-idle" : "");
      if (s === "playing") wake();
      playBtn.innerHTML = s === "playing" ? PAUSE : icon("play");
      playBtn.setAttribute("aria-label", s === "playing" ? "Pause video" : "Play video");
    }
    function isMuted() { return video ? video.muted : startMuted(); }
    function paintMute() {
      var m = isMuted();
      muteBtn.innerHTML = m ? SPEAKER_OFF : SPEAKER_ON;
      muteBtn.setAttribute("aria-label", m ? "Turn sound on" : "Turn sound off");
      muteBtn.setAttribute("aria-pressed", m ? "true" : "false");
      root.classList.toggle("is-muted", m);
    }
    // While a clip is audible, music and ambience dip right down (AudioManager mixer).
    var duckId = "video" + (++seq);
    function duck(on) {
      var AM = Kido.AudioManager;
      if (on && !ducked) { ducked = true; if (AM) AM.duck(duckId, "video"); else if (Kido.Music) Kido.Music.duck(0.08); }
      else if (!on && ducked) { ducked = false; if (AM) AM.unduck(duckId); else if (Kido.Music) Kido.Music.unduck(); }
    }
    function audible() { return state === "playing" && video && !video.muted && video.volume > 0; }
    function syncDuck() {
      duck(audible());
      if (audible() && window.speechSynthesis) window.speechSynthesis.cancel();   // never talk over the clip
    }
    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function fail(reason) {
      if (destroyed || state === "error") return;
      clearTimer(); duck(false);
      setState("error");
      emit("error", reason);
    }

    function attach(v) {
      video = v;
      v.className = "kv-video";
      v.muted = startMuted();
      // A clip's narration rides the VOICE channel level (master × voice).
      if (opts.volume != null) v.volume = opts.volume;
      else if (Kido.AudioManager && Kido.AudioManager.level) v.volume = Math.max(0, Math.min(1, Kido.AudioManager.level("voice")));
      frame.insertBefore(v, frame.firstChild);
      // Every handler is bound to THIS element and ignores events once it has been
      // released (release() → load() can still fire a last timeupdate/emptied).
      function on(type, fn) { v.addEventListener(type, function (e) { if (!destroyed && video === v) fn(e); }); }
      on("loadeddata", onReady);
      on("canplay", onReady);
      on("playing", function () { clearTimer(); setState("playing"); if (poster) poster.remove(); syncDuck(); emit("play"); });
      on("pause", function () { if (state !== "ended") { setState("paused"); syncDuck(); emit("pause"); } });
      on("waiting", function () { if (state === "playing") root.classList.add("is-buffering"); });
      on("timeupdate", function () {
        root.classList.remove("is-buffering");
        var d = v.duration || 0, t = v.currentTime || 0;
        var pct = d ? Math.min(100, t / d * 100) : 0;
        fill.style.width = pct + "%";
        track.setAttribute("aria-valuenow", String(Math.round(pct)));
        emit("progress", { time: t, duration: d });
      });
      on("ended", function () {
        setState("ended"); fill.style.width = "100%"; syncDuck();
        if (opts.endCue !== false && Kido.audio && Kido.audio.cue) Kido.audio.cue(opts.endCue || "video.end");   // discovery chime
        emit("ended");
      });
      on("volumechange", function () { paintMute(); syncDuck(); });
      on("error", function () {
        var code = v.error && v.error.code;
        fail(code === 4 ? "unsupported-or-missing" : code === 2 ? "network" : code === 3 ? "decode" : "error");
      });
      paintMute();
    }
    function onReady() {
      if (state !== "loading") return;
      clearTimer();
      setState("ready");
      emit("ready");
      if (api._autoplay) api.play();
    }

    var api = {
      el: root,
      get video() { return video; },
      state: function () { return state; },
      on: function (name, fn) { (handlers[name] = handlers[name] || []).push(fn); return api; },

      /** Load a source. opts.autoplay tries to start as soon as it can. */
      load: function (source, lo) {
        lo = lo || {};
        if (destroyed) return api;
        if (video) release(video);
        src = source; api._autoplay = !!lo.autoplay;
        setState("loading"); emit("loading");
        var v = (preloaded && preloaded.src === source) ? preloaded.video : makeVideo();
        if (preloaded && preloaded.src === source) preloaded = null;
        attach(v);
        if (opts.captions) {
          var t = document.createElement("track");
          t.kind = "captions"; t.src = opts.captions; t.srclang = opts.captionsLang || "en"; t.label = "Captions"; t.default = true;
          video.appendChild(t);
        }
        if (video.getAttribute("src") !== source) video.src = source;
        if (video.readyState >= 2) onReady();
        clearTimer();
        timer = setTimeout(function () { if (state === "loading") fail("timeout"); }, LOAD_TIMEOUT_MS);
        return api;
      },
      play: function () {
        if (!video || destroyed || state === "error") return Promise.resolve(false);
        var p = video.play();
        if (p && p.then) {
          return p.then(function () { return true; }, function (err) {
            // Autoplay with sound blocked: wait for the child's tap instead of failing.
            if (err && err.name === "NotAllowedError") { setState("paused"); return false; }
            fail("play-failed"); return false;
          });
        }
        return Promise.resolve(true);
      },
      pause: function () { if (video && !video.paused) video.pause(); },
      toggle: function () { if (state === "playing") api.pause(); else if (state === "ended") api.replay(); else api.play(); },
      replay: function () { if (!video) return; video.currentTime = 0; fill.style.width = "0%"; api.play(); emit("replay"); },
      setMuted: function (m) { mutedPref = !!m; if (video) video.muted = !!m; paintMute(); },
      toggleMute: function () { api.setMuted(!isMuted()); },
      isMuted: isMuted,
      setVolume: function (vol) { if (video) video.volume = Math.max(0, Math.min(1, vol)); },
      showCaptions: function (on) {
        if (!video || !video.textTracks || !video.textTracks[0]) return;
        video.textTracks[0].mode = on ? "showing" : "hidden";
        if (ccBtn) ccBtn.setAttribute("aria-pressed", on ? "true" : "false");
      },
      destroy: function () {
        if (destroyed) return;
        destroyed = true; clearTimer(); clearTimeout(idleT); duck(false);
        release(video); video = null;
        if (root.parentNode) root.parentNode.removeChild(root);
        live = live.filter(function (x) { return x !== api; });
        emit("destroy");
        handlers = {};
      }
    };

    bigPlay.addEventListener("click", function () { api.play(); });
    replayBtn.addEventListener("click", function () { api.replay(); });
    playBtn.addEventListener("click", function () { api.toggle(); });
    muteBtn.addEventListener("click", function () { api.toggleMute(); });
    if (ccBtn) ccBtn.addEventListener("click", function () { api.showCaptions(ccBtn.getAttribute("aria-pressed") !== "true"); });
    if (skipBtn) skipBtn.addEventListener("click", function () { api.pause(); emit("skip"); });
    ["pointerdown", "pointermove", "focusin", "keydown"].forEach(function (t) { root.addEventListener(t, wake, { passive: true }); });
    frame.addEventListener("click", function (e) {
      if (e.target === frame || e.target === video) api.toggle();   // tap the picture to pause / resume
    });
    root.addEventListener("keydown", function (e) {
      if (e.target !== root) return;
      if (e.key === " " || e.key === "Spacebar" || e.key === "Enter" || e.key === "k") { e.preventDefault(); api.toggle(); }
      else if (e.key === "m" || e.key === "M") { e.preventDefault(); api.toggleMute(); }
    });
    paintMute();
    live.push(api);
    return api;
  }

  /* Warm up one clip in the background (only when it's likely to be played next). */
  function preload(source) {
    if (!source || saveData()) return false;
    if (preloaded && preloaded.src === source) return true;
    if (preloaded) release(preloaded.video);
    var v = makeVideo();
    v.preload = "auto";
    v.muted = true;
    v.src = source;
    v.addEventListener("error", function () { if (preloaded && preloaded.video === v) { release(v); preloaded = null; } });
    preloaded = { src: source, video: v };
    return true;
  }

  // Leaving the screen, or the app going to the background, never leaves a clip playing.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) live.forEach(function (p) { p.pause(); });
  });

  Kido.VideoManager = {
    create: create,
    preload: preload,
    /** Destroy every mounted player (navigation calls this on each screen change). */
    releaseAll: function (opts) {
      live.slice().forEach(function (p) { p.destroy(); });
      if (opts && opts.preloads && preloaded) { release(preloaded.video); preloaded = null; }
    },
    isMuted: startMuted,
    /** Follow the mixer: Mute all silences clips; the voice level sets their loudness. */
    syncAudio: function () {
      var AM = Kido.AudioManager, lvl = AM && AM.level ? AM.level("voice") : 1;
      var pref = soundSetting() ? mutedPref : null;    // a mute-all isn't the child's own choice
      live.forEach(function (p) {
        if (!soundSetting()) p.setMuted(true);
        else if (pref == null) p.setMuted(false);
        if (p.setVolume) p.setVolume(lvl);
      });
      mutedPref = pref;                                // player.setMuted records a choice; undo that
    },
    /** true/false = the child's choice for this session; null = follow the Sound setting again. */
    setMuted: function (m) { mutedPref = m == null ? null : !!m; },
    canPlay: function (type) { return !!makeVideo().canPlayType(type || "video/mp4"); },
    _live: function () { return live.length; },
    _preloaded: function () { return preloaded ? preloaded.src : null; }
  };
})(window);
