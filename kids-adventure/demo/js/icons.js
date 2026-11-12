/* =========================================================================
   icons.js — Small inline-SVG icon set for app chrome
   Navigation and the character avatar are drawn, not emoji, so they look the
   same on every device and match the Kido World art. Each entry is a
   function returning an SVG string (aria-hidden; the button carries the label).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  function svg(inner, vb) {
    return '<svg class="kido-icon" viewBox="' + (vb || "0 0 24 24") + '" aria-hidden="true" focusable="false">' + inner + "</svg>";
  }

  var ICONS = {
    star: function () {
      return svg('<path d="M12 2.6l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.4l-5.4 2.9 1.1-6.1L3.2 9l6.1-.8z" fill="#FFC23D" stroke="#E59A12" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M9.4 8.8l1.4-2.9" stroke="#FFF3C4" stroke-width="1.4" stroke-linecap="round"/>');
    },
    note: function () {
      return svg('<path d="M9 17.5V6.2l10-2.4v11.4" fill="none" stroke="#6C4BD6" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<ellipse cx="6.6" cy="17.6" rx="3" ry="2.4" fill="#6C4BD6"/><ellipse cx="16.6" cy="15.3" rx="3" ry="2.4" fill="#6C4BD6"/>');
    },
    mute: function () {
      return svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#8C84AE"/><path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#8C84AE" stroke-width="2.2" stroke-linecap="round"/>');
    },
    home: function () {
      return svg('<path d="M3.5 11.2L12 4l8.5 7.2" fill="none" stroke="#E0683A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 10.5V20h12v-9.5L12 5.6z" fill="#FFE6BF"/><path d="M10.2 20v-5.2h3.6V20z" fill="#9A6036"/><path d="M4.6 10.4L12 4.4l7.4 6" fill="#FF8A5B"/>');
    },
    games: function () {
      return svg('<path d="M7 7.5h10a4.5 4.5 0 014.4 5.5l-.8 3.6a2.6 2.6 0 01-4.4 1.2L14.4 16H9.6l-1.8 1.8a2.6 2.6 0 01-4.4-1.2L2.6 13A4.5 4.5 0 017 7.5z" fill="#8062E4"/>' +
        '<path d="M7.5 10.4v3.4M5.8 12.1h3.4" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/><circle cx="15.8" cy="11" r="1.2" fill="#FFC23D"/><circle cx="17.8" cy="13.2" r="1.2" fill="#FF6B8A"/>');
    },
    learn: function () {
      return svg('<rect x="4" y="15.5" width="16" height="4" rx="1.2" fill="#38C172"/><rect x="5.5" y="11" width="14" height="4" rx="1.2" fill="#FF6B8A"/>' +
        '<rect x="3.5" y="6.5" width="15" height="4" rx="1.2" fill="#63C7FF"/><path d="M6 8.5h8M7.5 13h8M6.5 17.5h8" stroke="#FFFFFF" stroke-width="1" opacity=".7"/>');
    },
    create: function () {
      return svg('<path d="M12 3.5c5 0 9 3.4 9 7.6 0 2.4-1.9 3.3-3.6 3.3h-1.7c-1 0-1.6.9-1.2 1.8l.3.7c.6 1.3-.3 2.6-1.8 2.6-5.3 0-9.5-3.5-9.5-7.9S7 3.5 12 3.5z" fill="#FFD9A8"/>' +
        '<circle cx="7.6" cy="11" r="1.6" fill="#FF6B8A"/><circle cx="10" cy="7.3" r="1.6" fill="#FFB020"/><circle cx="14.4" cy="7.2" r="1.6" fill="#38C172"/><circle cx="17.3" cy="10.2" r="1.6" fill="#63C7FF"/>');
    },
    stories: function () {
      return svg('<path d="M12 7c-2.2-1.8-5.4-2.3-8.5-1.6v12.2c3.1-.7 6.3-.2 8.5 1.6 2.2-1.8 5.4-2.3 8.5-1.6V5.4C17.4 4.7 14.2 5.2 12 7z" fill="#6C4BD6"/>' +
        '<path d="M12 7.6c-1.9-1.4-4.4-1.8-6.9-1.4v10.2c2.5-.4 5 0 6.9 1.4zM12 7.6c1.9-1.4 4.4-1.8 6.9-1.4v10.2c-2.5-.4-5 0-6.9 1.4z" fill="#FFFBEE"/>' +
        '<path d="M7 9.3c1.2-.1 2.4.1 3.4.6M7 12c1.2-.1 2.4.1 3.4.6M13.6 9.9c1-.5 2.2-.7 3.4-.6M13.6 12.6c1-.5 2.2-.7 3.4-.6" stroke="#C9B48A" stroke-width=".9" stroke-linecap="round"/>');
    },
    rewards: function () { return ICONS.star(); },
    lock: function () {
      return svg('<rect x="5" y="10.5" width="14" height="10" rx="3" fill="#FFC23D"/><path d="M8.2 10.5V8a3.8 3.8 0 017.6 0v2.5" fill="none" stroke="#8A6A2A" stroke-width="2.2"/><circle cx="12" cy="15.2" r="1.6" fill="#8A5A1E"/>');
    },
    check: function () {
      return svg('<circle cx="12" cy="12" r="9" fill="#38C172"/><path d="M7.6 12.3l3 3 5.8-6" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>');
    },
    /* Today's Adventure roles (Change #12): discover · think · explore, and the finish. */
    discover: function () {
      return svg('<circle cx="10.4" cy="10.4" r="6.2" fill="#E6F7FF" stroke="#2F9BD6" stroke-width="2.4"/>' +
        '<path d="M15.1 15.1l5.2 5.2" stroke="#8D5A34" stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M7.4 9.2a3.3 3.3 0 0 1 2.5 -2.2" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>');
    },
    think: function () {
      return svg('<path d="M12 3a6.4 6.4 0 0 0 -3.8 11.5c.7.6 1.1 1.3 1.1 2.1v.7h5.4v-.7c0-.8.4-1.5 1.1-2.1A6.4 6.4 0 0 0 12 3z" fill="#FFC23D" stroke="#E59A12" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<rect x="9.2" y="18" width="5.6" height="1.8" rx=".9" fill="#8C84AE"/><rect x="9.9" y="20.3" width="4.2" height="1.6" rx=".8" fill="#8C84AE"/>' +
        '<path d="M9.4 8.6a2.9 2.9 0 0 1 2.3 -2.1" fill="none" stroke="#FFF3C4" stroke-width="1.5" stroke-linecap="round"/>');
    },
    explore: function () {
      return svg('<circle cx="12" cy="12" r="9" fill="#FFFFFF" stroke="#2BB3A3" stroke-width="2.2"/>' +
        '<path d="M12 5.4l2.3 6.6H9.7z" fill="#FF6B6B"/><path d="M12 18.6l-2.3-6.6h4.6z" fill="#8C84AE"/><circle cx="12" cy="12" r="1.4" fill="#2B2151"/>');
    },
    trophy: function () {
      return svg('<path d="M7 4h10v4.6a5 5 0 0 1 -10 0z" fill="#FFC23D" stroke="#E59A12" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M7 5.6H4.6a3 3 0 0 0 3.1 4M17 5.6h2.4a3 3 0 0 1 -3.1 4" fill="none" stroke="#E59A12" stroke-width="1.6" stroke-linecap="round"/>' +
        '<rect x="10.6" y="13.4" width="2.8" height="3.4" fill="#E59A12"/><rect x="7.8" y="16.8" width="8.4" height="3.4" rx="1.2" fill="#8D5A34"/>' +
        '<path d="M9.5 6.4v2.4" stroke="#FFF3C4" stroke-width="1.4" stroke-linecap="round"/>');
    },
    play: function () { return svg('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>'); },
    close: function () { return svg('<path d="M6.5 6.5l11 11m0-11l-11 11" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'); },
    sign: function () {
      return svg('<rect x="10.8" y="3" width="2.4" height="18.5" rx="1" fill="#8D5A34"/><path d="M4 5.5h11.5l2.8 2.6-2.8 2.6H4z" fill="#E0A064"/>' +
        '<path d="M20 11.8H8.5l-2.8 2.6 2.8 2.6H20z" fill="#C9844A"/><path d="M6 8h7M10 14.4h7.5" stroke="#FFF3DC" stroke-width="1.1" stroke-linecap="round"/>');
    },
    momo: function () {
      return svg('<path d="M9 22 Q6 5 19 15 Z" fill="#FF8A3D"/><path d="M47 22 Q50 5 37 15 Z" fill="#FF8A3D"/><path d="M11 20 Q10 11 17 15 Z" fill="#3A2440"/><path d="M45 20 Q46 11 39 15 Z" fill="#3A2440"/>' +
        '<circle cx="28" cy="31" r="18" fill="#FF9A52"/><path d="M28 21 Q17 27 15 36 Q28 44 41 36 Q39 27 28 21Z" fill="#FFF1E0"/>' +
        '<circle cx="21.5" cy="29" r="4" fill="#2B2151"/><circle cx="34.5" cy="29" r="4" fill="#2B2151"/><circle cx="22.8" cy="27.6" r="1.4" fill="#fff"/><circle cx="35.8" cy="27.6" r="1.4" fill="#fff"/>' +
        '<path d="M25.6 34.4 Q28 36.6 30.4 34.4 Z" fill="#2B2151"/><path d="M28 36.2 Q28 39.4 24.8 39.4 M28 36.2 Q28 39.4 31.2 39.4" fill="none" stroke="#2B2151" stroke-width="1.3" stroke-linecap="round"/>' +
        '<circle cx="17.5" cy="35" r="2.6" fill="#FF6B8A" opacity=".45"/><circle cx="38.5" cy="35" r="2.6" fill="#FF6B8A" opacity=".45"/>', "0 0 56 52");
    }
  };

  Kido.icons = ICONS;
})(window);
