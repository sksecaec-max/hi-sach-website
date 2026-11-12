/* =========================================================================
   worldArt.js — Kido World illustration kit
   One art direction for every destination ("storybook diorama"): light from
   the upper-left, soft gradient shading on every form, cast shadows falling
   to the lower-right, hazier/cooler colours for distant layers. The map and
   all seven destinations share the same palette, gradients and drawing
   helpers so Jungle, Ocean, Space… read as one universe.

   All vector (no downloads, file:// safe). Nothing is built up front: the map
   draws only its landmark vignettes, and a destination's full scene is built
   the first time the child travels there, then cached as a string.

   Geometry contract with world.js:
     - every tappable place / spot is a <g data-place|data-spot="key"> with NO
       transform of its own, so getBBox() returns design coordinates;
     - hidden discoveries are <g data-disc="kind"> (world.js toggles .is-on);
     - animated parts carry kw-* classes and never carry a transform attribute
       (a CSS transform would override it).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  /* ---------------- SVG micro-helpers ---------------- */
  function n(v) { return Math.round(v * 10) / 10; }
  function tr(x, y, s, rot, flip) {
    var t = "translate(" + n(x) + " " + n(y) + ")";
    if (rot) t += " rotate(" + rot + ")";
    if (flip) t += " scale(" + (-(s || 1)) + " " + (s || 1) + ")";
    else if (s != null && s !== 1) t += " scale(" + s + ")";
    return t;
  }
  function g(inner, t, cls, attrs) {
    return "<g" + (t ? ' transform="' + t + '"' : "") + (cls ? ' class="' + cls + '"' : "") + (attrs || "") + ">" + inner + "</g>";
  }
  function at(x, y, s, inner, rot, flip) { return g(inner, tr(x, y, s, rot, flip)); }
  function anim(cls, inner, style) { return g(inner, "", cls, style ? ' style="' + style + '"' : ""); }
  function st(list) {
    return list.map(function (s) {
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : "") + "/>";
    }).join("");
  }
  function lg(id, x1, y1, x2, y2, list, user) {
    return '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' +
      (user ? ' gradientUnits="userSpaceOnUse"' : "") + ">" + st(list) + "</linearGradient>";
  }
  function rg(id, cx, cy, r, list, user) {
    return '<radialGradient id="' + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '"' +
      (user ? ' gradientUnits="userSpaceOnUse"' : "") + ">" + st(list) + "</radialGradient>";
  }
  function E(cx, cy, rx, ry, fill, x) { return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + fill + '"' + (x || "") + "/>"; }
  function C(cx, cy, r, fill, x) { return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" fill="' + fill + '"' + (x || "") + "/>"; }
  function R(x, y, w, h, rx, fill, xx) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" rx="' + rx + '" fill="' + fill + '"' + (xx || "") + "/>"; }
  function P(d, fill, x) { return '<path d="' + d + '" fill="' + fill + '"' + (x || "") + "/>"; }
  function L(d, stroke, w, x) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (x || "") + "/>"; }
  function op(o) { return ' opacity="' + o + '"'; }
  function T(x, y, s, fill, size, x2) {
    return '<text x="' + n(x) + '" y="' + n(y) + '" text-anchor="middle" font-family="Baloo 2, Fredoka, Trebuchet MS, sans-serif" font-weight="800" font-size="' + size + '" fill="' + fill + '"' + (x2 || "") + ">" + s + "</text>";
  }
  function big(x, y, w, h, fill) { return R(x, y, w, h, 0, fill); }
  function delay(s) { return "animation-delay:" + s + "s"; }

  /* ---------------- shared gradient library (bounding-box units) ---------------- */
  var DEFS = [
    rg("kw-shadow", .5, .5, .5, [[0, "#23304A", .30], [1, "#23304A", 0]]),
    lg("kw-leaf", 0, 0, .8, 1, [[0, "#BDEE89"], [.45, "#66BF67"], [1, "#2E8451"]]),
    lg("kw-leaf-d", 0, 0, .8, 1, [[0, "#80CD79"], [.5, "#3A9A5E"], [1, "#1D6546"]]),
    lg("kw-jleaf", 0, 0, .8, 1, [[0, "#8FE283"], [.5, "#2F9C5C"], [1, "#136142"]]),
    lg("kw-jdeep", 0, 0, .7, 1, [[0, "#44A26E"], [.6, "#1B6A48"], [1, "#0D4231"]]),
    lg("kw-bloss", 0, 0, .8, 1, [[0, "#FFE6F0"], [.5, "#FFA9C8"], [1, "#DE6E9B"]]),
    lg("kw-bloss-d", 0, 0, .8, 1, [[0, "#FFB8D2"], [1, "#C8578A"]]),
    lg("kw-trunk", 0, 0, 1, 0, [[0, "#CB9A6C"], [.55, "#8D5A34"], [1, "#643A1F"]]),
    lg("kw-rock", 0, 0, .8, 1, [[0, "#F6F2FB"], [.5, "#C4BAD9"], [1, "#8479A6"]]),
    lg("kw-rockw", 0, 0, .8, 1, [[0, "#F7E3C2"], [.5, "#D2AE7C"], [1, "#98714A"]]),
    lg("kw-stone", 0, 0, .9, 1, [[0, "#FFFDF7"], [.55, "#ECE2F2"], [1, "#C8B8DB"]]),
    lg("kw-sand", 0, 0, 0, 1, [[0, "#FFF3D5"], [1, "#EDC98B"]]),
    lg("kw-water", 0, 0, 0, 1, [[0, "#AEF0FA"], [.45, "#48BEE4"], [1, "#1F86C6"]]),
    lg("kw-sea", 0, 0, 0, 1, [[0, "#86E5F2"], [.5, "#3BB6E0"], [1, "#1E86C4"]]),
    lg("kw-wall", 0, 0, .6, 1, [[0, "#FFFCF3"], [1, "#EEDCBC"]]),
    lg("kw-wall-s", 0, 0, 1, 1, [[0, "#E6CCA6"], [1, "#C4A27A"]]),
    lg("kw-roof", 0, 0, .7, 1, [[0, "#FFAA72"], [.6, "#E0683A"], [1, "#B94A25"]]),
    lg("kw-roof-b", 0, 0, .7, 1, [[0, "#A2C0FF"], [.6, "#5E80DE"], [1, "#4262BF"]]),
    lg("kw-roof-v", 0, 0, .7, 1, [[0, "#CBB4FF"], [.6, "#8062E4"], [1, "#5B3DC0"]]),
    lg("kw-wood", 0, 0, 0, 1, [[0, "#D9A36C"], [1, "#9A6036"]]),
    lg("kw-wood-h", 0, 0, 1, 0, [[0, "#D9A36C"], [1, "#94592F"]]),
    lg("kw-gold", 0, 0, .8, 1, [[0, "#FFF2AE"], [.5, "#FFC247"], [1, "#D9871D"]]),
    lg("kw-metal", 0, 0, .8, 1, [[0, "#FFFFFF"], [.5, "#DDE5F5"], [1, "#A4B3D2"]]),
    lg("kw-labwall", 0, 0, 1, 0, [[0, "#FFFFFF"], [.6, "#E5EBFA"], [1, "#BAC7E6"]]),
    lg("kw-glass", 0, 0, .6, 1, [[0, "#F1FDFF", .92], [1, "#86D7EE", .62]]),
    lg("kw-panel", 0, 0, 1, 1, [[0, "#8FB2FF"], [1, "#3A5AD0"]]),
    lg("kw-planet", 0, 0, 1, 1, [[0, "#FFD3AD"], [.5, "#FF8FA3"], [1, "#B8558A"]]),
    lg("kw-planet2", 0, 0, 1, 1, [[0, "#B8F3FF"], [.5, "#5FB8F5"], [1, "#3E5FC9"]]),
    lg("kw-meadow", 0, 0, 0, 1, [[0, "#D4F4A8"], [1, "#92D27B"]]),
    lg("kw-hill", 0, 0, 0, 1, [[0, "#C6EFA0"], [1, "#86C874"]]),
    lg("kw-jground", 0, 0, 0, 1, [[0, "#7FC46A"], [1, "#3E8A4E"]]),
    lg("kw-jcave", 0, 0, 0, 1, [[0, "#1E5A3E"], [1, "#0B3324"]]),
    lg("kw-lion", 0, 0, .7, 1, [[0, "#FAD99A"], [.55, "#E3A955"], [1, "#B8792F"]]),
    lg("kw-mane", 0, 0, .7, 1, [[0, "#D98A45"], [.6, "#A65A26"], [1, "#6E3A18"]]),
    lg("kw-ele", 0, 0, .8, 1, [[0, "#E4E8F2"], [.55, "#AEB6CB"], [1, "#7D86A0"]]),
    lg("kw-duck", 0, 0, .7, 1, [[0, "#FFFFFF"], [1, "#E8E0CF"]]),
    lg("kw-chick", 0, 0, .7, 1, [[0, "#FFF1A6"], [1, "#F4C430"]]),
    lg("kw-red", 0, 0, .7, 1, [[0, "#FF8A6E"], [.5, "#E8413C"], [1, "#B52A2A"]]),
    lg("kw-screen", 0, 0, 1, 1, [[0, "#6D5CFF"], [1, "#2A2A7A"]]),
    lg("kw-book", 0, 0, 1, 0, [[0, "#FFFDF4"], [1, "#F1E3C4"]]),
    rg("kw-glow", .5, .5, .5, [[0, "#FFF6C9", 1], [.45, "#FFD66B", .6], [1, "#FFC247", 0]]),
    rg("kw-softglow", .5, .5, .5, [[0, "#FFFFFF", .75], [1, "#FFFFFF", 0]]),
    rg("kw-portal", .5, .5, .5, [[0, "#3B37B8"], [.55, "#5B4EE0"], [.82, "#8D8CFF", .78], [1, "#BFD8FF", 0]]),
    lg("kw-cloud", 0, 0, 0, 1, [[0, "#FFFFFF"], [1, "#E1ECFF"]]),
    // "Not yet" look for locked places: softened and misty, but still inviting.
    '<filter id="kw-locked" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0.5"/>' +
      '<feComponentTransfer><feFuncR type="linear" slope=".78" intercept=".2"/><feFuncG type="linear" slope=".78" intercept=".2"/><feFuncB type="linear" slope=".78" intercept=".24"/></feComponentTransfer></filter>'
  ].join("");

  /* =====================================================================
     ELEMENT LIBRARY — small reusable props, all in the same light
     ===================================================================== */
  function shadow(x, y, rx, ry) { return E(x, y, rx, ry, "url(#kw-shadow)"); }

  function tree(x, y, s, kind) {
    var a = kind === "deep" ? "url(#kw-jdeep)" : kind === "bloss" ? "url(#kw-bloss-d)" : "url(#kw-leaf-d)";
    var b = kind === "deep" ? "url(#kw-jleaf)" : kind === "bloss" ? "url(#kw-bloss)" : "url(#kw-leaf)";
    return at(x, y, s,
      shadow(12, 0, 25, 6) +
      P("M-4.5,0 C-3.5,-12 -3,-24 -2,-34 L3,-34 C4,-24 4.5,-12 5.5,0 Z", "url(#kw-trunk)") +
      L("M1,-24 L10,-35", "#7A4B2A", 2.4) +
      anim("kw-canopy",
        C(10, -46, 17, a) + C(-8, -48, 18, b) + C(2, -62, 17, b) + C(13, -57, 10, a, op(.85)) +
        C(-8, -58, 8, "#FFFFFF", op(.22))));
  }
  function pine(x, y, s) {
    return at(x, y, s,
      shadow(9, 0, 17, 4.5) + R(-2.5, -10, 5, 10, 1, "url(#kw-trunk)") +
      P("M0,-60 L17,-26 L-17,-26 Z", "url(#kw-leaf-d)") + P("M0,-46 L21,-9 L-21,-9 Z", "url(#kw-leaf-d)") +
      P("M0,-60 L-17,-26 L-5,-26 Z", "#D6FFA8", op(.28)) + P("M0,-46 L-21,-9 L-7,-9 Z", "#D6FFA8", op(.24)));
  }
  function bush(x, y, s, kind) {
    var a = kind === "deep" ? "url(#kw-jdeep)" : "url(#kw-leaf-d)";
    var b = kind === "deep" ? "url(#kw-jleaf)" : kind === "bloss" ? "url(#kw-bloss)" : "url(#kw-leaf)";
    return at(x, y, s,
      shadow(8, 1, 23, 5) + C(-10, -8, 11, a) + C(11, -8, 11, a) + C(0, -13, 13, b) + C(-12, -9, 8, b) +
      C(-5, -18, 5, "#FFFFFF", op(.22)));
  }
  function flowers(x, y, s, cols) {
    cols = cols || ["#FF7FA8", "#FFD24D", "#FFFFFF", "#B79CFF", "#FF9A5A"];
    var h = "";
    [[-10, 0], [-3, -3], [5, 1], [11, -2], [0, 3]].forEach(function (p, i) {
      h += L("M" + p[0] + "," + (p[1] + 5) + " L" + p[0] + "," + p[1], "#3F9A55", 1.2) +
        C(p[0], p[1], 2.7, cols[i % cols.length]) + C(p[0], p[1], 1, "#FFF3B0");
    });
    return at(x, y, s, h);
  }
  function rock(x, y, s, warm) {
    return at(x, y, s,
      shadow(8, 1, 25, 5) +
      P("M-24,0 C-26,-10 -17,-21 -6,-23 C5,-27 18,-21 22,-12 C25,-6 25,-2 24,0 Z", warm ? "url(#kw-rockw)" : "url(#kw-rock)") +
      P("M-16,-10 C-13,-17 -6,-20 1,-20 C-5,-17 -10,-13 -12,-8 Z", "#FFFFFF", op(.45)));
  }
  function cloud(x, y, s, cls) {
    return at(x, y, s, anim("kw-cloud " + (cls || ""),
      E(2, 7, 34, 8, "#BFD2F2", op(.45)) + C(-20, 0, 13, "url(#kw-cloud)") + C(-3, -8, 17, "url(#kw-cloud)") +
      C(16, -2, 13, "url(#kw-cloud)") + C(28, 3, 9, "url(#kw-cloud)") + E(2, 5, 32, 9, "url(#kw-cloud)")));
  }
  function birds(x, y, s, cls) {
    return at(x, y, s, anim("kw-birds " + (cls || ""),
      L("M-7,0 Q-3.5,-4 0,0 Q3.5,-4 7,0", "#4A4870", 1.5) +
      L("M9,-9 Q11.5,-12 14,-9 Q16.5,-12 19,-9", "#4A4870", 1.2) +
      L("M-18,-7 Q-15.5,-10 -13,-7 Q-10.5,-10 -8,-7", "#4A4870", 1.2)));
  }
  function butterfly(x, y, s, c, cls) {
    return at(x, y, s, anim("kw-bfly " + (cls || ""),
      anim("kw-wings",
        E(-4.5, -2, 4.6, 3.4, c) + E(-3.5, 2.6, 3, 2.3, c, op(.85)) +
        E(4.5, -2, 4.6, 3.4, c) + E(3.5, 2.6, 3, 2.3, c, op(.85))) +
      R(-.7, -4, 1.4, 8, .7, "#3B2A4A")));
  }
  function fence(x, y, s) {
    var h = "";
    for (var i = 0; i < 4; i++) h += R(i * 10 - 1.5, -12, 3, 12, 1, "url(#kw-wood)");
    return at(x, y, s, h + R(-3, -9, 36, 2.4, 1, "url(#kw-wood)") + R(-3, -4.5, 36, 2.4, 1, "url(#kw-wood)"));
  }
  function bigLeaf(x, y, s, rot, fill) {
    return at(x, y, s,
      P("M0,0 C-10,-18 -6,-42 12,-52 C24,-38 22,-14 0,0 Z", fill || "url(#kw-jleaf)") +
      L("M0,0 C4,-18 8,-34 12,-52", "#1F6A42", 1.3, op(.7)), rot);
  }
  function palm(x, y, s, flip) {
    function frond(r, l, f) {
      return P("M0,0 C" + n(l * .3) + "," + n(-l * .3) + " " + n(l * .75) + "," + n(-l * .22) + " " + l + "," + n(l * .14) +
        " C" + n(l * .7) + "," + n(-l * .05) + " " + n(l * .3) + "," + n(-l * .06) + " 0,3 Z", f, ' transform="rotate(' + r + ')"');
    }
    var crown = frond(200, 30, "url(#kw-jdeep)") + frond(-20, 30, "url(#kw-jdeep)") +
      frond(-160, 35, "url(#kw-jleaf)") + frond(-15, 36, "url(#kw-jleaf)") +
      frond(-120, 31, "url(#kw-leaf)") + frond(-62, 31, "url(#kw-leaf)") + C(0, 2, 3.6, "#8D5A34");
    return g(
      shadow(12, 0, 19, 4.5) +
      P("M-3,0 C-2,-20 1,-40 7,-60 L11,-59 C6,-40 4,-20 4,0 Z", "url(#kw-trunk)") +
      L("M-2,-12 L3,-12 M-1,-24 L4,-24 M1,-36 L6,-36 M3,-48 L8,-48", "#6E4526", 1, op(.5)) +
      g(anim("kw-crown", crown), "translate(9 -60)"),
      tr(x, y, s, 0, flip));
  }
  function stars(list, cls) {
    return list.map(function (p, i) {
      return anim(cls || "kw-tw", C(p[0], p[1], p[2] || 1.4, p[3] || "#FFFFFF"), delay((i * .37) % 2.6));
    }).join("");
  }
  function sparkle(x, y, s, c) {
    return at(x, y, s, P("M0,-8 C1,-2 2,-1 8,0 C2,1 1,2 0,8 C-1,2 -2,1 -8,0 C-2,-1 -1,-2 0,-8 Z", c || "#FFFFFF"));
  }

  /* ---- buildings & props ---- */
  function house(x, y, s, roof, opts) {
    opts = opts || {};
    var h =
      shadow(22, 1, 42, 8) +
      P("M20,0 L20,-30 L48,-38 L48,-7 Z", "url(#kw-wall-s)") +
      P("M-20,0 L-20,-30 L0,-49 L20,-30 L20,0 Z", "url(#kw-wall)") +
      P("M0,-52 L27,-60 L53,-37 L24,-28 Z", "url(#" + roof + ")") +
      L("M-24,-27 L0,-51 L24,-28", "url(#" + roof + ")", 5) +
      L("M-23,-27 L0,-50", "#FFFFFF", 1.2, op(.4)) + L("M2,-52 L27,-60", "#FFFFFF", 1.4, op(.45)) +
      P("M-6,0 L-6,-14 C-6,-19 6,-19 6,-14 L6,0 Z", "url(#kw-wood)") + C(3.5, -7, .9, "#FFE08A") +
      C(0, -34, 5.6, "#8B5A33") + C(0, -34, 4.3, "url(#kw-glow)") + L("M0,-38 L0,-30 M-4,-34 L4,-34", "#8B5A33", .9) +
      P("M28,-24 L38,-27 L38,-17 L28,-14 Z", "#8B5A33") + P("M29.2,-23 L36.8,-25.3 L36.8,-18 L29.2,-15.6 Z", "#FFE7A3") +
      R(-8, -1.6, 16, 3.2, 1.2, "#D8C2A0");
    if (opts.chimney) {
      h += R(33, -66, 8, 18, 1, "#B9694A") + R(32, -68, 10, 3.2, 1, "#8E4A33") +
        anim("kw-smoke", C(37, -74, 3.2, "#FFFFFF", op(.75)) + C(40, -81, 4.2, "#FFFFFF", op(.6)) + C(36, -90, 5.2, "#FFFFFF", op(.45)));
    }
    return at(x, y, s, h);
  }
  function noticeBoard(x, y, s) {
    return at(x, y, s,
      shadow(7, 1, 19, 4) +
      R(-13, -26, 3, 26, 1, "url(#kw-trunk)") + R(10, -26, 3, 26, 1, "url(#kw-trunk)") +
      R(-17, -33, 34, 20, 2.5, "url(#kw-wood)") + R(-15, -31, 30, 16, 1.5, "#F3D9AE") +
      R(-13, -29.5, 9, 7, .8, "#FFFFFF", ' transform="rotate(-6 -8.5 -26)"') +
      R(-2, -30, 8, 9, .8, "#FFD166", ' transform="rotate(4 2 -25.5)"') +
      R(7, -28.5, 6, 8, .8, "#9ED8FF", ' transform="rotate(-3 10 -24.5)"') +
      C(-8.5, -29, .9, "#E0457B") + C(2, -29.4, .9, "#6C4BD6") + C(10, -28, .9, "#E0457B") +
      P("M-20,-33 L0,-41 L20,-33 Z", "url(#kw-roof)"));
  }
  function flask(x, y, s, c) {
    return at(x, y, s,
      P("M-2.2,-13 L2.2,-13 L2.2,-7.5 L7.5,0 L-7.5,0 L-2.2,-7.5 Z", "#FFFFFF", op(.9)) +
      P("M-4.9,-3.6 L4.9,-3.6 L7.5,0 L-7.5,0 Z", c) + R(-2.9, -14.6, 5.8, 2, .8, "#C9D3EE") +
      anim("kw-fizz", C(-1.5, -5.5, .9, "#FFFFFF", op(.8)) + C(1.4, -8, .7, "#FFFFFF", op(.7))));
  }
  function robot(x, y, s) {
    return at(x, y, s,
      shadow(4, 1, 13, 3) +
      R(-7, -4, 5, 4, 1.5, "#8B97BA") + R(2, -4, 5, 4, 1.5, "#8B97BA") +
      R(-10, -20, 20, 17, 6, "url(#kw-metal)") + C(0, -12, 3, "#63C7FF") +
      anim("kw-d-head",
        R(-12, -37, 24, 17, 7, "url(#kw-metal)") + R(-9, -33, 18, 9, 4, "#2B3A66") +
        anim("kw-eyes", C(-4, -28.5, 2, "#7FF0FF") + C(4, -28.5, 2, "#7FF0FF")) +
        L("M0,-37 L0,-43", "#9FAECB", 1.4) + C(0, -44, 2, "#FFB020", ' class="kw-blink"')) +
      anim("kw-arm", R(10, -19, 4, 11, 2, "#A4B3D2")) + R(-14, -19, 4, 11, 2, "#A4B3D2"));
  }
  function rocketMini(x, y, s) {
    return at(x, y, s,
      shadow(5, 1, 14, 3.5) + R(-12, -3, 24, 4, 2, "#9FAECB") +
      P("M-7,-4 L-7,-36 C-7,-46 0,-54 0,-54 C0,-54 7,-46 7,-36 L7,-4 Z", "url(#kw-metal)") +
      P("M-7,-36 C-7,-46 0,-54 0,-54 C0,-54 7,-46 7,-36 Z", "#E8503A") +
      C(0, -25, 3.6, "#3A4A86") + C(0, -25, 2.5, "#7FDDFF") +
      P("M-7,-15 L-13,-3 L-7,-6 Z", "#E8503A") + P("M7,-15 L13,-3 L7,-6 Z", "#C23E2B"));
  }
  function lighthouse(x, y, s) {
    return at(x, y, s,
      anim("kw-beam", P("M0,-67 L-64,-84 L-64,-52 Z", "#FFF3B0", op(.32))) +
      rock(0, 3, .75) +
      P("M-10,0 L-6.5,-58 L6.5,-58 L10,0 Z", "url(#kw-metal)") +
      P("M-8.9,-15 L-8.1,-27 L8.1,-27 L8.9,-15 Z", "#E8503A") + P("M-7.5,-39 L-6.9,-50 L6.9,-50 L7.5,-39 Z", "#E8503A") +
      P("M2,0 L2,-58 L6.5,-58 L10,0 Z", "#23304A", op(.09)) +
      R(-9.5, -62, 19, 4, 1.5, "#3A3F66") + R(-6, -72, 12, 10, 2, "url(#kw-glass)") +
      C(0, -67, 3.4, "#FFE27A", ' class="kw-lamp"') + P("M-8,-72 L0,-80 L8,-72 Z", "#E8503A") +
      R(-3, -12, 6, 12, 3, "#3A3F66"));
  }
  function boat(x, y, s) {
    return at(x, y, s, anim("kw-bob",
      E(2, 4, 22, 3.2, "#1F6FA8", op(.3)) +
      P("M-19,-4 L19,-4 L14,4 L-14,4 Z", "url(#kw-red)") + R(-18, -5.8, 36, 2.4, 1, "#FFFFFF") +
      L("M0,-5 L0,-35", "#8D5A34", 1.5) +
      P("M1.5,-34 L17,-8 L1.5,-8 Z", "#FFFFFF") + P("M-1.5,-31 L-13,-8 L-1.5,-8 Z", "#FFEFE2") +
      P("M1.5,-19 L10.5,-8 L1.5,-8 Z", "#FF8FA3", op(.55)) + P("M0,-35 L8,-33 L0,-31 Z", "#FFB020")));
  }
  function jigsaw(x, y, s, fill) {
    // Upright jigsaw-piece monolith (knob on top + right, notch on the left).
    return at(x, y, s,
      P("M-16,0 L-16,-22 C-22,-20 -25,-26 -21,-30 C-18,-33 -16,-31 -16,-30 L-16,-52 L-6,-52 C-9,-58 -6,-64 0,-64 " +
        "C6,-64 9,-58 6,-52 L16,-52 L16,-34 C21,-37 26,-34 26,-28 C26,-22 21,-19 16,-22 L16,0 Z", fill || "url(#kw-gold)") +
      P("M3,-52 L16,-52 L16,-34 C21,-37 26,-34 26,-28 C26,-22 21,-19 16,-22 L16,0 L3,0 Z", "#8A4B12", op(.16)) +
      L("M-12,-48 L-12,-6", "#FFFFFF", 1.4, op(.5)) + sparkle(0, -30, .8, "#FFFFFF"));
  }
  function chest(x, y, s) {
    return at(x, y, s,
      shadow(8, 2, 30, 6) +
      C(0, -26, 26, "url(#kw-glow)", ' class="kw-pulse"') +
      R(-24, -22, 48, 22, 3, "url(#kw-wood)") + R(20, -22, 4, 22, 1, "#6E3F1E", op(.35)) +
      P("M-24,-22 C-24,-34 -14,-40 0,-40 C14,-40 24,-34 24,-22 Z", "url(#kw-wood)", ' transform="rotate(-14 -24 -22)"') +
      R(-26, -23, 52, 4, 1.5, "url(#kw-gold)") + R(-4, -26, 8, 11, 2, "url(#kw-gold)") + C(0, -18, 1.4, "#6E3F1E") +
      R(-19, -22, 3, 22, 1, "url(#kw-gold)") + R(16, -22, 3, 22, 1, "url(#kw-gold)") +
      C(-9, -24, 3.4, "#FF6B8A") + C(-2, -26, 3, "#63C7FF") + C(6, -24.5, 3.2, "#38C172") + sparkle(12, -33, .6));
  }
  function monkey() {
    return E(0, -8, 9, 8, "#8C5A36") + C(0, -18, 8, "#8C5A36") + E(0, -16, 5.5, 4.5, "#F2D2A6") +
      C(-8, -19, 3.2, "#8C5A36") + C(8, -19, 3.2, "#8C5A36") + C(-8, -19, 1.8, "#F2D2A6") + C(8, -19, 1.8, "#F2D2A6") +
      C(-2.4, -19.5, 1.2, "#2B2151") + C(2.4, -19.5, 1.2, "#2B2151") + L("M-2,-14.5 Q0,-13 2,-14.5", "#6E3F1E", .8);
  }
  function bunny() {
    return E(0, -7, 8, 7, "#F4EEF0") + C(0, -16, 6.5, "#FAF6F7") +
      E(-3, -27, 2.2, 7, "#FAF6F7") + E(3, -27, 2.2, 7, "#FAF6F7") + E(-3, -27, 1, 5, "#FFC2D4") + E(3, -27, 1, 5, "#FFC2D4") +
      C(-2.4, -17, 1.1, "#2B2151") + C(2.4, -17, 1.1, "#2B2151") + C(0, -14.4, 1.1, "#FF8FA3");
  }
  function frog() {
    return E(0, -6, 10, 6.5, "#5CC46E") + C(-5, -12, 3.6, "#5CC46E") + C(5, -12, 3.6, "#5CC46E") +
      C(-5, -12.4, 2, "#FFFFFF") + C(5, -12.4, 2, "#FFFFFF") + C(-5, -12.4, 1, "#2B2151") + C(5, -12.4, 1, "#2B2151") +
      L("M-4,-4 Q0,-2 4,-4", "#2E7A45", .9);
  }
  function crab() {
    return E(0, -5, 10, 6, "url(#kw-red)") + L("M-9,-4 L-15,-9 M9,-4 L15,-9 M-7,-1 L-12,2 M7,-1 L12,2", "#C23E2B", 1.6) +
      C(-15, -10, 2.6, "#E8413C") + C(15, -10, 2.6, "#E8413C") +
      L("M-3,-10 L-3,-14 M3,-10 L3,-14", "#C23E2B", 1) + C(-3, -14.5, 1.3, "#2B2151") + C(3, -14.5, 1.3, "#2B2151");
  }
  function fish(c, s) {
    return g(E(0, 0, 9, 5, c) + P("M7,0 L14,-5 L14,5 Z", c) + C(-4.5, -1, 1.2, "#FFFFFF") + C(-4.5, -1, .6, "#2B2151") +
      L("M-1,-4 Q1,0 -1,4", "#FFFFFF", .8, op(.6)), s ? "scale(" + s + ")" : "");
  }
  function birdSmall(c) {
    return E(0, -4, 6, 4.2, c) + C(-5, -7, 3.4, c) + P("M-8.5,-7.5 L-12,-6.4 L-8.5,-5.6 Z", "#FFB020") +
      C(-5.8, -7.8, .8, "#2B2151") + P("M1,-6 L8,-10 L5,-3 Z", c, op(.85)) + P("M5,-3 L11,-1 L5,-1 Z", c);
  }
  function macaw(x, y, s) {
    return at(x, y, s,
      P("M2,-4 C4,10 8,22 10,34 L6,34 C4,24 0,12 -2,0 Z", "#2F6FD6") + P("M4,6 C6,16 9,26 12,34 L9,34 C7,26 4,16 2,8 Z", "#E8413C") +
      E(0, -12, 9, 12, "url(#kw-red)") +
      P("M-2,-18 C6,-18 11,-10 10,2 C6,0 2,-4 -1,-10 Z", "#FFC43D") + P("M2,-8 C8,-6 11,0 10,6 C6,4 3,0 1,-4 Z", "#2F6FD6") +
      C(-2, -25, 7, "url(#kw-red)") + E(-5, -25, 3.6, 3.2, "#FFF3E8") + C(-5, -25.5, 1.3, "#2B2151") +
      P("M-8,-27 C-14,-27 -15,-20 -11,-17 C-11,-21 -10,-23 -7,-23 Z", "#F4EDE2") + P("M-10,-19 C-11,-17 -9,-16 -8,-18 Z", "#3A3A4A") +
      L("M-4,0 L-4,4 M1,0 L1,4", "#4A4458", 1.4));
  }

  /* =====================================================================
     MAP LANDMARKS (local coords, base centre = 0,0)
     ===================================================================== */
  var LM = {
    village: function () {
      return shadow(6, 8, 96, 22) + E(0, 0, 90, 25, "url(#kw-meadow)") + E(-12, -6, 62, 12, "#FFFFFF", op(.16)) +
        tree(-70, -8, .95, "bloss") + tree(66, -14, .78) + bush(-44, -10, .6) +
        E(-4, 10, 32, 7, "url(#kw-sand)") +
        house(-26, 2, 1.05, "kw-roof", { chimney: true }) + house(32, -6, .7, "kw-roof-b") +
        g(E(50, 15, 21, 6.5, "url(#kw-sand)") + E(50, 14.5, 18, 5.2, "url(#kw-water)") + E(46, 13, 7, 1.4, "#FFFFFF", op(.6))) +
        noticeBoard(-66, 17, .85) + flowers(-40, 19, .9) + flowers(14, 21, .8) + fence(64, 21, .75);
    },
    jungle: function () {
      var h = shadow(8, 8, 96, 22) + E(0, 2, 90, 23, "url(#kw-jground)");
      h += C(-72, -58, 26, "url(#kw-jdeep)") + C(76, -56, 26, "url(#kw-jdeep)") +
        C(-46, -92, 38, "url(#kw-jdeep)") + C(4, -112, 44, "url(#kw-jdeep)") + C(52, -90, 36, "url(#kw-jdeep)");
      h += P("M-24,2 L-22,-56 C-16,-84 16,-84 22,-56 L24,2 Z", "url(#kw-jcave)") + E(2, -6, 14, 4, "#C8F59A", op(.35));
      h += P("M-40,2 C-36,-30 -32,-62 -30,-98 L-20,-98 C-22,-62 -26,-30 -26,2 Z", "url(#kw-trunk)");
      h += P("M26,2 C24,-30 22,-62 20,-102 L30,-102 C32,-62 36,-30 40,2 Z", "url(#kw-trunk)");
      h += anim("kw-canopy",
        C(-50, -86, 30, "url(#kw-jleaf)") + C(-14, -104, 32, "url(#kw-jleaf)") + C(28, -102, 32, "url(#kw-jleaf)") +
        C(58, -78, 28, "url(#kw-jleaf)") + C(-26, -114, 13, "#E8FFC0", op(.2)));
      h += anim("kw-vine", L("M-17,-76 C-19,-60 -13,-48 -15,-32", "#2E7A45", 2.2) + E(-18, -60, 3, 1.6, "#5CC46E") + E(-13, -46, 3, 1.6, "#5CC46E"));
      h += anim("kw-vine kw-vine--b", L("M10,-82 C12,-66 6,-56 9,-42", "#2E7A45", 2.2) + E(12, -64, 3, 1.6, "#5CC46E"));
      h += P("M46,6 C42,-12 44,-34 52,-46 C60,-54 72,-48 75,-32 C78,-14 76,-2 74,6 Z", "url(#kw-rockw)") +
        P("M50,-30 C52,-40 56,-46 62,-48 C58,-42 56,-36 55,-28 Z", "#FFFFFF", op(.4)) + E(62, -47, 12, 4, "#5CC46E") +
        anim("kw-fall", R(55, -44, 6, 50, 3, "#DDF8FF", op(.92))) +
        E(58, 8, 20, 5, "url(#kw-water)") + E(58, 5, 9, 2, "#FFFFFF", op(.7));
      h += macaw(-6, -66, .5);
      h += bigLeaf(-70, 8, 1, -34) + bigLeaf(-58, 10, .8, 8) + bigLeaf(82, 10, .85, 36, "url(#kw-jdeep)") +
        palm(-84, 6, .75) + C(-36, -30, 3.2, "#FF7B54") + C(-40, -36, 2.6, "#FFB5D0") + C(40, -46, 3, "#FF7B54");
      h += anim("kw-rays", P("M-62,-150 L-34,-150 L18,0 L-6,0 Z", "#FFF6C9", op(.16)) + P("M-22,-150 L-4,-150 L40,-12 L26,-12 Z", "#FFF6C9", op(.11)));
      return h;
    },
    puzzle: function () {
      return E(0, 12, 94, 26, "#7FE0EC", op(.5)) +
        R(-7, 10, 14, 30, 2, "url(#kw-wood)") + L("M-7,17 L7,17 M-7,24 L7,24 M-7,31 L7,31", "#8A5530", .9, op(.6)) +
        P("M-66,-8 C-64,4 -52,14 -30,18 C-6,22 20,22 40,17 C56,13 64,4 66,-8 Z", "url(#kw-rock)") +
        L("M-54,2 C-30,10 20,11 52,3", "#8E83AE", 1.2, op(.6)) +
        E(0, -10, 67, 17, "url(#kw-leaf)") + E(-18, -15, 40, 7, "#FFFFFF", op(.16)) +
        anim("kw-fall", P("M44,-5 C46,4 46,12 47,24 L53,24 C52,12 52,4 51,-5 Z", "#DDF8FF", op(.92))) + E(50, 24, 10, 3, "#FFFFFF", op(.7)) +
        E(-46, -8, 7, 3, "#FF8FA3") + E(-32, -12, 7, 3, "#8FD3FF") + E(-18, -9, 7, 3, "#FFD166") +
        C(2, -40, 36, "url(#kw-glow)", ' class="kw-pulse"') +
        jigsaw(2, -12, .92) +
        chest(36, -12, .42) + palm(54, -10, .6) +
        L("M-50,-16 L-50,-46", "#8D5A34", 1.6) + anim("kw-flag", P("M-50,-46 L-33,-41 L-50,-36 Z", "#FF6B8A"));
    },
    castle: function () {
      var h = shadow(8, 4, 100, 20) + P("M-104,6 C-72,-36 72,-36 104,6 Z", "url(#kw-hill)") + E(-34, -18, 40, 8, "#FFFFFF", op(.16)) +
        P("M-7,6 C-5,-4 -4,-10 -7,-16 L7,-16 C6,-10 7,-4 13,6 Z", "url(#kw-sand)");
      h += R(-18, -122, 36, 72, 2, "url(#kw-stone)") + R(4, -122, 14, 72, 0, "#5B3DC0", op(.1)) +
        P("M-23,-122 L0,-158 L23,-122 Z", "url(#kw-roof-b)") +
        L("M0,-158 L0,-172", "#6E5A8C", 1.4) + anim("kw-flag", P("M0,-172 L14,-168 L0,-164 Z", "#FFB020")) +
        P("M-3.5,-98 L-3.5,-104 C-3.5,-108 3.5,-108 3.5,-104 L3.5,-98 Z", "#FFD98A", ' class="kw-win"');
      var cren = "";
      for (var i = 0; i < 8; i++) cren += R(-50 + i * 13, -64, 7, 7, 1, "url(#kw-stone)");
      h += cren + R(-50, -58, 100, 42, 2, "url(#kw-stone)") + R(20, -58, 30, 42, 0, "#5B3DC0", op(.08)) +
        P("M-11,-16 L-11,-36 C-11,-46 11,-46 11,-36 L11,-16 Z", "#7A4A2E") + L("M-4,-16 L-4,-42 M4,-16 L4,-42", "#5A3420", 1, op(.6)) +
        P("M-34,-54 L-24,-54 L-24,-36 L-29,-40 L-34,-36 Z", "#E0457B") + P("M24,-54 L34,-54 L34,-36 L29,-40 L24,-36 Z", "#E0457B");
      [[-66, "kw-roof-v"], [38, "kw-roof-v"]].forEach(function (t, k) {
        var x0 = t[0];
        h += R(x0, -94, 28, 78, 3, "url(#kw-stone)") + R(x0 + 16, -94, 12, 78, 0, "#5B3DC0", op(.1)) +
          P("M" + (x0 - 5) + ",-94 L" + (x0 + 14) + ",-130 L" + (x0 + 33) + ",-94 Z", "url(#" + t[1] + ")") +
          L("M" + (x0 + 14) + ",-130 L" + (x0 + 14) + ",-141", "#6E5A8C", 1.2) +
          anim("kw-flag", P("M" + (x0 + 14) + ",-141 L" + (x0 + 26) + ",-138 L" + (x0 + 14) + ",-135 Z", k ? "#FF6B8A" : "#63C7FF"), delay(k * .6)) +
          P("M" + (x0 + 10.5) + ",-62 L" + (x0 + 10.5) + ",-68 C" + (x0 + 10.5) + ",-72 " + (x0 + 17.5) + ",-72 " + (x0 + 17.5) + ",-68 L" + (x0 + 17.5) + ",-62 Z", "#FFD98A", ' class="kw-win"');
      });
      h += pine(-90, 2, .7) + pine(-80, 6, .55) + tree(88, 4, .55);
      return h;
    },
    ocean: function () {
      return P("M-98,2 C-82,-14 -40,-18 -6,-12 C20,-8 30,4 22,16 C8,30 -60,32 -98,22 Z", "url(#kw-sea)") +
        anim("kw-wave", L("M-82,4 C-72,0 -62,0 -52,4 M-42,15 C-32,11 -22,11 -12,15", "#FFFFFF", 1.4, op(.7))) +
        E(-50, 17, 6, 2.5, "#FF8FA3", op(.5)) + E(-34, 21, 5, 2, "#FFB870", op(.5)) +
        P("M-10,-14 C18,-27 60,-27 86,-12 C92,-2 88,10 72,14 C52,18 32,14 22,8 C28,-2 14,-12 -10,-14 Z", "url(#kw-sand)") +
        rock(-68, -4, .6) + rock(-56, 3, .45) + lighthouse(42, -2, 1) + boat(-34, 9, .9) + palm(78, -2, .55) +
        C(8, -6, 2.2, "#FFB5D0") + C(60, 6, 1.8, "#FFF3E0");
    },
    lab: function () {
      return shadow(8, 4, 92, 20) + E(0, 0, 86, 21, "url(#kw-meadow)") +
        R(40, -30, 8, 26, 4, "#C9D3EE") + R(28, -26, 16, 4, 2, "#C9D3EE") +
        R(-42, -50, 84, 50, 10, "url(#kw-labwall)") + R(-42, -32, 84, 6, 0, "#8062E4") +
        P("M-38,-50 A38,38 0 0 1 38,-50 Z", "url(#kw-glass)") +
        flask(-16, -51, 1, "#FF6B8A") + flask(3, -51, 1.25, "#38C172") + flask(20, -51, .9, "#FFB020") +
        L("M-31,-62 A31,31 0 0 1 -6,-80", "#FFFFFF", 2.2, op(.7)) +
        L("M0,-88 L0,-50 M-27,-77 L-18,-50 M27,-77 L18,-50", "#AFBDE6", 1, op(.7)) +
        L("M12,-86 L18,-104", "#9FAECB", 1.6) + C(18, -105, 2.8, "#FF6B8A", ' class="kw-blink"') +
        C(-20, -14, 8.5, "#6F7FB0") + C(-20, -14, 6.4, "url(#kw-glow)") +
        R(8, -24, 16, 24, 5, "#5B6FA8") + R(10.5, -21.5, 11, 21.5, 3.5, "#A9C3F5") +
        robot(-64, 3, .8) + rocketMini(66, 3, .72) + flowers(-36, 12, .7);
    },
    space: function () {
      return C(0, 0, 78, "url(#kw-portal)") +
        stars([[-40, -48, 1.6], [-58, -12, 1.2], [-20, -62, 1], [30, -58, 1.5, "#FFE9A8"], [56, -30, 1.1], [60, 18, 1.4],
          [-50, 30, 1.3, "#BDE8FF"], [-24, 50, 1.1], [26, 52, 1.6], [4, -40, 1], [44, 40, 1, "#FFE9A8"]]) +
        C(-40, -30, 12, "url(#kw-planet)") + E(-40, -30, 20, 4.5, "none", ' stroke="#FFD6A5" stroke-width="2" transform="rotate(-18 -40 -30)"') +
        C(46, -34, 5, "#EEF1FF") + C(44.5, -35.5, 1.4, "#D4DAF2") +
        anim("kw-float",
          C(0, 0, 30, "url(#kw-softglow)") +
          R(-76, -6, 29, 12, 1.5, "url(#kw-panel)") + R(47, -6, 29, 12, 1.5, "url(#kw-panel)") +
          L("M-67,-6 L-67,6 M-57,-6 L-57,6 M57,-6 L57,6 M67,-6 L67,6", "#DDE7FF", .8, op(.8)) +
          R(-48, -1.6, 96, 3.2, 1.6, "#C9D3EE") +
          g(E(0, 0, 40, 12, "none", ' stroke="#F4F7FF" stroke-width="6"') + E(0, 0, 40, 12, "none", ' stroke="#AFBDE6" stroke-width="1.6"') +
            L("M-28,-8 L-10,-3 M28,-8 L10,-3 M-26,9 L-10,4 M26,9 L10,4", "#DDE5F5", 1.6), "rotate(-10)") +
          C(0, 0, 15, "url(#kw-metal)") + R(-15, -2, 30, 4, 2, "#8062E4", op(.8)) +
          C(-7, -6, 2.1, "#7FE3FF") + C(0, -8, 2.1, "#7FE3FF") + C(7, -6, 2.1, "#7FE3FF") +
          R(-5, -27, 10, 12, 3, "url(#kw-metal)") + C(0, -29, 2, "#FF6B8A", ' class="kw-blink"') +
          g(P("M18,-20 L30,-26 L34,-21 L22,-15 Z", "url(#kw-metal)") + C(28, -22, 1.4, "#7FE3FF"), ""));
    }
  };
  var PLACE_IDS = ["village", "jungle", "puzzle", "castle", "ocean", "lab", "space"];

  /* =====================================================================
     MAP LAYOUTS  (P = portrait 400×840, L = landscape 1000×600)
     The bottom band (P: y>760, L: y>530 centre) is left as open meadow for
     the Continue button; the top is kept below the floating HUD by world.js.
     ===================================================================== */
  var MAP = {
    P: {
      W: 400, H: 840, hz: 262,
      places: {
        space: [298, 122, .84], castle: [110, 216, .8], jungle: [104, 410, .9], puzzle: [296, 392, .9],
        ocean: [102, 574, .9], lab: [300, 562, .9], village: [202, 704, 1]
      },
      momo: { village: [296, 752], jungle: [204, 534], puzzle: [214, 530], castle: [200, 272], ocean: [196, 640], lab: [232, 628], space: [236, 272] },
      sun: [62, 64],
      clouds: [[176, 52, .9, "kw-cloud--a"], [40, 150, .65, "kw-cloud--b"], [372, 226, .55, "kw-cloud--c"]],
      mountains: [[-500, 272], [-200, 222], [-120, 214], [-40, 236], [20, 196], [78, 238], [150, 200], [214, 244], [262, 206], [330, 236], [392, 196], [470, 236], [560, 210], [900, 272]],
      bands: [
        ["M-500,268 C-60,250 90,262 200,266 S360,252 900,262 L900,1400 L-500,1400 Z", "#C3EAA2"],
        ["M-500,330 C20,300 150,344 262,322 S390,298 900,318 L900,1400 L-500,1400 Z", "#ABDE8B"],
        ["M-500,500 C40,470 190,530 300,494 S410,470 900,490 L900,1400 L-500,1400 Z", "#97D37D"],
        ["M-500,660 C80,636 210,690 320,660 S430,650 900,662 L900,1400 L-500,1400 Z", "#87C872"]
      ],
      sea: "M-500,488 L-20,494 C40,506 58,560 80,610 C104,664 150,690 158,760 L166,1400 L-500,1400 Z",
      lagoon: [296, 394, 104, 44],
      river: "M200,404 C182,428 196,452 162,478 S96,520 44,540",
      paths: [
        "M198,700 C160,650 214,572 176,528 S116,478 116,420",
        "M150,470 C204,432 236,350 196,300 S132,270 116,232",
        "M206,700 C236,640 252,540 250,470 C249,450 252,436 262,428",
        "M214,704 C262,684 292,632 300,572",
        "M192,708 C156,700 140,650 132,598"
      ],
      bridges: [[168, 486, -28]],
      trail: "M350,540 C404,452 400,280 330,186",
      decor: [
        ["tree", 22, 318, .7], ["tree", 178, 322, .5], ["pine", 206, 276, .42], ["pine", 226, 282, .36], ["bush", 372, 310, .8],
        ["tree", 382, 472, .72, "bloss"], ["bush", 30, 468, .75], ["tree", 236, 540, .55], ["rock", 372, 640, .6],
        ["tree", 372, 700, .8], ["bush", 330, 742, .9], ["flowers", 256, 760, 1.1], ["tree", 24, 740, .85], ["flowers", 120, 780, 1],
        ["bush", 270, 800, 1], ["tree", 360, 820, .9], ["tree", -60, 320, .9], ["tree", 460, 360, .9], ["tree", 470, 560, 1, "bloss"],
        ["tree", -80, 420, .8], ["bush", 460, 720, 1], ["tree", 450, 800, 1], ["pine", -90, 250, .6], ["pine", 480, 256, .6]
      ],
      bflies: [[150, 640, "#FFB020", "kw-bfly--a"], [260, 470, "#FF7FA8", "kw-bfly--b"]],
      birds: [[210, 150, .9]]
    },
    L: {
      W: 1000, H: 600, hz: 218,
      places: {
        castle: [500, 200, .82], space: [836, 122, .84], jungle: [176, 292, 1], puzzle: [800, 358, .95],
        village: [410, 428, 1.05], lab: [668, 480, .92], ocean: [166, 500, .95]
      },
      momo: { village: [520, 470], jungle: [284, 336], puzzle: [704, 410], castle: [584, 240], ocean: [280, 524], lab: [578, 512], space: [742, 236] },
      sun: [96, 62],
      clouds: [[300, 70, 1, "kw-cloud--a"], [620, 50, .8, "kw-cloud--b"], [980, 190, .7, "kw-cloud--c"]],
      mountains: [[-500, 228], [-160, 196], [-40, 204], [60, 172], [150, 208], [240, 160], [330, 204], [420, 170], [520, 210], [610, 158], [700, 200], [790, 176], [880, 214], [960, 168], [1100, 206], [1500, 228]],
      bands: [
        ["M-500,224 C160,206 360,222 520,220 S820,206 1500,216 L1500,1400 L-500,1400 Z", "#C3EAA2"],
        ["M-500,300 C150,272 380,316 560,290 S860,270 1500,288 L1500,1400 L-500,1400 Z", "#ABDE8B"],
        ["M-500,420 C140,396 400,448 600,414 S880,392 1500,410 L1500,1400 L-500,1400 Z", "#97D37D"],
        ["M-500,530 C200,508 420,556 640,526 S900,512 1500,524 L1500,1400 L-500,1400 Z", "#87C872"]
      ],
      sea: "M-500,420 L10,428 C70,440 92,500 120,544 C150,590 250,600 290,640 L300,1400 L-500,1400 Z",
      lagoon: [800, 360, 122, 50],
      river: "M918,372 C952,396 978,430 1060,464",
      paths: [
        "M420,440 C360,420 300,360 250,318",
        "M470,420 C500,370 480,300 500,236",
        "M470,436 C560,420 630,400 700,382",
        "M470,452 C540,470 590,484 624,488",
        "M410,448 C340,470 280,500 236,508"
      ],
      bridges: [],
      trail: "M670,454 C760,420 860,330 850,196",
      decor: [
        ["tree", 60, 238, .8], ["pine", 330, 230, .6], ["pine", 350, 236, .5], ["tree", 660, 236, .6], ["bush", 700, 250, .7],
        ["tree", 960, 250, .8, "bloss"], ["tree", 330, 380, .7], ["bush", 560, 350, .8], ["tree", 940, 470, .85], ["rock", 740, 520, .7],
        ["tree", 360, 560, .8], ["flowers", 480, 560, 1.1], ["bush", 700, 570, .9], ["tree", 860, 560, .9, "bloss"], ["flowers", 600, 590, 1],
        ["tree", 1060, 300, 1], ["tree", 1080, 480, 1.1], ["tree", -60, 300, 1], ["pine", 1090, 220, .7], ["pine", -80, 226, .7]
      ],
      bflies: [[380, 520, "#FFB020", "kw-bfly--a"], [640, 330, "#FF7FA8", "kw-bfly--b"]],
      birds: [[420, 120, 1]]
    }
  };

  /* 2026-11-10 (owner): wide screens (phone and tablet held sideways) — the same landscape map stretched 1.6x
     sideways so it fills the left and right, with every place drawn 1.45x bigger. Built from L, so the two never drift. */
  MAP.X = (function (L) {
    var K = 1.92, OFF = -160;   // x -> x*K + OFF: a 1600-wide map whose places reach out to both edges
    function xs(str) { return str.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, function (_, x, y) { return Math.round(x * K + OFF) + "," + y; }); }
    function pt(p) { var q = p.slice(); q[0] = Math.round(q[0] * K + OFF); return q; }
    var M = { W: 1600, H: L.H, hz: L.hz, places: {}, momo: {} };
    Object.keys(L.places).forEach(function (k) { var q = pt(L.places[k]); q[2] = +(q[2] * 1.45).toFixed(2); M.places[k] = q; });
    Object.keys(L.momo).forEach(function (k) { M.momo[k] = pt(L.momo[k]); });
    M.sun = pt(L.sun); M.clouds = L.clouds.map(pt); M.mountains = L.mountains.map(pt);
    M.bands = L.bands.map(function (b) { return [xs(b[0]), b[1]]; });
    M.sea = xs(L.sea); M.river = xs(L.river); M.trail = xs(L.trail); M.paths = L.paths.map(xs);
    M.lagoon = [Math.round(L.lagoon[0] * K + OFF), L.lagoon[1], Math.round(L.lagoon[2] * 1.45), Math.round(L.lagoon[3] * 1.45)];
    M.bridges = L.bridges.map(pt); M.decor = L.decor.map(pt); M.bflies = L.bflies.map(pt); M.birds = L.birds.map(pt);
    return M;
  })(MAP.L);

  function decorItem(d) {
    if (d[0] === "tree") return tree(d[1], d[2], d[3], d[4]);
    if (d[0] === "pine") return pine(d[1], d[2], d[3]);
    if (d[0] === "bush") return bush(d[1], d[2], d[3], d[4]);
    if (d[0] === "rock") return rock(d[1], d[2], d[3]);
    if (d[0] === "flowers") return flowers(d[1], d[2], d[3]);
    return "";
  }
  /* Two mountain ranges: a pale far one, and a nearer one with sunlit left
     facets and snow caps (light from the upper-left, like everything else). */
  function mountains(pts, hz) {
    function path(list, dx, dy) {
      return "M" + list.map(function (p) { return n(p[0] + dx) + "," + n(p[1] + dy); }).join(" L") + " L" + n(list[list.length - 1][0] + dx) + "," + (hz + 80) + " L" + n(list[0][0] + dx) + "," + (hz + 80) + " Z";
    }
    var h = P(path(pts, 46, -22), "#DDE6FA", op(.9)) + P(path(pts, 0, 0), "url(#kw-mtn)");
    for (var i = 1; i < pts.length - 1; i++) {
      var a = pts[i - 1], p = pts[i], b = pts[i + 1];
      if (p[1] >= a[1] || p[1] >= b[1]) continue;   // not a peak
      h += P("M" + p[0] + "," + p[1] + " L" + a[0] + "," + a[1] + " L" + (p[0] + 5) + "," + (hz + 20) + " Z", "#FFFFFF", op(.3));
      h += P("M" + p[0] + "," + p[1] + " L" + (p[0] - 9) + "," + (p[1] + 11) + " L" + (p[0] - 3) + "," + (p[1] + 8) +
        " L" + (p[0] + 2) + "," + (p[1] + 12) + " L" + (p[0] + 8) + "," + (p[1] + 9) + " Z", "#FFFFFF", op(.85));
    }
    return h;
  }
  function bridge(x, y, rot) {
    return at(x, y, 1,
      R(-11, -7, 22, 14, 2, "url(#kw-wood-h)") + L("M-7,-7 L-7,7 M-2,-7 L-2,7 M3,-7 L3,7 M8,-7 L8,7", "#7A4B2A", .8, op(.6)) +
      L("M-11,-8 L11,-8 M-11,8 L11,8", "#6E4526", 1.6), rot);
  }

  function mapSvg(mode, locked) {
    var M = MAP[mode], W = M.W, H = M.H, hz = M.hz;
    var defs = DEFS +
      lg("kw-sky", 0, -40, 0, hz + 10, [[0, "#86CCFF"], [.55, "#C8EBFF"], [1, "#FFF1D8"]], true) +
      lg("kw-ground", 0, hz, 0, H, [[0, "#CFF0A8"], [.45, "#A6DB88"], [1, "#7FC46E"]], true) +
      lg("kw-mtn", 0, hz - 80, 0, hz + 10, [[0, "#C9D5F6"], [1, "#B4C6EC"]], true) +
      rg("kw-sun", M.sun[0], M.sun[1], 130, [[0, "#FFF8D8", 1], [.25, "#FFEFB0", .7], [1, "#FFE39A", 0]], true);
    var h = "<defs>" + defs + "</defs>";
    h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
    h += C(M.sun[0], M.sun[1], 130, "url(#kw-sun)") + C(M.sun[0], M.sun[1], 22, "#FFF7D6");
    h += M.clouds.map(function (c) { return cloud(c[0], c[1], c[2], c[3]); }).join("");
    h += M.birds.map(function (b) { return birds(b[0], b[1], b[2]); }).join("");
    h += mountains(M.mountains, hz);
    // The first rolling band IS the ground's top edge (no hard horizon line).
    h += P(M.bands[0][0], "url(#kw-ground)");
    h += M.bands.slice(1).map(function (b) { return P(b[0], b[1], op(.5)); }).join("");
    h += E(M.sun[0] + 60, hz + 60, 220, 50, "#FFFFFF", op(.12));
    // water
    h += P(M.sea, "url(#kw-sand)") + g(P(M.sea, "url(#kw-sea)"), "translate(-10 10)");
    var lg0 = M.lagoon;
    h += E(lg0[0], lg0[1], lg0[2] + 9, lg0[3] + 7, "url(#kw-sand)") + E(lg0[0], lg0[1] + 2, lg0[2], lg0[3], "url(#kw-sea)") +
      E(lg0[0] - lg0[2] * .35, lg0[1] - lg0[3] * .45, lg0[2] * .35, 3, "#FFFFFF", op(.35));
    h += L(M.river, "#EED79F", 24) + L(M.river, "#58C5E8", 15) + anim("kw-flow", L(M.river, "#E8FCFF", 3, ' stroke-dasharray="6 14"'));
    // paths
    h += M.paths.map(function (p) { return L(p, "#E0C286", 11); }).join("") + M.paths.map(function (p) { return L(p, "#F7E7C0", 7.5); }).join("");
    h += M.bridges.map(function (b) { return bridge(b[0], b[1], b[2]); }).join("");
    h += anim("kw-trail", L(M.trail, "#FFFFFF", 2.6, ' stroke-dasharray="0.1 10"' + op(.9)));
    // decor + landmarks in painter order (far → near)
    var items = M.decor.map(function (d) { return { y: d[2], svg: decorItem(d) }; });
    PLACE_IDS.forEach(function (id) {
      var p = M.places[id];
      var inner = at(p[0], p[1], p[2], LM[id]());
      if (locked && locked[id]) inner = g(inner, "", "kw-locked", ' filter="url(#kw-locked)"') +
        E(p[0], p[1] - 40 * p[2], 70 * p[2], 34 * p[2], "#FFFFFF", op(.28));
      items.push({ y: id === "space" ? -1 : p[1], svg: g(inner, "", "kw-place", ' data-place="' + id + '"') });
    });
    items.sort(function (a, b) { return a.y - b.y; });
    h += items.map(function (i) { return i.svg; }).join("");
    h += M.bflies.map(function (b) { return butterfly(b[0], b[1], 1, b[2], b[3]); }).join("");
    // hidden discoveries on the map: pond ripple in the lagoon + a bird in a meadow tree
    var dp = mode === "P" ? [380, 474] : mode === "X" ? [1645, 472] : [940, 472];
    var rp = mode === "P" ? [34, 700] : mode === "X" ? [0, 556] : [36, 556];
    h += g(anim("kw-d-ripple", E(rp[0], rp[1], 16, 4.5, "none", ' stroke="#FFFFFF" stroke-width="1.6"') +
      E(rp[0], rp[1], 8, 2.2, "none", ' stroke="#FFFFFF" stroke-width="1.2"')) +
      anim("kw-d-fish", g(fish("#FF9A5A", 1.1), tr(rp[0], rp[1] - 4))) +
      E(rp[0], rp[1] - 2, 34, 16, "#FFFFFF", op(0)), "", "kw-disc", ' data-disc="ripple"');
    h += g(anim("kw-d-bird", g(birdSmall("#63C7FF"), tr(dp[0] - 4, dp[1] - 58, 1))) + E(dp[0], dp[1] - 44, 26, 30, "#FFFFFF", op(0)), "", "kw-disc", ' data-disc="fly"');
    return { W: W, H: H, svg: h };
  }

  /* =====================================================================
     DESTINATION SCENES
     Each scene: background(W,H,hz) + spots (<g data-spot>) + discoveries.
     Spot art is bigger, closer versions of the same world.
     ===================================================================== */
  // ---- spot objects (local coords, base centre = 0,0) ----
  var SPOT = {
    home: function () { return house(-18, 0, 2.05, "kw-roof", { chimney: true }) + flowers(-56, 4, 1.2) + flowers(80, 6, 1.1); },
    stall: function () {
      var aw = "";
      for (var i = 0; i < 6; i++) aw += P("M" + (-54 + i * 18) + ",-78 L" + (-36 + i * 18) + ",-78 L" + (-36 + i * 18) + ",-70 C" + (-36 + i * 18) + ",-64 " + (-54 + i * 18) + ",-64 " + (-54 + i * 18) + ",-70 Z", i % 2 ? "#FFFFFF" : "#FF6B6B");
      var fruit = "", cols = ["#E8413C", "#FFB020", "#7CCB4E", "#FF8A3D", "#B25BD6", "#FFD84D"];
      for (var j = 0; j < 10; j++) fruit += C(-40 + (j % 5) * 20 + (j > 4 ? 10 : 0), -34 - (j > 4 ? 8 : 0), 7, cols[j % 6]) + C(-42 + (j % 5) * 20 + (j > 4 ? 10 : 0), -36 - (j > 4 ? 8 : 0), 2.2, "#FFFFFF", op(.5));
      return shadow(14, 2, 62, 8) +
        R(-52, -80, 5, 80, 2, "url(#kw-trunk)") + R(47, -80, 5, 80, 2, "url(#kw-trunk)") +
        P("M-58,-80 L58,-80 L50,-96 L-50,-96 Z", "#FF6B6B") + P("M-50,-96 L50,-96 L46,-100 L-46,-100 Z", "#FFFFFF") + aw +
        R(-50, -30, 100, 30, 4, "url(#kw-wood)") + R(-50, -30, 100, 5, 2, "#E9B07A") +
        fruit + R(-44, -10, 24, 10, 2, "#B9774A") + R(20, -10, 24, 10, 2, "#B9774A");
    },
    garden: function () {
      var h = shadow(10, 3, 64, 9) + E(0, -2, 60, 14, "#9A6036") + E(0, -5, 56, 12, "#7A4B2A") + E(-10, -8, 30, 5, "#A3703F", op(.5));
      var cols = ["#FF6B8A", "#FFB020", "#B79CFF", "#FF7B54", "#FFFFFF", "#FF6B8A"];
      for (var i = 0; i < 6; i++) {
        var x = -44 + i * 17, y = -8 - (i % 2) * 4;
        h += L("M" + x + "," + y + " L" + x + "," + (y - 24), "#3F9A55", 2) + E(x + 4, y - 12, 4, 2, "#5CC46E", ' transform="rotate(-30 ' + (x + 4) + " " + (y - 12) + ')"') +
          P("M" + (x - 6) + "," + (y - 30) + " C" + (x - 6) + "," + (y - 22) + " " + (x + 6) + "," + (y - 22) + " " + (x + 6) + "," + (y - 30) + " L" + (x + 3) + "," + (y - 26) + " L" + x + "," + (y - 32) + " L" + (x - 3) + "," + (y - 26) + " Z", cols[i]);
      }
      h += L("M46,-10 L48,-66", "#3F9A55", 2.6) + C(48, -70, 11, "#FFC53D") + C(48, -70, 5, "#8A5A1E") + E(40, -40, 7, 3, "#5CC46E");
      return h;
    },
    board: function () { return noticeBoard(0, 0, 2.3) + anim("kw-pulse", C(0, -58, 10, "url(#kw-glow)")); },

    lion: function () {
      return shadow(18, 2, 70, 10) +
        P("M-64,0 C-66,-18 -52,-36 -26,-40 C0,-44 30,-40 50,-30 C64,-22 68,-10 64,0 Z", "url(#kw-rockw)") +
        P("M-50,-20 C-40,-32 -16,-36 6,-36 C-14,-32 -34,-28 -46,-16 Z", "#FFFFFF", op(.35)) +
        g(
          P("M28,-44 C44,-46 54,-56 52,-70 C58,-64 58,-50 46,-42 C40,-38 32,-38 28,-40 Z", "url(#kw-lion)") + C(52, -72, 5, "#8A4A1E") +
          E(8, -54, 30, 18, "url(#kw-lion)") +
          R(-8, -52, 9, 16, 4, "url(#kw-lion)") + R(18, -52, 9, 16, 4, "url(#kw-lion)") + E(-4, -37, 7, 3.2, "#F7D9A0") + E(22, -37, 7, 3.2, "#F7D9A0") +
          C(-14, -80, 30, "url(#kw-mane)") + C(-30, -70, 12, "#A65A26") + C(2, -70, 12, "#8A4A1E") + C(-14, -106, 12, "#C9763A") +
          C(-14, -78, 19, "url(#kw-lion)") + C(-29, -94, 6, "url(#kw-lion)") + C(1, -94, 6, "url(#kw-lion)") + C(-29, -94, 3, "#8A4A1E") + C(1, -94, 3, "#8A4A1E") +
          E(-14, -70, 10, 8, "#FBE6C2") + C(-21, -82, 2.6, "#3A2616") + C(-7, -82, 2.6, "#3A2616") + C(-20.2, -83, .9, "#FFFFFF") + C(-6.2, -83, .9, "#FFFFFF") +
          P("M-18,-75 L-10,-75 L-14,-70 Z", "#6B3A2A") + L("M-14,-70 L-14,-66 M-14,-66 C-17,-63 -20,-64 -21,-66 M-14,-66 C-11,-63 -8,-64 -7,-66", "#6B3A2A", 1.1) +
          C(-4, -86, 1, "#FFFFFF", op(.6)), "", "kw-breathe");
    },
    elephant: function () {
      return E(0, -2, 76, 16, "url(#kw-sand)") + E(0, -3, 68, 12, "url(#kw-water)") + E(-20, -6, 22, 2.5, "#FFFFFF", op(.6)) +
        anim("kw-ripple-amb", E(-44, -3, 12, 3, "none", ' stroke="#FFFFFF" stroke-width="1.2" opacity=".7"')) +
        g(
          shadow(22, -4, 48, 6) +
          R(-6, -44, 13, 38, 5, "url(#kw-ele)") + R(30, -44, 13, 38, 5, "url(#kw-ele)") +
          E(20, -58, 42, 30, "url(#kw-ele)") + R(-2, -40, 12, 36, 5, "url(#kw-ele)") + R(38, -40, 12, 36, 5, "#9098B2") +
          P("M60,-66 C68,-62 70,-50 64,-44", "none", ' stroke="#8E96AE" stroke-width="3" stroke-linecap="round"') +
          C(-26, -70, 22, "url(#kw-ele)") +
          E(-10, -70, 17, 22, "#B8C0D4") + E(-10, -70, 12, 17, "#F4C9D4", op(.8)) +
          anim("kw-trunk-swing", P("M-42,-66 C-52,-56 -52,-38 -48,-24 C-47,-18 -42,-12 -38,-16 C-41,-24 -42,-38 -34,-54 Z", "url(#kw-ele)")) +
          P("M-38,-58 C-44,-54 -46,-50 -46,-46 C-42,-48 -38,-50 -34,-54 Z", "#FFFBF0") +
          C(-32, -76, 2.8, "#2B2151") + C(-31, -77, .9, "#FFFFFF") +
          L("M-20,-74 C-18,-70 -18,-66 -20,-62", "#8E96AE", 1, op(.6)), "", "");
    },
    parrot: function () {
      return shadow(12, 2, 40, 7) +
        P("M-8,0 C-6,-30 -4,-70 -2,-128 L8,-128 C9,-70 11,-30 12,0 Z", "url(#kw-trunk)") +
        L("M4,-86 C24,-90 40,-86 58,-94", "#7A4B2A", 5) +
        anim("kw-canopy", C(-20, -134, 32, "url(#kw-jdeep)") + C(20, -140, 30, "url(#kw-jleaf)") + C(-4, -156, 26, "url(#kw-jleaf)") + C(46, -118, 20, "url(#kw-jleaf)")) +
        macaw(38, -94, 1.15) + bigLeaf(-6, 0, .8, -40) + bigLeaf(14, 0, .7, 30);
    },
    ducks: function () {
      function duck(x, y, s, c) {
        return at(x, y, s, shadow(4, 1, 14, 3) + E(0, -9, 14, 9, c) + P("M10,-12 C18,-16 16,-6 10,-5 Z", c) + C(-9, -20, 7.5, c) +
          P("M-16,-20 L-23,-18 L-16,-16 Z", "#FF9A2E") + C(-11, -22, 1.4, "#2B2151") + P("M-2,-12 C4,-14 8,-10 6,-6 C2,-6 -2,-8 -2,-12 Z", "#FFFFFF", op(.5)));
      }
      return E(-10, -2, 62, 12, "url(#kw-water)") + E(-26, -4, 14, 2, "#FFFFFF", op(.5)) +
        anim("kw-paddle", duck(-28, -2, 1.5, "url(#kw-duck)") + duck(10, -2, .78, "url(#kw-chick)") + duck(30, -1, .7, "url(#kw-chick)") + duck(48, 0, .66, "url(#kw-chick)")) +
        bush(62, 2, .9, "deep");
    },

    stone: function () {
      return jigsaw(0, 0, 2.1) +
        anim("kw-float", C(-74, -96, 11, "none", ' stroke="#FFFFFF" stroke-width="3"')) +
        anim("kw-float", P("M70,-128 l12,20 l-24,0 Z", "none", ' stroke="#FFE27A" stroke-width="3" stroke-linejoin="round"'), delay(-1.6)) +
        anim("kw-float", R(56, -58, 18, 18, 3, "none", ' stroke="#FFFFFF" stroke-width="3"'), delay(-3)) +
        anim("kw-float", sparkle(-40, -124, 1.3) + sparkle(10, -150, 1.1, "#FFE27A"), delay(-2.2));
    },
    shapes: function () {
      return shadow(12, 2, 60, 8) + R(-52, -22, 104, 22, 6, "url(#kw-stone)") + R(-52, -22, 104, 5, 2, "#FFFFFF", op(.6)) +
        at(-32, -24, 1, C(0, -16, 15, "#FF6B8A") + C(-5, -21, 5, "#FFFFFF", op(.4))) +
        at(0, -24, 1, P("M0,-36 L17,0 L-17,0 Z", "#63C7FF") + P("M0,-36 L-17,0 L-7,0 Z", "#FFFFFF", op(.3))) +
        at(33, -24, 1, R(-14, -28, 28, 28, 4, "#FFB020") + R(-14, -28, 10, 28, 3, "#FFFFFF", op(.3)));
    },
    treasure: function () { return chest(0, 0, 1.55); },
    drums: function () {
      function drum(x, s, c) {
        return at(x, 0, s, shadow(8, 1, 22, 5) + R(-18, -24, 36, 24, 8, "url(#kw-rock)") + E(0, -24, 18, 7, c) + E(-5, -26, 7, 2, "#FFFFFF", op(.5)));
      }
      return drum(-42, 1, "#FF6B8A") + drum(0, 1.15, "#FFB020") + drum(42, 1, "#63C7FF") +
        anim("kw-notes", P("M-10,-66 L-10,-80 L0,-83 L0,-69", "none", ' stroke="#6C4BD6" stroke-width="2"') + C(-12, -66, 3, "#6C4BD6") + C(-2, -69, 3, "#6C4BD6"));
    },
    cave: function () {
      return shadow(14, 2, 66, 9) +
        P("M-62,0 C-66,-40 -40,-90 0,-92 C40,-94 66,-50 62,0 Z", "url(#kw-rock)") +
        P("M-34,0 C-36,-30 -20,-58 2,-58 C22,-58 36,-30 34,0 Z", "#2E2656") + E(0, -2, 34, 5, "#4A3F7A") +
        P("M-12,-4 C-14,-14 -8,-24 -2,-24 L2,-30 L4,-24 L8,-30 L9,-22 C14,-18 14,-8 12,-4 Z", "#FFFFFF", op(.22)) +
        P("M-50,-30 C-46,-56 -28,-78 -6,-82 C-24,-74 -40,-56 -44,-30 Z", "#FFFFFF", op(.4)) +
        C(24, -20, 2, "#FFE27A", ' class="kw-blink"') + C(-20, -26, 1.6, "#FFE27A", ' class="kw-blink" style="' + delay(.8) + '"');
    },

    book: function () {
      return shadow(12, 2, 44, 7) + R(-6, -52, 12, 52, 3, "url(#kw-wood-h)") + R(-24, -4, 48, 6, 3, "url(#kw-wood)") +
        P("M-44,-54 L44,-54 L38,-64 L-38,-64 Z", "url(#kw-wood)") +
        anim("kw-pulse", C(0, -84, 38, "url(#kw-glow)")) +
        P("M0,-62 C-14,-70 -30,-72 -46,-66 L-46,-94 C-30,-100 -14,-98 0,-90 Z", "url(#kw-book)") +
        P("M0,-62 C14,-70 30,-72 46,-66 L46,-94 C30,-100 14,-98 0,-90 Z", "#FFFBEE") +
        L("M-38,-86 C-28,-89 -18,-88 -8,-84 M-38,-80 C-28,-83 -18,-82 -8,-78 M8,-84 C18,-88 28,-89 38,-86 M8,-78 C18,-82 28,-83 38,-80", "#C9B48A", 1.2) +
        P("M-4,-62 L4,-62 L4,-48 L0,-52 L-4,-48 Z", "#E0457B") + sparkle(-30, -104, .7, "#FFE27A") + sparkle(34, -108, .55, "#FFFFFF");
    },
    tower: function () {
      return shadow(12, 2, 36, 7) + R(-24, -120, 48, 120, 4, "url(#kw-stone)") + R(8, -120, 16, 120, 0, "#5B3DC0", op(.1)) +
        P("M-32,-120 L0,-176 L32,-120 Z", "url(#kw-roof-v)") + L("M0,-176 L0,-192", "#6E5A8C", 1.6) + anim("kw-flag", P("M0,-192 L18,-187 L0,-182 Z", "#FFB020")) +
        P("M-7,-92 L-7,-102 C-7,-110 7,-110 7,-102 L7,-92 Z", "#FFD98A", ' class="kw-win"') +
        anim("kw-banner", P("M-18,-78 L18,-78 L18,-22 L0,-32 L-18,-22 Z", "#E0457B") + T(0, -40, "A", "#FFE27A", 32)) +
        P("M-10,0 L-10,-14 C-10,-22 10,-22 10,-14 L10,0 Z", "#7A4A2E");
    },
    wordpath: function () {
      var h = shadow(8, 4, 76, 8), L3 = ["C", "A", "T"];
      L3.forEach(function (ch, i) {
        var x = -46 + i * 46;
        h += R(x - 19, -30 + i * 2, 38, 30, 7, "#B08A5A") + R(x - 19, -34 + i * 2, 38, 30, 7, "url(#kw-stone)") +
          T(x, -12 + i * 2, ch, ["#FF6B8A", "#6C4BD6", "#1FA36B"][i], 22);
      });
      return h;
    },
    // Story discovery point: a mossy stump where a little bluebird waits, with a story glow.
    birdstory: function () {
      return anim("kw-pulse", C(0, -40, 46, "url(#kw-glow)")) + shadow(10, 2, 42, 7) +
        P("M-30,0 C-32,-16 -28,-36 -26,-44 L26,-44 C28,-36 32,-16 32,0 Z", "url(#kw-trunk)") +
        E(0, -44, 26, 8, "#D9A36C") + E(0, -44, 18, 5, "#C08A55", op(.8)) + E(0, -44, 9, 2.6, "#A8703F", op(.8)) +
        E(-16, -26, 12, 5, "#5CB564", op(.8)) + P("M-30,0 C-36,-4 -40,-2 -42,4 L-22,4 Z", "#7A4B2A") + P("M32,0 C38,-4 42,-2 44,4 L24,4 Z", "#7A4B2A") +
        anim("kw-bob", g(birdSmall("#4E97E8"), tr(2, -48, 2.4))) +
        sparkle(-24, -78, .8, "#FFE27A") + sparkle(26, -88, .6) + flowers(-18, 2, .9) + flowers(20, 3, .8);
    },
    lanterns: function () {
      function lantern(x, y, ch, d) {
        return anim("kw-swing", L("M" + x + ",-96 L" + x + "," + y, "#6E5A8C", 1.4) +
          C(x, y + 16, 20, "url(#kw-glow)", ' class="kw-pulse"') + R(x - 11, y, 22, 28, 6, "#FFE6A3") + R(x - 11, y, 22, 5, 2, "#8A5A1E") + R(x - 11, y + 23, 22, 5, 2, "#8A5A1E") +
          T(x, y + 21, ch, "#8A4B12", 15), "animation-delay:" + d + "s");
      }
      return shadow(8, 2, 30, 6) + R(-4, -104, 8, 104, 3, "url(#kw-trunk)") + R(-40, -104, 80, 7, 3, "url(#kw-wood)") +
        lantern(-30, -90, "B", 0) + lantern(30, -86, "D", .7);
    },

    reef: function () {
      return shadow(10, 2, 62, 8) + rock(-30, 0, 1.2) + rock(24, 2, 1) +
        anim("kw-seaweed", L("M-56,0 C-62,-20 -50,-36 -58,-56", "#2FA36B", 5)) +
        P("M-20,-20 C-26,-40 -16,-56 -20,-72 M-20,-40 C-10,-50 -6,-60 -2,-70 M-20,-34 C-30,-44 -34,-52 -36,-62", "none", ' stroke="#FF6B8A" stroke-width="6" stroke-linecap="round"') +
        P("M10,-14 C8,-40 26,-56 44,-50 C40,-34 30,-18 10,-14 Z", "#FFB870") + L("M12,-16 C20,-30 30,-42 42,-48 M16,-16 C26,-24 34,-32 42,-36", "#E88A3E", 1.2) +
        C(30, -6, 8, "#B79CFF") + C(28, -8, 3, "#FFFFFF", op(.5)) +
        anim("kw-bubbles", C(-4, -84, 4, "none", ' stroke="#E6FBFF" stroke-width="1.4"') + C(6, -100, 3, "none", ' stroke="#E6FBFF" stroke-width="1.2"') + C(-8, -112, 2.4, "none", ' stroke="#E6FBFF" stroke-width="1"'));
    },
    boatspot: function () { return boat(0, 0, 2.6); },
    shells: function () {
      return E(0, -2, 64, 12, "#E8CC92") +
        at(-34, -6, 1, P("M0,0 C-14,-4 -16,-22 0,-28 C16,-22 14,-4 0,0 Z", "#FFB5C8") + L("M0,0 L-8,-24 M0,0 L0,-27 M0,0 L8,-24", "#E07FA0", 1.2)) +
        at(4, -4, 1, P("M-12,0 C-16,-14 -4,-24 8,-18 C16,-12 12,0 -12,0 Z", "#FFC48A") + L("M-6,-6 C-2,-12 4,-12 6,-8", "#D98A45", 1.2)) +
        at(38, -6, 1, P("M0,-20 L5,-7 L19,-7 L8,1 L12,14 L0,6 L-12,14 L-8,1 L-19,-7 L-5,-7 Z", "#FFD24D") + C(0, -2, 2, "#FFB020"));
    },

    computer: function () {
      return shadow(14, 2, 70, 8) + R(-62, -46, 124, 8, 3, "url(#kw-wood)") + R(-56, -38, 6, 38, 2, "#A4B3D2") + R(50, -38, 6, 38, 2, "#A4B3D2") +
        R(-34, -100, 58, 42, 6, "#3A4470") + R(-30, -96, 50, 34, 4, "url(#kw-screen)") +
        anim("kw-screen-glow", R(-26, -90, 20, 4, 2, "#7FE3FF") + R(-26, -82, 30, 4, 2, "#FF8FC4") + R(-26, -74, 14, 4, 2, "#FFE27A")) +
        R(-10, -58, 10, 12, 2, "#3A4470") + R(-24, -50, 38, 4, 2, "#DDE5F5") +
        R(26, -62, 30, 16, 3, "#2FA36B") + C(32, -54, 2.2, "#FFE27A", ' class="kw-blink"') + C(40, -54, 2.2, "#FF6B8A", ' class="kw-blink" style="' + delay(.5) + '"') +
        L("M34,-58 L48,-58 M34,-50 L48,-50", "#BDF5D6", 1);
    },
    jar: function () {
      return shadow(10, 2, 40, 7) + R(-30, -10, 60, 10, 4, "url(#kw-wood)") +
        L("M34,-10 L34,-120 L6,-132", "#9FAECB", 4) + P("M-4,-138 L16,-138 L10,-126 L2,-126 Z", "#6F7FB0") + anim("kw-pulse", C(6, -110, 26, "url(#kw-glow)")) +
        R(-16, -34, 32, 24, 5, "#C1653D") + R(-18, -36, 36, 6, 3, "#D9794A") +
        L("M0,-36 C0,-50 -2,-58 0,-66", "#3F9A55", 3) + E(-10, -60, 9, 4.5, "url(#kw-leaf)", ' transform="rotate(-25 -10 -60)"') + E(9, -66, 9, 4.5, "url(#kw-leaf)", ' transform="rotate(25 9 -66)"') +
        P("M-26,-10 L-26,-60 C-26,-86 26,-86 26,-60 L26,-10 Z", "url(#kw-glass)") + L("M-18,-18 L-18,-58 C-18,-72 -10,-78 -2,-80", "#FFFFFF", 2.4, op(.7));
    },
    blueprint: function () {
      return shadow(14, 2, 66, 8) + R(-50, -40, 6, 40, 2, "#A4B3D2") + R(44, -40, 6, 40, 2, "#A4B3D2") +
        P("M-62,-40 L62,-40 L54,-62 L-54,-62 Z", "#3E6FD6") + L("M-44,-46 L44,-46 M-40,-52 C-20,-60 20,-60 40,-52", "#DDEBFF", 1.1, op(.8)) +
        at(0, -62, 1, R(-36, -6, 72, 6, 2, "url(#kw-wood)") + P("M-30,-6 C-20,-26 20,-26 30,-6 L24,-6 C16,-20 -16,-20 -24,-6 Z", "#E8503A") +
          L("M-18,-12 L-18,-6 M-6,-18 L-6,-6 M6,-18 L6,-6 M18,-12 L18,-6", "#FFFFFF", 1.4, op(.8)));
    },

    rocket: function () {
      return shadow(12, 2, 50, 8) + R(-44, -8, 88, 8, 3, "#9FAECB") + R(-36, -14, 72, 8, 3, "#C9D3EE") +
        L("M34,-14 L34,-120 M34,-100 L14,-100 M34,-60 L14,-60", "#B6C2E0", 4) +
        anim("kw-idle-rocket",
          P("M-18,-16 L-18,-110 C-18,-138 0,-160 0,-160 C0,-160 18,-138 18,-110 L18,-16 Z", "url(#kw-metal)") +
          P("M-18,-110 C-18,-138 0,-160 0,-160 C0,-160 18,-138 18,-110 Z", "#E8503A") +
          C(0, -84, 9, "#3A4A86") + C(0, -84, 6.5, "#7FDDFF") + C(-2.5, -86.5, 2, "#FFFFFF", op(.7)) +
          P("M-18,-48 L-34,-14 L-18,-22 Z", "#E8503A") + P("M18,-48 L34,-14 L18,-22 Z", "#C23E2B") + R(-4, -40, 8, 24, 2, "#C23E2B") +
          R(4, -150, 14, 134, 0, "#23304A", op(.06)));
    },
    telescope: function () {
      return shadow(10, 2, 40, 7) + L("M0,0 L-20,0 M0,0 L20,0 M0,-40 L-18,0 M0,-40 L18,0 M0,-40 L0,0", "#8B97BA", 3) +
        g(R(-44, -12, 88, 22, 9, "url(#kw-roof-b)") + R(30, -14, 18, 26, 6, "#3A3F66") + C(46, -1, 7, "#7FE3FF") + R(-50, -9, 10, 16, 4, "#3A3F66") + R(-10, -12, 8, 22, 1, "#FFB020"),
          "translate(0 -46) rotate(-28)");
    },
    panel: function () {
      var h = shadow(14, 2, 68, 8) + P("M-62,0 L-56,-60 L56,-60 L62,0 Z", "url(#kw-metal)") + P("M-56,-60 L56,-60 L60,-70 L-60,-70 Z", "#C9D3EE") +
        R(-46, -104, 92, 40, 7, "#3A4470") + R(-42, -100, 84, 32, 5, "url(#kw-screen)") +
        anim("kw-wave-line", L("M-36,-84 C-26,-96 -16,-72 -6,-84 S14,-96 24,-84 S34,-76 38,-84", "#7FE3FF", 2));
      [["1", "#FF6B8A"], ["2", "#FFB020"], ["3", "#38C172"]].forEach(function (b, i) {
        var x = -36 + i * 36;
        h += R(x - 14, -50, 28, 26, 7, "#8C3B5A", op(.25)) + R(x - 14, -54, 28, 26, 7, b[1]) + T(x, -34, b[0], "#FFFFFF", 18);
      });
      return h;
    },
    // Change #23: an old treasure map on a little easel, a message bottle at its feet (opens the treasure hunt).
    mystery: function () {
      return shadow(4, 2, 58, 8) + L("M-30,0 L-14,-74 M30,0 L14,-74 M0,-74 L0,6", "#8D5A34", 4) +
        P("M-46,-86 L40,-92 L50,-80 L46,-30 L36,-22 L-40,-20 L-50,-34 Z", "#FFF3D6", ' stroke="#C99B5E" stroke-width="2"') +
        L("M-34,-34 C-24,-52 -12,-44 -2,-58 S20,-70 30,-74", "#C0392B", 2.4, ' stroke-dasharray="5 5"') +
        L("M24,-80 L36,-68 M36,-80 L24,-68", "#C0392B", 3.6) + C(-34, -34, 4, "#4FB060") +
        L("M-26,-80 L-26,-70 M-31,-75 L-21,-75", "#7A4A22", 1.6) + C(-26, -75, 7, "none", ' stroke="#7A4A22" stroke-width="1.4"') +
        anim("kw-pulse", C(30, -74, 14, "#FFE27A", op(.35))) +
        g(R(-18, -7, 30, 14, 7, "#7FD3B5", op(.9)) + R(10, -4, 9, 8, 2, "#7FD3B5", op(.9)) + R(18, -5, 5, 10, 2, "#B07A4A") + R(-12, -4, 18, 8, 3, "#FFF3D6"), "translate(40 -6) rotate(-14)") +
        sparkle(62, -22, .7, "#FFFFFF");
    },
    // Change #22: a little brass orrery: the Sun with planets on their rings (opens the Solar System).
    orrery: function () {
      return shadow(0, 2, 62, 8) + P("M-42,0 L-32,-14 L32,-14 L42,0 Z", "url(#kw-wood)") + R(-36, -19, 72, 6, 3, "#C9D3EE") +
        R(-3, -66, 6, 48, 2, "url(#kw-metal)") +
        E(0, -78, 62, 19, "none", ' stroke="#FFD6A5" stroke-width="2.6"') + E(0, -78, 38, 11.5, "none", ' stroke="#B6C2E0" stroke-width="2"') +
        anim("kw-pulse", C(0, -78, 22, "#FFD86B", op(.35))) + C(0, -78, 13, "#FFC23D") + C(-4, -82, 5, "#FFF1A8", op(.85)) +
        C(37, -74, 5.5, "#4E9BE8") + C(36, -76, 2.4, "#5CC46C") + C(-31, -84, 4.5, "#E2683C") +
        C(-55, -71, 8, "url(#kw-planet)") + E(-55, -71, 14, 3.4, "none", ' stroke="#FFD6A5" stroke-width="1.7" transform="rotate(-12 -55 -71)"') +
        C(57, -84, 6.5, "url(#kw-planet2)");
    },
    scale: function () {
      return shadow(12, 2, 56, 8) + R(-24, -8, 48, 8, 3, "url(#kw-metal)") + R(-4, -86, 8, 80, 3, "url(#kw-metal)") + C(0, -90, 6, "#FFB020") +
        anim("kw-tilt", L("M-54,-84 L54,-84", "#9FAECB", 4) +
          L("M-54,-84 L-66,-56 M-54,-84 L-42,-56 M54,-84 L42,-56 M54,-84 L66,-56", "#B6C2E0", 1.4) +
          E(-54, -54, 18, 4, "#C9D3EE") + E(54, -54, 18, 4, "#C9D3EE") +
          C(-54, -72, 15, "url(#kw-planet)") + E(-54, -72, 24, 5, "none", ' stroke="#FFD6A5" stroke-width="2" transform="rotate(-14 -54 -72)"') +
          C(54, -64, 8, "url(#kw-planet2)"));
    }
  };

  function spotG(key, x, y, s) { return g(at(x, y, s, SPOT[key]()), "", "kw-spot", ' data-spot="' + key + '"'); }
  function disc(kind, inner) { return g(inner, "", "kw-disc", ' data-disc="' + kind + '"'); }
  function hitPad(x, y, rx, ry) { return E(x, y, rx, ry, "#FFFFFF", op(0)); }

  // Ground-and-sky backgrounds share one horizon convention (hz).
  function skyGround(W, H, hz, sky, ground, extra) {
    return big(-900, -900, W + 1800, hz + 960, sky) + (extra || "") + big(-900, hz - 4, W + 1800, H + 900, ground);
  }

  // ---- scene-dressing helpers (deterministic, so a scene never "reshuffles") ----
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function tufts(W, H, top, seed, cols, count) {
    var r = rng(seed), h = "";
    cols = cols || ["#5FA84F", "#4E9444"];
    for (var i = 0; i < (count || 46); i++) {
      var x = -320 + r() * (W + 640), y = top + 12 + r() * (H - top + 40);
      var s = .7 + (y - top) / (H - top) * .9;
      if (i % 6 === 0) h += C(x, y, 2.3 * s, ["#FFFFFF", "#FFD24D", "#FF8FB0"][i % 3], op(.9)) + C(x, y, .9 * s, "#FFF3B0");
      else h += L("M" + n(x - 4 * s) + "," + n(y) + " L" + n(x - 2 * s) + "," + n(y - 7 * s) + " M" + n(x) + "," + n(y) + " L" + n(x) + "," + n(y - 10 * s) +
        " M" + n(x + 4 * s) + "," + n(y) + " L" + n(x + 2.5 * s) + "," + n(y - 6 * s), cols[i % cols.length], 1.4 * s, op(.75));
    }
    return h;
  }
  function patches(W, H, top, seed, col) {
    var r = rng(seed), h = "";
    for (var i = 0; i < 9; i++) h += E(-200 + r() * (W + 400), top + 30 + r() * (H - top), 50 + r() * 90, 10 + r() * 16, col || "#FFFFFF", op(.1));
    return h;
  }
  function windmill(x, y, s) {
    return at(x, y, s,
      shadow(10, 1, 18, 4) + P("M-9,0 L-6,-44 L6,-44 L9,0 Z", "url(#kw-wall)") + P("M1,0 L1,-44 L6,-44 L9,0 Z", "#C4A27A", op(.35)) +
      P("M-8,-44 L0,-54 L8,-44 Z", "url(#kw-roof)") + R(-3, -12, 6, 12, 3, "#9A6036") +
      g(anim("kw-spin", R(-2, -34, 4, 34, 1.5, "#FFFFFF") + R(-2, 0, 4, 34, 1.5, "#FFFFFF") + R(-34, -2, 34, 4, 1.5, "#F4ECE0") + R(0, -2, 34, 4, 1.5, "#F4ECE0") +
        R(-1, -32, 7, 26, 1, "#E6D8C2", op(.8)) + R(-6, 6, 7, 26, 1, "#E6D8C2", op(.8)) + R(-32, -6, 26, 7, 1, "#E6D8C2", op(.8)) + R(6, -1, 26, 7, 1, "#E6D8C2", op(.8)) +
        C(0, 0, 3.4, "#8D5A34")), "translate(0 -46)"));
  }
  function fern(x, y, s, flip) {
    return at(x, y, s, bigLeaf(0, 0, 1, -58, "url(#kw-jdeep)") + bigLeaf(0, 0, 1.1, -22) + bigLeaf(0, 0, 1.05, 18, "url(#kw-jleaf)") + bigLeaf(0, 0, .9, 52, "url(#kw-jdeep)"), 0, flip);
  }
  function coral(x, y, s, c, c2) {
    return at(x, y, s,
      L("M0,0 C-2,-14 -10,-22 -14,-34 M0,-10 C6,-20 14,-26 16,-38 M-8,-22 C-16,-26 -22,-30 -26,-40 M4,-18 C2,-28 4,-36 2,-46", c, 5.5) +
      L("M-10,-18 C-12,-24 -14,-28 -16,-32 M8,-16 C10,-22 12,-26 14,-30", c2 || "#FFFFFF", 1.4, op(.35)));
  }
  function fanCoral(x, y, s, c) {
    return at(x, y, s, P("M0,0 C-4,-26 8,-44 26,-40 C22,-24 14,-10 0,0 Z", c) + L("M1,-2 C6,-16 14,-28 24,-38 M3,-2 C10,-12 16,-20 22,-26", "#FFFFFF", 1, op(.35)));
  }
  function turtle() {
    return E(0, 0, 22, 14, "#3FA56B") + P("M-18,-2 C-14,-12 14,-12 18,-2 C12,4 -12,4 -18,-2 Z", "#6CC48A") +
      L("M-8,-9 L-4,-1 M4,-9 L8,-1 M-12,-4 L12,-4", "#2E7A4E", 1, op(.6)) +
      C(-26, -2, 7, "#8FD0A0") + C(-29, -4, 1.4, "#2B2151") +
      E(-8, 12, 9, 4, "#8FD0A0", ' transform="rotate(30 -8 12)"') + E(10, 12, 8, 3.6, "#8FD0A0", ' transform="rotate(-30 10 12)"') +
      E(-10, -12, 9, 4, "#8FD0A0", ' transform="rotate(-30 -10 -12)"');
  }
  function fountain(x, y, s) {
    return at(x, y, s,
      shadow(8, 2, 52, 9) + E(0, 0, 50, 12, "url(#kw-stone)") + E(0, -3, 44, 9, "url(#kw-water)") + E(-14, -5, 14, 2, "#FFFFFF", op(.6)) +
      R(-6, -34, 12, 32, 4, "url(#kw-stone)") + E(0, -34, 18, 5, "url(#kw-stone)") + E(0, -35, 14, 3.6, "url(#kw-water)") +
      anim("kw-jet", L("M0,-36 C-2,-54 -12,-56 -18,-40 M0,-36 C2,-54 12,-56 18,-40 M0,-36 L0,-60", "#DDF8FF", 2.6, op(.9))));
  }
  function hedge(x, y, w, s) {
    var h = shadow(w / 2 + 6, 2, w / 2 + 8, 5), k = Math.max(2, Math.round(w / 16));
    for (var i = 0; i < k; i++) h += C(i * (w / (k - 1)), -12, 13, i % 2 ? "url(#kw-leaf-d)" : "url(#kw-leaf)");
    h += R(-8, -14, w + 16, 14, 7, "url(#kw-leaf-d)");
    for (var j = 0; j < k; j += 2) h += C(j * (w / (k - 1)) + 3, -18, 3, "#FF8FB0");
    return at(x, y, s, h);
  }
  function lampPost(x, y, s) {
    return at(x, y, s, shadow(6, 1, 10, 3) + R(-2, -64, 4, 64, 2, "#5B4E7A") + C(0, -70, 16, "url(#kw-glow)", ' class="kw-pulse"') +
      R(-7, -78, 14, 14, 4, "#FFE6A3") + P("M-9,-78 L0,-86 L9,-78 Z", "#5B4E7A"));
  }
  function floatIsle(x, y, s, withFall) {
    return at(x, y, s, anim("kw-float",
      P("M-40,0 C-30,24 -10,46 0,52 C10,46 30,24 40,0 Z", "url(#kw-rock)") + L("M-24,10 C-10,18 10,18 24,10", "#8E83AE", 1, op(.6)) +
      E(0, -2, 42, 9, "url(#kw-leaf)") + E(-10, -5, 20, 4, "#FFFFFF", op(.2)) + palm(14, -4, .45) + bush(-14, -2, .45) +
      (withFall ? anim("kw-fall", R(30, 0, 4, 40, 2, "#DDF8FF", op(.85))) : "")));
  }

  var REALM = {
    village: {
      P: { hz: 318, spots: { home: [118, 526, .9], stall: [300, 560, .82], garden: [104, 712, .9], board: [300, 716, .9] }, momo: [210, 636] },
      L: { hz: 236, spots: { home: [290, 400, .95], stall: [560, 430, .85], garden: [170, 512, .85], board: [830, 480, .9] }, momo: [440, 486] },
      bg: function (W, H, hz, m) {
        var h = "<defs>" + lg("kw-sky", 0, -60, 0, hz, [[0, "#7FC6FF"], [.6, "#C8EAFF"], [1, "#FFF1D6"]], true) +
          lg("kw-ground", 0, hz, 0, H, [[0, "#C8EDA0"], [.5, "#9FD684"], [1, "#7FC46E"]], true) + "</defs>";
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
        h += C(W * .16, hz * .24, 120, "url(#kw-softglow)") + C(W * .16, hz * .24, 20, "#FFF7D6") +
          cloud(W * .42, hz * .2, 1, "kw-cloud--a") + cloud(W * .84, hz * .4, .75, "kw-cloud--b") + cloud(W * .08, hz * .56, .6, "kw-cloud--c") + birds(W * .6, hz * .3, 1);
        h += P("M-900," + (hz + 10) + " C" + (W * .05) + "," + (hz - 64) + " " + (W * .3) + "," + (hz - 56) + " " + (W * .5) + "," + (hz - 22) +
          " S" + (W * .85) + "," + (hz - 84) + " " + (W + 900) + "," + (hz - 8) + " L" + (W + 900) + "," + (hz + 80) + " L-900," + (hz + 80) + " Z", "#C2DFB9");
        for (var i = -6; i < W / 34 + 6; i++) h += C(i * 34 + 10, hz - 14 - Math.abs(Math.sin(i * 1.3)) * 18, 13 + (i % 3) * 3, "#9CC99A", op(.9));
        h += windmill(W * .82, hz - 26, m === "P" ? .9 : 1.1) + house(W * .6, hz - 12, .5, "kw-roof-v") + house(W * .69, hz - 6, .42, "kw-roof") + pine(W * .06, hz - 6, .6) + pine(W * .11, hz - 2, .5);
        h += P("M-900," + (hz + 16) + " C" + (W * .2) + "," + (hz - 20) + " " + (W * .45) + "," + (hz - 4) + " " + (W * .6) + "," + (hz + 10) +
          " S" + (W * .9) + "," + (hz - 18) + " " + (W + 900) + "," + (hz + 6) + " L" + (W + 900) + "," + (H + 900) + " L-900," + (H + 900) + " Z", "url(#kw-ground)");
        h += patches(W, H, hz, 7) + tufts(W, H, hz + 10, 11);
        h += P("M" + (W * .43) + "," + (H + 300) + " C" + (W * .45) + "," + (H * .82) + " " + (W * .6) + "," + (hz + 110) + " " + (W * .4) + "," + (hz + 40) +
          " L" + (W * .46) + "," + (hz + 38) + " C" + (W * .72) + "," + (hz + 110) + " " + (W * .6) + "," + (H * .82) + " " + (W * .63) + "," + (H + 300) + " Z", "url(#kw-sand)", op(.92));
        h += tree(-24, hz + 70, 1.2) + tree(W + 24, hz + 76, 1.15, "bloss") + tree(-44, H * .82, 1.4, "bloss") + tree(W + 44, H * .86, 1.4) +
          fence(W * .06, hz + 36, 1) + fence(W * .78, hz + 44, .9) + flowers(W * .5, hz + 24, 1.2) + flowers(W * .92, hz + 120, 1.1);
        var pond = m === "P" ? [290, 402] : [700, 300];
        h += disc("ripple",
          E(pond[0], pond[1], 46, 13, "url(#kw-sand)") + E(pond[0], pond[1] - 1, 40, 10, "url(#kw-water)") + E(pond[0] - 12, pond[1] - 4, 12, 2, "#FFFFFF", op(.6)) +
          E(pond[0] + 26, pond[1] + 2, 6, 2, "#5CC46E") + E(pond[0] - 30, pond[1] + 3, 5, 1.8, "#5CC46E") +
          anim("kw-d-ripple", E(pond[0] + 6, pond[1], 16, 4, "none", ' stroke="#FFFFFF" stroke-width="1.6"') + E(pond[0] + 6, pond[1], 7, 2, "none", ' stroke="#FFFFFF" stroke-width="1.2"')) +
          anim("kw-d-fish", g(fish("#FF9A5A", 1.3), tr(pond[0] + 4, pond[1] - 4))));
        var tb = m === "P" ? [46, 424] : [60, 330];
        h += disc("fly", tree(tb[0], tb[1], 1.25) + anim("kw-d-bird", g(birdSmall("#FF7B54"), tr(tb[0] + 6, tb[1] - 74, 1.3))) + hitPad(tb[0], tb[1] - 58, 30, 34));
        var bb = m === "P" ? [362, 424] : [940, 380];
        h += disc("rustle", anim("kw-d-critter", g(bunny(), tr(bb[0] - 2, bb[1] - 6, 1.2))) + anim("kw-d-shake", bush(bb[0], bb[1], 1.3, "bloss")));
        h += butterfly(W * .3, hz + 90, 1.2, "#FFB020", "kw-bfly--a") + butterfly(W * .7, hz + 170, 1.1, "#FF7FA8", "kw-bfly--b");
        return h;
      }
    },
    jungle: {
      P: { hz: 372, fall: [206, 372], spots: { lion: [110, 548, .92], parrot: [322, 494, .85], elephant: [292, 700, .9], ducks: [86, 716, .88] }, momo: [200, 632] },
      L: { hz: 262, fall: [516, 262], spots: { lion: [196, 420, .9], parrot: [856, 380, .8], elephant: [664, 476, .85], ducks: [330, 516, .85] }, momo: [492, 456] },
      bg: function (W, H, hz, m, lay) {
        var h = "<defs>" + lg("kw-sky", 0, -40, 0, hz, [[0, "#E9FAD6"], [1, "#C6EBB6"]], true) +
          lg("kw-ground", 0, hz, 0, H, [[0, "#98D276"], [.5, "#6FB45C"], [1, "#4C9450"]], true) +
          lg("kw-fallg", 0, 0, 1, 0, [[0, "#CFF3FF"], [.5, "#FFFFFF"], [1, "#B5E8FA"]]) + "</defs>";
        var i;
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
        for (i = -6; i < W / 64 + 6; i++) h += C(i * 64 + 20, hz - 78 - (Math.abs(i) % 3) * 20, 66, "#A9D7AA");
        for (i = -6; i < W / 58 + 6; i++) h += C(i * 58, hz - 30 - (Math.abs(i + 1) % 3) * 14, 50, "#7DBE88");
        var f = lay.fall, fx = f[0], fy = f[1];
        h += P("M" + (fx - 150) + "," + (fy + 16) + " C" + (fx - 152) + "," + (fy - 60) + " " + (fx - 120) + "," + (fy - 168) + " " + (fx - 60) + "," + (fy - 190) +
          " C" + (fx - 20) + "," + (fy - 202) + " " + (fx + 30) + "," + (fy - 202) + " " + (fx + 72) + "," + (fy - 188) +
          " C" + (fx + 130) + "," + (fy - 166) + " " + (fx + 152) + "," + (fy - 60) + " " + (fx + 150) + "," + (fy + 16) + " Z", "url(#kw-rockw)");
        h += P("M" + (fx + 40) + "," + (fy - 196) + " C" + (fx + 120) + "," + (fy - 170) + " " + (fx + 150) + "," + (fy - 60) + " " + (fx + 150) + "," + (fy + 16) + " L" + (fx + 60) + "," + (fy + 16) + " Z", "#5A3A20", op(.14));
        h += L("M" + (fx - 120) + "," + (fy - 90) + " C" + (fx - 90) + "," + (fy - 84) + " " + (fx - 60) + "," + (fy - 96) + " " + (fx - 34) + "," + (fy - 90), "#8A6040", 1.4, op(.4)) +
          L("M" + (fx + 40) + "," + (fy - 120) + " C" + (fx + 70) + "," + (fy - 114) + " " + (fx + 100) + "," + (fy - 124) + " " + (fx + 124) + "," + (fy - 116), "#8A6040", 1.4, op(.4));
        h += E(fx + 6, fy - 190, 96, 18, "url(#kw-jleaf)") + bush(fx - 70, fy - 184, 1.4, "deep") + bush(fx + 84, fy - 180, 1.3, "deep") + palm(fx - 40, fy - 190, .9);
        h += P("M" + (fx - 26) + "," + (fy - 192) + " L" + (fx + 26) + "," + (fy - 192) + " C" + (fx + 30) + "," + (fy - 120) + " " + (fx + 34) + "," + (fy - 50) + " " + (fx + 40) + "," + (fy + 10) +
          " L" + (fx - 40) + "," + (fy + 10) + " C" + (fx - 34) + "," + (fy - 50) + " " + (fx - 30) + "," + (fy - 120) + " " + (fx - 26) + "," + (fy - 192) + " Z", "url(#kw-fallg)", op(.95));
        h += anim("kw-flowdown", L("M" + (fx - 14) + "," + (fy - 188) + " L" + (fx - 18) + "," + (fy + 6) + " M" + (fx + 6) + "," + (fy - 188) + " L" + (fx + 8) + "," + (fy + 6) + " M" + (fx + 20) + "," + (fy - 180) + " L" + (fx + 28) + "," + (fy + 6), "#9BDDF2", 2, ' stroke-dasharray="14 18"'));
        h += E(fx, fy + 22, 130, 22, "url(#kw-sand)") + E(fx, fy + 20, 118, 18, "url(#kw-water)") + E(fx - 40, fy + 16, 30, 3, "#FFFFFF", op(.6)) +
          anim("kw-pulse", E(fx, fy + 8, 76, 16, "#FFFFFF", op(.55))) + rock(fx - 110, fy + 26, 1.1, true) + rock(fx + 104, fy + 28, 1.3, true);
        h += tree(-18, hz + 70, m === "P" ? 3 : 3.4, "deep") + tree(W + 18, hz + 84, m === "P" ? 2.8 : 3.2, "deep");
        var ceil = "";
        for (i = -8; i < W / 70 + 8; i++) ceil += C(i * 70, -50 + (Math.abs(i) % 3) * 26, 84, i % 2 ? "url(#kw-jdeep)" : "url(#kw-jleaf)");
        for (i = -8; i < W / 52 + 8; i++) ceil += C(i * 52 + 20, 40 + (Math.abs(i) % 2) * 22, 34, i % 3 ? "url(#kw-jleaf)" : "url(#kw-jdeep)");
        h += anim("kw-canopy", ceil);
        for (i = 0; i < 6; i++) h += anim("kw-vine" + (i % 2 ? " kw-vine--b" : ""), L("M" + (W * (.05 + i * .18)) + ",40 C" + (W * (.07 + i * .18)) + "," + (hz * .35) + " " + (W * (.03 + i * .18)) + "," + (hz * .5) + " " + (W * (.06 + i * .18)) + "," + (hz * .62 + (i % 3) * 22), "#2E7A45", 3) +
          E(W * (.06 + i * .18), hz * .42, 5, 2.6, "#5CC46E") + E(W * (.05 + i * .18), hz * .56, 5, 2.6, "#5CC46E") + C(W * (.06 + i * .18), hz * .62 + (i % 3) * 22, 3, i % 2 ? "#FF7B54" : "#FFB5D0"));
        h += anim("kw-rays", P("M" + (W * .18) + ",40 L" + (W * .3) + ",40 L" + (W * .62) + "," + (hz + 240) + " L" + (W * .46) + "," + (hz + 240) + " Z", "#FFF6C9", op(.2)) +
          P("M" + (W * .52) + ",60 L" + (W * .6) + ",60 L" + (W * .84) + "," + (hz + 200) + " L" + (W * .72) + "," + (hz + 200) + " Z", "#FFF6C9", op(.13)));
        h += P("M-900," + (hz + 14) + " C" + (W * .2) + "," + (hz + 2) + " " + (W * .5) + "," + (hz + 30) + " " + (W * .8) + "," + (hz + 12) + " S" + (W + 200) + "," + (hz + 10) + " " + (W + 900) + "," + (hz + 16) + " L" + (W + 900) + "," + (H + 900) + " L-900," + (H + 900) + " Z", "url(#kw-ground)");
        h += E(fx, fy + 22, 130, 20, "url(#kw-sand)") + E(fx, fy + 20, 118, 16, "url(#kw-water)") + E(fx - 40, fy + 16, 30, 3, "#FFFFFF", op(.6));
        h += P("M" + (fx - 40) + "," + (fy + 36) + " C" + (fx - 20) + "," + (fy + 120) + " " + (W * .6) + "," + (H * .75) + " " + (W * .52) + "," + (H + 300) + " L" + (W * .62) + "," + (H + 300) + " C" + (W * .7) + "," + (H * .75) + " " + (fx + 20) + "," + (fy + 120) + " " + (fx + 40) + "," + (fy + 36) + " Z", "#C9A36A", op(.35));
        h += patches(W, H, hz, 5, "#E6FFB8") + tufts(W, H, hz + 20, 21, ["#3E8A45", "#56A04E"], 54);
        h += fern(W * .02, hz + 40, 1.3) + fern(W * .98, hz + 50, 1.3, true) + fern(W * .42, hz + 36, .9) + bush(W * .7, hz + 34, 1.1, "deep");
        var bb = m === "P" ? [334, 612] : [74, 480];
        h += disc("rustle", anim("kw-d-critter", g(m === "P" ? monkey() : frog(), tr(bb[0], bb[1] - 8, 1.6))) + anim("kw-d-shake", bush(bb[0], bb[1], 1.4, "deep")));
        var tb = m === "P" ? [28, 470] : [958, 470];
        h += disc("fly", bigLeaf(tb[0], tb[1], 1.6, 10) + bigLeaf(tb[0] + 20, tb[1], 1.3, 40, "url(#kw-jdeep)") + anim("kw-d-bird", g(birdSmall("#FFC43D"), tr(tb[0] + 14, tb[1] - 74, 1.4))) + hitPad(tb[0] + 10, tb[1] - 50, 30, 40));
        h += bigLeaf(-30, H + 20, 2.6, 30) + bigLeaf(W + 30, H + 20, 2.6, -30, "url(#kw-jdeep)");
        h += butterfly(W * .4, hz + 70, 1.2, "#63C7FF", "kw-bfly--a") + butterfly(W * .8, hz + 150, 1, "#FFB020", "kw-bfly--b");
        return h;
      }
    },
    puzzle: {
      P: { hz: 262, spots: { mystery: [62, 370, .74], stone: [202, 420, 1], shapes: [108, 544, .85], treasure: [300, 530, .9], drums: [110, 712, .85], cave: [298, 716, .9] }, momo: [208, 636], mono: [202, 420] },
      L: { hz: 206, spots: { stone: [512, 340, 1], mystery: [300, 330, .85], shapes: [180, 436, .85], treasure: [376, 486, .9], drums: [650, 486, .85], cave: [846, 432, .85] }, momo: [516, 440], mono: [512, 340] },
      bg: function (W, H, hz, m, lay) {
        var h = "<defs>" + lg("kw-sky", 0, -60, 0, hz, [[0, "#6EC0FF"], [.7, "#BFE6FF"], [1, "#E8F8FF"]], true) +
          lg("kw-ground", 0, hz + 40, 0, H, [[0, "#C4EE98"], [.5, "#98D57C"], [1, "#78BF68"]], true) + "</defs>";
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
        h += C(W * .85, hz * .2, 110, "url(#kw-softglow)") + cloud(W * .22, hz * .26, 1, "kw-cloud--a") + cloud(W * .7, hz * .52, .7, "kw-cloud--b") + birds(W * .45, hz * .3, .9);
        h += floatIsle(W * .16, hz * .52, m === "P" ? .9 : 1.1, true) + floatIsle(W * .86, hz * .3, m === "P" ? .6 : .8, false);
        h += big(-900, hz, W + 1800, 60, "url(#kw-sea)") + anim("kw-wave", L("M-900," + (hz + 10) + " C0," + (hz + 6) + " " + (W * .5) + "," + (hz + 14) + " " + (W + 900) + "," + (hz + 10), "#FFFFFF", 1.6, op(.6)));
        h += at(W * .92, hz + 4, .7, E(0, 0, 44, 10, "url(#kw-rock)") + E(0, -6, 40, 8, "url(#kw-leaf)") + palm(8, -8, .7) + L("M-20,-8 L-20,-34", "#8D5A34", 1.4) + P("M-20,-34 L-6,-30 L-20,-26 Z", "#FF6B8A"));
        var gy = hz + 44;
        var shore = "M-900," + (gy + 24) + " C" + (W * .1) + "," + (gy - 12) + " " + (W * .4) + "," + (gy - 22) + " " + (W * .6) + "," + (gy - 14) + " S" + (W * .95) + "," + (gy + 8) + " " + (W + 900) + "," + (gy + 18) + " L" + (W + 900) + "," + (H + 900) + " L-900," + (H + 900) + " Z";
        h += g(P(shore, "url(#kw-sand)"), "translate(0 -12)") + P(shore, "url(#kw-ground)");
        h += patches(W, H, gy, 13) + tufts(W, H, gy + 10, 31);
        var mo = lay.mono, path = [[4, 188], [-12, 150], [8, 114], [-8, 80], [6, 48]];
        path.forEach(function (s, i) { h += E(mo[0] + s[0] + 3, mo[1] + s[1] + 3, 19 - i * 1.6, 6.5 - i * .7, "#6F8A5A", op(.35)) + E(mo[0] + s[0], mo[1] + s[1], 19 - i * 1.6, 6.5 - i * .7, ["#FF8FA3", "#8FD3FF", "#FFD166", "#9BE07A", "#C9A6FF"][i]) + E(mo[0] + s[0] - 5, mo[1] + s[1] - 2, 6 - i * .6, 1.6, "#FFFFFF", op(.5)); });
        // The glowing monolith itself is the "Thinking Stone" spot (SPOT.stone) — it launches a puzzle.
        h += C(mo[0], mo[1] - 70, 100, "url(#kw-glow)", ' class="kw-pulse"');
        h += palm(W * .04, gy + 36, 1.3) + palm(W * .96, gy + 46, 1.2, true) + flowers(W * .3, gy + 30, 1.2) + bush(W * .74, gy + 20, 1, "bloss");
        var cb = m === "P" ? [40, 650] : [60, 528];
        h += disc("rustle", anim("kw-d-critter", g(crab(), tr(cb[0] + 4, cb[1] - 6, 1.6))) + anim("kw-d-shake", rock(cb[0], cb[1], 1.3)));
        return h;
      }
    },
    castle: {
      P: { hz: 330, spots: { birdstory: [206, 470, .95], book: [110, 566, .9], tower: [304, 548, .82], wordpath: [128, 702, .85], lanterns: [302, 714, .9] }, momo: [212, 640], fountain: [206, 380] },
      L: { hz: 280, spots: { tower: [170, 456, .8], book: [380, 480, .9], birdstory: [512, 388, .95], lanterns: [650, 476, .85], wordpath: [846, 494, .85] }, momo: [560, 540], fountain: [822, 340] },
      bg: function (W, H, hz, m, lay) {
        var h = "<defs>" + lg("kw-sky", 0, -60, 0, hz, [[0, "#B2A4FF"], [.5, "#FFC8DC"], [1, "#FFE7B8"]], true) +
          lg("kw-ground", 0, hz, 0, H, [[0, "#F3E9DA"], [1, "#D6C3A6"]], true) + "</defs>";
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
        h += C(W * .8, hz * .3, 130, "url(#kw-softglow)") + cloud(W * .2, hz * .25, 1, "kw-cloud--a") + cloud(W * .64, hz * .12, .7, "kw-cloud--b") +
          stars([[W * .1, 30, 1.4], [W * .35, 20, 1.1], [W * .9, 60, 1.3], [W * .6, 44, 1]]);
        h += P("M-900," + (hz + 6) + " C" + (W * .05) + "," + (hz - 60) + " " + (W * .3) + "," + (hz - 70) + " " + (W * .5) + "," + (hz - 40) + " S" + (W * .9) + "," + (hz - 80) + " " + (W + 900) + "," + (hz - 10) + " L" + (W + 900) + "," + (hz + 60) + " L-900," + (hz + 60) + " Z", "#C9C0E8");
        h += P("M-900," + (hz + 8) + " C" + (W * .2) + "," + (hz - 60) + " " + (W * .8) + "," + (hz - 60) + " " + (W + 900) + "," + (hz + 8) + " Z", "url(#kw-hill)");
        h += disc("sparkle", at(W * .5, hz - 18, m === "P" ? 1.35 : 1.25, LM.castle()) + anim("kw-d-spark", sparkle(W * .5 - 40, hz - 150, 1.2, "#FFE27A") + sparkle(W * .5 + 44, hz - 120, 1) + sparkle(W * .5, hz - 220, 1.3)));
        h += big(-900, hz + 4, W + 1800, H + 900, "url(#kw-ground)");
        h += P("M-900," + (hz + 4) + " L" + (W + 900) + "," + (hz + 4) + " L" + (W + 900) + "," + (hz + 34) + " C" + (W * .7) + "," + (hz + 40) + " " + (W * .3) + "," + (hz + 40) + " -900," + (hz + 34) + " Z", "url(#kw-hill)");
        for (var r = 0; r < 7; r++) {
          var y = hz + 46 + r * r * 13 + r * 12, sz = 10 + r * 4.5;
          for (var c = -12; c < W / (sz * 2.4) + 12; c++) h += E(c * sz * 2.4 + (r % 2) * sz * 1.2, y, sz, 3 + r * 1.3, "#FFFFFF", op(.2)) + E(c * sz * 2.4 + (r % 2) * sz * 1.2, y + 2 + r * .6, sz, 3 + r * 1.3, "#B79F82", op(.14));
        }
        h += P("M" + (W * .47) + "," + (hz + 20) + " L" + (W * .53) + "," + (hz + 20) + " L" + (W * .7) + "," + (H + 200) + " L" + (W * .3) + "," + (H + 200) + " Z", "#FFFFFF", op(.18));
        h += hedge(-60, hz + 64, m === "P" ? 110 : 220, 1) + hedge(W - (m === "P" ? 50 : 160), hz + 64, m === "P" ? 110 : 220, 1);
        h += lampPost(W * .3, hz + 70, 1.1) + lampPost(W * .7, hz + 70, 1.1);
        var fo = lay.fountain;
        h += fountain(fo[0], fo[1], m === "P" ? .9 : 1);
        h += tree(-30, H * .82, 1.3) + tree(W + 30, H * .84, 1.3, "bloss") + bush(W * .04, hz + 20, 1.2, "bloss") + bush(W * .96, hz + 24, 1.2, "bloss");
        var hb = m === "P" ? [44, 452] : [40, 380];
        h += disc("rustle", anim("kw-d-critter", g(bunny(), tr(hb[0] + 4, hb[1] - 8, 1.3))) + anim("kw-d-shake", bush(hb[0], hb[1], 1.25)));
        h += butterfly(W * .35, hz + 90, 1.1, "#B79CFF", "kw-bfly--a");
        return h;
      }
    },
    ocean: {
      P: { hz: 256, spots: { boatspot: [282, 262, .85], reef: [114, 684, 1.3], shells: [296, 720, .95] }, momo: [122, 236] },
      L: { hz: 196, spots: { boatspot: [700, 202, .85], reef: [300, 504, .95], shells: [742, 524, .9] }, momo: [230, 178] },
      bg: function (W, H, hz, m) {
        var bed = H - (m === "P" ? 150 : 110);
        var h = "<defs>" + lg("kw-sky", 0, -60, 0, hz, [[0, "#7CC8FF"], [1, "#E6F8FF"]], true) +
          lg("kw-deep", 0, hz, 0, bed + 60, [[0, "#72E0EF"], [.45, "#2FA6D8"], [1, "#1A6CAA"]], true) + "</defs>";
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
        h += C(W * .82, hz * .3, 100, "url(#kw-softglow)") + C(W * .82, hz * .3, 18, "#FFF7D6") + cloud(W * .5, hz * .35, 1, "kw-cloud--a") + cloud(W * .15, hz * .2, .7, "kw-cloud--b") + birds(W * .62, hz * .5, .9);
        h += P("M" + (W * .55) + "," + (hz + 1) + " C" + (W * .7) + "," + (hz - 22) + " " + (W * .85) + "," + (hz - 26) + " " + (W + 900) + "," + (hz - 8) + " L" + (W + 900) + "," + (hz + 2) + " Z", "#9FC7B8", op(.8));
        h += big(-900, hz, W + 1800, H + 900, "url(#kw-deep)");
        h += anim("kw-rays", P("M" + (W * .2) + "," + hz + " L" + (W * .32) + "," + hz + " L" + (W * .5) + "," + bed + " L" + (W * .3) + "," + bed + " Z", "#E6FBFF", op(.16)) +
          P("M" + (W * .55) + "," + hz + " L" + (W * .64) + "," + hz + " L" + (W * .82) + "," + bed + " L" + (W * .66) + "," + bed + " Z", "#E6FBFF", op(.12)));
        h += anim("kw-wave", L("M-900," + (hz + 2) + " C0," + (hz - 4) + " " + (W * .5) + "," + (hz + 6) + " " + (W + 900) + "," + hz, "#FFFFFF", 3, op(.85))) +
          anim("kw-wave", L("M-900," + (hz + 14) + " C0," + (hz + 10) + " " + (W * .5) + "," + (hz + 18) + " " + (W + 900) + "," + (hz + 12), "#FFFFFF", 1.2, op(.4)), delay(-1.4));
        var isle = m === "P" ? [80, hz] : [150, hz];
        h += at(isle[0], isle[1], m === "P" ? 1 : 1.15,
          P("M-120,6 C-110,-14 -70,-26 -20,-28 C30,-30 76,-20 96,6 C60,18 -80,18 -120,6 Z", "url(#kw-rock)") +
          P("M-96,-12 C-60,-26 20,-30 70,-18 C40,-22 -40,-20 -96,-12 Z", "#FFFFFF", op(.4)) + E(-10, -24, 70, 7, "url(#kw-sand)") +
          lighthouse(-62, -22, 1.15) + palm(56, -20, .7) + flowers(10, -24, .8));
        h += P("M-900," + (bed + 20) + " C" + (W * .2) + "," + (bed - 16) + " " + (W * .5) + "," + (bed + 10) + " " + (W * .7) + "," + (bed - 6) + " S" + (W + 200) + "," + (bed + 6) + " " + (W + 900) + "," + bed + " L" + (W + 900) + "," + (H + 900) + " L-900," + (H + 900) + " Z", "url(#kw-sand)");
        for (var i = -4; i < W / 60 + 4; i++) h += L("M" + (i * 60) + "," + (bed + 40 + (i % 2) * 14) + " q15,-5 30,0 t30,0", "#D9B77C", 1.4, op(.6));
        h += coral(W * .04, bed + 14, 1.2, "#FF8FA3") + fanCoral(W * .1, bed + 18, 1.1, "#B79CFF") + coral(W * .9, bed + 10, 1.1, "#FFB870") + fanCoral(W * .82, bed + 16, 1.2, "#FF6B8A") +
          coral(W * .55, bed + 16, .9, "#C9A6FF") + rock(W * .5, bed + 22, 1.2) + rock(W * .02, bed + 24, 1);
        h += anim("kw-seaweed", L("M" + (W * .02) + "," + (bed + 10) + " C" + (W * 0) + "," + (bed - 40) + " " + (W * .05) + "," + (bed - 70) + " " + (W * .02) + "," + (bed - 120), "#2FA36B", 6)) +
          anim("kw-seaweed kw-seaweed--b", L("M" + (W * .97) + "," + (bed + 6) + " C" + (W * .99) + "," + (bed - 40) + " " + (W * .94) + "," + (bed - 70) + " " + (W * .97) + "," + (bed - 110), "#3FB67B", 6)) +
          anim("kw-seaweed", L("M" + (W * .66) + "," + (bed + 12) + " C" + (W * .64) + "," + (bed - 24) + " " + (W * .69) + "," + (bed - 40) + " " + (W * .66) + "," + (bed - 70), "#2FA36B", 5), delay(-1));
        var fy = (hz + bed) / 2;
        h += anim("kw-swim-slow", g(turtle(), tr(W * .5, fy + 70, m === "P" ? 1.1 : 1.3)));
        h += disc("fish", anim("kw-school", g(fish("#FFB020", 1.4), tr(W * .6, fy - 30)) + g(fish("#FFB020", 1.2), tr(W * .6 + 30, fy - 14)) + g(fish("#FFB020", 1.1), tr(W * .6 + 10, fy + 4)) + g(fish("#FFC857", 1), tr(W * .6 + 44, fy + 10))) +
          hitPad(W * .6 + 18, fy - 8, 48, 36));
        h += anim("kw-swim", g(fish("#FF6B8A", 1.6), tr(W * .25, fy - 60)));
        h += anim("kw-bubbles", C(W * .3, bed - 40, 4, "none", ' stroke="#E6FBFF" stroke-width="1.4"') + C(W * .32, bed - 70, 3, "none", ' stroke="#E6FBFF" stroke-width="1.2"'));
        var cl = m === "P" ? [210, bed + 34] : [520, bed + 34];
        h += disc("sparkle", E(cl[0], cl[1], 20, 6, "#B79CFF") + P("M" + (cl[0] - 20) + "," + cl[1] + " C" + (cl[0] - 18) + "," + (cl[1] - 20) + " " + (cl[0] + 18) + "," + (cl[1] - 20) + " " + (cl[0] + 20) + "," + cl[1] + " Z", "#CDB8FF") +
          C(cl[0], cl[1] - 4, 4, "#FFFFFF") + anim("kw-d-spark", sparkle(cl[0] - 12, cl[1] - 26, 1) + sparkle(cl[0] + 14, cl[1] - 20, .8, "#FFE27A")));
        return h;
      }
    },
    lab: {
      P: { hz: 430, spots: { computer: [118, 580, .85], jar: [302, 580, .9], blueprint: [206, 718, .85] }, momo: [336, 712] },
      L: { hz: 310, spots: { computer: [250, 460, .85], jar: [520, 440, .9], blueprint: [790, 480, .85] }, momo: [650, 492] },
      bg: function (W, H, hz, m, lay) {
        var h = "<defs>" + lg("kw-sky", 0, 0, 0, hz, [[0, "#FBF6FF"], [1, "#E9E1FB"]], true) +
          lg("kw-ground", 0, hz, 0, H, [[0, "#DCD3F4"], [1, "#B9ADE2"]], true) +
          lg("kw-tube", 0, 0, 1, 0, [[0, "#9CF0C0", .9], [.5, "#E9FFF1", .95], [1, "#62D596", .9]]) + "</defs>";
        var i;
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
        h += big(-900, hz - 90, W + 1800, 90, "#DCD0F6") + L("M-900," + (hz - 90) + " L" + (W + 900) + "," + (hz - 90), "#C7B8EE", 4);
        for (i = -12; i < W / 50 + 12; i++) h += L("M" + (i * 50) + "," + (hz - 86) + " L" + (i * 50) + "," + hz, "#CBBEF0", 1.4);
        var win = m === "P" ? [[62, 140], [338, 140]] : [[120, 110], [880, 110]];
        win.forEach(function (w) {
          h += C(w[0], w[1], 48, "#B6A9E6") + C(w[0], w[1], 41, "#9FD9FF") + E(w[0], w[1] + 14, 41, 20, "#CDEFFF") +
            at(w[0] - 8, w[1] - 6, .5, g(E(2, 7, 34, 8, "#FFFFFF", op(.5)) + C(-20, 0, 13, "#FFFFFF") + C(-3, -8, 17, "#FFFFFF") + C(16, -2, 13, "#FFFFFF"))) +
            L("M" + (w[0] - 41) + "," + w[1] + " L" + (w[0] + 41) + "," + w[1] + " M" + w[0] + "," + (w[1] - 41) + " L" + w[0] + "," + (w[1] + 41), "#B6A9E6", 3);
        });
        var cx = W * .5, cy = hz - 96;
        h += C(cx, cy - 90, 120, "url(#kw-softglow)") +
          R(cx - 34, cy - 196, 68, 16, 6, "url(#kw-metal)") + R(cx - 28, cy - 180, 56, 156, 20, "url(#kw-tube)") +
          anim("kw-bubbles", C(cx - 8, cy - 60, 5, "#FFFFFF", op(.8)) + C(cx + 10, cy - 90, 4, "#FFFFFF", op(.7)) + C(cx - 4, cy - 124, 3.4, "#FFFFFF", op(.7))) +
          L("M" + (cx - 18) + "," + (cy - 170) + " L" + (cx - 18) + "," + (cy - 40), "#FFFFFF", 3, op(.6)) +
          R(cx - 40, cy - 26, 80, 26, 8, "url(#kw-metal)") + C(cx - 20, cy - 13, 4, "#FF6B8A", ' class="kw-blink"') + C(cx, cy - 13, 4, "#FFB020", ' class="kw-blink" style="' + delay(.4) + '"') + C(cx + 20, cy - 13, 4, "#38C172", ' class="kw-blink" style="' + delay(.8) + '"');
        h += L("M" + (cx - 34) + "," + (cy - 150) + " C" + (cx - 90) + "," + (cy - 150) + " " + (cx - 90) + "," + (cy - 220) + " -900," + (cy - 220), "#C9D3EE", 9) +
          L("M" + (cx + 34) + "," + (cy - 110) + " C" + (cx + 90) + "," + (cy - 110) + " " + (cx + 90) + "," + (cy - 220) + " " + (W + 900) + "," + (cy - 220), "#C9D3EE", 9) +
          anim("kw-flow", L("M" + (cx - 34) + "," + (cy - 150) + " C" + (cx - 90) + "," + (cy - 150) + " " + (cx - 90) + "," + (cy - 220) + " -900," + (cy - 220), "#62D596", 3, ' stroke-dasharray="8 14"')) +
          anim("kw-flow", L("M" + (cx + 34) + "," + (cy - 110) + " C" + (cx + 90) + "," + (cy - 110) + " " + (cx + 90) + "," + (cy - 220) + " " + (W + 900) + "," + (cy - 220), "#FF8FC4", 3, ' stroke-dasharray="8 14"'));
        var bd = m === "P" ? [W * .5, hz - 196] : [W * .27, hz - 170];
        if (m === "L") {
          h += R(bd[0] - 90, bd[1] - 50, 180, 110, 8, "#8A5A36") + R(bd[0] - 82, bd[1] - 42, 164, 94, 5, "#2F6B55") +
            C(bd[0] - 30, bd[1], 8, "#FFFFFF", op(.85)) + E(bd[0] - 30, bd[1], 28, 10, "none", ' stroke="#FFFFFF" stroke-width="2" opacity=".85"') +
            E(bd[0] - 30, bd[1], 28, 10, "none", ' stroke="#FFFFFF" stroke-width="2" opacity=".85" transform="rotate(60 ' + (bd[0] - 30) + " " + bd[1] + ')"') +
            E(bd[0] - 30, bd[1], 28, 10, "none", ' stroke="#FFFFFF" stroke-width="2" opacity=".85" transform="rotate(-60 ' + (bd[0] - 30) + " " + bd[1] + ')"') +
            P("M" + (bd[0] + 40) + "," + (bd[1] + 30) + " l10,-40 l10,40 Z M" + (bd[0] + 30) + "," + (bd[1] + 30) + " l40,0", "none", ' stroke="#FFE27A" stroke-width="2.4" stroke-linejoin="round"');
        }
        (m === "L" ? [W * .7, W * .88] : [62, 338]).forEach(function (x) {
          if (m === "P") { h += R(x - 44, hz - 150, 88, 6, 2, "url(#kw-wood)") + flask(x - 24, hz - 150, 1.2, "#FF6B8A") + flask(x + 2, hz - 150, 1.45, "#38C172") + flask(x + 26, hz - 150, 1.1, "#FFB020"); return; }
          h += R(x - 60, hz - 150, 120, 6, 2, "url(#kw-wood)") + flask(x - 36, hz - 150, 1.3, "#FF6B8A") + flask(x, hz - 150, 1.6, "#38C172") + flask(x + 36, hz - 150, 1.2, "#FFB020");
        });
        for (i = 0; i < (m === "P" ? 2 : 3); i++) {
          var lx = m === "P" ? [W * .3, W * .7][i] : [W * .2, W * .5, W * .8][i], ly = m === "P" ? 48 : 30;
          h += L("M" + lx + ",-6 L" + lx + "," + ly, "#8C84AE", 2) + P("M" + (lx - 16) + "," + ly + " L" + (lx + 16) + "," + ly + " L" + (lx + 10) + "," + (ly - 10) + " L" + (lx - 10) + "," + (ly - 10) + " Z", "#6C4BD6") +
            C(lx, ly + 2, 6, "#FFE9A8") + P("M" + (lx - 14) + "," + (ly + 4) + " L" + (lx + 14) + "," + (ly + 4) + " L" + (lx + 90) + "," + hz + " L" + (lx - 90) + "," + hz + " Z", "#FFF3C4", op(.12));
        }
        h += big(-900, hz, W + 1800, H + 900, "url(#kw-ground)");
        for (i = -10; i < 20; i++) h += L("M" + (W * .5 + i * 60) + "," + hz + " L" + (W * .5 + i * 140) + "," + (H + 200), "#FFFFFF", 1.2, op(.25));
        h += L("M-900," + (hz + 80) + " L" + (W + 900) + "," + (hz + 80) + " M-900," + (hz + 200) + " L" + (W + 900) + "," + (hz + 200), "#FFFFFF", 1.2, op(.25));
        Object.keys(lay.spots).forEach(function (k) { var sp = lay.spots[k]; h += E(sp[0] + 6, sp[1] + 4, 80 * sp[2], 16 * sp[2], "#FFFFFF", op(.28)); });
        var rb = m === "P" ? [58, 690] : [90, 488];
        h += disc("beep", robot(rb[0], rb[1], 2.2) + anim("kw-d-spark", sparkle(rb[0] + 10, rb[1] - 110, 1, "#7FE3FF")));
        var bk = [cx, cy - 30];
        h += disc("bubbles", hitPad(bk[0], bk[1] - 60, 34, 80) + anim("kw-d-bub", C(bk[0], bk[1] - 40, 5, "none", ' stroke="#FFFFFF" stroke-width="1.8"') + C(bk[0] + 8, bk[1] - 70, 4, "none", ' stroke="#FFFFFF" stroke-width="1.6"') + C(bk[0] - 6, bk[1] - 100, 6, "none", ' stroke="#FFFFFF" stroke-width="1.8"')));
        return h;
      }
    },
    space: {
      P: { hz: 420, spots: { orrery: [212, 520, .85], telescope: [104, 560, .9], rocket: [312, 590, .82], panel: [110, 714, .85], scale: [292, 720, .85] }, momo: [210, 640] },
      L: { hz: 330, spots: { telescope: [180, 456, .9], panel: [384, 494, .85], scale: [618, 494, .85], orrery: [748, 470, .85], rocket: [872, 484, .85] }, momo: [515, 476] },
      bg: function (W, H, hz, m) {
        var h = "<defs>" + lg("kw-sky", 0, 0, 0, hz, [[0, "#EFEBFF"], [1, "#E1DCFA"]], true) +
          lg("kw-ground", 0, hz, 0, H, [[0, "#D8D3F4"], [1, "#B3AADF"]], true) +
          lg("kw-space", 0, 30, 0, hz - 40, [[0, "#2C2A8C"], [.6, "#5B45C9"], [1, "#8A6BE8"]], true) + "</defs>";
        var wx = -900, ww = W + 1800, wy = 34, wh = hz - 76, i;
        var sp = R(wx, wy, ww, wh, 0, "url(#kw-space)") +
          E(W * .25, wy + wh * .5, W * .4, wh * .4, "#FF9CC2", op(.22)) + E(W * .75, wy + wh * .3, W * .35, wh * .35, "#7FE3FF", op(.18));
        var sl = [];
        for (i = 0; i < 30; i++) sl.push([(i * 97) % (W + 400) - 200, wy + 12 + (i * 53) % (wh - 24), 1 + (i % 3) * .5, i % 4 ? "#FFFFFF" : "#FFE9A8"]);
        sp += stars(sl);
        sp += C(W * .72, wy + wh * .52, m === "P" ? 58 : 80, "url(#kw-planet2)") + E(W * .72, wy + wh * .52, m === "P" ? 96 : 130, m === "P" ? 16 : 22, "none", ' stroke="#FFD6A5" stroke-width="5" opacity=".85" transform="rotate(-14 ' + (W * .72) + " " + (wy + wh * .52) + ')"') +
          C(W * .2, wy + wh * .3, 16, "#EEF1FF") + C(W * .19, wy + wh * .28, 4, "#D4DAF2") +
          at(W * .38, wy + wh * .72, m === "P" ? .5 : .7, g(LM.space().replace('url(#kw-portal)', 'none'))) +
          anim("kw-comet", L("M0,0 L-60,-14", "#FFFFFF", 2.4, op(.8)) + C(0, 0, 3, "#FFFFFF"));
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)");
        h += disc("twinkle", sp + hitPad(W * .45, wy + wh * .4, W * .3, wh * .35) + anim("kw-d-spark", sparkle(W * .4, wy + wh * .3, 1.4) + sparkle(W * .5, wy + wh * .55, 1.1, "#FFE27A") + sparkle(W * .32, wy + wh * .7, .9)));
        var step = m === "P" ? 200 : 250;
        for (i = -5; i < W / step + 5; i++) h += R(i * step - 7, wy - 6, 14, wh + 10, 4, "#CFC8F1") + R(i * step - 3, wy - 6, 4, wh + 10, 2, "#FFFFFF", op(.5));
        h += R(wx, wy - 14, ww, 16, 0, "#C8C0EE") + R(wx, wy + wh - 4, ww, 18, 0, "#C8C0EE") + R(wx, wy + wh + 10, ww, 3, 0, "#FFFFFF", op(.6));
        for (i = -10; i < 22; i++) h += R(W * .5 + i * 90 - 30, hz - 30, 60, 22, 5, "#D4CDF3") + C(W * .5 + i * 90 - 18, hz - 19, 3, i % 3 ? "#7FE3FF" : "#FF8FC4", ' class="kw-blink" style="' + delay((i % 5) * .4) + '"');
        h += big(-900, hz, W + 1800, H + 900, "url(#kw-ground)");
        for (i = -10; i < 20; i++) h += L("M" + (W * .5 + i * 70) + "," + hz + " L" + (W * .5 + i * 150) + "," + (H + 200), "#FFFFFF", 1.2, op(.22));
        h += anim("kw-pulse", L("M-900," + (hz + 120) + " L" + (W + 900) + "," + (hz + 120), "#7FE3FF", 2, op(.5)));
        return h;
      }
    }
  };

  /* =====================================================================
     STORY PLACES (Interactive Story Engine) — full-screen backdrops in the
     same light. Contract with js/engine/storyEngine.js:
       <g data-hot="key">     something the child can tap (no transform of its own)
       <g data-anchor="key">  where a character stands (feet = the point)
       <g data-reveal="key">  hidden until the story reveals it
     Portrait keeps everything tappable above y≈560 and landscape above y≈400,
     leaving the bottom for the dialogue bar.
     ===================================================================== */
  function anchorPt(key, x, y) { return '<g data-anchor="' + key + '"><circle cx="' + n(x) + '" cy="' + n(y) + '" r="1" fill="none"/></g>'; }
  function hotG(key, inner, react) { return g(inner, "", "kw-hot" + (react ? " react-" + react : ""), ' data-hot="' + key + '"'); }
  function revealG(key, inner) { return g(inner, "", "kw-reveal", ' data-reveal="' + key + '"'); }
  function mushroom(x, y, s) {
    return at(x, y, s, shadow(4, 1, 9, 2.4) + R(-2.4, -9, 4.8, 9, 2, "#F4EDE2") +
      P("M-10,-8 C-10,-18 10,-18 10,-8 Z", "url(#kw-red)") + C(-4, -13, 1.6, "#FFFFFF") + C(3, -11, 1.3, "#FFFFFF") + C(5, -15, 1.1, "#FFFFFF"));
  }
  function feather(x, y, s, rot) {
    return at(x, y, s, P("M0,0 C-4,-8 -2,-18 4,-24 C8,-16 6,-6 0,0 Z", "#5FA8F5") + L("M0,0 L4,-24", "#2F6CC0", .9), rot);
  }
  function nest(x, y, s) {
    var tw = "";
    for (var i = 0; i < 7; i++) tw += L("M" + (-30 + i * 9) + "," + (-4 + (i % 2) * 3) + " Q" + (-24 + i * 9) + "," + (-10 - (i % 3) * 2) + " " + (-16 + i * 9) + "," + (-3 + (i % 2) * 2), "#7A4B2A", 1.6, op(.8));
    return at(x, y, s, E(4, 3, 36, 7, "#23304A", op(.2)) + P("M-34,-8 C-32,8 32,8 34,-8 C20,-2 -20,-2 -34,-8 Z", "url(#kw-wood)") +
      E(0, -8, 34, 9, "#8D5A34") + E(0, -9, 26, 6, "#5E3A20") + tw);
  }
  function babyBird(x, y, s, c) {
    return at(x, y, s, E(0, -6, 9, 8, c || "#8FCBFF") + C(0, -15, 7, c || "#8FCBFF") + C(-2.4, -16, 1.4, "#1B1840") + C(2.4, -16, 1.4, "#1B1840") +
      P("M-3,-12 L3,-12 L0,-7 Z", "#F2A43A"));
  }
  function forestBase(W, H, hz, m, seed) {
    var h = "<defs>" + lg("kw-sky", 0, -60, 0, hz, [[0, "#CFEFD8"], [.6, "#F1F8DA"], [1, "#FFF1CC"]], true) +
      lg("kw-ground", 0, hz, 0, H, [[0, "#A9DB86"], [.5, "#7DBF6A"], [1, "#5A9E55"]], true) + "</defs>", i;
    h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)") + C(W * .7, hz * .35, 150, "url(#kw-softglow)");
    for (i = -8; i < W / 60 + 8; i++) h += C(i * 60 + 20, hz - 60 - (Math.abs(i) % 3) * 18, 60, "#B6DDB4");
    for (i = -8; i < W / 52 + 8; i++) h += C(i * 52, hz - 22 - (Math.abs(i + seed) % 3) * 12, 44, "#8CCB8E");
    h += big(-900, hz - 6, W + 1800, H + 900, "url(#kw-ground)");
    h += patches(W, H, hz, seed) + tufts(W, H, hz + 16, seed + 3, ["#4E9444", "#63AD57"], 50);
    h += tree(-30, hz + 90, m === "P" ? 2.6 : 3, "deep") + tree(W + 30, hz + 100, m === "P" ? 2.4 : 2.8, "deep") + pine(W * .08, hz + 8, 1.2) + pine(W * .92, hz + 10, 1.1);
    var ceil = "";
    for (i = -6; i < W / 90 + 6; i++) ceil += C(i * 90, -70 + (Math.abs(i) % 3) * 22, 80, i % 2 ? "url(#kw-jdeep)" : "url(#kw-jleaf)");
    h += anim("kw-canopy", ceil);
    h += anim("kw-rays", P("M" + (W * .55) + ",-40 L" + (W * .68) + ",-40 L" + (W * .9) + "," + (hz + 220) + " L" + (W * .7) + "," + (hz + 220) + " Z", "#FFF6C9", op(.18)));
    h += butterfly(W * .3, hz + 50, 1.1, "#FFB020", "kw-bfly--a") + flowers(W * .12, hz + 40, 1.3) + flowers(W * .86, hz + 60, 1.2);
    return h;
  }

  /* ---- garden helpers for "The Garden Helpers" story (Change #13) ---- */
  function bee(x, y, s) {            // a honey bee: striped body, see-through wings
    return at(x, y, s, anim("st-hover",
      anim("kw-wings", E(-2, -8, 5.6, 3.6, "#FFFFFF", op(.85)) + E(5, -8.6, 5.6, 3.6, "#E3F4FF", op(.8))) +
      E(0, 0, 9.6, 6.4, "#FFC93C") + E(-1, -2.4, 6, 2.4, "#FFE79A", op(.7)) +
      R(-4.2, -6, 2.6, 12, 1.2, "#2B2151") + R(1.2, -6.2, 2.6, 12.4, 1.2, "#2B2151") +
      P("M9.2,-1.2 L13.6,.2 L9.2,1.6 Z", "#2B2151") +
      C(-10, -.6, 4.4, "#2B2151") + C(-11.4, -1.8, 1.1, "#FFFFFF") +
      L("M-11.6,-4 Q-14,-9 -11,-11.6", "#2B2151", .9) + L("M-9.4,-4.4 Q-10,-10 -7,-11.8", "#2B2151", .9)));
  }
  function ladybug(x, y, s) {        // seen from above: red shell, black spots and head
    return at(x, y, s,
      shadow(0, 7, 10, 2.2) + C(-9.4, 0, 4.4, "#2B2151") + C(-11, -1.4, 1, "#FFFFFF") + C(-11, 1.4, 1, "#FFFFFF") +
      E(0, 0, 10, 7.6, "#E8433A") + L("M-5.6,0 L10,0", "#2B2151", 1) +
      C(-1.6, -3.6, 1.9, "#2B2151") + C(4.6, -3.4, 1.7, "#2B2151") + C(-1.4, 3.6, 1.8, "#2B2151") + C(4.8, 3.2, 1.6, "#2B2151") +
      E(1.6, -4.8, 4, 1.6, "#FFFFFF", op(.45)));
  }
  function dragonfly(x, y, s) {      // long blue body, big eyes, two pairs of clear wings
    return at(x, y, s, anim("st-hover st-hover--b",
      anim("kw-wings", P("M0,-2 C5,-11 15,-13 21,-10 C14,-7 6,-4 0,-2 Z", "#EAF8FF", op(.85)) + P("M1,-1 C8,-6 17,-5 21,-2 C14,-1 7,0 1,-1 Z", "#EAF8FF", op(.7)) +
        P("M0,-2 C-3,-11 -11,-13 -15,-10 C-10,-7 -5,-4 0,-2 Z", "#EAF8FF", op(.85))) +
      R(2, -1.2, 24, 2.4, 1.2, "#2F8FD0") + R(8, -1.2, 1, 2.4, 0, "#1F6FA8") + R(14, -1.2, 1, 2.4, 0, "#1F6FA8") + R(20, -1.2, 1, 2.4, 0, "#1F6FA8") +
      E(0, 0, 4.4, 3.2, "#2F8FD0") + C(-5.4, -.4, 3.2, "#1F6FA8") + C(-6.4, -1.4, 1.6, "#7DE0FF") + C(-6.8, -1.8, .5, "#FFFFFF")));
  }
  function caterpillar(x, y, s) {    // a little green caterpillar munching along a leaf
    var h = "";
    for (var i = 0; i < 6; i++) h += C(-12 + i * 4.6, -2.6 - (i % 2) * 1.4, 3, i % 2 ? "#7BC74D" : "#5DB33F");
    return at(x, y, s, h + C(14, -4.4, 3.6, "#4FA236") + C(15.2, -5.4, .9, "#2B2151") +
      L("M14.2,-7.8 L13.2,-10.8 M16,-7.6 L17,-10.4", "#2B2151", .8));
  }
  function pond(x, y, s) {
    return at(x, y, s,
      E(0, 0, 64, 19, "url(#kw-sand)") + E(0, -2, 58, 15, "url(#kw-water)") +
      L("M-38,-6 q8,-3 16,0 t16,0", "#FFFFFF", 1.6, op(.7)) + L("M6,4 q8,-3 16,0 t16,0", "#FFFFFF", 1.2, op(.5)) +
      E(-26, 3, 9, 3.2, "#5CB564") + C(-22, 2, 1.8, "#FF8FB0") + E(30, -4, 7, 2.6, "#5CB564") +
      L("M52,-6 C51,-20 54,-30 52,-42 M57,-4 C58,-16 56,-26 59,-36 M47,-4 C46,-14 48,-22 45,-30", "#3E8A45", 2.4) +
      E(52, -44, 2, 5, "#8A5A36") + E(59, -38, 1.8, 4.6, "#8A5A36"));
  }

  var STORY_PLACES = {
    glade: {
      P: { hz: 290, stump: [262, 468], bird: [262, 404], momo: [112, 536] },
      L: { hz: 220, stump: [640, 360], bird: [640, 298], momo: [372, 404] },
      bg: function (W, H, hz, m, lay) {
        var s = lay.stump;
        return forestBase(W, H, hz, m, 7) + mushroom(W * .2, hz + 70, 1.4) + mushroom(W * .24, hz + 78, 1) + rock(W * .9, hz + 90, 1.2) +
          hotG("stump", at(s[0], s[1], 1.3,
            shadow(10, 2, 46, 8) + P("M-34,0 C-36,-20 -32,-44 -30,-54 L30,-54 C32,-44 36,-20 36,0 Z", "url(#kw-trunk)") +
            E(0, -54, 30, 9, "#D9A36C") + E(0, -54, 22, 6, "#C08A55", op(.8)) + E(0, -54, 12, 3.4, "#A8703F", op(.8)) +
            P("M-34,0 C-40,-4 -44,-2 -46,4 L-26,4 Z", "#7A4B2A") + P("M34,0 C40,-4 44,-2 46,4 L26,4 Z", "#7A4B2A") +
            E(-18, -30, 14, 6, "#5CB564", op(.8)) + anim("kw-d-shake", bush(20, -50, 1.1)) + flowers(-10, 0, .9)), "rustle") +
          anchorPt("bird", lay.bird[0], lay.bird[1]) + anchorPt("momo", lay.momo[0], lay.momo[1]);
      }
    },
    fork: {
      P: { hz: 270, forest: [104, 430], river: [296, 430], sign: [208, 500], bird: [200, 330], momo: [200, 616] },
      L: { hz: 210, forest: [290, 340], river: [710, 340], sign: [500, 310], bird: [500, 250], momo: [500, 420] },
      bg: function (W, H, hz, m, lay) {
        var f = lay.forest, r = lay.river, cx = (f[0] + r[0]) / 2, h = forestBase(W, H, hz, m, 11);
        h += P("M" + (cx - 40) + "," + (H + 300) + " C" + (cx - 30) + "," + (H * .8) + " " + (cx - 10) + "," + (f[1] + 90) + " " + cx + "," + (f[1] + 60) + " L" + (cx + 20) + "," + (f[1] + 60) + " C" + (cx + 30) + "," + (f[1] + 90) + " " + (cx + 50) + "," + (H * .8) + " " + (cx + 60) + "," + (H + 300) + " Z", "url(#kw-sand)", op(.95));
        h += hotG("forestPath",
          P("M" + (cx - 4) + "," + (f[1] + 64) + " C" + (cx - 40) + "," + (f[1] + 50) + " " + (f[0] + 30) + "," + (f[1] + 10) + " " + (f[0] + 6) + "," + (f[1] - 14) + " L" + (f[0] - 24) + "," + (f[1] - 10) + " C" + (f[0] - 4) + "," + (f[1] + 20) + " " + (cx - 60) + "," + (f[1] + 64) + " " + (cx - 30) + "," + (f[1] + 84) + " Z", "url(#kw-sand)") +
          at(f[0], f[1] - 10, 1, P("M-60,0 C-62,-60 -40,-110 0,-116 C40,-110 62,-60 60,0 Z", "#1E5A3E", op(.9)) + E(0, -8, 30, 6, "#C8F59A", op(.3))) +
          tree(f[0] - 70, f[1] + 6, 1.6, "deep") + tree(f[0] + 64, f[1] + 2, 1.5, "deep") + pine(f[0] - 20, f[1] - 70, 1) +
          anim("kw-flag", at(f[0] + 40, f[1] - 40, 1, birds(0, 0, .8))), "shine");
        h += hotG("riverPath",
          P("M" + (cx + 18) + "," + (r[1] + 64) + " C" + (cx + 50) + "," + (r[1] + 50) + " " + (r[0] - 30) + "," + (r[1] + 10) + " " + (r[0] - 6) + "," + (r[1] - 14) + " L" + (r[0] + 24) + "," + (r[1] - 10) + " C" + (r[0] + 4) + "," + (r[1] + 20) + " " + (cx + 70) + "," + (r[1] + 64) + " " + (cx + 44) + "," + (r[1] + 84) + " Z", "url(#kw-sand)") +
          E(r[0] + 10, r[1] - 22, 74, 20, "url(#kw-sand)") + E(r[0] + 10, r[1] - 24, 66, 15, "url(#kw-water)") +
          anim("kw-wave", L("M" + (r[0] - 40) + "," + (r[1] - 26) + " q10,-4 20,0 t20,0 t20,0", "#FFFFFF", 1.6, op(.8))) +
          anim("kw-seaweed", L("M" + (r[0] + 60) + "," + (r[1] - 20) + " C" + (r[0] + 58) + "," + (r[1] - 40) + " " + (r[0] + 64) + "," + (r[1] - 52) + " " + (r[0] + 60) + "," + (r[1] - 66), "#3E8A45", 3)) +
          anim("kw-seaweed kw-seaweed--b", L("M" + (r[0] + 70) + "," + (r[1] - 18) + " C" + (r[0] + 72) + "," + (r[1] - 36) + " " + (r[0] + 66) + "," + (r[1] - 48) + " " + (r[0] + 70) + "," + (r[1] - 60), "#4E9A52", 3)) +
          rock(r[0] - 50, r[1] - 12, .8), "shine");
        h += at(lay.sign[0], lay.sign[1], 1, R(-3, -48, 6, 48, 2, "url(#kw-trunk)") +
          P("M-4,-44 L-38,-44 L-46,-37 L-38,-30 L-4,-30 Z", "url(#kw-wood)") + P("M4,-28 L38,-28 L46,-21 L38,-14 L4,-14 Z", "url(#kw-wood)") +
          at(-26, -37, .55, g(pine(0, 7, .5))) + E(24, -21, 7, 3, "#63C7FF"));
        return h + anchorPt("bird", lay.bird[0], lay.bird[1]) + anchorPt("momo", lay.momo[0], lay.momo[1]);
      }
    },
    river: {
      P: { hz: 250, splash: [270, 430], bird: [150, 392], momo: [96, 548] },
      L: { hz: 190, splash: [650, 330], bird: [430, 288], momo: [280, 410] },
      bg: function (W, H, hz, m, lay) {
        var s = lay.splash, ry = m === "P" ? 380 : 290;
        var h = "<defs>" + lg("kw-sky", 0, -60, 0, hz, [[0, "#9FDBFF"], [1, "#EAF8FF"]], true) + lg("kw-ground", 0, hz, 0, H, [[0, "#A9DB86"], [1, "#6CB35E"]], true) + "</defs>";
        h += big(-900, -900, W + 1800, hz + 960, "url(#kw-sky)") + cloud(W * .3, hz * .3, 1, "kw-cloud--a") + cloud(W * .8, hz * .5, .7, "kw-cloud--b");
        for (var i = -8; i < W / 56 + 8; i++) h += C(i * 56 + 10, hz - 10 - (Math.abs(i) % 3) * 16, 42, i % 2 ? "#7DBE88" : "#6AAE7A");
        h += big(-900, hz + 10, W + 1800, H + 900, "url(#kw-ground)");
        h += P("M-900," + (ry - 70) + " C" + (W * .2) + "," + (ry - 90) + " " + (W * .6) + "," + (ry - 50) + " " + (W + 900) + "," + (ry - 80) + " L" + (W + 900) + "," + (ry + 40) + " C" + (W * .6) + "," + (ry + 60) + " " + (W * .3) + "," + (ry + 20) + " -900," + (ry + 50) + " Z", "url(#kw-sand)");
        h += P("M-900," + (ry - 60) + " C" + (W * .2) + "," + (ry - 80) + " " + (W * .6) + "," + (ry - 40) + " " + (W + 900) + "," + (ry - 70) + " L" + (W + 900) + "," + (ry + 30) + " C" + (W * .6) + "," + (ry + 50) + " " + (W * .3) + "," + (ry + 10) + " -900," + (ry + 40) + " Z", "url(#kw-water)");
        h += anim("kw-wave", L("M-900," + (ry - 30) + " C" + (W * .3) + "," + (ry - 40) + " " + (W * .6) + "," + (ry - 20) + " " + (W + 900) + "," + (ry - 34), "#FFFFFF", 2, op(.6))) +
          anim("kw-flow", L("M-900," + (ry) + " C" + (W * .3) + "," + (ry - 8) + " " + (W * .6) + "," + (ry + 8) + " " + (W + 900) + "," + (ry - 4), "#E6FBFF", 2, ' stroke-dasharray="10 16"'));
        h += rock(lay.bird[0], lay.bird[1] + 6, 1.6) + rock(W * .82, ry + 10, 1.1) + tufts(W, H, ry + 60, 5, ["#4E9444", "#63AD57"], 30);
        h += tree(-20, hz + 60, 2, "deep") + tree(W + 20, hz + 70, 1.8) + feather(W * .9, hz + 40, 1.4, -30) + feather(W * .86, hz + 46, 1.1, 20);
        h += hotG("splash", E(s[0], s[1] - 10, 50, 14, "#FFFFFF", op(.01)) + E(s[0], s[1] - 10, 22, 6, "none", ' stroke="#FFFFFF" stroke-width="2" opacity=".8"') +
          E(s[0], s[1] - 10, 36, 10, "none", ' stroke="#FFFFFF" stroke-width="1.4" opacity=".5"') + anim("st-jumper", g(fish("#FF9A5A", 2.2), tr(s[0], s[1] - 18))), "jump");
        return h + anchorPt("bird", lay.bird[0], lay.bird[1] - 4) + anchorPt("momo", lay.momo[0], lay.momo[1]);
      }
    },
    clearing: {
      P: { hz: 280, prints: [206, 470], bird: [322, 404], momo: [92, 540] },
      L: { hz: 215, prints: [520, 360], bird: [780, 296], momo: [262, 408] },
      bg: function (W, H, hz, m, lay) {
        var p = lay.prints, h = forestBase(W, H, hz, m, 13);
        function trail(x0, y0, dx, dy, kind) {
          var t = "";
          for (var i = 0; i < 4; i++) {
            var x = x0 + dx * i, y = y0 + dy * i;
            if (kind === "bird") t += L("M" + x + "," + y + " l0,-8 M" + x + "," + y + " l-5,-6 M" + x + "," + y + " l5,-6 M" + x + "," + y + " l0,3", "#5A3A20", 1.8);
            else if (kind === "paw") t += E(x, y, 4, 3.4, "#5A3A20") + C(x - 4.4, y - 5, 1.7, "#5A3A20") + C(x - 1.4, y - 7, 1.7, "#5A3A20") + C(x + 1.8, y - 7, 1.7, "#5A3A20") + C(x + 4.6, y - 5, 1.7, "#5A3A20");
            else t += P("M" + (x - 1) + "," + (y - 6) + " c-4,1 -4,8 -1,10 c1,-3 1,-6 1,-10 Z M" + (x + 1) + "," + (y - 6) + " c4,1 4,8 1,10 c-1,-3 -1,-6 -1,-10 Z", "#5A3A20");
          }
          return t;
        }
        h += hotG("footprints", at(p[0], p[1], 1,
          E(0, -10, 96, 30, "#A07A50") + E(0, -12, 88, 25, "#B8905F") + E(-26, -22, 30, 6, "#FFFFFF", op(.12)) +
          trail(-70, -4, 14, -6, "bird") + trail(-20, 6, 18, -2, "paw") + trail(24, -2, 14, -8, "hoof")) +
          feather(p[0] + 96, p[1] - 30, 1.2, 30), "shine");
        return h + rock(W * .1, hz + 110, 1) + mushroom(W * .8, hz + 90, 1.2) + anchorPt("bird", lay.bird[0], lay.bird[1]) + anchorPt("momo", lay.momo[0], lay.momo[1]);
      }
    },
    oak: {
      P: { hz: 300, trunk: [214, 540], nest: [262, 206], nestBird: [240, 196], ground: [318, 532], momo: [96, 546] },
      L: { hz: 230, trunk: [520, 404], nest: [590, 150], nestBird: [566, 142], ground: [730, 400], momo: [300, 412] },
      bg: function (W, H, hz, m, lay) {
        var t = lay.trunk, ns = lay.nest, h = forestBase(W, H, hz, m, 17);
        var canopy = C(t[0] - 90, ns[1] - 30, 90, "url(#kw-leaf-d)") + C(t[0] + 80, ns[1] - 10, 96, "url(#kw-leaf-d)") +
          C(t[0] - 10, ns[1] - 80, 100, "url(#kw-leaf)") + C(t[0] + 130, ns[1] + 50, 60, "url(#kw-leaf)") + C(t[0] - 130, ns[1] + 40, 64, "url(#kw-leaf)") +
          C(t[0] - 40, ns[1] - 100, 40, "#FFFFFF", op(.14));
        h += anim("kw-canopy", canopy);
        var x = t[0], y = t[1], top = ns[1] - 24;
        var trunk = "M" + (x - 48) + "," + y + " C" + (x - 32) + "," + (y - 10) + " " + (x - 30) + "," + (y - 40) + " " + (x - 27) + "," + (y - 90) +
          " C" + (x - 23) + "," + (top + 90) + " " + (x - 21) + "," + (top + 30) + " " + (x - 15) + "," + top + " L" + (x + 21) + "," + top +
          " C" + (x + 27) + "," + (top + 30) + " " + (x + 31) + "," + (top + 90) + " " + (x + 35) + "," + (y - 90) +
          " C" + (x + 38) + "," + (y - 40) + " " + (x + 42) + "," + (y - 10) + " " + (x + 58) + "," + y + " Z";
        var bark = "";
        [-14, -4, 8, 18].forEach(function (dx, k) {
          bark += L("M" + (x + dx) + "," + (y - 20 - k * 6) + " C" + (x + dx - 3) + "," + (y - 80) + " " + (x + dx + 3) + "," + (top + 120) + " " + (x + dx * .7) + "," + (top + 40 + k * 10), "#5E3A20", 1.8, op(.45));
        });
        h += hotG("tree",
          // side branch with its own leaves (behind the trunk)
          L("M" + (x - 18) + "," + (y - 170) + " C" + (x - 50) + "," + (y - 190) + " " + (x - 70) + "," + (y - 210) + " " + (x - 96) + "," + (y - 250), "#7A4B2A", 9) +
          C(x - 104, y - 262, 30, "url(#kw-leaf-d)") + C(x - 84, y - 272, 22, "url(#kw-leaf)") +
          P(trunk, "url(#kw-trunk)") +
          P("M" + (x + 6) + "," + top + " L" + (x + 21) + "," + top + " C" + (x + 27) + "," + (top + 30) + " " + (x + 31) + "," + (top + 90) + " " + (x + 35) + "," + (y - 90) +
            " C" + (x + 38) + "," + (y - 40) + " " + (x + 42) + "," + (y - 10) + " " + (x + 58) + "," + y + " L" + (x + 14) + "," + y + " C" + (x + 12) + "," + (y - 120) + " " + (x + 10) + "," + (top + 60) + " " + (x + 6) + "," + top + " Z", "#3E2410", op(.22)) +
          bark +
          P("M" + (x - 48) + "," + y + " C" + (x - 64) + "," + (y - 4) + " " + (x - 76) + "," + (y + 2) + " " + (x - 84) + "," + (y + 8) + " L" + (x - 30) + "," + (y + 8) + " Z", "#7A4B2A") +
          P("M" + (x + 58) + "," + y + " C" + (x + 72) + "," + (y - 3) + " " + (x + 84) + "," + (y + 3) + " " + (x + 92) + "," + (y + 8) + " L" + (x + 40) + "," + (y + 8) + " Z", "#6A3F22") +
          E(x - 2, y - 100, 9, 13, "#3E2A18", op(.7)) + E(x - 4, y - 104, 4, 5, "#1E140A", op(.8)) +
          E(x - 30, y - 40, 10, 5, "#5CB564", op(.7)), "rustle");
        h += L("M" + (t[0] + 10) + "," + (ns[1] + 20) + " C" + (t[0] + 40) + "," + (ns[1] + 10) + " " + (ns[0] - 20) + "," + (ns[1] + 12) + " " + (ns[0] + 40) + "," + (ns[1] + 6), "#7A4B2A", 8);
        h += hotG("nest", nest(ns[0], ns[1] + 6, 1.2) +
          revealG("family", babyBird(ns[0] - 14, ns[1] - 2, 1.2) + babyBird(ns[0] + 6, ns[1] - 4, 1.3, "#A8D8FF") + babyBird(ns[0] + 24, ns[1] - 2, 1.1)), "shine");
        return h + anchorPt("nestBird", lay.nestBird[0], lay.nestBird[1]) + anchorPt("ground", lay.ground[0], lay.ground[1]) + anchorPt("momo", lay.momo[0], lay.momo[1]);
      }
    },
    meadow: {
      P: { hz: 286, flowers: [212, 474], bush: [298, 404], pondAt: [290, 572], plant: [74, 446], momo: [92, 584], pip: [182, 612] },
      L: { hz: 218, flowers: [536, 368], bush: [792, 318], pondAt: [700, 396], plant: [386, 322], momo: [216, 412], pip: [306, 424] },
      bg: function (W, H, hz, m, lay) {
        var f = lay.flowers, b = lay.bush, pd = lay.pondAt, pl = lay.plant, h = forestBase(W, H, hz, m, 5);
        h += flowers(W * .5, hz + 30, 1.1) + flowers(W * .7, hz + 52, 1) + rock(W * .94, hz + 120, 1);
        // the flower patch — a bee is hiding in it
        h += hotG("flowers", at(f[0], f[1], 1,
          E(0, 6, 58, 12, "#5CA84E", op(.5)) + flowers(-34, 0, 2.4) + flowers(0, 6, 2.8, ["#FFD24D", "#FF7FA8", "#FFFFFF", "#FF9A5A", "#B79CFF"]) + flowers(34, 2, 2.3) +
          L("M-6,6 L-6,-26", "#3F9A55", 2.4) + C(-6, -30, 9, "#FFD24D") + C(-6, -30, 4, "#B8741F") +
          L("M18,8 L18,-16", "#3F9A55", 2.2) + C(18, -20, 7, "#FF7FA8") + C(18, -20, 3, "#FFF3B0")) +
          revealG("bee", bee(f[0] + 14, f[1] - 66, 2.2)), "shine");
        // the leafy bush — a ladybug on a leaf
        h += hotG("bush", bush(b[0], b[1], 3.4) + revealG("ladybug", ladybug(b[0] - 8, b[1] - 50, 1.9)), "rustle");
        // the little pond — a dragonfly zips over it
        h += hotG("pond", pond(pd[0], pd[1], 1) + revealG("dragonfly", dragonfly(pd[0] - 18, pd[1] - 52, 2)), "shine");
        // a tall leafy plant with a caterpillar — one day, a butterfly
        h += hotG("plant", at(pl[0], pl[1], 1,
          shadow(0, 2, 30, 6) + L("M0,0 C-2,-24 2,-52 0,-80", "#3F9A55", 4) +
          P("M0,-58 C14,-78 42,-80 56,-66 C40,-52 16,-48 0,-58 Z", "url(#kw-leaf)") + L("M4,-60 C20,-66 36,-68 52,-66", "#2E7A45", 1.2, op(.6)) +
          P("M0,-34 C-14,-50 -40,-52 -52,-40 C-38,-28 -14,-24 0,-34 Z", "url(#kw-leaf-d)") +
          P("M0,-80 C8,-94 24,-98 32,-90 C22,-82 10,-78 0,-80 Z", "url(#kw-leaf)") +
          caterpillar(28, -70, 1.3)) +
          revealG("butterfly", butterfly(pl[0] + 64, pl[1] - 126, 3.2, "#FF8A1F")), "shine");
        return h + anchorPt("momo", lay.momo[0], lay.momo[1]) + anchorPt("pip", lay.pip[0], lay.pip[1]);
      }
    }
  };
  function storySvg(place, mode) {
    var S = STORY_PLACES[place], lay = S[mode], W = MAP[mode].W, H = MAP[mode].H;
    return { W: W, H: H, svg: "<defs>" + DEFS + "</defs>" + S.bg(W, H, lay.hz, mode, lay) };
  }

  function realmSvg(id, mode) {
    var R0 = REALM[id], lay = R0[mode];
    var W = MAP[mode].W, H = MAP[mode].H;
    var h = "<defs>" + DEFS + "</defs>" + R0.bg(W, H, lay.hz, mode, lay);
    var keys = Object.keys(lay.spots).sort(function (a, b) { return lay.spots[a][1] - lay.spots[b][1]; });
    keys.forEach(function (k) { var p = lay.spots[k]; h += spotG(k, p[0], p[1], p[2]); });
    return { W: W, H: H, svg: h };
  }

  // Tiny self-contained landmark icon (for the Continue button).
  var THUMB_BOX = {
    village: "-96 -118 192 150", jungle: "-96 -156 192 170", puzzle: "-86 -108 172 140", castle: "-104 -176 208 186",
    ocean: "-100 -90 200 124", lab: "-92 -110 184 126", space: "-80 -80 160 160"
  };

  var cache = {};
  function cached(key, fn) { return cache[key] || (cache[key] = fn()); }

  Kido.worldArt = {
    PLACE_IDS: PLACE_IDS,
    map: function (mode, locked) {
      var key = "map:" + mode + ":" + Object.keys(locked || {}).filter(function (k) { return locked[k]; }).sort().join(",");
      return cached(key, function () { return mapSvg(mode, locked); });
    },
    mapLayout: function (mode) { return MAP[mode]; },
    realm: function (id, mode) { return cached("realm:" + id + ":" + mode, function () { return realmSvg(id, mode); }); },
    realmLayout: function (id, mode) { return REALM[id][mode]; },
    /** A story place backdrop (built on first use, then cached). */
    storyScene: function (place, mode) { return STORY_PLACES[place] ? cached("story:" + place + ":" + mode, function () { return storySvg(place, mode); }) : null; },
    /** More story places, drawn in another file with the same kit (js/art/storyPlaces.js, Change #17A).
        def = { P: layout, L: layout, bg: function (W, H, hz, mode, layout) → svg }. */
    addStoryPlace: function (name, def) { STORY_PLACES[name] = def; },
    storyPlaces: function () { return Object.keys(STORY_PLACES); },
    /** The shared drawing kit: same helpers, gradients and light as every Kido World place. */
    kit: {
      n: n, tr: tr, g: g, at: at, anim: anim, lg: lg, rg: rg, E: E, C: C, R: R, P: P, L: L, op: op, T: T, big: big, delay: delay,
      shadow: shadow, tree: tree, pine: pine, bush: bush, flowers: flowers, rock: rock, cloud: cloud, birds: birds, butterfly: butterfly,
      fence: fence, bigLeaf: bigLeaf, stars: stars, sparkle: sparkle, house: house, fish: fish, frog: frog, birdSmall: birdSmall,
      tufts: tufts, patches: patches, fern: fern, hedge: hedge, lampPost: lampPost, fountain: fountain, rng: rng,
      anchorPt: anchorPt, hotG: hotG, revealG: revealG, mushroom: mushroom, feather: feather, nest: nest, babyBird: babyBird,
      forestBase: forestBase, bee: bee, ladybug: ladybug, dragonfly: dragonfly, caterpillar: caterpillar, pond: pond,
      palm: palm, crab: crab   // Change #23 (the treasure-hunt places)
    },
    thumb: function (id) {
      return cached("thumb:" + id, function () {
        return '<svg viewBox="' + THUMB_BOX[id] + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>' + DEFS + "</defs>" + LM[id]() + "</svg>";
      });
    }
  };
})(window);
