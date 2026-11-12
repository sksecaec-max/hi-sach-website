/* =========================================================================
   learningConfig.js — every number the adaptive layer uses, in one place.

   Read by js/engine/learning.js (Kido.Learning). Nothing else hard-codes
   these. Change a value here and the behaviour changes everywhere.

   The adaptive layer works quietly: the child only ever sees "Here's a new
   challenge!" or "Let's try another one!" — never a level, score or grade.
   ========================================================================= */
(function (window) {
  "use strict";
  var Kido = window.Kido = window.Kido || {};

  Kido.learningConfig = {
    version: 1,

    /* Puzzle levels 1..5 are the existing PuzzleEngine tiers:
       1 introductory · 2 a bit more · 3 moderate · 4 advanced for the age · 5 challenging. */
    levels: { min: 1, max: 5 },

    /* Age sets the starting level (PuzzleEngine.tier); demonstrated play can move
       a skill at most this far above / below that start. */
    ability: { aboveAge: 2, belowAge: 2 },

    difficulty: {
      increaseAfterSuccesses: 3,      // successes in a row at (or above) the skill's level → one step up
      supportAfterStruggles: 2,       // 2 of the last 3 at (or below) the level were hard → easier picks + early hint
      decreaseAfterStruggles: 3,      // 3 hard ones in a row at (or below) the level → one step down
      maxStepChange: 1,               // never jump more than one level
      maxChangesPerSession: 1,        // per skill per session; a raise stays provisional until it holds in a later session
      revertProvisionalAfterStruggles: 2,
      evidenceKept: 8                 // recent observations remembered per skill
    },

    /* How one finished puzzle is read. One mistake is never a "struggle". */
    outcome: {
      successMaxMistakes: 0, successMaxHints: 0, successMaxMs: 60000,
      struggleMinMistakes: 3, struggleMinHints: 2,
      slowMs: 120000                  // solved, but with mistakes and over 2 minutes → counts as hard
    },

    /* Share of puzzle plays at each relative level (applied when a puzzle starts). */
    contentMix: { current: 0.60, challenge: 0.25, reinforcement: 0.15 },

    repetition: {
      avoidLastPuzzles: 2,            // don't offer the same puzzle again within this many plays
      avoidLastTypes: 1,              // …nor the same puzzle type straight away
      avoidLastDiscoveries: 2,
      recentKept: 12
    },

    /* A new session starts after this long without play (or on a fresh day). */
    session: { gapMinutes: 30, itemsKept: 40 },

    /* Stories: guidance when taps take long, or when several skills need support. */
    story: { slowTapMs: 12000, guideWhenSupportSkills: 2 },

    /* Mini-games that report correct/total: accuracy read as an observation
       (shown to parents; puzzle levels only move from puzzle play). */
    activitySignal: { successAt: 0.9, struggleBelow: 0.6 },

    /* Skills that real Kido content exercises — nothing invented.
       puzzleTypes: Logic & Puzzle Engine types; activities: catalog mini-games. */
    /* about: how parents read it in a sentence ("Showing consistent success with …").
       Always a PLURAL noun phrase — the Parent Zone says "{About} are …". */
    skills: {
      pattern:        { label: "Pattern recognition",        about: "pattern puzzles",                 puzzleTypes: ["pattern"] },
      sequencing:     { label: "Sequencing",                 about: "sequencing puzzles",              puzzleTypes: ["sequence"] },
      matching:       { label: "Matching",                   about: "matching activities",             puzzleTypes: ["match"], activities: ["shadow-match"] },
      classification: { label: "Sorting & classifying",      about: "sorting activities",              puzzleTypes: ["sort"], activities: ["shape-sorter", "fruit-sorter"] },
      observation:    { label: "Observation",                about: "spot-the-difference puzzles",     puzzleTypes: ["oddOneOut"] },
      spatial:        { label: "Spatial thinking",           about: "maze and direction puzzles",      puzzleTypes: ["maze"] },
      memory:         { label: "Memory",                     about: "memory games",                    puzzleTypes: ["missing"], activities: ["memory-match", "fruit-memory"] }
    },

    /* Today's Adventure: one familiar puzzle, one new challenge, one discovery or story;
       the rest of the day's steps come from the existing journey pool. */
    today: { steps: 5 },

    /* Parent-facing words (descriptive, never grades) and the matching sentences
       the Parent Zone shows ({about} = the skill's "about" phrase). */
    words: { start: "Getting started", practicing: "Practicing", growing: "Making progress", strong: "Consistent success" },
    sentences: {
      start: "Has started exploring {about}.",
      practicing: "{About} are being practiced.",
      practicingHelp: "{About} are being practiced, with hints offered a little sooner.",
      growing: "Making steady progress with {about}.",
      strong: "Showing consistent success with {about}."
    },

    /* What the child hears. */
    lines: {
      challenge: ["Here's a new challenge!", "Ooh, a trickier one!", "Ready for something new?"],
      another: ["Let's try another one!"]
    }
  };
})(window);
