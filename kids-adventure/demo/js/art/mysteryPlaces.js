/* =========================================================================
   mysteryPlaces.js — Change #23: the places of "Mystery of the Lost Treasure"
     cove    Treasure Island beach: a palm, a crab, a shell, an old boat, rocks
             and the bottle with the torn map
     ruins   old stones in the jungle: three secret signs, the clue tablet and
             three paths (one hidden behind vines)
     grotto  the cave: a stone door with a sign lock, the treasure chamber
   Original drawings in the Kido World storybook style (Kido.worldArt.kit),
   registered with Kido.worldArt.addStoryPlace. Same contract as
   js/art/storyPlaces.js: data-hot (tap), data-prop (fly / tidy away),
   data-reveal (hidden until revealed), data-anchor (where Momo stands).
   Portrait 400×840 keeps tapped things above y≈620; landscape 1000×600 above y≈440.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var WA = Kido.worldArt;
  if (!WA || !WA.kit || !WA.addStoryPlace) return;
  var K = WA.kit;
  var n = K.n, g = K.g, at = K.at, anim = K.anim, lg = K.lg, rg = K.rg, E = K.E, C = K.C, R = K.R, P = K.P, L = K.L, op = K.op, big = K.big, delay = K.delay;
  var shadow = K.shadow, tree = K.tree, bush = K.bush, flowers = K.flowers, rock = K.rock, cloud = K.cloud, birds = K.birds,
    sparkle = K.sparkle, tufts = K.tufts, fern = K.fern, anchorPt = K.anchorPt, hotG = K.hotG, palm = K.palm, crab = K.crab;

  function propG(key, inner) { return g(inner, "", "st-prop", ' data-prop="' + key + '"'); }
  function reveal(key, inner, cls) { return g(inner, "", "kw-reveal" + (cls ? " " + cls : ""), ' data-reveal="' + key + '"'); }
  function anchors(lay, keys) { return keys.map(function (k) { return anchorPt(k, lay[k][0], lay[k][1]); }).join(""); }
  function sparkles(x, y, s, count, spread) {
    var r = K.rng(count * 11 + 5), h = "";
    for (var i = 0; i < count; i++) h += sparkle(x + (r() - .5) * spread, y + (r() - .5) * spread * .6, s * (.6 + r() * .6), i % 3 ? "#FFFFFF" : "#FFE27A");
    return anim("st-twinkle", h);
  }
  var DEFS = "<defs>" + [
    lg("mx-sky", 0, 0, 0, 1, [[0, "#7CC6FF"], [.6, "#C9ECFF"], [1, "#FFF3D6"]]),
    lg("mx-sand", 0, 0, 0, 1, [[0, "#FBE3A6"], [.6, "#F1CB7E"], [1, "#DDAE62"]]),
    lg("mx-sea", 0, 0, 0, 1, [[0, "#3FA9E0"], [1, "#7FD3F2"]]),
    lg("mx-jungle", 0, 0, 0, 1, [[0, "#A7DC8C"], [.5, "#6DB862"], [1, "#3F8A4C"]]),
    lg("mx-trail", 0, 0, 0, 1, [[0, "#B99366"], [1, "#E8CFA0"]]),
    lg("mx-stone", 0, 0, .6, 1, [[0, "#E2DDEE"], [1, "#9A93B4"]]),
    lg("mx-moss", 0, 0, 0, 1, [[0, "#9ED27A"], [1, "#5C9E4E"]]),
    lg("mx-cave", 0, 0, 0, 1, [[0, "#3A3358"], [.6, "#4E4570"], [1, "#2B2444"]]),
    lg("mx-wall", 0, 0, 1, 1, [[0, "#6E6596"], [1, "#4A426E"]]),
    lg("mx-wood", 0, 0, 0, 1, [[0, "#C98A4E"], [1, "#7A4522"]]),
    lg("mx-gold", 0, 0, 0, 1, [[0, "#FFF1A8"], [1, "#E2A22A"]]),
    lg("mx-paper", 0, 0, .3, 1, [[0, "#FFF8E6"], [1, "#EED7A6"]]),
    lg("mx-glass", 0, 0, 1, 1, [[0, "#BFF0E0"], [1, "#4FB59A"]]),
    rg("mx-torch", .5, .5, .5, [[0, "#FFF6C8", .95], [.4, "#FFC94D", .6], [1, "#FF8A1F", 0]]),
    rg("mx-glow", .5, .55, .5, [[0, "#FFF8D2", .95], [.45, "#FFD86B", .55], [1, "#FFC247", 0]]),
    rg("mx-sunset", .5, .5, .5, [[0, "#FFF6C8", .8], [1, "#FFE27A", 0]])
  ].join("") + "</defs>";

  /* ---------------- shared pieces ---------------- */
  function bottle(x, y, s) {
    return at(x, y, s, shadow(2, 4, 26, 5) +
      g(R(-22, -9, 36, 18, 9, "url(#mx-glass)", op(.92)) + R(12, -5, 12, 10, 3, "url(#mx-glass)", op(.92)) + R(22, -6, 7, 12, 2, "#B07A4A") +
        R(-14, -5, 22, 10, 4, "url(#mx-paper)") + L("M-10,-2 L4,-2 M-10,2 L2,2", "#B07A4A", 1, op(.7)) + R(-18, -7, 26, 3, 1.5, "#FFFFFF", op(.55)), "rotate(-18)") +
      P("M-30,4 C-20,-2 10,-2 30,6 L30,10 L-30,10 Z", "#F1CB7E"));
  }
  function shell(x, y, s) {
    var h = shadow(0, 2, 14, 3) + P("M0,0 L-15,-14 C-12,-24 12,-24 15,-14 Z", "#F7A6C4") + R(-4, -2, 8, 4, 2, "#E87FA6");
    [-10, -5, 0, 5, 10].forEach(function (dx) { h += L("M0,-1 L" + dx + ",-20", "#D4648C", 1, op(.6)); });
    return at(x, y, s, h + E(-6, -15, 3, 1.6, "#FFFFFF", op(.6)));
  }
  function rowboat(x, y, s) {
    return at(x, y, s, shadow(0, 4, 64, 8) +
      P("M-60,-22 L60,-22 C54,-4 40,4 0,4 C-40,4 -54,-4 -60,-22 Z", "url(#mx-wood)") +
      L("M-56,-14 C-30,-8 30,-8 56,-14 M-50,-6 C-24,-1 24,-1 50,-6", "#5E3417", 1.4, op(.6)) +
      R(-62, -26, 124, 6, 3, "#8D5A34") + R(-10, -24, 20, 4, 2, "#6E3F1E") +
      L("M20,-26 L48,-60", "#8D5A34", 4) + E(50, -62, 6, 3, "#8D5A34") + E(-30, 2, 20, 4, "#FFFFFF", op(.25)));
  }
  function tornMap(w, h0, whole) {   // the map from the bottle: torn (pieces missing) or mended (path + X)
    var hw = w / 2, hh = h0 / 2, out = shadow(4, hh + 8, hw, 10);
    out += P("M" + (-hw) + "," + (-hh) + " L" + (hw - 14) + "," + (-hh - 6) + " L" + hw + "," + (-hh + 10) + " L" + (hw + 4) + "," + (hh - 8) + " L" + (hw - 10) + "," + hh +
      " L" + (-hw + 8) + "," + (hh + 6) + " L" + (-hw - 4) + "," + (hh - 12) + " Z", "url(#mx-paper)", ' stroke="#C99B5E" stroke-width="2"');
    var pts = [[-hw * .62, hh * .35], [-hw * .2, -hh * .25], [hw * .2, hh * .2], [hw * .6, -hh * .3]];
    function stamp(i, kind) {
      var p = pts[i], sc = w / 300;
      if (kind === "palm") return at(p[0], p[1], sc, L("M0,14 C0,4 2,-6 6,-14", "#7A4A22", 3) + L("M6,-14 C0,-20 -8,-18 -12,-12 M6,-14 C12,-20 20,-18 22,-12 M6,-14 C4,-22 -2,-24 -6,-22", "#7A4A22", 2.6));
      if (kind === "rock") return at(p[0], p[1], sc, P("M-16,12 C-18,-2 -8,-14 4,-14 C16,-14 20,0 18,12 Z", "none", ' stroke="#7A4A22" stroke-width="2.6"'));
      if (kind === "bridge") return at(p[0], p[1], sc, L("M-20,0 Q0,12 20,0 M-20,-8 Q0,4 20,-8 M-20,-12 L-20,6 M20,-12 L20,6", "#7A4A22", 2.4));
      return at(p[0], p[1], sc, P("M-18,12 C-18,-6 -8,-16 0,-16 C8,-16 18,-6 18,12 Z", "none", ' stroke="#7A4A22" stroke-width="2.6"') + L("M-6,0 L6,10 M6,0 L-6,10", "#C0392B", 3.4));
    }
    if (whole) {
      // the route starts at the boat on the shore (bottom of the map)
      var bt = [-hw * .18, hh * .72], bs = w / 300;
      out += L("M" + n(bt[0]) + "," + n(bt[1]) + " Q" + n(pts[0][0] + 10) + "," + n(bt[1] + 4) + " " + n(pts[0][0] + 6) + "," + n(pts[0][1] + 14), "#C0392B", 2.4, ' stroke-dasharray="6 6"') +
        at(bt[0], bt[1], bs, P("M-14,0 L14,0 L10,7 L-10,7 Z", "none", ' stroke="#7A4A22" stroke-width="2.4" stroke-linejoin="round"') + L("M0,0 L0,-14 L9,-3 L0,-3", "#7A4A22", 2));
      out += L("M" + n(pts[0][0]) + "," + n(pts[0][1]) + " C" + n(pts[0][0] + 20) + "," + n(pts[0][1] - 40) + " " + n(pts[1][0] - 20) + "," + n(pts[1][1] + 20) + " " + n(pts[1][0]) + "," + n(pts[1][1]) +
        " S" + n(pts[2][0] - 20) + "," + n(pts[2][1] + 10) + " " + n(pts[2][0]) + "," + n(pts[2][1]) + " S" + n(pts[3][0] - 30) + "," + n(pts[3][1] + 20) + " " + n(pts[3][0]) + "," + n(pts[3][1]),
        "#C0392B", 2.4, ' stroke-dasharray="6 6"');
      out += stamp(0, "palm") + stamp(1, "rock") + stamp(2, "bridge") + stamp(3, "cave");
      out += at(-hw * .7, -hh * .62, w / 300, C(0, 0, 12, "none", ' stroke="#7A4A22" stroke-width="2"') + P("M0,-10 L3,0 L0,10 L-3,0 Z", "#C0392B") + L("M-10,0 L10,0", "#7A4A22", 1.4));
    } else {
      out += stamp(0, "palm") + stamp(3, "cave");
      // the gaps where pieces are missing
      out += P("M" + n(-hw * .45) + "," + n(-hh * .7) + " L" + n(hw * .05) + "," + n(-hh * .75) + " L" + n(hw * .12) + "," + n(hh * .55) + " L" + n(-hw * .35) + "," + n(hh * .5) + " Z", "#E3C487", ' stroke="#B0844A" stroke-width="1.6" stroke-dasharray="4 4"');
    }
    return out;
  }
  function signPost(x, y, s, glyph, col) {
    var gl = glyph === "star" ? P("M0,-9 L2.6,-3 L9,-3 L4,1 L6,8 L0,4 L-6,8 L-4,1 L-9,-3 L-2.6,-3 Z", col)
      : glyph === "heart" ? P("M0,8 C-8,2 -10,-3 -7,-7 C-4,-10 -1,-8 0,-5 C1,-8 4,-10 7,-7 C10,-3 8,2 0,8 Z", col)
      : P("M0,9 C-8,4 -9,-6 0,-10 C9,-6 8,4 0,9 Z", col) + L("M0,8 L0,-8", "#2E7A45", 1);
    return at(x, y, s, shadow(0, 1, 10, 3) + R(-2.5, -46, 5, 46, 2, "#8D5A34") + R(-14, -60, 28, 24, 6, "url(#mx-wood)") + R(-11, -57, 22, 18, 4, "#FFF3D6") + at(0, -48, 1, gl));
  }
  function stoneSlab(x, y, s, w, h0) {
    return at(x, y, s, shadow(0, 2, w * .55, 6) + P("M" + (-w / 2) + ",0 L" + (-w / 2 + 4) + "," + (-h0) + " C" + (-w / 4) + "," + (-h0 - 10) + " " + (w / 4) + "," + (-h0 - 10) + " " + (w / 2 - 4) + "," + (-h0) + " L" + (w / 2) + ",0 Z", "url(#mx-stone)") +
      P("M" + (-w / 2 + 6) + "," + (-h0 + 8) + " C" + (-w / 4) + "," + (-h0 - 2) + " " + (w / 4) + "," + (-h0 - 2) + " " + (w / 2 - 10) + "," + (-h0 + 6), "none", ' stroke="#FFFFFF" stroke-width="2" opacity=".5"') +
      E(-w * .25, -h0 + 4, w * .2, 5, "url(#mx-moss)", op(.9)));
  }
  function carving(kind, x, y, s, glow, cut) {   // a secret sign carved into stone (or bark: cut = its colour); glow = the found version
    var col = glow ? { star: "#FFD24D", moon: "#BFE0FF", sun: "#FF9A3A" }[kind] : (cut || "#5E5878");
    var shape = kind === "star" ? "M0,-12 L3.5,-4 L12,-4 L5,1.5 L8,11 L0,5.5 L-8,11 L-5,1.5 L-12,-4 L-3.5,-4 Z"
      : kind === "moon" ? "M4,-12 A12,12 0 1 0 4,12 A9,9 0 1 1 4,-12 Z" : null;
    var h = shape ? P(shape, col, glow ? "" : op(.55)) : C(0, 0, 6, col, glow ? "" : op(.55)) +
      [0, 60, 120, 180, 240, 300].map(function (a) { return R(-1.6, -12, 3.2, 5, 1.6, col, ' transform="rotate(' + a + ')"' + (glow ? "" : op(.55))); }).join("");
    return at(x, y, s, (glow ? C(0, 0, 18, "url(#mx-glow)") : "") + h);
  }

  /* ================= THE COVE ================= */
  WA.addStoryPlace("cove", {
    P: { hz: 300, palm: [64, 470], boat: [290, 412], crab: [312, 552], shell: [226, 606], rocks: [104, 604], bottle: [124, 584],
      map: [200, 470], coconut: [98, 560], momo: [330, 668] },
    L: { hz: 220, palm: [120, 400], boat: [700, 330], crab: [590, 426], shell: [440, 440], rocks: [250, 444], bottle: [272, 424],
      map: [500, 300], coconut: [156, 432], momo: [880, 456] },
    bg: function (W, H, hz, m, lay) {
      var sea = hz + (m === "P" ? 80 : 60);
      var h = DEFS + big(-900, -900, W + 1800, hz + 960, "url(#mx-sky)") + C(m === "P" ? 320 : 820, m === "P" ? 110 : 80, 70, "url(#mx-sunset)") +
        C(m === "P" ? 320 : 820, m === "P" ? 110 : 80, 26, "#FFE680") + cloud(m === "P" ? 90 : 260, m === "P" ? 90 : 70, .8, "kw-cloud--a") +
        cloud(m === "P" ? 250 : 540, m === "P" ? 190 : 120, .6, "kw-cloud--b") + birds(m === "P" ? 150 : 420, m === "P" ? 150 : 110, 1);
      // the sea, with a far island
      h += at(m === "P" ? 330 : 860, hz + 2, m === "P" ? .7 : 1, E(0, 0, 60, 12, "#7FBF8A") + E(-10, -6, 40, 10, "#9ED7A0") + palm(6, -8, .6));
      h += big(-900, hz, W + 1800, sea - hz + 30, "url(#mx-sea)");
      h += anim("kw-wave", L("M-900," + (hz + 22) + " C" + n(W * .3) + "," + (hz + 16) + " " + n(W * .6) + "," + (hz + 28) + " " + (W + 900) + "," + (hz + 22), "#FFFFFF", 2, op(.6)));
      h += anim("kw-wave kw-wave--b", L("M-900," + (hz + 46) + " C" + n(W * .3) + "," + (hz + 40) + " " + n(W * .6) + "," + (hz + 52) + " " + (W + 900) + "," + (hz + 46), "#FFFFFF", 1.6, op(.5)));
      // the beach
      var shore = "M-900," + (sea + 10) + " C" + n(W * .2) + "," + (sea - 6) + " " + n(W * .5) + "," + (sea + 8) + " " + n(W * .8) + "," + (sea - 4) + " S" + (W + 600) + "," + (sea + 6) + " " + (W + 900) + "," + (sea + 4) +
        " L" + (W + 900) + "," + (H + 900) + " L-900," + (H + 900) + " Z";
      h += P(shore, "#FFFFFF", op(.7) + ' transform="translate(0 -6)"') + P(shore, "url(#mx-sand)");
      var r = K.rng(71);
      for (var i = 0; i < 26; i++) h += E(r() * W, sea + 40 + r() * (H - sea - 40), 2 + r() * 3, 1 + r() * 1.4, "#D9A95C", op(.45));
      // things to find
      h += hotG("boat", rowboat(lay.boat[0], lay.boat[1], m === "P" ? .8 : 1), "nope");
      h += hotG("palm", palm(lay.palm[0], lay.palm[1], m === "P" ? 2.5 : 2.7), "rustle") +
        reveal("coconut", at(lay.coconut[0], lay.coconut[1], m === "P" ? 1.4 : 1.5, shadow(0, 2, 10, 3) + C(0, -8, 9, "#7A4A22") + C(-3, -11, 3, "#FFFFFF", op(.25))), "st-pop");
      h += at(lay.rocks[0], lay.rocks[1], m === "P" ? 1.3 : 1.5, rock(-26, 0, 1.1) + rock(26, 6, .8, true));
      h += hotG("bottle", bottle(lay.bottle[0], lay.bottle[1], m === "P" ? 1.7 : 1.8), "shine") +
        anim("st-twinkle", sparkle(lay.bottle[0] + 26, lay.bottle[1] - 24, .9, "#FFFFFF") + sparkle(lay.bottle[0] - 14, lay.bottle[1] - 30, .6, "#FFE27A"));
      h += hotG("shell", shell(lay.shell[0], lay.shell[1], m === "P" ? 2 : 2.1), "shine");
      h += hotG("crab", at(lay.crab[0], lay.crab[1], m === "P" ? 2.8 : 3, crab()), "wiggle");
      // the map from the bottle (torn), then mended
      var mw = m === "P" ? 260 : 340, mh = m === "P" ? 170 : 190;
      h += reveal("map", at(lay.map[0], lay.map[1], 1, tornMap(mw, mh, false)), "st-pop") +
        reveal("mapWhole", at(lay.map[0], lay.map[1], 1, tornMap(mw, mh, true) + sparkles(0, -mh * .4, 1.2, 6, mw * .9)), "st-fade");
      return h + anchors(lay, ["momo"]);
    }
  });

  /* ================= THE RUINS ================= */
  function trail(x, y, s, w, glow) {   // a path running back into the jungle (an opening between trees)
    return at(x, y, s, E(0, -70, w * .55, 46, "#2E5A36", op(.75)) + P("M" + (-w / 2) + ",0 C" + (-w * .3) + ",-40 " + (-w * .18) + ",-70 -8,-96 L8,-96 C" + (w * .18) + ",-70 " + (w * .3) + ",-40 " + (w / 2) + ",0 Z", "url(#mx-trail)") +
      (glow ? E(0, -40, w * .7, 60, "url(#mx-glow)") : ""));
  }
  function stepStone(x, y, s) { return at(x, y, s, E(0, 2, 11, 4, "#3E5A3E", op(.4)) + E(0, 0, 10, 5.5, "url(#mx-stone)") + E(-3, -2, 4, 1.6, "#FFFFFF", op(.6))); }
  function vines(x, y, s, w) {
    var h = "", r = K.rng(29);
    for (var i = 0; i < 9; i++) {
      var vx = -w / 2 + i * (w / 8), len = 70 + r() * 30;
      h += L("M" + n(vx) + ",-110 C" + n(vx + 6) + "," + n(-110 + len * .4) + " " + n(vx - 6) + "," + n(-110 + len * .7) + " " + n(vx) + "," + n(-110 + len), "#3E8A45", 3);
      for (var j = 1; j < 4; j++) h += E(vx + (j % 2 ? 5 : -5), -110 + len * j / 4, 6, 3.2, j % 2 ? "url(#kw-leaf)" : "url(#kw-leaf-d)");
    }
    return at(x, y, s, anim("kw-seaweed", h));
  }
  WA.addStoryPlace("ruins", {
    P: { hz: 250, pathRiver: [72, 380], pathFlower: [200, 360], pathStone: [330, 380], tablet: [200, 510], starStone: [56, 560],
      moonTree: [352, 540], leaves: [124, 616], sun: [124, 608], frog: [282, 610], flower: [30, 470], momo: [214, 676], pathGo: [330, 400] },
    L: { hz: 190, pathRiver: [250, 300], pathFlower: [500, 286], pathStone: [750, 300], tablet: [420, 438], starStone: [120, 420],
      moonTree: [910, 400], leaves: [250, 436], sun: [250, 430], frog: [640, 436], flower: [40, 380], momo: [820, 470], pathGo: [750, 316] },
    bg: function (W, H, hz, m, lay) {
      var h = DEFS + big(-900, -900, W + 1800, hz + 960, "url(#mx-sky)") + cloud(m === "P" ? 120 : 300, m === "P" ? 70 : 60, .7, "kw-cloud--a");
      for (var i = -2; i < W / 70 + 2; i++) h += tree(i * 70 + 20, hz + 20 + (i % 2) * 10, 1.6 + (i % 3) * .2, "deep");
      h += big(-900, hz + 10, W + 1800, H + 900, "url(#mx-jungle)");
      var sc = m === "P" ? 1.15 : 1.35, pw = m === "P" ? 84 : 110, ss = sc * 1.45;   // ss: the signs must be easy to tell apart
      // three paths into the jungle, each with its own sign and look
      var pr = lay.pathRiver, pf = lay.pathFlower, ps = lay.pathStone;
      h += hotG("pathRiver", trail(pr[0], pr[1], sc, pw) + at(pr[0], pr[1] - 30 * sc, sc, E(0, 0, pw * .62, 9, "#5FB8E8") + anim("kw-wave", L("M-30,0 Q-15,-4 0,0 T30,0", "#FFFFFF", 1.6, op(.7)))) +
        stepStone(pr[0] - 16 * sc, pr[1] - 30 * sc, sc) + stepStone(pr[0] + 4 * sc, pr[1] - 26 * sc, sc) + stepStone(pr[0] + 22 * sc, pr[1] - 32 * sc, sc) +
        signPost(pr[0] - pw * .42 * sc, pr[1] + 4, ss, "heart", "#E8413C"), "nope");
      h += hotG("pathFlower", trail(pf[0], pf[1], sc, pw) + flowers(pf[0] - 26 * sc, pf[1] - 8 * sc, 1.3 * sc) + flowers(pf[0] + 28 * sc, pf[1] - 14 * sc, 1.2 * sc, ["#FFFFFF", "#FFD24D", "#FF8FB0"]) +
        flowers(pf[0] - 8 * sc, pf[1] - 50 * sc, 1 * sc) + stepStone(pf[0] + 2 * sc, pf[1] - 26 * sc, sc) +
        signPost(pf[0] - pw * .42 * sc, pf[1] + 4, ss, "leaf", "#4FB060"), "nope");
      h += hotG("pathStone", trail(ps[0], ps[1], sc, pw) + stepStone(ps[0] - 10 * sc, ps[1] - 20 * sc, sc) + stepStone(ps[0] + 8 * sc, ps[1] - 44 * sc, sc), "shine") +
        reveal("pathGlow", trail(ps[0], ps[1], sc, pw, true) + sparkles(ps[0], ps[1] - 70 * sc, 1, 5, pw), "st-fade");
      h += propG("vines", vines(ps[0], ps[1] - 4 * sc, sc, pw * .9));
      h += signPost(ps[0] - pw * .42 * sc, ps[1] + 4, ss, "star", "#F2B82C");   // in front of the vines: the youngest look for this star
      // the secret signs
      var st = lay.starStone, mt = lay.moonTree, lv = lay.leaves, k = m === "P" ? 1 : 1.2;
      h += hotG("starStone", stoneSlab(st[0], st[1], k, 56, 84) + carving("star", st[0], st[1] - 46 * k, k, false), "shine") +
        reveal("starGlow", carving("star", st[0], st[1] - 46 * k, k, true), "st-fade");
      h += hotG("moonTree", at(mt[0], mt[1], k, shadow(0, 2, 26, 5) + P("M-16,0 C-14,-50 -12,-100 -10,-150 L12,-150 C14,-100 16,-50 18,0 Z", "url(#kw-trunk)") +
        E(0, -160, 40, 30, "url(#kw-leaf-d)") + E(-20, -150, 24, 18, "url(#kw-leaf)") + E(1, -64, 15, 18, "#6E4526", op(.55))) + carving("moon", mt[0] + k, mt[1] - 64 * k, k * 1.3, false, "#F6E6C8"), "rustle") +
        reveal("moonGlow", carving("moon", mt[0] + k, mt[1] - 64 * k, k * 1.3, true), "st-fade");
      h += reveal("sunSign", at(lv[0], lv[1], k, E(0, 0, 30, 10, "url(#mx-stone)")) + carving("sun", lv[0], lv[1] - 2 * k, k * .8, true), "st-fade");
      h += hotG("leaves", propG("leafPile", at(lv[0], lv[1], k, E(-14, -4, 16, 8, "url(#kw-leaf)") + E(10, -6, 18, 9, "url(#kw-leaf-d)") + E(-2, -12, 15, 8, "url(#kw-leaf)") +
        E(16, -14, 12, 6, "#E3B24E") + E(-18, -14, 10, 5, "#D9843A"))), "rustle");
      h += hotG("frog", at(lay.frog[0], lay.frog[1], k * 2.4, K.frog()), "bounce");
      h += hotG("flower", at(lay.flower[0], lay.flower[1], k * 1.6, L("M0,0 L0,-26", "#3E8A45", 2) + [0, 72, 144, 216, 288].map(function (a) { return E(0, -32, 4, 7, "#FF8FB0", ' transform="rotate(' + a + ' 0 -26)"'); }).join("") + C(0, -26, 3.4, "#FFD24D")), "nope");
      // the clue tablet
      var tb = lay.tablet, tk = m === "P" ? 1 : 1.15;
      h += hotG("tablet", at(tb[0], tb[1], tk, shadow(0, 2, 60, 8) + R(-52, -96, 104, 96, 14, "url(#mx-stone)") + R(-46, -90, 92, 84, 10, "none", ' stroke="#FFFFFF" stroke-width="2" opacity=".4"') +
        E(-30, -96, 26, 7, "url(#mx-moss)") + L("M-30,-60 L30,-60 M-30,-40 L22,-40 M-30,-20 L26,-20", "#7A7396", 3, op(.5))), "shine") +
        reveal("tabletGlow", at(tb[0], tb[1] - 48 * tk, tk, E(0, 0, 80, 70, "url(#mx-glow)")), "st-fade") +
        reveal("tabletClue", at(tb[0], tb[1], tk,
          // the clue in pictures: two stones ✓ · water ✗ · flowers ✗
          stepStone(-30, -62, 1.4) + stepStone(-12, -62, 1.4) + P("M4,-64 l4,5 9,-11", "none", ' stroke="#38C172" stroke-width="3.4" stroke-linecap="round"') +
          E(-22, -34, 16, 6, "#5FB8E8") + L("M-30,-40 L-14,-28 M-14,-40 L-30,-28", "#E8413C", 3) +
          at(16, -30, .9, [0, 72, 144, 216, 288].map(function (a) { return E(0, -6, 3, 5, "#FF8FB0", ' transform="rotate(' + a + ')"'); }).join("") + C(0, 0, 2.6, "#FFD24D")) +
          L("M8,-40 L24,-28 M24,-40 L8,-28", "#E8413C", 3)), "st-fade");
      h += fern(m === "P" ? 380 : 970, m === "P" ? 640 : 470, 1.2) + bush(m === "P" ? 10 : 30, m === "P" ? 680 : 500, 1.3);
      return h + anchors(lay, ["momo", "pathGo"]);
    }
  });

  /* ================= THE GROTTO ================= */
  function torch(x, y, s) {
    return at(x, y, s, R(-3, -10, 6, 34, 2, "#6E3F1E") + R(-7, -14, 14, 6, 2, "#8D5A34") + C(0, -30, 30, "url(#mx-torch)", ' class="kw-pulse"') +
      anim("st-flame", P("M0,-14 C-8,-20 -6,-32 0,-42 C6,-32 8,-20 0,-14 Z", "#FFB020") + P("M0,-16 C-4,-20 -3,-27 0,-32 C3,-27 4,-20 0,-16 Z", "#FFF1A8")));
  }
  function stoneDoor(w, h0) {
    var hw = w / 2;
    return shadow(0, 4, hw + 10, 10) + P("M" + (-hw) + ",0 L" + (-hw) + "," + (-h0 + hw) + " A" + hw + "," + hw + " 0 0,1 " + hw + "," + (-h0 + hw) + " L" + hw + ",0 Z", "url(#mx-stone)") +
      L("M0,0 L0," + (-h0 + 6), "#7A7396", 2, op(.6)) +
      P("M" + (-hw + 10) + "," + (-h0 + hw) + " A" + (hw - 10) + "," + (hw - 10) + " 0 0,1 " + (hw - 10) + "," + (-h0 + hw), "none", ' stroke="#FFFFFF" stroke-width="2.4" opacity=".4"') +
      [-1, 0, 1].map(function (i) { return R(i * 34 - 15, -h0 * .55 - 15, 30, 30, 8, "#6E6596") + R(i * 34 - 12, -h0 * .55 - 12, 24, 24, 6, "#4A426E"); }).join("") +
      C(0, -h0 * .25, 9, "url(#mx-gold)") + R(-3, -h0 * .25, 6, 12, 2, "#5E3417");
  }
  WA.addStoryPlace("grotto", {
    P: { door: [200, 540], chest: [200, 548], torchL: [56, 380], torchR: [344, 380], momo: [330, 676], chestAt: [200, 500] },
    L: { door: [500, 420], chest: [500, 424], torchL: [300, 250], torchR: [700, 250], momo: [790, 470], chestAt: [500, 380] },
    bg: function (W, H, hz, m, lay) {
      var h = DEFS + big(-900, -900, W + 1800, H + 1800, "url(#mx-cave)");
      // rocky walls, stalactites, a sandy floor
      var r = K.rng(53), i;
      for (i = -4; i < W / 60 + 4; i++) h += P("M" + (i * 60) + ",-900 L" + (i * 60 + 60) + ",-900 L" + (i * 60 + 38) + "," + n(30 + r() * (m === "P" ? 90 : 60)) + " Z", "#2B2444", op(.9));
      h += P("M-900," + (m === "P" ? 260 : 150) + " C" + n(W * .2) + "," + (m === "P" ? 200 : 110) + " " + n(W * .8) + "," + (m === "P" ? 200 : 110) + " " + (W + 900) + "," + (m === "P" ? 260 : 150) + " L" + (W + 900) + ",-900 L-900,-900 Z", "url(#mx-wall)", op(.6));
      var floor = m === "P" ? 560 : 430;
      h += P("M-900," + floor + " C" + n(W * .3) + "," + (floor - 20) + " " + n(W * .7) + "," + (floor - 20) + " " + (W + 900) + "," + floor + " L" + (W + 900) + "," + (H + 900) + " L-900," + (H + 900) + " Z", "url(#mx-sand)", op(.85));
      for (i = 0; i < 6; i++) h += C(r() * W, 120 + r() * (floor - 200), 1.6 + r() * 1.4, i % 2 ? "#BFE0FF" : "#FFE27A", ' class="kw-tw" style="' + delay(i * .4) + '"');
      h += torch(lay.torchL[0], lay.torchL[1], m === "P" ? 1.3 : 1.5) + torch(lay.torchR[0], lay.torchR[1], m === "P" ? 1.3 : 1.5);
      var dw = m === "P" ? 210 : 250, dh = m === "P" ? 260 : 270, d = lay.door, c = lay.chest, k = m === "P" ? 2.3 : 2.5;
      // the treasure chamber behind the door (seen once it opens)
      h += reveal("chamber", at(d[0], d[1], 1, E(0, -dh * .45, dw * .7, dh * .6, "url(#mx-glow)") + P("M" + (-dw / 2) + ",0 L" + (-dw / 2) + "," + (-dh + dw / 2) + " A" + (dw / 2) + "," + (dw / 2) + " 0 0,1 " + (dw / 2) + "," + (-dh + dw / 2) + " L" + (dw / 2) + ",0 Z", "#5E4A2E", op(.55)) +
        [[-60, -10], [-36, -4], [40, -6], [64, -12]].map(function (p) { return C(p[0], p[1], 8, "url(#mx-gold)"); }).join("")), "st-fade");
      // the chest: shut, then open with light pouring out
      h += reveal("treasureRays", at(c[0], c[1] - 50 * k / 1.7, 1, anim("kw-spin st-slow", [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(function (a) {
        return P("M-10,0 L0,-" + (dw * .9) + " L10,0 Z", "#FFF3B0", op(.45) + ' transform="rotate(' + a + ')"'); }).join("")) + C(0, 0, dw * .5, "url(#mx-glow)")), "st-fade");
      h += hotG("chest", propG("chestShut", at(c[0], c[1], k, shadow(0, 2, 30, 6) + P("M-26,-24 C-26,-40 -14,-46 0,-46 C14,-46 26,-40 26,-24 Z", "url(#mx-wood)") +
        R(-26, -24, 52, 26, 3, "url(#mx-wood)") + R(-28, -26, 56, 5, 2, "url(#mx-gold)") + R(-5, -22, 10, 12, 2, "url(#mx-gold)") + R(-18, -24, 4, 26, 1, "url(#mx-gold)") + R(14, -24, 4, 26, 1, "url(#mx-gold)"))), "shine");
      h += reveal("chestOpen", at(c[0], c[1], k, shadow(0, 2, 30, 6) + P("M-26,-26 L-24,-52 C-22,-60 22,-60 24,-52 L26,-26 Z", "url(#mx-wood)") +
        E(0, -26, 24, 7, "#FFD24D") + [[-14, -28], [-5, -31], [5, -30], [14, -27], [0, -34]].map(function (p) { return C(p[0], p[1], 4.4, "url(#mx-gold)"); }).join("") +
        P("M-12,-34 l4,-6 4,6 -4,4z", "#63C7FF") + P("M8,-36 l4,-6 4,6 -4,4z", "#FF6B8A") + C(-2, -40, 3, "#38C172") +
        R(-26, -26, 52, 28, 3, "url(#mx-wood)") + R(-28, -28, 56, 5, 2, "url(#mx-gold)") + R(-5, -22, 10, 12, 2, "url(#mx-gold)") +
        R(-18, -26, 4, 28, 1, "url(#mx-gold)") + R(14, -26, 4, 28, 1, "url(#mx-gold)")) + sparkles(c[0], c[1] - 100, 1.6, 9, dw), "st-pop");
      h += hotG("door", propG("doorStone", at(d[0], d[1], 1, stoneDoor(dw, dh))), "nope");
      return h + anchors(lay, ["momo", "chestAt"]);
    }
  });
})(window);
