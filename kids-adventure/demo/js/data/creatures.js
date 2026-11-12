/* =========================================================================
   creatures.js — Kido Creature Asset Registry
   ONE manifest-driven home for every animal & bird in the app: art (original
   SVG now, drop-in raster/photo later), metadata (name, group, baby, diet,
   habitat), sound key and visual states. Games call Kido.creatures.render(key)
   instead of hard-coding an emoji, so richer assets can replace any species
   later with ZERO changes at the call sites.

     Kido.creatures.render(key, {state,silhouette,className}) -> HTML string
     Kido.creatures.get(key)   -> {key,group,name,baby,emoji,tint,diet,habitat,moves}
     Kido.creatures.setArt(key, svgStringOrFn)                -> register art
     Kido.creatures.hasArt(key) / .art(key) / .emoji(key) / .list(group)

   Raster-ready: give a record an `img` and render() emits <img> instead of
   inline SVG — the games never change. This is the swap-in path for licensed
   illustrations or photos later (see docs/ASSET-LICENSE-MANIFEST.md).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var REG = {};      // canonical key -> record
  var ART = {};      // canonical key -> svg string | fn
  var ALIAS = {};    // alt key -> canonical key

  var EMOJI_TO_KEY = {
    // Flowers
    "🌹": "rose", "🌻": "sunflower", "🌷": "tulip", "🌺": "hibiscus",
    "🪷": "lotus", "🌼": "daisy", "🌸": "cherry", "🏵️": "marigold", "🏵": "marigold",
    "⚜️": "lily", "⚜": "lily", "💐": "bouquet",
    // Animals
    "🦁": "lion", "🐘": "elephant", "🐅": "tiger", "🐕": "dog", "🐶": "dog",
    "🐈": "cat", "🐱": "cat", "🐒": "monkey", "🐵": "monkey", "🐄": "cow", "🐮": "cow",
    "🦒": "giraffe", "🦓": "zebra", "🐎": "horse", "🐴": "horse", "🐼": "panda",
    "🐇": "rabbit", "🐰": "rabbit", "🐑": "sheep", "🐖": "pig", "🐷": "pig",
    "🦏": "rhino", "🦆": "duck", "🐤": "duck", "🐍": "snake", "🐸": "frog",
    "🦜": "parrot", "🐊": "crocodile", "🐐": "goat", "🐻": "bear", "🐔": "hen",
    "🐥": "hen", "🦊": "fox", "🦌": "deer", "🐓": "rooster",
    // Birds
    "🐧": "penguin", "🐦": "sparrow", "🦢": "swan", "🦚": "peacock",
    "🦉": "owl", "🦩": "flamingo", "🦅": "eagle",
    // Vehicles
    "🚗": "car", "🚌": "bus", "🚑": "ambulance", "🚒": "firetruck",
    "🚓": "police", "🚲": "bicycle", "🏍️": "motorcycle", "🏍": "motorcycle",
    "🚜": "tractor", "🚆": "train", "✈️": "airplane", "✈": "airplane",
    "🚁": "helicopter", "🚢": "ship", "🚀": "rocket", "🚚": "truck", "🚕": "taxi",
    "🚙": "suv", "🚐": "van", "⛵": "ship",
    // Fruits (Realistic 3D Models)
    "🍎": "apple", "🍏": "apple", "🍌": "banana", "🍊": "orange", "🍓": "strawberry",
    "🍉": "watermelon", "🍇": "grapes", "🥭": "mango", "🍍": "pineapple", "🍒": "cherry",
    "🥕": "carrot",
    // Shapes (2D & 3D)
    "⭕": "circle", "🟦": "square", "🔺": "triangle", "▬": "rectangle",
    "⭐": "star", "❤️": "heart", "🔷": "diamond", "🥚": "oval",
    "⬟": "pentagon", "⬡": "hexagon", "⏢": "trapezium",
    "🧊": "cube", "🌐": "sphere", "⛺": "pyramid", "🥫": "cylinder",
    // 3D Realistic Body Parts
    "👀": "eyes", "👂": "ears", "👃": "nose", "👄": "mouth",
    "✋": "hand", "🦶": "foot", "💇": "hair", "🦷": "teeth",
    "🧠": "head", "🫃": "tummy", "🧒": "boy",
    // 3D Realistic Objects
    "🧶": "yarn", "🪷": "lotus", "🪁": "kite", "🍅": "tomato",
    "☂️": "umbrella", "🦋": "butterfly", "🐟": "fish", "🐠": "tropical_fish", "🐡": "pufferfish", "⚽": "ball",
    "👓": "glasses", "🎋": "sugarcane", "🫘": "tamarind", "🪴": "flowerpot",
    "🎹": "xylophone", "🐜": "ant", "🍦": "icecream", "🫗": "jug", "🪺": "nest",
    "👑": "queen", "🥁": "drum", "🚐": "van", "⌚": "watch", "🪀": "yoyo",
    "🍄": "mushroom"
  };

  function canon(k) { return (k && (ALIAS[k] || EMOJI_TO_KEY[k])) || k; }

  function define(key, def) {
    key = canon(key);
    var r = REG[key] || (REG[key] = { key: key });
    for (var p in def) if (def.hasOwnProperty(p)) r[p] = def[p];
    if (r.emoji) EMOJI_TO_KEY[r.emoji] = key;
    return r;
  }
  function alias(from, to) { ALIAS[from] = to; }
  function setArt(key, svg) { ART[canon(key)] = svg; }
  var SHADOW = {};                                       // side-view outlines for the shadow games, where the art is a face
  function setShadow(key, svg) { SHADOW[canon(key)] = svg; }
  /** The animal's drawing for the shadow games: the whole-body view when there is one, else its art; "" if none.
      Card and shadow both use it, so they always share the same outline (photos can't be cut into shadows). */
  function drawing(key) {
    var c = canon(key);
    if (CUTOUT.indexOf(c) >= 0) return '<img class="creature-sil" src="assets/img/cutouts/' + c + '.webp" alt="" draggable="false"/>';
    return SHADOW[c] || art(key);
  }
  /* 2026-11-03: real photos cut out of their background (scripts/make-cutouts.py, rembg). The card shows the photo
     cut-out and the shadow is the same picture darkened, so a child matches a real animal to its real outline. */
  var CUTOUT = ("fish tropical_fish pufferfish goldfish dog cat elephant tiger rabbit frog sheep duck zebra rhino sparrow pigeon owl swan penguin crow cardinal blue_jay heron pelican " +
    "horse monkey fox snake parrot eagle peacock flamingo cow hen rooster deer giraffe bear goat panda pig crocodile").split(" ");
  function hasArt(key) {
    var c = canon(key);
    return !!(REG[c] && REG[c].img) || !!ART[c];
  }
  function art(key) { var a = ART[canon(key)]; return typeof a === "function" ? a() : (a || ""); }
  function get(key) { return REG[canon(key)] || null; }
  function has(key) { return !!REG[canon(key)]; }
  function emoji(key) { var r = get(key); return (r && r.emoji) || "❓"; }
  function sound(key) { var r = get(key); return (r && r.sound) || canon(key); }
  function group(key) { var r = get(key); return (r && r.group) || "animals"; }
  function list(grp) { return Object.keys(REG).filter(function (k) { return !grp || REG[k].group === grp; }); }

  /* renderCreature — the ONE helper every game uses.
     Priority: real photo img -> inline SVG art -> honest emoji. */
  function render(key, opts) {
    opts = opts || {};
    var r = get(key) || {};
    var cls = "kido-creature"
      + (opts.silhouette ? " is-silhouette" : "")
      + (opts.state ? " is-" + opts.state : "")
      + (opts.className ? " " + opts.className : "");
    var inner;
    if (r.img) {
      inner = '<img class="creature-img" src="' + r.img + '" alt="' + (r.name || canon(key)) + '" draggable="false"/>';
    } else if (hasArt(key)) {
      inner = art(key);
    } else {
      inner = '<span class="creature-emoji">' + emoji(key) + '</span>';
    }
    return '<span class="' + cls + '" data-creature="' + canon(key) + '" role="img" aria-label="'
      + (r.name || canon(key)) + '">' + inner + '</span>';
  }

  /* Change #28: a true animal-shaped shadow for the shadow games: the authored vector art, darkened; never a
     darkened photo rectangle. (2026-10-29: the PNG silhouettes cut from the old photos of unknown origin were
     retired with those photos; the new photos have real backgrounds, so they cannot be cut automatically.) */
  var SIL = [];
  function silhouette(key) {
    var k = SIL.indexOf(key) >= 0 ? key : canon(key);
    var inner = drawing(key) ? drawing(key) : SIL.indexOf(k) >= 0
      ? '<img class="creature-sil" src="assets/img/silhouettes/' + k + '.png" alt="" draggable="false"/>'
      : (hasArt(key) ? art(key) : '<span class="creature-emoji">' + emoji(key) + '</span>');
    return '<span class="kido-creature is-silhouette" data-creature="' + canon(key) + '" role="img" aria-label="Mystery animal shadow">' + inner + '</span>';
  }

  // crocodile is the spec's name; the content library calls it "alligator".
  alias("alligator", "crocodile");
  alias("plane", "airplane");
  alias("fire_truck", "firetruck");
  alias("cherries", "cherry");
  alias("apples", "apple");
  alias("bananas", "banana");
  alias("oranges", "orange");
  alias("strawberries", "strawberry");
  alias("pineapples", "pineapple");
  alias("mangoes", "mango");
  alias("carrots", "carrot");
  alias("trapezoid", "trapezium");
  alias("tripezium", "trapezium");
  alias("cylindrical", "cylinder");
  alias("cylinder_shape", "cylinder");
  alias("cubes", "cube");
  alias("spheres", "sphere");
  alias("pyramids", "pyramid");
  alias("cones", "cone");
  alias("cylinders", "cylinder");
  alias("clownfish", "fish");
  alias("blue_tang", "tropical_fish");
  alias("tang", "tropical_fish");
  alias("blowfish", "pufferfish");

  // ---- Seed metadata from the existing content library (name/emoji/baby) ----
  function seed() {
    var c = Kido.content || {};
    (c.animals || []).forEach(function (a) { define(a.key, { group: "animals", name: a.name, emoji: a.emoji, baby: a.baby }); });
    (c.birds || []).forEach(function (b) { define(b.key, { group: "birds", name: b.name, emoji: b.emoji }); });
    (c.flowers || []).forEach(function (f) { define(f.key, { group: "flowers", name: f.name, emoji: f.emoji }); });
    (c.vehicles || []).forEach(function (v) { define(v.key, { group: "vehicles", name: v.name, emoji: v.emoji }); });
    (c.fruits || []).forEach(function (fr) { define(fr.key, { group: "fruits", name: fr.name, emoji: fr.emoji, img: fr.img, taste: fr.taste, color: fr.color, funFact: fr.funFact }); });
    (c.shapes || []).forEach(function (sh) { define(sh.key, { group: "shapes", name: sh.name, emoji: sh.emoji, img: sh.img, fact: sh.fact }); });
    (c.body || []).forEach(function (b) { define(b.key, { group: "body", name: b.name, emoji: b.emoji, img: b.img, fact: b.fact }); });
  }

  Kido.creatures = {
    define: define, alias: alias, setArt: setArt, setShadow: setShadow, drawing: drawing, seed: seed,
    get: get, has: has, hasArt: hasArt, art: art,
    emoji: emoji, sound: sound, group: group, list: list, render: render, silhouette: silhouette,
    keyForEmoji: function (em) { return EMOJI_TO_KEY[em] || null; },
    _reg: REG
  };

  // content.js is loaded just before this file; seed immediately.
  seed();

  // ---- Real photographic portraits (ultra-crisp, child-friendly studio portraits) ----
  var REAL_PHOTOS = {
    lion:     "assets/img/animals/lion.jpg",
    elephant: "assets/img/animals/elephant.jpg",
    tiger:    "assets/img/animals/tiger.jpg",
    dog:      "assets/img/animals/dog.jpg",
    cat:      "assets/img/animals/cat.jpg",
    monkey:   "assets/img/animals/monkey.jpg",
    cow:      "assets/img/animals/cow.jpg",
    giraffe:  "assets/img/animals/giraffe.jpg",
    zebra:    "assets/img/animals/zebra.jpg",
    horse:    "assets/img/animals/horse.jpg",
    panda:    "assets/img/animals/panda.jpg",
    rabbit:   "assets/img/animals/rabbit.jpg",
    sheep:    "assets/img/animals/sheep.jpg",
    pig:      "assets/img/animals/pig.jpg",
    rhino:    "assets/img/animals/rhino.jpg",
    duck:     "assets/img/animals/duck.jpg",
    snake:    "assets/img/animals/snake.jpg",
    frog:     "assets/img/animals/frog.jpg",
    parrot:   "assets/img/animals/parrot.jpg",
    alligator:"assets/img/animals/alligator.jpg",
    crocodile:"assets/img/animals/crocodile.jpg",
    goat:     "assets/img/animals/goat.jpg",
    bear:     "assets/img/animals/bear.jpg",
    hen:      "assets/img/animals/hen.jpg",
    fox:      "assets/img/animals/fox.jpg",
    deer:     "assets/img/animals/deer.jpg",
    rooster:  "assets/img/animals/rooster.jpg",
    penguin:  "assets/img/animals/penguin.jpg",
    sparrow:  "assets/img/animals/sparrow.jpg",
    swan:     "assets/img/animals/swan.jpg",
    peacock:  "assets/img/animals/peacock.jpg",
    owl:      "assets/img/animals/owl.jpg",
    flamingo: "assets/img/animals/flamingo.jpg",
    crow:     "assets/img/animals/crow.jpg",
    eagle:    "assets/img/animals/eagle.jpg",
    pigeon:   "assets/img/animals/pigeon.jpg",
    // Flowers
    rose:     "assets/img/flowers/rose.jpg",
    sunflower:"assets/img/flowers/sunflower.jpg",
    tulip:    "assets/img/flowers/tulip.jpg",
    hibiscus: "assets/img/flowers/hibiscus.jpg",
    lotus:    "assets/img/flowers/lotus.jpg",
    daisy:    "assets/img/flowers/daisy.jpg",
    blossom:  "assets/img/flowers/blossom.jpg",
    marigold: "assets/img/flowers/marigold.jpg",
    lily:     "assets/img/flowers/lily.jpg",
    bouquet:  "assets/img/flowers/bouquet.jpg",
    // Vehicles
    car:        "assets/img/vehicles/car.jpg",
    suv:        "assets/img/vehicles/suv.jpg",
    van:        "assets/img/vehicles/van.jpg",
    bus:        "assets/img/vehicles/bus.jpg",
    ambulance:  "assets/img/vehicles/ambulance.jpg",
    firetruck:  "assets/img/vehicles/firetruck.jpg",
    police:     "assets/img/vehicles/police.jpg",
    bicycle:    "assets/img/vehicles/bicycle.jpg",
    motorcycle: "assets/img/vehicles/motorcycle.jpg",
    tractor:    "assets/img/vehicles/tractor.jpg",
    train:      "assets/img/vehicles/train.jpg",
    airplane:   "assets/img/vehicles/airplane.jpg",
    helicopter: "assets/img/vehicles/helicopter.jpg",
    ship:       "assets/img/vehicles/ship.jpg",
    rocket:     "assets/img/vehicles/rocket.jpg",
    truck:      "assets/img/vehicles/truck.jpg",
    taxi:       "assets/img/vehicles/taxi.jpg",
    // 3D Photorealistic Fruits
    apple:      "assets/img/fruits/art/apple.svg",
    banana:     "assets/img/fruits/art/banana.svg",
    orange:     "assets/img/fruits/art/orange.svg",
    strawberry: "assets/img/fruits/art/strawberry.svg",
    watermelon: "assets/img/fruits/art/watermelon.svg",
    grapes:     "assets/img/fruits/art/grapes.svg",
    mango:      "assets/img/fruits/art/mango.svg",
    pineapple:  "assets/img/fruits/art/pineapple.svg",
    cherry:     "assets/img/fruits/art/cherry.svg",
    carrot:     "assets/img/fruits/art/carrot.svg",
    // 2D Shapes (Plane Shapes)
    circle:     "assets/img/shapes/circle.svg",
    square:     "assets/img/shapes/square.svg",
    triangle:   "assets/img/shapes/triangle.svg",
    rectangle:  "assets/img/shapes/rectangle.svg",
    star:       "assets/img/shapes/star.svg",
    heart:      "assets/img/shapes/heart.svg",
    diamond:    "assets/img/shapes/diamond.svg",
    oval:       "assets/img/shapes/oval.svg",
    pentagon:   "assets/img/shapes/pentagon.svg",
    hexagon:    "assets/img/shapes/hexagon.svg",
    trapezium:  "assets/img/shapes/trapezium.svg",
    // 3D Shapes (Solid Shapes)
    cube:       "assets/img/shapes/cube.svg",
    sphere:     "assets/img/shapes/sphere.svg",
    pyramid:    "assets/img/shapes/pyramid.svg",
    cone:       "assets/img/shapes/cone.svg",
    cylinder:   "assets/img/shapes/cylinder.svg",
    // Body parts use Chiku's photos (js/data/chiku.js). Keep only "boy" (the Hindi "लड़का" word).
    boy:        "assets/img/body/boy.svg",
    // 3D Realistic Objects (Varnamala & Alphabet)
    yarn:       "assets/img/objects/yarn.svg",
    lotus:      "assets/img/flowers/lotus.jpg",
    kite:       "assets/img/objects/kite.svg",
    tomato:     "assets/img/objects/tomato.svg",
    umbrella:   "assets/img/objects/umbrella.jpg",
    butterfly:  "assets/img/objects/butterfly.svg",
    fish:          "assets/img/animals/fish.jpg",
    tropical_fish: "assets/img/animals/tropical_fish.jpg",
    pufferfish:    "assets/img/animals/pufferfish.jpg",
    goldfish:      "assets/img/animals/goldfish.jpg",
    pomegranate:"assets/img/objects/pomegranate.jpg",
    glasses:    "assets/img/objects/glasses.svg",
    tamarind:   "assets/img/objects/tamarind.svg",
    sugarcane:  "assets/img/objects/sugarcane.svg",
    ball:       "assets/img/objects/ball.svg",
    flowerpot:  "assets/img/objects/flowerpot.svg",
    xylophone:  "assets/img/objects/xylophone.jpg",
    ant:        "assets/img/objects/ant.svg",
    icecream:   "assets/img/objects/icecream.svg",
    jug:        "assets/img/objects/jug.svg",
    nest:       "assets/img/objects/nest.svg",
    queen:      "assets/img/objects/queen.svg",
    drum:       "assets/img/objects/drum.svg",
    van:        "assets/img/vehicles/van.jpg",
    watch:      "assets/img/objects/watch.svg",
    yoyo:       "assets/img/objects/yo-yo.svg",
    mushroom:   "assets/img/objects/mushroom.jpg"
  };
  Object.keys(REAL_PHOTOS).forEach(function (k) { define(k, { img: REAL_PHOTOS[k] }); });
  define("suv", { group: "vehicles", name: "SUV", emoji: "🚙", img: "assets/img/vehicles/suv.jpg" });
  define("van", { group: "vehicles", name: "Van", emoji: "🚐", img: "assets/img/vehicles/van.jpg" });
  define("mushroom", { group: "objects", name: "Mushroom", emoji: "🍄", img: "assets/img/objects/mushroom.jpg" });
  define("fish", { group: "animals", name: "Fish", emoji: "🐟", img: "assets/img/animals/fish.jpg" });
  define("tropical_fish", { group: "animals", name: "Tropical Fish", emoji: "🐠", img: "assets/img/animals/tropical_fish.jpg" });
  define("pufferfish", { group: "animals", name: "Pufferfish", emoji: "🐡", img: "assets/img/animals/pufferfish.jpg" });
  define("goldfish", { group: "animals", name: "Goldfish", emoji: "🐟", img: "assets/img/animals/goldfish.jpg" });

  // ---- Richer metadata (tint/diet/habitat) for the discovery-first species ----
  var META = {
    lion: { tint: "#D6941F", diet: "meat", habitat: "grasslands" },
    elephant: { tint: "#8C99A6", diet: "leaves & grass", habitat: "savanna" },
    tiger: { tint: "#EE7E1E", diet: "meat", habitat: "forests" },
    monkey: { tint: "#9A6A34", diet: "fruit", habitat: "jungle" },
    giraffe: { tint: "#D9A63A", diet: "leaves", habitat: "savanna" },
    zebra: { tint: "#3B3835", diet: "grass", habitat: "grasslands" },
    rhino: { tint: "#8A929E", diet: "grass", habitat: "savanna" },
    crocodile: { group: "animals", name: "Crocodile", emoji: "🐊", baby: "a hatchling", tint: "#5B7A52", diet: "meat", habitat: "rivers" },
    frog: { tint: "#5CB53C", diet: "bugs", habitat: "ponds" },
    snake: { tint: "#46A164", diet: "small animals", habitat: "forests" },
    parrot: { group: "birds", tint: "#2C9E4F", diet: "seeds & fruit", habitat: "rainforest" },
    peacock: { group: "birds", tint: "#1E7A8C", diet: "seeds & bugs", habitat: "forests" },
    eagle: { group: "birds", tint: "#6B4A2B", diet: "meat", habitat: "mountains" },
    owl: { group: "birds", tint: "#8A6A43", diet: "small animals", habitat: "woods" },
    sparrow: { group: "birds", tint: "#9C7A4E", diet: "seeds", habitat: "towns" },
    crow: { group: "birds", tint: "#2E2B33", diet: "almost anything", habitat: "towns" },
    pigeon: { group: "birds", tint: "#8892A6", diet: "seeds", habitat: "cities" },
    duck: { group: "birds", tint: "#3E8FCC", diet: "plants & bugs", habitat: "ponds" },
    flamingo: { group: "birds", tint: "#F07CA0", diet: "tiny shrimp", habitat: "lakes" },
    penguin: { group: "birds", tint: "#2B3140", diet: "fish", habitat: "icy shores" }
  };
  Object.keys(META).forEach(function (k) { define(k, META[k]); });

  // ---- Change #13: sea & garden species (public-domain photos — docs/ASSET-LICENSE-MANIFEST.md §6) ----
  // Kept out of Kido.content.animals on purpose: those lists feed the animal SOUND games, and most of
  // these animals make no sound a child would know. They star in discoveries, puzzles and stories.
  // No emoji: an emoji here would re-map that emoji in existing games (counting, memory, Hindi words).
  var MORE = {
    dolphin:     { name: "Dolphin", baby: "a calf", tint: "#4F7FA6", diet: "fish and squid", habitat: "the ocean", moves: "swims and leaps" },
    whale:       { name: "Humpback Whale", baby: "a calf", tint: "#2D4C7A", diet: "krill and small fish", habitat: "the ocean", moves: "swims" },
    whale_shark: { name: "Whale Shark", baby: "a pup", tint: "#2F6FB8", diet: "plankton", habitat: "warm seas", moves: "swims" },
    octopus:     { name: "Octopus", baby: "a hatchling", tint: "#D9906B", diet: "crabs and clams", habitat: "the sea floor", moves: "crawls and jets" },
    sea_turtle:  { name: "Sea Turtle", baby: "a hatchling", tint: "#3E7F6A", diet: "sea grass", habitat: "warm seas", moves: "swims" },
    seahorse:    { name: "Seahorse", baby: "a fry", tint: "#B5543A", diet: "tiny shrimp", habitat: "sea grass and reefs", moves: "swims upright" },
    bee:         { name: "Honey Bee", baby: "a larva", tint: "#D9A12B", diet: "nectar and pollen", habitat: "hives and gardens", moves: "flies" },
    ladybug:     { name: "Ladybug", baby: "a larva", tint: "#E0614A", diet: "tiny bugs called aphids", habitat: "gardens", moves: "crawls and flies" },
    dragonfly:   { name: "Dragonfly", baby: "a nymph", tint: "#C98A2E", diet: "mosquitoes and flies", habitat: "ponds", moves: "flies" },
    monarch:     { name: "Monarch Butterfly", baby: "a caterpillar", tint: "#E8822A", diet: "flower nectar", habitat: "fields of flowers", moves: "flies" },
    chameleon:   { name: "Chameleon", baby: "a hatchling", tint: "#5E9A4A", diet: "insects", habitat: "trees", moves: "climbs" }
  };
  Object.keys(MORE).forEach(function (k) {
    var d = MORE[k]; d.group = "animals"; d.img = "assets/img/animals/" + k + ".jpg";
    define(k, d);
  });
  alias("humpback_whale", "whale");
  alias("honey_bee", "bee");
  alias("monarch_butterfly", "monarch");

  // ---- Change #21: nature & living world (public-domain / CC0 photos — docs/ASSET-LICENSE-MANIFEST.md §12) ----
  // Same rule as Change #13: no emoji (it would re-map that emoji in older games). Birds with a real
  // recording also join Kido.content.birds; the rest star in discoveries, puzzles and the find games.
  var NATURE = {
    // mammals
    bison:     { name: "Bison", baby: "a calf", tint: "#6B4A2E", diet: "grass", habitat: "grassy plains", moves: "walks and runs" },
    wolf:      { name: "Wolf", baby: "a pup", tint: "#7C7468", diet: "meat", habitat: "forests and mountains", moves: "runs" },
    kangaroo:  { name: "Kangaroo", baby: "a joey", tint: "#B08A62", diet: "grass", habitat: "the grasslands of Australia", moves: "hops" },
    koala:     { name: "Koala", baby: "a joey", tint: "#8E8A88", diet: "eucalyptus leaves", habitat: "eucalyptus forests", moves: "climbs" },
    hippo:     { name: "Hippopotamus", baby: "a calf", tint: "#7E6A6A", diet: "grass", habitat: "African rivers", moves: "walks and swims" },
    moose:     { name: "Moose", baby: "a calf", tint: "#4A3A2C", diet: "leaves and water plants", habitat: "northern forests", moves: "walks and swims" },
    beaver:    { name: "Beaver", baby: "a kit", tint: "#7A5232", diet: "bark and leaves", habitat: "rivers and ponds", moves: "swims" },
    squirrel:  { name: "Squirrel", baby: "a kit", tint: "#A0683A", diet: "nuts and seeds", habitat: "trees and parks", moves: "climbs and leaps" },
    camel:     { name: "Camel", baby: "a calf", tint: "#C89A5E", diet: "desert plants", habitat: "deserts", moves: "walks" },
    // birds
    robin:       { group: "birds", name: "Robin", baby: "a chick", tint: "#C85A2A", diet: "worms and berries", habitat: "gardens and lawns", moves: "hops and flies" },
    woodpecker:  { group: "birds", name: "Woodpecker", baby: "a chick", tint: "#3A3A3A", diet: "bugs in tree bark", habitat: "woods", moves: "climbs and flies" },
    hummingbird: { group: "birds", name: "Hummingbird", baby: "a chick", tint: "#3E8E5A", diet: "flower nectar", habitat: "gardens", moves: "hovers" },
    pelican:     { group: "birds", name: "Pelican", baby: "a chick", tint: "#8A7A66", diet: "fish", habitat: "coasts and lakes", moves: "flies and swims" },
    puffin:      { group: "birds", name: "Puffin", baby: "a puffling", tint: "#E8622A", diet: "small fish", habitat: "rocky sea cliffs", moves: "swims and flies" },
    cardinal:    { group: "birds", name: "Cardinal", baby: "a chick", tint: "#D02A2A", diet: "seeds and berries", habitat: "gardens and woods", moves: "flies" },
    blue_jay:    { group: "birds", name: "Blue Jay", baby: "a chick", tint: "#3A6EC8", diet: "acorns and seeds", habitat: "woods", moves: "flies" },
    heron:       { group: "birds", name: "Heron", baby: "a chick", tint: "#6A82A0", diet: "fish and frogs", habitat: "marshes and ponds", moves: "wades and flies" },
    // ocean
    sea_otter: { name: "Sea Otter", baby: "a pup", tint: "#6A5240", diet: "clams and sea urchins", habitat: "the ocean near the coast", moves: "swims" },
    starfish:  { name: "Starfish", baby: "a larva", tint: "#E8822A", diet: "clams and mussels", habitat: "the rocky sea floor", moves: "crawls on tiny tube feet" },
    jellyfish: { name: "Jellyfish", baby: "a polyp", tint: "#7FB8E8", diet: "tiny plankton", habitat: "the ocean", moves: "drifts and pulses" },
    crab:      { name: "Crab", baby: "a larva", tint: "#D84A2A", diet: "algae and tiny animals", habitat: "beaches and rocky shores", moves: "walks sideways" },
    shark:     { name: "Shark", baby: "a pup", tint: "#5A7A9A", diet: "fish", habitat: "the ocean", moves: "swims" },
    seal:      { name: "Seal", baby: "a pup", tint: "#7A7A72", diet: "fish", habitat: "rocky coasts", moves: "swims" },
    manta_ray: { name: "Manta Ray", baby: "a pup", tint: "#2A4A6A", diet: "plankton", habitat: "warm seas", moves: "glides" },
    clownfish: { name: "Clownfish", baby: "a fry", tint: "#F07A2A", diet: "tiny animals and algae", habitat: "coral reefs", moves: "swims" },
    walrus:    { name: "Walrus", baby: "a calf", tint: "#8A5A42", diet: "clams", habitat: "icy Arctic seas", moves: "swims" },
    // insects
    ant:         { name: "Ant", baby: "a larva", tint: "#C2541E", diet: "seeds and sweet food", habitat: "nests underground", moves: "walks" },
    grasshopper: { name: "Grasshopper", baby: "a nymph", tint: "#7A8A4A", diet: "grass and leaves", habitat: "grassy fields", moves: "hops" },
    beetle:      { name: "Beetle", baby: "a larva", tint: "#2A2A2A", diet: "plants and small bugs", habitat: "almost everywhere", moves: "crawls and flies" },
    mantis:      { name: "Praying Mantis", baby: "a nymph", tint: "#9A7A4A", diet: "insects", habitat: "gardens", moves: "crawls" },
    caterpillar: { name: "Caterpillar", baby: "an egg", tint: "#3A3A2A", diet: "milkweed leaves", habitat: "gardens and fields", moves: "crawls" },
    firefly:     { name: "Firefly", baby: "a larva", tint: "#5A5A2A", diet: "flower nectar", habitat: "fields and woods", moves: "flies" },
    // reptiles
    tortoise:  { name: "Tortoise", baby: "a hatchling", tint: "#8A7A5A", diet: "plants", habitat: "deserts", moves: "walks slowly" },
    iguana:    { name: "Iguana", baby: "a hatchling", tint: "#6A8A4A", diet: "leaves and fruit", habitat: "rainforest trees", moves: "climbs and swims" },
    gecko:     { name: "Leopard Gecko", baby: "a hatchling", tint: "#C8A44A", diet: "insects", habitat: "deserts", moves: "crawls" },
    lizard:    { name: "Horned Lizard", baby: "a hatchling", tint: "#9A8A6A", diet: "ants", habitat: "dry, sandy places", moves: "crawls" },
    turtle:    { name: "Painted Turtle", baby: "a hatchling", tint: "#3A4A2A", diet: "plants and small animals", habitat: "ponds", moves: "swims and crawls" }
  };
  Object.keys(NATURE).forEach(function (k) {
    var d = NATURE[k]; d.group = d.group || "animals"; d.img = "assets/img/animals/" + k + ".jpg";
    define(k, d);
  });
  [["orchid", "Orchid"], ["dandelion", "Dandelion"], ["lavender", "Lavender"], ["poppy", "Poppy"], ["iris", "Iris"], ["fern", "Fern"]].forEach(function (f) {
    define(f[0], { group: "flowers", name: f[1], img: "assets/img/flowers/" + f[0] + ".jpg" });
  });
  alias("sea_star", "starfish");
  alias("hippopotamus", "hippo");
  alias("praying_mantis", "mantis");

  // ---- 2026-11-08: ocean, fresh-water and land animals (Commons photos — docs/ASSET-LICENSE-MANIFEST.md §25) ----
  // Same rule as above: no emoji. `home` (ocean | fresh | land) drives "Where Do I Live?"; `fact` is said on the boards.
  var HOMES = {
    orca:       { name: "Orca", baby: "a calf", home: "ocean", diet: "fish and seals", habitat: "the ocean", moves: "swims", fact: "Orcas are also called killer whales. They live in family groups called pods." },
    sea_lion:   { name: "Sea Lion", baby: "a pup", home: "ocean", diet: "fish", habitat: "rocky coasts", moves: "swims", fact: "Sea lions bark loudly and walk on land with their big flippers." },
    squid:      { name: "Squid", baby: "a hatchling", home: "ocean", diet: "small fish and shrimp", habitat: "the ocean", moves: "swims", fact: "A squid has ten arms and squirts ink to hide." },
    lobster:    { name: "Lobster", baby: "a larva", home: "ocean", diet: "clams and small animals", habitat: "the sea floor", moves: "walks", fact: "A lobster has two big claws and walks along the sea floor." },
    sea_urchin: { name: "Sea Urchin", baby: "a larva", home: "ocean", diet: "seaweed", habitat: "rocky sea floors", moves: "crawls", fact: "A sea urchin is covered in sharp spines." },
    shrimp:     { name: "Shrimp", baby: "a larva", home: "ocean", diet: "tiny bits of food", habitat: "coral reefs", moves: "swims", fact: "This little shrimp cleans fish by eating bits off their skin!" },
    moray_eel:  { name: "Moray Eel", baby: "a larva", home: "ocean", diet: "fish", habitat: "coral reefs", moves: "swims", fact: "A moray eel hides in rocky holes on the reef." },
    otter:      { name: "Otter", baby: "a pup", home: "fresh", diet: "fish", habitat: "rivers", moves: "swims", fact: "Otters swim in rivers and feel for fish with their whiskers." },
    catfish:    { name: "Catfish", baby: "a fry", home: "fresh", diet: "small animals", habitat: "rivers", moves: "swims", fact: "A catfish has long whiskers, just like a cat!" },
    salmon:     { name: "Salmon", baby: "a fry", home: "fresh", diet: "insects and small fish", habitat: "rivers and the sea", moves: "swims and leaps", fact: "Salmon swim up rivers and can even jump up waterfalls!" },
    platypus:   { name: "Platypus", baby: "a puggle", home: "fresh", diet: "worms and shrimp", habitat: "rivers in Australia", moves: "swims", fact: "A platypus has a bill like a duck and lays eggs!" },
    capybara:   { name: "Capybara", baby: "a pup", home: "fresh", diet: "grass and water plants", habitat: "rivers and swamps", moves: "swims and walks", fact: "The capybara is the biggest rodent in the world, and it loves to swim." },
    axolotl:    { name: "Axolotl", baby: "a larva", home: "fresh", diet: "worms and insects", habitat: "lakes", moves: "swims", fact: "An axolotl can grow back a lost leg!" },
    stingray:   { name: "River Stingray", baby: "a pup", home: "fresh", diet: "snails and small fish", habitat: "rivers", moves: "glides", fact: "This stingray lives in rivers and glides along the bottom like a flat pancake." },
    leopard:    { name: "Leopard", baby: "a cub", home: "land", diet: "meat", habitat: "forests and grasslands", moves: "runs and climbs", fact: "A leopard has spots and can climb trees." },
    cheetah:    { name: "Cheetah", baby: "a cub", home: "land", diet: "meat", habitat: "grasslands", moves: "runs", fact: "The cheetah is the fastest runner on land!" },
    gorilla:    { name: "Gorilla", baby: "an infant", home: "land", diet: "leaves and fruit", habitat: "forests", moves: "walks on its knuckles", fact: "Gorillas are gentle giants that eat leaves and fruit." },
    polar_bear: { name: "Polar Bear", baby: "a cub", home: "land", diet: "seals", habitat: "the icy Arctic", moves: "walks and swims", fact: "A polar bear has thick white fur to stay warm in the snow." },
    sloth:      { name: "Sloth", baby: "a baby", home: "land", diet: "leaves", habitat: "rainforest trees", moves: "climbs very slowly", fact: "A sloth moves very slowly and hangs in the trees." },
    hedgehog:   { name: "Hedgehog", baby: "a hoglet", home: "land", diet: "insects and worms", habitat: "gardens and woods", moves: "walks", fact: "A hedgehog rolls into a spiky ball to stay safe." },
    raccoon:    { name: "Raccoon", baby: "a kit", home: "land", diet: "almost anything", habitat: "woods and towns", moves: "walks and climbs", fact: "A raccoon has a black mask around its eyes and clever little hands." },
    donkey:     { name: "Donkey", baby: "a foal", home: "land", diet: "grass and hay", habitat: "farms", moves: "walks", fact: "A donkey says hee-haw and can carry heavy loads." },
    buffalo:    { name: "Water Buffalo", baby: "a calf", diet: "grass", habitat: "farms and wet fields", moves: "walks and wallows", fact: "A water buffalo loves to cool off in mud and water." },
    red_panda:  { name: "Red Panda", baby: "a cub", home: "land", diet: "bamboo", habitat: "mountain forests", moves: "climbs", fact: "A red panda has a long stripy tail and loves to eat bamboo." },
    porcupine:  { name: "Porcupine", baby: "a porcupette", home: "land", diet: "roots and bark", habitat: "forests and rocky hills", moves: "walks", fact: "A porcupine is covered in long sharp quills." },
    kingfisher: { group: "birds", name: "Kingfisher", baby: "a chick", home: "fresh", diet: "fish", habitat: "rivers and ponds", moves: "dives and flies", fact: "A kingfisher dives into the water to catch fish." },
    ostrich:    { group: "birds", name: "Ostrich", baby: "a chick", home: "land", diet: "plants and seeds", habitat: "dry grasslands", moves: "runs", fact: "The ostrich is the biggest bird. It cannot fly, but it runs very fast!" }
  };
  Object.keys(HOMES).forEach(function (k) {
    var d = HOMES[k]; d.group = d.group || "animals"; d.img = "assets/img/animals/" + k + ".jpg";
    define(k, d);
  });
  // Animals already in the app, by where they live (for "Where Do I Live?" and the home boards).
  var HOME_OF = {
    ocean: ["dolphin", "whale", "whale_shark", "octopus", "sea_turtle", "seahorse", "starfish", "jellyfish", "crab", "shark", "seal", "manta_ray", "clownfish", "walrus", "sea_otter", "pufferfish"],
    fresh: ["beaver", "hippo", "frog", "turtle", "goldfish", "crocodile", "heron"],
    land: ["lion", "elephant", "tiger", "giraffe", "zebra", "rhino", "monkey", "kangaroo", "koala", "camel", "wolf", "bear", "deer", "squirrel", "horse", "cow", "panda", "fox", "rabbit"]
  };
  Object.keys(HOME_OF).forEach(function (h) { HOME_OF[h].forEach(function (k) { if (REG[k] && !REG[k].home) REG[k].home = h; }); });
  Kido.creatures.byHome = function (home) {
    return Object.keys(REG).filter(function (k) { return REG[k].home === home && Kido.creatures.hasArt(k); });
  };
  [["jasmine", "Jasmine"], ["daffodil", "Daffodil"], ["carnation", "Carnation"], ["dahlia", "Dahlia"], ["chrysanthemum", "Chrysanthemum"],
   ["bougainvillea", "Bougainvillea"], ["peony", "Peony"], ["pansy", "Pansy"], ["frangipani", "Frangipani"], ["zinnia", "Zinnia"]].forEach(function (f) {
    define(f[0], { group: "flowers", name: f[1], img: "assets/img/flowers/" + f[0] + ".jpg" });
  });
  [["scooter", "Scooter"], ["auto_rickshaw", "Auto Rickshaw"], ["school_bus", "School Bus"], ["garbage_truck", "Garbage Truck"], ["excavator", "Excavator"],
   ["bulldozer", "Bulldozer"], ["cement_mixer", "Cement Mixer"], ["crane", "Crane"], ["tram", "Tram"], ["metro", "Metro Train"], ["sailboat", "Sailboat"],
   ["submarine", "Submarine"], ["hot_air_balloon", "Hot Air Balloon"]].forEach(function (v) {
    define(v[0], { group: "vehicles", name: v[1], img: "assets/img/vehicles/" + v[0] + ".jpg" });
  });
  alias("metro_train", "metro");
  alias("garbage_lorry", "garbage_truck");
})(window);
