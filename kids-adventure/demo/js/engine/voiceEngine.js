/* =========================================================================
   voiceEngine.js — Kido.Voice: narration, character voices, instructions,
   questions, story dialogue and discovery explanations (English + Hindi).

     Kido.Voice.say("Where does the elephant live?", { kind: "question" })
       .then(function (r) { … r.spoken, r.source });      // async, resolves on finish

   Each line is looked up in this order — so a studio recording (or a future
   generated voice) drops in with zero code changes:
     1. a pre-recorded file   (audioRegistry.voice[id], or a legacy
                               Kido.audio.register("voice.<id>", url))
     2. a voice provider      (Kido.Voice.setProvider(fn) — optional, e.g. a
                               TTS service returning an audio URL; never required)
     3. the device voice      (speechSynthesis via Kido.audio.speak)
   All three play on the VOICE channel (volume, mute, music/ambience dip under
   it) and raise a caption event; the words are always on screen as well.

   Praise/encouragement come from varied pools so it never sounds robotic,
   and we NEVER say "wrong" — only "Almost!" / "Let's try again".
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var A = function () { return Kido.audio; };
  var AM = function () { return Kido.AudioManager; };
  var REG = function () { return Kido.audioRegistry || { voices: {}, voice: {} }; };

  var PRAISE = {
    en: [
      "Spot on! You nailed it, superstar!",
      "Oh wow, wonderful job! You've got great ears!",
      "Incredible! High five, you did it!",
      "Yes! Look at you go, fantastic!",
      "Superstar listening! That is spot on!",
      "You got it! Wonderful work, explorer!",
      "Nailed it! That was brilliant!",
      "High five! You're doing amazing!",
      "That's it! Wonderful job!",
      "Woohoo! You are so sharp today!"
    ],
    hi: ["शाबाश! तुमने कर दिखाया!", "बहुत बढ़िया! एकदम सही!", "वाह! कमाल कर दिया!", "शानदार! बहुत अच्छे!", "अरे वाह! तुमने ढूंढ लिया!"]
  };
  var ENCOURAGE = {
    en: [
      "Ooh, so close! Let's listen together one more time.",
      "Nice try, explorer! Give it another listen, you can do it!",
      "Nearly there! Let's have another go.",
      "Good thinking! Listen closely... who do you think it is?",
      "Almost! Take a breath, you've got this!"
    ],
    hi: ["अरे! बहुत करीब, एक बार और सुनो।", "कोई बात नहीं! फिर से कोशिश करो, तुम कर सकते हो।", "लगभग हो गया! एक बार और।"]
  };
  var CHEER = {
    en: [
      "Whoa, incredible work today! You explored the whole jungle and did it all!",
      "You're an absolute champion! Give yourself a big round of applause!",
      "Hooray! What an adventure, you solved every single one!",
      "You are a true superstar explorer! Fantastic job!"
    ],
    hi: ["वाह! तुमने सब पूरा कर लिया! तुम सच्चे चैंपियन हो!", "कमाल कर दिया! बहुत खूब!"]
  };

  var last = {};
  function pick(a, key) {             // varied, and never the same line twice running
    var opts = a.filter(function (x) { return x !== last[key]; });
    var v = (opts.length ? opts : a)[(Math.random() * (opts.length || a.length)) | 0];
    last[key] = v;
    return v;
  }
  function bcp(l) { return l === "hi" ? "hi-IN" : "en-US"; }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
  }

  var lang = "en";
  var gen = 0;                        // bumps on stop(): anything older resolves quietly
  var queueP = Promise.resolve();
  var provider = null;

  /** A recorded file for this line, if one exists. */
  function recordingFor(id) {
    if (!id) return null;
    var e = REG().voice[id];
    if (e && e.available === true && e.sound) return (REG().basePath || "assets/audio/") + e.sound;
    return null;
  }

  function run(text, o) {
    var my = gen;
    var kind = o.kind || "narration";
    var style = REG().voices[kind] || {};
    var pitch = o.pitch != null ? o.pitch : style.pitch;
    var rate = o.rate != null ? o.rate : style.rate;
    var meta = { text: text, speaker: o.speaker || null, kind: kind };
    function result(spoken, source) { if (o.onEnd) { try { o.onEnd(); } catch (e) {} } return { spoken: !!spoken, source: source }; }
    function tts() {
      if (my !== gen) return Promise.resolve(result(false, "none"));
      return A().speak(text, { lang: bcp(o.lang || lang), pitch: pitch, rate: rate, speaker: o.speaker, kind: kind, chime: o.chime })
        .then(function (spoke) { return result(spoke, spoke ? "tts" : "none"); });
    }
    // Legacy registered buffers (Kido.audio.register("voice.<id>", url)) still win.
    if (o.id && A().assets && A().assets["voice." + o.id] && A().assets["voice." + o.id].buffer) {
      A().playAsset("voice." + o.id);
      return Promise.resolve(result(true, "recording"));
    }
    var file = recordingFor(o.id) || recordingFor(text);    // generated clips are keyed by their exact text (voiceClips.js)
    if (file && AM() && AM().playVoice) {
      return AM().playVoice(file, meta).then(function (ok) { return ok ? result(true, "recording") : tts(); });
    }
    if (provider) {
      return Promise.resolve().then(function () { return provider(text, { kind: kind, lang: o.lang || lang, speaker: o.speaker, id: o.id }); })
        .then(function (url) { return url && AM() ? AM().playVoice(url, meta) : false; })
        .catch(function () { return false; })
        .then(function (ok) { return ok ? result(true, "provider") : tts(); });
    }
    return tts();
  }

  var Voice = Kido.Voice = {
    setLang: function (l) { lang = (l === "hi") ? "hi" : "en"; return this; },
    lang: function () { return lang; },
    /** Bumps on stop() (e.g. a screen change): a multi-part line checks it before its next part. */
    generation: function () { return gen; },

    /** Speak a line. opts: { id, kind, speaker, pitch, rate, lang, queue, onEnd, chime }
        kind: narration | instruction | question | dialogue | discovery | praise | encourage
        queue:true waits for the line(s) already queued; otherwise the current line is replaced.
        Resolves { spoken, source: "recording" | "provider" | "tts" | "none" }. */
    say: function (text, opts) {
      opts = opts || {};
      if (!text) return Promise.resolve({ spoken: false, source: "none" });
      if (opts.queue) {
        var g0 = gen;                          // stop() or a new line cancels what is still waiting
        var p = queueP.then(function () { return g0 === gen ? run(text, opts) : { spoken: false, source: "none" }; });
        queueP = p.catch(function () {});
        return p;
      }
      gen++;                                   // a new line replaces anything queued
      queueP = Promise.resolve();
      if (AM() && AM().stopVoice) AM().stopVoice();
      var p2 = run(text, opts);
      queueP = p2.catch(function () {});
      return p2;
    },
    /** Several lines, one after another. */
    sequence: function (lines, opts) {
      var self = this;
      return (lines || []).reduce(function (p, t, i) {
        return p.then(function () { return self.say(t, Object.assign({}, opts, { queue: i > 0 })); });
      }, Promise.resolve());
    },
    stop: function () {
      gen++;
      queueP = Promise.resolve();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (AM() && AM().stopVoice) AM().stopVoice();
    },
    isSpeaking: function () { return !!(AM() && AM().voiceActive && AM().voiceActive()); },
    /** Caption / transcript hooks: fn({ text, speaker, kind }) for every spoken line. */
    onCaption: function (fn) { return AM() ? AM().on("caption", fn) : function () {}; },
    onEnd: function (fn) { return AM() ? AM().on("voice:end", fn) : function () {}; },
    transcript: function () { return AM() ? AM().transcript() : []; },
    /** Optional generated-voice hook: fn(text, info) → Promise<audio URL | null>. */
    setProvider: function (fn) { provider = typeof fn === "function" ? fn : null; return this; },
    pace: function () { return A().pace ? A().pace() : 1; },

    /* ---- the original helpers (scenes use these) ---- */
    /** Instruction / prompt — calm and clear. */
    speakInstruction: function (text, id) {
      if (!text) return Promise.resolve({ spoken: false });
      return this.say(text, { id: id || slug(text), kind: /\?\s*$/.test(text) ? "question" : "instruction" });
    },
    /** A single word/letter, spoken clearly at natural tempo. */
    speakWord: function (word, id) { return this.say(word, { id: "word." + (id || slug(word)), kind: "instruction" }); },
    /** Positive reinforcement + happy chime. */
    speakCorrect: function (opts) {
      opts = opts || {};
      var l = opts.lang || lang;
      A().playCorrectSound();
      return this.say(opts.text || pick(PRAISE[l] || PRAISE.en, "praise" + l), { id: "praise", kind: "praise", lang: l });
    },
    /** Gentle "try again" — warm, companion-like, never punishing. */
    speakEncouragement: function (opts) {
      opts = opts || {};
      var l = opts.lang || lang;
      A().playIncorrectSound();
      return this.say(opts.text || pick(ENCOURAGE[l] || ENCOURAGE.en, "enc" + l), { id: "encourage", kind: "encourage", lang: l });
    },
    /** Big finish. */
    speakCheer: function (opts) {
      opts = opts || {};
      var l = opts.lang || lang;
      A().playCelebrationSound();
      return this.say(opts.text || pick(CHEER[l] || CHEER.en, "cheer" + l), { id: "cheer", kind: "praise", lang: l });
    },
    /** Longer scripted narration (story beats). */
    playNarration: function (id, text, opts) {
      opts = opts || {};
      return this.say(text, { id: "narr." + id, kind: "narration", lang: opts.lang });
    }
  };
})(window);
