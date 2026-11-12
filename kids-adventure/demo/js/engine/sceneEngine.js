/* =========================================================================
   sceneEngine.js — Reusable immersive Scene Engine
   NOT a pile of static screens: one engine that scenes plug into. It builds a
   virtual 1000×640 "stage" scaled to fit any device, stacks parallax layers
   inside a movable camera, and hands each scene a rich API — place/tween
   (Web Animations), rigged characters, canvas particles, camera zoom/pan/
   shake, pointer drag-drop, a spoken instruction bubble, progress pips and a
   reward-aware finish. Everything (rAF, timers, music, listeners, DOM) is torn
   down on exit so scenes never leak.

     Kido.Scene.register("brush-teeth", { music:"morning", bg:"bg-bath", build:fn });
     Kido.Scene.run("brush-teeth", spec);   // spec carries activityId/categoryId
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;

  var STAGE_W = 1000, STAGE_H = 640;
  var scenes = {};
  var live = null;          // active scene runtime (null when nothing mounted)

  function reduced() { return document.documentElement.classList.contains("reduce-motion"); }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ------------------------------------------------------------------ */
  /*  Mount + fit-to-screen                                              */
  /* ------------------------------------------------------------------ */
  function buildDom(def) {
    var root = U.el("div", { class: "scene-root" + (def.responsive ? " scene-root--responsive" : ""), role: "dialog", "aria-modal": "true",
      "aria-label": def.title || "Learning activity", tabindex: "-1" });
    var stage = U.el("div", { class: "scene-stage " + (def.bg || "bg-morning") });
    var camera = U.el("div", { class: "scene-camera" });

    var layers = {};
    ["sky", "mid", "ground", "props", "actors"].forEach(function (n) {
      layers[n] = U.el("div", { class: "scene-layer scene-layer--" + n });
      camera.appendChild(layers[n]);
    });
    var canvas = U.el("canvas", { class: "scene-canvas", width: STAGE_W, height: STAGE_H });
    camera.appendChild(canvas);

    var fore = U.el("div", { class: "scene-layer scene-layer--fore" });
    layers.fore = fore;
    camera.appendChild(fore);

    var ui = U.el("div", { class: "scene-layer scene-layer--ui" });
    layers.ui = ui;

    // Layered Depth & Living Ambient Environment Decor
    injectEnvironmentDecor(def.bg || "bg-morning", layers);

    stage.appendChild(camera);
    stage.appendChild(ui);
    root.appendChild(stage);
    if (def.responsive) root.appendChild(ui);
    (document.getElementById("app") || document.body).appendChild(root);
    return { root: root, stage: stage, camera: camera, canvas: canvas, layers: layers };
  }

  function injectEnvironmentDecor(bg, layers) {
    if (!bg) return;
    if (bg.indexOf("bg-jungle") !== -1) {
      layers.sky.appendChild(U.el("div", { class: "env-sunbeam", style: "left:120px;" }));
      layers.sky.appendChild(U.el("div", { class: "env-sunbeam env-sunbeam--2" }));
      layers.sky.appendChild(U.el("div", { class: "env-sunbeam env-sunbeam--3" }));
      var foreSvgLeft = '<svg viewBox="0 0 160 180" class="env-vine-fore env-vine-fore--left"><path d="M10,0 Q30,60 15,110 Q5,150 18,175" fill="none" stroke="#2D6A4F" stroke-width="4" stroke-linecap="round"/><path d="M15,50 Q45,40 60,65 Q35,75 15,50 Z" fill="#52B788"/><path d="M16,90 Q50,85 65,110 Q40,118 16,90 Z" fill="#40916C"/><path d="M12,130 Q35,130 45,150 Q28,155 12,130 Z" fill="#74C69D"/></svg>';
      var foreSvgRight = '<svg viewBox="0 0 160 180" class="env-vine-fore env-vine-fore--right"><path d="M150,0 Q130,55 145,105 Q155,145 142,175" fill="none" stroke="#2D6A4F" stroke-width="4" stroke-linecap="round"/><path d="M145,45 Q115,35 100,60 Q125,70 145,45 Z" fill="#52B788"/><path d="M144,85 Q110,80 95,105 Q120,115 144,85 Z" fill="#40916C"/></svg>';
      layers.fore.appendChild(U.el("div", { html: foreSvgLeft }));
      layers.fore.appendChild(U.el("div", { html: foreSvgRight }));
    } else if (bg.indexOf("bg-ocean") !== -1) {
      layers.sky.appendChild(U.el("div", { class: "env-sunbeam", style: "left:140px;background:linear-gradient(180deg,rgba(144,224,239,.5) 0%,transparent 100%);" }));
      layers.sky.appendChild(U.el("div", { class: "env-sunbeam env-sunbeam--2", style: "background:linear-gradient(180deg,rgba(144,224,239,.4) 0%,transparent 100%);" }));
      layers.sky.appendChild(U.el("div", { class: "env-sunbeam env-sunbeam--3", style: "background:linear-gradient(180deg,rgba(144,224,239,.35) 0%,transparent 100%);" }));
      [
        { l: 120, t: 380, s: 18, d: "0s" },
        { l: 260, t: 440, s: 14, d: "1.4s" },
        { l: 520, t: 360, s: 22, d: "0.7s" },
        { l: 740, t: 420, s: 16, d: "2.1s" },
        { l: 880, t: 460, s: 20, d: "1.0s" }
      ].forEach(function (b) {
        layers.mid.appendChild(U.el("div", {
          class: "env-bubble",
          style: "left:" + b.l + "px;top:" + b.t + "px;width:" + b.s + "px;height:" + b.s + "px;animation-delay:" + b.d + ";"
        }));
      });
    } else if (bg.indexOf("bg-space") !== -1) {
      [
        { l: 90, t: 80, s: 3, d: "0s" },
        { l: 210, t: 140, s: 2, d: "1.2s" },
        { l: 380, t: 60, s: 4, d: "0.5s" },
        { l: 520, t: 180, s: 2.5, d: "1.8s" },
        { l: 710, t: 90, s: 3.5, d: "0.8s" },
        { l: 840, t: 150, s: 2, d: "2.4s" },
        { l: 920, t: 70, s: 4, d: "1.5s" }
      ].forEach(function (st) {
        layers.sky.appendChild(U.el("div", {
          class: "env-star",
          style: "left:" + st.l + "px;top:" + st.t + "px;width:" + st.s + "px;height:" + st.s + "px;animation-delay:" + st.d + ";"
        }));
      });
    }
  }

  function fit(dom) {
    if (dom.root.classList.contains("scene-root--responsive")) return;
    // Change #28: fit inside the root's padding = the system-bar safe area (css/scene.css), so the stage's
    // controls never sit under the Android status bar; the backdrop still runs under the bars.
    var cs = getComputedStyle(dom.root);
    var w = dom.root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var h = dom.root.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var s = Math.min(w / STAGE_W, h / STAGE_H);
    dom.stage.style.setProperty("--scene-scale", s || 1);
    // The stage's ground strip continues to both screen edges behind the stage (.scene-root::after).
    var strip = dom.stage.querySelector(".ground-strip");
    if (strip) {
      dom.root.style.setProperty("--scene-ground", getComputedStyle(strip).backgroundImage);
      dom.root.style.setProperty("--scene-ground-top", (strip.getBoundingClientRect().top - dom.root.getBoundingClientRect().top) + "px");
    } else {
      dom.root.style.removeProperty("--scene-ground");
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public: register / run / teardown                                  */
  /* ------------------------------------------------------------------ */
  var Scene = Kido.Scene = {
    STAGE_W: STAGE_W, STAGE_H: STAGE_H,
    register: function (id, def) { scenes[id] = def; },
    has: function (id) { return !!scenes[id]; },

    run: function (id, spec) {
      var def = scenes[id];
      if (!def) { Kido.fx && Kido.fx.toast && Kido.fx.toast("Scene coming soon!"); return; }
      this.teardown();                             // never stack scenes

      var dom = buildDom(def);
      var rt = live = {
        dom: dom, def: def, spec: spec || {},
        anims: [], timers: [], intervals: [], rafs: [], listeners: [],
        particles: Kido.Particles.attach(dom.canvas),
        cam: { s: 1, x: 0, y: 0 },
        done: false,
        outside: [],
        prevFocus: document.activeElement    // restore focus here on teardown
      };
      Array.prototype.forEach.call(dom.root.parentNode.children, function (el) {
        if (el !== dom.root) { rt.outside.push([el, el.inert]); el.inert = true; }
      });

      // language for narration follows the spec (Hindi activities set lang:"hi")
      if (Kido.Voice) Kido.Voice.setLang(spec && spec.lang === "hi" ? "hi" : "en");

      var api = makeApi(rt);

      // Change #28: the scene's backdrop is painted once across the whole app viewport (edge to edge, under
      // the system bars) by .scene-root::before; the fixed-ratio stage above it is transparent, so there is
      // no letterbox and no seam between the stage and the sides.
      var fill = getComputedStyle(dom.stage).backgroundImage;
      if (fill && fill !== "none" && !def.responsive) {
        dom.root.style.setProperty("--scene-fill", fill);
        dom.stage.style.setProperty("background", "transparent", "important");
      }

      // Fit now + keep fitting on resize/rotate.
      fit(dom);
      var onResize = function () { fit(dom); };
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
      rt.listeners.push([window, "resize", onResize], [window, "orientationchange", onResize]);

      // Standard chrome: close button + progress holder.
      var close = U.el("button", { class: "scene-close", "aria-label": "Close", html: "✕" });
      close.addEventListener("click", function () { Kido.audio.playTapSound(); Kido.nav.back(); });
      dom.layers.ui.appendChild(close);
      // Change #28: the shared music + Momo switches, beside Close (same handlers as the topbar's).
      dom.layers.ui.appendChild(U.el("div", { class: "scene-ctl" }, [
        U.el("button", { class: "scene-ctl__btn js-music-toggle", type: "button" }),
        U.el("button", { class: "scene-ctl__btn js-momo-toggle", type: "button" })
      ]));
      if (Kido.Music && Kido.Music.refreshButton) Kido.Music.refreshButton();
      if (Kido.mascot && Kido.mascot.refreshButton) Kido.mascot.refreshButton();
      rt.progressEl = U.el("div", { class: "scene-progress" });
      dom.layers.ui.appendChild(rt.progressEl);
      rt.sayEl = U.el("div", { class: "scene-say", role: "status", "aria-live": "polite" });
      dom.layers.ui.appendChild(rt.sayEl);
      // tap the line to hear it again (little kids see only its picture and a speaker: html.is-little)
      rt.sayEl.addEventListener("click", function () {
        Kido.audio.unlock();
        if (rt.lastLine && Kido.Voice) Kido.Voice.speakInstruction(rt.lastLine.text, rt.lastLine.id);
      });
      if (def.responsive) {
        var replay = U.el("button", { class: "lesson-replay", type: "button", "aria-label": "Hear the instruction again", text: "Hear again" });
        replay.addEventListener("click", function () {
          Kido.audio.unlock();
          if (rt.lastLine && Kido.Voice) Kido.Voice.speakInstruction(rt.lastLine.text, rt.lastLine.id);
        });
        dom.layers.ui.appendChild(replay);
      }

      if (Kido.Music && def.music) Kido.Music.play(def.music);

      try { def.build(api); }
      catch (e) { console.error("Scene build failed:", id, e); }
      fit(dom);   // again: the scene's own ground strip exists only now
      // Move focus into the scene so keyboard / switch / screen-reader users land
      // inside the activity (and hear the dialog label) instead of being stranded
      // on the tile that launched it. Touch/mouse users never see a ring
      // (:focus-visible), so this is invisible on the common path.
      try { dom.root.focus({ preventScroll: true }); } catch (e2) { try { dom.root.focus(); } catch (e3) {} }
      return api;
    },

    /** Idempotent: safe to call on any navigation transition. */
    teardown: function () {
      var rt = live; if (!rt) return;
      // Only a scene that is actually running is silenced (this runs on every
      // navigation — it used to kill the music the next activity had just started).
      if (Kido.Music) { if (Kido.Music.release) Kido.Music.release(); else Kido.Music.stop(); }
      if (Kido.Voice) Kido.Voice.stop();
      live = null;
      rt.done = true;
      rt.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      rt.timers.forEach(function (t) { clearTimeout(t); });
      rt.intervals.forEach(function (t) { clearInterval(t); });
      rt.rafs.forEach(function (r) { cancelAnimationFrame(r); });
      rt.listeners.forEach(function (l) { try { l[0].removeEventListener(l[1], l[2]); } catch (e) {} });
      rt.outside.forEach(function (entry) { entry[0].inert = entry[1]; });
      if (rt.particles) rt.particles.stop();
      if (rt.dom && rt.dom.root && rt.dom.root.parentNode) rt.dom.root.parentNode.removeChild(rt.dom.root);
      // Return focus to whatever launched the scene so keyboard users aren't
      // dumped at the top of the document when the overlay closes.
      if (rt.prevFocus && rt.prevFocus.focus && document.contains(rt.prevFocus)) {
        try { rt.prevFocus.focus({ preventScroll: true }); } catch (e) {}
      }
    },

    /** Let characters/other engines register a timeout for cleanup. */
    _track: function (t) { if (live) live.timers.push(t); return t; }
  };
  /* ------------------------------------------------------------------ */
  /*  Per-scene API                                                      */
  /* ------------------------------------------------------------------ */
  function makeApi(rt) {
    var dom = rt.dom, spec = rt.spec;

    function applyFinal(el, frames) {
      var f = Array.isArray(frames) ? frames[frames.length - 1] : frames;
      if (!f) return;
      ["transform", "opacity", "left", "top", "width", "height", "background", "filter"].forEach(function (k) {
        if (f[k] != null) el.style[k] = f[k];
      });
    }

    function tween(el, frames, opts) {
      opts = opts || {};
      if (!el || rt.done) return Promise.resolve(el);
      if (reduced()) { applyFinal(el, frames); return Promise.resolve(el); }
      var anim = el.animate(frames, {
        duration: opts.duration != null ? opts.duration : 420,
        easing: opts.easing || "cubic-bezier(.34,1.56,.64,1)",
        delay: opts.delay || 0,
        iterations: opts.iterations || 1,
        direction: opts.direction || "normal",
        fill: opts.fill || "both"
      });
      rt.anims.push(anim);
      return anim.finished.then(function () { return el; }, function () { return el; });
    }

    function wait(ms) {
      return new Promise(function (res) {
        var t = setTimeout(res, reduced() ? Math.min(ms, 120) : ms);
        rt.timers.push(t);
      });
    }
    function loopEvery(ms, fn) { var id = setInterval(fn, ms); rt.intervals.push(id); return id; }
    function onFrame(fn) {
      var id; var run = function () { if (rt.done) return; fn(); id = requestAnimationFrame(run); rt.rafs.push(id); };
      id = requestAnimationFrame(run); rt.rafs.push(id); return function () { cancelAnimationFrame(id); };
    }

    /* ---- placement in stage coordinates ---- */
    function place(el, x, y, opts) {
      opts = opts || {};
      var layer = dom.layers[opts.layer || "actors"] || dom.layers.actors;
      el.style.left = x + "px";
      el.style.top = y + "px";
      if (opts.w != null) el.style.width = opts.w + "px";
      if (opts.h != null) el.style.height = opts.h + "px";
      if (opts.size != null) el.style.fontSize = opts.size + "px";
      if (opts.z != null) el.style.zIndex = opts.z;
      // center-anchor unless told otherwise
      var base = "translate(" + (opts.anchor === "topleft" ? "0,0" : "-50%,-50%") + ")";
      el.style.transform = base;
      el.dataset.baseTransform = base;
      if (el.parentNode !== layer) layer.appendChild(el);
      return el;
    }

    function emoji(char, x, y, opts) {
      opts = opts || {};
      var e = U.el("div", { class: "actor actor--emoji" + (opts.className ? " " + opts.className : ""), html: char });
      if (opts.size) e.style.fontSize = opts.size + "px";
      place(e, x, y, opts);
      return e;
    }

    // Place registry creature art (original SVG). Falls back to an emoji actor
    // when the species has no authored art, so callers stay honest + unchanged.
    function creature(key, x, y, opts) {
      opts = opts || {};
      var reg = Kido.creatures;
      if (reg && reg.hasArt(key)) {
        var size = opts.size || 120;
        var e = U.el("div", {
          class: "actor actor--creature" + (opts.className ? " " + opts.className : ""),
          html: reg.render(key, { state: opts.state, silhouette: opts.silhouette })
        });
        var po = {}; for (var k in opts) if (opts.hasOwnProperty(k)) po[k] = opts[k];
        po.w = opts.w != null ? opts.w : size;
        po.h = opts.h != null ? opts.h : size;
        po.size = null;                       // size means box here, not font-size
        place(e, x, y, po);
        return e;
      }
      return emoji((reg && reg.emoji(key)) || opts.emoji || "❓", x, y, opts);
    }

    function char(name, x, y, opts) {
      opts = opts || {};
      var c = Kido.Characters.create(name, { size: opts.size || 180, className: opts.className });
      place(c.el, x, y, opts);
      return c;
    }
    /* ---- camera (subtle: zoom to a spot, pan, light shake) ---- */
    function camFocus(x, y, scale, dur) {
      dom.camera.style.transformOrigin = x + "px " + y + "px";
      return tween(dom.camera, [{ transform: "scale(" + scale + ")" }],
        { duration: dur || 700, easing: "cubic-bezier(.4,0,.2,1)" });
    }
    function camReset(dur) {
      return tween(dom.camera, [{ transform: "scale(1)" }],
        { duration: dur || 600, easing: "cubic-bezier(.4,0,.2,1)" }).then(function () {
          dom.camera.style.transformOrigin = "50% 55%";
        });
    }
    function camShake(power, dur) {
      if (reduced()) return Promise.resolve();
      power = power || 9;
      var kf = [{ transform: "translate(0,0)" }];
      for (var i = 0; i < 5; i++) kf.push({ transform: "translate(" + rnd(-power, power) + "px," + rnd(-power, power) + "px)" });
      kf.push({ transform: "translate(0,0)" });
      var a = dom.camera.animate(kf, { duration: dur || 360, easing: "ease-out" });
      rt.anims.push(a);
      return a.finished.catch(function () {});
    }

    /* ---- interaction ---- */
    function tap(el, fn, opts) {
      opts = opts || {};
      el.classList.add("actor--tappable");
      // Keyboard + assistive-tech access: a tappable actor is a real control,
      // not decoration. Give it button semantics + focusability + Enter/Space,
      // matching gameEngine's tapPlacement convention, so every scene game is
      // operable without a pointer (switch-access, keyboard, screen reader) —
      // not just by touch. `opts.label` gives an accessible name to art that
      // has no readable text of its own (an emoji/creature actor).
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if (opts.label && !el.hasAttribute("aria-label")) el.setAttribute("aria-label", opts.label);
      var fire = function (e) { if (rt.done || rt._finished || el.disabled || el.getAttribute("aria-disabled") === "true") return; if (e && e.preventDefault) e.preventDefault(); Kido.audio.unlock(); fn(e); };
      var key = function (e) {
        if (el.tagName !== "BUTTON" && (e.key === "Enter" || e.key === " " || e.key === "Spacebar")) { e.preventDefault(); if (!e.repeat) fire(e); }
      };
      el.addEventListener("click", fire);
      el.addEventListener("keydown", key);
      rt.listeners.push([el, "click", fire], [el, "keydown", key]);
      return el;
    }
    function hint(el) { el.classList.add("tap-ring"); return el; }
    function clearHint(el) { el.classList.remove("tap-ring"); return el; }

    // Register + track a raw listener (auto-removed on teardown).
    function on(el, type, fn) { el.addEventListener(type, fn); rt.listeners.push([el, type, fn]); return el; }

    // Convert a pointer's screen coordinates into 1000×640 stage coordinates.
    function toStage(clientX, clientY) {
      var r = dom.stage.getBoundingClientRect();
      var s = (r.width / STAGE_W) || 1;
      return [(clientX - r.left) / s, (clientY - r.top) / s];
    }

    // Pointer drag with a ghost; drops hit-test `.scene-slot`.
    function makeDrag(chip, opts) {
      opts = opts || {};
      var ghost = null, hot = null;
      var down = function (e) {
        e.preventDefault(); Kido.audio.unlock();
        chip.classList.add("dragging");
        ghost = chip.cloneNode(true);
        ghost.className = "drag-ghost"; ghost.innerHTML = chip.innerHTML;
        document.body.appendChild(ghost); moveGhost(e.clientX, e.clientY);
        chip.setPointerCapture(e.pointerId);
        chip.addEventListener("pointermove", move);
        chip.addEventListener("pointerup", up);
        chip.addEventListener("pointercancel", up);
      };
      function moveGhost(x, y) { if (ghost) { ghost.style.left = x + "px"; ghost.style.top = y + "px"; } }
      function under(x, y) {
        if (ghost) ghost.style.display = "none";
        var el = document.elementFromPoint(x, y);
        if (ghost) ghost.style.display = "";
        return el;
      }
      function move(e) {
        moveGhost(e.clientX, e.clientY);
        var t = under(e.clientX, e.clientY);
        var slot = t && t.closest(".scene-slot");
        if (slot !== hot) { if (hot) hot.classList.remove("hot"); hot = slot; if (hot) hot.classList.add("hot"); }
      }
      function up(e) {
        var t = under(e.clientX, e.clientY);
        var slot = t && t.closest(".scene-slot");
        chip.classList.remove("dragging");
        if (hot) hot.classList.remove("hot");
        var ok = opts.onDrop ? opts.onDrop(slot, chip) : false;
        cleanup();
        void ok;
      }
      function cleanup() {
        if (ghost) { ghost.remove(); ghost = null; } hot = null;
        chip.removeEventListener("pointermove", move);
        chip.removeEventListener("pointerup", up);
        chip.removeEventListener("pointercancel", up);
      }
      chip.addEventListener("pointerdown", down);
      rt.listeners.push([chip, "pointerdown", down]);
      return chip;
    }

    /* ---- spoken instruction bubble ---- */
    function say(text, opts) {
      opts = opts || {};
      if (rt.done) return rt.sayEl;
      rt.lastLine = { text: text, id: opts.id };
      rt.sayEl.innerHTML = (opts.peek ? '<span class="scene-say__peek">' + opts.peek + '</span>' : "") +
        '<span>' + text + '</span>';
      rt.sayEl.classList.add("show");
      if (!opts.silent && Kido.Voice && opts.parts) {
        // a line glued from parts ("B is for Ball!" + "Find the Apple.") is spoken part by part, so each part can be
        // a recorded clip (as mascot.js does); later parts stop once anything else is said or the scene ends
        var mine = rt.lastLine, gen0 = Kido.Voice.generation();
        opts.parts.reduce(function (p, part) {
          return p.then(function () {
            if (rt.done || rt.lastLine !== mine || Kido.Voice.generation() !== gen0) return;
            return Kido.Voice.speakInstruction(part);
          });
        }, Promise.resolve());
      } else if (!opts.silent && Kido.Voice) Kido.Voice.speakInstruction(text, opts.id);
      if (opts.hold) { wait(opts.hold).then(function () { rt.sayEl.classList.remove("show"); }); }
      return rt.sayEl;
    }
    function hideSay() { rt.sayEl.classList.remove("show"); }

    function setProgress(step, total) {
      var html = "";
      for (var i = 0; i < total; i++) {
        var cls = i < step ? "done" : (i === step ? "current" : "");
        html += '<span class="scene-progress__pip ' + cls + '"></span>';
      }
      rt.progressEl.innerHTML = html;
    }

    function button(label, x, y, fn) {
      var b = U.el("button", { class: "scene-btn", text: label });
      b.style.left = x + "px"; b.style.top = y + "px";
      var h = function (e) { if (e && e.preventDefault) e.preventDefault(); Kido.audio.playTapSound(); fn(e); };
      // A native <button> dispatches `click` (not `pointerup`) on Enter/Space,
      // so the pointer handler alone leaves it dead to the keyboard. Mirror the
      // activation on a key handler; divs never get synthetic clicks, so there's
      // no double-fire on pointer devices.
      var key = function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); h(e); }
      };
      b.addEventListener("pointerup", h);
      b.addEventListener("keydown", key);
      rt.listeners.push([b, "pointerup", h], [b, "keydown", key]);
      dom.layers.ui.appendChild(b);
      return b;
    }

    /* ---- outcomes ---- */
    function correct(opts) {
      opts = opts || {};
      if (opts.silent) {
        if (Kido.audio && Kido.audio.playCorrectSound) Kido.audio.playCorrectSound();
      } else if (Kido.Voice) {
        Kido.Voice.speakCorrect(opts);
      }
      if (opts.at) rt.particles.sparkle(opts.at[0], opts.at[1]);
      else rt.particles.sparkle(STAGE_W / 2, STAGE_H / 2);
    }
    function encourage() { if (Kido.Voice) Kido.Voice.speakEncouragement(); return camShake(7); }

    // Big celebration, then hand off to the shared reward + result flow.
    function finish(correctN, total, opts) {
      opts = opts || {};
      if (rt.done || rt._finished) return; rt._finished = true;
      var s = spec;
      rt.particles.confetti(STAGE_W / 2, STAGE_H * 0.35, { count: 90 });
      if (Kido.Voice && !opts.practice) Kido.Voice.speakCheer();
      if (opts.practice) { correctN = 0; total = 0; }
      var result = Kido.rewards.award(s.activityId, s.categoryId, correctN, total);
      result.correct = correctN; result.total = total;
      result.practice = !!opts.practice;
      result.summary = opts.summary;
      if (opts.practice && Kido.progress) {
        var observations = Kido.progress.get("practice") || {};
        var previous = observations[s.activityId];
        observations[s.activityId] = { plays: (previous && previous.plays || 0) + 1, at: new Date().toISOString(), summary: opts.summary, evidence: opts.evidence || {} };
        Kido.progress.set("practice", observations);
      } else if (Kido.progress && Kido.progress.trackScene) {
        Kido.progress.trackScene(s.activityId, s.categoryId, correctN, total);
      }
      if (Kido.Learning) Kido.Learning.noteResult(s, result);
      wait(reduced() ? 200 : 1400).then(function () {
        Kido.Scene.teardown();
        Kido.rewards.celebrate(result);
        Kido.nav.go("result", { id: s.activityId }, { render: false, replace: true });
        Kido.screens.showResult(s, result);
      });
    }

    return {
      spec: spec,
      cfg: Kido.age.cfg(),
      band: Kido.age.current(),
      reduced: reduced,
      active: function () { return !rt.done && !rt._finished; },
      stage: dom.stage, camera: dom.camera, layers: dom.layers, canvas: dom.canvas,
      particles: rt.particles,
      voice: Kido.Voice,
      el: U.el, place: place, emoji: emoji, creature: creature, char: char,
      tween: tween, wait: wait, loopEvery: loopEvery, onFrame: onFrame,
      camFocus: camFocus, camReset: camReset, camShake: camShake,
      tap: tap, drag: makeDrag, hint: hint, clearHint: clearHint, on: on, toStage: toStage,
      say: say, hideSay: hideSay, setProgress: setProgress, button: button,
      correct: correct, encourage: encourage, finish: finish,
      rand: rnd, randInt: U.randInt, pick: U.pick, sample: U.sample, shuffle: U.shuffle,
      W: STAGE_W, H: STAGE_H
    };
  }
})(window);
