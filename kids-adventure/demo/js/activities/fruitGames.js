/* =========================================================================
   fruitGames.js — Dedicated 3D Realistic Fruit Games Suite
   1. fruitCatch   — Orchard harvest basket catch arcade game
   2. fruitExplore — 3D Farmer's Market interactive discovery soundboard
   3. fruitFind    — Audio-first listening & identification quiz
   4. fruitSorter  — 3D Color basket fruit sorting game
   5. fruitMemory  — 3D Fruit memory card matching game
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  Kido.activities = Kido.activities || {};

  function mount() { return document.getElementById("screen"); }
  function clear() { var m = mount(); m.innerHTML = ""; m.scrollTop = 0; return m; }
  function cfg() { return (Kido.age && Kido.age.cfg()) || { difficulty: 3, maxNumber: 6 }; }

  var ALL_FRUITS = [
    { key: "apple", name: "Apple", img: "assets/img/fruits/art/apple.svg", color: "red", taste: "Crisp & Sweet", fact: "Apples float in water because 25% of their volume is air!" },
    { key: "banana", name: "Banana", img: "assets/img/fruits/art/banana.svg", color: "yellow", taste: "Sweet & Creamy", fact: "Bananas are rich in potassium to give you lots of energy!" },
    { key: "orange", name: "Orange", img: "assets/img/fruits/art/orange.svg", color: "yellow", taste: "Juicy & Tangy", fact: "Oranges are packed with Vitamin C to keep you strong and healthy!" },
    { key: "strawberry", name: "Strawberry", img: "assets/img/fruits/art/strawberry.svg", color: "red", taste: "Sweet & Berry Juicy", fact: "Strawberries are the only fruit with tiny seeds on the outside!" },
    { key: "watermelon", name: "Watermelon", img: "assets/img/fruits/art/watermelon.svg", color: "purple", taste: "Refreshing & Crisp", fact: "Watermelons are over 90% water, making them super refreshing!" },
    { key: "grapes", name: "Grapes", img: "assets/img/fruits/art/grapes.svg", color: "purple", taste: "Sweet & Poppable", fact: "Grapes grow in beautiful bunches on climbing vines!" },
    { key: "mango", name: "Mango", img: "assets/img/fruits/art/mango.svg", color: "yellow", taste: "Rich & Tropical", fact: "Mango is loved around the world as the King of Fruits!" },
    { key: "pineapple", name: "Pineapple", img: "assets/img/fruits/art/pineapple.svg", color: "yellow", taste: "Sweet & Zesty", fact: "A pineapple wears a spiky green crown just like fruit royalty!" },
    { key: "cherry", name: "Cherry", img: "assets/img/fruits/art/cherry.svg", color: "red", taste: "Sweet & Juicy", fact: "Cherries often grow in twin pairs joined by curved green stems!" }
  ];

  function plural(name) { return /s$/.test(name) ? name : /[^aeiou]y$/.test(name) ? name.slice(0, -1) + "ies" : name + "s"; }   // Grapes, Cherries
  // Every line these games glue together, recorded by scripts/voice/harvest.js (else: the device voice).
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var out = [];
    ALL_FRUITS.forEach(function (f) {
      for (var n = 1; n <= 8; n++) out.push("Harvest time! Move the basket to catch " + n + " " + plural(f.name) + "!", "Wonderful! You harvested all " + n + " " + plural(f.name) + "!");
      out.push("Can you find the " + f.name + "?", "Yum! That's the " + f.name + "!", f.name + " sorted!", "Oops! " + f.name + " doesn't go in that basket.", f.name + "!",
        f.name + "! " + f.taste + ". " + f.fact,                  // the fruit market's speechText
        "Sweet " + f.name + "!");                                 // fruit catch cheers
    out.push("Yum!", "Great catch!", "Delicious!");
      ALL_FRUITS.forEach(function (t) { if (t !== f) out.push("That's the " + f.name + "! Try finding the " + t.name + "!"); });
    });
    return out;
  });

  /* Helper to render realistic orchard background with depth-of-field and focus spotlight */
  function renderOrchardBg(parent) {
    var bg = U.el("div", { class: "orchard-bg" });
    bg.appendChild(U.el("div", { class: "orchard-bg-photo" }));
    bg.appendChild(U.el("div", { class: "orchard-spotlight" }));
    bg.appendChild(U.el("div", { class: "orchard-sun" }));
    bg.appendChild(U.el("div", { class: "orchard-sunbeams" }));
    for (var i = 0; i < 7; i++) {
      var leaf = U.el("div", { class: "orchard-leaf" });
      leaf.style.left = (8 + Math.random() * 84) + "%";
      leaf.style.animationDelay = (Math.random() * 8) + "s";
      leaf.style.animationDuration = (8 + Math.random() * 6) + "s";
      bg.appendChild(leaf);
    }
    parent.appendChild(bg);
  }

  /* =========================================================================
     1. FRUIT CATCH ARCADE GAME
     ========================================================================= */
  Kido.activities.fruitCatch = function (spec) {
    var m = clear();
    var wrap = U.el("div", { class: "fruit-game-wrap" });
    renderOrchardBg(wrap);

    // Pick target fruit or general harvest based on age
    var d = cfg().difficulty;
    var targetFruit = U.pick(ALL_FRUITS);
    var targetCount = Math.min(8, 3 + d);
    var caughtTarget = 0, totalCaught = 0, over = false;

    // HUD Header
    var hud = U.el("div", { class: "fg-hud" }, [
      U.el("div", { class: "fg-hud__title" }, [
        U.el("span", { class: "fg-hud__icon", text: "🧺" }),
        U.el("span", { text: "Fruit Orchard Harvest" })
      ]),
      U.el("div", { class: "fg-hud__goal", html:
        'Catch <span class="fg-hud__target-pic"><img src="' + targetFruit.img + '" alt="' + targetFruit.name + '"/></span> ' +
        '<b>' + targetFruit.name + 's</b>: <span id="fg-score">0 / ' + targetCount + '</span>'
      })
    ]);
    wrap.appendChild(hud);

    var stage = U.el("div", { class: "fruit-catch-stage" });
    wrap.appendChild(stage);

    // 3D Basket Actor
    var basketX = 50; // percentage across stage
    var basket = U.el("div", { class: "fruit-basket-actor", style: "left: 50%;" });
    basket.appendChild(U.el("div", { class: "basket-shadow" }));
    basket.appendChild(U.el("div", { class: "basket-layer-back", html: '<img src="assets/img/fruits/basket-back.svg" alt="basket back"/>' }));
    var basketContents = U.el("div", { class: "basket-contents" });
    basket.appendChild(basketContents);
    basket.appendChild(U.el("div", { class: "basket-layer-front", html: '<img src="assets/img/fruits/basket-front.svg" alt="basket front"/>' }));
    stage.appendChild(basket);

    // On-screen touch arrows for smooth tablet / phone play
    var arrowsBar = U.el("div", { class: "catch-arrows-bar" });
    var leftBtn = U.el("button", { class: "catch-arrow-btn", "aria-label": "Move left", text: "◀" });
    var rightBtn = U.el("button", { class: "catch-arrow-btn", "aria-label": "Move right", text: "▶" });
    arrowsBar.appendChild(leftBtn);
    arrowsBar.appendChild(rightBtn);
    stage.appendChild(arrowsBar);

    m.appendChild(wrap);

    // Spoken prompt
    setTimeout(function () {
      if (Kido.audio && Kido.audio.speak) {
        Kido.audio.speak("Harvest time! Move the basket to catch " + targetCount + " " + plural(targetFruit.name) + "!");
      }
    }, 300);

    function updateBasketPos(pct) {
      basketX = Math.max(8, Math.min(92, pct));
      basket.style.left = basketX + "%";
    }

    // Controls: pointer dragging across stage
    var dragging = false;
    stage.addEventListener("pointerdown", function (e) {
      dragging = true;
      var rect = stage.getBoundingClientRect();
      updateBasketPos(((e.clientX - rect.left) / rect.width) * 100);
    });
    U.onWhile(stage, window, "pointermove", function (e) {
      if (!dragging) return;
      var rect = stage.getBoundingClientRect();
      if (rect.width > 0) {
        updateBasketPos(((e.clientX - rect.left) / rect.width) * 100);
      }
    });
    U.onWhile(stage, window, "pointerup", function () { dragging = false; });
    U.onWhile(stage, window, "pointercancel", function () { dragging = false; });

    // Keyboard arrow controls
    function onKeyDown(e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        updateBasketPos(basketX - 6);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        updateBasketPos(basketX + 6);
      }
    }
    U.onWhile(stage, window, "keydown", onKeyDown);

    // Touch arrow buttons
    leftBtn.addEventListener("click", function (e) { e.stopPropagation(); updateBasketPos(basketX - 10); });
    rightBtn.addEventListener("click", function (e) { e.stopPropagation(); updateBasketPos(basketX + 10); });

    // Falling fruit simulation loop
    var fallingItems = [];
    var spawnTimer = 0;
    var lastTime = performance.now();
    var animId = null;

    function spawnFruit() {
      // 55% chance of target fruit, 45% other delicious fruits
      var isTarget = Math.random() < 0.55;
      var itemData = isTarget ? targetFruit : U.pick(ALL_FRUITS);
      var el = U.el("div", { class: "falling-fruit", html: '<img src="' + itemData.img + '" alt="' + itemData.name + '"/>' });
      var posX = 8 + Math.random() * 84;
      var posY = -5;
      var speed = 26 + d * 4 + Math.random() * 8; // % of height per second
      var rot = (Math.random() - 0.5) * 30;
      var rotSpeed = (Math.random() - 0.5) * 60;
      stage.appendChild(el);

      fallingItems.push({
        el: el,
        data: itemData,
        isTarget: isTarget,
        x: posX,
        y: posY,
        speed: speed,
        rot: rot,
        rotSpeed: rotSpeed
      });
    }

    function triggerScorePop(x, y, text) {
      var pop = U.el("div", { class: "fruit-score-pop", text: text });
      pop.style.left = x + "%";
      pop.style.top = y + "%";
      stage.appendChild(pop);
      setTimeout(function () { pop.remove(); }, 850);
    }

    function tick(now) {
      if (over || !document.body.contains(stage)) return;
      var dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      spawnTimer += dt;
      var spawnInterval = Math.max(0.75, 1.6 - d * 0.18);
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnFruit();
      }

      var basketTopY = 82; // % height where basket catches
      for (var i = fallingItems.length - 1; i >= 0; i--) {
        var it = fallingItems[i];
        it.y += it.speed * dt;
        it.rot += it.rotSpeed * dt;
        it.el.style.left = it.x + "%";
        it.el.style.top = it.y + "%";
        it.el.style.transform = "translate(-50%, -50%) rotate(" + it.rot + "deg)";

        // Check catch collision with basket
        if (it.y >= basketTopY && it.y <= basketTopY + 12) {
          if (Math.abs(it.x - basketX) < 11) {
            // CAUGHT!
            it.el.remove();
            fallingItems.splice(i, 1);

            // Catch visual & sound effects
            if (Kido.audio) {
              if (Kido.audio.playFruitCrunch) Kido.audio.playFruitCrunch();
              if (Kido.audio.playFruitCatch) Kido.audio.playFruitCatch();
            }
            basket.classList.remove("anim-basket-catch");
            void basket.offsetWidth; // trigger reflow
            basket.classList.add("anim-basket-catch");

            if (Kido.fx && Kido.fx.sparkleEl) Kido.fx.sparkleEl(basket);

            // Add visible mini fruit to basket
            var mini = U.el("img", { class: "basket-mini-fruit", src: it.data.img, alt: it.data.name });
            basketContents.appendChild(mini);

            if (it.isTarget) {
              caughtTarget++;
              triggerScorePop(basketX, 74, "+1 ⭐");
              var scoreEl = document.getElementById("fg-score");
              if (scoreEl) scoreEl.textContent = caughtTarget + " / " + targetCount;

              var cheers = ["Yum!", "Great catch!", "Sweet " + it.data.name + "!", "Delicious!"];   // keep in step with voiceGen above
              if (Kido.mascot && Kido.mascot.say) Kido.mascot.say(U.pick(cheers));

              if (caughtTarget >= targetCount) {
                // VICTORY!
                over = true;
                if (Kido.audio && Kido.audio.playCelebrationSound) Kido.audio.playCelebrationSound();
                if (Kido.fx && Kido.fx.confetti) Kido.fx.confetti(50);
                if (Kido.audio && Kido.audio.speak) Kido.audio.speak("Wonderful! You harvested all " + targetCount + " " + plural(targetFruit.name) + "!");
                setTimeout(function () {
                  window.removeEventListener("keydown", onKeyDown);
                  Kido.engine.finish(spec, targetCount, targetCount);
                }, 1200);
                return;
              }
            } else {
              triggerScorePop(basketX, 74, "Yum! 🍎");
            }
            continue;
          }
        }

        // Passed off screen
        if (it.y > 105) {
          it.el.remove();
          fallingItems.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
  };

  /* =========================================================================
     2. FRUIT MARKET EXPLORE GAME
     ========================================================================= */
  Kido.activities.fruitExplore = function (spec) {
    var m = clear();
    var wrap = U.el("div", { class: "fruit-game-wrap" });
    renderOrchardBg(wrap);

    var exploredSet = {};
    var totalToExplore = ALL_FRUITS.length;

    // HUD Header
    var hud = U.el("div", { class: "fg-hud" }, [
      U.el("div", { class: "fg-hud__title" }, [
        U.el("span", { class: "fg-hud__icon", text: "🍎" }),
        U.el("span", { text: "3D Fruit Market" })
      ]),
      U.el("div", { class: "fg-hud__goal", html:
        'Tasted: <span id="fm-count">0 / ' + totalToExplore + '</span>'
      })
    ]);
    wrap.appendChild(hud);

    var stage = U.el("div", { class: "fruit-market-stage" });
    stage.appendChild(U.el("div", { class: "market-awning" }));

    var grid = U.el("div", { class: "market-crates-grid" });
    stage.appendChild(grid);
    wrap.appendChild(stage);
    m.appendChild(wrap);

    setTimeout(function () {
      if (Kido.audio && Kido.audio.speak) {
        Kido.audio.speak("Welcome to the 3D Fruit Market! Tap any fruit to taste and discover its secrets!");
      }
    }, 300);

    ALL_FRUITS.forEach(function (fruit) {
      var crate = U.el("button", {
        class: "market-crate-card",
        "aria-label": fruit.name + ", " + fruit.taste,
        html:
          '<div class="market-crate-pic"><img src="' + fruit.img + '" alt="' + fruit.name + '"/></div>' +
          '<div class="market-crate-name">' + fruit.name + '</div>' +
          '<div class="market-crate-taste">' + fruit.taste + '</div>'
      });

      crate.addEventListener("click", function () {
        showFruitDetail(fruit, crate);
      });

      grid.appendChild(crate);
    });

    function showFruitDetail(fruit, crateEl) {
      if (Kido.audio) {
        if (Kido.audio.playFruitCrunch) Kido.audio.playFruitCrunch();
        else if (Kido.audio.playTapSound) Kido.audio.playTapSound();
      }
      if (Kido.fx && Kido.fx.sparkleEl) Kido.fx.sparkleEl(crateEl);

      // Mark as explored
      if (!exploredSet[fruit.key]) {
        exploredSet[fruit.key] = true;
        var badge = U.el("span", { class: "market-crate-explored", text: "✓" });
        crateEl.appendChild(badge);
        var cntEl = document.getElementById("fm-count");
        if (cntEl) cntEl.textContent = Object.keys(exploredSet).length + " / " + totalToExplore;
      }

      // Voice description
      var speechText = fruit.name + "! " + fruit.taste + ". " + fruit.fact;
      if (Kido.audio && Kido.audio.speak) {
        Kido.audio.speak(speechText);
      }

      // Render modal detail dialog
      var modalWrap = U.el("div", {
        class: "modal is-open",
        role: "dialog",
        "aria-modal": "true"
      });
      var card = U.el("div", { class: "fruit-detail-card" }, [
        U.el("div", { class: "fruit-detail-pic", html: '<img src="' + fruit.img + '" alt="' + fruit.name + '"/>' }),
        U.el("h3", { class: "fruit-detail-title", text: fruit.name }),
        U.el("div", { class: "fruit-detail-tags" }, [
          U.el("span", { class: "fruit-tag fruit-tag--taste", text: "✨ " + fruit.taste }),
          U.el("span", { class: "fruit-tag fruit-tag--color", text: "🎨 " + fruit.color })
        ]),
        U.el("p", { class: "fruit-detail-fact", text: fruit.fact })
      ]);

      var closeBtn = U.el("button", { class: "fruit-detail-btn", text: "Delicious! 😋" });
      closeBtn.addEventListener("click", function () {
        modalWrap.remove();
        if (Object.keys(exploredSet).length >= totalToExplore) {
          if (Kido.audio && Kido.audio.playCelebrationSound) Kido.audio.playCelebrationSound();
          if (Kido.fx && Kido.fx.confetti) Kido.fx.confetti(60);
          if (Kido.audio && Kido.audio.speak) Kido.audio.speak("Outstanding! You're a certified Fruit Market Master!");
          setTimeout(function () {
            Kido.engine.finish(spec, totalToExplore, totalToExplore);
          }, 1200);
        }
      });
      card.appendChild(closeBtn);
      modalWrap.appendChild(card);
      document.body.appendChild(modalWrap);
    }
  };

  /* =========================================================================
     3. FIND THE FRUIT QUIZ
     ========================================================================= */
  Kido.activities.fruitFind = function (spec) {
    var m = clear();
    var wrap = U.el("div", { class: "fruit-game-wrap" });
    renderOrchardBg(wrap);

    var d = cfg().difficulty;
    var totalRounds = Math.min(6, 3 + d);
    var currentRound = 0, mistakes = 0;
    var optionsCount = d <= 2 ? 3 : 4;

    var hud = U.el("div", { class: "fg-hud" }, [
      U.el("div", { class: "fg-hud__title" }, [
        U.el("span", { class: "fg-hud__icon", text: "🔍" }),
        U.el("span", { text: "Find the Fruit" })
      ]),
      U.el("div", { class: "fg-hud__goal", html:
        'Round: <span id="ff-round">1 / ' + totalRounds + '</span>'
      })
    ]);
    wrap.appendChild(hud);

    var stage = U.el("div", { class: "fruit-find-stage" });
    var promptBox = U.el("h2", { class: "section-title", style: "text-align:center;margin-bottom:8px;", html: "Find the fruit!" });
    var pedestalsRow = U.el("div", { class: "fruit-pedestals-row" });
    stage.appendChild(promptBox);
    stage.appendChild(pedestalsRow);
    wrap.appendChild(stage);
    m.appendChild(wrap);

    function nextRound() {
      if (currentRound >= totalRounds) {
        if (Kido.audio && Kido.audio.playCelebrationSound) Kido.audio.playCelebrationSound();
        if (Kido.fx && Kido.fx.confetti) Kido.fx.confetti(50);
        if (Kido.audio && Kido.audio.speak) Kido.audio.speak("Super job! You found every single fruit!");
        setTimeout(function () {
          Kido.engine.finish(spec, totalRounds, totalRounds + mistakes);
        }, 1100);
        return;
      }

      currentRound++;
      var roundEl = document.getElementById("ff-round");
      if (roundEl) roundEl.textContent = currentRound + " / " + totalRounds;

      var target = U.pick(ALL_FRUITS);
      var pool = ALL_FRUITS.filter(function (f) { return f.key !== target.key; });
      var choices = U.shuffle([target].concat(U.sample(pool, optionsCount - 1)));

      promptBox.innerHTML = 'Can you find the juicy <b>' + target.name + '</b>?';
      pedestalsRow.innerHTML = "";

      if (Kido.audio && Kido.audio.speak) {
        Kido.audio.speak("Can you find the " + target.name + "?");
      }

      choices.forEach(function (f) {
        var card = U.el("button", {
          class: "fruit-pedestal-card",
          "aria-label": f.name,
          html:
            '<div class="fruit-pedestal-pic"><img src="' + f.img + '" alt="' + f.name + '"/></div>'
        });

        card.addEventListener("click", function () {
          if (f.key === target.key) {
            card.classList.add("is-correct");
            if (Kido.audio) {
              if (Kido.audio.playFruitCrunch) Kido.audio.playFruitCrunch();
              if (Kido.audio.playCorrectSound) Kido.audio.playCorrectSound();
              Kido.audio.speak("Yum! That's the " + target.name + "!");
            }
            if (Kido.fx && Kido.fx.sparkleEl) Kido.fx.sparkleEl(card);
            setTimeout(nextRound, 1000);
          } else {
            mistakes++;
            if (Kido.audio && Kido.audio.playIncorrectSound) Kido.audio.playIncorrectSound();
            if (Kido.fx && Kido.fx.shake) Kido.fx.shake(card);
            if (Kido.audio && Kido.audio.speak) {
              Kido.audio.speak("That's the " + f.name + "! Try finding the " + target.name + "!");
            }
          }
        });

        pedestalsRow.appendChild(card);
      });
    }

    nextRound();
  };

  /* =========================================================================
     4. FRUIT BASKET COLOR SORTER
     ========================================================================= */
  Kido.activities.fruitSorter = function (spec) {
    var m = clear();
    var wrap = U.el("div", { class: "fruit-game-wrap" });
    renderOrchardBg(wrap);

    var BASKETS = [
      { id: "red", label: "Red Fruits", badgeClass: "sorter-basket-badge--red", allowed: ["apple", "strawberry", "cherry"] },
      { id: "yellow", label: "Yellow / Gold Fruits", badgeClass: "sorter-basket-badge--yellow", allowed: ["banana", "mango", "pineapple", "orange"] },
      { id: "purple", label: "Purple / Green Fruits", badgeClass: "sorter-basket-badge--purple", allowed: ["grapes", "watermelon"] }
    ];

    // Pick 6 fruits across baskets
    var samplePool = [
      ALL_FRUITS.find(function(f){return f.key==="apple";}),
      ALL_FRUITS.find(function(f){return f.key==="strawberry";}),
      ALL_FRUITS.find(function(f){return f.key==="banana";}),
      ALL_FRUITS.find(function(f){return f.key==="mango";}),
      ALL_FRUITS.find(function(f){return f.key==="grapes";}),
      ALL_FRUITS.find(function(f){return f.key==="watermelon";})
    ].filter(Boolean);

    var remaining = U.shuffle(samplePool.slice());
    var totalCount = remaining.length, sortedCount = 0, mistakes = 0;

    var hud = U.el("div", { class: "fg-hud" }, [
      U.el("div", { class: "fg-hud__title" }, [
        U.el("span", { class: "fg-hud__icon", text: "🧺" }),
        U.el("span", { text: "Fruit Basket Sorter" })
      ]),
      U.el("div", { class: "fg-hud__goal", html:
        'Sorted: <span id="fs-count">0 / ' + totalCount + '</span>'
      })
    ]);
    wrap.appendChild(hud);

    var stage = U.el("div", { class: "fruit-sorter-stage" });
    wrap.appendChild(stage);

    var basketsRow = U.el("div", { class: "sorter-baskets-row" });
    var basketSlots = {};

    BASKETS.forEach(function (b) {
      var slot = U.el("div", {
        class: "sorter-basket-slot",
        "data-id": b.id,
        "aria-label": b.label,
        html:
          '<div class="sorter-basket-badge ' + b.badgeClass + '">' + b.label + '</div>' +
          '<div class="sorter-basket-img">' +
            '<img src="assets/img/fruits/basket-front.svg" alt="basket"/>' +
            '<div class="sorter-basket-stored"></div>' +
          '</div>'
      });
      basketSlots[b.id] = slot;
      basketsRow.appendChild(slot);
    });
    stage.appendChild(basketsRow);

    var poolTray = U.el("div", { class: "sorter-pool-tray" });
    stage.appendChild(poolTray);
    m.appendChild(wrap);

    setTimeout(function () {
      if (Kido.audio && Kido.audio.speak) {
        Kido.audio.speak("Sort the delicious 3D fruits into their matching color baskets!");
      }
    }, 300);

    var selectedChip = null;

    function renderTray() {
      poolTray.innerHTML = "";
      remaining.forEach(function (fruit) {
        var chip = U.el("div", {
          class: "sorter-chip-item",
          "data-key": fruit.key,
          "aria-label": fruit.name,
          html: '<img src="' + fruit.img + '" alt="' + fruit.name + '"/>'
        });

        var ghost = null;
        var startX = 0, startY = 0;
        var isDragging = false;
        var activeBasket = null;

        chip.addEventListener("pointerdown", function (e) {
          startX = e.clientX;
          startY = e.clientY;
          isDragging = false;
          activeBasket = null;

          try { chip.setPointerCapture(e.pointerId); } catch (_) {}

          ghost = document.createElement("div");
          ghost.className = "sorter-ghost";
          ghost.innerHTML = '<img src="' + fruit.img + '" alt="' + fruit.name + '"/>';
          ghost.style.left = e.clientX + "px";
          ghost.style.top = e.clientY + "px";
          ghost.style.display = "none";
          document.body.appendChild(ghost);

          chip.classList.add("is-active");

          function onPointerMove(ev) {
            var dx = ev.clientX - startX;
            var dy = ev.clientY - startY;
            if (!isDragging && Math.hypot(dx, dy) > 5) {
              isDragging = true;
              chip.classList.add("dragging");
              if (selectedChip) {
                selectedChip.style.transform = "";
                selectedChip = null;
              }
              if (ghost) ghost.style.display = "flex";
              if (Kido.audio && Kido.audio.playTapSound) Kido.audio.playTapSound();
            }

            if (isDragging && ghost) {
              ghost.style.left = ev.clientX + "px";
              ghost.style.top = ev.clientY + "px";

              ghost.style.display = "none";
              var elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
              ghost.style.display = "flex";

              var slot = elUnder && elUnder.closest(".sorter-basket-slot");
              if (slot !== activeBasket) {
                if (activeBasket) activeBasket.classList.remove("is-hovered");
                activeBasket = slot;
                if (activeBasket) activeBasket.classList.add("is-hovered");
              }
            }
          }

          function onPointerUp(ev) {
            chip.removeEventListener("pointermove", onPointerMove);
            chip.removeEventListener("pointerup", onPointerUp);
            chip.removeEventListener("pointercancel", onPointerUp);
            try { chip.releasePointerCapture(ev.pointerId); } catch (_) {}

            chip.classList.remove("is-active");
            chip.classList.remove("dragging");

            if (activeBasket) {
              activeBasket.classList.remove("is-hovered");
              activeBasket = null;
            }

            var dropSlot = null;
            if (ghost) {
              ghost.style.display = "none";
              var elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
              dropSlot = elUnder && elUnder.closest(".sorter-basket-slot");
              if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
              ghost = null;
            }

            if (isDragging) {
              if (dropSlot) {
                trySort(fruit, dropSlot.getAttribute("data-id"));
              }
            } else {
              // Tap fallback
              if (selectedChip === chip) {
                chip.style.transform = "";
                selectedChip = null;
              } else {
                if (selectedChip) selectedChip.style.transform = "";
                selectedChip = chip;
                chip.style.transform = "scale(1.25) translateY(-10px)";
                if (Kido.audio && Kido.audio.playTapSound) Kido.audio.playTapSound();
              }
            }
          }

          chip.addEventListener("pointermove", onPointerMove);
          chip.addEventListener("pointerup", onPointerUp);
          chip.addEventListener("pointercancel", onPointerUp);
        });

        poolTray.appendChild(chip);
      });
    }

    renderTray();

    // Tap target basket to deposit selected chip
    Object.keys(basketSlots).forEach(function (basketId) {
      var slot = basketSlots[basketId];
      slot.addEventListener("click", function () {
        if (!selectedChip) return;
        var fKey = selectedChip.getAttribute("data-key");
        var fruit = remaining.find(function (f) { return f.key === fKey; });
        if (fruit) {
          trySort(fruit, basketId);
        }
      });
    });

    function trySort(fruit, basketId) {
      var basketDef = BASKETS.find(function (b) { return b.id === basketId; });
      if (!basketDef) return false;

      if (basketDef.allowed.indexOf(fruit.key) !== -1) {
        // Correct Basket!
        var idx = remaining.indexOf(fruit);
        if (idx !== -1) remaining.splice(idx, 1);
        selectedChip = null;

        sortedCount++;
        var countEl = document.getElementById("fs-count");
        if (countEl) countEl.textContent = sortedCount + " / " + totalCount;

        var slot = basketSlots[basketId];
        var storedContainer = slot.querySelector(".sorter-basket-stored");
        if (storedContainer) {
          var mini = U.el("img", { src: fruit.img, alt: fruit.name });
          storedContainer.appendChild(mini);
        }

        if (Kido.audio) {
          if (Kido.audio.playFruitCrunch) Kido.audio.playFruitCrunch();
          if (Kido.audio.playFruitCatch) Kido.audio.playFruitCatch();
          Kido.audio.speak(fruit.name + " sorted!");
        }
        if (Kido.fx && Kido.fx.sparkleEl) Kido.fx.sparkleEl(slot);

        renderTray();

        if (sortedCount >= totalCount) {
          if (Kido.audio && Kido.audio.playCelebrationSound) Kido.audio.playCelebrationSound();
          if (Kido.fx && Kido.fx.confetti) Kido.fx.confetti(50);
          if (Kido.audio && Kido.audio.speak) Kido.audio.speak("Super work! Every fruit is sorted into its basket!");
          setTimeout(function () {
            Kido.engine.finish(spec, totalCount, totalCount + mistakes);
          }, 1100);
        }
        return true;
      } else {
        mistakes++;
        var badSlot = basketSlots[basketId];
        if (Kido.audio && Kido.audio.playIncorrectSound) Kido.audio.playIncorrectSound();
        if (Kido.fx && Kido.fx.shake) Kido.fx.shake(badSlot);
        if (Kido.audio && Kido.audio.speak) {
          Kido.audio.speak("Oops! " + fruit.name + " doesn't go in that basket.");
        }
        return false;
      }
    }
  };

  /* =========================================================================
     5. 3D FRUIT MEMORY MATCH
     ========================================================================= */
  Kido.activities.fruitMemory = function (spec) {
    var d = cfg().difficulty;
    var pairs = d <= 2 ? 3 : (d <= 4 ? 4 : 6);
    var picks = U.sample(ALL_FRUITS, pairs);
    var cards = [];
    picks.forEach(function (f) {
      cards.push({ id: f.key, fruit: f });
      cards.push({ id: f.key, fruit: f });
    });
    cards = U.shuffle(cards);

    var m = clear();
    var wrap = U.el("div", { class: "fruit-game-wrap" });
    renderOrchardBg(wrap);

    var hud = U.el("div", { class: "fg-hud" }, [
      U.el("div", { class: "fg-hud__title" }, [
        U.el("span", { class: "fg-hud__icon", text: "🍇" }),
        U.el("span", { text: "3D Fruit Memory Match" })
      ]),
      U.el("div", { class: "fg-hud__goal", html:
        'Pairs: <span id="fm-pairs">0 / ' + pairs + '</span>'
      })
    ]);
    wrap.appendChild(hud);

    var stage = U.el("div", { class: "fruit-memory-stage" });
    var cols = pairs <= 3 ? 3 : 4;
    var grid = U.el("div", { class: "mem-grid" });
    grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    stage.appendChild(grid);
    wrap.appendChild(stage);
    m.appendChild(wrap);

    setTimeout(function () {
      if (Kido.audio && Kido.audio.speak) {
        Kido.audio.speak("Flip the cards to match pairs of 3D fruits!");
      }
    }, 300);

    var first = null, found = 0, mistakes = 0, lock = false;

    cards.forEach(function (c) {
      var card = U.el("button", {
        class: "mem-card",
        "aria-label": "Memory card: " + c.fruit.name,
        html:
          '<div class="mem-card__inner">' +
            '<div class="mem-face mem-face--back">' +
              '<span class="mem-card-back-badge">❓</span>' +
            '</div>' +
            '<div class="mem-face mem-face--front">' +
              '<img class="mem-fruit-img" src="' + c.fruit.img + '" alt="' + c.fruit.name + '"/>' +
              '<span class="mem-fruit-label">' + c.fruit.name + '</span>' +
            '</div>' +
          '</div>'
      });
      card._id = c.id;
      card._fruit = c.fruit;

      card.addEventListener("click", function () {
        if (lock || card._done || card.classList.contains("flipped")) return;
        if (Kido.audio && Kido.audio.playTapSound) Kido.audio.playTapSound();
        card.classList.add("flipped");

        if (!first) {
          first = card;
          return;
        }

        if (first === card) return;

        if (first._id === card._id) {
          // MATCH!
          first.classList.add("done");
          card.classList.add("done");
          first._done = card._done = true;
          found++;

          var pairsEl = document.getElementById("fm-pairs");
          if (pairsEl) pairsEl.textContent = found + " / " + pairs;

          if (Kido.audio) {
            if (Kido.audio.playFruitCrunch) Kido.audio.playFruitCrunch();
            if (Kido.audio.playCorrectSound) Kido.audio.playCorrectSound();
            Kido.audio.speak(card._fruit.name + "!");
          }
          if (Kido.fx && Kido.fx.sparkleEl) {
            Kido.fx.sparkleEl(first);
            Kido.fx.sparkleEl(card);
          }

          first = null;

          if (found >= pairs) {
            if (Kido.audio && Kido.audio.playCelebrationSound) Kido.audio.playCelebrationSound();
            if (Kido.fx && Kido.fx.confetti) Kido.fx.confetti(50);
            if (Kido.audio && Kido.audio.speak) Kido.audio.speak("Incredible memory! You matched all the fruits!");
            setTimeout(function () {
              Kido.engine.finish(spec, pairs, pairs + Math.floor(mistakes / 2));
            }, 1100);
          }
        } else {
          mistakes++;
          lock = true;
          if (Kido.audio && Kido.audio.playIncorrectSound) Kido.audio.playIncorrectSound();
          var a = first, b = card;
          first = null;
          setTimeout(function () {
            a.classList.remove("flipped");
            b.classList.remove("flipped");
            lock = false;
          }, 850);
        }
      });

      grid.appendChild(card);
    });
  };

})(window);
