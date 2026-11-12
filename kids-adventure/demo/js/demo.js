/* Demo build only: one activity per theme is playable, the rest show a lock.
   Every way into an activity goes through Kido.screens.play, so the lock lives there. */
(function () {
  var OPEN = ["alphabet-find", "hindi-find", "count", "hot-cold", "shape-find", "animal-find", "bird-find", "flower-find",
    "vehicle-find", "scene-brush", "greetings", "body-explore", "odd", "build-house", "word-animals", "electronics",
    "solar-system", "shadow-match", "fruit-find", "story-rabbit"];
  var total = Object.keys(Kido.catalog.activities).length;

  function locked(id) { return OPEN.indexOf(id) < 0; }

  var play = Kido.screens.play;
  Kido.screens.play = function (id, opts) {
    if (!locked(id)) return play.call(Kido.screens, id, opts);
    Kido.fx.toast("🔒 Locked in this demo: " + OPEN.length + " of " + total + " activities are open");
  };

  // Today's Adventure strings several (mostly locked) activities together: the home button offers the first world instead
  if (Kido.adventure) Kido.adventure.pill = function () { return null; };

  var css = document.createElement("style");
  css.textContent =
    ".cat-tile.is-demo-locked .cat-tile__preview{filter:grayscale(1) opacity(.55)}" +
    ".cat-tile.is-demo-locked .cat-tile__badge,.cat-tile.is-demo-locked .cat-tile__play-btn{visibility:hidden}" +
    ".cat-tile.is-demo-locked{position:relative}" +
    ".cat-tile.is-demo-locked::after{content:'🔒';position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);" +
    "font-size:2.4rem;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));pointer-events:none}";
  document.head.appendChild(css);

  // grey out and lock the shelf tiles of locked activities (tiles carry "cat-tile--<id>")
  function mark(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".cat-tile:not(.is-demo-checked)"), function (t) {
      t.classList.add("is-demo-checked");
      // the activity id is the LAST cat-tile--x class (the first is the theme, and "electronics" is both)
      var m = (t.className.match(/cat-tile--([\w-]+)/g) || []).map(function (c) { return c.slice(10); })
        .filter(function (id) { return Kido.catalog.get(id); }).pop();
      if (m && locked(m)) { t.classList.add("is-demo-locked"); t.setAttribute("aria-label", t.getAttribute("aria-label") + " (locked in demo)"); }
    });
  }
  new MutationObserver(function () { mark(document); }).observe(document.body, { childList: true, subtree: true });
  mark(document);
})();
