/* =========================================================================
   storyCast.js — the story characters of Change #17A, rigged like Momo
   Ria the rabbit, Tuk the turtle, Biscuit the puppy (and his mama), Sam the
   bear cub, Mia the panda and Leo the lion cub. Each is one original inline
   SVG (200×240, feet at the bottom) following the rig contract in
   js/engine/characters.js — kc-body breathes, kc-head tilts, kc-ear-l/r and
   kc-arm-l/r and kc-tail move, kc-lid blinks, kc-pupil looks, and every mouth
   / brow variant ships in the markup — so all moods and poses (scene.css)
   work unchanged. Same light as Kido: lit from the upper left, soft gradient
   shading, a soft contact shadow. Registered with Kido.Characters.register.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  if (!Kido.Characters || !Kido.Characters.register) return;
  var uid = 0;

  function n(v) { return Math.round(v * 10) / 10; }
  function stops(list) {
    return list.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : "") + "/>"; }).join("");
  }
  function rg(id, list, cx, cy, r) { return '<radialGradient id="' + id + '" cx="' + (cx || "38%") + '" cy="' + (cy || "28%") + '" r="' + (r || "72%") + '">' + stops(list) + "</radialGradient>"; }
  function lg(id, list, x1, y1, x2, y2) { return '<linearGradient id="' + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' + stops(list) + "</linearGradient>"; }
  function E(cx, cy, rx, ry, fill, x) { return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + fill + '"' + (x || "") + "/>"; }
  function C(cx, cy, r, fill, x) { return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" fill="' + fill + '"' + (x || "") + "/>"; }
  function R(x, y, w, h, rx, fill, xx) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '" rx="' + rx + '" fill="' + fill + '"' + (xx || "") + "/>"; }
  function P(d, fill, x) { return '<path d="' + d + '" fill="' + fill + '"' + (x || "") + "/>"; }
  function L(d, stroke, w, x) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (x || "") + "/>"; }
  function op(o) { return ' opacity="' + o + '"'; }
  function rot(a, x, y) { return ' transform="rotate(' + a + " " + x + " " + y + ')"'; }
  function url(u, id) { return "url(#" + u + id + ")"; }
  function shadow(rx) { return E(100, 228, rx || 46, 7, "#2A2030", op(.2)); }

  /* ---- one face for everyone: eyes, glossy pupils, blinking lids, brows, five mouths ---- */
  function face(u, o) {
    var lx = 100 - o.ex, rx0 = 100 + o.ex, ey = o.ey, rx = o.rx, ry = o.ry, pr = o.pr || n(rx * .68);
    var by = o.browY != null ? o.browY : ey - ry - 8, h = "";
    h += R(lx - 12, by, 24, 7, 3.5, o.brow, ' class="kc-brow kc-brow-l"') + R(rx0 - 12, by, 24, 7, 3.5, o.brow, ' class="kc-brow kc-brow-r"');
    h += E(lx, ey, rx, ry, "#FFFFFF", ' class="kc-eye"') + E(rx0, ey, rx, ry, "#FFFFFF", ' class="kc-eye"');
    [lx, rx0].forEach(function (x) {
      h += '<g class="kc-pupil">' + C(x, ey + 1, pr, url(u, "Iris")) + C(x + pr * .38, ey - pr * .36, pr * .36, "#FFFFFF") +
        C(x - pr * .4, ey + pr * .42, pr * .17, "#FFFFFF", op(.85)) + "</g>";
    });
    [lx, rx0].forEach(function (x) { h += R(x - rx - 2, ey - ry - 2, rx * 2 + 4, ry * 2 + 4, rx + 2, o.lid, ' class="kc-lid"'); });
    var my = o.mouthY, mw = o.mw || 12, ms = o.mouth || "#5A2A1A", tongue = o.tongue || "#FF5E82";
    var teeth = o.teeth ? R(93.5, my + 1, 6, 7.5, 1.6, "#FFFFFF", ' stroke="#E2D2C8" stroke-width=".8"') + R(100.5, my + 1, 6, 7.5, 1.6, "#FFFFFF", ' stroke="#E2D2C8" stroke-width=".8"') : "";
    h += '<g class="kc-mouth m-smile">' + L("M" + n(100 - mw) + " " + my + " Q100 " + n(my + mw * 1.05) + " " + n(100 + mw) + " " + my, ms, 4.5) + teeth + "</g>";
    h += '<g class="kc-mouth m-open">' +
      P("M" + n(100 - mw - 2) + " " + (my - 2) + " Q100 " + n(my + mw * 2.2) + " " + n(100 + mw + 2) + " " + (my - 2) + " Q100 " + (my + 6) + " " + n(100 - mw - 2) + " " + (my - 2) + " Z", "#3D1208") +
      P("M" + n(100 - mw * .62) + " " + n(my + mw * 1.1) + " Q100 " + n(my + mw * .5) + " " + n(100 + mw * .62) + " " + n(my + mw * 1.1) + " Q100 " + n(my + mw * 1.8) + " " + n(100 - mw * .62) + " " + n(my + mw * 1.1) + " Z", tongue) + teeth + "</g>";
    h += '<g class="kc-mouth m-o">' + E(100, my + 5, mw * .6, mw * .8, "#3D1208") + E(100, my + 9.5, mw * .4, mw * .3, tongue) + "</g>";
    h += '<g class="kc-mouth m-flat">' + L("M" + n(100 - mw * .8) + " " + (my + 4) + " Q100 " + (my + 5.5) + " " + n(100 + mw * .8) + " " + (my + 4), ms, 4.5) + "</g>";
    h += '<g class="kc-mouth m-frown">' + L("M" + n(100 - mw * .9) + " " + (my + 9) + " Q100 " + (my - 2) + " " + n(100 + mw * .9) + " " + (my + 9), ms, 4.5) + "</g>";
    return h;
  }
  function blush(y, dx, c) { return E(100 - dx, y, 11, 7, c || "#FF7FA8", op(.4)) + E(100 + dx, y, 11, 7, c || "#FF7FA8", op(.4)); }
  function iris(u, list) { return rg(u + "Iris", list || [[0, "#55377A"], [.5, "#25144A"], [1, "#0A0418"]], "40%", "32%", "65%"); }
  function open(cls, label) { return '<svg class="kido-char ' + cls + '" viewBox="0 0 200 240" role="img" aria-label="' + label + '"><defs>'; }

  /* ---- Ria the rabbit (The Helpful Rabbit) ---- */
  function rabbit() {
    var u = "kr" + (++uid) + "_";
    var fur = [[0, "#FFF9F1"], [.4, "#F0DCC6"], [.82, "#D3B392"], [1, "#A9876A"]];
    var d = rg(u + "Fur", fur) + rg(u + "Body", fur, "40%", "30%", "70%") +
      rg(u + "Cream", [[0, "#FFFFFF"], [.6, "#FFF6EC"], [1, "#E9D6C2"]], "45%", "30%", "70%") +
      lg(u + "Ear", [[0, "#FBEBD9"], [1, "#C7A584"]], 0, 0, 1, 1) + lg(u + "EarIn", [[0, "#FFD3DF"], [1, "#EE88A8"]], 0, 0, 0, 1) +
      lg(u + "Lid", [[0, "#F6E5D2"], [1, "#D9BD9D"]], 0, 0, 0, 1) + iris(u, [[0, "#6A4A3A"], [.5, "#3A2218"], [1, "#140A06"]]);
    var petals = "";
    for (var i = 0; i < 5; i++) { var a = (i * 72 - 90) * Math.PI / 180; petals += C(76 + Math.cos(a) * 5.6, 79 + Math.sin(a) * 5.6, 4.8, "#FF8FC0"); }
    return open("kc-rabbit", "Ria the rabbit") + d + "</defs>" +
      '<g class="kc-body">' + shadow(44) +
        '<g class="kc-tail">' + C(146, 202, 15, url(u, "Cream")) + C(141, 196, 6, "#FFFFFF", op(.85)) + "</g>" +
        '<g class="kc-legs">' + E(77, 220, 21, 10, url(u, "Body")) + E(123, 220, 21, 10, url(u, "Body")) +
          E(72, 222, 6, 4, "#F5A9BF", op(.75)) + E(128, 222, 6, 4, "#F5A9BF", op(.75)) + "</g>" +
        E(100, 189, 40, 37, url(u, "Body")) + E(100, 197, 25, 25, url(u, "Cream")) +
        '<g class="kc-arm-l">' + R(57, 160, 19, 40, 9.5, url(u, "Body")) + E(66.5, 198, 8, 5, "#FFF6EC") + "</g>" +
        '<g class="kc-arm-r">' + R(124, 160, 19, 40, 9.5, url(u, "Body")) + E(133.5, 198, 8, 5, "#FFF6EC") + "</g>" +
        '<g class="kc-head">' +
          '<g class="kc-ear-l">' + E(72, 46, 15, 42, url(u, "Ear"), rot(-12, 72, 46)) + E(73, 50, 7.5, 31, url(u, "EarIn"), rot(-12, 73, 50)) + "</g>" +
          '<g class="kc-ear-r">' + E(128, 46, 15, 42, url(u, "Ear"), rot(12, 128, 46)) + E(127, 50, 7.5, 31, url(u, "EarIn"), rot(12, 127, 50)) + "</g>" +
          E(100, 122, 54, 49, url(u, "Fur")) +
          P("M48 126 C41 133 43 145 52 147 C50 140 52 134 57 131 Z", url(u, "Fur")) + P("M152 126 C159 133 157 145 148 147 C150 140 148 134 143 131 Z", url(u, "Fur")) +
          petals + C(76, 79, 3.6, "#FFD24D") +
          E(100, 142, 27, 19, url(u, "Cream")) + blush(139, 36, "#FF8FB0") +
          face(u, { ex: 22, ey: 113, rx: 14, ry: 17, brow: "#8A6A50", lid: url(u, "Lid"), mouthY: 146, mw: 9, mouth: "#7A3A2A", teeth: true }) +
          P("M93 133 C93 129 107 129 107 133 C107 137 100 140 100 140 C100 140 93 137 93 133 Z", "#FF8FA8") + E(98, 132, 2.6, 1.4, "#FFFFFF", op(.8)) +
          L("M100 140 L100 145", "#B06A6A", 1.6) +
          L("M80 140 L58 135 M80 145 L60 147 M120 140 L142 135 M120 145 L140 147", "#C4A88C", 1.2, op(.8)) +
        "</g>" +
      "</g></svg>";
  }

  /* ---- Tuk the turtle (The Helpful Rabbit) ---- */
  function turtle() {
    var u = "kt" + (++uid) + "_";
    var skin = [[0, "#D9F8A8"], [.45, "#93D26C"], [.85, "#4F9E49"], [1, "#2F6E37"]];
    var d = rg(u + "Skin", skin) + rg(u + "Shell", [[0, "#F6CB86"], [.4, "#DA974D"], [.8, "#A9632B"], [1, "#6C3916"]], "40%", "22%", "80%") +
      lg(u + "Rim", [[0, "#F5D08E"], [1, "#C98A44"]], 0, 0, 0, 1) + lg(u + "Belly", [[0, "#FFF4C4"], [1, "#E6C66A"]], 0, 0, 0, 1) +
      lg(u + "Lid", [[0, "#A9DD7E"], [1, "#6FB85A"]], 0, 0, 0, 1) + iris(u, [[0, "#5A4A2A"], [.5, "#2A200E"], [1, "#0E0A04"]]);
    var scute = function (dd) { return P(dd, "#EBAA5C", op(.55) + ' stroke="#8A4E1E" stroke-width="2.2" stroke-linejoin="round"'); };
    return open("kc-turtle", "Tuk the turtle") + d + "</defs>" +
      '<g class="kc-body">' + shadow(66) +
        '<g class="kc-legs">' + E(54, 218, 19, 11, url(u, "Skin")) + E(146, 218, 19, 11, url(u, "Skin")) +
          C(44, 224, 2.2, "#2F6E37", op(.5)) + C(52, 226, 2.2, "#2F6E37", op(.5)) + C(148, 226, 2.2, "#2F6E37", op(.5)) + C(156, 224, 2.2, "#2F6E37", op(.5)) + "</g>" +
        '<g class="kc-tail">' + P("M162 204 L180 210 L162 214 Z", url(u, "Skin")) + "</g>" +
        P("M22 206 C20 150 58 118 100 118 C142 118 180 150 178 206 Z", url(u, "Shell")) +
        scute("M100 134 L124 147 L124 173 L100 186 L76 173 L76 147 Z") +
        scute("M38 192 C38 166 54 146 72 140 L76 147 L76 173 L58 196 Z") + scute("M162 192 C162 166 146 146 128 140 L124 147 L124 173 L142 196 Z") +
        E(78, 140, 24, 9, "#FFFFFF", op(.28) + rot(-18, 78, 140)) +
        P("M20 203 C20 216 180 216 180 203 C180 196 20 196 20 203 Z", url(u, "Rim")) +
        L("M40 206 L40 211 M64 208 L64 213 M88 209 L88 214 M112 209 L112 214 M136 208 L136 213 M160 206 L160 211", "#B07434", 1.8, op(.6)) +
        E(100, 198, 30, 13, url(u, "Belly")) +
        '<g class="kc-arm-l">' + E(33, 194, 14, 20, url(u, "Skin"), rot(22, 33, 194)) + C(26, 209, 2.2, "#2F6E37", op(.5)) + C(32, 212, 2.2, "#2F6E37", op(.5)) + "</g>" +
        '<g class="kc-arm-r">' + E(167, 194, 14, 20, url(u, "Skin"), rot(-22, 167, 194)) + C(174, 209, 2.2, "#2F6E37", op(.5)) + C(168, 212, 2.2, "#2F6E37", op(.5)) + "</g>" +
        '<g class="kc-head">' +
          R(82, 130, 36, 46, 16, url(u, "Skin")) +
          E(100, 108, 47, 41, url(u, "Skin")) +
          C(68, 88, 3.4, "#5FAE4E", op(.55)) + C(132, 86, 2.8, "#5FAE4E", op(.55)) + C(122, 74, 2.4, "#5FAE4E", op(.5)) +
          blush(128, 32) +
          face(u, { ex: 19, ey: 101, rx: 13.5, ry: 15.5, brow: "#3E6E2E", lid: url(u, "Lid"), mouthY: 130, mw: 12, mouth: "#2F5A24" }) +
          C(95, 119, 1.7, "#2F5A24") + C(105, 119, 1.7, "#2F5A24") +
        "</g>" +
      "</g></svg>";
  }

  /* ---- Biscuit the puppy, and his mama (The Lost Puppy) ---- */
  var PUPPY = { cls: "kc-dog kc-puppy", label: "Biscuit the puppy", fur: [[0, "#FFE8BE"], [.4, "#F2C27C"], [.82, "#D99A4E"], [1, "#A86A2A"]],
    ear: [[0, "#B9773F"], [1, "#7A4420"]], patch: "#A8642C", brow: "#7A4420", collar: [[0, "#FF6F6A"], [1, "#C8322B"]], tag: "#FFD24D" };
  var MAMA = { cls: "kc-dog kc-mama", label: "Biscuit's mama", fur: [[0, "#F6DDB8"], [.4, "#DDAE76"], [.82, "#B9824A"], [1, "#835428"]],
    ear: [[0, "#946035"], [1, "#5E3519"]], patch: null, brow: "#5E3519", collar: [[0, "#7FB0FF"], [1, "#3E6FD1"]], tag: "#FFD24D" };
  function dog(pal) {
    var u = "kd" + (++uid) + "_";
    var d = rg(u + "Fur", pal.fur) + rg(u + "Body", pal.fur, "40%", "30%", "70%") +
      rg(u + "White", [[0, "#FFFFFF"], [.65, "#FBF5EE"], [1, "#E4D4C2"]], "45%", "30%", "70%") +
      lg(u + "Ear", pal.ear, 0, 0, .4, 1) + lg(u + "Collar", pal.collar, 0, 0, 0, 1) +
      rg(u + "Nose", [[0, "#5A4038"], [.5, "#2A1A14"], [1, "#0E0604"]], "35%", "25%", "70%") +
      lg(u + "Lid", [pal.fur[1], pal.fur[2]], 0, 0, 0, 1) + iris(u, [[0, "#7A4A26"], [.5, "#3A1E0C"], [1, "#120804"]]);
    return open(pal.cls, pal.label) + d + "</defs>" +
      '<g class="kc-body">' + shadow(50) +
        '<g class="kc-tail">' + P("M136 200 C152 198 166 186 170 166 C171 158 180 158 180 167 C179 190 162 208 140 210 Z", url(u, "Fur")) + "</g>" +
        '<g class="kc-legs">' + E(62, 210, 22, 17, url(u, "Body")) + E(138, 210, 22, 17, url(u, "Body")) +
          E(56, 224, 13, 6, url(u, "White")) + E(144, 224, 13, 6, url(u, "White")) + "</g>" +
        E(100, 186, 42, 40, url(u, "Body")) +
        P("M80 158 C85 172 88 184 100 192 C112 184 115 172 120 158 Z", url(u, "White")) +
        '<g class="kc-arm-l">' + R(77, 176, 19, 48, 9.5, url(u, "Body")) + E(86.5, 222, 11.5, 6.5, url(u, "White")) + "</g>" +
        '<g class="kc-arm-r">' + R(104, 176, 19, 48, 9.5, url(u, "Body")) + E(113.5, 222, 11.5, 6.5, url(u, "White")) + "</g>" +
        P("M60 154 Q100 178 140 154 L141 164 Q100 190 59 164 Z", url(u, "Collar")) + C(100, 180, 7, pal.tag) + C(98, 178, 2.2, "#FFFFFF", op(.75)) +
        '<g class="kc-head">' +
          E(100, 106, 56, 50, url(u, "Fur")) +
          (pal.patch ? E(124, 99, 21, 23, pal.patch, op(.85) + rot(15, 124, 99)) : "") +
          E(100, 132, 32, 23, url(u, "White")) + blush(130, 38) +
          face(u, { ex: 22, ey: 100, rx: 14, ry: 16, brow: pal.brow, lid: url(u, "Lid"), mouthY: 143, mw: 11, mouth: "#5A2A1A", tongue: "#FF7FA0" }) +
          P("M88 122 C88 115 112 115 112 122 C112 129 104 133 100 133 C96 133 88 129 88 122 Z", url(u, "Nose")) + E(95, 119, 4, 2, "#FFFFFF", op(.6)) +
          L("M100 133 L100 141", "#4A2A1A", 1.8) +
          '<g class="kc-ear-l">' + P("M60 64 C38 66 26 94 28 122 C29 137 40 145 50 137 C56 118 60 94 68 72 Z", url(u, "Ear")) + "</g>" +
          '<g class="kc-ear-r">' + P("M140 64 C162 66 174 94 172 122 C171 137 160 145 150 137 C144 118 140 94 132 72 Z", url(u, "Ear")) + "</g>" +
        "</g>" +
      "</g></svg>";
  }

  /* ---- Sam the bear cub (The Tidy Room) ---- */
  function bear() {
    var u = "kb" + (++uid) + "_";
    var fur = [[0, "#E6B27E"], [.45, "#BC7E47"], [.85, "#8C5429"], [1, "#5E3417"]];
    var d = rg(u + "Fur", fur) + rg(u + "Body", fur, "40%", "30%", "70%") +
      rg(u + "Muzzle", [[0, "#FFF3E0"], [.6, "#F2D7B2"], [1, "#D4AE86"]], "45%", "30%", "70%") +
      lg(u + "Shirt", [[0, "#7FA8FF"], [1, "#3E6FD1"]], 0, 0, 0, 1) + lg(u + "Lid", [fur[1], fur[2]], 0, 0, 0, 1) +
      iris(u, [[0, "#6A3E1E"], [.5, "#341A08"], [1, "#100602"]]) +
      '<clipPath id="' + u + 'Clip"><ellipse cx="100" cy="188" rx="42" ry="39"/></clipPath>';
    var stripes = "";
    for (var i = 0; i < 6; i++) stripes += R(50, 156 + i * 14, 100, 6, 0, "#FFFFFF", op(.9));
    return open("kc-bear", "Sam the bear cub") + d + "</defs>" +
      '<g class="kc-body">' + shadow(48) +
        '<g class="kc-tail">' + C(146, 206, 9, url(u, "Body")) + "</g>" +
        '<g class="kc-legs">' + R(73, 196, 23, 34, 11.5, url(u, "Body")) + R(104, 196, 23, 34, 11.5, url(u, "Body")) +
          E(84.5, 226, 9, 4, url(u, "Muzzle")) + E(115.5, 226, 9, 4, url(u, "Muzzle")) + "</g>" +
        E(100, 188, 42, 39, url(u, "Shirt")) + '<g clip-path="url(#' + u + 'Clip)">' + stripes + "</g>" +
        P("M76 152 Q100 168 124 152 L124 159 Q100 175 76 159 Z", "#2F5BB8") +
        '<g class="kc-arm-l">' + R(54, 158, 22, 44, 11, url(u, "Body")) + R(51, 154, 28, 18, 9, url(u, "Shirt")) + R(51, 160, 28, 4, 0, "#FFFFFF", op(.85)) + E(65, 200, 9, 5, url(u, "Muzzle")) + "</g>" +
        '<g class="kc-arm-r">' + R(124, 158, 22, 44, 11, url(u, "Body")) + R(121, 154, 28, 18, 9, url(u, "Shirt")) + R(121, 160, 28, 4, 0, "#FFFFFF", op(.85)) + E(135, 200, 9, 5, url(u, "Muzzle")) + "</g>" +
        '<g class="kc-head">' +
          '<g class="kc-ear-l">' + C(58, 72, 19, url(u, "Fur")) + C(59, 73, 10, "#E8B98A") + "</g>" +
          '<g class="kc-ear-r">' + C(142, 72, 19, url(u, "Fur")) + C(141, 73, 10, "#E8B98A") + "</g>" +
          E(100, 112, 56, 51, url(u, "Fur")) +
          E(100, 138, 29, 21, url(u, "Muzzle")) + blush(134, 38) +
          face(u, { ex: 23, ey: 105, rx: 14, ry: 16, brow: "#5E3417", lid: url(u, "Lid"), mouthY: 147, mw: 10, mouth: "#4A2412" }) +
          E(100, 128, 12, 8.5, "#3A2214") + E(97, 125.5, 4, 2, "#FFFFFF", op(.55)) + L("M100 136 L100 142", "#3A2214", 1.8) +
        "</g>" +
      "</g></svg>";
  }

  /* ---- Mia the panda, explorer (The Little Explorer) ---- */
  function panda() {
    var u = "kp" + (++uid) + "_";
    var d = rg(u + "White", [[0, "#FFFFFF"], [.6, "#F1F3F8"], [1, "#C6CDDB"]]) + rg(u + "Body", [[0, "#FFFFFF"], [.6, "#EEF1F6"], [1, "#C2C9D8"]], "40%", "30%", "70%") +
      rg(u + "Black", [[0, "#5C5C6C"], [.5, "#2E2E3A"], [1, "#14141C"]], "38%", "30%", "75%") +
      lg(u + "Hat", [[0, "#A6E08E"], [1, "#3F8E4F"]], 0, 0, 0, 1) + lg(u + "Brim", [[0, "#6BB866"], [1, "#2F6E3E"]], 0, 0, 0, 1) +
      lg(u + "Lid", [[0, "#3A3A48"], [1, "#22222C"]], 0, 0, 0, 1) + iris(u, [[0, "#5A3A26"], [.5, "#2A160A"], [1, "#0A0402"]]);
    return open("kc-panda", "Mia the panda") + d + "</defs>" +
      '<g class="kc-body">' + shadow(48) +
        '<g class="kc-tail">' + C(146, 208, 8, url(u, "Body")) + "</g>" +
        '<g class="kc-legs">' + R(73, 196, 23, 34, 11.5, url(u, "Black")) + R(104, 196, 23, 34, 11.5, url(u, "Black")) +
          E(84.5, 226, 8, 3.5, "#6A6A7A", op(.7)) + E(115.5, 226, 8, 3.5, "#6A6A7A", op(.7)) + "</g>" +
        E(100, 188, 42, 39, url(u, "Body")) +
        P("M58 178 C60 157 80 149 100 149 C120 149 140 157 142 178 C124 170 76 170 58 178 Z", url(u, "Black")) +
        P("M75 160 L85 160 L91 208 L81 208 Z", "#FF9A3C") + P("M125 160 L115 160 L109 208 L119 208 Z", "#FF9A3C") + R(84, 188, 32, 8, 3, "#E87A1E") +
        '<g class="kc-arm-l">' + R(54, 158, 22, 44, 11, url(u, "Black")) + "</g>" +
        '<g class="kc-arm-r">' + R(124, 158, 22, 44, 11, url(u, "Black")) + "</g>" +
        '<g class="kc-head">' +
          '<g class="kc-ear-l">' + C(55, 78, 18, url(u, "Black")) + C(53, 75, 6, "#5C5C6C", op(.6)) + "</g>" +
          '<g class="kc-ear-r">' + C(145, 78, 18, url(u, "Black")) + C(143, 75, 6, "#5C5C6C", op(.6)) + "</g>" +
          E(100, 116, 58, 51, url(u, "White")) +
          E(77, 114, 17, 22, url(u, "Black"), rot(28, 77, 114)) + E(123, 114, 17, 22, url(u, "Black"), rot(-28, 123, 114)) +
          E(100, 140, 24, 16, "#FFFFFF", op(.9)) + blush(140, 40) +
          face(u, { ex: 23, ey: 112, rx: 11, ry: 13, pr: 8, brow: "#2E2E3A", browY: 88, lid: url(u, "Lid"), mouthY: 147, mw: 9, mouth: "#2E2E3A" }) +
          P("M92 131 C92 127 108 127 108 131 C108 136 100 139 100 139 C100 139 92 136 92 131 Z", url(u, "Black")) + E(97, 130, 3, 1.5, "#FFFFFF", op(.6)) +
          L("M100 139 L100 144", "#2E2E3A", 1.8) +
          // explorer's bucket hat with a leaf
          E(100, 72, 52, 11, url(u, "Brim")) + P("M64 72 C66 53 74 38 100 36 C126 38 134 53 136 72 Z", url(u, "Hat")) +
          R(64, 60, 72, 9, 4, "#D9A35E") + P("M122 56 C130 44 142 42 146 46 C140 54 130 58 122 56 Z", "#5DB34F") + L("M124 55 L142 46", "#2E7A3E", 1.2) +
          E(84, 46, 12, 5, "#FFFFFF", op(.25) + rot(-14, 84, 46)) +
        "</g>" +
      "</g></svg>";
  }

  /* ---- Leo the lion cub, gardener (The Magic Garden) ---- */
  function lion() {
    var u = "kl" + (++uid) + "_";
    var fur = [[0, "#FFEAB0"], [.4, "#FFC95E"], [.85, "#DE982A"], [1, "#AE6C14"]];
    var d = rg(u + "Fur", fur) + rg(u + "Body", fur, "40%", "30%", "70%") +
      rg(u + "Mane", [[0, "#F9A855"], [.6, "#DA7322"], [1, "#9A4A10"]], "40%", "35%", "70%") +
      rg(u + "Cream", [[0, "#FFFFFF"], [.6, "#FFF2D4"], [1, "#EDD2A0"]], "45%", "30%", "70%") +
      lg(u + "Apron", [[0, "#A6E08E"], [1, "#4E9E58"]], 0, 0, 0, 1) + rg(u + "Nose", [[0, "#D47A58"], [1, "#7A3420"]], "35%", "25%", "75%") +
      lg(u + "Lid", [fur[1], fur[2]], 0, 0, 0, 1) + iris(u, [[0, "#8A5A1E"], [.5, "#46280A"], [1, "#160C02"]]);
    var mane = "";
    for (var i = 0; i < 12; i++) { var a = i * 30 * Math.PI / 180; mane += C(100 + Math.cos(a) * 54, 112 + Math.sin(a) * 48, 15, url(u, "Mane")); }
    return open("kc-lion", "Leo the lion cub") + d + "</defs>" +
      '<g class="kc-body">' + shadow(48) +
        '<g class="kc-tail">' + L("M138 204 C160 204 172 190 174 172", url(u, "Fur"), 7) + C(176, 167, 9, url(u, "Mane")) + "</g>" +
        '<g class="kc-legs">' + R(73, 196, 23, 34, 11.5, url(u, "Body")) + R(104, 196, 23, 34, 11.5, url(u, "Body")) +
          E(84.5, 226, 9, 4, url(u, "Cream")) + E(115.5, 226, 9, 4, url(u, "Cream")) + "</g>" +
        E(100, 188, 42, 39, url(u, "Body")) + E(100, 196, 24, 24, url(u, "Cream")) +
        P("M70 168 L130 168 L126 216 C110 222 90 222 74 216 Z", url(u, "Apron")) + L("M72 170 L66 154 M128 170 L134 154", url(u, "Apron"), 6) +
        R(87, 186, 26, 17, 5, "#3F8A4A") + L("M100 186 L100 172", "#3E8A45", 2.4) +
        P("M100 176 C94 170 88 172 86 176 C90 179 96 179 100 176 Z", "#7BCF5E") + P("M100 173 C106 167 112 169 114 173 C110 176 104 176 100 173 Z", "#7BCF5E") +
        '<g class="kc-arm-l">' + R(54, 158, 22, 44, 11, url(u, "Body")) + E(65, 200, 9, 5, url(u, "Cream")) + "</g>" +
        '<g class="kc-arm-r">' + R(124, 158, 22, 44, 11, url(u, "Body")) + E(135, 200, 9, 5, url(u, "Cream")) + "</g>" +
        '<g class="kc-head">' + mane +
          '<g class="kc-ear-l">' + C(58, 72, 16, url(u, "Fur")) + C(58, 73, 8, "#F7B9A0") + "</g>" +
          '<g class="kc-ear-r">' + C(142, 72, 16, url(u, "Fur")) + C(142, 73, 8, "#F7B9A0") + "</g>" +
          E(100, 114, 54, 50, url(u, "Fur")) +
          P("M88 68 C84 54 94 46 99 52 C101 42 114 44 111 58 C117 54 124 62 115 69 Z", url(u, "Mane")) +
          E(100, 139, 28, 20, url(u, "Cream")) + blush(135, 36) +
          C(86, 142, 1.5, "#B07A3A") + C(82, 136, 1.5, "#B07A3A") + C(114, 142, 1.5, "#B07A3A") + C(118, 136, 1.5, "#B07A3A") +
          face(u, { ex: 22, ey: 107, rx: 14, ry: 16, brow: "#9A5A1E", lid: url(u, "Lid"), mouthY: 148, mw: 10, mouth: "#6A2E14" }) +
          P("M90 128 C90 124 110 124 110 128 C110 134 100 138 100 138 C100 138 90 134 90 128 Z", url(u, "Nose")) + E(96, 127, 3.4, 1.6, "#FFFFFF", op(.55)) +
          L("M100 138 L100 143", "#6A2E14", 1.8) +
        "</g>" +
      "</g></svg>";
  }

  var C0 = Kido.Characters;
  C0.register("rabbit", rabbit); C0.register("ria", rabbit);
  C0.register("turtle", turtle); C0.register("tuk", turtle);
  C0.register("puppy", function () { return dog(PUPPY); }); C0.register("biscuit", function () { return dog(PUPPY); });
  C0.register("dog", function () { return dog(MAMA); });
  C0.register("bear", bear); C0.register("sam", bear);
  C0.register("panda", panda); C0.register("mia", panda);
  C0.register("lion", lion); C0.register("leo", lion);

  // A story character as puzzle art ("rig:puppy": Biscuit himself walks the paw-print maze).
  if (Kido.PuzzleEngine && Kido.PuzzleEngine.registerArt) Kido.PuzzleEngine.registerArt("rig", function (name) { return C0.create(name).el.innerHTML; });
})(window);
