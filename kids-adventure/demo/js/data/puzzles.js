/* =========================================================================
   puzzles.js — Kido Logic & Puzzle manifest (data only)
   Each puzzle = one entry. The engine (js/engine/puzzleEngine.js) picks the
   level that fits the child's age tier, the type renderer
   (js/activities/puzzleTypes.js) draws it. A new puzzle is a new entry; a new
   difficulty is a new level; neither touches engine code.

   Entry
     id, type, world, name              identity; type = pattern | oddOneOut | sequence | match | sort | maze
     ageRange [min,max], difficulty     who it's for; difficulty offsets the age tier (+/-)
     instruction, say                   short on-screen text + what Momo says
     hint, praise                       spoken on hint #1 / on solving
     reward { category }                category passed to Kido.rewards.award
     levels [ { tier, ...type data } ]  tier 1..5 (see TIERS in puzzleEngine.js); the
                                        engine uses the highest level with tier <= child's tier
   Art keys (resolved by the engine):
     "img:<path>"        a licensed photo / cut-out already in assets/img
     "<drawing>:<var>"   a Kido drawing from js/art/puzzleArt.js (plant:3, habitat:ocean, basket:food, rock, bush, goal)
     "momo"              the Kido fox
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  // Friendly names → art. Photos are the licensed assets the app already ships.
  var ART = {
    apple: "img:assets/img/fruits/art/apple.svg", banana: "img:assets/img/fruits/art/banana.svg",
    orange: "img:assets/img/fruits/art/orange.svg", grapes: "img:assets/img/fruits/art/grapes.svg",
    cherry: "img:assets/img/fruits/art/cherry.svg", strawberry: "img:assets/img/fruits/art/strawberry.svg",
    watermelon: "img:assets/img/fruits/art/watermelon.svg", carrot: "img:assets/img/fruits/art/carrot.svg",
    car: "img:assets/img/vehicles/car.jpg", bus: "img:assets/img/vehicles/bus.jpg", train: "img:assets/img/vehicles/train.jpg",
    tractor: "img:assets/img/vehicles/tractor.jpg", airplane: "img:assets/img/vehicles/airplane.jpg",
    cat: "img:assets/img/animals/cat.jpg", dog: "img:assets/img/animals/dog.jpg", cow: "img:assets/img/animals/cow.jpg",
    lion: "img:assets/img/animals/lion.jpg", tiger: "img:assets/img/animals/tiger.jpg", elephant: "img:assets/img/animals/elephant.jpg",
    monkey: "img:assets/img/animals/monkey.jpg", eagle: "img:assets/img/animals/eagle.jpg", penguin: "img:assets/img/animals/penguin.jpg",
    frog: "img:assets/img/animals/frog.jpg", rabbit: "img:assets/img/animals/rabbit.jpg",
    fish: "img:assets/img/animals/fish.jpg", goldfish: "img:assets/img/animals/goldfish.jpg",
    tropical_fish: "img:assets/img/animals/tropical_fish.jpg", pufferfish: "img:assets/img/animals/pufferfish.jpg",
    tiko: "songbird",
    // Change #13 — more animals already in assets/img, the Change #11 food art, and Kido drawings
    giraffe: "img:assets/img/animals/giraffe.jpg", zebra: "img:assets/img/animals/zebra.jpg",
    bananas: "img:assets/img/fruits/art/banana.svg", grass: "img:assets/img/objects/food-grass.svg",
    meat: "img:assets/img/objects/food-meat.svg", leaves: "img:assets/img/objects/food-leaves.svg",
    bugs: "img:assets/img/objects/ant.svg",
    rubber_duck: "thing:duck", leaf: "thing:leaf", wooden_block: "thing:block", coin: "thing:coin", nail: "thing:nail",
    paper_clip: "thing:clip", key: "thing:key", marble: "thing:marble", crayon: "thing:crayon", safety_pin: "thing:pin",
    // Change #13 — public-domain sea & garden photos (docs/ASSET-LICENSE-MANIFEST.md §6) + a few more already shipped
    dolphin: "img:assets/img/animals/dolphin.jpg", whale: "img:assets/img/animals/whale.jpg",
    whale_shark: "img:assets/img/animals/whale_shark.jpg", octopus: "img:assets/img/animals/octopus.jpg",
    sea_turtle: "img:assets/img/animals/sea_turtle.jpg", seahorse: "img:assets/img/animals/seahorse.jpg",
    bee: "img:assets/img/animals/bee.jpg", ladybug: "img:assets/img/animals/ladybug.jpg",
    dragonfly: "img:assets/img/animals/dragonfly.jpg", butterfly: "img:assets/img/animals/monarch.jpg",
    chameleon: "img:assets/img/animals/chameleon.jpg",
    horse: "img:assets/img/animals/horse.jpg", owl: "img:assets/img/animals/owl.jpg", sparrow: "img:assets/img/animals/sparrow.jpg",
    sunflower: "img:assets/img/flowers/sunflower.jpg", earth: "img:assets/img/space/earth.jpg",
    // Change #20 — the shape pictures Kido already ships (assets/img/shapes)
    circle: "img:assets/img/shapes/circle.svg", square: "img:assets/img/shapes/square.svg", triangle: "img:assets/img/shapes/triangle.svg",
    rectangle: "img:assets/img/shapes/rectangle.svg", star: "img:assets/img/shapes/star.svg", heart: "img:assets/img/shapes/heart.svg",
    oval: "img:assets/img/shapes/oval.svg", diamond: "img:assets/img/shapes/diamond.svg", pentagon: "img:assets/img/shapes/pentagon.svg",
    hexagon: "img:assets/img/shapes/hexagon.svg", trapezium: "img:assets/img/shapes/trapezium.svg", cube: "img:assets/img/shapes/cube.svg",
    sphere: "img:assets/img/shapes/sphere.svg", cone: "img:assets/img/shapes/cone.svg", cylinder: "img:assets/img/shapes/cylinder.svg"
  };
  // Change #21 — nature photos (docs/ASSET-LICENSE-MANIFEST.md §12) + flower/fruit photos Kido already ships
  function photos(dir, keys) { keys.forEach(function (k) { ART[k] = ART[k] || "img:assets/img/" + dir + "/" + k + ".jpg"; }); }
  photos("animals", ["bison", "wolf", "kangaroo", "koala", "hippo", "moose", "beaver", "squirrel", "camel",
    "robin", "woodpecker", "hummingbird", "pelican", "puffin", "cardinal", "blue_jay", "heron",
    "sea_otter", "starfish", "jellyfish", "crab", "shark", "seal", "manta_ray", "clownfish", "walrus",
    "ant", "grasshopper", "beetle", "mantis", "caterpillar", "firefly", "tortoise", "iguana", "gecko", "lizard", "turtle"]);
  photos("flowers", ["orchid", "dandelion", "lavender", "poppy", "iris", "fern", "rose", "tulip", "daisy", "lotus", "hibiscus"]);
  photos("fruits", ["pear", "lemon", "blueberry", "kiwi", "coconut", "plum", "pomegranate", "mango", "pineapple"]);
  // Change #21A: a carrot photo to match the photo options in "Which Is Not a Fruit?" (other puzzles keep the cut-out "carrot")
  ART["photo:carrot"] = "img:assets/img/fruits/carrot-bunch.jpg";

  /* Sorting puzzles that explain themselves: [where it goes, what Momo says when the child gets it right].
     A level lists only the keys; sortItems() adds the answer and the reason (show -> try -> explain). */
  var FLOATS = {
    rubber_duck: ["float", "The duck is full of air, so it floats!"],
    leaf: ["float", "A leaf is thin and light. It floats!"],
    wooden_block: ["float", "Wood is lighter than water, so it floats!"],
    apple: ["float", "Surprise! An apple has air inside, so it floats!"],
    rock: ["sink", "A rock is heavy and solid. Down it goes!"],
    coin: ["sink", "A coin is metal. It sinks to the bottom!"],
    key: ["sink", "A metal key sinks!"],
    marble: ["sink", "A glass marble is small, but heavy for its size. It sinks!"],
    nail: ["sink", "An iron nail sinks!"]
  };
  var MAGNETIC = {
    paper_clip: ["yes", "Click! The paper clip is steel, so the magnet pulls it."],
    nail: ["yes", "Iron nails stick to magnets!"],
    safety_pin: ["yes", "The steel safety pin sticks!"],
    rubber_duck: ["no", "Rubber isn't metal. No pull!"],
    leaf: ["no", "A leaf isn't metal, so the magnet can't pull it."],
    wooden_block: ["no", "Wood doesn't stick to magnets."],
    crayon: ["no", "A crayon is made of wax. No pull!"],
    marble: ["no", "Glass doesn't stick, even when it's shiny!"]
  };
  var WHERE = {
    dolphin: ["sea", "Dolphins live in the sea. They pop up to breathe air!"],
    octopus: ["sea", "Octopuses hide in rocks on the sea floor."],
    sea_turtle: ["sea", "Sea turtles swim in warm seas."],
    whale: ["sea", "Whales are the biggest animals in the sea!"],
    whale_shark: ["sea", "The whale shark is a giant fish of the sea."],
    seahorse: ["sea", "Seahorses hold on to sea grass with their tails."],
    cow: ["land", "Cows live on land, on the farm."],
    lion: ["land", "Lions live on land, in the grasslands."],
    rabbit: ["land", "Rabbits live on land and dig burrows."],
    elephant: ["land", "Elephants walk on land."],
    giraffe: ["land", "Giraffes live on land and eat from tall trees."],
    chameleon: ["land", "Chameleons live on land, up in the trees."]
  };
  var MOVES = {
    dolphin: ["swim", "Dolphins swim fast and leap out of the water!"],
    whale_shark: ["swim", "The whale shark swims with its big tail."],
    seahorse: ["swim", "Seahorses swim standing up!"],
    octopus: ["swim", "An octopus can squirt water to zoom away. Whoosh!"],
    whale: ["swim", "Whales swim with their huge tails."],
    elephant: ["walk", "Elephants walk on four big feet."],
    zebra: ["walk", "Zebras walk and gallop across the grass."],
    horse: ["walk", "Horses walk, trot and gallop!"],
    giraffe: ["walk", "Giraffes walk on long legs."],
    chameleon: ["walk", "Chameleons walk slowly along the branches."],
    eagle: ["fly", "Eagles soar high in the sky."],
    bee: ["fly", "Bees fly from flower to flower."],
    butterfly: ["fly", "Butterflies flutter from flower to flower."],
    dragonfly: ["fly", "Dragonflies zip over ponds."],
    owl: ["fly", "Owls fly at night without a sound."]
  };
  // Change #20 — more self-explaining sorts.
  var LEGS = {
    sparrow: ["two", "Birds stand on two legs."], eagle: ["two", "Eagles have two strong legs with sharp claws."],
    owl: ["two", "Owls have two legs, hidden under their fluffy feathers."], penguin: ["two", "Penguins waddle on two short legs."],
    cat: ["four", "Cats walk on four soft paws."], dog: ["four", "Dogs run on four legs."], cow: ["four", "Cows stand on four legs."],
    horse: ["four", "Horses gallop on four long legs."], zebra: ["four", "Zebras run on four legs."], lion: ["four", "Lions prowl on four big paws."],
    elephant: ["four", "Elephants walk on four huge legs."], giraffe: ["four", "Giraffes have four very long legs."],
    frog: ["four", "Frogs have four legs: long back legs for jumping!"],
    bee: ["six", "Bees are insects. Insects have six legs."], ladybug: ["six", "Ladybugs are insects with six tiny legs."],
    butterfly: ["six", "Butterflies are insects. Six legs!"], dragonfly: ["six", "Dragonflies are insects with six legs."]
  };
  var LEG_BINS2 = [["two", "2 legs", "num:2"], ["four", "4 legs", "num:4"]];
  var LEG_BINS3 = LEG_BINS2.concat([["six", "6 legs", "num:6"]]);
  var LIVING = {
    cat: ["living", "A cat is alive. It eats, grows and breathes."], bee: ["living", "A bee is alive. It flies and makes honey."],
    frog: ["living", "A frog is alive. It grows from a tadpole!"], fish: ["living", "A fish is alive. It breathes in the water."],
    rabbit: ["living", "A rabbit is alive. It eats and grows."], butterfly: ["living", "A butterfly is alive. It grew from a caterpillar!"],
    sunflower: ["living", "Plants are alive too! A sunflower drinks water and grows toward the sun."],
    car: ["notliving", "A car moves, but it is not alive. It doesn't eat or grow."], coin: ["notliving", "A coin is metal. It is not alive."],
    key: ["notliving", "A key is not alive. It never grows."], wooden_block: ["notliving", "A block is not alive. It can't eat or grow."],
    crayon: ["notliving", "A crayon is made of wax. It is not alive."], marble: ["notliving", "A marble is glass. Not alive!"],
    train: ["notliving", "A train moves fast, but it is not alive."], rubber_duck: ["notliving", "A rubber duck floats, but it is a toy, not alive."],
    airplane: ["notliving", "An airplane flies, but it is a machine, not alive."]
  };
  var LIFE_BINS = [["living", "Living", "plant:5"], ["notliving", "Not living", "rock"]];
  // Change #21 — animal groups (the bin pictures are species that never appear as items)
  var GROUPS = {
    kangaroo: ["mammal", "A kangaroo has fur and feeds its joey milk. It's a mammal!"], koala: ["mammal", "Koalas have soft fur. They're mammals!"],
    hippo: ["mammal", "A hippo's baby drinks milk. Hippos are mammals!"], bison: ["mammal", "A bison has a shaggy fur coat. It's a mammal!"],
    squirrel: ["mammal", "A squirrel has a furry tail. It's a mammal!"], camel: ["mammal", "Camels have fur and feed their babies milk. Mammals!"],
    wolf: ["mammal", "A wolf has a thick fur coat. It's a mammal!"], beaver: ["mammal", "Beavers have fur and swim. They're mammals!"],
    walrus: ["mammal", "A walrus lives in the sea, but it breathes air and feeds its baby milk. A mammal!"],
    sea_otter: ["mammal", "Sea otters have the thickest fur of any animal. They're mammals!"],
    robin: ["bird", "A robin has feathers and wings. It's a bird!"], cardinal: ["bird", "The cardinal has bright red feathers. It's a bird!"],
    puffin: ["bird", "A puffin has feathers and lays an egg. It's a bird!"], pelican: ["bird", "A pelican has feathers and a big beak. A bird!"],
    hummingbird: ["bird", "The tiny hummingbird has feathers. It's a bird!"], woodpecker: ["bird", "A woodpecker has feathers and a strong beak. A bird!"],
    heron: ["bird", "A heron has feathers and long legs. It's a bird!"], blue_jay: ["bird", "A blue jay has blue feathers. It's a bird!"],
    ant: ["insect", "An ant has six legs. It's an insect!"], firefly: ["insect", "A firefly has six legs and wings. It's an insect!"],
    grasshopper: ["insect", "A grasshopper has six legs. It's an insect!"], beetle: ["insect", "A beetle has six legs and a hard shell. An insect!"],
    mantis: ["insect", "A praying mantis has six legs. It's an insect!"],
    tortoise: ["reptile", "A tortoise has scaly skin and lays eggs. It's a reptile!"], iguana: ["reptile", "An iguana has scaly skin. It's a reptile!"],
    gecko: ["reptile", "A gecko has scaly skin and lays eggs. A reptile!"]
  };
  var GROUP_BINS2 = [["mammal", "Mammals", "cow"], ["bird", "Birds", "sparrow"]];
  var GROUP_BINS3 = GROUP_BINS2.concat([["insect", "Insects", "bee"]]);
  var GROUP_BINS4 = GROUP_BINS3.concat([["reptile", "Reptiles", "chameleon"]]);
  var SIDES = {
    circle: ["round", "A circle is round all the way. No corners!"], oval: ["round", "An oval is round, like an egg."],
    square: ["four", "A square has four sides, all the same."], rectangle: ["four", "A rectangle has four sides: two long, two short."],
    diamond: ["four", "A diamond has four sides too!"], trapezium: ["four", "A trapezium has four sides."],
    triangle: ["three", "A triangle has three sides and three corners."],
    pentagon: ["more", "A pentagon has five sides."], hexagon: ["more", "A hexagon has six sides, like a honeycomb cell!"]
  };
  // Change #22: planets (art "planet:<key>" / name cards "pname:<key>") — matching twins or names, and the order from the Sun.
  var PLANET_WHY = { mercury: "Mercury is the smallest planet.", venus: "Venus is the hottest planet.", earth: "Earth is our blue and green home.",
    mars: "Mars is the red planet.", jupiter: "Jupiter is the biggest planet.", saturn: "Saturn has the biggest rings.",
    uranus: "Uranus spins on its side.", neptune: "Neptune is the farthest planet from the Sun." };
  function PLANET_TWINS(keys) { return keys.map(function (k) { return ["planet:" + k, "planet:" + k, PLANET_WHY[k]]; }); }
  function PLANET_NAMES(keys) { return keys.map(function (k) { return ["planet:" + k, "pname:" + k, PLANET_WHY[k]]; }); }
  function PLANETS_FROM_SUN(n) { return ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"].slice(0, n).map(function (k) { return "planet:" + k; }); }
  // Change #23: the torn map — a piece to its twin (youngest), or to its drawing in map ink.
  var MAP_WHY = { palm: "The palm tree fits here!", rock: "The big rock fits here!", bridge: "The bridge fits here!", cave: "The cave fits here! That's where the X is.", hut: "The little hut fits here!" };
  function MAP_TWINS(keys) { return keys.map(function (k) { return ["land:" + k, "land:" + k, MAP_WHY[k]]; }); }
  function MAP_INK(keys) { return keys.map(function (k) { return ["land:" + k, "ink:" + k, MAP_WHY[k]]; }); }
  function sortItems(table, keys) { return keys.map(function (k) { return [k, table[k][0], table[k][1]]; }); }
  var TUBS = [["float", "Floats", "tub:float"], ["sink", "Sinks", "tub:sink"]];
  var MAGNET_BINS = [["yes", "Sticks", "magnet:pull"], ["no", "Doesn't stick", "magnet:not"]];
  var SEA_LAND = [["sea", "Sea", "habitat:ocean"], ["land", "Land", "habitat:land"]];
  var SWIM_WALK_FLY = [["swim", "Swims", "habitat:ocean"], ["walk", "Walks", "habitat:land"], ["fly", "Flies", "habitat:sky"]];

  // Footprint descriptions for screen readers (don't name the animal — that would give the answer away).
  var TRACK_LABELS = { "track:bird": "Three thin toes", "track:cat": "Round paw prints", "track:deer": "Split hoof prints", "track:duck": "Wide webbed feet" };
  var FOOTPRINT_PAIR = [["tiko", "track:bird", "Little birds leave three thin toe marks!"]];
  // Change #17A: Sam's socks (The Tidy Room) — each sock goes to the one that looks the same.
  var SOCK_LABELS = { "sock:stripes": "Striped sock", "sock:dots": "Spotty pink sock", "sock:stars": "Starry sock", "sock:hearts": "Heart sock",
    "sock:zigzag": "Zigzag sock", "sock:spots": "Spotty orange sock", "sock:plain": "Plain red sock" };
  var SOCK_WHY = { stripes: "Stripes go with stripes!", dots: "Pink spots go with pink spots!", stars: "Stars go with stars!",
    hearts: "Hearts go with hearts!", spots: "Orange spots go with orange spots!" };
  function socks(keys) { return keys.map(function (k) { return ["sock:" + k, "sock:" + k, SOCK_WHY[k]]; }); }
  var SOCK_LEVEL = { labels: SOCK_LABELS, showLabels: false, poolLabel: "Socks", targetsLabel: "Their partners",
    missText: "Hmm, those two don't match. Look at the colour and the pattern!" };
  function sockLevel(tier, keys, decoys) { var l = { tier: tier, pairs: socks(keys) }; if (decoys) l.decoys = decoys; Object.keys(SOCK_LEVEL).forEach(function (k) { l[k] = SOCK_LEVEL[k]; }); return l; }

  var PUZZLES = [
    {
      id: "pattern_001", type: "pattern", world: "puzzle", name: "What Comes Next?", media: "assets/img/fruits/art/apple.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "What comes next?", say: "Look at the pattern. What comes next?",
      hint: "Say it with me! Find the part that repeats.", praise: "Yes! You found the pattern!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, seq: ["apple", "banana", "apple", "banana", "?"], options: ["apple", "banana"], answer: "apple", unit: 2 },
        { tier: 2, seq: ["apple", "banana", "apple", "banana", "apple", "?"], options: ["banana", "apple", "grapes"], answer: "banana", unit: 2 },
        { tier: 3, seq: ["apple", "banana", "banana", "apple", "banana", "?"], options: ["banana", "apple", "orange"], answer: "banana", unit: 3 },
        { tier: 4, seq: ["apple", "banana", "grapes", "apple", "banana", "?"], options: ["grapes", "apple", "banana", "orange"], answer: "grapes", unit: 3 },
        { tier: 5, seq: ["apple", "apple", "banana", "cherry", "apple", "apple", "banana", "?"], options: ["cherry", "apple", "banana", "grapes", "orange"], answer: "cherry", unit: 4 }
      ]
    },
    {
      id: "odd_001", type: "oddOneOut", world: "puzzle", name: "Which One Is Different?", media: "assets/img/games/magnifier.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which one is different?", say: "Which one is different?",
      hint: "Look! These belong together.", praise: "Well spotted!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, items: ["apple", "banana", "car"], answer: "car", why: "A car is not a fruit!" },
        { tier: 2, items: ["apple", "banana", "orange", "car"], answer: "car", why: "A car is not a fruit!" },
        { tier: 3, items: ["car", "bus", "train", "tractor", "banana"], answer: "banana", why: "A banana is not something you ride in!" },
        { tier: 4, items: ["lion", "tiger", "elephant", "cow", "eagle"], answer: "eagle", why: "The eagle is a bird. The others are mammals!" },
        { tier: 5, items: ["fish", "goldfish", "tropical_fish", "pufferfish", "frog"], answer: "frog", why: "A frog can live on land too. The others are fish!" }
      ]
    },
    {
      id: "sequence_001", type: "sequence", world: "puzzle", name: "Watch It Grow", media: "assets/img/objects/grow-plant.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "What grows next?", say: "A seed grows and grows. What comes next?",
      hint: "Each one is a little bigger.", praise: "That's how a plant grows!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, mode: "next", shown: ["plant:1", "plant:2"], options: ["plant:3", "plant:1"], answer: "plant:3" },
        { tier: 2, mode: "next", shown: ["plant:1", "plant:2", "plant:3"], options: ["plant:4", "plant:1", "plant:2"], answer: "plant:4" },
        { tier: 3, mode: "next", shown: ["plant:2", "plant:3", "plant:4"], options: ["plant:5", "plant:1", "plant:3"], answer: "plant:5" },
        { tier: 4, mode: "order", instruction: "Put them in order!", say: "Tap them in order, from the seed to the biggest plant!", order: ["plant:1", "plant:2", "plant:3", "plant:4"] },
        { tier: 5, mode: "order", instruction: "Put them in order!", say: "Tap them in order, from the seed to the flower!", order: ["plant:1", "plant:2", "plant:3", "plant:4", "plant:5"] }
      ]
    },
    {
      id: "match_001", type: "match", world: "puzzle", name: "Who Lives Where?", media: "assets/img/animals/monkey.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Who lives where?", say: "Take each animal to its home!",
      hint: "Think: where does it find food and water?", praise: "Everyone is home!",
      reward: { category: "animals" },
      levels: [
        { tier: 1, pairs: [["monkey", "habitat:jungle", "Monkeys swing in the jungle trees."], ["fish", "habitat:ocean", "Fish need water to swim."]] },
        { tier: 2, pairs: [["monkey", "habitat:jungle", "Monkeys swing in the jungle trees."], ["fish", "habitat:ocean", "Fish need water to swim."], ["elephant", "habitat:savanna", "Elephants walk on the grassy savanna."]] },
        { tier: 3, pairs: [["monkey", "habitat:jungle", "Monkeys swing in the jungle trees."], ["fish", "habitat:ocean", "Fish need water to swim."], ["elephant", "habitat:savanna", "Elephants walk on the grassy savanna."], ["cow", "habitat:farm", "Cows live on the farm."]] },
        { tier: 4, pairs: [["monkey", "habitat:jungle", "Monkeys swing in the jungle trees."], ["fish", "habitat:ocean", "Fish need water to swim."], ["elephant", "habitat:savanna", "Elephants walk on the grassy savanna."], ["penguin", "habitat:ice", "Penguins love the cold ice."]] },
        { tier: 5, pairs: [["monkey", "habitat:jungle", "Monkeys swing in the jungle trees."], ["fish", "habitat:ocean", "Fish need water to swim."], ["elephant", "habitat:savanna", "Elephants walk on the grassy savanna."], ["penguin", "habitat:ice", "Penguins love the cold ice."], ["frog", "habitat:pond", "Frogs hop by the pond."]] }
      ]
    },
    {
      id: "sort_001", type: "sort", world: "puzzle", name: "Sort It Out", media: "assets/img/fruits/basket-front.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Animals or food?", say: "Put the animals in one basket and the food in the other!",
      hint: "Can it walk or swim? Then it's an animal!", praise: "All sorted!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, bins: [["animals", "Animals", "basket:animals"], ["food", "Food", "basket:food"]], items: [["cat", "animals"], ["apple", "food"]] },
        { tier: 2, bins: [["animals", "Animals", "basket:animals"], ["food", "Food", "basket:food"]], items: [["cat", "animals"], ["apple", "food"], ["dog", "animals"], ["banana", "food"]] },
        { tier: 3, bins: [["animals", "Animals", "basket:animals"], ["food", "Food", "basket:food"]], items: [["cat", "animals"], ["apple", "food"], ["cow", "animals"], ["banana", "food"], ["rabbit", "animals"], ["grapes", "food"]] },
        { tier: 4, bins: [["animals", "Animals", "basket:animals"], ["food", "Food", "basket:food"]], items: [["fish", "animals"], ["carrot", "food"], ["frog", "animals"], ["cherry", "food"], ["penguin", "animals"], ["watermelon", "food"]] },
        { tier: 5, instruction: "Animals, food or vehicles?", say: "Three baskets! Animals, food, and things that move us!",
          bins: [["animals", "Animals", "basket:animals"], ["food", "Food", "basket:food"], ["vehicles", "Vehicles", "basket:vehicles"]],
          items: [["fish", "animals"], ["carrot", "food"], ["train", "vehicles"], ["eagle", "animals"], ["cherry", "food"], ["airplane", "vehicles"], ["frog", "animals"], ["strawberry", "food"], ["tractor", "vehicles"]] }
      ]
    },
    {
      id: "maze_001", type: "maze", world: "puzzle", name: "Find the Way", media: "assets/img/objects/build-bridge.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Help Momo reach the star!", say: "Help Momo reach the star! Go around the rocks.",
      hint: "Try this way!", praise: "Momo made it! Great path!",
      reward: { category: "oddoneout" },
      // S = start, G = goal, # = rock, * = bush, . = path
      levels: [
        { tier: 1, grid: ["S.#", "#..", "#.G"] },
        { tier: 2, grid: ["S..#", "##.#", "G..."] },
        { tier: 3, grid: ["S.#.", "..*.", "#...", "*.#G"] },
        { tier: 4, grid: ["S..#.", "##...", ".*.#.", ".##*.", "....G"] },
        { tier: 5, grid: ["S.#...", ".*#.*.", "...#..", "#*...#", "..#*..", "*...#G"] }
      ]
    },
    /* ---- Change #13: science & nature puzzles (Kido Lab, Space Station, the garden, the Jungle) ---- */
    {
      id: "float_001", type: "sort", world: "lab", name: "Float or Sink?", media: "assets/img/science/float-or-sink-tile.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Will it float or sink?", say: "Splash! Will it float on top of the water, or sink to the bottom?",
      hint: "Heavy, solid things like stone and metal sink. Light things float.", praise: "Great experimenting!",
      targetsLabel: "Tubs of water", missText: "Hmm, think about the {thing}. Is it light, or heavy and solid?", clueText: "Will the {thing} float or sink?",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, bins: TUBS, items: sortItems(FLOATS, ["rubber_duck", "rock"]) },
        { tier: 2, bins: TUBS, items: sortItems(FLOATS, ["rubber_duck", "rock", "leaf", "coin"]) },
        { tier: 3, bins: TUBS, items: sortItems(FLOATS, ["rubber_duck", "rock", "leaf", "coin", "wooden_block", "key"]) },
        { tier: 4, bins: TUBS, items: sortItems(FLOATS, ["rubber_duck", "coin", "leaf", "marble", "wooden_block", "nail", "apple", "key"]) },
        { tier: 5, say: "Think like a scientist! Some answers may surprise you.", bins: TUBS,
          items: sortItems(FLOATS, ["apple", "coin", "wooden_block", "marble", "leaf", "nail", "rubber_duck", "key", "rock"]) }
      ]
    },
    {
      id: "magnet_001", type: "sort", world: "lab", name: "Magnet Power", media: "assets/img/science/magnet-tile.svg",
      ageRange: [4, 10], difficulty: 0,
      instruction: "Will the magnet pick it up?", say: "Magnets pull some metal things. Which ones will stick?",
      hint: "Magnets pull things made of iron, like nails and paper clips.", praise: "You found the magnetic things!",
      targetsLabel: "Sticks or doesn't stick", missText: "Is the {thing} made of iron or steel? Try the other side!", clueText: "Will the magnet pull the {thing}?",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, bins: MAGNET_BINS, items: sortItems(MAGNETIC, ["paper_clip", "rubber_duck"]) },
        { tier: 2, bins: MAGNET_BINS, items: sortItems(MAGNETIC, ["paper_clip", "rubber_duck", "nail", "leaf"]) },
        { tier: 3, bins: MAGNET_BINS, items: sortItems(MAGNETIC, ["paper_clip", "rubber_duck", "nail", "leaf", "safety_pin", "wooden_block"]) },
        { tier: 4, bins: MAGNET_BINS, items: sortItems(MAGNETIC, ["paper_clip", "crayon", "nail", "leaf", "safety_pin", "wooden_block", "rubber_duck"]) },
        { tier: 5, say: "Careful! Not every shiny thing is magnetic.", bins: MAGNET_BINS,
          items: sortItems(MAGNETIC, ["paper_clip", "marble", "nail", "crayon", "safety_pin", "wooden_block", "leaf", "rubber_duck"]) }
      ]
    },
    {
      id: "lifecycle_001", type: "sequence", world: "village", name: "From Egg to Butterfly", media: "assets/img/science/butterfly-life-cycle-tile.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "What comes next?", say: "A butterfly starts as a tiny egg on a leaf. What comes next?",
      hint: "The caterpillar eats and grows, then rests inside a chrysalis.", praise: "That's how a caterpillar becomes a butterfly!",
      reward: { category: "animals" },
      levels: [
        { tier: 1, mode: "next", say: "The caterpillar rests, then it changes. What does it become?", shown: ["bug:2", "bug:3"], options: ["bug:4", "bug:2"], answer: "bug:4" },
        { tier: 2, mode: "next", shown: ["bug:1", "bug:2", "bug:3"], options: ["bug:4", "bug:1", "bug:2"], answer: "bug:4" },
        { tier: 3, mode: "next", say: "First an egg, then a caterpillar. What comes in between?", shown: ["bug:1", "bug:2"], options: ["bug:3", "bug:4", "bug:1"], answer: "bug:3" },
        { tier: 4, mode: "order", instruction: "Put them in order!", say: "Tap them in order, from the tiny egg to the butterfly!", order: ["bug:1", "bug:2", "bug:3", "bug:4"] },
        { tier: 5, mode: "order", instruction: "Round and round!", say: "It's a cycle! Start with the butterfly. She lays an egg... then what?", order: ["bug:4", "bug:1", "bug:2", "bug:3"] }
      ]
    },
    {
      id: "moon_001", type: "sequence", world: "space", name: "The Moon Changes Shape", media: "assets/img/science/moon-phases-tile.svg",
      ageRange: [4, 10], difficulty: 0,
      instruction: "What comes next?", say: "Every night the moon looks a little different. What comes next?",
      hint: "The bright part grows a little more each night.", praise: "You know how the moon grows!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, mode: "next", say: "The moon is getting rounder and rounder. What comes next?", shown: ["moon:3", "moon:4"], options: ["moon:5", "moon:2"], answer: "moon:5" },
        { tier: 2, mode: "next", shown: ["moon:2", "moon:3", "moon:4"], options: ["moon:5", "moon:1", "moon:2"], answer: "moon:5" },
        { tier: 3, mode: "next", say: "A thin moon grows bigger. What comes after the crescent?", shown: ["moon:1", "moon:2"], options: ["moon:3", "moon:5", "moon:1"], answer: "moon:3" },
        { tier: 4, mode: "order", instruction: "Put them in order!", say: "Tap them in order, from the thin crescent to the full moon!", order: ["moon:2", "moon:3", "moon:4", "moon:5"] },
        { tier: 5, mode: "order", instruction: "Put them in order!", say: "Tap them in order, from the dark new moon to the bright full moon!", order: ["moon:1", "moon:2", "moon:3", "moon:4", "moon:5"] }
      ]
    },
    {
      id: "food_001", type: "match", world: "jungle", name: "Who Eats What?", media: "assets/img/animals/giraffe.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Who eats what?", say: "Lunch time! Give each animal the food it likes best.",
      hint: "Some animals eat plants. Some eat meat.", praise: "Everyone is happy and full!",
      reward: { category: "animals" },
      levels: [
        { tier: 1, pairs: [["cow", "grass", "Cows munch grass all day."], ["lion", "meat", "Lions are hunters. They eat meat."]] },
        { tier: 2, pairs: [["cow", "grass", "Cows munch grass all day."], ["lion", "meat", "Lions are hunters. They eat meat."], ["monkey", "bananas", "Monkeys love fruit, like bananas."]] },
        { tier: 3, pairs: [["cow", "grass", "Cows munch grass all day."], ["lion", "meat", "Lions are hunters. They eat meat."], ["monkey", "bananas", "Monkeys love fruit, like bananas."], ["giraffe", "leaves", "Giraffes reach high to eat leaves from tall trees."]] },
        { tier: 4, pairs: [["cow", "grass", "Cows munch grass all day."], ["lion", "meat", "Lions are hunters. They eat meat."], ["monkey", "bananas", "Monkeys love fruit, like bananas."], ["giraffe", "leaves", "Giraffes reach high to eat leaves from tall trees."], ["frog", "bugs", "Frogs catch bugs with their long, sticky tongues."]] },
        { tier: 5, pairs: [["zebra", "grass", "Zebras graze on grass."], ["lion", "meat", "Lions are hunters. They eat meat."], ["monkey", "bananas", "Monkeys love fruit, like bananas."], ["giraffe", "leaves", "Giraffes reach high to eat leaves from tall trees."], ["frog", "bugs", "Frogs catch bugs with their long, sticky tongues."], ["rabbit", "carrot", "Rabbits eat grass and leafy plants. A carrot is a crunchy treat!"]] }
      ]
    },
    {
      id: "sealand_001", type: "sort", world: "ocean", name: "Sea or Land?", media: "assets/img/animals/dolphin.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Does it live in the sea or on land?", say: "Some animals live in the sea. Some live on land. Where does each one live?",
      hint: "Does it have fins or flippers for swimming, or legs for walking?", praise: "Every animal is home!",
      targetsLabel: "Sea and land", missText: "Hmm, where would a {thing} find its food? Try the other place!", clueText: "Where does the {thing} live?",
      reward: { category: "animals" },
      levels: [
        { tier: 1, bins: SEA_LAND, items: sortItems(WHERE, ["dolphin", "cow"]) },
        { tier: 2, bins: SEA_LAND, items: sortItems(WHERE, ["dolphin", "cow", "octopus", "lion"]) },
        { tier: 3, bins: SEA_LAND, items: sortItems(WHERE, ["dolphin", "cow", "octopus", "lion", "sea_turtle", "rabbit"]) },
        { tier: 4, instruction: "Swim, walk or fly?", say: "How does each animal get around? Does it swim, walk, or fly?",
          hint: "Look for fins, legs, or wings!", missText: "Look again! Does the {thing} have fins, legs, or wings?", clueText: "How does the {thing} get around?",
          targetsLabel: "Swim, walk or fly", bins: SWIM_WALK_FLY, items: sortItems(MOVES, ["whale_shark", "elephant", "eagle", "seahorse", "zebra", "bee"]) },
        { tier: 5, instruction: "Swim, walk or fly?", say: "Swim, walk, or fly? Think about how each animal really moves!",
          hint: "Look for fins, legs, or wings!", missText: "Look again! Does the {thing} have fins, legs, or wings?", clueText: "How does the {thing} get around?",
          targetsLabel: "Swim, walk or fly", bins: SWIM_WALK_FLY, items: sortItems(MOVES, ["octopus", "giraffe", "dragonfly", "whale", "chameleon", "butterfly", "seahorse", "horse", "owl"]) }
      ]
    },
    {
      id: "insect_001", type: "oddOneOut", world: "village", name: "Which Is Not an Insect?", media: "assets/img/animals/ladybug.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which one is not an insect?", say: "Insects are small animals with six legs. Which one is not an insect?",
      hint: "Count the legs! Insects have six.", praise: "You know your insects!",
      reward: { category: "animals" },
      levels: [
        { tier: 1, items: ["bee", "ladybug", "cow"], answer: "cow", why: "A cow is big and has four legs. It's not an insect!" },
        { tier: 2, items: ["bee", "ladybug", "dragonfly", "cat"], answer: "cat", why: "A cat has four legs and fur. It's not an insect!" },
        { tier: 3, items: ["bee", "ladybug", "butterfly", "dragonfly", "fish"], answer: "fish", why: "A fish swims with fins. It's not an insect!" },
        { tier: 4, items: ["bee", "ladybug", "dragonfly", "butterfly", "chameleon"], answer: "chameleon", why: "A chameleon eats insects, but it's a reptile with four legs!" },
        { tier: 5, say: "They can all fly! But which one is not an insect?", items: ["bee", "ladybug", "dragonfly", "butterfly", "sparrow"], answer: "sparrow",
          why: "A sparrow has wings too, but it's a bird with two legs. Insects have six!" }
      ]
    },
    /* ---- Change #20: activity expansion (shapes, numbers, letters, memory, spatial, science) ---- */
    {
      id: "shapepattern_001", type: "pattern", world: "puzzle", name: "Shape Patterns", media: "assets/img/games/shapes.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which shape comes next?", say: "Look at the shapes. Which shape comes next?",
      hint: "Say the shapes out loud. Find the part that repeats!", praise: "Shape pattern solved!",
      reward: { category: "shapes" },
      levels: [
        { tier: 1, seq: ["circle", "square", "circle", "square", "?"], options: ["circle", "square"], answer: "circle", unit: 2 },
        { tier: 2, seq: ["triangle", "star", "triangle", "star", "triangle", "?"], options: ["star", "triangle", "heart"], answer: "star", unit: 2 },
        { tier: 3, seq: ["circle", "circle", "square", "circle", "circle", "?"], options: ["square", "circle", "triangle"], answer: "square", unit: 3 },
        { tier: 4, seq: ["star", "heart", "triangle", "star", "heart", "?"], options: ["triangle", "star", "heart", "circle"], answer: "triangle", unit: 3 },
        { tier: 5, seq: ["square", "triangle", "triangle", "circle", "square", "triangle", "triangle", "?"], options: ["circle", "square", "triangle", "star", "heart"], answer: "circle", unit: 4 }
      ]
    },
    {
      id: "shapesort_001", type: "sort", world: "puzzle", name: "Corners and Sides", media: "assets/img/shapes/hexagon.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Round, or corners?", say: "Some shapes are round. Some have corners. Where does each shape go?",
      hint: "Run your finger around the shape. Does it bump into a corner?", praise: "Every shape is sorted!",
      targetsLabel: "Shape groups", missText: "Look at the {thing} again. Count its corners!", clueText: "How many sides does the {thing} have?",
      reward: { category: "shapes" },
      levels: [
        { tier: 1, bins: [["round", "Round", "circle"], ["four", "Corners", "square"]], items: sortItems(SIDES, ["circle", "square"]) },
        { tier: 2, bins: [["round", "Round", "circle"], ["four", "Corners", "square"]], items: [["circle", "round", SIDES.circle[1]], ["square", "four", SIDES.square[1]], ["oval", "round", SIDES.oval[1]], ["triangle", "four", "A triangle has corners. Three of them!"]] },
        { tier: 3, instruction: "Count the sides!", say: "Count the sides! Three sides, four sides, or round?",
          bins: [["three", "3 sides", "triangle"], ["four", "4 sides", "square"], ["round", "Round", "circle"]],
          items: sortItems(SIDES, ["triangle", "rectangle", "circle", "diamond", "oval", "square"]) },
        { tier: 4, instruction: "Count the sides!", say: "Count the sides! Three sides, four sides, or round?",
          bins: [["three", "3 sides", "triangle"], ["four", "4 sides", "square"], ["round", "Round", "circle"]],
          items: sortItems(SIDES, ["trapezium", "triangle", "oval", "diamond", "rectangle", "circle", "square"]) },
        { tier: 5, instruction: "Three, four, or more?", say: "Count carefully! Three sides, four sides, or more than four?",
          bins: [["three", "3 sides", "triangle"], ["four", "4 sides", "square"], ["more", "More sides", "hexagon"]],
          items: sortItems(SIDES, ["pentagon", "triangle", "trapezium", "hexagon", "diamond", "rectangle", "square"]) }
      ]
    },
    {
      id: "shapeodd_001", type: "oddOneOut", world: "puzzle", name: "Odd Shape Out", media: "assets/img/shapes/star.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which shape is different?", say: "Which shape doesn't belong?",
      hint: "Look at the corners and the sides.", praise: "Sharp shape eyes!",
      reward: { category: "shapes" },
      levels: [
        { tier: 1, items: ["star", "star", "heart"], answer: "heart", why: "The heart is a different shape!" },
        { tier: 2, items: ["triangle", "triangle", "triangle", "circle"], answer: "circle", why: "The circle is round. The others are triangles!" },
        { tier: 3, items: ["square", "rectangle", "diamond", "circle"], answer: "circle", why: "The circle has no corners. The others have four!" },
        { tier: 4, items: ["cube", "sphere", "cone", "cylinder", "square"], answer: "square", why: "A square is flat. The others are solid shapes you can hold!" },
        { tier: 5, items: ["triangle", "square", "pentagon", "hexagon", "circle"], answer: "circle", why: "The circle has no straight sides at all!" }
      ]
    },
    {
      id: "countmatch_001", type: "match", world: "space", name: "Count and Match", media: "assets/img/games/apples.svg",
      ageRange: [3, 8], difficulty: 0,
      instruction: "How many dots?", say: "Count the dots, then take each card to its number!",
      hint: "Touch each dot as you count it.", praise: "Counting champion!",
      reward: { category: "numbers" },
      levels: [
        { tier: 1, pairs: [["dots:1", "num:1", "One dot!"], ["dots:2", "num:2", "One, two. Two dots!"]] },
        { tier: 2, pairs: [["dots:1", "num:1", "One dot!"], ["dots:2", "num:2", "Two dots!"], ["dots:3", "num:3", "One, two, three!"]] },
        { tier: 3, pairs: [["dots:2", "num:2", "Two dots!"], ["dots:3", "num:3", "Three dots!"], ["dots:4", "num:4", "Four dots!"], ["dots:5", "num:5", "Five dots, like fingers on a hand!"]] },
        { tier: 4, pairs: [["dots:3", "num:3", "Three!"], ["dots:5", "num:5", "Five!"], ["dots:6", "num:6", "Six, like a dice!"], ["dots:7", "num:7", "Five and two more makes seven!"], ["dots:8", "num:8", "Five and three more makes eight!"]] },
        { tier: 5, decoys: ["num:4"], pairs: [["dots:6", "num:6", "One row of five, and one more: six!"], ["dots:7", "num:7", "Five and two: seven!"], ["dots:8", "num:8", "Five and three: eight!"], ["dots:9", "num:9", "Just one empty box: nine!"], ["dots:10", "num:10", "A full frame: ten!"]] }
      ].map(function (l) { l.poolLabel = "Dot cards"; l.targetsLabel = "Numbers"; l.showLabels = false; l.missText = "Count again slowly, touching each dot."; return l; })
    },
    {
      id: "numpattern_001", type: "pattern", world: "space", name: "Number Patterns", media: "assets/img/games/balloons.svg",
      ageRange: [4, 10], difficulty: 0,
      instruction: "Which number comes next?", say: "Look at the numbers. Which one comes next?",
      hint: "Say the numbers out loud. What is changing?", praise: "Number detective!",
      reward: { category: "numbers" },
      levels: [
        { tier: 1, seq: ["num:1", "num:2", "num:1", "num:2", "?"], options: ["num:1", "num:2"], answer: "num:1", unit: 2 },
        { tier: 2, seq: ["num:1", "num:2", "num:3", "num:1", "num:2", "?"], options: ["num:3", "num:1", "num:4"], answer: "num:3", unit: 3 },
        { tier: 3, say: "Count on! Which number comes next?", hint: "Say them out loud: one, two, three, four...",
          seq: ["num:1", "num:2", "num:3", "num:4", "?"], options: ["num:5", "num:6", "num:3"], answer: "num:5", unit: 1 },
        { tier: 4, say: "Counting by twos! Which number comes next?", hint: "Each number jumps up by two.",
          seq: ["num:2", "num:4", "num:6", "?"], options: ["num:8", "num:7", "num:10", "num:9"], answer: "num:8", unit: 1 },
        { tier: 5, say: "Counting by fives! Which number comes next?", hint: "Each number jumps up by five.",
          seq: ["num:5", "num:10", "num:15", "num:20", "?"], options: ["num:25", "num:21", "num:30", "num:22", "num:24"], answer: "num:25", unit: 1 }
      ]
    },
    {
      id: "towers_001", type: "sequence", world: "space", name: "Build the Towers", media: "assets/img/shapes/cube.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which tower comes next?", say: "Each tower has one more block. Which tower comes next?",
      hint: "Count the blocks in each tower.", praise: "Brilliant building!",
      reward: { category: "numbers" },
      levels: [
        { tier: 1, mode: "next", shown: ["tower:1", "tower:2"], options: ["tower:3", "tower:1"], answer: "tower:3" },
        { tier: 2, mode: "next", shown: ["tower:1", "tower:2", "tower:3"], options: ["tower:4", "tower:1", "tower:2"], answer: "tower:4" },
        { tier: 3, mode: "next", shown: ["tower:2", "tower:3", "tower:4"], options: ["tower:5", "tower:3", "tower:1"], answer: "tower:5" },
        { tier: 4, mode: "order", instruction: "Smallest to tallest!", say: "Tap the towers in order, from the smallest to the tallest!", order: ["tower:1", "tower:2", "tower:3", "tower:4", "tower:5"] },
        { tier: 5, mode: "order", instruction: "Tallest to smallest!", say: "Count down! Tap the towers from the tallest to the smallest.", missFirst: "Start with the tallest tower!",
          order: ["tower:6", "tower:5", "tower:4", "tower:3", "tower:2", "tower:1"] }
      ]
    },
    {
      id: "sums_001", type: "match", world: "space", name: "Number Puzzles", media: "assets/img/games/scale.svg",
      ageRange: [5, 10], difficulty: 0,
      instruction: "Find the answer!", say: "Solve each little puzzle and take it to its answer!",
      hint: "Use your fingers to count it out.", praise: "Super solver!",
      reward: { category: "numbers" },
      levels: [
        { tier: 1, pairs: [["sum:1p1", "num:2", "One and one make two!"], ["sum:2p1", "num:3", "Two and one more make three!"]] },
        { tier: 2, pairs: [["sum:1p1", "num:2", "One and one make two!"], ["sum:2p1", "num:3", "Two and one make three!"], ["sum:2p2", "num:4", "Two and two make four!"]] },
        { tier: 3, pairs: [["sum:2p1", "num:3", "Two and one make three!"], ["sum:2p2", "num:4", "Two and two make four!"], ["sum:3p2", "num:5", "Three and two make five!"], ["sum:5p1", "num:6", "Five and one more make six!"]] },
        { tier: 4, pairs: [["sum:3p2", "num:5", "Three plus two is five."], ["sum:4p3", "num:7", "Four plus three is seven."], ["sum:6p2", "num:8", "Six plus two is eight."], ["sum:5p4", "num:9", "Five plus four is nine."], ["sum:8m2", "num:6", "Eight take away two leaves six."]] },
        { tier: 5, pairs: [["sum:7p5", "num:12", "Seven plus five is twelve."], ["sum:9p6", "num:15", "Nine plus six is fifteen."], ["sum:13m4", "num:9", "Thirteen take away four is nine."], ["sum:16m9", "num:7", "Sixteen take away nine is seven."], ["sum:8p8", "num:16", "Eight plus eight is sixteen. Double eight!"]] }
      ].map(function (l) { l.poolLabel = "Puzzles"; l.targetsLabel = "Answers"; l.showLabels = false; l.missText = "Hmm, count it out again. What does {who} make?"; return l; })
    },
    {
      id: "firstsound_001", type: "match", world: "castle", name: "First Sounds", media: "assets/img/objects/kite.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which letter does it start with?", say: "Say the word out loud. Which letter does it start with?",
      hint: "Say it slowly: the very first sound gives the letter.", praise: "Letter sounds superstar!",
      reward: { category: "alphabet" },
      levels: [
        { tier: 1, pairs: [["apple", "letter:A", "A-a-apple starts with A!"], ["banana", "letter:B", "B-b-banana starts with B!"]] },
        { tier: 2, pairs: [["cat", "letter:C", "C-c-cat starts with C!"], ["dog", "letter:D", "D-d-dog starts with D!"], ["fish", "letter:F", "F-f-fish starts with F!"]] },
        { tier: 3, pairs: [["elephant", "letter:E", "E-e-elephant starts with E!"], ["monkey", "letter:M", "M-m-monkey starts with M!"], ["rabbit", "letter:R", "R-r-rabbit starts with R!"], ["lion", "letter:L", "L-l-lion starts with L!"]] },
        { tier: 4, pairs: [["giraffe", "letter:G", "Giraffe starts with G!"], ["horse", "letter:H", "Horse starts with H!"], ["penguin", "letter:P", "Penguin starts with P!"], ["tiger", "letter:T", "Tiger starts with T!"], ["owl", "letter:O", "Owl starts with O!"]] },
        { tier: 5, decoys: ["letter:K", "letter:N"], pairs: [["zebra", "letter:Z", "Zebra starts with Z!"], ["frog", "letter:F", "Frog starts with F!"], ["cow", "letter:C", "Cow starts with C!"], ["sunflower", "letter:S", "Sunflower starts with S!"], ["eagle", "letter:E", "Eagle starts with E!"], ["airplane", "letter:A", "Airplane starts with A!"]] }
      ].map(function (l) { l.poolLabel = "Pictures"; l.targetsLabel = "Letters"; l.showLabels = false; l.missText = "Say {who} slowly. What's the very first sound?"; return l; })
    },
    {
      id: "living_001", type: "sort", world: "lab", name: "Living or Not?", media: "assets/img/flowers/sunflower.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Is it alive?", say: "Living things eat, grow and breathe. Is each one living, or not living?",
      hint: "Does it grow? Does it need food or water? Then it's alive!", praise: "Great scientist thinking!",
      targetsLabel: "Living and not living", missText: "Think about the {thing}. Does it grow and need food or water?", clueText: "Is the {thing} alive?",
      reward: { category: "science" },
      levels: [
        { tier: 1, bins: LIFE_BINS, items: sortItems(LIVING, ["cat", "car"]) },
        { tier: 2, bins: LIFE_BINS, items: sortItems(LIVING, ["cat", "car", "bee", "coin"]) },
        { tier: 3, bins: LIFE_BINS, items: sortItems(LIVING, ["sunflower", "key", "frog", "wooden_block", "fish", "crayon"]) },
        { tier: 4, bins: LIFE_BINS, items: sortItems(LIVING, ["fish", "train", "rabbit", "crayon", "butterfly", "marble", "sunflower", "coin"]) },
        { tier: 5, say: "Careful! Some things move, but they are not alive.", bins: LIFE_BINS,
          items: sortItems(LIVING, ["car", "bee", "train", "sunflower", "rubber_duck", "frog", "airplane", "fish", "key"]) }
      ]
    },
    {
      id: "legs_001", type: "sort", world: "jungle", name: "How Many Legs?", media: "assets/img/animals/penguin.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "How many legs?", say: "Count the legs! Where does each animal go?",
      hint: "Birds have two legs. Insects have six.", praise: "Leg-counting expert!",
      targetsLabel: "Number of legs", missText: "Count the {thing}'s legs again!", clueText: "How many legs does the {thing} have?",
      reward: { category: "animals" },
      levels: [
        { tier: 1, bins: LEG_BINS2, items: sortItems(LEGS, ["sparrow", "cat"]) },
        { tier: 2, bins: LEG_BINS2, items: sortItems(LEGS, ["penguin", "cow", "eagle", "dog"]) },
        { tier: 3, bins: LEG_BINS3, items: sortItems(LEGS, ["owl", "horse", "bee", "penguin", "zebra", "ladybug"]) },
        { tier: 4, bins: LEG_BINS3, items: sortItems(LEGS, ["eagle", "elephant", "butterfly", "sparrow", "giraffe", "dragonfly", "cat"]) },
        { tier: 5, say: "Count carefully! Birds have two legs, insects have six.", bins: LEG_BINS3,
          items: sortItems(LEGS, ["owl", "frog", "bee", "penguin", "lion", "ladybug", "sparrow", "dragonfly", "horse"]) }
      ]
    },
    {
      id: "missing_001", type: "missing", world: "puzzle", name: "What's Missing?", media: "assets/img/objects/glasses.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Look carefully!", say: "Look at all the things. When you're ready, tap the button and one will slip away!",
      hint: "Look at the empty space. What was there?", praise: "What a memory!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, items: ["apple", "banana", "cherry"], missing: "banana", choices: 2, why: "The banana went away!" },
        { tier: 2, items: ["apple", "banana", "orange", "grapes"], missing: "orange", choices: 3, why: "The orange rolled away!" },
        { tier: 3, items: ["rubber_duck", "coin", "key", "leaf", "apple"], missing: "key", choices: 3, why: "The key was missing!" },
        { tier: 4, items: ["strawberry", "watermelon", "carrot", "crayon", "marble", "wooden_block"], missing: "crayon", choices: 4, why: "The crayon disappeared!" },
        { tier: 5, say: "Look very carefully. This time the others move around too!",
          items: ["apple", "banana", "grapes", "cherry", "coin", "key", "leaf"], missing: "cherry", choices: 5, mix: true, why: "The cherry slipped away!" }
      ]
    },
    {
      id: "missing_002", type: "missing", world: "puzzle", name: "Who Went Away?", media: "assets/img/animals/owl.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Remember the animals!", say: "Look at the animals. When you're ready, tap the button. Someone will sneak away!",
      hint: "Look at the empty space. Who was there?", praise: "You remembered!",
      readyText: "I remember them!", askText: "Someone sneaked away! Who is missing?", missText: "That animal is still here! Who went away?",
      reward: { category: "animals" },
      levels: [
        { tier: 1, items: ["cat", "dog", "cow"], missing: "dog", choices: 2, why: "The dog went for a walk!" },
        { tier: 2, items: ["lion", "elephant", "monkey", "giraffe"], missing: "monkey", choices: 3, why: "The monkey swung away!" },
        { tier: 3, items: ["penguin", "owl", "frog", "rabbit", "fish"], missing: "owl", choices: 3, why: "The owl flew away!" },
        { tier: 4, items: ["bee", "ladybug", "butterfly", "dragonfly", "sparrow", "eagle"], missing: "butterfly", choices: 4, why: "The butterfly fluttered away!" },
        { tier: 5, say: "Look very carefully. The others swim around too!",
          items: ["dolphin", "octopus", "seahorse", "whale", "sea_turtle", "fish", "penguin"], missing: "seahorse", choices: 5, mix: true, why: "The seahorse swam away!" }
      ]
    },
    {
      id: "maze_002", type: "maze", world: "puzzle", name: "Help Momo Home", media: "assets/img/objects/build-house.svg",
      ageRange: [3, 10], difficulty: 0, goal: "home", goalName: "home",
      instruction: "Help Momo get home!", say: "Momo is tired. Help Momo find the way home!",
      hint: "Try this way!", praise: "Home sweet home!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, grid: ["S..", "##.", "G.."] },
        { tier: 2, grid: ["S.#G", ".##.", "...."] },
        { tier: 3, grid: ["S..*", "#*..", "...#", ".#.G"] },
        { tier: 4, grid: ["S..#.", "##.#.", "...*.", ".#...", ".#.#G"] },
        { tier: 5, grid: ["S.#...", ".*..#.", "...#..", "#*.#*.", "..#...", "*...#G"] }
      ]
    },
    /* ---- Change #21: nature & living world ---- */
    {
      id: "groups_001", type: "sort", world: "jungle", name: "Mammal, Bird or Insect?", media: "assets/img/animals/kangaroo.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which group?", say: "Mammals have fur. Birds have feathers. Insects have six legs. Where does each animal go?",
      hint: "Look for fur, feathers, or six legs!", praise: "You know your animal groups!",
      targetsLabel: "Animal groups", missText: "Look again! Does the {thing} have fur, feathers, or six legs?", clueText: "Which group is the {thing} in?",
      reward: { category: "animals" },
      levels: [
        { tier: 1, bins: GROUP_BINS2, items: sortItems(GROUPS, ["kangaroo", "robin"]) },
        { tier: 2, bins: GROUP_BINS2, items: sortItems(GROUPS, ["koala", "cardinal", "hippo", "puffin"]) },
        { tier: 3, bins: GROUP_BINS3, items: sortItems(GROUPS, ["bison", "pelican", "ant", "squirrel", "hummingbird", "firefly"]) },
        { tier: 4, bins: GROUP_BINS3, items: sortItems(GROUPS, ["wolf", "woodpecker", "grasshopper", "camel", "heron", "beetle", "beaver"]) },
        { tier: 5, say: "Now there are reptiles too! Reptiles have dry, scaly skin.", hint: "Fur, feathers, six legs, or scales?",
          missText: "Look again! Does the {thing} have fur, feathers, six legs, or scales?", bins: GROUP_BINS4,
          items: sortItems(GROUPS, ["walrus", "blue_jay", "mantis", "tortoise", "sea_otter", "iguana", "robin", "ant", "gecko"]) }
      ]
    },
    {
      id: "fruitodd_001", type: "oddOneOut", world: "village", name: "Which Is Not a Fruit?", media: "assets/img/fruits/pomegranate.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which one is not a fruit?", say: "Fruits grow from flowers and hold seeds. Which one is not a fruit?",
      hint: "Which one would you not find in a fruit bowl?", praise: "Fruit expert!",
      reward: { category: "nature" },
      levels: [
        { tier: 1, items: ["pear", "plum", "sunflower"], answer: "sunflower", why: "A sunflower is a flower. Pears and plums are fruits!" },
        { tier: 2, items: ["kiwi", "blueberry", "lemon", "tulip"], answer: "tulip", why: "A tulip is a flower, not a fruit!" },
        { tier: 3, items: ["pomegranate", "coconut", "pear", "plum", "photo:carrot"], answer: "photo:carrot", why: "A carrot is a vegetable. It grows under the ground!" },
        { tier: 4, items: ["plum", "pear", "coconut", "blueberry", "fern"], answer: "fern", why: "A fern is a plant with leaves, but it never grows fruit!" },
        { tier: 5, say: "Careful! One of these is yellow like a lemon, but it's not a fruit.",
          items: ["lemon", "pear", "banana", "pineapple", "dandelion"], answer: "dandelion", why: "A dandelion is a yellow flower. The others are fruits!" }
      ]
    },
    {
      id: "missing_003", type: "missing", world: "village", name: "What's Missing in the Garden?", media: "assets/img/flowers/poppy.jpg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Remember the garden!", say: "Look at the flowers and fruits. When you're ready, tap the button and one will go away!",
      hint: "Look at the empty space. What was growing there?", praise: "What a garden memory!",
      reward: { category: "flowers" },
      levels: [
        { tier: 1, items: ["rose", "sunflower", "tulip"], missing: "tulip", choices: 2, why: "The tulip was picked!" },
        { tier: 2, items: ["orchid", "dandelion", "lavender", "poppy"], missing: "poppy", choices: 3, why: "The poppy was picked!" },
        { tier: 3, items: ["iris", "rose", "pear", "lemon", "daisy"], missing: "lemon", choices: 3, why: "The lemon was picked!" },
        { tier: 4, items: ["kiwi", "plum", "orchid", "lavender", "blueberry", "sunflower"], missing: "orchid", choices: 4, why: "The orchid was picked!" },
        { tier: 5, say: "Look very carefully. This time the others move around too!",
          items: ["pomegranate", "coconut", "iris", "dandelion", "poppy", "pear", "tulip"], missing: "iris", choices: 5, mix: true, why: "The iris was picked!" }
      ]
    },
    /* ---- Change #22: Solar System & space (Kido's own planet drawings, js/art/puzzleArt.js) ---- */
    {
      id: "planetmatch_001", type: "match", world: "space", name: "Match the Planets", media: "assets/img/space/planet-jupiter.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Match the planets!", say: "Take each planet to the one that looks just the same!",
      hint: "Look at the colours, the stripes and the rings.", praise: "Planet-matching star!",
      targetsLabel: "Planets", poolLabel: "Planets to match", missText: "Look again! Which one looks like {who}?",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, pairs: PLANET_TWINS(["earth", "saturn"]) },
        { tier: 2, pairs: PLANET_TWINS(["mars", "jupiter", "earth"]) },
        { tier: 3, instruction: "Match each planet to its name!", say: "Take each planet to its name card!", hint: "Say the name. Which card says it?",
          missText: "That card has a different name. Where does {who} go?", targetsLabel: "Names", showLabels: false, pairs: PLANET_NAMES(["earth", "mars", "saturn"]) },
        { tier: 4, instruction: "Match each planet to its name!", say: "Take each planet to its name card!", hint: "Say the name. Which card says it?",
          missText: "That card has a different name. Where does {who} go?", targetsLabel: "Names", showLabels: false, pairs: PLANET_NAMES(["mercury", "venus", "jupiter", "uranus"]) },
        { tier: 5, instruction: "Match each planet to its name!", say: "Take each planet to its name card!", hint: "Say the name. Which card says it?",
          missText: "That card has a different name. Where does {who} go?", targetsLabel: "Names", showLabels: false, pairs: PLANET_NAMES(["venus", "uranus", "neptune", "mercury", "saturn"]) }
      ]
    },
    {
      id: "planetorder_001", type: "sequence", world: "space", name: "Planets in Order", media: "assets/img/space/planet-mercury.svg",
      ageRange: [4, 10], difficulty: 0,
      instruction: "Put them in order!", say: "Put the planets in order, starting with the one closest to the Sun!",
      hint: "Mercury is closest to the Sun. Then Venus, then our Earth.", praise: "You know the way across the Solar System!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, mode: "order", missFirst: "Which planet is closest to the Sun?", order: PLANETS_FROM_SUN(3) },
        { tier: 2, mode: "order", missFirst: "Which planet is closest to the Sun?", order: PLANETS_FROM_SUN(4) },
        { tier: 3, mode: "order", missFirst: "Which planet is closest to the Sun?", order: PLANETS_FROM_SUN(5) },
        { tier: 4, mode: "order", missFirst: "Which planet is closest to the Sun?", order: PLANETS_FROM_SUN(6) },
        { tier: 5, mode: "order", say: "All eight planets! Put them in order, from the closest to the Sun to the farthest.",
          missFirst: "Which planet is closest to the Sun?", order: PLANETS_FROM_SUN(8) }
      ]
    },
    {
      id: "orbit_001", type: "sequence", world: "space", name: "Earth's Trip Around the Sun", media: "assets/img/space/planet-earth.svg",
      ageRange: [4, 10], difficulty: 0,
      instruction: "Where will Earth go next?", say: "Earth travels around the Sun, always the same way. Where will it be next?",
      hint: "Earth keeps moving the same way around the Sun.", praise: "You followed Earth all the way around the Sun!",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, mode: "next", shown: ["orbit:1", "orbit:3"], options: ["orbit:5", "orbit:2"], answer: "orbit:5" },
        { tier: 2, mode: "next", shown: ["orbit:1", "orbit:2", "orbit:3"], options: ["orbit:4", "orbit:8", "orbit:1"], answer: "orbit:4" },
        { tier: 3, mode: "next", shown: ["orbit:2", "orbit:4", "orbit:6"], options: ["orbit:8", "orbit:7", "orbit:3"], answer: "orbit:8" },
        { tier: 4, mode: "order", instruction: "Put Earth's trip in order!", say: "Tap the pictures in order. Start with Earth below the Sun, then follow its path!",
          missFirst: "Start with Earth right below the Sun!", order: ["orbit:1", "orbit:3", "orbit:5", "orbit:7"] },
        { tier: 5, mode: "order", instruction: "Put Earth's trip in order!", say: "One trip around the Sun takes a whole year. Put Earth's trip in order, starting below the Sun!",
          missFirst: "Start with Earth right below the Sun!", order: ["orbit:1", "orbit:2", "orbit:3", "orbit:4", "orbit:5", "orbit:6"] }
      ]
    },
    {
      id: "spacemissing_001", type: "missing", world: "space", name: "What's Missing in Space?", media: "assets/img/space/planet-neptune.svg",
      ageRange: [3, 10], difficulty: 0,
      instruction: "Remember the planets!", say: "Look at the planets. When you're ready, tap the button and one will drift away!",
      hint: "Look at the empty space. Which planet was there?", praise: "What a space memory!",
      readyText: "I remember them!", askText: "One drifted away! Which one is missing?", missText: "That one is still here! Which one drifted away?",
      reward: { category: "oddoneout" },
      levels: [
        { tier: 1, items: ["planet:sun", "planet:earth", "planet:saturn"], missing: "planet:earth", choices: 2, why: "Earth drifted away!" },
        { tier: 2, items: ["planet:mercury", "planet:mars", "planet:jupiter", "planet:neptune"], missing: "planet:jupiter", choices: 3, why: "Jupiter drifted away!" },
        { tier: 3, items: ["planet:venus", "planet:earth", "planet:saturn", "planet:uranus", "planet:sun"], missing: "planet:saturn", choices: 3, why: "Saturn drifted away!" },
        { tier: 4, items: ["planet:mercury", "planet:venus", "planet:earth", "planet:mars", "planet:jupiter", "planet:neptune"], missing: "planet:mars", choices: 4, why: "Mars drifted away!" },
        { tier: 5, say: "Look very carefully. This time the others move around too!",
          items: ["planet:sun", "planet:mercury", "planet:venus", "planet:jupiter", "planet:saturn", "planet:uranus", "planet:neptune"], missing: "planet:uranus", choices: 5, mix: true, why: "Uranus drifted away!" }
      ]
    },
    /* ---- Change #23: Mystery of the Lost Treasure (story-only; drawings in js/art/puzzleArt.js) ---- */
    {
      id: "treasuremap_001", type: "match", world: "puzzle", name: "Mend the Map", storyOnly: true,
      ageRange: [3, 10], difficulty: 0,
      instruction: "Mend the map!", say: "The map is torn! Take each piece to the place where it fits.",
      hint: "Look at the shape. Which piece looks the same?", praise: "The map is whole again!",
      targetsLabel: "Map", poolLabel: "Torn pieces", missText: "That piece doesn't fit there. Look at its shape!",
      reward: { category: "stories" },
      levels: [
        { tier: 1, pairs: MAP_TWINS(["palm", "cave"]) },
        { tier: 2, pairs: MAP_TWINS(["palm", "rock", "cave"]) },
        { tier: 3, instruction: "Match each piece to the map!", say: "The map shows each place with brown lines. Take each piece to its drawing on the map!",
          hint: "Look at the outline. Which piece has the same shape?", showLabels: false, pairs: MAP_INK(["palm", "bridge", "cave"]) },
        { tier: 4, instruction: "Match each piece to the map!", say: "The map shows each place with brown lines. Take each piece to its drawing on the map!",
          hint: "Look at the outline. Which piece has the same shape?", showLabels: false, pairs: MAP_INK(["palm", "rock", "bridge", "cave"]) },
        { tier: 5, instruction: "Match each piece to the map!", say: "Five pieces! Match each one to its drawing on the map.",
          hint: "Look at the outline. Which piece has the same shape?", showLabels: false, pairs: MAP_INK(["palm", "rock", "bridge", "cave", "hut"]) }
      ]
    },
    {
      id: "treasurepath_001", type: "sequence", world: "puzzle", name: "Follow the Map", storyOnly: true,
      ageRange: [5, 10], difficulty: 0,
      instruction: "Follow the map!", say: "The map's red path goes: palm tree, big rock, bridge, and then the cave. Put the stops in order!",
      hint: "Start at the palm tree, like the red path on the map.", praise: "You followed the map!",
      reward: { category: "stories" },
      levels: [
        { tier: 1, mode: "next", say: "The red path goes: palm tree, big rock, then the bridge. What comes after the big rock?",
          shown: ["land:palm", "land:rock"], options: ["land:bridge", "land:hut"], answer: "land:bridge" },
        { tier: 2, mode: "next", say: "The red path goes: palm tree, big rock, bridge, then the cave. What comes after the bridge?",
          shown: ["land:palm", "land:rock", "land:bridge"], options: ["land:cave", "land:hut", "land:boat"], answer: "land:cave" },
        { tier: 3, mode: "order", missFirst: "Where does the red path start?", order: ["land:palm", "land:rock", "land:bridge"] },
        { tier: 4, mode: "order", missFirst: "Where does the red path start?", order: ["land:palm", "land:rock", "land:bridge", "land:cave"] },
        { tier: 5, mode: "order", say: "The red path starts at the boat. Then the palm tree, the big rock, the bridge, and the cave. Put all five in order!",
          missFirst: "Where does the red path start?", order: ["land:boat", "land:palm", "land:rock", "land:bridge", "land:cave"] }
      ]
    },
    {
      id: "treasurelock_001", type: "pattern", world: "puzzle", name: "The Secret Lock", storyOnly: true,
      ageRange: [3, 10], difficulty: 0,
      instruction: "Finish the secret code!", say: "The lock uses the secret signs in a pattern. Which sign comes next?",
      hint: "Say the signs out loud. Find the part that repeats!", praise: "Click! The lock is open!",
      reward: { category: "stories" },
      levels: [
        { tier: 1, seq: ["sign:star", "sign:moon", "sign:star", "sign:moon", "?"], options: ["sign:star", "sign:sun"], answer: "sign:star", unit: 2 },
        { tier: 2, seq: ["sign:star", "sign:moon", "sign:star", "sign:moon", "sign:star", "?"], options: ["sign:moon", "sign:star", "sign:sun"], answer: "sign:moon", unit: 2 },
        { tier: 3, seq: ["sign:star", "sign:moon", "sign:sun", "sign:star", "sign:moon", "?"], options: ["sign:sun", "sign:star", "sign:moon"], answer: "sign:sun", unit: 3 },
        { tier: 4, seq: ["sign:star", "sign:star", "sign:moon", "sign:star", "sign:star", "?"], options: ["sign:moon", "sign:star", "sign:sun", "sign:shell"], answer: "sign:moon", unit: 3 },
        { tier: 5, seq: ["sign:sun", "sign:moon", "sign:moon", "sign:star", "sign:sun", "sign:moon", "sign:moon", "?"],
          options: ["sign:star", "sign:sun", "sign:moon", "sign:heart", "sign:shell"], answer: "sign:star", unit: 4 }
      ]
    },
    {
      // Used inside "The Lost Little Bird" story (storyOnly: not in the Thinking Stone rotation or lists).
      id: "footprints_001", type: "match", world: "jungle", name: "Whose Footprints?", storyOnly: true,
      ageRange: [4, 7], difficulty: 0,
      instruction: "Which footprints are Tiko's?", say: "Take Tiko to the footprints that belong to a little bird!",
      hint: "Look at the toes. Birds have thin, pointy toes.", praise: "Yes! Those are bird footprints!",
      reward: { category: "stories" },
      levels: [
        { tier: 1, pairs: FOOTPRINT_PAIR, decoys: ["track:cat"], labels: TRACK_LABELS, showLabels: false, poolLabel: "Tiko", targetsLabel: "Footprints", missText: "Hmm, those are too big and round for a little bird. Try another!" },
        { tier: 2, pairs: FOOTPRINT_PAIR, decoys: ["track:cat", "track:deer"], labels: TRACK_LABELS, showLabels: false, poolLabel: "Tiko", targetsLabel: "Footprints", missText: "Hmm, a little bird doesn't have feet like that. Try another!" },
        { tier: 4, pairs: FOOTPRINT_PAIR, decoys: ["track:cat", "track:deer", "track:duck"], labels: TRACK_LABELS, showLabels: false, poolLabel: "Tiko", targetsLabel: "Footprints", missText: "Close! Tiko has thin toes, not wide or round feet. Try another!" }
      ]
    },
    /* ---- Change #17A: story-only puzzles, each launched by its story (not in the Thinking Stone rotation) ---- */
    {
      // "The Lost Puppy": Biscuit follows his paw prints home (he walks the maze himself).
      id: "pawprints_001", type: "maze", world: "castle", name: "Follow the Paw Prints", storyOnly: true,
      ageRange: [3, 9], difficulty: 0, hero: "rig:puppy", heroName: "Biscuit", goal: "home", goalName: "his home",
      instruction: "Help Biscuit find the way home!", say: "Follow the paw prints! Help Biscuit find the way home, around the bushes and rocks.",
      hint: "Try this way!", praise: "Biscuit found the way home!",
      reward: { category: "stories" },
      levels: [
        { tier: 1, grid: ["S.*", "*..", "*#G"] },
        { tier: 2, grid: ["S.#.", "*...", "#*.G"] },
        { tier: 3, grid: ["S..*", "#*..", "...#", "*#.G"] },
        { tier: 4, grid: ["S.#..", ".*.*.", "...#.", "#*...", "..#*G"] },
        { tier: 5, grid: ["S.#...", ".*..*.", "..#*..", "#...#.", ".*#...", "...*#G"] }
      ]
    },
    {
      // "The Tidy Room": Sam's socks are all mixed up — find each sock's partner.
      id: "socks_001", type: "match", world: "castle", name: "Match the Socks", storyOnly: true,
      ageRange: [3, 9], difficulty: 0,
      instruction: "Find each sock's partner!", say: "Socks come in pairs! Take each sock to the one that looks the same.",
      hint: "Look at the colour and the pattern.", praise: "Every sock found its partner!",
      reward: { category: "stories" },
      levels: [
        sockLevel(1, ["stripes", "dots"]),
        sockLevel(2, ["stripes", "dots", "stars"]),
        sockLevel(3, ["stripes", "dots", "stars"], ["sock:plain"]),
        sockLevel(4, ["stripes", "dots", "stars", "hearts"], ["sock:zigzag"]),
        sockLevel(5, ["stripes", "dots", "stars", "hearts", "spots"], ["sock:zigzag"])
      ]
    },
    {
      // "The Little Explorer": trail markers make a pattern that shows the way up the hill.
      id: "trailmarks_001", type: "pattern", world: "castle", name: "Follow the Trail Markers", storyOnly: true,
      ageRange: [3, 10], difficulty: 0,
      instruction: "Which flag comes next?", say: "Explorers follow trail markers! The flags make a pattern. Which flag comes next?",
      hint: "Say the colours out loud. Find the part that repeats!", praise: "You found the trail!",
      reward: { category: "stories" },
      levels: [
        { tier: 1, seq: ["flag:red", "flag:blue", "flag:red", "flag:blue", "?"], options: ["flag:red", "flag:blue"], answer: "flag:red", unit: 2 },
        { tier: 2, seq: ["flag:red", "flag:blue", "flag:red", "flag:blue", "flag:red", "?"], options: ["flag:blue", "flag:red", "flag:yellow"], answer: "flag:blue", unit: 2 },
        { tier: 3, seq: ["flag:red", "flag:red", "flag:blue", "flag:red", "flag:red", "?"], options: ["flag:blue", "flag:red", "flag:yellow"], answer: "flag:blue", unit: 3 },
        { tier: 4, seq: ["flag:red", "flag:blue", "flag:yellow", "flag:red", "flag:blue", "?"], options: ["flag:yellow", "flag:red", "flag:blue", "flag:green"], answer: "flag:yellow", unit: 3 },
        { tier: 5, seq: ["flag:green", "flag:yellow", "flag:yellow", "flag:blue", "flag:green", "flag:yellow", "flag:yellow", "?"], options: ["flag:blue", "flag:green", "flag:yellow", "flag:red"], answer: "flag:blue", unit: 4 }
      ]
    },
    {
      // "The Magic Garden": Leo's seed grows — what comes next?
      id: "seedgrow_001", type: "sequence", world: "castle", name: "Watch the Seed Grow", storyOnly: true,
      ageRange: [3, 10], difficulty: 0,
      instruction: "What grows next?", say: "Leo's seed is growing! What comes next?",
      hint: "Each one is a little bigger than the one before.", praise: "That's how a tiny seed grows into a flower!",
      reward: { category: "stories" },
      levels: [
        { tier: 1, mode: "next", shown: ["plant:1", "plant:2"], options: ["plant:3", "plant:1"], answer: "plant:3" },
        { tier: 2, mode: "next", shown: ["plant:1", "plant:2", "plant:3"], options: ["plant:4", "plant:1", "plant:2"], answer: "plant:4" },
        { tier: 3, mode: "next", shown: ["plant:2", "plant:3", "plant:4"], options: ["plant:5", "plant:1", "plant:3"], answer: "plant:5" },
        { tier: 4, mode: "order", instruction: "Put them in order!", say: "Tap them in order, from Leo's tiny seed to the biggest plant!", order: ["plant:1", "plant:2", "plant:3", "plant:4"] },
        { tier: 5, mode: "order", instruction: "Put them in order!", say: "Tap them in order, from Leo's tiny seed to the flower!", order: ["plant:1", "plant:2", "plant:3", "plant:4", "plant:5"] }
      ]
    }
  ];

  var byId = {};
  PUZZLES.forEach(function (p) { p.activityId = "puzzle-" + p.id.replace(/_/g, "-"); byId[p.id] = p; byId[p.activityId] = p; });

  // Stand-alone puzzles (catalog activities, Thinking Stone rotation); storyOnly ones are launched by stories.
  function standalone() { return PUZZLES.filter(function (p) { return !p.storyOnly; }); }

  Kido.puzzles = {
    ART: ART,
    list: function () { return standalone(); },
    all: function () { return PUZZLES.slice(); },
    get: function (idOrActivity) { return byId[idOrActivity] || null; },
    activityIds: function () { return standalone().map(function (p) { return p.activityId; }); },
    /** What the Thinking Stone offers. With the adaptive layer: a varied, suitable pick
        (rotates puzzles and types; see Kido.Learning.pickPuzzle). Without it: the first
        unsolved puzzle, else the one played longest ago. */
    next: function () {
      if (Kido.Learning) { var pick = Kido.Learning.pickPuzzle(); if (pick) return pick; }
      var P = Kido.progress, done = P.get("completed") || {};
      var fresh = standalone().filter(function (p) { return !done[p.activityId]; });
      if (fresh.length) return fresh[0].activityId;
      return standalone().sort(function (a, b) { return String(done[a.activityId].lastISO).localeCompare(String(done[b.activityId].lastISO)); })[0].activityId;
    },
    /** The puzzle after this one (the result screen's "next" button) — a different one. */
    after: function (activityId) {
      if (Kido.Learning) { var pick = Kido.Learning.pickPuzzle({ exclude: [activityId] }); if (pick) return pick; }
      var ids = this.activityIds(), i = ids.indexOf(activityId);
      return ids[(i + 1) % ids.length];
    }
  };
})(window);
