/* =========================================================================
   space.js — Change #22: what Kido knows about the Sun and the planets.
   One source for the Solar System explorer, the planet games and the planet
   discoveries. Lines are age-banded with the existing age bands:
     young (3–5)  names, colours, looking
     mid   (5–7)  names, order from the Sun, simple facts and comparisons
     old   (7–10) reasoning: size, distance, years, what each world is made of
   Sizes are widths compared with Earth; distances are compared with Earth's.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  var ORDER = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
  var NTH = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  var B = {
    sun: { name: "Sun", colour: "yellow", kind: "star",
      young: "The Sun is a big, bright star. It keeps us warm!",
      mid: ["The Sun is a star. It gives us light and warmth.", "The Sun is much, much bigger than Earth!"],
      old: ["The Sun is a star made of super-hot glowing gas. Never look straight at it!", "About 109 Earths would fit across the Sun.",
        "All eight planets travel around the Sun, pulled by its gravity."] },
    mercury: { name: "Mercury", colour: "grey", kind: "rocky planet",
      young: "Mercury is small and grey.",
      mid: ["Mercury is the smallest planet.", "Mercury is smaller than Earth."],
      old: ["Mercury has almost no air to hold heat, so its days are very hot and its nights are freezing.",
        "Mercury is about one third as wide as Earth.", "It is closest to the Sun, so its year is only 88 days long."] },
    venus: { name: "Venus", colour: "pale yellow", kind: "rocky planet",
      young: "Venus is covered in yellow clouds.",
      mid: ["Venus is the hottest planet, even hotter than Mercury!", "Venus is almost the same size as Earth."],
      old: ["Thick clouds trap the Sun's heat, so Venus is the hottest planet even though Mercury is closer to the Sun.",
        "Venus is almost as wide as Earth.", "Its year lasts 225 days."] },
    earth: { name: "Earth", colour: "blue and green", kind: "rocky planet",
      young: "Earth is blue and green. It is our home!",
      mid: ["Earth is the only planet we know of with living things.", "Earth has one Moon."],
      old: ["Earth is just the right distance from the Sun for liquid water, which living things need.",
        "Earth goes around the Sun once a year: 365 days.", "Earth is the biggest of the four rocky planets."] },
    mars: { name: "Mars", colour: "red", kind: "rocky planet",
      young: "Mars is red, like rusty sand!",
      mid: ["Mars is called the Red Planet because its dust is rusty red.", "Mars is about half as wide as Earth."],
      old: ["Mars has the biggest volcano in the solar system, called Olympus Mons.",
        "Mars is about one and a half times as far from the Sun as Earth.", "Its year is 687 days, almost two of our years."] },
    jupiter: { name: "Jupiter", colour: "orange and white stripes", kind: "gas giant",
      young: "Jupiter is the biggest planet. It has stripes!",
      mid: ["Jupiter's red spot is a giant storm.", "Jupiter is the biggest planet of all."],
      old: ["Jupiter is a gas giant. Its Great Red Spot is a storm wider than Earth!",
        "About 11 Earths would fit across Jupiter.", "It is about 5 times as far from the Sun as Earth, so its year is about 12 of ours."] },
    saturn: { name: "Saturn", colour: "golden", kind: "gas giant",
      young: "Saturn has beautiful rings!",
      mid: ["Saturn's rings are made of ice and rock.", "Saturn is the second biggest planet."],
      old: ["Saturn is so light for its size that it would float in a giant bathtub of water!",
        "About 9 Earths would fit across Saturn.", "It is about 10 times as far from the Sun as Earth, so its year is about 29 of ours."] },
    uranus: { name: "Uranus", colour: "light blue", kind: "ice giant",
      young: "Uranus is light blue.",
      mid: ["Uranus spins on its side, like a rolling ball.", "Uranus is about 4 times as wide as Earth."],
      old: ["Uranus is an ice giant. It is tipped right over, so it rolls around the Sun on its side.",
        "About 4 Earths would fit across Uranus.", "It is about 19 times as far from the Sun as Earth, so its year is 84 of ours."] },
    neptune: { name: "Neptune", colour: "deep blue", kind: "ice giant",
      young: "Neptune is deep blue.",
      mid: ["Neptune is the farthest planet from the Sun.", "Neptune is about 4 times as wide as Earth."],
      old: ["Neptune has the fastest winds of any planet.",
        "About 4 Earths would fit across Neptune.", "It is about 30 times as far from the Sun as Earth, so its year is 165 of ours."] }
  };
  // Width compared with Earth (rounded), for the "how big?" picture the oldest children see.
  var SIZE = { sun: 109, mercury: .38, venus: .95, earth: 1, mars: .53, jupiter: 11.2, saturn: 9.4, uranus: 4, neptune: 3.9 };

  // "Find …" clues for Momo's challenge and the Find the Planet game (key = the answer).
  var CLUES = {
    young: [["mars", "Find the red planet!"], ["saturn", "Find the planet with big rings!", ["uranus"]], ["earth", "Find our home, Earth! It is blue and green."],
      ["jupiter", "Find the big stripy planet!"], ["sun", "Find the bright yellow Sun!"], ["mercury", "Find the little grey planet!"]],
    mid: [["mercury", "Find the planet closest to the Sun."], ["earth", "Find the 3rd planet from the Sun."], ["mars", "Find the 4th planet from the Sun."],
      ["venus", "Find Venus!"], ["jupiter", "Find Jupiter!"], ["uranus", "Find Uranus!"], ["neptune", "Find Neptune, the farthest planet!"], ["saturn", "Find Saturn!"]],
    old: [["jupiter", "Find the biggest planet."], ["mercury", "Find the smallest planet."], ["venus", "Find the hottest planet."],
      ["neptune", "Find the planet farthest from the Sun."], ["uranus", "Find the planet that spins on its side."], ["saturn", "Find the planet that could float in water."],
      ["jupiter", "Find the 5th planet from the Sun."], ["mars", "Find the planet with the biggest volcano."], ["earth", "Find the only planet we know with life."],
      ["mercury", "Find the planet with the shortest year."]]
  };

  function band(b) {
    b = b || (Kido.age && Kido.age.current ? Kido.age.current() : "5-6");
    return b === "2-3" || b === "3-4" || b === "4-5" ? "young" : b === "5-6" || b === "6-7" ? "mid" : "old";
  }
  function title(key) { return key === "sun" ? "the Sun" : B[key].name; }

  Kido.space = {
    ORDER: ORDER,
    BODIES: ["sun"].concat(ORDER),
    SIZE: SIZE,
    get: function (key) { return B[key] || null; },
    band: band,
    nth: function (key) { var i = ORDER.indexOf(key); return i < 0 ? "" : NTH[i + 1]; },
    /** What the child hears and reads when they pick a body. */
    lines: function (key, b) {
      var x = B[key]; if (!x) return [];
      var i = ORDER.indexOf(key), g = band(b), hello = "This is " + title(key) + "!";
      if (g === "young") return [hello, x.young];
      if (g === "mid") return [hello + (i >= 0 ? " It is the " + NTH[i + 1] + " planet from the Sun." : "")].concat(x.mid);
      if (i < 0) return [hello].concat(x.old);   // the Sun: its first fact already says it is a star
      // Name the kind of planet only when its fact doesn't already ("Jupiter is a gas giant…").
      var kind = x.old[0].indexOf(x.kind) >= 0 ? "" : ", " + (/^[aeiou]/.test(x.kind) ? "an " : "a ") + x.kind;
      return [x.name + " is the " + NTH[i + 1] + " planet from the Sun" + kind + "."].concat(x.old);
    },
    /** avoid: bodies that would also fit the clue (Uranus has faint rings too), kept out of the wrong answers. */
    clues: function (b) { return CLUES[band(b)].map(function (c) { return { key: c[0], ask: c[1], avoid: c[2] || [] }; }); }
  };
})(window);
