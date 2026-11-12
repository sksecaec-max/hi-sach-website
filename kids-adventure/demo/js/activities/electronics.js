/* =========================================================================
   electronics.js — "Gadget Lab: Build a Computer"
   Two friendly, child-safe phases:
     1) Explore — tap each part to hear its name and what it does.
     2) Assemble — drag each part onto its outline to build the computer.
   Parts: Monitor, CPU, UPS (Power Supply), Keyboard, Mouse.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  Kido.activities = Kido.activities || {};
  var U = Kido.util;

  // Each part: what it is, a plain-language "what it does" line the narrator
  // speaks on tap, and where it snaps on the "desk" (percent coords).
  var PARTS = [
    { id: "monitor",  emoji: "🖥️", label: "Monitor",   says: "The monitor is the screen. It shows pictures, videos and games in bright colors.", x: 28, y: 6,  w: 43, h: 52 },
    { id: "cpu",      emoji: "🖥️", label: "CPU",       says: "The C-P-U is the computer's brain. Inside is the processor that does all the thinking and power!", x: 74, y: 8,  w: 22, h: 56 },
    { id: "ups",      emoji: "🔋", label: "UPS",       says: "The U-P-S is the power supply battery. If electricity goes out, it keeps the computer safely running!", x: 4,  y: 18, w: 21, h: 56 },
    { id: "keyboard", emoji: "⌨️", label: "Keyboard",  says: "The keyboard is full of keys. We press them to type words, numbers and letters.", x: 26, y: 64, w: 46, h: 26 },
    { id: "mouse",    emoji: "🖱️", label: "Mouse",     says: "The mouse fits in your hand. Move it and click to point at things on the screen.", x: 75, y: 68, w: 18, h: 24 },
    { id: "harddisk", emoji: "💽", label: "Hard Disk",  says: "The hard disk remembers all your files, drawings and games even when the computer is turned off.", x: 4, y: 6, w: 21, h: 26 }
  ];
  // the "label. says" lines, recorded by scripts/voice/harvest.js (else: the device voice)
  (Kido.voiceGen = Kido.voiceGen || []).push(function () { return PARTS.map(function (p) { return p.label + ". " + p.says; }); });

  /* Rich, realistic 3D vector art with tailored aspect ratios so equipment stays large and sharp */
  var ART = {
    monitor: {
      viewBox: "0 0 120 92",
      content:
        '<rect x="52" y="74" width="16" height="12" fill="#94A3B8"/>' +
        '<path d="M34 86 C34 82, 86 82, 86 86 L84 90 L36 90 Z" fill="#64748B"/>' +
        '<rect x="6" y="4" width="108" height="72" rx="7" fill="#1E293B"/>' +
        '<rect x="10" y="8" width="100" height="64" rx="4" fill="#0284C7"/>' +
        '<path d="M10 52 L38 32 L65 48 L88 26 L110 42 L110 72 L10 72 Z" fill="#312E81" opacity="0.6"/>' +
        '<circle cx="92" cy="22" r="7" fill="#FDE047"/>' +
        '<rect x="18" y="16" width="34" height="24" rx="2" fill="#0F172A" opacity="0.75"/>' +
        '<line x1="22" y1="22" x2="44" y2="22" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>' +
        '<line x1="22" y1="28" x2="48" y2="28" stroke="#A78BFA" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M10 8 L55 8 L22 72 L10 72 Z" fill="#FFFFFF" opacity="0.2"/>' +
        '<circle cx="60" cy="73.5" r="1.5" fill="#38BDF8"/>'
    },
    cpu: {
      viewBox: "0 0 60 110",
      content:
        '<rect x="4" y="4" width="52" height="102" rx="7" fill="#0F172A"/>' +
        '<rect x="7" y="7" width="46" height="96" rx="5" fill="#020617"/>' +
        '<!-- Glass RGB window -->' +
        '<rect x="8" y="12" width="30" height="72" rx="3" fill="#06B6D4" opacity="0.75"/>' +
        '<!-- Top Fan -->' +
        '<circle cx="23" cy="32" r="10" fill="none" stroke="#22D3EE" stroke-width="2.5"/>' +
        '<circle cx="23" cy="32" r="3" fill="#0891B2"/><circle cx="23" cy="32" r="1" fill="#FFFFFF"/>' +
        '<!-- Bottom Fan -->' +
        '<circle cx="23" cy="62" r="10" fill="none" stroke="#F43F5E" stroke-width="2.5"/>' +
        '<circle cx="23" cy="62" r="3" fill="#BE123C"/><circle cx="23" cy="62" r="1" fill="#FFFFFF"/>' +
        '<!-- Front controls -->' +
        '<circle cx="46" cy="20" r="4.5" fill="#1E293B" stroke="#38BDF8" stroke-width="1.4"/>' +
        '<circle cx="46" cy="20" r="1.8" fill="#38BDF8"/>' +
        '<rect x="44" y="30" width="4" height="2" rx="0.5" fill="#38BDF8"/>' +
        '<rect x="44" y="35" width="4" height="2" rx="0.5" fill="#38BDF8"/>' +
        '<line x1="43" y1="46" x2="49" y2="46" stroke="#475569" stroke-width="1.2"/>' +
        '<line x1="43" y1="50" x2="49" y2="50" stroke="#475569" stroke-width="1.2"/>' +
        '<line x1="43" y1="54" x2="49" y2="54" stroke="#475569" stroke-width="1.2"/>' +
        '<line x1="43" y1="58" x2="49" y2="58" stroke="#475569" stroke-width="1.2"/>' +
        '<!-- Bold CPU badge -->' +
        '<rect x="9" y="88" width="42" height="12" rx="3" fill="#1E293B"/>' +
        '<text x="30" y="97" font-family="sans-serif" font-size="8.5" font-weight="900" fill="#38BDF8" text-anchor="middle" letter-spacing="1">CPU</text>'
    },
    ups: {
      viewBox: "0 0 66 110",
      content:
        '<rect x="4" y="4" width="58" height="102" rx="7" fill="#1E293B"/>' +
        '<rect x="8" y="8" width="50" height="94" rx="5" fill="#0F172A"/>' +
        '<!-- Top Brand Badge -->' +
        '<rect x="12" y="12" width="42" height="14" rx="3" fill="#020617"/>' +
        '<text x="33" y="22.5" font-family="sans-serif" font-size="9" font-weight="900" fill="#22C55E" text-anchor="middle" letter-spacing="1">UPS</text>' +
        '<!-- LED Status screen -->' +
        '<rect x="12" y="30" width="42" height="22" rx="3" fill="#020617"/>' +
        '<circle cx="20" cy="38" r="3.5" fill="#22C55E"/>' +
        '<text x="20" y="48" font-family="sans-serif" font-size="6" font-weight="900" fill="#22C55E" text-anchor="middle">ON</text>' +
        '<circle cx="33" cy="38" r="3.5" fill="#F59E0B"/>' +
        '<text x="33" y="48" font-family="sans-serif" font-size="6" font-weight="900" fill="#F59E0B" text-anchor="middle">BAT</text>' +
        '<circle cx="46" cy="38" r="3.5" fill="#EF4444" opacity="0.3"/>' +
        '<text x="46" y="48" font-family="sans-serif" font-size="6" font-weight="900" fill="#64748B" text-anchor="middle">ERR</text>' +
        '<!-- Main Power Switch -->' +
        '<circle cx="33" cy="62" r="7.5" fill="#1E293B" stroke="#22C55E" stroke-width="2"/>' +
        '<path d="M33 58 L33 62" stroke="#22C55E" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M30 59 A3.5 3.5 0 1 0 36 59" fill="none" stroke="#22C55E" stroke-width="1.8"/>' +
        '<!-- Battery Level Gauge -->' +
        '<rect x="12" y="74" width="42" height="8" rx="2" fill="#020617"/>' +
        '<rect x="14" y="76" width="11" height="4" rx="1" fill="#22C55E"/>' +
        '<rect x="27" y="76" width="11" height="4" rx="1" fill="#22C55E"/>' +
        '<rect x="40" y="76" width="11" height="4" rx="1" fill="#22C55E"/>' +
        '<text x="33" y="88" font-family="sans-serif" font-size="5" font-weight="800" fill="#94A3B8" text-anchor="middle">POWER BACKUP</text>' +
        '<!-- Air vents -->' +
        '<line x1="16" y1="94" x2="50" y2="94" stroke="#334155" stroke-width="1.5" stroke-linecap="round"/>' +
        '<line x1="16" y1="98" x2="50" y2="98" stroke="#334155" stroke-width="1.5" stroke-linecap="round"/>'
    },
    keyboard: {
      viewBox: "0 0 160 64",
      content:
        '<rect x="4" y="4" width="152" height="56" rx="6" fill="#334155"/>' +
        '<rect x="7" y="7" width="146" height="50" rx="4" fill="#0F172A"/>' +
        '<g fill="#E2E8F0">' +
          '<rect x="12" y="11" width="10" height="8" rx="1.5"/><rect x="25" y="11" width="10" height="8" rx="1.5"/><rect x="38" y="11" width="10" height="8" rx="1.5"/><rect x="51" y="11" width="10" height="8" rx="1.5"/><rect x="64" y="11" width="10" height="8" rx="1.5"/><rect x="77" y="11" width="10" height="8" rx="1.5"/><rect x="90" y="11" width="10" height="8" rx="1.5"/><rect x="103" y="11" width="10" height="8" rx="1.5"/><rect x="116" y="11" width="10" height="8" rx="1.5"/><rect x="129" y="11" width="18" height="8" rx="1.5" fill="#38BDF8"/>' +
          '<rect x="12" y="22" width="14" height="8" rx="1.5" fill="#94A3B8"/><rect x="29" y="22" width="10" height="8" rx="1.5"/><rect x="42" y="22" width="10" height="8" rx="1.5"/><rect x="55" y="22" width="10" height="8" rx="1.5"/><rect x="68" y="22" width="10" height="8" rx="1.5"/><rect x="81" y="22" width="10" height="8" rx="1.5"/><rect x="94" y="22" width="10" height="8" rx="1.5"/><rect x="107" y="22" width="10" height="8" rx="1.5"/><rect x="120" y="22" width="10" height="8" rx="1.5"/><rect x="133" y="22" width="14" height="8" rx="1.5" fill="#94A3B8"/>' +
          '<rect x="12" y="33" width="18" height="8" rx="1.5" fill="#94A3B8"/><rect x="33" y="33" width="10" height="8" rx="1.5"/><rect x="46" y="33" width="10" height="8" rx="1.5"/><rect x="59" y="33" width="10" height="8" rx="1.5"/><rect x="72" y="33" width="10" height="8" rx="1.5"/><rect x="85" y="33" width="10" height="8" rx="1.5"/><rect x="98" y="33" width="10" height="8" rx="1.5"/><rect x="111" y="33" width="10" height="8" rx="1.5"/><rect x="124" y="33" width="23" height="8" rx="1.5" fill="#0284C7"/>' +
          '<rect x="12" y="44" width="16" height="8" rx="1.5" fill="#94A3B8"/><rect x="31" y="44" width="12" height="8" rx="1.5"/><rect x="46" y="44" width="60" height="8" rx="2" fill="#38BDF8"/><rect x="109" y="44" width="12" height="8" rx="1.5"/><rect x="124" y="44" width="23" height="8" rx="1.5" fill="#94A3B8"/>' +
        '</g>'
    },
    mouse: {
      viewBox: "0 0 70 96",
      content:
        '<ellipse cx="35" cy="88" rx="28" ry="7" fill="#0F172A" opacity="0.3"/>' +
        '<path d="M35 12 C18 12, 12 28, 12 52 C12 76, 18 88, 35 88 C52 88, 58 76, 58 52 C58 28, 52 12, 35 12 Z" fill="#1E293B"/>' +
        '<path d="M35 12 L35 40" stroke="#0F172A" stroke-width="2.5"/>' +
        '<path d="M13 40 C22 44, 48 44, 57 40" stroke="#0F172A" stroke-width="2"/>' +
        '<rect x="31" y="20" width="8" height="14" rx="3" fill="#64748B"/>' +
        '<rect x="33" y="22" width="4" height="6" rx="1.5" fill="#38BDF8"/>' +
        '<path d="M24 66 C30 70, 40 70, 46 66" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>'
    },
    harddisk: {
      viewBox: "0 0 110 74",
      content:
        '<rect x="5" y="5" width="100" height="64" rx="8" fill="#7E8794"/>' +
        '<rect x="10" y="10" width="90" height="54" rx="5" fill="#AEB6C2"/>' +
        '<circle cx="48" cy="37" r="22" fill="#565E69"/>' +
        '<circle cx="48" cy="37" r="8" fill="#C6CCD6"/>' +
        '<circle cx="48" cy="37" r="3" fill="#7E8794"/>' +
        '<path d="M90 20 L56 34 q-3 2 -1 5 q2 3 5 1 L94 26 Z" fill="#C6CCD6"/>' +
        '<circle cx="90" cy="22" r="4.5" fill="#8A929E"/>' +
        '<rect x="75" y="50" width="20" height="8" rx="2" fill="#334155"/>'
    }
  };
  // Backward compatibility alias for tower -> cpu
  ART.tower = ART.cpu;

  function partSVG(id, px) {
    var art = ART[id]; if (!art) return null;
    var vb = art.viewBox || "0 0 120 120";
    var content = art.content || art;
    var dim = px ? 'width="' + px + '" height="' + px + '"' : 'width="100%" height="100%"';
    return '<svg class="gadget-svg gadget-svg--' + id + '" viewBox="' + vb + '" ' + dim +
      ' preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + content + '</svg>';
  }
  function partGlyph(p, px) { return partSVG(p.id, px) || p.emoji; }

  Kido.activities.electronics = function (spec) {
    var cfg = Kido.age.cfg();
    // Always include at least the 5 essential parts (Monitor, CPU, UPS, Keyboard, Mouse)
    var count = cfg.difficulty <= 3 ? 5 : 6;
    var parts = PARTS.slice(0, count);
    var explored = {};

    // Dynamic desk coordinate adjustment when harddisk is included
    if (count > 5) {
      var upsObj = parts.find(function (p) { return p.id === "ups"; });
      if (upsObj) { upsObj.y = 38; upsObj.h = 52; }
    } else {
      var upsObj = parts.find(function (p) { return p.id === "ups"; });
      if (upsObj) { upsObj.y = 18; upsObj.h = 56; }
    }

    var m = document.getElementById("screen");
    m.innerHTML = "";
    intro();

    /* ---- Phase 1: explore ---- */
    function intro() {
      var wrap = U.el("div", { class: "game" });
      wrap.appendChild(U.el("div", { class: "game__head" }, [
        U.el("div", { class: "game__prompt", html: "Let's explore! 💻" }),
        U.el("div", { class: "game__hint", text: "Tap each part to learn what it does." })
      ]));
      var stage = U.el("div", { class: "stage" });
      var board = U.el("div", { class: "board board--gadget" });
      parts.forEach(function (p) {
        var tile = U.el("button", { class: "board-tile board-tile--gadget", "aria-label": p.label }, [
          U.el("div", { class: "board-tile__emoji", html: partGlyph(p, 92) }),
          U.el("div", { class: "board-tile__name", text: p.label })
        ]);
        tile.addEventListener("click", function () {
          var f = tile.querySelector(".board-tile__emoji");
          f.classList.remove("anim-jump"); void f.offsetWidth; f.classList.add("anim-jump");
          Kido.audio.playTapSound();
          Kido.mascot.say(p.label + ". " + p.says);
          explored[p.id] = true;
          if (Object.keys(explored).length >= parts.length) { go.disabled = false; go.style.opacity = "1"; }
        });
        board.appendChild(tile);
      });
      stage.appendChild(board);
      var go = U.el("button", { class: "btn btn--block", text: "Build the computer! 🔧", disabled: "true" });
      go.style.opacity = ".5";
      go.addEventListener("click", build);
      stage.appendChild(go);
      wrap.appendChild(stage);
      m.appendChild(wrap);
      Kido.mascot.say("Tap each part to explore it!");
    }

    /* ---- Phase 2: assemble ---- */
    function build() {
      m.innerHTML = "";
      var placed = 0, mistakes = 0;
      var byId = {}; parts.forEach(function (p) { byId[p.id] = p; });
      var tap = Kido.engine.tapPlacement(doPlace);   // tap / keyboard / switch drop path
      var wrap = U.el("div", { class: "game" });
      wrap.appendChild(U.el("div", { class: "game__head" }, [
        U.el("div", { class: "game__prompt", html: "Build the computer!" }),
        U.el("div", { class: "game__hint", text: "Drag or tap each part onto its outline on the desk." })
      ]));
      var stage = U.el("div", { class: "stage" });
      var asm = U.el("div", { class: "assembly assembly--electronics" });
      var frame = U.el("div", { class: "assembly__frame assembly__frame--desk" });
      frame.appendChild(U.el("div", { class: "assembly__base", text: "⚡ Computer Workstation" }));

      // Outlines (drop targets) — spacious, clearly labelled
      parts.forEach(function (p) {
        var slot = U.el("div", { class: "build-slot build-slot--gadget", "data-id": p.id, text: p.label,
          role: "button", tabindex: "0", "aria-label": "Place the " + p.label });
        slot.style.left = p.x + "%"; slot.style.top = p.y + "%"; slot.style.width = p.w + "%"; slot.style.height = p.h + "%";
        tap.slot(slot);
        frame.appendChild(slot);
      });

      // Parts in pool — large, comfortable to see and drag
      var pool = U.el("div", { class: "match__pool match__pool--gadget" });
      U.shuffle(parts).forEach(function (p) {
        var chip = U.el("div", { class: "chip chip--gadget", "data-id": p.id, role: "button", tabindex: "0",
          "aria-pressed": "false", "aria-label": p.label }, [
          U.el("div", { class: "chip__art", html: partSVG(p.id) }),
          U.el("small", { text: p.label })
        ]);
        Kido.engine.makeDraggable(chip, { onDrop: function (target) { return doPlace(chip, target && target.closest(".build-slot")); } });
        tap.chip(chip);
        pool.appendChild(chip);
      });

      asm.appendChild(frame); asm.appendChild(pool);
      stage.appendChild(asm); wrap.appendChild(stage); m.appendChild(wrap);
      Kido.mascot.say("Drag or tap each equipment to build your computer!");

      // Single placement path shared by pointer-drag, tap and keyboard.
      function doPlace(chip, slot) {
        if (!chip || !slot) return false;
        var p = byId[chip.getAttribute("data-id")];
        if (slot.getAttribute("data-id") === chip.getAttribute("data-id") && !slot.classList.contains("filled")) {
          slot.classList.add("filled");
          slot.innerHTML = partSVG(p.id) || p.emoji;
          chip.remove(); placed++;
          Kido.audio.playCorrectSound(); Kido.fx.sparkleEl(slot); Kido.mascot.say(p.label + ". " + p.says);
          if (placed === parts.length) {
            frame.classList.add("house-built-celebrate");
            Kido.fx.toast("Computer built! It works! 🎉", "ok");
            Kido.mascot.say("You built the computer! Amazing job!");
            setTimeout(function () { Kido.engine.finish(spec, Math.max(1, parts.length - mistakes), parts.length); }, 1500);
          }
          return true;
        }
        mistakes++; Kido.audio.playIncorrectSound(); Kido.fx.shake(slot || chip);
        return false;
      }
    }
  };
})(window);
