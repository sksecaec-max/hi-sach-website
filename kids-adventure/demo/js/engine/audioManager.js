/* =========================================================================
   audioManager.js — Kido's ONE central audio controller.

     Game / Scene / Story / Puzzle / World
           │  Kido.AudioManager.play("puzzle.correct")      (named cue)
           │  Kido.AudioManager.ambience("jungle")           (looping bed)
           │  Kido.AudioManager.playAnimal("lion")           (species call)
           ▼
     registry (js/data/audioRegistry.js + audio-manifest.json for species)
           ▼
     file (lazy-loaded, cached) ── or ──► original synth recipe (audio.js)
           ▼
     mixer:  music ─┐
             sfx   ─┼─► master ─► soft limiter ─► speakers
             voice ─┤      (device speech follows the voice level too)
             ambience┘

   • Channels with independent, persisted volumes + Mute all.
   • A small priority ladder: UI < gameplay < voice/reward. Low sounds give
     way; music and ambience dip ("duck") under voice, rewards and video.
   • Lazy: nothing is fetched at launch; files load on first use or when an
     activity asks for preload(); release() frees what isn't playing.
   • Mobile-safe: no sound before the first gesture; wanted music/ambience
     start on that gesture; everything sleeps while the app is hidden.
   • A missing file never breaks anything: one console warning, then the
     synth (or silence + the visual feedback that is always there).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var MANIFEST_URL = "assets/audio/audio-manifest.json?v=14";
  var CHANNELS = ["music", "sfx", "voice", "ambience"];
  var ALL = ["master"].concat(CHANNELS);

  function A() { return Kido.audio; }
  function R() { return Kido.audioRegistry || { cues: {}, ambience: {}, channels: {}, priorities: {}, ducking: {}, voices: {}, voice: {}, worlds: {} }; }
  function settings() { return (Kido.progress && Kido.progress.settings()) || {}; }
  function enabled() { return settings().sound !== false; }
  function noop() {}

  var warned = {};
  function warnOnce(key, msg) {
    if (warned[key]) return;
    warned[key] = true;
    if (window.console && console.warn) console.warn("[Kido audio] " + msg);
  }

  /* ---------------- events (captions, voice start/end, cues, volume) ---------------- */
  var handlers = {};
  function on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); return function () { off(evt, fn); }; }
  function off(evt, fn) { var a = handlers[evt]; if (a) { var i = a.indexOf(fn); if (i > -1) a.splice(i, 1); } }
  function emit(evt, data) { (handlers[evt] || []).slice().forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); }

  /* ---------------- species manifest (fetched once; JSON, not audio) ---------------- */
  var manifest = null;
  var basePath = (Kido.audioRegistry && Kido.audioRegistry.basePath) || "assets/audio/";
  var speciesBase = "assets/audio/";
  var readyP = null;
  function loadManifest() {
    if (readyP) return readyP;
    if (!window.fetch) { manifest = { animals: {}, birds: {} }; readyP = Promise.resolve(manifest); return readyP; }
    readyP = fetch(MANIFEST_URL)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        manifest = j || { animals: {}, birds: {} };
        if (manifest.basePath) speciesBase = manifest.basePath;
        return manifest;
      })
      .catch(function () {
        warnOnce("manifest", "Species manifest unavailable (offline or file://) — animals use the built-in synth.");
        manifest = { animals: {}, birds: {} }; return manifest;
      });
    return readyP;
  }
  function entryFor(kind, key) {
    if (!manifest || !key) return null;
    var group = manifest[kind];
    if (group && group[key]) return group[key];
    var alt = kind === "birds" ? "animals" : "birds";
    return (manifest[alt] && manifest[alt][key]) || null;
  }
  function join(base, s) {
    if (!s) return null;
    if (/^(https?:)?\/\//.test(s) || s.charAt(0) === "/" || s.indexOf("assets/") === 0) return s;
    return base + s;
  }
  var lastVariant = {};
  /** A file path from {sound} or {variants:[…]} (random, never the same twice running). */
  function pickPath(e, key) {
    if (e.variants && e.variants.length) {
      var opts = e.variants.filter(function (v) { return v !== lastVariant[key]; });
      var v = (opts.length ? opts : e.variants)[(Math.random() * (opts.length || e.variants.length)) | 0];
      lastVariant[key] = v;
      return v;
    }
    return e.sound;
  }
  // A URL only when a real, confirmed file exists (available:true) and hasn't failed.
  // peek: just ask "is there one?" without using up the random variant pick.
  function fileReady(kind, key, peek) {
    var e = entryFor(kind, key);
    if (!e || e.available !== true || !(e.sound || e.variants)) return null;
    if (peek) {
      var all = (e.variants && e.variants.length ? e.variants : [e.sound]).map(function (p) { return join(speciesBase, p); });
      return all.filter(function (u) { return !missing[u]; })[0] || null;
    }
    var u = join(speciesBase, pickPath(e, kind + ":" + key));
    return (u && !missing[u]) ? u : null;
  }
  function allFiles(kind, key) {
    var e = entryFor(kind, key);
    if (!e || e.available !== true) return [];
    return (e.variants && e.variants.length ? e.variants : [e.sound]).filter(Boolean).map(function (p) { return join(speciesBase, p); });
  }

  /* ---------------- context + mixer ---------------- */
  var mix = null;
  function rawCtx() { return A() && A().rawCtx ? A().rawCtx() : null; }
  function mixer() {
    var c = rawCtx(); if (!c) return null;
    if (mix && mix.c === c) return mix;
    try {
      var m = { c: c, ch: {} };
      m.lim = c.createDynamicsCompressor();             // soft safety limiter: nothing can blast
      m.lim.threshold.value = -8; m.lim.knee.value = 6; m.lim.ratio.value = 6;
      m.lim.attack.value = 0.004; m.lim.release.value = 0.25;
      m.master = c.createGain();
      m.master.connect(m.lim); m.lim.connect(c.destination);
      CHANNELS.forEach(function (name) {
        var level = c.createGain(), duck = c.createGain();
        level.connect(duck); duck.connect(m.master);
        m.ch[name] = { level: level, duck: duck };
      });
      mix = m;
      applyLevels(true);
      applyDuck(true);
      return m;
    } catch (e) { return null; }
  }
  function bus(name) { var m = mixer(); return m && m.ch[name] ? m.ch[name].level : (m ? m.master : null); }
  function ramp(param, v, sec) {
    try {
      var t = mix.c.currentTime;
      param.cancelScheduledValues(t);
      param.setValueAtTime(param.value, t);
      param.linearRampToValueAtTime(v, t + (sec || 0.12));
    } catch (e) { try { param.value = v; } catch (e2) {} }
  }

  /* ---------------- volumes (persisted in settings.volumes) ---------------- */
  function clamp01(v) { v = +v; return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }
  function volumes() {
    var s = settings().volumes || {}, ch = R().channels || {}, out = {};
    ALL.forEach(function (k) { var d = ch[k] && ch[k].def != null ? ch[k].def : 1; out[k] = s[k] == null ? d : clamp01(s[k]); });
    return out;
  }
  /** Effective 0..1 loudness of a channel (master × channel, 0 when muted). */
  function level(ch) {
    if (!enabled()) return 0;
    var v = volumes();
    return ch === "master" || !ch ? v.master : v.master * (v[ch] == null ? 1 : v[ch]);
  }
  function applyLevels(instant) {
    if (!mix) return;
    var v = volumes(), s = instant ? 0.01 : 0.15;
    ramp(mix.master.gain, enabled() ? v.master : 0, s);
    CHANNELS.forEach(function (k) { ramp(mix.ch[k].level.gain, v[k], s); });
  }

  /* ---------------- ducking (music / ambience dip under important sounds) ---------------- */
  var duckers = {};
  function applyDuck(instant) {
    if (!mix) return;
    var d = { music: 1, sfx: 1, voice: 1, ambience: 1 };
    Object.keys(duckers).forEach(function (n) {
      var x = duckers[n];
      if (x.music != null) d.music = Math.min(d.music, x.music);
      if (x.ambience != null) d.ambience = Math.min(d.ambience, x.ambience);
    });
    CHANNELS.forEach(function (k) { ramp(mix.ch[k].duck.gain, d[k], instant ? 0.01 : (d[k] < 1 ? 0.15 : 0.5)); });
  }
  function duck(name, levels, ms) {
    if (typeof levels === "string") levels = R().ducking[levels];
    levels = levels || R().ducking[name] || { music: 0.35, ambience: 0.5 };
    var prev = duckers[name];
    if (prev && prev.t) clearTimeout(prev.t);
    duckers[name] = { music: levels.music, ambience: levels.ambience };
    if (ms) duckers[name].t = setTimeout(function () { unduck(name); }, ms);
    if (mixer()) applyDuck();
  }
  function unduck(name) {
    var x = duckers[name]; if (!x) return;
    if (x.t) clearTimeout(x.t);
    delete duckers[name];
    applyDuck();
  }

  /* ---------------- priority gate ---------------- */
  var fg = { pri: -1, until: 0, id: null };   // what currently owns the foreground
  var lastCue = {};
  var recent = [];                              // last cues (debug / tests)
  function priOf(def) { var p = R().priorities || {}; var v = p[def.priority]; return v == null ? 1 : v; }
  /** 0 = skip, otherwise a loudness multiplier. */
  function gate(id, def) {
    var now = Date.now(), pri = priOf(def);
    if (lastCue[id] && now - lastCue[id] < (def.minGap || 70)) return 0;   // accidental double-fire
    var g = 1, busy = now < fg.until;
    if (busy && pri < fg.pri) {
      if (def.optional || (pri <= 1 && fg.pri >= 3)) return 0;            // UI blips sit out a reward
      g = 0.5;                                                              // gameplay under a reward: softer
    }
    if (voiceActive() && pri <= 1) {
      if (def.optional) return 0;
      g *= 0.55;                                                            // UI under narration: softer
    }
    lastCue[id] = now;
    if (!busy || pri >= fg.pri) fg = { pri: pri, until: now + (def.hold || 220), id: id };
    return g;
  }

  /* ---------------- buffers: lazy load + cache + release ---------------- */
  var buffers = {}, loading = {}, missing = {}, used = {};
  function load(url) {
    if (!url) return Promise.resolve(null);
    if (buffers[url]) { used[url] = Date.now(); return Promise.resolve(buffers[url]); }
    if (loading[url]) return loading[url];
    if (missing[url]) return Promise.resolve(null);
    var c = rawCtx();
    if (!c || !window.fetch) return Promise.resolve(null);
    loading[url] = fetch(url)
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
      .then(function (buf) {
        return new Promise(function (resolve, reject) {
          try {
            var res = c.decodeAudioData(buf, resolve, reject);
            if (res && typeof res.then === "function") res.then(resolve, reject);
          } catch (e) { reject(e); }
        });
      })
      .then(function (b) { buffers[url] = b; used[url] = Date.now(); delete loading[url]; trim(); return b; })
      .catch(function (err) {
        delete loading[url];
        missing[url] = true;
        warnOnce("load:" + url, "Could not load " + url + " (" + (err && err.message || err) + ") — continuing with the fallback.");
        return null;
      });
    return loading[url];
  }
  function inUse(url) { return live.some(function (h) { return h.url === url; }) || (current && current.url === url); }
  // Keep decoded audio bounded (~3 min of sound): drop the least-recently used, never what's playing.
  function trim() {
    var total = 0, urls = Object.keys(buffers);
    urls.forEach(function (u) { total += buffers[u].duration || 0; });
    if (total <= 180) return;
    urls.sort(function (a, b) { return (used[a] || 0) - (used[b] || 0); }).some(function (u) {
      if (total <= 150) return true;
      if (!inUse(u)) { total -= buffers[u].duration || 0; delete buffers[u]; delete used[u]; }
      return false;
    });
  }
  function release(what) {
    var urls = Object.keys(buffers);
    if (Array.isArray(what)) urls = what.map(urlForId).filter(Boolean);
    var n = 0;
    urls.forEach(function (u) { if (buffers[u] && !inUse(u)) { delete buffers[u]; delete used[u]; n++; } });
    return n;
  }

  /* ---------------- playing a buffer on a channel (returns a handle) ---------------- */
  var live = [];
  function startBuffer(buf, channel, o) {
    var c = rawCtx(), m = mixer();
    if (!c || !m || !buf) return null;
    o = o || {};
    var src = c.createBufferSource(), g = c.createGain();
    var target = o.volume == null ? 1 : o.volume, t = c.currentTime;
    src.buffer = buf; src.loop = !!o.loop;
    if (o.fadeIn) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(Math.max(0.0001, target), t + o.fadeIn / 1000); }
    else g.gain.value = target;
    src.connect(g); g.connect((m.ch[channel] && m.ch[channel].level) || m.master);
    var h = {
      id: o.id || null, channel: channel, url: o.url || null, loop: !!o.loop, volume: target, ended: false,
      onend: o.onend || null,
      stop: function (ms) {
        if (h.ended) return;
        if (ms) { ramp(g.gain, 0.0001, ms / 1000); clearTimeout(h._t); h._t = setTimeout(kill, ms + 50); }
        else kill();
      },
      fade: function (to, ms) { ramp(g.gain, Math.max(0.0001, to), (ms || 300) / 1000); return h; }
    };
    h.done = new Promise(function (res) { h._done = res; });   // resolves when the sound has finished
    function kill() {
      if (h.ended) return;
      h.ended = true;
      h._done();
      clearTimeout(h._t);
      try { src.onended = null; src.stop(); } catch (e) {}
      try { src.disconnect(); g.disconnect(); } catch (e) {}
      var i = live.indexOf(h); if (i > -1) live.splice(i, 1);
      if (h.onend) { try { h.onend(); } catch (e) {} }
    }
    src.onended = kill;
    live.push(h);
    try { src.start(0); } catch (e) { kill(); return null; }
    return h;
  }

  /* ---------------- named cues ---------------- */
  function urlForId(id) {
    var r = R();
    var def = r.cues[id] || r.ambience[id] || r.voice[id];
    if (!def || def.available !== true) return null;
    var p = pickPath(def, id);
    return p ? join(basePath, p) : null;
  }
  function cue(id, o) {
    o = o || {};
    var def = R().cues[id];
    if (!def) { warnOnce("cue:" + id, "Unknown sound cue '" + id + "' — add it to js/data/audioRegistry.js."); return null; }
    if (!enabled() || !rawCtx()) return null;          // muted, or before the first gesture
    var g = gate(id, def);
    recent.push({ id: id, gain: g, at: Date.now() }); if (recent.length > 40) recent.shift();
    if (!g) return null;
    var vol = (def.volume == null ? 1 : def.volume) * g * (o.volume == null ? 1 : o.volume);
    var url = def.available === true ? urlForId(id) : null, h = null;
    if (url && buffers[url]) {
      used[url] = Date.now();
      h = startBuffer(buffers[url], def.channel || "sfx", { volume: vol, id: id, url: url });
      if (h) h.endsAt = rawCtx().currentTime + buffers[url].duration;
    } else {
      if (url) load(url);                               // warm it; the synth answers this time
      var r = def.synth && A() && A().synth ? A().synth(def.synth, vol) : null;
      if (r && r.node) h = synthHandle(id, r);
      else if (!r && !url) warnOnce("nosrc:" + id, "Cue '" + id + "' has no file or synth recipe.");
    }
    if (def.duck) duck("cue:" + id, def.duck, def.hold || 800);
    emit("cue", { id: id, gain: g });
    return h || true;
  }

  /** A finished-able handle for a synth cue: endsAt (audio clock) + done (the last
      note's real "ended" event; if the app is backgrounded mid-cue, the clock-time
      fallback keeps a waiting sequence from hanging). */
  function synthHandle(id, r) {
    var c = rawCtx(), h = { id: id, channel: "sfx", endsAt: r.end, ended: false };
    h.done = new Promise(function (res) {
      function fin() { if (h.ended) return; h.ended = true; clearTimeout(t); res(); }
      var t = setTimeout(fin, Math.max(0, (r.end - (c ? c.currentTime : 0)) * 1000) + 250);
      try { r.node.addEventListener("ended", fin, { once: true }); } catch (e) { fin(); }
    });
    return h;
  }

  /* ---------------- species (animal / bird calls) — single "creature" slot ---------------- */
  var current = null, creatureAt = 0, creatureGeneration = 0;
  var creaturePromise=Promise.resolve(), creatureResolve=null;
  function stopCurrent() {
    creatureGeneration++;
    if(current){var h=current;current=null;h.stop();}
    if(creatureResolve){creatureResolve();creatureResolve=null;}
  }
  function playKind(kind,key,spoken) {
    if(muted||!key||!enabled()||!rawCtx())return false;
    var now=Date.now();if(now-creatureAt<90)return false;creatureAt=now;
    stopCurrent();var generation=creatureGeneration;
    creaturePromise=new Promise(function(resolve){creatureResolve=resolve;});
    var e=entryFor(kind,key),url=fileReady(kind,key);
    function finish(){
      if(generation!==creatureGeneration)return;
      current=null;
      if(creatureResolve){creatureResolve();creatureResolve=null;}
      if(spoken&&A()&&enabled())A().speak(spoken);
    }
    function fallback(){
      if(generation!==creatureGeneration)return;
      var sk=(e&&e.synthKey)||key;
      current=Kido.animalSynth&&Kido.animalSynth.has(sk)?Kido.animalSynth.play(sk):null;
      if(current&&current.done)current.done.then(finish);else finish();
    }
    function start(buf){
      if(generation!==creatureGeneration||!enabled())return;
      current=startBuffer(buf,'sfx',{volume:e&&e.volume!=null?e.volume:1,id:kind+':'+key,url:url});
      if(current)current.done.then(finish);else fallback();
    }
    if(url){if(buffers[url])start(buffers[url]);else load(url).then(function(buf){if(buf)start(buf);else fallback();});}
    else{if(!manifest)loadManifest();fallback();}
    return true;
  }

  /* ---------------- voice: activity, captions, recorded lines ---------------- */
  var voiceTokens = {}, voiceSeq = 0, transcript = [], voiceHandle = null;
  function voiceActive() { for (var k in voiceTokens) if (voiceTokens.hasOwnProperty(k)) return true; return false; }
  function voiceStart(text, meta) {
    meta = meta || {};
    var id = ++voiceSeq;
    // Safety net: some engines never fire onend — release the duck anyway.
    voiceTokens[id] = setTimeout(function () { voiceEnd(id); }, 4000 + String(text || "").length * 140);
    duck("voice");
    var cap = { text: String(text || ""), speaker: meta.speaker || null, kind: meta.kind || null, at: Date.now() };
    transcript.push(cap); if (transcript.length > 30) transcript.shift();
    emit("voice:start", cap);
    emit("caption", cap);
    return id;
  }
  function voiceEnd(id) {
    if (id == null || !voiceTokens.hasOwnProperty(id)) return;
    clearTimeout(voiceTokens[id]);
    delete voiceTokens[id];
    if (!voiceActive()) { unduck("voice"); emit("voice:end", {}); }
  }
  /** Play a recorded voice file on the voice channel. Resolves true when it played to the end. */
  /* 2026-11-10 (owner): narration was too fast for young children. Recorded lines play a little slower, by age,
     through a media element so the pitch stays natural (a slowed buffer source would drop the voice's pitch).
     Animal calls, vehicle sounds, music and effects are never slowed. */
  function narrationRate() {
    var band = (Kido.age && Kido.age.current && Kido.age.current()) || "", top = parseInt(String(band).split("-")[1], 10) || 6;
    return top <= 5 ? 0.88 : top <= 8 ? 0.93 : 0.97;
  }
  function playVoiceSlow(url, meta, rate) {
    return new Promise(function (resolve) {
      var c = rawCtx(), m = mixer(), a, node, g, done = false, tok = null;
      try {
        a = new Audio(url); a.preservesPitch = true; a.playbackRate = rate;
        node = c.createMediaElementSource(a); g = c.createGain();
        node.connect(g); g.connect((m.ch.voice && m.ch.voice.level) || m.master);
      } catch (e) { resolve(false); return; }
      function end(ok) {
        if (done) return; done = true;
        a.onended = a.onerror = null;
        try { a.pause(); node.disconnect(); g.disconnect(); } catch (e) {}
        if (voiceHandle === h) voiceHandle = null;
        if (tok != null) voiceEnd(tok);
        resolve(ok);
      }
      var h = { stop: function (ms) { if (ms) { ramp(g.gain, 0.0001, ms / 1000); setTimeout(function () { end(true); }, ms + 50); } else end(true); } };
      a.onended = function () { end(true); };
      a.onerror = function () { end(false); };
      stopVoice();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      tok = voiceStart(meta.text || "", meta);
      voiceHandle = h;
      var pl = a.play(); if (pl && pl.catch) pl.catch(function () { end(false); });
    });
  }
  function playVoice(url, meta) {
    meta = meta || {};
    if (!enabled() || level("voice") <= 0 || !rawCtx()) return Promise.resolve(false);
    var rate = narrationRate();
    if (rate < 0.995 && window.Audio && mixer()) return playVoiceSlow(url, meta, rate).then(function (ok) { return ok ? true : playVoiceBuffer(url, meta); });
    return playVoiceBuffer(url, meta);
  }
  function playVoiceBuffer(url, meta) {
    return load(url).then(function (buf) {
      if (!buf) return false;
      stopVoice();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      return new Promise(function (resolve) {
        var tok = voiceStart(meta.text || "", meta);
        voiceHandle = startBuffer(buf, "voice", { id: "voice", url: url, onend: function () { voiceEnd(tok); resolve(true); } });
        if (!voiceHandle) { voiceEnd(tok); resolve(false); }
      });
    });
  }
  // a 30 ms fade: a line cut mid-word otherwise ends with a click on phone speakers
  function stopVoice() { if (voiceHandle) { var h = voiceHandle; voiceHandle = null; h.stop(30); } }

  /* ---------------- ambience (one looping bed at a time, crossfaded) ---------------- */
  var amb = { id: null, h: null, wanted: null, loadingId: null, pendingStop: null };
  function stopAmb(fade) {
    var h = amb.h;
    amb.h = null; amb.id = null; amb.loadingId = null;
    if (h) h.stop(fade == null ? 900 : fade);
  }
  function ambience(id, o) {
    o = o || {};
    if (amb.pendingStop) { clearTimeout(amb.pendingStop); amb.pendingStop = null; }
    amb.wanted = id || null;
    var fade = o.fade == null ? (calm() ? 500 : 1600) : o.fade;
    if (!id) { stopAmb(fade); return null; }
    if (amb.id === id && (amb.h || amb.loadingId === id)) return amb.h;      // already there — no restart
    var def = R().ambience[id];
    if (!def) { warnOnce("amb:" + id, "Unknown ambience '" + id + "'."); stopAmb(fade); amb.wanted = id; return null; }
    if (def.available !== true) { stopAmb(fade); amb.wanted = id; return null; }   // declared, file not added yet
    if (!enabled() || !rawCtx() || level("ambience") <= 0) { stopAmb(fade); amb.wanted = id; return null; }
    var old = amb.h;
    amb.h = null; amb.id = id; amb.loadingId = id;
    if (old) old.stop(fade);                             // crossfade: old fades out as the new fades in
    var url = urlForId(id);
    load(url).then(function (buf) {
      if (amb.loadingId === id) amb.loadingId = null;
      if (!buf || amb.id !== id || amb.h || amb.wanted !== id) return;
      amb.h = startBuffer(buf, "ambience", { loop: true, volume: def.volume == null ? 1 : def.volume, fadeIn: fade, id: "ambience:" + id, url: url });
      // Free beds from other places (each is a few MB once decoded).
      Object.keys(R().ambience).forEach(function (k) { var u = urlForId(k); if (u && u !== url && buffers[u] && !inUse(u)) { delete buffers[u]; delete used[u]; } });
    });
    return null;
  }
  /** Screen is changing: stop the bed unless the next screen asks for it right away. */
  function releaseAmbience(ms) {
    if (amb.pendingStop) clearTimeout(amb.pendingStop);
    amb.pendingStop = setTimeout(function () { amb.pendingStop = null; amb.wanted = null; stopAmb(900); }, ms == null ? 80 : ms);
  }

  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ---------------- settings, mute, lifecycle ---------------- */
  var muted = false;                                     // legacy file-only mute (setMuted)
  function applySettings() {
    if (rawCtx()) { mixer(); applyLevels(); }
    if (!enabled()) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      stopVoice(); stopCurrent();
      live.slice().forEach(function (h) { if (h.channel !== "ambience") h.stop(150); });
      var w = amb.wanted; stopAmb(200); amb.wanted = w;
      if (Kido.Music && Kido.Music.stop) Kido.Music.stop(200, true);
    } else {
      if (amb.wanted && !amb.h && !amb.loadingId) ambience(amb.wanted, { fade: 800 });
      if (level("ambience") <= 0) { var w2 = amb.wanted; stopAmb(300); amb.wanted = w2; }
      if (Kido.Music && Kido.Music.resumeWanted) Kido.Music.resumeWanted();
    }
    if (Kido.VideoManager && Kido.VideoManager.syncAudio) Kido.VideoManager.syncAudio();
    emit("settings", { enabled: enabled(), volumes: volumes() });
  }
  function setSetting(k, v) { if (Kido.progress && Kido.progress.setSetting) Kido.progress.setSetting(k, v); }

  // Background tab / app: sleep the whole graph; wake on return (only after a gesture).
  document.addEventListener("visibilitychange", function () {
    var c = mix && mix.c; if (!c) return;
    if (document.hidden) { if (c.state === "running") c.suspend().catch(noop); }
    else if (A() && A().isUnlocked && A().isUnlocked() && c.state === "suspended") c.resume().catch(noop);
  });

  var api = Kido.AudioManager = {
    /* ---- the spec's core verbs ---- */
    /** play("puzzle.correct") → a cue. Legacy: play("animals"|"birds", key, spokenName). */
    play: function (id, o, spoken) {
      if ((id === "animals" || id === "birds") && typeof o === "string") return playKind(id, o, spoken);
      return cue(id, o);
    },
    cue: cue,
    /** pause()/resume() the whole soundscape (e.g. a parent overlay). */
    pause: function () { var c = mix && mix.c; if (c && c.state === "running") c.suspend().catch(noop); if (window.speechSynthesis) window.speechSynthesis.pause(); },
    resume: function () { var c = mix && mix.c; if (c && c.state === "suspended" && !document.hidden) c.resume().catch(noop); if (window.speechSynthesis) window.speechSynthesis.resume(); },
    /** stop(handle | "music" | "ambience" | "voice" | "sfx" | "all", fadeMs) */
    stop: function (what, ms) {
      if (what && what.stop) { what.stop(ms); return; }
      if (!what || what === "all" || what === "music") { if (Kido.Music) Kido.Music.stop(ms); }
      if (!what || what === "all" || what === "ambience") { amb.wanted = null; stopAmb(ms); }
      if (!what || what === "all" || what === "voice") { if (Kido.Voice && Kido.Voice.stop) Kido.Voice.stop(); else stopVoice(); }
      if (!what || what === "all" || what === "sfx") { stopCurrent(); live.slice().forEach(function (h) { if (h.channel === "sfx") h.stop(ms); }); }
    },
    fadeOut: function (what, ms) { api.stop(what, ms == null ? 600 : ms); },
    fadeIn: function (what, ms) {
      if (what && what.fade) { what.fade(what.volume, ms); return; }
      if (what === "music" && Kido.Music) Kido.Music.resumeWanted(ms);
      if (what === "ambience" && amb.wanted) ambience(amb.wanted, { fade: ms });
    },
    /** crossfade("music", "story", 1200) or crossfade("ambience", "ocean", 1500) */
    crossfade: function (channel, to, ms) {
      if (channel === "music" && Kido.Music) return Kido.Music.play(to, { fade: ms });
      if (channel === "ambience") return ambience(to, { fade: ms });
    },
    setVolume: function (ch, v) {
      if (typeof ch === "number") { v = ch; ch = "master"; }
      if (ALL.indexOf(ch) === -1) return api;
      var vols = {}, cur = settings().volumes || {};
      Object.keys(cur).forEach(function (k) { vols[k] = cur[k]; });
      vols[ch] = clamp01(v);
      setSetting("volumes", vols);
      if (rawCtx()) { mixer(); applyLevels(); }
      if ((ch === "ambience" || ch === "master") && amb.wanted && !amb.h && level("ambience") > 0) ambience(amb.wanted, { fade: 600 });
      if (ch === "ambience" && level("ambience") <= 0) { var w = amb.wanted; stopAmb(300); amb.wanted = w; }
      if ((ch === "voice" || ch === "master") && Kido.VideoManager && Kido.VideoManager.syncAudio) Kido.VideoManager.syncAudio();
      emit("volume", { channel: ch, value: vols[ch] });
      return api;
    },
    getVolume: function (ch) { return volumes()[ch || "master"]; },
    volumes: volumes,
    defaults: function () { var o = {}; ALL.forEach(function (k) { var d = R().channels[k]; o[k] = d && d.def != null ? d.def : 1; }); return o; },
    resetVolumes: function () { setSetting("volumes", {}); if (rawCtx()) applyLevels(); emit("volume", {}); return api; },
    level: level,
    mute: function () { setSetting("sound", false); applySettings(); emit("mute", true); return api; },
    unmute: function () { setSetting("sound", true); applySettings(); emit("mute", false); return api; },
    isMuted: function () { return !enabled(); },
    /** preload(["puzzle.correct", "jungle"]) — or legacy preload("animals", ["dog"]). */
    preload: function (a, keys) {
      if (typeof a === "string" && Array.isArray(keys)) {
        return loadManifest().then(function () { keys.forEach(function (k) { allFiles(a, k).forEach(function (u) { load(u); }); }); });
      }
      return Promise.all([].concat(a || []).map(function (id) { return load(urlForId(id)); }));
    },
    release: release,

    /* ---- ambience ---- */
    ambience: ambience,
    stopAmbience: function (ms) { amb.wanted = null; stopAmb(ms); },
    releaseAmbience: releaseAmbience,
    ambienceFor: function (worldId) { return (R().worlds || {})[worldId] || null; },

    /* ---- ducking / priority hooks for other engines ---- */
    duck: duck,
    unduck: unduck,
    voiceStart: voiceStart,
    voiceEnd: voiceEnd,
    voiceActive: voiceActive,
    playVoice: playVoice,
    narrationRate: narrationRate,
    stopVoice: stopVoice,
    transcript: function () { return transcript.slice(); },
    on: on,
    off: off,

    /* ---- plumbing used by audio.js / music.js ---- */
    bus: bus,
    applySettings: applySettings,
    hasCue: function (id) { return !!R().cues[id]; },
    _onUnlock: function () {
      if (!mixer()) return;
      applyLevels(true);
      if (amb.wanted && !amb.h) ambience(amb.wanted);
      if (Kido.Music && Kido.Music.resumeWanted) Kido.Music.resumeWanted();
      emit("unlock", {});
    },
    /** Snapshot for tests / debugging. */
    debug: function () {
      var c = mix && mix.c;
      return {
        unlocked: !!(A() && A().isUnlocked && A().isUnlocked()), ctxState: c ? c.state : "none",
        enabled: enabled(), volumes: volumes(),
        live: live.map(function (h) { return { id: h.id, channel: h.channel, loop: h.loop, url: h.url }; }),
        buffers: Object.keys(buffers).length, loading: Object.keys(loading).length,
        ambience: { id: amb.id, wanted: amb.wanted, playing: !!amb.h },
        voiceActive: voiceActive(), duckers: Object.keys(duckers),
        duck: mix ? { music: mix.ch.music.duck.gain.value, ambience: mix.ch.ambience.duck.gain.value } : null,
        music: Kido.Music && Kido.Music.debug ? Kido.Music.debug() : null,
        recent: recent.slice(-12)
      };
    },

    /* ---- species API (unchanged for existing games) ---- */
    ready: loadManifest,
    playAnimal: function (key, spoken) { return playKind("animals", key, spoken); },
    playBird: function (key, spoken) { return playKind("birds", key, spoken); },
    playVehicle: function (key, spoken) { return playKind("vehicles", key, spoken); },   // real recordings (manifest "vehicles")
    creatureDone: function(){return creaturePromise;},
    stopCurrent: stopCurrent,
    stopScene: stopCurrent,
    setMuted: function (m) { muted = !!m; if (muted) stopCurrent(); return api; },
    preloadAnimals: function (keys) { return api.preload("animals", keys); },
    preloadBirds: function (keys) { return api.preload("birds", keys); },
    register: function (kind, key, url) {
      return loadManifest().then(function () {
        if (!manifest[kind]) manifest[kind] = {};
        var e = manifest[kind][key] || (manifest[kind][key] = { name: key });
        e.sound = url; e.available = true;
        var u = join(speciesBase, url); if (u) { delete missing[u]; load(u); }
      });
    },
    has: function (kind, key) { return !!(entryFor(kind, key) || (Kido.animalSynth && Kido.animalSynth.has(key))); },
    available: function (kind, key) { return !!fileReady(kind, key, true); },
    manifest: function () { return manifest; }
  };

  // Only the small species JSON is fetched at boot — never the audio itself.
  loadManifest();
})(window);
