/* =========================================================================
   storyPlaces.js — the story places of Change #17A (The Helpful Rabbit, The
   Lost Puppy, The Tidy Room, The Little Explorer, The Magic Garden).
   Same "storybook diorama" as Kido World and the first story places: drawn
   with Kido.worldArt.kit (shared helpers, gradients and light), registered
   with Kido.worldArt.addStoryPlace. Contract with js/engine/storyEngine.js:
     <g data-hot="key">     something the child can tap (no transform of its own)
     <g data-prop="key">    a drawn thing the story can fly or tidy away (no transform of its own)
     <g data-reveal="key">  hidden until the story reveals it
     <g data-anchor="key">  where a character stands (feet = the point)
   Portrait (400×840) keeps what is tapped above y≈620 and landscape
   (1000×600) above y≈440, leaving the bottom for the dialogue bar.
   Ambient life uses Kido World's kw-* classes (they run in stories too).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var WA = Kido.worldArt;
  if (!WA || !WA.kit || !WA.addStoryPlace) return;
  var K = WA.kit;
  var n = K.n, g = K.g, at = K.at, anim = K.anim, lg = K.lg, rg = K.rg, E = K.E, C = K.C, R = K.R, P = K.P, L = K.L, op = K.op, big = K.big, delay = K.delay;
  var shadow = K.shadow, tree = K.tree, pine = K.pine, bush = K.bush, flowers = K.flowers, rock = K.rock, cloud = K.cloud, birds = K.birds,
    butterfly = K.butterfly, sparkle = K.sparkle, tufts = K.tufts, patches = K.patches, fern = K.fern, mushroom = K.mushroom,
    anchorPt = K.anchorPt, hotG = K.hotG, revealG = K.revealG, forestBase = K.forestBase, dragonfly = K.dragonfly, bee = K.bee;

  /* ---------------- shared pieces ---------------- */
  // A drawn thing the story can move (fly) or tidy away (gone).
  function propG(key, inner) { return g(inner, "", "st-prop", ' data-prop="' + key + '"'); }
  // Hidden until the story reveals it; cls = how it arrives (st-pop, st-grow, st-bloom, st-fade, st-dusk, st-flyaway).
  function reveal(key, inner, cls) { return g(inner, "", "kw-reveal" + (cls ? " " + cls : ""), ' data-reveal="' + key + '"'); }
  function anchors(lay, keys) { return keys.map(function (k) { return anchorPt(k, lay[k][0], lay[k][1]); }).join(""); }
  function rot(a, x, y) { return ' transform="rotate(' + a + " " + n(x) + " " + n(y) + ')"'; }
  // Story-only gradients (every place includes them once).
  var SHARED = [
    rg("sp-sun", .45, .4, .6, [[0, "#FFFDE8"], [.5, "#FFE680"], [1, "#FFC83D"]]),
    lg("sp-soil", 0, 0, 0, 1, [[0, "#B07A4A"], [1, "#7A4A26"]]),
    lg("sp-wet", 0, 0, 0, 1, [[0, "#7A5236"], [1, "#4A2E16"]]),
    lg("sp-dry", 0, 0, 0, 1, [[0, "#E2C493"], [1, "#B88E5C"]]),
    lg("sp-cream", 0, 0, .6, 1, [[0, "#FFFDF7"], [1, "#F1E2C6"]]),
    lg("sp-pink", 0, 0, .7, 1, [[0, "#FFD6E4"], [1, "#F07AA6"]]),
    lg("sp-green", 0, 0, .7, 1, [[0, "#BDEFA0"], [1, "#4FA85A"]]),
    lg("sp-blue", 0, 0, .7, 1, [[0, "#B4DAFF"], [1, "#3E78D8"]]),
    lg("sp-yellow", 0, 0, .7, 1, [[0, "#FFF4B8"], [1, "#F2B82C"]]),
    lg("sp-orange", 0, 0, .7, 1, [[0, "#FFD3A6"], [1, "#EE7A2A"]]),
    lg("sp-purple", 0, 0, .7, 1, [[0, "#E0D2FF"], [1, "#8A68E0"]]),
    lg("sp-grey", 0, 0, .7, 1, [[0, "#F4F6FA"], [1, "#9AA3B8"]]),
    lg("sp-shell", 0, 0, .8, 1, [[0, "#9FDFAE"], [1, "#3E9A63"]]),
    rg("sp-lamp", .5, .5, .5, [[0, "#FFF8D8", 1], [.4, "#FFE07A", .75], [1, "#FFC247", 0]]),
    rg("sp-magic", .5, .5, .5, [[0, "#FFFFFF", 1], [.35, "#FFF1A8", .85], [.7, "#FF9AD6", .35], [1, "#B79CFF", 0]]),
    rg("sp-moon", .4, .35, .7, [[0, "#FFFFF2"], [.7, "#FFF2BE"], [1, "#E9D48A"]]),
    lg("sp-mound", 0, 0, .3, 1, [[0, "#C2EE98"], [.5, "#7CC466"], [1, "#468E4A"]]),
    rg("sp-lit", .5, .45, .7, [[0, "#FFF8D2"], [.6, "#FFD86A"], [1, "#F2A93B"]])
  ].join("");
  var SKY = {
    morning: [[0, "#A9DCFF"], [.6, "#DDF1FF"], [1, "#FFF2D4"]],
    day: [[0, "#8FD0FF"], [.7, "#D8F0FF"], [1, "#F4FBFF"]],
    dusk: [[0, "#6A64C4"], [.45, "#C982C0"], [.8, "#FFB48E"], [1, "#FFDDA6"]],
    night: [[0, "#141A46"], [.6, "#2B3176"], [1, "#4C4794"]]
  };
  var GROUND = {
    meadow: [[0, "#B8E68E"], [.5, "#8ACB6E"], [1, "#5FA85A"]],
    dusk: [[0, "#9DB27C"], [.5, "#7C9C6A"], [1, "#56785A"]],
    night: [[0, "#4A6A62"], [1, "#22383E"]],
    hill: [[0, "#C9EE9C"], [.5, "#97D277"], [1, "#68B25E"]]
  };
  function sky(W, H, hz, s, gr) {
    return "<defs>" + SHARED + lg("sp-sky", 0, -60, 0, hz, s, true) + lg("sp-ground", 0, hz, 0, H, gr, true) + "</defs>" +
      big(-900, -900, W + 1800, hz + 960, "url(#sp-sky)");
  }
  function ground(W, H, hz) { return big(-900, hz - 4, W + 1800, H + 900, "url(#sp-ground)"); }
  function sun(x, y, s) {
    var rays = "";
    for (var i = 0; i < 12; i++) rays += P("M-3,-40 L0,-56 L3,-40 Z", "#FFE27A", op(.8) + ' transform="rotate(' + (i * 30) + ')"');
    return at(x, y, s, C(0, 0, 84, "url(#kw-softglow)") + anim("kw-spin st-slow", rays) + C(0, 0, 31, "url(#sp-sun)") + C(-9, -9, 10, "#FFFFFF", op(.35)));
  }
  function farHills(W, hz, c1, c2, seed) {
    var r = K.rng(seed || 3), h = "", i;
    for (i = -9; i < W / 74 + 9; i++) h += E(i * 74 + r() * 30, hz - 4, 74 + r() * 34, 38 + r() * 30, c1);
    for (i = -9; i < W / 58 + 9; i++) h += E(i * 58 + 20 + r() * 20, hz + 4, 52 + r() * 22, 20 + r() * 14, c2);
    return h;
  }
  // A butterfly that stays where it is (it hovers and flaps) — for one the child taps, or the story flies.
  function butterflyStill(x, y, s, c) {
    return at(x, y, s, anim("st-float", anim("kw-wings", E(-4.5, -2, 4.6, 3.4, c) + E(-3.5, 2.6, 3, 2.3, c, op(.85)) + E(4.5, -2, 4.6, 3.4, c) + E(3.5, 2.6, 3, 2.3, c, op(.85))) +
      R(-.7, -4, 1.4, 8, .7, "#3B2A4A")));
  }
  function sparkles(x, y, s, n0, spread) {   // a few twinkling stars (shown when something good happens)
    var r = K.rng(n0 * 7 + 3), h = "";
    for (var i = 0; i < n0; i++) h += sparkle(x + (r() - .5) * spread, y + (r() - .5) * spread * .6, s * (.6 + r() * .6), i % 3 ? "#FFFFFF" : "#FFE27A");
    return anim("st-twinkle", h);
  }

  /* ================= THE HELPFUL RABBIT ================= */
  function clover(x, y, s) {
    var h = shadow(6, 4, 34, 7);
    function leaf(cx, cy, a) { return E(cx, cy, 5.4, 3.7, "url(#kw-leaf)", rot(a, cx, cy)); }
    [[-22, 2], [-8, -6], [8, 0], [24, -4], [0, 8], [-16, 10], [16, 10]].forEach(function (p, i) {
      var cx = p[0], cy = p[1];
      h += L("M" + cx + "," + (cy + 9) + " L" + cx + "," + cy, "#3F9A55", 1.3) + leaf(cx - 3.8, cy - 1, -32) + leaf(cx + 3.8, cy - 1, 32) + leaf(cx, cy - 5.4, 90);
      if (i % 2 === 0) h += C(cx + 5, cy - 9, 3.4, "#FFFFFF") + C(cx + 5, cy - 9, 1.7, "#FFD6E6");
    });
    return at(x, y, s, h);
  }
  function burrow(x, y, s) {
    return at(x, y, s,
      shadow(12, 3, 100, 12) +
      P("M-104,0 C-94,-62 -42,-94 8,-92 C62,-90 98,-58 108,0 Z", "url(#sp-mound)") +
      L("M-70,-40 L-66,-50 M-40,-66 L-37,-76 M30,-74 L33,-84 M62,-52 L66,-62 M78,-30 L82,-40", "#3E8A45", 1.8, op(.55)) +
      P("M-82,-30 C-62,-72 -12,-88 28,-84 C-12,-80 -52,-62 -66,-26 Z", "#FFFFFF", op(.2)) +
      E(4, -28, 31, 25, "#7A5434") + E(4, -24, 26, 20, "#46301A") + E(4, -19, 20, 13, "#24160A") +
      P("M-34,-4 C-26,-13 36,-13 44,-4 C32,1 -22,1 -34,-4 Z", "#9A6E44") +
      flowers(-62, -10, 1.3) + flowers(66, -8, 1.2, ["#FFFFFF", "#FFD24D", "#FF8FB0"]) +
      L("M-90,-6 L-86,-16 M-80,-4 L-78,-14 M84,-4 L86,-14 M92,-6 L96,-15", "#4E9444", 1.6, op(.8)));
  }
  function mushrooms(x, y, s) { return at(x, y, s, mushroom(-16, 4, 2.3) + mushroom(10, 0, 1.7) + mushroom(26, 8, 1.4)); }
  function ditch(x, y, s) {
    return at(x, y, s,
      E(0, 0, 84, 30, "#8A6440") + E(0, 4, 75, 25, "#5E3F24") + E(0, 9, 64, 18, "#3E2814") + E(-30, 8, 18, 6, "#2E1C0C", op(.6)) +
      P("M-84,0 C-66,12 66,12 84,0 C78,17 -78,17 -84,0 Z", "#A27C52") +
      L("M-56,-6 L-52,5 M-24,-8 L-21,4 M26,-8 L24,4 M56,-5 L52,6", "#2E1E10", 1.4, op(.45)) +
      L("M-86,0 L-92,-8 M-80,4 L-88,-2 M86,0 L92,-9 M80,5 L90,0", "#4E9444", 1.6, op(.8)) + rock(70, 14, .5) + rock(-74, 12, .4, true));
  }
  function branch(len) {   // a long fallen branch, lying along x, base centre (0,0)
    var h = len / 2;
    return shadow(0, 6, h + 6, 6) +
      L("M" + (-h) + ",0 C" + n(-h * .4) + ",-7 " + n(h * .2) + ",5 " + h + ",-3", "url(#kw-trunk)", 10) +
      L("M" + n(-h * .1) + ",-3 L" + n(h * .05) + ",-22", "#7A4B2A", 4.5) + L("M" + n(h * .45) + ",-2 L" + n(h * .62) + ",-16", "#7A4B2A", 3.5) +
      E(h * .06, -27, 11, 6, "url(#kw-leaf)", rot(-28, h * .06, -27)) + E(h * .66, -20, 9, 5, "url(#kw-leaf-d)", rot(24, h * .66, -20)) +
      E(-h + 3, -1, 4, 5, "#E8C49A") + L("M" + n(-h * .7) + ",-2 L" + n(-h * .55) + ",-4", "#5E3A20", 1.2, op(.6));
  }
  function leafSled(x, y, s) {   // a big flat leaf on the ground
    return at(x, y, s, shadow(0, 4, 54, 8) +
      P("M-54,0 C-40,-20 20,-26 54,-6 C30,10 -30,12 -54,0 Z", "url(#kw-leaf)") +
      L("M-50,0 C-20,-6 20,-8 52,-6", "#2E7A45", 1.6, op(.7)) +
      L("M-30,-3 L-22,-14 M-10,-5 L-2,-16 M10,-6 L18,-16 M-24,-1 L-16,8 M-4,-3 L4,7 M16,-4 L24,5", "#2E7A45", 1, op(.55)));
  }
  function logArt(x, y, s) {
    return at(x, y, s, shadow(4, 6, 62, 9) +
      R(-58, -24, 112, 26, 13, "url(#kw-trunk)") + E(52, -11, 9, 13, "#D9A36C") + E(52, -11, 6, 9, "#C08A55") + E(52, -11, 2.6, 4, "#8D5A34") +
      L("M-40,-18 C-20,-16 0,-20 30,-17 M-46,-8 C-20,-6 10,-9 36,-7", "#5E3A20", 1.4, op(.5)) +
      E(-30, -24, 14, 5, "url(#kw-leaf)", op(.9)) + C(-44, -22, 4, "#FF8FB0") + mushroom(-8, -22, 1));
  }
  function snail(x, y, s) {
    return at(x, y, s, P("M-16,0 C-14,-4 12,-4 18,0 Z", "#D7C3A6") + E(-14, -4, 5, 4, "#D7C3A6") +
      L("M-15,-6 L-18,-14 M-12,-6 L-12,-14", "#B9A487", 1.4) + C(-18, -15, 1.6, "#2B2151") + C(-12, -15, 1.6, "#2B2151") +
      C(4, -10, 10, "url(#sp-orange)") + L("M4,-10 m-6,0 a6,6 0 1,1 6,6 a3.4,3.4 0 1,1 -3.4,-3.4", "#A0521E", 1.6) + E(0, -15, 4, 2, "#FFFFFF", op(.5)));
  }
  function sparrowAway(x, y, s) { return at(x, y, s, g(K.birdSmall("#B98A5A"), "scale(1.8)")); }
  function cattails(x, y, s) {
    var h = "";
    [[-12, 0, -96, -8], [0, 2, -112, 0], [12, 0, -90, 7], [22, 3, -70, 14]].forEach(function (c, i) {
      h += L("M" + c[0] + "," + c[1] + " C" + (c[0] + c[3] * .3) + "," + n(c[2] * .5) + " " + (c[0] + c[3] * .7) + "," + n(c[2] * .8) + " " + (c[0] + c[3]) + "," + c[2], "#3E8A45", 3);
      if (i < 3) h += R(c[0] + c[3] - 5, c[2] + 4, 10, 30, 5, "#8A5A36") + L("M" + (c[0] + c[3]) + "," + (c[2] + 4) + " L" + (c[0] + c[3]) + "," + (c[2] - 10), "#6E4526", 1.6);
      h += P("M" + c[0] + "," + c[1] + " C" + (c[0] - 14) + "," + n(c[2] * .3) + " " + (c[0] - 10) + "," + n(c[2] * .55) + " " + (c[0] - 22) + "," + n(c[2] * .7) + " C" + (c[0] - 4) + "," + n(c[2] * .5) + " " + (c[0] - 2) + "," + n(c[2] * .3) + " " + c[0] + "," + c[1] + " Z", "url(#kw-leaf-d)", op(.9));
    });
    return at(x, y, s, anim("kw-seaweed", h));
  }
  function lilyPad(x, y, s, flip) {
    return at(x, y, s, P("M0,0 C-22,-1 -28,-13 -12,-18 C4,-21 24,-16 24,-6 C24,2 12,5 3,2 L0,-8 Z", "#4FA85A") +
      P("M-12,-16 C0,-19 18,-15 22,-8 C14,-12 2,-14 -12,-16 Z", "#8FD47A", op(.6)) + L("M0,-8 L-15,-12 M0,-8 L13,-13 M0,-8 L-4,-18", "#3E8A45", .9, op(.6)), 0, flip);
  }
  function lilyBud(x, y, s) {
    return at(x, y, s, P("M0,0 C-8,-6 -7,-20 0,-28 C7,-20 8,-6 0,0 Z", "url(#sp-pink)") + P("M-1,-2 C-12,-6 -14,-16 -10,-22 C-6,-14 -3,-8 -1,-2 Z", "#F58AB2") +
      P("M1,-2 C12,-6 14,-16 10,-22 C6,-14 3,-8 1,-2 Z", "#F58AB2") + E(-2, -20, 2, 5, "#FFFFFF", op(.5)));
  }
  function lilyBloom(x, y, s) {
    var h = "";
    for (var i = 0; i < 8; i++) h += E(0, -15, 6.5, 15, i % 2 ? "url(#sp-pink)" : "#FFE6F0", ' transform="rotate(' + (i * 45) + ')"');
    for (var j = 0; j < 6; j++) h += E(0, -10, 4.6, 10, "#FFC4DA", ' transform="rotate(' + (j * 60 + 30) + ')"');
    return at(x, y, s, g(h, "scale(1 .62)") + C(0, -1, 6, "url(#sp-yellow)") + C(-1.6, -2.6, 2, "#FFFFFF", op(.6)));
  }
  function frogSit(x, y, s) {
    return at(x, y, s, rock(0, 6, .7, true) + anim("kw-breathe", g(K.frog(), "translate(0 -6) scale(2.6)")));
  }
  function turtleSwim(x, y, s) {   // Tuk from above the water: shell, head, a little splash
    return at(x, y, s, anim("kw-bob",
      E(0, 4, 36, 9, "#FFFFFF", op(.35)) + E(0, 0, 30, 15, "url(#sp-shell)") + P("M-18,-4 L0,-12 L18,-4 L10,6 L-10,6 Z", "#2F7A4E", op(.35)) +
      E(-6, -6, 10, 4, "#FFFFFF", op(.3)) + E(-38, -4, 11, 9, "#93D26C") + C(-42, -7, 2.6, "#FFFFFF") + C(-42.6, -7, 1.6, "#1B1840") +
      L("M-47,-1 Q-43,2 -39,-1", "#2F5A24", 1.2) + E(28, 8, 7, 3, "#93D26C") + E(-22, 10, 7, 3, "#93D26C")));
  }
  function ripples(x, y, s) {
    return at(x, y, s, anim("kw-ripple-amb", E(0, 0, 30, 9, "none", ' stroke="#FFFFFF" stroke-width="2" opacity=".7"')) +
      anim("kw-ripple-amb", E(0, 0, 44, 13, "none", ' stroke="#FFFFFF" stroke-width="1.6" opacity=".5"'), delay(1.2)));
  }
  function pebble(x, y, s) {
    return at(x, y, s, E(0, 0, 10, 7.5, "url(#sp-purple)") + E(-3, -3, 4, 2, "#FFFFFF", op(.75)) + sparkle(8, -8, .7, "#FFFFFF"));
  }
  function tallGrass(x0, x1, yb, hgt, seed) {   // a curtain of tall grass (hides what is behind it)
    var r = K.rng(seed), front = "", back = "", i, cols = ["#5FAE52", "#4E9A46", "#77C462", "#3E8A40"];
    for (i = 0; x0 + i * 7 < x1; i++) {
      var x = x0 + i * 7 + r() * 5, h0 = hgt * (.7 + r() * .45), lean = (r() - .5) * 26, w = 5 + r() * 4;
      var blade = P("M" + n(x - w) + "," + yb + " C" + n(x - w * .4) + "," + n(yb - h0 * .5) + " " + n(x + lean * .6) + "," + n(yb - h0 * .85) + " " + n(x + lean) + "," + n(yb - h0) +
        " C" + n(x + lean * .5 + 2) + "," + n(yb - h0 * .7) + " " + n(x + w * .6) + "," + n(yb - h0 * .4) + " " + n(x + w) + "," + yb + " Z", cols[i % 4]);
      if (i % 2) front += blade; else back += blade;
    }
    return anim("kw-seaweed", back) + anim("kw-seaweed kw-seaweed--b", front) + R(x0 - 10, yb - 4, x1 - x0 + 20, 12, 6, "#4E9A46");
  }

  WA.addStoryPlace("burrow", {   // Ria's sunny meadow: her burrow, breakfast, a path into the forest
    P: { hz: 300, burrow: [118, 506], stone: [205, 424], mush: [320, 420], clover: [292, 548], hole: [122, 512], cloverAt: [232, 566], momo: [330, 664], path: [460, 580] },
    L: { hz: 225, burrow: [252, 404], stone: [500, 318], mush: [660, 300], clover: [706, 398], hole: [256, 410], cloverAt: [640, 422], momo: [858, 444], path: [1090, 430] },
    bg: function (W, H, hz, m, lay) {
      var h = sky(W, H, hz, SKY.morning, GROUND.meadow) + sun(m === "P" ? 316 : 840, m === "P" ? 104 : 84, .9) +
        cloud(m === "P" ? 96 : 200, m === "P" ? 92 : 70, .9, "kw-cloud--a") + cloud(m === "P" ? 250 : 560, m === "P" ? 196 : 120, .65, "kw-cloud--b") +
        birds(m === "P" ? 180 : 420, m === "P" ? 150 : 90, 1.1) +
        farHills(W, hz, "#BFE3B5", "#9CD39A", 4) +
        tree(m === "P" ? 40 : 90, hz + 8, 1.4) + pine(m === "P" ? 362 : 940, hz + 6, 1.2) + tree(m === "P" ? 300 : 760, hz + 12, 1.1, "bloss") + tree(m === "P" ? 182 : 470, hz + 4, .9);
      h += ground(W, H, hz) + patches(W, H, hz, 9) + tufts(W, H, hz + 14, 21, ["#5FA84F", "#4E9444"], 52);
      // the path out of the meadow, toward the forest
      h += P(m === "P" ? "M236,860 C246,740 330,640 470,600 L520,640 L520,900 Z" : "M720,640 C760,520 880,460 1100,430 L1140,520 L1140,700 Z", "url(#kw-sand)", op(.9));
      h += flowers(m === "P" ? 60 : 120, hz + 70, 1.3) + flowers(m === "P" ? 360 : 940, hz + 120, 1.2) + flowers(m === "P" ? 190 : 420, hz + 210, 1.1) +
        butterfly(m === "P" ? 170 : 380, hz + 60, 1.3, "#FFB020", "kw-bfly--a") + butterfly(m === "P" ? 320 : 820, hz + 40, 1.1, "#FF8FB0", "kw-bfly--b");
      h += hotG("burrow", burrow(lay.burrow[0], lay.burrow[1], m === "P" ? .95 : 1.05), "rustle");
      h += hotG("stone", rock(lay.stone[0], lay.stone[1], 1.35, true), "nope");
      h += hotG("mushroom", mushrooms(lay.mush[0], lay.mush[1], 1.2), "wiggle");
      h += hotG("clover", clover(lay.clover[0], lay.clover[1], 1.6), "rustle");
      return h + anchors(lay, ["hole", "cloverAt", "momo", "path"]);
    }
  });

  WA.addStoryPlace("ditch", {   // the forest edge: a log, a bush, rocks — and a deep ditch
    P: { hz: 290, log: [86, 404], bush: [322, 376], ditchAt: [205, 476], boulder: [322, 528], branch: [80, 556], leaf: [212, 600],
      start: [126, 652], momo: [338, 668], ditch: [205, 492], top: [292, 446], branchAt: [104, 618], ramp: [254, 470], rim: [130, 512],
      onRia: [130, 476], onLeaf: [212, 606], exit: [470, 640] },
    L: { hz: 220, log: [190, 306], bush: [820, 288], ditchAt: [500, 366], boulder: [770, 410], branch: [214, 420], leaf: [650, 436],
      start: [330, 444], momo: [880, 446], ditch: [500, 384], top: [622, 338], branchAt: [262, 440], ramp: [566, 356], rim: [390, 406],
      onRia: [390, 368], onLeaf: [650, 440], exit: [1090, 440] },
    bg: function (W, H, hz, m, lay) {
      var h = forestBase(W, H, hz, m, 23);
      h += hotG("log", logArt(lay.log[0], lay.log[1], 1) + reveal("snail", snail(lay.log[0] + 28, lay.log[1] - 24, 1.25), "st-pop"), "wiggle");
      h += hotG("bush", bush(lay.bush[0], lay.bush[1], 3.1) + flowers(lay.bush[0] - 20, lay.bush[1] - 30, 1.1), "rustle") +
        reveal("sparrow", sparrowAway(lay.bush[0] + 10, lay.bush[1] - 46, 1), "st-flyaway");
      h += hotG("ditch", ditch(lay.ditchAt[0], lay.ditchAt[1], m === "P" ? 1 : 1.25), "shine");
      h += hotG("boulder", rock(lay.boulder[0], lay.boulder[1], 1.7), "nope");
      h += hotG("branch", at(lay.branch[0], lay.branch[1], 1, branch(m === "P" ? 120 : 140)), "shine");
      h += hotG("leaf", leafSled(lay.leaf[0], lay.leaf[1], m === "P" ? 1 : 1.1), "bounce");
      return h + anchors(lay, ["start", "momo", "ditch", "top", "branchAt", "ramp", "rim", "onRia", "onLeaf", "exit"]);
    }
  });

  WA.addStoryPlace("lilypond", {   // the cool pond behind the tall grass
    P: { hz: 280, pond: [200, 470, 176, 74], lily: [146, 470], cattails: [350, 420], frog: [52, 464], dfly: [236, 352], water: [246, 486],
      arrive: [104, 650], tukAt: [198, 656], tukOn: [104, 612], momo: [334, 668], gift: [142, 664] },
    L: { hz: 210, pond: [520, 345, 300, 82], lily: [420, 350], cattails: [852, 310], frog: [192, 340], dfly: [600, 214], water: [610, 362],
      arrive: [176, 446], tukAt: [274, 452], tukOn: [176, 408], momo: [880, 446], gift: [220, 456] },
    bg: function (W, H, hz, m, lay) {
      var p = lay.pond, cx = p[0], cy = p[1], rx = p[2], ry = p[3];
      var h = sky(W, H, hz, SKY.day, GROUND.meadow) + sun(m === "P" ? 80 : 160, m === "P" ? 96 : 76, .8) +
        cloud(m === "P" ? 280 : 620, m === "P" ? 110 : 80, .85, "kw-cloud--a") + cloud(m === "P" ? 340 : 880, m === "P" ? 210 : 140, .6, "kw-cloud--c") +
        farHills(W, hz, "#C3E6B8", "#A2D69C", 8) + tree(m === "P" ? 30 : 60, hz + 10, 1.5, "deep") + tree(m === "P" ? 370 : 950, hz + 12, 1.4) +
        pine(m === "P" ? 120 : 300, hz + 4, 1) + tree(m === "P" ? 260 : 700, hz + 6, 1.05);
      h += ground(W, H, hz) + patches(W, H, hz, 12) + tufts(W, H, hz + 20, 33, ["#5FA84F", "#4E9444"], 44);
      // the pond
      h += E(cx + 8, cy + 10, rx + 14, ry + 10, "#23304A", op(.1)) + E(cx, cy, rx + 9, ry + 7, "url(#kw-sand)") + E(cx, cy, rx, ry, "url(#kw-water)") +
        anim("kw-wave", L("M" + n(cx - rx * .7) + "," + n(cy - ry * .3) + " q14,-5 28,0 t28,0 t28,0", "#FFFFFF", 1.8, op(.7))) +
        anim("kw-wave", L("M" + n(cx + rx * .1) + "," + n(cy + ry * .35) + " q12,-4 24,0 t24,0", "#FFFFFF", 1.5, op(.55))) +
        E(cx - rx * .35, cy - ry * .45, rx * .3, ry * .1, "#FFFFFF", op(.35)) +
        lilyPad(cx + rx * .32, cy + ry * .3, 1.4) + lilyPad(cx + rx * .62, cy - ry * .25, 1.1, true) + lilyPad(cx - rx * .62, cy + ry * .2, 1.2);
      h += hotG("water", E(lay.water[0], lay.water[1], m === "P" ? 70 : 120, m === "P" ? 30 : 34, "#FFFFFF", op(.01)), "shine");
      h += revealG("ripples", ripples(lay.water[0], lay.water[1] + 4, m === "P" ? 1 : 1.3)) + reveal("tukswim", turtleSwim(lay.water[0], lay.water[1], m === "P" ? 1 : 1.2), "st-fade");
      h += hotG("lily", lilyPad(lay.lily[0], lay.lily[1], 1.6) + lilyBud(lay.lily[0], lay.lily[1] - 8, 1.3), "bounce") +
        reveal("bloom", lilyBloom(lay.lily[0], lay.lily[1] - 6, 1.6), "st-bloom");
      h += reveal("pebble", pebble(lay.water[0] - 44, lay.water[1] - 2, 1.4), "st-pop");
      h += revealG("sparkle", sparkles(cx, cy - 10, 1.1, 7, m === "P" ? 220 : 380));
      // what hides the pond at first (gone when the child pushes it aside)
      h += hotG("tallgrass", tallGrass(cx - rx - 26, cx + rx + 26, cy + ry + 28, m === "P" ? 150 : 160, 5), "rustle");
      // clues that water is near
      h += hotG("cattails", cattails(lay.cattails[0], lay.cattails[1], m === "P" ? 1 : 1.15), "rustle");
      h += hotG("frog", frogSit(lay.frog[0], lay.frog[1], m === "P" ? 1 : 1.1), "bounce");
      h += hotG("dfly", E(lay.dfly[0], lay.dfly[1], 34, 22, "#FFFFFF", op(.01)) + revealG("dragonfly", dragonfly(lay.dfly[0] - 10, lay.dfly[1], 2.3)), "shine");
      h += flowers(m === "P" ? 40 : 90, hz + 300, 1.2) + flowers(m === "P" ? 372 : 940, hz + 290, 1.3);
      h += reveal("sled", leafSled(lay.tukAt[0], lay.tukAt[1] + 6, m === "P" ? .9 : 1), "st-fade");   // Tuk's leaf sled, if he came that way
      return h + anchors(lay, ["arrive", "tukAt", "tukOn", "momo", "gift"]);
    }
  });

  /* ================= THE LOST PUPPY ================= */
  function ballArt(x, y, s) {
    return at(x, y, s, shadow(2, 13, 15, 4) + C(0, 0, 14, "url(#kw-red)") + P("M-13,-3 C-6,2 6,2 13,-3 L13,2 C6,7 -6,7 -13,2 Z", "#FFFFFF", op(.9)) + E(-5, -7, 4.5, 3, "#FFFFFF", op(.55)));
  }
  function bench(x, y, s) {
    return at(x, y, s, shadow(8, 2, 52, 7) + R(-46, -26, 92, 8, 3, "url(#kw-wood)") + R(-46, -44, 92, 8, 3, "url(#kw-wood)") +
      R(-40, -26, 6, 26, 2, "#6E4526") + R(34, -26, 6, 26, 2, "#6E4526") + R(-40, -44, 5, 18, 2, "#6E4526") + R(35, -44, 5, 18, 2, "#6E4526"));
  }
  function picket(x0, x1, y, s, gapFrom, gapTo) {   // a white picket fence (optionally with a gap for a gate)
    var h = "", step = 16 * s, x;
    for (x = x0; x <= x1; x += step) {
      if (gapFrom != null && x > gapFrom && x < gapTo) continue;
      h += P("M" + n(x - 5 * s) + "," + y + " L" + n(x - 5 * s) + "," + n(y - 30 * s) + " L" + n(x) + "," + n(y - 37 * s) + " L" + n(x + 5 * s) + "," + n(y - 30 * s) + " L" + n(x + 5 * s) + "," + y + " Z", "#FFFDF6");
    }
    function rail(yy) {
      return gapFrom == null ? R(x0 - 6, yy, x1 - x0 + 12, 5 * s, 2, "#F1E6D2") :
        R(x0 - 6, yy, gapFrom - x0 + 6, 5 * s, 2, "#F1E6D2") + R(gapTo, yy, x1 - gapTo + 6, 5 * s, 2, "#F1E6D2");
    }
    return rail(y - 24 * s) + rail(y - 10 * s) + h;
  }
  function roseBush(x, y, s) {
    var h = bush(0, 0, 1.25), r = [[-12, -14], [4, -20], [14, -10], [-2, -8], [-16, -4]];
    r.forEach(function (p, i) { h += C(p[0], p[1], 3.6, i % 2 ? "#E8413C" : "#FF5E7E") + C(p[0] - .6, p[1] - .6, 1.4, "#9E1F2A", op(.5)); });
    return at(x, y, s, h);
  }
  function pawTrail(x, y, s, n0) {   // a little trail of puppy paw prints
    var h = "";
    for (var i = 0; i < (n0 || 4); i++) {
      var px = i * 22 - 30, py = -i * 12 + (i % 2 ? 6 : -6);
      h += at(px, py, 1, E(0, 0, 4.2, 3.6, "#6B4A2E", op(.8)) + C(-4.4, -5, 1.8, "#6B4A2E", op(.8)) + C(-1.4, -7, 1.8, "#6B4A2E", op(.8)) +
        C(1.8, -7, 1.8, "#6B4A2E", op(.8)) + C(4.6, -5, 1.8, "#6B4A2E", op(.8)), -20);
    }
    return at(x, y, s, E(0, -14, 52, 20, "#E8D2A8", op(.35)) + h);
  }
  function streetLamp(x, y, s) {
    return at(x, y, s, shadow(5, 1, 12, 3) + R(-2.5, -74, 5, 74, 2, "#4E4470") + R(-7, -4, 14, 5, 2, "#4E4470") +
      R(-9, -92, 18, 18, 4, "#FFF4D8", op(.85)) + R(-9, -92, 18, 18, 4, "none", ' stroke="#4E4470" stroke-width="2.4"') +
      P("M-12,-92 L0,-102 L12,-92 Z", "#4E4470") + C(0, -104, 2.4, "#4E4470"));
  }
  function lampGlow(x, y, s) {   // revealed: the lamp lights up
    return at(x, y, s, C(0, -83, 46, "url(#sp-lamp)", ' class="st-glowpulse"') + R(-7, -90, 14, 14, 3, "#FFF0A8") + C(0, -83, 5, "#FFFFFF", op(.9)));
  }
  function win(x, y, lit) {
    return R(x - 11, y - 11, 22, 22, 2, "#8B5A33") + R(x - 9, y - 9, 18, 18, 1.5, lit ? "url(#sp-lit)" : "#9BB8E8") +
      L("M" + x + "," + (y - 9) + " L" + x + "," + (y + 9) + " M" + (x - 9) + "," + y + " L" + (x + 9) + "," + y, "#8B5A33", 2) + R(x - 13, y + 9, 26, 4, 1.5, "#A87146");
  }
  function doorArt(c) { return P("M-14,-2 L-14,-38 C-14,-52 14,-52 14,-38 L14,-2 Z", c) + P("M-10,-6 L-10,-36 C-10,-46 10,-46 10,-36 L10,-6 Z", "#000000", op(.12)) + C(8, -20, 2.4, "#FFD24D"); }
  function cottage(o) {   // a front-facing cottage, base centre (0,0): ~140 tall, ~140 wide
    var h = shadow(12, 2, 74, 9) +
      R(-58, -88, 116, 88, 3, o.wall) + R(40, -88, 18, 88, 0, "#1E1A3A", op(.08)) +
      P("M-72,-84 L0,-142 L72,-84 Z", o.roof) + P("M-72,-84 L0,-142 L0,-132 L-58,-84 Z", "#FFFFFF", op(.14)) +
      L("M-72,-84 L0,-142 L72,-84", "#3A2418", 2.4, op(.35)) +
      R(28, -132, 14, 30, 2, "#B9694A") + R(26, -136, 18, 6, 2, "#8E4A33") +
      win(-34, -56, o.lit) + win(34, -56, o.lit) + C(0, -104, 9, "#8B5A33") + C(0, -104, 7, o.lit ? "url(#sp-lit)" : "#9BB8E8") +
      R(-20, -3, 40, 5, 2, "#CDBBA0");
    if (o.door) h += doorArt(o.door);
    if (o.roses) h += roseBush(-44, 0, .7) + roseBush(44, 0, .7);
    else h += R(-56, -14, 20, 14, 3, "#B9694A") + flowers(-46, -16, 1) + R(36, -14, 20, 14, 3, "#B9694A") + flowers(46, -16, 1, ["#FFFFFF", "#B79CFF", "#FFD24D"]);
    if (o.cat) h += E(34, -51, 7, 5, "#3A3A48") + C(34, -58, 5, "#3A3A48") + P("M30,-61 L31,-66 L33,-61 Z M35,-61 L37,-66 L38,-61 Z", "#3A3A48") + C(32.4, -58.6, .9, "#FFE27A") + C(35.6, -58.6, .9, "#FFE27A");
    return h;
  }
  function moonStars(W, hz, mx, my, seed) {
    var r = K.rng(seed), list = [];
    for (var i = 0; i < 34; i++) list.push([-200 + r() * (W + 400), -60 + r() * (hz - 40), .8 + r() * 1.2, i % 5 ? "#FFFFFF" : "#FFE9A8"]);
    return K.stars(list) + C(mx, my, 60, "url(#kw-softglow)", op(.6)) + C(mx, my, 24, "url(#sp-moon)") + C(mx - 7, my - 4, 4, "#E9D48A", op(.6)) + C(mx + 6, my + 7, 3, "#E9D48A", op(.5));
  }
  function fireflies(x, y, w, hgt, seed) {
    var r = K.rng(seed), h = "";
    for (var i = 0; i < 9; i++) h += anim("kw-tw", C(x + r() * w, y + r() * hgt, 2.2, "#FFF1A0") + C(x + r() * w, y + r() * hgt, 1.2, "#FFFFFF", op(.8)), delay(n(r() * 2.4)));
    return h;
  }

  WA.addStoryPlace("park", {   // a sunny park: a ball to throw, a butterfly to chase
    P: { hz: 300, tree: [64, 470], bench: [310, 430], bed: [116, 520], ball: [236, 566], bfly: [262, 424],
      grass: [134, 626], far: [318, 512], edge: [480, 488], edgeB: [470, 330] },
    L: { hz: 230, tree: [126, 400], bench: [712, 356], bed: [594, 388], ball: [482, 428], bfly: [790, 296],
      grass: [330, 446], far: [764, 424], edge: [1100, 426], edgeB: [1090, 200] },
    bg: function (W, H, hz, m, lay) {
      var h = sky(W, H, hz, SKY.day, GROUND.meadow) + sun(m === "P" ? 330 : 860, m === "P" ? 96 : 76, .85) +
        cloud(m === "P" ? 120 : 260, m === "P" ? 84 : 66, .9, "kw-cloud--a") + cloud(m === "P" ? 280 : 600, m === "P" ? 190 : 110, .7, "kw-cloud--b") +
        farHills(W, hz, "#C3E6B8", "#A4D79C", 15) + K.house(m === "P" ? 340 : 900, hz + 2, .9, "kw-roof") + K.house(m === "P" ? 280 : 760, hz - 2, .7, "kw-roof-b") +
        tree(m === "P" ? 200 : 520, hz + 6, 1);
      h += ground(W, H, hz) + patches(W, H, hz, 17) + tufts(W, H, hz + 16, 41, ["#5FA84F", "#4E9444"], 46);
      h += P(m === "P" ? "M150,900 C170,760 260,600 380,500 L430,520 C330,610 260,760 260,900 Z" : "M560,700 C600,560 760,440 1100,390 L1120,450 C820,500 700,580 680,700 Z", "url(#kw-sand)", op(.9));
      h += picket(-40, W + 40, hz + 40, m === "P" ? 1 : 1.1, m === "P" ? 360 : 860, m === "P" ? 420 : 940);
      h += tree(lay.tree[0], lay.tree[1], m === "P" ? 2.9 : 3.2) + bench(lay.bench[0], lay.bench[1], m === "P" ? .9 : 1.1);
      h += at(lay.bed[0], lay.bed[1], 1, E(0, 0, 58, 16, "url(#sp-soil)") + flowers(-28, -6, 2) + flowers(8, -4, 2.2, ["#FFD24D", "#FF7FA8", "#FFFFFF"]) + flowers(34, -6, 1.8));
      h += butterfly(m === "P" ? 60 : 160, hz + 40, 1.1, "#FF8FB0", "kw-bfly--b");
      h += hotG("ball", ballArt(lay.ball[0], lay.ball[1], m === "P" ? 1.3 : 1.4), "bounce");
      h += reveal("bfly", butterflyStill(lay.bfly[0], lay.bfly[1], 3, "#FFB020"), "st-pop");
      return h + anchors(lay, ["grass", "far", "edge", "edgeB"]);
    }
  });

  function laneScene(W, H, hz, m, lay) {
    var h = sky(W, H, hz, SKY.dusk, GROUND.dusk) + at(lay.sun[0], lay.sun[1], 1, C(0, 0, 90, "url(#kw-softglow)") + C(0, 0, 30, "#FFD27A", op(.9))) +
      cloud(m === "P" ? 280 : 640, m === "P" ? 120 : 90, .8, "kw-cloud--a") +
      farHills(W, hz, "#B79CC8", "#9C8AB8", 21);
    h += ground(W, H, hz) + patches(W, H, hz, 25) + tufts(W, H, hz + 18, 52, ["#5E8A5A", "#4E7A4E"], 40);
    h += at(lay.houseL[0], lay.houseL[1], m === "P" ? .5 : .62, cottage({ wall: "#F1D9B8", roof: "url(#kw-roof)", door: "#6E8FD8", lit: true })) +
      at(lay.houseR[0], lay.houseR[1], m === "P" ? .46 : .58, cottage({ wall: "#D9E2F4", roof: "url(#kw-roof-v)", door: "#3E9A63", lit: true }));
    // a cobbled lane winding away
    h += P(m === "P" ? "M70,900 C110,760 180,620 250,500 C290,430 320,380 350,340 L372,346 C350,390 330,440 300,510 C250,640 220,780 230,900 Z"
      : "M180,700 C300,560 460,450 640,380 C740,340 840,310 1000,290 L1010,312 C860,340 760,370 670,410 C520,480 400,580 360,700 Z", "#D9C3A0");
    h += hotG("fence", at(lay.fence[0], lay.fence[1], m === "P" ? 1 : 1.15, R(-80, -50, 160, 50, 3, "url(#kw-wood)") +
      L("M-60,-50 L-60,0 M-20,-50 L-20,0 M20,-50 L20,0 M60,-50 L60,0", "#7A4B2A", 1.6, op(.6)) + R(-84, -54, 168, 7, 3, "#A86A3C")), "wiggle");
    h += hotG("roses", roseBush(lay.roses[0], lay.roses[1], m === "P" ? 1.7 : 1.9), "rustle");
    h += hotG("prints", pawTrail(lay.prints[0], lay.prints[1], m === "P" ? 1.15 : 1.3), "shine");
    // night falls over everything except the lamps
    // warm windows glow through the dark ("friendly lights far away")
    var lit = function (p, sc) { return at(p[0], p[1], sc, C(-34, -56, 22, "url(#sp-lamp)") + C(34, -56, 22, "url(#sp-lamp)") + R(-43, -65, 18, 18, 2, "#FFD86A") + R(25, -65, 18, 18, 2, "#FFD86A") + C(0, -104, 7, "#FFD86A")); };
    h += reveal("night", R(-900, -900, W + 1800, H + 1800, 0, "#141C4A", op(.56)) + moonStars(W, hz, lay.moon[0], lay.moon[1], 7) +
      lit(lay.houseL, m === "P" ? .5 : .62) + lit(lay.houseR, m === "P" ? .46 : .58), "st-dusk");
    ["lamp1", "lamp2", "lamp3"].forEach(function (k, i) {
      var p = lay[k];
      h += hotG(k, streetLamp(p[0], p[1], m === "P" ? 1 : 1.1), "shine") + reveal("glow" + (i + 1), lampGlow(p[0], p[1], m === "P" ? 1 : 1.1), "st-fade");
    });
    return h + anchors(lay, ["middle", "momoIn", "momo", "lamp1s", "lamp2s", "lamp3s"]);
  }
  WA.addStoryPlace("lane", {   // a village lane at sunset: clues, then the lamps light the way
    P: { hz: 330, sun: [70, 300], houseL: [78, 410], houseR: [322, 392], moon: [312, 120], fence: [86, 468], roses: [328, 530], prints: [204, 590],
      lamp1: [52, 612], lamp2: [210, 472], lamp3: [330, 382],
      middle: [190, 662], momoIn: [-80, 668], momo: [330, 670], lamp1s: [104, 640], lamp2s: [252, 520], lamp3s: [292, 436] },
    L: { hz: 250, sun: [150, 240], houseL: [190, 300], houseR: [866, 290], moon: [840, 90], fence: [140, 360], roses: [880, 404], prints: [530, 432],
      lamp1: [330, 446], lamp2: [600, 384], lamp3: [812, 332],
      middle: [440, 452], momoIn: [-100, 452], momo: [230, 454], lamp1s: [382, 456], lamp2s: [650, 410], lamp3s: [860, 372] },
    bg: laneScene
  });

  WA.addStoryPlace("homes", {   // three cosy houses at night — which one is Biscuit's?
    P: { hz: 380, A: [76, 470, .6], B: [200, 446, .68], C: [324, 470, .6], moon: [318, 104],
      path: [236, 656], momo: [80, 664], gate: [200, 548], hug: [236, 566] },
    L: { hz: 300, A: [246, 382, .82], B: [500, 364, .92], C: [754, 382, .82], moon: [880, 90],
      path: [566, 462], momo: [140, 462], gate: [500, 418], hug: [548, 430] },
    bg: function (W, H, hz, m, lay) {
      var h = sky(W, H, hz, SKY.night, GROUND.night) + moonStars(W, hz, lay.moon[0], lay.moon[1], 11) +
        farHills(W, hz, "#2E3A6E", "#2A4A5E", 31) + g(pine(m === "P" ? 20 : 80, hz + 4, 1.3) + pine(m === "P" ? 380 : 930, hz + 6, 1.4), "", "", op(.5));
      h += ground(W, H, hz) + patches(W, H, hz, 33, "#9FB8FF") + tufts(W, H, hz + 20, 61, ["#3E5E58", "#33504C"], 34);
      var A = lay.A, B = lay.B, Cc = lay.C;
      h += P(m === "P" ? "M150,900 C170,760 190,600 194,452 L206,452 C214,600 236,760 262,900 Z" : "M430,700 C460,560 486,440 492,372 L508,372 C516,440 540,560 590,700 Z", "#C9B48E", op(.8));
      h += hotG("houseA", at(A[0], A[1], A[2], cottage({ wall: "#EBD38E", roof: "url(#kw-roof)", door: "#3E6FD1", roses: true, lit: true })), "shine");
      h += hotG("houseB", at(B[0], B[1], B[2], cottage({ wall: "#EFE4D2", roof: "url(#kw-roof-v)", roses: true, lit: true })), "shine");
      h += hotG("door", at(B[0], B[1], B[2], doorArt("#D93A3A")), "bounce");
      h += reveal("doorOpen", at(B[0], B[1], B[2], P("M-14,-2 L-14,-38 C-14,-52 14,-52 14,-38 L14,-2 Z", "url(#sp-lit)") + P("M14,-2 L14,-40 L24,-44 L24,-6 Z", "#B42E2E")), "st-fade");
      h += reveal("porch", at(B[0], B[1], B[2], C(0, -58, 34, "url(#sp-lamp)", ' class="st-glowpulse"') + R(-4, -66, 8, 8, 2, "#FFF0A8")), "st-fade");
      h += hotG("houseC", at(Cc[0], Cc[1], Cc[2], cottage({ wall: "#B9CFEC", roof: "url(#kw-roof-b)", door: "#D93A3A", cat: true, lit: true })), "shine");
      h += picket(-40, W + 40, m === "P" ? 540 : 410, m === "P" ? .9 : 1, lay.gate[0] - 30, lay.gate[0] + 30);
      h += fireflies(-20, hz - 40, W + 40, m === "P" ? 280 : 160, 5);
      return h + anchors(lay, ["path", "momo", "gate", "hug"]);
    }
  });

  /* ================= THE TIDY ROOM ================= */
  var ROOM_DEFS = lg("sp-wall", 0, 0, 0, 1, [[0, "#F3ECFF"], [1, "#DED2F6"]]) + lg("sp-floor", 0, 0, 0, 1, [[0, "#EBC092"], [1, "#C48B55"]]) +
    lg("sp-teddy", 0, 0, .7, 1, [[0, "#DDA46C"], [1, "#A86A34"]]) + lg("sp-toybox", 0, 0, 0, 1, [[0, "#FF9FBF"], [1, "#E0608E"]]) +
    lg("sp-winsky", 0, 0, 0, 1, [[0, "#8FD0FF"], [1, "#E4F6FF"]]) + lg("sp-curtain", 0, 0, 1, 0, [[0, "#C9A8FF"], [.5, "#E3D2FF"], [1, "#A985F0"]]);
  function teddyArt() {
    return shadow(2, 2, 22, 4) + C(-14, -42, 8, "#B9783E") + C(14, -42, 8, "#B9783E") + C(-14, -42, 4, "#E8B98A") + C(14, -42, 4, "#E8B98A") +
      E(-17, -16, 6, 9, "url(#sp-teddy)") + E(17, -16, 6, 9, "url(#sp-teddy)") + E(0, -15, 16, 15, "url(#sp-teddy)") + E(0, -13, 9, 9, "#EBC9A0") +
      E(-9, -2, 7, 4.5, "#B9783E") + E(9, -2, 7, 4.5, "#B9783E") +
      C(0, -36, 14, "url(#sp-teddy)") + E(0, -31, 6.5, 4.8, "#EBC9A0") + C(-5, -38, 1.9, "#2B2151") + C(5, -38, 1.9, "#2B2151") + E(0, -33, 2.4, 1.7, "#2B2151") +
      P("M-7,-24 L0,-21 L7,-24 L7,-18 L0,-21 L-7,-18 Z", "#E8413C");
  }
  function bookToy(c) {
    return shadow(0, 2, 24, 4) + P("M-23,0 L-21,-15 L0,-11 L21,-15 L23,0 L0,4 Z", c) + P("M-19,-2 L-18,-13 L-1,-9 L-1,1 Z", "#FFFDF4") + P("M1,1 L1,-9 L18,-13 L19,-2 Z", "#FFF4DC") +
      L("M-15,-9 L-5,-7 M-15,-6 L-5,-4 M5,-7 L15,-9 M5,-4 L15,-6", "#B9A887", .9);
  }
  function shirtToy(c) {
    return shadow(0, 2, 26, 4) + P("M-12,-28 L-25,-19 L-20,-8 L-14,-12 L-14,0 L14,0 L14,-12 L20,-8 L25,-19 L12,-28 C8,-23 -8,-23 -12,-28 Z", c) +
      P("M-12,-28 C-8,-23 8,-23 12,-28 L9,-28 C6,-25 -6,-25 -9,-28 Z", "#FFFFFF", op(.5)) + C(0, -13, 5, "#FFE680") + C(0, -13, 2.2, "#FFFFFF", op(.7));
  }
  function ballToy() {
    return shadow(0, 2, 16, 4) + C(0, -15, 15, "url(#sp-yellow)") + P("M-15,-15 C-8,-24 8,-24 15,-15 C8,-19 -8,-19 -15,-15 Z", "#3E78D8") +
      P("M-14,-10 C-6,-4 6,-4 14,-10 C6,-7 -6,-7 -14,-10 Z", "#E8413C") + E(-6, -21, 4, 2.6, "#FFFFFF", op(.6));
  }
  function carToy() {
    return shadow(0, 2, 24, 4) + R(-22, -17, 44, 13, 5, "url(#kw-red)") + P("M-11,-17 L-6,-28 L9,-28 L13,-17 Z", "#E8413C") + R(-4, -26, 9, 7, 1.5, "#CFE7FF") +
      C(-12, -4, 5.4, "#2B2151") + C(12, -4, 5.4, "#2B2151") + C(-12, -4, 2.2, "#C9CED9") + C(12, -4, 2.2, "#C9CED9") + R(18, -14, 4, 4, 1, "#FFE680");
  }
  function blocksToy() {
    return shadow(0, 2, 26, 4) + R(-24, -17, 17, 17, 2.5, "#5B8DEF") + R(-5, -17, 17, 17, 2.5, "#FFC23D") + R(-14, -34, 17, 17, 2.5, "#E8413C") +
      C(-15.5, -8.5, 3.6, "#FFFFFF", op(.85)) + P("M3.5,-12 L6.5,-6 L0.5,-6 Z", "#FFFFFF", op(.85)) + R(-9, -29, 7, 7, 1, "#FFFFFF", op(.85));
  }
  function socksPile() {
    return shadow(0, 2, 30, 5) + P("M-28,-4 C-30,-14 -18,-18 -10,-12 C-6,-20 6,-22 10,-14 C18,-20 30,-14 28,-4 Z", "#5B8DEF") +
      P("M-24,-8 C-20,-16 -10,-16 -6,-8 Z", "#FF7FA8") + P("M4,-10 C8,-18 18,-18 22,-10 Z", "#FFC23D") + P("M-10,-6 C-6,-14 6,-14 8,-6 Z", "#9B7BEA") +
      L("M-22,-10 L-14,-12 M8,-12 L16,-14", "#FFFFFF", 1.6, op(.8)) + C(-2, -11, 1.4, "#FFFFFF") + C(2, -9, 1.4, "#FFFFFF");
  }
  function dinoToy() {
    return shadow(0, 2, 24, 4) + P("M-22,-6 C-30,-8 -32,-2 -26,0 L16,0 C24,-2 24,-16 14,-18 C10,-30 20,-38 26,-34 C30,-32 30,-26 26,-24 C22,-24 20,-20 22,-16 C26,-10 20,-4 12,-6 Z", "#5FC46E") +
      P("M-6,-14 L-2,-20 L2,-14 M4,-16 L8,-22 L12,-16", "#2E8A45") + C(24, -31, 1.6, "#1E1A24") + R(-12, -6, 5, 7, 2, "#4FA85A") + R(6, -6, 5, 7, 2, "#4FA85A");
  }
  function bedFrame(w) {   // base-left at the floor (0,0); headboard on the left
    return shadow(w / 2, 4, w / 2 + 8, 9) + R(0, -120, 26, 120, 7, "url(#kw-wood)") + C(13, -104, 6, "#FFD24D") + R(w - 18, -74, 18, 74, 6, "url(#kw-wood)") +
      R(8, -64, w - 14, 32, 9, "#F6F2FC") + R(10, -34, w - 18, 9, 3, "#9A6036") + R(14, -26, 9, 26, 2, "#7A4B2A") + R(w - 24, -26, 9, 26, 2, "#7A4B2A");
  }
  function messyBlanket(w) {
    return P("M26,-60 C34,-96 62,-82 76,-100 C92,-118 112,-92 126,-104 C140,-114 " + (w - 6) + ",-96 " + (w - 2) + ",-62 L" + (w - 10) + ",-34 L28,-34 Z", "url(#sp-blue)") +
      P("M52,-84 C64,-92 76,-86 84,-96 M104,-98 C116,-92 124,-100 134,-96", "none", ' stroke="#2F5BB8" stroke-width="2" opacity=".5"') +
      R(30, -78, 34, 20, 9, "#FFFFFF", ' transform="rotate(-22 47 -68)"') + C(96, -70, 4, "#FFFFFF", op(.6)) + C(116, -60, 4, "#FFFFFF", op(.6));
  }
  function tidyBlanket(w) {
    return R(28, -64, 34, 18, 8, "#FFFFFF") + R(66, -66, w - 74, 34, 8, "url(#sp-blue)") + R(66, -66, w - 74, 9, 6, "#9FD3FF") +
      C(100, -46, 3.6, "#FFFFFF", op(.65)) + C(130, -44, 3.6, "#FFFFFF", op(.65)) + C(160, -46, 3.6, "#FFFFFF", op(.65));
  }
  function dresserArt(w, h) {   // base-left at the floor
    var dh = (h - 16) / 3, s = shadow(w / 2, 3, w / 2 + 6, 7) + R(0, -h, w, h, 6, "url(#kw-wood-h)") + R(-4, -h - 6, w + 8, 9, 3, "#C98A52");
    for (var i = 1; i < 3; i++) s += R(7, -h + 8 + i * dh, w - 14, dh - 6, 4, "#E8B47A") + C(w / 2, -h + 8 + i * dh + (dh - 6) / 2, 3, "#8A5A36");
    // the top drawer is pulled open
    s += R(7, -h + 8, w - 14, dh - 6, 3, "#3E2814") + R(2, -h + 12, w - 4, dh - 2, 4, "#F0C48C") + R(2, -h + 12, w - 4, 6, 3, "#C98A52") + C(w / 2, -h + 14 + dh / 2, 3, "#8A5A36");
    return s + E(w * .78, -h - 10, 9, 6, "url(#kw-leaf)") + R(w * .78 - 6, -h - 8, 12, 8, 2, "#E0608E") + C(w * .22, -h - 16, 9, "#FFE680", op(.9)) + R(w * .22 - 2, -h - 8, 4, 4, 1, "#8A5A36");
  }
  function shelfArt(w, h) {
    var s = shadow(w / 2, 3, w / 2 + 6, 7) + R(0, -h, w, h, 6, "url(#kw-wood)") + R(8, -h + 8, w - 16, h - 16, 3, "#6E4526");
    for (var i = 1; i <= 3; i++) s += R(4, -h + i * (h / 4), w - 8, 6, 2, "#C98A52");
    var bx = 12, cols = ["#E8413C", "#5B8DEF", "#FFC23D", "#4FBF7A"];
    for (var j = 0; j < 4; j++) { s += R(bx, -h + h / 4 - 26 - (j % 2) * 4, 9, 26 + (j % 2) * 4, 1.5, cols[j]); bx += 11; }
    return s + R(w - 30, -h + h / 4 - 18, 16, 18, 4, "#B79CFF") + C(w - 22, -h + h / 4 - 22, 5, "#FFD24D");
  }
  function shelfBooks(w, h) {   // revealed on the middle shelf when a book is put away
    var bx = 14, s = "", cols = ["#9B7BEA", "#E8413C", "#3FA45A", "#FF9A3C", "#5B8DEF", "#FF7FA8"];
    for (var j = 0; j < 6; j++) { s += R(bx, -h + 2 * (h / 4) - 28 - (j % 3) * 3, 10, 28 + (j % 3) * 3, 1.5, cols[j]); bx += 12; }
    return s;
  }
  function toyBox(w, h) {   // base-centre at the floor; lid open behind
    return shadow(4, 3, w / 2 + 8, 8) + P("M" + (-w / 2 + 4) + "," + (-h) + " L" + (-w / 2 - 6) + "," + (-h - 44) + " L" + (w / 2 + 6) + "," + (-h - 44) + " L" + (w / 2 - 4) + "," + (-h) + " Z", "#E77FA5") +
      R(-w / 2, -h, w, h, 9, "url(#sp-toybox)") + R(-w / 2, -h, w, 10, 5, "#FFC0D6") + R(-w / 2, -h + 30, w, 9, 0, "#FFFFFF", op(.35)) +
      P("M0,-" + (h - 46) + " l4.6,9.4 10.4,1.5 -7.5,7.3 1.8,10.3 -9.3,-4.9 -9.3,4.9 1.8,-10.3 -7.5,-7.3 10.4,-1.5z", "#FFE27A") + E(0, -h + 3, w / 2 - 8, 5, "#7A3A5E", op(.65));
  }
  function wallClock() {
    return anim("kw-tilt", L("M0,10 L0,70", "#8A5A36", 2.4) + C(0, 74, 8, "url(#kw-gold)")) +
      P("M-30,-18 L0,-44 L30,-18 L30,24 L-30,24 Z", "url(#kw-wood)") + C(0, 0, 21, "#FFFDF4") + C(0, 0, 21, "none", ' stroke="#C98A52" stroke-width="3"') +
      C(0, -16, 1.6, "#5E3A20") + C(16, 0, 1.6, "#5E3A20") + C(0, 16, 1.6, "#5E3A20") + C(-16, 0, 1.6, "#5E3A20") +
      L("M0,0 L-2,13 M0,0 L0,-14", "#2B2151", 2.4) + C(0, 0, 2.4, "#E8413C");
  }
  function roomWindow(w, h) {   // top-left (0,0)
    return R(-9, -9, w + 18, h + 18, 9, "#FFFFFF") + R(0, 0, w, h, 4, "url(#sp-winsky)") + C(w * .76, h * .3, 13, "#FFE680") + cloud(w * .3, h * .36, .5) +
      L("M" + n(w / 2) + ",0 L" + n(w / 2) + "," + h + " M0," + n(h / 2) + " L" + w + "," + n(h / 2), "#FFFFFF", 5) + R(-16, h + 6, w + 32, 11, 5, "#E8DCF8") +
      L("M-20,-16 L" + (w + 20) + ",-16", "#B79CFF", 4);
  }
  function curtainsShut(w, h) {
    return P("M-18,-14 C" + n(w * .2) + ",-10 " + n(w * .35) + ",-12 " + n(w * .52) + ",-14 L" + n(w * .5) + "," + (h + 10) + " C" + n(w * .3) + "," + (h + 4) + " " + n(w * .1) + "," + (h + 12) + " -18," + (h + 8) + " Z", "url(#sp-curtain)") +
      P("M" + (w + 18) + ",-14 C" + n(w * .8) + ",-10 " + n(w * .65) + ",-12 " + n(w * .48) + ",-14 L" + n(w * .5) + "," + (h + 10) + " C" + n(w * .7) + "," + (h + 4) + " " + n(w * .9) + "," + (h + 12) + " " + (w + 18) + "," + (h + 8) + " Z", "url(#sp-curtain)") +
      L("M" + n(w * .15) + ",-8 L" + n(w * .16) + "," + h + " M" + n(w * .32) + ",-8 L" + n(w * .33) + "," + h + " M" + n(w * .68) + ",-8 L" + n(w * .67) + "," + h + " M" + n(w * .85) + ",-8 L" + n(w * .84) + "," + h, "#9C7BE0", 2, op(.45));
  }
  function curtainsOpen(w, h) {
    return P("M-24,-14 L8,-14 C2," + n(h * .4) + " 10," + n(h * .7) + " 0," + (h + 10) + " L-24," + (h + 10) + " Z", "url(#sp-curtain)") +
      P("M" + (w + 24) + ",-14 L" + (w - 8) + ",-14 C" + (w - 2) + "," + n(h * .4) + " " + (w - 10) + "," + n(h * .7) + " " + w + "," + (h + 10) + " L" + (w + 24) + "," + (h + 10) + " Z", "url(#sp-curtain)") +
      R(-26, n(h * .5), 22, 7, 3, "#FFD24D") + R(w + 4, n(h * .5), 22, 7, 3, "#FFD24D");
  }
  function room(W, H, fy) {
    var h = big(-900, -900, W + 1800, fy + 900, "url(#sp-wall)"), i, j;
    for (i = -2; i < W / 46 + 2; i++) for (j = 0; j < fy / 52; j++) h += sparkle(i * 46 + (j % 2) * 23, j * 52 + 26, .55, "#FFFFFF");
    h += big(-900, fy - 12, W + 1800, 14, "#FFFFFF") + big(-900, fy, W + 1800, H + 900, "url(#sp-floor)");
    for (j = 0; j < 9; j++) h += L("M-900," + (fy + 26 + j * j * 7) + " L" + (W + 900) + "," + (fy + 26 + j * j * 7), "#B07A48", 1.4, op(.35));
    return h;
  }
  function bedroom(W, H, hz, m, lay) {
    var f = lay.fy, b = lay.bed, d = lay.dresser, s = lay.shelf, t = lay.box, w0 = lay.win, h = "<defs>" + SHARED + ROOM_DEFS + "</defs>" + room(W, H, f);
    h += at(lay.rug[0], lay.rug[1], 1, E(0, 0, lay.rug[2], lay.rug[3], "#BFE0FF") + E(0, 0, lay.rug[2] - 12, lay.rug[3] - 6, "none", ' stroke="#FFFFFF" stroke-width="3" stroke-dasharray="10 8" opacity=".8"'));
    // the window: curtains shut at first (a little dim), open at the end with a sunbeam
    h += at(w0[0], w0[1], 1, roomWindow(w0[2], w0[3]));
    h += reveal("sunbeam", P("M" + w0[0] + "," + (w0[1] + w0[3]) + " L" + (w0[0] + w0[2]) + "," + (w0[1] + w0[3]) + " L" + (w0[0] + w0[2] + 90) + "," + (f + 120) + " L" + (w0[0] - 40) + "," + (f + 120) + " Z", "#FFF3B0", op(.22)), "st-fade");
    h += hotG("window", at(w0[0], w0[1], 1, R(-12, -12, w0[2] + 24, w0[3] + 24, 9, "#FFFFFF", op(.01)) + g(curtainsShut(w0[2], w0[3]), "", "st-prop", ' data-prop="curtains"')), "bounce");
    h += reveal("curtainsOpen", at(w0[0], w0[1], 1, curtainsOpen(w0[2], w0[3])), "st-fade");
    h += hotG("clock", at(lay.clock[0], lay.clock[1], lay.clock[2], wallClock()), "wiggle");
    // furniture along the wall
    h += at(b[0], b[1], 1, bedFrame(b[2]));
    h += hotG("underbed", at(b[0], b[1], 1, R(24, -26, b[2] - 52, 24, 4, "#2E2448", op(.55))), "shine");
    h += reveal("dino", at(lay.dino[0], lay.dino[1], 1.1, dinoToy()), "st-pop");
    h += reveal("tidyBed", at(b[0], b[1], 1, tidyBlanket(b[2])), "st-fade");
    h += hotG("blanket", at(b[0], b[1], 1, messyBlanket(b[2])), "wiggle");
    h += hotG("drawer", at(d[0], d[1], 1, dresserArt(d[2], d[3])), "shine");
    h += reveal("drawer-shirt", at(d[0], d[1], 1, P("M14," + (-d[3] + 12) + " C20," + (-d[3] - 4) + " 34," + (-d[3] - 2) + " 38," + (-d[3] + 12) + " Z", "#FF9A3C")), "st-pop");
    h += reveal("drawer-socks", at(d[0], d[1], 1, P("M44," + (-d[3] + 12) + " C48," + (-d[3] - 2) + " 60," + (-d[3] - 4) + " " + (d[2] - 12) + "," + (-d[3] + 12) + " Z", "#5B8DEF") +
      C(52, -d[3] + 6, 1.6, "#FFFFFF") + C(58, -d[3] + 3, 1.6, "#FFFFFF")), "st-pop");
    h += hotG("shelf", at(s[0], s[1], 1, shelfArt(s[2], s[3])), "shine");
    h += reveal("shelf-book", at(s[0], s[1], 1, shelfBooks(s[2], s[3])), "st-pop");
    // the toy box and what will peek out of it
    h += hotG("toybox", at(t[0], t[1], 1, toyBox(t[2], t[3])), "bounce");
    var top = t[1] - t[3];
    h += reveal("box-teddy", at(t[0] - t[2] * .22, top + 8, .9, teddyArt()), "st-pop") + reveal("box-ball", at(t[0] + t[2] * .12, top + 6, .9, ballToy()), "st-pop") +
      reveal("box-car", at(t[0] + t[2] * .3, top + 8, .7, carToy()), "st-pop") + reveal("box-blocks", at(t[0] - t[2] * .02, top + 6, .7, blocksToy()), "st-pop") +
      reveal("box-dino", at(t[0] + t[2] * .36, top + 4, .8, dinoToy()), "st-pop");
    // the mess on the floor: each thing can be lifted and flown to its home
    var it = lay.items;
    h += propG("teddy", at(it.teddy[0], it.teddy[1], 1, teddyArt())) + propG("book", at(it.book[0], it.book[1], 1, bookToy("#3FA45A"))) +
      propG("shirt", at(it.shirt[0], it.shirt[1], 1, shirtToy("#FF9A3C"))) + propG("ball", at(it.ball[0], it.ball[1], 1, ballToy())) +
      propG("car", at(it.car[0], it.car[1], 1, carToy())) + propG("blocks", at(it.blocks[0], it.blocks[1], 1, blocksToy()));
    h += hotG("socks", at(lay.socks[0], lay.socks[1], 1.1, socksPile()), "bounce");
    // before: a little dim with the curtains shut; after: everything sparkles
    h += propG("dim", R(-900, -900, W + 1800, H + 1800, 0, "#3A2E6A", op(.12)));
    h += reveal("sparkles", sparkles(W / 2, f - 60, 1.2, 12, W * .9), "st-fade");
    return h + anchors(lay, ["bed2", "floor", "momoIn", "momo", "boxIn", "shelfIn", "drawerIn"]);
  }
  WA.addStoryPlace("bedroom", {
    P: { hz: 446, fy: 446, win: [40, 98, 128, 112], clock: [266, 200, 1], bed: [8, 476, 196], dresser: [214, 470, 82, 104], shelf: [306, 470, 90, 220], box: [318, 594, 120, 74],
      rug: [170, 576, 140, 34], dino: [112, 470], socks: [244, 506],
      items: { teddy: [52, 570], book: [146, 524], shirt: [104, 624], ball: [200, 612], car: [222, 548], blocks: [46, 632] },
      bed2: [126, 412], floor: [186, 584], momoIn: [480, 714], momo: [366, 714], boxIn: [318, 522], shelfIn: [351, 362], drawerIn: [255, 390] },
    L: { hz: 330, fy: 330, win: [408, 50, 170, 132], clock: [684, 112, 1.1], bed: [28, 380, 290], dresser: [356, 372, 112, 120], shelf: [830, 382, 130, 252], box: [700, 434, 150, 84],
      rug: [470, 448, 240, 40], dino: [176, 374], socks: [520, 386],
      items: { teddy: [100, 452], book: [228, 412], shirt: [318, 448], ball: [410, 430], car: [600, 410], blocks: [500, 450] },
      bed2: [176, 316], floor: [560, 452], momoIn: [-90, 452], momo: [930, 456], boxIn: [700, 352], shelfIn: [895, 256], drawerIn: [412, 276] },
    bg: bedroom
  });

  /* ================= THE LITTLE EXPLORER ================= */
  function bigHill(W, hz, m, top) {   // Sunny Hill rising behind the camp, a trail winding to the top
    var t = top, h = P("M" + (t[0] - 420) + "," + (hz + 30) + " C" + (t[0] - 250) + "," + (hz - 40) + " " + (t[0] - 120) + "," + (t[1] + 20) + " " + t[0] + "," + t[1] +
      " C" + (t[0] + 120) + "," + (t[1] + 20) + " " + (t[0] + 250) + "," + (hz - 40) + " " + (t[0] + 420) + "," + (hz + 30) + " Z", "url(#kw-hill)");
    h += P("M" + (t[0] - 380) + "," + (hz + 20) + " C" + (t[0] - 230) + "," + (hz - 40) + " " + (t[0] - 110) + "," + (t[1] + 30) + " " + t[0] + "," + (t[1] + 2) + " C" + (t[0] - 90) + "," + (t[1] + 40) + " " + (t[0] - 200) + "," + (hz - 30) + " " + (t[0] - 300) + "," + (hz + 20) + " Z", "#FFFFFF", op(.18));
    h += L("M" + (t[0] - 60) + "," + (hz + 10) + " C" + (t[0] - 10) + "," + (hz - 30) + " " + (t[0] + 70) + "," + n((hz + t[1]) / 2 + 20) + " " + (t[0] + 20) + "," + n((hz + t[1]) / 2) +
      " C" + (t[0] - 30) + "," + n((hz + t[1]) / 2 - 20) + " " + (t[0] + 30) + "," + (t[1] + 40) + " " + t[0] + "," + (t[1] + 6), "#F3E2B8", 4, ' stroke-dasharray="2 9"');
    return h + pine(t[0] - 140, hz - 10, .7) + pine(t[0] + 120, hz - 6, .6) + tree(t[0] + 190, hz + 4, .7) + C(t[0], t[1] - 2, 3, "#E8413C");
  }
  function tent(x, y, s) {
    return at(x, y, s, shadow(14, 2, 64, 9) + P("M-60,0 L0,-84 L60,0 Z", "url(#sp-orange)") + P("M0,-84 L60,0 L30,0 Z", "#C8561C", op(.35)) +
      P("M-16,0 L0,-46 L16,0 Z", "#7A3A12") + L("M0,-84 L0,-98 M-60,0 L-74,6 M60,0 L74,6", "#8A5A36", 2.4) + P("M0,-98 L16,-92 L0,-86 Z", "#3E78D8"));
  }
  function stump(x, y, s) {
    return at(x, y, s, shadow(6, 2, 34, 6) + P("M-28,0 C-30,-14 -27,-30 -26,-36 L26,-36 C27,-30 30,-14 28,0 Z", "url(#kw-trunk)") +
      E(0, -36, 26, 8, "#D9A36C") + E(0, -36, 18, 5, "#C08A55", op(.8)) + E(0, -36, 9, 2.6, "#A8703F", op(.8)));
  }
  function rolledMap() { return R(-22, -50, 44, 12, 6, "#F2E2BA") + E(-22, -44, 3, 6, "#D9C08A") + E(22, -44, 3, 6, "#D9C08A") + L("M-12,-44 L12,-44", "#C49A5A", 1.2) + R(-3, -51, 6, 14, 2, "#E8413C"); }
  function openMap(w, hgt) {   // the explorer's map, unrolled: Sunny Hill and a red X at the top
    return shadow(8, hgt / 2 + 6, w / 2, 8) + P("M" + (-w / 2) + "," + (-hgt / 2) + " L" + (w / 2) + "," + (-hgt / 2 + 6) + " L" + (w / 2 - 4) + "," + (hgt / 2) + " L" + (-w / 2 + 4) + "," + (hgt / 2 - 6) + " Z", "#F6E7C0") +
      E(-w / 2, 0, 8, hgt / 2, "#E6CF96") + E(w / 2, 3, 8, hgt / 2, "#E6CF96") +
      P("M" + (-w * .32) + "," + (hgt * .28) + " C" + (-w * .2) + "," + (-hgt * .05) + " " + (-w * .05) + "," + (-hgt * .3) + " 0," + (-hgt * .32) + " C" + (w * .05) + "," + (-hgt * .3) + " " + (w * .2) + "," + (-hgt * .05) + " " + (w * .32) + "," + (hgt * .28) + " Z", "#9BD07E") +
      L("M" + (-w * .1) + "," + (hgt * .26) + " C0," + (hgt * .1) + " " + (w * .08) + "," + (-hgt * .05) + " 0," + (-hgt * .26), "#B07A4A", 2, ' stroke-dasharray="4 4"') +
      L("M-7," + (-hgt * .38) + " l14,14 m0,-14 l-14,14", "#E8413C", 3.2) + C(-w * .36, hgt * .3, 5, "#3E9A63") + C(w * .34, -hgt * .3, 9, "none", ' stroke="#8A5A36" stroke-width="1.4"') +
      L("M" + (w * .34) + "," + (-hgt * .38) + " L" + (w * .34) + "," + (-hgt * .22) + " M" + (w * .26) + "," + (-hgt * .3) + " L" + (w * .42) + "," + (-hgt * .3), "#8A5A36", 1.2);
  }
  function blanketMat(w, hgt) {
    var h = R(-w / 2, -hgt / 2, w, hgt, 6, "#FFFFFF");
    for (var i = 0; i < 6; i++) h += R(-w / 2 + i * w / 6, -hgt / 2, w / 12, hgt, 0, "#F27272", op(.75));
    for (var j = 0; j < 3; j++) h += R(-w / 2, -hgt / 2 + j * hgt / 3, w, hgt / 6, 0, "#F27272", op(.45));
    return g(h, "scale(1 .55)");
  }
  function bottle() { return shadow(0, 2, 12, 3) + R(-9, -40, 18, 40, 7, "url(#sp-blue)") + R(-6, -48, 12, 9, 3, "#FFFFFF") + R(-9, -26, 18, 9, 0, "#FFFFFF", op(.75)) + E(-4, -34, 2, 6, "#FFFFFF", op(.5)); }
  function sunHat() { return shadow(0, 2, 26, 4) + E(0, -6, 26, 7, "url(#sp-yellow)") + P("M-14,-6 C-14,-22 14,-22 14,-6 Z", "url(#sp-yellow)") + R(-14, -12, 28, 5, 2, "#E8413C") + E(-5, -16, 4, 2, "#FFFFFF", op(.5)); }
  function compass() { return shadow(0, 2, 14, 3) + C(0, -14, 14, "url(#kw-gold)") + C(0, -14, 10.5, "#FFFDF4") + P("M0,-23 L3,-14 L0,-12 L-3,-14 Z", "#E8413C") + P("M0,-5 L3,-14 L0,-16 L-3,-14 Z", "#3E78D8") + C(0, -14, 1.6, "#2B2151") + C(0, -29, 2.4, "url(#kw-gold)"); }
  function duckToy() { return shadow(0, 2, 16, 3) + P("M-14,-6 C-14,-14 -4,-16 4,-13 C10,-11 14,-14 16,-18 C20,-15 20,-6 16,-2 C10,3 -10,3 -14,-6 Z", "url(#sp-yellow)") + C(-8, -19, 7, "url(#sp-yellow)") + P("M-15,-19 C-21,-19 -22,-15 -19,-14 C-17,-13 -14,-15 -14,-16 Z", "#FF8A1F") + C(-10, -21, 1.4, "#1E1A24"); }
  function signpost(x, y, s) {
    return at(x, y, s, shadow(4, 2, 12, 3) + R(-3, -60, 6, 60, 2, "url(#kw-trunk)") + P("M-4,-56 L-40,-56 L-48,-48 L-40,-40 L-4,-40 Z", "url(#kw-wood)") + P("M4,-36 L40,-36 L48,-28 L40,-20 L4,-20 Z", "url(#kw-wood)") +
      E(-26, -48, 6, 3, "#5DB34F") + P("M18,-28 L24,-34 L30,-28 Z", "#9AA3B8"));
  }
  function grassyPath(a, b, w) {   // soft green trail from point a to b
    var d = "M" + (a[0] - w) + "," + a[1] + " C" + (a[0] - w) + "," + n((a[1] + b[1]) / 2) + " " + (b[0] - w * .4) + "," + (b[1] + 30) + " " + (b[0] - w * .3) + "," + b[1] + " L" + (b[0] + w * .3) + "," + b[1] +
      " C" + (b[0] + w * .4) + "," + (b[1] + 30) + " " + (a[0] + w) + "," + n((a[1] + b[1]) / 2) + " " + (a[0] + w) + "," + a[1] + " Z";
    return P(d, "#E4F7B8", ' stroke="#7DBE5A" stroke-width="3"') + L("M" + a[0] + "," + (a[1] - 4) + " C" + a[0] + "," + n((a[1] + b[1]) / 2) + " " + b[0] + "," + (b[1] + 20) + " " + b[0] + "," + (b[1] + 4), "#FFFFFF", 2, ' stroke-dasharray="3 7" opacity=".8"') +
      flowers(b[0] - w * .6, b[1] + 22, 1.3) + flowers(a[0] + w * .9, a[1] - 26, 1.2, ["#FFFFFF", "#FFD24D", "#FF8FB0"]) + flowers(a[0] - w * .9, n((a[1] + b[1]) / 2), 1.1);
  }
  function rockyPath(a, b, w) {
    var h = P("M" + (a[0] - w) + "," + a[1] + " L" + (b[0] - w * .3) + "," + b[1] + " L" + (b[0] + w * .3) + "," + b[1] + " L" + (a[0] + w) + "," + a[1] + " Z", "#B9B1CC");
    for (var i = 0; i < 6; i++) { var t = i / 5, x = a[0] + (b[0] - a[0]) * t + (i % 2 ? 10 : -10), y = a[1] + (b[1] - a[1]) * t; h += P("M" + (x - 10) + "," + y + " L" + x + "," + (y - 14) + " L" + (x + 10) + "," + y + " Z", "#8E86A8") + P("M" + (x - 10) + "," + y + " L" + x + "," + (y - 14) + " L" + (x - 2) + "," + y + " Z", "#FFFFFF", op(.3)); }
    return h;
  }
  function deer(x, y, s) {
    return at(x, y, s, E(4, -22, 22, 13, "#C98A4B") + C(-16, -38, 10, "#C98A4B") + E(-24, -34, 6, 4, "#E8C49A") + C(-14, -41, 1.6, "#2B2151") +
      P("M-10,-46 L-6,-60 M-8,-54 L-2,-58 M-16,-47 L-20,-60 M-19,-55 L-25,-58", "none", ' stroke="#8A5A36" stroke-width="2" stroke-linecap="round"') +
      E(-10, -46, 3, 5, "#C98A4B") + R(-10, -14, 4, 14, 2, "#A86E38") + R(12, -14, 4, 14, 2, "#A86E38") + C(8, -26, 2, "#FFFFFF", op(.7)) + C(16, -22, 1.6, "#FFFFFF", op(.7)) + C(0, -28, 1.6, "#FFFFFF", op(.7)));
  }
  function woodpecker(x, y, s) {
    return at(x, y, s, anim("kw-arm", E(0, 0, 7, 12, "#2B2151") + E(2, -2, 4, 8, "#FFFFFF", op(.9)) + C(-1, -13, 7, "#2B2151") + P("M-2,-21 C2,-26 7,-22 6,-17 Z", "#E8413C") +
      C(-3, -14, 1.6, "#FFFFFF") + P("M-7,-13 L-16,-12 L-7,-10 Z", "#8A8A8A")));
  }
  function chameleon(x, y, s) {
    return at(x, y, s, P("M-26,0 C-26,-14 -10,-20 6,-16 C16,-14 20,-8 18,0 C10,2 -14,4 -26,0 Z", "#7CCB5E") + P("M18,-4 C26,-4 30,-12 26,-16 C22,-18 22,-12 25,-11", "none", ' stroke="#7CCB5E" stroke-width="4" stroke-linecap="round"') +
      P("M-26,-4 C-32,-6 -34,-12 -30,-16 C-28,-18 -24,-16 -24,-12", "#7CCB5E") + C(-22, -10, 4.4, "#FFFFFF") + C(-22, -10, 2.2, "#1E1A24") + C(-21.2, -10.8, .8, "#FFFFFF") +
      L("M-14,0 L-16,6 M2,0 L4,6", "#5DA848", 2.6) + C(-8, -10, 2, "#FFE680", op(.7)) + C(4, -9, 2, "#FF9A5A", op(.7)) + C(-2, -14, 1.6, "#5BC0EB", op(.7)));
  }
  function dandelion(x, y, s) {
    var h = L("M0,0 C-2,-20 2,-40 0,-56", "#5E9A4A", 2.4) + E(-8, -6, 10, 4, "url(#kw-leaf)", rot(-30, -8, -6)) + E(8, -10, 10, 4, "url(#kw-leaf)", rot(30, 8, -10));
    for (var i = 0; i < 16; i++) { var a = i * 22.5 * Math.PI / 180; h += L("M0,-62 L" + n(Math.cos(a) * 12) + "," + n(-62 + Math.sin(a) * 12), "#FFFFFF", 1, op(.85)) + C(Math.cos(a) * 12, -62 + Math.sin(a) * 12, 1.6, "#FFFFFF"); }
    return at(x, y, s, h + C(0, -62, 3, "#E9E2C8"));
  }
  function seedsDrift(x, y, s) {
    var h = "";
    for (var i = 0; i < 9; i++) h += g(L("M0,0 L0,-6", "#FFFFFF", .8) + C(0, -7, 2.4, "#FFFFFF", op(.9)), "translate(" + n((i % 3) * 8 - 8) + " " + n(-Math.floor(i / 3) * 8) + ")");
    return at(x, y, s, g(h, "", "st-drift"));
  }
  function hoofPrints(x, y, s) {
    var h = E(0, -12, 50, 18, "#B8905F", op(.5));
    for (var i = 0; i < 4; i++) h += at(i * 20 - 30, -i * 8 + (i % 2 ? 4 : -4), 1, P("M-2,-8 C-7,-6 -8,4 -3,7 C-1,3 -1,-4 -2,-8 Z M2,-8 C7,-6 8,4 3,7 C1,3 1,-4 2,-8 Z", "#5A3A20", op(.85)), -15);
    return at(x, y, s, h);
  }
  function marker(x, y, s, c) { return at(x, y, s, R(-2, -34, 4, 34, 2, "#8A5A36") + P("M2,-33 L18,-28 L2,-22 Z", c) + shadow(2, 1, 6, 2)); }
  function flagPole(x, y, s) { return at(x, y, s, R(-2.5, -96, 5, 96, 2.5, "#F2F4F8") + C(0, -98, 4, "url(#kw-gold)") + anim("kw-flag", P("M2.5,-94 C18,-98 28,-88 46,-92 L46,-62 C28,-58 18,-68 2.5,-64 Z", "#E8413C") + P("M14,-82 l3,6 6,1 -4.5,4 1,6 -5.5,-3 -5.5,3 1,-6 -4.5,-4 6,-1z", "#FFE27A"))); }
  function telescope(x, y, s) {
    return at(x, y, s, shadow(4, 2, 26, 5) + L("M0,-40 L-18,0 M0,-40 L18,0 M0,-40 L0,0", "#8A5A36", 3) +
      g(R(-30, -8, 56, 15, 7, "url(#sp-blue)") + R(22, -10, 12, 19, 4, "#2F5BB8") + R(-36, -6, 8, 11, 3, "#FFD24D") + R(-20, -8, 4, 15, 0, "#FFFFFF", op(.4)), "translate(0 -46) rotate(-22)"));
  }
  function valley(W, top, bottom, m) {   // the view from the top: fields, a river, a forest and Kido Village far below
    var y0 = top, h = big(-900, y0, W + 1800, bottom - y0 + 40, "#B4D9A6");
    h += P("M-900," + (y0 + 20) + " C" + n(W * .2) + "," + (y0 - 10) + " " + n(W * .6) + "," + (y0 + 30) + " " + (W + 900) + "," + (y0 + 10) + " L" + (W + 900) + "," + (y0 + 60) + " L-900," + (y0 + 60) + " Z", "#A6D38C");
    h += L("M" + n(W * .05) + "," + (bottom + 10) + " C" + n(W * .25) + "," + (y0 + 60) + " " + n(W * .6) + "," + (y0 + 90) + " " + n(W * .78) + "," + (y0 + 14), "#6FC3EA", m === "P" ? 9 : 12, op(.9));
    for (var i = 0; i < 9; i++) h += C(W * .62 + (i % 5) * 16 - 30, y0 + 40 + Math.floor(i / 5) * 12, 9, i % 2 ? "#5FA65A" : "#4E9450");
    h += K.house(W * .22, y0 + 52, .45, "kw-roof") + K.house(W * .3, y0 + 46, .38, "kw-roof-b") + K.house(W * .18, y0 + 38, .34, "kw-roof-v");
    return h + anim("kw-birds", L("M" + n(W * .7) + "," + (y0 - 40) + " q6,-6 12,0 q6,-6 12,0", "#4A4870", 1.6));
  }
  function rainbowArc(cx, cy, r) {
    var cols = ["#FF6B6B", "#FFB04A", "#FFE36A", "#7ED67A", "#5BC0EB", "#9B7BEA"], h = "";
    cols.forEach(function (c, i) { var rr = r - i * 7; h += P("M" + n(cx - rr) + "," + cy + " A" + rr + "," + rr + " 0 0,1 " + n(cx + rr) + "," + cy, "none", ' stroke="' + c + '" stroke-width="7" opacity=".75"'); });
    return h;
  }

  WA.addStoryPlace("basecamp", {   // the foot of Sunny Hill: camp, a map, packing, and the path splits
    P: { hz: 330, top: [250, 128], tent: [58, 432, .78], stump: [334, 474], blanket: [200, 562, 290, 92], water: [90, 558], hat: [160, 550], compass: [232, 560], duck: [302, 558],
      sign: [196, 424], trail: [200, 526], grassA: [160, 420], grassB: [118, 338], rockA: [238, 420], rockB: [300, 334], pebble: [284, 360], mapAt: [200, 268],
      mia: [116, 662], momo: [336, 670], rockStep: [276, 392], grassGo: [112, 352] },
    L: { hz: 250, top: [690, 74], tent: [120, 340, 1], stump: [812, 372], blanket: [500, 432, 380, 96], water: [370, 426], hat: [460, 420], compass: [550, 430], duck: [640, 426],
      sign: [516, 310], trail: [500, 400], grassA: [470, 312], grassB: [400, 244], rockA: [568, 312], rockB: [650, 238], pebble: [628, 266], mapAt: [500, 188],
      mia: [232, 452], momo: [930, 456], rockStep: [624, 288], grassGo: [404, 262] },
    bg: function (W, H, hz, m, lay) {
      var h = sky(W, H, hz, SKY.morning, GROUND.hill) + sun(m === "P" ? 70 : 140, m === "P" ? 90 : 70, .8) +
        cloud(m === "P" ? 330 : 420, m === "P" ? 70 : 60, .8, "kw-cloud--a") + cloud(m === "P" ? 120 : 900, m === "P" ? 210 : 140, .6, "kw-cloud--b") + birds(m === "P" ? 300 : 860, m === "P" ? 170 : 110, 1) +
        farHills(W, hz, "#C9E6BF", "#AEDAA2", 41) + bigHill(W, hz, m, lay.top);
      h += ground(W, H, hz) + patches(W, H, hz, 45) + tufts(W, H, hz + 20, 47, ["#5FA84F", "#4E9444"], 44);
      h += P("M" + (lay.trail[0] - 18) + "," + (lay.trail[1] + 20) + " C" + (lay.trail[0] - 14) + "," + (lay.sign[1] + 40) + " " + (lay.sign[0] - 14) + "," + (lay.sign[1] + 10) + " " + (lay.sign[0] - 10) + "," + lay.sign[1] +
        " L" + (lay.sign[0] + 10) + "," + lay.sign[1] + " C" + (lay.sign[0] + 14) + "," + (lay.sign[1] + 10) + " " + (lay.trail[0] + 14) + "," + (lay.sign[1] + 40) + " " + (lay.trail[0] + 18) + "," + (lay.trail[1] + 20) + " Z", "#E9D7AE", op(.9));
      h += hotG("grassPath", grassyPath(lay.grassA, lay.grassB, m === "P" ? 30 : 40), "shine");
      h += hotG("rockPath", rockyPath(lay.rockA, lay.rockB, m === "P" ? 28 : 36), "nope");
      h += propG("pebble", rock(lay.pebble[0], lay.pebble[1], .45));
      h += signpost(lay.sign[0], lay.sign[1], m === "P" ? .9 : 1.1) + tent(lay.tent[0], lay.tent[1], lay.tent[2]);
      h += hotG("map", at(lay.stump[0], lay.stump[1], m === "P" ? 1 : 1.15, stump(0, 0, 1) + rolledMap()), "bounce");
      h += at(lay.blanket[0], lay.blanket[1], 1, blanketMat(lay.blanket[2], lay.blanket[3]));
      h += hotG("water", at(lay.water[0], lay.water[1], 1.1, bottle()), "bounce") + hotG("hat", at(lay.hat[0], lay.hat[1], 1.1, sunHat()), "bounce") +
        hotG("compass", at(lay.compass[0], lay.compass[1], 1.2, compass()), "bounce") + hotG("duck", at(lay.duck[0], lay.duck[1], 1.2, duckToy()), "wiggle");
      h += reveal("mapOpen", at(lay.mapAt[0], lay.mapAt[1], 1, openMap(m === "P" ? 230 : 300, m === "P" ? 150 : 170)), "st-pop");
      return h + anchors(lay, ["mia", "momo", "rockStep", "grassGo"]);
    }
  });

  WA.addStoryPlace("hillside", {   // halfway up: so much to notice
    P: { hz: 250, tree: [70, 470], branch: [330, 320], dandelion: [306, 540], prints: [150, 566], deer: [54, 300],
      mia: [204, 650], momo: [334, 668], upper: [300, 318], markers: [[230, 470], [262, 400], [286, 340]] },
    L: { hz: 200, tree: [150, 380], branch: [830, 230], dandelion: [660, 420], prints: [430, 424], deer: [70, 230],
      mia: [520, 452], momo: [300, 456], upper: [720, 250], markers: [[600, 380], [660, 320], [700, 270]] },
    bg: function (W, H, hz, m, lay) {
      var h = sky(W, H, hz, SKY.day, GROUND.hill) + cloud(m === "P" ? 100 : 300, m === "P" ? 80 : 60, .9, "kw-cloud--a") + cloud(m === "P" ? 300 : 760, m === "P" ? 170 : 100, .7, "kw-cloud--c") +
        farHills(W, hz, "#BFE0C2", "#A2D2A0", 51);
      h += ground(W, H, hz) + patches(W, H, hz, 53) + tufts(W, H, hz + 18, 55, ["#5FA84F", "#4E9444"], 48);
      // the trail climbing on up the hill
      h += P(m === "P" ? "M140,900 C170,760 230,600 262,470 C280,400 296,350 316,300 L332,304 C318,352 304,402 290,472 C262,600 230,760 250,900 Z"
        : "M380,700 C460,560 560,440 640,360 C680,320 710,280 740,240 L760,248 C732,286 704,326 666,370 C590,460 500,580 470,700 Z", "#E9D7AE", op(.9));
      lay.markers.forEach(function (p, i) { h += marker(p[0], p[1], m === "P" ? 1 : 1.1, ["#E8413C", "#3E78D8", "#E8413C"][i]); });
      h += tree(m === "P" ? 380 : 960, hz + 40, 2.2, "deep") + bush(m === "P" ? 40 : 90, hz + 50, 1.6);
      h += reveal("deer", deer(lay.deer[0], lay.deer[1], m === "P" ? 1.2 : 1.4), "st-fade") + bush(lay.deer[0] + 18, lay.deer[1] + 6, 1.4);
      // the woodpecker tree (tap, tap, tap)
      var t = lay.tree;
      h += hotG("tree", at(t[0], t[1], m === "P" ? 2.8 : 3.2, P("M-6,0 C-5,-14 -4,-30 -3,-44 L4,-44 C5,-30 6,-14 7,0 Z", "url(#kw-trunk)") + E(1, -26, 2.4, 3.4, "#3E2A18") +
        C(10, -58, 18, "url(#kw-leaf-d)") + C(-10, -60, 19, "url(#kw-leaf)") + C(2, -76, 18, "url(#kw-leaf)") + C(14, -70, 10, "url(#kw-leaf-d)", op(.9))), "rustle") +
        reveal("woodpecker", woodpecker(t[0] + (m === "P" ? 12 : 14), t[1] - (m === "P" ? 76 : 88), m === "P" ? 1.4 : 1.6), "st-pop");
      // a branch with a chameleon hiding on it
      var b = lay.branch;
      h += hotG("branch", L("M" + (b[0] + 120) + "," + (b[1] - 30) + " C" + (b[0] + 60) + "," + (b[1] - 10) + " " + (b[0] + 20) + "," + (b[1] + 6) + " " + (b[0] - 50) + "," + (b[1] + 10), "#7A4B2A", 8) +
        E(b[0] - 52, b[1] + 6, 16, 8, "url(#kw-leaf)") + E(b[0] + 40, b[1] - 18, 14, 7, "url(#kw-leaf-d)") + E(b[0] + 120, b[1] - 40, 40, 30, "url(#kw-leaf-d)"), "rustle") +
        reveal("chameleon", chameleon(b[0], b[1] + 2, m === "P" ? 1.4 : 1.6), "st-fade");
      h += hotG("dandelion", dandelion(lay.dandelion[0], lay.dandelion[1], m === "P" ? 1.3 : 1.4), "wiggle") +
        reveal("seeds", seedsDrift(lay.dandelion[0] + 6, lay.dandelion[1] - 84, m === "P" ? 1.4 : 1.6));
      h += hotG("prints", hoofPrints(lay.prints[0], lay.prints[1], m === "P" ? 1.1 : 1.3), "shine");
      return h + anchors(lay, ["mia", "momo", "upper"]);
    }
  });

  WA.addStoryPlace("summit", {   // the top of Sunny Hill: plant the flag, look far away
    P: { hz: 300, edge: 500, flag: [204, 566], scope: [330, 612], far: [96, 360], mia: [130, 650], momo: [334, 668], flagAt: [160, 600] },
    L: { hz: 210, edge: 360, flag: [520, 392], scope: [780, 420], far: [230, 260], mia: [400, 452], momo: [190, 456], flagAt: [470, 428] },
    bg: function (W, H, hz, m, lay) {
      var h = sky(W, H, hz, SKY.day, GROUND.hill) + sun(m === "P" ? 320 : 860, m === "P" ? 90 : 70, .8) + cloud(m === "P" ? 100 : 300, m === "P" ? 120 : 80, .8, "kw-cloud--a") +
        cloud(m === "P" ? 280 : 620, m === "P" ? 220 : 150, .6, "kw-cloud--c");
      h += farHills(W, hz, "#C5DCE8", "#B4D3C6", 61) + valley(W, hz + 4, lay.edge, m);
      h += reveal("rainbow", rainbowArc(m === "P" ? 150 : 300, hz + 40, m === "P" ? 120 : 200), "st-fade");
      h += anim("kw-birds", at(m === "P" ? 260 : 700, hz - 80, 1.4, L("M-10,0 Q-5,-6 0,0 Q5,-6 10,0", "#3A3A5A", 2)));
      // the hilltop in front
      h += R(-900, hz + 2, W + 1800, lay.edge - hz + 30, 0, "#DCEFF4", op(.28));   // distance haze over the valley
      var crest = "M-900," + (lay.edge + 60) + " C" + n(W * .15) + "," + (lay.edge - 10) + " " + n(W * .35) + "," + (lay.edge - 46) + " " + n(lay.flag[0]) + "," + (lay.flag[1] - 34) +
        " C" + n(W * .7) + "," + (lay.edge - 46) + " " + n(W * .85) + "," + (lay.edge - 10) + " " + (W + 900) + "," + (lay.edge + 60) + " L" + (W + 900) + "," + (H + 900) + " L-900," + (H + 900) + " Z";
      h += P(crest, "url(#sp-ground)") + P(crest, "none", ' stroke="#E8FFD0" stroke-width="5" opacity=".7"');
      h += tufts(W, H, lay.edge, 63, ["#5FA84F", "#4E9444"], 30) + flowers(m === "P" ? 60 : 120, lay.edge + 60, 1.3) + flowers(m === "P" ? 360 : 900, lay.edge + 70, 1.2) + rock(m === "P" ? 40 : 80, lay.edge + 110, .9);
      h += hotG("flagspot", at(lay.flag[0], lay.flag[1], 1, E(0, 0, 40, 12, "#8ACB6E") + E(0, -2, 30, 8, "#A6D88A") + E(0, -4, 6, 3, "#6E4526")), "shine") +
        reveal("flag", flagPole(lay.flag[0], lay.flag[1] - 4, m === "P" ? 1.2 : 1.3), "st-grow");
      h += hotG("telescope", telescope(lay.scope[0], lay.scope[1], m === "P" ? 1.2 : 1.35), "bounce");
      return h + anchors(lay, ["far", "mia", "momo", "flagAt"]);
    }
  });

  /* ================= THE MAGIC GARDEN ================= */
  var GDEFS = lg("sp-stone", 0, 0, 0, 1, [[0, "#E9E4F2"], [1, "#B8AFCB"]]) + lg("sp-can", 0, 0, .8, 1, [[0, "#9FE0C2"], [1, "#3E9A7A"]]);
  function bigCloud(x, y, s) {
    return at(x, y, s, E(4, 10, 46, 12, "#9FB2D2", op(.35)) + C(-28, 0, 18, "url(#kw-cloud)") + C(-6, -12, 24, "url(#kw-cloud)") + C(20, -4, 19, "url(#kw-cloud)") + C(36, 4, 13, "url(#kw-cloud)") + E(4, 6, 44, 13, "url(#kw-cloud)"));
  }
  function woodFence(x0, x1, y, s, gateX, gateW) {
    var h = "", step = 22 * s;
    for (var x = x0; x <= x1; x += step) {
      if (gateX != null && x > gateX - gateW / 2 - 6 && x < gateX + gateW / 2 + 6) continue;
      h += R(x - 6 * s, y - 46 * s, 12 * s, 46 * s, 3, "url(#kw-wood)") + P("M" + n(x - 6 * s) + "," + n(y - 46 * s) + " L" + n(x) + "," + n(y - 54 * s) + " L" + n(x + 6 * s) + "," + n(y - 46 * s) + " Z", "#C98A52");
    }
    function rail(yy) { return R(x0 - 8, yy, (gateX - gateW / 2) - x0, 6 * s, 2, "#B07A48") + R(gateX + gateW / 2, yy, x1 - gateX - gateW / 2 + 8, 6 * s, 2, "#B07A48"); }
    return rail(y - 36 * s) + rail(y - 16 * s) + h;
  }
  function gate(w, hgt) {   // closed garden gate, base-centre
    return R(-w / 2 - 8, -hgt - 14, 8, hgt + 14, 3, "#8A5A36") + R(w / 2, -hgt - 14, 8, hgt + 14, 3, "#8A5A36") +
      R(-w / 2, -hgt, w, hgt, 4, "url(#kw-wood)") + L("M" + (-w / 2 + 6) + ",-6 L" + (w / 2 - 6) + "," + (-hgt + 6) + " M" + (-w / 2 + 6) + "," + (-hgt * .5) + " L" + (w / 2 - 6) + "," + (-hgt * .5), "#8A5A36", 3) +
      P("M" + (-w / 2 - 6) + "," + (-hgt - 14) + " C" + (-w / 4) + "," + (-hgt - 44) + " " + (w / 4) + "," + (-hgt - 44) + " " + (w / 2 + 6) + "," + (-hgt - 14), "none", ' stroke="#8A5A36" stroke-width="6"') +
      C(w / 2 - 8, -hgt / 2, 3, "#FFD24D") + C(-w / 3, -hgt - 40, 6, "#FF8FB0") + C(w / 3, -hgt - 40, 6, "#FFD24D") + E(0, -hgt - 44, 14, 6, "url(#kw-leaf)");
  }
  function gateOpen(w, hgt) {   // the gate swings open: colour and light beyond
    return R(-w / 2, -hgt, w, hgt, 4, "#FFF6C9") + C(-w / 4, -hgt * .45, 9, "#FF7FA8") + C(w / 6, -hgt * .6, 8, "#FFD24D") + C(w / 3, -hgt * .3, 7, "#B79CFF") + C(-w / 8, -hgt * .2, 7, "#FF9A5A") +
      R(w / 2 - 2, -hgt, 10, hgt, 3, "url(#kw-wood)", ' transform="skewY(-12)"') + sparkle(0, -hgt * .5, 1.2, "#FFFFFF");
  }
  function soilBed(rx, ry) {
    return shadow(6, 6, rx + 8, ry * .5) + E(0, 0, rx, ry, "url(#sp-dry)") + E(0, -3, rx - 8, ry - 7, "#D2B07C", op(.6)) +
      L("M" + n(-rx * .6) + ",-4 l14,6 10,-6 16,8 M" + n(rx * .1) + ",-10 l12,8 14,-4 10,6 M" + n(-rx * .2) + "," + n(ry * .4) + " l10,-6 16,4", "#9A7446", 1.6, op(.7)) +
      E(0, -ry + 4, rx - 4, 7, "#E8CFA0", op(.5));
  }
  function seedGlow() { return C(0, -6, 22, "url(#sp-magic)", ' class="st-glowpulse"') + E(0, -6, 7, 5, "#9A6036") + E(-2, -8, 3, 1.6, "#FFF1C4", op(.8)) + sparkle(10, -18, .8, "#FFFFFF"); }
  function wateringCan() {
    return shadow(0, 2, 30, 5) + R(-22, -38, 40, 36, 8, "url(#sp-can)") + P("M18,-30 L42,-50 L46,-46 L22,-22 Z", "url(#sp-can)") + E(44, -50, 6, 4, "#3E9A7A") +
      P("M-22,-30 C-38,-30 -38,-8 -22,-8", "none", ' stroke="#3E9A7A" stroke-width="5" stroke-linecap="round"') + R(-14, -44, 24, 7, 3, "#3E9A7A") + E(-8, -28, 5, 9, "#FFFFFF", op(.35));
  }
  function pourDrops() {
    var h = "";
    for (var i = 0; i < 8; i++) h += E((i % 4) * 7 - 10, (i % 3) * 6, 2.6, 4, "#7FD3FF");
    return g(h, "", "st-pour");
  }
  function lollipop() { return shadow(0, 2, 10, 3) + L("M0,0 L0,-34", "#FFFFFF", 3) + C(0, -42, 12, "#FF7FA8") + L("M0,-42 m-8,0 a8,8 0 1,1 8,8 a5,5 0 1,1 -5,-5", "#FFFFFF", 2.4); }
  function sproutArt(stage) {   // 2 = little sprout, 3 = leafy plant, 4 = tall plant with a closed bud
    var top = [0, 0, -30, -62, -96][stage], h = L("M0,0 C-2," + n(top * .5) + " 2," + n(top * .8) + " 0," + top, "#3E8A45", stage > 3 ? 4 : 3);
    h += E(-9, top + 6, 9, 4.5, "url(#kw-leaf)", rot(-30, -9, top + 6)) + E(9, top + 6, 9, 4.5, "url(#kw-leaf)", rot(30, 9, top + 6));
    if (stage >= 3) h += E(-12, top + 28, 12, 5.5, "url(#kw-leaf-d)", rot(-24, -12, top + 28)) + E(12, top + 32, 12, 5.5, "url(#kw-leaf)", rot(24, 12, top + 32));
    if (stage >= 4) h += E(-14, top + 60, 14, 6, "url(#kw-leaf)", rot(-20, -14, top + 60)) + E(14, top + 62, 14, 6, "url(#kw-leaf-d)", rot(20, 14, top + 62)) +
      P("M0," + (top - 2) + " C-10," + (top - 10) + " -8," + (top - 28) + " 0," + (top - 34) + " C8," + (top - 28) + " 10," + (top - 10) + " 0," + (top - 2) + " Z", "#7BCF5E") +
      P("M0," + (top - 8) + " C-4," + (top - 16) + " -3," + (top - 26) + " 0," + (top - 30) + " C3," + (top - 26) + " 4," + (top - 16) + " 0," + (top - 8) + " Z", "#FF9AC2");
    return h;
  }
  function magicFlower() {   // the big flower that opens from the magic seed
    var h = L("M0,0 C-2,-40 2,-80 0,-104", "#3E8A45", 4.5) + E(-16, -40, 16, 7, "url(#kw-leaf)", rot(-22, -16, -40)) + E(16, -60, 16, 7, "url(#kw-leaf-d)", rot(22, 16, -60));
    h += C(0, -128, 46, "url(#sp-magic)", ' class="st-glowpulse"');
    for (var i = 0; i < 10; i++) h += E(0, -146, 9, 20, i % 2 ? "#FF7FA8" : "#FFB0CF", ' transform="rotate(' + (i * 36) + ' 0 -126)"');
    for (var j = 0; j < 8; j++) h += E(0, -138, 6, 12, "#FFD6E6", ' transform="rotate(' + (j * 45 + 22) + ' 0 -126)"');
    return h + C(0, -126, 10, "url(#sp-yellow)") + C(-3, -129, 3.4, "#FFFFFF", op(.6)) + sparkle(-34, -160, 1, "#FFFFFF") + sparkle(36, -150, .8, "#FFE27A");
  }
  function worm() {
    return P("M-18,0 C-14,-10 -6,-10 -2,-2 C2,6 10,6 14,-2 C16,-6 20,-6 22,-2", "none", ' stroke="#E88A9A" stroke-width="7" stroke-linecap="round"') +
      C(22, -3, 4.4, "#E88A9A") + C(23.4, -4.6, 1.1, "#2B2151") + E(-8, 4, 14, 3, "#7A5236", op(.6));
  }
  function wiltedStems(x, y, s) {
    var h = "";
    [[-14, 0], [0, 4], [14, 0], [26, 6]].forEach(function (p, i) { h += L("M" + p[0] + "," + p[1] + " C" + (p[0] + 2) + "," + (p[1] - 14) + " " + (p[0] + 8) + "," + (p[1] - 22) + " " + (p[0] + 14) + "," + (p[1] - 16), "#A89A5A", 2) + E(p[0] + 15, p[1] - 15, 3.4, 2.4, "#C9A86A"); });
    return at(x, y, s, h);
  }
  function bloomClump(x, y, s, seed) {
    var r = K.rng(seed), h = "", cols = ["#FF7FA8", "#FFD24D", "#B79CFF", "#FF9A5A", "#FFFFFF", "#7FC8FF"];
    for (var i = 0; i < 7; i++) {
      var fx = (r() - .5) * 60, fy = -r() * 30, c = cols[(seed + i) % cols.length];
      h += L("M" + n(fx) + ",0 L" + n(fx) + "," + n(fy - 10), "#3F9A55", 2) + C(fx - 5, fy - 12, 5, c) + C(fx + 5, fy - 12, 5, c) + C(fx, fy - 17, 5, c) + C(fx, fy - 7, 5, c) + C(fx, fy - 12, 3.4, "#FFE680");
    }
    return at(x, y, s, bush(0, 4, 1.4) + h);
  }
  function stoneWall(x0, x1, y, hgt) {
    var h = R(x0, y - hgt, x1 - x0, hgt, 0, "url(#sp-stone)"), r = K.rng(7);
    for (var row = 0; row < hgt / 22; row++) for (var x = x0 + (row % 2) * 18; x < x1; x += 36) h += R(x + 2, y - hgt + row * 22 + 2, 32, 18, 4, "#FFFFFF", op(.18 + r() * .1));
    for (var i = 0; i < (x1 - x0) / 60; i++) h += E(x0 + i * 60 + 20, y - hgt + 10, 18, 9, "url(#kw-leaf)", op(.85)) + L("M" + (x0 + i * 60 + 20) + "," + (y - hgt + 14) + " C" + (x0 + i * 60 + 14) + "," + (y - hgt + 40) + " " + (x0 + i * 60 + 26) + "," + (y - hgt + 50) + " " + (x0 + i * 60 + 18) + "," + (y - hgt + 70), "#3E8A45", 2.4, op(.8));
    return h;
  }
  function fountainBowl(x, y, s) {
    return at(x, y, s, shadow(6, 2, 62, 10) + E(0, 0, 58, 14, "url(#sp-stone)") + E(0, -4, 50, 10, "#A89A86") + R(-8, -46, 16, 44, 5, "url(#sp-stone)") + E(0, -46, 24, 7, "url(#sp-stone)") + E(0, -47, 18, 4.6, "#A89A86"));
  }
  function fountainWater(x, y, s) {
    return at(x, y, s, E(0, -4, 50, 10, "url(#kw-water)") + E(0, -47, 18, 4.6, "url(#kw-water)") +
      anim("kw-jet", L("M0,-48 C-3,-70 -16,-72 -22,-52 M0,-48 C3,-70 16,-72 22,-52 M0,-48 L0,-76", "#DDF8FF", 3, op(.9))));
  }
  function rainDrops(W, top, bottom) {
    var h = "", r = K.rng(77);
    for (var i = 0; i < 46; i++) h += L("M" + n(-40 + r() * (W + 80)) + "," + n(top + r() * (bottom - top)) + " l-3,10", "#8FD0FF", 2.2, op(.8));
    return g(h, "", "st-rain");
  }

  WA.addStoryPlace("garden", {   // Leo's little garden: dry and empty — until the magic seed
    P: { hz: 330, sun: [300, 108], fence: 404, gate: [334, 404, 64, 60], bed: [200, 526, 122, 34], sparkle: [238, 520], can: [76, 552], candy: [338, 586],
      f1: [58, 420], f2: [252, 412], leo: [110, 650], momo: [336, 668], seedSoil: [200, 520], pourAt: [148, 470], f1At: [62, 392], f2At: [252, 384], gateAt: [334, 330], cloudAway: [560, 40],
      bfly: [256, 336], bee: [140, 400], worm: [256, 538] },
    L: { hz: 260, sun: [780, 92], fence: 326, gate: [884, 326, 76, 62], bed: [500, 408, 196, 42], sparkle: [548, 400], can: [222, 424], candy: [742, 440],
      f1: [150, 340], f2: [650, 334], leo: [360, 456], momo: [820, 456], seedSoil: [500, 400], pourAt: [380, 352], f1At: [154, 312], f2At: [650, 306], gateAt: [884, 250], cloudAway: [1160, 40],
      bfly: [570, 230], bee: [420, 270], worm: [600, 420] },
    bg: function (W, H, hz, m, lay) {
      var dry = [[0, "#D8DE96"], [.5, "#BFCB7A"], [1, "#9DB066"]];
      var h = sky(W, H, hz, SKY.day, dry) + "<defs>" + GDEFS + "</defs>" + sun(lay.sun[0], lay.sun[1], .9) +
        reveal("sunrays", at(lay.sun[0], lay.sun[1], 1, C(0, 0, 130, "url(#kw-softglow)") + P("M-20,30 L-90,330 L60,330 Z", "#FFF3B0", op(.18))), "st-fade") +
        cloud(m === "P" ? 90 : 240, m === "P" ? 80 : 60, .7, "kw-cloud--b") + farHills(W, hz, "#CFE2B4", "#B9D69C", 71);
      h += hotG("cloud", bigCloud(lay.sun[0], lay.sun[1] + 6, m === "P" ? 1.7 : 2), "bounce");
      h += ground(W, H, hz) + patches(W, H, hz, 73, "#FFF6C9") + tufts(W, H, hz + 18, 75, ["#A8B060", "#8E9A50"], 40);
      h += woodFence(-40, W + 40, lay.fence, m === "P" ? .9 : 1, lay.gate[0], lay.gate[2]);
      h += wiltedStems(m === "P" ? 150 : 300, lay.fence + 12, 1.4) + wiltedStems(m === "P" ? 300 : 760, lay.fence + 14, 1.3);
      h += hotG("gate", at(lay.gate[0], lay.gate[1], 1, gate(lay.gate[2], lay.gate[3])), "bounce") + reveal("gateOpen", at(lay.gate[0], lay.gate[1], 1, gateOpen(lay.gate[2], lay.gate[3])), "st-fade");
      h += hotG("f1", at(lay.f1[0], lay.f1[1], 1, flowers(0, 0, 2.6, ["#FF7FA8", "#FFFFFF", "#FFD24D"]) + E(0, 6, 22, 5, "url(#kw-leaf)", op(.7))), "bounce");
      h += hotG("f2", at(lay.f2[0], lay.f2[1], 1, flowers(0, 0, 2.6, ["#B79CFF", "#FFD24D", "#FF9A5A"]) + E(0, 6, 22, 5, "url(#kw-leaf)", op(.7))), "bounce");
      var b = lay.bed;
      h += hotG("bed", at(b[0], b[1], 1, soilBed(b[2], b[3])), "shine") + reveal("wet", at(b[0], b[1] - 2, 1, E(0, 0, b[2] - 6, b[3] - 5, "url(#sp-wet)", op(.85))), "st-fade");
      h += reveal("planted", at(lay.seedSoil[0], lay.seedSoil[1], 1, E(0, 0, 16, 6, "#8A5A36") + E(-3, -2, 6, 2, "#B07A4A")), "st-pop");
      h += hotG("sparkle", at(lay.sparkle[0], lay.sparkle[1], 1, C(0, -6, 18, "url(#sp-magic)", ' class="st-glowpulse"') + sparkle(0, -8, 1.3, "#FFFFFF") + sparkle(10, -16, .7, "#FFE27A")), "shine");
      h += reveal("seed", at(lay.sparkle[0], lay.sparkle[1] - 18, 1.2, seedGlow()), "st-pop");
      var sx = lay.seedSoil[0], sy = lay.seedSoil[1] - 2;
      h += reveal("sprout", at(sx, sy, 1.3, sproutArt(2)), "st-grow") + reveal("plant", at(sx, sy, 1.3, sproutArt(3)), "st-grow");
      h += hotG("bud", reveal("budPlant", at(sx, sy, 1.3, sproutArt(4)), "st-grow"), "bounce");
      h += reveal("flower", at(sx, sy, 1.25, magicFlower()), "st-bloom");
      h += hotG("can", at(lay.can[0], lay.can[1], 1.2, wateringCan()), "bounce");
      h += reveal("pour", at(lay.pourAt[0] + 40, lay.pourAt[1] + 10, 1.4, pourDrops()), "st-fade");
      h += hotG("candy", at(lay.candy[0], lay.candy[1], 1.1, lollipop()), "nope");
      // the visitors the flower brings (tap them) — and the butterfly that will show the way
      h += hotG("wormHot", E(lay.worm[0], lay.worm[1] - 6, 30, 16, "#FFFFFF", op(.01)) + reveal("worm", at(lay.worm[0], lay.worm[1], 1.2, worm()), "st-pop"), "bounce");
      h += hotG("beeHot", E(lay.bee[0], lay.bee[1], 28, 22, "#FFFFFF", op(.01)) + reveal("bee", bee(lay.bee[0], lay.bee[1], 2.4), "st-pop"), "bounce");
      h += hotG("bflyHot", E(lay.bfly[0], lay.bfly[1], 30, 24, "#FFFFFF", op(.01)), "bounce") + reveal("bfly", butterflyStill(lay.bfly[0], lay.bfly[1], 4.4, "#FF8A1F"), "st-pop");
      return h + anchors(lay, ["leo", "momo", "seedSoil", "pourAt", "f1At", "f2At", "gateAt", "cloudAway"]);
    }
  });

  WA.addStoryPlace("secretgarden", {   // behind the gate: a secret garden waiting for rain
    P: { hz: 300, cloudAt: [200, 150], fountain: [200, 500], bedL: [70, 470], bedR: [330, 470], leo: [116, 650], momo: [330, 668] },
    L: { hz: 230, cloudAt: [500, 104], fountain: [500, 372], bedL: [200, 400], bedR: [800, 400], leo: [372, 462], momo: [612, 466] },
    bg: function (W, H, hz, m, lay) {
      var h = sky(W, H, hz, SKY.day, GROUND.meadow) + "<defs>" + GDEFS + "</defs>" + farHills(W, hz, "#C8E6BC", "#A9D69E", 81);
      h += stoneWall(-900, W + 900, hz + 70, 96) + at(W / 2, hz + 70, 1, P("M-46,0 L-46,-60 C-46,-96 46,-96 46,-60 L46,0 Z", "#DCE9F4") + P("M-46,0 L-46,-60 C-46,-96 46,-96 46,-60 L46,0", "none", ' stroke="#A89FBF" stroke-width="8"'));
      h += ground(W, H, hz + 66) + patches(W, H, hz + 66, 83) + tufts(W, H, hz + 84, 85, ["#5FA84F", "#4E9444"], 40);
      h += P(m === "P" ? "M170,900 C178,720 190,600 200,470 L220,470 C230,600 242,720 250,900 Z" : "M430,700 C450,560 480,450 490,380 L510,380 C520,450 550,560 570,700 Z", "#E3D6BD", op(.9));
      [lay.bedL, lay.bedR].forEach(function (bd, i) {
        h += hotG(i ? "bedR" : "bedL", at(bd[0], bd[1], 1, E(0, 6, m === "P" ? 56 : 120, 16, "url(#sp-soil)")) + propG("stems" + i, wiltedStems(bd[0] - 10, bd[1], m === "P" ? 1.6 : 2.2)), "shine") +
          reveal("blooms" + i, at(0, 0, 1, bloomClump(bd[0] - (m === "P" ? 18 : 50), bd[1], m === "P" ? 1.2 : 1.6, 3 + i) + bloomClump(bd[0] + (m === "P" ? 18 : 50), bd[1] + 4, m === "P" ? 1.1 : 1.5, 9 + i)), "st-grow");
      });
      h += hotG("fountain", fountainBowl(lay.fountain[0], lay.fountain[1], m === "P" ? 1 : 1.2), "shine") + reveal("water", fountainWater(lay.fountain[0], lay.fountain[1], m === "P" ? 1 : 1.2), "st-fade");
      h += reveal("rainbow", rainbowArc(W / 2, hz + 40, m === "P" ? 170 : 300), "st-fade");
      h += hotG("raincloud", at(lay.cloudAt[0], lay.cloudAt[1], m === "P" ? 1.5 : 1.8, E(4, 10, 46, 12, "#8A9CBE", op(.4)) + C(-28, 0, 18, "#C9D3E6") + C(-6, -12, 24, "#D9E0EE") + C(20, -4, 19, "#C9D3E6") + C(36, 4, 13, "#BFC9DD") + E(4, 6, 44, 13, "#C9D3E6")), "bounce");
      h += reveal("rain", rainDrops(W, lay.cloudAt[1] + 20, H * .78), "st-fade");
      h += reveal("flutters", butterfly(m === "P" ? 90 : 240, m === "P" ? 380 : 300, 2.4, "#FFB020", "kw-bfly--a") + butterfly(m === "P" ? 300 : 760, m === "P" ? 360 : 280, 2.2, "#FF8FB0", "kw-bfly--b") +
        butterfly(m === "P" ? 220 : 560, m === "P" ? 300 : 220, 2, "#7FC8FF"), "st-fade");
      return h + anchors(lay, ["leo", "momo"]);
    }
  });
})(window);
