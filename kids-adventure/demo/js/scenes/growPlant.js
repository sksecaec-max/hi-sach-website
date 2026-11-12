/* A persistent SVG garden: actions reveal growth instead of replacing drawings. */
(function (window) {
  "use strict";
  var Kido = window.Kido;
  var GROWTH_NAMES = ["Roots reach into the soil", "A shoot reaches up", "Leaves unfold", "A bud becomes a flower"];
  (Kido.voiceGen = Kido.voiceGen || []).push(function () { return GROWTH_NAMES.map(function (n) { return n + "."; }); });   // recorded by scripts/voice/harvest.js
  Kido.Scene.register("scene-plant", {
    title: "Momo's little garden", music: "garden", bg: "bg-garden", responsive: true,
    build: function (api) {
      var phase = "dig", busy = false, water = 0, holding = false, held = false, attempts = 0, dragPointer = null, seedStart = null, seedMoved = false;
      var lesson = api.el("div", { class: "lesson lesson--garden" });
      lesson.innerHTML = '<header class="lesson-heading"><span class="lesson-eyebrow">MOMO’S LITTLE GARDEN</span><h1>From a seed to a sunflower</h1></header>' +
        '<div class="lesson-body"><aside class="lesson-companion"><div class="lesson-momo"></div><p class="garden-observation">Every plant starts small.</p></aside>' +
        '<section class="garden-window" aria-label="Your sunflower garden"><svg class="garden-art" viewBox="0 0 600 440" role="img" aria-label="A patch of soil waiting for a seed">' +
        '<defs><linearGradient id="gardenSky" x2="0" y2="1"><stop stop-color="#BCE6ED"/><stop offset="1" stop-color="#F9F4CF"/></linearGradient><linearGradient id="gardenSoil" x2="0" y2="1"><stop stop-color="#815137"/><stop offset="1" stop-color="#392D2C"/></linearGradient></defs>' +
        '<rect width="600" height="440" rx="28" fill="url(#gardenSky)"/><g class="garden-sun"><circle cx="474" cy="80" r="47" fill="#FFEBA1"/><circle cx="474" cy="80" r="31" fill="#FFC653"/><path d="M461 85Q474 100 487 85" stroke="#9A622B" stroke-width="3" fill="none"/></g>' +
        '<path d="M0 278Q110 200 240 270T600 260V440H0" fill="#9BCB96"/><path d="M0 306Q170 268 320 297T600 295V440H0" fill="#5EAB83"/>' +
        '<path d="M80 333Q300 275 520 333L510 440H90Z" fill="url(#gardenSoil)"/><ellipse class="garden-wet" cx="300" cy="326" rx="126" ry="27" fill="#392B29"/>' +
        '<ellipse class="garden-hole" cx="300" cy="325" rx="38" ry="16" fill="#281F23"/><g class="garden-seed"><ellipse cx="300" cy="320" rx="10" ry="17" transform="rotate(25 300 320)" fill="#C98B46"/><path d="M300 310L295 330" stroke="#F8D591" stroke-width="3"/></g>' +
        '<g class="garden-roots" fill="none" stroke="#EDD8A6" stroke-width="4" stroke-linecap="round"><path pathLength="1" d="M300 331Q287 365 301 408M296 355Q265 357 252 377M297 370Q326 368 344 394M300 394L280 415"/></g>' +
        '<path class="garden-stem" pathLength="1" d="M300 323Q288 238 300 147" fill="none" stroke="#357D53" stroke-width="11" stroke-linecap="round"/>' +
        '<g class="garden-leaves"><path d="M298 258Q220 262 223 205Q282 193 298 258Z" fill="#49A46D"/><path d="M298 226Q379 228 374 171Q316 168 298 226Z" fill="#6DBE77"/><path d="M293 250L239 220M305 218L358 186" stroke="#C3DD8E" stroke-width="3" fill="none"/></g>' +
        '<circle class="garden-bud" cx="300" cy="142" r="17" fill="#74A753"/><g class="garden-bloom"><g fill="#FFC64B">' +
        Array.from({length:12}, function (_, n) { return '<ellipse cx="300" cy="93" rx="14" ry="34" transform="rotate(' + n * 30 + ' 300 139)"/>'; }).join('') +
        '</g><circle cx="300" cy="139" r="32" fill="#774B35"/><circle cx="300" cy="139" r="23" fill="#A37347"/><g fill="#E8B86B"><circle cx="289" cy="131" r="3"/><circle cx="307" cy="126" r="3"/><circle cx="312" cy="143" r="3"/><circle cx="295" cy="150" r="3"/></g></g>' +
        '<g class="garden-can" transform="translate(110 150)"><g class="garden-can-tilt"><path d="M30 42Q-10 40 4 4Q14 -8 34 8" fill="none" stroke="#2B91A8" stroke-width="12"/><path d="M27 18H89L82 91H34Z" fill="#3DACC0"/><ellipse cx="58" cy="18" rx="31" ry="9" fill="#23788F"/><path d="M81 40L120 0" stroke="#3DACC0" stroke-width="16"/><ellipse cx="120" cy="0" rx="16" ry="7" fill="#94DCDD" transform="rotate(-40 120 0)"/><path d="M45 38V68" stroke="#A0E3E1" stroke-width="6" stroke-linecap="round"/></g></g>' +
        '<path class="garden-water" d="M230 150Q268 203 285 314M238 153Q283 223 302 315M223 155Q253 230 272 312" fill="none" stroke="#65BFEB" stroke-width="5" stroke-linecap="round"/>' +
        '<g class="garden-cloud" fill="#fff"><ellipse cx="466" cy="106" rx="80" ry="26"/><circle cx="439" cy="86" r="32"/><circle cx="479" cy="82" r="40"/><circle cx="521" cy="96" r="27"/></g>' +
        '<g class="garden-night"><rect width="600" height="440" rx="28" fill="#233B64" opacity=".84"/><path d="M464 54A35 35 0 1 0 502 99A40 40 0 0 1 464 54" fill="#FFF1BE"/><circle cx="130" cy="80" r="3" fill="white"/><circle cx="220" cy="42" r="3" fill="white"/></g></svg>' +
        '<button class="garden-soil-target" type="button" aria-label="Dig a small hole in the soil">Dig here</button><div class="garden-time" role="status"></div></section></div>' +
        '<div class="lesson-tools"><button class="lesson-action garden-action" type="button">Dig a little hole</button>' +
        '<button class="lesson-tool garden-seed-tool" type="button" hidden><svg viewBox="0 0 80 60" aria-hidden="true"><ellipse cx="40" cy="30" rx="14" ry="23" transform="rotate(25 40 30)" fill="#B87838"/><path d="M42 14L34 47" stroke="#F2D596" stroke-width="4"/></svg><span>Plant the seed</span></button>' +
        '<div class="garden-meter" hidden><label>Water in the soil<progress max="100" value="0"></progress></label></div></div>' +
        '<div class="garden-choices" hidden><p>What will grow from the seed?</p><button type="button" data-answer="roots">Roots below the soil</button><button type="button" data-answer="flower">A flower straight away</button></div>' +
        '<div class="garden-keepsakes" aria-label="Your saved garden"></div>';
      api.layers.actors.appendChild(lesson);
      var action = lesson.querySelector(".garden-action"), seed = lesson.querySelector(".garden-seed-tool"), target = lesson.querySelector(".garden-soil-target");
      var windowEl = lesson.querySelector(".garden-window"), art = lesson.querySelector(".garden-art"), time = lesson.querySelector(".garden-time");
      var meter = lesson.querySelector(".garden-meter"), bar = meter.querySelector("progress"), choices = lesson.querySelector(".garden-choices");
      var observation = lesson.querySelector(".garden-observation");
      // Only the most recent six creations are retained; absence never harms a plant.
      var saved = Kido.progress.get("garden") || [];
      if (!Array.isArray(saved)) saved = [];
      var momo = Kido.Characters.create("momo", { size: 155, className: "guide-momo" }); lesson.querySelector(".lesson-momo").appendChild(momo.el); momo.set("happy");
      showGarden(); prompt("Dig a small hole for our sunflower seed.", "dig", 0);
      function showGarden() {
        var shelf = lesson.querySelector(".garden-keepsakes"); shelf.textContent = "";
        if (!saved.length) return;
        shelf.appendChild(api.el("span", { text: "Your garden " }));
        saved.slice(-6).forEach(function (_, i) { shelf.appendChild(api.el("span", { class: "garden-keepsake", role: "img", "aria-label": "Saved sunflower " + (i + 1), text: "🌻" })); });
      }
      function prompt(text, id, step) { api.say(text, { id: "garden-v2-" + id }); if (step != null) api.setProgress(step, 6); }
      function setPhase(value, text) { phase = value; lesson.dataset.phase = value; action.textContent = text; action.disabled = false; busy = false; }
      function dig() {
        if (phase !== "dig" || busy) return;
        setPhase("seed", "Cover the seed"); lesson.classList.add("has-hole"); action.hidden = true; seed.hidden = false;
        target.textContent = "Plant here"; target.setAttribute("aria-label", "Place the sunflower seed in the hole");
        prompt("Put the seed in the hole. Drag it here, or tap the seed.", "seed", 1);
      }
      function plant() {
        if (phase !== "seed" || busy) return;
        setPhase("cover", "Cover with soil"); seed.hidden = true; action.hidden = false; target.hidden = true; lesson.classList.add("has-seed");
        prompt("Our seed is in. Cover it gently with soil.", "cover", 2);
      }
      api.tap(target, function () { if (phase === "dig") dig(); else plant(); });
      api.tap(seed, function (e) { if (!e.detail || !seedMoved) plant(); });
      // Drag is optional. Dropping outside the soil leaves the seed available.
      api.on(seed, "pointerdown", function (e) { if (phase !== "seed" || dragPointer !== null || e.isPrimary === false || e.button !== 0) return; dragPointer = e.pointerId; seedMoved = false; seedStart = [e.clientX, e.clientY]; seed.setPointerCapture(e.pointerId); });
      api.on(seed, "pointermove", function (e) {
        if (e.pointerId !== dragPointer) return;
        var dx = e.clientX - seedStart[0], dy = e.clientY - seedStart[1];
        if (Math.hypot(dx, dy) > 8) seedMoved = true;
        seed.style.transform = "translate(" + dx + "px," + dy + "px)";
        var r = target.getBoundingClientRect(); target.classList.toggle("is-over", e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom);
      });
      api.on(seed, "pointerup", function (e) {
        if (e.pointerId !== dragPointer) return;
        var over = target.classList.contains("is-over"); dragPointer = null; seed.style.transform = ""; target.classList.remove("is-over"); if (over) plant();
      });
      api.on(seed, "pointercancel", function () { dragPointer = null; seedMoved = true; seed.style.transform = ""; target.classList.remove("is-over"); });
      api.on(seed, "lostpointercapture", function () { dragPointer = null; seed.style.transform = ""; target.classList.remove("is-over"); });
      function addWater(amount) {
        if (phase !== "water" || busy || !api.active()) return;
        water = Math.min(100, water + amount); bar.value = water;
        lesson.style.setProperty("--wetness", water / 100); lesson.classList.add("is-pouring");
        if (water === 100) {
          holding = false; lesson.classList.remove("is-pouring"); setPhase("light", "Move the cloud aside"); meter.hidden = true;
          prompt("The soil is damp. Let's find a sunny spot for our garden.", "light", 3);
        }
      }
      api.on(action, "pointerdown", function (e) {
        if (phase !== "water" || e.isPrimary === false || e.button !== 0) return;
        holding = true; held = false; action.setPointerCapture(e.pointerId); Kido.audio.unlock();
      });
      function stopWater() { holding = false; lesson.classList.remove("is-pouring"); }
      api.on(action, "pointerup", stopWater); api.on(action, "pointercancel", function () { held = true; stopWater(); });
      api.on(action, "lostpointercapture", stopWater);
      api.loopEvery(100, function () { if (holding && phase === "water") { held = true; addWater(5); } });
      api.tap(action, function (e) {
        // A held pour's release must not also activate the newly displayed next action.
        if (held && e && e.detail) { held = false; return; }
        if (busy) return;
        if (phase === "dig") dig();
        else if (phase === "cover") {
          setPhase("water", "Hold to water · or tap"); lesson.classList.add("is-covered"); meter.hidden = false;
          prompt("Give the seed some water. Hold the button, or tap to pour a little.", "water");
        } else if (phase === "water") {
          addWater(25); api.wait(300).then(function () { if (!holding && api.active()) lesson.classList.remove("is-pouring"); });
        } else if (phase === "light") {
          busy = true; action.hidden = true; lesson.classList.add("has-light");
          if (api.cfg.difficulty >= 3) { phase = "predict"; lesson.dataset.phase = phase; choices.hidden = false; prompt("What will grow first: roots, or a flower?", "predict"); }
          else beginGrowth();
        } else if (phase === "observe") nextGrowth();
        else if (phase === "save") saveFlower();
        else if (phase === "done") api.finish(0, 0, { practice: true, summary: "You planted a seed and explored roots, leaves and a flower", evidence: { stages: 4, predictionAttempts: attempts } });
      });
      Array.prototype.forEach.call(choices.querySelectorAll("button"), function (button) {
        api.tap(button, function () {
          if (phase !== "predict") return; attempts++;
          if (button.dataset.answer === "roots") { choices.hidden = true; beginGrowth(); }
          else prompt("A flower comes later. Roots grow below the soil first. Try roots.", "try-roots");
        });
      });
      var growth = 0;
      var growthNames = GROWTH_NAMES;
      function beginGrowth() { busy = false; phase = "observe"; nextGrowth(); }
      function nextGrowth() {
        if (busy || growth >= 4 || !api.active()) return;
        busy = true; action.disabled = true; action.hidden = true; time.textContent = growth === 0 ? "A few days later…" : "More days pass…"; lesson.classList.add("time-passes");
        prompt("Let's imagine time passing. Real plants take days and weeks to grow.", "time-" + growth);
        api.wait(1600).then(function () {
          if (!api.active()) return;
          lesson.classList.remove("time-passes"); growth++; lesson.dataset.growth = growth;
          time.textContent = growthNames[growth - 1]; observation.textContent = growthNames[growth - 1];
          art.setAttribute("aria-label", growthNames[growth - 1]); momo.set("excited");
          prompt(growthNames[growth - 1] + ".", "growth-" + growth, growth === 4 ? 6 : 4);
          api.wait(1000).then(function () {
            if (!api.active()) return;
            setPhase(growth === 4 ? "save" : "observe", growth === 4 ? "Save my sunflower" : "Watch the next change"); action.hidden = false;
          });
        });
      }
      function saveFlower() {
        if (busy || phase !== "save") return; setPhase("done", "All done");
        saved = saved.concat([{ kind: "sunflower", at: new Date().toISOString() }]).slice(-6); Kido.progress.set("garden", saved); showGarden();
        momo.set("celebrating"); prompt("Your sunflower has a home in your garden. You helped it grow!", "saved", 6);
      }
    }
  });
})(window);
