/* =========================================================================
   moreActivities.js — Change #30: at least 10 activities in every category
   Data only, played by the existing engines (quiz, match, order, soundboard).
   Pictures are the app's own art (creature registry, fruit/shape pictures),
   emoji, or small drawings made in code below — nothing downloaded.
   Each new activity is also added to its Learning World region and to its
   Kido World realm, so children find it where they already explore.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var C = Kido.content, U = Kido.util, CAT = Kido.catalog, A = CAT.activities;

  /* ---------------- helpers ---------------- */
  function cfg() { return Kido.age.cfg(); }
  function nR() { return cfg().rounds; }
  function nO() { return Math.max(2, Math.min(4, cfg().optionsPerQuestion)); }
  function art(key, emoji, name) {   // the app's own picture for a species/fruit when it has one, else the emoji
    if (key && Kido.creatures && Kido.creatures.hasArt(key)) return Kido.creatures.render(key, { name: name });
    return emoji;
  }
  function img(src) { return '<img src="' + src + '" alt="" draggable="false"/>'; }
  /* Real pictures first (owner's rule, 2026-10-19): a name the app has a photo or picture for gets it; the emoji
     is only the fallback. Animals, birds and flowers come from the creature registry (their photos). */
  var I = "assets/img/";
  var PHOTO = {
    car: "vehicles/car.jpg", suv: "vehicles/suv.jpg", van: "vehicles/van.jpg", bus: "vehicles/bus.jpg", ambulance: "vehicles/ambulance.jpg",
    "fire truck": "vehicles/firetruck.jpg", "police car": "vehicles/police.jpg", bicycle: "vehicles/bicycle.jpg", motorcycle: "vehicles/motorcycle.jpg",
    tractor: "vehicles/tractor.jpg", train: "vehicles/train.jpg", airplane: "vehicles/airplane.jpg", helicopter: "vehicles/helicopter.jpg",
    ship: "vehicles/ship.jpg", rocket: "vehicles/rocket.jpg", truck: "vehicles/truck.jpg", taxi: "vehicles/taxi.jpg",
    ball: "objects/ball.svg", umbrella: "objects/umbrella.jpg", sunglasses: "objects/glasses.svg", "ice cream": "objects/icecream.svg",
    kite: "objects/kite.svg", watch: "objects/watch.svg", computer: "objects/computer.svg", drum: "objects/drum.svg", nest: "objects/nest.svg",
    soil: "objects/flowerpot.svg", doughnut: "objects/food-donut.svg", "pizza slice": "objects/food-pizza.svg", burger: "objects/food-burger.svg",
    tomato: "objects/tomato.svg", carrot: "fruits/art/carrot.svg", mushroom: "objects/mushroom.jpg", "teddy bear": "habits/habit_toys.svg",
    "brushing your teeth": "habits/habit_brush.svg", "washing hands before eating": "habits/habit_hands.svg", "drinking water": "habits/habit_water.svg",
    "tidying your toys": "habits/habit_toys.svg", "helping others": "habits/habit_help.svg", "sleeping on time": "habits/habit_sleep.svg",
    "going to bed": "habits/habit_sleep.svg", "waking up": "habits/habit_wakeup.svg", "eating junk food every day": "objects/food-burger.svg",
    "eating too many sweets": "objects/food-donut.svg", "sharing your toys": "habits/habit_toys.svg", "helping pick up books": "habits/habit_help.svg",
    sun: "space/planet-sun.svg", earth: "space/earth.jpg", balloon: "games/balloons.svg", balloons: "games/balloons.svg"
  };
  function photoFor(n) {
    var k = String(n).toLowerCase().replace(/^(a|an|the) /, ""), tries = [k, k.replace(/es$/, ""), k.replace(/s$/, "")];
    for (var i = 0; i < tries.length; i++) {
      var t = tries[i];
      if (PHOTO[t]) return img(I + PHOTO[t]);
      var f = C.fruits.filter(function (x) { return x.img && x.name.toLowerCase() === t; })[0];
      if (f) return img(f.img);
      var s = C.shapes.filter(function (x) { return x.img && x.name.toLowerCase() === t; })[0];
      if (s) return img(s.img);
      var ck = t.replace(/ /g, "_");
      if (Kido.creatures && Kido.creatures.hasArt(ck)) return Kido.creatures.render(ck, { name: n });
    }
    return "";
  }
  function it(n, e, more) {
    var o = { n: n, e: e }; for (var k in more) o[k] = more[k];
    if (e && e.indexOf("<") < 0 && !(more && more.emoji)) o.e = photoFor(n) || e;   // `emoji: true` keeps a deliberate emoji
    return o;
  }

  // Find the named picture: "Find the parrot!"
  function findQuiz(items, opts) {
    opts = opts || {};
    return { type: "quiz", instruction: opts.instruction, lang: opts.lang, narrateOptions: false,
      rounds: U.sample(items, Math.min(nR(), items.length)).map(function (x) {
        var q = opts.ask ? opts.ask(x) : "Find the " + x.n.toLowerCase() + "!";
        var others = U.sample(items.filter(function (y) { return y !== x && (!opts.differ || opts.differ(x, y)); }), nO() - 1);
        return { prompt: q, say: q, fact: x.f || (opts.fact ? opts.fact(x) : ""),
          options: U.shuffle([x].concat(others)).map(function (y) { return { html: y.e, pic: true, speak: y.n, correct: y === x }; }) };
      }) };
  }
  // A question with a picture answer: entries [question, answerIndex-into-pool, fact]
  function riddleQuiz(pool, list, opts) {
    opts = opts || {};
    return { type: "quiz", instruction: opts.instruction, narrateOptions: false,
      rounds: U.sample(list, Math.min(nR(), list.length)).map(function (q) {
        var ans = pool[q[1]];
        var keys = Object.keys(pool).filter(function (k) { return k !== q[1] && (!q[3] || q[3].indexOf(k) < 0); });
        var others = U.sample(keys, nO() - 1).map(function (k) { return pool[k]; });
        return { prompt: q[0], say: q[0], fact: q[2] || ("Yes! " + ans.n + "!"),
          options: U.shuffle([ans].concat(others)).map(function (y) { return { html: y.e, pic: true, speak: y.n, correct: y === ans }; }) };
      }) };
  }
  // Written answers (read aloud one by one): entries {q, a, w:[wrong...], e: picture html, f: fact}
  function textQuiz(list, opts) {
    opts = opts || {};
    var pick = opts.inOrder ? list : U.sample(list, Math.min(nR(), list.length));
    return { type: "quiz", instruction: opts.instruction, lang: opts.lang,
      narrateOptions: opts.narrate === false ? false : undefined,
      rounds: pick.map(function (q) {
        var r = { prompt: q.q, say: q.say || q.q, fact: q.f || ("Yes! " + q.a),
          options: [{ html: q.a, speak: q.a, correct: true }].concat(q.w.map(function (w) { return { html: w, speak: w, correct: false }; })) };
        if (q.e) { r.showcase = '<div class="cls-item"><span class="cls-item__pic">' + q.e + "</span></div>"; r.showcaseClass = "cls-showcase"; }
        return r;
      }) };
  }
  // Two or three coloured answers under a picture; the truth is spoken after either tap.
  function classify(items, buttons, question, opts) {
    opts = opts || {};
    var groups = buttons.map(function (_, i) { return U.shuffle(items.filter(function (x) { return (x.k || 0) === i; })); });
    var pick = [], g = 0;
    while (pick.length < Math.min(nR(), items.length)) { var grp = groups[g % groups.length]; if (grp.length) pick.push(grp.pop()); g++; if (g > 200) break; }
    return { type: "quiz", instruction: opts.instruction, shuffleOptions: false, narrateOptions: false,
      rounds: U.shuffle(pick).map(function (x) {
        return { showcase: '<div class="cls-item"><span class="cls-item__pic">' + x.e + '</span><span class="cls-item__name">' + x.n + "</span></div>",
          showcaseClass: "cls-showcase", prompt: question, say: x.n + ". " + question, fact: "Yes! " + x.f,
          options: buttons.map(function (b, i) { return { html: b[0], speak: b[1], cls: b[2], correct: (x.k || 0) === i, wrongSay: "Oops! " + x.f }; }) };
      }) };
  }
  var YES_NO = function (yes, no) { return [["👍 " + yes, yes, "opt--good"], ["👎 " + no, no, "opt--bad"]]; };
  // Drag/tap matching: pairs {k: key picture, v: value picture/word, say}
  function matchGame(pairs, prompt, opts) {
    opts = opts || {};
    var per = Math.min(4, pairs.length, cfg().difficulty <= 2 ? 3 : 4), rounds = [], pool = U.shuffle(pairs);
    for (var r = 0; r < 2 && pool.length >= 2; r++) {
      var take = pool.splice(0, per); if (take.length < 2) break;
      rounds.push({ prompt: prompt, pairs: take.map(function (p, i) { return { id: "p" + r + i, key: { emoji: p.k }, value: { emoji: p.v, say: p.say } }; }) });
    }
    return { type: "match", instruction: opts.instruction || prompt, lang: opts.lang, rounds: rounds };
  }
  function word(w) { return '<span class="match-word">' + w + "</span>"; }
  // Tap in order: seqs [{p: prompt, items: [[html, speak], ...]}]
  function orderGame(seqs, opts) {
    opts = opts || {};
    return { type: "order", instruction: opts.instruction, lang: opts.lang, wrongSay: opts.wrongSay,
      rounds: U.sample(seqs, Math.min(seqs.length, Math.max(2, nR() - 2))).map(function (s) {
        return { prompt: s.p, items: s.items.map(function (x) { return { html: x[0], speak: x[1] }; }) };
      }) };
  }
  // Tap-to-hear collection: items {n, e, s(aid)}
  function explore(items, title, hint, instruction) {
    return { type: "soundboard", title: title, hint: hint, instruction: instruction,
      items: items.map(function (x, i) { return { key: "x" + i + "-" + x.n, name: x.n, sound: "name", say: x.s || x.n, html: '<span class="board-emoji">' + x.e + "</span>" }; }) };
  }
  // How many? A grid of pictures, number answers.
  function countGame(things) {
    var max = Math.max(3, Math.min(10, cfg().maxNumber || 5)), rounds = [];
    for (var i = 0; i < nR(); i++) {
      var t = U.pick(things), n = 1 + Math.floor(Math.random() * max), opts = [n];
      while (opts.length < Math.min(3, nO())) { var d = Math.max(1, n + U.pick([-2, -1, 1, 2])); if (opts.indexOf(d) < 0 && d <= max + 1) opts.push(d); }
      var grid = ""; for (var j = 0; j < n; j++) grid += "<span>" + t.e + "</span>";
      var q = "How many " + t.n + "?";
      rounds.push({ showcase: '<div class="cls-item"><span class="cnt-grid' + (n > 6 ? " cnt-grid--many" : "") + '">' + grid + "</span></div>", showcaseClass: "cls-showcase",
        prompt: q, say: q, fact: "Yes! " + n + " " + t.n + "!",
        options: U.shuffle(opts).map(function (v) { return { html: String(v), speak: String(v), correct: v === n }; }) });
    }
    return { type: "quiz", instruction: "Let's count!", narrateOptions: false, rounds: rounds };
  }
  // A narrated picture story: every round is one page, played in order.
  function storyQuiz(pages, instruction) {
    return { type: "quiz", instruction: instruction, rounds: pages.map(function (pg) {
      return { showcase: '<div class="cls-item story-page"><span class="cls-item__pic">' + pg.scene + "</span></div>", showcaseClass: "cls-showcase",
        prompt: pg.ask, say: pg.say + " " + pg.ask, fact: pg.f,
        options: [{ html: pg.a, speak: pg.a.replace(/^\S+\s/, ""), correct: true, wrongSay: pg.no }].concat(pg.w.map(function (w) { return { html: w, speak: w.replace(/^\S+\s/, ""), correct: false, wrongSay: pg.no }; })) };
    }) };
  }

  /* ---------------- small drawings ---------------- */
  var GLOW = 'fill="none" stroke="#FACC15" stroke-width="4" stroke-dasharray="6 4"';
  function plantSvg(part) {
    var hl = { root: '<ellipse cx="50" cy="98" rx="26" ry="16" ' + GLOW + "/>", stem: '<rect x="42" y="36" width="16" height="48" rx="6" ' + GLOW + "/>",
      leaf: '<ellipse cx="36" cy="60" rx="16" ry="10" ' + GLOW + "/>", flower: '<circle cx="50" cy="26" r="20" ' + GLOW + "/>" }[part];
    return '<svg class="more-svg" viewBox="0 0 100 120"><rect x="0" y="84" width="100" height="36" fill="#A16207" opacity=".35"/>' +
      '<path d="M50 84 Q44 96 34 104 M50 84 Q52 98 50 112 M50 84 Q58 96 68 102" stroke="#92400E" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<line x1="50" y1="84" x2="50" y2="36" stroke="#16A34A" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="38" cy="60" rx="12" ry="6" fill="#22C55E" transform="rotate(-25 38 60)"/><ellipse cx="62" cy="50" rx="12" ry="6" fill="#22C55E" transform="rotate(25 62 50)"/>' +
      '<circle cx="50" cy="16" r="8" fill="#F472B6"/><circle cx="40" cy="26" r="8" fill="#F472B6"/><circle cx="60" cy="26" r="8" fill="#F472B6"/><circle cx="50" cy="35" r="8" fill="#F472B6"/><circle cx="50" cy="26" r="6" fill="#FDE047"/>' +
      hl + "</svg>";
  }
  function trafficSvg(lit) {
    var c = function (i, on, off) { return '<circle cx="30" cy="' + (18 + i * 26) + '" r="10" fill="' + (lit === i ? on : off) + '"' + (lit === i ? ' stroke="#FFF" stroke-width="2"' : "") + "/>"; };
    return '<svg class="more-svg" viewBox="0 0 60 100"><rect x="14" y="4" width="32" height="82" rx="8" fill="#1F2937"/><rect x="27" y="86" width="6" height="14" fill="#4B5563"/>' +
      c(0, "#EF4444", "#4B1D1D") + c(1, "#FACC15", "#4A3F12") + c(2, "#22C55E", "#14381F") + "</svg>";
  }
  function houseSvg(part) {
    var s = function (p) { return part === p ? ' stroke="#FACC15" stroke-width="4"' : ' stroke="#334155" stroke-width="1.5"'; };
    return '<svg class="more-svg" viewBox="0 0 100 100"><polygon points="12,44 50,10 88,44" fill="#EF4444"' + s("roof") + "/>" +
      '<rect x="20" y="44" width="60" height="50" fill="#FDE68A"' + s("wall") + "/>" +
      '<rect x="42" y="62" width="16" height="32" fill="#92400E"' + s("door") + "/>" +
      '<circle cx="50" cy="32" r="6" fill="#BAE6FD"' + s("window") + "/></svg>";
  }
  function blob(colour) { return '<svg class="more-svg more-svg--blob" viewBox="0 0 60 60"><path d="M30 4 C44 4 56 14 54 30 C53 46 44 56 30 56 C14 56 5 46 6 30 C7 14 16 4 30 4 Z" fill="' + colour + '" stroke="#FFFFFF" stroke-width="3"/></svg>'; }
  function block(w, colour) { return '<svg class="more-svg more-svg--block" viewBox="0 0 100 40"><rect x="' + (50 - w / 2) + '" y="6" width="' + w + '" height="28" rx="4" fill="' + colour + '" stroke="#1F2937" stroke-width="1.5"/></svg>'; }

  /* ================================ ALPHABET ================================ */
  var ABC = C.alphabet.map(function (a) { return a.L; });
  function abcNext() {
    var rounds = [];
    for (var i = 0; i < nR(); i++) {
      var s = Math.floor(Math.random() * 23), ans = ABC[s + 3];
      var wrong = U.sample(ABC.filter(function (l) { return l !== ans; }), nO() - 1);
      var q = "What comes after " + ABC[s + 2] + "?";
      rounds.push({ showcase: '<div class="cls-item"><span class="seq-show">' + ABC[s] + " " + ABC[s + 1] + " " + ABC[s + 2] + " <b>?</b></span></div>", showcaseClass: "cls-showcase",
        prompt: q, say: ABC[s] + ", " + ABC[s + 1] + ", " + ABC[s + 2] + ". " + q, fact: "Yes! " + ans + " comes next!",
        options: U.shuffle([ans].concat(wrong)).map(function (l) { return { html: l, speak: l, correct: l === ans }; }) });
    }
    return { type: "quiz", instruction: "What letter comes next?", narrateOptions: false, rounds: rounds };
  }
  function abcFirst() {
    var pool = [];
    C.alphabet.forEach(function (a) { (a.words || []).forEach(function (w) { if (w.emoji && w.word[0].toUpperCase() === a.L) pool.push({ L: a.L, w: w }); }); });
    return { type: "quiz", instruction: "Which letter does it start with?", narrateOptions: false,
      rounds: U.sample(pool, nR()).map(function (x) {
        var wrong = U.sample(ABC.filter(function (l) { return l !== x.L; }), nO() - 1);
        return { showcase: '<div class="cls-item"><span class="cls-item__pic">' + (x.w.img ? img(x.w.img) : x.w.emoji) + '</span><span class="cls-item__name">' + x.w.word + "</span></div>", showcaseClass: "cls-showcase",
          prompt: "Which letter does " + x.w.word + " start with?", say: x.w.word + ". Which letter does " + x.w.word + " start with?",
          fact: "Yes! " + x.w.word + " starts with " + x.L + "!",
          options: U.shuffle([x.L].concat(wrong)).map(function (l) { return { html: l, speak: l, correct: l === x.L }; }) };
      }) };
  }
  function abcOrder() {
    var seqs = [];
    for (var i = 0; i < 6; i++) {
      var n = cfg().difficulty <= 2 ? 3 : 4, picks = U.sample(ABC, n).sort();
      seqs.push({ p: "Tap the letters in ABC order!", items: picks.map(function (l) { return ['<span class="seq-letter">' + l + "</span>", l]; }) });
    }
    return orderGame(seqs, { instruction: "Put the letters in ABC order!", wrongSay: "Which letter comes first in A B C?" });
  }

  /* ================================ HINDI ================================ */
  var HIN = C.hindiSwar.concat(C.hindiVyanjan);
  var HIN_WORDS = HIN.filter(function (h) { return !/[()]/.test(h.word) && h.word.indexOf(h.L) === 0 && (h.img || h.emoji); });
  function hindiFirst() {
    return { type: "quiz", lang: "hi", instruction: "यह किस अक्षर से शुरू होता है?", narrateOptions: false, bg: "game--hindi",
      rounds: U.sample(HIN_WORDS, nR()).map(function (h) {
        var wrong = U.sample(HIN.filter(function (x) { return x.L !== h.L; }), nO() - 1).map(function (x) { return x.L; });
        return { showcase: '<div class="cls-item"><span class="cls-item__pic">' + (h.img ? img(h.img) : h.emoji) + '</span><span class="cls-item__name">' + h.word + "</span></div>", showcaseClass: "cls-showcase",
          prompt: h.word + " किस अक्षर से शुरू होता है?", say: h.word + "। यह किस अक्षर से शुरू होता है?", fact: "शाबाश! " + h.L + " से " + h.word + "!",
          options: U.shuffle([h.L].concat(wrong)).map(function (l) { return { html: l, speak: l, correct: l === h.L }; }) };
      }) };
  }
  function hindiNext(list, title) {
    var L = list.map(function (h) { return h.L; }), rounds = [];
    for (var i = 0; i < nR(); i++) {
      var s = Math.floor(Math.random() * (L.length - 3)), ans = L[s + 3];
      var wrong = U.sample(L.filter(function (l) { return l !== ans; }), nO() - 1);
      rounds.push({ showcase: '<div class="cls-item"><span class="seq-show">' + L[s] + " " + L[s + 1] + " " + L[s + 2] + " <b>?</b></span></div>", showcaseClass: "cls-showcase",
        prompt: L[s + 2] + " के बाद कौन सा अक्षर आता है?", say: L[s] + ", " + L[s + 1] + ", " + L[s + 2] + "। आगे कौन सा अक्षर आता है?",
        fact: "शाबाश! " + L[s + 2] + " के बाद " + ans + " आता है!",
        options: U.shuffle([ans].concat(wrong)).map(function (l) { return { html: l, speak: l, correct: l === ans }; }) });
    }
    return { type: "quiz", lang: "hi", instruction: title, narrateOptions: false, bg: "game--hindi", rounds: rounds };
  }
  function hindiOrder() {
    var seqs = [];
    [C.hindiSwar, C.hindiVyanjan].forEach(function (list) {
      for (var i = 0; i < 3; i++) {
        var n = cfg().difficulty <= 2 ? 3 : 4, s = Math.floor(Math.random() * (list.length - n));
        seqs.push({ p: "अक्षरों को क्रम से छुओ!", items: list.slice(s, s + n).map(function (h) { return ['<span class="seq-letter">' + h.L + "</span>", h.L]; }) });
      }
    });
    return orderGame(seqs, { instruction: "अक्षरों को सही क्रम में लगाओ!", lang: "hi", wrongSay: "पहले कौन सा अक्षर आता है?" });
  }
  function hindiFind() {
    var items = HIN_WORDS.filter(function (h) { return h.img || h.emoji; }).map(function (h) { return it(h.word, h.img ? img(h.img) : h.emoji, { f: "शाबाश! यह " + h.word + " है!" }); });
    return findQuiz(items, { lang: "hi", instruction: "चित्र ढूँढो!", ask: function (x) { return x.n + " कहाँ है?"; } });
  }

  /* ================================ BIRDS ================================ */
  function B(key, emoji, name) { return it(name, art(key, emoji, name)); }
  function birdPool() {
    return { peacock: B("peacock", "🦚", "Peacock"), parrot: B("parrot", "🦜", "Parrot"), owl: B("owl", "🦉", "Owl"), duck: B("duck", "🦆", "Duck"),
      hen: B("hen", "🐔", "Hen"), rooster: B("rooster", "🐓", "Rooster"), penguin: B("penguin", "🐧", "Penguin"), flamingo: B("flamingo", "🦩", "Flamingo"),
      eagle: B("eagle", "🦅", "Eagle"), crow: B("crow", "🐦", "Crow"), pelican: B("pelican", "🐦", "Pelican"), swan: B("swan", "🦢", "Swan") };
  }
  var BIRD_RIDDLES = [
    ["I have shiny blue and green feathers, and I dance in the rain. Who am I?", "peacock", "The peacock! India's national bird."],
    ["I can copy your words and say hello! Who am I?", "parrot", "The parrot can learn to talk!"],
    ["I hoot at night and can turn my head far around. Who am I?", "owl", "The owl! It sees well in the dark."],
    ["I say quack, quack and swim in the pond. Who am I?", "duck", "The duck! Its feet are like paddles."],
    ["I lay eggs and say cluck, cluck. Who am I?", "hen", "The hen!"],
    ["I wake everyone up: cock-a-doodle-doo! Who am I?", "rooster", "The rooster!"],
    ["I cannot fly, but I swim fast in icy water. Who am I?", "penguin", "The penguin!"],
    ["I am pink and I sleep standing on one leg. Who am I?", "flamingo", "The flamingo!"],
    ["I fly very high and have super sharp eyes. Who am I?", "eagle", "The eagle!"],
    ["I am black and clever, and I say caw, caw. Who am I?", "crow", "The crow!"],
    ["I scoop up fish in the big pouch under my beak. Who am I?", "pelican", "The pelican!"],
    ["I am white and glide on the lake with my long neck. Who am I?", "swan", "The swan!"]
  ];
  function birdFly() {
    return classify([
      it("Sparrow", art("sparrow", "🐦", "Sparrow"), { f: "A sparrow can fly!" }), it("Eagle", art("eagle", "🦅", "Eagle"), { f: "An eagle flies high in the sky!" }),
      it("Parrot", art("parrot", "🦜", "Parrot"), { f: "A parrot can fly!" }), it("Butterfly", "🦋", { f: "A butterfly flies with its pretty wings!" }),
      it("Bee", "🐝", { f: "A bee buzzes and flies from flower to flower!" }), it("Bat", "🦇", { f: "A bat can fly at night!" }),
      it("Penguin", art("penguin", "🐧", "Penguin"), { k: 1, f: "A penguin cannot fly, but it swims very fast!" }),
      it("Dog", art("dog", "🐶", "Dog"), { k: 1, f: "A dog cannot fly. It runs!" }), it("Fish", art("fish", "🐟", "Fish"), { k: 1, f: "A fish cannot fly. It swims!" }),
      it("Elephant", art("elephant", "🐘", "Elephant"), { k: 1, f: "An elephant cannot fly. It is too big!" }), it("Cow", art("cow", "🐮", "Cow"), { k: 1, f: "A cow cannot fly. It walks on four legs." })
    ], YES_NO("It can fly", "It can't fly"), "Can it fly?", { instruction: "Can it fly? Tap green for yes, red for no!" });
  }
  function birdOrNot() {
    return classify([
      it("Parrot", art("parrot", "🦜", "Parrot"), { f: "A parrot is a bird. It has feathers!" }), it("Penguin", art("penguin", "🐧", "Penguin"), { f: "A penguin is a bird, even though it can't fly!" }),
      it("Hen", art("hen", "🐔", "Hen"), { f: "A hen is a bird. Birds lay eggs!" }), it("Owl", art("owl", "🦉", "Owl"), { f: "An owl is a bird with soft feathers." }),
      it("Duck", art("duck", "🦆", "Duck"), { f: "A duck is a bird!" }), it("Peacock", art("peacock", "🦚", "Peacock"), { f: "A peacock is a bird!" }),
      it("Bat", "🦇", { k: 1, f: "A bat flies, but it is not a bird. It has fur!" }), it("Butterfly", "🦋", { k: 1, f: "A butterfly is an insect, not a bird." }),
      it("Cat", art("cat", "🐱", "Cat"), { k: 1, f: "A cat is not a bird. It has fur and whiskers." }), it("Frog", art("frog", "🐸", "Frog"), { k: 1, f: "A frog is not a bird. It hops and swims." }),
      it("Fish", art("fish", "🐟", "Fish"), { k: 1, f: "A fish is not a bird. It has fins." })
    ], YES_NO("Bird", "Not a bird"), "Is it a bird?", { instruction: "Bird or not a bird? Birds have feathers!" });
  }
  function birdSwim() {
    return classify([
      it("Duck", art("duck", "🦆", "Duck"), { f: "Ducks swim with their webbed feet!" }), it("Swan", art("swan", "🦢", "Swan"), { f: "Swans swim on lakes!" }),
      it("Penguin", art("penguin", "🐧", "Penguin"), { f: "Penguins are super swimmers!" }), it("Pelican", art("pelican", "🐦", "Pelican"), { f: "Pelicans float on the water and catch fish!" }),
      it("Sparrow", art("sparrow", "🐦", "Sparrow"), { k: 1, f: "Sparrows don't swim. They just splash in puddles to wash!" }),
      it("Parrot", art("parrot", "🦜", "Parrot"), { k: 1, f: "Parrots live in trees. They don't swim." }), it("Owl", art("owl", "🦉", "Owl"), { k: 1, f: "Owls don't swim. They fly at night." }),
      it("Hen", art("hen", "🐔", "Hen"), { k: 1, f: "Hens don't swim. They peck on the ground." }), it("Crow", art("crow", "🐦", "Crow"), { k: 1, f: "Crows don't swim." })
    ], YES_NO("It swims", "It doesn't swim"), "Can this bird swim?");
  }
  var BIRD_FOOD = { nectar: it("Nectar from flowers", "🌺"), fish: it("Fish", "🐟"), bugs: it("Bugs", "🐛"), grain: it("Grain", "🌾"),
    fruit: it("Fruit", "🍎"), mouse: it("Mouse", "🐭"), plants: it("Water plants", "🌿") };
  var BIRD_FOOD_Q = [
    ["What does a hummingbird drink?", "nectar", "Hummingbirds sip sweet nectar from flowers!"],
    ["What does a pelican catch in its pouch?", "fish", "Pelicans scoop up fish!"],
    ["What does a woodpecker look for in tree bark?", "bugs", "Tap, tap! Woodpeckers find bugs in the bark."],
    ["What does a hen peck from the ground?", "grain", "Hens peck grain and seeds."],
    ["What does a parrot love to munch?", "fruit", "Parrots love fruit and seeds!"],
    ["What does an owl hunt at night?", "mouse", "Owls hunt mice in the dark."],
    ["What does a duck nibble in the pond?", "plants", "Ducks nibble water plants and tiny bugs."],
    ["What does a kingfisher dive into the river to catch?", "fish", "Splash! The kingfisher catches a fish."]
  ];

  /* ================================ BODY ================================ */
  // Chiku's photos (js/data/chiku.js): every body picture is the same real-looking child
  function CK(k) { return it(Kido.chiku.PARTS[k].name, Kido.chiku.crop(k)); }
  var BODY_POOL = { eyes: CK("eyes"), ears: CK("ears"), nose: CK("nose"), tongue: CK("tongue"), hand: CK("hands"), legs: CK("legs"),
    teeth: CK("teeth"), brain: CK("brain"), heart: CK("heart"), lungs: CK("lungs"), bones: CK("bones"), muscles: CK("muscles"), feet: CK("feet") };
  var SENSES = [
    ["What do you see with?", "eyes", "You see with your eyes!"], ["What do you hear with?", "ears", "You hear with your ears!"],
    ["What do you smell a flower with?", "nose", "You smell with your nose!"], ["What do you taste ice cream with?", "tongue", "You taste with your tongue!"],
    ["What do you touch a soft teddy with?", "hand", "You feel things with your hands!"], ["What do you walk with?", "legs", "You walk with your legs!"],
    ["What do you chew food with?", "teeth", "You chew with your teeth!"], ["What do you think with?", "brain", "You think with your brain!"]
  ];
  var INSIDE = [
    ["What pumps blood all around your body? Thump, thump!", "heart", "Your heart pumps blood all day and night!", ["brain", "lungs", "bones", "muscles", "teeth"]],
    ["What fills up with air when you breathe in?", "lungs", "Your lungs breathe in fresh air!", ["brain", "heart", "bones", "muscles", "teeth"]],
    ["What helps you think and remember?", "brain", "Your brain thinks, learns and remembers!", ["heart", "lungs", "bones", "muscles", "teeth"]],
    ["What makes your body strong so you can stand tall?", "bones", "Your bones hold you up!", ["heart", "lungs", "brain", "muscles", "teeth"]],
    ["What helps you lift and move?", "muscles", "Your muscles help you move and lift!", ["heart", "lungs", "brain", "bones", "teeth"]]
  ];
  var FEEL = {}; Kido.chiku.FEELINGS.forEach(function (f) { FEEL[f] = it(f.charAt(0).toUpperCase() + f.slice(1), Kido.chiku.face(f)); });
  var FEEL_Q = [
    ["You got a birthday present! How do you feel?", "happy", "Happy! Presents make us smile."],
    ["Your ice cream fell on the floor. How do you feel?", "sad", "Sad. It's okay to feel sad sometimes."],
    ["It is late and you yawn. How do you feel?", "sleepy", "Sleepy! Time for bed."],
    ["Wow, a surprise party! How do you feel?", "surprised", "Surprised! What a surprise!"],
    ["Thunder goes BOOM in the dark. How do you feel?", "scared", "Scared. A hug from a grown-up helps!"],
    ["Someone knocked down your block tower. How do you feel?", "angry", "Angry. Take a deep breath and tell a grown-up."],
    ["You make a funny face in the mirror. How do you feel?", "silly", "Silly! Funny faces are fun."]
  ];
  var WEAR = { shoes: it("Shoes", "👟"), cap: it("Cap", "🧢"), gloves: it("Gloves", "🧤"), coat: it("Raincoat", "🧥"),
    glasses: it("Sunglasses", "🕶️"), scarf: it("Scarf", "🧣"), socks: it("Socks", "🧦"), shorts: it("Shorts", "🩳") };
  var WEAR_Q = [
    ["What do you wear on your feet to run?", "shoes", "Shoes keep your feet safe!", ["socks"]],
    ["The sun is hot. What do you wear on your head?", "cap", "A cap shades your face from the sun!"],
    ["Your hands are cold. What do you wear?", "gloves", "Gloves keep your hands warm!"],
    ["It is raining. What do you wear to stay dry?", "coat", "A raincoat keeps you dry!"],
    ["The sun is very bright. What protects your eyes?", "glasses", "Sunglasses protect your eyes!"],
    ["It is cold and windy. What goes around your neck?", "scarf", "A scarf keeps your neck warm!"],
    ["What goes on your feet before your shoes?", "socks", "Socks first, then shoes!", ["shoes"]],
    ["It is a hot summer day. What do you wear?", "shorts", "Shorts keep you cool in summer!"]
  ];

  /* ================================ GREETINGS & PEOPLE ================================ */
  var MAGIC = [
    { q: "Someone gives you a gift. What do you say?", a: "Thank you!", w: ["Go away!", "Give me more!"], e: "🎁" },
    { q: "You want some water. What do you say?", a: "Water, please!", w: ["Water! Now!", "Nothing"], e: "🥛" },
    { q: "You bump into a friend by mistake. What do you say?", a: "Sorry!", w: ["Ha ha!", "Move!"], e: "🤕" },
    { q: "You need to walk past someone. What do you say?", a: "Excuse me!", w: ["Push!", "Out of my way!"], e: "🚶" },
    { q: "Your friend says thank you. What do you say?", a: "You're welcome!", w: ["Whatever!", "No!"], e: "😊" },
    { q: "Grandpa sneezes. What do you say?", a: "Bless you!", w: ["Yuck!", "Stop it!"], e: "🤧" },
    { q: "You want to play with a friend's toy. What do you say?", a: "May I play, please?", w: ["Give it!", "Mine!"], e: "🧸" },
    { q: "A friend helped you tie your shoes. What do you say?", a: "Thank you!", w: ["Bye!", "Good night!"], e: "👟" }
  ];
  var HELLO_INDIA = [
    it("Namaste — Hindi", "🙏", { s: "Namaste! That is how we say hello in Hindi." }),
    it("Vanakkam — Tamil", "🌺", { s: "Vanakkam! That is hello in Tamil." }),
    it("Namaskara — Kannada", "🌼", { s: "Namaskara! That is hello in Kannada." }),
    it("Namaskaram — Telugu", "🌸", { s: "Namaskaram! That is hello in Telugu." }),
    it("Namaskaram — Malayalam", "🥥", { s: "Namaskaram! That is hello in Malayalam too." }),
    it("Sat Sri Akal — Punjabi", "🌾", { s: "Sat Sri Akal! That is hello in Punjabi." }),
    it("Kem cho — Gujarati", "🪁", { s: "Kem cho! That means how are you, in Gujarati." }),
    it("Nomoshkar — Bengali", "🐟", { s: "Nomoshkar! That is hello in Bengali." }),
    it("Namaskar — Marathi", "🏵️", { s: "Namaskar! That is hello in Marathi." }),
    it("Hello — English", "👋", { s: "Hello! That is hello in English." })
  ];
  var FAMILY = [it("Mother", "👩"), it("Father", "👨"), it("Grandmother", "👵"), it("Grandfather", "👴"), it("Baby", "👶"), it("Brother", "👦"), it("Sister", "👧")];
  var HELPERS = { doctor: it("Doctor", "🧑‍⚕️"), fire: it("Firefighter", "🧑‍🚒"), teacher: it("Teacher", "🧑‍🏫"), farmer: it("Farmer", "🧑‍🌾"),
    cook: it("Cook", "🧑‍🍳"), pilot: it("Pilot", "🧑‍✈️"), police: it("Police officer", "👮"), mechanic: it("Mechanic", "🧑‍🔧"), astronaut: it("Astronaut", "🧑‍🚀"), painter: it("Painter", "🧑‍🎨") };
  var HELPER_Q = [
    ["Who helps you get well when you are sick?", "doctor", "The doctor helps us feel better!"],
    ["Who puts out fires?", "fire", "Firefighters are brave helpers!"],
    ["Who teaches you at school?", "teacher", "Teachers help us learn!"],
    ["Who grows rice and vegetables?", "farmer", "Farmers grow our food!"],
    ["Who cooks yummy food in a kitchen?", "cook", "The cook makes tasty food!"],
    ["Who flies an airplane?", "pilot", "The pilot flies the plane!"],
    ["Who keeps us safe on the roads?", "police", "Police officers keep us safe!"],
    ["Who fixes cars and machines?", "mechanic", "The mechanic fixes things!"],
    ["Who travels to space in a rocket?", "astronaut", "Astronauts go to space!"],
    ["Who paints beautiful pictures?", "painter", "The painter makes art!"]
  ];

  /* ================================ GADGETS ================================ */
  var GADGETS = [it("Phone", "📱"), it("Laptop", "💻"), it("Television", "📺"), it("Camera", "📷"), it("Radio", "📻"), it("Light bulb", "💡"),
    it("Battery", "🔋"), it("Headphones", "🎧"), it("Keyboard", "⌨️"), it("Computer mouse", "🖱️"), it("Printer", "🖨️"), it("Watch", "⌚"),
    it("Robot", "🤖"), it("Torch", "🔦"), it("Microphone", "🎤"), it("Alarm clock", "⏰")];
  var GPOOL = {}; GADGETS.forEach(function (g) { GPOOL[g.n] = g; });
  var GADGET_Q = [
    ["Which one tells the time and rings in the morning?", "Alarm clock", "The alarm clock wakes us up!"],
    ["Which one takes photos?", "Camera", "Click! The camera takes photos."],
    ["Which one lights up the room?", "Light bulb", "The light bulb makes light from electricity!"],
    ["Which one plays music right into your ears?", "Headphones", "Headphones play music for you!"],
    ["Which one lights the way in the dark?", "Torch", "A torch is a light you can carry!"],
    ["Which one makes your voice loud?", "Microphone", "A microphone makes your voice loud!"],
    ["Which one can you call grandma on?", "Phone", "Ring, ring! Call grandma on the phone."],
    ["Which one shows cartoons and news?", "Television", "The television shows programmes!"],
    ["Which one gives power to a toy?", "Battery", "A battery stores power for toys!"],
    ["Which one prints pictures on paper?", "Printer", "The printer puts pictures on paper!"]
  ];
  var COMPUTER_Q = [
    ["Which part do you type letters on?", "Keyboard", "You type on the keyboard!"],
    ["Which part do you click and point with?", "Computer mouse", "Click, click! That's the mouse."],
    ["Which part puts your drawing on paper?", "Printer", "The printer prints it out!"],
    ["Which part lets you listen without disturbing others?", "Headphones", "Headphones! Shh, nice and quiet."],
    ["Which part lets your friend hear you on a video call?", "Microphone", "The microphone hears your voice!"],
    ["Which one is a whole computer you can carry?", "Laptop", "A laptop folds up and goes with you!"]
  ];

  /* ================================ STRUCTURES ================================ */
  var TOOLS = { hammer: it("Hammer", "🔨"), saw: it("Saw", "🪚"), screwdriver: it("Screwdriver", "🪛"), spanner: it("Spanner", "🔧"),
    ruler: it("Ruler", "📏"), ladder: it("Ladder", "🪜"), pick: it("Pickaxe", "⛏️"), brush: it("Paintbrush", "🖌️"), crane: it("Crane", "🏗️"), bucket: it("Bucket", "🪣") };
  var TOOL_Q = [
    ["Which tool bangs in nails?", "hammer", "Bang, bang! The hammer hits nails."],
    ["Which tool cuts wood?", "saw", "Zzz, zzz! The saw cuts wood."],
    ["Which tool turns screws?", "screwdriver", "The screwdriver turns screws!"],
    ["Which tool tightens nuts and bolts?", "spanner", "The spanner tightens bolts!"],
    ["Which tool measures how long something is?", "ruler", "The ruler measures!"],
    ["Which one helps you climb up high?", "ladder", "Up the ladder, step by step!"],
    ["Which tool breaks hard rocks?", "pick", "The pickaxe breaks rocks!"],
    ["Which tool paints the walls?", "brush", "Swish! The paintbrush paints."],
    ["Which machine lifts heavy things up high?", "crane", "The crane lifts heavy loads!"],
    ["Which one carries water or sand?", "bucket", "The bucket carries water and sand!"]
  ];
  var HOMES = { tent: it("Tent", "⛺"), hut: it("Hut", "🛖"), castle: it("Castle", "🏰"), flats: it("Tall building", "🏢"), house: it("House with a garden", "🏡"), igloo: it("Igloo", "🧊") };
  var HOME_Q = [
    ["Which home can you fold up and carry when camping?", "tent", "A tent! Perfect for camping."],
    ["Which home is made of mud and straw?", "hut", "A hut, made of mud and straw!"],
    ["Where did kings and queens live?", "castle", "A castle, with big stone walls!"],
    ["Which home has many families living one above another?", "flats", "A tall building with many flats!"],
    ["Which home has a garden with flowers?", "house", "A house with a garden!"],
    ["Which home is built from blocks of ice?", "igloo", "An igloo! Made of ice blocks in the snowy north."]
  ];

  /* ================================ VEHICLES ================================ */
  function V(key, emoji, name) { return it(name, emoji, { key: key }); }
  var VEH = [V("car", "🚗", "Car"), V("bus", "🚌", "Bus"), V("train", "🚆", "Train"), V("bicycle", "🚲", "Bicycle"), V("truck", "🚚", "Truck"),
    V("tractor", "🚜", "Tractor"), V("motorcycle", "🏍️", "Motorcycle"), V("taxi", "🚕", "Taxi"), V("ambulance", "🚑", "Ambulance"),
    V("firetruck", "🚒", "Fire truck"), V("police", "🚓", "Police car"), V("ship", "🚢", "Ship"), V("sailboat", "⛵", "Sailboat"), V("canoe", "🛶", "Canoe"),
    V("speedboat", "🚤", "Speedboat"), V("airplane", "✈️", "Airplane"), V("helicopter", "🚁", "Helicopter"), V("rocket", "🚀", "Rocket"), V("parachute", "🪂", "Parachute"),
    // 2026-11-08 photos (§25); the emoji is only the fallback
    V("scooter", "🛵", "Scooter"), V("auto_rickshaw", "🛺", "Auto rickshaw"), V("school_bus", "🚌", "School bus"), V("tram", "🚋", "Tram"),
    V("metro", "🚇", "Metro train"), V("submarine", "🚢", "Submarine"), V("hot_air_balloon", "🎈", "Hot air balloon")];
  function veh(name) { return VEH.filter(function (v) { return v.n === name; })[0]; }
  var FASTER = [["Rocket", "Bicycle"], ["Airplane", "Bus"], ["Train", "Tractor"], ["Car", "Bicycle"], ["Speedboat", "Canoe"], ["Motorcycle", "Bicycle"], ["Helicopter", "Sailboat"], ["Airplane", "Ship"]];

  /* =================== 2026-11-08: animal homes, vegetables, more vehicles =================== */
  var HOME_SAY = { ocean: "in the ocean", fresh: "in rivers and ponds", land: "on land" };
  // Photo animals that live in one place; `newFirst` puts the 2026-11-08 animals (they have a fact) before the old friends.
  function homeAnimals(home, newFirst) {
    var CR = Kido.creatures, keys = CR.byHome ? CR.byHome(home) : [];
    var list = keys.map(function (k) { var r = CR.get(k); return it(r.name, CR.render(k, { name: r.name }), { key: k, s: r.name + "! " + (r.fact || r.name + " lives " + HOME_SAY[home] + ".") }); });
    return newFirst ? U.shuffle(list.filter(function (x) { return CR.get(x.key).fact; })).concat(U.shuffle(list.filter(function (x) { return !CR.get(x.key).fact; }))) : list;
  }
  function vegIs(v) { return /s$/.test(v.name) ? v.name + " are vegetables!" : "The " + v.name.toLowerCase() + " is a vegetable!"; }
  function vimg(k) { return img(I + "vehicles/" + k + ".jpg"); }
  var SITE = [["excavator", "Excavator", vimg("excavator"), "It digs big holes with its bucket."], ["bulldozer", "Bulldozer", vimg("bulldozer"), "It pushes dirt and rocks with its big blade."],
    ["cement_mixer", "Cement Mixer", vimg("cement_mixer"), "Its drum turns round and round to mix concrete."], ["crane", "Crane", vimg("crane"), "It lifts heavy things up high."],
    ["garbage_truck", "Garbage Truck", vimg("garbage_truck"), "It collects rubbish and keeps the city clean."], ["tractor", "Tractor", vimg("tractor"), "It pulls heavy loads on the farm."]];
  var MORE_VEH = [["scooter", "Scooter", vimg("scooter"), "It zooms through the city on two wheels."], ["auto_rickshaw", "Auto Rickshaw", vimg("auto_rickshaw"), "It has three wheels and carries people around town."],
    ["school_bus", "School Bus", vimg("school_bus"), "It takes children to school and back home."], ["tram", "Tram", vimg("tram"), "It runs on rails in the city street."],
    ["metro", "Metro Train", vimg("metro"), "It carries lots of people quickly across the city."], ["sailboat", "Sailboat", vimg("sailboat"), "The wind pushes its sail across the water."],
    ["submarine", "Submarine", vimg("submarine"), "It can dive deep under the sea."], ["hot_air_balloon", "Hot Air Balloon", vimg("hot_air_balloon"), "Hot air makes it float up into the sky."]];
  // Every line these games build at run time (scripts/voice/harvest.js records them; else the device voice is used).
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var out = [];
    ["ocean", "fresh", "land"].forEach(function (h) {
      out.push("Which one does not live " + HOME_SAY[h] + "?");
      homeAnimals(h).forEach(function (x) {
        var lives = x.n + " lives " + HOME_SAY[h] + ".";
        out.push(x.s, lives, "Yes! " + lives, "Oops! " + lives, x.n + ". Where does it live?", "Yes! The " + x.n.toLowerCase() + " lives " + HOME_SAY[h] + ".", "Find the " + x.n.toLowerCase() + "!");
      });
    });
    C.vegetables.forEach(function (v) {
      out.push(v.name + "! " + v.funFact, "Yes! " + v.funFact, "Oops! " + v.funFact, v.name + ". Where does it grow?", "Find the " + v.name.toLowerCase() + "!",
        vegIs(v), "Yes! " + vegIs(v), "Oops! " + vegIs(v), v.name + ". Fruit or vegetable?");
      if (v.color) out.push("Find the " + v.color + " vegetable!", "Yes! The " + v.name.toLowerCase() + " is " + v.color + "!");
    });
    C.fruits.forEach(function (f) {
      if (!f.img) return;
      var is = "The " + f.name.toLowerCase() + " is a fruit";
      out.push(f.name + "! " + f.funFact, "Yes! " + is + ".", is + "!", "Yes! " + is + "!", "Oops! " + is + "!", f.name + ". Fruit or vegetable?");
    });
    SITE.concat(MORE_VEH).forEach(function (v) { out.push(v[1] + "! " + v[3]); });
    VEH.forEach(function (v) {
      ["moves on land.", "moves on water.", "moves through the air."].forEach(function (w) { var t = "The " + v.n.toLowerCase() + " " + w; out.push(t, "Yes! " + t, "Oops! " + t); });
      out.push(v.n + ". Where does it go?");
    });
    return out;
  });

  /* =========== 2026-11-08: original logic puzzles =========== */
  // Balance Scale: younger children read a tipped scale (the side that
  // goes DOWN is heavier); older ones solve picture algebra: 1 jackfruit = 3 papayas, so 2 jackfruits = ? papayas.
  function produce(k) {
    var f = C.fruits.filter(function (x) { return x.key === k; })[0] || C.vegetables.filter(function (x) { return x.key === k; })[0];
    return { key: k, name: f.name, img: f.img, pl: PLURAL[k] || f.name.toLowerCase() + "s" };
  }
  var PLURAL = { tomato: "tomatoes", peas: "peas", grapes: "grapes", cherry: "cherries", litchi: "litchis", corn: "corn cobs" };
  var SCALE_PAIRS = [["jackfruit", "papaya", 3], ["watermelon", "apple", 3], ["pumpkin", "tomato", 3], ["pineapple", "banana", 2],
    ["muskmelon", "guava", 2], ["coconut", "lemon", 2], ["cabbage", "onion", 2]];
  var SCALE_LIGHT = ["apple", "orange", "guava", "lemon", "onion", "pear", "plum"];
  function scaleSvg(left, right, tilt, rightAsk) {
    var a = tilt * 9 * Math.PI / 180, dy = Math.sin(a) * 92, dx = 92 - Math.cos(a) * 92;
    function pan(items, x, y, ask) {
      var n = items.length, sz = n > 3 ? 26 : 34, w = n * (sz + 3) - 3, out = "";
      out += '<line x1="' + x + '" y1="' + (y - 34) + '" x2="' + (x - 50) + '" y2="' + y + '" class="bs-rope"/><line x1="' + x + '" y1="' + (y - 34) + '" x2="' + (x + 50) + '" y2="' + y + '" class="bs-rope"/>';
      out += '<path d="M' + (x - 56) + " " + y + " Q" + x + " " + (y + 24) + " " + (x + 56) + " " + y + 'Z" class="bs-pan"/>';
      if (ask) out += '<text x="' + x + '" y="' + (y - 6) + '" class="bs-ask">?</text>';
      else items.forEach(function (src, i) { out += '<image href="' + src + '" x="' + (x - w / 2 + i * (sz + 3)) + '" y="' + (y - sz - 1) + '" width="' + sz + '" height="' + sz + '" preserveAspectRatio="xMidYMid slice"/>'; });
      return out;
    }
    return '<svg class="bs-scale" viewBox="0 -14 300 190"><rect x="118" y="160" width="64" height="12" rx="6" class="bs-base"/><rect x="146" y="40" width="8" height="122" class="bs-post"/>' +
      '<line x1="' + (58 + dx) + '" y1="' + (40 - dy) + '" x2="' + (242 - dx) + '" y2="' + (40 + dy) + '" class="bs-beam"/><circle cx="150" cy="40" r="7" class="bs-pin"/>' +
      pan(left, 58 + dx, 74 - dy) + pan(right, 242 - dx, 74 + dy, rightAsk) + "</svg>";
  }
  function rep(src, n) { var o = []; for (var i = 0; i < n; i++) o.push(src); return o; }
  function scaleGroup(f, n) { return '<span class="bs-group">' + rep('<img src="' + f.img + '" alt="" draggable="false"/>', n).join("") + "</span>"; }
  function balanceScale() {
    var rounds = [], young = cfg().difficulty <= 2;
    for (var i = 0; i < nR(); i++) {
      if (young) {
        var f = produce(U.pick(SCALE_LIGHT)), l = 1 + Math.floor(Math.random() * 4), r = l;
        while (r === l) r = 1 + Math.floor(Math.random() * 4);
        var heavy = Math.max(l, r);
        rounds.push({ showcase: '<div class="cls-item">' + scaleSvg(rep(f.img, l), rep(f.img, r), l > r ? -1 : 1) + "</div>", showcaseClass: "cls-showcase",
          prompt: "Which side is heavier?", say: "Which side is heavier?", fact: "Yes! " + heavy + " " + f.pl + " are heavier, so that side goes down.",
          shuffleOptions: false, options: [{ html: scaleGroup(f, l), pic: true, speak: l + "", correct: l > r }, { html: scaleGroup(f, r), pic: true, speak: r + "", correct: r > l }] });
      } else {
        var pr = U.pick(SCALE_PAIRS), big = produce(pr[0]), small = produce(pr[1]), k = pr[2], n = 2 + Math.floor(Math.random() * 2), ans = n * k;
        var opts = [ans]; while (opts.length < Math.min(4, nO() + 1)) { var d = ans + U.pick([-k, -1, 1, k, n]); if (d > 0 && opts.indexOf(d) < 0) opts.push(d); }
        var q = "How many " + small.pl + " balance " + n + " " + big.pl + "?";
        rounds.push({ showcase: '<div class="cls-item bs-pair">' + scaleSvg([big.img], rep(small.img, k), 0) + scaleSvg(rep(big.img, n), [], 0, true) + "</div>", showcaseClass: "cls-showcase",
          prompt: q, say: "One " + big.name.toLowerCase() + " weighs the same as " + k + " " + small.pl + ". " + q, fact: "Yes! " + ans + " " + small.pl + "!",
          options: U.shuffle(opts).map(function (v) { return { html: String(v), speak: String(v), correct: v === ans }; }) });
      }
    }
    return { type: "quiz", instruction: young ? "The heavier side goes down!" : "Use the first scale to solve the second!", narrateOptions: false, shuffleOptions: !young, rounds: rounds };
  }
  // Picture Patterns: the new fruit and vegetable photos in AB, AAB, ABB and ABC patterns.
  function picturePattern() {
    var pool = C.fruits.filter(function (f) { return f.img; }).concat(C.vegetables), rounds = [];
    for (var i = 0; i < nR(); i++) {
      var s = U.sample(pool, 3), kind = cfg().difficulty <= 2 ? U.pick([0, 0, 1]) : U.pick([1, 2, 3]);
      var unit = [[s[0], s[1]], [s[0], s[0], s[1]], [s[0], s[1], s[1]], [s[0], s[1], s[2]]][kind];
      var seq = []; while (seq.length < unit.length * 2 + (kind === 0 ? 1 : 0)) seq.push(unit[seq.length % unit.length]);
      var ans = unit[seq.length % unit.length];
      var opts = U.shuffle([ans].concat(U.sample(pool.filter(function (x) { return x !== ans && unit.indexOf(x) < 0; }), 1)).concat(unit.filter(function (x) { return x !== ans; }).slice(0, 1)));
      rounds.push({ showcase: '<div class="cls-item"><span class="pat-row">' + seq.map(function (x) { return '<img src="' + x.img + '" alt="" draggable="false"/>'; }).join("") + '<b>?</b></span></div>',
        showcaseClass: "cls-showcase", prompt: "What comes next?", say: "Look at the pattern. What comes next?", fact: "Yes! The " + ans.name.toLowerCase() + " comes next!",
        options: opts.map(function (x) { return { html: img(x.img), pic: true, speak: x.name, correct: x === ans }; }) });
    }
    return { type: "quiz", instruction: "Find the pattern!", narrateOptions: false, rounds: rounds };
  }
  // Lunch Time: match each animal to what it eats.
  var LUNCH = [["otter", "🐟", "fish"], ["kingfisher", "🐟", "fish"], ["sea_lion", "🐟", "fish"], ["polar_bear", "🦭", "seals"], ["gorilla", "🍃", "leaves and fruit"],
    ["sloth", "🍃", "leaves"], ["red_panda", "🎋", "bamboo"], ["panda", "🎋", "bamboo"], ["donkey", "🌾", "grass and hay"], ["capybara", "🌿", "grass"], ["hedgehog", "🐛", "insects and worms"],
    ["squirrel", "🌰", "nuts"], ["rabbit", "🥕", "carrots"], ["monkey", "🍌", "bananas"], ["bee", "🌼", "flower nectar"], ["koala", "🍃", "eucalyptus leaves"]];
  function lunchTime() {
    var CR = Kido.creatures, used = {}, pairs = [];
    U.shuffle(LUNCH.filter(function (x) { return CR.hasArt(x[0]); })).forEach(function (x) {
      if (used[x[1]]) return; used[x[1]] = 1;
      var r = CR.get(x[0]); pairs.push({ k: CR.render(x[0], { name: r.name }), v: x[1], say: "The " + r.name.toLowerCase() + " eats " + x[2] + "!" });
    });
    return matchGame(pairs, "Lunch time! Give each animal its food.", { instruction: "Who eats what? Give each animal its lunch!" });
  }
  (Kido.voiceGen = Kido.voiceGen || []).push(function () {
    var out = ["Which side is heavier?", "Look at the pattern. What comes next?"];
    SCALE_LIGHT.forEach(function (k) { var f = produce(k); for (var h = 2; h <= 4; h++) out.push("Yes! " + h + " " + f.pl + " are heavier, so that side goes down."); });
    SCALE_PAIRS.forEach(function (pr) {
      var big = produce(pr[0]), small = produce(pr[1]), k = pr[2];
      for (var n = 2; n <= 3; n++) { var q = "How many " + small.pl + " balance " + n + " " + big.pl + "?"; out.push("One " + big.name.toLowerCase() + " weighs the same as " + k + " " + small.pl + ". " + q, "Yes! " + n * k + " " + small.pl + "!"); }
    });
    C.fruits.filter(function (f) { return f.img; }).concat(C.vegetables).forEach(function (x) { out.push("Yes! The " + x.name.toLowerCase() + " comes next!"); });
    LUNCH.forEach(function (x) { var r = Kido.creatures.get(x[0]); if (r) out.push("The " + r.name.toLowerCase() + " eats " + x[2] + "!"); });
    return out;
  });

  /* ================================ GAMES ================================ */
  var TWINS = [["🐶", "🐕", "🐩", "🦮"], ["🍎", "🍏", "🍅", "🍒"], ["🚗", "🚙", "🚕", "🚓"], ["🌸", "🌺", "🌼", "🌻"], ["🐱", "🐈", "🐯", "🦁"],
    ["🐟", "🐠", "🐡", "🦈"], ["⭐", "🌟", "✨", "💫"], ["🌙", "🌛", "🌜", "🌝"], ["🐻", "🐼", "🐨", "🧸"], ["🍓", "🍒", "🍇", "🫐"], ["🎈", "🎀", "🎁", "🎊"], ["🐸", "🐢", "🦎", "🐊"]];
  var OPPOSITES = [["☀️", "🌙", "Day and night"], ["🔥", "❄️", "Hot and cold"], ["😀", "😢", "Happy and sad"], ["🐘", "🐭", "Big and small"],
    ["🐇", "🐢", "Fast and slow"], ["⬆️", "⬇️", "Up and down"], ["📖", "📕", "Open and closed"], ["🔊", "🔇", "Loud and quiet"], ["🌕", "🌑", "Light and dark"]];
  function patternNext() {
    var sets = [["🍎", "🍌", "🍇"], ["🔴", "🔵", "🟡"], ["🐶", "🐱", "🐭"], ["⭐", "🌙", "☀️"], ["🚗", "🚌", "🚲"], ["🌸", "🍃", "🌼"]], rounds = [];
    for (var i = 0; i < nR(); i++) {
      var s = U.shuffle(U.pick(sets).slice()), kind = cfg().difficulty <= 2 ? 0 : U.pick([0, 1, 2]);
      var unit = kind === 0 ? [s[0], s[1]] : kind === 1 ? [s[0], s[0], s[1]] : [s[0], s[1], s[2]];
      var seq = []; while (seq.length < unit.length * 2 + 1) seq.push(unit[seq.length % unit.length]);
      var ans = unit[seq.length % unit.length];
      var opts = U.shuffle([ans].concat(s.filter(function (e) { return e !== ans; }).slice(0, nO() - 1)));
      rounds.push({ showcase: '<div class="cls-item"><span class="seq-show seq-show--emoji">' + seq.join(" ") + " <b>?</b></span></div>", showcaseClass: "cls-showcase",
        prompt: "What comes next?", say: "Look at the pattern. What comes next?", fact: "Yes! You found the pattern!",
        options: opts.map(function (e) { return { html: e, pic: true, correct: e === ans }; }) });
    }
    return { type: "quiz", instruction: "Find the pattern!", narrateOptions: false, rounds: rounds };
  }

  /* ================================ WORDS ================================ */
  var RHYMES = [["Cat", "🐱", "Hat", "🎩"], ["Dog", "🐶", "Frog", "🐸"], ["Bee", "🐝", "Tree", "🌳"], ["Duck", "🦆", "Truck", "🚚"], ["Star", "⭐", "Car", "🚗"],
    ["Mouse", "🐭", "House", "🏠"], ["Goat", "🐐", "Boat", "⛵"], ["Bear", "🐻", "Pear", "🍐"], ["Moon", "🌙", "Spoon", "🥄"], ["Bell", "🔔", "Shell", "🐚"],
    ["Fish", "🐟", "Dish", "🍽️"], ["Cake", "🎂", "Snake", "🐍"], ["Sock", "🧦", "Lock", "🔒"], ["King", "🤴", "Ring", "💍"]];
  function rhymeQuiz() {
    return { type: "quiz", instruction: "Rhyming words sound the same at the end!", narrateOptions: false,
      rounds: U.sample(RHYMES, nR()).map(function (r) {
        var others = U.sample(RHYMES.filter(function (x) { return x !== r; }), nO() - 1).map(function (x) { return U.pick([[x[0], x[1]], [x[2], x[3]]]); });
        var q = "What rhymes with " + r[0].toLowerCase() + "?";
        return { showcase: '<div class="cls-item"><span class="cls-item__pic">' + r[1] + '</span><span class="cls-item__name">' + r[0] + "</span></div>", showcaseClass: "cls-showcase",
          prompt: q, say: r[0] + ". " + q, fact: "Yes! " + r[0] + " and " + r[2].toLowerCase() + " rhyme!",
          options: U.shuffle([{ html: r[3], pic: true, speak: r[2], correct: true }].concat(others.map(function (o) { return { html: o[1], pic: true, speak: o[0], correct: false }; }))) };
      }) };
  }
  var SPELL = [["CAT", "🐱"], ["DOG", "🐶"], ["SUN", "☀️"], ["BUS", "🚌"], ["HAT", "🎩"], ["PIG", "🐷"], ["COW", "🐮"], ["CAR", "🚗"], ["BED", "🛏️"], ["CUP", "☕"],
    ["FOX", "🦊"], ["EGG", "🥚"], ["KEY", "🔑"], ["BOX", "📦"], ["FISH", "🐟"], ["DUCK", "🦆"], ["CAKE", "🎂"], ["STAR", "⭐"], ["MOON", "🌙"], ["TREE", "🌳"], ["BOOK", "📖"], ["FROG", "🐸"]];
  function missingLetter() {
    var short = cfg().difficulty <= 2;
    return { type: "quiz", instruction: "Find the missing letter!", narrateOptions: false,
      rounds: U.sample(SPELL.filter(function (s) { return !short || s[0].length === 3; }), nR()).map(function (s) {
        var i = Math.floor(Math.random() * s[0].length), ans = s[0][i];
        var shown = s[0].split("").map(function (c, j) { return j === i ? "_" : c; }).join(" ");
        var wrong = U.sample(ABC.filter(function (l) { return s[0].indexOf(l) < 0; }), nO() - 1);
        return { showcase: '<div class="cls-item"><span class="cls-item__pic">' + s[1] + '</span><span class="cls-item__name spell-show">' + shown + "</span></div>", showcaseClass: "cls-showcase",
          prompt: "Which letter is missing?", say: s[0].toLowerCase() + ". Which letter is missing?", fact: "Yes! " + s[0].split("").join(" ") + ". " + s[0].toLowerCase() + "!",
          options: U.shuffle([ans].concat(wrong)).map(function (l) { return { html: l, speak: l, correct: l === ans }; }) };
      }) };
  }
  function pictureWord() {
    return { type: "quiz", instruction: "Read the word that matches the picture!", narrateOptions: false,
      rounds: U.sample(SPELL, nR()).map(function (s) {
        var wrong = U.sample(SPELL.filter(function (x) { return x !== s; }), nO() - 1).map(function (x) { return x[0]; });
        return { showcase: '<div class="cls-item"><span class="cls-item__pic">' + s[1] + "</span></div>", showcaseClass: "cls-showcase",
          prompt: "Which word is this picture?", say: "Which word is this picture?", fact: "Yes! " + s[0].toLowerCase() + "!",
          options: U.shuffle([s[0]].concat(wrong)).map(function (w) { return { html: '<span class="read-word">' + w + "</span>", speak: "", correct: w === s[0] }; }) };
      }) };
  }

  /* ================================ STORIES ================================ */
  var PICNIC = [
    { scene: "🦊🧺🌳", say: "Momo is going on a picnic!", ask: "What should Momo carry the food in?", a: "🧺 A basket", w: ["🛁 A bathtub", "🥾 A boot"], f: "A basket! Perfect for a picnic.", no: "Hmm, that won't carry the food. Try again!" },
    { scene: "🍎🍭🧱", say: "Momo wants a healthy snack.", ask: "Which snack should Momo pack?", a: "🍎 An apple", w: ["🍭 Lots of sweets", "🧱 A brick"], f: "An apple! Healthy and crunchy.", no: "That's not a healthy snack. Try again!" },
    { scene: "☀️🥵🌳", say: "At the park, the sun is very hot.", ask: "Where should Momo sit?", a: "🌳 In the shade of a tree", w: ["🔥 Next to a fire", "🛣️ On the road"], f: "In the cool shade! Smart Momo.", no: "That's not a safe, cool spot. Try again!" },
    { scene: "🐜🍞", say: "A tiny ant wants a crumb of bread.", ask: "What should Momo do?", a: "🤝 Share a crumb", w: ["😠 Stamp on it", "📣 Shout at it"], f: "Momo shares a crumb. Kind Momo!", no: "Let's be kind to the little ant. Try again!" },
    { scene: "🧃🍌🗑️", say: "The picnic is over.", ask: "What should Momo do with the rubbish?", a: "🗑️ Put it in the bin", w: ["🌳 Leave it on the grass", "🏞️ Throw it in the lake"], f: "In the bin! The park stays clean.", no: "Rubbish belongs in the bin. Try again!" }
  ];
  var RAINY = [
    { scene: "🐦🏠🌧️", say: "Tiko wakes up. Drip, drop, drip!", ask: "What is the weather?", a: "🌧️ Rainy", w: ["☀️ Sunny", "❄️ Snowy"], f: "It's raining! Drip, drop.", no: "Listen: drip, drop! Try again." },
    { scene: "🐦☔🚪", say: "Tiko wants to go outside.", ask: "What should Tiko take?", a: "☔ An umbrella", w: ["🕶️ Sunglasses", "🏖️ A beach ball"], f: "An umbrella keeps Tiko dry!", no: "That won't keep the rain off. Try again!" },
    { scene: "🐦💦🌧️", say: "There is a big puddle!", ask: "What should Tiko wear to splash?", a: "🥾 Boots", w: ["🧦 Socks", "🩴 Flip-flops"], f: "Boots! Splash, splash!", no: "Those will get soggy. Try again!" },
    { scene: "🐸💦", say: "A little frog is in the puddle.", ask: "What does the frog say?", a: "🐸 Ribbit!", w: ["🐮 Moo!", "🐶 Woof!"], f: "Ribbit, ribbit! Frogs love rain.", no: "That's a different animal. Try again!" },
    { scene: "🌤️🐦", say: "The rain stops and the sun comes out.", ask: "What do you see in the sky?", a: "🌈 A rainbow", w: ["🌙 The moon", "⛄ A snowman"], f: "A rainbow! Sun and rain make a rainbow.", no: "Sun and rain together make something colourful. Try again!" },
    { scene: "🐦🥶🏠", say: "Tiko is wet and cold.", ask: "What will warm Tiko up?", a: "☕ A warm drink and a towel", w: ["🍦 Ice cream", "🧊 Ice cubes"], f: "A warm drink and a towel. Cosy!", no: "That would make Tiko colder. Try again!" }
  ];

  /* ======================================================================
     THE NEW ACTIVITIES — [id, category, name, icon, build]
     ====================================================================== */
  var NEW = [
    // Alphabet
    ["abc-lower", "alphabet", "Big & Small Letters", "🔡", function () {
      return matchGame(U.sample(ABC, 8).map(function (l) { return { k: '<span class="seq-letter">' + l + "</span>", v: '<span class="seq-letter">' + l.toLowerCase() + "</span>", say: "Big " + l + ", small " + l }; }), "Match the big letter to the small letter!"); }],
    ["abc-next", "alphabet", "What Comes Next?", "⏭️", abcNext],
    ["abc-first", "alphabet", "First Letter", "🅱️", abcFirst],
    ["abc-order", "alphabet", "ABC Order", "🔠", abcOrder],
    // Hindi
    ["hindi-first", "hindi", "पहला अक्षर", "🔤", hindiFirst],
    ["hindi-next", "hindi", "आगे कौन?", "⏭️", function () { return hindiNext(U.pick([C.hindiSwar, C.hindiVyanjan]), "आगे कौन सा अक्षर आता है?"); }],
    ["hindi-order", "hindi", "क्रम से लगाओ", "🔢", hindiOrder],
    ["hindi-find", "hindi", "चित्र ढूँढो", "🖼️", hindiFind],
    // Birds
    ["bird-riddles", "birds", "Bird Riddles", "🦉", function () { return riddleQuiz(birdPool(), BIRD_RIDDLES, { instruction: "Listen to the riddle and find the bird!" }); }],
    ["bird-fly", "birds", "Can It Fly?", "🕊️", birdFly],
    ["bird-or-not", "birds", "Bird or Not?", "🐦", birdOrNot],
    ["bird-match", "birds", "Bird Names", "🦜", function () {
      var p = birdPool(); return matchGame(Object.keys(p).map(function (k) { return { k: p[k].e, v: word(p[k].n), say: p[k].n }; }), "Match each bird to its name!"); }],
    ["bird-count", "birds", "Count the Birds", "🔢", function () { return countGame([it("sparrows", "🐦"), it("parrots", "🦜"), it("ducks", "🦆"), it("owls", "🦉"), it("penguins", "🐧")]); }],
    ["bird-swim", "birds", "Swimming Birds", "🦢", birdSwim],
    ["bird-food", "birds", "What Do Birds Eat?", "🌾", function () { return riddleQuiz(BIRD_FOOD, BIRD_FOOD_Q, { instruction: "What do birds eat? Let's find out!" }); }],
    // Body
    ["body-explore", "body", "Body Explorer", "🧍", function () { return { type: "custom", mode: "explore", custom: function (s) { return Kido.activities.bodyTap(s); } }; }],
    ["senses", "body", "Five Senses", "👀", function () { return riddleQuiz(BODY_POOL, SENSES, { instruction: "We see, hear, smell, taste and touch!" }); }],
    ["senses-match", "body", "Sense Match", "👂", function () {
      var ck = Kido.chiku.crop, rose = it("Rose", "🌸").e;
      return matchGame([{ k: ck("eyes"), v: "🌈", say: "You see a rainbow with your eyes!" }, { k: ck("ears"), v: img(I + "objects/drum.svg"), say: "You hear a drum with your ears!" },
        { k: ck("nose"), v: rose, say: "You smell a flower with your nose!" }, { k: ck("tongue"), v: img(I + "objects/icecream.svg"), say: "You taste ice cream with your tongue!" },
        { k: ck("hands"), v: img(I + "habits/habit_toys.svg"), say: "You feel a soft teddy with your hands!" }], "Match each sense to what it enjoys!"); }],
    ["body-count", "body", "How Many?", "🖐️", function () {
      var ck = Kido.chiku.crop;
      return textQuiz([{ q: "How many eyes do you have?", a: "2", w: ["1", "4"], e: ck("eyes") }, { q: "How many noses do you have?", a: "1", w: ["2", "3"], e: ck("nose") },
        { q: "How many fingers are on one hand?", a: "5", w: ["4", "10"], e: ck("fingers") }, { q: "How many ears do you have?", a: "2", w: ["1", "3"], e: Kido.chiku.photo("happy") },
        { q: "How many legs do you have?", a: "2", w: ["4", "3"], e: ck("legs") }, { q: "How many toes are on one foot?", a: "5", w: ["3", "2"], e: ck("toes") },
        { q: "How many mouths do you have?", a: "1", w: ["2", "5"], e: ck("mouth") }, { q: "How many thumbs do you have?", a: "2", w: ["1", "10"], e: ck("hands") }], { narrate: false }); }],
    ["head-to-toe", "body", "Head to Toe", "🦶", function () {
      var ck = Kido.chiku.crop;
      return orderGame([{ p: "Tap from top to bottom!", items: [[ck("head"), "Head"], [ck("tummy"), "Tummy"], [ck("knees"), "Knees"], [ck("feet"), "Feet"]] },
        { p: "Dress from head to toe!", items: [["🧢", "Cap"], ["👕", "Shirt"], ["👖", "Trousers"], ["👟", "Shoes"]] },
        { p: "Top to bottom!", items: [[ck("hair"), "Hair"], [ck("eyes"), "Eyes"], [ck("mouth"), "Mouth"], [ck("chin"), "Chin"]] }], { instruction: "From your head down to your toes!", wrongSay: "Start at the top, near your head!" }); }],
    ["feelings", "body", "My Feelings", "😊", function () { return riddleQuiz(FEEL, FEEL_Q, { instruction: "How do you feel? All feelings are okay!" }); }],
    ["what-to-wear", "body", "What Do I Wear?", "🧥", function () { return riddleQuiz(WEAR, WEAR_Q, { instruction: "Let's get dressed!" }); }],
    ["inside-body", "body", "Inside My Body", "🫀", function () { return riddleQuiz(BODY_POOL, INSIDE, { instruction: "What's inside your body? Let's find out!" }); }],
    ["body-match", "body", "Body Words", "👃", function () {
      return matchGame(["eyes", "ears", "nose", "mouth", "hands", "feet", "teeth", "legs", "hair", "knees"]
        .map(function (k) { var n = Kido.chiku.PARTS[k].name; return { k: Kido.chiku.crop(k), v: word(n), say: n }; }), "Match each part to its name!"); }],
    // Greetings & people
    ["magic-words", "greetings", "Magic Words", "✨", function () { return textQuiz(MAGIC, { instruction: "Please, thank you and sorry are magic words!" }); }],
    ["hello-india", "greetings", "Hello Across India", "🙏", function () { return explore(HELLO_INDIA, "Hello Across India", "Tap to hear hello!", "People say hello in many languages. Tap each one!"); }],
    ["hello-goodbye", "greetings", "Hello or Goodbye?", "👋", function () {
      return classify([it("Meeting your teacher at school", "🏫", { f: "We say hello when we meet someone!" }), it("Grandma comes to visit", "👵", { f: "Hello, Grandma!" }),
        it("Answering the phone", "📞", { f: "We say hello on the phone!" }), it("A new friend in the park", "🌳", { f: "Hello, friend!" }),
        it("Leaving a birthday party", "🎉", { k: 1, f: "We say goodbye when we leave!" }), it("Your friend is going home", "🏠", { k: 1, f: "Goodbye! See you tomorrow!" }),
        it("Ending a phone call", "📱", { k: 1, f: "Bye bye! We say goodbye at the end of a call." }), it("Going to bed", "🛏️", { k: 1, f: "Good night! That's a bedtime goodbye." })],
        [["👋 Hello!", "Hello", "opt--hot"], ["🙋 Goodbye!", "Goodbye", "opt--cold"]], "Hello or goodbye?"); }],
    ["kind-unkind", "greetings", "Kind or Unkind?", "🤗", function () {
      return classify([it("Sharing your toys", "🧸", { f: "Sharing is kind!" }), it("Hugging a sad friend", "🤗", { f: "A hug is kind!" }), it("Helping pick up books", "📚", { f: "Helping is kind!" }),
        it("Giving a flower", "🌷", { f: "Giving is kind!" }), it("Taking turns on the swing", "🎠", { f: "Taking turns is kind!" }),
        it("Grabbing someone's toy", "✋", { k: 1, f: "Grabbing is unkind. Ask nicely instead." }), it("Hitting a friend", "👊", { k: 1, f: "Hitting is unkind. Use gentle hands." }),
        it("Laughing at someone who fell", "😆", { k: 1, f: "Laughing at someone is unkind. Help them up!" }), it("Knocking down a friend's tower", "🧱", { k: 1, f: "That is unkind. Build together instead." }),
        it("Leaving a friend out of a game", "🚫", { k: 1, f: "Leaving someone out is unkind. Let them play too!" })],
        YES_NO("Kind", "Unkind"), "Kind or unkind?", { instruction: "Is it kind? Green for kind, red for unkind!" }); }],
    ["table-manners", "greetings", "Table Manners", "🍽️", function () {
      return classify([it("Washing hands before eating", "🧼", { f: "Washing hands first is good manners!" }), it("Chewing with your mouth closed", "😌", { f: "Chewing with your mouth closed is good manners!" }),
        it("Saying thank you for the food", "🙏", { f: "Saying thank you is good manners!" }), it("Sitting at the table to eat", "🪑", { f: "Sitting nicely is good manners!" }),
        it("Talking with your mouth full", "🗣️", { k: 1, f: "Talking with food in your mouth is bad manners." }), it("Throwing food", "🍝", { k: 1, f: "Throwing food is bad manners." }),
        it("Playing on a phone at dinner", "📱", { k: 1, f: "Phones away at the table! Talk with your family." }), it("Grabbing from someone's plate", "🍗", { k: 1, f: "Grabbing is bad manners. Ask please!" })],
        YES_NO("Good manners", "Bad manners"), "Good manners or bad manners?"); }],
    ["meet-order", "greetings", "Meeting a Friend", "🤝", function () {
      return orderGame([{ p: "Meeting a new friend: what comes first?", items: [["👋", "Say hello"], ["😊", "Tell your name"], ["⚽", "Play together"], ["🙋", "Say goodbye"]] },
        { p: "Visiting a friend's home: in order!", items: [["🚪", "Knock on the door"], ["🙏", "Say namaste"], ["🎁", "Give the gift"], ["🍰", "Eat cake together"]] },
        { p: "A birthday party: in order!", items: [["🎉", "Arrive and say hello"], ["🎂", "Sing happy birthday"], ["🍰", "Eat the cake"], ["👋", "Say thank you and bye"]] }],
        { instruction: "What happens first, next and last?", wrongSay: "What do you do first?" }); }],
    ["family", "greetings", "My Family", "👨‍👩‍👧", function () { return findQuiz(FAMILY, { instruction: "Let's meet the family!" }); }],
    ["helpers", "greetings", "Community Helpers", "🧑‍⚕️", function () { return riddleQuiz(HELPERS, HELPER_Q, { instruction: "These people help us every day!" }); }],
    ["helper-tools", "greetings", "Helpers & Their Tools", "🩺", function () {
      return matchGame([{ k: "🧑‍⚕️", v: "🩺", say: "The doctor uses a stethoscope." }, { k: "🧑‍🚒", v: "🚒", say: "The firefighter drives a fire truck." },
        { k: "🧑‍🌾", v: "🚜", say: "The farmer drives a tractor." }, { k: "🧑‍🍳", v: "🍳", say: "The cook uses a frying pan." },
        { k: "🧑‍🏫", v: "📚", say: "The teacher reads books." }, { k: "🧑‍🎨", v: "🎨", say: "The painter uses paints." },
        { k: "🧑‍🔧", v: "🔧", say: "The mechanic uses a spanner." }, { k: "🧑‍🚀", v: "🚀", say: "The astronaut flies a rocket." }], "Match each helper to their tool!"); }],
    // Gadgets
    ["needs-power", "electronics", "Needs Electricity?", "🔌", function () {
      return classify([it("Television", "📺", { f: "A television needs electricity!" }), it("Lamp", "💡", { f: "A lamp needs electricity to shine!" }),
        it("Computer", "🖥️", { f: "A computer needs electricity!" }), it("Printer", "🖨️", { f: "A printer needs electricity!" }), it("Video game", "🎮", { f: "Video games need electricity!" }),
        it("Book", "📖", { k: 1, f: "A book doesn't need electricity. Just read it!" }), it("Ball", "⚽", { k: 1, f: "A ball doesn't need electricity. Just kick it!" }),
        it("Bicycle", "🚲", { k: 1, f: "A bicycle doesn't need electricity. You pedal it!" }), it("Kite", "🪁", { k: 1, f: "A kite flies with the wind, not electricity!" }),
        it("Teddy bear", "🧸", { k: 1, f: "A teddy doesn't need electricity. Just hug it!" }), it("Pencil", "✏️", { k: 1, f: "A pencil doesn't need electricity!" })],
        YES_NO("Needs electricity", "No electricity"), "Does it need electricity?"); }],
    ["gadget-find", "electronics", "Find the Gadget", "📱", function () { return findQuiz(GADGETS, { instruction: "Let's find the gadgets!" }); }],
    ["what-does-it-do", "electronics", "What Does It Do?", "💡", function () { return riddleQuiz(GPOOL, GADGET_Q, { instruction: "Every gadget has a job!" }); }],
    ["computer-parts", "electronics", "Computer Parts", "⌨️", function () { return riddleQuiz(GPOOL, COMPUTER_Q, { instruction: "Let's learn the parts of a computer!" }); }],
    ["power-safety", "electronics", "Electricity Safety", "⚡", function () {
      return classify([it("Asking a grown-up to plug things in", "🧑", { f: "Always ask a grown-up! That's safe." }), it("Switching off when you finish", "💡", { f: "Switching off is safe and saves power." }),
        it("Keeping water away from plugs", "🚱", { f: "Water and electricity don't mix. That's safe!" }), it("Holding the plug, not the wire", "🔌", { f: "Pull the plug, never the wire. Safe!" }),
        it("Touching a switch with wet hands", "💦", { k: 1, f: "Never touch switches with wet hands. Dry them first!" }), it("Poking things into a socket", "🥢", { k: 1, f: "Never poke a socket. It's dangerous!" }),
        it("Flying a kite near power lines", "🪁", { k: 1, f: "Fly kites far from power lines!" }), it("Climbing an electric pole", "⚡", { k: 1, f: "Never climb electric poles!" })],
        [["👍 Safe", "Safe", "opt--good"], ["⚠️ Not safe", "Not safe", "opt--bad"]], "Safe or not safe?", { instruction: "Electricity is useful, but we must be careful!" }); }],
    ["save-power", "electronics", "Save Electricity", "🌍", function () {
      return classify([it("Switching off the light when you leave", "💡", { f: "Switching off saves electricity!" }), it("Turning off the TV when no one is watching", "📺", { f: "Good! That saves electricity." }),
        it("Opening curtains for sunlight", "☀️", { f: "Sunlight is free light! That saves power." }), it("Unplugging the charger when done", "🔌", { f: "Unplugging saves power!" }),
        it("Leaving the fan on in an empty room", "🌀", { k: 1, f: "That wastes electricity. Switch it off!" }), it("Leaving the TV on all night", "📺", { k: 1, f: "That wastes electricity." }),
        it("Lights on in the bright daytime", "💡", { k: 1, f: "We don't need lights in the daytime. Switch them off!" }), it("Keeping the fridge door open", "🧊", { k: 1, f: "Close the fridge quickly to save power!" })],
        YES_NO("Saves power", "Wastes power"), "Does it save electricity?"); }],
    ["battery-plug", "electronics", "Battery or Plug?", "🔋", function () {
      return classify([it("Torch", "🔦", { f: "A torch runs on batteries!" }), it("Watch", "⌚", { f: "A watch has a tiny battery!" }), it("Alarm clock", "⏰", { f: "This clock uses a battery!" }),
        it("Game controller", "🎮", { f: "A game controller uses batteries!" }), it("Television", "📺", { k: 1, f: "A television plugs into the wall!" }),
        it("Computer", "🖥️", { k: 1, f: "A big computer plugs into the wall!" }), it("Printer", "🖨️", { k: 1, f: "A printer plugs into the wall!" }), it("Desk lamp", "💡", { k: 1, f: "A desk lamp plugs into the wall!" })],
        [["🔋 Battery", "Battery", "opt--good"], ["🔌 Plug", "Plug", "opt--cold"]], "Battery or plug?"); }],
    ["old-new", "electronics", "Then and Now", "⏳", function () {
      return matchGame([{ k: "🕯️", v: "💡", say: "Long ago, candles. Now, light bulbs!" }, { k: "✉️", v: "📧", say: "Long ago, letters. Now, emails!" },
        { k: "☎️", v: "📱", say: "Long ago, big phones. Now, mobile phones!" }, { k: "📻", v: "🎧", say: "Long ago, radios. Now, headphones too!" },
        { k: "🧮", v: "💻", say: "Long ago, the abacus. Now, computers!" }, { k: "🗺️", v: "🛰️", say: "Long ago, paper maps. Now, satellites guide us!" }], "Match the old thing to the new one!"); }],
    ["gadget-explore", "electronics", "Gadget Explorer", "🤖", function () {
      return explore([it("Light bulb", "💡", { s: "A light bulb turns electricity into light!" }), it("Phone", "📱", { s: "A phone lets you talk to people far away!" }),
        it("Robot", "🤖", { s: "A robot is a machine that follows instructions!" }), it("Camera", "📷", { s: "A camera catches pictures with light!" }),
        it("Battery", "🔋", { s: "A battery stores electricity for later!" }), it("Computer", "💻", { s: "A computer helps us learn, write and draw!" }),
        it("Satellite", "🛰️", { s: "A satellite flies around the Earth and sends us signals!" }), it("Microphone", "🎤", { s: "A microphone catches your voice!" })],
        "Gadget Explorer", "Tap a gadget to learn about it!", "Tap each gadget!"); }],
    // Flowers
    ["flower-colours", "flowers", "Flower Colours", "🌈", function () {
      var F = [["rose", "🌹", "Rose", "red"], ["sunflower", "🌻", "Sunflower", "yellow"], ["lotus", "🌸", "Lotus", "pink"], ["lavender", "💜", "Lavender", "purple"],
        ["marigold", "🌼", "Marigold", "orange"], ["daisy", "🌼", "Daisy", "white"]].map(function (f) { return it(f[2], art(f[0], f[1], f[2]), { c: f[3] }); });
      return findQuiz(F, { instruction: "Flowers come in lovely colours!", ask: function (x) { return "Find the " + x.c + " flower!"; },
        differ: function (a, b) { return a.c !== b.c; }, fact: function (x) { return "Yes! The " + x.n.toLowerCase() + " is " + x.c + "!"; } }); }],
    ["plant-parts", "flowers", "Parts of a Plant", "🌱", function () {
      var P = { root: "Roots drink water from the soil.", stem: "The stem holds the plant up tall.", leaf: "Leaves make food from sunlight.", flower: "The flower makes seeds." };
      return textQuiz(Object.keys(P).map(function (k) {
        var names = { root: "Roots", stem: "Stem", leaf: "Leaf", flower: "Flower" };
        return { q: "What is this part of the plant?", a: names[k], w: U.sample(Object.keys(names).filter(function (x) { return x !== k; }), 2).map(function (x) { return names[x]; }), e: plantSvg(k), f: "Yes! " + P[k] };
      }), { instruction: "Look at the glowing part of the plant!" }); }],
    ["flower-match", "flowers", "Flower Names", "🌷", function () {
      return matchGame(C.flowers.filter(function (f) { return f.key !== "bouquet"; }).map(function (f) { return { k: art(f.key, f.emoji, f.name), v: word(f.name), say: f.name }; }), "Match each flower to its name!"); }],
    ["flower-count", "flowers", "Count the Flowers", "🌸", function () { return countGame([it("marigolds", "🌼"), it("sunflowers", "🌻"), it("tulips", "🌷"), it("roses", "🌹")]); }],
    ["plant-needs", "flowers", "What Plants Need", "💧", function () {
      return classify([it("Water", "💧", { f: "Plants need water to drink!" }), it("Sunlight", "☀️", { f: "Plants need sunlight to make food!" }), it("Air", "🌬️", { f: "Plants need air!" }),
        it("Soil", "🪴", { f: "Plants grow their roots in soil!" }), it("Sweets", "🍬", { k: 1, f: "Plants don't need sweets!" }), it("Television", "📺", { k: 1, f: "Plants don't watch TV!" }),
        it("Shoes", "👟", { k: 1, f: "Plants don't need shoes!" }), it("Ice cream", "🍦", { k: 1, f: "Plants don't eat ice cream!" })],
        YES_NO("Plants need it", "Not needed"), "Does a plant need it?"); }],
    ["flower-grow", "flowers", "Seed to Flower", "🌰", function () {
      return orderGame([{ p: "How does a flower grow? In order!", items: [["🌰", "Seed"], ["🌱", "Sprout"], ["🌿", "Plant"], ["🌷", "Flower"]] },
        { p: "How does an apple tree grow?", items: [["🌰", "Seed"], ["🌱", "Sprout"], ["🌳", "Tree"], ["🍎", "Apples"]] },
        { p: "A sunflower grows!", items: [["🌰", "Seed"], ["🌱", "Sprout"], ["🌿", "Tall plant"], ["🌻", "Sunflower"]] }], { instruction: "What grows first?", wrongSay: "Everything starts as a tiny seed!" }); }],
    // Fruits (nature)
    ["fruit-colours", "nature", "Fruit Colours", "🎨", function () {
      var F = [["apple", "red"], ["banana", "yellow"], ["orange", "orange"], ["grapes", "purple"], ["pear", "green"], ["blueberry", "blue"], ["coconut", "brown"]].map(function (x) {
        var f = C.fruits.filter(function (y) { return y.key === x[0]; })[0]; return it(f.name, f.img ? img(f.img) : f.emoji, { c: x[1] }); });
      return findQuiz(F, { instruction: "Fruits are so colourful!", ask: function (x) { return "Find the " + x.c + " fruit!"; },
        differ: function (a, b) { return a.c !== b.c; }, fact: function (x) { return "Yes! The " + x.n.toLowerCase() + " is " + x.c + "!"; } }); }],
    ["fruit-or-veg", "nature", "Fruit or Vegetable?", "🥕", function () {
      var fr = U.sample(C.fruits.filter(function (f) { return f.img; }), 6).map(function (f) { return it(f.name, img(f.img), { f: "The " + f.name.toLowerCase() + " is a fruit!" }); });
      var vg = U.sample(C.vegetables.filter(function (v) { return v.key !== "tomato"; }), 6)
        .map(function (v) { return it(v.name, img(v.img), { k: 1, f: vegIs(v) }); });
      return classify(fr.concat(vg), [["🍎 Fruit", "Fruit", "opt--hot"], ["🥕 Vegetable", "Vegetable", "opt--good"]], "Fruit or vegetable?"); }],
    ["fruit-match", "nature", "Fruit Names", "🍇", function () {
      return matchGame(C.fruits.filter(function (f) { return f.img; }).map(function (f) { return { k: img(f.img), v: word(f.name), say: f.name }; }), "Match each fruit to its name!"); }],
    ["fruit-peel", "nature", "Peel It or Not?", "🍌", function () {
      function F(k) { return C.fruits.filter(function (y) { return y.key === k; })[0]; }
      var peel = ["banana", "orange", "mango", "pineapple", "coconut", "watermelon", "pomegranate"], skin = ["apple", "grapes", "cherry", "strawberry", "pear", "plum", "blueberry"];
      return classify(peel.map(function (k) { var f = F(k); return it(f.name, f.img ? img(f.img) : f.emoji, { f: "We take the skin off a " + f.name.toLowerCase() + " first." }); })
        .concat(skin.map(function (k) { var f = F(k); return it(f.name, f.img ? img(f.img) : f.emoji, { k: 1, f: "You can eat the skin of a " + f.name.toLowerCase() + ". Wash it first!" }); })),
        [["✋ Peel it first", "Peel it first", "opt--hot"], ["😋 Eat the skin too", "Eat the skin too", "opt--good"]], "Peel it, or eat the skin?"); }],
    ["fruit-grow", "nature", "Where Do Fruits Grow?", "🌳", function () {
      function F(k) { var f = C.fruits.filter(function (y) { return y.key === k; })[0]; return f.img ? img(f.img) : f.emoji; }
      return classify([it("Apple", F("apple"), { f: "Apples grow on trees!" }), it("Mango", F("mango"), { f: "Mangoes grow on big trees!" }), it("Coconut", F("coconut"), { f: "Coconuts grow on tall palm trees!" }),
        it("Orange", F("orange"), { f: "Oranges grow on trees!" }), it("Cherry", F("cherry"), { f: "Cherries grow on trees!" }), it("Lemon", F("lemon"), { f: "Lemons grow on small trees!" }),
        it("Watermelon", F("watermelon"), { k: 1, f: "Watermelons grow on a vine along the ground!" }), it("Strawberry", F("strawberry"), { k: 1, f: "Strawberries grow on small plants near the ground!" }),
        it("Grapes", F("grapes"), { k: 1, f: "Grapes grow on a climbing vine!" }), it("Pineapple", F("pineapple"), { k: 1, f: "A pineapple grows from the middle of a spiky plant!" }),
        it("Blueberry", F("blueberry"), { k: 1, f: "Blueberries grow on small bushes!" })],
        [["🌳 On a tree", "On a tree", "opt--good"], ["🌱 On a small plant", "On a small plant", "opt--hot"]], "Where does it grow?"); }],
    // Science
    ["day-night", "science", "Day or Night?", "🌗", function () {
      return classify([it("The sun", "☀️", { f: "The sun shines in the day!" }), it("A rainbow", "🌈", { f: "Rainbows come out in the day!" }), it("Butterflies flying", "🦋", { f: "Butterflies fly in the day!" }),
        it("Sunflowers opening", "🌻", { f: "Sunflowers open in the daytime sun!" }), it("The moon", "🌙", { k: 1, f: "We see the moon at night!" }), it("Twinkling stars", "⭐", { k: 1, f: "Stars twinkle at night!" }),
        it("An owl hunting", "🦉", { k: 1, f: "Owls hunt at night!" }), it("Bats flying", "🦇", { k: 1, f: "Bats fly at night!" })],
        [["☀️ Day", "Day", "opt--hot"], ["🌙 Night", "Night", "opt--cold"]], "Day or night?"); }],
    ["weather", "science", "Weather Watch", "🌦️", function () {
      return findQuiz([it("Sunny", "☀️"), it("Rainy", "🌧️"), it("Cloudy", "☁️"), it("Snowy", "🌨️"), it("Windy", "🌬️"), it("Stormy", "⛈️"), it("Rainbow", "🌈"), it("Foggy", "🌫️")],
        { instruction: "What's the weather like?", ask: function (x) { return x.n === "Rainbow" ? "Find the rainbow!" : "Find the " + x.n.toLowerCase() + " weather!"; } }); }],
    ["weather-wear", "science", "Ready for the Weather", "☔", function () {
      return riddleQuiz({ umbrella: it("Umbrella", "☔"), glasses: it("Sunglasses", "🕶️"), gloves: it("Gloves", "🧤"), kite: it("Kite", "🪁"), boots: it("Boots", "🥾"), cap: it("Cap", "🧢") }, [
        ["It is raining! What do you need?", "umbrella", "An umbrella keeps you dry!"], ["The sun is very bright. What do you wear?", "glasses", "Sunglasses protect your eyes!", ["cap"]],
        ["It is snowing and freezing. What do you wear?", "gloves", "Gloves keep your hands warm!"], ["It is a windy day! What can you fly?", "kite", "Whoosh! The wind lifts the kite!"],
        ["There are puddles everywhere. What do you wear?", "boots", "Boots for splashing!"], ["It is a hot sunny day. What goes on your head?", "cap", "A cap shades your face!", ["glasses"]]],
        { instruction: "Get ready for the weather!" }); }],
    ["light-heavy", "science", "Light or Heavy?", "🪶", function () {
      return classify([it("Feather", "🪶", { f: "A feather is very light!" }), it("Balloon", "🎈", { f: "A balloon is light. It floats up!" }), it("Leaf", "🍃", { f: "A leaf is light. The wind blows it!" }),
        it("Paper", "📄", { f: "Paper is light!" }), it("Tissue paper", "🧻", { f: "Tissue paper is super light!" }), it("Elephant", "🐘", { k: 1, f: "An elephant is very heavy!" }),
        it("Truck", "🚚", { k: 1, f: "A truck is very heavy!" }), it("Rock", "🪨", { k: 1, f: "A big rock is heavy!" }), it("Piano", "🎹", { k: 1, f: "A piano is heavy!" })],
        [["🪶 Light", "Light", "opt--cold"], ["🏋️ Heavy", "Heavy", "opt--hot"]], "Light or heavy?"); }],
    ["light-sources", "science", "Makes Its Own Light?", "🔦", function () {
      return classify([it("The sun", "☀️", { f: "The sun makes its own light!" }), it("Light bulb", "💡", { f: "A light bulb makes light!" }), it("Candle", "🕯️", { f: "A candle flame makes light!" }),
        it("Torch", "🔦", { f: "A torch makes light!" }), it("Fire", "🔥", { f: "Fire makes light and heat!" }), it("Lightning", "⚡", { f: "Lightning makes a big flash of light!" }),
        it("The moon", "🌙", { k: 1, f: "The moon has no light of its own. It shines because sunlight bounces off it!" }), it("Book", "📖", { k: 1, f: "A book doesn't make light." }),
        it("Ball", "⚽", { k: 1, f: "A ball doesn't make light." }), it("Mirror", "🪞", { k: 1, f: "A mirror only bounces light. It doesn't make its own!" })],
        YES_NO("Makes light", "No light"), "Does it make its own light?"); }],
    // Shapes
    ["shapes-around", "shapes", "Shapes Around Us", "🍕", function () {
      return riddleQuiz({ ball: it("Ball", "⚽"), pizza: it("Pizza slice", "🍕"), door: it("Door", "🚪"), star: it("Starfish", "⭐"), egg: it("Egg", "🥚"),
        dice: it("Dice", "🎲"), kite: it("Kite", "🪁"), clock: it("Clock", "🕒") }, [
        ["Which one is round like a circle?", "ball", "A ball is round!", ["clock"]], ["Which one is shaped like a triangle?", "pizza", "A pizza slice is a triangle!"],
        ["Which one is shaped like a rectangle?", "door", "A door is a rectangle!"], ["Which one is shaped like a star?", "star", "A star has five points!"],
        ["Which one is shaped like an oval?", "egg", "An egg is an oval!"], ["Which one is shaped like a cube?", "dice", "A dice is a cube!"],
        ["Which one is shaped like a diamond?", "kite", "A kite is a diamond!"], ["Which one has a circle face that tells time?", "clock", "A clock face is a circle!", ["ball"]]],
        { instruction: "Shapes are everywhere! Let's find them." }); }],
    ["shape-match", "shapes", "Shape Names", "🔷", function () {
      return matchGame(C.shapes.filter(function (s) { return s.img; }).map(function (s) { return { k: img(s.img), v: word(s.name), say: s.name }; }), "Match each shape to its name!"); }],
    ["shape-sides", "shapes", "Count the Sides", "📐", function () {
      function S(k) { var s = C.shapes.filter(function (x) { return x.key === k; })[0]; return s && s.img ? img(s.img) : (s ? s.emoji : ""); }
      return textQuiz([{ q: "How many sides does a triangle have?", a: "3", w: ["4", "5"], e: S("triangle"), f: "Yes! A triangle has 3 sides." },
        { q: "How many sides does a square have?", a: "4", w: ["3", "6"], e: S("square"), f: "Yes! A square has 4 equal sides." },
        { q: "How many sides does a rectangle have?", a: "4", w: ["2", "5"], e: S("rectangle"), f: "Yes! A rectangle has 4 sides." },
        { q: "How many sides does a pentagon have?", a: "5", w: ["4", "6"], e: S("pentagon"), f: "Yes! A pentagon has 5 sides." },
        { q: "How many sides does a hexagon have?", a: "6", w: ["5", "8"], e: S("hexagon"), f: "Yes! A hexagon has 6 sides, like a honeycomb." },
        { q: "How many straight sides does a circle have?", a: "0", w: ["1", "4"], e: S("circle"), f: "Yes! A circle has no straight sides. It's round!" }], { instruction: "Count the sides!", narrate: false }); }],
    ["shape-explore", "shapes", "Shape Explorer", "⭐", function () {
      return explore(C.shapes.filter(function (s) { return s.img; }).map(function (s) { return it(s.name, img(s.img), { s: s.fact || s.name }); }), "Shape Explorer", "Tap a shape to learn about it!", "Tap each shape!"); }],
    ["colour-fun", "shapes", "Colour Fun", "🎨", function () {
      return findQuiz([["Red", "#EF4444"], ["Blue", "#3B82F6"], ["Yellow", "#FACC15"], ["Green", "#22C55E"], ["Orange", "#F97316"], ["Purple", "#A855F7"],
        ["Pink", "#F472B6"], ["Brown", "#92400E"], ["Black", "#111827"], ["White", "#FFFFFF"]].map(function (c) { return it(c[0], blob(c[1])); }),
        { instruction: "Let's find the colours!", ask: function (x) { return "Find " + x.n.toUpperCase() + "!"; }, fact: function (x) { return "Yes! That's " + x.n.toLowerCase() + "!"; } }); }],
    // Games
    ["find-twin", "games", "Find the Twin", "👯", function () {
      return { type: "quiz", instruction: "Find the one that is exactly the same!", narrateOptions: false, rounds: U.sample(TWINS, nR()).map(function (set) {
        var t = U.pick(set), opts = U.shuffle([t].concat(U.sample(set.filter(function (e) { return e !== t; }), Math.min(3, nO()))));
        return { showcase: '<div class="cls-item"><span class="cls-item__pic">' + t + "</span></div>", showcaseClass: "cls-showcase",
          prompt: "Find the same one!", say: "Look carefully. Find the same one!", fact: "Yes! They are twins!",
          options: opts.map(function (e) { return { html: e, pic: true, correct: e === t }; }) };
      }) }; }],
    ["opposites", "games", "Opposites", "↔️", function () { return matchGame(OPPOSITES.map(function (o) { return { k: o[0], v: o[1], say: o[2] + "!" }; }), "Match the opposites!"); }],
    ["pattern-next", "games", "Pattern Fun", "🔁", patternNext],
    // Stories
    ["story-picnic", "stories", "Momo's Picnic", "🧺", function () { return storyQuiz(PICNIC, "Story time! Help Momo have a happy picnic."); }],
    ["story-rainy", "stories", "Tiko's Rainy Day", "🌧️", function () { return storyQuiz(RAINY, "Story time! It's a rainy day for Tiko."); }],
    // Structures
    ["build-tools", "structures", "Builder's Tools", "🔨", function () { return riddleQuiz(TOOLS, TOOL_Q, { instruction: "Builders use lots of tools!" }); }],
    ["build-order", "structures", "Build in Order", "🧱", function () {
      return orderGame([{ p: "Build a house! What comes first?", items: [["🧱", "Lay the bricks"], ["🪟", "Add the windows"], ["🔺", "Put on the roof"], ["🎨", "Paint the house"]] },
        { p: "Build a bridge!", items: [["🪨", "Build the pillars"], ["🛤️", "Lay the road on top"], ["🚧", "Add the railings"], ["🚗", "Cars drive across"]] },
        { p: "Make a sandcastle!", items: [["🪣", "Fill the bucket"], ["🏖️", "Turn it upside down"], ["🏰", "Shape the towers"], ["🚩", "Add a flag"]] }],
        { instruction: "Builders do things in order!", wrongSay: "What do builders do first?" }); }],
    ["strong-house", "structures", "Strong or Weak?", "🏠", function () {
      return classify([it("Bricks", "🧱", { f: "Bricks make a strong house!" }), it("Stone", "🪨", { f: "Stone is strong!" }), it("Wood", "🪵", { f: "Wood is strong for building!" }),
        it("Steel", "🔩", { f: "Steel is very strong!" }), it("Straw", "🌾", { k: 1, f: "Straw is weak. The wind blows it away!" }), it("Paper", "📄", { k: 1, f: "Paper tears easily. Too weak!" }),
        it("Ice cream", "🍦", { k: 1, f: "Ice cream melts! Too weak to build with." }), it("Balloons", "🎈", { k: 1, f: "Balloons pop! Too weak." }), it("Cardboard", "📦", { k: 1, f: "Cardboard gets soggy in the rain!" })],
        [["💪 Strong", "Strong", "opt--good"], ["😟 Too weak", "Too weak", "opt--bad"]], "Is it strong enough to build a house?"); }],
    ["homes", "structures", "Homes Everywhere", "🛖", function () { return riddleQuiz(HOMES, HOME_Q, { instruction: "People live in all kinds of homes!" }); }],
    ["tower-stack", "structures", "Big to Small Blocks", "🗼", function () {
      var cols = ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#3B82F6"], seqs = [];
      for (var i = 0; i < 4; i++) {
        var n = cfg().difficulty <= 2 ? 3 : (cfg().difficulty <= 4 ? 4 : 5), c = U.shuffle(cols.slice());
        var ws = [96, 78, 60, 42, 26].slice(0, n);
        seqs.push({ p: "Tap the blocks from biggest to smallest!", items: ws.map(function (w, j) { return [block(w, c[j]), ""]; }) });
      }
      return orderGame(seqs, { instruction: "Biggest block first, then smaller and smaller!", wrongSay: "Find the biggest block that is left!" }); }],
    ["house-shapes", "structures", "Shapes in a House", "🏡", function () {
      var parts = { roof: ["Triangle", "The roof is a triangle!"], wall: ["Square", "The wall is a square!"], door: ["Rectangle", "The door is a rectangle!"], window: ["Circle", "The round window is a circle!"] };
      return textQuiz(Object.keys(parts).map(function (k) {
        return { q: "What shape is the glowing part?", a: parts[k][0], w: U.sample(["Triangle", "Square", "Rectangle", "Circle"].filter(function (x) { return x !== parts[k][0]; }), 2), e: houseSvg(k), f: "Yes! " + parts[k][1] };
      }), { instruction: "A house is made of shapes!" }); }],
    ["build-site", "structures", "Building Site", "🏗️", function () {
      return explore([it("Crane", "🏗️", { s: "The crane lifts heavy things up high!" }), it("Bricks", "🧱", { s: "Bricks are stacked to make strong walls!" }),
        it("Wood", "🪵", { s: "Wood is used for doors, windows and roofs!" }), it("Hammer", "🔨", { s: "Bang, bang! The hammer hits nails." }),
        it("Ladder", "🪜", { s: "Builders climb ladders to reach high places!" }), it("Hard hat", "⛑️", { s: "A hard hat keeps the builder's head safe!" }),
        it("Safety vest", "🦺", { s: "A bright vest helps everyone see the builder!" }), it("Road barrier", "🚧", { s: "Barriers say: careful, work going on!" })],
        "Building Site", "Tap to learn what builders use!", "Welcome to the building site! Tap everything."); }],
    ["tool-match", "structures", "Tool Match", "🔧", function () {
      return matchGame([{ k: "🪚", v: "🪵", say: "A saw cuts wood." }, { k: "🔧", v: "🔩", say: "A spanner turns a bolt." }, { k: "🖌️", v: "🎨", say: "A brush spreads paint." },
        { k: "⛏️", v: "🪨", say: "A pickaxe breaks rock." }, { k: "✂️", v: "📄", say: "Scissors cut paper." }, { k: "🪣", v: "💧", say: "A bucket carries water." }], "Match each tool to what it works on!"); }],
    // Vehicles
    ["land-water-air", "vehicles", "Land, Water or Air?", "🌍", function () {
      var where = { Car: 0, Bus: 0, Train: 0, Bicycle: 0, Truck: 0, Tractor: 0, Motorcycle: 0, Ship: 1, Sailboat: 1, Canoe: 1, Speedboat: 1, Airplane: 2, Helicopter: 2, Rocket: 2, Parachute: 2,
        Scooter: 0, "Auto rickshaw": 0, "School bus": 0, Tram: 0, Submarine: 1, "Hot air balloon": 2 };
      var say = ["moves on land.", "moves on water.", "moves through the air."];
      return classify(VEH.filter(function (v) { return where[v.n] !== undefined; }).map(function (v) { return it(v.n, v.e, { k: where[v.n], f: "The " + v.n.toLowerCase() + " " + say[where[v.n]] }); }),
        [["🛣️ Land", "Land", "opt--good"], ["🌊 Water", "Water", "opt--cold"], ["☁️ Air", "Air", "opt--sky"]], "Where does it go?"); }],
    ["vehicle-match", "vehicles", "Vehicle Names", "🚌", function () { return matchGame(VEH.map(function (v) { return { k: v.e, v: word(v.n), say: v.n }; }), "Match each vehicle to its name!"); }],
    ["who-drives", "vehicles", "Who Drives It?", "🧑‍✈️", function () {
      return matchGame([{ k: "🧑‍✈️", v: "✈️", say: "The pilot flies the airplane." }, { k: "🧑‍🚀", v: "🚀", say: "The astronaut rides the rocket." },
        { k: "🧑‍🚒", v: "🚒", say: "The firefighter drives the fire truck." }, { k: "👮", v: "🚓", say: "The police officer drives the police car." },
        { k: "🧑‍🌾", v: "🚜", say: "The farmer drives the tractor." }, { k: "🧑‍⚕️", v: "🚑", say: "The paramedic rides in the ambulance." }], "Match each person to what they drive!"); }],
    ["emergency", "vehicles", "Help Is Coming!", "🚑", function () {
      return classify([veh("Ambulance"), veh("Fire truck"), veh("Police car")].map(function (v) { return it(v.n, v.e, { f: "The " + v.n.toLowerCase() + " helps in an emergency. Nee-naw!" }); })
        .concat(["Bus", "Bicycle", "Tractor", "Taxi", "Train", "Truck", "Sailboat"].map(function (n) { var v = veh(n); return it(v.n, v.e, { k: 1, f: "The " + n.toLowerCase() + " is not an emergency vehicle." }); })),
        YES_NO("Emergency helper", "Not an emergency vehicle"), "Is it an emergency vehicle?", { instruction: "Emergency vehicles have sirens and flashing lights!" }); }],
    ["vehicle-count", "vehicles", "Count the Vehicles", "🔢", function () { return countGame([it("cars", "🚗"), it("buses", "🚌"), it("bicycles", "🚲"), it("trains", "🚂"), it("airplanes", "✈️")]); }],
    ["fast-slow", "vehicles", "Which Is Faster?", "🏎️", function () {
      return { type: "quiz", instruction: "Fast or slow? Let's race!", narrateOptions: false, rounds: U.sample(FASTER, nR()).map(function (p) {
        var askFast = Math.random() < 0.6, a = veh(p[0]), b = veh(p[1]), q = askFast ? "Which one is faster?" : "Which one is slower?", ans = askFast ? a : b;
        return { prompt: q, say: q, fact: "Yes! The " + ans.n.toLowerCase() + " is " + (askFast ? "faster" : "slower") + "!",
          options: U.shuffle([a, b]).map(function (v) { return { html: v.e, pic: true, speak: v.n, correct: v === ans }; }) };
      }) }; }],
    ["traffic-light", "vehicles", "Traffic Lights", "🚦", function () {
      var L = [["🛑 Stop", "Red means stop!"], ["⏳ Get ready", "Yellow means get ready, slow down!"], ["✅ Go ahead", "Green means go, carefully!"]], rounds = [];
      for (var i = 0; i < nR(); i++) { var k = i < 3 ? i : Math.floor(Math.random() * 3); rounds.push({ q: "What does this light say?", a: L[k][0], w: L.filter(function (_, j) { return j !== k; }).map(function (x) { return x[0]; }), e: trafficSvg(k), f: "Yes! " + L[k][1] }); }
      return textQuiz(U.shuffle(rounds), { instruction: "Red, yellow, green! What do the lights say?", inOrder: true }); }],
    ["road-safety", "vehicles", "Road Safety", "🚸", function () {
      return classify([it("Wearing a helmet on a bike", "🚲", { f: "A helmet keeps your head safe!" }), it("Holding a grown-up's hand on the road", "🤝", { f: "Always hold hands near the road!" }),
        it("Crossing at the zebra crossing", "🚸", { f: "The zebra crossing is the safe place to cross!" }), it("Wearing a seat belt", "💺", { f: "Click! Seat belts keep us safe." }),
        it("Waiting for the green man", "🚦", { f: "Wait for the green signal. Safe!" }), it("Playing ball on the road", "⚽", { k: 1, f: "Never play on the road. Play in the park!" }),
        it("Running across the road", "🏃", { k: 1, f: "Never run across the road. Stop, look and listen!" }), it("Putting hands out of the bus window", "🚌", { k: 1, f: "Keep hands inside the bus!" })],
        [["👍 Safe", "Safe", "opt--good"], ["⚠️ Not safe", "Not safe", "opt--bad"]], "Safe or not safe?", { instruction: "Stop, look and listen! Let's learn road safety." }); }],
    // Habits
    ["morning-bedtime", "habits", "Morning or Bedtime?", "🌅", function () {
      return classify([it("Waking up", "🌅", { f: "We wake up in the morning!" }), it("Eating breakfast", "🥣", { f: "Breakfast is the morning meal!" }), it("Packing the school bag", "🎒", { f: "We pack our bag in the morning for school!" }),
        it("Putting on the school uniform", "👕", { f: "We dress for school in the morning!" }), it("Going to bed", "🛌", { k: 1, f: "We go to bed at bedtime!" }), it("Reading a bedtime story", "📖", { k: 1, f: "A story before sleep! That's bedtime." }),
        it("Switching off the light", "💡", { k: 1, f: "Lights off at bedtime!" }), it("Saying good night", "🌙", { k: 1, f: "Good night! That's bedtime." })],
        [["🌅 Morning", "Morning", "opt--hot"], ["🌙 Bedtime", "Bedtime", "opt--cold"]], "Morning or bedtime?"); }],
    ["healthy-snacks", "habits", "Healthy or Junk?", "🥗", function () {
      return classify([it("Apple", "🍎", { f: "An apple is healthy!" }), it("Carrot", "🥕", { f: "Carrots are healthy and crunchy!" }), it("Milk", "🥛", { f: "Milk makes bones strong!" }),
        it("Banana", "🍌", { f: "A banana gives you energy!" }), it("Salad", "🥗", { f: "Salad is full of good things!" }), it("Egg", "🥚", { f: "Eggs help you grow!" }),
        it("Candy", "🍬", { k: 1, f: "Candy is junk food. Only a little, sometimes!" }), it("Burger", "🍔", { k: 1, f: "A burger is junk food. Not every day!" }),
        it("Fizzy drink", "🥤", { k: 1, f: "Fizzy drinks have lots of sugar. Drink water instead!" }), it("Lollipop", "🍭", { k: 1, f: "Lollipops are sweets. Not too many!" }), it("Doughnut", "🍩", { k: 1, f: "Doughnuts are a treat, not every day!" })],
        [["🥦 Healthy", "Healthy", "opt--good"], ["🍟 Junk food", "Junk food", "opt--bad"]], "Healthy or junk food?"); }],
    ["save-water", "habits", "Save Water", "🚰", function () {
      return classify([it("Turning off the tap while brushing", "🚰", { f: "Turning off the tap saves water!" }), it("Taking a bucket bath", "🪣", { f: "A bucket bath saves water!" }),
        it("Fixing a leaking tap", "🔧", { f: "Fixing leaks saves water!" }), it("Watering plants with leftover water", "🪴", { f: "Great idea! That saves water." }),
        it("Leaving the tap running", "💦", { k: 1, f: "That wastes water. Turn it off!" }), it("Playing with the hose all day", "🌊", { k: 1, f: "That wastes lots of water!" }),
        it("Very long showers", "🚿", { k: 1, f: "Long showers waste water. Be quick!" }), it("Throwing away a full glass of water", "🥛", { k: 1, f: "Don't waste it. Drink it or water a plant!" })],
        YES_NO("Saves water", "Wastes water"), "Does it save water?"); }],
    ["clean-up", "habits", "Clean Up Time", "🧹", function () {
      return classify([it("Banana peel", "🍌", { f: "A banana peel goes in the dustbin!" }), it("Sweet wrapper", "🍬", { f: "Wrappers go in the dustbin!" }), it("Used tissue", "🧻", { f: "Used tissues go in the dustbin!" }),
        it("Apple core", "🍏", { f: "The apple core goes in the dustbin!" }), it("Storybook", "📚", { k: 1, f: "Books go back on the shelf!" }), it("Teddy bear", "🧸", { k: 1, f: "Teddy goes back on the shelf!" }),
        it("Puzzle", "🧩", { k: 1, f: "The puzzle goes back on the shelf!" }), it("Toy car", "🚗", { k: 1, f: "Toys go back on the shelf!" })],
        [["🗑️ Dustbin", "Dustbin", "opt--hot"], ["📚 Shelf", "Shelf", "opt--cold"]], "Dustbin or shelf?", { instruction: "Clean up time! Where does it go?" }); }],
    ["safety-rules", "habits", "Stay Safe", "🦺", function () {
      return classify([it("Wearing a helmet when cycling", "🚲", { f: "Helmets keep us safe!" }), it("Telling a grown-up when you're hurt", "🩹", { f: "Always tell a grown-up!" }),
        it("Staying with your family in a crowd", "👨‍👩‍👧", { f: "Stay close to your family!" }), it("Learning your home address", "🏠", { f: "Knowing your address keeps you safe!" }),
        it("Going away with a stranger", "🚶", { k: 1, f: "Never go anywhere with a stranger. Tell a grown-up!" }), it("Playing with matches", "🔥", { k: 1, f: "Matches are not toys. They can burn!" }),
        it("Playing with knives", "🔪", { k: 1, f: "Knives are sharp. Only grown-ups use them!" }), it("Eating medicine like sweets", "💊", { k: 1, f: "Medicine is not candy. Only from a grown-up!" }),
        it("Swimming without a grown-up", "🏊", { k: 1, f: "Always swim with a grown-up watching!" })],
        [["👍 Safe", "Safe", "opt--good"], ["⚠️ Not safe", "Not safe", "opt--bad"]], "Safe or not safe?"); }],
    ["bedtime-order", "habits", "Bedtime Routine", "😴", function () {
      return orderGame([{ p: "Bedtime! What comes first?", items: [["🍽️", "Eat dinner"], ["🪥", "Brush your teeth"], ["📖", "Read a story"], ["😴", "Sleep"]] },
        { p: "Bath time in order!", items: [["🛁", "Fill the bath"], ["🧼", "Wash with soap"], ["🧴", "Dry with a towel"], ["👕", "Put on clean clothes"]] },
        { p: "Wash your hands in order!", items: [["🚰", "Wet your hands"], ["🧼", "Rub with soap"], ["💦", "Rinse the soap off"], ["🧻", "Dry your hands"]] }],
        { instruction: "Do it in the right order!", wrongSay: "What do we do first?" }); }],
    // 2026-11-08: more animals, fruits, vegetables and vehicles (photos §25). A 6th field names the Kido World realm
    // when it differs from the category's.
    ["ocean-friends", "animals", "Ocean Friends", "🐋", function () {
      return explore(U.sample(homeAnimals("ocean"), 9), "Ocean Friends", "Tap an animal to meet it!", "Who lives in the ocean? Tap each one!"); }, "ocean"],
    ["river-friends", "animals", "River & Pond Friends", "🦦", function () {
      return explore(U.sample(homeAnimals("fresh"), 9), "River & Pond Friends", "Tap an animal to meet it!", "These animals live in rivers and ponds. Tap each one!"); }],
    ["wild-friends", "animals", "Wild Land Animals", "🐆", function () {
      return explore(homeAnimals("land", true).slice(0, 9), "Wild Land Animals", "Tap an animal to meet it!", "Meet the animals that live on land. Tap each one!"); }],
    ["animal-homes", "animals", "Where Do I Live?", "🏞️", function () {
      var all = [];
      ["ocean", "fresh", "land"].forEach(function (h, i) { U.sample(homeAnimals(h), 6).forEach(function (x) { x.k = i; x.f = x.n + " lives " + HOME_SAY[h] + "."; all.push(x); }); });
      return classify(all, [["🌊 Ocean", "Ocean", "opt--cold"], ["🏞️ River or pond", "River or pond", "opt--good"], ["🌳 Land", "Land", "opt--hot"]], "Where does it live?",
        { instruction: "Ocean, river or land? Where does each animal live?" }); }, "ocean"],
    ["ocean-find", "animals", "Find the Sea Animal", "🦑", function () {
      return findQuiz(homeAnimals("ocean"), { instruction: "Dive in! Find the sea animal I say." }); }, "ocean"],
    ["odd-home", "animals", "Who Lives Somewhere Else?", "🤔", function () {
      var rounds = [];
      for (var i = 0; i < nR(); i++) {
        var hs = U.shuffle(["ocean", "fresh", "land"]), same = U.sample(homeAnimals(hs[0]), 3), odd = U.pick(homeAnimals(hs[1]));
        var q = "Which one does not live " + HOME_SAY[hs[0]] + "?";
        rounds.push({ prompt: q, say: q, fact: "Yes! The " + odd.n.toLowerCase() + " lives " + HOME_SAY[hs[1]] + ".",
          options: U.shuffle(same.concat([odd])).map(function (y) { return { html: y.e, pic: true, speak: y.n, correct: y === odd }; }) });
      }
      return { type: "quiz", instruction: "Three live in the same place. Find the one that lives somewhere else!", narrateOptions: false, rounds: rounds }; }, "puzzle"],
    ["veg-explore", "nature", "Vegetable Market", "🥦", function () {
      return explore(U.sample(C.vegetables, 9).map(function (v) { return it(v.name, img(v.img), { s: v.name + "! " + v.funFact }); }),
        "Vegetable Market", "Tap a vegetable to learn about it!", "Welcome to the vegetable market! Tap each one."); }],
    ["veg-find", "nature", "Find the Vegetable", "🥕", function () {
      return findQuiz(C.vegetables.map(function (v) { return it(v.name, img(v.img), { f: "Yes! " + v.funFact }); }), { instruction: "Find the vegetable I say!" }); }],
    ["veg-under", "nature", "Under or Above the Ground?", "🌱", function () {
      return classify(C.vegetables.map(function (v) { return it(v.name, img(v.img), { k: v.grows === "under" ? 0 : 1, f: v.funFact }); }),
        [["🟫 Under the ground", "Under the ground", "opt--hot"], ["🌿 Above the ground", "Above the ground", "opt--good"]], "Where does it grow?"); }],
    ["veg-colours", "nature", "Vegetable Colours", "🎨", function () {
      return findQuiz(C.vegetables.filter(function (v) { return v.color; }).map(function (v) { return it(v.name, img(v.img), { c: v.color }); }),
        { instruction: "Vegetables come in many colours!", ask: function (x) { return "Find the " + x.c + " vegetable!"; },
          differ: function (a, b) { return a.c !== b.c; }, fact: function (x) { return "Yes! The " + x.n.toLowerCase() + " is " + x.c + "!"; } }); }],
    ["more-fruits", "nature", "Fruits From Far and Near", "🥭", function () {
      return explore(U.sample(C.fruits.filter(function (f) { return f.img; }), 9).map(function (f) { return it(f.name, img(f.img), { s: f.name + "! " + f.funFact }); }),
        "Fruits From Far and Near", "Tap a fruit to learn about it!", "So many fruits! Tap each one."); }],
    ["fruit-veg-find", "nature", "Fruit or Vegetable Hunt", "🧺", function () {
      var fr = C.fruits.filter(function (f) { return f.img; }), vg = C.vegetables.filter(function (v) { return v.key !== "tomato"; }), rounds = [];
      for (var i = 0; i < nR(); i++) {
        var wantFruit = i % 2 === 0, ans = U.pick(wantFruit ? fr : vg), others = U.sample(wantFruit ? vg : fr, nO() - 1);
        var q = wantFruit ? "Which one is a fruit?" : "Which one is a vegetable?";
        rounds.push({ prompt: q, say: q, fact: "Yes! " + (wantFruit ? "The " + ans.name.toLowerCase() + " is a fruit." : vegIs(ans)),
          options: U.shuffle([ans].concat(others)).map(function (y) { return { html: img(y.img), pic: true, speak: y.name, correct: y === ans }; }) });
      }
      return { type: "quiz", instruction: "Fruit or vegetable? Look carefully!", narrateOptions: false, rounds: U.shuffle(rounds) }; }],
    ["more-vehicles", "vehicles", "Ride Along", "🛺", function () {
      return explore(MORE_VEH.map(function (v) { return it(v[1], v[2], { s: v[1] + "! " + v[3] }); }), "Ride Along", "Tap a vehicle to learn about it!", "So many ways to travel! Tap each one."); }],
    ["building-site", "vehicles", "Busy Building Site", "🏗️", function () {
      return explore(SITE.map(function (v) { return it(v[1], v[2], { s: v[1] + "! " + v[3] }); }), "Busy Building Site", "Tap a machine to learn what it does!", "Let's visit the building site! Tap each machine."); }],
    ["which-machine", "vehicles", "Which Vehicle Does It?", "🚧", function () {
      var pool = {}; SITE.concat(MORE_VEH).forEach(function (v) { pool[v[0]] = it(v[1], v[2]); });
      return riddleQuiz(pool, [["Which one digs big holes?", "excavator", "The excavator digs with its big bucket!"],
        ["Which one mixes concrete as it drives?", "cement_mixer", "The cement mixer turns and turns to mix concrete!"],
        ["Which one lifts heavy things up high?", "crane", "The crane lifts heavy things up high!"],
        ["Which one pushes dirt and rocks?", "bulldozer", "The bulldozer pushes with its big blade!"],
        ["Which one collects rubbish?", "garbage_truck", "The garbage truck takes the rubbish away!"],
        ["Which one takes children to school?", "school_bus", "The school bus takes children to school!"],
        ["Which one goes under the sea?", "submarine", "The submarine dives under the sea!"],
        ["Which one floats up into the sky with hot air?", "hot_air_balloon", "Hot air makes the balloon float up!"],
        ["Which one has three wheels?", "auto_rickshaw", "The auto rickshaw has three wheels!"],
        ["Which one runs on rails in the street?", "tram", "The tram runs on rails in the city street!", ["metro"]]], { instruction: "Which vehicle does the job?" }); }],
    ["balance-scale", "games", "Balance Scale", "⚖️", balanceScale],
    ["picture-pattern", "games", "Picture Patterns", "🔁", picturePattern],
    ["lunch-time", "animals", "Lunch Time!", "🍽️", lunchTime],
    // Words
    ["rhymes", "words", "Rhyme Time", "🎵", rhymeQuiz],
    ["missing-letter", "words", "Missing Letter", "🔤", missingLetter],
    ["picture-word", "words", "Read the Word", "📖", pictureWord]
  ];

  /* ---------------- register ---------------- */
  // Learning World region and Kido World realm for each category.
  var REGION = { animals: "jungle", alphabet: "forest", hindi: "forest", words: "castle", stories: "castle", numbers: "town", shapes: "town", games: "arcade",
    birds: "jungle", flowers: "garden", nature: "garden", vehicles: "city", structures: "city", habits: "home", greetings: "home", body: "home",
    electronics: "lab", science: "lab" };
  var REALM = { animals: "jungle", alphabet: "castle", hindi: "castle", words: "castle", stories: "castle", shapes: "puzzle", games: "puzzle", birds: "jungle",
    flowers: "village", nature: "village", habits: "village", greetings: "village", body: "village", vehicles: "ocean", structures: "lab",
    electronics: "lab", science: "lab" };
  NEW.forEach(function (a) {
    var id = a[0];
    if (A[id]) { console.warn("[moreActivities] id already used:", id); return; }
    A[id] = { id: id, categoryId: a[1], name: a[2], icon: a[3], build: a[4] };
    var region = CAT.region(REGION[a[1]]);
    if (region && region.activities.indexOf(id) < 0) region.activities.push(id);
    var realm = Kido.world && Kido.world.WORLDS && Kido.world.WORLDS[a[5] || REALM[a[1]]];
    if (realm && realm.more.indexOf(id) < 0) realm.more.push(id);
  });
  Kido.moreActivities = { ids: NEW.map(function (a) { return a[0]; }) };
})(window);
