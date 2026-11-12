/* =========================================================================
   whatsAnimal.js — Data for the "What's That Animal?" world game
   (js/scenes/whatsAnimal.js).

   Vector ART now lives in the shared Kido.creatures registry (js/data/creatures.js
   + js/art/creatureArt.js) so every game draws the SAME original art. This file
   delegates art lookups there and keeps only the game-specific data on top: the
   food mini-game choices, baby name, a letter colour (tint) and world layout.
   Educational facts (diet/habitat/sound) come from Kido.facts at runtime.

   Reusable by design: worlds are data. Add farm/ocean/etc. by adding a world
   entry (+ its art in the registry) and this scene runs it unchanged.

     Kido.wta.worlds.jungle -> { name, music, bg, ground, props, animals[] }
     Kido.wta.data[key]     -> { group, name, baby, tint, food:{correct,decoys} }
     Kido.wta.art(key)      -> "<svg …>"  (delegates to Kido.creatures)
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  Kido.wta = Kido.wta || {};

  // Emoji is only a last-resort fallback now (real art lives in the registry).
  var EMO = { elephant: "🐘", lion: "🦁", monkey: "🐒", giraffe: "🦒", tiger: "🐅", zebra: "🦓", parrot: "🦜", snake: "🐍", frog: "🐸", rhino: "🦏" };

  // ---- Art comes from the shared creature registry (one source of truth) ----
  Kido.wta.art = function (key) {
    if (Kido.creatures) {
      if (Kido.creatures.hasArt(key)) return Kido.creatures.render(key);
      return Kido.creatures.art(key) || "";
    }
    return "";
  };
  Kido.wta.hasArt = function (key) { return !!(Kido.creatures && Kido.creatures.hasArt(key)); };
  Kido.wta.emoji = function (key) { return (Kido.creatures && Kido.creatures.emoji(key)) || EMO[key] || "❓"; };

  /* ------------------------------------------------------------------ */
  /*  PER-ANIMAL GAME DATA (facts like diet/habitat come from Kido.facts) */
  /*  food.correct is the true diet; decoys include a couple of silly     */
  /*  junk-food options for gentle humour, like the reference format.     */
  /* ------------------------------------------------------------------ */
  /* Food pictures are authored art (Kido-style vectors in assets/img/objects/food-*.svg
     and the clean fruit/object cutouts) — never OS emoji, so they look the same on
     every device. `l` is what Momo says. */
  var FOOD = {
    leaves:  { img: "assets/img/objects/food-leaves.svg",   l: "leaves" },
    meat:    { img: "assets/img/objects/food-meat.svg",     l: "meat" },
    grass:   { img: "assets/img/objects/food-grass.svg",    l: "grass" },
    donut:   { img: "assets/img/objects/food-donut.svg",    l: "a donut" },
    pizza:   { img: "assets/img/objects/food-pizza.svg",    l: "pizza" },
    burger:  { img: "assets/img/objects/food-burger.svg",   l: "a burger" },
    banana:  { img: "assets/img/fruits/art/banana.svg",   l: "a banana" },
    bananas: { img: "assets/img/fruits/art/banana.svg",   l: "bananas" },
    apple:   { img: "assets/img/fruits/art/apple.svg",    l: "an apple" },
    carrot:  { img: "assets/img/fruits/art/carrot.svg",         l: "a carrot" },
    berries: { img: "assets/img/fruits/art/strawberry.svg", l: "berries" },
    eggs:    { img: "assets/img/objects/nest.svg",          l: "eggs" },
    bugs:    { img: "assets/img/objects/ant.svg",           l: "bugs" }
  };
  function food(correct, decoys) { return { correct: FOOD[correct], decoys: decoys.map(function (k) { return FOOD[k]; }) }; }

  var D = {
    elephant: { group: "animals", name: "Elephant", baby: "a calf", tint: "#8C99A6", food: food("leaves", ["meat", "donut", "pizza"]) },
    lion: { group: "animals", name: "Lion", baby: "a cub", tint: "#D6941F", food: food("meat", ["leaves", "banana", "donut"]) },
    monkey: { group: "animals", name: "Monkey", baby: "a baby", tint: "#9A6A34", food: food("bananas", ["meat", "grass", "donut"]) },
    giraffe: { group: "animals", name: "Giraffe", baby: "a calf", tint: "#D9A63A", food: food("leaves", ["burger", "donut", "pizza"]) },
    tiger: { group: "animals", name: "Tiger", baby: "a cub", tint: "#EE7E1E", food: food("meat", ["carrot", "banana", "donut"]) },
    zebra: { group: "animals", name: "Zebra", baby: "a foal", tint: "#3B3835", food: food("grass", ["meat", "donut", "pizza"]) },
    parrot: { group: "birds", name: "Parrot", baby: "a chick", tint: "#2C9E4F", food: food("berries", ["meat", "donut", "pizza"]) },
    snake: { group: "animals", name: "Snake", baby: "a hatchling", tint: "#46A164", food: food("eggs", ["leaves", "apple", "donut"]) },
    frog: { group: "animals", name: "Frog", baby: "a tadpole", tint: "#5CB53C", food: food("bugs", ["leaves", "apple", "meat"]) },
    rhino: { group: "animals", name: "Rhino", baby: "a calf", tint: "#8A929E", food: food("grass", ["meat", "donut", "pizza"]) }
  };

  Kido.wta.worlds = {
    jungle: {
      id: "jungle", name: "Jungle", music: "jungle", bg: "bg-jungle", ground: "ground-green",
      props: ["🌴", "🌿", "🪨", "🌺"],
      animals: ["elephant", "lion", "monkey", "giraffe", "tiger", "zebra", "parrot", "snake", "frog", "rhino"]
    }
  };

  Kido.wta.data = D;
  Kido.wta.get = function (key) { return D[key] || null; };
  Kido.wta.world = function (id) { return Kido.wta.worlds[id] || Kido.wta.worlds.jungle; };
})(window);
