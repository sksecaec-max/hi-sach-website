/* =========================================================================
   ageConfig.js — Age-adaptive engine  (ages 3–10)
   The selected age band drives real gameplay everywhere: number range, how
   many answer options appear, word length, animation speed, reading load, and
   which math operations / scene steps are unlocked. Scenes and the classic
   game engine both read from here — change the band and the games change.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  // Ordered so we can find "next/previous" bands and compare difficulty.
  var BANDS = ["2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10"];

  var ageConfig = {
    // 2026-11-07 (owner): the youngest band. Same games as 3-4 at their easiest: two choices, short rounds, numbers to 3.
    "2-3": { difficulty: 1, label: "Tiny Explorer", face: "🐥",
      maxNumber: 3,   lettersPerGame: 2,  optionsPerQuestion: 2, rounds: 2,
      maxWordLen: 3,  reading: "none",  speed: 0.65, showText: false, mathOps: ["count"],
      sceneSteps: 2 },
    "3-4": { difficulty: 1, label: "Little Explorer", face: "🐣",
      maxNumber: 5,   lettersPerGame: 3,  optionsPerQuestion: 2, rounds: 3,
      maxWordLen: 3,  reading: "none",  speed: 0.70, showText: false, mathOps: ["count"],
      sceneSteps: 3 },
    "4-5": { difficulty: 2, label: "Busy Bee", face: "🐝",
      maxNumber: 10,  lettersPerGame: 5,  optionsPerQuestion: 3, rounds: 4,
      maxWordLen: 4,  reading: "light", speed: 0.85, showText: false, mathOps: ["count"],
      sceneSteps: 3 },
    "5-6": { difficulty: 3, label: "Bright Spark", face: "⭐",
      maxNumber: 20,  lettersPerGame: 8,  optionsPerQuestion: 4, rounds: 5,
      maxWordLen: 5,  reading: "light", speed: 1.00, showText: true, mathOps: ["add"],
      sceneSteps: 4 },
    "6-7": { difficulty: 4, label: "Clever Cub", face: "🦊",
      maxNumber: 50,  lettersPerGame: 10, optionsPerQuestion: 4, rounds: 5,
      maxWordLen: 6,  reading: "some",  speed: 1.10, showText: true, mathOps: ["add", "sub"],
      sceneSteps: 4 },
    "7-8": { difficulty: 5, label: "Super Solver", face: "🚀",
      maxNumber: 100, lettersPerGame: 12, optionsPerQuestion: 5, rounds: 6,
      maxWordLen: 7,  reading: "full",  speed: 1.20, showText: true, mathOps: ["add", "sub", "mul"],
      sceneSteps: 6},
    "8-9": { difficulty: 6, label: "Brain Wizard", face: "🧙",
      maxNumber: 150, lettersPerGame: 14, optionsPerQuestion: 5, rounds: 6,
      maxWordLen: 8,  reading: "full",  speed: 1.30, showText: true, mathOps: ["mul", "div"],
      sceneSteps: 6},
    "9-10": { difficulty: 7, label: "Master Mind", face: "🧠",
      maxNumber: 200, lettersPerGame: 15, optionsPerQuestion: 5, rounds: 7,
      maxWordLen: 9,  reading: "full",  speed: 1.40, showText: true, mathOps: ["mul", "div", "fraction"],
      sceneSteps: 6}
  };

  Kido.age = {
    BANDS: BANDS,
    config: ageConfig,

    /** All bands as an array of {band, ...config} for the picker. */
    all: function () {
      return BANDS.map(function (b) {
        return Object.assign({ band: b }, ageConfig[b]);
      });
    },

    /** Currently selected band (defaults to 5-6 if none/unknown stored). */
    current: function () {
      var b = Kido.progress && Kido.progress.get("age");
      return ageConfig[b] ? b : "5-6";
    },

    /** Config object for the current (or given) band. */
    cfg: function (band) {
      band = band || this.current();
      return ageConfig[band] || ageConfig["5-6"];
    },

    /** Persist a new band. */
    set: function (band) {
      if (!ageConfig[band]) return;
      Kido.progress.set("age", band);
      this.applyLook();
    },

    /** Ages 2-5 (showText: false): pictures and Momo's voice instead of reading text ("is-little" on <html>). */
    isLittle: function (band) { return this.cfg(band).showText === false; },
    applyLook: function () { document.documentElement.classList.toggle("is-little", this.isLittle()); },

    /** Human label like "4–5 years". */
    labelFor: function (band) {
      return String(band).replace("-", "–") + " years";
    },

    /** True when the band wants minimal on-screen text (rely on voice+images). */
    isPreReader: function (band) {
      return this.cfg(band).reading === "none" || this.cfg(band).reading === "light";
    }
  };
})(window);
