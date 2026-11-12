/* =========================================================================
   wordAdventure.js — "Word Run": a tap-to-JUMP endless runner
   An ORIGINAL super-hero cub — "Super Momo" (cape + mask, all original art,
   NOT any trademarked hero) — auto-runs across a meadow. Letters of the target
   word float at jump height; TAP THE SCENE to jump and grab the next letter in
   order. Between letters, gentle rolling obstacles appear — jump those too.
   Missing a jump only makes Super Momo stumble for a moment: no life lost, no
   reset, no punishment. Obstacle frequency + world speed scale with age.
   The sim is a plain tick(dt) model (exposed on root.__runner) so it can be
   driven and verified synchronously even when rAF is frozen in a hidden pane.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  Kido.activities = Kido.activities || {};
  var U = Kido.util;

  /* Change #28: the heroes are ARTICULATED. One shared skeleton (viewBox 110x110, facing right): hip (52,66) ->
     knee (52,81) -> ankle (52,95); shoulder (57,47) -> elbow (57,57) -> wrist (57,66). Every thigh, shin, upper
     arm and forearm is its own nested group, so the run cycle (css/animations.css) bends knees and elbows around
     the real joints instead of swinging stiff one-piece limbs. Each hero only brings its own colours, body,
     head and extras (Momo's cape and tail). All original art. */
  function stripes(x1, y1, x2, y2, w, s) {   // fur stripes across a limb (Tiko)
    return s ? '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + s + '" stroke-width="' + w + '" stroke-dasharray="1.6 3.4" opacity="0.6"/>' : '';
  }
  function heroLeg(side, c, foot, s, k, sole) {   // k: limb thickness (Gajju's chunky legs); sole: sneaker sole colour
    k = k || 1;
    return '<g class="hero-j hero-j--thigh-' + side + '">' +
        '<line x1="52" y1="66" x2="52" y2="81" stroke="' + c + '" stroke-width="' + 10 * k + '" stroke-linecap="round"/>' + stripes(52, 68, 52, 80, 10, s) +
        '<g class="hero-j hero-j--shin-' + side + '">' +
          '<line x1="52" y1="81" x2="52" y2="94" stroke="' + c + '" stroke-width="' + 8.5 * k + '" stroke-linecap="round"/>' + stripes(52, 83, 52, 91, 8.5, s) +
          '<path d="M46.5 92 Q47 99.5 55 99.5 L61 99.5 Q63 95.5 57.5 93.5 L55 90 Z" fill="' + foot + '"/>' +
          (sole ? '<path d="M46.8 97.2 Q48 100.5 55 100.5 L61.6 100.5 Q62.6 98.6 61.6 98.2 Z" fill="' + sole + '"/>' : '') +
        '</g>' +
      '</g>';
  }
  function heroArm(side, c, hand, s, k) {
    k = k || 1;
    return '<g class="hero-j hero-j--upper-' + side + '">' +
        '<line x1="57" y1="47" x2="57" y2="57" stroke="' + c + '" stroke-width="' + 7.5 * k + '" stroke-linecap="round"/>' + stripes(57, 49, 57, 56, 7.5, s) +
        '<g class="hero-j hero-j--fore-' + side + '">' +
          '<line x1="57" y1="57" x2="57" y2="65" stroke="' + c + '" stroke-width="' + 6.5 * k + '" stroke-linecap="round"/>' + stripes(57, 59, 57, 63, 6.5, s) +
          '<circle cx="57" cy="66.5" r="4.3" fill="' + hand + '"/>' +
        '</g>' +
      '</g>';
  }
  function heroSvg(o) {
    return '<svg class="hero-avatar hero-avatar--' + o.key + '" viewBox="0 0 110 110" role="img" aria-label="' + o.label + '">' +
      '<defs>' + o.defs + '</defs>' +
      '<ellipse class="hero-shadow" cx="54" cy="101" rx="26" ry="4.5" fill="url(#' + o.key + 'GndShadow)"/>' +
      (o.behind || '') +
      heroArm("back", o.armLimbBack || o.limbBack, o.handBack, o.stripe, o.thick) +
      heroLeg("back", o.limbBack, o.footBack, o.stripe, o.thick, o.soleBack) +
      (o.pack || '') +                                // carried on the back (Tiko's tiffin), in front of the far limbs
      '<g class="hero-body hero-body--torso">' + o.torso + '</g>' +
      heroLeg("front", o.limb, o.foot, o.stripe, o.thick, o.sole) +
      '<g class="hero-body hero-body--head">' + o.head + '</g>' +
      heroArm("front", o.armLimb || o.limb, o.hand, o.stripe, o.thick) +
    '</svg>';
  }
  function shadowDef(id, rgb) {
    return '<radialGradient id="' + id + 'GndShadow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="' + rgb + '" stop-opacity="0.32"/><stop offset="70%" stop-color="' + rgb + '" stop-opacity="0.08"/>' +
      '<stop offset="100%" stop-color="' + rgb + '" stop-opacity="0"/></radialGradient>';
  }

  // Super Momo: Kido's fox cub as a hero (cape + mask), running on two legs.
  var HERO_MOMO_SVG = heroSvg({
    key: "momo", label: "Super Momo, the hero cub",
    defs: shadowDef("momo", "#431407") +
      '<linearGradient id="momoCape3D" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FB7185"/><stop offset="35%" stop-color="#E11D48"/><stop offset="75%" stop-color="#BE123C"/><stop offset="100%" stop-color="#881337"/></linearGradient>' +
      '<linearGradient id="momoFur3D" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#FDBA74"/><stop offset="35%" stop-color="#FB923C"/><stop offset="75%" stop-color="#EA580C"/><stop offset="100%" stop-color="#C2410C"/></linearGradient>' +
      '<linearGradient id="momoCream" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFBEB"/><stop offset="60%" stop-color="#FEF3C7"/><stop offset="100%" stop-color="#FDE68A"/></linearGradient>' +
      '<linearGradient id="momoMask" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#818CF8"/><stop offset="50%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#3730A3"/></linearGradient>',
    behind:
      '<g class="hero-cape">' +
        '<path d="M51 44 C34 43 17 52 12 74 C24 81 36 72 47 67 C45 58 47 50 51 44 Z" fill="url(#momoCape3D)"/>' +
        '<path d="M51 44 C36 49 21 60 17 78 C26 75 36 72 47 67 Z" fill="#9F1239" opacity="0.55"/>' +
      '</g>' +
      '<g class="hero-tail">' +
        '<path d="M47 63 C31 61 19 68 13 80 C21 87 34 82 47 70 Z" fill="url(#momoFur3D)"/>' +
        '<path d="M13 80 C15 74 21 75 23 82 C19 86 15 85 13 80 Z" fill="url(#momoCream)"/>' +
      '</g>',
    limb: "#EA580C", limbBack: "#C2410C", foot: "#431407", footBack: "#2A0E05", hand: "#431407", handBack: "#2A0E05",
    torso:
      '<path d="M45 42 Q58 37 65 47 Q67 60 60 69 L46 69 Q40 56 45 42 Z" fill="url(#momoFur3D)"/>' +
      '<path d="M53 45 Q62 49 61 62 Q55 67 50 65 Q56 56 53 45 Z" fill="url(#momoCream)"/>' +
      '<path d="M57 50 L52.5 56.5 L56 56.5 L54 63 L60.5 54.5 L57 54.5 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="0.8"/>',
    head:
      '<polygon points="49,26 43,8 59,18" fill="url(#momoFur3D)"/><polygon points="48,23 45,12 55,19" fill="#FED7AA"/>' +
      '<polygon points="59,22 65,6 73,18" fill="url(#momoFur3D)"/><polygon points="61,20 65,10 70,18" fill="#FED7AA"/>' +
      '<ellipse cx="64" cy="31" rx="17" ry="16" fill="url(#momoFur3D)"/>' +
      '<path d="M62 35 Q75 35 79 39 Q71 47 60 45 Z" fill="url(#momoCream)"/>' +
      '<path d="M54 27 Q67 21 79 27 Q75 37 67 37 Q59 37 54 27 Z" fill="url(#momoMask)"/>' +
      '<ellipse cx="69" cy="29" rx="4.3" ry="4.8" fill="#1E1B4B"/><circle cx="70.5" cy="27.5" r="1.9" fill="#FFFFFF"/>' +
      '<circle cx="79" cy="38" r="2.2" fill="#0F172A"/>' +
      '<path d="M73 42 Q77 44 79 41" stroke="#C2410C" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="61" cy="37" rx="4" ry="2.5" fill="#FB7185" opacity="0.6"/>'
  });

  // Captain Nova: an ORIGINAL kid superhero (teal suit, gold star emblem, gold boots and gloves, domino mask).
  var HERO_NOVA_SVG = heroSvg({
    key: "nova", label: "Captain Nova, a kid superhero",
    defs: shadowDef("nova", "#0F172A") +
      '<linearGradient id="novaSuit" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#2DD4BF"/><stop offset="45%" stop-color="#0D9488"/><stop offset="100%" stop-color="#115E59"/></linearGradient>' +
      '<linearGradient id="novaGold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FDE68A"/><stop offset="55%" stop-color="#FBBF24"/><stop offset="100%" stop-color="#D97706"/></linearGradient>' +
      '<linearGradient id="novaSkin" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFE0BD"/><stop offset="100%" stop-color="#F4B183"/></linearGradient>',
    limb: "#0D9488", limbBack: "#115E59", foot: "#F59E0B", footBack: "#B45309", hand: "#FBBF24", handBack: "#D97706",
    torso:
      '<path d="M46 43 Q57 37 66 46 L62 69 L45 69 Q41 56 46 43 Z" fill="url(#novaSuit)"/>' +
      '<path d="M45 62 L63 62 L62 69 L45 69 Z" fill="url(#novaGold)" opacity="0.95"/>' +
      '<polygon points="55,45 57.4,51 63.6,51 58.6,55 60.6,61 55,57.4 49.4,61 51.4,55 46.4,51 52.6,51" fill="url(#novaGold)" stroke="#B45309" stroke-width="0.5"/>',
    head:
      '<ellipse cx="62" cy="29" rx="15" ry="16" fill="url(#novaSkin)"/>' +
      '<path d="M47 25 Q50 12 64 13 Q75 14 77 25 Q70 19 62 20 Q53 20 47 25 Z" fill="#7C2D12"/>' +
      '<path d="M52 27 Q62 23 74 27 Q72 35 64 35 Q56 35 52 27 Z" fill="url(#novaGold)"/>' +
      '<ellipse cx="66" cy="29" rx="3.2" ry="2.4" fill="#0F172A"/><circle cx="67" cy="28.3" r="1" fill="#FFFFFF"/>' +
      '<path d="M60 39 Q66 42 71 38" stroke="#B45309" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="57" cy="35" rx="3.3" ry="2" fill="#FB7185" opacity="0.5"/>'
  });

  // Comet: an ORIGINAL kid speedster (indigo suit, cyan trim, lightning-bolt emblem, flight goggles).
  var HERO_COMET_SVG = heroSvg({
    key: "comet", label: "Comet, a kid superhero",
    defs: shadowDef("comet", "#1E1B4B") +
      '<linearGradient id="cometSuit" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#818CF8"/><stop offset="45%" stop-color="#4F46E5"/><stop offset="100%" stop-color="#3730A3"/></linearGradient>' +
      '<linearGradient id="cometBolt" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FDE047"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient>' +
      '<linearGradient id="cometSkin" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#C68642"/><stop offset="100%" stop-color="#8D5524"/></linearGradient>',
    limb: "#4F46E5", limbBack: "#312E81", foot: "#22D3EE", footBack: "#0891B2", hand: "#22D3EE", handBack: "#0891B2",
    torso:
      '<path d="M46 43 Q57 37 66 46 L62 69 L45 69 Q41 56 46 43 Z" fill="url(#cometSuit)"/>' +
      '<path d="M45 62 L63 62 L62 69 L45 69 Z" fill="#22D3EE" opacity="0.9"/>' +
      '<polygon points="57,45 51,56 55,56 53,63 61,51 56,51 59,45" fill="url(#cometBolt)" stroke="#B45309" stroke-width="0.5"/>',
    head:
      '<ellipse cx="62" cy="29" rx="15" ry="16" fill="url(#cometSkin)"/>' +
      '<path d="M47 24 Q50 11 64 12 Q76 14 78 26 Q70 18 61 19 Q52 19 47 24 Z" fill="#1F2937"/>' +
      // side view like the other heroes: one mask band and ONE eye (the far eye is hidden behind the face)
      '<path d="M52 27 Q63 23 76 26.5 Q76.5 32.5 71 33.8 Q63 35 56 33 Q51.5 31.5 52 27 Z" fill="#0E7490"/>' +
      '<ellipse cx="68.5" cy="29.4" rx="3.4" ry="2.9" fill="#A5F3FC"/><ellipse cx="69.3" cy="29.6" rx="1.7" ry="1.9" fill="#0F172A"/><circle cx="70" cy="28.7" r="0.7" fill="#FFFFFF"/>' +
      '<path d="M60 39 Q66 42 71 38" stroke="#5B3A1A" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
  });

  // Tiko the Tiffin Tiger: an ORIGINAL Kido character. A tiger cub who runs deliveries with a three-tier steel
  // tiffin strapped to his back and a green muffler flying behind. Special move: mid-jump the tiffin lid pops
  // open to catch the letter (css/animations.css .hero-tiko-lid). Catchphrase: "Delivery on time!"
  var HERO_TIKO_SVG = heroSvg({
    key: "tiko", label: "Tiko the Tiffin Tiger",
    defs: shadowDef("tiko", "#431407") +
      '<linearGradient id="tikoFur" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#FDBA74"/><stop offset="40%" stop-color="#FB923C"/><stop offset="100%" stop-color="#EA580C"/></linearGradient>' +
      '<linearGradient id="tikoSteel" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#94A3B8"/><stop offset="35%" stop-color="#F1F5F9"/><stop offset="60%" stop-color="#CBD5E1"/><stop offset="100%" stop-color="#64748B"/></linearGradient>' +
      '<linearGradient id="tikoScarf" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4ADE80"/><stop offset="100%" stop-color="#15803D"/></linearGradient>',
    behind:
      '<g class="hero-tail">' +
        '<path d="M47 63 C36 67 25 63 19 53 C17 48 21 45 24 49 C28 57 37 61 46 59 Z" fill="url(#tikoFur)"/>' +
        '<path d="M35 63 L37 59.5 L39 63.5 Z M28 59 L31 56 L32 60 Z M22 53 L25.5 51 L25 55 Z" fill="#3B1E0A" opacity="0.8"/>' +
        '<path d="M19 53 C17 48 21 45 24 49 Z" fill="#3B1E0A"/>' +
      '</g>',
    pack:
      '<g class="hero-tiko-tiffin">' +
        '<path d="M31 70 L31 37 Q37.5 31 44 37 L44 70" fill="none" stroke="#475569" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<rect x="31.5" y="42.5" width="12" height="8" rx="2" fill="url(#tikoSteel)" stroke="#64748B" stroke-width="0.6"/>' +
        '<rect x="31.5" y="51.5" width="12" height="8" rx="2" fill="url(#tikoSteel)" stroke="#64748B" stroke-width="0.6"/>' +
        '<rect x="31.5" y="60.5" width="12" height="8" rx="2" fill="url(#tikoSteel)" stroke="#64748B" stroke-width="0.6"/>' +
        '<g class="hero-tiko-lid"><rect x="30.5" y="40" width="14" height="3" rx="1.5" fill="#E2E8F0" stroke="#64748B" stroke-width="0.6"/><circle cx="37.5" cy="39.6" r="1.1" fill="#64748B"/></g>' +
      '</g>' +
      '<g class="hero-cape">' +
        '<path d="M50 43 C42 41 33 43 24 39 C25 45 33 47 41 47 C35 50 29 53 23 53 C31 56 41 52 49 47 Z" fill="url(#tikoScarf)"/>' +
        '<path d="M41 47 C35 50 29 53 23 53 C29 51 35 49 40 46 Z" fill="#166534" opacity="0.6"/>' +
      '</g>',
    limb: "#F97316", limbBack: "#C2410C", stripe: "#3B1E0A",
    foot: "#FFEDD5", footBack: "#FDBA74", hand: "#FFEDD5", handBack: "#FDBA74",
    torso:
      '<path d="M45 42 Q58 37 65 47 Q67 60 60 69 L46 69 Q40 56 45 42 Z" fill="url(#tikoFur)"/>' +
      '<path d="M54 46 Q63 50 62 62 Q56 67 51 65 Q57 56 54 46 Z" fill="#FFF7ED"/>' +
      '<path d="M45 50 L51 51 L45 53.5 Z M44.5 56 L51 57 L44.5 59.5 Z M45.5 62 L51 62.5 L46.5 65 Z" fill="#3B1E0A" opacity="0.85"/>' +
      '<line x1="47" y1="44" x2="60" y2="66" stroke="#78350F" stroke-width="2.6" stroke-linecap="round"/>' +
      '<rect x="51.5" y="52.5" width="4" height="3.4" rx="0.8" fill="#FBBF24" stroke="#B45309" stroke-width="0.5"/>' +
      '<path d="M46 45 Q55 49 65 45 L64.5 41.5 Q55 45 46.5 41.5 Z" fill="url(#tikoScarf)"/>',
    head:
      '<circle cx="52" cy="17" r="6" fill="url(#tikoFur)"/><circle cx="52" cy="17" r="3" fill="#3B1E0A" opacity="0.75"/>' +
      '<circle cx="70" cy="15.5" r="6" fill="url(#tikoFur)"/><circle cx="70" cy="15.5" r="3" fill="#3B1E0A" opacity="0.75"/>' +
      '<ellipse cx="63" cy="30" rx="16.5" ry="15.5" fill="url(#tikoFur)"/>' +
      '<path d="M59.5 15.5 L62 21.5 L64.5 15.5 Z M54 18 L58 22.5 L56.5 17 Z M67.5 16.5 L67.5 22 L71 17.5 Z" fill="#3B1E0A"/>' +
      '<path d="M47 27 L53 29 L47 31.5 Z M47.5 33 L53 33.5 L48.5 36 Z" fill="#3B1E0A" opacity="0.85"/>' +
      '<ellipse cx="73" cy="36" rx="8.5" ry="6.5" fill="#FFF7ED"/>' +
      '<path d="M65 40 Q70 46 77 42" fill="#FFF7ED"/>' +
      '<path d="M76.5 31 L81.5 31 L79 34 Z" fill="#F472B6" stroke="#9D174D" stroke-width="0.5"/>' +
      '<path d="M79 34 Q78.5 37.5 75.5 38 M79 34 Q80 37.5 82.5 37" stroke="#3B1E0A" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="68.5" cy="27" rx="3.3" ry="3.9" fill="#1F2937"/><circle cx="69.6" cy="25.7" r="1.3" fill="#FFFFFF"/>' +
      '<path d="M65 22.3 Q68.5 20.6 72 22.4" stroke="#3B1E0A" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="63.5" cy="34" rx="3.6" ry="2.1" fill="#FB7185" opacity="0.5"/>'
  });

  // Gajju the Sneaker Elephant: an ORIGINAL Kido character. A baby elephant in red-and-white sneakers and a
  // backwards cap, ears flapping as he runs. Special move: mid-jump his trunk curls up and snatches the letter
  // (css/animations.css .hero-gajju-trunk). Catchphrase: "Trunk-tastic!"
  var HERO_GAJJU_SVG = heroSvg({
    key: "gajju", label: "Gajju the Sneaker Elephant",
    defs: shadowDef("gajju", "#1F2937") +
      '<linearGradient id="gajjuSkin" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#E5E7EB"/><stop offset="45%" stop-color="#B8BEC8"/><stop offset="100%" stop-color="#8B93A1"/></linearGradient>' +
      '<linearGradient id="gajjuCap" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F87171"/><stop offset="100%" stop-color="#B91C1C"/></linearGradient>',
    behind:
      '<g class="hero-tail">' +
        '<path d="M46 62 Q40 65 38.5 72" fill="none" stroke="#8B93A1" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M36.5 71 Q38.5 77 40.5 71.5 Z" fill="#374151"/>' +
      '</g>',
    limb: "#A8AFBA", limbBack: "#7C8491", thick: 1.25,
    foot: "#EF4444", footBack: "#B91C1C", sole: "#F8FAFC", soleBack: "#CBD5E1",
    hand: "#D1D5DB", handBack: "#9CA3AF",
    torso:
      '<path d="M44 42 Q58 36 66 47 Q68 60 61 69 L45 69 Q39 56 44 42 Z" fill="url(#gajjuSkin)"/>' +
      '<path d="M54 47 Q63 51 62 62 Q56 67 51 65 Q57 57 54 47 Z" fill="#EEF0F3" opacity="0.8"/>' +
      '<path d="M45.5 62 Q53 65 61.5 62 L61 69 L45.5 69 Z" fill="#2563EB"/>' +
      '<path d="M45.5 62 Q53 65 61.5 62" stroke="#1D4ED8" stroke-width="1.2" fill="none"/>',
    head:
      '<ellipse cx="62" cy="30" rx="16.5" ry="15.5" fill="url(#gajjuSkin)"/>' +
      '<path d="M47 20 Q50 8 62 8 Q74 9 76 19 Q62 15 47 20 Z" fill="url(#gajjuCap)"/>' +
      '<path d="M48.5 19.5 Q40 18.5 35 22.5 Q43 24 51 21.5 Z" fill="#991B1B"/>' +
      '<path d="M55 10.5 Q61 9.2 67 10.5" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<circle cx="62" cy="8.2" r="1.6" fill="#FCA5A5"/>' +
      '<g class="hero-gajju-trunk">' +
        '<path d="M73 31 Q83 34 82.5 44 Q82 50 86 51.5" fill="none" stroke="#A8AFBA" stroke-width="6.5" stroke-linecap="round"/>' +
        '<path d="M77 36 L80.5 35.4 M78.5 40.5 L82 40.3" stroke="#7C8491" stroke-width="0.9" stroke-linecap="round"/>' +
      '</g>' +
      '<ellipse cx="68" cy="27" rx="3" ry="3.6" fill="#1F2937"/><circle cx="69" cy="25.8" r="1.2" fill="#FFFFFF"/>' +
      '<path d="M65.2 22.6 Q68 21.2 70.8 22.8" stroke="#4B5563" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
      '<path d="M68 39.5 Q71 41.5 73.5 39.2" stroke="#4B5563" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="64" cy="34" rx="3.4" ry="2" fill="#F9A8D4" opacity="0.6"/>' +
      '<g class="hero-gajju-ear">' +
        '<path d="M56 19 Q41 15 39 30 Q38 43 51 44 Q58 40 57 30 Z" fill="url(#gajjuSkin)" stroke="#8B93A1" stroke-width="0.8"/>' +
        '<path d="M53.5 22 Q43.5 20 42.5 30.5 Q42.5 39.5 50.5 40.5 Q54.5 37 54 30 Z" fill="#F9A8D4" opacity="0.7"/>' +
      '</g>'
  });

  // Pari Patang: an ORIGINAL Kido character. A girl with two braids and a yellow kurta whose cape is a kite
  // (patang) with a tail of paper bows. Special move: when she jumps the kite fills with wind and she glides,
  // falling more slowly (HEROES.pari.glide). Catchphrase: "Up, up and away!"
  var HERO_PARI_SVG = heroSvg({
    key: "pari", label: "Pari Patang, the kite-cape girl",
    defs: shadowDef("pari", "#3B0764") +
      '<linearGradient id="pariKurta" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FDE047"/><stop offset="100%" stop-color="#EAB308"/></linearGradient>' +
      '<linearGradient id="pariSkin" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E7B48F"/><stop offset="100%" stop-color="#C68B62"/></linearGradient>',
    behind:
      '<g class="hero-tail">' +
        '<path d="M36 70 Q30 76 24 75 Q18 74 13 80" fill="none" stroke="#7C3AED" stroke-width="0.9"/>' +
        '<path d="M30 73.5 L27.5 71 L27 75.5 Z M33 73.5 L35.5 71 L36 75.5 Z" fill="#F43F5E"/>' +
        '<path d="M19.5 75.5 L17 73 L16.5 77.5 Z M22.5 75.2 L25 73 L25.5 77.2 Z" fill="#22C55E"/>' +
      '</g>' +
      '<g class="hero-cape hero-pari-kite">' +
        '<path d="M51 44 L38 24 L24 46 L37 70 Z" fill="#F97316"/>' +
        '<path d="M38 24 L24 46 L37 46 Z" fill="#EC4899"/>' +
        '<path d="M37 46 L51 44 L37 70 Z" fill="#8B5CF6"/>' +
        '<path d="M38 24 L37 70 M24 46 L51 44" stroke="#78350F" stroke-width="1" stroke-linecap="round"/>' +
        '<path d="M51 44 L38 24 L24 46 L37 70 Z" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.7"/>' +
      '</g>',
    limb: "#EC4899", limbBack: "#BE185D", foot: "#DC2626", footBack: "#991B1B",
    hand: "#D9A07A", handBack: "#B57A55", armLimb: "#D9A07A", armLimbBack: "#B57A55",
    torso:
      '<path d="M45 42 Q57 37 66 46 L65 72 L43 72 Q40 56 45 42 Z" fill="url(#pariKurta)"/>' +
      '<path d="M43.5 68 L65 68 L65 72 L43 72 Z" fill="#EC4899"/>' +
      '<path d="M53 44 L56 52 L59 44" fill="none" stroke="#EC4899" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="58" r="1.3" fill="#EC4899"/><circle cx="57" cy="61" r="1.3" fill="#EC4899"/><circle cx="61" cy="55" r="1.3" fill="#EC4899"/>',
    head:
      '<path d="M48 26 Q40 32 42 46 Q44 50 46 46 Q45 36 50 30 Z" fill="#1F1209"/>' +
      '<path d="M42 46 L41 50 M46 46 L47 50" stroke="#F43F5E" stroke-width="2" stroke-linecap="round"/>' +
      '<ellipse cx="62" cy="30" rx="14.5" ry="15.5" fill="url(#pariSkin)"/>' +
      '<path d="M47 27 Q48 12 63 13 Q76 13 77 25 Q70 18 61 19 Q53 20 48 28 Z" fill="#1F1209"/>' +
      '<circle cx="52" cy="17.5" r="2.6" fill="#F43F5E"/><circle cx="52" cy="17.5" r="1" fill="#FDE047"/>' +
      '<ellipse cx="67" cy="28" rx="2.8" ry="3.4" fill="#1F1209"/><circle cx="68" cy="27" r="1.1" fill="#FFFFFF"/>' +
      '<path d="M64.5 23.5 Q67.5 22 70 23.6" stroke="#1F1209" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
      '<path d="M66 38 Q70 41 74 37.5" stroke="#9F1239" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M74 30 Q77 32 75 34" stroke="#A86D47" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="62" cy="34" rx="3.2" ry="1.9" fill="#FB7185" opacity="0.5"/>'
  });

  // Cooker-Bot Chintu: an ORIGINAL Kido character. A small round robot built from a shiny pressure cooker:
  // spring legs, LED eyes, a red handle on his back and a whistle on his lid. Special move: when he jumps the
  // whistle goes "seeti!" with a puff of steam (HEROES.chintu.onJump + .hero-chintu-steam). Catchphrase:
  // "Seeti time!"
  var HERO_CHINTU_SVG = heroSvg({
    key: "chintu", label: "Cooker-Bot Chintu, the pressure-cooker robot",
    defs: shadowDef("chintu", "#0F172A") +
      '<linearGradient id="chintuSteel" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#94A3B8"/><stop offset="30%" stop-color="#F8FAFC"/><stop offset="55%" stop-color="#E2E8F0"/><stop offset="100%" stop-color="#64748B"/></linearGradient>',
    behind:
      '<g class="hero-tail">' +
        '<path d="M45 52 L27 49 Q24 49 24.5 52 Q25 55 28 55 L45 57 Z" fill="#DC2626" stroke="#7F1D1D" stroke-width="0.8"/>' +
        '<circle cx="27" cy="52" r="1.2" fill="#7F1D1D"/>' +
      '</g>',
    limb: "#CBD5E1", limbBack: "#94A3B8", stripe: "#475569", thick: 0.8,
    foot: "#1E293B", footBack: "#0F172A", hand: "#334155", handBack: "#1E293B",
    torso:
      '<path d="M43 44 L66 44 L66 63 Q66 72 54.5 72 Q43 72 43 63 Z" fill="url(#chintuSteel)" stroke="#64748B" stroke-width="0.8"/>' +
      '<rect x="42" y="44" width="25" height="3.4" rx="1.2" fill="#DC2626"/>' +
      '<rect x="48" y="52" width="13" height="9" rx="2" fill="#0F172A"/>' +
      '<circle cx="51.5" cy="56.5" r="1.4" fill="#22C55E"/><circle cx="55.5" cy="56.5" r="1.4" fill="#FACC15"/><circle cx="59" cy="56.5" r="1.4" fill="#EF4444"/>',
    head:
      '<g class="hero-chintu-steam">' +
        '<circle cx="62" cy="4" r="3.5" fill="#F1F5F9"/><circle cx="57" cy="1" r="2.6" fill="#F1F5F9"/><circle cx="66.5" cy="0.5" r="2.4" fill="#F1F5F9"/>' +
      '</g>' +
      '<g class="hero-chintu-whistle">' +
        '<rect x="59.5" y="9" width="5" height="6" rx="1.2" fill="#1E293B"/><circle cx="62" cy="8.5" r="3" fill="#334155"/>' +
      '</g>' +
      '<path d="M44 33 Q46 15 62 15 Q78 15 80 33 Z" fill="url(#chintuSteel)" stroke="#64748B" stroke-width="0.8"/>' +
      '<rect x="44" y="31" width="36" height="13" rx="5" fill="url(#chintuSteel)" stroke="#64748B" stroke-width="0.8"/>' +
      '<rect x="57" y="29" width="22" height="13" rx="4.5" fill="#0F172A"/>' +
      '<rect x="61" y="32" width="4.5" height="6" rx="1.6" fill="#22D3EE"/><rect x="70" y="32" width="4.5" height="6" rx="1.6" fill="#22D3EE"/>' +
      '<path d="M63 40 Q68 42.5 73 40" stroke="#22D3EE" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M47 23 Q53 19 59 19.5" stroke="#FFFFFF" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.8"/>'
  });

  // (Removed: trademarked characters are not shipped. Heroes are original art only.)


  // (Removed: trademarked / not-child-appropriate character. Original heroes only.)


  var HEROES = {
    momo: {
      key: "momo",
      name: "Super Momo",
      badge: "🦊",
      canFlip: false,
      speech: "Super Momo!",
      svg: HERO_MOMO_SVG
    },
    nova: {
      key: "nova",
      name: "Captain Nova",
      badge: "⭐",
      canFlip: true,
      speech: "Captain Nova, ready!",
      svg: HERO_NOVA_SVG
    },
    comet: {
      key: "comet",
      name: "Comet",
      badge: "⚡",
      canFlip: true,
      speech: "Comet, zoom!",
      svg: HERO_COMET_SVG
    },
    tiko: {
      key: "tiko",
      name: "Tiko",
      badge: "🐯",
      canFlip: false,
      speech: "Tiko here! Delivery on time!",
      svg: HERO_TIKO_SVG
    },
    gajju: {
      key: "gajju",
      name: "Gajju",
      badge: "🐘",
      canFlip: false,
      speech: "Gajju here! Trunk-tastic!",
      svg: HERO_GAJJU_SVG
    },
    pari: {
      key: "pari",
      name: "Pari",
      badge: "🪁",
      canFlip: false,
      glide: true,                                   // the kite catches the wind: she falls slower after the top
      speech: "Pari here! Up, up and away!",
      svg: HERO_PARI_SVG
    },
    chintu: {
      key: "chintu",
      name: "Chintu",
      badge: "🤖",
      canFlip: false,
      speech: "Chintu here! Seeti time!",
      onJump: function () {                          // the cooker whistle: "see-ti!"
        if (!Kido.audio || !Kido.audio.tone) return;
        Kido.audio.tone(1750, 0.16, "sine", 0.12);
        setTimeout(function () { Kido.audio.tone(2350, 0.24, "sine", 0.12); }, 150);
      },
      svg: HERO_CHINTU_SVG
    }
  };

  // 3D Realistic Pixar-styled Street Obstacles: Traffic Safety Cone & Road Hazard Barrier
  var STREET_OBSTACLES = {
    cone: [
      '<svg viewBox="0 0 54 54" class="street-obstacle street-obstacle--cone" role="img" aria-label="Traffic Cone">',
        '<defs>',
          '<linearGradient id="coneBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" stop-color="#EA580C"/>',
            '<stop offset="35%" stop-color="#FB923C"/>',
            '<stop offset="70%" stop-color="#F97316"/>',
            '<stop offset="100%" stop-color="#C2410C"/>',
          '</linearGradient>',
          '<linearGradient id="coneStripeGrad" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" stop-color="#F1F5F9"/>',
            '<stop offset="50%" stop-color="#FFFFFF"/>',
            '<stop offset="100%" stop-color="#CBD5E1"/>',
          '</linearGradient>',
        '</defs>',
        '<!-- Ground shadow -->',
        '<ellipse cx="27" cy="48" rx="21" ry="4.5" fill="#0F172A" opacity="0.32"/>',
        '<!-- Base rim -->',
        '<polygon points="7,45 47,45 43,50 11,50" fill="#1E293B"/>',
        '<polygon points="10,44 44,44 47,45 7,45" fill="#334155"/>',
        '<!-- Cone body -->',
        '<polygon points="27,8 15,44 39,44" fill="url(#coneBodyGrad)"/>',
        '<!-- Upper reflective stripe -->',
        '<polygon points="22,23 32,23 34,29 20,29" fill="url(#coneStripeGrad)"/>',
        '<!-- Lower reflective stripe -->',
        '<polygon points="18,34 36,34 38,39 16,39" fill="url(#coneStripeGrad)"/>',
        '<!-- Rounded tip -->',
        '<circle cx="27" cy="9" r="2.5" fill="#FDBA74"/>',
      '</svg>'
    ].join(""),
    barrier: [
      '<svg viewBox="0 0 60 54" class="street-obstacle street-obstacle--barrier" role="img" aria-label="Road Hazard Barrier">',
        '<defs>',
          '<linearGradient id="barrierLegGrad" x1="0%" y1="0%" x2="100%" y2="0%">',
            '<stop offset="0%" stop-color="#94A3B8"/>',
            '<stop offset="50%" stop-color="#CBD5E1"/>',
            '<stop offset="100%" stop-color="#64748B"/>',
          '</linearGradient>',
        '</defs>',
        '<!-- Ground shadow -->',
        '<ellipse cx="30" cy="50" rx="25" ry="3.5" fill="#0F172A" opacity="0.3"/>',
        '<!-- A-frame steel legs -->',
        '<line x1="14" y1="22" x2="8" y2="49" stroke="url(#barrierLegGrad)" stroke-width="4" stroke-linecap="round"/>',
        '<line x1="14" y1="22" x2="20" y2="49" stroke="url(#barrierLegGrad)" stroke-width="4" stroke-linecap="round"/>',
        '<line x1="46" y1="22" x2="40" y2="49" stroke="url(#barrierLegGrad)" stroke-width="4" stroke-linecap="round"/>',
        '<line x1="46" y1="22" x2="52" y2="49" stroke="url(#barrierLegGrad)" stroke-width="4" stroke-linecap="round"/>',
        '<!-- Hazard board with bold diagonal safety stripes -->',
        '<rect x="4" y="16" width="52" height="15" rx="3" fill="#DC2626"/>',
        '<g fill="#F8FAFC">',
          '<polygon points="12,16 18,16 11,31 5,31"/>',
          '<polygon points="25,16 31,16 24,31 18,31"/>',
          '<polygon points="38,16 44,16 37,31 31,31"/>',
          '<polygon points="51,16 55,16 49,31 43,31"/>',
        '</g>',
        '<rect x="4" y="16" width="52" height="15" rx="3" fill="none" stroke="#991B1B" stroke-width="1.2"/>',
        '<!-- Steel hardware rivets -->',
        '<circle cx="14" cy="23.5" r="1.8" fill="#334155"/>',
        '<circle cx="46" cy="23.5" r="1.8" fill="#334155"/>',
        '<!-- Flashing amber road beacon -->',
        '<rect x="26" y="9" width="8" height="7" rx="1.5" fill="#334155"/>',
        '<circle cx="30" cy="9" r="4.5" fill="#FACC15" stroke="#CA8A04" stroke-width="1"/>',
        '<circle cx="30" cy="9" r="7" fill="#FEF08A" opacity="0.35"/>',
      '</svg>'
    ].join("")
  };

  // Sim constants: horizontal in % of scene width, vertical lift in px.
  var CHAR_X = 16, COLLECT_DX = 9, HIT_DX = 7, SPAWN_X = 108, EXIT_X = -10;
  var GRAV = 2400, JUMP_V = 830, AIR_COLLECT = 34, AIR_CLEAR = 42;
  var GLIDE_FALL = 240;                             // px/s: the fastest Pari falls while her kite glides

  // the word lines for every word list, recorded by scripts/voice/harvest.js (else: the device voice)
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var W = Kido.content.words || {}, out = [];
    Object.keys(W).forEach(function (k) { (W[k] || []).forEach(function (w) { out.push("Let's spell " + w + "! Tap to jump.", w + "! You did it!"); }); });
    Object.keys(HEROES).forEach(function (k) { if (HEROES[k].speech) out.push(HEROES[k].speech); });   // each hero's own line
    return out;
  });

  Kido.activities.runner = function (spec) {
    var cfg = Kido.age.cfg();
    var pool = (Kido.content.words[spec.theme] || Kido.content.words.animals);
    var fit = pool.filter(function (w) { return w.length <= cfg.maxWordLen; });
    var word = (fit.length ? U.pick(fit)
      : pool.slice().sort(function (a, b) { return a.length - b.length; })[0]);
    var letters = word.split("");

    var world = (18 + cfg.difficulty * 3.2) * 0.60;               // %/sec scroll speed (slowed down by 40%)
    var obstaclesOn = cfg.difficulty >= 3;               // 3–5yr: pure collect, no obstacles
    var obGap = Math.max(26, 70 - cfg.difficulty * 6);   // % between rocks (smaller = harder)

    // Load active hero (default: momo)
    var currentHeroKey = "momo";
    try {
      var saved = localStorage.getItem("kido_runner_hero");
      if (saved && HEROES[saved]) currentHeroKey = saved;
    } catch (e) { currentHeroKey = "momo"; }

    var m = document.getElementById("screen");
    m.innerHTML = ""; m.scrollTop = 0;
    var root = U.el("div", { class: "runner", html: RUNNER_HTML(word, currentHeroKey) });
    m.appendChild(root);

    var scene  = root.querySelector(".runner__scene");
    var itemsL = root.querySelector("#run-items");
    var charEl = root.querySelector(".runner__char");
    var bodyEl = root.querySelector(".runner__body");          // squash/stretch/bounce live here, the jump on charEl
    var road = root.querySelectorAll(".runner__curb, .runner__lane-stripes");
    var track  = root.querySelector("#run-word");

    var index = 0, mistakes = 0, lift = 0, vy = 0, done = false, stunned = 0;
    var travel = 0, nextOb = obGap * 0.8;
    var letterItem = null, obstacles = [];

    // Jump Flip mechanics (flip-capable heroes — Captain Nova & Comet — random somersault)
    var isFlipping = false, flipAngle = 0, jumpTime = 0;
    var JUMP_DURATION = 0.68; // Total flight time in air (~ 2 * JUMP_V / GRAV)

    // Change #28: the hero is chosen first, on its own screen (no hero bar in the game); the run starts once
    // the child picks one. Last time's hero is highlighted.
    var started = false;
    var picker = root.querySelector(".runner__pick");
    Array.prototype.forEach.call(picker.querySelectorAll(".runner__pick-card"), function (card) {
      card.addEventListener("click", function (e) {
        e.stopPropagation();
        var k = card.dataset.hero;
        if (started || !HEROES[k]) return;
        currentHeroKey = k;
        try { localStorage.setItem("kido_runner_hero", k); } catch (err) {}
        bodyEl.innerHTML = HEROES[k].svg;
        if (Kido.audio.playTapSound) Kido.audio.playTapSound();
        if (HEROES[k].speech) Kido.audio.speak(HEROES[k].speech);   // the hero's own line first ("Delivery on time!")
        start();
      });
    });
    function start() {
      started = true;
      picker.remove();
      charEl.classList.add("running");
      renderTrack();
      spawnLetter();
      Kido.mascot.say("Tap the screen to jump and grab the letters!");
      Kido.audio.speak("Let's spell " + word + "! Tap to jump.");
    }
    if (Kido.Music) Kido.Music.play("adventure");
    Kido.mascot.say("Who will run? Pick your hero!");
    Kido.audio.speak("Who will run? Pick your hero!");
    var firstCard = picker.querySelector(".is-last") || picker.querySelector(".runner__pick-card");
    if (firstCard) firstCard.focus({ preventScroll: true });

    function renderTrack() {
      track.innerHTML = "";
      letters.forEach(function (ch, i) {
        track.appendChild(U.el("span", {
          class: "run-box" + (i < index ? " got" : (i === index ? " next" : "")),
          text: ch                                   // the word itself; letters not yet caught show faint
        }));
      });
    }

    function makeItem(cls, inner, xPct, bottomCss) {
      var el = U.el("div", { class: cls, html: inner });
      el.style.left = xPct + "%"; el.style.bottom = bottomCss;
      itemsL.appendChild(el);
      return el;
    }

    function spawnLetter() {
      if (index >= letters.length) { letterItem = null; return; }
      var ch = letters[index];
      // Golden letter badge positioned at character's jump apex on the road
      letterItem = { x: SPAWN_X, ch: ch, el: makeItem("run-letter", ch, SPAWN_X, "calc(14% + 80px)") };
      Kido.audio.speak(ch, { rate: 0.92 });
    }

    function spawnObstacle() {
      // Never drop an obstacle right on top of the active letter — keep it fair.
      if (letterItem && Math.abs(SPAWN_X - letterItem.x) < 14) return;
      var obType = Math.random() < 0.5 ? "cone" : "barrier";
      var svg = STREET_OBSTACLES[obType] || STREET_OBSTACLES.cone;
      obstacles.push({ x: SPAWN_X, done: false, el: makeItem("run-rock run-rock--" + obType, svg, SPAWN_X, "14%") });
    }

    function jump() {
      if (done || !started) return;
      // If stunned (just hit an obstacle), tapping immediately cancels the stun so the character recovers and jumps!
      if (stunned > 0) {
        stunned = 0;
        lift = 0;
        charEl.classList.remove("flipping");
      }
      // Responsive jump buffer: allow jump when on or close to the ground (within 40px)
      if (lift <= 40) {
        vy = JUMP_V;
        jumpTime = 0;
        pose("takeoff", 120);

        // Flip-capable heroes do a somersault while jumping, randomly (not every time)
        var hero = HEROES[currentHeroKey] || HEROES.momo;
        if (hero.onJump) hero.onJump();                // Chintu's whistle
        if (hero.canFlip && Math.random() < 0.55) {
          isFlipping = true;
          flipAngle = 0;
          charEl.classList.add("flipping");
        } else {
          isFlipping = false;
          flipAngle = 0;
          charEl.classList.remove("flipping");
        }

        Kido.audio.playTapSound && Kido.audio.playTapSound();
      }
    }

    // One step of the world. dt in seconds. Pure enough to call by hand in tests.
    function tick(dt) {
      if (done || !started) return;
      dt = Math.min(dt, 0.05);                       // clamp tab-switch gaps
      if (stunned > 0) {
        stunned = Math.max(0, stunned - dt);
        isFlipping = false; flipAngle = 0;
        charEl.classList.remove("flipping");
        paint(); return;
      }

      if (vy !== 0 || lift > 0) {                    // jump physics
        var glide = vy < 0 && (HEROES[currentHeroKey] || {}).glide;   // Pari: the kite catches the wind on the way down:
        lift += vy * dt; vy -= (glide ? GRAV * 0.35 : GRAV) * dt;        // lighter gravity, and a gentle top falling speed
        if (glide && vy < -GLIDE_FALL) vy = -GLIDE_FALL;
        if (isFlipping) {
          jumpTime += dt;
          var prog = Math.min(1, jumpTime / JUMP_DURATION);
          flipAngle = prog * 360;
        }
        if (lift <= 0) {
          lift = 0; vy = 0;
          pose("land", 200);
          isFlipping = false;
          flipAngle = 0;
          jumpTime = 0;
          charEl.classList.remove("flipping");
        }
      }
      travel += world * dt;

      if (letterItem) {                              // active letter scrolls in
        letterItem.x -= world * dt;
        if (Math.abs(letterItem.x - CHAR_X) < COLLECT_DX && lift > AIR_COLLECT) return collect();
        if (letterItem.x < EXIT_X) letterItem.x = SPAWN_X;   // missed → loop back, no penalty
      }

      if (obstaclesOn && travel >= nextOb) {         // schedule next rock
        spawnObstacle(); nextOb = travel + obGap + U.randInt(-6, 8);
      }
      for (var k = obstacles.length - 1; k >= 0; k--) {
        var o = obstacles[k]; o.x -= world * dt;
        if (!o.done && Math.abs(o.x - CHAR_X) < HIT_DX) {
          o.done = true;
          if (lift > AIR_CLEAR) o.el.classList.add("cleared");   // jumped clear
          else stumble(o);                                       // ran into it
        }
        if (o.x < EXIT_X) { o.el.remove(); obstacles.splice(k, 1); }
      }
      paint();
    }

    function collect() {
      Kido.audio.playCorrectSound && Kido.audio.playCorrectSound();
      Kido.fx && Kido.fx.sparkleEl && Kido.fx.sparkleEl(letterItem.el);
      if (letterItem.el) letterItem.el.remove();
      letterItem = null; index++; renderTrack();
      if (index >= letters.length) return win();
      spawnLetter(); paint();
    }

    function stumble(o) {                            // gentle: pause, encourage, carry on
      mistakes++; stunned = 0.7;
      isFlipping = false; flipAngle = 0; jumpTime = 0;
      charEl.classList.remove("flipping");
      o.el.classList.add("hit");
      Kido.fx && Kido.fx.shake && Kido.fx.shake(charEl);
      Kido.audio.playIncorrectSound && Kido.audio.playIncorrectSound();
      Kido.mascot.say("Oops — tap to jump over it!");
    }

    var poseTimer = null;
    function pose(cls, ms) {                          // a short take-off stretch / landing squash
      charEl.classList.remove("takeoff", "land"); void charEl.offsetWidth;
      charEl.classList.add(cls);
      clearTimeout(poseTimer); poseTimer = setTimeout(function () { charEl.classList.remove(cls); }, ms);
    }

    function paint() {
      var rot = isFlipping ? " rotate(" + Math.min(360, Math.round(flipAngle)) + "deg)" : "";
      charEl.style.transform = "translateY(" + (-lift) + "px)" + rot;
      charEl.classList.toggle("running", lift <= 0 && stunned <= 0);
      if (letterItem && letterItem.el) letterItem.el.style.left = letterItem.x + "%";
      obstacles.forEach(function (o) { o.el.style.left = o.x + "%"; });
      // The road moves at exactly the letters' speed (so feet don't slide); the city behind moves slower (depth).
      var ground = travel / 100 * (scene.clientWidth || 800);
      Array.prototype.forEach.call(road, function (r) { r.style.backgroundPositionX = (-ground) + "px"; });
      scene.style.backgroundPositionX = (-ground * 0.45) + "px";
    }

    function win() {
      done = true;
      isFlipping = false; flipAngle = 0; jumpTime = 0;
      charEl.classList.remove("running", "flipping");
      charEl.style.transform = "translateY(0)";
      renderTrack();
      Kido.audio.playCelebrationSound && Kido.audio.playCelebrationSound();

      var aKey = word.toLowerCase();
      var isCreature = Kido.creatures && (Kido.creatures.has(aKey) || Kido.creatures.hasArt(aKey));
      var cInfo = (Kido.creatures && Kido.creatures.get(aKey)) || null;

      if (isCreature) {
        var card = U.el("div", {
          class: "runner-reveal-card",
          html: '<div class="runner-reveal-pic">' +
                  Kido.creatures.render(aKey) +
                '</div>' +
                '<div class="runner-reveal-badge">' +
                  '<span>🔊</span> ' + (cInfo && cInfo.name ? cInfo.name : word) +
                '</div>'
        });
        scene.appendChild(card);

        // Play real animal sound
        var grp = (Kido.creatures && Kido.creatures.group(aKey)) || "animals";
        if (grp === "birds") {
          if (Kido.AudioManager && Kido.AudioManager.playBird) Kido.AudioManager.playBird(aKey);
          else if (Kido.audio && Kido.audio.playBirdSound) Kido.audio.playBirdSound(aKey);
        } else {
          if (Kido.AudioManager && Kido.AudioManager.playAnimal) Kido.AudioManager.playAnimal(aKey);
          else if (Kido.audio && Kido.audio.playAnimalSound) Kido.audio.playAnimalSound(aKey);
        }

        setTimeout(function () { Kido.audio.speak(word + "! You did it!"); }, 700);
        var correct = Math.max(1, letters.length - Math.min(mistakes, letters.length - 1));
        setTimeout(function () { Kido.engine.finish(spec, correct, letters.length); }, 3000);
      } else {
        setTimeout(function () { Kido.audio.speak(word + "! You did it!"); }, 300);
        var correct = Math.max(1, letters.length - Math.min(mistakes, letters.length - 1));
        setTimeout(function () { Kido.engine.finish(spec, correct, letters.length); }, 1100);
      }
    }

    // Input: tapping or clicking ANYWHERE on the screen makes the hero jump instantly!
    function onActionTap(e) {
      jump();
    }

    scene.addEventListener("pointerdown", onActionTap);
    root.addEventListener("pointerdown", onActionTap);
    scene.addEventListener("click", onActionTap);
    scene.addEventListener("touchstart", function (e) {
      if (!started) return;                          // a tap on the hero picker stays a tap
      e.preventDefault();
      jump();
    }, { passive: false });
    scene.setAttribute("tabindex", "0");
    scene.setAttribute("role", "button");
    scene.setAttribute("aria-label", "Tap anywhere or press space to jump");
    scene.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter" || e.key === "ArrowUp") { e.preventDefault(); jump(); }
    });
    Kido.util.onWhile(scene, window, "keydown", function (e) {
      if (e.key === " " || e.key === "ArrowUp") {
        if (started && document.body.contains(scene) && !done) { e.preventDefault(); jump(); }
      }
    });

    // rAF loop; stops itself once finished or the screen is torn down.
    var last = 0;
    function frame(ts) {
      if (done || !document.body.contains(scene)) return;
      if (!last) last = ts;
      tick((ts - last) / 1000); last = ts;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // Verify hook: drive the sim by hand (a hidden pane freezes rAF/timers).
    root.__runner = {
      tick: tick, jump: jump, paint: paint,
      state: function () {
        return { index: index, lift: lift, vy: vy, mistakes: mistakes, stunned: stunned,
          done: done, started: started, word: word, letterX: letterItem && letterItem.x, obstacles: obstacles.length,
          hero: currentHeroKey, isFlipping: isFlipping, flipAngle: flipAngle };
      }
    };
  };

  function RUNNER_HTML(word, selectedHeroKey) {
    var heroKey = selectedHeroKey || "momo";
    var hero = HEROES[heroKey] || HEROES.momo;

    var heroCards = Object.keys(HEROES).map(function (k) {
      var h = HEROES[k];
      return '<button class="runner__pick-card' + (k === heroKey ? " is-last" : "") + '" data-hero="' + k + '" type="button" aria-label="' + h.name + '">' +
        '<span class="runner__pick-art">' + h.svg + '</span>' +
        '<span class="runner__pick-name"><span class="runner__pick-badge">' + h.badge + ' </span>' + h.name + '</span>' +
      '</button>';
    }).join("");

    return [
      '<div class="runner__head">',
        '<div class="game__prompt">Jump to spell: <b>' + word + '</b></div>',
        '<div class="game__hint">Tap the screen to jump ⤴ and grab the letters</div>',
      '</div>',
      '<div class="runner__scene" role="button" aria-label="Tap to jump">',
        '<div class="runner__items" id="run-items"></div>',
        '<div class="runner__char"><div class="runner__body">', hero.svg, '</div><span class="runner__dust"></span></div>',
        '<div class="runner__road">',
          '<div class="runner__curb"></div>',
          '<div class="runner__lane-stripes"></div>',
        '</div>',
      '</div>',
      '<div class="runner__word" id="run-word"></div>',
      '<div class="runner__pick" role="dialog" aria-label="Choose your hero">',
        '<div class="runner__pick-title">Who will run?</div>',
        '<div class="runner__pick-row">', heroCards, '</div>',
      '</div>'
    ].join("");
  }
})(window);
