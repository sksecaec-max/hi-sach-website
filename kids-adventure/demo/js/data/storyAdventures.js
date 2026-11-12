/* =========================================================================
   storyAdventures.js — interactive story adventures (data only)
   Played by js/engine/storyEngine.js. A new story = a new entry here plus,
   if it needs new places, a backdrop in worldArt's STORY_PLACES. Beat types
   and the [short, long] text convention are documented in storyEngine.js.
   Places: glade, fork, river, clearing, oak, meadow (js/art/worldArt.js).
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  Kido.storyAdventures = [
    {
      id: "lost_little_bird_001",
      activityId: "adventure-lost-little-bird",
      title: "The Lost Little Bird",
      ageRange: [4, 7],
      world: "castle",                        // where it is found in Kido World
      media: "assets/img/animals/sparrow.jpg",
      hero: "tiko",
      resultMsg: "You helped Tiko find home",
      reward: { category: "stories", badge: "bird-friend" },
      cast: {
        tiko: { name: "Tiko", rig: "bird", portrait: "tiko", size: 64, voice: { pitch: 1.7, rate: 1.05 } },
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      // Sound keys used by { sfx } beats: a species call, or any cue from js/data/audioRegistry.js.
      sounds: { chirp: { bird: "songbird" }, splash: { cue: "fx.splash" } },
      ambience: "jungle",                 // quiet forest bed under the story (Kido.AudioManager)
      start: "meet",
      scenes: [
        { id: "meet", place: "glade", cast: { momo: "momo", tiko: "bird" }, hidden: ["tiko"], moods: { momo: "surprised" },
          beats: [
            { narrate: ["Listen! Something is chirping.", "Listen! A tiny chirp is coming from somewhere near the old tree stump."] },
            { sfx: "chirp" },
            { tap: "stump", ask: ["Tap the stump!", "Who is chirping? Tap the old stump to take a look."], react: "rustle",
              then: { show: "tiko", mood: { tiko: "surprised", momo: "excited" }, sfx: "chirp" } },
            { say: "tiko", mood: "surprised", pose: "jump", text: ["Oh! Hello!", "Oh! Hello there! My name is Tiko."] },
            { say: "momo", mood: "happy", pose: "wave", text: ["Hi Tiko! I'm Momo.", "Hi Tiko! I'm Momo, and this is my friend."] }
          ],
          next: "lost" },

        { id: "lost", place: "glade", cast: { momo: "momo", tiko: "bird" }, moods: { tiko: "sad" },
          beats: [
            { say: "tiko", mood: "sad", text: ["I'm lost. I can't find my nest.", "I flew too far away, and now I can't find my nest."] },
            { tap: "tiko", ask: ["Give Tiko a gentle pat!", "Tiko looks worried. Tap Tiko to cheer them up."],
              then: { mood: { tiko: "happy" }, pose: { tiko: "jump" } } },
            { say: "momo", mood: "excited", pose: "cheer", text: ["Don't worry! We'll help!", "Don't worry, Tiko. We will help you find your way home!"] }
          ],
          next: "choose" },

        { id: "choose", place: "fork", cast: { momo: "momo", tiko: "bird" }, moods: { tiko: "thinking" },
          beats: [
            { sfx: "chirp" },
            { narrate: ["Tiko hears the family! Which way?", "Tiko can hear the family chirping nearby. The path splits in two. Which way should we explore?"] },
            { choice: { ask: ["Tap a path!", "Tap the path you want to explore."], options: [
              { id: "forest", hot: "forestPath", label: "Forest path", detail: "Tall trees, where birds build nests", next: "clue" },
              { id: "river", hot: "riverPath", label: "River path", detail: "Splashing water and reeds", next: "river" }
            ] } }
          ] },

        // Short detour if the child picks the river — then the story joins up again.
        { id: "river", place: "river", cast: { momo: "momo", tiko: "bird" }, moods: { tiko: "thinking" },
          beats: [
            { narrate: ["Splash! The river is loud.", "Splash, splash! The river is so loud that it's hard to hear any chirping."] },
            { tap: "splash", ask: ["Tap the splash!", "Something jumped in the water! Tap the splash to see what it was."], react: "jump",
              then: { sfx: "splash", mood: { tiko: "surprised", momo: "excited" } } },
            { say: "tiko", mood: "happy", text: ["A fish! But no nest here.", "A fish! Hello, fish! But birds don't build nests in the water."] },
            { say: "momo", mood: "thinking", text: ["Let's go to the trees!", "Nests are up in the trees. Let's follow the trees instead!"] }
          ],
          next: "clue" },

        { id: "clue", place: "clearing", cast: { momo: "momo", tiko: "bird" }, moods: { tiko: "thinking" },
          beats: [
            { when: { choose: "forest" }, say: "tiko", mood: "excited", text: ["I hear chirping! This way!", "I can hear chirping under these tall trees. This way!"] },
            { narrate: ["Look! Footprints in the mud!", "Look down! There are lots of little footprints in the soft mud."] },
            { tap: "footprints", ask: ["Tap the footprints!", "Tap the footprints to take a closer look."], react: "shine",
              then: { mood: { tiko: "thinking" } } },
            { say: "tiko", mood: "thinking", text: ["Which ones are my family's?", "So many footprints! Which ones belong to my bird family?"] }
          ],
          next: "puzzle" },

        // A thinking challenge from the Puzzle Engine decides the route.
        { id: "puzzle", place: "clearing", cast: { momo: "momo", tiko: "bird" }, moods: { tiko: "thinking" },
          beats: [
            { puzzle: "footprints_001" },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["Bird footprints! Follow them!", "Those are bird footprints! Let's follow them!"] }
          ],
          next: "tree" },

        { id: "tree", place: "oak", cast: { momo: "momo", tiko: "ground" }, moods: { tiko: "happy" },
          beats: [
            { narrate: ["The footprints lead to a big tree.", "The little footprints lead all the way to a big old oak tree."] },
            { tap: "tree", ask: ["Tap the big tree!", "Listen closely. Tap the big tree."], react: "rustle", then: { sfx: "chirp", mood: { tiko: "excited" } } },
            { say: "tiko", mood: "excited", pose: "jump", text: ["I hear them! Up there!", "I can hear them! That's my family, up in the branches!"] }
          ],
          next: "nest" },

        { id: "nest", place: "oak", cast: { momo: "momo", tiko: "ground" }, moods: { tiko: "excited" },
          beats: [
            { move: { who: "tiko", to: "nestBird" } },
            { tap: "nest", ask: ["Tap the nest!", "Tiko flew up to a nest. Tap the nest to peek inside."], react: "shine",
              then: { reveal: "family", sfx: "chirp", mood: { tiko: "celebrating", momo: "excited" } } },
            { say: "tiko", mood: "celebrating", pose: "cheer", text: ["My family! I'm home!", "My family! I found my nest. I'm home at last!"] }
          ],
          next: "end" },

        { id: "end", place: "oak", cast: { momo: "momo", tiko: "nestBird" }, moods: { tiko: "happy", momo: "happy" },
          beats: [
            { reveal: "family" },
            { say: "tiko", mood: "happy", pose: "wave", text: ["Thank you, friend!", "Thank you for helping me find my way home. You're a true friend!"] },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["We did it!", "We did it! What a wonderful adventure!"] },
            { celebrate: true },
            { end: true }
          ] }
      ]
    },

    /* ---- Change #13: a nature story that teaches while it plays (who helps a garden grow?) ---- */
    {
      id: "garden_helpers_001",
      activityId: "adventure-garden-helpers",
      title: "The Garden Helpers",
      ageRange: [3, 8],
      world: "castle",
      media: "assets/img/animals/bee.jpg",
      hero: "pip",
      resultMsg: "You found all the garden helpers",
      reward: { category: "stories" },
      cast: {
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } },
        pip: { name: "Pip", rig: "pip", size: 76, voice: { pitch: 1.45, rate: 1.04 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      sounds: { buzz: { animal: "bee" }, splash: { cue: "fx.splash" } },
      ambience: "jungle",
      start: "meadow",
      scenes: [
        { id: "meadow", place: "meadow", cast: { momo: "momo", pip: "pip" }, moods: { pip: "thinking" },
          beats: [
            { narrate: ["Welcome to the flower meadow!", "Momo and Pip are visiting the flower meadow. Pip has a big question."] },
            { say: "pip", mood: "thinking", text: ["Who helps the flowers grow?", "Beep boop! Who helps all these flowers and plants to grow?"] },
            { say: "momo", mood: "excited", pose: "wave", text: ["Let's find the garden helpers!", "Let's find out! Some of the best garden helpers are very small."] },
            { sfx: "buzz" },
            { tap: "flowers", ask: ["Buzz! Tap the flowers!", "Something is buzzing in the flowers. Tap the flowers to take a look!"], react: "shine",
              then: { reveal: "bee", sfx: "buzz", mood: { pip: "surprised", momo: "excited" } } },
            { say: "momo", mood: "happy", text: ["A honey bee!", "It's a honey bee! Bees drink sweet nectar from flowers."] },
            { say: "pip", mood: "excited", pose: "jump", text: ["Bees help flowers make seeds!", "Bees carry yellow pollen from flower to flower. That helps the flowers make seeds!"] }
          ],
          next: "choose" },

        { id: "choose", place: "meadow", cast: { momo: "momo", pip: "pip" }, moods: { pip: "happy" },
          beats: [
            { say: "momo", mood: "thinking", text: ["Who else helps?", "Who else helps the garden? Let's look somewhere new."] },
            { choice: { ask: ["Where should we look?", "Tap where you want to look next."], options: [
              { id: "bush", hot: "bush", label: "Leafy bush", detail: "Lots of green leaves", next: "ladybug" },
              { id: "pond", hot: "pond", label: "Little pond", detail: "Water and tall reeds", next: "dragonfly" }
            ] } }
          ] },

        { id: "ladybug", place: "meadow", cast: { momo: "momo", pip: "pip" }, moods: { pip: "thinking" },
          beats: [
            { tap: "bush", ask: ["Tap the leaves!", "Peek under the leaves. Tap the bush!"], react: "rustle",
              then: { reveal: "ladybug", mood: { pip: "excited" } } },
            { say: "pip", mood: "excited", text: ["A ladybug!", "A little red ladybug with black spots!"] },
            { say: "momo", mood: "happy", text: ["Ladybugs protect plants!", "Ladybugs eat tiny bugs called aphids that munch on plants. So they keep the garden healthy!"] }
          ],
          next: "insects" },

        { id: "dragonfly", place: "meadow", cast: { momo: "momo", pip: "pip" }, moods: { pip: "thinking" },
          beats: [
            { tap: "pond", ask: ["Tap the pond!", "Something is zooming over the water. Tap the pond!"], react: "shine",
              then: { reveal: "dragonfly", sfx: "splash", mood: { pip: "surprised" } } },
            { say: "pip", mood: "excited", text: ["A dragonfly!", "Whoa! A dragonfly! It can fly forwards and backwards!"] },
            { say: "momo", mood: "happy", text: ["Dragonflies catch mosquitoes!", "Dragonflies catch mosquitoes and flies, so the meadow stays nice for everyone."] }
          ],
          next: "insects" },

        // A thinking challenge from the Puzzle Engine (the same "Which Is Not an Insect?" puzzle the Village has).
        { id: "insects", place: "meadow", cast: { momo: "momo", pip: "pip" }, moods: { pip: "thinking" },
          beats: [
            { say: "pip", mood: "thinking", text: ["Are they all insects?", "Bees, ladybugs and dragonflies are all insects. Insects have six legs. Can you spot one that is NOT an insect?"] },
            { puzzle: "insect_001" },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["You know your insects!", "Well done! You really know your insects!"] }
          ],
          next: "plant" },

        { id: "plant", place: "meadow", cast: { momo: "momo", pip: "pip" }, moods: { pip: "happy" },
          beats: [
            { narrate: ["Look! A caterpillar!", "Look at the tall plant. A little caterpillar is munching on a leaf!"] },
            { say: "pip", mood: "thinking", text: ["Is it a helper too?", "Is the caterpillar a garden helper too?"] },
            { tap: "plant", ask: ["Tap the plant!", "Tap the plant to see what the caterpillar will become."], react: "shine",
              then: { reveal: "butterfly", mood: { pip: "excited", momo: "excited" } } },
            { say: "momo", mood: "excited", text: ["It will be a butterfly!", "One day it will become a butterfly, like this one! Butterflies carry pollen too."] }
          ],
          next: "end" },

        { id: "end", place: "meadow", cast: { momo: "momo", pip: "pip" }, moods: { pip: "happy", momo: "happy" },
          beats: [
            { reveal: ["bee", "butterfly"] },
            { say: "pip", mood: "celebrating", pose: "cheer", text: ["So many helpers!", "Bees, ladybugs, dragonflies and butterflies. The garden has so many helpers!"] },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["You were a great helper too!", "And you helped us find them. You were a great garden helper too!"] },
            { celebrate: true },
            { end: true }
          ] }
      ]
    },
    /* =====================================================================
       Change #17A — the five picture stories become adventures on this same
       StoryEngine. Each keeps its classic activity id (story-rabbit, …), so a
       child's progress, stars and the Parent Zone history carry over.
       ===================================================================== */

    /* ---- The Helpful Rabbit: find who needs help, think how to help, follow nature's clues to the pond ---- */
    {
      id: "helpful_rabbit_001",
      activityId: "story-rabbit",
      title: "The Helpful Rabbit",
      ageRange: [3, 8],
      world: "castle",
      media: "assets/img/animals/rabbit.jpg",
      hero: "ria",
      heroMood: "happy",
      resultMsg: "You helped Ria help Tuk",
      reward: { category: "stories", badge: "kind-helper" },
      followUp: "discovery-sea-turtle",         // Tuk's cousin, after the story (Quick Discovery)
      cast: {
        ria: { name: "Ria", rig: "rabbit", portrait: "@rig", size: 82, voice: { pitch: 1.55, rate: 1.03 } },
        tuk: { name: "Tuk", rig: "turtle", portrait: "@rig", size: 62, voice: { pitch: .85, rate: .86 } },
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      sounds: { pop: { cue: "fx.pop" }, crunch: { cue: "fx.crunch" }, splash: { cue: "fx.splash" }, rustle: { cue: "world.rustle" },
        flutter: { cue: "world.flutter" }, ribbit: { animal: "frog" }, magic: { cue: "fx.magic" } },
      ambience: "jungle",
      start: "wake",
      scenes: [
        { id: "wake", place: "burrow", cast: { ria: "hole", momo: "momo" }, hidden: ["ria"], moods: { momo: "happy" },
          beats: [
            { narrate: ["Good morning, sunny meadow!", "The sun is up over the sunny meadow. But someone is still asleep in a cosy burrow."], focus: "burrow" },
            { tap: "burrow", ask: ["Knock, knock! Tap the burrow!", "Who lives in this burrow? Tap it to say good morning!"], react: "rustle",
              then: { show: "ria", mood: { ria: "excited" }, pose: { ria: "jump" }, sfx: "pop", focus: false } },
            { say: "ria", mood: "excited", pose: "jump", text: ["Good morning! I'm Ria!", "Good morning! I'm Ria the rabbit. What a bright, sunny day!"] },
            { say: "momo", mood: "happy", pose: "wave", text: ["Hi Ria! Breakfast first?", "Hi Ria! Let's find you some breakfast before we go hopping."] },
            { choice: { key: "breakfast", by: "ria", ask: ["What can Ria eat? Tap it!", "Rabbits eat plants. Tap something Ria can eat for breakfast."], options: [
              { id: "clover", hot: "clover", label: "Clover", detail: "Little green leaves",
                then: { move: { who: "ria", to: "cloverAt", pose: "hop", ms: 1100 }, sfx: "crunch" },
                yes: ["Munch, munch! Yummy!", "Munch, munch! Clover is my favourite. Rabbits love leafy plants!"] },
              { id: "stone", hot: "stone", label: "Stone", detail: "Hard and grey",
                no: ["A stone isn't food!", "Ria can't eat a stone! Rabbits eat plants, like grass and leaves."] },
              { id: "mushroom", hot: "mushroom", label: "Mushroom", detail: "A red cap", plate: "top", ages: [5, 10],
                no: ["No, thank you!", "Ria sniffs the red mushroom... no, thank you! Wild mushrooms are not for nibbling."] }
            ] } },
            { do: { mood: { ria: "surprised" }, pose: { ria: "jump" }, look: { ria: "path" } } },
            { narrate: ["Then Ria hears something...", "Then Ria's long ears hear something, far away..."] },
            { say: "ria", mood: "surprised", text: ["Someone needs help!", "Listen! A tiny voice is calling, 'Help! Help!' Someone needs help!"] },
            { say: "momo", mood: "thinking", ages: [6, 10], text: ["Rabbits have super ears!", "Rabbits can turn their long ears to find exactly where a sound is coming from!"] },
            { say: "ria", mood: "excited", text: ["Let's go and look!", "It's coming from the forest. Let's go and look!"] },
            { move: [{ who: "ria", to: "path", pose: "hop", ms: 1400 }, { who: "momo", to: "path", pose: "run", ms: 1600 }] }
          ],
          next: "search" },

        { id: "search", place: "ditch", cast: { ria: "start", momo: "momo", tuk: "ditch" }, hidden: ["tuk"], moods: { ria: "thinking" },
          beats: [
            { narrate: ["Where is the voice?", "Ria hops into the forest. The tiny voice is somewhere close by. Where could it be?"] },
            { seek: { ask: ["Tap to look for the voice!", "Help Ria look! Tap the places where someone could be."],
              more: ["Keep looking!", "Not here. Where else could the voice be?"],
              hint: { after: 2, by: "momo", pose: "point", look: { momo: "ditch" }, text: ["Listen... down low!", "Listen... the voice is coming from down low, near the ground!"] },
              items: [
                { hot: "bush", label: "Leafy bush", react: "rustle", then: { reveal: "sparrow", sfx: "flutter" },
                  beats: [{ say: "ria", mood: "surprised", text: ["Just a little bird!", "Oh! Just a little sparrow, flying away. That's not the voice."] }] },
                { hot: "log", label: "Old log", react: "wiggle", then: { reveal: "snail" },
                  beats: [{ say: "ria", mood: "happy", text: ["Hello, snail!", "Hello, snail! You carry your house on your back. But you're not stuck."] }] },
                { hot: "ditch", label: "Deep ditch", ends: true, then: { show: "tuk", mood: { tuk: "sad", ria: "surprised" }, focus: "ditch", sfx: "pop" } }
              ] } },
            { say: "tuk", mood: "sad", text: ["Help! I'm stuck!", "Help! I'm Tuk the turtle. I slipped into this ditch, and I can't climb out!"] },
            { say: "ria", mood: "sad", text: ["Oh no, poor Tuk!", "Oh no, poor Tuk! Don't worry. We will help you."] },
            { say: "tuk", mood: "sad", text: ["I need my pond.", "The sun is so hot, and my shell is getting dry. I need to get back to my cool pond."] }
          ],
          next: "help" },

        { id: "help", place: "ditch", cast: { ria: "rim", momo: "momo", tuk: "ditch" }, moods: { tuk: "sad", ria: "thinking" },
          beats: [
            { say: "momo", mood: "thinking", focus: false, text: ["How can we help Tuk?", "The sides of the ditch are too steep for Tuk. What could help him climb out?"] },
            { choice: { key: "help", by: "ria", ask: ["Tap the best way to help!", "Tap the thing that can help Tuk climb out."], options: [
              { id: "branch", hot: "branch", label: "Long branch", detail: "Make a ramp", plate: "top", then: { move: { who: "ria", to: "branchAt", pose: "hop", ms: 900 } } },
              { id: "boulder", hot: "boulder", label: "Big rock", detail: "Push it",
                no: ["Too heavy!", "Ria pushes and pushes... but the big rock is far too heavy. Try another idea!"] },
              { id: "leaf", hot: "leaf", label: "Big leaf", detail: "Soft and floppy", ages: [5, 10],
                no: ["Too floppy!", "A leaf is too soft and floppy for Tuk to climb on. What else could help?"] }
            ] } },
            { do: { fly: { what: "branch", to: "ramp", keep: true, rotate: -26, scale: .9 }, move: { who: "ria", to: "rim", pose: "hop", ms: 900 }, sfx: "rustle" } },
            { say: "ria", mood: "excited", pose: "jump", text: ["A ramp! Climb up, Tuk!", "Push, push... a ramp! Tuk can walk up the branch. Climb up, Tuk!"] },
            { tap: "tuk", ask: ["Cheer Tuk on! Tap him!", "Tuk is a little scared. Tap Tuk to cheer him on!"], then: { mood: { tuk: "excited" }, pose: { tuk: "nod" } } },
            { move: { who: "tuk", to: "top", pose: "run", ms: 2400 } },
            { do: { mood: { tuk: "celebrating", ria: "celebrating" }, pose: { tuk: "jump", ria: "hop" }, sfx: "magic" } },
            { say: "tuk", mood: "happy", text: ["I'm out! Thank you!", "I'm out! Thank you, Ria! But my pond is far away, and turtles walk very slowly."] },
            { choice: { key: "carry", ask: ["How should Ria help? You choose!", "How can Ria get Tuk to the pond faster? You choose!"], options: [
              { id: "back", hot: "ria", label: "Ride on Ria", detail: "Hop, hop, hop!", next: "rideBack",
                then: { move: { who: "tuk", to: "onRia", pose: "jump", ms: 700 }, mood: { tuk: "excited" } } },
              { id: "sled", hot: "leaf", label: "Leaf sled", detail: "Swish along the grass", next: "rideSled",
                then: { move: { who: "tuk", to: "onLeaf", pose: "run", ms: 1200 }, mood: { tuk: "excited" } } }
            ] } }
          ] },

        // The child's choice decides how Tuk travels; both ways arrive at the same clues.
        { id: "rideBack", place: "lilypond", cast: { ria: "arrive", tuk: "tukOn", momo: "momo" }, moods: { tuk: "excited", ria: "happy" },
          beats: [
            { narrate: ["Hop, hop! Tuk rides on Ria's back.", "Hop, hop, hop! Tuk holds on tight, riding all the way on Ria's back."] },
            { move: { who: "tuk", to: "tukAt", pose: "jump", ms: 700 } }
          ],
          next: "clues" },
        { id: "rideSled", place: "lilypond", cast: { ria: "arrive", tuk: "tukAt", momo: "momo" }, reveal: ["sled"], moods: { tuk: "excited", ria: "happy" },
          beats: [
            { narrate: ["Swish! Tuk rides the leaf sled.", "Swish, swish! Ria pulls Tuk along the soft grass on the big green leaf."] }
          ],
          next: "clues" },

        { id: "clues", place: "lilypond", cast: { ria: "arrive", tuk: "tukAt", momo: "momo" }, moods: { tuk: "thinking" },
          beats: [
            { say: "tuk", mood: "thinking", text: ["Where is my pond?", "The grass is so tall here. I can't see my pond. Which way is the water?"] },
            { seek: { ask: ["Find clues that water is near!", "Look for clues that water is near. Tap them!"],
              more: ["Find another clue!", "Great! Can you find another clue?"], need: [2, 3],
              items: [
                { hot: "dfly", label: "Something flying", then: { reveal: "dragonfly", sfx: "flutter" },
                  beats: [{ say: "momo", mood: "excited", text: ["A dragonfly!", "A dragonfly! Dragonflies lay their eggs in ponds, so water must be near."] }] },
                { hot: "frog", label: "Frog on a stone", react: "bounce", then: { sfx: "ribbit" },
                  beats: [{ say: "ria", mood: "excited", text: ["Ribbit! A frog!", "Ribbit! A frog! Frogs live near ponds, too."] }] },
                { hot: "cattails", label: "Tall cattails", react: "rustle",
                  beats: [{ say: "tuk", mood: "happy", text: ["Cattails!", "Cattails! These tall plants grow in wet, squishy mud near the water."] }] }
              ] } },
            { say: "ria", mood: "excited", pose: "jump", text: ["The water is this way!", "All the clues point the same way. The pond must be behind the tall grass!"] },
            { tap: "tallgrass", ask: ["Push the tall grass aside!", "Tap the tall grass to push it aside."], react: "rustle",
              then: { gone: "tallgrass", reveal: "sparkle", sfx: "splash" } }
          ],
          next: "pond" },

        { id: "pond", place: "lilypond", cast: { ria: "arrive", tuk: "tukAt", momo: "momo" }, gone: ["tallgrass"], reveal: ["sparkle"], moods: { tuk: "excited" },
          beats: [
            { narrate: ["The cool, blue pond!", "There it is! The cool, blue pond, sparkling in the sun."], focus: "water" },
            { tap: "water", ask: ["Tap the water for Tuk!", "Tap the water so Tuk can slide in."],
              then: { hide: "tuk", reveal: ["tukswim", "ripples"], sfx: "splash", mood: { ria: "celebrating" } } },
            { say: "tuk", mood: "happy", text: ["Ahh! Cool water!", "Ahh! The cool water feels so good on my shell. I'm home!"] },
            { tap: "lily", ask: ["Tap the lily bud!", "Something is closed up tight on the lily pad. Tap the bud!"], react: "bounce",
              then: { reveal: "bloom", sfx: "magic", focus: "lily" } },
            { narrate: ["The water lily opens!", "Pop! The water lily opens wide in the warm sunshine."] },
            { say: "tuk", mood: "excited", focus: false, text: ["A gift for you, Ria!", "Wait! A thank-you gift: my shiniest pebble, for a kind friend!"] },
            { do: { reveal: "pebble", sfx: "pop", settle: 300 } },
            { fly: { what: "pebble", to: "gift", keep: true, scale: 1.1 } },
            { say: "ria", mood: "celebrating", pose: "cheer", text: ["Thank you, Tuk!", "Thank you, Tuk! Helping a friend makes my heart feel warm and happy."] },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["You helped too!", "And you helped too! Kind friends help each other. That's the best feeling."] },
            { celebrate: true },
            { end: true }
          ] }
      ]
    },
    /* ---- The Lost Puppy: a happy game, a worried puppy, clues, a safe bright path, and home ---- */
    {
      id: "lost_puppy_001",
      activityId: "story-puppy",
      title: "The Lost Puppy",
      ageRange: [3, 9],
      world: "castle",
      media: "assets/img/animals/dog.jpg",
      hero: "biscuit",
      heroMood: "sad",
      resultMsg: "You helped Biscuit find his way home",
      reward: { category: "stories", badge: "puppy-pal" },
      followUp: "who-makes-sound",              // more animal sounds after Biscuit's bark (an existing game)
      cast: {
        biscuit: { name: "Biscuit", rig: "puppy", portrait: "@rig", size: 72, voice: { pitch: 1.6, rate: 1.08 } },
        mama: { name: "Mama", rig: "dog", portrait: "@rig", size: 92, voice: { pitch: 1.15, rate: .95 } },
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      sounds: { woof: { animal: "dog" }, pop: { cue: "fx.pop" }, flutter: { cue: "world.flutter" }, ting: { cue: "world.discover" },
        knock: { cue: "puzzle.bump" }, magic: { cue: "fx.magic" }, rustle: { cue: "world.rustle" } },
      ambience: "jungle",
      start: "play",
      scenes: [
        { id: "play", place: "park", cast: { biscuit: "grass" }, moods: { biscuit: "happy" },
          beats: [
            { narrate: ["Biscuit the puppy loves to play!", "Biscuit the puppy is playing in the park on a sunny afternoon."] },
            { tap: "biscuit", ask: ["Say hello! Tap Biscuit!", "Biscuit wants to play with you. Tap Biscuit to say hello!"],
              then: { mood: { biscuit: "excited" }, pose: { biscuit: "jump" }, sfx: "woof" } },
            { say: "biscuit", mood: "excited", pose: "jump", text: ["Woof! Let's play ball!", "Woof, woof! Hello! I'm Biscuit. Do you want to play ball with me?"] },
            { tap: "ball", ask: ["Throw the ball! Tap it!", "Tap the red ball to throw it for Biscuit."], react: "bounce",
              then: { fly: { what: "ball", to: "far", keep: true, ms: 900, arc: 120 }, move: { who: "biscuit", to: "far", pose: "run", ms: 1100 }, sfx: "pop" } },
            { say: "biscuit", mood: "celebrating", pose: "jump", text: ["Got it! Again!", "Got it! That was fun! Again, again!"] },
            { do: { reveal: "bfly", look: { biscuit: "bfly" }, mood: { biscuit: "surprised" }, sfx: "flutter" } },
            { say: "biscuit", mood: "excited", text: ["Ooh! A butterfly!", "Ooh, a butterfly! Wait for me, butterfly!"] },
            { do: { fly: { what: "bfly", to: "edgeB", keep: true, ms: 1500, arc: 60 }, move: { who: "biscuit", to: "edge", pose: "run", ms: 1500 } } }
          ],
          next: "lost" },

        { id: "lost", place: "lane", cast: { biscuit: "middle", momo: "momoIn" }, moods: { biscuit: "thinking" },
          beats: [
            { narrate: ["Uh oh. Where is Biscuit?", "The butterfly flies away, high over the rooftops. Biscuit stops and looks around."] },
            { say: "biscuit", mood: "sad", text: ["Where is my home?", "Where am I? Nothing looks the same. Where is my home? I want my mama."] },
            { tap: "biscuit", ask: ["Give Biscuit a cuddle!", "Biscuit feels worried. Tap Biscuit to give him a gentle cuddle."],
              then: { mood: { biscuit: "happy" }, pose: { biscuit: "nod" } } },
            { move: { who: "momo", to: "momo", pose: "run", ms: 1300 } },
            { say: "momo", mood: "happy", pose: "wave", text: ["Don't worry, Biscuit!", "Don't worry, Biscuit. When we're lost, we stay calm and look for clues. We'll find your home together!"] },
            { say: "biscuit", mood: "thinking", pose: "sniff", text: ["Sniff, sniff! My nose can help!", "Sniff, sniff! My nose can help. Dogs can smell things from very far away!"] }
          ],
          next: "clues" },

        { id: "clues", place: "lane", cast: { biscuit: "middle", momo: "momo" }, moods: { biscuit: "thinking" },
          beats: [
            { seek: { ask: ["Find clues to Biscuit's home!", "Help Biscuit find clues. Tap the things that could lead him home."],
              more: ["Find another clue!", "Good clue! Can you find another one?"], need: [2, 3],
              items: [
                { hot: "prints", label: "Paw prints", then: { focus: "prints" },
                  beats: [{ say: "momo", mood: "excited", text: ["Paw prints!", "Paw prints! These are Biscuit's own paw prints. They show the way he came!"] }] },
                { hot: "fence", label: "Wooden fence", react: "wiggle", then: { sfx: "woof", look: { biscuit: "fence" }, mood: { biscuit: "excited" }, focus: false },
                  beats: [{ say: "biscuit", mood: "excited", pose: "jump", text: ["That's Mama's bark!", "Woof! I know that bark! That's my mama, calling from far away!"] }] },
                { hot: "roses", label: "Rose bush", react: "rustle", then: { pose: { biscuit: "sniff" }, focus: false },
                  beats: [{ say: "biscuit", mood: "happy", text: ["Roses, like my garden!", "Sniff... roses! There are roses in my garden at home!"] }] }
              ] } },
            { say: "momo", mood: "excited", pose: "point", focus: false, look: { momo: "prints" }, text: ["Follow the paw prints!", "Let's follow Biscuit's paw prints back. Can you show him the way?"] },
            { puzzle: "pawprints_001" },
            { say: "biscuit", mood: "celebrating", pose: "jump", text: ["I know this street!", "We followed the paw prints! I know this street now!"] }
          ],
          next: "lamps" },

        { id: "lamps", place: "lane", cast: { biscuit: "middle", momo: "momo" }, moods: { biscuit: "happy" },
          beats: [
            { do: { reveal: "night", tint: "night", quiet: true, settle: 1600 } },
            { narrate: ["Night is coming.", "The sun goes down and the sky gets dark. The street lamps are still asleep."] },
            { say: "biscuit", mood: "sad", text: ["It's so dark!", "It's getting so dark. I can't see the way."] },
            { tap: "lamp1", ask: ["Tap the lamp to light it!", "Tap the first lamp to light up the path."], react: "shine",
              then: { reveal: "glow1", sfx: "ting", move: { who: "biscuit", to: "lamp1s", pose: "run", ms: 900 }, mood: { biscuit: "happy" } } },
            { tap: "lamp2", ask: ["Light the next lamp!", "Light the next lamp, so Biscuit can see."], react: "shine",
              then: { reveal: "glow2", sfx: "ting", move: { who: "biscuit", to: "lamp2s", pose: "run", ms: 900 } } },
            { tap: "lamp3", ask: ["One more lamp!", "One more lamp to light the way!"], react: "shine",
              then: { reveal: "glow3", sfx: "ting", move: { who: "biscuit", to: "lamp3s", pose: "run", ms: 900 }, mood: { biscuit: "excited" } } },
            { say: "momo", mood: "happy", text: ["A safe, bright path!", "Look! A safe, bright path. When it's dark, we always choose the bright, safe way."] }
          ],
          next: "houses" },

        { id: "houses", place: "homes", cast: { biscuit: "path", momo: "momo" }, tint: "night", moods: { biscuit: "thinking" },
          beats: [
            { narrate: ["Three cosy houses.", "At the end of the path there are three cosy houses. Which one is Biscuit's home?"] },
            { say: "biscuit", mood: "thinking", text: ["Which one is mine?", "Remember my clues: my house has roses, and a red door."] },
            { choice: { key: "house", by: "biscuit",
              ask: ["Find the red door!", "Biscuit's house has roses AND a red door. Tap Biscuit's house!"], options: [
                { id: "yellow", hot: "houseA", label: "Yellow house", no: ["That door is blue!", "That house has roses, but its door is blue. Look for a red door too!"] },
                { id: "home", hot: "houseB", label: "White house", plate: "top", then: { focus: "houseB", reveal: "porch", sfx: "woof", mood: { biscuit: "celebrating" } },
                  yes: ["That's my house!", "Roses and a red door! That's my house!"] },
                { id: "blue", hot: "houseC", label: "Blue house", ages: [6, 10], no: ["No roses there!", "That house has a red door, but no roses. Biscuit's house has both!"] }
              ] } }
          ],
          next: "home" },

        { id: "home", place: "homes", cast: { biscuit: "path", momo: "momo", mama: "gate" }, hidden: ["mama"], reveal: ["porch"], tint: "night",
          moods: { biscuit: "excited", mama: "surprised" },
          beats: [
            { tap: "door", ask: ["Knock on the red door!", "Tap the red door to knock. Knock, knock!"], react: "bounce", then: { sfx: "knock", focus: "door" } },
            { do: { reveal: "doorOpen", sfx: "woof", settle: 500 } },
            { do: { show: "mama", focus: false, sfx: "woof", settle: 400 } },
            { say: "mama", mood: "excited", pose: "jump", text: ["Biscuit! You're home!", "Biscuit! There you are! I looked everywhere for you!"] },
            { do: { move: { who: "biscuit", to: "hug", pose: "run", ms: 900 }, mood: { biscuit: "celebrating", mama: "celebrating" } } },
            { do: { pose: { biscuit: "jump", mama: "cheer" }, sfx: "woof", settle: 600 } },
            { say: "biscuit", mood: "celebrating", text: ["Mama! I'm home!", "Mama! I got lost, but I stayed calm, followed the clues, and my friends helped me!"] },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["Home at last!", "Home at last! If you ever get lost, stay calm and ask a grown-up helper."] },
            { celebrate: true },
            { end: true }
          ] }
      ]
    },
    /* ---- The Tidy Room: everything has a home — sort, pair, find the lost toy, and watch the room transform ---- */
    {
      id: "tidy_room_001",
      activityId: "story-cleanroom",
      title: "The Tidy Room",
      ageRange: [3, 7],
      world: "castle",
      media: "assets/img/animals/bear.jpg",
      hero: "sam",
      heroMood: "surprised",
      resultMsg: "You helped Sam tidy his room",
      reward: { category: "stories", badge: "tidy-star" },
      followUp: "habit-choose",                 // Good Habits, after the story
      cast: {
        sam: { name: "Sam", rig: "bear", portrait: "@rig", size: 84, voice: { pitch: 1.35, rate: 1.02 } },
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      sounds: { boing: { cue: "fx.pop" }, tick: { cue: "ui.tap" }, magic: { cue: "fx.magic" }, swish: { cue: "world.rustle" },
        ding: { cue: "game.tone" }, tidy: { cue: "ui.select" } },
      start: "mess",
      scenes: [
        { id: "mess", place: "bedroom", cast: { sam: "bed2", momo: "momoIn" }, hidden: ["sam"], moods: { sam: "excited" },
          beats: [
            { narrate: ["What a messy room!", "This is Sam's bedroom. Toys, books and clothes are all over the floor!"] },
            { tap: "blanket", ask: ["Something is wiggling! Tap it!", "Something is wiggling under the blanket. Tap it!"], react: "wiggle",
              then: { show: "sam", mood: { sam: "excited" }, pose: { sam: "jump" }, sfx: "boing" } },
            { say: "sam", mood: "excited", pose: "jump", text: ["Peekaboo! I'm Sam!", "Peekaboo! I'm Sam. I was hiding under my blanket!"] },
            { tap: "clock", ask: ["Tick, tock! Tap the clock!", "Tick, tock! Tap the clock to see what time it is."], react: "wiggle", then: { sfx: "tick", focus: "clock" } },
            { narrate: ["It's almost dinner time!", "The clock says it's almost dinner time. Grandma is coming to visit!"] },
            { say: "sam", mood: "surprised", focus: false, text: ["Oh no! My room is a mess!", "Oh no! Grandma is coming, and my room is a big mess!"] },
            { move: { who: "momo", to: "momo", pose: "run", ms: 1200 } },
            { say: "momo", mood: "happy", pose: "wave", text: ["Let's tidy up together!", "Don't worry, Sam! Let's tidy up together. Everything in your room has its own home."] }
          ],
          next: "sort" },

        { id: "sort", place: "bedroom", cast: { sam: "bed2", momo: "momo" }, moods: { sam: "thinking" },
          beats: [
            { sort: { by: "sam",
              ask: ["Where does the {thing} go?", "Where does the {thing} belong? Tap its home!"],
              no: ["Not there!", "Hmm, not there. Where does the {thing} belong?"],
              praise: [["In it goes!", "In it goes!"], ["That's its home!", "Yes! That's its home."], ["So tidy!", "Neat and tidy!"]],
              places: { toybox: { label: "Toy box", at: "boxIn" }, shelf: { label: "Bookshelf", at: "shelfIn", plate: "top" }, drawer: { label: "Drawer", at: "drawerIn" } },
              items: [
                { hot: "teddy", name: "teddy", to: "toybox", show: "box-teddy", yes: ["Teddy goes in the toy box!", "Teddy goes in the toy box, with the other toys."],
                  no: { shelf: ["Teddy isn't a book!", "Teddy isn't a book! Where do toys live?"], drawer: ["That's for clothes!", "The drawer is for clothes. Where do toys live?"] } },
                { hot: "book", name: "book", to: "shelf", show: "shelf-book", yes: ["Books go on the shelf!", "Books stand up tall on the bookshelf, so we can find them."],
                  no: { toybox: ["Books aren't toys!", "Books get squashed in the toy box. Where do books live?"], drawer: ["Not with the clothes!", "The drawer is for clothes. Where do books live?"] } },
                { hot: "shirt", name: "T-shirt", to: "drawer", show: "drawer-shirt", yes: ["Clothes go in the drawer!", "Clothes go in the drawer, ready to wear."],
                  no: { toybox: ["A T-shirt isn't a toy!", "A T-shirt isn't a toy! Where do clothes live?"], shelf: ["That's for books!", "The shelf is for books. Where do clothes live?"] } },
                { hot: "ball", name: "ball", to: "toybox", show: "box-ball", ages: [4, 10] },
                { hot: "car", name: "toy car", to: "toybox", show: "box-car", ages: [6, 10] },
                { hot: "blocks", name: "stack of blocks", to: "toybox", show: "box-blocks", ages: [6, 10] }
              ] } },
            { say: "sam", mood: "celebrating", pose: "jump", text: ["The floor is clear!", "Look! The floor is nearly clear. Tidying up is fun!"] }
          ],
          next: "socks" },

        { id: "socks", place: "bedroom", cast: { sam: "floor", momo: "momo" }, moods: { sam: "thinking" },
          gone: ["teddy", "book", "shirt", "ball", "car", "blocks"], reveal: ["box-teddy", "box-ball", "box-car", "box-blocks", "shelf-book", "drawer-shirt"],
          beats: [
            { narrate: ["Sam puts the rest away.", "Sam hops down and puts the rest of his toys away. Now, what about that pile of socks?"] },
            { say: "sam", mood: "thinking", look: "socks", text: ["My socks are all mixed up!", "My socks are all mixed up! Socks come in pairs."] },
            { tap: "socks", ask: ["Tap the sock pile!", "Tap the pile of socks to sort them into pairs."], react: "bounce" },
            { puzzle: "socks_001" },
            { do: { fly: { what: "socks", to: "drawerIn", ms: 900 }, reveal: "drawer-socks", quiet: true, sfx: "tidy" } },
            { say: "sam", mood: "celebrating", pose: "jump", text: ["Pairs in the drawer!", "Every sock found its partner. Pairs go in the drawer!"] }
          ],
          next: "underbed" },

        { id: "underbed", place: "bedroom", cast: { sam: "floor", momo: "momo" }, moods: { sam: "happy" },
          gone: ["teddy", "book", "shirt", "ball", "car", "blocks", "socks"], reveal: ["box-teddy", "box-ball", "box-car", "box-blocks", "shelf-book", "drawer-shirt", "drawer-socks"],
          beats: [
            { say: "momo", mood: "thinking", pose: "point", look: "underbed", text: ["What's under the bed?", "Wait... I can see something hiding under the bed!"] },
            { tap: "underbed", ask: ["Peek under the bed!", "Tap under the bed to take a peek."], react: "shine", then: { reveal: "dino", focus: "dino", sfx: "magic" } },
            { say: "sam", mood: "surprised", pose: "jump", text: ["My dinosaur, Rex!", "My dinosaur, Rex! I lost him last week!"] },
            { say: "momo", mood: "happy", text: ["Tidying finds lost things!", "When we tidy up, we find lost things. And when every toy has a home, it doesn't get lost again!"] },
            { do: { fly: { what: "dino", to: "boxIn", ms: 1000 }, reveal: "box-dino", focus: false, quiet: true, sfx: "tidy" } }
          ],
          next: "sparkle" },

        { id: "sparkle", place: "bedroom", cast: { sam: "floor", momo: "momo" }, moods: { sam: "excited" },
          gone: ["teddy", "book", "shirt", "ball", "car", "blocks", "socks", "dino"],
          reveal: ["box-teddy", "box-ball", "box-car", "box-blocks", "shelf-book", "drawer-shirt", "drawer-socks", "box-dino"],
          beats: [
            { narrate: ["Two more jobs!", "Just two more jobs to make the room perfect."] },
            { seek: { ask: ["Make the bed and open the curtains!", "Tap the bed to make it, and tap the window to let the sunshine in!"],
              more: ["One more job!", "One more job to go!"],
              items: [
                { hot: "blanket", label: "Messy bed", react: "wiggle", then: { gone: "blanket", reveal: "tidyBed", sfx: "swish" },
                  beats: [{ say: "sam", mood: "happy", text: ["Bed made!", "Smooth and neat! My bed is made."] }] },
                { hot: "window", label: "Window", react: "bounce", then: { gone: ["curtains", "dim"], reveal: ["curtainsOpen", "sunbeam"], sfx: "swish" },
                  beats: [{ say: "momo", mood: "excited", text: ["Hello, sunshine!", "Hello, sunshine! What a bright, cheerful room."] }] }
              ] } },
            { do: { reveal: "sparkles", sfx: "magic", mood: { sam: "celebrating", momo: "celebrating" } } },
            { narrate: ["Wow! What a tidy room!", "Wow! The whole room sparkles, neat and clean!"] },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["Everything has a home!", "Everything is in its home, Sam. Now you can find all your toys!"] },
            { do: { sfx: "ding", settle: 500 } },
            { narrate: ["Ding, dong! Grandma is here!", "Ding, dong! Grandma is at the door, just in time for dinner."] },
            { say: "sam", mood: "celebrating", pose: "cheer", text: ["We did it!", "We did it! Tidying up was fun, and my room looks great!"] },
            { celebrate: true },
            { end: true }
          ] }
      ]
    },
    /* ---- The Little Explorer: plan, pack, choose the safe path, notice everything, follow the trail, reach the top ---- */
    {
      id: "little_explorer_001",
      activityId: "story-explorer",
      title: "The Little Explorer",
      ageRange: [3, 10],
      world: "castle",
      media: "assets/img/animals/fox.jpg",           // card art: the explorer's companion, Momo the fox
      hero: "mia",
      heroMood: "excited",
      resultMsg: "You helped Mia climb Sunny Hill",
      reward: { category: "stories", badge: "hill-climber" },
      followUp: "discovery-chameleon",          // the camouflage clue, as a Quick Discovery after the story
      cast: {
        mia: { name: "Mia", rig: "panda", portrait: "@rig", size: 82, voice: { pitch: 1.45, rate: 1.03 } },
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      sounds: { pop: { cue: "fx.pop" }, rustle: { cue: "world.rustle" }, peck: { cue: "ui.tap" }, magic: { cue: "fx.magic" },
        whoosh: { cue: "world.travel" }, discover: { cue: "world.discover" }, bump: { cue: "puzzle.bump" } },
      ambience: "jungle",
      start: "camp",
      scenes: [
        { id: "camp", place: "basecamp", cast: { mia: "mia", momo: "momo" }, moods: { mia: "excited" },
          beats: [
            { narrate: ["Mia loves to explore!", "Mia the little panda is a brave explorer. Today she wants to climb all the way to the top of Sunny Hill!"] },
            { say: "mia", mood: "excited", pose: "wave", text: ["Hi! I'm Mia, the explorer!", "Hi! I'm Mia, and I'm an explorer! Will you come with me?"] },
            { tap: "map", ask: ["Tap Mia's map!", "Every explorer needs a map. Tap the map to open it!"], react: "bounce",
              then: { reveal: "mapOpen", focus: "mapOpen", sfx: "rustle" } },
            { say: "mia", mood: "excited", look: "mapOpen", text: ["The X marks the top!", "Look! The red X marks the very top of Sunny Hill. That's where I'll plant my flag!"] },
            { do: { gone: "mapOpen", focus: false, settle: 300 } },
            { seek: { by: "mia", ask: ["What should Mia pack? Tap it!", "A long climb is ahead. Tap the things an explorer should pack!"],
              more: ["What else?", "What else will Mia need?"], need: [2, 3],
              items: [
                { hot: "water", label: "Water bottle", then: { fly: { what: "water", to: "mia", ms: 700 }, sfx: "pop" },
                  beats: [{ say: "mia", mood: "happy", text: ["Water! Gulp, gulp!", "Water! Explorers need to drink water on a long walk."] }] },
                { hot: "hat", label: "Sun hat", then: { fly: { what: "hat", to: "mia", ms: 700 }, sfx: "pop" },
                  beats: [{ say: "mia", mood: "happy", text: ["A sun hat!", "A sun hat keeps the hot sun off my head."] }] },
                { hot: "compass", label: "Compass", ages: [6, 10], then: { fly: { what: "compass", to: "mia", ms: 700 }, sfx: "pop" },
                  beats: [{ say: "momo", mood: "excited", text: ["A compass!", "A compass! Its needle always points north, so explorers know which way they're going."] }] },
                { hot: "duck", label: "Rubber duck", no: ["A duck? That's silly!", "A rubber duck? That's for bath time, not for climbing hills!"] }
              ] } },
            { say: "momo", mood: "happy", pose: "wave", text: ["Ready, explorer? Let's go!", "Now you're ready, explorer. Let's go!"] }
          ],
          next: "fork" },

        { id: "fork", place: "basecamp", cast: { mia: "mia", momo: "momo" }, gone: ["water", "hat", "compass"], moods: { mia: "thinking" },
          beats: [
            { narrate: ["The path splits in two!", "The path splits in two. One way is soft green grass. The other way is sharp, steep rocks."] },
            { choice: { key: "path", by: "mia", ask: ["Which way is safer? Tap it!", "Which path is safer for a little explorer? You choose!"], options: [
              { id: "grass", hot: "grassPath", label: "Grassy path", detail: "Gentle and soft", next: "hillside",
                then: { move: { who: "mia", to: "grassGo", pose: "hop", ms: 1400 } } },
              { id: "rocks", hot: "rockPath", label: "Rocky path", detail: "Steep and sharp", plate: "top", next: "wobble" }
            ] } }
          ] },

        // If the child picks the rocks: a little wobble, then the safe way (no wrong answer — a lesson).
        { id: "wobble", place: "basecamp", cast: { mia: "mia", momo: "momo" }, gone: ["water", "hat", "compass"], moods: { mia: "excited" },
          beats: [
            { move: { who: "mia", to: "rockStep", pose: "hop", ms: 1100 } },
            { do: { fly: { what: "pebble", to: "mia", keep: true, rotate: 320, ms: 900, arc: 20 }, mood: { mia: "surprised" }, pose: { mia: "jump" }, sfx: "bump" } },
            { say: "mia", mood: "surprised", text: ["Whoa! Wobbly rocks!", "Whoa! These rocks are wobbly and sharp. A stone just tumbled down!"] },
            { say: "momo", mood: "thinking", text: ["Let's take the safe way.", "Rushing up steep, sharp rocks isn't safe. Let's choose the gentle grassy path instead."] },
            { move: { who: "mia", to: "grassGo", pose: "hop", ms: 1600 } }
          ],
          next: "hillside" },

        { id: "hillside", place: "hillside", cast: { mia: "mia", momo: "momo" }, moods: { mia: "happy" },
          beats: [
            { narrate: ["Halfway up the hill!", "Step by step, Mia climbs the gentle path. Halfway up, there are so many things to explore!"] },
            { say: "mia", mood: "excited", text: ["Explorers notice things!", "Explorers look closely and notice things. What should we explore first?"] },
            { seek: { ask: ["What should we explore? Tap it!", "You choose! Tap something you want to explore."], more: ["What else?", "What else can we explore?"], need: [2, 4],
              items: [
                { hot: "prints", label: "Hoof prints", then: { focus: "prints" }, beats: [
                  { say: "mia", mood: "thinking", text: ["Hoof prints!", "Hoof prints! Each one has two parts. Which animal made them?"] },
                  { do: { reveal: "deer", look: { mia: "deer" }, focus: "deer", sfx: "discover" } },
                  { say: "momo", mood: "excited", text: ["A deer!", "A deer! A deer's hooves are split in two, just like these prints."] }] },
                { hot: "tree", label: "Tall tree", react: "rustle", then: { reveal: "woodpecker", focus: "tree" }, beats: [
                  { sfx: "peck" }, { sfx: "peck" }, { sfx: "peck" },
                  { say: "mia", mood: "surprised", text: ["Tap, tap, tap!", "Tap, tap, tap! A woodpecker is pecking the tree."] },
                  { say: "momo", mood: "happy", ages: [5, 10], text: ["Looking for bugs!", "Woodpeckers peck little holes in trees to find bugs to eat."] }] },
                { hot: "branch", label: "Leafy branch", react: "rustle", then: { reveal: "chameleon", focus: "branch" }, beats: [
                  { say: "mia", mood: "surprised", pose: "jump", text: ["A chameleon!", "Look closely! A chameleon was hiding on the branch!"] },
                  { say: "momo", mood: "excited", text: ["It can change colour!", "Chameleons can change colour to blend in with the leaves. That's called camouflage."] }] },
                { hot: "dandelion", label: "Dandelion", react: "wiggle", then: { reveal: "seeds", sfx: "whoosh" }, beats: [
                  { say: "mia", mood: "excited", text: ["Whoosh! Seeds!", "Whoosh! The dandelion seeds fly away on the wind."] },
                  { say: "momo", mood: "happy", ages: [5, 10], text: ["New plants!", "Each little seed can land far away and grow into a new plant."] }] }
              ] } },
            { say: "mia", mood: "celebrating", pose: "jump", focus: false, text: ["What a lot we found!", "Wow! Being an explorer means looking closely. What a lot we found!"] }
          ],
          next: "trail" },

        { id: "trail", place: "hillside", cast: { mia: "mia", momo: "momo" }, moods: { mia: "thinking" },
          beats: [
            { say: "momo", mood: "thinking", pose: "point", look: "upper", text: ["Look! Trail markers!", "Look! Trail markers. Explorers follow them, and these flags make a pattern."] },
            { puzzle: "trailmarks_001" },
            { say: "mia", mood: "celebrating", pose: "jump", text: ["This way to the top!", "The pattern shows the way. Up we go, step by step!"] },
            { move: [{ who: "mia", to: "upper", pose: "hop", ms: 1800 }, { who: "momo", to: "upper", pose: "run", ms: 2000 }] }
          ],
          next: "summit" },

        { id: "summit", place: "summit", cast: { mia: "mia", momo: "momo" }, moods: { mia: "excited" },
          beats: [
            { narrate: ["The top of Sunny Hill!", "Step by step, slow and steady, Mia reaches the very top of Sunny Hill!"] },
            { tap: "flagspot", ask: ["Plant the flag! Tap the top!", "Tap the very top of the hill to plant Mia's flag!"], react: "shine",
              then: { move: { who: "mia", to: "flagAt", pose: "hop", ms: 800 }, reveal: "flag", sfx: "magic", mood: { mia: "celebrating" } } },
            { say: "mia", mood: "celebrating", pose: "cheer", text: ["I did it!", "I did it! My flag is on the top of Sunny Hill!"] },
            { tap: "telescope", ask: ["Look through the telescope!", "Tap the telescope to look far, far away."], react: "bounce",
              then: { focus: "far", reveal: "rainbow", sfx: "discover" } },
            { say: "mia", mood: "excited", text: ["I can see Adventure Village!", "I can see the river, the forest and Adventure Village, way down there. And a rainbow!"] },
            { say: "momo", mood: "celebrating", pose: "cheer", focus: false, text: ["Slow and steady!", "You did it, Mia! You went slow and steady and chose the safe path, all the way to the top."] },
            { celebrate: true },
            { end: true }
          ] }
      ]
    },
    /* ---- The Magic Garden: a glowing seed, what plants need, how they grow, who visits — and a secret garden ---- */
    {
      id: "magic_garden_001",
      activityId: "story-garden",
      title: "The Magic Garden",
      ageRange: [3, 10],
      world: "castle",
      media: "assets/img/flowers/tulip.jpg",
      hero: "leo",
      heroMood: "sad",
      resultMsg: "You helped Leo's magic garden grow",
      reward: { category: "stories", badge: "green-thumb" },
      followUp: "discovery-butterfly",          // the flower's visitor, as a Quick Discovery after the story
      cast: {
        leo: { name: "Leo", rig: "lion", portrait: "@rig", size: 82, voice: { pitch: 1.3, rate: 1.02 } },
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      sounds: { magic: { cue: "fx.magic" }, pop: { cue: "fx.pop" }, splash: { cue: "fx.splash" }, buzz: { animal: "bee" },
        flutter: { cue: "world.flutter" }, discover: { cue: "world.discover" } },
      ambience: "jungle",
      start: "dry",
      scenes: [
        { id: "dry", place: "garden", cast: { leo: "leo", momo: "momo" }, moods: { leo: "sad" },
          beats: [
            { narrate: ["Leo's garden is dry and empty.", "Leo the lion cub has a little garden. But it's dry and brown, and nothing is growing."] },
            { say: "leo", mood: "sad", text: ["My garden is so empty.", "My garden is so empty. I wish it had flowers."] },
            { tap: "sparkle", ask: ["Something is glowing! Tap it!", "Look! Something is glowing in the soil. Tap it!"], react: "shine",
              then: { reveal: "seed", focus: "seed", sfx: "magic" } },
            { say: "leo", mood: "surprised", pose: "jump", text: ["A magic seed!", "A seed! A tiny, glowing seed. Maybe it's a magic seed!"] },
            { say: "momo", mood: "excited", focus: false, text: ["Let's plant it!", "Let's plant it and help it grow! First, it needs a home in the soil."] },
            { tap: "bed", ask: ["Plant the seed! Tap the soil!", "Tap the soft soil to plant the seed."], react: "shine",
              then: { fly: { what: "seed", to: "seedSoil", ms: 900 }, reveal: "planted", sfx: "pop", mood: { leo: "happy" } } },
            { say: "leo", mood: "happy", text: ["Into the soil it goes!", "Into the soil it goes. Its roots will grow down into the earth."] }
          ],
          next: "needs" },

        { id: "needs", place: "garden", cast: { leo: "leo", momo: "momo" }, gone: ["seed", "sparkle"], reveal: ["planted"], moods: { leo: "thinking" },
          beats: [
            { say: "momo", mood: "thinking", text: ["What does a seed need?", "Soil is the seed's home. It needs two more things to grow. What could they be?"] },
            { seek: { ask: ["What does the seed need? Tap it!", "Tap the things a seed needs to grow."], more: ["What else?", "What else does a seed need?"],
              items: [
                { hot: "can", label: "Watering can", then: { fly: { what: "can", to: "pourAt", keep: true, rotate: -30, ms: 800 } }, beats: [
                  { do: { reveal: ["pour", "wet"], sfx: "splash", settle: 1000 } },
                  { do: { gone: "pour", settle: 100 } },
                  { say: "leo", mood: "excited", text: ["Splish, splash! Water!", "Splish, splash! Seeds need water to wake up and grow."] }] },
                { hot: "cloud", label: "Cloud over the sun", then: { fly: { what: "cloud", to: "cloudAway", ms: 1300 }, reveal: "sunrays", mood: { leo: "excited" } }, beats: [
                  { say: "leo", mood: "excited", text: ["Hello, sunshine!", "Hello, sunshine! Plants need sunlight to grow."] },
                  { say: "momo", mood: "happy", ages: [6, 10], text: ["Plants make food!", "Plants use sunlight, air and water to make their own food. Amazing!"] }] },
                { hot: "candy", label: "Lollipop", ages: [5, 10], no: ["Plants don't eat candy!", "Candy? Plants don't eat candy! They make their own food from sunlight."] }
              ] } }
          ],
          next: "grow" },

        { id: "grow", place: "garden", cast: { leo: "leo", momo: "momo" }, gone: ["seed", "sparkle", "cloud"], reveal: ["planted", "wet", "sunrays"], moods: { leo: "happy" },
          beats: [
            { narrate: ["Days go by...", "Leo waters his seed every day, and the sun shines. Days go by, and something starts to happen..."] },
            { do: { gone: "planted", reveal: "sprout", focus: "seedSoil", sfx: "magic" } },
            { say: "leo", mood: "excited", pose: "jump", text: ["A sprout!", "Look! A tiny green sprout is poking out!"] },
            { puzzle: "seedgrow_001" },
            { do: { gone: "sprout", reveal: "plant", sfx: "magic", settle: 1000 } },
            { do: { gone: "plant", reveal: "budPlant", sfx: "magic" } },
            { say: "momo", mood: "excited", focus: false, text: ["Look, a flower bud!", "Care and patience help it grow taller and taller. Look, a flower bud!"] }
          ],
          next: "bloom" },

        { id: "bloom", place: "garden", cast: { leo: "leo", momo: "momo" }, gone: ["seed", "sparkle", "cloud", "planted"], reveal: ["wet", "sunrays", "budPlant"], moods: { leo: "excited" },
          beats: [
            { tap: "bud", ask: ["Tap the flower bud!", "The bud is ready! Tap it to see what happens."], react: "bounce",
              then: { gone: "budPlant", reveal: "flower", focus: "seedSoil", sfx: "magic", mood: { leo: "celebrating", momo: "excited" } } },
            { narrate: ["The magic flower opens!", "The bud opens into a big, glowing, magic flower!"] },
            { do: { reveal: ["bee", "bfly", "worm"], sfx: "buzz", focus: false, settle: 800 } },
            { seek: { ask: ["Who came to visit? Tap them!", "Visitors came to the flower! Tap each one to meet it."], more: ["Who else?", "Who else came to visit?"], need: [2, 3],
              items: [
                { hot: "bflyHot", label: "Butterfly", then: { sfx: "flutter" },
                  beats: [{ say: "momo", mood: "excited", text: ["A butterfly!", "A butterfly! Did you know butterflies taste with their feet?"] }] },
                { hot: "beeHot", label: "Bee", then: { sfx: "buzz" },
                  beats: [{ say: "leo", mood: "happy", text: ["A busy bee!", "A busy bee! Bees carry pollen from flower to flower, so new seeds can grow."] }] },
                { hot: "wormHot", label: "Worm", then: { sfx: "pop" },
                  beats: [{ say: "momo", mood: "happy", text: ["A wiggly worm!", "A wiggly earthworm! Worms dig little tunnels that help roots get air and water."] }] }
              ] } }
          ],
          next: "follow" },

        { id: "follow", place: "garden", cast: { leo: "leo", momo: "momo" }, gone: ["seed", "sparkle", "cloud", "planted", "budPlant"], reveal: ["wet", "sunrays", "flower", "bfly"],
          moods: { leo: "excited" },
          beats: [
            { say: "leo", mood: "excited", look: "bfly", text: ["Let's follow the butterfly!", "Look! The butterfly wants to show us something. Let's follow it!"] },
            { fly: { what: "bfly", to: "f1At", keep: true, ms: 1200 } },
            { tap: "f1", ask: ["Where did it land? Tap it!", "Where did the butterfly land? Tap that flower!"], react: "bounce", then: { sfx: "flutter" } },
            { fly: { what: "bfly", to: "f2At", keep: true, ms: 1300 } },
            { tap: "f2", ask: ["Where now? Tap it!", "Now where did it go? Tap that flower!"], react: "bounce", then: { sfx: "flutter" } },
            { fly: { what: "bfly", to: "gateAt", keep: true, ms: 1300 } },
            { say: "momo", mood: "surprised", look: "gate", text: ["A secret gate!", "The butterfly found a gate! I never saw that gate before!"] },
            { tap: "gate", ask: ["Open the gate!", "Tap the gate to open it."], react: "bounce", then: { gone: "gate", reveal: "gateOpen", focus: "gate", sfx: "magic" } }
          ],
          next: "secret" },

        { id: "secret", place: "secretgarden", cast: { leo: "leo", momo: "momo" }, moods: { leo: "thinking" },
          beats: [
            { narrate: ["A secret garden!", "Behind the gate is a secret garden! But it's dry and thirsty too."] },
            { say: "leo", mood: "thinking", text: ["The flowers need water!", "These flowers need water, and my watering can is empty!"] },
            { tap: "raincloud", ask: ["Tap the rain cloud!", "Tap the little rain cloud to give the garden a drink."], react: "bounce",
              then: { reveal: "rain", sfx: "splash", mood: { leo: "excited" } } },
            { seek: { ask: ["Tap the garden to wake it up!", "The rain is falling! Tap the flower beds and the fountain."], more: ["What else?", "Tap the next one!"],
              items: [
                { hot: "bedL", label: "Flower bed", then: { gone: "stems0", reveal: "blooms0", sfx: "magic" }, beats: [{ say: "leo", mood: "excited", text: ["Flowers!", "Look! The flowers are blooming!"] }] },
                { hot: "bedR", label: "Flower bed", then: { gone: "stems1", reveal: "blooms1", sfx: "magic" }, beats: [{ say: "momo", mood: "excited", text: ["So many colours!", "So many colours! Red, yellow, purple and blue!"] }] },
                { hot: "fountain", label: "Fountain", then: { reveal: "water", sfx: "splash" }, beats: [{ say: "leo", mood: "happy", text: ["The fountain works!", "Splash! The fountain is full of water again."] }] }
              ] } },
            { do: { gone: "rain", reveal: ["rainbow", "flutters"], sfx: "discover", mood: { leo: "celebrating", momo: "celebrating" } } },
            { say: "leo", mood: "celebrating", pose: "cheer", text: ["Everything is blooming!", "The whole garden is blooming! Water, sunshine and care helped everything grow."] },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["Care and patience!", "Care and patience help things grow. You're a wonderful gardener!"] },
            { celebrate: true },
            { end: true }
          ] }
      ]
    },
    /* ---- Change #23: Mystery of the Lost Treasure — a treasure hunt on Treasure Island (Puzzle Island) ----
       Every clue needs looking and thinking, not guessing; how hard it is follows the age band:
         3–5  find and match by sight (the star sign, twin map pieces)
         5–7  read the clue tablet (count the stones), put the map's stops in order
         7–10 use every part of the clue (not water, not flowers, two stones), harder lock patterns
       Places: cove, ruins, grotto (js/art/mysteryPlaces.js). Puzzles: treasuremap_001, treasurepath_001, treasurelock_001. */
    {
      id: "lost_treasure_001",
      activityId: "adventure-lost-treasure",
      title: "Mystery of the Lost Treasure",
      ageRange: [3, 10],
      world: "puzzle",
      media: "assets/img/mystery/treasure.svg",
      hero: "momo",
      heroMood: "excited",
      resultMsg: "You found the lost treasure",
      reward: { category: "stories", badge: "treasure-hunter" },
      cast: {
        momo: { name: "Momo", rig: "momo", portrait: "momo", size: 84, voice: { pitch: 1.25, rate: 1 } }
      },
      narratorVoice: { pitch: 1, rate: .95 },
      sounds: { splash: { cue: "world.splash" }, sparkle: { cue: "world.discover" }, rumble: { cue: "story.transition" }, click: { cue: "puzzle.correct" }, treasure: { cue: "puzzle.complete" } },
      ambience: "ocean",
      // The shareable card shown when the treasure is found (js/achievement.js). No name, nothing personal.
      achievement: { kicker: "Treasure Found!", title: "Mystery of the Lost Treasure", art: "chest:open",
        items: [{ icon: "star", text: "Adventure Complete" }, { icon: "trophy", text: "Master Explorer" }], quote: "I solved the mystery!" },
      start: "beach",
      scenes: [
        { id: "beach", place: "cove", cast: { momo: "momo" }, moods: { momo: "excited" }, ambience: "ocean",
          beats: [
            { narrate: ["Treasure Island! Something shines.", "Welcome to Treasure Island! The waves splash... and something is shining on the beach."] },
            { say: "momo", mood: "excited", pose: "wave", text: ["Let's look around!", "Let's be explorers! Tap anything you want to look at."] },
            { seek: { ask: ["Find what's shining!", "Look all around the beach. What is shining in the sand?"], more: ["Keep looking!", "Keep looking! Something is shining."],
              hint: { after: 2, by: "momo", mood: "thinking", focus: "bottle", text: ["Look by the rocks!", "I can see something sparkling by the rocks!"] },
              items: [
                { hot: "crab", label: "Crab", react: "wiggle", no: ["A crab! Snap, snap!", "A little crab says snap, snap! It isn't shining, though."] },
                { hot: "palm", label: "Palm tree", react: "rustle", then: { reveal: "coconut" },
                  beats: [{ say: "momo", mood: "happy", text: ["Bonk! A coconut!", "Bonk! A coconut fell down. Yummy, but it isn't shining."] }] },
                { hot: "shell", label: "Shell", react: "shine", beats: [{ say: "momo", mood: "happy", text: ["A pretty shell!", "A pretty pink shell. It's shiny, but something is shining even more!"] }] },
                { hot: "boat", label: "Old boat", ages: [5, 10], no: ["Just an old boat.", "An old wooden boat. Nothing shining in here."] },
                { hot: "bottle", label: "Bottle", react: "shine", ends: true }
              ] } },
            { do: { gone: "bottle", reveal: "map", sfx: "sparkle", mood: { momo: "surprised" } } },
            { narrate: ["A message in a bottle!", "A message in a bottle! An old treasure map was rolled up inside."] },
            { say: "momo", mood: "thinking", text: ["Oh no, it's torn!", "Oh no! The map is torn into pieces. Let's put it back together!"] }
          ],
          next: "mend" },

        { id: "mend", place: "cove", cast: { momo: "momo" }, moods: { momo: "thinking" }, gone: ["bottle"], reveal: ["map"],
          beats: [
            { puzzle: "treasuremap_001" },
            { do: { gone: "map", reveal: "mapWhole", sfx: "sparkle", mood: { momo: "excited" } } },
            { say: "momo", mood: "excited", pose: "jump", text: ["The map! An X!", "The map is whole! A red path goes to a cave, and an X marks the treasure!"] },
            { puzzle: "treasurepath_001", ages: [5, 10] },
            { narrate: ["Find the secret signs!", "There's a note on the map: find the secret signs on the old stones."] }
          ],
          next: "ruins" },

        { id: "ruins", place: "ruins", cast: { momo: "momo" }, moods: { momo: "thinking" }, ambience: "jungle",
          beats: [
            { narrate: ["Old stones in the jungle!", "The path leads to old stones, deep in the jungle. Secret signs are hidden here."] },
            { seek: { ask: ["Find the secret signs!", "Search for the secret signs. Look closely at the stones, the trees and the leaves!"],
              more: ["Find another sign!", "Can you find another secret sign?"], need: [2, 3],
              items: [
                { hot: "starStone", label: "Standing stone", react: "shine", then: { reveal: "starGlow", sfx: "sparkle" },
                  beats: [{ say: "momo", mood: "excited", text: ["A star sign!", "A star, carved in the stone! That's a secret sign."] }] },
                { hot: "moonTree", label: "Old tree", react: "rustle", then: { reveal: "moonGlow", sfx: "sparkle" },
                  beats: [{ say: "momo", mood: "excited", text: ["A moon sign!", "A moon, carved in the tree bark!"] }] },
                { hot: "leaves", label: "Pile of leaves", react: "rustle", ages: [5, 10], then: { gone: "leaves", reveal: "sunSign", sfx: "sparkle" },
                  beats: [{ say: "momo", mood: "excited", text: ["A sun sign!", "Under the leaves... a sun sign!"] }] },
                { hot: "frog", label: "Frog", react: "bounce", no: ["Ribbit! A frog.", "Ribbit! That's a frog, not a secret sign."] },
                { hot: "flower", label: "Flower", ages: [6, 10], no: ["Just a flower.", "A pretty flower, but no secret sign."] }
              ] } },
            { do: { reveal: "tabletGlow", sfx: "sparkle" } },
            { narrate: ["The big stone glows!", "Look! The old stone tablet is glowing. It's the next clue!"] },
            { tap: "tablet", ask: ["Tap the glowing stone!", "Tap the glowing stone tablet to read the clue."], react: "shine",
              then: { reveal: "tabletClue", focus: "tablet" } }
          ],
          next: "paths" },

        { id: "paths", place: "ruins", cast: { momo: "momo" }, moods: { momo: "thinking" },
          reveal: ["starGlow", "moonGlow", "tabletGlow", "tabletClue"],
          beats: [
            // 3–4: match the sign from the stones to the sign on a path post
            { ages: [3, 4], say: "momo", mood: "thinking", text: ["Follow the star!", "The star was the first secret sign. Let's follow the star!"] },
            { ages: [3, 4], choice: { key: "path", by: "momo", ask: ["Find the path with the star!", "Which path has a star on its sign?"], options: [
              { id: "river", hot: "pathRiver", label: "Water path", no: ["That sign has a heart.", "That sign has a heart. Look for the star!"] },
              { id: "flower", hot: "pathFlower", label: "Flower path", no: ["That sign has a leaf.", "That sign has a leaf. Look for the star!"] },
              { id: "stone", hot: "pathStone", label: "Stone path", yes: ["The star path!", "The star! This is the way!"] }
            ] } },
            // 5–6: read the picture clue — count the stones
            { ages: [5, 6], say: "momo", mood: "thinking", text: ["Two stones!", "The tablet shows two stones. Which path has two stones?"] },
            { ages: [5, 6], choice: { key: "path", by: "momo", ask: ["Which path has two stones?", "Count the stones on each path. Which path has two?"], options: [
              { id: "river", hot: "pathRiver", label: "Water path", no: ["Count again!", "Count again: this path has three stones."] },
              { id: "flower", hot: "pathFlower", label: "Flower path", no: ["Only one stone.", "This path has only one stone."] },
              { id: "stone", hot: "pathStone", label: "Stone path", yes: ["Two stones!", "One, two! Two stones. This is the way!"] }
            ] } },
            // 7–10: use every part of the clue
            { ages: [7, 10], say: "momo", mood: "thinking", text: ["Read every part!", "The tablet says three things: not by the water, not where flowers grow, and two stones."] },
            { ages: [7, 10], choice: { key: "path", by: "momo", ask: ["Which path fits the clue?", "Which path fits every part of the clue?"], options: [
              { id: "river", hot: "pathRiver", label: "Water path", no: ["Not by the water!", "This path is by the water, and the clue says not by the water."] },
              { id: "flower", hot: "pathFlower", label: "Flower path", no: ["Not by the flowers!", "Flowers grow here, and the clue says not where flowers grow."] },
              { id: "stone", hot: "pathStone", label: "Stone path", yes: ["It fits!", "No water, no flowers, and two stones. It fits every part of the clue!"] }
            ] } },
            { do: { gone: "vines", reveal: "pathGlow", sfx: "sparkle", mood: { momo: "excited" } } },
            { narrate: ["A hidden path!", "The vines slide away... and a hidden path appears!"] },
            { move: { who: "momo", to: "pathGo", pose: "jump", ms: 1000 } }
          ],
          next: "door" },

        { id: "door", place: "grotto", cast: { momo: "momo" }, moods: { momo: "surprised" }, ambience: null,
          beats: [
            { narrate: ["A cave with a big door!", "The hidden path leads into a cave. A huge stone door blocks the way."] },
            { tap: "door", ask: ["Tap the door!", "Tap the stone door to look at its lock."], react: "nope", then: { focus: "door" } },
            { say: "momo", mood: "thinking", text: ["A sign lock!", "It's a secret lock that uses the signs we found. Finish the pattern to open it!"] },
            { puzzle: "treasurelock_001" },
            { do: { focus: false, gone: "door", reveal: "chamber", sfx: "rumble", mood: { momo: "excited" } } },
            { narrate: ["The door opens!", "Rumble, rumble! The stone door slides open!"] }
          ],
          next: "treasure" },

        { id: "treasure", place: "grotto", cast: { momo: "momo" }, moods: { momo: "excited" }, gone: ["door"], reveal: ["chamber"],
          beats: [
            { tap: "chest", ask: ["Open the chest!", "There it is! Tap the treasure chest to open it!"], react: "shine",
              then: { gone: "chestShut", reveal: ["treasureRays", "chestOpen"], sfx: "treasure", mood: { momo: "celebrating" } } },
            { celebrate: "treasure" },
            { say: "momo", mood: "celebrating", pose: "cheer", text: ["We found the treasure!", "We found the lost treasure! You solved the whole mystery!"] },
            { end: true }
          ] }
      ]
    }
  ];
})(window);
