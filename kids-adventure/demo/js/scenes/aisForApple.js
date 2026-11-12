/* =========================================================================
   aisForApple.js — Flagship scene #2 (Alphabet: "A is for Apple" to Z)
   Momo stands in a sunny orchard garden with the 3D wicker harvest basket.
   Each round presents realistic 3D objects from A to Z with multiple items
   per letter (e.g., A for Ant or Apple; U for Umbrella; X for Xylophone;
   G for Grapes). No letter badges are plastered on the objects.
   When the child taps any object:
     - Target object: "G is for Grapes! Awesome!" (swoops into basket)
     - Decoy object: "U is for Umbrella! Find the Grapes." (shakes with gentle feedback)
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido;

  // Complete A–Z Alphabet Catalog with multiple 3D realistic objects per letter
  var ALPHABET_ITEMS = {
    A: [
      { L: "A", word: "Apple", svg: "assets/img/fruits/art/apple.svg", name: "Apple", color: "#FF2B44" },
      { L: "A", word: "Ant", svg: "assets/img/objects/ant.svg", name: "Ant", color: "#D32F2F" },
      { L: "A", word: "Airplane", svg: "assets/img/vehicles/airplane.jpg", name: "Airplane", color: "#1976D2" }
    ],
    B: [
      { L: "B", word: "Banana", svg: "assets/img/fruits/art/banana.svg", name: "Banana", color: "#FFD000" },
      { L: "B", word: "Ball", svg: "assets/img/objects/ball.svg", name: "Ball", color: "#FF9800" },
      { L: "B", word: "Butterfly", svg: "assets/img/objects/butterfly.svg", name: "Butterfly", color: "#AB47BC" },
      { L: "B", word: "Bear", svg: "assets/img/animals/bear.jpg", name: "Bear", color: "#5D4037" }
    ],
    C: [
      { L: "C", word: "Cat", svg: "assets/img/animals/cat.jpg", name: "Cat", color: "#FFA726" },
      { L: "C", word: "Cherry", svg: "assets/img/fruits/art/cherry.svg", name: "Cherry", color: "#C2185B" },
      { L: "C", word: "Car", svg: "assets/img/vehicles/car.jpg", name: "Car", color: "#E53935" },
      { L: "C", word: "Cow", svg: "assets/img/animals/cow.jpg", name: "Cow", color: "#424242" }
    ],
    D: [
      { L: "D", word: "Dog", svg: "assets/img/animals/dog.jpg", name: "Dog", color: "#8D6E63" },
      { L: "D", word: "Drum", svg: "assets/img/objects/drum.svg", name: "Drum", color: "#E53935" },
      { L: "D", word: "Duck", svg: "assets/img/animals/duck.jpg", name: "Duck", color: "#FBC02D" },
      { L: "D", word: "Deer", svg: "assets/img/animals/deer.jpg", name: "Deer", color: "#A1887F" }
    ],
    E: [
      { L: "E", word: "Elephant", svg: "assets/img/animals/elephant.jpg", name: "Elephant", color: "#78909C" },
      { L: "E", word: "Eagle", svg: "assets/img/birds/eagle.jpg", name: "Eagle", color: "#4E342E" }
    ],
    F: [
      { L: "F", word: "Fish", svg: "assets/img/animals/fish.jpg", name: "Fish", color: "#FF7043" },
      { L: "F", word: "Flamingo", svg: "assets/img/birds/flamingo.jpg", name: "Flamingo", color: "#F06292" },
      { L: "F", word: "Fox", svg: "assets/img/animals/fox.jpg", name: "Fox", color: "#E64A19" },
      { L: "F", word: "Frog", svg: "assets/img/animals/frog.jpg", name: "Frog", color: "#43A047" }
    ],
    G: [
      { L: "G", word: "Grapes", svg: "assets/img/fruits/art/grapes.svg", name: "Grapes", color: "#9C27B0" },
      { L: "G", word: "Giraffe", svg: "assets/img/animals/giraffe.jpg", name: "Giraffe", color: "#FFA000" },
      { L: "G", word: "Goat", svg: "assets/img/animals/goat.jpg", name: "Goat", color: "#8D6E63" }
    ],
    H: [
      { L: "H", word: "Horse", svg: "assets/img/animals/horse.jpg", name: "Horse", color: "#6D4C41" },
      { L: "H", word: "Hen", svg: "assets/img/animals/hen.jpg", name: "Hen", color: "#D84315" },
      { L: "H", word: "Helicopter", svg: "assets/img/vehicles/helicopter.jpg", name: "Helicopter", color: "#00ACC1" }
    ],
    I: [
      { L: "I", word: "Ice cream", svg: "assets/img/objects/icecream.svg", name: "Ice cream", color: "#FF4081" }
    ],
    J: [
      { L: "J", word: "Jug", svg: "assets/img/objects/jug.svg", name: "Jug", color: "#00BCD4" }
    ],
    K: [
      { L: "K", word: "Kite", svg: "assets/img/objects/kite.svg", name: "Kite", color: "#E91E63" }
    ],
    L: [
      { L: "L", word: "Lion", svg: "assets/img/animals/lion.jpg", name: "Lion", color: "#D6941F" },
      { L: "L", word: "Lotus", svg: "assets/img/flowers/lotus.jpg", name: "Lotus", color: "#EC407A" }
    ],
    M: [
      { L: "M", word: "Mango", svg: "assets/img/fruits/art/mango.svg", name: "Mango", color: "#FFA000" },
      { L: "M", word: "Monkey", svg: "assets/img/animals/monkey.jpg", name: "Monkey", color: "#795548" },
      { L: "M", word: "Motorcycle", svg: "assets/img/vehicles/motorcycle.jpg", name: "Motorcycle", color: "#D32F2F" }
    ],
    N: [
      { L: "N", word: "Nest", svg: "assets/img/objects/nest.svg", name: "Nest", color: "#6D4C41" }
    ],
    O: [
      { L: "O", word: "Orange", svg: "assets/img/fruits/art/orange.svg", name: "Orange", color: "#FF7700" },
      { L: "O", word: "Owl", svg: "assets/img/birds/owl.jpg", name: "Owl", color: "#5D4037" }
    ],
    P: [
      { L: "P", word: "Pineapple", svg: "assets/img/fruits/art/pineapple.svg", name: "Pineapple", color: "#FFB300" },
      { L: "P", word: "Pomegranate", svg: "assets/img/objects/pomegranate.jpg", name: "Pomegranate", color: "#C62828" },
      { L: "P", word: "Peacock", svg: "assets/img/birds/peacock.jpg", name: "Peacock", color: "#1565C0" },
      { L: "P", word: "Panda", svg: "assets/img/animals/panda.jpg", name: "Panda", color: "#212121" },
      { L: "P", word: "Parrot", svg: "assets/img/animals/parrot.jpg", name: "Parrot", color: "#43A047" },
      { L: "P", word: "Penguin", svg: "assets/img/birds/penguin.jpg", name: "Penguin", color: "#37474F" }
    ],
    Q: [
      { L: "Q", word: "Queen", svg: "assets/img/objects/queen.svg", name: "Queen", color: "#FFB300" }
    ],
    R: [
      { L: "R", word: "Rabbit", svg: "assets/img/animals/rabbit.jpg", name: "Rabbit", color: "#78909C" },
      { L: "R", word: "Rose", svg: "assets/img/flowers/rose.jpg", name: "Rose", color: "#E91E63" },
      { L: "R", word: "Rocket", svg: "assets/img/vehicles/rocket.jpg", name: "Rocket", color: "#C2185B" },
      { L: "R", word: "Rooster", svg: "assets/img/animals/rooster.jpg", name: "Rooster", color: "#D32F2F" }
    ],
    S: [
      { L: "S", word: "Strawberry", svg: "assets/img/fruits/art/strawberry.svg", name: "Strawberry", color: "#FF1744" },
      { L: "S", word: "Sunflower", svg: "assets/img/flowers/sunflower.jpg", name: "Sunflower", color: "#FBC02D" },
      { L: "S", word: "Swan", svg: "assets/img/birds/swan.jpg", name: "Swan", color: "#ECEFF1" },
      { L: "S", word: "Sheep", svg: "assets/img/animals/sheep.jpg", name: "Sheep", color: "#9E9E9E" }
    ],
    T: [
      { L: "T", word: "Tomato", svg: "assets/img/objects/tomato.svg", name: "Tomato", color: "#E53935" },
      { L: "T", word: "Tiger", svg: "assets/img/animals/tiger.jpg", name: "Tiger", color: "#E65100" },
      { L: "T", word: "Train", svg: "assets/img/vehicles/train.jpg", name: "Train", color: "#1976D2" },
      { L: "T", word: "Tractor", svg: "assets/img/vehicles/tractor.jpg", name: "Tractor", color: "#2E7D32" }
    ],
    U: [
      { L: "U", word: "Umbrella", svg: "assets/img/objects/umbrella.jpg", name: "Umbrella", color: "#7C4DFF" }
    ],
    V: [
      { L: "V", word: "Van", svg: "assets/img/objects/van.svg", name: "Van", color: "#00ACC1" }
    ],
    W: [
      { L: "W", word: "Watermelon", svg: "assets/img/fruits/art/watermelon.svg", name: "Watermelon", color: "#00E676" },
      { L: "W", word: "Watch", svg: "assets/img/objects/watch.svg", name: "Watch", color: "#FF5722" }
    ],
    X: [
      { L: "X", word: "Xylophone", svg: "assets/img/objects/xylophone.jpg", name: "Xylophone", color: "#FF4081" }
    ],
    Y: [
      { L: "Y", word: "Yarn", svg: "assets/img/objects/yarn.svg", name: "Yarn", color: "#E91E63" },
      { L: "Y", word: "Yo-yo", svg: "assets/img/objects/yo-yo.svg", name: "Yo-yo", color: "#D32F2F" }
    ],
    Z: [
      { L: "Z", word: "Zebra", svg: "assets/img/animals/zebra.jpg", name: "Zebra", color: "#424242" }
    ]
  };

  // Every line the scene says, recorded by scripts/voice/harvest.js (else: the device voice). A wrong tap is spoken
  // in two recorded parts ("B is for Ball!" + "Find the Apple."), so no letter pair needs its own clip.
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var out = [];
    Object.keys(ALPHABET_ITEMS).forEach(function (l) {
      ALPHABET_ITEMS[l].forEach(function (t) {
        out.push(t.L + " is for " + t.word + "! Find the " + t.word + ".", t.L + " is for " + t.word + "! Awesome!", t.L + " is for " + t.word + "!", "Find the " + t.word + ".");
      });
    });
    return out;
  });

  Kido.Scene.register("scene-apple", {
    music: "orchard", bg: "bg-orchard",
    build: function (api) {
      var cfg = api.cfg || {};
      var opts = Math.max(2, Math.min(4, cfg.optionsPerQuestion || 3));
      var totalRounds = Math.max(3, Math.min(5, cfg.rounds || 4));


      var ALL_LETTERS = Object.keys(ALPHABET_ITEMS);

      // Helper to sample one item for a letter
      function getItemForLetter(l) {
        var list = ALPHABET_ITEMS[l];
        if (!list || !list.length) return null;
        return api.pick ? api.pick(list) : list[Math.floor(Math.random() * list.length)];
      }

      // Decorative Orchard Scenery
      var groundLayer = api.layers.ground || api.stage;
      var midLayer = api.layers.mid || api.layers.ground || api.stage;
      var skyLayer = api.layers.sky || api.stage;

      groundLayer.appendChild(api.el("div", { class: "ground-strip ground-green" }));

      // Wooden harvest table / garden display
      groundLayer.appendChild(api.el("div", { class: "orchard-table" }));

      // 3D Realistic Wicker Basket
      var basketWrap = api.el("div", { class: "basket-composite" });
      var basketBack = api.el("div", { class: "basket-back-layer", html: '<img src="assets/img/fruits/basket-back.svg" alt="basket back">' });
      var basketContents = api.el("div", { class: "basket-contents-layer" });
      var basketFront = api.el("div", { class: "basket-front-layer", html: '<img src="assets/img/fruits/basket-front.svg" alt="basket front">' });
      basketWrap.appendChild(basketBack);
      basketWrap.appendChild(basketContents);
      basketWrap.appendChild(basketFront);
      api.place(basketWrap, 500, 405, { layer: "props" });

      // Momo character on the left side
      var momo = api.char("momo", 140, 410, { size: 200, className: "guide-momo" });
      momo.set("happy");

      // Setup target rounds (e.g. A, G, U, X, or diverse letters across A to Z)
      var targetLetters = ["A", "G", "U", "X", "B", "M", "S", "T", "F", "P", "C", "D"];
      var shuffledLetters = api.shuffle(targetLetters);
      // Ensure 'A' or 'G' is in the set
      var selectedLetters = shuffledLetters.slice(0, totalRounds);

      var targets = selectedLetters.map(function (ltr) {
        return getItemForLetter(ltr);
      });

      var idx = 0, correct = 0;
      var basketFruitCount = 0;
      step();

      function step() {
        if (idx >= targets.length) {
          api.finish(correct, targets.length);
          return;
        }
        api.setProgress(idx, targets.length);
        var t = targets[idx], clean = true;

        // Pick distinct decoy letters
        var decoyLetters = api.shuffle(ALL_LETTERS.filter(function (l) { return l !== t.L; })).slice(0, opts - 1);
        var decoyItems = decoyLetters.map(function (dl) {
          return getItemForLetter(dl);
        });

        // 3 Distinct objects: target + distractors (e.g. Grapes, Umbrella, Xylophone)
        var choices = api.shuffle([t].concat(decoyItems));
        var objectCards = [];
        var spacing = choices.length === 2 ? 180 : (choices.length === 3 ? 164 : 152);
        var startX = 500 - (choices.length - 1) * spacing / 2;

        choices.forEach(function (item, i) {
          var cx = startX + i * spacing;
          var card = makeObjectCard(item);
          api.place(card, cx, 205, { layer: "actors" });
          api.tween(card, [
            { opacity: 0, transform: "translate(-50%,-50%) scale(.3) translateY(-40px)" },
            { opacity: 1, transform: "translate(-50%,-50%) scale(1) translateY(0)" }
          ], { duration: 360, delay: i * 80 });

          objectCards.push(card);
          api.tap(card, function () { onPick(item, card, cx); });
        });

        // Prompt text & audio
        var promptText = t.L + " is for " + t.word + "! Find the " + t.word + ".";
        momo.set("thinking");
        api.say(promptText, {
          peek: '<img src="' + t.svg + '" alt="' + t.word + '" style="width:40px;height:40px;object-fit:contain;">',
          id: "apple-" + t.L
        });


        function onPick(pickedItem, card, cx) {
          if (pickedItem.L === t.L) {
            // Correct answer tapped!
            // Fade out the other options
            objectCards.forEach(function (c) {
              if (c !== card) {
                api.tween(c, [{ opacity: 1 }, { opacity: 0, transform: "translate(-50%,-50%) scale(.4)" }], { duration: 250 })
                  .then(function () { c.remove(); });
              }
            });

            api.correct({ at: [cx, 230] });
            momo.set("celebrating");
            momo.pose("nod");

            // Spoken feedback for correct answer
            var cheerText = t.L + " is for " + t.word + "! Awesome!";
            if (Kido.audio && Kido.audio.speak) {
              Kido.audio.speak(cheerText, { lang: "en-US" });
            }

            // Swoop winning 3D object into the harvest basket
            api.tween(card, [
              { left: cx + "px", top: "205px", transform: "translate(-50%,-50%) scale(1)" },
              { left: "500px", top: "385px", transform: "translate(-50%,-50%) scale(.6)" }
            ], { duration: 520, easing: "cubic-bezier(.5,0,.7,1)" }).then(function () {
              card.remove();
              addFruitToBasket(t);
            });

            if (clean) correct++;
            api.wait(2200).then(function () {
              idx++;
              step();
            });
          } else {
            // Decoy item tapped!
            // Narrator speaks the tapped object's phonetics and prompts for target
            clean = false;
            api.encourage();

            var decoyFeedback = pickedItem.L + " is for " + pickedItem.word + "! Find the " + t.word + ".";
            api.say(decoyFeedback, {
              parts: [pickedItem.L + " is for " + pickedItem.word + "!", "Find the " + t.word + "."],
              peek: '<img src="' + pickedItem.svg + '" alt="' + pickedItem.word + '" style="width:36px;height:36px;object-fit:contain;">',
              id: "decoy-" + pickedItem.L
            });


            // Gentle shake animation
            api.tween(card, [
              { transform: "translate(-50%,-50%) rotate(-12deg) scale(1.05)" },
              { transform: "translate(-50%,-50%) rotate(12deg) scale(1.05)" },
              { transform: "translate(-50%,-50%) rotate(-8deg) scale(1)" },
              { transform: "translate(-50%,-50%) rotate(0) scale(1)" }
            ], { duration: 380 });
          }
        }
      }

      function addFruitToBasket(item) {
        basketFruitCount++;
        var positions = [
          { left: "38%", top: "40%", rot: -10 },
          { left: "62%", top: "40%", rot: 12 },
          { left: "50%", top: "28%", rot: -2 },
          { left: "30%", top: "26%", rot: -16 },
          { left: "70%", top: "26%", rot: 18 },
          { left: "50%", top: "8%", rot: 0 }
        ];
        var pos = positions[(basketFruitCount - 1) % positions.length];
        var stacked = api.el("div", {
          class: "basket-stacked-fruit",
          style: "left:" + pos.left + "; top:" + pos.top + "; transform: translate(-50%,-50%) rotate(" + pos.rot + "deg);",
          html: '<img src="' + item.svg + '" alt="' + item.word + '" style="width:100%;height:100%;object-fit:contain;">'
        });
        basketContents.appendChild(stacked);

        // Elastic basket jiggle
        basketWrap.classList.remove("basket-jiggle");
        void basketWrap.offsetWidth;
        basketWrap.classList.add("basket-jiggle");

        // Celebration sparkle
        api.particles.sparkle(500, 420, { count: 8 });
        if (Kido.audio && Kido.audio.pop) Kido.audio.pop();
      }

      // 3D Object Card without letter badges (clean 3D realistic objects)
      function makeObjectCard(item) {
        return api.el("div", {
          class: "actor actor--tappable fruit-card-3d",
          style: "width: 122px; height: 122px;",
          html: '<img class="fruit-img" src="' + item.svg + '" alt="' + item.word + '">'
        });
      }
    }
  });
})(window);
