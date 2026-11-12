/* =========================================================================
   music.js — Soothing background music (procedural, no audio files)
   Change #28: rewritten from upbeat 8-second loops to calm, generative music:
   - Slow chord progressions on soft pads and a round bass, a sparse kalimba /
     music-box / glass melody that wanders a pentatonic scale (never the same
     loop twice), no drums, and a gentle generated room reverb.
   - Plays on the AudioManager's MUSIC channel (shared AudioContext): the
     parent's Music volume applies, and the mixer dips it under voice, rewards
     and video so speech stays clear.
   - Mood changes crossfade; leaving a screen only stops the music if the next
     screen doesn't want the same mood. Nothing starts before the first tap.
   - Moods (60-84 BPM): playful, adventure, safari, garden, space, story, puzzle,
     plus a one-shot soft "victory" chime.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var ctx = null;
  var musicFilter = null;
  var outNode = null;          // the player gain the scheduler is currently writing into
  var players = [];            // one per mood; several only while crossfading
  var timerId = null;
  var wantedMood = null;       // what this screen asked for (resumes after unlock / unmute)
  var pendingStop = null;
  // Make-up gain: at the default Music level (0.55) the tracks sit exactly where
  // they did before the mixer existed; the parent can still go ~5 dB louder.
  var TRIM = 1.8;

  // MIDI semitone to frequency helper (60 = Middle C = 261.63Hz)
  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // One shared AudioContext (Kido.audio) — music no longer runs its own.
  // Chain per mood: player gain -> warm low-pass -> mixer MUSIC channel.
  function getAudioContext() {
    var c = Kido.audio && Kido.audio.rawCtx ? Kido.audio.rawCtx() : null;   // null before the first gesture
    if (!c) return null;
    if (ctx !== c || !musicFilter) {
      ctx = c;
      musicFilter = ctx.createBiquadFilter();       // warm analog low-pass: no harsh highs
      musicFilter.type = "lowpass";
      musicFilter.frequency.value = 3000;
      musicFilter.Q.value = 0.5;
      var bus = Kido.AudioManager && Kido.AudioManager.bus ? Kido.AudioManager.bus("music") : null;
      var dest = bus || ctx.destination;
      musicFilter.connect(dest);                    // dry
      var verb = ctx.createConvolver(), wet = ctx.createGain();   // + a soft room around it
      verb.buffer = makeImpulse(ctx, 2.4); wet.gain.value = 0.32;
      musicFilter.connect(verb); verb.connect(wet); wet.connect(dest);
      players = [];
    }
    return ctx;
  }

  function isEnabled() {
    var s = (Kido.progress && Kido.progress.settings()) || {};
    return s.music !== false && s.sound !== false;
  }

  /* ---------------- Soft instruments ----------------
     Change #28: the old 8-second loops (marimba + walking bass + kick/tick/woodblock at 88-126 BPM)
     repeated identically forever and felt busy. Every voice here is rounded instead: slow swells,
     long gentle releases, no drums, and a soft room reverb on the music channel. */

  // Pad: each chord note is a sine plus a slightly detuned triangle, swelling in and out slowly.
  function playPad(notes, time, dur, vol) {
    if (!ctx || !notes || !notes.length) return;
    var t = Math.max(time, ctx.currentTime);
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 1400; lp.Q.value = 0.3;
    lp.connect(outNode);
    var att = dur * 0.35, rel = dur * 0.45, v = (vol || 0.05) / notes.length;
    notes.forEach(function (m) {
      [[-5, "sine", 1], [6, "triangle", 0.45]].forEach(function (layer) {
        var o = ctx.createOscillator(), g = ctx.createGain(), peak = v * layer[2];
        o.type = layer[1];
        o.frequency.setValueAtTime(midiToFreq(m), t);
        o.detune.setValueAtTime(layer[0], t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(peak, t + att);
        g.gain.setValueAtTime(peak, t + dur - rel);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(lp);
        o.start(t); o.stop(t + dur + 0.05);
      });
    });
  }

  // Bell: a plucked tone that rings out. "kalimba" (warm thumb piano), "musicbox", "glass" (airy).
  var BELLS = {
    kalimba:  [[1, 1], [3.9, 0.10]],
    musicbox: [[1, 1], [2, 0.28], [4.2, 0.05]],
    glass:    [[1, 1], [2, 0.22], [3, 0.07]]
  };
  function playBell(freq, time, vol, ring, kind) {
    if (!ctx || !freq) return;
    var t = Math.max(time, ctx.currentTime), r = ring || 1.8;
    (BELLS[kind] || BELLS.musicbox).forEach(function (part, i) {
      var o = ctx.createOscillator(), g = ctx.createGain(), v = (vol || 0.08) * part[1], end = t + r / (1 + i * 1.5);
      o.type = "sine";
      o.frequency.setValueAtTime(freq * part[0], t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + (i ? 0.004 : 0.012));
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      o.connect(g); g.connect(outNode);
      o.start(t); o.stop(end + 0.05);
    });
  }

  // Bass: a round sine that fades in and holds under the chord (no bouncy pizzicato).
  function playSoftBass(freq, time, dur, vol) {
    if (!ctx || !freq) return;
    var t = Math.max(time, ctx.currentTime), v = vol || 0.08;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + Math.min(0.25, dur * 0.2));
    g.gain.setValueAtTime(v, t + dur * 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(outNode);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // A short room reverb, generated (no file): decaying stereo noise.
  function makeImpulse(c, seconds) {
    var len = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  /* ---------------- Soothing tracks ----------------
     Generative: a slow chord progression with pads and bass, and a sparse melody that wanders a
     pentatonic scale (it never clashes) so it is never the same loop twice. Steps are eighth notes,
     a bar is 8 steps. prog/bass: one chord per `bars` bars. density: chance of a melody note on a beat.
     Moods keep their names (screens ask for them), each with its own key, pace and colour. */
  var TRACKS = {
    // Quizzes, counting, shapes — warm kalimba in C major
    playful:   { bpm: 76, bars: 1, vol: 0.10, bell: "kalimba", ring: 1.5, density: 0.42,
                 prog: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 64]],
                 bass: [48, 45, 41, 43], scale: [72, 74, 76, 79, 81, 84, 86] },
    // Word Run, vehicles, runners — a little more movement (soft pulse), still gentle
    adventure: { bpm: 84, bars: 1, vol: 0.10, bell: "kalimba", ring: 1.3, density: 0.5, pulse: true,
                 prog: [[53, 57, 60, 64], [50, 53, 57, 60], [50, 53, 58, 62], [52, 55, 60, 64]],
                 bass: [41, 38, 46, 48], scale: [72, 74, 77, 79, 81, 84, 86] },
    // Animals, birds — G major kalimba
    safari:    { bpm: 72, bars: 1, vol: 0.10, bell: "kalimba", ring: 1.6, density: 0.4,
                 prog: [[55, 59, 62, 66], [52, 55, 59, 62], [52, 55, 60, 64], [50, 54, 57, 62]],
                 bass: [43, 40, 48, 38], scale: [67, 69, 71, 74, 76, 79, 81, 83] },
    // Flowers, nature, bath, bedtime — D major music box, unhurried
    garden:    { bpm: 66, bars: 2, vol: 0.09, bell: "musicbox", ring: 2.0, density: 0.32,
                 prog: [[57, 62, 66, 69], [54, 57, 62, 66], [55, 59, 62, 66], [57, 61, 64, 66]],
                 bass: [38, 35, 43, 45], scale: [74, 76, 78, 81, 83, 86, 88] },
    // Rockets, gadgets, electronics — floating E major glass bells
    space:     { bpm: 60, bars: 2, vol: 0.09, bell: "glass", ring: 2.6, density: 0.3,
                 prog: [[52, 56, 59, 63], [54, 57, 61, 64], [57, 61, 64, 68], [52, 56, 59, 63]],
                 bass: [40, 42, 45, 40], scale: [76, 78, 80, 83, 85, 88] },
    // Interactive stories — the quietest: sparse music box far under the narration
    story:     { bpm: 60, bars: 2, vol: 0.07, bell: "musicbox", ring: 2.2, density: 0.2,
                 prog: [[53, 57, 60, 64], [50, 53, 57, 60], [53, 58, 62, 65], [55, 60, 62, 67]],
                 bass: [41, 38, 46, 48], scale: [72, 74, 77, 79, 81, 84] },
    // Thinking time — A minor glass, room to think
    puzzle:    { bpm: 68, bars: 1, vol: 0.08, bell: "glass", ring: 2.0, density: 0.28,
                 prog: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 60, 64, 67], [55, 59, 62, 64]],
                 bass: [45, 41, 48, 43], scale: [69, 72, 74, 76, 79, 81] },
    // Finishing with stars — a short, soft rising chime over one warm chord (plays once)
    victory:   { bpm: 96, vol: 0.12, bell: "musicbox", ring: 2.2, isOneShot: true,
                 pad: [60, 64, 67, 72], oneShot: [72, 0, 76, 0, 79, 0, 84, 0, 0, 0, 88, 0], totalSteps: 12 }
  };

  // Backwards compatibility mappings for older mood names
  var ALIAS = { morning: "playful", bath: "garden", orchard: "playful", jungle: "safari", runner: "adventure", drive: "adventure" };
  TRACKS.morning = TRACKS.playful;
  TRACKS.bath = TRACKS.garden;
  TRACKS.orchard = TRACKS.playful;
  TRACKS.jungle = TRACKS.safari;
  TRACKS.runner = TRACKS.adventure;
  TRACKS.drive = TRACKS.adventure;

  /* ---------------- Players, scheduler & crossfades ----------------
     Each mood plays through its own gain ("player"). Changing mood fades the
     old player out while the new one fades in — no abrupt cuts. */

  function calm() {
    return document.documentElement.classList.contains("reduce-motion") ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function stepDur(track) { return (60 / track.bpm) / 2; }   // eighth notes

  var MOVES = [-2, -1, -1, 0, 1, 1, 2];                       // melody steps: mostly neighbours, sometimes a skip
  function scheduleStep(p, s, time) {
    var tr = p.track, sd = stepDur(tr);
    outNode = p.gain;
    if (tr.oneShot) {
      if (s === 0) playPad(tr.pad, time, sd * tr.totalSteps + 1.6, tr.vol * 0.8);
      var n = tr.oneShot[s];
      if (n) playBell(midiToFreq(n), time, tr.vol, tr.ring, tr.bell);
      return;
    }
    var chordSteps = 8 * (tr.bars || 1), ci = Math.floor(s / chordSteps) % tr.prog.length;
    if (s % chordSteps === 0) {                                // a new chord: pad + bass swell in
      playPad(tr.prog[ci], time, sd * chordSteps * 1.25, tr.vol);
      playSoftBass(midiToFreq(tr.bass[ci]), time, sd * chordSteps * 1.1, tr.vol * 0.9);
    } else if (tr.pulse && s % 4 === 0) {                      // adventure: a soft heartbeat on beats 1 and 3
      playSoftBass(midiToFreq(tr.bass[ci] + 12), time, sd * 3, tr.vol * 0.35);
    }
    var pos = s % 8, bar = Math.floor(s / 8);
    // more notes on the beat than between; every 4th bar mostly breathes
    var chance = tr.density * (pos % 2 ? 0.35 : 1) * (bar % 4 === 3 ? 0.3 : 1);
    if (Math.random() < chance) {
      var sc = tr.scale;
      if (p.mi == null) p.mi = Math.floor(sc.length / 2);
      p.mi = Math.max(0, Math.min(sc.length - 1, p.mi + MOVES[Math.floor(Math.random() * MOVES.length)]));
      playBell(midiToFreq(sc[p.mi]), time, tr.vol * (pos === 0 ? 1 : 0.75), tr.ring, tr.bell);
    }
  }

  function active() {
    for (var i = players.length - 1; i >= 0; i--) if (players[i].stopAt == null) return players[i];
    return null;
  }

  function fadePlayer(p, ms) {
    if (!ctx || p.stopAt != null) return;
    var now = ctx.currentTime, sec = Math.max(0.05, (ms == null ? 400 : ms) / 1000);
    p.stopAt = now + sec;
    try {
      p.gain.gain.cancelScheduledValues(now);
      p.gain.gain.setValueAtTime(p.gain.gain.value, now);
      p.gain.gain.linearRampToValueAtTime(0.0001, now + sec);
    } catch (e) {}
  }

  function scheduler() {
    var c = ctx;
    if (!c) return;
    players.slice().forEach(function (p) {
      var sd = stepDur(p.track);
      while (p.next < c.currentTime + 0.25 && (p.stopAt == null || p.next < p.stopAt)) {
        scheduleStep(p, p.step, p.next);
        p.next += sd;
        p.step++;
        // One-shot tracks (victory fanfare) end after a single pass.
        if (p.track.isOneShot && p.step >= p.track.totalSteps) { p.stopAt = p.next + 0.3; break; }
      }
      if (p.stopAt != null && c.currentTime > p.stopAt + 2.2) {   // let the last notes ring out, then free it
        try { p.gain.disconnect(); } catch (e) {}
        players.splice(players.indexOf(p), 1);
        updateMusicButtonUI();
      }
    });
    if (!players.length && timerId) { clearInterval(timerId); timerId = null; }
  }

  /* ---------------- Public API ---------------- */

  var Music = Kido.Music = {
    /** Start a mood, crossfading from whatever is playing. opts.fade in ms. */
    play: function (mood, opts) {
      opts = opts || {};
      if (pendingStop) { clearTimeout(pendingStop); pendingStop = null; }
      mood = mood || "playful";
      if (!TRACKS[mood]) mood = "playful";
      mood = ALIAS[mood] || mood;                      // "jungle" IS "safari": carry on, don't restart
      var track = TRACKS[mood];
      wantedMood = track.isOneShot ? null : mood;      // a fanfare isn't something to "resume"
      if (!isEnabled()) return;
      var c = getAudioContext();
      if (!c) return;                                  // before the first tap: starts on unlock

      var cur = active();
      if (cur && cur.mood === mood) return;            // already playing — never restart
      var fade = opts.fade != null ? opts.fade : (calm() ? 400 : 900);
      if (cur) fadePlayer(cur, fade);

      var g = c.createGain();
      g.connect(musicFilter);
      var now = c.currentTime, target = (track.vol || 0.1) * TRIM;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(target, now + Math.max(0.05, fade / 1000));
      players.push({ mood: mood, track: track, gain: g, step: 0, next: now + 0.05, stopAt: null });

      if (!timerId) timerId = setInterval(scheduler, 50);
      scheduler();
      updateMusicButtonUI();
    },

    /** Fade out. keepWanted: remember the mood (used for Mute → Unmute). */
    stop: function (fadeMs, keepWanted) {
      if (pendingStop) { clearTimeout(pendingStop); pendingStop = null; }
      if (!keepWanted) wantedMood = null;
      players.forEach(function (p) { fadePlayer(p, fadeMs == null ? 400 : fadeMs); });
      updateMusicButtonUI();
    },

    /** Leaving a screen: stop shortly unless the next screen asks for the same
        mood straight away (then it simply carries on, no restart). */
    release: function (fadeMs) {
      if (pendingStop) clearTimeout(pendingStop);
      pendingStop = setTimeout(function () { pendingStop = null; Music.stop(fadeMs); }, 80);
    },

    /** Start (again) whatever this screen wanted — after unlock, unmute or Music on. */
    resumeWanted: function (fadeMs) {
      if (wantedMood && isEnabled() && !active()) Music.play(wantedMood, { fade: fadeMs });
    },

    crossfade: function (mood, ms) { Music.play(mood, { fade: ms }); },
    fadeIn: function (mood, ms) { Music.play(mood || wantedMood, { fade: ms == null ? 1200 : ms }); },
    fadeOut: function (ms) { Music.stop(ms == null ? 1200 : ms); },

    /** Legacy ducking — now handled centrally by the AudioManager mixer. */
    duck: function (level) { if (Kido.AudioManager) Kido.AudioManager.duck("music.legacy", { music: level == null ? 0.22 : level }); },
    unduck: function () { if (Kido.AudioManager) Kido.AudioManager.unduck("music.legacy"); },

    /** Toggle music on / off globally (the topbar note button) */
    toggle: function () {
      var s = (Kido.progress && Kido.progress.settings()) || {};
      if (s.sound === false) {                         // a grown-up turned ALL sound off — that wins
        if (Kido.fx && Kido.fx.toast) Kido.fx.toast("Sound is off in the grown-ups' settings");
        updateMusicButtonUI();
        return false;
      }
      var nowOn = s.music === false; // toggle
      if (Kido.progress && Kido.progress.setSetting) {
        Kido.progress.setSetting("music", nowOn);
      }
      if (!nowOn) {
        this.stop(250, true);
      } else {
        this.play(wantedMood || "playful");
      }
      updateMusicButtonUI();
      return nowOn;
    },

    isEnabled: isEnabled,
    isPlaying: function () { return !!active(); },
    currentMood: function () { var p = active(); return p ? p.mood : null; },
    moods: function () { return Object.keys(TRACKS); },
    refreshButton: function () { updateMusicButtonUI(); },
    debug: function () {
      var a = active();
      return { wanted: wantedMood, playing: a ? a.mood : null, timer: !!timerId,
        players: players.map(function (p) { return { mood: p.mood, fading: p.stopAt != null }; }) };
    }
  };

  function updateMusicButtonUI() {
    var on = isEnabled();                              // the switch, not "is a tune playing right now"
    Array.prototype.forEach.call(document.querySelectorAll(".js-music-toggle"), function (btn) {
      btn.innerHTML = Kido.icons ? (on ? Kido.icons.note() : Kido.icons.mute()) : (on ? "♪" : "×");
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-label", on ? "Mute music" : "Play music");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("title", on ? "Music: On" : "Music: Off");
    });
  }

  // Background music only: sound effects and narration have their own (grown-ups') switch.
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest(".js-music-toggle");
    if (!btn) return;
    Kido.audio.playTapSound && Kido.audio.playTapSound();
    Music.toggle();
  });
  document.addEventListener("DOMContentLoaded", updateMusicButtonUI);

})(window);
