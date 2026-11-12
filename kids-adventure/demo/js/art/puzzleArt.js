/* =========================================================================
   puzzleArt.js — drawings the puzzles need that Kido has no photo for
   (plant growth stages, habitats, sorting baskets, maze pieces). Same
   "storybook diorama" light as Kido World: lit from the upper-left, soft
   gradient shading, gentle cast shadows. Each drawing is a function returning
   an SVG string in a 100×100 box; register more with
   Kido.PuzzleEngine.registerArt(name, fn) — puzzle data refers to them as
   "name:variant" (e.g. "plant:3", "habitat:ocean").
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var uid = 0;

  function svg(inner, defs) {
    return '<svg class="pz-draw" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + (defs ? "<defs>" + defs + "</defs>" : "") + inner + "</svg>";
  }
  function lg(id, a, b, vertical) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
  }

  /* ---- plant growth stages 1 (seed) … 5 (flowering) ---- */
  function plant(stage) {
    var id = "pzp" + (++uid), s = +stage || 1;
    var d = lg(id + "p", "#E48A5A", "#A9502C") + lg(id + "l", "#A8E27E", "#3E9A55") + lg(id + "s", "#8A5A36", "#5E3A20", true);
    var h = '<ellipse cx="52" cy="93" rx="30" ry="4" fill="#23304A" opacity=".16"/>' +
      '<path d="M26 64 L74 64 L68 92 L32 92 Z" fill="url(#' + id + 'p)"/>' +
      '<rect x="23" y="59" width="54" height="9" rx="4" fill="#C8683D"/>' +
      '<ellipse cx="50" cy="61" rx="24" ry="4.5" fill="url(#' + id + 's)"/>' +
      '<path d="M30 66 L32 88" stroke="#FFFFFF" stroke-width="2" opacity=".25" stroke-linecap="round"/>';
    function leaf(x, y, r, flip) {
      return '<path d="M' + x + " " + y + " C" + (x + (flip ? -1 : 1) * r * .4) + " " + (y - r * .9) + " " + (x + (flip ? -1 : 1) * r * 1.4) + " " + (y - r * .6) + " " + (x + (flip ? -1 : 1) * r * 1.6) + " " + (y - r * .1) +
        " C" + (x + (flip ? -1 : 1) * r * 1.1) + " " + (y + r * .15) + " " + (x + (flip ? -1 : 1) * r * .4) + " " + (y + r * .1) + " " + x + " " + y + ' Z" fill="url(#' + id + 'l)"/>';
    }
    if (s === 1) {
      h += '<ellipse cx="50" cy="58" rx="9" ry="6" fill="#9A6036"/><ellipse cx="47" cy="56" rx="3.5" ry="2" fill="#E8C49A" opacity=".7"/>' +
        '<path d="M50 52 C50 55 51 57 53 58" stroke="#6E3F1E" stroke-width="1.2" fill="none"/>';
    } else {
      var top = [0, 0, 44, 32, 20, 16][s];
      h += '<path d="M50 60 C49 ' + (60 - (60 - top) * .5) + " 51 " + (top + 8) + " 50 " + top + '" stroke="#3E8A45" stroke-width="' + (s > 3 ? 3.2 : 2.4) + '" fill="none" stroke-linecap="round"/>';
      if (s >= 2) h += leaf(50, top + 2, 9, false) + leaf(50, top + 2, 9, true);
      if (s >= 3) h += leaf(50, top + 14, 11, true) + leaf(50, top + 18, 11, false);
      if (s >= 4) h += leaf(50, top + 28, 13, false) + leaf(50, top + 30, 13, true);
      if (s >= 5) {
        var f = "";
        for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; f += '<circle cx="' + (50 + Math.cos(a) * 7).toFixed(1) + '" cy="' + (top - 4 + Math.sin(a) * 7).toFixed(1) + '" r="5.5" fill="#FF7FA8"/>'; }
        h += f + '<circle cx="50" cy="' + (top - 4) + '" r="4.5" fill="#FFD24D"/>';
      }
    }
    return svg(h, d);
  }

  /* ---- habitats (little scenes) ---- */
  var HABITAT = {
    jungle: function (id) {
      return '<rect width="100" height="100" fill="url(#' + id + 'a)"/>' +
        '<circle cx="18" cy="30" r="22" fill="#2E7D4F"/><circle cx="50" cy="18" r="24" fill="#3E9A63"/><circle cx="84" cy="30" r="22" fill="#2E7D4F"/>' +
        '<rect x="22" y="40" width="7" height="50" fill="#7A4B2A"/><rect x="72" y="42" width="7" height="48" fill="#7A4B2A"/>' +
        '<path d="M38 20 C40 40 34 52 38 66 M62 18 C60 36 66 48 62 62" stroke="#2E7A45" stroke-width="2.4" fill="none"/>' +
        '<rect y="80" width="100" height="20" fill="#4E9A52"/><path d="M0 84 Q10 76 18 84 Q26 76 34 84 Q44 76 52 84 Q62 76 70 84 Q80 76 88 84 Q96 78 100 82 V100 H0Z" fill="#5CB564"/>';
    },
    ocean: function (id) {
      return '<rect width="100" height="100" fill="url(#' + id + 'a)"/>' +
        '<circle cx="78" cy="18" r="9" fill="#FFF3B0"/><rect y="40" width="100" height="60" fill="url(#' + id + 'b)"/>' +
        '<path d="M0 44 Q12 38 25 44 T50 44 T75 44 T100 44" stroke="#FFFFFF" stroke-width="2.5" fill="none" opacity=".8"/>' +
        '<path d="M0 62 Q12 57 25 62 T50 62 T75 62 T100 62" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".45"/>' +
        '<path d="M10 100 C12 88 20 84 18 76 C24 84 22 92 26 100Z" fill="#FF8FA3"/><path d="M78 100 C76 90 86 84 90 80 C88 90 92 94 90 100Z" fill="#FFB870"/>';
    },
    savanna: function (id) {
      return '<rect width="100" height="100" fill="url(#' + id + 'c)"/><circle cx="26" cy="30" r="12" fill="#FFF1B8"/>' +
        '<rect y="66" width="100" height="34" fill="#E3B24E"/><path d="M0 70 Q20 62 40 70 T80 68 T100 70 V100 H0Z" fill="#EFC463"/>' +
        '<rect x="64" y="40" width="4" height="32" fill="#7A4B2A"/><ellipse cx="66" cy="38" rx="24" ry="7" fill="#5E8C3A"/><ellipse cx="62" cy="34" rx="14" ry="4" fill="#77A94C"/>' +
        '<path d="M8 84 l3 -8 l3 8 M20 90 l3 -9 l3 9 M44 86 l3 -8 l3 8" stroke="#B9862E" stroke-width="1.6" fill="none"/>';
    },
    farm: function (id) {
      return '<rect width="100" height="100" fill="url(#' + id + 'a)"/>' +
        '<rect y="62" width="100" height="38" fill="#7CC46E"/><path d="M0 64 Q30 54 60 62 T100 60 V70 H0Z" fill="#9AD684"/>' +
        '<path d="M52 36 L72 22 L92 36 L92 66 L52 66 Z" fill="#D8483D"/><path d="M48 38 L72 20 L96 38" stroke="#8E2A22" stroke-width="4" fill="none"/>' +
        '<rect x="66" y="48" width="12" height="18" fill="#FFFFFF"/><path d="M66 48 L78 66 M78 48 L66 66" stroke="#D8483D" stroke-width="2"/>' +
        '<path d="M4 76 H46 M4 84 H46 M10 70 V90 M22 70 V90 M34 70 V90" stroke="#C99456" stroke-width="3"/>';
    },
    ice: function (id) {
      return '<rect width="100" height="100" fill="url(#' + id + 'd)"/>' +
        '<rect y="64" width="100" height="36" fill="#6EC3E6"/>' +
        '<path d="M6 70 L34 62 L50 70 L40 80 L12 80 Z" fill="#F4FBFF"/><path d="M50 74 L86 64 L98 72 L88 84 L56 84 Z" fill="#E6F6FF"/>' +
        '<path d="M22 60 L30 34 L40 60 Z" fill="#FFFFFF"/><path d="M30 34 L40 60 L34 60 Z" fill="#CFEAF7"/>' +
        '<circle cx="20" cy="18" r="1.6" fill="#FFFFFF"/><circle cx="60" cy="12" r="1.4" fill="#FFFFFF"/><circle cx="84" cy="24" r="1.8" fill="#FFFFFF"/>';
    },
    pond: function (id) {
      return '<rect width="100" height="100" fill="url(#' + id + 'a)"/>' +
        '<rect y="46" width="100" height="54" fill="#7CC46E"/><ellipse cx="50" cy="74" rx="44" ry="18" fill="url(#' + id + 'b)"/>' +
        '<ellipse cx="34" cy="72" rx="9" ry="4" fill="#5CB564"/><path d="M34 72 L41 70" stroke="url(#' + id + 'b)" stroke-width="2"/><ellipse cx="64" cy="78" rx="8" ry="3.6" fill="#5CB564"/>' +
        '<circle cx="68" cy="76" r="2.4" fill="#FF8FB0"/><path d="M10 60 C12 48 14 42 12 34 M16 60 C18 50 20 46 22 40" stroke="#3E8A45" stroke-width="2" fill="none"/>' +
        '<ellipse cx="12" cy="34" rx="2.4" ry="5" fill="#8A5A36"/>';
    }
  };
  function habitat(name) {
    var id = "pzh" + (++uid);
    var d = lg(id + "a", "#9ED8FF", "#E7F6FF", true) + lg(id + "b", "#5FC7EA", "#1F86C6", true) +
      lg(id + "c", "#FFC98A", "#FFE9B8", true) + lg(id + "d", "#CFE7FF", "#F2F9FF", true);
    return svg((HABITAT[name] || HABITAT.jungle)(id), d);
  }

  /* ---- sorting baskets with a picture label ---- */
  var BADGE = {
    animals: '<g transform="translate(50 76)"><ellipse cx="0" cy="4" rx="6" ry="5" fill="#8A5A36"/><circle cx="-7" cy="-3" r="3" fill="#8A5A36"/><circle cx="-2.4" cy="-7" r="3" fill="#8A5A36"/><circle cx="2.4" cy="-7" r="3" fill="#8A5A36"/><circle cx="7" cy="-3" r="3" fill="#8A5A36"/></g>',
    food: '<g transform="translate(50 74)"><circle cx="-3" cy="2" r="8" fill="#E8413C"/><circle cx="3" cy="2" r="8" fill="#E8413C"/><path d="M0 -6 C0 -9 1 -11 3 -12" stroke="#6E3F1E" stroke-width="1.6" fill="none"/><ellipse cx="5" cy="-9" rx="4" ry="2" fill="#5CB564"/><circle cx="-5" cy="-1" r="2" fill="#FFFFFF" opacity=".5"/></g>',
    vehicles: '<g transform="translate(50 76)"><path d="M-12 2 L-12 -4 L-6 -10 L6 -10 L12 -4 L12 2 Z" fill="#4E7BEA"/><rect x="-6" y="-8" width="11" height="5" rx="1" fill="#CFE7FF"/><circle cx="-7" cy="4" r="3.4" fill="#2B2151"/><circle cx="7" cy="4" r="3.4" fill="#2B2151"/></g>'
  };
  function basket(kind) {
    var id = "pzb" + (++uid);
    var d = lg(id + "w", "#E3AD72", "#A8683A", true);
    var weave = "";
    for (var i = 0; i < 5; i++) weave += '<path d="M' + (14 + i * 18) + ' 46 L' + (18 + i * 16) + ' 92" stroke="#8A5530" stroke-width="1.4" opacity=".5"/>';
    return svg('<ellipse cx="50" cy="94" rx="40" ry="4" fill="#23304A" opacity=".16"/>' +
      '<path d="M26 46 C26 18 74 18 74 46" stroke="#A8683A" stroke-width="5" fill="none"/>' +
      '<path d="M8 44 L92 44 L82 92 L18 92 Z" fill="url(#' + id + 'w)"/>' + weave +
      '<path d="M12 56 L88 56 M15 70 L85 70 M17 82 L83 82" stroke="#8A5530" stroke-width="1.6" opacity=".45"/>' +
      '<rect x="4" y="40" width="92" height="9" rx="4.5" fill="#C98A52"/>' +
      '<circle cx="50" cy="74" r="15" fill="#FFF8EA" stroke="#E0B383" stroke-width="2"/>' + (BADGE[kind] || ""), d);
  }

  /* ---- maze pieces ---- */
  function rock() {
    return svg('<ellipse cx="54" cy="84" rx="36" ry="7" fill="#23304A" opacity=".18"/>' +
      '<path d="M14 82 C10 60 26 36 48 32 C70 28 88 46 88 66 C88 76 84 82 80 84 Z" fill="#B7ACD0"/>' +
      '<path d="M22 64 C26 48 38 38 54 38 C40 44 32 52 28 66 Z" fill="#FFFFFF" opacity=".45"/>' +
      '<path d="M60 44 C76 50 84 62 82 80 L70 82 C74 66 70 54 60 44 Z" fill="#7F74A2" opacity=".35"/>');
  }
  function bush() {
    return svg('<ellipse cx="52" cy="86" rx="38" ry="6" fill="#23304A" opacity=".18"/>' +
      '<circle cx="30" cy="62" r="22" fill="#3A9A5E"/><circle cx="70" cy="62" r="22" fill="#3A9A5E"/><circle cx="50" cy="48" r="26" fill="#66BF67"/>' +
      '<circle cx="42" cy="38" r="9" fill="#FFFFFF" opacity=".22"/><circle cx="36" cy="58" r="3" fill="#FF7FA8"/><circle cx="64" cy="54" r="3" fill="#FFD24D"/>');
  }
  function goal() {
    return svg('<circle cx="50" cy="52" r="38" fill="#FFE9A8" opacity=".75"/><circle cx="50" cy="52" r="26" fill="#FFF6D6"/>' +
      '<path d="M50 30 l6 13 l14 2 l-10 10 l2 14 l-12 -7 l-12 7 l2 -14 l-10 -10 l14 -2 z" fill="#FFC23D" stroke="#E59A12" stroke-width="2" stroke-linejoin="round"/>');
  }

  /* ---- footprints in soft mud (for "whose tracks are these?") ---- */
  var TRACK = {
    bird: function () {       // three thin forward toes + a short back toe
      var one = function (x, y, r) {
        return '<g transform="translate(' + x + " " + y + ") rotate(" + r + ')" stroke="#5A3A20" stroke-width="3.2" stroke-linecap="round" fill="none">' +
          '<path d="M0 0 L0 -14 M0 0 L-9 -11 M0 0 L9 -11 M0 0 L0 6"/></g>';
      };
      return one(34, 38, -8) + one(62, 58, 6) + one(38, 82, -6);
    },
    cat: function () {        // round pad + four toe beans
      var one = function (x, y) {
        return '<g transform="translate(' + x + " " + y + ')" fill="#5A3A20"><ellipse cx="0" cy="4" rx="7" ry="6"/><circle cx="-8" cy="-5" r="3"/><circle cx="-3" cy="-9" r="3"/><circle cx="3" cy="-9" r="3"/><circle cx="8" cy="-5" r="3"/></g>';
      };
      return one(34, 36) + one(64, 58) + one(36, 82);
    },
    deer: function () {       // split hoof
      var one = function (x, y) {
        return '<g transform="translate(' + x + " " + y + ')" fill="#5A3A20"><path d="M-2 -10 C-8 -8 -9 4 -4 8 C-2 4 -1 -4 -2 -10 Z"/><path d="M2 -10 C8 -8 9 4 4 8 C2 4 1 -4 2 -10 Z"/></g>';
      };
      return one(34, 36) + one(62, 58) + one(38, 82);
    },
    duck: function () {       // webbed foot
      var one = function (x, y, r) {
        return '<g transform="translate(' + x + " " + y + ") rotate(" + r + ')" fill="#5A3A20"><path d="M0 4 L-11 -10 Q-6 -8 -4 -12 Q0 -9 4 -12 Q6 -8 11 -10 Z"/></g>';
      };
      return one(34, 38, -8) + one(62, 58, 6) + one(38, 82, -6);
    }
  };
  function track(kind) {
    var id = "pzt" + (++uid);
    return svg('<rect width="100" height="100" rx="14" fill="url(#' + id + 'm)"/>' +
      '<ellipse cx="30" cy="20" rx="18" ry="4" fill="#FFFFFF" opacity=".12"/><ellipse cx="74" cy="84" rx="16" ry="4" fill="#3E2A18" opacity=".12"/>' +
      (TRACK[kind] || TRACK.bird)(), lg(id + "m", "#C9A274", "#8E6440", true));
  }

  /* ---- Tiko, the little bluebird (portrait / puzzle token) ---- */
  function songbird() {
    var id = "pzs" + (++uid);
    return svg('<ellipse cx="52" cy="92" rx="26" ry="4" fill="#23304A" opacity=".16"/>' +
      '<path d="M70 70 C84 66 94 72 98 82 C88 82 82 84 78 88 Z" fill="url(#' + id + 'w)"/>' +
      '<ellipse cx="52" cy="68" rx="30" ry="24" fill="url(#' + id + 'b)"/><ellipse cx="52" cy="74" rx="19" ry="17" fill="#FFD9B0"/>' +
      '<path d="M28 60 C18 66 18 80 26 88 C32 80 36 72 36 64 Z" fill="url(#' + id + 'w)"/>' +
      '<circle cx="52" cy="38" r="24" fill="url(#' + id + 'b)"/><ellipse cx="52" cy="48" rx="14" ry="10" fill="#FFE6CC"/>' +
      '<path d="M48 16 C46 8 50 4 54 4 C52 10 54 14 56 18 Z" fill="#3F86D9"/>' +
      '<circle cx="44" cy="36" r="6" fill="#fff"/><circle cx="60" cy="36" r="6" fill="#fff"/><circle cx="44.6" cy="37" r="4" fill="#1B1840"/><circle cx="60.6" cy="37" r="4" fill="#1B1840"/>' +
      '<circle cx="46" cy="35" r="1.4" fill="#fff"/><circle cx="62" cy="35" r="1.4" fill="#fff"/>' +
      '<path d="M46 44 L58 44 L52 52 Z" fill="#F2A43A"/><ellipse cx="38" cy="45" rx="4" ry="2.6" fill="#FF7FA8" opacity=".5"/><ellipse cx="66" cy="45" rx="4" ry="2.6" fill="#FF7FA8" opacity=".5"/>' +
      '<path d="M46 90 L44 96 M58 90 L60 96" stroke="#E8861A" stroke-width="2.4" stroke-linecap="round"/>',
      '<radialGradient id="' + id + 'b" cx="36%" cy="28%" r="72%"><stop offset="0" stop-color="#BDE6FF"/><stop offset=".45" stop-color="#6DBBF5"/><stop offset="1" stop-color="#2F6CC0"/></radialGradient>' +
      lg(id + "w", "#8FCBFF", "#22498F"));
  }

  /* =====================================================================
     Change #13 — science & nature drawings (same light, same 100×100 box)
     ===================================================================== */

  /* ---- butterfly life cycle 1 (egg) … 4 (butterfly), monarch-inspired ---- */
  function leafBed(id) {
    return '<path d="M8 72 C22 44 58 32 92 40 C78 64 44 82 8 72 Z" fill="url(#' + id + 'l)"/>' +
      '<path d="M12 70 C38 60 64 50 88 41" stroke="#2E7D4F" stroke-width="1.6" fill="none" opacity=".7"/>' +
      '<path d="M32 62 L38 51 M48 57 L54 46 M64 51 L69 42" stroke="#2E7D4F" stroke-width="1.1" fill="none" opacity=".55"/>';
  }
  function bug(stage) {
    var id = "pzu" + (++uid), s = Math.max(1, Math.min(4, +stage || 1));
    var d = lg(id + "l", "#B6E88A", "#3E9A55") +
      '<radialGradient id="' + id + 'c" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#D8FFE0"/><stop offset=".55" stop-color="#73D18F"/><stop offset="1" stop-color="#2F9A5E"/></radialGradient>' +
      '<radialGradient id="' + id + 'o" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#FFC56B"/><stop offset=".7" stop-color="#F7891F"/><stop offset="1" stop-color="#D9620F"/></radialGradient>';
    var h = '<ellipse cx="50" cy="92" rx="30" ry="4" fill="#23304A" opacity=".15"/>';
    if (s === 1) {
      h += leafBed(id) + '<circle cx="52" cy="50" r="13" fill="none" stroke="#FFD24D" stroke-width="2" stroke-dasharray="3 3"/>' +
        '<ellipse cx="52" cy="50" rx="6" ry="8" fill="#FFF6DC" stroke="#E9D5A6" stroke-width="1"/>' +
        '<path d="M49 44 C48 48 48 52 49 56 M52 42 L52 58 M55 44 C56 48 56 52 55 56" stroke="#E2CC98" stroke-width=".8" fill="none"/>' +
        '<ellipse cx="50" cy="46" rx="1.6" ry="2.4" fill="#FFFFFF" opacity=".9"/>';
    } else if (s === 2) {
      h += leafBed(id);
      var p0 = [22, 56], p1 = [48, 38], p2 = [74, 48], body = "", i;
      function at(t) { var u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; }
      function nrm(t) {
        var dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
        var L = Math.sqrt(dx * dx + dy * dy) || 1; return [-dy / L, dx / L];
      }
      h += '<path d="M' + p0.join(" ") + " Q" + p1.join(" ") + " " + p2.join(" ") + '" stroke="#FFF8E6" stroke-width="12" stroke-linecap="round" fill="none"/>';
      for (i = 0; i <= 9; i++) {
        var t = .04 + i * .1, c = at(t), n = nrm(t), c2 = at(Math.min(1, t + .045));
        body += '<path d="M' + (c[0] + n[0] * 5.4).toFixed(1) + " " + (c[1] + n[1] * 5.4).toFixed(1) + " L" + (c[0] - n[0] * 5.4).toFixed(1) + " " + (c[1] - n[1] * 5.4).toFixed(1) + '" stroke="#1E1A24" stroke-width="2.6" stroke-linecap="round"/>' +
          '<path d="M' + (c2[0] + n[0] * 5).toFixed(1) + " " + (c2[1] + n[1] * 5).toFixed(1) + " L" + (c2[0] - n[0] * 5).toFixed(1) + " " + (c2[1] - n[1] * 5).toFixed(1) + '" stroke="#FFD43B" stroke-width="2.2" stroke-linecap="round"/>';
      }
      h += body + '<circle cx="77" cy="47" r="6.4" fill="#1E1A24"/><circle cx="75.4" cy="45" r="1.5" fill="#FFFFFF" opacity=".85"/>' +
        '<path d="M78 41 C79 35 83 33 86 32 M74 41 C73 35 74 31 76 29" stroke="#1E1A24" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M23 52 C19 47 17 44 14 43" stroke="#1E1A24" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    } else if (s === 3) {
      h += '<path d="M12 18 C34 13 66 15 90 20" stroke="#8A5A36" stroke-width="5" stroke-linecap="round" fill="none"/>' +
        '<path d="M70 17 C74 10 80 8 86 9" stroke="#6E9E4A" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="86" cy="9" rx="5" ry="3" fill="#7DBA55"/>' +
        '<rect x="49" y="19" width="2.6" height="9" rx="1" fill="#2B2151"/>' +
        '<path d="M50 27 C63 29 67 44 65 58 C63 70 57 79 50 81 C43 79 37 70 35 58 C33 44 37 29 50 27 Z" fill="url(#' + id + 'c)"/>' +
        '<path d="M37 41 C45 44 55 44 63 41" stroke="#1E1A24" stroke-width="1.6" fill="none" opacity=".75"/>';
      for (var g = 0; g < 7; g++) h += '<circle cx="' + (39 + g * 3.7).toFixed(1) + '" cy="' + (41.6 + Math.abs(g - 3) * .25).toFixed(1) + '" r="1.25" fill="#FFD24D"/>';
      h += '<circle cx="44" cy="70" r="1.3" fill="#FFD24D"/><circle cx="56" cy="70" r="1.3" fill="#FFD24D"/><circle cx="50" cy="75" r="1.1" fill="#FFD24D"/>' +
        '<ellipse cx="44" cy="50" rx="3.5" ry="9" fill="#FFFFFF" opacity=".35"/>';
    } else {
      var fore = '<path d="M48 46 C40 28 22 16 11 25 C4 32 10 46 22 52 C30 56 40 56 48 54 Z" fill="url(#' + id + 'o)" stroke="#2B1B10" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M46 50 C36 42 26 34 16 30 M44 52 C34 48 24 46 16 44 M46 48 C40 36 32 26 22 22" stroke="#2B1B10" stroke-width="1.3" fill="none"/>';
      var hind = '<path d="M47 56 C36 58 24 64 22 74 C22 82 32 84 40 78 C46 72 48 64 48 58 Z" fill="url(#' + id + 'o)" stroke="#2B1B10" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M46 60 C40 64 34 70 30 78 M47 62 C44 68 42 74 40 78" stroke="#2B1B10" stroke-width="1.2" fill="none"/>';
      var dots = '<circle cx="14" cy="28" r="1.3" fill="#FFFFFF"/><circle cx="11" cy="34" r="1.2" fill="#FFFFFF"/><circle cx="14" cy="41" r="1.2" fill="#FFFFFF"/>' +
        '<circle cx="25" cy="78" r="1.2" fill="#FFFFFF"/><circle cx="31" cy="82" r="1.1" fill="#FFFFFF"/>';
      var half = fore + hind + dots;
      h += '<g>' + half + '</g><g transform="matrix(-1 0 0 1 100 0)">' + half + '</g>' +
        '<ellipse cx="50" cy="58" rx="3.2" ry="14" fill="#2B1B10"/><circle cx="50" cy="42" r="3.8" fill="#2B1B10"/>' +
        '<circle cx="48.8" cy="56" r=".9" fill="#FFFFFF" opacity=".8"/><circle cx="51.2" cy="62" r=".9" fill="#FFFFFF" opacity=".8"/>' +
        '<path d="M49 39 C46 30 42 26 38 25 M51 39 C54 30 58 26 62 25" stroke="#2B1B10" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
        '<circle cx="38" cy="25" r="1.8" fill="#2B1B10"/><circle cx="62" cy="25" r="1.8" fill="#2B1B10"/>';
    }
    return svg(h, d);
  }

  /* ---- moon phases 1 (new) … 5 (full), waxing; lit side on the right ---- */
  function moon(stage) {
    var id = "pzm" + (++uid), s = Math.max(1, Math.min(5, +stage || 1));
    var d = lg(id + "n", "#1E2A5A", "#3B4C8F", true) +
      '<radialGradient id="' + id + 'g" cx="40%" cy="35%" r="72%"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".6" stop-color="#FFE9A0"/><stop offset="1" stop-color="#E8C35C"/></radialGradient>';
    var lit = s === 1 ? "" : s === 5 ? '<circle cx="50" cy="50" r="26" fill="url(#' + id + 'g)"/>' :
      '<path d="M50 24 A26 26 0 0 1 50 76 ' + (s === 2 ? "A15 26 0 0 0 50 24" : s === 3 ? "L50 24" : "A15 26 0 0 1 50 24") + ' Z" fill="url(#' + id + 'g)"/>';
    var craters = s >= 3 ? '<circle cx="60" cy="40" r="3.4" fill="#E2C46E" opacity=".55"/><circle cx="64" cy="58" r="4.4" fill="#E2C46E" opacity=".5"/><circle cx="55" cy="66" r="2.4" fill="#E2C46E" opacity=".5"/>' +
      (s === 5 ? '<circle cx="38" cy="44" r="4" fill="#E2C46E" opacity=".5"/><circle cx="42" cy="62" r="2.8" fill="#E2C46E" opacity=".45"/>' : "") : "";
    return svg('<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#' + id + 'n)"/>' +
      '<circle cx="20" cy="20" r="1.4" fill="#FFFFFF"/><circle cx="82" cy="17" r="1.1" fill="#FFFFFF" opacity=".8"/><circle cx="84" cy="81" r="1.3" fill="#FFFFFF" opacity=".7"/><circle cx="15" cy="79" r="1" fill="#FFFFFF" opacity=".6"/>' +
      '<circle cx="50" cy="50" r="26" fill="#45528A"/>' + lit + craters +
      '<circle cx="50" cy="50" r="26" fill="none" stroke="#9DADE0" stroke-width="1.2" opacity=".6"/>', d);
  }

  /* ---- everyday things for "float or sink?" and "will a magnet pick it up?" ---- */
  var THING = {
    duck: function (id) {
      return '<path d="M24 62 C24 48 40 44 56 48 C66 50 74 46 79 39 C85 44 85 58 79 66 C71 76 34 78 24 62 Z" fill="url(#' + id + 'y)"/>' +
        '<circle cx="36" cy="40" r="13" fill="url(#' + id + 'y)"/>' +
        '<path d="M23 42 C14 41 11 46 15 49 C19 51 26 49 27 46 Z" fill="#FF8A1F"/>' +
        '<circle cx="32.6" cy="37" r="2.3" fill="#1E1A24"/><circle cx="31.8" cy="36.2" r=".8" fill="#FFFFFF"/>' +
        '<path d="M46 57 C54 52 64 54 66 60 C60 65 50 64 46 57 Z" fill="#F6B526"/>' +
        '<ellipse cx="32" cy="32" rx="5" ry="3" fill="#FFFFFF" opacity=".45"/>';
    },
    leaf: function (id) {
      return '<path d="M20 72 C24 40 50 22 84 18 C82 52 60 76 20 72 Z" fill="url(#' + id + 'g)"/>' +
        '<path d="M22 70 C40 56 60 40 82 20" stroke="#2E7D4F" stroke-width="1.8" fill="none"/>' +
        '<path d="M36 58 L36 44 M48 48 L50 34 M60 38 L64 26 M42 54 L56 56 M54 44 L68 46" stroke="#2E7D4F" stroke-width="1.1" fill="none" opacity=".6"/>' +
        '<path d="M21 71 L12 82" stroke="#8A5A36" stroke-width="2.6" stroke-linecap="round"/>';
    },
    block: function (id) {
      return '<path d="M24 40 L44 28 L80 28 L60 40 Z" fill="#F2C98C"/>' +
        '<path d="M24 40 L60 40 L60 82 L24 82 Z" fill="url(#' + id + 'w)"/>' +
        '<path d="M60 40 L80 28 L80 70 L60 82 Z" fill="#B97A3E"/>' +
        '<path d="M33 74 L42 50 L51 74 M36.5 66 L47.5 66" stroke="#E8413C" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M64 46 L76 39 M64 58 L76 51" stroke="#9C6531" stroke-width="1" opacity=".6"/>';
    },
    coin: function (id) {
      return '<ellipse cx="50" cy="58" rx="27" ry="27" fill="#B98A12"/>' +
        '<ellipse cx="50" cy="54" rx="27" ry="27" fill="url(#' + id + 'o)"/>' +
        '<circle cx="50" cy="54" r="21" fill="none" stroke="#C9971A" stroke-width="2"/>' +
        '<path d="M50 40 l4.2 8.6 l9.4 1.4 l-6.8 6.6 l1.6 9.4 l-8.4 -4.4 l-8.4 4.4 l1.6 -9.4 l-6.8 -6.6 l9.4 -1.4 z" fill="#E9B52C"/>' +
        '<ellipse cx="40" cy="40" rx="8" ry="4" fill="#FFFFFF" opacity=".45" transform="rotate(-30 40 40)"/>';
    },
    nail: function (id) {
      return '<rect x="39" y="16" width="22" height="7" rx="3.5" fill="url(#' + id + 's)"/>' +
        '<rect x="46.5" y="22" width="7" height="54" fill="url(#' + id + 's)"/>' +
        '<path d="M46.5 76 L53.5 76 L50 90 Z" fill="#8A93A6"/>' +
        '<path d="M48.5 26 L48.5 72" stroke="#FFFFFF" stroke-width="1.4" opacity=".6"/>';
    },
    clip: function (id) {
      return '<g transform="rotate(-24 50 52)"><path d="M44 30 L44 74 C44 84 60 84 60 74 L60 22 C60 10 36 10 36 22 L36 68" stroke="url(#' + id + 's)" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>';
    },
    key: function (id) {
      return '<g transform="rotate(-18 50 50)"><circle cx="30" cy="50" r="14" fill="url(#' + id + 'o)"/><circle cx="30" cy="50" r="5" fill="#FFFDF8"/>' +
        '<rect x="42" y="46" width="42" height="8" rx="2" fill="url(#' + id + 'o)"/>' +
        '<path d="M70 54 L70 64 L76 64 L76 54 M60 54 L60 61 L65 61 L65 54" fill="#D9A322"/>' +
        '<ellipse cx="25" cy="43" rx="4" ry="2.4" fill="#FFFFFF" opacity=".5"/></g>';
    },
    marble: function (id) {
      return '<circle cx="50" cy="54" r="24" fill="url(#' + id + 'm)"/>' +
        '<path d="M34 60 C42 46 56 66 66 50" stroke="#FFD24D" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>' +
        '<path d="M36 50 C44 58 54 40 64 60" stroke="#FF6B8A" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '<ellipse cx="41" cy="42" rx="7" ry="4.5" fill="#FFFFFF" opacity=".7" transform="rotate(-30 41 42)"/>';
    },
    crayon: function (id) {
      return '<g transform="rotate(-35 50 52)"><rect x="22" y="44" width="52" height="16" rx="3" fill="url(#' + id + 'r)"/>' +
        '<rect x="34" y="44" width="28" height="16" fill="#FFF6E2"/><path d="M38 44 L38 60 M58 44 L58 60" stroke="#E8413C" stroke-width="1.6"/>' +
        '<path d="M74 44 L88 52 L74 60 Z" fill="#E8413C"/><path d="M84 50 L88 52 L84 54 Z" fill="#B42A25"/>' +
        '<rect x="22" y="47" width="52" height="3" fill="#FFFFFF" opacity=".25"/></g>';
    },
    pin: function (id) {
      return '<g transform="rotate(-12 50 52)"><circle cx="22" cy="52" r="7" fill="none" stroke="url(#' + id + 's)" stroke-width="3"/>' +
        '<path d="M26 46 L76 42 M26 58 L74 56" stroke="url(#' + id + 's)" stroke-width="3" stroke-linecap="round" fill="none"/>' +
        '<rect x="70" y="36" width="16" height="13" rx="4" fill="url(#' + id + 's)"/><path d="M74 56 L80 49" stroke="#8A93A6" stroke-width="2.4" stroke-linecap="round"/></g>';
    }
  };
  function thing(name) {
    var id = "pzo" + (++uid);
    var d = '<radialGradient id="' + id + 'y" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6B8"/><stop offset=".6" stop-color="#FFD23F"/><stop offset="1" stop-color="#F2A81C"/></radialGradient>' +
      lg(id + "g", "#B6E88A", "#3E9A55") + lg(id + "w", "#F7D49C", "#D79A55", true) +
      '<radialGradient id="' + id + 'o" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#FFF2B0"/><stop offset=".55" stop-color="#F6C844"/><stop offset="1" stop-color="#C9921A"/></radialGradient>' +
      lg(id + "s", "#F2F5FA", "#8A93A6") +
      '<radialGradient id="' + id + 'm" cx="38%" cy="32%" r="72%"><stop offset="0" stop-color="#D8F1FF"/><stop offset=".55" stop-color="#5EB6F2"/><stop offset="1" stop-color="#1F5FB4"/></radialGradient>' +
      lg(id + "r", "#FF7B6B", "#C8322B", true);
    return svg('<ellipse cx="52" cy="92" rx="28" ry="4" fill="#23304A" opacity=".15"/>' + (THING[name] || THING.block)(id), d);
  }

  /* ---- sorting bins: a water tank (floats / sinks) and a magnet (sticks / doesn't) ---- */
  function tub(kind) {
    var id = "pzw" + (++uid);
    var d = lg(id + "a", "#9FDFFF", "#3C9AD8", true);
    var h = '<ellipse cx="50" cy="94" rx="40" ry="4" fill="#23304A" opacity=".15"/>' +
      '<rect x="12" y="26" width="76" height="64" rx="10" fill="#EEF8FF" stroke="#9CCBEA" stroke-width="2.4"/>' +
      '<path d="M14 44 Q26 40 38 44 T62 44 T86 44 L86 80 Q86 88 78 88 L22 88 Q14 88 14 80 Z" fill="url(#' + id + 'a)"/>' +
      '<rect x="18" y="30" width="6" height="52" rx="3" fill="#FFFFFF" opacity=".45"/>';
    if (kind === "sink") {
      h += '<path d="M36 86 C34 76 44 70 52 71 C62 72 68 80 64 86 Z" fill="#9A93B8"/><path d="M42 80 C44 75 50 74 54 75" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".5"/>' +
        '<circle cx="58" cy="62" r="2.4" fill="#FFFFFF" opacity=".75"/><circle cx="54" cy="52" r="1.7" fill="#FFFFFF" opacity=".75"/>' +
        '<path d="M76 54 L76 74 M70 68 L76 75 L82 68" stroke="#1F5FB4" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    } else {
      h += '<circle cx="48" cy="42" r="10" fill="#FFC93C"/><path d="M38 44 A10 10 0 0 0 58 44 Z" fill="#E8A51E"/><ellipse cx="45" cy="38" rx="3.5" ry="2.2" fill="#FFFFFF" opacity=".6"/>' +
        '<path d="M30 46 Q36 43 40 46 M56 46 Q62 43 68 46" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".8"/>' +
        '<path d="M76 36 L76 16 M70 22 L76 15 L82 22" stroke="#2E9A55" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    return svg(h, d);
  }
  function magnet(kind) {
    var id = "pzg" + (++uid);
    var d = lg(id + "r", "#FF7B6B", "#C8322B", true) + lg(id + "s", "#F2F5FA", "#8A93A6");
    var h = '<ellipse cx="50" cy="94" rx="34" ry="4" fill="#23304A" opacity=".15"/>' +
      '<path d="M30 62 L30 40 C30 18 70 18 70 40 L70 62" stroke="url(#' + id + 'r)" stroke-width="15" fill="none"/>' +
      '<rect x="22.5" y="58" width="15" height="12" fill="url(#' + id + 's)"/><rect x="62.5" y="58" width="15" height="12" fill="url(#' + id + 's)"/>' +
      '<path d="M36 28 C40 22 48 20 54 20" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".4" stroke-linecap="round"/>';
    if (kind === "not") {
      h += '<path d="M40 82 L52 76 L66 76 L54 82 Z" fill="#F2C98C"/><path d="M40 82 L54 82 L54 92 L40 92 Z" fill="#D79A55"/><path d="M54 82 L66 76 L66 86 L54 92 Z" fill="#B97A3E"/>' +
        '<circle cx="84" cy="22" r="11" fill="#FFFFFF" stroke="#E8413C" stroke-width="3"/><path d="M76.5 29.5 L91.5 14.5" stroke="#E8413C" stroke-width="3" stroke-linecap="round"/>';
    } else {
      h += '<path d="M28 74 L28 86 C28 92 36 92 36 86 L36 72 C36 66 26 66 26 72 L26 82" stroke="url(#' + id + 's)" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M70 76 L70 90 M66 78 L70 76 L74 78" stroke="url(#' + id + 's)" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M14 64 L8 60 M14 72 L7 72 M86 64 L92 60 M86 72 L93 72" stroke="#FFC23D" stroke-width="2.4" stroke-linecap="round"/>';
    }
    return svg(h, d);
  }
  HABITAT.sky = function (id) {
    return '<rect width="100" height="100" fill="url(#' + id + 'a)"/><circle cx="78" cy="22" r="11" fill="#FFF1B0"/>' +
      '<g fill="#FFFFFF"><circle cx="26" cy="40" r="10"/><circle cx="38" cy="36" r="13"/><circle cx="50" cy="42" r="9"/><rect x="18" y="40" width="40" height="10" rx="5"/></g>' +
      '<g fill="#FFFFFF" opacity=".85"><circle cx="66" cy="66" r="8"/><circle cx="76" cy="62" r="10"/><circle cx="86" cy="68" r="7"/><rect x="60" y="66" width="32" height="8" rx="4"/></g>' +
      '<path d="M20 70 Q24 66 28 70 Q32 66 36 70" stroke="#2B2151" stroke-width="2" fill="none" stroke-linecap="round"/>';
  };
  HABITAT.land = function (id) {
    return '<rect width="100" height="100" fill="url(#' + id + 'a)"/><circle cx="22" cy="22" r="10" fill="#FFF1B0"/>' +
      '<path d="M0 66 Q26 52 52 62 T100 56 V100 H0Z" fill="#8CCF6E"/><path d="M0 78 Q30 68 60 76 T100 72 V100 H0Z" fill="#6BBE5A"/>' +
      '<rect x="68" y="40" width="5" height="24" fill="#7A4B2A"/><circle cx="70" cy="36" r="13" fill="#3E9A63"/><circle cx="64" cy="32" r="6" fill="#5CB564" opacity=".8"/>' +
      '<circle cx="22" cy="84" r="2.4" fill="#FF7FA8"/><circle cx="34" cy="90" r="2.4" fill="#FFD24D"/><circle cx="46" cy="84" r="2.2" fill="#FFFFFF"/>';
  };
  HABITAT.beach = function (id) {   // sea, foam line, sand — with a turtle nest of eggs and a shell
    return '<rect width="100" height="100" fill="url(#' + id + 'a)"/><circle cx="80" cy="18" r="9" fill="#FFF1B0"/>' +
      '<rect y="38" width="100" height="26" fill="url(#' + id + 'b)"/>' +
      '<path d="M0 43 Q12 39 25 43 T50 43 T75 43 T100 43" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".75"/>' +
      '<path d="M0 60 Q18 54 38 60 T76 58 T100 60 V100 H0Z" fill="#F2D49B"/>' +
      '<path d="M0 60 Q18 54 38 60 T76 58 T100 60" stroke="#FFFFFF" stroke-width="2.2" fill="none" opacity=".85"/>' +
      '<path d="M0 74 Q30 68 60 74 T100 72 V100 H0Z" fill="#E8C27E"/>' +
      '<ellipse cx="40" cy="85" rx="14" ry="4.5" fill="#C99A55"/>' +
      '<circle cx="34" cy="81.5" r="3.8" fill="#FFFDF5"/><circle cx="41" cy="80.5" r="3.8" fill="#FFF6E4"/><circle cx="47" cy="82.5" r="3.6" fill="#FFFDF5"/>' +
      '<path d="M71 87 A7 7 0 0 1 85 87 Z" fill="#FF9AA8"/><path d="M78 80.5 V87 M74.5 82 L76 87 M81.5 82 L80 87" stroke="#E0607A" stroke-width="1"/>';
  };

  /* =====================================================================
     Change #17A — story puzzles: Biscuit's home (the maze goal), pairs of
     patterned socks (The Tidy Room) and trail-marker flags (The Little Explorer)
     ===================================================================== */
  function home() {
    var id = "pzo" + (++uid);
    return svg('<ellipse cx="50" cy="93" rx="38" ry="4" fill="#23304A" opacity=".16"/>' +
      '<rect x="22" y="47" width="56" height="44" rx="3" fill="#FFF1DC"/><rect x="66" y="47" width="12" height="44" fill="#1E1A3A" opacity=".07"/>' +
      '<path d="M13 50 L50 16 L87 50 Z" fill="url(#' + id + 'r)"/><path d="M13 50 L50 16 L50 23 L22 50 Z" fill="#FFFFFF" opacity=".18"/>' +
      '<rect x="64" y="22" width="8" height="16" rx="1.5" fill="#B9694A"/>' +
      '<path d="M42 91 L42 70 C42 61 58 61 58 70 L58 91 Z" fill="#D93A3A"/><circle cx="54" cy="79" r="1.7" fill="#FFD24D"/>' +
      '<rect x="27" y="56" width="11" height="11" rx="1.5" fill="#FFD86A" stroke="#8B5A33" stroke-width="1.6"/>' +
      '<rect x="62" y="56" width="11" height="11" rx="1.5" fill="#FFD86A" stroke="#8B5A33" stroke-width="1.6"/>' +
      '<circle cx="24" cy="87" r="7.5" fill="#4FA85A"/><circle cx="76" cy="87" r="7.5" fill="#4FA85A"/>' +
      '<circle cx="21" cy="84" r="2.7" fill="#E8413C"/><circle cx="27" cy="88" r="2.4" fill="#FF5E7E"/><circle cx="73" cy="85" r="2.7" fill="#E8413C"/><circle cx="79" cy="89" r="2.4" fill="#FF5E7E"/>',
      lg(id + "r", "#D6B4FF", "#7A52D0", true));
  }
  // pattern → [sock colour, pattern colour, kind]
  var SOCK = {
    stripes: ["#5B8DEF", "#FFFFFF", "stripes"], dots: ["#FF7FA8", "#FFFFFF", "dots"], stars: ["#FFC23D", "#FFFFFF", "stars"],
    hearts: ["#9B7BEA", "#FFD6E8", "hearts"], zigzag: ["#4FBF7A", "#FFF6C4", "zigzag"], spots: ["#FF9A3C", "#FFF1D6", "dots"], plain: ["#E8413C", null, null]
  };
  function sock(kind) {
    var id = "pzk" + (++uid), k = SOCK[kind] || SOCK.plain, pat = "", i, x, y;
    var shape = "M34 14 L62 14 L62 56 C62 64 68 68 76 70 C90 73 92 92 77 94 L45 94 C34 94 30 86 32 77 L34 58 Z";
    if (k[2] === "stripes") for (i = 0; i < 5; i++) pat += '<rect x="20" y="' + (26 + i * 15) + '" width="84" height="6" fill="' + k[1] + '"/>';
    if (k[2] === "dots") for (i = 0; i < 12; i++) { x = 40 + (i % 3) * 11 + (Math.floor(i / 3) % 2) * 5; y = 28 + Math.floor(i / 3) * 15; pat += '<circle cx="' + x + '" cy="' + y + '" r="3.3" fill="' + k[1] + '"/>'; }
    if (k[2] === "dots") pat += '<circle cx="66" cy="84" r="3.3" fill="' + k[1] + '"/><circle cx="79" cy="82" r="3.3" fill="' + k[1] + '"/>';
    if (k[2] === "stars") for (i = 0; i < 6; i++) { x = 42 + (i % 2) * 14; y = 30 + Math.floor(i / 2) * 18;
      pat += '<path d="M' + x + ' ' + (y - 5) + ' l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="' + k[1] + '"/>'; }
    if (k[2] === "stars") pat += '<path d="M72 79 l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="' + k[1] + '"/>';
    if (k[2] === "hearts") for (i = 0; i < 5; i++) { x = 42 + (i % 2) * 13; y = 30 + i * 12;
      pat += '<path d="M' + x + ' ' + (y + 4) + ' c-5-3.5-6-6.5-3.6-8.4 1.6-1.2 3-.4 3.6.8.6-1.2 2-2 3.6-.8 2.4 1.9 1.4 4.9-3.6 8.4z" fill="' + k[1] + '"/>'; }
    if (k[2] === "zigzag") for (i = 0; i < 4; i++) pat += '<path d="M28 ' + (32 + i * 17) + ' l8 -7 8 7 8 -7 8 7 8 -7 8 7 8 -7 8 7" fill="none" stroke="' + k[1] + '" stroke-width="3.4" stroke-linejoin="round"/>';
    return svg('<ellipse cx="58" cy="96" rx="30" ry="3.5" fill="#23304A" opacity=".14"/>' +
      '<path d="' + shape + '" fill="' + k[0] + '"/>' +
      '<g clip-path="url(#' + id + 'c)">' + pat + '<path d="M34 52 C46 58 56 58 62 54 L62 60 C56 66 44 66 34 60 Z" fill="#000000" opacity=".06"/>' +
      '<path d="M66 72 C80 70 92 78 86 90 C84 94 80 95 76 94 C82 88 80 78 66 72 Z" fill="#000000" opacity=".1"/></g>' +
      '<rect x="31" y="11" width="34" height="13" rx="4.5" fill="#FFFFFF"/><path d="M36 13 L36 22 M42 13 L42 22 M48 13 L48 22 M54 13 L54 22 M60 13 L60 22" stroke="' + k[0] + '" stroke-width="1.6" opacity=".45"/>' +
      '<path d="M37 30 C36 44 36 56 37 66" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>',
      '<clipPath id="' + id + 'c"><path d="' + shape + '"/></clipPath>');
  }
  var FLAG = { red: "#E8413C", blue: "#3E78D8", yellow: "#FFC23D", green: "#3FA45A", purple: "#8A5CE0" };
  function flag(color) {
    var c = FLAG[color] || FLAG.red;
    return svg('<ellipse cx="50" cy="92" rx="22" ry="3.5" fill="#23304A" opacity=".16"/>' +
      '<path d="M40 92 L44 82 L58 82 L62 92 Z" fill="#9A6E44"/>' +
      '<rect x="47.5" y="14" width="5" height="70" rx="2.5" fill="#8A5A36"/><rect x="48.5" y="16" width="1.6" height="64" rx=".8" fill="#FFFFFF" opacity=".35"/>' +
      '<path d="M52.5 17 L88 30 L52.5 44 Z" fill="' + c + '"/><path d="M52.5 17 L70 23.5 L52.5 30 Z" fill="#FFFFFF" opacity=".28"/>' +
      '<circle cx="50" cy="13" r="4.2" fill="#FFD24D"/><circle cx="48.8" cy="11.8" r="1.4" fill="#FFFFFF" opacity=".7"/>');
  }

  /* ---- Change #20: number, letter and counting cards ---- */
  var INK = "#3B2C7A", DOT = ["#FF6B6B", "#FFB020", "#38C172", "#3E9BE8", "#8A5CE0"];
  function card(inner, tint) {
    var id = "pzc" + (++uid);
    return svg('<rect x="10" y="12" width="80" height="80" rx="18" fill="#2B2151" opacity=".12"/>' +
      '<rect x="8" y="8" width="80" height="80" rx="18" fill="url(#' + id + ')" stroke="#FFFFFF" stroke-width="3"/>' + inner,
      lg(id, "#FFFFFF", tint || "#EDE6FF", true));
  }
  function bigText(t, size, fill) {
    return '<text x="48" y="' + (48 + size * 0.34) + '" text-anchor="middle" font-family="\'Baloo 2\', Fredoka, sans-serif" font-weight="800" font-size="' + size + '" fill="' + (fill || INK) + '">' + t + "</text>";
  }
  /** dots:N — 1..6 like a die, 7..10 on a ten frame (two rows of five). */
  function dots(n) {
    n = Math.max(1, Math.min(10, +n || 1));
    var P = { 1: [[48, 48]], 2: [[30, 30], [66, 66]], 3: [[28, 28], [48, 48], [68, 68]], 4: [[30, 30], [66, 30], [30, 66], [66, 66]],
      5: [[28, 28], [68, 28], [48, 48], [28, 68], [68, 68]], 6: [[30, 26], [66, 26], [30, 48], [66, 48], [30, 70], [66, 70]] };
    var pts = P[n], r = 8.5, frame = "";
    if (!pts) {                                     // ten frame
      pts = []; r = 6;
      for (var i = 0; i < 10; i++) { var x = 20 + (i % 5) * 14, y = i < 5 ? 38 : 58; frame += '<rect x="' + (x - 7) + '" y="' + (y - 9) + '" width="14" height="18" fill="none" stroke="#C8B9F2" stroke-width="1.4"/>'; if (i < n) pts.push([x, y]); }
    }
    return card(frame + pts.map(function (p, i) {
      return '<circle cx="' + p[0] + '" cy="' + (p[1] + 1.5) + '" r="' + r + '" fill="#2B2151" opacity=".15"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r + '" fill="' + DOT[(n + i) % DOT.length] + '"/>' +
        '<circle cx="' + (p[0] - r * 0.3) + '" cy="' + (p[1] - r * 0.35) + '" r="' + (r * 0.3) + '" fill="#FFFFFF" opacity=".6"/>';
    }).join(""), "#FFF4D6");
  }
  /** num:N — a numeral card. */
  function num(n) { var s = String(n); return card(bigText(s, s.length > 1 ? 44 : 56, "#5B3CC4")); }
  /** letter:A — an upper- and lower-case letter tile. */
  function letter(l) {
    l = String(l || "A").charAt(0).toUpperCase();
    return card(bigText(l, 50, "#E8413C") + '<text x="74" y="80" text-anchor="middle" font-family="\'Baloo 2\', Fredoka, sans-serif" font-weight="700" font-size="20" fill="#3E78D8">' + l.toLowerCase() + "</text>", "#E3F1FF");
  }
  /** tower:N — N stacked blocks (counting + small-to-tall). */
  function tower(n) {
    n = Math.max(1, Math.min(6, +n || 1));
    var h = 13, out = '<ellipse cx="50" cy="93" rx="24" ry="3.5" fill="#23304A" opacity=".16"/>';
    for (var i = 0; i < n; i++) {
      var y = 90 - (i + 1) * h, c = DOT[i % DOT.length];
      out += '<rect x="34" y="' + y + '" width="32" height="' + (h - 1) + '" rx="3" fill="' + c + '"/>' +
        '<rect x="36" y="' + (y + 2) + '" width="10" height="3" rx="1.5" fill="#FFFFFF" opacity=".55"/>';
    }
    return svg(out);
  }
  /** sum:2p3 / sum:9m4 — a small sum on a card. */
  function sum(v) {
    var m = /^(\d+)([pm])(\d+)$/.exec(v || "") || [0, 1, "p", 1];
    return card(bigText(m[1] + (m[2] === "p" ? " + " : " − ") + m[3], 30, "#3B2C7A"), "#E9FBEF");
  }
  /* ---- Change #22: the Sun and the eight planets (original drawings, lit from the upper-left) ----
     planet:<key> a body · pname:<key> its name on a card · orbit:1..8 Earth's place on its trip around the Sun
     solar        a little solar system (activity tile). scripts/space-art.mjs saves these as files for tiles. */
  var BODY = {
    sun:     { name: "Sun",     r: 36, c: ["#FFFBD6", "#FFD23F", "#FF8A1F"] },
    mercury: { name: "Mercury", r: 34, c: ["#E9E4DE", "#A39B93", "#5F5852"] },
    venus:   { name: "Venus",   r: 38, c: ["#FFF6DA", "#EECB80", "#B5853A"] },
    earth:   { name: "Earth",   r: 38, c: ["#9ADBFF", "#3E8EDC", "#173F8A"] },
    mars:    { name: "Mars",    r: 35, c: ["#FFC09A", "#DD6A3C", "#8A3118"] },
    jupiter: { name: "Jupiter", r: 42, c: ["#FFF1DC", "#E2B487", "#93613E"] },
    saturn:  { name: "Saturn",  r: 25, c: ["#FFF3CF", "#EACB80", "#A8823C"] },
    uranus:  { name: "Uranus",  r: 37, c: ["#ECFFFF", "#94E2E8", "#3A98AA"] },
    neptune: { name: "Neptune", r: 37, c: ["#A9CCFF", "#4373E4", "#1A2C88"] }
  };
  function rgr(id, stops, cx, cy, r) {
    return '<radialGradient id="' + id + '" cx="' + (cx || "36%") + '" cy="' + (cy || "32%") + '" r="' + (r || "74%") + '">' +
      stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : "") + "/>"; }).join("") + "</radialGradient>";
  }
  /** A whole drawing placed inside another (x, y, size in the outer 100×100 box). */
  function nest(drawing, x, y, size) {   // (no pz-draw class: its CSS size would override width/height)
    return drawing.replace('<svg class="pz-draw" ', '<svg x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" ');
  }
  function planet(key) {
    var b = BODY[key] || BODY.earth, id = "pzs" + (++uid), r = b.r, f = "";
    var d = rgr(id + "b", [[0, b.c[0]], [.55, b.c[1]], [1, b.c[2]]]) +
      rgr(id + "s", [[0, "#FFFFFF", .28], [.45, "#FFFFFF", 0], [.78, "#0A1030", .18], [1, "#0A1030", .6]], "34%", "30%", "78%") +
      '<clipPath id="' + id + 'c"><circle cx="50" cy="50" r="' + r + '"/></clipPath>';
    var body = '<circle cx="50" cy="50" r="' + r + '" fill="url(#' + id + 'b)"/>';
    var shade = '<circle cx="50" cy="50" r="' + r + '" fill="url(#' + id + 's)"/>';
    function band(y, h, col, o, wave) {
      return '<path d="M0 ' + y + " Q25 " + (y - wave) + " 50 " + y + " T100 " + y + " L100 " + (y + h) + " Q75 " + (y + h + wave) + " 50 " + (y + h) + " T0 " + (y + h) + ' Z" fill="' + col + '" opacity="' + o + '"/>';
    }
    switch (key) {
      case "sun":
        d += rgr(id + "g", [[0, "#FFE680", .9], [.5, "#FFC23D", .35], [1, "#FF9A1F", 0]], "50%", "50%", "50%");
        return svg('<circle cx="50" cy="50" r="49" fill="url(#' + id + 'g)"/>' + body +
          '<g clip-path="url(#' + id + 'c)" opacity=".5"><circle cx="38" cy="58" r="9" fill="#FFB52E"/><circle cx="62" cy="40" r="7" fill="#FFE07A"/>' +
          '<circle cx="60" cy="68" r="6" fill="#FF9F2E"/><circle cx="34" cy="36" r="5" fill="#FFF0A8"/></g>' +
          '<circle cx="50" cy="50" r="' + r + '" fill="url(#' + id + 's)" opacity=".45"/>', d);
      case "mercury":
        [[36, 40, 6], [60, 34, 4], [58, 60, 8], [40, 66, 4.5], [70, 50, 3.5], [48, 50, 3]].forEach(function (k) {
          f += '<circle cx="' + k[0] + '" cy="' + k[1] + '" r="' + k[2] + '" fill="#7D756E" opacity=".55"/>' +
            '<path d="M' + (k[0] - k[2]) + " " + k[1] + " A" + k[2] + " " + k[2] + " 0 0 0 " + (k[0] + k[2]) + " " + k[1] + '" stroke="#F4EFEA" stroke-width="1" fill="none" opacity=".5"/>';
        });
        break;
      case "venus":
        f = band(30, 7, "#FFF8E6", .55, 4) + band(46, 6, "#D9A85A", .35, -3) + band(58, 8, "#FFF1D0", .45, 5) + band(72, 5, "#C99A4E", .3, -2);
        break;
      case "earth":
        f = '<path d="M28 30 C34 22 46 24 48 32 C50 40 42 44 44 52 C46 58 38 64 32 58 C26 52 30 46 24 42 C20 38 24 34 28 30 Z" fill="#4DB860"/>' +
          '<path d="M58 42 C64 36 76 40 78 48 C80 58 72 66 64 70 C58 72 56 64 60 58 C62 52 54 48 58 42 Z" fill="#3FA956"/>' +
          '<path d="M38 70 C44 68 50 74 46 80 C42 84 36 78 38 70 Z" fill="#5CC46C"/>' +
          '<ellipse cx="50" cy="14" rx="22" ry="6" fill="#FFFFFF" opacity=".9"/>' +
          '<path d="M20 50 C30 46 40 48 52 44 M56 28 C64 24 72 26 80 30 M48 62 C58 60 68 64 78 60" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>';
        break;
      case "mars":
        f = '<ellipse cx="40" cy="48" rx="12" ry="7" fill="#9C3E1E" opacity=".45"/><ellipse cx="62" cy="60" rx="9" ry="5" fill="#9C3E1E" opacity=".4"/>' +
          '<ellipse cx="56" cy="36" rx="7" ry="4" fill="#B5502A" opacity=".45"/><ellipse cx="34" cy="64" rx="6" ry="3" fill="#A8462A" opacity=".35"/>' +
          '<ellipse cx="50" cy="17" rx="13" ry="4.5" fill="#FFF6F0" opacity=".95"/>';
        break;
      case "jupiter":
        f = band(16, 6, "#C98F5E", .7, 2) + band(28, 8, "#F7E4C8", .8, -2) + band(38, 7, "#B9784A", .75, 3) + band(49, 9, "#F3D7B1", .8, -2) +
          band(60, 7, "#C4865A", .75, 2) + band(70, 7, "#EBCBA2", .7, -3) + band(80, 6, "#A86E46", .6, 2) +
          '<ellipse cx="62" cy="64" rx="9" ry="5.5" fill="#C8553A"/><ellipse cx="62" cy="64" rx="6" ry="3.4" fill="#E0785A"/>';
        break;
      case "saturn":
        f = band(38, 5, "#F7E2AE", .7, 1.5) + band(48, 5, "#C9A55E", .45, -1.5) + band(58, 5, "#F2D9A0", .6, 1.5);
        break;
      case "uranus":
        f = band(30, 4, "#D8FCFF", .35, 1) + band(64, 5, "#5FB8C4", .25, -1);
        break;
      case "neptune":
        f = band(34, 4, "#7FA4FF", .4, 2) + band(62, 5, "#2B3FA8", .4, -2) +
          '<ellipse cx="60" cy="58" rx="8" ry="4.5" fill="#15206A" opacity=".75"/>' +
          '<path d="M30 42 C38 40 44 41 50 40 M56 70 C62 68 68 69 74 67" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none" opacity=".7"/>';
        break;
    }
    var inner = body + '<g clip-path="url(#' + id + 'c)">' + f + "</g>" + shade;
    if (key === "earth" || key === "neptune" || key === "uranus" || key === "venus")
      inner += '<circle cx="50" cy="50" r="' + (r + .8) + '" fill="none" stroke="' + (key === "venus" ? "#FFF3C4" : "#BFE9FF") + '" stroke-width="1.6" opacity=".5"/>';
    if (key === "saturn" || key === "uranus") {
      // Rings: the far half behind the planet, the near half in front of it.
      var sat = key === "saturn", tilt = sat ? -16 : 78;
      var rings = sat ? '<ellipse cx="50" cy="50" rx="46" ry="12" fill="none" stroke="#E9D29A" stroke-width="5"/>' +
        '<ellipse cx="50" cy="50" rx="39" ry="9.6" fill="none" stroke="#C9A867" stroke-width="3.4"/>' +
        '<ellipse cx="50" cy="50" rx="33.5" ry="7.8" fill="none" stroke="#F6E6BC" stroke-width="2"/>'
        : '<ellipse cx="50" cy="50" rx="47" ry="7" fill="none" stroke="#C7F2F5" stroke-width="1.3" opacity=".75"/>';
      d += '<clipPath id="' + id + 'f"><rect x="0" y="50" width="100" height="50"/></clipPath>';
      inner = '<g transform="rotate(' + tilt + ' 50 50)">' + rings + "</g>" + inner +
        '<g transform="rotate(' + tilt + ' 50 50)"><g clip-path="url(#' + id + 'f)">' + rings + "</g></g>";
    }
    return svg(inner, d);
  }
  /** pname:<key> — the body's name on a card (for reading and matching). */
  function pname(key) {
    var n = (BODY[key] || BODY.earth).name;
    return card(bigText(n, Math.min(30, Math.round(150 / n.length)), "#3B2C7A"), "#E6E9FF");
  }
  /** orbit:1..8 — the Sun with Earth's path; Earth moves 1/8 of the way round each step (anticlockwise). */
  function orbit(n) {
    var id = "pzo" + (++uid), k = Math.max(1, Math.min(8, +n || 1)), a = (90 - (k - 1) * 45) * Math.PI / 180;
    var x = 50 + Math.cos(a) * 31, y = 50 + Math.sin(a) * 31;
    return svg('<rect x="4" y="4" width="92" height="92" rx="18" fill="url(#' + id + 'n)"/>' +
      '<circle cx="18" cy="18" r="1.2" fill="#FFFFFF"/><circle cx="83" cy="20" r="1" fill="#FFFFFF" opacity=".8"/><circle cx="80" cy="84" r="1.2" fill="#FFFFFF" opacity=".7"/>' +
      '<circle cx="50" cy="50" r="31" fill="none" stroke="#9DB2F0" stroke-width="1.4" stroke-dasharray="3 3" opacity=".75"/>' +
      nest(planet("sun"), 37, 37, 26) + nest(planet("earth"), (x - 12.5).toFixed(1), (y - 12.5).toFixed(1), 25), lg(id + "n", "#151C4A", "#2E3A80", true));
  }
  /** solar — a little solar system for the activity tile. */
  function solar() {
    var id = "pzy" + (++uid), h = '<rect width="100" height="100" rx="20" fill="url(#' + id + 'n)"/>';
    [[14, 14], [82, 12], [90, 60], [10, 82], [60, 92], [36, 8]].forEach(function (s) { h += '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="1.1" fill="#FFFFFF" opacity=".8"/>'; });
    [22, 34, 46].forEach(function (rx) { h += '<ellipse cx="50" cy="54" rx="' + rx + '" ry="' + (rx * .42) + '" fill="none" stroke="#A9B8F2" stroke-width="1" opacity=".55"/>'; });
    return svg(h + nest(planet("sun"), 36, 40, 28) + nest(planet("earth"), 66, 52, 12) + nest(planet("mars"), 21, 55, 9) +
      nest(planet("saturn"), 62, 18, 26) + nest(planet("jupiter"), 2, 30, 18), lg(id + "n", "#141A46", "#33307E", true));
  }

  /* ---- Change #23: Mystery of the Lost Treasure (original drawings) ----
     land:<key> a landmark on the treasure map, in colour · ink:<key> the same landmark as the map draws it (brown ink)
     sign:<key> a secret sign carved in stone · chest:shut|open the treasure chest */
  var LANDS = { palm: "palm tree", rock: "big rock", bridge: "bridge", cave: "cave", hut: "hut", boat: "boat" };
  var SIGNS = { star: "star sign", moon: "moon sign", sun: "sun sign", shell: "shell sign", heart: "heart sign" };
  function parchment(id, inner, torn) {
    var edge = torn ? "M10 12 L24 8 L38 12 L52 7 L66 11 L80 7 L90 12 L93 30 L89 48 L93 66 L89 84 L92 92 L76 89 L60 93 L44 89 L28 93 L12 90 L8 74 L12 56 L7 38 L11 22 Z"
      : "M8 8 H92 V92 H8 Z";
    return '<path d="' + edge + '" fill="#2B2151" opacity=".12" transform="translate(2 3)"/>' +
      '<path d="' + edge + '" fill="url(#' + id + 'p)" stroke="#C99B5E" stroke-width="1.6" stroke-linejoin="round"/>' + inner;
  }
  function landPic(key, ink) {
    var c = ink ? { trunk: "none", leaf: "none", line: "#7A4A22", water: "none", rock: "none", wood: "none" } :
      { trunk: "#9A6236", leaf: "#4FB060", line: "#5E3A20", water: "#5FB8E8", rock: "#A9A3B8", wood: "#B9773F" };
    var s = ink ? ' stroke="#7A4A22" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"' : "";
    switch (key) {
      case "palm":
        return '<ellipse cx="50" cy="78" rx="26" ry="7" fill="' + (ink ? "none" : "#F2D58E") + '"' + s + "/>" +
          '<path d="M48 78 C47 64 50 48 56 34" fill="none" stroke="' + (ink ? "#7A4A22" : c.trunk) + '" stroke-width="' + (ink ? 3 : 6) + '" stroke-linecap="round"/>' +
          ["M56 34 C46 26 34 28 26 36", "M56 34 C64 24 76 24 84 32", "M56 34 C54 22 46 16 38 16", "M56 34 C64 30 70 38 72 46", "M56 34 C46 36 40 44 40 52"].map(function (d) {
            return '<path d="' + d + '" fill="none" stroke="' + (ink ? "#7A4A22" : c.leaf) + '" stroke-width="' + (ink ? 2.6 : 6) + '" stroke-linecap="round"/>';
          }).join("") + (ink ? "" : '<circle cx="53" cy="37" r="3.4" fill="#7A4A22"/><circle cx="58" cy="38" r="3" fill="#8D5A34"/>');
      case "rock":
        return '<path d="M20 78 C16 58 28 36 48 32 C68 28 84 46 82 66 C82 72 80 76 78 78 Z" fill="' + (ink ? "none" : c.rock) + '"' + s + "/>" +
          (ink ? '<path d="M34 60 C40 50 50 46 58 46" fill="none"' + s + "/>" : '<path d="M28 62 C32 48 42 40 54 38 C44 46 36 54 34 64 Z" fill="#FFFFFF" opacity=".4"/><path d="M60 42 C74 48 80 60 78 76 L68 78 C72 62 68 50 60 42 Z" fill="#6E6888" opacity=".35"/>');
      case "bridge":
        return (ink ? '<path d="M8 74 Q30 70 50 74 T92 74" fill="none"' + s + ' stroke-dasharray="5 5"/>' : '<rect x="8" y="66" width="84" height="22" rx="4" fill="' + c.water + '"/><path d="M12 74 Q30 70 50 74 T90 74" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".7"/>') +
          '<path d="M12 56 Q50 74 88 56" fill="none" stroke="' + (ink ? "#7A4A22" : c.wood) + '" stroke-width="' + (ink ? 3 : 7) + '" stroke-linecap="round"/>' +
          '<path d="M12 42 Q50 60 88 42" fill="none" stroke="' + (ink ? "#7A4A22" : c.line) + '" stroke-width="2" stroke-linecap="round"/>' +
          [20, 34, 50, 66, 80].map(function (x, i) { var y = 56 + [3, 7, 9, 7, 3][i]; return '<path d="M' + x + " " + (y - 14) + " L" + x + " " + y + '" stroke="' + (ink ? "#7A4A22" : c.line) + '" stroke-width="1.8"/>'; }).join("") +
          '<path d="M12 36 L12 62 M88 36 L88 62" stroke="' + (ink ? "#7A4A22" : c.line) + '" stroke-width="' + (ink ? 3 : 4.5) + '" stroke-linecap="round"/>';
      case "cave":
        return '<path d="M12 80 C14 46 30 22 52 22 C74 22 88 46 88 80 Z" fill="' + (ink ? "none" : "#9C95B2") + '"' + s + "/>" +
          '<path d="M32 80 C32 60 40 48 50 48 C60 48 68 60 68 80 Z" fill="' + (ink ? "none" : "#2B2340") + '"' + s + "/>" +
          (ink ? '<path d="M44 66 L56 76 M56 66 L44 76" stroke="#C0392B" stroke-width="3.4" stroke-linecap="round"/>' : '<path d="M22 50 C28 36 38 28 50 26 C40 34 32 42 28 54 Z" fill="#FFFFFF" opacity=".35"/>');
      case "hut":
        return '<rect x="30" y="50" width="40" height="30" rx="2" fill="' + (ink ? "none" : "#C99456") + '"' + s + "/>" +
          '<path d="M22 54 L50 26 L78 54 Z" fill="' + (ink ? "none" : "#E3B24E") + '"' + s + "/>" +
          '<rect x="44" y="62" width="12" height="18" rx="2" fill="' + (ink ? "none" : "#6E3F1E") + '"' + s + "/>";
      case "boat":
        return (ink ? "" : '<rect x="8" y="66" width="84" height="20" rx="4" fill="' + c.water + '"/>') +
          '<path d="M16 60 L84 60 L74 76 L26 76 Z" fill="' + (ink ? "none" : c.wood) + '"' + s + "/>" +
          '<path d="M50 60 L50 22 M50 26 L72 52 L50 52" fill="' + (ink ? "none" : "#FFFFFF") + '" stroke="' + (ink ? "#7A4A22" : "#8D5A34") + '" stroke-width="' + (ink ? 2.6 : 2) + '" stroke-linejoin="round"/>';
    }
    return "";
  }
  function land(key) {
    var id = "pzl" + (++uid);
    return svg(parchment(id, landPic(key, false), false), lg(id + "p", "#FFF8E6", "#F1DDB2", true));
  }
  function ink(key) {
    var id = "pzk" + (++uid);
    return svg(parchment(id, landPic(key, true), true), lg(id + "p", "#F6E3B8", "#E2C48A", true));
  }
  function sign(key) {
    var id = "pzg" + (++uid), col = { star: "#F2B82C", moon: "#9EC2F2", sun: "#FF8A2A", shell: "#F58AB2", heart: "#E8413C" }[key] || "#F2B82C", glyph;
    switch (key) {
      case "moon": glyph = '<path d="M58 28 A24 24 0 1 0 58 72 A18 18 0 1 1 58 28 Z"/>'; break;
      case "sun": glyph = '<circle cx="50" cy="50" r="13"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<rect x="47" y="24" width="6" height="11" rx="3" transform="rotate(' + a + ' 50 50)"/>'; }).join(""); break;
      case "shell": glyph = '<path d="M50 74 L28 44 C30 30 70 30 72 44 Z"/><path d="M50 72 L40 42 M50 72 L50 38 M50 72 L60 42" stroke="#7A3A55" stroke-width="2" fill="none" opacity=".5"/>'; break;
      case "heart": glyph = '<path d="M50 72 C30 58 24 46 30 36 C36 28 46 30 50 38 C54 30 64 28 70 36 C76 46 70 58 50 72 Z"/>'; break;
      default: glyph = '<path d="M50 24 L57 42 L76 43 L61 55 L66 74 L50 63 L34 74 L39 55 L24 43 L43 42 Z"/>';
    }
    return svg('<rect x="9" y="11" width="84" height="84" rx="16" fill="#2B2151" opacity=".16"/>' +
      '<rect x="7" y="7" width="86" height="86" rx="16" fill="url(#' + id + 's)" stroke="#8D86A6" stroke-width="2"/>' +
      '<rect x="14" y="14" width="72" height="72" rx="12" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".35"/>' +
      '<g fill="#4A4460" opacity=".45" transform="translate(1.6 2)">' + glyph + "</g>" +
      '<g fill="' + col + '" stroke="#FFFFFF" stroke-width="1" stroke-opacity=".5">' + glyph + "</g>", lg(id + "s", "#D9D4E6", "#9F98B8", true));
  }
  /** chest:shut / chest:open — the treasure chest (open: gold, gems and a glow). */
  function chest(state) {
    var id = "pzt" + (++uid), open = state === "open";
    var d = lg(id + "w", "#C98A4E", "#7A4522", true) + lg(id + "g", "#FFF1A8", "#E2A22A", true) +
      '<radialGradient id="' + id + 'r" cx="50%" cy="55%" r="50%"><stop offset="0" stop-color="#FFF6C8" stop-opacity=".95"/><stop offset=".55" stop-color="#FFD86B" stop-opacity=".45"/><stop offset="1" stop-color="#FFD86B" stop-opacity="0"/></radialGradient>';
    var h = '<ellipse cx="50" cy="88" rx="36" ry="5" fill="#2B2151" opacity=".18"/>';
    if (open) {
      h += '<circle cx="50" cy="52" r="46" fill="url(#' + id + 'r)"/>' +
        [-60, -35, -10, 15, 40].map(function (a) { return '<path d="M50 54 L44 6 L56 6 Z" fill="#FFF3B0" opacity=".55" transform="rotate(' + a + ' 50 54)"/>'; }).join("") +
        '<path d="M20 50 L22 26 C24 18 76 18 78 26 L80 50 Z" fill="url(#' + id + 'w)" stroke="#5E3417" stroke-width="1.5"/>' +
        '<path d="M22 26 C24 18 76 18 78 26" fill="none" stroke="url(#' + id + 'g)" stroke-width="3"/>' +
        '<ellipse cx="50" cy="52" rx="30" ry="8" fill="#FFD24D"/>' +
        [[36, 49], [46, 46], [56, 47], [64, 50], [42, 52], [58, 53]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="url(#' + id + 'g)" stroke="#C98A1E" stroke-width=".8"/>'; }).join("") +
        '<path d="M40 44 L44 38 L48 44 L44 48 Z" fill="#63C7FF"/><path d="M58 42 L62 36 L66 42 L62 46 Z" fill="#FF6B8A"/><circle cx="52" cy="40" r="3.4" fill="#38C172"/>';
    } else {
      h += '<path d="M20 52 C20 34 32 26 50 26 C68 26 80 34 80 52 Z" fill="url(#' + id + 'w)" stroke="#5E3417" stroke-width="1.5"/>' +
        '<path d="M32 30 L32 52 M68 30 L68 52" stroke="url(#' + id + 'g)" stroke-width="4"/>';
    }
    h += '<rect x="18" y="50" width="64" height="36" rx="4" fill="url(#' + id + 'w)" stroke="#5E3417" stroke-width="1.5"/>' +
      '<rect x="16" y="49" width="68" height="6" rx="2" fill="url(#' + id + 'g)"/>' +
      '<path d="M32 55 L32 86 M68 55 L68 86" stroke="url(#' + id + 'g)" stroke-width="4"/>' +
      '<rect x="44" y="56" width="12" height="15" rx="3" fill="url(#' + id + 'g)" stroke="#A8721E" stroke-width="1"/><circle cx="50" cy="62" r="2" fill="#5E3417"/>' +
      '<path d="M22 60 L28 60 M72 70 L78 70" stroke="#FFFFFF" stroke-width="1.6" opacity=".3"/>';
    if (open) h += '<path d="M14 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z M84 22 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z M80 70 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" fill="#FFFFFF"/>';
    return svg(h, d);
  }

  /** What a screen reader says for these drawings (the engine asks before guessing). */
  function labelOf(family, v) {
    switch (family) {
      case "land": return LANDS[v] || null;
      case "ink": return LANDS[v] ? "map picture of a " + LANDS[v] : null;
      case "sign": return SIGNS[v] || null;
      case "chest": return v === "open" ? "open treasure chest" : "treasure chest";
      case "planet": case "pname": return BODY[v] ? (v === "sun" ? "the Sun" : BODY[v].name) : null;
      case "orbit": return "Earth, step " + v;
      case "dots": return v + (v === "1" ? " dot" : " dots");
      case "num": return "number " + v;
      case "letter": return "letter " + String(v).toUpperCase();
      case "tower": return "tower of " + v + (v === "1" ? " block" : " blocks");
      case "sum": var m = /^(\d+)([pm])(\d+)$/.exec(v || ""); return m ? m[1] + (m[2] === "p" ? " plus " : " take away ") + m[3] : null;
    }
    return null;
  }

  Kido.puzzleArt = { plant: plant, habitat: habitat, basket: basket, rock: rock, bush: bush, goal: goal, track: track, songbird: songbird,
    bug: bug, moon: moon, thing: thing, tub: tub, magnet: magnet, home: home, sock: sock, flag: flag,
    dots: dots, num: num, letter: letter, tower: tower, sum: sum, labelOf: labelOf,
    planet: planet, pname: pname, orbit: orbit, solar: solar, BODY: BODY,
    land: land, ink: ink, sign: sign, chest: chest };
})(window);
