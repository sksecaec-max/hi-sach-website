/* =========================================================================
   videos.js — Quick Discovery manifest (data only)
   Every short discovery video is one entry here. Adding a video = adding an
   entry (and the file); VideoManager and the discovery activity never change.

   Asset + licence discipline (same rule as assets/audio/audio-manifest.json):
     - `available` stays false until the real MP4 is on disk at `video` AND its
       licence is verified and recorded in `license` + assets/videos/VIDEO-LICENSES.md.
     - While unavailable, the discovery still works as a picture discovery
       (fallback image + spoken fact) — nothing pretends a video exists.
   Classic script (not JSON + fetch) so it loads from file:// in the WebView.

   Entry fields
     id, category, topic, world      identity + which Kido World place it lives in
     ageRange [min,max], difficulty  who it's for
     duration (s), aspect "16:9"     expected clip length / frame shape (no distortion)
     title, fact, wow                what Momo says around the clip
     video, poster, captions         local asset paths (captions = WebVTT, optional)
     available, license              see discipline above
     fallback { image, sound }       picture + real animal sound when no video
              { focus, fit, bg }     optional framing of a square photo in the 16:9 window
                                     (object-position / object-fit / backdrop colour)
     music                           optional background-music mood (else picked by category)
     discovery { activityId, name }  registers a playable activity in the catalog
     followUpGame, followUpFeature   existing activity to continue into (+ item to feature)
     questions [ { bands | default, kind, ask, options[{id,label,art,correct,hint}], praise } ]
       Picked by the child's age band; bands without their own question use `default`.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var VIDEOS = [
    {
      id: "elephant_trunk_001",
      category: "animals", topic: "elephant", world: "jungle",
      ageRange: [3, 6], difficulty: 1,
      duration: 9, aspect: "16:9",
      title: "What can an elephant's trunk do?",
      fact: "Elephants use their trunks to pick things up and drink.",
      wow: "Wow! Did you see that trunk?",
      video: "assets/videos/animals/elephant_trunk_001.mp4",
      poster: null,
      captions: null,
      available: false,          // the MP4 has not been added yet — see VIDEO-LICENSES.md
      license: { source: null, author: null, url: null, license: null, commercialUse: null, attributionRequired: null, verifiedOn: null },
      fallback: { image: "assets/img/animals/elephant.jpg", sound: "elephant" },
      discovery: { activityId: "discovery-elephant", name: "Elephant Discovery" },
      followUpGame: "animal-explore",
      followUpFeature: "elephant",
      questions: [
        {
          default: true,
          bands: ["3-4", "4-5", "5-6"],
          kind: "pick-picture",
          ask: "Wow! What did the elephant use?",
          options: [
            { id: "trunk", label: "Trunk", art: "elephant:trunk", correct: true },
            { id: "tail", label: "Tail", art: "elephant:tail", hint: "That's the tail. Look again!" },
            { id: "ear", label: "Ear", art: "elephant:ear", hint: "That's the ear. Look again!" }
          ],
          praise: "Yes! The elephant used its trunk!"
        }
        // Later: { bands: ["7-8"], kind: "pick-text", ask: "What is one important use of an elephant's trunk?", ... }
      ]
    },

    /* ---- Change #13: picture discoveries ----
       The real public-domain photo (docs/ASSET-LICENSE-MANIFEST.md §6) or a Kido science scene, plus a
       spoken fact. Every entry stays `available: false` until a cleared clip is added. Option art uses
       the shared puzzle art: photo names ("dolphin") and Kido drawings ("moon:5", "thing:clip"). */
    discovery({
      id: "dolphin_001", category: "animals", topic: "dolphin", world: "ocean",
      title: "How do dolphins breathe?",
      fact: "Dolphins live in the sea, but they breathe air through a blowhole on top of their head!",
      wow: "Whoosh! What a big leap!",
      fallback: { image: "assets/img/animals/dolphin.jpg", sound: "dolphin", focus: "50% 18%" },
      discovery: { activityId: "discovery-dolphin", name: "Dolphin Discovery" },
      followUpGame: "puzzle-sealand-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Where does the dolphin live?",
          options: [
            { id: "sea", label: "In the sea", art: "habitat:ocean", correct: true },
            { id: "jungle", label: "In the jungle", art: "habitat:jungle", hint: "That's the jungle. Dolphins need lots of water!" },
            { id: "farm", label: "On the farm", art: "habitat:farm", hint: "That's a farm. Dolphins need lots of water!" }
          ], praise: "Yes! Dolphins live in the sea!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "How does a dolphin breathe?",
          options: [
            { id: "air", label: "It swims up for air", art: "dolphin", correct: true },
            { id: "gills", label: "With gills, like a fish", art: "fish", hint: "Fish breathe with gills. Dolphins are different!" }
          ], praise: "Yes! A dolphin swims up and breathes through its blowhole!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "A dolphin breathes air and feeds its baby milk. What kind of animal is it?",
          options: [
            { id: "mammal", label: "A mammal", correct: true },
            { id: "fish", label: "A fish", hint: "It swims like a fish, but fish don't breathe air or make milk!" },
            { id: "reptile", label: "A reptile", hint: "Most reptiles lay eggs. Dolphin babies are born!" }
          ], praise: "Right! Dolphins are mammals, just like us!" }
      ]
    }),
    discovery({
      id: "whale_001", category: "animals", topic: "whale", world: "ocean",
      title: "Can whales sing?",
      fact: "Humpback whales sing long, deep songs. Their songs travel far under the water!",
      wow: "What a gentle giant!",
      fallback: { image: "assets/img/animals/whale.jpg", sound: "whale", focus: "50% 72%" },
      discovery: { activityId: "discovery-whale", name: "Whale Discovery" },
      followUpGame: "puzzle-match-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the whale?",
          options: [
            { id: "whale", label: "Whale", art: "whale", correct: true },
            { id: "octopus", label: "Octopus", art: "octopus", hint: "That's an octopus. Find the giant one!" },
            { id: "seahorse", label: "Seahorse", art: "seahorse", hint: "That's a little seahorse. Whales are huge!" }
          ], praise: "Yes! That's the whale!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which one is bigger?",
          options: [
            { id: "whale", label: "The whale", art: "whale", correct: true },
            { id: "elephant", label: "The elephant", art: "elephant", hint: "Elephants are the biggest animals on land. But a whale is even bigger!" }
          ], praise: "Yes! A humpback whale is as long as a bus!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Whales live in the sea, but they are not fish. Why?",
          options: [
            { id: "air", label: "They breathe air through blowholes", correct: true },
            { id: "big", label: "They are very big", hint: "Whale sharks are huge too, and they ARE fish!" },
            { id: "tail", label: "They have tails", hint: "Fish have tails too! Think about breathing." }
          ], praise: "That's right! Whales are mammals that breathe air." }
      ]
    }),
    discovery({
      id: "sea_turtle_001", category: "animals", topic: "sea_turtle", world: "ocean",
      title: "Where do sea turtles lay their eggs?",
      fact: "Sea turtles swim in warm seas, but they crawl up onto sandy beaches to lay their eggs!",
      wow: "Look at those flippers!",
      fallback: { image: "assets/img/animals/sea_turtle.jpg", sound: null, focus: "50% 55%" },
      discovery: { activityId: "discovery-sea-turtle", name: "Sea Turtle Discovery" },
      followUpGame: "puzzle-sealand-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the sea turtle?",
          options: [
            { id: "turtle", label: "Sea turtle", art: "sea_turtle", correct: true },
            { id: "frog", label: "Frog", art: "frog", hint: "That's a frog. Look for the shell!" },
            { id: "fish", label: "Fish", art: "fish", hint: "That's a fish. Look for the shell!" }
          ], praise: "Yes! The sea turtle has a shell and flippers!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Where do sea turtles lay their eggs?",
          options: [
            { id: "beach", label: "On a sandy beach", art: "habitat:beach", correct: true },
            { id: "tree", label: "Up in a tree", art: "habitat:jungle", hint: "Birds lay eggs in trees. Turtles dig in the sand!" },
            { id: "ice", label: "On the ice", art: "habitat:ice", hint: "Brr! Sea turtles like it warm. They dig in the sand!" }
          ], praise: "Yes! They dig a nest in the warm sand!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "A sea turtle has scaly skin, breathes air and lays eggs. What kind of animal is it?",
          options: [
            { id: "reptile", label: "A reptile", correct: true },
            { id: "fish", label: "A fish", hint: "Fish breathe with gills. Turtles breathe air!" },
            { id: "mammal", label: "A mammal", hint: "Mammals feed their babies milk. Turtle babies hatch from eggs!" }
          ], praise: "Right! Sea turtles are reptiles, like lizards and snakes." }
      ]
    }),
    discovery({
      id: "bee_001", category: "animals", topic: "bee", world: "village",
      title: "What do bees make?",
      fact: "Bees drink sweet nectar from flowers. Back at the hive, they turn it into honey!",
      wow: "Buzz, buzz! What a busy bee!",
      fallback: { image: "assets/img/animals/bee.jpg", sound: "bee", fit: "contain", bg: "#F5F5F6" },
      discovery: { activityId: "discovery-bee", name: "Bee Discovery" },
      followUpGame: "puzzle-insect-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Where does the bee find its food?",
          options: [
            { id: "flower", label: "A flower", art: "sunflower", correct: true },
            { id: "meat", label: "Meat", art: "meat", hint: "Bees don't eat meat. They visit flowers!" },
            { id: "grass", label: "Grass", art: "grass", hint: "Cows eat grass. Bees visit flowers!" }
          ], praise: "Yes! Bees find sweet nectar in flowers!" },
        { bands: ["5-6", "6-7"], kind: "pick-text", ask: "What do bees make from flower nectar?",
          options: [
            { id: "honey", label: "Honey", correct: true },
            { id: "milk", label: "Milk", hint: "Cows give us milk. Bees make something sweet and sticky!" },
            { id: "juice", label: "Juice", hint: "Juice comes from fruit. Bees make something sweet and sticky!" }
          ], praise: "Yes! Bees make honey!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Bees are insects. How many legs does a bee have?",
          options: [
            { id: "six", label: "Six", correct: true },
            { id: "four", label: "Four", hint: "Cats and dogs have four. Insects have more!" },
            { id: "eight", label: "Eight", hint: "Spiders have eight legs, and spiders aren't insects!" }
          ], praise: "Right! Every insect has six legs." }
      ]
    }),
    discovery({
      id: "butterfly_001", category: "nature", topic: "butterfly", world: "village", music: "garden",
      title: "How does a caterpillar change?",
      fact: "A caterpillar eats and grows. Then it rests inside a chrysalis and comes out as a butterfly!",
      wow: "Ta-da! A butterfly!",
      fallback: { image: "assets/img/science/butterfly-life-cycle.svg", sound: null },
      discovery: { activityId: "discovery-butterfly", name: "Butterfly Discovery" },
      followUpGame: "puzzle-lifecycle-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "What did the caterpillar turn into?",
          options: [
            { id: "butterfly", label: "A butterfly", art: "bug:4", correct: true },
            { id: "egg", label: "An egg", art: "bug:1", hint: "That's the egg. The caterpillar hatched from it!" },
            { id: "bee", label: "A bee", art: "bee", hint: "A bee is a different insect. Look again!" }
          ], praise: "Yes! The caterpillar became a butterfly!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "What comes right before the butterfly?",
          options: [
            { id: "chrysalis", label: "The chrysalis", art: "bug:3", correct: true },
            { id: "egg", label: "The egg", art: "bug:1", hint: "The egg comes first of all!" },
            { id: "caterpillar", label: "The caterpillar", art: "bug:2", hint: "Close! After the caterpillar comes a resting stage." }
          ], praise: "Yes! The chrysalis comes just before the butterfly!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "What happens inside the chrysalis?",
          options: [
            { id: "change", label: "The caterpillar's body changes into a butterfly", correct: true },
            { id: "sleep", label: "The caterpillar just sleeps", hint: "It's not only sleeping! Its whole body is changing." },
            { id: "eggs", label: "The butterfly lays eggs", hint: "Eggs come later, from the grown-up butterfly." }
          ], praise: "Right! That big change is called metamorphosis." }
      ]
    }),
    discovery({
      id: "chameleon_001", category: "animals", topic: "chameleon", world: "jungle",
      title: "How does a chameleon catch bugs?",
      fact: "A chameleon sits very still. Then it shoots out a long, sticky tongue to catch a bug!",
      wow: "Zap! What a tongue!",
      fallback: { image: "assets/img/animals/chameleon.jpg", sound: null, focus: "50% 55%" },
      discovery: { activityId: "discovery-chameleon", name: "Chameleon Discovery" },
      followUpGame: "puzzle-food-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "What does the chameleon like to eat?",
          options: [
            { id: "bugs", label: "Bugs", art: "bugs", correct: true },
            { id: "grass", label: "Grass", art: "grass", hint: "Cows eat grass. Chameleons catch bugs!" },
            { id: "bananas", label: "Bananas", art: "bananas", hint: "Monkeys love bananas. Chameleons catch bugs!" }
          ], praise: "Yes! Chameleons eat bugs!" },
        { bands: ["5-6", "6-7"], kind: "pick-text", ask: "How does a chameleon catch a bug?",
          options: [
            { id: "tongue", label: "With its sticky tongue", correct: true },
            { id: "tail", label: "With its curly tail", hint: "Its curly tail holds on to branches!" },
            { id: "run", label: "By running fast", hint: "Chameleons move slowly. Their tongue is super fast!" }
          ], praise: "Yes! Its tongue is super fast and sticky!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "A chameleon's eyes are special. What can they do?",
          options: [
            { id: "two", label: "Look two different ways at once", correct: true },
            { id: "walls", label: "See through walls", hint: "No animal can do that!" },
            { id: "glow", label: "Glow in the dark", hint: "They don't glow, but each eye can move on its own!" }
          ], praise: "Right! Each eye can look in a different direction." }
      ]
    }),
    discovery({
      id: "magnets_001", category: "science", topic: "magnets", world: "lab", music: "playful",
      title: "What can a magnet pick up?",
      fact: "Magnets pull things made of iron and steel, like paper clips and nails!",
      wow: "Click! It stuck!",
      fallback: { image: "assets/img/science/magnet.svg", sound: null },
      discovery: { activityId: "discovery-magnets", name: "Magnet Discovery" },
      followUpGame: "puzzle-magnet-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one will the magnet pull?",
          options: [
            { id: "clip", label: "Paper clip", art: "thing:clip", correct: true },
            { id: "duck", label: "Rubber duck", art: "thing:duck", hint: "Rubber isn't metal. Try again!" },
            { id: "leaf", label: "Leaf", art: "thing:leaf", hint: "A leaf isn't metal. Try again!" }
          ], praise: "Yes! The paper clip sticks to the magnet!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which one will stick to the magnet?",
          options: [
            { id: "nail", label: "Nail", art: "thing:nail", correct: true },
            { id: "block", label: "Wooden block", art: "thing:block", hint: "Wood doesn't stick to magnets." },
            { id: "crayon", label: "Crayon", art: "thing:crayon", hint: "A crayon is made of wax. No pull!" }
          ], praise: "Yes! The iron nail sticks!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-picture", ask: "Why does a nail stick to a magnet?",
          options: [
            { id: "iron", label: "It's made of iron", art: "thing:nail", correct: true },
            { id: "thin", label: "It's long and thin", art: "thing:crayon", hint: "A crayon is long and thin too, but it doesn't stick!" },
            { id: "shiny", label: "It's shiny", art: "thing:marble", hint: "A glass marble is shiny, but it doesn't stick!" }
          ], praise: "Right! Magnets pull iron, not just anything shiny." }
      ]
    }),
    discovery({
      id: "float_sink_001", category: "science", topic: "floating", world: "lab", music: "playful",
      title: "Will it float or sink?",
      fact: "Light things float on top of the water. Heavy, solid things sink to the bottom!",
      wow: "Splash! Did you see that?",
      fallback: { image: "assets/img/science/float-or-sink.svg", sound: null },
      discovery: { activityId: "discovery-float", name: "Float or Sink Discovery" },
      followUpGame: "puzzle-float-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one floats?",
          options: [
            { id: "duck", label: "Rubber duck", art: "thing:duck", correct: true },
            { id: "rock", label: "Rock", art: "rock", hint: "A rock is heavy. It sinks!" },
            { id: "coin", label: "Coin", art: "thing:coin", hint: "A coin is metal. It sinks!" }
          ], praise: "Yes! The rubber duck floats!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which one sinks?",
          options: [
            { id: "key", label: "Key", art: "thing:key", correct: true },
            { id: "duck", label: "Rubber duck", art: "thing:duck", hint: "The duck is full of air. It floats!" },
            { id: "leaf", label: "Leaf", art: "thing:leaf", hint: "A leaf is light. It floats!" }
          ], praise: "Yes! The metal key sinks!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "An apple floats in water. Why?",
          options: [
            { id: "air", label: "It has air inside", correct: true },
            { id: "red", label: "It is red", hint: "Color doesn't matter. A red marble would sink!" },
            { id: "round", label: "It is round", hint: "A marble is round too, but it sinks!" }
          ], praise: "Right! The air inside an apple helps it float." }
      ]
    }),
    discovery({
      id: "moon_001", category: "space", topic: "moon", world: "space", music: "space",
      title: "Why does the moon change shape?",
      fact: "The moon doesn't really change shape. Each night we see a different amount of its sunny side!",
      wow: "Look at all those moons!",
      fallback: { image: "assets/img/science/moon-phases.svg", sound: null },
      discovery: { activityId: "discovery-moon", name: "Moon Discovery" },
      followUpGame: "puzzle-moon-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the full moon?",
          options: [
            { id: "full", label: "Full moon", art: "moon:5", correct: true },
            { id: "crescent", label: "Crescent moon", art: "moon:2", hint: "That's a thin crescent. Find the big round one!" },
            { id: "half", label: "Half moon", art: "moon:3", hint: "That's half a moon. Find the big round one!" }
          ], praise: "Yes! The full moon is big and round!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which one is a crescent moon?",
          options: [
            { id: "crescent", label: "Crescent moon", art: "moon:2", correct: true },
            { id: "full", label: "Full moon", art: "moon:5", hint: "That's the full moon. A crescent is thin, like a smile!" },
            { id: "gibbous", label: "Almost full", art: "moon:4", hint: "That's almost full. A crescent is thin, like a smile!" }
          ], praise: "Yes! A crescent is a thin slice of moon!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "What makes the moon shine?",
          options: [
            { id: "sun", label: "Sunlight bouncing off it", correct: true },
            { id: "fire", label: "Its own fire", hint: "The moon has no fire. Something else lights it up!" },
            { id: "stars", label: "Light from the stars", hint: "The stars are too far away. It's our closest star, the Sun!" }
          ], praise: "Right! The Sun lights up the moon." }
      ]
    }),
    discovery({
      id: "rocket_001", category: "space", topic: "rocket", world: "space", music: "space",
      duration: 12, available: true,     // assets/videos/space/rocket_001.mp4 — NASA, public domain (VIDEO-LICENSES.md)
      license: { source: "Wikimedia Commons (NASA)", author: "NASA", url: "https://commons.wikimedia.org/wiki/File:Artemis_II_Launch_2026.webm",
        license: "Public domain (U.S. federal government work)", commercialUse: true, attributionRequired: false, verifiedOn: "2026-10-04" },
      title: "Where do rockets go?",
      fact: "A rocket's engines roar and push it up, up, up, past the clouds and into space!",
      wow: "3, 2, 1... blast off!",
      fallback: { image: "assets/img/space/rocket-launch.jpg", sound: null, focus: "50% 28%" },
      discovery: { activityId: "discovery-rocket", name: "Rocket Discovery" },
      followUpGame: "puzzle-moon-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Where is the rocket going?",
          options: [
            { id: "space", label: "To space", art: "moon:5", correct: true },
            { id: "sea", label: "Into the sea", art: "habitat:ocean", hint: "Boats go on the sea. Rockets go up, up, up!" },
            { id: "farm", label: "To the farm", art: "habitat:farm", hint: "Tractors go to the farm. Rockets go up, up, up!" }
          ], praise: "Yes! The rocket is going to space!" },
        { bands: ["5-6", "6-7"], kind: "pick-text", ask: "Who rides a rocket to space?",
          options: [
            { id: "astronauts", label: "Astronauts", correct: true },
            { id: "divers", label: "Divers", hint: "Divers explore under the sea!" },
            { id: "farmers", label: "Farmers", hint: "Farmers grow our food!" }
          ], praise: "Yes! Astronauts fly to space!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Why does a rocket need such powerful engines?",
          options: [
            { id: "gravity", label: "To push away from Earth's pull (gravity)", correct: true },
            { id: "warm", label: "To keep the astronauts warm", hint: "The engines push the rocket. Think about what pulls things down!" },
            { id: "loud", label: "To make a big noise", hint: "It IS loud, but the push is what matters. What pulls things down?" }
          ], praise: "Right! A rocket must push hard to escape Earth's gravity." }
      ]
    }),
    discovery({
      id: "earth_001", category: "space", topic: "earth", world: "space", music: "space",
      title: "What does Earth look like from space?",
      fact: "From space, Earth looks like a big blue marble. The blue is ocean and the white swirls are clouds!",
      wow: "That's our home!",
      fallback: { image: "assets/img/space/earth.jpg", sound: null, fit: "contain", bg: "#030303" },
      discovery: { activityId: "discovery-earth", name: "Earth Discovery" },
      followUpGame: "puzzle-sealand-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is our Earth?",
          options: [
            { id: "earth", label: "Earth", art: "earth", correct: true },
            { id: "moon", label: "The Moon", art: "moon:5", hint: "That's the Moon. Our Earth is blue!" }
          ], praise: "Yes! That's our Earth!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "What covers most of the Earth?",
          options: [
            { id: "water", label: "Water", art: "habitat:ocean", correct: true },
            { id: "grass", label: "Grassland", art: "habitat:savanna", hint: "There's lots of land, but even more water!" },
            { id: "ice", label: "Ice", art: "habitat:ice", hint: "There's ice at the top and bottom, but most of Earth is water!" }
          ], praise: "Yes! Most of the Earth is covered by water!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Why does Earth look blue from space?",
          options: [
            { id: "ocean", label: "Most of it is covered by ocean", correct: true },
            { id: "paint", label: "The sky is painted blue", hint: "Nobody painted it! What covers most of the Earth?" },
            { id: "rock", label: "It's made of blue rock", hint: "Earth's rock is mostly brown and grey. What else is blue?" }
          ], praise: "Right! Oceans cover most of our planet." }
      ]
    }),

    /* ---- Change #22: the Sun and the planets — Kido's own drawings (js/art/puzzleArt.js → assets/img/space) ---- */
    discovery({
      id: "sun_001", category: "space", topic: "sun", world: "space", music: "space",
      title: "What is the Sun?",
      fact: "The Sun is a star, a giant ball of hot glowing gas. It gives Earth light and warmth, and all the planets travel around it!",
      wow: "So bright and warm!",
      fallback: { image: "assets/img/space/planet-sun.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-sun", name: "Sun Discovery" },
      followUpGame: "solar-system",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the Sun?",
          options: [
            { id: "sun", label: "The Sun", art: "planet:sun", correct: true },
            { id: "earth", label: "Earth", art: "planet:earth", hint: "That's Earth, our home. Find the bright yellow one!" },
            { id: "moon", label: "The Moon", art: "moon:5", hint: "That's the Moon. The Sun is the big, bright one!" }
          ], praise: "Yes! That's the Sun!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "What does the Sun give us?",
          options: [
            { id: "light", label: "Light and warmth", art: "planet:sun", correct: true },
            { id: "rain", label: "Rain", art: "habitat:pond", hint: "Rain comes from clouds. What does the Sun give us?" }
          ], praise: "Yes! The Sun gives us light and keeps us warm!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "The Sun looks small in the sky. Why?",
          options: [
            { id: "far", label: "It is very far away", correct: true },
            { id: "small", label: "It is really small", hint: "The Sun is huge: 109 Earths would fit across it!" },
            { id: "night", label: "It goes to sleep at night", hint: "The Sun is always shining. Why does it look small?" }
          ], praise: "Right! The Sun is enormous, but it is very far away." }
      ]
    }),
    discovery({
      id: "mercury_001", category: "space", topic: "mercury", world: "space", music: "space",
      title: "Which planet is closest to the Sun?",
      fact: "Mercury is the smallest planet and the closest one to the Sun. It zooms around the Sun faster than any other planet!",
      wow: "Zoom! So fast!",
      fallback: { image: "assets/img/space/planet-mercury.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-mercury", name: "Mercury Discovery" },
      followUpGame: "puzzle-planetorder-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is Mercury?",
          options: [
            { id: "mercury", label: "Mercury", art: "planet:mercury", correct: true },
            { id: "jupiter", label: "Jupiter", art: "planet:jupiter", hint: "That's big stripy Jupiter. Find the little grey one!" },
            { id: "saturn", label: "Saturn", art: "planet:saturn", hint: "That's Saturn with its rings. Find the little grey one!" }
          ], praise: "Yes! Little grey Mercury!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which planet is smaller?",
          options: [
            { id: "mercury", label: "Mercury", art: "planet:mercury", correct: true },
            { id: "earth", label: "Earth", art: "planet:earth", hint: "Earth is bigger. Mercury is the smallest planet!" }
          ], praise: "Yes! Mercury is the smallest planet!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Mercury goes around the Sun in only 88 days. Why is its year so short?",
          options: [
            { id: "close", label: "It is closest to the Sun, so its path is short", correct: true },
            { id: "small", label: "Small planets always have short years", hint: "It's not about size. Think about how far it is from the Sun!" },
            { id: "spin", label: "It spins very fast", hint: "Spinning makes a day. A year is one trip around the Sun!" }
          ], praise: "Right! The closest planet has the shortest trip around the Sun." }
      ]
    }),
    discovery({
      id: "venus_001", category: "space", topic: "venus", world: "space", music: "space",
      title: "Which planet is the hottest?",
      fact: "Venus is wrapped in thick yellow clouds that trap the Sun's heat. That makes it the hottest planet of all!",
      wow: "Phew, so hot!",
      fallback: { image: "assets/img/space/planet-venus.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-venus", name: "Venus Discovery" },
      followUpGame: "planet-find",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is Venus?",
          options: [
            { id: "venus", label: "Venus", art: "planet:venus", correct: true },
            { id: "neptune", label: "Neptune", art: "planet:neptune", hint: "That's blue Neptune. Find the cloudy yellow one!" },
            { id: "mars", label: "Mars", art: "planet:mars", hint: "That's red Mars. Find the cloudy yellow one!" }
          ], praise: "Yes! Cloudy Venus!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which planet is the hottest?",
          options: [
            { id: "venus", label: "Venus", art: "planet:venus", correct: true },
            { id: "mercury", label: "Mercury", art: "planet:mercury", hint: "Mercury is closer to the Sun, but Venus's clouds trap more heat!" }
          ], praise: "Yes! Venus is the hottest planet!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Mercury is closer to the Sun, so why is Venus hotter?",
          options: [
            { id: "clouds", label: "Its thick clouds trap the heat", correct: true },
            { id: "bigger", label: "Venus is bigger than the Sun", hint: "The Sun is far bigger than any planet! Think about Venus's clouds." },
            { id: "fire", label: "Venus is on fire", hint: "Nothing is burning. Its clouds work like a thick blanket!" }
          ], praise: "Right! Venus's thick air traps heat like a blanket." }
      ]
    }),
    discovery({
      id: "mars_001", category: "space", topic: "mars", world: "space", music: "space",
      title: "Why is Mars red?",
      fact: "Mars is called the Red Planet. Its ground is covered in rusty red dust, and it has the biggest volcano in the whole Solar System!",
      wow: "Look how red it is!",
      fallback: { image: "assets/img/space/planet-mars.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-mars", name: "Mars Discovery" },
      followUpGame: "planet-find",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is red Mars?",
          options: [
            { id: "mars", label: "Mars", art: "planet:mars", correct: true },
            { id: "earth", label: "Earth", art: "planet:earth", hint: "That's Earth. Find the red one!" },
            { id: "uranus", label: "Uranus", art: "planet:uranus", hint: "That's Uranus. Find the red one!" }
          ], praise: "Yes! Mars is red!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which planet is next to Mars, closer to the Sun?",
          options: [
            { id: "earth", label: "Earth", art: "planet:earth", correct: true },
            { id: "neptune", label: "Neptune", art: "planet:neptune", hint: "Neptune is far, far away. Mars is the 4th planet. Which is 3rd?" }
          ], praise: "Yes! Earth is the 3rd planet, and Mars is the 4th!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Why does Mars look red?",
          options: [
            { id: "rust", label: "Its dust has rusty iron in it", correct: true },
            { id: "hot", label: "It is very hot", hint: "Mars is actually colder than Earth! Think about its dust." },
            { id: "light", label: "The Sun shines red light on it", hint: "The Sun's light is the same for every planet. What's on Mars's ground?" }
          ], praise: "Right! Rusty dust makes Mars red." }
      ]
    }),
    discovery({
      id: "jupiter_001", category: "space", topic: "jupiter", world: "space", music: "space",
      title: "Which planet is the biggest?",
      fact: "Jupiter is the biggest planet. It is a giant ball of gas with colourful stripes, and its Great Red Spot is a storm wider than Earth!",
      wow: "What a giant!",
      fallback: { image: "assets/img/space/planet-jupiter.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-jupiter", name: "Jupiter Discovery" },
      followUpGame: "puzzle-planetmatch-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is Jupiter?",
          options: [
            { id: "jupiter", label: "Jupiter", art: "planet:jupiter", correct: true },
            { id: "mercury", label: "Mercury", art: "planet:mercury", hint: "That's little Mercury. Find the big stripy one!" },
            { id: "venus", label: "Venus", art: "planet:venus", hint: "That's Venus. Find the one with stripes and a red spot!" }
          ], praise: "Yes! Big stripy Jupiter!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which planet is bigger?",
          options: [
            { id: "jupiter", label: "Jupiter", art: "planet:jupiter", correct: true },
            { id: "earth", label: "Earth", art: "planet:earth", hint: "Earth is much smaller. Jupiter is the biggest planet!" }
          ], praise: "Yes! Jupiter is the biggest planet of all!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "About how many Earths would fit across Jupiter?",
          options: [
            { id: "11", label: "About 11", correct: true },
            { id: "2", label: "About 2", hint: "Jupiter is much bigger than that! Picture Earths in a row." },
            { id: "1000", label: "About 1,000", hint: "That's too many to fit across. Picture Earths side by side in one row!" }
          ], praise: "Right! About 11 Earths would fit across Jupiter." }
      ]
    }),
    discovery({
      id: "saturn_001", category: "space", topic: "saturn", world: "space", music: "space",
      title: "What are Saturn's rings made of?",
      fact: "Saturn has the biggest rings of any planet. They are made of billions of pieces of ice and rock, all circling around the planet!",
      wow: "Look at those rings!",
      fallback: { image: "assets/img/space/planet-saturn.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-saturn", name: "Saturn Discovery" },
      followUpGame: "puzzle-planetmatch-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is Saturn?",
          options: [
            { id: "saturn", label: "Saturn", art: "planet:saturn", correct: true },
            { id: "mars", label: "Mars", art: "planet:mars", hint: "That's Mars. Find the planet with rings!" },
            { id: "earth", label: "Earth", art: "planet:earth", hint: "That's Earth. Find the planet with rings!" }
          ], praise: "Yes! Saturn has rings!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "What are Saturn's rings made of?",
          options: [
            { id: "ice", label: "Ice and rock", art: "habitat:ice", correct: true },
            { id: "fire", label: "Fire", art: "planet:sun", hint: "No fire! The rings are cold. Think icy!" }
          ], praise: "Yes! The rings are made of ice and rock!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Saturn is huge, but it could float in a giant bathtub. Why?",
          options: [
            { id: "light", label: "It is made of light gas", correct: true },
            { id: "rings", label: "Its rings hold it up", hint: "The rings are separate pieces of ice and rock. What is Saturn made of?" },
            { id: "hollow", label: "It is empty inside", hint: "It's not empty. It's made of very light gas!" }
          ], praise: "Right! Saturn is so light for its size that it would float." }
      ]
    }),
    discovery({
      id: "uranus_001", category: "space", topic: "uranus", world: "space", music: "space",
      title: "Which planet spins on its side?",
      fact: "Uranus is a cold, light blue ice giant. It is tipped right over, so it rolls around the Sun on its side!",
      wow: "Rolling along!",
      fallback: { image: "assets/img/space/planet-uranus.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-uranus", name: "Uranus Discovery" },
      followUpGame: "puzzle-spacemissing-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is Uranus?",
          options: [
            { id: "uranus", label: "Uranus", art: "planet:uranus", correct: true },
            { id: "jupiter", label: "Jupiter", art: "planet:jupiter", hint: "That's Jupiter. Find the light blue one!" },
            { id: "mars", label: "Mars", art: "planet:mars", hint: "That's red Mars. Find the light blue one!" }
          ], praise: "Yes! Light blue Uranus!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which planet spins on its side?",
          options: [
            { id: "uranus", label: "Uranus", art: "planet:uranus", correct: true },
            { id: "earth", label: "Earth", art: "planet:earth", hint: "Earth spins standing almost straight up. Find the tipped-over planet!" }
          ], praise: "Yes! Uranus spins on its side!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Uranus is very far from the Sun. What is it like there?",
          options: [
            { id: "cold", label: "Very cold", correct: true },
            { id: "hot", label: "Very hot", hint: "Far from the Sun means very little warmth!" },
            { id: "sunny", label: "Bright and sunny", hint: "The Sun looks tiny from Uranus. It gets very little light and heat." }
          ], praise: "Right! Uranus is an icy, freezing world." }
      ]
    }),
    discovery({
      id: "neptune_001", category: "space", topic: "neptune", world: "space", music: "space",
      title: "Which planet is farthest from the Sun?",
      fact: "Neptune is the farthest planet from the Sun. This deep blue ice giant has the fastest winds in the whole Solar System!",
      wow: "Whoosh! What a wind!",
      fallback: { image: "assets/img/space/planet-neptune.svg", sound: null, fit: "contain", bg: "#0E1238" },
      discovery: { activityId: "discovery-neptune", name: "Neptune Discovery" },
      followUpGame: "puzzle-planetorder-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is Neptune?",
          options: [
            { id: "neptune", label: "Neptune", art: "planet:neptune", correct: true },
            { id: "sun", label: "The Sun", art: "planet:sun", hint: "That's the Sun. Find the deep blue planet!" },
            { id: "saturn", label: "Saturn", art: "planet:saturn", hint: "That's Saturn. Find the deep blue planet!" }
          ], praise: "Yes! Deep blue Neptune!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which planet is farther from the Sun?",
          options: [
            { id: "neptune", label: "Neptune", art: "planet:neptune", correct: true },
            { id: "mercury", label: "Mercury", art: "planet:mercury", hint: "Mercury is the closest! Neptune is the farthest." }
          ], praise: "Yes! Neptune is the farthest planet!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Neptune takes 165 Earth years to go around the Sun once. Why so long?",
          options: [
            { id: "far", label: "It is very far away, so its path is huge", correct: true },
            { id: "heavy", label: "It is too heavy to move fast", hint: "It's not about weight. Think about how big its path is!" },
            { id: "stops", label: "It stops to rest", hint: "Planets never stop! Think about how far it has to travel." }
          ], praise: "Right! The farther a planet is, the longer its trip around the Sun." }
      ]
    }),
    /* ---- Change #21: nature & living world — public-domain photos and recordings (docs/ASSET-LICENSE-MANIFEST.md §13) ---- */
    discovery({
      id: "kangaroo_001", category: "animals", topic: "kangaroo", world: "jungle",
      title: "Where does a baby kangaroo ride?",
      fact: "A baby kangaroo is called a joey. It rides in a cosy pouch on its mother's tummy!",
      wow: "Boing! Look at those big feet!",
      fallback: { image: "assets/img/animals/kangaroo.jpg", sound: null },
      discovery: { activityId: "discovery-kangaroo", name: "Kangaroo Discovery" },
      followUpGame: "puzzle-groups-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the kangaroo?",
          options: [
            { id: "kangaroo", label: "Kangaroo", art: "kangaroo", correct: true },
            { id: "koala", label: "Koala", art: "koala", hint: "That's a koala. Find the one with big feet for hopping!" },
            { id: "rabbit", label: "Rabbit", art: "rabbit", hint: "That's a rabbit. Find the big one!" }
          ], praise: "Yes! That's the kangaroo!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "How does a kangaroo get around?",
          options: [
            { id: "hop", label: "It hops", art: "kangaroo", correct: true },
            { id: "swim", label: "It swims", art: "habitat:ocean", hint: "Kangaroos live on dry land. Think about those big back legs!" },
            { id: "fly", label: "It flies", art: "habitat:sky", hint: "No wings! Think about those big back legs!" }
          ], praise: "Yes! Kangaroos hop on their strong back legs!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "A kangaroo mother carries her joey in a pouch and feeds it milk. What kind of animal is she?",
          options: [
            { id: "mammal", label: "A mammal", correct: true },
            { id: "bird", label: "A bird", hint: "Birds have feathers and lay eggs. Kangaroos have fur!" },
            { id: "reptile", label: "A reptile", hint: "Reptiles have scales. Kangaroos have fur and make milk!" }
          ], praise: "Right! Kangaroos are mammals with a pouch, called marsupials." }
      ]
    }),
    discovery({
      id: "cardinal_001", category: "birds", topic: "cardinal", world: "village",
      title: "Why does the cardinal sing?",
      fact: "This bright red bird is a cardinal. It sings its whistling song all year round, even in snowy winter!",
      wow: "What a bright red bird!",
      fallback: { image: "assets/img/animals/cardinal.jpg", sound: "cardinal" },
      discovery: { activityId: "discovery-cardinal", name: "Cardinal Discovery" },
      followUpGame: "bird-explore", followUpFeature: "cardinal",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which bird is the cardinal?",
          options: [
            { id: "cardinal", label: "Cardinal", art: "cardinal", correct: true },
            { id: "blue_jay", label: "Blue jay", art: "blue_jay", hint: "That's a blue jay. Look for the red one!" },
            { id: "penguin", label: "Penguin", art: "penguin", hint: "That's a penguin. Look for the red one!" }
          ], praise: "Yes! The cardinal is bright red!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which one is also a bird?",
          options: [
            { id: "robin", label: "Robin", art: "robin", correct: true },
            { id: "squirrel", label: "Squirrel", art: "squirrel", hint: "A squirrel lives in trees too, but it has fur, not feathers!" },
            { id: "firefly", label: "Firefly", art: "firefly", hint: "A firefly can fly, but it's an insect with six legs!" }
          ], praise: "Yes! A robin has feathers and wings, just like a cardinal!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Many birds fly away for the winter. What does the cardinal do?",
          options: [
            { id: "stays", label: "It stays and keeps singing", correct: true },
            { id: "sleeps", label: "It sleeps all winter", hint: "Some animals sleep all winter, but cardinals stay awake!" },
            { id: "swims", label: "It swims to a warm sea", hint: "Cardinals don't swim! They stay near home." }
          ], praise: "Right! Cardinals stay all year and eat seeds in winter." }
      ]
    }),
    discovery({
      id: "sea_otter_001", category: "animals", topic: "sea_otter", world: "ocean",
      title: "How do sea otters sleep?",
      fact: "Sea otters float on their backs. When they sleep, they hold hands so they don't drift apart!",
      wow: "So fluffy!",
      fallback: { image: "assets/img/animals/sea_otter.jpg", sound: null },
      discovery: { activityId: "discovery-sea-otter", name: "Sea Otter Discovery" },
      followUpGame: "puzzle-sealand-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Where does the sea otter live?",
          options: [
            { id: "sea", label: "In the sea", art: "habitat:ocean", correct: true },
            { id: "desert", label: "In the desert", art: "habitat:savanna", hint: "That's too dry! Sea otters love water!" },
            { id: "farm", label: "On the farm", art: "habitat:farm", hint: "That's a farm. Sea otters love water!" }
          ], praise: "Yes! Sea otters live in the sea!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which one is the sea otter?",
          options: [
            { id: "otter", label: "Sea otter", art: "sea_otter", correct: true },
            { id: "seal", label: "Seal", art: "seal", hint: "That's a seal. Sea otters have fluffy fur and little paws!" },
            { id: "walrus", label: "Walrus", art: "walrus", hint: "That's a walrus, with long tusks. Find the fluffy one!" }
          ], praise: "Yes! That's the sea otter!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Sea otters have no fat to keep warm in cold water. What keeps them warm?",
          options: [
            { id: "fur", label: "Very thick fur", correct: true },
            { id: "shell", label: "A hard shell", hint: "Otters don't have shells. Think soft!" },
            { id: "sun", label: "Lying in the sun all day", hint: "They spend most of their time in cold water. What covers their body?" }
          ], praise: "Right! Sea otters have the thickest fur of any animal." }
      ]
    }),
    discovery({
      id: "firefly_001", category: "animals", topic: "firefly", world: "village", music: "garden",
      title: "Why do fireflies glow?",
      fact: "Fireflies make their own light! They blink their glowing tails to talk to each other on summer nights.",
      wow: "Blink, blink! A tiny light!",
      fallback: { image: "assets/img/animals/firefly.jpg", sound: null },
      discovery: { activityId: "discovery-firefly", name: "Firefly Discovery" },
      followUpGame: "puzzle-insect-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the firefly?",
          options: [
            { id: "firefly", label: "Firefly", art: "firefly", correct: true },
            { id: "bee", label: "Bee", art: "bee", hint: "That's a bee. Find the firefly!" },
            { id: "ant", label: "Ant", art: "ant", hint: "That's an ant. Find the firefly!" }
          ], praise: "Yes! That's the firefly!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "When do fireflies glow?",
          options: [
            { id: "night", label: "At night", art: "moon:5", correct: true },
            { id: "sea", label: "Under the sea", art: "habitat:ocean", hint: "Fireflies live on land. When is it dark?" }
          ], praise: "Yes! You can see their lights when it's dark!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Why do fireflies blink their lights?",
          options: [
            { id: "talk", label: "To signal to other fireflies", correct: true },
            { id: "read", label: "So they can read at night", hint: "Fireflies can't read! Who do they want to see the light?" },
            { id: "warm", label: "To keep warm", hint: "Firefly light is cold light. It's a message!" }
          ], praise: "Right! Each kind of firefly blinks its own pattern." }
      ]
    }),
    discovery({
      id: "tortoise_001", category: "animals", topic: "tortoise", world: "jungle",
      title: "How long can a tortoise live?",
      fact: "Tortoises walk slowly and carry their home on their back. Some live for more than 100 years!",
      wow: "Slow and steady!",
      fallback: { image: "assets/img/animals/tortoise.jpg", sound: null },
      discovery: { activityId: "discovery-tortoise", name: "Tortoise Discovery" },
      followUpGame: "puzzle-groups-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the tortoise?",
          options: [
            { id: "tortoise", label: "Tortoise", art: "tortoise", correct: true },
            { id: "iguana", label: "Iguana", art: "iguana", hint: "That's an iguana. Look for the shell!" },
            { id: "crab", label: "Crab", art: "crab", hint: "That's a crab. Look for the big round shell!" }
          ], praise: "Yes! The tortoise has a big shell!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Where does a desert tortoise live?",
          options: [
            { id: "dry", label: "On dry land", art: "habitat:savanna", correct: true },
            { id: "sea", label: "In the sea", art: "habitat:ocean", hint: "Sea turtles swim in the sea. Tortoises live on land!" },
            { id: "ice", label: "On the ice", art: "habitat:ice", hint: "Brrr! Tortoises like it warm and dry." }
          ], praise: "Yes! Tortoises live on land. They can't swim like sea turtles!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "A tortoise has scaly skin and hatches from an egg. What kind of animal is it?",
          options: [
            { id: "reptile", label: "A reptile", correct: true },
            { id: "mammal", label: "A mammal", hint: "Mammals have fur and feed babies milk. Tortoises hatch from eggs!" },
            { id: "insect", label: "An insect", hint: "Insects are small, with six legs. Tortoises have four!" }
          ], praise: "Right! Tortoises are reptiles, like lizards and snakes." }
      ]
    }),
    discovery({
      id: "grasshopper_001", category: "animals", topic: "grasshopper", world: "village", music: "garden",
      title: "How does a grasshopper sing?",
      fact: "Listen! Grasshoppers sing by rubbing their back legs against their wings. Then they jump far with those strong legs!",
      wow: "What a jumper!",
      fallback: { image: "assets/img/animals/grasshopper.jpg", sound: "grasshopper" },
      discovery: { activityId: "discovery-grasshopper", name: "Grasshopper Discovery" },
      followUpGame: "puzzle-legs-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the grasshopper?",
          options: [
            { id: "grasshopper", label: "Grasshopper", art: "grasshopper", correct: true },
            { id: "ladybug", label: "Ladybug", art: "ladybug", hint: "That's a ladybug. Find the green jumper!" },
            { id: "frog", label: "Frog", art: "frog", hint: "Frogs jump too! But find the insect!" }
          ], praise: "Yes! That's the grasshopper!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "How many legs does a grasshopper have?",
          options: [
            { id: "six", label: "6 legs", art: "num:6", correct: true },
            { id: "four", label: "4 legs", art: "num:4", hint: "Grasshoppers are insects. How many legs do insects have?" },
            { id: "two", label: "2 legs", art: "num:2", hint: "Birds have two legs. Grasshoppers are insects!" }
          ], praise: "Yes! Six legs, like every insect!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "How does a grasshopper make its chirping sound?",
          options: [
            { id: "legs", label: "By rubbing its legs on its wings", correct: true },
            { id: "mouth", label: "By singing with its mouth", hint: "Grasshoppers don't sing like birds. Think about their legs!" },
            { id: "clap", label: "By clapping its feelers", hint: "Close! It does use body parts, but not its feelers." }
          ], praise: "Right! The bumpy back leg scrapes the wing, like a bow on a violin." }
      ]
    }),
    discovery({
      id: "dandelion_001", category: "flowers", topic: "dandelion", world: "village", music: "garden",
      title: "Where do dandelion seeds go?",
      fact: "A yellow dandelion turns into a fluffy white ball. Each fluff is a seed with a tiny parachute that floats away on the wind!",
      wow: "Make a wish and blow!",
      fallback: { image: "assets/img/flowers/dandelion.jpg", sound: null },
      discovery: { activityId: "discovery-dandelion", name: "Dandelion Discovery" },
      followUpGame: "puzzle-missing-003",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which flower is the dandelion?",
          options: [
            { id: "dandelion", label: "Dandelion", art: "dandelion", correct: true },
            { id: "rose", label: "Rose", art: "rose", hint: "That's a rose. Find the fluffy one!" },
            { id: "lavender", label: "Lavender", art: "lavender", hint: "That's lavender. Find the fluffy one!" }
          ], praise: "Yes! That's the dandelion!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "What carries dandelion seeds far away?",
          options: [
            { id: "wind", label: "The wind", art: "habitat:sky", correct: true },
            { id: "sea", label: "The sea", art: "habitat:ocean", hint: "Dandelion seeds are light and fluffy. What blows them?" }
          ], praise: "Yes! The wind blows the fluffy seeds far away!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Why does a dandelion seed have a fluffy parachute?",
          options: [
            { id: "spread", label: "So the wind carries it to a new place to grow", correct: true },
            { id: "warm", label: "To keep it warm", hint: "Think about what happens when you blow on it!" },
            { id: "pretty", label: "Just to look pretty", hint: "It's pretty, but it has a job! Where do the seeds go?" }
          ], praise: "Right! Spreading seeds helps new dandelions grow in new places." }
      ]
    }),
    discovery({
      id: "pomegranate_001", category: "nature", topic: "pomegranate", world: "village", music: "garden",
      title: "What's inside a pomegranate?",
      fact: "A pomegranate has a tough red skin. Inside are hundreds of shiny red seeds, each full of sweet juice!",
      wow: "So many seeds!",
      fallback: { image: "assets/img/fruits/pomegranate.jpg", sound: null },
      discovery: { activityId: "discovery-pomegranate", name: "Pomegranate Discovery" },
      followUpGame: "puzzle-fruitodd-001",
      questions: [
        { default: true, bands: ["3-4", "4-5"], kind: "pick-picture", ask: "Which one is the pomegranate?",
          options: [
            { id: "pomegranate", label: "Pomegranate", art: "pomegranate", correct: true },
            { id: "lemon", label: "Lemon", art: "lemon", hint: "That's a yellow lemon. Find the red one!" },
            { id: "kiwi", label: "Kiwi", art: "kiwi", hint: "That's a kiwi. Find the red one!" }
          ], praise: "Yes! That's the pomegranate!" },
        { bands: ["5-6", "6-7"], kind: "pick-picture", ask: "Which one is also a fruit?",
          options: [
            { id: "plum", label: "Plum", art: "plum", correct: true },
            { id: "carrot", label: "Carrot", art: "carrot", hint: "A carrot is a vegetable that grows under the ground!" },
            { id: "poppy", label: "Poppy", art: "poppy", hint: "That's a poppy flower. Fruits hold seeds we can eat!" }
          ], praise: "Yes! A plum is a juicy fruit!" },
        { bands: ["7-8", "8-9", "9-10"], kind: "pick-text", ask: "Fruits grow from flowers. What does a fruit hold inside?",
          options: [
            { id: "seeds", label: "Seeds", correct: true },
            { id: "roots", label: "Roots", hint: "Roots grow under the ground. What's inside the pomegranate?" },
            { id: "leaves", label: "Leaves", hint: "Leaves grow on stems. What's inside the pomegranate?" }
          ], praise: "Right! A fruit protects the seeds that grow new plants." }
      ]
    })
  ];

  /* Shared defaults for the picture discoveries above: one clip path per id, no clip yet. */
  function discovery(e) {
    e.ageRange = e.ageRange || [3, 10]; e.difficulty = e.difficulty || 1;
    e.duration = e.duration || 10; e.aspect = e.aspect || "16:9";
    e.video = e.video || "assets/videos/" + e.category + "/" + e.id + ".mp4";
    e.poster = e.poster || null; e.captions = e.captions || null;
    e.available = !!e.available;
    e.license = e.license || { source: null, author: null, url: null, license: null, commercialUse: null, attributionRequired: null, verifiedOn: null };
    e.followUpFeature = e.followUpFeature || null;
    return e;
  }

  var byId = {}, byActivity = {};
  VIDEOS.forEach(function (v) {
    byId[v.id] = v;
    if (v.discovery) byActivity[v.discovery.activityId] = v;
  });

  Kido.videos = {
    list: function () { return VIDEOS.slice(); },
    get: function (id) { return byId[id] || null; },
    forActivity: function (activityId) { return byActivity[activityId] || null; },
    /** True only when the clip is really on disk and cleared (never guessed). */
    isPlayable: function (v) { return !!(v && v.available && v.video); },
    /** The follow-up question for an age band (falls back to the default one). */
    questionFor: function (v, band) {
      var qs = (v && v.questions) || [];
      for (var i = 0; i < qs.length; i++) if (qs[i].bands && qs[i].bands.indexOf(band) !== -1) return qs[i];
      for (var j = 0; j < qs.length; j++) if (qs[j].default) return qs[j];
      return qs[0] || null;
    },
    /** Tile / Continue-button picture for a discovery activity. */
    mediaFor: function (activityId) {
      var v = byActivity[activityId];
      return v ? (v.poster || (v.fallback && v.fallback.image) || null) : null;
    },
    /** Warm up a discovery's clip when its trigger point is on screen. */
    preloadFor: function (activityId) {
      var v = byActivity[activityId];
      if (v && this.isPlayable(v) && Kido.VideoManager) Kido.VideoManager.preload(v.video);
    }
  };
})(window);
