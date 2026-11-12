/* =========================================================================
   catalog.js — World map + activity catalog
   Defines the "Learning World" regions and every activity. Each activity has
   a build(cfg) that turns content data + the age config into an engine SPEC.
   Difficulty scales through cfg (optionsPerQuestion, rounds, maxNumber, ...).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var C = Kido.content;
  var U = Kido.util;

  /* ---- helpers ---- */
  function cfg() { return Kido.age.cfg(); }
  function nOpts() { return cfg().optionsPerQuestion; }
  function nRounds() { return cfg().rounds; }

  function letterOpt(letter) { return { html: letter, correct: false, speak: letter }; }
  // One art source: registry SVG when the species has authored art, else the
  // honest emoji fallback. Guarded by hasArt so shapes/body/flowers/vehicles/
  // letters (no art) keep their emoji unchanged. `pic:true` tells the quiz
  // renderer to treat it as a picture card even though the SVG has no plain text.
  function creatureHtml(key, fallback, name) {
    if (Kido.creatures) {
      if (key && Kido.creatures.hasArt(key)) return Kido.creatures.render(key, { name: name });
      if (fallback && Kido.creatures.hasArt(fallback)) return Kido.creatures.render(fallback, { name: name });
    }
    return fallback || key;
  }
  function emojiOpt(item, correctKey) {
    return { html: creatureHtml(item.key, item.emoji, item.name), correct: item.key === correctKey, speak: item.name, fact: item.fact, pic: true };
  }

  // Pick `count` items from list ensuring `must` is included.
  function withDistractors(list, must, count, keyFn) {
    var others = list.filter(function (x) { return keyFn(x) !== keyFn(must); });
    return U.shuffle([must].concat(U.sample(others, Math.max(0, count - 1))));
  }

  /* ================= ALPHABET ================= */
  function buildAlphabetFind() {
    var pool = C.alphabet.slice(0, cfg().difficulty <= 2 ? 8 : (cfg().difficulty <= 4 ? 16 : 26));
    var picks = U.sample(pool, nRounds());
    var rounds = picks.map(function (p) {
      var chosen = (p.words && p.words.length) ? U.pick(p.words) : p;
      var word = chosen.word || p.word;
      var key = chosen.key || p.key || chosen.img || p.img;
      var emoji = chosen.emoji || p.emoji;
      var opts = withDistractors(C.alphabet, p, nOpts(), function (x) { return x.L; })
        .map(function (x) { return { html: x.L, correct: x.L === p.L, speak: x.L }; });
      return {
        showcase: creatureHtml(key || (word && word.toLowerCase()), emoji, word), showcaseClass: "showcase",
        prompt: "",
        say: p.L + " is for " + word + "! Tap on " + p.L + ".", options: opts
      };
    });
    return { type: "quiz", instruction: "", narrateOptions: false, lang: "en", rounds: rounds };
  }
  function buildAlphabetMatch() {
    var picks = U.sample(C.alphabet, Math.min(4, nOpts() + 1));
    return {
      type: "match", instruction: "Drag each picture to its letter!",
      rounds: [{ prompt: "Match the letter to its picture", pairs: picks.map(function (p) {
        var chosen = (p.words && p.words.length) ? U.pick(p.words) : p;
        var word = chosen.word || p.word;
        var key = chosen.key || p.key || chosen.img || p.img;
        var emoji = chosen.emoji || p.emoji;
        return { id: p.L, key: { emoji: p.L }, value: { emoji: creatureHtml(key || (word && word.toLowerCase()), emoji, word), label: word } };
      }) }]
    };
  }

  /* ================= NUMBERS ================= */
  var COUNT_FRUITS = [
    { name: "Apple", plural: "Apples", img: "assets/img/fruits/art/apple.svg" },
    { name: "Strawberry", plural: "Strawberries", img: "assets/img/fruits/art/strawberry.svg" },
    { name: "Orange", plural: "Oranges", img: "assets/img/fruits/art/orange.svg" },
    { name: "Banana", plural: "Bananas", img: "assets/img/fruits/art/banana.svg" },
    { name: "Watermelon", plural: "Watermelons", img: "assets/img/fruits/art/watermelon.svg" },
    { name: "Cherry", plural: "Cherries", img: "assets/img/fruits/art/cherry.svg" },
    { name: "Mango", plural: "Mangoes", img: "assets/img/fruits/art/mango.svg" },
    { name: "Pineapple", plural: "Pineapples", img: "assets/img/fruits/art/pineapple.svg" },
    { name: "Grapes", plural: "Grapes", img: "assets/img/fruits/art/grapes.svg" }
  ];

  function buildCount() {
    var max = Math.min(cfg().maxNumber, 6);
    var rounds = [];
    var totalRounds = nRounds();
    for (var i = 0; i < totalRounds; i++) {
      var n = U.randInt(1, max);
      // First round always showcases the realistic 3D Apple, subsequent rounds sample delicious fruits
      var fruit = (i === 0) ? COUNT_FRUITS[0] : COUNT_FRUITS[i % COUNT_FRUITS.length];
      var itemHtml = '<span class="count-fruit-wrap"><img class="count-fruit-img" src="' + fruit.img + '" alt="' + fruit.name + '" /></span>';
      var row = new Array(n).fill(itemHtml).join("");
      var correct = { html: String(n), correct: true, speak: String(n) };
      var opts = [correct];
      var used = { }; used[n] = 1;
      while (opts.length < nOpts()) {
        var d = U.randInt(1, Math.max(max, n + 2));
        if (!used[d]) { used[d] = 1; opts.push({ html: String(d), correct: false, speak: String(d) }); }
      }
      rounds.push({
        showcase: row,
        showcaseClass: "count-row",
        prompt: "How many?",
        say: "How many " + (n === 1 ? fruit.name.toLowerCase() + "s" : fruit.plural.toLowerCase()) + "?",
        options: opts
      });
    }
    return {
      type: "quiz",
      activityId: "count",
      bg: "game--orchard",
      instruction: "Count the fruits and tap the number!",
      rounds: rounds
    };
  }
  function buildSequence() {
    var max = cfg().maxNumber;
    var rounds = [];
    for (var i = 0; i < nRounds(); i++) {
      var start = U.randInt(1, Math.max(1, max - 4));
      var seq = [start, start + 1, start + 2, start + 3];
      var missing = U.randInt(1, 2); // hide index 1 or 2
      var display = seq.map(function (v, idx) { return idx === missing ? '<span class="seq__box q">?</span>' : '<span class="seq__box filled">' + v + '</span>'; }).join("");
      var answer = seq[missing];
      var opts = [{ html: String(answer), correct: true, speak: String(answer) }];
      var used = {}; used[answer] = 1;
      while (opts.length < nOpts()) { var d = answer + U.randInt(-nOpts(), nOpts()); if (d > 0 && !used[d]) { used[d] = 1; opts.push({ html: String(d), correct: false, speak: String(d) }); } }   // +-nOpts: always enough numbers above 0 (+-2 froze the app for 5+ options)
      rounds.push({ showcase: '<div class="seq__track">' + display + '</div>', showcaseClass: "", prompt: "What number is missing?", say: "What comes next?", options: opts });
    }
    return { type: "quiz", instruction: "Find the missing number!", rounds: rounds };
  }
  function buildMoreLess() {
    var cap = Math.min(6, Math.max(3, cfg().maxNumber));
    var rounds = [];
    for (var i = 0; i < nRounds(); i++) {
      var a = U.randInt(1, cap), b = U.randInt(1, cap);
      while (b === a) b = U.randInt(1, cap);
      var fruit = COUNT_FRUITS[i % COUNT_FRUITS.length];
      function grp(k) {
        return '<div class="count-mini-group">' +
          new Array(k).fill('<span class="count-fruit-wrap"><img class="count-fruit-img count-fruit-img--mini" src="' + fruit.img + '" alt="' + fruit.name + '" /></span>').join("") +
          '</div>';
      }
      var more = Math.max(a, b);
      rounds.push({
        prompt: "Which group has <b>more</b>?", say: "Which has more?",
        options: [
          { html: grp(a), correct: a > b, speak: a + "" },
          { html: grp(b), correct: b > a, speak: b + "" }
        ]
      });
      void more;
    }
    return { type: "quiz", bg: "game--orchard", instruction: "Tap the group with more!", rounds: rounds };
  }
  function buildNumberOrder() {
    var max = cfg().maxNumber;
    var count = Math.min(5, 2 + cfg().difficulty);
    var rounds = [];
    for (var i = 0; i < Math.max(3, nRounds() - 1); i++) {
      var start = U.randInt(1, Math.max(1, max - count));
      var items = [];
      for (var k = 0; k < count; k++) items.push({ html: String(start + k), speak: String(start + k) });
      rounds.push({ prompt: "Tap the numbers from small to big", items: items });
    }
    return { type: "order", instruction: "Put the numbers in order, smallest first!", rounds: rounds };
  }

  /* ================= SHAPES ================= */
  function buildShapeFind() {
    var picks = U.sample(C.shapes, nRounds());
    var rounds = picks.map(function (s) {
      var opts = withDistractors(C.shapes, s, nOpts(), function (x) { return x.key; }).map(function (x) {
        var opt = emojiOpt(x, s.key);
        opt.fact = x.fact;
        return opt;
      });
      return { prompt: "Find the <b>" + s.name + "</b>", say: "Find the " + s.name, fact: s.fact, options: opts };
    });
    return { type: "quiz", instruction: "Find the right shape!", rounds: rounds };
  }

  /* ================= HINDI ================= */
  function buildHindi(list, label) {
    var pool = list.slice(0, cfg().difficulty <= 2 ? 8 : list.length);
    var picks = U.sample(pool, Math.min(nRounds(), pool.length));
    var rounds = picks.map(function (p) {
      var word = p.word;
      var meaning = p.meaning || "";
      var key = p.key || p.img;
      var emoji = p.emoji;
      var opts = withDistractors(list, p, nOpts(), function (x) { return x.L; }).map(function (x) {
        return { html: x.L, correct: x.L === p.L, speak: x.L };
      });
      var sayText = p.L + " से " + word + "! " + p.L + " चुनो";
      var factText = p.L + " से " + word + (meaning ? " (" + meaning + ")" : "") + "! बहुत बढ़िया!";
      return {
        showcase: creatureHtml(key || emoji, emoji, word),
        say: sayText,
        prompt: "",
        fact: factText,
        options: opts
      };
    });
    return { type: "quiz", instruction: "", narrateOptions: false, bg: "game--hindi", lang: "hi", rounds: rounds };
  }
  function buildHindiMatch() {
    var picks = U.sample(C.hindiVyanjan.concat(C.hindiSwar), 4);
    return { type: "match", lang: "hi", bg: "game--hindi",
      rounds: [{ pairs: picks.map(function (p) {
        var word = p.word;
        var meaning = p.meaning || "";
        var key = p.key || p.img;
        var emoji = p.emoji;
        return {
          id: p.L,
          key: { emoji: p.L },
          value: { emoji: creatureHtml(key || emoji, emoji, word), label: word + (meaning ? " (" + meaning + ")" : "") }
        };
      }) }] };
  }

  /* ================= ANIMALS / BIRDS / VEHICLES ================= */
  function soundboardSpec(list, sound, title, categoryId, activityId, name) {
    var items = U.sample(list, Math.min(9, list.length)).map(function (x) {
      return { key: x.key, emoji: x.emoji, name: x.name, sound: sound };
    });
    return { type: "soundboard", title: title, hint: "Tap a picture to hear it!", items: items,
      categoryId: categoryId, activityId: activityId, name: name };
  }
  function findSpec(list, instruction, bg) {
    var picks = U.sample(list, nRounds());
    var rounds = picks.map(function (p) {
      var opts = withDistractors(list, p, nOpts(), function (x) { return x.key; }).map(function (x) { return emojiOpt(x, p.key); });
      return { prompt: "Find the <b>" + p.name + "</b>", say: "Find the " + p.name, options: opts };
    });
    return { type: "quiz", instruction: instruction, rounds: rounds, bg: bg || "" };
  }
  function buildAnimalBabies() {
    // A baby card must show a real baby: the species' own portrait when that is a young animal, else its
    // babyImg. A species whose only photo is an adult (adultPortrait) joins only once it has a babyImg.
    // adultImg: the mother card shows a real adult when the species' own portrait is a young animal.
    var picks = U.sample(C.animals.filter(function (a) { return a.baby && (a.babyImg || !a.adultPortrait); }), 4);
    return { type: "match", instruction: "Match each baby to its mother!",
      rounds: [{ prompt: "Whose baby is this?", pairs: picks.map(function (a) {
        return { id: a.key, key: { emoji: a.adultImg ? photoHtml(a.key + "-adult", a.adultImg, a.name) : creatureHtml(a.key, a.emoji, a.name) }, value: { emoji: a.babyImg ? photoHtml(a.key + "-baby", a.babyImg, a.baby, a.babyFlip) : creatureHtml(a.key, a.babyEmoji, a.baby), label: a.baby } };
      }) }] };
  }
  function photoHtml(id, src, label, flip) {   // same markup as Kido.creatures.render, so the card styles apply unchanged
    return '<span class="kido-creature" data-creature="' + id + '" role="img" aria-label="' + label + '">' +
      '<img class="creature-img' + (flip ? ' is-flipped' : '') + '" src="' + src + '" alt="' + label + '" draggable="false"/></span>';
  }

  /* ================= HABITS ================= */
  function buildHabitRoutine() {
    var order = ["wakeup", "brush", "breakfast", "bag"];
    var map = {}; C.habits.forEach(function (h) { map[h.key] = h; });
    var items = order.map(function (k) {
      var h = map[k];
      var html = h.img ? '<img class="habit-step-img" src="' + h.img + '" alt="' + h.name + '" draggable="false" />' : h.emoji;
      return { html: html, speak: h.name };
    });
    return { type: "order", instruction: "Get ready for school — tap the steps in order!", bg: "game--home",
      rounds: [{ prompt: "Morning routine: what comes first?", items: items }] };
  }
  function buildHabitChoose() {
    var scenarios = [
      { q: "You wake up. What do you do first?", good: "brush", bad: "sleep", say: "You wake up! What do you do first?" },
      { q: "Before eating, what do you do?", good: "hands", bad: "toys", say: "Before eating delicious food, what do you do?" },
      { q: "It is bedtime. What do you do?", good: "sleep", bad: "exercise", say: "It is bedtime! What do you do?" },
      { q: "You finished playing. What do you do?", good: "toys", bad: "wakeup", say: "You finished playing! What do you do with toys?" },
      { q: "You feel thirsty. What do you do?", good: "water", bad: "comb", say: "You feel thirsty! What do you drink?" },
      { q: "A friend needs help. What do you do?", good: "help", bad: "toys", say: "A friend needs help! What do you do?" }
    ];
    var map = {}; C.habits.forEach(function (h) { map[h.key] = h; });
    function habitCardHtml(h) {
      if (h.img) {
        return '<div class="habit-opt-card"><img src="' + h.img + '" alt="' + h.name + '" class="habit-opt-card__img" /><span class="habit-opt-card__name">' + h.name + '</span></div>';
      }
      return '<div class="habit-opt-card"><span class="habit-opt-card__emoji">' + h.emoji + '</span><span class="habit-opt-card__name">' + h.name + '</span></div>';
    }
    var rounds = U.sample(scenarios, Math.min(nRounds(), scenarios.length)).map(function (s) {
      var goodHabit = map[s.good];
      var badHabit = map[s.bad];
      return {
        prompt: s.q,
        say: s.say || s.q,
        options: U.shuffle([
          { html: habitCardHtml(goodHabit), correct: true, speak: goodHabit.name, pic: true },
          { html: habitCardHtml(badHabit), correct: false, speak: badHabit.name, pic: true }
        ])
      };
    });
    return { type: "quiz", instruction: "Pick the good habit!", bg: "game--home", rounds: rounds };
  }

  /* ================= CONCEPTS: big & small, tall & short, hot & cold, good & bad habits ================= */
  // Big & small: the same picture at two (older: three) sizes in equal cards. Animals, fruits, vehicles.
  function sizePicture() {
    var pool = [];
    C.animals.forEach(function (a) { if (Kido.creatures && Kido.creatures.hasArt(a.key)) pool.push({ name: a.name, html: creatureHtml(a.key, a.emoji, a.name) }); });
    C.fruits.forEach(function (f) { if (f.img) pool.push({ name: f.name, html: '<img src="' + f.img + '" alt="' + f.name + '" draggable="false"/>' }); });
    (C.vehicles || []).forEach(function (v) { if (v.img) pool.push({ name: v.name, html: '<img src="' + v.img + '" alt="' + v.name + '" draggable="false"/>' }); });
    return U.pick(pool);
  }
  function buildBigSmall() {
    var three = cfg().difficulty >= 3;
    var rounds = [];
    for (var i = 0; i < nRounds(); i++) {
      var thing = sizePicture(), askBig = Math.random() < 0.5;
      var sizes = three ? [1, 0.68, 0.38] : [1, 0.42];
      var word = three ? (askBig ? "biggest" : "smallest") : (askBig ? "big" : "small");
      rounds.push({
        prompt: "Which one is " + word.toUpperCase() + "?",
        say: "Which " + thing.name.toLowerCase() + " is " + (three ? "the " : "") + word + "?",
        fact: "Yes! That " + thing.name.toLowerCase() + " is " + word + "!",
        options: sizes.map(function (s, k) {
          var right = askBig ? k === 0 : k === sizes.length - 1;
          return { pic: true, correct: right, speak: right ? word : "", html: '<span class="cmp-pic" style="--s:' + s + '">' + thing.html + '</span>' };
        })
      });
    }
    return { type: "quiz", instruction: "Big and small! Look at the sizes.", narrateOptions: false, rounds: rounds };
  }

  // Tall & short: original drawings of a tree, pencil, candle, building and flower at different heights.
  var TALL_THINGS = {
    tree: function (h) { var top = 96 - h, ry = Math.min(18, h * 0.3), rx = ry * 1.22;   // a short tree keeps a visible trunk
      return '<rect x="45" y="' + (top + ry) + '" width="10" height="' + (h - ry) + '" rx="3" fill="#92400E"/>' +
        '<ellipse cx="50" cy="' + (top + ry) + '" rx="' + rx + '" ry="' + ry + '" fill="#22C55E"/><ellipse cx="' + (50 - rx * 0.32) + '" cy="' + (top + ry * 0.78) + '" rx="' + rx * 0.45 + '" ry="' + ry * 0.45 + '" fill="#4ADE80"/>'; },
    pencil: function (h) { var top = 96 - h;
      return '<polygon points="42,' + (top + 16) + ' 58,' + (top + 16) + ' 50,' + top + '" fill="#FDE68A"/><polygon points="47,' + (top + 6) + ' 53,' + (top + 6) + ' 50,' + top + '" fill="#1F2937"/>' +
        '<rect x="42" y="' + (top + 16) + '" width="16" height="' + (h - 26) + '" fill="#FACC15"/><rect x="42" y="' + (top + 16) + '" width="5" height="' + (h - 26) + '" fill="#EAB308"/>' +
        '<rect x="42" y="86" width="16" height="10" rx="2" fill="#F472B6"/>'; },
    candle: function (h) { var top = 96 - h;
      return '<ellipse cx="50" cy="' + (top + 6) + '" rx="5" ry="8" fill="#F97316"/><ellipse cx="50" cy="' + (top + 8) + '" rx="2.5" ry="4" fill="#FDE047"/>' +
        '<line x1="50" y1="' + (top + 13) + '" x2="50" y2="' + (top + 18) + '" stroke="#1F2937" stroke-width="1.5"/>' +
        '<rect x="40" y="' + (top + 18) + '" width="20" height="' + (h - 18) + '" rx="3" fill="#FEF3C7" stroke="#FCD34D"/>'; },
    building: function (h) { var top = 96 - h, s = '';
      for (var y = top + 8; y < 88; y += 12) s += '<rect x="38" y="' + y + '" width="7" height="6" fill="#FEF08A"/><rect x="55" y="' + y + '" width="7" height="6" fill="#FEF08A"/>';
      return '<rect x="32" y="' + top + '" width="36" height="' + h + '" rx="2" fill="#3B82F6"/>' + s + '<rect x="46" y="86" width="8" height="10" fill="#1E3A8A"/>'; },
    flower: function (h) { var top = 96 - h;
      return '<line x1="50" y1="96" x2="50" y2="' + (top + 12) + '" stroke="#16A34A" stroke-width="3"/>' +
        '<ellipse cx="44" cy="' + (96 - h * 0.35) + '" rx="7" ry="3" fill="#22C55E" transform="rotate(-25 44 ' + (96 - h * 0.35) + ')"/>' +
        '<circle cx="50" cy="' + (top + 10) + '" r="10" fill="#F472B6"/><circle cx="50" cy="' + (top + 10) + '" r="4" fill="#FDE047"/>'; }
  };
  function tallSvg(kind, h) {
    return '<svg class="cmp-tall" viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' + TALL_THINGS[kind](h) + '</svg>';
  }
  function buildTallShort() {
    var three = cfg().difficulty >= 3, kinds = Object.keys(TALL_THINGS), rounds = [];
    for (var i = 0; i < nRounds(); i++) {
      var kind = U.pick(kinds), askTall = Math.random() < 0.5;
      var heights = three ? [90, 62, 36] : [90, 38];
      var word = three ? (askTall ? "tallest" : "shortest") : (askTall ? "tall" : "short");
      rounds.push({
        prompt: "Which one is " + word.toUpperCase() + "?",
        say: "Which " + kind + " is " + (three ? "the " : "") + word + "?",
        fact: "Yes! That " + kind + " is " + word + "!",
        options: heights.map(function (h, k) {
          var right = askTall ? k === 0 : k === heights.length - 1;
          return { pic: true, correct: right, speak: right ? word : "", html: tallSvg(kind, h) };
        })
      });
    }
    return { type: "quiz", instruction: "Tall and short! Look how high they go.", narrateOptions: false, rounds: rounds };
  }

  // Two big coloured answers under a picture; the truth is spoken after either tap.
  function classifyRound(item, question, a, b) {
    var right = item.yes ? a : b, wrong = item.yes ? b : a;
    return {
      showcase: '<div class="cls-item"><span class="cls-item__pic">' + item.pic + '</span><span class="cls-item__name">' + item.name + '</span></div>',
      showcaseClass: "cls-showcase",
      prompt: question,
      say: item.name + ". " + question,
      fact: "Yes! " + item.fact,
      options: [
        { html: a.label, speak: a.word, cls: a.cls, correct: right === a, wrongSay: "Oops! " + item.fact },
        { html: b.label, speak: b.word, cls: b.cls, correct: right === b, wrongSay: "Oops! " + item.fact }
      ]
    };
  }
  var HOT_COLD = [
    { name: "Fire", pic: "🔥", yes: true, fact: "Fire is hot! Never touch it." },
    { name: "The sun", pic: '<img src="assets/img/space/planet-sun.svg" alt=""/>', yes: true, fact: "The sun is very hot!" },
    { name: "Hot tea", pic: "☕", yes: true, fact: "Tea is hot. Blow before you sip!" },
    { name: "Soup", pic: "🍲", yes: true, fact: "Soup is hot when it is cooked." },
    { name: "A candle flame", pic: "🕯️", yes: true, fact: "A candle flame is hot!" },
    { name: "A volcano", pic: "🌋", yes: true, fact: "A volcano is very, very hot!" },
    { name: "Ice", pic: "🧊", yes: false, fact: "Ice is cold!" },
    { name: "Snow", pic: "❄️", yes: false, fact: "Snow is cold!" },
    { name: "Ice cream", pic: '<img src="assets/img/objects/icecream.svg" alt=""/>', yes: false, fact: "Ice cream is cold and yummy!" },
    { name: "A snowman", pic: "⛄", yes: false, fact: "A snowman is made of cold snow!" },
    { name: "A snowy mountain", pic: "🏔️", yes: false, fact: "Snowy mountains are cold!" },
    { name: "A cold drink", pic: "🥤", yes: false, fact: "A drink with ice is cold!" }
  ];
  function buildHotCold() {
    var HOT = { label: "🔥 Hot", word: "Hot", cls: "opt--hot" }, COLD = { label: "❄️ Cold", word: "Cold", cls: "opt--cold" };
    return { type: "quiz", instruction: "Hot or cold? Tap the right one!", shuffleOptions: false, narrateOptions: false,
      rounds: U.sample(HOT_COLD, nRounds()).map(function (it) { return classifyRound(it, "Is it hot or cold?", HOT, COLD); }) };
  }
  function habitPic(key, emoji) {
    var h = (C.habits || []).filter(function (x) { return x.key === key; })[0];
    return h && h.img ? '<img src="' + h.img + '" alt="" draggable="false"/>' : emoji;
  }
  function goodBadHabits() {
    return [
      { name: "Brushing your teeth", pic: habitPic("brush", "🪥"), yes: true, fact: "Brushing your teeth is a good habit!" },
      { name: "Washing hands before eating", pic: habitPic("hands", "🧼"), yes: true, fact: "Washing hands before eating is a good habit!" },
      { name: "Drinking water", pic: habitPic("water", "💧"), yes: true, fact: "Drinking water is a good habit!" },
      { name: "Tidying your toys", pic: habitPic("toys", "🧸"), yes: true, fact: "Tidying your toys is a good habit!" },
      { name: "Eating fruits and vegetables", pic: '<img src="assets/img/fruits/art/carrot.svg" alt=""/>', yes: true, fact: "Eating fruits and vegetables is a good habit!" },
      { name: "Saying thank you", pic: "🙏", yes: true, fact: "Saying thank you is a good habit!" },
      { name: "Reading books", pic: "📚", yes: true, fact: "Reading books is a good habit!" },
      { name: "Sleeping on time", pic: habitPic("sleep", "🛌"), yes: true, fact: "Sleeping on time is a good habit!" },
      { name: "Helping others", pic: habitPic("help", "🤝"), yes: true, fact: "Helping others is a good habit!" },
      { name: "Eating too many sweets", pic: '<img src="assets/img/objects/food-donut.svg" alt=""/>', yes: false, fact: "Eating too many sweets is a bad habit. It hurts your teeth." },
      { name: "Watching the phone all day", pic: "📱", yes: false, fact: "Watching the phone all day is a bad habit. Go out and play!" },
      { name: "Throwing litter on the road", pic: "🚯", yes: false, fact: "Throwing litter on the road is a bad habit. Use the dustbin." },
      { name: "Leaving the tap running", pic: "🚰", yes: false, fact: "Leaving the tap running is a bad habit. Save water!" },
      { name: "Eating junk food every day", pic: '<img src="assets/img/objects/food-burger.svg" alt=""/>', yes: false, fact: "Eating junk food every day is a bad habit." },
      { name: "Shouting at others", pic: "😠", yes: false, fact: "Shouting is a bad habit. Talk softly and kindly." },
      { name: "Staying up very late", pic: "🌙", yes: false, fact: "Staying up very late is a bad habit. Sleep on time." },
      { name: "Pushing others", pic: "🤜", yes: false, fact: "Pushing others is a bad habit. Be gentle." },
      // 2026-11-10 (owner)
      { name: "Hitting someone", pic: "👊", yes: false, fact: "Hitting someone is a bad habit. It hurts. Use kind words instead." },
      { name: "Tearing books", pic: "📖", yes: false, fact: "Tearing books is a bad habit. Take good care of your books." },
      { name: "Putting your uniform and shoes in their place", pic: "👟", yes: true, fact: "Putting your uniform and shoes in their place is a good habit!" },
      { name: "Taking money without asking", pic: "💰", yes: false, fact: "Taking money without asking is a bad habit. Always ask a grown-up first." },
      { name: "Opening someone's bag without asking", pic: "🎒", yes: false, fact: "Opening someone's bag without asking is a bad habit. Always ask first." },
      { name: "Throwing things", pic: "🥎", yes: false, fact: "Throwing things is a bad habit. Things can break and people can get hurt." },
      { name: "Asking before you take something", pic: "🙋", yes: true, fact: "Asking before you take something is a good habit!" }
    ];
  }
  // every line the good/bad habit game says, so harvest.js records it in Momo's voice
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var out = []; goodBadHabits().forEach(function (h) { out.push(h.name + ". Good habit or bad habit?", "Yes! " + h.fact, "Oops! " + h.fact); }); return out;
  });
  function buildHabitGoodBad() {
    var GOOD = { label: "👍 Good habit", word: "Good habit", cls: "opt--good" }, BAD = { label: "👎 Bad habit", word: "Bad habit", cls: "opt--bad" };
    var all = goodBadHabits(), good = U.sample(all.filter(function (h) { return h.yes; }), Math.ceil(nRounds() / 2)),
        bad = U.sample(all.filter(function (h) { return !h.yes; }), Math.floor(nRounds() / 2));
    return { type: "quiz", instruction: "Good habit or bad habit? Tap green for good, red for bad!", shuffleOptions: false, narrateOptions: false,
      rounds: U.shuffle(good.concat(bad)).map(function (it) { return classifyRound(it, "Good habit or bad habit?", GOOD, BAD); }) };
  }

  /* ================= LETTER BOOKS: A to Z, and the Hindi varnamala ================= */
  function letterCard(L, small, pic) {
    return '<span class="abc-card"><span class="abc-card__L">' + L + (small ? '<small>' + small + '</small>' : '') + '</span>' +
      '<span class="abc-card__pic">' + pic + '</span></span>';
  }
  function cardPic(x) { return x.img ? '<img src="' + x.img + '" alt="" draggable="false"/>' : '<span class="abc-card__emoji">' + (x.emoji || "") + '</span>'; }
  function buildAlphabetBook() {
    return { type: "soundboard", title: "A to Z", hint: "Tap a letter to hear it!", boardClass: "board--abc",
      instruction: "Here are all the letters, A to Z! Tap each one.",
      items: C.alphabet.map(function (a) {
        return { key: "abc-" + a.L, name: a.word, sound: "name", say: a.L + " for " + a.word, html: letterCard(a.L, a.L.toLowerCase(), cardPic(a)) };
      }) };
  }
  // Letters with no word (ङ, ञ, अः) are just said; "ण (बाण)" ends in ण, so it is "ण, बाण" not "ण से बाण".
  function hindiWord(h) {
    if (/खाली/.test(h.word)) return { word: "", say: h.L };
    var word = h.word.replace(/^.*\((.*)\)$/, "$1");
    return { word: word, say: word.indexOf(h.L) === 0 ? h.L + " से " + word : h.L + ", " + word };
  }
  function buildHindiBook() {
    return { type: "soundboard", title: "वर्णमाला", hint: "अक्षर छुओ और सुनो!", boardClass: "board--abc", lang: "hi",
      instruction: "हिंदी वर्णमाला! हर अक्षर को छुओ।",
      items: C.hindiSwar.concat(C.hindiVyanjan).map(function (h) {
        var w = hindiWord(h);
        return { key: "hin-" + h.L, name: w.word ? w.word + " (" + h.meaning + ")" : h.L, sound: "name", lang: "hi-IN",
          say: w.say, html: letterCard(h.L, "", cardPic(h)) };
      }) };
  }

  /* ================= TRACING ================= */
  function buildTrace(lang) {
    var letters = lang === "hi"
      ? C.hindiSwar.concat(C.hindiVyanjan).map(function (h) { return { ch: h.L, say: hindiWord(h).say, lang: "hi-IN" }; })
      : C.alphabet.map(function (a) { return { ch: a.L, say: a.L + " for " + a.word, lang: "en-US" }; });
    return { type: "custom", lang: lang, letters: letters, custom: function (s) { return Kido.activities.trace(s); } };
  }
  function buildTraceNumbers() {
    var words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    var digits = words.map(function (w, i) { return { ch: String(i), say: String(i), lang: "en-US" }; });
    return { type: "custom", lang: "en", noun: "number", letters: digits.slice(1).concat(digits[0]), custom: function (s) { return Kido.activities.trace(s); } };
  }

  /* ================= GREETINGS ================= */
  function buildGreetings() {
    var picks = U.sample(C.greetings, Math.min(nRounds(), C.greetings.length));
    var rounds = picks.map(function (g) {
      var opts = [{ html: '<span style="font-size:.6em">' + g.answer + '</span>', correct: true, speak: g.answer }]
        .concat(U.sample(g.wrong, nOpts() - 1).map(function (w) { return { html: '<span style="font-size:.6em">' + w + '</span>', correct: false, speak: w }; }));
      return { prompt: g.prompt, say: g.prompt, options: U.shuffle(opts) };
    });
    return { type: "quiz", instruction: "Choose the right thing to say!", narrateOptions: true, bg: "game--home", rounds: rounds };
  }

  /* ================= BODY PARTS ================= */
  // Tap the part on Chiku's real photo (js/data/chiku.js, js/activities/bodyTap.js).
  function buildBody() { return { type: "custom", mode: "find", custom: function (s) { return Kido.activities.bodyTap(s); } }; }

  /* ================= ODD ONE OUT ================= */
  function buildOdd() {
    var picks = U.sample(C.oddGroups, nRounds());
    var rounds = picks.map(function (g) {
      function optHtml(val) { return creatureHtml(val, val); }
      var opts = U.shuffle(g.same.map(function (e) { return { html: optHtml(e), correct: false, pic: true }; })
        .concat([{ html: optHtml(g.odd), correct: true, pic: true }]));
      return { prompt: "Which one is different?", say: "Find the odd one out", options: opts };
    });
    return { type: "quiz", instruction: "Find the one that does not belong!", rounds: rounds };
  }

  /* ================= CONSTRUCTION ================= */
  function buildStructure(which) {
    var b = C.builds.find(function (x) { return x.name === which; }) || C.builds[0];
    return { type: "assembly", instruction: b.title + " — drag the parts into place!",
      rounds: [{ prompt: b.title, frameLabel: b.frame, theme: b.theme || b.name, slots: b.slots }] };
  }

  /* =========================================================================
     ACTIVITY TABLE
     ========================================================================= */
  var A = {};
  function add(id, o) { o.id = id; A[id] = o; }

  add("alphabet-find",  { categoryId: "alphabet", name: "Letter Hunt", icon: "🔤", build: buildAlphabetFind });
  add("alphabet-match", { categoryId: "alphabet", name: "Match Letters", icon: "🅰️", build: buildAlphabetMatch });
  add("hindi-swar",     { categoryId: "hindi", name: "स्वर (Vowels)", icon: "अ", build: function () { return buildHindi(C.hindiSwar, "सही अक्षर चुनो!"); } });
  add("hindi-vyanjan",  { categoryId: "hindi", name: "व्यंजन", icon: "क", build: function () { return buildHindi(C.hindiVyanjan, "सही अक्षर चुनो!"); } });
  add("hindi-varnamala",{ categoryId: "hindi", name: "वर्णमाला (Complete)", icon: "🇮🇳", build: function () { return buildHindi(C.hindiSwar.concat(C.hindiVyanjan), "वर्णमाला: सही अक्षर चुनो!"); } });
  add("hindi-match",    { categoryId: "hindi", name: "मिलान (Match)", icon: "🧩", build: buildHindiMatch });
  add("abc-book",       { categoryId: "alphabet", name: "A to Z", icon: "🔤", build: buildAlphabetBook });
  add("hindi-book",     { categoryId: "hindi", name: "वर्णमाला पुस्तक", icon: "📖", build: buildHindiBook });
  add("trace-abc",      { categoryId: "alphabet", name: "Trace Letters", icon: "✍️", build: function () { return buildTrace("en"); } });
  add("trace-123",      { categoryId: "numbers", name: "Trace Numbers", icon: "✍️", build: buildTraceNumbers });
  add("trace-hindi",    { categoryId: "hindi", name: "अक्षर बनाओ", icon: "✍️", build: function () { return buildTrace("hi"); } });
  add("big-small",      { categoryId: "numbers", name: "Big and Small", icon: "🐘", build: buildBigSmall });
  add("tall-short",     { categoryId: "numbers", name: "Tall and Short", icon: "🦒", build: buildTallShort });
  add("hot-cold",       { categoryId: "science", name: "Hot and Cold", icon: "🔥", build: buildHotCold });

  add("count",          { categoryId: "numbers", name: "Count It!", icon: "🍎", build: buildCount });
  add("sequence",       { categoryId: "numbers", name: "Missing Number", icon: "❓", build: buildSequence });
  add("moreless",       { categoryId: "numbers", name: "More or Less", icon: "⚖️", build: buildMoreLess });
  add("number-order",   { categoryId: "numbers", name: "In Order", icon: "🪜", build: buildNumberOrder });
  add("shape-find",     { categoryId: "shapes", name: "Find the Shape", icon: "⭐", build: buildShapeFind });

  add("animal-explore", { categoryId: "animals", name: "Animal Sounds", icon: "🔊", build: function () { return soundboardSpec(C.animals, "animal", "Tap the animals!", "animals", "animal-explore", "Animal Sounds"); } });
  add("animal-find",    { categoryId: "animals", name: "Find the Animal", icon: "🐯", build: function () { return findSpec(C.animals, "Find the animal I say!", "game--safari"); } });
  add("animal-babies",  { categoryId: "animals", name: "Animal Babies", icon: "🐣", build: buildAnimalBabies });

  add("bird-explore",   { categoryId: "birds", name: "Bird Songs", icon: "🎶", build: function () { return soundboardSpec(C.birds, "bird", "Tap the birds!", "birds", "bird-explore", "Bird Songs"); } });
  add("bird-find",      { categoryId: "birds", name: "Find the Bird", icon: "🦜", build: function () { return findSpec(C.birds, "Find the bird I say!", "game--safari"); } });

  // Audio-first sound games (rendering in js/activities/soundGames.js) — hear a
  // real/synth call, then identify who made it. Age scales options + rounds.
  add("who-makes-sound",{ categoryId: "animals", name: "Who Makes This Sound?", icon: "👂", build: function () { return { type: "custom", bg: "game--safari", custom: function (s) { return Kido.activities.whoMakesSound(s); } }; } });
  add("who-am-i",       { categoryId: "animals", name: "Who Am I?", icon: "🎧", build: function () { return { type: "custom", bg: "game--safari", custom: function (s) { return Kido.activities.whoAmI(s); } }; } });

  add("flower-explore", { categoryId: "flowers", name: "Flower Garden", icon: "🌷", build: function () { var s = soundboardSpec(C.flowers, "name", "Tap the flowers!", "flowers", "flower-explore", "Flower Garden"); return s; } });
  add("flower-find",    { categoryId: "flowers", name: "Find the Flower", icon: "🌸", build: function () { return findSpec(C.flowers, "Find the flower I say!"); } });

  add("vehicle-explore",{ categoryId: "vehicles", name: "Vehicle Sounds", icon: "📣", build: function () { return soundboardSpec(C.vehicles, "vehicle", "Tap the vehicles!", "vehicles", "vehicle-explore", "Vehicle Sounds"); } });
  add("vehicle-find",   { categoryId: "vehicles", name: "Find the Vehicle", icon: "🚗", build: function () { return findSpec(C.vehicles, "Find the vehicle I say!"); } });

  add("habit-routine",  { categoryId: "habits", name: "Get Ready!", icon: "🎒", build: buildHabitRoutine });
  add("habit-choose",   { categoryId: "habits", name: "Good Habits", icon: "🌟", build: buildHabitChoose });
  add("habit-goodbad",  { categoryId: "habits", name: "Good or Bad Habit?", icon: "👍", build: buildHabitGoodBad });
  add("greetings",      { categoryId: "greetings", name: "Say Hello", icon: "👋", build: buildGreetings });
  add("body",           { categoryId: "body", name: "My Body", icon: "🧒", build: buildBody });

  add("odd",            { categoryId: "oddoneout", name: "Odd One Out", icon: "🔍", build: buildOdd });

  add("build-bridge",   { categoryId: "structures", name: "Build a Bridge", icon: "🌉", build: function () { return buildStructure("bridge"); } });
  add("build-house",    { categoryId: "structures", name: "Build a House", icon: "🏠", build: function () { return buildStructure("house"); } });

  /* ================= FLAGSHIP SCENES (immersive Scene Engine) ================= */
  function sceneAct(sceneId) { return function () { return { type: "scene", sceneId: sceneId }; }; }
  add("scene-brush",       { categoryId: "habits",   name: "Brush Your Teeth", icon: "🪥", scene: true, build: sceneAct("scene-brush") });
  add("scene-apple",       { categoryId: "alphabet", name: "A is for Apple",   icon: "🍏", scene: true, build: sceneAct("scene-apple") });
  add("scene-count",       { categoryId: "numbers",  name: "Count the Apples", icon: "🧺", scene: true, build: sceneAct("scene-count") });
  add("scene-plant",       { categoryId: "science",  name: "Grow a Plant",     icon: "🌱", scene: true, build: sceneAct("scene-plant") });
  add("scene-animalsound", { categoryId: "animals",  name: "Find the Sound",   icon: "🦁", scene: true, build: sceneAct("scene-animalsound") });
  add("scene-wordrun",     { categoryId: "words",    name: "Collect Letters",  icon: "🚀", scene: true, theme: "animals", build: sceneAct("scene-wordrun") });
  // World-driven flagship: one scene runs every world (jungle now, farm/ocean/… later) via spec.world.
  add("scene-whatsanimal", { categoryId: "animals",  name: "What's That Animal?", icon: "🐘", scene: true,
    build: function () { return { type: "scene", sceneId: "scene-whatsanimal", world: "jungle" }; } });

  // Custom / signature activities (rendering lives in js/activities/*)
  add("electronics",    { categoryId: "electronics", name: "Build a Computer", icon: "💻",
    build: function () { return { type: "custom", custom: function (s) { return Kido.activities.electronics(s); } }; } });

  // Change #22: the Solar System explorer (js/activities/solarSystem.js) and Find the Planet (the quiz engine).
  add("solar-system",   { categoryId: "space", name: "The Solar System", icon: "",
    build: function () { return { type: "custom", music: "space", custom: function (s) { return Kido.activities.solarSystem(s); } }; } });
  add("planet-find",    { categoryId: "space", name: "Find the Planet", icon: "", build: buildPlanetFind });
  function planetHtml(k) {
    var n = Kido.space.get(k).name;
    return '<span class="kido-creature" role="img" aria-label="' + n + '">' + Kido.puzzleArt.planet(k) + "</span>";
  }
  // Each round is one "find …" clue for the child's age band (colours → order → reasoning); no timer.
  function buildPlanetFind() {
    var S = Kido.space, clues = U.sample(S.clues(), Math.min(nRounds(), 6));
    return { type: "quiz", instruction: "Find the planet!", music: "space", rounds: clues.map(function (c) {
      var others = U.sample(S.BODIES.filter(function (k) { return k !== c.key && c.avoid.indexOf(k) < 0; }), Math.max(1, nOpts() - 1));
      return { prompt: c.ask, say: c.ask, options: U.shuffle([c.key].concat(others)).map(function (k) {
        return { html: planetHtml(k), correct: k === c.key, speak: S.get(k).name, pic: true };
      }) };
    }) };
  }

  // Arcade mini-games — the "Game Zone" (rendering in js/activities/miniGames.js)
  // Think Lab (js/activities/thinkLab.js) — original puzzle designs
  add("peekaboo",     { categoryId: "animals", name: "Peekaboo Pals", icon: "🌿", build: function () { return { type: "custom", bg: "game--safari", custom: function (s) { return Kido.activities.peekaboo(s); } }; } });
  add("thermo-check",  { categoryId: "science", name: "Weather Thermometer", icon: "🌡️", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.thermoCheck(s); } }; } });
  add("planet-sums",   { categoryId: "space",   name: "Planet Sums", icon: "🪐", build: function () { return { type: "custom", music: "space", custom: function (s) { return Kido.activities.planetSums(s); } }; } });
  add("picture-sums",  { categoryId: "numbers", name: "Picture Sums", icon: "🧩", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.pictureSums(s); } }; } });
  add("clock-match",   { categoryId: "numbers", name: "Clock Match", icon: "⏰", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.clockMatch(s); } }; } });
  add("fruit-chart",   { categoryId: "numbers", name: "Fruit Chart", icon: "📊", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.fruitChart(s); } }; } });
  add("cube-count",    { categoryId: "shapes",  name: "Block Count", icon: "🧱", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.cubeCount(s); } }; } });
  add("pizza-maker",   { categoryId: "numbers", name: "Pizza Maker", icon: "🍕", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.pizzaMaker(s); } }; } });
  add("momo-care",     { categoryId: "habits",  name: "Momo's Breakfast", icon: "🧸", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.momoCare(s); } }; } });
  add("sticker-world", { categoryId: "animals", name: "Sticker World", icon: "🖼️", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.stickerWorld(s); } }; } });
  add("rocket-route",  { categoryId: "games",   name: "Rocket Route", icon: "🚀", build: function () { return { type: "custom", music: "space", custom: function (s) { return Kido.activities.rocketRoute(s); } }; } });
  add("kido-market",   { categoryId: "numbers", name: "Kido Market", icon: "🛒", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.kidoMarket(s); } }; } });
  add("snail-trail",   { categoryId: "games",   name: "Snail Trail", icon: "🐌", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.snailTrail(s); } }; } });
  add("colour-studio", { categoryId: "shapes",  name: "Colour Studio", icon: "🎨", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.colourStudio(s); } }; } });
  add("magic-shapes",  { categoryId: "shapes",  name: "Magic Shapes", icon: "✨", build: function () { return { type: "custom", lang: "en", noun: "shape", letters: Kido.thinkLab.magicShapes, custom: function (s) { return Kido.activities.trace(s); } }; } });
  add("garden-signs",  { categoryId: "games",   name: "Garden Signs", icon: "🌷", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.gardenSigns(s); } }; } });
  add("train-track",   { categoryId: "games",   name: "Train Track", icon: "🚂", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.trainTrack(s); } }; } });
  add("stick-squares", { categoryId: "games",   name: "Stick Squares", icon: "🍡", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.stickSquares(s); } }; } });
  add("frog-hop",      { categoryId: "numbers", name: "Frog Hop", icon: "🐸", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.frogHop(s); } }; } });
  add("garden-sudoku", { categoryId: "games",   name: "Garden Sudoku", icon: "🍎", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.gardenSudoku(s); } }; } });
  add("treasure-map",  { categoryId: "games",   name: "Treasure Map", icon: "🗺️", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.treasureMap(s); } }; } });
  add("light-wires",   { categoryId: "electronics", name: "Light Wires", icon: "💡", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.lightWires(s); } }; } });
  add("picnic-seats", { categoryId: "games",   name: "Picnic Seats",  icon: "🧺", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.picnicSeats(s); } }; } });
  add("robot-clues",  { categoryId: "electronics", name: "Robot Clues", icon: "🤖", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.robotClues(s); } }; } });
  add("tic-tac-toe",  { categoryId: "games",   name: "Tic-Tac-Toe",  icon: "⭕", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.ticTacToe(s); } }; } });
  add("memory-match", { categoryId: "games",   name: "Memory Match",  icon: "🧠", build: function () { return { type: "custom", bg: "game--safari", activityId: "memory-match", custom: function (s) { return Kido.activities.memory(s); } }; } });
  add("shape-sorter", { categoryId: "shapes",  name: "Shape Sorter",  icon: "🔷", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.shapeSorter(s); } }; } });
  add("bubble-pop",   { categoryId: "numbers", name: "Bubble Pop",    icon: "🫧", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.bubblePop(s); } }; } });
  add("beat",         { categoryId: "games",   name: "Copy the Beat", icon: "🥁", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.simon(s); } }; } });
  add("shadow-match", { categoryId: "games",   name: "Shadow Match",  icon: "🐾", build: function () { return { type: "custom", bg: "game--shadow", custom: function (s) { return Kido.activities.shadowMatch(s); } }; } });

  // 3D Fruit Games (rendering in js/activities/fruitGames.js)
  add("fruit-catch",   { categoryId: "games",  name: "Fruit Harvest Catch", icon: "🎯", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.fruitCatch(s); } }; } });
  add("fruit-explore", { categoryId: "nature", name: "3D Fruit Market",     icon: "🥭", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.fruitExplore(s); } }; } });
  add("fruit-find",    { categoryId: "nature", name: "Find the Fruit",       icon: "🍉", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.fruitFind(s); } }; } });
  add("fruit-sorter",  { categoryId: "games",  name: "Fruit Basket Sorter", icon: "🍓", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.fruitSorter(s); } }; } });
  add("fruit-memory",  { categoryId: "games",  name: "Fruit Memory Match",  icon: "🍇", build: function () { return { type: "custom", custom: function (s) { return Kido.activities.fruitMemory(s); } }; } });

  // Word Adventure runner — one activity per theme, difficulty via age.
  var WORD_THEME_ICONS = {
    animals: "🦊",
    fruits: "🍊",
    vehicles: "🚆",
    objects: "🎸",
    colors: "🎨",
    school: "📚"
  };
  ["animals", "fruits", "vehicles", "objects", "colors", "school"].forEach(function (theme) {
    add("word-" + theme, { categoryId: "words", name: "Word Run: " + cap(theme), icon: WORD_THEME_ICONS[theme] || "🏃",
      build: function () { return { type: "custom", theme: theme, custom: function (s) { return Kido.activities.runner(s); } }; } });
  });

  // Background-music mood for a context, from js/data/audioRegistry.js.
  function moodFor(ctx) { var r = Kido.audioRegistry && Kido.audioRegistry.music; return (r && r[ctx]) || undefined; }

  // Quick Discoveries — one activity per video-manifest entry that declares a discovery.
  (Kido.videos ? Kido.videos.list() : []).forEach(function (v) {
    if (!v.discovery) return;
    add(v.discovery.activityId, { categoryId: v.category, name: v.discovery.name, icon: "",
      build: function () {
        return { type: "custom", videoId: v.id, followUp: v.followUpGame, followUpFeature: v.followUpFeature, music: v.music,
          custom: function (s) { return Kido.activities.discovery(s); } };
      } });
  });

  // Logic & Puzzle Engine — one activity per puzzle in js/data/puzzles.js.
  (Kido.puzzles ? Kido.puzzles.list() : []).forEach(function (p) {
    add(p.activityId, { categoryId: (p.reward && p.reward.category) || "oddoneout", name: p.name, icon: "",
      build: function () {
        return { type: "custom", puzzleId: p.id, followUp: Kido.puzzles.after(p.activityId), music: p.music || moodFor("puzzle"),
          custom: function (s) { return Kido.PuzzleEngine.run(s); } };
      } });
  });

  // Interactive story adventures — one activity per story in js/data/storyAdventures.js (Change #17A: the
  // five picture stories are adventures now too, under their old story-* ids). followUp = a related Quick
  // Discovery the result screen offers next, so learning continues after the story instead of interrupting it.
  (Kido.storyAdventures || []).forEach(function (st) {
    add(st.activityId, { categoryId: (st.reward && st.reward.category) || "stories", name: st.title, icon: "",
      build: function () {
        return { type: "custom", storyId: st.id, music: st.music || moodFor("story"), followUp: st.followUp,
          custom: function (s) { return Kido.StoryEngine.run(s); } };
      } });
  });

  /* Put one item first in a game that has an item list (e.g. the elephant in
     Animal Sounds after the elephant discovery), borrowing it from the
     category's content if the random pick left it out. */
  function featureItem(spec, key) {
    if (!spec.items || !key) return;
    var at = -1;
    spec.items.forEach(function (x, i) { if (x.key === key) at = i; });
    var item = at >= 0 ? spec.items.splice(at, 1)[0] : null;
    if (!item) {
      var src = (C[spec.categoryId] || []).filter(function (x) { return x.key === key; })[0];
      if (!src) return;
      item = { key: src.key, emoji: src.emoji, name: src.name, sound: spec.items[0] && spec.items[0].sound };
      if (spec.items.length >= 9) spec.items.pop();
    }
    spec.items.unshift(item);
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* =========================================================================
     WORLD MAP REGIONS (the signature home)
     ========================================================================= */
  var REGIONS = [
    { id: "studio", name: "Demo Studio", desc: "Six flagship scenes", icon: "🎬", tint: "garden",
      activities: ["scene-brush", "scene-apple", "scene-count", "scene-plant", "scene-animalsound", "scene-wordrun"] },
    { id: "forest", name: "Alphabet Forest", desc: "Letters & sounds", icon: "🌲", tint: "forest",
      activities: ["abc-book", "trace-abc", "alphabet-find", "alphabet-match", "hindi-book", "trace-hindi", "hindi-swar", "hindi-vyanjan", "hindi-match"] },
    { id: "town", name: "Number Town", desc: "Counting & shapes", icon: "🔢", tint: "town",
      activities: ["count", "sequence", "moreless", "number-order", "big-small", "tall-short", "shape-find", "trace-123", "frog-hop", "magic-shapes", "kido-market", "planet-sums", "picture-sums", "clock-match", "fruit-chart", "pizza-maker"] },
    { id: "arcade", name: "Game Zone", desc: "Fun brain games", icon: "🕹️", tint: "city",
      activities: ["fruit-catch", "fruit-sorter", "fruit-memory", "tic-tac-toe", "memory-match", "shadow-match", "shape-sorter", "bubble-pop", "beat", "picnic-seats", "garden-sudoku", "treasure-map", "garden-signs", "stick-squares", "rocket-route", "snail-trail", "colour-studio", "cube-count"] },
    { id: "jungle", name: "Animal Jungle", desc: "Animals & birds", icon: "🐯", tint: "jungle",
      activities: ["scene-whatsanimal", "animal-explore", "animal-find", "animal-babies", "bird-explore", "bird-find", "who-makes-sound", "who-am-i", "peekaboo", "sticker-world"] },
    { id: "garden", name: "Nature Garden", desc: "Fruits & flowers", icon: "🍎", tint: "garden",
      activities: ["fruit-catch", "fruit-explore", "fruit-find", "fruit-sorter", "flower-explore", "flower-find", "odd"] },
    { id: "city", name: "Busy City", desc: "Vehicles & building", icon: "🏙️", tint: "city",
      activities: ["vehicle-explore", "vehicle-find", "build-bridge", "build-house", "train-track"] },
    { id: "home", name: "Happy Home", desc: "Habits & manners", icon: "🏡", tint: "castle",
      activities: ["habit-routine", "habit-choose", "habit-goodbad", "hot-cold", "greetings", "body", "momo-care"] },
    { id: "lab", name: "Gadget Lab", desc: "How things work", icon: "💡", tint: "lab",
      activities: ["electronics", "robot-clues", "light-wires", "thermo-check"] },
    { id: "castle", name: "Story Castle", desc: "Stories & word runs", icon: "🏰", tint: "castle",
      activities: ["story-rabbit", "story-puppy", "story-cleanroom", "story-explorer", "story-garden",
                   "word-animals", "word-fruits", "word-vehicles", "word-objects", "word-colors", "word-school"] }
  ];

  Kido.catalog = {
    activities: A,
    regions: REGIONS,
    get: function (id) { return A[id]; },
    region: function (id) { return REGIONS.find(function (r) { return r.id === id; }); },
    // Build a ready-to-play spec, stamped with ids used by the reward system.
    // opts.feature: key of an item to show first (games with an items list).
    buildSpec: function (id, opts) {
      var a = A[id]; if (!a) return null;
      var spec = a.build() || {};
      spec.activityId = id;
      spec.categoryId = a.categoryId;
      if (opts && opts.feature) featureItem(spec, opts.feature);
      spec.name = a.name;
      spec.icon = a.icon;
      if (a.theme) spec.theme = a.theme;
      if (a.story) spec.story = a.story;
      return spec;
    }
  };
})(window);
