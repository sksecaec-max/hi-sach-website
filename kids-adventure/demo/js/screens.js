/* =========================================================================
   screens.js — All screen renderers
   Each function paints into #screen. Chrome (top bar / tab bar) is handled by
   navigation.js. Screens stay dumb: they read state + catalog and render.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};
  var U = Kido.util;
  var P = Kido.progress;

  // Picture shown for each activity on tiles, Continue buttons and the daily board.
  var ACTIVITY_MEDIA = {
    "solar-system": "assets/img/space/solar-system.svg",   // Change #22: Kido's own drawings
    "planet-find": "assets/img/space/planet-mars.svg",
    "fruit-catch": "assets/img/fruits/art/strawberry.svg",
    "fruit-explore": "assets/img/fruits/art/mango.svg",
    "fruit-find": "assets/img/fruits/art/watermelon.svg",
    "fruit-sorter": "assets/img/fruits/art/banana.svg",
    "fruit-memory": "assets/img/fruits/art/grapes.svg",
    "tic-tac-toe": "assets/img/games/tictactoe.svg",
    "memory-match": "assets/img/games/memory.svg",
    "shape-sorter": "assets/img/games/shapesorter.svg",
    "bubble-pop": "assets/img/games/bubblepop.svg",
    "beat": "assets/img/games/beat.svg",
    "shadow-match": "assets/img/games/shadow.svg",
    "scene-animalsound": "assets/img/animals/elephant.jpg",
    "scene-wordrun": "assets/img/games/rocket.svg",
    "count": "assets/img/games/apples.svg",
    "sequence": "assets/img/games/balloons.svg",
    "moreless": "assets/img/games/scale.svg",
    "odd": "assets/img/games/magnifier.svg",
    "shape-find": "assets/img/games/shapes.svg",
    "animal-find": "assets/img/animals/tiger.jpg",
    "bird-find": "assets/img/animals/parrot.jpg",
    "vehicle-find": "assets/img/vehicles/car.jpg",
    "vehicle-explore": "assets/img/vehicles/airplane.jpg",
    "scene-apple": "assets/img/fruits/art/apple.svg",
    "scene-count": "assets/img/fruits/basket-front.svg",
    "scene-plant": "assets/img/objects/grow-plant.svg",
    "scene-whatsanimal": "assets/img/animals/lion.jpg",
    "animal-explore": "assets/img/animals/panda.jpg",
    "animal-babies": "assets/img/animals/cat.jpg",
    "bird-explore": "assets/img/animals/peacock.jpg",
    "flower-explore": "assets/img/flowers/rose.jpg",
    "flower-find": "assets/img/flowers/marigold.jpg",
    "who-makes-sound": "assets/img/animals/cow.jpg",
    "who-am-i": "assets/img/animals/monkey.jpg",
    "alphabet-find": "assets/img/objects/letter-hunt.svg",
    "alphabet-match": "assets/img/objects/match-letters.svg",
    "number-order": "assets/img/games/number-order.svg",
    "hindi-swar": "assets/img/objects/pomegranate.jpg",
    "hindi-vyanjan": "assets/img/flowers/lotus.jpg",
    "hindi-varnamala": "assets/img/animals/flamingo.jpg",
    "hindi-match": "assets/img/objects/kite.svg",
    "story-rabbit": "assets/img/animals/rabbit.jpg",
    "story-puppy": "assets/img/animals/dog.jpg",
    "story-cleanroom": "assets/img/animals/bear.jpg",
    "story-explorer": "assets/img/animals/fox.jpg",
    "story-garden": "assets/img/flowers/tulip.jpg",
    "word-animals": "assets/img/animals/giraffe.jpg",
    "word-fruits": "assets/img/fruits/orange.jpg",
    "word-vehicles": "assets/img/vehicles/train.jpg",
    "word-objects": "assets/img/objects/xylophone.jpg",
    "word-colors": "assets/img/flowers/hibiscus.jpg",
    "word-school": "assets/img/objects/drum.svg",
    "electronics": "assets/img/objects/computer.svg",
    "build-bridge": "assets/img/objects/build-bridge.svg",
    "build-house": "assets/img/objects/build-house.svg",
    "scene-brush": "assets/img/habits/habit_brush.svg",
    "habit-routine": "assets/img/body/head.svg",
    "habit-choose": "assets/img/objects/good-habits.svg",
    "greetings": "assets/img/body/say-hello.svg",
    "body": "assets/img/chiku/fullbody.jpg",
    "body-explore": "assets/img/chiku/happy.jpg",
    "feelings": "assets/img/chiku/surprised.jpg",
    "senses": "assets/img/chiku/silly.jpg",
    "inside-body": "assets/img/chiku/anatomy-model.jpg"
  };

  function m() { return document.getElementById("screen"); }
  function clear() { var s = m(); s.innerHTML = ""; s.scrollTop = 0; return s; }

  /* ------------------------------------------------------------------ */
  /* Top bar info (greeting + star total) — refreshed on every render.  */
  /* ------------------------------------------------------------------ */
  Kido.screens = {
    refreshTopbar: function () {
      var name = P.get("childName");
      var g = document.getElementById("greeting");
      var sub = document.getElementById("subgreeting");
      var av = document.getElementById("avatar-btn");
      var st = document.getElementById("star-total");
      if (g) g.textContent = "Hi " + capitalize(name) + "!";
      if (sub) sub.textContent = pickGreeting();
      if (av && !av.firstElementChild) av.innerHTML = Kido.icons.momo();
      if (st) st.textContent = P.stars();
      var sb = document.getElementById("btn-stars");
      if (sb) sb.setAttribute("aria-label", P.stars() + " stars. Open my rewards.");
      var bm = document.getElementById("btn-music");
      if (bm && Kido.Music && Kido.Music.refreshButton) Kido.Music.refreshButton();   // one source of truth
      else if (bm) {
        var on = (P.settings().music !== false);
        bm.innerHTML = on ? Kido.icons.note() : Kido.icons.mute();
        bm.classList.toggle("is-active", on);
        bm.setAttribute("aria-label", on ? "Mute music" : "Play music");
        bm.setAttribute("title", on ? "Music: On" : "Music: Off");
      }
    },

    /* =============================== AGE =============================== */
    age: function () {
      var s = clear();
      var wrap = U.el("div", { class: "age" });
      wrap.appendChild(U.el("div", { class: "splash__logo", html: '<span class="splash__mark" style="color:var(--grape);font-size:44px">Little Explorers</span>' }));
      wrap.appendChild(U.el("h1", { class: "age__title", text: "How old are you?" }));
      wrap.appendChild(U.el("p", { class: "age__sub", text: "Pick your age so games are just right for you." }));

      var grid = U.el("div", { class: "age__grid" });
      Kido.age.all().forEach(function (band) {
        var card = U.el("button", { class: "age-card", "aria-label": band.band + " years" }, [
          U.el("div", { class: "age-card__face", text: band.face }),
          U.el("div", { class: "age-card__age", text: band.band.replace("-", "–") }),
          U.el("div", { class: "age-card__label", text: band.label })
        ]);
        card.addEventListener("click", function () {
          Kido.audio.unlock();
          Kido.audio.playUnlockSound();
          Kido.age.set(band.band);
          Kido.fx.confetti(40);
          Kido.nav.setTab("home");   // Momo greets the child from inside Kido World
        });
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      s.appendChild(wrap);
      Kido.audio.speak("Hi there! How old are you today?");
    },

    /* =============================== TAB SCREENS =============================== */
    gamesTab: function () {
      this.refreshTopbar();
      this.list("🎮 Games", ["fruit-catch", "fruit-sorter", "fruit-memory", "tic-tac-toe", "memory-match", "shape-sorter", "bubble-pop", "beat",
        "scene-animalsound", "scene-wordrun", "count", "sequence", "moreless", "odd", "shape-find", "animal-find", "vehicle-find", "bird-find",
        "word-animals", "word-objects"], { intro: "Quick, playful challenges!" });
    },
    learnTab: function () {
      this.refreshTopbar();
      this.list("📚 Learn", ["abc-book", "trace-abc", "hindi-book", "trace-hindi", "big-small", "tall-short", "hot-cold", "habit-goodbad",
        "fruit-explore", "fruit-find", "scene-apple", "scene-count", "scene-brush", "alphabet-find", "alphabet-match", "count", "number-order", "shape-find",
        "hindi-swar", "hindi-vyanjan", "hindi-varnamala", "hindi-match", "body", "greetings", "habit-choose"], { intro: "Letters, numbers & more." });
    },
    createTab: function () {
      this.refreshTopbar();
      this.list("🎨 Create", ["fruit-sorter", "scene-plant", "build-bridge", "build-house", "electronics", "animal-babies", "flower-explore", "habit-routine"],
        { intro: "Build, match & make things!" });
    },
    storiesTab: function () {
      this.refreshTopbar();
      this.list("📖 Stories", ["story-rabbit", "story-puppy", "story-cleanroom", "story-explorer", "story-garden",
        "word-fruits", "word-vehicles", "word-colors", "word-school"], { intro: "Read, choose & spell!" });
    },

    /* =============================== REGION =============================== */
    region: function (params) {
      this.refreshTopbar();
      var r = Kido.catalog.region(params.id);
      if (!r) return Kido.nav.setTab("home");
      this.list(r.name, r.activities, { intro: r.desc });
    },

    /** Picture for an activity (tiles, Continue buttons, the daily board). */
    mediaFor: function (id) {
      var pz = Kido.puzzles && Kido.puzzles.get(id);
      var st = (Kido.storyAdventures || []).filter(function (s) { return s.activityId === id; })[0];
      return ACTIVITY_MEDIA[id] || (Kido.videos && Kido.videos.mediaFor(id)) || (pz && pz.media) || (st && st.media) || null;
    },

    /* Generic activity-grid renderer (used by tabs + regions). */
    list: function (title, ids, opts) {
      opts = opts || {};
      var s = clear();
      var wrap = U.el("div", { class: "wrap pad shelf-page" });   // Change #28: a sideways-swiping shelf (css/style.css)
      wrap.appendChild(U.el("h2", { class: "section-title", html: title + (opts.intro ? ' <small>' + opts.intro + '</small>' : '') }));
      var grid = U.el("div", { class: "cat-grid" });
      grid.addEventListener("wheel", function (e) {   // a mouse wheel scrolls the shelf sideways too
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && grid.scrollWidth > grid.clientWidth + 1) { grid.scrollLeft += e.deltaY; e.preventDefault(); }
      }, { passive: false });

      var CATEGORY_TAGS = {
        "games": "🎮 Arcade",
        "animals": "🦁 Safari",
        "birds": "🦜 Birds",
        "flowers": "🌸 Garden",
        "nature": "🍎 Orchard",
        "vehicles": "🚗 Vehicles",
        "numbers": "🔢 Math",
        "alphabet": "🔤 Phonics",
        "words": "🚀 Adventure",
        "habits": "🌟 Routine",
        "science": "🌱 Nature",
        "electronics": "💡 Gadgets",
        "structures": "🏗️ Build",
        "stories": "📖 Story",
        "shapes": "🔷 Shapes",
        "greetings": "👋 Hello",
        "body": "🧒 My Body",
        "oddoneout": "🔍 Detective"
      };

      ids.forEach(function (id) {
        var a = Kido.catalog.get(id); if (!a) return;
        var completed = P.isCompleted(id);
        var cat = a.categoryId || "games";
        var catTag = CATEGORY_TAGS[cat] || ("✨ " + (cat.charAt(0).toUpperCase() + cat.slice(1)));
        var imgSrc = Kido.screens.mediaFor(id);

        // Every picture sits in the same round medallion (like Kido's puzzle tokens and the
        // Continue / Today's Adventure thumbnails): photos fill it, cut-out art sits on a soft disc.
        var isPhoto = /\.jpe?g(\?|$)/i.test(imgSrc || "");
        var previewHtml = imgSrc
          ? '<div class="cat-tile__preview cat-tile__preview--' + (isPhoto ? "photo" : "art") + '"><span class="cat-tile__medal">' +
            '<img class="cat-tile__img" src="' + imgSrc + '" alt="" loading="lazy" draggable="false" /></span><div class="cat-tile__gloss"></div></div>'
          : '<div class="cat-tile__preview cat-tile__preview--emoji"><span class="cat-tile__glyph">' + a.icon + '</span></div>';

        var badgeHtml = completed
          ? '<span class="cat-tile__badge cat-tile__badge--played"><span class="badge-star">⭐</span> Played</span>'
          : '<span class="cat-tile__badge cat-tile__badge--new"><span class="badge-sparkle">✨</span> Play</span>';

        var tile = U.el("button", {
          class: "cat-tile cat-tile--" + cat + " cat-tile--" + id + (completed ? " is-played" : " is-fresh"),
          "aria-label": a.name,
          html:
            '<div class="cat-tile__top">' +
              '<span class="cat-tile__tag">' + catTag + '</span>' +
              badgeHtml +
            '</div>' +
            previewHtml +
            '<div class="cat-tile__meta">' +
              '<div class="cat-tile__name">' + a.name + '</div>' +
              '<div class="cat-tile__play-btn"><span>Play</span> <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M6 4l10 6-10 6V4z"/></svg></div>' +
            '</div>'
        });

        tile.addEventListener("click", function () {
          Kido.audio.playTapSound();
          tile.classList.add("anim-press");
          setTimeout(function () { tile.classList.remove("anim-press"); }, 200);
          Kido.screens.play(id);
        });
        grid.appendChild(tile);
      });
      wrap.appendChild(grid);
      s.appendChild(wrap);
    },

    /* =============================== REWARDS =============================== */
    rewards: function () {
      this.refreshTopbar();
      var s = clear();
      var wrap = U.el("div", { class: "wrap pad" });
      wrap.appendChild(U.el("h2", { class: "section-title", html: "⭐ My Rewards" }));

      // No day-streak counter for the child (Kido has no streak pressure); the Parent Zone keeps play history.
      // Badges are counted from the current list, so a retired badge saved earlier isn't counted.
      wrap.appendChild(U.el("div", { class: "stat-grid" }, [
        stat(P.stars(), "Stars"),
        stat(Kido.rewards.badges.filter(function (b) { return P.hasBadge(b.id); }).length, "Badges"),
        stat(P.stickerCount(), "Stickers"),
        stat(P.completedCount(), "Activities")
      ]));

      wrap.appendChild(U.el("h3", { class: "section-title", html: "🏆 Badges <small>collect them all</small>" }));
      var grid = U.el("div", { class: "badge-grid" });
      Kido.rewards.badges.forEach(function (b) {
        var earned = P.hasBadge(b.id);
        grid.appendChild(U.el("div", { class: "badge" + (earned ? "" : " locked") }, [
          U.el("div", { class: "badge__icon", text: earned ? b.icon : "🔒" }),
          U.el("div", { class: "badge__name", text: b.name })
        ]));
      });
      wrap.appendChild(grid);

      wrap.appendChild(U.el("h3", { class: "section-title", html: "🎟️ My Stickers <small>collect the whole album</small>" }));
      var sgrid = U.el("div", { class: "sticker-grid" });
      Kido.rewards.stickerCatalog.forEach(function (st) {
        var owned = P.hasSticker(st.id);
        sgrid.appendChild(U.el("div", { class: "sticker" + (owned ? "" : " locked") }, [
          U.el("div", { class: "sticker__emoji", text: st.emoji }),
          U.el("div", { class: "sticker__name", text: owned ? st.name : "???" })
        ]));
      });
      wrap.appendChild(sgrid);
      s.appendChild(wrap);
    },

    /* =============================== PLAY =============================== */
    play: function (activityId, opts) {
      var spec = Kido.catalog.buildSpec(activityId, opts);
      if (!spec) { Kido.fx.toast("Coming soon!"); return; }
      Kido._lastPlay = activityId;
      if (Kido.world) Kido.world.notePlay(activityId);   // powers "Continue" in Kido World
      if (Kido.Learning) Kido.Learning.noteStart(activityId, spec);   // what this session has seen (variety)

      // Start cheerful in-game background music tailored to activity mood
      if (Kido.Music) {
        var cat = (spec.categoryId || "");
        var act = activityId || "";
        var mood = "playful";
        if (act.indexOf("word-") === 0 || spec.type === "runner" || cat === "vehicles") mood = "adventure";
        else if (cat === "animals" || cat === "birds") mood = "safari";
        else if (cat === "flowers" || cat === "science") mood = "garden";
        else if (cat === "electronics" || act.indexOf("rocket") !== -1) mood = "space";
        Kido.Music.play(spec.music || mood);
      }

      if (spec.type === "scene" && Kido.Scene && Kido.Scene.has(spec.sceneId)) {
        Kido.nav.go("scene", { id: activityId }, { render: false });
        Kido.Scene.run(spec.sceneId, spec);
        return;
      }
      Kido.nav.go("play", { id: activityId }, { render: false });
      Kido.engine.play(spec);
    },

    /* =============================== RESULT =============================== */
    showResult: function (spec, result) {
      if (Kido.Music) Kido.Music.play("victory");                         // crossfades from the activity's mood
      if (Kido.AudioManager) Kido.AudioManager.ambience(null, { fade: 1200 });   // the reward moment has no place-bed
      var s = clear();
      var stars = result.stars || 1;
      var starRow = "";
      for (var i = 0; i < 3; i++) starRow += (i < stars ? "⭐" : "☆");
      if (result.practice) starRow = "⭐";

      var wrap = U.el("div", { class: "result" });
      // Change #28: the reward (left) and what to do next (right) side by side on short landscape screens;
      // both are display:contents elsewhere, so the classic single column is unchanged.
      var hero = U.el("div", { class: "result__hero" }), more = U.el("div", { class: "result__more" });
      wrap.appendChild(hero); wrap.appendChild(more);
      hero.appendChild(U.el("div", { class: "result__emoji anim-bounce", text: stars === 3 ? "🏆" : "🎉" }));
      hero.appendChild(U.el("h1", { class: "result__title", text: pick(["Awesome!", "Well done!", "You did it!", "Fantastic!"]) }));
      hero.appendChild(U.el("div", { class: "result__stars", html: starRow.split("").map(function (c) { return "<span>" + c + "</span>"; }).join("") }));
      // Activities that aren't "N questions" (e.g. puzzles) can say what was achieved instead.
      var done = result.summary || spec.resultMsg || ("You got " + result.correct + " of " + result.total);
      hero.appendChild(U.el("p", { class: "result__msg", text: done + " and earned " + stars + " star" + (stars > 1 ? "s" : "") + "!" }));

      (result.newBadges || []).forEach(function (b) {
        hero.appendChild(U.el("div", { class: "badge", style: "margin-top:10px" }, [
          U.el("div", { class: "badge__icon anim-pop", text: b.icon }),
          U.el("div", { class: "badge__name", text: "New badge: " + b.name })
        ]));
      });

      var ns = result.newStickers || [];
      if (ns.length) {
        hero.appendChild(U.el("p", { class: "result__msg", text: ns.length > 1 ? "You collected new stickers! 🎉" : "You collected a new sticker! 🎉" }));
        var stickRow = U.el("div", { class: "result__stickers" });
        ns.forEach(function (st, i) {
          stickRow.appendChild(U.el("div", { class: "reveal-sticker", style: "animation-delay:" + (i * 0.12) + "s" }, [
            U.el("div", { class: "reveal-sticker__emoji", text: st.emoji }),
            U.el("div", { class: "reveal-sticker__label", text: st.name }),
            U.el("div", { class: "reveal-sticker__tag", text: "NEW" })
          ]));
        });
        hero.appendChild(stickRow);
      }

      // Today's Adventure (Change #12): this finish ticked off one of its steps.
      var adv = Kido.adventure ? Kido.adventure.afterFinish(spec.activityId) : null;
      if (adv) more.appendChild(Kido.adventure.resultBlock(adv));

      var actions = U.el("div", { class: "result__actions" });
      var again = U.el("button", { class: "btn btn--block", text: "Play again 🔁" });
      again.addEventListener("click", function () { Kido.screens.play(spec.activityId); });
      var homeBtn = U.el("button", { class: "btn btn--ghost btn--block", text: "Back to World" });
      homeBtn.addEventListener("click", function () {
        if (Kido.world) Kido.world.backTo(spec.activityId); else Kido.nav.setTab("home");
      });
      if (result.practice) {
        homeBtn.textContent = "All done · back to the world";
        actions.appendChild(homeBtn); actions.appendChild(again);
      } else if (adv && adv.completed) {
        var explore = U.el("button", { class: "btn btn--leaf btn--block", text: "Explore Adventure World" });
        explore.addEventListener("click", function () { Kido.nav.setTab("home"); });
        actions.appendChild(explore); actions.appendChild(again);
      } else if (adv && adv.next > -1) {
        var step = U.el("button", { class: "btn btn--leaf btn--block", text: "Next: " + adv.nextLabel + " ▶" });
        step.addEventListener("click", function () { Kido.adventure.play(adv.next); });
        actions.appendChild(step); actions.appendChild(again); actions.appendChild(homeBtn);
      } else {
        var follow = spec.followUp && Kido.catalog.get(spec.followUp);
        var next = U.el("button", { class: "btn btn--leaf btn--block", text: follow ? follow.name + " ▶" : "Next activity ▶" });
        next.addEventListener("click", function () {
          // A discovery continues into its follow-up game (e.g. elephant → Animal Sounds).
          if (spec.followUp) Kido.screens.play(spec.followUp, { feature: spec.followUpFeature });
          else Kido.screens.play(nextActivity(spec.activityId));
        });
        actions.appendChild(again); actions.appendChild(next); actions.appendChild(homeBtn);
      }
      more.appendChild(actions);
      s.appendChild(wrap);

      Kido.screens.refreshTopbar();
      if (adv) Kido.mascot.say(Kido.adventure.momoLine(adv), adv.completed ? { mood: "celebrating", pose: "cheer" } : null);
      else Kido.mascot.say(stars === 3 ? "Wow, outstanding work! You earned all three stars!" : "Terrific effort! You are making awesome progress!");
    }
  };

  /* ---- misc helpers ---- */
  function nextActivity(id) {
    // The next one in the same region, else the next in its Kido World place.
    // (Today's Adventure steps get their own "Next:" button on the result screen.)
    var reg = Kido.catalog.regions.find(function (r) { return r.activities.indexOf(id) !== -1; });
    if (reg) { var i = reg.activities.indexOf(id); return reg.activities[(i + 1) % reg.activities.length]; }
    // Activities that only live in a Kido World place (stories, puzzles…): the next one there.
    var wid = Kido.world && Kido.world.worldOf(id);
    if (wid) { var more = Kido.world.WORLDS[wid].more, w = more.indexOf(id); return more[(w + 1) % more.length]; }
    return id;
  }
  function stat(num, label) { return U.el("div", { class: "stat" }, [U.el("div", { class: "stat__num", text: num }), U.el("div", { class: "stat__label", text: label })]); }
  function capitalize(s) { s = String(s || "friend"); return s.charAt(0).toUpperCase() + s.slice(1); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function pickGreeting() { return pick(["Ready to learn & play?", "What shall we explore?", "Let's have fun today!", "Pick an adventure!"]); }
})(window);
