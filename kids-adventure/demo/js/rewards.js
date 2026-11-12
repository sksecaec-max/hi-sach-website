/* =========================================================================
   rewards.js — Stars, badges, celebration
   Awards stars per round result and unlocks badges when milestones are hit.
   Badge rules are data so new ones can be added without touching logic.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  function storyDone(p, id) { var s = p.get("storyProgress"), r = s && s[id]; return !!(r && (r.status === "complete" || r.completions > 0)); }

  // Each badge: earned when test(state) returns true. `cat` links to a
  // category so finishing that world grants the themed badge.
  var BADGES = [
    { id: "first-steps", icon: "🐾", name: "First Steps", test: function (p) { return p.completedCount() >= 1; } },
    { id: "alphabet",    icon: "🔤", name: "Alphabet Explorer", cat: "alphabet" },
    { id: "numbers",     icon: "🔢", name: "Number Ninja",      cat: "numbers" },
    { id: "animals",     icon: "🐯", name: "Animal Expert",     cat: "animals" },
    { id: "birds",       icon: "🐦", name: "Bird Watcher",      cat: "birds" },
    { id: "flowers",     icon: "🌸", name: "Flower Friend",     cat: "flowers" },
    { id: "vehicles",    icon: "🚗", name: "Speed Racer",       cat: "vehicles" },
    { id: "shapes",      icon: "🔺", name: "Shape Master",      cat: "shapes" },
    { id: "hindi",       icon: "🇮🇳", name: "Hindi Hero",        cat: "hindi" },
    { id: "creative",    icon: "🎨", name: "Creative Kid",      cat: "baking" },
    { id: "story",       icon: "📖", name: "Story Explorer",    cat: "stories" },
    { id: "habits",      icon: "🌟", name: "Good Habits Star",  cat: "habits" },
    { id: "puzzle",      icon: "🧠", name: "Puzzle Master",     cat: "oddoneout" },
    { id: "word-hero",   icon: "🏃", name: "Word Runner",       cat: "words" },
    { id: "bird-friend", icon: "🐦", name: "Bird Friend", test: function (p) {
        var s = p.get("storyProgress"); return !!(s && s.lost_little_bird_001 && s.lost_little_bird_001.status === "complete"); } },
    // Change #17A: one keepsake per story adventure (finishing the story is enough — no score involved).
    { id: "kind-helper",  icon: "🐰", name: "Kind Helper",  test: function (p) { return storyDone(p, "helpful_rabbit_001"); } },
    { id: "puppy-pal",    icon: "🐶", name: "Puppy Pal",    test: function (p) { return storyDone(p, "lost_puppy_001"); } },
    { id: "tidy-star",    icon: "🧸", name: "Tidy Star",    test: function (p) { return storyDone(p, "tidy_room_001"); } },
    { id: "hill-climber", icon: "🚩", name: "Hill Climber", test: function (p) { return storyDone(p, "little_explorer_001"); } },
    { id: "green-thumb",  icon: "🌻", name: "Green Thumb",  test: function (p) { return storyDone(p, "magic_garden_001"); } },
    // Change #23: solving "Mystery of the Lost Treasure".
    { id: "treasure-hunter", icon: "🗺️", name: "Master Explorer", test: function (p) { return storyDone(p, "lost_treasure_001"); } },
    { id: "star-25",     icon: "✨", name: "25 Stars",   test: function (p) { return p.stars() >= 25; } },
    { id: "star-100",    icon: "🌈", name: "100 Stars",  test: function (p) { return p.stars() >= 100; } }
    // (Change #16: the "3-Day Streak" badge is retired — no streak pressure on the child.)
  ];

  // Collectible stickers — a lighter, more frequent reward than badges so there
  // is always a new treasure to chase. Themed stickers are tied to a world;
  // "treats" (no cat) are surprise bonuses. Kids collect the whole album.
  var STICKERS = [
    { id: "st-alpha1", emoji: "🅰️", name: "Letter Star",  cat: "alphabet" },
    { id: "st-alpha2", emoji: "📚", name: "Book Buddy",    cat: "alphabet" },
    { id: "st-num1",   emoji: "1️⃣", name: "Number One",    cat: "numbers" },
    { id: "st-num2",   emoji: "🔢", name: "Count Champ",   cat: "numbers" },
    { id: "st-anim1",  emoji: "🦁", name: "Brave Lion",    cat: "animals" },
    { id: "st-anim2",  emoji: "🐘", name: "Gentle Ellie",  cat: "animals" },
    { id: "st-bird1",  emoji: "🦜", name: "Chirpy Parrot", cat: "birds" },
    { id: "st-bird2",  emoji: "🦉", name: "Wise Owl",      cat: "birds" },
    { id: "st-flow1",  emoji: "🌻", name: "Sunny Bloom",   cat: "flowers" },
    { id: "st-flow2",  emoji: "🌷", name: "Tulip Pal",     cat: "flowers" },
    { id: "st-veh1",   emoji: "🚒", name: "Fire Truck",    cat: "vehicles" },
    { id: "st-veh2",   emoji: "🚀", name: "Rocket Rider",  cat: "vehicles" },
    { id: "st-shp1",   emoji: "🔷", name: "Blue Diamond",  cat: "shapes" },
    { id: "st-shp2",   emoji: "🔺", name: "Red Triangle",  cat: "shapes" },
    { id: "st-hin1",   emoji: "🪷", name: "Kamal",         cat: "hindi" },
    { id: "st-hin2",   emoji: "🐅", name: "Sher",          cat: "hindi" },
    { id: "st-bake1",  emoji: "🧁", name: "Cupcake Chef",  cat: "baking" },
    { id: "st-bake2",  emoji: "🍪", name: "Cookie Maker",  cat: "baking" },
    { id: "st-story1", emoji: "📖", name: "Tale Teller",   cat: "stories" },
    { id: "st-story2", emoji: "🏰", name: "Castle Keeper", cat: "stories" },
    { id: "st-hab1",   emoji: "🪥", name: "Sparkle Smile", cat: "habits" },
    { id: "st-hab2",   emoji: "🛁", name: "Bubbly Clean",  cat: "habits" },
    { id: "st-odd1",   emoji: "🧠", name: "Big Brain",     cat: "oddoneout" },
    { id: "st-word1",  emoji: "🏃", name: "Word Runner",   cat: "words" },
    // Surprise treats (any world can drop these)
    { id: "st-t-rainbow",  emoji: "🌈", name: "Rainbow" },
    { id: "st-t-balloon",  emoji: "🎈", name: "Balloon" },
    { id: "st-t-lolly",    emoji: "🍭", name: "Lollipop" },
    { id: "st-t-ribbon",   emoji: "🎀", name: "Ribbon" },
    { id: "st-t-trophy",   emoji: "🏆", name: "Trophy" },
    { id: "st-t-gem",      emoji: "💎", name: "Shiny Gem" },
    { id: "st-t-kite",     emoji: "🪁", name: "Kite" },
    { id: "st-t-wheel",    emoji: "🎡", name: "Fun Wheel" },
    { id: "st-t-unicorn",  emoji: "🦄", name: "Unicorn" },
    { id: "st-t-dragon",   emoji: "🐉", name: "Friendly Dragon" },
    { id: "st-t-clover",   emoji: "🍀", name: "Lucky Clover" },
    { id: "st-t-gift",     emoji: "🎁", name: "Surprise Gift" },
    { id: "st-t-star",     emoji: "🌟", name: "Glow Star" },
    { id: "st-t-medal",    emoji: "🏅", name: "Gold Medal" }
  ];

  Kido.rewards = {
    badges: BADGES,
    stickerCatalog: STICKERS,
    stickerById: function (id) {
      for (var i = 0; i < STICKERS.length; i++) if (STICKERS[i].id === id) return STICKERS[i];
      return null;
    },

    /** Stars for a round: up to 3 based on accuracy, min 1 for finishing. */
    starsFor: function (correct, total) {
      if (!total) return 1;
      var ratio = correct / total;
      if (ratio >= 0.99) return 3;
      if (ratio >= 0.7) return 2;
      return 1;
    },

    /**
     * Called when an activity round finishes. Awards stars, records
     * completion, then checks every badge rule and returns any newly earned.
     */
    award: function (activityId, categoryId, correct, total) {
      var p = Kido.progress;
      var stars = this.starsFor(correct, total);
      p.addStars(stars, categoryId);
      p.completeActivity(activityId, stars);
      if (Kido.adventure) Kido.adventure.noteFinish(activityId);   // a step of Today's Adventure?

      var newly = [];
      BADGES.forEach(function (b) {
        if (p.hasBadge(b.id)) return;
        var earned = false;
        if (b.cat && categoryId === b.cat) {
          // Category badge unlocks after a solid run (2+ stars) in that world.
          earned = stars >= 2;
        } else if (b.test) {
          earned = b.test(p);
        }
        if (earned && p.earnBadge(b.id)) newly.push(b);
      });

      // ---- Collectible stickers: keep the reward loop fresh every round ----
      var newStickers = [];
      function unowned(list) { return list.filter(function (s) { return !p.hasSticker(s.id); }); }

      // 1) A sticker themed to the world just played (if any remain).
      var themed = unowned(STICKERS.filter(function (s) { return s.cat === categoryId; }));
      if (themed.length && p.earnSticker(themed[0].id)) newStickers.push(themed[0]);

      // 2) A surprise treat: guaranteed on a perfect run, otherwise a hopeful chance.
      if (stars >= 3 || Math.random() < (stars >= 2 ? 0.5 : 0.25)) {
        var treats = unowned(STICKERS.filter(function (s) { return !s.cat; }));
        if (treats.length) {
          var t = treats[(Math.random() * treats.length) | 0];
          if (p.earnSticker(t.id)) newStickers.push(t);
        }
      }

      // 3) Safety net — finishing should (almost) always add to the album until it's full.
      if (!newStickers.length) {
        var any = unowned(STICKERS);
        if (any.length) {
          var r = any[(Math.random() * any.length) | 0];
          if (p.earnSticker(r.id)) newStickers.push(r);
        }
      }

      return { stars: stars, newBadges: newly, newStickers: newStickers };
    },

    /** The collectible for a finished Today's Adventure (Change #12): a surprise
        treat while any remain, else any sticker still missing. Null once the album
        is complete — the celebration is then the reward. */
    bonusSticker: function () {
      var p = Kido.progress;
      function unowned(list) { return list.filter(function (s) { return !p.hasSticker(s.id); }); }
      var pool = unowned(STICKERS.filter(function (s) { return !s.cat; }));
      if (!pool.length) pool = unowned(STICKERS);
      if (!pool.length) return null;
      var s = pool[(Math.random() * pool.length) | 0];
      return p.earnSticker(s.id) ? s : null;
    },

    /** Show the full-screen celebration + confetti for a finished round. */
    celebrate: function (result, opts) {
      opts = opts || {};
      Kido.audio.playCelebrationSound();
      Kido.fx.confetti();
      var newBadges = result.newBadges || [];
      newBadges.forEach(function (b) {
        setTimeout(function () { Kido.audio.playUnlockSound(); }, 300);
      });
      // Each freshly collected sticker gets its own little "pop" as it lands.
      var newStickers = result.newStickers || [];
      newStickers.forEach(function (s, i) {
        setTimeout(function () { Kido.audio.playUnlockSound(); }, 520 + i * 260);
      });
    }
  };
})(window);
