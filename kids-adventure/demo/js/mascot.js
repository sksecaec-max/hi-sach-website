/* =========================================================================
   mascot.js — "Momo", the original guide character (now fully alive)
   Momo is the app's friendly fox-cub guide. Everywhere outside a scene we
   reuse the SAME rigged SVG character as the Scene Engine (js/engine/
   characters.js + scene.css), so Momo breathes, blinks, looks around and
   changes expression to match what he's saying — instead of a flat picture.
   Falls back to a static inline SVG if the character rig isn't loaded yet.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  // Static fallback (also exposed as Kido.mascot.svg for any older consumer).
  var SVG = [
    '<svg class="mascot-avatar anim-bounce" viewBox="0 0 100 100" role="img" aria-label="Momo the fox">',
      '<ellipse cx="50" cy="92" rx="26" ry="6" fill="rgba(43,33,81,.15)"/>',
      '<path d="M22 40 Q18 12 40 26 Z" fill="#FF9E57"/>',
      '<path d="M78 40 Q82 12 60 26 Z" fill="#FF9E57"/>',
      '<path d="M26 36 Q24 20 37 28 Z" fill="#FFD3A8"/>',
      '<path d="M74 36 Q76 20 63 28 Z" fill="#FFD3A8"/>',
      '<circle cx="50" cy="56" r="32" fill="#FFB673"/>',
      '<path d="M50 34 Q34 44 30 60 Q50 70 70 60 Q66 44 50 34Z" fill="#FFE7CC"/>',
      '<circle cx="40" cy="52" r="6.5" fill="#2B2151"/>',
      '<circle cx="60" cy="52" r="6.5" fill="#2B2151"/>',
      '<circle cx="42" cy="50" r="2" fill="#fff"/>',
      '<circle cx="62" cy="50" r="2" fill="#fff"/>',
      '<path d="M46 62 Q50 66 54 62 Z" fill="#6C4BD6"/>',
      '<path d="M50 65 Q50 70 45 70" fill="none" stroke="#2B2151" stroke-width="2" stroke-linecap="round"/>',
      '<path d="M50 65 Q50 70 55 70" fill="none" stroke="#2B2151" stroke-width="2" stroke-linecap="round"/>',
      '<circle cx="33" cy="60" r="4" fill="#FF6B8A" opacity=".5"/>',
      '<circle cx="67" cy="60" r="4" fill="#FF6B8A" opacity=".5"/>',
    '</svg>'
  ].join("");

  var hideTimer = null;
  var momoOff = false;   // Change #28: hidden by the Momo button (session only)
  var actor = null;      // cached rigged Kido.Characters instance
  var bubbleEl = null;
  var lastReact = 0;     // Momo's little sounds are rare treats, not a running commentary
  var REACT = { celebrating: "mascot.cheer", excited: "mascot.excited", happy: "mascot.happy" };
  function react(id, force) {
    var now = Date.now();
    if (!id || !Kido.audio || !Kido.audio.cue) return;
    if (!force && now - lastReact < 9000) return;
    lastReact = now;
    Kido.audio.cue(id);
  }

  function layerEl() { return document.getElementById("mascot"); }

  // Build (once) the live rigged Momo + a speech bubble inside #mascot.
  function ensureActor(layer) {
    if (!Kido.Characters || !Kido.Characters.create) return null;
    if (actor && actor.el && actor.el.parentNode === layer) return actor;
    layer.innerHTML = "";
    actor = Kido.Characters.create("momo", { size: 88, className: "mascot-momo" });
    layer.appendChild(actor.el);
    bubbleEl = document.createElement("div");
    bubbleEl.className = "mascot-bubble";
    layer.appendChild(bubbleEl);
    // Tap Momo — or focus him and press Enter/Space — and he greets the child in his recorded voice (Kokoro af_heart)
    // (audioRegistry.voice["momo.greeting"]; the device voice reads the same words if the file can't play).
    // Taps while he is still talking are ignored, so the greeting never overlaps itself. Kido.Voice plays on the
    // voice channel, so mute/volume apply, and a screen change stops it (navigation.js leaveAudio).
    actor.el.setAttribute("role", "button");
    actor.el.setAttribute("tabindex", "0");
    var greeting = null;
    var replay = function () {
      if (greeting || !Kido.Voice) return;
      react("mascot.greet", true);
      var line = (Kido.audioRegistry && Kido.audioRegistry.voice["momo.greeting"]) || {};
      greeting = Kido.Voice.say(line.text || "Hello, little explorer!", { id: "momo.greeting", kind: "dialogue", speaker: "Momo" });
      greeting.then(function () { greeting = null; }, function () { greeting = null; });
      talk(greeting);
      actor.set("excited").pose("jump");
    };
    actor.el.addEventListener("click", replay);
    actor.el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); replay(); }
    });
    return actor;
  }

  // Pick an expression from the words (or an explicit opts.mood).
  function moodFor(text, opts) {
    if (opts.mood) return opts.mood;
    var t = " " + String(text).toLowerCase() + " ";
    if (/perfect|superstar|amazing|hooray|wonderful|great job|champion|fantastic|brilliant|you're a star|well done/.test(t)) return "celebrating";
    if (/try again|almost|oops|nearly|so close|have another|once more/.test(t)) return "thinking";
    if (/earn .* stars|locked|🔒/.test(t)) return "surprised";
    if (/!|let's|explore|ready|yay|woohoo|adventure/.test(t)) return "excited";
    return "happy";
  }

  Kido.mascot = {
    svg: SVG,

    /** Show Momo with a message. Speaks it unless {silent:true}.
        opts: { mood, pose, silent, hold, duration } */
    say: function (text, opts) {
      opts = opts || {};
      var layer = layerEl();
      if (!layer) return;
      layer.hidden = false;

      var a = ensureActor(layer);
      if (a) {
        var mood = moodFor(text, opts);
        a.set(mood).look(6, -2);
        if (opts.pose) a.pose(opts.pose);
        else if (mood === "celebrating") a.pose("cheer");
        else if (mood === "excited") a.pose("jump");
        else a.pose("nod");

        // Replay a little entrance bob each time Momo speaks.
        a.el.classList.remove("mascot-pop");
        void a.el.offsetWidth;
        a.el.classList.add("mascot-pop");

        if (bubbleEl) {
          bubbleEl.innerHTML = escapeHtml(text);
          bubbleEl.classList.remove("mascot-bubble--pop");
          void bubbleEl.offsetWidth;
          bubbleEl.classList.add("mascot-bubble--pop");
        }
      } else {
        // Rig not available — original static behaviour.
        layer.innerHTML = SVG + '<div class="mascot-bubble">' + escapeHtml(text) + "</div>";
      }

      var isDevanagari = /[\u0900-\u097F]/.test(text);
      var lang = opts.lang || (isDevanagari ? "hi-IN" : "en-US");
      if (a && !opts.silent && opts.sound !== false) react(REACT[moodFor(text, opts)]);
      if (!opts.silent && opts.parts) {
        // A line glued from parts ("That's a Cat!" + "Let's find the Zebra!") is spoken part by part, so each part
        // can be a recorded clip. The bubble shows the whole line. Later parts are dropped when anything else
        // starts talking or the voice is stopped (screen change).
        var gen0 = Kido.Voice && Kido.Voice.generation ? Kido.Voice.generation() : 0, seen = null;
        talk(opts.parts.reduce(function (p, part) {
          return p.then(function (go) {
            if (go === false || (seen !== null && Kido.audio.spoke() !== seen) ||
                (Kido.Voice && Kido.Voice.generation && Kido.Voice.generation() !== gen0)) return false;
            var s = Kido.audio.speak(part, { lang: lang, rate: opts.rate, pitch: opts.pitch, speaker: "Momo" });
            seen = Kido.audio.spoke();
            return s;
          });
        }, Promise.resolve(true)).then(function () { if (opts.onEnd) opts.onEnd(); }));
      } else if (!opts.silent) {
        talk(Kido.audio.speak(text, {
          lang: lang,
          rate: opts.rate,
          pitch: opts.pitch,
          onEnd: opts.onEnd,
          speaker: "Momo"
        }));
      }
      clearTimeout(hideTimer);
      if (opts.hold !== true) {
        hideTimer = setTimeout(Kido.mascot.hide, opts.duration || 3600);
      }
    },

    /** Move Momo's mouth while a line (a promise) is being spoken elsewhere. */
    talk: function (p) { talk(p); },

    /** The live rigged Momo (null until he first appears); js/mascotLife.js moves and animates him. */
    actor: function () { return actor; },

    /* Change #28: the Momo button (topbar + scene HUD, any .js-momo-toggle) hides Momo and his bubble.
       Visual only (his lines are still spoken); held for this app session, nothing is deleted. */
    isHidden: function () { return momoOff; },
    setHidden: function (off) {
      momoOff = !!off;
      document.documentElement.classList.toggle("momo-off", momoOff);
      Kido.mascot.refreshButton();
    },
    refreshButton: function () {
      Array.prototype.forEach.call(document.querySelectorAll(".js-momo-toggle"), function (b) {
        if (!b.firstElementChild && Kido.icons && Kido.icons.momo) b.innerHTML = Kido.icons.momo();
        b.classList.toggle("is-off", momoOff);
        b.setAttribute("aria-pressed", momoOff ? "false" : "true");
        b.setAttribute("aria-label", momoOff ? "Show Momo" : "Hide Momo");
        b.setAttribute("title", momoOff ? "Momo: Hidden" : "Momo: On");
      });
    },

    hide: function () {
      var layer = layerEl();
      if (!layer) return;
      layer.hidden = true;
      if (bubbleEl) bubbleEl.innerHTML = "";
      if (actor) { actor.set("happy").pose("idle").look(0, 0); }   // relax, keep him cached
    }
  };

  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest(".js-momo-toggle");
    if (!b) return;
    if (Kido.audio && Kido.audio.playTapSound) Kido.audio.playTapSound();
    Kido.mascot.setHidden(!momoOff);
  });
  document.addEventListener("DOMContentLoaded", function () { Kido.mascot.refreshButton(); });

  // Momo's mouth moves while his line is spoken.
  function talk(p) {
    if (!actor || !actor.el || !p || !p.then) return;
    var el = actor.el;
    el.classList.add("is-talking");
    p.then(function () { el.classList.remove("is-talking"); }, function () { el.classList.remove("is-talking"); });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
})(window);
