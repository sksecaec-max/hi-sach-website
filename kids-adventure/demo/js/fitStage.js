/* fitStage.js — 2026-11-07 (owner): small pictures and boxes left a big screen mostly empty on the tablet and phone.
   While a game is open, the play area (the game's main block under the top bar) is measured: if what is actually drawn
   (pictures, cards, boxes, words) fills only part of the free space, the block is scaled up and centred to fill it.
   Never scales down. Pointer hit-tests use getBoundingClientRect / elementFromPoint, which follow the transform. */
(function (window, document) {
  "use strict";
  var screenEl, timer = 0, MAX = 2.2, MIN_GAIN = 1.12, ro = null, watched = null;

  function visible(e, r) {
    if (r.width < 2 || r.height < 2) return false;
    var cs = getComputedStyle(e);
    // opacity is ignored on purpose: answers that fade in are still part of the layout
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.position !== "fixed";
  }
  function drawn(e, cs) {
    if (/^(IMG|CANVAS|VIDEO|svg|BUTTON|INPUT)$/.test(e.tagName)) return true;
    var bg = cs.backgroundColor;
    return (bg && bg !== "transparent" && !/rgba\(.*,\s*0\)$/.test(bg)) || cs.backgroundImage !== "none" ||
      parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== "none";
  }
  // the union of everything drawn inside the block, ignoring backdrops that already fill the free space
  function contentBox(block, avail) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    function add(r) { x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
    var all = block.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest("svg") && e.tagName !== "svg") continue;
      var r = e.getBoundingClientRect();
      if (!visible(e, r)) continue;
      if (r.width >= avail.w * 0.92 && r.height >= avail.h * 0.8) continue;   // a backdrop, not content
      if (drawn(e, getComputedStyle(e))) add(r);
    }
    var tw = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), t, rg = document.createRange();
    while ((t = tw.nextNode())) {
      if (!t.data.trim() || (t.parentElement && t.parentElement.closest("svg"))) continue;
      rg.selectNodeContents(t); var tr = rg.getBoundingClientRect();
      if (tr.width > 1 && tr.height > 1 && visible(t.parentElement, tr)) add(tr);
    }
    return x1 > x0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
  }
  function mainBlock(game) {
    var best = null, area = 0;
    Array.prototype.forEach.call(game.children, function (c) {
      var cs = getComputedStyle(c);
      if (cs.position === "fixed" || cs.position === "absolute" || c.classList.contains("game__head")) return;
      var r = c.getBoundingClientRect();
      if (r.width * r.height > area) { area = r.width * r.height; best = c; }
    });
    return best;
  }
  function fit() {
    timer = 0;
    if (!document.body.classList.contains("in-gameplay") || !screenEl) return;
    // only games are fitted: the result screen ("Well done!") has its own layout — scaling it put the stars over its buttons
    var cur = window.Kido && Kido.nav && Kido.nav.current && Kido.nav.current();
    if (cur && cur.name === "result") { var f = screenEl.querySelector("[data-fit]"); if (f) { f.style.transform = ""; f.removeAttribute("data-fit"); } return; }
    var game = screenEl.firstElementChild; if (!game) return;
    // QA 2026-11-10: only the standard game shell is fitted. Discoveries (.kd), fruit games and other screens with their
    // own full-screen layout were being scaled too (a discovery title ran off the phone screen at 1.8x).
    if (!game.classList.contains("game")) return;
    var block = mainBlock(game); if (!block || block.closest(".no-autofit") || block.querySelector(".no-autofit")) return;
    // QA 2026-11-11: a board that grows in after the first fit (Think Lab puzzles) never re-fitted when animations ran
    // instantly, and was left 2.2x too big, off the screen. Its size changes now re-fit it (our transform is not a size change).
    if (watched !== block) {
      watched = block;
      if (ro) { ro.disconnect(); ro.observe(block); Array.prototype.forEach.call(block.children, function (k) { ro.observe(k); }); }
      soon(450); return;     // a new game is still building (rows grow in): measure once it has settled, so it never jumps
    }
    block.style.transform = "";
    var sr = screenEl.getBoundingClientRect(), head = game.querySelector(".game__head"), top = sr.top + 64;
    if (head && getComputedStyle(head).position === "fixed") top = Math.max(sr.top, head.getBoundingClientRect().bottom);
    var avail = { x: sr.left + 8, y: top + 4, w: sr.width - 16, h: sr.bottom - top - 12 };
    var c = avail.h > 80 ? contentBox(block, avail) : null;
    var s = c ? Math.min(MAX, (avail.w * 0.94) / c.w, (avail.h * 0.94) / c.h) : 1;
    if (s < MIN_GAIN) { block.removeAttribute("data-fit"); return; }
    var br = block.getBoundingClientRect();
    function apply(k) {
      var tx = avail.x + avail.w / 2 - br.left - k * (c.x + c.w / 2 - br.left);
      var ty = avail.y + avail.h / 2 - br.top - k * (c.y + c.h / 2 - br.top);
      block.style.transformOrigin = "0 0";
      block.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + k.toFixed(3) + ")";
    }
    apply(s);
    // safety: everything drawn must stay on screen; if it does not (something was still animating in), shrink to fit
    var c2 = contentBox(block, avail), u = c2 && { x0: c2.x, y0: c2.y, x1: c2.x + c2.w, y1: c2.y + c2.h };
    if (u && (u.x0 < avail.x - 4 || u.y0 < avail.y - 4 || u.x1 > avail.x + avail.w + 4 || u.y1 > avail.y + avail.h + 4)) {
      s = s * Math.min(avail.w / (u.x1 - u.x0), avail.h / (u.y1 - u.y0), 1) * 0.96;
      if (s < MIN_GAIN) { block.style.transform = ""; block.removeAttribute("data-fit"); return; }
      apply(s);
    }
    block.setAttribute("data-fit", s.toFixed(2));
  }
  function soon(ms) { clearTimeout(timer); timer = setTimeout(fit, ms || 160); }

  document.addEventListener("DOMContentLoaded", function () {
    screenEl = document.getElementById("screen"); if (!screenEl) return;
    if (window.ResizeObserver) ro = new ResizeObserver(function () { soon(); });
    // content changes (a new round, a filled box) re-measure; our own style writes are not observed
    new MutationObserver(function () { soon(); }).observe(screenEl, { childList: true, subtree: true });
    screenEl.addEventListener("load", function () { soon(); }, true);    // pictures that arrive late
    screenEl.addEventListener("animationend", function () { soon(); }, true);
    screenEl.addEventListener("transitionend", function (e) { if (e.propertyName === "transform" || e.propertyName === "opacity") soon(); }, true);
    window.addEventListener("resize", function () { soon(250); });
    new MutationObserver(function () { soon(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  });
  window.Kido = window.Kido || {};
  window.Kido.fitStage = fit;
})(window, document);
