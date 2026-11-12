/* =========================================================================
   audioRegistry.js — The ONE list of every named sound Kido can make.

   Kido.AudioManager reads this; games, the Story/Puzzle engines, the world
   and the mascot only ever say a cue id ("puzzle.correct", "story.choice").

     cue id ──► { channel, priority, synth | sound file } ──► AudioManager

   Adding or replacing a sound is a data change here — no other JS:
     • synth:  name of a built-in recipe in audio.js (original, no file).
     • sound:  a file under assets/audio/ (set available:true only once the
               file exists AND its licence is recorded in AUDIO-LICENSES.md).
               When both exist the file wins and the synth is the fallback.
     • variants: [file, file, …] — one is picked at random (never twice running).

   Animal & bird recordings keep their existing, licence-annotated home in
   assets/audio/audio-manifest.json (see `species`) — not duplicated here.

   Classic script (no fetch) so it works from file:// and before any network.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  Kido.audioRegistry = {
    version: 1,
    basePath: "assets/audio/",
    species: "assets/audio/audio-manifest.json",

    /* Mixer channels and their default levels (0..1). The parent can change
       each one; values persist in Kido.progress settings.volumes. */
    channels: {
      master:   { label: "Everything",    def: 1.0 },
      music:    { label: "Music",         def: 0.55 },
      sfx:      { label: "Sound effects", def: 0.8 },
      voice:    { label: "Voice",         def: 1.0 },
      ambience: { label: "Nature sounds", def: 0.35 }
    },

    /* Priority ladder. A sound never interrupts a higher one; low sounds give
       way (quieter, or skipped while a reward plays). */
    priorities: { ambience: 0, ui: 1, gameplay: 2, voice: 3, reward: 3 },

    /* How much music / ambience dip while something important plays. */
    ducking: {
      voice:  { music: 0.35, ambience: 0.55 },
      reward: { music: 0.45, ambience: 0.4 },
      video:  { music: 0.08, ambience: 0.2 }
    },

    /* hold: ms the cue "owns" the foreground (lower cues give way meanwhile).
       optional: skip entirely if anything more important is happening.
       duck: dip music/ambience (a key of `ducking`) for the hold time. */
    cues: {
      // UI
      "ui.tap":           { channel: "sfx", priority: "ui", synth: "tap" },
      "ui.select":        { channel: "sfx", priority: "ui", synth: "select" },
      "ui.sparkle":       { channel: "sfx", priority: "ui", synth: "sparkle", optional: true },
      // Generic gameplay feedback (every older game routes through these)
      "game.correct":     { channel: "sfx", priority: "gameplay", synth: "correct", hold: 450 },
      "game.retry":       { channel: "sfx", priority: "gameplay", synth: "retry", hold: 300 },
      "game.tone":        { channel: "sfx", priority: "gameplay", synth: "tone" },
      // Rewards
      "reward.celebrate": { channel: "sfx", priority: "reward", synth: "celebrate", hold: 1500, duck: "reward" },
      "reward.unlock":    { channel: "sfx", priority: "reward", synth: "unlock", hold: 700, minGap: 220 },
      // Puzzle engine (Change #4)
      "puzzle.start":     { channel: "sfx", priority: "ui", synth: "intro", volume: 0.8 },
      "puzzle.challenge": { channel: "sfx", priority: "gameplay", synth: "discover", volume: 0.8, hold: 500 },   // "Here's a new challenge!" (Change #7)
      "puzzle.select":    { channel: "sfx", priority: "ui", synth: "select" },
      "puzzle.bump":      { channel: "sfx", priority: "ui", synth: "bump" },
      "puzzle.correct":   { channel: "sfx", priority: "gameplay", synth: "correct", hold: 450 },
      "puzzle.retry":     { channel: "sfx", priority: "gameplay", synth: "retry", hold: 300 },
      "puzzle.hint":      { channel: "sfx", priority: "gameplay", synth: "hint", hold: 400 },
      "puzzle.complete":  { channel: "sfx", priority: "reward", synth: "complete", hold: 1200, duck: "reward" },
      // Story engine (Change #5)
      "story.select":     { channel: "sfx", priority: "ui", synth: "select" },
      "story.choice":     { channel: "sfx", priority: "gameplay", synth: "choice", hold: 400 },
      "story.transition": { channel: "sfx", priority: "ui", synth: "page", volume: 0.8 },
      "story.discover":   { channel: "sfx", priority: "gameplay", synth: "discover", hold: 600 },
      "story.celebrate":  { channel: "sfx", priority: "reward", synth: "celebrate", hold: 1500, duck: "reward" },
      // Kido World
      "world.travel":     { channel: "sfx", priority: "ui", synth: "whoosh", volume: 0.7 },
      "world.discover":   { channel: "sfx", priority: "ui", synth: "discover", volume: 0.8 },
      "world.splash":     { channel: "sfx", priority: "ui", synth: "splash", volume: 0.8 },
      "world.flutter":    { channel: "sfx", priority: "ui", synth: "flutter", volume: 0.8 },
      "world.rustle":     { channel: "sfx", priority: "ui", synth: "rustle", volume: 0.8 },
      "world.bubbles":    { channel: "sfx", priority: "ui", synth: "bubbles", volume: 0.8 },
      "world.beep":       { channel: "sfx", priority: "ui", synth: "beep", volume: 0.7 },
      // Quick Discovery video (Change #3)
      "video.end":        { channel: "sfx", priority: "gameplay", synth: "discover", hold: 600 },
      // Today's Adventure (Change #12) — existing recipes, new names
      "adventure.start":    { channel: "sfx", priority: "ui", synth: "intro", volume: 0.8 },
      "adventure.travel":   { channel: "sfx", priority: "ui", synth: "whoosh", volume: 0.7 },
      "adventure.step":     { channel: "sfx", priority: "gameplay", synth: "magic", hold: 500 },
      "adventure.complete": { channel: "sfx", priority: "reward", synth: "celebrate", hold: 1500, duck: "reward" },
      // Momo — tiny wordless reactions, rate-limited by the mascot
      "mascot.greet":     { channel: "sfx", priority: "ui", synth: "mGreet", volume: 0.8, optional: true },
      "mascot.happy":     { channel: "sfx", priority: "ui", synth: "mHappy", volume: 0.8, optional: true },
      "mascot.excited":   { channel: "sfx", priority: "ui", synth: "mExcited", volume: 0.8, optional: true },
      "mascot.cheer":     { channel: "sfx", priority: "ui", synth: "mCheer", volume: 0.8, optional: true },
      // Named effects older scenes already ask for (Kido.audio.play / pop)
      "fx.pop":           { channel: "sfx", priority: "ui", synth: "pop" },
      "fx.splash":        { channel: "sfx", priority: "gameplay", synth: "splash" },
      "fx.magic":         { channel: "sfx", priority: "gameplay", synth: "magic", hold: 500 },
      "fx.crunch":        { channel: "sfx", priority: "gameplay", synth: "crunch" },
      "fx.catch":         { channel: "sfx", priority: "gameplay", synth: "catch" },
      "fx.horn":          { channel: "sfx", priority: "gameplay", synth: "horn" },
      "fx.vehicle":       { channel: "sfx", priority: "gameplay", synth: "vehicle" }
    },

    /* Hidden discoveries in Kido World (data-disc kind → cue). */
    discoveries: { fly: "world.flutter", ripple: "world.splash", fish: "world.splash", bubbles: "world.bubbles",
      rustle: "world.rustle", sparkle: "world.discover", twinkle: "world.discover", beep: "world.beep" },

    /* Looping environment beds. Only a few test beds exist so far; the rest
       are declared (available:false) so dropping a file in is a data change.
       Originals made for Kido — see AUDIO-LICENSES.md "Original ambience". */
    ambience: {
      jungle:   { sound: "ambience/jungle_loop.mp3", available: true, volume: 0.8, licence: "original-kido" },
      ocean:    { sound: "ambience/ocean_loop.mp3",  available: true, volume: 0.8, licence: "original-kido" },
      space:    { sound: "ambience/space_loop.mp3",  available: true, volume: 0.8, licence: "original-kido" },
      farm:     { sound: "ambience/farm_loop.mp3",   available: false },
      lab:      { sound: "ambience/lab_loop.mp3",    available: false }
    },
    /** Which bed each Kido World place uses (null = quiet). */
    worlds: { village: null, jungle: "jungle", puzzle: null, castle: null, ocean: "ocean", lab: null, space: "space" },

    /* Background-music moods (procedural, js/engine/music.js) per context. */
    music: { map: "garden", story: "story", puzzle: "puzzle", reward: "victory" },

    /* Speaking styles. Calm and unhurried for instructions, brighter for
       praise; Kido.Voice also slows everything a little for pre-readers. */
    voices: {
      narration:   { rate: 0.98, pitch: 1.02 },
      instruction: { rate: 0.95, pitch: 1.02 },
      question:    { rate: 0.96, pitch: 1.02 },
      dialogue:    { rate: 1.0,  pitch: 1.02 },
      discovery:   { rate: 0.96, pitch: 1.02 },
      praise:      { rate: 1.04, pitch: 1.02 },
      encourage:   { rate: 0.97, pitch: 1.02 }
    },

    /* Pre-recorded voice lines: id → { sound, available }. Kido.Voice plays
       the recording when present and falls back to the device voice. None
       are recorded yet — e.g.
         "story.lost_little_bird_001.meet.1": { sound: "voice/en/bird_meet_1.mp3", available: false } */
    /* Pre-recorded voice lines: id -> { sound, available }.
       NOTE: Unverified Google Translate TTS clips have been quarantined out of release
       until human studio recordings or commercially licensed voice assets are certified. */
    voice: {
      // Momo's tap greeting, made offline with Kokoro (af_heart).
      // All other recorded lines come from js/data/voiceClips.js, keyed by their exact text.
      "momo.greeting": { sound: "voice/en/momo.greeting.ogg", available: true,
        text: "Hello, little explorer! Are you ready for a magical journey?" }
    }
  };
})(window);
