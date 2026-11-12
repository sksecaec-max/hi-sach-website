/* =========================================================================
   animalFacts.js — Original, kid-friendly educational facts for animals/birds.
   Kept separate from content.js so a syntax slip here can never break the core
   content library. Powers the age-branched "EDUCATIONAL INFO" step of the
   animal/bird tap sequence and the reveal in the sound games. All text is
   original and factual (no copyrighted material). One source of truth:
   Kido.facts.sentence(kind, key, name, band) returns the age-right line.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  // sound = plain verb ("roars"), cls = class, home = habitat, eats = diet, fact = one fun line,
  // moves = how it gets around ("hops"), baby = what its young are called (where content.js has none).
  var animals = {
    dog:      { sound: "barks",     cls: "Mammal",    home: "homes with people",        eats: "meat and food",        fact: "Dogs can learn over 100 words!", moves: "runs and walks" },
    cat:      { sound: "meows",     cls: "Mammal",    home: "homes with people",        eats: "meat",                 fact: "Cats sleep up to 16 hours a day!", moves: "walks, jumps and climbs" },
    cow:      { sound: "moos",      cls: "Mammal",    home: "farms and green fields",   eats: "grass",                fact: "Cows can have best friends!", moves: "walks" },
    lion:     { sound: "roars",     cls: "Mammal",    home: "the African grasslands",   eats: "meat",                 fact: "A lion's roar can be heard very far away!", moves: "walks and runs" },
    elephant: { sound: "trumpets",  cls: "Mammal",    home: "Africa and Asia",          eats: "plants and leaves",    fact: "Elephants are the biggest land animals!", moves: "walks" },
    tiger:    { sound: "roars",     cls: "Mammal",    home: "the forests of Asia",      eats: "meat",                 fact: "Every tiger has its own stripe pattern!", moves: "walks, runs and swims" },
    horse:    { sound: "neighs",    cls: "Mammal",    home: "farms and fields",         eats: "grass and hay",        fact: "Horses can even sleep standing up!", moves: "walks, trots and gallops" },
    monkey:   { sound: "chatters",  cls: "Mammal",    home: "warm forests",             eats: "fruit and leaves",     fact: "Monkeys use their tails to hold on to trees!", moves: "climbs and swings" },
    panda:    { sound: "bleats",    cls: "Mammal",    home: "bamboo forests of China",  eats: "bamboo",               fact: "Pandas eat bamboo almost all day long!", moves: "walks and climbs" },
    bear:     { sound: "growls",    cls: "Mammal",    home: "forests and mountains",    eats: "fish, berries and honey", fact: "Bears sleep all winter — that is called hibernation!", moves: "walks and climbs" },
    rabbit:   { sound: "squeaks",   cls: "Mammal",    home: "grassy fields and burrows",eats: "grass and vegetables", fact: "Rabbits can jump very high and far!", moves: "hops" },
    frog:     { sound: "croaks",    cls: "Amphibian", home: "ponds and rivers",         eats: "insects",              fact: "Frogs begin life as tadpoles in the water!", moves: "hops and swims" },
    goat:     { sound: "bleats",    cls: "Mammal",    home: "farms and rocky hills",    eats: "grass and plants",     fact: "Goats can climb very steep rocks!", moves: "walks and climbs" },
    sheep:    { sound: "baas",      cls: "Mammal",    home: "farms and meadows",        eats: "grass",                fact: "Sheep give us soft wool for warm clothes!", moves: "walks" },
    duck:     { sound: "quacks",    cls: "Bird",      home: "ponds and lakes",          eats: "plants and small fish",fact: "Ducks have waterproof feathers!", moves: "waddles, swims and flies" },
    hen:      { sound: "clucks",    cls: "Bird",      home: "farms",                    eats: "seeds and grain",      fact: "A hen can lay an egg almost every day!", moves: "walks and flaps" },
    pig:      { sound: "oinks",     cls: "Mammal",    home: "farms",                    eats: "almost anything",      fact: "Pigs are very smart and clean animals!", moves: "walks" },
    fox:      { sound: "yips",      cls: "Mammal",    home: "forests and fields",       eats: "small animals and fruit", fact: "A fox has a big bushy tail called a brush!", moves: "runs and pounces" },
    deer:     { sound: "calls",     cls: "Mammal",    home: "forests",                  eats: "leaves and grass",     fact: "Deer can run very fast to stay safe!", moves: "runs and leaps" },
    giraffe:  { sound: "hums",      cls: "Mammal",    home: "the African savanna",      eats: "leaves from tall trees", fact: "The giraffe is the tallest animal in the world!", moves: "walks" },
    zebra:    { sound: "brays",     cls: "Mammal",    home: "the African grasslands",   eats: "grass",                fact: "Every zebra has its very own stripes!", moves: "walks and gallops" },
    rhino:    { sound: "grunts",    cls: "Mammal",    home: "grasslands of Africa and Asia", eats: "grass and plants",fact: "A rhino's horn is made of the same stuff as your hair!", moves: "walks and charges" },
    alligator:{ sound: "bellows",   cls: "Reptile",   home: "rivers and swamps",        eats: "fish and meat",        fact: "Alligators have lived on Earth for millions of years!", moves: "swims and crawls" },
    snake:    { sound: "hisses",    cls: "Reptile",   home: "many warm places",         eats: "small animals",        fact: "Snakes smell the air with their tongue!", moves: "slithers" },
    // Change #13 — sea & garden animals (no `sound` where the animal makes none a child would know)
    dolphin:     { sound: "clicks and whistles", cls: "Mammal", home: "the ocean",           eats: "fish and squid",          fact: "Dolphins breathe air through a blowhole on top of their head!", moves: "swims and leaps", baby: "calf" },
    whale:       { sound: "sings",   cls: "Mammal",  home: "the ocean",                      eats: "krill and small fish",    fact: "Humpback whales sing long songs that travel far under the water!", moves: "swims", baby: "calf" },
    whale_shark: {                   cls: "Fish",    home: "warm seas",                      eats: "tiny plankton",           fact: "The whale shark is the biggest fish in the world, but it eats tiny food!", moves: "swims", baby: "pup" },
    octopus:     {                   cls: "Mollusk", home: "the sea floor",                  eats: "crabs and clams",         fact: "An octopus has eight arms and can change color!", moves: "crawls and jets", baby: "hatchling" },
    sea_turtle:  {                   cls: "Reptile", home: "warm seas",                      eats: "sea grass",               fact: "Sea turtles lay their eggs on sandy beaches!", moves: "swims", baby: "hatchling" },
    seahorse:    { sound: "clicks",  cls: "Fish",    home: "sea grass and coral reefs",      eats: "tiny shrimp",             fact: "Seahorse dads carry the babies in a pouch!", moves: "swims upright", baby: "fry" },
    bee:         { sound: "buzzes",  cls: "Insect",  home: "hives and flower gardens",       eats: "nectar and pollen",       fact: "Bees make honey from flower nectar!", moves: "flies", baby: "larva" },
    ladybug:     {                   cls: "Insect",  home: "gardens and fields",             eats: "tiny bugs called aphids", fact: "Ladybugs help gardens by eating plant-munching bugs!", moves: "crawls and flies", baby: "larva" },
    dragonfly:   {                   cls: "Insect",  home: "ponds and streams",              eats: "mosquitoes and flies",    fact: "A dragonfly can fly forwards, backwards, and even stay still in the air!", moves: "flies", baby: "nymph" },
    monarch:     {                   cls: "Insect",  home: "fields of flowers",              eats: "flower nectar",           fact: "Monarch butterflies fly very far to stay warm in winter!", moves: "flies", baby: "caterpillar" },
    chameleon:   {                   cls: "Reptile", home: "trees in warm forests",          eats: "insects",                 fact: "A chameleon's eyes can look two different ways at once!", moves: "climbs", baby: "hatchling" },
    // Change #21 — nature & living world (sound only where Kido has a real recording)
    bison:       {                   cls: "Mammal",  home: "grassy plains",                  eats: "grass",                   fact: "The bison is the heaviest land animal in North America!", moves: "walks and runs", baby: "calf" },
    wolf:        {                   cls: "Mammal",  home: "forests and mountains",          eats: "meat",                    fact: "Wolves live together in a family called a pack!", moves: "runs", baby: "pup" },
    kangaroo:    {                   cls: "Mammal",  home: "the grasslands of Australia",    eats: "grass",                   fact: "A baby kangaroo, called a joey, rides in its mother's pouch!", moves: "hops", baby: "joey" },
    koala:       {                   cls: "Mammal",  home: "eucalyptus forests of Australia", eats: "eucalyptus leaves",      fact: "Koalas sleep for up to 20 hours a day!", moves: "climbs", baby: "joey" },
    hippo:       {                   cls: "Mammal",  home: "African rivers",                 eats: "grass",                   fact: "Hippos stay in the water all day to keep cool!", moves: "walks and swims", baby: "calf" },
    moose:       {                   cls: "Mammal",  home: "northern forests",               eats: "leaves and water plants", fact: "The moose is the biggest kind of deer, and a good swimmer!", moves: "walks and swims", baby: "calf" },
    beaver:      {                   cls: "Mammal",  home: "rivers and ponds",               eats: "bark and leaves",         fact: "Beavers build dams out of sticks and mud!", moves: "swims", baby: "kit" },
    squirrel:    {                   cls: "Mammal",  home: "trees and parks",                eats: "nuts and seeds",          fact: "Squirrels bury nuts and dig them up later to eat!", moves: "climbs and leaps", baby: "kit" },
    camel:       {                   cls: "Mammal",  home: "deserts",                        eats: "desert plants",           fact: "A camel's hump stores fat, so it can go a long time without food!", moves: "walks", baby: "calf" },
    sea_otter:   {                   cls: "Mammal",  home: "the ocean near the coast",       eats: "clams and sea urchins",   fact: "Sea otters hold hands while they sleep so they don't float apart!", moves: "swims", baby: "pup" },
    starfish:    {                   cls: "Sea animal", home: "the rocky sea floor",         eats: "clams and mussels",       fact: "A starfish can grow back a lost arm!", moves: "crawls on tiny tube feet", baby: "larva" },
    jellyfish:   {                   cls: "Sea animal", home: "the ocean",                   eats: "tiny plankton",           fact: "Jellyfish have no brain and no bones!", moves: "drifts and pulses", baby: "polyp" },
    crab:        {                   cls: "Crustacean", home: "beaches and rocky shores",    eats: "algae and tiny animals",  fact: "Crabs walk sideways!", moves: "walks sideways", baby: "larva" },
    shark:       {                   cls: "Fish",    home: "the ocean",                      eats: "fish",                    fact: "Sharks grow new teeth all their lives!", moves: "swims", baby: "pup" },
    seal:        {                   cls: "Mammal",  home: "rocky coasts",                   eats: "fish",                    fact: "Seals can sleep in the water with just their nose poking out!", moves: "swims", baby: "pup" },
    manta_ray:   {                   cls: "Fish",    home: "warm seas",                      eats: "plankton",                fact: "A manta ray flaps its fins like big wings to swim!", moves: "glides", baby: "pup" },
    clownfish:   {                   cls: "Fish",    home: "coral reefs",                    eats: "tiny animals and algae",  fact: "Clownfish live safely among the stinging arms of sea anemones!", moves: "swims", baby: "fry" },
    walrus:      {                   cls: "Mammal",  home: "icy Arctic seas",                eats: "clams",                   fact: "A walrus uses its long tusks to pull itself onto the ice!", moves: "swims", baby: "calf" },
    ant:         {                   cls: "Insect",  home: "nests under the ground",         eats: "seeds and sweet food",    fact: "Ants can carry things much heavier than themselves!", moves: "walks", baby: "larva" },
    grasshopper: { sound: "chirps",  cls: "Insect",  home: "grassy fields",                  eats: "grass and leaves",        fact: "Grasshoppers sing by rubbing their legs against their wings!", moves: "hops", baby: "nymph" },
    beetle:      {                   cls: "Insect",  home: "almost everywhere",              eats: "plants and small bugs",   fact: "There are more kinds of beetles than any other animal!", moves: "crawls and flies", baby: "larva" },
    mantis:      {                   cls: "Insect",  home: "gardens",                        eats: "insects",                 fact: "A praying mantis can turn its head to look over its shoulder!", moves: "crawls", baby: "nymph" },
    caterpillar: {                   cls: "Insect",  home: "gardens and fields",             eats: "milkweed leaves",         fact: "A caterpillar munches and grows, then turns into a butterfly!", moves: "crawls" },
    firefly:     {                   cls: "Insect",  home: "fields and woods",               eats: "flower nectar",           fact: "Fireflies make their own light to talk to each other!", moves: "flies", baby: "larva" },
    tortoise:    {                   cls: "Reptile", home: "deserts",                        eats: "plants",                  fact: "Some tortoises live for more than 100 years!", moves: "walks slowly", baby: "hatchling" },
    iguana:      {                   cls: "Reptile", home: "rainforest trees",               eats: "leaves and fruit",        fact: "Iguanas are good swimmers and can hold their breath!", moves: "climbs and swims", baby: "hatchling" },
    gecko:       {                   cls: "Reptile", home: "deserts",                        eats: "insects",                 fact: "A leopard gecko stores food energy in its plump tail!", moves: "crawls", baby: "hatchling" },
    lizard:      {                   cls: "Reptile", home: "dry, sandy places",              eats: "ants",                    fact: "A horned lizard puffs itself up to look too big to eat!", moves: "crawls", baby: "hatchling" },
    turtle:      {                   cls: "Reptile", home: "ponds",                          eats: "plants and small animals", fact: "A turtle can pull its head into its shell to stay safe!", moves: "swims and crawls", baby: "hatchling" }
  };
  var birds = {
    sparrow:  { sound: "chirps",   cls: "Bird", home: "towns and gardens",    eats: "seeds and insects",     fact: "Sparrows love to take dust baths!", moves: "flies and hops" },
    parrot:   { sound: "squawks",  cls: "Bird", home: "warm rainforests",     eats: "seeds and fruit",       fact: "Some parrots can copy human words!", moves: "flies and climbs" },
    crow:     { sound: "caws",     cls: "Bird", home: "almost everywhere",    eats: "almost anything",       fact: "Crows are some of the smartest birds!", moves: "flies and walks" },
    peacock:  { sound: "calls",    cls: "Bird", home: "the forests of India", eats: "seeds and insects",     fact: "A peacock spreads a huge, colorful tail!", moves: "walks and flies" },
    pigeon:   { sound: "coos",     cls: "Bird", home: "cities and towns",     eats: "seeds",                 fact: "Pigeons can find their way home from far away!", moves: "flies and walks" },
    eagle:    { sound: "screeches",cls: "Bird", home: "mountains and forests",eats: "fish and small animals",fact: "Eagles can see much farther than people!", moves: "soars" },
    owl:      { sound: "hoots",    cls: "Bird", home: "forests",              eats: "mice and insects",      fact: "Owls can turn their heads almost all the way around!", moves: "flies without a sound" },
    duck:     { sound: "quacks",   cls: "Bird", home: "ponds and lakes",      eats: "plants and small fish", fact: "Baby ducks can swim soon after they hatch!", moves: "waddles, swims and flies" },
    hen:      { sound: "clucks",   cls: "Bird", home: "farms",                eats: "seeds and grain",       fact: "A hen keeps her eggs warm until they hatch!", moves: "walks and flaps" },
    rooster:  { sound: "crows",    cls: "Bird", home: "farms",                eats: "seeds and grain",       fact: "A rooster crows loudly in the morning!", moves: "walks and flaps" },
    swan:     { sound: "honks",    cls: "Bird", home: "lakes and rivers",     eats: "water plants",          fact: "Two swans can bend their necks into a heart shape!", moves: "swims and flies" },
    penguin:  { sound: "brays",    cls: "Bird", home: "cold, icy places",     eats: "fish",                  fact: "Penguins are birds that swim but cannot fly!", moves: "waddles and swims" },
    flamingo: { sound: "honks",    cls: "Bird", home: "shallow lakes",        eats: "tiny shrimp",           fact: "Flamingos turn pink from the food they eat!", moves: "wades and flies" },
    // Change #21
    robin:       {                  cls: "Bird", home: "gardens and lawns",    eats: "worms and berries",     fact: "Robins hunt for worms by watching and listening in the grass!", moves: "hops and flies" },
    woodpecker:  {                  cls: "Bird", home: "woods",                eats: "bugs in tree bark",     fact: "Woodpeckers tap holes in trees to find bugs to eat!", moves: "climbs and flies" },
    hummingbird: {                  cls: "Bird", home: "gardens",              eats: "flower nectar",         fact: "A hummingbird beats its wings so fast that they hum!", moves: "hovers" },
    pelican:     { sound: "squawks", cls: "Bird", home: "coasts and lakes",    eats: "fish",                  fact: "A pelican scoops up fish in its big stretchy beak pouch!", moves: "flies and swims" },
    puffin:      {                  cls: "Bird", home: "rocky sea cliffs",     eats: "small fish",            fact: "A puffin can carry lots of little fish in its colorful beak at once!", moves: "swims and flies" },
    cardinal:    { sound: "sings",  cls: "Bird", home: "gardens and woods",    eats: "seeds and berries",     fact: "The bright red cardinal keeps singing even in winter!", moves: "flies" },
    blue_jay:    { sound: "calls",  cls: "Bird", home: "woods",                eats: "acorns and seeds",      fact: "Blue jays bury acorns to eat later, and some grow into oak trees!", moves: "flies" },
    heron:       { sound: "croaks", cls: "Bird", home: "marshes and ponds",    eats: "fish and frogs",        fact: "A heron stands very still, then catches a fish with a quick jab!", moves: "wades and flies" }
  };

  function bandDifficulty(band) {
    return (Kido.age && Kido.age.cfg ? (Kido.age.cfg(band) || {}).difficulty : 3) || 3;
  }

  Kido.facts = {
    animals: animals,
    birds: birds,
    /** Raw entry for a key, or null. kind = "animals" | "birds". */
    get: function (kind, key) { var g = kind === "birds" ? birds : animals; return (g && g[key]) || null; },
    /** How the animal sounds, as a verb ("roars"). Falls back to "makes a sound". */
    verb: function (kind, key) { var e = this.get(kind, key); return (e && e.sound) || "makes a sound"; },
    /** One age-appropriate educational sentence. "" for the youngest (sound+name is enough). */
    sentence: function (kind, key, name, band) {
      var e = this.get(kind, key); if (!e) return "";
      name = name || key;
      var d = bandDifficulty(band);
      if (d <= 2) return "";                                              // 3–5: sound + name only
      if (d <= 3) return e.fact;                                          // 5–6: a fun fact
      if (d <= 5) return "The " + name + " lives in " + e.home + ".";     // 6–8: habitat
      var cls = e.cls.toLowerCase();
      return "The " + name + " is " + (/^[aeiou]/.test(cls) ? "an " : "a ") + cls + " and eats " + e.eats + "."; // 8–10: classification
    },
    /** Short always-safe caption to SHOW under a tile (name • Class). */
    caption: function (kind, key, name) {
      var e = this.get(kind, key); return e ? ((name || key) + " • " + e.cls) : (name || key);
    }
  };

})(window);
