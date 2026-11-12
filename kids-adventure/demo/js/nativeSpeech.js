/* =========================================================================
   nativeSpeech.js — Kido's voice inside the Android app (Change #19).
   Android's system WebView has no Web Speech voice (window.speechSynthesis
   is missing), so inside the native Android app every spoken line would be
   silent. When — and only when — that is the case and the app's on-device
   text-to-speech plugin (@capacitor-community/text-to-speech) is present,
   this file provides a small stand-in for speechSynthesis /
   SpeechSynthesisUtterance that hands each line to the phone's own TTS
   engine. js/audio.js then works unchanged.
   Browsers, the PWA and iOS keep their built-in speechSynthesis: this file
   does nothing there. Must load before js/audio.js.
   ========================================================================= */
(function (window) {
  "use strict";
  if (window.speechSynthesis) return;
  var cap = window.Capacitor;
  if (!cap) return;
  var NAME = "TextToSpeech";

  function plugin() { return cap.Plugins && cap.Plugins[NAME]; }
  function present() {
    if (plugin()) return true;
    var h = cap.PluginHeaders;                     // the native bridge lists the plugins it carries
    return !!(h && h.some && h.some(function (p) { return p && p.name === NAME; }) && typeof cap.nativePromise === "function");
  }
  if (!present()) return;

  function call(method, opts) {
    var p = plugin();
    try {
      if (p && typeof p[method] === "function") return Promise.resolve(p[method](opts || {}));
      return Promise.resolve(cap.nativePromise(NAME, method, opts || {}));
    } catch (e) { return Promise.reject(e); }
  }
  function clamp(v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; }
  function noop() {}

  function Utterance(text) {
    this.text = String(text == null ? "" : text);
    this.lang = "en-US"; this.voice = null; this.rate = 1; this.pitch = 1; this.volume = 1;
    this.onstart = null; this.onend = null; this.onerror = null;
  }

  var queue = [], current = null, nativeVoices = [];
  // Hindi when the default engine has none (Samsung TTS on a Galaxy Tab S6 has no Hindi): KidoTtsPlugin speaks it
  // through Google's engine on the same device. Probed once at start-up; until then Hindi behaves as before.
  var hindiViaGoogle = false, extraVoices = [];
  function kidoTts() { return cap.Plugins && cap.Plugins.KidoTts; }
  function fire(u, name, extra) {
    var fn = u && u["on" + name];
    if (typeof fn !== "function") return;
    var ev = { type: name, utterance: u };
    if (extra) for (var k in extra) ev[k] = extra[k];
    try { fn.call(u, ev); } catch (e) {}
  }
  function next() {
    if (current || !queue.length) return;
    var u = current = queue.shift();
    fire(u, "start");
    if (hindiViaGoogle && /^hi/i.test(u.lang || "")) {
      kidoTts().speak({ text: u.text, lang: "hi-IN", rate: clamp(u.rate, 0.1, 2, 1), pitch: clamp(u.pitch, 0.5, 2, 1), volume: clamp(u.volume, 0, 1, 1) })
        .then(function () { done(u, null); }, function (err) { done(u, err || {}); });
      return;
    }
    call("speak", {
      text: u.text, lang: u.lang || "en-US",
      rate: clamp(u.rate, 0.1, 2, 1), pitch: clamp(u.pitch, 0.5, 2, 1), volume: clamp(u.volume, 0, 1, 1),
      category: "playback", queueStrategy: 0, voice: u.voice ? nativeVoices.indexOf(u.voice) : undefined
    }).then(function () { done(u, null); }, function (err) { done(u, err || {}); });
  }
  function done(u, err) {
    if (current !== u) return;                       // it was cancelled; its error event already fired
    current = null;
    if (err) fire(u, "error", { error: "synthesis-failed" }); else fire(u, "end");
    next();
  }

  window.SpeechSynthesisUtterance = window.SpeechSynthesisUtterance || Utterance;
  window.speechSynthesis = {
    get speaking() { return !!current; },
    get pending() { return queue.length > 0; },
    get paused() { return false; },
    speak: function (u) { if (u) { queue.push(u); next(); } },
    cancel: function () {
      var was = current, waiting = queue.splice(0);
      current = null;
      call("stop").catch(noop);
      if (hindiViaGoogle) kidoTts().stop().catch(noop);
      if (was) fire(was, "error", { error: "interrupted" });
      waiting.forEach(function (u) { fire(u, "error", { error: "canceled" }); });
    },
    pause: noop, resume: noop,
    getVoices: function () { return nativeVoices.concat(extraVoices); },   // the device picks its own voice for the language
    onvoiceschanged: null,
    _native: true
  };
  function voicesChanged() { if (typeof window.speechSynthesis.onvoiceschanged === "function") window.speechSynthesis.onvoiceschanged(); }
  call('getSupportedVoices').then(function(result){
    nativeVoices=result.voices||[];
    voicesChanged();
  }).catch(noop);
  call("isLanguageSupported", { lang: "hi-IN" }).then(function (r) {
    if ((r && r.supported) || !kidoTts()) return;
    return kidoTts().info({ lang: "hi-IN" }).then(function (i) {
      if (!i || !i.available) return;
      hindiViaGoogle = true;
      extraVoices = [{ name: "Google हिन्दी", lang: "hi-IN", voiceURI: "kido-google-hi-IN", localService: !!i.offline, default: false }];
      voicesChanged();
    });
  }).catch(noop);
})(window);
