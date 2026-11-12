/* =========================================================================
   countApples.js — Flagship scene #3 (Math: "Count the Fruits")
   Momo stands by a wooden harvest table in a sunny orchard.
   Each round displays attractive realistic 3D fruits (Apples, Oranges,
   Strawberries, Bananas, Watermelons). Tap each fruit to count it aloud;
   watch it drop into the 3D basket, visibly filling the basket layer by layer!
   Then tap the numeral that matches the total count.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido;

  // Realistic 3D Fruits Catalog
  var FRUITS = [
    { name: "apples", singular: "apple", svg: "assets/img/fruits/art/apple.svg", peek: "🍎" },
    { name: "oranges", singular: "orange", svg: "assets/img/fruits/art/orange.svg", peek: "🍊" },
    { name: "strawberries", singular: "strawberry", svg: "assets/img/fruits/art/strawberry.svg", peek: "🍓" },
    { name: "bananas", singular: "banana", svg: "assets/img/fruits/art/banana.svg", peek: "🍌" },
    { name: "watermelons", singular: "watermelon", svg: "assets/img/fruits/art/watermelon.svg", peek: "🍉" }
  ];

  // the count prompts for every fruit, recorded by scripts/voice/harvest.js (else: the device voice)
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    return FRUITS.reduce(function (out, f) { out.push("Tap the " + f.singular + " to count!", "How many " + f.name + "? Tap each one to count!"); return out; }, []);
  });

  Kido.Scene.register("scene-count", {
    music: "orchard", bg: "bg-orchard",
    build: function (api) {
      var cfg = api.cfg || {};
      var maxN = Math.max(3, Math.min(8, cfg.maxNumber || 5));
      var totalRounds = Math.max(2, Math.min(4, cfg.rounds || 3));
      var opts = Math.max(2, Math.min(4, cfg.optionsPerQuestion || 3));


      // Decorative Orchard Environment (NO flat boring trees!)
      var groundLayer = api.layers.ground || api.stage;
      var midLayer = api.layers.mid || api.layers.ground || api.stage;
      var skyLayer = api.layers.sky || api.stage;

      groundLayer.appendChild(api.el("div", { class: "ground-strip ground-green" }));

      // Wooden harvest table
      groundLayer.appendChild(api.el("div", { class: "orchard-table" }));

      // Composite 3D Wicker Basket
      var basketWrap = api.el("div", { class: "basket-composite" });
      var basketBack = api.el("div", { class: "basket-back-layer", html: '<img src="assets/img/fruits/basket-back.svg" alt="basket back">' });
      var basketContents = api.el("div", { class: "basket-contents-layer" });
      var basketFront = api.el("div", { class: "basket-front-layer", html: '<img src="assets/img/fruits/basket-front.svg" alt="basket front">' });
      var basketBadge = api.el("div", { class: "basket-counter-badge", style: "display:none;" });
      basketWrap.appendChild(basketBack);
      basketWrap.appendChild(basketContents);
      basketWrap.appendChild(basketFront);
      basketWrap.appendChild(basketBadge);
      api.place(basketWrap, 500, 405, { layer: "props" });

      // Momo character on the left (in props layer so clearActors never touches him)
      var momo = api.char("momo", 140, 410, { size: 200, layer: "props", className: "guide-momo" });
      momo.set("happy");

      var idx = 0, correct = 0;
      step();

      function step() {
        clearActors();
        basketContents.innerHTML = "";
        basketBadge.style.display = "none";

        if (idx >= totalRounds) {
          api.finish(correct, totalRounds);
          return;
        }
        api.setProgress(idx, totalRounds);

        // Pick distinct fruit for this round
        var roundFruit = FRUITS[idx % FRUITS.length];
        var n = api.randInt(2, maxN);
        var counted = 0, clean = true, phase = "count";

        // Layout fruit positions across top area
        var spacing = n <= 4 ? 120 : (n <= 6 ? 100 : 85);
        var fruitSize = n <= 5 ? 100 : 86;
        var startX = 500 - (n - 1) * spacing / 2;

        for (var i = 0; i < n; i++) {
          (function (i) {
            var cx = startX + i * spacing;
            var fruitEl = makeFruitActor(roundFruit, fruitSize);
            api.place(fruitEl, cx, 195, { layer: "actors" });
            api.tween(fruitEl, [
              { opacity: 0, transform: "translate(-50%,-50%) scale(0.3) translateY(-40px)" },
              { opacity: 1, transform: "translate(-50%,-50%) scale(1) translateY(0)" }
            ], { duration: 320, delay: i * 70 });

            api.hint(fruitEl);

            api.tap(fruitEl, function () {
              if (phase !== "count" || fruitEl.dataset.done) return;
              fruitEl.dataset.done = "1";
              api.clearHint(fruitEl);
              counted++;
              speak(String(counted));

              // Tween fruit swooping down into the 3D basket
              api.tween(fruitEl, [
                { left: cx + "px", top: "195px", transform: "translate(-50%,-50%) scale(1)" },
                { left: "500px", top: "385px", transform: "translate(-50%,-50%) scale(0.65)" }
              ], { duration: 420, easing: "cubic-bezier(.5,0,.7,1)" }).then(function () {
                fruitEl.remove();
                addFruitToBasket(roundFruit, counted);
              });

              if (counted === n) {
                api.wait(650).then(askNumber);
              }
            });
          })(i);
        }

        momo.set("thinking");
        var promptText = n === 1 ? ("Tap the " + roundFruit.singular + " to count!") : ("How many " + roundFruit.name + "? Tap each one to count!");
        api.say(promptText, {
          peek: '<img src="' + roundFruit.svg + '" alt="' + roundFruit.name + '">',
          id: "count-go"
        });

        function askNumber() {
          phase = "answer";
          momo.set("happy");
          api.say("How many did we count? Tap the number!", { peek: "🔢", id: "count-ask" });

          var used = {};
          used[n] = 1;
          var nums = [n];
          while (nums.length < opts) {
            var d = api.randInt(1, Math.max(maxN + 1, n + 2));
            if (!used[d]) {
              used[d] = 1;
              nums.push(d);
            }
          }
          nums = api.shuffle(nums);

          var chipSpacing = nums.length === 2 ? 160 : (nums.length === 3 ? 140 : 120);
          var sx = 500 - (nums.length - 1) * chipSpacing / 2;

          nums.forEach(function (num, i) {
            var cx = sx + i * chipSpacing;
            var chip = numChip(num);
            api.place(chip, cx, 205, { layer: "actors" });
            api.tween(chip, [
              { opacity: 0, transform: "translate(-50%,-50%) scale(.4) translateY(-30px)" },
              { opacity: 1, transform: "translate(-50%,-50%) scale(1) translateY(0)" }
            ], { duration: 300, delay: i * 70 });

            api.tap(chip, function () {
              if (num === n) {
                api.correct({ at: [cx, 205] });
                momo.set("celebrating");
                momo.pose("cheer");
                if (clean) correct++;

                api.wait(1800).then(function () { speak(String(n)); });
                api.wait(3200).then(function () {
                  idx++;
                  step();
                });
              } else {
                clean = false;
                api.encourage();
                api.tween(chip, [
                  { transform: "translate(-50%,-50%) rotate(-10deg)" },
                  { transform: "translate(-50%,-50%) rotate(10deg)" },
                  { transform: "translate(-50%,-50%) rotate(0)" }
                ], { duration: 300 });
              }
            });
          });
        }
      }

      // Dynamic Basket Filling Function
      function addFruitToBasket(fruit, currentCount) {
        // Staggered pile positions inside the wicker basket cavity
        var pileSlots = [
          { left: "38%", top: "40%", rot: -10 },
          { left: "62%", top: "40%", rot: 12 },
          { left: "50%", top: "28%", rot: -2 },
          { left: "30%", top: "26%", rot: -16 },
          { left: "70%", top: "26%", rot: 18 },
          { left: "42%", top: "14%", rot: -5 },
          { left: "58%", top: "14%", rot: 8 },
          { left: "50%", top: "2%", rot: 0 }
        ];

        var slot = pileSlots[(currentCount - 1) % pileSlots.length];
        var stacked = api.el("div", {
          class: "basket-stacked-fruit",
          style: "left:" + slot.left + "; top:" + slot.top + "; transform: translate(-50%,-50%) rotate(" + slot.rot + "deg);",
          html: '<img src="' + fruit.svg + '" alt="' + fruit.name + '">'
        });
        basketContents.appendChild(stacked);

        // Basket catch bounce
        basketWrap.classList.remove("basket-jiggle");
        void basketWrap.offsetWidth;
        basketWrap.classList.add("basket-jiggle");

        // Update counter badge on basket
        basketBadge.textContent = String(currentCount);
        basketBadge.style.display = "flex";

        // Sparkle burst
        api.particles.sparkle(500, 420, { count: 8 });
        if (Kido.audio && Kido.audio.pop) Kido.audio.pop();
      }

      function clearActors() {
        Array.prototype.forEach.call(api.layers.actors.querySelectorAll(".actor"), function (a) { a.remove(); });
      }

      function speak(s) {
        if (api.voice) api.voice.speakWord(s);
        else if (Kido.audio && Kido.audio.speak) Kido.audio.speak(s);
      }

      function makeFruitActor(fruit, size) {
        return api.el("div", {
          class: "actor actor--tappable fruit-card-3d fruit-floating",
          style: "width:" + size + "px; height:" + size + "px;",
          html: '<img class="fruit-img" src="' + fruit.svg + '" alt="' + fruit.name + '">'
        });
      }

      function numChip(num) {
        return api.el("div", {
          class: "actor actor--tappable",
          html:
            '<div style="width:104px;height:104px;border-radius:26px;background:linear-gradient(135deg,#FFFFFF 0%,#F3F0FF 100%);display:flex;align-items:center;justify-content:center;font-family:\'Baloo 2\',sans-serif;font-weight:800;font-size:56px;color:#4E32A8;box-shadow:0 10px 22px rgba(78,50,168,0.22),inset 0 2px 0 #FFF;border:3px solid #FFF;transition:transform .2s ease;">' +
            num +
            '</div>'
        });
      }
    }
  });
})(window);
