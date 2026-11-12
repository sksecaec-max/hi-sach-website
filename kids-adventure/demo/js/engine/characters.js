/* =========================================================================
   characters.js — Rigged cartoon characters (Momo the fox, Pip the robot)
   Each character is one inline SVG whose every mouth/brow variant ships in the
   markup; expressions and poses are applied by toggling CSS classes (see
   scene.css). No image assets, fully original, animation-principle friendly
   (squash/stretch on jump, secondary motion on arms, idle breathe + blink).

     var momo = Kido.Characters.create("momo");
     stage.appendChild(momo.el);
     momo.set("excited").pose("cheer").look(6,-4);
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var STATES = ["idle", "happy", "sad", "thinking", "surprised", "excited", "celebrating", "sleeping"];
  // hop / sniff / point / point-l: Change #17A story moves (a bouncy hop, nose to the ground, an arm raised toward something)
  var POSES  = ["jump", "nod", "cheer", "wave", "run", "hop", "sniff", "point", "point-l"];

  /* ---- Shared face block (eyes + brows + mouth variants) ----
     cx/cy centre the face; tints let each species restyle. */
  function faceSVG(o) {
    o = o || {};
    var isRobot = o.isRobot;
    var eyeFill = o.eye || "#2B2151";
    var mouth = o.mouthStroke || "#66291B";

    if (isRobot) {
      return (
        '<rect class="kc-brow kc-brow-l" x="66" y="86" width="24" height="7" rx="3.5" fill="'+eyeFill+'"/>' +
        '<rect class="kc-brow kc-brow-r" x="110" y="86" width="24" height="7" rx="3.5" fill="'+eyeFill+'"/>' +
        '<ellipse class="kc-eye" cx="80"  cy="108" rx="17" ry="19" fill="#fff"/>' +
        '<ellipse class="kc-eye" cx="120" cy="108" rx="17" ry="19" fill="#fff"/>' +
        '<g class="kc-pupil"><circle cx="80" cy="110" r="9" fill="'+eyeFill+'"/><circle cx="83" cy="106" r="3" fill="#fff"/></g>' +
        '<g class="kc-pupil"><circle cx="120" cy="110" r="9" fill="'+eyeFill+'"/><circle cx="123" cy="106" r="3" fill="#fff"/></g>' +
        '<rect class="kc-lid" x="63"  y="89" width="34" height="40" rx="17" fill="'+(o.lid||"#EAF7FF")+'"/>' +
        '<rect class="kc-lid" x="103" y="89" width="34" height="40" rx="17" fill="'+(o.lid||"#EAF7FF")+'"/>' +
        '<path class="kc-mouth m-smile" d="M84 140 Q100 156 116 140" fill="none" stroke="'+mouth+'" stroke-width="6" stroke-linecap="round"/>' +
        '<path class="kc-mouth m-open"  d="M82 138 Q100 172 118 138 Q100 150 82 138 Z" fill="'+mouth+'"/>' +
        '<ellipse class="kc-mouth m-o" cx="100" cy="146" rx="11" ry="14" fill="'+mouth+'"/>' +
        '<rect class="kc-mouth m-flat" x="86" y="146" width="28" height="6" rx="3" fill="'+mouth+'"/>' +
        '<path class="kc-mouth m-frown" d="M84 152 Q100 138 116 152" fill="none" stroke="'+mouth+'" stroke-width="6" stroke-linecap="round"/>'
      );
    }

    // 3D Realistic Character Face (Momo the Fox)
    var irisFill = o.uid ? 'url(#' + o.uid + 'Iris3D)' : '#25144A';
    var lusterFill = o.uid ? 'url(#' + o.uid + 'EyeLuster)' : 'none';
    var lidFill = o.uid ? 'url(#' + o.uid + 'Lid3D)' : '#FFA86B';
    return (
      // 3D Expressive Eyebrows
      '<rect class="kc-brow kc-brow-l" x="65" y="82" width="26" height="8" rx="4" fill="#2B2151"/>' +
      '<rect class="kc-brow kc-brow-r" x="109" y="82" width="26" height="8" rx="4" fill="#2B2151"/>' +

      // 3D Spherical Eye Whites (bright, clean, friendly cartoon eyes)
      '<ellipse class="kc-eye" cx="78"  cy="107" rx="18" ry="21" fill="#FFFFFF"/>' +
      '<ellipse class="kc-eye" cx="122" cy="107" rx="18" ry="21" fill="#FFFFFF"/>' +

      // 3D Animated Glossy Living Pupils (moves with --look-x, --look-y)
      '<g class="kc-pupil">' +
        '<circle cx="78" cy="108" r="11" fill="' + irisFill + '"/>' +
        (o.uid ? '<circle cx="78" cy="108" r="11" fill="' + lusterFill + '"/>' : '') +
        '<circle cx="82" cy="104" r="3.8" fill="#FFFFFF"/>' +
        '<circle cx="74" cy="112" r="1.8" fill="#FFFFFF" opacity="0.85"/>' +
      '</g>' +
      '<g class="kc-pupil">' +
        '<circle cx="122" cy="108" r="11" fill="' + irisFill + '"/>' +
        (o.uid ? '<circle cx="122" cy="108" r="11" fill="' + lusterFill + '"/>' : '') +
        '<circle cx="126" cy="104" r="3.8" fill="#FFFFFF"/>' +
        '<circle cx="118" cy="112" r="1.8" fill="#FFFFFF" opacity="0.85"/>' +
      '</g>' +

      // 3D Eyelids for natural animated blinking
      '<rect class="kc-lid" x="59"  y="84" width="38" height="46" rx="19" fill="' + lidFill + '"/>' +
      '<rect class="kc-lid" x="103" y="84" width="38" height="46" rx="19" fill="' + lidFill + '"/>' +

      // 3D Mouth Variants
      '<g class="kc-mouth m-smile">' +
        '<path d="M84 142 Q100 157 116 142" fill="none" stroke="'+mouth+'" stroke-width="5" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="kc-mouth m-open">' +
        '<path d="M82 139 Q100 172 118 139 Q100 148 82 139 Z" fill="#3D1208"/>' +
        '<path d="M87 154 Q100 146 113 154 Q100 170 87 154 Z" fill="#FF5E82"/>' +
      '</g>' +
      '<g class="kc-mouth m-o">' +
        '<ellipse cx="100" cy="148" rx="10" ry="13" fill="#3D1208"/>' +
        '<ellipse cx="100" cy="154" rx="7" ry="5.5" fill="#FF5E82"/>' +
      '</g>' +
      '<g class="kc-mouth m-flat">' +
        '<path d="M86 146 Q100 148 114 146" fill="none" stroke="'+mouth+'" stroke-width="5" stroke-linecap="round"/>' +
      '</g>' +
      '<g class="kc-mouth m-frown">' +
        '<path d="M84 153 Q100 140 116 153" fill="none" stroke="'+mouth+'" stroke-width="5" stroke-linecap="round"/>' +
      '</g>'
    );
  }

  var foxInstanceCounter = 0;

  /* ---- Momo the fox (3D Realistic Volumetric Render) ---- */
  function foxSVG() {
    var uid = "mfox" + (++foxInstanceCounter) + "_";
    return '' +
      '<svg class="kido-char kc-fox" viewBox="0 0 200 240" role="img" aria-label="Momo the fox">' +
        '<defs>' +
          // Soft Ground Contact Shadow & Rosy Blush Glow (Standard feGaussianBlur)
          '<filter id="' + uid + 'GroundShadow" x="-30%" y="-30%" width="160%" height="160%">' +
            '<feGaussianBlur stdDeviation="4.5"/>' +
          '</filter>' +
          '<filter id="' + uid + 'BlushGlow" x="-50%" y="-50%" width="200%" height="200%">' +
            '<feGaussianBlur stdDeviation="3.5"/>' +
          '</filter>' +

          // 3D Head Spherical Gradient (Vibrant rich fox orange)
          '<radialGradient id="' + uid + 'Head3D" cx="38%" cy="26%" r="68%" fx="35%" fy="22%">' +
            '<stop offset="0%" stop-color="#FFA86B"/>' +
            '<stop offset="25%" stop-color="#FF7F29"/>' +
            '<stop offset="65%" stop-color="#E85900"/>' +
            '<stop offset="88%" stop-color="#BD3B00"/>' +
            '<stop offset="100%" stop-color="#7A2200"/>' +
          '</radialGradient>' +

          // 3D Torso Gradient
          '<radialGradient id="' + uid + 'Torso3D" cx="38%" cy="30%" r="66%" fx="35%" fy="26%">' +
            '<stop offset="0%" stop-color="#FFA463"/>' +
            '<stop offset="28%" stop-color="#FF7724"/>' +
            '<stop offset="68%" stop-color="#DB4B00"/>' +
            '<stop offset="100%" stop-color="#7D2200"/>' +
          '</radialGradient>' +

          // 3D Fluffy Cream Belly
          '<radialGradient id="' + uid + 'Belly3D" cx="46%" cy="26%" r="68%" fx="42%" fy="22%">' +
            '<stop offset="0%" stop-color="#FFFFFF"/>' +
            '<stop offset="45%" stop-color="#FFF5EB"/>' +
            '<stop offset="80%" stop-color="#FCE4CC"/>' +
            '<stop offset="100%" stop-color="#E0BA96"/>' +
          '</radialGradient>' +

          // 3D Snout Muzzle
          '<radialGradient id="' + uid + 'Muzzle3D" cx="50%" cy="25%" r="70%" fx="50%" fy="20%">' +
            '<stop offset="0%" stop-color="#FFFFFF"/>' +
            '<stop offset="42%" stop-color="#FFF6ED"/>' +
            '<stop offset="80%" stop-color="#FAE2CE"/>' +
            '<stop offset="100%" stop-color="#DFC0A2"/>' +
          '</radialGradient>' +

          // 3D Limbs (Arms & Legs)
          '<linearGradient id="' + uid + 'Limb3D" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#FFA669"/>' +
            '<stop offset="25%" stop-color="#FF7724"/>' +
            '<stop offset="70%" stop-color="#C74000"/>' +
            '<stop offset="100%" stop-color="#732200"/>' +
          '</linearGradient>' +

          // 3D Paws
          '<linearGradient id="' + uid + 'Paw3D" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#FF8A3D"/>' +
            '<stop offset="45%" stop-color="#A83600"/>' +
            '<stop offset="100%" stop-color="#591A00"/>' +
          '</linearGradient>' +

          // 3D Fox Tail
          '<linearGradient id="' + uid + 'Tail3D" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#FFB37C"/>' +
            '<stop offset="30%" stop-color="#FF7726"/>' +
            '<stop offset="70%" stop-color="#C73E00"/>' +
            '<stop offset="100%" stop-color="#661C00"/>' +
          '</linearGradient>' +

          // 3D Fox Ears Outer
          '<linearGradient id="' + uid + 'EarOuter3D" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#FFB885"/>' +
            '<stop offset="45%" stop-color="#FF7726"/>' +
            '<stop offset="100%" stop-color="#8F2500"/>' +
          '</linearGradient>' +

          // 3D Ears Inner Cavity (Iconic dark fox ear)
          '<linearGradient id="' + uid + 'EarInner3D" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#422E54"/>' +
            '<stop offset="50%" stop-color="#2B1D38"/>' +
            '<stop offset="100%" stop-color="#180F21"/>' +
          '</linearGradient>' +

          // 3D Button Nose
          '<radialGradient id="' + uid + 'Nose3D" cx="35%" cy="25%" r="65%">' +
            '<stop offset="0%" stop-color="#5E3126"/>' +
            '<stop offset="45%" stop-color="#30140D"/>' +
            '<stop offset="100%" stop-color="#120502"/>' +
          '</radialGradient>' +

          // 3D Iris / Pupil
          '<radialGradient id="' + uid + 'Iris3D" cx="40%" cy="32%" r="65%">' +
            '<stop offset="0%" stop-color="#3B2669"/>' +
            '<stop offset="40%" stop-color="#25144A"/>' +
            '<stop offset="78%" stop-color="#130926"/>' +
            '<stop offset="100%" stop-color="#080312"/>' +
          '</radialGradient>' +

          // Eye Bottom Luster Glow
          '<radialGradient id="' + uid + 'EyeLuster" cx="50%" cy="85%" r="45%">' +
            '<stop offset="0%" stop-color="#9984E0" stop-opacity="0.6"/>' +
            '<stop offset="100%" stop-color="#25144A" stop-opacity="0"/>' +
          '</radialGradient>' +

          // 3D Eyelid
          '<linearGradient id="' + uid + 'Lid3D" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#FFA86B"/>' +
            '<stop offset="65%" stop-color="#FF7724"/>' +
            '<stop offset="100%" stop-color="#C74000"/>' +
          '</linearGradient>' +
        '</defs>' +

        '<g class="kc-body">' +
          // Soft Ground Contact Shadow
          '<ellipse cx="100" cy="226" rx="55" ry="9" fill="#2E0E00" opacity="0.25" filter="url(#' + uid + 'GroundShadow)"/>' +

          // Big Fluffy 3D Tail
          '<g class="kc-tail">' +
            '<path d="M142 172 C168 152, 204 156, 198 198 C194 224, 168 226, 142 195 Z" fill="url(#' + uid + 'Tail3D)"/>' +
            // Fluffy White Tip with soft zigzag tufts
            '<path d="M178 184 C184 180, 194 186, 198 198 C194 224, 172 224, 162 212 C170 208, 166 202, 174 200 C170 196, 174 190, 178 184 Z" fill="url(#' + uid + 'Belly3D)"/>' +
          '</g>' +

          // 3D Legs & Feet
          '<g class="kc-legs">' +
            '<rect x="73" y="194" width="24" height="34" rx="12" fill="url(#' + uid + 'Paw3D)"/>' +
            '<ellipse cx="85" cy="222" rx="9" ry="4.5" fill="#FFE0B2" opacity="0.18"/>' +
            '<rect x="103" y="194" width="24" height="34" rx="12" fill="url(#' + uid + 'Paw3D)"/>' +
            '<ellipse cx="115" cy="222" rx="9" ry="4.5" fill="#FFE0B2" opacity="0.18"/>' +
          '</g>' +

          // 3D Volumetric Torso
          '<ellipse cx="100" cy="184" rx="47" ry="43" fill="url(#' + uid + 'Torso3D)"/>' +

          // 3D Cream Fluffy Belly Patch
          '<path d="M100 152 C118 152, 131 168, 128 192 C126 210, 115 220, 100 220 C85 220, 74 210, 72 192 C69 168, 82 152, 100 152 Z" fill="url(#' + uid + 'Belly3D)"/>' +
          '<path d="M96 153 L100 158 L104 153" stroke="#DEBA99" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.7"/>' +

          // 3D Arms (Paws)
          '<g class="kc-arm-l">' +
            '<rect x="50" y="156" width="22" height="44" rx="11" fill="url(#' + uid + 'Limb3D)"/>' +
            '<path d="M50 186 C50 196, 72 196, 72 186 Z" fill="url(#' + uid + 'Paw3D)"/>' +
            '<line x1="56" y1="162" x2="56" y2="182" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.4"/>' +
          '</g>' +
          '<g class="kc-arm-r">' +
            '<rect x="128" y="156" width="22" height="44" rx="11" fill="url(#' + uid + 'Limb3D)"/>' +
            '<path d="M128 186 C128 196, 150 196, 150 186 Z" fill="url(#' + uid + 'Paw3D)"/>' +
            '<line x1="134" y1="162" x2="134" y2="182" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.4"/>' +
          '</g>' +

          // 3D Head Group
          '<g class="kc-head">' +
            // 3D Fox Ears (Triangular, organic 3D curve with dark inner ear)
            '<g class="kc-ear-l">' +
              '<path d="M58 72 C50 50, 42 22, 48 16 C54 14, 76 40, 92 56 Z" fill="url(#' + uid + 'EarOuter3D)"/>' +
              '<path d="M57 62 C51 46, 48 28, 53 23 C58 22, 73 42, 83 53 Z" fill="url(#' + uid + 'EarInner3D)"/>' +
            '</g>' +
            '<g class="kc-ear-r">' +
              '<path d="M142 72 C150 50, 158 22, 152 16 C146 14, 124 40, 108 56 Z" fill="url(#' + uid + 'EarOuter3D)"/>' +
              '<path d="M143 62 C149 46, 152 28, 147 23 C142 22, 127 42, 117 53 Z" fill="url(#' + uid + 'EarInner3D)"/>' +
            '</g>' +

            // 3D Head Sphere (Rich vibrant fox orange)
            '<ellipse cx="100" cy="112" rx="60" ry="55" fill="url(#' + uid + 'Head3D)"/>' +

            // Cute 3D Fluffy Cheek Tufts (Silhouettes)
            '<path d="M40 118 C35 124, 31 132, 38 136 C42 134, 44 128, 46 126 C41 132, 39 140, 45 142 C50 140, 54 134, 56 130 Z" fill="url(#' + uid + 'Head3D)"/>' +
            '<path d="M160 118 C165 124, 169 132, 162 136 C158 134, 156 128, 154 126 C159 132, 161 140, 155 142 C150 140, 146 134, 144 130 Z" fill="url(#' + uid + 'Head3D)"/>' +

            // Plump 3D Cream Muzzle / Snout (Centered properly on lower face)
            '<ellipse cx="100" cy="132" rx="42" ry="32" fill="url(#' + uid + 'Muzzle3D)"/>' +

            // Soft 3D Rosy Blush Cheeks
            '<ellipse cx="62" cy="132" rx="12" ry="8.5" fill="#FF5E82" opacity="0.45" filter="url(#' + uid + 'BlushGlow)"/>' +
            '<ellipse cx="138" cy="132" rx="12" ry="8.5" fill="#FF5E82" opacity="0.45" filter="url(#' + uid + 'BlushGlow)"/>' +

            // Face (Eyes, Pupils, Brows, Lids, Mouths)
            faceSVG({ uid: uid, mouthStroke: "#66291B" }) +

            // 3D Shiny Button Nose
            '<path d="M92 125 C92 120, 108 120, 108 125 C108 132, 100 137, 100 137 C100 137, 92 132, 92 125 Z" fill="url(#' + uid + 'Nose3D)"/>' +
            '<ellipse cx="98" cy="123" rx="3.5" ry="1.8" fill="#FFFFFF" opacity="0.9"/>' +
            '<line x1="100" y1="137" x2="100" y2="142" stroke="#5E2B1A" stroke-width="1.8" stroke-linecap="round"/>' +
          '</g>' +
        '</g>' +
      '</svg>';
  }

  /* ---- Pip the robot ---- */
  function robotSVG() {
    return '' +
      '<svg class="kido-char kc-robot" viewBox="0 0 200 240" role="img" aria-label="Pip the robot">' +
        '<g class="kc-body">' +
          // antenna
          '<rect x="97" y="26" width="6" height="26" rx="3" fill="#9FB3C8"/>' +
          '<circle cx="100" cy="22" r="9" fill="#FFB020"><animate attributeName="opacity" values="1;.5;1" dur="1.4s" repeatCount="indefinite"/></circle>' +
          // legs
          '<rect x="76" y="198" width="20" height="32" rx="8" fill="#3E8FCC"/>' +
          '<rect x="104" y="198" width="20" height="32" rx="8" fill="#3E8FCC"/>' +
          // torso
          '<rect x="60" y="150" width="80" height="66" rx="20" fill="#63C7FF"/>' +
          '<rect x="74" y="164" width="52" height="40" rx="12" fill="#EAF7FF"/>' +
          '<path d="M100 172 l7 12 -7 8 -7 -8 Z" fill="#FF6B8A"/>' +
          // arms
          '<rect class="kc-arm-l" x="42" y="150" width="18" height="44" rx="9" fill="#3E8FCC"/>' +
          '<rect class="kc-arm-r" x="140" y="150" width="18" height="44" rx="9" fill="#3E8FCC"/>' +
          // head
          '<g class="kc-head">' +
            '<rect x="54" y="58" width="92" height="80" rx="24" fill="#7ED0FF"/>' +
            '<rect x="66" y="72" width="68" height="54" rx="16" fill="#EAF7FF"/>' +
            faceSVG({ eye: "#2B6CB0", lid: "#EAF7FF", mouthStroke: "#2B6CB0" }) +
            '<circle cx="64" cy="128" r="7" fill="#FF6B8A" opacity=".7"/>' +
            '<circle cx="136" cy="128" r="7" fill="#FF6B8A" opacity=".7"/>' +
          '</g>' +
        '</g>' +
      '</svg>';
  }

  /* ---- Tiko the little bluebird (story character) ----
     Same rig as Momo: kc-body breathes, kc-arm-l/r are the wings (cheer/wave
     = flapping), kc-ear-l/r are the crest feathers, kc-tail wags, and the beak
     carries the mouth variants so every mood class works unchanged. */
  var birdCounter = 0;
  function birdSVG() {
    var u = "tiko" + (++birdCounter) + "_";
    function g(id, x1, y1, x2, y2, stops) {
      return '<linearGradient id="' + u + id + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '">' +
        stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join("") + "</linearGradient>";
    }
    return '' +
      '<svg class="kido-char kc-bird" viewBox="0 0 200 240" role="img" aria-label="Tiko the little bird">' +
        '<defs>' +
          '<radialGradient id="' + u + 'Head" cx="36%" cy="26%" r="72%"><stop offset="0" stop-color="#BDE6FF"/><stop offset=".35" stop-color="#6DBBF5"/><stop offset=".78" stop-color="#3B82D6"/><stop offset="1" stop-color="#27549E"/></radialGradient>' +
          '<radialGradient id="' + u + 'Belly" cx="45%" cy="28%" r="72%"><stop offset="0" stop-color="#FFF4E6"/><stop offset=".55" stop-color="#FFD9B0"/><stop offset="1" stop-color="#F2A96B"/></radialGradient>' +
          g("Wing", "0", "0", "1", "1", [[0, "#8FCBFF"], [.5, "#3F86D9"], [1, "#22498F"]]) +
          g("Beak", "0", "0", "0", "1", [[0, "#FFD36B"], [1, "#E8861A"]]) +
          g("Lid", "0", "0", "0", "1", [[0, "#7CC2F7"], [1, "#4A8FDC"]]) +
        '</defs>' +
        '<g class="kc-body">' +
          '<ellipse cx="100" cy="228" rx="42" ry="7" fill="#1E2F4A" opacity=".22"/>' +
          '<g class="kc-legs" fill="none" stroke="#E8861A" stroke-width="5" stroke-linecap="round">' +
            '<path d="M86 204 L84 226 M84 226 L74 230 M84 226 L86 232 M84 226 L94 230"/>' +
            '<path d="M114 204 L116 226 M116 226 L106 230 M116 226 L114 232 M116 226 L126 230"/>' +
          '</g>' +
          '<g class="kc-tail"><path d="M136 176 C160 170 178 178 186 196 C170 196 158 200 150 206 C160 194 150 188 136 190 Z" fill="url(#' + u + 'Wing)"/>' +
            '<path d="M142 182 C160 180 172 186 178 194" stroke="#BDE6FF" stroke-width="2" fill="none" opacity=".6"/></g>' +
          '<ellipse cx="100" cy="170" rx="54" ry="46" fill="url(#' + u + 'Head)"/>' +
          '<ellipse cx="100" cy="180" rx="36" ry="34" fill="url(#' + u + 'Belly)"/>' +
          '<g class="kc-arm-l"><path d="M52 150 C34 160 30 188 44 206 C52 196 60 182 62 162 Z" fill="url(#' + u + 'Wing)"/>' +
            '<path d="M46 170 C42 180 42 190 46 198 M52 164 C48 176 48 188 52 196" stroke="#BDE6FF" stroke-width="2" fill="none" opacity=".55"/></g>' +
          '<g class="kc-arm-r"><path d="M148 150 C166 160 170 188 156 206 C148 196 140 182 138 162 Z" fill="url(#' + u + 'Wing)"/>' +
            '<path d="M154 170 C158 180 158 190 154 198 M148 164 C152 176 152 188 148 196" stroke="#BDE6FF" stroke-width="2" fill="none" opacity=".55"/></g>' +
          '<g class="kc-head">' +
            '<g class="kc-ear-l"><path d="M92 50 C86 32 90 18 98 14 C96 28 100 40 104 50 Z" fill="url(#' + u + 'Wing)"/></g>' +
            '<g class="kc-ear-r"><path d="M104 50 C110 34 122 28 130 30 C120 38 116 46 114 54 Z" fill="url(#' + u + 'Wing)"/></g>' +
            '<circle cx="100" cy="100" r="56" fill="url(#' + u + 'Head)"/>' +
            '<ellipse cx="100" cy="122" rx="34" ry="26" fill="url(#' + u + 'Belly)" opacity=".9"/>' +
            '<ellipse cx="66" cy="120" rx="10" ry="7" fill="#FF7FA8" opacity=".45"/><ellipse cx="134" cy="120" rx="10" ry="7" fill="#FF7FA8" opacity=".45"/>' +
            '<rect class="kc-brow kc-brow-l" x="68" y="76" width="22" height="6" rx="3" fill="#1E3566"/>' +
            '<rect class="kc-brow kc-brow-r" x="110" y="76" width="22" height="6" rx="3" fill="#1E3566"/>' +
            '<ellipse class="kc-eye" cx="80" cy="98" rx="14" ry="16" fill="#FFFFFF"/>' +
            '<ellipse class="kc-eye" cx="120" cy="98" rx="14" ry="16" fill="#FFFFFF"/>' +
            '<g class="kc-pupil"><circle cx="80" cy="100" r="9.5" fill="#1B1840"/><circle cx="83.5" cy="96" r="3.4" fill="#fff"/></g>' +
            '<g class="kc-pupil"><circle cx="120" cy="100" r="9.5" fill="#1B1840"/><circle cx="123.5" cy="96" r="3.4" fill="#fff"/></g>' +
            '<rect class="kc-lid" x="64" y="80" width="32" height="36" rx="16" fill="url(#' + u + 'Lid)"/>' +
            '<rect class="kc-lid" x="104" y="80" width="32" height="36" rx="16" fill="url(#' + u + 'Lid)"/>' +
            // beak = mouth variants
            '<g class="kc-mouth m-smile"><path d="M88 116 L112 116 L100 132 Z" fill="url(#' + u + 'Beak)"/><path d="M92 121 Q100 126 108 121" stroke="#B85E10" stroke-width="1.6" fill="none"/></g>' +
            '<g class="kc-mouth m-open"><path d="M87 114 L113 114 L100 124 Z" fill="url(#' + u + 'Beak)"/><path d="M90 126 L110 126 L100 138 Z" fill="#E8861A"/><path d="M92 124 L108 124 L100 130 Z" fill="#FF5E82"/></g>' +
            '<g class="kc-mouth m-o"><path d="M88 113 L112 113 L100 123 Z" fill="url(#' + u + 'Beak)"/><path d="M92 127 L108 127 L100 137 Z" fill="#E8861A"/><ellipse cx="100" cy="125" rx="6" ry="3" fill="#7A2E10"/></g>' +
            '<g class="kc-mouth m-flat"><path d="M88 117 L112 117 L100 131 Z" fill="url(#' + u + 'Beak)"/></g>' +
            '<g class="kc-mouth m-frown"><path d="M89 118 L111 118 L100 134 Z" fill="url(#' + u + 'Beak)"/><path d="M93 126 Q100 122 107 126" stroke="#B85E10" stroke-width="1.6" fill="none"/></g>' +
          '</g>' +
        '</g>' +
      '</svg>';
  }

  var BUILDERS = { momo: foxSVG, fox: foxSVG, pip: robotSVG, robot: robotSVG, bird: birdSVG, tiko: birdSVG };

  function create(name, opts) {
    opts = opts || {};
    var build = BUILDERS[name] || foxSVG;
    var wrap = document.createElement("div");
    wrap.className = "actor kido-char-wrap" + (opts.className ? " " + opts.className : "");
    wrap.style.width = (opts.size || 200) + "px";
    wrap.style.height = ((opts.size || 200) * 1.2) + "px";
    wrap.innerHTML = build();
    var svg = wrap.querySelector("svg");
    // Desync blink between characters.
    var lids = svg.querySelectorAll(".kc-lid");
    var delay = (Math.random() * 4).toFixed(2) + "s";
    Array.prototype.forEach.call(lids, function (l) { l.style.animationDelay = delay; });

    var inst = {
      el: wrap,
      svg: svg,
      name: name,
      set: function (state) {
        STATES.forEach(function (s) { svg.classList.remove("is-" + s); });
        if (state && state !== "idle") svg.classList.add("is-" + state);
        return this;
      },
      pose: function (p) {
        POSES.forEach(function (c) { svg.classList.remove("pose-" + c); });
        if (p && p !== "idle") { void svg.offsetWidth; svg.classList.add("pose-" + p); }
        return this;
      },
      look: function (dx, dy) {
        svg.style.setProperty("--look-x", (dx || 0) + "px");
        svg.style.setProperty("--look-y", (dy || 0) + "px");
        return this;
      },
      /** React with an expression, then relax back to happy after a beat. */
      react: function (state, ms) {
        this.set(state);
        var self = this;
        var t = setTimeout(function () { self.set("happy"); }, ms || 1200);
        (Kido.Scene && Kido.Scene._track) && Kido.Scene._track(t);
        return this;
      }
    };
    return inst;
  }

  Kido.Characters = {
    create: create, STATES: STATES, POSES: POSES,
    /** Add a rig (js/art/storyCast.js): fn() returns one SVG that follows the kc-* class contract above. */
    register: function (name, fn) { BUILDERS[name] = fn; }
  };
})(window);
