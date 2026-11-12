/* =========================================================================
   thinkLab.js — content for the Think Lab activities (data only)
   Played by js/activities/thinkLab.js:
     Peekaboo Pals (peekaboo)    — which animal is hiding in the bush?
     Picnic Seats  (picnic-seats) — seat friends by "next to" rules
     Robot Clues   (robot-clues)  — count robot parts, compare, charge the right one
   Difficulty comes from the age band (Kido.age.cfg().difficulty, 1..7).
   All wording and art are original.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  Kido.thinkLab = {
    peekaboo: {
      options: function (d) { return d <= 1 ? 2 : d <= 3 ? 3 : 4; },
      peek: function (d) { return d <= 2 ? 0.45 : d <= 4 ? 0.38 : 0.32; },   // share of the photo that shows at first
      // where the animal peeks out: heads (top) are the easiest, so the youngest always see the head
      // (only legs or a side sliver is too hard to be fair: bottom never, sides only from 7 years, and wider)
      sides: function (d) { return d <= 4 ? ["top"] : ["top", "top", "left", "right"]; },
      sideExtra: 0.1,
      grow: 0.2,                                                           // each wrong try shows this much more
      ask: "Who is hiding in the bush?",
      more: "Look closely! Here's a bigger peek.",
      found: function (name) { return "It's the " + name + "!"; }
    },

    picnic: {
      // guests are animals with real photos (Kido.creatures)
      guests: ["cat", "dog", "rabbit", "duck", "sheep", "pig", "hen", "goat", "fox", "monkey", "panda", "bear", "frog", "horse"],
      // [rows, cols, already seated, to seat, most rules, rule kinds] per difficulty 1..7
      levels: {
        1: [1, 3, 1, 1, 1, ["not"]],
        2: [2, 2, 1, 1, 1, ["not"]],
        3: [2, 3, 2, 1, 2, ["not"]],
        4: [2, 3, 2, 2, 2, ["not", "wants"]],
        5: [3, 3, 2, 2, 3, ["not", "wants"]],
        6: [3, 3, 3, 2, 3, ["not", "wants"]],
        7: [3, 3, 3, 3, 4, ["not", "wants"]]
      },
      count: function (d) { return d <= 2 ? 3 : 4; },                       // puzzles per play
      ask: "Seat everyone so they are all happy!",
      rule: { not: function (a, b) { return "The " + a + " must not sit next to the " + b + "."; },
              wants: function (a, b) { return "The " + a + " wants to sit next to the " + b + "."; } },
      oops: "Oops!",
      solved: ["Everyone is happy! Picnic time!", "Perfect seats! Well done!", "Hooray! Every friend is happy!"],
      nextTo: "Next to means side by side, not corner to corner.",
      hint: function (a) { return "The " + a + " can't sit on the grey seats."; }
    },

    /* ---- batch 6 (fifth research pass): js/activities/thinkLab6.js ---- */
    thermo: {
      // weather kinds and the temperature range (°C) that fits each
      weather: { snow: [-8, 0], rain: [8, 14], spring: [18, 24], hot: [32, 40] },
      words: { snow: "snowy", rain: "rainy", spring: "warm and sunny", hot: "very hot" },
      rounds: function (d) { return d <= 2 ? 4 : 5; },
      pick: "Which thermometer fits this weather?",
      order: "Tap the thermometers from the coldest to the hottest!",
      why: function (word) { return "It is " + word + ". Look at how high the red line goes."; },
      lowFirst: "The coldest one has the lowest red line. Start with that one.",
      done: ["Brilliant weather reporter!", "You read the thermometer!", "That's right! Well done!"]
    },
    planets: {
      rounds: function (d) { return d <= 2 ? 3 : 4; },
      ask: "Help each monster land on its planet! Find the planet with its number.",
      wrong: "Not that planet. Count the dots on it!",
      done: ["All the monsters are home!", "Super sums, space explorer!", "Every monster landed!"]
    },
    pictureSums: {
      animals: ["lion", "elephant", "panda", "giraffe", "tiger", "zebra", "monkey", "fox", "frog", "rabbit", "horse", "cow"],
      ask: "Add the number on the side and the number on top. Put each piece where its number belongs!",
      wrong: "That piece has a different number. Add the two numbers for this square.",
      found: function (name) { return "Look! It's the " + name + "!"; }
    },
    clocks: {
      rounds: function (d) { return d <= 2 ? 4 : 5; },
      ask: "What time does the clock show? Find the same time!",
      hint: "The short hand shows the hour. The long hand shows the minutes.",
      done: ["You can tell the time!", "Tick tock, that's right!", "Clock champion!"]
    },
    chart: {
      fruits: ["apple", "banana", "orange", "mango", "grapes", "strawberry", "pear", "lemon"],
      rounds: function (d) { return d <= 2 ? 3 : 5; },
      look: "The taller the bar, the more fruit there is.",
      done: ["Great chart reading!", "You read the chart!", "Spot on, chart expert!"]
    },
    cubes: {
      rounds: function (d) { return d <= 2 ? 4 : 5; },
      countAll: "How many blocks are there?",
      added: "How many blocks were added? Look for the light ones!",
      hint: "Count slowly. Touch each block with your eyes.",
      done: ["Great counting!", "Block builder star!", "Yes! That's right!"]
    },
    pizza: {
      toppings: [["tomato", "#EF4444"], ["olive", "#1F2937"], ["onion", "#F9A8D4"], ["mushroom", "#D6D3D1"], ["pepper", "#22C55E"]],
      rounds: function (d) { return d <= 2 ? 3 : 4; },
      names: { tomato: ["tomato", "tomatoes"], olive: ["olive", "olives"], onion: ["onion", "onions"], mushroom: ["mushroom", "mushrooms"], pepper: ["pepper", "peppers"] },
      total: function (n) { return "The recipe says " + n + " toppings in all."; },
      have: function (n, one, many) { return n === 1 ? "There is 1 " + one + "." : "There are " + n + " " + many + "."; },
      missing: function (many) { return "How many " + many + " are missing?"; },
      add: "Tap the bowl to add a topping. Tap a topping on the pizza to take it off.",
      bake: "Bake!",
      tooMany: "Too many toppings! Count them all again.",
      tooFew: "Not enough toppings yet. Count them all again.",
      done: ["Yummy pizza! Just right!", "Perfect pizza, chef!", "Delicious! You followed the recipe!"]
    },

    /* ---- batch 5: js/activities/thinkLab5.js ---- */
    care: {
      fruits: ["apple", "banana", "orange", "mango", "grapes", "strawberry", "watermelon", "pineapple", "cherry", "pear", "lemon", "kiwi", "plum"],
      // plain colours for the "different colour" rounds: only fruits whose photo is clearly that colour
      colour: { apple: "red", strawberry: "red", cherry: "red", banana: "yellow", lemon: "yellow", pineapple: "yellow",
                pear: "green", grapes: "purple", plum: "purple", orange: "orange" },
      perNeed: function (d) { return d <= 2 ? 1 : 2; },              // puzzles to fill each need
      bubbles: function (d) { return d <= 1 ? 3 : d <= 3 ? 5 : d <= 5 ? 7 : 9; },
      routine: function (d) { return d <= 2 ? ["bath", "brush", "sleep"] : ["toys", "bath", "brush", "sleep"]; },
      hello: "Momo is hungry, dirty and sleepy! Tap a picture to help him.",
      food: "Momo wants the food that is different. Which one?",
      foodColour: "Momo wants the fruit with a different colour. Which one?",
      same: "Those are all the same. Find the one that is different!",
      yum: ["Yum yum! Thank you!", "Delicious! Momo is happy!", "Munch munch! So tasty!"],
      bath: function (n) { return "Bath time! Pop the bubbles from 1 to " + n + "!"; },
      next: function (n) { return "Pop number " + n + " next."; },
      clean: ["Squeaky clean!", "Splish splash, all clean!", "Momo smells so nice!"],
      sleep: "Bedtime! Tap what Momo does first, then next.",
      first: function (s) { return "First, " + s + "."; },
      sleepy: ["Good night, Momo!", "Sweet dreams, Momo!", "Momo is fast asleep!"],
      full: "This one is full! Try another picture.",
      done: "Momo is happy, clean and rested! Thank you for looking after him!"
    },

    stickers: {
      scenes: {
        farm:   { label: "Farm", icon: "🚜", animals: ["cow", "pig", "sheep", "goat", "hen", "duck", "horse", "dog", "cat", "rabbit"] },
        jungle: { label: "Jungle", icon: "🌴", animals: ["lion", "elephant", "tiger", "monkey", "giraffe", "zebra", "rhino", "panda", "bear", "fox", "deer", "snake", "frog"] },
        sea:    { label: "Sea", icon: "🌊", animals: ["fish", "tropical_fish", "pufferfish", "goldfish", "dolphin", "whale", "crab", "turtle"] },
        sky:    { label: "Sky", icon: "☁️", animals: ["sparrow", "parrot", "crow", "peacock", "pigeon", "eagle", "owl", "swan", "flamingo", "cardinal"] }
      },
      hello: "Make your own world! Tap an animal to put it in, then tap it to hear it.",
      move: "Drag an animal to move it. Drop it on the bin to take it away.",
      done: ["What a wonderful world!", "Your world is full of friends!", "Beautiful! Everyone is happy here!"]
    },

    /* ---- batch 4 (fourth research pass): js/activities/thinkLab4.js ---- */
    rocket: {
      // [rows, cols, route length min..max, asteroids, build (true = child builds the program; false = pick 1 of 3)]
      levels: { 1: [3, 3, 2, 3, 0, false], 2: [3, 4, 3, 4, 0, false], 3: [4, 4, 3, 5, 1, false], 4: [4, 4, 3, 5, 1, true],
                5: [4, 5, 4, 6, 2, true], 6: [5, 5, 4, 7, 3, true], 7: [5, 5, 5, 8, 4, true] },
      rounds: function (d) { return d <= 2 ? 4 : 5; },
      pick: "Which arrows take the rocket to the planet?",
      build: "Tap the arrows to plan the trip, then press Go!",
      bump: "Bump! An asteroid is in the way. Try another route.",
      short: "The rocket stopped before the planet. Add more arrows!",
      off: "Whoops, that goes off the map!",
      wrong: "That route ends somewhere else. Follow the arrows with your finger.",
      done: ["Landed! Great planning, pilot!", "Touchdown! Your code worked!", "Perfect route! The rocket made it!"],
      dirs: { up: "up", down: "down", left: "left", right: "right" }
    },

    market: {
      coins: [1, 2, 5, 10],
      // things to buy (Kido photos where they exist)
      goods: ["apple", "banana", "orange", "mango", "grapes", "strawberry", "watermelon", "pineapple"],
      // [price min, price max, coins on offer, fewest-coins challenge]
      levels: { 1: [1, 3, [1], false], 2: [2, 5, [1, 2], false], 3: [3, 8, [1, 2, 5], false], 4: [4, 10, [1, 2, 5], false],
                5: [6, 15, [1, 2, 5, 10], false], 6: [8, 20, [1, 2, 5, 10], true], 7: [11, 30, [1, 2, 5, 10], true] },
      rounds: function (d) { return d <= 2 ? 4 : 5; },
      // said in parts, so each part is one recorded clip (whole sentences would be thousands)
      ask: function (name, p) { return ["The " + name + " costs " + p + (p === 1 ? " rupee." : " rupees."), "Pay for it with coins!"]; },
      fewest: "Can you pay with the fewest coins?",
      tooMuch: function (paid, p) { return ["You gave " + paid + " rupees.", "That is more than " + p + ". Take a coin back!"]; },
      tooFew: function (paid, p) { return ["You gave " + paid + (paid === 1 ? " rupee." : " rupees."), "You need " + p + ". Add more coins!"]; },
      fewer: "That's right, but you can use fewer coins. Try bigger coins!",
      done: ["Thank you! Enjoy your fruit!", "Exactly right! Here you go!", "Perfect payment, shopper!"]
    },

    snail: {
      // figures to draw in one go: dots [x, y] (0..100) and lines [a, b]; every figure has an Euler path
      figures: [
        { name: "tent",   dots: [[20, 80], [50, 20], [80, 80]], lines: [[0, 1], [1, 2], [2, 0]], level: 1 },
        { name: "kite",   dots: [[50, 10], [80, 50], [50, 90], [20, 50]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]], level: 2 },
        { name: "house",  dots: [[20, 85], [80, 85], [80, 45], [20, 45], [50, 12]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 2], [0, 2], [1, 3]], level: 3 },
        { name: "fish",   dots: [[15, 50], [40, 25], [65, 50], [40, 75], [88, 25], [88, 75]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 2]], level: 3 },
        { name: "star",   dots: [[50, 8], [62, 40], [95, 40], [68, 60], [80, 92], [50, 72], [20, 92], [32, 60], [5, 40], [38, 40]],
          lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 0]], level: 2 },
        { name: "bowtie", dots: [[15, 20], [50, 50], [15, 80], [85, 20], [85, 80]], lines: [[0, 1], [1, 2], [2, 0], [3, 1], [1, 4], [4, 3]], level: 2 },
        { name: "envelope", dots: [[10, 30], [90, 30], [90, 85], [10, 85], [50, 60]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 1]], level: 4 },
        { name: "castle", dots: [[15, 85], [15, 30], [35, 30], [35, 50], [65, 50], [65, 30], [85, 30], [85, 85]],
          lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [3, 0]], level: 4 }
      ],
      count: function (d) { return d <= 2 ? 3 : 4; },
      ask: "Help the snail draw the picture in one go. Never go along the same line twice!",
      stuck: "The snail is stuck. Let's start again from the glowing dot!",
      startHere: "Start at the glowing dot.",
      noLine: "There is no line between those dots.",
      used: "The snail already went that way.",
      done: ["You drew it in one go!", "What a clever snail trail!", "One line, no lifting. Brilliant!"]
    },

    colour: {
      palette: ["#EF4444", "#F97316", "#FACC15", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#92400E", "#FFFFFF", "#111827"],
      names: ["red", "orange", "yellow", "green", "blue", "purple", "pink", "brown", "white", "black"],
      ask: "Pick a colour, then tap a part of the picture to colour it!",
      done: ["What a beautiful picture!", "You're a great artist!", "Lovely colours!"],
      pick: function (c) { return c + "!"; }
    },

    /* ---- batch 3: Magic Shapes (traced with js/activities/tracing.js), Garden Signs, Train Track, Stick Squares ---- */
    // each outline is an SVG path in a 100 x 100 box; `become` is what the finished shape turns into (drawn for Kido)
    magicShapes: [
      { ch: "circle", label: "Circle", path: "M50 13 A37 37 0 1 1 49.9 13", say: "Trace the circle!", done: "Your circle became a sunny sun!",
        become: '<svg viewBox="0 0 100 100"><g stroke="#F59E0B" stroke-width="5" stroke-linecap="round">' +
          '<path d="M50 2v8M50 90v8M2 50h8M90 50h8M16 16l6 6M78 78l6 6M84 16l-6 6M16 84l6-6"/></g>' +
          '<circle cx="50" cy="50" r="37" fill="#FACC15"/><circle cx="38" cy="45" r="4" fill="#7C2D12"/><circle cx="62" cy="45" r="4" fill="#7C2D12"/>' +
          '<path d="M36 60 Q50 72 64 60" fill="none" stroke="#7C2D12" stroke-width="4" stroke-linecap="round"/></svg>' },
      { ch: "square", label: "Square", path: "M18 18 H82 V82 H18 Z", say: "Trace the square!", done: "Your square became a present!",
        become: '<svg viewBox="0 0 100 100"><rect x="18" y="18" width="64" height="64" rx="3" fill="#EF4444"/>' +
          '<rect x="45" y="18" width="10" height="64" fill="#FDE047"/><rect x="18" y="45" width="64" height="10" fill="#FDE047"/>' +
          '<path d="M50 18 C38 4 26 10 34 18 Z M50 18 C62 4 74 10 66 18 Z" fill="#FDE047"/></svg>' },
      { ch: "triangle", label: "Triangle", path: "M50 14 L86 84 H14 Z", say: "Trace the triangle!", done: "Your triangle became a party hat!",
        become: '<svg viewBox="0 0 100 100"><path d="M50 14 L86 84 H14 Z" fill="#8B5CF6"/>' +
          '<path d="M38 38 L62 38 M30 54 L70 54 M22 70 L78 70" stroke="#F9A8D4" stroke-width="6"/>' +
          '<circle cx="50" cy="12" r="8" fill="#FDE047"/><rect x="10" y="80" width="80" height="8" rx="4" fill="#F472B6"/></svg>' },
      { ch: "rectangle", label: "Rectangle", path: "M10 30 H90 V70 H10 Z", say: "Trace the rectangle!", done: "Your rectangle became a bus!",
        become: '<svg viewBox="0 0 100 100"><rect x="10" y="30" width="80" height="40" rx="6" fill="#FACC15"/>' +
          '<rect x="16" y="36" width="14" height="13" rx="2" fill="#BAE6FD"/><rect x="34" y="36" width="14" height="13" rx="2" fill="#BAE6FD"/>' +
          '<rect x="52" y="36" width="14" height="13" rx="2" fill="#BAE6FD"/><rect x="72" y="36" width="12" height="26" rx="2" fill="#93C5FD"/>' +
          '<circle cx="28" cy="72" r="8" fill="#1F2937"/><circle cx="72" cy="72" r="8" fill="#1F2937"/></svg>' },
      { ch: "diamond", label: "Diamond", path: "M50 10 L84 50 L50 90 L16 50 Z", say: "Trace the diamond!", done: "Your diamond became a kite!",
        become: '<svg viewBox="0 0 100 100"><path d="M50 10 L84 50 L50 90 L16 50 Z" fill="#22C55E"/><path d="M50 10 L50 90 M16 50 L84 50" stroke="#FEF3C7" stroke-width="3"/>' +
          '<path d="M50 90 Q42 96 50 99 Q58 102 52 106" fill="none" stroke="#F97316" stroke-width="3"/>' +
          '<path d="M44 94 l6 3 l-6 3 z M54 99 l6 3 l-6 3 z" fill="#F43F5E"/></svg>' }
    ],

    gardenSigns: {
      // flowers drawn in code: kind x colour (an original set for Kido)
      kinds: ["tulip", "daisy", "rose"],
      colors: [["#EF4444", "red"], ["#FACC15", "yellow"], ["#8B5CF6", "purple"]],
      // [pots, signs that are blank] per difficulty
      levels: { 1: [2, 0], 2: [3, 0], 3: [3, 1], 4: [3, 1], 5: [4, 1], 6: [4, 1], 7: [5, 1] },   // never 2 blanks: their flowers could swap
      boards: function (d) { return d <= 2 ? 3 : 4; },
      ask: "Plant each flower in the pot whose sign it matches!",
      blank: "A pot with no sign takes the flower that is left.",
      wantKind: function (k) { return "This sign wants a " + k + "."; },
      wantColor: function (c) { return "This sign wants a " + c + " flower."; },
      start: "Start with the sign that only one flower can match!",
      done: ["What a pretty garden!", "Every flower is in the right pot!", "Well planted, gardener!"]
    },

    trainTrack: {
      boards: function (d) { return d <= 2 ? 3 : d <= 4 ? 4 : 5; },
      size: function (d) { return d <= 2 ? [3, 4] : d <= 4 ? [3, 5] : [4, 6]; },        // rows, cols
      gaps: function (d) { return d <= 4 ? 1 : 2; },
      ask: "Which piece of track is missing? Help the train reach the station!",
      wrong: "That piece doesn't join the track. Look at where the rails come in and go out.",
      done: ["Choo choo! The train made it!", "All aboard! Great track building!", "Toot toot! Perfect track!"]
    },

    sticks: {
      ask: function (k, m) { return "Take away " + k + (k === 1 ? " stick" : " sticks") + " so that " + m + (m === 1 ? " square is" : " squares are") + " left."; },
      loose: "Oops! A stick is left on its own. Every stick must be part of a square.",
      count: function (m) { return "Now there " + (m === 1 ? "is 1 square" : "are " + m + " squares") + ". Try again!"; },
      boards: function (d) { return d <= 2 ? 3 : 4; },
      done: ["Clever thinking!", "That's it! Well done!", "Brilliant! Just the right squares!"]
    },

    /* ---- batch 2 (second research pass): js/activities/thinkLab2.js ---- */
    frogHop: {
      // [first, step, pads] per difficulty: count on, by twos, backwards, by fives
      levels: { 1: [1, 1, 4], 2: [1, 1, 5], 3: [1, 1, 7], 4: [1, 1, 8], 5: [2, 2, 7], 6: [10, -1, 10], 7: [5, 5, 8] },
      crossings: 3,
      ask: function (first, step, last) {
        return step === 1 ? "Hop the frog from " + first + " to " + last + "!" :
               step < 0 ? "Count backwards from " + first + " to " + last + "!" : "Count by " + step + "s from " + first + " to " + last + "!";
      },
      after: function (n) { return "What comes after " + n + "?"; },
      before: function (n) { return "What comes before " + n + "?"; },
      start: function (n) { return "Start with " + n + "!"; },
      done: ["Splash! The frog crossed the pond!", "Ribbit! You counted all the way!", "Hooray! Safe on the other side!"]
    },

    sudoku: {
      fruits: ["apple", "banana", "grapes", "watermelon"],
      // [size, blanks] per difficulty
      levels: { 1: [3, 2], 2: [3, 3], 3: [3, 4], 4: [3, 5], 5: [4, 5], 6: [4, 7], 7: [4, 9] },
      boards: function (d) { return d <= 2 ? 2 : 3; },
      ask: "Every row and every column needs one of each fruit!",
      row: function (f) { return "There is already " + f + " in this row."; },
      col: function (f) { return "There is already " + f + " in this column."; },
      look: "Hmm, look at the other fruits in this row and column.",
      done: ["The garden is full! Well done!", "Every row and column is perfect!", "Fantastic fruit garden!"]
    },

    treasure: {
      animals: ["monkey", "frog", "duck", "rabbit", "fox", "panda"],
      size: function (d) { return d <= 2 ? 3 : d <= 4 ? 4 : 5; },
      rounds: function (d) { return d <= 2 ? 4 : 5; },
      cols: "ABCDE",
      put: function (a, cell) { return "Put the " + a + " on " + cell + "."; },
      where: function (a) { return "Where is the " + a + "?"; },
      on: function (cell) { return "It's on " + cell + "!"; },
      help: function (col, row) { return "Find column " + col + " first, then row " + row + "."; },
      done: ["Treasure found! You read the map!", "Great map reading, explorer!"]
    },

    wires: {
      // [grid size, pairs] per difficulty
      levels: { 1: [3, 2], 2: [3, 2], 3: [4, 3], 4: [4, 3], 5: [5, 4], 6: [5, 4], 7: [5, 5] },
      boards: function (d) { return d <= 2 ? 3 : 4; },
      colors: [["#F59E0B", "yellow"], ["#3B82F6", "blue"], ["#EC4899", "pink"], ["#22C55E", "green"], ["#8B5CF6", "purple"]],
      ask: "Connect each battery to the bulb of the same colour. Wires can't cross!",
      cross: "Wires can't cross. Find another way!",
      lit: function (c) { return "The " + c + " light is on!"; },
      done: ["All the lights are on!", "Bright work, engineer!", "Every bulb is glowing!"]
    },

    robots: {
      parts: {   // name (one / many) and how many a robot can have
        eyes:    { one: "eye", many: "eyes", min: 1, max: 3 },
        arms:    { one: "arm", many: "arms", min: 2, max: 4 },
        wheels:  { one: "wheel", many: "wheels", min: 2, max: 4 },
        antennas:{ one: "antenna", many: "antennas", min: 0, max: 3 }
      },
      colors: ["#4F8EF7", "#F59E0B", "#22C55E", "#EC4899", "#8B5CF6", "#14B8A6"],
      count: function (d) { return d <= 2 ? 2 : d <= 4 ? 3 : 4; },          // robots on screen
      clue: function (d) { return d <= 2 ? "single" : d <= 4 ? "compare" : "two"; },
      lead: "Which robot needs charging?",
      done: ["Charging! Beep boop, thank you!", "Zap! Full battery!", "Yes! That robot is charging!"]
    }
  };
})(window);
