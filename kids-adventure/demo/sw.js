/* =========================================================================
   sw.js — Kido's offline service worker (Change #19), production web build only.
   `npm run build` writes the real list of app-shell files and the build id into
   www/sw.js; js/pwa.js registers it only in that build (never in development,
   never inside the native app, never from file://).

   • App shell (index, CSS, JS, fonts, icons, audio manifest) is precached, so
     Kido starts with no network after the first visit.
   • Pictures and sounds are cached only when a child actually uses them (the
     full library is never precached), and only the most recent MEDIA_MAX stay.
   • Video is left alone: it streams with Range requests straight from the host.
   • Only this site's own files are ever touched; nothing is sent anywhere.
   ========================================================================= */
"use strict";

var BUILD = "44bcf25c0c15";
var SHELL = "kido-shell-" + BUILD;
var MEDIA = "kido-media-v1";
var MEDIA_MAX = 160;
var PRECACHE = [
 "index.html",
 "manifest.webmanifest",
 "assets/icons/favicon-32.png",
 "assets/icons/apple-touch-icon.png",
 "assets/fonts/baloo2-latin.woff2",
 "assets/fonts/fredoka-latin.woff2",
 "css/fonts.css?v=1",
 "css/style.css?v=107",
 "css/animations.css?v=69",
 "css/scene.css?v=61",
 "css/practice.css?v=22",
 "css/creatures.css?v=55",
 "css/whats-animal.css?v=57",
 "css/fruit-games.css?v=53",
 "css/world.css?v=12",
 "css/adventure.css?v=3",
 "css/discovery.css?v=7",
 "css/puzzle.css?v=18",
 "css/space.css?v=6",
 "css/story.css?v=11",
 "css/achievement.css?v=5",
 "css/parent.css?v=5",
 "css/responsive.css?v=120",
 "css/thinklab.css?v=31",
 "js/nativeSpeech.js?v=3",
 "js/ageConfig.js",
 "js/icons.js?v=2",
 "js/data/audioRegistry.js?v=7",
 "js/data/voiceClips.js?v=8",
 "js/data/learningConfig.js?v=4",
 "js/audio.js?v=71",
 "js/engine/animalSynth.js?v=38",
 "js/engine/audioManager.js?v=44",
 "js/progress.js?v=3",
 "js/rewards.js?v=6",
 "js/mascot.js?v=42",
 "js/mascotLife.js?v=2",
 "js/fx.js",
 "js/gameEngine.js?v=75",
 "js/engine/characters.js?v=57",
 "js/engine/particles.js",
 "js/engine/voiceEngine.js?v=39",
 "js/engine/music.js?v=57",
 "js/engine/sceneEngine.js?v=57",
 "js/engine/videoManager.js?v=3",
 "js/engine/puzzleEngine.js?v=10",
 "js/engine/storyEngine.js?v=6",
 "js/engine/learning.js?v=4",
 "js/data/content.js?v=76",
 "js/data/creatures.js?v=75",
 "js/art/creatureArt.js?v=55",
 "js/art/worldArt.js?v=72",
 "js/art/storyPlaces.js?v=1",
 "js/art/mysteryPlaces.js?v=1",
 "js/art/storyCast.js?v=1",
 "js/art/puzzleArt.js?v=10",
 "js/data/animalFacts.js?v=3",
 "js/data/whatsAnimal.js?v=3",
 "js/data/space.js?v=4",
 "js/data/videos.js?v=7",
 "js/data/puzzles.js?v=11",
 "js/data/storyAdventures.js?v=6",
 "js/data/chiku.js?v=2",
 "js/data/catalog.js?v=99",
 "js/activities/wordAdventure.js?v=73b",
 "js/activities/electronics.js?v=59",
 "js/activities/miniGames.js?v=69",
 "js/activities/tracing.js?v=6",
 "js/activities/bodyTap.js?v=6",
 "js/activities/soundGames.js?v=55",
 "js/activities/fruitGames.js?v=56b",
 "js/activities/discovery.js?v=9",
 "js/activities/puzzleTypes.js?v=10",
 "js/activities/solarSystem.js?v=6",
 "js/data/thinkLab.js?v=12",
 "js/activities/thinkLab.js?v=9",
 "js/activities/thinkLab2.js?v=7",
 "js/activities/thinkLab3.js?v=2",
 "js/activities/thinkLab4.js?v=4",
 "js/activities/thinkLab5.js?v=2",
 "js/activities/thinkLab6.js?v=3",
 "js/scenes/brushTeeth.js?v=17",
 "js/scenes/aisForApple.js?v=57",
 "js/scenes/countApples.js?v=55",
 "js/scenes/growPlant.js?v=60",
 "js/scenes/animalSound.js?v=52",
 "js/scenes/whatsAnimal.js?v=59",
 "js/scenes/wordRun.js?v=53",
 "js/screens.js?v=79",
 "js/world.js?v=28",
 "js/data/moreActivities.js?v=9",
 "js/adventure.js?v=7",
 "js/navigation.js?v=63",
 "js/data/credits.js?v=3",
 "js/parentInsights.js?v=6",
 "js/parent.js?v=21",
 "js/achievement.js?v=3",
 "js/app.js?v=53",
 "js/fitStage.js?v=7",
 "js/pwa.js?v=1",
 "assets/fonts/fredoka-hebrew.woff2",
 "assets/fonts/fredoka-latin-ext.woff2",
 "assets/fonts/baloo2-devanagari.woff2",
 "assets/fonts/baloo2-vietnamese.woff2",
 "assets/fonts/baloo2-latin-ext.woff2",
 "assets/icons/icon-192.png",
 "assets/icons/icon-512.png",
 "assets/icons/icon-maskable-192.png",
 "assets/icons/icon-maskable-512.png",
 "assets/audio/audio-manifest.json?v=14"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    // cache: "reload" — take the files from the host, not from a stale HTTP cache
    return c.addAll(PRECACHE.map(function (u) { return new Request(u, { cache: "reload" }); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("kido-shell-") === 0 && k !== SHELL; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function isMedia(path) { return /\/assets\/(img|audio)\//.test(path) && !/\.json$/.test(path); }

function trim(cache) {
  return cache.keys().then(function (keys) {
    var extra = keys.length - MEDIA_MAX;
    return extra > 0 ? Promise.all(keys.slice(0, extra).map(function (k) { return cache.delete(k); })) : null;
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                          // other sites: untouched
  if (req.headers.has("range") || /\/assets\/videos\//.test(url.pathname)) return;   // video streams

  if (req.mode === "navigate") {                                            // the app is one page
    var scope = new URL(self.registration.scope).pathname;
    if (url.pathname !== scope && url.pathname !== scope + "index.html") return;   // any other file opened directly: from the host
    e.respondWith(caches.open(SHELL).then(function (c) {
      return c.match("index.html").then(function (hit) {
        return hit || fetch(req);
      });
    }).catch(function () { return fetch(req); }));
    return;
  }

  e.respondWith(caches.open(SHELL).then(function (shell) {
    // exact match first; the shell cache only ever holds this build, so ?v= can be ignored safely
    return shell.match(req).then(function (hit) { return hit || shell.match(req, { ignoreSearch: true }); });
  }).then(function (hit) {
    if (hit) return hit;
    if (!isMedia(url.pathname)) return fetch(req);
    return caches.open(MEDIA).then(function (media) {
      return media.match(req).then(function (cached) {
        if (cached) return cached;
        return fetch(req).then(function (res) {
          if (res && res.ok && res.status === 200 && res.type === "basic") {
            var copy = res.clone();
            media.put(req, copy).then(function () { return trim(media); }).catch(function () {});
          }
          return res;
        });
      });
    });
  }));
});
