/* =========================================================================
   content.js — Demo content library (all original text; emoji stand in for
   original illustrations that a designer/artist would replace).
   Kept as plain data so a CMS or backend can supply it later.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  Kido.content = {

    /* A–Z with multiple representative objects + 3D assets for each letter. */
    alphabet: [
      {
        L: "A", word: "Apple", emoji: "🍎", key: "apple", img: "assets/img/fruits/art/apple.svg",
        words: [
          { word: "Apple", emoji: "🍎", key: "apple", img: "assets/img/fruits/art/apple.svg" },
          { word: "Ant", emoji: "🐜", key: "ant", img: "assets/img/objects/ant.svg" },
          { word: "Airplane", emoji: "✈️", key: "airplane", img: "assets/img/vehicles/airplane.jpg" }
        ]
      },
      {
        L: "B", word: "Ball", emoji: "⚽", key: "ball", img: "assets/img/objects/ball.svg",
        words: [
          { word: "Ball", emoji: "⚽", key: "ball", img: "assets/img/objects/ball.svg" },
          { word: "Banana", emoji: "🍌", key: "banana", img: "assets/img/fruits/art/banana.svg" },
          { word: "Butterfly", emoji: "🦋", key: "butterfly", img: "assets/img/objects/butterfly.svg" },
          { word: "Bear", emoji: "🐻", key: "bear", img: "assets/img/animals/bear.jpg" }
        ]
      },
      {
        L: "C", word: "Cat", emoji: "🐈", key: "cat", img: "assets/img/animals/cat.jpg",
        words: [
          { word: "Cat", emoji: "🐈", key: "cat", img: "assets/img/animals/cat.jpg" },
          { word: "Cherry", emoji: "🍒", key: "cherry", img: "assets/img/fruits/art/cherry.svg" },
          { word: "Car", emoji: "🚗", key: "car", img: "assets/img/vehicles/car.jpg" },
          { word: "Cow", emoji: "🐄", key: "cow", img: "assets/img/animals/cow.jpg" }
        ]
      },
      {
        L: "D", word: "Dog", emoji: "🐕", key: "dog", img: "assets/img/animals/dog.jpg",
        words: [
          { word: "Dog", emoji: "🐕", key: "dog", img: "assets/img/animals/dog.jpg" },
          { word: "Drum", emoji: "🥁", key: "drum", img: "assets/img/objects/drum.svg" },
          { word: "Duck", emoji: "🦆", key: "duck", img: "assets/img/animals/duck.jpg" },
          { word: "Deer", emoji: "🦌", key: "deer", img: "assets/img/animals/deer.jpg" }
        ]
      },
      {
        L: "E", word: "Elephant", emoji: "🐘", key: "elephant", img: "assets/img/animals/elephant.jpg",
        words: [
          { word: "Elephant", emoji: "🐘", key: "elephant", img: "assets/img/animals/elephant.jpg" },
          { word: "Eagle", emoji: "🦅", key: "eagle", img: "assets/img/birds/eagle.jpg" }
        ]
      },
      {
        L: "F", word: "Fish", emoji: "🐟", key: "fish", img: "assets/img/animals/fish.jpg",
        words: [
          { word: "Fish", emoji: "🐟", key: "fish", img: "assets/img/animals/fish.jpg" },
          { word: "Flamingo", emoji: "🦩", key: "flamingo", img: "assets/img/birds/flamingo.jpg" },
          { word: "Fox", emoji: "🦊", key: "fox", img: "assets/img/animals/fox.jpg" },
          { word: "Frog", emoji: "🐸", key: "frog", img: "assets/img/animals/frog.jpg" }
        ]
      },
      {
        L: "G", word: "Grapes", emoji: "🍇", key: "grapes", img: "assets/img/fruits/art/grapes.svg",
        words: [
          { word: "Grapes", emoji: "🍇", key: "grapes", img: "assets/img/fruits/art/grapes.svg" },
          { word: "Giraffe", emoji: "🦒", key: "giraffe", img: "assets/img/animals/giraffe.jpg" },
          { word: "Goat", emoji: "🐐", key: "goat", img: "assets/img/animals/goat.jpg" }
        ]
      },
      {
        L: "H", word: "Horse", emoji: "🐎", key: "horse", img: "assets/img/animals/horse.jpg",
        words: [
          { word: "Horse", emoji: "🐎", key: "horse", img: "assets/img/animals/horse.jpg" },
          { word: "Hen", emoji: "🐔", key: "hen", img: "assets/img/animals/hen.jpg" },
          { word: "Helicopter", emoji: "🚁", key: "helicopter", img: "assets/img/vehicles/helicopter.jpg" }
        ]
      },
      {
        L: "I", word: "Ice cream", emoji: "🍦", key: "icecream", img: "assets/img/objects/icecream.svg",
        words: [
          { word: "Ice cream", emoji: "🍦", key: "icecream", img: "assets/img/objects/icecream.svg" }
        ]
      },
      {
        L: "J", word: "Jug", emoji: "🫗", key: "jug", img: "assets/img/objects/jug.svg",
        words: [
          { word: "Jug", emoji: "🫗", key: "jug", img: "assets/img/objects/jug.svg" }
        ]
      },
      {
        L: "K", word: "Kite", emoji: "🪁", key: "kite", img: "assets/img/objects/kite.svg",
        words: [
          { word: "Kite", emoji: "🪁", key: "kite", img: "assets/img/objects/kite.svg" }
        ]
      },
      {
        L: "L", word: "Lion", emoji: "🦁", key: "lion", img: "assets/img/animals/lion.jpg",
        words: [
          { word: "Lion", emoji: "🦁", key: "lion", img: "assets/img/animals/lion.jpg" },
          { word: "Lotus", emoji: "🪷", key: "lotus", img: "assets/img/flowers/lotus.jpg" }
        ]
      },
      {
        L: "M", word: "Mango", emoji: "🥭", key: "mango", img: "assets/img/fruits/art/mango.svg",
        words: [
          { word: "Mango", emoji: "🥭", key: "mango", img: "assets/img/fruits/art/mango.svg" },
          { word: "Monkey", emoji: "🐒", key: "monkey", img: "assets/img/animals/monkey.jpg" },
          { word: "Motorcycle", emoji: "🏍️", key: "motorcycle", img: "assets/img/vehicles/motorcycle.jpg" }
        ]
      },
      {
        L: "N", word: "Nest", emoji: "🪺", key: "nest", img: "assets/img/objects/nest.svg",
        words: [
          { word: "Nest", emoji: "🪺", key: "nest", img: "assets/img/objects/nest.svg" }
        ]
      },
      {
        L: "O", word: "Orange", emoji: "🍊", key: "orange", img: "assets/img/fruits/art/orange.svg",
        words: [
          { word: "Orange", emoji: "🍊", key: "orange", img: "assets/img/fruits/art/orange.svg" },
          { word: "Owl", emoji: "🦉", key: "owl", img: "assets/img/birds/owl.jpg" }
        ]
      },
      {
        L: "P", word: "Pineapple", emoji: "🍍", key: "pineapple", img: "assets/img/fruits/art/pineapple.svg",
        words: [
          { word: "Pineapple", emoji: "🍍", key: "pineapple", img: "assets/img/fruits/art/pineapple.svg" },
          { word: "Pomegranate", emoji: "🍎", key: "pomegranate", img: "assets/img/objects/pomegranate.jpg" },
          { word: "Peacock", emoji: "🦚", key: "peacock", img: "assets/img/birds/peacock.jpg" },
          { word: "Panda", emoji: "🐼", key: "panda", img: "assets/img/animals/panda.jpg" },
          { word: "Parrot", emoji: "🦜", key: "parrot", img: "assets/img/animals/parrot.jpg" },
          { word: "Penguin", emoji: "🐧", key: "penguin", img: "assets/img/birds/penguin.jpg" }
        ]
      },
      {
        L: "Q", word: "Queen", emoji: "👑", key: "queen", img: "assets/img/objects/queen.svg",
        words: [
          { word: "Queen", emoji: "👑", key: "queen", img: "assets/img/objects/queen.svg" }
        ]
      },
      {
        L: "R", word: "Rabbit", emoji: "🐇", key: "rabbit", img: "assets/img/animals/rabbit.jpg",
        words: [
          { word: "Rabbit", emoji: "🐇", key: "rabbit", img: "assets/img/animals/rabbit.jpg" },
          { word: "Rose", emoji: "🌹", key: "rose", img: "assets/img/flowers/rose.jpg" },
          { word: "Rocket", emoji: "🚀", key: "rocket", img: "assets/img/vehicles/rocket.jpg" },
          { word: "Rooster", emoji: "🐓", key: "rooster", img: "assets/img/animals/rooster.jpg" }
        ]
      },
      {
        L: "S", word: "Strawberry", emoji: "🍓", key: "strawberry", img: "assets/img/fruits/art/strawberry.svg",
        words: [
          { word: "Strawberry", emoji: "🍓", key: "strawberry", img: "assets/img/fruits/art/strawberry.svg" },
          { word: "Sunflower", emoji: "🌻", key: "sunflower", img: "assets/img/flowers/sunflower.jpg" },
          { word: "Swan", emoji: "🦢", key: "swan", img: "assets/img/birds/swan.jpg" },
          { word: "Sheep", emoji: "🐑", key: "sheep", img: "assets/img/animals/sheep.jpg" }
        ]
      },
      {
        L: "T", word: "Tomato", emoji: "🍅", key: "tomato", img: "assets/img/objects/tomato.svg",
        words: [
          { word: "Tomato", emoji: "🍅", key: "tomato", img: "assets/img/objects/tomato.svg" },
          { word: "Tiger", emoji: "🐅", key: "tiger", img: "assets/img/animals/tiger.jpg" },
          { word: "Train", emoji: "🚆", key: "train", img: "assets/img/vehicles/train.jpg" },
          { word: "Tractor", emoji: "🚜", key: "tractor", img: "assets/img/vehicles/tractor.jpg" }
        ]
      },
      {
        L: "U", word: "Umbrella", emoji: "☂️", key: "umbrella", img: "assets/img/objects/umbrella.jpg",
        words: [
          { word: "Umbrella", emoji: "☂️", key: "umbrella", img: "assets/img/objects/umbrella.jpg" }
        ]
      },
      {
        L: "V", word: "Van", emoji: "🚐", key: "van", img: "assets/img/vehicles/van.jpg",
        words: [
          { word: "Van", emoji: "🚐", key: "van", img: "assets/img/vehicles/van.jpg" }
        ]
      },
      {
        L: "W", word: "Watermelon", emoji: "🍉", key: "watermelon", img: "assets/img/fruits/art/watermelon.svg",
        words: [
          { word: "Watermelon", emoji: "🍉", key: "watermelon", img: "assets/img/fruits/art/watermelon.svg" },
          { word: "Watch", emoji: "⌚", key: "watch", img: "assets/img/objects/watch.svg" }
        ]
      },
      {
        L: "X", word: "Xylophone", emoji: "🎹", key: "xylophone", img: "assets/img/objects/xylophone.jpg",
        words: [
          { word: "Xylophone", emoji: "🎹", key: "xylophone", img: "assets/img/objects/xylophone.jpg" }
        ]
      },
      {
        L: "Y", word: "Yarn", emoji: "🧶", key: "yarn", img: "assets/img/objects/yarn.svg",
        words: [
          { word: "Yarn", emoji: "🧶", key: "yarn", img: "assets/img/objects/yarn.svg" },
          { word: "Yo-yo", emoji: "🪀", key: "yoyo", img: "assets/img/objects/yo-yo.svg" }
        ]
      },
      {
        L: "Z", word: "Zebra", emoji: "🦓", key: "zebra", img: "assets/img/animals/zebra.jpg",
        words: [
          { word: "Zebra", emoji: "🦓", key: "zebra", img: "assets/img/animals/zebra.jpg" }
        ]
      }
    ],

    /* Number → object emoji used for counting/matching. */
    counters: ["🍎", "🍓", "🐟", "⭐", "🎈", "🐞", "🌼", "🍪"],

    animals: [
      { key: "fish", name: "Fish", emoji: "🐟" },
      { key: "tropical_fish", name: "Tropical Fish", emoji: "🐠" },
      { key: "pufferfish", name: "Pufferfish", emoji: "🐡" },
      { key: "goldfish", name: "Goldfish", emoji: "🐟" },
      { key: "dog", name: "Dog", emoji: "🐕", baby: "Puppy", babyEmoji: "🐶", adultImg: "assets/img/animals/adults/dog.jpg" },
      { key: "cat", name: "Cat", emoji: "🐈", baby: "Kitten", babyEmoji: "🐱", adultImg: "assets/img/animals/adults/cat.jpg" },
      { key: "cow", name: "Cow", emoji: "🐄", baby: "Calf", babyEmoji: "🐮", adultImg: "assets/img/animals/adults/cow.jpg" },
      { key: "lion", name: "Lion", emoji: "🦁", baby: "Cub", babyEmoji: "🐾", adultImg: "assets/img/animals/adults/lion.jpg" },
      { key: "elephant", name: "Elephant", emoji: "🐘", baby: "Calf", babyEmoji: "🐘", adultImg: "assets/img/animals/adults/elephant.jpg" },
      { key: "tiger", name: "Tiger", emoji: "🐅", baby: "Cub", babyEmoji: "🐯", adultImg: "assets/img/animals/adults/tiger.jpg" },
      { key: "horse", name: "Horse", emoji: "🐎", baby: "Foal", babyEmoji: "🐴", adultImg: "assets/img/animals/adults/horse.jpg" },
      { key: "monkey", name: "Monkey", emoji: "🐒", baby: "Baby", babyEmoji: "🐵", adultImg: "assets/img/animals/adults/monkey.jpg" },
      { key: "panda", name: "Panda", emoji: "🐼", baby: "Cub", babyEmoji: "🐾", adultImg: "assets/img/animals/adults/panda.jpg" },
      { key: "bear", name: "Bear", emoji: "🐻", baby: "Cub", babyEmoji: "🐾", adultImg: "assets/img/animals/adults/bear.jpg" },
      { key: "rabbit", name: "Rabbit", emoji: "🐇", baby: "Kit", babyEmoji: "🐰", adultImg: "assets/img/animals/adults/rabbit.jpg" },
      // adultPortrait: Kido's only photo of this species is an adult, so Animal Babies shows its babyImg instead
      // (snake has none yet: it sits out of Animal Babies; "Hatchling" is taught by the young alligator).
      { key: "frog", name: "Frog", emoji: "🐸", baby: "Tadpole", babyEmoji: "🐸", adultPortrait: true, babyImg: "assets/img/animals/babies/tadpole.jpg" },
      { key: "goat", name: "Goat", emoji: "🐐", baby: "Kid", babyEmoji: "🐐", adultImg: "assets/img/animals/adults/goat.jpg" },
      { key: "sheep", name: "Sheep", emoji: "🐑", baby: "Lamb", babyEmoji: "🐑", adultImg: "assets/img/animals/adults/sheep.jpg" },
      { key: "duck", name: "Duck", emoji: "🦆", baby: "Duckling", babyEmoji: "🐤", adultPortrait: true, babyImg: "assets/img/animals/babies/duckling.jpg" },
      // babyFlip (Change #28): mirror the baby photo so it faces the same way as its mother's photo (hen faces left)
      { key: "hen", name: "Hen", emoji: "🐔", baby: "Chick", babyEmoji: "🐥", adultPortrait: true, babyImg: "assets/img/animals/babies/chick.jpg", babyFlip: true },
      { key: "pig", name: "Pig", emoji: "🐖", baby: "Piglet", babyEmoji: "🐷", adultImg: "assets/img/animals/adults/pig.jpg" },
      { key: "fox", name: "Fox", emoji: "🦊", baby: "Kit", babyEmoji: "🦊", adultImg: "assets/img/animals/adults/fox.jpg" },
      { key: "deer", name: "Deer", emoji: "🦌", baby: "Fawn", babyEmoji: "🦌", adultImg: "assets/img/animals/adults/deer.jpg" },
      { key: "giraffe", name: "Giraffe", emoji: "🦒", baby: "Calf", babyEmoji: "🦒", adultImg: "assets/img/animals/adults/giraffe.jpg" },
      { key: "zebra", name: "Zebra", emoji: "🦓", baby: "Foal", babyEmoji: "🦓", adultImg: "assets/img/animals/adults/zebra.jpg" },
      { key: "rhino", name: "Rhino", emoji: "🦏", baby: "Calf", babyEmoji: "🦏", adultImg: "assets/img/animals/adults/rhino.jpg" },
      { key: "alligator", name: "Alligator", emoji: "🐊", baby: "Hatchling", babyEmoji: "🐊", adultImg: "assets/img/animals/adults/alligator.jpg" },
      { key: "snake", name: "Snake", emoji: "🐍", baby: "Hatchling", babyEmoji: "🐍", adultPortrait: true }
    ],

    birds: [
      { key: "sparrow", name: "Sparrow", emoji: "🐦" }, { key: "parrot", name: "Parrot", emoji: "🦜" },
      { key: "crow", name: "Crow", emoji: "🐦‍⬛" },      { key: "peacock", name: "Peacock", emoji: "🦚" },
      { key: "pigeon", name: "Pigeon", emoji: "🕊️" },   { key: "eagle", name: "Eagle", emoji: "🦅" },
      { key: "owl", name: "Owl", emoji: "🦉" },          { key: "duck", name: "Duck", emoji: "🦆" },
      { key: "hen", name: "Hen", emoji: "🐔" },          { key: "rooster", name: "Rooster", emoji: "🐓" },
      { key: "swan", name: "Swan", emoji: "🦢" },        { key: "penguin", name: "Penguin", emoji: "🐧" },
      { key: "flamingo", name: "Flamingo", emoji: "🦩" },
      // Change #21: photo-only (no emoji, so they never re-map an existing emoji); each has a real recording
      { key: "cardinal", name: "Cardinal" },             { key: "blue_jay", name: "Blue Jay" },
      { key: "heron", name: "Heron" },                   { key: "pelican", name: "Pelican" }
    ],

    flowers: [
      { key: "rose", name: "Rose", emoji: "🌹" },       { key: "sunflower", name: "Sunflower", emoji: "🌻" },
      { key: "tulip", name: "Tulip", emoji: "🌷" },      { key: "hibiscus", name: "Hibiscus", emoji: "🌺" },
      { key: "lotus", name: "Lotus", emoji: "🪷" },      { key: "daisy", name: "Daisy", emoji: "🌼" },
      { key: "cherry", name: "Blossom", emoji: "🌸" },   { key: "marigold", name: "Marigold", emoji: "🏵️" },
      { key: "lily", name: "Lily", emoji: "⚜️" },        { key: "bouquet", name: "Bouquet", emoji: "💐" },
      // Change #21 (photo-only)
      { key: "orchid", name: "Orchid" },                 { key: "dandelion", name: "Dandelion" },
      { key: "lavender", name: "Lavender" },             { key: "poppy", name: "Poppy" },
      { key: "iris", name: "Iris" },
      // 2026-11-08 (photo-only, §25)
      { key: "jasmine", name: "Jasmine" },               { key: "daffodil", name: "Daffodil" },
      { key: "carnation", name: "Carnation" },           { key: "dahlia", name: "Dahlia" },
      { key: "chrysanthemum", name: "Chrysanthemum" },   { key: "bougainvillea", name: "Bougainvillea" },
      { key: "peony", name: "Peony" },                   { key: "pansy", name: "Pansy" },
      { key: "frangipani", name: "Frangipani" },         { key: "zinnia", name: "Zinnia" }
    ],

    vehicles: [
      { key: "car", name: "Car", emoji: "🚗" },         { key: "suv", name: "SUV", emoji: "🚙" },
      { key: "van", name: "Van", emoji: "🚐" },         { key: "bus", name: "Bus", emoji: "🚌" },
      { key: "ambulance", name: "Ambulance", emoji: "🚑" }, { key: "firetruck", name: "Fire Truck", emoji: "🚒" },
      { key: "police", name: "Police Car", emoji: "🚓" }, { key: "bicycle", name: "Bicycle", emoji: "🚲" },
      { key: "motorcycle", name: "Motorcycle", emoji: "🏍️" }, { key: "tractor", name: "Tractor", emoji: "🚜" },
      { key: "train", name: "Train", emoji: "🚆" },      { key: "airplane", name: "Airplane", emoji: "✈️" },
      { key: "helicopter", name: "Helicopter", emoji: "🚁" }, { key: "ship", name: "Ship", emoji: "🚢" },
      { key: "rocket", name: "Rocket", emoji: "🚀" },    { key: "truck", name: "Truck", emoji: "🚚" },
      { key: "taxi", name: "Taxi", emoji: "🚕" }
    ],

    fruits: [
      { key: "apple", name: "Apple", emoji: "🍎", img: "assets/img/fruits/apple.jpg", color: "Red", taste: "Crisp & Sweet", funFact: "Apples float in water because 25% of their volume is air!" },
      { key: "banana", name: "Banana", emoji: "🍌", img: "assets/img/fruits/banana.jpg", color: "Yellow", taste: "Sweet & Creamy", funFact: "Bananas are rich in potassium to give you tons of playful energy!" },
      { key: "orange", name: "Orange", emoji: "🍊", img: "assets/img/fruits/orange.jpg", color: "Orange", taste: "Juicy & Tangy", funFact: "Oranges are packed with Vitamin C to keep you strong and healthy!" },
      { key: "strawberry", name: "Strawberry", emoji: "🍓", img: "assets/img/fruits/strawberry.jpg", color: "Ruby Red", taste: "Sweet & Berry Juicy", funFact: "Strawberries are the only fruit with tiny seeds on the outside!" },
      { key: "watermelon", name: "Watermelon", emoji: "🍉", img: "assets/img/fruits/watermelon.jpg", color: "Green & Red", taste: "Refreshing & Crisp", funFact: "Watermelons are 92% water, making them super refreshing on sunny days!" },
      { key: "grapes", name: "Grapes", emoji: "🍇", img: "assets/img/fruits/grapes.jpg", color: "Royal Purple", taste: "Sweet & Poppable", funFact: "Grapes grow in beautiful bunches on climbing vineyard vines!" },
      { key: "mango", name: "Mango", emoji: "🥭", img: "assets/img/fruits/mango.jpg", color: "Golden Sunset", taste: "Rich & Tropical", funFact: "Mango is celebrated around the world as the King of Fruits!" },
      { key: "pineapple", name: "Pineapple", emoji: "🍍", img: "assets/img/fruits/pineapple.jpg", color: "Golden Yellow", taste: "Sweet & Zesty", funFact: "A pineapple wears a spiky green crown just like fruit royalty!" },
      { key: "cherry", name: "Cherry", emoji: "🍒", img: "assets/img/fruits/cherry.jpg", color: "Deep Ruby", taste: "Sweet & Juicy", funFact: "Cherries often grow in twin pairs joined by curved green stems!" },
      // Change #21 (photo-only)
      { key: "pear", name: "Pear", img: "assets/img/fruits/pear.jpg", color: "Green", taste: "Soft & Sweet", funFact: "Pears ripen from the inside out, so they get soft near the stem first!" },
      { key: "lemon", name: "Lemon", img: "assets/img/fruits/lemon.jpg", color: "Yellow", taste: "Sour & Zingy", funFact: "Lemons are so sour that most people squeeze them instead of eating them!" },
      { key: "blueberry", name: "Blueberry", img: "assets/img/fruits/blueberry.jpg", color: "Blue", taste: "Sweet & Tangy", funFact: "Blueberries grow in bunches on small bushes!" },
      { key: "kiwi", name: "Kiwi", img: "assets/img/fruits/kiwi.jpg", color: "Brown & Green", taste: "Sweet & Tangy", funFact: "A kiwi is fuzzy brown outside and bright green with tiny black seeds inside!" },
      { key: "coconut", name: "Coconut", img: "assets/img/fruits/coconut.jpg", color: "Brown", taste: "Nutty & Sweet", funFact: "A coconut has sweet water inside its hard shell!" },
      { key: "plum", name: "Plum", img: "assets/img/fruits/plum.jpg", color: "Purple", taste: "Juicy & Sweet", funFact: "A dried plum is called a prune!" },
      { key: "pomegranate", name: "Pomegranate", img: "assets/img/fruits/pomegranate.jpg", color: "Red", taste: "Sweet & Tart", funFact: "A pomegranate is packed with hundreds of juicy red seeds!" },
      // 2026-11-08 (photo-only, §25)
      { key: "papaya", name: "Papaya", img: "assets/img/fruits/papaya.jpg", color: "Green & Orange", taste: "Soft & Sweet", funFact: "A papaya has lots of little black seeds in the middle!" },
      { key: "guava", name: "Guava", img: "assets/img/fruits/guava.jpg", color: "Green", taste: "Sweet & Crunchy", funFact: "A guava has even more Vitamin C than an orange!" },
      { key: "litchi", name: "Litchi", img: "assets/img/fruits/litchi.jpg", color: "Pink", taste: "Sweet & Juicy", funFact: "Peel a litchi's bumpy pink skin to find juicy white fruit inside!" },
      { key: "custard_apple", name: "Custard Apple", img: "assets/img/fruits/custard_apple.jpg", color: "Green", taste: "Creamy & Sweet", funFact: "A custard apple is soft and creamy inside, like pudding!" },
      { key: "jackfruit", name: "Jackfruit", img: "assets/img/fruits/jackfruit.jpg", color: "Green", taste: "Sweet", funFact: "The jackfruit is the biggest fruit that grows on a tree!" },
      { key: "fig", name: "Fig", img: "assets/img/fruits/fig.jpg", color: "Green", taste: "Soft & Sweet", funFact: "A fig is full of tiny crunchy seeds!" },
      { key: "raspberry", name: "Raspberry", img: "assets/img/fruits/raspberry.jpg", color: "Red", taste: "Sweet & Tangy", funFact: "A raspberry is made of lots of tiny round bumps!" },
      { key: "dragon_fruit", name: "Dragon Fruit", img: "assets/img/fruits/dragon_fruit.jpg", color: "Pink", taste: "Mild & Sweet", funFact: "Dragon fruit grows on a cactus!" },
      { key: "avocado", name: "Avocado", img: "assets/img/fruits/avocado.jpg", color: "Green", taste: "Soft & Creamy", funFact: "An avocado has one big seed in the middle!" },
      { key: "chikoo", name: "Chikoo", img: "assets/img/fruits/chikoo.jpg", color: "Brown", taste: "Sweet like caramel", funFact: "A chikoo is brown outside and sweet like caramel inside!" },
      { key: "muskmelon", name: "Muskmelon", img: "assets/img/fruits/muskmelon.jpg", color: "Orange", taste: "Sweet & Juicy", funFact: "A ripe muskmelon smells sweet!" }
    ],

    // 2026-11-08: vegetables (photos, §25). grows: under (roots and bulbs) | above; color only where one colour is true
    vegetables: [
      { key: "carrot", name: "Carrot", img: "assets/img/fruits/carrot.jpg", color: "orange", grows: "under", funFact: "Carrots grow under the ground. They are crunchy and good for your eyes!" },
      { key: "onion", name: "Onion", img: "assets/img/vegetables/onion.jpg", color: "", grows: "under", funFact: "An onion grows under the ground in layers. Cutting it can make you cry!" },
      { key: "radish", name: "Radish", img: "assets/img/vegetables/radish.jpg", color: "", grows: "under", funFact: "A radish grows under the ground and tastes a little spicy!" },
      { key: "beetroot", name: "Beetroot", img: "assets/img/vegetables/beetroot.jpg", color: "", grows: "under", funFact: "Beetroot grows under the ground and is deep red inside." },
      { key: "tomato", name: "Tomato", img: "assets/img/vegetables/tomato.jpg", color: "red", grows: "above", funFact: "Tomatoes grow on a plant and turn red when they are ripe." },
      { key: "cabbage", name: "Cabbage", img: "assets/img/vegetables/cabbage.jpg", color: "", grows: "above", funFact: "A cabbage is a big ball of leaves wrapped tightly together." },
      { key: "cauliflower", name: "Cauliflower", img: "assets/img/vegetables/cauliflower.jpg", color: "white", grows: "above", funFact: "A cauliflower has a white head that looks like a little tree." },
      { key: "broccoli", name: "Broccoli", img: "assets/img/vegetables/broccoli.jpg", color: "green", grows: "above", funFact: "Broccoli looks like tiny green trees!" },
      { key: "peas", name: "Peas", img: "assets/img/vegetables/peas.jpg", color: "", grows: "above", funFact: "Peas grow inside a green pod. Pop it open to find them!" },
      { key: "brinjal", name: "Brinjal", img: "assets/img/vegetables/brinjal.jpg", color: "purple", grows: "above", funFact: "A brinjal is shiny and purple. It is also called an eggplant." },
      { key: "okra", name: "Okra", img: "assets/img/vegetables/okra.jpg", color: "", grows: "above", funFact: "Okra is also called bhindi or lady's finger!" },
      { key: "cucumber", name: "Cucumber", img: "assets/img/vegetables/cucumber.jpg", color: "", grows: "above", funFact: "A cucumber is cool and full of water." },
      { key: "pumpkin", name: "Pumpkin", img: "assets/img/vegetables/pumpkin.jpg", color: "", grows: "above", funFact: "Pumpkins grow on long vines along the ground." },
      { key: "capsicum", name: "Capsicum", img: "assets/img/vegetables/capsicum.jpg", color: "", grows: "above", funFact: "A capsicum can be red, yellow or green!" },
      { key: "corn", name: "Corn", img: "assets/img/vegetables/corn.jpg", color: "yellow", grows: "above", funFact: "Corn grows on tall plants. Each cob has hundreds of yellow kernels!" }
    ],

    shapes: [
      // 2D Shapes (Plane Shapes)
      { key: "circle", name: "Circle", emoji: "⭕", img: "assets/img/shapes/circle.svg", fact: "Circle! A flat 2D shape with zero corners, like a coin or clock face!" },
      { key: "square", name: "Square", emoji: "🟦", img: "assets/img/shapes/square.svg", fact: "Square! A flat 2D shape with 4 equal straight sides and 4 square corners!" },
      { key: "triangle", name: "Triangle", emoji: "🔺", img: "assets/img/shapes/triangle.svg", fact: "Triangle! A flat 2D shape with 3 straight sides and 3 corners!" },
      { key: "rectangle", name: "Rectangle", emoji: "▬", img: "assets/img/shapes/rectangle.svg", fact: "Rectangle! A flat 2D shape with 2 long sides and 2 short sides!" },
      { key: "pentagon", name: "Pentagon", emoji: "⬟", img: "assets/img/shapes/pentagon.svg", fact: "Pentagon! A flat 2D shape with 5 straight sides, shaped like a cozy house!" },
      { key: "hexagon", name: "Hexagon", emoji: "⬡", img: "assets/img/shapes/hexagon.svg", fact: "Hexagon! A flat 2D shape with 6 straight sides, just like a bee's honeycomb cell!" },
      { key: "trapezium", name: "Trapezium", emoji: "⏢", img: "assets/img/shapes/trapezium.svg", fact: "Trapezium! A flat 2D four-sided shape with one pair of parallel sides!" },
      { key: "star", name: "Star", emoji: "⭐", img: "assets/img/shapes/star.svg", fact: "Star! A glowing shape with 5 shining points twinkling in the sky!" },
      { key: "heart", name: "Heart", emoji: "❤️", img: "assets/img/shapes/heart.svg", fact: "Heart! The lovely shape of warmth, kindness, and love!" },
      { key: "diamond", name: "Diamond", emoji: "🔷", img: "assets/img/shapes/diamond.svg", fact: "Diamond! A four-sided rhombus shape with dazzling diagonal corners!" },
      { key: "oval", name: "Oval", emoji: "🥚", img: "assets/img/shapes/oval.svg", fact: "Oval! A smooth curved 2D shape, rounded and elongated like an egg or running track!" },
      // 3D Shapes (Solid Shapes)
      { key: "cube", name: "Cube", emoji: "🧊", img: "assets/img/shapes/cube.svg", fact: "Cube! A solid 3D shape with 6 identical square faces, 8 corners, and 12 straight edges!" },
      { key: "sphere", name: "Sphere", emoji: "🌐", img: "assets/img/shapes/sphere.svg", fact: "Sphere! A round solid 3D shape with a curved surface, like a basketball or planet Earth!" },
      { key: "pyramid", name: "Pyramid", emoji: "⛺", img: "assets/img/shapes/pyramid.svg", fact: "Pyramid! A solid 3D shape with triangular sides that meet at a sharp top apex!" },
      { key: "cone", name: "Cone", emoji: "🍦", img: "assets/img/shapes/cone.svg", fact: "Cone! A solid 3D shape with a flat round base that tapers to a pointed top!" },
      { key: "cylinder", name: "Cylinder", emoji: "🥫", img: "assets/img/shapes/cylinder.svg", fact: "Cylinder! A solid 3D shape with two flat circular ends and a curved tube body!" }
    ],

    /* Complete Hindi Varnamala: Swar (स्वर - 13) with multiple objects, meanings & 3D assets */
    hindiSwar: [
      {
        L: "अ", word: "अनार", meaning: "Pomegranate", emoji: "🍎", key: "pomegranate", img: "assets/img/objects/pomegranate.jpg",
        words: [
          { word: "अनार", meaning: "Pomegranate", emoji: "🍎", key: "pomegranate", img: "assets/img/objects/pomegranate.jpg" },
          { word: "अमरूद", meaning: "Guava", emoji: "🍐" },
          { word: "अजगर", meaning: "Python", emoji: "🐍", key: "snake", img: "assets/img/animals/snake.jpg" },
          { word: "अदरक", meaning: "Ginger", emoji: "🫚" }
        ]
      },
      {
        L: "आ", word: "आम", meaning: "Mango", emoji: "🥭", key: "mango", img: "assets/img/fruits/mango.jpg",
        words: [
          { word: "आम", meaning: "Mango", emoji: "🥭", key: "mango", img: "assets/img/fruits/mango.jpg" },
          { word: "आग", meaning: "Fire", emoji: "🔥" },
          { word: "आलू", meaning: "Potato", emoji: "🥔" },
          { word: "आईना", meaning: "Mirror", emoji: "🪞" }
        ]
      },
      {
        L: "इ", word: "इमली", meaning: "Tamarind", emoji: "🫘", key: "tamarind", img: "assets/img/objects/tamarind.svg",
        words: [
          { word: "इमली", meaning: "Tamarind", emoji: "🫘", key: "tamarind", img: "assets/img/objects/tamarind.svg" },
          { word: "इमारत", meaning: "Building", emoji: "🏢" },
          { word: "इलायची", meaning: "Cardamom", emoji: "🌿" },
          { word: "इंद्रधनुष", meaning: "Rainbow", emoji: "🌈" }
        ]
      },
      {
        L: "ई", word: "ईख", meaning: "Sugarcane", emoji: "🎋", key: "sugarcane", img: "assets/img/objects/sugarcane.svg",
        words: [
          { word: "ईख", meaning: "Sugarcane", emoji: "🎋", key: "sugarcane", img: "assets/img/objects/sugarcane.svg" },
          { word: "ईंट", meaning: "Brick", emoji: "🧱" },
          { word: "ईद", meaning: "Festival", emoji: "🌙" }
        ]
      },
      {
        L: "उ", word: "उल्लू", meaning: "Owl", emoji: "🦉", key: "owl", img: "assets/img/birds/owl.jpg",
        words: [
          { word: "उल्लू", meaning: "Owl", emoji: "🦉", key: "owl", img: "assets/img/birds/owl.jpg" }
        ]
      },
      {
        L: "ऊ", word: "ऊन", meaning: "Wool", emoji: "🧶", key: "yarn", img: "assets/img/objects/yarn.svg",
        words: [
          { word: "ऊन", meaning: "Wool", emoji: "🧶", key: "yarn", img: "assets/img/objects/yarn.svg" }
        ]
      },
      {
        L: "ऋ", word: "ऋषि", meaning: "Sage", emoji: "🧘",
        words: [
          { word: "ऋषि", meaning: "Sage", emoji: "🧘" },
          { word: "ऋतु", meaning: "Season", emoji: "🌸" },
          { word: "ऋषभ", meaning: "Bull", emoji: "🐂" }
        ]
      },
      {
        L: "ए", word: "एड़ी", meaning: "Heel", emoji: "🦶", key: "foot", img: "assets/img/body/foot.svg",
        words: [
          { word: "एड़ी", meaning: "Heel", emoji: "🦶", key: "foot", img: "assets/img/body/foot.svg" },
          { word: "एक", meaning: "One", emoji: "1️⃣" },
          { word: "एकता", meaning: "Unity", emoji: "🤝" }
        ]
      },
      {
        L: "ऐ", word: "ऐनक", meaning: "Glasses", emoji: "👓", key: "glasses", img: "assets/img/objects/glasses.svg",
        words: [
          { word: "ऐनक", meaning: "Glasses", emoji: "👓", key: "glasses", img: "assets/img/objects/glasses.svg" },
          { word: "ऐरावत", meaning: "White Elephant", emoji: "🐘", key: "elephant", img: "assets/img/animals/elephant.jpg" }
        ]
      },
      {
        L: "ओ", word: "ओखली", meaning: "Mortar", emoji: "🥣",
        words: [
          { word: "ओखली", meaning: "Mortar", emoji: "🥣" },
          { word: "ओस", meaning: "Dewdrop", emoji: "💧" },
          { word: "ओढ़नी", meaning: "Scarf", emoji: "🧣" }
        ]
      },
      {
        L: "औ", word: "औरत", meaning: "Woman", emoji: "👩",
        words: [
          { word: "औरत", meaning: "Woman", emoji: "👩" },
          { word: "औजार", meaning: "Tools", emoji: "🛠️" },
          { word: "औषधि", meaning: "Medicine", emoji: "💊" }
        ]
      },
      {
        L: "अं", word: "अंगूर", meaning: "Grapes", emoji: "🍇", key: "grapes", img: "assets/img/fruits/grapes.jpg",
        words: [
          { word: "अंगूर", meaning: "Grapes", emoji: "🍇", key: "grapes", img: "assets/img/fruits/grapes.jpg" },
          { word: "अंडा", meaning: "Egg", emoji: "🥚" },
          { word: "अंगूठी", meaning: "Ring", emoji: "💍" }
        ]
      },
      {
        L: "अः", word: "अः (खाली)", meaning: "Aha (Namah)", emoji: "🙏",
        words: [
          { word: "अः (खाली)", meaning: "Aha (Namah)", emoji: "🙏" }
        ]
      }
    ],

    /* Complete Hindi Varnamala: Vyanjan (व्यंजन - 37) with multiple objects, meanings & 3D assets */
    hindiVyanjan: [
      {
        L: "क", word: "कमल", meaning: "Lotus", emoji: "🪷", key: "lotus", img: "assets/img/flowers/lotus.jpg",
        words: [
          { word: "कमल", meaning: "Lotus", emoji: "🪷", key: "lotus", img: "assets/img/flowers/lotus.jpg" },
          { word: "कबूतर", meaning: "Pigeon", emoji: "🐦", key: "pigeon", img: "assets/img/birds/pigeon.jpg" },
          { word: "कछुआ", meaning: "Turtle", emoji: "🐢" },
          { word: "कलम", meaning: "Pen", emoji: "✒️" }
        ]
      },
      {
        L: "ख", word: "खरगोश", meaning: "Rabbit", emoji: "🐇", key: "rabbit", img: "assets/img/animals/rabbit.jpg",
        words: [
          { word: "खरगोश", meaning: "Rabbit", emoji: "🐇", key: "rabbit", img: "assets/img/animals/rabbit.jpg" },
          { word: "खजूर", meaning: "Dates", emoji: "🌴" },
          { word: "खीरा", meaning: "Cucumber", emoji: "🥒" }
        ]
      },
      {
        L: "ग", word: "गमला", meaning: "Flowerpot", emoji: "🪴", key: "flowerpot", img: "assets/img/objects/flowerpot.svg",
        words: [
          { word: "गमला", meaning: "Flowerpot", emoji: "🪴", key: "flowerpot", img: "assets/img/objects/flowerpot.svg" },
          { word: "गाय", meaning: "Cow", emoji: "🐄", key: "cow", img: "assets/img/animals/cow.jpg" },
          { word: "गुलाब", meaning: "Rose", emoji: "🌹", key: "rose", img: "assets/img/flowers/rose.jpg" },
          { word: "गाजर", meaning: "Carrot", emoji: "🥕" }
        ]
      },
      {
        L: "घ", word: "घर", meaning: "House", emoji: "🏠",
        words: [
          { word: "घर", meaning: "House", emoji: "🏠" },
          { word: "घड़ी", meaning: "Watch", emoji: "⌚", key: "watch", img: "assets/img/objects/watch.svg" },
          { word: "घड़ा", meaning: "Clay pot", emoji: "🏺" }
        ]
      },
      {
        L: "ङ", word: "ङ (खाली)", meaning: "Wanga (Ganga / Patang)", emoji: "✨",
        words: [
          { word: "ङ (खाली)", meaning: "Wanga (Ganga / Patang)", emoji: "✨" }
        ]
      },
      {
        L: "च", word: "चम्मच", meaning: "Spoon", emoji: "🥄",
        words: [
          { word: "चम्मच", meaning: "Spoon", emoji: "🥄" },
          { word: "चाँद", meaning: "Moon", emoji: "🌙" },
          { word: "चश्मा", meaning: "Spectacles", emoji: "👓", key: "glasses", img: "assets/img/objects/glasses.svg" },
          { word: "चींटी", meaning: "Ant", emoji: "🐜", key: "ant", img: "assets/img/objects/ant.svg" }
        ]
      },
      {
        L: "छ", word: "छतरी", meaning: "Umbrella", emoji: "☂️", key: "umbrella", img: "assets/img/objects/umbrella.jpg",
        words: [
          { word: "छतरी", meaning: "Umbrella", emoji: "☂️", key: "umbrella", img: "assets/img/objects/umbrella.jpg" },
          { word: "छड़ी", meaning: "Walking Stick", emoji: "🦯" },
          { word: "छात्र", meaning: "Student", emoji: "🎒" }
        ]
      },
      {
        L: "ज", word: "जहाज", meaning: "Ship", emoji: "🚢", key: "ship", img: "assets/img/vehicles/ship.jpg",
        words: [
          { word: "जहाज", meaning: "Ship", emoji: "🚢", key: "ship", img: "assets/img/vehicles/ship.jpg" },
          { word: "जग", meaning: "Jug", emoji: "🫗", key: "jug", img: "assets/img/objects/jug.svg" },
          { word: "जलेबी", meaning: "Jalebi Sweet", emoji: "🥨" }
        ]
      },
      {
        L: "झ", word: "झंडा", meaning: "Flag", emoji: "🚩",
        words: [
          { word: "झंडा", meaning: "Flag", emoji: "🚩" },
          { word: "झरना", meaning: "Waterfall", emoji: "🏞️", img: "assets/img/jungle-waterfall.svg" },
          { word: "झूला", meaning: "Swing", emoji: "🪅" }
        ]
      },
      {
        L: "ञ", word: "ञ (खाली)", meaning: "Nya (Chanchal / Panchhi)", emoji: "✨",
        words: [
          { word: "ञ (खाली)", meaning: "Nya (Chanchal / Panchhi)", emoji: "✨" }
        ]
      },
      {
        L: "ट", word: "टमाटर", meaning: "Tomato", emoji: "🍅", key: "tomato", img: "assets/img/objects/tomato.svg",
        words: [
          { word: "टमाटर", meaning: "Tomato", emoji: "🍅", key: "tomato", img: "assets/img/objects/tomato.svg" },
          { word: "टोपी", meaning: "Cap", emoji: "🧢" },
          { word: "टोकरी", meaning: "Basket", emoji: "🧺" }
        ]
      },
      {
        L: "ठ", word: "ठेला", meaning: "Cart", emoji: "🛒",
        words: [
          { word: "ठेला", meaning: "Cart", emoji: "🛒" },
          { word: "ठप्पा", meaning: "Stamp", emoji: "🏷️" }
        ]
      },
      {
        L: "ड", word: "डमरू", meaning: "Drum", emoji: "🥁", key: "drum", img: "assets/img/objects/drum.svg",
        words: [
          { word: "डमरू", meaning: "Drum", emoji: "🥁", key: "drum", img: "assets/img/objects/drum.svg" },
          { word: "डाल", meaning: "Branch", emoji: "🌿" },
          { word: "डिब्बा", meaning: "Box", emoji: "📦" }
        ]
      },
      {
        L: "ढ", word: "ढोलक", meaning: "Dholak Drum", emoji: "🪘", key: "drum", img: "assets/img/objects/drum.svg",
        words: [
          { word: "ढोलक", meaning: "Dholak Drum", emoji: "🪘", key: "drum", img: "assets/img/objects/drum.svg" },
          { word: "ढक्कन", meaning: "Lid", emoji: "🪙" }
        ]
      },
      {
        L: "ण", word: "ण (बाण)", meaning: "Arrow", emoji: "🏹",
        words: [
          { word: "ण (बाण)", meaning: "Arrow", emoji: "🏹" }
        ]
      },
      {
        L: "त", word: "तितली", meaning: "Butterfly", emoji: "🦋", key: "butterfly", img: "assets/img/objects/butterfly.svg",
        words: [
          { word: "तितली", meaning: "Butterfly", emoji: "🦋", key: "butterfly", img: "assets/img/objects/butterfly.svg" },
          { word: "तरबूज", meaning: "Watermelon", emoji: "🍉", key: "watermelon", img: "assets/img/fruits/watermelon.jpg" },
          { word: "तारा", meaning: "Star", emoji: "⭐", key: "star", img: "assets/img/shapes/star.svg" }
        ]
      },
      {
        L: "थ", word: "थैला", meaning: "Bag", emoji: "🛍️",
        words: [
          { word: "थैला", meaning: "Bag", emoji: "🛍️" },
          { word: "थाली", meaning: "Plate", emoji: "🍽️" }
        ]
      },
      {
        L: "द", word: "दवात", meaning: "Inkpot", emoji: "🖋️",
        words: [
          { word: "दवात", meaning: "Inkpot", emoji: "🖋️" },
          { word: "दरवाजा", meaning: "Door", emoji: "🚪" },
          { word: "दीपक", meaning: "Lamp", emoji: "🪔" }
        ]
      },
      {
        L: "ध", word: "धनुष", meaning: "Bow", emoji: "🏹",
        words: [
          { word: "धनुष", meaning: "Bow", emoji: "🏹" },
          { word: "धूप", meaning: "Sunshine", emoji: "☀️" },
          { word: "धागा", meaning: "Thread", emoji: "🧵" }
        ]
      },
      {
        L: "न", word: "नल", meaning: "Tap", emoji: "🚰",
        words: [
          { word: "नल", meaning: "Tap", emoji: "🚰" },
          { word: "नाव", meaning: "Boat", emoji: "⛵" },
          { word: "नारियल", meaning: "Coconut", emoji: "🥥" },
          { word: "नदी", meaning: "River", emoji: "🌊" }
        ]
      },
      {
        L: "प", word: "पतंग", meaning: "Kite", emoji: "🪁", key: "kite", img: "assets/img/objects/kite.svg",
        words: [
          { word: "पतंग", meaning: "Kite", emoji: "🪁", key: "kite", img: "assets/img/objects/kite.svg" },
          { word: "पेड़", meaning: "Tree", emoji: "🌳" },
          { word: "पत्ता", meaning: "Leaf", emoji: "🍃" }
        ]
      },
      {
        L: "फ", word: "फल", meaning: "Fruits", emoji: "🍎", key: "apple", img: "assets/img/fruits/apple.jpg",
        words: [
          { word: "फल", meaning: "Fruits", emoji: "🍎", key: "apple", img: "assets/img/fruits/apple.jpg" },
          { word: "फूल", meaning: "Flower", emoji: "🌸", key: "rose", img: "assets/img/flowers/rose.jpg" },
          { word: "फुटबॉल", meaning: "Football", emoji: "⚽", key: "ball", img: "assets/img/objects/ball.svg" }
        ]
      },
      {
        L: "ब", word: "बकरी", meaning: "Goat", emoji: "🐐", key: "goat", img: "assets/img/animals/goat.jpg",
        words: [
          { word: "बकरी", meaning: "Goat", emoji: "🐐", key: "goat", img: "assets/img/animals/goat.jpg" },
          { word: "बत्तख", meaning: "Duck", emoji: "🦆", key: "duck", img: "assets/img/animals/duck.jpg" },
          { word: "बस", meaning: "Bus", emoji: "🚌", key: "bus", img: "assets/img/vehicles/bus.jpg" },
          { word: "बंदर", meaning: "Monkey", emoji: "🐒", key: "monkey", img: "assets/img/animals/monkey.jpg" }
        ]
      },
      {
        L: "भ", word: "भालू", meaning: "Bear", emoji: "🐻", key: "bear", img: "assets/img/animals/bear.jpg",
        words: [
          { word: "भालू", meaning: "Bear", emoji: "🐻", key: "bear", img: "assets/img/animals/bear.jpg" }
        ]
      },
      {
        L: "म", word: "मछली", meaning: "Fish", emoji: "🐟", key: "fish", img: "assets/img/animals/fish.jpg",
        words: [
          { word: "मछली", meaning: "Fish", emoji: "🐟", key: "fish", img: "assets/img/animals/fish.jpg" },
          { word: "मोर", meaning: "Peacock", emoji: "🦚", key: "peacock", img: "assets/img/birds/peacock.jpg" },
          { word: "मटर", meaning: "Green Peas", emoji: "🫛" }
        ]
      },
      {
        L: "य", word: "यज्ञ", meaning: "Sacred Fire", emoji: "🔥",
        words: [
          { word: "यज्ञ", meaning: "Sacred Fire", emoji: "🔥" },
          { word: "यान", meaning: "Aeroplane", emoji: "✈️", key: "airplane", img: "assets/img/vehicles/airplane.jpg" },
          { word: "योग", meaning: "Yoga", emoji: "🧘" }
        ]
      },
      {
        L: "र", word: "रथ", meaning: "Chariot", emoji: "🛕",
        words: [
          { word: "रथ", meaning: "Chariot", emoji: "🛕" },
          { word: "राजा", meaning: "King", emoji: "👑", key: "queen", img: "assets/img/objects/queen.svg" },
          { word: "रेल", meaning: "Train", emoji: "🚆", key: "train", img: "assets/img/vehicles/train.jpg" },
          { word: "रस्सी", meaning: "Rope", emoji: "🪢" }
        ]
      },
      {
        L: "ल", word: "लट्टू", meaning: "Spinning Top", emoji: "🪀", key: "yoyo", img: "assets/img/objects/yo-yo.svg",
        words: [
          { word: "लट्टू", meaning: "Spinning Top", emoji: "🪀", key: "yoyo", img: "assets/img/objects/yo-yo.svg" },
          { word: "लड़का", meaning: "Boy", emoji: "🧒", key: "boy", img: "assets/img/body/boy.svg" },
          { word: "लड्डू", meaning: "Sweet Laddu", emoji: "🟡" }
        ]
      },
      {
        L: "व", word: "वन", meaning: "Forest", emoji: "🌲",
        words: [
          { word: "वन", meaning: "Forest", emoji: "🌲" },
          { word: "वर्षा", meaning: "Rain", emoji: "🌧️" },
          { word: "वक", meaning: "Crane bird", emoji: "🦩" }
        ]
      },
      {
        L: "श", word: "शेर", meaning: "Lion", emoji: "🦁", key: "lion", img: "assets/img/animals/lion.jpg",
        words: [
          { word: "शेर", meaning: "Lion", emoji: "🦁", key: "lion", img: "assets/img/animals/lion.jpg" },
          { word: "शंख", meaning: "Conch Shell", emoji: "🐚" },
          { word: "शहद", meaning: "Honey", emoji: "🍯" }
        ]
      },
      {
        L: "ष", word: "षट्कोण", meaning: "Hexagon", emoji: "⬡", key: "hexagon", img: "assets/img/shapes/hexagon.svg",
        words: [
          { word: "षट्कोण", meaning: "Hexagon", emoji: "⬡", key: "hexagon", img: "assets/img/shapes/hexagon.svg" }
        ]
      },
      {
        L: "स", word: "सेब", meaning: "Apple", emoji: "🍎", key: "apple", img: "assets/img/fruits/apple.jpg",
        words: [
          { word: "सेब", meaning: "Apple", emoji: "🍎", key: "apple", img: "assets/img/fruits/apple.jpg" },
          { word: "सूरज", meaning: "Sun", emoji: "☀️" },
          { word: "साइकिल", meaning: "Bicycle", emoji: "🚲", key: "bicycle", img: "assets/img/vehicles/bicycle.jpg" }
        ]
      },
      {
        L: "ह", word: "हाथी", meaning: "Elephant", emoji: "🐘", key: "elephant", img: "assets/img/animals/elephant.jpg",
        words: [
          { word: "हाथी", meaning: "Elephant", emoji: "🐘", key: "elephant", img: "assets/img/animals/elephant.jpg" },
          { word: "हाथ", meaning: "Hand", emoji: "✋", key: "hand", img: "assets/img/body/hand.svg" },
          { word: "हल", meaning: "Plough", emoji: "🚜", key: "tractor", img: "assets/img/vehicles/tractor.jpg" }
        ]
      },
      {
        L: "क्ष", word: "क्षत्रिय", meaning: "Warrior", emoji: "🛡️",
        words: [
          { word: "क्षत्रिय", meaning: "Warrior", emoji: "🛡️" },
          { word: "वृक्ष", meaning: "Tree", emoji: "🌳" }
        ]
      },
      {
        L: "त्र", word: "त्रिशूल", meaning: "Trident", emoji: "🔱",
        words: [
          { word: "त्रिशूल", meaning: "Trident", emoji: "🔱" },
          { word: "त्रिभुज", meaning: "Triangle", emoji: "🔺", key: "triangle", img: "assets/img/shapes/triangle.svg" }
        ]
      },
      {
        L: "ज्ञ", word: "ज्ञानी", meaning: "Wise Scholar", emoji: "🧑‍🏫",
        words: [
          { word: "ज्ञानी", meaning: "Wise Scholar", emoji: "🧑‍🏫" },
          { word: "ज्ञान", meaning: "Knowledge / Book", emoji: "📖" }
        ]
      },
      {
        L: "श्र", word: "श्रमिक", meaning: "Worker / Diligent", emoji: "👷",
        words: [
          { word: "श्रमिक", meaning: "Worker / Diligent", emoji: "👷" },
          { word: "श्रवण", meaning: "Listening", emoji: "👂", key: "ears", img: "assets/img/body/ears.svg" }
        ]
      }
    ],

    /* Good habits — each is an action with realistic photo & illustrated cards */
    habits: [
      { key: "wakeup", name: "Wake up early", emoji: "🌅", img: "assets/img/habits/habit_wakeup.svg" },
      { key: "brush", name: "Brush teeth", emoji: "🪥", img: "assets/img/habits/habit_brush.svg" },
      { key: "wash", name: "Wash face", emoji: "🧼", img: "assets/img/habits/habit_hands.svg" },
      { key: "bath", name: "Take a bath", emoji: "🛁", img: "assets/img/habits/habit_hands.svg" },
      { key: "comb", name: "Comb hair", emoji: "💇", img: "assets/img/habits/habit_comb.svg" },
      { key: "clothes", name: "Wear clean clothes", emoji: "👕", img: "assets/img/habits/habit_wakeup.svg" },
      { key: "breakfast", name: "Healthy breakfast", emoji: "🥣", img: "assets/img/fruits/art/apple.svg" },
      { key: "water", name: "Drink water", emoji: "💧", img: "assets/img/habits/habit_water.svg" },
      { key: "toys", name: "Tidy toys", emoji: "🧸", img: "assets/img/habits/habit_toys.svg" },
      { key: "room", name: "Clean room", emoji: "🧹", img: "assets/img/habits/habit_toys.svg" },
      { key: "hands", name: "Wash hands", emoji: "🤲", img: "assets/img/habits/habit_hands.svg" },
      { key: "please", name: "Say please", emoji: "🙏", img: "assets/img/habits/habit_help.svg" },
      { key: "thanks", name: "Say thank you", emoji: "😊", img: "assets/img/habits/habit_help.svg" },
      { key: "help", name: "Help parents", emoji: "🤝", img: "assets/img/habits/habit_help.svg" },
      { key: "share", name: "Share with others", emoji: "🎁", img: "assets/img/habits/habit_toys.svg" },
      { key: "kind", name: "Be kind", emoji: "💛", img: "assets/img/habits/habit_help.svg" },
      { key: "exercise", name: "Exercise", emoji: "🤸", img: "assets/img/habits/habit_exercise.svg" },
      { key: "study", name: "Study time", emoji: "📚", img: "assets/img/habits/habit_toys.svg" },
      { key: "bag", name: "Pack school bag", emoji: "🎒", img: "assets/img/objects/good-habits.svg" },
      { key: "sleep", name: "Sleep on time", emoji: "😴", img: "assets/img/habits/habit_sleep.svg" }
    ],

    /* Greetings — situational: someone says X, child replies with the fit. */
    greetings: [
      { prompt: "Your teacher says “Good morning!”. What do you say?", answer: "Good morning!", wrong: ["Good night!", "Goodbye!"] },
      { prompt: "It is bedtime. What do you say?", answer: "Good night!", wrong: ["Good morning!", "Hello!"] },
      { prompt: "Someone gives you a gift. What do you say?", answer: "Thank you!", wrong: ["Sorry!", "Goodbye!"] },
      { prompt: "You want a toy. How do you ask nicely?", answer: "Please!", wrong: ["No!", "Goodbye!"] },
      { prompt: "You bumped into a friend by mistake. What do you say?", answer: "Sorry!", wrong: ["Thank you!", "Hello!"] },
      { prompt: "A friend comes to your house. What do you say?", answer: "Welcome!", wrong: ["Goodbye!", "Sorry!"] },
      { prompt: "You are leaving school. What do you say?", answer: "Goodbye!", wrong: ["Good morning!", "Please!"] },
      { prompt: "You meet a new friend. What do you say?", answer: "Hello!", wrong: ["Sorry!", "Good night!"] }
    ],

    /* Body parts — the body activities use Chiku's photos (js/data/chiku.js); these facts stay for other uses. */
    body: [
      { key: "head", name: "Head", emoji: "🧠", fact: "Head! Inside your head is your brilliant brain that thinks, learns, and dreams!" },
      { key: "eyes", name: "Eyes", emoji: "👀", fact: "Eyes! You use your two bright eyes to see colors, read storybooks, and look at the world!" },
      { key: "ears", name: "Ears", emoji: "👂", fact: "Ears! Your ears help you hear cheerful music, friends laughing, and birds singing!" },
      { key: "nose", name: "Nose", emoji: "👃", fact: "Nose! Your nose helps you smell sweet flowers, warm bakery cookies, and fresh rain!" },
      { key: "mouth", name: "Mouth", emoji: "👄", fact: "Mouth! Your mouth helps you smile, talk, sing songs, and taste delicious fruits!" },
      { key: "hand", name: "Hand", emoji: "✋", fact: "Hands! You have hands and fingers to draw, clap, hug, and build tall towers!" },
      { key: "foot", name: "Foot", emoji: "🦶", fact: "Feet! Your strong feet and legs help you run, jump, dance, and walk everywhere!" },
      { key: "hair", name: "Hair", emoji: "💇", fact: "Hair! Shiny hair keeps your head cozy, warm, and protected from the hot sun!" },
      { key: "teeth", name: "Teeth", emoji: "🦷", fact: "Teeth! Sparkling clean teeth help you chew crunchy apples and healthy food!" },
      { key: "tummy", name: "Tummy", emoji: "🫃", fact: "Tummy! Your tummy digests yummy food and gives your whole body energy to play!" }
    ],

    /* Odd-one-out groups: one item does not belong. All items correlate to real-world objects/creatures with realistic photography. */
    oddGroups: [
      { same: ["🐶", "🐱", "🐰"], odd: "🚗", why: "Not an animal" },
      { same: ["🍎", "🍎", "🍎"], odd: "🍌", why: "Different fruit" },
      { same: ["🚗", "🚕", "🚙"], odd: "🚲", why: "Not a car" },
      { same: ["🐟", "🐠", "🐡"], odd: "🐦", why: "Not a fish" },
      { same: ["🌹", "🌻", "🌷"], odd: "🍄", why: "Not a flower" },
      { same: ["🍏", "🍏", "🍏"], odd: "🥕", why: "Not a fruit" },
      { same: ["🦁", "🐅", "🐻"], odd: "🚆", why: "Not an animal" },
      { same: ["🦜", "🦅", "🦚"], odd: "🐕", why: "Not a bird" },
      { same: ["✈️", "🚁", "🚀"], odd: "🚜", why: "Does not fly in the sky" },
      { same: ["🍓", "🍇", "🍉"], odd: "🥕", why: "Not a fruit" },
      { same: ["🐄", "🐑", "🐎"], odd: "🐟", why: "Not a farm animal" },
      { same: ["🚌", "🚒", "🚑"], odd: "🐒", why: "Not a vehicle" },
      { same: ["🟦", "🟦", "🟦"], odd: "🔺", why: "Different shape" },
      { same: ["⭐", "⭐", "⭐"], odd: "❤️", why: "Different shape" }
    ],

    /* Construction: parts to place onto an outlined structure. */
    builds: [
      {
        name: "bridge", title: "Build a Bridge", frame: "🌊  Build the bridge to cross the river!  🌊",
        theme: "bridge",
        slots: [
          { id: "p1", label: "Left Pillar", emoji: "🏛️",
            art: '<svg viewBox="0 0 80 160" preserveAspectRatio="none" width="100%" height="100%"><rect x="4" y="0" width="72" height="152" rx="4" fill="#64748B"/><rect x="8" y="4" width="64" height="144" rx="2" fill="#94A3B8"/><line x1="4" y1="38" x2="76" y2="38" stroke="#334155" stroke-width="2.5"/><line x1="4" y1="76" x2="76" y2="76" stroke="#334155" stroke-width="2.5"/><line x1="4" y1="114" x2="76" y2="114" stroke="#334155" stroke-width="2.5"/><ellipse cx="40" cy="154" rx="36" ry="6" fill="#38BDF8" opacity="0.6"/></svg>',
            x: 12, y: 46, w: 16, h: 48 },
          { id: "p2", label: "Right Pillar", emoji: "🏛️",
            art: '<svg viewBox="0 0 80 160" preserveAspectRatio="none" width="100%" height="100%"><rect x="4" y="0" width="72" height="152" rx="4" fill="#64748B"/><rect x="8" y="4" width="64" height="144" rx="2" fill="#94A3B8"/><line x1="4" y1="38" x2="76" y2="38" stroke="#334155" stroke-width="2.5"/><line x1="4" y1="76" x2="76" y2="76" stroke="#334155" stroke-width="2.5"/><line x1="4" y1="114" x2="76" y2="114" stroke="#334155" stroke-width="2.5"/><ellipse cx="40" cy="154" rx="36" ry="6" fill="#38BDF8" opacity="0.6"/></svg>',
            x: 72, y: 46, w: 16, h: 48 },
          { id: "deck", label: "Roadway", emoji: "🛣️",
            art: '<svg viewBox="0 0 360 60" preserveAspectRatio="none" width="100%" height="100%"><rect x="0" y="6" width="360" height="38" rx="3" fill="#1E293B"/><rect x="0" y="44" width="360" height="14" fill="#334155"/><line x1="6" y1="25" x2="354" y2="25" stroke="#FDE047" stroke-width="3.5" stroke-dasharray="16 10"/><rect x="0" y="3" width="360" height="4" fill="#DC2626"/></svg>',
            x: 8, y: 32, w: 84, h: 16 },
          { id: "rail", label: "Cables", emoji: "🌉",
            art: '<svg viewBox="0 0 360 80" preserveAspectRatio="none" width="100%" height="100%"><path d="M10 74 Q90 14 180 74 Q270 14 350 74" fill="none" stroke="#EF4444" stroke-width="6" stroke-linecap="round"/><path d="M10 74 Q90 14 180 74 Q270 14 350 74" fill="none" stroke="#FDE047" stroke-width="2" stroke-linecap="round"/><g stroke="#FACC15" stroke-width="2"><line x1="50" y1="46" x2="50" y2="78"/><line x1="90" y1="24" x2="90" y2="78"/><line x1="130" y1="46" x2="130" y2="78"/><line x1="230" y1="46" x2="230" y2="78"/><line x1="270" y1="24" x2="270" y2="78"/><line x1="310" y1="46" x2="310" y2="78"/></g></svg>',
            x: 8, y: 12, w: 84, h: 22 }
        ]
      },
      {
        name: "house", title: "Build a House", frame: "🏡  Put the cozy home together!  🏡",
        theme: "house",
        slots: [
          { id: "wall", label: "Brick Walls", emoji: "🧱",
            art: '<svg viewBox="0 0 240 160" preserveAspectRatio="none" width="100%" height="100%"><rect x="0" y="0" width="240" height="152" rx="4" fill="#DC2626"/><g stroke="#991B1B" stroke-width="1.5" opacity="0.7"><line x1="0" y1="26" x2="240" y2="26"/><line x1="0" y1="52" x2="240" y2="52"/><line x1="0" y1="78" x2="240" y2="78"/><line x1="0" y1="104" x2="240" y2="104"/><line x1="0" y1="130" x2="240" y2="130"/><line x1="30" y1="0" x2="30" y2="26"/><line x1="90" y1="0" x2="90" y2="26"/><line x1="150" y1="0" x2="150" y2="26"/><line x1="210" y1="0" x2="210" y2="26"/><line x1="60" y1="26" x2="60" y2="52"/><line x1="120" y1="26" x2="120" y2="52"/><line x1="180" y1="26" x2="180" y2="52"/><line x1="30" y1="52" x2="30" y2="78"/><line x1="90" y1="52" x2="90" y2="78"/><line x1="150" y1="52" x2="150" y2="78"/><line x1="210" y1="52" x2="210" y2="78"/><line x1="60" y1="78" x2="60" y2="104"/><line x1="120" y1="78" x2="120" y2="104"/><line x1="180" y1="78" x2="180" y2="104"/><line x1="30" y1="104" x2="30" y2="130"/><line x1="90" y1="104" x2="90" y2="130"/><line x1="150" y1="104" x2="150" y2="130"/><line x1="210" y1="104" x2="210" y2="130"/></g><rect x="0" y="146" width="240" height="14" fill="#64748B"/></svg>',
            x: 22, y: 36, w: 56, h: 42 },
          { id: "roof", label: "Cozy Roof", emoji: "🏠",
            art: '<svg viewBox="0 0 280 120" preserveAspectRatio="none" width="100%" height="100%"><rect x="200" y="12" width="26" height="38" fill="#B91C1C"/><rect x="196" y="8" width="34" height="6" rx="2" fill="#7F1D1D"/><circle cx="213" cy="2" r="5" fill="#FFFFFF" opacity="0.8"/><circle cx="218" cy="-6" r="7" fill="#FFFFFF" opacity="0.6"/><polygon points="140,8 8,112 272,112" fill="#EA580C"/><polygon points="140,8 4,114 10,118 140,16" fill="#FDBA74" opacity="0.6"/><rect x="6" y="110" width="268" height="8" rx="2" fill="#9A3412"/><path d="M40 92 Q140 82 240 92" fill="none" stroke="#7C2D12" stroke-width="2.5"/><path d="M72 68 Q140 60 208 68" fill="none" stroke="#7C2D12" stroke-width="2.5"/><path d="M104 44 Q140 38 176 44" fill="none" stroke="#7C2D12" stroke-width="2.5"/><circle cx="140" cy="74" r="14" fill="#1E293B"/><circle cx="140" cy="74" r="11" fill="#FEF08A"/><line x1="140" y1="63" x2="140" y2="85" stroke="#FFFFFF" stroke-width="2"/><line x1="129" y1="74" x2="151" y2="74" stroke="#FFFFFF" stroke-width="2"/></svg>',
            x: 18, y: 8, w: 64, h: 30 },
          { id: "door", label: "Front Door", emoji: "🚪",
            art: '<svg viewBox="0 0 60 100" preserveAspectRatio="none" width="100%" height="100%"><rect x="2" y="2" width="56" height="96" rx="4" fill="#451A03"/><rect x="5" y="5" width="50" height="92" rx="3" fill="#D97706"/><rect x="10" y="12" width="40" height="34" rx="2" fill="#78350F" stroke="#B45309" stroke-width="1.5"/><rect x="10" y="52" width="40" height="38" rx="2" fill="#78350F" stroke="#B45309" stroke-width="1.5"/><circle cx="15" cy="52" r="3.5" fill="#FDE047"/><circle cx="14" cy="51" r="1" fill="#FFFFFF"/></svg>',
            x: 42, y: 52, w: 16, h: 26 },
          { id: "window", label: "Glass Window", emoji: "🪟",
            art: '<svg viewBox="0 0 60 70" preserveAspectRatio="none" width="100%" height="100%"><rect x="2" y="2" width="56" height="60" rx="3" fill="#1E293B"/><rect x="5" y="5" width="50" height="54" rx="2" fill="#FDE047"/><line x1="30" y1="6" x2="30" y2="58" stroke="#FFFFFF" stroke-width="2.5"/><line x1="6" y1="32" x2="54" y2="32" stroke="#FFFFFF" stroke-width="2.5"/><rect x="2" y="58" width="56" height="10" rx="2" fill="#78350F"/><circle cx="12" cy="56" r="3.5" fill="#F43F5E"/><circle cx="24" cy="55" r="4" fill="#FACC15"/><circle cx="36" cy="56" r="3.5" fill="#38BDF8"/><circle cx="48" cy="55" r="4" fill="#F43F5E"/></svg>',
            x: 62, y: 44, w: 14, h: 18 }
        ]
      }
    ],

    /* Words for the running game, grouped by theme + length band. */
    words: {
      animals: ["COW", "CAT", "DOG", "PIG", "FOX", "DEER", "DUCK", "FROG", "LION", "BEAR", "TIGER", "HORSE", "ZEBRA", "SHEEP", "PANDA", "MONKEY", "RABBIT", "ELEPHANT"],
      fruits: ["FIG", "KIWI", "PEAR", "APPLE", "MANGO", "BANANA", "ORANGE", "CHERRY", "GRAPES"],
      vehicles: ["CAR", "BUS", "BIKE", "TRAIN", "TRUCK", "ROCKET"],
      objects: ["CUP", "BALL", "BOOK", "CLOCK", "LAPTOP", "COMPUTER"],
      colors: ["RED", "BLUE", "PINK", "GREEN", "YELLOW"],
      school: ["PEN", "BAG", "DESK", "RULER", "PENCIL", "CRAYON"]
    }

    /* Change #17A: the five linear picture stories (The Helpful Rabbit, The Lost Puppy, The Tidy Room,
       The Little Explorer, The Magic Garden) are interactive adventures now, played by the one StoryEngine —
       see js/data/storyAdventures.js (same story-* activity ids, so progress carries over). */
  };
})(window);
