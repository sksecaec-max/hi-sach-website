/* =========================================================================
   animalSynth.js — Realistic-ish animal & bird calls, synthesized live with
   the Web Audio API (no audio files, works fully offline in a WebView).
   Each call layers oscillators + filtered noise with pitch contours and
   growl/bleat tremolo so a dog really "barks", a cat "meows", a cow "moos".
   Routes through Kido.audio's warm SFX bus. If a real recording is registered
   (Kido.audio.register("animal.dog", url)) that always wins over synthesis.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  function ctx() {
    var c = Kido.audio && Kido.audio.ctx ? Kido.audio.ctx() : null;
    if (c && c.state === "suspended") c.resume().catch(function () {});
    return c;
  }
  function out() { return Kido.audio && Kido.audio.sfxOut ? Kido.audio.sfxOut() : null; }

  /* Master limiter so layered voices can never clip/distort (kind on the ears).
     All calls route through here → soft compressor → Kido's warm SFX bus. */
  var scheduledNodes = null, lastEnd = 0, lastNode = null;
  function stopAt(node, time) {
    node.stop(time);
    if (scheduledNodes) { scheduledNodes.push(node); if(time>lastEnd){lastEnd=time;lastNode=node;} }
  }
  var master = null;
  function dest() {
    var c = ctx(); if (!c) return null;
    if (!master || master._ctx !== c) {
      try {
        var comp = c.createDynamicsCompressor();
        comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 14;
        comp.attack.value = 0.003; comp.release.value = 0.18;
        // One route only — through the SFX channel, so the parent's volume and
        // Mute apply (it used to ALSO hit the speakers directly, bypassing both).
        var g = c.createGain(); g.gain.value = 1.5;
        g.connect(comp);
        comp.connect(out() || c.destination);
        master = g; master._ctx = c;
      } catch (e) {
        master = c.destination;
      }
    }
    return master;
  }

  /* Cached white-noise buffer for barks, growls, grunts, hisses. */
  var noiseBuf = null;
  function noiseSrc(c) {
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      var len = Math.floor(c.sampleRate * 1.2);
      noiseBuf = c.createBuffer(1, len, c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    var s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
  }

  /* Soft saturation curve — adds a throaty "grit" to roars/growls/caws. */
  var shaperCache = {};
  function shaper(c, amt) {
    if (shaperCache[amt]) return shaperCache[amt];
    var n = 512, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; curve[i] = Math.tanh(x * amt); }
    var ws = c.createWaveShaper(); ws.curve = curve; ws.oversample = "2x";
    shaperCache[amt] = ws; return ws;
  }
  /* One voiced tone: pitch contour + gain envelope + optional band/low-pass
     filter, vibrato (pitch wobble), tremolo (amplitude wobble = growl/bleat)
     and drive (grit). All timing is relative to the shared AudioContext clock. */
  function voice(o) {
    var c = ctx(); if (!c) return 0;
    if (c.state === "suspended") c.resume().catch(function () {});
    var t0 = Math.max(o.t0 != null ? o.t0 : c.currentTime, c.currentTime + 0.005);
    var dur = o.dur || 0.3, peak = o.peak == null ? 0.2 : o.peak;
    try {
      var osc = c.createOscillator(); osc.type = o.type || "sawtooth";
      var g = c.createGain(), head = osc;
      if (o.filter) {
        var f = c.createBiquadFilter();
        f.type = o.filter.type || "bandpass";
        f.frequency.value = o.filter.freq;
        if (o.filter.q != null) f.Q.value = o.filter.q;
        osc.connect(f); head = f;
      }
      if (o.drive) { var ws = shaper(c, o.drive); head.connect(ws); ws.connect(g); }
      else head.connect(g);
      g.connect(dest() || c.destination);

      if (Array.isArray(o.freq)) {
        var stepTime = dur / Math.max(1, o.freq.length - 1);
        osc.frequency.setValueAtTime(o.freq[0], t0);
        for (var fi = 1; fi < o.freq.length; fi++) {
          osc.frequency.linearRampToValueAtTime(o.freq[fi], t0 + fi * stepTime);
        }
      } else {
        osc.frequency.setValueAtTime(o.freq, t0);
        if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glideTo), t0 + dur);
      }

      if (o.vibrato) {
        var lf = c.createOscillator(), lg = c.createGain();
        lf.frequency.value = o.vibrato.rate; lg.gain.value = o.vibrato.depth;
        lf.connect(lg); lg.connect(osc.frequency);
        lf.start(t0); stopAt(lf, t0 + dur + 0.05);
      }
      var a = o.attack || 0.01, rel = o.release != null ? o.release : dur * 0.5;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + a);
      g.gain.setValueAtTime(peak, t0 + Math.max(a + 0.001, dur - rel));
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      if (o.tremolo) {
        var tl = c.createOscillator(), tg = c.createGain();
        tl.type = "sine"; tl.frequency.value = o.tremolo.rate; tg.gain.value = o.tremolo.depth * peak;
        tl.connect(tg); tg.connect(g.gain);
        tl.start(t0); stopAt(tl, t0 + dur + 0.05);
      }
      osc.start(t0); stopAt(osc, t0 + dur + 0.05);
      return dur;
    } catch (e) {
      return dur;
    }
  }
  /* Filtered noise burst — the "air"/consonant part of barks, grunts, caws. */
  function noiseHit(o) {
    var c = ctx(); if (!c) return 0;
    if (c.state === "suspended") c.resume().catch(function () {});
    var t0 = Math.max(o.t0 != null ? o.t0 : c.currentTime, c.currentTime + 0.005);
    var dur = o.dur || 0.1;
    try {
      var n = noiseSrc(c), f = c.createBiquadFilter(), g = c.createGain();
      f.type = (o.filter && o.filter.type) || "bandpass";
      f.frequency.setValueAtTime((o.filter && o.filter.freq) || 900, t0);
      if (o.filterTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.filterTo), t0 + dur);
      f.Q.value = o.q != null ? o.q : 1;
      n.connect(f); f.connect(g); g.connect(dest() || c.destination);
      var peak = o.peak == null ? 0.12 : o.peak, a = o.attack || 0.005;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      n.start(t0); stopAt(n, t0 + dur + 0.05);
      return dur;
    } catch (e) {
      return dur;
    }
  }
  function T() { var c = ctx(); return c ? c.currentTime : 0; }
  /* ---- Per-animal recipes (t = start time on the audio clock) ---- */
  var A = {
    dog: function (t) {
      function woof(s) {
        voice({ type: "sawtooth", freq: [430, 300, 170], dur: 0.2, peak: 0.3, filter: { type: "lowpass", freq: 1300, q: 1 }, attack: 0.006, release: 0.14, drive: 3, t0: s });
        noiseHit({ filter: { type: "bandpass", freq: 1000 }, filterTo: 400, q: 0.7, dur: 0.09, peak: 0.14, t0: s });
      }
      woof(t); woof(t + 0.3);
    },
    cat: function (t) {
      var f = [480, 720, 900, 760, 540];
      voice({ type: "sawtooth", freq: f, dur: 0.62, peak: 0.22, filter: { type: "bandpass", freq: 1100, q: 3 }, vibrato: { rate: 16, depth: 22 }, attack: 0.03, release: 0.26, t0: t });
      voice({ type: "sawtooth", freq: f, dur: 0.62, peak: 0.07, filter: { type: "bandpass", freq: 2500, q: 6 }, attack: 0.03, release: 0.26, t0: t });
    },
    cow: function (t) {
      voice({ type: "sawtooth", freq: [155, 140, 132, 128], dur: 0.95, peak: 0.3, filter: { type: "lowpass", freq: 650, q: 1 }, vibrato: { rate: 6, depth: 4 }, attack: 0.07, release: 0.45, t0: t });
      voice({ type: "sawtooth", freq: [310, 280], dur: 0.9, peak: 0.06, filter: { type: "bandpass", freq: 500, q: 2 }, attack: 0.08, release: 0.4, t0: t });
    },
    lion: function (t) { roar(t, 1.0, 105, 6); },
    tiger: function (t) {
      // Ferocious Tiger Roar: Guttural snarling growl rising into a booming, chest-rattling roar
      voice({ type: "sawtooth", freq: [150, 185, 220, 190], dur: 0.35, peak: 0.36, filter: { type: "bandpass", freq: 950, q: 2.8 }, tremolo: { rate: 36, depth: 0.65 }, drive: 4.2, attack: 0.03, release: 0.14, t0: t });
      noiseHit({ filter: { type: "bandpass", freq: 1200 }, dur: 0.22, peak: 0.12, t0: t });
      var tRoar = t + 0.22;
      voice({ type: "sawtooth", freq: [240, 200, 155, 120, 95], dur: 0.85, peak: 0.44, filter: { type: "lowpass", freq: 850, q: 1.6 }, tremolo: { rate: 30, depth: 0.5 }, drive: 4.0, attack: 0.04, release: 0.45, t0: tRoar });
      voice({ type: "sine", freq: [96, 88, 76, 68], dur: 0.9, peak: 0.32, filter: { type: "lowpass", freq: 240, q: 1 }, attack: 0.05, release: 0.5, t0: tRoar });
      voice({ type: "sawtooth", freq: [440, 360, 280, 220], dur: 0.7, peak: 0.2, filter: { type: "bandpass", freq: 1400, q: 3.2 }, attack: 0.04, release: 0.35, t0: tRoar });
      noiseHit({ filter: { type: "bandpass", freq: 1500, q: 1.2 }, filterTo: 700, dur: 0.6, peak: 0.15, t0: tRoar });
    },
    bear: function (t) { roar(t, 1.05, 80, 5); },
    sheep: function (t) { bleat(t, 340, 22); },
    goat: function (t) {
      voice({ type: "sawtooth", freq: [440, 470, 450, 420], dur: 0.65, peak: 0.32, filter: { type: "bandpass", freq: 1100, q: 2.2 }, vibrato: { rate: 18, depth: 16 }, tremolo: { rate: 26, depth: 0.65 }, drive: 2.2, attack: 0.02, release: 0.22, t0: t });
      voice({ type: "sine", freq: [220, 235, 210], dur: 0.6, peak: 0.18, filter: { type: "lowpass", freq: 460, q: 1 }, attack: 0.02, release: 0.2, t0: t });
    },
    frog: function (t) { frogRibbit(t); },
    duck: function (t) { duckQuack(t); },
    pig: function (t) { oink(t); oink(t + 0.19); oink(t + 0.38); },
    horse: function (t) {
      voice({ type: "sawtooth", freq: [720, 620, 460, 320, 220], dur: 0.85, peak: 0.24, filter: { type: "bandpass", freq: 1200, q: 2 }, vibrato: { rate: 13, depth: 16 }, tremolo: { rate: 25, depth: 0.6 }, attack: 0.02, release: 0.3, t0: t });
    },
    elephant: function (t) {
      // Natural Acoustic Elephant Trumpet: Powerful, rich trunk blast with lip-reed brass resonance,
      // organic 7Hz flutter vibrato, warm trunk formants, and deep infrasonic chest rumble.
      noiseHit({ filter: { type: "bandpass", freq: 850, q: 1.5 }, filterTo: 1400, dur: 0.35, peak: 0.14, t0: t });
      voice({ type: "sawtooth", freq: [260, 420, 520, 480, 360], dur: 1.1, peak: 0.38, filter: { type: "bandpass", freq: 880, q: 2.2 }, vibrato: { rate: 7.5, depth: 10 }, attack: 0.04, release: 0.38, t0: t + 0.05 });
      voice({ type: "sine", freq: [130, 210, 260, 240, 180], dur: 1.15, peak: 0.32, filter: { type: "lowpass", freq: 420, q: 1.2 }, attack: 0.04, release: 0.42, t0: t + 0.05 });
      voice({ type: "sine", freq: [48, 54, 50, 44], dur: 1.25, peak: 0.28, filter: { type: "lowpass", freq: 140, q: 1 }, attack: 0.06, release: 0.45, t0: t });
      // Secondary trumpet flare
      voice({ type: "sawtooth", freq: [380, 490, 440, 320], dur: 0.55, peak: 0.24, filter: { type: "bandpass", freq: 950, q: 2.4 }, vibrato: { rate: 7, depth: 8 }, attack: 0.03, release: 0.22, t0: t + 0.95 });
    },
    monkey: function (t) { whoop(t); whoop(t + 0.26); ah(t + 0.56); ah(t + 0.72); },
    sparrow: function (t) { sparrowChirp(t); },
    crow: function (t) { crowCaw(t); },
    owl: function (t) { owlHoot(t); },
    peacock: function (t) { peacockCall(t); },
    rooster: function (t) {
      voice({ type: "sawtooth", freq: [520, 640], dur: 0.16, peak: 0.2, filter: { type: "bandpass", freq: 1300, q: 2 }, attack: 0.02, release: 0.08, t0: t });
      voice({ type: "sawtooth", freq: [900, 900], dur: 0.12, peak: 0.2, filter: { type: "bandpass", freq: 1500, q: 2 }, attack: 0.02, release: 0.06, t0: t + 0.2 });
      voice({ type: "sawtooth", freq: [760, 1060, 900], dur: 0.34, peak: 0.22, filter: { type: "bandpass", freq: 1500, q: 2 }, tremolo: { rate: 12, depth: 0.3 }, attack: 0.02, release: 0.16, t0: t + 0.36 });
      voice({ type: "sawtooth", freq: [520, 400], dur: 0.3, peak: 0.18, filter: { type: "bandpass", freq: 1200, q: 2 }, attack: 0.02, release: 0.18, t0: t + 0.74 });
    },
    hen: function (t) { cluck(t); cluck(t + 0.15); cluck(t + 0.27); voice({ type: "sawtooth", freq: [700, 1000, 800], dur: 0.3, peak: 0.2, filter: { type: "bandpass", freq: 1600, q: 3 }, tremolo: { rate: 18, depth: 0.5 }, attack: 0.02, release: 0.16, t0: t + 0.45 }); },
    pigeon: function (t) { pigeonCoo(t); },
    parrot: function (t) { voice({ type: "sawtooth", freq: [1400, 900, 1600], dur: 0.3, peak: 0.2, filter: { type: "bandpass", freq: 2000, q: 4 }, tremolo: { rate: 30, depth: 0.6 }, attack: 0.01, release: 0.16, t0: t }); },
    eagle: function (t) { eagleCry(t); },
    zebra: function (t) { bray(t); },
    rhino: function (t) { grunt(t); grunt(t + 0.28); },
    deer: function (t) { deerCall(t); },
    giraffe: function (t) { giraffeHum(t); },
    alligator: function (t) { bellow(t); },
    crocodile: function (t) { bellow(t); },
    fox: function (t) {
      function yip(s) {
        voice({ type: "sawtooth", freq: [680, 840, 520], dur: 0.18, peak: 0.28, filter: { type: "bandpass", freq: 1400, q: 2.5 }, attack: 0.008, release: 0.12, drive: 2, t0: s });
      }
      yip(t); yip(t + 0.24);
    },
    wolf: function (t) {
      voice({ type: "sawtooth", freq: [220, 360, 480, 520, 490, 440, 330, 260], dur: 1.6, peak: 0.32, filter: { type: "bandpass", freq: 900, q: 2 }, vibrato: { rate: 6, depth: 10 }, attack: 0.2, release: 0.8, t0: t });
      voice({ type: "sine", freq: [110, 180, 240, 260, 245, 220, 165, 130], dur: 1.6, peak: 0.18, filter: { type: "lowpass", freq: 400, q: 1 }, attack: 0.2, release: 0.8, t0: t });
    },
    chicken: function (t) { A.hen(t); },
    snake: function (t) { hiss(t, 0.75); },
    panda: function (t) { pandaBleat(t); },
    rabbit: function (t) { rabbitSqueak(t); },
    swan: function (t) { swanBugle(t); },
    penguin: function (t) { penguinBray(t); },
    flamingo: function (t) { flamingoHonk(t); },
    bee: function (t) {
      // Change #13: a wing buzz that drifts closer, hovers and leaves (fast tremolo = wingbeats).
      voice({ type: "sawtooth", freq: [196, 214, 204, 220, 200], dur: 1.5, peak: 0.08, filter: { type: "bandpass", freq: 620, q: 1.4 },
        vibrato: { rate: 8, depth: 7 }, tremolo: { rate: 24, depth: 0.35 }, attack: 0.3, release: 0.55, t0: t });
      voice({ type: "square", freq: [392, 428, 408, 440, 400], dur: 1.5, peak: 0.022, filter: { type: "lowpass", freq: 1500, q: 0.7 },
        vibrato: { rate: 8, depth: 12 }, attack: 0.35, release: 0.55, t0: t });
    }
  };
  /* ---- Shared building-block calls (declarations, hoisted for A above) ---- */
  function roar(t, dur, base, drive) {
    voice({ type: "sawtooth", freq: [base * 1.2, base, base * 0.85, base * 0.95], dur: dur, peak: 0.3, filter: { type: "lowpass", freq: 520, q: 1 }, tremolo: { rate: 28, depth: 0.55 }, attack: 0.12, release: dur * 0.4, drive: drive, t0: t });
    var c = ctx(); if (!c) return;
    var n = noiseSrc(c), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "lowpass"; f.frequency.value = 350; n.connect(f); f.connect(g); g.connect(dest() || c.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.15); g.gain.setValueAtTime(0.12, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.start(t); stopAt(n, t + dur + 0.05);
  }
  function bleat(t, base, vib) {
    voice({ type: "sawtooth", freq: [base, base * 0.97, base * 1.02, base * 0.95], dur: 0.7, peak: 0.24, filter: { type: "bandpass", freq: 1000, q: 2 }, vibrato: { rate: vib, depth: 16 }, tremolo: { rate: vib, depth: 0.5 }, attack: 0.03, release: 0.22, t0: t });
  }
  /* Authentic Frog "Rib-bit! ... Rib-bit!" — realistic vocal sac flutter & resonant throat croak */
  function frogRibbit(t) {
    function singleRibbit(start, pitchMul, volMul) {
      var fBase = 160 * pitchMul;
      voice({
        type: "sawtooth",
        freq: [fBase, fBase * 1.35, fBase * 1.55],
        dur: 0.17,
        peak: 0.36 * volMul,
        filter: { type: "bandpass", freq: 620 * pitchMul, q: 3.2 },
        tremolo: { rate: 52, depth: 0.88 },
        drive: 2.8,
        attack: 0.012,
        release: 0.07,
        t0: start
      });
      voice({
        type: "sine",
        freq: [fBase * 0.7, fBase * 0.85],
        dur: 0.18,
        peak: 0.22 * volMul,
        filter: { type: "lowpass", freq: 260, q: 1.2 },
        attack: 0.015,
        release: 0.08,
        t0: start
      });
      noiseHit({ filter: { type: "bandpass", freq: 880, q: 2 }, dur: 0.08, peak: 0.06 * volMul, t0: start });

      var tBit = start + 0.12;
      voice({
        type: "sawtooth",
        freq: [380 * pitchMul, 310 * pitchMul, 220 * pitchMul],
        dur: 0.14,
        peak: 0.40 * volMul,
        filter: { type: "bandpass", freq: 890 * pitchMul, q: 3.6 },
        tremolo: { rate: 42, depth: 0.5 },
        drive: 3.0,
        attack: 0.008,
        release: 0.08,
        t0: tBit
      });
      voice({
        type: "sine",
        freq: [680 * pitchMul, 520 * pitchMul],
        dur: 0.12,
        peak: 0.18 * volMul,
        filter: { type: "bandpass", freq: 1100 * pitchMul, q: 2.5 },
        attack: 0.006,
        release: 0.06,
        t0: tBit
      });
    }

    singleRibbit(t, 1.0, 1.0);
    singleRibbit(t + 0.40, 1.14, 1.08);
  }
  function croak(t, base) {
    frogRibbit(t);
  }
  /* Duck "QUACK! QUACK! quack" — authentic, lively, raspy nasal duck call */
  function duckQuack(t) {
    function quackBurst(start, fBase, dur, peakVol) {
      // Primary throat-nasal formant (F1: ~780Hz) with syrinx reed buzz (42Hz tremolo)
      voice({
        type: "sawtooth",
        freq: [fBase * 0.82, fBase * 1.16, fBase, fBase * 0.78],
        dur: dur,
        peak: peakVol,
        filter: { type: "bandpass", freq: 780, q: 2.8 },
        tremolo: { rate: 42, depth: 0.65 },
        drive: 3.2,
        attack: 0.012,
        release: dur * 0.42,
        t0: start
      });
      // Bill horn flare formant (F2: ~1550Hz) giving the bright "AACK" resonance
      voice({
        type: "sawtooth",
        freq: [fBase * 1.64, fBase * 2.32, fBase * 2.0, fBase * 1.56],
        dur: dur * 0.92,
        peak: peakVol * 0.55,
        filter: { type: "bandpass", freq: 1550, q: 3.4 },
        tremolo: { rate: 42, depth: 0.6 },
        drive: 2.5,
        attack: 0.012,
        release: dur * 0.38,
        t0: start
      });
      // Sharp bill edge bite formant (F3: ~2700Hz)
      voice({
        type: "sawtooth",
        freq: [fBase * 2.46, fBase * 3.48, fBase * 3.0, fBase * 2.34],
        dur: dur * 0.75,
        peak: peakVol * 0.22,
        filter: { type: "bandpass", freq: 2700, q: 3.8 },
        attack: 0.01,
        release: dur * 0.35,
        t0: start
      });
      // Explosive bill-opening consonant transient ("QU-")
      noiseHit({
        filter: { type: "bandpass", freq: 1450, q: 1.8 },
        filterTo: 850,
        dur: 0.07,
        peak: peakVol * 0.22,
        t0: start
      });
    }

    // Classic lively 3-quack phrase: "QUACK! QUACK! quack"
    quackBurst(t, 360, 0.23, 0.42);
    quackBurst(t + 0.27, 330, 0.20, 0.36);
    quackBurst(t + 0.50, 290, 0.16, 0.26);
  }
  function quack(t) { duckQuack(t); }
  function oink(t) {
    voice({ type: "sawtooth", freq: [230, 180, 150], dur: 0.14, peak: 0.2, filter: { type: "lowpass", freq: 900, q: 1 }, tremolo: { rate: 35, depth: 0.6 }, attack: 0.01, release: 0.08, t0: t });
    noiseHit({ filter: { type: "lowpass", freq: 1100 }, dur: 0.1, peak: 0.07, t0: t });
  }
  function whoop(t) { voice({ type: "sine", freq: [400, 950, 620], dur: 0.2, peak: 0.2, filter: { type: "bandpass", freq: 1300, q: 2 }, attack: 0.01, release: 0.12, t0: t }); }
  function ah(t) { voice({ type: "sawtooth", freq: [320, 260], dur: 0.12, peak: 0.16, filter: { type: "bandpass", freq: 900, q: 2 }, attack: 0.01, release: 0.07, t0: t }); }
  function chirp(t, f0, f1) { voice({ type: "sine", freq: [f0, f1, f0 * 0.9], dur: 0.1, peak: 0.16, attack: 0.005, release: 0.05, t0: t }); }
  /* Sparrow lively melodic birdsong — sweet, bright, cheerful chirping phrase */
  function sparrowChirp(t) {
    function peep(start, f0, f1, f2) {
      voice({
        type: "sine",
        freq: [f0, f1, f2],
        dur: 0.09,
        peak: 0.28,
        filter: { type: "bandpass", freq: 3600, q: 2.8 },
        attack: 0.006,
        release: 0.045,
        t0: start
      });
      voice({
        type: "sawtooth",
        freq: [f0 * 1.05, f1 * 1.05, f2],
        dur: 0.075,
        peak: 0.08,
        filter: { type: "bandpass", freq: 4800, q: 3.5 },
        attack: 0.005,
        release: 0.035,
        t0: start
      });
    }
    peep(t, 2900, 4200, 3600);
    peep(t + 0.12, 3300, 4600, 4000);
    peep(t + 0.26, 2800, 4100, 3400);
    peep(t + 0.44, 3500, 4900, 4200);
  }
  /* Crow "Caw! Caw! Caw!" — iconic, throaty, resonant corvid caw with syrinx rasp */
  function crowCaw(t) {
    function singleCaw(start, fBase, dur, peakVol) {
      voice({
        type: "sawtooth",
        freq: [fBase, fBase * 0.9, fBase * 0.76],
        dur: dur,
        peak: peakVol,
        filter: { type: "bandpass", freq: 1350, q: 2.2 },
        tremolo: { rate: 36, depth: 0.58 },
        drive: 3.2,
        attack: 0.015,
        release: dur * 0.45,
        t0: start
      });
      voice({
        type: "sawtooth",
        freq: [fBase * 1.8, fBase * 1.6, fBase * 1.35],
        dur: dur * 0.85,
        peak: peakVol * 0.28,
        filter: { type: "bandpass", freq: 2400, q: 2.8 },
        attack: 0.018,
        release: dur * 0.4,
        t0: start
      });
      noiseHit({ filter: { type: "bandpass", freq: 1700, q: 1.6 }, dur: dur * 0.5, peak: 0.07, t0: start });
    }
    singleCaw(t, 760, 0.28, 0.34);
    singleCaw(t + 0.36, 710, 0.26, 0.32);
    singleCaw(t + 0.72, 670, 0.32, 0.30);
  }
  function caw(t) { crowCaw(t); }

  /* Eagle "Klee-klee-klee-KLEEE-err!" — majestic, high-altitude raptor scream with whistling chirps */
  function eagleCry(t) {
    function klee(start, f0, f1, dur, vol) {
      voice({
        type: "sawtooth",
        freq: [f0, f1, f0 * 1.1, f0 * 0.9],
        dur: dur,
        peak: vol,
        filter: { type: "bandpass", freq: (f0 + f1) * 0.6, q: 3.5 },
        vibrato: { rate: 9, depth: 16 },
        attack: 0.008,
        release: dur * 0.5,
        drive: 1.6,
        t0: start
      });
      voice({
        type: "sine",
        freq: [f0, f1, f0 * 0.9],
        dur: dur,
        peak: vol * 0.5,
        filter: { type: "lowpass", freq: 4000, q: 1 },
        attack: 0.008,
        release: dur * 0.45,
        t0: start
      });
    }
    klee(t, 2200, 2850, 0.09, 0.26);
    klee(t + 0.11, 2400, 3100, 0.09, 0.28);
    klee(t + 0.23, 2600, 3300, 0.10, 0.30);
    var tw = t + 0.36;
    voice({
      type: "sawtooth",
      freq: [2700, 3500, 3200, 2100, 1600],
      dur: 0.75,
      peak: 0.36,
      filter: { type: "bandpass", freq: 3000, q: 3.2 },
      vibrato: { rate: 8.5, depth: 22 },
      tremolo: { rate: 18, depth: 0.35 },
      attack: 0.015,
      release: 0.45,
      drive: 2.0,
      t0: tw
    });
    voice({
      type: "sine",
      freq: [2700, 3500, 3100, 2000, 1500],
      dur: 0.78,
      peak: 0.24,
      filter: { type: "lowpass", freq: 3600, q: 1 },
      attack: 0.015,
      release: 0.48,
      t0: tw
    });
    noiseHit({ filter: { type: "bandpass", freq: 3200, q: 1.8 }, dur: 0.25, peak: 0.06, t0: tw });
  }
  /* Owl "Hoo-hoo... Hoo-hoo!" — warm, deep, peaceful hollow forest hoot */
  function owlHoot(t) {
    function hoot(start, dur, f0, vol) {
      voice({
        type: "sine",
        freq: [f0 * 0.96, f0, f0 * 0.98, f0 * 0.92],
        dur: dur,
        peak: vol,
        filter: { type: "lowpass", freq: 520, q: 1.2 },
        vibrato: { rate: 5.5, depth: 6 },
        attack: 0.06,
        release: dur * 0.45,
        t0: start
      });
      voice({
        type: "sine",
        freq: [f0 * 1.95, f0 * 2.0, f0 * 1.88],
        dur: dur * 0.85,
        peak: vol * 0.22,
        filter: { type: "bandpass", freq: 660, q: 2.2 },
        attack: 0.05,
        release: dur * 0.4,
        t0: start
      });
      noiseHit({ filter: { type: "bandpass", freq: 650, q: 2.5 }, dur: dur * 0.6, peak: 0.04, t0: start });
    }
    hoot(t, 0.35, 330, 0.35);
    hoot(t + 0.46, 0.58, 305, 0.38);
    hoot(t + 1.15, 0.32, 330, 0.30);
    hoot(t + 1.52, 0.65, 295, 0.36);
  }
  function hoo(t) { owlHoot(t); }
  /* Peacock "May-AWE! May-AWE!" — majestic, trumpet-like wailing display call */
  function peacockCall(t) {
    function scream(start, pitch) {
      voice({
        type: "sawtooth",
        freq: [pitch * 0.75, pitch * 1.25, pitch, pitch * 0.85],
        dur: 0.62,
        peak: 0.38,
        filter: { type: "bandpass", freq: 1450, q: 2.6 },
        vibrato: { rate: 6.5, depth: 14 },
        drive: 2.8,
        attack: 0.04,
        release: 0.28,
        t0: start
      });
      voice({
        type: "sine",
        freq: [pitch * 0.4, pitch * 0.6, pitch * 0.45],
        dur: 0.65,
        peak: 0.24,
        filter: { type: "lowpass", freq: 600, q: 1.2 },
        attack: 0.04,
        release: 0.3,
        t0: start
      });
      noiseHit({ filter: { type: "bandpass", freq: 2200, q: 2 }, dur: 0.15, peak: 0.08, t0: start });
    }
    scream(t, 820);
    scream(t + 0.72, 780);
  }
  function cluck(t) { voice({ type: "square", freq: [1000, 480], dur: 0.06, peak: 0.16, filter: { type: "bandpass", freq: 1600, q: 6 }, attack: 0.004, release: 0.04, t0: t }); }
  /* Pigeon "Coo-roo-COO... coo-coo" — gentle, comforting hollow throat coo with soothing purr */
  function pigeonCoo(t) {
    function cooPhrase(start, fBase, dur, peakVol) {
      voice({
        type: "sine",
        freq: [fBase * 0.92, fBase * 1.15, fBase, fBase * 0.88],
        dur: dur,
        peak: peakVol,
        filter: { type: "lowpass", freq: 650, q: 1.2 },
        vibrato: { rate: 7.5, depth: 8 },
        tremolo: { rate: 16, depth: 0.35 },
        attack: 0.06,
        release: dur * 0.45,
        t0: start
      });
      voice({
        type: "sawtooth",
        freq: [fBase * 0.92, fBase * 1.15, fBase],
        dur: dur * 0.8,
        peak: peakVol * 0.15,
        filter: { type: "bandpass", freq: 850, q: 2.5 },
        attack: 0.07,
        release: dur * 0.4,
        t0: start
      });
    }
    cooPhrase(t, 380, 0.24, 0.22);
    cooPhrase(t + 0.26, 440, 0.42, 0.32);
    cooPhrase(t + 0.74, 390, 0.30, 0.20);
  }
  function coo(t) { pigeonCoo(t); }
  /* Zebra "bark-whinny" — wild zebras make a lively, high-pitched barking whinny:
     sharp "kwa-ha! kwa-ha!" yelps followed by a melodic whinny tail. */
  function bray(t) {
    function yelp(start, fBase, peakVol) {
      voice({ type: "sawtooth", freq: [fBase * 0.65, fBase, fBase * 0.75], dur: 0.17, peak: peakVol, filter: { type: "bandpass", freq: 1350, q: 2.6 }, drive: 2.8, attack: 0.008, release: 0.12, t0: start });
      voice({ type: "sine", freq: [240, 360, 270], dur: 0.15, peak: peakVol * 0.4, filter: { type: "lowpass", freq: 650, q: 1 }, attack: 0.01, release: 0.1, t0: start });
      noiseHit({ filter: { type: "bandpass", freq: 1600 }, dur: 0.07, peak: 0.08, t0: start });
    }
    yelp(t, 780, 0.38);
    yelp(t + 0.22, 920, 0.4);
    yelp(t + 0.44, 1020, 0.42);

    var tw = t + 0.66;
    voice({ type: "sawtooth", freq: [760, 680, 540, 420], dur: 0.42, peak: 0.26, filter: { type: "bandpass", freq: 1200, q: 2.2 }, tremolo: { rate: 22, depth: 0.5 }, vibrato: { rate: 12, depth: 14 }, attack: 0.02, release: 0.24, t0: tw });
    voice({ type: "sine", freq: [380, 340, 270, 210], dur: 0.4, peak: 0.16, filter: { type: "lowpass", freq: 500, q: 1 }, attack: 0.02, release: 0.22, t0: tw });
    noiseHit({ filter: { type: "lowpass", freq: 1200 }, dur: 0.15, peak: 0.06, t0: tw });
  }
  /* Rhino "snort-bellow" — powerful, deep guttural snort and horn chuff */
  function grunt(t) {
    voice({ type: "sawtooth", freq: [135, 110, 85], dur: 0.38, peak: 0.38, filter: { type: "lowpass", freq: 620, q: 1.8 }, tremolo: { rate: 32, depth: 0.6 }, drive: 3.8, attack: 0.015, release: 0.22, t0: t });
    voice({ type: "sine", freq: [72, 64, 56], dur: 0.4, peak: 0.28, filter: { type: "lowpass", freq: 200, q: 1 }, attack: 0.02, release: 0.25, t0: t });
    noiseHit({ filter: { type: "bandpass", freq: 850, q: 1.5 }, filterTo: 400, dur: 0.24, peak: 0.18, t0: t });

    var t2 = t + 0.36;
    voice({ type: "sawtooth", freq: [145, 120, 95], dur: 0.36, peak: 0.35, filter: { type: "lowpass", freq: 580, q: 1.8 }, tremolo: { rate: 28, depth: 0.55 }, drive: 3.5, attack: 0.015, release: 0.2, t0: t2 });
    voice({ type: "sine", freq: [78, 68, 60], dur: 0.38, peak: 0.24, filter: { type: "lowpass", freq: 200, q: 1 }, attack: 0.02, release: 0.22, t0: t2 });
    noiseHit({ filter: { type: "bandpass", freq: 950, q: 1.2 }, filterTo: 500, dur: 0.28, peak: 0.2, t0: t2 + 0.02 });
  }
  /* Deer "bellow/bark" — a nasal, throaty two-syllable call: lower & grittier than a
     goat's bleat, higher and shorter than a lion's roar, so it never sounds like either. */
  function deerCall(t) {
    voice({ type: "sawtooth", freq: [250, 210, 190, 170], dur: 0.5, peak: 0.26, filter: { type: "bandpass", freq: 720, q: 2.5 }, vibrato: { rate: 9, depth: 10 }, tremolo: { rate: 24, depth: 0.45 }, drive: 2, attack: 0.03, release: 0.24, t0: t });
    noiseHit({ filter: { type: "bandpass", freq: 1400 }, filterTo: 800, q: 0.8, dur: 0.18, peak: 0.06, t0: t });
    voice({ type: "sawtooth", freq: [230, 180], dur: 0.22, peak: 0.2, filter: { type: "bandpass", freq: 680, q: 2 }, tremolo: { rate: 26, depth: 0.4 }, drive: 2, attack: 0.02, release: 0.14, t0: t + 0.56 });
  }
  /* Giraffe "hum" — gentle, enchanting vocal flute-hum with warm harmonics & soft breath */
  function giraffeHum(t) {
    voice({ type: "sawtooth", freq: [260, 310, 280], dur: 0.48, peak: 0.35, filter: { type: "bandpass", freq: 620, q: 2.2 }, vibrato: { rate: 6.5, depth: 10 }, attack: 0.06, release: 0.24, t0: t });
    voice({ type: "sine", freq: [260, 310, 280], dur: 0.5, peak: 0.36, filter: { type: "lowpass", freq: 500, q: 1 }, attack: 0.05, release: 0.26, t0: t });

    var t2 = t + 0.44;
    voice({ type: "sawtooth", freq: [330, 290, 240], dur: 0.55, peak: 0.35, filter: { type: "bandpass", freq: 580, q: 2.2 }, vibrato: { rate: 6, depth: 9 }, attack: 0.06, release: 0.32, t0: t2 });
    voice({ type: "sine", freq: [330, 290, 240], dur: 0.58, peak: 0.36, filter: { type: "lowpass", freq: 480, q: 1 }, attack: 0.05, release: 0.34, t0: t2 });
    noiseHit({ filter: { type: "lowpass", freq: 700 }, dur: 0.3, peak: 0.08, t0: t2 + 0.25 });
  }
  /* Panda "bleat-honk" — giant pandas bleat like a soft lamb but lower and honkier;
     a gentle low bleat with a short nasal honk tail. Lower/softer than goat & sheep. */
  function pandaBleat(t) {
    voice({ type: "sawtooth", freq: [270, 262, 276, 258], dur: 0.5, peak: 0.22, filter: { type: "bandpass", freq: 780, q: 2 }, vibrato: { rate: 14, depth: 12 }, tremolo: { rate: 14, depth: 0.4 }, attack: 0.03, release: 0.24, t0: t });
    voice({ type: "sawtooth", freq: [300, 250, 225], dur: 0.26, peak: 0.18, filter: { type: "bandpass", freq: 620, q: 2 }, attack: 0.02, release: 0.16, t0: t + 0.52 });
    noiseHit({ filter: { type: "lowpass", freq: 900 }, dur: 0.12, peak: 0.05, t0: t + 0.52 });
  }
  /* Rabbit — bunnies are near-silent: two soft high squeaks then the famous hind-foot
     THUMP (a low filtered-noise thud). Gentle, and unmistakably not a bird chirp. */
  function rabbitSqueak(t) {
    voice({ type: "sine", freq: [1150, 1320, 1050], dur: 0.1, peak: 0.16, filter: { type: "bandpass", freq: 1600, q: 3 }, attack: 0.006, release: 0.06, t0: t });
    voice({ type: "sine", freq: [1240, 1400, 1120], dur: 0.1, peak: 0.15, filter: { type: "bandpass", freq: 1700, q: 3 }, attack: 0.006, release: 0.06, t0: t + 0.16 });
    var c = ctx(); if (!c) return;
    var n = noiseSrc(c), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "lowpass"; f.frequency.value = 180; f.Q.value = 1;
    n.connect(f); f.connect(g); g.connect(dest() || c.destination);
    var tt = t + 0.34;
    g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.3, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.16);
    n.start(tt); stopAt(n, tt + 0.2);
  }
  /* Swan "bugle" — majestic, resonant trumpeting bugle with mellow body & breathy air */
  function swanBugle(t) {
    function note(start, fBase, dur, peakVol) {
      voice({
        type: "sawtooth",
        freq: [fBase * 0.9, fBase * 1.15, fBase, fBase * 0.92],
        dur: dur,
        peak: peakVol,
        filter: { type: "bandpass", freq: 880, q: 2.2 },
        vibrato: { rate: 6, depth: 8 },
        attack: 0.04,
        release: dur * 0.4,
        drive: 1.8,
        t0: start
      });
      voice({
        type: "sine",
        freq: [fBase * 0.9, fBase * 1.15, fBase, fBase * 0.92],
        dur: dur + 0.04,
        peak: peakVol * 0.65,
        filter: { type: "lowpass", freq: 500, q: 1 },
        attack: 0.04,
        release: dur * 0.45,
        t0: start
      });
      noiseHit({ filter: { type: "bandpass", freq: 1250, q: 1.5 }, filterTo: 750, dur: dur * 0.5, peak: 0.06, t0: start });
    }
    note(t, 380, 0.42, 0.32);
    note(t + 0.48, 330, 0.48, 0.28);
  }
  /* Penguin "bray" — energetic, authentic penguin trumpet bray: rhythmic chuffs building into an ecstatic display call */
  function penguinBray(t) {
    function chuff(start, pitch, dur, vol) {
      voice({
        type: "sawtooth",
        freq: [pitch, pitch * 1.25, pitch * 0.95],
        dur: dur,
        peak: vol,
        filter: { type: "bandpass", freq: 1450, q: 2.4 },
        tremolo: { rate: 26, depth: 0.45 },
        drive: 2.2,
        attack: 0.008,
        release: dur * 0.5,
        t0: start
      });
      voice({
        type: "sine",
        freq: [pitch * 0.5, pitch * 0.6, pitch * 0.48],
        dur: dur,
        peak: vol * 0.4,
        filter: { type: "lowpass", freq: 650, q: 1 },
        attack: 0.01,
        release: dur * 0.5,
        t0: start
      });
    }
    // Staccato rhythmic pumps
    chuff(t, 460, 0.12, 0.26);
    chuff(t + 0.15, 520, 0.13, 0.30);
    chuff(t + 0.31, 580, 0.14, 0.34);
    // Main ecstatic bray
    var tw = t + 0.48;
    voice({
      type: "sawtooth",
      freq: [680, 840, 720, 560],
      dur: 0.55,
      peak: 0.36,
      filter: { type: "bandpass", freq: 1650, q: 2.8 },
      tremolo: { rate: 22, depth: 0.55 },
      vibrato: { rate: 11, depth: 14 },
      drive: 2.5,
      attack: 0.02,
      release: 0.32,
      t0: tw
    });
    voice({
      type: "sine",
      freq: [340, 420, 360, 280],
      dur: 0.58,
      peak: 0.22,
      filter: { type: "lowpass", freq: 600, q: 1 },
      attack: 0.02,
      release: 0.34,
      t0: tw
    });
    noiseHit({ filter: { type: "bandpass", freq: 1800, q: 2 }, dur: 0.2, peak: 0.08, t0: tw });
  }
  /* Flamingo "honk" — rich, resonant nasal flock honk with throat rattle */
  function flamingoHonk(t) {
    function nasalHonk(start, fBase, dur, peakVol) {
      voice({
        type: "sawtooth",
        freq: [fBase * 0.85, fBase * 1.18, fBase, fBase * 0.9],
        dur: dur,
        peak: peakVol,
        filter: { type: "bandpass", freq: 980, q: 2.8 },
        tremolo: { rate: 28, depth: 0.5 },
        drive: 2.6,
        attack: 0.012,
        release: dur * 0.45,
        t0: start
      });
      voice({
        type: "sawtooth",
        freq: [fBase * 1.7, fBase * 2.3, fBase * 1.8],
        dur: dur * 0.85,
        peak: peakVol * 0.35,
        filter: { type: "bandpass", freq: 1650, q: 3.2 },
        attack: 0.015,
        release: dur * 0.4,
        t0: start
      });
      voice({
        type: "sine",
        freq: [fBase * 0.9, fBase, fBase * 0.85],
        dur: dur,
        peak: peakVol * 0.4,
        filter: { type: "lowpass", freq: 450, q: 1 },
        attack: 0.015,
        release: dur * 0.4,
        t0: start
      });
      noiseHit({ filter: { type: "bandpass", freq: 1100, q: 1.8 }, dur: 0.12, peak: 0.08, t0: start });
    }
    nasalHonk(t, 290, 0.24, 0.34);
    nasalHonk(t + 0.32, 270, 0.28, 0.36);
  }
  /* Alligator / Crocodile "bellow" — deep, powerful, throaty reptile rumble */
  function bellow(t) {
    voice({ type: "sawtooth", freq: [90, 80, 75, 85], dur: 1.1, peak: 0.45, filter: { type: "lowpass", freq: 420, q: 1.5 }, tremolo: { rate: 32, depth: 0.65 }, drive: 5, attack: 0.06, release: 0.5, t0: t });
    var c = ctx(); if (!c) return;
    var n = noiseSrc(c), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "lowpass"; f.frequency.value = 350; n.connect(f); f.connect(g); g.connect(dest() || c.destination);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.12); g.gain.setValueAtTime(0.2, t + 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    n.start(t); stopAt(n, t + 1.15);
  }
  /* Snake "hiss" — pure filtered noise, high and airy, with a slow shimmer. */
  function hiss(t, dur) {
    var c = ctx(); if (!c) return; dur = dur || 0.7;
    var n = noiseSrc(c), f = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
    f.type = "highpass"; f.frequency.value = 2600;
    f2.type = "bandpass"; f2.frequency.value = 5200; f2.Q.value = 0.8;
    n.connect(f); f.connect(f2); f2.connect(g); g.connect(dest() || c.destination);
    var peak = 0.14;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.08);
    g.gain.setValueAtTime(peak, t + dur - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    var tl = c.createOscillator(), tg = c.createGain();
    tl.type = "sine"; tl.frequency.value = 11; tg.gain.value = peak * 0.5;
    tl.connect(tg); tg.connect(g.gain); tl.start(t); stopAt(tl, t + dur + 0.05);
    n.start(t); stopAt(n, t + dur + 0.05);
  }

  Kido.animalSynth = {
    has: function (key) { return !!A[key]; },
    play: function (key) {
      var fn=A[key]; if(!fn)return null;
      scheduledNodes=[];lastEnd=0;lastNode=null;fn(T());
      var nodes=scheduledNodes,endNode=lastNode;scheduledNodes=null;
      var resolve,ended=false;
      var handle={done:new Promise(function(r){resolve=r;}),stop:function(){nodes.forEach(function(n){try{n.stop();}catch(e){}});finish();}};
      function finish(){if(ended)return;ended=true;nodes.forEach(function(n){try{n.disconnect();}catch(e){}});resolve();}
      if(endNode)endNode.onended=finish;else finish();return handle;
    }
  };
})(window);
