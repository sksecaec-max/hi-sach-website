/* =========================================================================
   chiku.js — "Chiku", Kido's body-parts child (data only)
   Lifelike AI-generated photos (Gemini, owner's account, 2026-10-20) in
   assets/img/chiku/; record in docs/characters/CHIKU.md. Two tap scenes —
   head to toe (687x1024) and the face (1024x1024) — with tap zones in image
   pixels, plus close-ups cut from the photos with CSS (no extra files).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var D = "assets/img/chiku/";

  var SCENES = {
    body: { src: D + "fullbody.jpg", w: 687, h: 1024, view: [150, 70, 400, 950] },   // view: crop off the empty grey margin
    face: { src: D + "happy.jpg", w: 1024, h: 1024, view: [0, 0, 1024, 1024] }
  };
  var SIZE = { "fullbody.jpg": [687, 1024] };   // every other photo is 1024x1024

  /* scene + zones [cx, cy, rx, ry] in that scene's pixels; crop = [photo, cx, cy, side];
     tap:false = too small to tap, close-up only; older = asked from difficulty 3 */
  // Small parts get zones bigger than the part itself: on a phone the body photo is ~300 px tall, so a
  // true-size knee would be a 14 px target. They sit above the big parts, so the extra area is safe.
  var PARTS = {
    hair:      { scene: "face", z: [[515, 185, 250, 105]], crop: ["happy.jpg", 515, 210, 560], name: "Hair", fact: "Hair keeps your head warm and safe from the sun!" },
    eyebrows:  { scene: "face", z: [[410, 400, 58, 20], [612, 398, 58, 20]], crop: ["happy.jpg", 513, 405, 300], name: "Eyebrows", fact: "Eyebrows stop sweat from running into your eyes!", older: true },
    eyes:      { scene: "face", z: [[418, 455, 55, 28], [608, 452, 55, 28]], crop: ["happy.jpg", 513, 450, 300], name: "Eyes", fact: "You see colours, shapes and your family with your eyes!" },
    ears:      { scene: "face", z: [[290, 515, 40, 82], [748, 515, 40, 82]], crop: ["happy.jpg", 292, 515, 230], name: "Ears", fact: "Ears help you hear music, birds and your friends!" },
    nose:      { scene: "face", z: [[515, 525, 50, 52]], crop: ["happy.jpg", 515, 520, 210], name: "Nose", fact: "Your nose smells flowers and helps you breathe!" },
    cheeks:    { scene: "face", z: [[385, 565, 48, 42], [652, 565, 48, 42]], crop: ["happy.jpg", 518, 560, 430], name: "Cheeks", fact: "Cheeks go puff when you blow up a balloon!", older: true },
    mouth:     { scene: "face", z: [[515, 628, 98, 42]], crop: ["happy.jpg", 515, 628, 270], name: "Mouth", fact: "Your mouth eats, talks, sings and smiles!" },
    teeth:     { scene: "face", z: [[515, 622, 72, 20]], crop: ["happy.jpg", 515, 622, 180], name: "Teeth", fact: "Teeth bite and chew your food. Brush them twice a day!", tap: false },
    tongue:    { scene: "face", z: [], crop: ["silly.jpg", 512, 652, 300], name: "Tongue", fact: "Your tongue tastes sweet, salty and sour!", tap: false },
    chin:      { scene: "face", z: [[515, 714, 62, 30]], crop: ["happy.jpg", 515, 700, 230], name: "Chin", fact: "Your chin is at the bottom of your face!", older: true },
    neck:      { scene: "face", z: [[515, 795, 95, 42]], crop: ["happy.jpg", 515, 815, 300], name: "Neck", fact: "Your neck holds up your head and lets it turn!", older: true },
    head:      { scene: "body", z: [[345, 178, 66, 84]], crop: ["fullbody.jpg", 345, 182, 230], name: "Head", fact: "Your head holds your brain, the boss of your whole body!" },
    shoulders: { scene: "body", z: [[262, 302, 34, 28], [430, 306, 34, 28]], crop: ["fullbody.jpg", 345, 300, 270], name: "Shoulders", fact: "Shoulders help you lift your arms up high!", older: true },
    arms:      { scene: "body", z: [[247, 375, 20, 62], [228, 530, 20, 52], [443, 375, 20, 62], [462, 530, 20, 52]], crop: ["fullbody.jpg", 228, 455, 210], name: "Arms", fact: "Arms reach, hug and carry things!", older: true },
    elbows:    { scene: "body", z: [[235, 452, 30, 30], [453, 452, 30, 30]], crop: ["fullbody.jpg", 240, 452, 130], name: "Elbows", fact: "Elbows let your arms bend!", older: true },
    hands:     { scene: "body", z: [[205, 625, 52, 62], [485, 625, 52, 62]], crop: ["hands.jpg", 512, 512, 1024], name: "Hands", fact: "Hands clap, wave, draw and hold things!" },
    fingers:   { scene: "body", z: [], crop: ["hands.jpg", 300, 380, 520], name: "Fingers", fact: "You have five fingers on each hand. Count them!", tap: false },
    tummy:     { scene: "body", z: [[345, 470, 72, 58]], crop: ["fullbody.jpg", 345, 470, 230], name: "Tummy", fact: "Your tummy holds your food and turns it into energy!" },
    legs:      { scene: "body", z: [[305, 860, 30, 72], [378, 860, 30, 72]], crop: ["fullbody.jpg", 342, 810, 300], name: "Legs", fact: "Legs help you walk, run and jump!" },
    knees:     { scene: "body", z: [[305, 772, 34, 34], [380, 772, 34, 34]], crop: ["fullbody.jpg", 342, 772, 160], name: "Knees", fact: "Knees bend so you can sit, kneel and jump!", older: true },
    feet:      { scene: "body", z: [[292, 955, 42, 32], [395, 955, 42, 32]], crop: ["feet.jpg", 512, 560, 900], name: "Feet", fact: "Feet carry you everywhere you go!" },
    toes:      { scene: "body", z: [], crop: ["feet.jpg", 520, 790, 420], name: "Toes", fact: "You have ten little toes to wiggle!", tap: false },
    // inside the body: a toy anatomy model, a toy skeleton, and Chiku's muscle
    brain:     { scene: null, z: [], crop: ["anatomy-model.jpg", 520, 150, 240], name: "Brain", fact: "Your brain thinks, learns and remembers!", tap: false },
    lungs:     { scene: null, z: [], crop: ["anatomy-model.jpg", 510, 480, 320], name: "Lungs", fact: "Your lungs fill up with air when you breathe in!", tap: false },
    heart:     { scene: null, z: [], crop: ["anatomy-model.jpg", 566, 520, 170], name: "Heart", fact: "Your heart pumps blood all day and night!", tap: false },
    stomach:   { scene: null, z: [], crop: ["anatomy-model.jpg", 540, 660, 230], name: "Stomach", fact: "Your stomach mashes up the food you eat!", tap: false },
    bones:     { scene: null, z: [], crop: ["skeleton-model.jpg", 512, 512, 1024], name: "Bones", fact: "Bones make you strong and help you stand tall!", tap: false },
    muscles:   { scene: null, z: [], crop: ["muscle.jpg", 200, 440, 460], name: "Muscles", fact: "Muscles pull on your bones so you can move!", tap: false }
  };
  var FEELINGS = ["happy", "sad", "angry", "scared", "surprised", "sleepy", "silly"];
  // one of a pair, for "That's Chiku's ear!"
  var ONE = { eyebrows: "eyebrow", eyes: "eye", ears: "ear", cheeks: "cheek", shoulders: "shoulder", arms: "arm", elbows: "elbow",
    hands: "hand", legs: "leg", knees: "knee", feet: "foot" };

  /** A close-up of one part, cut from its photo with CSS background sizing (square). */
  function crop(key) {
    var p = PARTS[key]; if (!p) return "";
    var c = p.crop, wh = SIZE[c[0]] || [1024, 1024], side = c[3];
    function pos(center, full) { var free = full - side; return free <= 0 ? 50 : Math.max(0, Math.min(100, (center - side / 2) / free * 100)); }
    return '<span class="chiku-crop" role="img" aria-label="' + p.name + '" style="background-image:url(' + D + c[0] + ");" +
      "background-size:" + (wh[0] / side * 100) + "% " + (wh[1] / side * 100) + "%;" +
      "background-position:" + pos(c[1], wh[0]) + "% " + pos(c[2], wh[1]) + '%"></span>';
  }
  function photo(name, label) { return '<img class="chiku-photo" src="' + D + name + '.jpg" alt="' + (label || "Chiku") + '" draggable="false"/>'; }

  Kido.chiku = {
    name: "Chiku",
    SCENES: SCENES, PARTS: PARTS, FEELINGS: FEELINGS,
    crop: crop, photo: photo,
    face: function (mood) { return photo(mood, "Chiku feels " + mood); },
    one: function (k) { return ONE[k] || PARTS[k].name.toLowerCase(); },
    tapParts: function (difficulty) {
      return Object.keys(PARTS).filter(function (k) { var p = PARTS[k]; return p.tap !== false && p.scene && (difficulty >= 3 || !p.older); });
    }
  };
})(window);
