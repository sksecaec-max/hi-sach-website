/* =========================================================================
   audio.js — Low-level sound layer (synth recipes + device speech)

     1) Sound effects  -> small ORIGINAL recipes synthesized with Web Audio
        (no files needed). Every public play*() call is a named cue from
        js/data/audioRegistry.js, played through Kido.AudioManager — so it
        lands on the SFX channel, obeys the priority rules and the parent's
        volumes, and is replaced by a real recording just by adding a file
        to the registry.
     2) Speech         -> speechSynthesis, on the VOICE channel: its volume
        follows the mixer, music/ambience dip under it, it is paced for the
        child's age, and every line raises a caption event.

   The single AudioContext lives here and is created on the FIRST user
   gesture (mobile autoplay rules) — nothing makes sound before that.
   Everything is muted instantly when the parent turns Sound OFF.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var ctx = null;                 // the one shared AudioContext
  var unlocked = false;           // true after the first pointer/key gesture
  var assets = {};                // id -> {src, buffer} for legacy registered files
  var voices = [];
  // Voice selection reads the current preference on each utterance.

  function settings() {
    return (Kido.progress && Kido.progress.settings()) || { sound: true, music: true };
  }
  function soundOn() { return settings().sound !== false; }
  function AM() { return Kido.AudioManager; }

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (C) { try { ctx = new C(); } catch (e) { ctx = null; } }
    }
    // Resume after a gesture; stay asleep while the app is in the background.
    if (ctx && ctx.state === "suspended" && unlocked && !document.hidden) {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  /* --- SFX bus: shared gain + gentle low-pass so blips sound warm, not harsh,
         feeding the mixer's SFX channel --- */
  var sfxBus = null;
  function bus() {
    var c = ac(); if (!c) return null;
    if (!sfxBus || sfxBus.context !== c) {
      sfxBus = c.createGain();
      sfxBus.gain.value = 0.9;
      var lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 5200; lp.Q.value = 0.4;
      sfxBus.connect(lp);
      lp.connect((AM() && AM().bus && AM().bus("sfx")) || c.destination);
    }
    return sfxBus;
  }

  var scale = 1;                  // per-cue loudness (priority gate / registry volume)
  var track = null;               // while a recipe runs: its last-ending node + audio-clock end time
  function scheduled(node, end) { if (track && end > track.end) { track.end = end; track.node = node; } }

  /* --- Tiny synth: an oscillator through a soft ADSR gain envelope --- */
  function note(freq, start, dur, type, vol, opts) {
    var c = ac(); if (!c) return;
    opts = opts || {};
    var out = bus() || c.destination;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    var t0 = c.currentTime + start;
    if (opts.glide) {                       // pitch slide for playful whoops / soft "oops"
      o.frequency.setValueAtTime(freq, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, opts.glide), t0 + dur);
    }
    var peak = Math.max(0.0002, (vol || 0.18) * scale);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.018);                             // quick soft attack
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.6), t0 + dur * 0.5); // decay to sustain
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);                             // gentle release
    o.connect(g); g.connect(out);
    o.start(t0); o.stop(t0 + dur + 0.03); scheduled(o, t0 + dur + 0.03);
    if (opts.shimmer) {                     // a soft octave above adds sparkle without harshness
      var o2 = c.createOscillator(), g2 = c.createGain();
      o2.type = "sine"; o2.frequency.value = freq * 2;
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.28), t0 + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.8);
      o2.connect(g2); g2.connect(out);
      o2.start(t0); o2.stop(t0 + dur + 0.03); scheduled(o2, t0 + dur + 0.03);
    }
  }

  function chord(freqs, start, dur, type, vol) {   // stacked notes = warm pad under a jingle
    (freqs || []).forEach(function (f, i) { note(f, start, dur, type || "sine", (vol || 0.12) * (i === 0 ? 1 : 0.7)); });
  }

  function playTune(seq) {          // seq: [ [freq, dur, type, vol], ... ]
    var t = 0;
    seq.forEach(function (n) { note(n[0], t, n[1], n[2] || "triangle", n[3], { shimmer: true }); t += n[1] * 0.82; });
  }

  /* --- Filtered-noise burst (whoosh / splash / rustle). f0→f1 sweeps the band. --- */
  var noiseBuf = null;
  function noise(start, dur, type, f0, f1, q, vol, am) {
    var c = ac(); if (!c) return;
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var t0 = c.currentTime + start;
    var src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var f = c.createBiquadFilter(); f.type = type || "bandpass"; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    var g = c.createGain(), peak = Math.max(0.0002, (vol || 0.08) * scale);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.06, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g);
    if (am) {                                // wing-flutter tremolo
      var lfo = c.createOscillator(), lg = c.createGain(), trem = c.createGain();
      lfo.frequency.value = am; lg.gain.value = 0.5; trem.gain.value = 0.5;
      lfo.connect(lg); lg.connect(trem.gain); g.connect(trem); trem.connect(bus() || c.destination);
      lfo.start(t0); lfo.stop(t0 + dur + 0.05);
    } else {
      g.connect(bus() || c.destination);
    }
    src.start(t0); src.stop(t0 + dur + 0.05); scheduled(src, t0 + dur + 0.05);
  }

  /* =====================================================================
     SYNTH RECIPES — original sounds, referenced by name from the registry.
     Short, soft, rounded; nothing harsh, nothing longer than ~1.2 s.
     ===================================================================== */
  var SYNTH = {
    tap:       function () { note(660, 0, .06, "triangle", .1, { shimmer: true }); },
    select:    function () { note(880, 0, .05, "sine", .09); note(1320, .03, .06, "sine", .05); },
    sparkle:   function () { [1046.5, 1318.5, 1567.98, 2093.0].forEach(function (f, i) { note(f, i * 0.045, 0.2, "sine", 0.06, { shimmer: true }); }); },
    correct:   function () { playTune([[523, .12], [659, .12], [784, .2]]); },            // C-E-G rising
    retry:     function () { note(392, 0, .2, "sine", .16, { glide: 300 }); },             // soft, non-punishing "boop"
    tone:      function () { note(660, 0, .1, "triangle", .12); },
    celebrate: function () {
      playTune([[523, .12], [659, .12], [784, .12], [1046, .22], [784, .12], [1046, .32]]);
      chord([523, 659, 784], .1, .7, "sine", .09);                                         // warm C-major pad
    },
    unlock:    function () { playTune([[440, .1], [587, .1], [880, .28]]); chord([440, 554, 660], .05, .55, "sine", .08); },
    intro:     function () { playTune([[523, .1, "sine", .07], [659, .1, "sine", .07], [784, .2, "sine", .08]]); },
    bump:      function () { note(190, 0, .12, "sine", .13, { glide: 130 }); },
    hint:      function () { note(784, 0, .28, "sine", .08, { shimmer: true }); note(1175, .14, .4, "sine", .07, { shimmer: true }); },
    complete:  function () { playTune([[659, .1], [784, .1], [988, .1], [1319, .3]]); chord([659, 784, 988], .18, .6, "sine", .07); },
    choice:    function () { note(587, 0, .1, "triangle", .11, { shimmer: true }); note(880, .08, .2, "triangle", .11, { shimmer: true }); },
    page:      function () { noise(0, .38, "bandpass", 700, 2600, 0.9, .05); },
    whoosh:    function () { noise(0, .5, "bandpass", 380, 1900, 0.8, .07); },
    discover:  function () {
      [1046, 1175, 1319, 1568, 2093].forEach(function (f, i) { note(f, i * 0.06, 0.26, "sine", 0.05, { shimmer: true }); });
      chord([523, 784], .05, .6, "sine", .05);
    },
    splash:    function () {
      noise(0, .32, "bandpass", 1500, 700, 0.7, .14);
      [0.06, 0.13, 0.19].forEach(function (t, i) { note(1500 + i * 420, t, .07, "sine", .05, { glide: 2600 + i * 300 }); });
    },
    flutter:   function () { noise(0, .34, "bandpass", 1800, 2400, 1.2, .07, 22); },
    rustle:    function () { noise(0, .42, "highpass", 2400, 3600, 0.6, .05, 14); },
    bubbles:   function () { [0, .09, .2].forEach(function (t, i) { note(420 + i * 160, t, .08, "sine", .1, { glide: 900 + i * 220 }); }); },
    beep:      function () { note(1320, 0, .07, "sine", .06); note(1760, .1, .09, "sine", .05); },
    pop:       function () { note(480, 0, .08, "sine", .14, { glide: 1150 }); },
    magic:     function () { [1568, 1319, 1175, 1046, 1319, 1568, 2093].forEach(function (f, i) { note(f, i * 0.05, 0.22, "sine", 0.05, { shimmer: true }); }); },
    crunch:    function () { noise(0, .11, "bandpass", 2600, 2600, 1.3, .25); note(587.33, 0.02, 0.12, "sine", 0.16, { shimmer: true, glide: 880 }); },
    catch:     function () { note(440, 0, 0.08, "triangle", 0.18, { glide: 880, shimmer: true }); note(659.25, 0.04, 0.14, "sine", 0.14, { shimmer: true }); },
    horn:      function () {
      note(440, 0, 0.12, "triangle", 0.18); note(554.37, 0, 0.12, "triangle", 0.14);
      note(440, 0.15, 0.18, "triangle", 0.18); note(554.37, 0.15, 0.18, "triangle", 0.14);
    },
    vehicle:   function () { playTune([[140, .18, "sawtooth", .12], [180, .22, "sawtooth", .12], [150, .3, "sawtooth", .1]]); },
    // Momo's tiny wordless reactions — a soft little "hm-hi!", never words.
    mGreet:    function () { note(620, 0, .11, "sine", .08, { glide: 900 }); note(820, .12, .12, "sine", .07, { glide: 1100 }); },
    mHappy:    function () { note(640, 0, .14, "sine", .08, { glide: 980, shimmer: true }); },
    mExcited:  function () { [0, .08, .16].forEach(function (t, i) { note(760 + i * 120, t, .07, "sine", .07, { glide: 1150 + i * 120 }); }); },
    mCheer:    function () { note(600, 0, .26, "triangle", .08, { glide: 1250, shimmer: true }); note(900, .2, .2, "sine", .06, { shimmer: true }); }
  };

  /* Change #28: one recognisable sound per vehicle (all 17 used to share a single generic buzz).
     Original recipes, soft levels, none longer than ~1.6 s. Used when no recording exists. */
  // Levels sit with the other cues (about -12 dB peak); pitches stay above ~150 Hz so a phone speaker plays them.
  function horn(f, start, dur, vol) { note(f, start, dur, "square", vol); note(f * 1.26, start, dur, "square", vol * 0.7); }
  var VEHICLE_SOUNDS = {
    car:        function () { horn(420, 0, .16, .14); horn(420, .22, .22, .14); },
    taxi:       function () { horn(470, 0, .13, .13); horn(470, .17, .13, .13); horn(470, .34, .2, .13); },
    suv:        function () { horn(360, 0, .18, .15); horn(360, .25, .28, .15); },
    van:        function () { horn(400, 0, .34, .14); },
    bus:        function () { horn(300, 0, .6, .15); },
    truck:      function () { horn(233, 0, .75, .16); },
    ambulance:  function () { [0, .38, .76, 1.14].forEach(function (t, i) { note(i % 2 ? 740 : 960, t, .36, "triangle", .2); }); },
    police:     function () { note(650, 0, .7, "triangle", .2, { glide: 1250 }); note(1250, .7, .7, "triangle", .2, { glide: 650 }); },
    firetruck:  function () { note(500, 0, 1, "triangle", .2, { glide: 1100 }); horn(262, 1, .45, .15); },
    bicycle:    function () { [0, .22].forEach(function (t) { note(2300, t, .5, "sine", .16); note(3450, t, .35, "sine", .06); }); },
    motorcycle: function () { note(160, 0, .45, "sawtooth", .14, { glide: 420 }); note(420, .45, .6, "sawtooth", .12, { glide: 240 }); },
    tractor:    function () { for (var i = 0; i < 6; i++) { note(140, i * .16, .12, "square", .14); noise(i * .16, .08, "bandpass", 500, 400, 1.2, .12); } },
    train:      function () { [0, .5].forEach(function (t) { note(587, t, .42, "triangle", .17); note(740, t, .42, "triangle", .14); note(880, t, .42, "triangle", .11); });
                              for (var i = 0; i < 4; i++) noise(1 + i * .15, .1, "bandpass", 700, 450, 1, .2); },
    airplane:   function () { noise(0, 1.4, "bandpass", 500, 2000, .8, .3); note(300, 0, 1.4, "triangle", .08, { glide: 600 }); },
    helicopter: function () { noise(0, 1.3, "bandpass", 700, 700, .7, .45, 13); for (var i = 0; i < 16; i++) note(110, i * .077, .05, "square", .1); },
    ship:       function () { note(220, 0, 1.3, "sawtooth", .12); note(330, 0, 1.3, "triangle", .1); },
    rocket:     function () { noise(0, 1.5, "lowpass", 400, 3000, .7, .35); note(120, 0, 1.5, "sawtooth", .1, { glide: 500 }); }
  };
  Object.keys(VEHICLE_SOUNDS).forEach(function (k) { SYNTH["vehicle." + k] = VEHICLE_SOUNDS[k]; });

  /** Run a recipe at a loudness (0..1+). Returns false when nothing can play, else
      { end, node }: the audio-clock time the recipe's last note stops, and that node
      (its "ended" event is the recipe's real completion — used to sequence speech). */
  function runSynth(name, vol) {
    var fn = SYNTH[name];
    if (!fn || !soundOn() || !ac()) return false;
    var prev = scale;
    scale = vol == null ? 1 : vol;
    track = { end: 0, node: null };
    try { fn(); } catch (e) { /* a sound must never break a game */ }
    var done = track;
    track = null;
    scale = prev;
    return done.node ? done : true;
  }

  /** Play a registry cue (AudioManager decides file vs synth, priority, volume). */
  function cue(id) {
    var am = AM();
    if (am && am.cue) return am.cue(id);
    var def = Kido.audioRegistry && Kido.audioRegistry.cues[id];
    if (def && def.synth) runSynth(def.synth, def.volume);
    return null;
  }

  /* --- Voices for speechSynthesis --- */
  function loadVoices() {
    if (window.speechSynthesis) { voices = window.speechSynthesis.getVoices() || []; }
  }
  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  var ACCENTS = [
    { id: 'en-IN', label: 'Indian English · female' },
    { id: 'en-GB', label: 'British English · female' },
    { id: 'en-US', label: 'American English · female' }
  ];
  function narratorAccent() {
    var chosen = settings().narratorAccent;
    return ACCENTS.some(function (a) { return a.id === chosen; }) ? chosen : 'en-IN';
  }
  // Android's Google voices are all just named "English India" etc.; the voice id says which voice it is.
  var ANDROID_FEMALE = /-x-(ena|enc|gba|gbc|gbg|iob|iog|sfg|tpc|hia|hic)-/i, ANDROID_MALE = /-x-(end|ene|gbb|gbd|rjs|iol|iom|tpd|hid|hie)-/i;
  function voiceScore(v) {
    var name = v.name || '', id = v.voiceURI || '';
    // Browsers expose no gender field. Prefer known female voices; report unknown voices honestly.
    var female = /female|woman|neerja|heera|aditi|raveena|swara|kalpana|sonia|libby|hazel|serena|kate|jenny|aria|samantha|zira|ava|allison|susan|sara|michelle/i.test(name);
    var male = /\bmale\b|david|mark|george|guy|ryan|christopher|ravi|prabhat|hemant|daniel|james/i.test(name);
    female = female || ANDROID_FEMALE.test(id); male = male || ANDROID_MALE.test(id);
    // an offline voice (Android: "-local") works without internet and starts sooner
    return (female ? 1000 : male ? -1000 : 0) + (/natural|neural|online|google/i.test(name) ? 100 : 0) + (/-local$/i.test(id) ? 50 : 0);
  }
  /** A name a parent can tell apart (Android lists nine voices all called "English India"). */
  function voiceLabel(v) {
    var m = String(v.voiceURI || '').match(/-x-([a-z]{3})-(local|network)$/i), s = voiceScore(v);
    if (!m) return v.name;
    return v.name + ' · voice ' + m[1].toUpperCase() + (s > 500 ? ' · female' : s < -500 ? ' · male' : '') + (m[2] === 'local' ? ' · offline' : ' · needs internet');
  }
  function normLang(l) {
    if (!l) return '';
    var s = String(l).toLowerCase().replace(/_/g, '-');
    if (s.indexOf('eng') === 0) s = 'en' + s.slice(3);
    else if (s.indexOf('hin') === 0) s = 'hi' + s.slice(3);
    return s;
  }
  function pickVoice(lang) {
    var key = normLang(lang || narratorAccent());
    if (!voices.length) loadVoices();
    var pool = voices.filter(function(v) { return normLang(v.lang).slice(0,2) === key.slice(0,2); });
    var selected = settings().narratorVoice;
    var explicit = pool.find(function(v) { return (v.voiceURI || v.name) === selected && normLang(v.lang) === key; });
    if (explicit) return explicit;
    var exact = pool.filter(function(v) { return normLang(v.lang) === key; });
    return (exact.length ? exact : pool).slice().sort(function(a,b) { return voiceScore(b)-voiceScore(a); })[0] || null;
  }
  function narratorInfo() {
    loadVoices();
    var accent=narratorAccent(), chosen=pickVoice(accent);
    return { accent:accent, voice:chosen, female:!!chosen && voiceScore(chosen)>=1000,
      exact:!!chosen && chosen.lang.toLowerCase().replace(/_/g,'-')===accent.toLowerCase(),
      voices:voices.filter(function(v){return (v.lang||'').toLowerCase().replace(/_/g,'-')===accent.toLowerCase();}) };
  }

  /* --- Speech pacing: unhurried, a little slower again for pre-readers --- */
  function pace() {
    try { return Kido.age && Kido.age.isPreReader && Kido.age.isPreReader() ? 0.92 : 0.97; } catch (e) { return 0.97; }
  }
  function voiceLevel() { var am = AM(); return am && am.level ? am.level("voice") : 1; }

  /** Resolves once nothing has been talking for `settle` ms (or after `max` ms). Lines the app starts on its own
      (the next question, option names) wait for this, so they never cut off a line that is still playing. The
      settle time bridges the short gap between the parts of a glued line (Kido.mascot.say parts). */
  var lastVoiceEnd = 0, quietHooked = false;
  function hookQuiet() {
    var am = AM();
    if (!quietHooked && am && am.on) { quietHooked = true; am.on("voice:end", function () { lastVoiceEnd = Date.now(); }); }
  }
  function whenQuiet(max, settle) {
    var am = AM();
    if (!am || !am.voiceActive) return Promise.resolve();
    hookQuiet();
    max = max == null ? 12000 : max; settle = settle == null ? 300 : settle;
    var t0 = Date.now();
    return new Promise(function (res) {
      (function check() {
        var now = Date.now();
        if ((!am.voiceActive() && now - lastVoiceEnd >= settle) || now - t0 >= max) return res();
        setTimeout(check, 50);
      })();
    });
  }

  /** Speak text warmly on the VOICE channel. Resolves true when it was
      actually spoken, false when skipped (muted, no voice, empty). */
  var speakToken = 0;
  var activeUtterances = []; // Prevent V8 garbage collection bug in Chromium
  // How long the device voice takes from speak() to actually sounding, measured on
  // real lines (smoothed). Lets a sequence start the request early by exactly that much.
  var latencies = [];          // last few samples; the lower median ignores a slow cold first line
  function sayNow(u) { u._askedAt = performance.now(); window.speechSynthesis.speak(u); }
  function heard(u) {
    if (!u._askedAt) return;
    var ms = performance.now() - u._askedAt; u._askedAt = 0;
    if (ms >= 0 && ms < 3000) { latencies.push(ms); if (latencies.length > 5) latencies.shift(); }
  }
  var speechPing = null;

  function ensureSpeechKeepAlive() {
    if (speechPing) return;
    speechPing = setInterval(function () {
      if (window.speechSynthesis) {
        if (window.speechSynthesis.speaking && window.speechSynthesis.paused && !document.hidden) {
          window.speechSynthesis.resume();
        }
      }
    }, 1500);
  }

  var voiceMisses = [], spokeCount = 0;
  function speak(text, opts) {
    opts = opts || {};
    spokeCount++;
    hookQuiet();
    var level = voiceLevel();
    if (!soundOn() || !window.speechSynthesis || !text || level <= 0) return Promise.resolve(false);
    // While a grown-up is in the Parent Zone, the child's screen behind it doesn't talk.
    if (!opts.parentZone && Kido.parent && Kido.parent.isOpen && Kido.parent.isOpen()) return Promise.resolve(false);
    ensureSpeechKeepAlive();

    var cleanText = String(text).replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim();
    if (!cleanText) cleanText = String(text);

    var isDevanagari = /[ऀ-ॿ]/.test(cleanText);
    var targetLang = opts.lang || (isDevanagari ? "hi-IN" : "en-US");
    var isHindi = targetLang.toLowerCase().indexOf("hi") === 0 || isDevanagari;

    // Check pre-recorded voice assets first (high-quality native studio clips)
    var regVoice = Kido.audioRegistry && Kido.audioRegistry.voice;
    var voiceFile = null;
    if (regVoice) {
      var entry = regVoice[opts.id] || regVoice[cleanText] || regVoice["hi." + cleanText] || regVoice["letter.hi." + cleanText] || regVoice["hi.letter." + cleanText];
      if (entry && entry.available !== false && entry.sound) {
        voiceFile = (Kido.audioRegistry.basePath || "assets/audio/") + entry.sound;
      }
    }
    if (!voiceFile && voiceMisses.indexOf(cleanText) < 0 && voiceMisses.length < 5000) voiceMisses.push(cleanText);
    if (voiceFile && AM() && AM().playVoice) {
      if (opts.chime === true) cue("ui.sparkle");
      return AM().playVoice(voiceFile, { text: cleanText, speaker: opts.speaker, kind: opts.kind, lang: targetLang }).then(function (ok) {
        if (ok) {
          if (opts.onEnd) { try { opts.onEnd(); } catch (e) {} }
          return true;
        }
        return doSpeechSynthesis();
      });
    }

    return doSpeechSynthesis();

    function doSpeechSynthesis() {
      return new Promise(function (resolve) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          var myToken = ++speakToken;

          var u = new SpeechSynthesisUtterance(cleanText);
        u.lang = isHindi ? "hi-IN" : /^en(?:-|$)/i.test(targetLang) ? narratorAccent() : targetLang;
        var v = pickVoice(u.lang);
        if (!v && window.speechSynthesis) {
          loadVoices();
          v = pickVoice(u.lang);
        }
        if (v) {
          u.voice = v;
          u.lang = v.lang;
        } else if (isHindi) {
          // Android device has no Hindi TTS engine data installed (e.g. Samsung tablet).
          // Emit caption & soft chime without triggering native plugin crash.
          if (opts.chime !== false) cue("ui.sparkle");
          var amFallback = AM();
          var vTokFallback = amFallback && amFallback.voiceStart ? amFallback.voiceStart(cleanText, { speaker: opts.speaker, kind: opts.kind, lang: "hi-IN" }) : null;
          setTimeout(function () {
            if (amFallback && amFallback.voiceEnd) amFallback.voiceEnd(vTokFallback);
            if (opts.onEnd) { try { opts.onEnd(); } catch (e) {} }
            resolve(true);
          }, Math.max(700, cleanText.length * 80));
          return;
        }
        // Gentle expression: a touch brighter for excitement/questions, never rushed.
        var isExclaimed = /!|शाबाश|वाह|कमाल|शानदार|yay|woohoo|awesome|great|super|hurray|champion|amazing|fantastic|brilliant|bravo|bingo/i.test(cleanText);
        var isQuestion = /\?|who|where|what|which|can you|how many|ढूंढो|कहाँ|कौन/i.test(cleanText);
        var isPraise = /correct|right|good job|well done|nailed it|spot on|बढ़िया|सही/i.test(cleanText);

        // A sparkle only when explicitly asked for (it used to ring on every "!").
        if (opts.chime === true) cue("ui.sparkle");

        var dynamicPitch = opts.pitch || (isExclaimed || isPraise ? 1.06 : (isQuestion ? 1.03 : 1.0));
        var dynamicRate  = opts.rate  || (isExclaimed ? 1.0 : (isQuestion ? .98 : .98));
        var p = pace();

        if (isHindi) {
          // Warm, lively, animated Indian cadence for children
          u.rate = (opts.rate || (isExclaimed ? 1.05 : 1.00)) * p;
          u.pitch = opts.pitch || (isExclaimed ? 1.06 : 1.0);
        } else {
          u.rate = dynamicRate * p * ((AM() && AM().narrationRate) ? AM().narrationRate() : 1);
          u.pitch = dynamicPitch;
        }
        u.volume = Math.max(0, Math.min(1, (opts.volume == null ? 1 : opts.volume) * level));

        activeUtterances.push(u);

        var am = AM();
        var vTok = am && am.voiceStart ? am.voiceStart(cleanText, { speaker: opts.speaker, kind: opts.kind, lang: u.lang })
                                       : null;
        if (!am && Kido.Music && Kido.Music.duck) Kido.Music.duck(0.25);

        var done = false, spoke = false;
        u.onstart = function () { spoke = true; heard(u); };
        function finish() {
          if (done) return;
          done = true;
          var idx = activeUtterances.indexOf(u);
          if (idx !== -1) activeUtterances.splice(idx, 1);
          if (am && am.voiceEnd) am.voiceEnd(vTok);
          else if (myToken === speakToken && Kido.Music && Kido.Music.unduck) Kido.Music.unduck();
          if (opts.onEnd) { try { opts.onEnd(); } catch (e) {} }
          resolve(spoke);
        }

        u.onend = function () { spoke = true; finish(); };
        u.onerror = function (err) {
          // If canceled or interrupted by subsequent speech, do NOT retry or spawn a second voice!
          var errType = err && (err.error || "");
          if (errType === "interrupted" || errType === "canceled") {
            finish();
            return;
          }
          // If a cloud voice encountered a network error, retry once using a verified voice
          if (u.voice && !u._retried) {
            u._retried = true;
            try {
              var altVoice = voices.filter(function(v){return v !== u.voice && v.localService && (v.lang||'').toLowerCase() === u.lang.toLowerCase();}).sort(function(a,b){return voiceScore(b)-voiceScore(a);})[0];
              if (altVoice) {
                var fb = new SpeechSynthesisUtterance(cleanText);
                fb.lang = u.lang;
                fb.rate = u.rate;
                fb.pitch = u.pitch;
                fb.volume = u.volume;
                fb.voice = altVoice;
                activeUtterances.push(fb);
                fb.onstart = function () { spoke = true; heard(fb); };
                fb.onend = fb.onerror = function () {
                  var i = activeUtterances.indexOf(fb);
                  if (i !== -1) activeUtterances.splice(i, 1);
                  finish();
                };
                sayNow(fb);
                return;
              }
            } catch (e) {}
          }
          finish();
        };

        var isBusy = window.speechSynthesis.speaking || window.speechSynthesis.pending;
        if (opts.queue) {
          sayNow(u);
        } else if (isBusy) {
          window.speechSynthesis.cancel();
          setTimeout(function () {
            if (myToken === speakToken) {
              sayNow(u);
            } else {
              finish();
            }
          }, 80);
        } else {
          sayNow(u);
        }
      } catch (e) {
        resolve(false);
      }
    });
    }
  }

  /* --- Legacy real-asset layer (Kido.audio.register) --- */
  function playBuffer(id) {
    var a = assets[id];
    var c = ac();
    if (!a || !a.buffer || !c) return false;
    var src = c.createBufferSource();
    var ch = id.indexOf("voice.") === 0 ? "voice" : "sfx";
    src.buffer = a.buffer;
    src.connect((AM() && AM().bus && AM().bus(ch)) || c.destination);
    src.start();
    return true;
  }

  Kido.audio = {
    assets: assets,
    narratorAccents: ACCENTS,
    voiceLabel: voiceLabel,
    narratorInfo: narratorInfo,
    setNarrator: function(accent, voice) {
      if (!ACCENTS.some(function(a){return a.id===accent;})) return;
      if (Kido.Voice) Kido.Voice.stop();
      Kido.progress.setSetting('narratorAccent',accent);
      Kido.progress.setSetting('narratorVoice',voice || '');

    },

    register: function (id, src) {
      assets[id] = { src: src, buffer: null };
      var c = ac();
      if (!c || !window.fetch) return;
      fetch(src).then(function (r) { return r.arrayBuffer(); })
        .then(function (buf) { return c.decodeAudioData(buf); })
        .then(function (b) { assets[id].buffer = b; })
        .catch(function () { /* keep fallback */ });
    },

    playAsset: function (id, fallback) {
      if (!soundOn()) return;
      if (playBuffer(id)) return;
      if (typeof fallback === "function") fallback();
    },

    /* ---- Content sounds ---- */
    playLetterSound: function (letter, lang) {
      var id = (lang === "hi" ? "hi.letter." : "letter.") + letter;
      this.playAsset(id, function () { speak(letter, { lang: lang === "hi" ? "hi-IN" : "en-US", rate: 0.92 }); });
    },
    playWordSound: function (word, lang) {
      this.playAsset("word." + word, function () { speak(word, { lang: lang === "hi" ? "hi-IN" : "en-US" }); });
    },
    playName: function (name, lang) { this.playWordSound(name, lang); },

    // Real recordings first (AudioManager + manifest), then the live acoustic synth.
    playAnimalSound: function (key, spoken) { playCreature("animals", key, spoken, this); },
    playBirdSound: function (key, spoken) { playCreature("birds", key, spoken, this); },
    playVehicleSound: function (key, spoken) {
      var am = AM();                                  // a real recording first (it speaks the name after it)
      if (soundOn() && am && am.available && am.available("vehicles", key) && am.playVehicle(key, spoken)) return;
      this.playAsset("vehicle." + key, function () {
        var r = runSynth("vehicle." + key);           // its own sound; the generic cue only for an unknown vehicle
        if (!r) cue("fx.vehicle");
        var c = ac(), wait = r && r.end && c ? Math.max(520, (r.end - c.currentTime) * 1000 + 150) : 520;
        if (spoken) setTimeout(function () { speak(spoken); }, wait);   // the name follows the sound, not over it
      });
    },

    /* ---- Feedback sounds (named cues — see js/data/audioRegistry.js) ---- */
    playCorrectSound:     function () { return cue("game.correct"); },
    playIncorrectSound:   function () { return cue("game.retry"); },
    playCelebrationSound: function () { return cue("reward.celebrate"); },
    playTapSound:         function () { return cue("ui.tap"); },
    playUnlockSound:      function () { return cue("reward.unlock"); },
    playFruitCrunch:      function () { return cue("fx.crunch"); },
    playFruitCatch:       function () { return cue("fx.catch"); },
    playCarHorn:          function () { return cue("fx.horn"); },
    /** Named effect: Kido.audio.play("splash") → cue "fx.splash"; full ids pass through. */
    play: function (name) { return name ? cue(String(name).indexOf(".") === -1 ? "fx." + name : name) : null; },
    pop: function () { return cue("fx.pop"); },
    cue: cue,

    /** Run a synth recipe directly (AudioManager uses this as the fallback). */
    synth: runSynth,
    hasSynth: function (name) { return !!SYNTH[name]; },
    synthNames: function () { return Object.keys(SYNTH); },

    speak: speak,
    whenQuiet: whenQuiet,
    /** Lines spoken with the device voice because no recording exists (scripts/voice/harvest.js collects them). */
    voiceMisses: function () { return voiceMisses.slice(); },
    /** Bumps on every speak() call: a multi-part line stops when something else starts talking. */
    spoke: function () { return spokeCount; },
    pace: pace,
    /** Public single note (rhythm / Simon pads). freq Hz, dur seconds. */
    tone: function (freq, dur, type, vol) { if (soundOn()) note(freq, 0, dur || 0.3, type || "sine", vol == null ? 0.2 : vol, { shimmer: true }); },
    /** Shared AudioContext (null when Sound is OFF) + warm SFX output — used by the animal synth. */
    ctx: function () { return soundOn() ? ac() : null; },
    /** The context regardless of the Sound switch (mixer + music). Null before the first gesture. */
    rawCtx: function () { return ac(); },
    sfxOut: function () { var c = ac(); return c ? (bus() || c.destination) : null; },
    isUnlocked: function () { return unlocked; },
    /** Measured device-voice start-up time in ms (null until a line has been heard). */
    speechLatency: function () {
      if (!latencies.length) return null;
      var v = latencies.slice().sort(function (x, y) { return x - y; });
      return v[(v.length - 1) >> 1];
    },
    /** Get speech ready before a timed line: voices loaded + chosen, audio awake. */
    prepareSpeech: function (lang) {
      ac();
      if (window.speechSynthesis) { try { if (!voices.length) loadVoices(); pickVoice(lang || "en-US"); } catch (e) {} }
    },
    /** Called on user gestures to unlock audio on mobile and desktop. Waits for a
        gesture the browser counts as user activation (a touch grants it only on
        pointerup/touchend, never pointerdown; Esc never does) so the context is
        not born suspended — Chrome's "AudioContext was not allowed to start"
        warning. Browsers without the UserActivation API unlock as before. */
    unlock: function () {
      var first = !unlocked;
      unlocked = true;
      var c = ac();
      if (c && c.state === "suspended") {
        c.resume().catch(function () {});
      }
      if (window.speechSynthesis) {
        try {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
          loadVoices();
        } catch (e) {}
      }
      if (first && AM() && AM()._onUnlock) AM()._onUnlock();
    }
  };

  function playCreature(kind, key, spoken, self) {
    var am = AM(), other = kind === "birds" ? "animals" : "birds";
    if (am && am.play) { return am.play(kind, key, spoken); }
    if (Kido.animalSynth && Kido.animalSynth.has(key)) {
      Kido.animalSynth.play(key);
      if (spoken) setTimeout(function () { speak(spoken); }, 500);
      return;
    }
    self.playTapSound();
    if (spoken) setTimeout(function () { speak(spoken); }, 300);
  }

  // Unlock on the first real gesture. A touch's pointerdown carries no user
  // activation, so pointerup / touchend / click must listen too; all of them
  // detach once the shared context is actually running.
  var GESTURES = ["pointerdown", "pointerup", "touchend", "click", "keydown"];
  function globalUnlock() {
    Kido.audio.unlock();
    if (ctx && ctx.state === "running") {
      GESTURES.forEach(function (t) { window.removeEventListener(t, globalUnlock, true); });
    }
  }
  GESTURES.forEach(function (t) { window.addEventListener(t, globalUnlock, { passive: true, capture: true }); });
})(window);
